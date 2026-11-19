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
         * Subfluxo `Checkagem`: Verifica consistencia entre o numero do processo da Listagem e o da Tarefa.
         * @returns {Promise<boolean>} true se consistente (`v_Chk_ProcTarefa === true`).
         */
        async checkagem() {
            const procListagem = String(this.obterVariavel('_Processo_Agora_Listagem_N', '')).trim();
            const procTarefa = String(this.obterVariavel('_Processo_Agora_Tarefa_N', '')).trim();
            const consistente = Boolean(procListagem && procTarefa && procListagem === procTarefa);
            this.definirVariavel('v_Chk_ProcTarefa', consistente);
            return consistente;
        }

        // =========================================================================
        // 3. SUBFLUXO: GetInfo_Tarefa_Listagem
        // =========================================================================

        /**
         * Subfluxo `GetInfo_Tarefa_Listagem`: Extrai o nome da tarefa atual e o total de processos do paginador.
         * @returns {Promise<{tarefaTxt: string, qtdMax: number}>}
         */
        async getInfoTarefaListagem() {
            this.definirVariavel('_Tarefa_Agora_Auto', false);
            if (this.espera) {
                await this.espera.aguardarElementoSumir('ampulhetaListagem');
            }

            let tarefaTxt = '';
            if (this.seletores && this.seletores.contemElemento('listagemTarefa')) {
                tarefaTxt = String(this.seletores.obterDetalheElemento('listagemTarefa', 'Own Text') || '').trim();
            }
            this.definirVariavel('_Tarefa_Agora_TXT', tarefaTxt);
            this.definirVariavel('_Tarefa_Anterior_TXT', tarefaTxt);

            // Extrai [Setor] e Nome da Tarefa sem colchetes conforme c_Listagem_Mask do Power Automate Desktop
            const matchSetorTarefa = tarefaTxt.match(/^\[(.*?)\]\s*(.*)$/);
            if (matchSetorTarefa) {
                this.definirVariavel('_Setor_Agora_Listagem', matchSetorTarefa[1].trim());
                this.definirVariavel('_Tarefa_Agora_Listagem', matchSetorTarefa[2].trim());
            } else {
                this.definirVariavel('_Setor_Agora_Listagem', '');
                this.definirVariavel('_Tarefa_Agora_Listagem', tarefaTxt);
            }

            await this.setInfoTarefa();

            let qtdMax = 0;
            if (this.seletores && this.seletores.contemElemento('listagemPaginador')) {
                const paginadorTxt = String(this.seletores.obterDetalheElemento('listagemPaginador', 'Own Text') || '').trim();
                const numExtraido = parseInt(paginadorTxt.replace(/[^\d]/g, ''), 10);
                if (!Number.isNaN(numExtraido) && numExtraido > 0) {
                    qtdMax = numExtraido;
                }
            }
            this.definirVariavel('_Tarefa_Agora_Processos_QtdMax', qtdMax);

            return { tarefaTxt, qtdMax };
        }

        // =========================================================================
        // 4. SUBFLUXO: SetInfo_Tarefa
        // =========================================================================

        /**
         * Subfluxo `SetInfo_Tarefa`: Cruza `_Tarefa_Agora_TXT` com a `v_Tabela_MenuMovimentos` (35 regras),
         * monta `v_Lista_Movimentos`, resolve `v_Movimento_SaidaPadrao`, `v_EtiquetaSaida` e `v_EtiquetaManter`.
         * @returns {Promise<Object>}
         */
        async setInfoTarefa() {
            const listaPadrao = Array.isArray(this.obterVariavel('c_Lista_MovimentosPadrao'))
                ? this.obterVariavel('c_Lista_MovimentosPadrao').slice()
                : [];
            const tabelaMenu = Array.isArray(this.obterVariavel('v_Tabela_MenuMovimentos'))
                ? this.obterVariavel('v_Tabela_MenuMovimentos')
                : [];

            const tarefaAtualBruta = String(this.obterVariavel('_Tarefa_Agora_TXT', '') || this.obterVariavel('_Tarefa_Agora_Listagem', '')).trim();
            const matchLimpo = tarefaAtualBruta.match(/^\[(.*?)\]\s*(.*)$/);
            const tarefaSemSetor = matchLimpo ? matchLimpo[2].trim() : tarefaAtualBruta;

            let movSaidaPadrao = '- Não Movimentar, Só Tarefas';
            let etiquetaSaida = String(this.obterVariavel('v_EtiquetaSaida', '') || '');
            let etiquetaManter = String(this.obterVariavel('c_EtiquetaManterPadrao', ''));
            let tarefaAuto = Boolean(
                /Certificar trânsito em julgado|Implantação de Benefício/i.test(tarefaAtualBruta)
            );
            const listaMovimentos = listaPadrao.slice();

            for (let i = 0; i < tabelaMenu.length; i++) {
                const linha = tabelaMenu[i];
                if (!linha) continue;
                const nomeTarefaRegra = String(
                    linha.Tarefa_Cadastrada !== undefined
                        ? linha.Tarefa_Cadastrada
                        : (linha.tarefa !== undefined ? linha.tarefa : (linha[0] || ''))
                ).trim();
                if (!nomeTarefaRegra) continue;

                let bateuRegra = (
                    nomeTarefaRegra === tarefaAtualBruta ||
                    nomeTarefaRegra === tarefaSemSetor ||
                    nomeTarefaRegra.toLowerCase() === tarefaAtualBruta.toLowerCase() ||
                    nomeTarefaRegra.toLowerCase() === tarefaSemSetor.toLowerCase()
                );
                if (!bateuRegra && (nomeTarefaRegra.startsWith('^') || nomeTarefaRegra.includes('.*'))) {
                    try {
                        const rxTarefa = new RegExp(nomeTarefaRegra, 'i');
                        bateuRegra = rxTarefa.test(tarefaSemSetor) || rxTarefa.test(tarefaAtualBruta);
                    } catch (_) { }
                }

                if (bateuRegra) {
                    const opcoesExtrasStr = String(linha.opcoesMenu !== undefined ? linha.opcoesMenu : (linha[1] || '')).trim();
                    const saidaPadraoRegra = String(
                        linha.Movimento_Selecionado !== undefined
                            ? linha.Movimento_Selecionado
                            : (linha.saidaPadrao !== undefined ? linha.saidaPadrao : (linha[2] || ''))
                    ).trim();
                    const etiquetaSaidaRegra = String(linha.etiquetaSaida !== undefined ? linha.etiquetaSaida : (linha[3] || '')).trim();
                    const etiquetaManterRegra = String(linha.etiquetaManter !== undefined ? linha.etiquetaManter : (linha[4] || '')).trim();
                    const flagAutoRegra = String(linha.tarefaAuto !== undefined ? linha.tarefaAuto : (linha[5] || '')).trim();

                    if (linha.VisualizarAutos !== undefined) this.definirVariavel('v_VisualizarAutos', Boolean(linha.VisualizarAutos));
                    if (linha.VisualizarEtiqueta !== undefined) this.definirVariavel('v_VisualizarEtiqueta', Number(linha.VisualizarEtiqueta));
                    if (linha.EtiquetaTarefaTp1 !== undefined) this.definirVariavel('v_EtiquetaTarefaTp1', Boolean(linha.EtiquetaTarefaTp1));
                    if (linha.EtiquetaTarefaTp2 !== undefined) this.definirVariavel('v_EtiquetaTarefaTp2', Boolean(linha.EtiquetaTarefaTp2));
                    if (linha.EtiquetaTarefaTp3 !== undefined) this.definirVariavel('v_EtiquetaTarefaTp3', Boolean(linha.EtiquetaTarefaTp3));
                    if (linha.VerificarPrazos !== undefined) this.definirVariavel('v_VerificarPrazos', Number(linha.VerificarPrazos));
                    if (linha.Historico !== undefined) this.definirVariavel('v_Historico', Boolean(linha.Historico));
                    if (linha.Habilitado !== undefined) this.definirVariavel('v_Habilitado', Boolean(linha.Habilitado));

                    if (saidaPadraoRegra) {
                        movSaidaPadrao = this.interpolarTexto(saidaPadraoRegra);
                        this.definirVariavel('v_Movimento_Selecionado', movSaidaPadrao);
                    }
                    if (etiquetaSaidaRegra) {
                        etiquetaSaida = this.interpolarTexto(etiquetaSaidaRegra);
                    }
                    if (etiquetaManterRegra) {
                        etiquetaManter = etiquetaManter + ', ' + this.interpolarTexto(etiquetaManterRegra);
                    }
                    if (flagAutoRegra.toLowerCase() === 'true') {
                        tarefaAuto = true;
                    }

                    if (opcoesExtrasStr) {
                        const itensExtras = opcoesExtrasStr
                            .split(/\s*;\s*/)
                            .map(s => this.interpolarTexto(s.trim()))
                            .filter(Boolean);
                        for (let k = itensExtras.length - 1; k >= 0; k--) {
                            if (!listaMovimentos.includes(itensExtras[k])) {
                                listaMovimentos.splice(1, 0, itensExtras[k]);
                            }
                        }
                    }
                    break;
                }
            }

            if (movSaidaPadrao && !listaMovimentos.includes(movSaidaPadrao)) {
                listaMovimentos.splice(1, 0, movSaidaPadrao);
            }

            this.definirVariavel('v_Movimento_SaidaPadrao', movSaidaPadrao);
            this.definirVariavel('v_EtiquetaSaida', etiquetaSaida);
            this.definirVariavel('v_EtiquetaManter', etiquetaManter);
            this.definirVariavel('v_Tarefa_Agora_Auto', tarefaAuto);
            this.definirVariavel('v_Lista_Movimentos', listaMovimentos);

            return {
                v_Movimento_SaidaPadrao: movSaidaPadrao,
                v_EtiquetaSaida: etiquetaSaida,
                v_EtiquetaManter: etiquetaManter,
                v_Tarefa_Agora_Auto: tarefaAuto,
                v_Lista_Movimentos: listaMovimentos
            };
        }

        // =========================================================================
        // 5. SUBFLUXOS: GetInfo_Processo_Listagem#º e GetInfo_Processo_Tarefa
        // =========================================================================

        /**
         * Extrai classe judicial e numero CNJ de uma string do PJe (ex.: `"CumExSe 0991234-65.2024.4.01.4002"`).
         * @param {string} textoBruto
         * @returns {{textoCompleto: string, classeTxt: string, numeroCnj: string}}
         */
        extrairClasseENumeroProcesso(textoBruto) {
            const limpo = String(textoBruto || '').replace(/\s+/g, ' ').trim();
            if (!limpo) {
                return { textoCompleto: '', classeTxt: '', numeroCnj: '' };
            }
            const matchCnj = limpo.match(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
            const numeroCnj = matchCnj ? matchCnj[1] : '';

            const partes = limpo.split(/\s+/);
            let classeTxt = partes.length > 1 ? partes[0].trim() : '';
            if (classeTxt === 'CumExSe') {
                classeTxt = 'CumSen';
            }
            if (!numeroCnj && partes.length > 0) {
                const ultimo = partes[partes.length - 1];
                if (/\d/.test(ultimo)) {
                    return { textoCompleto: limpo, classeTxt, numeroCnj: ultimo };
                }
            }
            return { textoCompleto: limpo, classeTxt, numeroCnj };
        }

        /**
         * Subfluxo `GetInfo_Processo_Listagem#º`: Le o item na posicao `v_ContadorProcSequencialX` da listagem.
         * @returns {Promise<Object>}
         */
        async getInfoProcessoListagem() {
            let textoItem = '';
            if (this.seletores && this.seletores.contemElemento('listagemProcessoItem')) {
                textoItem = String(this.seletores.obterDetalheElemento('listagemProcessoItem', 'Own Text') || '').trim();
            }

            if (textoItem) {
                const info = this.extrairClasseENumeroProcesso(textoItem);
                this.definirVariavel('_Processo_Agora_Listagem_TXT', info.textoCompleto);
                this.definirVariavel('_Processo_Agora_Classe_TXT', info.classeTxt);
                this.definirVariavel('_Processo_Agora_Listagem_N', info.numeroCnj);
                this.definirVariavel('_Processo_Anterior_Listagem_N', info.numeroCnj);
            } else {
                this.definirVariavel('_Processo_Agora_Listagem_TXT', '');
                this.definirVariavel('_Processo_Agora_Classe_TXT', '');
                this.definirVariavel('_Processo_Agora_Listagem_N', '');
            }

            await this.checkagem();
            return {
                txt: this.obterVariavel('_Processo_Agora_Listagem_TXT'),
                classe: this.obterVariavel('_Processo_Agora_Classe_TXT'),
                numero: this.obterVariavel('_Processo_Agora_Listagem_N')
            };
        }

        /**
         * Subfluxo `GetInfo_Processo_Tarefa`: Le o cabeçalho do processo aberto no frame de tarefa.
         * @returns {Promise<Object>}
         */
        async getInfoProcessoTarefa() {
            if (this.espera) {
                await this.espera.aguardarAmpulhetasSumirem(['ampulhetaListagem', 'ampulhetaTarefa'], { atrasoInicialMs: 0 });
            }

            let textoTarefaProc = '';
            if (this.seletores && this.seletores.contemElemento('tarefaProcessoTarefa')) {
                textoTarefaProc = String(this.seletores.obterDetalheElemento('tarefaProcessoTarefa', 'Own Text') || '').trim();
            }

            if (textoTarefaProc) {
                const info = this.extrairClasseENumeroProcesso(textoTarefaProc);
                this.definirVariavel('_Processo_Agora_Tarefa_TXT', info.textoCompleto);
                this.definirVariavel('_Processo_Agora_Classe_TXT', info.classeTxt);
                this.definirVariavel('_Processo_Agora_Tarefa_N', info.numeroCnj);
                this.definirVariavel('_Processo_Anterior_Tarefa_N', info.numeroCnj);
            } else {
                this.definirVariavel('_Processo_Agora_Tarefa_TXT', '');
                this.definirVariavel('_Processo_Agora_Classe_TXT', '');
                this.definirVariavel('_Processo_Agora_Tarefa_N', '');
            }

            await this.checkagem();
            // Atualiza variaveis dependentes de ${_Processo_Agora_Classe_TXT} (ex: v_EtiquetaSaida)
            await this.setInfoTarefa();

            return {
                txt: this.obterVariavel('_Processo_Agora_Tarefa_TXT'),
                classe: this.obterVariavel('_Processo_Agora_Classe_TXT'),
                numero: this.obterVariavel('_Processo_Agora_Tarefa_N')
            };
        }

        // =========================================================================
        // 6. SUBFLUXOS: AguardarNovaTarefa e AguardarNovoProcesso
        // =========================================================================

        /**
         * Subfluxo `AguardarNovaTarefa`: Aguarda ate que o usuario abra uma nova tarefa diferente da anterior.
         * @param {Object} [opcoesPolling]
         * @returns {Promise<boolean>}
         */
        async aguardarNovaTarefa(opcoesPolling = {}) {
            const tarefaAnterior = String(this.obterVariavel('_Tarefa_Anterior_TXT', '')).trim();
            if (!this.espera) {
                await this.getInfoTarefaListagem();
                return this.obterVariavel('_Tarefa_Agora_TXT') !== tarefaAnterior;
            }

            const status = await this.espera.aguardarCondicaoPolling(async () => {
                await this.getInfoTarefaListagem();
                const atual = String(this.obterVariavel('_Tarefa_Agora_TXT', '')).trim();
                const qtd = Number(this.obterVariavel('_Tarefa_Agora_Processos_QtdMax', 0));
                return Boolean(atual && atual !== tarefaAnterior && qtd > 0);
            }, opcoesPolling);

            return status.sucesso;
        }

        /**
         * Subfluxo `AguardarNovoProcesso`: Aguarda ate que o processo carregado no frame de tarefa mude.
         * @param {Object} [opcoesPolling]
         * @returns {Promise<boolean>}
         */
        async aguardarNovoProcesso(opcoesPolling = {}) {
            const procAnterior = String(this.obterVariavel('_Processo_Anterior_Tarefa_N', '')).trim();
            if (!this.espera) {
                await this.getInfoProcessoTarefa();
                return this.obterVariavel('_Processo_Agora_Tarefa_N') !== procAnterior;
            }

            const status = await this.espera.aguardarCondicaoPolling(async () => {
                await this.getInfoProcessoTarefa();
                const atual = String(this.obterVariavel('_Processo_Agora_Tarefa_N', '')).trim();
                return Boolean(atual && atual !== procAnterior);
            }, opcoesPolling);

            return status.sucesso;
        }

        // =========================================================================
        // 7. SUBFLUXOS: DialogoCFG e DialogoStartTarefa
        // =========================================================================

        /**
         * Subfluxo `DialogoCFG`: Exibe o card de configuracao e atualiza as variaveis `v_CFG*`.
         * @returns {Promise<{confirmado: boolean, valores: Object}>}
         */
        async dialogoCfg() {
            if (!this.dialogos) {
                return { confirmado: true, valores: this.variaveis };
            }
            const opcoesSchemaBase = (this.dadosAutomate && this.dadosAutomate.opcoesDialogoConfig) || {};
            const opcoesSchema = Object.assign({}, opcoesSchemaBase);
            if (Array.isArray(this.dadosAutomate && this.dadosAutomate.contextosAutomacao)) {
                const achatar = (nos, nivel = 0, out = []) => {
                    for (let i = 0; i < nos.length; i++) {
                        const n = nos[i];
                        if (!n || !n.id) continue;
                        out.push({
                            id: n.id,
                            nome: `${nivel > 0 ? '↳ '.repeat(nivel) : ''}${n.nome || n.id}`,
                            dominios: Array.isArray(n.dominiosAutoAtivacao) ? [...n.dominiosAutoAtivacao] : [],
                            autoAtivar: Boolean(n.ativarAutomaticamentePorDominio && n.habilitado)
                        });
                        if (Array.isArray(n.filhos) && n.filhos.length > 0) {
                            achatar(n.filhos, nivel + 1, out);
                        }
                    }
                    return out;
                };
                opcoesSchema.contextosDisponiveis = achatar(this.dadosAutomate.contextosAutomacao);
            }
            const resp = await this.dialogos.exibirDialogoConfiguracao(this.variaveis, opcoesSchema);
            if (!resp || resp.ButtonPressed === 'Cancel') {
                return { confirmado: false, valores: this.variaveis };
            }

            const v = resp.valores || {};
            if (v.f_CFG_ContextoId && Array.isArray(this.dadosAutomate && this.dadosAutomate.contextosAutomacao)) {
                const atualizarNo = (nos) => {
                    for (let i = 0; i < nos.length; i++) {
                        const n = nos[i];
                        if (n && n.id === v.f_CFG_ContextoId) {
                            const listaDom = String(v.f_CFG_DominiosAutoAtivacao || '')
                                .split(/[,\n;]+/)
                                .map(s => s.trim())
                                .filter(Boolean);
                            n.dominiosAutoAtivacao = listaDom;
                            n.ativarAutomaticamentePorDominio = Boolean(v.f_CFG_AutoAtivarDominio);
                            if (n.ativarAutomaticamentePorDominio) n.habilitado = true;
                            return true;
                        }
                        if (Array.isArray(n && n.filhos) && atualizarNo(n.filhos)) return true;
                    }
                    return false;
                };
                atualizarNo(this.dadosAutomate.contextosAutomacao);
            }
            if (v.f_CFG_TarefaSequencia !== undefined) {
                this.definirVariavel('v_CFGTarefaSequencia', v.f_CFG_TarefaSequencia);
            }
            if (v.f_CFG_QtdPagsSequencia !== undefined) {
                const nPags = parseInt(String(v.f_CFG_QtdPagsSequencia), 10);
                this.definirVariavel('v_CFGQtdPagsSequencia', Number.isNaN(nPags) ? 1 : nPags);
            }
            if (v.f_CFG_AutosLista !== undefined) {
                this.definirVariavel('v_CFGAutosLista', v.f_CFG_AutosLista);
            }
            if (v.f_CFG_AutosSoma !== undefined) {
                this.definirVariavel('v_CFGAutosSoma', v.f_CFG_AutosSoma);
            }
            if (v.f_CFG_TermoPesquisa !== undefined) {
                this.definirVariavel('v_CFGTermoPesquisa', v.f_CFG_TermoPesquisa);
            }
            if (v.f_CFG_EtiquetaAuto !== undefined) {
                const boolEtq = String(v.f_CFG_EtiquetaAuto).toLowerCase() === 'true';
                this.definirVariavel('v_CFGEtiquetaAuto', boolEtq);
            }
            if (v.f_CFG_Movimentar !== undefined) {
                this.definirVariavel('v_CFGMovimentar', v.f_CFG_Movimentar);
            }

            return { confirmado: true, valores: this.variaveis };
        }

        /**
         * Subfluxo `DialogoStartTarefa`: Pergunta a partir de qual item sequencial iniciar a listagem.
         * @returns {Promise<{confirmado: boolean, indiceZeroBased: number}>}
         */
        async dialogoStartTarefa() {
            const atualZeroBased = Number(this.obterVariavel('v_ContadorProcSequencialX', 0));
            const padraoUmBased = Math.max(1, atualZeroBased + 1);

            if (!this.dialogos) {
                return { confirmado: true, indiceZeroBased: atualZeroBased };
            }

            const resp = await this.dialogos.exibirDialogoInputSequencial({
                titulo: 'PJE Tarefa Sequencial',
                mensagem: 'Iniciar pelo item:',
                valorPadrao: String(padraoUmBased)
            });

            if (!resp || resp.ButtonPressed === 'Cancel') {
                return { confirmado: false, indiceZeroBased: atualZeroBased };
            }

            const nInformado = parseInt(String(resp.UserInput || '1'), 10);
            const indiceZeroBased = (!Number.isNaN(nInformado) && nInformado >= 1) ? (nInformado - 1) : 0;
            this.definirVariavel('v_ContadorProcSequencialX', indiceZeroBased);
            return { confirmado: true, indiceZeroBased };
        }

        // =========================================================================
        // 8. SUBFLUXO: Selecionar_ListaAutos
        // =========================================================================

        /**
         * Subfluxo `Selecionar_ListaAutos`: Monta `v_TimeLineLista` combinando `v_CFGAutosLista`,
         * `v_CFGAutosSoma` e `v_CFGTermoPesquisa`.
         * @returns {Array<string>}
         */
        selecionarListaAutos() {
            const cfgLista = String(this.obterVariavel('v_CFGAutosLista', '')).trim();
            const cfgSoma = String(this.obterVariavel('v_CFGAutosSoma', '')).trim();
            const cfgTermo = String(this.obterVariavel('v_CFGTermoPesquisa', '')).trim();

            let acumulado = '';
            if (cfgLista && cfgLista !== 'Nenhum') {
                acumulado = cfgLista;
            }
            if (cfgSoma && cfgSoma !== 'Nenhum') {
                acumulado = acumulado ? `${acumulado}, ${cfgSoma}` : cfgSoma;
            }
            if (cfgTermo) {
                acumulado = acumulado ? `${acumulado}, ${cfgTermo}` : cfgTermo;
            }

            const listaTermos = acumulado
                ? acumulado.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean)
                : [];

            this.definirVariavel('v_TimeLineLista', listaTermos);
            return listaTermos;
        }

        // =========================================================================
        // 9. SUBFLUXOS DE AUTOS DIGITAIS: AutosDocs_Abrir, Fechar, FecharTodos e PrazosFases
        // =========================================================================

        /**
         * Subfluxo `PrazosFases`: Inspeciona os movimentos da timeline nos Autos Digitais (ex.: `DECORRIDO PRAZO.*`).
         * @param {Document|Element} [raizAutos]
         * @returns {Promise<string>}
         */
        async prazosFases(raizAutos = null) {
            this.definirVariavel('v_TimeLineX', 'DECORRIDO PRAZO.*');
            let faseEncontrada = '';
            if (this.seletores && this.seletores.contemElemento('autosFaseTimeLine', {}, raizAutos)) {
                faseEncontrada = String(
                    this.seletores.obterDetalheElemento('autosFaseTimeLine', 'Own Text', {}, raizAutos) || ''
                ).trim();
            }
            this.definirVariavel('_Processo_Agora_Fase_TXT', faseEncontrada);
            return faseEncontrada;
        }

        /**
         * Subfluxo `AutosDocs_Abrir`: Clica em "Ver autos digitais" ou atua diretamente sobre a tela de Autos,
         * marca todos como lidos e abre as abas dos documentos da `v_TimeLineLista` em ordem reversa.
         * @param {Document|Element} [raizAutos]
         * @returns {Promise<{documentosEncontrados: Array<string>, totalAbertos: number}>}
         */
        async autosDocsAbrir(raizAutos = null) {
            const listaTermos = this.selecionarListaAutos();
            if (listaTermos.length === 0) {
                return { documentosEncontrados: [], totalAbertos: 0 };
            }

            // Se estivermos na tela de Tarefas, clica no botao Ler Autos do card atual
            if (this.seletores && this.seletores.contemElemento('listagemLerAutosBnt')) {
                this.seletores.clicarElemento('listagemLerAutosBnt');
            }

            // Se estamos no contexto dos Autos Digitais (ou mock unificado de testes)
            if (this.seletores && this.seletores.contemElemento('autosNProc', {}, raizAutos)) {
                const txtNProcAutos = String(
                    this.seletores.obterDetalheElemento('autosNProc', 'Own Text', {}, raizAutos) || ''
                ).trim();
                const infoAutos = this.extrairClasseENumeroProcesso(txtNProcAutos);
                this.definirVariavel('_Processo_Agora_Autos_TXT', infoAutos.textoCompleto);
                this.definirVariavel('_Processo_Agora_Autos_N', infoAutos.numeroCnj);
            }

            if (this.seletores && this.seletores.contemElemento('autosMarcarLidos', {}, raizAutos)) {
                this.seletores.clicarElemento('autosMarcarLidos', {}, raizAutos);
            }

            await this.prazosFases(raizAutos);

            const documentosEncontrados = [];
            const listaReversa = listaTermos.slice().reverse();

            for (let i = 0; i < listaReversa.length; i++) {
                const termo = listaReversa[i];
                this.definirVariavel('v_TimeLineX', `${termo}.*`);

                if (this.seletores && this.seletores.contemElemento('autosPesquisa', {}, raizAutos)) {
                    this.seletores.preencherCampoTexto('autosPesquisa', termo, {}, raizAutos);
                    if (this.espera) {
                        await this.espera.aguardarMs(300);
                    }

                    if (this.seletores.contemElemento('autosDocTimeLine', {}, raizAutos)) {
                        this.seletores.clicarElemento('autosDocTimeLine', {}, raizAutos);
                        documentosEncontrados.push(termo);
                    }
                }
            }

            this.definirVariavel('v_ContadorDocsEncontrados', documentosEncontrados.length);
            return {
                documentosEncontrados,
                totalAbertos: documentosEncontrados.length
            };
        }

        /**
         * Subfluxo `AutosDocs_Fechar`: Solicita o fechamento da aba dos Autos do processo atual.
         * @returns {Promise<boolean>}
         */
        async autosDocsFechar() {
            const numeroProc = this.obterVariavel('_Processo_Agora_Tarefa_N') ||
                this.obterVariavel('_Processo_Agora_Listagem_N');
            if (typeof this.ponteAbas === 'function' && numeroProc) {
                try {
                    const res = await this.ponteAbas('AUTOMATE_FECHAR_ABA_AUTOS', { numeroProcesso: numeroProc });
                    return Boolean(res && res.sucesso);
                } catch (e) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Subfluxo `AutosDocs_FecharTodos`: Solicita o fechamento de todas as abas de Autos Digitais abertas.
         * @returns {Promise<boolean>}
         */
        async autosDocsFecharTodos() {
            if (typeof this.ponteAbas === 'function') {
                try {
                    const res = await this.ponteAbas('AUTOMATE_FECHAR_TODAS_ABAS_AUTOS', {});
                    return Boolean(res && res.sucesso);
                } catch (e) {
                    return false;
                }
            }
            return true;
        }

        // =========================================================================
        // 10. SUBFLUXO: Etiqueta_Tarefas
        // =========================================================================

        /**
         * Subfluxo `Etiqueta_Tarefas`: Gerencia as etiquetas do processo na Tarefa:
         * 1. Abre o painel `etiquetaBnt`;
         * 2. Monta regex negative lookahead `^(?!(etq1|etq2)$).*` com `v_EtiquetaManter` + `v_EtiquetaSaida`;
         * 3. Exclui todas as etiquetas atuais que nao pertencam a lista de preservacao (`etiquetaAtuais`);
         * 4. Inclui `v_EtiquetaSaida` pela tabela de mais usadas (`etiquetaIncluir`) ou pela busca (`etiquetaPesquisaTxt`);
         * 5. Fecha o painel de etiquetas e aguarda `ampulhetaNotificacaoEtqt` sumir.
         * @returns {Promise<{excluidas: number, incluida: boolean, regexExclusao: string}>}
         */
        async etiquetaTarefas() {
            const etiquetaSaida = String(this.obterVariavel('v_EtiquetaSaida', '')).trim();
            if (!etiquetaSaida || !this.seletores) {
                return { excluidas: 0, incluida: false, regexExclusao: '' };
            }

            if (this.espera) {
                await this.espera.aguardarAmpulhetasSumirem(['ampulhetaListagem', 'ampulhetaTarefa'], { atrasoInicialMs: 0 });
            }

            // 1. Abre gerenciador de etiquetas
            if (this.seletores.contemElemento('etiquetaBnt')) {
                this.seletores.clicarElemento('etiquetaBnt');
            }

            // 2. Constroi a expressao regular negative lookahead identica ao PAD: ^(?!(etq1|etq2|etqSaida)$).*
            const manterBruto = String(this.obterVariavel('v_EtiquetaManter', '')).trim();
            const combinado = manterBruto ? `${manterBruto}, ${etiquetaSaida}` : etiquetaSaida;
            const itensManter = combinado
                .split(/\s*,\s*/)
                .map(s => s.trim())
                .filter(Boolean)
                .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

            const regexExclusao = itensManter.length > 0
                ? `^(?!(${itensManter.join('|')})$).*`
                : '.*';
            this.definirVariavel('v_EtiquetaX', regexExclusao);

            // 3. Remove etiquetas nao listadas em v_EtiquetaManter + v_EtiquetaSaida
            let excluidas = 0;
            const maxExclusoes = 25;
            while (excluidas < maxExclusoes && this.seletores.contemElemento('etiquetaAtuais')) {
                const clicou = this.seletores.clicarElemento('etiquetaAtuais');
                if (!clicou) break;
                excluidas++;
                // Se em ambiente DOM real/mock o clique nao remover o elemento sozinho, evita loop infinito
                const restantes = this.seletores.localizarTodosElementos('etiquetaAtuais');
                if (restantes.length > 0 && excluidas >= restantes.length) {
                    break;
                }
            }

            // 4. Inclui a etiqueta de saida se ainda nao estiver presente nas etiquetas atuais
            this.definirVariavel('v_EtiquetaX', etiquetaSaida);
            let incluida = false;
            if (!this.seletores.contemElemento('etiquetaAtuais')) {
                if (this.seletores.contemElemento('etiquetaIncluir')) {
                    incluida = this.seletores.clicarElemento('etiquetaIncluir');
                } else if (this.seletores.contemElemento('etiquetaPesquisaTxt')) {
                    this.seletores.preencherCampoTexto('etiquetaPesquisaTxt', etiquetaSaida);
                    if (this.seletores.contemElemento('etiquetaPesquisaIncluir')) {
                        incluida = this.seletores.clicarElemento('etiquetaPesquisaIncluir');
                    }
                }
            } else {
                incluida = true;
            }

            // 5. Fecha o gerenciador de etiquetas e aguarda notificacao sumir
            if (this.seletores.contemElemento('etiquetaBnt')) {
                this.seletores.clicarElemento('etiquetaBnt');
            }
            if (this.espera) {
                await this.espera.aguardarElementoSumir('ampulhetaNotificacaoEtqt');
            }

            return { excluidas, incluida, regexExclusao };
        }

        // =========================================================================
        // 11. SUBFLUXO: TarefaModAuto
        // =========================================================================

        /**
         * Calcula a data de transito em julgado somando `diasSomar` a uma string `DD/MM/YYYY`.
         * @param {string} dataStr Data no formato `DD/MM/YYYY`.
         * @param {number} [diasSomar=0]
         * @returns {string} Data formatada `DD/MM/YYYY`.
         */
        calcularDataTransitoFormatada(dataStr, diasSomar = 0) {
            const match = String(dataStr || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!match) return '';
            const dia = parseInt(match[1], 10);
            const mes = parseInt(match[2], 10) - 1;
            const ano = parseInt(match[3], 10);
            const dt = new Date(Date.UTC(ano, mes, dia, 12, 0, 0));
            if (Number.isNaN(dt.getTime())) return '';
            if (diasSomar) {
                dt.setUTCDate(dt.getUTCDate() + Number(diasSomar));
            }
            const dFinal = String(dt.getUTCDate()).padStart(2, '0');
            const mFinal = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const aFinal = String(dt.getUTCFullYear());
            return `${dFinal}/${mFinal}/${aFinal}`;
        }

        /**
         * Subfluxo `TarefaModAuto`: Executa acoes automaticas especificas no frame interno da tarefa:
         * - `[JEF] Certificar trânsito em julgado` / `Certificar trânsito em julgado`: extrai data de
         *   `tarefaTxtDtTransito` (mesma data) ou de `tarefaAlertInfoTxt` (soma +1 dia) e preenche `tarefaInDtTransito`.
         * - `[JEF] Implantação de Benefício - Requisição`: marca envio imediato (`jefTopicoImplantarAgora`) e
         *   clica em adicionar (`jefTopicoAdicionar`).
         * @returns {Promise<{executado: boolean, dataPreenchida: string}>}
         */
        async tarefaModAuto() {
            if (!this.seletores) {
                return { executado: false, dataPreenchida: '' };
            }
            const tarefaAtual = String(this.obterVariavel('_Tarefa_Agora_TXT', '')).trim();
            let executado = false;
            let dataPreenchida = '';

            if (tarefaAtual === '[JEF] Certificar trânsito em julgado' ||
                tarefaAtual === 'Certificar trânsito em julgado') {

                let textoAviso = '';
                let diasAdicionais = 0;

                if (this.seletores.contemElemento('tarefaTxtDtTransito')) {
                    textoAviso = String(this.seletores.obterDetalheElemento('tarefaTxtDtTransito', 'Own Text') || '');
                    diasAdicionais = 0;
                } else if (this.seletores.contemElemento('tarefaAlertInfoTxt')) {
                    textoAviso = String(this.seletores.obterDetalheElemento('tarefaAlertInfoTxt', 'Own Text') || '');
                    diasAdicionais = 1;
                } else if (this.obterVariavel('_Processo_Agora_Fase_TXT')) {
                    textoAviso = String(this.obterVariavel('_Processo_Agora_Fase_TXT', ''));
                    diasAdicionais = 1;
                }

                const matchData = textoAviso.match(/(\d{2}\/\d{2}\/\d{4})/);
                if (matchData && this.seletores.contemElemento('tarefaInDtTransito')) {
                    dataPreenchida = this.calcularDataTransitoFormatada(matchData[1], diasAdicionais);
                    if (dataPreenchida) {
                        executado = this.seletores.preencherCampoTexto('tarefaInDtTransito', dataPreenchida);
                    }
                }
            } else if (tarefaAtual === '[JEF] Implantação de Benefício - Requisição' ||
                       tarefaAtual === 'Implantação de Benefício - Requisição') {
                if (this.seletores.contemElemento('jefTopicoImplantarAgora')) {
                    this.seletores.clicarElemento('jefTopicoImplantarAgora');
                }
                if (this.seletores.contemElemento('jefTopicoAdicionar')) {
                    executado = this.seletores.clicarElemento('jefTopicoAdicionar');
                }
            }

            return { executado, dataPreenchida };
        }

        // =========================================================================
        // 12. SUBFLUXOS DE MOVIMENTACAO: DialogoAção, EncaminharBnt, Movimentar_MenuEncaminhar
        // =========================================================================

        /**
         * Subfluxo `DialogoAção_Histórico`: Mantem o movimento selecionado no topo da lista para a proxima iteracao.
         */
        dialogoAcaoHistorico() {
            const lista = Array.isArray(this.obterVariavel('v_Lista_Movimentos'))
                ? this.obterVariavel('v_Lista_Movimentos').slice()
                : [];
            const selecionado = String(this.obterVariavel('v_Movimento_Selecionado', '')).trim();
            if (!selecionado) return lista;

            const idxExistente = lista.indexOf(selecionado);
            if (idxExistente > 1) {
                lista.splice(idxExistente, 1);
                lista.splice(1, 0, selecionado);
            } else if (idxExistente === -1) {
                lista.splice(1, 0, selecionado);
            }
            this.definirVariavel('v_Lista_Movimentos', lista);
            return lista;
        }

        /**
         * Subfluxo `DialogoAção`: Decide ou pergunta ao usuario qual movimento aplicar ao processo atual.
         * @returns {Promise<{cancelado: boolean, movimentoSelecionado: string}>}
         */
        async dialogoAcao() {
            const cfgMovimentar = String(this.obterVariavel('v_CFGMovimentar', 'Perguntar, com Sugestão Padrão')).trim();
            const saidaPadrao = String(this.obterVariavel('v_Movimento_SaidaPadrao', '- Não Movimentar, Só Tarefas')).trim();
            const listaMovimentos = Array.isArray(this.obterVariavel('v_Lista_Movimentos'))
                ? this.obterVariavel('v_Lista_Movimentos')
                : ['- Não Movimentar, Só Tarefas'];

            if (cfgMovimentar === '- Não Movimentar, Só Tarefas' || cfgMovimentar === '- Nao Movimentar, Só Tarefas') {
                this.definirVariavel('v_Movimento_Selecionado', '- Não Movimentar, Só Tarefas');
                return { cancelado: false, movimentoSelecionado: '- Não Movimentar, Só Tarefas' };
            }

            if (cfgMovimentar === 'Automático, se Houver Padrão' || cfgMovimentar === 'Automatico, se Houver Padrão') {
                if (saidaPadrao && saidaPadrao !== '- Não Movimentar, Só Tarefas') {
                    this.definirVariavel('v_Movimento_Selecionado', saidaPadrao);
                    return { cancelado: false, movimentoSelecionado: saidaPadrao };
                }
            }

            const opcaoInicial = (cfgMovimentar === 'Sempre Perguntar')
                ? '- Não Movimentar, Só Tarefas'
                : (saidaPadrao || '- Não Movimentar, Só Tarefas');

            if (!this.dialogos) {
                this.definirVariavel('v_Movimento_Selecionado', opcaoInicial);
                return { cancelado: false, movimentoSelecionado: opcaoInicial };
            }

            const resp = await this.dialogos.exibirDialogoSelecaoMovimento({
                titulo: `${this.obterVariavel('_Tarefa_Agora_TXT', 'PJe')} - ${this.obterVariavel('_Processo_Agora_Tarefa_TXT', '')}`,
                mensagem: `TAREFA: ${this.obterVariavel('_Tarefa_Agora_TXT', '')} | PROCESSO: ${this.obterVariavel('_Processo_Agora_Tarefa_TXT', '')}`,
                listaOpcoes: listaMovimentos,
                opcaoPadrao: opcaoInicial
            });

            if (!resp || resp.ButtonPressed === 'Cancel') {
                return { cancelado: true, movimentoSelecionado: '' };
            }

            const escolhido = String(resp.SelectedItem || opcaoInicial).trim();
            this.definirVariavel('v_Movimento_Selecionado', escolhido);
            this.dialogoAcaoHistorico();
            return { cancelado: false, movimentoSelecionado: escolhido };
        }

        /**
         * Subfluxo `EncaminharBnt`: Abre o menu suspenso de transicoes da tarefa (`#btnTransicoesTarefa`).
         * @returns {Promise<boolean>}
         */
        async encaminharBnt() {
            if (!this.seletores) return false;
            if (this.espera) {
                await this.espera.aguardarAmpulhetasSumirem(['ampulhetaListagem', 'ampulhetaTarefa'], { atrasoInicialMs: 0 });
            }
            if (!this.seletores.contemElemento('tarefaEncaminharBnt')) {
                return false;
            }
            return this.seletores.clicarElemento('tarefaEncaminharBnt');
        }

        /**
         * Decompoe comandos compostos do tipo `"+ Intimação DJEN Autor 5 dias, SISTEMA MPF 10 dias"`
         * nos parâmetros estruturados do Power Automate Desktop (`v_Movimento_SelecionadoX`,
         * `v_Movimento_SelecionadoSub`, `v_Movimento_SelecionadoSubLista` e partes da intimacao).
         * @param {string} movimentoSelecionado
         * @returns {Object}
         */
        decomporComandoMovimento(movimentoSelecionado) {
            const mov = String(movimentoSelecionado || '').trim();
            if (!mov.startsWith('+')) {
                return {
                    composto: false,
                    movimentoPrincipal: mov,
                    subComandoBruto: '',
                    subComandosLista: [],
                    intimacoesParseadas: []
                };
            }

            const matchPartes = mov.match(/^\+\s*(\S+)\s+(.*)$/);
            const tipoAcao = matchPartes ? matchPartes[1] : '';
            const resto = matchPartes ? matchPartes[2] : '';

            let movimentoPrincipal = mov;
            let subComandoBruto = '';
            let subComandosLista = [];
            const intimacoesParseadas = [];

            if (tipoAcao === 'Intimação' || tipoAcao === 'Intimacao') {
                movimentoPrincipal = 'Preparar comunicação';
                subComandoBruto = resto.replace(/(^|\s*,\s*)/g, '$1Intimar por ').trim();
                subComandosLista = subComandoBruto
                    .split(/\s*,\s*/)
                    .map(s => s.trim())
                    .filter(Boolean);

                for (let i = 0; i < subComandosLista.length; i++) {
                    const itemSub = subComandosLista[i];
                    const mInt = itemSub.match(/Intimar por\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/i);
                    if (mInt) {
                        intimacoesParseadas.push({
                            comandoCompleto: itemSub,
                            meio: mInt[1],
                            polo: mInt[2],
                            prazoValor: mInt[3],
                            prazoUnidade: mInt[4]
                        });
                    }
                }
            }

            return {
                composto: true,
                movimentoPrincipal,
                subComandoBruto,
                subComandosLista,
                intimacoesParseadas
            };
        }

        /**
         * Subfluxo `Movimentar_MenuEncaminhar`: Executa a transicao selecionada no menu `Encaminhar para...`.
         * @returns {Promise<{executado: boolean, movimentoPrincipal: string, decomposicao: Object}>}
         */
        async movimentarMenuEncaminhar() {
            const movSelecionado = String(this.obterVariavel('v_Movimento_Selecionado', '')).trim();
            if (!movSelecionado ||
                movSelecionado === '- Não Movimentar, Só Tarefas' ||
                movSelecionado === '- Nao Movimentar, Só Tarefas') {
                return { executado: false, movimentoPrincipal: movSelecionado, decomposicao: null };
            }

            const decomposicao = this.decomporComandoMovimento(movSelecionado);
            this.definirVariavel('v_Movimento_SelecionadoX', decomposicao.movimentoPrincipal);
            this.definirVariavel('v_Movimento_SelecionadoSub', decomposicao.subComandoBruto);
            this.definirVariavel('v_Movimento_SelecionadoSubLista', decomposicao.subComandosLista);

            if (!this.seletores) {
                return { executado: false, movimentoPrincipal: decomposicao.movimentoPrincipal, decomposicao };
            }

            // Se o item do menu de transicoes ainda nao estiver visivel, clica no botao Encaminhar
            if (!this.seletores.contemElemento('tarefaEncaminharMenu')) {
                await this.encaminharBnt();
            }

            let clicou = false;
            if (this.seletores.contemElemento('tarefaEncaminharMenu')) {
                clicou = this.seletores.clicarElemento('tarefaEncaminharMenu');
            }

            if (this.espera) {
                await this.espera.aguardarAmpulhetasSumirem(['ampulhetaListagem', 'ampulhetaTarefa'], { atrasoInicialMs: 0 });
            }

            return {
                executado: clicou,
                movimentoPrincipal: decomposicao.movimentoPrincipal,
                decomposicao
            };
        }

        /**
         * Subfluxo `Movimentar_Chk`: Verifica se o processo efetivamente saiu da tarefa apos a movimentacao.
         * @returns {Promise<boolean>}
         */
        async movimentarChk() {
            await this.getInfoProcessoListagem();
            await this.getInfoProcessoTarefa();

            const procTarefaAtual = String(this.obterVariavel('_Processo_Agora_Tarefa_N', '')).trim();
            const procTarefaAnterior = String(this.obterVariavel('_Processo_Anterior_Tarefa_N', '')).trim();
            return procTarefaAtual !== procTarefaAnterior;
        }

        /**
         * Subfluxo `Listagem_Chk`: Verifica se a listagem ainda possui processos disponiveis na pagina/tarefa.
         * @returns {Promise<{continuaNaMesmaTarefa: boolean, qtdRestante: number}>}
         */
        async listagemChk() {
            const tarefaAnterior = String(this.obterVariavel('_Tarefa_Anterior_TXT', '')).trim();
            await this.getInfoTarefaListagem();
            const tarefaAtual = String(this.obterVariavel('_Tarefa_Agora_TXT', '')).trim();
            const qtdMax = Number(this.obterVariavel('_Tarefa_Agora_Processos_QtdMax', 0));
            const continua = Boolean(tarefaAtual && tarefaAtual === tarefaAnterior && qtdMax > 0);
            return { continuaNaMesmaTarefa: continua, qtdRestante: qtdMax };
        }

        /**
         * Subfluxo `DialogoLoop`: Pergunta ao usuario se deseja repetir o ciclo na proxima tarefa.
         * @returns {Promise<boolean>}
         */
        async dialogoLoop() {
            if (!this.dialogos) return false;
            const resp = await this.dialogos.exibirDialogoMensagemTimeout({
                titulo: 'Automação de Tarefas - Continuar?',
                mensagem: 'Ciclo da tarefa concluido. Deseja aguardar/executar a proxima tarefa?',
                botoes: 'YesNo',
                timeoutSegundos: 10,
                botaoPadraoTimeout: 'No'
            });
            return Boolean(resp && resp.ButtonPressed === 'Yes');
        }

        // =========================================================================
        // 13. INTERPRETADOR DECLARATIVO GENERICO (PARA O FUTURO PSEUDO-EDITOR)
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

    return JusGovAutomateMotorFluxo;
}));
