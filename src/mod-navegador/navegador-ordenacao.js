/* ==========================================================================
 * Nome do arquivo: navegador-ordenacao.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-ordenacao.js
 * - Classe Exportada: GerenciadorOrdenacaoGuias (self.JusGovGerenciadorOrdenacaoGuias)
 * - Métodos Públicos: extrairDominio, extrairInfoDominio, agruparPorDominio, desagruparTodas,
 *   compararAbasParaOrdenacao, agendarOrdenacaoAbas, executarOrdenacaoGuias,
 *   get/set criterio/sentido/ordenarGuiasFixadas
 * - APIs Chrome Usadas: chrome.tabs.query, chrome.tabs.group, chrome.tabs.ungroup, chrome.tabs.move, chrome.tabGroups.update
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.47, Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Organiza e ordena as guias da janela ativa com base no critério (domínio, URL, criação,
 *    acesso ou título) e sentido configurados (A-Z ou Z-A), integrando-se nativamente com a
 *    API de Grupos de Abas do Chrome (Tab Groups API).
 * 2) SUPORTE A TAB GROUPS:
 *    Permite agrupar guias por domínio em caixas coloridas com nomes auto-descritivos ou
 *    desagrupá-las sob demanda de forma segura sem fechá-las.
 * 3) DETERMINISMO DE ORDENAÇÃO:
 *    Garante que em ordenação por domínio, o domínio puro/raiz venha sempre antes dos subdomínios,
 *    com tratamento debounced para prevenir re-entrâncias durante navegação intensa.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-navegador)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovGerenciadorOrdenacaoGuias = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorOrdenacaoGuias {
        #criterio = 'nenhum'; // 'nenhum', 'dominio', 'url', 'titulo', 'dominio_criacao', 'dominio_acesso'
        #sentido = 'esq_dir';  // 'esq_dir' (A-Z / Antigos), 'dir_esq' (Z-A / Recentes)
        #ordenarGuiasFixadas = false;
        #timerOrdenacaoAbas = null;
        #estaOrdenandoGuias = false;

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.criterio === 'string') this.#criterio = opcoes.criterio;
            if (typeof opcoes.sentido === 'string') this.#sentido = opcoes.sentido;
            if (typeof opcoes.ordenarGuiasFixadas === 'boolean') this.#ordenarGuiasFixadas = opcoes.ordenarGuiasFixadas;
        }

        get criterio() { return this.#criterio; }
        set criterio(v) { this.#criterio = String(v); }

        get sentido() { return this.#sentido; }
        set sentido(v) { this.#sentido = String(v); }

        get ordenarGuiasFixadas() { return this.#ordenarGuiasFixadas; }
        set ordenarGuiasFixadas(v) { this.#ordenarGuiasFixadas = Boolean(v); }

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
                let numSufixo = 1;
                const penultima = partes[partes.length - 2];
                const ultima = partes[partes.length - 1];
                if (ultima.length === 2 && (penultima.length <= 3 || ['jus', 'leg', 'mp', 'gov', 'def', 'mil', 'edu', 'com', 'org', 'net', 'adv'].includes(penultima))) {
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
        compararAbasParaOrdenacao(a, b, criterio = this.#criterio, sentido = this.#sentido, mapa = null) {
            const regA = mapa ? mapa.get(a.id) : null;
            const regB = mapa ? mapa.get(b.id) : null;

            const extrairTimestampNavegacao = (tab, reg) => {
                if (reg && reg.ultimoAcessoNavegacao) return reg.ultimoAcessoNavegacao;
                if (reg && reg.modificadaEm) return reg.modificadaEm;
                if (reg && reg.criadaEm) return reg.criadaEm;
                return tab.lastAccessed || 0;
            };

            const extrairTimestampCriacao = (tab, reg) => {
                if (reg && reg.criadaEm) return reg.criadaEm;
                return tab.id || 0;
            };

            if (criterio === 'titulo') {
                const titA = (a.title || '').toLowerCase();
                const titB = (b.title || '').toLowerCase();
                const cmp = titA.localeCompare(titB);
                return (sentido === 'dir_esq') ? -cmp : cmp;
            }

            if (criterio === 'ordem_criacao') {
                const tA = extrairTimestampCriacao(a, regA);
                const tB = extrairTimestampCriacao(b, regB);
                return (sentido === 'dir_esq') ? (tB - tA) : (tA - tB);
            }

            if (criterio === 'tempo_acesso') {
                const tA = extrairTimestampNavegacao(a, regA);
                const tB = extrairTimestampNavegacao(b, regB);
                return (sentido === 'dir_esq') ? (tB - tA) : (tA - tB);
            }

            // Critérios baseados em Domínio: 'dominio', 'url', 'dominio_criacao', 'dominio_acesso'
            const infoA = this.extrairInfoDominio(a.url || a.pendingUrl || '');
            const infoB = this.extrairInfoDominio(b.url || b.pendingUrl || '');

            // 1. Agrupamento pelo Base Domínio (ex: 'trf1.jus.br' agrupado)
            const cmpBase = infoA.baseDominio.localeCompare(infoB.baseDominio);
            if (cmpBase !== 0) {
                return (sentido === 'dir_esq') ? -cmpBase : cmpBase;
            }

            // 2. Mesmo Domínio: O Domínio Puro SEMPRE vem em primeiro lugar!
            if (infoA.ehPuro && !infoB.ehPuro) return -1;
            if (!infoA.ehPuro && infoB.ehPuro) return 1;

            // 3. Sub-critérios subordinados ao Domínio:
            if (criterio === 'dominio_criacao') {
                const tA = extrairTimestampCriacao(a, regA);
                const tB = extrairTimestampCriacao(b, regB);
                return (sentido === 'dir_esq') ? (tB - tA) : (tA - tB);
            }

            if (criterio === 'dominio_acesso') {
                const tA = extrairTimestampNavegacao(a, regA);
                const tB = extrairTimestampNavegacao(b, regB);
                return (sentido === 'dir_esq') ? (tB - tA) : (tA - tB);
            }

            if (criterio === 'url') {
                const cmpSub = infoA.subDominio.localeCompare(infoB.subDominio);
                if (cmpSub !== 0) {
                    return (sentido === 'dir_esq') ? -cmpSub : cmpSub;
                }
                const cmpCam = infoA.caminho.localeCompare(infoB.caminho);
                return (sentido === 'dir_esq') ? -cmpCam : cmpCam;
            }

            // Critério padrão 'dominio': compara subdomínios
            const cmpSub = infoA.subDominio.localeCompare(infoB.subDominio);
            return (sentido === 'dir_esq') ? -cmpSub : cmpSub;
        }

        /**
         * Agenda ordenação de abas com debouncing
         * @param {number} windowId
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         * @param {Map} [mapaAbasUrls]
         */
        agendarOrdenacaoAbas(windowId, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), mapaAbasUrls = null) {
            const criterio = config.criterioOrdenacaoGuias || this.#criterio;
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this.#timerOrdenacaoAbas) clearTimeout(this.#timerOrdenacaoAbas);
            this.#timerOrdenacaoAbas = setTimeout(async () => {
                this.#timerOrdenacaoAbas = null;
                try {
                    await this.executarOrdenacaoGuias(windowId, config, chromeApi, mapaAbasUrls);
                } catch (_) { }
            }, 450);
        }

        /**
         * Executa a reordenação das abas na janela
         * @param {number} windowId
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         * @param {Map} [mapaAbasUrls]
         */
        async executarOrdenacaoGuias(windowId, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), mapaAbasUrls = null) {
            const criterio = config.criterioOrdenacaoGuias || this.#criterio;
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this.#estaOrdenandoGuias) return;
            this.#estaOrdenandoGuias = true;

            try {
                const sentido = config.sentidoOrdenacaoGuias || this.#sentido || 'esq_dir';
                const ordenarFixadas = (config.ordenarGuiasFixadas !== undefined) ? Boolean(config.ordenarGuiasFixadas) : this.#ordenarGuiasFixadas;

                if (criterio === 'agrupar_dominio') {
                    await this.agruparPorDominio(windowId, chromeApi);
                    return;
                }

                if (!chromeApi || !chromeApi.tabs) return;

                const abas = await chromeApi.tabs.query({ windowId: windowId });
                if (!abas || abas.length <= 1) return;

                const abasAlvo = abas.filter(t => (ordenarFixadas ? true : !t.pinned));
                if (abasAlvo.length <= 1) return;

                /* Dissolve grupos existentes para permitir a movimentação ordenada livre sem erros de Tab Groups do Chrome */
                const temGrupos = abasAlvo.some(t => t.groupId !== undefined && t.groupId > 0);
                if (temGrupos) {
                    await this.desagruparTodas(windowId, chromeApi);
                }

                const abasOrdenadas = [...abasAlvo].sort((a, b) => {
                    return this.compararAbasParaOrdenacao(a, b, criterio, sentido, mapaAbasUrls);
                });

                const indexInicial = abasAlvo[0].index;

                /* Move as guias ordenadas uma a uma sequencialmente para os índices alvo exatos */
                for (let i = 0; i < abasOrdenadas.length; i++) {
                    const t = abasOrdenadas[i];
                    const novoIdx = indexInicial + i;
                    try {
                        await chromeApi.tabs.move(t.id, { index: novoIdx });
                    } catch (_) { }
                }
            } finally {
                setTimeout(() => {
                    this.#estaOrdenandoGuias = false;
                }, 300);
            }
        }

        /**
         * Agrupa as guias da janela ativa por domínio utilizando a Tab Groups API
         * @param {number} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>} Quantidade de grupos criados
         */
        async agruparPorDominio(windowId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.group !== 'function') return 0;

            try {
                const abas = await chromeApi.tabs.query({ windowId });
                if (!abas || abas.length === 0) return 0;

                const gruposPorHost = new Map();
                for (const t of abas) {
                    if (t.pinned) continue;
                    const u = t.url || t.pendingUrl || '';
                    const info = this.extrairInfoDominio(u);
                    const host = info.baseDominio || 'Outros';
                    if (!gruposPorHost.has(host)) {
                        gruposPorHost.set(host, []);
                    }
                    gruposPorHost.get(host).push(t.id);
                }

                const coresDisponiveis = ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
                let corIdx = 0;
                let totalGrupos = 0;

                for (const [host, tabIds] of gruposPorHost.entries()) {
                    if (tabIds.length >= 1) {
                        try {
                            const groupId = await chromeApi.tabs.group({ tabIds });
                            if (chromeApi.tabGroups && typeof chromeApi.tabGroups.update === 'function') {
                                const cor = coresDisponiveis[corIdx % coresDisponiveis.length];
                                corIdx++;
                                await chromeApi.tabGroups.update(groupId, {
                                    title: host.toUpperCase(),
                                    color: cor
                                });
                                totalGrupos++;
                            }
                        } catch (_) { }
                    }
                }
                return totalGrupos;
            } catch (_) {
                return 0;
            }
        }

        /**
         * Desagrupa todas as guias da janela
         * @param {number|null} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>}
         */
        async desagruparTodas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.ungroup !== 'function') return 0;

            try {
                const query = windowId ? { windowId } : {};
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length === 0) return 0;

                const noneId = (chromeApi.tabGroups && chromeApi.tabGroups.TAB_GROUP_ID_NONE !== undefined) ? chromeApi.tabGroups.TAB_GROUP_ID_NONE : -1;
                const agrupadas = abas.filter(t => t.groupId !== undefined && t.groupId !== noneId && t.groupId !== -1).map(t => t.id);

                if (agrupadas.length > 0) {
                    try {
                        await chromeApi.tabs.ungroup(agrupadas);
                    } catch (_) {
                        for (const id of agrupadas) {
                            try { await chromeApi.tabs.ungroup(id); } catch (__) { }
                        }
                    }
                    return agrupadas.length;
                }
                return 0;
            } catch (_) {
                return 0;
            }
        }
    }

    Object.freeze(GerenciadorOrdenacaoGuias.prototype);
    return Object.freeze(GerenciadorOrdenacaoGuias);
}));
