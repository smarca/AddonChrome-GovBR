/* ==========================================================================
 * ARQUIVO: src/lib/lib-ui-tela.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs — Exibição Global "Na Tela" (Top-Layer / Frame 0)
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-ui-tela.js
 * - Classe Exportada: GerenciadorUiTela (self.JusGovLibUiTela / window.JusGovLibUiTela)
 * - Null Object: JusGovLibUiTela.NULL_OBJECT
 * - Métodos Públicos:
 *     exibirNaTela(opcoes), ocultarNaTela(idHost),
 *     exibirNaAba(tabId, opcoes), ocultarNaAba(tabId, idHost),
 *     static funcaoInjecaoNaTela(payload), static funcaoOcultarNaTela(idHost)
 * - Regras / Seções: ENG-00 (Prioridade -1), ENG-01 (Null Object), FEAT-102 (Seção 6.260)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) PADRÃO MINIPOPUP POMODORO (FRAME 0 / TOP-LAYER):
 *    Toda mensagem "Na Tela" (independente do conteúdo da página ou de iframes cross-origin,
 *    como Esc+Esc e feedback do Acumulador) é injetada pelo Background Service Worker
 *    diretamente no frame raiz (`frameIds: [0]` / `window.top`) com `popover="manual"` e
 *    Shadow DOM fechado (`mode: 'closed'`), garantindo posição fixa idêntica em 100% das telas.
 * 2) RESILIÊNCIA A BLOQUEIOS DE SEGURANÇA (`try {} catch {}`):
 *    Se IPC ou `chrome.scripting.executeScript` falhar por restrição de política/origem
 *    ou ambiente de testes headless, realiza fallback seguro para renderização local.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovLibUiTela = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const ID_HOST_PADRAO = 'jusgov-ui-tela-top-layer';

    const NULL_UI_TELA = Object.freeze({
        exibirNaTela: async () => false,
        ocultarNaTela: async () => false,
        exibirNaAba: async () => false,
        ocultarNaAba: async () => false
    });

    /**
     * Função autossuficiente e serializável (padrão Minipopup Pomodoro) para injeção
     * via `chrome.scripting.executeScript({ target: { tabId, frameIds: [0] } })`.
     * NÃO depende de closures externas.
     */
    function funcaoInjecaoNaTela(payload) {
        try {
            if (!payload || typeof document === 'undefined' || !document.body) return false;
            const idHost = String(payload.idHost || 'jusgov-ui-tela-top-layer');
            const mensagem = String(payload.mensagem || '');
            if (!mensagem.trim()) return false;
            const corBorda = String(payload.corBorda || '#3b82f6');
            const duracaoMs = (typeof payload.duracaoMs === 'number') ? payload.duracaoMs : -1;
            const posicao = String(payload.posicao || 'topo_centro');

            let host = document.getElementById(idHost);
            if (!host) {
                host = document.createElement('div');
                host.id = idHost;
                host.setAttribute('data-jusgov-ignore', 'true');
                if (typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype) {
                    host.setAttribute('popover', 'manual');
                }
                host.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;width:0;height:0;border:none;padding:0;margin:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483647 !important;isolation:isolate !important;';
                const shadow = host.attachShadow({ mode: 'closed' });
                const style = document.createElement('style');
                style.textContent = `
                    .jusgov-tela-toast {
                        position: fixed;
                        z-index: 2147483647;
                        background: #1e293b;
                        color: #f8fafc;
                        border: 1.5px solid #3b82f6;
                        padding: 8px 16px;
                        font-size: 12.5px;
                        font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
                        font-weight: 700;
                        border-radius: 8px;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.36);
                        pointer-events: auto;
                        user-select: none;
                        white-space: pre-line;
                        text-align: center;
                        line-height: 1.38;
                        max-width: 440px;
                        display: none;
                    }
                `;
                const caixa = document.createElement('div');
                caixa.className = 'jusgov-tela-toast';
                caixa.setAttribute('data-jusgov-ignore', 'true');
                shadow.appendChild(style);
                shadow.appendChild(caixa);
                document.body.appendChild(host);
                host.__jusgovUiTelaCaixa = caixa;
            }

            if (typeof host.__jusgovUiTelaLimpar === 'function') {
                try { host.__jusgovUiTelaLimpar(); } catch (_) { }
            }
            if (host.__jusgovUiTelaTimer) {
                clearTimeout(host.__jusgovUiTelaTimer);
                host.__jusgovUiTelaTimer = null;
            }

            const caixa = host.__jusgovUiTelaCaixa;
            if (!caixa) return false;

            caixa.textContent = mensagem;
            caixa.style.borderColor = corBorda;
            if (posicao === 'baixo_centro') {
                caixa.style.top = 'auto';
                caixa.style.bottom = '24px';
                caixa.style.left = '50%';
                caixa.style.transform = 'translateX(-50%)';
            } else {
                caixa.style.top = '20px';
                caixa.style.bottom = 'auto';
                caixa.style.left = '50%';
                caixa.style.transform = 'translateX(-50%)';
            }
            caixa.style.display = 'block';

            if (typeof host.showPopover === 'function') {
                try {
                    if (host.matches && host.matches(':popover-open')) host.hidePopover();
                    host.showPopover();
                } catch (_) { }
            }

            const ocultarAgora = () => {
                if (typeof host.__jusgovUiTelaLimpar === 'function') {
                    try { host.__jusgovUiTelaLimpar(); } catch (_) { }
                    host.__jusgovUiTelaLimpar = null;
                }
                if (host.__jusgovUiTelaTimer) {
                    clearTimeout(host.__jusgovUiTelaTimer);
                    host.__jusgovUiTelaTimer = null;
                }
                caixa.style.display = 'none';
                if (typeof host.hidePopover === 'function') {
                    try { host.hidePopover(); } catch (_) { }
                }
            };
            host.__jusgovUiTelaOcultar = ocultarAgora;

            if (duracaoMs > 0) {
                host.__jusgovUiTelaTimer = setTimeout(ocultarAgora, duracaoMs);
            } else if (duracaoMs === -1) {
                const tsInicio = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                    ? performance.now()
                    : Date.now();
                const CARENCIA_MS = 180;
                const aoKeyDown = (e) => {
                    if (!e) return;
                    const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                    const tecla = String(e.key || '').toLowerCase();
                    if (tecla === 'insert' || e.keyCode === 45) return;
                    if ((agora - tsInicio) < CARENCIA_MS && (tecla === 'escape' || tecla === 'esc' || e.keyCode === 27)) return;
                    ocultarAgora();
                };
                const aoKeyUp = (e) => {
                    if (!e) return;
                    const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                    if ((agora - tsInicio) < CARENCIA_MS) return;
                    const tecla = String(e.key || '').toLowerCase();
                    if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'altgraph') {
                        ocultarAgora();
                    }
                };
                const aoMouseDown = () => ocultarAgora();
                const aoHover = () => ocultarAgora();
                const aoMouseMove = (e) => {
                    if (!e || caixa.style.display === 'none') return;
                    try {
                        const r = caixa.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0 &&
                            e.clientX >= r.left && e.clientX <= r.right &&
                            e.clientY >= r.top && e.clientY <= r.bottom) {
                            ocultarAgora();
                        }
                    } catch (_) { }
                };
                const opts = { capture: true, passive: true };
                window.addEventListener('keydown', aoKeyDown, opts);
                document.addEventListener('keydown', aoKeyDown, opts);
                window.addEventListener('keyup', aoKeyUp, opts);
                document.addEventListener('keyup', aoKeyUp, opts);
                window.addEventListener('mousedown', aoMouseDown, opts);
                document.addEventListener('mousedown', aoMouseDown, opts);
                window.addEventListener('mousemove', aoMouseMove, opts);
                caixa.addEventListener('mouseenter', aoHover, { passive: true });
                caixa.addEventListener('mousemove', aoHover, { passive: true });

                host.__jusgovUiTelaLimpar = () => {
                    window.removeEventListener('keydown', aoKeyDown, opts);
                    document.removeEventListener('keydown', aoKeyDown, opts);
                    window.removeEventListener('keyup', aoKeyUp, opts);
                    document.removeEventListener('keyup', aoKeyUp, opts);
                    window.removeEventListener('mousedown', aoMouseDown, opts);
                    document.removeEventListener('mousedown', aoMouseDown, opts);
                    window.removeEventListener('mousemove', aoMouseMove, opts);
                    caixa.removeEventListener('mouseenter', aoHover);
                    caixa.removeEventListener('mousemove', aoHover);
                };
            }
            return true;
        } catch (_) {
            return false;
        }
    }

    function funcaoOcultarNaTela(idHost) {
        try {
            if (typeof document === 'undefined') return false;
            const host = document.getElementById(String(idHost || 'jusgov-ui-tela-top-layer'));
            if (!host) return false;
            if (typeof host.__jusgovUiTelaOcultar === 'function') {
                host.__jusgovUiTelaOcultar();
                return true;
            }
            if (typeof host.hidePopover === 'function') {
                try { host.hidePopover(); } catch (_) { }
            }
            return true;
        } catch (_) {
            return false;
        }
    }

    class GerenciadorUiTela {
        #idHostPadrao = ID_HOST_PADRAO;

        constructor(opcoes = {}) {
            if (opcoes && typeof opcoes.idHostPadrao === 'string' && opcoes.idHostPadrao.trim()) {
                this.#idHostPadrao = opcoes.idHostPadrao.trim();
            }
        }

        static get NULL_OBJECT() {
            return NULL_UI_TELA;
        }

        static get funcaoInjecaoNaTela() {
            return funcaoInjecaoNaTela;
        }

        static get funcaoOcultarNaTela() {
            return funcaoOcultarNaTela;
        }

        /**
         * Uso no Service Worker (background.js): injeta mensagem "Na Tela" diretamente
         * no frame principal (frameId: 0) da aba especificada, independente de iframes.
         */
        async exibirNaAba(tabId, opcoes = {}) {
            try {
                if (typeof tabId !== 'number' || tabId < 0) return false;
                if (typeof chrome === 'undefined' || !chrome.scripting || typeof chrome.scripting.executeScript !== 'function') {
                    return false;
                }
                const payload = {
                    idHost: (opcoes && opcoes.idHost) || this.#idHostPadrao,
                    mensagem: String((opcoes && opcoes.mensagem) || ''),
                    corBorda: String((opcoes && opcoes.corBorda) || '#3b82f6'),
                    duracaoMs: (opcoes && typeof opcoes.duracaoMs === 'number') ? opcoes.duracaoMs : -1,
                    posicao: String((opcoes && opcoes.posicao) || 'topo_centro')
                };
                if (!payload.mensagem.trim()) return false;
                await chrome.scripting.executeScript({
                    target: { tabId, frameIds: [0] },
                    func: funcaoInjecaoNaTela,
                    args: [payload]
                });
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Uso no Service Worker (background.js): oculta mensagem "Na Tela" no frame principal (frameId: 0).
         */
        async ocultarNaAba(tabId, idHost = null) {
            try {
                if (typeof tabId !== 'number' || tabId < 0) return false;
                if (typeof chrome === 'undefined' || !chrome.scripting || typeof chrome.scripting.executeScript !== 'function') {
                    return false;
                }
                await chrome.scripting.executeScript({
                    target: { tabId, frameIds: [0] },
                    func: funcaoOcultarNaTela,
                    args: [idHost || this.#idHostPadrao]
                });
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Uso em Content Scripts (qualquer frame/iframe): solicita ao Background Service Worker
         * a projeção no frame 0 (window.top). Se bloqueado por segurança/ambiente, executa fallback local seguro.
         */
        async exibirNaTela(opcoes = {}) {
            const payload = {
                idHost: (opcoes && opcoes.idHost) || this.#idHostPadrao,
                mensagem: String((opcoes && opcoes.mensagem) || ''),
                corBorda: String((opcoes && opcoes.corBorda) || '#3b82f6'),
                duracaoMs: (opcoes && typeof opcoes.duracaoMs === 'number') ? opcoes.duracaoMs : -1,
                posicao: String((opcoes && opcoes.posicao) || 'topo_centro')
            };
            if (!payload.mensagem.trim()) return false;

            const ehHeadless = (typeof window !== 'undefined' && Boolean(window.__TESTE_HEADLESS__));
            if (!ehHeadless && typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                try {
                    const resp = await new Promise((resolve) => {
                        chrome.runtime.sendMessage({ acao: 'EXIBIR_MENSAGEM_NA_TELA', payload }, (r) => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                                resolve(null);
                                return;
                            }
                            resolve(r || null);
                        });
                    });
                    if (resp && resp.ok) {
                        return true;
                    }
                } catch (_) { }
            }

            /* Fallback seguro (try/catch) caso IPC esteja indisponível ou bloqueado por segurança */
            try {
                return funcaoInjecaoNaTela(payload);
            } catch (_) {
                return false;
            }
        }

        async ocultarNaTela(idHost = null) {
            const alvoId = idHost || this.#idHostPadrao;
            const ehHeadless = (typeof window !== 'undefined' && Boolean(window.__TESTE_HEADLESS__));
            if (!ehHeadless && typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                try {
                    chrome.runtime.sendMessage({ acao: 'OCULTAR_MENSAGEM_NA_TELA', idHost: alvoId }).catch(() => { });
                } catch (_) { }
            }
            try {
                return funcaoOcultarNaTela(alvoId);
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(GerenciadorUiTela.prototype);
    return Object.freeze(GerenciadorUiTela);
}));
