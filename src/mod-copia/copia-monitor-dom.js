/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-monitor-dom.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: MonitoramentoDomCopia
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-monitor-dom.js
 * - Classe Exportada: MonitoramentoDomCopia (window.JusGovMonitoramentoDomCopia)
 * - Métodos Públicos: limparOuvintesIframeLocal(el), limparTodosSubframesLocais(), inspecionarIframeLocal(el), observarFramesDinamicos(), notificarModificacaoPagina(motivo, url), iniciarMonitoramentoModificacoesPagina(signal), isPaginaModificada(), obterTotalSubframesAtivos(), destruir()
 * - Dependências Injetadas: callbacks de mouse/seleção do frame, limparFeedbacks, validador
 * - Regras / Seções: ENG-01 (Separação de monitoramento simultâneo), BUG-01 (AbortController + WeakMap de iframes), BUG-02 (destruição de Flash em modais), ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Submódulo exclusivo para monitoramento contínuo e paralelo do DOM, subframes same-origin,
 * surgimento de diálogos/modais críticos e transições SPA / dirty-state em formulários,
 * mantendo o motor de seleção/cópia desacoplado de observadores concorrentes.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovMonitoramentoDomCopia) {
        return;
    }

    class MonitoramentoDomCopia {
        #deps;
        #conjuntoControladoresSubframes;
        #mapaSubframePorElemento;
        #observerFrames;
        #timerNotificacaoModificacao;
        #paginaModificadaDetectada;

        constructor(dependencias = {}) {
            this.#deps = dependencias || {};
            this.#conjuntoControladoresSubframes = new Set();
            this.#mapaSubframePorElemento = new WeakMap();
            this.#observerFrames = null;
            this.#timerNotificacaoModificacao = null;
            this.#paginaModificadaDetectada = false;
        }

        isPaginaModificada() {
            return Boolean(this.#paginaModificadaDetectada);
        }

        obterTotalSubframesAtivos() {
            return this.#conjuntoControladoresSubframes.size;
        }

        estaObservandoFrames() {
            return Boolean(this.#observerFrames);
        }

        limparOuvintesIframeLocal(el) {
            if (!el) return false;
            const reg = this.#mapaSubframePorElemento.get(el);
            if (!reg) return false;
            this.#mapaSubframePorElemento.delete(el);
            if (reg.controller) {
                this.#conjuntoControladoresSubframes.delete(reg.controller);
                try { reg.controller.abort(); } catch (_) { }
            }
            if (reg.subWin) {
                try { reg.subWin.__JUSGOV_OUVINTE_LOCAL__ = false; } catch (_) { }
            }
            return true;
        }

        limparTodosSubframesLocais() {
            if (this.#conjuntoControladoresSubframes.size === 0) return 0;
            const lista = Array.from(this.#conjuntoControladoresSubframes);
            this.#conjuntoControladoresSubframes.clear();
            for (let i = 0; i < lista.length; i++) {
                try { lista[i].abort(); } catch (_) { }
            }
            return lista.length;
        }

        #ehDocumentoEditorRicoIsolado(docRef, elIframe = null) {
            try {
                if (elIframe && elIframe.classList && elIframe.classList.contains('cke_wysiwyg_frame')) {
                    return true;
                }
                const doc = docRef || (typeof document !== 'undefined' ? document : null);
                if (!doc) return false;
                if (doc.designMode === 'on') return true;
                if (doc.body && (doc.body.isContentEditable || (doc.body.classList && doc.body.classList.contains('cke_editable')))) {
                    return true;
                }
            } catch (_) { }
            return false;
        }

        inspecionarIframeLocal(el) {
            if (!el || el.tagName !== 'IFRAME') return false;
            try {
                if (!el.contentDocument || !el.contentWindow) {
                    this.limparOuvintesIframeLocal(el);
                    return false;
                }
                const subDoc = el.contentDocument;
                const subWin = el.contentWindow;
                const ehFrameEditorRico = this.#ehDocumentoEditorRicoIsolado(subDoc, el);
                const motorNativoVivoNoDoc = ehFrameEditorRico
                    ? Boolean(subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__ && subDoc.documentElement && subDoc.documentElement.__JUSGOV_DOC_LISTENERS_ATIVOS__)
                    : Boolean(subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__);

                if (motorNativoVivoNoDoc) {
                    this.limparOuvintesIframeLocal(el);
                    return false;
                }

                const regExistente = this.#mapaSubframePorElemento.get(el);
                if (regExistente) {
                    if (regExistente.subWin === subWin && regExistente.subDocEl === subDoc.documentElement && regExistente.controller && !regExistente.controller.signal.aborted) {
                        return false;
                    }
                    this.limparOuvintesIframeLocal(el);
                }

                if (subWin.__JUSGOV_OUVINTE_LOCAL__ && (!ehFrameEditorRico || (subDoc.documentElement && subDoc.documentElement.__JUSGOV_OUVINTE_LOCAL_DOC__))) {
                    return false;
                }

                const subCtrl = new AbortController();
                const subSignal = subCtrl.signal;
                this.#conjuntoControladoresSubframes.add(subCtrl);
                this.#mapaSubframePorElemento.set(el, { controller: subCtrl, subWin, subDocEl: subDoc.documentElement });
                subWin.__JUSGOV_OUVINTE_LOCAL__ = true;
                if (subDoc.documentElement) {
                    subDoc.documentElement.__JUSGOV_OUVINTE_LOCAL_DOC__ = true;
                }

                subSignal.addEventListener('abort', () => {
                    this.#conjuntoControladoresSubframes.delete(subCtrl);
                    try { subWin.__JUSGOV_OUVINTE_LOCAL__ = false; } catch (_) { }
                    try {
                        if (subDoc && subDoc.documentElement) {
                            subDoc.documentElement.__JUSGOV_OUVINTE_LOCAL_DOC__ = false;
                        }
                    } catch (_) { }
                }, { once: true });

                const selfRef = this;
                const anexarComGuarda = (alvo, tipo, handler, opts = { capture: true }) => {
                    if (!alvo || typeof alvo.addEventListener !== 'function' || typeof handler !== 'function') return;
                    alvo.addEventListener(tipo, (e) => {
                        const ehRicoAgora = selfRef.#ehDocumentoEditorRicoIsolado(subWin && subWin.document, el);
                        const nativoAtivoAgora = ehRicoAgora
                            ? Boolean(subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__ && subWin.document && subWin.document.documentElement && subWin.document.documentElement.__JUSGOV_DOC_LISTENERS_ATIVOS__)
                            : Boolean(subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__);
                        if (nativoAtivoAgora) {
                            selfRef.limparOuvintesIframeLocal(el);
                            return;
                        }
                        handler(e, subWin);
                    }, { ...opts, signal: subSignal });
                };

                if (!ehFrameEditorRico) {
                    anexarComGuarda(subDoc, 'selectionchange', (_, sw) => {
                        if (selfRef.#ehDocumentoEditorRicoIsolado(sw && sw.document, el)) return;
                        if (typeof this.#deps.tratarMudancaSelecaoGlobal === 'function') {
                            this.#deps.tratarMudancaSelecaoGlobal(sw);
                        }
                    }, { passive: true });
                    anexarComGuarda(subWin, 'mousemove', this.#deps.aoMoverMouse, { capture: true, passive: true });
                    anexarComGuarda(subWin, 'click', this.#deps.aoClicar);
                }
                anexarComGuarda(subWin, 'mousedown', this.#deps.aoPressionarBotaoMouse);
                anexarComGuarda(subWin, 'mouseup', this.#deps.aoSoltarBotaoMouse);
                anexarComGuarda(subWin, 'auxclick', this.#deps.aoClicarAuxiliarMouse);

                el.addEventListener('load', () => {
                    try {
                        this.limparOuvintesIframeLocal(el);
                        this.inspecionarIframeLocal(el);
                        if (!this.#ehDocumentoEditorRicoIsolado(el.contentDocument, el) && typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                            chrome.runtime.sendMessage({ acao: 'garantirInjecaoSubframes' }).catch(() => { });
                        }
                    } catch (_) { }
                }, { signal: subSignal });

                subWin.addEventListener('pagehide', (ev) => {
                    if (!ev || !ev.persisted) {
                        this.limparOuvintesIframeLocal(el);
                    }
                }, { capture: true, signal: subSignal });

                return true;
            } catch (_) {
                return false;
            }
        }

        observarFramesDinamicos() {
            if (this.#observerFrames) {
                try { this.#observerFrames.disconnect(); } catch (_) { }
                this.#observerFrames = null;
            }
            /* BUG-128: Dentro de documento iframe de editor rico (ex.: body.cke_editable do CKEditor),
             * NUNCA ativar MutationObserver subtree:true para não varrer o DOM a cada caractere digitado ou colado. */
            if (typeof document !== 'undefined' && this.#ehDocumentoEditorRicoIsolado(document, null)) {
                return;
            }
            try {
                let ultimoPingInjecaoTs = 0;
                const notificarInjecao = () => {
                    const agoraPing = Date.now();
                    if ((agoraPing - ultimoPingInjecaoTs) < 250) return;
                    ultimoPingInjecaoTs = agoraPing;
                    try {
                        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                            chrome.runtime.sendMessage({ acao: 'garantirInjecaoSubframes' }).catch(() => { });
                        }
                    } catch (_) { }
                };

                if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
                    const iframesIniciais = document.querySelectorAll('iframe');
                    for (let i = 0; i < iframesIniciais.length; i++) {
                        this.inspecionarIframeLocal(iframesIniciais[i]);
                    }
                }

                this.#observerFrames = new MutationObserver((mutations) => {
                    let temFrame = false;
                    let surgiuModalCritico = false;
                    const estadoTimers = (typeof this.#deps.obterEstadoTimers === 'function')
                        ? this.#deps.obterEstadoTimers()
                        : {};
                    const validador = (typeof this.#deps.obterValidador === 'function')
                        ? this.#deps.obterValidador()
                        : this.#deps.validador;

                    for (let i = 0; i < mutations.length; i++) {
                        const m = mutations[i];
                        const removidos = m.removedNodes;
                        if (removidos && removidos.length > 0) {
                            for (let r = 0; r < removidos.length; r++) {
                                const noRem = removidos[r];
                                if (noRem && noRem.nodeType === Node.ELEMENT_NODE) {
                                    if (noRem.tagName === 'IFRAME') {
                                        this.limparOuvintesIframeLocal(noRem);
                                    } else if (noRem.childElementCount > 0 && typeof noRem.getElementsByTagName === 'function') {
                                        const iframesRem = noRem.getElementsByTagName('iframe');
                                        for (let ir = 0; ir < iframesRem.length; ir++) {
                                            this.limparOuvintesIframeLocal(iframesRem[ir]);
                                        }
                                    }
                                }
                            }
                        }

                        if (m.type === 'attributes') {
                            const t = m.target;
                            if (t && (t.tagName === 'IFRAME' || t.tagName === 'EMBED' || t.tagName === 'OBJECT')) {
                                temFrame = true;
                                if (t.tagName === 'IFRAME') {
                                    this.limparOuvintesIframeLocal(t);
                                    this.inspecionarIframeLocal(t);
                                }
                                break;
                            }
                        }

                        const nodes = m.addedNodes;
                        if (!nodes || nodes.length === 0) continue;
                        for (let j = 0; j < nodes.length; j++) {
                            const n = nodes[j];
                            if (n && n.nodeType === Node.ELEMENT_NODE) {
                                const tag = n.tagName;
                                const temAvisoModal = Boolean(
                                    validador && (
                                        (typeof validador.estaAvisoVisivel === 'function' && validador.estaAvisoVisivel()) ||
                                        validador.avisoVisivel ||
                                        validador.temporizadorAlerta
                                    )
                                );
                                if (estadoTimers.aguardandoDesselecaoFlash || estadoTimers.timerFlashBorder || temAvisoModal) {
                                    const roleAttr = (n.getAttribute && n.getAttribute('role')) || '';
                                    const clsAttr = (typeof n.className === 'string') ? n.className : '';
                                    if (roleAttr === 'dialog' || roleAttr === 'alertdialog' ||
                                        tag === 'MAT-DIALOG-CONTAINER' || tag === 'P-DIALOG' ||
                                        /\b(modal|rich-modalpanel|swal2-container|ui-dialog|p-dialog)\b/i.test(clsAttr) ||
                                        (typeof n.querySelector === 'function' && n.querySelector('[role="dialog"], [role="alertdialog"], .modal, .rich-modalpanel, .swal2-container, .ui-dialog, .p-dialog, mat-dialog-container'))) {
                                        surgiuModalCritico = true;
                                    }
                                }
                                if (tag === 'IFRAME' || tag === 'EMBED' || tag === 'OBJECT') {
                                    temFrame = true;
                                    this.inspecionarIframeLocal(n);
                                } else if (n.childElementCount > 0 && typeof n.getElementsByTagName === 'function') {
                                    const subIframes = n.getElementsByTagName('iframe');
                                    if (subIframes && subIframes.length > 0) {
                                        temFrame = true;
                                        for (let k = 0; k < subIframes.length; k++) {
                                            this.inspecionarIframeLocal(subIframes[k]);
                                        }
                                    }
                                    const subEmbeds = n.getElementsByTagName('embed');
                                    if (subEmbeds && subEmbeds.length > 0) {
                                        temFrame = true;
                                    }
                                }
                            }
                        }
                    }

                    if (surgiuModalCritico && typeof this.#deps.limparFeedbacksModalCritico === 'function') {
                        this.#deps.limparFeedbacksModalCritico();
                    }
                    if (temFrame) {
                        notificarInjecao();
                    }
                });

                const alvoObservacao = document.documentElement || document.body;
                if (alvoObservacao) {
                    this.#observerFrames.observe(alvoObservacao, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['src', 'data']
                    });
                }
            } catch (_) { }
        }

        notificarModificacaoPagina(motivo, urlReferencia) {
            this.#paginaModificadaDetectada = true;
            if (this.#timerNotificacaoModificacao) return;
            this.#timerNotificacaoModificacao = setTimeout(() => {
                this.#timerNotificacaoModificacao = null;
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                        chrome.runtime.sendMessage({
                            acao: 'registrarPaginaModificada',
                            motivo: motivo || 'DIRTY',
                            urlAtual: urlReferencia || (typeof window !== 'undefined' ? window.location.href : '')
                        }).catch(() => { });
                    }
                } catch (_) { }
            }, 300);
        }

        iniciarMonitoramentoModificacoesPagina(signal) {
            try {
                if (typeof window === 'undefined') return;

                if (window.navigation && typeof window.navigation.addEventListener === 'function') {
                    window.navigation.addEventListener('navigate', (e) => {
                        const destUrl = (e && e.destination && e.destination.url) ? e.destination.url : window.location.href;
                        this.notificarModificacaoPagina('SPA_NAVIGATE', destUrl);
                    }, { signal });
                }

                try {
                    if (window.history && typeof window.history.pushState === 'function' && !window.__JUSGOV_HISTORY_HOOKED__) {
                        window.__JUSGOV_HISTORY_HOOKED__ = true;
                        const selfRef = this;
                        const origPushState = window.history.pushState;
                        window.history.pushState = function (...args) {
                            const ret = origPushState.apply(this, args);
                            selfRef.notificarModificacaoPagina('SPA_PUSH_STATE', window.location.href);
                            return ret;
                        };
                        const origReplaceState = window.history.replaceState;
                        window.history.replaceState = function (...args) {
                            const ret = origReplaceState.apply(this, args);
                            selfRef.notificarModificacaoPagina('SPA_REPLACE_STATE', window.location.href);
                            return ret;
                        };
                    }
                } catch (_) { }

                window.addEventListener('hashchange', () => {
                    this.notificarModificacaoPagina('SPA_HASHCHANGE', window.location.href);
                }, { passive: true, signal });

                window.addEventListener('popstate', () => {
                    this.notificarModificacaoPagina('SPA_POPSTATE', window.location.href);
                }, { passive: true, signal });

                const tratarInputModificacao = (e) => {
                    const el = e.target;
                    if (!el) return;
                    if (el.closest && el.closest('[data-jusgov-ignore="true"]')) return;
                    const tag = (el.tagName || '').toUpperCase();
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) {
                        this.notificarModificacaoPagina('FORM_DIRTY', window.location.href);
                    }
                };
                document.addEventListener('input', tratarInputModificacao, { capture: true, passive: true, signal });
                document.addEventListener('change', tratarInputModificacao, { capture: true, passive: true, signal });

                const elTitle = document.querySelector('title');
                if (elTitle && typeof MutationObserver !== 'undefined') {
                    const obsTitle = new MutationObserver(() => {
                        this.notificarModificacaoPagina('TITULO_MODIFICADO', window.location.href);
                    });
                    obsTitle.observe(elTitle, { childList: true, characterData: true, subtree: true });
                    if (signal) {
                        signal.addEventListener('abort', () => obsTitle.disconnect());
                    }
                }
            } catch (_) { }
        }

        destruir() {
            this.limparTodosSubframesLocais();
            if (this.#observerFrames) {
                try { this.#observerFrames.disconnect(); } catch (_) { }
                this.#observerFrames = null;
            }
            if (this.#timerNotificacaoModificacao) {
                clearTimeout(this.#timerNotificacaoModificacao);
                this.#timerNotificacaoModificacao = null;
            }
        }
    }

    Object.freeze(MonitoramentoDomCopia.prototype);
    window.JusGovMonitoramentoDomCopia = Object.freeze(MonitoramentoDomCopia);
})();
