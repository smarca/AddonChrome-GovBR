/* ==========================================================================
 * Nome do arquivo: input-atalho-f1.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-atalho-f1.js
 * - Classe Exportada: AtalhoF1Gemini (window.JusGovAtalhoF1Gemini)
 * - Métodos Públicos: obterPromptFormatado(texto), montarUrlGemini(texto), tratarEventoTeclado(e, textoPreviamenteSelecionado), get/set ativo, get/set promptPadrao
 * - Canais IPC: chrome.runtime.sendMessage({ acao: 'ABRIR_PAINEL_F1_GEMINI', texto })
 * - Variáveis Globais Lidas: window.__JUSGOV_ULTIMO_CLIPBOARD__ (fallback de seleção)
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.47 (suporte duplo {{TEXTO}} e {SELECAO}), Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Captura do atalho de teclado F1 (keydown) para acionar o assistente de inteligência artificial.
 *    Ao ser acionado sobre uma seleção ativa ou texto em foco, envia mensagem assíncrona ao
 *    Service Worker para abrir ou focar a aba do Google Gemini e pré-preencher o comando estruturado
 *    substituindo {{TEXTO}} pelo texto selecionado, sem sobrescrever o clipboard do usuário.
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe AtalhoF1Gemini com campos privados (#) e método público
 *    tratarEventoTeclado(evento, textoSelecionadoOpcional).
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Checagem estrita de e.key === 'F1' e guarda de ativação.
 *    Passo 1.2: Cancelamento de preventDefault para suprimir a Ajuda nativa do Windows/Chrome.
 *    Passo 1.3: Extração do texto selecionado no DOM via window.getSelection().
 *    Passo 1.4: Despacho de mensagem para background.js ({ acao: 'ABRIR_PAINEL_F1_GEMINI', texto }).
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 16)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovAtalhoF1Gemini = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AtalhoF1Gemini {
        #ativo = true;
        #promptPadrao = 'Analise juridicamente e formate o seguinte texto processual extraído do PJe:\n\n"{{TEXTO}}"';
        #ultimoDisparoTimestamp = 0;
        #intervaloMinimoDisparoMs = 300;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true]
         * @param {string} [opcoes.promptPadrao]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.ativo === 'boolean') {
                this.#ativo = opcoes.ativo;
            }
            if (typeof opcoes.promptPadrao === 'string' && opcoes.promptPadrao.trim().length > 0) {
                this.#promptPadrao = opcoes.promptPadrao;
            }
        }

        /**
         * @returns {boolean}
         */
        get ativo() {
            return this.#ativo;
        }

        /**
         * @param {boolean} valor
         */
        set ativo(valor) {
            this.#ativo = Boolean(valor);
        }

        /**
         * @returns {string}
         */
        get promptPadrao() {
            return this.#promptPadrao;
        }

        /**
         * @param {string} valor
         */
        set promptPadrao(valor) {
            if (typeof valor === 'string' && valor.trim().length > 0) {
                this.#promptPadrao = valor;
            }
        }

        /**
         * Retorna o prompt formatado substituindo os marcadores {{TEXTO}} ou {SELECAO}
         * de forma determinística e sem acoplamento ao DOM externo.
         * O porquê (Seção 6.47): O contrato padrão do storage e da Central de Opções utiliza
         * o marcador '{{TEXTO}}', enquanto suítes de homologação legadas também empregam
         * '{SELECAO}'. Suportar ambos preserva retrocompatibilidade total em 100% dos fluxos.
         * @param {string} [texto=""]
         * @returns {string}
         */
        obterPromptFormatado(texto = '') {
            const limpo = String(texto || '').trim();
            if (this.#promptPadrao.includes('{{TEXTO}}')) {
                return this.#promptPadrao.replace(/\{\{TEXTO\}\}/g, limpo);
            }
            if (this.#promptPadrao.includes('{SELECAO}')) {
                return this.#promptPadrao.replace(/\{SELECAO\}/g, limpo);
            }
            return (this.#promptPadrao + ' ' + limpo).trim();
        }

        /**
         * Monta a URL de busca direta no Google Gemini
         * @param {string} [texto=""]
         * @returns {string}
         */
        montarUrlGemini(texto = '') {
            const prompt = this.obterPromptFormatado(texto);
            return 'https://gemini.google.com/app?q=' + encodeURIComponent(prompt);
        }

        /**
         * Trata o evento keydown para a tecla F1
         * @param {KeyboardEvent} e
         * @param {string} [textoPreviamenteSelecionado=""]
         * @returns {boolean} True se o atalho F1 foi tratado
         */
        tratarEventoTeclado(e, textoPreviamenteSelecionado = '') {
            /* Passo 1.1: Checagem estrita de e.key === 'F1' e guarda de ativação */
            if (!this.#ativo || !e) return false;
            if (e.key !== 'F1') return false;

            /* Passo 1.2: Cancela o popup nativo de Ajuda do Chrome/Windows */
            try {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
            } catch (_) { }

            const agora = Date.now();
            if (agora - this.#ultimoDisparoTimestamp < this.#intervaloMinimoDisparoMs) {
                return true;
            }
            this.#ultimoDisparoTimestamp = agora;

            /* Passo 1.3: Obtém texto da seleção ativa caso não tenha sido passado */
            let texto = textoPreviamenteSelecionado;
            if (!texto && typeof window !== 'undefined' && window.getSelection) {
                try {
                    const sel = window.getSelection();
                    texto = sel ? sel.toString().trim() : '';
                } catch (_) { }
            }

            /* Se não houver seleção na janela, recorre ao buffer da última cópia em memória */
            if (!texto && typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                texto = typeof window.__JUSGOV_ULTIMO_CLIPBOARD__ === 'string'
                    ? window.__JUSGOV_ULTIMO_CLIPBOARD__
                    : (window.__JUSGOV_ULTIMO_CLIPBOARD__.texto || window.__JUSGOV_ULTIMO_CLIPBOARD__.txt || '');
            }

            /* Passo 1.4: Despacha a mensagem ao service worker para abrir o Gemini */
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({
                        acao: 'ABRIR_PAINEL_F1_GEMINI',
                        texto: texto || ''
                    }).catch(() => { });
                }
            } catch (_) { }

            return true;
        }
    }

    Object.freeze(AtalhoF1Gemini.prototype);
    return Object.freeze(AtalhoF1Gemini);
}));
