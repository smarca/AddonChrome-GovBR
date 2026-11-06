/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-validadores.js
 * CLASSE: ValidadoresForenses
 * 
 * FINALIDADE:
 * Validação forense e matemática de dados estruturados do Judiciário Brasileiro:
 * - Algoritmos de validação por Módulo 11 (CPF, CNPJ, PIS/PASEP/NIT, Renavam, Chaves NFe).
 * - Algoritmo de validação por Módulo 97 Base 10 (Processos Judiciais CNJ Resolução 65/2020).
 * - Identificação e extração de entidades estruturadas (datas, horas, moedas, leis, IDs PJe).
 * - Verificação de proteção contra perda acidental da Área de Transferência em cliques em UI.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Campos estruturados forenses (CPF, CNPJ, CNJ, datas, etc.) possuem imunidade contra
 *    a proteção de tamanho mínimo da interface, sendo copiados mesmo com 1 clique.
 * 2. Em textos sem modificadores de teclado (Ctrl/Alt), textos curtos de interface (< 5 caracteres)
 *    são protegidos contra sobreposição involuntária do clipboard do usuário.
 * 3. Integração com a Wiki Forense e aviso flutuante para feedback de validação em tempo real.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regras 2.4, 2.8: Validação Forense e Proteção UI)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 6: Auditoria Forense e Wiki)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovValidadoresForenses) {
        return;
    }

    class ValidadoresForenses {
        #validadorFlutuante;

        constructor(validadorFlutuante = null) {
            this.#validadorFlutuante = validadorFlutuante;
        }

        get validadorFlutuante() {
            return this.#validadorFlutuante;
        }

        set validadorFlutuante(v) {
            this.#validadorFlutuante = v;
        }

        /**
         * Verifica se o texto corresponde a um dado estruturado reconhecido pela auditoria forense.
         */
        isTextoCampoEstruturadoForense(texto) {
            if (!texto || typeof texto !== 'string') return false;
            const t = texto.trim();
            if (!t) return false;

            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const catalogo = cExt.CATALOGO_PADROES_JURIDICOS || [];

            // 1. Verificação matemática / auditoria do AvisoFlutuante se disponível
            try {
                const v = this.#validadorFlutuante || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
                if (v && typeof v.auditarEAlerta === 'function') {
                    const resValidacao = v.auditarEAlerta(t, null);
                    if (resValidacao && (resValidacao.tipo || resValidacao.tipoDado)) return true;
                }
            } catch (_) { }

            // 2. Catálogo oficial de padrões jurídicos congelados
            if (Array.isArray(catalogo)) {
                for (let i = 0; i < catalogo.length; i++) {
                    const entry = catalogo[i];
                    if (!entry || !entry.regexes) continue;
                    for (let j = 0; j < entry.regexes.length; j++) {
                        const rx = entry.regexes[j];
                        if (!rx) continue;
                        try {
                            const rxGlobal = new RegExp('^(?:' + rx.source + ')$', rx.flags.replace(/[gy]/g, ''));
                            if (rxGlobal.test(t)) return true;
                        } catch (_) { }
                    }
                }
            }

            // 3. Máscaras adicionais pontuais (PIS, Benefício INSS, Moeda, Data/Hora, etc.)
            if (
                /^\d{2}\/\d{10}$/.test(t) ||
                /^\d{10}$/.test(t) ||
                /^\d{1,3}\.\d{3}\.\d{3}-\d$/.test(t) ||
                /^\d{2}\/(?:\d{1,3}\.\d{3}\.\d{3}-\d)$/.test(t) ||
                /^\d{3}\.\d{5}\.\d{2}-\d$/.test(t) ||
                /^\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4}(?:\s*[-–—]?\s*\d{2}:\d{2}(?::\d{2})?)?$/.test(t) ||
                /^\d{2}:\d{2}(?::\d{2})?$/.test(t) ||
                /^R\$\s*[\d\.,]+$/.test(t) ||
                /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(t) ||
                /^\d{20}$/.test(t)
            ) {
                return true;
            }

            return false;
        }

        /**
         * Proteção contra perda acidental da Área de Transferência em cliques simples de interface.
         * Exige quantidade mínima de caracteres configurada (padrão 5) caso não seja dado estruturado.
         */
        verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minimoCaracteresInterface = 5) {
            if (temModificadorTeclado) return true;
            if (typeof minimoCaracteresInterface !== 'number' || minimoCaracteresInterface <= 0) return true;
            if (!texto || typeof texto !== 'string') return false;

            const textoSemEspacos = texto.replace(/\s+/g, '');
            if (textoSemEspacos.length >= minimoCaracteresInterface) return true;

            // Se for dado estruturado (ex: data "23/10/26", horário "14:30", etc.), permite copiar mesmo curto
            if (this.isTextoCampoEstruturadoForense(texto)) return true;

            return false;
        }

        /**
         * Localiza bloco forense auto-selecionável sob o cursor dentro de textos de controles de interface.
         */
        localizarBlocoForenseAutoSelecionavelEmInterface(texto, idxCursor, numCliques = 1, combinarDataHoraNoCliqueUnico = false, motorExpressoes = null) {
            if (typeof texto !== 'string' || texto.length === 0) return null;
            if (idxCursor < 0 || idxCursor > texto.length) return null;

            const ehDuplo = numCliques >= 2;
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const tabelaAscii = cExt.TABELA_MASCARA_ASCII;
            const mascara = cExt.MASCARA_CARACTERE || {};

            const charNoCursor = texto[idxCursor] || '';
            const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';

            const ehEspaco = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (tabelaAscii && c < 128) return (tabelaAscii[c] & mascara.ESPACO_BRANCO) !== 0;
                return c === 160 || /\s/.test(ch);
            };

            const ehAlfanum = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (tabelaAscii && c < 128) return (tabelaAscii[c] & (mascara.DIGITO | mascara.LETRA_ASCII)) !== 0;
                return /[\p{L}\p{N}]/u.test(ch);
            };

            const clicouEmEspaco = ehEspaco(charNoCursor) || (ehEspaco(charAnterior) && !ehAlfanum(charNoCursor));

            const motorExp = motorExpressoes || (typeof window !== 'undefined' && window.JusGovEstagioExpressoesInstancia ? window.JusGovEstagioExpressoesInstancia : null);
            if (!motorExp || typeof motorExp.tentarExpandirPadraoComposto !== 'function') {
                return null;
            }

            let res = motorExp.tentarExpandirPadraoComposto(texto, idxCursor, ehDuplo || clicouEmEspaco, ehDuplo);

            if (combinarDataHoraNoCliqueUnico && (!res || res.grupo === 'DATA_COM_HORARIO_CONTIGUO' || res.grupo === 'DATAS_E_HORARIOS')) {
                const resCompostoIntegral = motorExp.tentarExpandirPadraoComposto(texto, idxCursor, true, true);
                if (resCompostoIntegral && resCompostoIntegral.grupo === 'DATA_COM_HORARIO_CONTIGUO') {
                    res = resCompostoIntegral;
                }
            }

            if (!res) return null;
            const trecho = texto.substring(res.inicio, res.fim).trim();
            if (!trecho || trecho.length < 2) return null;
            return res;
        }
    }

    window.JusGovValidadoresForenses = ValidadoresForenses;
})();

