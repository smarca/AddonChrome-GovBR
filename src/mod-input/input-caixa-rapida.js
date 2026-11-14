/* ==========================================================================
 * Nome do arquivo: input-caixa-rapida.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Entrada Rápida
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-caixa-rapida.js
 * - Classe Exportada: CaixaEntradaRapida (window.JusGovCaixaEntradaRapida)
 * - Métodos Públicos: registrarPosicaoMouse(e), tratarEventoTeclado(e), abrirCaixa(posicao), fecharCaixa(), confirmar(), get/set ativo
 * - Atalho de Disparo: Ins + Ins ou Ctrl + Insert + Insert (duplo acionamento rápido em janela <= 400ms)
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.72 (FEAT-08), Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Fornecer uma Caixa de Entrada Rápida Flutuante, arrastável e de altíssima conveniência
 *    para digitação manual de dados (números de processo, datas, valores ou observações)
 *    em telas, imagens digitalizadas de autos ou PDFs embutidos sem camada OCR.
 *    Ao confirmar (Enter ou botão OK), grava imediatamente o texto digitado na Área de Transferência
 *    do sistema operacional e alimenta o histórico de dois slots com backup.
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe CaixaEntradaRapida com campos privados (#) e métodos de ciclo de vida
 *    DOM limpos, com drag-and-drop nativo na barra de título e auto-foco com seleção de texto.
 * 3) GESTÃO DE ESTADO E POSICIONAMENTO PROXI-MOUSE:
 *    Posiciona-se preferencialmente abaixo do cursor do mouse (com clamp nas bordas da viewport)
 *    ou no centro da janela caso o mouse esteja fora da área visível.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovCaixaEntradaRapida = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class CaixaEntradaRapida {
        #ativo = true;
        #ultimoInsertTimestamp = 0;
        #janelaTempoMs = 400;
        #elementoDialogo = null;
        #ultimoTextoDigitado = '';
        #posicaoMouse = { x: 0, y: 0 };
        #emArrasto = false;
        #arrastoOffset = { x: 0, y: 0 };
        #abortControllerArrasto = null;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true]
         * @param {number} [opcoes.janelaTempoMs=400]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.ativo === 'boolean') {
                this.#ativo = opcoes.ativo;
            }
            if (typeof opcoes.janelaTempoMs === 'number' && opcoes.janelaTempoMs > 0) {
                this.#janelaTempoMs = opcoes.janelaTempoMs;
            }
        }

        get ativo() {
            return this.#ativo;
        }

        set ativo(v) {
            this.#ativo = Boolean(v);
            if (!this.#ativo) {
                this.fecharCaixa();
            }
        }

        get isAberta() {
            return Boolean(this.#elementoDialogo && document.body.contains(this.#elementoDialogo));
        }

        get ultimoTextoDigitado() {
            return this.#ultimoTextoDigitado;
        }

        /**
         * Registra as coordenadas atuais do cursor do mouse na viewport
         * @param {MouseEvent} e
         */
        registrarPosicaoMouse(e) {
            if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
                this.#posicaoMouse.x = e.clientX;
                this.#posicaoMouse.y = e.clientY;
            }
        }

        /**
         * Trata evento keydown global interceptando duplo Insert rápido (Ins + Ins ou Ctrl + Ins + Ins)
         * Blindado contra disparo duplicado entre múltiplos listeners (BUG-32) e contra repetição automática.
         * @param {KeyboardEvent} e
         * @returns {boolean} True se a caixa foi acionada
         */
        tratarEventoTeclado(e) {
            if (!this.#ativo || !e) return false;
            if (e.repeat === true) return false;

            const ehInsert = (e.key === 'Insert' || e.code === 'Insert' || e.keyCode === 45);
            if (!ehInsert) return false;

            /* Guarda de evento único (BUG-32): se o mesmo objeto KeyboardEvent passar por dois listeners
             * (ex: mod-input.js e copia-selecionar.js), evita contar 1 pressão física como 2 toques. */
            if (e.__jusgovInsertProcessado) {
                return Boolean(e.__jusgovInsertAtivouCaixa);
            }
            try {
                e.__jusgovInsertProcessado = true;
            } catch (_) { }

            // Se for duplo acionamento de Insert (puro simples ou com Ctrl, sem Alt, Shift ou Meta)
            if (!e.altKey && !e.shiftKey && !e.metaKey) {
                const agora = Date.now();
                const delta = agora - this.#ultimoInsertTimestamp;
                if (this.#ultimoInsertTimestamp > 0 && delta >= 0 && delta <= this.#janelaTempoMs) {
                    // Duplo acionamento detectado!
                    try {
                        e.__jusgovInsertAtivouCaixa = true;
                        e.preventDefault();
                        e.stopPropagation();
                    } catch (_) {}
                    this.#ultimoInsertTimestamp = 0;
                    this.abrirCaixa();
                    return true;
                }
                this.#ultimoInsertTimestamp = agora;
            }

            return false;
        }

        /**
         * Abre a Caixa de Entrada Rápida Flutuante (Singleton estrito no DOM - BUG-32)
         * @param {Object} [posicaoCustomizada=null] - { x, y } opcional
         */
        abrirCaixa(posicaoCustomizada = null) {
            if (!this.#ativo) return;

            const doc = typeof document !== 'undefined' ? document : null;
            if (!doc || !doc.body) return;

            let docTop = doc;
            try {
                if (doc.defaultView && doc.defaultView.top && doc.defaultView.top.document && doc.defaultView.top.document.body) {
                    docTop = doc.defaultView.top.document;
                }
            } catch (_) {
                docTop = doc;
            }

            const todosExistentes = Array.from(doc.querySelectorAll('.jusgov-dialog-input-rapido'));
            if (docTop !== doc) {
                try {
                    const topExistentes = Array.from(docTop.querySelectorAll('.jusgov-dialog-input-rapido'));
                    for (const el of topExistentes) {
                        if (!todosExistentes.includes(el)) todosExistentes.push(el);
                    }
                } catch (_) { }
            }

            if (todosExistentes.length > 1) {
                for (let i = 1; i < todosExistentes.length; i++) {
                    try { todosExistentes[i].remove(); } catch (_) { }
                }
            }

            const elExistenteNoDom = todosExistentes[0] || null;
            if (this.isAberta || elExistenteNoDom) {
                if (elExistenteNoDom) {
                    this.#elementoDialogo = elExistenteNoDom;
                }
                if (this.#elementoDialogo) {
                    const inpExistente = this.#elementoDialogo.querySelector('input');
                    if (inpExistente) {
                        inpExistente.focus();
                        inpExistente.select();
                    }
                }
                return;
            }

            // 1. Criar container do diálogo flutuante
            const dialog = doc.createElement('div');
            dialog.className = 'jusgov-dialog-input-rapido';
            dialog.setAttribute('data-jusgov-ignore', 'true');
            dialog.style.cssText = [
                'position: fixed',
                'z-index: 2147483646',
                'width: 390px',
                'background: #ffffff',
                'border: 1px solid #94a3b8',
                'border-radius: 8px',
                'box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28)',
                'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                'box-sizing: border-box',
                'user-select: none',
                'overflow: hidden',
                'display: flex',
                'flex-direction: column',
                'transition: box-shadow 0.2s ease'
            ].join('; ');

            // 2. Barra de Título arrastável
            const header = doc.createElement('div');
            header.className = 'jusgov-dialog-header';
            header.style.cssText = [
                'background: #0f172a',
                'color: #f8fafc',
                'padding: 8px 12px',
                'display: flex',
                'justify-content: space-between',
                'align-items: center',
                'cursor: move',
                'font-size: 13px',
                'font-weight: 600',
                'letter-spacing: 0.3px',
                'border-bottom: 1px solid #1e293b'
            ].join('; ');

            const titulo = doc.createElement('span');
            titulo.textContent = 'Entrada Rápida de Texto (Ins+Ins)';
            header.appendChild(titulo);

            const btnFechar = doc.createElement('button');
            btnFechar.type = 'button';
            btnFechar.innerHTML = '&times;';
            btnFechar.title = 'Fechar (Esc)';
            btnFechar.style.cssText = [
                'background: transparent',
                'border: none',
                'color: #94a3b8',
                'font-size: 18px',
                'font-weight: bold',
                'cursor: pointer',
                'padding: 0 4px',
                'line-height: 1',
                'outline: none',
                'transition: color 0.15s ease'
            ].join('; ');
            btnFechar.onmouseover = () => { btnFechar.style.color = '#ef4444'; };
            btnFechar.onmouseout = () => { btnFechar.style.color = '#94a3b8'; };
            btnFechar.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.fecharCaixa();
            };
            header.appendChild(btnFechar);
            dialog.appendChild(header);

            // 3. Corpo com Campo de Digitação
            const body = doc.createElement('div');
            body.style.cssText = 'padding: 12px; background: #ffffff; display: flex; flex-direction: column; gap: 8px;';

            const labelDica = doc.createElement('div');
            labelDica.textContent = 'Digite ou cole manualmente para enviar à Área de Transferência:';
            labelDica.style.cssText = 'font-size: 11px; color: #64748b; line-height: 1.3; font-weight: 500;';
            body.appendChild(labelDica);

            const inputTexto = doc.createElement('input');
            inputTexto.type = 'text';
            inputTexto.className = 'jusgov-input-rapido-campo';
            inputTexto.placeholder = 'Ex.: 1015306-38.2026.4.01.4002, 19/10/2026...';
            inputTexto.value = this.#ultimoTextoDigitado || '';
            inputTexto.style.cssText = [
                'width: 100%',
                'box-sizing: border-box',
                'padding: 8px 10px',
                'font-size: 14px',
                'color: #0f172a',
                'background: #f8fafc',
                'border: 1.5px solid #cbd5e1',
                'border-radius: 6px',
                'outline: none',
                'user-select: text',
                'transition: border-color 0.15s ease, background-color 0.15s ease'
            ].join('; ');
            inputTexto.onfocus = () => {
                inputTexto.style.borderColor = '#2563eb';
                inputTexto.style.backgroundColor = '#ffffff';
            };
            inputTexto.onblur = () => {
                inputTexto.style.borderColor = '#cbd5e1';
                inputTexto.style.backgroundColor = '#f8fafc';
            };
            body.appendChild(inputTexto);

            // 4. Rodapé com Botões de Ação
            const footer = doc.createElement('div');
            footer.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;';

            const btnCancelar = doc.createElement('button');
            btnCancelar.type = 'button';
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.style.cssText = [
                'background: #f1f5f9',
                'color: #475569',
                'border: 1px solid #cbd5e1',
                'border-radius: 5px',
                'padding: 6px 14px',
                'font-size: 12px',
                'font-weight: 600',
                'cursor: pointer',
                'outline: none',
                'transition: background-color 0.15s ease'
            ].join('; ');
            btnCancelar.onmouseover = () => { btnCancelar.style.backgroundColor = '#e2e8f0'; };
            btnCancelar.onmouseout = () => { btnCancelar.style.backgroundColor = '#f1f5f9'; };
            btnCancelar.onclick = () => this.fecharCaixa();
            footer.appendChild(btnCancelar);

            const btnConfirmar = doc.createElement('button');
            btnConfirmar.type = 'button';
            btnConfirmar.textContent = 'Copiar (Enter)';
            btnConfirmar.style.cssText = [
                'background: #2563eb',
                'color: #ffffff',
                'border: 1px solid #1d4ed8',
                'border-radius: 5px',
                'padding: 6px 16px',
                'font-size: 12px',
                'font-weight: 600',
                'cursor: pointer',
                'outline: none',
                'box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3)',
                'transition: background-color 0.15s ease'
            ].join('; ');
            btnConfirmar.onmouseover = () => { btnConfirmar.style.backgroundColor = '#1d4ed8'; };
            btnConfirmar.onmouseout = () => { btnConfirmar.style.backgroundColor = '#2563eb'; };
            btnConfirmar.onclick = () => this.confirmar();
            footer.appendChild(btnConfirmar);

            body.appendChild(footer);
            dialog.appendChild(body);

            // 5. Interceptação de Teclado no Diálogo (Enter / Escape)
            dialog.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.confirmar();
                } else if (ev.key === 'Escape') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.fecharCaixa();
                }
            }, { capture: true });

            // 6. Arrastabilidade (Draggable) via Header
            this.#configurarArrastabilidade(header, dialog);

            // 7. Inserir no DOM
            doc.body.appendChild(dialog);
            this.#elementoDialogo = dialog;

            // 8. Posicionamento inteligente (Proxi-Mouse com clamp ou centro da tela)
            this.#posicionarDialogo(dialog, posicaoCustomizada);

            // 9. Foco e seleção inicial
            setTimeout(() => {
                try {
                    inputTexto.focus();
                    if (inputTexto.value) {
                        inputTexto.select();
                    }
                } catch (_) {}
            }, 30);
        }

        /**
         * Posiciona a caixa flutuante perto do mouse ou centralizada na viewport
         * @param {HTMLElement} dialog
         * @param {Object} [posCustom=null]
         */
        #posicionarDialogo(dialog, posCustom = null) {
            const vw = Math.max(window.innerWidth || 0, document.documentElement ? document.documentElement.clientWidth : 0, 400);
            const vh = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, 300);
            const largura = 390;
            const altura = 160;

            let targetX;
            let targetY;

            if (posCustom && typeof posCustom.x === 'number' && typeof posCustom.y === 'number') {
                targetX = posCustom.x;
                targetY = posCustom.y;
            } else if (this.#posicaoMouse.x > 0 && this.#posicaoMouse.y > 0 && this.#posicaoMouse.x <= vw && this.#posicaoMouse.y <= vh) {
                // Proxi-Mouse: logo abaixo do cursor
                targetX = this.#posicaoMouse.x - 20;
                targetY = this.#posicaoMouse.y + 16;
            } else {
                // Fallback: Centro da viewport
                targetX = Math.round((vw - largura) / 2);
                targetY = Math.round((vh - altura) / 2);
            }

            // Clamp lateral e vertical
            const finalX = Math.max(10, Math.min(targetX, vw - largura - 10));
            const finalY = Math.max(10, Math.min(targetY, vh - altura - 10));

            dialog.style.left = `${Math.round(finalX)}px`;
            dialog.style.top = `${Math.round(finalY)}px`;
        }

        /**
         * Configura o comportamento de arrastar (drag and drop) na barra de título
         * @param {HTMLElement} header
         * @param {HTMLElement} dialog
         */
        #configurarArrastabilidade(header, dialog) {
            const doc = typeof document !== 'undefined' ? document : null;
            if (!doc) return;

            header.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                if (e.target && e.target.tagName === 'BUTTON') return;

                this.#emArrasto = true;
                const rect = dialog.getBoundingClientRect();
                this.#arrastoOffset.x = e.clientX - rect.left;
                this.#arrastoOffset.y = e.clientY - rect.top;

                if (this.#abortControllerArrasto) {
                    this.#abortControllerArrasto.abort();
                }
                this.#abortControllerArrasto = new AbortController();
                const signal = this.#abortControllerArrasto.signal;

                const aoMover = (ev) => {
                    if (!this.#emArrasto) return;
                    ev.preventDefault();
                    const vw = Math.max(window.innerWidth || 0, 400);
                    const vh = Math.max(window.innerHeight || 0, 300);
                    const novaX = ev.clientX - this.#arrastoOffset.x;
                    const novaY = ev.clientY - this.#arrastoOffset.y;
                    const clampX = Math.max(6, Math.min(novaX, vw - dialog.offsetWidth - 6));
                    const clampY = Math.max(6, Math.min(novaY, vh - dialog.offsetHeight - 6));
                    dialog.style.left = `${Math.round(clampX)}px`;
                    dialog.style.top = `${Math.round(clampY)}px`;
                };

                const aoSoltar = () => {
                    this.#emArrasto = false;
                    if (this.#abortControllerArrasto) {
                        this.#abortControllerArrasto.abort();
                        this.#abortControllerArrasto = null;
                    }
                };

                window.addEventListener('mousemove', aoMover, { capture: true, signal });
                window.addEventListener('mouseup', aoSoltar, { capture: true, signal });
            });
        }

        /**
         * Confirma o texto digitado, gravando no Clipboard e disparando aviso visual
         */
        confirmar() {
            if (!this.isAberta) return;

            const input = this.#elementoDialogo.querySelector('input');
            const textoBruto = input ? input.value : '';
            const textoLimpo = textoBruto.trim();

            if (textoLimpo.length > 0) {
                this.#ultimoTextoDigitado = textoLimpo;

                // 1. Salvar nos slots internos com backup (Slot 1 atual, Slot 2 anterior) - BLIND-01 (Seção 6.104)
                let salvouInterno = true;
                try {
                    if (typeof window !== 'undefined') {
                        if (window.JusGovMotorSelecaoTeste && typeof window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup === 'function') {
                            salvouInterno = Boolean(window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup({ texto: textoLimpo, html: '', formatado: false }));
                        } else {
                            const payload = { texto: textoLimpo, html: '', formatado: false, timestamp: Date.now() };
                            if (window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto !== textoLimpo) {
                                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                            }
                            window.__JUSGOV_ULTIMO_CLIPBOARD__ = payload;
                            window.__JUSGOV_HISTORICO_CLIPBOARD__ = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__
                                ? [window.__JUSGOV_ULTIMO_CLIPBOARD__, window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__]
                                : [window.__JUSGOV_ULTIMO_CLIPBOARD__];
                        }
                    }
                } catch (_) {
                    salvouInterno = false;
                }

                // 2. Gravar no Clipboard do sistema operacional apenas se gravação interna foi bem-sucedida (BLIND-01)
                if (salvouInterno) {
                    try {
                        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                            navigator.clipboard.writeText(textoLimpo).catch(() => {});
                        }
                    } catch (_) {}
                }

                // 3. Disparar Mini-Tip visual de confirmação proxi-mouse
                try {
                    if (typeof window !== 'undefined' && window.JusGovAvisoFlutuanteInstancia && typeof window.JusGovAvisoFlutuanteInstancia.projetarMiniTipGlobal === 'function') {
                        window.JusGovAvisoFlutuanteInstancia.projetarMiniTipGlobal(`Copiado: ${textoLimpo.substring(0, 36)}${textoLimpo.length > 36 ? '...' : ''}`, '#22c55e', 2500);
                    }
                } catch (_) {}
            }

            this.fecharCaixa();
        }

        /**
         * Fecha e remove a caixa do DOM
         */
        fecharCaixa() {
            if (this.#abortControllerArrasto) {
                this.#abortControllerArrasto.abort();
                this.#abortControllerArrasto = null;
            }
            if (this.#elementoDialogo) {
                try {
                    this.#elementoDialogo.remove();
                } catch (_) {}
                this.#elementoDialogo = null;
            }
            this.#emArrasto = false;
        }
    }

    Object.freeze(CaixaEntradaRapida.prototype);
    return Object.freeze(CaixaEntradaRapida);
}));
