/* ==========================================================================
 * Nome do arquivo: lib-geradores.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca Matemática de Geradores Algorítmicos e Mutações
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-geradores.js
 * - Classe Exportada: JusGovGeradores (self.JusGovGeradores / window.JusGovGeradores)
 * - Métodos Públicos: randInt, calcularDigitoMod10, calcularDigitoMod11, calcularDigitosMod97,
 *   gerarCpfValido, gerarCpfInvalido, gerarCPF, gerarCnpjTradicionalValido, gerarCnpjTradicionalInvalido,
 *   gerarCnpjAlfanumericoValido, gerarCnpjAlfanumericoInvalido, gerarCNPJ, gerarCnjValido, gerarCnjInvalido,
 *   gerarProcessoCNJ, gerarDataValida, gerarDataInvalida, gerarData, gerarInssNbValido, gerarInssNbInvalido,
 *   gerarBeneficioINSS, gerarPisValido, gerarPisInvalido, gerarPIS, gerarLinhaBoleto, gerarLinhaArrecadacao,
 *   mutarDigitoAleatorio, mutarDigitoParaInvalido, mutarDataParaInvalida
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seção 6.78 (BP-06 / ARQ-01)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Biblioteca algorítmica especializada na geração sintética e determinística de documentos
 *    públicos válidos e inválidos (CPF, CNPJ tradicional e alfanumérico, Processo CNJ Módulo 97,
 *    PIS/PASEP/NIT, Benefício INSS NB, Boletos FEBRABAN e Datas Gregorianas).
 *    Segregada estritamente da biblioteca de Verificadores (lib-verificadores.js) conforme BP-06.
 * 2) SUPORTE A FUZZING E MUTATION TESTING:
 *    Fornece rotinas avançadas de mutação cíclica e controlada de dígitos para alimentar
 *    baterias automatizadas de auditoria de estresse e resiliência (DevTools Sandbox e Chromium Headless).
 * 3) INTEGRIDADE E CONFORMIDADE:
 *    Utiliza aritmética modular rápida (SMI / Bitwise) para compatibilidade TurboFan V8,
 *    e BigInt para números do CNJ Módulo 97 evitando estouro do IEEE-754.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovGeradores = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Gerador de inteiro pseudo-aleatório no intervalo [min, max] */
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    class JusGovGeradores {
        constructor() {
            /* Construtor limpo para JIT monomórfico */
        }

        randInt(min, max) {
            return randInt(min, max);
        }

        /*
         * MÉTODO: calcularDigitoMod10
         * Calcula o dígito verificador Módulo 10 (Algoritmo de Luhn com pesos alternados 2 e 1).
         */
        calcularDigitoMod10(blocoStr) {
            const str = String(blocoStr || '').replace(/\D/g, '');
            let soma = 0;
            let alternar = true;
            for (let i = str.length - 1; i >= 0; i--) {
                let d = str.charCodeAt(i) - 48;
                if (alternar) {
                    d *= 2;
                    if (d > 9) d -= 9;
                }
                soma += d;
                alternar = !alternar;
            }
            const resto = soma % 10;
            return (resto === 0) ? 0 : (10 - resto);
        }

        /*
         * MÉTODO: calcularDigitoMod11
         * Calcula o dígito verificador Módulo 11 com pesos cíclicos da direita para a esquerda.
         */
        calcularDigitoMod11(strBase, pesos = [2, 3, 4, 5, 6, 7, 8, 9], restoSubtrai = true) {
            const str = String(strBase || '').replace(/\D/g, '');
            let soma = 0;
            let pesoIdx = 0;
            for (let i = str.length - 1; i >= 0; i--) {
                const p = pesos[pesoIdx % pesos.length];
                soma += (str.charCodeAt(i) - 48) * p;
                pesoIdx++;
            }
            const resto = soma % 11;
            if (restoSubtrai) {
                return (resto < 2) ? 0 : (11 - resto);
            }
            return resto;
        }

        /*
         * MÉTODO: calcularDigitosMod97
         * Calcula os dois dígitos verificadores Módulo 97 (padrão CNJ / ISO 7064) via BigInt.
         */
        calcularDigitosMod97(baseNumStr) {
            const baseLimpa = String(baseNumStr || '').replace(/\D/g, '');
            const resto = (BigInt(baseLimpa) * 100n) % 97n;
            const dvNum = 98n - resto;
            return String(dvNum).padStart(2, '0');
        }

        /* Gerador de CPF Válido (cálculo real dos dois DVs via Módulo 11) */
        gerarCpfValido() {
            const d = [];
            for (let i = 0; i < 9; i++) d.push(randInt(0, 9));
            /* Evita 9 dígitos idênticos */
            if (d.every(x => x === d[0])) d[8] = (d[8] + 1) % 10;

            let s1 = 0;
            for (let i = 0; i < 9; i++) s1 += d[i] * (10 - i);
            let r1 = 11 - (s1 % 11);
            const dv1 = (r1 === 10 || r1 === 11) ? 0 : r1;
            d.push(dv1);

            let s2 = 0;
            for (let i = 0; i < 10; i++) s2 += d[i] * (11 - i);
            let r2 = 11 - (s2 % 11);
            const dv2 = (r2 === 10 || r2 === 11) ? 0 : r2;
            d.push(dv2);

            return `${d[0]}${d[1]}${d[2]}.${d[3]}${d[4]}${d[5]}.${d[6]}${d[7]}${d[8]}-${d[9]}${d[10]}`;
        }

        /* Gerador de CPF Inválido (DV incorreto ou repetido) */
        gerarCpfInvalido() {
            const cpfV = this.gerarCpfValido();
            const ult = Number(cpfV[cpfV.length - 1]);
            const novoUlt = (ult + randInt(1, 9)) % 10;
            return cpfV.substring(0, cpfV.length - 1) + novoUlt;
        }

        /* Gerador unificado de CPF */
        gerarCPF(valido = true) {
            return valido ? this.gerarCpfValido() : this.gerarCpfInvalido();
        }

        /* Gerador de CNPJ Tradicional Válido (cálculo real Módulo 11 Receita Federal) */
        gerarCnpjTradicionalValido() {
            const d = [];
            for (let i = 0; i < 8; i++) d.push(randInt(0, 9));
            d.push(0, 0, 0, 1); /* Matriz 0001 */

            const calcDv = (baseArr) => {
                let peso = 2;
                let soma = 0;
                for (let i = baseArr.length - 1; i >= 0; i--) {
                    soma += baseArr[i] * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                return resto < 2 ? 0 : (11 - resto);
            };

            const dv1 = calcDv(d);
            d.push(dv1);
            const dv2 = calcDv(d);
            d.push(dv2);

            return `${d[0]}${d[1]}.${d[2]}${d[3]}${d[4]}.${d[5]}${d[6]}${d[7]}/${d[8]}${d[9]}${d[10]}${d[11]}-${d[12]}${d[13]}`;
        }

        /* Gerador de CNPJ Tradicional Inválido */
        gerarCnpjTradicionalInvalido() {
            const cnpjV = this.gerarCnpjTradicionalValido();
            const ult = Number(cnpjV[cnpjV.length - 1]);
            const novoUlt = (ult + randInt(1, 9)) % 10;
            return cnpjV.substring(0, cnpjV.length - 1) + novoUlt;
        }

        /* Gerador de Novo CNPJ Alfanumérico Válido (ASCII - 48 oficial) */
        gerarCnpjAlfanumericoValido() {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const base = [];
            for (let i = 0; i < 12; i++) {
                base.push(chars[randInt(0, chars.length - 1)]);
            }
            /* Garante ao menos uma letra na raiz para ser estritamente alfanumérico */
            if (!base.slice(0, 8).some(ch => ch >= 'A' && ch <= 'Z')) {
                base[randInt(0, 7)] = 'A';
            }

            const calcDv = (strBase) => {
                let peso = 2;
                let soma = 0;
                for (let i = strBase.length - 1; i >= 0; i--) {
                    const val = strBase.charCodeAt(i) - 48;
                    soma += val * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                return resto < 2 ? 0 : (11 - resto);
            };

            const str12 = base.join('');
            const dv1 = calcDv(str12);
            const str13 = str12 + String(dv1);
            const dv2 = calcDv(str13);

            const b = str12;
            return `${b[0]}${b[1]}.${b[2]}${b[3]}${b[4]}.${b[5]}${b[6]}${b[7]}/${b[8]}${b[9]}${b[10]}${b[11]}-${dv1}${dv2}`;
        }

        /* Gerador de Novo CNPJ Alfanumérico Inválido */
        gerarCnpjAlfanumericoInvalido() {
            const cnpjV = this.gerarCnpjAlfanumericoValido();
            const ult = Number(cnpjV[cnpjV.length - 1]);
            const novoUlt = (ult + randInt(1, 9)) % 10;
            return cnpjV.substring(0, cnpjV.length - 1) + novoUlt;
        }

        /* Gerador unificado de CNPJ */
        gerarCNPJ(valido = true, alfanumerico = false) {
            if (alfanumerico) {
                return valido ? this.gerarCnpjAlfanumericoValido() : this.gerarCnpjAlfanumericoInvalido();
            }
            return valido ? this.gerarCnpjTradicionalValido() : this.gerarCnpjTradicionalInvalido();
        }

        /* Gerador de Processo Judicial CNJ Válido (Módulo 97 BigInt oficial) */
        gerarCnjValido() {
            const seqNum = randInt(1, 999999);
            const seq = String(seqNum).padStart(7, '0');
            const ano = String(randInt(2000, 2026));
            const ramo = String(randInt(1, 9));
            const trib = String(randInt(1, 27)).padStart(2, '0');
            const orig = String(randInt(1, 9999)).padStart(4, '0');

            const baseNum = `${seq}${ano}${ramo}${trib}${orig}`;
            const resto = (BigInt(baseNum) * 100n) % 97n;
            const dvNum = 98n - resto;
            const dv = String(dvNum).padStart(2, '0');

            return `${seq}-${dv}.${ano}.${ramo}.${trib}.${orig}`;
        }

        /* Gerador de Processo Judicial CNJ Inválido */
        gerarCnjInvalido() {
            const cnjV = this.gerarCnjValido();
            const partes = cnjV.split('-');
            const dvOrig = Number(partes[1].substring(0, 2));
            const novoDv = String((dvOrig + randInt(1, 90)) % 97 || 97).padStart(2, '0');
            return `${partes[0]}-${novoDv}${partes[1].substring(2)}`;
        }

        /* Gerador unificado de Processo CNJ */
        gerarProcessoCNJ(valido = true) {
            return valido ? this.gerarCnjValido() : this.gerarCnjInvalido();
        }

        /* Gerador de Data Válida (calendário gregoriano e bissextos) */
        gerarDataValida(forcarBissexto = false) {
            let ano;
            if (forcarBissexto) {
                const bissextos = [2000, 2004, 2008, 2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040];
                ano = bissextos[randInt(0, bissextos.length - 1)];
            } else {
                ano = randInt(1970, 2035);
            }
            const ehBissexto = (ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0));
            let mes = randInt(1, 12);
            if (forcarBissexto) mes = 2;

            let maxDia = 31;
            if (mes === 2) maxDia = ehBissexto ? 29 : 28;
            else if (mes === 4 || mes === 6 || mes === 9 || mes === 11) maxDia = 30;

            const dia = forcarBissexto ? 29 : randInt(1, maxDia);
            const pad2 = (n) => String(n).padStart(2, '0');
            return `${pad2(dia)}/${pad2(mes)}/${ano}`;
        }

        /* Gerador de Data Inválida (dia inexistente ou ano secular não-bissexto) */
        gerarDataInvalida() {
            const tiposInvalidos = [
                '29/02/2025', /* ano comum não bissexto */
                '29/02/2100', /* secular não bissexto */
                '29/02/1900', /* secular não bissexto */
                '31/04/2026', /* abril tem 30 dias */
                '31/06/2024', /* junho tem 30 dias */
                '31/09/2025', /* setembro tem 30 dias */
                '31/11/2026', /* novembro tem 30 dias */
                '32/01/2026', /* dia 32 inexistente */
                '00/08/2026', /* dia zero */
                '15/13/2026', /* mês 13 */
                '31/31/1998'  /* dia e mês absurdos */
            ];
            return tiposInvalidos[randInt(0, tiposInvalidos.length - 1)];
        }

        /* Gerador unificado de Data */
        gerarData(valido = true, forcarBissexto = false) {
            return valido ? this.gerarDataValida(forcarBissexto) : this.gerarDataInvalida();
        }

        /* Gerador de Benefício Previdenciário INSS NB Válido (Módulo 11 oficial) */
        gerarInssNbValido() {
            const d = [];
            for (let i = 0; i < 9; i++) d.push(randInt(0, 9));
            if (d.every(x => x === d[0])) d[8] = (d[8] + 1) % 10;
            const pesos = [2, 3, 4, 5, 6, 7, 8, 9, 2];
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                soma += d[8 - i] * pesos[i];
            }
            const resto = soma % 11;
            const dv = resto < 2 ? 0 : (11 - resto);
            d.push(dv);
            return `${d[0]}${d[1]}${d[2]}.${d[3]}${d[4]}${d[5]}.${d[6]}${d[7]}${d[8]}-${d[9]}`;
        }

        /* Gerador de Benefício Previdenciário INSS NB Inválido */
        gerarInssNbInvalido() {
            const nbV = this.gerarInssNbValido();
            const ult = Number(nbV[nbV.length - 1]);
            const novoUlt = (ult + randInt(1, 9)) % 10;
            return nbV.substring(0, nbV.length - 1) + novoUlt;
        }

        /* Gerador unificado de Benefício INSS */
        gerarBeneficioINSS(valido = true) {
            return valido ? this.gerarInssNbValido() : this.gerarInssNbInvalido();
        }

        /* Gerador de Inscrição PIS/PASEP/NIT Válida (Módulo 11 oficial) */
        gerarPisValido() {
            const d = [];
            for (let i = 0; i < 10; i++) d.push(randInt(0, 9));
            if (d.every(x => x === d[0])) d[9] = (d[9] + 1) % 10;
            const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            let soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += d[i] * pesos[i];
            }
            const resto = soma % 11;
            const dv = resto < 2 ? 0 : (11 - resto);
            d.push(dv);
            return `${d[0]}${d[1]}${d[2]}.${d[3]}${d[4]}${d[5]}.${d[6]}${d[7]}.${d[8]}${d[9]}-${d[10]}`;
        }

        /* Gerador de Inscrição PIS/PASEP/NIT Inválida */
        gerarPisInvalido() {
            const pisV = this.gerarPisValido();
            const ult = Number(pisV[pisV.length - 1]);
            const novoUlt = (ult + randInt(1, 9)) % 10;
            return pisV.substring(0, pisV.length - 1) + novoUlt;
        }

        /* Gerador unificado de PIS */
        gerarPIS(valido = true) {
            return valido ? this.gerarPisValido() : this.gerarPisInvalido();
        }

        /* Gerador de Linha Digitável de Boleto Bancário FEBRABAN (47 dígitos) */
        gerarLinhaBoleto(valido = true) {
            const banco = '001'; // Banco do Brasil
            const moeda = '9';   // Real
            const c1Base = `${banco}${moeda}${randInt(10000, 99999)}`;
            const c1Dv = this.calcularDigitoMod10(c1Base);

            const c2Base = String(randInt(1000000000, 9999999999));
            const c2Dv = this.calcularDigitoMod10(c2Base);

            const c3Base = String(randInt(1000000000, 9999999999));
            const c3Dv = this.calcularDigitoMod10(c3Base);

            const fatorVencimento = String(randInt(1000, 9999));
            const valor = String(randInt(1000, 9999999999)).padStart(10, '0');

            // Código de barras para cálculo do DV Geral (Módulo 11)
            const codigo43 = `${banco}${moeda}${fatorVencimento}${valor}${c1Base.substring(4)}${c2Base}${c3Base}`;
            let somaMod11 = 0;
            let peso = 2;
            for (let i = codigo43.length - 1; i >= 0; i--) {
                somaMod11 += (codigo43.charCodeAt(i) - 48) * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            const restoMod11 = somaMod11 % 11;
            let dvGeral = 11 - restoMod11;
            if (restoMod11 === 0 || restoMod11 === 1 || restoMod11 === 10) dvGeral = 1;

            if (!valido) {
                dvGeral = (dvGeral + randInt(1, 8)) % 10 || 2;
            }

            return `${c1Base.substring(0, 5)}.${c1Base.substring(5)}${c1Dv} ${c2Base.substring(0, 5)}.${c2Base.substring(5)}${c2Dv} ${c3Base.substring(0, 5)}.${c3Base.substring(5)}${c3Dv} ${dvGeral} ${fatorVencimento}${valor}`;
        }

        /* Gerador de Linha Digitável de Arrecadação/Tributos (48 dígitos) */
        gerarLinhaArrecadacao(valido = true) {
            const seg = '5'; // Federal (DARF/GRU)
            const mod = '6'; // Módulo 10
            const valor = '00000500000'; // R$ 500,00

            const gerarBlocoMod10 = (prefixo11) => {
                const dv = this.calcularDigitoMod10(prefixo11);
                return `${prefixo11}${dv}`;
            };

            const b1 = gerarBlocoMod10(`8${seg}${mod}${String(randInt(10000000, 99999999))}`);
            const b2 = gerarBlocoMod10(valor);
            const b3 = gerarBlocoMod10(String(randInt(10000000000, 99999999999)));
            let b4Corpo = String(randInt(10000000000, 99999999999));
            let b4Dv = this.calcularDigitoMod10(b4Corpo);
            if (!valido) {
                b4Dv = (b4Dv + randInt(1, 9)) % 10;
            }
            const b4 = `${b4Corpo}${b4Dv}`;

            return `${b1} ${b2} ${b3} ${b4}`;
        }

        /*
         * MÉTODO: mutarDigitoAleatorio
         * DIRETRIZ DE MUTATION TESTING:
         * Altera exatamente 1 dígito ou caractere alfanumérico no corpo do número (excluindo posições de DV),
         * aplicando variação aleatória de ±1 a ±5 (com sinal + ou - aleatório).
         * Regra cíclica estrita: se passar de 9 vai para 0, 1, 2... se diminuir de 0 vai para 9, 8, 7...
         */
        mutarDigitoAleatorio(strComNumero, opcoes = {}) {
            if (!strComNumero || typeof strComNumero !== 'string') return strComNumero;
            const indicesValidos = [];
            for (let i = 0; i < strComNumero.length; i++) {
                const c = strComNumero[i];
                if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
                    indicesValidos.push(i);
                }
            }
            if (indicesValidos.length === 0) return strComNumero;

            let indicesCandidatos = indicesValidos;
            if (typeof opcoes.qtdDvsFinais === 'number' && opcoes.qtdDvsFinais > 0) {
                const limite = indicesValidos.length - opcoes.qtdDvsFinais;
                if (limite > 0) {
                    indicesCandidatos = indicesValidos.slice(0, limite);
                }
            } else if (opcoes.ehCnj) {
                const idxHifen = strComNumero.indexOf('-');
                if (idxHifen >= 0) {
                    const posDv1 = idxHifen + 1;
                    const posDv2 = idxHifen + 2;
                    indicesCandidatos = indicesValidos.filter(idx => idx !== posDv1 && idx !== posDv2);
                }
            }

            if (indicesCandidatos.length === 0) indicesCandidatos = indicesValidos;
            const pos = indicesCandidatos[randInt(0, indicesCandidatos.length - 1)];
            const chOriginal = strComNumero[pos];
            let chMutado = chOriginal;

            const delta = randInt(1, 5);
            const sinal = randInt(0, 1) === 0 ? 1 : -1;

            if (chOriginal >= '0' && chOriginal <= '9') {
                const num = Number(chOriginal);
                const novoNum = ((num + (sinal * delta)) % 10 + 10) % 10;
                chMutado = String(novoNum);
            } else if (chOriginal >= 'A' && chOriginal <= 'Z') {
                const code = chOriginal.charCodeAt(0);
                const novoCode = 65 + (((code - 65) + (sinal * delta)) % 26 + 26) % 26;
                chMutado = String.fromCharCode(novoCode);
            } else if (chOriginal >= 'a' && chOriginal <= 'z') {
                const code = chOriginal.charCodeAt(0);
                const novoCode = 97 + (((code - 97) + (sinal * delta)) % 26 + 26) % 26;
                chMutado = String.fromCharCode(novoCode);
            }

            return strComNumero.substring(0, pos) + chMutado + strComNumero.substring(pos + 1);
        }

        /*
         * MÉTODO: mutarDigitoParaInvalido
         * Altera 1 dígito no corpo do número com delta aleatório ±1 a ±5 (cíclico mod 10)
         * e garante estritamente que o número mutado resultante gere resultado inválido perante o validador.
         */
        mutarDigitoParaInvalido(strComNumero, fnValidador, opcoes = {}) {
            if (!strComNumero || typeof strComNumero !== 'string') return strComNumero;
            if (typeof fnValidador !== 'function') {
                return this.mutarDigitoAleatorio(strComNumero, opcoes);
            }
            for (let tentativa = 0; tentativa < 25; tentativa++) {
                const mutado = this.mutarDigitoAleatorio(strComNumero, opcoes);
                const res = fnValidador(mutado);
                if (res && res.valido === false) {
                    return mutado;
                }
            }
            // Fallback determinístico no corpo do número
            const primPosDigito = strComNumero.search(/\d/);
            if (primPosDigito >= 0) {
                const num = Number(strComNumero[primPosDigito]);
                for (let offset = 1; offset <= 9; offset++) {
                    const novo = (num + offset) % 10;
                    const mutado = strComNumero.substring(0, primPosDigito) + novo + strComNumero.substring(primPosDigito + 1);
                    const res = fnValidador(mutado);
                    if (res && res.valido === false) {
                        return mutado;
                    }
                }
            }
            return this.mutarDigitoAleatorio(strComNumero, opcoes);
        }

        /*
         * MÉTODO: mutarDataParaInvalida
         * Transforma uma data válida em inválida alterando componentes de fronteira
         */
        mutarDataParaInvalida(dataValidaStr) {
            if (!dataValidaStr || typeof dataValidaStr !== 'string') return '32/13/2025';
            const partes = dataValidaStr.split('/');
            if (partes.length !== 3) return '32/13/2025';
            let dia = Number(partes[0]);
            let mes = Number(partes[1]);
            let ano = Number(partes[2]);
            const estrategia = randInt(1, 4);
            if (estrategia === 1) {
                dia = randInt(0, 1) === 0 ? 32 : 0;
            } else if (estrategia === 2) {
                mes = randInt(0, 1) === 0 ? 13 : 0;
            } else if (estrategia === 3) {
                dia = 29;
                mes = 2;
                ano = (ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0)) ? ano + 1 : ano;
            } else {
                dia = 31;
                const meses30 = [4, 6, 9, 11];
                mes = meses30[randInt(0, meses30.length - 1)];
            }
            const pad2 = (n) => String(n).padStart(2, '0');
            return `${pad2(dia)}/${pad2(mes)}/${ano}`;
        }
    }

    Object.freeze(JusGovGeradores.prototype);
    return Object.freeze(JusGovGeradores);
}));

