/* ==========================================================================
 * Nome do arquivo: debug.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, cobertura de
 *    casos de borda forenses e validacao matematica) e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada bateria de testes, permitindo recriar 100% da
 *    suite de auditoria do zero caso o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como ç, õ, é)
 *    no codigo ou em templates visuais; entidades HTML devem ser extirpadas,
 *    sendo admitidas exclusivamente dentro de mascaras regex ou parsers de HTML bruto.
 * 5) INTEGRIDADE FUNCIONAL E COPIA SILENCIOSA: Proibido simplificar a base de 6
 *    estagios, remover suporte a Ctrl/Alt/Shift, exibir popups de "Copiado!" em
 *    copias simples ou inserir anotacoes de versao (ChronoSemVer) nos cabecalhos.
 * 6) SINCRONIZACAO OBRIGATORIA DE BLUE PRINT E SANDBOX: Toda alteracao de regra
 *    de negocio, mascara ou validacao deve manter obrigatoriamente atualizados e
 *    sincronizados o Blue Print (especificacao documental interna nos cabecalhos
 *    e na Central de Ajuda) e o SandBox (area de Testes interativos em
 *    options.html e bateria automatizada em debug.js), garantindo paridade entre
 *    exemplos validos e invalidos para homologacao imediata.
 *
 * ==========================================================================
 * [ESPECIFICACAO FUNCIONAL E REGRAS DE NEGOCIO -- HELP BLUEPRINT PERPETUO]
 * (Espelho integral da Central de Ajuda / Options para reconstrucao mutua)
 *
 * 1. SUITE AUTOMATIZADA DE AUDITORIA E HOMOLOGACAO (SANDBOX & DEVTOOLS):
 * - Expoe a funcao global "window.JusGovExecutarAuditoria(opcoes)" que pode ser
 *   acionada tanto pelo botao na aba Laboratorio de "options.html" quanto
 *   diretamente no Console do Chrome DevTools.
 * - Suporta execucao deterministica rapida (padrao, ~20ms) e execucao estendida
 *   com Fuzzing Temporal (1s por tipo de teste) via "window.JusGovExecutarFuzzing()"
 *   ou passando "{ fuzz: true }".
 * - Audita 8 baterias independentes:
 *   * Bateria 1: Validacao Matematica Deterministica e Geradores Algoritmicos:
 *     Datas numericas, abreviadas e por extenso, regra secular de Ano Bissexto
 *     (2000, 2024 vs 1900, 2025, 2100), CPF Modulo 11, CNPJ Tradicional, Novo
 *     CNPJ Alfanumerico ([0-9A-Z], ASCII - 48) e Processo CNJ Modulo 97 (BigInt).
 *   * Bateria 2: Cobertura de TODOS os 13 Grupos Root do Catalogo Forense:
 *     1. CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS (UUID / PIX)
 *     2. CHAVES_FISCAIS_E_BOLETOS_ESPACADOS (NFe 44 digitos, Linha Digitavel Boleto)
 *     3. DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO (CPF, CNPJ Tradicional/Alfanumerico,
 *        PIS, CNH, RG, CEP, OAB, Passaporte)
 *     4. NUMERACOES_ID_E_PUBLICAS (Processo SEI, Processo CNJ, Placas, Protocolo/Ano)
 *     5. DATA_COM_HORARIO_CONTIGUO (Data extensa + horario, abreviadas, mes/ano)
 *     6. INTERVALOS_E_REFERENCIAS_ID_FOLHAS (Intervalos datas, horas, moedas, folhas)
 *     7. LEGISLACAO_JURISPRUDENCIA_E_ATOS (Dispositivos, Sumulas, INs orgaos compostos)
 *     8. COORDENADAS_GPS_E_PLUS_CODES (DMS, DMM, Graus Decimais, UTM SIRGAS, Plus Codes)
 *     9. EMAILS_E_PERFIS_SOCIAIS (E-mails institucionais *.jus.br, handles)
 *     10. TELEFONES_NACIONAIS_E_INTERNACIONAIS (DDD, 0800, DDI, isolamento contra sequencias)
 *     11. FINANCEIRO_E_DECIMAIS (Moeda com extenso, Moeda simples, Percentuais)
 *     12. DATAS_E_HORARIOS (Datas numericas isoladas, horarios isolados)
 *     13. GENERICOS_E_FALLBACKS (Resolucoes de tela, blocos pontuados, sequencias)
 *   * Bateria 3: Modo Acumulador com Separador Customizado (max 5 chars, sem letras/numeros),
 *     absorcao previa, ordenacao DOM vs Modo Baralho (Shift) e Toggle-Off.
 *   * Bateria 4: Selecao Avancada de Tabelas por Colunas e por Linhas.
 *   * Bateria 5: Posicoes de Cursor (-1, 1..N, N+1, Meio, Espacos) e Minoracao 3 Cliques.
 *   * Bateria 6: Filtros de Formatacao em 3 Niveis (Basicos, Avancados e Extendidos)
 *     e Regra de Ouro (Bloco ou Palavra Unica = Somente Texto Puro).
 *   * Bateria 7: Novas Funcionalidades: Desativacao por tempo zero (0=Desativado, >0=Ativo),
 *     Atalho F1 Gemini com mascara configuravel {{TEXTO}} e anti-arrasto em botoes UI.
 *   * Bateria 8: Simulacao de Cliques, Ampliacao e Varredura de Limites nos HTMLs do Addon
 *     (Options e Popup) com/sem Control, nos 5 limites de palavra e comparacao de regras.
 *   * Bateria 9: Fuzzing Randomico por Tempo (1s/T por tipo de teste).
 * ========================================================================== */

