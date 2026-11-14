/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-validadores.js
 * CLASSE: ValidadoresForenses
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-validadores.js
 * - Classe Exportada: ValidadoresForenses (window.JusGovValidadoresForenses)
 * - Métodos Públicos: isBlocoVerificavel(texto), isTextoCampoEstruturadoForense(texto), verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minimoCaracteresInterface), localizarBlocoForenseAutoSelecionavelEmInterface(texto, idxCursor, numCliques, combinarDataHoraNoCliqueUnico, motorExpressoes), get/set validadorFlutuante
 * - Dependências Injetadas: window.JusGovConstantes, window.JusGovValidadorAtivo (AvisoFlutuante), window.JusGovEstagioExpressoesInstancia
 * - Regras / Seções: Regras 2.4/2.8, Seção 6.9, BP-03 (cache WeakMap de RegExp ancoradas), Seção 6.64 (blindagem POO), Subcategoria de Blocos Verificáveis em Interfaces (PJe/Tribunais)
 * 
 * FINALIDADE:
 * Validação forense e matemática de dados estruturados do Judiciário Brasileiro:
 * - Subcategoria estrita de Blocos Verificáveis (datas, números puros, CPF, CNPJ, placas, CNIS, NB, moedas, CEP, CNJ).
 * - Algoritmos de validação por Módulo 11 (CPF, CNPJ, PIS/PASEP/NIT, Renavam, Chaves NFe).
 * - Algoritmo de validação por Módulo 97 Base 10 (Processos Judiciais CNJ Resolução 65/2020).
 * - Identificação e extração de entidades estruturadas (datas, horas, moedas, leis, IDs PJe).
 * - Verificação de proteção contra perda acidental da Área de Transferência em cliques em UI.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Subcategoria de Blocos Verificáveis: Em interfaces (telas, menus, dropdowns, headers PJe,
 *    #poloAtivo/#poloPassivo, timeline, cards de tarefas), cliques sem Alt SÓ auto-selecionam/copiam
 *    se o trecho for um dado verificável (data, números puros com >= 1 dígito, CPF, CNPJ, etc.).
 *    Palavras comuns, rótulos e nomes de partes jamais são auto-copiados em interface sem Alt.
 * 2. Campos estruturados forenses (CPF, CNPJ, CNJ, datas, etc.) possuem imunidade contra
 *    a proteção de tamanho mínimo da interface, sendo copiados mesmo com 1 clique.
 * 3. Em textos sem modificadores de teclado (Ctrl/Alt), textos curtos de interface (< 5 caracteres)
 *    são protegidos contra sobreposição involuntária do clipboard do usuário.
 * 4. Integração com a Wiki Forense e aviso flutuante para feedback de validação em tempo real.
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

    /* Passo 1.1 (BP-03 / Seção 6.64): Cache WeakMap O(1) para expressões regulares ancoradas ^(?:...)$,
     * eliminando recompilações repetidas de new RegExp(...) a cada clique no catálogo jurídico. */
    const CACHE_REGEX_ANCORADA = typeof WeakMap === 'function' ? new WeakMap() : null;
    function obterRegexAncoradaCacheada(rxOriginal) {
        if (!rxOriginal) return null;
        if (CACHE_REGEX_ANCORADA && CACHE_REGEX_ANCORADA.has(rxOriginal)) {
            return CACHE_REGEX_ANCORADA.get(rxOriginal);
        }
        try {
            const ancorada = new RegExp('^(?:' + rxOriginal.source + ')$', rxOriginal.flags.replace(/[gy]/g, ''));
            if (CACHE_REGEX_ANCORADA) {
                CACHE_REGEX_ANCORADA.set(rxOriginal, ancorada);
            }
            return ancorada;
        } catch (_) {
            return null;
        }
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
         * DIRETRIZ REFORÇO INTERFACE: Subcategoria de Blocos Verificáveis.
         * Distingue blocos genéricos de blocos contendo dados estritamente verificáveis:
         * - Datas (numéricas, por extenso, abreviadas, competência mês/ano, contíguas com hora).
         * - Números puros e sequências numéricas úteis (comprimento >= 1, ex: "42", "120", "2391416998").
         * - CPF (formatado ou 11 dígitos verificados).
         * - CNPJ (formatado tradicional, alfanumérico ou 14 dígitos verificados).
         * - Placas veiculares (padrão antigo e Mercosul).
         * - CNIS, Benefício INSS (NB), PIS, PASEP, NIT.
         * - Processos judiciais CNJ e administrativos SEI.
         * - Horários e intervalos de horário.
         * - Moeda (R$) e valores monetários.
         * - CEP e telefones.
         * - Dispositivos legais numerados e referências ID/páginas do PJe.
         * Em interfaces, apenas blocos verificáveis são auto-selecionáveis/copiáveis sem Alt.
         */
        isBlocoVerificavel(texto) {
            if (!texto || typeof texto !== 'string') return false;
            const t = texto.trim();
            if (!t) return false;

            // 1. Números puros e sequências numéricas úteis (comprimento >= 1)
            // Requisito expresso: "Sempre incluir numeros nos blocos verificáveis ok?"
            if (/^\d+$/.test(t)) return true;
            if (/^\d{1,3}(?:\.\d{3})+$/.test(t)) return true;
            if (/^\d+(?:,\d+)?$/.test(t)) return true;
            if (/^[+\-\u2212\u2013]?\d+(?:[.,]\d+)?%?$/.test(t)) return true;

            // 2. Verificação matemática / auditoria do AvisoFlutuante se disponível (CPF, CNPJ, PIS, etc.)
            try {
                const v = this.#validadorFlutuante || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
                if (v && typeof v.auditarEAlerta === 'function') {
                    const resValidacao = v.auditarEAlerta(t, null);
                    if (resValidacao && (resValidacao.tipo || resValidacao.tipoDado)) return true;
                }
            } catch (_) { }

            // 3. Catálogo oficial de padrões jurídicos congelados ancorado
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const catalogo = cExt.CATALOGO_PADROES_JURIDICOS || [];
            if (Array.isArray(catalogo)) {
                for (let i = 0; i < catalogo.length; i++) {
                    const entry = catalogo[i];
                    if (!entry || !entry.regexes) continue;
                    for (let j = 0; j < entry.regexes.length; j++) {
                        const rx = entry.regexes[j];
                        if (!rx) continue;
                        const rxGlobal = obterRegexAncoradaCacheada(rx);
                        if (rxGlobal && rxGlobal.test(t)) return true;
                    }
                }
            }

            // 4. Máscaras estruturadas adicionais pontuais
            if (
                // Placas veiculares (padrão Mercosul ou padrão antigo)
                /^[A-Z]{3}[\- ]?[0-9][A-Z0-9][0-9]{2}$/i.test(t) ||
                // Benefício INSS (NB) com ou sem espécie / Protocolo Administrativo (9 dígitos) / PIS / PASEP / NIT
                /^\d{2}\/\d{10}$/.test(t) ||
                /^\d{9,10}$/.test(t) ||
                /^\d{1,3}\.\d{3}\.\d{3}-[0-9X]$/i.test(t) ||
                /^\d{2}\/(?:\d{1,3}\.\d{3}\.\d{3}-[0-9X])$/i.test(t) ||
                /^\d{3}\.\d{5}\.\d{2}-\d$/.test(t) ||
                // CPF e CNPJ formatados com ou sem anotação em parênteses
                /^\d{3}\.\d{3}\.\d{3}-\d{2}(?:\s*\((?:CPF)\))?$/i.test(t) ||
                /^[A-Z0-9]{2,3}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}(?:\s*\((?:CNPJ)\))?$/i.test(t) ||
                // Datas numéricas
                /^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(t) ||
                // Datas abreviadas ou por extenso (ex: "26 out. 2026", "26 de outubro de 2026")
                /^(?:(?:segunda|terça|terca|quarta|quinta|sexta)(?:-feira)?[,.\s]+|(?:sabado|sábado|domingo)[,.\s]+)?\d{1,2}[\s\/\-]+(?:de\s+)?(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)[\s\/\-]+(?:de\s+)?\d{2,4}$/iu.test(t) ||
                // Competência Mês/Ano (ex: "out. 2026", "out/2026")
                /^(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)(?:\.?\s+|[\s\/\-]+(?:de\s+)?)\d{2,4}$/iu.test(t) ||
                // Datas com horário contíguo
                /^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}(?:\s*[-–—,]?\s*|\s+(?:às|as)\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:BRT|BRST|UTC|GMT))?$/iu.test(t) ||
                // Horários isolados
                /^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(t) ||
                /^(?:[01]?\d|2[0-3])h(?:[0-5]\d(?:min)?)?$/i.test(t) ||
                // Moeda / Valores monetários em Reais
                /^(?:[+\-\u2212\u2013]\s*)?R\$\s*[+\-\u2212\u2013]?\s*[\d\.,]+$/i.test(t) ||
                // Processo Judicial CNJ e Processo Administrativo SEI
                /^\d{1,7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(t) ||
                /^\d{5}\.\d{6}\/\d{4}-\d{2}$/.test(t) ||
                /^\d{20}$/.test(t) ||
                // Código de Endereçamento Postal CEP
                /^\d{2}\.?\d{3}-\d{3}$/.test(t) ||
                // Telefones nacionais
                /^(?:\+\d{1,3}[\t \u00A0\-]?)?(?:\(\d{2,3}\)[\t \u00A0\-]?)?(?:9[\t \u00A0\-]?\d{4}|\d{4})[\t \u00A0\-]\d{4}$/.test(t) ||
                /^(?:0[3589]00|[34]00\d)[\t \u00A0\-]?\d{3,4}[\t \u00A0\-]?\d{4,5}$/.test(t) ||
                // IDs do PJe, referências fls., protocolos administrativos e números de protocolo/ano
                /^(?:ids?\.?|fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|p\p{L}ginas?|num\.?|protocolos?(?:\s+administrativos?)?\.?|prot\.?)\s*[:\-]?\s*(?:n\.?[\u00BA\u00B0\u00AAo.]?\s*)?\d+(?:\.\d+)*[vV]?$/iu.test(t) ||
                /^\d{1,12}\/\d{2,4}$/.test(t)
            ) {
                return true;
            }

            return false;
        }

        /**
         * Verifica se o texto corresponde a um dado estruturado reconhecido pela auditoria forense.
         */
        isTextoCampoEstruturadoForense(texto) {
            return this.isBlocoVerificavel(texto);
        }

        /**
         * FUNÇÃO: verificarProtecaoTamanhoMinimoInterface
         * OBJETIVO DE RECONSTRUÇÃO: Em textos da página ou elementos de interface, caso não seja
         * um campo estruturado forense, evita a perda acidental do conteúdo da Área de Transferência.
         * SEÇÃO 6.80: Em seleções por arraste sem Alt (minimoCaracteresInterface = 2), o limiar
         * mínimo absoluto exigido é de 2 caracteres úteis após filtro de espaços em branco,
         * bloqueando micro-arrastos acidentais de 1 letra, 1 número ou espaços em branco.
         * @param {string} texto
         * @param {Element} elAlvo
         * @param {boolean} temModificadorTeclado
         * @param {number} [minimoCaracteresInterface=5]
         * @returns {boolean}
         */
        verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minimoCaracteresInterface = 5) {
            if (temModificadorTeclado) return true;
            if (!texto || typeof texto !== 'string') return false;

            const textoSemEspacos = texto.replace(/\s+/g, '');
            if (textoSemEspacos.length === 0) return false;

            // SEÇÃO 6.80: Em seleções por arraste sem Alt (onde o limiar de 2 caracteres é passado explicitamente),
            // exige compulsoriamente pelo menos 2 caracteres úteis, bloqueando 1 letra, 1 número isolado ("1") ou espaços.
            if (minimoCaracteresInterface === 2) {
                return textoSemEspacos.length >= 2;
            }

            // BUG-15: Se for dado estruturado ou número puro (/^\d+$/), limiar mínimo é 1 caractere útil
            if (this.isTextoCampoEstruturadoForense(texto)) return textoSemEspacos.length >= 1;

            if (typeof minimoCaracteresInterface !== 'number' || minimoCaracteresInterface <= 0) return true;
            if (textoSemEspacos.length >= minimoCaracteresInterface) return true;

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

            if (!res) {
                // BUG-14 / BUG-15: Suporte a números puros e blocos curtos sob o cursor em interface
                let ini = idxCursor;
                while (ini > 0 && /\d/.test(texto[ini - 1])) ini--;
                let fim = idxCursor;
                while (fim < texto.length && /\d/.test(texto[fim])) fim++;
                if (fim > ini) {
                    res = { inicio: ini, fim: fim, grupo: 'NUMERO_PURO' };
                }
            }

            if (!res) return null;
            const trecho = texto.substring(res.inicio, res.fim).trim();
            // BUG-15: Limiar mínimo de 1 caractere útil
            if (!trecho || trecho.length < 1) return null;

            // DIRETRIZ REFORÇO INTERFACE: SÓ retorna se for BLOCO VERIFICÁVEL (data, números, CPF, CNPJ, etc.)!
            if (!this.isBlocoVerificavel(trecho)) {
                return null;
            }

            return res;
        }
    }

    Object.freeze(ValidadoresForenses.prototype);
    window.JusGovValidadoresForenses = Object.freeze(ValidadoresForenses);
})();

