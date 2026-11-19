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
         * Verifica se uma URL corresponde a algum dos padroes de dominio configurados.
         * @param {string} url
         * @param {Array<string>} dominios
         * @returns {boolean}
         */
        correspondeDominio(url, dominios = []) {
            if (!url || !Array.isArray(dominios) || dominios.length === 0) return false;
            const urlLower = String(url).trim().toLowerCase();
            if (!urlLower || /^(?:chrome|edge|about|devtools|chrome-extension):/i.test(urlLower)) return false;
            let hostLower = '';
            try {
                hostLower = new URL(urlLower).hostname.toLowerCase();
            } catch (_) {
                hostLower = urlLower;
            }
            for (let i = 0; i < dominios.length; i++) {
                const raw = String(dominios[i] || '').trim().toLowerCase();
                if (!raw) continue;
                try {
                    if (raw === '<all_urls>' || raw === '*://*/*' || raw === '*') return true;
                    if (!raw.includes('://') && !raw.includes('/')) {
                        const escHost = raw.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                        const rxHost = new RegExp(`^(?:.*\\.)?${escHost}$`, 'i');
                        if (rxHost.test(hostLower)) return true;
                    }
                    const esc = raw
                        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                        .replace(/^\*:\/\//, '[^/:]+://')
                        .replace(/:\/\/\*\\\./g, '://(?:[^/]+\\.)?')
                        .replace(/\*/g, '.*');
                    if (new RegExp(`^${esc}$`, 'i').test(urlLower)) return true;
                } catch (_) { }
            }
            return false;
        }

        /**
         * Aplica sobrescritas persistidas de contextos (auto-ativacao por dominio) sobre o schema atual.
         * @param {Object} overrides
         */
        aplicarSobrescritasContextos(overrides = {}) {
            if (!overrides || typeof overrides !== 'object') return;
            this.contextosOverrides = JSON.parse(JSON.stringify(overrides));
            const percorrer = (nos) => {
                if (!Array.isArray(nos)) return;
                for (let i = 0; i < nos.length; i++) {
                    const n = nos[i];
                    if (n && n.id && overrides[n.id] && typeof overrides[n.id] === 'object') {
                        const ov = overrides[n.id];
                        if (Array.isArray(ov.dominiosAutoAtivacao)) {
                            n.dominiosAutoAtivacao = [...ov.dominiosAutoAtivacao];
                        }
                        if (typeof ov.ativarAutomaticamentePorDominio === 'boolean') {
                            n.ativarAutomaticamentePorDominio = ov.ativarAutomaticamentePorDominio;
                        }
                        if (typeof ov.habilitado === 'boolean') {
                            n.habilitado = ov.habilitado;
                        }
                    }
                    if (n && Array.isArray(n.filhos)) percorrer(n.filhos);
                }
            };
            percorrer(this.dadosAutomate && this.dadosAutomate.contextosAutomacao);
        }

        /**
         * Lista todos os contextos hierarquicos em ordem pre-fixa (pai -> filhos).
         * @returns {Array<Object>}
         */
        listarContextosHierarquicos() {
            const lista = [];
            const percorrer = (nos, nivel = 0) => {
                if (!Array.isArray(nos)) return;
                for (let i = 0; i < nos.length; i++) {
                    const n = nos[i];
                    if (!n || !n.id) continue;
                    lista.push({
                        id: n.id,
                        nome: n.nome || n.id,
                        paiId: n.paiId || null,
                        nivel,
                        habilitado: Boolean(n.habilitado),
                        ativarAutomaticamentePorDominio: Boolean(n.ativarAutomaticamentePorDominio),
                        dominiosAutoAtivacao: Array.isArray(n.dominiosAutoAtivacao) ? [...n.dominiosAutoAtivacao] : [],
                        fluxoPrincipal: n.fluxoPrincipal || null
                    });
                    if (Array.isArray(n.filhos)) percorrer(n.filhos, nivel + 1);
                }
            };
            percorrer(this.dadosAutomate && this.dadosAutomate.contextosAutomacao);
            return lista;
        }

        /**
         * Retorna o contexto hierarquico mais especifico compativel com a URL atual (ou contexto raiz do navegador).
         * @param {string} [urlOpcional]
         * @returns {Object}
         */
        obterContextoAtivoParaUrl(urlOpcional = '') {
            const alvo = String(
                urlOpcional ||
                (typeof window !== 'undefined' && window.location ? window.location.href : '')
            );
            const lista = this.listarContextosHierarquicos();
            let melhorFilho = null;
            for (let i = lista.length - 1; i >= 0; i--) {
                const c = lista[i];
                if (c.nivel > 0 && this.correspondeDominio(alvo, c.dominiosAutoAtivacao)) {
                    melhorFilho = c;
                    break;
                }
            }
            if (melhorFilho) return melhorFilho;
            if (this.ehContextoPjePermitido(alvo)) {
                const pje = lista.find(c => c.id === 'pje_padrao');
                if (pje) return pje;
            }
            return lista[0] || { id: 'navegador_geral', nome: 'Navegador — Automação Geral', nivel: 0 };
        }

        /**
         * Verifica se algum contexto configurado possui auto-ativacao habilitada para a URL atual.
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        deveAtivarAutomaticamenteNaUrl(urlOpcional = '') {
            const alvo = String(
                urlOpcional ||
                (typeof window !== 'undefined' && window.location ? window.location.href : '')
            );
            if (!alvo) return false;
            const lista = this.listarContextosHierarquicos();
            return lista.some((c) =>
                c.habilitado === true &&
                c.ativarAutomaticamentePorDominio === true &&
                this.correspondeDominio(alvo, c.dominiosAutoAtivacao)
            );
        }

        /**
         * Indica se o modulo esta efetivamente ativo na URL (via ativacao manual ou regra de dominio).
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        estaEfetivamenteAtivoNaUrl(urlOpcional = '') {
            return Boolean(this.ativo || this.deveAtivarAutomaticamenteNaUrl(urlOpcional));
        }

        /**
         * Verifica se a URL/hostname atual pertence ao subcontexto pre-configurado do PJe.
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        ehContextoPjePermitido(urlOpcional = '') {
            try {
                const alvo = String(
                    urlOpcional ||
                    (typeof window !== 'undefined' && window.location ? window.location.href : '')
                ).toLowerCase();
                if (!alvo) return false;
                return /\bpje\b|pje\.|\/pje\/|\.jus\.br\/pje|frontend\.prd\.cnj\.cloud|sso\.cloud\.pje\.jus\.br/i.test(alvo);
            } catch (_) {
                return false;
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
         * Abre diretamente o dialogo compacto de configuracao de execucao e contextos (`DialogoCFG`).
         * @returns {Promise<Object>}
         */
        async abrirDialogoConfiguracao() {
            await this.carregarDadosDeclarativos();
            if (!this.motorFluxo) {
                return { confirmado: false, motivo: 'MOTOR_INDISPONIVEL' };
            }
            const res = await this.motorFluxo.dialogoCfg();
            if (res && res.confirmado && Array.isArray(this.dadosAutomate && this.dadosAutomate.contextosAutomacao)) {
                this._persistirOverridesContextosStorage();
                this.renderizarOuRemoverBarraControlePje(true);
            }
            return res;
        }

        /**
         * Persiste sobrescritas de auto-ativacao por dominio em chrome.storage.local para sobreviver a recargas.
         * @private
         */
        _persistirOverridesContextosStorage() {
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
            const lista = this.listarContextosHierarquicos();
            const mapa = {};
            for (let i = 0; i < lista.length; i++) {
                const c = lista[i];
                mapa[c.id] = {
                    habilitado: Boolean(c.habilitado),
                    ativarAutomaticamentePorDominio: Boolean(c.ativarAutomaticamentePorDominio),
                    dominiosAutoAtivacao: Array.isArray(c.dominiosAutoAtivacao) ? c.dominiosAutoAtivacao : []
                };
            }
            this.contextosOverrides = mapa;
            try {
                chrome.storage.local.set({ jusgovAutomateContextosCustom: mapa }).catch(() => { });
            } catch (_) { }
        }

        /**
         * Renderiza (quando ativo no navegador ou por dominio) ou remove (quando inativo/fechada)
         * a barra ultracompacta "Automação de Tarefas" colada na borda inferior e desviando das scrollbars.
         * @param {boolean} [forcarReconstrucao=false]
         */
        renderizarOuRemoverBarraControlePje(forcarReconstrucao = false) {
            if (!this.documentoRaiz || !this.documentoRaiz.body) return;
            if (typeof window !== 'undefined' && window.__TESTE_HEADLESS__) return;
            const idBarra = 'jusgov-automate-pje-barra';
            const doc = this.documentoRaiz;
            const existente = doc.getElementById(idBarra);
            const pertenceEstaInstancia = Boolean(existente && existente.__jusgovAutomateOwner === this);

            const removerBarraAtual = () => {
                if (typeof this._limparOuvintesBarra === 'function') {
                    try { this._limparOuvintesBarra(); } catch (_) { }
                    this._limparOuvintesBarra = null;
                }
                if (existente) {
                    try {
                        if (typeof existente.hidePopover === 'function') existente.hidePopover();
                    } catch (_) { }
                    if (existente.parentNode) existente.parentNode.removeChild(existente);
                }
            };

            const emJanelaTopo = (typeof window === 'undefined' || window === window.top);
            if (!this.estaEfetivamenteAtivoNaUrl() || !emJanelaTopo || this.fechadaNaAba) {
                removerBarraAtual();
                return;
            }

            if (existente && pertenceEstaInstancia && !forcarReconstrucao) return;
            if (existente) removerBarraAtual();

            const obterMetricasViewport = () => {
                const docEl = doc.documentElement;
                const vw = Math.max((typeof window !== 'undefined' && window.innerWidth) || 0, (docEl && docEl.clientWidth) || 0, 320);
                const cw = (docEl && docEl.clientWidth > 0) ? docEl.clientWidth : vw;
                const vh = Math.max((typeof window !== 'undefined' && window.innerHeight) || 0, (docEl && docEl.clientHeight) || 0, 200);
                const ch = (docEl && docEl.clientHeight > 0) ? docEl.clientHeight : vh;
                const sbW = Math.max(0, vw - cw);
                const sbH = Math.max(0, vh - ch);
                const temScrollVert = Boolean(docEl && docEl.scrollHeight > ch + 2);
                const reservaDireita = Math.max(temScrollVert ? 24 : 20, sbW + 8);
                return { vw, cw, vh, ch, sbW, sbH, reservaDireita };
            };

            const contextoAtual = this.obterContextoAtivoParaUrl();
            const ehSubcontextoPje = Boolean(contextoAtual && contextoAtual.id === 'pje_padrao');

            const barra = doc.createElement('div');
            barra.id = idBarra;
            barra.__jusgovAutomateOwner = this;
            barra.setAttribute('data-jusgov-ignore', 'true');
            if (typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype) {
                barra.setAttribute('popover', 'manual');
            }

            const alturaBarraPx = this.minimizado ? 18 : 20;
            barra.style.cssText = [
                'position:fixed !important', 'top:auto !important', 'bottom:0px !important',
                'left:0px !important', 'right:auto !important', 'margin:0 !important',
                'transform:none !important', `height:${alturaBarraPx}px !important`, 'min-height:0 !important',
                'box-sizing:border-box !important', 'z-index:2147483647 !important',
                'isolation:isolate !important', 'display:inline-flex !important',
                'align-items:center !important', 'gap:3px !important',
                'background:#0f172a !important', 'color:#f8fafc !important',
                this.minimizado ? 'padding:0 5px !important' : 'padding:0 4px !important',
                'border-radius:5px 5px 0 0 !important', 'border:1px solid #0d9488 !important',
                'border-bottom:none !important', 'box-shadow:0 -2px 10px rgba(15,23,42,0.42) !important',
                'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif !important',
                'font-size:10px !important', 'line-height:1 !important', 'white-space:nowrap !important',
                'user-select:none !important', 'touch-action:none !important', 'cursor:grab !important'
            ].join(';');

            const criarMicroBtn = (rotulo, bg, corTxt, tituloTip, onClick, borda = 'none') => {
                const btn = doc.createElement('button');
                btn.type = 'button';
                btn.setAttribute('data-jusgov-ignore', 'true');
                btn.textContent = rotulo;
                btn.title = tituloTip;
                btn.style.cssText = `background:${bg} !important;color:${corTxt} !important;border:${borda} !important;border-radius:3px !important;height:15px !important;min-height:0 !important;min-width:0 !important;line-height:14px !important;padding:0 4px !important;margin:0 !important;font-size:10px !important;font-weight:600 !important;cursor:pointer !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;box-sizing:border-box !important;`;
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    onClick(ev);
                });
                return btn;
            };

            if (this.minimizado) {
                const spanRest = doc.createElement('span');
                spanRest.setAttribute('data-jusgov-ignore', 'true');
                spanRest.title = `Restaurar Automação de Tarefas (${contextoAtual.nome || 'Navegador'}) — arraste na borda inferior para mover`;
                spanRest.style.cssText = 'font-weight:700;font-size:10px;color:#2dd4bf;padding:0 3px;cursor:pointer;';
                spanRest.textContent = ehSubcontextoPje ? '⚡ Tarefas·PJe ▴' : '⚡ Tarefas ▴';
                barra.appendChild(spanRest);

                const btnFecharMin = criarMicroBtn('×', 'transparent', '#fca5a5', 'Fechar barra nesta aba', () => {
                    this.fechadaNaAba = true;
                    this.abortarExecucao();
                    this.renderizarOuRemoverBarraControlePje(true);
                });
                btnFecharMin.style.setProperty('padding', '0 3px', 'important');
                barra.appendChild(btnFecharMin);
            } else {
                const titulo = doc.createElement('span');
                titulo.setAttribute('data-jusgov-ignore', 'true');
                titulo.title = `Automação de Tarefas (${contextoAtual.nome || 'Navegador'}) — arraste horizontalmente pela borda inferior`;
                titulo.style.cssText = 'font-weight:700;font-size:10px;color:#2dd4bf;padding:0 2px;cursor:ew-resize;';
                titulo.textContent = ehSubcontextoPje ? '⚡ Tarefas·PJe' : '⚡ Tarefas';

                const statusTxt = doc.createElement('span');
                statusTxt.setAttribute('data-jusgov-ignore', 'true');
                statusTxt.style.cssText = 'font-size:9.5px;color:#cbd5e1;max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 1px;';
                statusTxt.textContent = 'Pronto';

                const btnExecutar = criarMicroBtn(
                    '▶ Exec',
                    '#0d9488',
                    '#ffffff',
                    'Executar fluxo do contexto atual',
                    async () => {
                        statusTxt.textContent = 'Exec...';
                        await this.carregarDadosDeclarativos();
                        const res = await this.executarCicloPrincipal();
                        statusTxt.textContent = (res && res.sucesso) ? 'OK!' : ((res && res.motivo) || 'Parado');
                    }
                );

                const btnConfig = criarMicroBtn(
                    '⚙ Cfg',
                    '#2563eb',
                    '#ffffff',
                    'Configurar contexto, domínios de auto-ativação e execução',
                    async () => {
                        const resCfg = await this.abrirDialogoConfiguracao();
                        if (resCfg && resCfg.confirmado) {
                            statusTxt.textContent = 'Salvo!';
                        }
                    }
                );

                const btnParar = criarMicroBtn(
                    '■ Parar',
                    '#dc2626',
                    '#ffffff',
                    'Interromper imediatamente a automação em andamento',
                    () => {
                        this.abortarExecucao();
                        statusTxt.textContent = 'Parado';
                    }
                );

                const btnMin = criarMicroBtn(
                    '_',
                    '#1e293b',
                    '#cbd5e1',
                    'Minimizar barra na borda inferior (clique para restaurar depois)',
                    () => {
                        this.minimizado = true;
                        this.renderizarOuRemoverBarraControlePje(true);
                    },
                    '1px solid #334155'
                );

                const btnFechar = criarMicroBtn(
                    '×',
                    '#1e293b',
                    '#fca5a5',
                    'Fechar barra nesta aba (reative no Popup da extensão)',
                    () => {
                        this.fechadaNaAba = true;
                        this.abortarExecucao();
                        this.renderizarOuRemoverBarraControlePje(true);
                    },
                    '1px solid #334155'
                );

                barra.appendChild(titulo);
                barra.appendChild(btnExecutar);
                barra.appendChild(btnConfig);
                barra.appendChild(btnParar);
                barra.appendChild(statusTxt);
                barra.appendChild(btnMin);
                barra.appendChild(btnFechar);
            }

            doc.body.appendChild(barra);
            if (typeof barra.showPopover === 'function') {
                try {
                    if (barra.matches && barra.matches(':popover-open')) barra.hidePopover();
                    barra.showPopover();
                } catch (_) { }
            }

            const aplicarPosicaoColadaBordaInferior = (xDesejado = null) => {
                if (!barra.isConnected) return;
                const m = obterMetricasViewport();
                const rect = barra.getBoundingClientRect();
                const larg = Math.max(48, Math.ceil(rect.width || 180));
                const minX = 6;
                const maxX = Math.max(minX, m.vw - larg - m.reservaDireita);
                const xAlvo = (xDesejado !== null && Number.isFinite(Number(xDesejado)))
                    ? Number(xDesejado)
                    : (Number.isFinite(this.barraX) ? this.barraX : maxX);
                const xClamped = Math.max(minX, Math.min(xAlvo, maxX));
                this.barraX = xClamped;
                barra.style.setProperty('left', `${Math.round(xClamped)}px`, 'important');
                barra.style.setProperty('bottom', `${m.sbH}px`, 'important');
            };

            aplicarPosicaoColadaBordaInferior(this.barraX);
            if (!Number.isFinite(this.barraX) && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    chrome.storage.local.get(['jusgovAutomateBarraPosX'], (resPos) => {
                        if (!barra.isConnected) return;
                        if (resPos && typeof resPos.jusgovAutomateBarraPosX === 'number' && Number.isFinite(resPos.jusgovAutomateBarraPosX)) {
                            aplicarPosicaoColadaBordaInferior(resPos.jusgovAutomateBarraPosX);
                        }
                    });
                } catch (_) { }
            }

            let arrastando = false;
            let deslocou = false;
            let inicioMouseX = 0;
            let inicioLeft = 0;

            const aoMouseDown = (ev) => {
                if (ev.button !== 0) return;
                if (ev.target && ev.target.closest && ev.target.closest('button')) return;
                arrastando = true;
                deslocou = false;
                inicioMouseX = ev.clientX;
                inicioLeft = barra.getBoundingClientRect().left;
                barra.style.setProperty('cursor', 'grabbing', 'important');
                ev.preventDefault();
            };

            const aoMouseMove = (ev) => {
                if (arrastando) {
                    const dx = ev.clientX - inicioMouseX;
                    if (Math.abs(dx) > 4) deslocou = true;
                    aplicarPosicaoColadaBordaInferior(inicioLeft + dx);
                    return;
                }
                const m = obterMetricasViewport();
                if (ev.clientX >= (m.vw - m.reservaDireita - 4)) {
                    const r = barra.getBoundingClientRect();
                    if (r.right >= (m.vw - m.reservaDireita - 2)) {
                        aplicarPosicaoColadaBordaInferior(r.left - 22);
                    }
                }
            };

            const aoMouseUp = () => {
                if (!arrastando) return;
                arrastando = false;
                barra.style.setProperty('cursor', 'grab', 'important');
                if (deslocou) {
                    try {
                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            chrome.storage.local.set({ jusgovAutomateBarraPosX: this.barraX }).catch(() => { });
                        }
                    } catch (_) { }
                } else if (this.minimizado) {
                    this.minimizado = false;
                    this.renderizarOuRemoverBarraControlePje(true);
                }
            };

            const aoResize = () => aplicarPosicaoColadaBordaInferior(this.barraX);

            barra.addEventListener('mousedown', aoMouseDown);
            doc.addEventListener('mousemove', aoMouseMove, { passive: true });
            doc.addEventListener('mouseup', aoMouseUp);
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', aoResize);
            }

            this._limparOuvintesBarra = () => {
                barra.removeEventListener('mousedown', aoMouseDown);
                doc.removeEventListener('mousemove', aoMouseMove);
                doc.removeEventListener('mouseup', aoMouseUp);
                if (typeof window !== 'undefined') {
                    window.removeEventListener('resize', aoResize);
                }
            };
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

        /**
         * Envia comando de coordenacao de abas ao Background SW.
         * @param {string} acao
         * @param {Object} [payload]
         * @returns {Promise<Object>}
         */
        async enviarComandoBackground(acao, payload = {}) {
            if (typeof chrome === 'undefined' || !chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') {
                return { sucesso: false, motivo: 'RUNTIME_INDISPONIVEL' };
            }
            return new Promise((resolve) => {
                try {
                    chrome.runtime.sendMessage(Object.assign({ acao }, payload), (resposta) => {
                        if (chrome.runtime.lastError) {
                            resolve({ sucesso: false, erro: chrome.runtime.lastError.message });
                        } else {
                            resolve(resposta || { sucesso: false });
                        }
                    });
                } catch (e) {
                    resolve({ sucesso: false, erro: String(e) });
                }
            });
        }

        // =========================================================================
        // COORDENADOR DE ABAS NO BACKGROUND SERVICE WORKER
        // =========================================================================

        /**
         * Trata mensagens IPC de coordenacao de abas do PJe no Background Service Worker:
         * - `AUTOMATE_OBTER_STATUS`
         * - `AUTOMATE_LOCALIZAR_ABA_AUTOS`
         * - `AUTOMATE_FECHAR_ABA_AUTOS`
         * - `AUTOMATE_FECHAR_TODAS_ABAS_AUTOS`
         * - `AUTOMATE_FOCAR_ABA`
         * @param {Object} request
         * @param {Object} sender
         * @param {Function} sendResponse
         * @returns {boolean} true se a resposta for assincrona.
         */
        tratarMensagemRuntime(request, sender, sendResponse) {
            if (!request || typeof request.acao !== 'string') return false;
            const acao = request.acao;

            if (acao === 'AUTOMATE_OBTER_STATUS') {
                sendResponse({
                    sucesso: true,
                    ativo: this.ativo,
                    versaoSchema: (this.dadosAutomate && this.dadosAutomate.meta && this.dadosAutomate.meta.versaoSchema) || '1.0.0'
                });
                return false;
            }

            if (acao === 'AUTOMATE_LOCALIZAR_ABA_AUTOS') {
                if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
                    sendResponse({ sucesso: false, abas: [] });
                    return false;
                }
                const numProc = String(request.numeroProcesso || '').trim();
                chrome.tabs.query({}, (abas) => {
                    const encontradas = (abas || []).filter((aba) => {
                        const url = String(aba.url || '');
                        const titulo = String(aba.title || '');
                        const ehAutos = url.includes('listAutosDigitais.seam') || url.includes('/Detalhe/');
                        if (!ehAutos) return false;
                        return !numProc || titulo.includes(numProc) || url.includes(numProc);
                    }).map(a => ({ id: a.id, url: a.url, title: a.title }));
                    sendResponse({ sucesso: true, abas: encontradas });
                });
                return true;
            }

            if (acao === 'AUTOMATE_FECHAR_ABA_AUTOS') {
                if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
                    sendResponse({ sucesso: false, fechadas: 0 });
                    return false;
                }
                const numProc = String(request.numeroProcesso || '').trim();
                chrome.tabs.query({}, (abas) => {
                    const idsParaFechar = (abas || []).filter((aba) => {
                        const url = String(aba.url || '');
                        const titulo = String(aba.title || '');
                        const ehAutos = url.includes('listAutosDigitais.seam');
                        if (!ehAutos) return false;
                        return !numProc || titulo.includes(numProc);
                    }).map(a => a.id).filter(Boolean);

                    if (idsParaFechar.length === 0) {
                        sendResponse({ sucesso: true, fechadas: 0 });
                        return;
                    }
                    chrome.tabs.remove(idsParaFechar, () => {
                        sendResponse({ sucesso: true, fechadas: idsParaFechar.length });
                    });
                });
                return true;
            }

            if (acao === 'AUTOMATE_FECHAR_TODAS_ABAS_AUTOS') {
                if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
                    sendResponse({ sucesso: false, fechadas: 0 });
                    return false;
                }
                chrome.tabs.query({}, (abas) => {
                    const idsParaFechar = (abas || [])
                        .filter(aba => String(aba.url || '').includes('listAutosDigitais.seam'))
                        .map(a => a.id)
                        .filter(Boolean);

                    if (idsParaFechar.length === 0) {
                        sendResponse({ sucesso: true, fechadas: 0 });
                        return;
                    }
                    chrome.tabs.remove(idsParaFechar, () => {
                        sendResponse({ sucesso: true, fechadas: idsParaFechar.length });
                    });
                });
                return true;
            }

            if (acao === 'AUTOMATE_FOCAR_ABA') {
                const tabId = Number(request.tabId);
                if (!tabId || typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.update !== 'function') {
                    sendResponse({ sucesso: false });
                    return false;
                }
                chrome.tabs.update(tabId, { active: true }, () => {
                    sendResponse({ sucesso: !chrome.runtime.lastError });
                });
                return true;
            }

            return false;
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

    return JusGovModuloAutomate;
}));
