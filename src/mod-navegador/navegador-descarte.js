/* ==========================================================================
 * Nome do arquivo: navegador-descarte.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Implementa o "Economizador de Memória" (Tab Discarding via Chrome Tab Discarding API).
 *    Descarrega da memória RAM guias pesadas abertas em segundo plano após um período de
 *    inatividade configurável (5 a 120 minutos), preservando a aba visível na barra com
 *    recuperação instantânea ao clicar.
 * 2) SUPORTE A DISCARTE SOB DEMANDA:
 *    Permite a liberação manual imediata de RAM através do método descartarInativasAgora().
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-navegador)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovGerenciadorDescarteGuias = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorDescarteGuias {
        #ativo = false;
        #tempoInatividadeMinutos = 20;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=false]
         * @param {number} [opcoes.tempoInatividadeMinutos=20]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.ativo === 'boolean') this.#ativo = opcoes.ativo;
            if (typeof opcoes.tempoInatividadeMinutos === 'number' && opcoes.tempoInatividadeMinutos > 0) {
                this.#tempoInatividadeMinutos = opcoes.tempoInatividadeMinutos;
            }
        }

        get ativo() { return this.#ativo; }
        set ativo(v) { this.#ativo = Boolean(v); }

        get tempoInatividadeMinutos() { return this.#tempoInatividadeMinutos; }
        set tempoInatividadeMinutos(v) {
            const num = Number(v);
            if (!isNaN(num) && num > 0) this.#tempoInatividadeMinutos = num;
        }

        /**
         * Descarrega guias inativas em segundo plano na janela especificada
         * @param {number|null} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>} Quantidade de guias descartadas
         */
        async descartarInativasAgora(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.discard !== 'function') return 0;

            try {
                const query = windowId ? { windowId, active: false } : { active: false };
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length === 0) return 0;

                let descartadas = 0;
                for (const t of abas) {
                    if (t.discarded || t.pinned || t.audible) continue; // Não descarta se estiver reproduzindo áudio ou fixada
                    try {
                        await chromeApi.tabs.discard(t.id);
                        descartadas++;
                    } catch (_) { }
                }
                return descartadas;
            } catch (_) {
                return 0;
            }
        }
    }

    return Object.freeze(GerenciadorDescarteGuias);
}));
