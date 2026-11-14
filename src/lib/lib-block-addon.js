/* ==========================================================================
 * Nome do arquivo: lib-block-addon.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Casulo, Proteção de Acesso Externo e Roteador Seguro
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-block-addon.js
 * - Classe Exportada: JusGovBlockAddon (self.JusGovBlockAddon / window.JusGovBlockAddon)
 * - Métodos Públicos:
 *     rotearUrlNavegacao(url, prefixoExtensao),
 *     obterAbaPorParametro(urlOuSearch),
 *     validarContexto(windowObj),
 *     aplicarCasulo(windowObj)
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Options, Popup e suíte de testes.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seção 6.106 (SEC-01 / ARQ-04), Diretriz Root 5.19
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Casulo de proteção do addon contra acessos indevidos externos e roteador inteligente de navegação:
 *    - Roteamento inteligente na raiz da extensão:
 *      * chrome-extension://<id>/ ou chrome-extension://<id> -> Redireciona para src/cfg/options.html
 *      * chrome-extension://<id>/?config -> Abre a aba de Configurações
 *      * chrome-extension://<id>/?ajuda -> Abre a aba Central de Ajuda
 *      * chrome-extension://<id>/?lab -> Abre a aba do Laboratório de Testes
 *    - Bloqueio de acesso direto digitado na barra de navegação para scripts (.js), estilos (.css)
 *      ou manifestos (.json), redirecionando compulsoriamente para src/cfg/options.html.
 *    - Detecção e seleção de abas automática na inicialização da página de opções.
 * 2) PERFORMANCE E SOBRECARGA ZERO:
 *    Funções estáticas puras, imutáveis (Object.freeze), sem alocações dinâmicas repetitivas
 *    e sem listeners desnecessários, preservando latência zero no navegador.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovBlockAddon = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class JusGovBlockAddon {
        constructor() {
            /* Padrão POO selado */
        }

        /**
         * Roteia uma URL direcionada à extensão, bloqueando acesso direto a arquivos de scripts
         * ou direcionando parâmetros do casulo (?config, ?ajuda, ?lab) para options.html.
         * @param {string} url - URL completa da navegação
         * @param {string} [prefixoExtensao=""] - Prefixo 'chrome-extension://<id>/'
         * @returns {string|null} URL de destino autorizada ou null se a URL já estiver correta
         */
        static rotearUrlNavegacao(url, prefixoExtensao = '') {
            if (!url || typeof url !== 'string') return null;

            /* Identifica o prefixo caso não tenha sido explicitamente fornecido */
            let prefixo = prefixoExtensao;
            if (!prefixo) {
                const matchPrefixo = url.match(/^(chrome-extension:\/\/[a-z0-9_-]+)\/?/i);
                if (matchPrefixo) {
                    prefixo = matchPrefixo[1] + '/';
                }
            }
            if (!prefixo || !url.startsWith(prefixo.replace(/\/$/, ''))) return null;

            /* Normalização do caminho relativo à extensão */
            let caminhoRelativo = url.slice(prefixo.length);
            if (caminhoRelativo.startsWith('/')) caminhoRelativo = caminhoRelativo.slice(1);

            const optionsUrl = prefixo + 'src/cfg/options.html';

            /* Caso 1: Acesso direto à raiz da extensão (chrome-extension://<id> ou chrome-extension://<id>/) */
            if (!caminhoRelativo || caminhoRelativo === '' || caminhoRelativo === '/' || caminhoRelativo.startsWith('?')) {
                const aba = JusGovBlockAddon.obterAbaPorParametro(caminhoRelativo);
                if (aba && aba !== 'abaConfiguracoes') {
                    const hashAba = (aba === 'abaAjuda') ? '#ajuda' : ((aba === 'abaLaboratorio') ? '#laboratorio' : '#configuracoes');
                    return optionsUrl + hashAba;
                }
                return optionsUrl;
            }

            /* Caso 2: Bloqueio de acesso direto a arquivos de scripts, estilos ou dados digitados na URL */
            const padraoArquivoProtegido = /\.(?:js|css|json)(?:[?#].*)?$/i;
            if (padraoArquivoProtegido.test(caminhoRelativo)) {
                return optionsUrl;
            }

            /* Caso 3: Acesso ao options com parâmetros de consulta */
            if (caminhoRelativo.startsWith('src/cfg/options.html?')) {
                const query = caminhoRelativo.slice('src/cfg/options.html'.length);
                const aba = JusGovBlockAddon.obterAbaPorParametro(query);
                if (aba) {
                    const hashAba = (aba === 'abaAjuda') ? '#ajuda' : ((aba === 'abaLaboratorio') ? '#laboratorio' : '#configuracoes');
                    const destinoComHash = optionsUrl + hashAba;
                    if (destinoComHash !== url) {
                        return destinoComHash;
                    }
                }
            }

            return null;
        }

        /**
         * Identifica a aba correspondente do options.html a partir de parâmetros de consulta ou hash.
         * @param {string} urlOuSearch - String de busca (?config) ou hash (#ajuda)
         * @returns {string} ID da aba: 'abaConfiguracoes', 'abaAjuda' ou 'abaLaboratorio'
         */
        static obterAbaPorParametro(urlOuSearch) {
            if (!urlOuSearch || typeof urlOuSearch !== 'string') {
                return 'abaConfiguracoes';
            }
            const s = urlOuSearch.toLowerCase();

            if (s.includes('ajuda') || s.includes('help')) {
                return 'abaAjuda';
            }
            if (s.includes('lab') || s.includes('test') || s.includes('sandbox')) {
                return 'abaLaboratorio';
            }
            if (s.includes('config') || s.includes('opcao') || s.includes('options') || s.includes('preferencia')) {
                return 'abaConfiguracoes';
            }

            return 'abaConfiguracoes';
        }

        /**
         * Valida se o contexto de execução atual é uma página legítima do addon.
         * @param {Window|Object} [windowObj]
         * @returns {boolean} True se autorizado
         */
        static validarContexto(windowObj = (typeof window !== 'undefined' ? window : null)) {
            if (!windowObj || !windowObj.location) return false;
            return windowObj.location.protocol === 'chrome-extension:';
        }

        /**
         * Aplica a proteção em tempo de execução dentro de páginas do addon.
         * @param {Window|Object} [windowObj]
         * @returns {string|null} Aba ativada ou null
         */
        static aplicarCasulo(windowObj = (typeof window !== 'undefined' ? window : null)) {
            if (!windowObj || !windowObj.location) return null;
            if (windowObj.location.protocol !== 'chrome-extension:') return null;

            const searchOuHash = (windowObj.location.search || '') + (windowObj.location.hash || '');
            return JusGovBlockAddon.obterAbaPorParametro(searchOuHash);
        }
    }

    Object.freeze(JusGovBlockAddon.prototype);
    return Object.freeze(JusGovBlockAddon);
}));

