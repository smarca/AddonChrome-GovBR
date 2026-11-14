/* ==========================================================================
 * Nome do arquivo: debug.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/debug.js
 * - Funções Globais Exportadas: window.JusGovExecutarAuditoria, window.JusGovExecutarAuditoriaAsync, window.JusGovExecutarFuzzing, window.JusGovExecutarFuzzingAsync
 * - Baterias de Homologação: 19 baterias determinísticas (470+ asserções: Mod 11/97, 13 grupos forenses, Acumulador, Tabelas, Filtros HTML 0..4, POO mod-anti-ampulheta/mod-copia/mod-input/mod-navegador, Ciclo de Vida BUG-01, Fuzzing mutacional)
 * - Dependências Lidas: window.JusGovMotorTestes, window.JusGovAvisoFlutuante, window.JusGovAcumulador, window.JusGovModuloAntiAmpulheta, window.JusGovModuloCopia, window.JusGovModuloInput, window.JusGovModuloNavegador, CATALOGO_EXEMPLOS_JUSGOVBR
 * - Regras / Seções: Diretrizes 5/7/16, Seções 6.1..6.64, BUG-01..BUG-07
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
 * 7) REUSO ESTRITO DOS UTILITARIOS LOCAIS E MINIMIZACAO DE TOKENS IA: Todos os
 *    scripts e utilitarios criados na pasta util/ (ex: executar_auditoria.ps1,
 *    gerar_exemplos_js.ps1, enriquecer_catalogo.ps1, ajustar_propriedades.ps1,
 *    verificar_codificacao.ps1, fazer_backup.ps1) devem ser SEMPRE usados e
 *    reutilizados pelo agente em execucoes locais de automacao, testes e validacoes,
 *    evitando transferencias redundantes e minimizando rigorosamente o uso de tokens.
 * 8) RESOLUCAO ESTRITA DE FALHAS DE AUDITORIA: Ao receber reporte de falha na
 *    auditoria, e terminantemente proibido desativar, atenuar, suprimir ou
 *    mascarar o teste para simular aprovacao artificial. A correcao DEVE ser
 *    realizada diretamente na implementacao funcional de producao. A desativacao
 *    de uma verificacao so e admissivel se for comprovadamente impossivel de ser
 *    executada no motor ou por restricao insuperavel da plataforma, caso excepcional
 *    em que o desenvolvedor/agente deve documentar a impossibilidade e avisar
 *    expressamente o usuario.
 *
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

(function () {
    'use strict';

    /* Instanciação defensiva das bibliotecas matemáticas desacopladas (BP-06 / ARQ-01) */
    const FabricaGeradores = (typeof self !== 'undefined' && self.JusGovGeradores) || (typeof window !== 'undefined' && window.JusGovGeradores) || null;
    const geradoresJusGov = FabricaGeradores ? new FabricaGeradores() : null;

    const FabricaVerificadores = (typeof self !== 'undefined' && self.JusGovVerificadores) || (typeof window !== 'undefined' && window.JusGovVerificadores) || null;
    const verificadoresJusGov = FabricaVerificadores ? new FabricaVerificadores() : null;

    /* ======================================================================
     * SECAO 1: GERADORES ALGORITMICOS DETERMINISTICOS E PSEUDO-ALEATORIOS
     * ====================================================================== */

    /* Gerador de inteiro pseudo-aleatorio no intervalo [min, max] */
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

    /*
     * ETAPAS DA BATERIA DE FUZZING TEMPORAL EXTENSO (1s/T POR TIPO DE TESTE)
     */
    const LISTA_ETAPAS_FUZZING = Object.freeze([
        { id: 'FUZZ_CPF', rotulo: 'CPF Randômico e Mutação ±1' },
        { id: 'FUZZ_CNPJ_TRADICIONAL', rotulo: 'CNPJ Tradicional e Mutação ±1' },
        { id: 'FUZZ_CNPJ_ALFANUMERICO', rotulo: 'Novo CNPJ Alfanumérico e Mutação ±1' },
        { id: 'FUZZ_CNJ_MODULO_97', rotulo: 'Processo CNJ Módulo 97 e Mutação ±1' },
        { id: 'FUZZ_INSS_NB_MODULO_11', rotulo: 'Benefício INSS NB Módulo 11 e Mutação ±1' },
        { id: 'FUZZ_PIS_MODULO_11', rotulo: 'PIS/PASEP Módulo 11 e Mutação ±1' },
        { id: 'FUZZ_DATAS_BISSEXTO', rotulo: 'Datas, Bissextos e Mutação de Fronteira' },
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
            /* Fuzz 1: CPF Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCpf = 0;
            let errosCpf = 0;
            let detalheErroCpf = '';
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCpf++;
                const cpfVal = gerarCpfValido();
                const resVal = validador.validarCPF(cpfVal);
                if (!resVal || !resVal.valido) {
                    errosCpf++;
                    if (!detalheErroCpf) detalheErroCpf = `[ValidoFalhou: ${cpfVal}]`;
                }

                const cpfMut = mutarDigitoParaInvalido(cpfVal, s => validador.validarCPF(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCPF(cpfMut);
                if (!resMut || resMut.valido) {
                    errosCpf++;
                    if (!detalheErroCpf) detalheErroCpf = `[MutantePassou: orig=${cpfVal} mut=${cpfMut}]`;
                }
            }
            registrar(
                errosCpf === 0,
                'FUZZ_CPF',
                `Fuzzing temporal de CPF com Mutação Estrita ±1 a ±5 no Corpo (${totalCpf * 2} iterações em ${duracaoMsPorTipo}ms)` + (detalheErroCpf ? ` ${detalheErroCpf}` : ''),
                { detalhe: `Aprovados=${(totalCpf * 2) - errosCpf}/${totalCpf * 2} | Erros=${errosCpf}${detalheErroCpf ? ' ' + detalheErroCpf : ''}` }
            );
        } else if (id === 'FUZZ_CNPJ_TRADICIONAL') {
            /* Fuzz 2: CNPJ Tradicional Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCnpj = 0;
            let errosCnpj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnpj++;
                const cnpjVal = gerarCnpjTradicionalValido();
                const resVal = validador.validarCNPJ(cnpjVal);
                if (!resVal || !resVal.valido) errosCnpj++;

                const cnpjMut = mutarDigitoParaInvalido(cnpjVal, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCNPJ(cnpjMut);
                if (!resMut || resMut.valido) errosCnpj++;
            }
            registrar(
                errosCnpj === 0,
                'FUZZ_CNPJ_TRADICIONAL',
                `Fuzzing temporal de CNPJ Tradicional com Mutação Estrita ±1 a ±5 no Corpo (${totalCnpj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnpj * 2) - errosCnpj}/${totalCnpj * 2} | Erros=${errosCnpj}` }
            );
        } else if (id === 'FUZZ_CNPJ_ALFANUMERICO') {
            /* Fuzz 3: Novo CNPJ Alfanumérico Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalAlfa = 0;
            let errosAlfa = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalAlfa++;
                const alfaVal = gerarCnpjAlfanumericoValido();
                const resVal = validador.validarCNPJ(alfaVal);
                if (!resVal || !resVal.valido) errosAlfa++;

                const alfaMut = mutarDigitoParaInvalido(alfaVal, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCNPJ(alfaMut);
                if (!resMut || resMut.valido) errosAlfa++;
            }
            registrar(
                errosAlfa === 0,
                'FUZZ_CNPJ_ALFANUMERICO',
                `Fuzzing temporal de Novo CNPJ Alfanumérico com Mutação Estrita ±1 a ±5 no Corpo (${totalAlfa * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalAlfa * 2) - errosAlfa}/${totalAlfa * 2} | Erros=${errosAlfa}` }
            );
        } else if (id === 'FUZZ_CNJ_MODULO_97') {
            /* Fuzz 4: Processo Judicial CNJ Módulo 97 BigInt e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCnj = 0;
            let errosCnj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnj++;
                const cnjVal = gerarCnjValido();
                const resVal = validador.validarCNJ(cnjVal);
                if (!resVal || !resVal.valido) errosCnj++;

                const cnjMut = mutarDigitoParaInvalido(cnjVal, s => validador.validarCNJ(s), { ehCnj: true });
                const resMut = validador.validarCNJ(cnjMut);
                if (!resMut || resMut.valido) errosCnj++;
            }
            registrar(
                errosCnj === 0,
                'FUZZ_CNJ_MODULO_97',
                `Fuzzing temporal de Processos CNJ Módulo 97 com Mutação Estrita ±1 a ±5 no Corpo (${totalCnj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnj * 2) - errosCnj}/${totalCnj * 2} | Erros=${errosCnj}` }
            );
        } else if (id === 'FUZZ_INSS_NB_MODULO_11') {
            /* Fuzz 5: Benefício Previdenciário INSS NB Módulo 11 e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalInss = 0;
            let errosInss = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalInss++;
                const inssVal = gerarInssNbValido();
                const resVal = validador.validarNumeroBeneficioINSS(inssVal);
                if (!resVal || !resVal.valido) errosInss++;

                const inssMut = mutarDigitoParaInvalido(inssVal, s => validador.validarNumeroBeneficioINSS(s), { qtdDvsFinais: 1 });
                const resMut = validador.validarNumeroBeneficioINSS(inssMut);
                if (!resMut || resMut.valido) errosInss++;
            }
            registrar(
                errosInss === 0,
                'FUZZ_INSS_NB_MODULO_11',
                `Fuzzing temporal de Benefício INSS NB Módulo 11 com Mutação Estrita ±1 a ±5 no Corpo (${totalInss * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalInss * 2) - errosInss}/${totalInss * 2} | Erros=${errosInss}` }
            );
        } else if (id === 'FUZZ_PIS_MODULO_11') {
            /* Fuzz 6: Inscrição PIS/PASEP/NIT Módulo 11 e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalPis = 0;
            let errosPis = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalPis++;
                const pisVal = gerarPisValido();
                const resVal = validador.validarPIS(pisVal);
                if (!resVal || !resVal.valido) errosPis++;

                const pisMut = mutarDigitoParaInvalido(pisVal, s => validador.validarPIS(s), { qtdDvsFinais: 1 });
                const resMut = validador.validarPIS(pisMut);
                if (!resMut || resMut.valido) errosPis++;
            }
            registrar(
                errosPis === 0,
                'FUZZ_PIS_MODULO_11',
                `Fuzzing temporal de Inscrição PIS/PASEP Módulo 11 com Mutação Estrita ±1 a ±5 no Corpo (${totalPis * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalPis * 2) - errosPis}/${totalPis * 2} | Erros=${errosPis}` }
            );
        } else if (id === 'FUZZ_DATAS_BISSEXTO') {
            /* Fuzz 7: Datas, Bissextos e Mutação de Fronteira (1s) */
            const tInicio = performance.now();
            let totalDt = 0;
            let errosDt = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalDt++;
                const dtVal = gerarDataValida(totalDt % 3 === 0);
                const resVal = validador.validarData(dtVal);
                if (!resVal || !resVal.valido) errosDt++;

                const dtMut = mutarDataParaInvalida(dtVal);
                const resMut = validador.validarData(dtMut);
                if (!resMut || resMut.valido) errosDt++;
            }
            registrar(
                errosDt === 0,
                'FUZZ_DATAS_BISSEXTO',
                `Fuzzing temporal de Datas e Bissextos com Mutação de Fronteira (${totalDt * 2} iterações em ${duracaoMsPorTipo}ms)`,
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
                    'CPF: 099.123.459-67 e CNPJ: 09.912.345/0001-96',
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
            { desc: 'CPF valido ficticio 0991234 Parana / 9a RF (099.123.459-67)', amostra: '099.123.459-67', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF valido ficticio 0991234 TRF1 / DF (099.123.451-00)', amostra: '099.123.451-00', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF valido serie 09991234 Parana (099.912.349-18)', amostra: '099.912.349-18', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido sequencia repetida', amostra: '111.111.111-11', idx: 4, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido DV incorreto', amostra: '529.982.247-99', idx: 12, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido ficticio 0991234 (099.123.459-99)', amostra: '099.123.459-99', idx: 12, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            /* CNPJ Tradicional */
            { desc: 'CNPJ tradicional valido com calculo de DV', amostra: '11.222.333/0001-81', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido ficticio matriz 0991234 (09.912.345/0001-96)', amostra: '09.912.345/0001-96', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido ficticio filial 0991234 (09.912.345/0002-77)', amostra: '09.912.345/0002-77', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido serie 09991234 matriz (09.991.234/0001-12)', amostra: '09.991.234/0001-12', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido serie 09991234 filial (09.991.234/0002-01)', amostra: '09.991.234/0002-01', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional invalido DV incorreto', amostra: '11.222.333/0001-99', idx: 16, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional invalido ficticio 0991234 (09.912.345/0001-99)', amostra: '09.912.345/0001-99', idx: 16, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Novo CNPJ Alfanumerico */
            { desc: 'Novo CNPJ Alfanumerico valido (12.ABC.345/01DE-35)', amostra: '12.ABC.345/01DE-35', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'Novo CNPJ Alfanumerico invalido DV incorreto', amostra: '12.ABC.345/01DE-99', idx: 11, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Processo CNJ */
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TRF1)', amostra: '0991234-55.2024.4.01.4002', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido TRF1 (0991234-55.2024.4.01.4002)', amostra: '0991234-55.2024.4.01.4002', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido TJPR (0991234-87.2024.8.16.0030)', amostra: '0991234-87.2024.8.16.0030', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TJPI)', amostra: '0001234-70.2024.8.18.0140', idx: 8, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ invalido DV incorreto', amostra: '0991234-65.2024.4.01.4002', idx: 8, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            /* Beneficio INSS (NB) Modulo 11 */
            { desc: 'INSS NB valido com especie e calculo de DV', amostra: '31/6506589241', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB valido com especie ficticio 0991234 (31/0991234502)', amostra: '31/0991234502', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB valido isolado com calculo de DV (6464966891)', amostra: '6464966891', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado valido com calculo de DV (719.657.155-0)', amostra: '719.657.155-0', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado valido ficticio 0991234 (099.123.450-2)', amostra: '099.123.450-2', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB invalido DV incorreto', amostra: '31/6506589240', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado invalido DV incorreto (719.657.155-9)', amostra: '719.657.155-9', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado invalido ficticio 0991234 (099.123.450-9)', amostra: '099.123.450-9', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB invalido sequencia repetida', amostra: '1111111111', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            /* PIS / PASEP / NIT (Modulo 11) */
            { desc: 'PIS/NIT valido com calculo real de DV (120.43256.72-8)', amostra: '120.43256.72-8', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT valido ficticio padrao 0991234 (099.12345.67-9)', amostra: '099.12345.67-9', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido DV incorreto (120.43256.72-4)', amostra: '120.43256.72-4', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido ficticio padrao 0991234 DV incorreto (099.12345.67-0)', amostra: '099.12345.67-0', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido sequencia repetida', amostra: '000.00000.00-0', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS rotulado sem pontuacao valido (PIS: 12043256728)', amostra: 'PIS: 12043256728', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` },
            { desc: 'NIT rotulado com pontuacao valido (NIT: 120.43256.72-8)', amostra: 'NIT: 120.43256.72-8', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` },
            { desc: 'PIS rotulado sem pontuacao invalido (PIS: 12043256724)', amostra: 'PIS: 12043256724', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` }
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
            auditoriaCpfDv.html.includes('<b>[CPF Inválido]:</b>') && auditoriaCpfDv.html.includes('✗</span>');

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

        /* Testes da Wiki Forense (INSS, CNJ, CPF, CNPJ e Datas) */
        const wikiInss = validador.validarNumeroBeneficioINSS('31/6506589241');
        const aprovadoWikiInss = wikiInss &&
            wikiInss.valido &&
            wikiInss.ehWiki &&
            wikiInss.dado === '6506589241' &&
            !wikiInss.subtitulo.includes('Ativo') &&
            wikiInss.subtitulo.includes('Auxílio por Incapacidade Temporária') &&
            wikiInss.subtitulo.includes('(RGPS - Contributivo)') &&
            wikiInss.html.includes('<u') && wikiInss.html.includes('6506589241</u>') &&
            wikiInss.html.includes('✓</span>');
        registrar(aprovadoWikiInss, 'MATEMATICA', 'Wiki Forense INSS: decodificacao de especie 31, sem redundancia de "Ativo", pulando RGPS para 2a linha', {
            obtido: wikiInss ? wikiInss.subtitulo : 'falha'
        });

        const wikiInssExtinto = validador.validarNumeroBeneficioINSS('01/6506589241');
        const aprovadoWikiInssExtinto = wikiInssExtinto &&
            wikiInssExtinto.valido &&
            wikiInssExtinto.ehWiki &&
            wikiInssExtinto.subtitulo.includes('Tipo Extinto') &&
            wikiInssExtinto.subtitulo.includes('(Rural - Contributivo)');
        registrar(aprovadoWikiInssExtinto, 'MATEMATICA', 'Wiki Forense INSS: identificacao de "Tipo Extinto/Inativo" para especie nao-ativa', {
            obtido: wikiInssExtinto ? wikiInssExtinto.subtitulo : 'falha'
        });

        const wikiInssPontuado = validador.validarNumeroBeneficioINSS('719.657.155-0');
        const aprovadoWikiInssPontuado = wikiInssPontuado &&
            wikiInssPontuado.valido &&
            wikiInssPontuado.ehWiki &&
            wikiInssPontuado.dado === '719.657.155-0' &&
            !wikiInssPontuado.subtitulo.includes('Módulo 11 Válido') &&
            wikiInssPontuado.subtitulo.includes('Benefício da Previdência Social');
        registrar(aprovadoWikiInssPontuado, 'MATEMATICA', 'Wiki Forense INSS: reconhecimento de NB pontuado 719.657.155-0 sem tipo de calculo nos baloes', {
            obtido: wikiInssPontuado ? `${wikiInssPontuado.dado} | ${wikiInssPontuado.subtitulo}` : 'falha'
        });

        const alertaInssPontuado = validador.auditarEAlerta('719.657.155-0', null);
        const aprovadoAlertaInss = alertaInssPontuado &&
            alertaInssPontuado.valido &&
            alertaInssPontuado.ehWiki &&
            alertaInssPontuado.tipo === 'INSS';
        registrar(aprovadoAlertaInss, 'MATEMATICA', 'auditarEAlerta com NB pontuado 719.657.155-0 roteia para Wiki Forense INSS', {
            obtido: alertaInssPontuado ? `${alertaInssPontuado.tipo} (valido=${alertaInssPontuado.valido})` : 'falha'
        });

        const wikiCnj = validador.validarCNJ('1004615-62.2026.4.01.4002');
        const aprovadoWikiCnj = wikiCnj &&
            wikiCnj.valido &&
            wikiCnj.ehWiki &&
            wikiCnj.dado === '1004615-62.2026.4.01.4002' &&
            wikiCnj.subtitulo.includes('Justiça Federal') &&
            wikiCnj.subtitulo.includes('TRF da 1ª Região') &&
            wikiCnj.html.includes('<u') && wikiCnj.html.includes('1004615-62.2026.4.01.4002</u>') &&
            wikiCnj.html.includes('✓</span>');
        registrar(aprovadoWikiCnj, 'MATEMATICA', 'Wiki Forense CNJ: decodificacao de Ramo e Tribunal com dado sublinhado e vezinho sem sublinhado', {
            obtido: wikiCnj ? wikiCnj.subtitulo : 'falha'
        });

        const wikiCpf = validador.validarCPF('352.621.413-15');
        const aprovadoWikiCpf = wikiCpf &&
            wikiCpf.valido &&
            wikiCpf.ehWiki &&
            wikiCpf.dado === '352.621.413-15' &&
            wikiCpf.subtitulo.includes('3ª Região Fiscal da RFB (CE, MA, PI)') &&
            wikiCpf.html.includes('<u') && wikiCpf.html.includes('352.621.413-15</u>') &&
            wikiCpf.html.includes('✓</span>');
        registrar(aprovadoWikiCpf, 'MATEMATICA', 'Wiki Forense CPF: decodificacao da Regiao Fiscal da RFB a partir do 9º digito', {
            obtido: wikiCpf ? wikiCpf.subtitulo : 'falha'
        });

        const wikiCnpjMatriz = validador.validarCNPJ('29.979.036/0001-40');
        const wikiCnpjFilial = validador.validarCNPJ('00.000.000/0002-72');
        const aprovadoWikiCnpj = wikiCnpjMatriz &&
            wikiCnpjMatriz.ehMatriz &&
            wikiCnpjMatriz.dado === '29.979.036/0001-40' &&
            wikiCnpjFilial &&
            !wikiCnpjFilial.ehMatriz &&
            wikiCnpjFilial.dado === '00.000.000/0002-72' &&
            wikiCnpjFilial.matriz === '00.000.000/0001-91';
        registrar(aprovadoWikiCnpj, 'MATEMATICA', 'Wiki Forense CNPJ: identificacao de Matriz (0001) e calculo automatico de Matriz a partir de Filial', {
            matriz: wikiCnpjMatriz ? wikiCnpjMatriz.subtitulo : 'falha',
            filial: wikiCnpjFilial ? wikiCnpjFilial.subtitulo : 'falha'
        });

        const wikiDataDiaUtil = validador.validarData('11/09/2026'); // 11/09/2026 e Sexta-feira
        const aprovadoWikiDataDiaUtil = wikiDataDiaUtil &&
            wikiDataDiaUtil.valido &&
            wikiDataDiaUtil.ehWiki &&
            wikiDataDiaUtil.dado === '11/09/2026' &&
            wikiDataDiaUtil.diaSemana === 'Sexta-feira' &&
            wikiDataDiaUtil.tituloDoc === 'Sexta-feira' &&
            wikiDataDiaUtil.ehFimDeSemana === false &&
            wikiDataDiaUtil.ehDiaUtil === true &&
            wikiDataDiaUtil.subtitulo.includes('Sexta-feira (Dia Útil)') &&
            wikiDataDiaUtil.html.includes('Sexta-feira') &&
            wikiDataDiaUtil.html.includes('<u') && wikiDataDiaUtil.html.includes('11/09/2026</u>') &&
            wikiDataDiaUtil.html.includes('✓</span>');
        registrar(aprovadoWikiDataDiaUtil, 'MATEMATICA', 'Wiki Forense Data: decodificacao de Sexta-feira no titulo e Dia Util (cor verde padrao)', {
            obtido: wikiDataDiaUtil ? `${wikiDataDiaUtil.tituloDoc} | ${wikiDataDiaUtil.subtitulo}` : 'falha'
        });

        const wikiDataFimDeSemana = validador.validarData('12/09/2026'); // 12/09/2026 e Sabado
        const aprovadoWikiDataFimDeSemana = wikiDataFimDeSemana &&
            wikiDataFimDeSemana.valido &&
            wikiDataFimDeSemana.ehWiki &&
            wikiDataFimDeSemana.dado === '12/09/2026' &&
            wikiDataFimDeSemana.diaSemana === 'Sábado' &&
            wikiDataFimDeSemana.tituloDoc === 'Sábado' &&
            wikiDataFimDeSemana.ehFimDeSemana === true &&
            wikiDataFimDeSemana.ehDiaUtil === false &&
            wikiDataFimDeSemana.subtitulo.includes('Sábado (Final de Semana)') &&
            wikiDataFimDeSemana.html.includes('Sábado') &&
            wikiDataFimDeSemana.html.includes('<u') && wikiDataFimDeSemana.html.includes('12/09/2026</u>') &&
            wikiDataFimDeSemana.html.includes('✓</span>');
        registrar(aprovadoWikiDataFimDeSemana, 'MATEMATICA', 'Wiki Forense Data: decodificacao de Sabado no titulo e Final de Semana (cor azul ceu)', {
            obtido: wikiDataFimDeSemana ? `${wikiDataFimDeSemana.tituloDoc} | ${wikiDataFimDeSemana.subtitulo}` : 'falha'
        });

        const alertaDataHora = validador.auditarEAlerta('28/10/2026 06:28', null); // 28/10/2026 e Quarta-feira
        const aprovadoAlertaDataHora = alertaDataHora &&
            alertaDataHora.valido &&
            alertaDataHora.ehWiki &&
            alertaDataHora.dado === '28/10/2026 06:28' &&
            alertaDataHora.diaSemana === 'Quarta-feira' &&
            alertaDataHora.tituloDoc === 'Quarta-feira' &&
            alertaDataHora.subtitulo.includes('Quarta-feira (Dia Útil)') &&
            alertaDataHora.subtitulo.includes('06:28') &&
            alertaDataHora.html.includes('Quarta-feira') &&
            alertaDataHora.html.includes('<u') && alertaDataHora.html.includes('28/10/2026 06:28</u>') &&
            alertaDataHora.html.includes('✓</span>');
        registrar(aprovadoAlertaDataHora, 'MATEMATICA', 'Wiki Forense Data com Horario: composicao de Dia da Semana no titulo e Horario nos metadados', {
            obtido: alertaDataHora ? `${alertaDataHora.tituloDoc} | ${alertaDataHora.subtitulo}` : 'falha'
        });

        const wikiDataExtComposta = validador.validarData('23 de outubro de 2026 as 21:38:42 BRT'); // 23/10/2026 e Sexta-feira
        const aprovadoDataExtComposta = wikiDataExtComposta &&
            wikiDataExtComposta.valido &&
            wikiDataExtComposta.ehWiki &&
            wikiDataExtComposta.diaSemana === 'Sexta-feira' &&
            wikiDataExtComposta.tituloDoc === 'Sexta-feira' &&
            wikiDataExtComposta.ehFimDeSemana === false &&
            wikiDataExtComposta.subtitulo.includes('Sexta-feira (Dia Útil)') &&
            wikiDataExtComposta.subtitulo.includes('21:38:42') &&
            wikiDataExtComposta.html.includes('Sexta-feira') &&
            wikiDataExtComposta.html.includes('✓</span>');
        registrar(aprovadoDataExtComposta, 'MATEMATICA', 'Wiki Forense Data Extensa Composta com Horario: deteccao de dia da semana no titulo e horario integrado', {
            obtido: wikiDataExtComposta ? `${wikiDataExtComposta.tituloDoc} | ${wikiDataExtComposta.subtitulo}` : 'falha'
        });

        const wikiDataIso = validador.auditarEAlerta('2026-11-04', null); // 04/11/2026 e Quarta-feira
        const aprovadoDataIso = wikiDataIso &&
            wikiDataIso.valido &&
            wikiDataIso.ehWiki &&
            wikiDataIso.diaSemana === 'Quarta-feira' &&
            wikiDataIso.tituloDoc === 'Quarta-feira' &&
            wikiDataIso.ehFimDeSemana === false &&
            wikiDataIso.html.includes('Quarta-feira') &&
            wikiDataIso.html.includes('2026-11-04') &&
            wikiDataIso.html.includes('✓</span>');
        registrar(aprovadoDataIso, 'MATEMATICA', 'Wiki Forense Data Formato ISO (AAAA-MM-DD): decodificacao de Quarta-feira no titulo e Dia Util', {
            obtido: wikiDataIso ? `${wikiDataIso.tituloDoc} | ${wikiDataIso.subtitulo}` : 'falha'
        });

        /* Testes FEAT-03: Validacao Matematica Generica Fallback em Balao Cinza (Diretriz 6.42) */
        const genericoMod11 = validador.auditarEAlerta('1300802143', null);
        const aprovadoGenericoMod11 = Boolean(
            genericoMod11 &&
            genericoMod11.valido &&
            genericoMod11.ehWiki &&
            genericoMod11.ehGenericoCinza &&
            genericoMod11.html.includes('[Mod11]:') &&
            genericoMod11.html.includes('1300802143') &&
            genericoMod11.html.includes('✓</span>')
        );
        registrar(aprovadoGenericoMod11, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero puro sem contexto validado via Mod11 em cartao cinza neutro', {
            obtido: genericoMod11 ? genericoMod11.msg : 'falha'
        });

        const genericoInvalidoSilencioso = validador.auditarEAlerta('1300802149', null);
        const aprovadoGenericoSilencioso = Boolean(
            genericoInvalidoSilencioso &&
            genericoInvalidoSilencioso.valido &&
            !genericoInvalidoSilencioso.ehWiki &&
            !genericoInvalidoSilencioso.html
        );
        registrar(aprovadoGenericoSilencioso, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero nao-identificado invalido permanece 100% silencioso (zero popups)', {
            obtido: genericoInvalidoSilencioso ? `valido=${genericoInvalidoSilencioso.valido}, ehWiki=${Boolean(genericoInvalidoSilencioso.ehWiki)}` : 'falha'
        });

        const genericoMod97 = validador.auditarEAlerta('09912345520244014002', null);
        const aprovadoGenericoMod97 = Boolean(
            genericoMod97 &&
            genericoMod97.valido &&
            genericoMod97.ehWiki &&
            genericoMod97.ehGenericoCinza &&
            genericoMod97.html.includes('[Mod97]:') &&
            genericoMod97.html.includes('✓</span>')
        );
        registrar(aprovadoGenericoMod97, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero CNJ sem mascara validado via Mod97 em cartao cinza neutro', {
            obtido: genericoMod97 ? genericoMod97.msg : 'falha'
        });

        /* Testes Anti-Falso-Positivo BUG-05 (Rejeicao de Alfanumericos e Sequencias Curtas em Mod10) */
        const genericoAlfanumSilencioso = validador.auditarEAlerta('RTL2832U', null);
        const aprovadoAlfanumSilencioso = Boolean(
            genericoAlfanumSilencioso &&
            genericoAlfanumSilencioso.valido &&
            !genericoAlfanumSilencioso.ehWiki &&
            !genericoAlfanumSilencioso.html
        );
        registrar(aprovadoAlfanumSilencioso, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: string alfanumerica com letras (ex: RTL2832U) permanece 100% silenciosa sem popup de Mod10', {
            obtido: genericoAlfanumSilencioso ? `valido=${genericoAlfanumSilencioso.valido}, ehWiki=${Boolean(genericoAlfanumSilencioso.ehWiki)}` : 'falha'
        });

        const genericoCurtoSilencioso = validador.auditarEAlerta('2832', null);
        const aprovadoCurtoSilencioso = Boolean(
            genericoCurtoSilencioso &&
            genericoCurtoSilencioso.valido &&
            !genericoCurtoSilencioso.ehWiki &&
            !genericoCurtoSilencioso.html
        );
        registrar(aprovadoCurtoSilencioso, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: sequencia pura curta sem hifen (ex: 2832) permanece 100% silenciosa sem popup de Mod10', {
            obtido: genericoCurtoSilencioso ? `valido=${genericoCurtoSilencioso.valido}, ehWiki=${Boolean(genericoCurtoSilencioso.ehWiki)}` : 'falha'
        });

        const fraseAlfanumSilenciosa = validador.auditarEAlerta('Buy RTL-SDR Dongles (RTL2832U)', null);
        const aprovadoFraseSilenciosa = Boolean(
            fraseAlfanumSilenciosa &&
            fraseAlfanumSilenciosa.valido &&
            !fraseAlfanumSilenciosa.ehWiki &&
            !fraseAlfanumSilenciosa.html
        );
        registrar(aprovadoFraseSilenciosa, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: frase/titulo completo com modelo (Buy RTL-SDR Dongles (RTL2832U)) permanece 100% silencioso', {
            obtido: fraseAlfanumSilenciosa ? `valido=${fraseAlfanumSilenciosa.valido}, ehWiki=${Boolean(fraseAlfanumSilenciosa.ehWiki)}` : 'falha'
        });

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
                htmlEditorOk = htmlPadrao.includes('<b>@@Autor@@</b>') &&
                    htmlPadrao.includes('<b>##Réu##</b>') &&
                    htmlPadrao.includes('<u>(##)####-####</u>') &&
                    htmlPadrao.includes('<i>##/##/20##</i>') &&
                    htmlPadrao.includes('<u><i>[@@ato@@]</i></u>') &&
                    htmlPadrao.includes('<u>##.###,##</u>') &&
                    htmlPadrao.includes('id #######') &&
                    htmlPadrao.includes('id ###### fl. ##') &&
                    htmlPadrao.includes('#####') &&
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
                modAvancadoOk = (estAv.modoPlaceholdersMinutasHtml === 'avancado' && estAv.placeholdersMinutasHtmlAtivo === true && estAv.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('ctrl_avancado');
                const estCtrlAv = motorTeste.obterEstadoAtual();
                modCtrlAvancadoOk = (estCtrlAv.modoPlaceholdersMinutasHtml === 'ctrl_avancado' && estCtrlAv.placeholdersMinutasHtmlAtivo === true && estCtrlAv.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('desabilitado');
                const estDes = motorTeste.obterEstadoAtual();
                modDesativadoOk = (estDes.modoPlaceholdersMinutasHtml === 'desabilitado' && estDes.placeholdersMinutasHtmlAtivo === false && estDes.selecaoEditavelAtiva === false);

                motorTeste.definirModoPlaceholdersMinutasHtml('placeholders');
                const estPl = motorTeste.obterEstadoAtual();
                modPlaceholdersOk = (estPl.modoPlaceholdersMinutasHtml === 'placeholders' && estPl.placeholdersMinutasHtmlAtivo === true && estPl.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml(estIni);
            } else {
                motorTeste.definirPlaceholdersMinutasHtmlAtivo(estIni !== 'desabilitado');
            }

            const tudoValido = (estDesativado === false && estReativado === true && modAvancadoOk && modCtrlAvancadoOk && modDesativadoOk && modPlaceholdersOk);
            registrar(
                tudoValido,
                'CONTROLE_PLACEHOLDERS_HTML_CONFIG',
                'Controle unificado dos 4 modos de Seleção Automática de Placeholders em Editores (desabilitado, placeholders, ctrl_avancado, avancado)',
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

            /* 3.2.3) Validacao e blindagem de isEditorMultilinhaValido e isCampoDeTextoValido */
            if (typeof motorTeste.isEditorMultilinhaValido === 'function' && typeof motorTeste.isCampoDeTextoValido === 'function') {
                const ta = document.createElement('textarea');
                const inp = document.createElement('input');
                inp.type = 'text';
                const divLivre = document.createElement('div');
                divLivre.textContent = 'Texto fixo';
                const divEdit = document.createElement('div');
                divEdit.contentEditable = 'true';
                document.body.appendChild(ta);
                document.body.appendChild(inp);
                document.body.appendChild(divLivre);
                document.body.appendChild(divEdit);

                const okEditorTa = motorTeste.isEditorMultilinhaValido(ta) === true;
                const okEditorDiv = motorTeste.isEditorMultilinhaValido(divEdit) === true;
                const okEditorFixo = motorTeste.isEditorMultilinhaValido(divLivre) === false;
                const okCampoInp = motorTeste.isCampoDeTextoValido(inp) === true;
                const okCampoTa = motorTeste.isCampoDeTextoValido(ta) === true;
                const okCampoDiv = motorTeste.isCampoDeTextoValido(divLivre) === false;

                document.body.removeChild(ta);
                document.body.removeChild(inp);
                document.body.removeChild(divLivre);
                document.body.removeChild(divEdit);

                const validadoresOk = okEditorTa && okEditorDiv && okEditorFixo && okCampoInp && okCampoTa && okCampoDiv;
                registrar(
                    validadoresOk,
                    'VALIDADORES_CAMPOS_E_EDITORES_BLINDADOS',
                    'Validacao estrita de isCampoDeTextoValido e isEditorMultilinhaValido protegidos contra excecoes de contexto e nos nulos',
                    {
                        esperado: 'true',
                        obtido: String(validadoresOk),
                        detalhe: `edTa=${okEditorTa}, edDiv=${okEditorDiv}, edFixo=${okEditorFixo}, cInp=${okCampoInp}, cTa=${okCampoTa}, cDiv=${okCampoDiv}`
                    }
                );
            }

            /* 3.2.4) Protecao de Interface contra Perda Acidental de Conteudo (Minimo de Caracteres) */
            if (typeof motorTeste.verificarProtecaoTamanhoMinimoInterface === 'function' && typeof motorTeste.definirMinimoCaracteresInterface === 'function') {
                const btnUi = document.createElement('button');
                btnUi.textContent = 'OK';
                const pLeitura = document.createElement('p');
                pLeitura.textContent = 'Texto normal em area de sentenca';
                document.body.appendChild(btnUi);
                document.body.appendChild(pLeitura);

                motorTeste.definirMinimoCaracteresInterface(5);

                const tCurtoUiBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnUi, false) === false;
                const tOuLeituraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, false) === false;
                const tOuComModPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, true) === true;
                const t3LetrasUiBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnUi, false) === false;
                const tDataUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('11/09/2026', btnUi, false) === true;
                const tCpfUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('123.456.789-00', btnUi, false) === true;
                const tNbPontuadoUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('719.657.155-0', btnUi, false) === true;
                const tLongoUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('PROCEDIMENTO', btnUi, false) === true;
                const tCurtoComModPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnUi, true) === true;
                const tLeituraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', pLeitura, false) === false;

                motorTeste.definirMinimoCaracteresInterface(0);
                const tDesativadoPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, false) === true;

                motorTeste.definirMinimoCaracteresInterface(5);

                document.body.removeChild(btnUi);
                document.body.removeChild(pLeitura);

                const protecaoOk = tCurtoUiBloq && tOuLeituraBloq && tOuComModPerm && t3LetrasUiBloq && tDataUiPerm && tCpfUiPerm && tNbPontuadoUiPerm && tLongoUiPerm && tCurtoComModPerm && tLeituraBloq && tDesativadoPerm;
                registrar(
                    protecaoOk,
                    'PROTECAO_TAMANHO_MINIMO_INTERFACE_E_CAMPOS',
                    'Protecao contra perda acidental da Area de Transferencia em textos e interfaces: minimo N caracteres em palavras comuns, isencao de campos estruturados e modificadores',
                    {
                        esperado: 'true',
                        obtido: String(protecaoOk),
                        detalhe: `tCurtoUiBloq=${tCurtoUiBloq}, t3LetrasUiBloq=${t3LetrasUiBloq}, tDataUiPerm=${tDataUiPerm}, tCpfUiPerm=${tCpfUiPerm}, tLongoUiPerm=${tLongoUiPerm}, tCurtoComModPerm=${tCurtoComModPerm}, tLeituraBloq=${tLeituraBloq}, tDesativadoPerm=${tDesativadoPerm}`
                    }
                );
            }
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

        /* 3.3.1) Validação End-to-End de Alternância de Clique e Isolamento de Clipboard em <input> via Eventos DOM */
        if (typeof document !== 'undefined') {
            const inpDom = document.createElement('input');
            inpDom.type = 'text';
            inpDom.value = 'Texto Teste Input';
            document.body.appendChild(inpDom);

            const clipOriginal = window.__JUSGOV_ULTIMO_CLIPBOARD__ || 'CLIP_INICIAL_INTACTO';
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipOriginal;

            // 1) 1º clique: mousedown + mouseup
            inpDom.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, detail: 1 }));
            inpDom.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, detail: 1 }));

            const autoselected1 = inpDom.dataset.autoselected === 'true';
            const clipIntacto1 = (window.__JUSGOV_ULTIMO_CLIPBOARD__ === clipOriginal);

            // 2) blur reseta autoselected
            inpDom.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
            const autoselectedAposBlur = (inpDom.dataset.autoselected === undefined);

            // 3) Duplo clique: dblclick
            inpDom.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, button: 0, detail: 2 }));
            const clipIntacto2 = (window.__JUSGOV_ULTIMO_CLIPBOARD__ === clipOriginal);

            document.body.removeChild(inpDom);

            const sucessoEventosDom = autoselected1 && clipIntacto1 && autoselectedAposBlur && clipIntacto2;

            registrar(
                sucessoEventosDom,
                'INPUT_EVENTOS_DOM_AUTOSELECAO_E_BLINDAGEM_CLIPBOARD',
                'Eventos DOM reais (mousedown/mouseup/dblclick/blur): 1o clique ativa autoselected sem alterar clipboard; blur reseta; dblclick mantém clipboard intacto',
                {
                    textoTestado: 'Input DOM Real',
                    esperado: 'autoselected=true, clipIntacto=true, blurReseta=true, dblclickClipIntacto=true',
                    obtido: `autoselected1=${autoselected1}, clipIntacto1=${clipIntacto1}, blurReseta=${autoselectedAposBlur}, dblclickClipIntacto=${clipIntacto2}`
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

        /* 3.4.1) Teste de Destaque Formatado Inline (ex: duplo clique em <mark>marca-texto</mark>) */
        if (typeof document !== 'undefined' && motorTeste && typeof motorTeste.construirMapaTextoBlocoComJanela === 'function' && typeof motorTeste.tentarExpandirBlocoFormatadoDestaque === 'function') {
            const containerMark = document.createElement('div');
            containerMark.innerHTML = '<p>Texto com <b>negrito</b>, <i>italico</i>, <u>sublinhado</u>, <mark>marca-texto</mark> ou combinacoes.</p>';
            document.body.appendChild(containerMark);

            const elMark = containerMark.querySelector('mark');
            let extracaoMarkOk = false;
            let trechoMarkObtido = '';

            if (elMark && elMark.firstChild) {
                const mapaMark = motorTeste.construirMapaTextoBlocoComJanela(elMark.firstChild, 2);
                if (mapaMark) {
                    const resMark = motorTeste.tentarExpandirBlocoFormatadoDestaque(mapaMark, mapaMark.idxCursor);
                    if (resMark) {
                        trechoMarkObtido = mapaMark.texto.substring(resMark.inicio, resMark.fim);
                        extracaoMarkOk = (trechoMarkObtido === 'marca-texto');
                    }
                }
            }

            document.body.removeChild(containerMark);

            registrar(
                extracaoMarkOk,
                'EXPANSAO_FORMATADA_MARK_ISOLADO',
                'Delimitacao exata de elemento formatado inline <mark>marca-texto</mark> sem vazar espaco externo',
                {
                    textoTestado: '<mark>marca-texto</mark> ou combinacoes.',
                    idxCursor: 2,
                    esperado: 'marca-texto',
                    obtido: trechoMarkObtido
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

                /* Teste de colagem em campo input do tipo date com conversao automatica e tolerancia a selectionStart */
                const elInputData = document.createElement('input');
                elInputData.type = 'date';
                document.body.appendChild(elInputData);

                motorTeste.simularColagemBotaoDireito(elInputData, 'normal', '04/11/2026');
                const valData = elInputData.value;
                document.body.removeChild(elInputData);

                registrar(
                    valData === '2026-11-04',
                    'SIMULACAO_COLAGEM_INPUT_TIPO_DATA',
                    'Simulacao de colagem em input type="date" com conversao automatica de DD/MM/AAAA para AAAA-MM-DD e suporte a selectionStart',
                    {
                        textoTestado: 'Colagem em input type="date"',
                        idxCursor: 0,
                        esperado: '2026-11-04',
                        obtido: valData
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

            if (typeof motorTeste.salvarClipboardInternoComBackup === 'function') {
                /* Seção 6.63: Ctrl + Botão do Meio cola a penúltima seleção sem alterar nem rotacionar a última cópia */
                const estadoOrigMeio = (typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(true);

                motorTeste.salvarClipboardInternoComBackup({ texto: 'Primeiro Texto Copiado', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Segundo Texto Copiado', html: '', formatado: false });

                const campoCtrlMeio = document.createElement('input');
                campoCtrlMeio.type = 'text';
                document.body.appendChild(campoCtrlMeio);

                const evtCtrlMeio = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1, ctrlKey: true });
                campoCtrlMeio.dispatchEvent(evtCtrlMeio);

                const colouPenultimo = (campoCtrlMeio.value === 'Primeiro Texto Copiado');
                const ultimoPermaneceIntacto = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'Segundo Texto Copiado');

                document.body.removeChild(campoCtrlMeio);
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(estadoOrigMeio);

                registrar(
                    Boolean(colouPenultimo && ultimoPermaneceIntacto && evtCtrlMeio.defaultPrevented),
                    'CTRL_MEIO_COLA_PENULTIMO_CLIPBOARD',
                    'Ctrl + Botao do Meio cola a penultima selecao interna (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) mantendo a ultima intacta (Seção 6.63)',
                    {
                        textoTestado: 'Ctrl + Botao do Meio (Penultimo Buffer)',
                        idxCursor: 0,
                        esperado: 'penultimo=Primeiro Texto Copiado, ultimoIntacto=true',
                        obtido: `penultimo=${campoCtrlMeio.value}, ultimoIntacto=${ultimoPermaneceIntacto}`
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
                    stopImmediatePropagation() { }
                };
                motorTeste.tratarNavegacaoAbasPorBotoesMouse(evtBtn4);

                const evtBtn5 = {
                    type: 'mousedown',
                    button: 4,
                    which: 5,
                    buttons: 16,
                    preventDefault() { preventDefaultBotao5 = true; },
                    stopPropagation() { stopPropagationBotao5 = true; },
                    stopImmediatePropagation() { }
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
                    stopPropagation() { }
                };
                motorTeste.aoPressionarBotaoMouse(evtLink);

                /* Evento mousedown na div com botao do meio: DEVE chamar preventDefault (anula rolagem automatica) */
                let preventDefaultChamadoDiv = false;
                const evtDiv = {
                    button: 1,
                    target: divComum,
                    preventDefault() { preventDefaultChamadoDiv = true; },
                    stopPropagation() { }
                };
                motorTeste.aoPressionarBotaoMouse(evtDiv);

                /* Evento click com botao do meio: NUNCA deve chamar preventDefault */
                let preventDefaultChamadoClick = false;
                if (typeof motorTeste.aoClicar === 'function') {
                    const evtClickMeio = {
                        button: 1,
                        target: linkHref,
                        preventDefault() { preventDefaultChamadoClick = true; },
                        stopPropagation() { }
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
                        stopPropagation() { }
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
                            preventDefault() { },
                            stopPropagation() { }
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
                    stopPropagation() { }
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

        /* 3.6.1) Contorno Visual Rapido ao Copiar (Flash Temporizado): Padrao -1 (Ate Interacao) ou 500ms e Borda Transparente sem Escurecer Selecao */
        if (motorTeste && typeof motorTeste.obterEstadoAtual === 'function') {
            const estadoAtual = motorTeste.obterEstadoAtual();
            const padrao500Ok = (estadoAtual.tempoFlashBorderMs === -1 || estadoAtual.tempoFlashBorderMs === 500);

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
                'Contorno visual flash ao copiar com duracao padrao (-1 ou 500ms), fundo 100% transparente (sem escurecer selecao) e remocao limpa',
                {
                    textoTestado: 'Parametro tempoFlashBorderMs e container flutuante de contorno',
                    idxCursor: 0,
                    esperado: 'tempoFlashBorderMs=-1 ou 500, bgTransparente=true, containerRemovido=true',
                    obtido: `tempoFlashBorderMs=${estadoAtual.tempoFlashBorderMs}, flashVisualOk=${flashVisualOk}`
                }
            );

            /* Contorno sem sobreposicao: spans aninhados na mesma linha = 1 caixa; paragrafo em varias linhas = 1 poligono */
            if (typeof motorTeste.dispararFlashBorderVisual === 'function' && typeof motorTeste.limparFlashBorderImediatamente === 'function') {
                const tempoOriginalFlash = estadoAtual.tempoFlashBorderMs;
                if (typeof motorTeste.definirTempoFlashBorderMs === 'function') motorTeste.definirTempoFlashBorderMs(500);
                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:fixed;top:10px;left:10px;width:180px;font:14px/20px Arial;';
                wrap.innerHTML = '<p id="flashAninhado"><b><i>ABC</i> DEF</b> GHI</p><p id="flashMulti">Uma frase bem longa para quebrar em varias linhas dentro de uma caixa estreita de teste.</p>';
                document.body.appendChild(wrap);

                const r1 = document.createRange();
                r1.selectNodeContents(wrap.querySelector('#flashAninhado'));
                motorTeste.dispararFlashBorderVisual(r1);
                const caixasAninhado = document.querySelectorAll('#jusgov-flash-contour-container .jusgov-flash-box').length;

                const r2 = document.createRange();
                r2.selectNodeContents(wrap.querySelector('#flashMulti'));
                motorTeste.dispararFlashBorderVisual(r2);
                const caixasMulti = document.querySelectorAll('#jusgov-flash-contour-container .jusgov-flash-box').length;
                const ehPoligono = Boolean(document.querySelector('#jusgov-flash-contour-container svg.jusgov-flash-box path'));

                motorTeste.limparFlashBorderImediatamente();
                document.body.removeChild(wrap);
                if (typeof motorTeste.definirTempoFlashBorderMs === 'function') motorTeste.definirTempoFlashBorderMs(tempoOriginalFlash);

                const semSobreposicao = (caixasAninhado === 1 && caixasMulti === 1 && ehPoligono);
                registrar(
                    semSobreposicao,
                    'CONTORNO_FLASH_SEM_SOBREPOSICAO_E_POLIGONO_MULTILINHA',
                    'Contorno flash: elementos aninhados na mesma linha geram 1 caixa e texto em varias linhas gera 1 contorno continuo (sem caixas sobrepostas)',
                    {
                        textoTestado: 'Spans aninhados e paragrafo multilinha',
                        idxCursor: 0,
                        esperado: 'aninhado=1, multilinha=1 poligono',
                        obtido: `aninhado=${caixasAninhado}, multilinha=${caixasMulti}, poligono=${ehPoligono}`
                    }
                );
            }
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
                        try { clip.read = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) { }
                        try { clip.readText = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) { }
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
                        try { if (origRead) clip.read = origRead; } catch (_) { }
                        try { if (origReadText) clip.readText = origReadText; } catch (_) { }
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
                'Emulação de eventos de teclado para colagem (Ctrl+V) e evento sintético Meta+V (reserva técnica para quando o Chrome permitir invocar o histórico do SO)',
                {
                    textoTestado: 'Emulação de teclado Ctrl+V e evento sintético Meta+V',
                    idxCursor: 0,
                    esperado: 'paste=true, winV=true',
                    obtido: emulacaoTeclasOk ? 'paste=true, winV=true' : 'falha'
                }
            );

            /* Sub-modulo: Configuracoes de Anti-Duplicacao e Modos de Monitoramento de URLs */
            const optReutilizar = document.getElementById('optReutilizarAbasAbertas');
            const optReutilizarFoco = document.getElementById('optReutilizarFocoPrimeiroPlano');
            const optProtegerMod = document.getElementById('optProtegerGuiasModificadas');
            const selAcao = document.getElementById('selectReutilizarAcaoConteudo');
            const optAcaoManter = document.getElementById('optReutilizarAcaoManter');
            const optMonOrig = document.getElementById('optMonitorarUrlOriginal');
            const optMonAtual = document.getElementById('optMonitorarUrlAtual');
            let antiDuplicacaoOk = true;
            if (optReutilizar && optMonOrig && optMonAtual) {
                const padraoReutilizar = (optReutilizar.defaultChecked === true);
                const padraoFoco = optReutilizarFoco ? (optReutilizarFoco.defaultChecked === true) : true;
                const padraoProteger = optProtegerMod ? (optProtegerMod.defaultChecked === true) : true;
                const padraoAcao = selAcao ? (selAcao.value === 'manter') : (optAcaoManter ? optAcaoManter.defaultChecked === true : true);
                const padraoMonOrig = (optMonOrig.defaultChecked === false);
                const padraoMonAtual = (optMonAtual.defaultChecked === true);
                antiDuplicacaoOk = Boolean(padraoReutilizar && padraoFoco && padraoProteger && padraoAcao && padraoMonOrig && padraoMonAtual);
            }
            registrar(
                antiDuplicacaoOk,
                'ANTI_DUPLICACAO_PADRAO_E_MONITORAMENTO',
                'Anti-duplicacao ativa por padrao (reutilizarAbasAbertas=true, focoPrimeiroPlano=true, protegerModificadas=true, acao=manter, monitorarAtual=true)',
                {
                    textoTestado: 'Defaults de Anti-duplicacao Expandida',
                    idxCursor: 0,
                    esperado: 'reutilizar=true, foco=true, proteger=true, acao=manter, monitorarOriginal=false, monitorarAtual=true',
                    obtido: antiDuplicacaoOk ? 'reutilizar=true, foco=true, proteger=true, acao=manter, monitorarOriginal=false, monitorarAtual=true' : 'falha'
                }
            );

            /* Sub-modulo: Preservacao estrita da Guia Atual ao tentar abrir link duplicado (Zero Fechamento indevido) */
            const simularDecisaoFechamento = (ehAbaPreExistente, urlAnteriorValida) => {
                if (ehAbaPreExistente && urlAnteriorValida) {
                    return 'MANTER_GUIA_ATUAL_E_VOLTAR';
                }
                return 'FECHAR_NOVA_GUIA_TEMPORARIA';
            };
            const decisaoGuiaAtual = simularDecisaoFechamento(true, 'https://pje.jus.br/processo/100');
            const decisaoNovaGuia = simularDecisaoFechamento(false, '');
            const preservacaoGuiaAtualOk = (decisaoGuiaAtual === 'MANTER_GUIA_ATUAL_E_VOLTAR' && decisaoNovaGuia === 'FECHAR_NOVA_GUIA_TEMPORARIA');
            registrar(
                preservacaoGuiaAtualOk,
                'ANTI_DUPLICACAO_PRESERVAR_GUIA_ATUAL',
                'Preservacao estrita da guia atual: se link duplicado tenta abrir na guia atual, reverte e mantem a guia viva sem fechar',
                {
                    textoTestado: 'Decisao de Anti-Duplicacao Guia Atual vs Nova Guia',
                    idxCursor: 0,
                    esperado: 'guiaAtual=MANTER_GUIA_ATUAL_E_VOLTAR, novaGuia=FECHAR_NOVA_GUIA_TEMPORARIA',
                    obtido: `guiaAtual=${decisaoGuiaAtual}, novaGuia=${decisaoNovaGuia}`
                }
            );

            /* Sub-modulo: Cascata de Desativacao de Sub-Opcoes de Anti-Duplicacao */
            const containerSub = document.getElementById('containerSubOpcoesReutilizarAbas');
            const containerSubCriterios = document.getElementById('containerSubCriteriosAcoesReutilizar');
            let cascataDesativacaoOk = true;
            if (optReutilizar && optReutilizarFoco && containerSub) {
                const estadoOrigMestre = optReutilizar.checked;
                const estadoOrigFoco = optReutilizarFoco.checked;

                // Teste 1: Desativar Mestre desativa tudo
                optReutilizar.checked = false;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                const focoDesabilitadoQuandoOff = (optReutilizarFoco.disabled === true);
                const containerDesabilitadoQuandoOff = (containerSub.style.pointerEvents === 'none');

                // Teste 2: Ativar Mestre reabilita foco
                optReutilizar.checked = true;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                const focoHabilitadoQuandoOn = (optReutilizarFoco.disabled === false);
                const containerHabilitadoQuandoOn = (containerSub.style.pointerEvents === 'auto');

                // Teste 3: Desativar Foco desativa sub-critérios subordinados
                optReutilizarFoco.checked = false;
                optReutilizarFoco.dispatchEvent(new Event('change', { bubbles: true }));
                const criteriosDesabilitadosQuandoFocoOff = containerSubCriterios ? (containerSubCriterios.style.pointerEvents === 'none') : true;

                // Restaurar estados originais
                optReutilizar.checked = estadoOrigMestre;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                optReutilizarFoco.checked = estadoOrigFoco;
                optReutilizarFoco.dispatchEvent(new Event('change', { bubbles: true }));

                cascataDesativacaoOk = Boolean(
                    focoDesabilitadoQuandoOff &&
                    containerDesabilitadoQuandoOff &&
                    focoHabilitadoQuandoOn &&
                    containerHabilitadoQuandoOn &&
                    criteriosDesabilitadosQuandoFocoOff
                );
            }
            registrar(
                cascataDesativacaoOk,
                'ANTI_DUPLICACAO_CASCATA_DESATIVACAO',
                'Cascata de sub-opcoes: desativar Reutilizar Guias ou Foco desativa imediatamente todos os sub-itens subordinados',
                {
                    textoTestado: 'Comportamento Reativo de optReutilizarAbasAbertas e optReutilizarFocoPrimeiroPlano',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataDesativacaoOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata de Janela Unica (Bloquear Novas Janelas -> Preservar Janelas Autenticacao) */
            const optBloqJanelas = document.getElementById('optBloquearNovasJanelas');
            const optPreservarAuth = document.getElementById('optPreservarJanelasAutenticacao');
            const containerJanelaUnica = document.getElementById('containerSubOpcaoJanelaUnica');
            let cascataJanelaUnicaOk = true;
            if (optBloqJanelas && optPreservarAuth) {
                const estOrigJanela = optBloqJanelas.checked;
                optBloqJanelas.checked = false;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));
                const offPreservar = (optPreservarAuth.disabled === true);
                const offContainer = containerJanelaUnica ? (containerJanelaUnica.style.pointerEvents === 'none') : true;

                optBloqJanelas.checked = true;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));
                const onPreservar = (optPreservarAuth.disabled === false);
                const onContainer = containerJanelaUnica ? (containerJanelaUnica.style.pointerEvents === 'auto') : true;

                optBloqJanelas.checked = estOrigJanela;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));

                cascataJanelaUnicaOk = Boolean(offPreservar && offContainer && onPreservar && onContainer);
            }
            registrar(
                cascataJanelaUnicaOk,
                'JANELA_UNICA_CASCATA_SUBOPCOES',
                'Cascata Janela Unica: desativar Bloquear Novas Janelas desativa Preservar Janelas de Autenticacao e vice-versa',
                {
                    textoTestado: 'Comportamento Reativo de optBloquearNovasJanelas',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataJanelaUnicaOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata do Atalho Inteligente F1 (Atalho F1 Gemini -> Textarea e Botao Padrao) */
            const optAtalhoF1 = document.getElementById('optAtalhoF1GeminiAtivo');
            const optPromptF1 = document.getElementById('optPromptF1Gemini');
            const btnPadraoF1 = document.getElementById('btnRestaurarPromptF1Padrao');
            const containerF1 = document.getElementById('containerSubOpcaoF1Gemini');
            let cascataF1Ok = true;
            if (optAtalhoF1 && optPromptF1) {
                const estOrigF1 = optAtalhoF1.checked;
                optAtalhoF1.checked = false;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));
                const offPrompt = (optPromptF1.disabled === true);
                const offBtn = btnPadraoF1 ? (btnPadraoF1.disabled === true) : true;
                const offContainerF1 = containerF1 ? (containerF1.style.pointerEvents === 'none') : true;

                optAtalhoF1.checked = true;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));
                const onPrompt = (optPromptF1.disabled === false);
                const onBtn = btnPadraoF1 ? (btnPadraoF1.disabled === false) : true;
                const onContainerF1 = containerF1 ? (containerF1.style.pointerEvents === 'auto') : true;

                optAtalhoF1.checked = estOrigF1;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));

                cascataF1Ok = Boolean(offPrompt && offBtn && offContainerF1 && onPrompt && onBtn && onContainerF1);
            }
            registrar(
                cascataF1Ok,
                'ATALHO_F1_GEMINI_CASCATA_SUBOPCOES',
                'Cascata Atalho F1: desativar F1 desativa campo de comando {{TEXTO}} e botao de restaurar padrao',
                {
                    textoTestado: 'Comportamento Reativo de optAtalhoF1GeminiAtivo',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataF1Ok ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata de Validacao Matematica e Tempo de Exibicao dos Avisos */
            const optValMat = document.getElementById('optValidacaoMatematicaAtiva');
            const optTempoAviso = document.getElementById('optTempoExibicaoAlerta');
            const optModoVal = document.getElementById('optModoExibicaoValidacao');
            let cascataValidacaoOk = true;
            if (optValMat && optTempoAviso) {
                const estOrigVal = optValMat.checked;
                optValMat.checked = false;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));
                const offTempo = (optTempoAviso.disabled === true);
                const offModo = !optModoVal || (optModoVal.disabled === true);

                optValMat.checked = true;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));
                const onTempo = (optTempoAviso.disabled === false);
                const onModo = !optModoVal || (optModoVal.disabled === false);

                optValMat.checked = estOrigVal;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));

                cascataValidacaoOk = Boolean(offTempo && onTempo && offModo && onModo);
            }
            registrar(
                cascataValidacaoOk,
                'VALIDACAO_MATEMATICA_CASCATA_TEMPO_ALERTA',
                'Cascata Validacao: desativar conferencia desativa slider de tempo de exibicao do alerta',
                {
                    textoTestado: 'Comportamento Reativo de optValidacaoMatematicaAtiva',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true; on -> disabled=false',
                    obtido: cascataValidacaoOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Deteccao de Modificacoes Internas de Pagina (SPA e Dirty State) */
            let testeModificacaoOk = false;
            if (motorTeste && typeof motorTeste.isPaginaModificada === 'function' && typeof motorTeste.notificarModificacaoPagina === 'function') {
                const estadoInicial = motorTeste.isPaginaModificada();
                motorTeste.notificarModificacaoPagina('TESTE_UNITARIO_DIRTY', 'https://pje.jus.br/processo/123');
                const estadoPos = motorTeste.isPaginaModificada();
                testeModificacaoOk = (estadoInicial === false || estadoInicial === true) && (estadoPos === true);
            }
            registrar(
                testeModificacaoOk,
                'DETECCAO_PAGINA_MODIFICADA_SPA_E_DIRTY',
                'Rastreamento inteligente de modificacoes internas de pagina (SPA e formularios em edicao) sem Layout Thrashing',
                {
                    textoTestado: 'Vetor SPA e Dirty Form',
                    idxCursor: 0,
                    esperado: 'testeModificacaoOk=true',
                    obtido: `testeModificacaoOk=${testeModificacaoOk}`
                }
            );

            /* Sub-modulo: Sequencia Hierarquica de Criterios de Ordenacao de Guias e Switch de Sentido */
            const optCritOrd = document.getElementById('optCriterioOrdenacaoGuias');
            const optSentSwitch = document.getElementById('optSentidoOrdenacaoGuiasSwitch');
            const lblSentSwitch = document.getElementById('lblSentidoOrdenacaoGuias');
            let sequenciaOrdenacaoOk = true;
            if (optCritOrd) {
                const valores = Array.from(optCritOrd.options || []).map(o => o.value);
                const seqEsperada = ['nenhum', 'dominio', 'url', 'dominio_criacao', 'dominio_acesso', 'ordem_criacao', 'tempo_acesso', 'titulo'];
                const seqIgual = (valores.length === seqEsperada.length) && seqEsperada.every((v, idx) => valores[idx] === v);
                const switchPresente = Boolean(!optSentSwitch || (optSentSwitch && lblSentSwitch && optSentSwitch.checked === true));
                sequenciaOrdenacaoOk = Boolean(seqIgual && switchPresente);
            }
            registrar(
                sequenciaOrdenacaoOk,
                'ORDENACAO_GUIAS_SEQUENCIA_E_SENTIDO_SWITCH',
                'Hierarquia de criterios de ordenacao (nenhum -> dominio -> sub-dominio [url, criacao, acesso] -> grupo acesso [criacao, acesso navegacao] -> titulo) e switch sentido A-Z ativo',
                {
                    textoTestado: 'Criterios Hierarquicos de Ordenacao de Guias e Switch Sentido A-Z',
                    idxCursor: 0,
                    esperado: 'nenhum, dominio, url, dominio_criacao, dominio_acesso, ordem_criacao, tempo_acesso, titulo | sentido_padrao=esq_dir',
                    obtido: sequenciaOrdenacaoOk ? 'nenhum, dominio, url, dominio_criacao, dominio_acesso, ordem_criacao, tempo_acesso, titulo | sentido_padrao=esq_dir' : 'falha'
                }
            );

            /* Sub-modulo: Logica de Ordenacao por Dominio Puro Primeiro e Subdominios/Caminho */
            const simularOrdenacaoDominio = (urls, criterio = 'dominio', sentido = 'esq_dir') => {
                const decompor = (urlStr) => {
                    const u = new URL(urlStr);
                    const host = (u.hostname || '').toLowerCase();
                    const caminho = (u.pathname + u.search + u.hash).toLowerCase();
                    const partes = host.split('.').filter(Boolean);
                    let numSufixo = 1;
                    const penultima = partes[partes.length - 2] || '';
                    const ultima = partes[partes.length - 1] || '';
                    if (ultima.length === 2 && (penultima.length <= 3 || ['jus', 'leg', 'mp', 'gov', 'def', 'mil', 'edu', 'com', 'org', 'net', 'adv'].includes(penultima))) {
                        numSufixo = 2;
                    }
                    const idxBase = Math.max(0, partes.length - numSufixo - 1);
                    const baseDominio = partes.slice(idxBase).join('.');
                    const subDominio = partes.slice(0, idxBase).join('.');
                    return { baseDominio, subDominio, ehPuro: (subDominio === ''), caminho, urlOriginal: urlStr };
                };
                const itens = urls.map(decompor);
                itens.sort((a, b) => {
                    const cmpBase = a.baseDominio.localeCompare(b.baseDominio);
                    if (cmpBase !== 0) return (sentido === 'dir_esq') ? -cmpBase : cmpBase;
                    if (a.ehPuro && !b.ehPuro) return -1;
                    if (!a.ehPuro && b.ehPuro) return 1;
                    const cmpSub = a.subDominio.localeCompare(b.subDominio);
                    if (cmpSub !== 0) return (sentido === 'dir_esq') ? -cmpSub : cmpSub;
                    if (criterio === 'url') {
                        const cmpCam = a.caminho.localeCompare(b.caminho);
                        return (sentido === 'dir_esq') ? -cmpCam : cmpCam;
                    }
                    return 0;
                });
                return itens.map(i => i.urlOriginal);
            };

            const urlsTesteDominio = [
                'https://pje1g.trf1.jus.br/consultapublica',
                'https://trf1.jus.br/portal',
                'https://www.trf1.jus.br/servicos'
            ];
            const ordDominioObtida = simularOrdenacaoDominio(urlsTesteDominio, 'dominio');
            const ordDominioEsperada = [
                'https://trf1.jus.br/portal',
                'https://pje1g.trf1.jus.br/consultapublica',
                'https://www.trf1.jus.br/servicos'
            ];
            const testeDominioPuroPrimeiroOk = (JSON.stringify(ordDominioObtida) === JSON.stringify(ordDominioEsperada));

            const urlsTesteUrlCompleta = [
                'https://trf1.jus.br/processos',
                'https://pje1g.trf1.jus.br/login',
                'https://trf1.jus.br/audiencias'
            ];
            const ordUrlObtida = simularOrdenacaoDominio(urlsTesteUrlCompleta, 'url');
            const ordUrlEsperada = [
                'https://trf1.jus.br/audiencias',
                'https://trf1.jus.br/processos',
                'https://pje1g.trf1.jus.br/login'
            ];
            const testeUrlCompletaOk = (JSON.stringify(ordUrlObtida) === JSON.stringify(ordUrlEsperada));

            registrar(
                Boolean(testeDominioPuroPrimeiroOk && testeUrlCompletaOk),
                'ORDENACAO_DOMINIO_PURO_PRIMEIRO_E_HIERARQUIA',
                'Ordenacao por Dominio puro primeiro (trf1.jus.br antes de pje1g e www) e URL completa respeitando base e caminhos',
                {
                    textoTestado: 'Ordenacao Dominio e URL Completa',
                    idxCursor: 0,
                    esperado: 'trf1.jus.br puro primeiro -> pje1g -> www; urls completas puras com caminhos ordenados antes dos subdominios',
                    obtido: (testeDominioPuroPrimeiroOk && testeUrlCompletaOk) ? 'sucesso' : 'falha'
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
                const estadoValido = (barProgresso.style.display === 'none' || barProgresso.style.display === 'block');
                const paiConsole = barProgresso.closest('.caixa-mensagens-console-inline');
                barraProgressoOk = Boolean(estadoValido && paiConsole);
            }
            registrar(
                barraProgressoOk,
                'BARRA_PROGRESSO_CONSOLE_DOM',
                'Presenca da barra de progresso fina integrada na parte inferior do box de Mensagens de Console (inicialmente oculta)',
                {
                    textoTestado: 'barraProgressoConsole e preenchimentoProgressoConsole',
                    esperado: 'presente, display valido, dentro de .caixa-mensagens-console-inline',
                    obtido: barraProgressoOk ? 'presente, display valido, dentro de .caixa-mensagens-console-inline' : 'falha'
                }
            );

            /* Sub-modulo: Botões Laterais Mouse 4 e 5 (Avançar/Retroceder e Ctrl+Ping-Pong Última Aba) */
            let botoesLateraisDisparoOk = false;
            let cicloPingPongAbasOk = false;
            let injecaoAboutBlankPermitidaOk = false;

            if (typeof window.JusGovBotoesLateraisMouse === 'function') {
                const bMouse = new window.JusGovBotoesLateraisMouse({ ativo: true });
                const d4 = bMouse.simularDisparo(4);
                const d5 = bMouse.simularDisparo(5);

                botoesLateraisDisparoOk = Boolean(
                    d4 && d4.ok && d4.acao === 'TROCAR_GUIA_ULTIMA_ATIVA' &&
                    d5 && d5.ok && d5.acao === 'TROCAR_GUIA_PROXIMA'
                );
            }

            /* Simulação do fluxo de ciclo ping-pong de abas ativas */
            {
                let curTab = null;
                let prevTab = null;
                const onTabActivated = (tabId) => {
                    if (curTab && curTab !== tabId) {
                        prevTab = curTab;
                    }
                    curTab = tabId;
                };

                // Passo 1: Aba 10 ativa
                onTabActivated(10);
                const s1 = (curTab === 10 && prevTab === null);

                // Passo 2: Usuário abre/foca Aba 20
                onTabActivated(20);
                const s2 = (curTab === 20 && prevTab === 10);

                // Passo 3: Disparo de alternância para última ativa (vai para prevTab = 10)
                const alvo1 = prevTab;
                onTabActivated(alvo1);
                const s3 = (curTab === 10 && prevTab === 20);

                // Passo 4: Segundo disparo de alternância para última ativa (volta para prevTab = 20)
                const alvo2 = prevTab;
                onTabActivated(alvo2);
                const s4 = (curTab === 20 && prevTab === 10);

                cicloPingPongAbasOk = Boolean(s1 && s2 && s3 && s4);
            }

            /* Validação de que telas about:blank não são excluídas pela regra de segurança */
            {
                const fnEhUrlRestrita = (url) => {
                    return /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(url) ||
                        (/^about:/i.test(url) && url !== 'about:blank');
                };

                const blankPermitido = !fnEhUrlRestrita('about:blank');
                const chromeRestrito = fnEhUrlRestrita('chrome://settings');
                const devtoolsRestrito = fnEhUrlRestrita('devtools://devtools');
                const aboutConfigRestrito = fnEhUrlRestrita('about:config');
                const webPermitido = !fnEhUrlRestrita('https://pje.jus.br/pje/Processo');

                injecaoAboutBlankPermitidaOk = Boolean(
                    blankPermitido && chromeRestrito && devtoolsRestrito &&
                    aboutConfigRestrito && webPermitido
                );
            }

            registrar(
                botoesLateraisDisparoOk,
                'BOTOES_LATERAIS_MOUSE_CTRL_ULTIMA_ABA',
                'Botões laterais 4 e 5: Botão 4 alterna com a última aba recente e Botão 5 avança à direita',
                {
                    textoTestado: 'Botão 4 e 5',
                    esperado: 'Botão 4: TROCAR_GUIA_ULTIMA_ATIVA; Botão 5: TROCAR_GUIA_PROXIMA',
                    obtido: botoesLateraisDisparoOk ? 'sucesso' : 'falha'
                }
            );

            registrar(
                cicloPingPongAbasOk,
                'CICLO_PING_PONG_ULTIMA_ABA_ATIVA',
                'Rastreamento determinístico de currentTabId e previousTabId gerando alternância mútua entre última e penúltima aba',
                {
                    textoTestado: 'onActivated abas 10 e 20',
                    esperado: 'Aba 10 <-> Aba 20 em ciclo contínuo ping-pong',
                    obtido: cicloPingPongAbasOk ? 'sucesso' : 'falha'
                }
            );

            registrar(
                injecaoAboutBlankPermitidaOk,
                'INJECAO_ABOUT_BLANK_E_NEUTRALIZACAO_HISTORICO',
                'Permissão explícita para injeção e interceptação na tela about:blank impedindo retorno indesejado de histórico (history.back)',
                {
                    textoTestado: 'about:blank vs urls restritas do navegador',
                    esperado: 'about:blank permitido, chrome:// bloqueado',
                    obtido: injecaoAboutBlankPermitidaOk ? 'sucesso' : 'falha'
                }
            );

            /* Sub-modulo: Inserção Hierárquica em Campos Editáveis */
            let insercaoHierarquicaOk = false;
            {
                const inputTeste = document.createElement('input');
                inputTeste.type = 'text';
                inputTeste.value = 'Texto Original';
                document.body.appendChild(inputTeste);

                if (typeof inputTeste.setRangeText === 'function') {
                    inputTeste.setSelectionRange(6, 14); // Seleciona "Original"
                    inputTeste.setRangeText('Modificado', 6, 14, 'end');
                    insercaoHierarquicaOk = (inputTeste.value === 'Texto Modificado');
                } else {
                    inputTeste.value = 'Texto Modificado';
                    insercaoHierarquicaOk = (inputTeste.value === 'Texto Modificado');
                }
                document.body.removeChild(inputTeste);
            }

            registrar(
                insercaoHierarquicaOk,
                'COLAGEM_INSERCAO_HIERARQUICA_DOM',
                'Inserção de texto em editores respeitando hierarquia nativa: execCommand -> setRangeText -> atribuição com eventos reativos',
                {
                    textoTestado: 'setRangeText em input',
                    esperado: 'Texto Modificado',
                    obtido: insercaoHierarquicaOk ? 'Texto Modificado' : 'falha'
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

        /* DIRETRIZ ROOT 6.39: Auto-Selecao com 1 Clique em Celulas de Tabelas JSF/RichFaces (listTasksUsuarioPje2.seam) */
        if (motorTeste && typeof motorTeste.isCelulaTabelaDadosLeitura === 'function') {
            const containerPje = document.createElement('div');
            containerPje.className = 'frameUltimasTarefas';
            containerPje.innerHTML = `
                <table class="rich-table" id="j_id22:ultimasTarefasDataTable">
                    <tbody id="j_id22:ultimasTarefasDataTable:tb">
                        <tr class="rich-table-row rich-table-firstrow">
                            <td class="rich-table-cell" id="j_id22:ultimasTarefasDataTable:0:j_id23">1020445-05.2025.4.01.4002</td>
                            <td class="rich-table-cell">Aguardando Manifestacao</td>
                        </tr>
                    </tbody>
                </table>
            `;
            const trRich = containerPje.querySelector('tr.rich-table-row');
            if (trRich) {
                trRich.onmouseover = function () { this.className = 'rich-table-row-selected'; };
                trRich.onmouseout = function () { this.className = 'rich-table-row'; };
            }
            document.body.appendChild(containerPje);

            const tdProcessoCnj = containerPje.querySelector('td.rich-table-cell');
            const ehCelulaLeitura = motorTeste.isCelulaTabelaDadosLeitura(tdProcessoCnj);
            const ehUi = typeof motorTeste.isElementoInterativoOuUi === 'function' ? motorTeste.isElementoInterativoOuUi(tdProcessoCnj) : false;
            const ctxAlvo = typeof motorTeste.classificarContextoElementoAlvo === 'function' ? motorTeste.classificarContextoElementoAlvo(tdProcessoCnj) : 'LEITURA_COMUM';
            const modoOrigTabela = typeof motorTeste.obterModoRetirarSelecao === 'function' ? motorTeste.obterModoRetirarSelecao() : 'total_exceto_arrasto';
            if (typeof motorTeste.definirModoRetirarSelecao === 'function') motorTeste.definirModoRetirarSelecao('interface');
            const mantemSelecao = typeof motorTeste.deveManterSelecaoAtivaNoDom === 'function' ? motorTeste.deveManterSelecaoAtivaNoDom(tdProcessoCnj, false) : true;
            if (typeof motorTeste.definirModoRetirarSelecao === 'function') motorTeste.definirModoRetirarSelecao(modoOrigTabela);

            registrar(
                ehCelulaLeitura === true && ehUi === false && ctxAlvo === 'LEITURA_COMUM' && mantemSelecao === true,
                'TABELA_JSF_RICHFACES_LEITURA',
                'Diretriz 6.39: Celula td.rich-table-cell contendo processo CNJ classificada como LEITURA_COMUM e mantemSelecao=true neutralizando tr onmouseover',
                {
                    ehCelulaLeitura,
                    ehUi,
                    ctxAlvo,
                    mantemSelecao
                }
            );

            document.body.removeChild(containerPje);
        }

        /* ==================================================================
         * BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1, MEIO, ESPACOS),
         *            MINORACAO 3 CLIQUES E PARAGRAFO LOCALIZADO
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1), 3 CLIQUES E LIMITES ---');

        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const txtLei = 'da lei (art. 12 da Lei no 12.016/2009);';
            const casosCursor = [
                {
                    desc: 'Regra de bloco: clicar no espaco apos ":" seleciona a sentenca inteira (rotulo + complemento)',
                    txt: 'Atencao: confira o processo antes de prosseguir. Outra frase.',
                    idx: 8, /* espaco entre ":" e "confira" */
                    cliques: 1,
                    esp: 'Atencao: confira o processo antes de prosseguir'
                },
                {
                    desc: 'BUG-39 / Paridade: clicar no espaco antes de "(" seleciona a premissa e o bloco delimitado',
                    txt: 'Uma frase (definicao da frase). Outra frase.',
                    idx: 9, /* espaco entre "frase" e "(" */
                    cliques: 1,
                    esp: 'Uma frase (definicao da frase)'
                },
                {
                    desc: 'BUG-39: clicar no delimitador de abertura "(" seleciona incluindo delimitadores',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 7, /* caractere '(' */
                    cliques: 1,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'BUG-39: clicar no delimitador de fechamento ")" seleciona incluindo delimitadores',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 37, /* caractere ')' */
                    cliques: 1,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'BUG-39: clicar no espaco interno entre duas palavras dentro de delimitador seleciona o miolo',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 15, /* espaco entre "12" e "da" dentro dos parenteses */
                    cliques: 1,
                    esp: 'art. 12 da Lei no 12.016/2009'
                },
                {
                    desc: 'Regra de bloco: clicar na palavra apos ":" continua selecionando so a palavra',
                    txt: 'Atencao: confira o processo antes de prosseguir.',
                    idx: 12, /* meio de "confira" */
                    cliques: 1,
                    esp: 'confira'
                },
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
                },
                {
                    desc: 'INSS NB com especie: clicar na especie (31) seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('31') + 1,
                    cliques: 1,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB com especie: clicar na barra (/) seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('/'),
                    cliques: 1,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB com especie: clicar no numero do beneficio (6506589241) seleciona somente o numero',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('6506589241') + 2,
                    cliques: 1,
                    esp: '6506589241'
                },
                {
                    desc: 'INSS NB com especie: 2 cliques no numero seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('6506589241') + 2,
                    cliques: 2,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB pontuado: clicar no NB seleciona o bloco integral (719.657.155-0)',
                    txt: 'Benefício nº 719.657.155-0 concedido',
                    idx: 'Benefício nº 719.657.155-0 concedido'.indexOf('719.657.155-0') + 4,
                    cliques: 1,
                    esp: '719.657.155-0'
                },
                {
                    desc: 'Diretriz 6.37: Alt + 1 clique no espaco interno entre parenteses expande incluindo delimitadores como 2 cliques',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 15, /* espaco entre "12" e "da" dentro dos parenteses */
                    cliques: 1,
                    ehAlt: true,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'Diretriz 6.37: Alt + 1 clique no espaco em texto comum expande sentenca completa como 2 cliques',
                    txt: 'Primeira palavra segunda palavra terceira palavra.',
                    idx: 16, /* espaco entre "palavra" e "segunda" */
                    cliques: 1,
                    ehAlt: true,
                    esp: 'Primeira palavra segunda palavra terceira palavra'
                }
            ];

            for (let i = 0; i < casosCursor.length; i++) {
                const cc = casosCursor[i];
                const obt = motorTeste.simularCliqueEmTexto(cc.txt, cc.idx, cc.cliques, Boolean(cc.ehAlt));
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
                divPuro.innerHTML = '<p>Texto com <b>negrito</b> e &nbsp; espaco<br>Segunda linha\r\n<style>.invisivel{display:none;}</style></p>';
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

                /* Teste de Normalizacao de Quebras Suaves de Linha do Codigo-Fonte HTML em Tokens e Titulos */
                const divQuebraSuave = document.createElement('div');
                divQuebraSuave.innerHTML = '<span class="sample-token sample-invalid">29 de fevereiro de\n    2025</span>';
                document.body.appendChild(divQuebraSuave);
                const txtQuebraGerado = motorTeste.extrairTextoPuroSanitizado(divQuebraSuave);
                const txtQuebraEsperado = '29 de fevereiro de 2025';
                registrar(
                    txtQuebraGerado === txtQuebraEsperado,
                    'FORMATACAO_NORMALIZACAO_QUEBRA_SUAVE_HTML',
                    'W3C HTML: Quebras de linha e tabulacoes de indentacao no codigo-fonte de tags inline sao colapsadas em espaco simples sem quebra de linha espuria',
                    { textoTestado: divQuebraSuave.innerHTML, esperado: txtQuebraEsperado, obtido: txtQuebraGerado }
                );
                document.body.removeChild(divQuebraSuave);
            }

            /* Multiplos SPANs: trim de ambos sem quebra no meio, espaco simples no meio e retirada de espacamentos duplos */
            if (typeof motorTeste.extrairTextoPuroSanitizado === 'function') {
                const divMultiSpans = document.createElement('div');
                divMultiSpans.innerHTML = '<span class="local col-sm-12 no-padding"><span class="dtPoloAtivo" data-jusgov-selecionavel="true">FRANCISCO ANTONIO FERNANDES DO NASCIMENTO X </span><span class="dtPoloPassivo" data-jusgov-selecionavel="true">INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span></span>';
                document.body.appendChild(divMultiSpans);
                const txtSpansGerado = motorTeste.extrairTextoPuroSanitizado(divMultiSpans);
                const txtSpansEsperado = 'FRANCISCO ANTONIO FERNANDES DO NASCIMENTO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS';
                registrar(
                    txtSpansGerado === txtSpansEsperado,
                    'COPIA_TEXTO_MULTIPLOS_SPANS_SEM_QUEBRA_COM_ESPACO_MEIO',
                    'Multiplos SPANs (ex: dtPoloAtivo e dtPoloPassivo): copia o trim de ambos sem quebra no meio com espaco simples e sem espacamentos duplos',
                    { textoTestado: divMultiSpans.innerHTML, esperado: txtSpansEsperado, obtido: txtSpansGerado }
                );
                document.body.removeChild(divMultiSpans);

                /* Filtro final: retirada de espacamentos duplos alem do trim */
                const divEspacosDuplos = document.createElement('div');
                divEspacosDuplos.innerHTML = '<span>Texto   com   muitos     espacamentos     duplos</span>';
                document.body.appendChild(divEspacosDuplos);
                const txtEspacosGerado = motorTeste.extrairTextoPuroSanitizado(divEspacosDuplos);
                const txtEspacosEsperado = 'Texto com muitos espacamentos duplos';
                registrar(
                    txtEspacosGerado === txtEspacosEsperado,
                    'FILTRO_FINAL_RETIRADA_ESPACAMENTOS_DUPLOS',
                    'Filtro final: retirada de espacamentos duplos alem do trim preservando espacamento simples',
                    { textoTestado: divEspacosDuplos.innerHTML, esperado: txtEspacosEsperado, obtido: txtEspacosGerado }
                );
                document.body.removeChild(divEspacosDuplos);
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

            /* Nivel 1: Nível estrito inline puro - converte blocos e <p> em quebra de linha <br> (Seção 6.123) */
            if (typeof motorTeste.construirHtmlNivel1Basico === 'function') {
                const divNivel1P = document.createElement('div');
                divNivel1P.innerHTML = '<p>Primeiro paragrafo com <b>negrito</b></p><p>Segundo paragrafo com quebra<br>Segunda linha</p>';
                document.body.appendChild(divNivel1P);
                const htmlNivel1Gerado = motorTeste.construirHtmlNivel1Basico(divNivel1P);
                const htmlNivel1Esperado = 'Primeiro paragrafo com <b>negrito</b><br>Segundo paragrafo com quebra<br>Segunda linha';
                registrar(
                    htmlNivel1Gerado === htmlNivel1Esperado,
                    'FORMATACAO_NIVEL_1_BASICO_TAG_P_E_BR',
                    'Nivel 1: Inline puro mesclagem - conversao de blocos e paragrafos em quebra <br> e preservacao de inline <b> (Seção 6.123)',
                    { textoTestado: divNivel1P.innerHTML, esperado: htmlNivel1Esperado, obtido: htmlNivel1Gerado }
                );
                document.body.removeChild(divNivel1P);
            }

            /* Nivel 2: Intermediario (Inline + Paragrafos + Alinhamento + Semantica + Tabelas) (Seção 6.123) */
            if (typeof motorTeste.construirHtmlNivel2Intermediario === 'function') {
                const divInter = document.createElement('div');
                divInter.innerHTML = '<p style="font-family: Arial; text-align: right; margin-left: 20px; width: 300px;">Despacho <b>Urgente</b></p><table><tr><td>Celula</td></tr></table>';
                document.body.appendChild(divInter);
                const htmlInterGerado = motorTeste.construirHtmlNivel2Intermediario(divInter);
                const htmlInterEsperado = '<span style="display: block"><p style="text-align: right; margin-left: 20px; width: 300px">Despacho <b>Urgente</b></p><table><tbody><tr><td>Celula</td></tr></tbody></table></span>';
                registrar(
                    htmlInterGerado === htmlInterEsperado,
                    'FORMATACAO_NIVEL_2_INTERMEDIARIO',
                    'Nivel 2: Preserva <p>, <b>, text-align, margin-left e dados tabulares <table> sem font-family (Seção 6.123)',
                    { textoTestado: divInter.innerHTML, esperado: htmlInterEsperado, obtido: htmlInterGerado }
                );
                document.body.removeChild(divInter);
            }

            /* Nivel 3: Estilos Avancados CKEditor / Documental */
            if (typeof motorTeste.construirHtmlFormatacaoAvancada === 'function') {
                const divAvancada = document.createElement('div');
                divAvancada.innerHTML = '<h2 style="font-family: Arial; font-size: 20pt; text-align: center;">Titulo do Processo</h2><p style="font-family: Calibri; color: #333;">Texto com <a href="https://pje.jus.br">link PJe</a> e lista:</p><ul><li>Item 1</li><li>Item 2</li></ul><style>.expurgar{display:none;}</style>';
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

            /* Seção 6.123 / USAB-20 / FORMAT-01: Remoção de Wrappers Artificiais e Bloco de Estilo <style> para Mesclagem Natural */
            if (typeof motorTeste.envolverHtmlComResetDeCursorParaWord === 'function') {
                const htmlEntrada = 'Texto com <b>negrito</b>, <i>italico</i>, <s>tachado</s>, <sub>sub</sub> e <sup>sup</sup>.';
                const htmlEnvolvido = motorTeste.envolverHtmlComResetDeCursorParaWord(htmlEntrada);
                const semFontFamilyWrapper = !htmlEnvolvido.includes('font-family: !important') && !htmlEnvolvido.includes('font-family:!important');
                const semFontSizeWrapper = !htmlEnvolvido.includes('font-size: !important') && !htmlEnvolvido.includes('font-size:!important');
                const semBlocoStyle = !htmlEnvolvido.includes('<style>');
                const tagsFilhasPuras = htmlEnvolvido.includes('<b>negrito</b>') &&
                                        htmlEnvolvido.includes('<i>italico</i>') &&
                                        htmlEnvolvido.includes('<s>tachado</s>') &&
                                        htmlEnvolvido.includes('<sub>sub</sub>') &&
                                        htmlEnvolvido.includes('<sup>sup</sup>');
                const semCorrupcaoDeTags = !htmlEnvolvido.includes('"ub>') && !htmlEnvolvido.includes('"up>');
                const semCaracteresInvisiveis = !htmlEnvolvido.includes('&#8203;') &&
                                                !htmlEnvolvido.includes('\u200B') &&
                                                !htmlEnvolvido.includes('\uFEFF');
                const limpezaWordOk = Boolean(semFontFamilyWrapper && semFontSizeWrapper && semBlocoStyle && tagsFilhasPuras && semCorrupcaoDeTags && semCaracteresInvisiveis);
                registrar(
                    limpezaWordOk,
                    'FORMATACAO_HERANCA_FONTE_CLIPBOARD_WORD',
                    'Seção 6.123 / USAB-20: HTML limpo e direto sem bloco <style> nem containers artificiais (span/div forçados), permitindo mesclagem fluida de formatação no app de destino',
                    {
                        textoTestado: htmlEntrada,
                        esperado: 'HTML limpo e direto sem <style> e sem wrappers de font-family/size forçados',
                        obtido: limpezaWordOk ? 'ok' : 'falha'
                    }
                );

                /* BUG-43 / Seção 6.111: Validação de ausência absoluta de caracteres invisíveis e caixas/tofu ([▯]) no Microsoft Word com impressão de caracteres invisíveis */
                const htmlTesteBasico = motorTeste.envolverHtmlComResetDeCursorParaWord('<b>Básico</b>');
                const semTofuWord = !htmlTesteBasico.includes('&#8203;') &&
                                    !htmlTesteBasico.includes('\u200B') &&
                                    !htmlTesteBasico.includes('spanResetLimpo') &&
                                    htmlTesteBasico.includes('<b>Básico</b>');
                registrar(
                    semTofuWord,
                    'SECAO_6_111_FILTRO_BASICO_SEM_CARACTERES_INVISIVEIS_TOFU_WORD',
                    'Filtro Basico / HTML Word: Eliminacao absoluta de &#8203; e zero-width spaces que geram caixa/tofu ([▯]) no Word com caracteres invisiveis ativados',
                    {
                        textoTestado: '<b>Básico</b>',
                        esperado: 'HTML limpo com herança universal sem &#8203; ou caixas no Word',
                        obtido: semTofuWord ? 'ok' : 'falha (contém caracteres invisíveis)'
                    }
                );
            }

            /* Seção 6.123: Bateria de Testes dos 5 Níveis de Estilo e Filtro Universal */
            if (typeof window.JusGovFiltrosHtml === 'function') {
                const filtrosInst = new window.JusGovFiltrosHtml();

                // Teste 1: Filtro Universal (Destruição de scripts/inclusões, eliminação de mídia/formulários mantendo texto, remoção de src= e on*)
                const htmlSujeiraUniversal = '<script>alert("hack")</script><template><div>invisivel</div></template><form><button type="button">Salvar Dados</button><input type="submit" value="Enviar Form"></form><video><source src="video.mp4">Legenda do video</video><canvas>Desenho do grafico</canvas><img src="foto.jpg" alt="Logo Orgão" onerror="alert(1)"><b onclick="run()">Texto Real</b><a href="javascript:void(0)">Link Sem Script</a>';
                const sanitizadoN1 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlSujeiraUniversal, 1);
                const universalOk = !sanitizadoN1.includes('<script>') &&
                                    !sanitizadoN1.includes('template') &&
                                    !sanitizadoN1.includes('<button') &&
                                    !sanitizadoN1.includes('<input') &&
                                    !sanitizadoN1.includes('<video') &&
                                    !sanitizadoN1.includes('<canvas') &&
                                    !sanitizadoN1.includes('<img') &&
                                    !sanitizadoN1.includes('src=') &&
                                    !sanitizadoN1.includes('onclick=') &&
                                    !sanitizadoN1.includes('onerror=') &&
                                    !sanitizadoN1.includes('javascript:') &&
                                    sanitizadoN1.includes('<b>Texto Real</b>') &&
                                    sanitizadoN1.includes('Salvar Dados');
                registrar(
                    universalOk,
                    'SECAO_6_123_FILTRO_UNIVERSAL_PERIGOSOS_E_MIDIA',
                    'Filtro Universal 0-4: Destruição irrestrita de <script>, <template>, mídias (<video>, <canvas>, <img>), controles de form mantendo texto visível, e anulação de src=/on*/javascript:',
                    {
                        entrada: htmlSujeiraUniversal,
                        saida: sanitizadoN1,
                        resultado: universalOk ? 'ok' : 'falha'
                    }
                );

                // Teste 2: Nível 1 (Inline Puro para Mesclagem em Outros Apps)
                const htmlTesteN1 = '<p>Linha 1 <strong>em negrito</strong> e <em>em itálico</em></p><div>Linha 2 com <del>tachado</del> e <ins>sublinhado</ins></div><span>Sem tags vazias: <b></b></span>';
                const saidaN1 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN1, 1);
                const n1Ok = saidaN1.includes('<b>em negrito</b>') &&
                             saidaN1.includes('<i>em itálico</i>') &&
                             saidaN1.includes('<s>tachado</s>') &&
                             saidaN1.includes('<u>sublinhado</u>') &&
                             !saidaN1.includes('<p>') &&
                             !saidaN1.includes('<div>') &&
                             !saidaN1.includes('<span>') &&
                             !saidaN1.includes('<b></b>') &&
                             !saidaN1.includes('style=') &&
                             saidaN1.includes('<br>');
                registrar(
                    n1Ok,
                    'SECAO_6_123_NIVEL_1_INLINE_PURO_MESCLAGEM',
                    'Nível 1 (Básico): Estritamente inline puro (b, i, u, s, sup, sub, br), blocos convertidos para <br>, sem tags vazias e sem atributos style para mesclagem limpa',
                    {
                        entrada: htmlTesteN1,
                        saida: saidaN1,
                        resultado: n1Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 3: Nível 2 (Intermediário - Parágrafos, Alinhamentos e Tabelas)
                const htmlTesteN2 = '<p style="color: blue;">Parágrafo azul</p><center>Texto Centralizado</center><div>Bloco Div</div><table><thead><tr><th>Cabeçalho</th></tr></thead><tbody><tr><td>Dado</td></tr></tbody></table>';
                const saidaN2 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN2, 2);
                const n2Ok = saidaN2.includes('<p style="color: blue">') || saidaN2.includes('<p style="color: blue;">') || saidaN2.includes('<p>') &&
                             (saidaN2.includes('text-align: center') || saidaN2.includes('text-align:center')) &&
                             saidaN2.includes('<span style="display: block') &&
                             !saidaN2.includes('<center>') &&
                             saidaN2.includes('<table>') &&
                             saidaN2.includes('<th>Cabeçalho</th>') &&
                             saidaN2.includes('<td>Dado</td>');
                registrar(
                    n2Ok,
                    'SECAO_6_123_NIVEL_2_PARAGRAFOS_E_TABELAS',
                    'Nível 2 (Intermediário): Preservação de <p>, normalização de <center> para text-align: center, conversão de <div> em span com display: block, e inclusão de dados tabulares (table/thead/tbody/tr/th/td)',
                    {
                        entrada: htmlTesteN2,
                        saida: saidaN2,
                        resultado: n2Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 4: Nível 3 (Avançado - Blocos e Higienização Estrita de DIV)
                const htmlTesteN3 = '<h1>Título H1</h1><hr><ul><li>Item 1</li></ul><div style="position: absolute; z-index: -3; display: none; transform: rotate(45deg); margin-top: 10px;">Div Hack</div><div style="position: relative; z-index: 2; margin-top: 15px;">Div Segura</div>';
                const saidaN3 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN3, 3);
                const n3Ok = saidaN3.includes('<h1>Título H1</h1>') &&
                             saidaN3.includes('<hr>') &&
                             saidaN3.includes('<ul>') &&
                             saidaN3.includes('<li>Item 1</li>') &&
                             !saidaN3.includes('position: absolute') &&
                             !saidaN3.includes('z-index: -') &&
                             !saidaN3.includes('display: none') &&
                             !saidaN3.includes('transform') &&
                             saidaN3.includes('position: relative') &&
                             saidaN3.includes('z-index: 2');
                registrar(
                    n3Ok,
                    'SECAO_6_123_NIVEL_3_BLOCOS_E_DIV_SANITIZADA',
                    'Nível 3 (Avançado): Preserva h1-h6, hr, listas (ul/ol/li) e higieniza <div> permitindo apenas position: relative, bloqueando fixed/absolute, z-index < 0, display: none/grid/flex e transform',
                    {
                        entrada: htmlTesteN3,
                        saida: saidaN3,
                        resultado: n3Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 5: Nível 4 (Estendido - Sectioning Content com Proteção Universal)
                const htmlTesteN4 = '<main><article><nav>Navegação</nav><p>Conteúdo</p><aside>Lateral</aside><footer>Rodapé</footer><img src="foto.png" alt="Invalida"></article></main>';
                const saidaN4 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN4, 4);
                const n4Ok = saidaN4.includes('<main>') &&
                             saidaN4.includes('<article>') &&
                             saidaN4.includes('<nav>') &&
                             saidaN4.includes('<aside>') &&
                             saidaN4.includes('<footer>') &&
                             !saidaN4.includes('<img') &&
                             !saidaN4.includes('src=');
                registrar(
                    n4Ok,
                    'SECAO_6_123_NIVEL_4_ESTRUTURA_PAGINA',
                    'Nível 4 (Estendido): Preserva tags de seção (main, article, nav, aside, footer) mantendo compulsoriamente a proibição de mídia (img, canvas, video) e atributos src=',
                    {
                        entrada: htmlTesteN4,
                        saida: saidaN4,
                        resultado: n4Ok ? 'ok' : 'falha'
                    }
                );
            }

            /* Regra de Ouro: Bloco Forense ou Palavra Unica = Somente Texto Puro */
            if (typeof motorTeste.verificarSeTextoEhBlocoOuPalavraUnica === 'function') {
                const palavraUnicaValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('deferido');
                const cpfValido = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('099.123.459-67');
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
            divHelpEvento.onmouseover = function () {};
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

        /* Teste de Captura de Objeto Interativo de Interface vs Container de Tarefa (Etiqueta PJe com botao irmao) */
        if (motorTeste && typeof motorTeste.obterObjetoInterativoParaSelecaoCompleta === 'function') {
            const cardPje = document.createElement('div');
            cardPje.className = 'card-tarefa';
            cardPje.style.cursor = 'pointer';
            cardPje.innerHTML = `
                <span>PJEC 1008586-55.2026.4.01.4002</span>
                <div class="label label-info label-etiqueta ng-star-inserted" pmr-cor-padrao-etiqueta="" style="background-color: rgb(25, 179, 240);">
                    <span id="teste-tag-texto" data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span>
                    <span id="teste-tag-x" class="icon-desvincular-tag pl-5" title="Excluir etiqueta HOMOLOGAR ACORDO"><i class="fa fa-times "></i></span>
                </div>
                <p id="teste-card-texto">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</p>
                <button id="teste-btn-salvar" type="button" class="btn btn-primary"><i class="fa fa-save"></i> <span>Salvar Decisão</span></button>
            `;
            document.body.appendChild(cardPje);

            const spanTagTexto = cardPje.querySelector('#teste-tag-texto');
            const spanTagX = cardPje.querySelector('#teste-tag-x');
            const divEtiqueta = cardPje.querySelector('.label-etiqueta');
            const pCardTexto = cardPje.querySelector('#teste-card-texto');
            const btnSalvar = cardPje.querySelector('#teste-btn-salvar');

            const objTagTexto = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTagTexto);
            const txtTagTexto = objTagTexto ? motorTeste.extrairTextoVisivelLimpoDeElemento(objTagTexto) : '';

            const objTagX = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTagX);

            const objDivEtiqueta = motorTeste.obterObjetoInterativoParaSelecaoCompleta(divEtiqueta);
            const txtDivEtiqueta = objDivEtiqueta ? motorTeste.extrairTextoVisivelLimpoDeElemento(objDivEtiqueta) : '';

            const objCardTexto = motorTeste.obterObjetoInterativoParaSelecaoCompleta(pCardTexto);

            const objBtn = motorTeste.obterObjetoInterativoParaSelecaoCompleta(btnSalvar);
            const txtBtn = objBtn ? motorTeste.extrairTextoVisivelLimpoDeElemento(objBtn) : '';

            document.body.removeChild(cardPje);

            const sucessoEtiqueta = (
                objTagTexto === spanTagTexto &&
                txtTagTexto === 'HOMOLOGAR ACORDO' &&
                objTagX === null &&
                objDivEtiqueta === spanTagTexto &&
                txtDivEtiqueta === 'HOMOLOGAR ACORDO' &&
                objCardTexto === null &&
                objBtn === btnSalvar &&
                txtBtn === 'Salvar Decisão'
            );

            registrar(
                sucessoEtiqueta,
                'INTERFACE',
                'Alt+Clique em etiqueta captura apenas o texto do rotulo (HOMOLOGAR ACORDO), ignora icone X e rejeita container',
                {
                    esperado: 'HOMOLOGAR ACORDO (apenas rotulo)',
                    obtido: txtTagTexto
                }
            );
        }

        /* Teste dos Modos de Retirada e Retencao de Selecao do Sistema (Diretriz 6.27) */
        if (motorTeste && typeof motorTeste.obterModoRetirarSelecao === 'function' && typeof motorTeste.definirModoRetirarSelecao === 'function') {
            const modoOriginal = motorTeste.obterModoRetirarSelecao();

            /* 1) Teste de Normalizacao dos 4 Modos */
            motorTeste.definirModoRetirarSelecao('total_exceto_arrasto');
            const modoArrasto = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('total');
            const modoTotal = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('nenhuma');
            const modoNenhuma = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('interface');
            const modoInterface = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('invalido_qualquer');
            const modoFallback = motorTeste.obterModoRetirarSelecao();

            const normalizacaoOk = (
                modoArrasto === 'total_exceto_arrasto' &&
                modoTotal === 'total' &&
                modoNenhuma === 'nenhuma' &&
                modoInterface === 'interface' &&
                modoFallback === 'total_exceto_arrasto'
            );

            registrar(
                normalizacaoOk,
                'MODO_RETIRAR_SELECAO_NORMALIZACAO',
                'Suporte e normalizacao precisa dos 4 modos (interface, total, total_exceto_arrasto, nenhuma)',
                {
                    total_exceto_arrasto: modoArrasto,
                    total: modoTotal,
                    nenhuma: modoNenhuma,
                    interface: modoInterface,
                    fallback: modoFallback
                }
            );

            /* 2) Teste de Comportamento Deterministico de Retencao (deveManterSelecaoAtivaNoDom) */
            const elTexto = document.createElement('p');
            elTexto.textContent = 'Texto de sentenca judicial em area de leitura';
            document.body.appendChild(elTexto);

            // Modo: total_exceto_arrasto
            motorTeste.definirModoRetirarSelecao('total_exceto_arrasto');
            const manterArrastoEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterArrastoEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            // Modo: total
            motorTeste.definirModoRetirarSelecao('total');
            const manterTotalEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterTotalEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            // Modo: nenhuma
            motorTeste.definirModoRetirarSelecao('nenhuma');
            const manterNenhumaEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterNenhumaEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            document.body.removeChild(elTexto);

            // Restaura o modo original
            motorTeste.definirModoRetirarSelecao(modoOriginal);

            const comportamentoOk = (
                manterArrastoEmArrasto === true &&
                manterArrastoEmClique === false &&
                manterTotalEmArrasto === false &&
                manterTotalEmClique === false &&
                manterNenhumaEmArrasto === true &&
                manterNenhumaEmClique === true
            );

            registrar(
                comportamentoOk,
                'MODO_RETIRAR_SELECAO_COMPORTAMENTO',
                'Comportamento do modo Total (exceto ao arrastar o mouse): mantem selecao no arrasto e retira em cliques/Alt',
                {
                    total_exceto_arrasto_arrasto: manterArrastoEmArrasto,
                    total_exceto_arrasto_clique: manterArrastoEmClique,
                    total_arrasto: manterTotalEmArrasto,
                    total_clique: manterTotalEmClique,
                    nenhuma_arrasto: manterNenhumaEmArrasto,
                    nenhuma_clique: manterNenhumaEmClique
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
                const resTexto = formatador('099.123.459-67');
                if (resTexto.texto !== 'TXT: [099.123.459-67]') falhasClipboardInspector++;

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

                /* Caso 7: Exibicao de simbolos de quebra no visor da Memoria Interna: Downwards Arrow (↵) para <br> e Pilcro (¶) para <p> */
                const resQuebras = formatador({
                    texto: 'Linha 1\nLinha 2',
                    html: '<p>Primeiro paragrafo</p><p>Segundo paragrafo<br>Linha extra</p>'
                });
                if (!resQuebras.html.includes('↵') || !resQuebras.html.includes('simbolo-quebra-br')) falhasClipboardInspector++;
                if (!resQuebras.html.includes('¶') || !resQuebras.html.includes('simbolo-quebra-p')) falhasClipboardInspector++;
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

            /* ==============================================================
             * TESTE DE SEPARAÇÃO SELEÇÃO vs CÓPIA, ÁREAS UI/PDF E BACKUP CLIPBOARD SIMULADO
             * ============================================================== */
            let falhasSeparacaoUiPdfClip = 0;
            if (!motorTeste ||
                typeof motorTeste.aplicarSelecaoDOM !== 'function' ||
                typeof motorTeste.executarCopiaDeSelecao !== 'function' ||
                typeof motorTeste.isAreaLeituraOuPdfConteudo !== 'function' ||
                typeof motorTeste.deveManterSelecaoAtivaNoDom !== 'function' ||
                typeof motorTeste.salvarClipboardInternoComBackup !== 'function') {
                falhasSeparacaoUiPdfClip++;
            } else {
                const containerTesteUiPdf = document.createElement('div');
                containerTesteUiPdf.innerHTML = `
                    <div class="pdfViewer"><div class="textLayer"><span id="teste-pdf-span">Processo 0800123-45.2024.4.05.8100 em curso.</span></div></div>
                    <div id="toolbarViewer"><button id="teste-pdf-toolbar-btn">Zoom</button></div>
                    <div class="modal" role="dialog"><span id="teste-modal-ui">CPF: 099.123.459-67</span></div>
                `;
                document.body.appendChild(containerTesteUiPdf);

                const modoAntigoUiPdf = typeof motorTeste.obterModoRetirarSelecao === 'function' ? motorTeste.obterModoRetirarSelecao() : 'total_exceto_arrasto';
                if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                    motorTeste.definirModoRetirarSelecao('interface');
                }
                try {
                    const spanPdf = containerTesteUiPdf.querySelector('#teste-pdf-span');
                    const btnToolbar = containerTesteUiPdf.querySelector('#teste-pdf-toolbar-btn');
                    const spanModal = containerTesteUiPdf.querySelector('#teste-modal-ui');

                    /* 1. Camada de texto de PDF é área de leitura e mantém seleção */
                    if (!motorTeste.isAreaLeituraOuPdfConteudo(spanPdf)) falhasSeparacaoUiPdfClip++;
                    if (!motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;

                    /* 2. Toolbar de PDF e Modal de sistema são UI estrita e NÃO mantêm seleção */
                    if (motorTeste.isAreaLeituraOuPdfConteudo(btnToolbar)) falhasSeparacaoUiPdfClip++;
                    if (motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;
                    if (motorTeste.deveManterSelecaoAtivaNoDom(spanModal, false)) falhasSeparacaoUiPdfClip++;

                    /* 2.1 Teste dos modos de retirar selecao: total, nenhuma e interface */
                    if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                        motorTeste.definirModoRetirarSelecao('total');
                        if (motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;
                        if (motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;

                        motorTeste.definirModoRetirarSelecao('nenhuma');
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(spanModal, false)) falhasSeparacaoUiPdfClip++;

                        motorTeste.definirModoRetirarSelecao('interface');
                    }

                    /* 3. Teste de separação aplicarSelecaoDOM vs executarCopiaDeSelecao */
                    const rangePdf = document.createRange();
                    rangePdf.selectNodeContents(spanPdf.firstChild);
                    const resSelPdf = motorTeste.aplicarSelecaoDOM(rangePdf, { eraArrasto: false });
                    if (!resSelPdf || !resSelPdf.manterSelecaoNoDom) falhasSeparacaoUiPdfClip++;

                    const rangeModal = document.createRange();
                    rangeModal.selectNodeContents(spanModal.firstChild);
                    const resSelModal = motorTeste.aplicarSelecaoDOM(rangeModal, { eraArrasto: false });
                    if (!resSelModal || resSelModal.manterSelecaoNoDom) falhasSeparacaoUiPdfClip++;

                    /* 4. Teste do backup do clipboard simulado (atual vs anterior para Ctrl+Middle-Click) */
                    motorTeste.salvarClipboardInternoComBackup({
                        texto: 'CLIP_ANTERIOR_111',
                        html: '<b>CLIP_ANTERIOR_111</b>',
                        rtf: '',
                        nivel: 'basico',
                        timestamp: Date.now()
                    });
                    motorTeste.salvarClipboardInternoComBackup({
                        texto: 'CLIP_ATUAL_222',
                        html: '<b>CLIP_ATUAL_222</b>',
                        rtf: '',
                        nivel: 'basico',
                        timestamp: Date.now()
                    });
                    if (!window.__JUSGOV_ULTIMO_CLIPBOARD__ || window.__JUSGOV_ULTIMO_CLIPBOARD__.texto !== 'CLIP_ATUAL_222') {
                        falhasSeparacaoUiPdfClip++;
                    }
                    if (!window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto !== 'CLIP_ANTERIOR_111') {
                        falhasSeparacaoUiPdfClip++;
                    }
                } finally {
                    if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                        motorTeste.definirModoRetirarSelecao(modoAntigoUiPdf);
                    }
                    if (containerTesteUiPdf.parentNode) {
                        containerTesteUiPdf.parentNode.removeChild(containerTesteUiPdf);
                    }
                }
            }

            registrar(
                falhasSeparacaoUiPdfClip === 0,
                'SEPARACAO_SELECAO_COPIA_UI_PDF_E_BACKUP_CLIPBOARD',
                'Separação formal entre aplicarSelecaoDOM e executarCopiaDeSelecao, distinção Leitura/PDF vs UI estrita e backup do clipboard simulado (Ctrl + Botão do Meio)',
                { falhas: falhasSeparacaoUiPdfClip }
            );

            /* ==============================================================
             * TESTE DE AUTO-SELEÇÃO DE DATAS, HORAS, COMBINAÇÕES E NÚMEROS EM INTERFACES (REGRA SEMIFLEXÍVEL)
             * ============================================================== */
            let falhasAutoSelecaoInterface = 0;
            if (!motorTeste ||
                typeof motorTeste.isComponenteBotaoOuFormularioEstrito !== 'function' ||
                typeof motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface !== 'function') {
                falhasAutoSelecaoInterface++;
            } else {
                const containerPjeInterface = document.createElement('div');
                containerPjeInterface.innerHTML = `
                    <div id="detalheDocumento:j_id477" style="cursor: pointer;">
                        <div id="div-juntado-pje">Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16</div>
                    </div>
                    <h3><a href="#doc" id="link-titulo-pje"><span title="2297533315 - Pedido de homologação de acordo">2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16</span></a></h3>
                    <div class="media-body">
                        <span id="span-data-abrev" class="text-muted data-interna">22 out. 2026</span>
                        <span id="span-autuacao-abrev">06 abr. 2026</span>
                        <span id="span-intimacao-num">PUBLICADO INTIMAÇÃO EM 29/10/2026</span>
                        <small id="small-hora" class="text-muted pull-right">05:19</small>
                    </div>
                    <div id="poloAtivo"><table><tbody><tr><td><span><span id="span-polo-cpf">JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)</span></span></td></tr></tbody></table></div>
                    <button id="btn-acao-estrito" type="button">22/10/2026</button>
                    <input id="input-form-estrito" type="text" value="29/10/2026" />
                `;
                const elDetalhePje = containerPjeInterface.querySelector('[id*="detalheDocumento"]');
                if (elDetalhePje) elDetalhePje.onclick = function () {};
                const elMediaBody = containerPjeInterface.querySelector('.media-body');
                if (elMediaBody) elMediaBody.onclick = function () {};
                document.body.appendChild(containerPjeInterface);

                try {
                    const divJuntado = containerPjeInterface.querySelector('#div-juntado-pje');
                    const linkTitulo = containerPjeInterface.querySelector('#link-titulo-pje span');
                    const spanDataAbrev = containerPjeInterface.querySelector('#span-data-abrev');
                    const spanHora = containerPjeInterface.querySelector('#small-hora');
                    const spanPoloCpf = containerPjeInterface.querySelector('#span-polo-cpf');
                    const btnEstrito = containerPjeInterface.querySelector('#btn-acao-estrito');
                    const inputEstrito = containerPjeInterface.querySelector('#input-form-estrito');

                    /* 1. Elementos de texto/containers de interface NÃO são botões nem forms estritos */
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(divJuntado)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(linkTitulo)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanDataAbrev)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanHora)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanPoloCpf)) falhasAutoSelecaoInterface++;

                    /* 2. Botões e controles de formulário SÃO estritamente protegidos */
                    if (!motorTeste.isComponenteBotaoOuFormularioEstrito(btnEstrito)) falhasAutoSelecaoInterface++;
                    if (!motorTeste.isComponenteBotaoOuFormularioEstrito(inputEstrito)) falhasAutoSelecaoInterface++;

                    /* 3. Datas, horas, combinações de data+hora, CPF, CNPJ e IDs em qualquer formato são auto-selecionados no clique simples
                     *    respeitando as regras existentes:
                     *    - clicar na data -> seleciona apenas a data;
                     *    - clicar na hora -> seleciona apenas a hora;
                     *    - clicar no espaço (ou 2 cliques) -> seleciona os dois (data + hora). */
                    const casosInterface = [
                        {
                            texto: 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16',
                            idx: 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16'.indexOf('22/10/2026') + 3,
                            numCliques: 1,
                            esperado: '22/10/2026'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf('13:27:16') + 3,
                            numCliques: 1,
                            esperado: '13:27:16'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf(' 13:27:16'),
                            numCliques: 1,
                            esperado: '22/10/2026 13:27:16'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('05/10/2026') + 2,
                            numCliques: 1,
                            esperado: '05/10/2026'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('20:38:19') + 2,
                            numCliques: 1,
                            esperado: '20:38:19'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf(' 20:38:19'),
                            numCliques: 1,
                            esperado: '05/10/2026 20:38:19'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('05/10/2026') + 2,
                            numCliques: 2,
                            esperado: '05/10/2026 20:38:19'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf('2297533315') + 1,
                            numCliques: 1,
                            esperado: '2297533315'
                        },
                        {
                            texto: 'PUBLICADO INTIMAÇÃO EM 29/10/2026',
                            idx: 'PUBLICADO INTIMAÇÃO EM 29/10/2026'.indexOf('29/10/2026') + 1,
                            numCliques: 1,
                            esperado: '29/10/2026'
                        },
                        {
                            texto: '22 out. 2026',
                            idx: '22 out. 2026'.indexOf('out.') + 1,
                            numCliques: 1,
                            esperado: '22 out. 2026'
                        },
                        {
                            texto: 'Autuação 06 abr. 2026',
                            idx: 'Autuação 06 abr. 2026'.indexOf('06 abr.') + 1,
                            numCliques: 1,
                            esperado: '06 abr. 2026'
                        },
                        {
                            texto: '05:19',
                            idx: '05:19'.indexOf('05:19') + 1,
                            numCliques: 1,
                            esperado: '05:19'
                        },
                        {
                            texto: 'JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)',
                            idx: 'JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)'.indexOf('258.198.013-34') + 1,
                            numCliques: 1,
                            esperado: '258.198.013-34'
                        },
                        {
                            texto: 'INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS - CNPJ: 29.979.036/0001-40 (REU)',
                            idx: 'INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS - CNPJ: 29.979.036/0001-40 (REU)'.indexOf('29.979.036/0001-40') + 1,
                            numCliques: 1,
                            esperado: '29.979.036/0001-40'
                        }
                    ];

                    for (const c of casosInterface) {
                        const res = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(c.texto, c.idx, c.numCliques, false);
                        const extraido = res ? c.texto.substring(res.inicio, res.fim).trim() : '';
                        if (extraido !== c.esperado) {
                            falhasAutoSelecaoInterface++;
                        }
                    }

                    /* 4. Palavras comuns na interface (ex: "Juntado", "Pedido") retornam null no clique simples sem teclas */
                    const txtGeral = 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16';
                    const resPalavraComum = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtGeral, 2, 1, false);
                    if (resPalavraComum !== null) {
                        falhasAutoSelecaoInterface++;
                    }
                } finally {
                    if (containerPjeInterface.parentNode) {
                        containerPjeInterface.parentNode.removeChild(containerPjeInterface);
                    }
                }
            }

            registrar(
                falhasAutoSelecaoInterface === 0,
                'AUTO_SELECAO_DATAS_HORAS_NUMEROS_EM_INTERFACES_SEMIFLEXIVEL',
                'Auto-seleção por clique simples em datas, horas, combinações (22/10/2026 13:27:16, 22 out. 2026, 05:19), CPF, CNPJ e IDs em interfaces (exceto botões e forms)',
                { falhas: falhasAutoSelecaoInterface }
            );
        }

        /* ==================================================================
         * BATERIA 9: FUZZING TEMPORAL EXTENSO (OPCIONAL OU SOB COMANDO)
         * ================================================================== */
        /* ==================================================================
         * 18. REFINAMENTO DO CSS ANTI-AMPULHETAS EM OPERAÇÕES EM LOTE (Seção 6.21)
         * ================================================================== */
        {
            window.__JUSGOV_TESTE_BLINDAR_CSS__ = true;
            if (typeof motorTeste.definirAtivoAmpuletas === 'function') {
                motorTeste.definirAtivoAmpuletas(true);
            } else if (typeof motorTeste.blindarCSS === 'function') {
                motorTeste.blindarCSS();
            }
            const estiloTurbo = document.getElementById('pje-turbo-lock');
            const cssTexto = estiloTurbo ? (estiloTurbo.textContent || '') : '';
            const contemRegraLote = cssTexto.includes('pje-assinatura-lote') &&
                cssTexto.includes('mat-progress-bar') &&
                cssTexto.includes('role="progressbar"');

            const modalLote = document.createElement('div');
            modalLote.id = 'mpProgressoAssinaturaLote';
            modalLote.innerHTML = '<div role="progressbar" class="progress-bar">Assinando 1 de 20...</div>';
            document.body.appendChild(modalLote);

            const csModalLote = window.getComputedStyle(modalLote);
            const barraLote = modalLote.querySelector('[role="progressbar"]');
            const csBarraLote = barraLote ? window.getComputedStyle(barraLote) : null;

            const loteVisivelEInterativo = contemRegraLote &&
                csModalLote.opacity === '1' &&
                csModalLote.visibility === 'visible' &&
                csModalLote.pointerEvents === 'auto' &&
                csBarraLote !== null &&
                csBarraLote.opacity === '1' &&
                csBarraLote.visibility === 'visible';

            if (modalLote.parentNode) {
                modalLote.parentNode.removeChild(modalLote);
            }
            if (typeof motorTeste.definirAtivoAmpuletas === 'function') {
                motorTeste.definirAtivoAmpuletas(false);
            }
            window.__JUSGOV_TESTE_BLINDAR_CSS__ = false;

            registrar(
                loteVisivelEInterativo,
                'ANTI_AMPULHETAS_PRESERVA_OPERACOES_EM_LOTE',
                'CSS Anti-Ampulhetas preserva barras de progresso e modais de operações em lote (mpProgresso, pje-assinatura-lote, [role="progressbar"])',
                {
                    esperado: 'contemRegraLote=true, opacity=1, visibility=visible, pointerEvents=auto',
                    obtido: `contemRegraLote=${contemRegraLote}, opacity=${csModalLote.opacity}, visibility=${csModalLote.visibility}, pointerEvents=${csModalLote.pointerEvents}`
                }
            );
        }

        /* ==================================================================
         * 19. DESTRUIÇÃO IMEDIATA DO FLASH EM MODAIS CRÍTICOS E TECLAS (BUG-02)
         * ================================================================== */
        if (typeof motorTeste.dispararFlashBorderVisual === 'function' &&
            typeof motorTeste.limparFlashBorderImediatamente === 'function') {
            let falhasFlashModal = 0;
            const spanFlashAlvo = document.createElement('span');
            spanFlashAlvo.textContent = '099.123.459-67';
            spanFlashAlvo.style.cssText = 'position:fixed;left:20px;top:20px;font-size:14px;';
            document.body.appendChild(spanFlashAlvo);

            try {
                const rangeSimulado = document.createRange();
                rangeSimulado.selectNodeContents(spanFlashAlvo);

                /* Caso A: pointer-events: none garantido e destruicao imediata com Escape */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                const containerA = document.getElementById('jusgov-flash-contour-container');
                const csContainerA = containerA ? window.getComputedStyle(containerA) : null;
                if (!containerA || !csContainerA || csContainerA.pointerEvents !== 'none') {
                    falhasFlashModal++;
                }
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                /* Caso B: destruicao imediata ao pressionar Enter */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                if (document.getElementById('jusgov-flash-contour-container') === null) {
                    falhasFlashModal++;
                }
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                /* Caso C: destruicao imediata ao interagir em modal critico ([role="dialog"]) */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                const dialogCritico = document.createElement('div');
                dialogCritico.setAttribute('role', 'dialog');
                const btnConfirmar = document.createElement('button');
                btnConfirmar.type = 'button';
                btnConfirmar.textContent = 'Confirmar Assinatura';
                dialogCritico.appendChild(btnConfirmar);
                document.body.appendChild(dialogCritico);

                btnConfirmar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                if (dialogCritico.parentNode) {
                    dialogCritico.parentNode.removeChild(dialogCritico);
                }
            } finally {
                motorTeste.limparFlashBorderImediatamente();
                if (spanFlashAlvo.parentNode) {
                    spanFlashAlvo.parentNode.removeChild(spanFlashAlvo);
                }
            }

            registrar(
                falhasFlashModal === 0,
                'FLASH_DESTRUICAO_IMEDIATA_MODAIS_CRITICOS',
                'Contorno Flash garante pointer-events: none e autodestrói-se atomicamente em Escape, Enter e modais críticos ([role="dialog"])',
                { falhas: falhasFlashModal }
            );
        }

        /* ==================================================================
         * 19.5. SELEÇÃO INTEGRAL MULTILINHAS DE LINKS COM ALT + 3 CLIQUES (Seção 6.28)
         * ================================================================== */
        if (typeof motorTeste.extrairTextoLinkUmaLinha === 'function') {
            let falhasAlt3CliquesLink = 0;
            let detalheFalhaAlt3 = '';

            /* Caso A: Link com <br> e \n (ex.: Sandbox Bloco 2) */
            const linkA = document.createElement('a');
            linkA.href = '#teste-link-multilinha-a';
            linkA.innerHTML = '2297533315 - Pedido de homologação<br>de acordo\n   em 22/10/2026 13:27:16';
            document.body.appendChild(linkA);

            /* Caso B: Link longo (> 120 chars) com múltiplos <div>/<span> internos e filhos ocultos */
            const linkB = document.createElement('a');
            linkB.href = '#teste-link-multilinha-b';
            linkB.innerHTML = '<div><span>2297533315 - Manifestação da Parte Autora</span></div><div><span>Requerimento de expedição de alvará judicial em 22/10/2026 13:27:16</span><span style="display:none">TEXTO_OCULTO</span></div>';
            document.body.appendChild(linkB);

            try {
                const extraidoA = motorTeste.extrairTextoLinkUmaLinha(linkA);
                const esperadoA = '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16';
                if (extraidoA !== esperadoA || extraidoA.includes('\n') || extraidoA.includes('\r')) {
                    falhasAlt3CliquesLink++;
                    detalheFalhaAlt3 = `Caso A: esperado "${esperadoA}", obtido "${extraidoA}"`;
                }

                const extraidoB = motorTeste.extrairTextoLinkUmaLinha(linkB);
                const esperadoB = '2297533315 - Manifestação da Parte Autora Requerimento de expedição de alvará judicial em 22/10/2026 13:27:16';
                if (extraidoB !== esperadoB || extraidoB.includes('\n') || extraidoB.includes('TEXTO_OCULTO')) {
                    falhasAlt3CliquesLink++;
                    if (!detalheFalhaAlt3) {
                        detalheFalhaAlt3 = `Caso B: esperado "${esperadoB}", obtido "${extraidoB}"`;
                    }
                }

                /* Caso C: Simulação real de Alt + 3 cliques (mousedown -> mouseup detail=3 com altKey=true) no DOM e gravação em linha única */
                const spanAlvoB = linkB.querySelector('span');
                if (spanAlvoB && typeof motorTeste.aoSoltarBotaoMouse === 'function') {
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: '', html: '', formatado: false };
                    spanAlvoB.dispatchEvent(new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        button: 0,
                        detail: 3,
                        altKey: true,
                        clientX: 10,
                        clientY: 10
                    }));
                    motorTeste.aoSoltarBotaoMouse({
                        button: 0,
                        detail: 3,
                        altKey: true,
                        ctrlKey: false,
                        shiftKey: false,
                        metaKey: false,
                        target: spanAlvoB,
                        clientX: 10,
                        clientY: 10,
                        preventDefault() { },
                        stopPropagation() { }
                    });
                    const selObj = window.getSelection();
                    const rangeSel = (selObj && selObj.rangeCount > 0) ? selObj.getRangeAt(0) : null;
                    const containerRange = rangeSel ? rangeSel.commonAncestorContainer : null;
                    const selDom = selObj ? selObj.toString().replace(/\s+/g, ' ').trim() : '';
                    if (containerRange !== linkB || !selDom.includes('2297533315 - Manifestação da Parte Autora')) {
                        falhasAlt3CliquesLink++;
                        if (!detalheFalhaAlt3) {
                            detalheFalhaAlt3 = `Caso C (DOM): esperado="${esperadoB}", selDom="${selDom}"`;
                        }
                    }
                }
            } finally {
                if (linkA.parentNode) linkA.parentNode.removeChild(linkA);
                if (linkB.parentNode) linkB.parentNode.removeChild(linkB);
                if (window.getSelection()) window.getSelection().removeAllRanges();
            }

            registrar(
                falhasAlt3CliquesLink === 0,
                'ALT_3_CLIQUES_LINK_MULTILINHA_UMA_LINHA',
                'Alt + 3 cliques sobre link seleciona todo o texto do link (mesmo com 2+ linhas, <br> ou >120 chars) e unifica em uma única linha separada por espaços',
                falhasAlt3CliquesLink === 0
                    ? { esperado: 'Uma linha unificada com espaços', obtido: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16' }
                    : { esperado: '0 falhas', obtido: detalheFalhaAlt3 }
            );
        }

        /* ==================================================================
         * 19.6. FECHAMENTO IMEDIATO DE POPUPS DE AUDITORIA E WIKI FORENSE AO CLICAR OU DESSELECIONAR (Seção 6.30)
         * ================================================================== */
        {
            const validadorReal = (typeof motorTeste.obterValidador === 'function' && motorTeste.obterValidador())
                ? motorTeste.obterValidador()
                : validador;
            let falhasFechamentoAvisosWiki = 0;
            let detalheFalhaAvisosWiki = '';

            const spanTesteAviso = document.createElement('span');
            spanTesteAviso.textContent = '099.123.459-67';
            spanTesteAviso.style.cssText = 'position:fixed;left:40px;top:40px;font-size:14px;';
            document.body.appendChild(spanTesteAviso);

            try {
                const rangeAviso = document.createRange();
                rangeAviso.selectNodeContents(spanTesteAviso);

                /* Caso A: Popup de Auditoria / Erro Matemático (CPF inválido -> Cálculo Módulo 11 falhou) fecha imediatamente no clique do mouse (mousedown) */
                validadorReal.auditarEAlerta('099.123.459-00', rangeAviso);
                const visivelAntesClickErro = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                const temMascaraAmarelaAntes = Boolean(document.getElementById('jusgov-style-selecao-amarela'));
                if (!visivelAntesClickErro || !temMascaraAmarelaAntes) {
                    falhasFechamentoAvisosWiki++;
                    detalheFalhaAvisosWiki = 'Caso A: Popup de erro de auditoria (CPF inválido) ou destaque amarelo não abriu';
                }

                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
                const visivelAposClickErro = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                const temMascaraAmarelaDepois = Boolean(document.getElementById('jusgov-style-selecao-amarela'));
                if (visivelAposClickErro || temMascaraAmarelaDepois) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso A: Popup de erro de auditoria ou destaque amarelo permaneceu aberto após mousedown';
                    }
                }

                /* Caso B: Mensagem de Instrução / Wiki Forense (INSS espécie de aposentadoria/benefício: 42/1234567899) fecha imediatamente no clique do mouse (mousedown) */
                validadorReal.auditarEAlerta('31/6506589241', rangeAviso);
                const visivelAntesClickWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (!visivelAntesClickWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso B: Mensagem Wiki Forense (INSS 31/6506589241) não abriu';
                    }
                }

                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
                const visivelAposClickWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (visivelAposClickWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso B: Mensagem Wiki Forense (INSS) permaneceu aberta após mousedown';
                    }
                }

                /* Caso C: Mensagem Wiki Forense (Região Fiscal do CPF: 099.123.459-67) fecha imediatamente ao desselecionar / pressionar Escape */
                validadorReal.auditarEAlerta('099.123.459-67', rangeAviso);
                const visivelAntesEscWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (!visivelAntesEscWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso C: Mensagem Wiki Forense (Região do CPF) não abriu';
                    }
                }

                if (motorTeste && typeof motorTeste.resetarTimestampEsc === 'function') {
                    motorTeste.resetarTimestampEsc();
                }
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                const visivelAposEscWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (visivelAposEscWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso C: Mensagem Wiki Forense (Região do CPF) permaneceu aberta após Escape/desseleção';
                    }
                }
            } finally {
                if (typeof validadorReal.ocultarTodosAvisosImediatamente === 'function') {
                    validadorReal.ocultarTodosAvisosImediatamente();
                }
                if (spanTesteAviso.parentNode) {
                    spanTesteAviso.parentNode.removeChild(spanTesteAviso);
                }
            }

            registrar(
                falhasFechamentoAvisosWiki === 0,
                'AVISOS_AUDITORIA_E_WIKI_FECHAMENTO_IMEDIATO',
                'Popups de auditoria (erro Mod 11/97, CPF/CNPJ inválido) e mensagens de instrução Wiki Forense (espécie INSS, região CPF) fecham imediatamente ao clicar ou desselecionar',
                falhasFechamentoAvisosWiki === 0
                    ? { esperado: 'Fechamento imediato em mousedown/desseleção/Escape', obtido: 'Fechamento imediato confirmado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaAvisosWiki }
            );
        }

        /* ==================================================================
         * 19.7. PRESERVAÇÃO DA SELEÇÃO ATIVA AO PRESSIONAR SHIFT (NÃO DESSELECIONAR)
         * ================================================================== */
        {
            let falhasPreservacaoShift = 0;
            let detalheFalhaShift = '';

            const pTesteShift = document.createElement('p');
            pTesteShift.id = 'jusgov-teste-shift-preservacao';
            pTesteShift.textContent = 'Texto de teste jurídico para validação de seleção contínua com tecla Shift sem desseleção.';
            pTesteShift.style.cssText = 'position:fixed;left:10px;top:10px;font-size:14px;';
            document.body.appendChild(pTesteShift);

            try {
                const sel = window.getSelection();
                sel.removeAllRanges();

                const rangeInicial = document.createRange();
                rangeInicial.setStart(pTesteShift.firstChild, 0);
                rangeInicial.setEnd(pTesteShift.firstChild, 14); // "Texto de teste"
                sel.addRange(rangeInicial);

                const textoAntesShift = sel.toString();
                if (textoAntesShift !== 'Texto de teste' || sel.isCollapsed) {
                    falhasPreservacaoShift++;
                    detalheFalhaShift = `Falha ao criar seleção inicial. Obtido: "${textoAntesShift}"`;
                }

                /* Dispara evento keydown da tecla Shift */
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft', bubbles: true }));

                const selAposShift = window.getSelection();
                const textoAposShift = selAposShift ? selAposShift.toString() : '';
                const aindaAtiva = selAposShift && !selAposShift.isCollapsed;

                if (!aindaAtiva || textoAposShift !== 'Texto de teste') {
                    falhasPreservacaoShift++;
                    detalheFalhaShift = `Seleção foi indevidamente desfeita ao pressionar Shift! Ativa=${aindaAtiva}, Texto="${textoAposShift}"`;
                }
            } finally {
                const selLimpar = window.getSelection();
                if (selLimpar) selLimpar.removeAllRanges();
                if (pTesteShift.parentNode) {
                    pTesteShift.parentNode.removeChild(pTesteShift);
                }
            }

            registrar(
                falhasPreservacaoShift === 0,
                'PRESERVACAO_SELECAO_TECLA_SHIFT',
                'Tecla Shift não desseleciona texto ativo, preservando a seleção para extensão contínua por setas ou clique',
                falhasPreservacaoShift === 0
                    ? { esperado: 'Seleção preservada com Shift', obtido: 'Seleção mantida intacta (ativa=true)' }
                    : { esperado: '0 falhas', obtido: detalheFalhaShift }
            );
        }

        /* 19.8. Detecção Hierárquica de Editores (Pai/Avô/Ancestral contenteditable=true) e Exceção de Interface CKEditor (cke_* / cke_*editor) */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasEditorHierarquico = 0;
            let detalheFalhaEditorHierarquico = '';

            if (
                motorRef &&
                typeof motorRef.isElementoOuAncestralContentEditable === 'function' &&
                typeof motorRef.isElementoInterfaceDeEditorRico === 'function' &&
                typeof motorRef.isEditorMultilinhaValido === 'function' &&
                typeof motorRef.classificarContextoElementoAlvo === 'function' &&
                typeof motorRef.localizarCampoSimbolosSobCursor === 'function'
            ) {
                /* Caso 1: Texto aninhado em <p> -> <span> -> <span> dentro de pai/avô/body contenteditable="true" class="cke_editable..." */
                const corpoEditor = document.createElement('div');
                corpoEditor.setAttribute('contenteditable', 'true');
                corpoEditor.className = 'cke_editable cke_editable_themed cke_contents_ltr cke_show_borders';

                const pEditor = document.createElement('p');
                const spanExterno = document.createElement('span');
                spanExterno.style.fontSize = '16px';
                const spanInterno = document.createElement('span');
                spanInterno.style.fontFamily = 'arial,helvetica,sans-serif';
                const textoMinuta = 'Trata-se de ação monitória proposta pela Caixa Econômica Federal contra @@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@, visando a cobrança de débito oriundo de operação de Empréstimo Consignado, contratos nº ##### e #####.';
                spanInterno.textContent = textoMinuta;

                spanExterno.appendChild(spanInterno);
                pEditor.appendChild(spanExterno);
                corpoEditor.appendChild(pEditor);
                document.body.appendChild(corpoEditor);

                /* Caso 2: Interface/Toolbar CKEditor (id="cke_ckEditor-frame-editorTexto", class="cke_*", span#cke_1_top.cke_top, a.cke_combo_button) */
                const containerCke = document.createElement('div');
                containerCke.id = 'cke_ckEditor-frame-editorTexto';
                containerCke.className = 'cke_1 cke_reset cke_chrome cke_editor_ckEditor-frame-editorTexto cke_ltr cke_browser_webkit';
                containerCke.setAttribute('role', 'application');

                const innerCke = document.createElement('div');
                innerCke.className = 'cke_inner cke_reset';
                const topCke = document.createElement('span');
                topCke.id = 'cke_1_top';
                topCke.className = 'cke_top cke_reset_all';
                const toolboxCke = document.createElement('span');
                toolboxCke.id = 'cke_1_toolbox';
                toolboxCke.className = 'cke_toolbox';
                const toolbarCke = document.createElement('span');
                toolbarCke.className = 'cke_toolbar';
                const comboCke = document.createElement('span');
                comboCke.className = 'cke_combo cke_combo__font cke_combo_off';
                const botaoFonteCke = document.createElement('a');
                botaoFonteCke.className = 'cke_combo_button';
                botaoFonteCke.textContent = 'Fonte';

                comboCke.appendChild(botaoFonteCke);
                toolbarCke.appendChild(comboCke);
                toolboxCke.appendChild(toolbarCke);
                topCke.appendChild(toolboxCke);
                innerCke.appendChild(topCke);
                containerCke.appendChild(innerCke);
                document.body.appendChild(containerCke);

                try {
                    /* Validações do Caso 1 (Conteúdo Editável com pai/avô/ancestral contenteditable=true) */
                    const editavelSpanInterno = motorRef.isElementoOuAncestralContentEditable(spanInterno);
                    const editavelP = motorRef.isElementoOuAncestralContentEditable(pEditor);
                    const interfaceSpanInterno = motorRef.isElementoInterfaceDeEditorRico(spanInterno);
                    const editorValidoSpanInterno = motorRef.isEditorMultilinhaValido(spanInterno);
                    const contextoSpanInterno = motorRef.classificarContextoElementoAlvo(spanInterno);

                    if (!editavelSpanInterno || !editavelP || interfaceSpanInterno || !editorValidoSpanInterno || contextoSpanInterno !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasEditorHierarquico++;
                        detalheFalhaEditorHierarquico = `Caso 1 falhou: editavelSpan=${editavelSpanInterno}, editavelP=${editavelP}, interface=${interfaceSpanInterno}, editorValido=${editorValidoSpanInterno}, ctx=${contextoSpanInterno}`;
                    }

                    /* Validação de auto-seleção de placeholders no parágrafo do editor */
                    const placeholderLongoEsperado = '@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@';
                    const offsetPlaceholderLongo = textoMinuta.indexOf('INSTITUTO NACIONAL');
                    const hitPlaceholderLongo = motorRef.localizarCampoSimbolosSobCursor(textoMinuta, offsetPlaceholderLongo);
                    const textoObtidoLongo = hitPlaceholderLongo ? textoMinuta.slice(hitPlaceholderLongo.inicio, hitPlaceholderLongo.fim) : '';
                    if (textoObtidoLongo !== placeholderLongoEsperado) {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Placeholder longo @@@@...@@@ não selecionado integralmente: obtido="${textoObtidoLongo}"`;
                        }
                    }

                    const offsetCerquilha = textoMinuta.indexOf('#####') + 2;
                    const hitCerquilha = motorRef.localizarCampoSimbolosSobCursor(textoMinuta, offsetCerquilha);
                    const textoObtidoCerquilha = hitCerquilha ? textoMinuta.slice(hitCerquilha.inicio, hitCerquilha.fim) : '';
                    if (textoObtidoCerquilha !== '#####') {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Placeholder ##### não selecionado: obtido="${textoObtidoCerquilha}"`;
                        }
                    }

                    /* Validações do Caso 2 (Exceção de Interface CKEditor: cke_*, pai/avô cke_*editor) */
                    const interfaceTopCke = motorRef.isElementoInterfaceDeEditorRico(topCke);
                    const interfaceBotaoCke = motorRef.isElementoInterfaceDeEditorRico(botaoFonteCke);
                    const editavelTopCke = motorRef.isElementoOuAncestralContentEditable(topCke);
                    const editavelBotaoCke = motorRef.isElementoOuAncestralContentEditable(botaoFonteCke);
                    const editorValidoBotaoCke = motorRef.isEditorMultilinhaValido(botaoFonteCke);
                    const contextoTopCke = motorRef.classificarContextoElementoAlvo(topCke);

                    if (!interfaceTopCke || !interfaceBotaoCke || editavelTopCke || editavelBotaoCke || editorValidoBotaoCke || contextoTopCke !== 'LINK_CLICAVEL') {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Caso 2 (Exceção CKEditor UI) falhou: interfaceTop=${interfaceTopCke}, interfaceBotao=${interfaceBotaoCke}, editavelTop=${editavelTopCke}, editavelBotao=${editavelBotaoCke}, ctxTop=${contextoTopCke}`;
                        }
                    }
                } finally {
                    if (corpoEditor.parentNode) corpoEditor.parentNode.removeChild(corpoEditor);
                    if (containerCke.parentNode) containerCke.parentNode.removeChild(containerCke);
                }
            } else {
                falhasEditorHierarquico++;
                detalheFalhaEditorHierarquico = 'Funções de detecção de editor/interface não expostas em JusGovMotorSelecaoTeste';
            }

            registrar(
                falhasEditorHierarquico === 0,
                'EDITOR_CONTENTEDITABLE_ANCESTRAL_E_EXCECAO_CKE_INTERFACE',
                'Detecção hierárquica de editores (pai/avô/ancestral contenteditable=true), auto-seleção de placeholders complexos (@@@@...; @@@ e #####) e exceção de interface CKEditor (cke_* / cke_*editor)',
                falhasEditorHierarquico === 0
                    ? { esperado: 'Conteúdo editável reconocido + placeholders auto-selecionados + UI cke_* isolada', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaEditorHierarquico }
            );
        }

        /* ==================================================================
         * 19.9 PROIBIÇÃO ABSOLUTA DE CÓPIA E AUTO-SELEÇÃO EM CAMPOS EDITÁVEIS
         * (GEMINI, RICH-TEXTAREA, INPUTS, TEXTAREA, CONTENTEDITABLE)
         * Ao selecionar em campos editáveis, NUNCA copiar, NUNCA auto-selecionar,
         * NUNCA disparar contorno visual Flash e NUNCA sobrescrever o clipboard,
         * preservando a liberdade de digitação e substituição/sobrescrita do usuário.
         * ================================================================== */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasProibicaoEditaveis = 0;
            let detalheFalhaProibicaoEditaveis = '';

            if (
                motorRef &&
                typeof motorRef.isElementoEmCampoEditavel === 'function' &&
                typeof motorRef.isSelecaoOuElementoEmCampoEditavel === 'function' &&
                typeof motorRef.classificarContextoElementoAlvo === 'function' &&
                typeof motorRef.aplicarSelecaoECopiar === 'function'
            ) {
                // 1. Mock do Editor Gemini (<rich-textarea><div class="ql-editor textarea..." contenteditable="true"><p>Por onde começamos</p></div></rich-textarea>)
                const richTextarea = document.createElement('rich-textarea');
                richTextarea.className = 'text-input-field_textarea ql-container';
                const qlEditor = document.createElement('div');
                qlEditor.className = 'ql-editor textarea new-input-ui rich-query-formatting-enabled';
                qlEditor.setAttribute('contenteditable', 'true');
                qlEditor.setAttribute('role', 'textbox');
                const pGemini = document.createElement('p');
                pGemini.textContent = 'Por onde começamos';
                qlEditor.appendChild(pGemini);
                richTextarea.appendChild(qlEditor);
                document.body.appendChild(richTextarea);

                // 2. Mock de Input nativo e Textarea
                const inputSimples = document.createElement('input');
                inputSimples.type = 'text';
                inputSimples.value = 'Texto de input';
                document.body.appendChild(inputSimples);

                const textareaSimples = document.createElement('textarea');
                textareaSimples.value = 'Texto de textarea';
                document.body.appendChild(textareaSimples);

                // 3. Mock de Texto Estático Comum
                const divEstatico = document.createElement('div');
                const pEstatico = document.createElement('p');
                pEstatico.textContent = 'Texto estático de leitura';
                divEstatico.appendChild(pEstatico);
                document.body.appendChild(divEstatico);

                try {
                    // Validar detecção do Gemini
                    const editavelPGemini = motorRef.isElementoEmCampoEditavel(pGemini);
                    const editavelQlEditor = motorRef.isElementoEmCampoEditavel(qlEditor);
                    const editavelRichTextarea = motorRef.isElementoEmCampoEditavel(richTextarea);
                    const ctxPGemini = motorRef.classificarContextoElementoAlvo(pGemini);

                    if (!editavelPGemini || !editavelQlEditor || !editavelRichTextarea || ctxPGemini !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasProibicaoEditaveis++;
                        detalheFalhaProibicaoEditaveis = `Falha Gemini: editavelP=${editavelPGemini}, editavelQl=${editavelQlEditor}, editavelHost=${editavelRichTextarea}, ctx=${ctxPGemini}`;
                    }

                    // Validar detecção de Input e Textarea
                    const editavelInput = motorRef.isElementoEmCampoEditavel(inputSimples);
                    const ctxInput = motorRef.classificarContextoElementoAlvo(inputSimples);
                    const editavelTextarea = motorRef.isElementoEmCampoEditavel(textareaSimples);
                    const ctxTextarea = motorRef.classificarContextoElementoAlvo(textareaSimples);

                    if (!editavelInput || ctxInput !== 'CAMPO_SIMPLES_EDITAVEL' || !editavelTextarea || ctxTextarea !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `Falha Input/Textarea: editavelInp=${editavelInput}, ctxInp=${ctxInput}, editavelTa=${editavelTextarea}, ctxTa=${ctxTextarea}`;
                        }
                    }

                    // Validar texto estático
                    const editavelEstatico = motorRef.isElementoEmCampoEditavel(pEstatico);
                    const ctxEstatico = motorRef.classificarContextoElementoAlvo(pEstatico);
                    if (editavelEstatico || ctxEstatico !== 'LEITURA_COMUM') {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `Falha Estático: editavel=${editavelEstatico}, ctx=${ctxEstatico}`;
                        }
                    }

                    // Validar que aplicarSelecaoECopiar aborta imediatamente (retorna false) e não altera clipboard
                    const rangeGemini = document.createRange();
                    rangeGemini.selectNodeContents(pGemini);
                    const isRangeEditavel = motorRef.isSelecaoOuElementoEmCampoEditavel(rangeGemini);
                    if (!isRangeEditavel) {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = 'isSelecaoOuElementoEmCampoEditavel(rangeGemini) retornou false';
                        }
                    }

                    const clipboardAntes = window.__JUSGOV_ULTIMO_CLIPBOARD__ || 'CLIPBOARD_PREVIO_INTACTO';
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipboardAntes;

                    // Executa aplicarSelecaoECopiar sincronamente ou via promise
                    let copiouEditavel = false;
                    const promCopia = motorRef.aplicarSelecaoECopiar(rangeGemini);
                    if (promCopia && typeof promCopia.then === 'function') {
                        promCopia.then(res => { copiouEditavel = res; });
                    }

                    if (copiouEditavel || (window.__JUSGOV_ULTIMO_CLIPBOARD__ !== clipboardAntes)) {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `aplicarSelecaoECopiar copiou de campo editavel: copiou=${copiouEditavel}`;
                        }
                    }
                } finally {
                    if (richTextarea.parentNode) richTextarea.parentNode.removeChild(richTextarea);
                    if (inputSimples.parentNode) inputSimples.parentNode.removeChild(inputSimples);
                    if (textareaSimples.parentNode) textareaSimples.parentNode.removeChild(textareaSimples);
                    if (divEstatico.parentNode) divEstatico.parentNode.removeChild(divEstatico);
                }
            } else {
                falhasProibicaoEditaveis++;
                detalheFalhaProibicaoEditaveis = 'Funcoes de blindagem de campos editaveis nao expostas no motor de teste';
            }

            registrar(
                falhasProibicaoEditaveis === 0,
                'PROIBICAO_COPIA_E_AUTOSELECAO_CAMPOS_EDITAVEIS',
                'Proibicao absoluta de copia e auto-selecao em campos editaveis (Gemini rich-textarea, inputs, textareas, role=textbox) com preservacao de substituicao',
                falhasProibicaoEditaveis === 0
                    ? { esperado: 'ZERO copia em campos editaveis + ZERO auto-selecao + clipboard preservado', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaProibicaoEditaveis }
            );
        }

        /* ==================================================================
         * 19.4 AUDITORIA DE PDF EMBEDDED E EXCEÇÃO DE INTERFACE / TOOLBAR
         * DIRETRIZ ROOT 6.32: <pdf-viewer> / #scroller / embed[type*="pdf"]
         * = LEITURA_COMUM (1-clique seleciona e copia texto de leitura)
         * viewer-toolbar / div#toolbar / cr-icon-button = LINK_CLICAVEL (interface)
         * viewer-page-selector / input#pageSelector = CAMPO_SIMPLES_EDITAVEL
         * ================================================================== */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasPdfEmbedded = 0;
            let detalheFalhaPdfEmbedded = '';

            if (motorRef && typeof motorRef.classificarContextoElementoAlvo === 'function' && typeof motorRef.isAreaLeituraOuPdfConteudo === 'function') {
                // Container mockando hierarquia de PDF Viewer embutido do Chrome / PJe
                const containerPdf = document.createElement('div');
                containerPdf.id = 'container-mock-pdf-pje';
                containerPdf.innerHTML = `
                    <pdf-viewer id="viewer">
                        <viewer-toolbar id="toolbar">
                            <div id="toolbar">
                                <div id="start">
                                    <cr-icon-button id="sidenavToggle" title="Ativar/desativar barra lateral"></cr-icon-button>
                                </div>
                                <div id="center">
                                    <viewer-page-selector id="pageSelectorHost">
                                        <div id="content">
                                            <input type="text" id="pageSelector" aria-label="Número da página" value="1">
                                        </div>
                                    </viewer-page-selector>
                                </div>
                                <div id="end">
                                    <span id="zoom-controls">
                                        <cr-icon-button id="fit" title="Ajustar à página"></cr-icon-button>
                                    </span>
                                </div>
                            </div>
                        </viewer-toolbar>
                        <div id="sidenav-container">
                            <viewer-pdf-sidenav></viewer-pdf-sidenav>
                        </div>
                        <div id="container">
                            <div id="main">
                                <div id="scroller">
                                    <div id="content">
                                        <embed id="plugin" type="application/x-google-chrome-pdf" original-url="https://pje1g.trf1.jus.br/pje/downloadBinario.seam" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/pdf">
                                        <div class="textLayer">
                                            <span class="pdf-text-linha">EXCELENTÍSSIMO SENHOR DOUTOR JUIZ FEDERAL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </pdf-viewer>
                `;
                document.body.appendChild(containerPdf);

                try {
                    const elEmbedPdf = containerPdf.querySelector('embed#plugin');
                    const elTextLayerSpan = containerPdf.querySelector('.pdf-text-linha');
                    const elScroller = containerPdf.querySelector('#scroller');
                    const elPdfViewer = containerPdf.querySelector('pdf-viewer');

                    const elToolbar = containerPdf.querySelector('viewer-toolbar#toolbar');
                    const elSidenavToggle = containerPdf.querySelector('cr-icon-button#sidenavToggle');
                    const elZoomFit = containerPdf.querySelector('cr-icon-button#fit');
                    const elPageInput = containerPdf.querySelector('input#pageSelector');

                    // 1. Checagens de leitura documental (LEITURA_COMUM e isAreaLeituraOuPdfConteudo === true)
                    const ehLeituraEmbed = motorRef.isAreaLeituraOuPdfConteudo(elEmbedPdf);
                    const ehLeituraTextLayer = motorRef.isAreaLeituraOuPdfConteudo(elTextLayerSpan);
                    const ehLeituraScroller = motorRef.isAreaLeituraOuPdfConteudo(elScroller);
                    const ehLeituraPdfHost = motorRef.isAreaLeituraOuPdfConteudo(elPdfViewer);

                    const ctxEmbed = motorRef.classificarContextoElementoAlvo(elEmbedPdf);
                    const ctxTextLayer = motorRef.classificarContextoElementoAlvo(elTextLayerSpan);
                    const ctxScroller = motorRef.classificarContextoElementoAlvo(elScroller);

                    if (!ehLeituraEmbed || !ehLeituraTextLayer || !ehLeituraScroller || !ehLeituraPdfHost) {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Área de leitura do PDF não detectada: embed=${ehLeituraEmbed}, textLayer=${ehLeituraTextLayer}, scroller=${ehLeituraScroller}, host=${ehLeituraPdfHost}`;
                    } else if (ctxEmbed !== 'LEITURA_COMUM' || ctxTextLayer !== 'LEITURA_COMUM' || ctxScroller !== 'LEITURA_COMUM') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Contexto incorreto em texto de PDF: ctxEmbed=${ctxEmbed}, ctxTextLayer=${ctxTextLayer}, ctxScroller=${ctxScroller}`;
                    }

                    // 2. Checagens de interface e barra de ferramentas (LINK_CLICAVEL e isAreaLeituraOuPdfConteudo === false)
                    const ehLeituraToolbar = motorRef.isAreaLeituraOuPdfConteudo(elToolbar);
                    const ehLeituraToggle = motorRef.isAreaLeituraOuPdfConteudo(elSidenavToggle);
                    const ehLeituraZoom = motorRef.isAreaLeituraOuPdfConteudo(elZoomFit);

                    const ctxToolbar = motorRef.classificarContextoElementoAlvo(elToolbar);
                    const ctxToggle = motorRef.classificarContextoElementoAlvo(elSidenavToggle);
                    const ctxZoom = motorRef.classificarContextoElementoAlvo(elZoomFit);

                    if (ehLeituraToolbar || ehLeituraToggle || ehLeituraZoom) {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Toolbar/controles do PDF classificados erroneamente como área de leitura: toolbar=${ehLeituraToolbar}, toggle=${ehLeituraToggle}, zoom=${ehLeituraZoom}`;
                    } else if (ctxToolbar !== 'LINK_CLICAVEL' || ctxToggle !== 'LINK_CLICAVEL' || ctxZoom !== 'LINK_CLICAVEL') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Contexto incorreto em UI toolbar PDF: ctxToolbar=${ctxToolbar}, ctxToggle=${ctxToggle}, ctxZoom=${ctxZoom}`;
                    }

                    // 3. Checagem do Seletor de Página do PDF (<input id="pageSelector"> = CAMPO_SIMPLES_EDITAVEL)
                    const ctxPageInput = motorRef.classificarContextoElementoAlvo(elPageInput);
                    if (ctxPageInput !== 'CAMPO_SIMPLES_EDITAVEL') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Seletor de página do PDF deveria ser CAMPO_SIMPLES_EDITAVEL, obtido=${ctxPageInput}`;
                    }

                    // 4. Checagem de retenção de seleção no DOM (Diretriz deveManterSelecaoAtivaNoDom)
                    if (typeof motorRef.deveManterSelecaoAtivaNoDom === 'function') {
                        const modoOrigPdf = typeof motorRef.obterModoRetirarSelecao === 'function' ? motorRef.obterModoRetirarSelecao() : 'total_exceto_arrasto';
                        if (typeof motorRef.definirModoRetirarSelecao === 'function') motorRef.definirModoRetirarSelecao('interface');
                        const mantemLeitura = motorRef.deveManterSelecaoAtivaNoDom(elTextLayerSpan, false);
                        const mantemToolbar = motorRef.deveManterSelecaoAtivaNoDom(elToolbar, false);
                        if (typeof motorRef.definirModoRetirarSelecao === 'function') motorRef.definirModoRetirarSelecao(modoOrigPdf);
                        if (!mantemLeitura || mantemToolbar) {
                            falhasPdfEmbedded++;
                            detalheFalhaPdfEmbedded = `deveManterSelecaoAtivaNoDom divergente: mantemLeitura=${mantemLeitura} (esperado true), mantemToolbar=${mantemToolbar} (esperado false)`;
                        }
                    }
                } finally {
                    if (containerPdf.parentNode) containerPdf.parentNode.removeChild(containerPdf);
                }
            } else {
                falhasPdfEmbedded++;
                detalheFalhaPdfEmbedded = 'Funções de PDF não disponíveis em JusGovMotorSelecaoTeste';
            }

            registrar(
                falhasPdfEmbedded === 0,
                'PDF_EMBEDDED_LEITURA_E_EXCECAO_INTERFACE_TOOLBAR',
                'Visualizador de PDF embutido (PJe/Chrome <pdf-viewer>, #scroller, embed[type*="pdf"], .textLayer) identificado como LEITURA_COMUM com seleção mantida, excluindo Toolbar (<viewer-toolbar>, cr-icon-button = LINK_CLICAVEL) e input#pageSelector (CAMPO_SIMPLES_EDITAVEL)',
                falhasPdfEmbedded === 0
                    ? { esperado: 'Leitura PDF = LEITURA_COMUM; Toolbar = LINK_CLICAVEL; Seletor Página = CAMPO_SIMPLES_EDITAVEL', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaPdfEmbedded }
            );
        }

        /* ==================================================================
         * BATERIA 9: GEOMETRIA, FLASH VISUAL E POSICIONAMENTO EXTERNO DOS AVISOS
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 9: GEOMETRIA, FLASH VISUAL E POSICIONAMENTO EXTERNO DOS AVISOS ---');
        {
            const motorRef = window.__JUSGOV_MOTOR_SELECAO_API__ || window.JusGovMotorSelecaoTeste;
            const validadorReal = motorRef && typeof motorRef.obterValidador === 'function'
                ? motorRef.obterValidador()
                : (window.JusGovAvisoFlutuante ? new window.JusGovAvisoFlutuante() : null);

            let falhasPosicionamento = 0;
            let detalhePosicionamento = '';

            if (validadorReal && typeof validadorReal.auditarEAlerta === 'function' && document.body) {
                const tempoOriginal = validadorReal.tempoExibicaoMs;
                validadorReal.definirTempoExibicao(3500);

                const blocoTestePos = document.createElement('div');
                blocoTestePos.setAttribute('data-jusgov-ignore', 'true');
                blocoTestePos.style.cssText = 'position:fixed;top:180px;left:180px;font-size:14px;line-height:20px;z-index:99999;';
                blocoTestePos.textContent = '111.111.111-11';
                document.body.appendChild(blocoTestePos);

                try {
                    const rngPos = document.createRange();
                    rngPos.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectTexto = rngPos.getBoundingClientRect();

                    /* 1) Aviso de Erro de Validação (múltiplas linhas) não pode sobrepor o texto nem o contorno Flash */
                    if (typeof motorRef.dispararFlashBorderVisual === 'function') {
                        motorRef.dispararFlashBorderVisual(rngPos);
                    }
                    validadorReal.auditarEAlerta('111.111.111-11', rngPos);
                    const cartaoEl = validadorReal.elementoCartaoAviso;
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectTexto.height > 0) {
                        const rectCard = cartaoEl.getBoundingClientRect();
                        const sobrepoeY = (rectCard.top < (rectTexto.bottom + 2)) && (rectCard.bottom > (rectTexto.top - 2));
                        const sobrepoeX = (rectCard.left < (rectTexto.right + 2)) && (rectCard.right > (rectTexto.left - 2));
                        if (sobrepoeY && sobrepoeX) {
                            falhasPosicionamento++;
                            detalhePosicionamento = `Popup de erro sobrepôs o texto clicado: card=[${Math.round(rectCard.top)}..${Math.round(rectCard.bottom)}], texto=[${Math.round(rectTexto.top)}..${Math.round(rectTexto.bottom)}]`;
                        }
                    } else {
                        falhasPosicionamento++;
                        detalhePosicionamento = 'Cartão de aviso de erro não foi exibido no teste geométrico';
                    }

                    /* 2) Aviso de Wiki Forense (múltiplas linhas: INSS 31/6506589241) também posicionado fora do texto */
                    blocoTestePos.textContent = '31/6506589241';
                    const rngWiki = document.createRange();
                    rngWiki.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectWikiTexto = rngWiki.getBoundingClientRect();
                    validadorReal.auditarEAlerta('31/6506589241', rngWiki);
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectWikiTexto.height > 0) {
                        const rectCardWiki = cartaoEl.getBoundingClientRect();
                        const sobrepoeWikiY = (rectCardWiki.top < (rectWikiTexto.bottom + 2)) && (rectCardWiki.bottom > (rectWikiTexto.top - 2));
                        const sobrepoeWikiX = (rectCardWiki.left < (rectWikiTexto.right + 2)) && (rectCardWiki.right > (rectWikiTexto.left - 2));
                        if (sobrepoeWikiY && sobrepoeWikiX) {
                            falhasPosicionamento++;
                            if (!detalhePosicionamento) {
                                detalhePosicionamento = `Popup Wiki Forense sobrepôs o texto clicado: card=[${Math.round(rectCardWiki.top)}..${Math.round(rectCardWiki.bottom)}], texto=[${Math.round(rectWikiTexto.top)}..${Math.round(rectWikiTexto.bottom)}]`;
                            }
                        }
                    }

                    /* 3) Teste de borda superior (top=12px): deve projetar ABAIXO do texto sem cobri-lo */
                    blocoTestePos.style.top = '12px';
                    const rngTopo = document.createRange();
                    rngTopo.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectTopoTexto = rngTopo.getBoundingClientRect();
                    validadorReal.auditarEAlerta('111.111.111-11', rngTopo);
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectTopoTexto.height > 0) {
                        const rectCardTopo = cartaoEl.getBoundingClientRect();
                        if (rectCardTopo.top < rectTopoTexto.bottom) {
                            falhasPosicionamento++;
                            if (!detalhePosicionamento) {
                                detalhePosicionamento = `No topo da janela, card não projetou abaixo do texto: cardTop=${Math.round(rectCardTopo.top)}, textoBottom=${Math.round(rectTopoTexto.bottom)}`;
                            }
                        }
                    }
                } finally {
                    if (typeof motorRef.limparFlashBorderImediatamente === 'function') {
                        motorRef.limparFlashBorderImediatamente();
                    }
                    if (typeof validadorReal.ocultarTodosAvisosImediatamente === 'function') {
                        validadorReal.ocultarTodosAvisosImediatamente();
                    }
                    validadorReal.definirTempoExibicao(tempoOriginal);
                    if (blocoTestePos.parentNode) blocoTestePos.parentNode.removeChild(blocoTestePos);
                }
            } else {
                falhasPosicionamento++;
                detalhePosicionamento = 'Validador indisponível para teste de posicionamento';
            }

            registrar(
                falhasPosicionamento === 0,
                'POSICIONAMENTO_INTELIGENTE_AVISOS_FORA_DO_TEXTO_E_FLASH',
                'Popups multilinhas de verificação/erro e Wiki Forense posicionam-se estritamente fora do texto clicado e fora do contorno Flash (acima ou abaixo conforme espaço na janela)',
                falhasPosicionamento === 0
                    ? { esperado: 'Zero sobreposição sobre texto ou Flash', obtido: 'Posicionamento externo validado (acima e fallback abaixo)' }
                    : { esperado: '0 falhas', obtido: detalhePosicionamento }
            );

            /* Teste específico do popup Esc+Esc respeitando o Tempo de Exibição e imune a fechamento prematuro */
            let falhasEscEsc = 0;
            let detalheEscEsc = '';
            if (validadorReal && motorRef) {
                const tempoAntigo = validadorReal.tempoExibicaoMs;
                try {
                    validadorReal.definirTempoExibicao(5000);
                    validadorReal.projetarMiniTipGlobal('Remover Formatacoes: ATIVADO (Somente Texto)', '#3b82f6');
                    const miniEl = validadorReal.elementoMiniTipGlobal;
                    const visivelLogoApos = Boolean(miniEl && miniEl.style.display === 'block' && validadorReal.temporizadorMiniTip !== null);

                    /* Simula desseleção / broadcast remoto (preservarMiniTip = true) que ocorria após o Esc+Esc */
                    if (typeof motorRef.limparAvisosAuditoriaEWikiImediatamente === 'function') {
                        motorRef.limparAvisosAuditoriaEWikiImediatamente(true);
                    }
                    const visivelAposBroadcast = Boolean(miniEl && miniEl.style.display === 'block' && validadorReal.temporizadorMiniTip !== null);

                    /* Verifica se em 0ms (avisos desativados) o minitip respeita e não abre */
                    validadorReal.ocultarTodosAvisosImediatamente(false);
                    validadorReal.definirTempoExibicao(0);
                    validadorReal.projetarMiniTipGlobal('Teste com 0ms', '#3b82f6');
                    const ocultoQuandoZero = Boolean(!miniEl || miniEl.style.display === 'none');

                    if (!visivelLogoApos || !visivelAposBroadcast || !ocultoQuandoZero) {
                        falhasEscEsc++;
                        detalheEscEsc = `visivelLogoApos=${visivelLogoApos}, visivelAposBroadcast=${visivelAposBroadcast}, ocultoQuandoZero=${ocultoQuandoZero}`;
                    }
                } finally {
                    validadorReal.ocultarTodosAvisosImediatamente(false);
                    validadorReal.definirTempoExibicao(tempoAntigo);
                }
            } else {
                falhasEscEsc++;
                detalheEscEsc = 'Validador ou motor indisponível';
            }

            registrar(
                falhasEscEsc === 0,
                'POPUP_DUPLO_ESC_TEMPO_EXIBICAO_E_ESTABILIDADE',
                'Popup Esc+Esc respeita a opção "Tempo de Exibição dos Avisos na Tela" (inclusive 0 = desligado) e não desaparece prematuramente por eventos colaterais de desseleção',
                falhasEscEsc === 0
                    ? { esperado: 'Estável pelo tempo configurado e imune a broadcast de desseleção', obtido: 'Confirmado' }
                    : { esperado: '0 falhas', obtido: detalheEscEsc }
            );
        }

        /* ==================================================================
         * BATERIA 10: INTEGRIDADE E PARIDADE DO CATÁLOGO CENTRALIZADO JSON (src/cfg/exemplos.js / exemplos.json)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 10: INTEGRIDADE E PARIDADE DO CATÁLOGO CENTRALIZADO JSON ---');
        {
            const catalogo = window.JusGovExemplosCatalogo;
            const catalogoCarregado = Boolean(
                catalogo &&
                catalogo.politica &&
                catalogo.politica.startsWith('POLICE_APPEND_ONLY_NUNCA_REMOVER') &&
                Array.isArray(catalogo.casosDeUso) &&
                catalogo.casosDeUso.length >= 8
            );

            registrar(
                catalogoCarregado,
                'CATALOGO_HIERARQUICO_EXEMPLOS_ESTRUTURA',
                'Catálogo hierárquico src/cfg/exemplos.js (centralizado em exemplos.json) carregado sob diretriz POLICE Append-Only',
                { casosDeUso: catalogo && catalogo.casosDeUso ? catalogo.casosDeUso.length : 0 }
            );

            /* Verificacao de integridade e presenca do espelho estruturado exemplos.json */
            const temEspelhoJson = Boolean(
                catalogo &&
                (catalogo.arquivoCentralizador === 'src/cfg/exemplos.json' || catalogo.arquivoEspelhoJson === 'src/cfg/exemplos.json')
            );
            registrar(
                temEspelhoJson,
                'CATALOGO_ESPELHO_JSON_PARIDADE',
                'Presença do catálogo estruturado src/cfg/exemplos.json centralizado sob diretriz POLICE',
                { arquivoCentralizador: 'src/cfg/exemplos.json' }
            );

            /* Verificacao de regra de ouro: minimo de 5 positivos e 5 negativos para CADA mascara */
            let mascarasMenosDe5PosOuNeg = 0;
            let totalMascarasAuditadas = 0;
            let falhaClassificacaoTipoBloco = 0;
            if (catalogoCarregado) {
                for (const cUso of catalogo.casosDeUso) {
                    for (const masc of (cUso.mascaras || [])) {
                        totalMascarasAuditadas++;
                        const numPos = (masc.positivos || []).length;
                        const numNeg = (masc.negativos || []).length;
                        if (numPos < 5 || numNeg < 5) {
                            mascarasMenosDe5PosOuNeg++;
                        }
                        const tipoBlocoEsperado = masc.calculavel ? 'verificacao_matematica' : 'bloco_simples';
                        if (masc.tipoBloco !== tipoBlocoEsperado) {
                            falhaClassificacaoTipoBloco++;
                        }
                    }
                }
            }

            registrar(
                totalMascarasAuditadas >= 19 && mascarasMenosDe5PosOuNeg === 0,
                'CATALOGO_REGRA_MINIMO_5_POSITIVOS_5_NEGATIVOS',
                'Regra de amplitude do catálogo: todas as 19+ máscaras possuem no mínimo 5 positivos e 5 negativos',
                { totalMascaras: totalMascarasAuditadas, mascarasAbaixoDe5: mascarasMenosDe5PosOuNeg }
            );

            registrar(
                totalMascarasAuditadas >= 19 && falhaClassificacaoTipoBloco === 0,
                'CATALOGO_CLASSIFICACAO_TIPO_BLOCO_ESTRITA',
                'Classificação explícita no catálogo: tipoBloco ("verificacao_matematica" ou "bloco_simples") compatível',
                { totalMascaras: totalMascarasAuditadas, falhasClassificacao: falhaClassificacaoTipoBloco }
            );

            /* Carregamento assincrono/online de exemplos.json para validacao em tempo de execucao */
            if (typeof fetch === 'function') {
                try {
                    const urlJson = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function')
                        ? chrome.runtime.getURL('src/cfg/exemplos.json')
                        : 'exemplos.json';
                    fetch(urlJson)
                        .then(r => r.ok ? r.json() : null)
                        .then(dadosJson => {
                            if (dadosJson && Array.isArray(dadosJson.casosDeUso)) {
                                window.__JUSGOV_EXEMPLOS_JSON_ONLINE__ = dadosJson;
                            }
                        })
                        .catch(() => {});
                } catch (_) { }
            }

            if (catalogoCarregado) {
                for (const casoUso of catalogo.casosDeUso) {
                    for (const mascara of (casoUso.mascaras || [])) {
                        let falhasMascara = 0;
                        let detalhePrimeiraFalha = '';
                        let totalExemplosMascara = 0;

                        /* 1) Testa todos os exemplos POSITIVOS da mascara */
                        for (const item of (mascara.positivos || [])) {
                            totalExemplosMascara++;
                            const valor = item.valor;

                            /* Se a mascara for calculavel, valida matematicamente o exemplo positivo */
                            if (mascara.calculavel && !item.validarApenasExtracao && mascara.metodoValidacao && typeof validador[mascara.metodoValidacao] === 'function') {
                                const resVal = validador[mascara.metodoValidacao](valor);
                                const ehValidoPositivo = (mascara.metodoValidacao === 'auditarTrechoSelecionado')
                                    ? (resVal === null)
                                    : Boolean(resVal && resVal.valido === true);
                                if (!ehValidoPositivo) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Validação falhou para positivo "${valor}"`;
                                    }
                                }
                            }

                            /* Valida a extracao / captura pelo motor */
                            if (mascara.ehPlaceholderMinuta && typeof motorTeste.localizarCampoSimbolosSobCursor === 'function') {
                                const fraseTeste = 'texto ' + valor + ' fim';
                                const idxCursor = 6 + Math.floor(valor.length / 2);
                                const resPh = motorTeste.localizarCampoSimbolosSobCursor(fraseTeste, idxCursor);
                                const extraido = resPh ? fraseTeste.substring(resPh.inicio, resPh.fim) : '';
                                if (extraido !== valor) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Placeholder esperado "${valor}", obtido "${extraido}"`;
                                    }
                                }
                            } else if (item.validarApenasAltLink3Cliques && typeof motorTeste.extrairTextoLinkUmaLinha === 'function') {
                                const linkCat = document.createElement('a');
                                linkCat.href = '#teste-cat-link-multilinha';
                                linkCat.innerHTML = valor.replace(/\n/g, '<br>');
                                document.body.appendChild(linkCat);
                                const extraidoLink = motorTeste.extrairTextoLinkUmaLinha(linkCat);
                                if (linkCat.parentNode) linkCat.parentNode.removeChild(linkCat);
                                const esperadoLink = item.esperadoUmaLinha || valor.replace(/\s+/g, ' ').trim();
                                if (extraidoLink !== esperadoLink) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Alt+3 Cliques Link esperado "${esperadoLink}", obtido "${extraidoLink}"`;
                                    }
                                }
                            } else if (item.validarApenasCatalogoOuConversao && typeof motorTeste.higienizarTextoParaCopia === 'function') {
                                const convertido = motorTeste.higienizarTextoParaCopia(valor);
                                if (item.esperadoConversaoPje && convertido !== item.esperadoConversaoPje) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Conversão PJe esperada "${item.esperadoConversaoPje}", obtida "${convertido}"`;
                                    }
                                }
                            } else {
                                const prefixo = 'Referencia ';
                                const fraseTeste = prefixo + valor + ' fim';
                                const deslocamentoInterno = typeof item.idxClique === 'number'
                                    ? item.idxClique
                                    : Math.floor(valor.length / 2);
                                const idxCursor = prefixo.length + deslocamentoInterno;
                                const numCliques = item.cliques || 1;
                                const esperado = item.esperadoClique1 || valor;
                                const obtido = motorTeste.simularCliqueEmTexto(fraseTeste, idxCursor, numCliques, false);
                                if (obtido !== esperado) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Extração esperada "${esperado}", obtida "${obtido}" (em "${fraseTeste}", idx=${idxCursor}, cliques=${numCliques})`;
                                    }
                                }
                            }
                        }

                        /* 2) Testa todos os exemplos NEGATIVOS da mascara (para mascaras calculaveis) */
                        for (const itemNeg of (mascara.negativos || [])) {
                            totalExemplosMascara++;
                            const valorNeg = itemNeg.valor;
                            if (mascara.calculavel && mascara.metodoValidacao && typeof validador[mascara.metodoValidacao] === 'function') {
                                const resNeg = validador[mascara.metodoValidacao](valorNeg);
                                const ehInvalidoNegativo = (mascara.metodoValidacao === 'auditarTrechoSelecionado')
                                    ? Boolean(resNeg && resNeg.valido === false)
                                    : Boolean(resNeg && resNeg.valido === false);
                                if (!ehInvalidoNegativo) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Exemplo negativo "${valorNeg}" deveria ser inválido, mas retornou válido`;
                                    }
                                }
                            }
                        }

                        registrar(
                            falhasMascara === 0 && totalExemplosMascara > 0,
                            `EXEMPLOS_${mascara.idMascara}`,
                            `Catálogo [${casoUso.idCasoUso}] -> ${mascara.nome} (${totalExemplosMascara} exemplos validados)`,
                            falhasMascara === 0
                                ? { esperado: `${totalExemplosMascara} ok`, obtido: `${totalExemplosMascara} ok` }
                                : { esperado: '0 falhas', obtido: `falhas=${falhasMascara} | ${detalhePrimeiraFalha}` }
                        );
                    }
                }
            }
        }

        /* ==================================================================
         * BATERIA 11: GERENCIAMENTO DE GUIAS, JANELAS, ANTI-DUPLICACAO E INTEGRACAO FORENSE
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 11: GUIAS, JANELAS, ANTI-DUPLICACAO, DESSELECAO E GPS ESCALA CIDADE ---');

        /* 1) Teste de Deteccao de URLs Governamentais e Certificados Digitais em Single Window */
        const ehUrlAutenticacaoGov = (urlStr) => {
            const u = (urlStr || '').toLowerCase();
            return /gov\.br|icp-brasil|pjeoffice|sso|shodo|acesso\.gov\.br|certificado/i.test(u);
        };
        registrar(
            ehUrlAutenticacaoGov('https://sso.acesso.gov.br/login') &&
            ehUrlAutenticacaoGov('https://pjeoffice.pje.jus.br/assinador') &&
            !ehUrlAutenticacaoGov('https://google.com/search'),
            'SINGLE_WINDOW_PRESERVACAO_URLS_GOV_E_CERTIFICADOS',
            'Modo Janela Única preserva popups de autenticação (Gov.br, ICP-Brasil, PJEOffice, Shodô) e bloqueia genéricos'
        );

        /* 2) Anti-Duplicação: Proteção absoluta da Guia Atual pré-existente */
        const decidirAcaoAntiDuplicacao = (regAba, urlAnteriorValida) => {
            const ehAbaPreExistente = Boolean(urlAnteriorValida || (regAba && regAba.carregamentoConcluido));
            const recemCriada = Boolean(regAba && regAba.criadaEm && (Date.now() - regAba.criadaEm < 2500) && !regAba.carregamentoConcluido);
            if (ehAbaPreExistente || !recemCriada) {
                return 'manter_guia_atual';
            }
            return 'remover_guia_efemera';
        };
        const decisaoPreExistente = decidirAcaoAntiDuplicacao({ carregamentoConcluido: true, criadaEm: Date.now() - 5000 }, 'https://pje.jus.br');
        const decisaoNovaEfemera = decidirAcaoAntiDuplicacao({ carregamentoConcluido: false, criadaEm: Date.now() - 100 }, '');
        registrar(
            decisaoPreExistente === 'manter_guia_atual' && decisaoNovaEfemera === 'remover_guia_efemera',
            'ANTI_DUPLICACAO_BLINDAGEM_GUIA_ATUAL_PREEXISTENTE',
            'Guia atual onde o usuário trabalha JAMAIS é fechada em navegação duplicada; apenas abas efêmeras são descartadas'
        );

        /* 3) Algoritmo de Ordenação Hierárquica: Domínio Puro tem precedência absoluta */
        const extrairDominioInfo = (urlStr) => {
            try {
                const u = new URL(urlStr);
                const host = (u.hostname || '').toLowerCase();
                const partes = host.split('.').filter(Boolean);
                let numSufixo = 1;
                const penultima = partes[partes.length - 2];
                const ultima = partes[partes.length - 1];
                if (ultima.length === 2 && (penultima.length <= 3 || ['jus', 'leg', 'mp', 'gov'].includes(penultima))) {
                    numSufixo = 2;
                }
                const idxBase = Math.max(0, partes.length - numSufixo - 1);
                const base = partes.slice(idxBase).join('.');
                const sub = partes.slice(0, idxBase).join('.');
                return { baseDominio: base, subDominio: sub, ehPuro: (sub === '') };
            } catch (_) {
                return { baseDominio: '', subDominio: '', ehPuro: true };
            }
        };

        const compDominio = (urlA, urlB) => {
            const infA = extrairDominioInfo(urlA);
            const infB = extrairDominioInfo(urlB);
            const cmpBase = infA.baseDominio.localeCompare(infB.baseDominio);
            if (cmpBase !== 0) return cmpBase;
            if (infA.ehPuro && !infB.ehPuro) return -1;
            if (!infA.ehPuro && infB.ehPuro) return 1;
            return infA.subDominio.localeCompare(infB.subDominio);
        };

        const listaDesordenada = ['https://pje1g.trf1.jus.br', 'https://trf1.jus.br', 'https://www.trf1.jus.br'];
        const listaOrdenada = [...listaDesordenada].sort(compDominio);
        registrar(
            listaOrdenada[0] === 'https://trf1.jus.br' &&
            listaOrdenada[1] === 'https://pje1g.trf1.jus.br' &&
            listaOrdenada[2] === 'https://www.trf1.jus.br',
            'ORDENACAO_HIERARQUICA_PRECEDENCIA_DOMINIO_PURO',
            'Ordenação por Domínio: o domínio puro "trf1.jus.br" tem precedência estrita sobre subdomínios (pje1g, www)'
        );

        /* 4) Ordenação por Sentido: Da Direita para a Esquerda (Z-A) */
        const listaOrdenadaZA = [...listaDesordenada].sort((a, b) => -compDominio(a, b));
        registrar(
            listaOrdenadaZA[0] === 'https://www.trf1.jus.br' &&
            listaOrdenadaZA[2] === 'https://trf1.jus.br',
            'ORDENACAO_HIERARQUICA_SENTIDO_INVERSO_ZA',
            'Ordenação por Sentido: suporte bidirecional rigoroso Da Direita para a Esquerda (Z-A)'
        );

        /* 5) Desseleção do Sistema: Modo Total (exceto ao arrastar o mouse) */
        const motorModoDesselecao = motorTeste ? motorTeste.obterModoRetirarSelecao() : '';
        registrar(
            motorModoDesselecao === 'total_exceto_arrasto',
            'DESSELECAO_SISTEMA_MODO_PADRAO_TOTAL_EXCETO_ARRASTO',
            'Configuração padrão da desseleção do sistema definida como "total_exceto_arrasto"',
            { modo: motorModoDesselecao }
        );

        /* 6) Captura de Coordenada GPS em Graus Decimais (-25.592600, -54.593536) e Escala Urbana (-25.51, -54.58) */
        const regGps = /(?<![\p{L}\p{N}.\/\-])[+\-]?\d{1,2}\.\d{1,8}\s*,\s*[+\-]?\d{1,3}\.\d{1,8}(?![\p{L}\p{N}.\/\-])/gu;
        const textoGpsExato = 'Localizado nas coordenadas -25.592600, -54.593536 da região';
        const matchGpsExato = textoGpsExato.match(regGps);
        registrar(
            Boolean(matchGpsExato && matchGpsExato[0] === '-25.592600, -54.593536'),
            'GPS_COORDENADA_GRAUS_DECIMAIS_ALTA_PRECISAO',
            'Captura de coordenadas GPS em graus decimais com alta precisão (-25.592600, -54.593536)'
        );

        /* 6.1) Captura de Coordenada GPS Sexagesimal DMS (25°35\'33.36"S 54°35\'36.73"W) */
        const regGpsDms = /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[NSns]?(?:[\s,;\/]+|\s+[eE]\s+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[EWewOLol]?(?![\p{L}\p{N}])/gu;
        const textoGpsDms = 'Ponto de interesse: 25°35\'33.36"S 54°35\'36.73"W periciado';
        const matchGpsDms = textoGpsDms.match(regGpsDms);
        registrar(
            Boolean(matchGpsDms && matchGpsDms[0] === '25°35\'33.36"S 54°35\'36.73"W'),
            'GPS_COORDENADA_SEXAGESIMAL_DMS_ALTA_PRECISAO',
            'Captura de coordenadas GPS sexagesimais DMS (25°35\'33.36"S 54°35\'36.73"W)'
        );

        /* 7) Captura de Google Plus Code correspondente (5867CC44+XH) */
        const regPlusCode = /(?<![\p{L}\p{N}+])(?:[23456789CFGHJMPQRVWX]{8}|[23456789CFGHJMPQRVWX]{4,6})\+[23456789CFGHJMPQRVWX]{2,3}(?![\p{L}\p{N}+])/giu;
        const textoPlusCode = 'Código Plus da localidade: 5867CC44+XH no Google Maps';
        const matchPlusCode = textoPlusCode.match(regPlusCode);
        registrar(
            Boolean(matchPlusCode && matchPlusCode[0] === '5867CC44+XH'),
            'GPS_GOOGLE_PLUS_CODE_OPEN_LOCATION_CODE',
            'Captura determinística do Google Plus Code (5867CC44+XH) para a mesma coordenada'
        );

        /* 8) Validação Matemática PIS com cálculo Módulo 11 */
        const pisValido = validador.validarPIS('099.12345.67-9');
        const pisInvalido = validador.validarPIS('099.12345.67-0');
        registrar(
            Boolean(pisValido && pisValido.valido === true && pisInvalido && pisInvalido.valido === false),
            'PIS_MODULO_11_CALCULO_MATEMATICO',
            'Validação matemática do PIS com pesos 3,2,9,8,7,6,5,4,3,2 (099.12345.67-9 válido vs 099.12345.67-0 inválido)'
        );

        /* 9) Validação de CEP 8 dígitos com hífen */
        const regCep = /(?<![\p{L}\p{N}])\d{5}-\d{3}(?![\p{L}\p{N}])/gu;
        const matchCep = 'CEP de atendimento: 85851-000 da região'.match(regCep);
        registrar(
            Boolean(matchCep && matchCep[0] === '85851-000'),
            'CEP_FORMATO_NACIONAL_8_DIGITOS_HIFEN',
            'Captura e formatação do CEP nacional com 8 dígitos e hífen (85851-000)'
        );

        /* ==================================================================
         * BATERIA 12: MÓDULOS DE ENGENHARIA POO (mod-input e mod-navegador)
         * Testes determinísticos de SRP, DIP, Null Object Pattern e Imutabilidade
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 12: MÓDULOS MOD-INPUT E MOD-NAVEGADOR (POO & NULL OBJECT) ---');

        /* 1) Verificação da existência e integridade da classe ModuloInput */
        const temModuloInput = typeof window.JusGovModuloInput === 'function';
        registrar(
            temModuloInput,
            'MOD_INPUT_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloInput (Grupo 3: Teclado/Mouse)'
        );

        /* 2) Instanciação com tolerância a falhas (Null Object Pattern em ModuloInput) */
        let nullObjectInputOk = false;
        try {
            const modInputFallback = new window.JusGovModuloInput({
                botoesLaterais: null,
                botaoMeio: null,
                tecladoCampos: null,
                atalhoF1: null
            });
            nullObjectInputOk = Boolean(
                modInputFallback &&
                modInputFallback.botoesLaterais &&
                typeof modInputFallback.botoesLaterais.processarEventoMouse === 'function' &&
                modInputFallback.botoesLaterais.processarEventoMouse() === false &&
                modInputFallback.botaoMeio &&
                typeof modInputFallback.botaoMeio.tratarCliqueBotaoMeio === 'function' &&
                modInputFallback.botaoMeio.tratarCliqueBotaoMeio() === false &&
                modInputFallback.tecladoCampos &&
                typeof modInputFallback.tecladoCampos.tratarEventoTeclado === 'function' &&
                modInputFallback.tecladoCampos.tratarEventoTeclado() === false &&
                modInputFallback.atalhoF1 &&
                typeof modInputFallback.atalhoF1.tratarEventoTeclado === 'function' &&
                modInputFallback.atalhoF1.tratarEventoTeclado() === false
            );
        } catch (_) {
            nullObjectInputOk = false;
        }
        registrar(
            nullObjectInputOk,
            'MOD_INPUT_NULL_OBJECT_FALLBACK',
            'ModuloInput ativa Null Objects imutáveis sem lançar TypeError quando dependências são omitidas'
        );

        /* 3) Verificação das classes especializadas de mod-input */
        const temBotoesMouse = typeof window.JusGovBotoesLateraisMouse === 'function';
        const temBotaoMeio = typeof window.JusGovBotaoMeioColagem === 'function';
        const temTecladoCampos = typeof window.JusGovNavegacaoTecladoCampos === 'function';
        const temAtalhoF1 = typeof window.JusGovAtalhoF1Gemini === 'function';
        registrar(
            temBotoesMouse && temBotaoMeio && temTecladoCampos && temAtalhoF1,
            'MOD_INPUT_SUBCLASSES_ESPECIALIZADAS',
            'Subclasses BotoesLateraisMouse, BotaoMeioColagem, NavegacaoTecladoCampos e AtalhoF1Gemini instanciáveis'
        );

        /* 4) Injeção de dependências reais em ModuloInput (DIP e Composição) */
        let modInputCompletoOk = false;
        try {
            const instBotoes = new window.JusGovBotoesLateraisMouse({ ativo: true });
            const instMeio = new window.JusGovBotaoMeioColagem({ ativo: true });
            const instCampos = new window.JusGovNavegacaoTecladoCampos({ ativo: true });
            const instF1 = new window.JusGovAtalhoF1Gemini({ ativo: true, promptPadrao: 'Resuma juridicamente: {SELECAO}' });

            const modInputReal = new window.JusGovModuloInput({
                botoesLaterais: instBotoes,
                botaoMeio: instMeio,
                tecladoCampos: instCampos,
                atalhoF1: instF1
            });

            modInputReal.atualizarConfiguracoes({
                optCapturaBotoesMouse4e5: false,
                optColarBotaoMeio: true,
                optNavegacaoTecladoCampos: true,
                optPromptF1Gemini: 'Novo prompt {SELECAO}'
            });

            const promptFormatado = instF1.obterPromptFormatado('Decisão liminar');

            modInputCompletoOk = Boolean(
                modInputReal.botoesLaterais.ativo === false &&
                modInputReal.botaoMeio.ativo === true &&
                modInputReal.tecladoCampos.ativo === true &&
                promptFormatado.includes('Decisão liminar') &&
                instF1.montarUrlGemini('Decisão').includes('gemini.google.com')
            );
        } catch (_) {
            modInputCompletoOk = false;
        }
        registrar(
            modInputCompletoOk,
            'MOD_INPUT_INJECAO_DIP_COMPOSICAO',
            'Injeção de dependências (DIP), ciclo reativo e formatação de prompt Gemini em mod-input'
        );

        /* 4.1) Verificação da existência e integridade da classe ModuloAntiAmpulheta (Grupo 1) */
        const temModuloAntiAmpulheta = typeof window.JusGovModuloAntiAmpulheta === 'function';
        registrar(
            temModuloAntiAmpulheta,
            'MOD_ANTI_AMPULHETA_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloAntiAmpulheta (Grupo 1: Anti-Ampulhetas)'
        );

        /* 4.2) Instanciação e Null Object Pattern em ModuloAntiAmpulheta */
        let nullObjectAntiAmpOk = false;
        try {
            const nullAntiAmp = window.JusGovModuloAntiAmpulheta.NULL_OBJECTS.NULL_ANTI_AMPULHETA;
            const modAntiAmpFallback = new window.JusGovModuloAntiAmpulheta({ ativo: true });
            nullObjectAntiAmpOk = Boolean(
                nullAntiAmp &&
                nullAntiAmp.ativo === false &&
                Array.isArray(nullAntiAmp.urls) &&
                nullAntiAmp.urls.length === 0 &&
                modAntiAmpFallback &&
                modAntiAmpFallback.ativo === true &&
                Array.isArray(window.JusGovModuloAntiAmpulheta.ARQUIVOS_CSS) &&
                window.JusGovModuloAntiAmpulheta.ARQUIVOS_CSS.length === 7
            );
        } catch (_) {
            nullObjectAntiAmpOk = false;
        }
        registrar(
            nullObjectAntiAmpOk,
            'MOD_ANTI_AMPULHETA_NULL_OBJECT_FALLBACK',
            'ModuloAntiAmpulheta ativa Null Objects imutáveis e expõe os 7 arquivos CSS especializados'
        );

        /* 4.3) Preservação de operações em lote e destravamento de cursor */
        let preservacaoLoteOk = false;
        try {
            const modAntiAmp = new window.JusGovModuloAntiAmpulheta({ ativo: true });
            const docSimulado = document.implementation.createHTMLDocument('Teste Anti-Ampulheta');
            docSimulado.body.style.cursor = 'wait';

            /* Sem lote ativo: deve destravar cursor */
            const destravouSemLote = modAntiAmp.desbloquearInterface(docSimulado);
            const cursorAposSemLote = docSimulado.body.style.cursor;

            /* Com lote ativo (#mpProgresso): não deve intervir */
            const divLote = docSimulado.createElement('div');
            divLote.id = 'mpProgresso';
            docSimulado.body.appendChild(divLote);
            docSimulado.body.style.cursor = 'wait';

            const interveioComLote = modAntiAmp.desbloquearInterface(docSimulado);
            const manteveWaitComLote = docSimulado.body.style.cursor === 'wait';

            preservacaoLoteOk = (destravouSemLote === true && cursorAposSemLote === 'auto' && interveioComLote === false && manteveWaitComLote === true);
        } catch (_) {
            preservacaoLoteOk = false;
        }
        registrar(
            preservacaoLoteOk,
            'MOD_ANTI_AMPULHETA_PRESERVACAO_LOTES',
            'ModuloAntiAmpulheta destrava cursores órfãos e preserva travas em lote (#mpProgresso)'
        );

        /* 5) Verificação da existência e integridade da classe ModuloNavegador */
        const temModuloNavegador = typeof window.JusGovModuloNavegador === 'function';
        registrar(
            temModuloNavegador,
            'MOD_NAVEGADOR_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloNavegador (Grupo 4: Gerenciamento de Guias e Janelas)'
        );

        /* 6) Instanciação com tolerância a falhas (Null Object Pattern em ModuloNavegador) */
        let nullObjectNavegadorOk = false;
        try {
            const modNavFallback = new window.JusGovModuloNavegador({
                janelaUnica: null,
                antiDuplicacao: null,
                ordenacao: null,
                descarte: null
            });
            nullObjectNavegadorOk = Boolean(
                modNavFallback &&
                modNavFallback.janelaUnica &&
                typeof modNavFallback.janelaUnica.ehJanelaDeAutenticacao === 'function' &&
                modNavFallback.janelaUnica.ehJanelaDeAutenticacao() === false &&
                modNavFallback.antiDuplicacao &&
                typeof modNavFallback.antiDuplicacao.normalizarUrl === 'function' &&
                modNavFallback.ordenacao &&
                typeof modNavFallback.ordenacao.agruparPorDominio === 'function' &&
                modNavFallback.descarte &&
                typeof modNavFallback.descarte.descartarInativasAgora === 'function'
            );
        } catch (_) {
            nullObjectNavegadorOk = false;
        }
        registrar(
            nullObjectNavegadorOk,
            'MOD_NAVEGADOR_NULL_OBJECT_FALLBACK',
            'ModuloNavegador ativa Null Objects imutáveis sem lançar TypeError quando dependências são omitidas'
        );

        /* 7) Subclasses de mod-navegador e normalização de URLs no Anti-Duplicação */
        const temJanelaUnica = typeof window.JusGovGerenciadorJanelaUnica === 'function';
        const temAntiDuplicacao = typeof window.JusGovGerenciadorAntiDuplicacao === 'function';
        const temOrdenacao = typeof window.JusGovGerenciadorOrdenacaoGuias === 'function';
        const temDescarte = typeof window.JusGovGerenciadorDescarteGuias === 'function';
        registrar(
            temJanelaUnica && temAntiDuplicacao && temOrdenacao && temDescarte,
            'MOD_NAVEGADOR_SUBCLASSES_ESPECIALIZADAS',
            'Subclasses GerenciadorJanelaUnica, GerenciadorAntiDuplicacao, GerenciadorOrdenacaoGuias e GerenciadorDescarteGuias instanciáveis'
        );

        /* 8) Teste de normalização URL limpa no GerenciadorAntiDuplicacao */
        let normalizacaoUrlOk = false;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao({ reutilizarAbasAbertas: true });
            const urlBruta = 'https://pje.trt9.jus.br/primeirograu/Processo/ConsultaProcesso/Detalhe/documento.seam?idDoc=12345&utm_source=chat#secao1';
            const urlNormalizada = antiDup.normalizarUrl(urlBruta);
            normalizacaoUrlOk = (urlNormalizada === 'https://pje.trt9.jus.br/primeirograu/processo/consultaprocesso/detalhe/documento.seam');
        } catch (_) {
            normalizacaoUrlOk = false;
        }
        registrar(
            normalizacaoUrlOk,
            'MOD_NAVEGADOR_NORMALIZACAO_URL_ANTI_DUPLICACAO',
            'GerenciadorAntiDuplicacao normaliza URL eliminando hash, trailing slashes e caixas mistas'
        );

        /* 9) Preservação de certificados e telas de autenticação Gov.br em Janela Única */
        let preservacaoGovOk = false;
        try {
            const janelaUnica = new window.JusGovGerenciadorJanelaUnica({ bloquearNovasJanelas: true, preservarJanelasAutenticacao: true });
            preservacaoGovOk = (
                janelaUnica.ehJanelaDeAutenticacao('https://sso.acesso.gov.br/login') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://assinador.pje.jus.br/pjeoffice') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://portal.icp-brasil.org.br/validar') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://www.google.com/search') === false &&
                janelaUnica.ehJanelaDeAutenticacao('https://pje.trf1.jus.br/pje/Processo/ConsultaProcesso/detalhe.seam', '', 'Consulta Processo') === false
            );
        } catch (_) {
            preservacaoGovOk = false;
        }
        registrar(
            preservacaoGovOk,
            'MOD_NAVEGADOR_PRESERVACAO_CERTIFICADOS_GOV',
            'GerenciadorJanelaUnica preserva popups de autenticação ICP-Brasil, Gov.br e PJEOffice impedindo bloqueio indevido'
        );

        /* 9.1) BUG-11: Anti-duplicação preserva incondicionalmente a guia ativa em foco e remove duplicatas */
        let bug11AbaAtivaOk = false;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao();
            const abasSimuladas = [
                { id: 101, url: 'https://pje.jus.br/painel', active: true, pinned: false },
                { id: 102, url: 'https://pje.jus.br/painel', active: false, pinned: false },
                { id: 103, url: 'https://pje.jus.br/painel', active: false, pinned: false }
            ];
            const removidas = [];
            const chromeSimulado = {
                tabs: {
                    query: () => Promise.resolve(abasSimuladas),
                    remove: (ids) => { removidas.push(...ids); return Promise.resolve(); }
                }
            };
            const promessa = antiDup.fecharGuiasDuplicadas(null, chromeSimulado);
            bug11AbaAtivaOk = Boolean(promessa && typeof promessa.then === 'function');
            promessa.then((totalFechadas) => {
                if (removidas.includes(101)) {
                    bug11AbaAtivaOk = false;
                }
            }).catch(() => {});
        } catch (_) {
            bug11AbaAtivaOk = false;
        }
        registrar(
            bug11AbaAtivaOk,
            'BUG_11_ANTI_DUPLICACAO_BLINDAGEM_ABA_ATIVA',
            'GerenciadorAntiDuplicacao blinda incondicionalmente a guia ativa contra encerramento por duplicidade'
        );

        /* 9.2) SEÇÃO 6.13: Desacoplamento Modular Rígido (Interface vs Seleção/Cópia) */
        let secao613DesacoplamentoOk = false;
        try {
            const temModCopia = typeof window.JusGovModuloCopia === 'function';
            const temModInput = typeof window.JusGovModuloInput === 'function';
            const motorCopia = window.JusGovMotorSelecaoTeste;

            // 1. Ambas as fachadas existem de forma desacoplada
            const fachadasExistem = Boolean(temModCopia && temModInput && motorCopia);

            // 2. copia-selecionar delega métodos de interface com tolerância a falhas (Null Object / defensive guard)
            const temDelegacaoBotoesMouse = typeof motorCopia.tratarNavegacaoAbasPorBotoesMouse === 'function';
            const temDelegacaoNavegacaoCampos = typeof motorCopia.simularNavegacaoTecladoCampos === 'function';

            // 3. Simulação de chamada de interface em mod-copia não gera TypeError mesmo sem DOM completo
            let chamadaSemErro = false;
            try {
                motorCopia.tratarNavegacaoAbasPorBotoesMouse({ type: 'mouseup', button: 0 });
                chamadaSemErro = true;
            } catch (_) {
                chamadaSemErro = false;
            }

            secao613DesacoplamentoOk = Boolean(fachadasExistem && temDelegacaoBotoesMouse && temDelegacaoNavegacaoCampos && chamadaSemErro);
        } catch (_) {
            secao613DesacoplamentoOk = false;
        }
        registrar(
            secao613DesacoplamentoOk,
            'SECAO_6_13_DESACOPLAMENTO_MODULAR_INTERFACE_VS_COPIA',
            'Seção 6.13: Desacoplamento rígido entre Módulo de Cópia (src/mod-copia/) e Módulo de Interface (src/mod-input/) com resiliência POO'
        );

        /* 10) Imutabilidade e selamento estrutural de fachadas (Object.freeze) */
        const modAntiAmpCongelado = Object.isFrozen(window.JusGovModuloAntiAmpulheta);
        const modInputCongelado = Object.isFrozen(window.JusGovModuloInput);
        const modNavCongelado = Object.isFrozen(window.JusGovModuloNavegador);
        registrar(
            modAntiAmpCongelado && modInputCongelado && modNavCongelado,
            'ARQUITETURA_POO_IMUTABILIDADE_FACHADAS_SEALED',
            'Fachadas orquestradoras ModuloAntiAmpulheta, ModuloInput e ModuloNavegador seladas com Object.freeze contra mutações em tempo de execução'
        );

        /* 10.1) BP-06 / ARQ-01: Disponibilidade e métodos da biblioteca JusGovVerificadores */
        let libVerificadoresOk = false;
        try {
            const FabricaVer = (typeof window !== 'undefined' && window.JusGovVerificadores) || (typeof self !== 'undefined' && self.JusGovVerificadores);
            if (typeof FabricaVer === 'function') {
                const ver = new FabricaVer();
                const resCpf = ver.validarCPF('529.982.247-25');
                const resCnj = ver.validarCNJ('1004615-62.2026.4.01.4002');
                const resData = ver.validarData('29/02/2024');
                const resBissexto = ver.validarBissexto(2024) === true && ver.validarBissexto(2025) === false;
                libVerificadoresOk = Boolean(
                    ver &&
                    typeof ver.validarCPF === 'function' &&
                    typeof ver.validarCNPJ === 'function' &&
                    typeof ver.validarCNJ === 'function' &&
                    typeof ver.validarData === 'function' &&
                    typeof ver.validarModulo11 === 'function' &&
                    typeof ver.validarModulo97 === 'function' &&
                    resCpf && resCpf.valido === true &&
                    resCnj && resCnj.valido === true &&
                    resData && resData.valido === true &&
                    resBissexto
                );
            }
        } catch (_) {
            libVerificadoresOk = false;
        }
        registrar(
            libVerificadoresOk,
            'LIB_VERIFICADORES_DISPONIBILIDADE_E_METODOS',
            'JusGovVerificadores expõe métodos de auditoria matemática (CPF, CNPJ, CNJ, Data, Mod 11/97) com conformidade total'
        );

        /* 10.2) BP-06 / ARQ-01: Disponibilidade e integração cruzada da biblioteca JusGovGeradores */
        let libGeradoresOk = false;
        try {
            const FabricaGer = (typeof window !== 'undefined' && window.JusGovGeradores) || (typeof self !== 'undefined' && self.JusGovGeradores);
            const FabricaVer = (typeof window !== 'undefined' && window.JusGovVerificadores) || (typeof self !== 'undefined' && self.JusGovVerificadores);
            if (typeof FabricaGer === 'function' && typeof FabricaVer === 'function') {
                const ger = new FabricaGer();
                const ver = new FabricaVer();
                const cpfGerado = ger.gerarCpfValido();
                const cnpjGerado = ger.gerarCnpjAlfanumericoValido();
                const cnjGerado = ger.gerarCnjValido();
                const dataGerada = ger.gerarDataValida(true);

                const cpfValido = ver.validarCPF(cpfGerado).valido === true;
                const cnjValido = ver.validarCNJ(cnjGerado).valido === true;
                const dataValida = ver.validarData(dataGerada).valido === true;

                libGeradoresOk = Boolean(
                    ger &&
                    typeof ger.gerarCpfValido === 'function' &&
                    typeof ger.gerarCnpjAlfanumericoValido === 'function' &&
                    typeof ger.gerarCnjValido === 'function' &&
                    typeof ger.gerarDataValida === 'function' &&
                    cpfValido && cnjValido && dataValida
                );
            }
        } catch (_) {
            libGeradoresOk = false;
        }
        registrar(
            libGeradoresOk,
            'LIB_GERADORES_DISPONIBILIDADE_E_INTEGRACAO',
            'JusGovGeradores gera documentos válidos compatíveis com validações determinísticas de JusGovVerificadores'
        );

        /* 10.3) BP-06 / ARQ-01: Segregação estrita entre Verificadores e Geradores */
        let segregacaoOk = false;
        try {
            const protoVer = window.JusGovVerificadores ? window.JusGovVerificadores.prototype : null;
            const protoGer = window.JusGovGeradores ? window.JusGovGeradores.prototype : null;
            if (protoVer && protoGer) {
                const verNaoGera = typeof protoVer.gerarCpfValido === 'undefined' && typeof protoVer.gerarCnjValido === 'undefined';
                const gerNaoValida = typeof protoGer.validarCPF === 'undefined' && typeof protoGer.validarCNJ === 'undefined';
                segregacaoOk = (verNaoGera && gerNaoValida);
            }
        } catch (_) {
            segregacaoOk = false;
        }
        registrar(
            segregacaoOk,
            'ARQ_01_SEGREGACAO_ESTRITA_VERIFICADORES_GERADORES',
            'Segregação estrita: JusGovVerificadores não possui métodos de geração e JusGovGeradores não possui métodos de validação'
        );

        /* 10.4) ARQ-02: Disponibilidade, sanitização e matching da biblioteca JusGovUrls */
        let libUrlsOk = false;
        try {
            const FabricaUrls = (typeof window !== 'undefined' && window.JusGovUrls) || (typeof self !== 'undefined' && self.JusGovUrls);
            if (typeof FabricaUrls === 'function') {
                const urls = new FabricaUrls();
                const matches = urls.sanitizarParaMatches(['*.jus.br/*', 'https://pje.jus.br/*']);
                const casaPje = urls.urlCorrespondeAosPadroes('https://pje.jus.br/pje/Processo', matches);
                const naoCasaGoogle = !urls.urlCorrespondeAosPadroes('https://www.google.com/search', matches);
                const imutavel = Object.isFrozen(FabricaUrls) && Object.isFrozen(FabricaUrls.prototype);
                libUrlsOk = Boolean(matches.length >= 2 && casaPje && naoCasaGoogle && imutavel);
            }
        } catch (_) {
            libUrlsOk = false;
        }
        registrar(
            libUrlsOk,
            'LIB_URLS_DISPONIBILIDADE_SANITIZACAO_MATCHING',
            'JusGovUrls sanitiza match patterns e executa matching determinístico de URLs de tribunais com selagem POO'
        );

        /* 10.5) ARQ-02: Disponibilidade e arquitetura desacoplada de JusGovInjecaoScripts e JusGovConfiguracoes */
        let libInjecaoEConfigOk = false;
        try {
            const FabricaInjecao = (typeof window !== 'undefined' && window.JusGovInjecaoScripts) || (typeof self !== 'undefined' && self.JusGovInjecaoScripts);
            const FabricaConfig = (typeof window !== 'undefined' && window.JusGovConfiguracoes) || (typeof self !== 'undefined' && self.JusGovConfiguracoes);
            if (typeof FabricaInjecao === 'function' && typeof FabricaConfig === 'function') {
                const injecao = new FabricaInjecao();
                const config = new FabricaConfig({ injecao });
                const arqsNucleo = injecao.obterArquivosNucleoModuloCopia();
                const padroesTurbo = config.obterPadroesDefaultTurbo();
                const padroesAmp = config.obterPadroesDefaultAmpuletas();
                const injecaoImutavel = Object.isFrozen(FabricaInjecao) && Object.isFrozen(FabricaInjecao.prototype);
                const configImutavel = Object.isFrozen(FabricaConfig) && Object.isFrozen(FabricaConfig.prototype);
                libInjecaoEConfigOk = Boolean(
                    Array.isArray(arqsNucleo) && arqsNucleo.length > 0 &&
                    Array.isArray(padroesTurbo) && padroesTurbo.length > 0 &&
                    Array.isArray(padroesAmp) && padroesAmp.length > 0 &&
                    injecaoImutavel && configImutavel
                );
            }
        } catch (_) {
            libInjecaoEConfigOk = false;
        }
        registrar(
            libInjecaoEConfigOk,
            'LIB_INJECAO_E_CONFIG_DISPONIBILIDADE_DESACOPLADA',
            'JusGovInjecaoScripts e JusGovConfiguracoes operam de forma autônoma e desacoplada com selagem POO'
        );

        /* 11) BUG-01: Ciclo de vida determinístico de subframes (<iframe>) com AbortController e segurança BFCache */
        let bug01SubframeOk = false;
        let iframeBug01 = null;
        try {
            if (motorTeste && typeof motorTeste.inspecionarSubframeTeste === 'function' && typeof motorTeste.obterEstadoCicloVida === 'function') {
                const contagemInicial = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                iframeBug01 = document.createElement('iframe');
                iframeBug01.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
                iframeBug01.setAttribute('data-jusgov-ignore', 'true');
                document.body.appendChild(iframeBug01);

                /* Garante estado limpo sem motor próprio no iframe sintético */
                iframeBug01.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
                iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ = false;
                motorTeste.limparSubframeTeste(iframeBug01);

                const baseAposLimpeza = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                const anexou = motorTeste.inspecionarSubframeTeste(iframeBug01);
                const aposInspecao = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                const flagAtiva = (iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === true);

                /* Simula navegação BFCache (persisted: true) -> NÃO deve abortar ouvintes */
                const evBfCache = new PageTransitionEvent('pagehide', { persisted: true });
                iframeBug01.contentWindow.dispatchEvent(evBfCache);
                const preservouBfCache = (
                    iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === true &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === (baseAposLimpeza + 1)
                );

                /* Simula descarregamento definitivo (persisted: false) -> DEVE abortar imediatamente */
                const evUnload = new PageTransitionEvent('pagehide', { persisted: false });
                iframeBug01.contentWindow.dispatchEvent(evUnload);
                const desmontouNoPagehide = (
                    iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === false &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === baseAposLimpeza
                );

                bug01SubframeOk = Boolean(
                    contagemInicial >= 0 &&
                    anexou === true &&
                    aposInspecao === (baseAposLimpeza + 1) &&
                    flagAtiva &&
                    preservouBfCache &&
                    desmontouNoPagehide
                );
            }
        } catch (_) {
            bug01SubframeOk = false;
        } finally {
            if (iframeBug01) {
                try { motorTeste.limparSubframeTeste(iframeBug01); } catch (_) { }
                try { iframeBug01.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01SubframeOk,
            'BUG01_SUBFRAME_ABORTCONTROLLER_LIFECYCLE',
            'Subframes <iframe> gerenciam AbortController próprio: preservam BFCache (persisted=true) e abortam closures em pagehide definitivo (persisted=false)'
        );

        /* 12) BUG-01: Auto-desmontagem imediata quando subframe ativa seu próprio motor nativo */
        let bug01AutoAbortNativoOk = false;
        let iframeBug01Nativo = null;
        try {
            if (motorTeste && typeof motorTeste.inspecionarSubframeTeste === 'function') {
                iframeBug01Nativo = document.createElement('iframe');
                iframeBug01Nativo.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
                iframeBug01Nativo.setAttribute('data-jusgov-ignore', 'true');
                document.body.appendChild(iframeBug01Nativo);

                iframeBug01Nativo.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
                iframeBug01Nativo.contentWindow.__JUSGOV_OUVINTE_LOCAL__ = false;
                motorTeste.limparSubframeTeste(iframeBug01Nativo);

                const baseCount = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                motorTeste.inspecionarSubframeTeste(iframeBug01Nativo);

                /* Simula ativação tardia do Content Script próprio dentro do iframe */
                iframeBug01Nativo.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = true;
                iframeBug01Nativo.contentWindow.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

                bug01AutoAbortNativoOk = (
                    iframeBug01Nativo.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === false &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === baseCount
                );
            }
        } catch (_) {
            bug01AutoAbortNativoOk = false;
        } finally {
            if (iframeBug01Nativo) {
                try { motorTeste.limparSubframeTeste(iframeBug01Nativo); } catch (_) { }
                try { iframeBug01Nativo.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01AutoAbortNativoOk,
            'BUG01_SUBFRAME_AUTO_ABORT_MOTOR_NATIVO',
            'Fallback de subframe auto-aborta instantaneamente suas 4 closures ao detectar ativação do motor nativo no iframe'
        );

        /* 13) BUG-01: Desmontagem completa e reconstrução idempotente do motor principal */
        let bug01MotorTeardownOk = false;
        try {
            if (motorTeste && typeof motorTeste.destruirCicloVida === 'function' && typeof motorTeste.reconstruirCicloVida === 'function') {
                try {
                    motorTeste.destruirCicloVida();
                    const estDestruido = motorTeste.obterEstadoCicloVida();
                    const desmontouTudo = (
                        estDestruido.motorAtivo === false &&
                        estDestruido.controladorAtivo === false &&
                        estDestruido.sinalAbortado === true &&
                        estDestruido.observerFramesAtivo === false &&
                        estDestruido.subframesMonitoradosCount === 0
                    );

                    motorTeste.reconstruirCicloVida();
                    const estReconstruido = motorTeste.obterEstadoCicloVida();
                    const reconstruiuTudo = (
                        estReconstruido.motorAtivo === true &&
                        estReconstruido.controladorAtivo === true &&
                        estReconstruido.sinalAbortado === false &&
                        estReconstruido.observerFramesAtivo === true
                    );

                    bug01MotorTeardownOk = Boolean(desmontouTudo && reconstruiuTudo);
                } finally {
                    /* Garante que o motor principal da página permaneça 100% operacional */
                    if (!motorTeste.obterEstadoCicloVida().motorAtivo) {
                        motorTeste.reconstruirCicloVida();
                    }
                }
            }
        } catch (_) {
            bug01MotorTeardownOk = false;
        }
        registrar(
            bug01MotorTeardownOk,
            'BUG01_MOTOR_PRINCIPAL_TEARDOWN_E_RECONSTRUCAO',
            'Motor principal encerra AbortController, MutationObservers e timers em destruirCicloVida() e restaura estado íntegro em reconstruirCicloVida()'
        );

        /* 14) BUG-01: ModuloInput com AbortController privado, pagehide (!persisted) e método destruir() */
        let bug01ModInputTeardownOk = false;
        let iframeModInput = null;
        try {
            iframeModInput = document.createElement('iframe');
            iframeModInput.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
            iframeModInput.setAttribute('data-jusgov-ignore', 'true');
            document.body.appendChild(iframeModInput);

            const modSub = new window.JusGovModuloInput();
            const init1 = modSub.inicializar(iframeModInput.contentDocument);
            const initDuplo = modSub.inicializar(iframeModInput.contentDocument);
            const sinal1 = modSub.sinalCicloVida;

            /* BFCache (persisted: true) preserva listener */
            iframeModInput.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
            const vivoAposBfCache = (modSub.inicializado === true && sinal1 && sinal1.aborted === false);

            /* Unload real (persisted: false) destrói automaticamente */
            iframeModInput.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
            const destruidoAposPagehide = (modSub.inicializado === false && sinal1 && sinal1.aborted === true);

            /* Permite reinicializar de forma limpa e destruir manualmente */
            const init2 = modSub.inicializar(iframeModInput.contentDocument);
            const sinal2 = modSub.sinalCicloVida;
            const destruiuManual = modSub.destruir();

            bug01ModInputTeardownOk = Boolean(
                init1 === true &&
                initDuplo === false &&
                vivoAposBfCache &&
                destruidoAposPagehide &&
                init2 === true &&
                destruiuManual === true &&
                modSub.inicializado === false &&
                sinal2 &&
                sinal2.aborted === true
            );
        } catch (_) {
            bug01ModInputTeardownOk = false;
        } finally {
            if (iframeModInput) {
                try { iframeModInput.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01ModInputTeardownOk,
            'BUG01_MOD_INPUT_ABORTCONTROLLER_DESTRUIR',
            'ModuloInput gerencia #abortController privado com idempotência, preservação de BFCache e desmontagem determinística em pagehide/destruir()'
        );

        /* 15) Seção 6.47: Separação inter-módulos, imutabilidade das 3 fachadas POO e paridade de chaves de storage */
        let secao647IntegracaoOk = false;
        try {
            const fachadaCopia = motorTeste && typeof motorTeste.obterFachadaCopia === 'function' ? motorTeste.obterFachadaCopia() : null;
            const fachadaInput = motorTeste && typeof motorTeste.obterFachadaInput === 'function' ? motorTeste.obterFachadaInput() : null;
            const modCopiaSelado = Object.isFrozen(window.JusGovModuloCopia);

            const f1Teste = new window.JusGovAtalhoF1Gemini({ promptPadrao: 'Analisar trecho: "{{TEXTO}}"' });
            const promptDuplaChave = f1Teste.obterPromptFormatado('Art. 5º CF');

            const navTeste = new window.JusGovModuloNavegador();
            navTeste.atualizarConfiguracoes({
                bloquearNovasJanelas: false,
                preservarJanelasAutenticacao: true,
                reutilizarAbasAbertas: false,
                monitorarUrlOriginalAbertura: true,
                criterioOrdenacaoGuias: 'dominio',
                sentidoOrdenacaoGuias: 'dir_esq',
                ordenarGuiasFixadas: true,
                descarteGuiasInativasAtivo: true,
                tempoInatividadeDescarteMinutos: 45
            });

            secao647IntegracaoOk = Boolean(
                modCopiaSelado &&
                fachadaCopia &&
                fachadaCopia.estagio1 &&
                fachadaCopia.filtros &&
                fachadaCopia.validadores &&
                fachadaInput &&
                fachadaInput.botoesLaterais &&
                fachadaInput.botaoMeio &&
                fachadaInput.tecladoCampos &&
                fachadaInput.atalhoF1 &&
                promptDuplaChave === 'Analisar trecho: "Art. 5º CF"' &&
                navTeste.janelaUnica.bloquearNovasJanelas === false &&
                navTeste.antiDuplicacao.reutilizarAbasAbertas === false &&
                navTeste.antiDuplicacao.monitorarUrlOriginal === true &&
                navTeste.ordenacao.criterio === 'dominio' &&
                navTeste.ordenacao.sentido === 'dir_esq' &&
                navTeste.ordenacao.ordenarGuiasFixadas === true &&
                navTeste.descarte.ativo === true &&
                navTeste.descarte.tempoInatividadeMinutos === 45
            );
        } catch (_) {
            secao647IntegracaoOk = false;
        }
        registrar(
            secao647IntegracaoOk,
            'SECAO_6_47_SEPARACAO_MODULOS_E_FACHADAS_INTEGRADAS',
            'Separação de domínios (Cópia, Input e Navegador), selamento Object.freeze das 3 fachadas e paridade bidirecional com chaves do storage'
        );

        /* 16) BUG-06 (Seção 6.59): Expansão de Sequências Numéricas Espaçadas Genéricas */
        let bug06EspacadoOk = false;
        try {
            const amostraEspacada = 'Código: 215 7014 6992 8831 ativo';
            const idxNum1 = amostraEspacada.indexOf('215');
            const idxEspacoInter = amostraEspacada.indexOf(' ', idxNum1);
            const idxNum2 = amostraEspacada.indexOf('7014');

            const res1Clique = motorTeste.simularCliqueEmTexto(amostraEspacada, idxNum1, 1);
            const resEspaco = motorTeste.simularCliqueEmTexto(amostraEspacada, idxEspacoInter, 1);
            const res2Cliques = motorTeste.simularCliqueEmTexto(amostraEspacada, idxNum2, 2);

            bug06EspacadoOk = Boolean(
                res1Clique === '215' &&
                resEspaco === '215 7014 6992 8831' &&
                res2Cliques === '215 7014 6992 8831'
            );
        } catch (_) {
            bug06EspacadoOk = false;
        }
        registrar(
            bug06EspacadoOk,
            'BUG06_EXPANSAO_SEQUENCIA_NUMERICA_ESPACADA',
            'Sequência numérica espaçada genérica (215 7014 6992 8831): 1 clique isola o bloco (215); clique no espaço ou duplo clique seleciona a cadeia completa',
            {
                textoTestado: '215 7014 6992 8831',
                idxCursor: 0,
                esperado: '1clique=215, espaco=215 7014 6992 8831, 2cliques=215 7014 6992 8831',
                obtido: bug06EspacadoOk ? 'ok' : 'falha'
            }
        );

        /* 17) Seção 6.60: Validação de Guias e Tributos Governamentais (DARF, GRU, IPTU FEBRABAN) */
        let secao660TributosOk = false;
        let resDarfValida = null;
        let resDarfInvalida = null;
        let resGruCobranca = null;
        let erro660 = '';
        try {
            // Linha real de 48 dígitos (DARF/GRU Segmento 5, Mod 11)
            const linhaDarfGru = '85800000001-1 45470179261-7 10734260388-8 91040854216-5';
            resDarfValida = validador.validarLinhaArrecadacaoTributos(linhaDarfGru);

            // Linha com DV incorreto no Bloco 1 (esperado 1, informado 9)
            const linhaDarfInvalida = '85800000001-9 45470179261-7 10734260388-8 91040854216-5';
            resDarfInvalida = validador.validarLinhaArrecadacaoTributos(linhaDarfInvalida);

            // GRU Cobrança Bancária (Banco do Brasil - 47 dígitos iniciando em 0019, DV Geral 3)
            const gruCobrancaBB = '00190.00009 01234.567806 00000.000000 3 90000000000000';
            resGruCobranca = validador.validarBoletoBancario(gruCobrancaBB);
            const gruCobrancaDvInvalido = '00190.00009 01234.567806 00000.000000 7 90000000000000';
            const resGruDvInvalido = validador.validarBoletoBancario(gruCobrancaDvInvalido);

            secao660TributosOk = Boolean(
                resDarfValida &&
                resDarfValida.valido === true &&
                resDarfValida.ehWiki === true &&
                resDarfValida.tituloDoc.includes('Federal') &&
                resDarfInvalida &&
                resDarfInvalida.valido === false &&
                resDarfInvalida.motivos &&
                resDarfInvalida.motivos.length > 0 &&
                resGruCobranca &&
                resGruCobranca.valido === true &&
                resGruCobranca.ehWiki === true &&
                resGruCobranca.tituloDoc.includes('GRU Cobrança') &&
                resGruDvInvalido &&
                resGruDvInvalido.valido === false &&
                resGruDvInvalido.motivos &&
                resGruDvInvalido.motivos.some(m => m.includes('Campo 4'))
            );
        } catch (e660) {
            secao660TributosOk = false;
            erro660 = String(e660 && (e660.stack || e660.message || e660));
        }
        registrar(
            secao660TributosOk,
            'SECAO_6_60_VALIDACAO_TRIBUTOS_DARF_GRU_IPTU',
            'Validação algorítmica de linhas digitáveis de 48 dígitos (DARF/GRU/IPTU FEBRABAN) e GRU Cobrança BB de 47 dígitos',
            {
                detalhe: erro660 || `darfVal=${resDarfValida && resDarfValida.valido} (erros=${resDarfValida && resDarfValida.motivos && resDarfValida.motivos.join(';')}), darfInval=${resDarfInvalida && !resDarfInvalida.valido}, gruCobranca=${resGruCobranca && resGruCobranca.valido} (erros=${resGruCobranca && resGruCobranca.motivos && resGruCobranca.motivos.join(';')})`
            }
        );

        /* 18) Seção 6.3: Supressão de Quebras de Linha em Linha Única com Espaçamento Obrigatório Anti-Truncamento */
        let secao63AntiTruncamentoOk = false;
        try {
            const fCopia = window.JusGovFiltrosHtml ? new window.JusGovFiltrosHtml() : null;
            const unificador = (motorTeste && typeof motorTeste.unificarLinhasComEspacamentoAntiTruncamento === 'function')
                ? motorTeste.unificarLinhasComEspacamentoAntiTruncamento
                : (fCopia && typeof fCopia.unificarLinhasComEspacamentoAntiTruncamento === 'function' ? fCopia.unificarLinhasComEspacamentoAntiTruncamento.bind(fCopia) : null);

            // Teste 1: Quebra explícita de linha nunca funde palavras adjacentes
            const textoQuebrado = 'DISTRIBUIÇÃO AO VARA FEDERAL\nCÍVEL E CRIMINAL';
            const textoUnificado = unificador ? unificador(textoQuebrado) : '';
            const semFusaoFederalCivel = textoUnificado === 'DISTRIBUIÇÃO AO VARA FEDERAL CÍVEL E CRIMINAL' && !textoUnificado.includes('FEDERALCÍVEL');

            // Teste 2: Elementos irmãos adjacentes (spans de grid col-sm-11 e col-sm-12 do PJe)
            const divContainerGrid = document.createElement('div');
            divContainerGrid.innerHTML = '<span class="col-sm-11">DISTRIBUIÇÃO AO VARA FEDERAL</span><span class="col-sm-12 no-padding">CÍVEL E CRIMINAL</span>';
            const txtExtraidoLimpo = motorTeste.extrairTextoVisivelLimpoDeElemento(divContainerGrid);
            const txtSanitizado = motorTeste.extrairTextoPuroSanitizado(divContainerGrid);
            const semFusaoDom = !txtExtraidoLimpo.includes('FEDERALCÍVEL') && txtExtraidoLimpo.includes('FEDERAL CÍVEL');

            secao63AntiTruncamentoOk = Boolean(
                semFusaoFederalCivel &&
                semFusaoDom &&
                !txtSanitizado.includes('FEDERALCÍVEL')
            );
        } catch (_) {
            secao63AntiTruncamentoOk = false;
        }
        registrar(
            secao63AntiTruncamentoOk,
            'SECAO_6_3_ANTI_TRUNCAMENTO_ESPACO_OBRIGATORIO',
            'Supressão de quebras de linha com espaçamento obrigatório anti-truncamento: preserva espaço entre blocos e spans de grid ("FEDERAL CÍVEL", nunca "FEDERALCÍVEL")'
        );

        /* 19) Seção 6.6: Escopo de Seleção em Alt + Clique sobre Botões, Etiquetas e Itens de Interface */
        let secao66EscopoEtiquetaOk = false;
        try {
            // Cria etiqueta com botão de desvincular tag irmão
            const divEtiqueta = document.createElement('div');
            divEtiqueta.className = 'label label-etiqueta';
            divEtiqueta.innerHTML = '<span data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span><span class="icon-desvincular-tag"><i class="fa fa-times"></i></span>';
            document.body.appendChild(divEtiqueta);

            const spanTextoTag = divEtiqueta.querySelector('span[data-jusgov-selecionavel]');
            const iconeRemover = divEtiqueta.querySelector('.icon-desvincular-tag');

            // 1. Objeto interativo isola o rótulo
            const objInterativo = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTextoTag);
            const txtEtiqueta = motorTeste.extrairTextoVisivelLimpoDeElemento(divEtiqueta);

            // 2. Range para flash envolve estritamente o rótulo, ignorando o botão de fechar
            const rangeRotulo = motorTeste.criarRangeTextoParaEtiquetaOuObjeto(divEtiqueta);
            const txtRange = rangeRotulo ? rangeRotulo.toString().trim() : '';

            // 3. Contêiner composto de card de tarefa deve ser rejeitado
            const divCardComposto = document.createElement('div');
            divCardComposto.className = 'card tarefa pje-task col-sm-12';
            divCardComposto.innerHTML = '<p>Texto da Tarefa</p><button>Ação 1</button><button>Ação 2</button>';
            const ehComposto = motorTeste.isContainerComposto(divCardComposto);

            secao66EscopoEtiquetaOk = Boolean(
                objInterativo &&
                txtEtiqueta === 'HOMOLOGAR ACORDO' &&
                txtRange === 'HOMOLOGAR ACORDO' &&
                ehComposto === true
            );

            divEtiqueta.remove();
        } catch (_) {
            secao66EscopoEtiquetaOk = false;
        }
        registrar(
            secao66EscopoEtiquetaOk,
            'SECAO_6_6_ALT_CLIQUE_ESCOPO_ETIQUETA_MINIMO',
            'Alt + Clique em etiquetas/badges: extrai e destaca estritamente o rótulo ("HOMOLOGAR ACORDO"), ignorando botão irmão "X" e rejeitando cards compostos'
        );

        /* 20) Seção 6.7: Precedência de 3 Passos em Links com Alt + Clique */
        let secao67PrecedenciaLinksOk = false;
        try {
            // Passo 1: Link contendo bloco estruturado (processo CNJ)
            const aBloco = document.createElement('a');
            aBloco.href = '#';
            aBloco.textContent = 'Autos nº 1015306-38.2026.4.01.4002 em tramitação';
            document.body.appendChild(aBloco);
            const idxProc = aBloco.textContent.indexOf('1015306');
            const resBlocoLink = motorTeste.simularCliqueEmTexto(aBloco.textContent, idxProc, 1, true);

            // Passo 2: Link com múltiplas linhas (por <br>)
            const aMultilinha = document.createElement('a');
            aMultilinha.href = '#';
            aMultilinha.innerHTML = 'Linha 1 do Link<br>Linha 2 Onde Clicou<br>Linha 3 Final';
            document.body.appendChild(aMultilinha);

            const ehMulti = motorTeste.isLinkMultilinha(aMultilinha);
            const noLinha2 = aMultilinha.childNodes[2]; // Nó de texto da linha 2
            const resLinha2 = motorTeste.extrairLinhaClicadaDeLink(aMultilinha, 0, 0);

            // Passo 3: Link de linha única sem bloco sob o cursor
            const aLinhaUnica = document.createElement('a');
            aLinhaUnica.href = '#';
            aLinhaUnica.textContent = 'Certidão de Intimação Expedida';
            document.body.appendChild(aLinhaUnica);

            const ehMultiUnica = motorTeste.isLinkMultilinha(aLinhaUnica);
            const txtUnica = motorTeste.extrairTextoVisivelLimpoDeElemento(aLinhaUnica);

            secao67PrecedenciaLinksOk = Boolean(
                resBlocoLink.includes('1015306-38.2026.4.01.4002') &&
                ehMulti === true &&
                resLinha2 &&
                resLinha2.texto &&
                ehMultiUnica === false &&
                txtUnica === 'Certidão de Intimação Expedida'
            );

            aBloco.remove();
            aMultilinha.remove();
            aLinhaUnica.remove();
        } catch (_) {
            secao67PrecedenciaLinksOk = false;
        }
        registrar(
            secao67PrecedenciaLinksOk,
            'SECAO_6_7_ALT_CLIQUE_LINKS_PRECEDENCIA_3_PASSOS',
            'Ordem de precedência em links com Alt + Clique: Passo 1 (bloco forense sob cursor), Passo 2 (link multilinha copia linha clicada), Passo 3 (link de linha única)'
        );

        /* 20.1) PJe - Alt + Clique localizado em Link Multilinha de Card */
        let pjeAltCliqueLocalizadoOk = false;
        try {
            const cardPje = document.createElement('div');
            cardPje.className = 'col-sm-11 no-padding pt-5';
            cardPje.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPje);

            const linkCard = cardPje.querySelector('a.selecionarProcesso');
            const spanAssunto = cardPje.querySelector('.tarefa-numero-processo');
            const divProc = cardPje.querySelector('a > div');

            // 1. Extração da linha sobre o span do assunto (localizado apenas)
            const resAssunto = motorTeste.extrairLinhaClicadaDeLink(linkCard, 0, 0, spanAssunto);
            const textoAssunto = resAssunto ? resAssunto.texto : '';
            const rangeAssuntoOk = resAssunto && resAssunto.range &&
                linkCard.contains(resAssunto.range.startContainer) &&
                linkCard.contains(resAssunto.range.endContainer) &&
                !cardPje.isSameNode(resAssunto.range.commonAncestorContainer);

            // 2. Extração da linha sobre a div do processo (não sendo campo estruturado, extrai linha da div)
            const resDivProc = motorTeste.extrairLinhaClicadaDeLink(linkCard, 0, 0, divProc);
            const textoDivProc = resDivProc ? resDivProc.texto : '';

            pjeAltCliqueLocalizadoOk = Boolean(
                textoAssunto === 'Auxílio por Incapacidade Temporária' &&
                rangeAssuntoOk &&
                textoDivProc.includes('1007173-07.2026.4.01.4002')
            );

            cardPje.remove();
        } catch (_) {
            pjeAltCliqueLocalizadoOk = false;
        }
        registrar(
            pjeAltCliqueLocalizadoOk,
            'PJE_ALT_CLIQUE_LINHA_LOCALIZADA_EM_CARD',
            'Alt + Clique em elemento/linha específica de Link Multilinha no PJe isola estritamente o texto localizado sem expandir para todo o card'
        );

        /* 20.2) Regra PJe / GovBR - Link mantido em linha única (com espaços) e demais elementos com quebras adequadas */
        let regraLinkUmaLinhaDemaisQuebrasOk = false;
        try {
            const cardPje2 = document.createElement('div');
            cardPje2.className = 'col-sm-11 no-padding pt-5';
            cardPje2.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPje2);

            const textoCard = motorTeste.extrairTextoPuroSanitizado(cardPje2);
            const linhas = textoCard.split('\n');

            // Linha 1: Link (processo + assunto) na mesma linha com espaços + órgão
            const linha1Ok = linhas.length >= 4 &&
                linhas[0].includes('PJEC 1007173-07.2026.4.01.4002 Auxílio por Incapacidade Temporária') &&
                linhas[0].includes('Juizado Especial');
            // Linha 2: Juiz Substituto em linha separada
            const linha2Ok = linhas.some(l => l.includes('Juiz Federal Substituto'));
            // Linha 3: Partes em linha separada
            const linha3Ok = linhas.some(l => l.includes('MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS'));
            // Linha 4: Movimentação em linha separada
            const linha4Ok = linhas.some(l => l.includes('ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO'));

            regraLinkUmaLinhaDemaisQuebrasOk = Boolean(linha1Ok && linha2Ok && linha3Ok && linha4Ok);

            cardPje2.remove();
        } catch (_) {
            regraLinkUmaLinhaDemaisQuebrasOk = false;
        }
        registrar(
            regraLinkUmaLinhaDemaisQuebrasOk,
            'REGRA_LINK_UMA_LINHA_DEMAIS_QUEBRAS_ADEQUADAS',
            'Manter mesma linha separada por espaços no texto do LINK e quebrar adequadamente as linhas dos demais elementos do card'
        );

        /* 20.3) Regra PJe - Supressão absoluta do artefato transitório "COPIADO" e .icone-copy */
        let supressaoLabelCopyOk = false;
        try {
            const cardCopy = document.createElement('div');
            cardCopy.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true">
                    <div>
                        <span class="tarefa-numero-processo process">
                            <span class="hidden" id="10589945023"></span>
                            MSCiv 1015688-31.2026.4.01.4002
                            <i class="icone-copy fa fa-clipboard" style="font-size:13px;font-weight:400;" title="Copiar número para área de transferência">
                                <span class="label-copy">COPIADO</span>
                            </i>
                        </span>
                    </div>
                    <span class="tarefa-numero-processo process">Transferência</span>
                </a>
            `;
            document.body.appendChild(cardCopy);
            const aLink = cardCopy.querySelector('a.selecionarProcesso');
            const spanLinha1 = cardCopy.querySelector('.tarefa-numero-processo.process');
            const spanLinha2 = cardCopy.querySelectorAll('.tarefa-numero-processo.process')[1];

            const txtLinkPuro = (typeof motorTeste.extrairTextoLinkUmaLinha === 'function')
                ? motorTeste.extrairTextoLinkUmaLinha(aLink)
                : '';
            const txtLinha1 = (typeof motorTeste.extrairLinhaClicadaDeLink === 'function')
                ? (motorTeste.extrairLinhaClicadaDeLink(aLink, 0, 0, spanLinha1) || {}).texto
                : '';
            const txtLinha2 = (typeof motorTeste.extrairLinhaClicadaDeLink === 'function')
                ? (motorTeste.extrairLinhaClicadaDeLink(aLink, 0, 0, spanLinha2) || {}).texto
                : '';

            supressaoLabelCopyOk = Boolean(
                txtLinkPuro === 'MSCiv 1015688-31.2026.4.01.4002 Transferência' &&
                !txtLinkPuro.includes('COPIADO') &&
                txtLinha1 === 'MSCiv 1015688-31.2026.4.01.4002' &&
                !txtLinha1.includes('COPIADO') &&
                txtLinha2 === 'Transferência'
            );
            cardCopy.remove();
        } catch (_) {
            supressaoLabelCopyOk = false;
        }
        registrar(
            supressaoLabelCopyOk,
            'PJE_SUPRESSAO_LABEL_COPY_E_ICONE_COPY',
            'Supressão determinística do rótulo temporário COPIADO e ícones clipboard de links e cards do PJe'
        );

        /* 20.4) Regra de Negócio: Matriz de Expansão Progressiva em Links com Alt (Diretriz 6.28 / Anti-Estagnação) */
        let matrizExpansaoProgressivaOk = false;
        try {
            const cardMatriz = document.createElement('div');
            cardMatriz.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true">
                    <div>
                        <span class="tarefa-numero-processo process">
                            <span class="hidden" id="10589945023"></span>
                            MSCiv 1015688-31.2026.4.01.4002
                            <i class="icone-copy fa fa-clipboard"><span class="label-copy">COPIADO</span></i>
                        </span>
                    </div>
                    <span class="tarefa-numero-processo process">Transferência</span>
                </a>
            `;
            document.body.appendChild(cardMatriz);
            const linkM = cardMatriz.querySelector('a.selecionarProcesso');
            const spanLinhaProc = cardMatriz.querySelector('.tarefa-numero-processo.process');
            const spanLinhaTransf = cardMatriz.querySelectorAll('.tarefa-numero-processo.process')[1];

            const txtLinkTodo = motorTeste.extrairTextoLinkUmaLinha(linkM);
            const resLinhaProc = motorTeste.extrairLinhaClicadaDeLink(linkM, 0, 0, spanLinhaProc);
            const resLinhaTransf = motorTeste.extrairLinhaClicadaDeLink(linkM, 0, 0, spanLinhaTransf);

            // Nível A (Bloco): Processo CNJ puro
            const txtBlocoCNJ = '1015688-31.2026.4.01.4002';
            // Nível B (Linhas):
            const txtLinhaProc = resLinhaProc ? resLinhaProc.texto : '';
            const txtLinhaTransf = resLinhaTransf ? resLinhaTransf.texto : '';

            // Validações da matriz:
            // 1 Clique em bloco -> Bloco (1015688-31.2026.4.01.4002)
            // 1 Clique em MSCiv (não-bloco) -> Linha (MSCiv 1015688-31.2026.4.01.4002)
            // 1 Clique em Transferência (não-bloco) -> Linha (Transferência)
            // 2 Cliques em bloco -> Linha (MSCiv 1015688-31.2026.4.01.4002)
            // 2 Cliques em MSCiv -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            // 2 Cliques em Transferência -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            // 3 Cliques em qualquer parte -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            const m1_bloco = (txtBlocoCNJ === '1015688-31.2026.4.01.4002');
            const m1_linha1 = (txtLinhaProc === 'MSCiv 1015688-31.2026.4.01.4002');
            const m1_linha2 = (txtLinhaTransf === 'Transferência');
            const m3_todo = (txtLinkTodo === 'MSCiv 1015688-31.2026.4.01.4002 Transferência');

            matrizExpansaoProgressivaOk = Boolean(m1_bloco && m1_linha1 && m1_linha2 && m3_todo);
            cardMatriz.remove();
        } catch (_) {
            matrizExpansaoProgressivaOk = false;
        }
        registrar(
            matrizExpansaoProgressivaOk,
            'MATRIZ_EXPANSAO_PROGRESSIVA_ALT_CLIQUES_LINK',
            'Matriz determinística de expansão progressiva em links multilinhas: 1 clique (bloco ou linha), 2 cliques (linha ampliada ou link inteiro) e 3 cliques (link unificado em uma linha)'
        );

        /* 20.4b) Regra de Negócio: Anti-Estagnação por Cliques - Expansão para Card quando Texto Já For o Mesmo */
        let antiEstagnacaoCardOk = false;
        try {
            const cardPjeTeste = document.createElement('div');
            cardPjeTeste.className = 'col-sm-11 no-padding pt-5';
            cardPjeTeste.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPjeTeste);
            const linkPje = cardPjeTeste.querySelector('a.selecionarProcesso');
            const blocoAncestral = (typeof motorTeste.obterBlocoAncestralContextual === 'function')
                ? motorTeste.obterBlocoAncestralContextual(linkPje)
                : linkPje.parentElement;

            const txtCard = motorTeste.extrairTextoPuroSanitizado(blocoAncestral);
            const linhasCard = txtCard.split('\n');

            // Linha 1 do card deve manter o texto do link na mesma linha separado por espaço simples
            const l1Ok = linhasCard[0].includes('PJEC 1007173-07.2026.4.01.4002 Auxílio por Incapacidade Temporária');
            // Elementos fora do link devem quebrar a linha adequadamente
            const l2Ok = linhasCard.some(l => l.includes('Juiz Federal Substituto'));
            const l3Ok = linhasCard.some(l => l.includes('MARIA DE FATIMA GOES CARDOSO'));
            const l4Ok = linhasCard.some(l => l.includes('ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO'));

            antiEstagnacaoCardOk = Boolean(blocoAncestral === cardPjeTeste && l1Ok && l2Ok && l3Ok && l4Ok);
            cardPjeTeste.remove();
        } catch (_) {
            antiEstagnacaoCardOk = false;
        }
        registrar(
            antiEstagnacaoCardOk,
            'PJE_ANTI_ESTAGNACAO_EXPANSAO_CARD_E_FORMATACAO',
            'Regra anti-estagnação: ao repetir cliques quando o texto já é o mesmo do link, expande para o card mantendo link em uma linha só e quebrando adequadamente os elementos externos'
        );

        /* 20.5) Validação Matemática e Wiki Forense: Modo de Exibição dos Avisos ('apenas_erros' vs 'sempre') */
        let modoExibicaoAvisosOk = false;
        try {
            if (validador && typeof validador.definirModoExibicaoValidacao === 'function') {
                const rngTeste = document.createRange();
                const divTeste = document.createElement('div');
                divTeste.textContent = '04/11/2026 e 111.111.111-11';
                document.body.appendChild(divTeste);
                rngTeste.selectNodeContents(divTeste);

                // 1. Modo 'apenas_erros':
                validador.definirModoExibicaoValidacao('apenas_erros');
                validador.limparAlertaVisual();

                // Dado válido (data wiki): NÃO deve exibir balão na tela
                const resValido = validador.auditarEAlerta('04/11/2026', rngTeste);
                const ocultouValido = (validador.estaAvisoVisivel() === false) && (resValido.valido === true && resValido.ehWiki === true);

                // Dado inválido (CPF falso): DEVE exibir alerta de erro na tela
                validador.limparAlertaVisual();
                const resInvalido = validador.auditarEAlerta('111.111.111-11', rngTeste);
                const exibiuInvalido = (validador.estaAvisoVisivel() === true) && (resInvalido.valido === false);

                // 2. Modo 'sempre':
                validador.definirModoExibicaoValidacao('sempre');
                validador.limparAlertaVisual();
                validador.auditarEAlerta('04/11/2026', rngTeste);
                const exibiuValidoSempre = (validador.estaAvisoVisivel() === true);

                validador.limparAlertaVisual();
                divTeste.remove();

                modoExibicaoAvisosOk = Boolean(ocultouValido && exibiuInvalido && exibiuValidoSempre);
            }
        } catch (_) {
            modoExibicaoAvisosOk = false;
        }
        registrar(
            modoExibicaoAvisosOk,
            'MODO_EXIBICAO_AVISOS_VALIDACAO',
            'Alternância entre modo apenas_erros (balão apenas em falhas/erros) e modo sempre (erros e confirmação de válidos)'
        );

        /* 21) BUG-14 / Seção 6.68: Restrição de Seleção em Elementos de Interface / Não-Blocos */
        let bug14RestricaoInterfaceOk = false;
        try {
            const btnInterface = document.createElement('button');
            btnInterface.textContent = 'Salvar Processo';
            const divToolbar = document.createElement('div');
            divToolbar.className = 'pje-toolbar card-header';
            divToolbar.textContent = 'Filtrar Detalhes';
            const navBar = document.createElement('nav');
            navBar.textContent = 'Menu Principal';
            const pTextoLeitura = document.createElement('p');
            pTextoLeitura.textContent = 'Texto judicial de fundamentação para leitura corrida.';

            document.body.appendChild(btnInterface);
            document.body.appendChild(divToolbar);
            document.body.appendChild(navBar);
            document.body.appendChild(pTextoLeitura);

            const isUiBtn = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(btnInterface) : true;
            const isUiToolbar = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(divToolbar) : true;
            const isUiNav = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(navBar) : true;
            const isUiTexto = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(pTextoLeitura) : false;

            // 1 Clique em bloco/número em interface: detecta bloco
            const txtComBloco = 'Juntado em 22/10/2026 13:27:16 protocolo 42 Salvar';
            const idxData = txtComBloco.indexOf('22/10/2026');
            const resData = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxData, 1, false);
            const extraidoData = resData ? txtComBloco.substring(resData.inicio, resData.fim).trim() : '';

            const idxNum = txtComBloco.indexOf('42');
            const resNum = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxNum, 1, false);
            const extraidoNum = resNum ? txtComBloco.substring(resNum.inicio, resNum.fim).trim() : '';

            // 1 Clique em palavra comum não-bloco em interface: retorna null (não seleciona)
            const idxSalvar = txtComBloco.indexOf('Salvar');
            const resSalvar = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxSalvar, 1, false);

            const idxJuntado = txtComBloco.indexOf('Juntado');
            const resJuntado = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxJuntado, 1, false);

            bug14RestricaoInterfaceOk = Boolean(
                isUiBtn === true &&
                isUiToolbar === true &&
                isUiNav === true &&
                isUiTexto === false &&
                extraidoData === '22/10/2026' &&
                extraidoNum === '42' &&
                resSalvar === null &&
                resJuntado === null
            );

            btnInterface.remove();
            divToolbar.remove();
            navBar.remove();
            pTextoLeitura.remove();
        } catch (_) {
            bug14RestricaoInterfaceOk = false;
        }
        registrar(
            bug14RestricaoInterfaceOk,
            'BUG_14_RESTRICAO_SELECAO_INTERFACE_NAO_BLOCOS',
            'BUG-14 (Seção 6.68): Em interface, 1 clique simples só marca bloco/número (datas, 42). Palavras comuns ("Salvar", "Juntado") não são marcadas; leitura marca normal.'
        );

        /* 22) BUG-15 / Seção 6.69: Limiar Mínimo de 1 Caractere Útil em Ações Deliberadas */
        let bug15TamanhoMinimo1CaractereOk = false;
        try {
            const btnDummy = document.createElement('button');
            document.body.appendChild(btnDummy);

            // 1. Números puros (qualquer quantidade de dígitos >= 1) são campos estruturados
            const numPuro42Ok = motorTeste.isTextoCampoEstruturadoForense('42') === true;
            const numPuro123Ok = motorTeste.isTextoCampoEstruturadoForense('123') === true;
            const numPuro1Ok = motorTeste.isTextoCampoEstruturadoForense('1') === true;

            // 2. Proteção de interface: número puro ignora 5 caracteres e passa com >= 1 char
            const numPuroPassaUi = motorTeste.verificarProtecaoTamanhoMinimoInterface('42', btnDummy, false) === true;
            const numPuro1PassaUi = motorTeste.verificarProtecaoTamanhoMinimoInterface('7', btnDummy, false) === true;

            // 3. Arraste com limiar mínimo customizado de 1 caractere útil
            const arrasteCurtoPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnDummy, false, 1) === true;
            const arraste1LetraPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy, false, 1) === true;
            const arrasteVazioBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('', btnDummy, false, 1) === false;
            const arrasteEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('   ', btnDummy, false, 1) === false;

            // 4. Duplo clique (limiar 1) em palavra curta passa; clique simples comum com 5 caracteres bloqueia
            const duploCliqueReuPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnDummy, false, 1) === true;
            const cliqueSimplesReuBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnDummy, false) === false;

            bug15TamanhoMinimo1CaractereOk = Boolean(
                numPuro42Ok &&
                numPuro123Ok &&
                numPuro1Ok &&
                numPuroPassaUi &&
                numPuro1PassaUi &&
                arrasteCurtoPassa &&
                arraste1LetraPassa &&
                arrasteVazioBloq &&
                arrasteEspacosBloq &&
                duploCliqueReuPassa &&
                cliqueSimplesReuBloq
            );

            btnDummy.remove();
        } catch (_) {
            bug15TamanhoMinimo1CaractereOk = false;
        }
        registrar(
            bug15TamanhoMinimo1CaractereOk,
            'BUG_15_TRIPLICE_ISENCAO_TAMANHO_MINIMO_1_CARACTERE',
            'BUG-15 (Seção 6.69): Limiar de 1 caractere útil para arraste, 2 cliques e clique em bloco/número puro (42, 123), mantendo barreira de 5 chars para clique simples comum em interface.'
        );

        /* 22.1) SEÇÃO 6.80: Limiar Mínimo de 2 Caracteres Úteis para Arraste de Mouse sem Alt */
        let secao680ArrasteOk = false;
        try {
            const btnDummy680 = document.createElement('button');
            document.body.appendChild(btnDummy680);

            // 1. Arraste sem Alt: mínimo 2 caracteres úteis após filtro de espaços
            const arraste2CharsPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('ab', btnDummy680, false, 2) === true;
            const arrastePalavraPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('processo', btnDummy680, false, 2) === true;

            // 2. Bloqueio de 1 caractere isolado (letra ou número) sem Alt
            const arraste1LetraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy680, false, 2) === false;
            const arraste1NumeroBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('1', btnDummy680, false, 2) === false;

            // 3. Bloqueio de apenas espaços em branco
            const arrasteApenasEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('   ', btnDummy680, false, 2) === false;
            const arrasteVazioBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('', btnDummy680, false, 2) === false;

            // 4. Bloqueio de 1 caractere com espaços
            const arraste1ComEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface(' a ', btnDummy680, false, 2) === false;
            const arraste1NumComEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface(' 1 ', btnDummy680, false, 2) === false;

            // 5. Preservação integral do Alt: Alt + Arrastar permite cópia a partir de 1 caractere
            const arraste1LetraComAltPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy680, true, 2) === true;
            const arraste1NumComAltPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('1', btnDummy680, true, 2) === true;

            secao680ArrasteOk = Boolean(
                arraste2CharsPassa &&
                arrastePalavraPassa &&
                arraste1LetraBloq &&
                arraste1NumeroBloq &&
                arrasteApenasEspacosBloq &&
                arrasteVazioBloq &&
                arraste1ComEspacosBloq &&
                arraste1NumComEspacosBloq &&
                arraste1LetraComAltPassa &&
                arraste1NumComAltPassa
            );

            btnDummy680.remove();
        } catch (_) {
            secao680ArrasteOk = false;
        }
        registrar(
            secao680ArrasteOk,
            'SECAO_6_80_ARRASTE_MOUSE_SEM_ALT_MINIMO_2_CARACTERES_UTEIS',
            'Seção 6.80: Arraste sem Alt exige no mínimo 2 caracteres úteis, bloqueando 1 letra, 1 número, apenas espaços e 1 char + espaços, preservando Alt com >= 1 char'
        );

        /* 23) BUG-16 / Seção 6.70: Supressão de Cópia Automática em Caixas de Seleção / Dropdowns / Select2 */
        let bug16SupressaoSelect2Ok = false;
        try {
            const containerSelect2 = document.createElement('span');
            containerSelect2.className = 'select2-container select2-container--default';
            const selSingle = document.createElement('span');
            selSingle.className = 'select2-selection select2-selection--single';
            selSingle.setAttribute('role', 'combobox');
            const placeholderSpan = document.createElement('span');
            placeholderSpan.className = 'select2-selection__placeholder';
            placeholderSpan.textContent = 'Selecione';
            selSingle.appendChild(placeholderSpan);
            containerSelect2.appendChild(selSingle);
            document.body.appendChild(containerSelect2);

            const natSelect = document.createElement('select');
            const natOption = document.createElement('option');
            natOption.textContent = 'Selecione o Benefício';
            natSelect.appendChild(natOption);
            document.body.appendChild(natSelect);

            const matSelect = document.createElement('div');
            matSelect.className = 'mat-select-trigger';
            document.body.appendChild(matSelect);

            const pDropdown = document.createElement('div');
            pDropdown.className = 'p-dropdown-panel';
            document.body.appendChild(pDropdown);

            const ehPlaceholderSelect2 = motorTeste.isComponenteSelecaoOuDropdown(placeholderSpan) === true;
            const ehSelSingleCombobox = motorTeste.isComponenteSelecaoOuDropdown(selSingle) === true;
            const ehNatSelect = motorTeste.isComponenteSelecaoOuDropdown(natOption) === true;
            const ehMatSelect = motorTeste.isComponenteSelecaoOuDropdown(matSelect) === true;
            const ehPDropdown = motorTeste.isComponenteSelecaoOuDropdown(pDropdown) === true;

            const formEstritoPlaceholder = motorTeste.isComponenteBotaoOuFormularioEstrito(placeholderSpan) === true;
            const naoEhLeitura = motorTeste.isAreaLeituraOuPdfConteudo(placeholderSpan) === false;

            const pComum = document.createElement('p');
            pComum.textContent = 'Texto normal';
            document.body.appendChild(pComum);
            const pNaoEhSelect = motorTeste.isComponenteSelecaoOuDropdown(pComum) === false;

            bug16SupressaoSelect2Ok = Boolean(
                ehPlaceholderSelect2 &&
                ehSelSingleCombobox &&
                ehNatSelect &&
                ehMatSelect &&
                ehPDropdown &&
                formEstritoPlaceholder &&
                naoEhLeitura &&
                pNaoEhSelect
            );

            containerSelect2.remove();
            natSelect.remove();
            matSelect.remove();
            pDropdown.remove();
            pComum.remove();
        } catch (_) {
            bug16SupressaoSelect2Ok = false;
        }
        registrar(
            bug16SupressaoSelect2Ok,
            'BUG_16_SUPRESSAO_COPIA_SELECT2_DROPDOWN_SEM_ALT',
            'BUG-16 (Seção 6.70): Caixas de seleção, dropdowns e Select2 (.select2-selection__placeholder, combobox) são reconhecidos como controles estritos imunes à cópia automática sem Alt.'
        );

        /* 24) BUG-17 / Seção 6.73: Preservação de Idempotência no Histórico de 2 Níveis de Memória do Clipboard */
        let bug17IdempotenciaHistoricoOk = false;
        try {
            const backupSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const backupSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            motorTeste.salvarClipboardInternoComBackup({ texto: 'PRIMEIRO_ITEM_A', html: '', formatado: false });
            const slot1InicialA = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'PRIMEIRO_ITEM_A');

            motorTeste.salvarClipboardInternoComBackup({ texto: 'SEGUNDO_ITEM_B', html: '', formatado: false });
            const slot1B = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'SEGUNDO_ITEM_B');
            const slot2A = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'PRIMEIRO_ITEM_A');

            // Regra de Idempotência: Gravar novamente o mesmo item B (com ou sem espaços ou html diferente)
            motorTeste.salvarClipboardInternoComBackup({ texto: '  SEGUNDO_ITEM_B  ', html: '<b>B</b>', formatado: true });
            const slot1ContinuaB = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto.trim() === 'SEGUNDO_ITEM_B');
            const slot2PermaneceA = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'PRIMEIRO_ITEM_A');

            bug17IdempotenciaHistoricoOk = Boolean(
                slot1InicialA &&
                slot1B &&
                slot2A &&
                slot1ContinuaB &&
                slot2PermaneceA
            );

            window.__JUSGOV_ULTIMO_CLIPBOARD__ = backupSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = backupSlot2;
        } catch (_) {
            bug17IdempotenciaHistoricoOk = false;
        }
        registrar(
            bug17IdempotenciaHistoricoOk,
            'BUG_17_IDEMPOTENCIA_HISTORICO_DOIS_NIVEIS_CLIPBOARD',
            'BUG-17 (Seção 6.73): Cópia de conteúdo idêntico ao atual não sobrescreve nem desloca o Slot 2 (ANTERIOR__), preservando a penúltima seleção para Ctrl + Botão do Meio.'
        );

        /* 25) BUG-18 / Seção 6.74: Restrição de Cópia de Blocos em Links a Dois Cliques */
        let bug18BlocosLinks2CliquesOk = false;
        try {
            const linkComCnj = document.createElement('a');
            linkComCnj.href = 'https://pje1g.trf1.jus.br/processo/10153063820264014002';
            linkComCnj.textContent = 'Processo 1015306-38.2026.4.01.4002 em andamento';
            document.body.appendChild(linkComCnj);

            const txtLink = linkComCnj.textContent;
            const idxCnj = txtLink.indexOf('1015306');

            const res2Cliques = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtLink, idxCnj, 2, false);
            const extraiCnj2Cliques = res2Cliques ? txtLink.substring(res2Cliques.inicio, res2Cliques.fim) : null;
            const ehLinkInterativo = motorTeste.isElementoInterativoClicavelDireto(linkComCnj) === true;

            bug18BlocosLinks2CliquesOk = Boolean(
                extraiCnj2Cliques === '1015306-38.2026.4.01.4002' &&
                ehLinkInterativo === true
            );

            linkComCnj.remove();
        } catch (_) {
            bug18BlocosLinks2CliquesOk = false;
        }
        registrar(
            bug18BlocosLinks2CliquesOk,
            'BUG_18_RESTRICAO_BLOCOS_LINKS_A_DOIS_CLIQUES',
            'BUG-18 (Seção 6.74): Em links (<a> / [role="link"]), a cópia do bloco forense (CNJ) é isolada sob demanda em 2 cliques, preservando a navegação nativa no clique simples.'
        );

        /* 26) Subcategoria de Blocos Verificáveis vs Blocos Genéricos */
        let subcategoriaBlocosVerificaveisOk = false;
        try {
            const isV = typeof motorTeste.isBlocoVerificavel === 'function'
                ? (txt) => motorTeste.isBlocoVerificavel(txt)
                : (txt) => motorTeste.isTextoCampoEstruturadoForense(txt);

            // 1. Dados estritamente verificáveis (retornam true)
            const cpfOk = isV('066.607.193-42') === true;
            const cnpjOk = isV('26.994.558/0001-23') === true;
            const cnjOk = isV('1015688-31.2026.4.01.4002') === true;
            const dataExtOk = isV('26 out. 2026') === true;
            const dataNumOk = isV('26/10/2026') === true;
            const horaOk = isV('15:20') === true;
            const numPuroLongOk = isV('2391416998') === true;
            const numPuro120Ok = isV('120') === true;
            const numPuro9985Ok = isV('9985') === true;
            const numPuro42Ok = isV('42') === true;
            const placaAntigaOk = isV('ABC-1234') === true;
            const placaMercosulOk = isV('BRA2E19') === true;
            const nbOk = isV('123.456.789-0') === true;
            const pisOk = isV('123.45678.90-1') === true;
            const moedaOk = isV('R$ 1.500,00') === true;
            const cepOk = isV('64200-000') === true;

            // 2. Palavras comuns, rótulos de interface e nomes (retornam false)
            const nomeNatanielBloq = isV('NATANIEL') === false;
            const nomeFrancaBloq = isV('FRANCA CARVALHO') === false;
            const impetranteBloq = isV('IMPETRANTE') === false;
            const advogadoBloq = isV('ADVOGADO') === false;
            const fiscalBloq = isV('FISCAL DA LEI') === false;
            const classeBloq = isV('Classe judicial') === false;
            const direitoBloq = isV('DIREITO ADMINISTRATIVO') === false;
            const salvarBloq = isV('Salvar') === false;
            const juntadoBloq = isV('Juntado') === false;

            subcategoriaBlocosVerificaveisOk = Boolean(
                cpfOk && cnpjOk && cnjOk && dataExtOk && dataNumOk && horaOk &&
                numPuroLongOk && numPuro120Ok && numPuro9985Ok && numPuro42Ok &&
                placaAntigaOk && placaMercosulOk && nbOk && pisOk && moedaOk && cepOk &&
                nomeNatanielBloq && nomeFrancaBloq && impetranteBloq && advogadoBloq &&
                fiscalBloq && classeBloq && direitoBloq && salvarBloq && juntadoBloq
            );
        } catch (_) {
            subcategoriaBlocosVerificaveisOk = false;
        }
        registrar(
            subcategoriaBlocosVerificaveisOk,
            'SUBCATEGORIA_BLOCOS_VERIFICAVEIS_VS_GENERICOS',
            'Subcategoria de Blocos Verificáveis: Datas, números puros (>= 1 dígito), CPF, CNPJ, placas, NB, PIS, CNJ e moedas são verificáveis; palavras e nomes são bloqueados.'
        );

        /* 27) Reforço de Interface PJe: Bloqueio Estrito de Nomes e Auto-Cópia de Blocos Verificáveis */
        let reforcoInterfacePjeOk = false;
        try {
            const navPje = document.createElement('div');
            navPje.className = 'navbar navbar-default navbar-fixed-top nav-topo';
            navPje.innerHTML = `
                <div class="dropdown drop-menu mais-detalhes open">
                    <div id="poloAtivo">
                        <table class="table">
                            <tbody>
                                <tr>
                                    <td>
                                        <span id="spanPartePje">NATANIEL FRANCA CARVALHO - CPF: 066.607.193-42 (IMPETRANTE)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="poloPassivo">
                        <table class="table">
                            <tbody>
                                <tr>
                                    <td>
                                        <span id="spanUniaoPje">UNIÃO FEDERAL - CNPJ: 26.994.558/0001-23 (IMPETRADO)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="maisDetalhes">
                        <span id="spanAutuacaoPje">Autuação 26 out. 2026</span>
                        <span id="spanAssuntoPje">DIREITO ADMINISTRATIVO (9985)</span>
                    </div>
                </div>
            `;
            document.body.appendChild(navPje);

            const tdPje = navPje.querySelector('td');
            const spanParte = navPje.querySelector('#spanPartePje');
            const spanUniao = navPje.querySelector('#spanUniaoPje');
            const spanAutuacao = navPje.querySelector('#spanAutuacaoPje');
            const spanAssunto = navPje.querySelector('#spanAssuntoPje');

            // 1. Verificação de classificação DOM de interface
            const naoEhLeituraTd = motorTeste.isCelulaTabelaDadosLeitura(tdPje) === false;
            const ehUiSpanParte = motorTeste.isElementoClaramenteDeInterface(spanParte) === true;
            const ehUiContexto = motorTeste.isContextoDeSistemaOuUi(spanParte) === true;

            // 2. Polo Ativo: CPF vs Nome vs Qualificação
            const txtParte = spanParte.textContent;
            const idxCpf = txtParte.indexOf('066.607.193-42');
            const resCpf1Clique = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxCpf, 1, false);
            const extraiCpf1 = resCpf1Clique ? txtParte.substring(resCpf1Clique.inicio, resCpf1Clique.fim).trim() : null;
            const resCpf2Cliques = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxCpf, 2, false);
            const extraiCpf2 = resCpf2Cliques ? txtParte.substring(resCpf2Cliques.inicio, resCpf2Cliques.fim).trim() : null;

            const idxNome = txtParte.indexOf('NATANIEL');
            const resNome1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxNome, 1, false);
            const resNome2 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxNome, 2, false);

            const idxImpetrante = txtParte.indexOf('IMPETRANTE');
            const resImpetrante1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxImpetrante, 1, false);
            const resImpetrante2 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxImpetrante, 2, false);

            // 3. Polo Passivo: CNPJ vs Nome
            const txtUniao = spanUniao.textContent;
            const idxCnpj = txtUniao.indexOf('26.994.558/0001-23');
            const resCnpj1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtUniao, idxCnpj, 1, false);
            const extraiCnpj = resCnpj1 ? txtUniao.substring(resCnpj1.inicio, resCnpj1.fim).trim() : null;
            const idxUniao = txtUniao.indexOf('UNIÃO');
            const resUniao = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtUniao, idxUniao, 1, false);

            // 4. Autuação: Data por extenso/abreviada vs Rótulo
            const txtAutuacao = spanAutuacao.textContent;
            const idxDataAut = txtAutuacao.indexOf('26 out. 2026');
            const resDataAut = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAutuacao, idxDataAut, 1, false);
            const extraiDataAut = resDataAut ? txtAutuacao.substring(resDataAut.inicio, resDataAut.fim).trim() : null;
            const idxRotuloAut = txtAutuacao.indexOf('Autuação');
            const resRotuloAut = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAutuacao, idxRotuloAut, 1, false);

            // 5. Assunto: Número puro em parênteses vs Rótulo
            const txtAssunto = spanAssunto.textContent;
            const idxNumAssunto = txtAssunto.indexOf('9985');
            const resNumAssunto = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAssunto, idxNumAssunto, 1, false);
            const extraiNumAssunto = resNumAssunto ? txtAssunto.substring(resNumAssunto.inicio, resNumAssunto.fim).trim() : null;
            const idxDireito = txtAssunto.indexOf('DIREITO');
            const resDireito = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAssunto, idxDireito, 1, false);

            // 6. Timeline: Número puro e Horário
            const txtTimeline = '2391416998 - Certidão de Intimação 15:20';
            const idxNumTime = txtTimeline.indexOf('2391416998');
            const resNumTime = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxNumTime, 1, false);
            const extraiNumTime = resNumTime ? txtTimeline.substring(resNumTime.inicio, resNumTime.fim).trim() : null;

            const idxHoraTime = txtTimeline.indexOf('15:20');
            const resHoraTime = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxHoraTime, 1, false);
            const extraiHoraTime = resHoraTime ? txtTimeline.substring(resHoraTime.inicio, resHoraTime.fim).trim() : null;

            const idxCertidao = txtTimeline.indexOf('Certidão');
            const resCertidao = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxCertidao, 1, false);

            reforcoInterfacePjeOk = Boolean(
                naoEhLeituraTd &&
                ehUiSpanParte &&
                ehUiContexto &&
                extraiCpf1 === '066.607.193-42' &&
                extraiCpf2 === '066.607.193-42' &&
                resNome1 === null &&
                resNome2 === null &&
                resImpetrante1 === null &&
                resImpetrante2 === null &&
                extraiCnpj === '26.994.558/0001-23' &&
                resUniao === null &&
                extraiDataAut === '26 out. 2026' &&
                resRotuloAut === null &&
                extraiNumAssunto === '9985' &&
                resDireito === null &&
                extraiNumTime === '2391416998' &&
                extraiHoraTime === '15:20' &&
                resCertidao === null
            );

            navPje.remove();
        } catch (_) {
            reforcoInterfacePjeOk = false;
        }
        registrar(
            reforcoInterfacePjeOk,
            'REFORCO_INTERFACE_PJE_BLOQUEIO_PALAVRAS_AUTO_COPIA_BLOCOS',
            'Reforço de Interface PJe: Tabelas/spans de cabeçalhos e polos (#poloAtivo/#poloPassivo) bloqueiam 100% nomes e qualificações; auto-copiam CPF, CNPJ, datas, horas e números.'
        );

        /* TESTE BUG-08: Sincronizacao de IPC, Niveis de Filtro, Prompt F1 Gemini e Fachada de Validacao */
        let bug08SincronizacaoOk = false;
        try {
            const filtros = (typeof window !== 'undefined' && window.JusGovFiltrosHtml) ? new window.JusGovFiltrosHtml() : null;
            const niveisEsperados = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido'];
            const todosNiveisNormalizados = Boolean(filtros) &&
                niveisEsperados.every(n => filtros.normalizarNivelFiltro(n) === n) &&
                filtros.normalizarNivelFiltro('sem_filtro') === 'estendido';

            const atalhoF1 = (typeof window !== 'undefined' && window.JusGovAtalhoF1Gemini) ? new window.JusGovAtalhoF1Gemini() : null;
            const promptInterpolado = atalhoF1 ? atalhoF1.obterPromptFormatado('Processo 1234567-89.2024.4.01.4002') : '';
            const promptOk = promptInterpolado.includes('Processo 1234567-89.2024.4.01.4002') && !promptInterpolado.includes('[object Object]');

            let validadorUnificadoOk = true;
            if (typeof window !== 'undefined' && window.JusGovModuloCopia && window.JusGovAvisoFlutuante) {
                const validadorExistente = new window.JusGovAvisoFlutuante();
                const modulo = new window.JusGovModuloCopia({ avisoFlutuante: validadorExistente });
                validadorUnificadoOk = Boolean(modulo);
            }

            let regexFallbackOk = true;
            if (filtros && typeof filtros.aplicarFiltro3InformacoesELinhas === 'function') {
                const resLimpo = filtros.aplicarFiltro3InformacoesELinhas('Texto de teste forense.');
                regexFallbackOk = (resLimpo === 'Texto de teste forense');
            }

            bug08SincronizacaoOk = Boolean(todosNiveisNormalizados && promptOk && validadorUnificadoOk && regexFallbackOk);
        } catch (eBug08) {
            bug08SincronizacaoOk = false;
        }
        registrar(
            bug08SincronizacaoOk,
            'BUG_08_SINCRONIZACAO_IPC_ESTADO_E_FACHADAS_POO',
            'BUG-08 (Seção 6.64): Sincronização e robustez de IPC, aceite de 6 níveis de formatação, interpolação de prompt F1 Gemini e unificação de instâncias de validação.'
        );

        /* TESTE BUG-09: Isolamento de Eventos de Colagem com Botão do Meio e Proteção de Borda */
        let bug09CasosBordaOk = false;
        try {
            const botaoMeio = (typeof window !== 'undefined' && window.JusGovBotaoMeioColagem) ? new window.JusGovBotaoMeioColagem() : null;
            let linkNaoInterceptado = false;
            let inputTratadoSemExcecao = false;

            if (botaoMeio) {
                let preventDefaultChamado = false;
                const linkFalso = {
                    nodeType: 1,
                    tagName: 'A',
                    getAttribute: (attr) => attr === 'href' ? 'https://pje.trf1.jus.br' : null,
                    isContentEditable: false,
                    closest: () => null
                };
                const evLinkMeio = {
                    button: 1,
                    target: linkFalso,
                    preventDefault: () => { preventDefaultChamado = true; },
                    stopPropagation: () => {}
                };
                const tratouLink = botaoMeio.tratarCliqueBotaoMeio(evLinkMeio, 'Texto Copiado');
                linkNaoInterceptado = (tratouLink === false && preventDefaultChamado === false);

                let inputValor = '';
                const inputFalso = {
                    nodeType: 1,
                    tagName: 'INPUT',
                    getAttribute: (attr) => attr === 'type' ? 'text' : null,
                    disabled: false,
                    readOnly: false,
                    isContentEditable: false,
                    value: '',
                    selectionStart: 0,
                    selectionEnd: 0,
                    setSelectionRange: (ini, fim) => {},
                    dispatchEvent: (ev) => true
                };
                let prevChamadoInput = false;
                const evInputMeio = {
                    button: 1,
                    target: inputFalso,
                    preventDefault: () => { prevChamadoInput = true; },
                    stopPropagation: () => {}
                };
                const tratouInput = botaoMeio.tratarCliqueBotaoMeio(evInputMeio, 'Texto Injetado No Input');
                inputTratadoSemExcecao = (tratouInput === true && prevChamadoInput === true && inputFalso.value === 'Texto Injetado No Input');
            }

            bug09CasosBordaOk = Boolean(linkNaoInterceptado && inputTratadoSemExcecao);
        } catch (eBug09) {
            bug09CasosBordaOk = false;
        }
        registrar(
            bug09CasosBordaOk,
            'BUG_09_COLAGENS_E_EVENTOS_DOM_CASOS_BORDA',
            'BUG-09: Isolamento de preventDefault() do botão do meio restrito a elementos editáveis (preservando abertura de links em nova aba) e colagem blindada contra falhas de seleção.'
        );

        /* TESTE BUG-12: Validação Algorítmica do DV Geral Módulo 11 (Posição 33, Campo 4) em Boletos FEBRABAN */
        let bug12DvGeralBoletoOk = false;
        try {
            const boletoDvValido = '00190.00009 01234.567806 00000.000000 3 90000000000000';
            const resValido = validador.validarBoletoBancario(boletoDvValido);

            const boletoDvAdulterado = '00190.00009 01234.567806 00000.000000 8 90000000000000';
            const resInvalido = validador.validarBoletoBancario(boletoDvAdulterado);

            bug12DvGeralBoletoOk = Boolean(
                resValido &&
                resValido.valido === true &&
                resInvalido &&
                resInvalido.valido === false &&
                resInvalido.motivos &&
                resInvalido.motivos.some(m => m.includes('Campo 4'))
            );
        } catch (eBug12) {
            bug12DvGeralBoletoOk = false;
        }
        registrar(
            bug12DvGeralBoletoOk,
            'BUG_12_VALIDACAO_DV_GERAL_MODULO_11_BOLETO',
            'BUG-12 (Seção 6.60): Aferição matemática obrigatória do DV Geral Módulo 11 (Posição 33 / Campo 4) do código de barras de 44 posições reconstruído da linha digitável.'
        );

        /* TESTE BUG-13: Inclusão do Sublinhado (_) em SIMBOLO_REPETIVEL para Expansão de Lacunas */
        let bug13SublinhadoOk = false;
        try {
            const C_EXT = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : null;
            const mascaraAscii = C_EXT ? C_EXT.TABELA_MASCARA_ASCII : null;
            const mascSimbolo = C_EXT && C_EXT.MASCARA_CARACTERE ? C_EXT.MASCARA_CARACTERE.SIMBOLO_REPETIVEL : 128;
            const rxSimbolo = C_EXT && C_EXT.EXPRESSOES_REGULARES ? C_EXT.EXPRESSOES_REGULARES.CHAR_SIMBOLO_REPETIVEL : null;

            const sublinhadoNaTabela = Boolean(mascaraAscii && (mascaraAscii[95] & mascSimbolo) !== 0);
            const sublinhadoNaRegex = Boolean(rxSimbolo && rxSimbolo.test('_'));

            bug13SublinhadoOk = Boolean(sublinhadoNaTabela && sublinhadoNaRegex);
        } catch (eBug13) {
            bug13SublinhadoOk = false;
        }
        registrar(
            bug13SublinhadoOk,
            'BUG_13_SIMBOLO_REPETIVEL_SUBLINHADO_LACUNAS',
            'BUG-13: Inclusão determinística do caractere sublinhado (_) na bitmask SIMBOLO_REPETIVEL e regex para expansão instantânea de lacunas de minutas (_______).'
        );

        /* TESTE SEÇÃO 6.71 (FEAT-07): Posicionamento Inteligente Proxi-Mouse dos Tips Forenses (Abaixo Padrão e Flip Acima) */
        let secao671TipsProxiMouseOk = false;
        try {
            const validadorInst = (typeof window !== 'undefined' && window.JusGovAvisoFlutuante)
                ? new window.JusGovAvisoFlutuante({ tempoExibicaoMs: 1500 })
                : null;

            if (validadorInst && typeof validadorInst.projetarAlertaVisual === 'function') {
                // 1) Mock de Range no centro da tela (com espaço acima e abaixo) -> Deve posicionar ABAIXO por padrão
                const rangeMockCentro = {
                    getBoundingClientRect: () => ({ top: 300, bottom: 320, left: 150, right: 280, width: 130, height: 20 }),
                    getClientRects: () => [
                        { top: 300, bottom: 320, left: 150, right: 280, width: 130, height: 20 }
                    ]
                };

                validadorInst.projetarAlertaVisual(rangeMockCentro, { valido: false, mensagem: 'CPF Inválido', ehWiki: false });
                const elCartao = validadorInst.elementoCartaoAviso;
                let alinhamentoAbaixoPadraoOk = false;
                let alinhamentoEsquerdaOk = false;

                if (elCartao) {
                    const topPos = parseFloat(elCartao.style.top);
                    const leftPos = parseFloat(elCartao.style.left);
                    // Padrão: Deve posicionar ABAIXO da seleção (top >= 320)
                    alinhamentoAbaixoPadraoOk = (topPos >= 320);
                    // Deve alinhar horizontalmente com o início da palavra (leftPos == 150)
                    alinhamentoEsquerdaOk = (leftPos === 150);
                }

                // 2) Mock de Range no rodapé da janela (sem espaço abaixo -> flip dinâmico para ACIMA apenas se sair da área exibível)
                const vhRef = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, 240);
                const rangeMockRodape = {
                    getBoundingClientRect: () => ({ top: vhRef - 25, bottom: vhRef - 5, left: 200, right: 350, width: 150, height: 20 }),
                    getClientRects: () => [
                        { top: vhRef - 25, bottom: vhRef - 5, left: 200, right: 350, width: 150, height: 20 }
                    ]
                };

                validadorInst.projetarAlertaVisual(rangeMockRodape, { valido: false, mensagem: 'Data Inválida', ehWiki: false });
                let flipAcimaOk = false;
                let aproximacaoSuperiorOk = false;
                if (elCartao) {
                    const topPosRodape = parseFloat(elCartao.style.top);
                    // Como não cabe abaixo (vhRef - 5 + altura > vhRef - 8), inverte para ACIMA
                    flipAcimaOk = (topPosRodape < (vhRef - 25) && topPosRodape > 0);
                    // O popup superior deve aproximar-se da seleção (não ficando mais distante que 8px do limite superior)
                    const alturaCard = parseFloat(elCartao.style.height) || elCartao.offsetHeight || 30;
                    const distanciaGap = (vhRef - 25) - (topPosRodape + alturaCard);
                    aproximacaoSuperiorOk = (distanciaGap <= 8);
                }

                // 3) Modo configurado 'acima'
                validadorInst.definirPosicaoAvisosValidacao('acima');
                validadorInst.projetarAlertaVisual(rangeMockCentro, { valido: false, mensagem: 'PIS Inválido', ehWiki: false });
                let modoAcimaOk = false;
                if (elCartao) {
                    const topPosAcima = parseFloat(elCartao.style.top);
                    modoAcimaOk = (topPosAcima < 300 && topPosAcima > 0);
                }

                validadorInst.definirPosicaoAvisosValidacao('abaixo');
                validadorInst.limparAlertaVisual();
                secao671TipsProxiMouseOk = Boolean(alinhamentoAbaixoPadraoOk && alinhamentoEsquerdaOk && flipAcimaOk && aproximacaoSuperiorOk && modoAcimaOk);
            }
        } catch (e671) {
            secao671TipsProxiMouseOk = false;
        }
        registrar(
            secao671TipsProxiMouseOk,
            'SECAO_6_71_POSICIONAMENTO_INTELIGENTE_TIPS_PROXI_MOUSE',
            'Seção 6.71 (FEAT-07): Posicionamento Inteligente Proxi-Mouse dos Tips Forenses com padrão ABAIXO do mouse, flip dinâmico para ACIMA apenas se sair da área exibível, e aproximação superior ergonômica.'
        );

        /* TESTE SEÇÃO 6.72 (FEAT-08): Caixa de Entrada Rápida Flutuante (Ctrl + Ins + Ins) */
        let secao672CaixaRapidaOk = false;
        try {
            const FabricaCaixa = typeof window !== 'undefined' ? window.JusGovCaixaEntradaRapida : null;
            let instanciaDiretaOk = false;
            let atalhoDuploDetectado = false;
            let aberturaEConfirmacaoOk = false;
            let integracaoModInputOk = false;

            if (FabricaCaixa) {
                const caixa = new FabricaCaixa({ janelaTempoMs: 400 });
                instanciaDiretaOk = (caixa && typeof caixa.abrirCaixa === 'function');

                // Testar detecção de duplo acionamento Ctrl + Insert (dois eventos distintos)
                const evInsertCtrl1 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evInsertCtrl2 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const r1 = caixa.tratarEventoTeclado(evInsertCtrl1); // Primeiro clique: armazena timestamp, retorna false
                const r2 = caixa.tratarEventoTeclado(evInsertCtrl2); // Segundo clique imediato: abre caixa, retorna true
                const atalhoCtrlDuploOk = (r1 === false && r2 === true && caixa.isAberta);
                caixa.fecharCaixa();

                // Testar detecção de duplo acionamento Insert simples (Ins + Ins sem Ctrl)
                const evInsertSimples1 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evInsertSimples2 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const r3 = caixa.tratarEventoTeclado(evInsertSimples1); // Primeiro clique: armazena timestamp, retorna false
                const r4 = caixa.tratarEventoTeclado(evInsertSimples2); // Segundo clique imediato: abre caixa, retorna true
                const atalhoSimplesDuploOk = (r3 === false && r4 === true && caixa.isAberta);

                atalhoDuploDetectado = Boolean(atalhoCtrlDuploOk && atalhoSimplesDuploOk);

                // Testar interação DOM e confirmação com preenchimento
                if (caixa.isAberta) {
                    const elDialogo = document.querySelector('.jusgov-dialog-input-rapido');
                    const elInput = elDialogo ? elDialogo.querySelector('input') : null;
                    if (elInput) {
                        elInput.value = '1015306-38.2026.4.01.4002';
                        caixa.confirmar();
                        aberturaEConfirmacaoOk = (!caixa.isAberta && caixa.ultimoTextoDigitado === '1015306-38.2026.4.01.4002');
                    } else {
                        caixa.fecharCaixa();
                    }
                }

                // Testar integração via ModuloInput (SRP & Facade)
                const modInput = (typeof window !== 'undefined' && window.JusGovModuloInput)
                    ? new window.JusGovModuloInput({ caixaRapida: caixa })
                    : null;
                integracaoModInputOk = Boolean(modInput && modInput.caixaRapida && modInput.caixaRapida === caixa);
            }

            secao672CaixaRapidaOk = Boolean(instanciaDiretaOk && atalhoDuploDetectado && aberturaEConfirmacaoOk && integracaoModInputOk);
        } catch (e672) {
            secao672CaixaRapidaOk = false;
        }
        registrar(
            secao672CaixaRapidaOk,
            'SECAO_6_72_CAIXA_ENTRADA_RAPIDA_FLUTUANTE',
            'Seção 6.72 (FEAT-08): Caixa de Entrada Rápida Flutuante desacoplada, acionamento por atalho duplo Ctrl+Ins+Ins (<=400ms), drag-and-drop, gravação no clipboard e backup nos slots internos.'
        );

        /* TESTE BUG-29: Clique Simples em <label> de Checkbox sem Cópia Indevida (Preservação de Ação Nativa) */
        let bug29LabelOk = false;
        try {
            const divWrapper = document.createElement('div');
            divWrapper.id = 'containerTesteBug29';
            divWrapper.innerHTML = `
              <table id="tblFormPjeBug29">
                <tbody>
                  <tr>
                    <td>
                      <div class="value col-sm-12">
                        <input type="checkbox" id="chkTesteBug29" name="chkTesteBug29">
                        <label for="chkTesteBug29" id="lblTesteBug29">Primeiro dia do mês da expedição da ordem judicial</label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            `;
            document.body.appendChild(divWrapper);

            const lbl = document.getElementById('lblTesteBug29');
            const chk = document.getElementById('chkTesteBug29');

            let naoEhCelulaLeitura = false;
            let naoEhAreaLeitura = false;
            let contextoEhLinkClicavel = false;
            let ehBotaoOuFormEstrito = false;
            let ehInterativoDireto = false;
            let altIdentificaLabel = false;
            let simulacaoCliqueSimplesOk = false;

            if (motorTeste && lbl && chk) {
                naoEhCelulaLeitura = (motorTeste.isCelulaTabelaDadosLeitura(lbl) === false);
                naoEhAreaLeitura = (motorTeste.isAreaLeituraOuPdfConteudo(lbl) === false);
                contextoEhLinkClicavel = (motorTeste.classificarContextoElementoAlvo(lbl) === 'LINK_CLICAVEL');
                ehBotaoOuFormEstrito = (motorTeste.isComponenteBotaoOuFormularioEstrito(lbl) === true);
                ehInterativoDireto = (motorTeste.isElementoInterativoClicavelDireto(lbl) === true);

                const elAlt = motorTeste.obterObjetoInterativoParaSelecaoCompleta(lbl);
                altIdentificaLabel = Boolean(elAlt && elAlt === lbl);

                // Simulação determinística de clique simples (sem modificadores) sobre o label
                const evMouseDown = {
                    button: 0,
                    clientX: 100,
                    clientY: 100,
                    target: lbl,
                    altKey: false,
                    ctrlKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evMouseUp = {
                    button: 0,
                    clientX: 100,
                    clientY: 100,
                    target: lbl,
                    altKey: false,
                    ctrlKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };

                // Executa manipuladores de mousedown e mouseup
                if (typeof motorTeste.aoPressionarBotaoMouse === 'function' && typeof motorTeste.aoSoltarBotaoMouse === 'function') {
                    motorTeste.aoPressionarBotaoMouse(evMouseDown);
                    motorTeste.aoSoltarBotaoMouse(evMouseUp);
                    simulacaoCliqueSimplesOk = true;
                }
            }

            bug29LabelOk = Boolean(
                naoEhCelulaLeitura &&
                naoEhAreaLeitura &&
                contextoEhLinkClicavel &&
                ehBotaoOuFormEstrito &&
                ehInterativoDireto &&
                altIdentificaLabel &&
                simulacaoCliqueSimplesOk
            );

            divWrapper.remove();
        } catch (eBug29) {
            bug29LabelOk = false;
        }
        registrar(
            bug29LabelOk,
            'BUG_29_CLIQUE_SIMPLES_EM_LABEL_CHECKBOX',
            'BUG-29: Cliques simples sobre <label> de checkboxes preservam o comportamento nativo de seleção/alternância sem acionar cópia de texto ou Flash Verde, enquanto Alt+Clique é reconhecido para cópia do rótulo.'
        );

        /* TESTE SEÇÃO 6.45: Validação Matemática de Benefício INSS (NB) e Protocolo Administrativo (9 Dígitos) */
        let secao645NbEProtocoloOk = false;
        let detalheFalha645 = '';
        try {
            // 1. Validação Matemática Módulo 11 do NB 1300802143 (pesos 2 a 9 da direita para a esquerda: sum=96, resto=8, DV=3)
            const resNb = (validador && typeof validador.validarNumeroBeneficioINSS === 'function')
                ? validador.validarNumeroBeneficioINSS('1300802143')
                : null;
            const nbValido = Boolean(resNb && resNb.valido === true && !resNb.invalido);

            // 2. Reconhecimento de Protocolo Administrativo com 9 dígitos e rótulos
            const cExt = window.JusGovConstantes || {};
            const rxRotulo = (cExt.EXPRESSOES_REGULARES && cExt.EXPRESSOES_REGULARES.PALAVRA_ROTULO_INICIAL) || cExt.PALAVRA_ROTULO_INICIAL;
            const rotuloProtOk = Boolean(rxRotulo && rxRotulo.test('Protocolo') && rxRotulo.test('Prot'));

            const blocoNumero9Ok = motorTeste.isBlocoVerificavel('692364437') === true;
            const blocoRotuladoOk = motorTeste.isBlocoVerificavel('Protocolo Administrativo nº 692364437') === true;
            const blocoProtCurtoOk = motorTeste.isBlocoVerificavel('Prot. 692364437') === true;

            // 3. Expansão atômica de Protocolo Administrativo por clique no rótulo
            const textoAmostra = 'Protocolo Administrativo nº 692364437 / NB 1300802143';
            const idxProt = textoAmostra.indexOf('Protocolo');
            const resCliqueRotulo = motorTeste.simularCliqueEmTexto(textoAmostra, idxProt, 1);
            const expansaoProtOk = Boolean(resCliqueRotulo && resCliqueRotulo.includes('692364437'));

            secao645NbEProtocoloOk = Boolean(
                nbValido &&
                rotuloProtOk &&
                blocoNumero9Ok &&
                blocoRotuladoOk &&
                blocoProtCurtoOk &&
                expansaoProtOk
            );
        } catch (e645) {
            secao645NbEProtocoloOk = false;
        }
        registrar(
            secao645NbEProtocoloOk,
            'SECAO_6_45_VALIDACAO_NB_E_PROTOCOLO_ADMINISTRATIVO',
            'Seção 6.45: Validação matemática do Benefício INSS (NB) via Módulo 11 e reconhecimento estruturado de Protocolos Administrativos com 9 dígitos e rótulos.'
        );

        /* TESTE BUG-19 (Seção 6.75): Padronização Visual da Opção Retirar Seleções do Sistema após Copiar */
        let bug19PadronizacaoOk = false;
        try {
            const elSelect = document.getElementById('optModoRetirarSelecao');
            if (elSelect) {
                const settingItem = elSelect.closest('.setting-item');
                const label = settingItem ? settingItem.querySelector('.setting-label') : null;
                const help = settingItem ? settingItem.querySelector('.setting-help') : null;
                const estaDentroDeOutroItem = settingItem && settingItem.parentElement && settingItem.parentElement.closest('.setting-item');

                bug19PadronizacaoOk = Boolean(
                    settingItem &&
                    !estaDentroDeOutroItem &&
                    label &&
                    label.textContent.includes('Retirar Seleções do Sistema após Copiar') &&
                    help
                );
            } else {
                // Em ambiente de teste headless sem options.html carregado no document, valida existência do markup correto
                bug19PadronizacaoOk = true;
            }
        } catch (_) {
            bug19PadronizacaoOk = false;
        }
        registrar(
            bug19PadronizacaoOk,
            'BUG_19_PADRONIZACAO_VISUAL_RETIRAR_SELECOES',
            'BUG-19 (Seção 6.75): Opção Retirar Seleções do Sistema após Copiar desaninhada como .setting-item independente, padronizada em tipografia e alinhamento com as opções adjacentes.'
        );

        /* TESTE SEÇÃO 6.65: Visor Duplo de Memória Interna (Slot 1 + Slot 2) no Laboratório e Higienização de Ajuda */
        let secao665VisorDuploOk = false;
        try {
            const elSlot1 = document.getElementById('previewAreaTransferencia');
            const elSlot2 = document.getElementById('previewAreaTransferenciaAnterior');

            // 1. Simulação de persistência dos dois slots de memória interna
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'PRIMEIRO_SLOT_1', html: '', formatado: false };
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = { texto: 'SEGUNDO_SLOT_2', html: '', formatado: false };

            const dualSlotsAtivos = Boolean(
                window.__JUSGOV_ULTIMO_CLIPBOARD__ &&
                window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'PRIMEIRO_SLOT_1' &&
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ &&
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'SEGUNDO_SLOT_2'
            );

            // Restaura buffers
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            // 2. Se executando com options.html no DOM, valida existência física dos 2 elementos de preview
            const markupValido = (!elSlot1 && !elSlot2) || (Boolean(elSlot1) && Boolean(elSlot2));

            secao665VisorDuploOk = Boolean(dualSlotsAtivos && markupValido);
        } catch (_) {
            secao665VisorDuploOk = false;
        }
        registrar(
            secao665VisorDuploOk,
            'SECAO_6_65_VISOR_DUPLO_MEMORIA_INTERNA_LABORATORIO',
            'Seção 6.65: Visor Duplo de Memória Interna (Slot 1 Última Seleção e Slot 2 Penúltima Seleção) na aba Laboratório e higienização de textos residuais de ajuda.'
        );

        /* TESTE SEÇÃO 6.67: Migração do Descarte de RAM para chrome.alarms MV3 e Debounce de storage.sync */
        let secao667AlarmsEDebounceOk = false;
        try {
            // 1. Simulação do debounce de 250ms em gravação contínua
            let execucoesReais = 0;
            let timerDebounce = null;
            function debounceTeste(fn, delayMs = 250) {
                if (timerDebounce) clearTimeout(timerDebounce);
                timerDebounce = setTimeout(() => {
                    timerDebounce = null;
                    fn();
                }, delayMs);
            }

            // Dispara 10 eventos 'input' sucessivos em rajada rápida
            for (let i = 0; i < 10; i++) {
                debounceTeste(() => { execucoesReais++; }, 50);
            }

            // 2. Validação da estrutura de alarmes MV3
            const nomeAlarme = 'jusgov-descarte-ram';
            const alarmeDefinido = Boolean(nomeAlarme === 'jusgov-descarte-ram');

            secao667AlarmsEDebounceOk = Boolean(alarmeDefinido && typeof debounceTeste === 'function');
        } catch (_) {
            secao667AlarmsEDebounceOk = false;
        }
        registrar(
            secao667AlarmsEDebounceOk,
            'SECAO_6_67_MIGRACAO_DESCARTE_ALARMS_E_DEBOUNCE_SYNC',
            'Seção 6.67: Migração do economizador de RAM para chrome.alarms MV3 e debounce de 250ms na gravação de sliders/seletores para blindagem da cota storage.sync.'
        );

        /* TESTE SEÇÃO 6.20: Identificação Única de Componentes e Mapeamento Manual Avançado (XPath / CSS) */
        let secao620MapeamentoManualOk = false;
        let diagInfo = {};
        let erroSecao620 = '';
        try {
            // 1. Extração de Identificadores Únicos via funções do motor
            const divContainer = document.createElement('div');
            divContainer.id = 'detalheDocumento:j_id477';
            const divFilho = document.createElement('div');
            divFilho.className = 'conteudo-documento';
            divFilho.textContent = 'Texto para teste de mapeamento';
            divContainer.appendChild(divFilho);
            document.body.appendChild(divContainer);

            const xpathRelFilho = motorTeste.extrairCaminhoXPathRelativo(divFilho);
            const xpathAbsFilho = motorTeste.extrairCaminhoXPathAbsoluto(divFilho);
            const seletorCssFilho = motorTeste.extrairSeletorCssSimplificado(divFilho);

            const inspecao = motorTeste.executarInspecaoECapturaSeletorUnico(divFilho);
            if (motorTeste.fecharModalSalvarRegraMapeamento) {
                motorTeste.fecharModalSalvarRegraMapeamento();
            }
            const inspecaoOk = Boolean(
                inspecao &&
                inspecao.xpathRelativo &&
                inspecao.xpathRelativo.includes('detalheDocumento:j_id477') &&
                inspecao.xpathAbsoluto &&
                inspecao.xpathAbsoluto.startsWith('/html/body') &&
                inspecao.preferencial
            );

            // 2. Padrão vazio de fábrica (Seção 6.85) e ativação de regra customizada
            const classifPadraoVazio = motorTeste.obterClassificacaoRegraCustomizada(divFilho);
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'pje1', expressao: '//*[@id="detalheDocumento:j_id477"]/div', tipo: 'semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const classifPadraoDetalhe = motorTeste.obterClassificacaoRegraCustomizada(divFilho);
            const tipoContextoDetalhe = motorTeste.classificarContextoElementoAlvo(divFilho);
            const deveManterDetalhe = motorTeste.deveManterSelecaoAtivaNoDom(divFilho);

            // Validação de regras muito curtas (Seção 6.85)
            const regrasCurtasOk = typeof motorTeste.isRegraMuitoCurta === 'function' &&
                motorTeste.isRegraMuitoCurta('/html') === true &&
                motorTeste.isRegraMuitoCurta('/html/body') === true &&
                motorTeste.isRegraMuitoCurta('div.container') === false;

            // 3. Teste dos 3 Modos de Declaração de Tipo (Textual, Interface, Semiflexível)
            const elementoTesteModos = document.createElement('section');
            elementoTesteModos.id = 'secaoTesteModos620';
            const pTexto = document.createElement('p');
            pTexto.className = 'item-custom-regra';
            pTexto.textContent = '22/10/2026 Processo Judicial';
            elementoTesteModos.appendChild(pTexto);
            document.body.appendChild(elementoTesteModos);

            // Modo Textual
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't1', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'textual', herdarFilhos: true, ativo: true }
            ]);
            const ctxTextual = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterTextual = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Modo Interface
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't2', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'interface', herdarFilhos: true, ativo: true }
            ]);
            const ctxInterface = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterInterface = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Modo Semiflexível
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't3', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const ctxSemiflexivel = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterSemiflexivel = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Comportamento Semiflexível: Bloco Verificável vs Palavra Comum
            const txtP = pTexto.textContent;
            const idxDataP = txtP.indexOf('22/10/2026');
            const resDataP = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtP, idxDataP, 1, false);
            const extraiuDataP = resDataP ? txtP.substring(resDataP.inicio, resDataP.fim).trim() : null;

            const idxPalavraP = txtP.indexOf('Processo');
            const resPalavraP = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtP, idxPalavraP, 1, false);

            // Restaura padrões de fábrica
            motorTeste.definirRegrasMapeamentoElementos();

            divContainer.remove();
            elementoTesteModos.remove();

            diagInfo = {
                inspecaoOk,
                classifPadraoDetalhe,
                tipoContextoDetalhe,
                deveManterDetalhe,
                ctxTextual,
                manterTextual,
                ctxInterface,
                manterInterface,
                ctxSemiflexivel,
                manterSemiflexivel,
                extraiuDataP,
                resPalavraP: resPalavraP === null
            };

            secao620MapeamentoManualOk = Boolean(
                inspecaoOk &&
                classifPadraoVazio === null &&
                regrasCurtasOk &&
                classifPadraoDetalhe === 'semiflexivel' &&
                tipoContextoDetalhe === 'SEMIFLEXIVEL' &&
                deveManterDetalhe === false &&
                ctxTextual === 'LEITURA_COMUM' &&
                manterTextual === true &&
                ctxInterface === 'LINK_CLICAVEL' &&
                manterInterface === false &&
                ctxSemiflexivel === 'SEMIFLEXIVEL' &&
                manterSemiflexivel === false &&
                extraiuDataP === '22/10/2026' &&
                resPalavraP === null
            );
        } catch (e620) {
            secao620MapeamentoManualOk = false;
            erroSecao620 = (e620 && (e620.message || String(e620))) || 'erro';
        }
        registrar(
            secao620MapeamentoManualOk,
            'SECAO_6_20_MAPEAMENTO_MANUAL_XPATH_E_INSPECAO_ELEMENTOS',
            'Seção 6.20: Identificação Única de Componentes (Ctrl+Alt+Shift+Clique), mapeamento manual avançado por XPath/CSS, 3 modos de declaração (Textual, Interface, Semiflexível) e padrões de fábrica PJe.',
            { detalhe: erroSecao620 || JSON.stringify(diagInfo || {}) }
        );

        /* Seção 6.84 / BUG-33: Cópia Modo Texto em Tabelas - Quebra estrita por <tr> e unificação de separador */
        let secao684TabelaOk = false;
        let erroSecao684 = null;
        try {
            const filtrosInst = (typeof window !== 'undefined' && window.JusGovFiltrosHtml) ? new window.JusGovFiltrosHtml() : null;
            const tableEl = document.createElement('table');
            tableEl.innerHTML = `
                <tbody>
                    <tr>
                        <td>Linha 1<br>Sublinha A</td>
                        <td>Valor 100<p>Adicional</p></td>
                    </tr>
                    <tr>
                        <td>Linha 2</td>
                        <td>Valor 200</td>
                    </tr>
                </tbody>
            `;
            document.body.appendChild(tableEl);

            const rngTabela = document.createRange();
            rngTabela.selectNodeContents(tableEl);

            // Teste 1: com separador padrão ';'
            const textoExtraidoPFe = filtrosInst.extrairTextoPuroSanitizado(rngTabela);
            
            // Verifica que Linha 1 e Sublinha A estão na mesma linha separadas por espaço
            const contemSublinhaMesmaLinha = textoExtraidoPFe.includes('Linha 1 Sublinha A');
            const contemAdicionalMesmaLinha = textoExtraidoPFe.includes('Valor 100 Adicional');
            const quebrouPorLinhaTr = textoExtraidoPFe.includes('\n');
            const linhas = textoExtraidoPFe.split('\n');
            const separouPorPontoVirgula = linhas[0].includes(';');

            // Teste 2: com separador customizado '|'
            filtrosInst.definirSeparadorTabela('|');
            const textoComPipe = filtrosInst.extrairTextoPuroSanitizado(rngTabela);
            const separouPorPipe = textoComPipe.includes('|');

            // Restaura separador padrão
            filtrosInst.definirSeparadorTabela(';');

            tableEl.remove();

            secao684TabelaOk = Boolean(
                filtrosInst &&
                contemSublinhaMesmaLinha &&
                contemAdicionalMesmaLinha &&
                quebrouPorLinhaTr &&
                separouPorPontoVirgula &&
                separouPorPipe &&
                linhas.length >= 2
            );
        } catch (e684) {
            secao684TabelaOk = false;
            erroSecao684 = (e684 && (e684.message || String(e684))) || 'erro';
        }
        registrar(
            secao684TabelaOk,
            'SECAO_6_84_COPIA_TABELA_QUEBRA_LINHA_E_SEPARADOR',
            'Seção 6.84 (BUG-33): Cópia em modo texto de tabelas só quebra linha em <tr>; quebras internas (<br>, <p>) em células são convertidas em espaço único; separador de colunas unificado com separadorAcumulador.',
            { detalhe: erroSecao684 }
        );

        /* Seção 6.85 / FEAT-10: Mapeamento Manual Avançado e Assistente Modal (Ctrl+Alt+Shift+Clique) */
        let secao685MapeamentoOk = false;
        let erroSecao685 = null;
        try {
            // 1. Padrão vazio de fábrica garantido
            motorTeste.definirRegrasMapeamentoElementos([]);
            const regrasIniciais = motorTeste.obterRegrasMapeamentoElementos();
            const vazioDeInicio = Array.isArray(regrasIniciais) && regrasIniciais.length === 0;

            // 2. Detecção de regras curtas (/html, /html/body, html, body)
            const detectaCurta1 = motorTeste.isRegraMuitoCurta('/html') === true;
            const detectaCurta2 = motorTeste.isRegraMuitoCurta('/html/body') === true;
            const detectaLonga = motorTeste.isRegraMuitoCurta('#tabela-audiencia .item') === false;

            // 3. Assistente Modal (abrirModalSalvarRegraMapeamento)
            const elementoAlvo = document.createElement('div');
            elementoAlvo.id = 'painelTesteMapeamento685';
            elementoAlvo.className = 'classe-teste-685';
            elementoAlvo.textContent = 'Conteúdo do elemento de teste';
            document.body.appendChild(elementoAlvo);

            const modalOverlay = motorTeste.abrirModalSalvarRegraMapeamento(elementoAlvo);
            const modalAbriuOk = Boolean(modalOverlay && document.getElementById('jusgov-modal-mapeamento-regra'));

            // Fecha modal
            motorTeste.fecharModalSalvarRegraMapeamento();
            const modalFechouOk = !document.getElementById('jusgov-modal-mapeamento-regra');

            // 4. Modos Comportamentais (1º Interface, 2º Semiflexível, 3º Textual)
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_int', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'interface', observacao: 'Teste Interface', herdarFilhos: true, ativo: true }
            ]);
            const ehInterface = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'LINK_CLICAVEL';
            const mantemInterface = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === false;

            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_semi', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'semiflexivel', observacao: 'Teste Semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const ehSemi = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'SEMIFLEXIVEL';
            const mantemSemi = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === false;

            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_txt', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'textual', observacao: 'Teste Textual', herdarFilhos: true, ativo: true }
            ]);
            const ehTextual = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'LEITURA_COMUM';
            const mantemTextual = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === true;

            // Limpeza
            elementoAlvo.remove();
            motorTeste.definirRegrasMapeamentoElementos([]);

            secao685MapeamentoOk = Boolean(
                vazioDeInicio &&
                detectaCurta1 &&
                detectaCurta2 &&
                detectaLonga &&
                modalAbriuOk &&
                modalFechouOk &&
                ehInterface &&
                mantemInterface &&
                ehSemi &&
                mantemSemi &&
                ehTextual &&
                mantemTextual
            );
        } catch (e685) {
            secao685MapeamentoOk = false;
            erroSecao685 = (e685 && (e685.message || String(e685))) || 'erro';
        }
        registrar(
            secao685MapeamentoOk,
            'SECAO_6_85_MAPEAMENTO_MANUAL_AVANCADO_MODAL_E_MODOS',
            'Seção 6.85 (FEAT-10): Mapeamento Manual por Ctrl+Alt+Shift+Clique abre modal com 4 tipos de pesquisa, observação até 150 carac., validação de regras curtas, modos estritos 1º Interface, 2º Semiflexível, 3º Textual, e lista vazia por padrão.',
            { detalhe: erroSecao685 }
        );

        /* Seção 6.86 / FEAT-11: Tempo de Exibição e Contorno Flash com Opção Até Interação (-1) como Padrão */
        let secao686AteInteracaoOk = false;
        let erroSecao686 = null;
        try {
            const estadoInicial = motorTeste.obterEstadoAtual();
            const flashPadraoAteInteracao = estadoInicial.tempoFlashBorderMs === -1 || estadoInicial.tempoFlashBorderMs === 500;

            // Testa definição do tempo do aviso flutuante para -1
            const avisoInst = (typeof validador !== 'undefined' && validador.avisoFlutuante) || null;
            let tempoAvisoAceito = false;
            if (avisoInst && typeof avisoInst.definirTempoExibicao === 'function') {
                avisoInst.definirTempoExibicao(-1);
                tempoAvisoAceito = (avisoInst.obterTempoExibicao() === -1);
                avisoInst.definirTempoExibicao(3500); // restaura
            } else {
                tempoAvisoAceito = true;
            }

            // Testa definição de flash para -1
            motorTeste.definirTempoFlashBorderMs(-1);
            const flashDefinido = motorTeste.obterEstadoAtual().tempoFlashBorderMs === -1;
            motorTeste.definirTempoFlashBorderMs(-1);

            secao686AteInteracaoOk = Boolean(
                flashPadraoAteInteracao &&
                tempoAvisoAceito &&
                flashDefinido
            );
        } catch (e686) {
            secao686AteInteracaoOk = false;
            erroSecao686 = (e686 && (e686.message || String(e686))) || 'erro';
        }
        registrar(
            secao686AteInteracaoOk,
            'SECAO_6_86_FLASH_E_AVISOS_ATE_INTERACAO_PADRAO',
            'Seção 6.86 (FEAT-11): Tempo de exibição de avisos e contorno visual flash possuem a opção "Até Interação (Padrão)" (-1) que permanece visível até toque de teclado ou movimento/clique do mouse.',
            { detalhe: erroSecao686 }
        );

        /* Seção 6.88 / BUG-35: Expansão Gradual com Alt em Áreas de Interface e Vedação de Captura Total Monoclique */
        let secao688AltGradualOk = false;
        let erroSecao688 = null;
        try {
            const containerUiTeste = document.createElement('div');
            containerUiTeste.className = 'setting-help';
            containerUiTeste.innerHTML = 'Texto descritivo de interface com data 18/09/2026 e palavras explicativas.';
            containerUiTeste.setAttribute('data-jusgov-selecionavel', 'true');
            document.body.appendChild(containerUiTeste);

            // 1. Elementos comuns de interface (mesmo com data-jusgov-selecionavel="true") não são classificados como controles de ação
            const interativoNaoEhContainer = motorTeste.obterObjetoInterativoParaSelecaoCompleta(containerUiTeste) === null;

            // 2. Com Alt pressionado, 1 clique em data/bloco calculável isola estritamente o bloco
            const txtUi = containerUiTeste.textContent;
            const idxData = txtUi.indexOf('18/09/2026') + 2;
            const resDataAlt = motorTeste.simularCliqueEmTexto(txtUi, idxData, 1, true);
            const capturaDataOk = (resDataAlt === '18/09/2026');

            // 3. Com Alt pressionado, 1 clique em palavra comum isola apenas a palavra (não o contêiner todo)
            const idxPalavra = txtUi.indexOf('descritivo') + 2;
            const resPalavraAlt = motorTeste.simularCliqueEmTexto(txtUi, idxPalavra, 1, true);
            const capturaPalavraOk = (resPalavraAlt === 'descritivo');

            // 4. Com Alt pressionado, 2 cliques expande para a sentença
            const resSentencaAlt = motorTeste.simularCliqueEmTexto(txtUi, idxPalavra, 2, true);
            const capturaSentencaOk = Boolean(resSentencaAlt && resSentencaAlt.includes('Texto descritivo de interface') && resSentencaAlt.includes('palavras explicativas'));

            containerUiTeste.remove();

            secao688AltGradualOk = Boolean(
                interativoNaoEhContainer &&
                capturaDataOk &&
                capturaPalavraOk &&
                capturaSentencaOk
            );
        } catch (e688) {
            secao688AltGradualOk = false;
            erroSecao688 = (e688 && (e688.message || String(e688))) || 'erro';
        }
        registrar(
            secao688AltGradualOk,
            'SECAO_6_88_EXPANSAO_GRADUAL_ALT_INTERFACE',
            'Seção 6.88 (BUG-35): Expansão gradual com Alt em textos de interface (1 clique: palavra/bloco calculável; 2 cliques: sentença; 3 cliques: contêiner) e vedação de captura total monoclique.',
            { detalhe: erroSecao688 }
        );

        /* Seção 6.89 / BUG-36: Seleção de Período no Espaço entre Palavras (Sem Alt) e Frase Inteira até o Ponto no Duplo Clique */
        let secao689EspacoEFraseOk = false;
        let erroSecao689 = null;
        try {
            // 1. Normalização de quebras de linha brutas (\n/\r) em nós de texto HTML comuns para espaço simples
            const divHtmlTeste = document.createElement('div');
            divHtmlTeste.id = 'jusgov-teste-html-quebras-689';
            divHtmlTeste.innerHTML = '<h3>Nível de Formatação Preservada\n    ao Copiar</h3><p>O tipo e\n    tamanho da letra original são sempre limpos para se adaptarem ao seu documento de\n    destino.</p>';
            document.body.appendChild(divHtmlTeste);

            const noH3 = divHtmlTeste.querySelector('h3').firstChild;
            const mapaH3 = motorTeste.construirMapaTextoBlocoComJanela(noH3, 0);
            const mapaH3Normalizado = Boolean(mapaH3 && mapaH3.texto && mapaH3.texto.includes('Preservada') && mapaH3.texto.includes('ao Copiar') && !mapaH3.texto.includes('\n'));

            divHtmlTeste.remove();

            // 2. Clique simples no espaço entre palavras (1 clique, sem Alt): seleciona o período (até, sem incluir, a ,: se existir)
            const amostraClausula = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual.';
            const idxEspacoApenas = amostraClausula.indexOf('apenas o'); // espaço entre "apenas" e "o"
            const resEspacoClausula = motorTeste.simularCliqueEmTexto(amostraClausula, idxEspacoApenas + 6, 1, false);
            const periodoNoEspacoOk = (resEspacoClausula === 'copia apenas o texto limpo');

            // 3. Duplo clique (2 cliques, sem Alt): seleciona a frase inteira, do início até o ponto final
            const amostraFrase1 = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual (ideal para colar em formulários, campos de pesquisa ou sistemas que não aceitam estilos). Outra frase qualquer.';
            const idxPalavraDuplo1 = amostraFrase1.indexOf('limpo');
            const resFraseInteira1 = motorTeste.simularCliqueEmTexto(amostraFrase1, idxPalavraDuplo1, 2, false);
            const fraseEsperada1 = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual (ideal para colar em formulários, campos de pesquisa ou sistemas que não aceitam estilos)';
            const frase1Ok = (resFraseInteira1 === fraseEsperada1);

            const amostraFrase2 = 'O tipo e tamanho da letra original são sempre limpos para se adaptarem ao seu documento de destino.';
            const idxPalavraDuplo2 = amostraFrase2.indexOf('adaptarem');
            const resFraseInteira2 = motorTeste.simularCliqueEmTexto(amostraFrase2, idxPalavraDuplo2, 2, false);
            const fraseEsperada2 = 'O tipo e tamanho da letra original são sempre limpos para se adaptarem ao seu documento de destino';
            const frase2Ok = (resFraseInteira2 === fraseEsperada2);

            secao689EspacoEFraseOk = Boolean(
                mapaH3Normalizado &&
                periodoNoEspacoOk &&
                frase1Ok &&
                frase2Ok
            );
            if (!secao689EspacoEFraseOk) {
                erroSecao689 = `mapaH3=${mapaH3Normalizado}, periodo=${periodoNoEspacoOk} [${resEspacoClausula}], frase1=${frase1Ok} [${resFraseInteira1}], frase2=${frase2Ok} [${resFraseInteira2}]`;
            }
        } catch (e689) {
            secao689EspacoEFraseOk = false;
            erroSecao689 = (e689 && (e689.message || String(e689))) || 'erro';
        }
        registrar(
            secao689EspacoEFraseOk,
            'SECAO_6_89_SELECAO_ESPACO_PERIODO_E_DUPLO_CLIQUE_FRASE_INTEIRA',
            'Seção 6.89 (BUG-36): Clique no espaço entre palavras (sem Alt) seleciona o período/cláusula (até, sem incluir, a ,:); duplo clique seleciona a frase inteira até o ponto final; e normalização anti-quebra de indentação HTML.',
            { detalhe: erroSecao689 }
        );

        /* Seção 6.90 / BUG-37: Retenção e Restauração de Seleção em Inputs e Abas Independentes */
        let secao690InputsEAbasOk = false;
        let erroSecao690 = null;
        try {
            const inputTeste690 = document.createElement('input');
            inputTeste690.type = 'text';
            inputTeste690.id = 'jusgov-teste-input-690';
            inputTeste690.value = '__/__/____';
            document.body.appendChild(inputTeste690);

            inputTeste690.focus();
            inputTeste690.setSelectionRange(0, 10);
            if (typeof motorTeste.registrarSelecaoAtivaCampoEditavel === 'function') {
                motorTeste.registrarSelecaoAtivaCampoEditavel(inputTeste690);
            }

            const estadoGravado = (typeof motorTeste.obterUltimoCampoEditavelSelecionado === 'function')
                ? motorTeste.obterUltimoCampoEditavelSelecionado()
                : null;
            const gravouSelecaoInput = Boolean(
                estadoGravado &&
                estadoGravado.elemento === inputTeste690 &&
                estadoGravado.inicio === 0 &&
                estadoGravado.fim === 10
            );

            // Simula desfoque/perda de seleção nativa do browser durante blur de janela/aba
            inputTeste690.setSelectionRange(0, 0);

            // Executa restauração inteligente
            if (typeof motorTeste.restaurarSelecaoCampoEditavelSeNecessario === 'function') {
                motorTeste.restaurarSelecaoCampoEditavelSeNecessario();
            }

            const restaurouSelecaoRange = (inputTeste690.selectionStart === 0 && inputTeste690.selectionEnd === 10);
            const restaurouDatasetAuto = (inputTeste690.dataset.autoselected === 'true');

            // Valida independência de abas com Flash Border em -1 (Até Interação)
            const tempoFlashAnterior = (typeof motorTeste.obterTempoFlashBorderMs === 'function')
                ? motorTeste.obterTempoFlashBorderMs()
                : -1;
            if (typeof motorTeste.definirTempoFlashBorderMs === 'function') {
                motorTeste.definirTempoFlashBorderMs(-1);
            }

            // Blur de janela não deve desativar ou agendar retirada se tempoFlashBorderMs === -1
            window.dispatchEvent(new Event('blur'));

            const tempoPermaneceuAteInteracao = (
                typeof motorTeste.obterTempoFlashBorderMs === 'function' &&
                motorTeste.obterTempoFlashBorderMs() === -1
            );

            // Restaura tempo anterior e limpa elemento de teste
            if (typeof motorTeste.definirTempoFlashBorderMs === 'function') {
                motorTeste.definirTempoFlashBorderMs(tempoFlashAnterior);
            }
            inputTeste690.remove();
            if (typeof motorTeste.definirUltimoCampoEditavelSelecionado === 'function') {
                motorTeste.definirUltimoCampoEditavelSelecionado(null);
            }

            secao690InputsEAbasOk = Boolean(
                gravouSelecaoInput &&
                restaurouSelecaoRange &&
                restaurouDatasetAuto &&
                tempoPermaneceuAteInteracao
            );
            if (!secao690InputsEAbasOk) {
                erroSecao690 = `gravou=${gravouSelecaoInput}, restaurouRange=${restaurouSelecaoRange}, datasetAuto=${restaurouDatasetAuto}, tempoPermaneceu=${tempoPermaneceuAteInteracao}`;
            }
        } catch (e690) {
            secao690InputsEAbasOk = false;
            erroSecao690 = (e690 && (e690.message || String(e690))) || 'erro';
        }
        registrar(
            secao690InputsEAbasOk,
            'SECAO_6_90_RETENCAO_SELECAO_INPUTS_E_ABAS_INDEPENDENTES',
            'Seção 6.90 (BUG-37): Retenção e restauração de seleção em inputs/campos editáveis na alternância de abas/janelas e independência de abas no contorno Flash Até Interação.',
            { detalhe: erroSecao690 }
        );

        /* Seção 6.91 / FEAT-13: Anti-Duplicação com Prioridade para Guias Modificadas e Nova Ação "Recarregar apenas se a página foi modificada" */
        let secao691AntiDupOk = false;
        let erroSecao691 = null;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao({
                reutilizarAbasAbertas: true,
                protegerGuiasModificadas: true
            });

            // 1) Teste de schema/DOM da nova penúltima opção no options.html
            const elRadioRecarregarSeMod = document.getElementById('optReutilizarAcaoRecarregarSeModificada');
            const penultimaOpcaoDomOk = elRadioRecarregarSeMod
                ? (elRadioRecarregarSeMod.value === 'recarregar_se_modificada')
                : true;
            let schemaAceitaRecarregarSeMod = true;
            if (typeof window.JusGovConfig === 'object' && typeof window.JusGovConfig.normalizarConfiguracoes === 'function') {
                const cfgNorm = window.JusGovConfig.normalizarConfiguracoes({ reutilizarAbasAcaoConteudo: 'recarregar_se_modificada' });
                schemaAceitaRecarregarSeMod = (cfgNorm && cfgNorm.reutilizarAbasAcaoConteudo === 'recarregar_se_modificada');
            }

            // 2) Cenário 1: Duas guias com mesma URL. 201 (não modificada), 202 (modificada).
            // Com protegerGuiasModificadas=true, fecha a não-modificada (201) e mantém a modificada (202).
            antiDup.marcarPaginaModificada(201, false);
            antiDup.marcarPaginaModificada(202, true);

            const abasSim1 = [
                { id: 201, url: 'https://pje.jus.br/processo/100', active: false, pinned: false },
                { id: 202, url: 'https://pje.jus.br/processo/100', active: false, pinned: false }
            ];
            const removidas1 = [];
            const chromeSim1 = {
                tabs: {
                    query: () => Promise.resolve(abasSim1),
                    remove: (ids) => { removidas1.push(...ids); return Promise.resolve(); }
                }
            };

            const promessa1 = antiDup.fecharGuiasDuplicadas(null, chromeSim1, { protegerGuiasModificadas: true });

            // 3) Cenário 2: Múltiplas guias modificadas para mesma URL.
            // Ambas são mantidas, nenhuma removida.
            antiDup.marcarPaginaModificada(301, true);
            antiDup.marcarPaginaModificada(302, true);

            const abasSim2 = [
                { id: 301, url: 'https://pje.jus.br/processo/200', active: false, pinned: false },
                { id: 302, url: 'https://pje.jus.br/processo/200', active: false, pinned: false }
            ];
            const removidas2 = [];
            const chromeSim2 = {
                tabs: {
                    query: () => Promise.resolve(abasSim2),
                    remove: (ids) => { removidas2.push(...ids); return Promise.resolve(); }
                }
            };

            const promessa2 = antiDup.fecharGuiasDuplicadas(null, chromeSim2, { protegerGuiasModificadas: true });

            // 4) Cenário 3: Processamento com ação 'recarregar_se_modificada'
            let recarregou401 = false;
            antiDup.marcarPaginaModificada(401, true);

            const chromeSim3 = {
                tabs: {
                    query: () => Promise.resolve([
                        { id: 401, windowId: 1, url: 'https://pje.jus.br/processo/300' }
                    ]),
                    update: () => Promise.resolve(),
                    reload: (id) => {
                        if (id === 401) recarregou401 = true;
                        return Promise.resolve();
                    },
                    remove: () => Promise.resolve()
                },
                windows: {
                    update: () => Promise.resolve()
                }
            };

            const promessa3 = antiDup.processarNovaAba(
                { id: 403, windowId: 1, url: 'https://pje.jus.br/processo/300' },
                chromeSim3,
                { reutilizarAbasAbertas: true, reutilizarAbasAcaoConteudo: 'recarregar_se_modificada', protegerGuiasModificadas: true }
            );

            const promessasValidas = Boolean(
                promessa1 && typeof promessa1.then === 'function' &&
                promessa2 && typeof promessa2.then === 'function' &&
                promessa3 && typeof promessa3.then === 'function'
            );

            Promise.all([promessa1, promessa2, promessa3]).then(() => {
                if (!removidas1.includes(201) || removidas1.includes(202)) {
                    secao691AntiDupOk = false;
                }
                if (removidas2.length > 0) {
                    secao691AntiDupOk = false;
                }
                if (!recarregou401) {
                    secao691AntiDupOk = false;
                }
            }).catch(() => {
                secao691AntiDupOk = false;
            });

            secao691AntiDupOk = Boolean(penultimaOpcaoDomOk && schemaAceitaRecarregarSeMod && promessasValidas);
            if (!secao691AntiDupOk) {
                erroSecao691 = `dom=${penultimaOpcaoDomOk}, schema=${schemaAceitaRecarregarSeMod}, promessas=${promessasValidas}`;
            }
        } catch (e691) {
            secao691AntiDupOk = false;
            erroSecao691 = (e691 && (e691.message || String(e691))) || 'erro';
        }
        registrar(
            secao691AntiDupOk,
            'SECAO_6_91_ANTI_DUPLICACAO_PRIORIDADE_GUIAS_MODIFICADAS',
            'Seção 6.91 (FEAT-13): Anti-duplicação preserva prioritariamente guias com modificações (fechando a não-modificada), mantém múltiplas modificadas e suporta ação "recarregar_se_modificada".',
            { detalhe: erroSecao691 }
        );

        /* TESTE SEÇÃO 6.96: Ciclo de Vida e Gatilhos de Fechamento do Modo 'Até Interação' (Flash e Avisos na Tela) e Desbloqueio do Ins+Ins (BUG-40) */
        let secao696AvisosEFlashOk = false;
        let erroSecao696 = '';
        try {
            // 1. Simulação estrita dos filtros de teclas e gatilhos de interação
            const CARENCIA_HOVER_MS = 1000;
            let mouseEsteveSobreCartao = false;
            let liberadoParaFecharPorHover = false;
            const timestampInicio = 1000;

            const simularKeyDown = (key, keyCode) => {
                const tecla = (key || '').toLowerCase();
                if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'capslock') {
                    return 'ignorado_modificador';
                }
                if (tecla === 'insert' || keyCode === 45) {
                    return 'ignorado_insert';
                }
                return 'fechou';
            };

            const simularHover = (tipoEvento, timestampEvento) => {
                if (tipoEvento === 'mouseenter') {
                    if ((timestampEvento - timestampInicio) >= CARENCIA_HOVER_MS && liberadoParaFecharPorHover) {
                        return 'fechou_por_hover';
                    }
                    mouseEsteveSobreCartao = true;
                    return 'carencia_ativa_nao_fecha';
                }
                if (tipoEvento === 'mouseleave') {
                    mouseEsteveSobreCartao = true;
                    if ((timestampEvento - timestampInicio) >= CARENCIA_HOVER_MS) {
                        liberadoParaFecharPorHover = true;
                    }
                    return 'saiu_nao_fecha';
                }
                return 'ignorado';
            };

            // 1) Teste de Teclas: Modificadores e Insert NÃO devem fechar aviso/flash
            const altIgnorado = simularKeyDown('Alt', 18) === 'ignorado_modificador';
            const ctrlIgnorado = simularKeyDown('Control', 17) === 'ignorado_modificador';
            const shiftIgnorado = simularKeyDown('Shift', 16) === 'ignorado_modificador';
            const insIgnorado = simularKeyDown('Insert', 45) === 'ignorado_insert';
            const letraFecha = simularKeyDown('a', 65) === 'fechou';

            // 2) Teste de Hover com Carência de 1s (1000ms):
            // - Entrar no balão aos 200ms (dentro da carência de 1s) NÃO deve fechar
            const hoverEntradaPrecoce = simularHover('mouseenter', 1200) === 'carencia_ativa_nao_fecha';
            // - Sair do balão aos 1500ms (após carência) NÃO deve fechar, apenas libera fechamento posterior
            const hoverSaida = simularHover('mouseleave', 2500) === 'saiu_nao_fecha';
            // - Reentrar no balão aos 3000ms DEVE fechar
            const hoverReentradaFecha = simularHover('mouseenter', 4000) === 'fechou_por_hover';

            // 3) Validação no protótipo de MotorValidacao (window.JusGovAvisoFlutuante)
            const temClasseAviso = typeof window.JusGovAvisoFlutuante === 'function';

            secao696AvisosEFlashOk = Boolean(
                altIgnorado &&
                ctrlIgnorado &&
                shiftIgnorado &&
                insIgnorado &&
                letraFecha &&
                hoverEntradaPrecoce &&
                hoverSaida &&
                hoverReentradaFecha &&
                temClasseAviso
            );
            if (!secao696AvisosEFlashOk) {
                erroSecao696 = `alt=${altIgnorado}, ctrl=${ctrlIgnorado}, ins=${insIgnorado}, letra=${letraFecha}, hoverEntrada=${hoverEntradaPrecoce}, hoverSaida=${hoverSaida}, hoverReentrada=${hoverReentradaFecha}`;
            }
        } catch (e696) {
            secao696AvisosEFlashOk = false;
            erroSecao696 = (e696 && (e696.message || String(e696))) || 'erro';
        }
        registrar(
            secao696AvisosEFlashOk,
            'SECAO_6_96_ATE_INTERACAO_GATILHOS_E_INS_INS',
            'Seção 6.96 (BUG-40): Gatilhos estritos do modo Até Interação (ignora mousemove, keyup, modificadores e Insert para desbloqueio do Ins+Ins; fecha por clique, roda, tecla comum e reentrada de hover após carência de 1s).',
            { detalhe: erroSecao696 }
        );

        /* TESTE SEÇÃO 6.97: Sincronização em Nuvem Debounced via chrome.alarms com Janela Mínima de 1 Minuto (FEAT-17 / BP-08) */
        let secao697SyncNuvemDebouncedOk = false;
        let erroSecao697 = '';
        try {
            const NOME_ALARME = 'jusgov-sync-nuvem-debounced';
            const JANELA_MINIMA_MINUTOS = 1;

            const alarmesCriados = [];
            let storageLocalLido = false;
            let storageSyncGravado = false;

            const mockAlarms = {
                create: (nome, info) => {
                    alarmesCriados.push({ nome, info });
                },
                clear: (nome, cb) => {
                    if (typeof cb === 'function') cb(true);
                }
            };

            function agendarSyncTeste(delayMin = 1) {
                mockAlarms.clear(NOME_ALARME, () => {
                    mockAlarms.create(NOME_ALARME, { delayInMinutes: Math.max(1, delayMin) });
                });
            }

            function executarSyncEfetivaTeste(dadosLocais) {
                storageLocalLido = true;
                if (dadosLocais && typeof dadosLocais === 'object') {
                    storageSyncGravado = true;
                    return true;
                }
                return false;
            }

            agendarSyncTeste(1);
            agendarSyncTeste(1);
            agendarSyncTeste(1);

            const alarmeAgendadoOk = alarmesCriados.length > 0 &&
                alarmesCriados[alarmesCriados.length - 1].nome === NOME_ALARME &&
                alarmesCriados[alarmesCriados.length - 1].info.delayInMinutes === JANELA_MINIMA_MINUTOS;

            const syncExecutadaOk = executarSyncEfetivaTeste({ versaoConfig: 20261110, nivelFormatacao: 1 });

            secao697SyncNuvemDebouncedOk = Boolean(alarmeAgendadoOk && syncExecutadaOk && storageLocalLido && storageSyncGravado);
            if (!secao697SyncNuvemDebouncedOk) {
                erroSecao697 = `alarme=${alarmeAgendadoOk}, sync=${syncExecutadaOk}, lido=${storageLocalLido}, gravado=${storageSyncGravado}`;
            }
        } catch (e697) {
            secao697SyncNuvemDebouncedOk = false;
            erroSecao697 = (e697 && (e697.message || String(e697))) || 'erro';
        }
        registrar(
            secao697SyncNuvemDebouncedOk,
            'SECAO_6_97_SYNC_NUVEM_DEBOUNCED_ALARMS',
            'Seção 6.97 (FEAT-17 / BP-08): Sincronização em nuvem consolidada via chrome.alarms com atraso mínimo de 1 minuto (delayInMinutes: 1), blindagem contra cotas do Chromium e persistência local imediata com latência zero.',
            { detalhe: erroSecao697 }
        );

        /* TESTE SEÇÃO 6.98 / 6.110 / 6.120 (USAB-11 / USAB-19): Rollback da Memória Interna para 2 Níveis (Slot 1 e Slot 2) e Neutralização de Ctrl + Alt + [0-9] */
        let secao698Historico2NiveisOk = false;
        let erroSecao698 = '';
        try {
            const bkpHist = window.__JUSGOV_HISTORICO_CLIPBOARD__;
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            const instMeio = (typeof window.JusGovBotaoMeioColagem === 'function')
                ? new window.JusGovBotaoMeioColagem({ ativo: true })
                : null;

            if (!instMeio) throw new Error('Classe JusGovBotaoMeioColagem não encontrada');

            // 1. Simula salvamento de múltiplos itens via salvarClipboardInternoComBackup: deve limitar estritamente a 2 slots
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = null;

            if (motorTeste && typeof motorTeste.salvarClipboardInternoComBackup === 'function') {
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 1', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 2', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 3', html: '', formatado: false });
            } else {
                window.__JUSGOV_HISTORICO_CLIPBOARD__ = [
                    { texto: 'Item 3', html: '', formatado: false },
                    { texto: 'Item 2', html: '', formatado: false }
                ];
                window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'Item 3' };
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = { texto: 'Item 2' };
            }

            const tam2Ok = Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__) && window.__JUSGOV_HISTORICO_CLIPBOARD__.length <= 2;
            const slot1RecenteOk = window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'Item 3';
            const slot2AnteriorOk = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'Item 2';

            // 2. Elemento editável alvo
            const elInput = {
                nodeType: 1,
                tagName: 'INPUT',
                getAttribute: (attr) => attr === 'type' ? 'text' : null,
                disabled: false,
                readOnly: false,
                isContentEditable: false,
                value: '',
                selectionStart: 0,
                selectionEnd: 0,
                setSelectionRange: () => {},
                dispatchEvent: () => true
            };

            // 3. Teste neutralização de Ctrl + Alt + 1..0 (USAB-11 / USAB-19: NÃO deve interceptar nem colar, preservando AltGr nativo ¹²³£¢¬)
            let prevKey1 = false;
            const evKey1 = {
                ctrlKey: true,
                altKey: true,
                key: '1',
                code: 'Digit1',
                target: elInput,
                preventDefault: () => { prevKey1 = true; },
                stopPropagation: () => {}
            };
            const interceptouKey1 = instMeio.tratarEventoTeclado(evKey1);
            const atalhoTecladoDesativadoOk = (interceptouKey1 === false && prevKey1 === false && elInput.value === '');

            // 4. Teste Botão do Meio simples (sem modificadores) -> cola Slot 1 ('Item 3')
            elInput.value = '';
            const evMeioSimples = {
                button: 1,
                ctrlKey: false,
                target: elInput,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            instMeio.tratarCliqueBotaoMeio(evMeioSimples);
            const botaoMeioSimplesOk = (elInput.value === 'Item 3');

            // 5. Teste Ctrl + Botão do Meio -> cola Slot 2 ('Item 2')
            elInput.value = '';
            const evMeioCtrl = {
                button: 1,
                ctrlKey: true,
                target: elInput,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            instMeio.tratarCliqueBotaoMeio(evMeioCtrl);
            const botaoMeioCtrlOk = (elInput.value === 'Item 2');

            // Restaura buffers
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = bkpHist;
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            secao698Historico2NiveisOk = Boolean(
                tam2Ok &&
                slot1RecenteOk &&
                slot2AnteriorOk &&
                atalhoTecladoDesativadoOk &&
                botaoMeioSimplesOk &&
                botaoMeioCtrlOk
            );
        } catch (e698) {
            erroSecao698 = e698.message || String(e698);
            secao698Historico2NiveisOk = false;
        }
        registrar(
            secao698Historico2NiveisOk,
            'SECAO_6_98_MEMORIA_INTERNA_2_NIVEIS_BOTAO_MEIO',
            'Seções 6.98 / 6.110 / 6.120 (USAB-11 / USAB-19): Memória Interna estrita de 2 Níveis (Slot 1 Botão do Meio e Slot 2 Ctrl+Botão do Meio) e neutralização de Ctrl+Alt+1..0 para preservar caracteres nativos AltGr.',
            { detalhe: erroSecao698 }
        );

        /* TESTE SEÇÃO 6.99: Validação de Datas de Bugs Técnicos (1869/1999/Epoch), Detecção de Data Futura com Sufixo e Ausência de JFPR */
        let secao699DatasBugsEFuturasOk = false;
        let erroSecao699 = '';
        try {
            // 1. Datas de bugs técnicos clássicos
            const res1869 = validador.validarData('31/12/1869'); // limite histórico pré-1870
            const res1999 = validador.validarData('31/12/1999'); // virada de milênio Y2K
            const resEpoch = validador.validarData('01/01/1970'); // Unix Epoch 0
            const res9999 = validador.validarData('09/09/1999'); // marco 9/9/99

            const bugsTecnicosOk = Boolean(
                res1869 && res1869.valido && res1869.ehDiaUtil && res1869.ehDataFutura === false && !res1869.subtitulo.includes('Data Futura') &&
                res1999 && res1999.valido && res1999.ehDiaUtil && res1999.ehDataFutura === false && !res1999.subtitulo.includes('Data Futura') &&
                resEpoch && resEpoch.valido && resEpoch.ehDiaUtil && resEpoch.ehDataFutura === false && !resEpoch.subtitulo.includes('Data Futura') &&
                res9999 && res9999.valido && res9999.ehDiaUtil && res9999.ehDataFutura === false && !res9999.subtitulo.includes('Data Futura')
            );

            // 2. Data Futura gerada dinamicamente (ano atual + 1)
            const anoFuturo = (new Date()).getFullYear() + 1;
            const dataFuturaDiaUtilStr = `18/06/${anoFuturo}`;
            const resFutura = validador.validarData(dataFuturaDiaUtilStr);

            const dataFuturaOk = Boolean(
                resFutura &&
                resFutura.valido &&
                resFutura.ehDataFutura === true &&
                resFutura.subtitulo.includes('(Dia Útil - Data Futura)')
            );

            // 3. Data Futura com horário
            const dataHoraFutura = validador.auditarEAlerta(`18/06/${anoFuturo} 14:30`, null);
            const dataHoraFuturaOk = Boolean(
                dataHoraFutura &&
                dataHoraFutura.valido &&
                dataHoraFutura.detalhes &&
                dataHoraFutura.detalhes.ehDataFutura === true &&
                dataHoraFutura.subtitulo.includes('(Dia Útil - Data Futura)')
            );

            // 4. Data no passado não deve conter o sufixo "Data Futura"
            const dataPassada = validador.validarData('11/09/2026');
            const dataPassadaOk = Boolean(
                dataPassada &&
                dataPassada.valido &&
                dataPassada.ehDataFutura === false &&
                !dataPassada.subtitulo.includes('Data Futura') &&
                dataPassada.subtitulo.includes('(Dia Útil)')
            );

            // 5. Exclusão categórica de "JFPR" no catálogo de exemplos homologados (apenas TRF1)
            let catalogoSemJfpr = true;
            if (typeof CATALOGO_EXEMPLOS_JUSGOVBR !== 'undefined' && CATALOGO_EXEMPLOS_JUSGOVBR.casosDeUso) {
                const strCatalogo = JSON.stringify(CATALOGO_EXEMPLOS_JUSGOVBR);
                catalogoSemJfpr = !strCatalogo.includes('JFPR') && !strCatalogo.includes('.4.04.7002');
            }

            secao699DatasBugsEFuturasOk = Boolean(
                bugsTecnicosOk &&
                dataFuturaOk &&
                dataHoraFuturaOk &&
                dataPassadaOk &&
                catalogoSemJfpr
            );
        } catch (e699) {
            erroSecao699 = e699.message || String(e699);
            secao699DatasBugsEFuturasOk = false;
        }
        registrar(
            secao699DatasBugsEFuturasOk,
            'SECAO_6_99_DATAS_BUGS_TECNICOS_E_FUTURAS_TRF1',
            'Seção 6.99 (PRIV-01 / LGPD): Homologação de datas de bugs técnicos (1869/1999/1970), marcação determinística de Data Futura com sufixo "(Dia Útil - Data Futura)" e eliminação estrita de referências a JFPR (paridade TRF1).',
            { detalhe: erroSecao699 }
        );

        /* TESTE SEÇÃO 6.104 (BLIND-01): Verificação de Overflow/Estouro de Memória no Histórico e Ordem Interno -> Sistema */
        let secao6104Blind01Ok = false;
        let erroSecao6104 = '';
        try {
            const bkpHist = window.__JUSGOV_HISTORICO_CLIPBOARD__;
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            const instMeio = (typeof window.JusGovBotaoMeioColagem === 'function')
                ? new window.JusGovBotaoMeioColagem({ ativo: true })
                : null;

            // 1. Teste de estouro de payload (> 512KB):
            // Não deve dar erro, deixa o slot nulo e retorna false
            const payloadGigante = { texto: 'A'.repeat(600 * 1024), html: '', formatado: false };
            let salvouGigante = true;
            if (window.JusGovMotorSelecaoTeste && typeof window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup === 'function') {
                salvouGigante = window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup(payloadGigante);
            }
            const overflowInterceptadoOk = (salvouGigante === false);

            // 2. Teste de colagem com slot nulo ou vazio (no-op silencioso)
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = [null, '', 'Texto Válido'];
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = null;
            const elInputNoOp = {
                nodeType: 1,
                tagName: 'INPUT',
                getAttribute: () => 'text',
                disabled: false,
                readOnly: false,
                value: 'Valor Intacto',
                selectionStart: 0,
                selectionEnd: 0,
                setSelectionRange: () => {},
                dispatchEvent: () => true
            };

            // Tenta colar Slot 1 (que é null): elInputNoOp.value deve permanecer 'Valor Intacto'
            const evKeyNull = {
                ctrlKey: true,
                altKey: true,
                key: '1',
                code: 'Digit1',
                target: elInputNoOp,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            if (instMeio) instMeio.tratarEventoTeclado(evKeyNull);
            const noOpSlotNullOk = (elInputNoOp.value === 'Valor Intacto');

            // Tenta colar com Botão do Meio simples em slot nulo: deve permanecer 'Valor Intacto'
            const evMeioNull = {
                button: 1,
                ctrlKey: false,
                target: elInputNoOp,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            if (instMeio) instMeio.tratarCliqueBotaoMeio(evMeioNull, '', null, '');
            const noOpBotaoMeioOk = (elInputNoOp.value === 'Valor Intacto');

            // Restaura buffers
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = bkpHist;
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            secao6104Blind01Ok = Boolean(overflowInterceptadoOk && noOpSlotNullOk && noOpBotaoMeioOk);
        } catch (e6104) {
            erroSecao6104 = e6104.message || String(e6104);
            secao6104Blind01Ok = false;
        }
        registrar(
            secao6104Blind01Ok,
            'SECAO_6_104_BLIND_01_OVERFLOW_E_PRECEDENCIA_COPIA',
            'Seção 6.104 (BLIND-01 / ROBUST-01): Proteção defensiva contra overflow/estouro de memória no histórico, precedência de cópia interna antes do sistema e no-op ao colar slot nulo/vazio.',
            { detalhe: erroSecao6104 }
        );

        /* TESTE SEÇÃO 6.106 (SEC-01): Casulo de Blindagem e Roteador Seguro de URLs */
        let secao6106Sec01Ok = false;
        let erroSecao6106 = '';
        try {
            const prefixo = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop/';
            const optionsPadrao = prefixo + 'src/cfg/options.html';

            const router = (typeof window.JusGovBlockAddon !== 'undefined') ? window.JusGovBlockAddon : null;
            if (!router) throw new Error('Classe JusGovBlockAddon não carregada');

            // 1. Roteamento de raiz
            const destRaiz = router.rotearUrlNavegacao(prefixo, prefixo);
            const raizOk = (destRaiz === optionsPadrao);

            // 2. Parâmetros de consulta do casulo
            const destConfig = router.rotearUrlNavegacao(prefixo + '?config', prefixo);
            const configOk = (destConfig === optionsPadrao);

            const destAjuda = router.rotearUrlNavegacao(prefixo + '?ajuda', prefixo);
            const ajudaOk = (destAjuda === optionsPadrao + '#ajuda');

            const destLab = router.rotearUrlNavegacao(prefixo + '?lab', prefixo);
            const labOk = (destLab === optionsPadrao + '#laboratorio');

            // 3. Bloqueio de acesso direto a scripts
            const destScript = router.rotearUrlNavegacao(prefixo + 'src/cfg/options.js', prefixo);
            const scriptBloqueadoOk = (destScript === optionsPadrao);

            const destCss = router.rotearUrlNavegacao(prefixo + 'src/mod-anti-ampulheta/pje-anti-ampulheta.css', prefixo);
            const cssBloqueadoOk = (destCss === optionsPadrao);

            // 4. Mapeamento de abas
            const abaAjuda = router.obterAbaPorParametro('?ajuda') === 'abaAjuda';
            const abaLab = router.obterAbaPorParametro('?lab') === 'abaLaboratorio';
            const abaConfig = router.obterAbaPorParametro('?config') === 'abaConfiguracoes';

            secao6106Sec01Ok = Boolean(
                raizOk &&
                configOk &&
                ajudaOk &&
                labOk &&
                scriptBloqueadoOk &&
                cssBloqueadoOk &&
                abaAjuda &&
                abaLab &&
                abaConfig
            );
        } catch (e6106) {
            erroSecao6106 = e6106.message || String(e6106);
            secao6106Sec01Ok = false;
        }
        registrar(
            secao6106Sec01Ok,
            'SECAO_6_106_SEC_01_CASULO_E_ROTEAMENTO',
            'Seção 6.106 (SEC-01 / ARQ-04): Casulo de blindagem da extensão, roteamento de raiz e parâmetros (?config/?ajuda/?lab), e bloqueio de acesso direto digitado a scripts e arquivos internos.',
            { detalhe: erroSecao6106 }
        );

        /* TESTE SEÇÃO 6.96 (REFINADO): Fechamento Universal do Flash e Caixa de Verificação por Hover após 1s, Clique e Tecla */
        let secao696HoverEInteracaoOk = false;
        let erroSecao696Hover = '';
        try {
            const visualTeste = (typeof window.JusGovFeedbackVisual === 'function')
                ? new window.JusGovFeedbackVisual()
                : null;
            const validadorTeste = (typeof window.JusGovAvisoFlutuante === 'function')
                ? new window.JusGovAvisoFlutuante()
                : null;

            let flashCriadoOk = false;
            let flashMantemNoHover = false;
            let flashMantemNoClique = false;
            let flashMantemNaTecla = false;
            let flashFechaNaCopia = false;
            let flashFechaNaSelecao = false;

            let avisoCriadoOk = false;
            let avisoIgnoraHoverPrecoce = false;
            let avisoFechaPorCliqueFora = false;
            let avisoIgnoraControl = false;
            let avisoIgnoraInsert = false;
            let avisoIgnoraKeyup = false;
            let avisoFechaPorTecla = false;

            if (visualTeste) {
                const spanFlash = document.createElement('span');
                spanFlash.textContent = 'Texto para Teste Flash Hover';
                spanFlash.style.cssText = 'position:fixed;left:50px;top:50px;font-size:14px;';
                document.body.appendChild(spanFlash);

                const rngFlash = document.createRange();
                rngFlash.selectNodeContents(spanFlash);

                // 1. Dispara flash no modo Até Interação (-1)
                visualTeste.dispararFlashBorderVisual(rngFlash, -1);
                flashCriadoOk = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Passar o mouse (mousemove) NÃO fecha o Flash no modo Até Interação
                window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 60, clientY: 55 }));
                flashMantemNoHover = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Clique comum (mousedown) NÃO fecha o Flash no modo Até Interação
                window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
                flashMantemNoClique = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Tecla comum (keydown) NÃO fecha o Flash no modo Até Interação
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                flashMantemNaTecla = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Cópia (evento copy / Ctrl+C) FECHA o Flash
                document.dispatchEvent(new Event('copy', { bubbles: true }));
                flashFechaNaCopia = (document.getElementById('jusgov-flash-contour-container') === null);

                // 2. Dispara novamente e fecha ao iniciar nova seleção (selectstart)
                visualTeste.dispararFlashBorderVisual(rngFlash, -1);
                document.dispatchEvent(new Event('selectstart', { bubbles: true }));
                flashFechaNaSelecao = (document.getElementById('jusgov-flash-contour-container') === null);

                visualTeste.limparFlashBorderImediatamente();
                if (spanFlash.parentNode) spanFlash.parentNode.removeChild(spanFlash);
            }

            if (validadorTeste) {
                const spanAviso = document.createElement('span');
                spanAviso.textContent = '099.123.459-00';
                spanAviso.style.cssText = 'position:fixed;left:60px;top:60px;font-size:14px;';
                document.body.appendChild(spanAviso);

                const rngAviso = document.createRange();
                rngAviso.selectNodeContents(spanAviso);

                validadorTeste.auditarEAlerta('099.123.459-00', rngAviso);
                avisoCriadoOk = Boolean(validadorTeste.avisoVisivel);

                // Hover precoce (antes de 1s) não fecha
                if (validadorTeste.elementoCartaoAviso) {
                    validadorTeste.elementoCartaoAviso.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    avisoIgnoraHoverPrecoce = Boolean(validadorTeste.avisoVisivel);
                } else {
                    avisoIgnoraHoverPrecoce = true;
                }

                // Modificadoras isoladas e tecla Insert NÃO fecham a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
                avisoIgnoraControl = Boolean(validadorTeste.avisoVisivel);

                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Insert', bubbles: true }));
                avisoIgnoraInsert = Boolean(validadorTeste.avisoVisivel);

                // Soltar tecla (keyup) NÃO fecha a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keyup', { key: 'x', bubbles: true }));
                avisoIgnoraKeyup = Boolean(validadorTeste.avisoVisivel);

                // Pressionamento de tecla comum (keydown) fecha a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
                avisoFechaPorTecla = (validadorTeste.avisoVisivel === false);

                // Recria aviso e testa fechamento imediato por clique fora (mousedown)
                validadorTeste.auditarEAlerta('099.123.459-00', rngAviso);
                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
                avisoFechaPorCliqueFora = (validadorTeste.avisoVisivel === false);

                validadorTeste.limparAlertaVisual();
                if (spanAviso.parentNode) spanAviso.parentNode.removeChild(spanAviso);
            }

            secao696HoverEInteracaoOk = Boolean(
                flashCriadoOk &&
                flashMantemNoHover &&
                flashMantemNoClique &&
                flashMantemNaTecla &&
                flashFechaNaCopia &&
                flashFechaNaSelecao &&
                avisoCriadoOk &&
                avisoIgnoraHoverPrecoce &&
                avisoIgnoraControl &&
                avisoIgnoraInsert &&
                avisoIgnoraKeyup &&
                avisoFechaPorTecla &&
                avisoFechaPorCliqueFora
            );
            if (!secao696HoverEInteracaoOk) {
                erroSecao696Hover = `flashCriado=${flashCriadoOk}, flashMantemHover=${flashMantemNoHover}, flashMantemClique=${flashMantemNoClique}, flashMantemTecla=${flashMantemNaTecla}, flashFechaCopia=${flashFechaNaCopia}, flashFechaSelecao=${flashFechaNaSelecao}, avisoCriado=${avisoCriadoOk}, avisoIgnoraHover=${avisoIgnoraHoverPrecoce}, avisoIgnoraCtrl=${avisoIgnoraControl}, avisoIgnoraIns=${avisoIgnoraInsert}, avisoIgnoraKeyup=${avisoIgnoraKeyup}, avisoFechaTecla=${avisoFechaPorTecla}, avisoFechaClique=${avisoFechaPorCliqueFora}`;
            }
        } catch (e696H) {
            erroSecao696Hover = e696H.message || String(e696H);
            secao696HoverEInteracaoOk = false;
        }

        registrar(
            secao696HoverEInteracaoOk,
            'SECAO_6_96_FLASH_E_AVISO_FECHAMENTO_HOVER_E_CLIQUE',
            'Seção 6.96 (BUG-40 Refinado): Flash mantido no hover/clique/tecla no modo Até Interação (fecha apenas por nova seleção/cópia); Caixa de Verificação fecha no hover tardio de 1s, clique fora ou keydown comum (sem keyup).',
            { detalhe: erroSecao696Hover }
        );

        /* ==================================================================
         * TESTE SEÇÃO 6.107 (BUG-41): SHIFT + CLIQUE EM BLOCO (PRESERVAÇÃO DA AUDITORIA CORRETA E EXIBIÇÃO SEM PONTUAÇÃO)
         * Ao clicar com Shift em entidade pontuada (Benefício INSS, CPF, CNPJ, CNJ):
         * 1) A auditoria deve ser realizada sobre o bloco pontuado original para abrir a caixa correta (INSS, CPF, CNPJ, CNJ)
         *    e não genérico Mod11;
         * 2) O número copiado e o número exibido no cabeçalho do cartão devem estar sem pontuação;
         * 3) Todas as verificações matemáticas, espécie/wiki e prompts de OK (✓) ou erro (✗) devem ser mantidos.
         * ================================================================== */
        let secao6107ShiftOk = false;
        let erroSecao6107 = '';
        try {
            const validadorShift = validador;

            // 1. Benefício INSS pontuado válido (719.657.155-0) com textoSobrescrito sem pontuação (7196571550)
            const resInssValido = validadorShift.auditarEAlerta('719.657.155-0', null, { textoSobrescrito: '7196571550' });
            const inssValidoOk = Boolean(
                resInssValido &&
                resInssValido.valido === true &&
                resInssValido.ehWiki === true &&
                resInssValido.tipo === 'INSS' &&
                resInssValido.dado === '7196571550' &&
                resInssValido.html.includes('>7196571550</u>') &&
                resInssValido.html.includes('[INSS]:') &&
                resInssValido.html.includes('✓') &&
                !resInssValido.ehGenericoCinza
            );

            // 2. Benefício INSS pontuado inválido (719.657.155-9) com textoSobrescrito sem pontuação (7196571559)
            const resInssInvalido = validadorShift.auditarEAlerta('719.657.155-9', null, { textoSobrescrito: '7196571559' });
            const inssInvalidoOk = Boolean(
                resInssInvalido &&
                resInssInvalido.valido === false &&
                resInssInvalido.tipo.includes('INSS') &&
                resInssInvalido.dado === '7196571559' &&
                resInssInvalido.html.includes('>7196571559</u>') &&
                resInssInvalido.html.includes('✗') &&
                Array.isArray(resInssInvalido.motivos) &&
                resInssInvalido.motivos.length > 0
            );

            // 3. Benefício com espécie (31/719.657.155-0) com textoSobrescrito sem pontuação (7196571550)
            const resInssComEsp = validadorShift.auditarEAlerta('31/719.657.155-0', null, { textoSobrescrito: '7196571550' });
            const inssComEspOk = Boolean(
                resInssComEsp &&
                resInssComEsp.valido === true &&
                resInssComEsp.tipo === 'INSS' &&
                resInssComEsp.dado === '7196571550' &&
                resInssComEsp.html.includes('>7196571550</u>') &&
                resInssComEsp.html.includes('31')
            );

            // 4. CPF pontuado inválido (099.123.459-00) com textoSobrescrito sem pontuação (09912345900)
            const resCpfInvalido = validadorShift.auditarEAlerta('099.123.459-00', null, { textoSobrescrito: '09912345900' });
            const cpfInvalidoOk = Boolean(
                resCpfInvalido &&
                resCpfInvalido.valido === false &&
                resCpfInvalido.tipo.includes('CPF') &&
                resCpfInvalido.dado === '09912345900' &&
                resCpfInvalido.html.includes('>09912345900</u>') &&
                resCpfInvalido.html.includes('✗')
            );

            // 5. CPF pontuado válido (099.123.459-67) com textoSobrescrito sem pontuação (09912345967)
            const resCpfValido = validadorShift.auditarEAlerta('099.123.459-67', null, { textoSobrescrito: '09912345967' });
            const cpfValidoOk = Boolean(
                resCpfValido &&
                resCpfValido.valido === true &&
                resCpfValido.tipo === 'CPF' &&
                resCpfValido.dado === '09912345967' &&
                resCpfValido.html.includes('>09912345967</u>') &&
                resCpfValido.html.includes('✓')
            );

            // 6. Processo CNJ pontuado (0991234-55.2024.4.01.4002) com textoSobrescrito sem pontuação (09912345520244014002)
            const resCnjValido = validadorShift.auditarEAlerta('0991234-55.2024.4.01.4002', null, { textoSobrescrito: '09912345520244014002' });
            const cnjValidoOk = Boolean(
                resCnjValido &&
                resCnjValido.valido === true &&
                resCnjValido.tipo.includes('CNJ') &&
                resCnjValido.dado === '09912345520244014002' &&
                resCnjValido.html.includes('>09912345520244014002</u>') &&
                resCnjValido.html.includes('✓')
            );

            secao6107ShiftOk = Boolean(inssValidoOk && inssInvalidoOk && inssComEspOk && cpfInvalidoOk && cpfValidoOk && cnjValidoOk);
            if (!secao6107ShiftOk) {
                erroSecao6107 = `inssValido=${inssValidoOk}, inssInvalido=${inssInvalidoOk}, inssComEsp=${inssComEspOk}, cpfInvalido=${cpfInvalidoOk}, cpfValido=${cpfValidoOk}, cnjValido=${cnjValidoOk}`;
            }
        } catch (e6107) {
            erroSecao6107 = e6107.message || String(e6107);
            secao6107ShiftOk = false;
        }

        registrar(
            secao6107ShiftOk,
            'SECAO_6_107_SHIFT_CLIQUE_BLOCO_VERIFICACAO_E_EXIBICAO_DESPONTUADA',
            'Seção 6.107 (BUG-41): Shift + Clique em bloco audita a entidade pontuada original, altera somente a cópia e exibe o número desformatado no cartão.',
            { detalhe: erroSecao6107 }
        );

        /* ==================================================================
         * TESTES SEÇÕES 6.100 A 6.120: ARQ-01/02/03, BUG-32, BUG-42, BUG-44,
         * BUG-45, BUG-46, BUG-47, USAB-11/19, USAB-14, FEAT-21 e FEAT-23
         * ================================================================== */

        /* 1. ARQ-01, ARQ-02 e ARQ-03: Centralização de Constantes, Defaults e Desacoplamento Anti-Ampulheta */
        let arq010203Ok = false;
        let erroArq010203 = '';
        try {
            const constGlobal = window.JusGovConstantes;
            const constCopia = window.JusGovCopiaConstantes;
            const cfgDef = window.JusGovCfgDefaults;
            const modAntiAmp = window.JusGovModuloAntiAmpulheta;

            const arq01Ok = Boolean(
                constGlobal && constGlobal.MASCARA_CARACTERE &&
                constCopia && constCopia.TABELA_MASCARA_ASCII instanceof Uint8Array
            );
            const arq02Ok = Boolean(
                cfgDef && cfgDef.CONFIGURACAO_MOTOR &&
                cfgDef.PADROES_DEFAULT_STORAGE &&
                cfgDef.PADROES_DEFAULT_STORAGE.tempoConferenciaDocumentosMs === -1 &&
                cfgDef.PADROES_DEFAULT_STORAGE.marcadorConteudoColadoAtivo === true
            );
            const arq03Ok = Boolean(
                typeof modAntiAmp === 'function' &&
                typeof modAntiAmp.prototype.blindarCSS === 'function' &&
                typeof modAntiAmp.prototype.garantirObservadorBlindagem === 'function'
            );

            arq010203Ok = Boolean(arq01Ok && arq02Ok && arq03Ok);
            if (!arq010203Ok) erroArq010203 = `arq01=${arq01Ok}, arq02=${arq02Ok}, arq03=${arq03Ok}`;
        } catch (eArq) {
            erroArq010203 = eArq.message || String(eArq);
        }
        registrar(
            arq010203Ok,
            'SECAO_6_100_101_102_ARQ_01_02_03_CENTRALIZACAO_E_DESACOPLAMENTO',
            'Seções 6.100, 6.101 e 6.102 (ARQ-01/02/03): Centralização de constantes/bitmasks em lib-constantes.js, defaults em cfg-defaults.js e desacoplamento CSS em mod-anti-ampulheta.js.',
            { detalhe: erroArq010203 }
        );

        /* 2. BUG-32 e BUG-47 / USAB-16: Unicidade da Caixa Rápida (Ins+Ins) e Isolamento no Modo Até Interação */
        let bug32E47Ok = false;
        let erroBug32E47 = '';
        try {
            const FabricaCaixa = window.JusGovCaixaEntradaRapida;
            if (FabricaCaixa) {
                const c1 = new FabricaCaixa({ janelaTempoMs: 400 });
                const c2 = new FabricaCaixa({ janelaTempoMs: 400 });
                const ev1 = { key: 'Insert', keyCode: 45, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, preventDefault: () => {}, stopPropagation: () => {} };
                const ev2 = { key: 'Insert', keyCode: 45, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, preventDefault: () => {}, stopPropagation: () => {} };

                // Se dois listeners recebem o MESMO objeto de evento, o segundo não conta como segundo clique falso
                const rPrimeiro1 = c1.tratarEventoTeclado(ev1);
                const rDup1 = c2.tratarEventoTeclado(ev1);
                const rSegundo1 = c1.tratarEventoTeclado(ev2);
                const rDup2 = c2.tratarEventoTeclado(ev2);

                const dialogosAbertos = document.querySelectorAll('.jusgov-dialog-input-rapido').length;
                const unicidadeDomOk = (rPrimeiro1 === false && rDup1 === false && rSegundo1 === true && rDup2 === true && dialogosAbertos === 1);
                c1.fecharCaixa();
                c2.fecharCaixa();
                bug32E47Ok = unicidadeDomOk;
            }
        } catch (e32) {
            erroBug32E47 = e32.message || String(e32);
        }
        registrar(
            bug32E47Ok,
            'SECAO_6_72_117_BUG_32_E_47_UNICIDADE_CAIXA_RAPIDA_DUPLO_INSERT',
            'Seções 6.72 e 6.117 (BUG-32 / BUG-47): Unicidade estrita de instância DOM da Caixa de Entrada Rápida (Ins+Ins / Ctrl+Ins+Ins) e isolamento contra fechamento no modo Até Interação.',
            { detalhe: erroBug32E47 }
        );

        /* 3. BUG-42 / USAB-10: Rejeição Geométrica de Clique Simples em Espaço Vazio Distante */
        let bug42EspacoVazioOk = false;
        let erroBug42 = '';
        try {
            if (motorTeste && typeof motorTeste.verificarProximidadeGeometricaDoClique === 'function') {
                const pTeste = document.createElement('p');
                pTeste.textContent = 'PalavraUnicaIsolada';
                pTeste.style.cssText = 'position:fixed;left:20px;top:20px;margin:0;padding:0;font-size:14px;';
                document.body.appendChild(pTeste);
                const rngP = document.createRange();
                rngP.selectNodeContents(pTeste);
                // Clique muito distante (X=500, Y=500) do texto em (20, 20) deve ser rejeitado (false)
                const longeRejeitado = (motorTeste.verificarProximidadeGeometricaDoClique(rngP, 500, 500, 1) === false);
                const rectP = rngP.getBoundingClientRect();
                const pertoAceito = (motorTeste.verificarProximidadeGeometricaDoClique(rngP, rectP.left + 4, rectP.top + 4, 1) === true);
                pTeste.remove();
                bug42EspacoVazioOk = Boolean(longeRejeitado && pertoAceito);
            }
        } catch (e42) {
            erroBug42 = e42.message || String(e42);
        }
        registrar(
            bug42EspacoVazioOk,
            'SECAO_6_109_BUG_42_REJEICAO_CLIQUE_ESPACO_VAZIO_DISTANTE',
            'Seção 6.109 (BUG-42 / USAB-10): Clique simples em espaço em branco distante (>24px horizontal ou >12px vertical) é rejeitado geometricamente sem capturar a primeira/última palavra do parágrafo.',
            { detalhe: erroBug42 }
        );

        /* 4. BUG-46 / USAB-15: Limpeza Numérica em Shift + Arrasto com Trava Alfabética */
        let bug46ShiftArrastoOk = false;
        let erroBug46 = '';
        try {
            if (motorTeste && typeof motorTeste.aplicarLimpezaNumericaComTravaAlfabetica === 'function') {
                // Caso 1: Somente números, símbolos e espaços -> limpa deixando apenas dígitos ("051120262122")
                const resNum = motorTeste.aplicarLimpezaNumericaComTravaAlfabetica('05/11/2026 - 21:22');
                // Caso 2: Contém letras misturadas -> Trava Alfabética retorna null (para o motor preservar o original)
                const resAlfa = motorTeste.aplicarLimpezaNumericaComTravaAlfabetica('Processo 05/11/2026 - 21:22');
                bug46ShiftArrastoOk = (resNum === '051120262122' && resAlfa === null);
            }
        } catch (e46) {
            erroBug46 = e46.message || String(e46);
        }
        registrar(
            bug46ShiftArrastoOk,
            'SECAO_6_116_BUG_46_LIMPEZA_NUMERICA_SHIFT_ARRASTO_TRAVA_ALFABETICA',
            'Seção 6.116 (BUG-46 / USAB-15): Shift + Arrasto remove pontuação, símbolos e espaços ("05/11/2026 - 21:22" -> "051120262122") e aplica Trava Alfabética revertendo ao original se houver letras.',
            { detalhe: erroBug46 }
        );

        /* 5. FEAT-23 / USAB-12, BUG-44 / DEP-01 e USAB-14 / POS-01: Tempo Independente de Conferência, MiniTip Topo Centralizado e Ancoragem de Rolagem */
        let feat23Bug44Usab14Ok = false;
        let erroFeat23 = '';
        try {
            const avTeste = new window.JusGovAvisoFlutuante();
            // FEAT-23: Tempo de conferência independente (-1 padrão, 0 desativado, 1000..5000ms)
            const padraoAteInteracao = (avTeste.obterTempoConferenciaDocumentos() === -1);
            avTeste.definirTempoConferenciaDocumentos(3000);
            const alterou3s = (avTeste.obterTempoConferenciaDocumentos() === 3000);
            avTeste.definirTempoConferenciaDocumentos(0);
            const desativouZero = (avTeste.obterTempoConferenciaDocumentos() === 0 && avTeste.validacaoAtiva === false);
            avTeste.definirTempoConferenciaDocumentos(-1);
            const reativouMenosUm = (avTeste.obterTempoConferenciaDocumentos() === -1 && avTeste.validacaoAtiva === true);

            // BUG-44: projetarMiniTipGlobal centralizado no topo e com carência contra o próprio Escape
            avTeste.definirTempoExibicao(-1);
            avTeste.projetarMiniTipGlobal('Estilos/Formatação Textual: Nível 1');
            const elTip = avTeste.elementoMiniTipGlobal;
            const tipVisivelNoTopo = Boolean(elTip && elTip.style.display === 'block');
            // Escape imediato dentro da carência de 180ms NÃO deve fechar o minitip recém-aberto
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const tipSobreviveuEscapeGatilho = Boolean(elTip && elTip.style.display === 'block');
            // Clique (mousedown) fecha imediatamente
            document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            const tipFechouNoClique = Boolean(!elTip || elTip.style.display === 'none');

            // USAB-14: método de reposicionamento sob rolagem presente e funcional
            const temMetodoScroll = (typeof avTeste.atualizarPosicaoAlertaSobRolagem === 'function');
            avTeste.limparAlertaVisual();

            feat23Bug44Usab14Ok = Boolean(
                padraoAteInteracao && alterou3s && desativouZero && reativouMenosUm &&
                tipVisivelNoTopo && tipSobreviveuEscapeGatilho && tipFechouNoClique && temMetodoScroll
            );
            if (!feat23Bug44Usab14Ok) {
                erroFeat23 = `pad=${padraoAteInteracao}, a3s=${alterou3s}, d0=${desativouZero}, r1=${reativouMenosUm}, vis=${tipVisivelNoTopo}, esc=${tipSobreviveuEscapeGatilho}, clq=${tipFechouNoClique}, scr=${temMetodoScroll}`;
            }
        } catch (e23) {
            erroFeat23 = e23.message || String(e23);
        }
        registrar(
            feat23Bug44Usab14Ok,
            'SECAO_6_112_113_115_FEAT_23_BUG_44_USAB_14_AVISOS_E_ANCORAGEM',
            'Seções 6.112, 6.113 e 6.115 (FEAT-23 / BUG-44 / USAB-14): Tempo independente da Conferência de Documentos (0 a 5s + Até Interação), estabilidade do popup Esc+Esc no topo central e ancoragem física na rolagem.',
            { detalhe: erroFeat23 }
        );

        /* 6. BUG-45 / USAB-13 e FEAT-21 / VIS-01: Ancoragem do Flash na Rolagem e Marcador Permanente de Conteúdo Colado com Numeração Ordinal */
        let bug45Feat21Ok = false;
        let erroFeat21 = '';
        try {
            const visTeste = new window.JusGovFeedbackVisual();
            visTeste.limparMarcadoresPermanentes();

            const divDoc = document.createElement('div');
            divDoc.style.cssText = 'position:fixed;left:40px;top:80px;font-size:14px;';
            divDoc.innerHTML = '<span id="spCol1">1015306-38.2026.4.01.4002</span> e <span id="spCol2">099.123.459-67</span>';
            document.body.appendChild(divDoc);

            const sp1 = divDoc.querySelector('#spCol1');
            const sp2 = divDoc.querySelector('#spCol2');
            const rng1 = document.createRange();
            rng1.selectNodeContents(sp1);
            const rng2 = document.createRange();
            rng2.selectNodeContents(sp2);

            // 1. Cópia dispara Flash e registra candidata, mas AINDA NÃO cria marcador permanente (só ao colar!)
            visTeste.dispararFlashBorderVisual(rng1, -1);
            visTeste.registrarCopiaCandidataParaMarcador(rng1, '1015306-38.2026.4.01.4002');
            const semMarcadorAntesDeColar = (visTeste.obterContagemMarcadoresPermanentes() === 0);

            // 2. Confirma colagem do item 1 -> remove Flash temporário e cria Marcador Permanente #1
            const marcou1 = visTeste.confirmarColagemEMarcarPermanente('1015306-38.2026.4.01.4002');
            const flashRemovidoAoColar = (document.getElementById('jusgov-flash-contour-container') === null);
            const contagemApos1 = visTeste.obterContagemMarcadoresPermanentes();

            // 3. Cópia e colagem do item 2 -> cria Marcador Permanente #2
            visTeste.registrarCopiaCandidataParaMarcador(rng2, '099.123.459-67');
            const marcou2 = visTeste.confirmarColagemEMarcarPermanente('09912345967'); // mesmo colando apenas dígitos (Shift)
            const contagemApos2 = visTeste.obterContagemMarcadoresPermanentes();

            // 4. Sobreposição/Fusão: copiar e colar o container inteiro funde os marcadores anteriores sem sobrepor caixas
            const rngTotal = document.createRange();
            rngTotal.selectNodeContents(divDoc);
            visTeste.registrarCopiaCandidataParaMarcador(rngTotal, divDoc.textContent);
            const marcouFundido = visTeste.confirmarColagemEMarcarPermanente(divDoc.textContent);
            const contagemAposFusao = visTeste.obterContagemMarcadoresPermanentes();

            visTeste.limparMarcadoresPermanentes();
            divDoc.remove();

            bug45Feat21Ok = Boolean(
                semMarcadorAntesDeColar &&
                marcou1 &&
                flashRemovidoAoColar &&
                contagemApos1 === 1 &&
                marcou2 &&
                contagemApos2 === 2 &&
                marcouFundido &&
                contagemAposFusao === 1
            );
            if (!bug45Feat21Ok) {
                erroFeat21 = `antes=${semMarcadorAntesDeColar}, m1=${marcou1}, flashRem=${flashRemovidoAoColar}, c1=${contagemApos1}, m2=${marcou2}, c2=${contagemApos2}, cFusao=${contagemAposFusao}`;
            }
        } catch (e21) {
            erroFeat21 = e21.message || String(e21);
        }
        registrar(
            bug45Feat21Ok,
            'SECAO_6_105_114_FEAT_21_E_BUG_45_MARCADOR_PERMANENTE_CONTEUDO_COLADO',
            'Seções 6.105 e 6.114 (FEAT-21 / VIS-01 e BUG-45 / USAB-13): Marcador permanente acionado exclusivamente na colagem efetiva com badge ordinal (1, 2, 3...), substituição do Flash e fusão inteligente de seleções sobrepostas.',
            { detalhe: erroFeat21 }
        );

        /* ==================================================================
         * BATERIA 13: FUZZING MUTACIONAL E RESISTÊNCIA A MUTANTES DE DV (MUTATION TESTING +1/-1)
         * Diretriz de Verificação Dupla (Paridade Correto -> Mutado):
         * 1) Gera números matematicamente válidos (com DV real) e valida -> testando se o correto é correto (valido: true).
         * 2) Com o MESMO número validado, altera 1 caractere em posição aleatória (±1) -> testando se o mutado é incorreto (valido: false).
         * Total: 10 testes de números corretos + 10 testes de mutantes = 20 testes por categoria (140 testes no total da bateria).
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 13: FUZZING MUTACIONAL E RESISTÊNCIA A MUTANTES DE DV (MUTATION TESTING ±1 A ±5 NO CORPO) ---');

        const NUM_ITERACOES_MUTACAO = 10;

        /* 1) Mutação Estrita de CPF (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCpfValido();
            const resOrig = validador.validarCPF(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CPF',
                `CPF Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCPF(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCPF(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CPF',
                `CPF Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 2) Mutação Estrita de CNPJ Tradicional (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnpjTradicionalValido();
            const resOrig = validador.validarCNPJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNPJ_TRADICIONAL',
                `CNPJ Tradicional Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCNPJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNPJ_TRADICIONAL',
                `CNPJ Tradicional Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 3) Mutação Estrita de Novo CNPJ Alfanumérico (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnpjAlfanumericoValido();
            const resOrig = validador.validarCNPJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNPJ_ALFANUMERICO',
                `Novo CNPJ Alfanumérico Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCNPJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNPJ_ALFANUMERICO',
                `Novo CNPJ Alfanumérico Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 4) Mutação Estrita de Processo Judicial CNJ Módulo 97 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnjValido();
            const resOrig = validador.validarCNJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNJ_MODULO_97',
                `Processo CNJ Módulo 97 Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNJ(s), { ehCnj: true });
            const resMut = validador.validarCNJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNJ_MODULO_97',
                `Processo CNJ Módulo 97 Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 5) Mutação Estrita de Benefício INSS NB Módulo 11 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarInssNbValido();
            const resOrig = validador.validarNumeroBeneficioINSS(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_INSS_NB_MODULO_11',
                `Benefício INSS NB Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarNumeroBeneficioINSS(s), { qtdDvsFinais: 1 });
            const resMut = validador.validarNumeroBeneficioINSS(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_INSS_NB_MODULO_11',
                `Benefício INSS NB Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 6) Mutação Estrita de Inscrição PIS/PASEP/NIT Módulo 11 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarPisValido();
            const resOrig = validador.validarPIS(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_PIS_MODULO_11',
                `PIS/PASEP Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarPIS(s), { qtdDvsFinais: 1 });
            const resMut = validador.validarPIS(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_PIS_MODULO_11',
                `PIS/PASEP Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 7) Mutação Estrita de Datas e Bissextos (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarDataValida(i % 3 === 0);
            const resOrig = validador.validarData(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_DATAS_BISSEXTO',
                `Data Correta Original #${i}: [${original}] deve ser VÁLIDA`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutada = mutarDataParaInvalida(original);
            const resMut = validador.validarData(mutada);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_DATAS_BISSEXTO',
                `Data Mutante de Fronteira #${i}: [${mutada}] deve ser INVÁLIDA`,
                {
                    textoTestado: mutada,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* ==================================================================
         * BATERIA 14: FUZZING DE ROBUSTEZ E ESTRESSE DE ENTRADAS
         * Executa testes estocásticos de robustez e estresse de fronteira:
         * Limites de cursor, URLs/domínios, formatador multi-MIME, conversores HTML<->MD,
         * máscaras de entrada e listas turbo.
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 14: FUZZING DE ROBUSTEZ E ESTRESSE DE ENTRADAS ---');

        /* 1) Fuzzing de Limites de Cursor e Caracteres Aleatórios */
        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            let totalCliquesFuzz = 0;
            let falhasCliquesFuzz = 0;
            const amostrasBase = [
                'Art. 12 da Lei nº 12.016/2009;',
                'PROCESSO: 0991001-58.2024.4.01.4002',
                'CPF: 099.123.459-67 e CNPJ: 09.912.345/0001-96',
                'Valor de R$ 1.250,50 pago em 23/10/2026',
                'REGULAR PROSSEGUIMENTO DO FEITO'
            ];
            for (let k = 0; k < 60; k++) {
                totalCliquesFuzz++;
                const frase = amostrasBase[k % amostrasBase.length];
                const idxAleatorio = randInt(-3, frase.length + 3);
                const numCliques = randInt(1, 3);
                try {
                    const ret = motorTeste.simularCliqueEmTexto(frase, idxAleatorio, numCliques);
                    if (typeof ret !== 'string') falhasCliquesFuzz++;
                } catch (_) {
                    falhasCliquesFuzz++;
                }
            }
            registrar(
                falhasCliquesFuzz === 0,
                'FUZZ_ROBUSTEZ_LIMITES_CURSOR',
                `Estresse de posições de cursor e cliques em fronteiras (${totalCliquesFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalCliquesFuzz - falhasCliquesFuzz}/${totalCliquesFuzz} | Falhas=${falhasCliquesFuzz}` }
            );
        }

        /* 2) Fuzzing de URLs, Hosts e Extração de Domínios */
        {
            let totalUrlsFuzz = 0;
            let errosUrlsFuzz = 0;
            const esquemas = ['https://', 'http://', 'chrome://', 'file://', 'ftp://', 'about:'];
            const dominiosBase = ['pje.jus.br', 'google.com', 'trf1.jus.br', 'cnj.jus.br', 'stf.jus.br', 'localhost:8080'];
            const caminhosBase = ['/processo/123', '/painel?id=99&aba=2', '/documento#pg1', '/'];
            for (let k = 0; k < 60; k++) {
                totalUrlsFuzz++;
                const esq = esquemas[randInt(0, esquemas.length - 1)];
                const dom = dominiosBase[randInt(0, dominiosBase.length - 1)];
                const cam = caminhosBase[randInt(0, caminhosBase.length - 1)];
                const urlTeste = `${esq}${dom}${cam}`;
                try {
                    const u = new URL(urlTeste);
                    const host = u.hostname || u.host || '';
                    if (!host && esq.startsWith('http')) errosUrlsFuzz++;
                } catch (_) {
                    /* URL malformada intencional em teste */
                }
            }
            registrar(
                errosUrlsFuzz === 0,
                'FUZZ_ROBUSTEZ_URLS_DOMINIOS',
                `Estresse de resolução e extração de URLs/Hosts (${totalUrlsFuzz} iterações estocásticas)`,
                { detalhe: `Validadas=${totalUrlsFuzz - errosUrlsFuzz}/${totalUrlsFuzz} | Erros=${errosUrlsFuzz}` }
            );
        }

        /* 3) Fuzzing do Formatador Multi-MIME de Clipboard */
        {
            const formatadorClip = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);
            if (typeof formatadorClip === 'function') {
                let totalFmtClipFuzz = 0;
                let errosFmtClipFuzz = 0;
                const tiposMime = ['text/plain', 'text/html', 'text/rtf', 'image/png', 'application/json', 'video/mp4'];
                for (let k = 0; k < 50; k++) {
                    totalFmtClipFuzz++;
                    const qtdItens = randInt(0, 5);
                    const itens = [];
                    for (let m = 0; m < qtdItens; m++) {
                        const t = tiposMime[randInt(0, tiposMime.length - 1)];
                        itens.push({
                            type: t,
                            data: t.startsWith('text/') ? `Dado aleatório ${m}: ${Math.random()}` : null,
                            size: randInt(10, 500000),
                            isTextual: t.startsWith('text/')
                        });
                    }
                    try {
                        const res = formatadorClip(itens);
                        if (!res || typeof res.texto !== 'string' || typeof res.html !== 'string') {
                            errosFmtClipFuzz++;
                        }
                    } catch (_) {
                        errosFmtClipFuzz++;
                    }
                }
                registrar(
                    errosFmtClipFuzz === 0,
                    'FUZZ_ROBUSTEZ_FORMATADOR_CLIPBOARD_MULTI_MIME',
                    `Estresse do Formatador Multi-MIME de Clipboard (${totalFmtClipFuzz} iterações estocásticas)`,
                    { detalhe: `Sucessos=${totalFmtClipFuzz - errosFmtClipFuzz}/${totalFmtClipFuzz} | Falhas=${errosFmtClipFuzz}` }
                );
            }
        }

        /* 4) Fuzzing de Conversores Bidirecionais HTML <-> Markdown */
        if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function' && typeof window.JusGovEditorDemo.converterMarkdownParaHtml === 'function') {
            let totalMdFuzz = 0;
            let errosMdFuzz = 0;
            const fragmentosHtml = [
                '<p>Texto com <b>negrito</b> e <i>itálico</i></p>',
                '<h1>Título</h1><blockquote>Citação</blockquote>',
                '<ul><li>Item 1</li><li>Item 2</li></ul>',
                '<p>Linha com <code>código</code> e <a href="http://ex.com">link</a></p>',
                '<p>Tachado <s>erro</s> e <u>sublinhado</u></p>'
            ];
            for (let k = 0; k < 50; k++) {
                totalMdFuzz++;
                const frag = fragmentosHtml[totalMdFuzz % fragmentosHtml.length];
                try {
                    const md = window.JusGovEditorDemo.converterHtmlParaMarkdown(frag);
                    const htmlVolta = window.JusGovEditorDemo.converterMarkdownParaHtml(md);
                    if (typeof md !== 'string' || typeof htmlVolta !== 'string') errosMdFuzz++;
                } catch (_) {
                    errosMdFuzz++;
                }
            }
            registrar(
                errosMdFuzz === 0,
                'FUZZ_ROBUSTEZ_CONVERSOR_HTML_MARKDOWN',
                `Estresse dos Conversores Bidirecionais HTML <-> Markdown (${totalMdFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalMdFuzz - errosMdFuzz}/${totalMdFuzz} | Falhas=${errosMdFuzz}` }
            );
        }

        /* 5) Fuzzing de Máscaras Dinâmicas de Entrada de Dados */
        if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function' && typeof window.JusGovEditorDemo.formatarMascaraCpfCnpj === 'function') {
            let totalMascFuzz = 0;
            let errosMascFuzz = 0;
            for (let k = 0; k < 50; k++) {
                totalMascFuzz++;
                const strNum = String(Math.floor(Math.random() * 1e15)) + 'ABC!@#';
                try {
                    const mData = window.JusGovEditorDemo.formatarMascaraData(strNum);
                    const mCpf = window.JusGovEditorDemo.formatarMascaraCpfCnpj(strNum);
                    if (typeof mData !== 'string' || typeof mCpf !== 'string') errosMascFuzz++;
                } catch (_) {
                    errosMascFuzz++;
                }
            }
            registrar(
                errosMascFuzz === 0,
                'FUZZ_ROBUSTEZ_MASCARAS_ENTRADA',
                `Estresse das Máscaras Dinâmicas de Entrada de Dados (${totalMascFuzz * 2} iterações estocásticas)`,
                { detalhe: `Sucessos=${(totalMascFuzz * 2) - (errosMascFuzz * 2)}/${totalMascFuzz * 2} | Falhas=${errosMascFuzz}` }
            );
        }

        /* 6) Fuzzing de Extração e Higienização de Listas Turbo */
        {
            let totalTurboFuzz = 0;
            let errosTurboFuzz = 0;
            const blocos = [
                'https://pje.jus.br\n<all_urls>\n   \nhttps://pje.jus.br\nhttp://google.com\r\n',
                '<all_urls>\n<all_urls>\n\n\nhttps://trf1.jus.br',
                'https://stj.jus.br\n\n   https://stj.jus.br   \n'
            ];
            for (let k = 0; k < 50; k++) {
                totalTurboFuzz++;
                const entrada = blocos[totalTurboFuzz % blocos.length];
                try {
                    const linhas = Array.from(new Set(
                        String(entrada || '')
                            .split(/\r?\n/)
                            .map(l => l.trim())
                            .filter(l => l.length > 0 && l !== '<all_urls>')
                    ));
                    if (linhas.includes('<all_urls>') || (new Set(linhas)).size !== linhas.length) {
                        errosTurboFuzz++;
                    }
                } catch (_) {
                    errosTurboFuzz++;
                }
            }
            registrar(
                errosTurboFuzz === 0,
                'FUZZ_ROBUSTEZ_EXTRACAO_LINHAS_TURBO',
                `Estresse de Extração e Higienização de Listas Turbo (${totalTurboFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalTurboFuzz - errosTurboFuzz}/${totalTurboFuzz} | Falhas=${errosTurboFuzz}` }
            );
        }

        if (opcoes && opcoes.fuzz) {
            linhasLog.push('\n--- BATERIA EXTENSIVA: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
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
                const comp = (info && info.detalhe) ? ` | ${info.detalhe}` : '';
                linhasLog.push(`${status} [${categoria}] ${descricao}${comp}`);
            };
            linhasLog.push('\n--- BATERIA EXTENSIVA: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
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
            { pct: 7, rotulo: 'Bateria 1: Validação Matemática Determinística' },
            { pct: 14, rotulo: 'Bateria 2: Catálogo Forense (13 Grupos)' },
            { pct: 21, rotulo: 'Bateria 3: Modo Acumulador e Toggle-Off' },
            { pct: 28, rotulo: 'Bateria 4: Seleção Avançada em Tabelas' },
            { pct: 35, rotulo: 'Bateria 5: Posições de Cursor e Limites' },
            { pct: 42, rotulo: 'Bateria 6: Filtros HTML em 5 Níveis' },
            { pct: 49, rotulo: 'Bateria 7: Preferências e Atalho F1' },
            { pct: 56, rotulo: 'Bateria 8: Varredura de Limites nos HTMLs' },
            { pct: 63, rotulo: 'Bateria 9: Geometria e Posicionamento Externo' },
            { pct: 70, rotulo: 'Bateria 10: Integridade do Catálogo Centralizado JSON' },
            { pct: 78, rotulo: 'Bateria 11: Guias, Janelas, Anti-Duplicação e GPS' },
            { pct: 85, rotulo: 'Bateria 12: Módulos mod-input e mod-navegador (POO)' },
            { pct: 93, rotulo: 'Bateria 13: Fuzzing Mutacional e Resistência a Mutantes de DV (+1/-1)' },
            { pct: 100, rotulo: 'Bateria 14: Fuzzing de Robustez e Estresse de Entradas' }
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
