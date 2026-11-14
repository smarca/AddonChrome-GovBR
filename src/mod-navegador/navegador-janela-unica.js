/* ==========================================================================
 * Nome do arquivo: navegador-janela-unica.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 4 - NAVEGADOR: Gerenciamento de Guias e Janelas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-navegador/navegador-janela-unica.js
 * - Classe Exportada: GerenciadorJanelaUnica (self.JusGovGerenciadorJanelaUnica)
 * - Métodos Públicos: ehJanelaDeAutenticacao(janela, urlStr, tituloStr), processarNovaJanela(novaJanela, chromeApi), get/set bloquearNovasJanelas, get/set preservarJanelasAutenticacao
 * - APIs Chrome Usadas: chrome.windows.getAll, chrome.windows.remove, chrome.windows.update, chrome.tabs.query, chrome.tabs.move, chrome.tabs.update
 * - Regras / Seções: Diretrizes 11/14/16, Seção 6.47, Seção 6.64 (blindagem POO)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Implementa a funcionalidade de "Janela Única" (Single Window): bloqueia a abertura de
 *    novas janelas avulsas e popups no navegador, forçando sua conversão automática em novas
 *    guias na mesma janela principal ativa.
 * 2) PRESERVAÇÃO DE CERTIFICADOS DIGITAIS E AUTENTICAÇÃO:
 *    Identifica e preserva janelas essenciais de autenticação governamental e certificados
 *    digitais (Gov.br, ICP-Brasil, PJEOffice, SSO, Shodô), permitindo que abram em janelas
 *    modais próprias sem serem forçadas em guias comuns.
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Guarda de ativação e identificação de tipo de janela (windowTypes: normal).
 *    Passo 1.2: Checagem de exceção de autenticação (ehJanelaDeAutenticacao).
 *    Passo 1.3: Migração de abas da nova janela para a janela principal e fechamento da janela avulsa.
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
        raiz.JusGovGerenciadorJanelaUnica = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorJanelaUnica {
        #bloquearNovasJanelas = true;
        #preservarJanelasAutenticacao = true;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.bloquearNovasJanelas=true]
         * @param {boolean} [opcoes.preservarJanelasAutenticacao=true]
         */
        constructor(opcoes = {}) {
            if (typeof opcoes.bloquearNovasJanelas === 'boolean') {
                this.#bloquearNovasJanelas = opcoes.bloquearNovasJanelas;
            }
            if (typeof opcoes.preservarJanelasAutenticacao === 'boolean') {
                this.#preservarJanelasAutenticacao = opcoes.preservarJanelasAutenticacao;
            }
        }

        get bloquearNovasJanelas() { return this.#bloquearNovasJanelas; }
        set bloquearNovasJanelas(v) { this.#bloquearNovasJanelas = Boolean(v); }

        get preservarJanelasAutenticacao() { return this.#preservarJanelasAutenticacao; }
        set preservarJanelasAutenticacao(v) { this.#preservarJanelasAutenticacao = Boolean(v); }

        /**
         * Identifica se uma janela recém-criada corresponde a autenticação/certificado que não deve ser convertida
         * @param {Object} janela
         * @param {string} [urlStr='']
         * @param {string} [tituloStr='']
         * @returns {boolean}
         */
        ehJanelaDeAutenticacao(janela, urlStr = '', tituloStr = '') {
            if (!this.#preservarJanelasAutenticacao) return false;
            let alvoUrl = urlStr;
            let alvoJanela = janela;
            if (typeof janela === 'string') {
                alvoUrl = janela;
                alvoJanela = { type: 'normal' };
            }
            if (!alvoJanela) return false;

            /* Janelas popup ou painéis do sistema com dimensões típicas de login */
            if (alvoJanela.type === 'popup' || alvoJanela.type === 'panel') {
                const w = alvoJanela.width || 0;
                const h = alvoJanela.height || 0;
                if (w > 0 && w <= 820 && h > 0 && h <= 750) {
                    return true;
                }
            }

            const urlLower = String(alvoUrl || '').toLowerCase();
            const titLower = String(tituloStr || '').toLowerCase();

            /* Endpoints estritos e ferramentas de autenticação/certificados digitais */
            const dominiosAuth = [
                'sso.acesso.gov.br', 'acesso.gov.br', 'icp-brasil.org.br',
                'portal.icp-brasil.org.br', 'pjeoffice', 'shodo', 'shodô',
                'assinador'
            ];
            if (dominiosAuth.some(d => urlLower.includes(d))) return true;

            /* Padrões de protocolo/caminho com fronteira estrita de delimitadores (evita falsos positivos como "processo") */
            const regexFronteiraAuth = /(?:^|[./?&=_\s-])(?:sso|oauth|openid|saml|login|auth|autenticacao|certificado|token|validar)(?:[./?&=_\s-]|$)/i;
            if (regexFronteiraAuth.test(urlLower) || regexFronteiraAuth.test(titLower)) {
                return true;
            }

            return false;
        }

        /**
         * Processa o evento chrome.windows.onCreated para converter a nova janela em abas na janela principal
         * @param {Object} novaJanela
         * @param {Object} chromeApi - Objeto chrome com APIs windows e tabs
         * @returns {Promise<boolean>} True se a janela foi convertida
         */
        async processarNovaJanela(novaJanela, chromeApi = (typeof chrome !== 'undefined' ? chrome : null), config = {}) {
            /* Passo 1.1: Guarda de ativação e validação de APIs */
            if (!this.#bloquearNovasJanelas || !novaJanela || !chromeApi || !chromeApi.windows || !chromeApi.tabs) {
                return false;
            }

            if (novaJanela.type !== 'normal' && novaJanela.type !== 'popup') {
                return false;
            }

            try {
                /* Passo 1.2: Localiza todas as janelas normais abertas */
                const todas = await chromeApi.windows.getAll({ windowTypes: ['normal'] });
                const janelaPrincipal = todas.find(w => w.id !== novaJanela.id && w.focused) || todas.find(w => w.id !== novaJanela.id);

                if (!janelaPrincipal) {
                    /* É a única janela aberta; permite abertura normal */
                    return false;
                }

                /* Passo 1.3: Checagem prévia de abas dentro da nova janela */
                const abasNovaJanela = await chromeApi.tabs.query({ windowId: novaJanela.id });
                if (!abasNovaJanela || abasNovaJanela.length === 0) {
                    return false;
                }

                const primeiraAba = abasNovaJanela[0];
                const urlAba = primeiraAba.url || primeiraAba.pendingUrl || '';
                const tituloAba = primeiraAba.title || '';

                if (this.ehJanelaDeAutenticacao(novaJanela, urlAba, tituloAba)) {
                    /* Preserva a janela de autenticação/certificado */
                    return false;
                }

                const emPrimeiroPlano = (config.abaEmPrimeiroPlano !== undefined)
                    ? Boolean(config.abaEmPrimeiroPlano)
                    : (config.abaEmSegundoPlano !== undefined ? (config.abaEmSegundoPlano === false) : true);
                /* Passo 1.4: Move as abas para a janela principal */
                for (const aba of abasNovaJanela) {
                    await chromeApi.tabs.move(aba.id, { windowId: janelaPrincipal.id, index: -1 });
                    if (emPrimeiroPlano) {
                        await chromeApi.tabs.update(aba.id, { active: true });
                    }
                }

                /* Fecha a janela avulsa esvaziada */
                await chromeApi.windows.remove(novaJanela.id).catch(() => { });
                await chromeApi.windows.update(janelaPrincipal.id, { focused: true }).catch(() => { });
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(GerenciadorJanelaUnica.prototype);
    return Object.freeze(GerenciadorJanelaUnica);
}));
