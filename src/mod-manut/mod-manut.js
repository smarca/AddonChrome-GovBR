/* ==========================================================================
 * Nome do arquivo: mod-manut.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Privacidade e Manutenção do Navegador
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-manut/mod-manut.js
 * - Classe Exportada: ModuloManutencao (self.JusGovModuloManutencao)
 * - Métodos Públicos: definirProvedorConfig(fn), obterMsIdadeLimpeza(idadeStr),
 *   executarAutoLimpezaCacheECookies(forcar, inicioSessao, obterConfigFn)
 * - Regras / Seções: Diretriz 14, Diretriz 16, Seção 6.141 (Auto-Limpeza de Cache e Cookies Antigos)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Encapsula a rotina de manutenção automática e manual de cache, cacheStorage
 *    e cookies antigos do navegador, avaliando a janela temporal de expiração
 *    configurada (12h, 1d, 3d, 7d, 15d, 30d) e a autorização da sessão ativa.
 * 2) ISOLAMENTO:
 *    Executa no contexto do Service Worker (Manifest V3) via importScripts,
 *    com proteção try/catch para disponibilidade da API chrome.browsingData.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md
 * - docs/02_ARQUITETURA_E_AS_BUILT.md
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloManutencao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ModuloManutencao {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
        }

        /**
         * Define dinamicamente a função assíncrona responsável por ler as configurações atuais.
         * @param {Function} fn
         */
        definirProvedorConfig(fn) {
            if (typeof fn === 'function') {
                this._obterConfig = fn;
            }
        }

        /**
         * Converte a string de idade de retenção configurada para milissegundos.
         * @param {string} idadeStr - '12h' | '1d' | '3d' | '7d' | '15d' | '30d'
         * @returns {number}
         */
        obterMsIdadeLimpeza(idadeStr) {
            switch (String(idadeStr || '7d')) {
                case '12h': return 12 * 3600 * 1000;
                case '1d': return 24 * 3600 * 1000;
                case '3d': return 3 * 24 * 3600 * 1000;
                case '15d': return 15 * 24 * 3600 * 1000;
                case '30d': return 30 * 24 * 3600 * 1000;
                case '7d':
                default: return 7 * 24 * 3600 * 1000;
            }
        }

        /**
         * Executa a limpeza de cache, cacheStorage e cookies caso a regra temporal permita ou seja forçada.
         * @param {boolean} [forcar=false]
         * @param {boolean} [inicioSessao=false]
         * @param {Function} [obterConfigFn]
         * @returns {Promise<{ok: boolean, motivo?: string, timestamp?: number, idade?: string, ultimaTs?: number, erro?: string}>}
         */
        async executarAutoLimpezaCacheECookies(forcar = false, inicioSessao = false, obterConfigFn) {
            try {
                const provedor = typeof obterConfigFn === 'function'
                    ? obterConfigFn
                    : (this._obterConfig || (typeof obterConfiguracoesGerais === 'function' ? obterConfiguracoesGerais : null));
                const config = provedor ? await provedor() : { autoLimpezaCacheCookiesAtiva: true, autoLimpezaIdade: '7d' };

                if (!forcar && !config.autoLimpezaCacheCookiesAtiva) {
                    return { ok: false, motivo: 'desativado' };
                }
                if (typeof chrome === 'undefined' || !chrome.browsingData || typeof chrome.browsingData.remove !== 'function') {
                    return { ok: false, motivo: 'api_indisponivel' };
                }

                const idadeMs = this.obterMsIdadeLimpeza(config.autoLimpezaIdade);
                const dadosLocal = await chrome.storage.local.get(['ultimaLimpezaCacheCookiesTs']);
                const ultimaTs = Number(dadosLocal.ultimaLimpezaCacheCookiesTs || 0);
                let sessaoAutorizada = false;

                if (chrome.storage && chrome.storage.session) {
                    const sess = await chrome.storage.session.get(['limpezaSessaoAutorizada']);
                    if (inicioSessao) {
                        sessaoAutorizada = !ultimaTs || (Date.now() - ultimaTs) >= idadeMs;
                        await chrome.storage.session.set({ limpezaSessaoAutorizada: sessaoAutorizada });
                    } else {
                        sessaoAutorizada = Boolean(sess.limpezaSessaoAutorizada);
                    }
                } else {
                    sessaoAutorizada = !ultimaTs || (Date.now() - ultimaTs) >= idadeMs;
                }

                if (!forcar && !sessaoAutorizada) {
                    return { ok: false, motivo: 'dentro_do_prazo', ultimaTs };
                }

                await chrome.browsingData.remove({ since: 0 }, {
                    cache: true,
                    cacheStorage: true,
                    cookies: true
                });

                const agora = Date.now();
                await chrome.storage.local.set({ ultimaLimpezaCacheCookiesTs: agora });
                return { ok: true, timestamp: agora, idade: config.autoLimpezaIdade };
            } catch (e) {
                return { ok: false, erro: String(e && e.message ? e.message : e) };
            }
        }
    }

    Object.freeze(ModuloManutencao.prototype);
    Object.freeze(ModuloManutencao);

    return ModuloManutencao;
}));
