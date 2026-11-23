/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-seletores-pad.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Automate — Parser e Avaliador de Seletores PAD Customizados
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-seletores-pad.js
 * - Classe Exportada: AutomateSeletoresPad (self.JusGovAutomateSeletoresPad) extends BaseModulo
 * - Métodos Públicos: executarSeletorPadCustom, _tokenizarSeletorPad, _filtrarDescendentesPad, _avaliarPredicadosPad, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovAutomateSeletoresPad = fabrica(raiz);
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

    class AutomateSeletoresPad extends Base {
        constructor() {
            super('AutomateSeletoresPad');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(AutomateSeletoresPad.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(AutomateSeletoresPad.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Executa um seletor no formato hibrido do Power Automate Desktop (`pad_custom`),
         * suportando pseudo-seletores `:eq(N)`, `[Text="..."]`, `[Text*="..."]`, `[Text@="regex"]`,
         * `[Title@="regex"]` e encadeamento hierarquico.
         * @param {string} expressaoPad
         * @param {Document|Element} contextoDOM
         * @returns {Array<Element>}
         */
        executarSeletorPadCustom(expressaoPad, contextoDOM) {
            if (!expressaoPad || !contextoDOM) return [];

            // Extrai predicados especiais do PAD antes de consultar via querySelectorAll por etapas
            // Divide por '>' ou espacos fora de colchetes/aspas para processar :eq(N) e predicados customizados
            const tokens = this._tokenizarSeletorPad(expressaoPad);
            let nosAtuais = [contextoDOM];

            for (let t = 0; t < tokens.length; t++) {
                const token = tokens[t];
                if (!token) continue;
                if (token.combinador === '>') {
                    nosAtuais = this._filtrarDescendentesPad(nosAtuais, token.expressao, true);
                } else {
                    nosAtuais = this._filtrarDescendentesPad(nosAtuais, token.expressao, false);
                }
                if (nosAtuais.length === 0) break;
            }

            return nosAtuais.filter(el => el && el.nodeType === 1);
        }

        /**
         * Tokeniza uma expressao PAD-Custom preservando colchetes `[]` e parenteses `()`.
         * @private
         */
        _tokenizarSeletorPad(expressaoPad) {
            const tokens = [];
            let buffer = '';
            let nivelColchetes = 0;
            let nivelParenteses = 0;
            let aspasAtiva = null;
            let combinadorPendente = ' ';

            const empurrarBuffer = () => {
                const limpo = buffer.trim();
                if (limpo) {
                    tokens.push({ combinador: combinadorPendente, expressao: limpo });
                    combinadorPendente = ' ';
                }
                buffer = '';
            };

            for (let i = 0; i < expressaoPad.length; i++) {
                const ch = expressaoPad[i];
                if (aspasAtiva) {
                    buffer += ch;
                    if (ch === aspasAtiva && expressaoPad[i - 1] !== '\\') {
                        aspasAtiva = null;
                    }
                    continue;
                }
                if (ch === '"' || ch === "'") {
                    aspasAtiva = ch;
                    buffer += ch;
                    continue;
                }
                if (ch === '[') { nivelColchetes++; buffer += ch; continue; }
                if (ch === ']') { nivelColchetes = Math.max(0, nivelColchetes - 1); buffer += ch; continue; }
                if (ch === '(') { nivelParenteses++; buffer += ch; continue; }
                if (ch === ')') { nivelParenteses = Math.max(0, nivelParenteses - 1); buffer += ch; continue; }

                if (nivelColchetes === 0 && nivelParenteses === 0) {
                    if (ch === '>') {
                        empurrarBuffer();
                        combinadorPendente = '>';
                        continue;
                    }
                    if (/\s/.test(ch)) {
                        empurrarBuffer();
                        continue;
                    }
                }
                buffer += ch;
            }
            empurrarBuffer();
            return tokens;
        }

        /**
         * Resolve um segmento individual de seletor PAD-Custom sobre os nos pais atuais.
         * @private
         */
        _filtrarDescendentesPad(nosPais, segmentoBruto, apenasFilhosDiretos) {
            let segmento = segmentoBruto;
            let indiceEq = null;
            const predicadosCustom = [];

            // 1. Extrai :eq(N)
            segmento = segmento.replace(/:eq\(\s*(\d+)\s*\)/gi, (_, numStr) => {
                indiceEq = parseInt(numStr, 10);
                return '';
            });

            // 2. Extrai predicados especiais [Text...], [Title@=...], ou converte [Id=...] / [Class=...]
            segmento = segmento.replace(/\[\s*([A-Za-z0-9_-]+)\s*([*@~^$]?=)\s*(['"]?)([\s\S]*?)\3\s*\]/g, (match, prop, op, quote, val) => {
                const propLower = prop.toLowerCase();
                if (propLower === 'text' || op === '@=') {
                    predicadosCustom.push({ prop: propLower, op, val });
                    return '';
                }
                // Normaliza atributos capitalizados do PAD (ex: [Id='x'] -> [id='x'], [Class*='y'] -> [class*='y'])
                return `[${propLower}${op}"${val.replace(/"/g, '\\"')}"]`;
            });

            const seletorCssBase = segmento.trim() || '*';
            const candidatos = [];

            for (let i = 0; i < nosPais.length; i++) {
                const pai = nosPais[i];
                if (!pai || typeof pai.querySelectorAll !== 'function') continue;
                let encontrados = [];
                try {
                    encontrados = Array.from(pai.querySelectorAll(seletorCssBase));
                } catch (eCss) {
                    encontrados = [];
                }
                if (apenasFilhosDiretos) {
                    encontrados = encontrados.filter(el => el.parentNode === pai);
                }
                for (let j = 0; j < encontrados.length; j++) {
                    const el = encontrados[j];
                    if (this._avaliarPredicadosPad(el, predicadosCustom)) {
                        if (!candidatos.includes(el)) {
                            candidatos.push(el);
                        }
                    }
                }
            }

            if (indiceEq !== null && !Number.isNaN(indiceEq)) {
                return (indiceEq >= 0 && indiceEq < candidatos.length) ? [candidatos[indiceEq]] : [];
            }
            return candidatos;
        }

        /**
         * Avalia predicados customizados do Power Automate Desktop (`[Text="..."]`, `[Text@="regex"]`, `[Title@="regex"]`).
         * @private
         */
        _avaliarPredicadosPad(elemento, predicados) {
            if (!predicados || predicados.length === 0) return true;
            for (let i = 0; i < predicados.length; i++) {
                const p = predicados[i];
                const fonteValor = (p.prop === 'text')
                    ? this.extrairTextoElemento(elemento, false)
                    : String(elemento.getAttribute(p.prop) || '');

                if (p.op === '=') {
                    if (fonteValor.trim() !== p.val.trim()) return false;
                } else if (p.op === '*=') {
                    if (!fonteValor.toLowerCase().includes(p.val.toLowerCase())) return false;
                } else if (p.op === '^=') {
                    if (!fonteValor.toLowerCase().startsWith(p.val.toLowerCase())) return false;
                } else if (p.op === '$=') {
                    if (!fonteValor.toLowerCase().endsWith(p.val.toLowerCase())) return false;
                } else if (p.op === '@=') {
                    try {
                        const rx = new RegExp(p.val, 'i');
                        if (!rx.test(fonteValor)) return false;
                    } catch (e) {
                        if (!fonteValor.includes(p.val)) return false;
                    }
                }
            }
            return true;
        }
    }

    Object.freeze(AutomateSeletoresPad.prototype);
    return Object.freeze(AutomateSeletoresPad);
}));