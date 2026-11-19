/* ==========================================================================
 * ARQUIVO: src/lib/lib-escopo-url.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs — Escopo de URL, Contexto Editável e Proteção DOM
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-escopo-url.js
 * - Classe Exportada: GerenciadorEscopoUrl (self.JusGovLibEscopoUrl / window.JusGovLibEscopoUrl)
 * - Herança: extends BaseModulo (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovLibEscopoUrl.NULL_OBJECT
 * - Métodos Públicos:
 *     aplicarConfig({ modoExecucao, listaUrlsPermitidas }),
 *     obterUrlEfetiva(), verificarUrlPermitida(),
 *     ehDocumentoEditorRicoIsolado(docRef), ehContextoEditavelOuExtensao(noAlvo),
 *     ehDominioPjeOuJusGov(urlStr), sincronizarProtecaoLeituraDom()
 * - Regras / Seções: ENG-00 (Prioridade -1), ARQ-10 (Seção 6.262), BUG-122, BUG-128
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) REUSO TRANSVERSAL (ENG-00 / ENG-02):
 *    Extrai de `copia-selecionar.js` todas as verificações transversais de escopo de URL,
 *    herança de URL em iframes `about:blank`/`about:srcdoc`, detecção O(1) de documentos
 *    de editores ricos (`body.cke_editable` / `designMode`), contexto editável/extensão
 *    e injeção do estilo global de desbloqueio de leitura (`#jusgov-desbloqueio-selecao-global`).
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovLibEscopoUrl = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseModulo === 'function')
        ? gGlobal.JusGovBaseModulo
        : class { aplicarConfig() { return true; } destruir() { return true; } };

    const NULL_ESCOPO_URL = Object.freeze({
        aplicarConfig: () => false,
        obterUrlEfetiva: () => '',
        verificarUrlPermitida: () => false,
        ehDocumentoEditorRicoIsolado: () => false,
        ehContextoEditavelOuExtensao: () => false,
        ehDominioPjeOuJusGov: () => false,
        sincronizarProtecaoLeituraDom: () => false
    });

    const RX_ESCAPE_META = /[.+?^${}()|[\]\\]/g;
    const RX_CURINGA = /\*/g;
    const SELETOR_EDITAVEL_CONHECIDO = '[contenteditable="true"], [contenteditable=""], [role="textbox"], .cke_editable, .ck-editor__editable, .ProseMirror, .CodeMirror, .monaco-editor, .tox-edit-area';

    class GerenciadorEscopoUrl extends BasePai {
        #modoExecucao = 'url';
        #listaUrlsPermitidas = [];

        constructor(opcoes = {}) {
            super('GerenciadorEscopoUrl');
            this.aplicarConfig(opcoes);
        }

        static get NULL_OBJECT() {
            return NULL_ESCOPO_URL;
        }

        aplicarConfig(cfg = {}) {
            if (!cfg || typeof cfg !== 'object') return false;
            if (typeof cfg.modoExecucao === 'string') {
                this.#modoExecucao = cfg.modoExecucao;
            }
            if (Array.isArray(cfg.listaUrlsPermitidas)) {
                this.#listaUrlsPermitidas = cfg.listaUrlsPermitidas;
            }
            return true;
        }

        obterUrlEfetiva() {
            let urlAtual = '';
            try {
                urlAtual = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : '';
                if (!urlAtual || urlAtual === 'about:blank' || urlAtual.startsWith('about:srcdoc')) {
                    try {
                        if (window.top && window.top !== window && window.top.location && window.top.location.href && window.top.location.href !== 'about:blank') {
                            urlAtual = window.top.location.href;
                        }
                    } catch (_) { }
                    if (!urlAtual || urlAtual === 'about:blank' || urlAtual.startsWith('about:srcdoc')) {
                        try {
                            if (window.parent && window.parent !== window && window.parent.location && window.parent.location.href && window.parent.location.href !== 'about:blank') {
                                urlAtual = window.parent.location.href;
                            }
                        } catch (_) { }
                    }
                    if ((!urlAtual || urlAtual === 'about:blank' || urlAtual.startsWith('about:srcdoc')) && typeof document !== 'undefined' && document.referrer) {
                        urlAtual = document.referrer;
                    }
                }
            } catch (_) { }
            return urlAtual;
        }

        verificarUrlPermitida(modoOverride = null, urlsOverride = null) {
            const modo = (typeof modoOverride === 'string') ? modoOverride : this.#modoExecucao;
            const lista = Array.isArray(urlsOverride) ? urlsOverride : this.#listaUrlsPermitidas;

            if (modo === 'desligado') return false;
            if (modo === 'global') return true;

            const urlAtual = this.obterUrlEfetiva();
            if (urlAtual.startsWith('chrome-extension://')) return true;
            if (!Array.isArray(lista) || lista.length === 0) return false;

            for (let i = 0; i < lista.length; i++) {
                const padrao = lista[i];
                if (!padrao || padrao === '' || padrao === '<all_urls>') continue;
                if (padrao === '*://*/*') return true;
                try {
                    const regexStr = '^' + padrao.trim()
                        .replace(RX_ESCAPE_META, '\\$&')
                        .replace(RX_CURINGA, '.*') + '$';
                    if (new RegExp(regexStr, 'i').test(urlAtual)) return true;
                } catch (_) {
                    continue;
                }
            }
            return false;
        }

        ehDocumentoEditorRicoIsolado(docRef = null) {
            try {
                const doc = docRef || (typeof document !== 'undefined' ? document : null);
                if (!doc) return false;
                if (doc.designMode === 'on') return true;
                if (doc.body && (doc.body.isContentEditable || (doc.body.classList && doc.body.classList.contains('cke_editable')))) {
                    return true;
                }
            } catch (_) { }
            return false;
        }

        ehContextoEditavelOuExtensao(noAlvo) {
            try {
                if (this.ehDocumentoEditorRicoIsolado(noAlvo && noAlvo.ownerDocument ? noAlvo.ownerDocument : null)) {
                    return true;
                }
                const seExtensao = (n) => {
                    const el = (n && n.nodeType === 1) ? n : (n ? n.parentElement : null);
                    return Boolean(el && typeof el.closest === 'function' && el.closest('[data-jusgov-ignore="true"]'));
                };
                const checarNo = (n) => {
                    const el = (n && n.nodeType === 1) ? n : (n ? n.parentElement : null);
                    if (!el || el.nodeType !== 1) return false;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
                    if (el.isContentEditable) return true;
                    return Boolean(typeof el.closest === 'function' && el.closest(SELETOR_EDITAVEL_CONHECIDO));
                };
                const doc = (typeof document !== 'undefined') ? document : null;
                if (seExtensao(noAlvo) || (doc && seExtensao(doc.activeElement))) return true;
                if (checarNo(noAlvo) || (doc && checarNo(doc.activeElement))) return true;
                const sel = (typeof window !== 'undefined' && typeof window.getSelection === 'function') ? window.getSelection() : null;
                if (sel && (checarNo(sel.anchorNode) || checarNo(sel.focusNode))) return true;
            } catch (_) { }
            return false;
        }

        ehDominioPjeOuJusGov(urlStr) {
            try {
                const u = new URL(urlStr, (typeof window !== 'undefined' && window.location) ? window.location.href : undefined);
                const host = (u.hostname || '').toLowerCase();
                if (/\.jus\.br$|\.gov\.br$/i.test(host)) return true;
                if (/(?:^|\.)pje/i.test(host) || /\/pje(?:\/|$)/i.test(u.pathname || '')) return true;
            } catch (_) { }
            return false;
        }

        sincronizarProtecaoLeituraDom(modoOverride = null, urlsOverride = null) {
            try {
                if (typeof window !== 'undefined' && window.__TESTE_HEADLESS__) return false;
                const doc = typeof document !== 'undefined' ? document : null;
                if (!doc) return false;
                if (this.ehDocumentoEditorRicoIsolado(doc)) return false;

                const permitido = this.verificarUrlPermitida(modoOverride, urlsOverride);
                if (doc.documentElement) {
                    doc.documentElement.setAttribute('data-jusgov-ativo', permitido ? '1' : '0');
                }
                const idEstiloGlobal = 'jusgov-desbloqueio-selecao-global';
                const estiloExistente = doc.getElementById(idEstiloGlobal);
                if (!permitido) {
                    if (estiloExistente && estiloExistente.parentNode) {
                        estiloExistente.parentNode.removeChild(estiloExistente);
                    }
                    return false;
                }
                if (!estiloExistente) {
                    const alvoCss = doc.head || doc.documentElement;
                    if (alvoCss) {
                        const st = doc.createElement('style');
                        st.id = idEstiloGlobal;
                        st.setAttribute('data-jusgov-ignore', 'true');
                        st.textContent = 'html body p, html body article, html body section, html body main, html body blockquote, html body pre, html body code, html body h1, html body h2, html body h3, html body h4, html body h5, html body h6, html body li, html body dd, html body dt, html body td, html body th, html body figcaption, [unselectable], [onselectstart], [oncopy], [onbeforecopy] { -webkit-user-select: text !important; user-select: text !important; }';
                        alvoCss.appendChild(st);
                    }
                }
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(GerenciadorEscopoUrl.prototype);
    return Object.freeze(GerenciadorEscopoUrl);
}));
