/* ==========================================================================
 * ARQUIVO: src/mod-automate/mod-automate.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/mod-automate.js
 *
 * @MAPA-IA
 * - Arquivo: src/mod-automate/mod-automate.js
 * - Modulo: mod-automate (Fachada Principal, Coordenador Background SW e API do Pseudo-Editor)
 * - Contexto: Background Service Worker (importScripts) e Content Script (ISOLATED World)
 * - Dependencias: Opcionais JusGovAutomateSeletores, JusGovAutomateEspera, JusGovAutomateDialogos,
 *   JusGovAutomateMotorFluxo (com degradacao graciosa Null Object caso qualquer subarquivo falte)
 * - Responsabilidade: Orquestrar o Modulo de Automacao PJe de forma 100% isolada e desacoplada,
 *   permitindo desativacao total via chave mestra (`automatePjeAtivo: false` por padrao), coordenacao
 *   de abas do PJe (Tarefas <-> Autos Digitais) no Background SW e exposicao da API declarativa
 *   JSON para o futuro Pseudo-Editor.
 * - Isolamento: Se a pasta `src/mod-automate/` inteira ou qualquer arquivo `.js`/`.json` for excluido,
 *   o restante da extensao continua operando sem nenhum erro (`ENG-01`, `ENG-02`).
 * ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.JusGovModuloAutomate = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Schema minimo de seguranca caso `automate-dados.json` tenha sido removido do disco.
     */
    const SCHEMA_FALLBACK_VAZIO = Object.freeze({
        meta: { modulo: 'mod-automate', versaoSchema: '1.1.0-fallback', nome: 'JusGovBR Automação de Tarefas — Motor Declarativo RPA' },
        contextosAutomacao: [
            {
                id: 'navegador_geral',
                nome: 'Navegador — Automação Geral',
                paiId: null,
                habilitado: false,
                ativarAutomaticamentePorDominio: false,
                dominiosAutoAtivacao: [],
                filhos: [
                    {
                        id: 'pje_trf1_1g',
                        nome: 'PJe 1º Grau — TRF1 (Produção e Beta)',
                        paiId: 'navegador_geral',
                        habilitado: false,
                        ativarAutomaticamentePorDominio: false,
                        dominiosAutoAtivacao: [
                            '*://*.pje.jus.br/*',
                            '*://*pje*.jus.br/*',
                            '*://*.jus.br/*/pje*',
                            '*://frontend.prd.cnj.cloud/*',
                            '*://sso.cloud.pje.jus.br/*'
                        ],
                        fluxoPrincipal: 'pje_ciclo_principal'
                    }
                ]
            }
        ],
        variaveisPadrao: {
            configuracao: {
                v_CFGTarefaSequencia: 'Ler e Movimentar',
                v_CFGQtdPagsSequencia: 1,
                v_CFGAutosLista: 'Sentença, Decisão, Despacho, Acórdão',
                v_CFGAutosSoma: 'Perícia, Laudo',
                v_CFGTermoPesquisa: '',
                v_CFGEtiquetaAuto: true,
                v_CFGMovimentar: 'Perguntar, com Sugestão Padrão'
            },
            constantes: {
                c_EtiquetaManterPadrao: 'PJE+R, D E S P A C H O, S E N T E N Ç A, D E C I S Ã O, Prioridade, Sigilo'
            },
            estadoExecucao: {
                v_ContadorProcSequencialX: 0
            }
        },
        opcoesDialogoConfig: {},
        listaMovimentosPadrao: ['- Não Movimentar, Só Tarefas'],
        tabelaMenuMovimentos: [],
        algoritmosEsperaIteracao: {},
        telas: {},
        repositorioObjetos: {},
        fluxosDeclarativos: {}
    });

    /**
     * Fachada Principal do Modulo de Automacao PJe (`src/mod-automate/`).
     */
    class JusGovModuloAutomate {
        /**
         * @param {Object} [opcoes]
         * @param {boolean} [opcoes.ativo=false] Estado inicial da chave mestra `automatePjeAtivo`.
         * @param {Object} [opcoes.dadosAutomate] Schema JSON injetado diretamente (ex.: testes ou preload).
         * @param {boolean} [opcoes.modoInstantaneo=false] Desativa delays em testes headless.
         * @param {Document} [opcoes.documentoRaiz]
         */
        constructor(opcoes = {}) {
            this.ativo = Boolean(opcoes && opcoes.ativo);
            this.modoInstantaneo = Boolean(opcoes && opcoes.modoInstantaneo);
            this.documentoRaiz = (opcoes && opcoes.documentoRaiz)
                ? opcoes.documentoRaiz
                : (typeof document !== 'undefined' ? document : null);

            const globalRef = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this);
            const dadosIniciais = (opcoes && opcoes.dadosAutomate) ||
                (globalRef && globalRef.__JUSGOV_AUTOMATE_DADOS_PRELOAD__) ||
                SCHEMA_FALLBACK_VAZIO;

            this.dadosAutomate = JSON.parse(JSON.stringify(dadosIniciais));
            this.seletores = null;
            this.espera = null;
            this.dialogos = null;
            this.motorFluxo = null;
            this.minimizado = false;
            this.fechadaNaAba = false;
            this.barraX = null;
            this.contextosOverrides = {};
            this._limparOuvintesBarra = null;
            this.monitorAtivo = false;
            this.modoMonitor = 'Silente';
            this._ultimoCnjAberto = '';
            this._processandoNovoProc = false;
            this._timerMonitorProc = null;
            this._observerMonitorProc = null;
            this._listenerCliqueMonitor = null;
            this._topicoSinteseAtivadoNesteFrame = false;
            this._timerTopicoSintese = null;

            this._inicializarSubmodulos(opcoes);
        }

        /**
         * Fabrica estatica de Objeto Nulo (`ENG-01`) para uso seguro quando o modulo estiver ausente ou desativado.
         * @returns {Object}
         */
        static criarObjetoNuloAutomate() {
            const noopAsync = async () => ({ sucesso: false, motivo: 'NULL_OBJECT' });
            return Object.freeze({
                ativo: false,
                estaAtivo: () => false,
                definirAtivo: () => false,
                carregarDadosDeclarativos: async () => SCHEMA_FALLBACK_VAZIO,
                obterSchemaDeclarativo: () => SCHEMA_FALLBACK_VAZIO,
                registrarObjetoUI: () => false,
                registrarFluxoDeclarativo: () => false,
                executarSubfluxo: noopAsync,
                executarFluxoDeclarativo: noopAsync,
                executarCicloPrincipal: noopAsync,
                abortarExecucao: () => {},
                tratarMensagemRuntime: () => false
            });
        }

        /**
         * Instancia os submodulos POO caso suas classes estejam carregadas no contexto atual.
         * @private
         */
        _inicializarSubmodulos(opcoes = {}) {
            const globalRef = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this);
            const ClasseSeletores = (opcoes && opcoes.ClasseSeletores) || (globalRef && globalRef.JusGovAutomateSeletores);
            const ClasseEspera = (opcoes && opcoes.ClasseEspera) || (globalRef && globalRef.JusGovAutomateEspera);
            const ClasseDialogos = (opcoes && opcoes.ClasseDialogos) || (globalRef && globalRef.JusGovAutomateDialogos);
            const ClasseMotorFluxo = (opcoes && opcoes.ClasseMotorFluxo) || (globalRef && globalRef.JusGovAutomateMotorFluxo);

            if (typeof ClasseSeletores === 'function') {
                this.seletores = new ClasseSeletores({
                    repositorioObjetos: this.dadosAutomate.repositorioObjetos || {},
                    documentoRaiz: this.documentoRaiz
                });
            }

            if (typeof ClasseEspera === 'function') {
                this.espera = new ClasseEspera({
                    seletores: this.seletores,
                    configAlgoritmos: this.dadosAutomate.algoritmosEsperaIteracao || {},
                    modoInstantaneo: this.modoInstantaneo
                });
            }

            if (typeof ClasseDialogos === 'function') {
                this.dialogos = new ClasseDialogos({
                    documentoRaiz: this.documentoRaiz,
                    manipuladorMock: opcoes ? opcoes.manipuladorMockDialogos : null
                });
            }

            if (typeof ClasseMotorFluxo === 'function') {
                this.motorFluxo = new ClasseMotorFluxo({
                    dadosAutomate: this.dadosAutomate,
                    seletores: this.seletores,
                    espera: this.espera,
                    dialogos: this.dialogos,
                    ponteAbas: (acao, payload) => this.enviarComandoBackground(acao, payload),
                    onStatus: (texto, detalhe) => this._notificarStatusBarraTopo(texto, detalhe)
                });
            }
        }

        /**
         * Ativa ou desativa globalmente o modulo de automacao.
         * Quando desativado (`false`), interrompe imediatamente qualquer aguardo/fluxo em andamento
         * e remove a barra flutuante caso nao haja auto-ativacao por dominio na aba.
         * @param {boolean} novoEstado
         * @param {Object} [opcoes]
         * @returns {boolean}
         */
        definirAtivo(novoEstado, opcoes = {}) {
            this.ativo = Boolean(novoEstado);
            if (!this.ativo) {
                if (!this.deveAtivarAutomaticamenteNaUrl()) {
                    this.abortarExecucao();
                }
            } else {
                if (opcoes && opcoes.restaurarBarra !== false) {
                    this.fechadaNaAba = false;
                    if (opcoes.expandir) this.minimizado = false;
                }
                if (typeof window !== 'undefined' && window === window.top) {
                    this.carregarDadosDeclarativos().catch(() => { });
                }
            }
            this.renderizarOuRemoverBarraControlePje(true);
            return this.ativo;
        }

        /**
         * Retorna se o modulo de automacao esta habilitado.
         * @returns {boolean}
         */
        estaAtivo() {
            return Boolean(this.ativo);
        }

        /**
         * Interrompe qualquer espera, loop ou dialogo aberto pelo modulo.
         */
        abortarExecucao() {
            if (typeof this.pararMonitorAutomacao === 'function') {
                this.pararMonitorAutomacao();
            }
            if (this.espera && typeof this.espera.definirAbortar === 'function') {
                this.espera.definirAbortar(true);
            }
            if (this.dialogos && typeof this.dialogos.fecharDialogoAtivo === 'function') {
                this.dialogos.fecharDialogoAtivo();
            }
            if (this.motorFluxo) {
                this.motorFluxo.emExecucao = false;
            }
        }

        /**
         * Carrega ou atualiza o schema declarativo (`automate-dados.json`) via objeto direto,
         * preload global ou IPC `OBTER_ARQUIVO_JSON_ESTATICO` do Background SW.
         * @param {Object} [dadosCustom]
         * @returns {Promise<Object>}
         */
        async carregarDadosDeclarativos(dadosCustom = null) {
            let dadosCarregados = dadosCustom;

            if (!dadosCarregados) {
                const globalRef = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this);
                if (globalRef && globalRef.__JUSGOV_AUTOMATE_DADOS_PRELOAD__) {
                    dadosCarregados = globalRef.__JUSGOV_AUTOMATE_DADOS_PRELOAD__;
                } else if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    try {
                        const resp = await new Promise((resolve) => {
                            chrome.runtime.sendMessage(
                                { acao: 'OBTER_JSON_ESTATICO', arquivo: 'automate-dados.json' },
                                (r) => {
                                    if (chrome.runtime.lastError) {
                                        resolve(null);
                                    } else {
                                        resolve(r);
                                    }
                                }
                            );
                        });
                        if (resp && (resp.ok || resp.sucesso) && resp.dados) {
                            dadosCarregados = resp.dados;
                        }
                    } catch (eIpc) {
                        dadosCarregados = null;
                    }
                }
            }

            if (dadosCarregados && typeof dadosCarregados === 'object') {
                this.dadosAutomate = JSON.parse(JSON.stringify(dadosCarregados));
                try {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function') {
                        const overridesBd = await new Promise((resolve) => {
                            chrome.storage.local.get(['jusgovAutomateObjetosUsuario', 'jusgovAutomateComandosUsuario', 'jusgovAutomateComandosOverrides', 'jusgovAutomateContextosUsuario'], (r) => resolve(r || {}));
                        });
                        if (overridesBd.jusgovAutomateObjetosUsuario && typeof overridesBd.jusgovAutomateObjetosUsuario === 'object') {
                            this.dadosAutomate.repositorioObjetos = Object.assign(
                                {},
                                this.dadosAutomate.repositorioObjetos || {},
                                overridesBd.jusgovAutomateObjetosUsuario
                            );
                        }
                        if (overridesBd.jusgovAutomateComandosOverrides && typeof overridesBd.jusgovAutomateComandosOverrides === 'object') {
                            const mapOvr = overridesBd.jusgovAutomateComandosOverrides;
                            if (Array.isArray(this.dadosAutomate.comandosInternos)) {
                                this.dadosAutomate.comandosInternos = this.dadosAutomate.comandosInternos.map((c) =>
                                    (c && c.id && mapOvr[c.id]) ? Object.assign({}, c, mapOvr[c.id], { id: c.id }) : c
                                );
                            }
                            if (Array.isArray(this.dadosAutomate.contextos)) {
                                this.dadosAutomate.contextos.forEach((ctx) => {
                                    if (ctx && Array.isArray(ctx.comandosInternos)) {
                                        ctx.comandosInternos = ctx.comandosInternos.map((c) =>
                                            (c && c.id && mapOvr[c.id]) ? Object.assign({}, c, mapOvr[c.id], { id: c.id }) : c
                                        );
                                    }
                                });
                            }
                            this.dadosAutomate.comandosOverrides = mapOvr;
                        }
                        if (Array.isArray(overridesBd.jusgovAutomateComandosUsuario)) {
                            this.dadosAutomate.comandosUsuario = overridesBd.jusgovAutomateComandosUsuario;
                        }
                        if (Array.isArray(overridesBd.jusgovAutomateContextosUsuario)) {
                            this.dadosAutomate.contextosUsuario = overridesBd.jusgovAutomateContextosUsuario;
                        }
                    }
                } catch (eMergeBd) { /* silencioso em headless/mock */ }
                if (this.contextosOverrides && Object.keys(this.contextosOverrides).length > 0) {
                    this.aplicarSobrescritasContextos(this.contextosOverrides);
                }
                if (this.seletores) {
                    this.seletores.definirRepositorioObjetos(this.dadosAutomate.repositorioObjetos || {}, true);
                }
                if (this.espera) {
                    this.espera.definirConfigAlgoritmos(this.dadosAutomate.algoritmosEsperaIteracao || {});
                }
                if (this.motorFluxo) {
                    this.motorFluxo.dadosAutomate = this.dadosAutomate;
                    this.motorFluxo.valoresPadrao();
                }
            }

            return this.dadosAutomate;
        }

        /**
         * Retorna uma copia profunda do schema declarativo atual (para inspecao/edicao no Pseudo-Editor).
         * @returns {Object}
         */
        obterSchemaDeclarativo() {
            return JSON.parse(JSON.stringify(this.dadosAutomate));
        }

        /**
         * Registra ou atualiza um objeto XPath/CSS/PAD-Custom no repositorio em memoria (API Pseudo-Editor).
         * @param {string} idObjeto
         * @param {Object} definicaoObjeto
         * @returns {boolean}
         */
        registrarObjetoUI(idObjeto, definicaoObjeto) {
            if (!idObjeto || !definicaoObjeto || typeof definicaoObjeto !== 'object') return false;
            if (!this.dadosAutomate.repositorioObjetos) {
                this.dadosAutomate.repositorioObjetos = {};
            }
            this.dadosAutomate.repositorioObjetos[idObjeto] = JSON.parse(JSON.stringify(definicaoObjeto));
            if (this.seletores) {
                return this.seletores.registrarObjeto(idObjeto, definicaoObjeto);
            }
            return true;
        }

        /**
         * Registra ou atualiza um fluxo declarativo JSON no motor (API Pseudo-Editor).
         * @param {string} idFluxo
         * @param {Object} definicaoFluxo
         * @returns {boolean}
         */
        registrarFluxoDeclarativo(idFluxo, definicaoFluxo) {
            if (!this.motorFluxo) return false;
            return this.motorFluxo.registrarFluxoDeclarativo(idFluxo, definicaoFluxo);
        }

        /**
         * Executa qualquer subfluxo do PJe (ex.: `'SetInfo_Tarefa'`, `'Etiqueta_Tarefas'`, `'TarefaModAuto'`),
         * respeitando a chave mestra `this.ativo`.
         * @param {string} nomeSubfluxo
         * @param {Object} [parametros]
         * @returns {Promise<any>}
         */
        async executarSubfluxo(nomeSubfluxo, parametros = {}) {
            if (!this.ativo) {
                return { sucesso: false, motivo: 'MODULO_DESATIVADO' };
            }
            if (!this.motorFluxo) {
                return { sucesso: false, motivo: 'MOTOR_INDISPONIVEL' };
            }
            return this.motorFluxo.executarSubfluxoPorNome(nomeSubfluxo, parametros);
        }

        /**
         * Executa um fluxo declarativo JSON customizado (criado pelo Pseudo-Editor), respeitando `this.ativo`.
         * @param {string|Object} idOuFluxo
         * @param {Object} [variaveisLocais]
         * @returns {Promise<Object>}
         */
        async executarFluxoDeclarativo(idOuFluxo, variaveisLocais = {}) {
            if (!this.ativo) {
                return { sucesso: false, motivo: 'MODULO_DESATIVADO' };
            }
            if (!this.motorFluxo) {
                return { sucesso: false, motivo: 'MOTOR_INDISPONIVEL' };
            }
            return this.motorFluxo.executarFluxoDeclarativo(idOuFluxo, variaveisLocais);
        }

        /**
         * Executa o ciclo principal de automacao PJe (`Cópia_de_Main`), respeitando `this.ativo`.
         * @param {Object} [opcoes]
         * @returns {Promise<Object>}
         */
        async executarCicloPrincipal(opcoes = {}) {
            if (!this.ativo) {
                return { sucesso: false, motivo: 'MODULO_DESATIVADO' };
            }
            if (!this.motorFluxo) {
                return { sucesso: false, motivo: 'MOTOR_INDISPONIVEL' };
            }
            return this.motorFluxo.executarCicloPrincipal(opcoes);
        }

        // =========================================================================
        // MONITOR AUTOMÁTICO DE NOVO PROCESSO SELECIONADO -> ABRIR AUTOS DIGITAIS
        // =========================================================================

        /**
         * Inicia o monitoramento na aba inteira (incluindo iframe#ngFrame cross-origin via Background SW)
         * para detectar sempre que um novo processo for selecionado no PJe e abrir automaticamente os autos.
         * @param {string} [modo='Silente']
         */
        iniciarMonitorAutomacao(modo = 'Silente') {
            this.monitorAtivo = true;
            this.fechadaNaAba = false;
            this.modoMonitor = String(modo || 'Silente');
            const payload = {
                modo: this.modoMonitor,
                visualizarAutos: this.motorFluxo ? (this.motorFluxo.obterVariavel('v_VisualizarAutos', true) !== false) : true,
                marcarLidos: this.motorFluxo ? Boolean(this.motorFluxo.obterVariavel('v_CFGMarcarLidosDocsAutos', true)) : true
            };
            if (typeof window !== 'undefined' && window === window.top && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    chrome.storage.local.set({
                        jusgovAutomateMonitorSessao: {
                            ativo: true,
                            modo: this.modoMonitor,
                            visualizarAutos: payload.visualizarAutos,
                            marcarLidos: payload.marcarLidos,
                            ts: Date.now()
                        }
                    }).catch(() => { });
                } catch (_) { }
            }
            this._iniciarMonitorLocalPje(payload);
            if (typeof window !== 'undefined' && window === window.top && typeof this.enviarComandoBackground === 'function') {
                this.enviarComandoBackground('AUTOMATE_BROADCAST_ABA', {
                    subAcao: 'AUTOMATE_INICIAR_MONITOR',
                    payload
                }).catch(() => { });
            }
        }

        /**
         * Interrompe o monitoramento local e em todos os iframes da aba.
         */
        pararMonitorAutomacao() {
            const estavaAtivo = this.monitorAtivo;
            this._pararMonitorLocalPje();
            if (typeof window !== 'undefined' && window === window.top && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    chrome.storage.local.set({ jusgovAutomateMonitorSessao: { ativo: false, ts: Date.now() } }).catch(() => { });
                } catch (_) { }
            }
            if (estavaAtivo && typeof window !== 'undefined' && window === window.top && typeof this.enviarComandoBackground === 'function') {
                this.enviarComandoBackground('AUTOMATE_BROADCAST_ABA', {
                    subAcao: 'AUTOMATE_PARAR_MONITOR',
                    payload: {}
                }).catch(() => { });
            }
        }

        /**
         * Verifica se o documento atual possui o painel de tarefas do PJe (direto ou via iframe#ngFrame same-origin).
         * @private
         */
        _obterDocumentoPainelPje() {
            const doc = this.documentoRaiz || (typeof document !== 'undefined' ? document : null);
            if (!doc || typeof doc.querySelector !== 'function') return null;
            if (doc.querySelector('#divProcessosTarefa, #frameTarefas, #conteudoTarefa, #processosTarefa')) {
                return doc;
            }
            const ifr = doc.querySelector('iframe#ngFrame');
            if (ifr) {
                try {
                    const docInt = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
                    if (docInt && docInt.querySelector('#divProcessosTarefa, #frameTarefas, #conteudoTarefa, #processosTarefa')) {
                        return docInt;
                    }
                } catch (_) {
                    return null;
                }
            }
            return null;
        }

        /**
         * Extrai o numero CNJ do processo atualmente carregado no painel de tarefa do PJe.
         * @private
         */
        _extrairCnjProcessoAtualPainel(docPainel) {
            if (!docPainel) return '';
            const rxCnj = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/;
            if (this.seletores && this.seletores.repositorioObjetos && this.seletores.repositorioObjetos.tarefaProcessoTarefa) {
                const txtSel = String(this.seletores.obterDetalheElemento('tarefaProcessoTarefa', 'Own Text', {}, docPainel) || '').trim();
                const mSel = txtSel.match(rxCnj);
                if (mSel) return mSel[1];
            }
            const candidatos = docPainel.querySelectorAll('#frameTarefas a[class*="processo"], #conteudoTarefa a[class*="processo"], #frameTarefas .titulo-topo, #frameTarefas h1, #frameTarefas h2, #frameTarefas h3, #frameTarefas span');
            for (let i = 0; i < candidatos.length; i++) {
                const txt = String(candidatos[i].textContent || '').trim();
                const m = txt.match(rxCnj);
                if (m) return m[1];
            }
            return '';
        }

        /**
         * Verifica se ha ampulheta/spinner ativo no painel de tarefas do PJe.
         * @private
         */
        _painelPjeEmCarregamento(docPainel) {
            if (!docPainel) return false;
            const spinners = docPainel.querySelectorAll('#divProcessosTarefa mat-progress-spinner circle, #conteudoTarefa mat-progress-spinner circle');
            for (let i = 0; i < spinners.length; i++) {
                const el = spinners[i];
                if (el && el.offsetParent !== null) return true;
            }
            return false;
        }

        /**
         * Localiza e clica no botao "Abrir autos digitais" do processo selecionado (cabecalho da tarefa ou card na listagem).
         * @private
         */
        _clicarBotaoAbrirAutos(docPainel, cnjAlvo) {
            if (!docPainel) return false;

            // 1) Tenta pelo repositorio declarativo `tarefaLerAutosBnt`
            if (this.seletores && this.seletores.repositorioObjetos && this.seletores.repositorioObjetos.tarefaLerAutosBnt) {
                if (this.seletores.contemElemento('tarefaLerAutosBnt', {}, docPainel)) {
                    if (this.seletores.clicarElemento('tarefaLerAutosBnt', {}, docPainel)) {
                        return true;
                    }
                }
            }

            // 2) Fallback direto no cabecalho do painel da tarefa (#frameTarefas / #conteudoTarefa)
            const seletoresCabecalho = [
                '#conteudoTarefa #frameTarefas button[title*="Autos" i]',
                '#frameTarefas button[title*="autos" i]',
                '#frameTarefas pje-link-autos-digitais button',
                '#conteudoTarefa pje-link-autos-digitais button',
                '#frameTarefas a[title*="autos" i]',
                '#frameTarefas button[aria-label*="autos" i]'
            ];
            for (let i = 0; i < seletoresCabecalho.length; i++) {
                try {
                    const btn = docPainel.querySelector(seletoresCabecalho[i]);
                    if (btn && typeof btn.click === 'function') {
                        btn.click();
                        return true;
                    }
                } catch (_) { }
            }

            // 3) Fallback na listagem da esquerda: encontra o card do CNJ selecionado e clica no seu pje-link-autos-digitais button
            if (cnjAlvo) {
                const cards = docPainel.querySelectorAll('processo-datalist-card, #processosTarefa li, #agrupador-etiqueta-aberta li');
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    if (card && String(card.textContent || '').includes(cnjAlvo)) {
                        const btnCard = card.querySelector('pje-link-autos-digitais button, button[title*="autos" i], a[title*="autos" i]');
                        if (btnCard && typeof btnCard.click === 'function') {
                            btnCard.click();
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        /**
         * Notifica a barra flutuante no window.top sobre o status do monitor.
         * @private
         */
        _notificarStatusBarraTopo(texto, detalhe = '') {
            if (typeof window !== 'undefined' && window === window.top) {
                if (typeof this.atualizarStatusBarra === 'function') this.atualizarStatusBarra(texto, detalhe);
                return;
            }
            if (typeof this.enviarComandoBackground === 'function') {
                this.enviarComandoBackground('AUTOMATE_BROADCAST_ABA', {
                    subAcao: 'AUTOMATE_STATUS_BARRA',
                    payload: (texto && typeof texto === 'object') ? { statusObj: texto, detalhe: texto.detalhe || detalhe } : { texto, detalhe }
                }).catch(() => { });
            }
        }

        /**
         * Inicia o observador local no frame que realmente contem o painel do PJe (`ngFrame` ou top same-origin).
         * @private
         */
        async _iniciarMonitorLocalPje(opcoes = {}) {
            this._pararMonitorLocalPje();
            this.monitorAtivo = true;
            this.modoMonitor = String((opcoes && opcoes.modo) || this.modoMonitor || 'Silente');
            this._iniciarMonitorTopicoSinteseLocal();
            const docPainel = this._obterDocumentoPainelPje();
            if (!docPainel) return;

            this.monitorAtivo = true;
            this.modoMonitor = String((opcoes && opcoes.modo) || this.modoMonitor || 'Silente');
            const visualizarAutos = (opcoes && opcoes.visualizarAutos !== undefined) ? Boolean(opcoes.visualizarAutos) : true;
            const marcarLidos = (opcoes && opcoes.marcarLidos !== undefined) ? Boolean(opcoes.marcarLidos) : true;

            if (!this.dadosAutomate || !this.dadosAutomate.repositorioObjetos || Object.keys(this.dadosAutomate.repositorioObjetos).length === 0) {
                await this.carregarDadosDeclarativos().catch(() => { });
            }

            // Captura o CNJ ja exibido no momento do start: ao selecionar um NOVO processo diferente, abrira os autos.
            const cnjInicial = this._extrairCnjProcessoAtualPainel(docPainel);
            this._ultimoCnjAberto = cnjInicial || '';

            const verificarNovoProcesso = async () => {
                if (!this.monitorAtivo || this._processandoNovoProc) return;
                const docAtual = this._obterDocumentoPainelPje();
                if (!docAtual || this._painelPjeEmCarregamento(docAtual)) return;

                const cnjAtual = this._extrairCnjProcessoAtualPainel(docAtual);
                if (!cnjAtual || cnjAtual === this._ultimoCnjAberto) return;

                                const cnjAnterior = this._ultimoCnjAberto;
                this._processandoNovoProc = true;
                this._ultimoCnjAberto = cnjAtual;

                try {
                    const curto = cnjAtual.slice(0, 7);
                    const urlFrameAtual = (typeof window !== 'undefined' && window.location) ? window.location.href : '';
                    if (this.motorFluxo && typeof this.motorFluxo.executarComandosPorGatilho === 'function') {
                        await this.motorFluxo.executarComandosPorGatilho('ao_selecionar_processo', urlFrameAtual, {
                            _Processo_Agora_Tarefa_N: cnjAtual,
                            _Processo_Anterior_Tarefa_N: cnjAnterior,
                            _Processo_Curto: curto,
                            v_ModoMonitor: this.modoMonitor,
                            v_CFGVisualizarAutos: visualizarAutos,
                            v_CFGMarcarLidosDocsAutos: marcarLidos
                        });
                    }
                } finally {
                    this._processandoNovoProc = false;
                }
            };

            // Se modo Sequencial e nenhum processo selecionado ainda, seleciona o 1o da lista automaticamente
            if (this.modoMonitor === 'Sequencial' && !cnjInicial) {
                const primeiroLink = docPainel.querySelector('#agrupador-etiqueta-aberta a.selecionarProcesso, #processosTarefa a.selecionarProcesso');
                if (primeiroLink && typeof primeiroLink.click === 'function') {
                    primeiroLink.click();
                }
            }

            // 1) Polling leve (400ms) equivalente ao AguardarNovoProcesso do PAD
            this._timerMonitorProc = setInterval(() => {
                verificarNovoProcesso().catch(() => { });
            }, 400);

            // 2) MutationObserver reativo no painel da tarefa
            const alvoObs = docPainel.querySelector('#conteudoTarefa, #frameTarefas') || docPainel.body;
            if (alvoObs && typeof MutationObserver === 'function') {
                let debounceId = null;
                this._observerMonitorProc = new MutationObserver(() => {
                    if (debounceId) clearTimeout(debounceId);
                    debounceId = setTimeout(() => {
                        verificarNovoProcesso().catch(() => { });
                    }, 180);
                });
                this._observerMonitorProc.observe(alvoObs, { childList: true, subtree: true, characterData: true });
            }

            // 3) Listener de clique na listagem de processos para resposta ainda mais rapida
            this._listenerCliqueMonitor = (ev) => {
                const alvo = ev && ev.target;
                if (!alvo || typeof alvo.closest !== 'function') return;
                if (alvo.closest('a.selecionarProcesso, processo-datalist-card')) {
                    setTimeout(() => { verificarNovoProcesso().catch(() => { }); }, 280);
                    setTimeout(() => { verificarNovoProcesso().catch(() => { }); }, 750);
                }
            };
            docPainel.addEventListener('click', this._listenerCliqueMonitor, true);
        }

        /**
         * Detecta e ativa automaticamente o Quadro-Resumo Estruturado (Topico-Sintese) dentro do frame de tarefa do PJe:
         * 1) Marca o checkbox "Envio automatico para implantacao a partir da assinatura?" (se ainda desmarcado);
         * 2) Clica no botao "ADICIONAR" (se ainda nao houver Topico-Sintese inserido nem modal aberto).
         * Espelha 1:1 a secao `Revisar Sentença - Secretaria` de `FUNCTION TarefaModAuto` do PAD.
         * @private
         */
        async _executarTopicoSinteseSeAplicavel() {
            if (!this.monitorAtivo || this._topicoSinteseAtivadoNesteFrame) return false;
            if (!this.motorFluxo || typeof this.motorFluxo.executarComandosPorGatilho !== 'function') return false;
            if (!this.dadosAutomate || !Array.isArray(this.dadosAutomate.comandosInternos) || this.dadosAutomate.comandosInternos.length === 0) {
                await this.carregarDadosDeclarativos().catch(() => { });
            }
            const urlFrameAtual = (typeof window !== 'undefined' && window.location) ? window.location.href : '';
            this.motorFluxo.definirVariavel('v_TopicoSinteseAtivado', false);
            await this.motorFluxo.executarComandosPorGatilho('ao_carregar_frame_tarefa', urlFrameAtual, {
                v_ModoMonitor: this.modoMonitor
            });
            if (this.motorFluxo.obterVariavel('v_TopicoSinteseAtivado', false)) {
                this._topicoSinteseAtivadoNesteFrame = true;
                return true;
            }
            return false;
        }

        /**
         * Inicia vigilancia do Topico-Sintese no frame atual (executa dentro de iframe#frame-tarefa do PJe).
         * @private
         */
        _iniciarMonitorTopicoSinteseLocal() {
            if (this._timerTopicoSintese) {
                clearInterval(this._timerTopicoSintese);
                this._timerTopicoSintese = null;
            }
            this._executarTopicoSinteseSeAplicavel().catch(() => { });
            let tentativas = 0;
            this._timerTopicoSintese = setInterval(() => {
                tentativas++;
                if (!this.monitorAtivo || this._topicoSinteseAtivadoNesteFrame || tentativas > 30) {
                    clearInterval(this._timerTopicoSintese);
                    this._timerTopicoSintese = null;
                    return;
                }
                this._executarTopicoSinteseSeAplicavel().catch(() => { });
            }, 500);
        }

        /**
         * Encerra timers, observers e ouvintes do monitor local.
         * @private
         */
        _pararMonitorLocalPje() {
            this.monitorAtivo = false;
            this._processandoNovoProc = false;
            if (this._timerTopicoSintese) {
                clearInterval(this._timerTopicoSintese);
                this._timerTopicoSintese = null;
            }
            if (this._timerMonitorProc) {
                clearInterval(this._timerMonitorProc);
                this._timerMonitorProc = null;
            }
            if (this._observerMonitorProc) {
                try { this._observerMonitorProc.disconnect(); } catch (_) { }
                this._observerMonitorProc = null;
            }
            if (this._listenerCliqueMonitor) {
                const docPainel = this._obterDocumentoPainelPje() || this.documentoRaiz;
                if (docPainel) {
                    try { docPainel.removeEventListener('click', this._listenerCliqueMonitor, true); } catch (_) { }
                }
                this._listenerCliqueMonitor = null;
            this._topicoSinteseAtivadoNesteFrame = false;
            this._timerTopicoSintese = null;
            }
        }

    }

    // Auto-bootstrap silencioso e tolerante a falhas em Content Scripts quando carregado no navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.JusGovAutomateInstancia) {
        try {
            const inst = new JusGovModuloAutomate({ ativo: false });
            window.JusGovAutomateInstancia = inst;
            const iniciouComChromeRuntime = Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
            const controladorVidaAutomate = new AbortController();

            const desmontarSeContextoInvalido = () => {
                if (!iniciouComChromeRuntime) return false;
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) return false;
                try { inst.abortarExecucao(); } catch (_) { }
                inst.fechadaNaAba = true;
                try {
                    if (typeof inst._limparOuvintesBarra === 'function') inst._limparOuvintesBarra();
                } catch (_) { }
                const barraOrfa = document.getElementById('jusgov-automate-pje-barra');
                if (barraOrfa && barraOrfa.__jusgovAutomateOwner === inst) {
                    barraOrfa.remove();
                }
                const dlgOrfao = document.getElementById('jusgov-automate-dialog-overlay');
                if (dlgOrfao) dlgOrfao.remove();
                try { controladorVidaAutomate.abort(); } catch (_) { }
                return true;
            };

            if (iniciouComChromeRuntime) {
                document.addEventListener('visibilitychange', desmontarSeContextoInvalido, { passive: true, signal: controladorVidaAutomate.signal });
                document.addEventListener('pointerdown', desmontarSeContextoInvalido, { capture: true, passive: true, signal: controladorVidaAutomate.signal });
            }

            const sincronizarAtivacaoStorage = () => {
                if (desmontarSeContextoInvalido()) return;
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) return;
                chrome.storage.sync.get(['automatePjeAtivo'], async (cfgSync) => {
                    const cfg = { ...(cfgSync || {}) };
                    try {
                        if (chrome.storage.session && typeof chrome.storage.session.get === 'function') {
                            const ses = await chrome.storage.session.get(['cacheConfigJusGov']);
                            if (ses && ses.cacheConfigJusGov && typeof ses.cacheConfigJusGov === 'object') {
                                Object.assign(cfg, ses.cacheConfigJusGov);
                            }
                        }
                    } catch (_) { }
                    try {
                        if (chrome.storage.local) {
                            const loc = await chrome.storage.local.get(['jusgovConfigSyncPendente', 'jusgovAutomateContextosCustom', 'jusgovAutomateMonitorSessao']);
                            const sessMon = loc && loc.jusgovAutomateMonitorSessao;
                            if (sessMon && sessMon.ativo && typeof window !== 'undefined' && window !== window.top) {
                                const idadeMs = Date.now() - Number(sessMon.ts || 0);
                                if (idadeMs >= 0 && idadeMs < 12 * 3600000) {
                                    setTimeout(() => {
                                        inst._iniciarMonitorLocalPje(sessMon);
                                    }, 250);
                                }
                            }
                            if (loc && loc.jusgovConfigSyncPendente && typeof loc.jusgovConfigSyncPendente === 'object') {
                                Object.assign(cfg, loc.jusgovConfigSyncPendente);
                            }
                            if (loc && loc.jusgovAutomateContextosCustom && typeof loc.jusgovAutomateContextosCustom === 'object') {
                                inst.aplicarSobrescritasContextos(loc.jusgovAutomateContextosCustom);
                            }
                        }
                    } catch (_) { }
                    const aplicar = () => inst.definirAtivo(Boolean(cfg.automatePjeAtivo));
                    if (document.body) {
                        aplicar();
                    } else {
                        document.addEventListener('DOMContentLoaded', aplicar, { once: true });
                    }
                });
            };

            sincronizarAtivacaoStorage();

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                chrome.storage.onChanged.addListener((changes, area) => {
                    if (area === 'sync' && changes.automatePjeAtivo !== undefined) {
                        inst.definirAtivo(Boolean(changes.automatePjeAtivo.newValue));
                    } else if (area === 'local' && (changes.jusgovAutomateObjetosUsuario || changes.jusgovAutomateComandosUsuario || changes.jusgovAutomateComandosOverrides || changes.jusgovAutomateContextosUsuario)) {
                        inst.carregarDadosDeclarativos().catch(() => { });
                    } else if (area === 'local' && (changes.jusgovConfigSyncPendente || changes.perfilAtivoId || changes.jusgovAutomateContextosCustom)) {
                        sincronizarAtivacaoStorage();
                    }
                });
            }

            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
                    if (!msg || typeof msg.acao !== 'string') return false;
                    if (msg.acao === 'atualizarEstadoModulo' && msg.automatePjeAtivo !== undefined) {
                        inst.definirAtivo(Boolean(msg.automatePjeAtivo), {
                            restaurarBarra: msg.restaurarBarra !== false,
                            expandir: Boolean(msg.expandirBarra)
                        });
                        if (typeof sendResponse === 'function') sendResponse({ ok: true, ativo: inst.estaAtivo() });
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_RESTAURAR_BARRA' && window === window.top) {
                        inst.definirAtivo(true, { restaurarBarra: true, expandir: true });
                        if (typeof sendResponse === 'function') sendResponse({ ok: true, barraVisivel: Boolean(inst.estaEfetivamenteAtivoNaUrl() && !inst.fechadaNaAba) });
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_ALTERNAR_BARRA' && window === window.top) {
                        const visivelAntes = Boolean(inst.estaEfetivamenteAtivoNaUrl() && !inst.fechadaNaAba);
                        const emExec = Boolean(inst.monitorAtivo || (inst.motorFluxo && inst.motorFluxo.emExecucao));
                        if (visivelAntes && !emExec) {
                            inst.fechadaNaAba = true;
                            inst.renderizarOuRemoverBarraControlePje(true);
                        } else {
                            inst.definirAtivo(true, { restaurarBarra: true, expandir: true });
                        }
                        const visivelAgora = Boolean(inst.estaEfetivamenteAtivoNaUrl() && !inst.fechadaNaAba);
                        if (typeof sendResponse === 'function') {
                            sendResponse({ ok: true, barraVisivel: visivelAgora, fechadaNaAba: Boolean(inst.fechadaNaAba) });
                        }
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_OBTER_ESTADO_BARRA' && window === window.top) {
                        if (typeof sendResponse === 'function') {
                            const barraVisivel = Boolean(inst.estaEfetivamenteAtivoNaUrl() && !inst.fechadaNaAba);
                            sendResponse({
                                ok: true,
                                ativo: inst.estaEfetivamenteAtivoNaUrl(),
                                barraVisivel,
                                fechadaNaAba: Boolean(inst.fechadaNaAba),
                                minimizado: Boolean(inst.minimizado),
                                executando: Boolean(inst.monitorAtivo || (inst.motorFluxo && inst.motorFluxo.emExecucao)),
                                contexto: inst.obterContextoAtivoParaUrl()
                            });
                        }
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_DISPARAR_CICLO' && window === window.top) {
                        (async () => {
                            if (!inst.estaAtivo()) inst.definirAtivo(true, { restaurarBarra: true });
                            await inst.carregarDadosDeclarativos();
                            if (typeof inst._carregarParametrosStorage === 'function') {
                                await inst._carregarParametrosStorage();
                            }
                            const modoSalvo = inst.motorFluxo
                                ? String(inst.motorFluxo.obterVariavel('v_CFGSelecionar', 'Silente'))
                                : 'Silente';
                            if (typeof inst.iniciarMonitorAutomacao === 'function') {
                                inst.iniciarMonitorAutomacao(modoSalvo);
                            }
                            inst._statusBarraTexto = modoSalvo === 'Silente' ? 'Silente ●' : `${modoSalvo} ●`;
                            inst._statusBarraDetalhe = `Modo ativo: ${modoSalvo} — aguardando seleção de novo processo`;
                            inst.renderizarOuRemoverBarraControlePje(true);
                            return { sucesso: true, modo: modoSalvo, executando: true };
                        })().then((res) => sendResponse(res || { sucesso: true }))
                            .catch((err) => sendResponse({ sucesso: false, erro: String(err) }));
                        return true;
                    }
                    if (msg.acao === 'AUTOMATE_ABRIR_CFG' && window === window.top) {
                        inst.abrirDialogoConfiguracao()
                            .then((res) => sendResponse(res || { confirmado: false }))
                            .catch((err) => sendResponse({ confirmado: false, erro: String(err) }));
                        return true;
                    }
                    if (msg.acao === 'AUTOMATE_PARAR' && window === window.top) {
                        if (typeof inst.pararMonitorAutomacao === 'function') inst.pararMonitorAutomacao();
                        inst.abortarExecucao();
                        inst._statusBarraTexto = 'Parado';
                        inst._statusBarraDetalhe = 'Automação interrompida pelo usuário';
                        inst.renderizarOuRemoverBarraControlePje(true);
                        sendResponse({ sucesso: true, executando: false });
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_INICIAR_MONITOR') {
                        inst._iniciarMonitorLocalPje(msg);
                        if (typeof sendResponse === 'function') sendResponse({ sucesso: true });
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_PARAR_MONITOR') {
                        inst._pararMonitorLocalPje();
                        if (typeof sendResponse === 'function') sendResponse({ sucesso: true });
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_STATUS_BARRA' && window === window.top) {
                        if (typeof inst.atualizarStatusBarra === 'function') {
                            inst.atualizarStatusBarra(msg.statusObj || msg.texto, msg.detalhe || "");
                        }
                        if (typeof sendResponse === 'function') sendResponse({ sucesso: true });
                        return false;
                    }
                    return false;
                });
            }
        } catch (eInit) {
            window.JusGovAutomateInstancia = JusGovModuloAutomate.criarObjetoNuloAutomate();
        }
    }

        const _ext_JusGovModuloAutomate = [
        { g: 'JusGovAutomateContextos', p: './automate-contextos.js' },
        { g: 'JusGovAutomateBarraPje', p: './automate-barra-pje.js' }
    ];
    for (let i = 0; i < _ext_JusGovModuloAutomate.length; i++) {
        const it = _ext_JusGovModuloAutomate[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(JusGovModuloAutomate.prototype);
        }
    }

    Object.freeze(JusGovModuloAutomate.prototype);
    return JusGovModuloAutomate;
}));

