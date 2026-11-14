/* ==========================================================================
 * Nome do arquivo: input-teclado-campos.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-teclado-campos.js
 * - Classe Exportada: NavegacaoTecladoCampos (window.JusGovNavegacaoTecladoCampos)
 * - Métodos Públicos: navegarParaCampo(inputAtual, direcao), tratarEventoTeclado(e), get/set ativo
 * - Eventos DOM: keydown (ArrowUp / ArrowDown em <input> editáveis visíveis)
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.64 (duck-typing cross-realm nodeType===1 && tagName==='INPUT')
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Permite a navegação fluida por teclado entre campos de entrada de formulários (<input>),
 *    utilizando as teclas Seta para Cima (↑) e Seta para Baixo (↓) para avançar ou retroceder
 *    o foco, selecionando todo o conteúdo do campo ao focar para agilizar a digitação e conferência.
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe NavegacaoTecladoCampos com campos privados (#) e métodos
 *    tratarEventoTeclado(evento) e navegarParaProximoCampo(inputAtual, direcao).
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Identificação de evento keydown com teclas ArrowUp / ArrowDown em campo <input>.
 *    Passo 1.2: Coleta de todos os inputs visíveis, habilitados e editáveis do mesmo formulário ou container.
 *    Passo 1.3: Cálculo do índice relativo (anterior ou próximo) e aplicação de foco com .select().
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
        raiz.JusGovNavegacaoTecladoCampos = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class NavegacaoTecladoCampos {
        #ativo = true;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true] - Se a navegação por setas está ativada
         */
        constructor(opcoes = {}) {
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
         * Verifica se o elemento é um input passível de navegação por setas.
         * Emprega duck-typing cross-realm (nodeType === 1 e tagName === 'INPUT') em vez de
         * instanceof HTMLInputElement para suportar subframes/iframes (Seção 6.64 / BUG-08).
         * @param {HTMLElement} el
         * @returns {boolean}
         */
        #ehInputNavegavel(el) {
            if (!el || el.nodeType !== 1 || !el.tagName || el.tagName.toUpperCase() !== 'INPUT') return false;
            if (el.disabled || el.readOnly) return false;
            const tipo = (el.type || 'text').toLowerCase();
            const tiposPermitidos = ['text', 'search', 'tel', 'url', 'email', 'number'];
            return tiposPermitidos.includes(tipo);
        }

        /**
         * Localiza todos os campos de texto válidos no escopo do documento ou formulário
         * @param {HTMLElement} inputOrigem
         * @returns {HTMLInputElement[]}
         */
        #obterCamposCandidatos(inputOrigem) {
            /* Passo 1.2: Coleta de todos os inputs visíveis, habilitados e editáveis do mesmo formulário ou container */
            const doc = (inputOrigem && inputOrigem.ownerDocument) || (typeof document !== 'undefined' ? document : null);
            const container = (inputOrigem && inputOrigem.form) || (inputOrigem && typeof inputOrigem.closest === 'function' && inputOrigem.closest('#containerLinhasEntradaDemo, table, form, .cartao, .container, main, body')) || (doc && doc.body);
            if (!container || typeof container.querySelectorAll !== 'function') return [];
            const todos = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled]):not([readonly])'));
            return todos.filter(el => this.#ehInputNavegavel(el) && (el.offsetParent !== null || (typeof el.getClientRects === 'function' && el.getClientRects().length > 0)));
        }

        /**
         * Move o foco para o próximo campo ou campo anterior
         * @param {HTMLInputElement} inputAtual
         * @param {number} direcao - 1 para avançar (ArrowDown), -1 para retroceder (ArrowUp)
         * @returns {boolean} True se o foco foi alterado
         */
        navegarParaCampo(inputAtual, direcao) {
            if (!this.#ativo || !this.#ehInputNavegavel(inputAtual)) {
                return false;
            }

            const candidatos = this.#obterCamposCandidatos(inputAtual);
            if (candidatos.length <= 1) return false;

            const idxAtual = candidatos.indexOf(inputAtual);
            if (idxAtual === -1) return false;

            let novoIdx = idxAtual + (direcao > 0 ? 1 : -1);
            if (novoIdx < 0) novoIdx = candidatos.length - 1;
            if (novoIdx >= candidatos.length) novoIdx = 0;

            const alvo = candidatos[novoIdx];
            if (alvo) {
                try {
                    alvo.focus();
                    if (typeof alvo.select === 'function') {
                        alvo.select();
                    }
                    return true;
                } catch (_) { }
            }

            return false;
        }

        /**
         * Trata o evento keydown em inputs
         * @param {KeyboardEvent} e
         * @returns {boolean} True se o evento foi interceptado
         */
        tratarEventoTeclado(e) {
            if (!this.#ativo || !e) return false;
            if (e.altKey || e.ctrlKey || e.metaKey) return false;

            const tecla = e.key;
            if (tecla !== 'ArrowDown' && tecla !== 'ArrowUp' && tecla !== 'Down' && tecla !== 'Up') {
                return false;
            }

            const alvo = e.target;
            if (!this.#ehInputNavegavel(alvo)) return false;

            const direcao = (tecla === 'ArrowDown' || tecla === 'Down') ? 1 : -1;
            const sucesso = this.navegarParaCampo(alvo, direcao);

            if (sucesso) {
                try {
                    if (typeof e.preventDefault === 'function') e.preventDefault();
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                } catch (_) { }
                return true;
            }

            return false;
        }
    }

    Object.freeze(NavegacaoTecladoCampos.prototype);
    return Object.freeze(NavegacaoTecladoCampos);
}));
