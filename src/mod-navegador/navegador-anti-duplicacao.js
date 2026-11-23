/* ==========================================================================
 * ARQUIVO: src/mod-navegador/navegador-anti-duplicacao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-anti-duplicacao.js
 * - Classe Exportada: GerenciadorAntiDuplicacao (self.JusGovGerenciadorAntiDuplicacao)
 * - Métodos Públicos: normalizarUrl, normalizarUrlParaComparacao, fecharGuiasDuplicadas,
 *   processarNovaAba, processarAbaAtualizada, processarAbaRemovida, marcarPaginaModificada,
 *   carregarMapaAbasSession, salvarMapaAbasSessionDebounced, inicializarMapaAbas, obterMapaAbasUrls,
 *   getters/setters de preferências
 * - APIs Chrome Usadas: chrome.tabs.query, chrome.tabs.remove, chrome.tabs.update, chrome.tabs.reload, chrome.tabs.goBack, chrome.storage.session
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.47, Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Implementa a política anti-duplicação de guias: reutiliza guias já abertas na mesma janela
 *    em vez de abrir novas abas duplicadas, monitorando a URL original e atual.
 * 2) SALVAGUARDA DE FORMULÁRIOS E SPAS:
 *    Protege o trabalho do operador: se a página existente possuir formulários em edição
 *    ou navegação SPA ativa, não a reutiliza para evitar descarte acidental de dados.
 * 3) FECHAMENTO EM LOTE:
 *    Fornece o método fecharGuiasDuplicadas() para limpeza manual de abas repetidas sob demanda.
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
        raiz.JusGovGerenciadorAntiDuplicacao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorAntiDuplicacao {
        _p_reutilizarAbasAbertas = true;
        _p_focoPrimeiroPlano = true;
        _p_monitorarUrlOriginal = false;
        _p_monitorarUrlAtual = true;
        _p_protegerGuiasModificadas = true;
        _p_acaoConteudo = 'manter'; // 'manter', 'recarregar', 'recarregar_se_nao_modificada'
        _p_mapaAbasUrls = new Map();
        _p_timerSalvarSessionAbas = null;

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.reutilizarAbasAbertas === 'boolean') {
                this._p_reutilizarAbasAbertas = opcoes.reutilizarAbasAbertas;
            }
            if (typeof opcoes.focoPrimeiroPlano === 'boolean') {
                this._p_focoPrimeiroPlano = opcoes.focoPrimeiroPlano;
            }
            if (typeof opcoes.monitorarUrlOriginal === 'boolean') {
                this._p_monitorarUrlOriginal = opcoes.monitorarUrlOriginal;
            }
            if (typeof opcoes.monitorarUrlAtual === 'boolean') {
                this._p_monitorarUrlAtual = opcoes.monitorarUrlAtual;
            }
            if (typeof opcoes.protegerGuiasModificadas === 'boolean') {
                this._p_protegerGuiasModificadas = opcoes.protegerGuiasModificadas;
            }
            if (typeof opcoes.acaoConteudo === 'string') {
                this._p_acaoConteudo = opcoes.acaoConteudo;
            }
        }

        get reutilizarAbasAbertas() { return this._p_reutilizarAbasAbertas; }
        set reutilizarAbasAbertas(v) { this._p_reutilizarAbasAbertas = Boolean(v); }

        get focoPrimeiroPlano() { return this._p_focoPrimeiroPlano; }
        set focoPrimeiroPlano(v) { this._p_focoPrimeiroPlano = Boolean(v); }

        get monitorarUrlOriginal() { return this._p_monitorarUrlOriginal; }
        set monitorarUrlOriginal(v) { this._p_monitorarUrlOriginal = Boolean(v); }

        get monitorarUrlAtual() { return this._p_monitorarUrlAtual; }
        set monitorarUrlAtual(v) { this._p_monitorarUrlAtual = Boolean(v); }

        get protegerGuiasModificadas() { return this._p_protegerGuiasModificadas; }
        set protegerGuiasModificadas(v) { this._p_protegerGuiasModificadas = Boolean(v); }

        get acaoConteudo() { return this._p_acaoConteudo; }
        set acaoConteudo(v) { this._p_acaoConteudo = String(v); }

        _p_obterProtegerModificadasEfetivo(config = {}) {
            const acao = (typeof config.reutilizarAbasAcaoConteudo === 'string' && config.reutilizarAbasAcaoConteudo)
                ? config.reutilizarAbasAcaoConteudo
                : this._p_acaoConteudo;
            if (acao === 'recarregar_se_modificada' || acao === 'recarregar_se_nao_modificada') {
                return false;
            }
            return (config.protegerGuiasModificadas !== undefined)
                ? (config.protegerGuiasModificadas !== false)
                : this._p_protegerGuiasModificadas;
        }

        get mapaAbasUrls() { return this._p_mapaAbasUrls; }

        obterMapaAbasUrls() {
            return this._p_mapaAbasUrls;
        }

        /**
         * Persistência e restauração do mapa de abas via chrome.storage.session
         * @param {Object} [chromeApi]
         */
        async carregarMapaAbasSession(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            try {
                if (chromeApi && chromeApi.storage && chromeApi.storage.session) {
                    const res = await chromeApi.storage.session.get('mapaAbasUrlsSession');
                    if (res && res.mapaAbasUrlsSession && typeof res.mapaAbasUrlsSession === 'object') {
                        for (const [idStr, val] of Object.entries(res.mapaAbasUrlsSession)) {
                            this._p_mapaAbasUrls.set(Number(idStr), val);
                        }
                    }
                }
            } catch (_) { }
        }

        /**
         * Salva o mapa de abas em storage.session com debouncing
         * @param {Object} [chromeApi]
         */
        salvarMapaAbasSessionDebounced(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_timerSalvarSessionAbas) clearTimeout(this._p_timerSalvarSessionAbas);
            this._p_timerSalvarSessionAbas = setTimeout(async () => {
                this._p_timerSalvarSessionAbas = null;
                try {
                    if (chromeApi && chromeApi.storage && chromeApi.storage.session) {
                        const obj = {};
                        for (const [id, val] of this._p_mapaAbasUrls.entries()) {
                            obj[id] = val;
                        }
                        await chromeApi.storage.session.set({ mapaAbasUrlsSession: obj });
                    }
                } catch (_) { }
            }, 150);
        }

        /**
         * Inicialização do mapa de abas no boot do Service Worker
         * @param {Object} [chromeApi]
         */
        async inicializarMapaAbas(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            await this.carregarMapaAbasSession(chromeApi);
            if (chromeApi && chromeApi.tabs && typeof chromeApi.tabs.query === 'function') {
                try {
                    const abas = await chromeApi.tabs.query({});
                    if (Array.isArray(abas)) {
                        const agora = Date.now();
                        abas.forEach((t) => {
                            const u = this.normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                            if (u && u !== 'about:blank' && !u.startsWith('chrome://')) {
                                const existente = this._p_mapaAbasUrls.get(t.id);
                                if (!existente) {
                                    this._p_mapaAbasUrls.set(t.id, {
                                        urlOriginal: u,
                                        urlAtual: u,
                                        criadaEm: agora,
                                        ultimoAcessoNavegacao: agora,
                                        duplicacaoManualPermitida: false
                                    });
                                } else {
                                    existente.urlAtual = u;
                                    if (!existente.urlOriginal) existente.urlOriginal = u;
                                    this._p_mapaAbasUrls.set(t.id, existente);
                                }
                            }
                        });
                        this.salvarMapaAbasSessionDebounced(chromeApi);
                    }
                } catch (_) { }
            }
        }

        /**
         * Processa a criação de uma nova aba (chrome.tabs.onCreated)
         * @param {Object} tab
         * @param {Object} chromeApi
         * @param {Object} [config]
         */
        async processarNovaAba(tab, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), config = {}) {
            if (!tab || !chromeApi || !chromeApi.tabs) return { duplicada: false };
            try {
                const urlInicial = this.normalizarUrlParaComparacao(tab.url || tab.pendingUrl || '');
                const agora = Date.now();

                const ehNovaGuiaEmBranco = (u) => {
                    if (!u) return true;
                    return (
                        u === 'about:blank' ||
                        u === 'chrome://newtab' ||
                        u === 'edge://newtab' ||
                        u.startsWith('chrome://newtab/') ||
                        u.startsWith('edge://newtab/')
                    );
                };
                const ehNovaGuiaNavegador = ehNovaGuiaEmBranco(urlInicial);

                /* Detectar duplicação manual ("Duplicar") ou abertura de Nova Guia em branco (Ctrl+T / +) */
                let duplicacaoManualPermitida = false;
                if (tab.openerTabId) {
                    try {
                        const abaOrigem = await chromeApi.tabs.get(tab.openerTabId);
                        if (abaOrigem) {
                            const urlOrigem = this.normalizarUrlParaComparacao(abaOrigem.url || abaOrigem.pendingUrl || '');
                            if (tab.index === abaOrigem.index + 1 && urlInicial && urlInicial === urlOrigem) {
                                duplicacaoManualPermitida = true;
                            }
                        }
                    } catch (_) { }
                }
                const ehNovaGuiaUsuario = ehNovaGuiaNavegador && (urlInicial !== 'about:blank' || !tab.openerTabId);
                const isentarContraAnteriores = Boolean(duplicacaoManualPermitida || ehNovaGuiaUsuario);

                this._p_mapaAbasUrls.set(tab.id, {
                    urlOriginal: urlInicial || '',
                    urlAtual: urlInicial || '',
                    criadaEm: agora,
                    ultimoAcessoNavegacao: agora,
                    duplicacaoManualPermitida,
                    isentarContraAnteriores
                });
                this.salvarMapaAbasSessionDebounced(chromeApi);

                const reutilizarAtivo = (typeof config.reutilizarAbasAbertas === 'boolean') ? config.reutilizarAbasAbertas : this._p_reutilizarAbasAbertas;
                if (!isentarContraAnteriores && reutilizarAtivo !== false && urlInicial && !ehNovaGuiaNavegador && !urlInicial.startsWith('chrome://')) {
                    const abasJanela = await chromeApi.tabs.query({});
                    const monOrig = (config.monitorarUrlOriginalAbertura !== undefined) ? Boolean(config.monitorarUrlOriginalAbertura) : this._p_monitorarUrlOriginal;
                    const monAtual = (config.monitorarUrlAtualPagina !== undefined) ? (config.monitorarUrlAtualPagina !== false) : this._p_monitorarUrlAtual;
                    const protegerModificadas = this._p_obterProtegerModificadasEfetivo(config);

                    const regNova = this._p_mapaAbasUrls.get(tab.id);
                    const abaDuplicada = abasJanela.find((t) => {
                        if (t.id === tab.id) return false;
                        const reg = this._p_mapaAbasUrls.get(t.id);
                        /* FEAT-74: Novas abas abertas normalmente comparam contra todas as anteriores (inclusive novas guias/duplicadas) */
                        /* Seção 6.91 / FEAT-13: Se ambas forem modificadas e proteção estiver ativa, mantém ambas abertas */
                        if (protegerModificadas && reg && reg.paginaModificada && regNova && regNova.paginaModificada) {
                            return false;
                        }
                        const uAtual = this.normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                        const uOrig = (reg && reg.urlOriginal) ? reg.urlOriginal : uAtual;
                        const uEstab = (reg && reg.urlEstabilizada) ? reg.urlEstabilizada : '';
                        if (monAtual && (urlInicial === uAtual || (uEstab && urlInicial === uEstab))) return true;
                        if ((monOrig || (uOrig && uOrig !== uAtual)) && urlInicial === uOrig) return true;
                        return false;
                    });

                    if (abaDuplicada) {
                        const regDuplicada = this._p_mapaAbasUrls.get(abaDuplicada.id);

                        /* Seção 6.91 / FEAT-13: Se a nova for modificada e a existente não for, mantém a nova e fecha a existente */
                        if (protegerModificadas && regNova && regNova.paginaModificada && (!regDuplicada || !regDuplicada.paginaModificada)) {
                            await chromeApi.tabs.remove(abaDuplicada.id);
                            return { duplicada: true, abaExistente: tab };
                        }

                        const focarPrimeiroPlano = (config.reutilizarAbasFocoPrimeiroPlano !== undefined)
                            ? (config.reutilizarAbasFocoPrimeiroPlano !== false)
                            : this._p_focoPrimeiroPlano;

                        if (focarPrimeiroPlano) {
                            await chromeApi.tabs.update(abaDuplicada.id, { active: true });
                            if (abaDuplicada.windowId && chromeApi.windows) {
                                try { await chromeApi.windows.update(abaDuplicada.windowId, { focused: true }); } catch (_) { }
                            }
                        }

                        const acao = config.reutilizarAbasAcaoConteudo || this._p_acaoConteudo;
                        if (acao === 'recarregar') {
                            try { await chromeApi.tabs.reload(abaDuplicada.id); } catch (_) { }
                        } else if (acao === 'recarregar_se_modificada') {
                            if (regDuplicada && regDuplicada.paginaModificada) {
                                try { await chromeApi.tabs.reload(abaDuplicada.id); } catch (_) { }
                            }
                        } else if (acao === 'recarregar_se_nao_modificada') {
                            if (!regDuplicada || !regDuplicada.paginaModificada) {
                                try { await chromeApi.tabs.reload(abaDuplicada.id); } catch (_) { }
                            }
                        }

                        await chromeApi.tabs.remove(tab.id);
                        return { duplicada: true, abaExistente: abaDuplicada };
                    }
                }
                return { duplicada: false, duplicacaoManualPermitida };
            } catch (_) {
                return { duplicada: false, duplicacaoManualPermitida };
            }
        }

        /**
         * Processa a atualização de uma aba (chrome.tabs.onUpdated)
         * @param {number} tabId
         * @param {Object} changeInfo
         * @param {Object} tab
         * @param {Object} chromeApi
         * @param {Object} [config]
         */
        async processarAbaAtualizada(tabId, changeInfo, tab, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), config = {}) {
            if (!tabId || !chromeApi || !chromeApi.tabs) return { duplicada: false, duplicacaoManualPermitida: false };
            let duplicacaoManualPermitida = false;
            try {
                const regInicial = this._p_mapaAbasUrls.get(tabId);
                if (regInicial && (regInicial.duplicacaoManualPermitida || regInicial.isentarContraAnteriores)) {
                    duplicacaoManualPermitida = true;
                }
                if (changeInfo.url) {
                    const uNova = this.normalizarUrlParaComparacao(changeInfo.url);
                    let reg = this._p_mapaAbasUrls.get(tabId);
                    const urlAnteriorStr = reg && reg.urlAtual ? reg.urlAtual : '';
                    const ehOrigemEmBranco = Boolean(
                        !urlAnteriorStr ||
                        urlAnteriorStr === 'about:blank' ||
                        urlAnteriorStr === 'chrome://newtab' ||
                        urlAnteriorStr === 'edge://newtab' ||
                        urlAnteriorStr.startsWith('chrome://newtab/') ||
                        urlAnteriorStr.startsWith('edge://newtab/')
                    );
                    const urlAnteriorValida = (!ehOrigemEmBranco && urlAnteriorStr !== uNova)
                        ? urlAnteriorStr
                        : '';
                    const ehAbaPreExistente = Boolean(urlAnteriorValida || (reg && reg.carregamentoConcluido));

                    if (!reg) {
                        reg = {
                            urlOriginal: uNova,
                            urlAtual: uNova,
                            criadaEm: Date.now(),
                            ultimoAcessoNavegacao: Date.now(),
                            duplicacaoManualPermitida: false,
                            isentarContraAnteriores: false,
                            carregamentoConcluido: false
                        };
                    } else {
                        /* Preservar estritamente a URL original de abertura: nunca sobrescrever uma vez registrada */
                        if (!reg.urlOriginal || reg.urlOriginal === 'about:blank' || reg.urlOriginal.startsWith('chrome://newtab') || reg.urlOriginal.startsWith('edge://newtab') || reg.urlOriginal.startsWith('chrome://')) {
                            reg.urlOriginal = uNova;
                        }
                        if (urlAnteriorValida) {
                            reg.urlAnterior = urlAnteriorValida;
                        }
                        reg.urlAtual = uNova;
                        reg.ultimoAcessoNavegacao = Date.now();
                    }
                    const isentaNestaNavegacao = Boolean(reg.isentarContraAnteriores || reg.duplicacaoManualPermitida);
                    this._p_mapaAbasUrls.set(tabId, reg);
                    this.salvarMapaAbasSessionDebounced(chromeApi);

                    const reutilizarAtivo = (typeof config.reutilizarAbasAbertas === 'boolean') ? config.reutilizarAbasAbertas : this._p_reutilizarAbasAbertas;
                    if (!isentaNestaNavegacao && reutilizarAtivo !== false && uNova && uNova !== 'about:blank' && !uNova.startsWith('chrome://')) {
                        const abasJanela = await chromeApi.tabs.query({});
                        const monOrig = (config.monitorarUrlOriginalAbertura !== undefined) ? Boolean(config.monitorarUrlOriginalAbertura) : this._p_monitorarUrlOriginal;
                        const monAtual = (config.monitorarUrlAtualPagina !== undefined) ? (config.monitorarUrlAtualPagina !== false) : this._p_monitorarUrlAtual;
                        const protegerModificadas = this._p_obterProtegerModificadasEfetivo(config);

                        const abaExistente = abasJanela.find((t) => {
                            if (t.id === tabId) return false;
                            const regOutra = this._p_mapaAbasUrls.get(t.id);
                            /* FEAT-74: Novas abas comparam normalmente contra guias novas/duplicadas anteriores */
                            /* Seção 6.91 / FEAT-13: Se ambas forem modificadas e proteção ativa, mantém ambas */
                            if (protegerModificadas && regOutra && regOutra.paginaModificada && reg && reg.paginaModificada) {
                                return false;
                            }
                            const uOutra = this.normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                            const uOrigOutra = (regOutra && regOutra.urlOriginal) ? regOutra.urlOriginal : uOutra;
                            const uEstabOutra = (regOutra && regOutra.urlEstabilizada) ? regOutra.urlEstabilizada : '';
                            if (monAtual && (uNova === uOutra || (uEstabOutra && uNova === uEstabOutra))) return true;
                            if ((monOrig || (uOrigOutra && uOrigOutra !== uOutra)) && uNova === uOrigOutra) return true;
                            return false;
                        });

                        if (abaExistente) {
                            const regExistente = this._p_mapaAbasUrls.get(abaExistente.id);

                            /* Seção 6.91 / FEAT-13: Se a atual for modificada e a existente não for, mantém a atual e fecha a existente */
                            if (protegerModificadas && reg && reg.paginaModificada && (!regExistente || !regExistente.paginaModificada)) {
                                await chromeApi.tabs.remove(abaExistente.id);
                                return { duplicada: true, abaExistente: tab };
                            }

                            const focarPrimeiroPlano = (config.reutilizarAbasFocoPrimeiroPlano !== undefined)
                                ? (config.reutilizarAbasFocoPrimeiroPlano !== false)
                                : this._p_focoPrimeiroPlano;

                            if (focarPrimeiroPlano) {
                                await chromeApi.tabs.update(abaExistente.id, { active: true });
                                if (abaExistente.windowId && chromeApi.windows) {
                                    try { await chromeApi.windows.update(abaExistente.windowId, { focused: true }); } catch (_) { }
                                }
                            }

                            const acao = config.reutilizarAbasAcaoConteudo || this._p_acaoConteudo;
                            if (acao === 'recarregar') {
                                try { await chromeApi.tabs.reload(abaExistente.id); } catch (_) { }
                            } else if (acao === 'recarregar_se_modificada') {
                                if (regExistente && regExistente.paginaModificada) {
                                    try { await chromeApi.tabs.reload(abaExistente.id); } catch (_) { }
                                }
                            } else if (acao === 'recarregar_se_nao_modificada') {
                                if (!regExistente || !regExistente.paginaModificada) {
                                    try { await chromeApi.tabs.reload(abaExistente.id); } catch (_) { }
                                }
                            }

                            /* REGRA CRÍTICA DE ANTI-DUPLICAÇÃO (DIRETRIZ USUÁRIO):
                             * Se a URL duplicada estava tentando abrir na GUIA ATUAL (guia pré-existente onde o usuário
                             * já estava trabalhando), JAMAIS FECHAR ESTA GUIA! Manter a guia atual viva exatamente onde
                             * estava (revertendo a navegação com goBack ou restaurando sua URL anterior).
                             * O fechamento com remove(tabId) é restrito EXCLUSIVAMENTE a abas efêmeras/temporárias
                             * recém-criadas sem histórico prévio (criadas há menos de 2.5s e sem carregamento prévio concluído). */
                            const recemCriada = Boolean(reg && reg.criadaEm && (Date.now() - reg.criadaEm < 15000) && !reg.carregamentoConcluido);

                            if (ehAbaPreExistente || !recemCriada) {
                                if (urlAnteriorValida) {
                                    try {
                                        await chromeApi.tabs.goBack(tabId);
                                    } catch (_) {
                                        try {
                                            await chromeApi.tabs.update(tabId, { url: urlAnteriorValida });
                                        } catch (_) { }
                                    }
                                    reg.urlAtual = urlAnteriorValida;
                                    this._p_mapaAbasUrls.set(tabId, reg);
                                    this.salvarMapaAbasSessionDebounced(chromeApi);
                                } else {
                                    try {
                                        await chromeApi.tabs.goBack(tabId);
                                    } catch (_) { }
                                }
                                return { duplicada: true, abaExistente };
                            }

                            /* Apenas fecha se for comprovadamente uma nova guia descartável recém-criada */
                            try {
                                await chromeApi.tabs.remove(tabId);
                            } catch (_) { }
                            return { duplicada: true, abaExistente };
                        }
                    }
                }

                if (changeInfo.status === 'complete') {
                    let regAtual = this._p_mapaAbasUrls.get(tabId);
                    if (regAtual) {
                        const uEstabNova = this.normalizarUrlParaComparacao((tab && tab.url) || regAtual.urlAtual || '');
                        if (uEstabNova && uEstabNova !== 'about:blank' && !uEstabNova.startsWith('chrome://newtab') && !uEstabNova.startsWith('edge://newtab')) {
                            regAtual.urlEstabilizada = uEstabNova;
                            regAtual.urlAtual = uEstabNova;
                        }
                        regAtual.carregamentoConcluido = true;
                        regAtual.ultimoAcessoNavegacao = Date.now();
                        const uConc = regAtual.urlAtual || '';
                        if (uConc && uConc !== 'about:blank' && !uConc.startsWith('chrome://newtab') && !uConc.startsWith('edge://newtab')) {
                            regAtual.isentarContraAnteriores = false;
                            regAtual.duplicacaoManualPermitida = false;
                        }
                        this._p_mapaAbasUrls.set(tabId, regAtual);
                        this.salvarMapaAbasSessionDebounced(chromeApi);
                    }
                }
                return { duplicada: false, duplicacaoManualPermitida };
            } catch (_) {
                return { duplicada: false, duplicacaoManualPermitida };
            }
        }

        /**
         * Processa o encerramento de uma aba (chrome.tabs.onRemoved)
         * @param {number} tabId
         * @param {Object} [chromeApi]
         */
        processarAbaRemovida(tabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            this._p_mapaAbasUrls.delete(tabId);
            this.salvarMapaAbasSessionDebounced(chromeApi);
        }

        /**
         * Notifica modificação de página pelo Content Script para proteção contra fechamento acidental
         * @param {number} tabId
         * @param {boolean} modificada
         * @param {Object} [chromeApi]
         */
        marcarPaginaModificada(tabId, modificada = true, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            let reg = this._p_mapaAbasUrls.get(tabId);
            if (!reg) {
                reg = { urlOriginal: '', urlAtual: '', criadaEm: Date.now() };
            }
            reg.paginaModificada = Boolean(modificada);
            reg.modificadaEm = Date.now();
            this._p_mapaAbasUrls.set(tabId, reg);
            this.salvarMapaAbasSessionDebounced(chromeApi);
        }

        /**
         * Encontra todas as guias com URL duplicada na janela especificada e as encerra
         * @param {number|null} windowId
         * @param {Object} chromeApi
         * @param {Object} [config]
         * @returns {Promise<number>} Quantidade de guias duplicadas fechadas
         */
        async fecharGuiasDuplicadas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), config = {}) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.query !== 'function') return 0;

            try {
                const query = windowId ? { windowId } : { currentWindow: true };
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length <= 1) return 0;

                const monOrig = (config.monitorarUrlOriginalAbertura !== undefined) ? Boolean(config.monitorarUrlOriginalAbertura) : this._p_monitorarUrlOriginal;
                const monAtual = (config.monitorarUrlAtualPagina !== undefined) ? (config.monitorarUrlAtualPagina !== false) : this._p_monitorarUrlAtual;
                const protegerModificadas = this._p_obterProtegerModificadasEfetivo(config);

                const mapaGrupos = new Map();
                for (const t of abas) {
                    const uAtual = this.normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                    const reg = this._p_mapaAbasUrls.get(t.id);
                    const uOrig = (reg && reg.urlOriginal) ? reg.urlOriginal : uAtual;

                    const chaves = [];
                    if (monAtual && uAtual && uAtual !== 'about:blank' && !uAtual.startsWith('chrome://')) {
                        chaves.push(`atual:${uAtual}`);
                    }
                    if (monOrig && uOrig && uOrig !== 'about:blank' && !uOrig.startsWith('chrome://')) {
                        chaves.push(`orig:${uOrig}`);
                    }
                    if (chaves.length === 0) continue;

                    let grupoExistente = null;
                    for (const k of chaves) {
                        if (mapaGrupos.has(k)) {
                            grupoExistente = mapaGrupos.get(k);
                            break;
                        }
                    }
                    if (!grupoExistente) {
                        grupoExistente = [];
                        for (const k of chaves) {
                            mapaGrupos.set(k, grupoExistente);
                        }
                    } else {
                        for (const k of chaves) {
                            if (!mapaGrupos.has(k)) {
                                mapaGrupos.set(k, grupoExistente);
                            }
                        }
                    }
                    if (!grupoExistente.includes(t)) {
                        grupoExistente.push(t);
                    }
                }

                const idsParaFechar = [];
                const gruposUnicos = new Set(mapaGrupos.values());

                for (const grupo of gruposUnicos) {
                    if (grupo.length <= 1) continue;

                    const modificadas = [];
                    const naoModificadas = [];

                    for (const t of grupo) {
                        const reg = this._p_mapaAbasUrls.get(t.id);
                        if (reg && reg.paginaModificada) {
                            modificadas.push(t);
                        } else {
                            naoModificadas.push(t);
                        }
                    }

                    if (protegerModificadas) {
                        if (modificadas.length > 0) {
                            for (const t of naoModificadas) {
                                if (!t.pinned && !t.active) {
                                    idsParaFechar.push(t.id);
                                }
                            }
                        } else {
                            const eleita = this.selecionarEleitaPorDesempate(grupo);
                            for (const t of grupo) {
                                if (eleita && t.id !== eleita.id && !t.pinned && !t.active) {
                                    idsParaFechar.push(t.id);
                                }
                            }
                        }
                    } else {
                        const eleita = this.selecionarEleitaPorDesempate(grupo);
                        for (const t of grupo) {
                            if (eleita && t.id !== eleita.id && !t.pinned && !t.active) {
                                idsParaFechar.push(t.id);
                            }
                        }
                    }
                }

                if (idsParaFechar.length > 0) {
                    await chromeApi.tabs.remove(idsParaFechar);
                }
                return idsParaFechar.length;
            } catch (_) {
                return 0;
            }
        }
    }

        const _ext_GerenciadorAntiDuplicacao = [
        { g: 'JusGovNavegadorUrlsNormalizacao', p: './navegador-urls-normalizacao.js' }
    ];
    for (let i = 0; i < _ext_GerenciadorAntiDuplicacao.length; i++) {
        const it = _ext_GerenciadorAntiDuplicacao[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') Cls.instalarEm(GerenciadorAntiDuplicacao.prototype);
    }

    Object.freeze(GerenciadorAntiDuplicacao.prototype);
    return Object.freeze(GerenciadorAntiDuplicacao);
}));

