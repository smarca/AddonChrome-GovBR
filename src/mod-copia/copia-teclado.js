/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-teclado.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COPIA — Controlador de Teclado e Desseleção Universal (Esc/Esc+Esc/F1)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-teclado.js
 * - Classe Exportada: CopiaControladorTeclado (window.JusGovCopiaTeclado)
 * - Herança: extends BaseModulo (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovCopiaTeclado.NULL_OBJECT
 * - Métodos Públicos:
 *     deselecionarTudoEmContexto(win, doc), executarDeselecaoUniversal(origemRemota, preservarMiniTip),
 *     aoPressionarTecla(e), aoSoltarTecla(e)
 * - Regras / Seções: ENG-00 (Prioridade -1), ARQ-10 (Seção 6.262), FEAT-102 (Esc+Esc via LibUiTela)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) RESPONSABILIDADE ÚNICA (ENG-00):
 *    Isola de `copia-selecionar.js` toda a lógica de teclado (`Escape`, `Esc+Esc`,
 *    `Ctrl+C`, `F1`, `ArrowUp/ArrowDown` em inputs, `Ins+Ins`, proteção `Ctrl+C/A`) e
 *    a desseleção universal profunda multi-frame.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovCopiaTeclado = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseModulo === 'function')
        ? gGlobal.JusGovBaseModulo
        : class { destruir() { return true; } };

    const NULL_TECLADO = Object.freeze({
        deselecionarTudoEmContexto: () => { },
        executarDeselecaoUniversal: () => { },
        aoPressionarTecla: () => { },
        aoSoltarTecla: () => { }
    });

    class CopiaControladorTeclado extends BasePai {
        #deps = {};
        #ultimoTimestampEsc = 0;

        constructor(deps = {}) {
            super('CopiaControladorTeclado');
            this.#deps = deps && typeof deps === 'object' ? deps : {};
        }

        static get NULL_OBJECT() {
            return NULL_TECLADO;
        }

        deselecionarTudoEmContexto(win, doc) {
            if (!win || !doc) return;
            try {
                if (doc.documentElement) {
                    doc.documentElement.setAttribute('data-jusgov-permitir-desselecao', '1');
                }
                const sel = typeof win.getSelection === 'function' ? win.getSelection() : null;
                if (sel) {
                    try { if (typeof sel.empty === 'function') sel.empty(); } catch (_) { }
                    try { if (typeof sel.removeAllRanges === 'function') sel.removeAllRanges(); } catch (_) { }
                    try { if (!sel.isCollapsed && typeof sel.collapseToStart === 'function') sel.collapseToStart(); } catch (_) { }
                }
                try { if (typeof doc.execCommand === 'function') doc.execCommand('unselect', false, null); } catch (_) { }
                try {
                    const ativo = doc.activeElement;
                    if (ativo && (ativo.tagName === 'INPUT' || ativo.tagName === 'TEXTAREA')) {
                        if (typeof ativo.setSelectionRange === 'function') {
                            const pos = typeof ativo.selectionEnd === 'number' ? ativo.selectionEnd : 0;
                            ativo.setSelectionRange(pos, pos);
                        }
                    }
                } catch (_) { }
                try {
                    if (doc.querySelectorAll) {
                        const campos = doc.querySelectorAll('input, textarea');
                        for (let i = 0; i < campos.length; i++) {
                            const c = campos[i];
                            if (c && typeof c.selectionStart === 'number' && typeof c.selectionEnd === 'number' && c.selectionStart !== c.selectionEnd) {
                                try {
                                    if (typeof c.setSelectionRange === 'function') {
                                        c.setSelectionRange(c.selectionEnd, c.selectionEnd);
                                    }
                                } catch (_) { }
                            }
                        }
                    }
                } catch (_) { }
            } catch (_) {
            } finally {
                try {
                    if (doc && doc.documentElement) {
                        doc.documentElement.removeAttribute('data-jusgov-permitir-desselecao');
                    }
                } catch (_) { }
            }
        }

        executarDeselecaoUniversal(origemRemota = false, preservarMiniTip = false) {
            this.deselecionarTudoEmContexto(window, document);

            try {
                if (document.querySelectorAll) {
                    const quadros = document.querySelectorAll('iframe, frame');
                    for (let i = 0; i < quadros.length; i++) {
                        try {
                            const q = quadros[i];
                            const docQ = q.contentDocument || (q.contentWindow && q.contentWindow.document);
                            const winQ = q.contentWindow;
                            if (winQ && docQ) {
                                this.deselecionarTudoEmContexto(winQ, docQ);
                                if (docQ.querySelectorAll) {
                                    const subQuadros = docQ.querySelectorAll('iframe, frame');
                                    for (let j = 0; j < subQuadros.length; j++) {
                                        try {
                                            const sq = subQuadros[j];
                                            const subDoc = sq.contentDocument || (sq.contentWindow && sq.contentWindow.document);
                                            const subWin = sq.contentWindow;
                                            if (subWin && subDoc) this.deselecionarTudoEmContexto(subWin, subDoc);
                                        } catch (_) { }
                                    }
                                }
                            }
                        } catch (_) { }
                    }
                }
            } catch (_) { }

            try {
                if (window.parent && window.parent !== window) {
                    this.deselecionarTudoEmContexto(window.parent, window.parent.document);
                }
            } catch (_) { }
            try {
                if (window.top && window.top !== window && window.top !== window.parent) {
                    this.deselecionarTudoEmContexto(window.top, window.top.document);
                }
            } catch (_) { }

            if (typeof this.#deps.limparEstadosAposDeselecao === 'function') {
                this.#deps.limparEstadosAposDeselecao(Boolean(origemRemota || preservarMiniTip));
            }

            if (!origemRemota) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ acao: 'broadcastDeselecionarGeral' }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) { }
                        });
                    }
                } catch (_) { }
            }
        }

        aoPressionarTecla(e) {
            const d = this.#deps;
            const estado = (typeof d.obterEstado === 'function') ? d.obterEstado() : {};
            const teclasAtivas = estado.teclasPressionadasAtivas;

            if (e && e.key && e.key !== 'Escape' && teclasAtivas && typeof teclasAtivas.add === 'function') {
                teclasAtivas.add(String(e.key).toLowerCase());
            }

            const fachadaInput = (typeof d.obterFachadaInput === 'function') ? d.obterFachadaInput() : null;
            if (estado.caixaEntradaRapidaAtiva && fachadaInput && fachadaInput.caixaRapida && typeof fachadaInput.caixaRapida.tratarEventoTeclado === 'function') {
                fachadaInput.caixaRapida.ativo = true;
                if (fachadaInput.caixaRapida.tratarEventoTeclado(e)) return;
            }

            if (e && e.key === 'Escape') {
                if (typeof d.limparFlash === 'function') d.limparFlash();
                if (typeof d.limparAvisos === 'function') d.limparAvisos();
            } else if (e && e.key === 'Enter') {
                if (estado.tempoFlashBorderMs !== -1 && typeof d.limparFlash === 'function') d.limparFlash();
                if (typeof d.limparAvisos === 'function') d.limparAvisos();
            }

            if ((e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') && !e.repeat) {
                if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey && typeof d.definirAncoraShift === 'function') {
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        const r = sel.getRangeAt(0);
                        d.definirAncoraShift({
                            no: sel.anchorNode || r.startContainer,
                            offset: typeof sel.anchorOffset === 'number' ? sel.anchorOffset : r.startOffset
                        });
                    }
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'c' || e.key === 'C')) {
                if (typeof d.sincronizarCopiaManual === 'function') {
                    d.sincronizarCopiaManual(null);
                    setTimeout(() => { try { d.sincronizarCopiaManual(null); } catch (_) { } }, 25);
                }
            }

            if (e.key === 'F1' || e.code === 'F1') {
                if (!estado.atalhoF1GeminiAtivo) return;
                e.preventDefault();
                e.stopPropagation();
                if (typeof d.executarAtalhoF1Gemini === 'function') d.executarAtalhoF1Gemini();
                return;
            }

            if (e.key === 'Escape') {
                if (e.repeat) return;
                if (typeof d.limparCampoSimplesNoEsc === 'function') d.limparCampoSimplesNoEsc(e);
                this.executarDeselecaoUniversal(false);

                const agora = performance.now();
                const intervaloMs = agora - this.#ultimoTimestampEsc;
                const janelaDuploEsc = estado.janelaDuploEscMs || 420;

                if (this.#ultimoTimestampEsc > 0 && intervaloMs >= 60 && intervaloMs <= janelaDuploEsc) {
                    this.#ultimoTimestampEsc = 0;
                    if (typeof d.alternarModoFormatacaoDuploEsc === 'function') {
                        d.alternarModoFormatacaoDuploEsc();
                    }
                } else {
                    this.#ultimoTimestampEsc = agora;
                }
                return;
            }

            if (e && !e.altKey && !e.shiftKey && typeof d.verificarUrlPermitida === 'function' && d.verificarUrlPermitida() &&
                typeof d.ehContextoEditavelOuExtensao === 'function' && !d.ehContextoEditavelOuExtensao(e.target)) {
                const teclaLower = String(e.key || '').toLowerCase();
                const ehCopiaOuSelectAll = ((e.ctrlKey || e.metaKey) && (teclaLower === 'c' || teclaLower === 'a')) ||
                    (e.ctrlKey && e.key === 'Insert');
                if (ehCopiaOuSelectAll) {
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                }
            }
        }

        aoSoltarTecla(e) {
            const d = this.#deps;
            const estado = (typeof d.obterEstado === 'function') ? d.obterEstado() : {};
            const teclasAtivas = estado.teclasPressionadasAtivas;
            if (teclasAtivas && typeof teclasAtivas.delete === 'function') {
                if (e && e.key) teclasAtivas.delete(String(e.key).toLowerCase());
                if (e && !e.ctrlKey) teclasAtivas.delete('control');
                if (e && !e.altKey) teclasAtivas.delete('alt');
                if (e && !e.shiftKey) teclasAtivas.delete('shift');
                if (e && !e.metaKey) teclasAtivas.delete('meta');
            }
            if (e && e.key === 'Shift' && typeof d.definirAncoraShift === 'function') {
                d.definirAncoraShift(null);
            }
            if (typeof window !== 'undefined') {
                window.__JUSGOV_MODO_BARALHO__ = Boolean(e && e.ctrlKey && e.altKey && e.shiftKey);
                if (!window.__JUSGOV_MODO_BARALHO__ && typeof d.ocultarInspetor === 'function') {
                    d.ocultarInspetor();
                }
            }
        }
    }

    Object.freeze(CopiaControladorTeclado.prototype);
    return Object.freeze(CopiaControladorTeclado);
}));
