/* ==========================================================================
 * ARQUIVO: src/mod-navegador/mod-navegador.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/mod-navegador.js
 * - Classe Exportada: ModuloNavegador (self.JusGovModuloNavegador)
 * - Métodos Públicos: atualizarConfiguracoes(cfg), tratarNovaJanela, tratarNovaAba,
 *   tratarAbaAtualizada, tratarAbaRemovida, tratarIntervaloDescarte, fecharGuiasDuplicadas,
 *   agruparGuiasPorDominio, desagruparGuias, descartarGuiasEmSegundoPlano, inicializarSessaoAbas,
 *   inicializarHistoricoAbasAtivas, registrarAbaAtivadaHistorico, removerAbaHistorico,
 *   alternarParaUltimaAbaAtiva, navegarAbaCircular, obterWindowIdAlvo, verificarOuAtivarAba,
 *   abrirNovaAba, baixarLink, marcarPaginaModificada, get janelaUnica/antiDuplicacao/ordenacao/descarte, static get NULL_OBJECTS
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
        verificarDuplicacaoOnline: async () => ({ duplicada: false }),
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
        normalizarCriterio: (c) => String(c || 'nenhum'),
        ehCriterioDominio: () => false,
        ehUrlExtensao: () => false,
        ehUrlNovaGuiaEmBranco: () => false,
        registrarNavegacaoAba: () => { },
        registrarAtivacaoAba: () => { },
        extrairDominio: () => 'desconhecido',
        extrairInfoDominio: () => ({ baseDominio: '', subDominio: '', ehPuro: true, caminho: '', urlNormalizada: '' }),
        extrairDominioAgrupavel: () => '',
        compararAbasParaOrdenacao: () => 0,
        compararPorCriacaoCronologica: () => 0,
        registrarCriacaoAba: () => { },
        registrarRelacaoPaiFilha: () => { },
        garantirArvoreHidratada: async () => { },
        removerDaArvore: () => { },
        obterDescendentesDaAba: () => [],
        marcarFechamentoCascata: () => { },
        consumirFechamentoCascata: () => false,
        ehUrlRaizAlienOuInterna: () => false,
        desvincularPaiDaAba: () => { },
        obterPaiRegistrado: () => undefined,
        estaDesvinculadaManualmente: () => false,
        foiPosicionadaInicialmente: () => false,
        posicionarNovaAbaHierarquia: async () => { },
        tratarAbaMovidaManual: async () => { },
        sincronizarGruposDominioOnline: async () => { },
        sincronizarAbaNoCriterio: async () => { },
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
        _p_janelaUnica;
        _p_antiDuplicacao;
        _p_ordenacao;
        _p_descarte;
        _p_configuracoes = {};

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

            this._p_janelaUnica = opcoes.janelaUnica !== undefined ? (opcoes.janelaUnica || NULL_JANELA_UNICA) : (FabricaJanela ? new FabricaJanela() : NULL_JANELA_UNICA);
            this._p_antiDuplicacao = opcoes.antiDuplicacao !== undefined ? (opcoes.antiDuplicacao || NULL_ANTI_DUPLICACAO) : (FabricaAntiDup ? new FabricaAntiDup() : NULL_ANTI_DUPLICACAO);
            this._p_ordenacao = opcoes.ordenacao !== undefined ? (opcoes.ordenacao || NULL_ORDENACAO) : (FabricaOrdenacao ? new FabricaOrdenacao() : NULL_ORDENACAO);
            this._p_descarte = opcoes.descarte !== undefined ? (opcoes.descarte || NULL_DESCARTE) : (FabricaDescarte ? new FabricaDescarte() : NULL_DESCARTE);
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                janelaUnica: NULL_JANELA_UNICA,
                antiDuplicacao: NULL_ANTI_DUPLICACAO,
                ordenacao: NULL_ORDENACAO,
                descarte: NULL_DESCARTE
            });
        }

        get janelaUnica() { return this._p_janelaUnica; }
        get antiDuplicacao() { return this._p_antiDuplicacao; }
        get ordenacao() { return this._p_ordenacao; }
        get descarte() { return this._p_descarte; }
        get configuracoes() { return this._p_configuracoes; }

        /**
         * Sincroniza todas as preferências dos 4 serviços do navegador
         * (suportando tanto as chaves de formulário opt* quanto as chaves canônicas do chrome.storage.sync).
         * @param {Object} cfg
         */
        atualizarConfiguracoes(cfg = {}) {
            if (!cfg || typeof cfg !== 'object') return;
            this._p_configuracoes = { ...this._p_configuracoes, ...cfg };

            /* Janela Única */
            if (typeof cfg.optBloquearNovasJanelas === 'boolean') {
                this._p_janelaUnica.bloquearNovasJanelas = cfg.optBloquearNovasJanelas;
            } else if (typeof cfg.bloquearNovasJanelas === 'boolean') {
                this._p_janelaUnica.bloquearNovasJanelas = cfg.bloquearNovasJanelas;
            }
            if (typeof cfg.optPreservarJanelasAutenticacao === 'boolean') {
                this._p_janelaUnica.preservarJanelasAutenticacao = cfg.optPreservarJanelasAutenticacao;
            } else if (typeof cfg.preservarJanelasAutenticacao === 'boolean') {
                this._p_janelaUnica.preservarJanelasAutenticacao = cfg.preservarJanelasAutenticacao;
            }

            /* Anti-Duplicação */
            if (typeof cfg.optReutilizarAbasAbertas === 'boolean') {
                this._p_antiDuplicacao.reutilizarAbasAbertas = cfg.optReutilizarAbasAbertas;
            } else if (typeof cfg.reutilizarAbasAbertas === 'boolean') {
                this._p_antiDuplicacao.reutilizarAbasAbertas = cfg.reutilizarAbasAbertas;
            }
            if (typeof cfg.optReutilizarFocoPrimeiroPlano === 'boolean') {
                this._p_antiDuplicacao.focoPrimeiroPlano = cfg.optReutilizarFocoPrimeiroPlano;
            } else if (typeof cfg.reutilizarAbasFocoPrimeiroPlano === 'boolean') {
                this._p_antiDuplicacao.focoPrimeiroPlano = cfg.reutilizarAbasFocoPrimeiroPlano;
            }
            if (typeof cfg.optMonitorarUrlOriginal === 'boolean') {
                this._p_antiDuplicacao.monitorarUrlOriginal = cfg.optMonitorarUrlOriginal;
            } else if (typeof cfg.monitorarUrlOriginalAbertura === 'boolean') {
                this._p_antiDuplicacao.monitorarUrlOriginal = cfg.monitorarUrlOriginalAbertura;
            }
            if (typeof cfg.optMonitorarUrlAtual === 'boolean') {
                this._p_antiDuplicacao.monitorarUrlAtual = cfg.optMonitorarUrlAtual;
            } else if (typeof cfg.monitorarUrlAtualPagina === 'boolean') {
                this._p_antiDuplicacao.monitorarUrlAtual = cfg.monitorarUrlAtualPagina;
            }
            if (typeof cfg.optProtegerGuiasModificadas === 'boolean') {
                this._p_antiDuplicacao.protegerGuiasModificadas = cfg.optProtegerGuiasModificadas;
            } else if (typeof cfg.protegerGuiasModificadas === 'boolean') {
                this._p_antiDuplicacao.protegerGuiasModificadas = cfg.protegerGuiasModificadas;
            }
            if (typeof cfg.reutilizarAbasAcaoConteudo === 'string') {
                this._p_antiDuplicacao.acaoConteudo = cfg.reutilizarAbasAcaoConteudo;
            }

            /* Ordenação e Agrupamento */
            if (typeof cfg.optCriterioOrdenacaoGuias === 'string') {
                this._p_ordenacao.criterio = cfg.optCriterioOrdenacaoGuias;
            } else if (typeof cfg.criterioOrdenacaoGuias === 'string') {
                this._p_ordenacao.criterio = cfg.criterioOrdenacaoGuias;
            }
            if (typeof cfg.optSentidoOrdenacaoGuias === 'string') {
                this._p_ordenacao.sentido = cfg.optSentidoOrdenacaoGuias;
            } else if (typeof cfg.sentidoOrdenacaoGuias === 'string') {
                this._p_ordenacao.sentido = cfg.sentidoOrdenacaoGuias;
            }
            if (typeof cfg.optOrdenarGuiasFixadas === 'boolean') {
                this._p_ordenacao.ordenarGuiasFixadas = cfg.optOrdenarGuiasFixadas;
            } else if (typeof cfg.ordenarGuiasFixadas === 'boolean') {
                this._p_ordenacao.ordenarGuiasFixadas = cfg.ordenarGuiasFixadas;
            }

            /* Descarte / Economizador de RAM */
            if (typeof cfg.optDescarteGuiasInativas === 'boolean') {
                this._p_descarte.ativo = cfg.optDescarteGuiasInativas;
            } else if (typeof cfg.descarteGuiasInativasAtivo === 'boolean') {
                this._p_descarte.ativo = cfg.descarteGuiasInativasAtivo;
            }
            if (cfg.optTempoInatividadeDescarteMinutos !== undefined) {
                this._p_descarte.tempoInatividadeMinutos = cfg.optTempoInatividadeDescarteMinutos;
            } else if (cfg.tempoInatividadeDescarteMinutos !== undefined) {
                this._p_descarte.tempoInatividadeMinutos = cfg.tempoInatividadeDescarteMinutos;
            }
        }

        /**
         * Inicializa o rastreamento de abas e historico Ctrl+Tab na sessao (chrome.storage.session)
         * garantindo sobrevivencia a hibernacao do Service Worker Manifest V3.
         * @param {Object} [chromeApi]
         */
        async inicializarSessaoAbas(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.inicializarMapaAbas === 'function') {
                await this._p_antiDuplicacao.inicializarMapaAbas(chromeApi);
            }
            await this.inicializarHistoricoAbasAtivas(chromeApi);
            if (this._p_ordenacao && typeof this._p_ordenacao.garantirArvoreHidratada === 'function') {
                await this._p_ordenacao.garantirArvoreHidratada(chromeApi);
            }
        }

        /**
         * Trata o evento chrome.windows.onCreated
         * @param {Object} janela
         * @param {Object} [chromeApi]
         */
        async tratarNovaJanela(janela, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_janelaUnica && typeof this._p_janelaUnica.processarNovaJanela === 'function') {
                await this._p_janelaUnica.processarNovaJanela(janela, chromeApi, this._p_configuracoes, async (abaMovida, openerFallbackId) => {
                    if (!abaMovida || !abaMovida.id) return;
                    /* 1º: Sempre verificar anti-duplicação online ANTES de qualquer ordenação/árvore */
                    if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.verificarDuplicacaoOnline === 'function') {
                        const resDup = await this._p_antiDuplicacao.verificarDuplicacaoOnline(abaMovida, chromeApi, this._p_configuracoes);
                        if (resDup && resDup.duplicada) return;
                    }
                    if (!this._p_ordenacao) return;
                    const urlAba = abaMovida.url || abaMovida.pendingUrl || '';
                    const ehAlienOuSistema = typeof this._p_ordenacao.ehUrlRaizAlienOuInterna === 'function' && this._p_ordenacao.ehUrlRaizAlienOuInterna(urlAba);
                    const paiEfetivo = (typeof abaMovida.openerTabId === 'number' && abaMovida.openerTabId !== abaMovida.id)
                        ? abaMovida.openerTabId
                        : openerFallbackId;
                    if (!ehAlienOuSistema && typeof paiEfetivo === 'number' && paiEfetivo !== abaMovida.id && typeof this._p_ordenacao.registrarRelacaoPaiFilha === 'function') {
                        this._p_ordenacao.registrarRelacaoPaiFilha(abaMovida.id, paiEfetivo, chromeApi);
                    }
                    const critAtual = (this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || this._p_ordenacao.criterio;
                    if (critAtual === 'hierarquia_arvore' && typeof this._p_ordenacao.posicionarNovaAbaHierarquia === 'function') {
                        await this._p_ordenacao.posicionarNovaAbaHierarquia({ ...abaMovida, openerTabId: paiEfetivo }, this._p_configuracoes, chromeApi);
                    } else if (abaMovida.windowId && typeof this._p_ordenacao.agendarOrdenacaoAbas === 'function') {
                        const mapa = this._p_antiDuplicacao.obterMapaAbasUrls ? this._p_antiDuplicacao.obterMapaAbasUrls() : null;
                        this._p_ordenacao.agendarOrdenacaoAbas(abaMovida.windowId, this._p_configuracoes, chromeApi, mapa);
                    }
                });
            }
        }

        /**
         * Trata o evento chrome.tabs.onCreated
         * @param {Object} tab
         * @param {Object} [chromeApi]
         */
        async tratarNovaAba(tab, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            let res = { duplicada: false };
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.processarNovaAba === 'function') {
                res = await this._p_antiDuplicacao.processarNovaAba(tab, chromeApi, this._p_configuracoes);
                if (res && res.duplicada) return;
            }

            /* Seção 6.129 / BUG-51: Quando abaEmPrimeiroPlano está desmarcado, mantém foco na guia de origem */
            const emPrimeiroPlano = (this._p_configuracoes.abaEmPrimeiroPlano !== undefined)
                ? Boolean(this._p_configuracoes.abaEmPrimeiroPlano)
                : (this._p_configuracoes.abaEmSegundoPlano !== undefined ? (this._p_configuracoes.abaEmSegundoPlano === false) : true);
            const urlTab = (tab && (tab.pendingUrl || tab.url)) || '';
            const ehNovaGuiaNavegador = !urlTab || urlTab === 'chrome://newtab/' || urlTab === 'about:blank' || urlTab.startsWith('chrome://') || urlTab.startsWith('edge://');
            if (!emPrimeiroPlano && tab && tab.active && tab.openerTabId && !(res && res.duplicacaoManualPermitida) && !ehNovaGuiaNavegador && chromeApi && chromeApi.tabs) {
                chromeApi.tabs.update(tab.openerTabId, { active: true }).catch(() => { });
            }

            const critAtual = (this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || (this._p_ordenacao && this._p_ordenacao.criterio);
            const ehExtensao = Boolean(this._p_ordenacao && typeof this._p_ordenacao.ehUrlExtensao === 'function' && this._p_ordenacao.ehUrlExtensao(urlTab));
            const ehNewTabExplicita = /^(?:chrome|edge):\/\/newtab\/?$/i.test(String(urlTab || '').trim());
            const ehAlienOuSistema = Boolean(
                ehExtensao || ehNewTabExplicita ||
                (this._p_ordenacao && typeof this._p_ordenacao.ehUrlRaizAlienOuInterna === 'function' && this._p_ordenacao.ehUrlRaizAlienOuInterna(urlTab))
            );

            if (this._p_ordenacao) {
                if (typeof this._p_ordenacao.garantirArvoreHidratada === 'function') {
                    await this._p_ordenacao.garantirArvoreHidratada(chromeApi);
                }
                if (tab && tab.id && tab.openerTabId && !ehAlienOuSistema && typeof this._p_ordenacao.registrarRelacaoPaiFilha === 'function') {
                    this._p_ordenacao.registrarRelacaoPaiFilha(tab.id, tab.openerTabId, chromeApi);
                } else if (tab && tab.id) {
                    if (typeof this._p_ordenacao.registrarCriacaoAba === 'function') {
                        this._p_ordenacao.registrarCriacaoAba(tab.id);
                    }
                    if (ehAlienOuSistema && typeof this._p_ordenacao.desvincularPaiDaAba === 'function') {
                        this._p_ordenacao.desvincularPaiDaAba(tab.id, chromeApi);
                    }
                }

                const mapa = this._p_antiDuplicacao.obterMapaAbasUrls ? this._p_antiDuplicacao.obterMapaAbasUrls() : null;
                if (typeof this._p_ordenacao.sincronizarAbaNoCriterio === 'function') {
                    await this._p_ordenacao.sincronizarAbaNoCriterio(tab, 'criada', this._p_configuracoes, chromeApi, mapa);
                    return;
                }
                if (critAtual === 'hierarquia_arvore' && typeof this._p_ordenacao.posicionarNovaAbaHierarquia === 'function') {
                    await this._p_ordenacao.posicionarNovaAbaHierarquia(tab, this._p_configuracoes, chromeApi);
                    return;
                }
            }

            if (tab && tab.windowId && this._p_ordenacao && typeof this._p_ordenacao.agendarOrdenacaoAbas === 'function') {
                const mapa = this._p_antiDuplicacao.obterMapaAbasUrls ? this._p_antiDuplicacao.obterMapaAbasUrls() : null;
                this._p_ordenacao.agendarOrdenacaoAbas(tab.windowId, this._p_configuracoes, chromeApi, mapa);
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
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.processarAbaAtualizada === 'function') {
                const res = await this._p_antiDuplicacao.processarAbaAtualizada(tabId, changeInfo, tab, chromeApi, this._p_configuracoes);
                if (res && res.duplicada) return;
            }

            const mapa = this._p_antiDuplicacao.obterMapaAbasUrls ? this._p_antiDuplicacao.obterMapaAbasUrls() : null;

            /* Ao liberar (desafixar) uma guia, tenta ordená-la imediatamente conforme o critério ativo */
            if (changeInfo && changeInfo.pinned === false && tab && this._p_ordenacao && typeof this._p_ordenacao.sincronizarAbaNoCriterio === 'function') {
                await this._p_ordenacao.sincronizarAbaNoCriterio(tab, 'desafixada', this._p_configuracoes, chromeApi, mapa);
                return;
            }

            const critAtual = (this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || (this._p_ordenacao && this._p_ordenacao.criterio);
            if (critAtual === 'hierarquia_arvore') {
                const novaUrl = (changeInfo && changeInfo.url) || (tab && tab.url) || '';
                const ehExt = Boolean(this._p_ordenacao && typeof this._p_ordenacao.ehUrlExtensao === 'function' && this._p_ordenacao.ehUrlExtensao(novaUrl));
                const ehAlien = Boolean(ehExt || (this._p_ordenacao && typeof this._p_ordenacao.ehUrlRaizAlienOuInterna === 'function' && this._p_ordenacao.ehUrlRaizAlienOuInterna(novaUrl)));
                if (ehAlien) {
                    const paiAtual = typeof this._p_ordenacao.obterPaiRegistrado === 'function' ? this._p_ordenacao.obterPaiRegistrado(tabId) : undefined;
                    if (paiAtual !== undefined || (ehExt && changeInfo && changeInfo.url)) {
                        if (typeof this._p_ordenacao.desvincularPaiDaAba === 'function') {
                            this._p_ordenacao.desvincularPaiDaAba(tabId, chromeApi);
                        }
                        if (tab && typeof this._p_ordenacao.posicionarNovaAbaHierarquia === 'function') {
                            await this._p_ordenacao.posicionarNovaAbaHierarquia(tab, this._p_configuracoes, chromeApi);
                        }
                    }
                } else if (tab && this._p_ordenacao) {
                    const desvinculada = typeof this._p_ordenacao.estaDesvinculadaManualmente === 'function' && this._p_ordenacao.estaDesvinculadaManualmente(tabId);
                    const jaPosicionada = typeof this._p_ordenacao.foiPosicionadaInicialmente === 'function' && this._p_ordenacao.foiPosicionadaInicialmente(tabId);
                    const paiReg = typeof this._p_ordenacao.obterPaiRegistrado === 'function' ? this._p_ordenacao.obterPaiRegistrado(tabId) : undefined;
                    const precisaRegistrarOpener = Boolean(!desvinculada && paiReg === undefined && typeof tab.openerTabId === 'number' && tab.openerTabId !== tabId);
                    if (precisaRegistrarOpener && typeof this._p_ordenacao.registrarRelacaoPaiFilha === 'function') {
                        this._p_ordenacao.registrarRelacaoPaiFilha(tabId, tab.openerTabId, chromeApi);
                    }
                    if (!desvinculada && precisaRegistrarOpener && typeof this._p_ordenacao.posicionarNovaAbaHierarquia === 'function') {
                        await this._p_ordenacao.posicionarNovaAbaHierarquia(tab, this._p_configuracoes, chromeApi);
                    }
                }
                return;
            }

            if (tab && tab.windowId && this._p_ordenacao && typeof this._p_ordenacao.sincronizarAbaNoCriterio === 'function') {
                if (changeInfo && (changeInfo.url || (changeInfo.status === 'complete' && (critAtual === 'tempo_acesso' || critAtual === 'dominio_acesso')))) {
                    await this._p_ordenacao.sincronizarAbaNoCriterio(tab, 'url_mudou', this._p_configuracoes, chromeApi, mapa);
                } else if (changeInfo && (changeInfo.title || changeInfo.status === 'complete')) {
                    await this._p_ordenacao.sincronizarAbaNoCriterio(tab, 'titulo_mudou', this._p_configuracoes, chromeApi, mapa);
                }
            }
        }

        /**
         * Trata o evento chrome.tabs.onActivated para critérios de Última Ativação (Domínio ou Acesso).
         * @param {Object} activeInfo
         * @param {Object} [chromeApi]
         */
        async tratarAbaAtivada(activeInfo, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!activeInfo || !activeInfo.tabId) return;
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.get !== 'function') return;
            try {
                const tab = await chromeApi.tabs.get(activeInfo.tabId);
                if (!tab) return;
                /* 1º: Sempre verificar anti-duplicação online ANTES de qualquer ordenação */
                if (!tab.pinned && this._p_antiDuplicacao && typeof this._p_antiDuplicacao.verificarDuplicacaoOnline === 'function') {
                    const resDup = await this._p_antiDuplicacao.verificarDuplicacaoOnline(tab, chromeApi, this._p_configuracoes);
                    if (resDup && resDup.duplicada) return;
                }
                if (!this._p_ordenacao || typeof this._p_ordenacao.sincronizarAbaNoCriterio !== 'function') return;
                const critAtual = typeof this._p_ordenacao.normalizarCriterio === 'function'
                    ? this._p_ordenacao.normalizarCriterio((this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || this._p_ordenacao.criterio)
                    : ((this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || this._p_ordenacao.criterio);
                if (critAtual !== 'ultima_ativacao' && critAtual !== 'dominio_ativacao') return;
                if (tab.pinned) return;
                const mapa = this._p_antiDuplicacao.obterMapaAbasUrls ? this._p_antiDuplicacao.obterMapaAbasUrls() : null;
                await this._p_ordenacao.sincronizarAbaNoCriterio(tab, 'ativada', this._p_configuracoes, chromeApi, mapa);
            } catch (_) { }
        }

        /**
         * Trata movimentação manual de guias (chrome.tabs.onMoved) para manter filhos com o pai ou promover filha desmembrada.
         * @param {number} tabId
         * @param {Object} moveInfo
         * @param {Object} [chromeApi]
         */
        async tratarAbaMovida(tabId, moveInfo = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            /* 1º: Sempre verificar anti-duplicação online ANTES de qualquer ordenação/reorganização */
            if (tabId && chromeApi && chromeApi.tabs && typeof chromeApi.tabs.get === 'function' && this._p_antiDuplicacao && typeof this._p_antiDuplicacao.verificarDuplicacaoOnline === 'function') {
                try {
                    const tab = await chromeApi.tabs.get(tabId);
                    if (tab && !tab.pinned) {
                        const resDup = await this._p_antiDuplicacao.verificarDuplicacaoOnline(tab, chromeApi, this._p_configuracoes);
                        if (resDup && resDup.duplicada) return;
                    }
                } catch (_) { }
            }
            if (this._p_ordenacao && typeof this._p_ordenacao.tratarAbaMovidaManual === 'function') {
                await this._p_ordenacao.tratarAbaMovidaManual(tabId, moveInfo, chromeApi, this._p_configuracoes);
            }
        }

        /**
         * Trata o evento chrome.tabs.onRemoved
         * @param {number} tabId
         * @param {Object} [chromeApi]
         */
        tratarAbaRemovida(tabId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_ordenacao) {
                const emCascata = typeof this._p_ordenacao.consumirFechamentoCascata === 'function'
                    && this._p_ordenacao.consumirFechamentoCascata(tabId);
                const fecharTodos = Boolean(this._p_configuracoes && this._p_configuracoes.fecharHierarquiaEmCascata);
                const crit = (this._p_configuracoes && this._p_configuracoes.criterioOrdenacaoGuias) || this._p_ordenacao.criterio;
                if (!emCascata && fecharTodos && crit === 'hierarquia_arvore' && typeof this._p_ordenacao.obterDescendentesDaAba === 'function') {
                    const descendentes = this._p_ordenacao.obterDescendentesDaAba(tabId);
                    if (descendentes.length > 0 && chromeApi && chromeApi.tabs && typeof chromeApi.tabs.remove === 'function') {
                        if (typeof this._p_ordenacao.marcarFechamentoCascata === 'function') {
                            this._p_ordenacao.marcarFechamentoCascata(descendentes);
                        }
                        chromeApi.tabs.remove(descendentes).catch(() => { });
                    }
                }
                if (typeof this._p_ordenacao.removerDaArvore === 'function') {
                    this._p_ordenacao.removerDaArvore(tabId, chromeApi);
                }
                if (typeof this._p_ordenacao.desagruparGruposUnitarios === 'function') {
                    this._p_ordenacao.desagruparGruposUnitarios(chromeApi).catch(() => { });
                }
            }
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.processarAbaRemovida === 'function') {
                this._p_antiDuplicacao.processarAbaRemovida(tabId, chromeApi);
            }
        }

        /**
         * Trata ciclo periódico de descarte de abas inativas
         * @param {Object} [chromeApi]
         */
        async tratarIntervaloDescarte(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_descarte && typeof this._p_descarte.executarCicloDescarte === 'function') {
                await this._p_descarte.executarCicloDescarte(this._p_configuracoes, chromeApi);
            }
        }

        /**
         * Fecha guias duplicadas sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async fecharGuiasDuplicadas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.fecharGuiasDuplicadas === 'function') {
                return await this._p_antiDuplicacao.fecharGuiasDuplicadas(windowId, chromeApi, this._p_configuracoes);
            }
            return 0;
        }

        /**
         * Agrupa guias por domínio sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async agruparGuiasPorDominio(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_ordenacao && typeof this._p_ordenacao.agruparPorDominio === 'function') {
                return await this._p_ordenacao.agruparPorDominio(windowId, chromeApi);
            }
            return 0;
        }

        /**
         * Desagrupa guias sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async desagruparGuias(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_ordenacao && typeof this._p_ordenacao.desagruparTodas === 'function') {
                return await this._p_ordenacao.desagruparTodas(windowId, chromeApi);
            }
            return 0;
        }

        /**
         * Descarta guias inativas sob demanda
         * @param {number|null} [windowId=null]
         * @param {Object} [chromeApi]
         */
        async descartarGuiasEmSegundoPlano(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this._p_descarte && typeof this._p_descarte.descartarInativasAgora === 'function') {
                return await this._p_descarte.descartarInativasAgora(windowId, chromeApi);
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
            if (this._p_antiDuplicacao && typeof this._p_antiDuplicacao.marcarPaginaModificada === 'function') {
                this._p_antiDuplicacao.marcarPaginaModificada(tabId, modificada, chromeApi);
            }
        }
    }
    const _ext_ModuloNavegador = [
        { g: 'JusGovNavegadorHistoricoAbas', p: './navegador-historico-abas.js' },
        { g: 'JusGovNavegadorAcoesAbas', p: './navegador-acoes-abas.js' }
    ];
    for (let i = 0; i < _ext_ModuloNavegador.length; i++) {
        const it = _ext_ModuloNavegador[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(ModuloNavegador.prototype);
        }
    }

    Object.freeze(ModuloNavegador.prototype);
    return Object.freeze(ModuloNavegador);
}));


