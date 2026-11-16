/* ==========================================================================
 * Nome do arquivo: options-laboratorio.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Configurações & Interface — Laboratório Interativo, Console e Auditoria V8
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/options-laboratorio.js
 * - Classe Exportada: OptionsLaboratorio (window.JusGovOptionsLaboratorio)
 * - Métodos Públicos: instalarInterceptadorConsole(), inicializar(deps),
 *   registrarMensagemDireta(nivel, msg), atualizarCoresEBotoesClipboard(),
 *   atualizarVisualAtencaoSwitches(), atualizarVisorClipboardPassivo(),
 *   acionarLeituraClipboardComPrompt(ev), obterEstadoPermissaoClipboard(),
 *   estaLendoManualmente()
 * - Elementos DOM: previewAreaTransferencia, previewAreaTransferenciaAnterior,
 *   btnAtualizarPreview, btnDownloadXMouse, btnExecutarAuditoriaDebug,
 *   btnExecutarFuzzingDebug, painelResultadoAuditoria, btnLimparConsole,
 *   visorMensagensConsole, lblContadorConsole, barraProgressoConsole,
 *   preenchimentoProgressoConsole, abaLaboratorio, lblSwitchColarBotaoMeio
 * - Regras / Seções: ADR-002 (Visor passivo de 2 slots sem readText), Seção 6.65,
 *   Seção 6.87 (FEATS 10: ↵ e ¶), Seção 6.120 (2 níveis), BUG-31 (limpeza imediata),
 *   Diretriz Root 3 (Log >= WARN), Diretriz 16 (SRP + DIP)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) INTERCEPTAÇÃO SEGURA DO CONSOLE: Mantém buffer circular (máx 250 linhas)
 *    filtrando saída das baterias de debug e exibindo apenas nível >= WARN.
 * 2) VISOR PASSIVO SLOT 1 + SLOT 2: Nunca chama navigator.clipboard.readText();
 *    lê exclusivamente window.__JUSGOV_ULTIMO_CLIPBOARD__ e __ANTERIOR__.
 * 3) AUDITORIA E FUZZING: Limpa painel antes de rodar, exibe barra de progresso
 *    e formata tokens [OK]/[FALHA]/[ERRO]/[AVISO] sem injetar HTML bruto.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovOptionsLaboratorio = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PRIORIDADES_LOG = Object.freeze({
        TRACE: 10,
        DEBUG: 20,
        INFO: 30,
        WARN: 40,
        ERROR: 50,
        FATAL: 60
    });

    class OptionsLaboratorio {
        #historicoConsole = [];
        #nivelMinimoLog = PRIORIDADES_LOG.WARN;
        #interceptadorInstalado = false;
        #inicializado = false;
        #leituraManualEmAndamento = false;
        #deps = {
            adicionarOuvinteSeguro: (el, ev, fn) => { if (el) el.addEventListener(ev, fn); },
            exibirToast: () => { }
        };

        #previewSlot1 = null;
        #previewSlot2 = null;
        #btnAtualizarPreview = null;
        #btnDownloadXMouse = null;
        #btnExecutarAuditoria = null;
        #btnExecutarFuzzing = null;
        #painelResultado = null;
        #btnLimparConsole = null;
        #visorConsole = null;
        #lblContadorConsole = null;
        #barraProgresso = null;
        #preenchimentoProgresso = null;
        #lblSwitchColarMeio = null;

        constructor() {
            if (typeof window !== 'undefined' && window.__JUSGOV_LOG_LEVEL__) {
                const lvlStr = String(window.__JUSGOV_LOG_LEVEL__).toUpperCase();
                if (PRIORIDADES_LOG[lvlStr] !== undefined) {
                    this.#nivelMinimoLog = PRIORIDADES_LOG[lvlStr];
                }
            }
        }

        instalarInterceptadorConsole() {
            if (typeof window === 'undefined' || this.#interceptadorInstalado) return;
            this.#interceptadorInstalado = true;

            window.JusGovConfigurarNivelLog = (nivel) => {
                if (typeof nivel === 'string') {
                    const up = nivel.toUpperCase();
                    if (PRIORIDADES_LOG[up] !== undefined) {
                        this.#nivelMinimoLog = PRIORIDADES_LOG[up];
                        return true;
                    }
                } else if (typeof nivel === 'number' && Number.isFinite(nivel)) {
                    this.#nivelMinimoLog = nivel;
                    return true;
                }
                return false;
            };

            const consoleOriginal = {
                trace: console.trace ? console.trace.bind(console) : () => { },
                debug: console.debug ? console.debug.bind(console) : () => { },
                log: console.log.bind(console),
                info: console.info ? console.info.bind(console) : console.log.bind(console),
                warn: console.warn.bind(console),
                error: console.error.bind(console)
            };

            console.trace = (...args) => { consoleOriginal.trace(...args); this.#registrarMensagemConsole('TRACE', args); };
            console.debug = (...args) => { consoleOriginal.debug(...args); this.#registrarMensagemConsole('DEBUG', args); };
            console.log = (...args) => { consoleOriginal.log(...args); this.#registrarMensagemConsole('INFO', args); };
            console.info = (...args) => { consoleOriginal.info(...args); this.#registrarMensagemConsole('INFO', args); };
            console.warn = (...args) => { consoleOriginal.warn(...args); this.#registrarMensagemConsole('WARN', args); };
            console.error = (...args) => { consoleOriginal.error(...args); this.#registrarMensagemConsole('ERROR', args); };

            window.addEventListener('error', (ev) => {
                this.#registrarMensagemConsole('ERROR', [ev.message || 'Erro desconhecido', ev.filename ? `(${ev.filename}:${ev.lineno})` : '']);
            });
            window.addEventListener('unhandledrejection', (ev) => {
                this.#registrarMensagemConsole('FATAL', ['Promise rejeitada nao tratada:', ev.reason]);
            });
        }

        inicializar(deps = {}) {
            if (deps && typeof deps.adicionarOuvinteSeguro === 'function') {
                this.#deps.adicionarOuvinteSeguro = deps.adicionarOuvinteSeguro;
            }
            if (deps && typeof deps.exibirToast === 'function') {
                this.#deps.exibirToast = deps.exibirToast;
            }

            this.#previewSlot1 = document.getElementById('previewAreaTransferencia');
            this.#previewSlot2 = document.getElementById('previewAreaTransferenciaAnterior');
            this.#btnAtualizarPreview = document.getElementById('btnAtualizarPreview');
            this.#btnDownloadXMouse = document.getElementById('btnDownloadXMouse');
            this.#btnExecutarAuditoria = document.getElementById('btnExecutarAuditoriaDebug');
            this.#btnExecutarFuzzing = document.getElementById('btnExecutarFuzzingDebug');
            this.#painelResultado = document.getElementById('painelResultadoAuditoria');
            this.#btnLimparConsole = document.getElementById('btnLimparConsole');
            this.#visorConsole = document.getElementById('visorMensagensConsole');
            this.#lblContadorConsole = document.getElementById('lblContadorConsole');
            this.#barraProgresso = document.getElementById('barraProgressoConsole');
            this.#preenchimentoProgresso = document.getElementById('preenchimentoProgressoConsole');
            this.#lblSwitchColarMeio = document.getElementById('lblSwitchColarBotaoMeio');

            if (this.#visorConsole && this.#historicoConsole.length > 0) {
                this.#visorConsole.textContent = this.#historicoConsole.join('\n');
                if (this.#lblContadorConsole) {
                    this.#lblContadorConsole.textContent = String(this.#historicoConsole.length);
                }
            }

            if (this.#inicializado) return;
            this.#inicializado = true;
            this.#registrarEventos();
        }

        estaLendoManualmente() {
            return this.#leituraManualEmAndamento;
        }

        #formatarArgumentoConsole(arg) {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch (_) { return String(arg); }
            }
            return String(arg);
        }

        #anexarLinhaAoVisor(prioFormatada, textoMsg) {
            const agora = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const dd = pad(agora.getDate());
            const mm = pad(agora.getMonth() + 1);
            const aaaa = agora.getFullYear();
            const hh = pad(agora.getHours());
            const min = pad(agora.getMinutes());
            const ss = pad(agora.getSeconds());
            const dms = Math.floor(agora.getMilliseconds() / 100);
            const linhaFormatada = `${dd}/${mm}/${aaaa} ${hh}:${min}:${ss}.${dms} [${prioFormatada}] ${textoMsg}`;

            this.#historicoConsole.push(linhaFormatada);
            if (this.#historicoConsole.length > 250) {
                this.#historicoConsole.shift();
            }
            if (this.#lblContadorConsole) {
                this.#lblContadorConsole.textContent = String(this.#historicoConsole.length);
            }
            if (this.#visorConsole) {
                this.#visorConsole.textContent = this.#historicoConsole.join('\n');
                this.#visorConsole.scrollTop = this.#visorConsole.scrollHeight;
            }
        }

        #registrarMensagemConsole(nivelNome, args) {
            const prioChave = String(nivelNome || 'INFO').toUpperCase();
            const valorPrio = PRIORIDADES_LOG[prioChave] || PRIORIDADES_LOG.INFO;
            if (valorPrio < this.#nivelMinimoLog) return;

            const textoMsg = Array.from(args).map((a) => this.#formatarArgumentoConsole(a)).join(' ');
            if (typeof textoMsg === 'string' && (
                textoMsg.includes('RELATORIO DE AUDITORIA') ||
                textoMsg.includes('BATERIA') ||
                textoMsg.includes('Escala de Cursor') ||
                textoMsg.includes('[OK] [') ||
                textoMsg.includes('[FALHA] [')
            )) {
                return;
            }
            this.#anexarLinhaAoVisor(prioChave.toLowerCase(), textoMsg);
        }

        registrarMensagemDireta(nivelNome, textoMsg) {
            this.#anexarLinhaAoVisor(String(nivelNome || 'INFO').toLowerCase(), textoMsg);
        }

        atualizarCoresEBotoesClipboard() {
            if (!this.#btnAtualizarPreview) return;
            this.#btnAtualizarPreview.classList.remove('btn-clip-permitido', 'btn-clip-bloqueado');
            this.#btnAtualizarPreview.setAttribute('title', 'Atualizar a exibição da Última Seleção (conteúdo enviado por este plugin à área de transferência)');
            if (this.#btnDownloadXMouse) {
                this.#btnDownloadXMouse.style.display = 'none';
            }
        }

        atualizarVisualAtencaoSwitches() {
            if (this.#lblSwitchColarMeio) this.#lblSwitchColarMeio.classList.remove('slider-atencao');
        }

        async obterEstadoPermissaoClipboard() {
            return 'granted';
        }

        #formatarParaVisor(origem) {
            if (!origem) {
                return { html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>', texto: '' };
            }
            if (typeof window !== 'undefined' && typeof window.JusGovFormatarConteudoClipboard === 'function') {
                return window.JusGovFormatarConteudoClipboard(origem);
            }
            const txt = (typeof origem === 'object' && origem) ? (origem.texto || origem.html || '') : String(origem);
            const ehHtml = (typeof origem === 'object' && origem && Boolean(origem.html));
            const escaping = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            let htmlFormatado = escaping(txt);
            const spanBr = '<span class="simbolo-quebra-br" style="color: #64748b; font-weight: bold; margin: 0 1px; user-select: none;" title="Quebra de linha &lt;br&gt;">↵</span>';
            const spanP = '<span class="simbolo-quebra-p" style="color: #818cf8; font-weight: bold; margin: 0 1px; user-select: none;" title="Parágrafo &lt;p&gt;">¶</span>';
            if (ehHtml || /<br|<p/i.test(txt)) {
                htmlFormatado = htmlFormatado.replace(/&lt;br\s*\/?&gt;/gi, `&lt;br&gt;${spanBr}`);
                htmlFormatado = htmlFormatado.replace(/&lt;\/p&gt;/gi, `&lt;/p&gt;${spanP}`);
                htmlFormatado = htmlFormatado.replace(/&lt;p(\s+[^&]*)?&gt;/gi, `&lt;p$1&gt;${spanP}`);
            }
            htmlFormatado = htmlFormatado.replace(/\r?\n/g, `${spanBr}\n`);
            return {
                html: txt ? htmlFormatado : '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
                texto: txt
            };
        }

        #renderizarNoVisorClipboard(origemSlot1, origemSlot2) {
            if (this.#previewSlot1) {
                this.#previewSlot1.innerHTML = this.#formatarParaVisor(origemSlot1).html;
            }
            if (this.#previewSlot2) {
                this.#previewSlot2.innerHTML = this.#formatarParaVisor(origemSlot2).html;
            }
        }

        #obterSlotClipboardParaVisor(chaveGlobal) {
            const clip = (typeof window !== 'undefined' ? window[chaveGlobal] : null);
            if (!clip) return '';
            if (typeof clip === 'object') {
                return (clip.texto || clip.html) ? clip : '';
            }
            if (typeof clip === 'string' && clip.trim().length > 0) {
                return clip.trim();
            }
            return '';
        }

        async acionarLeituraClipboardComPrompt(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!this.#previewSlot1 && !this.#previewSlot2) return;
            this.#leituraManualEmAndamento = true;
            try {
                this.#renderizarNoVisorClipboard(
                    this.#obterSlotClipboardParaVisor('__JUSGOV_ULTIMO_CLIPBOARD__'),
                    this.#obterSlotClipboardParaVisor('__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__')
                );
            } finally {
                setTimeout(() => {
                    this.#leituraManualEmAndamento = false;
                }, 350);
            }
        }

        atualizarVisorClipboardPassivo() {
            if ((!this.#previewSlot1 && !this.#previewSlot2) || this.#leituraManualEmAndamento) return;
            this.#renderizarNoVisorClipboard(
                this.#obterSlotClipboardParaVisor('__JUSGOV_ULTIMO_CLIPBOARD__'),
                this.#obterSlotClipboardParaVisor('__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__')
            );
        }

        #exibirProgressoConsole(porcentagem) {
            if (!this.#barraProgresso || !this.#preenchimentoProgresso) return;
            const pct = Math.max(0, Math.min(100, Math.round(porcentagem)));
            this.#barraProgresso.style.display = 'block';
            this.#preenchimentoProgresso.style.width = `${pct}%`;
        }

        #ocultarProgressoConsole(delayMs = 450) {
            if (!this.#barraProgresso || !this.#preenchimentoProgresso) return;
            this.#preenchimentoProgresso.style.width = '100%';
            setTimeout(() => {
                this.#barraProgresso.style.display = 'none';
                this.#preenchimentoProgresso.style.width = '0%';
            }, delayMs);
        }

        #renderizarRelatorioAuditoriaFormatado(textoBruto) {
            if (!textoBruto) return '';
            let seguro = String(textoBruto)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            seguro = seguro.replace(/\[OK\]/g, '[<span style="color: #10b981; font-weight: bold;">OK</span>]');
            seguro = seguro.replace(/\[(FALHA|ERRO|ERRO AUDITORIA|ERRO FUZZING)\]/g, '[<span style="color: #ef4444; font-weight: bold;">$1</span>]');
            seguro = seguro.replace(/\[(AVISO|ALERTA|ATENÇÃO|ATENCAO)\]/g, '[<span style="color: #f59e0b; font-weight: bold;">$1</span>]');
            return seguro;
        }

        #exibirStatusCarregamentoAuditoria(mensagem) {
            if (!this.#painelResultado) return;
            this.#painelResultado.style.display = 'block';
            const divStatus = document.createElement('div');
            divStatus.style.cssText = 'padding: 16px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center;';
            divStatus.textContent = String(mensagem || '');
            this.#painelResultado.replaceChildren(divStatus);
        }

        #registrarEventos() {
            const on = this.#deps.adicionarOuvinteSeguro;

            on(this.#btnAtualizarPreview, 'click', (e) => this.acionarLeituraClipboardComPrompt(e));

            if (this.#btnDownloadXMouse) {
                on(this.#btnDownloadXMouse, 'click', () => {
                    const urlXMouse = 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm';
                    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
                        chrome.tabs.create({ url: urlXMouse, active: true });
                    } else {
                        window.open(urlXMouse, '_blank');
                    }
                });
            }

            const painelLab = document.getElementById('abaLaboratorio');
            on(painelLab, 'mouseup', (e) => {
                if (!e || !e.target) return;
                if (e.target.closest('#btnAtualizarPreview') || e.target.closest('#previewAreaTransferencia') || e.target.closest('#previewAreaTransferenciaAnterior') || e.target.closest('#btnDownloadXMouse')) {
                    return;
                }
                if (e.target.closest('.sample-token')) {
                    setTimeout(() => {
                        if (!this.#leituraManualEmAndamento) this.atualizarVisorClipboardPassivo();
                    }, 100);
                }
            });

            window.addEventListener('copy', () => {
                try {
                    setTimeout(() => {
                        const clipAtual = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                        if (!clipAtual || (!clipAtual.formatado && !clipAtual.html)) {
                            const sel = window.getSelection ? window.getSelection().toString() : '';
                            if (sel && sel.trim().length > 0) {
                                const selLimpo = sel.replace(/([^\n\r])\r?\n([^\n\r])/g, '$1 $2').trim();
                                if (!Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                                    window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
                                }
                                const payloadNovo = { texto: selLimpo, html: '', formatado: false, timestamp: Date.now() };
                                if (window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto !== selLimpo) {
                                    window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                                    window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift(payloadNovo);
                                    if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                                } else if (!window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                                    window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift(payloadNovo);
                                    if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                                }
                                window.__JUSGOV_ULTIMO_CLIPBOARD__ = payloadNovo;
                                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                    chrome.storage.local.set({
                                        ultimoClipboardInterno: window.__JUSGOV_ULTIMO_CLIPBOARD__,
                                        ultimoClipboardAnteriorInterno: window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__,
                                        historicoClipboardInterno: window.__JUSGOV_HISTORICO_CLIPBOARD__
                                    }).catch(() => { });
                                }
                            }
                        }
                        if (!this.#leituraManualEmAndamento) this.atualizarVisorClipboardPassivo();
                    }, 60);
                } catch (_) { }
            });

            window.addEventListener('focus', () => {
                if (!this.#leituraManualEmAndamento) this.atualizarVisorClipboardPassivo();
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !this.#leituraManualEmAndamento) this.atualizarVisorClipboardPassivo();
            });
            setInterval(() => {
                if (!document.hidden && !this.#leituraManualEmAndamento) this.atualizarVisorClipboardPassivo();
            }, 5000);

            on(this.#btnLimparConsole, 'click', () => {
                this.#historicoConsole.length = 0;
                if (this.#lblContadorConsole) this.#lblContadorConsole.textContent = '0';
                if (this.#visorConsole) this.#visorConsole.textContent = '(Console limpo - nenhuma mensagem ou erro registrado)';
                if (this.#painelResultado) {
                    this.#painelResultado.textContent = '';
                    this.#painelResultado.style.display = 'none';
                }
            });

            on(this.#btnExecutarAuditoria, 'click', () => this.#executarBateriaBotao('auditoria'));
            on(this.#btnExecutarFuzzing, 'click', () => this.#executarBateriaBotao('fuzzing'));
        }

        async #executarBateriaBotao(tipo) {
            const ehFuzz = (tipo === 'fuzzing');
            const btn = ehFuzz ? this.#btnExecutarFuzzing : this.#btnExecutarAuditoria;
            const fnAsync = ehFuzz ? window.JusGovExecutarFuzzingAsync : window.JusGovExecutarAuditoriaAsync;
            const fnSync = ehFuzz ? window.JusGovExecutarFuzzing : window.JusGovExecutarAuditoria;
            const rotuloOrig = ehFuzz ? 'Fuzzing (1s/T)' : 'Auditoria';

            if (typeof fnAsync !== 'function' && typeof fnSync !== 'function') {
                if (this.#painelResultado) {
                    this.#painelResultado.style.display = 'block';
                    this.#painelResultado.innerHTML = this.#renderizarRelatorioAuditoriaFormatado('[ERRO] Módulo mod-debug.js não carregado.');
                }
                this.registrarMensagemDireta('ERROR', 'Módulo mod-debug.js não carregado.');
                return;
            }

            this.#deps.exibirToast(ehFuzz ? 'Executando Fuzzing (1s/T)... aguarde' : 'Executando Auditoria... aguarde');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Executando...';
            }
            this.#exibirStatusCarregamentoAuditoria(ehFuzz
                ? '⏳ Executando Fuzzing (1s/T)... o relatório será exibido ao término.'
                : '⏳ Executando testes de auditoria... o relatório será exibido ao término.');
            this.#exibirProgressoConsole(5);

            try {
                let relatorio;
                if (typeof fnAsync === 'function') {
                    const cbProg = (pct, nome) => {
                        this.#exibirProgressoConsole(pct);
                        if (nome) {
                            this.registrarMensagemDireta('INFO', `${ehFuzz ? 'Fuzzing' : 'Auditoria'} [${Math.round(pct)}%]: ${nome}...`);
                        }
                    };
                    relatorio = ehFuzz ? await fnAsync(1000, cbProg) : await fnAsync({}, cbProg);
                } else {
                    relatorio = ehFuzz
                        ? fnSync(1000)
                        : fnSync({
                            onProgress: (pct, nome) => {
                                this.#exibirProgressoConsole(pct);
                                if (nome) this.registrarMensagemDireta('INFO', `Auditoria [${Math.round(pct)}%]: ${nome}...`);
                            }
                        });
                }
                this.#exibirProgressoConsole(100);
                if (this.#painelResultado) {
                    this.#painelResultado.style.display = 'block';
                    this.#painelResultado.innerHTML = this.#renderizarRelatorioAuditoriaFormatado(relatorio.logTexto);
                    this.#painelResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                const resumo = ehFuzz
                    ? `Fuzzing concluído: ${relatorio.aprovados}/${relatorio.total} aprovados!`
                    : `Auditoria concluída: ${relatorio.aprovados}/${relatorio.total} testes aprovados!`;
                this.#deps.exibirToast(resumo);
                this.registrarMensagemDireta('INFO', resumo);
            } catch (err) {
                const tag = ehFuzz ? '[ERRO FUZZING] ' : '[ERRO AUDITORIA] ';
                const msg = err && err.message ? err.message : String(err);
                if (this.#painelResultado) {
                    this.#painelResultado.style.display = 'block';
                    this.#painelResultado.innerHTML = this.#renderizarRelatorioAuditoriaFormatado(tag + msg);
                }
                this.registrarMensagemDireta('ERROR', `Falha: ${msg}`);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = rotuloOrig;
                }
                this.#ocultarProgressoConsole(ehFuzz ? 500 : 450);
            }
        }
    }

    return Object.freeze(OptionsLaboratorio);
}));
