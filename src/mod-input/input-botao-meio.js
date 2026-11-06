/* ==========================================================================
 * Nome do arquivo: input-botao-meio.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Captura do clique com o botão do meio do mouse (Scroll Click, button === 1).
 *    - Clique simples no botão do meio: Cola a "Última Seleção" presente no buffer de memória
 *      (window.__JUSGOV_ULTIMO_CLIPBOARD__) em campos editáveis e editores de minutas, simulando Ctrl+V
 *      sem acionar leituras invasivas de clipboard do navegador.
 *    - Ctrl + botão do meio: Envia o comando para invocar o histórico nativo da área de transferência
 *      do Windows (Win+V).
 *    - Bloqueio rigoroso do cursor de bússola/rolagem automática nativa (autoscroll).
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe BotaoMeioColagem com campos privados (#) e método público
 *    tratarCliqueBotaoMeio(evento, bufferUltimaSelecao, callbackColar).
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Identificação estrita de e.button === 1 e guarda de ativação.
 *    Passo 1.2: Cancelamento de preventDefault para suprimir o modo de rolagem circular nativo.
 *    Passo 1.3: Se e.ctrlKey estiver ativo, despacha mensagem ao background para histórico Win+V.
 *    Passo 1.4: Se clique comum e o alvo for editável, insere o texto e despacha eventos de input.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 16)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-002: Simulação de Clipboard em Memória)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovBotaoMeioColagem = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class BotaoMeioColagem {
        #ativo = true;
        #ultimoDisparoTimestamp = 0;
        #intervaloMinimoDisparoMs = 120;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true] - Se a colagem com botão do meio está habilitada
         */
        constructor(opcoes = {}) {
            /* Passo 1.1: Inicialização defensiva */
            if (typeof opcoes.ativo === 'boolean') {
                this.#ativo = opcoes.ativo;
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
         * Verifica se o elemento alvo pode receber texto colado (campo de texto, textarea ou contenteditable)
         * @param {HTMLElement} el
         * @returns {boolean}
         */
        #ehElementoEditavel(el) {
            if (!el || !(el instanceof Element)) return false;
            const tag = el.tagName ? el.tagName.toUpperCase() : '';
            if (tag === 'TEXTAREA') return !el.disabled && !el.readOnly;
            if (tag === 'INPUT') {
                const tipo = (el.getAttribute('type') || 'text').toLowerCase();
                const tiposTexto = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
                return tiposTexto.includes(tipo) && !el.disabled && !el.readOnly;
            }
            if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
                return true;
            }
            return Boolean(el.closest && el.closest('[contenteditable="true"], .cke_editable, .tox-edit-area'));
        }

        /**
         * Insere o texto fornecido no cursor do elemento editável de forma compatível com navegadores modernos
         * @param {HTMLElement} elEditavel
         * @param {string} texto
         * @returns {boolean} True se a inserção ocorreu com sucesso
         */
        #inserirTextoNoCursor(elEditavel, texto) {
            if (!elEditavel || typeof texto !== 'string' || texto.length === 0) {
                return false;
            }

            /* Passo 2.1: Campos clássicos de formulário (input e textarea) */
            const tag = elEditavel.tagName ? elEditavel.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                try {
                    const inicio = typeof elEditavel.selectionStart === 'number' ? elEditavel.selectionStart : elEditavel.value.length;
                    const fim = typeof elEditavel.selectionEnd === 'number' ? elEditavel.selectionEnd : elEditavel.value.length;
                    const valorAnterior = elEditavel.value || '';
                    const novoValor = valorAnterior.slice(0, inicio) + texto + valorAnterior.slice(fim);
                    elEditavel.value = novoValor;
                    const novaPosicao = inicio + texto.length;
                    elEditavel.setSelectionRange(novaPosicao, novaPosicao);

                    /* Despacho de eventos sintéticos para frameworks reativos (React, Angular, Vue, JSF) */
                    elEditavel.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    elEditavel.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    return true;
                } catch (_) { }
            }

            /* Passo 2.2: Editores ricos baseados em contenteditable */
            try {
                const doc = elEditavel.ownerDocument || document;
                if (typeof doc.execCommand === 'function') {
                    const sucesso = doc.execCommand('insertText', false, texto);
                    if (sucesso) return true;
                }
            } catch (_) { }

            return false;
        }

        /**
         * Trata o evento de clique do botão do meio
         * @param {MouseEvent} e - Evento de mouseup ou auxclick
         * @param {string} [bufferUltimaSelecao=""] - Conteúdo em memória da última seleção
         * @param {Function} [callbackSucesso=null] - Callback opcional executado ao colar com sucesso
         * @returns {boolean} True se o evento foi interceptado
         */
        tratarCliqueBotaoMeio(e, bufferUltimaSelecao = '', callbackSucesso = null) {
            /* Passo 3.1: Validação do botão do meio (button === 1) */
            if (!this.#ativo || !e || e.button !== 1) {
                return false;
            }

            /* Passo 3.2: Cancelamento do cursor de bússola nativo de rolagem */
            try {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
            } catch (_) { }

            /* Passo 3.3: Proteção de debounce */
            const agora = Date.now();
            if (agora - this.#ultimoDisparoTimestamp < this.#intervaloMinimoDisparoMs) {
                return true;
            }
            this.#ultimoDisparoTimestamp = agora;

            /* Passo 3.4: Tratamento de Ctrl + Botão do Meio (Histórico Win+V) */
            if (e.ctrlKey) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                        chrome.runtime.sendMessage({ acao: 'ABRIR_HISTORICO_WIN_V' }).catch(() => { });
                    }
                } catch (_) { }
                return true;
            }

            /* Passo 3.5: Colagem da última seleção no alvo editável sob o cursor */
            const alvo = e.target;
            if (this.#ehElementoEditavel(alvo)) {
                const textoParaColar = bufferUltimaSelecao || (typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD__) || '';
                if (textoParaColar) {
                    this.#inserirTextoNoCursor(alvo, textoParaColar);
                    if (typeof callbackSucesso === 'function') {
                        callbackSucesso(textoParaColar, alvo);
                    }
                }
            }

            return true;
        }
    }

    return Object.freeze(BotaoMeioColagem);
}));
