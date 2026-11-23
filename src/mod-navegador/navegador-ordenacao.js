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
        _p_criterio = 'hierarquia_arvore'; // 'nenhum', 'hierarquia_arvore', 'dominio_criacao', 'url', 'dominio_titulo', 'dominio_acesso', 'dominio_ativacao', 'ordem_criacao', 'tempo_acesso', 'ultima_ativacao', 'titulo'
        _p_sentido = 'esq_dir';  // 'esq_dir' (A-Z / Novo-Antigo), 'dir_esq' (Z-A / Antigo-Novo)
        _p_ordenarGuiasFixadas = false; // Mantido apenas para compatibilidade retroativa (guias fixadas nunca entram na ordenação)
        _p_timerOrdenacaoAbas = null;
        _p_estaOrdenandoGuias = false;
        _p_arvoreOpener = new Map();
        _p_desvinculadasManualmente = new Set();
        _p_criacaoPorAba = new Map();
        _p_navegacaoPorAba = new Map();
        _p_ativacaoPorAba = new Map();
        _p_dominioAnteriorPorAba = new Map();
        _p_seqCriacao = 0;
        _p_arvoreHidratada = false;
        _p_promessaHidratacaoArvore = null;
        _p_timerPersistirArvore = null;
        _p_emFechamentoCascata = new Set();
        _p_estaMovendoBloco = false;
        _p_posicionadasInicialmente = new Set();

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.criterio === 'string') this._p_criterio = opcoes.criterio;
            if (typeof opcoes.sentido === 'string') this._p_sentido = opcoes.sentido;
            if (typeof opcoes.ordenarGuiasFixadas === 'boolean') this._p_ordenarGuiasFixadas = opcoes.ordenarGuiasFixadas;
        }

        normalizarCriterio(c) {
            const v = String(c || 'nenhum');
            return (v === 'dominio') ? 'dominio_criacao' : v;
        }

        ehCriterioDominio(c = this._p_criterio) {
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
            if (typeof tabId === 'number') this._p_navegacaoPorAba.set(tabId, ts);
        }

        registrarAtivacaoAba(tabId, ts = Date.now()) {
            if (typeof tabId === 'number') this._p_ativacaoPorAba.set(tabId, ts);
        }

        get criterio() { return this._p_criterio; }
        set criterio(v) { this._p_criterio = String(v); }

        get sentido() { return this._p_sentido; }
        set sentido(v) { this._p_sentido = String(v); }

        get ordenarGuiasFixadas() { return this._p_ordenarGuiasFixadas; }
        set ordenarGuiasFixadas(v) { this._p_ordenarGuiasFixadas = Boolean(v); }

        /**
         * Hidrata relações pai->filha e timestamps de criação preservados em chrome.storage.session/local (MV3 SW).
         * @param {Object} [chromeApi]
         */
        async garantirArvoreHidratada(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_arvoreHidratada) return;
            if (this._p_promessaHidratacaoArvore) {
                return await this._p_promessaHidratacaoArvore;
            }
            const storageArea = (chromeApi && chromeApi.storage)
                ? (chromeApi.storage.session || chromeApi.storage.local || null)
                : null;
            if (!storageArea || typeof storageArea.get !== 'function') {
                this._p_arvoreHidratada = true;
                return;
            }
            this._p_promessaHidratacaoArvore = (async () => {
                try {
                    const dados = await storageArea.get(['jusgovArvoreOpenerEstado']);
                    const st = dados && dados.jusgovArvoreOpenerEstado;
                    if (st && typeof st === 'object') {
                        if (Array.isArray(st.arvore)) {
                            for (const par of st.arvore) {
                                if (Array.isArray(par) && typeof par[0] === 'number' && typeof par[1] === 'number' && par[0] !== par[1]) {
                                    if (!this._p_arvoreOpener.has(par[0])) this._p_arvoreOpener.set(par[0], par[1]);
                                }
                            }
                        }
                        if (Array.isArray(st.criacao)) {
                            for (const par of st.criacao) {
                                if (Array.isArray(par) && typeof par[0] === 'number' && typeof par[1] === 'number') {
                                    if (!this._p_criacaoPorAba.has(par[0])) this._p_criacaoPorAba.set(par[0], par[1]);
                                }
                            }
                        }
                        if (typeof st.seq === 'number' && st.seq > this._p_seqCriacao) {
                            this._p_seqCriacao = st.seq;
                        }
                    }
                    if (chromeApi.tabs && typeof chromeApi.tabs.query === 'function') {
                        const abasAtuais = await chromeApi.tabs.query({}).catch(() => []);
                        const idsVivos = new Set((abasAtuais || []).map(t => t.id));
                        for (const id of [...this._p_arvoreOpener.keys()]) {
                            if (!idsVivos.has(id)) this._p_arvoreOpener.delete(id);
                        }
                        for (const id of [...this._p_criacaoPorAba.keys()]) {
                            if (!idsVivos.has(id)) this._p_criacaoPorAba.delete(id);
                        }
                    }
                } catch (_) { }
                this._p_arvoreHidratada = true;
                this._p_promessaHidratacaoArvore = null;
            })();
            return await this._p_promessaHidratacaoArvore;
        }

        _p_agendarPersistenciaArvore(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const storageArea = (chromeApi && chromeApi.storage)
                ? (chromeApi.storage.session || chromeApi.storage.local || null)
                : null;
            if (!storageArea || typeof storageArea.set !== 'function') return;
            if (this._p_timerPersistirArvore) clearTimeout(this._p_timerPersistirArvore);
            this._p_timerPersistirArvore = setTimeout(() => {
                this._p_timerPersistirArvore = null;
                try {
                    const payload = {
                        arvore: [...this._p_arvoreOpener.entries()].slice(-500),
                        criacao: [...this._p_criacaoPorAba.entries()].slice(-500),
                        seq: this._p_seqCriacao
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
            this._p_arvoreOpener.delete(tabId);
            this._p_desvinculadasManualmente.add(tabId);
            this._p_agendarPersistenciaArvore(chromeApi);
        }

        obterPaiRegistrado(tabId) {
            return this._p_arvoreOpener.get(tabId);
        }

        estaDesvinculadaManualmente(tabId) {
            return this._p_desvinculadasManualmente.has(tabId);
        }

        foiPosicionadaInicialmente(tabId) {
            return this._p_posicionadasInicialmente.has(tabId);
        }

        async _p_moverAbaComRetry(tabId, idxAlvo, chromeApi) {
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
                this._p_desvinculadasManualmente.delete(tabId);
                this._p_arvoreOpener.set(tabId, openerTabId);
                this._p_agendarPersistenciaArvore(chromeApi);
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
                for (const [filhaId, paiId] of this._p_arvoreOpener.entries()) {
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
            const avoId = this._p_arvoreOpener.get(tabId);
            this._p_arvoreOpener.delete(tabId);
            this._p_desvinculadasManualmente.delete(tabId);
            this._p_posicionadasInicialmente.delete(tabId);
            this._p_criacaoPorAba.delete(tabId);
            this._p_navegacaoPorAba.delete(tabId);
            this._p_ativacaoPorAba.delete(tabId);
            this._p_dominioAnteriorPorAba.delete(tabId);
            for (const [filhaId, paiId] of this._p_arvoreOpener.entries()) {
                if (paiId === tabId) {
                    if (avoId !== undefined && avoId !== filhaId) {
                        this._p_arvoreOpener.set(filhaId, avoId);
                    } else {
                        this._p_arvoreOpener.delete(filhaId);
                    }
                }
            }
            this._p_agendarPersistenciaArvore(chromeApi);
        }

        marcarFechamentoCascata(ids = []) {
            ids.forEach((id) => this._p_emFechamentoCascata.add(id));
        }

        consumirFechamentoCascata(tabId) {
            if (this._p_emFechamentoCascata.has(tabId)) {
                this._p_emFechamentoCascata.delete(tabId);
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
                if (this.ehUrlRaizAlienOuInterna(urlT) || this._p_desvinculadasManualmente.has(t.id)) {
                    this._p_arvoreOpener.delete(t.id);
                    continue;
                }
                if (typeof t.openerTabId === 'number' && t.openerTabId !== t.id && !this._p_arvoreOpener.has(t.id)) {
                    this._p_arvoreOpener.set(t.id, t.openerTabId);
                }
            }

            const filhosPorPai = new Map();
            const raizes = [];

            for (const t of abasAlvo) {
                const urlT = t.url || t.pendingUrl || '';
                const bloquearVinculo = this.ehUrlRaizAlienOuInterna(urlT) || this._p_desvinculadasManualmente.has(t.id);
                const paiRegistrado = bloquearVinculo ? undefined : this._p_arvoreOpener.get(t.id);
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
            const ehRaizForcada = ehExtensao || ehBrancoSemPai || this.ehUrlRaizAlienOuInterna(urlTab) || this._p_desvinculadasManualmente.has(tab.id);

            this._p_estaMovendoBloco = true;
            try {
                const abas = await chromeApi.tabs.query({ windowId: tab.windowId });
                if (!abas || abas.length <= 1) return;
                abas.sort((a, b) => a.index - b.index);
                const atual = abas.find(t => t.id === tab.id) || tab;
                if (atual.pinned) return;

                const primeiroNaoFixado = Math.max(0, abas.findIndex(t => !t.pinned));

                /* Regra Absoluta: chrome-extension: sempre na 1ª guia não fixada, fora de grupos */
                if (ehExtensao) {
                    this._p_arvoreOpener.delete(tab.id);
                    if (typeof atual.groupId === 'number' && atual.groupId > 0 && typeof chromeApi.tabs.ungroup === 'function') {
                        await chromeApi.tabs.ungroup([tab.id]).catch(() => { });
                    }
                    if (atual.index !== primeiroNaoFixado && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this._p_moverAbaComRetry(tab.id, primeiroNaoFixado, chromeApi);
                        if (movOk) this._p_posicionadasInicialmente.add(tab.id);
                    } else {
                        this._p_posicionadasInicialmente.add(tab.id);
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
                    this._p_arvoreOpener.delete(tab.id);
                    const idxUltimo = abas.length - 1;
                    if (atual.index !== idxUltimo && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this._p_moverAbaComRetry(tab.id, idxUltimo, chromeApi);
                        if (movOk) this._p_posicionadasInicialmente.add(tab.id);
                    } else {
                        this._p_posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                const paiId = ehRaizForcada ? undefined : (this._p_arvoreOpener.get(tab.id) ?? tab.openerTabId);
                const paiTab = (paiId !== undefined && paiId !== tab.id) ? abas.find(t => t.id === paiId) : null;

                /* Filho de guia fixada -> vira "pai nato" na 1ª guia não fixada (após chrome-extension:) */
                if (paiTab && paiTab.pinned) {
                    this._p_arvoreOpener.delete(tab.id);
                    if (atual.index !== primeiroAposExt && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this._p_moverAbaComRetry(tab.id, primeiroAposExt, chromeApi);
                        if (movOk) this._p_posicionadasInicialmente.add(tab.id);
                    } else {
                        this._p_posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                if (!paiTab) {
                    /* Nova guia raiz avulsa: última posição (padrão do Chrome) */
                    const idxUltimo = abas.length - 1;
                    if (atual.index !== idxUltimo && typeof chromeApi.tabs.move === 'function') {
                        const movOk = await this._p_moverAbaComRetry(tab.id, idxUltimo, chromeApi);
                        if (movOk) this._p_posicionadasInicialmente.add(tab.id);
                    } else {
                        this._p_posicionadasInicialmente.add(tab.id);
                    }
                    return;
                }

                /* Aba FILHA de pai não fixado: agrupa pai+filha se Agrupar ativo (cor randômica, título vazio) e vai IMEDIATAMENTE à direita do pai */
                const agruparAtivo = (config && config.agruparGuiasAutomatico !== undefined) ? Boolean(config.agruparGuiasAutomatico) : true;
                if (agruparAtivo && typeof chromeApi.tabs.group === 'function') {
                    if (typeof paiTab.groupId === 'number' && paiTab.groupId > 0) {
                        if (!atual.groupId || atual.groupId <= 0) {
                            await chromeApi.tabs.group({ groupId: paiTab.groupId, tabIds: [tab.id] }).catch(() => { });
                        }
                    } else {
                        try {
                            const novoGroupId = await chromeApi.tabs.group({ tabIds: [paiTab.id, tab.id] });
                            if (novoGroupId > 0 && chromeApi.tabGroups && typeof chromeApi.tabGroups.update === 'function') {
                                const cores = ['blue', 'cyan', 'green', 'orange', 'pink', 'purple', 'red', 'yellow', 'grey'];
                                const corRand = cores[Math.floor(Math.random() * cores.length)];
                                const tituloGrupo = this.extrairNomePrimarioDominio(paiTab.url || paiTab.pendingUrl || urlTab);
                                await chromeApi.tabGroups.update(novoGroupId, { title: tituloGrupo, color: corRand, collapsed: false }).catch(() => { });
                            }
                        } catch (_) { }
                    }
                }

                let idxDestino = (atual.index < paiTab.index) ? paiTab.index : (paiTab.index + 1);
                idxDestino = Math.max(primeiroNaoFixado, Math.min(abas.length - 1, idxDestino));
                if (atual.index !== idxDestino && typeof chromeApi.tabs.move === 'function') {
                    const movOk = await this._p_moverAbaComRetry(tab.id, idxDestino, chromeApi);
                    if (movOk) this._p_posicionadasInicialmente.add(tab.id);
                } else {
                    this._p_posicionadasInicialmente.add(tab.id);
                }
            } finally {
                setTimeout(() => { this._p_estaMovendoBloco = false; }, 120);
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
            if (this._p_estaMovendoBloco || this._p_estaOrdenandoGuias) return;
            const criterio = config.criterioOrdenacaoGuias || this._p_criterio;
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
            const paiId = this._p_arvoreOpener.get(tabId);
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

            this._p_estaMovendoBloco = true;
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
                setTimeout(() => { this._p_estaMovendoBloco = false; }, 160);
            }
        }

    }

        const _ext_GerenciadorOrdenacaoGuias = [
        { g: 'JusGovNavegadorOrdenacaoDominios', p: './navegador-ordenacao-dominios.js' },
        { g: 'JusGovNavegadorOrdenacaoGrupos', p: './navegador-ordenacao-grupos.js' }
    ];
    for (let i = 0; i < _ext_GerenciadorOrdenacaoGuias.length; i++) {
        const it = _ext_GerenciadorOrdenacaoGuias[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') Cls.instalarEm(GerenciadorOrdenacaoGuias.prototype);
    }

    Object.freeze(GerenciadorOrdenacaoGuias.prototype);
    return Object.freeze(GerenciadorOrdenacaoGuias);
}));

