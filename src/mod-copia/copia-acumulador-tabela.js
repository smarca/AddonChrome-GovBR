/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-acumulador-tabela.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Acumulador Matricial de Tabelas (Colunas e Linhas)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-acumulador-tabela.js
 * - Classe Exportada: CopiaAcumuladorTabela (self.JusGovCopiaAcumuladorTabela) extends BaseModulo
 * - Métodos Públicos: acumularSelecaoTabelaPorColunasOuLinhas, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaAcumuladorTabela = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const _JGC = (raiz && raiz.JusGovConstantes) || {};
    const EXPRESSOES_REGULARES = _JGC.EXPRESSOES_REGULARES || {};
    const REGEX_AUDITORIA = _JGC.REGEX_AUDITORIA || {};
    const CONFIGURACAO_MOTOR = _JGC.CONFIGURACAO_MOTOR || {};
    const CATALOGO_PADROES_JURIDICOS = _JGC.CATALOGO_PADROES_JURIDICOS || [];
    const ESTILOS_BADGE_MARCADOR_COLADO = _JGC.ESTILOS_BADGE_MARCADOR_COLADO || [];

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    const CONFIG_ACUMULADOR = Object.freeze({
        NOME_REGISTRO_HIGHLIGHT: 'jusgov-acumulador',
        ID_ESTILO_HIGHLIGHT: 'jusgov-estilo-custom-highlight',
        SEPARADOR_ITENS: ';',
        SUFIXO_FINAL: ';',
        LIMITE_MAXIMO_RANGES_VISUAIS: 128
    });

    class CopiaAcumuladorTabela extends Base {
        constructor() {
            super('CopiaAcumuladorTabela');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaAcumuladorTabela.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaAcumuladorTabela.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /*
         * METODO: acumularSelecaoTabelaPorColunasOuLinhas
         * REFERENCIA HELP: Selecao Avancada de Tabelas por Colunas e por Linhas.
         * OBJETIVO DE RECONSTRUCAO: Acumular colunas ou linhas em <table> (suportando
         * ordem crescente padrao ou Modo Baralho com Shift, e toggle-off ao clicar
         * novamente na mesma coluna/linha) e retornar estatisticas exatas.
         */
        acumularSelecaoTabelaPorColunasOuLinhas(celulaOuLinha, modo = 'COLUNA', modoBaralhoShift = false) {
            /* Passo 3.6: Localizar a tabela ancestral e validar estrutura */
            if (!celulaOuLinha || typeof celulaOuLinha.closest !== 'function') return null;
            const tabela = celulaOuLinha.closest('table');
            if (!tabela) return null;

            if (this.tabelaAlvo !== tabela || this.modoTabelaAtivo !== modo) {
                this.tabelaAlvo = tabela;
                this.modoTabelaAtivo = modo;
                this.indicesColunasSelecionadas.length = 0;
                this.indicesLinhasSelecionadas.length = 0;
                this.ultimoIndiceTabelaClicado = -1;
            }

            const todasLinhas = Array.from(tabela.querySelectorAll('tr')).filter(tr => {
                const style = window.getComputedStyle(tr);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
            if (todasLinhas.length === 0) return null;

            this.entradasAcumuladas.length = 0;
            this.pilhaHistoricoIds.length = 0;
            let totalCelulasExtraidas = 0;
            const rxMultiEspacos = EXPRESSOES_REGULARES.MULTIPLOS_ESPACOS;

            if (modo === 'COLUNA') {
                /* Passo 3.7: Determinar indice da coluna clicada (cellIndex) com toggle-off se ja selecionada */
                const celula = celulaOuLinha.closest('td, th');
                if (!celula) return null;
                const colIdx = celula.cellIndex | 0;

                const posExistente = this.indicesColunasSelecionadas.indexOf(colIdx);
                if (posExistente >= 0) {
                    this.indicesColunasSelecionadas.splice(posExistente, 1);
                } else {
                    this.indicesColunasSelecionadas.push(colIdx);
                    this.ultimoIndiceTabelaClicado = colIdx;
                }

                if (!modoBaralhoShift) {
                    this.indicesColunasSelecionadas.sort((a, b) => a - b);
                }

                /* Passo 3.8: Extrair os dados das colunas selecionadas linha por linha */
                const linhasFormatadas = [];
                for (const tr of todasLinhas) {
                    const celulasLinha = tr.cells;
                    const valoresLinha = [];
                    for (const cIdx of this.indicesColunasSelecionadas) {
                        if (celulasLinha && cIdx < celulasLinha.length) {
                            const td = celulasLinha[cIdx];
                            const bruto = td.innerText || td.textContent || '';
                            const txt = (rxMultiEspacos ? bruto.replace(rxMultiEspacos, ' ') : bruto).trim();
                            valoresLinha.push(txt);
                            totalCelulasExtraidas++;
                            if (this.entradasAcumuladas.length < CONFIG_ACUMULADOR.LIMITE_MAXIMO_RANGES_VISUAIS) {
                                const r = document.createRange();
                                r.selectNodeContents(td);
                                this.entradasAcumuladas.push({
                                    id: ++this.contadorSequencialId,
                                    texto: txt,
                                    range: r,
                                    modoBaralho: Boolean(modoBaralhoShift)
                                });
                            }
                        }
                    }
                    if (valoresLinha.length > 0 && valoresLinha.some(v => v.length > 0)) {
                        const sep = this.separadorTabelaCustomizado || this.separadorCustomizado || CONFIG_ACUMULADOR.SEPARADOR_ITENS;
                        const sufixoTab = (this.incluirSeparadorFinal && sep !== '\t' && sep !== ' | ') ? sep : '';
                        linhasFormatadas.push(valoresLinha.join(sep) + sufixoTab);
                    }
                }

                this.atualizarDestaqueVisualCSS();
                const textoTabela = this.desacoplarStringV8(linhasFormatadas.join('\n'));
                this.itensTexto.length = 0;
                if (textoTabela) this.itensTexto.push(textoTabela);

                return {
                    consolidado: textoTabela,
                    quantidade: this.indicesColunasSelecionadas.length | 0,
                    colunas: this.indicesColunasSelecionadas.length | 0,
                    linhas: linhasFormatadas.length | 0,
                    celulas: totalCelulasExtraidas | 0,
                    caracteres: textoTabela.length | 0
                };
            } else {
                /* Passo 3.9: Modo LINHA -- Determinar indice da linha clicada com toggle-off */
                const linhaTr = celulaOuLinha.closest('tr');
                if (!linhaTr) return null;
                const rowIdx = todasLinhas.indexOf(linhaTr);
                if (rowIdx === -1) return null;

                const posExistente = this.indicesLinhasSelecionadas.indexOf(rowIdx);
                if (posExistente >= 0) {
                    this.indicesLinhasSelecionadas.splice(posExistente, 1);
                } else {
                    this.indicesLinhasSelecionadas.push(rowIdx);
                    this.ultimoIndiceTabelaClicado = rowIdx;
                }

                if (!modoBaralhoShift) {
                    this.indicesLinhasSelecionadas.sort((a, b) => a - b);
                }

                const linhasFormatadas = [];
                let maxColunasPorLinha = 0;
                for (const rIdx of this.indicesLinhasSelecionadas) {
                    const tr = todasLinhas[rIdx];
                    if (!tr) continue;
                    const celulasVisiveis = Array.from(tr.querySelectorAll('th, td'))
                        .map(td => {
                            const b = td.innerText || td.textContent || '';
                            return (rxMultiEspacos ? b.replace(rxMultiEspacos, ' ') : b).trim();
                        })
                        .filter(Boolean);
                    if (celulasVisiveis.length > 0) {
                        const sep = this.separadorTabelaCustomizado || this.separadorCustomizado || CONFIG_ACUMULADOR.SEPARADOR_ITENS;
                        const sufixoTab = (this.incluirSeparadorFinal && sep !== '\t' && sep !== ' | ') ? sep : '';
                        const linhaStr = celulasVisiveis.join(sep) + sufixoTab;
                        linhasFormatadas.push(linhaStr);
                        totalCelulasExtraidas += celulasVisiveis.length;
                        if (celulasVisiveis.length > maxColunasPorLinha) {
                            maxColunasPorLinha = celulasVisiveis.length;
                        }
                        if (this.entradasAcumuladas.length < CONFIG_ACUMULADOR.LIMITE_MAXIMO_RANGES_VISUAIS) {
                            const rng = document.createRange();
                            rng.selectNodeContents(tr);
                            this.entradasAcumuladas.push({
                                id: ++this.contadorSequencialId,
                                texto: linhaStr,
                                range: rng,
                                modoBaralho: Boolean(modoBaralhoShift)
                            });
                        }
                    }
                }

                this.atualizarDestaqueVisualCSS();
                const textoTabela = this.desacoplarStringV8(linhasFormatadas.join('\n'));
                this.itensTexto.length = 0;
                if (textoTabela) this.itensTexto.push(textoTabela);

                return {
                    consolidado: textoTabela,
                    quantidade: this.indicesLinhasSelecionadas.length | 0,
                    colunas: maxColunasPorLinha | 0,
                    linhas: this.indicesLinhasSelecionadas.length | 0,
                    celulas: totalCelulasExtraidas | 0,
                    caracteres: textoTabela.length | 0
                };
            }
        }
    }

    Object.freeze(CopiaAcumuladorTabela.prototype);
    return Object.freeze(CopiaAcumuladorTabela);
}));