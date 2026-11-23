/* ==========================================================================
 * ARQUIVO: src/lib/lib-verificadores-boletos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Validadores de Boletos, Arrecadação e Módulos 10/11/97
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-verificadores-boletos.js
 * - Classe Exportada: LibVerificadoresBoletos (self.JusGovLibVerificadoresBoletos) extends BaseModulo
 * - Métodos Públicos: validarLinhaArrecadacaoTributos, validarBoletoBancario, validarModulo10, validarModulo11, validarModulo97, validarNumeroGenericoFallback, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibVerificadoresBoletos = fabrica(raiz);
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

    class LibVerificadoresBoletos extends Base {
        constructor() {
            super('LibVerificadoresBoletos');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(LibVerificadoresBoletos.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(LibVerificadoresBoletos.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /*
         * MÉTODO: validarLinhaArrecadacaoTributos
         * SEÇÃO 6.60: Validação Algorítmica de Guias e Tributos Governamentais (DARF, GRU, IPTU, Concessionárias)
         * - 48 dígitos divididos em 4 blocos de 11 dígitos + 1 DV por bloco.
         * - 1º dígito é compulsoriamente '8' (Arrecadação).
         * - 2º dígito indica o segmento: 1 (IPTU/Prefeituras), 5 (DARF/GRU/Federal), etc.
         * - 3º dígito indica o módulo matemático: 6 ou 7 (Mod 10 / Luhn), 8 ou 9 (Mod 11 pesos 2..9).
         */
        validarLinhaArrecadacaoTributos(linhaStr) {
            if (!linhaStr || typeof linhaStr !== 'string') return { valido: true, msg: '' };
            const textoLimpo = linhaStr.trim();
            const digitos = textoLimpo.replace(/\D/g, '');

            if (digitos.length !== 48 || digitos[0] !== '8') {
                return { valido: true, msg: '' };
            }

            const segCodigo = digitos[1];
            const modCodigo = digitos[2];

            let nomeSegmento = 'Arrecadação / Convênios';
            if (segCodigo === '1') nomeSegmento = 'IPTU / Tributo Municipal';
            else if (segCodigo === '5') nomeSegmento = 'DARF / GRU / Tributo Federal';
            else if (segCodigo === '6' || segCodigo === '7') nomeSegmento = 'Guia / Arrecadação Governamental';
            else if (segCodigo === '2') nomeSegmento = 'Saneamento / Água';
            else if (segCodigo === '3') nomeSegmento = 'Energia Elétrica / Gás';
            else if (segCodigo === '4') nomeSegmento = 'Telecomunicações';

            const usaMod11 = (modCodigo === '8' || modCodigo === '9');
            const erros = [];

            for (let b = 0; b < 4; b++) {
                const inicioBloco = b * 12;
                const corpo = digitos.substring(inicioBloco, inicioBloco + 11);
                const dvInformado = digitos.charCodeAt(inicioBloco + 11) - 48;
                let dvEsperado;

                if (usaMod11) {
                    let soma = 0;
                    let peso = 2;
                    for (let i = 10; i >= 0; i--) {
                        soma += (corpo.charCodeAt(i) - 48) * peso;
                        peso = (peso === 9) ? 2 : peso + 1;
                    }
                    const resto = soma % 11;
                    dvEsperado = (resto === 0 || resto === 1) ? 0 : ((resto === 10) ? 1 : (11 - resto));
                } else {
                    let soma = 0;
                    let alternar = true;
                    for (let i = 10; i >= 0; i--) {
                        let d = (corpo.charCodeAt(i) - 48);
                        if (alternar) {
                            d *= 2;
                            if (d > 9) d -= 9;
                        }
                        soma += d;
                        alternar = !alternar;
                    }
                    const resto = soma % 10;
                    dvEsperado = (resto === 0) ? 0 : (10 - resto);
                }

                if (dvEsperado !== dvInformado) {
                    erros.push(`Dígito verificador do Bloco ${b + 1} incorreto`);
                }
            }

            if (erros.length > 0) {
                return this.formatarRespostaErro(
                    'Boleto Arrecadação/Tributo Inválido',
                    'Boleto Arrecadacao Invalido',
                    textoLimpo,
                    erros
                );
            }

            return this.formatarRespostaWiki(
                'Boleto Tributo/Arrecadação',
                nomeSegmento,
                textoLimpo,
                `Linha de 48 dígitos validada (Mod ${usaMod11 ? 11 : 10})\nSegmento: ${nomeSegmento}`,
                {
                    tipo: 'ARRECADACAO_FEBRABAN',
                    segmento: nomeSegmento,
                    modulo: usaMod11 ? 11 : 10
                }
            );
        }

        /*
         * MÉTODO: validarBoletoBancario
         * SEÇÃO 6.60: Validação Algorítmica de Linha Digitável de Boleto Bancário (FEBRABAN / GRU Cobrança BB)
         * - 47 dígitos divididos em 5 campos (Campos 1, 2, 3 com DVs Mod 10).
         */
        validarBoletoBancario(linhaStr) {
            if (!linhaStr || typeof linhaStr !== 'string') return { valido: true, msg: '' };
            const textoLimpo = linhaStr.trim();
            const digitos = textoLimpo.replace(/\D/g, '');

            if (digitos.length !== 47) {
                return { valido: true, msg: '' };
            }

            const ehGruCobranca = digitos.startsWith('0019');
            const rotuloDoc = ehGruCobranca ? 'GRU Cobrança (BB)' : 'Cobrança Bancária';

            const calcularDvMod10 = (blocoStr) => {
                let soma = 0;
                let alternar = true;
                for (let i = blocoStr.length - 1; i >= 0; i--) {
                    let d = blocoStr.charCodeAt(i) - 48;
                    if (alternar) {
                        d *= 2;
                        if (d > 9) d -= 9;
                    }
                    soma += d;
                    alternar = !alternar;
                }
                const resto = soma % 10;
                return (resto === 0) ? 0 : (10 - resto);
            };

            const erros = [];
            // Campo 1: 9 dígitos + DV
            const c1Corpo = digitos.substring(0, 9);
            const c1Dv = digitos.charCodeAt(9) - 48;
            if (calcularDvMod10(c1Corpo) !== c1Dv) erros.push('Dígito do Campo 1 incorreto');

            // Campo 2: 10 dígitos + DV
            const c2Corpo = digitos.substring(10, 20);
            const c2Dv = digitos.charCodeAt(20) - 48;
            if (calcularDvMod10(c2Corpo) !== c2Dv) erros.push('Dígito do Campo 2 incorreto');

            // Campo 3: 10 dígitos + DV
            const c3Corpo = digitos.substring(21, 31);
            const c3Dv = digitos.charCodeAt(31) - 48;
            if (calcularDvMod10(c3Corpo) !== c3Dv) erros.push('Dígito do Campo 3 incorreto');

            // Campo 4: Dígito Verificador Geral do Código de Barras (Módulo 11 FEBRABAN)
            const c4Dv = digitos.charCodeAt(32) - 48;
            const codigo43 = digitos.substring(0, 4) + digitos.substring(33, 47) + digitos.substring(4, 9) + digitos.substring(10, 20) + digitos.substring(21, 31);
            let somaMod11 = 0;
            let peso = 2;
            for (let i = codigo43.length - 1; i >= 0; i--) {
                somaMod11 += (codigo43.charCodeAt(i) - 48) * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            const restoMod11 = somaMod11 % 11;
            let dvGeralCalculado = 11 - restoMod11;
            if (restoMod11 === 0 || restoMod11 === 1 || restoMod11 === 10) {
                dvGeralCalculado = 1;
            }
            if (dvGeralCalculado !== c4Dv) erros.push('Dígito Verificador Geral (Campo 4) incorreto');

            if (erros.length > 0) {
                return this.formatarRespostaErro(
                    ehGruCobranca ? 'GRU Cobrança Inválida' : 'Boleto Bancário Inválido',
                    'Boleto Bancario Invalido',
                    textoLimpo,
                    erros
                );
            }

            return this.formatarRespostaWiki(
                'Boleto Bancário',
                rotuloDoc,
                textoLimpo,
                `Linha de 47 dígitos validada (FEBRABAN)\n${ehGruCobranca ? 'Guia de Recolhimento da União (Banco do Brasil)' : 'Cobrança Bancária Registrada'}`,
                {
                    tipo: 'BOLETO_BANCARIO_FEBRABAN',
                    ehGruCobranca: ehGruCobranca
                }
            );
        }

        /*
         * MÉTODO: validarModulo10
         * Valida dígito verificador módulo 10 (Algoritmo de Luhn) para números arbitrários com DV final.
         */
        validarModulo10(numeroComDv) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 2) return false;
            let soma = 0;
            let alternar = false;
            for (let i = digitos.length - 1; i >= 0; i--) {
                let d = digitos.charCodeAt(i) - 48;
                if (alternar) {
                    d *= 2;
                    if (d > 9) d -= 9;
                }
                soma += d;
                alternar = !alternar;
            }
            return (soma % 10 === 0);
        }

        /*
         * MÉTODO: validarModulo11
         * Valida dígito verificador módulo 11 com pesos cíclicos da direita para a esquerda.
         */
        validarModulo11(numeroComDv, pesos = [2, 3, 4, 5, 6, 7, 8, 9], restoSubtrai = true) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 2) return false;
            const n = digitos.length;
            let soma = 0;
            let pesoIdx = 0;
            for (let i = n - 2; i >= 0; i--) {
                const peso = pesos[pesoIdx % pesos.length];
                soma += (digitos.charCodeAt(i) - 48) * peso;
                pesoIdx++;
            }
            const resto = soma % 11;
            let dvEsperado;
            if (restoSubtrai) {
                dvEsperado = (resto < 2) ? 0 : (11 - resto);
            } else {
                dvEsperado = resto;
            }
            const dvInformado = digitos.charCodeAt(n - 1) - 48;
            return (dvEsperado === dvInformado);
        }

        /*
         * MÉTODO: validarModulo97
         * Valida os 2 dígitos verificadores módulo 97 (padrão ISO 7064 / CNJ) via BigInt.
         */
        validarModulo97(numeroComDv) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 3) return false;
            try {
                const baseStr = digitos.substring(0, digitos.length - 2);
                const dvInformado = BigInt(digitos.substring(digitos.length - 2));
                const resto = (BigInt(baseStr) * 100n) % 97n;
                const dvCalculado = 98n - resto;
                return (dvCalculado === dvInformado);
            } catch (_) {
                return false;
            }
        }

        /*
         * MÉTODO: validarNumeroGenericoFallback
         * DIRETRIZ ROOT 6.42 e FEAT-03 (Última Barreira de Verificação Matemática):
         * Quando o texto é estritamente numérico (ou CNPJ alfanumérico de 14 chars) e não casou
         * com nenhuma máscara contextual específica (CPF, CNPJ, CNJ, Data, etc.), testa
         * cálculos de DV conhecidos sob rigorosos critérios anti-falso-positivo (BUG-05).
         */
        validarNumeroGenericoFallback(texto) {
            if (!texto || typeof texto !== 'string') return { valido: true, msg: '' };
            const textoLimpo = texto.trim();
            if (!textoLimpo) return { valido: true, msg: '' };

            /* Passo 1: Filtragem Rigorosa Anti-Falso-Positivo para Letras (BUG-05) */
            const contemLetras = /[a-zA-Z\u00C0-\u017F]/.test(textoLimpo);
            const limpoAlfanum = textoLimpo.toUpperCase().replace(/[^0-9A-Z]/g, '');

            if (contemLetras) {
                if (limpoAlfanum.length !== 14 || !/^\d{2}$/.test(limpoAlfanum.substring(12, 14))) {
                    return { valido: true, msg: '' };
                }

                const calcularDvCnpjAlfanum = (comprimento) => {
                    let p = 2;
                    let s = 0;
                    for (let i = comprimento - 1; i >= 0; i--) {
                        s += (limpoAlfanum.charCodeAt(i) - 48) * p;
                        p = (p === 9) ? 2 : p + 1;
                    }
                    const r = s % 11;
                    return (r < 2) ? 0 : (11 - r);
                };
                const dv1Cnpj = calcularDvCnpjAlfanum(12);
                const dv2Cnpj = calcularDvCnpjAlfanum(13);
                if (dv1Cnpj === (limpoAlfanum.charCodeAt(12) - 48) && dv2Cnpj === (limpoAlfanum.charCodeAt(13) - 48)) {
                    return this.formatarRespostaGenericaCinza([{
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    }], textoLimpo);
                }
                return { valido: true, msg: '' };
            }

            /* Passo 2: O texto sem letras deve conter estritamente dígitos e pontuações aceitas */
            if (!/^[0-9\s.\/-]+$/.test(textoLimpo)) {
                return { valido: true, msg: '' };
            }

            const digitosPuros = textoLimpo.replace(/\D/g, '');
            if (digitosPuros.length < 4 || digitosPuros.length > 30) {
                return { valido: true, msg: '' };
            }

            if (/^(\d)\1+$/.test(digitosPuros)) {
                return { valido: true, msg: '' };
            }

            const n = digitosPuros.length;
            const temHifenDvFinal = /-\d$/.test(textoLimpo);
            const temDoisDvsFinais = /-\d{2}$/.test(textoLimpo);
            const validacoesAprovadas = [];

            /* Passo 3: Módulo 11 com pesos 2 a 9 cíclicos */
            if (temHifenDvFinal || (n >= 9 && n <= 14)) {
                let soma = 0;
                let peso = 2;
                for (let i = n - 2; i >= 0; i--) {
                    soma += (digitosPuros.charCodeAt(i) - 48) * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(n - 1) - 48;
                if (dvEsperado === dvInformado) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 4: Módulo 11 NB INSS (10 dígitos exatos) */
            if (n === 10) {
                const pesosNB = [2, 3, 4, 5, 6, 7, 8, 9, 2];
                let soma = 0;
                for (let i = 0; i < 9; i++) {
                    soma += (digitosPuros.charCodeAt(8 - i) - 48) * pesosNB[i];
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(9) - 48;
                if (dvEsperado === dvInformado && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 5: Módulo 11 PIS/NIT (11 dígitos exatos) */
            if (n === 11) {
                const pesosPIS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                let soma = 0;
                for (let i = 0; i < 10; i++) {
                    soma += (digitosPuros.charCodeAt(i) - 48) * pesosPIS[i];
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(10) - 48;
                if (dvEsperado === dvInformado && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 6: Módulo 11 com 2 Dígitos Verificadores estilo CPF (11 dígitos) */
            if (n === 11) {
                let s1 = 0;
                for (let i = 0; i < 9; i++) s1 += (digitosPuros.charCodeAt(i) - 48) * (10 - i);
                let r1 = 11 - (s1 % 11);
                const expDv1 = (r1 >= 10) ? 0 : r1;
                if (expDv1 === (digitosPuros.charCodeAt(9) - 48)) {
                    let s2 = 0;
                    for (let i = 0; i < 10; i++) s2 += (digitosPuros.charCodeAt(i) - 48) * (11 - i);
                    let r2 = 11 - (s2 % 11);
                    const expDv2 = (r2 >= 10) ? 0 : r2;
                    if (expDv2 === (digitosPuros.charCodeAt(10) - 48) && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod11',
                            valorFormatado: textoLimpo
                        });
                    }
                }
            }

            /* Passo 7: Módulo 97 (padrão CNJ de 20 dígitos e padrão final de 2 DVs com BigInt) */
            if (n === 20) {
                try {
                    const seq = digitosPuros.substring(0, 7);
                    const dvInformadoCnj = BigInt(digitosPuros.substring(7, 9));
                    const restoCnj = digitosPuros.substring(9);
                    const baseCnj = `${seq}${restoCnj}`;
                    const resto97Cnj = (BigInt(baseCnj) * 100n) % 97n;
                    const dvEsperadoCnj = 98n - resto97Cnj;
                    if (dvEsperadoCnj === dvInformadoCnj) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod97',
                            valorFormatado: textoLimpo
                        });
                    }
                } catch (_) {}
            } else if (temDoisDvsFinais && n >= 15 && n <= 25) {
                try {
                    const baseNum = digitosPuros.substring(0, n - 2);
                    const dvInformado = BigInt(digitosPuros.substring(n - 2));
                    const resto97 = (BigInt(baseNum) * 100n) % 97n;
                    const dvCalculado = 98n - resto97;
                    if (dvCalculado === dvInformado) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod97',
                            valorFormatado: textoLimpo
                        });
                    }
                } catch (_) {}
            }

            /* Passo 8: Módulo 10 (Algoritmo de Luhn - boletos, cartões, contas) */
            const aceitaMod10 = temHifenDvFinal || n === 10 || n === 11 || (n >= 13 && n <= 19);
            if (aceitaMod10) {
                let somaLuhn = 0;
                let alternar = false;
                for (let i = n - 1; i >= 0; i--) {
                    let d = digitosPuros.charCodeAt(i) - 48;
                    if (alternar) {
                        d *= 2;
                        if (d > 9) d -= 9;
                    }
                    somaLuhn += d;
                    alternar = !alternar;
                }
                if (somaLuhn % 10 === 0) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod10',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Se não validou nenhum cálculo, silêncio total */
            if (validacoesAprovadas.length === 0) {
                return { valido: true, msg: '' };
            }

            return this.formatarRespostaGenericaCinza(validacoesAprovadas, textoLimpo);
        }
    }

    Object.freeze(LibVerificadoresBoletos.prototype);
    return Object.freeze(LibVerificadoresBoletos);
}));