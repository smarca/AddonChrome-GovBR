/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-barra-pje.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Automate — Barra Flutuante de Controle PJe e Persistência de Contextos
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-barra-pje.js
 * - Classe Exportada: AutomateBarraPje (self.JusGovAutomateBarraPje) extends BaseModulo
 * - Métodos Públicos: abrirDialogoConfiguracao, _persistirOverridesContextosStorage, renderizarOuRemoverBarraControlePje, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovAutomateBarraPje = fabrica(raiz);
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

    class AutomateBarraPje extends Base {
        constructor() {
            super('AutomateBarraPje');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(AutomateBarraPje.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(AutomateBarraPje.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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

    Object.freeze(AutomateBarraPje.prototype);
    return Object.freeze(AutomateBarraPje);
}));
