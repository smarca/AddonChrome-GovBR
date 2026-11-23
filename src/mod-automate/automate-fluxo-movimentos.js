/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-fluxo-movimentos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Automate — Subfluxos de Documentos, Etiquetas e Movimentação PJe
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-fluxo-movimentos.js
 * - Classe Exportada: AutomateFluxoMovimentos (self.JusGovAutomateFluxoMovimentos) extends BaseModulo
 * - Métodos Públicos: autosDocsAbrir, autosDocsFechar, autosDocsFecharTodos, etiquetaTarefas, calcularDataTransitoFormatada, tarefaModAuto, dialogoAcaoHistorico, dialogoAcao, encaminharBnt, decomporComandoMovimento, movimentarMenuEncaminhar, movimentarChk, listagemChk, dialogoLoop, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovAutomateFluxoMovimentos = fabrica(raiz);
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

    class AutomateFluxoMovimentos extends Base {
        constructor() {
            super('AutomateFluxoMovimentos');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(AutomateFluxoMovimentos.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(AutomateFluxoMovimentos.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
    }

    Object.freeze(AutomateFluxoMovimentos.prototype);
    return Object.freeze(AutomateFluxoMovimentos);
}));