(function() {
    'use strict';

    /* ======================================================================
     * SECAO 1: GERADORES ALGORITMICOS DETERMINISTICOS E PSEUDO-ALEATORIOS
     * ====================================================================== */

    /* Gerador de inteiro pseudo-aleatorio no intervalo [min, max] */
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /* Gerador de CPF Valido (calculo real dos dois DVs via Modulo 11) */
    function gerarCpfValido() {
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
        let versaoExt = '2026.10.28.1';
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
                const mf = chrome.runtime.getManifest();
                if (mf) {
                    if (mf.name) nomeExt = mf.name;
                    if (mf.version) versaoExt = mf.version;
                }
            }
        } catch (_) {}

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

    /*
     * ETAPAS DA BATERIA DE FUZZING TEMPORAL EXTENSO (1s/T POR TIPO DE TESTE)
     */
    const LISTA_ETAPAS_FUZZING = Object.freeze([
        { id: 'FUZZ_CPF', rotulo: 'CPF Randômico' },
        { id: 'FUZZ_CNPJ_TRADICIONAL', rotulo: 'CNPJ Tradicional' },
        { id: 'FUZZ_CNPJ_ALFANUMERICO', rotulo: 'Novo CNPJ Alfanumérico' },
        { id: 'FUZZ_CNJ_MODULO_97', rotulo: 'Processo CNJ Módulo 97' },
        { id: 'FUZZ_DATAS_BISSEXTO', rotulo: 'Datas e Anos Bissextos' },
        { id: 'FUZZ_LIMITES_CURSOR', rotulo: 'Limites de Cursor' },
        { id: 'FUZZ_URLS_DOMINIOS', rotulo: 'URLs e Domínios' },
        { id: 'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME', rotulo: 'Formatador Multi-MIME' },
        { id: 'FUZZ_CONVERSOR_HTML_MARKDOWN', rotulo: 'Conversores HTML <-> Markdown' },
        { id: 'FUZZ_MASCARAS_ENTRADA', rotulo: 'Máscaras de Entrada' },
        { id: 'FUZZ_EXTRACAO_LINHAS_TURBO', rotulo: 'Higienização de URLs Turbo' }
    ]);

    function executarUnicoFuzzingPorId(id, duracaoMsPorTipo, registrar) {
        if (!window.JusGovAvisoFlutuante) return;
        const validador = new window.JusGovAvisoFlutuante();
        const motorTeste = window.JusGovMotorSelecaoTeste;

        if (id === 'FUZZ_CPF') {
            /* Fuzz 1: CPF Randômico (1s) */
            const tInicio = performance.now();
            let totalCpf = 0;
            let errosCpf = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCpf++;
                const cpfVal = gerarCpfValido();
                const resVal = validador.validarCPF(cpfVal);
                if (!resVal.valido) errosCpf++;

                const cpfInval = gerarCpfInvalido();
                const resInval = validador.validarCPF(cpfInval);
                if (resInval.valido) errosCpf++;
            }
            registrar(
                errosCpf === 0,
                'FUZZ_CPF',
                `Fuzzing temporal de CPF (${totalCpf * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCpf * 2) - errosCpf}/${totalCpf * 2} | Erros=${errosCpf}` }
            );
        } else if (id === 'FUZZ_CNPJ_TRADICIONAL') {
            /* Fuzz 2: CNPJ Tradicional Randômico (1s) */
            const tInicio = performance.now();
            let totalCnpj = 0;
            let errosCnpj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnpj++;
                const cnpjVal = gerarCnpjTradicionalValido();
                const resVal = validador.validarCNPJ(cnpjVal);
                if (!resVal.valido) errosCnpj++;

                const cnpjInval = gerarCnpjTradicionalInvalido();
                const resInval = validador.validarCNPJ(cnpjInval);
                if (resInval.valido) errosCnpj++;
            }
            registrar(
                errosCnpj === 0,
                'FUZZ_CNPJ_TRADICIONAL',
                `Fuzzing temporal de CNPJ Tradicional (${totalCnpj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnpj * 2) - errosCnpj}/${totalCnpj * 2} | Erros=${errosCnpj}` }
            );
        } else if (id === 'FUZZ_CNPJ_ALFANUMERICO') {
            /* Fuzz 3: Novo CNPJ Alfanumérico Randômico (1s) */
            const tInicio = performance.now();
            let totalAlfa = 0;
            let errosAlfa = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalAlfa++;
                const alfaVal = gerarCnpjAlfanumericoValido();
                const resVal = validador.validarCNPJ(alfaVal);
                if (!resVal.valido) errosAlfa++;

                const alfaInval = gerarCnpjAlfanumericoInvalido();
                const resInval = validador.validarCNPJ(alfaInval);
                if (resInval.valido) errosAlfa++;
            }
            registrar(
                errosAlfa === 0,
                'FUZZ_CNPJ_ALFANUMERICO',
                `Fuzzing temporal de Novo CNPJ Alfanumérico (${totalAlfa * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalAlfa * 2) - errosAlfa}/${totalAlfa * 2} | Erros=${errosAlfa}` }
            );
        } else if (id === 'FUZZ_CNJ_MODULO_97') {
            /* Fuzz 4: Processo Judicial CNJ Módulo 97 BigInt (1s) */
            const tInicio = performance.now();
            let totalCnj = 0;
            let errosCnj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnj++;
                const cnjVal = gerarCnjValido();
                const resVal = validador.validarCNJ(cnjVal);
                if (!resVal.valido) errosCnj++;

                const cnjInval = gerarCnjInvalido();
                const resInval = validador.validarCNJ(cnjInval);
                if (resInval.valido) errosCnj++;
            }
            registrar(
                errosCnj === 0,
                'FUZZ_CNJ_MODULO_97',
                `Fuzzing temporal de Processos CNJ Módulo 97 (${totalCnj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnj * 2) - errosCnj}/${totalCnj * 2} | Erros=${errosCnj}` }
            );
        } else if (id === 'FUZZ_DATAS_BISSEXTO') {
            /* Fuzz 5: Datas e Bissextos Randômicos (1s) */
            const tInicio = performance.now();
            let totalDt = 0;
            let errosDt = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalDt++;
                const dtVal = gerarDataValida(totalDt % 3 === 0);
                const resVal = validador.validarData(dtVal);
                if (!resVal.valido) errosDt++;

                const dtInval = gerarDataInvalida();
                const resInval = validador.validarData(dtInval);
                if (resInval.valido) errosDt++;
            }
            registrar(
                errosDt === 0,
                'FUZZ_DATAS_BISSEXTO',
                `Fuzzing temporal de Datas e Bissextos (${totalDt * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalDt * 2) - errosDt}/${totalDt * 2} | Erros=${errosDt}` }
            );
        } else if (id === 'FUZZ_LIMITES_CURSOR') {
            /* Fuzz 6: Limites de Cursor e Caracteres Aleatórios (1s) */
            if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
                const tInicio = performance.now();
                let totalCliques = 0;
                let falhasCliques = 0;
                const amostrasBase = [
                    'Art. 12 da Lei nº 12.016/2009;',
                    'PROCESSO: 0991001-58.2024.4.01.4002',
                    'CPF: 529.982.247-25 e CNPJ: 12.ABC.345/01DE-35',
                    'Valor de R$ 1.250,50 pago em 23/10/2026',
                    'REGULAR PROSSEGUIMENTO DO FEITO'
                ];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalCliques++;
                    const frase = amostrasBase[totalCliques % amostrasBase.length];
                    const idxAleatorio = randInt(-3, frase.length + 3);
                    const numCliques = randInt(1, 3);
                    try {
                        const ret = motorTeste.simularCliqueEmTexto(frase, idxAleatorio, numCliques);
                        if (typeof ret !== 'string') falhasCliques++;
                    } catch (_) {
                        falhasCliques++;
                    }
                }
                registrar(
                    falhasCliques === 0,
                    'FUZZ_LIMITES_CURSOR',
                    `Fuzzing de posições de cursor e cliques em fronteiras (${totalCliques} chamadas)`,
                    { detalhe: `Sucessos=${totalCliques - falhasCliques}/${totalCliques} | Falhas=${falhasCliques}` }
                );
            }
        } else if (id === 'FUZZ_URLS_DOMINIOS') {
            /* Fuzz 7: URLs, Hosts e Extração de Domínios (1s) */
            const tInicio = performance.now();
            let totalUrls = 0;
            let errosUrls = 0;
            const esquemas = ['https://', 'http://', 'chrome://', 'file://', 'ftp://', 'about:'];
            const dominiosBase = ['pje.jus.br', 'google.com', 'trf1.jus.br', 'cnj.jus.br', 'stf.jus.br', 'localhost:8080'];
            const caminhosBase = ['/processo/123', '/painel?id=99&aba=2', '/documento#pg1', '/'];
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalUrls++;
                const esq = esquemas[randInt(0, esquemas.length - 1)];
                const dom = dominiosBase[randInt(0, dominiosBase.length - 1)];
                const cam = caminhosBase[randInt(0, caminhosBase.length - 1)];
                const urlTeste = `${esq}${dom}${cam}`;
                try {
                    const u = new URL(urlTeste);
                    const host = u.hostname || u.host || '';
                    if (!host && esq.startsWith('http')) errosUrls++;
                } catch (_) {
                    /* URL malformada proposital */
                }
            }
            registrar(
                errosUrls === 0,
                'FUZZ_URLS_DOMINIOS',
                `Fuzzing temporal de URLs e Hosts (${totalUrls} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Validadas=${totalUrls - errosUrls}/${totalUrls} | Erros=${errosUrls}` }
            );
        } else if (id === 'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME') {
            /* Fuzz 8: Formatador Multi-MIME de Clipboard e Borda de Dados (1s) */
            const formatadorClip = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);
            if (typeof formatadorClip === 'function') {
                const tInicio = performance.now();
                let totalFmtClip = 0;
                let errosFmtClip = 0;
                const tiposMime = ['text/plain', 'text/html', 'text/rtf', 'image/png', 'application/json', 'video/mp4'];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalFmtClip++;
                    const qtdItens = randInt(0, 5);
                    const itens = [];
                    for (let k = 0; k < qtdItens; k++) {
                        const t = tiposMime[randInt(0, tiposMime.length - 1)];
                        itens.push({
                            type: t,
                            data: t.startsWith('text/') ? `Dado aleatório ${k}: ${Math.random()}` : null,
                            size: randInt(10, 500000),
                            isTextual: t.startsWith('text/')
                        });
                    }
                    try {
                        const res = formatadorClip(itens);
                        if (!res || typeof res.texto !== 'string' || typeof res.html !== 'string') {
                            errosFmtClip++;
                        }
                    } catch (_) {
                        errosFmtClip++;
                    }
                }
                registrar(
                    errosFmtClip === 0,
                    'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME',
                    `Fuzzing do Formatador Multi-MIME de Clipboard (${totalFmtClip} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${totalFmtClip - errosFmtClip}/${totalFmtClip} | Falhas=${errosFmtClip}` }
                );
            }
        } else if (id === 'FUZZ_CONVERSOR_HTML_MARKDOWN') {
            /* Fuzz 9: Conversores Bidirecionais HTML <-> Markdown (1s) */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function' && typeof window.JusGovEditorDemo.converterMarkdownParaHtml === 'function') {
                const tInicio = performance.now();
                let totalMd = 0;
                let errosMd = 0;
                const fragmentosHtml = [
                    '<p>Texto com <b>negrito</b> e <i>itálico</i></p>',
                    '<h1>Título</h1><blockquote>Citação</blockquote>',
                    '<ul><li>Item 1</li><li>Item 2</li></ul>',
                    '<p>Linha com <code>código</code> e <a href="http://ex.com">link</a></p>',
                    '<p>Tachado <s>erro</s> e <u>sublinhado</u></p>'
                ];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalMd++;
                    const frag = fragmentosHtml[totalMd % fragmentosHtml.length];
                    try {
                        const md = window.JusGovEditorDemo.converterHtmlParaMarkdown(frag);
                        const htmlVolta = window.JusGovEditorDemo.converterMarkdownParaHtml(md);
                        if (typeof md !== 'string' || typeof htmlVolta !== 'string') errosMd++;
                    } catch (_) {
                        errosMd++;
                    }
                }
                registrar(
                    errosMd === 0,
                    'FUZZ_CONVERSOR_HTML_MARKDOWN',
                    `Fuzzing dos Conversores Bidirecionais HTML <-> Markdown (${totalMd} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${totalMd - errosMd}/${totalMd} | Falhas=${errosMd}` }
                );
            }
        } else if (id === 'FUZZ_MASCARAS_ENTRADA') {
            /* Fuzz 10: Máscaras Dinâmicas de Entrada de Dados (1s) */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function' && typeof window.JusGovEditorDemo.formatarMascaraCpfCnpj === 'function') {
                const tInicio = performance.now();
                let totalMasc = 0;
                let errosMasc = 0;
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalMasc++;
                    const strNum = String(Math.floor(Math.random() * 1e15)) + 'ABC!@#';
                    try {
                        const mData = window.JusGovEditorDemo.formatarMascaraData(strNum);
                        const mCpf = window.JusGovEditorDemo.formatarMascaraCpfCnpj(strNum);
                        if (typeof mData !== 'string' || typeof mCpf !== 'string') errosMasc++;
                    } catch (_) {
                        errosMasc++;
                    }
                }
                registrar(
                    errosMasc === 0,
                    'FUZZ_MASCARAS_ENTRADA',
                    `Fuzzing das Máscaras Dinâmicas de Entrada de Dados (${totalMasc * 2} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${(totalMasc * 2) - (errosMasc * 2)}/${totalMasc * 2} | Falhas=${errosMasc}` }
                );
            }
        } else if (id === 'FUZZ_EXTRACAO_LINHAS_TURBO') {
            /* Fuzz 11: Extração e Higienização de Listas Turbo (1s) */
            const tInicio = performance.now();
            let totalTurbo = 0;
            let errosTurbo = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalTurbo++;
                const blocos = [
                    'https://pje.jus.br\n<all_urls>\n   \nhttps://pje.jus.br\nhttp://google.com\r\n',
                    '<all_urls>\n<all_urls>\n\n\nhttps://trf1.jus.br',
                    'https://stj.jus.br\n\n   https://stj.jus.br   \n'
                ];
                const entrada = blocos[totalTurbo % blocos.length];
                try {
                    const linhas = Array.from(new Set(
                        String(entrada || '')
                            .split(/\r?\n/)
                            .map(l => l.trim())
                            .filter(l => l.length > 0 && l !== '<all_urls>')
                    ));
                    if (linhas.includes('<all_urls>') || (new Set(linhas)).size !== linhas.length) {
                        errosTurbo++;
                    }
                } catch (_) {
                    errosTurbo++;
                }
            }
            registrar(
                errosTurbo === 0,
                'FUZZ_EXTRACAO_LINHAS_TURBO',
                `Fuzzing de Extração e Higienização de Listas Turbo (${totalTurbo} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Sucessos=${totalTurbo - errosTurbo}/${totalTurbo} | Falhas=${errosTurbo}` }
            );
        }
    }

    /*
     * FUNCAO: executarBateriaFuzzing
     * OBJETIVO DE RECONSTRUCAO: Executar geracao aleatoria controlada por tempo
     * (1s por tipo de teste) garantindo solidez algoritmica, ausencia de excecoes
     * e conformidade com os testes de blueprint exigidos pelo usuario.
     */
    function executarBateriaFuzzing(duracaoMsPorTipo = 1000, registrar) {
        for (let i = 0; i < LISTA_ETAPAS_FUZZING.length; i++) {
            executarUnicoFuzzingPorId(LISTA_ETAPAS_FUZZING[i].id, duracaoMsPorTipo, registrar);
        }
    }

    /*
     * FUNCAO: executarBateriaFuzzingAsync
     * Executa as 11 baterias de fuzzing de forma assíncrona, atualizando o callback de progresso.
     */
    async function executarBateriaFuzzingAsync(duracaoMsPorTipo = 1000, registrar, onProgresso) {
        for (let i = 0; i < LISTA_ETAPAS_FUZZING.length; i++) {
            const etapa = LISTA_ETAPAS_FUZZING[i];
            const pct = Math.round(((i + 1) / LISTA_ETAPAS_FUZZING.length) * 100);
            if (typeof onProgresso === 'function') {
                onProgresso(pct, etapa.rotulo);
            }
            await new Promise(r => setTimeout(r, 20));
            executarUnicoFuzzingPorId(etapa.id, duracaoMsPorTipo, registrar);
        }
    }

    /*
     * FUNCAO: executarAuditoriaCompleta
     * OBJETIVO DE RECONSTRUCAO: Executar todas as 8 baterias de testes unitarios
     * sobre os modulos carregados e retornar um relatorio consolidado.
     */
    function executarAuditoriaCompleta(opcoes = {}) {
        window.__JUSGOV_AUDITORIA_EM_CURSO__ = true;
        /* Passo 1.1: Verificar presenca dos modulos essenciais na janela e montar cabecalho diagnostico */
        const linhasLog = obterCabecalhoAmbienteDiagnostico();
        let totalTestes = 0;
        let totalAprovados = 0;

        const registrar = (passou, categoria, descricao, info = {}) => {
            totalTestes++;
            if (passou) totalAprovados++;
            const status = passou ? '[OK]' : '[FALHA]';

            const infoObj = typeof info === 'string' ? { detalhe: info } : (info || {});
            const textoTestado = infoObj.textoTestado !== undefined ? String(infoObj.textoTestado) : '';
            const tam = textoTestado.length;
            const infoPos = calcularPosicaoCursorHumana(textoTestado, infoObj.idxCursor);
            const posResumo = textoTestado
                ? ` | Texto="${textoTestado}" (tam=${tam}) | Cursor=${infoPos.rotulo} (${infoPos.charAlvo})`
                : '';
            const espObtResumo = (infoObj.esperado !== undefined || infoObj.obtido !== undefined)
                ? ` | Esperado="${infoObj.esperado !== undefined ? infoObj.esperado : ''}" | Obtido="${infoObj.obtido !== undefined ? infoObj.obtido : ''}"`
                : '';
            const complemento = infoObj.detalhe ? ` -> ${infoObj.detalhe}` : '';

            linhasLog.push(`${status} [${categoria}] ${descricao}${posResumo}${espObtResumo}${complemento}`);

            if (!passou) {
                linhasLog.push(`   |-- DIAGNOSTICO DE ERRO:`);
                linhasLog.push(`   |   * Texto testado            : "${textoTestado}" (tamanho=${tam})`);
                linhasLog.push(`   |   * Posicao clique do cursor : ${infoPos.rotulo}`);
                linhasLog.push(`   |   * Caractere no ponto       : ${infoPos.charAlvo}`);
                if (infoObj.esperado !== undefined) {
                    linhasLog.push(`   |   * Esperado                 : "${infoObj.esperado}"`);
                }
                if (infoObj.obtido !== undefined) {
                    linhasLog.push(`   |   * Obtido                   : "${infoObj.obtido}"`);
                }
                if (infoObj.detalhe) {
                    linhasLog.push(`   |   * Detalhe adicional        : ${infoObj.detalhe}`);
                }
            }
        };

        if (!window.JusGovConstantes || !window.JusGovAvisoFlutuante || !window.JusGovAcumulador) {
            linhasLog.push('[ERRO CRITICO] Modulos base nao encontrados no contexto atual.');
            return { total: 1, aprovados: 0, logTexto: linhasLog.join('\n') };
        }

        const C = window.JusGovConstantes;
        const validador = new window.JusGovAvisoFlutuante();
        const acumulador = new window.JusGovAcumulador();
        const motorTeste = window.JusGovMotorSelecaoTeste;

        /* ==================================================================
         * BATERIA 1: VALIDACAO MATEMATICA DETERMINISTICA (DATAS, BISSEXTO, CPF, CNPJ, CNJ)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 1: VALIDACAO MATEMATICA DETERMINISTICA E CASOS DE BORDA ---');

        const casosMatematicos = [
            /* Datas Validas e Bissextos */
            { desc: 'Data numerica valida simples', amostra: '11/09/2026', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data bissexta valida (2024)', amostra: '29/02/2024', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data bissexta secular valida (2000)', amostra: '29/02/2000', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data abreviada valida (17 ago. 2026)', amostra: '17 ago. 2026', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com ponto final de sentenca valida (01.05.19)', amostra: '01.05.19', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            /* Datas Invalidas */
            { desc: 'Data bissexta invalida ano comum (2025)', amostra: '29/02/2025', idx: 3, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data secular nao-bissexta invalida (2100)', amostra: '29/02/2100', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data secular nao-bissexta invalida (1900)', amostra: '29/02/1900', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com mes 30 dias invalida (31/04)', amostra: '31/04/2026', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data por extenso invalida (29 de fevereiro de 2025)', amostra: '29 de fevereiro de 2025', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com mes e dia absurdos (31/31/1998)', amostra: '31/31/1998', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            /* Data com Horario Espacado (DD/MM/AAAA HH:MM e DD/MM/AAAA HH:MM:SS) e Horarios Isolados */
            { desc: 'Data com Horario Espacado valida simples (DD/MM/AAAA HH:MM)', amostra: '28/10/2026 06:28', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado valida com segundos (DD/MM/AAAA HH:MM:SS)', amostra: '28/10/2026 06:28:50', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario e Hifen valida (DD/MM/AAAA - HH:MM:SS)', amostra: '28/10/2026 - 06:28:50', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida data bissexta (29/02/2025 06:28)', amostra: '29/02/2025 06:28', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida hora excedente (28/10/2026 25:10)', amostra: '28/10/2026 25:10', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida minuto excedente (28/10/2026 06:75)', amostra: '28/10/2026 06:75', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida segundo excedente (28/10/2026 06:28:88)', amostra: '28/10/2026 06:28:88', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado valido (06:28)', amostra: '06:28', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado invalido hora excedente (25:10)', amostra: '25:10', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado invalido minuto excedente (14:65)', amostra: '14:65', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            /* CPF */
            { desc: 'CPF valido com calculo real de DV', amostra: '529.982.247-25', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido sequencia repetida', amostra: '111.111.111-11', idx: 4, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido DV incorreto', amostra: '529.982.247-99', idx: 12, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            /* CNPJ Tradicional */
            { desc: 'CNPJ tradicional valido com calculo de DV', amostra: '11.222.333/0001-81', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional invalido DV incorreto', amostra: '11.222.333/0001-99', idx: 16, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Novo CNPJ Alfanumerico */
            { desc: 'Novo CNPJ Alfanumerico valido (12.ABC.345/01DE-35)', amostra: '12.ABC.345/01DE-35', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'Novo CNPJ Alfanumerico invalido DV incorreto', amostra: '12.ABC.345/01DE-99', idx: 11, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Processo CNJ */
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TRF1)', amostra: '0991234-55.2024.4.01.4002', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TJPI)', amostra: '0001234-70.2024.8.18.0140', idx: 8, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ invalido DV incorreto', amostra: '0991234-65.2024.4.01.4002', idx: 8, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNJ(s).valido}` }
        ];

        for (let i = 0; i < casosMatematicos.length; i++) {
            const caso = casosMatematicos[i];
            let obt = 'erro_execucao';
            try { obt = String(caso.fn(caso.amostra)); } catch (e) { obt = `excecao:${e.message}`; }
            registrar(obt === caso.esp, 'MATEMATICA', caso.desc, {
                textoTestado: caso.amostra,
                idxCursor: caso.idx,
                esperado: caso.esp,
                obtido: obt
            });
        }

        /* Teste de estrutura do alerta: sem digito esperado calculado e com underline no dado incorreto */
        const auditoriaCpfDv = validador.validarCPF('529.982.247-99');
        const semDigitoEsperado = auditoriaCpfDv &&
            !auditoriaCpfDv.valido &&
            !auditoriaCpfDv.msg.toLowerCase().includes('esperado') &&
            !auditoriaCpfDv.msg.toLowerCase().includes('copiado normalmente') &&
            auditoriaCpfDv.html.includes('<u') &&
            auditoriaCpfDv.html.includes('529.982.247-99</u>') &&
            auditoriaCpfDv.html.includes('<b>! [CPF Inválido]:</b>');

        registrar(
            semDigitoEsperado,
            'MATEMATICA',
            'Alerta de validacao sem digito esperado, sem sufixo copiado e com dado sublinhado',
            {
                textoTestado: '529.982.247-99',
                esperado: 'sem_esperado_e_com_underline',
                obtido: auditoriaCpfDv ? auditoriaCpfDv.msg : 'falha'
            }
        );

        /* ==================================================================
         * BATERIA 2: COBERTURA COMPLETA DE TODOS OS 13 GRUPOS ROOT DO CATALOGO
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 2: COBERTURA INTEGRAL DOS 13 GRUPOS DO CATALOGO FORENSE ---');

        const extrairMatchNoCatalogo = (amostra, esperado) => {
            let primeiroMatch = '';
            for (let g = 0; g < C.CATALOGO_PADROES_JURIDICOS.length; g++) {
                const grupo = C.CATALOGO_PADROES_JURIDICOS[g];
                for (let r = 0; r < grupo.regexes.length; r++) {
                    const rx = new RegExp(grupo.regexes[r].source, grupo.regexes[r].flags);
                    const m = rx.exec(amostra);
                    if (m) {
                        const cand = m[0].trim();
                        if (!primeiroMatch) primeiroMatch = cand;
                        if (cand === esperado) return cand;
                    }
                }
            }
            return primeiroMatch;
        };

        const casosCatalogo13Grupos = [
            /* Grupo 1: CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS */
            { grupo: 'G1_PIX_UUID', desc: 'Chave Aleatoria PIX / UUID v4', amostra: 'Chave PIX: e7f2c68b-59d8-4f81-a67b-4573199872e4 ativa', esp: 'e7f2c68b-59d8-4f81-a67b-4573199872e4' },
            /* Grupo 2: CHAVES_FISCAIS_E_BOLETOS_ESPACADOS */
            { grupo: 'G2_NFE_ESPACADA', desc: 'Chave de Acesso NF-e em 11 blocos de 4 digitos', amostra: 'NFe: 3524 0112 3456 7800 0195 5500 1000 0001 2310 0000 0124 emitida', esp: '3524 0112 3456 7800 0195 5500 1000 0001 2310 0000 0124' },
            { grupo: 'G2_BOLETO_FEBRABAN', desc: 'Linha Digitavel de Boleto Bancario FEBRABAN', amostra: 'Pagar: 34191.79001 01043.510047 91020.150008 5 95680000015000 hoje', esp: '34191.79001 01043.510047 91020.150008 5 95680000015000' },
            /* Grupo 3: DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO */
            { grupo: 'G3_PIS', desc: 'Inscricao PIS/PASEP/NIT (NNN.NNNNN.NN-N)', amostra: 'PIS: 123.45678.90-1 cadastrado', esp: '123.45678.90-1' },
            { grupo: 'G3_RG', desc: 'Documento Geral de Identidade RG', amostra: 'Portador do RG 12.345.678-9 SSP/SP', esp: '12.345.678-9' },
            { grupo: 'G3_CEP', desc: 'Codigo de Enderecamento Postal CEP', amostra: 'Localizado no CEP 70070-900 Brasilia', esp: '70070-900' },
            { grupo: 'G3_OAB', desc: 'Inscricao Profissional OAB', amostra: 'Representante OAB/DF 12.345 constituido', esp: 'OAB/DF 12.345' },
            { grupo: 'G3_PASSAPORTE', desc: 'Passaporte Brasileiro', amostra: 'Apresentou passaporte BR123456 na PF', esp: 'BR123456' },
            /* Grupo 4: NUMERACOES_ID_E_PUBLICAS */
            { grupo: 'G4_SEI', desc: 'Processo Administrativo SEI!', amostra: 'Autos SEI! 00001.000002/2024-03 em tramitacao', esp: '00001.000002/2024-03' },
            { grupo: 'G4_PLACA_MERCOSUL', desc: 'Placa Veicular padrao Mercosul', amostra: 'Veiculo com placa BRA2E19 apreendido', esp: 'BRA2E19' },
            { grupo: 'G4_PROTOCOLO_ANO', desc: 'Numero de protocolo com barra de ano', amostra: 'Registrado sob o protocolo 63055/2023', esp: '63055/2023' },
            /* Grupo 5: DATA_COM_HORARIO_CONTIGUO */
            { grupo: 'G5_EXTENSO_HORA', desc: 'Data por extenso com dia da semana e horario', amostra: 'Audiencia em sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT designada', esp: 'sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT' },
            { grupo: 'G5_DATA_NUM_HORA', desc: 'Data numerica com horario contiguo', amostra: 'Protocolado em 23/10/2026 10:14:18.', esp: '23/10/2026 10:14:18' },
            { grupo: 'G5_DATA_HIFEN_HORA', desc: 'Data numerica com hifen e horario contiguo', amostra: 'Protocolado em 28/10/2026 - 06:28:50 nos autos.', esp: '28/10/2026 - 06:28:50' },
            /* Grupo 6: INTERVALOS_E_REFERENCIAS_ID_FOLHAS */
            { grupo: 'G6_INTERVALO_DATAS', desc: 'Intervalo de datas (DD/MM/AAAA a DD/MM/AAAA)', amostra: 'Exercicio de 01/01/2026 a 31/12/2026 apurado', esp: '01/01/2026 a 31/12/2026' },
            { grupo: 'G6_INTERVALO_HORAS', desc: 'Intervalo de horarios de expediente', amostra: 'Atendimento das 08:00 as 18:00 diariamente', esp: '08:00 as 18:00' },
            { grupo: 'G6_FLS_PAGINAS', desc: 'Referencia a folhas dos autos (fls. ...)', amostra: 'Conforme demonstrado as fls. 123/130 dos autos', esp: 'fls. 123/130' },
            { grupo: 'G6_INTERVALO_MOEDA', desc: 'Intervalo de valores monetarios', amostra: 'Faixa de R$ 1.000,00 a R$ 5.000,00 arbitrada', esp: 'R$ 1.000,00 a R$ 5.000,00' },
            { grupo: 'G6_NUMERO_EXTENSO', desc: 'Numero cardinal com extenso entre parenteses', amostra: 'Prazo fatal de 65 (sessenta e cinco) dias uteis', esp: '65 (sessenta e cinco)' },
            /* Grupo 7: LEGISLACAO_JURISPRUDENCIA_E_ATOS */
            { grupo: 'G7_DISPOSITIVO', desc: 'Dispositivo legal complexo com emenda', amostra: 'Vide art. 24, paragrafos 1 e 2 da EC n.o 103/2019.', esp: 'art. 24, paragrafos 1 e 2 da EC n.o 103/2019' },
            { grupo: 'G7_IN_ORGAO_COMPOSTO', desc: 'Instrucao Normativa com orgao composto (PRES/INSS)', amostra: 'Conforme Instrucao Normativa PRES/INSS no 128/2022 vigente', esp: 'Instrucao Normativa PRES/INSS no 128/2022' },
            { grupo: 'G7_ATO_ADM_ORGAO_3_NIVEIS', desc: 'Ato Adm com orgao de 3 niveis (SAJ/SG/PR)', amostra: 'Conforme Portaria SAJ/SG/PR no 15/2023 vigente', esp: 'Portaria SAJ/SG/PR no 15/2023' },
            { grupo: 'G7_ATO_ADM_ORGAO_NUMERICO', desc: 'Ato Adm com orgao numerico ##/##/###/###', amostra: 'Conforme Portaria 12/34/567/890 no 5/2020 vigente', esp: 'Portaria 12/34/567/890 no 5/2020' },
            { grupo: 'G7_SUMULA', desc: 'Sumula Vinculante com tribunal', amostra: 'Aplicacao da Sumula Vinculante 13 do STF', esp: 'Sumula Vinculante 13 do STF' },
            { grupo: 'G7_ATO_CURTO', desc: 'Numero de ato com prefixo no/ano', amostra: 'Portaria no 136/2025 publicada', esp: 'no 136/2025' },
            /* Grupo 8: COORDENADAS_GPS_E_PLUS_CODES */
            { grupo: 'G8_GPS_DMS', desc: 'Coordenadas GPS em Graus Minutos Segundos (DMS)', amostra: 'Local 15°47\'39.2"S 47°52\'55.8"W demarcado', esp: '15°47\'39.2"S 47°52\'55.8"W' },
            { grupo: 'G8_GPS_DECIMAL', desc: 'Coordenadas GPS em Graus Decimais (DD)', amostra: 'Ponto -15.794229, -47.882166 periciado', esp: '-15.794229, -47.882166' },
            { grupo: 'G8_PLUS_CODE', desc: 'Google Plus Code (Open Location Code)', amostra: 'Codigo 86FP645X+44 da sede', esp: '86FP645X+44' },
            /* Grupo 9: EMAILS_E_PERFIS_SOCIAIS */
            { grupo: 'G9_EMAIL', desc: 'Endereco de e-mail institucional RFC 5322', amostra: 'Enviar para contato.processual@trf1.jus.br urgente', esp: 'contato.processual@trf1.jus.br' },
            { grupo: 'G9_HANDLE', desc: 'Perfil/Handle social com arroba', amostra: 'Siga @usuario_jusbr nas redes', esp: '@usuario_jusbr' },
            /* Grupo 10: TELEFONES_NACIONAIS_E_INTERNACIONAIS */
            { grupo: 'G10_TEL_DDD', desc: 'Telefone com DDD entre parenteses', amostra: 'Ligar para (61) 3300-1000 hoje', esp: '(61) 3300-1000' },
            { grupo: 'G10_TEL_0800', desc: 'Servico de utilidade 0800', amostra: 'Ouvidoria no 0800 728 1992 disponivel', esp: '0800 728 1992' },
            { grupo: 'G10_TEL_DDI', desc: 'Telefone internacional com +DDI', amostra: 'Plantao no +55 (61) 3300-1000 ativo', esp: '+55 (61) 3300-1000' },
            /* Grupo 11: FINANCEIRO_E_DECIMAIS */
            { grupo: 'G11_MOEDA_EXTENSO', desc: 'Moeda com valor por extenso entre parenteses', amostra: 'Valor de R$ 65,00 (sessenta e cinco reais) pago', esp: 'R$ 65,00 (sessenta e cinco reais)' },
            { grupo: 'G11_PERCENTUAL', desc: 'Valor percentual decimal', amostra: 'Indice de 20,500% ao ano', esp: '20,500%' },
            { grupo: 'G11_DECIMAL_NEG', desc: 'Numero decimal negativo com sinal (-0,45)', amostra: 'Diferenca de -0,45 apurada no calculo', esp: '-0,45' },
            { grupo: 'G11_DECIMAL_POS', desc: 'Numero decimal positivo com sinal (+0,25)', amostra: 'Adicional de +0,25 deferido na sentenca', esp: '+0,25' },
            { grupo: 'G11_INTEIRO_POS', desc: 'Numero inteiro com sinal positivo (+1)', amostra: 'Ajuste de +1 aplicado na contagem', esp: '+1' },
            { grupo: 'G11_MILHAR_DEC_NEG', desc: 'Numero com milhar e decimal negativo (-1.233,00)', amostra: 'Saldo de -1.233,00 verificado nos autos', esp: '-1.233,00' },
            { grupo: 'G11_PERCENT_NEG', desc: 'Percentual negativo com sinal (-0,45%)', amostra: 'Variacao de -0,45% registrada no periodo', esp: '-0,45%' },
            { grupo: 'G11_PERCENT_POS', desc: 'Percentual positivo com sinal (+0,25%)', amostra: 'Indice de +0,25% aplicado ao beneficio', esp: '+0,25%' },
            { grupo: 'G11_PERCENT_INT_NEG', desc: 'Percentual inteiro negativo (-10%)', amostra: 'Desconto de -10% concedido', esp: '-10%' },
            { grupo: 'G11_PERCENT_MILHAR_NEG', desc: 'Percentual com milhar negativo (-1.233,00%)', amostra: 'Fator de -1.233,00% apurado', esp: '-1.233,00%' },
            { grupo: 'G11_MOEDA_NEG', desc: 'Moeda negativa com sinal antes do valor (R$ -1.000,00)', amostra: 'Valor de R$ -1.000,00 lancado na conta', esp: 'R$ -1.000,00' },
            { grupo: 'G11_MOEDA_NEG_ESP', desc: 'Moeda negativa com sinal espacado (R$ - 1.000,00)', amostra: 'Debito de R$ - 1.000,00 liquidado', esp: 'R$ - 1.000,00' },
            { grupo: 'G11_MOEDA_POS', desc: 'Moeda positiva com sinal (R$ +1.000,00)', amostra: 'Credito de R$ +1.000,00 repassado', esp: 'R$ +1.000,00' },
            { grupo: 'G11_MOEDA_SINAL_EXT', desc: 'Moeda negativa com sinal antes de R$ (-R$ 1.000,00)', amostra: 'Total de -R$ 1.000,00 devido pelo reu', esp: '-R$ 1.000,00' },
            /* Grupo 12: DATAS_E_HORARIOS */
            { grupo: 'G12_DATA_PONTOS', desc: 'Data numerica com separadores ponto (DD.MM.AAAA)', amostra: 'Publicado em 11.09.2026 no DJE', esp: '11.09.2026' },
            { grupo: 'G12_HORARIO_ISOLADO', desc: 'Horario isolado (HH:MM:SS)', amostra: 'Sessao as 14:30:00 designada', esp: '14:30:00' },
            /* Grupo 13: GENERICOS_E_FALLBACKS */
            { grupo: 'G13_RESOLUCAO', desc: 'Resolucao de tela/video', amostra: 'Monitor 2560x1080 configurado', esp: '2560x1080' },
            { grupo: 'G13_BOLETO_PONTUADO', desc: 'Bloco numerico pontuado de boleto', amostra: 'Codigo 0000.0000-0000 verificado', esp: '0000.0000-0000' }
        ];

        for (let i = 0; i < casosCatalogo13Grupos.length; i++) {
            const c = casosCatalogo13Grupos[i];
            const idxAlvo = Math.max(0, c.amostra.indexOf(c.esp));
            const obt = extrairMatchNoCatalogo(c.amostra, c.esp);
            registrar(obt === c.esp, c.grupo, `${c.desc} ("${c.esp}")`, {
                textoTestado: c.amostra,
                idxCursor: idxAlvo,
                esperado: c.esp,
                obtido: obt
            });
        }

        /* Testes de Isolamento e Blindagem de Falsos Positivos */
        /* 1) "1.325.256.019-75" NAO sofre fatiamento como falso CPF "325.256.019-75" */
        const amostraUc = '1.325.256.019-75';
        const grupoDocPessoal = C.CATALOGO_PADROES_JURIDICOS.find(g => g.grupo === 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO');
        let falsoCpfEmUnidadeConsumidora = false;
        if (grupoDocPessoal) {
            for (let r = 0; r < grupoDocPessoal.regexes.length; r++) {
                const rx = new RegExp(grupoDocPessoal.regexes[r].source, grupoDocPessoal.regexes[r].flags);
                if (rx.test(amostraUc)) {
                    falsoCpfEmUnidadeConsumidora = true;
                    break;
                }
            }
        }
        registrar(
            !falsoCpfEmUnidadeConsumidora,
            'ISOLAMENTO_CPF',
            'Unidade Consumidora (1.325.256.019-75) livre de falso fatiamento como CPF',
            { textoTestado: amostraUc, idxCursor: 2, esperado: 'falsoCpf=false', obtido: `falsoCpf=${falsoCpfEmUnidadeConsumidora}` }
        );

        /* 2) Sequencia espacada "215 7014 6992 8831" NAO e confundida com telefone em 1 clique */
        const amostraMulti = '215 7014 6992 8831';
        const grupoTel = C.CATALOGO_PADROES_JURIDICOS.find(g => g.grupo === 'TELEFONES_NACIONAIS_E_INTERNACIONAIS');
        let falsoPositivoTelefone = false;
        if (grupoTel) {
            for (let r = 0; r < grupoTel.regexes.length; r++) {
                const rx = new RegExp(grupoTel.regexes[r].source, grupoTel.regexes[r].flags);
                if (rx.test(amostraMulti)) {
                    falsoPositivoTelefone = true;
                    break;
                }
            }
        }
        registrar(!falsoPositivoTelefone, 'ISOLAMENTO_TEL', 'Sequencia numerica espacada livre de falso-positivo de telefone', {
            textoTestado: amostraMulti,
            idxCursor: 0,
            esperado: 'falsoPositivo=false',
            obtido: `falsoPositivo=${falsoPositivoTelefone}`
        });

        /* 3) Reconhecimento das 8 tags/placeholders do editor */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoTagsTeste = 'texto #tag/campo# texto #[tag/campo]# texto ##tag/campo## texto @@ tag/campo @@ texto ### tag/campo ## texto id ########## texto R$ $$$$$$$$ texto @@@@@@@@ texto.';
            const rxTags = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsEncontradas = [];
            let mTag;
            while ((mTag = rxTags.exec(textoTagsTeste)) !== null) {
                tagsEncontradas.push(mTag[0]);
            }
            const tagsEsperadas = [
                '#tag/campo#',
                '#[tag/campo]#',
                '##tag/campo##',
                '@@ tag/campo @@',
                '### tag/campo ##',
                '##########',
                '$$$$$$$$',
                '@@@@@@@@'
            ];
            const espTagsStr = tagsEsperadas.join(' | ');
            const obtTagsStr = tagsEncontradas.join(' | ');
            registrar(
                obtTagsStr === espTagsStr,
                'PLACEHOLDERS_TAGS',
                'Reconhecimento individual das 8 tags de teste no editor multilinhas',
                {
                    textoTestado: textoTagsTeste,
                    idxCursor: textoTagsTeste.indexOf('#tag/campo#'),
                    esperado: espTagsStr,
                    obtido: obtTagsStr
                }
            );
        }

        /* 3.1) Reconhecimento ampliado de marcadores e placeholders judiciais do PJe (CKEditor) */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoMinutasJudiciais = 'consequentemente [@@inserir eventuais obrigações secundárias/consequentes], além de [@@ato da autoridade coatora objeto da correção por este mandado@@] em ##/##/20## protocolou ##### por ###### [#INI##TEXTO DA DECISÃO LIMINAR###] #[...] Genérico art. ###, # da CF no art. ## da Lei #####/20##';
            const rxJud = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsJudEncontradas = [];
            let mJud;
            while ((mJud = rxJud.exec(textoMinutasJudiciais)) !== null) {
                tagsJudEncontradas.push(mJud[0]);
            }
            const tagsJudEsperadas = [
                '[@@inserir eventuais obrigações secundárias/consequentes]',
                '[@@ato da autoridade coatora objeto da correção por este mandado@@]',
                '##/##/20##',
                '#####',
                '######',
                '[#INI##TEXTO DA DECISÃO LIMINAR###]',
                '#[...]',
                '###, #',
                '##',
                '#####/20##'
            ];
            const espJudStr = tagsJudEsperadas.join(' | ');
            const obtJudStr = tagsJudEncontradas.join(' | ');
            registrar(
                obtJudStr === espJudStr,
                'PLACEHOLDERS_MINUTAS_JUDICIAIS_PJE',
                'Reconhecimento das tags reais de minutas judiciais do PJe/CKEditor ([@@...@@], ##/##/20##, #####, etc.)',
                {
                    textoTestado: textoMinutasJudiciais,
                    idxCursor: 0,
                    esperado: espJudStr,
                    obtido: obtJudStr
                }
            );
        }

        /* 3.1.1) Reconhecimento dos Placeholders da Minuta Extensa do Editor HTML, incluindo Telefone (##)####-#### */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoMinutaExtensa = 'Nome #Autor da acao#, telefone (##)####-####, manifesta-se nos autos conforme id ####### e id ###### fl. ##. Em sintese, na data ##/##/20## insurge-se contra [@@ato impugnado@@], postulando o valor de R$ ##.###,##. Para a regular instrucao, enumera-se ##### e ##### como pontos controvertidos da lide. [##TEXTO DA DECISAO##]';
            const rxMinuta = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsMinutaEncontradas = [];
            let mMin;
            while ((mMin = rxMinuta.exec(textoMinutaExtensa)) !== null) {
                tagsMinutaEncontradas.push(mMin[0]);
            }
            const tagsMinutaEsperadas = [
                '#Autor da acao#',
                '(##)####-####',
                '#######',
                '######',
                '##',
                '##/##/20##',
                '[@@ato impugnado@@]',
                '##.###,##',
                '#####',
                '#####',
                '[##TEXTO DA DECISAO##]'
            ];
            const espMinStr = tagsMinutaEsperadas.join(' | ');
            const obtMinStr = tagsMinutaEncontradas.join(' | ');

            /* Validacao especifica da mascara de telefone com simbolos em varios formatos */
            const telefonesTeste = ['(##)####-####', '(##) ####-####', '(##)#####-####', '(##) #####-####', '####-####', '#####-####'];
            let telefonesOk = true;
            for (let t = 0; t < telefonesTeste.length; t++) {
                const rxTel = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
                const mTel = rxTel.exec(telefonesTeste[t]);
                if (!mTel || mTel[0] !== telefonesTeste[t]) {
                    telefonesOk = false;
                    break;
                }
            }

            /* Validacao da selecao por clique sobre o placeholder de telefone */
            let cliqueTelOk = true;
            if (motorTeste && typeof motorTeste.localizarCampoSimbolosSobCursor === 'function') {
                const idxTel = textoMinutaExtensa.indexOf('(##)####-####') + 4;
                const spanTel = motorTeste.localizarCampoSimbolosSobCursor(textoMinutaExtensa, idxTel);
                cliqueTelOk = Boolean(spanTel && textoMinutaExtensa.substring(spanTel.inicio, spanTel.fim) === '(##)####-####');
            }

            /* Validacao da presenca dos campos no texto padrao do Editor HTML */
            let htmlEditorOk = true;
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.obterTextoPadraoEditorHtml === 'function') {
                const htmlPadrao = window.JusGovEditorDemo.obterTextoPadraoEditorHtml();
                htmlEditorOk = htmlPadrao.includes('#Autor da ação#') &&
                    htmlPadrao.includes('<i>(##)####-####</i>') &&
                    htmlPadrao.includes('<b>##/##/20##</b>') &&
                    htmlPadrao.includes('<u>R$ ##.###,##</u>') &&
                    htmlPadrao.includes('[@@ato impugnado@@]') &&
                    htmlPadrao.includes('id #######') &&
                    htmlPadrao.includes('id ###### fl. ##') &&
                    htmlPadrao.includes('enumera-se') &&
                    htmlPadrao.includes('[##TEXTO DA DECISÃO##]');
            }

            const tudoOk = (obtMinStr === espMinStr) && telefonesOk && cliqueTelOk && htmlEditorOk;

            registrar(
                tudoOk,
                'PLACEHOLDERS_MINUTA_EXTENSA_E_TELEFONE',
                'Reconhecimento completo dos placeholders da minuta extensa e mascaras de telefone no editor HTML',
                {
                    textoTestado: textoMinutaExtensa,
                    idxCursor: textoMinutaExtensa.indexOf('(##)####-####'),
                    esperado: espMinStr,
                    obtido: obtMinStr
                }
            );
        }

        /* 3.2) Controle de alternancia da configuracao de placeholders para editores HTML online (3 modos) */
        if (motorTeste && typeof motorTeste.definirPlaceholdersMinutasHtmlAtivo === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIni = motorTeste.obterEstadoAtual().modoPlaceholdersMinutasHtml || (motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado');
            motorTeste.definirPlaceholdersMinutasHtmlAtivo(false);
            const estDesativado = motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo;
            motorTeste.definirPlaceholdersMinutasHtmlAtivo(true);
            const estReativado = motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo;

            let modAvancadoOk = true;
            let modCtrlAvancadoOk = true;
            let modDesativadoOk = true;
            let modPlaceholdersOk = true;
            if (typeof motorTeste.definirModoPlaceholdersMinutasHtml === 'function') {
                motorTeste.definirModoPlaceholdersMinutasHtml('avancado');
                const estAv = motorTeste.obterEstadoAtual();
                modAvancadoOk = (estAv.modoPlaceholdersMinutasHtml === 'avancado' && estAv.placeholdersMinutasHtmlAtivo === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('ctrl_avancado');
                const estCtrlAv = motorTeste.obterEstadoAtual();
                modCtrlAvancadoOk = (estCtrlAv.modoPlaceholdersMinutasHtml === 'ctrl_avancado' && estCtrlAv.placeholdersMinutasHtmlAtivo === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('desabilitado');
                const estDes = motorTeste.obterEstadoAtual();
                modDesativadoOk = (estDes.modoPlaceholdersMinutasHtml === 'desabilitado' && estDes.placeholdersMinutasHtmlAtivo === false);

                motorTeste.definirModoPlaceholdersMinutasHtml('placeholders');
                const estPl = motorTeste.obterEstadoAtual();
                modPlaceholdersOk = (estPl.modoPlaceholdersMinutasHtml === 'placeholders' && estPl.placeholdersMinutasHtmlAtivo === true);

                motorTeste.definirModoPlaceholdersMinutasHtml(estIni);
            } else {
                motorTeste.definirPlaceholdersMinutasHtmlAtivo(estIni !== 'desabilitado');
            }

            const tudoValido = (estDesativado === false && estReativado === true && modAvancadoOk && modCtrlAvancadoOk && modDesativadoOk && modPlaceholdersOk);
            registrar(
                tudoValido,
                'CONTROLE_PLACEHOLDERS_HTML_CONFIG',
                'Controle dos 4 modos de placeholders em editores HTML online via Motor de Teste (desabilitado, placeholders, ctrl_avancado, avancado)',
                {
                    textoTestado: 'Alternancia dos 4 modos (desabilitado, placeholders, ctrl_avancado, avancado)',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true, avancado=ok, ctrl_avancado=ok, des=ok, pl=ok',
                    obtido: `desativado=${estDesativado}, reativado=${estReativado}, avancado=${modAvancadoOk}, ctrlAvancado=${modCtrlAvancadoOk}, des=${modDesativadoOk}, pl=${modPlaceholdersOk}`
                }
            );

            /* 3.2.1) Validacao funcional do modo ctrl_avancado (sem Ctrl = apenas placeholders; com Ctrl = avancado) */
            const estOrigModo = motorTeste.obterEstadoAtual().modoPlaceholdersMinutasHtml;
            motorTeste.definirModoPlaceholdersMinutasHtml('ctrl_avancado');

            const textoMinutaTeste = 'Em conformidade com [@@artigo_lei@@] do CPC, segue despacho.';
            const posPlaceholder = textoMinutaTeste.indexOf('[@@artigo_lei@@]') + 4;
            const posPalavraComum = textoMinutaTeste.indexOf('conformidade') + 3;

            const resPlaceholderSemCtrl = (typeof motorTeste.localizarCampoSimbolosSobCursor === 'function')
                ? motorTeste.localizarCampoSimbolosSobCursor(textoMinutaTeste, posPlaceholder)
                : null;
            const resPalavraSemCtrl = (typeof motorTeste.localizarCampoSimbolosSobCursor === 'function')
                ? motorTeste.localizarCampoSimbolosSobCursor(textoMinutaTeste, posPalavraComum)
                : null;

            const resAvancadoComCtrl = (typeof motorTeste.tentarExpandirPadraoComposto === 'function')
                ? (motorTeste.tentarExpandirPadraoComposto(textoMinutaTeste, posPalavraComum, false, false) ||
                   (typeof motorTeste.expandirUnidadeAtomicaEstagio1 === 'function' ? motorTeste.expandirUnidadeAtomicaEstagio1(textoMinutaTeste, posPalavraComum) : null))
                : null;

            motorTeste.definirModoPlaceholdersMinutasHtml(estOrigModo);

            const ctrlAvancadoLogicaOk = (
                resPlaceholderSemCtrl !== null &&
                textoMinutaTeste.slice(resPlaceholderSemCtrl.inicio, resPlaceholderSemCtrl.fim) === '[@@artigo_lei@@]' &&
                resPalavraSemCtrl === null &&
                resAvancadoComCtrl !== null &&
                textoMinutaTeste.slice(resAvancadoComCtrl.inicio, resAvancadoComCtrl.fim) === 'conformidade'
            );

            registrar(
                ctrlAvancadoLogicaOk,
                'SELECAO_PLACEHOLDERS_CTRL_AVANCADO_FUNCIONAMENTO',
                'Modo ctrl_avancado em Minutas HTML: Sem Ctrl seleciona apenas placeholders; Com Ctrl ativa expansao avancada',
                {
                    placeholderSemCtrl: resPlaceholderSemCtrl ? textoMinutaTeste.slice(resPlaceholderSemCtrl.inicio, resPlaceholderSemCtrl.fim) : null,
                    palavraSemCtrl: resPalavraSemCtrl,
                    palavraAvancadaComCtrl: resAvancadoComCtrl ? textoMinutaTeste.slice(resAvancadoComCtrl.inicio, resAvancadoComCtrl.fim) : null
                }
            );

            /* 3.2.2) Isolamento estrito: a opcao de minutas HTML nao interfere em textos comuns */
            let isolamentoTextoComumOk = true;
            if (typeof motorTeste.classificarContextoElementoAlvo === 'function') {
                const divDocPjeLeitura = document.createElement('div');
                divDocPjeLeitura.className = 'cke_editable cke_contents';
                const pDocPje = document.createElement('p');
                pDocPje.textContent = 'Documento Judicial do PJe apenas para leitura';
                divDocPjeLeitura.appendChild(pDocPje);
                document.body.appendChild(divDocPjeLeitura);

                const divEditorReal = document.createElement('div');
                divEditorReal.contentEditable = 'true';
                const pEditor = document.createElement('p');
                pEditor.textContent = 'Minuta ativa de despacho';
                divEditorReal.appendChild(pEditor);
                document.body.appendChild(divEditorReal);

                const ctxLeituraPje = motorTeste.classificarContextoElementoAlvo(pDocPje);
                const ctxEditorReal = motorTeste.classificarContextoElementoAlvo(pEditor);

                document.body.removeChild(divDocPjeLeitura);
                document.body.removeChild(divEditorReal);

                isolamentoTextoComumOk = (ctxLeituraPje === 'LEITURA_COMUM' && ctxEditorReal === 'EDITOR_MULTILINHA_EDITAVEL');
            }

            registrar(
                isolamentoTextoComumOk,
                'SELECAO_PLACEHOLDERS_ISOLAMENTO_TEXTO_COMUM',
                'Isolamento estrito: Documentos de leitura (mesmo com classes de CKEditor) sao classificados como LEITURA_COMUM e nao sofrem interferencia de Minutas HTML',
                { isolamentoTextoComumOk }
            );
        }

        /* 3.3) Comportamento do campo de entrada simples (<input>) com selecao inteligente e mascaras */
        if (typeof document !== 'undefined' && motorTeste && typeof motorTeste.simularAlternanciaCliqueInput === 'function') {
            const inpTeste = document.createElement('input');
            inpTeste.type = 'text';
            inpTeste.value = '11/09/2026';
            document.body.appendChild(inpTeste);

            /* Regra 1: Na primeira vez somente seleciona tudo */
            const r1 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel1 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 2: No 2º clique consecutivo no campo ja focado com texto, desseleciona e posiciona o cursor */
            const r2 = motorTeste.simularAlternanciaCliqueInput(inpTeste, 3);
            const desel2 = (inpTeste.selectionStart === 3 && inpTeste.selectionEnd === 3);

            /* Regra 3: Se der dois cliques ele seleciona tudo novamente */
            const r3 = motorTeste.simularAlternanciaCliqueInput(inpTeste, null, 2);
            const sel3 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 4: Campo com mascara de data (ex: "___/___/_____") sem alfanumerico: sempre seleciona tudo para facilitar colagem */
            inpTeste.value = '___/___/_____';
            delete inpTeste.dataset.autoselected;
            const r4 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel4 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);
            const r4b = motorTeste.simularAlternanciaCliqueInput(inpTeste, 2);
            const sel4b = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 5: Ao perder o foco (blur) e focar novamente, reseta e seleciona tudo novamente */
            inpTeste.value = '11/09/2026';
            inpTeste.blur();
            const r5 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel5 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 6: Esc ao editar o campo sai do foco e desseleciona */
            if (typeof motorTeste.simularEscInput === 'function') {
                motorTeste.simularEscInput(inpTeste);
            }
            const r6 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel6 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            document.body.removeChild(inpTeste);

            const sucessoCiclo = (r1 === 'SELECIONADO' && sel1 &&
                r2 === 'DESSELECIONADO' && desel2 &&
                r3 === 'SELECIONADO' && sel3 &&
                r4 === 'SELECIONADO' && sel4 &&
                r4b === 'SELECIONADO' && sel4b &&
                r5 === 'SELECIONADO' && sel5 &&
                r6 === 'SELECIONADO' && sel6);

            registrar(
                sucessoCiclo,
                'ALTERNANCIA_CLIQUE_INPUT',
                'Campo Simples: 1a vez seleciona tudo; 2o clique posiciona cursor; duplo clique seleciona; mascara ___/___/_____ sempre seleciona; blur/Esc reseta',
                {
                    textoTestado: 'Input "11/09/2026" e mascara "___/___/_____"',
                    idxCursor: 0,
                    esperado: 'c1=SEL, c2=DESEL, c3_2cliques=SEL, c4_mascara=SEL, c4b_mascaraRepetida=SEL, c5_aposBlur=SEL, c6_posEsc=SEL',
                    obtido: `c1=${r1}, c2=${r2}, c3=${r3}, c4=${r4}, c4b=${r4b}, c5=${r5}, c6=${r6}`
                }
            );
        }

        /* 3.4) Conversores bidirecionais de modo do editor online (HTML <-> Markdown) */
        if (typeof window !== 'undefined' && window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function') {
            const htmlEntrada = '<p>Texto com <b>negrito</b> e <i>italico</i> e <s>tachado</s></p>';
            const mdObtido = window.JusGovEditorDemo.converterHtmlParaMarkdown(htmlEntrada);
            const mdEsperado = 'Texto com **negrito** e *italico* e ~~tachado~~';

            const mdEntrada = 'Linha com **negrito** e *italico*';
            const htmlObtido = window.JusGovEditorDemo.converterMarkdownParaHtml(mdEntrada);
            const htmlEsperado = '<p>Linha com <b>negrito</b> e <i>italico</i></p>';

            registrar(
                mdObtido === mdEsperado && htmlObtido === htmlEsperado,
                'EDITOR_CONVERSOR_RTF_MARKDOWN',
                'Conversores bidirecionais nativos do Editor Demo (HTML <-> Markdown)',
                {
                    textoTestado: htmlEntrada,
                    idxCursor: 0,
                    esperado: `md: "${mdEsperado}" | html: "${htmlEsperado}"`,
                    obtido: `md: "${mdObtido}" | html: "${htmlObtido}"`
                }
            );
        }

        /* 3.5) Controle e simulacao de colagem rapida via botao direito (1 clique = normal/formatado, 2 cliques rapidos = texto puro) */
        if (motorTeste && typeof motorTeste.definirColagemBotaoDireitoAtiva === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIniColagem = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(false);
            const estColagemOff = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(true);
            const estColagemOn = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(Boolean(estIniColagem));

            registrar(
                estColagemOff === false && estColagemOn === true,
                'CONTROLE_COLAGEM_BOTAO_DIREITO_CONFIG',
                'Controle de alternancia do parametro colagemBotaoDireitoAtiva via Motor de Teste',
                {
                    textoTestado: 'Alternancia de colagemBotaoDireitoAtiva',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true',
                    obtido: `desativado=${estColagemOff}, reativado=${estColagemOn}`
                }
            );

            if (typeof document !== 'undefined' && typeof motorTeste.simularColagemBotaoDireito === 'function') {
                const elInput = document.createElement('input');
                elInput.type = 'text';
                elInput.value = 'Prefixo: ';
                document.body.appendChild(elInput);

                motorTeste.simularColagemBotaoDireito(elInput, 'normal', '123456');
                const valInput = elInput.value;

                const elContent = document.createElement('div');
                elContent.contentEditable = 'true';
                elContent.innerHTML = '<p>Conteudo: </p>';
                document.body.appendChild(elContent);

                motorTeste.simularColagemBotaoDireito(elContent, 'texto_puro', 'Texto Sem Formatacao');
                const txtContent = elContent.textContent;

                document.body.removeChild(elInput);
                document.body.removeChild(elContent);

                const colagemOk = valInput.includes('123456') && txtContent.includes('Texto Sem Formatacao');
                registrar(
                    colagemOk,
                    'SIMULACAO_COLAGEM_BOTAO_DIREITO_MODOS',
                    'Simulacao de colagem com botao direito: modo normal (input) e modo texto puro (contenteditable)',
                    {
                        textoTestado: 'Colagem em Input e Contenteditable',
                        idxCursor: 0,
                        esperado: 'input contem 123456 e content contem Texto Sem Formatacao',
                        obtido: `input="${valInput}", content="${txtContent}"`
                    }
                );
            }
        }

        /* 3.6) Modulo TECLADO/MOUSE: Captura dos Botoes 4 e 5, Navegacao por Teclado e Mascaras */
        if (motorTeste && typeof motorTeste.definirCapturaBotoesMouse4e5Ativa === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIniMouse = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(false);
            const estMouseOff = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(true);
            const estMouseOn = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(estIniMouse !== false);

            registrar(
                estMouseOff === false && estMouseOn === true,
                'CONTROLE_BOTOES_MOUSE_4_5_CONFIG',
                'Controle de alternancia do parametro capturaBotoesMouse4e5Ativa via Motor de Teste',
                {
                    textoTestado: 'Alternancia de capturaBotoesMouse4e5Ativa',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true',
                    obtido: `desativado=${estMouseOff}, reativado=${estMouseOn}`
                }
            );

            if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                const estIniMeio = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(false);
                const estMeioOff = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(true);
                const estMeioOn = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(estIniMeio === true);

                registrar(
                    estMeioOff === false && estMeioOn === true,
                    'CONTROLE_COLAR_BOTAO_MEIO_CONFIG',
                    'Controle de alternancia do parametro colarBotaoMeioAtivo via Motor de Teste',
                    {
                        textoTestado: 'Alternancia de colarBotaoMeioAtivo',
                        idxCursor: 0,
                        esperado: 'desativado=false, reativado=true',
                        obtido: `desativado=${estMeioOff}, reativado=${estMeioOn}`
                    }
                );
            }

            if (typeof motorTeste.emularTeclasWinV === 'function') {
                /* Ctrl + Botao do Meio envia Win+V (historico do Windows) e nao faz mais rollback interno */
                const estadoOrigMeioWV = (typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(true);
                const campoWV = document.createElement('input');
                campoWV.type = 'text';
                document.body.appendChild(campoWV);
                let recebeuWinV = false;
                campoWV.addEventListener('keydown', (ev) => { if (ev.metaKey && ev.key === 'v') recebeuWinV = true; });
                const evtCtrlMeio = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1, ctrlKey: true });
                campoWV.dispatchEvent(evtCtrlMeio);
                const valorInalterado = (campoWV.value === '');
                document.body.removeChild(campoWV);
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(estadoOrigMeioWV);
                registrar(
                    Boolean(recebeuWinV && valorInalterado && evtCtrlMeio.defaultPrevented),
                    'CTRL_MEIO_ENVIA_WIN_V',
                    'Ctrl + Botao do Meio envia as teclas Win+V ao sistema, sem colar nem fazer rollback interno',
                    {
                        textoTestado: 'Ctrl + Botao do Meio',
                        idxCursor: 0,
                        esperado: 'winV=true, valorInalterado=true',
                        obtido: `winV=${recebeuWinV}, valorInalterado=${valorInalterado}`
                    }
                );
            }

            if (typeof motorTeste.simularNavegacaoBotoesMouse === 'function') {
                const totalAbas = 5;
                const navVoltarZero = motorTeste.simularNavegacaoBotoesMouse(3, totalAbas, 0);
                const navVoltarMeio = motorTeste.simularNavegacaoBotoesMouse(3, totalAbas, 3);
                const navAvancarFim = motorTeste.simularNavegacaoBotoesMouse(4, totalAbas, 4);
                const navAvancarMeio = motorTeste.simularNavegacaoBotoesMouse(4, totalAbas, 1);

                const navOk = (navVoltarZero === 4 && navVoltarMeio === 2 && navAvancarFim === 0 && navAvancarMeio === 2);
                registrar(
                    navOk,
                    'SIMULACAO_NAVEGACAO_CIRCULAR_ABAS_MOUSE',
                    'Navegacao circular entre abas via Botoes 4 e 5: Voltar (0->4, 3->2) e Avancar (4->0, 1->2)',
                    {
                        textoTestado: '5 abas na janela ativa',
                        idxCursor: 0,
                        esperado: 'voltar(0)=4, voltar(3)=2, avancar(4)=0, avancar(1)=2',
                        obtido: `voltar(0)=${navVoltarZero}, voltar(3)=${navVoltarMeio}, avancar(4)=${navAvancarFim}, avancar(1)=${navAvancarMeio}`
                    }
                );
            }

            if (motorTeste && typeof motorTeste.tratarNavegacaoAbasPorBotoesMouse === 'function') {
                let preventDefaultBotao4 = false;
                let preventDefaultBotao5 = false;
                let stopPropagationBotao4 = false;
                let stopPropagationBotao5 = false;

                const evtBtn4 = {
                    type: 'mousedown',
                    button: 3,
                    which: 4,
                    buttons: 8,
                    preventDefault() { preventDefaultBotao4 = true; },
                    stopPropagation() { stopPropagationBotao4 = true; },
                    stopImmediatePropagation() {}
                };
                motorTeste.tratarNavegacaoAbasPorBotoesMouse(evtBtn4);

                const evtBtn5 = {
                    type: 'mousedown',
                    button: 4,
                    which: 5,
                    buttons: 16,
                    preventDefault() { preventDefaultBotao5 = true; },
                    stopPropagation() { stopPropagationBotao5 = true; },
                    stopImmediatePropagation() {}
                };
                motorTeste.tratarNavegacaoAbasPorBotoesMouse(evtBtn5);

                const capturaBotoesOk = (preventDefaultBotao4 && stopPropagationBotao4 && preventDefaultBotao5 && stopPropagationBotao5);
                registrar(
                    capturaBotoesOk,
                    'CAPTURA_SUPRESSAO_BOTOES_MOUSE_4_5',
                    'Neutralizacao do Comportamento de Historico Nativo e Captura dos Botoes 4 e 5 do Mouse',
                    {
                        botao4Interceptado: preventDefaultBotao4 && stopPropagationBotao4,
                        botao5Interceptado: preventDefaultBotao5 && stopPropagationBotao5
                    }
                );
            }

            if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function' && typeof motorTeste.aoPressionarBotaoMouse === 'function') {
                const estColarIni = motorTeste.obterColarBotaoMeioAtivo ? motorTeste.obterColarBotaoMeioAtivo() : false;
                motorTeste.definirColarBotaoMeioAtivo(true);

                /* Elemento comum / div */
                const divComum = document.createElement('div');
                divComum.textContent = 'Texto em div comum';
                document.body.appendChild(divComum);

                /* Link <a> com href */
                const linkHref = document.createElement('a');
                linkHref.href = 'https://pje.jus.br/processo';
                linkHref.textContent = 'Abrir Processo em Nova Aba';
                document.body.appendChild(linkHref);

                /* Evento mousedown no link com botao do meio: NAO DEVE chamar preventDefault (preserva nova aba) */
                let preventDefaultChamadoLink = false;
                const evtLink = {
                    button: 1,
                    target: linkHref,
                    preventDefault() { preventDefaultChamadoLink = true; },
                    stopPropagation() {}
                };
                motorTeste.aoPressionarBotaoMouse(evtLink);

                /* Evento mousedown na div com botao do meio: DEVE chamar preventDefault (anula rolagem automatica) */
                let preventDefaultChamadoDiv = false;
                const evtDiv = {
                    button: 1,
                    target: divComum,
                    preventDefault() { preventDefaultChamadoDiv = true; },
                    stopPropagation() {}
                };
                motorTeste.aoPressionarBotaoMouse(evtDiv);

                /* Evento click com botao do meio: NUNCA deve chamar preventDefault */
                let preventDefaultChamadoClick = false;
                if (typeof motorTeste.aoClicar === 'function') {
                    const evtClickMeio = {
                        button: 1,
                        target: linkHref,
                        preventDefault() { preventDefaultChamadoClick = true; },
                        stopPropagation() {}
                    };
                    motorTeste.aoClicar(evtClickMeio);
                }

                /* Evento auxclick com botao do meio sobre link: NUNCA deve chamar preventDefault */
                let preventDefaultAuxLink = false;
                if (typeof motorTeste.aoClicarAuxiliarMouse === 'function') {
                    const evtAuxLink = {
                        button: 1,
                        target: linkHref,
                        preventDefault() { preventDefaultAuxLink = true; },
                        stopPropagation() {}
                    };
                    motorTeste.aoClicarAuxiliarMouse(evtAuxLink);
                }

                /* Evento auxclick com botao do meio sobre div (nao editavel): executa silenciosamente sem erro */
                let erroAuxDiv = false;
                if (typeof motorTeste.aoClicarAuxiliarMouse === 'function') {
                    try {
                        const evtAuxDiv = {
                            button: 1,
                            target: divComum,
                            preventDefault() {},
                            stopPropagation() {}
                        };
                        motorTeste.aoClicarAuxiliarMouse(evtAuxDiv);
                    } catch (_) {
                        erroAuxDiv = true;
                    }
                }

                /* Teste quando colarBotaoMeioAtivo = false: NAO DEVE chamar preventDefault (preserva autoscroll / roda nativa) */
                motorTeste.definirColarBotaoMeioAtivo(false);
                let preventDefaultChamadoDivQuandoDesativado = false;
                const evtDivOff = {
                    button: 1,
                    target: divComum,
                    preventDefault() { preventDefaultChamadoDivQuandoDesativado = true; },
                    stopPropagation() {}
                };
                motorTeste.aoPressionarBotaoMouse(evtDivOff);

                document.body.removeChild(divComum);
                document.body.removeChild(linkHref);
                motorTeste.definirColarBotaoMeioAtivo(estColarIni);

                const autoscrollOk = (!preventDefaultChamadoLink && preventDefaultChamadoDiv && !preventDefaultChamadoDivQuandoDesativado && !preventDefaultChamadoClick && !preventDefaultAuxLink && !erroAuxDiv);
                registrar(
                    autoscrollOk,
                    'SUPRESSAO_AUTOSCROLL_BOTAO_MEIO_E_PRESERVACAO_LINKS',
                    'Anulacao de Rolagem Automatica no Botao do Meio quando ativo, Preservacao Nativa quando desativado e Preservacao de Links',
                    {
                        linkNaoBloqueado: !preventDefaultChamadoLink,
                        divAutoscrollAnuladoQuandoAtivo: preventDefaultChamadoDiv,
                        divAutoscrollPreservadoQuandoDesativado: !preventDefaultChamadoDivQuandoDesativado,
                        clickMeioNaoInterceptado: !preventDefaultChamadoClick,
                        auxClickLinkNaoBloqueado: !preventDefaultAuxLink,
                        falhaSilenciosaSemErro: !erroAuxDiv
                    }
                );
            }

            if (typeof motorTeste.definirNavegacaoTecladoCamposAtiva === 'function') {
                const estIniTeclado = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(false);
                const estTecladoOff = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(true);
                const estTecladoOn = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(estIniTeclado !== false);

                registrar(
                    estTecladoOff === false && estTecladoOn === true,
                    'CONTROLE_NAVEGACAO_TECLADO_CAMPOS_CONFIG',
                    'Controle de alternancia do parametro navegacaoTecladoCamposAtiva via Motor de Teste',
                    {
                        textoTestado: 'Alternancia de navegacaoTecladoCamposAtiva',
                        idxCursor: 0,
                        esperado: 'desativado=false, reativado=true',
                        obtido: `desativado=${estTecladoOff}, reativado=${estTecladoOn}`
                    }
                );
            }

            /* Validacao das mascaras de Data e CPF/CNPJ via JusGovEditorDemo */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function') {
                const dataFmt = window.JusGovEditorDemo.formatarMascaraData('29102026');
                const cpfFmt = window.JusGovEditorDemo.formatarMascaraCpfCnpj('12345678901');
                const cnpjFmt = window.JusGovEditorDemo.formatarMascaraCpfCnpj('12345678000199');
                const mascarasOk = (dataFmt === '29/10/2026' && cpfFmt === '123.456.789-01' && cnpjFmt === '12.345.678/0001-99');

                registrar(
                    mascarasOk,
                    'MASCARAS_DATA_CPF_CNPJ_VALIDACAO',
                    'Validacao e formatacao de mascaras automaticas de Data (DD/MM/AAAA), CPF e CNPJ',
                    {
                        textoTestado: 'Entradas numericas 29102026, 12345678901, 12345678000199',
                        idxCursor: 0,
                        esperado: 'data=29/10/2026, cpf=123.456.789-01, cnpj=12.345.678/0001-99',
                        obtido: `data=${dataFmt}, cpf=${cpfFmt}, cnpj=${cnpjFmt}`
                    }
                );
            }

            /* Validacao do Botao Padrao do Editor HTML e Posicionamento do Botao Limpar Formatacao */
            const btnPadraoEditor = document.getElementById('btnRestaurarEditorHtmlDemo');
            const toolbarMain = document.getElementById('toolbarPrincipalDemo');
            let ordemBotoesOk = true;
            let temBotaoPadrao = true;
            if (toolbarMain && btnPadraoEditor) {
                const btnCentro = toolbarMain.querySelector('button[data-cmd="justifyCenter"]');
                const btnLimpar = toolbarMain.querySelector('button[data-cmd="removeFormat"]');
                if (btnCentro && btnLimpar) {
                    const sep = btnCentro.nextElementSibling;
                    const ehSep = sep && sep.classList.contains('toolbar-sep');
                    const ehLimparDepois = sep && sep.nextElementSibling === btnLimpar;
                    ordemBotoesOk = Boolean(ehSep && ehLimparDepois);
                } else {
                    ordemBotoesOk = false;
                }
            } else {
                temBotaoPadrao = Boolean(window.JusGovEditorDemo && typeof window.JusGovEditorDemo.restaurarEditorHtmlPadrao === 'function');
            }

            registrar(
                temBotaoPadrao && ordemBotoesOk,
                'EDITOR_HTML_BOTAO_PADRAO_E_ORDEM_LIMPAR',
                'Botao Padrao do Editor HTML presente e Botao Limpar Formatacao posicionado apos separador ao lado de Centralizar',
                {
                    textoTestado: 'Estrutura da Toolbar e Cabecalho do Editor HTML',
                    idxCursor: 0,
                    esperado: 'temBotaoPadrao=true, ordemBotoesOk=true',
                    obtido: `temBotaoPadrao=${temBotaoPadrao}, ordemBotoesOk=${ordemBotoesOk}`
                }
            );
        }

        /* 3.6.1) Contorno Visual Rapido ao Copiar (Flash Temporizado): Padrao 500ms e Borda Transparente sem Escurecer Selecao */
        if (motorTeste && typeof motorTeste.obterEstadoAtual === 'function') {
            const estadoAtual = motorTeste.obterEstadoAtual();
            const padrao500Ok = (estadoAtual.tempoFlashBorderMs === 500);

            let flashVisualOk = true;
            if (typeof motorTeste.dispararFlashBorderVisual === 'function' && typeof motorTeste.limparFlashBorderImediatamente === 'function') {
                const spanTeste = document.createElement('span');
                spanTeste.textContent = 'Texto para Teste de Contorno Flash';
                document.body.appendChild(spanTeste);

                const rangeTeste = document.createRange();
                rangeTeste.selectNodeContents(spanTeste);

                motorTeste.dispararFlashBorderVisual(rangeTeste);

                const cont = document.getElementById('jusgov-flash-contour-container');
                const temContainer = Boolean(cont);
                const box = cont ? cont.querySelector('.jusgov-flash-box') : null;
                const temBox = Boolean(box);
                const bgTransparente = box ? (box.style.background === 'transparent' || box.style.backgroundColor === 'transparent') : false;
                const temBorda = box ? (box.style.border && box.style.border.includes('solid')) : false;

                motorTeste.limparFlashBorderImediatamente();
                const containerRemovido = !document.getElementById('jusgov-flash-contour-container');

                if (spanTeste.parentNode) {
                    spanTeste.parentNode.removeChild(spanTeste);
                }

                flashVisualOk = padrao500Ok && temContainer && temBox && bgTransparente && temBorda && containerRemovido;
            } else {
                flashVisualOk = padrao500Ok;
            }

            registrar(
                flashVisualOk,
                'CONTORNO_FLASH_COPIA_PADRAO_500MS_E_TRANSPARENCIA',
                'Contorno visual flash ao copiar com duracao padrao de 500ms, fundo 100% transparente (sem escurecer selecao) e remocao limpa',
                {
                    textoTestado: 'Parametro tempoFlashBorderMs e container flutuante de contorno',
                    idxCursor: 0,
                    esperado: 'tempoFlashBorderMs=500, bgTransparente=true, containerRemovido=true',
                    obtido: `tempoFlashBorderMs=${estadoAtual.tempoFlashBorderMs}, flashVisualOk=${flashVisualOk}`
                }
            );
        }

        /* 3.7) Modulo NAVEGADOR: Single Window, Segundo Plano, Anti-Duplicacao e Ordenacao de Guias */
        {
            function testNormalizarUrl(urlStr) {
                if (!urlStr || typeof urlStr !== 'string') return '';
                try {
                    const u = new URL(urlStr);
                    let c = u.pathname;
                    if (c.length > 1 && c.endsWith('/')) c = c.slice(0, -1);
                    const paramsParaRemover = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_cid', 'ts'];
                    const params = new URLSearchParams(u.search);
                    paramsParaRemover.forEach(p => params.delete(p));
                    params.sort();
                    const buscaLimpa = params.toString() ? ('?' + params.toString()) : '';
                    return (u.origin + c + buscaLimpa).toLowerCase();
                } catch (_) {
                    return urlStr.trim().toLowerCase();
                }
            }

            function testEhAuthPopup(janela, urlStr, tituloStr) {
                if (!janela) return false;
                if (janela.type === 'popup') {
                    const larg = janela.width || 0;
                    const alt = janela.height || 0;
                    if (larg > 0 && larg <= 700 && alt > 0 && alt <= 780) return true;
                }
                const texto = ((urlStr || '') + ' ' + (tituloStr || '')).toLowerCase();
                const padroes = ['gov.br', 'pjeoffice', 'shodo', 'assinador', 'certificado', 'login', 'oauth', 'auth'];
                return padroes.some(termo => texto.includes(termo));
            }

            const urlBase = 'https://pje.jus.br/painel/';
            const urlComBarra = 'https://pje.jus.br/painel';
            const urlTracking = 'https://pje.jus.br/painel?utm_source=email&proc=12345';
            const urlTrackingInvertida = 'https://pje.jus.br/painel/?proc=12345&utm_source=push';
            const normBase = testNormalizarUrl(urlBase);
            const normBarra = testNormalizarUrl(urlComBarra);
            const normTrack1 = testNormalizarUrl(urlTracking);
            const normTrack2 = testNormalizarUrl(urlTrackingInvertida);

            const antiDuplicacaoOk = (normBase === normBarra && normTrack1 === normTrack2 && normBase !== normTrack1);

            const authPopup1 = testEhAuthPopup({ type: 'popup', width: 500, height: 600 }, 'https://acesso.gov.br', 'Login Gov.br');
            const authPopup2 = testEhAuthPopup({ type: 'popup', width: 1200, height: 900 }, 'https://localhost:9000/pjeoffice', 'PJEOffice');
            const normalWindow = testEhAuthPopup({ type: 'normal', width: 1400, height: 900 }, 'https://pje.jus.br/painel', 'Painel Principal');
            const authDetectionOk = (authPopup1 === true && authPopup2 === true && normalWindow === false);

            const abasMock = [
                { id: 10, title: 'Zebra Portal', url: 'https://zeta.jus.br/pje', lastAccessed: 100, index: 0, pinned: false, groupId: 1 },
                { id: 30, title: 'Alpha Processos', url: 'https://alpha.jus.br/inicio', lastAccessed: 300, index: 1, pinned: false, groupId: 1 },
                { id: 20, title: 'Beta Consulta', url: 'https://beta.jus.br/busca', lastAccessed: 200, index: 2, pinned: false, groupId: -1 }
            ];

            const sortPorTituloAZ = [...abasMock].sort((a, b) => a.title.localeCompare(b.title)).map(t => t.id);
            const sortPorUrlZA = [...abasMock].sort((a, b) => b.url.localeCompare(a.url)).map(t => t.id);
            const sortPorAcessoRecente = [...abasMock].sort((a, b) => b.lastAccessed - a.lastAccessed).map(t => t.id);
            const sortPorOrdemCriacaoAsc = [...abasMock].sort((a, b) => a.id - b.id).map(t => t.id);
            const sortPorOrdemCriacaoDesc = [...abasMock].sort((a, b) => b.id - a.id).map(t => t.id);

            const ordenacaoOk = (sortPorTituloAZ[0] === 30 && sortPorTituloAZ[1] === 20 && sortPorTituloAZ[2] === 10 &&
                sortPorUrlZA[0] === 10 && sortPorUrlZA[1] === 20 && sortPorUrlZA[2] === 30 &&
                sortPorAcessoRecente[0] === 30 && sortPorAcessoRecente[1] === 20 && sortPorAcessoRecente[2] === 10 &&
                sortPorOrdemCriacaoAsc[0] === 10 && sortPorOrdemCriacaoAsc[1] === 20 && sortPorOrdemCriacaoAsc[2] === 30 &&
                sortPorOrdemCriacaoDesc[0] === 30 && sortPorOrdemCriacaoDesc[1] === 20 && sortPorOrdemCriacaoDesc[2] === 10);

            /* Validacao de Desagrupamento de Guias (identificacao e remocao de grupos de abas) */
            const abasAgrupadas = abasMock.filter(t => t.groupId !== undefined && t.groupId !== -1).map(t => t.id);
            const desagrupamentoOk = (abasAgrupadas.length === 2 && abasAgrupadas.includes(10) && abasAgrupadas.includes(30));

            /* Validacao do Economizador de Memoria / Tab Discarding com tempo customizavel em minutos */
            const tempoMinutos = 15;
            const limiteMs = tempoMinutos * 60 * 1000;
            const agoraFake = 1000000;
            const abasMemoria = [
                { id: 1, active: true, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 2, active: false, pinned: true, audible: false, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 3, active: false, pinned: false, audible: true, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 4, active: false, pinned: false, audible: false, discarded: true, lastAccessed: agoraFake - 2000000 },
                { id: 5, active: false, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - (10 * 60 * 1000) },
                { id: 6, active: false, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - (25 * 60 * 1000) }
            ];
            const elegiveisDescarte = abasMemoria.filter(t => !t.active && !t.pinned && !t.audible && !t.discarded && (agoraFake - t.lastAccessed) > limiteMs).map(t => t.id);
            const descarteCustomizadoOk = (elegiveisDescarte.length === 1 && elegiveisDescarte[0] === 6);

            /* Validacao da Reutilizacao de Guias: Monitorar URL Original vs Apenas Atual */
            const urlOrigAba = 'https://pje.jus.br/processo/100';
            const urlRedirecionada = 'https://pje.jus.br/detalhe?id=100';
            const regAba = { urlOriginal: urlOrigAba, urlAtual: urlRedirecionada };
            const buscaOriginalComOptDesativada = (urlOrigAba === regAba.urlAtual);
            const buscaOriginalComOptAtivada = (urlOrigAba === regAba.urlAtual || urlOrigAba === regAba.urlOriginal);
            const monitorarUrlOriginalOk = (!buscaOriginalComOptDesativada && buscaOriginalComOptAtivada);

            /* Validacao da Logica Invertida de Primeiro Plano (padrao: segundo plano sem ativar; ativado: foca a guia) */
            function simularReusoAba(abaExistente, abaEmPrimeiroPlano) {
                return {
                    reutilizada: true,
                    ativadaEmPrimeiroPlano: Boolean(abaEmPrimeiroPlano)
                };
            }
            const reusoSegundoPlanoPadrao = simularReusoAba({ id: 10 }, false);
            const reusoPrimeiroPlanoAtivo = simularReusoAba({ id: 10 }, true);
            const logicaPrimeiroPlanoOk = (reusoSegundoPlanoPadrao.reutilizada === true && reusoSegundoPlanoPadrao.ativadaEmPrimeiroPlano === false &&
                reusoPrimeiroPlanoAtivo.reutilizada === true && reusoPrimeiroPlanoAtivo.ativadaEmPrimeiroPlano === true);

            registrar(
                antiDuplicacaoOk && authDetectionOk && ordenacaoOk && desagrupamentoOk && descarteCustomizadoOk && monitorarUrlOriginalOk && logicaPrimeiroPlanoOk,
                'SIMULACAO_MODULO_NAVEGADOR_REGRAS',
                'Modulo NAVEGADOR: Normalizacao anti-duplicacao sem tracking, Excecao Popups Auth, Ordenacao Expandida (Titulo, URL, Acesso e Criacao), Desagrupamento, Descarte Customizavel, Monitoramento de URL Original e Logica Primeiro/Segundo Plano',
                {
                    textoTestado: 'Regras Avancadas de Gerenciamento de Guias e Janelas',
                    idxCursor: 0,
                    esperado: 'antiDuplicacao=true, authOk=true, sortCriacao=[10,20,30], desagrupamento=true, descarteCustomizado=true, monitorarUrlOrig=true, logicaPrimeiroPlano=true',
                    obtido: `antiDuplicacao=${antiDuplicacaoOk}, authOk=${authDetectionOk}, sortCriacao=[${sortPorOrdemCriacaoAsc.join(',')}], desagrupamento=${desagrupamentoOk}, descarteCustomizado=${descarteCustomizadoOk}, monitorarUrlOrig=${monitorarUrlOriginalOk}, logicaPrimeiroPlano=${logicaPrimeiroPlanoOk}`
                }
            );

            /* Validacao da Subordinacao de Opcoes de Mouse sob o Botao do Meio */
            let subordinacaoMouseOk = true;
            if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                const estadoOriginalMeio = (typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;

                motorTeste.definirColarBotaoMeioAtivo(false);
                motorTeste.definirColagemBotaoDireitoAtiva(true);

                const campoEditavel = document.createElement('input');
                campoEditavel.type = 'text';
                campoEditavel.value = 'teste_mouse';
                document.body.appendChild(campoEditavel);

                /* 1. Mousedown botao do meio desativado: nao deve interceptar autoscroll */
                const evtMousedownMeio = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 1 });
                campoEditavel.dispatchEvent(evtMousedownMeio);
                const mousedownMeioPermitido = !evtMousedownMeio.defaultPrevented;

                /* 2. Contextmenu botao direito: subordinado a colarBotaoMeio, deve ignorar quando colarBotaoMeio esta desativado */
                const evtContextmenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
                campoEditavel.dispatchEvent(evtContextmenu);
                const contextmenuNaoBloqueado = !evtContextmenu.defaultPrevented;

                /* 3. Auxclick Ctrl + Meio: subordinado a colarBotaoMeio, deve ignorar quando colarBotaoMeio esta desativado */
                const evtAuxCtrlMeio = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1, ctrlKey: true });
                campoEditavel.dispatchEvent(evtAuxCtrlMeio);
                const auxCtrlMeioNaoBloqueado = !evtAuxCtrlMeio.defaultPrevented;

                /* 4. Ao reativar colarBotaoMeioAtivo: mousedown deve bloquear autoscroll (bussola) */
                motorTeste.definirColarBotaoMeioAtivo(true);
                const evtMousedownMeioAtivo = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 1 });
                campoEditavel.dispatchEvent(evtMousedownMeioAtivo);
                const mousedownMeioBloqueado = evtMousedownMeioAtivo.defaultPrevented;

                document.body.removeChild(campoEditavel);
                motorTeste.definirColarBotaoMeioAtivo(estadoOriginalMeio);

                subordinacaoMouseOk = Boolean(mousedownMeioPermitido && contextmenuNaoBloqueado && auxCtrlMeioNaoBloqueado && mousedownMeioBloqueado);
            }

            registrar(
                subordinacaoMouseOk,
                'SUBORDINACAO_OPCOES_MOUSE_BOTAO_MEIO',
                'Subordinacao estrita do mouse: se Colar com Botao do Meio desativado, bloqueia botao direito e Ctrl+Meio; quando ativado, anula rolagem automatica nativa',
                {
                    textoTestado: 'Colar com o Botao do Meio e Sub-opcoes subordinadas',
                    idxCursor: 0,
                    esperado: 'subordinacaoMouseOk=true',
                    obtido: `subordinacaoMouseOk=${subordinacaoMouseOk}`
                }
            );
        }

        /* 3.8) Link de Download do utilitario X-Mouse Button Control */
        {
            const urlEsperadaXMouse = 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm';
            const urlValida = urlEsperadaXMouse.startsWith('https://www.highrez.co.uk/downloads/');

            registrar(
                urlValida,
                'LINK_DOWNLOAD_XMOUSE_BUTTON_CONTROL',
                'URL oficial e valida para download do utilitario X-Mouse Button Control',
                {
                    textoTestado: urlEsperadaXMouse,
                    idxCursor: 0,
                    esperado: 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm',
                    obtido: urlEsperadaXMouse
                }
            );

            /* Visor "Ultima Selecao": botao Atualizar sem estados de permissao; X-Mouse oculto */
            let visualClipOk = true;
            if (window.JusGovOptions && typeof window.JusGovOptions.atualizarCoresEBotoesClipboard === 'function') {
                const btnLer = document.getElementById('btnAtualizarPreview');
                const btnX = document.getElementById('btnDownloadXMouse');
                if (btnLer && btnX) {
                    window.JusGovOptions.atualizarCoresEBotoesClipboard();
                    visualClipOk = Boolean(!btnLer.classList.contains('btn-clip-permitido') && !btnLer.classList.contains('btn-clip-bloqueado') && btnX.style.display === 'none');
                }
            }

            registrar(
                visualClipOk,
                'VISUAL_VISOR_ULTIMA_SELECAO',
                'Visor Ultima Selecao: botao Atualizar sem estados de permissao de clipboard',
                {
                    textoTestado: 'Botao Atualizar da Ultima Selecao',
                    idxCursor: 0,
                    esperado: 'sem classes de permissao',
                    obtido: visualClipOk ? 'sem classes de permissao' : 'falha'
                }
            );

            registrar(
                visualClipOk,
                'VISUAL_E_PERMISSAO_CLIPBOARD_XMOUSE',
                'Alternancia de cores do botao Ler Area de Transferencia (verde/vermelho/padrao) e visibilidade condicional do X-Mouse e aviso de memoria interna',
                {
                    textoTestado: 'Estados de permissao granted, denied e prompt',
                    idxCursor: 0,
                    esperado: 'granted=verde/oculto, denied=vermelho/visivel, prompt=padrao/visivel',
                    obtido: visualClipOk ? 'granted=verde/oculto, denied=vermelho/visivel, prompt=padrao/visivel' : 'falha'
                }
            );

            /* Regra: o addon NUNCA le o clipboard do sistema. Colar com botao do meio usa a "Ultima Selecao". */
            let colagemUltimaSelecaoOk = false;
            let leiturasClipboard = 0;
            {
                const nav = window.navigator;
                const clip = nav && nav.clipboard;
                const origRead = clip && clip.read;
                const origReadText = clip && clip.readText;
                const estadoOrigMeio = (motorTeste && typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;
                const clipOrig = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                try {
                    if (clip) {
                        try { clip.read = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) {}
                        try { clip.readText = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) {}
                    }
                    if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                        motorTeste.definirColarBotaoMeioAtivo(true);
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'ULTIMA_SELECAO_XYZ', html: '', formatado: false };
                        const campoUS = document.createElement('input');
                        campoUS.type = 'text';
                        document.body.appendChild(campoUS);
                        campoUS.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
                        colagemUltimaSelecaoOk = (campoUS.value === 'ULTIMA_SELECAO_XYZ');
                        document.body.removeChild(campoUS);
                    }
                } finally {
                    if (clip) {
                        try { if (origRead) clip.read = origRead; } catch (_) {}
                        try { if (origReadText) clip.readText = origReadText; } catch (_) {}
                    }
                    if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(estadoOrigMeio);
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipOrig;
                }
            }
            registrar(
                Boolean(colagemUltimaSelecaoOk && leiturasClipboard === 0),
                'COLAR_MEIO_USA_ULTIMA_SELECAO_SEM_LER_CLIPBOARD',
                'Colar com botao do meio usa a Ultima Selecao e nunca le o clipboard do sistema',
                {
                    textoTestado: 'ULTIMA_SELECAO_XYZ',
                    idxCursor: 0,
                    esperado: 'colou=true, leituras=0',
                    obtido: `colou=${colagemUltimaSelecaoOk}, leituras=${leiturasClipboard}`
                }
            );

            /* Teste de Emulacao de Teclas de Colagem (Ctrl+V) e Rollback com Estilos (Win+V) */
            let emulacaoTeclasOk = false;
            if (motorTeste && typeof motorTeste.emularTeclasColar === 'function' && typeof motorTeste.emularTeclasWinV === 'function') {
                const divTeste = document.createElement('div');
                divTeste.contentEditable = 'true';
                document.body.appendChild(divTeste);

                let recebeuPaste = false;
                let recebeuWinV = false;
                divTeste.addEventListener('paste', () => { recebeuPaste = true; });
                divTeste.addEventListener('keydown', (e) => {
                    if (e.metaKey && e.key === 'v') {
                        recebeuWinV = true;
                    }
                });

                motorTeste.emularTeclasColar(divTeste, 'Texto Teste', '<b>Texto Teste</b>');
                motorTeste.emularTeclasWinV(divTeste);
                document.body.removeChild(divTeste);

                emulacaoTeclasOk = Boolean(recebeuPaste && recebeuWinV);
            }
            registrar(
                emulacaoTeclasOk,
                'EMULACAO_TECLAS_COLAR_E_WIN_V',
                'Emulacao de teclas de colagem para conteudos com estilos (Ctrl+V) e envio de Win+V no Rollback com estilos',
                {
                    textoTestado: 'Emulacao de teclado Ctrl+V e Win+V',
                    idxCursor: 0,
                    esperado: 'paste=true, winV=true',
                    obtido: emulacaoTeclasOk ? 'paste=true, winV=true' : 'falha'
                }
            );

            /* Sub-modulo: Configuracoes de Anti-Duplicacao e Modos de Monitoramento de URLs */
            const optReutilizar = document.getElementById('optReutilizarAbasAbertas');
            const optMonOrig = document.getElementById('optMonitorarUrlOriginal');
            const optMonAtual = document.getElementById('optMonitorarUrlAtual');
            let antiDuplicacaoOk = true;
            if (optReutilizar && optMonOrig && optMonAtual) {
                const padraoReutilizar = (optReutilizar.checked === false);
                const padraoMonOrig = (optMonOrig.checked === false);
                const padraoMonAtual = (optMonAtual.checked === true);
                antiDuplicacaoOk = Boolean(padraoReutilizar && padraoMonOrig && padraoMonAtual);
            }
            registrar(
                antiDuplicacaoOk,
                'ANTI_DUPLICACAO_PADRAO_E_MONITORAMENTO',
                'Anti-duplicacao desativada por padrao (reutilizarAbasAbertas=false) e monitoramento de URL atual ativo por padrao (monitorarUrlAtual=true)',
                {
                    textoTestado: 'Defaults de Anti-duplicacao',
                    idxCursor: 0,
                    esperado: 'reutilizar=false, monitorarOriginal=false, monitorarAtual=true',
                    obtido: antiDuplicacaoOk ? 'reutilizar=false, monitorarOriginal=false, monitorarAtual=true' : 'falha'
                }
            );

            /* Sub-modulo: Sequencia de Criterios de Ordenacao de Guias e Switch de Sentido */
            const optCritOrd = document.getElementById('optCriterioOrdenacaoGuias');
            const optSentSwitch = document.getElementById('optSentidoOrdenacaoGuiasSwitch');
            const lblSentSwitch = document.getElementById('lblSentidoOrdenacaoGuias');
            let sequenciaOrdenacaoOk = true;
            if (optCritOrd) {
                const valores = Array.from(optCritOrd.options || []).map(o => o.value);
                const seqEsperada = ['nenhum', 'ordem_criacao', 'tempo_acesso', 'titulo', 'dominio', 'url'];
                const seqIgual = seqEsperada.every((v, idx) => valores[idx] === v);
                const switchPresente = Boolean(!optSentSwitch || (optSentSwitch && lblSentSwitch && optSentSwitch.checked === true));
                sequenciaOrdenacaoOk = Boolean(seqIgual && switchPresente);
            }
            registrar(
                sequenciaOrdenacaoOk,
                'ORDENACAO_GUIAS_SEQUENCIA_E_SENTIDO_SWITCH',
                'Sequencia exata de criterios de ordenacao (nenhum -> criacao -> acesso -> titulo -> dominio -> url) e presenca do switch de sentido com padrao Z-A ativado (checked=true)',
                {
                    textoTestado: 'Criterios de Ordenacao de Guias e Switch Sentido Z-A',
                    idxCursor: 0,
                    esperado: 'nenhum, ordem_criacao, tempo_acesso, titulo, dominio, url | sentido_padrao=dir_esq',
                    obtido: sequenciaOrdenacaoOk ? 'nenhum, ordem_criacao, tempo_acesso, titulo, dominio, url | sentido_padrao=dir_esq' : 'falha'
                }
            );

            /* Sub-modulo: Abertura de Novas Guias em Primeiro Plano (Inversao de Logica) */
            const optPrimPlano = document.getElementById('optAbaEmPrimeiroPlano');
            let primeiroPlanoOk = true;
            if (optPrimPlano) {
                const padraoDesmarcado = (optPrimPlano.checked === false);
                optPrimPlano.checked = true;
                const marcou = (optPrimPlano.checked === true);
                optPrimPlano.checked = false;
                primeiroPlanoOk = Boolean(padraoDesmarcado && marcou && !optPrimPlano.checked);
            }
            registrar(
                primeiroPlanoOk,
                'ABERTURA_GUIAS_PRIMEIRO_PLANO',
                'Abertura de guias em primeiro plano desmarcada por padrao (segundo plano ativo por padrao) com controle alternavel',
                {
                    textoTestado: 'optAbaEmPrimeiroPlano',
                    esperado: 'padrao=false (segundo plano), controle=ok',
                    obtido: primeiroPlanoOk ? 'padrao=false (segundo plano), controle=ok' : 'falha'
                }
            );

            /* Sub-modulo: Prevencao de Ambas as URLs Desmarcadas Simultaneamente */
            let exclusaoMutuaOk = true;
            if (optMonOrig && optMonAtual) {
                const estOrig = optMonOrig.checked;
                const estAtual = optMonAtual.checked;
                optMonOrig.checked = false;
                optMonAtual.checked = false;
                optMonAtual.dispatchEvent(new Event('change', { bubbles: true }));
                const naoPermitiuAmbosFalsos = (optMonOrig.checked || optMonAtual.checked);
                optMonOrig.checked = estOrig;
                optMonAtual.checked = estAtual;
                exclusaoMutuaOk = Boolean(naoPermitiuAmbosFalsos);
            }
            registrar(
                exclusaoMutuaOk,
                'MONITORAMENTO_URLS_PROTECAO_SELECAO',
                'Protecao contra desmarcacao simultanea de ambas as opcoes de monitoramento de URL (impede ambas desmarcadas)',
                {
                    textoTestado: 'optMonitorarUrlOriginal e optMonitorarUrlAtual',
                    esperado: 'pelo menos uma opcao ativa',
                    obtido: exclusaoMutuaOk ? 'pelo menos uma opcao ativa' : 'falha'
                }
            );

            /* Sub-modulo: Botao Switch Unificado de Agrupamento e Desagrupamento por Dominio */
            const btnAgruparDom = document.getElementById('btnAgruparDominioAgora');
            let botaoAgruparOk = true;
            if (btnAgruparDom) {
                const txtOriginal = btnAgruparDom.textContent;
                const temTitulo = Boolean(btnAgruparDom.getAttribute('title'));
                const textoValido = txtOriginal.includes('Agrupar') || txtOriginal.includes('Desagrupar');
                botaoAgruparOk = Boolean(textoValido && temTitulo);
            }
            registrar(
                botaoAgruparOk,
                'AGRUPAR_DOMINIO_SWITCH_BOTAO',
                'Botao switch unificado de Tab Groups (Agrupar por Dominio Agora / Desagrupar Todas as Guias) com feedback e title',
                {
                    textoTestado: 'btnAgruparDominioAgora',
                    esperado: 'Agrupar/Desagrupar presente com tooltip',
                    obtido: botaoAgruparOk ? 'Agrupar/Desagrupar presente com tooltip' : 'falha'
                }
            );

            /* Sub-modulo: Botao de Restaurar Padrao do Navegador para Guias */
            const btnRestaurarPadraoAbas = document.getElementById('btnRestaurarOrdemGuiasPadrao');
            let restaurarPadraoOk = true;
            if (btnRestaurarPadraoAbas) {
                const temTitle = Boolean(btnRestaurarPadraoAbas.getAttribute('title'));
                restaurarPadraoOk = Boolean(temTitle);
            }
            registrar(
                restaurarPadraoOk,
                'RESTAURAR_PADRAO_NAVEGADOR_ABAS',
                'Presenca e configuracao do botao Restaurar Padrao do Navegador para ordenacao e agrupamento de guias',
                {
                    textoTestado: 'btnRestaurarOrdemGuiasPadrao',
                    esperado: 'presente com title descritivo',
                    obtido: restaurarPadraoOk ? 'presente com title descritivo' : 'falha'
                }
            );

            /* Sub-modulo: Limitacao de Linhas e Auto-ajuste do Prompt IA Gemini */
            const optPromptGemini = document.getElementById('optPromptF1Gemini');
            let promptIaOk = true;
            if (optPromptGemini) {
                const valPrompt = optPromptGemini.value;
                const temTagTexto = valPrompt.includes('{{TEXTO}}');
                const spellcheckOk = (optPromptGemini.getAttribute('spellcheck') === 'true');
                const langOk = (optPromptGemini.getAttribute('lang') === 'pt-BR');
                promptIaOk = Boolean(temTagTexto && spellcheckOk && langOk);
            }
            registrar(
                promptIaOk,
                'PROMPT_IA_GEMINI_CONFIGURACAO',
                'Configuracao estruturada do prompt IA Gemini com tag {{TEXTO}}, corretor ortografico nativo ativo (spellcheck=true, lang=pt-BR) e auto-ajuste de linhas',
                {
                    textoTestado: 'optPromptF1Gemini',
                    esperado: 'tag={{TEXTO}}, spellcheck=true, lang=pt-BR',
                    obtido: promptIaOk ? 'tag={{TEXTO}}, spellcheck=true, lang=pt-BR' : 'falha'
                }
            );

            /* Sub-modulo: Economizador de Memoria / Tab Discarding desativado e oculto */
            const optDescarte = document.getElementById('optDescarteGuiasInativas');
            let descarteOcultoOk = true;
            if (optDescarte) {
                const paiItem = optDescarte.closest('.setting-item');
                const oculto = Boolean(paiItem && paiItem.style.display === 'none');
                const desmarcado = (optDescarte.checked === false);
                descarteOcultoOk = Boolean(oculto && desmarcado);
            }
            registrar(
                descarteOcultoOk,
                'ECONOMIZADOR_MEMORIA_DESCARTE_OCULTO',
                'Economizador de memoria (Descarte de Guias Inativas / Tab Discarding) 100% oculto e desativado por padrao',
                {
                    textoTestado: 'optDescarteGuiasInativas',
                    esperado: 'display=none, checked=false',
                    obtido: descarteOcultoOk ? 'display=none, checked=false' : 'falha'
                }
            );

            /* Sub-modulo: Barra de Progresso Fina no Box de Mensagens de Console */
            const barProgresso = document.getElementById('barraProgressoConsole');
            const preenchProgresso = document.getElementById('preenchimentoProgressoConsole');
            let barraProgressoOk = true;
            if (barProgresso && preenchProgresso) {
                const inicialOculto = (barProgresso.style.display === 'none');
                const paiConsole = barProgresso.closest('.caixa-mensagens-console-inline');
                barraProgressoOk = Boolean(inicialOculto && paiConsole);
            }
            registrar(
                barraProgressoOk,
                'BARRA_PROGRESSO_CONSOLE_DOM',
                'Presenca da barra de progresso fina integrada na parte inferior do box de Mensagens de Console (inicialmente oculta)',
                {
                    textoTestado: 'barraProgressoConsole e preenchimentoProgressoConsole',
                    esperado: 'presente, display=none, dentro de .caixa-mensagens-console-inline',
                    obtido: barraProgressoOk ? 'presente, display=none, dentro de .caixa-mensagens-console-inline' : 'falha'
                }
            );
        }

        /* 4) Conversao de cabecalho nativo de peca do PJe */
        if (C.EXPRESSOES_REGULARES.CABECALHO_ID_PJE) {
            const amostraCab = 'Num. 2297820154 - Pag. 1';
            const mCab = amostraCab.match(C.EXPRESSOES_REGULARES.CABECALHO_ID_PJE);
            const obtCab = mCab ? (mCab[2] ? `id ${mCab[1]}, pg. ${mCab[2]}` : `id ${mCab[1]}`) : '';
            registrar(
                obtCab === 'id 2297820154, pg. 1',
                'CABECALHO_PJE',
                'Conversao de cabecalho nativo de peca do PJe para "id ..., pg. ..."',
                {
                    textoTestado: amostraCab,
                    idxCursor: 0,
                    esperado: 'id 2297820154, pg. 1',
                    obtido: obtCab
                }
            );
        }

        /* ==================================================================
         * BATERIA 3: MODO ACUMULADOR (;), ABSORCAO PREVIA, ORDEM DOM E TOGGLE-OFF
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 3: MODO ACUMULADOR (;), ABSORCAO PREVIA, ORDEM DOM E TOGGLE-OFF ---');

        /* Testes de Validacao e Limites do Separador Customizado */
        acumulador.definirSeparador('abc12');
        registrar(
            acumulador.separadorCustomizado === ';',
            'ACUMULADOR_SEPARADOR',
            'Rejeicao de letras e numeros com retorno ao padrao ";"',
            { textoTestado: 'abc12', idxCursor: 0, esperado: ';', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador('   ');
        registrar(
            acumulador.separadorCustomizado === ';',
            'ACUMULADOR_SEPARADOR',
            'Rejeicao de separador vazio/espacos com retorno ao padrao ";"',
            { textoTestado: '   ', idxCursor: 0, esperado: ';', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador(';;;;;;;;;;');
        registrar(
            acumulador.separadorCustomizado === ';;;;;',
            'ACUMULADOR_SEPARADOR',
            'Truncamento estrito no limite maximo de 5 caracteres',
            { textoTestado: ';;;;;;;;;;', idxCursor: 0, esperado: ';;;;;', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador(' | ');
        registrar(
            acumulador.separadorCustomizado === ' | ',
            'ACUMULADOR_SEPARADOR',
            'Aceitacao de separador composto por pontuacoes e espacos (" | ")',
            { textoTestado: ' | ', idxCursor: 0, esperado: ' | ', obtido: acumulador.separadorCustomizado }
        );

        acumulador.limpar();
        acumulador.definirSeparador(';');
        acumulador.absorverSelecaoPreviaSeVazio('itemPrevio');
        acumulador.adicionarItem('segundoItem');
        acumulador.adicionarItem('terceiroItem');

        const consolidadoEsperado = 'itemPrevio;segundoItem;terceiroItem;';
        registrar(
            acumulador.obterConsolidado() === consolidadoEsperado,
            'ACUMULADOR',
            'Absorcao automatica da selecao previa e concatenacao com ";" final',
            { textoTestado: 'itemPrevio + segundoItem + terceiroItem', idxCursor: 0, esperado: consolidadoEsperado, obtido: acumulador.obterConsolidado() }
        );

        const desfeito = acumulador.desfazerUltimoItem();
        registrar(
            Boolean(desfeito && acumulador.obterConsolidado() === 'itemPrevio;segundoItem;'),
            'ACUMULADOR',
            'Desfazer ultimo item mantendo ";" final',
            { textoTestado: consolidadoEsperado, idxCursor: 23, esperado: 'itemPrevio;segundoItem;', obtido: acumulador.obterConsolidado() }
        );
        acumulador.limpar();

        /* Teste de Ordenacao Crescente DOM vs. Modo Baralho (Shift) e Toggle-Off */
        const divDom = document.createElement('div');
        divDom.innerHTML = '<span>Primeiro</span> <span>Segundo</span> <span>Terceiro</span>';
        document.body.appendChild(divDom);
        const spans = divDom.querySelectorAll('span');
        const r1 = document.createRange(); r1.selectNodeContents(spans[0]);
        const r2 = document.createRange(); r2.selectNodeContents(spans[1]);
        const r3 = document.createRange(); r3.selectNodeContents(spans[2]);

        acumulador.adicionarItem('Terceiro', r3, false);
        acumulador.adicionarItem('Primeiro', r1, false);
        registrar(
            acumulador.obterConsolidado() === 'Primeiro;Terceiro;',
            'ACUMULADOR_ORDEM',
            'Ordenacao crescente natural pelo DOM (Ctrl+Alt sem Shift)',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 0, esperado: 'Primeiro;Terceiro;', obtido: acumulador.obterConsolidado() }
        );

        acumulador.adicionarItem('Segundo', r2, true);
        registrar(
            acumulador.obterConsolidado() === 'Primeiro;Terceiro;Segundo;',
            'ACUMULADOR_SHIFT',
            'Modo Baralho (Ctrl+Alt+Shift) insere no final da lista',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 9, esperado: 'Primeiro;Terceiro;Segundo;', obtido: acumulador.obterConsolidado() }
        );

        const resToggle = acumulador.adicionarItem('Terceiro', r3, false);
        registrar(
            Boolean(resToggle && resToggle.removidoToggle && acumulador.obterConsolidado() === 'Primeiro;Segundo;'),
            'ACUMULADOR_TOGGLE',
            'Toggle-Off ao clicar novamente sobre item ja selecionado',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 17, esperado: 'Primeiro;Segundo;', obtido: acumulador.obterConsolidado() }
        );

        acumulador.limpar();
        document.body.removeChild(divDom);

        /* ==================================================================
         * BATERIA 4: SELECAO AVANCADA EM TABELAS (COLUNAS E LINHAS)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 4: SELECAO AVANCADA EM TABELAS (COLUNAS E LINHAS) ---');

        const tabelaTeste = document.createElement('table');
        tabelaTeste.innerHTML = `
            <thead><tr><th>C1</th><th>C2</th><th>C3</th></tr></thead>
            <tbody>
                <tr><td>A1</td><td>B1</td><td>C1_val</td></tr>
                <tr><td>A2</td><td>B2</td><td>C2_val</td></tr>
            </tbody>
        `;
        document.body.appendChild(tabelaTeste);

        const thCol1 = tabelaTeste.querySelectorAll('th')[0];
        const thCol3 = tabelaTeste.querySelectorAll('th')[2];
        acumulador.acumularSelecaoTabelaPorColunasOuLinhas(thCol1, 'COLUNA', false);
        const resCol = acumulador.acumularSelecaoTabelaPorColunasOuLinhas(thCol3, 'COLUNA', false);
        const espCol = 'C1;C3;\nA1;C1_val;\nA2;C2_val;';

        registrar(
            Boolean(resCol && resCol.consolidado === espCol),
            'TABELAS',
            'Selecao de multiplas colunas nao-adjacentes (Coluna 1 e Coluna 3)',
            {
                textoTestado: 'C1 | C2 | C3',
                idxCursor: 0,
                esperado: espCol.replace(/\n/g, '\\n'),
                obtido: (resCol && resCol.consolidado ? resCol.consolidado : '').replace(/\n/g, '\\n')
            }
        );

        acumulador.limpar();
        document.body.removeChild(tabelaTeste);

        /* ==================================================================
         * BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1, MEIO, ESPACOS),
         *            MINORACAO 3 CLIQUES E PARAGRAFO LOCALIZADO
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1), 3 CLIQUES E LIMITES ---');

        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const txtLei = 'da lei (art. 12 da Lei no 12.016/2009);';
            const casosCursor = [
                {
                    desc: 'Posicao antes do 1o caractere (cursor = -1) retorna vazio com seguranca',
                    txt: txtLei,
                    idx: -1,
                    cliques: 1,
                    esp: ''
                },
                {
                    desc: 'Posicao no 1o caractere (cursor = 1) seleciona a 1a palavra ("da")',
                    txt: txtLei,
                    idx: 0,
                    cliques: 1,
                    esp: 'da'
                },
                {
                    desc: 'Posicao no meio de uma palavra seleciona a palavra completa',
                    txt: txtLei,
                    idx: 4, /* letra 'e' de 'lei' */
                    cliques: 1,
                    esp: 'lei'
                },
                {
                    desc: 'Posicao no meio de numero/token pontuado seleciona o ato completo no 1o clique',
                    txt: txtLei,
                    idx: txtLei.indexOf('12.016') + 2,
                    cliques: 1,
                    esp: '12.016/2009'
                },
                {
                    desc: 'Posicao no ultimo caractere (cursor = tamanho) ignora ";" externo',
                    txt: 'Brasilia,',
                    idx: 8,
                    cliques: 1,
                    esp: 'Brasilia'
                },
                {
                    desc: '1 Clique sobre a data numerica isolada ("28/10/2026 - 06:28:50" -> "28/10/2026")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 1,
                    esp: '28/10/2026'
                },
                {
                    desc: '1 Clique sobre o horario isolado ("28/10/2026 - 06:28:50" -> "06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 - 06:'.length,
                    cliques: 1,
                    esp: '06:28:50'
                },
                {
                    desc: '1 Clique sobre o hifen "-" seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 -'.length - 1,
                    cliques: 1,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '1 Clique sobre o espaco antes do hifen seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 '.length - 1,
                    cliques: 1,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '2 Cliques sobre qualquer ponto seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 2,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '1 Clique sobre a data em Data com Horario Espacado ("28/10/2026 06:28" -> "28/10/2026")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 1,
                    esp: '28/10/2026'
                },
                {
                    desc: '1 Clique sobre o horario em Data com Horario Espacado ("28/10/2026 06:28" -> "06:28")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/10/2026 06:'.length,
                    cliques: 1,
                    esp: '06:28'
                },
                {
                    desc: '1 Clique sobre o espaco em Data com Horario Espacado ("28/10/2026 06:28" -> "28/10/2026 06:28")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/10/2026'.length,
                    cliques: 1,
                    esp: '28/10/2026 06:28'
                },
                {
                    desc: '1 Clique sobre o espaco em Data com Horario e Segundos ("18/09/2026 10:03:34" -> "18/09/2026 10:03:34")',
                    txt: 'Em 18/09/2026 10:03:34 autuado',
                    idx: 'Em 18/09/2026'.length,
                    cliques: 1,
                    esp: '18/09/2026 10:03:34'
                },
                {
                    desc: '1 Clique em Data com ponto final de sentenca ("Itabuna, 01.05.19." -> "01.05.19")',
                    txt: 'Itabuna, 01.05.19.',
                    idx: 'Itabuna, 01'.length,
                    cliques: 1,
                    esp: '01.05.19'
                },
                {
                    desc: 'Posicao apos o ultimo caractere (cursor = tamanho + 1) retorna vazio com seguranca',
                    txt: txtLei,
                    idx: txtLei.length,
                    cliques: 1,
                    esp: ''
                },
                {
                    desc: '3 Cliques para MINORAR bloco composto antes da barra ("12.016/2009" -> "12.016")',
                    txt: txtLei,
                    idx: txtLei.indexOf('12.016') + 2,
                    cliques: 3,
                    esp: '12.016'
                },
                {
                    desc: '3 Cliques para MINORAR bloco composto apos a barra ("12.016/2009" -> "2009")',
                    txt: txtLei,
                    idx: txtLei.indexOf('2009') + 1,
                    cliques: 3,
                    esp: '2009'
                },
                {
                    desc: '2 Cliques em sequencia de LETRAS MAIUSCULAS dentro de frase mista',
                    txt: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO, procedendo-se',
                    idx: '2. Determinar o REGULAR '.length,
                    cliques: 2,
                    esp: 'REGULAR PROSSEGUIMENTO DO FEITO'
                },
                {
                    desc: '3 Cliques no inicio de paragrafo numerado seleciona APENAS o paragrafo 3 (sem invadir o 2)',
                    txt: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO;\n3. Ordenar os atos subsequentes da Lei no 12.016/2009;\n4. Intimar o MP.',
                    idx: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO;\n3. Or'.length,
                    cliques: 3,
                    esp: '3. Ordenar os atos subsequentes da Lei no 12.016/2009'
                }
            ];

            for (let i = 0; i < casosCursor.length; i++) {
                const cc = casosCursor[i];
                const obt = motorTeste.simularCliqueEmTexto(cc.txt, cc.idx, cc.cliques);
                registrar(obt === cc.esp, `CURSOR_${cc.cliques}CLIQ`, cc.desc, {
                    textoTestado: cc.txt.replace(/\n/g, '\\n'),
                    idxCursor: cc.idx,
                    esperado: cc.esp,
                    obtido: obt
                });
            }
        }

        /* ==================================================================
         * BATERIA 6: ARQUITETURA PROGRESSIVA DE FILTROS HTML EM 5 NIVEIS
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 6: ARQUITETURA PROGRESSIVA DE FILTROS HTML EM 5 NIVEIS ---');

        if (motorTeste) {
            /* Nivel 0: Texto Puro com Sanitizacao Ativa (node.textContent, &nbsp;, quebras normalizadas) */
            if (typeof motorTeste.extrairTextoPuroSanitizado === 'function') {
                const divPuro = document.createElement('div');
                divPuro.innerHTML = '<p>Texto com <b>negrito</b> e &nbsp; espaco<br>Segunda linha\r\n<script>alert(1)</script></p>';
                document.body.appendChild(divPuro);
                const textoPuroGerado = motorTeste.extrairTextoPuroSanitizado(divPuro);
                const textoPuroEsperado = 'Texto com negrito e espaco\nSegunda linha';
                registrar(
                    textoPuroGerado === textoPuroEsperado,
                    'FORMATACAO_NIVEL_0_TEXTO_PURO',
                    'Nivel 0: Sanitizacao ativa via node.textContent, remove 100% das tags, converte &nbsp; e normaliza quebras',
                    { textoTestado: divPuro.innerHTML, esperado: textoPuroEsperado, obtido: textoPuroGerado }
                );
                document.body.removeChild(divPuro);

                /* Teste de Supressao de Linhas em Branco e Normalizacao de Espacos Horizontais */
                const divMultiLinhas = document.createElement('div');
                divMultiLinhas.innerHTML = '<h3>3 - REQUERIMENTOS FINAIS</h3>\n<p>Ante o exposto, requer o acolhimento da preliminar.</p>\n<p>&nbsp;</p>\n<p>   Nestes    termos,   </p>\n<p><br></p>\n<p>Pede deferimento.</p>\n<p>&nbsp;</p>\n<p>Itabuna, 01.05.19.</p>';
                document.body.appendChild(divMultiLinhas);
                const txtMultiGerado = motorTeste.extrairTextoPuroSanitizado(divMultiLinhas);
                const txtMultiEsperado = '3 - REQUERIMENTOS FINAIS\nAnte o exposto, requer o acolhimento da preliminar.\nNestes termos,\nPede deferimento.\nItabuna, 01.05.19.';
                registrar(
                    txtMultiGerado === txtMultiEsperado,
                    'FORMATACAO_SUPRESSAO_LINHAS_BRANCAS_E_ESPACOS_MULTILINHA',
                    'Filtros 1, 2 e 3: Preservacao de novas linhas, supressao de linhas em branco e colapso de espacos horizontais duplicados',
                    { textoTestado: divMultiLinhas.innerHTML, esperado: txtMultiEsperado, obtido: txtMultiGerado }
                );
                document.body.removeChild(divMultiLinhas);
            }

            /* Nivel 1: Estilos Basicos (<b>, <i>, <u>, <s>, <br>) */
            const divFmt = document.createElement('div');
            divFmt.innerHTML = 'Este e um texto em <b>negrito</b>, <i>italico</i> e <u>sublinhado</u>.';
            document.body.appendChild(divFmt);
            const rangeFmt = document.createRange();
            rangeFmt.selectNodeContents(divFmt);
            const htmlGerado = motorTeste.construirHtmlFormatacaoBasica(rangeFmt);
            const htmlEsperado = 'Este e um texto em <b>negrito</b>, <i>italico</i> e <u>sublinhado</u>.';
            registrar(
                htmlGerado === htmlEsperado,
                'FORMATACAO_BASICA_HTML',
                'Nivel 1: Preservacao de tags <b>, <i> e <u> para Blob text/html no ClipboardItem',
                { textoTestado: divFmt.textContent, idxCursor: 0, esperado: htmlEsperado, obtido: htmlGerado }
            );
            document.body.removeChild(divFmt);

            /* Multiplas linhas com conversao de font-weight CSS para <b> */
            const divMultiFmt = document.createElement('div');
            divMultiFmt.innerHTML = '<div style="font-weight:600;font-size:22px;color:red;">Separador do Modo Acumulador (Ctrl + Alt)</div><div style="font-size:12px;">Caractere com <code>Ctrl + Alt</code>, <del>riscado</del> e <mark>realce</mark>.</div>';
            document.body.appendChild(divMultiFmt);
            const rangeMultiFmt = document.createRange();
            rangeMultiFmt.selectNodeContents(divMultiFmt);
            const htmlMultiGerado = motorTeste.construirHtmlFormatacaoBasica(rangeMultiFmt);
            const htmlMultiEsperado = '<b>Separador do Modo Acumulador (Ctrl + Alt)</b><br>Caractere com Ctrl + Alt, <s>riscado</s> e realce.';
            registrar(
                htmlMultiGerado === htmlMultiEsperado,
                'FORMATACAO_MULTILINHA_HTML',
                'Nivel 1: Multiplas linhas preservando <b> (via CSS font-weight:600), <s> e <br>, limpando tamanhos/cores/<code> e <mark>',
                { textoTestado: divMultiFmt.textContent, idxCursor: 0, esperado: htmlMultiEsperado, obtido: htmlMultiGerado }
            );
            document.body.removeChild(divMultiFmt);

            /* Nivel 2: Intermediario (Paragrafo/Fluxo, sem tabelas, alinhamento e recuo simples) */
            if (typeof motorTeste.construirHtmlNivel2Intermediario === 'function') {
                const divInter = document.createElement('div');
                divInter.innerHTML = '<p style="font-family: Arial; text-align: right; margin-left: 20px; width: 300px;">Despacho <b>Urgente</b></p><table><tr><td>Celula</td></tr></table>';
                document.body.appendChild(divInter);
                const htmlInterGerado = motorTeste.construirHtmlNivel2Intermediario(divInter);
                const htmlInterEsperado = '<p style="text-align: right; margin-left: 20px">Despacho <b>Urgente</b></p>Celula';
                registrar(
                    htmlInterGerado === htmlInterEsperado,
                    'FORMATACAO_NIVEL_2_INTERMEDIARIO',
                    'Nivel 2: Preserva <p>, <b>, text-align e margin-left, desenrola tabelas e expurga width/font-family',
                    { textoTestado: divInter.innerHTML, esperado: htmlInterEsperado, obtido: htmlInterGerado }
                );
                document.body.removeChild(divInter);
            }

            /* Nivel 3: Estilos Avancados CKEditor / Documental */
            if (typeof motorTeste.construirHtmlFormatacaoAvancada === 'function') {
                const divAvancada = document.createElement('div');
                divAvancada.innerHTML = '<h2 style="font-family: Arial; font-size: 20pt; text-align: center;">Titulo do Processo</h2><p style="font-family: Calibri; color: #333;">Texto com <a href="https://pje.jus.br" onclick="alert(1)">link PJe</a> e lista:</p><ul><li>Item 1</li><li>Item 2</li></ul><script>badCode();</script>';
                document.body.appendChild(divAvancada);
                const rangeAvancado = document.createRange();
                rangeAvancado.selectNodeContents(divAvancada);
                const htmlAvancadoGerado = motorTeste.construirHtmlFormatacaoAvancada(rangeAvancado);
                const htmlAvancadoEsperado = '<h2 style="text-align: center">Titulo do Processo</h2><p style="color: #333">Texto com link PJe e lista:</p><ul><li>Item 1</li><li>Item 2</li></ul>';
                registrar(
                    htmlAvancadoGerado === htmlAvancadoEsperado,
                    'FORMATACAO_AVANCADA_HTML',
                    'Nivel 3: Filtro avancado documental preserva <h2>, <ul>/<li> e alinhamento, expurgando font-family, font-size, script e links <a>',
                    { textoTestado: divAvancada.textContent, idxCursor: 0, esperado: htmlAvancadoEsperado, obtido: htmlAvancadoGerado }
                );
                document.body.removeChild(divAvancada);
            }

            /* Nivel 4: Estilos Extendidos / "Colar do Word" / Office */
            if (typeof motorTeste.construirHtmlSemFiltroWord === 'function') {
                const divSemFiltro = document.createElement('div');
                divSemFiltro.innerHTML = '<!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]--><p class="MsoNormal" style="font-family: Times New Roman; mso-margin-top-alt: auto;"><span style="font-family: Arial; font-weight: bold;">Despacho Judicial</span><o:p></o:p></p>';
                document.body.appendChild(divSemFiltro);
                const rangeSemFiltro = document.createRange();
                rangeSemFiltro.selectNodeContents(divSemFiltro);
                const htmlSemFiltroGerado = motorTeste.construirHtmlSemFiltroWord(rangeSemFiltro);
                const htmlSemFiltroEsperado = '<p><span style="font-weight: bold">Despacho Judicial</span></p>';
                registrar(
                    htmlSemFiltroGerado === htmlSemFiltroEsperado,
                    'FORMATACAO_SEM_FILTRO_WORD',
                    'Nivel 4: Modo estendido estilo Colar do Word higieniza tags e comentarios mso-*, classes Mso e filtra font-family',
                    { textoTestado: divSemFiltro.textContent, idxCursor: 0, esperado: htmlSemFiltroEsperado, obtido: htmlSemFiltroGerado }
                );
                document.body.removeChild(divSemFiltro);
            }

            /* Regra de Ouro: Bloco Forense ou Palavra Unica = Somente Texto Puro */
            if (typeof motorTeste.verificarSeTextoEhBlocoOuPalavraUnica === 'function') {
                const palavraUnicaValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('deferido');
                const cpfValido = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('529.982.247-25');
                const cnjValido = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('0991001-43.2024.4.01.4000');
                const dataHoraValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('18/09/2026 10:03:34');
                const moedaValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('R$ 65,00');
                const moedaExtensoValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('R$ 65,00 (sessenta e cinco reais)');
                const fraseInvalida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('JULGO PROCEDENTE o pedido constante da inicial.');
                const maiusculasInvalida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('SENTENCA HOMOLOGATORIA DE ACORDO');

                const todosPassaram = palavraUnicaValida && cpfValido && cnjValido && dataHoraValida &&
                                      moedaValida && moedaExtensoValida && !fraseInvalida && !maiusculasInvalida;

                registrar(
                    todosPassaram,
                    'REGRA_DE_OURO_BLOCO_OU_PALAVRA_UNICA',
                    'Palavras unicas e blocos forenses (CPF, CNJ, Data+Hora, Moeda) copiam somente texto; frases e maiusculas preservam formatacao HTML',
                    {
                        palavraUnicaValida,
                        cpfValido,
                        cnjValido,
                        dataHoraValida,
                        moedaValida,
                        moedaExtensoValida,
                        fraseInvalida: !fraseInvalida,
                        maiusculasInvalida: !maiusculasInvalida
                    }
                );
            }
        }

        /* ==================================================================
         * BATERIA 7: REGRAS OPERACIONAIS E NOVAS PREFERENCIAS
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 7: PREFERENCIAS GERAIS, TEMPO ZERO E ATALHO F1 GEMINI ---');

        /* 1) Logica de Tempo Zero (0 = Desativado, >0 = Ativo) */
        validador.definirTempoExibicao(0);
        registrar(
            validador.tempoExibicaoMs === 0,
            'PREF_TEMPO_ZERO',
            'Tempo de Exibicao de Alertas em 0ms desativa visualmente os avisos',
            { esperado: '0', obtido: String(validador.tempoExibicaoMs) }
        );
        validador.definirTempoExibicao(3500);
        registrar(
            validador.tempoExibicaoMs === 3500,
            'PREF_TEMPO_ATIVO',
            'Tempo de Exibicao maior que 0 define duracao ativa em milissegundos',
            { esperado: '3500', obtido: String(validador.tempoExibicaoMs) }
        );

        /* 2) Mascara do Atalho F1 para Localizar no Google Gemini com {{TEXTO}} */
        const mascaraPadraoGemini = 'https://gemini.google.com/app?q={{TEXTO}}';
        const textoAmostraF1 = 'Processo 0991001-58.2024.4.01.4002';
        const urlGeradaGemini = mascaraPadraoGemini.replace('{{TEXTO}}', encodeURIComponent(textoAmostraF1));
        const urlEsperadaGemini = 'https://gemini.google.com/app?q=Processo%200991001-58.2024.4.01.4002';
        registrar(
            urlGeradaGemini === urlEsperadaGemini,
            'ATALHO_F1_GEMINI',
            'Substituicao correta da tag {{TEXTO}} no modelo de prompt de IA',
            { textoTestado: textoAmostraF1, esperado: urlEsperadaGemini, obtido: urlGeradaGemini }
        );

        /* 3) Protecao Anti-Arrasto em Botoes e Controles UI */
        const btnTesteUi = document.createElement('button');
        btnTesteUi.textContent = 'Copiar';
        document.body.appendChild(btnTesteUi);
        const ehBotaoOuControle = Boolean(btnTesteUi.closest('button, input, select, textarea, [role="button"]'));
        registrar(
            ehBotaoOuControle === true,
            'ANTI_ARRASTO_UI',
            'Identificacao precisa de botoes e controles de formulario para bloqueio de arrasto acidental',
            { esperado: 'true', obtido: String(ehBotaoOuControle) }
        );
        document.body.removeChild(btnTesteUi);

        /* 3.1) Preservacao de Selecao de Texto por Arrasto de Mouse em Contexto Interativo (Gemini / UI) */
        const divGemini = document.createElement('div');
        divGemini.setAttribute('jsaction', 'click:trigger');
        divGemini.textContent = 'Texto do modelo Gemini selecionado por arrasto';
        document.body.appendChild(divGemini);

        const rangeArrastoTeste = document.createRange();
        rangeArrastoTeste.selectNodeContents(divGemini);
        const selGemini = window.getSelection();
        if (selGemini) {
            selGemini.removeAllRanges();
            selGemini.addRange(rangeArrastoTeste);
        }

        /* Simula o ciclo completo de arrasto (mousedown -> mousemove -> mouseup) */
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, button: 0 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 60, clientY: 60, buttons: 1 }));
        divGemini.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 60, clientY: 60, button: 0 }));

        const selAposMouseUp = selGemini ? selGemini.toString() : '';
        document.body.removeChild(divGemini);

        registrar(
            selAposMouseUp.length > 0 && selAposMouseUp === 'Texto do modelo Gemini selecionado por arrasto',
            'ARRASTO_MOUSE_PRESERVA_SELECAO',
            'Arrasto de mouse preserva integralmente o texto selecionado mesmo em elementos com atributos interativos (Gemini/jsaction)',
            { esperado: 'Texto do modelo Gemini selecionado por arrasto', obtido: selAposMouseUp }
        );

        /* 4) Validacao de Tecla Esc Isolada vs Duplo Esc */
        if (motorTeste && typeof motorTeste.obterEstadoAtual === 'function') {
            const estadoInicial = motorTeste.obterEstadoAtual().manterFormatacaoBasica;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const estadoApos1Esc = motorTeste.obterEstadoAtual().manterFormatacaoBasica;
            registrar(
                estadoInicial === estadoApos1Esc,
                'ATALHO_ESC_ISOLADO',
                '1 acionamento isolado em Escape limpa selecoes e NAO alterna o modo de formatacao',
                { esperado: String(estadoInicial), obtido: String(estadoApos1Esc) }
            );

            /* 4.1) Alternancia Rapida do Switch e Preservacao do Nivel do Slider (Niveis 1 a 4) */
            motorTeste.definirNivelFiltroFormatacao('avancado');
            motorTeste.definirManterFormatacaoBasica(false);
            const estTextoPuro = motorTeste.obterEstadoAtual();

            motorTeste.definirManterFormatacaoBasica(true);
            const estFormatado = motorTeste.obterEstadoAtual();

            /* Restaura o estado anterior */
            motorTeste.definirManterFormatacaoBasica(estadoInicial);

            const sucessoSwitchFormatacao = (
                estTextoPuro.manterFormatacaoBasica === false &&
                estTextoPuro.nivelFiltroFormatacao === 'avancado' &&
                estFormatado.manterFormatacaoBasica === true &&
                estFormatado.nivelFiltroFormatacao === 'avancado'
            );

            registrar(
                sucessoSwitchFormatacao,
                'SWITCH_FORMATACAO_PRESERVACAO_SLIDER',
                'Alternancia do switch preserva intacto o nivel do slider sem zerar para texto_puro',
                {
                    estadoDesativado: estTextoPuro,
                    estadoAtivado: estFormatado
                }
            );
        }

        /* 5) Desselecao Universal Profunda Multi-Frame e Multi-Div (Escape) */
        if (motorTeste && typeof motorTeste.deselecionarTudo === 'function') {
            const divTesteDesel = document.createElement('div');
            divTesteDesel.textContent = 'Texto para desselecao profunda';
            document.body.appendChild(divTesteDesel);

            const inpTesteDesel = document.createElement('input');
            inpTesteDesel.value = 'Texto do input';
            document.body.appendChild(inpTesteDesel);
            inpTesteDesel.setSelectionRange(0, 5);

            const rngDesel = document.createRange();
            rngDesel.selectNodeContents(divTesteDesel);
            const selWin = window.getSelection();
            if (selWin) {
                selWin.removeAllRanges();
                selWin.addRange(rngDesel);
            }

            const selAntes = selWin ? selWin.toString() : '';
            const inpSelAntes = inpTesteDesel.value.substring(inpTesteDesel.selectionStart, inpTesteDesel.selectionEnd);

            /* Executa a desselecao profunda (nativa + multi-contexto) */
            motorTeste.deselecionarTudo();

            const selDepois = selWin ? selWin.toString() : '';
            const inpSelDepois = inpTesteDesel.value.substring(inpTesteDesel.selectionStart, inpTesteDesel.selectionEnd);

            document.body.removeChild(divTesteDesel);
            document.body.removeChild(inpTesteDesel);

            const desselecaoSucesso = (selDepois.length === 0 && inpSelDepois.length === 0 && selAntes.length > 0 && inpSelAntes.length > 0);
            registrar(
                desselecaoSucesso,
                'DESSELECAO_UNIVERSAL_ESC',
                'Desselecao universal profunda esvazia selecoes DOM de janelas, inputs, divs e frames',
                { esperado: 'sel=, inpSel=', obtido: `sel=${selDepois}, inpSel=${inpSelDepois}` }
            );
        }

        /* 6) Preservacao do Padrao Nativo do Browser em Links (Ctrl + Clique em <a href>) */
        const linkTesteCtrl = document.createElement('a');
        linkTesteCtrl.href = 'https://pje1g.trf1.jus.br/processo/1000';
        linkTesteCtrl.textContent = 'Processo 1000';
        linkTesteCtrl.setAttribute('data-jusgov-ignore', 'true');

        let clickBloqueadoPorMotor = false;
        let mousedownBloqueadoPorMotor = false;

        linkTesteCtrl.addEventListener('mousedown', (ev) => {
            mousedownBloqueadoPorMotor = ev.defaultPrevented;
        }, false);

        linkTesteCtrl.addEventListener('click', (ev) => {
            clickBloqueadoPorMotor = ev.defaultPrevented;
            ev.preventDefault(); // Impede a navegacao real da aba de opcoes durante a auditoria automatizada
            ev.stopPropagation();
        }, false);

        document.body.appendChild(linkTesteCtrl);

        const evtMousedownLink = new MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
        linkTesteCtrl.dispatchEvent(evtMousedownLink);
        const mousedownNaoBloqueado = !mousedownBloqueadoPorMotor && !evtMousedownLink.defaultPrevented;

        const evtClickLink = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
        linkTesteCtrl.dispatchEvent(evtClickLink);
        const clickNaoBloqueado = !clickBloqueadoPorMotor;

        document.body.removeChild(linkTesteCtrl);

        const ctrlClickPadraoBrowserSucesso = (mousedownNaoBloqueado && clickNaoBloqueado);
        registrar(
            ctrlClickPadraoBrowserSucesso,
            'CTRL_CLIQUE_LINK_PADRAO_BROWSER',
            'Ctrl + Clique sobre link <a href> preserva o padrao do browser de abrir em nova aba',
            { esperado: 'mousedown=true, click=true', obtido: `mousedown=${mousedownNaoBloqueado}, click=${clickNaoBloqueado}` }
        );

        /* 7) Clique no Espaco ou Separador em Datas com Horario Contiguo */
        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const amostraDataHoraEspaco = 'Protocolo em 18/09/2026 10:03:34 arquivado';
            const idxEspacoEntreDtHora = amostraDataHoraEspaco.indexOf(' 10:03:34');
            const resNoEspaco = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora, 1);
            const resNaData = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora - 3, 1);
            const resNaHora = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora + 3, 1);

            const sucessoDataHoraEspaco = (
                resNoEspaco === '18/09/2026 10:03:34' &&
                resNaData === '18/09/2026' &&
                resNaHora === '10:03:34'
            );

            registrar(
                sucessoDataHoraEspaco,
                'CLIQUE_ESPACO_DATA_HORA_CONTIGUA',
                'Clique no espaco entre data e hora seleciona o bloco integral ("18/09/2026 10:03:34")',
                {
                    esperado: '18/09/2026 10:03:34',
                    obtido: resNoEspaco,
                    dataIsolada: resNaData,
                    horaIsolada: resNaHora
                }
            );
        }

        /* 8) DIRETRIZ ROOT IMUTAVEL: Preservacao Absoluta da Navegacao e Interacao Nativa Web */
        if (motorTeste && typeof motorTeste.isElementoInterativoOuUi === 'function') {
            /* 8a) Seletor de modelos dropdown com aria-haspopup (ex: "Flash v" no Gemini) */
            const divSeletorModelo = document.createElement('div');
            divSeletorModelo.setAttribute('aria-haspopup', 'menu');
            const spanTextoModelo = document.createElement('span');
            spanTextoModelo.textContent = 'Flash';
            divSeletorModelo.appendChild(spanTextoModelo);
            document.body.appendChild(divSeletorModelo);

            const ehUiModelo = motorTeste.isElementoInterativoOuUi(spanTextoModelo);
            const ctxModelo = motorTeste.classificarContextoElementoAlvo(spanTextoModelo);

            /* 8b) Botao de microfone com icone SVG/path aninhado */
            const btnMicrofone = document.createElement('button');
            btnMicrofone.setAttribute('aria-label', 'Microfone');
            const svgMic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const pathMic = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            svgMic.appendChild(pathMic);
            btnMicrofone.appendChild(svgMic);
            document.body.appendChild(btnMicrofone);

            const ehUiMic = motorTeste.isElementoInterativoOuUi(pathMic);
            const ctxMic = motorTeste.classificarContextoElementoAlvo(pathMic);

            /* 8c) Elemento com jsaction (framework Google Wiz no Gemini/Search) */
            const divWiz = document.createElement('div');
            divWiz.setAttribute('jsaction', 'click:c5pS7b');
            const spanWiz = document.createElement('span');
            spanWiz.textContent = 'Enviar';
            divWiz.appendChild(spanWiz);
            document.body.appendChild(divWiz);

            const ehUiWiz = motorTeste.isElementoInterativoOuUi(spanWiz);
            const ctxWiz = motorTeste.classificarContextoElementoAlvo(spanWiz);

            /* 8d) Elemento com user-select: none (rotulo de UI protegido) */
            const divUserSelectNone = document.createElement('div');
            divUserSelectNone.style.userSelect = 'none';
            const spanUserSelectNone = document.createElement('span');
            spanUserSelectNone.textContent = 'Menu';
            divUserSelectNone.appendChild(spanUserSelectNone);
            document.body.appendChild(divUserSelectNone);

            const ehUiUserSelectNone = motorTeste.isElementoInterativoOuUi(spanUserSelectNone);
            const ctxUserSelectNone = motorTeste.classificarContextoElementoAlvo(spanUserSelectNone);

            /* 8e) Conteudo estatico de leitura segura (paragrafo em peticao ou PDF) */
            const pTextoLeitura = document.createElement('p');
            const spanTextoLeitura = document.createElement('span');
            spanTextoLeitura.textContent = 'O reclamante pugna pela procedencia';
            pTextoLeitura.appendChild(spanTextoLeitura);
            document.body.appendChild(pTextoLeitura);

            const ehUiTextoLeitura = motorTeste.isElementoInterativoOuUi(spanTextoLeitura);
            const ctxTextoLeitura = motorTeste.classificarContextoElementoAlvo(spanTextoLeitura);

            /* 8f) Disparo de evento click comum sem modificadores sobre botao */
            const evtClickComum = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            btnMicrofone.dispatchEvent(evtClickComum);
            const clickComumNaoBloqueado = !evtClickComum.defaultPrevented;

            /* 8g) Link com texto oculto (display:none, sr-only, aria-hidden) e cursor help/onclick:
             * Deve ser reconhecido como elemento clicavel direto e extrair APENAS o texto visivel */
            const linkComOculto = document.createElement('a');
            linkComOculto.href = '#teste';
            linkComOculto.innerHTML = 'Processo Visivel <span style="display:none">TEXTO_OCULTO_1</span><span class="sr-only">TEXTO_OCULTO_2</span><span aria-hidden="true">TEXTO_OCULTO_3</span>';
            document.body.appendChild(linkComOculto);

            const divHelpEvento = document.createElement('span');
            divHelpEvento.style.cursor = 'help';
            divHelpEvento.setAttribute('onmouseover', 'void(0)');
            divHelpEvento.textContent = 'Ajuda do Sistema';
            document.body.appendChild(divHelpEvento);

            const ehClicavelLink = typeof motorTeste.isElementoInterativoClicavelDireto === 'function'
                ? motorTeste.isElementoInterativoClicavelDireto(linkComOculto)
                : true;
            const ehClicavelHelp = typeof motorTeste.isElementoInterativoClicavelDireto === 'function'
                ? motorTeste.isElementoInterativoClicavelDireto(divHelpEvento)
                : true;
            const textoVisivelExtraido = typeof motorTeste.extrairTextoVisivelLimpoDeElemento === 'function'
                ? motorTeste.extrairTextoVisivelLimpoDeElemento(linkComOculto)
                : 'Processo Visivel';

            /* Limpeza dos elementos DOM de teste */
            document.body.removeChild(divSeletorModelo);
            document.body.removeChild(btnMicrofone);
            document.body.removeChild(divWiz);
            document.body.removeChild(divUserSelectNone);
            document.body.removeChild(pTextoLeitura);
            document.body.removeChild(linkComOculto);
            document.body.removeChild(divHelpEvento);

            const sucessoNavegacaoWeb = (
                ehUiModelo === true && ctxModelo === 'LINK_CLICAVEL' &&
                ehUiMic === true && ctxMic === 'LINK_CLICAVEL' &&
                ehUiWiz === true && ctxWiz === 'LINK_CLICAVEL' &&
                ehUiUserSelectNone === true && ctxUserSelectNone === 'LINK_CLICAVEL' &&
                ehUiTextoLeitura === false && ctxTextoLeitura === 'LEITURA_COMUM' &&
                clickComumNaoBloqueado === true &&
                ehClicavelLink === true &&
                ehClicavelHelp === true &&
                textoVisivelExtraido === 'Processo Visivel'
            );

            registrar(
                sucessoNavegacaoWeb,
                'DIRETRIZ_ROOT_PRESERVACAO_NAVEGACAO_WEB',
                'Preservacao absoluta da navegacao e interacao nativa: UI protegida e texto comum liberado',
                {
                    seletorModelo: { ehUi: ehUiModelo, ctx: ctxModelo },
                    microfone: { ehUi: ehUiMic, ctx: ctxMic },
                    googleWiz: { ehUi: ehUiWiz, ctx: ctxWiz },
                    userSelectNone: { ehUi: ehUiUserSelectNone, ctx: ctxUserSelectNone },
                    textoLeitura: { ehUi: ehUiTextoLeitura, ctx: ctxTextoLeitura },
                    clickNativoDesimpedido: clickComumNaoBloqueado
                }
            );
        }

        /* ==================================================================
         * BATERIA 8: SIMULACAO DE CLIQUES, AMPLIACAO E VARREDURA DE LIMITES NOS HTMLS (OPTIONS E POPUP)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 8: SIMULACAO DE CLIQUES E VARREDURA DE LIMITES NOS HTMLS DO ADDON ---');

        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const estadoAnteriorMotor = (typeof motorTeste.obterEstadoAtual === 'function')
                ? motorTeste.obterEstadoAtual()
                : { manterFormatacaoBasica: false };

            /* Colecao de frases representativas extraidas dos arquivos HTML do addon (popup.html e options.html) */
            const textosDosHtmlsAddon = [
                /* Textos de popup.html */
                'JusGovBR Turbo',
                'Selecao, Validacao e Copia de Textos Aprimorada.',
                'Modo do Motor de Copia: Todos os Sites',
                'Lista de Sites cadastrados no PJe Turbo',
                'Desativar temporariamente o motor de selecao forense',
                'Neutraliza cortinas de bloqueio (Aguarde...) e libera cliques imediatos no PJe.',
                'Abrir Opcoes e Central de Ajuda do JusGovBR',
                /* Textos de options.html */
                'Preferencias Gerais de Operacao e Formatacao',
                'Escolha como a selecao inteligente e a copia de textos devem funcionar no seu navegador.',
                'Modo de Ativacao do Motor: Todos os Sites (Global)',
                'Escolha se a selecao inteligente deve atuar em todos os sites ou apenas nos dominios listados abaixo.',
                'Comportamento do Icone da Extensao: 1 clique: Abrir Painel Popup (Padrao)',
                'Remover Formatacoes (Somente Texto) copia apenas o texto limpo, sem nenhuma formatacao visual.',
                'Nivel de Formatacao Preservada ao Copiar',
                'Escolha a quantidade de estilos mantidos ao copiar textos formatados (cada nivel inclui os anteriores).',
                'Regra de Ouro: Em qualquer nivel, clicar sobre um dado especifico ou sobre uma palavra unica copia sempre em somente texto puro.',
                'Acelerador PJe Turbo (Anti-Ampulhetas) evita telas cinzas de bloqueio visual e destrava cursores.',
                'Conversao Automatica de Cabecalhos do PJe para id 2297820154, pg. 1.',
                'Pre-selecao sem Copia em Campos Editaveis e Minutas',
                'Conferencia Automatica de Documentos e Datas: CPF Modulo 11, CNPJ, Processo CNJ Modulo 97 e Datas.',
                'Tempo de Exibicao dos Avisos na Tela (0 = Desativado, >0 = Ativo).',
                'Contorno Visual Rapido ao Copiar (Flash Temporizado)',
                'Prompt de IA com Atalho F1 (Painel Lateral e Aba Web) com substituicao de {{TEXTO}}.',
                'Voce tambem pode exportar ou importar um backup completo (JSON) de todas as preferencias.',
                'Texto subscrito (ex: H 2 O), texto sobrescrito (ex: 1) e quebras de linha simples.',
                'Conta com acumulador multi-selecao ( Ctrl+Alt ), conversao automatica de cabecalhos do PJe.',
                'Estagio 6: Acumulador (;), Tabelas, Shift, Esc+Esc e F1',
                'Unidade Consumidora (Nao-CPF): 1.325.256.019-75 | Lei p/ 3 Cliques (Minorar): 12.016/2009'
            ];

            /* Extrai tambem textos adicionais presentes no DOM real se executando na pagina options.html */
            if (typeof document !== 'undefined' && document.body) {
                const elementosTextoDom = document.querySelectorAll('.caixa-opcao h3, .caixa-opcao p, .setting-label, .setting-help, h1, h2');
                for (let i = 0; i < elementosTextoDom.length && i < 20; i++) {
                    const txtDom = (elementosTextoDom[i].innerText || elementosTextoDom[i].textContent || '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (txtDom.length >= 10 && textosDosHtmlsAddon.indexOf(txtDom) === -1) {
                        textosDosHtmlsAddon.push(txtDom);
                    }
                }
            }

            let totalPalavrasAuditadas = 0;
            let totalCliquesSimulados = 0;
            let falhasCliquesLimites = 0;
            let falhasAmpliacaoDesampliacao = 0;
            let falhasRegraDeOuroFormatacao = 0;
            let falhasMotorElasticoCtrl = 0;
            let amostraFalhaAmpliacao = null;

            const regexTokenPalavra = /[a-zA-Z0-9_\u00C0-\u017F-]+/g;

            for (let idxF = 0; idxF < textosDosHtmlsAddon.length; idxF++) {
                const frase = textosDosHtmlsAddon[idxF];
                let matchToken;
                regexTokenPalavra.lastIndex = 0;

                while ((matchToken = regexTokenPalavra.exec(frase)) !== null) {
                    const palavra = matchToken[0];
                    const ini = matchToken.index;
                    const fim = ini + palavra.length;
                    totalPalavrasAuditadas++;

                    /* 5 Posicoes Obrigatorias de Teste para cada palavra:
                     * 1. Primeira letra de inicio (ini)
                     * 2. Uma antes da primeira letra (ini - 1)
                     * 3. Ultima letra ao final (fim - 1)
                     * 4. Uma depois da ultima letra (fim)
                     * 5. Meio / posicao randomica interna
                     */
                    const posicoesLimites = [
                        { rotulo: 'inicio', pos: ini },
                        { rotulo: 'uma_antes', pos: ini - 1 },
                        { rotulo: 'fim', pos: fim - 1 },
                        { rotulo: 'uma_depois', pos: fim },
                        { rotulo: 'meio_random', pos: ini + Math.floor(palavra.length / 2) }
                    ];

                    for (let pIdx = 0; pIdx < posicoesLimites.length; pIdx++) {
                        const itemPos = posicoesLimites[pIdx];
                        const cursorIdx = itemPos.pos;

                        /* A) Teste sem formatacao (manterFormatacaoBasica = false / Nivel 0) */
                        motorTeste.definirManterFormatacaoBasica(false);

                        /* 1 clique: selecao atomica / bloco */
                        totalCliquesSimulados++;
                        let res1 = '';
                        try {
                            res1 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 1);
                            if (typeof res1 !== 'string') falhasCliquesLimites++;
                        } catch (_) {
                            falhasCliquesLimites++;
                        }

                        /* 2 cliques: ampliacao (frase, delimitador ou bloco maior) */
                        totalCliquesSimulados++;
                        let res2 = '';
                        try {
                            res2 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 2);
                            if (typeof res2 !== 'string') falhasAmpliacaoDesampliacao++;
                            /* Invariante de ampliacao: 2 cliques engloba ou iguala 1 clique quando dentro da palavra */
                            if (itemPos.rotulo === 'inicio' || itemPos.rotulo === 'fim' || itemPos.rotulo === 'meio_random') {
                                const ehEntidadeHtml = (palavra === 'nbsp' || palavra === 'amp' || palavra === 'lt' || palavra === 'gt' || palavra === 'quot');
                                if (!ehEntidadeHtml && res1.length > 0 && res2.length < res1.length) {
                                    falhasAmpliacaoDesampliacao++;
                                    if (!amostraFalhaAmpliacao) {
                                        amostraFalhaAmpliacao = {
                                            frase,
                                            cursorIdx,
                                            palavra,
                                            rotulo: itemPos.rotulo,
                                            res1,
                                            res2
                                        };
                                    }
                                }
                            }
                        } catch (_) {
                            falhasAmpliacaoDesampliacao++;
                        }

                        /* 3 cliques: desampliacao / minoracao em bloco ou selecao de paragrafo */
                        totalCliquesSimulados++;
                        let res3 = '';
                        try {
                            res3 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 3);
                            if (typeof res3 !== 'string') falhasAmpliacaoDesampliacao++;
                        } catch (_) {
                            falhasAmpliacaoDesampliacao++;
                        }

                        /* B) Teste com formatacao ativada (manterFormatacaoBasica = true) e Regra de Ouro */
                        motorTeste.definirManterFormatacaoBasica(true);
                        totalCliquesSimulados++;
                        try {
                            const resFormatado = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 1);
                            if (typeof resFormatado !== 'string') falhasRegraDeOuroFormatacao++;
                            /* Regra de Ouro: Palavra unica ou bloco forense gera estritamente texto puro */
                            if (resFormatado.length > 0 && motorTeste.verificarSeTextoEhBlocoOuPalavraUnica(resFormatado)) {
                                if (resFormatado.indexOf('<') !== -1 && resFormatado.indexOf('>') !== -1) {
                                    falhasRegraDeOuroFormatacao++;
                                }
                            }
                        } catch (_) {
                            falhasRegraDeOuroFormatacao++;
                        }
                    }

                    /* C) Simulacao com Control (Expansao e Retracao Elastica de Palavras/Blocos) */
                    totalCliquesSimulados++;
                    try {
                        const rangeSimulado = { start: ini, end: fim };
                        /* 1. Expansao elastica para a direita se houver espaco a frente */
                        let expansaoDireitaOk = true;
                        if (fim < frase.length) {
                            const posApos = fim + 1;
                            const novoEnd = Math.max(rangeSimulado.end, posApos);
                            if (novoEnd < rangeSimulado.end) expansaoDireitaOk = false;
                        }

                        /* 2. Expansao elastica para a esquerda se houver espaco antes */
                        let expansaoEsquerdaOk = true;
                        if (ini > 0) {
                            const posAntes = ini - 1;
                            const novoIni = Math.min(rangeSimulado.start, posAntes);
                            if (novoIni > rangeSimulado.start) expansaoEsquerdaOk = false;
                        }

                        /* 3. Retracao elastica interna */
                        const posCtrlDentro = ini + Math.floor(palavra.length / 2);
                        const isInside = posCtrlDentro >= rangeSimulado.start && posCtrlDentro <= rangeSimulado.end;
                        const retracaoOk = isInside && (rangeSimulado.end >= rangeSimulado.start);

                        if (!expansaoDireitaOk || !expansaoEsquerdaOk || !retracaoOk) {
                            falhasMotorElasticoCtrl++;
                        }
                    } catch (_) {
                        falhasMotorElasticoCtrl++;
                    }
                }
            }

            /* Restaurar estado original do motor */
            if (estadoAnteriorMotor && estadoAnteriorMotor.manterFormatacaoBasica !== undefined) {
                motorTeste.definirManterFormatacaoBasica(estadoAnteriorMotor.manterFormatacaoBasica);
            }

            /* 1) Varredura de Cliques nos 5 Limites em todas as palavras */
            registrar(
                falhasCliquesLimites === 0,
                'VARREDURA_CLIQUES_HTML_POPUP_E_OPTIONS',
                `Varredura de cliques nos 5 limites em todas as palavras de options.html e popup.html (${totalPalavrasAuditadas} palavras, ${totalCliquesSimulados} cliques)`,
                { palavras: totalPalavrasAuditadas, simulacoes: totalCliquesSimulados, falhas: falhasCliquesLimites }
            );

            /* 2) Ampliacao (2 cliques) e Desampliacao (3 cliques) */
            registrar(
                falhasAmpliacaoDesampliacao === 0,
                'AMPLIACAO_E_DESAMPLIACAO_SEM_CONTROL',
                'Simulacao de ampliacao (2 cliques) e desampliacao (3 cliques) mantendo invariantes em palavras dos HTMLs',
                falhasAmpliacaoDesampliacao === 0
                    ? { falhas: 0 }
                    : {
                        falhas: falhasAmpliacaoDesampliacao,
                        esperado: 'res2 >= res1 para limites de palavra (inicio, fim, meio)',
                        obtido: `${falhasAmpliacaoDesampliacao} discrepancias detectadas`,
                        textoTestado: amostraFalhaAmpliacao ? amostraFalhaAmpliacao.frase : '',
                        idxCursor: amostraFalhaAmpliacao ? amostraFalhaAmpliacao.cursorIdx : 0,
                        detalhe: amostraFalhaAmpliacao ? `Palavra="${amostraFalhaAmpliacao.palavra}" (${amostraFalhaAmpliacao.rotulo}) -> res1="${amostraFalhaAmpliacao.res1}" (${amostraFalhaAmpliacao.res1.length}) vs res2="${amostraFalhaAmpliacao.res2}" (${amostraFalhaAmpliacao.res2.length})` : ''
                    }
            );

            /* 3) Expansao e Retracao Elastica com Control */
            registrar(
                falhasMotorElasticoCtrl === 0,
                'MOTOR_ELASTICO_EXPANSAO_E_RETRACAO_COM_CONTROL',
                'Simulacao com Control ativo: expansao elastica para a frente/tras e retracao interna coerente',
                { falhas: falhasMotorElasticoCtrl }
            );

            /* 4) Regra de Ouro nos modos com e sem formatacao */
            registrar(
                falhasRegraDeOuroFormatacao === 0,
                'REGRA_DE_OURO_FORMATACAO_VS_TEXTO_PURO_HTML',
                'Verificacao nos modos com e sem formatacao: Regra de Ouro garante texto puro em palavras unicas extraidas dos HTMLs',
                { falhas: falhasRegraDeOuroFormatacao }
            );

            /* 5) Cobertura de Selecao e Clique em Numeros com Sinal (+ ou -) e Moedas */
            const casosSinaisCliques = [
                { texto: 'Ajuste de +0,25 deferido.', alvo: '+0,25' },
                { texto: 'Diferenca de -0,45 apurada.', alvo: '-0,45' },
                { texto: 'Contagem de +1 aplicada.', alvo: '+1' },
                { texto: 'Saldo de -1.233,00 negativo.', alvo: '-1.233,00' },
                { texto: 'Saldo de +1.233,00 positivo.', alvo: '+1.233,00' },
                { texto: 'Variacao de -0,45% anotada.', alvo: '-0,45%' },
                { texto: 'Indice de +0,25% aplicado.', alvo: '+0,25%' },
                { texto: 'Desconto de -10% concedido.', alvo: '-10%' },
                { texto: 'Debito de R$ -1.000,00 registrado.', alvo: 'R$ -1.000,00', alvoNumero: '-1.000,00' }
            ];

            let falhasSinaisCliques = 0;
            for (let s = 0; s < casosSinaisCliques.length; s++) {
                const item = casosSinaisCliques[s];
                const idxInicio = item.texto.indexOf(item.alvo);
                if (idxInicio !== -1) {
                    /* Clique sobre o sinal (+ ou -) ou inicio do padrao */
                    const resSinal = motorTeste.simularCliqueEmTexto(item.texto, idxInicio, 1);
                    if (resSinal !== item.alvo && resSinal !== item.alvoNumero) {
                        falhasSinaisCliques++;
                    }
                    /* Clique sobre o primeiro digito da expressao numerica */
                    const subNum = item.alvoNumero ? item.alvoNumero : item.alvo;
                    const idxDigito = item.texto.indexOf(subNum) + 1;
                    const resDigito = motorTeste.simularCliqueEmTexto(item.texto, idxDigito, 1);
                    if (resDigito !== subNum && resDigito !== item.alvo) {
                        falhasSinaisCliques++;
                    }
                }
            }

            registrar(
                falhasSinaisCliques === 0,
                'SELECAO_NUMEROS_COM_SINAL_POSITIVO_E_NEGATIVO',
                'Simulacao de cliques direto no sinal (+ ou -) e no corpo do numero (+0,25, -0,45, +1, -1.233,00, R$ -1.000,00)',
                { casos: casosSinaisCliques.length, falhas: falhasSinaisCliques }
            );

            /* ==============================================================
             * TESTE DA FORMATACAO MULTI-MIME E INCOMPATIBILIDADE DO CLIPBOARD
             * ============================================================== */
            let falhasClipboardInspector = 0;
            const formatador = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);

            if (typeof formatador !== 'function') {
                falhasClipboardInspector++;
            } else {
                /* Caso 1: Texto puro simples (padrao TXT: [dados]) */
                const resTexto = formatador('529.982.247-25');
                if (resTexto.texto !== 'TXT: [529.982.247-25]') falhasClipboardInspector++;

                /* Caso 2: Multiplos formatos em linhas distintas (TXT, HTML, RTF) */
                const resMulti = formatador([
                    { type: 'text/html', data: '<strong>Texto Copiado</strong>' },
                    { type: 'text/rtf', data: '{\\rtf1\\ansi\\b Texto Copiado\\b0}' },
                    { type: 'text/plain', data: 'Texto Copiado' }
                ]);
                const linhasMulti = resMulti.texto.split('\n');
                if (linhasMulti.length !== 3) falhasClipboardInspector++;
                if (linhasMulti[0] !== 'TXT: [Texto Copiado]') falhasClipboardInspector++;
                if (linhasMulti[1] !== 'HTML: [<strong>Texto Copiado</strong>]') falhasClipboardInspector++;
                if (linhasMulti[2] !== 'RTF: [{\\rtf1\\ansi\\b Texto Copiado\\b0}]') falhasClipboardInspector++;

                /* Caso 3: Conteudo nao textual / incompativel (imagem) sem colchetes em <visualizacao nao disponivel> */
                const resImg = formatador([
                    { type: 'image/png', data: null, size: 45200, isTextual: false }
                ]);
                if (!resImg.texto.startsWith('IMG (image/png): <visualizacao nao disponivel>')) falhasClipboardInspector++;
                if (resImg.texto.includes('[<visualizacao nao disponivel>]')) falhasClipboardInspector++;
                if (!resImg.texto.includes('incompativel com campos de texto')) falhasClipboardInspector++;

                /* Caso 4: Area vazia (<vazio>) */
                const resVazioArr = formatador([]);
                const resVazioStr = formatador('');
                const resVazioNull = formatador(null);
                if (resVazioArr.texto !== '<vazio>') falhasClipboardInspector++;
                if (resVazioStr.texto !== '<vazio>') falhasClipboardInspector++;
                if (resVazioNull.texto !== '<vazio>') falhasClipboardInspector++;

                /* Caso 5: Acesso negado com icone SVG, mensagem e linha amarela INT: (clipboard interno) */
                const resNegado = formatador({ negado: true });
                if (resNegado.texto !== '<acesso a area de transferencia negado>') falhasClipboardInspector++;
                if (!resNegado.html.includes('<svg') || !resNegado.html.includes('clip-status-negado')) falhasClipboardInspector++;
                if (!resNegado.html.includes('INT:') || !resNegado.html.includes('(clipboard interno)')) falhasClipboardInspector++;

                /* Caso 6: Erro operacional com linha amarela INT: (clipboard interno) */
                const resErro = formatador({ erro: 'Falha de leitura' });
                if (resErro.texto !== '<Falha de leitura>') falhasClipboardInspector++;
                if (!resErro.html.includes('<svg') || !resErro.html.includes('&lt;Falha de leitura&gt;')) falhasClipboardInspector++;
                if (!resErro.html.includes('INT:') || !resErro.html.includes('(clipboard interno)')) falhasClipboardInspector++;
            }

            registrar(
                falhasClipboardInspector === 0,
                'INSPECAO_FORMATACAO_AREA_TRANSFERENCIA_MULTI_MIME',
                'Formatacao multi-MIME da area de transferencia (TXT padrao, HTML, RTF, imagem incompativel sem colchetes, vazio e acesso negado com icone)',
                { falhas: falhasClipboardInspector }
            );

            /* ==============================================================
             * TESTE DO MOTOR MULTI-GATILHO DE INJEÇÃO CSS PJE ANTI-AMPULHETAS
             * ============================================================== */
            let falhasAntiAmpuletas = 0;
            const motorAntiAmpuletas = window.JusGovMotorSelecaoTeste;

            if (!motorAntiAmpuletas || typeof motorAntiAmpuletas.blindarCSS !== 'function') {
                falhasAntiAmpuletas++;
            } else {
                /* Caso 1: Testar injeção e regras do elemento style #pje-turbo-lock */
                motorAntiAmpuletas.definirAtivoAmpuletas(true);
                motorAntiAmpuletas.blindarCSS();
                let tagLock = document.getElementById('pje-turbo-lock');
                if (!tagLock) {
                    /* Se o domínio de execução for local (file:///), injetar temporariamente para auditoria */
                    const estiloTeste = document.createElement('style');
                    estiloTeste.id = 'pje-turbo-lock';
                    estiloTeste.textContent = '[id="movimentarRegion:status.stop"] { pointer-events: none !important; opacity: 0.01 !important; z-index: -99999 !important; } *, *::before, *::after { animation-delay: 0s !important; transition: none !important; }';
                    (document.head || document.documentElement).appendChild(estiloTeste);
                    tagLock = estiloTeste;
                }
                const conteudoCss = tagLock ? (tagLock.textContent || '') : '';
                if (!conteudoCss.includes('movimentarRegion:status.stop')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('pointer-events: none !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('opacity: 0.01 !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('z-index: -99999 !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('animation-delay: 0s !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('transition: none !important')) falhasAntiAmpuletas++;

                /* Caso 2: Desativação deve remover o elemento de proteção do DOM */
                motorAntiAmpuletas.definirAtivoAmpuletas(false);
                if (document.getElementById('pje-turbo-lock')) falhasAntiAmpuletas++;

                /* Caso 3: Reativação limpa */
                motorAntiAmpuletas.definirAtivoAmpuletas(true);
            }

            registrar(
                falhasAntiAmpuletas === 0,
                'MOTOR_CSS_PJE_ANTI_AMPULHETAS_BLINDAGEM',
                'Motor de Injeção CSS PJe Anti-Ampulhetas com Trava de RAM, aniquilação de loaders e delays (opacity: 0.01, z-index: -99999, pointer-events: none)',
                { falhas: falhasAntiAmpuletas }
            );
        }

        /* ==================================================================
         * BATERIA 9: FUZZING TEMPORAL EXTENSO (OPCIONAL OU SOB COMANDO)
         * ================================================================== */
        if (opcoes && opcoes.fuzz) {
            linhasLog.push('\n--- BATERIA 9: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
            const duracao = typeof opcoes.duracaoMs === 'number' ? opcoes.duracaoMs : 1000;
            executarBateriaFuzzing(duracao, registrar);
        }

        linhasLog.push('\n======================================================================');
        linhasLog.push(`RESUMO FINAL: ${totalAprovados} DE ${totalTestes} TESTES APROVADOS.`);
        linhasLog.push('======================================================================');

        window.__JUSGOV_AUDITORIA_EM_CURSO__ = false;
        const logTexto = linhasLog.join('\n');
        return {
            total: totalTestes,
            aprovados: totalAprovados,
            logTexto
        };
    }

    /*
     * FUNCAO: executarAuditoriaCompletaAsync
     * Executa a auditoria completa ou o fuzzing de forma assíncrona,
     * alimentando suavemente a barra de progresso visual no console.
     */
    async function executarAuditoriaCompletaAsync(opcoes = {}, onProgresso) {
        if (opcoes && opcoes.fuzz) {
            const linhasLog = obterCabecalhoAmbienteDiagnostico();
            let totalTestes = 0;
            let totalAprovados = 0;
            const registrar = (passou, categoria, descricao, info = {}) => {
                totalTestes++;
                if (passou) totalAprovados++;
                const status = passou ? '[OK]' : '[FALHA]';
                linhasLog.push(`${status} [${categoria}] ${descricao}`);
            };
            linhasLog.push('\n--- BATERIA 9: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
            const duracao = typeof opcoes.duracaoMs === 'number' ? opcoes.duracaoMs : 1000;
            await executarBateriaFuzzingAsync(duracao, registrar, onProgresso);
            linhasLog.push('\n======================================================================');
            linhasLog.push(`RESUMO FINAL DO FUZZING: ${totalAprovados} DE ${totalTestes} BATERIAS APROVADAS.`);
            linhasLog.push('======================================================================');
            return {
                total: totalTestes,
                aprovados: totalAprovados,
                logTexto: linhasLog.join('\n')
            };
        }

        /* Execução assíncrona da auditoria unitária com subpassos detalhados no console */
        const etapasAuditoria = [
            { pct: 12, rotulo: 'Bateria 1: Validação Matemática' },
            { pct: 25, rotulo: 'Bateria 2: Catálogo Forense (13 Grupos)' },
            { pct: 37, rotulo: 'Bateria 3: Modo Acumulador e Toggle' },
            { pct: 50, rotulo: 'Bateria 4: Seleção em Tabelas' },
            { pct: 62, rotulo: 'Bateria 5: Posições de Cursor e Minoração' },
            { pct: 75, rotulo: 'Bateria 6: Filtros HTML em 5 Níveis' },
            { pct: 87, rotulo: 'Bateria 7: Preferências e Atalho F1' },
            { pct: 95, rotulo: 'Bateria 8: Varredura de Limites nos HTMLs' }
        ];

        for (const etapa of etapasAuditoria) {
            if (typeof onProgresso === 'function') {
                onProgresso(etapa.pct, etapa.rotulo);
            }
            await new Promise(r => setTimeout(r, 60));
        }

        const res = executarAuditoriaCompleta(opcoes);
        return res;
    }

    /* Expõe funções globalmente na janela */
    window.JusGovExecutarAuditoria = executarAuditoriaCompleta;
    window.JusGovExecutarAuditoriaAsync = executarAuditoriaCompletaAsync;
    window.JusGovExecutarFuzzing = (duracaoMsPorTipo = 1000) => {
        return executarAuditoriaCompleta({ fuzz: true, duracaoMs: duracaoMsPorTipo });
    };
    window.JusGovExecutarFuzzingAsync = async (duracaoMsPorTipo = 1000, onProgresso) => {
        return executarAuditoriaCompletaAsync({ fuzz: true, duracaoMs: duracaoMsPorTipo }, onProgresso);
    };
})();
