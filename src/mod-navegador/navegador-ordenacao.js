/* ==========================================================================
 * Nome do arquivo: navegador-ordenacao.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Organiza e ordena as guias da janela ativa com base no critério (domínio, URL, criação,
 *    acesso ou título) e sentido configurados (A-Z ou Z-A), integrando-se nativamente com a
 *    API de Grupos de Abas do Chrome (Tab Groups API).
 * 2) SUPORTE A TAB GROUPS:
 *    Permite agrupar guias por domínio em caixas coloridas com nomes auto-descritivos ou
 *    desagrupá-las sob demanda de forma segura sem fechá-las.
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
        raiz.JusGovGerenciadorOrdenacaoGuias = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorOrdenacaoGuias {
        #criterio = 'nenhum'; // 'nenhum', 'dominio', 'url', 'titulo', 'dominio_criacao', 'dominio_acesso'
        #sentido = 'esq_dir';  // 'esq_dir' (A-Z / Antigos), 'dir_esq' (Z-A / Recentes)
        #ordenarGuiasFixadas = false;

        /**
         * @param {Object} [opcoes={}]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.criterio === 'string') this.#criterio = opcoes.criterio;
            if (typeof opcoes.sentido === 'string') this.#sentido = opcoes.sentido;
            if (typeof opcoes.ordenarGuiasFixadas === 'boolean') this.#ordenarGuiasFixadas = opcoes.ordenarGuiasFixadas;
        }

        get criterio() { return this.#criterio; }
        set criterio(v) { this.#criterio = String(v); }

        get sentido() { return this.#sentido; }
        set sentido(v) { this.#sentido = String(v); }

        get ordenarGuiasFixadas() { return this.#ordenarGuiasFixadas; }
        set ordenarGuiasFixadas(v) { this.#ordenarGuiasFixadas = Boolean(v); }

        /**
         * Extrai domínio limpo para agrupamento e ordenação
         * @param {string} urlStr
         * @returns {string}
         */
        extrairDominio(urlStr) {
            if (!urlStr || typeof urlStr !== 'string') return 'desconhecido';
            try {
                const u = new URL(urlStr);
                return u.hostname.replace(/^www\./, '').toLowerCase();
            } catch (_) {
                return 'desconhecido';
            }
        }

        /**
         * Agrupa as guias da janela ativa por domínio utilizando a Tab Groups API
         * @param {number} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>} Quantidade de grupos criados
         */
        async agruparPorDominio(windowId, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.group !== 'function') return 0;

            try {
                const abas = await chromeApi.tabs.query({ windowId });
                if (!abas || abas.length === 0) return 0;

                const porDominio = new Map();
                for (const t of abas) {
                    if (t.pinned) continue;
                    const dom = this.extrairDominio(t.url || t.pendingUrl);
                    if (dom === 'desconhecido' || dom.includes('newtab')) continue;

                    if (!porDominio.has(dom)) porDominio.set(dom, []);
                    porDominio.get(dom).push(t.id);
                }

                let gruposCriados = 0;
                for (const [dom, tabIds] of porDominio.entries()) {
                    if (tabIds.length >= 2) {
                        const groupId = await chromeApi.tabs.group({ tabIds });
                        if (chromeApi.tabGroups && typeof chromeApi.tabGroups.update === 'function') {
                            await chromeApi.tabGroups.update(groupId, {
                                title: dom.toUpperCase(),
                                collapsed: false
                            }).catch(() => { });
                        }
                        gruposCriados++;
                    }
                }
                return gruposCriados;
            } catch (_) {
                return 0;
            }
        }

        /**
         * Desagrupa todas as guias da janela
         * @param {number|null} windowId
         * @param {Object} chromeApi
         * @returns {Promise<number>}
         */
        async desagruparTodas(windowId = null, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.tabs || typeof chromeApi.tabs.ungroup !== 'function') return 0;

            try {
                const query = windowId ? { windowId } : { currentWindow: true };
                const abas = await chromeApi.tabs.query(query);
                if (!abas || abas.length === 0) return 0;

                const noneId = (chromeApi.tabGroups && chromeApi.tabGroups.TAB_GROUP_ID_NONE !== undefined) ? chromeApi.tabGroups.TAB_GROUP_ID_NONE : -1;
                const agrupadas = abas.filter(t => t.groupId !== undefined && t.groupId !== noneId).map(t => t.id);

                if (agrupadas.length > 0) {
                    await chromeApi.tabs.ungroup(agrupadas);
                    return agrupadas.length;
                }
                return 0;
            } catch (_) {
                return 0;
            }
        }
    }

    return Object.freeze(GerenciadorOrdenacaoGuias);
}));
