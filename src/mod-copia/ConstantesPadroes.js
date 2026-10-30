/* ==========================================================================
 * Nome do arquivo: modulo-ConstantesPadroes.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, falhas do
 *    framework alvo, otimizacoes V8/Blink e protecoes de Regex Unicode) e nao
 *    apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada secao e metodo, permitindo recriar 100% do
 *    sistema do zero se o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como &ccedil;, &otilde;, &eacute;)
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
 * 1. PAPEL ARQUITETURAL DESTE MODULO NO MOTOR CHROME V8 / BLINK:
 * - Este modulo e o primeiro a ser injetado no Isolated World do Content Script.
 * - Concentra 100% das constantes e Expressoes Regulares (RegExp) de todo o
 *   ecossistema JusGovBR congeladas via Object.freeze() para permitir Constant
 *   Folding direto no compilador JIT TurboFan do motor V8 e eliminar expressoes
 *   regulares espalhadas em outros arquivos.
 * - Implementa a Tabela de Classificacao Instantanea de Caracteres ASCII em
 *   tempo constante O(1) (~2 nanossegundos por consulta) via mascara de bits
 *   (Uint8Array(128)), eliminando chamadas repetitivas a engine Irregexp ao
 *   varrer digitos, letras ASCII, espacos, delimitadores de par "()[]{}<>",
 *   aspas, pontuacoes intermediarias ",;", pontuacoes finais ".!?" e simbolos
 *   repetiveis "#*=~$@".
 * - Define a Janela Deslizante Dobrada (+/- 1000 caracteres ao redor do cursor,
 *   perfazendo horizonte seguro de 2.000 caracteres) para garantir complexidade
 *   O(1) e Frame Budget < 1,5ms mesmo em documentos ou logs gigantescos no PJe.
 * - Pre-compila todo o Catalogo de Expressoes Regulares Juridicas, Governamentais,
 *   Cartorarias, Financeiras e de Cidadao organizado por Tipos (grupos) e
 *   Sub-tipos documentados, com sintaxe 100% US-ASCII compativel com a flag /u.
 *
 * 2. REGRAS DE ISOLAMENTO EM 1 CLIQUE VS. CONTEXTO INCREMENTAL (ESPACO / 2 CLIQUES):
 * - Regra da Virgula (",") e Ponto e Virgula (";"): A virgula "," possui
 *   comportamento intermediario identico ao ";", atuando estritamente como
 *   separador de fronteira. Ao clicar em uma palavra (ex: "Brasilia,"), a
 *   virgula NUNCA deve ser selecionada junto com a palavra.
 * - Selecao Automatica Integral de CNPJ, CPF, CNJ e Documentos em 1 Clique:
 *   O grupo DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO precede protocolos com barra
 *   de ano, e o padrao de protocolo ("136/2025") exige fronteira livre de "." e "-"
 *   para jamais fragmentar o miolo "/0001-" de um CNPJ em 1 clique.
 * - Simplificacao Universal de Sequencias Numericas e Boletos:
 *   * 1 clique sobre um numero isolado em sequencia espacada (ex: clicar em
 *     "6992" dentro de "215 7014 6992 8831") seleciona APENAS "6992".
 *   * 1 clique sobre bloco numerico com pontuacao colada sem espaco (ex:
 *     "0000.0000-0000" ou "12345.67890") seleciona o bloco pontuado contiguo.
 *   * 1 clique em QUALQUER espaco interno ou 2 cliques em qualquer numero
 *     seleciona genericamente toda a cadeia de numeros espacados (independente
 *     de quantos blocos ou digitos existam, cobrindo boletos, chaves NF-e e
 *     codigos de barras).
 * - Logica Incremental de Contexto em Numeros e Moedas com Extenso:
 *   * Exemplo 1: "65 (sessenta e cinco)"
 *     - 1 clique em "65" -> seleciona apenas "65".
 *     - 1 clique dentro dos parenteses -> seleciona a palavra clicada; 2 cliques
 *       na palavra dentro dos parenteses -> seleciona "sessenta e cinco".
 *     - 1 clique na borda "(" ou ")" ou no espaco interno -> seleciona "sessenta e cinco".
 *     - 2 cliques na borda "(" ou ")" ou no espaco interno -> seleciona "(sessenta e cinco)"
 *       incluindo os proprios delimitadores de abertura e fechamento!
 *     - 1 clique no espaco entre "5" e "(" ou 2 cliques em "65" -> seleciona o
 *       bloco composto completo "65 (sessenta e cinco)".
 *   * Exemplo 2: "R$ 65,00 (sessenta e cinco reais)"
 *     - 1 clique em "65,00" -> seleciona apenas "65,00".
 *     - 1 clique em "R$" ou no espaco entre "R$" e "65,00" -> seleciona "R$ 65,00".
 *     - 1 clique no espaco entre "0" e "(" ("0 (s") ou 2 cliques em "R$"/"65,00" ->
 *       seleciona tudo: "R$ 65,00 (sessenta e cinco reais)".
 * - Mascaras de Datas Abreviadas, por Extenso e Competencia Mes/Ano:
 *   * Datas simples abreviadas ou por extenso ("17 ago. 2026", "29 de fevereiro de 2025")
 *     e competencias Mes/Ano ("out. 26", "ago. 2026", "out./2026") sao capturadas
 *     imediatamente no 1o clique em qualquer parte da data (inclusive sobre o ponto "."
 *     ou espaco interno), acionando tambem a auditoria matematica de calendario.
 *   * Quando houver horario contiguo acoplado ("23/10/2026 10:14:18" ou "23 de outubro
 *     de 2026 as 21:38:42"), 1 clique sobre a data captura apenas a data, e 1 clique no
 *     espaco/conector ou 2 cliques captura Data + Horario inteiros.
 * - Campos de Simbolos e Placeholders em Editores Multilinhas:
 *   * Reconhece sequencias de simbolos ("##########", "$$$$$$$$", "@@@@") e
 *     campos delimitados por simbolos ("#[digite o texto aqui]#", "##Funcionalidade##",
 *     "@@ Qualquer coisa aqui @@", "### Aqui qualquer coisa ##") para pre-selecao
 *     sem copia em editores de texto multilinhas.
 *
 * 3. INTEROPERABILIDADE PROCESSUAL: PJE (PRIMARIO), EPROC E PROJUDI (SECUNDARIOS):
 * - O ecossistema JusGovBR atua primordialmente sobre o Processo Judicial Eletronico (PJe),
 *   abrangendo anti-bloqueio de telas de carregamento (Anti-Ampulhetas), compatibilidade estrita
 *   com editores rich-text (CKEditor 4 e 5) e conversao de cabecalhos de pecas (Num. X - Pag. Y).
 * - SECUNDARIAMENTE, o sistema e projetado e preparado para operar com plena integridade e
 *   ergonomia nos sistemas processuais EPROC (TRF4, TJRS, TJSC, TJTO, etc.) e PROJUDI (TJPR,
 *   TJGO, TJBA, TJRO, etc.), ambos operando sob a zona de dominio "*.jus.br".
 * - A arquitetura transversal do motor assegura que:
 *   * Processos CNJ, prazos, datas, leis e valores sejam reconhecidos e auditados de imediato;
 *   * Tabelas de eventos processuais (eproc) e movimentacoes (projudi) possam ser copiadas por
 *     coluna ou linha inteira via Ctrl+Alt;
 *   * O filtro de digitos corridos (Shift + Clique) gere o CNJ com 7 digitos completados com zeros;
 *   * Cliques e arrastos do mouse sobre botoes de acao, menus e links de movimentacao nao gerem
 *     selecoes espurias acidentais de elementos de interface.
 * ========================================================================== */

