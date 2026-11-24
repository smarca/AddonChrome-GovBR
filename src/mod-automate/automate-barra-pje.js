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
         * Abre diretamente o dialogo `Parametros` (`DialogoCFG`), persiste as configuracoes e inicia o monitoramento
         * quando o usuario confirma com `Automatizar` ou `Silente`.
         * @returns {Promise<Object>}
         */
        async abrirDialogoConfiguracao() {
            // Ao chamar Config, para automaticamente qualquer execucao/monitoramento ativo
            if (this.monitorAtivo || (this.motorFluxo && this.motorFluxo.emExecucao)) {
                if (typeof this.pararMonitorAutomacao === 'function') {
                    this.pararMonitorAutomacao();
                }
                this.abortarExecucao();
                this._statusBarraTexto = 'Parado';
                this._statusBarraDetalhe = 'Pausado para configuração';
                this.renderizarOuRemoverBarraControlePje(true);
            }
            await this.carregarDadosDeclarativos();
            if (!this.motorFluxo) {
                return { confirmado: false, motivo: 'MOTOR_INDISPONIVEL' };
            }
            await this._carregarParametrosStorage();
            const res = await this.motorFluxo.dialogoCfg();
            if (res && res.confirmado) {
                this._persistirParametrosStorage();
                if (Array.isArray(this.dadosAutomate && this.dadosAutomate.contextosAutomacao)) {
                    this._persistirOverridesContextosStorage();
                }
                const modoEscolhido = res.modoBotao === 'Silente'
                    ? 'Silente'
                    : String(this.motorFluxo.obterVariavel('v_CFGSelecionar', 'Sequencial'));
                // Ao confirmar Config (Automatizar/Silente), da play automatico
                if (typeof this.iniciarMonitorAutomacao === 'function') {
                    this.iniciarMonitorAutomacao(modoEscolhido);
                }
                this._statusBarraTexto = modoEscolhido === 'Silente' ? 'Silente ●' : `${modoEscolhido} ●`;
                this._statusBarraDetalhe = `Modo ativo: ${modoEscolhido} — aguardando seleção de novo processo`;
                this.renderizarOuRemoverBarraControlePje(true);
            }
            return res;
        }

        /**
         * Carrega os parametros salvos de `Parametros` (`v_CFG*`) do chrome.storage.local para o motorFluxo.
         * @private
         */
        async _carregarParametrosStorage() {
            if (!this.motorFluxo || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
            try {
                const res = await chrome.storage.local.get(['jusgovAutomateParametrosCfg']);
                const salvo = res && res.jusgovAutomateParametrosCfg;
                if (salvo && typeof salvo === 'object') {
                    this.motorFluxo.importarEstadoVariaveis(salvo, false);
                }
            } catch (_) { }
        }

        /**
         * Persiste os parametros atuais (`v_CFG*`, `v_EtiquetaExcluirTp*`, `v_IncluirEtiqueta`) em chrome.storage.local.
         * @private
         */
        _persistirParametrosStorage() {
            if (!this.motorFluxo || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
            const chaves = [
                'v_CFGSelecionar', 'v_CFGPrimeiroPlano', 'v_CFGMarcarLidosDocsAutos', 'v_CFGPrazosEmAbertoVerf',
                'v_CFGEtiquetaEntrada', 'v_CFGEtiquetaSaida', 'v_CFGEtiquetaControleExcludente',
                'v_CFGEtqtListaRemoverTp0Txt', 'v_CFGEtqtListaRemoverTp1Lista', 'v_CFGEtqtListaRemoverTp2Lista',
                'v_CFGEtqtListaRemoverTp3Lista', 'v_CFGEtqtListaIncluir1', 'v_CFGEtqtListaIncluir2',
                'v_EtiquetaEntrada', 'v_EtiquetaSaida', 'v_EtiquetaExcluirTp0', 'v_EtiquetaExcluirTp1',
                'v_EtiquetaExcluirTp2', 'v_EtiquetaExcluirTp3', 'v_IncluirEtiqueta'
            ];
            const dadosSalvar = {};
            for (let i = 0; i < chaves.length; i++) {
                const k = chaves[i];
                const val = this.motorFluxo.obterVariavel(k);
                if (val !== undefined) dadosSalvar[k] = val;
            }
            try {
                chrome.storage.local.set({ jusgovAutomateParametrosCfg: dadosSalvar }).catch(() => { });
            } catch (_) { }
        }

        /**
         * Atualiza o texto de status exibido na barra flutuante inferior, se ela estiver renderizada.
         * @param {string} texto
         */
        atualizarStatusBarra(textoOuObj, detalhe = '') {
            if (textoOuObj && typeof textoOuObj === 'object') {
                if (textoOuObj.status !== undefined && textoOuObj.status !== '') {
                    this._statusPrincipal = String(textoOuObj.status);
                }
                if (textoOuObj.substatus !== undefined) {
                    this._substatus = String(textoOuObj.substatus || '');
                }
                if (textoOuObj.detalhe !== undefined && textoOuObj.detalhe !== '') {
                    this._statusBarraDetalhe = String(textoOuObj.detalhe);
                }
                const p = String(this._statusPrincipal || '').trim();
                const sub = String(this._substatus || '').trim();
                this._statusBarraTexto = (p && sub) ? `${p} · ${sub}` : (p || sub || 'Pronto');
            } else {
                const txt = String(textoOuObj || 'Pronto');
                this._statusPrincipal = txt;
                this._substatus = '';
                this._statusBarraTexto = txt;
                if (detalhe) {
                    this._statusBarraDetalhe = String(detalhe);
                }
            }
            const doc = this.documentoRaiz || (typeof document !== 'undefined' ? document : null);
            if (!doc) return;
            const st = doc.getElementById('jusgov-automate-status-txt');
            if (st) {
                st.textContent = this._statusBarraTexto;
                st.title = this._statusBarraDetalhe || this._statusBarraTexto;
            }
            const minTxt = doc.getElementById('jusgov-automate-min-status');
            if (minTxt) {
                minTxt.textContent = `${this._statusBarraTexto} ▴`;
                minTxt.title = this._statusBarraDetalhe || this._statusBarraTexto;
            }
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
            const emExecucaoAgora = Boolean(this.monitorAtivo || (this.motorFluxo && this.motorFluxo.emExecucao));
            if (emExecucaoAgora) {
                this.fechadaNaAba = false;
            }
            if ((!this.estaEfetivamenteAtivoNaUrl() && !emExecucaoAgora) || !emJanelaTopo || (this.fechadaNaAba && !emExecucaoAgora)) {
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

            const textoStatusAtual = String(this._statusBarraTexto || (this.monitorAtivo ? `${this.modoMonitor || 'Ativo'} ●` : 'Pronto'));
            const detalheStatusAtual = String(this._statusBarraDetalhe || '');
            const tipStatusMin = detalheStatusAtual
                ? `${textoStatusAtual}\n${detalheStatusAtual}\nClique para expandir ou arraste na borda inferior`
                : `${textoStatusAtual} (${contextoAtual.nome || 'Navegador'})\nClique para expandir ou arraste na borda inferior`;

            if (this.minimizado) {
                const spanRest = doc.createElement('span');
                spanRest.id = 'jusgov-automate-min-txt';
                spanRest.setAttribute('data-jusgov-ignore', 'true');
                spanRest.title = tipStatusMin;
                spanRest.style.cssText = 'font-weight:700;font-size:10px;color:#2dd4bf;padding:0 3px;cursor:pointer;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
                spanRest.textContent = `${textoStatusAtual} ▴`;
                barra.appendChild(spanRest);

                const btnFecharMin = criarMicroBtn('×', 'transparent', '#fca5a5', 'Fechar barra nesta aba', () => {
                    this.fechadaNaAba = true;
                    this.abortarExecucao();
                    this.renderizarOuRemoverBarraControlePje(true);
                });
                btnFecharMin.style.setProperty('padding', '0 3px', 'important');
                if (!emExecucaoAgora) barra.appendChild(btnFecharMin);
            } else {
                const titulo = doc.createElement('span');
                titulo.setAttribute('data-jusgov-ignore', 'true');
                titulo.title = `Automação de Tarefas (${contextoAtual.nome || 'Navegador'}) — arraste horizontalmente pela borda inferior`;
                titulo.style.cssText = 'font-weight:700;font-size:10px;color:#2dd4bf;padding:0 2px;cursor:ew-resize;';
                titulo.textContent = ehSubcontextoPje ? '⚡ Tarefas·PJe' : '⚡ Tarefas';

                const statusTxt = doc.createElement('span');
                statusTxt.id = 'jusgov-automate-status-txt';
                statusTxt.setAttribute('data-jusgov-ignore', 'true');
                statusTxt.style.cssText = 'font-size:9.5px;color:#cbd5e1;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px;';
                statusTxt.textContent = textoStatusAtual;
                statusTxt.title = detalheStatusAtual ? `${textoStatusAtual} — ${detalheStatusAtual}` : textoStatusAtual;

                const btnExecutar = criarMicroBtn(
                    '▶ Exec',
                    '#0d9488',
                    '#ffffff',
                    'Iniciar automação com os parâmetros configurados',
                    async () => {
                        await this.carregarDadosDeclarativos();
                        await this._carregarParametrosStorage();
                        const modoSalvo = this.motorFluxo
                            ? String(this.motorFluxo.obterVariavel('v_CFGSelecionar', 'Silente'))
                            : 'Silente';
                        if (typeof this.iniciarMonitorAutomacao === 'function') {
                            this.iniciarMonitorAutomacao(modoSalvo);
                        }
                        this._statusBarraTexto = modoSalvo === 'Silente' ? 'Silente ●' : `${modoSalvo} ●`;
                        this._statusBarraDetalhe = `Modo ativo: ${modoSalvo} — aguardando seleção de novo processo`;
                        this.renderizarOuRemoverBarraControlePje(true);
                    }
                );

                const btnConfig = criarMicroBtn(
                    '⚙ Cfg',
                    '#2563eb',
                    '#ffffff',
                    'Abrir tela de Parâmetros da Automação PJe',
                    async () => {
                        await this.abrirDialogoConfiguracao();
                    }
                );

                const btnParar = criarMicroBtn(
                    '■ Parar',
                    '#dc2626',
                    '#ffffff',
                    'Interromper imediatamente a automação em andamento',
                    () => {
                        if (typeof this.pararMonitorAutomacao === 'function') {
                            this.pararMonitorAutomacao();
                        }
                        this.abortarExecucao();
                        this._statusBarraTexto = 'Parado';
                        this._statusBarraDetalhe = 'Automação interrompida pelo usuário';
                        this.renderizarOuRemoverBarraControlePje(true);
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
                if (this.monitorAtivo) {
                    barra.appendChild(btnParar);
                } else {
                    barra.appendChild(btnExecutar);
                    barra.appendChild(btnConfig);
                }
                barra.appendChild(statusTxt);
                barra.appendChild(btnMin);
                if (!emExecucaoAgora) barra.appendChild(btnFechar);
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
            let mouseSobreBarra = false;
            let timerAutoMin = null;

            const cancelarAutoMin = () => {
                if (timerAutoMin) {
                    clearTimeout(timerAutoMin);
                    timerAutoMin = null;
                }
            };

            const agendarAutoMin = () => {
                cancelarAutoMin();
                if (this.minimizado) return;
                timerAutoMin = setTimeout(() => {
                    timerAutoMin = null;
                    if (!barra.isConnected || this.minimizado || arrastando || mouseSobreBarra) return;
                    this.minimizado = true;
                    this.renderizarOuRemoverBarraControlePje(true);
                }, 5000);
            };

            const aoMouseEnter = () => {
                mouseSobreBarra = true;
                cancelarAutoMin();
            };

            const aoMouseLeave = () => {
                mouseSobreBarra = false;
                agendarAutoMin();
            };

            barra.addEventListener('mousedown', aoMouseDown);
            barra.addEventListener('mouseenter', aoMouseEnter);
            barra.addEventListener('mouseleave', aoMouseLeave);
            doc.addEventListener('mousemove', aoMouseMove, { passive: true });
            doc.addEventListener('mouseup', aoMouseUp);
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', aoResize);
            }
            if (!this.minimizado) {
                agendarAutoMin();
            }

            this._limparOuvintesBarra = () => {
                cancelarAutoMin();
                barra.removeEventListener('mousedown', aoMouseDown);
                barra.removeEventListener('mouseenter', aoMouseEnter);
                barra.removeEventListener('mouseleave', aoMouseLeave);
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

            if (acao === 'AUTOMATE_MARCAR_LIDOS_E_FECHAR_AUTOS_ANTERIORES') {
                if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
                    sendResponse({ sucesso: false, marcadasComoLidas: 0, fechadas: 0 });
                    return false;
                }
                const cnjAtual = String(request.cnjAtual || '').trim();
                const cnjAnterior = String(request.cnjAnterior || '').trim();
                const marcarLidos = request.marcarLidos !== false;
                const rxCnj = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;

                (async () => {
                    try {
                        const abas = await chrome.tabs.query({});
                        const abasAnteriores = (abas || []).filter((aba) => {
                            if (!aba || !aba.id) return false;
                            const url = String(aba.url || '');
                            const titulo = String(aba.title || '');
                            if (!url.includes('listAutosDigitais.seam')) return false;
                            if (cnjAtual && (titulo.includes(cnjAtual) || url.includes(cnjAtual))) return false;
                            if (cnjAnterior && (titulo.includes(cnjAnterior) || url.includes(cnjAnterior))) return true;
                            const mTit = titulo.match(rxCnj);
                            if (mTit && mTit[0] && mTit[0] !== cnjAtual) return true;
                            return false;
                        });

                        let marcadasComoLidas = 0;
                        let fechadas = 0;

                        for (let i = 0; i < abasAnteriores.length; i++) {
                            const abaAnt = abasAnteriores[i];
                            let clicouMarcar = false;
                            if (marcarLidos && chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
                                try {
                                    const resExec = await chrome.scripting.executeScript({
                                        target: { tabId: abaAnt.id },
                                        func: () => {
                                            const seletores = [
                                                ".panel-doc-nao-lido input[value='Marcar todos como lidos']",
                                                ".panel-doc-nao-lido input[value*='Marcar todos' i]",
                                                ".panel-doc-nao-lido input[type='button']",
                                                "input[value='Marcar todos como lidos']",
                                                "button[title*='Marcar todos como lidos' i]"
                                            ];
                                            for (let k = 0; k < seletores.length; k++) {
                                                const btn = document.querySelector(seletores[k]);
                                                if (btn && btn.offsetParent !== null && !btn.disabled) {
                                                    btn.click();
                                                    return true;
                                                }
                                            }
                                            return false;
                                        }
                                    });
                                    if (Array.isArray(resExec) && resExec[0] && resExec[0].result === true) {
                                        clicouMarcar = true;
                                        marcadasComoLidas++;
                                    }
                                } catch (_) { }
                            }
                            if (clicouMarcar) {
                                await new Promise((r) => setTimeout(r, 750));
                            }
                            try {
                                await chrome.tabs.remove(abaAnt.id);
                                fechadas++;
                            } catch (_) { }
                        }

                        sendResponse({ sucesso: true, marcadasComoLidas, fechadas });
                    } catch (err) {
                        sendResponse({ sucesso: false, erro: String(err), marcadasComoLidas: 0, fechadas: 0 });
                    }
                })();
                return true;
            }

            if (acao === 'AUTOMATE_EXECUTAR_EM_ABAS') {
                if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
                    sendResponse({ sucesso: false, correspondencias: 0, acoesExecutadas: 0, fechadas: 0, abas: [] });
                    return false;
                }
                const padraoUrl = String(request.padraoUrl || '').trim();
                const seletoresVerificar = Array.isArray(request.seletoresVerificar) ? request.seletoresVerificar : [];
                const regexExtrair = String(request.regexExtrair || '');
                const textoEsperado = String(request.textoEsperado || '').trim();
                const modoMatch = String(request.modoMatch || 'igual').toLowerCase();
                const acaoNaAba = String(request.acaoNaAba || 'verificar').toLowerCase();
                const seletoresAcao = Array.isArray(request.seletoresAcao) ? request.seletoresAcao : [];
                const executarAcao = request.executarAcao !== false;
                const delayAposAcaoMs = Number(request.delayAposAcaoMs) || 0;
                const textoPreencher = String(request.textoPreencher || '');

                (async () => {
                    try {
                        const abas = await chrome.tabs.query({});
                        const candidatas = (abas || []).filter((aba) => {
                            if (!aba || !aba.id) return false;
                            const url = String(aba.url || '');
                            if (!padraoUrl) return true;
                            return url.includes(padraoUrl);
                        });

                        const abasCorrespondentes = [];
                        let acoesExecutadas = 0;
                        let fechadas = 0;

                        for (let i = 0; i < candidatas.length; i++) {
                            const aba = candidatas[i];
                            let textoExtraido = '';
                            let corresponde = false;

                            if (chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
                                try {
                                    const resLeitura = await chrome.scripting.executeScript({
                                        target: { tabId: aba.id },
                                        args: [seletoresVerificar, regexExtrair],
                                        func: (sels, rxStr) => {
                                            let bruto = '';
                                            for (let k = 0; k < sels.length; k++) {
                                                const item = sels[k];
                                                if (!item || !item.expressao) continue;
                                                try {
                                                    let el = null;
                                                    if (String(item.tipo || 'css').toLowerCase() === 'xpath') {
                                                        el = document.evaluate(item.expressao, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    } else {
                                                        el = document.querySelector(item.expressao);
                                                    }
                                                    if (el) {
                                                        const t = String(el.textContent || el.innerText || el.value || '').trim();
                                                        if (t) { bruto = t; break; }
                                                    }
                                                } catch (_) { }
                                            }
                                            if (!bruto) {
                                                bruto = String(document.title || '');
                                            }
                                            if (rxStr) {
                                                try {
                                                    const m = bruto.match(new RegExp(rxStr));
                                                    if (m) return String(m[1] || m[0] || '').trim();
                                                } catch (_) { }
                                            }
                                            return bruto.trim();
                                        }
                                    });
                                    if (Array.isArray(resLeitura) && resLeitura[0] && typeof resLeitura[0].result === 'string') {
                                        textoExtraido = resLeitura[0].result;
                                    }
                                } catch (_) { }
                            }

                            if (!textoExtraido) {
                                const tit = String(aba.title || '');
                                if (regexExtrair) {
                                    try {
                                        const m = tit.match(new RegExp(regexExtrair));
                                        textoExtraido = m ? String(m[1] || m[0] || '').trim() : tit;
                                    } catch (_) { textoExtraido = tit; }
                                } else {
                                    textoExtraido = tit;
                                }
                            }

                            if (!textoEsperado) {
                                corresponde = true;
                            } else if (modoMatch === 'diferente') {
                                corresponde = Boolean(textoExtraido && textoExtraido !== textoEsperado);
                            } else if (modoMatch === 'contem') {
                                corresponde = textoExtraido.toLowerCase().includes(textoEsperado.toLowerCase());
                            } else {
                                corresponde = textoExtraido === textoEsperado || textoExtraido.includes(textoEsperado);
                            }

                            if (!corresponde) continue;

                            abasCorrespondentes.push({ id: aba.id, url: aba.url, title: aba.title, textoExtraido });

                            if (acaoNaAba === 'clicar' || acaoNaAba === 'clicar_e_fechar') {
                                let clicou = false;
                                if (executarAcao && seletoresAcao.length > 0 && chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
                                    try {
                                        const resClique = await chrome.scripting.executeScript({
                                            target: { tabId: aba.id },
                                            args: [seletoresAcao],
                                            func: (sels) => {
                                                for (let k = 0; k < sels.length; k++) {
                                                    const item = sels[k];
                                                    if (!item || !item.expressao) continue;
                                                    try {
                                                        let el = null;
                                                        if (String(item.tipo || 'css').toLowerCase() === 'xpath') {
                                                            el = document.evaluate(item.expressao, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        } else {
                                                            el = document.querySelector(item.expressao);
                                                        }
                                                        if (el && el.offsetParent !== null && !el.disabled) {
                                                            el.click();
                                                            return true;
                                                        }
                                                    } catch (_) { }
                                                }
                                                return false;
                                            }
                                        });
                                        if (Array.isArray(resClique) && resClique[0] && resClique[0].result === true) {
                                            clicou = true;
                                            acoesExecutadas++;
                                        }
                                    } catch (_) { }
                                }
                                if (clicou && delayAposAcaoMs > 0) {
                                    await new Promise((r) => setTimeout(r, delayAposAcaoMs));
                                }
                            }

                            if (acaoNaAba === 'preencher') {
                                if (executarAcao && seletoresAcao.length > 0 && chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
                                    try {
                                        const resPre = await chrome.scripting.executeScript({
                                            target: { tabId: aba.id },
                                            args: [seletoresAcao, textoPreencher],
                                            func: (sels, valTxt) => {
                                                for (let k = 0; k < sels.length; k++) {
                                                    const item = sels[k];
                                                    if (!item || !item.expressao) continue;
                                                    try {
                                                        let el = null;
                                                        if (String(item.tipo || 'css').toLowerCase() === 'xpath') {
                                                            el = document.evaluate(item.expressao, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        } else {
                                                            el = document.querySelector(item.expressao);
                                                        }
                                                        if (el && !el.disabled) {
                                                            el.value = valTxt;
                                                            el.dispatchEvent(new Event('input', { bubbles: true }));
                                                            el.dispatchEvent(new Event('change', { bubbles: true }));
                                                            return true;
                                                        }
                                                    } catch (_) { }
                                                }
                                                return false;
                                            }
                                        });
                                        if (Array.isArray(resPre) && resPre[0] && resPre[0].result === true) {
                                            acoesExecutadas++;
                                        }
                                    } catch (_) { }
                                }
                            }

                            if (acaoNaAba === 'fechar' || acaoNaAba === 'clicar_e_fechar') {
                                try {
                                    await chrome.tabs.remove(aba.id);
                                    fechadas++;
                                } catch (_) { }
                            }
                        }

                        sendResponse({
                            sucesso: true,
                            correspondencias: abasCorrespondentes.length,
                            acoesExecutadas,
                            fechadas,
                            abas: abasCorrespondentes
                        });
                    } catch (err) {
                        sendResponse({ sucesso: false, erro: String(err), correspondencias: 0, acoesExecutadas: 0, fechadas: 0, abas: [] });
                    }
                })();
                return true;
            }

            if (acao === 'AUTOMATE_BROADCAST_ABA') {
                const tabId = (sender && sender.tab && sender.tab.id) || Number(request.tabId);
                if (!tabId || !request.subAcao || typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.sendMessage !== 'function') {
                    sendResponse({ sucesso: false });
                    return false;
                }
                const msgRepasse = Object.assign({}, request.payload || {}, { acao: request.subAcao });
                chrome.tabs.sendMessage(tabId, msgRepasse, () => {
                    const err = chrome.runtime.lastError;
                    sendResponse({ sucesso: !err, erro: err ? err.message : undefined });
                });
                return true;
            }

            return false;
        }
    }

    Object.freeze(AutomateBarraPje.prototype);
    return Object.freeze(AutomateBarraPje);
}));
