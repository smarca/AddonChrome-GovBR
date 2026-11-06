/* ==========================================================================
 * Nome do arquivo: navegador-anti-duplicacao.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Implementa a política anti-duplicação de guias: reutiliza guias já abertas na mesma janela
 *    em vez de abrir novas abas duplicadas, monitorando a URL original e atual.
 * 2) SALVAGUARDA DE FORMULÁRIOS E SPAS:
 *    Protege o trabalho do operador: se a página existente possuir formulários em edição
 *    ou navegação SPA ativa, não a reutiliza para evitar descarte acidental de dados.
 * 3) FECHAMENTO EM LOTE:
 *    Fornece o método fecharGuiasDuplicadas() para limpeza manual de abas repetidas sob demanda.
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
        raiz.JusGovGerenciadorAntiDuplicacao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorAntiDuplicacao {
        #reutilizarAbasAbertas = true;
        #focoPrimeiroPlano = true;
        #monitorarUrlOriginal = false;
        #monitorarUrlAtual = true;
        #protegerGuiasModificadas = true;
        #acaoConteudo = 'manter'; // 'manter', 'recarregar', 'recarregar_se_nao_modificada'

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.reutilizarAbasAbertas === 'boolean') {
                this.#reutilizarAbasAbertas = opcoes.reutilizarAbasAbertas;
            }
            if (typeof opcoes.focoPrimeiroPlano === 'boolean') {
                this.#focoPrimeiroPlano = opcoes.focoPrimeiroPlano;
            }
            if (typeof opcoes.monitorarUrlOriginal === 'boolean') {
                this.#monitorarUrlOriginal = opcoes.monitorarUrlOriginal;
            }
            if (typeof opcoes.monitorarUrlAtual === 'boolean') {
                this.#monitorarUrlAtual = opcoes.monitorarUrlAtual;
            }
            if (typeof opcoes.protegerGuiasModificadas === 'boolean') {
                this.#protegerGuiasModificadas = opcoes.protegerGuiasModificadas;
            }
            if (typeof opcoes.acaoConteudo === 'string') {
                this.#acaoConteudo = opcoes.acaoConteudo;
            }
        }

        get reutilizarAbasAbertas() { return this.#reutilizarAbasAbertas; }
        set reutilizarAbasAbertas(v) { this.#reutilizarAbasAbertas = Boolean(v); }

        get focoPrimeiroPlano() { return this.#focoPrimeiroPlano; }
        set focoPrimeiroPlano(v) { this.#focoPrimeiroPlano = Boolean(v); }

        get monitorarUrlOriginal() { return this.#monitorarUrlOriginal; }
        set monitorarUrlOriginal(v) { this.#monitorarUrlOriginal = Boolean(v); }

        get monitorarUrlAtual() { return this.#monitorarUrlAtual; }
        set monitorarUrlAtual(v) { this.#monitorarUrlAtual = Boolean(v); }

        get protegerGuiasModificadas() { return this.#protegerGuiasModificadas; }
        set protegerGuiasModificadas(v) { this.#protegerGuiasModificadas = Boolean(v); }

        get acaoConteudo() { return this.#acaoConteudo; }
        set acaoConteudo(v) { this.#acaoConteudo = String(v); }

        /**
         * Normaliza URLs para comparação descartando fragmentos de hash e parâmetros irrelevantes
         * @param {string} urlStr
         * @returns {string}
         */
        normalizarUrl(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') return '';
            try {
                const u = new URL(urlStr);
                return (u.origin + u.pathname).toLowerCase().replace(/\/+$/, '');
            } catch (_) {
                return urlStr.split('#')[0].split('?')[0].toLowerCase().trim().replace(/\/+$/, '');
            }
        }

        /**
         * Encontra todas as guias com URL duplicada na janela especificada e as encerra
         * @param {number|null} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>} Quantidade de guias duplicadas fechadas
         */
        async fecharGuiasDuplicadas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.query !== 'function') return 0;

            try {
                const query = windowId ? { windowId } : { currentWindow: true };
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length <= 1) return 0;

                const vistas = new Set();
                const idsParaFechar = [];

                for (const t of abas) {
                    if (t.pinned) continue; // Nunca fecha guias fixadas
                    const urlNorm = this.normalizarUrl(t.url || t.pendingUrl);
                    if (!urlNorm || urlNorm === 'chrome://newtab' || urlNorm.startsWith('chrome://')) continue;

                    if (vistas.has(urlNorm)) {
                        idsParaFechar.push(t.id);
                    } else {
                        vistas.add(urlNorm);
                    }
                }

                if (idsParaFechar.length > 0) {
                    await chromeApi.tabs.remove(idsParaFechar);
                }
                return idsParaFechar.length;
            } catch (_) {
                return 0;
            }
        }
    }

    return Object.freeze(GerenciadorAntiDuplicacao);
}));
