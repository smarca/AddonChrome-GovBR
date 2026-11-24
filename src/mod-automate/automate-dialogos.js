/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-dialogos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-dialogos.js
 *
 * @MAPA-IA
 * - Arquivo: src/mod-automate/automate-dialogos.js
 * - Modulo: mod-automate (Submodulo de Dialogos Modais Nativos HTML5 / Shadow DOM)
 * - Contexto: Content Script / ISOLATED World e Runners Headless V8
 * - Dependencias: Zero dependencias externas (usa DOM nativo com `data-jusgov-ignore="true"`)
 * - Responsabilidade: Substituir nativamente os dialogos do Power Automate Desktop (`DialogoCFG` AdaptiveCard,
 *   `DialogoAção` SelectFromListDialog, `DialogoStartTarefa` InputDialog e `ShowMessageWithTimeout`),
 *   com suporte a manipulador mock/headless para testes automatizados e execucao silenciosa.
 * - Isolamento: 100% independente; pode ser removido sem quebrar nenhum outro modulo.
 * ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.JusGovAutomateDialogos = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const ID_CONTAINER_DIALOGO = 'jusgov-automate-dialog-overlay';

    /**
     * Gerenciador de dialogos interativos do modulo de automacao PJe.
     */
    class JusGovAutomateDialogos {
        /**
         * @param {Object} [opcoes]
         * @param {Function} [opcoes.manipuladorMock] Funcao `(tipoDialogo, payload) => resposta` para testes headless.
         * @param {Document} [opcoes.documentoRaiz]
         */
        constructor(opcoes = {}) {
            this.manipuladorMock = (opcoes && typeof opcoes.manipuladorMock === 'function')
                ? opcoes.manipuladorMock
                : null;
            this.documentoRaiz = (opcoes && opcoes.documentoRaiz)
                ? opcoes.documentoRaiz
                : (typeof document !== 'undefined' ? document : null);
        }

        /**
         * Define ou remove um manipulador mock para interceptar dialogos em testes headless ou modo automatico.
         * @param {Function|null} fn
         */
        definirManipuladorMock(fn) {
            this.manipuladorMock = typeof fn === 'function' ? fn : null;
        }

        /**
         * Resolve o documento HTML raiz (window.top.document) quando acessivel em mesma origem.
         * @private
         */
        _obterDocumentoRaizUi() {
            const docBase = this.documentoRaiz || (typeof document !== 'undefined' ? document : null);
            if (!docBase) return null;
            if (typeof document !== 'undefined' && docBase !== document) return docBase;
            let w = typeof window !== 'undefined' ? window : docBase.defaultView;
            while (w && w !== w.top) {
                try {
                    const p = w.parent;
                    if (!p || !p.document || !p.document.body) break;
                    w = p;
                } catch (_) {
                    break;
                }
            }
            return (w && w.document && w.document.body) ? w.document : docBase;
        }

        /**
         * Remove qualquer modal de automacao aberto anteriormente.
         */
        fecharDialogoAtivo() {
            const docsLimpar = [];
            if (this.documentoRaiz) docsLimpar.push(this.documentoRaiz);
            const docUi = this._obterDocumentoRaizUi();
            if (docUi && !docsLimpar.includes(docUi)) docsLimpar.push(docUi);
            docsLimpar.forEach((docRef) => {
                try {
                    const existente = docRef.getElementById(ID_CONTAINER_DIALOGO);
                    if (existente) {
                        if (typeof existente.hidePopover === 'function') existente.hidePopover();
                        if (existente.parentNode) existente.parentNode.removeChild(existente);
                    }
                } catch (_) { }
            });
        }

        /**
         * Cria a estrutura visual base do modal com `data-jusgov-ignore="true"` (ROOT-11) e Top Layer no documento raiz.
         * @private
         */
        _criarOverlayBase(titulo) {
            this.fecharDialogoAtivo();
            const doc = this._obterDocumentoRaizUi();
            if (!doc || !doc.body) return null;

            const overlay = doc.createElement('div');
            overlay.id = ID_CONTAINER_DIALOGO;
            overlay.setAttribute('data-jusgov-ignore', 'true');
            if (typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype) {
                overlay.setAttribute('popover', 'manual');
            }
            overlay.style.cssText = [
                'position:fixed !important', 'inset:0 !important', 'margin:0 !important',
                'width:100vw !important', 'height:100vh !important', 'border:none !important',
                'padding:8px !important', 'box-sizing:border-box !important',
                'z-index:2147483647 !important', 'isolation:isolate !important',
                'background:rgba(15,23,42,0.55)', 'display:flex !important',
                'align-items:center', 'justify-content:center',
                'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
                'font-size:12px', 'color:#1e293b'
            ].join(';');

            const card = doc.createElement('div');
            card.setAttribute('data-jusgov-ignore', 'true');
            card.style.cssText = [
                'background:#ffffff', 'border-radius:8px', 'box-shadow:0 16px 36px rgba(0,0,0,0.32)',
                'width:min(510px,95vw)', 'max-height:86vh', 'display:flex', 'flex-direction:column',
                'overflow:hidden', 'border:1px solid #cbd5e1'
            ].join(';');

            const header = doc.createElement('div');
            header.setAttribute('data-jusgov-ignore', 'true');
            header.style.cssText = [
                'background:#0f172a', 'color:#f8fafc', 'padding:7px 12px',
                'font-weight:600', 'font-size:12.5px', 'display:flex',
                'align-items:center', 'justify-content:space-between', 'gap:8px'
            ].join(';');
            const spanTitulo = doc.createElement('span');
            spanTitulo.textContent = titulo || 'Automação de Tarefas — JusGovBR';
            const btnFecharTopo = doc.createElement('button');
            btnFecharTopo.type = 'button';
            btnFecharTopo.textContent = '×';
            btnFecharTopo.title = 'Fechar';
            btnFecharTopo.style.cssText = 'background:transparent;border:none;color:#94a3b8;font-size:16px;line-height:1;padding:0 4px;cursor:pointer;';
            header.appendChild(spanTitulo);
            header.appendChild(btnFecharTopo);

            const corpo = doc.createElement('div');
            corpo.setAttribute('data-jusgov-ignore', 'true');
            corpo.style.cssText = 'padding:8px 11px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;';

            const rodape = doc.createElement('div');
            rodape.setAttribute('data-jusgov-ignore', 'true');
            rodape.style.cssText = [
                'padding:7px 11px', 'background:#f8fafc', 'border-top:1px solid #e2e8f0',
                'display:flex', 'justify-content:flex-end', 'gap:6px'
            ].join(';');

            card.appendChild(header);
            card.appendChild(corpo);
            card.appendChild(rodape);
            overlay.appendChild(card);
            doc.body.appendChild(overlay);
            if (typeof overlay.showPopover === 'function') {
                try {
                    if (overlay.matches && overlay.matches(':popover-open')) overlay.hidePopover();
                    overlay.showPopover();
                } catch (_) { }
            }

            return { overlay, card, header, corpo, rodape, btnFecharTopo };
        }

        /**
         * Exibe dialogo de mensagem com timeout automatico (substitui `Display.ShowMessageDialogWithTimeout`).
         * @param {Object} opcoes
         * @param {string} opcoes.titulo
         * @param {string} opcoes.mensagem
         * @param {'OK'|'YesNo'|'RetryCancel'} [opcoes.botoes='OK']
         * @param {number} [opcoes.timeoutSegundos=3]
         * @param {string} [opcoes.botaoPadraoTimeout]
         * @returns {Promise<{ButtonPressed: string}>}
         */
        async exibirDialogoMensagemTimeout(opcoes = {}) {
            if (typeof this.manipuladorMock === 'function') {
                const respMock = await this.manipuladorMock('MENSAGEM_TIMEOUT', opcoes);
                if (respMock) return respMock;
            }

            const botoesTipo = opcoes.botoes || 'OK';
            const padraoTimeout = opcoes.botaoPadraoTimeout ||
                (botoesTipo === 'YesNo' ? 'Yes' : (botoesTipo === 'RetryCancel' ? 'Retry' : 'OK'));

            if (!this.documentoRaiz || !this.documentoRaiz.body) {
                return { ButtonPressed: padraoTimeout };
            }

            return new Promise((resolve) => {
                const ui = this._criarOverlayBase(opcoes.titulo || 'Automacao PJe');
                if (!ui) {
                    resolve({ ButtonPressed: padraoTimeout });
                    return;
                }

                const docModal = (ui.overlay && ui.overlay.ownerDocument) || this._obterDocumentoRaizUi() || document;
                const pre = docModal.createElement('div');
                pre.style.cssText = 'white-space:pre-wrap;line-height:1.45;color:#334155;';
                pre.textContent = String(opcoes.mensagem || '');
                ui.corpo.appendChild(pre);

                let timerId = null;
                const finalizar = (botaoEscolhido) => {
                    if (timerId !== null) clearTimeout(timerId);
                    this.fecharDialogoAtivo();
                    resolve({ ButtonPressed: botaoEscolhido });
                };

                const criarBotao = (rotulo, valorRetorno, primario = false) => {
                    const btn = docModal.createElement('button');
                    btn.type = 'button';
                    btn.textContent = rotulo;
                    btn.style.cssText = primario
                        ? 'background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;'
                        : 'background:#e2e8f0;color:#1e293b;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;';
                    btn.addEventListener('click', () => finalizar(valorRetorno));
                    ui.rodape.appendChild(btn);
                };

                if (botoesTipo === 'YesNo') {
                    criarBotao('Sim', 'Yes', true);
                    criarBotao('Nao', 'No', false);
                } else if (botoesTipo === 'RetryCancel') {
                    criarBotao('Repetir', 'Retry', true);
                    criarBotao('Cancelar', 'Cancel', false);
                } else {
                    criarBotao('OK', 'OK', true);
                }

                const segs = Number(opcoes.timeoutSegundos);
                if (!Number.isNaN(segs) && segs > 0) {
                    timerId = setTimeout(() => finalizar(padraoTimeout), segs * 1000);
                }
            });
        }

        /**
         * Exibe dialogo de entrada numerica/texto (substitui `DialogoStartTarefa` `Display.InputDialog`).
         * @param {Object} opcoes
         * @param {string} opcoes.titulo
         * @param {string} opcoes.mensagem
         * @param {string|number} [opcoes.valorPadrao='1']
         * @returns {Promise<{ButtonPressed: string, UserInput: string}>}
         */
        async exibirDialogoInputSequencial(opcoes = {}) {
            if (typeof this.manipuladorMock === 'function') {
                const respMock = await this.manipuladorMock('INPUT_SEQUENCIAL', opcoes);
                if (respMock) return respMock;
            }

            const valorInicial = String(opcoes.valorPadrao !== undefined ? opcoes.valorPadrao : '1');
            if (!this.documentoRaiz || !this.documentoRaiz.body) {
                return { ButtonPressed: 'OK', UserInput: valorInicial };
            }

            return new Promise((resolve) => {
                const ui = this._criarOverlayBase(opcoes.titulo || 'Iniciar Tarefa Sequencial');
                if (!ui) {
                    resolve({ ButtonPressed: 'OK', UserInput: valorInicial });
                    return;
                }

                const docModal = (ui.overlay && ui.overlay.ownerDocument) || this._obterDocumentoRaizUi() || document;
                const lbl = docModal.createElement('label');
                lbl.textContent = opcoes.mensagem || 'Iniciar pelo item:';
                lbl.style.cssText = 'font-weight:500;color:#334155;';

                const input = docModal.createElement('input');
                input.type = 'text';
                input.value = valorInicial;
                input.style.cssText = 'padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;';

                ui.corpo.appendChild(lbl);
                ui.corpo.appendChild(input);

                const finalizar = (botao) => {
                    const val = input.value;
                    this.fecharDialogoAtivo();
                    resolve({ ButtonPressed: botao, UserInput: val });
                };

                const btnCancel = docModal.createElement('button');
                btnCancel.type = 'button';
                btnCancel.textContent = 'Cancelar';
                btnCancel.style.cssText = 'background:#e2e8f0;color:#1e293b;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;';
                btnCancel.addEventListener('click', () => finalizar('Cancel'));

                const btnOk = docModal.createElement('button');
                btnOk.type = 'button';
                btnOk.textContent = 'OK';
                btnOk.style.cssText = 'background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;';
                btnOk.addEventListener('click', () => finalizar('OK'));

                ui.rodape.appendChild(btnCancel);
                ui.rodape.appendChild(btnOk);
            });
        }

        /**
         * Exibe dialogo de selecao de movimento processual (substitui `DialogoAção` `SelectFromListDialog`).
         * @param {Object} opcoes
         * @param {string} opcoes.titulo
         * @param {string} opcoes.mensagem
         * @param {Array<string>} opcoes.listaOpcoes
         * @param {string} [opcoes.opcaoPadrao]
         * @returns {Promise<{ButtonPressed: string, SelectedItem: string, SelectedIndex: number}>}
         */
        async exibirDialogoSelecaoMovimento(opcoes = {}) {
            if (typeof this.manipuladorMock === 'function') {
                const respMock = await this.manipuladorMock('SELECAO_MOVIMENTO', opcoes);
                if (respMock) return respMock;
            }

            const lista = Array.isArray(opcoes.listaOpcoes) ? opcoes.listaOpcoes : [];
            const escolhaDefault = opcoes.opcaoPadrao || (lista.length > 0 ? lista[0] : '');

            if (!this.documentoRaiz || !this.documentoRaiz.body) {
                return {
                    ButtonPressed: 'OK',
                    SelectedItem: escolhaDefault,
                    SelectedIndex: Math.max(0, lista.indexOf(escolhaDefault))
                };
            }

            return new Promise((resolve) => {
                const ui = this._criarOverlayBase(opcoes.titulo || 'Movimentar Processo');
                if (!ui) {
                    resolve({ ButtonPressed: 'OK', SelectedItem: escolhaDefault, SelectedIndex: 0 });
                    return;
                }

                const docModal = (ui.overlay && ui.overlay.ownerDocument) || this._obterDocumentoRaizUi() || document;
                const descricao = docModal.createElement('div');
                descricao.style.cssText = 'font-weight:600;color:#0f172a;margin-bottom:4px;';
                descricao.textContent = opcoes.mensagem || 'Selecione o movimento:';

                const select = docModal.createElement('select');
                select.size = Math.min(12, Math.max(4, lista.length));
                select.style.cssText = 'width:100%;padding:6px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;';

                lista.forEach((item, idx) => {
                    const opt = docModal.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    if (item === escolhaDefault || (idx === 0 && !escolhaDefault)) {
                        opt.selected = true;
                    }
                    select.appendChild(opt);
                });

                ui.corpo.appendChild(descricao);
                ui.corpo.appendChild(select);

                const finalizar = (botao) => {
                    const itemSelecionado = select.value || escolhaDefault;
                    const idxSelecionado = Math.max(0, lista.indexOf(itemSelecionado));
                    this.fecharDialogoAtivo();
                    resolve({
                        ButtonPressed: botao,
                        SelectedItem: itemSelecionado,
                        SelectedIndex: idxSelecionado
                    });
                };

                select.addEventListener('dblclick', () => finalizar('OK'));

                const btnCancel = docModal.createElement('button');
                btnCancel.type = 'button';
                btnCancel.textContent = 'Cancelar';
                btnCancel.style.cssText = 'background:#e2e8f0;color:#1e293b;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;';
                btnCancel.addEventListener('click', () => finalizar('Cancel'));

                const btnOk = docModal.createElement('button');
                btnOk.type = 'button';
                btnOk.textContent = 'Executar Movimento';
                btnOk.style.cssText = 'background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;';
                btnOk.addEventListener('click', () => finalizar('OK'));

                ui.rodape.appendChild(btnCancel);
                ui.rodape.appendChild(btnOk);
            });
        }

        /**
         * Exibe o formulario completo de configuracao do ciclo de automacao (substitui `DialogoCFG` AdaptiveCard).
         * @param {Object} valoresAtuais Estado atual das variaveis `v_CFG*`.
         * @param {Object} opcoesSchema Mapa `opcoesDialogoConfig` vindo de `automate-dados.json`.
         * @returns {Promise<{ButtonPressed: string, valores: Object}>}
         */
        async exibirDialogoConfiguracao(valoresAtuais = {}, opcoesSchema = {}) {
            if (typeof this.manipuladorMock === 'function') {
                const respMock = await this.manipuladorMock('DIALOGO_CFG', { valoresAtuais, opcoesSchema });
                if (respMock) return respMock;
            }

            const modosSelecao = (Array.isArray(opcoesSchema.modosSelecao) && opcoesSchema.modosSelecao.length > 0)
                ? opcoesSchema.modosSelecao
                : [
                    { titulo: 'Manualmente (Sem Movimentar)', valor: 'Silente' },
                    { titulo: 'Manualmente (Movimentando)', valor: 'Manual' },
                    { titulo: 'Automáticamente (Primeiro Visível)', valor: 'Visivel' },
                    { titulo: 'Sequencial (desde o #º Processo da Lista)', valor: 'Sequencial' },
                    { titulo: 'Sequencial (Loop)', valor: 'Loop' }
                ];

            const listaTp1 = (Array.isArray(opcoesSchema.etiquetasRemoverTp1) && opcoesSchema.etiquetasRemoverTp1.length > 0)
                ? opcoesSchema.etiquetasRemoverTp1
                : [
                    { titulo: 'Contestação; Réplica', valor: '.?A.? Contestação; .?A.? Réplica' },
                    { titulo: 'Convertido; Aditamento; Emenda', valor: '.?A.? Convertido; .?A.? Aditamento; .?A.? Emenda' },
                    { titulo: 'Análise Tutela', valor: 'Análise Tutela' },
                    { titulo: 'Aguardando Assinatura', valor: 'Aguardando Assinatura' }
                ];

            const listaTp2 = (Array.isArray(opcoesSchema.etiquetasRemoverTp2) && opcoesSchema.etiquetasRemoverTp2.length > 0)
                ? opcoesSchema.etiquetasRemoverTp2
                : [
                    { titulo: 'Citar; Intimar; Notificar', valor: 'Citar; Intimar; Notificar' },
                    { titulo: 'Concluir; Correções; Homologar; Proposta; Após', valor: 'Concluir; Correções; Homologar; Proposta; Ap(o|ó)s' }
                ];

            const listaTp3 = (Array.isArray(opcoesSchema.etiquetasRemoverTp3) && opcoesSchema.etiquetasRemoverTp3.length > 0)
                ? opcoesSchema.etiquetasRemoverTp3
                : [
                    { titulo: 'Dist; Perito', valor: 'Dist.; Perit(o|a)' },
                    { titulo: 'Evoluir; Expedir; Minutar; Analisar', valor: 'Evoluir; Expedir; Minutar; Analisar' },
                    { titulo: 'Designar; Arquivar; Certificar; Remeter', valor: 'Designar; Arquivar; Certificar; Remeter; Reme(ç|c)a Necess(á|a)ria' },
                    { titulo: 'Pré Arquivamento (diversos)', valor: 'laudo|pauta|correç|pedido|prevenção|multirão|perícia|suspens|impugna' }
                ];

            const padraoTp1Str = listaTp1.map(x => x.valor).join(', ');
            const padraoTp2Str = listaTp2.map(x => x.valor).join(', ');
            const padraoTp3Str = listaTp3.map(x => x.valor).join(', ');

            const nomeEtqEntrada = String(valoresAtuais.v_EtiquetaEntrada || 'Relatório Silmar').trim() || 'Relatório Silmar';
            const nomeEtqSaida = String(valoresAtuais.v_EtiquetaSaida || 'Silmar TMP').trim() || 'Silmar TMP';

            const padraoRetorno = {
                Selecionar: valoresAtuais.v_CFGSelecionar || 'Sequencial',
                PrimeiroPlano: valoresAtuais.v_CFGPrimeiroPlano !== undefined ? Boolean(valoresAtuais.v_CFGPrimeiroPlano) : true,
                EtqtListaRemoverTp0Txt: valoresAtuais.v_CFGEtqtListaRemoverTp0Txt !== undefined
                    ? String(valoresAtuais.v_CFGEtqtListaRemoverTp0Txt)
                    : '[A] Decisão CNJ - Prazo Suspenso AGU',
                EtqtListaRemoverTp1Lista: valoresAtuais.v_CFGEtqtListaRemoverTp1Lista !== undefined
                    ? String(valoresAtuais.v_CFGEtqtListaRemoverTp1Lista)
                    : padraoTp1Str,
                EtqtListaRemoverTp2Lista: valoresAtuais.v_CFGEtqtListaRemoverTp2Lista !== undefined
                    ? String(valoresAtuais.v_CFGEtqtListaRemoverTp2Lista)
                    : padraoTp2Str,
                EtqtListaRemoverTp3Lista: valoresAtuais.v_CFGEtqtListaRemoverTp3Lista !== undefined
                    ? String(valoresAtuais.v_CFGEtqtListaRemoverTp3Lista)
                    : padraoTp3Str,
                EtqtListaIncluir1: valoresAtuais.v_CFGEtqtListaIncluir1 !== undefined ? String(valoresAtuais.v_CFGEtqtListaIncluir1) : '',
                EtqtListaIncluir2: valoresAtuais.v_CFGEtqtListaIncluir2 !== undefined ? String(valoresAtuais.v_CFGEtqtListaIncluir2) : '',
                EtiquetaEntrada: valoresAtuais.v_CFGEtiquetaEntrada !== undefined ? Boolean(valoresAtuais.v_CFGEtiquetaEntrada) : false,
                EtiquetaSaida: valoresAtuais.v_CFGEtiquetaSaida !== undefined ? Boolean(valoresAtuais.v_CFGEtiquetaSaida) : true,
                EtiquetaControleExcludente: valoresAtuais.v_CFGEtiquetaControleExcludente !== undefined ? Boolean(valoresAtuais.v_CFGEtiquetaControleExcludente) : false,
                MarcarLidosDocsAutos: valoresAtuais.v_CFGMarcarLidosDocsAutos !== undefined ? Boolean(valoresAtuais.v_CFGMarcarLidosDocsAutos) : true,
                PrazosEmAbertoVerf: valoresAtuais.v_CFGPrazosEmAbertoVerf !== undefined ? Boolean(valoresAtuais.v_CFGPrazosEmAbertoVerf) : false,
                f_CFG_TarefaSequencia: valoresAtuais.v_CFGTarefaSequencia || 'Ler e Movimentar',
                f_CFG_QtdPagsSequencia: String(valoresAtuais.v_CFGQtdPagsSequencia || '1'),
                f_CFG_AutosLista: valoresAtuais.v_CFGAutosLista || 'Sentença, Decisão, Despacho, Acórdão',
                f_CFG_AutosSoma: valoresAtuais.v_CFGAutosSoma || 'Perícia, Laudo',
                f_CFG_TermoPesquisa: valoresAtuais.v_CFGTermoPesquisa || '',
                f_CFG_EtiquetaAuto: valoresAtuais.v_CFGEtiquetaAuto !== undefined ? String(valoresAtuais.v_CFGEtiquetaAuto) : 'True',
                f_CFG_Movimentar: valoresAtuais.v_CFGMovimentar || 'Perguntar, com Sugestão Padrão'
            };

            if (!this.documentoRaiz || !this.documentoRaiz.body) {
                return { ButtonPressed: 'OK', valores: padraoRetorno };
            }

            return new Promise((resolve) => {
                const ui = this._criarOverlayBase('Parametros');
                if (!ui) {
                    resolve({ ButtonPressed: 'OK', valores: padraoRetorno });
                    return;
                }

                const docModal = (ui.overlay && ui.overlay.ownerDocument) || this._obterDocumentoRaizUi() || document;

                ui.card.style.cssText = [
                    'background:#ffffff', 'border-radius:4px', 'box-shadow:0 12px 32px rgba(0,0,0,0.34)',
                    'width:min(368px,95vw)', 'max-height:92vh', 'display:flex', 'flex-direction:column',
                    'overflow:hidden', 'border:1px solid #94a3b8',
                    'font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif',
                    'font-size:12.5px', 'color:#111827'
                ].join(';');

                ui.header.style.cssText = [
                    'background:#ffffff', 'color:#475569', 'padding:7px 10px 6px 10px',
                    'font-weight:400', 'font-size:12.5px', 'display:flex',
                    'align-items:center', 'justify-content:space-between', 'gap:8px',
                    'border-bottom:1px solid #e5e7eb', 'user-select:none'
                ].join(';');

                while (ui.header.firstChild) ui.header.removeChild(ui.header.firstChild);
                const tituloWrap = docModal.createElement('div');
                tituloWrap.style.cssText = 'display:inline-flex;align-items:center;gap:7px;';
                const iconePad = docModal.createElement('span');
                iconePad.textContent = '❯';
                iconePad.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:3px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#ffffff;font-size:11px;font-weight:700;line-height:1;';
                const txtTitulo = docModal.createElement('span');
                txtTitulo.textContent = 'Parametros';
                txtTitulo.style.cssText = 'color:#64748b;font-size:12.5px;font-weight:400;';
                tituloWrap.appendChild(iconePad);
                tituloWrap.appendChild(txtTitulo);

                const btnFecharTopo = docModal.createElement('button');
                btnFecharTopo.type = 'button';
                btnFecharTopo.textContent = '×';
                btnFecharTopo.title = 'Fechar';
                btnFecharTopo.style.cssText = 'background:transparent;border:none;color:#64748b;font-size:18px;line-height:1;padding:0 5px;cursor:pointer;';
                ui.header.appendChild(tituloWrap);
                ui.header.appendChild(btnFecharTopo);

                ui.corpo.style.cssText = 'padding:8px 14px 6px 14px;overflow-y:auto;display:flex;flex-direction:column;gap:0;background:#ffffff;';

                const criarSeparador = () => {
                    const hr = docModal.createElement('div');
                    hr.style.cssText = 'height:1px;background:#6b7280;opacity:0.55;margin:6px 0 5px 0;width:100%;flex-shrink:0;';
                    ui.corpo.appendChild(hr);
                };

                const criarTituloSecao = (texto, margemTopo = 0) => {
                    const div = docModal.createElement('div');
                    div.textContent = texto;
                    div.style.cssText = `font-size:12.5px;font-weight:400;color:#111827;margin:${margemTopo}px 0 3px 0;line-height:1.25;`;
                    ui.corpo.appendChild(div);
                    return div;
                };

                const criarCheckboxLinha = (texto, marcadoInicial, margemInferior = 2) => {
                    const lbl = docModal.createElement('label');
                    lbl.style.cssText = `display:flex;align-items:center;gap:6px;font-size:12.5px;color:#111827;cursor:pointer;margin:1px 0 ${margemInferior}px 0;line-height:1.3;user-select:none;`;
                    const chk = docModal.createElement('input');
                    chk.type = 'checkbox';
                    chk.checked = Boolean(marcadoInicial);
                    chk.style.cssText = 'margin:0;width:14px;height:14px;cursor:pointer;accent-color:#111827;flex-shrink:0;';
                    const sp = docModal.createElement('span');
                    sp.textContent = texto;
                    lbl.appendChild(chk);
                    lbl.appendChild(sp);
                    ui.corpo.appendChild(lbl);
                    return chk;
                };

                const itemEstaMarcado = (valorItem, strSalva) => {
                    const s = String(strSalva || '');
                    if (!s) return false;
                    return s.includes(valorItem);
                };

                criarTituloSecao('Como selecionar o processo?', 2);
                const selSelecionar = docModal.createElement('select');
                selSelecionar.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #9ca3af;border-radius:2px;font-size:12.5px;background:#f3f4f6;color:#111827;margin-bottom:4px;font-family:inherit;';
                modosSelecao.forEach((op) => {
                    const opt = docModal.createElement('option');
                    opt.value = op.valor;
                    opt.textContent = op.titulo;
                    if (String(op.valor) === String(padraoRetorno.Selecionar)) opt.selected = true;
                    selSelecionar.appendChild(opt);
                });
                ui.corpo.appendChild(selSelecionar);

                const chkPrimeiroPlano = criarCheckboxLinha('Escolher Movimentação na Janela Principal?', padraoRetorno.PrimeiroPlano, 1);

                criarSeparador();
                criarTituloSecao('Lista de Etiquetas pra Remover Tp0 (sempre):');
                const inpTp0 = docModal.createElement('input');
                inpTp0.type = 'text';
                inpTp0.value = padraoRetorno.EtqtListaRemoverTp0Txt;
                inpTp0.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #9ca3af;border-radius:2px;font-size:12.5px;background:#ffffff;color:#111827;margin-bottom:2px;font-family:inherit;';
                ui.corpo.appendChild(inpTp0);

                criarSeparador();
                criarTituloSecao('Lista de Etiquetas pra Remover Tp1:');
                const checksTp1 = listaTp1.map((item) => ({
                    valor: item.valor,
                    chk: criarCheckboxLinha(item.titulo, itemEstaMarcado(item.valor, padraoRetorno.EtqtListaRemoverTp1Lista))
                }));

                criarSeparador();
                criarTituloSecao('Lista de Etiquetas pra Remover Tp2:');
                const checksTp2 = listaTp2.map((item) => ({
                    valor: item.valor,
                    chk: criarCheckboxLinha(item.titulo, itemEstaMarcado(item.valor, padraoRetorno.EtqtListaRemoverTp2Lista))
                }));

                criarSeparador();
                criarTituloSecao('Lista de Etiquetas pra Remover Tp3:');
                const checksTp3 = listaTp3.map((item) => ({
                    valor: item.valor,
                    chk: criarCheckboxLinha(item.titulo, itemEstaMarcado(item.valor, padraoRetorno.EtqtListaRemoverTp3Lista))
                }));

                criarSeparador();
                criarTituloSecao('Lista de Etiquetas pra Incluir:');
                const chkIncluirInterrog = criarCheckboxLinha('?', String(padraoRetorno.EtqtListaIncluir1 || '').includes('?'), 3);
                const inpIncluir2 = docModal.createElement('input');
                inpIncluir2.type = 'text';
                inpIncluir2.value = padraoRetorno.EtqtListaIncluir2;
                inpIncluir2.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #9ca3af;border-radius:2px;font-size:12.5px;background:#ffffff;color:#111827;margin-bottom:2px;font-family:inherit;';
                ui.corpo.appendChild(inpIncluir2);

                criarSeparador();
                criarTituloSecao('Marcas de Controle:');
                const chkEntrada = criarCheckboxLinha(`Entrada: ${nomeEtqEntrada}`, padraoRetorno.EtiquetaEntrada, 3);
                const chkSaida = criarCheckboxLinha(`Saída: ${nomeEtqSaida}`, padraoRetorno.EtiquetaSaida, 3);
                const chkExcludentes = criarCheckboxLinha('Entrada/Saída excludentes?', padraoRetorno.EtiquetaControleExcludente, 2);

                criarSeparador();
                const chkMarcarLidos = criarCheckboxLinha('Ao ler autos, marcar documentos como Lidos?', padraoRetorno.MarcarLidosDocsAutos, 3);
                const chkVerificarPrazos = criarCheckboxLinha('Verificar Prazos em Aberto?', padraoRetorno.PrazosEmAbertoVerf, 2);

                ui.rodape.style.cssText = 'padding:8px 14px 12px 14px;background:#ffffff;border-top:none;display:grid;grid-template-columns:1fr 1fr;gap:10px;';

                const coletarValores = () => {
                    const tp1Sel = checksTp1.filter(x => x.chk.checked).map(x => x.valor).join(', ');
                    const tp2Sel = checksTp2.filter(x => x.chk.checked).map(x => x.valor).join(', ');
                    const tp3Sel = checksTp3.filter(x => x.chk.checked).map(x => x.valor).join(', ');
                    return {
                        Selecionar: selSelecionar.value,
                        PrimeiroPlano: chkPrimeiroPlano.checked,
                        EtqtListaRemoverTp0Txt: inpTp0.value,
                        EtqtListaRemoverTp1Lista: tp1Sel,
                        EtqtListaRemoverTp2Lista: tp2Sel,
                        EtqtListaRemoverTp3Lista: tp3Sel,
                        EtqtListaIncluir1: chkIncluirInterrog.checked ? '?' : '',
                        EtqtListaIncluir2: inpIncluir2.value,
                        EtiquetaEntrada: chkEntrada.checked,
                        EtiquetaSaida: chkSaida.checked,
                        EtiquetaControleExcludente: chkExcludentes.checked,
                        MarcarLidosDocsAutos: chkMarcarLidos.checked,
                        PrazosEmAbertoVerf: chkVerificarPrazos.checked
                    };
                };

                const aoTeclaEsc = (ev) => {
                    if (ev.key === 'Escape') {
                        ev.preventDefault();
                        finalizar('Cancel');
                    }
                };

                const finalizar = (botao) => {
                    docModal.removeEventListener('keydown', aoTeclaEsc);
                    const valores = coletarValores();
                    this.fecharDialogoAtivo();
                    resolve({ ButtonPressed: botao, valores });
                };

                docModal.addEventListener('keydown', aoTeclaEsc);
                btnFecharTopo.addEventListener('click', () => finalizar('Cancel'));

                const estiloBtnPad = [
                    'background:#e5e7eb', 'color:#111827', 'border:1px solid #9ca3af',
                    'border-radius:2px', 'padding:7px 10px', 'font-size:13.5px',
                    'font-weight:400', 'cursor:pointer', 'width:100%', 'box-sizing:border-box',
                    'font-family:inherit'
                ].join(';');

                const btnAutomatizar = docModal.createElement('button');
                btnAutomatizar.type = 'button';
                btnAutomatizar.textContent = 'Automatizar';
                btnAutomatizar.style.cssText = estiloBtnPad;
                btnAutomatizar.addEventListener('mouseenter', () => { btnAutomatizar.style.background = '#d1d5db'; });
                btnAutomatizar.addEventListener('mouseleave', () => { btnAutomatizar.style.background = '#e5e7eb'; });
                btnAutomatizar.addEventListener('click', () => finalizar('OK'));

                const btnSilente = docModal.createElement('button');
                btnSilente.type = 'button';
                btnSilente.textContent = 'Silente';
                btnSilente.style.cssText = estiloBtnPad;
                btnSilente.addEventListener('mouseenter', () => { btnSilente.style.background = '#d1d5db'; });
                btnSilente.addEventListener('mouseleave', () => { btnSilente.style.background = '#e5e7eb'; });
                btnSilente.addEventListener('click', () => finalizar('Silente'));

                ui.rodape.appendChild(btnAutomatizar);
                ui.rodape.appendChild(btnSilente);
            });
        }
    }

    return JusGovAutomateDialogos;
}));
