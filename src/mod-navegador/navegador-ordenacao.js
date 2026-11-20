/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-ordenacao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
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
        #criterio = 'hierarquia_arvore'; // 'nenhum', 'hierarquia_arvore', 'dominio_criacao', 'url', 'dominio_titulo', 'dominio_acesso', 'dominio_ativacao', 'ordem_criacao', 'tempo_acesso', 'ultima_ativacao', 'titulo'
        #sentido = 'esq_dir';  // 'esq_dir' (A-Z / Novo-Antigo), 'dir_esq' (Z-A / Antigo-Novo)
        #ordenarGuiasFixadas = false; // Mantido apenas para compatibilidade retroativa (guias fixadas nunca entram na ordenação)
        #timerOrdenacaoAbas = null;
        #estaOrdenandoGuias = false;
        #arvoreOpener = new Map();
        #desvinculadasManualmente = new Set();
        #criacaoPorAba = new Map();
        #navegacaoPorAba = new Map();
        #ativacaoPorAba = new Map();
        #dominioAnteriorPorAba = new Map();
        #seqCriacao = 0;
        #arvoreHidratada = false;
        #promessaHidratacaoArvore = null;
        #timerPersistirArvore = null;
        #emFechamentoCascata = new Set();
        #estaMovendoBloco = false;
        #posicionadasInicialmente = new Set();

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.criterio === 'string') this.#criterio = opcoes.criterio;
            if (typeof opcoes.sentido === 'string') this.#sentido = opcoes.sentido;
            if (typeof opcoes.ordenarGuiasFixadas === 'boolean') this.#ordenarGuiasFixadas = opcoes.ordenarGuiasFixadas;
        }

        normalizarCriterio(c) {
            const v = String(c || 'nenhum');
            return (v === 'dominio') ? 'dominio_criacao' : v;
        }

        ehCriterioDominio(c = this.#criterio) {
            const v = this.normalizarCriterio(c);
            return v === 'dominio_criacao' || v === 'url' || v === 'dominio_titulo' || v === 'dominio_acesso' || v === 'dominio_ativacao';
        }

        ehUrlExtensao(urlStr = '') {
            return /^chrome-extension:/i.test(String(urlStr || '').trim());
        }

        ehUrlNovaGuiaEmBranco(urlStr = '') {
            const u = String(urlStr || '').trim().toLowerCase();
            return !u || u === 'about:blank' || u === 'chrome://newtab/' || u === 'chrome://newtab' || u === 'edge://newtab/' || u === 'edge://newtab';
        }

        registrarNavegacaoAba(tabId, ts = Date.now()) {
            if (typeof tabId === 'number') this.#navegacaoPorAba.set(tabId, ts);
        }

        registrarAtivacaoAba(tabId, ts = Date.now()) {
            if (typeof tabId === 'number') this.#ativacaoPorAba.set(tabId, ts);
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
        compararAbasParaOrdenacao(a, b, criterio = this.#criterio, sentido = this.#sentido, mapa = null) {
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
                const navLocal = this.#navegacaoPorAba.get(tab.id);
                if (typeof navLocal === 'number' && navLocal > 0) return navLocal;
                if (reg && reg.ultimoAcessoNavegacao) return reg.ultimoAcessoNavegacao;
                if (reg && reg.modificadaEm) return reg.modificadaEm;
                if (reg && reg.criadaEm) return reg.criadaEm;
                return tab.lastAccessed || 0;
            };

            const extrairTimestampAtivacao = (tab) => {
                const ativLocal = this.#ativacaoPorAba.get(tab.id);
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
            const anterior = this.#criacaoPorAba.get(tabId);
            if (anterior !== undefined && tsCustom === null) return;
            this.#seqCriacao += 1;
            const base = (typeof tsCustom === 'number' && Number.isFinite(tsCustom)) ? tsCustom : Date.now();
            this.#criacaoPorAba.set(tabId, base * 1000 + (this.#seqCriacao % 1000));
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
                const seqSalva = this.#criacaoPorAba.get(tab.id);
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

        /**
         * Hidrata relações pai->filha e timestamps de criação preservados em chrome.storage.session/local (MV3 SW).
         * @param {Object} [chromeApi]
         */
        async garantirArvoreHidratada(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#arvoreHidratada) return;
            if (this.#promessaHidratacaoArvore) {
                return await this.#promessaHidratacaoArvore;
            }
            const storageArea = (chromeApi && chromeApi.storage)
                ? (chromeApi.storage.session || chromeApi.storage.local || null)
                : null;
            if (!storageArea || typeof storageArea.get !== 'function') {
                this.#arvoreHidratada = true;
                return;
            }
            this.#promessaHidratacaoArvore = (async () => {
                try {
                    const dados = await storageArea.get(['jusgovArvoreOpenerEstado']);
                    const st = dados && dados.jusgovArvoreOpenerEstado;
                    if (st && typeof st === 'object') {
                        if (Array.isArray(st.arvore)) {
                            for (const par of st.arvore) {
                                if (Array.isArray(par) && typeof par[0] === 'number' && typeof par[1] === 'number' && par[0] !== par[1]) {
                                    if (!this.#arvoreOpener.has(par[0])) this.#arvoreOpener.set(par[0], par[1]);
                                }
                            }
                        }
                        if (Array.isArray(st.criacao)) {
                            for (const par of st.criacao) {
                                if (Array.isArray(par) && typeof par[0] === 'number' && typeof par[1] === 'number') {
                                    if (!this.#criacaoPorAba.has(par[0])) this.#criacaoPorAba.set(par[0], par[1]);
                                }
                            }
                        }
                        if (typeof st.seq === 'number' && st.seq > this.#seqCriacao) {
                            this.#seqCriacao = st.seq;
                        }
                    }
                    if (chromeApi.tabs && typeof chromeApi.tabs.query === 'function') {
                        const abasAtuais = await chromeApi.tabs.query({}).catch(() => []);
                        const idsVivos = new Set((abasAtuais || []).map(t => t.id));
                        for (const id of [...this.#arvoreOpener.keys()]) {
                            if (!idsVivos.has(id)) this.#arvoreOpener.delete(id);
                        }
                        for (const id of [...this.#criacaoPorAba.keys()]) {
                            if (!idsVivos.has(id)) this.#criacaoPorAba.delete(id);
                        }
                    }
                } catch (_) { }
                this.#arvoreHidratada = true;
                this.#promessaHidratacaoArvore = null;
            })();
            return await this.#promessaHidratacaoArvore;
        }

        #agendarPersistenciaArvore(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const storageArea = (chromeApi && chromeApi.storage)
                ? (chromeApi.storage.session || chromeApi.storage.local || null)
                : null;
            if (!storageArea || typeof storageArea.set !== 'function') return;
            if (this.#timerPersistirArvore) clearTimeout(this.#timerPersistirArvore);
            this.#timerPersistirArvore = setTimeout(() => {
                this.#timerPersistirArvore = null;
                try {
                    const payload = {
                        arvore: [...this.#arvoreOpener.entries()].slice(-500),
                        criacao: [...this.#criacaoPorAba.entries()].slice(-500),
                        seq: this.#seqCriacao
                    };
                    storageArea.set({ jusgovArvoreOpenerEstado: payload }).catch(() => { });
                } catch (_) { }
            }, 150);
        }

        /**
         * Identifica URLs internas da extensão/navegador (ex.: options.html, newtab, chrome://) que
         * devem nascer sempre como raízes independentes e jamais entrar no meio de árvores web (BUG-71).
         * @param {string} urlStr
         * @returns {boolean}
         */
        ehUrlRaizAlienOuInterna(urlStr = '') {
            const u = String(urlStr || '').trim();
            if (!u) return false;
            return /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(u) || /^about:(?!blank$)/i.test(u);
        }

        /**
         * Remove apenas o vínculo com o pai atual, promovendo a aba a raiz independente com seus filhos intactos.
         * @param {number} tabId
         * @param {Object} [chromeApi]
         */
        desvincularPaiDaAba(tabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (typeof tabId !== 'number') return;
            this.#arvoreOpener.delete(tabId);
            this.#desvinculadasManualmente.add(tabId);
            this.#agendarPersistenciaArvore(chromeApi);
        }

        obterPaiRegistrado(tabId) {
            return this.#arvoreOpener.get(tabId);
        }

        estaDesvinculadaManualmente(tabId) {
            return this.#desvinculadasManualmente.has(tabId);
        }

        foiPosicionadaInicialmente(tabId) {
            return this.#posicionadasInicialmente.has(tabId);
        }

        async #moverAbaComRetry(tabId, idxAlvo, chromeApi) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.move !== 'function') return false;
            try {
                await chromeApi.tabs.move(tabId, { index: idxAlvo });
                return true;
            } catch (_) {
                await new Promise((r) => setTimeout(r, 85));
                try {
                    await chromeApi.tabs.move(tabId, { index: idxAlvo });
                    return true;
                } catch (__) {
                    return false;
                }
            }
        }

        /**
         * Registra relação genealógica Pai -> Filha (Seção 6.92 / BUG-68 / BUG-71)
         * @param {number} tabId
         * @param {number} openerTabId
         * @param {Object} [chromeApi]
         */
        registrarRelacaoPaiFilha(tabId, openerTabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (typeof tabId === 'number' && typeof openerTabId === 'number' && tabId !== openerTabId) {
                this.registrarCriacaoAba(openerTabId);
                this.registrarCriacaoAba(tabId);
                this.#desvinculadasManualmente.delete(tabId);
                this.#arvoreOpener.set(tabId, openerTabId);
                this.#agendarPersistenciaArvore(chromeApi);
            }
        }

        /**
         * Obtém todos os IDs de abas filhas/descendentes de uma aba pai em DFS
         * @param {number} tabId
         * @returns {number[]}
         */
        obterDescendentesDaAba(tabId) {
            const resultado = [];
            const visitados = new Set([tabId]);
            const fila = [tabId];
            while (fila.length > 0) {
                const atual = fila.shift();
                for (const [filhaId, paiId] of this.#arvoreOpener.entries()) {
                    if (paiId === atual && !visitados.has(filhaId)) {
                        visitados.add(filhaId);
                        resultado.push(filhaId);
                        fila.push(filhaId);
                    }
                }
            }
            return resultado;
        }

        /**
         * Remove aba da árvore de aberturas (e religa filhas ao avô caso não esteja em fechamento em cascata)
         * @param {number} tabId
         * @param {Object} [chromeApi]
         */
        removerDaArvore(tabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const avoId = this.#arvoreOpener.get(tabId);
            this.#arvoreOpener.delete(tabId);
            this.#desvinculadasManualmente.delete(tabId);
            this.#posicionadasInicialmente.delete(tabId);
            this.#criacaoPorAba.delete(tabId);
            this.#navegacaoPorAba.delete(tabId);
            this.#ativacaoPorAba.delete(tabId);
            this.#dominioAnteriorPorAba.delete(tabId);
            for (const [filhaId, paiId] of this.#arvoreOpener.entries()) {
                if (paiId === tabId) {
                    if (avoId !== undefined && avoId !== filhaId) {
                        this.#arvoreOpener.set(filhaId, avoId);
                    } else {
                        this.#arvoreOpener.delete(filhaId);
                    }
                }
            }
            this.#agendarPersistenciaArvore(chromeApi);
        }

        marcarFechamentoCascata(ids = []) {
            ids.forEach((id) => this.#emFechamentoCascata.add(id));
        }

        consumirFechamentoCascata(tabId) {
            if (this.#emFechamentoCascata.has(tabId)) {
                this.#emFechamentoCascata.delete(tabId);
                return true;
            }
            return false;
        }

        /**
         * Ordena abas em formato de árvore genealógica DFS "Baralho" (Seção 6.92 / BUG-68 / BUG-71):
         * - No sentido 'esq_dir' (Novo-Antigo): novas guias pai ficam mais à esquerda, seguidas
         *   imediatamente pelos seus filhos/netos mais novos até os mais antigos, depois o pai anterior.
         * - No sentido 'dir_esq' (Antigo-Novo): ordem invertida (pais mais antigos à esquerda e novos por último;
         *   filhos mais antigos primeiro dentro do bloco do pai).
         * - Páginas internas (ex.: options.html) e abas promovidas manualmente permanecem como raízes independentes.
         * - Preserva grupos nativos (Tab Groups) mantendo seus membros contíguos sem dissolver grupos.
         * @param {Array<Object>} abasAlvo
         * @param {string} [sentido]
         * @param {Map|null} [mapa]
         * @returns {Array<Object>}
         */
        ordenarPorHierarquiaArvore(abasAlvo, sentido = 'esq_dir', mapa = null) {
            const conjuntoIds = new Set(abasAlvo.map(t => t.id));
            for (const t of abasAlvo) {
                const urlT = t.url || t.pendingUrl || '';
                if (this.ehUrlRaizAlienOuInterna(urlT) || this.#desvinculadasManualmente.has(t.id)) {
                    this.#arvoreOpener.delete(t.id);
                    continue;
                }
                if (typeof t.openerTabId === 'number' && t.openerTabId !== t.id && !this.#arvoreOpener.has(t.id)) {
                    this.#arvoreOpener.set(t.id, t.openerTabId);
                }
            }

            const filhosPorPai = new Map();
            const raizes = [];

            for (const t of abasAlvo) {
                const urlT = t.url || t.pendingUrl || '';
                const bloquearVinculo = this.ehUrlRaizAlienOuInterna(urlT) || this.#desvinculadasManualmente.has(t.id);
                const paiRegistrado = bloquearVinculo ? undefined : this.#arvoreOpener.get(t.id);
                const paiId = (paiRegistrado !== undefined && conjuntoIds.has(paiRegistrado))
                    ? paiRegistrado
                    : ((!bloquearVinculo && typeof t.openerTabId === 'number' && conjuntoIds.has(t.openerTabId)) ? t.openerTabId : undefined);
                if (paiId !== undefined && paiId !== t.id && conjuntoIds.has(paiId)) {
                    if (!filhosPorPai.has(paiId)) filhosPorPai.set(paiId, []);
                    filhosPorPai.get(paiId).push(t);
                } else {
                    raizes.push(t);
                }
            }

            const cmpCrono = (a, b) => this.compararPorCriacaoCronologica(a, b, mapa);

            /* Modelo Baralho (BUG-71): esq_dir -> Novo-Antigo para pais e filhos; dir_esq -> Antigo-Novo */
            raizes.sort((a, b) => (sentido === 'dir_esq') ? cmpCrono(a, b) : -cmpCrono(a, b));
            for (const lista of filhosPorPai.values()) {
                lista.sort((a, b) => (sentido === 'dir_esq') ? cmpCrono(a, b) : -cmpCrono(a, b));
            }

            const dfsBruto = [];
            const visitados = new Set();
            const visitar = (no) => {
                if (!no || visitados.has(no.id)) return;
                visitados.add(no.id);
                dfsBruto.push(no);
                const filhos = filhosPorPai.get(no.id) || [];
                for (const f of filhos) {
                    visitar(f);
                }
            };

            for (const r of raizes) {
                visitar(r);
            }
            for (const t of abasAlvo) {
                if (!visitados.has(t.id)) visitar(t);
            }

            /* Compactar grupos nativos do Chrome sem intercalar guias externas dentro de um grupo ativo */
            const porGrupo = new Map();
            for (const t of dfsBruto) {
                if (typeof t.groupId === 'number' && t.groupId > 0) {
                    if (!porGrupo.has(t.groupId)) porGrupo.set(t.groupId, []);
                    porGrupo.get(t.groupId).push(t);
                }
            }
            if (porGrupo.size === 0) return dfsBruto;

            const resultadoCompactado = [];
            const gruposEmitidos = new Set();
            for (const t of dfsBruto) {
                if (typeof t.groupId === 'number' && t.groupId > 0) {
                    if (!gruposEmitidos.has(t.groupId)) {
                        gruposEmitidos.add(t.groupId);
                        resultadoCompactado.push(...porGrupo.get(t.groupId));
                    }
                } else {
                    resultadoCompactado.push(t);
                }
            }
            return resultadoCompactado;
        }

        /**
         * Posiciona imediatamente uma aba na árvore hierárquica (100% por ordem de criação, sem Sentido):
         * - Guias fixadas nunca são ordenadas; filhos de guias fixadas viram "pais natos" na 1ª guia não fixada.
         * - Regra absoluta: guias chrome-extension: vão SEMPRE na 1ª guia não fixada.
         * - Novas guias em branco (newtab / about:blank sem pai) são pais puros na última posição (padrão do Chrome).
         * - Filhas de um pai vivo não fixado vão SEMPRE imediatamente à direita do pai (mais novos primeiro).
         * @param {Object} tab
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         */
        async posicionarNovaAbaHierarquia(tab, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!tab || !tab.id || !tab.windowId || !chromeApi || !chromeApi.tabs) return;
            await this.garantirArvoreHidratada(chromeApi);
            const urlTab = tab.url || tab.pendingUrl || '';
            const ehExtensao = this.ehUrlExtensao(urlTab);
            const ehNewTabExplicita = /^(?:chrome|edge):\/\/newtab\/?$/i.test(String(urlTab || '').trim());
            const ehBrancoSemPai = this.ehUrlNovaGuiaEmBranco(urlTab) && (ehNewTabExplicita || typeof tab.openerTabId !== 'number');
            const ehRaizForcada = ehExtensao || ehBrancoSemPai || this.ehUrlRaizAlienOuInterna(urlTab) || this.#desvinculadasManualmente.has(tab.id);

            this.#estaMovendoBloco = true;
            try {
                const abas = await chromeApi.tabs.query({ windowId: tab.windowId });
                if (!abas || abas.length <= 1) return;
                abas.sort((a, b) => a.index - b.index);
                const atual = abas.find(t => t.id === tab.id) || tab;
                if (atual.pinned) return;

                const primeiroNaoFixado = Math.max(0, abas.findIndex(t => !t.pinned));

                /* Regra Absoluta: chrome-extension: sempre na 1ª guia não fixada, fora de grupos */
                if (ehExtensao) {
                    this.#arvoreOpener.delete(tab.id);
                    if (typeof atual.groupId === 'number' && atual.groupId > 0 && typeof chromeApi.tabs.ungroup === 'function') {
                        await chromeApi.tabs.ungroup([tab.id]).catch(() => { });
                    }
                    if (atual.index !== primeiroNaoFixado && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this.#moverAbaComRetry(tab.id, primeiroNaoFixado, chromeApi);
                        if (movOk) this.#posicionadasInicialmente.add(tab.id);
                    } else {
                        this.#posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                /* Calcula 1ª posição livre após eventuais chrome-extension: */
                let primeiroAposExt = primeiroNaoFixado;
                for (let i = primeiroNaoFixado; i < abas.length; i++) {
                    if (abas[i].id !== tab.id && this.ehUrlExtensao(abas[i].url || abas[i].pendingUrl || '')) {
                        primeiroAposExt = i + 1;
                    } else if (abas[i].id !== tab.id) {
                        break;
                    }
                }
                if (atual.index < primeiroAposExt) primeiroAposExt = Math.max(primeiroNaoFixado, primeiroAposExt - 1);

                /* Nova guia em branco: pai puro na última posição (padrão do Chrome) */
                if (ehBrancoSemPai) {
                    this.#arvoreOpener.delete(tab.id);
                    const idxUltimo = abas.length - 1;
                    if (atual.index !== idxUltimo && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this.#moverAbaComRetry(tab.id, idxUltimo, chromeApi);
                        if (movOk) this.#posicionadasInicialmente.add(tab.id);
                    } else {
                        this.#posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                const paiId = ehRaizForcada ? undefined : (this.#arvoreOpener.get(tab.id) ?? tab.openerTabId);
                const paiTab = (paiId !== undefined && paiId !== tab.id) ? abas.find(t => t.id === paiId) : null;

                /* Filho de guia fixada -> vira "pai nato" na 1ª guia não fixada (após chrome-extension:) */
                if (paiTab && paiTab.pinned) {
                    this.#arvoreOpener.delete(tab.id);
                    if (atual.index !== primeiroAposExt && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this.#moverAbaComRetry(tab.id, primeiroAposExt, chromeApi);
                        if (movOk) this.#posicionadasInicialmente.add(tab.id);
                    } else {
                        this.#posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                if (!paiTab) {
                    /* Nova guia raiz avulsa: última posição (padrão do Chrome) */
                    const idxUltimo = abas.length - 1;
                    if (atual.index !== idxUltimo && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this.#moverAbaComRetry(tab.id, idxUltimo, chromeApi);
                        if (movOk) this.#posicionadasInicialmente.add(tab.id);
                    } else {
                        this.#posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                /* Aba FILHA de pai não fixado: herda Tab Group do pai se houver e vai IMEDIATAMENTE à direita do pai (mais novos primeiro) */
                if (typeof paiTab.groupId === 'number' && paiTab.groupId > 0 && (!atual.groupId || atual.groupId <= 0) && typeof chromeApi.tabs.group === 'function') {
                    await chromeApi.tabs.group({ groupId: paiTab.groupId, tabIds: [tab.id] }).catch(() => { });
                }

                let idxDestino = (atual.index < paiTab.index) ? paiTab.index : (paiTab.index + 1);
                idxDestino = Math.max(primeiroNaoFixado, Math.min(abas.length - 1, idxDestino));
                if (atual.index !== idxDestino && typeof chromeApi.tabs.move === 'function') {
                    const movOk = await this.#moverAbaComRetry(tab.id, idxDestino, chromeApi);
                    if (movOk) this.#posicionadasInicialmente.add(tab.id);
                } else {
                    this.#posicionadasInicialmente.add(tab.id);
                }
            } finally {
                setTimeout(() => { this.#estaMovendoBloco = false; }, 120);
            }
        }

        /**
         * Trata movimentação manual de guia (tabs.onMoved):
         * - Se uma aba PAI for movida, todos os seus descendentes contíguos a acompanham no mesmo bloco.
         * - Se uma aba FILHA for arrastada manualmente para fora do bloco do seu pai, transforma-se em PAI independente.
         * @param {number} tabId
         * @param {Object} moveInfo
         * @param {Object} [chromeApi]
         * @param {Object} [config]
         */
        async tratarAbaMovidaManual(tabId, moveInfo = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), config = {}) {
            if (this.#estaMovendoBloco || this.#estaOrdenandoGuias) return;
            const criterio = config.criterioOrdenacaoGuias || this.#criterio;
            if (criterio !== 'hierarquia_arvore' || !chromeApi || !chromeApi.tabs) return;
            const windowId = moveInfo && moveInfo.windowId;
            if (!windowId) return;

            await this.garantirArvoreHidratada(chromeApi);
            const abas = await chromeApi.tabs.query({ windowId }).catch(() => []);
            if (!abas || abas.length <= 1) return;
            abas.sort((a, b) => a.index - b.index);

            const abaMovida = abas.find(t => t.id === tabId);
            if (!abaMovida) return;

            /* 1) Se a aba movida é filha de alguém, checar se saiu para fora do conjunto contíguo do pai */
            const paiId = this.#arvoreOpener.get(tabId);
            if (paiId !== undefined) {
                const paiTab = abas.find(t => t.id === paiId);
                if (paiTab) {
                    const familiaPai = new Set([paiId, ...this.obterDescendentesDaAba(paiId)]);
                    const minIdx = Math.min(paiTab.index, abaMovida.index);
                    const maxIdx = Math.max(paiTab.index, abaMovida.index);
                    let saiuDoConjunto = (abaMovida.index < paiTab.index);
                    if (!saiuDoConjunto) {
                        for (let k = minIdx; k <= maxIdx; k++) {
                            const tMeio = abas[k];
                            if (tMeio && !familiaPai.has(tMeio.id)) {
                                saiuDoConjunto = true;
                                break;
                            }
                        }
                    }
                    if (saiuDoConjunto) {
                        this.desvincularPaiDaAba(tabId, chromeApi);
                    }
                }
            }

            /* 2) Se a aba movida tem filhos/descendentes, fazer todos acompanharem logo à direita dela */
            const descSet = new Set(this.obterDescendentesDaAba(tabId));
            if (descSet.size === 0) return;

            const descVisual = abas.filter(t => descSet.has(t.id));
            if (descVisual.length === 0) return;

            this.#estaMovendoBloco = true;
            try {
                let cursorIdx = abaMovida.index;
                for (const d of descVisual) {
                    const posAlvo = (d.index < cursorIdx) ? cursorIdx : (cursorIdx + 1);
                    if (d.index !== posAlvo) {
                        await chromeApi.tabs.move(d.id, { index: posAlvo }).catch(() => { });
                    }
                    const atualizada = await chromeApi.tabs.get(abaMovida.id).catch(() => null);
                    if (atualizada && typeof atualizada.index === 'number') {
                        /* Recalcula cursor baseado na última posição do bloco movido */
                        const dAtual = await chromeApi.tabs.get(d.id).catch(() => null);
                        cursorIdx = (dAtual && typeof dAtual.index === 'number') ? dAtual.index : posAlvo;
                    } else {
                        cursorIdx = posAlvo;
                    }
                }
            } finally {
                setTimeout(() => { this.#estaMovendoBloco = false; }, 160);
            }
        }

        /**
         * Extrai o baseDominio agrupável de uma URL web. Retorna '' para extensões, newtab e páginas internas.
         * @param {string} urlStr
         * @returns {string}
         */
        extrairDominioAgrupavel(urlStr = '') {
            const u = String(urlStr || '').trim();
            if (!u || this.ehUrlExtensao(u) || this.ehUrlNovaGuiaEmBranco(u)) return '';
            if (/^(?:chrome|edge|devtools|view-source|about):/i.test(u)) return '';
            const info = this.extrairInfoDominio(u);
            return info && info.baseDominio ? info.baseDominio : '';
        }

        /**
         * Calcula cor determinística da paleta para um domínio, evitando piscar/trocar cores de grupos existentes.
         * @param {string} dominio
         * @returns {string}
         */
        #obterCorDeterministicaDominio(dominio) {
            const rsPal = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                ? JusGovCfgDefaults.obterRegrasSistema()
                : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
            const cores = (rsPal && rsPal.ordenacaoGuias && Array.isArray(rsPal.ordenacaoGuias.paletaGrupos) && rsPal.ordenacaoGuias.paletaGrupos.length > 0)
                ? rsPal.ordenacaoGuias.paletaGrupos
                : ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
            let hash = 0;
            const s = String(dominio || '');
            for (let i = 0; i < s.length; i++) {
                hash = ((hash << 5) - hash) + s.charCodeAt(i);
                hash |= 0;
            }
            return cores[Math.abs(hash) % cores.length];
        }

        /**
         * Mantém online os Tab Groups nativos do Chrome para todas as guias que compartilham o mesmo domínio base (>= 2 guias).
         * - Retira automaticamente do grupo qualquer guia que saiu do domínio ou ficou sozinha sem pares.
         * - Reutiliza grupos existentes do mesmo domínio sem recriar/piscar cores.
         * - Nunca agrupa guias fixadas, chrome-extension:, newtab ou páginas internas.
         * @param {number} windowId
         * @param {Object} chromeApi
         */
        async sincronizarGruposDominioOnline(windowId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!windowId || !chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.group !== 'function') return;
            const prevBloq = this.#estaMovendoBloco;
            this.#estaMovendoBloco = true;
            try {
                const abas = await chromeApi.tabs.query({ windowId }).catch(() => []);
                if (!abas || abas.length === 0) return;
                abas.sort((a, b) => a.index - b.index);

                const porDominio = new Map();
                const idsParaDesagrupar = [];

                for (const t of abas) {
                    if (t.pinned) continue;
                    const u = t.url || t.pendingUrl || '';
                    const dom = this.extrairDominioAgrupavel(u);
                    if (!dom) {
                        if (typeof t.groupId === 'number' && t.groupId > 0) {
                            idsParaDesagrupar.push(t.id);
                        }
                        continue;
                    }
                    if (!porDominio.has(dom)) porDominio.set(dom, []);
                    porDominio.get(dom).push(t);
                }

                /* Desagrupa abas solitárias (sem pares no mesmo domínio) e internas */
                for (const [dom, lista] of porDominio.entries()) {
                    if (lista.length < 2) {
                        for (const t of lista) {
                            if (typeof t.groupId === 'number' && t.groupId > 0) {
                                idsParaDesagrupar.push(t.id);
                            }
                        }
                    }
                }

                if (idsParaDesagrupar.length > 0 && typeof chromeApi.tabs.ungroup === 'function') {
                    await chromeApi.tabs.ungroup(idsParaDesagrupar).catch(async () => {
                        for (const id of idsParaDesagrupar) {
                            await chromeApi.tabs.ungroup(id).catch(() => { });
                        }
                    });
                }

                /* Mapeia grupos já existentes para reutilização limpa */
                const gruposEmUso = new Set();
                for (const [dom, lista] of porDominio.entries()) {
                    if (lista.length < 2) continue;
                    const contagemGrupo = new Map();
                    for (const t of lista) {
                        if (typeof t.groupId === 'number' && t.groupId > 0 && !gruposEmUso.has(t.groupId)) {
                            contagemGrupo.set(t.groupId, (contagemGrupo.get(t.groupId) || 0) + 1);
                        }
                    }
                    let groupIdAlvo = null;
                    let maxCount = 0;
                    for (const [gId, cnt] of contagemGrupo.entries()) {
                        if (cnt > maxCount) {
                            maxCount = cnt;
                            groupIdAlvo = gId;
                        }
                    }

                    const tabIds = lista.map(t => t.id);
                    const jaTodasNoGrupo = groupIdAlvo !== null && lista.every(t => t.groupId === groupIdAlvo);
                    if (jaTodasNoGrupo) {
                        gruposEmUso.add(groupIdAlvo);
                        continue;
                    }

                    try {
                        let gIdFinal = groupIdAlvo;
                        if (groupIdAlvo !== null) {
                            const faltantes = lista.filter(t => t.groupId !== groupIdAlvo).map(t => t.id);
                            if (faltantes.length > 0) {
                                gIdFinal = await chromeApi.tabs.group({ groupId: groupIdAlvo, tabIds: faltantes });
                            }
                        } else {
                            gIdFinal = await chromeApi.tabs.group({ tabIds });
                        }
                        if (typeof gIdFinal === 'number' && gIdFinal > 0) {
                            gruposEmUso.add(gIdFinal);
                            if (chromeApi.tabGroups && typeof chromeApi.tabGroups.update === 'function') {
                                await chromeApi.tabGroups.update(gIdFinal, {
                                    title: dom.toUpperCase(),
                                    color: this.#obterCorDeterministicaDominio(dom)
                                }).catch(() => { });
                            }
                        }
                    } catch (_) { }
                }
            } finally {
                if (!prevBloq) {
                    setTimeout(() => { this.#estaMovendoBloco = false; }, 120);
                }
            }
        }

        /**
         * Move uma aba específica para a extremidade (1ª posição não fixada após chrome-extension:, ou última)
         * globalmente ou dentro do bloco contíguo do seu domínio.
         * @param {Object} tab
         * @param {{ sentido?: string, apenasDentroDoDominio?: boolean }} [opcoes]
         * @param {Object} chromeApi
         */
        async #moverAbaParaExtremidade(tab, opcoes = {}, chromeApi = null) {
            if (!tab || !tab.id || !tab.windowId || !chromeApi || !chromeApi.tabs) return;
            const sentido = opcoes.sentido || this.#sentido || 'esq_dir';
            const noInicio = (sentido !== 'dir_esq'); // esq_dir (Novo-Antigo) -> 1ª posição; dir_esq (Antigo-Novo) -> última posição
            const prevBloq = this.#estaMovendoBloco;
            this.#estaMovendoBloco = true;
            try {
                const abas = await chromeApi.tabs.query({ windowId: tab.windowId }).catch(() => []);
                if (!abas || abas.length <= 1) return;
                abas.sort((a, b) => a.index - b.index);
                const atual = abas.find(t => t.id === tab.id);
                if (!atual || atual.pinned) return;

                const primeiroNaoFixado = Math.max(0, abas.findIndex(t => !t.pinned));

                if (opcoes.apenasDentroDoDominio) {
                    const domAlvo = this.extrairDominioAgrupavel(atual.url || atual.pendingUrl || '');
                    if (!domAlvo) return;
                    const mesmas = abas.filter(t => !t.pinned && this.extrairDominioAgrupavel(t.url || t.pendingUrl || '') === domAlvo);
                    if (mesmas.length <= 1) return;
                    const idxMin = Math.min(...mesmas.map(t => t.index));
                    const idxMax = Math.max(...mesmas.map(t => t.index));
                    const idxAlvo = noInicio ? idxMin : idxMax;
                    if (atual.index !== idxAlvo) {
                        await this.#moverAbaComRetry(atual.id, idxAlvo, chromeApi);
                    }
                    return;
                }

                let primeiroAposExt = primeiroNaoFixado;
                for (let i = primeiroNaoFixado; i < abas.length; i++) {
                    if (abas[i].id !== atual.id && this.ehUrlExtensao(abas[i].url || abas[i].pendingUrl || '')) {
                        primeiroAposExt = i + 1;
                    } else if (abas[i].id !== atual.id) {
                        break;
                    }
                }
                if (atual.index < primeiroAposExt) primeiroAposExt = Math.max(primeiroNaoFixado, primeiroAposExt - 1);

                const idxAlvo = noInicio ? primeiroAposExt : (abas.length - 1);
                if (atual.index !== idxAlvo) {
                    await this.#moverAbaComRetry(atual.id, idxAlvo, chromeApi);
                }
            } finally {
                if (!prevBloq) {
                    setTimeout(() => { this.#estaMovendoBloco = false; }, 120);
                }
            }
        }

        /**
         * Manipulador cirúrgico online para todos os eventos de aba (criada, url_mudou, titulo_mudou, ativada, desafixada),
         * respeitando exatamente a semântica de cada critério sem reordenar abas indevidamente.
         * @param {Object} tab
         * @param {'criada'|'url_mudou'|'titulo_mudou'|'ativada'|'desafixada'} evento
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         * @param {Map|null} [mapaAbasUrls]
         */
        async sincronizarAbaNoCriterio(tab, evento, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), mapaAbasUrls = null) {
            if (!tab || !tab.id || !tab.windowId || !chromeApi || !chromeApi.tabs) return;
            if (tab.pinned) return;

            const crit = this.normalizarCriterio(config.criterioOrdenacaoGuias || this.#criterio);
            if (!crit || crit === 'nenhum') return;

            const sentido = config.sentidoOrdenacaoGuias || this.#sentido || 'esq_dir';
            const urlTab = tab.url || tab.pendingUrl || '';

            /* Regra Absoluta: chrome-extension: sempre na 1ª guia não fixada em qualquer critério ativo */
            if (this.ehUrlExtensao(urlTab) && (evento === 'criada' || evento === 'url_mudou' || evento === 'desafixada')) {
                const prevBloq = this.#estaMovendoBloco;
                this.#estaMovendoBloco = true;
                try {
                    const abas = await chromeApi.tabs.query({ windowId: tab.windowId }).catch(() => []);
                    abas.sort((a, b) => a.index - b.index);
                    const atual = abas.find(t => t.id === tab.id) || tab;
                    if (typeof atual.groupId === 'number' && atual.groupId > 0 && typeof chromeApi.tabs.ungroup === 'function') {
                        await chromeApi.tabs.ungroup([tab.id]).catch(() => { });
                    }
                    const primeiroNaoFixado = Math.max(0, abas.findIndex(t => !t.pinned));
                    if (atual.index !== primeiroNaoFixado) {
                        await this.#moverAbaComRetry(tab.id, primeiroNaoFixado, chromeApi);
                    }
                } finally {
                    if (!prevBloq) setTimeout(() => { this.#estaMovendoBloco = false; }, 120);
                }
                return;
            }

            if (crit === 'hierarquia_arvore') {
                if (evento === 'criada' || evento === 'desafixada') {
                    await this.posicionarNovaAbaHierarquia(tab, config, chromeApi);
                }
                return;
            }

            /* Bloco "Acesso": ordem_criacao, tempo_acesso, ultima_ativacao */
            if (crit === 'ordem_criacao') {
                if (evento === 'criada' || evento === 'desafixada') {
                    await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
                }
                return;
            }

            if (crit === 'tempo_acesso') {
                if (evento === 'url_mudou' || evento === 'criada' || evento === 'desafixada') {
                    this.registrarNavegacaoAba(tab.id);
                    await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
                }
                return;
            }

            if (crit === 'ultima_ativacao') {
                if (evento === 'ativada' || evento === 'criada' || evento === 'desafixada') {
                    this.registrarAtivacaoAba(tab.id);
                    await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
                }
                return;
            }

            if (crit === 'titulo') {
                if (evento === 'criada' || evento === 'url_mudou' || evento === 'titulo_mudou' || evento === 'desafixada') {
                    this.agendarOrdenacaoAbas(tab.windowId, config, chromeApi, mapaAbasUrls);
                }
                return;
            }

            /* Bloco "Domínio do Site": agrupamento online permanente + 5 subcritérios */
            if (this.ehCriterioDominio(crit)) {
                const novoDom = this.extrairDominioAgrupavel(urlTab);
                const domAnterior = this.#dominioAnteriorPorAba.get(tab.id);
                const mudouDominio = (domAnterior !== undefined && domAnterior !== novoDom);
                if (novoDom || domAnterior !== undefined) {
                    this.#dominioAnteriorPorAba.set(tab.id, novoDom);
                }

                if (crit === 'dominio_criacao') {
                    if (evento === 'criada' || evento === 'desafixada' || (evento === 'url_mudou' && (mudouDominio || domAnterior === undefined))) {
                        await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
                        await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                    }
                    return;
                }

                if (crit === 'url') {
                    if (evento === 'criada' || evento === 'url_mudou' || evento === 'desafixada') {
                        this.agendarOrdenacaoAbas(tab.windowId, config, chromeApi, mapaAbasUrls);
                    }
                    return;
                }

                if (crit === 'dominio_titulo') {
                    if (evento === 'criada' || evento === 'url_mudou' || evento === 'titulo_mudou' || evento === 'desafixada') {
                        this.agendarOrdenacaoAbas(tab.windowId, config, chromeApi, mapaAbasUrls);
                    }
                    return;
                }

                if (crit === 'dominio_acesso') {
                    if (evento === 'url_mudou' || evento === 'criada' || evento === 'desafixada') {
                        this.registrarNavegacaoAba(tab.id);
                        await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
                        await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                    }
                    return;
                }

                if (crit === 'dominio_ativacao') {
                    if (evento === 'ativada' || evento === 'criada' || evento === 'desafixada' || (evento === 'url_mudou' && mudouDominio)) {
                        if (evento === 'ativada') this.registrarAtivacaoAba(tab.id);
                        await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
                        await this.#moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                    }
                    return;
                }
            }
        }

        /**
         * Agenda ordenação de abas com debouncing
         * @param {number} windowId
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         * @param {Map} [mapaAbasUrls]
         */
        agendarOrdenacaoAbas(windowId, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), mapaAbasUrls = null) {
            const criterio = this.normalizarCriterio(config.criterioOrdenacaoGuias || this.#criterio);
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this.#timerOrdenacaoAbas) clearTimeout(this.#timerOrdenacaoAbas);
            this.#timerOrdenacaoAbas = setTimeout(async () => {
                this.#timerOrdenacaoAbas = null;
                try {
                    await this.executarOrdenacaoGuias(windowId, config, chromeApi, mapaAbasUrls);
                } catch (_) { }
            }, 350);
        }

        /**
         * Executa a reordenação das abas na janela (guias fixadas nunca são ordenadas).
         * @param {number} windowId
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         * @param {Map} [mapaAbasUrls]
         */
        async executarOrdenacaoGuias(windowId, config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), mapaAbasUrls = null) {
            const criterio = this.normalizarCriterio(config.criterioOrdenacaoGuias || this.#criterio);
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this.#estaOrdenandoGuias) return;
            this.#estaOrdenandoGuias = true;

            try {
                await this.garantirArvoreHidratada(chromeApi);
                const sentido = config.sentidoOrdenacaoGuias || this.#sentido || 'esq_dir';

                if (criterio === 'agrupar_dominio') {
                    await this.agruparPorDominio(windowId, chromeApi);
                    return;
                }

                if (!chromeApi || !chromeApi.tabs) return;

                let abas = await chromeApi.tabs.query({ windowId: windowId });
                if (!abas || abas.length <= 1) return;

                /* Guias fixadas nunca fazem parte da ordenação */
                let abasAlvo = abas.filter(t => !t.pinned);
                if (abasAlvo.length <= 1) return;

                if (criterio === 'hierarquia_arvore') {
                    /* Preserva Tab Groups existentes: se uma aba filha estiver fora do grupo da aba pai, associa ao mesmo grupo */
                    const mapaPorId = new Map(abasAlvo.map(t => [t.id, t]));
                    for (const t of abasAlvo) {
                        const paiId = this.#arvoreOpener.get(t.id) ?? t.openerTabId;
                        const paiTab = (paiId !== undefined) ? mapaPorId.get(paiId) : null;
                        if (paiTab && typeof paiTab.groupId === 'number' && paiTab.groupId > 0 && (!t.groupId || t.groupId <= 0) && typeof chromeApi.tabs.group === 'function') {
                            try {
                                await chromeApi.tabs.group({ groupId: paiTab.groupId, tabIds: [t.id] });
                                t.groupId = paiTab.groupId;
                            } catch (_) { }
                        }
                    }
                } else if (!this.ehCriterioDominio(criterio)) {
                    /* Critérios fora de Hierarquia e Domínio do Site dissolvem grupos para ordenação global livre */
                    const temGrupos = abasAlvo.some(t => t.groupId !== undefined && t.groupId > 0);
                    if (temGrupos) {
                        await this.desagruparTodas(windowId, chromeApi);
                        abas = await chromeApi.tabs.query({ windowId: windowId });
                        abasAlvo = abas.filter(t => !t.pinned);
                    }
                }

                const abasOrdenadas = (criterio === 'hierarquia_arvore')
                    ? this.ordenarPorHierarquiaArvore(abasAlvo, 'esq_dir', mapaAbasUrls)
                    : [...abasAlvo].sort((a, b) => this.compararAbasParaOrdenacao(a, b, criterio, sentido, mapaAbasUrls));

                const indexInicial = Math.min(...abasAlvo.map(t => (typeof t.index === 'number' ? t.index : 0)));

                /* Move sequencialmente mantendo consistência de índices e grupos */
                for (let i = 0; i < abasOrdenadas.length; i++) {
                    const t = abasOrdenadas[i];
                    const novoIdx = indexInicial + i;
                    try {
                        await chromeApi.tabs.move(t.id, { index: novoIdx });
                    } catch (_) { }
                }

                /* Para qualquer subopção de "Domínio do Site", mantém Tab Groups agrupados online após ordenar */
                if (this.ehCriterioDominio(criterio)) {
                    await this.sincronizarGruposDominioOnline(windowId, chromeApi);
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

                const rsPal = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                    ? JusGovCfgDefaults.obterRegrasSistema()
                    : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
                const coresDisponiveis = (rsPal && rsPal.ordenacaoGuias && Array.isArray(rsPal.ordenacaoGuias.paletaGrupos) && rsPal.ordenacaoGuias.paletaGrupos.length > 0)
                    ? rsPal.ordenacaoGuias.paletaGrupos
                    : ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
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
