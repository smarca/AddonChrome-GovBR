/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-urls-normalizacao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Navegador — Normalização de URLs e Desempate Anti-Duplicação
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-urls-normalizacao.js
 * - Classe Exportada: NavegadorUrlsNormalizacao (self.JusGovNavegadorUrlsNormalizacao) extends BaseModulo
 * - Métodos Públicos: normalizarUrl, normalizarUrlParaComparacao, selecionarEleitaPorDesempate, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovNavegadorUrlsNormalizacao = fabrica(raiz);
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

    class NavegadorUrlsNormalizacao extends Base {
        constructor() {
            super('NavegadorUrlsNormalizacao');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(NavegadorUrlsNormalizacao.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(NavegadorUrlsNormalizacao.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Normaliza URLs para comparação descartando fragmentos de hash e parâmetros irrelevantes
         * @param {string} urlStr
         * @returns {string}
         */
        normalizarUrl(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') return '';
            try {
                const u = new URL(urlStr);
                return (u.origin + u.pathname).toLowerCase().replace(/\/+$/, '');
            } catch (_) {
                return urlStr.split('#')[0].split('?')[0].toLowerCase().trim().replace(/\/+$/, '');
            }
        }

        /**
         * FUNÇÃO: normalizarUrlParaComparacao
         * OBJETIVO DE RECONSTRUÇÃO: Sanitizar URLs removendo barras finais, ordenando parâmetros
         * de busca e eliminando tokens efêmeros de rastreamento (tracking como utm_* e fbclid)
         * a fim de comparar com precisão cirúrgica URLs originais e atuais de abas judiciais.
         * @param {string} urlStr
         * @returns {string}
         */
        normalizarUrlParaComparacao(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') return '';
            try {
                const u = new URL(urlStr);
                let caminho = u.pathname;
                if (caminho.length > 1 && caminho.endsWith('/')) {
                    caminho = caminho.slice(0, -1);
                }
                /* Remove parâmetros efêmeros de rastreamento que geram falsos negativos em tribunais */
                const rs = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                    ? JusGovCfgDefaults.obterRegrasSistema()
                    : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
                const paramsParaRemover = (rs && rs.antiDuplicacao && Array.isArray(rs.antiDuplicacao.paramsRemover))
                    ? rs.antiDuplicacao.paramsRemover
                    : ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_cid', 'ts', 'ca'];
                const params = new URLSearchParams(u.search);
                paramsParaRemover.forEach(p => params.delete(p));
                params.delete('ca');
                if (caminho.toLowerCase().includes('/pje/') && params.has('idProcesso')) {
                    params.delete('idTaskInstance');
                }
                params.sort();
                const buscaLimpa = params.toString() ? ('?' + params.toString()) : '';
                return (u.origin + caminho + buscaLimpa).toLowerCase();
            } catch (_) {
                return urlStr.trim().toLowerCase();
            }
        }

        /**
         * FEAT-74: Desempate estrito em duplicidade ->
         * 1) guia protegida (active/pinned); 2) mais recentemente navegada (ultimoAcessoNavegacao);
         * 3) mais recentemente acessada (tab.lastAccessed / ultimoAcessoFoco).
         * @param {Array<Object>} candidatas
         * @returns {Object|null}
         */
        selecionarEleitaPorDesempate(candidatas) {
            if (!Array.isArray(candidatas) || candidatas.length === 0) return null;
            const protegidas = candidatas.filter(t => t.active || t.pinned);
            const basePool = protegidas.length > 0 ? protegidas : candidatas;
            let melhor = basePool[0];
            for (let idx = 1; idx < basePool.length; idx++) {
                const atual = basePool[idx];
                if (atual.active && !melhor.active) { melhor = atual; continue; }
                if (melhor.active && !atual.active) continue;
                const regA = this._p_mapaAbasUrls.get(atual.id);
                const regM = this._p_mapaAbasUrls.get(melhor.id);
                const navA = Number((regA && regA.ultimoAcessoNavegacao) ?? atual.ultimoAcessoNavegacao) || 0;
                const navM = Number((regM && regM.ultimoAcessoNavegacao) ?? melhor.ultimoAcessoNavegacao) || 0;
                if (navA !== navM) {
                    if (navA > navM) melhor = atual;
                    continue;
                }
                const accA = Number(atual.lastAccessed) || (regA && Number(regA.ultimoAcessoFoco)) || 0;
                const accM = Number(melhor.lastAccessed) || (regM && Number(regM.ultimoAcessoFoco)) || 0;
                if (accA > accM) {
                    melhor = atual;
                }
            }
            return melhor;
        }
    }

    Object.freeze(NavegadorUrlsNormalizacao.prototype);
    return Object.freeze(NavegadorUrlsNormalizacao);
}));