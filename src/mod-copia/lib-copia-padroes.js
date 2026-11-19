/* ==========================================================================
 * ARQUIVO: src/mod-copia/lib-copia-padroes.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: PadroesReconhecidosCopia
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/lib-copia-padroes.js
 * - Classe Exportada: PadroesReconhecidosCopia (window.JusGovPadroesCopia)
 * - Métodos Públicos: aplicarLimpezaNumericaComTravaAlfabetica(texto, modoShiftCnj), verificarSeTextoEhBlocoOuPalavraUnica(texto), ehTextoBlocoMultiSegmento(texto), identificarGrupoPadraoNoTexto(texto), obterCatalogoPadroesCopia()
 * - Dependências Injetadas: window.JusGovConstantes (EXPRESSOES_REGULARES, CATALOGO_PADROES_JURIDICOS, REGEX_AUDITORIA)
 * - Regras / Seções: ENG-02 (lib-<módulo>-*), Regra de Ouro da Formatação, Seção 6.26 (Trava Alfabética Shift), ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Biblioteca interna exclusiva do módulo de Cópia responsável pelo catálogo de padrões
 * reconhecidos automaticamente no pipeline de cópia/seleção (CNJ, CPF, CNPJ alfanumérico,
 * datas/horários, benefícios INSS, IDs curtos, sequências espaçadas e trava alfabética).
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovPadroesCopia) {
        return;
    }

    class PadroesReconhecidosCopia {
        constructor(constantesExt = null) {
            this.constantes = constantesExt ||
                (typeof window !== 'undefined' && window.JusGovConstantes ? window.JusGovConstantes : {});
        }

        #obterConstantes() {
            if (this.constantes && this.constantes.EXPRESSOES_REGULARES) {
                return this.constantes;
            }
            return (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
        }

        obterCatalogoPadroesCopia() {
            const cExt = this.#obterConstantes();
            return Array.isArray(cExt.CATALOGO_PADROES_JURIDICOS) ? cExt.CATALOGO_PADROES_JURIDICOS : [];
        }

        ehTextoBlocoMultiSegmento(texto) {
            if (!texto) return false;
            const t = String(texto).trim();
            if (!t || t.length > 128 || /\s/.test(t)) return false;
            return /[\p{L}\p{N}]+[^\p{L}\p{N}\s]+[\p{L}\p{N}]+/u.test(t);
        }

        /**
         * Regra de Limpeza Numérica Estrita para Shift + Botão Esquerdo/Cópia:
         * Extrai dígitos de documentos/datas/CNJ (com zero-pad conforme modoShiftCnj) mantendo
         * Trava Alfabética (retorna null se restarem letras fora de CNPJ alfanumérico ou prefixo INSS).
         */
        aplicarLimpezaNumericaComTravaAlfabetica(textoBruto, modoShiftCnj = 'padrao') {
            if (typeof textoBruto !== 'string') return null;
            const textoTrim = textoBruto.trim();
            if (!textoTrim) return null;

            const cExt = this.#obterConstantes();
            const regexAud = cExt.REGEX_AUDITORIA || {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            if (regexAud.CNPJ_ISOLADO && regexAud.CNPJ_ISOLADO.test(textoTrim)) {
                const cnpjLimpo = textoTrim.toUpperCase().replace(/[^0-9A-Z]/g, '');
                return cnpjLimpo.length > 0 ? cnpjLimpo : null;
            }

            const matchInssComEsp = textoTrim.match(/^(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
            if (matchInssComEsp) {
                const nbLimpo = matchInssComEsp[2].replace(/\D+/g, '');
                return nbLimpo.length > 0 ? nbLimpo : null;
            }

            const semPontuacaoESimbolos = textoTrim.replace(/[\s\u00A0\p{P}\p{S}]+/gu, '');
            if (!semPontuacaoESimbolos) return null;

            if (/[\p{L}]/u.test(semPontuacaoESimbolos)) {
                return null;
            }

            if (!/^\d+$/.test(semPontuacaoESimbolos)) {
                return null;
            }

            let digitosPuros = semPontuacaoESimbolos;
            if (rx.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL) {
                const matchCnj = textoTrim.match(rx.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL);
                if (matchCnj && matchCnj[0] === textoTrim && modoShiftCnj !== 'semZeros') {
                    const seqPreenchida = matchCnj[1].padStart(7, '0');
                    digitosPuros = seqPreenchida + digitosPuros.substring(matchCnj[1].length);
                }
            }

            return digitosPuros;
        }

        identificarGrupoPadraoNoTexto(textoAlvo) {
            if (!textoAlvo || typeof textoAlvo !== 'string') return null;
            const textoTrim = textoAlvo.trim();
            if (!textoTrim) return null;

            const catalogo = this.obterCatalogoPadroesCopia();
            for (let i = 0; i < catalogo.length; i++) {
                const entry = catalogo[i];
                if (!entry || !entry.regexes) continue;
                for (let j = 0; j < entry.regexes.length; j++) {
                    const match = textoTrim.match(entry.regexes[j]);
                    if (match && match[0] === textoTrim) {
                        return entry.grupo || entry.id || 'PADRAO_CATALOGO';
                    }
                }
            }
            return null;
        }

        /**
         * Regra de Ouro da Formatação:
         * Blocos forenses isolados (datas, CPF, CNPJ, CNJ, moedas, IDs curtos "id 12345",
         * palavras únicas e pequenas frases nominais <= 2 palavras / <= 18 chars) devem
         * sempre ir para a área de transferência como texto puro (text/plain), facilitando a colagem.
         */
        verificarSeTextoEhBlocoOuPalavraUnica(textoAlvo) {
            if (!textoAlvo || typeof textoAlvo !== 'string') return false;
            const textoTrim = textoAlvo.trim();
            if (!textoTrim) return false;

            const cExt = this.#obterConstantes();
            const rx = cExt.EXPRESSOES_REGULARES || {};
            const regexAud = cExt.REGEX_AUDITORIA || {};

            if (rx.CONTEM_ESPACO) {
                if (!rx.CONTEM_ESPACO.test(textoTrim)) return true;
            } else if (!/[\s\u00A0]/.test(textoTrim)) {
                return true;
            }

            if (this.identificarGrupoPadraoNoTexto(textoTrim)) {
                return true;
            }

            if (
                (regexAud.DATA_NUMERICA_COM_HORARIO_AUDITORIA && regexAud.DATA_NUMERICA_COM_HORARIO_AUDITORIA.test(textoTrim)) ||
                (regexAud.HORARIO_ISOLADO && regexAud.HORARIO_ISOLADO.test(textoTrim)) ||
                (regexAud.DATA_EXTENSO_OU_ABREV && regexAud.DATA_EXTENSO_OU_ABREV.test(textoTrim)) ||
                (regexAud.DATA_ISOLADA && regexAud.DATA_ISOLADA.test(textoTrim)) ||
                (regexAud.CPF_ISOLADO && regexAud.CPF_ISOLADO.test(textoTrim)) ||
                (regexAud.CNPJ_ISOLADO && regexAud.CNPJ_ISOLADO.test(textoTrim)) ||
                (regexAud.CNJ_ISOLADO && regexAud.CNJ_ISOLADO.test(textoTrim)) ||
                (regexAud.BENEFICIO_INSS_COM_ESPECIE && regexAud.BENEFICIO_INSS_COM_ESPECIE.test(textoTrim)) ||
                (regexAud.BENEFICIO_INSS_ISOLADO && regexAud.BENEFICIO_INSS_ISOLADO.test(textoTrim))
            ) {
                return true;
            }

            if (rx.MULTIPLOS_NUMEROS_ESPACADOS) {
                const mEspacado = textoTrim.match(rx.MULTIPLOS_NUMEROS_ESPACADOS);
                if (mEspacado && mEspacado[0] === textoTrim) return true;
            }

            if (/^(?:id|doc|fls?|p[gá]\.?|reg|proc|protocolo|ref|cod|matr[ií]cula|n[úuº°\.]{0,3})\s*[:#\-]?\s*\d[\d\.\-\/]*$/i.test(textoTrim)) {
                return true;
            }

            const palavrasCurtas = textoTrim.split(/\s+/).filter(Boolean);
            if (palavrasCurtas.length <= 2 && textoTrim.length <= 18 && !/[.!?;,]/.test(textoTrim)) {
                return true;
            }

            return false;
        }
    }

    Object.freeze(PadroesReconhecidosCopia.prototype);
    window.JusGovPadroesCopia = Object.freeze(PadroesReconhecidosCopia);
})();
