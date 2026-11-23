/* ==========================================================================
 * ARQUIVO: src/mod-colar/mod-colar.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COLAR — Motor Independente de Colagem Blindada (Fachada)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-colar/mod-colar.js
 * - Classe Exportada: GerenciadorColagem (window.JusGovModuloColar / alias window.JusGovModuloColagem)
 * - Null Object: JusGovModuloColar.NULL_OBJECT (e JusGovModuloColagem.NULL_OBJECT)
 * - Métodos Públicos:
 *     aplicarFiltroShiftParaColagem(texto, modoShiftCnj),
 *     resolverAlvoEditavel(el), focarElementoSeguro(el),
 *     ativarComponenteParaColagem(alvo, alvoFoco, opcoes),
 *     confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX, clientY, docContext, alvoBruto, opcoesColagem),
 *     executarColagem(alvo, modo, usarAnterior, opcoesColagem),
 *     executarColagemBotaoDireito(alvo, modo, usarAnterior, opcoesColagem),
 *     inserirTextoEmElemento(alvo, texto, ehHtmlFormatado),
 *     emularTeclasColar(alvo, texto, html), emularTeclasWinV(alvo),
 *     confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota)
 * - Regras / Seções: ARQ-08 (Separação exclusiva da funcionalidade de Colar em src/mod-copia/),
 *   FEAT-65 (Botão do Meio + Shift com filtro idêntico a Copiar + Shift; Alt+Shift somente texto),
 *   BLIND-01 / Anti-Loop (trava reentrante __JUSGOV_COLAGEM_EM_ANDAMENTO__ e debounce de disparo).
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) SEPARAÇÃO DE RESPONSABILIDADE (ARQ-08): Concentra 100% da lógica de resolução de alvo
 *    editável, ativação por Alt, filtragem Shift (CNJ/Datas/CPF/CNPJ/números) na colagem,
 *    inserção DOM em <input>/<textarea>/[contenteditable] e marcação visual de colagem.
 * 2) BLINDAGEM ANTI-LOOP: Mantém guarda reentrante em instância + marcação temporal global
 *    para impedir que eventos sintéticos (`input`, `change`, `paste`, `focusin`) disparem
 *    recursivamente novas colagens ou autoseleções infinitas.
 * 3) PADRÃO DE FILTRO SHIFT NA COLAGEM (FEAT-65): Quando `aplicarFiltroShift === true`, aplica
 *    a mesma regra de extração numérica/zero-pad CNJ (`modoShiftCnj`) usada na cópia com Shift
 *    e força inserção em modo `texto_puro`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const cls = fabrica();
        raiz.JusGovModuloColar = cls;
        raiz.JusGovModuloColagem = cls;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const INTERVALO_DEBOUNCE_COLAGEM_MS = 120;

    function obterConstantesGlobais() {
        const g = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : null);
        return (g && g.JusGovConstantes) ? g.JusGovConstantes : null;
    }

    const NIVEL_CLIPBOARD_INDICE = Object.freeze({
        texto_puro: 0,
        somente_texto: 0,
        basico: 1,
        intermediario: 2,
        avancado: 3,
        estendido: 4,
        sem_filtro: 4
    });
    const NOMES_NIVEL_CLIPBOARD = Object.freeze(['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido']);

    const NULL_COLAGEM = Object.freeze({
        aplicarFiltroShiftParaColagem: (txt) => String(txt || ''),
        resolverAlvoEditavel: () => null,
        focarElementoSeguro: () => false,
        ativarComponenteParaColagem: () => false,
        confirmarFocarEColarBotaoMeio: async () => false,
        executarColagem: async () => false,
        executarColagemBotaoDireito: async () => false,
        inserirTextoEmElemento: () => false,
        emularTeclasColar: () => false,
        emularTeclasWinV: () => false,
        confirmarColagemGlobalEMarcarPermanente: () => null,
        obterNivelEFormatosParaColagem: () => ({ texto: '', html: '', formatado: false, nivelCopia: 'texto_puro', nivelIdx: 0, formatosExtras: null, tiposClipboard: ['text/plain'] })
    });

    class GerenciadorColagem {
        _p_colagemEmAndamento = false;
        _p_ultimoDisparoColagemTs = 0;
        _p_ultimoTextoConfirmadoGlobal = '';
        _p_ultimoTsConfirmadoGlobal = 0;
        _p_deps = {
            obterEstadoOpcoes: () => ({ manterFormatacaoBasica: false, nivelFiltroFormatacao: 'basico', ultimoTextoLimpo: '', modoShiftCnj: '20digitos', selecaoEditavelAtiva: true }),
            classificarContextoElementoAlvo: null,
            confirmarVisualMarcador: () => null,
            selecionarTudoAoEntrarNoInput: null
        };

        constructor(opcoes = {}) {
            this.configurarDependencias(opcoes);
        }

        static get NULL_OBJECT() {
            return NULL_COLAGEM;
        }

        configurarDependencias(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            Object.keys(this._p_deps).forEach((k) => {
                if (typeof opcoes[k] === 'function') {
                    this._p_deps[k] = opcoes[k];
                }
            });
        }

        /**
         * Resolve o hospedeiro editável mais próximo para colagem segura.
         * @param {Node|Element} el
         * @returns {Element|null}
         */
        resolverAlvoEditavel(el) {
            if (!el) return null;
            const cur = (el.nodeType === 3) ? el.parentElement : el;
            if (!cur || cur.nodeType !== 1) return null;
            const classificar = this._p_deps.classificarContextoElementoAlvo;

            if (typeof cur.closest === 'function') {
                const campoDireto = cur.closest('input, textarea, rich-textarea');
                if (campoDireto) {
                    if (typeof classificar === 'function') {
                        if (classificar(campoDireto) === 'CAMPO_SIMPLES_EDITAVEL') return campoDireto;
                    } else if (!campoDireto.disabled && !campoDireto.readOnly) {
                        return campoDireto;
                    }
                }
                const ceHost = cur.closest('[contenteditable], .cke_editable, .ck-editor__editable, .ck-content, .tox-edit-area');
                if (ceHost) {
                    const attrCe = (typeof ceHost.getAttribute === 'function') ? ceHost.getAttribute('contenteditable') : null;
                    if (attrCe === null || attrCe.toLowerCase() !== 'false') {
                        if (typeof classificar !== 'function' || classificar(ceHost) !== 'LINK_CLICAVEL') {
                            return ceHost;
                        }
                    }
                }
            }

            if (typeof classificar === 'function') {
                const ctx = classificar(cur);
                if (ctx === 'CAMPO_SIMPLES_EDITAVEL' || ctx === 'EDITOR_MULTILINHA_EDITAVEL') {
                    return cur;
                }
            } else if ((cur.tagName === 'INPUT' || cur.tagName === 'TEXTAREA') && !cur.disabled && !cur.readOnly) {
                return cur;
            }
            return null;
        }

        focarElementoSeguro(el) {
            if (!el || typeof el.focus !== 'function') return false;
            try {
                el.focus({ preventScroll: true });
                return true;
            } catch (_) {
                try {
                    el.focus();
                    return true;
                } catch (__) {
                    return false;
                }
            }
        }

        ativarComponenteParaColagem(alvo, alvoFoco = null, opcoes = {}) {
            const alvoParaClicar = alvo || alvoFoco;
            const alvoParaFocar = alvoFoco || this.resolverAlvoEditavel(alvoParaClicar) || alvoParaClicar;
            if (!alvoParaClicar) return false;

            this.focarElementoSeguro(alvoParaFocar);
            try {
                const evBase = { bubbles: true, cancelable: true, button: 0 };
                if (typeof PointerEvent === 'function') {
                    alvoParaClicar.dispatchEvent(new PointerEvent('pointerdown', evBase));
                }
                alvoParaClicar.dispatchEvent(new MouseEvent('mousedown', evBase));
                alvoParaClicar.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
                if (typeof PointerEvent === 'function') {
                    alvoParaClicar.dispatchEvent(new PointerEvent('pointerup', evBase));
                }
                alvoParaClicar.dispatchEvent(new MouseEvent('mouseup', evBase));
                if (typeof alvoParaClicar.click === 'function') alvoParaClicar.click();
            } catch (_) { }

            this.focarElementoSeguro(alvoParaFocar);
            const estado = this._p_deps.obterEstadoOpcoes() || {};
            const selEditAtiva = opcoes.selecaoEditavelAtiva !== undefined
                ? Boolean(opcoes.selecaoEditavelAtiva)
                : Boolean(estado.selecaoEditavelAtiva !== false);
            if (selEditAtiva && alvoParaFocar && alvoParaFocar.tagName === 'INPUT' && typeof alvoParaFocar.select === 'function') {
                if (typeof this._p_deps.selecionarTudoAoEntrarNoInput === 'function') {
                    this._p_deps.selecionarTudoAoEntrarNoInput(alvoParaFocar, 10);
                } else {
                    setTimeout(() => {
                        try {
                            if (typeof alvoParaFocar.focus === 'function') alvoParaFocar.focus();
                            alvoParaFocar.select();
                        } catch (_) { }
                    }, 10);
                }
            }
            return true;
        }

        _p_ehElementoCKEditorOuIframeRico(alvo, docRef = null) {
            if (!alvo) return false;
            try {
                const doc = docRef || alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
                if (doc && (doc.designMode === 'on' || (doc.body && doc.body.classList && doc.body.classList.contains('cke_editable')))) {
                    return true;
                }
                if (alvo.tagName === 'BODY' && alvo.isContentEditable) return true;
                if (alvo.classList && (alvo.classList.contains('cke_editable') || alvo.classList.contains('ck-editor__editable') || alvo.classList.contains('ck-content'))) {
                    return true;
                }
                if (typeof alvo.closest === 'function' && alvo.closest('.cke_editable, .ck-editor__editable, .ck-content')) {
                    return true;
                }
            } catch (_) { }
            return false;
        }

        _p_obterBlocoEditavelInternoSeguro(raiz) {
            if (!raiz || typeof raiz.querySelectorAll !== 'function') return raiz;
            try {
                const ehRaizEstrutural = (
                    raiz.tagName === 'BODY' ||
                    (raiz.classList && (
                        raiz.classList.contains('cke_editable') ||
                        raiz.classList.contains('paginaA4') ||
                        raiz.classList.contains('conteudoPaginaA4')
                    ))
                );
                if (ehRaizEstrutural) {
                    const blocos = raiz.querySelectorAll('.conteudoPaginaA4 p, .conteudoPaginaA4 div:not(.paginaA4):not(.conteudoPaginaA4), p, div:not(.paginaA4):not(.conteudoPaginaA4)');
                    if (blocos && blocos.length > 0) {
                        return blocos[blocos.length - 1];
                    }
                }
            } catch (_) { }
            return raiz;
        }

        _p_posicionarCursorSeguroEmContentEditable(alvoFoco, docRef, winRef, clientX = null, clientY = null) {
            if (!alvoFoco || !winRef || typeof winRef.getSelection !== 'function' || !docRef || typeof docRef.createRange !== 'function') {
                return false;
            }
            try {
                const sel = winRef.getSelection();
                if (!sel) return false;

                const temCoordenadas = (typeof clientX === 'number' && typeof clientY === 'number' && !Number.isNaN(clientX) && !Number.isNaN(clientY));
                const selDentroDoAlvo = Boolean(sel.rangeCount > 0 && sel.anchorNode && alvoFoco.contains && alvoFoco.contains(sel.anchorNode));
                const temSelecaoAtivaNaoColapsada = Boolean(selDentroDoAlvo && !sel.isCollapsed);

                /* Se o usuario selecionou um trecho dentro do editor para substituir ao colar, preserva a selecao */
                if (temSelecaoAtivaNaoColapsada) {
                    return true;
                }

                let rangeAlvo = null;
                if (temCoordenadas && typeof docRef.caretRangeFromPoint === 'function') {
                    try {
                        const rPonto = docRef.caretRangeFromPoint(clientX, clientY);
                        if (rPonto && rPonto.startContainer && alvoFoco.contains && alvoFoco.contains(rPonto.startContainer)) {
                            rangeAlvo = rPonto;
                        }
                    } catch (_) { }
                }

                if (rangeAlvo) {
                    const noContainer = rangeAlvo.startContainer;
                    const ehContainerRaizCritico = Boolean(
                        noContainer && noContainer.nodeType === 1 && (
                            noContainer.tagName === 'BODY' ||
                            (noContainer.classList && (noContainer.classList.contains('paginaA4') || noContainer.classList.contains('conteudoPaginaA4')))
                        )
                    );
                    if (ehContainerRaizCritico) {
                        const filhos = noContainer.children;
                        const idxFilho = (filhos && filhos.length > 0)
                            ? Math.min(Math.max(0, rangeAlvo.startOffset - 1), filhos.length - 1)
                            : -1;
                        const candidato = (idxFilho >= 0 && filhos[idxFilho])
                            ? (this._p_obterBlocoEditavelInternoSeguro(filhos[idxFilho]) || filhos[idxFilho])
                            : this._p_obterBlocoEditavelInternoSeguro(alvoFoco);
                        if (candidato && candidato !== noContainer) {
                            const rBloco = docRef.createRange();
                            rBloco.selectNodeContents(candidato);
                            rBloco.collapse(false);
                            rangeAlvo = rBloco;
                        }
                    }
                    sel.removeAllRanges();
                    sel.addRange(rangeAlvo);
                    return true;
                }

                const ancoraEhBodyDireto = Boolean(
                    selDentroDoAlvo &&
                    sel.anchorNode &&
                    sel.anchorNode.nodeType === 1 &&
                    (sel.anchorNode.tagName === 'BODY' || (sel.anchorNode.classList && sel.anchorNode.classList.contains('paginaA4')))
                );
                if (!selDentroDoAlvo || ancoraEhBodyDireto) {
                    const blocoSeguro = this._p_obterBlocoEditavelInternoSeguro(alvoFoco) || alvoFoco;
                    const rangeFim = docRef.createRange();
                    rangeFim.selectNodeContents(blocoSeguro);
                    rangeFim.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(rangeFim);
                    return true;
                }
                return true;
            } catch (_) {
                return false;
            }
        }

        async confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX = null, clientY = null, docContext = null, alvoBruto = null, opcoesColagem = {}) {
            try {
                const docRef = (alvoInicial && alvoInicial.ownerDocument) ? alvoInicial.ownerDocument : (docContext || (typeof document !== 'undefined' ? document : null));
                let alvoConfirmado = this.resolverAlvoEditavel(alvoInicial);
                if (alvoConfirmado && alvoConfirmado.isConnected === false) {
                    alvoConfirmado = null;
                }
                if (!alvoConfirmado && docRef && docRef.activeElement) {
                    alvoConfirmado = this.resolverAlvoEditavel(docRef.activeElement);
                }
                const raizBusca = (alvoBruto && alvoBruto.isConnected !== false) ? alvoBruto : ((alvoInicial && alvoInicial.isConnected !== false) ? alvoInicial : null);
                if (!alvoConfirmado && raizBusca && typeof raizBusca.querySelector === 'function') {
                    const filhoEdit = raizBusca.querySelector('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [contenteditable]:not([contenteditable="false"])');
                    if (filhoEdit) alvoConfirmado = this.resolverAlvoEditavel(filhoEdit);
                }
                if (!alvoConfirmado) return false;

                this.focarElementoSeguro(alvoConfirmado);

                const ehCe = Boolean(
                    alvoConfirmado.tagName !== 'INPUT' &&
                    alvoConfirmado.tagName !== 'TEXTAREA' &&
                    (alvoConfirmado.isContentEditable || (typeof alvoConfirmado.closest === 'function' && alvoConfirmado.closest('[contenteditable]:not([contenteditable="false"])')))
                );
                const winRef = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
                if (ehCe) {
                    this._p_posicionarCursorSeguroEmContentEditable(alvoConfirmado, docRef, winRef, clientX, clientY);
                }

                const opcoesComCoords = { ...opcoesColagem, clientX, clientY };
                await this.executarColagem(alvoConfirmado, modo || 'normal', Boolean(usarAnterior), opcoesComCoords);
                return true;
            } catch (_) {
                return false;
            }
        }

        inserirTextoEmElemento(alvo, texto, ehHtmlFormatado, opcoesColagem = {}) {
            if (!alvo) return false;
            const docRef = alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const winRef = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
            const prevInternaWin = (typeof window !== 'undefined') ? Boolean(window.__JUSGOV_COLAGEM_INTERNA_ATIVA__) : false;
            const prevInternaSub = (winRef && winRef !== window) ? Boolean(winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__) : false;
            if (typeof window !== 'undefined') window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = true;
            if (winRef && winRef !== window) {
                try { winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = true; } catch (_) { }
            }
            try {
                const alvoFoco = (alvo.tagName !== 'INPUT' && alvo.tagName !== 'TEXTAREA' && typeof alvo.closest === 'function')
                    ? (alvo.closest('[contenteditable]:not([contenteditable="false"])') || alvo)
                    : alvo;
                this.focarElementoSeguro(alvoFoco);

                if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') {
                    const tipoInput = (alvo.getAttribute('type') || alvo.type || 'text').toLowerCase();
                    const ehTipoTemporal = ['date', 'datetime-local', 'month', 'week', 'time'].includes(tipoInput);

                    if (ehTipoTemporal) {
                        let valorData = (texto || '').trim();
                        if (tipoInput === 'date') {
                            const mDataBr = valorData.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
                            if (mDataBr) {
                                valorData = `${mDataBr[3]}-${mDataBr[2].padStart(2, '0')}-${mDataBr[1].padStart(2, '0')}`;
                            }
                        }
                        this._p_definirValorInputNativo(alvo, valorData);
                        try {
                            alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                            alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        } catch (_) { }
                        return true;
                    }

                    let start = null;
                    let end = null;
                    try {
                        start = (typeof alvo.selectionStart === 'number') ? alvo.selectionStart : null;
                        end = (typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : null;
                    } catch (_) { }

                    /* Prioridade nativa Blink (Desfazer Ctrl+Z preservado via execCommand 'insertText'):
                     * Comando antigo (mantido como fallback caso execCommand não seja suportado no tipo de input):
                     *   this._p_definirValorInputNativo(alvo, valAnt.substring(0, start) + texto + valAnt.substring(end));
                     *   alvo.setSelectionRange(novaPos, novaPos); / alvo.setRangeText(texto, start, end, 'end'); */
                    let inseriuViaExecCommand = false;
                    try {
                        if (docRef && typeof docRef.execCommand === 'function') {
                            inseriuViaExecCommand = Boolean(docRef.execCommand('insertText', false, texto));
                        }
                    } catch (_) { }

                    if (inseriuViaExecCommand) {
                        return true;
                    }

                    if (start !== null && end !== null) {
                        const valAnt = String(alvo.value || '');
                        const novoVal = valAnt.substring(0, start) + texto + valAnt.substring(end);
                        const novaPos = start + texto.length;
                        this._p_definirValorInputNativo(alvo, novoVal);
                        try {
                            if (typeof alvo.setSelectionRange === 'function') {
                                alvo.setSelectionRange(novaPos, novaPos);
                            } else {
                                alvo.selectionStart = alvo.selectionEnd = novaPos;
                            }
                        } catch (_) {
                            if (typeof alvo.setRangeText === 'function') {
                                try { alvo.setRangeText(texto, start, end, 'end'); } catch (__) { }
                            }
                        }
                    } else {
                        this._p_definirValorInputNativo(alvo, texto);
                    }

                    try {
                        const evInput = (typeof InputEvent === 'function')
                            ? new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertFromPaste', data: texto })
                            : new Event('input', { bubbles: true, composed: true });
                        alvo.dispatchEvent(evInput);
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                    return true;
                }

                const cx = (opcoesColagem && typeof opcoesColagem.clientX === 'number') ? opcoesColagem.clientX : null;
                const cy = (opcoesColagem && typeof opcoesColagem.clientY === 'number') ? opcoesColagem.clientY : null;
                this._p_posicionarCursorSeguroEmContentEditable(alvoFoco, docRef, winRef, cx, cy);

                const ehCkEditor = this._p_ehElementoCKEditorOuIframeRico(alvoFoco, docRef);
                const usarInsertHtml = Boolean(ehHtmlFormatado && !ehCkEditor);

                let executou = false;
                try {
                    if (docRef && typeof docRef.execCommand === 'function') {
                        executou = docRef.execCommand(usarInsertHtml ? 'insertHTML' : 'insertText', false, texto);
                    }
                } catch (_) { }

                if (!executou && winRef && typeof winRef.getSelection === 'function') {
                    const sel = winRef.getSelection();
                    if (sel && sel.rangeCount > 0 && docRef) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        if (usarInsertHtml && typeof range.createContextualFragment === 'function') {
                            const frag = range.createContextualFragment(texto);
                            const ultimoNo = frag.lastChild;
                            range.insertNode(frag);
                            if (ultimoNo) {
                                range.setStartAfter(ultimoNo);
                                range.setEndAfter(ultimoNo);
                            }
                        } else {
                            const node = docRef.createTextNode(texto);
                            range.insertNode(node);
                            range.setStartAfter(node);
                            range.setEndAfter(node);
                        }
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    try {
                        alvoFoco.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvoFoco.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                }
                return true;
            } catch (_) {
                return false;
            } finally {
                if (typeof window !== 'undefined') window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = prevInternaWin;
                if (winRef && winRef !== window) {
                    try { winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = prevInternaSub; } catch (_) { }
                }
            }
        }

        _p_definirValorInputNativo(alvo, valor) {
            try {
                const proto = (typeof HTMLTextAreaElement !== 'undefined' && (alvo instanceof HTMLTextAreaElement || (alvo.tagName && alvo.tagName.toUpperCase() === 'TEXTAREA')))
                    ? HTMLTextAreaElement.prototype
                    : (typeof HTMLInputElement !== 'undefined' ? HTMLInputElement.prototype : null);
                const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
                if (descriptor && descriptor.set) {
                    descriptor.set.call(alvo, valor);
                } else {
                    alvo.value = valor;
                }
            } catch (_) {
                alvo.value = valor;
            }
        }

        /**
         * Executa a colagem blindada no alvo editável a partir dos 2 slots internos (sem readText),
         * com suporte a `aplicarFiltroShift` (`Botão do Meio + Shift` = mesmo filtro da cópia com Shift + texto puro)
         * e `forcarSomenteTexto` (`Alt + Shift` = texto puro).
         * Possui trava reentrante e debounce anti-loop.
         */
        async executarColagem(alvo, modo = 'normal', usarAnterior = false, opcoesColagem = {}) {
            if (this._p_colagemEmAndamento) return false;
            const agora = Date.now();
            if (opcoesColagem && opcoesColagem.ignorarDebounce !== true && (agora - this._p_ultimoDisparoColagemTs) < INTERVALO_DEBOUNCE_COLAGEM_MS) {
                return false;
            }
            this._p_colagemEmAndamento = true;
            this._p_ultimoDisparoColagemTs = agora;

            try {
                if (!alvo) return false;
                const docRef = alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
                const hostCe = (alvo.tagName !== 'INPUT' && alvo.tagName !== 'TEXTAREA' && typeof alvo.closest === 'function')
                    ? alvo.closest('[contenteditable]:not([contenteditable="false"]), .ck-editor__editable, .ck-content, .cke_editable, .tox-edit-area')
                    : null;
                const alvoEfetivo = hostCe || alvo;
                const estado = this._p_deps.obterEstadoOpcoes() || {};
                const aplicarFiltroShift = Boolean(opcoesColagem && opcoesColagem.aplicarFiltroShift);
                const forcarSomenteTexto = Boolean((opcoesColagem && opcoesColagem.forcarSomenteTexto) || aplicarFiltroShift);
                const modoEfetivo = (forcarSomenteTexto || modo === 'texto_puro') ? 'texto_puro' : 'normal';

                const ehEditorRico = Boolean(
                    alvoEfetivo.isContentEditable ||
                    Boolean(hostCe) ||
                    (alvoEfetivo.getAttribute && ['true', '', 'plaintext-only'].includes((alvoEfetivo.getAttribute('contenteditable') || '').toLowerCase())) ||
                    (docRef && docRef.designMode === 'on')
                );
                const ehCampoTextoPuro = (alvoEfetivo.tagName === 'INPUT' || alvoEfetivo.tagName === 'TEXTAREA' || !ehEditorRico);

                this.focarElementoSeguro(alvoEfetivo);

                let itemInterno = usarAnterior
                    ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                    : window.__JUSGOV_ULTIMO_CLIPBOARD__;

                if (!itemInterno && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    try {
                        const resClip = await chrome.storage.local.get(['ultimoClipboardInterno', 'ultimoClipboardAnteriorInterno', 'historicoClipboardInterno']);
                        if (resClip) {
                            if (resClip.ultimoClipboardInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                                window.__JUSGOV_ULTIMO_CLIPBOARD__ = resClip.ultimoClipboardInterno;
                            }
                            if (resClip.ultimoClipboardAnteriorInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) {
                                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = resClip.ultimoClipboardAnteriorInterno;
                            }
                            if (Array.isArray(resClip.historicoClipboardInterno) && !Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                                window.__JUSGOV_HISTORICO_CLIPBOARD__ = resClip.historicoClipboardInterno.slice(0, 2);
                            }
                            itemInterno = usarAnterior
                                ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                                : window.__JUSGOV_ULTIMO_CLIPBOARD__;
                        }
                    } catch (_) { }
                }

                const payload = this.obterNivelEFormatosParaColagem(itemInterno, modoEfetivo, opcoesColagem);
                let textoEmulado = payload.texto || (!usarAnterior ? (estado.ultimoTextoLimpo || '') : '') || '';
                const htmlEmulado = payload.html || '';

                if (aplicarFiltroShift && textoEmulado) {
                    textoEmulado = this.aplicarFiltroShiftParaColagem(textoEmulado, estado.modoShiftCnj);
                }

                if (textoEmulado && textoEmulado.trim().length > 0) {
                    const tsColagem = Date.now();
                    const winAlvo = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
                    if (typeof window !== 'undefined') {
                        window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ = tsColagem;
                    }
                    if (winAlvo && winAlvo !== window) {
                        try { winAlvo.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ = tsColagem; } catch (_) { }
                    }
                    const payloadFinal = { ...payload, texto: textoEmulado };
                    const ehCkEditor = this._p_ehElementoCKEditorOuIframeRico(alvoEfetivo, docRef);

                    /* BUG-128 (Seção 6.258): NUNCA disparar ClipboardEvent('paste') sintético do Isolated World
                     * em editores ricos / CKEditor 4, pois o CKEditor aciona o fallback #cke_pastebin criando
                     * um segundo <body id="cke_pastebin" class="cke_editable"> aninhado dentro do <body contenteditable="true">,
                     * sequestrando a Selection do Blink sem preventDefault() e causando crash fatal / loop OOM
                     * com pjelayouta4 ao executar execCommand simultaneamente. */
                    if (ehCkEditor || ehCampoTextoPuro || payloadFinal.nivelIdx === 0 || !htmlEmulado) {
                        this.inserirTextoEmElemento(alvoEfetivo, textoEmulado, false, opcoesColagem);
                    } else if (ehEditorRico && payloadFinal.nivelIdx >= 1 && htmlEmulado) {
                        this.inserirTextoEmElemento(alvoEfetivo, htmlEmulado, true, opcoesColagem);
                    } else {
                        this.inserirTextoEmElemento(alvoEfetivo, textoEmulado, false, opcoesColagem);
                    }
                    this.confirmarColagemGlobalEMarcarPermanente(textoEmulado, false);
                    return true;
                }
                return false;
            } catch (_) {
                return false;
            } finally {
                this._p_colagemEmAndamento = false;
            }
        }

        async executarColagemBotaoDireito(alvo, modo, usarAnterior = false, opcoesColagem = {}) {
            return this.executarColagem(alvo, modo, usarAnterior, opcoesColagem);
        }
    }

    const _ext_GerenciadorColagem = [
        { g: 'JusGovColarFormatacao', p: './colar-formatacao.js' }
    ];
    for (let i = 0; i < _ext_GerenciadorColagem.length; i++) {
        const it = _ext_GerenciadorColagem[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(GerenciadorColagem.prototype);
        }
    }

    Object.freeze(GerenciadorColagem.prototype);
    return Object.freeze(GerenciadorColagem);
}));

