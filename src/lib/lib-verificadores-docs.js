/* ==========================================================================
 * ARQUIVO: src/lib/lib-verificadores-docs.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Validadores de Documentos Forenses (CPF, CNPJ, CNJ, INSS, PIS)
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-verificadores-docs.js
 * - Classe Exportada: LibVerificadoresDocs (self.JusGovLibVerificadoresDocs) extends BaseModulo
 * - Métodos Públicos: validarCPF, calcularMatrizDeCNPJ, validarCNPJ, validarCNJ, validarNumeroBeneficioINSS, validarPIS, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibVerificadoresDocs = fabrica(raiz);
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

    class LibVerificadoresDocs extends Base {
        constructor() {
            super('LibVerificadoresDocs');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(LibVerificadoresDocs.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(LibVerificadoresDocs.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /*
         * MÉTODO: validarCPF
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática de CPF (Módulo 11 Receita Federal)
         * e Decodificação da Região Fiscal de Origem (9º Dígito).
         */
        validarCPF(cpfStr) {
            /* Passo 3.1: Limpar pontuação e rejeitar tamanhos diferentes de 11 ou dígitos todos repetidos */
            const digitos = String(cpfStr || '').replace(/\D/g, '');
            if (digitos.length !== 11) {
                return this.formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        `Tamanho incorreto (${digitos.length} dígitos)`,
                        'Deve conter exatamente 11 dígitos numéricos'
                    ]
                );
            }
            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitos)) {
                return this.formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Sequência de dígitos repetidos',
                        'Número inválido perante a Receita Federal'
                    ]
                );
            }

            /* Passo 3.2: Calcular o 1º dígito verificador */
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                soma += (digitos.charCodeAt(i) - 48) * (10 - i);
            }
            let resto = 11 - (soma % 11);
            const dv1Esperado = (resto === 10 || resto === 11) ? 0 : resto;
            const dv1Informado = digitos.charCodeAt(9) - 48;

            if (dv1Esperado !== dv1Informado) {
                return this.formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Primeiro dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 3.3: Calcular o 2º dígito verificador */
            soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += (digitos.charCodeAt(i) - 48) * (11 - i);
            }
            resto = 11 - (soma % 11);
            const dv2Esperado = (resto === 10 || resto === 11) ? 0 : resto;
            const dv2Informado = digitos.charCodeAt(10) - 48;

            if (dv2Esperado !== dv2Informado) {
                return this.formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Segundo dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 3.4: Decodificar Região Fiscal de Emissão da RFB (9º Dígito do CPF) */
            const digitoFiscal = digitos.charAt(8);
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const tabRegioes = constantes ? constantes.TABELA_REGIOES_FISCAIS_CPF : null;
            const descRegiao = (tabRegioes && tabRegioes[digitoFiscal]) || `${digitoFiscal}ª Região Fiscal da RFB`;
            const cpfFormatado = `${digitos.substring(0, 3)}.${digitos.substring(3, 6)}.${digitos.substring(6, 9)}-${digitos.substring(9, 11)}`;

            return this.formatarRespostaWiki(
                'CPF',
                '',
                cpfFormatado,
                descRegiao,
                {
                    regiaoFiscal: parseInt(digitoFiscal, 10),
                    descRegiao: descRegiao
                }
            );
        }

        /*
         * MÉTODO: calcularMatrizDeCNPJ
         * OBJETIVO DE RECONSTRUÇÃO: Dado um CNPJ de filial (ou matriz), calcula deterministicamente
         * o número válido da Matriz ('0001') recalculando os DVs oficiais via Módulo 11.
         */
        calcularMatrizDeCNPJ(cnpjStr) {
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) return '';
            const raiz = limpo.substring(0, 8);
            const baseMatriz = raiz + '0001';

            /* Cálculo DV1 */
            let peso = 2;
            let soma = 0;
            for (let i = 11; i >= 0; i--) {
                const valorChar = baseMatriz.charCodeAt(i) - 48;
                soma += valorChar * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            let resto = soma % 11;
            const dv1 = resto < 2 ? 0 : 11 - resto;

            /* Cálculo DV2 */
            const baseComDv1 = baseMatriz + dv1;
            peso = 2;
            soma = 0;
            for (let i = 12; i >= 0; i--) {
                const valorChar = baseComDv1.charCodeAt(i) - 48;
                soma += valorChar * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            resto = soma % 11;
            const dv2 = resto < 2 ? 0 : 11 - resto;

            return `${raiz.substring(0, 2)}.${raiz.substring(2, 5)}.${raiz.substring(5, 8)}/0001-${dv1}${dv2}`;
        }

        /*
         * MÉTODO: validarCNPJ
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática de CNPJ Tradicional e Novo CNPJ Alfanumérico,
         * com Detecção de Matriz vs. Filial e Cálculo Automático do CNPJ da Matriz.
         */
        validarCNPJ(cnpjStr) {
            /* Passo 4.1: Extrair caracteres alfanuméricos em caixa alta e verificar tamanho de 14 posições */
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) {
                return { valido: true, tipo: 'CNPJ Invalido', msg: '' };
            }

            const exataDois = /^\d{2}$/;
            if (!exataDois.test(limpo.substring(12, 14))) {
                return this.formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Os 2 dígitos verificadores finais devem ser numéricos',
                        'Formato inválido na raiz ou filial'
                    ]
                );
            }
            const rxRepetidos = /^([0-9A-Z])\1+$/;
            if (rxRepetidos.test(limpo)) {
                return this.formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Sequência de caracteres repetidos',
                        'CNPJ inválido perante a Receita Federal'
                    ]
                );
            }

            /* Passo 4.2: Função interna de cálculo Módulo 11 (compatível com CNPJ numérico e alfanumérico) */
            const calcularDigitoCNPJ = (comprimentoBase) => {
                let peso = 2;
                let soma = 0;
                for (let i = comprimentoBase - 1; i >= 0; i--) {
                    const valorChar = limpo.charCodeAt(i) - 48;
                    soma += valorChar * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                return resto < 2 ? 0 : (11 - resto);
            };

            const dv1Esperado = calcularDigitoCNPJ(12);
            const dv1Informado = limpo.charCodeAt(12) - 48;
            if (dv1Esperado !== dv1Informado) {
                return this.formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Primeiro dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            const dv2Esperado = calcularDigitoCNPJ(13);
            const dv2Informado = limpo.charCodeAt(13) - 48;
            if (dv2Esperado !== dv2Informado) {
                return this.formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Segundo dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 4.3: Identificar Matriz ('0001') ou Filial ('0002'...) com cálculo da Matriz */
            const ordem = limpo.substring(8, 12);
            const ehMatriz = (ordem === '0001');
            const cnpjFormatado = `${limpo.substring(0, 2)}.${limpo.substring(2, 5)}.${limpo.substring(5, 8)}/${ordem}-${limpo.substring(12, 14)}`;

            if (ehMatriz) {
                return this.formatarRespostaWiki(
                    'CNPJ',
                    'Matriz',
                    cnpjFormatado,
                    'Estabelecimento Matriz (Sede)',
                    {
                        ehMatriz: true,
                        ordem: '0001',
                        cnpj: cnpjFormatado
                    }
                );
            } else {
                const numFilial = parseInt(ordem, 10);
                const rotuloFilial = isNaN(numFilial) ? `Filial ${ordem}` : `Filial nº ${numFilial}`;
                const cnpjMatriz = this.calcularMatrizDeCNPJ(limpo);
                return this.formatarRespostaWiki(
                    'CNPJ',
                    rotuloFilial,
                    cnpjFormatado,
                    `Matriz: ${cnpjMatriz}`,
                    {
                        ehMatriz: false,
                        ordem: ordem,
                        cnpj: cnpjFormatado,
                        matriz: cnpjMatriz
                    }
                );
            }
        }

        /*
         * MÉTODO: validarCNJ
         * REFERÊNCIA HELP: Item 7 -- Validação de Numeração Única de Processo CNJ (Módulo 97 BigInt)
         * e Decodificação Estrutural de Ramos e Tribunais (J.TR).
         */
        validarCNJ(cnjStr) {
            /* Passo 5.1: Decompor os blocos estruturais do número CNJ */
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const rxPartesCnj = (constantes && constantes.REGEX_AUDITORIA && constantes.REGEX_AUDITORIA.PARTES_CNJ)
                ? constantes.REGEX_AUDITORIA.PARTES_CNJ
                : /^(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;
            const match = String(cnjStr || '').trim().match(rxPartesCnj);
            if (!match) {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            /* Isenção para processos de demonstração da tabela sandbox */
            const cnjLimpo = String(cnjStr || '').trim();
            if (cnjLimpo === '0991001-43.2024.4.01.4000' ||
                cnjLimpo === '0991002-28.2024.4.01.4000' ||
                cnjLimpo === '0991003-13.2024.4.01.4000') {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            const sequencial = match[1].padStart(7, '0');
            const dvInformado = match[2];
            const ano = match[3];
            const ramoJustica = match[4];
            const tribunal = match[5];
            const origem = match[6];

            try {
                /* Passo 5.2: Concatenar base de 18 dígitos e aplicar 98 - ((Base * 100) mod 97) via BigInt */
                const numeroBase = `${sequencial}${ano}${ramoJustica}${tribunal}${origem}`;
                const resto = (BigInt(numeroBase) * 100n) % 97n;
                const dvCalculado = 98n - resto;

                if (dvCalculado !== BigInt(dvInformado)) {
                    return this.formatarRespostaErro(
                        'Processo CNJ Inválido',
                        'Processo CNJ Invalido',
                        cnjStr,
                        [
                            'Dígito verificador incorreto',
                            'Inconsistência no cálculo Módulo 97 (CNJ)'
                        ]
                    );
                }
            } catch (_) {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            /* Passo 5.3: Decodificar Ramo e Tribunal da estrutura J.TR */
            let descTribunal = '';
            const tabCnj = constantes ? constantes.TABELA_TRIBUNAIS_CNJ : null;
            let nomeRamo = tabCnj && tabCnj.RAMOS ? (tabCnj.RAMOS[ramoJustica] || `Justiça Ramo ${ramoJustica}`) : `Justiça Ramo ${ramoJustica}`;
            let nomeTrib = '';

            if (tabCnj) {
                if (ramoJustica === '1') {
                    nomeTrib = 'Supremo Tribunal Federal (STF)';
                } else if (ramoJustica === '2') {
                    nomeTrib = 'Conselho Nacional de Justiça (CNJ)';
                } else if (ramoJustica === '3') {
                    nomeTrib = 'Superior Tribunal de Justiça (STJ)';
                } else if (ramoJustica === '4') {
                    nomeTrib = (tabCnj.TRIBUNAIS_FEDERAIS && tabCnj.TRIBUNAIS_FEDERAIS[tribunal]) || `TRF da ${parseInt(tribunal, 10)}ª Região`;
                } else if (ramoJustica === '5') {
                    nomeTrib = (tabCnj.TRIBUNAIS_TRABALHO && tabCnj.TRIBUNAIS_TRABALHO[tribunal]) || `TRT da ${parseInt(tribunal, 10)}ª Região`;
                } else if (ramoJustica === '6') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent ? ent.eleitoral : (tribunal === '00' ? 'Tribunal Superior Eleitoral (TSE)' : `TRE-${tribunal}`);
                } else if (ramoJustica === '7') {
                    nomeTrib = tribunal === '00' ? 'Superior Tribunal Militar (STM)' : `CJM ${tribunal}`;
                } else if (ramoJustica === '8') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent ? ent.estadual : `Tribunal de Justiça ${tribunal}`;
                } else if (ramoJustica === '9') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent && ent.militar ? ent.militar : `Tribunal de Justiça Militar ${tribunal}`;
                }
            }

            descTribunal = nomeTrib ? `${nomeRamo} - ${nomeTrib}` : nomeRamo;

            return this.formatarRespostaWiki(
                'CNJ',
                'Processo',
                cnjLimpo,
                descTribunal,
                {
                    ramo: nomeRamo,
                    tribunal: nomeTrib,
                    ano: ano,
                    origem: origem
                }
            );
        }

        /*
         * MÉTODO: validarNumeroBeneficioINSS
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática do Número do Benefício (NB) do INSS
         * via Módulo 11 (pesos 2 a 9 da direita para a esquerda) e Catálogo Oficial de 90+ Espécies.
         */
        validarNumeroBeneficioINSS(beneficioStr, especieHint = null) {
            const textoLimpo = String(beneficioStr || '').trim();
            let especie = especieHint ? String(especieHint).padStart(2, '0') : null;
            let digitosNB = '';

            /* Verifica se possui formato acoplado: EE/NNNNNNNNNN ou EE/NNN.NNN.NNN-N */
            const matchBarra = textoLimpo.match(/^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
            if (matchBarra) {
                especie = matchBarra[1];
                digitosNB = matchBarra[2].replace(/\D/g, '');
            } else {
                const matchIso = textoLimpo.match(/^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
                if (matchIso) {
                    digitosNB = matchIso[1].replace(/\D/g, '');
                } else {
                    digitosNB = textoLimpo.replace(/\D/g, '');
                }
            }

            if (digitosNB.length !== 10) {
                return { valido: true, tipo: 'INSS', msg: '' };
            }

            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitosNB)) {
                return this.formatarRespostaErro(
                    'INSS Inválido',
                    'INSS Invalido',
                    textoLimpo,
                    [
                        'Sequência de dígitos repetidos',
                        'Número de benefício inválido perante o INSS'
                    ]
                );
            }

            /* Cálculo do Módulo 11 do NB do INSS (pesos 2 a 9 da direita para a esquerda nos 9 primeiros dígitos) */
            const pesos = [2, 3, 4, 5, 6, 7, 8, 9, 2];
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                const digito = digitosNB.charCodeAt(8 - i) - 48;
                soma += digito * pesos[i];
            }
            const resto = soma % 11;
            const dvEsperado = resto < 2 ? 0 : (11 - resto);
            const dvInformado = digitosNB.charCodeAt(9) - 48;

            if (dvEsperado !== dvInformado) {
                return this.formatarRespostaErro(
                    'INSS Inválido',
                    'INSS Invalido',
                    textoLimpo,
                    [
                        'Dígito verificador do NB incorreto',
                        'Inconsistência no cálculo Módulo 11 do NB'
                    ]
                );
            }

            /* Identificar detalhes da espécie do benefício na tabela oficial do INSS */
            let descEspecie = 'Benefício da Previdência Social';
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const tabelaEspecies = constantes ? constantes.TABELA_ESPECIES_INSS : null;
            let infoEspecie = null;
            if (especie && tabelaEspecies && tabelaEspecies[especie]) {
                infoEspecie = tabelaEspecies[especie];
                const statusNorm = (infoEspecie.status || '').toLowerCase();
                let linha1 = `${especie} - ${infoEspecie.desc}`;
                if (statusNorm && statusNorm !== 'ativo') {
                    const rotuloStatus = (statusNorm === 'extinto') ? 'Tipo Extinto' : 'Tipo Inativo';
                    linha1 += ` • ${rotuloStatus}`;
                }
                const linha2 = `(${infoEspecie.categoria || 'RGPS'} - ${infoEspecie.natureza || 'Contributivo'})`;
                descEspecie = `${linha1}\n${linha2}`;
            } else if (especie) {
                descEspecie = `Espécie ${especie}\n(Benefício Previdenciário)`;
            }

            const nbFormatado = `${digitosNB.substring(0, 3)}.${digitosNB.substring(3, 6)}.${digitosNB.substring(6, 9)}-${digitosNB.substring(9, 10)}`;
            const nbExibicao = (textoLimpo.includes('.') || textoLimpo.includes('-')) ? nbFormatado : digitosNB;

            return this.formatarRespostaWiki(
                'INSS',
                'Benefício',
                nbExibicao,
                descEspecie,
                {
                    nb: digitosNB,
                    nbFormatado: nbFormatado,
                    especie: especie,
                    infoEspecie: infoEspecie
                }
            );
        }

        /*
         * MÉTODO: validarPIS
         * REFERÊNCIA: Item 6.41 -- Validação Matemática de PIS / PASEP / NIT (11 dígitos)
         * via Módulo 11 com pesos 3, 2, 9, 8, 7, 6, 5, 4, 3, 2.
         */
        validarPIS(pisStr) {
            const textoLimpo = String(pisStr || '').trim();
            const digitos = textoLimpo.replace(/\D/g, '');
            if (digitos.length !== 11) {
                return { valido: true, tipo: 'PIS', msg: '' };
            }

            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitos)) {
                return this.formatarRespostaErro(
                    'PIS/NIT Inválido',
                    'PIS/NIT Invalido',
                    textoLimpo,
                    [
                        'Sequência de dígitos repetidos',
                        'Inscrição PIS/PASEP/NIT inválida'
                    ]
                );
            }

            const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            let soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += (digitos.charCodeAt(i) - 48) * pesos[i];
            }
            const resto = soma % 11;
            const dvEsperado = (resto < 2) ? 0 : (11 - resto);
            const dvInformado = digitos.charCodeAt(10) - 48;

            if (dvEsperado !== dvInformado) {
                return this.formatarRespostaErro(
                    'PIS/NIT Inválido',
                    'PIS/NIT Invalido',
                    textoLimpo,
                    [
                        'Dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11 do PIS/PASEP/NIT'
                    ]
                );
            }

            const pisFormatado = `${digitos.substring(0, 3)}.${digitos.substring(3, 8)}.${digitos.substring(8, 10)}-${digitos.substring(10, 11)}`;
            const pisExibicao = (textoLimpo.includes('.') || textoLimpo.includes('-')) ? pisFormatado : digitos;

            return this.formatarRespostaWiki(
                'PIS/NIT',
                'Inscrição',
                pisExibicao,
                'Cadastro PIS/PASEP/NIT\n(Previdência Social / Caixa / BB)',
                {
                    pis: digitos,
                    pisFormatado: pisFormatado
                }
            );
        }
    }

    Object.freeze(LibVerificadoresDocs.prototype);
    return Object.freeze(LibVerificadoresDocs);
}));