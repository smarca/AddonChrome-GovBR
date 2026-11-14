/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-estagio5.js
 * CLASSE: EstagioParagrafos
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-estagio5.js
 * - Classe Exportada: EstagioParagrafos (window.JusGovEstagioParagrafos)
 * - Métodos Públicos: delimitarParagrafoLocalizado(texto, idx), resolverSelecaoTriploClique(mapa, idx, estagio1Instancia)
 * - Dependências Injetadas: window.JusGovConstantes, window.JusGovEstagioUnidadeAtomicaInstancia
 * - Regras / Seções: Regra 2.5 (Estágio 5 - fronteiras de parágrafos e minoração em 3 cliques), ADR-004, Seção 6.64 (blindagem POO)
 * 
 * FINALIDADE:
 * Implementação do Estágio 5 do Motor de Expansão Contextual:
 * - Delimitação estrita de parágrafos localizados (3 cliques / triplo clique).
 * - Algoritmo de Fronteiras Inteligentes de Parágrafo: impede que o triplo clique transborde
 *   para parágrafos anteriores ou posteriores mesmo quando múltiplos parágrafos residem no
 *   mesmo elemento contêiner (ex: PDF.js .textLayer, divs corridas de sentenças do PJe).
 * - Resolução de 3 cliques com Minoração Contextual em números compostos e seleção localizada no início.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. 3 Cliques no Início do Parágrafo: Seleciona o parágrafo localizado inteiro até a quebra
 *    de linha ou numeração subsequente.
 * 2. 3 Cliques no Meio / sobre Bloco Composto: Aplica Minoração (ex: em "12.016/2009", seletor
 *    reduz para "12.016" antes da barra ou "2009" após a barra, evitando capturar o parágrafo todo).
 * 3. Fronteiras de Parágrafos Numerados Inline: Detecta quebras do tipo "...infante; 3. Ordenar...",
 *    isolando a seção "3. Ordenar..." sem engolir a cláusula anterior.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.5: Estágio 5 - Parágrafos e Triplo Clique)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.5: Estágio 5)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioParagrafos) {
        return;
    }

    class EstagioParagrafos {
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

        delimitarParagrafoLocalizado(texto, idx) {
            if (!texto || texto.length === 0) return null;
            const rx = this.#constantes.EXPRESSOES_REGULARES || {};

            const quebraDeLinhaEhFronteiraDeParagrafo = (posQuebra) => {
                if (posQuebra < 0 || posQuebra >= texto.length) return true;
                if ((posQuebra + 1) < texto.length && this.eQuebraDeLinha(texto[posQuebra + 1])) return true;
                if (posQuebra > 0 && this.eQuebraDeLinha(texto[posQuebra - 1])) return true;

                const trechoApos = texto.substring(posQuebra + 1, Math.min(texto.length, posQuebra + 40));
                if (rx.MARCADOR_NOVO_PARAGRAFO_LINHA && rx.MARCADOR_NOVO_PARAGRAFO_LINHA.test(trechoApos)) {
                    return true;
                }

                const trechoAntes = texto.substring(Math.max(0, posQuebra - 40), posQuebra);
                if (rx.FIM_FRASE_PARAGRAFO && rx.FIM_FRASE_PARAGRAFO.test(trechoAntes)) {
                    if (!rx.ABREVIACAO_FINAL_LINHA || !rx.ABREVIACAO_FINAL_LINHA.test(trechoAntes)) {
                        return true;
                    }
                }
                return false;
            };

            let iniPar = 0;
            for (let i = Math.min(idx, texto.length - 1); i > 0; i--) {
                if (this.eQuebraDeLinha(texto[i - 1]) && quebraDeLinhaEhFronteiraDeParagrafo(i - 1)) {
                    iniPar = i;
                    break;
                }
            }

            let fimPar = texto.length;
            for (let i = Math.max(0, idx); i < texto.length; i++) {
                if (this.eQuebraDeLinha(texto[i]) && quebraDeLinhaEhFronteiraDeParagrafo(i)) {
                    fimPar = i;
                    break;
                }
            }

            if (rx.FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS) {
                const fatia = texto.substring(iniPar, fimPar);
                const idxRel = idx - iniPar;
                const regexFronteira = new RegExp(rx.FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS.source, 'gu');
                let mFront;
                let novoIniRel = 0;
                let novoFimRel = fatia.length;

                while ((mFront = regexFronteira.exec(fatia)) !== null) {
                    const posInicioProximoPar = mFront.index + mFront[0].length;
                    const posFimParAnterior = mFront.index + (mFront[1] ? mFront[1].length : 1);
                    if (posInicioProximoPar <= idxRel) {
                        novoIniRel = posInicioProximoPar;
                    } else if (posFimParAnterior >= idxRel && posFimParAnterior < novoFimRel) {
                        novoFimRel = posFimParAnterior;
                        break;
                    }
                }
                iniPar += novoIniRel;
                fimPar = (iniPar - novoIniRel) + novoFimRel;
            }

            while (iniPar < fimPar && (this.eEspacoBranco(texto[iniPar]) || this.eQuebraDeLinha(texto[iniPar]))) {
                iniPar++;
            }
            while (fimPar > iniPar && (this.eEspacoBranco(texto[fimPar - 1]) || this.eQuebraDeLinha(texto[fimPar - 1]))) {
                fimPar--;
            }

            return (fimPar > iniPar) ? { inicio: iniPar, fim: fimPar } : null;
        }

        resolverSelecaoTriploClique(mapa, idx, estagio1Instancia = null) {
            if (!mapa || !mapa.texto) return null;
            const { texto } = mapa;
            let pos = Math.max(0, Math.min(idx, texto.length - 1));

            const est1 = estagio1Instancia || (typeof window !== 'undefined' && window.JusGovEstagioUnidadeAtomicaInstancia ? window.JusGovEstagioUnidadeAtomicaInstancia : null);
            const unidade = est1 ? est1.expandirUnidadeAtomicaEstagio1(texto, pos) : null;

            if (unidade) {
                const token = texto.substring(unidade.inicio, unidade.fim);
                const ehSeparadorPrimario = (c) => (c === '/' || c === '-' || c === ':' || c === '@' || c === '_');
                let temSeparadorPrimario = false;
                for (let i = 0; i < token.length; i++) {
                    if (ehSeparadorPrimario(token[i])) {
                        temSeparadorPrimario = true;
                        break;
                    }
                }

                if (temSeparadorPrimario) {
                    let p = Math.max(unidade.inicio, Math.min(pos, unidade.fim - 1));
                    if (ehSeparadorPrimario(texto[p]) && p > unidade.inicio) {
                        p--;
                    }
                    let subIni = p;
                    while (subIni > unidade.inicio && !ehSeparadorPrimario(texto[subIni - 1])) {
                        subIni--;
                    }
                    let subFim = p + 1;
                    while (subFim < unidade.fim && !ehSeparadorPrimario(texto[subFim])) {
                        subFim++;
                    }
                    if (subFim > subIni && (subIni > unidade.inicio || subFim < unidade.fim)) {
                        return { inicio: subIni, fim: subFim };
                    }
                } else if (token.indexOf('.') !== -1 && token.length > 2) {
                    let p = Math.max(unidade.inicio, Math.min(pos, unidade.fim - 1));
                    if (texto[p] === '.' && p > unidade.inicio) {
                        p--;
                    }
                    let subIni = p;
                    while (subIni > unidade.inicio && texto[subIni - 1] !== '.') {
                        subIni--;
                    }
                    let subFim = p + 1;
                    while (subFim < unidade.fim && texto[subFim] !== '.') {
                        subFim++;
                    }
                    if (subFim > subIni && (subIni > unidade.inicio || subFim < unidade.fim)) {
                        return { inicio: subIni, fim: subFim };
                    }
                }
            }

            const paragrafo = this.delimitarParagrafoLocalizado(texto, pos);
            if (paragrafo) {
                const fatiaParagrafo = texto.substring(paragrafo.inicio, paragrafo.fim);
                let offsetFimZonaInicial = 0;
                const rx = this.#constantes.EXPRESSOES_REGULARES || {};
                const regexPref = rx.PREFIXO_NUMERACAO_PARAGRAFO || rx.MARCADOR_NOVO_PARAGRAFO_LINHA;
                if (regexPref) {
                    const mPref = fatiaParagrafo.match(regexPref);
                    if (mPref) {
                        offsetFimZonaInicial = mPref[0].length;
                    }
                }
                while (offsetFimZonaInicial < fatiaParagrafo.length && this.eEspacoBranco(fatiaParagrafo[offsetFimZonaInicial])) {
                    offsetFimZonaInicial++;
                }
                while (offsetFimZonaInicial < fatiaParagrafo.length && this.eAlfanumericoUnicode(fatiaParagrafo[offsetFimZonaInicial])) {
                    offsetFimZonaInicial++;
                }

                if (pos <= (paragrafo.inicio + offsetFimZonaInicial + 1)) {
                    return paragrafo;
                }
            }

            if (unidade) {
                return unidade;
            }
            return paragrafo;
        }
    }

    Object.freeze(EstagioParagrafos.prototype);
    window.JusGovEstagioParagrafos = Object.freeze(EstagioParagrafos);
})();

