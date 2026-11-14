/* ==========================================================================
 * Nome do arquivo: mod-input.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/mod-input.js
 * - Classe Exportada: ModuloInput (window.JusGovModuloInput)
 * - Métodos Públicos: inicializar(doc), destruir(), atualizarConfiguracoes(cfg), static get NULL_OBJECTS
 * - Dependências Injetadas: BotoesLateraisMouse, BotaoMeioColagem, NavegacaoTecladoCampos, AtalhoF1Gemini, CaixaEntradaRapida
 * - Eventos DOM: mouseup, auxclick, mousemove, keydown (capture: true + AbortController), pagehide (!persisted -> destruir)
 * - Regras / Seções: Diretrizes 11/16, ADR-006 (Null Objects c/ setters no-op), BUG-01 (teardown), Seção 6.47, Seção 6.64, Seção 6.72 (FEAT-08)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Fachada Principal (Facade) e Orquestrador central do Grupo 3 de opções do addon:
 *    "TECLADO/MOUSE: Navegação por Teclado e Botões Laterais".
 *    Gerencia o ciclo de vida dos manipuladores de eventos de entrada (botões laterais 4/5,
 *    colagem pelo botão do meio, navegação por setas em <input> e atalho inteligente F1 Gemini).
 * 2) TOLERÂNCIA A FALHAS E PADRÃO NULL OBJECT (DIRETRIZ ROOT 16 / ADR-006):
 *    Se qualquer arquivo ou submódulo for excluído fisicamente ou falhar ao carregar,
 *    instancia automaticamente Null Objects seguros com métodos no-op estáveis, impedindo
 *    qualquer interrupção por TypeError ou ReferenceError.
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Definição dos Null Objects para as 4 dependências funcionais.
 *    Passo 1.2: Injeção de dependências no construtor da classe ModuloInput.
 *    Passo 1.3: Registro idempotente de listeners globais de mouse e teclado no document/window
 *               governado por AbortController privado (#abortController) e auto-desmontagem
 *               determinística em pagehide (!event.persisted) para prevenção de vazamento de
 *               closures em subframes/iframes dinâmicos (BUG-01).
 *    Passo 1.4: Sincronização reativa de configurações via chrome.storage ou mensagens,
 *               mantendo desacoplamento estrito entre Grupo 3 (Input), Grupo 2 (Cópia)
 *               e Grupo 4 (Navegador via IPC assíncrono) conforme Seção 6.47.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 1, 9, 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-input)
 * - docs/04_RADAR_BUGS_E_QUALIDADE.md (BUG-01: Ciclo de vida determinístico em subframes)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004 e ADR-006)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloInput = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* =====================================================================
     * PASSO 1.1: DEFINIÇÃO DE NULL OBJECTS IMUTÁVEIS PARA TOLERÂNCIA TOTAL A FALHAS
     * Getters e setters no-op garantem compatibilidade total com 'use strict' (Seção 6.64),
     * impedindo TypeError ao atribuir propriedades quando um submódulo estiver ausente.
     * ===================================================================== */
    const NULL_BOTOES_LATERAIS = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        processarEventoMouse: () => false,
        simularDisparo: () => ({ ok: false, acao: 'NULL_OBJECT' })
    });

    const NULL_BOTAO_MEIO = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        tratarMouseDown: () => false,
        tratarEventoTeclado: () => false,
        cancelarPressionamento: () => { },
        tratarCliqueBotaoMeio: () => false
    });

    const NULL_TECLADO_CAMPOS = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        navegarParaCampo: () => false,
        tratarEventoTeclado: () => false
    });

    const NULL_ATALHO_F1 = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        get promptPadrao() { return ''; },
        set promptPadrao(_) { },
        obterPromptFormatado: () => '',
        montarUrlGemini: () => '',
        tratarEventoTeclado: () => false
    });

    const NULL_CAIXA_RAPIDA = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        get isAberta() { return false; },
        get ultimoTextoDigitado() { return ''; },
        registrarPosicaoMouse: () => { },
        tratarEventoTeclado: () => false,
        abrirCaixa: () => { },
        fecharCaixa: () => { },
        confirmar: () => { }
    });

    class ModuloInput {
        #botoesLaterais;
        #botaoMeio;
        #tecladoCampos;
        #atalhoF1;
        #caixaRapida;
        #inicializado = false;
        #abortController = null;
        #documentoAssociado = null;

        /**
         * @param {Object} [opcoes={}]
         * @param {Object} [opcoes.botoesLaterais]
         * @param {Object} [opcoes.botaoMeio]
         * @param {Object} [opcoes.tecladoCampos]
         * @param {Object} [opcoes.atalhoF1]
         * @param {Object} [opcoes.caixaRapida]
         */
        constructor(opcoes = {}) {
            /* Passo 1.2: Injeção com fallback defensivo para instâncias globais ou Null Objects */
            const fabricaBotoes = typeof window !== 'undefined' && window.JusGovBotoesLateraisMouse;
            const fabricaBotaoMeio = typeof window !== 'undefined' && window.JusGovBotaoMeioColagem;
            const fabricaTeclado = typeof window !== 'undefined' && window.JusGovNavegacaoTecladoCampos;
            const fabricaF1 = typeof window !== 'undefined' && window.JusGovAtalhoF1Gemini;
            const fabricaCaixa = typeof window !== 'undefined' && window.JusGovCaixaEntradaRapida;

            this.#botoesLaterais = opcoes.botoesLaterais !== undefined ? (opcoes.botoesLaterais || NULL_BOTOES_LATERAIS) : (fabricaBotoes ? new fabricaBotoes() : NULL_BOTOES_LATERAIS);
            this.#botaoMeio = opcoes.botaoMeio !== undefined ? (opcoes.botaoMeio || NULL_BOTAO_MEIO) : (fabricaBotaoMeio ? new fabricaBotaoMeio() : NULL_BOTAO_MEIO);
            this.#tecladoCampos = opcoes.tecladoCampos !== undefined ? (opcoes.tecladoCampos || NULL_TECLADO_CAMPOS) : (fabricaTeclado ? new fabricaTeclado() : NULL_TECLADO_CAMPOS);
            this.#atalhoF1 = opcoes.atalhoF1 !== undefined ? (opcoes.atalhoF1 || NULL_ATALHO_F1) : (fabricaF1 ? new fabricaF1() : NULL_ATALHO_F1);
            this.#caixaRapida = opcoes.caixaRapida !== undefined ? (opcoes.caixaRapida || NULL_CAIXA_RAPIDA) : (fabricaCaixa ? new fabricaCaixa() : NULL_CAIXA_RAPIDA);
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                botoesLaterais: NULL_BOTOES_LATERAIS,
                botaoMeio: NULL_BOTAO_MEIO,
                tecladoCampos: NULL_TECLADO_CAMPOS,
                atalhoF1: NULL_ATALHO_F1,
                caixaRapida: NULL_CAIXA_RAPIDA
            });
        }

        get botoesLaterais() { return this.#botoesLaterais; }
        get botaoMeio() { return this.#botaoMeio; }
        get tecladoCampos() { return this.#tecladoCampos; }
        get atalhoF1() { return this.#atalhoF1; }
        get caixaRapida() { return this.#caixaRapida; }
        get inicializado() { return this.#inicializado; }
        get sinalCicloVida() { return this.#abortController ? this.#abortController.signal : null; }

        /**
         * Desmonta deterministicamente todos os ouvintes DOM anexados por esta fachada (BUG-01),
         * liberando closures de eventos em documentos e subframes descarregados sem aguardar GC.
         * @returns {boolean} True se havia um ciclo ativo que foi encerrado
         */
        destruir() {
            const estavaAtivo = Boolean(this.#inicializado || this.#abortController);
            if (this.#caixaRapida && typeof this.#caixaRapida.fecharCaixa === 'function') {
                try {
                    this.#caixaRapida.fecharCaixa();
                } catch (_) { }
            }
            if (this.#abortController) {
                try {
                    this.#abortController.abort();
                } catch (_) { }
                this.#abortController = null;
            }
            this.#documentoAssociado = null;
            this.#inicializado = false;
            return estavaAtivo;
        }

        /**
         * Inicializa os listeners globais de eventos no document e window de forma idempotente,
         * atrelados a um AbortController dedicado com limpeza automática em pagehide (!persisted).
         * @param {Document} [doc=document]
         * @returns {boolean} True se inicializado com sucesso
         */
        inicializar(doc = (typeof document !== 'undefined' ? document : null)) {
            if (!doc || typeof doc.addEventListener !== 'function') {
                return false;
            }
            if (this.#inicializado && this.#documentoAssociado === doc && this.#abortController && !this.#abortController.signal.aborted) {
                return false;
            }
            if (this.#abortController) {
                this.destruir();
            }

            const ctrl = new AbortController();
            const signal = ctrl.signal;

            /* Passo 1.3: Registro de manipuladores de eventos de mouse */
            const tratarMouse = (e) => {
                /* Botões laterais 4 e 5 */
                if (this.#botoesLaterais.processarEventoMouse(e)) {
                    return;
                }
                /* Botão do meio (Scroll Click): mousedown / pointerdown para supressão de autoscroll em editáveis */
                if (e.type === 'mousedown' || e.type === 'pointerdown') {
                    if (this.#botaoMeio.tratarMouseDown(e)) {
                        return;
                    }
                }
                /* Botão do meio (Scroll Click): mouseup / auxclick para colagem (simples ou com Ctrl) */
                if (e.type === 'mouseup' || e.type === 'auxclick') {
                    this.#botaoMeio.tratarCliqueBotaoMeio(e);
                }
            };

            /* Passo 1.4: Registro de manipuladores de teclado */
            const tratarTeclado = (e) => {
                /* Atalhos de Teclado Ctrl + Alt + 1 a 0 (Histórico de 10 Níveis - Seção 6.98 / FEAT-18) */
                if (this.#botaoMeio.tratarEventoTeclado(e)) {
                    return;
                }
                /* Seção 6.72: Caixa de Entrada Rápida de Texto (Ctrl + Ins + Ins) */
                if (this.#caixaRapida.tratarEventoTeclado(e)) {
                    return;
                }
                if (this.#tecladoCampos.tratarEventoTeclado(e)) {
                    return;
                }
                if (this.#atalhoF1.tratarEventoTeclado(e)) {
                    return;
                }
            };

            try {
                doc.addEventListener('mousemove', (e) => this.#caixaRapida.registrarPosicaoMouse(e), { capture: true, signal, passive: true });
                doc.addEventListener('pointerdown', tratarMouse, { capture: true, signal, passive: false });
                doc.addEventListener('mousedown', tratarMouse, { capture: true, signal, passive: false });
                doc.addEventListener('mouseup', tratarMouse, { capture: true, signal, passive: false });
                doc.addEventListener('auxclick', tratarMouse, { capture: true, signal, passive: false });
                doc.addEventListener('keydown', tratarTeclado, { capture: true, signal });

                /* Passo 1.5 (BUG-01): Auto-teardown determinístico caso o documento/subframe seja
                 * definitivamente descarregado (pagehide sem BFCache), preservando BFCache quando persisted=true. */
                const winAssociada = doc.defaultView;
                if (winAssociada && typeof winAssociada.addEventListener === 'function') {
                    winAssociada.addEventListener('blur', () => {
                        this.#botaoMeio.cancelarPressionamento();
                    }, { capture: true, signal, passive: true });
                    winAssociada.addEventListener('pagehide', (ev) => {
                        this.#botaoMeio.cancelarPressionamento();
                        if (!ev || !ev.persisted) {
                            this.destruir();
                        }
                    }, { capture: true, signal });
                }

                this.#abortController = ctrl;
                this.#documentoAssociado = doc;
                this.#inicializado = true;
                return true;
            } catch (_) {
                try { ctrl.abort(); } catch (__) { }
                return false;
            }
        }

        /**
         * Atualiza os estados de ativação com base nas configurações da extensão
         * (aceitando tanto as chaves de UI opt* quanto as chaves persistidas no chrome.storage.sync).
         * @param {Object} cfg
         */
        atualizarConfiguracoes(cfg = {}) {
            if (!cfg || typeof cfg !== 'object') return;

            if (typeof cfg.optCapturaBotoesMouse4e5 === 'boolean') {
                this.#botoesLaterais.ativo = cfg.optCapturaBotoesMouse4e5;
            } else if (typeof cfg.capturaBotoesMouse4e5Ativa === 'boolean') {
                this.#botoesLaterais.ativo = cfg.capturaBotoesMouse4e5Ativa;
            }

            if (typeof cfg.optColarBotaoMeio === 'boolean') {
                this.#botaoMeio.ativo = cfg.optColarBotaoMeio;
            } else if (typeof cfg.colarBotaoMeioAtivo === 'boolean') {
                this.#botaoMeio.ativo = cfg.colarBotaoMeioAtivo;
            }

            if (typeof cfg.optNavegacaoTecladoCampos === 'boolean') {
                this.#tecladoCampos.ativo = cfg.optNavegacaoTecladoCampos;
            } else if (typeof cfg.navegacaoTecladoCamposAtiva === 'boolean') {
                this.#tecladoCampos.ativo = cfg.navegacaoTecladoCamposAtiva;
            }

            if (typeof cfg.optAtalhoF1Gemini === 'boolean') {
                this.#atalhoF1.ativo = cfg.optAtalhoF1Gemini;
            } else if (typeof cfg.atalhoF1GeminiAtivo === 'boolean') {
                this.#atalhoF1.ativo = cfg.atalhoF1GeminiAtivo;
            }

            if (typeof cfg.optPromptF1Gemini === 'string' && cfg.optPromptF1Gemini.trim().length > 0) {
                this.#atalhoF1.promptPadrao = cfg.optPromptF1Gemini;
            } else if (typeof cfg.promptF1Gemini === 'string' && cfg.promptF1Gemini.trim().length > 0) {
                this.#atalhoF1.promptPadrao = cfg.promptF1Gemini;
            }

            if (typeof cfg.optCaixaEntradaRapida === 'boolean') {
                this.#caixaRapida.ativo = cfg.optCaixaEntradaRapida;
            } else if (typeof cfg.caixaEntradaRapidaAtiva === 'boolean') {
                this.#caixaRapida.ativo = cfg.caixaEntradaRapidaAtiva;
            }
        }
    }

    Object.freeze(ModuloInput.prototype);
    return Object.freeze(ModuloInput);
}));
