/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-acoes-abas.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Navegador — Abertura, Ativação e Download de Links em Abas
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-acoes-abas.js
 * - Classe Exportada: NavegadorAcoesAbas (self.JusGovNavegadorAcoesAbas) extends BaseModulo
 * - Métodos Públicos: obterWindowIdAlvo, verificarOuAtivarAba, abrirNovaAba, baixarLink, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovNavegadorAcoesAbas = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    class NavegadorAcoesAbas extends Base {
        constructor() {
            super('NavegadorAcoesAbas');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(NavegadorAcoesAbas.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(NavegadorAcoesAbas.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        async obterWindowIdAlvo(sender = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (sender && sender.tab && sender.tab.windowId) return sender.tab.windowId;
            if (api && api.windows && typeof api.windows.getLastFocused === 'function') {
                try {
                    const ativa = await api.windows.getLastFocused({ windowTypes: ['normal'] });
                    return ativa ? ativa.id : null;
                } catch (_) { }
            }
            return null;
        }

        async verificarOuAtivarAba(urlAlvo, sender = null, config = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const cfg = config || this._p_configuracoes || {};
            if (!api || !api.tabs || !urlAlvo || cfg.reutilizarAbasAbertas !== true) {
                return { reutilizada: false };
            }
            try {
                const antiDup = this._p_antiDuplicacao;
                const normalizador = (antiDup && typeof antiDup.normalizarUrlParaComparacao === 'function')
                    ? (u) => antiDup.normalizarUrlParaComparacao(u)
                    : (u) => String(u || '').trim().toLowerCase();
                const mapaAbas = (antiDup && typeof antiDup.obterMapaAbasUrls === 'function')
                    ? antiDup.obterMapaAbasUrls()
                    : new Map();
                const urlAlvoNorm = normalizador(urlAlvo);
                if (!urlAlvoNorm) return { reutilizada: false };

                const windowId = sender && sender.tab ? sender.tab.windowId : undefined;
                const abas = await api.tabs.query(windowId ? { windowId } : {});
                const monitorarOrig = Boolean(cfg.monitorarUrlOriginalAbertura);
                const monitorarAtual = (cfg.monitorarUrlAtualPagina !== false);
                const abaExistente = abas.find(t => {
                    const reg = mapaAbas.get(t.id);
                    const uAtual = normalizador(t.url || t.pendingUrl || '');
                    if (monitorarAtual && urlAlvoNorm === uAtual) return true;
                    if (monitorarOrig && reg) {
                        const uOrig = reg.urlOriginal || '';
                        const uRegAtual = reg.urlAtual || '';
                        return (urlAlvoNorm === uOrig || urlAlvoNorm === uRegAtual);
                    }
                    return false;
                });
                if (abaExistente) {
                    const emPrimeiroPlano = (cfg.abaEmPrimeiroPlano !== undefined)
                        ? Boolean(cfg.abaEmPrimeiroPlano)
                        : (cfg.abaEmSegundoPlano === false);
                    if (emPrimeiroPlano) {
                        await api.tabs.update(abaExistente.id, { active: true });
                        if (abaExistente.windowId && !(sender && sender.url && sender.url.includes('options.html')) && api.windows) {
                            await api.windows.update(abaExistente.windowId, { focused: true });
                        }
                    }
                    return { reutilizada: true, tabId: abaExistente.id };
                }
            } catch (_) { }
            return { reutilizada: false };
        }

        async abrirNovaAba(urlBruta, sender = null, config = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!api || !api.tabs || !urlBruta) return false;
            try {
                const urlAlvo = (sender && sender.tab && sender.tab.url) ? new URL(urlBruta, sender.tab.url).href : urlBruta;
                const cfg = config || this._p_configuracoes || {};
                const emPrimeiroPlano = (cfg.abaEmPrimeiroPlano !== undefined)
                    ? Boolean(cfg.abaEmPrimeiroPlano)
                    : (cfg.abaEmSegundoPlano === false);
                const optsCreate = { url: urlAlvo, active: emPrimeiroPlano };
                if (sender && sender.tab && typeof sender.tab.id === 'number') {
                    optsCreate.openerTabId = sender.tab.id;
                }
                await api.tabs.create(optsCreate);
                return true;
            } catch (_) {
                return false;
            }
        }

        async baixarLink(urlBruta, sender = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!api || !urlBruta) return false;
            try {
                const urlAlvo = (sender && sender.tab && sender.tab.url) ? new URL(urlBruta, sender.tab.url).href : urlBruta;
                if (api.downloads && typeof api.downloads.download === 'function') {
                    try {
                        await api.downloads.download({ url: urlAlvo });
                        return true;
                    } catch (_) { }
                }
                if (api.tabs && typeof api.tabs.create === 'function') {
                    await api.tabs.create({ url: urlAlvo, active: false });
                    return true;
                }
            } catch (_) { }
            return false;
        }
    }

    Object.freeze(NavegadorAcoesAbas.prototype);
    return Object.freeze(NavegadorAcoesAbas);
}));