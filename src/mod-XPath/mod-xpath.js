/* ==========================================================================
 * ARQUIVO: src/mod-XPath/mod-xpath.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-XPATH — Fachada Global de Mapeamento Manual Avançado (XPath / CSS)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-XPath/mod-xpath.js
 * - Classe Exportada: ModuloXPath (window.JusGovModuloXPath)
 * - Null Objects: ModuloXPath.NULL_OBJECTS
 * - Métodos Públicos:
 *     obterRegrasEInspetor(), obterDialogo(), tratarMouseMoveGlobal(e),
 *     tratarMouseDownGlobal(e, deps), executarInspecaoECapturaSeletorUnico(el, deps),
 *     ocultarInspetorTempoReal(ignorarOrigemId), notificarOutrosFramesOcultarInspetor()
 * - Regras / Seções: ENG-00 (Prioridade -1), ENG-01 (Fachada + Null Object),
 *   ENG-02 (Módulo Independente src/mod-XPath/), FEAT-102 (Seção 6.260)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) MÓDULO GLOBAL INDEPENDENTE:
 *    Agrega `xpath-regras-inspetor.js` e `xpath-dialogo.js` em uma única fachada
 *    consumida externamente por `mod-copia` e qualquer outro módulo.
 * 2) PARIDADE ABSOLUTA ENTRE HOVER E CLIQUE (`Ctrl+Alt+Shift`):
 *    `tratarMouseDownGlobal(e, deps)` dispara no mesmo escopo global livre de
 *    `tratarMouseMoveGlobal(e)` (sem barreira de `verificarUrlPermitida()`), já no
 *    `mousedown`, usando o último elemento válido inspecionado caso o clique atinja
 *    o próprio cartão `#jusgov-inspetor-tempo-real`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloXPath = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NULL_REGRAS_INSPETOR = Object.freeze({
        carregarRegrasInternas: () => { },
        definirRegrasUsuario: () => { },
        obterRegrasUsuario: () => [],
        definirRegrasInternas: () => { },
        adicionarRegrasUsuario: () => [],
        limparCache: () => { },
        obterClassificacaoRegraCustomizada: () => null,
        obterDiagnosticoElemento: () => ({ tipo: 'textual', origem: 'padrao', resumo: '' }),
        ocultarInspetorTempoReal: () => { },
        notificarOutrosFramesOcultarInspetor: () => { },
        atualizarInspetorTempoReal: () => { },
        temPainelInspetorVisivel: () => false,
        obterIdFrameInspetor: () => 'null_frame',
        obterUltimoAlvoValidoInspecionado: () => null
    });

    const NULL_DIALOGO = Object.freeze({
        extrairCaminhoXPathAbsoluto: () => '',
        extrairCaminhoXPathRelativo: () => '',
        extrairSeletorCssSimplificado: () => '',
        extrairSeletorCssSimples: () => '',
        extrairSeletorCss2: () => '',
        fecharModal: () => { },
        abrirModal: () => { },
        executarInspecaoECapturaSeletorUnico: () => null
    });

    class ModuloXPath {
        #regrasEInspetor;
        #dialogo;

        constructor(opcoes = {}) {
            const g = (typeof window !== 'undefined') ? window : ((typeof self !== 'undefined') ? self : {});
            if (opcoes && opcoes.regrasEInspetor) {
                this.#regrasEInspetor = opcoes.regrasEInspetor;
            } else if (typeof g.JusGovRegrasEInspetor === 'function') {
                this.#regrasEInspetor = new g.JusGovRegrasEInspetor({
                    ehCampoEditavel: (opcoes && typeof opcoes.ehCampoEditavel === 'function') ? opcoes.ehCampoEditavel : (() => false)
                });
            } else {
                this.#regrasEInspetor = NULL_REGRAS_INSPETOR;
            }

            if (opcoes && opcoes.dialogo) {
                this.#dialogo = opcoes.dialogo;
            } else if (typeof g.JusGovDialogoMapeamentoRegra === 'function') {
                this.#dialogo = new g.JusGovDialogoMapeamentoRegra();
            } else {
                this.#dialogo = NULL_DIALOGO;
            }
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                NULL_REGRAS_INSPETOR,
                NULL_DIALOGO
            });
        }

        obterRegrasEInspetor() {
            return this.#regrasEInspetor;
        }

        obterDialogo() {
            return this.#dialogo;
        }

        tratarMouseMoveGlobal(e) {
            if (!e) return false;
            try {
                if (e.ctrlKey && e.altKey && e.shiftKey) {
                    this.#regrasEInspetor.atualizarInspetorTempoReal(e.clientX, e.clientY, e.target);
                    return true;
                }
                if (this.#regrasEInspetor.temPainelInspetorVisivel()) {
                    this.#regrasEInspetor.ocultarInspetorTempoReal();
                }
            } catch (_) { }
            return false;
        }

        /**
         * Dispara o Mapeamento Manual Avançado (XPath / CSS) globalmente já no `mousedown`,
         * no mesmo contexto livre onde `Ctrl+Alt+Shift + arrastar/mover` sempre funciona.
         */
        tratarMouseDownGlobal(e, deps = {}) {
            if (!e) return false;
            const ehAtalhoCliqueEsq = Boolean(e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey);
            if (!ehAtalhoCliqueEsq) return false;
            try {
                if (e.__jusgovXPathAberto) return true;
                e.__jusgovXPathAberto = true;
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') {
                    e.stopImmediatePropagation();
                }

                let alvo = (deps && typeof deps.resolverAlvo === 'function') ? deps.resolverAlvo(e) : e.target;
                if (alvo && alvo.nodeType === 3) alvo = alvo.parentElement;
                const acertouInspetor = Boolean(
                    alvo && typeof alvo.closest === 'function' &&
                    (alvo.closest('#jusgov-inspetor-tempo-real') || alvo.closest('[data-jusgov-inspetor="true"]'))
                );
                if (acertouInspetor || !alvo) {
                    const salvo = this.#regrasEInspetor.obterUltimoAlvoValidoInspecionado();
                    if (salvo) alvo = salvo;
                }

                this.#regrasEInspetor.ocultarInspetorTempoReal();
                this.#regrasEInspetor.notificarOutrosFramesOcultarInspetor();

                if (alvo) {
                    this.#dialogo.executarInspecaoECapturaSeletorUnico(alvo, deps);
                }
                return true;
            } catch (_) {
                return false;
            }
        }

        executarInspecaoECapturaSeletorUnico(el, deps = {}) {
            try {
                this.#regrasEInspetor.ocultarInspetorTempoReal();
                this.#regrasEInspetor.notificarOutrosFramesOcultarInspetor();
                return this.#dialogo.executarInspecaoECapturaSeletorUnico(el, deps);
            } catch (_) {
                return null;
            }
        }

        ocultarInspetorTempoReal(ignorarOrigemId = null) {
            return this.#regrasEInspetor.ocultarInspetorTempoReal(ignorarOrigemId);
        }

        notificarOutrosFramesOcultarInspetor() {
            return this.#regrasEInspetor.notificarOutrosFramesOcultarInspetor();
        }
    }

    Object.freeze(ModuloXPath.prototype);
    return Object.freeze(ModuloXPath);
}));
