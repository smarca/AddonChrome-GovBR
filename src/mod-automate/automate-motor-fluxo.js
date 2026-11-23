/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-motor-fluxo.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-motor-fluxo.js
 *
 * @MAPA-IA
 * - Arquivo: src/mod-automate/automate-motor-fluxo.js
 * - Modulo: mod-automate (Motor Declarativo de Fluxos, Variaveis e Subfluxos PJe)
 * - Contexto: Content Script / ISOLATED World e Runners Headless V8
 * - Dependencias: JusGovAutomateSeletores, JusGovAutomateEspera, JusGovAutomateDialogos
 * - Responsabilidade: Manter o estado de variaveis da automacao, interpretar passos declarativos JSON
 *   (para o futuro Pseudo-Editor) e executar todos os 23 subfluxos migrados 1:1 do Power Automate Desktop
 *   (`ValoresPadrão`, `Checkagem`, `GetInfo_Tarefa_Listagem`, `SetInfo_Tarefa`, `GetInfo_Processo_Listagem#º`,
 *   `GetInfo_Processo_Tarefa`, `AguardarNovaTarefa`, `AguardarNovoProcesso`, `DialogoCFG`, `DialogoStartTarefa`,
 *   `Selecionar_ListaAutos`, `AutosDocs_Abrir`, `AutosDocs_Fechar`, `AutosDocs_FecharTodos`, `PrazosFases`,
 *   `Etiqueta_Tarefas`, `TarefaModAuto`, `DialogoAção_Histórico`, `DialogoAção`, `EncaminharBnt`,
 *   `Movimentar_MenuEncaminhar`, `Movimentar_Chk`, `Listagem_Chk`, `DialogoLoop` e `Main`).
 * - Isolamento: 100% independente; pode ser removido sem quebrar nenhum outro modulo.
 * ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.JusGovAutomateMotorFluxo = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Motor de execucao de fluxos declarativos e subfluxos de automacao do PJe.
     */
    class JusGovAutomateMotorFluxo {
        /**
         * @param {Object} [opcoes]
         * @param {Object} [opcoes.dadosAutomate] Schema completo carregado de `automate-dados.json`.
         * @param {Object} [opcoes.seletores] Instancia de JusGovAutomateSeletores.
         * @param {Object} [opcoes.espera] Instancia de JusGovAutomateEspera.
         * @param {Object} [opcoes.dialogos] Instancia de JusGovAutomateDialogos.
         * @param {Function} [opcoes.ponteAbas] Callback opcional `(acao, payload) => Promise<any>` para coordenar abas via Background SW.
         */
        constructor(opcoes = {}) {
            this.dadosAutomate = (opcoes && opcoes.dadosAutomate && typeof opcoes.dadosAutomate === 'object')
                ? JSON.parse(JSON.stringify(opcoes.dadosAutomate))
                : {};
            this.seletores = (opcoes && opcoes.seletores) ? opcoes.seletores : null;
            this.espera = (opcoes && opcoes.espera) ? opcoes.espera : null;
            this.dialogos = (opcoes && opcoes.dialogos) ? opcoes.dialogos : null;
            this.ponteAbas = (opcoes && typeof opcoes.ponteAbas === 'function') ? opcoes.ponteAbas : null;

            this.variaveis = {};
            this.historicoLogs = [];
            this.emExecucao = false;

            if (this.seletores && typeof this.seletores.definirResolvedorVariavel === 'function') {
                this.seletores.definirResolvedorVariavel((nomeVar) => this.obterVariavel(nomeVar));
            }

            this.resetarValoresPadrao();
        }

        /**
         * Registra um evento no log em memoria da sessao de automacao.
         * @param {string} subfluxo
         * @param {string} mensagem
         * @param {Object} [detalhes]
         */
        registrarLog(subfluxo, mensagem, detalhes = null) {
            const entrada = {
                timestamp: Date.now(),
                subfluxo: String(subfluxo || 'MotorFluxo'),
                mensagem: String(mensagem || ''),
                detalhes: detalhes || null
            };
            this.historicoLogs.push(entrada);
            if (this.historicoLogs.length > 300) {
                this.historicoLogs.shift();
            }
            return entrada;
        }

        /**
         * Retorna o valor de uma variavel do motor.
         * @param {string} nome
         * @param {*} [padrao=undefined]
         * @returns {*}
         */
        obterVariavel(nome, padrao = undefined) {
            if (!nome || typeof nome !== 'string') return padrao;
            if (Object.prototype.hasOwnProperty.call(this.variaveis, nome)) {
                return this.variaveis[nome];
            }
            return padrao;
        }

        /**
         * Define o valor de uma variavel no motor.
         * @param {string} nome
         * @param {*} valor
         * @returns {*}
         */
        definirVariavel(nome, valor) {
            if (!nome || typeof nome !== 'string') return undefined;
            this.variaveis[nome] = valor;
            return valor;
        }

        /**
         * Interpola `${variavel}` usando o estado atual do motor e variaveis locais opcionais.
         * @param {string} texto
         * @param {Object} [variaveisLocais]
         * @returns {string}
         */
        interpolarTexto(texto, variaveisLocais = {}) {
            if (typeof texto !== 'string' || texto.indexOf('${') === -1) {
                return texto !== undefined && texto !== null ? String(texto) : '';
            }
            return texto.replace(/\$\{([^}]+)\}/g, (_, chaveBruta) => {
                const chave = String(chaveBruta || '').trim();
                if (variaveisLocais && Object.prototype.hasOwnProperty.call(variaveisLocais, chave)) {
                    const vLocal = variaveisLocais[chave];
                    return vLocal !== undefined && vLocal !== null ? String(vLocal) : '';
                }
                const vMotor = this.obterVariavel(chave, '');
                return vMotor !== undefined && vMotor !== null ? String(vMotor) : '';
            });
        }

        /**
         * Exporta um snapshot profundo de todas as variaveis atuais.
         * @returns {Object}
         */
        exportarEstadoVariaveis() {
            return JSON.parse(JSON.stringify(this.variaveis));
        }

        /**
         * Importa/mescla um mapa de variaveis no estado atual.
         * @param {Object} mapaVariaveis
         * @param {boolean} [substituirTudo=false]
         */
        importarEstadoVariaveis(mapaVariaveis, substituirTudo = false) {
            if (!mapaVariaveis || typeof mapaVariaveis !== 'object') return;
            if (substituirTudo) {
                this.variaveis = JSON.parse(JSON.stringify(mapaVariaveis));
            } else {
                Object.assign(this.variaveis, JSON.parse(JSON.stringify(mapaVariaveis)));
            }
        }

        // =========================================================================
        // 1. SUBFLUXO: ValoresPadrão
        // =========================================================================

        /**
         * Subfluxo `ValoresPadrão`: Inicializa todas as variaveis de configuracao, constantes e estado de runtime
         * a partir de `automate-dados.json`.
         * @returns {Object} Estado inicializado das variaveis.
         */
        valoresPadrao() {
            const vp = (this.dadosAutomate && this.dadosAutomate.variaveisPadrao) || {};
            const cfg = vp.configuracao || {};
            const cst = vp.constantes || {};
            const est = vp.estadoExecucao || {};
            const flatVars = Object.assign({}, vp);
            delete flatVars.configuracao;
            delete flatVars.constantes;
            delete flatVars.estadoExecucao;

            const listaPadrao = Array.isArray(this.dadosAutomate.listaMovimentosPadrao)
                ? this.dadosAutomate.listaMovimentosPadrao.slice()
                : [];
            const tabelaMenu = Array.isArray(this.dadosAutomate.tabelaMenuMovimentos)
                ? JSON.parse(JSON.stringify(this.dadosAutomate.tabelaMenuMovimentos))
                : [];

            this.variaveis = Object.assign({
                v_CFGTarefaSequencia: 'Ler e Movimentar',
                v_CFGQtdPagsSequencia: 1,
                v_CFGAutosLista: 'Sentença, Decisão, Despacho, Acórdão',
                v_CFGAutosSoma: 'Perícia, Laudo',
                v_CFGTermoPesquisa: '',
                v_CFGEtiquetaAuto: true,
                v_CFGMovimentar: 'Perguntar, com Sugestão Padrão',
                c_EtiquetaManterPadrao: 'PJE+R, D E S P A C H O, S E N T E N Ç A, D E C I S Ã O, Prioridade, Sigilo',
                v_ContadorProcSequencialX: 0
            }, flatVars, cfg, cst, est, {
                c_Lista_MovimentosPadrao: listaPadrao,
                v_Lista_Movimentos: listaPadrao.slice(),
                v_Tabela_MenuMovimentos: tabelaMenu
            });

            this.registrarLog('ValoresPadrão', 'Variaveis padrao e tabela de 35 regras carregadas.');
            return this.variaveis;
        }

        /**
         * Alias para `valoresPadrao()` para restauracao completa do estado inicial.
         * @returns {Object}
         */
        resetarValoresPadrao() {
            return this.valoresPadrao();
        }

        // =========================================================================
        // 2. SUBFLUXO: Checkagem
        // =========================================================================

        /**
         * Registra ou atualiza um fluxo declarativo customizado no schema em memoria (API para Pseudo-Editor).
         * @param {string} idFluxo
         * @param {Object} definicaoFluxo `{ titulo, descricao, passos: [...] }`
         * @returns {boolean}
         */
        registrarFluxoDeclarativo(idFluxo, definicaoFluxo) {
            if (!idFluxo || typeof idFluxo !== 'string' || !definicaoFluxo || typeof definicaoFluxo !== 'object') {
                return false;
            }
            if (!this.dadosAutomate.fluxosDeclarativos) {
                this.dadosAutomate.fluxosDeclarativos = {};
            }
            this.dadosAutomate.fluxosDeclarativos[idFluxo] = JSON.parse(JSON.stringify(definicaoFluxo));
            return true;
        }

        /**
         * Avalia uma condicao declarativa simples (`igual`, `diferente`, `contem`, `existeElemento`, `naoExisteElemento`, `truthy`).
         * @param {Object} condicao
         * @param {Object} [variaveisLocais]
         * @returns {boolean}
         */
        avaliarCondicaoDeclarativa(condicao, variaveisLocais = {}) {
            if (!condicao || typeof condicao !== 'object') return false;
            const op = String(condicao.operador || 'igual').toLowerCase();

            if (op === 'existeelemento' || op === 'contains_element') {
                return Boolean(this.seletores && this.seletores.contemElemento(condicao.objeto, variaveisLocais));
            }
            if (op === 'naoexisteelemento' || op === 'not_contains_element') {
                return Boolean(!this.seletores || !this.seletores.contemElemento(condicao.objeto, variaveisLocais));
            }

            const esq = condicao.variavel
                ? this.obterVariavel(condicao.variavel)
                : this.interpolarTexto(String(condicao.esquerda || ''), variaveisLocais);
            const dir = (typeof condicao.direita === 'string')
                ? this.interpolarTexto(condicao.direita, variaveisLocais)
                : condicao.direita;

            if (op === 'truthy') return Boolean(esq);
            if (op === 'falsy') return !esq;
            if (op === 'igual' || op === '==') return String(esq) === String(dir);
            if (op === 'diferente' || op === '!=') return String(esq) !== String(dir);
            if (op === 'contem') return String(esq || '').toLowerCase().includes(String(dir || '').toLowerCase());
            if (op === 'maior' || op === '>') return Number(esq) > Number(dir);
            if (op === 'menor' || op === '<') return Number(esq) < Number(dir);
            return false;
        }

        /**
         * Executa um unico passo declarativo JSON (primitiva do Pseudo-Editor).
         * Tipos suportados:
         * - `SET_VAR`, `GET_ELEMENT_DETAIL`, `CLICK`, `POPULATE_TEXT`, `WAIT_ELEMENT`,
         *   `WAIT_NOT_ELEMENT`, `WAIT_MS`, `IF_CONDITION`, `LOOP_FOREACH`, `LOOP_WHILE`,
         *   `REGEX_PARSE`, `REGEX_REPLACE`, `CALL_SUBFLOW`.
         * @param {Object} passo
         * @param {Object} [variaveisLocais]
         * @returns {Promise<any>}
         */
        async executarPassoDeclarativo(passo, variaveisLocais = {}) {
            if (!passo || typeof passo !== 'object') return null;
            if (passo.desativado === true) return null;

            const tipo = String(passo.acao || passo.tipo || '').toUpperCase();

            switch (tipo) {
                case 'SET_VAR': {
                    const valor = (typeof passo.valor === 'string')
                        ? this.interpolarTexto(passo.valor, variaveisLocais)
                        : passo.valor;
                    return this.definirVariavel(passo.variavel, valor);
                }

                case 'GET_ELEMENT_DETAIL': {
                    if (!this.seletores) return null;
                    const val = this.seletores.obterDetalheElemento(
                        passo.objeto,
                        passo.atributo || 'Own Text',
                        variaveisLocais
                    );
                    if (passo.variavelDestino) {
                        this.definirVariavel(passo.variavelDestino, val !== null ? val : (passo.valorPadrao || ''));
                    }
                    return val;
                }

                case 'CLICK': {
                    if (!this.seletores) return false;
                    return this.seletores.clicarElemento(passo.objeto, variaveisLocais);
                }

                case 'POPULATE_TEXT': {
                    if (!this.seletores) return false;
                    const txt = this.interpolarTexto(String(passo.texto || ''), variaveisLocais);
                    return this.seletores.preencherCampoTexto(passo.objeto, txt, variaveisLocais);
                }

                case 'WAIT_ELEMENT': {
                    if (!this.espera) return null;
                    return this.espera.aguardarElementoConter(passo.objeto, {
                        variaveisLocais,
                        timeoutMs: passo.timeoutMs
                    });
                }

                case 'WAIT_NOT_ELEMENT': {
                    if (!this.espera) return true;
                    return this.espera.aguardarElementoSumir(passo.objeto, {
                        variaveisLocais,
                        timeoutMs: passo.timeoutMs
                    });
                }

                case 'WAIT_MS': {
                    if (!this.espera) return true;
                    return this.espera.aguardarMs(Number(passo.ms) || 0);
                }

                case 'REGEX_PARSE': {
                    const textoFonte = passo.variavelFonte
                        ? String(this.obterVariavel(passo.variavelFonte, ''))
                        : this.interpolarTexto(String(passo.texto || ''), variaveisLocais);
                    const padrao = this.interpolarTexto(String(passo.padrao || ''), variaveisLocais);
                    let correspondencia = '';
                    try {
                        const rx = new RegExp(padrao, passo.flags || 'i');
                        const m = textoFonte.match(rx);
                        if (m) {
                            const grupo = typeof passo.grupo === 'number' ? passo.grupo : 0;
                            correspondencia = m[grupo] || m[0] || '';
                        }
                    } catch (e) {
                        correspondencia = '';
                    }
                    if (passo.variavelDestino) {
                        this.definirVariavel(passo.variavelDestino, correspondencia);
                    }
                    return correspondencia;
                }

                case 'REGEX_REPLACE': {
                    const textoFonte = passo.variavelFonte
                        ? String(this.obterVariavel(passo.variavelFonte, ''))
                        : this.interpolarTexto(String(passo.texto || ''), variaveisLocais);
                    const padrao = this.interpolarTexto(String(passo.padrao || ''), variaveisLocais);
                    const substituto = this.interpolarTexto(String(passo.substituto || ''), variaveisLocais);
                    let resultado = textoFonte;
                    try {
                        const rx = new RegExp(padrao, passo.flags || 'g');
                        resultado = textoFonte.replace(rx, substituto);
                    } catch (e) {
                        resultado = textoFonte;
                    }
                    if (passo.variavelDestino) {
                        this.definirVariavel(passo.variavelDestino, resultado);
                    }
                    return resultado;
                }

                case 'IF_CONDITION': {
                    const passou = this.avaliarCondicaoDeclarativa(passo.condicao, variaveisLocais);
                    const ramo = passou ? (passo.entao || []) : (passo.senao || []);
                    let ultimoRes = null;
                    for (let i = 0; i < ramo.length; i++) {
                        ultimoRes = await this.executarPassoDeclarativo(ramo[i], variaveisLocais);
                    }
                    return ultimoRes;
                }

                case 'LOOP_FOREACH': {
                    const lista = Array.isArray(passo.lista)
                        ? passo.lista
                        : (Array.isArray(this.obterVariavel(passo.variavelLista)) ? this.obterVariavel(passo.variavelLista) : []);
                    const nomeItem = passo.variavelItem || 'itemAtual';
                    const passosInternos = Array.isArray(passo.passos) ? passo.passos : [];
                    for (let i = 0; i < lista.length; i++) {
                        this.definirVariavel(nomeItem, lista[i]);
                        const escopoIteracao = Object.assign({}, variaveisLocais, { [nomeItem]: lista[i], indiceLoop: i });
                        for (let j = 0; j < passosInternos.length; j++) {
                            await this.executarPassoDeclarativo(passosInternos[j], escopoIteracao);
                        }
                    }
                    return lista.length;
                }

                case 'LOOP_WHILE': {
                    const maxIter = Number(passo.maxIteracoes) || 50;
                    const passosInternos = Array.isArray(passo.passos) ? passo.passos : [];
                    let iter = 0;
                    while (iter < maxIter && this.avaliarCondicaoDeclarativa(passo.condicao, variaveisLocais)) {
                        iter++;
                        for (let j = 0; j < passosInternos.length; j++) {
                            await this.executarPassoDeclarativo(passosInternos[j], variaveisLocais);
                        }
                    }
                    return iter;
                }

                case 'CALL_SUBFLOW': {
                    const nomeSub = String(passo.subfluxo || passo.nome || '').trim();
                    return this.executarSubfluxoPorNome(nomeSub, passo.parametros || variaveisLocais);
                }

                default:
                    return null;
            }
        }

        /**
         * Executa uma sequencia de passos declarativos de um fluxo pelo seu ID em `fluxosDeclarativos`
         * ou passando diretamente um objeto `{ passos: [...] }`.
         * @param {string|Object} idOuFluxo
         * @param {Object} [variaveisLocais]
         * @returns {Promise<{sucesso: boolean, passosExecutados: number, ultimoResultado: any}>}
         */
        async executarFluxoDeclarativo(idOuFluxo, variaveisLocais = {}) {
            const mapaFluxos = (this.dadosAutomate && this.dadosAutomate.fluxosDeclarativos) || {};
            const definicao = (typeof idOuFluxo === 'string') ? mapaFluxos[idOuFluxo] : idOuFluxo;
            if (!definicao || !Array.isArray(definicao.passos)) {
                return { sucesso: false, passosExecutados: 0, ultimoResultado: null };
            }

            let ultimoResultado = null;
            let passosExecutados = 0;
            for (let i = 0; i < definicao.passos.length; i++) {
                if (this.espera && this.espera.abortarAtivo) break;
                ultimoResultado = await this.executarPassoDeclarativo(definicao.passos[i], variaveisLocais);
                passosExecutados++;
            }

            return { sucesso: true, passosExecutados, ultimoResultado };
        }

        /**
         * Roteia a chamada de qualquer um dos 23 subfluxos pelo seu nome original no PAD ou camelCase.
         * @param {string} nomeSubfluxo
         * @param {Object} [parametros]
         * @returns {Promise<any>}
         */
        async executarSubfluxoPorNome(nomeSubfluxo, parametros = {}) {
            const chave = String(nomeSubfluxo || '').trim();
            switch (chave) {
                case 'ValoresPadrão':
                case 'valoresPadrao':
                    return this.valoresPadrao();
                case 'Checkagem':
                case 'checkagem':
                    return this.checkagem();
                case 'GetInfo_Tarefa_Listagem':
                case 'getInfoTarefaListagem':
                    return this.getInfoTarefaListagem();
                case 'SetInfo_Tarefa':
                case 'setInfoTarefa':
                    return this.setInfoTarefa();
                case 'GetInfo_Processo_Listagem#º':
                case 'getInfoProcessoListagem':
                    return this.getInfoProcessoListagem();
                case 'GetInfo_Processo_Tarefa':
                case 'getInfoProcessoTarefa':
                    return this.getInfoProcessoTarefa();
                case 'AguardarNovaTarefa':
                case 'aguardarNovaTarefa':
                    return this.aguardarNovaTarefa(parametros);
                case 'AguardarNovoProcesso':
                case 'aguardarNovoProcesso':
                    return this.aguardarNovoProcesso(parametros);
                case 'DialogoCFG':
                case 'dialogoCfg':
                    return this.dialogoCfg();
                case 'DialogoStartTarefa':
                case 'dialogoStartTarefa':
                    return this.dialogoStartTarefa();
                case 'Selecionar_ListaAutos':
                case 'selecionarListaAutos':
                    return this.selecionarListaAutos();
                case 'AutosDocs_Abrir':
                case 'autosDocsAbrir':
                    return this.autosDocsAbrir(parametros ? parametros.raizAutos : null);
                case 'AutosDocs_Fechar':
                case 'autosDocsFechar':
                    return this.autosDocsFechar();
                case 'AutosDocs_FecharTodos':
                case 'autosDocsFecharTodos':
                    return this.autosDocsFecharTodos();
                case 'PrazosFases':
                case 'prazosFases':
                    return this.prazosFases(parametros ? parametros.raizAutos : null);
                case 'Etiqueta_Tarefas':
                case 'etiquetaTarefas':
                    return this.etiquetaTarefas();
                case 'TarefaModAuto':
                case 'tarefaModAuto':
                    return this.tarefaModAuto();
                case 'DialogoAção_Histórico':
                case 'dialogoAcaoHistorico':
                    return this.dialogoAcaoHistorico();
                case 'DialogoAção':
                case 'dialogoAcao':
                    return this.dialogoAcao();
                case 'EncaminharBnt':
                case 'encaminharBnt':
                    return this.encaminharBnt();
                case 'Movimentar_MenuEncaminhar':
                case 'movimentarMenuEncaminhar':
                    return this.movimentarMenuEncaminhar();
                case 'Movimentar_Chk':
                case 'movimentarChk':
                    return this.movimentarChk();
                case 'Listagem_Chk':
                case 'listagemChk':
                    return this.listagemChk();
                case 'DialogoLoop':
                case 'dialogoLoop':
                    return this.dialogoLoop();
                default: {
                    // Verifica se existe em fluxosDeclarativos customizados
                    if (this.dadosAutomate &&
                        this.dadosAutomate.fluxosDeclarativos &&
                        this.dadosAutomate.fluxosDeclarativos[chave]) {
                        return this.executarFluxoDeclarativo(chave, parametros);
                    }
                    return null;
                }
            }
        }

        /**
         * Executa o ciclo principal para o processo atualmente selecionado na tarefa (`Cópia_de_Main` unitario ou sequencial).
         * @param {Object} [opcoes]
         * @param {boolean} [opcoes.pularDialogoCfg=false]
         * @returns {Promise<Object>} Resumo da execucao.
         */
        async executarCicloPrincipal(opcoes = {}) {
            this.emExecucao = true;
            if (this.espera) this.espera.definirAbortar(false);

            try {
                if (!opcoes.manterVariaveisAtuais) {
                    this.valoresPadrao();
                }

                await this.getInfoTarefaListagem();
                await this.getInfoProcessoListagem();
                await this.getInfoProcessoTarefa();

                if (!opcoes.pularDialogoCfg) {
                    const resCfg = await this.dialogoCfg();
                    if (!resCfg.confirmado) {
                        this.emExecucao = false;
                        return { sucesso: false, motivo: 'CANCELADO_CFG' };
                    }
                }

                const modoSeq = String(this.obterVariavel('v_CFGTarefaSequencia', 'Ler e Movimentar'));
                let resAutos = null;
                if (modoSeq !== 'Apenas Movimentar') {
                    resAutos = await this.autosDocsAbrir(opcoes.raizAutos || null);
                }

                let resEtiquetas = null;
                if (this.obterVariavel('v_CFGEtiquetaAuto') === true) {
                    resEtiquetas = await this.etiquetaTarefas();
                }

                let resModAuto = null;
                if (this.obterVariavel('v_Tarefa_Agora_Auto') === true) {
                    resModAuto = await this.tarefaModAuto();
                }

                const resDialogoAcao = await this.dialogoAcao();
                if (resDialogoAcao.cancelado) {
                    this.emExecucao = false;
                    return { sucesso: false, motivo: 'CANCELADO_ACAO' };
                }

                const resMov = await this.movimentarMenuEncaminhar();
                if (resMov.executado) {
                    await this.autosDocsFechar();
                }

                this.emExecucao = false;
                return {
                    sucesso: true,
                    tarefa: this.obterVariavel('_Tarefa_Agora_TXT'),
                    processo: this.obterVariavel('_Processo_Agora_Tarefa_N'),
                    autos: resAutos,
                    etiquetas: resEtiquetas,
                    modAuto: resModAuto,
                    movimentacao: resMov
                };
            } catch (erro) {
                this.emExecucao = false;
                this.registrarLog('Main', 'Erro durante ciclo principal', { erro: String(erro && erro.message ? erro.message : erro) });
                return { sucesso: false, motivo: 'ERRO_EXECUCAO', erro: String(erro && erro.message ? erro.message : erro) };
            }
        }
    }

        const _ext_JusGovAutomateMotorFluxo = [
        { g: 'JusGovAutomateFluxoTarefas', p: './automate-fluxo-tarefas.js' },
        { g: 'JusGovAutomateFluxoMovimentos', p: './automate-fluxo-movimentos.js' }
    ];
    for (let i = 0; i < _ext_JusGovAutomateMotorFluxo.length; i++) {
        const it = _ext_JusGovAutomateMotorFluxo[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(JusGovAutomateMotorFluxo.prototype);
        }
    }

    Object.freeze(JusGovAutomateMotorFluxo.prototype);
    return JusGovAutomateMotorFluxo;
}));

