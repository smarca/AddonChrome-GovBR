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

            const padraoRetorno = {
                f_CFG_TarefaSequencia: valoresAtuais.v_CFGTarefaSequencia || 'Ler e Movimentar',
                f_CFG_QtdPagsSequencia: String(valoresAtuais.v_CFGQtdPagsSequencia || '1'),
                f_CFG_AutosLista: valoresAtuais.v_CFGAutosLista || 'Sentença, Decisão, Despacho, Acórdão',
                f_CFG_AutosSoma: valoresAtuais.v_CFGAutosSoma || 'Perícia, Laudo',
                f_CFG_TermoPesquisa: valoresAtuais.v_CFGTermoPesquisa || '',
                f_CFG_EtiquetaAuto: valoresAtuais.v_CFGEtiquetaAuto !== undefined ? String(valoresAtuais.v_CFGEtiquetaAuto) : 'True',
                f_CFG_Movimentar: valoresAtuais.v_CFGMovimentar || 'Perguntar, com Sugestão Padrão'
            };

            if (!this.documentoRaiz || !this.documentoRaiz.body) {
                return { ButtonPressed: 'Ok', valores: padraoRetorno };
            }

            return new Promise((resolve) => {
                const ui = this._criarOverlayBase('Automação de Tarefas — Configuração');
                if (!ui) {
                    resolve({ ButtonPressed: 'Ok', valores: padraoRetorno });
                    return;
                }

                const docModal = (ui.overlay && ui.overlay.ownerDocument) || this._obterDocumentoRaizUi() || document;
                const contextosLista = Array.isArray(opcoesSchema.contextosDisponiveis) && opcoesSchema.contextosDisponiveis.length > 0
                    ? opcoesSchema.contextosDisponiveis
                    : [
                        { id: 'navegador_geral', nome: 'Navegador — Automação Geral', dominios: [], autoAtivar: false },
                        { id: 'pje_padrao', nome: '↳ PJe — Tarefas e Autos Digitais', dominios: ['*.pje.jus.br', '*pje*.jus.br', 'frontend.prd.cnj.cloud', 'sso.cloud.pje.jus.br'], autoAtivar: false }
                    ];
                const ctxInicialId = opcoesSchema.contextoAtivoId || contextosLista[0].id;
                const ctxInicialObj = contextosLista.find(c => c.id === ctxInicialId) || contextosLista[0];

                const grade = docModal.createElement('div');
                grade.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 8px;align-items:end;';

                const boxContexto = docModal.createElement('div');
                boxContexto.style.cssText = 'grid-column:1 / -1;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;display:grid;grid-template-columns:1fr 1.15fr;gap:5px 8px;align-items:center;';

                const wrapCtx = docModal.createElement('div');
                wrapCtx.style.cssText = 'display:flex;flex-direction:column;gap:2px;min-width:0;';
                const lblCtx = docModal.createElement('label');
                lblCtx.textContent = 'Contexto Hierárquico / Site:';
                lblCtx.style.cssText = 'font-weight:700;font-size:10.5px;color:#0f172a;';
                const selContexto = docModal.createElement('select');
                selContexto.style.cssText = 'padding:3px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:11px;background:#fff;width:100%;box-sizing:border-box;';
                contextosLista.forEach((c) => {
                    const opt = docModal.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.nome || c.id;
                    if (c.id === ctxInicialId) opt.selected = true;
                    selContexto.appendChild(opt);
                });
                wrapCtx.appendChild(lblCtx);
                wrapCtx.appendChild(selContexto);

                const wrapDom = docModal.createElement('div');
                wrapDom.style.cssText = 'display:flex;flex-direction:column;gap:2px;min-width:0;';
                const lblDom = docModal.createElement('label');
                lblDom.textContent = 'Domínios p/ auto-ativar (vírgula):';
                lblDom.style.cssText = 'font-weight:600;font-size:10.5px;color:#334155;';
                const rowDom = docModal.createElement('div');
                rowDom.style.cssText = 'display:flex;align-items:center;gap:5px;';
                const inpDominios = docModal.createElement('input');
                inpDominios.type = 'text';
                inpDominios.value = Array.isArray(ctxInicialObj.dominios) ? ctxInicialObj.dominios.join(', ') : '';
                inpDominios.placeholder = 'Ex.: *.pje.jus.br, sistema.gov.br';
                inpDominios.style.cssText = 'flex:1;min-width:0;padding:3px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:11px;';
                const lblAutoDom = docModal.createElement('label');
                lblAutoDom.title = 'Habilitar automaticamente este contexto ao acessar os domínios indicados';
                lblAutoDom.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:10.5px;color:#0f172a;white-space:nowrap;cursor:pointer;';
                const chkAutoDom = docModal.createElement('input');
                chkAutoDom.type = 'checkbox';
                chkAutoDom.checked = Boolean(ctxInicialObj.autoAtivar);
                chkAutoDom.style.cssText = 'margin:0;cursor:pointer;';
                lblAutoDom.appendChild(chkAutoDom);
                lblAutoDom.appendChild(docModal.createTextNode('Auto'));
                rowDom.appendChild(inpDominios);
                rowDom.appendChild(lblAutoDom);
                wrapDom.appendChild(lblDom);
                wrapDom.appendChild(rowDom);

                selContexto.addEventListener('change', () => {
                    const escolhido = contextosLista.find(c => c.id === selContexto.value);
                    if (escolhido) {
                        inpDominios.value = Array.isArray(escolhido.dominios) ? escolhido.dominios.join(', ') : '';
                        chkAutoDom.checked = Boolean(escolhido.autoAtivar);
                    }
                });

                boxContexto.appendChild(wrapCtx);
                boxContexto.appendChild(wrapDom);
                grade.appendChild(boxContexto);

                const criarCampoSelect = (rotulo, opcoesLista, valorInicial, colSpanFull = false) => {
                    const wrap = docModal.createElement('div');
                    wrap.style.cssText = `display:flex;flex-direction:column;gap:2px;min-width:0;${colSpanFull ? 'grid-column:1 / -1;' : ''}`;
                    const lbl = docModal.createElement('label');
                    lbl.textContent = rotulo;
                    lbl.style.cssText = 'font-weight:600;font-size:11px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                    const sel = docModal.createElement('select');
                    sel.style.cssText = 'padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:11.5px;width:100%;box-sizing:border-box;background:#fff;';
                    (opcoesLista || []).forEach((op) => {
                        const opt = docModal.createElement('option');
                        const val = typeof op === 'object' ? op.valor : String(op);
                        const txt = typeof op === 'object' ? op.titulo : String(op);
                        opt.value = val;
                        opt.textContent = txt;
                        if (String(val) === String(valorInicial)) opt.selected = true;
                        sel.appendChild(opt);
                    });
                    wrap.appendChild(lbl);
                    wrap.appendChild(sel);
                    grade.appendChild(wrap);
                    return sel;
                };

                const criarCampoInput = (rotulo, valorInicial, placeholder = '', colSpanFull = false) => {
                    const wrap = docModal.createElement('div');
                    wrap.style.cssText = `display:flex;flex-direction:column;gap:2px;min-width:0;${colSpanFull ? 'grid-column:1 / -1;' : ''}`;
                    const lbl = docModal.createElement('label');
                    lbl.textContent = rotulo;
                    lbl.style.cssText = 'font-weight:600;font-size:11px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                    const inp = docModal.createElement('input');
                    inp.type = 'text';
                    inp.value = valorInicial || '';
                    inp.placeholder = placeholder;
                    inp.style.cssText = 'padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:11.5px;width:100%;box-sizing:border-box;';
                    wrap.appendChild(lbl);
                    wrap.appendChild(inp);
                    grade.appendChild(wrap);
                    return inp;
                };

                const selSequencia = criarCampoSelect(
                    '1. Tarefas em Sequência?',
                    opcoesSchema.tarefaSequencia || ['Não, Parar na Primeira', 'Ler e Movimentar', 'Apenas Movimentar'],
                    padraoRetorno.f_CFG_TarefaSequencia
                );
                const selPaginas = criarCampoSelect(
                    'Páginas em sequência:',
                    opcoesSchema.qtdPagsSequencia || ['1', '2', '3', '5', '10', '20', '99999999999'],
                    padraoRetorno.f_CFG_QtdPagsSequencia
                );
                const selAutosLista = criarCampoSelect(
                    '2. Autos — Abrir Documentos:',
                    opcoesSchema.autosLista || [
                        'Sentença, Decisão, Despacho, Acórdão',
                        'Petição, Manifestação, Contestação, Impugnação, Apelação, Recurso, Contrarrazões',
                        'Certidão, Intimação, Citação',
                        'Nenhum'
                    ],
                    padraoRetorno.f_CFG_AutosLista
                );
                const selAutosSoma = criarCampoSelect(
                    'Abrir Mais:',
                    opcoesSchema.autosSoma || ['Nenhum', 'Perícia, Laudo', 'Cálculos, Planilha, Contadoria'],
                    padraoRetorno.f_CFG_AutosSoma
                );
                const inpTermo = criarCampoInput(
                    'Termos adicionais (Autos):',
                    padraoRetorno.f_CFG_TermoPesquisa,
                    'Ex.: Laudo, Decisão'
                );
                const selEtiqueta = criarCampoSelect(
                    '3. Etiquetar Autom.?',
                    ['True', 'False'],
                    padraoRetorno.f_CFG_EtiquetaAuto
                );
                const selMovimentar = criarCampoSelect(
                    '4. Movimentar o Processo:',
                    opcoesSchema.movimentarOpcoes || [
                        'Perguntar, com Sugestão Padrão',
                        'Sempre Perguntar',
                        'Automatico, se Houver Padrão',
                        '- Nao Movimentar, Só Tarefas'
                    ],
                    padraoRetorno.f_CFG_Movimentar,
                    true
                );

                ui.corpo.appendChild(grade);

                const finalizar = (botao) => {
                    const valores = {
                        f_CFG_ContextoId: selContexto.value,
                        f_CFG_DominiosAutoAtivacao: inpDominios.value,
                        f_CFG_AutoAtivarDominio: chkAutoDom.checked,
                        f_CFG_TarefaSequencia: selSequencia.value,
                        f_CFG_QtdPagsSequencia: selPaginas.value,
                        f_CFG_AutosLista: selAutosLista.value,
                        f_CFG_AutosSoma: selAutosSoma.value,
                        f_CFG_TermoPesquisa: inpTermo.value,
                        f_CFG_EtiquetaAuto: selEtiqueta.value,
                        f_CFG_Movimentar: selMovimentar.value
                    };
                    this.fecharDialogoAtivo();
                    resolve({ ButtonPressed: botao, valores });
                };

                if (ui.btnFecharTopo) {
                    ui.btnFecharTopo.addEventListener('click', () => finalizar('Cancel'));
                }

                const btnCancel = docModal.createElement('button');
                btnCancel.type = 'button';
                btnCancel.textContent = 'Cancelar';
                btnCancel.style.cssText = 'background:#e2e8f0;color:#1e293b;border:none;padding:5px 12px;border-radius:5px;font-size:11.5px;cursor:pointer;';
                btnCancel.addEventListener('click', () => finalizar('Cancel'));

                const btnOk = docModal.createElement('button');
                btnOk.type = 'button';
                btnOk.textContent = 'Confirmar';
                btnOk.style.cssText = 'background:#2563eb;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:11.5px;cursor:pointer;font-weight:600;';
                btnOk.addEventListener('click', () => finalizar('Ok'));

                ui.rodape.appendChild(btnCancel);
                ui.rodape.appendChild(btnOk);
            });
        }
    }

    return JusGovAutomateDialogos;
}));
