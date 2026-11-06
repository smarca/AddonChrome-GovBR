/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-estagio3.js
 * CLASSE: EstagioSentencas
 * 
 * FINALIDADE:
 * Implementação do Estágio 3 do Motor de Expansão Contextual:
 * - Expansão de Frases e Sentenças completas até pontuações gramaticais terminativas (. ! ?).
 * - Regra Especial do Conectivo Dois-Pontos (":"): clique no espaço após ":" captura a sentença
 *   inteira conectando a cláusula anterior ao enunciado consequente.
 * - Respeito estrito a delimitadores e quebras de linha para não transbordar para outros parágrafos.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. O clique sobre espaços intermediários ou conectivos de frase expande a oração sem incluir
 *    pontuações finais externas ("." ou ";"), mantendo o texto limpo para colagem.
 * 2. Em "Atenção: confira o processo.", clicar entre ":" e "confira" seleciona a frase inteira
 *    porque os dois-pontos estabelecem um nexo explicativo indissociável.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.3: Estágio 3 - Sentenças e Dois-Pontos)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.3: Estágio 3)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioSentencas) {
        return;
    }

    class EstagioSentencas {
        #constantes;

        constructor(constantes = null) {
            this.#constantes = constantes || (typeof window !== 'undefined' && window.JusGovConstantes ? window.JusGovConstantes : {});
        }

        eEspacoBranco(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) return (tab[c] & masc.ESPACO_BRANCO) !== 0;
            return c === 160 || (this.#constantes.EXPRESSOES_REGULARES && this.#constantes.EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE ? this.#constantes.EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE.test(ch) : /\s/.test(ch));
        }

        eQuebraDeLinha(ch) {
            return ch === '\n' || ch === '\r';
        }

        ePontuacaoFim(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) return (tab[c] & masc.PONTUACAO_FIM) !== 0;
            return c === 8212 || c === 8211 || c === 8230;
        }

        eDelimitadorPar(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            return tab && c < 128 && (tab[c] & masc.DELIMITADOR_PAR) !== 0;
        }

        eCaractereAspas(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) return (tab[c] & masc.DELIMITADOR_ASPAS) !== 0;
            const aspas = this.#constantes.CARACTERES_ASPAS_TODOS || '';
            return aspas.indexOf(ch) !== -1;
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

        tentarExpandirSentencaPorDoisPontos(texto, idx) {
            if (!texto || typeof idx !== 'number' || idx < 0 || idx > texto.length) return null;
            const ehEspacoSimples = (c) => Boolean(c) && this.eEspacoBranco(c) && !this.eQuebraDeLinha(c);

            let i;
            if (idx < texto.length && ehEspacoSimples(texto[idx])) {
                i = idx;
            } else if (idx > 0 && ehEspacoSimples(texto[idx - 1]) && !this.eAlfanumericoUnicode(texto[idx] || '')) {
                i = idx - 1;
            } else {
                return null;
            }

            let j = i;
            while (j >= 0 && ehEspacoSimples(texto[j])) j--;
            if (j < 0 || texto[j] !== ':') return null;

            let k = i;
            while (k < texto.length && ehEspacoSimples(texto[k])) k++;
            if (k >= texto.length || this.eQuebraDeLinha(texto[k])) return null;

            const ehFimDeSentenca = (p) => {
                const c = texto[p];
                return (c === '.' || c === '!' || c === '?') && (p + 1 >= texto.length || this.eEspacoBranco(texto[p + 1]));
            };

            let ini = j;
            while (ini > 0 && !this.eQuebraDeLinha(texto[ini - 1]) && !ehFimDeSentenca(ini - 1)) ini--;
            let fim = k;
            while (fim < texto.length && !this.eQuebraDeLinha(texto[fim]) && !ehFimDeSentenca(fim)) fim++;

            while (ini < fim && this.eEspacoBranco(texto[ini])) ini++;
            while (fim > ini && this.eEspacoBranco(texto[fim - 1])) fim--;
            return (fim > ini) ? { inicio: ini, fim } : null;
        }

        expandirFraseAtePontuacaoEstagio3(texto, idx) {
            if (!texto || typeof idx !== 'number' || idx < 0 || idx > texto.length) return null;

            let ini = idx;
            while (ini > 0) {
                const c = texto[ini - 1];
                if (this.eQuebraDeLinha(c) || this.ePontuacaoFim(c) || c === ':' || this.eDelimitadorPar(c) || this.eCaractereAspas(c)) {
                    break;
                }
                ini--;
            }

            let fim = idx;
            while (fim < texto.length) {
                const c = texto[fim];
                if (this.eQuebraDeLinha(c) || this.ePontuacaoFim(c) || c === ':' || this.eDelimitadorPar(c) || this.eCaractereAspas(c)) {
                    break;
                }
                fim++;
            }

            while (ini < fim && this.eEspacoBranco(texto[ini])) ini++;
            while (fim > ini && this.eEspacoBranco(texto[fim - 1])) fim--;

            return (fim > ini) ? { inicio: ini, fim } : null;
        }
    }

    window.JusGovEstagioSentencas = EstagioSentencas;
})();

