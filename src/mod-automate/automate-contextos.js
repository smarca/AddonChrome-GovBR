/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-contextos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Automate — Resolução de Domínios e Hierarquia de Contextos
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-contextos.js
 * - Classe Exportada: AutomateContextos (self.JusGovAutomateContextos) extends BaseModulo
 * - Métodos Públicos: correspondeDominio, aplicarSobrescritasContextos, listarContextosHierarquicos, obterContextoAtivoParaUrl, deveAtivarAutomaticamenteNaUrl, estaEfetivamenteAtivoNaUrl, ehContextoPjePermitido, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovAutomateContextos = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    class AutomateContextos extends Base {
        constructor() {
            super('AutomateContextos');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(AutomateContextos.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(AutomateContextos.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Verifica se uma URL corresponde a algum dos padroes de dominio configurados.
         * @param {string} url
         * @param {Array<string>} dominios
         * @returns {boolean}
         */
        correspondeDominio(url, dominios = []) {
            if (!url || !Array.isArray(dominios) || dominios.length === 0) return false;
            const urlLower = String(url).trim().toLowerCase();
            if (!urlLower || /^(?:chrome|edge|about|devtools|chrome-extension):/i.test(urlLower)) return false;
            let hostLower = '';
            try {
                hostLower = new URL(urlLower).hostname.toLowerCase();
            } catch (_) {
                hostLower = urlLower;
            }
            for (let i = 0; i < dominios.length; i++) {
                const raw = String(dominios[i] || '').trim().toLowerCase();
                if (!raw) continue;
                try {
                    if (raw === '<all_urls>' || raw === '*://*/*' || raw === '*') return true;
                    if (!raw.includes('://') && !raw.includes('/')) {
                        const escHost = raw.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                        const rxHost = new RegExp(`^(?:.*\\.)?${escHost}$`, 'i');
                        if (rxHost.test(hostLower)) return true;
                    }
                    const esc = raw
                        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                        .replace(/^\*:\/\//, '[^/:]+://')
                        .replace(/:\/\/\*\\\./g, '://(?:[^/]+\\.)?')
                        .replace(/\*/g, '.*');
                    if (new RegExp(`^${esc}$`, 'i').test(urlLower)) return true;
                } catch (_) { }
            }
            return false;
        }

        /**
         * Aplica sobrescritas persistidas de contextos (auto-ativacao por dominio) sobre o schema atual.
         * @param {Object} overrides
         */
        aplicarSobrescritasContextos(overrides = {}) {
            if (!overrides || typeof overrides !== 'object') return;
            this.contextosOverrides = JSON.parse(JSON.stringify(overrides));
            const percorrer = (nos) => {
                if (!Array.isArray(nos)) return;
                for (let i = 0; i < nos.length; i++) {
                    const n = nos[i];
                    if (n && n.id && overrides[n.id] && typeof overrides[n.id] === 'object') {
                        const ov = overrides[n.id];
                        if (Array.isArray(ov.dominiosAutoAtivacao)) {
                            n.dominiosAutoAtivacao = [...ov.dominiosAutoAtivacao];
                        }
                        if (typeof ov.ativarAutomaticamentePorDominio === 'boolean') {
                            n.ativarAutomaticamentePorDominio = ov.ativarAutomaticamentePorDominio;
                        }
                        if (typeof ov.habilitado === 'boolean') {
                            n.habilitado = ov.habilitado;
                        }
                    }
                    if (n && Array.isArray(n.filhos)) percorrer(n.filhos);
                }
            };
            percorrer(this.dadosAutomate && this.dadosAutomate.contextosAutomacao);
        }

        /**
         * Lista todos os contextos hierarquicos em ordem pre-fixa (pai -> filhos).
         * @returns {Array<Object>}
         */
        listarContextosHierarquicos() {
            const lista = [];
            const percorrer = (nos, nivel = 0) => {
                if (!Array.isArray(nos)) return;
                for (let i = 0; i < nos.length; i++) {
                    const n = nos[i];
                    if (!n || !n.id) continue;
                    lista.push({
                        id: n.id,
                        nome: n.nome || n.id,
                        paiId: n.paiId || null,
                        nivel,
                        habilitado: Boolean(n.habilitado),
                        ativarAutomaticamentePorDominio: Boolean(n.ativarAutomaticamentePorDominio),
                        dominiosAutoAtivacao: Array.isArray(n.dominiosAutoAtivacao) ? [...n.dominiosAutoAtivacao] : [],
                        fluxoPrincipal: n.fluxoPrincipal || null
                    });
                    if (Array.isArray(n.filhos)) percorrer(n.filhos, nivel + 1);
                }
            };
            percorrer(this.dadosAutomate && this.dadosAutomate.contextosAutomacao);
            return lista;
        }

        /**
         * Retorna o contexto hierarquico mais especifico compativel com a URL atual (ou contexto raiz do navegador).
         * @param {string} [urlOpcional]
         * @returns {Object}
         */
        obterContextoAtivoParaUrl(urlOpcional = '') {
            const alvo = String(
                urlOpcional ||
                (typeof window !== 'undefined' && window.location ? window.location.href : '')
            );
            const lista = this.listarContextosHierarquicos();
            let melhorFilho = null;
            for (let i = lista.length - 1; i >= 0; i--) {
                const c = lista[i];
                if (c.nivel > 0 && this.correspondeDominio(alvo, c.dominiosAutoAtivacao)) {
                    melhorFilho = c;
                    break;
                }
            }
            if (melhorFilho) return melhorFilho;
            if (this.ehContextoPjePermitido(alvo)) {
                const pje = lista.find(c => c.id === 'pje_padrao');
                if (pje) return pje;
            }
            return lista[0] || { id: 'navegador_geral', nome: 'Navegador — Automação Geral', nivel: 0 };
        }

        /**
         * Verifica se algum contexto configurado possui auto-ativacao habilitada para a URL atual.
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        deveAtivarAutomaticamenteNaUrl(urlOpcional = '') {
            const alvo = String(
                urlOpcional ||
                (typeof window !== 'undefined' && window.location ? window.location.href : '')
            );
            if (!alvo) return false;
            const lista = this.listarContextosHierarquicos();
            return lista.some((c) =>
                c.habilitado === true &&
                c.ativarAutomaticamentePorDominio === true &&
                this.correspondeDominio(alvo, c.dominiosAutoAtivacao)
            );
        }

        /**
         * Indica se o modulo esta efetivamente ativo na URL (via ativacao manual ou regra de dominio).
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        estaEfetivamenteAtivoNaUrl(urlOpcional = '') {
            return Boolean(this.ativo || this.deveAtivarAutomaticamenteNaUrl(urlOpcional));
        }

        /**
         * Verifica se a URL/hostname atual pertence ao subcontexto pre-configurado do PJe.
         * @param {string} [urlOpcional]
         * @returns {boolean}
         */
        ehContextoPjePermitido(urlOpcional = '') {
            try {
                const alvo = String(
                    urlOpcional ||
                    (typeof window !== 'undefined' && window.location ? window.location.href : '')
                ).toLowerCase();
                if (!alvo) return false;
                return /\bpje\b|pje\.|\/pje\/|\.jus\.br\/pje|frontend\.prd\.cnj\.cloud|sso\.cloud\.pje\.jus\.br/i.test(alvo);
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(AutomateContextos.prototype);
    return Object.freeze(AutomateContextos);
}));