/* ==========================================================================
 * ARQUIVO: src/mod-input/input-orquestrador-mouse.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-INPUT — Orquestrador Desacoplado de Botões do Mouse (4/5, Meio e Direito)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-orquestrador-mouse.js
 * - Classe Exportada: InputOrquestradorMouse (window.JusGovInputOrquestradorMouse)
 * - Herança: extends BaseModulo (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovInputOrquestradorMouse.NULL_OBJECT
 * - Métodos Públicos:
 *     aplicarConfig(cfg), tratarBotoesLaterais4e5(e), tratarMouseDownBotaoMeio(e, elAlvoEfetivo),
 *     tratarMouseUpBotaoMeio(e), tratarAuxClick(e), tratarContextMenuColagem(e), destruir()
 * - Regras / Seções: ENG-00 (Prioridade -1), ARQ-10 (Grupo A — Desacoplamento Total de Mouse),
 *   BUG-122, BUG-123, BUG-128
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) SEPARAÇÃO DE DOMÍNIO (ARQ-10 / GRUPO A):
 *    Concentra em `src/mod-input/` toda a lógica de botões laterais 4 e 5, botão do meio
 *    (`button === 1` em mousedown/mouseup/auxclick) e colagem opcional por botão direito,
 *    comunicando-se com `mod-colar` exclusivamente via injeção de dependências (`deps`).
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovInputOrquestradorMouse = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseModulo === 'function')
        ? gGlobal.JusGovBaseModulo
        : class { aplicarConfig() { return true; } destruir() { return true; } };

    const NULL_ORQ_MOUSE = Object.freeze({
        aplicarConfig: () => false,
        tratarBotoesLaterais4e5: () => false,
        tratarMouseDownBotaoMeio: () => false,
        tratarMouseUpBotaoMeio: () => false,
        tratarAuxClick: () => false,
        tratarContextMenuColagem: () => false,
        destruir: () => true
    });

    class InputOrquestradorMouse extends BasePai {
        #capturaBotoes4e5Ativa = false;
        #colarBotaoMeioAtivo = true;
        #colagemBotaoDireitoAtiva = false;
        #pendenciaBotaoMeio = null;
        #ultimoCliqueDireitoTs = 0;
        #timerCliqueDireito = null;
        #deps = {};

        constructor(deps = {}) {
            super('InputOrquestradorMouse');
            this.#deps = deps && typeof deps === 'object' ? deps : {};
        }

        static get NULL_OBJECT() {
            return NULL_ORQ_MOUSE;
        }

        aplicarConfig(cfg = {}) {
            if (!cfg || typeof cfg !== 'object') return false;
            if (cfg.capturaBotoesMouse4e5Ativa !== undefined) {
                this.#capturaBotoes4e5Ativa = Boolean(cfg.capturaBotoesMouse4e5Ativa);
            }
            if (cfg.colarBotaoMeioAtivo !== undefined) {
                this.#colarBotaoMeioAtivo = Boolean(cfg.colarBotaoMeioAtivo);
            }
            if (cfg.colagemBotaoDireitoAtiva !== undefined) {
                this.#colagemBotaoDireitoAtiva = Boolean(cfg.colagemBotaoDireitoAtiva);
            }
            return true;
        }

        tratarBotoesLaterais4e5(e) {
            if (!this.#capturaBotoes4e5Ativa) return false;
            const modInput = (typeof this.#deps.obterFachadaInput === 'function' ? this.#deps.obterFachadaInput() : null)
                || (typeof window !== 'undefined' && (window.JusGovInstanciaInput || window.JusGovModuloInputInstancia))
                || null;
            if (modInput && modInput.botoesLaterais && typeof modInput.botoesLaterais.processarEventoMouse === 'function') {
                modInput.botoesLaterais.ativo = true;
                return modInput.botoesLaterais.processarEventoMouse(e);
            }
            const bLaterais = (typeof window !== 'undefined' && window.JusGovBotoesLateraisMouseInstancia) ? window.JusGovBotoesLateraisMouseInstancia : null;
            if (bLaterais && typeof bLaterais.processarEventoMouse === 'function') {
                bLaterais.ativo = true;
                return bLaterais.processarEventoMouse(e);
            }
            return false;
        }

        tratarMouseDownBotaoMeio(e, elAlvoEfetivo) {
            if (!e || e.button !== 1) return false;
            if (e.__jusgovBotaoMeioDownProcessado) return true;
            const elLinkMeio = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? elAlvoEfetivo.closest('a[href]')
                : null;
            if (elLinkMeio) return true;
            if (!this.#colarBotaoMeioAtivo) return true;

            try { e.__jusgovBotaoMeioDownProcessado = true; } catch (_) { }
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

            const alvoEditavelMeio = (typeof this.#deps.resolverAlvoEditavel === 'function')
                ? this.#deps.resolverAlvoEditavel(elAlvoEfetivo)
                : null;
            if (alvoEditavelMeio || e.altKey) {
                const alvoCapturado = alvoEditavelMeio || elAlvoEfetivo;
                const shiftAtivoMeio = Boolean(e.shiftKey);
                this.#pendenciaBotaoMeio = {
                    alvo: alvoCapturado,
                    alvoBruto: elAlvoEfetivo,
                    comAlt: Boolean(e.altKey),
                    usarAnterior: Boolean(e.ctrlKey),
                    aplicarFiltroShift: Boolean(shiftAtivoMeio && !e.altKey),
                    forcarSomenteTexto: shiftAtivoMeio,
                    modo: shiftAtivoMeio ? 'texto_puro' : 'normal',
                    clientX: e.clientX,
                    clientY: e.clientY,
                    timestamp: Date.now(),
                    concluida: false
                };
                if (e.altKey && typeof this.#deps.ativarComponenteParaColagem === 'function') {
                    this.#deps.ativarComponenteParaColagem(elAlvoEfetivo || alvoCapturado, alvoEditavelMeio);
                } else if (typeof this.#deps.focarElementoSeguro === 'function') {
                    this.#deps.focarElementoSeguro(alvoCapturado);
                }
            } else {
                this.#pendenciaBotaoMeio = null;
            }
            return true;
        }

        tratarMouseUpBotaoMeio(e) {
            if (!e || e.button !== 1) return false;
            if (e.__jusgovBotaoMeioUpProcessado) return true;
            if (this.#pendenciaBotaoMeio && !this.#pendenciaBotaoMeio.concluida) {
                try { e.__jusgovBotaoMeioUpProcessado = true; } catch (_) { }
                const pend = this.#pendenciaBotaoMeio;
                pend.concluida = true;
                pend.concluidaTs = Date.now();
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

                const docAlvoPend = (pend.alvo && pend.alvo.ownerDocument) ? pend.alvo.ownerDocument : document;
                const opcoesColagemPend = {
                    aplicarFiltroShift: Boolean(pend.aplicarFiltroShift),
                    forcarSomenteTexto: Boolean(pend.forcarSomenteTexto),
                    ignorarDebounce: Boolean(e && e.isTrusted === false),
                    clientX: pend.clientX,
                    clientY: pend.clientY
                };
                const executar = () => {
                    if (pend.comAlt && typeof this.#deps.confirmarFocarEColarBotaoMeio === 'function') {
                        this.#deps.confirmarFocarEColarBotaoMeio(pend.alvo, pend.modo, pend.usarAnterior, pend.clientX, pend.clientY, docAlvoPend, pend.alvoBruto, opcoesColagemPend);
                    } else if (typeof this.#deps.executarColagem === 'function') {
                        try { this.#deps.executarColagem(pend.alvo, pend.modo, pend.usarAnterior, opcoesColagemPend); } catch (_) { }
                    }
                };
                if (pend.comAlt) setTimeout(executar, 250);
                else executar();
            }
            return true;
        }

        tratarAuxClick(e) {
            if (!e) return false;
            if (this.#capturaBotoes4e5Ativa) {
                this.tratarBotoesLaterais4e5(e);
            }
            if (e.button !== 1) return false;

            const elLinkMeio = (e.target && typeof e.target.closest === 'function') ? e.target.closest('a[href]') : null;
            if (elLinkMeio) return true;
            if (!this.#colarBotaoMeioAtivo) return true;

            if (this.#pendenciaBotaoMeio && this.#pendenciaBotaoMeio.concluida) {
                this.#pendenciaBotaoMeio = null;
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                return true;
            }

            if (e.__jusgovBotaoMeioAuxProcessado) return true;
            try { e.__jusgovBotaoMeioAuxProcessado = true; } catch (_) { }
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

            const alvoEditavelAux = (typeof this.#deps.resolverAlvoEditavel === 'function')
                ? this.#deps.resolverAlvoEditavel(e.target)
                : null;
            if (alvoEditavelAux || e.altKey) {
                const usarAnt = Boolean(e.ctrlKey);
                const shiftAtivoAux = Boolean(e.shiftKey);
                const opcoesAux = {
                    aplicarFiltroShift: Boolean(shiftAtivoAux && !e.altKey),
                    forcarSomenteTexto: shiftAtivoAux,
                    ignorarDebounce: Boolean(e && e.isTrusted === false),
                    clientX: e.clientX,
                    clientY: e.clientY
                };
                const modoAux = shiftAtivoAux ? 'texto_puro' : 'normal';
                const alvoCap = alvoEditavelAux || e.target;
                const docAlvoAux = (alvoCap && alvoCap.ownerDocument) ? alvoCap.ownerDocument : document;
                if (e.altKey) {
                    if (typeof this.#deps.ativarComponenteParaColagem === 'function') {
                        this.#deps.ativarComponenteParaColagem(e.target, alvoEditavelAux);
                    }
                    setTimeout(() => {
                        if (typeof this.#deps.confirmarFocarEColarBotaoMeio === 'function') {
                            this.#deps.confirmarFocarEColarBotaoMeio(alvoCap, modoAux, usarAnt, e.clientX, e.clientY, docAlvoAux, e.target, opcoesAux);
                        }
                    }, 250);
                } else if (alvoEditavelAux && typeof this.#deps.executarColagem === 'function') {
                    try { this.#deps.executarColagem(alvoEditavelAux, modoAux, usarAnt, opcoesAux); } catch (_) { }
                }
            }
            return true;
        }

        tratarContextMenuColagem(e) {
            if (!e) return false;
            if (e.ctrlKey && e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                return true;
            }
            const ehAmbienteOpcoes = (typeof location !== 'undefined' && (location.protocol === 'chrome-extension:' || (location.pathname && location.pathname.includes('options.html'))));
            if (ehAmbienteOpcoes && (!e.target || typeof e.target.closest !== 'function' || !e.target.closest('.editable-demo, #textareaMinutasDemo, #editorHtmlOnlineDemo, #demoInputAlternancia, .linha-campos-entrada, input, textarea, [contenteditable]'))) {
                return false;
            }
            if (!this.#colarBotaoMeioAtivo || !this.#colagemBotaoDireitoAtiva || e.shiftKey) return false;

            const tipoContexto = (typeof this.#deps.classificarContexto === 'function')
                ? this.#deps.classificarContexto(e.target)
                : '';
            if (tipoContexto !== 'CAMPO_SIMPLES_EDITAVEL' && tipoContexto !== 'EDITOR_MULTILINHA_EDITAVEL') return false;

            e.preventDefault();
            e.stopPropagation();

            const alvo = (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL')
                ? ((e.target && typeof e.target.closest === 'function') ? (e.target.closest('input') || e.target) : e.target)
                : e.target;

            const agora = Date.now();
            const diff = agora - this.#ultimoCliqueDireitoTs;
            this.#ultimoCliqueDireitoTs = agora;
            const colarAnterior = Boolean(e.ctrlKey && !e.altKey && !e.shiftKey);

            if (diff < 350 && this.#timerCliqueDireito) {
                clearTimeout(this.#timerCliqueDireito);
                this.#timerCliqueDireito = null;
                if (typeof this.#deps.executarColagem === 'function') {
                    this.#deps.executarColagem(alvo, 'texto_puro', colarAnterior);
                }
            } else {
                if (this.#timerCliqueDireito) clearTimeout(this.#timerCliqueDireito);
                this.#timerCliqueDireito = setTimeout(() => {
                    this.#timerCliqueDireito = null;
                    if (typeof this.#deps.executarColagem === 'function') {
                        this.#deps.executarColagem(alvo, 'normal', colarAnterior);
                    }
                }, 300);
            }
            return true;
        }

        destruir() {
            if (this.#timerCliqueDireito) {
                clearTimeout(this.#timerCliqueDireito);
                this.#timerCliqueDireito = null;
            }
            this.#pendenciaBotaoMeio = null;
            return super.destruir();
        }
    }

    Object.freeze(InputOrquestradorMouse.prototype);
    return Object.freeze(InputOrquestradorMouse);
}));
