/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-ordenacao-grupos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Navegador — Agrupamento por Domínio, Desagrupamento Unitário e Ordenação Online
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-ordenacao-grupos.js
 * - Classe Exportada: NavegadorOrdenacaoGrupos (self.JusGovNavegadorOrdenacaoGrupos) extends BaseModulo
 * - Métodos Públicos: extrairDominioAgrupavel, _p_obterCorDeterministicaDominio, extrairNomePrimarioDominio, desagruparGruposUnitarios, sincronizarGruposDominioOnline, _p_moverAbaParaExtremidade, sincronizarAbaNoCriterio, agendarOrdenacaoAbas, executarOrdenacaoGuias, agruparPorDominio, desagruparTodas, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovNavegadorOrdenacaoGrupos = fabrica(raiz);
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

    class NavegadorOrdenacaoGrupos extends Base {
        constructor() {
            super('NavegadorOrdenacaoGrupos');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(NavegadorOrdenacaoGrupos.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(NavegadorOrdenacaoGrupos.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
        _p_obterCorDeterministicaDominio(dominio) {
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

        /**
         * Extrai o nome primário do domínio em MAIÚSCULAS para rotular Tab Groups (ex.: www.trf1.jus.br -> TRF1, uol.com.br -> UOL).
         * @param {string} urlOuDom
         * @returns {string}
         */
        extrairNomePrimarioDominio(urlOuDom) {
            const raw = String(urlOuDom || '').trim();
            if (!raw) return '';
            const info = /^https?:\/\//i.test(raw) ? this.extrairInfoDominio(raw) : this.extrairInfoDominio(`https://${raw}`);
            const base = (info && info.baseDominio) ? info.baseDominio : raw.replace(/^www\./i, '');
            const prim = base.split('.')[0] || base;
            return prim.toUpperCase();
        }

        /**
         * Desagrupa automaticamente qualquer Tab Group que tenha ficado com apenas 1 guia.
         * @param {Object} [chromeApi]
         */
        async desagruparGruposUnitarios(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.ungroup !== 'function') return;
            try {
                const abas = await chromeApi.tabs.query({});
                const contagemPorGrupo = new Map();
                for (const t of (abas || [])) {
                    if (typeof t.groupId === 'number' && t.groupId > 0) {
                        if (!contagemPorGrupo.has(t.groupId)) contagemPorGrupo.set(t.groupId, []);
                        contagemPorGrupo.get(t.groupId).push(t.id);
                    }
                }
                const unitarias = [];
                for (const ids of contagemPorGrupo.values()) {
                    if (ids.length === 1) unitarias.push(ids[0]);
                }
                if (unitarias.length > 0) {
                    await chromeApi.tabs.ungroup(unitarias).catch(() => { });
                }
            } catch (_) { }
        }

        async sincronizarGruposDominioOnline(windowId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!windowId || !chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.group !== 'function') return;
            const prevBloq = this._p_estaMovendoBloco;
            this._p_estaMovendoBloco = true;
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
                                    title: this.extrairNomePrimarioDominio(dom),
                                    color: this._p_obterCorDeterministicaDominio(dom)
                                }).catch(() => { });
                            }
                        }
                    } catch (_) { }
                }
            } finally {
                if (!prevBloq) {
                    setTimeout(() => { this._p_estaMovendoBloco = false; }, 120);
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
        async _p_moverAbaParaExtremidade(tab, opcoes = {}, chromeApi = null) {
            if (!tab || !tab.id || !tab.windowId || !chromeApi || !chromeApi.tabs) return;
            const sentido = opcoes.sentido || this._p_sentido || 'esq_dir';
            const noInicio = (sentido !== 'dir_esq'); // esq_dir (Novo-Antigo) -> 1ª posição; dir_esq (Antigo-Novo) -> última posição
            const prevBloq = this._p_estaMovendoBloco;
            this._p_estaMovendoBloco = true;
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
                        await this._p_moverAbaComRetry(atual.id, idxAlvo, chromeApi);
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
                    await this._p_moverAbaComRetry(atual.id, idxAlvo, chromeApi);
                }
            } finally {
                if (!prevBloq) {
                    setTimeout(() => { this._p_estaMovendoBloco = false; }, 120);
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

            const crit = this.normalizarCriterio(config.criterioOrdenacaoGuias || this._p_criterio);
            if (!crit || crit === 'nenhum') return;

            const sentido = config.sentidoOrdenacaoGuias || this._p_sentido || 'esq_dir';
            const urlTab = tab.url || tab.pendingUrl || '';

            /* Regra Absoluta: chrome-extension: sempre na 1ª guia não fixada em qualquer critério ativo */
            if (this.ehUrlExtensao(urlTab) && (evento === 'criada' || evento === 'url_mudou' || evento === 'desafixada')) {
                const prevBloq = this._p_estaMovendoBloco;
                this._p_estaMovendoBloco = true;
                try {
                    const abas = await chromeApi.tabs.query({ windowId: tab.windowId }).catch(() => []);
                    abas.sort((a, b) => a.index - b.index);
                    const atual = abas.find(t => t.id === tab.id) || tab;
                    if (typeof atual.groupId === 'number' && atual.groupId > 0 && typeof chromeApi.tabs.ungroup === 'function') {
                        await chromeApi.tabs.ungroup([tab.id]).catch(() => { });
                    }
                    const primeiroNaoFixado = Math.max(0, abas.findIndex(t => !t.pinned));
                    if (atual.index !== primeiroNaoFixado) {
                        await this._p_moverAbaComRetry(tab.id, primeiroNaoFixado, chromeApi);
                    }
                } finally {
                    if (!prevBloq) setTimeout(() => { this._p_estaMovendoBloco = false; }, 120);
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
                    await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
                }
                return;
            }

            if (crit === 'tempo_acesso') {
                if (evento === 'url_mudou' || evento === 'criada' || evento === 'desafixada') {
                    this.registrarNavegacaoAba(tab.id);
                    await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
                }
                return;
            }

            if (crit === 'ultima_ativacao') {
                if (evento === 'ativada' || evento === 'criada' || evento === 'desafixada') {
                    this.registrarAtivacaoAba(tab.id);
                    await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: false }, chromeApi);
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
                const domAnterior = this._p_dominioAnteriorPorAba.get(tab.id);
                const mudouDominio = (domAnterior !== undefined && domAnterior !== novoDom);
                if (novoDom || domAnterior !== undefined) {
                    this._p_dominioAnteriorPorAba.set(tab.id, novoDom);
                }

                if (crit === 'dominio_criacao') {
                    if (evento === 'criada' || evento === 'desafixada' || (evento === 'url_mudou' && (mudouDominio || domAnterior === undefined))) {
                        await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                        await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
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
                        await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                        if (config.agruparGuiasAutomatico !== false) {
                            await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
                        }
                    }
                    return;
                }

                if (crit === 'dominio_ativacao') {
                    if (evento === 'ativada' || evento === 'criada' || evento === 'desafixada' || (evento === 'url_mudou' && mudouDominio)) {
                        if (evento === 'ativada') this.registrarAtivacaoAba(tab.id);
                        await this._p_moverAbaParaExtremidade(tab, { sentido, apenasDentroDoDominio: true }, chromeApi);
                        if (config.agruparGuiasAutomatico !== false) {
                            await this.sincronizarGruposDominioOnline(tab.windowId, chromeApi);
                        }
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
            const criterio = this.normalizarCriterio(config.criterioOrdenacaoGuias || this._p_criterio);
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this._p_timerOrdenacaoAbas) clearTimeout(this._p_timerOrdenacaoAbas);
            this._p_timerOrdenacaoAbas = setTimeout(async () => {
                this._p_timerOrdenacaoAbas = null;
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
            const criterio = this.normalizarCriterio(config.criterioOrdenacaoGuias || this._p_criterio);
            if (!windowId || !criterio || criterio === 'nenhum') return;
            if (this._p_estaOrdenandoGuias) return;
            this._p_estaOrdenandoGuias = true;

            try {
                await this.garantirArvoreHidratada(chromeApi);
                const sentido = config.sentidoOrdenacaoGuias || this._p_sentido || 'esq_dir';

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
                        const paiId = this._p_arvoreOpener.get(t.id) ?? t.openerTabId;
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

                /* Move sequencialmente mantendo consistência de índices e grupos, sem disparar onMoved manual */
                this._p_estaMovendoBloco = true;
                try {
                    for (let i = 0; i < abasOrdenadas.length; i++) {
                        const t = abasOrdenadas[i];
                        const novoIdx = indexInicial + i;
                        if (t.index !== novoIdx) {
                            try {
                                await chromeApi.tabs.move(t.id, { index: novoIdx });
                            } catch (_) { }
                        }
                    }
                } finally {
                    setTimeout(() => { this._p_estaMovendoBloco = false; }, 150);
                }

                /* Para qualquer subopção de "Domínio do Site", mantém Tab Groups agrupados online após ordenar */
                if (this.ehCriterioDominio(criterio)) {
                    await this.sincronizarGruposDominioOnline(windowId, chromeApi);
                }
            } finally {
                setTimeout(() => {
                    this._p_estaOrdenandoGuias = false;
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
                    if (tabIds.length >= 2) {
                        try {
                            const groupId = await chromeApi.tabs.group({ tabIds });
                            if (chromeApi.tabGroups && typeof chromeApi.tabGroups.update === 'function') {
                                const cor = coresDisponiveis[corIdx % coresDisponiveis.length];
                                corIdx++;
                                await chromeApi.tabGroups.update(groupId, {
                                    title: this.extrairNomePrimarioDominio(host),
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

    Object.freeze(NavegadorOrdenacaoGrupos.prototype);
    return Object.freeze(NavegadorOrdenacaoGrupos);
}));