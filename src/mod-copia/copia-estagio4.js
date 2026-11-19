/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-estagio4.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: EstagioDelimitadores
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-estagio4.js
 * - Classe Exportada: EstagioDelimitadores (window.JusGovEstagioDelimitadores)
 * - Métodos Públicos: tentarExpandirDelimitadoresSimetricos(texto, idx, incluirDelimitadoresExternos)
 * - Dependências Injetadas: window.JusGovConstantes (PARES_ABERTURA, PARES_FECHAMENTO, CARACTERES_ASPAS_TODOS)
 * - Regras / Seções: Regra 2.4 (Estágio 4 - 1 clique miolo vs 2 cliques externo), ADR-004, Seção 6.64 (blindagem POO)
 * 
 * FINALIDADE:
 * Implementação do Estágio 4 do Motor de Expansão Contextual:
 * - Expansão de Delimitadores Simétricos em pares: parênteses (), colchetes [], chaves {}, sinais <>.
 * - Expansão de Aspas Tipográficas e Retas: aspas duplas (" "), aspas simples (' '), angulares (« »), curvas (“ ” / ‘ ’).
 * - Alternância 1 Clique vs. 2 Cliques:
 *   * 1 Clique captura estritamente o MIOLO INTERNO sem os delimitadores/aspas.
 *   * 2 Cliques (ou Alt + Clique em espaço) captura INCLUINDO os delimitadores/aspas externos.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. O clique simples dentro de um texto entre aspas ou parênteses prioriza a citação interna.
 * 2. Quando o cursor está sobre caractere alfanumérico no corpo de uma palavra adjacente,
 *    o raio de busca é reduzido a zero para não capturar inadvertidamente parênteses vizinhos.
 * 3. Suporte a aninhamento de múltiplos níveis de parênteses com pilha (stack balanceado).
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.4: Estágio 4 - Delimitadores e Aspas)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.4: Estágio 4)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioDelimitadores) {
        return;
    }

    class EstagioDelimitadores {
        #constantes;

        constructor(constantes = null) {
            this.#constantes = constantes || (typeof window !== 'undefined' && window.JusGovConstantes ? window.JusGovConstantes : {});
        }

        eAlfanumericoUnicode(ch) {
            if (typeof this.#constantes.eAlfanumericoUnicode === 'function') return this.#constantes.eAlfanumericoUnicode(ch);
            return Boolean(ch) && /[\p{L}\p{N}]/u.test(ch);
        }

        eEspacoBranco(ch) {
            if (typeof this.#constantes.eEspacoBranco === 'function') return this.#constantes.eEspacoBranco(ch);
            return Boolean(ch) && (ch.charCodeAt(0) === 160 || /\s/.test(ch));
        }

        eQuebraDeLinha(ch) {
            return typeof this.#constantes.eQuebraDeLinha === 'function' ? this.#constantes.eQuebraDeLinha(ch) : (ch === '\n' || ch === '\r');
        }

        eDelimitadorPar(ch) {
            if (typeof this.#constantes.eDelimitadorPar === 'function') return this.#constantes.eDelimitadorPar(ch);
            return Boolean(ch) && '()[]{}<>'.indexOf(ch) !== -1;
        }

        eCaractereAspas(ch) {
            if (typeof this.#constantes.eCaractereAspas === 'function') return this.#constantes.eCaractereAspas(ch);
            const aspas = this.#constantes.CARACTERES_ASPAS_TODOS || '';
            return Boolean(ch) && aspas.indexOf(ch) !== -1;
        }

        tentarExpandirDelimitadoresSimetricos(texto, idx, incluirDelimitadoresExternos = false) {
            if (!texto || typeof idx !== 'number') return null;

            const paresAbertura = this.#constantes.PARES_ABERTURA || { '(': ')', '[': ']', '{': '}', '<': '>' };
            const paresFechamento = this.#constantes.PARES_FECHAMENTO || { ')': '(', ']': '[', '}': '{', '>': '<' };

            const charCursor = (idx >= 0 && idx < texto.length) ? texto[idx] : '';
            const raioBusca = this.eAlfanumericoUnicode(charCursor) ? 0 : 1;

            for (let delta = 0; delta <= raioBusca; delta++) {
                const candidatos = delta === 0 ? [idx] : [idx - delta, idx + delta];
                for (let cIdx = 0; cIdx < candidatos.length; cIdx++) {
                    const pos = candidatos[cIdx];
                    if (pos < 0 || pos >= texto.length) continue;
                    const ch = texto[pos];

                    if (paresAbertura[ch]) {
                        const charFechamento = paresAbertura[ch];
                        let nivel = 1;
                        for (let i = pos + 1; i < texto.length; i++) {
                            if (this.eQuebraDeLinha(texto[i])) break;
                            if (texto[i] === ch) nivel++;
                            else if (texto[i] === charFechamento) {
                                nivel--;
                                if (nivel === 0) {
                                    // Se o clique foi no próprio caractere delimitador (pos === idx), inclui os delimitadores
                                    const incluir = incluirDelimitadoresExternos || (pos === idx);
                                    return incluir
                                        ? { inicio: pos, fim: i + 1 }
                                        : { inicio: pos + 1, fim: i };
                                }
                            }
                        }
                    }

                    if (paresFechamento[ch]) {
                        const charAbertura = paresFechamento[ch];
                        let nivel = 1;
                        for (let i = pos - 1; i >= 0; i--) {
                            if (this.eQuebraDeLinha(texto[i])) break;
                            if (texto[i] === ch) nivel++;
                            else if (texto[i] === charAbertura) {
                                nivel--;
                                if (nivel === 0) {
                                    // Se o clique foi no próprio caractere delimitador (pos === idx), inclui os delimitadores
                                    const incluir = incluirDelimitadoresExternos || (pos === idx);
                                    return incluir
                                        ? { inicio: i, fim: pos + 1 }
                                        : { inicio: i + 1, fim: pos };
                                }
                            }
                        }
                    }

                    if (this.eCaractereAspas(ch)) {
                        const antesEhEspacoOuInicio = (pos === 0 || this.eEspacoBranco(texto[pos - 1]) || this.eDelimitadorPar(texto[pos - 1]));
                        if (antesEhEspacoOuInicio) {
                            for (let i = pos + 1; i < texto.length; i++) {
                                if (this.eQuebraDeLinha(texto[i])) break;
                                if (this.eCaractereAspas(texto[i])) {
                                    return incluirDelimitadoresExternos
                                        ? { inicio: pos, fim: i + 1 }
                                        : { inicio: pos + 1, fim: i };
                                }
                            }
                        } else {
                            for (let i = pos - 1; i >= 0; i--) {
                                if (this.eQuebraDeLinha(texto[i])) break;
                                if (this.eCaractereAspas(texto[i])) {
                                    return incluirDelimitadoresExternos
                                        ? { inicio: i, fim: pos + 1 }
                                        : { inicio: i + 1, fim: pos };
                                }
                            }
                        }
                    }
                }
            }

            let posAbre = -1;
            let charAbre = '';
            const pilhaDireita = [];

            for (let i = idx - 1; i >= 0; i--) {
                const c = texto[i];
                if (this.eQuebraDeLinha(c)) break;
                if (paresFechamento[c]) {
                    pilhaDireita.push(paresFechamento[c]);
                } else if (paresAbertura[c]) {
                    if (pilhaDireita.length > 0 && pilhaDireita[pilhaDireita.length - 1] === c) {
                        pilhaDireita.pop();
                    } else {
                        posAbre = i;
                        charAbre = c;
                        break;
                    }
                }
            }

            if (posAbre !== -1 && charAbre) {
                const charFecha = paresAbertura[charAbre];
                let nivel = 1;
                for (let i = posAbre + 1; i < texto.length; i++) {
                    if (this.eQuebraDeLinha(texto[i])) break;
                    if (texto[i] === charAbre) nivel++;
                    else if (texto[i] === charFecha) {
                        nivel--;
                        if (nivel === 0 && i >= idx) {
                            return incluirDelimitadoresExternos
                                ? { inicio: posAbre, fim: i + 1 }
                                : { inicio: posAbre + 1, fim: i };
                        }
                    }
                }
            }

            return null;
        }
    }

    Object.freeze(EstagioDelimitadores.prototype);
    window.JusGovEstagioDelimitadores = Object.freeze(EstagioDelimitadores);
})();

