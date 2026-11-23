/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-historico-abas.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Navegador — Histórico MRU de Abas Ativas e Navegação Circular
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-historico-abas.js
 * - Classe Exportada: NavegadorHistoricoAbas (self.JusGovNavegadorHistoricoAbas) extends BaseModulo
 * - Métodos Públicos: _carregarHistoricoSession, _salvarHistoricoSession, inicializarHistoricoAbasAtivas, registrarAbaAtivadaHistorico, removerAbaHistorico, alternarParaUltimaAbaAtiva, navegarAbaCircular, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovNavegadorHistoricoAbas = fabrica(raiz);
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

    class NavegadorHistoricoAbas extends Base {
        constructor() {
            super('NavegadorHistoricoAbas');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(NavegadorHistoricoAbas.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(NavegadorHistoricoAbas.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        async _carregarHistoricoSession(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!this._histAbas) {
                this._histAbas = { currentTabId: null, previousTabId: null, porJanela: {} };
            }
            if (this._histCarregado || !chromeApi || !chromeApi.storage || !chromeApi.storage.session) {
                return this._histAbas;
            }
            try {
                const res = await chromeApi.storage.session.get('jusgovHistoricoAbasAtivas');
                if (res && res.jusgovHistoricoAbasAtivas && typeof res.jusgovHistoricoAbasAtivas === 'object') {
                    const dados = res.jusgovHistoricoAbasAtivas;
                    this._histAbas.currentTabId = dados.currentTabId || null;
                    this._histAbas.previousTabId = dados.previousTabId || null;
                    this._histAbas.porJanela = (dados.porJanela && typeof dados.porJanela === 'object') ? { ...dados.porJanela } : {};
                }
                this._histCarregado = true;
            } catch (_) { }
            return this._histAbas;
        }

        _salvarHistoricoSession(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!this._histAbas || !chromeApi || !chromeApi.storage || !chromeApi.storage.session) return;
            try {
                chromeApi.storage.session.set({ jusgovHistoricoAbasAtivas: this._histAbas }).catch(() => { });
            } catch (_) { }
        }

        async inicializarHistoricoAbasAtivas(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const hist = await this._carregarHistoricoSession(chromeApi);
            if (chromeApi && chromeApi.tabs && typeof chromeApi.tabs.query === 'function') {
                try {
                    const abas = await chromeApi.tabs.query({ active: true, lastFocusedWindow: true });
                    if (Array.isArray(abas) && abas.length > 0 && abas[0].id) {
                        const aba = abas[0];
                        if (!hist.currentTabId) hist.currentTabId = aba.id;
                        const winKey = aba.windowId ? String(aba.windowId) : null;
                        if (winKey) {
                            if (!hist.porJanela[winKey]) {
                                hist.porJanela[winKey] = { currentTabId: aba.id, previousTabId: null };
                            } else if (!hist.porJanela[winKey].currentTabId) {
                                hist.porJanela[winKey].currentTabId = aba.id;
                            }
                        }
                        this._salvarHistoricoSession(chromeApi);
                    }
                } catch (_) { }
            }
        }

        async registrarAbaAtivadaHistorico(activeInfo, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!activeInfo || !activeInfo.tabId) return;
            const hist = await this._carregarHistoricoSession(chromeApi);
            const winKey = activeInfo.windowId ? String(activeInfo.windowId) : null;
            if (winKey) {
                if (!hist.porJanela[winKey]) {
                    hist.porJanela[winKey] = { currentTabId: null, previousTabId: null };
                }
                const winHist = hist.porJanela[winKey];
                if (winHist.currentTabId && winHist.currentTabId !== activeInfo.tabId) {
                    winHist.previousTabId = winHist.currentTabId;
                }
                winHist.currentTabId = activeInfo.tabId;
            }
            if (hist.currentTabId && hist.currentTabId !== activeInfo.tabId) {
                hist.previousTabId = hist.currentTabId;
            }
            hist.currentTabId = activeInfo.tabId;
            this._salvarHistoricoSession(chromeApi);
        }

        async removerAbaHistorico(tabId, removeInfo = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!tabId) return;
            const hist = await this._carregarHistoricoSession(chromeApi);
            if (hist.currentTabId === tabId) hist.currentTabId = null;
            if (hist.previousTabId === tabId) hist.previousTabId = null;
            const winKey = removeInfo && removeInfo.windowId ? String(removeInfo.windowId) : null;
            if (winKey && hist.porJanela[winKey]) {
                if (hist.porJanela[winKey].currentTabId === tabId) hist.porJanela[winKey].currentTabId = null;
                if (hist.porJanela[winKey].previousTabId === tabId) hist.porJanela[winKey].previousTabId = null;
            }
            this._salvarHistoricoSession(chromeApi);
        }

        async alternarParaUltimaAbaAtiva(windowIdOpcional = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!api || !api.tabs) return false;
            const hist = await this._carregarHistoricoSession(api);
            let alvoTabId = null;
            const winKey = windowIdOpcional ? String(windowIdOpcional) : null;
            if (winKey && hist.porJanela[winKey] && hist.porJanela[winKey].previousTabId) {
                alvoTabId = hist.porJanela[winKey].previousTabId;
            }
            if (!alvoTabId) alvoTabId = hist.previousTabId;
            if (!alvoTabId) return false;
            try {
                const tab = await api.tabs.get(alvoTabId);
                if (!tab) throw new Error('Tab ausente');
                await api.tabs.update(alvoTabId, { active: true });
                return true;
            } catch (_) {
                if (hist.previousTabId === alvoTabId) hist.previousTabId = null;
                if (winKey && hist.porJanela[winKey] && hist.porJanela[winKey].previousTabId === alvoTabId) {
                    hist.porJanela[winKey].previousTabId = null;
                }
                this._salvarHistoricoSession(api);
                return false;
            }
        }

        async navegarAbaCircular(direcao, sender = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const api = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!api || !api.tabs || (direcao !== 'anterior' && direcao !== 'proxima')) return false;
            const windowId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : undefined;
            const queryInfo = (windowId !== undefined) ? { windowId } : { lastFocusedWindow: true };
            try {
                const abas = await api.tabs.query(queryInfo);
                if (!abas || abas.length <= 1) return false;
                abas.sort((a, b) => a.index - b.index);
                let idxAtiva = abas.findIndex(t => t.active);
                if (idxAtiva === -1 && sender && sender.tab && sender.tab.id) {
                    idxAtiva = abas.findIndex(t => t.id === sender.tab.id);
                }
                if (idxAtiva === -1) idxAtiva = 0;
                const novoIdx = (direcao === 'anterior')
                    ? (idxAtiva - 1 + abas.length) % abas.length
                    : (idxAtiva + 1) % abas.length;
                const abaDestino = abas[novoIdx];
                if (abaDestino && abaDestino.id) {
                    await api.tabs.update(abaDestino.id, { active: true });
                    return true;
                }
            } catch (_) { }
            return false;
        }
    }

    Object.freeze(NavegadorHistoricoAbas.prototype);
    return Object.freeze(NavegadorHistoricoAbas);
}));