(function() {
    'use strict';

    /* Passo 1.1: Permitir atualizacao limpa do namespace global caso o Service Worker
     * reinjete os scripts em abas abertas. */
    window.__JUSGOV_CONSTANTES_CARREGADO__ = true;

    /* ==========================================================================
     * SECAO 1: MASCARAS DE BITS E TABELA DE BUSCA RAPIDA ASCII (O(1) BITMASK)
     * O porque: Durante os Estagios 1, 2, 3 e 4 da selecao, o motor inspeciona dezenas
     * de caracteres vizinhos ao cursor. Testar cada caractere ASCII com Regex
     * gera sobrecarga de invocacao na engine Irregexp do V8. Com uma Uint8Array(128)
     * pre-populada, qualquer caractere de codigo 0..127 e classificado em uma unica
     * instrucao bitwise (TABELA_MASCARA_ASCII[code] & MASCARA), deixando as Regex
     * Unicode exclusivamente para caracteres acentuados (code >= 128).
     * ========================================================================== */
    /* Passo 1.2: Definir os bits de cada categoria lexica (potencias de 2 de 1 a 128) */
    const MASCARA_CARACTERE = Object.freeze({
        DIGITO: 1,            // 0b00000001 -> Digitos numericos '0'..'9'
        LETRA_ASCII: 2,       // 0b00000010 -> Letras sem acento 'A'..'Z' e 'a'..'z'
        ESPACO_BRANCO: 4,     // 0b00000100 -> Espacos e quebras ' ', '\t', '\n', '\r'
        DELIMITADOR_PAR: 8,   // 0b00001000 -> Delimitadores pareados '(', ')', '[', ']', '{', '}', '<', '>'
        DELIMITADOR_ASPAS: 16,// 0b00010000 -> Aspas ASCII '"' e "'"
        PONTUACAO_FIM: 32,    // 0b00100000 -> Pontuacao de fronteira de clausula ',', ';', '.', '!', '?'
        SIMBOLO_CONECTOR: 64, // 0b01000000 -> Conectores de tokens '/', '-', '_', '@', '+', '$', ':', '%'
        SIMBOLO_REPETIVEL: 128// 0b10000000 -> Simbolos de mascara repetivel '#', '*', '=', '~', '$', '@'
    });

    /* Passo 1.3: Alocar buffer tipado contiguo de 128 bytes na memoria do V8 */
    const TABELA_MASCARA_ASCII = new Uint8Array(128);

    /* Passo 1.4: Popular bits de digitos '0' (48) a '9' (57) */
    for (let codigo = 48; codigo <= 57; codigo++) {
        TABELA_MASCARA_ASCII[codigo] |= MASCARA_CARACTERE.DIGITO;
    }

    /* Passo 1.5: Popular bits de letras maiusculas 'A' (65) a 'Z' (90) e minusculas 'a' (97) a 'z' (122) */
    for (let codigo = 65; codigo <= 90; codigo++) {
        TABELA_MASCARA_ASCII[codigo] |= MASCARA_CARACTERE.LETRA_ASCII;
    }
    for (let codigo = 97; codigo <= 122; codigo++) {
        TABELA_MASCARA_ASCII[codigo] |= MASCARA_CARACTERE.LETRA_ASCII;
    }

    /* Passo 1.6: Popular bits de espacos em branco ASCII (Espaco=32, Tab=9, LF=10, CR=13) */
    [32, 9, 10, 13].forEach(codigo => {
        TABELA_MASCARA_ASCII[codigo] |= MASCARA_CARACTERE.ESPACO_BRANCO;
    });

    /* Passo 1.7: Popular bits de delimitadores geometricos de par (incluindo '<' e '>') */
    ['(', ')', '[', ']', '{', '}', '<', '>'].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.DELIMITADOR_PAR;
    });

    /* Passo 1.8: Popular bits de aspas ASCII simples e duplas */
    ['"', "'"].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.DELIMITADOR_ASPAS;
    });

    /* Passo 1.9: Popular bits de pontuacoes de fronteira de clausula ou periodo.
     * Nota critica: ',' e ';' sao separadores intermediarios e JAMAIS devem ser
     * incluidos ao selecionar uma palavra isolada (ex: "Brasilia," seleciona so "Brasilia").
     * O caractere ':' funciona como conector de complemento e tambem nao cola em palavras. */
    [',', ';', '.', '!', '?'].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.PONTUACAO_FIM;
    });

    /* Passo 1.10: Popular bits de simbolos conectores internos de entidades (incluindo '%') */
    ['/', '-', '_', '@', '+', '$', ':', '%'].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.SIMBOLO_CONECTOR;
    });

    /* Passo 1.11: Popular bits de simbolos repetiveis de mascara/placeholder juridico
     * (ex: 'id ##########', '$$$$$$$$', '@@@@', '****', '====', '~~~~'). */
    ['#', '*', '=', '~', '$', '@'].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.SIMBOLO_REPETIVEL;
    });

    /* ==========================================================================
     * SECAO 2: CONFIGURACOES DE LIMITES OPERACIONAIS E PARES GEOMETRICOS
     * ========================================================================== */
    /* Passo 2.1: Definir parametros de performance, janela deslizante (+/- 1000 chars)
     * e janela de duplo Esc (420ms) para alternar modo de formatacao basica. */
    const CONFIGURACAO_MOTOR = Object.freeze({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: 3500
    });

    /* Passo 2.2: Mapear pares de abertura e fechamento para busca bidirecional balanceada */
    const PARES_ABERTURA = Object.freeze({
        '(': ')',
        '[': ']',
        '{': '}',
        '<': '>'
    });

    const PARES_FECHAMENTO = Object.freeze({
        ')': '(',
        ']': '[',
        '}': '{',
        '>': '<'
    });

    /* Passo 2.3: Construir string de aspas retas, curvas e angulares via codigos numericos ASCII/Unicode
     * (34=", 39=', 8220=abre aspas duplas, 8221=fecha aspas duplas, 8216=abre simples, 8217=fecha simples, 171=<<, 187=>>)
     * evitando qualquer escape \uXXXX em strings. */
    const CARACTERES_ASPAS_TODOS = String.fromCharCode(34, 39, 8220, 8221, 8216, 8217, 171, 187);

    /* ==========================================================================
     * SECAO 3: EXPRESSOES REGULARES ATOMICAS E CENTRALIZADAS (V8 IRREGEXP US-ASCII)
     * O porque: Centralizar 100% das expressoes regulares neste modulo elimina
     * objetos RegExp espalhados pelos demais arquivos e garante compilacao unica
     * na inicializacao do Content Script.
     * ========================================================================== */
    const EXPRESSOES_REGULARES = Object.freeze({
        /* Classificadores Unicode acionados apenas quando charCode >= 128 */
        CHAR_LETRA_UNICODE: /^\p{L}$/u,
        CHAR_NUMERO_UNICODE: /^\p{N}$/u,
        CHAR_ALFANUMERICO_UNICODE: /^[\p{L}\p{N}]$/u,
        CHAR_ESPACO_UNICODE: /^[\s\u00A0]$/u,
        CHAR_SEPARADOR_DIRETO: /^[\/\-_@+$%\u00A7\u00BA\u00AA\u00B0]$/u,
        CHAR_SIMBOLO_REPETIVEL: /^[#*=~$@]$/u,
        CHAR_LETRA_GERAL: /\p{L}/u,
        CHAR_LETRA_MINUSCULA: /\p{Ll}/u,

        /* Rotulos e prefixos designadores que, ao receberem 1 clique direto sobre a palavra,
         * autorizam a captura do identificador imediatamente subsequente (ex: clicar em
         * "fls." em "fls. 10/25", em "id" em "id 12345678", em "no" em "no 136/2025").
         * Exclui "inciso", "alinea" e "paragrafo" para que 1 clique sobre eles selecione so a palavra. */
        PALAVRA_ROTULO_INICIAL: /^(?:arts?|artigos?|s\p{L}mulas?|temas?|oj|oab|portarias?|decretos?|resolu\p{L}{3,4}s?|instru\p{L}{3,4}s?|of\p{L}cios?|ac\p{L}rd\p{L}os?|inqu\p{L}ritos?|matr\p{L}culas?|livros?|termos?|certid\p{L}{2,3}s?|selos?|cda|ec|emendas?|fls?|folhas?|p\p{L}gs?|pgs?|pp|ids?|num|n[\u00BA\u00B0o]|cpf|cnpj|rg|pis|pasep|nit|nb|cns|sus|cep|processo|sei|tel|cel|fone)$/iu,

        /* Conectores semanticos de intervalos e atos que, ao receberem 1 clique direto sobre si
         * (ex: clicar em "a" em "01/01/2026 a 31/12/2026", em "as" em "08:00 as 18:00"
         * ou em "no" em "no 136/2025"), disparam a expansao para a expressao conectada! */
        PALAVRA_CONECTORA_INTERVALO: /^(?:a|\p{L}s|at\p{L}|ao|da|do|de|dos|das|e|c\/c|n\.?[\u00BA\u00B0o]|n\.)$/iu,

        /* Regra Universal Simplificada de Multiplos Numeros Espacados / Boletos:
         * Captura qualquer sequencia de 2 ou mais blocos numericos (contendo digitos e
         * pontuacoes internas de boletos/codigos como '.', '-', '/') separados por espaco
         * horizontal, independentemente da quantidade de blocos ou digitos (ex: "215 7014 6992 8831",
         * "0000.0000-0000 1111.1111-1111", linhas digitaveis e chaves de 44 digitos). */
        MULTIPLOS_NUMEROS_ESPACADOS: /(?<![\p{L}\p{N}_])(?:\+\d{1,3}[\t \u00A0\-]?)?(?:\(\d{2,3}\)[\t \u00A0\-]?)?\d+(?:[.\-\/]\d+)*(?:[\t \u00A0]+(?:\(\d{2,3}\)[\t \u00A0\-]?)?\d+(?:[.\-\/]\d+)*)+(?![\p{L}\p{N}_])/gu,

        /* Reconhecedor de cabecalhos nativos de documentos do PJe ("Num. 2297820154 - Pag. 1")
         * para conversao automatica no padrao "id 2297820154, pg. 1". */
        CABECALHO_ID_PJE: /^num\.?\s*(\d{7,12})(?:\s*[\-\u2013\u2014]\s*p\p{L}g\.?\s*(\d+[a-zA-Z]?))?$/iu,

        /* Reconhecedor de Campos de Simbolos / Placeholders em Textos Editaveis Multilinhas e Editores HTML:
         * Captura:
         * 1) Simbolos envolvendo colchetes: "[@@tag@@]", "[@@tag]", "[#tag#]", "[#INI##tag###]", "#[tag]#", "[##TEXTO DA DECISAO##]"
         * 2) Simbolos envolvendo chaves/parenteses: "@{campo}@", "@(campo)@"
         * 3) Mascaras de telefone com simbolos: "(##)####-####", "(##) #####-####", "(##) ####-####", "####-####"
         * 4) Mascaras de valor/moeda com simbolos: "##.###,##", "###,##"
         * 5) Mascaras de datas com simbolos: "##/##/20##", "##/##/####"
         * 6) Mascaras de leis/processos com simbolos: "#####/20##"
         * 7) Mascaras de CPF/CNPJ com simbolos: "###.###.###-##", "##.###.###/####-##"
         * 8) Simbolo cercado por delimitadores com rotulo/frase: "#tag/campo#", "#Autor da acao#"
         * 9) Simbolos repetidos (2 a 5) cercando rotulos/frases: "##tag/campo##", "@@ tag/campo @@", "### tag/campo ##", "###, #"
         * 10) Sequencias puras de 2 ou mais simbolos repetidos: "######", "#####", "##########", "$$$$$$$$", "@@@@@@@@", "###", "##". */
        CAMPO_PLACEHOLDER_EDITAVEL: /(?:\[[@#$*~_=%]{1,4}[^\]\r\n]+\]|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\[[^\]\r\n]+\][@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\{[^}\r\n]+\}[@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\([^)\r\n]+\)[@#$*~_=%]{0,4}|(?<![0-9a-zA-Z])(?:\(\s*[#]{2,3}\s*\)[ \t]*)?[#]{4,5}[ \t]*-[ \t]*[#]{4}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,3}(?:\.[#]{3})*,[#]{2}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])(?:[#]{1,4}\/){2}(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,7}\/(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{2,3}(?:\.[#]{3}){2}(?:\/[#]{4})?-[#]{2}(?![0-9a-zA-Z])|(?<![@#$*~_=%])#(?![#\s\[{(])[ \t\p{L}\p{N}_/\\-]{1,50}#(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])(?![@#$*~_=%\s\[{(])[^\s#$@*=~_=%]+\1(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])\2{1,4}(?![@#$*~_=%])[ \t]*[^\s.#$@*=~_=%][^.\r\n[\]#$@*=~_=%]{0,35}?\2{1,4}(?![@#$*~_=%])|[#$@*=~_=%]{2,})/gu,
        CAMPO_MARCADOR_SIMBOLOS: /(?:\[[@#$*~_=%]{1,4}[^\]\r\n]+\]|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\[[^\]\r\n]+\][@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\{[^}\r\n]+\}[@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\([^)\r\n]+\)[@#$*~_=%]{0,4}|(?<![0-9a-zA-Z])(?:\(\s*[#]{2,3}\s*\)[ \t]*)?[#]{4,5}[ \t]*-[ \t]*[#]{4}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,3}(?:\.[#]{3})*,[#]{2}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])(?:[#]{1,4}\/){2}(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,7}\/(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{2,3}(?:\.[#]{3}){2}(?:\/[#]{4})?-[#]{2}(?![0-9a-zA-Z])|(?<![@#$*~_=%])#(?![#\s\[{(])[ \t\p{L}\p{N}_/\\-]{1,50}#(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])(?![@#$*~_=%\s\[{(])[^\s#$@*=~_=%]+\1(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])\2{1,4}(?![@#$*~_=%])[ \t]*[^\s.#$@*=~_=%][^.\r\n[\]#$@*=~_=%]{0,35}?\2{1,4}(?![@#$*~_=%])|[#$@*=~_=%]{2,})/gu,

        /* Expressoes utilitarias centralizadas para higienizacao de texto, formatacao HTML e filtro Shift */
        CONTEM_ESPACO: /[\s\u00A0]/,
        CARACTERES_INVISIVEIS_ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
        INVISIVEIS_ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
        CARACTERES_LIXO_PDF: /[\u200B-\u200D\uFEFF\u2060\u00AD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
        ESPACO_NAO_QUEBRAVEL: /\u00A0/g,
        QUEBRAS_E_TABS: /[\r\n\t]+/g,
        MULTIPLOS_ESPACOS: /\s{2,}/g,
        ESPACOS_MULTIPLOS: /\s{2,}/g,
        ESPACOS_HORIZONTAIS_MULTIPLOS: /[ \t]{2,}/g,
        ESPACOS_BORDAS_LINHA: /^[ \t]+|[ \t]+$/g,
        TERMINA_COM_FECHAMENTO_OU_PCT: /[)\]}%]$/,
        SUFIXO_FECHAMENTO_PRESERVADO: /[)\]}%]$/,
        PONTUACAO_BORDA_EXTERNA: /^[,;:\s]+|[,;:\s]+$/g,
        ESTILO_CSS_NEGRITO: /font-weight\s*:\s*(?:bold|[6789]00)/i,
        ESTILO_NEGRITO_CSS: /font-weight\s*:\s*(?:bold|[6789]00)/i,
        ESTILO_CSS_ITALICO: /font-style\s*:\s*italic/i,
        ESTILO_ITALICO_CSS: /font-style\s*:\s*italic/i,
        ESTILO_CSS_SUBLINHADO: /text-decoration[^;]*underline/i,
        ESTILO_SUBLINHADO_CSS: /text-decoration[^;]*underline/i,
        TAG_U_ENVOLVENTE: /^<u>.*<\/u>$/i,
        TAG_U_ENVOLVIDA: /^<u>.*<\/u>$/i,
        TAG_I_ENVOLVENTE: /^<i>.*<\/i>$/i,
        TAG_I_ENVOLVIDA: /^<i>.*<\/i>$/i,
        TAG_B_ENVOLVENTE: /^<b>.*<\/b>$/i,
        TAG_B_ENVOLVIDA: /^<b>.*<\/b>$/i,
        TEM_LETRA_UNICODE: /\p{L}/u,
        TEM_MINUSCULA_UNICODE: /\p{Ll}/u,
        PREFIXO_MOEDA_RS: /^(?:[+\-\u2212\u2013]\s*)?R\$\s*/i,
        SUFIXO_MOEDA_RS_ANTERIOR: /(?:[+\-\u2212\u2013]\s*)?R\$\s*$/i,
        SUFIXO_HORARIO_EM_DATA: /(?:(?:\s*(?:[\-\u2013\u2014]|(?:\p{L}s|a)|,)\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:BRT|BRST|UTC|GMT))?)$/iu,
        DATA_NUMERICA_COM_HORARIO: /^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}(?:\s*(?:[\-\u2013\u2014]|(?:\p{L}s|a)|,)\s*|\s+)/u,
        INICIA_COM_DIGITO: /^\d/,
        INICIO_DIGITO: /^\d/,
        PROTOCOLO_BARRA_ANO_EXATO: /^(\d{1,12})\/(\d{2,4})$/,
        PROTOCOLO_BARRA_ANO: /^(\d{1,12})\/(\d{2,4})$/,
        ESCAPE_META_REGEX: /[.+^${}()|[\]\\]/g,
        CURINGA_ASTERISCO: /\*/g,
        LIMPEZA_TEXTO_LADO_ELASTICO: /[\s\u00A0.,;:!?]/g,
        SEPARADOR_PONTUACAO_LIVRE: /[\s\u00A0.,;:!?]/g,
        SEPARADOR_ESPACO_OU_PONTUACAO: /[\s\u00A0.,;]/,
        SEPARADOR_BORDA_RECUO: /[\s\u00A0.,;]/,
        PONTO_VIRGULA_FINAL: /;+$/g,
        PONTO_VIRGULA_BORDAS: /^;+|;+$/g,
        DIVISOR_PALAVRAS_ACUMULADOR: /[\s;]+/,
        SEPARADOR_TOKENS_ACUMULADOR: /[\s;]+/,
        NAO_DIGITOS: /\D/g,
        NAO_ALFANUMERICO_UPPER: /[^0-9A-Z]/g,
        CNJ_COMPLETO_OU_PARCIAL: /^(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/,
        ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL: /^(\d{1,7})-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
        ENTIDADE_NUMERICA_PONTUADA_SHIFT: /^(?:R\$\s*)?[0-9A-Z]+(?:[\/.\-\s()][0-9A-Z]+)+$/i,
        ENTIDADE_FILTRO_SHIFT: /^(?:CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS|CHAVES_FISCAIS_E_BOLETOS_ESPACADOS|DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO|NUMERACOES_ID_E_PUBLICAS|DATA_COM_HORARIO_CONTIGUO|TELEFONES_NACIONAIS_E_INTERNACIONAIS|FINANCEIRO_E_DECIMAIS|DATAS_E_HORARIOS|GENERICOS_E_FALLBACKS|PROCESSOS_CNJ|DOCUMENTOS_PESSOAIS|DATAS_E_TEMPO|CONTATOS_E_REDES)$/,
        SEQUENCIA_PALAVRAS_MAIUSCULAS: /(?<![\p{L}\p{N}])\p{Lu}[\p{Lu}\p{N}\u00BA\u00B0\u00AA]*(?:[\/.\-][\p{Lu}\p{N}]+)*(?:[\t \u00A0\r\n]+[\p{Lu}\p{N}][\p{Lu}\p{N}\u00BA\u00B0\u00AA]*(?:[\/.\-][\p{Lu}\p{N}]+)*)+(?![\p{L}\p{N}])/gu,
        CONTEM_DUAS_PALAVRAS_MAIUSCULAS: /\p{Lu}[\p{Lu}\p{N}\u00BA\u00B0\u00AA\/.\-]*[\t \u00A0\r\n]+(?:[\p{Lu}\p{N}\u00BA\u00B0\u00AA\/.\-]+[\t \u00A0\r\n]+)*\p{Lu}/u,
        PREFIXO_NUMERACAO_PARAGRAFO: /^\s*(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]?|[IVXLCDM]{1,7}[.)\-\u2013]|[a-zA-Z]\)|\u00A7+\s*\d*)\s*/u,
        MARCADOR_NOVO_PARAGRAFO_LINHA: /^\s*(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]\s+|[IVXLCDM]{1,7}[.)\-\u2013]\s+|[a-zA-Z]\)\s+|\u00A7+\s*\d+)/u,
        FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS: /[.;!?][\t \u00A0\r\n]+(?=(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]\s+|[IVXLCDM]{1,7}[.)\-\u2013]\s+|[a-zA-Z]\)\s+))/gu,
        FIM_FRASE_PARAGRAFO: /[.;!?]\s*$/,
        ABREVIACAO_FINAL_LINHA: /(?:^|[\s(])(?:arts?|fls?|p\p{L}gs?|pgs?|pp|num|n|inc|al|dr|dra|drs|rel|des|min|proc|id|cf|doc|anexo|vol|ap)\.\s*$/iu
    });

    /* ==========================================================================
     * SECAO 3.1: EXPRESSOES REGULARES CENTRALIZADAS DE AUDITORIA MATEMATICA
     * (Consumidas por modulo-AvisoFlutuante.js)
     * ========================================================================== */
    const REGEX_AUDITORIA = Object.freeze({
        /* Extrai data numerica isolada (com ou sem rotulo 'Data:') nos formatos DD/MM/AAAA, DD.MM.AAAA ou DD-MM-AA */
        DATA_ISOLADA: /^(?:data\s*[:\-]?\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-](?:\d{2}|\d{4}))$/i,
        /* Extrai data numerica acoplada a horario (DD/MM/AAAA HH:MM ou DD/MM/AAAA HH:MM:SS com espaco, hifen ou conector) */
        DATA_NUMERICA_COM_HORARIO_AUDITORIA: /^(?:data\s*[:\-]?\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-](?:\d{2}|\d{4}))(?:\s*(?:[\-\u2013\u2014]|(?:\p{L}s|a)|,)\s*|\s+)(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*(?:BRT|BRST|UTC|GMT))?$/iu,
        /* Extrai horario isolado nos formatos HH:MM ou HH:MM:SS (com rotulo opcional) */
        HORARIO_ISOLADO: /^(?:(?:as|hora|horario)\s*[:\-]?\s*)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*(?:BRT|BRST|UTC|GMT))?$/iu,
        /* Decompoe partes de horario (horas, minutos e segundos opcionais) */
        PARTES_HORARIO: /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        /* Extrai data por extenso ou abreviada (ex: "29 de fevereiro de 2025", "31 ago. 2026") */
        DATA_EXTENSO_OU_ABREV: /^(?:(?:segunda|ter\p{L}a|quarta|quinta|sexta)(?:-feira)?[,.\s]+|(?:s\p{L}bado|domingo)[,.\s]+)?(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|mar\p{L}o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)\s+(?:de\s+)?(\d{2}|\d{4})(?:[\s,]+(?:\p{L}s|a)?\s*(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*(?:BRT|BRST|UTC|GMT))?)?$/iu,
        /* Extrai CPF isolado (com ou sem rotulo 'CPF:' ou sufixo '(CPF)') */
        CPF_ISOLADO: /^(?:cpf\s*[:\-]?\s*)?(\d{3}\.?\d{3}\.?\d{3}-\d{2})(?:\s*\(cpf\))?$/i,
        /* Extrai CNPJ tradicional ou Novo Modelo Alfanumerico isolado (AA.AAA.AAA/AAAA-DD) */
        CNPJ_ISOLADO: /^(?:cnpj\s*[:\-]?\s*)?([A-Z0-9]{2,3}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})(?:\s*\(cnpj\))?$/i,
        /* Extrai Processo Judicial CNJ isolado (com ou sem rotulo 'Processo:') */
        CNJ_ISOLADO: /^(?:processo\s*[:\-]?\s*)?(\d{1,7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})$/i,
        /* Decompoe dia, mes e ano de uma string de data numerica */
        PARTES_DATA: /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/,
        /* Decompoe os 6 blocos estruturais da numeracao unica CNJ */
        PARTES_CNJ: /^(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/,
        /* Detecta sequencias de caracteres todos iguais (ex: '11111111111' ou 'AAAAAAAAAAAAAA') */
        CARACTERES_REPETIDOS: /^([0-9A-Z])\1+$/i,
        /* Verifica se os 2 digitos verificadores finais do CNPJ sao numericos */
        DOIS_DIGITOS_FINAIS: /^\d{2}$/,
        /* Remove acentos apos normalizacao NFD na chave do mes */
        APENAS_LETRAS_ASCII_LOWER: /[^a-z]/g
    });

    /* ==========================================================================
     * SECAO 4: CATALOGO DE PADROES JURIDICOS, GOVERNAMENTAIS E DE CIDADAO
     * Organizado por TIPO (grupo) e SUB-TIPOS (regexes), com documentacao do papel
     * de cada expressao. As sequencias numericas separadas por espaco (como NF-e
     * espacada e boleto espacado) ficam com exigeEspacoOuDuploClique: true para que
     * 1 clique selecione apenas o bloco contiguo e o espaco/2 cliques selecione tudo!
     * ========================================================================== */
    const CATALOGO_PADROES_JURIDICOS = Object.freeze([
        {
            /* TIPO 1: Identificadores Contiguos Fiscais/Bancarios (UUID/PIX) */
            grupo: 'CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 1.1: Identificador UUID v4 / Chave Aleatoria PIX (8-4-4-4-12 hexadecimais contiguos) */
                /(?<![\p{L}\p{N}])[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 2: Chaves Fiscais e Boletos Espacados (exige espaco ou 2 cliques para preservar 1 clique no bloco) */
            grupo: 'CHAVES_FISCAIS_E_BOLETOS_ESPACADOS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 2.1: Chave de Acesso NF-e / CT-e em 11 blocos de 4 digitos separados por espaco */
                /(?<![\p{L}\p{N}])(?:\d{4}[\t \u00A0]+){10}\d{4}(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 2.2: Linha Digitavel de Boleto Bancario padrao FEBRABAN e variacoes */
                /(?<![\p{L}\p{N}])\d{4,6}\.\d{4,6}[\t \u00A0]+\d{4,6}\.\d{4,7}[\t \u00A0]+\d{4,6}\.\d{4,7}[\t \u00A0]+\d[\t \u00A0]+\d{10,14}(?![\p{L}\p{N}])/gu
            ]
        },
        {
            /* TIPO 3: Documentos Pessoais, Fiscais e Profissionais (CNPJ Tradicional e Novo Alfanumerico, CPF, PIS, RG, CEP, OAB)
             * O porque da posicao prioritaria: Avaliar CNPJ/CPF/PIS/RG antes de protocolos com barra ("136/2025")
             * garante que clicar em qualquer parte de um CNPJ ("00.000.000/0001-91" ou "12.ABC.345/01DE-35")
             * selecione 100% do CNPJ imediatamente no 1o clique! */
            grupo: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 3.1: CNPJ Tradicional Numerico e Novo Modelo Alfanumerico (AA.AAA.AAA/AAAA-DD)
                 * Blindado nas bordas com (?<![\p{L}\p{N}\/.\-]) e (?![\p{L}\p{N}\/\-]|\.\p{N}) para jamais
                 * recortar sub-pedacos de numeros pontuados maiores (como "1.325.256.019-75"). */
                /(?<![\p{L}\p{N}\/.\-])[A-Z0-9]{2,3}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}(?:\s*\((?:CNPJ|CPF)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.2: PIS / PASEP / NIT (NNN.NNNNN.NN-N) */
                /(?<![\p{L}\p{N}\/.\-])\d{3}\.\d{5}\.\d{2}-\d{1}(?:\s*\((?:PIS|PASEP|NIT)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.3: CPF (NNN.NNN.NNN-NN) -- Blindado contra falso positivo em Unidades Consumidoras ("1.325.256.019-75") */
                /(?<![\p{L}\p{N}\/.\-])\d{3}\.\d{3}\.\d{3}-\d{2}(?:\s*\((?:CPF)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.4: RG e Beneficio INSS NB */
                /(?<![\p{L}\p{N}\/.\-])\d{1,3}\.\d{3}\.\d{3}-[0-9X](?:\s*\((?:RG|NB)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.5: Codigo de Enderecamento Postal CEP (NN.NNN-NNN ou NNNNN-NNN) */
                /(?<![\p{L}\p{N}\/.\-])\d{2}\.?\d{3}-\d{3}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 3.6: Inscricao na OAB (ex: "OAB/PI 12345", "OAB-SP 123.456-A") */
                /(?<![\p{L}\p{N}])OAB[\/\-]?(?:[A-Z]{2})?[\/\- \t]?\d{2,7}(?:\.\d{3})?(?:-[A-Z])?(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 3.7: Passaporte Brasileiro (2 letras + 6 digitos) */
                /(?<![\p{L}\p{N}])[A-Z]{2}\d{6}(?![\p{L}\p{N}])/gu
            ]
        },
        {
            /* TIPO 4: Processos Judiciais CNJ, Processos SEI!, Placas Veiculares e Protocolos/Ano */
            grupo: 'NUMERACOES_ID_E_PUBLICAS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 4.1: Processo Administrativo SEI! (NNNNN.NNNNNN/AAAA-DD) */
                /(?<![\p{L}\p{N}\/.\-])\d{5}\.\d{6}\/\d{4}-\d{2}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 4.2: Processo Judicial CNJ padrao (NNNNNNN-DD.AAAA.J.TR.OOOO) */
                /(?<![\p{L}\p{N}\/.\-])\d{1,7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 4.3: Placas Veiculares padrao Mercosul e antigo (Renajud) */
                /(?<![\p{L}\p{N}])[A-Z]{3}[\- ]?[0-9][A-Z0-9][0-9]{2}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 4.4: Numero de Ato/Registro/Protocolo com barra de ano (ex: "136/2025", "63055/2023")
                 * Blindado com (?<![\p{L}\p{N}\/.\-]) e (?![\p{L}\p{N}\/.\-]) para jamais capturar pedacos de CNPJ/Datas.
                 * Em 1 clique no numero antes da barra seleciona so o numero; na barra ou com 2 cliques seleciona tudo */
                /(?<![\p{L}\p{N}\/.\-])(\d{1,12})\/(\d{2,4})(?![\p{L}\p{N}\/.\-])/gu
            ]
        },
        {
            /* TIPO 5: Datas por Extenso, Abreviadas ("17 ago. 2026"), Competencia Mes/Ano ("out. 26") e Data + Horario Contiguo
             * O porque de exigeEspacoOuDuploClique: false: Datas abreviadas ("17 ago. 2026"), por extenso ("29 de fevereiro de 2025")
             * e competencias Mes/Ano ("out. 26", "ago. 2026") devem ser capturadas imediatamente no 1o clique em qualquer parte
             * da mascara (inclusive sobre o ponto "." ou espaco), acionando tambem a auditoria matematica de calendario.
             * Quando houver horario contiguo acoplado (ex: "23/10/2026 10:14:18"), o motor em modulo-SelecionarCopiar.js
             * isola a data no 1o clique e une Data + Horario ao clicar no espaco/conector ou com 2 cliques. */
            grupo: 'DATA_COM_HORARIO_CONTIGUO',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 5.1: Data por extenso ou abreviada com dia da semana opcional e horario opcional
                 * Ex: "17 ago. 2026", "29 de fevereiro de 2025", "sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT" */
                /(?<![\p{L}\p{N}])(?:(?:segunda|ter\p{L}a|quarta|quinta|sexta)(?:-feira)?[,.\s]+|(?:s\p{L}bado|domingo)[,.\s]+)?\d{1,2}[\s\/\-]+(?:de\s+)?(?:janeiro|fevereiro|mar\p{L}o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)[\s\/\-]+(?:de\s+)?\d{2,4}(?:[\s,]+(?:\p{L}s|a)?\s*(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*(?:BRT|BRST|UTC|GMT))?)?(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 5.2: Mes abreviado ou por extenso + Ano (ex: "out. 26", "ago. 2026", "out./2026", "out. de 2026") */
                /(?<![\p{L}\p{N}])(?:janeiro|fevereiro|mar\p{L}o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)(?:\.?\s+|[\s\/\-]+(?:de\s+)?)\d{2,4}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 5.3: Data numerica seguida de horario contiguo (ex: "28/10/2026 06:28", "23/10/2026 10:14:18", "28/10/2026 - 06:28:50") */
                /(?<![\p{L}\p{N}\/])\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}(?:\s*(?:[\-\u2013\u2014]|(?:\p{L}s|a)|,)\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:BRT|BRST|UTC|GMT))?(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 6: Intervalos de Datas, Horarios, Moedas, Numeros com Extenso e Referencias de ID/Folhas */
            grupo: 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 6.1: Intervalo de datas (ex: "01/01/2026 a 31/12/2026" ou "01/2024 ate 12/2025") */
                /(?<![\p{L}\p{N}\/])\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})\s*(?:a|at\p{L}|ao|[\-\u2013])\s*\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})(?![\p{L}\p{N}\/])/giu,
                /* Sub-tipo 6.2: Intervalo de horarios (ex: "08:00 as 18:00" ou "8h a 12h30min") */
                /(?<![\p{L}\p{N}:])(?:[01]?\d|2[0-3])(?::[0-5]\d(?::[0-5]\d)?|h(?:[0-5]\d(?:min)?)?)\s*(?:a|\p{L}s|at\p{L}|[\-\u2013])\s*(?:[01]?\d|2[0-3])(?::[0-5]\d(?::[0-5]\d)?|h(?:[0-5]\d(?:min)?)?)(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 6.3: Referencias de ID do PJe, Folhas e Paginas (ex: "id 12345678 pg 55v", "fls. 10/25", "id ##########", "id ###### fl. ##") */
                /(?<![\p{L}\p{N}])(?:ids?\.?|fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|p\p{L}ginas?|pp\.?|num\.?)\s*[:\-]?\s*(?:[#*]{3,}(?:\s*,?\s*(?:-\s*)?(?:fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|pp\.?)\s*[#*]{1,6})?|\d+(?:\.\d+)*[vV]?(?:\s*(?:a|at\p{L}|ao|[\/\-])\s*\d+(?:\.\d+)*[vV]?|\s*,?\s*(?:-\s*)?(?:fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|pp\.?)\s*\d+(?:\.\d+)*[vV]?)*)(?![\p{L}\p{N}#*])/giu,
                /* Sub-tipo 6.4: Intervalo de valores monetarios (ex: "R$ 1.000,00 a R$ 5.000,00") */
                /(?<![\p{L}\p{N}])R\$\s?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}\s*(?:a|at\p{L}|ao|[\-\u2013])\s*R\$\s?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 6.5: Numero cardinal ou percentual seguido de extenso entre parenteses
                 * Ex: "65 (sessenta e cinco)" ou "100% (cem por cento)".
                 * Com exigeEspacoOuDuploClique: true, 1 clique em "65" seleciona so "65";
                 * 1 clique no espaco entre "65" e "(" ou 2 cliques em "65" seleciona "65 (sessenta e cinco)"!
                 * Blindado com (?<!R\$\s*)(?<![\p{L}\p{N}.,$]) para jamais capturar parcialmente valores
                 * monetarios precedidos por "R$" (como "R$ 65,00 (sessenta e cinco reais)"), garantindo
                 * que o Sub-tipo 10.1 capture o valor completo incluindo o prefixo "R$ "! */
                /(?<!R\$\s*)(?<![\p{L}\p{N}.,$])\d+(?:[.,]\d+)*%?\s+\([\p{L}\s,\-]+?\)(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 7: Citacoes de Legislacao, Jurisprudencia e Atos Administrativos/Cartorarios
             * O porque da precisao concentrada: Cada etapa de continuacao exige obrigatoriamente um
             * complemento normativo final (numero, romano, sigla de diploma/tribunal ou alinea explicita),
             * jamais terminando em espaco em branco, preposicao ("de", "da"), conjuncao ("e") ou artigo ("a", "o"),
             * e jamais engolindo rotulos com dois-pontos antes da citacao (como "Emenda:"). */
            grupo: 'LEGISLACAO_JURISPRUDENCIA_E_ATOS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 7.1: Dispositivos legais e emendas constitucionais concentrados
                 * Ex: "art. 5o, inciso LV, da CF/88", "art. 24, paragrafos 1o e 2o da EC n.o 103/2019",
                 * "Sumula Vinculante 13", "Tema 1033 do STJ" */
                /(?<![\p{L}\p{N}])(?:arts?\.?|artigos?|\u00A7\u00A7?|par[a\u00E1]grafos?|incisos?|al[i\u00ED]neas?\s+(?:['"]?[a-zA-Z0-9]{1,3}['"]?)|leis?(?:\s+complementar(?:es)?|\s+federais?|\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|emendas?\s+constituciona(?:l|is)|ec|lc|mp|decreto-lei|s[u\u00FA]mulas?(?:\s+vinculantes?)?|enunciados?|temas?|oj)(?![\p{L}:])(?:[\s,\-]+(?:(?:de|do|da|dos|das|e|ou|c\/c|n\.?[\u00BA\u00B0\u00AAo.]?(?![\p{L}:]))[\s,\-]+)*(?:al[i\u00ED]neas?\s+(?:['"]?[a-zA-Z0-9]{1,3}['"]?)(?![\p{L}:])|(?:arts?\.?|artigos?|\u00A7\u00A7?|par[a\u00E1]grafos?(?:\s+[u\u00FA]nico)?|incisos?|c[a\u00E1]put|leis?(?:\s+complementar(?:es)?|\s+federais?)?|emendas?\s+constituciona(?:l|is)|ec|lc|mp|decreto-lei|s[u\u00FA]mulas?(?:\s+vinculantes?)?|temas?|oj|cpc|cf|cc|clt|cpp|cp|ctn|cdc|eca|lep|stj|stf|tnu|tst|tse|trf\d?|tj[a-z]{2}|trt\d?)(?:\/(?:\d{4}|\d{2}))?(?![\p{L}\p{N}:])|\d+(?:\.\d+)*(?:[\-\/]\d{1,4})?[\u00BA\u00B0\u00AA]?|[IVXLCDM]+(?![\p{L}:])|['"][a-zA-Z0-9]{1,4}['"]))+/giu,
                /* Sub-tipo 7.2: Atos administrativos com suporte a siglas de orgaos compostas (ex: PRES/INSS, DIRBEN/INSS)
                 * Ex: "Instrucao Normativa PRES/INSS no 128/2022", "Portaria no 100/2026", "Livro B- 63055/2021" */
                /(?<![\p{L}\p{N}])(?:portarias?(?:\s+conjuntas?)?|decretos?|resolu[c\u00E7](?:[a\u00E3]o|[o\u00F5]es)|instru[c\u00E7](?:[a\u00E3]o|[o\u00F5]es)\s+normativas?|in|of[i\u00ED]cios?(?:\s+circulares)?|memorandos?|ac[o\u00F3]rd[a\u00E3]os?|parecer(?:es)?|inqu[e\u00E9]ritos?(?:\s+policia(?:l|is))?|ipl|pad|pa|edita(?:l|is)|matr[i\u00ED]culas?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|livros?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|termos?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|certid(?:[a\u00E3]o|[o\u00F5]es)(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|selos?(?:\s+digita(?:l|is))?|cda(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?)(?![\p{L}:])(?:\s+[A-Z0-9]{1,15}(?:[\/\-][A-Z0-9]{1,15})*-?)*(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?\s*\d[\d.\-\/A-Z]*[\dA-Z](?![\p{L}\p{N}])/giu,
                /* Sub-tipo 7.3: Numeracao curta de ato com prefixo "no" / "n.o"
                 * Ex: "no 136/2025", "n.o 103/2019", "no 1.234/2026" */
                /(?<![\p{L}\p{N}])n\.?[\u00BA\u00B0\u00AAo]\s*\d+(?:\.\d+)*(?:[\/\-]\d{2,4})?(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 8: Coordenadas Geograficas GPS (DMS, DMM, Graus Decimais, UTM/SIRGAS) e Google Plus Codes */
            grupo: 'COORDENADAS_GPS_E_PLUS_CODES',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 8.1: Graus, Minutos e Segundos Sexagesimais (DMS)
                 * Ex: "15o47'39.2\"S 47o52'55.8\"W", "15o 47' 39,2\" S, 47o 52' 55,8\" O", "S 15o47'39.2\" W 47o52'55.8\"" */
                /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[NSns]?(?:[\s,;\/]+|\s+[eE]\s+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[EWewOLol]?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.2: Graus e Minutos Decimais (DMM)
                 * Ex: "15o 47.653' S, 47o 52.930' W", "15o47.653'S 47o52.930'O" */
                /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}[.,]\d+\s*['\u2032\u2019]\s*[NSns]?(?:[\s,;\/]+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}[.,]\d+\s*['\u2032\u2019]\s*[EWewOLol]?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.3: Graus Decimais (DD -- estilo Google Maps)
                 * Ex: "-15.794229, -47.882166", "-5.08921, -42.80160", "+23.550520, -46.633308" */
                /(?<![\p{L}\p{N}.\/\-])[+\-]?\d{1,2}\.\d{4,8}\s*,\s*[+\-]?\d{1,3}\.\d{4,8}(?![\p{L}\p{N}.\/\-])/gu,
                /* Sub-tipo 8.4: Coordenadas Planas UTM / SIRGAS 2000 (Pericias, INCRA, CAR, IBAMA)
                 * Ex: "23S 721450mE 8251340mS", "23K 333456 E 7394567 N", "UTM 23S E 721.450,00 N 8.251.340,00" */
                /(?<![\p{L}\p{N}])(?:UTM\s+)?\d{1,2}\s*[C-HJ-NP-Xc-hj-np-x]\s+(?:[Ee]\s*)?\d{3}(?:\.?\d{3})(?:,\d{1,3})?\s*(?:m\s*[Ee]|[Ee])?[\s,;\/]+(?:[NnSs]\s*)?\d{1}(?:\.?\d{3}){2}(?:,\d{1,3})?\s*(?:m\s*[NnSs]|[NnSs])?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.5: Google Plus Codes (Open Location Code -- completo 8+2 ou curto 4/6+2)
                 * Ex: "58PJ645X+44", "6877656X+99", "645X+44" */
                /(?<![\p{L}\p{N}+])(?:[23456789CFGHJMPQRVWX]{8}|[23456789CFGHJMPQRVWX]{4,6})\+[23456789CFGHJMPQRVWX]{2,3}(?![\p{L}\p{N}+])/giu
            ]
        },
        {
            /* TIPO 8: Enderecos de E-mail e Perfis/Handles Sociais */
            grupo: 'EMAILS_E_PERFIS_SOCIAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 8.1: E-mails padrao RFC 5322 */
                /(?<![\p{L}\p{N}_%+.\\-])[a-zA-Z0-9]+(?:[._%+\-][a-zA-Z0-9]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,15}(?![\p{L}\p{N}_%+.\\-])/gu,
                /* Sub-tipo 8.2: Handles e perfis sociais iniciados por '@' */
                /(?<![\p{L}\p{N}_.\-])@[a-zA-Z0-9_]+(?:[.\-][a-zA-Z0-9_]+)*(?![\p{L}\p{N}_])/gu
            ]
        },
        {
            /* TIPO 9: Telefones Nacionais e Internacionais (Blindado contra falso-positivo em blocos de 4 digitos)
             * O porque da correcao: Exige parenteses no DDD "(XX)", ou prefixo "+DDI", ou "0800", ou hifen "-"
             * entre os dois blocos finais do telefone. Assim, sequencias puras espacadas como "215 7014 6992 8831"
             * NUNCA sao confundidas com telefone em 1 clique! */
            grupo: 'TELEFONES_NACIONAIS_E_INTERNACIONAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 9.1: Telefone com DDD entre parenteses ou +DDI (ex: "(86) 99999-8888", "+55 (11) 98765-4321") */
                /(?<![\p{L}\p{N}\/.])(?:(?:\+\d{1,3}[\t \u00A0\-]?)?\(\d{2,3}\)[\t \u00A0\-]?(?:9[\t \u00A0\-]?\d{4}|\d{4})[\t \u00A0\-]\d{4}|0?\d{2}[\t \u00A0\-]?(?:9\d{4}|\d{4})-\d{4})(?![\p{L}\p{N}\/.])/gu,
                /* Sub-tipo 9.2: Servicos de utilidade 0800 / 0300 / 4004 (ex: "0800 728 1992", "0800 1234-5678", "4004-0104") */
                /(?<![\p{L}\p{N}])(?:0[3589]00[\t \u00A0\-]?\d{3,4}[\t \u00A0\-]?\d{4,5}|[34]00\d-\d{4})(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 9.3: Telefone Internacional com +DDI explicito (ex: "+1 800-555-0199", "+351 21 123 4567") */
                /(?<![\p{L}\p{N}])\+\d{1,3}[\t \u00A0\-.](?:\(\d{1,4}\)[\t \u00A0\-]?)?\d{2,5}(?:[\t \u00A0\-.]\d{2,5}){1,3}(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 9.4: Telefone local sem DDD com hifen obrigatorio (ex: "99999-8888", "3222-1111") */
                /(?<![\p{L}\p{N}\-\/.,])(?:9[\t \u00A0.]?\d{4}|\d{4})-\d{4}(?![\p{L}\p{N}\-\/.,])/gu
            ]
        },
        {
            /* TIPO 10: Valores Monetarios (com logica incremental para extenso), Percentuais e Numeros com Sinal (+ ou -) */
            grupo: 'FINANCEIRO_E_DECIMAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 10.1: Moeda em Reais (com ou sem R$, com ou sem sinal unario +/-) com extenso opcional entre parenteses
                 * Ex: "R$ 65,00 (sessenta e cinco reais)", "R$ -1.000,00", "R$ - 1.000,00", "-R$ 1.000,00", "R$ +1.000,00", "1.500,00", "+0,25", "-0,45" */
                /(?<![\p{L}\p{N}])(?:(?:[+\-\u2212\u2013]\s*)?R\$\s*[+\-\u2212\u2013]?\s*|R\$\s*[+\-\u2212\u2013]?\s*|[+\-\u2212\u2013])?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}(?:\s*\([\p{L}\p{N}\s,.\-]+\))?(?![\p{L}\p{N}%])/giu,
                /* Sub-tipo 10.2: Formato Percentual com ou sem sinal unario +/- (ex: "100%", "20,500%", "+0,25%", "-0,45%", "+1%", "-10%") */
                /(?<![\p{L}\p{N}])[+\-\u2212\u2013]?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:[.,]\d+)?%(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 10.3: Numeros inteiros ou decimais com sinal explicito (+ ou - sem espaco)
                 * Ex: "+1", "-1", "+100", "-50", "+1.233", "-1.233", "-1.233,00", "+1.233,00"
                 * Blindado com (?![\p{L}\p{N}%.,]) para jamais truncar antes de separador decimal ou milhar e evitar falsos-positivos em marcadores */
                /(?<![\p{L}\p{N}])[+\-\u2212\u2013](?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?(?![\p{L}\p{N}%.,])/gu
            ]
        },
        {
            /* TIPO 11: Datas Isoladas (DD/MM/AAAA, DD.MM.AAAA, DD-MM-AAAA, MM/AAAA) e Horarios Isolados */
            grupo: 'DATAS_E_HORARIOS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 11.1: Datas numericas separadas por '/', '.' ou '-' (blindado com (?![\p{L}\p{N}\/\-]|\.\p{N}) permitindo ponto final de sentenca como "Itabuna, 01.05.19.") */
                /(?<![\p{L}\p{N}\/.\-])\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 11.2: Horarios isolados (HH:MM:SS, HH:MM, HHhMMmin) */
                /(?<![\p{L}\p{N}:])(?:\d{1,2}:\d{2}(?::\d{2})?|(?:[01]?\d|2[0-3])h(?:[0-5]\d(?:min)?)?)(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 12: Padroes Genericos, Blocos de Boletos Pontuados ("0000.0000-0000") e Resolucoes ("2560x1080") */
            grupo: 'GENERICOS_E_FALLBACKS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 12.1: Resolucoes de tela/video (ex: "2560x1080") */
                /(?<![\p{L}\p{N}_\-])\d{3,5}x\d{3,5}(?![\p{L}\p{N}_\-])/giu,
                /* Sub-tipo 12.2: Blocos numericos contiguos com pontuacoes separadoras de boletos/codigos
                 * Ex: "0000.0000-0000", "12345.67890", "01.02.03-4" (qualquer quantidade de digitos sem espaco) */
                /(?<![\p{L}\p{N}_\-])(?:\d+[\/\-\.,])+\d+(?![\p{L}\p{N}_\-])/gu,
                /* Sub-tipo 12.3: Sequencia numerica pura de 3+ digitos */
                /(?<![\p{L}\p{N}_\-])\d{3,}(?![\p{L}\p{N}_\-])/gu
            ]
        }
    ]);

    /* ==========================================================================
     * SECAO 5: ARQUITETURA DE FILTROS HTML PROGRESSIVOS EM 5 NIVEIS
     * O porque: Sanitizacao ativa e interoperabilidade com editores juridicos,
     * baseada em direcao unidirecional ascendente (cada nivel herda do anterior).
     * ========================================================================== */
    const NIVEIS_FILTRO_HTML = Object.freeze({
        0: Object.freeze({
            indice: 0,
            id: 'texto_puro',
            chave: 'texto_puro',
            nome: 'Texto Puro',
            escopo: 'Remove 100% das tags HTML/XML, converte entidades (&nbsp; -> espaco, &amp; -> &), normaliza quebras de linha (\\r\\n -> \\n). Sanitizacao ativa via node.textContent.',
            alvo: 'input, textarea, logs, variaveis de busca, campos de sistema legados sem suporte a markup.'
        }),
        1: Object.freeze({
            indice: 1,
            id: 'basico',
            chave: 'basico',
            nome: 'Basico (Inline)',
            escopo: 'Apenas formatacao de caracteres: b, strong, i, em, u, s, sub, sup, span, br. Proibido qualquer atributo CSS de bloco ou quebras estruturais.',
            alvo: 'Caixas de comentario, anotacoes rapidas, chats internos.'
        }),
        2: Object.freeze({
            indice: 2,
            id: 'intermediario',
            chave: 'intermediario',
            nome: 'Intermediario (Paragrafo/Fluxo)',
            escopo: 'Nivel 1 + p, blockquote, ul, ol, li, hr. CSS restrito a alinhamento (text-align) e recuo simples (margin-left / text-indent). Sem tabelas.',
            alvo: 'CKEditor / TinyMCE em modo padrao de redacao juridica (despachos simples, certidoes).'
        }),
        3: Object.freeze({
            indice: 3,
            id: 'avancado',
            chave: 'avancado',
            nome: 'Avancado (Documental / RTF classico)',
            escopo: 'Nivel 2 + h1-h6, pre, code, table, thead, tbody, tr, th, td. CSS inline para bordas, preenchimento (padding) e larguras de coluna (width).',
            alvo: 'Editores RTF completos, relatorios formatados, minutas com tabelas de calculo.'
        }),
        4: Object.freeze({
            indice: 4,
            id: 'estendido',
            chave: 'estendido',
            nome: 'Estendido (Suites Office / Canvas)',
            escopo: 'Nivel 3 + img, colspan, rowspan, metadados de pagina/secao, listas multinivel aninhadas, div com posicionamento controlado.',
            alvo: 'LibreOffice Online, Google Docs, DOCX, ODT.'
        })
    });

    /* Passo 6.1: Exportar o namespace imutavel window.JusGovConstantes congelado para o V8 */
    window.JusGovConstantes = Object.freeze({
        MASCARA_CARACTERE,
        TABELA_MASCARA_ASCII,
        CONFIGURACAO_MOTOR,
        PARES_ABERTURA,
        PARES_FECHAMENTO,
        CARACTERES_ASPAS_TODOS,
        EXPRESSOES_REGULARES,
        REGEX_AUDITORIA,
        CATALOGO_PADROES_JURIDICOS,
        NIVEIS_FILTRO_HTML
    });
})();
