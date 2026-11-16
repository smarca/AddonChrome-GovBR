/* ==========================================================================
 * Nome do arquivo: debug-geradores.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Geradores e Diagnósticos)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-geradores.js
 * - Classe Exportada: DebugGeradores (window.JusGovDebugGeradores)
 * - Métodos Públicos: randInt, gerarCpfValido, gerarCpfInvalido, gerarCnpjTradicionalValido, gerarCnpjTradicionalInvalido, gerarCnpjAlfanumericoValido, gerarCnpjAlfanumericoInvalido, gerarCnjValido, gerarCnjInvalido, gerarDataValida, gerarDataInvalida, gerarInssNbValido, gerarPisValido, mutarDigitoAleatorio, mutarDigitoParaInvalido, mutarDataParaInvalida, calcularPosicaoCursorHumana, obterCabecalhoAmbienteDiagnostico
 * - Dependências: window.JusGovGeradores, window.JusGovVerificadores
 * - Regras / Seções: Diretriz Root 14, Diretriz Root 16, BP-06 / ARQ-01
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugGeradores = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const FabricaGeradores = (typeof self !== 'undefined' && self.JusGovGeradores) || (typeof window !== 'undefined' && window.JusGovGeradores) || null;
    const geradoresJusGov = FabricaGeradores ? new FabricaGeradores() : null;

    const FabricaVerificadores = (typeof self !== 'undefined' && self.JusGovVerificadores) || (typeof window !== 'undefined' && window.JusGovVerificadores) || null;
    const verificadoresJusGov = FabricaVerificadores ? new FabricaVerificadores() : null;

    function randInt(min, max) {
        if (geradoresJusGov) return geradoresJusGov.randInt(min, max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /* Gerador de CPF Valido (calculo real dos dois DVs via Modulo 11) */
    function gerarCpfValido() {
        if (geradoresJusGov) return geradoresJusGov.gerarCpfValido();
        const d = [];
        for (let i = 0; i < 9; i++) d.push(randInt(0, 9));
        /* Evita 9 digitos identicos */
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

    /* Gerador de CPF Invalido (DV incorreto ou repetido) */
    function gerarCpfInvalido() {
        const cpfV = gerarCpfValido();
        const ult = Number(cpfV[cpfV.length - 1]);
        const novoUlt = (ult + randInt(1, 9)) % 10;
        return cpfV.substring(0, cpfV.length - 1) + novoUlt;
    }

    /* Gerador de CNPJ Tradicional Valido (calculo real Modulo 11 Receita Federal) */
    function gerarCnpjTradicionalValido() {
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

    /* Gerador de CNPJ Tradicional Invalido */
    function gerarCnpjTradicionalInvalido() {
        const cnpjV = gerarCnpjTradicionalValido();
        const ult = Number(cnpjV[cnpjV.length - 1]);
        const novoUlt = (ult + randInt(1, 9)) % 10;
        return cnpjV.substring(0, cnpjV.length - 1) + novoUlt;
    }

    /* Gerador de Novo CNPJ Alfanumerico Valido (ASCII - 48 oficial) */
    function gerarCnpjAlfanumericoValido() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const base = [];
        for (let i = 0; i < 12; i++) {
            base.push(chars[randInt(0, chars.length - 1)]);
        }
        /* Garante ao menos uma letra na raiz para ser estritamente alfanumerico */
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

    /* Gerador de Novo CNPJ Alfanumerico Invalido */
    function gerarCnpjAlfanumericoInvalido() {
        const cnpjV = gerarCnpjAlfanumericoValido();
        const ult = Number(cnpjV[cnpjV.length - 1]);
        const novoUlt = (ult + randInt(1, 9)) % 10;
        return cnpjV.substring(0, cnpjV.length - 1) + novoUlt;
    }

    /* Gerador de Processo Judicial CNJ Valido (Modulo 97 BigInt oficial) */
    function gerarCnjValido() {
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

    /* Gerador de Processo Judicial CNJ Invalido */
    function gerarCnjInvalido() {
        const cnjV = gerarCnjValido();
        const partes = cnjV.split('-');
        const dvOrig = Number(partes[1].substring(0, 2));
        const novoDv = String((dvOrig + randInt(1, 90)) % 97 || 97).padStart(2, '0');
        return `${partes[0]}-${novoDv}${partes[1].substring(2)}`;
    }

    /* Gerador de Data Valida (calendario gregoriano e bissextos) */
    function gerarDataValida(forcarBissexto = false) {
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

    /* Gerador de Data Invalida (dia inexistente ou ano secular nao-bissexto) */
    function gerarDataInvalida() {
        const tiposInvalidos = [
            '29/02/2025', /* ano comum nao bissexto */
            '29/02/2100', /* secular nao bissexto */
            '29/02/1900', /* secular nao bissexto */
            '31/04/2026', /* abril tem 30 dias */
            '31/06/2024', /* junho tem 30 dias */
            '31/09/2025', /* setembro tem 30 dias */
            '31/11/2026', /* novembro tem 30 dias */
            '32/01/2026', /* dia 32 inexistente */
            '00/08/2026', /* dia zero */
            '15/13/2026', /* mes 13 */
            '31/31/1998'  /* dia e mes absurdos */
        ];
        return tiposInvalidos[randInt(0, tiposInvalidos.length - 1)];
    }

    /* Gerador de Beneficio Previdenciario INSS NB Valido (Modulo 11 oficial) */
    function gerarInssNbValido() {
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

    /* Gerador de Inscricao PIS/PASEP/NIT Valida (Modulo 11 oficial) */
    function gerarPisValido() {
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
        return `${d[0]}${d[1]}${d[2]}.${d[3]}${d[4]}${d[5]}${d[6]}${d[7]}.${d[8]}${d[9]}-${d[10]}`;
    }

    /*
     * FUNCAO: mutarDigitoAleatorio
     * DIRETRIZ DE MUTATION TESTING:
     * Altera exatamente 1 digito ou caractere alfanumerico no corpo do numero (excluindo posicoes de DV),
     * aplicando variacao aleatoria de ±1 a ±5 (com sinal + ou - aleatorio).
     * Regra ciclica estrita: se passar de 9 vai para 0, 1, 2... se diminuir de 0 vai para 9, 8, 7...
     */
    function mutarDigitoAleatorio(strComNumero, opcoes = {}) {
        if (!strComNumero || typeof strComNumero !== 'string') return strComNumero;
        const indicesValidos = [];
        for (let i = 0; i < strComNumero.length; i++) {
            const c = strComNumero[i];
            if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
                indicesValidos.push(i);
            }
        }
        if (indicesValidos.length === 0) return strComNumero;

        // DIRETRIZ: Nao efetuar mutacao nas posicoes dos digitos verificadores (mutar o corpo do numero)
        let indicesCandidatos = indicesValidos;
        if (typeof opcoes.qtdDvsFinais === 'number' && opcoes.qtdDvsFinais > 0) {
            const limite = indicesValidos.length - opcoes.qtdDvsFinais;
            if (limite > 0) {
                indicesCandidatos = indicesValidos.slice(0, limite);
            }
        } else if (opcoes.ehCnj) {
            // Em Processos CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO), os DVs sao os 2 digitos logo apos o hifen '-'
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

        // Variacao aleatoria de ±1 a ±5
        const delta = randInt(1, 5);
        const sinal = randInt(0, 1) === 0 ? 1 : -1;

        if (chOriginal >= '0' && chOriginal <= '9') {
            const num = Number(chOriginal);
            // Regra ciclica mod 10: se passar de 9 vai pra 0, 1, 2... se diminuir de 0 vai pra 9, 8, 7...
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
     * FUNCAO: mutarDigitoParaInvalido
     * DIRETRIZ DE MUTATION TESTING:
     * Altera 1 digito no corpo do numero (excluindo os DVs) com delta aleatorio ±1 a ±5 (ciclico mod 10)
     * e garante estritamente que o numero mutado resultante gere resultado invalido perante o validador.
     */
    function mutarDigitoParaInvalido(strComNumero, fnValidador, opcoes = {}) {
        if (!strComNumero || typeof strComNumero !== 'string') return strComNumero;
        if (typeof fnValidador !== 'function') {
            return mutarDigitoAleatorio(strComNumero, opcoes);
        }
        for (let tentativa = 0; tentativa < 25; tentativa++) {
            const mutado = mutarDigitoAleatorio(strComNumero, opcoes);
            const res = fnValidador(mutado);
            if (res && res.valido === false) {
                return mutado;
            }
        }
        // Fallback deterministico no corpo do numero
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
        return mutarDigitoAleatorio(strComNumero, opcoes);
    }

    /*
     * FUNCAO: mutarDataParaInvalida
     * Transforma uma data valida em invalida alterando componentes de fronteira
     * (dia 32, mes 13, dia 00, 29/02 em ano comum, ou 31 em mes de 30 dias)
     */
    function mutarDataParaInvalida(dataValidaStr) {
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

    /*
     * FUNCAO: calcularPosicaoCursorHumana
     * OBJETIVO DE RECONSTRUCAO: Converter o indice 0-based do cursor na convencao
     * de auditoria exigida pelo usuario:
     * - 1o caractere = 1
     * - Ultimo caractere = tamanho da string testada (L)
     * - Antes do 1o caractere = -1
     * - Apos o termino no caractere subsequente = (tamanho + 1)
     */
    function calcularPosicaoCursorHumana(texto, idxZeroBased) {
        const str = typeof texto === 'string' ? texto : '';
        const tam = str.length;
        if (idxZeroBased === null || idxZeroBased === undefined) {
            return { codigo: null, rotulo: `1..${tam} (avaliacao integral da string, tam=${tam})`, charAlvo: 'STRING_INTEIRA' };
        }
        if (idxZeroBased < 0) {
            return { codigo: -1, rotulo: `-1 (antes do 1o caractere; tam=${tam})`, charAlvo: '<ANTES_DO_INICIO>' };
        }
        if (idxZeroBased >= tam) {
            return { codigo: tam + 1, rotulo: `${tam + 1} (apos o termino [tamanho+1]; tam=${tam})`, charAlvo: '<APOS_O_FIM>' };
        }
        const pos = idxZeroBased + 1;
        const ch = str[idxZeroBased] === '\n' ? '\\n' : (str[idxZeroBased] === '\r' ? '\\r' : str[idxZeroBased]);
        return {
            codigo: pos,
            rotulo: `${pos} (de 1 a ${tam}; -1=antes, ${tam + 1}=apos)`,
            charAlvo: `'${ch}'`
        };
    }

    /*
     * FUNCAO: obterCabecalhoAmbienteDiagnostico
     * OBJETIVO DE RECONSTRUCAO: Coletar informacoes completas do navegador,
     * sistema operacional, data/hora deterministica DD/MM/AAAA HH:MM:SS,
     * resolucao, APIs e estado do motor.
     */
    function obterCabecalhoAmbienteDiagnostico() {
        const agora = new Date();
        const pad2 = (n) => String(n).padStart(2, '0');
        const dataBr = `${pad2(agora.getDate())}/${pad2(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad2(agora.getHours())}:${pad2(agora.getMinutes())}:${pad2(agora.getSeconds())}`;
        const dataIso = agora.toISOString();
        let nomeExt = 'Selecao/Copia de Textos Aprimorada';
        let versaoExt = 'Desconhecida';
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
                const mf = chrome.runtime.getManifest();
                if (mf) {
                    if (mf.name) nomeExt = mf.name;
                    if (mf.version_name || mf.version) versaoExt = mf.version_name || mf.version;
                }
            }
        } catch (_) { }

        const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'Desconhecido';
        const plataforma = (typeof navigator !== 'undefined' && (
            (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform
        )) || 'Desconhecido';
        const idioma = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'pt-BR';
        const nucleos = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) ? `${navigator.hardwareConcurrency} threads` : 'N/D';
        const viewport = (typeof window !== 'undefined') ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})` : 'N/D';

        const apiClipboardItem = typeof ClipboardItem !== 'undefined' ? 'SIM' : 'NAO';
        const apiHighlights = (typeof CSS !== 'undefined' && CSS.highlights) ? 'SIM' : 'NAO';
        const apiPopover = (typeof HTMLElement !== 'undefined' && HTMLElement.prototype && 'showPopover' in HTMLElement.prototype) ? 'SIM' : 'NAO';

        const motor = window.JusGovMotorSelecaoTeste && typeof window.JusGovMotorSelecaoTeste.obterEstadoAtual === 'function'
            ? window.JusGovMotorSelecaoTeste.obterEstadoAtual()
            : null;
        const resumoMotor = motor
            ? `Modo=${motor.modoExecucao} | ManterFormatacaoBasica=${motor.manterFormatacaoBasica ? 'SIM' : 'NAO'} | ValidacaoMat=${motor.validacaoMatematicaAtiva ? 'SIM' : 'NAO'} | PlaceholdersHtml=${motor.modoPlaceholdersMinutasHtml || (motor.placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado')} | ConvIdPJe=${motor.converterCabecalhoPjeAtivo ? 'SIM' : 'NAO'}`
            : 'Padrao';

        return [
            '======================================================================',
            'RELATORIO DE AUDITORIA E DIAGNOSTICO AUTOMATIZADO - JUSGOVBR',
            '======================================================================',
            `Data/Hora do Teste : ${dataBr} (ISO: ${dataIso})`,
            `Extensao / Versao  : ${nomeExt} v${versaoExt}`,
            `Sistema Operacional: ${plataforma} | CPU: ${nucleos}`,
            `Navegador (Engine) : ${ua}`,
            `Idioma / Viewport  : ${idioma} | ${viewport}`,
            `APIs Disponiveis   : ClipboardItem=${apiClipboardItem} | CSS.highlights=${apiHighlights} | Popover=${apiPopover}`,
            `Estado do Motor    : ${resumoMotor}`,
            `Escala de Cursor   : 1 = 1o caractere | N = ultimo caractere | -1 = antes do 1o | (N+1) = apos o ultimo`,
            '======================================================================'
        ];
    }

    class DebugGeradores {
        randInt(min, max) { return randInt(min, max); }
        gerarCpfValido() { return gerarCpfValido(); }
        gerarCpfInvalido() { return gerarCpfInvalido(); }
        gerarCnpjTradicionalValido() { return gerarCnpjTradicionalValido(); }
        gerarCnpjTradicionalInvalido() { return gerarCnpjTradicionalInvalido(); }
        gerarCnpjAlfanumericoValido() { return gerarCnpjAlfanumericoValido(); }
        gerarCnpjAlfanumericoInvalido() { return gerarCnpjAlfanumericoInvalido(); }
        gerarCnjValido() { return gerarCnjValido(); }
        gerarCnjInvalido() { return gerarCnjInvalido(); }
        gerarDataValida(forcarBissexto = false) { return gerarDataValida(forcarBissexto); }
        gerarDataInvalida() { return gerarDataInvalida(); }
        gerarInssNbValido() { return gerarInssNbValido(); }
        gerarPisValido() { return gerarPisValido(); }
        mutarDigitoAleatorio(strComNumero, opcoes = {}) { return mutarDigitoAleatorio(strComNumero, opcoes); }
        mutarDigitoParaInvalido(strComNumero, fnValidador, opcoes = {}) { return mutarDigitoParaInvalido(strComNumero, fnValidador, opcoes); }
        mutarDataParaInvalida(dataValidaStr) { return mutarDataParaInvalida(dataValidaStr); }
        calcularPosicaoCursorHumana(texto, idxZeroBased) { return calcularPosicaoCursorHumana(texto, idxZeroBased); }
        obterCabecalhoAmbienteDiagnostico() { return obterCabecalhoAmbienteDiagnostico(); }
    }

    Object.freeze(DebugGeradores.prototype);
    return Object.freeze(DebugGeradores);
}));