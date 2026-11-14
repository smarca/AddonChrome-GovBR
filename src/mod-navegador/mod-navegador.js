/* ==========================================================================
 * Nome do arquivo: mod-navegador.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/mod-navegador.js
 * - Classe Exportada: ModuloNavegador (self.JusGovModuloNavegador)
 * - Métodos Públicos: atualizarConfiguracoes(cfg), tratarNovaJanela, tratarNovaAba,
 *   tratarAbaAtualizada, tratarAbaRemovida, tratarIntervaloDescarte, fecharGuiasDuplicadas,
 *   agruparGuiasPorDominio, desagruparGuias, descartarGuiasEmSegundoPlano, inicializarSessaoAbas,
 *   marcarPaginaModificada, get janelaUnica/antiDuplicacao/ordenacao/descarte, static get NULL_OBJECTS
 * - Dependências Injetadas: GerenciadorJanelaUnica, GerenciadorAntiDuplicacao, GerenciadorOrdenacaoGuias, GerenciadorDescarteGuias
 * - Regras / Seções: Diretrizes 11/14/16, ADR-006 (Null Objects c/ setters no-op em strict mode), Seção 6.47, Seção 6.64, Seção 6.78 (BP-06 / ARQ-01)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Fachada Principal (Facade) e Orquestrador central do Grupo 4 de opções do addon:
 *    "NAVEGADOR: Gerenciamento de Guias e Janelas".
 *    Centraliza e coordena:
 *    - Janela Única / Single Window (bloqueio de novas janelas avulsas e popups);
 *    - Reutilização e Anti-Duplicação de guias abertas;
 *    - Ordenação automática e agrupamento colorido via Tab Groups API;
 *    - Economizador de memória RAM (Tab Discarding).
 * 2) TOLERÂNCIA A FALHAS E PADRÃO NULL OBJECT (DIRETRIZ ROOT 16 / ADR-006):
 *    Se qualquer arquivo ou submódulo for excluído fisicamente ou falhar ao carregar,
 *    instancia automaticamente Null Objects seguros com métodos no-op estáveis.
 * 3) DELEGAÇÃO DE EVENTOS DO SERVICE WORKER:
 *    O Service Worker (background.js) atua exclusivamente como escuta de eventos nativos do Chrome
 *    e repassa diretamente para os métodos de ciclo de vida desta Fachada (tratarNovaJanela,
 *    tratarNovaAba, tratarAbaAtualizada, tratarAbaRemovida, etc.), mantendo isolamento absoluto.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 1, 9, 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-navegador)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004 e ADR-006)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloNavegador = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* =====================================================================
     * PASSO 1.1: DEFINIÇÃO DE NULL OBJECTS IMUTÁVEIS PARA OS 4 SUBMÓDULOS
     * Getters e setters no-op garantem compatibilidade total com 'use strict' (Seção 6.64),
     * impedindo TypeError ao atribuir configurações quando um submódulo estiver ausente.
     * ===================================================================== */
    const NULL_JANELA_UNICA = Object.freeze({
        get bloquearNovasJanelas() { return false; },
        set bloquearNovasJanelas(_) { },
        get preservarJanelasAutenticacao() { return true; },
        set preservarJanelasAutenticacao(_) { },
        ehJanelaDeAutenticacao: () => false,
        processarNovaJanela: async () => false
    });

    const NULL_ANTI_DUPLICACAO = Object.freeze({
        get reutilizarAbasAbertas() { return false; },
        set reutilizarAbasAbertas(_) { },
        get focoPrimeiroPlano() { return true; },
        set focoPrimeiroPlano(_) { },
        get monitorarUrlOriginal() { return false; },
        set monitorarUrlOriginal(_) { },
        get monitorarUrlAtual() { return false; },
        set monitorarUrlAtual(_) { },
        get protegerGuiasModificadas() { return true; },
        set protegerGuiasModificadas(_) { },
        get acaoConteudo() { return 'manter'; },
        set acaoConteudo(_) { },
        get mapaAbasUrls() { return new Map(); },
        normalizarUrl: (u) => String(u || ''),
        normalizarUrlParaComparacao: (u) => String(u || '').trim().toLowerCase(),
        carregarMapaAbasSession: async () => { },
        salvarMapaAbasSessionDebounced: () => { },
        inicializarMapaAbas: async () => { },
        processarNovaAba: async () => ({ duplicada: false }),
        processarAbaAtualizada: async () => ({ duplicada: false }),
        processarAbaRemovida: () => { },
        marcarPaginaModificada: () => { },
        obterMapaAbasUrls: () => new Map(),
        fecharGuiasDuplicadas: async () => 0
    });

    const NULL_ORDENACAO = Object.freeze({
        get criterio() { return 'nenhum'; },
        set criterio(_) { },
        get sentido() { return 'esq_dir'; },
        set sentido(_) { },
        get ordenarGuiasFixadas() { return false; },
        set ordenarGuiasFixadas(_) { },
        extrairDominio: () => 'desconhecido',
        extrairInfoDominio: () => ({ baseDominio: '', subDominio: '', ehPuro: true, caminho: '', urlNormalizada: '' }),
        compararAbasParaOrdenacao: () => 0,
        agendarOrdenacaoAbas: () => { },
        executarOrdenacaoGuias: async () => { },
        agruparPorDominio: async () => 0,
        desagruparTodas: async () => 0
    });

    const NULL_DESCARTE = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        get tempoInatividadeMinutos() { return 20; },
        set tempoInatividadeMinutos(_) { },
        descartarInativasAgora: async () => 0,
        descartarGuiasEmSegundoPlano: async () => 0,
        executarCicloDescarte: async () => 0
    });

    class ModuloNavegador {
        #janelaUnica;
        #antiDuplicacao;
        #ordenacao;
        #descarte;
        #configuracoes = {};

        /**
         * @param {Object} [opcoes={}]
         * @param {Object} [opcoes.janelaUnica]
         * @param {Object} [opcoes.antiDuplicacao]
         * @param {Object} [opcoes.ordenacao]
         * @param {Object} [opcoes.descarte]
         */
        constructor(opcoes = {}) {
            /* Passo 1.2: Injeção com fallback defensivo para construtores globais ou Null Objects */
            const FabricaJanela = typeof self !== 'undefined' && self.JusGovGerenciadorJanelaUnica;
            const FabricaAntiDup = typeof self !== 'undefined' && self.JusGovGerenciadorAntiDuplicacao;
            const FabricaOrdenacao = typeof self !== 'undefined' && self.JusGovGerenciadorOrdenacaoGuias;
            const FabricaDescarte = typeof self !== 'undefined' && self.JusGovGerenciadorDescarteGuias;

            this.#janelaUnica = opcoes.janelaUnica !== undefined ? (opcoes.janelaUnica || NULL_JANELA_UNICA) : (FabricaJanela ? new FabricaJanela() : NULL_JANELA_UNICA);
            this.#antiDuplicacao = opcoes.antiDuplicacao !== undefined ? (opcoes.antiDuplicacao || NULL_ANTI_DUPLICACAO) : (FabricaAntiDup ? new FabricaAntiDup() : NULL_ANTI_DUPLICACAO);
            this.#ordenacao = opcoes.ordenacao !== undefined ? (opcoes.ordenacao || NULL_ORDENACAO) : (FabricaOrdenacao ? new FabricaOrdenacao() : NULL_ORDENACAO);
            this.#descarte = opcoes.descarte !== undefined ? (opcoes.descarte || NULL_DESCARTE) : (FabricaDescarte ? new FabricaDescarte() : NULL_DESCARTE);
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                janelaUnica: NULL_JANELA_UNICA,
                antiDuplicacao: NULL_ANTI_DUPLICACAO,
                ordenacao: NULL_ORDENACAO,
                descarte: NULL_DESCARTE
            });
        }

        get janelaUnica() { return this.#janelaUnica; }
        get antiDuplicacao() { return this.#antiDuplicacao; }
        get ordenacao() { return this.#ordenacao; }
        get descarte() { return this.#descarte; }
        get configuracoes() { return this.#configuracoes; }

        /**
         * Sincroniza todas as preferências dos 4 serviços do navegador
         * (suportando tanto as chaves de formulário opt* quanto as chaves canônicas do chrome.storage.sync).
         * @param {Object} cfg
         */
        atualizarConfiguracoes(cfg = {}) {
            if (!cfg || typeof cfg !== 'object') return;
            this.#configuracoes = { ...this.#configuracoes, ...cfg };

            /* Janela Única */
            if (typeof cfg.optBloquearNovasJanelas === 'boolean') {
                this.#janelaUnica.bloquearNovasJanelas = cfg.optBloquearNovasJanelas;
            } else if (typeof cfg.bloquearNovasJanelas === 'boolean') {
                this.#janelaUnica.bloquearNovasJanelas = cfg.bloquearNovasJanelas;
            }
            if (typeof cfg.optPreservarJanelasAutenticacao === 'boolean') {
                this.#janelaUnica.preservarJanelasAutenticacao = cfg.optPreservarJanelasAutenticacao;
            } else if (typeof cfg.preservarJanelasAutenticacao === 'boolean') {
                this.#janelaUnica.preservarJanelasAutenticacao = cfg.preservarJanelasAutenticacao;
            }

            /* Anti-Duplicação */
            if (typeof cfg.optReutilizarAbasAbertas === 'boolean') {
                this.#antiDuplicacao.reutilizarAbasAbertas = cfg.optReutilizarAbasAbertas;
            } else if (typeof cfg.reutilizarAbasAbertas === 'boolean') {
                this.#antiDuplicacao.reutilizarAbasAbertas = cfg.reutilizarAbasAbertas;
            }
            if (typeof cfg.optReutilizarFocoPrimeiroPlano === 'boolean') {
                this.#antiDuplicacao.focoPrimeiroPlano = cfg.optReutilizarFocoPrimeiroPlano;
            } else if (typeof cfg.reutilizarAbasFocoPrimeiroPlano === 'boolean') {
                this.#antiDuplicacao.focoPrimeiroPlano = cfg.reutilizarAbasFocoPrimeiroPlano;
            }
            if (typeof cfg.optMonitorarUrlOriginal === 'boolean') {
                this.#antiDuplicacao.monitorarUrlOriginal = cfg.optMonitorarUrlOriginal;
            } else if (typeof cfg.monitorarUrlOriginalAbertura === 'boolean') {
                this.#antiDuplicacao.monitorarUrlOriginal = cfg.monitorarUrlOriginalAbertura;
            }
            if (typeof cfg.optMonitorarUrlAtual === 'boolean') {
                this.#antiDuplicacao.monitorarUrlAtual = cfg.optMonitorarUrlAtual;
            } else if (typeof cfg.monitorarUrlAtualPagina === 'boolean') {
                this.#antiDuplicacao.monitorarUrlAtual = cfg.monitorarUrlAtualPagina;
            }
            if (typeof cfg.optProtegerGuiasModificadas === 'boolean') {
                this.#antiDuplicacao.protegerGuiasModificadas = cfg.optProtegerGuiasModificadas;
            } else if (typeof cfg.protegerGuiasModificadas === 'boolean') {
                this.#antiDuplicacao.protegerGuiasModificadas = cfg.protegerGuiasModificadas;
            }
            if (typeof cfg.reutilizarAbasAcaoConteudo === 'string') {
                this.#antiDuplicacao.acaoConteudo = cfg.reutilizarAbasAcaoConteudo;
            }

            /* Ordenação e Agrupamento */
            if (typeof cfg.optCriterioOrdenacaoGuias === 'string') {
                this.#ordenacao.criterio = cfg.optCriterioOrdenacaoGuias;
            } else if (typeof cfg.criterioOrdenacaoGuias === 'string') {
                this.#ordenacao.criterio = cfg.criterioOrdenacaoGuias;
            }
            if (typeof cfg.optSentidoOrdenacaoGuias === 'string') {
                this.#ordenacao.sentido = cfg.optSentidoOrdenacaoGuias;
            } else if (typeof cfg.sentidoOrdenacaoGuias === 'string') {
                this.#ordenacao.sentido = cfg.sentidoOrdenacaoGuias;
            }
            if (typeof cfg.optOrdenarGuiasFixadas === 'boolean') {
                this.#ordenacao.ordenarGuiasFixadas = cfg.optOrdenarGuiasFixadas;
            } else if (typeof cfg.ordenarGuiasFixadas === 'boolean') {
                this.#ordenacao.ordenarGuiasFixadas = cfg.ordenarGuiasFixadas;
            }

            /* Descarte / Economizador de RAM */
            if (typeof cfg.optDescarteGuiasInativas === 'boolean') {
                this.#descarte.ativo = cfg.optDescarteGuiasInativas;
            } else if (typeof cfg.descarteGuiasInativasAtivo === 'boolean') {
                this.#descarte.ativo = cfg.descarteGuiasInativasAtivo;
            }
            if (cfg.optTempoInatividadeDescarteMinutos !== undefined) {
                this.#descarte.tempoInatividadeMinutos = cfg.optTempoInatividadeDescarteMinutos;
            } else if (cfg.tempoInatividadeDescarteMinutos !== undefined) {
                this.#descarte.tempoInatividadeMinutos = cfg.tempoInatividadeDescarteMinutos;
            }
        }

        /**
         * Inicializa o rastreamento de abas na sessão
         * @param {Object} [chromeApi]
         */
        async inicializarSessaoAbas(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.inicializarMapaAbas === 'function') {
                await this.#antiDuplicacao.inicializarMapaAbas(chromeApi);
            }
        }

        /**
         * Trata o evento chrome.windows.onCreated
         * @param {Object} janela
         * @param {Object} [chromeApi]
         */
        async tratarNovaJanela(janela, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#janelaUnica && typeof this.#janelaUnica.processarNovaJanela === 'function') {
                await this.#janelaUnica.processarNovaJanela(janela, chromeApi, this.#configuracoes);
            }
        }

        /**
         * Trata o evento chrome.tabs.onCreated
         * @param {Object} tab
         * @param {Object} [chromeApi]
         */
        async tratarNovaAba(tab, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            let res = { duplicada: false };
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.processarNovaAba === 'function') {
                res = await this.#antiDuplicacao.processarNovaAba(tab, chromeApi, this.#configuracoes);
                if (res && res.duplicada) return;
            }

            /* Seção 6.129 / BUG-51: Quando abaEmPrimeiroPlano está desmarcado, mantém foco na guia de origem */
            const emPrimeiroPlano = (this.#configuracoes.abaEmPrimeiroPlano !== undefined)
                ? Boolean(this.#configuracoes.abaEmPrimeiroPlano)
                : (this.#configuracoes.abaEmSegundoPlano !== undefined ? (this.#configuracoes.abaEmSegundoPlano === false) : true);
            const urlTab = (tab && (tab.pendingUrl || tab.url)) || '';
            const ehNovaGuiaNavegador = !urlTab || urlTab === 'chrome://newtab/' || urlTab === 'about:blank' || urlTab.startsWith('chrome://') || urlTab.startsWith('edge://');
            if (!emPrimeiroPlano && tab && tab.active && tab.openerTabId && !(res && res.duplicacaoManualPermitida) && !ehNovaGuiaNavegador && chromeApi && chromeApi.tabs) {
                chromeApi.tabs.update(tab.openerTabId, { active: true }).catch(() => { });
            }

            if (tab && tab.id && tab.openerTabId && this.#ordenacao && typeof this.#ordenacao.registrarRelacaoPaiFilha === 'function') {
                this.#ordenacao.registrarRelacaoPaiFilha(tab.id, tab.openerTabId);
            }

            if (tab && tab.windowId && this.#ordenacao && typeof this.#ordenacao.agendarOrdenacaoAbas === 'function') {
                const mapa = this.#antiDuplicacao.obterMapaAbasUrls ? this.#antiDuplicacao.obterMapaAbasUrls() : null;
                this.#ordenacao.agendarOrdenacaoAbas(tab.windowId, this.#configuracoes, chromeApi, mapa);
            }
        }

        /**
         * Trata o evento chrome.tabs.onUpdated
         * @param {number} tabId
         * @param {Object} changeInfo
         * @param {Object} tab
         * @param {Object} [chromeApi]
         */
        async tratarAbaAtualizada(tabId, changeInfo, tab, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.processarAbaAtualizada === 'function') {
                const res = await this.#antiDuplicacao.processarAbaAtualizada(tabId, changeInfo, tab, chromeApi, this.#configuracoes);
                if (res && res.duplicada) return;
            }

            if (tab && tab.windowId && (changeInfo.status === 'complete' || changeInfo.title || changeInfo.url)) {
                if (this.#ordenacao && typeof this.#ordenacao.agendarOrdenacaoAbas === 'function') {
                    const mapa = this.#antiDuplicacao.obterMapaAbasUrls ? this.#antiDuplicacao.obterMapaAbasUrls() : null;
                    this.#ordenacao.agendarOrdenacaoAbas(tab.windowId, this.#configuracoes, chromeApi, mapa);
                }
            }
        }

        /**
         * Trata o evento chrome.tabs.onRemoved
         * @param {number} tabId
         * @param {Object} [chromeApi]
         */
        tratarAbaRemovida(tabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#ordenacao) {
                const emCascata = typeof this.#ordenacao.consumirFechamentoCascata === 'function'
                    && this.#ordenacao.consumirFechamentoCascata(tabId);
                const fecharTodos = Boolean(this.#configuracoes && this.#configuracoes.fecharHierarquiaEmCascata);
                const crit = (this.#configuracoes && this.#configuracoes.criterioOrdenacaoGuias) || this.#ordenacao.criterio;
                if (!emCascata && fecharTodos && crit === 'hierarquia_arvore' && typeof this.#ordenacao.obterDescendentesDaAba === 'function') {
                    const descendentes = this.#ordenacao.obterDescendentesDaAba(tabId);
                    if (descendentes.length > 0 && chromeApi && chromeApi.tabs && typeof chromeApi.tabs.remove === 'function') {
                        if (typeof this.#ordenacao.marcarFechamentoCascata === 'function') {
                            this.#ordenacao.marcarFechamentoCascata(descendentes);
                        }
                        chromeApi.tabs.remove(descendentes).catch(() => { });
                    }
                }
                if (typeof this.#ordenacao.removerDaArvore === 'function') {
                    this.#ordenacao.removerDaArvore(tabId);
                }
            }
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.processarAbaRemovida === 'function') {
                this.#antiDuplicacao.processarAbaRemovida(tabId, chromeApi);
            }
        }

        /**
         * Trata ciclo periódico de descarte de abas inativas
         * @param {Object} [chromeApi]
         */
        async tratarIntervaloDescarte(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#descarte && typeof this.#descarte.executarCicloDescarte === 'function') {
                await this.#descarte.executarCicloDescarte(this.#configuracoes, chromeApi);
            }
        }

        /**
         * Fecha guias duplicadas sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async fecharGuiasDuplicadas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.fecharGuiasDuplicadas === 'function') {
                return await this.#antiDuplicacao.fecharGuiasDuplicadas(windowId, chromeApi, this.#configuracoes);
            }
            return 0;
        }

        /**
         * Agrupa guias por domínio sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async agruparGuiasPorDominio(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#ordenacao && typeof this.#ordenacao.agruparPorDominio === 'function') {
                return await this.#ordenacao.agruparPorDominio(windowId, chromeApi);
            }
            return 0;
        }

        /**
         * Desagrupa guias sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async desagruparGuias(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#ordenacao && typeof this.#ordenacao.desagruparTodas === 'function') {
                return await this.#ordenacao.desagruparTodas(windowId, chromeApi);
            }
            return 0;
        }

        /**
         * Descarta guias inativas sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async descartarGuiasEmSegundoPlano(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#descarte && typeof this.#descarte.descartarInativasAgora === 'function') {
                return await this.#descarte.descartarInativasAgora(windowId, chromeApi);
            }
            return 0;
        }

        /**
         * Marca página como modificada pelo usuário
         * @param {number} tabId
         * @param {boolean} [modificada=true]
         * @param {Object} [chromeApi]
         */
        marcarPaginaModificada(tabId, modificada = true, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#antiDuplicacao && typeof this.#antiDuplicacao.marcarPaginaModificada === 'function') {
                this.#antiDuplicacao.marcarPaginaModificada(tabId, modificada, chromeApi);
            }
        }
    }

    Object.freeze(ModuloNavegador.prototype);
    return Object.freeze(ModuloNavegador);
}));
