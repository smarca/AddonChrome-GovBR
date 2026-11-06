/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-estagio1.js
 * CLASSE: EstagioUnidadeAtomica
 * 
 * FINALIDADE:
 * Implementação do Estágio 1 do Motor de Expansão Contextual:
 * - Resolução da Unidade Atômica e Tokens Elementares (palavras, números, identificadores).
 * - Tratamento de pontuações internas de numerações (CPF/CNPJ/CNJ como '.', '/', '-').
 * - Tratamento de vírgula decimal entre dígitos ("0,25", "1.233,00").
 * - Tratamento de sinais unários numéricos (+ ou -) no início de valores ("+0,25", "-10").
 * - Sequências contíguas de símbolos repetíveis ("#####", "*****", "@@@@@").
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. O clique simples sobre uma palavra não deve selecionar pontuações sintáticas externas
 *    (vírgula, ponto final, dois pontos), mas DEVE preservar pontuações internas de identidade.
 * 2. Prefixos e sufixos de unidades (%, º, ª, °) são aglutinados à unidade numérica atômica.
 * 3. Consulta O(1) de bitmask na tabela ASCII de 128 bytes antes de invocar a engine regex.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.1: Estágio 1 - Unidade Atômica)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.1: Estágio 1)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-003: Bitmask O(1) e ADR-004: Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioUnidadeAtomica) {
        return;
    }

    class EstagioUnidadeAtomica {
        #constantes;

        constructor(constantes = null) {
            this.#constantes = constantes || (typeof window !== 'undefined' && window.JusGovConstantes ? window.JusGovConstantes : {});
        }

        eAlfanumericoUnicode(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) {
                return (tab[c] & (masc.DIGITO | masc.LETRA_ASCII)) !== 0;
            }
            const rx = this.#constantes.EXPRESSOES_REGULARES;
            if (rx && rx.CHAR_ALFANUMERICO_UNICODE) {
                return rx.CHAR_ALFANUMERICO_UNICODE.test(ch);
            }
            return /[\p{L}\p{N}]/u.test(ch);
        }

        eSimboloRepetivel(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128 && (tab[c] & masc.SIMBOLO_REPETIVEL) !== 0) {
                return true;
            }
            const rx = this.#constantes.EXPRESSOES_REGULARES;
            if (rx && rx.CHAR_SIMBOLO_REPETIVEL) {
                return rx.CHAR_SIMBOLO_REPETIVEL.test(ch);
            }
            return /[#*=_~$@]/.test(ch);
        }

        /**
         * Expande a unidade atômica sob a posição idx no texto fornecido.
         * Retorna { inicio, fim } ou null.
         */
        expandirUnidadeAtomicaEstagio1(texto, idx) {
            if (!texto || typeof idx !== 'number') return null;
            let pos = idx;
            if (pos >= texto.length) pos = texto.length - 1;
            if (pos < 0) return null;

            if (!this.eAlfanumericoUnicode(texto[pos]) && !this.eSimboloRepetivel(texto[pos])) {
                if (pos > 0 && (this.eAlfanumericoUnicode(texto[pos - 1]) || this.eSimboloRepetivel(texto[pos - 1]))) {
                    pos--;
                } else if ((texto[pos] === '+' || texto[pos] === '-' || texto[pos] === '\u2212' || texto[pos] === '\u2013') &&
                    (pos + 1) < texto.length && this.eAlfanumericoUnicode(texto[pos + 1])) {
                    pos++;
                }
            }

            if (this.eSimboloRepetivel(texto[pos])) {
                let ini = pos;
                while (ini > 0 && this.eSimboloRepetivel(texto[ini - 1])) ini--;
                let fim = pos + 1;
                while (fim < texto.length && this.eSimboloRepetivel(texto[fim])) fim++;
                return { inicio: ini, fim };
            }

            if (!this.eAlfanumericoUnicode(texto[pos])) return null;

            let ini = pos;
            while (ini > 0) {
                const chAnt = texto[ini - 1];
                if (this.eAlfanumericoUnicode(chAnt)) {
                    ini--;
                } else if ((chAnt === '-' || chAnt === '_' || chAnt === '.' || chAnt === '/') && ini >= 2 && this.eAlfanumericoUnicode(texto[ini - 2])) {
                    ini--;
                } else if (chAnt === ',' && ini >= 2 && texto[ini - 2] >= '0' && texto[ini - 2] <= '9' && ini < texto.length && texto[ini] >= '0' && texto[ini] <= '9') {
                    ini--;
                } else if ((chAnt === '+' || chAnt === '-' || chAnt === '\u2212' || chAnt === '\u2013') && (ini === 1 || !this.eAlfanumericoUnicode(texto[ini - 2]))) {
                    ini--;
                    break;
                } else {
                    break;
                }
            }

            let fim = pos + 1;
            while (fim < texto.length) {
                const chProx = texto[fim];
                if (this.eAlfanumericoUnicode(chProx) || chProx === '\u00BA' || chProx === '\u00AA' || chProx === '\u00B0' || chProx === '%') {
                    fim++;
                } else if ((chProx === '-' || chProx === '_' || chProx === '.' || chProx === '/') && (fim + 1) < texto.length && this.eAlfanumericoUnicode(texto[fim + 1])) {
                    fim++;
                } else if (chProx === ',' && (fim + 1) < texto.length && texto[fim - 1] >= '0' && texto[fim - 1] <= '9' && texto[fim + 1] >= '0' && texto[fim + 1] <= '9') {
                    fim++;
                } else {
                    break;
                }
            }

            return { inicio: ini, fim };
        }
    }

    window.JusGovEstagioUnidadeAtomica = EstagioUnidadeAtomica;
})();

