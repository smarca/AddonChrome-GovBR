/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-ordenacao-dominios.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Navegador — Extração de Domínios e Comparadores de Ordenação
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-ordenacao-dominios.js
 * - Classe Exportada: NavegadorOrdenacaoDominios (self.JusGovNavegadorOrdenacaoDominios) extends BaseModulo
 * - Métodos Públicos: extrairDominio, extrairInfoDominio, compararAbasParaOrdenacao, registrarCriacaoAba, compararPorCriacaoCronologica, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovNavegadorOrdenacaoDominios = fabrica(raiz);
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

    class NavegadorOrdenacaoDominios extends Base {
        constructor() {
            super('NavegadorOrdenacaoDominios');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(NavegadorOrdenacaoDominios.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(NavegadorOrdenacaoDominios.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Extrai domínio limpo para agrupamento e ordenação simples
         * @param {string} urlStr
         * @returns {string}
         */
        extrairDominio(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') return 'desconhecido';
            try {
                const u = new URL(urlStr);
                return u.hostname.replace(/^www\./, '').toLowerCase();
            } catch (_) {
                return 'desconhecido';
            }
        }

        /**
         * FUNÇÃO: extrairInfoDominio
         * OBJETIVO: Decompor uma URL em base de domínio (ex: 'trf1.jus.br'), subdomínio ('pje1g', 'www'),
         * flag indicando se é domínio puro/raiz (sem subdomínios adicionais) e o caminho completo.
         * Suporta domínios públicos brasileiros (.jus.br, .gov.br, .leg.br, .mp.br, .com.br, etc.).
         * @param {string} urlStr
         * @returns {Object}
         */
        extrairInfoDominio(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') {
                return { baseDominio: '', subDominio: '', ehPuro: true, caminho: '', urlNormalizada: '' };
            }
            try {
                const u = new URL(urlStr);
                const host = (u.hostname || '').toLowerCase();
                const caminho = (u.pathname + u.search + u.hash).toLowerCase();

                const partes = host.split('.').filter(Boolean);
                if (partes.length <= 1 || /^[\d.]+$/.test(host)) {
                    return { baseDominio: host, subDominio: '', ehPuro: true, caminho, urlNormalizada: u.href.toLowerCase() };
                }

                // Detecta sufixos ccTLD/SLD comuns (.jus.br, .gov.br, .leg.br, .mp.br, .com.br, etc.)
                const rsOrd = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                    ? JusGovCfgDefaults.obterRegrasSistema()
                    : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
                const sufixosSld = (rsOrd && rsOrd.ordenacaoGuias && Array.isArray(rsOrd.ordenacaoGuias.sufixosSld))
                    ? rsOrd.ordenacaoGuias.sufixosSld
                    : ['jus', 'leg', 'mp', 'gov', 'def', 'mil', 'edu', 'com', 'org', 'net', 'adv'];
                let numSufixo = 1;
                const penultima = partes[partes.length - 2];
                const ultima = partes[partes.length - 1];
                if (ultima.length === 2 && (penultima.length <= 3 || sufixosSld.includes(penultima))) {
                    numSufixo = 2; // ex: jus.br
                }

                const indiceBase = Math.max(0, partes.length - numSufixo - 1);
                const baseDominio = partes.slice(indiceBase).join('.');
                const subDominio = partes.slice(0, indiceBase).join('.');
                const ehPuro = (subDominio === '');

                return {
                    baseDominio,
                    subDominio,
                    ehPuro,
                    caminho,
                    urlNormalizada: u.href.toLowerCase()
                };
            } catch (_) {
                return { baseDominio: urlStr.toLowerCase(), subDominio: '', ehPuro: true, caminho: '', urlNormalizada: urlStr.toLowerCase() };
            }
        }

        /**
         * FUNÇÃO: compararAbasParaOrdenacao
         * OBJETIVO: Comparador determinístico avançado para reordenação de abas do navegador.
         * Garante que em ordenação por domínio ou URL, o domínio puro/raiz venha sempre antes dos subdomínios,
         * seguido do restante e do caminho completo quando aplicável.
         * @param {Object} a
         * @param {Object} b
         * @param {string} [criterio]
         * @param {string} [sentido]
         * @param {Map} [mapa]
         * @returns {number}
         */
        compararAbasParaOrdenacao(a, b, criterio = this._p_criterio, sentido = this._p_sentido, mapa = null) {
            const crit = this.normalizarCriterio(criterio);
            const urlA = a.url || a.pendingUrl || '';
            const urlB = b.url || b.pendingUrl || '';

            // Regra Absoluta: guias chrome-extension: sempre em primeiro (na primeira guia não fixada)
            const extA = this.ehUrlExtensao(urlA);
            const extB = this.ehUrlExtensao(urlB);
            if (extA && !extB) return -1;
            if (!extA && extB) return 1;
            if (extA && extB) {
                return -this.compararPorCriacaoCronologica(a, b, mapa);
            }

            const regA = mapa ? mapa.get(a.id) : null;
            const regB = mapa ? mapa.get(b.id) : null;

            const extrairTimestampNavegacao = (tab, reg) => {
                const navLocal = this._p_navegacaoPorAba.get(tab.id);
                if (typeof navLocal === 'number' && navLocal > 0) return navLocal;
                if (reg && reg.ultimoAcessoNavegacao) return reg.ultimoAcessoNavegacao;
                if (reg && reg.modificadaEm) return reg.modificadaEm;
                if (reg && reg.criadaEm) return reg.criadaEm;
                return tab.lastAccessed || 0;
            };

            const extrairTimestampAtivacao = (tab) => {
                const ativLocal = this._p_ativacaoPorAba.get(tab.id);
                if (typeof ativLocal === 'number' && ativLocal > 0) return ativLocal;
                return tab.lastAccessed || 0;
            };

            if (crit === 'titulo') {
                const titA = (a.title || '').toLowerCase();
                const titB = (b.title || '').toLowerCase();
                const cmp = titA.localeCompare(titB);
                return (sentido === 'dir_esq') ? -cmp : cmp;
            }

            if (crit === 'ordem_criacao') {
                const cmpCriacao = this.compararPorCriacaoCronologica(a, b, mapa);
                return (sentido === 'dir_esq') ? cmpCriacao : -cmpCriacao;
            }

            if (crit === 'tempo_acesso') {
                const tA = extrairTimestampNavegacao(a, regA);
                const tB = extrairTimestampNavegacao(b, regB);
                return (sentido === 'dir_esq') ? (tA - tB) : (tB - tA);
            }

            if (crit === 'ultima_ativacao') {
                const tA = extrairTimestampAtivacao(a);
                const tB = extrairTimestampAtivacao(b);
                return (sentido === 'dir_esq') ? (tA - tB) : (tB - tA);
            }

            // Critérios baseados em Domínio: 'dominio_criacao', 'url', 'dominio_titulo', 'dominio_acesso', 'dominio_ativacao'
            const infoA = this.extrairInfoDominio(urlA);
            const infoB = this.extrairInfoDominio(urlB);

            // 1. Agrupamento pelo Base Domínio (ex: 'trf1.jus.br' agrupado)
            const cmpBase = infoA.baseDominio.localeCompare(infoB.baseDominio);
            if (cmpBase !== 0) {
                return (sentido === 'dir_esq') ? -cmpBase : cmpBase;
            }

            // 2. Sub-critérios subordinados ao Domínio:
            if (crit === 'dominio_titulo') {
                const titA = (a.title || '').toLowerCase();
                const titB = (b.title || '').toLowerCase();
                const cmpTit = titA.localeCompare(titB);
                return (sentido === 'dir_esq') ? -cmpTit : cmpTit;
            }

            if (crit === 'dominio_criacao') {
                const cmpDomCriacao = this.compararPorCriacaoCronologica(a, b, mapa);
                return (sentido === 'dir_esq') ? cmpDomCriacao : -cmpDomCriacao;
            }

            if (crit === 'dominio_acesso') {
                const tA = extrairTimestampNavegacao(a, regA);
                const tB = extrairTimestampNavegacao(b, regB);
                return (sentido === 'dir_esq') ? (tA - tB) : (tB - tA);
            }

            if (crit === 'dominio_ativacao') {
                const tA = extrairTimestampAtivacao(a);
                const tB = extrairTimestampAtivacao(b);
                return (sentido === 'dir_esq') ? (tA - tB) : (tB - tA);
            }

            // 3. URL Completa: Domínio Puro antes dos subdomínios, seguido pelo caminho completo
            if (infoA.ehPuro && !infoB.ehPuro) return (sentido === 'dir_esq') ? 1 : -1;
            if (!infoA.ehPuro && infoB.ehPuro) return (sentido === 'dir_esq') ? -1 : 1;

            const cmpSub = infoA.subDominio.localeCompare(infoB.subDominio);
            if (cmpSub !== 0) {
                return (sentido === 'dir_esq') ? -cmpSub : cmpSub;
            }
            const cmpCam = infoA.caminho.localeCompare(infoB.caminho);
            return (sentido === 'dir_esq') ? -cmpCam : cmpCam;
        }

        /**
         * Registra timestamp monotônico local de criação da aba sem misturar Epoch ms com tab.id.
         * @param {number} tabId
         * @param {number|null} [tsCustom]
         */
        registrarCriacaoAba(tabId, tsCustom = null) {
            if (typeof tabId !== 'number') return;
            const anterior = this._p_criacaoPorAba.get(tabId);
            if (anterior !== undefined && tsCustom === null) return;
            this._p_seqCriacao += 1;
            const base = (typeof tsCustom === 'number' && Number.isFinite(tsCustom)) ? tsCustom : Date.now();
            this._p_criacaoPorAba.set(tabId, base * 1000 + (this._p_seqCriacao % 1000));
        }

        /**
         * Compara duas abas cronologicamente sem jamais misturar Epoch ms com tab.id pequeno (BUG-68).
         * @param {Object} a
         * @param {Object} b
         * @param {Map|null} [mapa]
         * @returns {number} <0 se A mais antiga, >0 se B mais antiga
         */
        compararPorCriacaoCronologica(a, b, mapa = null) {
            const extrairInfoTempo = (tab) => {
                const reg = (mapa && typeof mapa.get === 'function') ? mapa.get(tab.id) : null;
                if (reg && typeof reg.criadaEm === 'number' && Number.isFinite(reg.criadaEm)) {
                    return { temTs: true, val: reg.criadaEm * 1000 };
                }
                const seqSalva = this._p_criacaoPorAba.get(tab.id);
                if (typeof seqSalva === 'number' && Number.isFinite(seqSalva)) {
                    return { temTs: true, val: seqSalva };
                }
                const ordemVisual = (typeof tab.index === 'number') ? tab.index : (tab.id || 0);
                return { temTs: false, val: ordemVisual };
            };

            const infoA = extrairInfoTempo(a);
            const infoB = extrairInfoTempo(b);

            if (infoA.temTs !== infoB.temTs) {
                /* Aba preexistente não rastreada (temTs=false) precede aba criada depois na sessão */
                return infoA.temTs ? 1 : -1;
            }
            const diff = infoA.val - infoB.val;
            if (diff !== 0) return diff;
            const idxDiff = (Number(a.index || 0)) - (Number(b.index || 0));
            return (idxDiff !== 0) ? idxDiff : ((a.id || 0) - (b.id || 0));
        }
    }

    Object.freeze(NavegadorOrdenacaoDominios.prototype);
    return Object.freeze(NavegadorOrdenacaoDominios);
}));