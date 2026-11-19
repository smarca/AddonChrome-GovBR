/* ==========================================================================
 * ARQUIVO: src/mod-copia/lib-copia-filtros-texto.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: FiltrosTextoCopia
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/lib-copia-filtros-texto.js
 * - Classe Exportada: FiltrosTextoCopia (window.JusGovFiltrosTextoCopia)
 * - Métodos Públicos: aplicarPreHigienizacaoTexto(t), aplicarFiltro1DadosLixo(t), unificarLinhasComEspacamentoAntiTruncamento(t), aplicarFiltro3InformacoesELinhas(t), aplicarPosLimpezaDefensiva(t), higienizarTextoParaCopia(t)
 * - Dependências Injetadas: window.JusGovConstantes (EXPRESSOES_REGULARES)
 * - Regras / Seções: ENG-02 (lib-<módulo>-*), ARQ-09 / FEAT-73 (Estágio Prévio Nível -1 e Pós-Checagem Defensiva +99), Seção 6.3 (anti-truncamento)
 *
 * FINALIDADE:
 * Biblioteca interna exclusiva do módulo de Cópia responsável pela higienização
 * textual de entrada (Nível -1) e defesa final (Pós +99): remoção de lixo de PDF,
 * caracteres invisíveis zero-width, espaços não quebráveis (NBSP), supressão de
 * linhas duplas/em branco excessivas, anti-truncamento entre blocos inline e
 * conversão de cabeçalhos de páginas do PJe.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFiltrosTextoCopia) {
        return;
    }

    class FiltrosTextoCopia {
        constructor(opcoes = {}) {
            this.converterCabecalhoPjeAtivo = (typeof opcoes.converterCabecalhoPjeAtivo === 'boolean')
                ? opcoes.converterCabecalhoPjeAtivo
                : true;
        }

        /**
         * NÍVEL -1 / FILTRO 1 (Pré-Higienização):
         * Limpa caracteres invisíveis de PDF (zero-width, BOM interno, soft-hyphen, controle)
         * e normaliza espaços não quebráveis antes de qualquer processamento semântico ou HTML.
         */
        aplicarFiltro1DadosLixo(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rxLixo = (cExt.EXPRESSOES_REGULARES && cExt.EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF)
                ? cExt.EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF
                : /[\u200B-\u200D\uFEFF\u2060\u00AD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
            return textoBruto
                .replace(rxLixo, '')
                .replace(/\u00A0/g, ' ')
                .replace(/&nbsp;/gi, ' ');
        }

        /**
         * Alias explícito para a camada de pré-higienização estrutural (Nível -1).
         */
        aplicarPreHigienizacaoTexto(textoBruto) {
            return this.aplicarFiltro1DadosLixo(textoBruto);
        }

        /**
         * DIRETRIZ SEÇÃO 6.3: Supressão de quebras de linha em linha única com espaçamento obrigatório anti-truncamento.
         * Garante que a unificação de quebras (\r\n, \r, \n) sempre insira espaço simples entre blocos,
         * impedindo fusão acidental (ex.: "FEDERAL" + "CÍVEL" -> "FEDERAL CÍVEL").
         */
        unificarLinhasComEspacamentoAntiTruncamento(texto) {
            if (!texto || typeof texto !== 'string') return '';
            return texto
                .replace(/[\r\n\t\f\v]+/g, ' ')
                .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/gu, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        /**
         * FILTRO 3: Normalização de linhas, eliminação de linhas duplas/vazias e cabeçalhos PJe.
         * Converte blocos únicos de cabeçalho PJe em "id X, pg. Y" e limpa pontuação final isolada.
         */
        aplicarFiltro3InformacoesELinhas(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            const normalizado = textoBruto
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n');

            const linhasBrutas = normalizado.split('\n');
            const linhasUteis = [];

            for (let i = 0; i < linhasBrutas.length; i++) {
                const linha = linhasBrutas[i]
                    .replace(/^[ \t]+|[ \t]+$/g, '')
                    .replace(/[ \t]{2,}/g, ' ');

                if (linha.length > 0) {
                    linhasUteis.push(linha);
                }
            }

            let resultado = linhasUteis.join('\n');

            if (linhasUteis.length === 1) {
                if (this.converterCabecalhoPjeAtivo && rx.CABECALHO_ID_PJE) {
                    const matchCabecalhoPje = resultado.match(rx.CABECALHO_ID_PJE);
                    if (matchCabecalhoPje) {
                        const idDoc = matchCabecalhoPje[1];
                        const pgDoc = matchCabecalhoPje[2];
                        return pgDoc ? `id ${idDoc}, pg. ${pgDoc}` : `id ${idDoc}`;
                    }
                }

                if (resultado.length > 1 &&
                    (!rx.SUFIXO_FECHAMENTO_PRESERVADO || !rx.SUFIXO_FECHAMENTO_PRESERVADO.test(resultado))) {
                    const rxPontuacao = (rx && rx.PONTUACAO_FINAL_ISOLADA) || /[.,;:!?]+$/;
                    resultado = resultado.replace(rxPontuacao, '');
                }
            }

            return this.aplicarPosLimpezaDefensiva(resultado);
        }

        /**
         * PÓS-CHECAGEM DEFENSIVA (+99):
         * Varredura final por cautela sobre espaços múltiplos, invisíveis remanescentes e bordas.
         */
        aplicarPosLimpezaDefensiva(texto) {
            if (!texto || typeof texto !== 'string') return '';
            return texto
                .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
                .replace(/[ ]{2,}/g, ' ')
                .trim();
        }

        /**
         * Pipeline completo (Nível -1 -> Normalização de Linhas Duplas -> Pós-Cautela +99).
         */
        higienizarTextoParaCopia(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const preLimpo = this.aplicarPreHigienizacaoTexto(textoBruto);
            const normalizado = this.aplicarFiltro3InformacoesELinhas(preLimpo);
            return this.aplicarPosLimpezaDefensiva(normalizado);
        }
    }

    Object.freeze(FiltrosTextoCopia.prototype);
    window.JusGovFiltrosTextoCopia = Object.freeze(FiltrosTextoCopia);
})();
