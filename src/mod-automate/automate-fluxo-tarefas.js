/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-fluxo-tarefas.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Automate — Subfluxos de Leitura de Tarefas, Processos e Autos PJe
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-fluxo-tarefas.js
 * - Classe Exportada: AutomateFluxoTarefas (self.JusGovAutomateFluxoTarefas) extends BaseModulo
 * - Métodos Públicos: checkagem, getInfoTarefaListagem, setInfoTarefa, extrairClasseENumeroProcesso, getInfoProcessoListagem, getInfoProcessoTarefa, aguardarNovaTarefa, aguardarNovoProcesso, dialogoCfg, dialogoStartTarefa, selecionarListaAutos, prazosFases, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovAutomateFluxoTarefas = fabrica(raiz);
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

    class AutomateFluxoTarefas extends Base {
        constructor() {
            super('AutomateFluxoTarefas');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(AutomateFluxoTarefas.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(AutomateFluxoTarefas.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

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
    }

    Object.freeze(AutomateFluxoTarefas.prototype);
    return Object.freeze(AutomateFluxoTarefas);
}));