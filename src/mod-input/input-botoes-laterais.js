/* ==========================================================================
 * Nome do arquivo: input-botoes-laterais.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-botoes-laterais.js
 * - Classe Exportada: BotoesLateraisMouse (window.JusGovBotoesLateraisMouse)
 * - Métodos Públicos: processarEventoMouse(e), simularDisparo(numeroBotao), get/set ativo
 * - Canais IPC: chrome.runtime.sendMessage({ acao: 'TROCAR_GUIA_ULTIMA_ATIVA' | 'TROCAR_GUIA_PROXIMA' })
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.46, Seção 6.53, Seção 6.64, Seção 6.118 (BUG-48)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Captura e tratamento exclusivo dos botões físicos laterais do mouse (Botão 4: Voltar;
 *    Botão 5: Avançar) para permitir a alternância entre abas no navegador:
 *    - Botão 4 (Voltar): Alterna entre as duas guias usadas mais recentemente (ciclo ping-pong LRU).
 *    - Botão 5 (Avançar): Avança para a próxima aba aberta à direita no índice da janela.
 *    - Opera via comando direto da API nativa do Chrome neutralizando rigorosamente o retorno de
 *      histórico nativo da página em mousedown, mouseup, pointerdown e auxclick.
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe BotoesLateraisMouse com campos privados (#) e método público
 *    processarEventoMouse(evento). Blindagem contra exceções de DOM e desacoplamento via IPC.
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Identificação rápida do botão através de event.button (3 para botão 4; 4 para botão 5)
 *               e máscara de bits event.buttons (8 para botão 4; 16 para botão 5).
 *    Passo 1.2: Neutralização imediata da propagação (preventDefault, stopPropagation e stopImmediatePropagation)
 *               em todas as fases de evento para impedir que o navegador execute a ação nativa de histórico voltar/avançar.
 *    Passo 1.3: Envio de mensagem assíncrona ao Service Worker (background.js) com as ações
 *               'TROCAR_GUIA_ULTIMA_ATIVA' (Botão 4) ou 'TROCAR_GUIA_PROXIMA' (Botão 5).
 *    Passo 1.4: Tratamento de tolerância a falhas caso o runtime do Chrome esteja indisponível.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-input)
 * - docs/03_BACKLOG_TAREFAS_E_FEATURES.md (Seção 6.46, 6.53 e 6.118 / BUG-48)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovBotoesLateraisMouse = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class BotoesLateraisMouse {
        #ativo = true;
        #ultimoDisparoTimestamp = 0;
        #intervaloMinimoDisparoMs = 80;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true] - Estado inicial de ativação do recurso
         * @param {number} [opcoes.intervaloMinimoDisparoMs=80] - Debounce mínimo entre cliques rápidos
         */
        constructor(opcoes = {}) {
            /* Passo 1.1: Inicialização defensiva de parâmetros */
            if (typeof opcoes.ativo === 'boolean') {
                this.#ativo = opcoes.ativo;
            }
            if (typeof opcoes.intervaloMinimoDisparoMs === 'number' && opcoes.intervaloMinimoDisparoMs >= 0) {
                this.#intervaloMinimoDisparoMs = opcoes.intervaloMinimoDisparoMs;
            }
        }

        /**
         * @returns {boolean} Se o monitoramento está ativado
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
         * Determina se o evento do mouse corresponde ao Botão Lateral 4 (Voltar / Aba Mais Recente)
         * @param {MouseEvent} e
         * @returns {boolean}
         */
        #ehBotao4Voltar(e) {
            /* Passo 1.2: Checagem por button padronizado (3), which (4) ou bitmask (8) */
            if (!e) return false;
            return e.button === 3 || e.which === 4 || (typeof e.buttons === 'number' && (e.buttons & 8) === 8);
        }

        /**
         * Determina se o evento do mouse corresponde ao Botão Lateral 5 (Avançar / Próxima Aba à Direita)
         * @param {MouseEvent} e
         * @returns {boolean}
         */
        #ehBotao5Avancar(e) {
            /* Passo 1.3: Checagem por button padronizado (4), which (5) ou bitmask (16) */
            if (!e) return false;
            return e.button === 4 || e.which === 5 || (typeof e.buttons === 'number' && (e.buttons & 16) === 16);
        }

        /**
         * Processa o evento de mouse e despacha a troca de guias caso corresponda aos botões laterais
         * @param {MouseEvent} e
         * @returns {boolean} True se o evento foi interceptado e tratado; False caso contrário
         */
        processarEventoMouse(e) {
            /* Passo 2.1: Guarda de ativação e integridade do evento */
            if (!this.#ativo || !e || typeof e.button !== 'number') {
                return false;
            }

            const ehVoltar = this.#ehBotao4Voltar(e);
            const ehAvancar = this.#ehBotao5Avancar(e);

            if (!ehVoltar && !ehAvancar) {
                return false;
            }

            /* Passo 2.2: Cancelamento absoluto de propagação e ação nativa do navegador */
            try {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            } catch (_) { }

            /* Em eventos de soltura (up) ou auxclick, apenas neutralizamos a ação nativa e encerramos */
            if (e.type === 'mouseup' || e.type === 'pointerup' || e.type === 'keyup' || e.type === 'auxclick') {
                return true;
            }

            /* Passo 2.3: Debounce de proteção contra múltiplos disparos mecânicos de hardware */
            const agora = Date.now();
            if (agora - this.#ultimoDisparoTimestamp < this.#intervaloMinimoDisparoMs) {
                return true;
            }
            this.#ultimoDisparoTimestamp = agora;

            /* Passo 2.4 (FEAT-29 / BUG-48): Despacho de ação para Botão 4 e Botão 5.
             * Botão 4 sem Ctrl: Alterna entre as duas abas mais recentes (LRU ping-pong).
             * Botão 4 com Ctrl: Retorna no histórico da página atual (window.history.back()).
             * Botão 5: Avança para a próxima aba aberta à direita. */
            if (ehVoltar && e.ctrlKey) {
                try {
                    if (typeof window !== 'undefined' && window.history && typeof window.history.back === 'function') {
                        window.history.back();
                    }
                } catch (_) { }
                return true;
            }
            const acaoAlvo = ehVoltar ? 'TROCAR_GUIA_ULTIMA_ATIVA' : 'TROCAR_GUIA_PROXIMA';
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: acaoAlvo }).catch(() => { });
                }
            } catch (_) { }

            return true;
        }

        /**
         * Executa o teste de diagnóstico simulando os botões laterais
         * @param {number} numeroBotao - 4 para voltar/última recente, 5 para avançar/próxima à direita
         * @returns {{ ok: boolean, acao: string }}
         */
        simularDisparo(numeroBotao) {
            if (!this.#ativo) {
                return { ok: false, acao: 'INATIVO' };
            }
            const acao = (numeroBotao === 4 ? 'TROCAR_GUIA_ULTIMA_ATIVA' : 'TROCAR_GUIA_PROXIMA');
            return { ok: true, acao };
        }
    }

    Object.freeze(BotoesLateraisMouse.prototype);
    return Object.freeze(BotoesLateraisMouse);
}));
