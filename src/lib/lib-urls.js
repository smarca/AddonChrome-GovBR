/* ==========================================================================
 * Nome do arquivo: lib-urls.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Roteamento, Máscaras e Correspondência de URLs
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-urls.js
 * - Classe Exportada: JusGovUrls (self.JusGovUrls / window.JusGovUrls)
 * - Métodos Públicos: sanitizarParaMatches(urls), urlCorrespondeAosPadroes(url, padroes), ehDominioPjeOuJusGov(url)
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seção 2 (BP-06 / ARQ-01)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Biblioteca pura de sanitização e compatibilização de URLs com a gramática estrita
 *    de Match Patterns da API chrome.scripting (esquema://host/caminho) e checagem
 *    de URLs contra máscaras com curingas para injeção seletiva.
 * 2) COMPATIBILIDADE TURBOFAN (V8):
 *    Utiliza regex pré-validadas e estruturas de Set nativas para deduplicação O(1).
 * 3) PRESERVAÇÃO DOCUMENTAL:
 *    Comentários e passos de reconstrução originais 100% preservados.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovUrls = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class JusGovUrls {
        constructor() {
            /* Padrão POO selado */
        }

        /*
         * FUNCAO / MÉTODO: sanitizarParaMatches
         * OBJETIVO DE RECONSTRUCAO: Converter a lista de URLs digitada pelo usuario na
         * pagina de Opcoes em Match Patterns estritamente validos segundo a gramatica
         * da API C++ chrome.scripting (esquema://host/caminho), descartando entradas
         * vazias e normalizando curingas de subdominio (ex: "*pje*.jus.br" -> "*.jus.br").
         */
        sanitizarParaMatches(urls) {
            /* Passo 2.1: Validar se a entrada e um array nao-vazio */
            if (!Array.isArray(urls) || urls.length === 0) return [];
            const limpos = new Set();

            /* Passo 2.2: Iterar sobre cada mascara, higienizar espacos e validar sintaxe */
            for (let i = 0; i < urls.length; i++) {
                const bruta = urls[i];
                if (!bruta || typeof bruta !== 'string') continue;

                const url = bruta.trim();
                if (url === '') continue;

                if (url === '<all_urls>' || url === '*://*/*') {
                    limpos.add('<all_urls>');
                    continue;
                }

                const regex = /^(\*|https?|file|ftp):\/\/([^\/]+)(\/.*)?$/i;
                const match = url.match(regex);

                if (match) {
                    const protocolo = match[1].toLowerCase();
                    let host = match[2].toLowerCase();
                    const path = match[3] || '/*';

                    /* O Chrome exige que '*' no host seja o unico caractere ou seguido por '.' */
                    if (host.includes('*') && host !== '*') {
                        const ultimoAsterisco = host.lastIndexOf('*');
                        const pontoAposAsterisco = host.indexOf('.', ultimoAsterisco);
                        if (pontoAposAsterisco !== -1) {
                            host = '*' + host.substring(pontoAposAsterisco);
                        } else {
                            host = '*';
                        }
                    }
                    limpos.add(`${protocolo}://${host}${path}`);
                } else if (!url.includes('://')) {
                    /* Se o usuario digitou apenas o dominio (ex: "*.trf1.jus.br"), adiciona esquema e path */
                    let hostLimpo = url.replace(/\/.*$/, '').toLowerCase();
                    if (hostLimpo.includes('*') && hostLimpo !== '*') {
                        const ultimoAsterisco = hostLimpo.lastIndexOf('*');
                        const pontoAposAsterisco = hostLimpo.indexOf('.', ultimoAsterisco);
                        if (pontoAposAsterisco !== -1) {
                            hostLimpo = '*' + hostLimpo.substring(pontoAposAsterisco);
                        } else {
                            hostLimpo = '*';
                        }
                    }
                    limpos.add(`*://${hostLimpo}/*`);
                }
            }

            return Array.from(limpos);
        }

        /*
         * FUNCAO / MÉTODO: urlCorrespondeAosPadroes
         * OBJETIVO DE RECONSTRUCAO: Verificar em JavaScript se a URL de uma aba aberta
         * e compativel com a lista de mascaras configurada antes de realizar injecao
         * retroativa via chrome.scripting.executeScript.
         */
        urlCorrespondeAosPadroes(url, padroes) {
            /* Passo 2.3: Bloquear esquemas internos protegidos do navegador onde a injecao e proibida */
            if (!url || typeof url !== 'string') return false;
            if (/^(?:chrome|edge|about|devtools|view-source|chrome-extension):/i.test(url)) {
                return false;
            }
            if (!Array.isArray(padroes) || padroes.length === 0) return false;

            /* Passo 2.4: Testar cada mascara convertendo '*' em '.*' */
            for (let i = 0; i < padroes.length; i++) {
                const padrao = padroes[i];
                if (!padrao) continue;
                if (padrao === '<all_urls>' || padrao === '*://*/*') return true;

                try {
                    const regexEscapada = padrao.trim().replace(/[.+^${}()|[\]\\]/g, '\\$&');
                    const regexStr = regexEscapada.replace(/\*/g, '.*');
                    const regex = new RegExp('^' + regexStr + '$', 'i');
                    if (regex.test(url)) return true;
                } catch (_) {
                    continue;
                }
            }
            return false;
        }

        /*
         * FUNCAO / MÉTODO: ehDominioPjeOuJusGov
         * OBJETIVO DE RECONSTRUCAO: Avalia se uma URL pertence a dominios governamentais,
         * judiciais ou sistemas processuais brasileiros (.jus.br, .gov.br, .leg.br, .mp.br,
         * ou hosts contendo pje, eproc, projudi, seeu, saj).
         */
        ehDominioPjeOuJusGov(url) {
            if (!url || typeof url !== 'string') return false;
            try {
                const parsed = new URL(url);
                const host = parsed.hostname.toLowerCase();
                return (
                    host.endsWith('.jus.br') ||
                    host.endsWith('.gov.br') ||
                    host.endsWith('.leg.br') ||
                    host.endsWith('.mp.br') ||
                    host.includes('pje') ||
                    host.includes('eproc') ||
                    host.includes('projudi') ||
                    host.includes('seeu') ||
                    host.includes('saj')
                );
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(JusGovUrls.prototype);
    return Object.freeze(JusGovUrls);
}));

