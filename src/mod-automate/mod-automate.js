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
                        id: 'pje_padrao',
                        nome: 'PJe — Tarefas e Autos Digitais',
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
                    ponteAbas: (acao, payload) => this.enviarComandoBackground(acao, payload)
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
                            const loc = await chrome.storage.local.get(['jusgovConfigSyncPendente', 'jusgovAutomateContextosCustom']);
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
                        if (visivelAntes) {
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
                                contexto: inst.obterContextoAtivoParaUrl()
                            });
                        }
                        return false;
                    }
                    if (msg.acao === 'AUTOMATE_DISPARAR_CICLO' && window === window.top) {
                        (async () => {
                            if (!inst.estaAtivo()) inst.definirAtivo(true, { restaurarBarra: true });
                            await inst.carregarDadosDeclarativos();
                            return inst.executarCicloPrincipal(msg.opcoes || {});
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
                        inst.abortarExecucao();
                        sendResponse({ sucesso: true });
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

