/* ==========================================================================
 * Nome do arquivo: navegador-descarte.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-descarte.js
 * - Classe Exportada: GerenciadorDescarteGuias (self.JusGovGerenciadorDescarteGuias)
 * - Métodos Públicos: descartarInativasAgora, descartarGuiasEmSegundoPlano, executarCicloDescarte,
 *   get/set ativo, get/set tempoInatividadeMinutos
 * - APIs Chrome Usadas: chrome.tabs.query, chrome.tabs.discard
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.47, Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Implementa o "Economizador de Memória" (Tab Discarding via Chrome Tab Discarding API).
 *    Descarrega da memória RAM guias pesadas abertas em segundo plano após um período de
 *    inatividade configurável (5 a 120 minutos), preservando a aba visível na barra com
 *    recuperação instantânea ao clicar.
 * 2) SUPORTE A DESCARTE SOB DEMANDA:
 *    Permite a liberação manual imediata de RAM através do método descartarInativasAgora().
 * 3) CICLO PERIÓDICO SEGURO:
 *    Nunca descarta guias ativas (focadas), fixadas (pinned), emitindo áudio (audible)
 *    ou já descarregadas (discarded).
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
                const query = windowId ? { windowId } : { currentWindow: true };
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length === 0) return 0;

                let descartadas = 0;
                for (const t of abas) {
                    if (t.active || t.pinned || t.audible || t.discarded) continue;
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

        /**
         * Alias para descartarInativasAgora compatível com background
         * @param {number|null} windowId
         * @param {Object} chromeApi
         */
        async descartarGuiasEmSegundoPlano(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            return await this.descartarInativasAgora(windowId, chromeApi);
        }

        /**
         * Executa o ciclo periódico do economizador de memória
         * @param {Object} [config]
         * @param {Object} [chromeApi]
         */
        async executarCicloDescarte(config = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const ativo = (typeof config.descarteGuiasInativasAtivo === 'boolean') ? config.descarteGuiasInativasAtivo : this.#ativo;
            if (!ativo) return 0;
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.discard !== 'function') return 0;

            try {
                const minutos = Number(config.tempoInatividadeDescarteMinutos) || this.#tempoInatividadeMinutos || 20;
                const limiteTempoMs = minutos * 60 * 1000;
                const agora = Date.now();
                const abas = await chromeApi.tabs.query({});
                if (!Array.isArray(abas)) return 0;

                let descartadas = 0;
                for (const t of abas) {
                    if (t.active || t.pinned || t.audible || t.discarded) continue;
                    const ultimoAcesso = t.lastAccessed || 0;
                    if (ultimoAcesso > 0 && (agora - ultimoAcesso) > limiteTempoMs) {
                        try {
                            await chromeApi.tabs.discard(t.id);
                            descartadas++;
                        } catch (_) { }
                    }
                }
                return descartadas;
            } catch (_) {
                return 0;
            }
        }
    }

    Object.freeze(GerenciadorDescarteGuias.prototype);
    return Object.freeze(GerenciadorDescarteGuias);
}));
