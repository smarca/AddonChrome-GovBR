/* ==========================================================================
 * Nome do arquivo: mod-input.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
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
 *    Passo 1.3: Registro idempotente de listeners globais de mouse e teclado no document/window.
 *    Passo 1.4: Sincronização reativa de configurações via chrome.storage ou mensagens.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 1, 9, 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-input)
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
     * ===================================================================== */
    const NULL_BOTOES_LATERAIS = Object.freeze({
        ativo: false,
        processarEventoMouse: () => false,
        simularDisparo: () => ({ ok: false, acao: 'NULL_OBJECT' })
    });

    const NULL_BOTAO_MEIO = Object.freeze({
        ativo: false,
        tratarCliqueBotaoMeio: () => false
    });

    const NULL_TECLADO_CAMPOS = Object.freeze({
        ativo: false,
        navegarParaCampo: () => false,
        tratarEventoTeclado: () => false
    });

    const NULL_ATALHO_F1 = Object.freeze({
        ativo: false,
        promptPadrao: '',
        tratarEventoTeclado: () => false
    });

    class ModuloInput {
        #botoesLaterais;
        #botaoMeio;
        #tecladoCampos;
        #atalhoF1;
        #inicializado = false;

        /**
         * @param {Object} [opcoes={}]
         * @param {Object} [opcoes.botoesLaterais]
         * @param {Object} [opcoes.botaoMeio]
         * @param {Object} [opcoes.tecladoCampos]
         * @param {Object} [opcoes.atalhoF1]
         */
        constructor(opcoes = {}) {
            /* Passo 1.2: Injeção com fallback defensivo para instâncias globais ou Null Objects */
            const fabricaBotoes = typeof window !== 'undefined' && window.JusGovBotoesLateraisMouse;
            const fabricaBotaoMeio = typeof window !== 'undefined' && window.JusGovBotaoMeioColagem;
            const fabricaTeclado = typeof window !== 'undefined' && window.JusGovNavegacaoTecladoCampos;
            const fabricaF1 = typeof window !== 'undefined' && window.JusGovAtalhoF1Gemini;

            this.#botoesLaterais = opcoes.botoesLaterais !== undefined ? (opcoes.botoesLaterais || NULL_BOTOES_LATERAIS) : (fabricaBotoes ? new fabricaBotoes() : NULL_BOTOES_LATERAIS);
            this.#botaoMeio = opcoes.botaoMeio !== undefined ? (opcoes.botaoMeio || NULL_BOTAO_MEIO) : (fabricaBotaoMeio ? new fabricaBotaoMeio() : NULL_BOTAO_MEIO);
            this.#tecladoCampos = opcoes.tecladoCampos !== undefined ? (opcoes.tecladoCampos || NULL_TECLADO_CAMPOS) : (fabricaTeclado ? new fabricaTeclado() : NULL_TECLADO_CAMPOS);
            this.#atalhoF1 = opcoes.atalhoF1 !== undefined ? (opcoes.atalhoF1 || NULL_ATALHO_F1) : (fabricaF1 ? new fabricaF1() : NULL_ATALHO_F1);
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                botoesLaterais: NULL_BOTOES_LATERAIS,
                botaoMeio: NULL_BOTAO_MEIO,
                tecladoCampos: NULL_TECLADO_CAMPOS,
                atalhoF1: NULL_ATALHO_F1
            });
        }

        get botoesLaterais() { return this.#botoesLaterais; }
        get botaoMeio() { return this.#botaoMeio; }
        get tecladoCampos() { return this.#tecladoCampos; }
        get atalhoF1() { return this.#atalhoF1; }
        get inicializado() { return this.#inicializado; }

        /**
         * Inicializa os listeners globais de eventos no document e window de forma idempotente
         * @param {Document} [doc=document]
         * @returns {boolean} True se inicializado com sucesso
         */
        inicializar(doc = (typeof document !== 'undefined' ? document : null)) {
            if (!doc || this.#inicializado) {
                return false;
            }

            /* Passo 1.3: Registro de manipuladores de eventos de mouse */
            const tratarMouse = (e) => {
                /* Botões laterais 4 e 5 */
                if (this.#botoesLaterais.processarEventoMouse(e)) {
                    return;
                }
                /* Botão do meio (Scroll Click) */
                if (e.type === 'mouseup' || e.type === 'auxclick') {
                    this.#botaoMeio.tratarCliqueBotaoMeio(e);
                }
            };

            /* Passo 1.4: Registro de manipuladores de teclado */
            const tratarTeclado = (e) => {
                if (this.#tecladoCampos.tratarEventoTeclado(e)) {
                    return;
                }
                if (this.#atalhoF1.tratarEventoTeclado(e)) {
                    return;
                }
            };

            try {
                doc.addEventListener('mouseup', tratarMouse, true);
                doc.addEventListener('auxclick', tratarMouse, true);
                doc.addEventListener('keydown', tratarTeclado, true);
                this.#inicializado = true;
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Atualiza os estados de ativação com base nas configurações da extensão
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

            if (typeof cfg.optPromptF1Gemini === 'string') {
                this.#atalhoF1.promptPadrao = cfg.optPromptF1Gemini;
            }
        }
    }

    return Object.freeze(ModuloInput);
}));
