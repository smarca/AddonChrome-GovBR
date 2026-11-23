/* ==========================================================================
 * ARQUIVO: src/lib/lib-constantes.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - ARQUIVO: src/lib/lib-constantes.js
 * - Objeto Exportado: window.JusGovConstantes (congelado via Object.freeze + guarda __JUSGOV_CONSTANTES_CARREGADO__)
 * - Estruturas Exportadas: MASCARA_CARACTERE, TABELA_MASCARA_ASCII (Uint8Array 128 O(1)), CONFIGURACAO_MOTOR, PARES_ABERTURA/FECHAMENTO, EXPRESSOES_REGULARES, REGEX_AUDITORIA, CATALOGO_PADROES_JURIDICOS (12 grupos), NIVEIS_FILTRO_HTML (0..4), TABELA_ESPECIES_INSS, TABELA_TRIBUNAIS_CNJ, TABELA_REGIOES_FISCAIS_CPF
 * - Regras / Seções: ADR-003 (Bitmask ASCII O(1)), Seção 6.36, BUG-06, Seção 6.60, Seção 6.64
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

(function(raiz) {
    'use strict';

    /* Passo 1.1: Permitir atualizacao limpa do namespace global caso o Service Worker
     * reinjete os scripts em abas abertas, evitando recompilar todo o catalogo de Regex
     * se ja estiver carregado e integro no contexto atual (Idempotencia O(1)). */
    if (raiz.__JUSGOV_CONSTANTES_CARREGADO__ && raiz.JusGovConstantes && raiz.JusGovConstantes.CATALOGO_PADROES_JURIDICOS) {
        return;
    }
    raiz.__JUSGOV_CONSTANTES_CARREGADO__ = true;

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
     * (ex: 'id ##########', '$$$$$$$$', '@@@@', '****', '====', '~~~~', '__________'). */
    ['#', '*', '=', '~', '$', '@', '_'].forEach(ch => {
        TABELA_MASCARA_ASCII[ch.charCodeAt(0)] |= MASCARA_CARACTERE.SIMBOLO_REPETIVEL;
    });

    /* ==========================================================================
     * SECAO 2: CONFIGURACOES DE LIMITES OPERACIONAIS E PARES GEOMETRICOS
     * ========================================================================== */
    /* Passo 2.1: Definir parametros de performance, janela deslizante (+/- 1000 chars)
     * e janela de duplo Esc (420ms) para alternar modo de formatacao basica (integrado com cfg-defaults.js). */
    const CONFIGURACAO_MOTOR = Object.freeze(Object.assign({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        TOLERANCIA_MAXIMA_DX_CLIQUE_PX: 24,
        TOLERANCIA_MAXIMA_DY_CLIQUE_PX: 12,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: -1,
        TEMPO_CONFERENCIA_DOCUMENTOS_MS: -1,
        TEMPO_FLASH_BORDER_MS: -1,
        LIMITE_SLOTS_CLIPBOARD_INTERNO: 2,
        LIMITE_MAXIMO_CONTADOR_OPERACIONAL: 900000000
    }, (raiz.JusGovCfgDefaults && raiz.JusGovCfgDefaults.CONFIGURACAO_MOTOR) || {}));

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
        CHAR_SIMBOLO_REPETIVEL: /^[#*=~$@_]$/u,
        CHAR_LETRA_GERAL: /\p{L}/u,
        CHAR_LETRA_MINUSCULA: /\p{Ll}/u,

        /* Rotulos e prefixos designadores que, ao receberem 1 clique direto sobre a palavra,
         * autorizam a captura do identificador imediatamente subsequente (ex: clicar em
         * "fls." em "fls. 10/25", em "id" em "id 12345678", em "no" em "no 136/2025").
         * Exclui "inciso", "alinea" e "paragrafo" para que 1 clique sobre eles selecione so a palavra. */
        PALAVRA_ROTULO_INICIAL: /^(?:arts?|artigos?|s\p{L}mulas?|temas?|oj|oab|portarias?|decretos?|resolu\p{L}{3,4}s?|instru\p{L}{3,4}s?|of\p{L}cios?|ac\p{L}rd\p{L}os?|inqu\p{L}ritos?|matr\p{L}culas?|livros?|termos?|certid\p{L}{2,3}s?|selos?|cda|ec|emendas?|fls?|folhas?|p\p{L}gs?|pgs?|pp|ids?|num|n[\u00BA\u00B0o]|cpf|cnpj|rg|pis|pasep|nit|nb|protocolos?|prot|cns|sus|cep|processo|sei|tel|cel|fone)$/iu,

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
         * 9) Simbolos repetidos (2 a 5) cercando rotulos/frases (inclusive quando precedidos por @@@@ sem espaco ou seguidos por ; antes do fechamento, ex: "@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@" ou "##tag/campo##", "@@ tag/campo @@", "### tag/campo ##")
         * 10) Sequencias puras de 2 ou mais simbolos repetidos: "######", "#####", "##########", "$$$$$$$$", "@@@@@@@@", "###", "##". */
        CAMPO_PLACEHOLDER_EDITAVEL: /(?:\[[@#$*~_=%]{1,4}[^\]\r\n]+\]|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\[[^\]\r\n]+\][@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\{[^}\r\n]+\}[@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\([^)\r\n]+\)[@#$*~_=%]{0,4}|(?<![0-9a-zA-Z])(?:\(\s*[#]{2,3}\s*\)[ \t]*)?[#]{4,5}[ \t]*-[ \t]*[#]{4}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,3}(?:\.[#]{3})*,[#]{2}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])(?:[#]{1,4}\/){2}(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,7}\/(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{2,3}(?:\.[#]{3}){2}(?:\/[#]{4})?-[#]{2}(?![0-9a-zA-Z])|(?<![@#$*~_=%])#(?![#\s\[{(])[ \t\p{L}\p{N}_/\\-]{1,50}#(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])(?![@#$*~_=%\s\[{(])[^\s.,;:!?()[\]{}#$@*=~_=%]+\1(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])\2{1,4}(?![@#$*~_=%])[ \t]*[^\s.!?:()[\]{}#$@*=~_=%](?:[^\r\n[\].#$@*=~_=%]|\.(?=\d)){0,220}?\2{1,4}(?![@#$*~_=%])|[#$@*=~_=%]{2,})/gu,
        CAMPO_MARCADOR_SIMBOLOS: /(?:\[[@#$*~_=%]{1,4}[^\]\r\n]+\]|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\[[^\]\r\n]+\][@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\{[^}\r\n]+\}[@#$*~_=%]{0,4}|(?<![@#$*~_=%])[@#$*~_=%]{1,4}\([^)\r\n]+\)[@#$*~_=%]{0,4}|(?<![0-9a-zA-Z])(?:\(\s*[#]{2,3}\s*\)[ \t]*)?[#]{4,5}[ \t]*-[ \t]*[#]{4}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,3}(?:\.[#]{3})*,[#]{2}(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])(?:[#]{1,4}\/){2}(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{1,7}\/(?:[#]{2,4}|20[#]{2})(?![0-9a-zA-Z])|(?<![0-9a-zA-Z])[#]{2,3}(?:\.[#]{3}){2}(?:\/[#]{4})?-[#]{2}(?![0-9a-zA-Z])|(?<![@#$*~_=%])#(?![#\s\[{(])[ \t\p{L}\p{N}_/\\-]{1,50}#(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])(?![@#$*~_=%\s\[{(])[^\s.,;:!?()[\]{}#$@*=~_=%]+\1(?![@#$*~_=%])|(?<![@#$*~_=%])([@#$*~_=%])\2{1,4}(?![@#$*~_=%])[ \t]*[^\s.!?:()[\]{}#$@*=~_=%](?:[^\r\n[\].#$@*=~_=%]|\.(?=\d)){0,220}?\2{1,4}(?![@#$*~_=%])|[#$@*=~_=%]{2,})/gu,

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
        SEQUENCIA_PALAVRAS_MAIUSCULAS: /(?<![\p{L}\p{N}])\p{Lu}[\p{Lu}\p{N}\u00BA\u00B0\u00AA]*(?:[\/.\-][\p{Lu}\p{N}]+)*(?:[\t \u00A0]+[\p{Lu}\p{N}][\p{Lu}\p{N}\u00BA\u00B0\u00AA]*(?:[\/.\-][\p{Lu}\p{N}]+)*)+(?![\p{L}\p{N}])/gu,
        CONTEM_DUAS_PALAVRAS_MAIUSCULAS: /\p{Lu}[\p{Lu}\p{N}\u00BA\u00B0\u00AA\/.\-]*[\t \u00A0]+(?:[\p{Lu}\p{N}\u00BA\u00B0\u00AA\/.\-]+[\t \u00A0]+)*\p{Lu}/u,
        PREFIXO_NUMERACAO_PARAGRAFO: /^\s*(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]?|[IVXLCDM]{1,7}[.)\-\u2013]|[a-zA-Z]\)|\u00A7+\s*\d*)\s*/u,
        MARCADOR_NOVO_PARAGRAFO_LINHA: /^\s*(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]\s+|[IVXLCDM]{1,7}[.)\-\u2013]\s+|[a-zA-Z]\)\s+|\u00A7+\s*\d+)/u,
        FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS: /[.;!?][\t \u00A0\r\n]+(?=(?:\d{1,3}(?:\.\d{1,3})*[.)\-\u2013]\s+|[IVXLCDM]{1,7}[.)\-\u2013]\s+|[a-zA-Z]\)\s+))/gu,
        FIM_FRASE_PARAGRAFO: /[.;!?]\s*$/,
        ABREVIACAO_FINAL_LINHA: /(?:^|[\s(])(?:arts?|fls?|p\p{L}gs?|pgs?|pp|num|n|inc|al|dr|dra|drs|rel|des|min|proc|id|cf|doc|anexo|vol|ap)\.\s*$/iu
    });

    /* ==========================================================================
     * SECAO 3.1: EXPRESSOES REGULARES CENTRALIZADAS DE AUDITORIA MATEMATICA
     * (Consumidas por copia-aviso-flutuante.js)
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
        /* Extrai Beneficio INSS acoplado a especie (ex: "31/6506589241" ou "31/650.658.924-1") */
        BENEFICIO_INSS_COM_ESPECIE: /^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i,
        /* Extrai Beneficio INSS isolado pontuado (ex: "719.657.155-0") ou rotulado com 10 digitos (ex: "NB: 6506589241", "NB 719.657.155-0") */
        BENEFICIO_INSS_ISOLADO: /^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{1,3}\.\d{3}\.\d{3}-\d)$|^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)(\d{10})$/i,
        /* Extrai PIS / PASEP / NIT isolado pontuado ou rotulado (ex: "PIS/NIT: 120.43256.72-8", "120.43256.72-8", "PIS: 12043256728") */
        PIS_ISOLADO: /^(?:(?:pis(?:\/nit|\/pasep)?|nit|pasep)\s*[:\-]?\s*)?(\d{3}\.\d{5}\.\d{2}-\d{1})(?:\s*\((?:pis|nit|pasep)\))?$|^(?:(?:pis(?:\/nit|\/pasep)?|nit|pasep)\s*[:\-]?\s*)(\d{11})(?:\s*\((?:pis|nit|pasep)\))?$/i,
        /* Extrai Linha Digitavel de Arrecadacao / Tributos (48 digitos com hifens/espacos opcionais iniciada em 8 - Seção 6.60) */
        BOLETO_ARRECADACAO_ISOLADO: /^(?:(?:boleto|guia|darf|gru|iptu|tributo)\s*[:\-]?\s*)?(8\d{10}[\-\s\u00A0]*\d[\s\u00A0]+\d{11}[\-\s\u00A0]*\d[\s\u00A0]+\d{11}[\-\s\u00A0]*\d[\s\u00A0]+\d{11}[\-\s\u00A0]*\d|8\d{47})$/iu,
        /* Extrai Linha Digitavel de Boleto Bancario tradicional (47 digitos com pontuacao padrao FEBRABAN) */
        BOLETO_BANCARIO_ISOLADO: /^(?:(?:boleto|linha|gru)\s*[:\-]?\s*)?(\d{5}\.\d{5}[\s\u00A0]+\d{5}\.\d{6}[\s\u00A0]+\d{5}\.\d{6}[\s\u00A0]+\d[\s\u00A0]+\d{14}|\d{47})$/iu,
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
    const _catMod = (typeof self !== 'undefined' && self.JusGovConstantesCatalogo) ? self.JusGovConstantesCatalogo : ((typeof require === 'function') ? (() => { try { return require('./lib-constantes-catalogo.js'); } catch (_) { return {}; } })() : {});
    const CATALOGO_PADROES_JURIDICOS = _catMod.CATALOGO_PADROES_JURIDICOS || Object.freeze([]);

    /* ==========================================================================
     * SECAO 5 & 6: LEITURA DESACOPLADA DE DADOS FORENSES E REGRAS EM JSON
     * (dados-forenses.json e regras-sistema.json carregados via JusGovCfgDefaults / preload)
     * ========================================================================== */
    const TABELAS_FORENSES_VAZIAS = Object.freeze({
        especiesInss: Object.freeze({}),
        tribunaisCnj: Object.freeze({
            RAMOS: Object.freeze({}),
            TRIBUNAIS_FEDERAIS: Object.freeze({}),
            TRIBUNAIS_TRABALHO: Object.freeze({}),
            TRIBUNAIS_ESTADUAIS_E_ELEITORAIS: Object.freeze({})
        }),
        regioesFiscaisCpf: Object.freeze({})
    });

    function obterDadosForensesDinamicos() {
        const cfgDef = raiz.JusGovCfgDefaults || (typeof window !== 'undefined' ? window.JusGovCfgDefaults : null);
        if (cfgDef && typeof cfgDef.obterDadosForenses === 'function') {
            return cfgDef.obterDadosForenses();
        }
        if (raiz.__JUSGOV_DADOS_FORENSES_JSON__ && typeof raiz.__JUSGOV_DADOS_FORENSES_JSON__ === 'object') {
            return raiz.__JUSGOV_DADOS_FORENSES_JSON__;
        }
        return TABELAS_FORENSES_VAZIAS;
    }

    function obterRegrasSistemaDinamicas() {
        const cfgDef = raiz.JusGovCfgDefaults || (typeof window !== 'undefined' ? window.JusGovCfgDefaults : null);
        if (cfgDef && typeof cfgDef.obterRegrasSistema === 'function') {
            return cfgDef.obterRegrasSistema();
        }
        if (raiz.__JUSGOV_REGRAS_SISTEMA_JSON__ && typeof raiz.__JUSGOV_REGRAS_SISTEMA_JSON__ === 'object') {
            return raiz.__JUSGOV_REGRAS_SISTEMA_JSON__;
        }
        return {};
    }

    // Dispara hidratação assíncrona imediata caso os JSONs ainda não tenham sido pré-carregados
    try {
        const cfgDefInit = raiz.JusGovCfgDefaults || (typeof window !== 'undefined' ? window.JusGovCfgDefaults : null);
        if (cfgDefInit) {
            if (typeof cfgDefInit.carregarDadosForensesJson === 'function') cfgDefInit.carregarDadosForensesJson().catch(() => { });
            if (typeof cfgDefInit.carregarRegrasSistemaJson === 'function') cfgDefInit.carregarRegrasSistemaJson().catch(() => { });
        }
    } catch (_) { }

    /* ==========================================================================
     * SECAO 7: CLASSIFICADORES LÉXICOS E ESCAPE HTML COMPARTILHADOS (DRY)
     * ========================================================================== */
    function eAlfanumericoUnicode(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) {
            return (TABELA_MASCARA_ASCII[c] & (MASCARA_CARACTERE.DIGITO | MASCARA_CARACTERE.LETRA_ASCII)) !== 0;
        }
        return EXPRESSOES_REGULARES.CHAR_ALFANUMERICO_UNICODE.test(ch);
    }

    function eEspacoBranco(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) {
            return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.ESPACO_BRANCO) !== 0;
        }
        return c === 160 || EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE.test(ch);
    }

    function eQuebraDeLinha(ch) {
        return ch === '\n' || ch === '\r';
    }

    function ePontuacaoFim(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) {
            return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.PONTUACAO_FIM) !== 0;
        }
        return c === 8212 || c === 8211 || c === 8230;
    }

    function eDelimitadorPar(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        return c < 128 && (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.DELIMITADOR_PAR) !== 0;
    }

    function eCaractereAspas(ch) {
        if (!ch) return false;
        return CARACTERES_ASPAS_TODOS.indexOf(ch) !== -1;
    }

    function eSimboloRepetivel(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) {
            return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.SIMBOLO_REPETIVEL) !== 0;
        }
        return EXPRESSOES_REGULARES.CHAR_SIMBOLO_REPETIVEL.test(ch);
    }

    function escaparTextoHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const ESTILOS_BADGE_MARCADOR_COLADO = Object.freeze([
        'sobrescrito',
        'translucido',
        'circular',
        'sobrescrito_retangular',
        'retangular_translucido',
        'retangular_compacto',
        'apenas_numeral',
        'sem_etiqueta'
    ]);

    const MODOS_AVISO_POMODORO = Object.freeze([
        'modal',
        'badge',
        'barra_descanso',
        'barra_sempre',
        'badge_e_barra_descanso',
        'completo'
    ]);

    /* Passo 6.1: Exportar o namespace imutavel JusGovConstantes com getters dinâmicos para tabelas JSON */
    const exportado = Object.freeze({
        MASCARA_CARACTERE,
        TABELA_MASCARA_ASCII,
        CONFIGURACAO_MOTOR,
        ESTILOS_BADGE_MARCADOR_COLADO,
        MODOS_AVISO_POMODORO,
        PARES_ABERTURA,
        PARES_FECHAMENTO,
        CARACTERES_ASPAS_TODOS,
        EXPRESSOES_REGULARES,
        REGEX_AUDITORIA,
        CATALOGO_PADROES_JURIDICOS,
        eAlfanumericoUnicode,
        eEspacoBranco,
        eQuebraDeLinha,
        ePontuacaoFim,
        eDelimitadorPar,
        eCaractereAspas,
        eSimboloRepetivel,
        escaparTextoHtml,
        get NIVEIS_FILTRO_HTML() {
            const rs = obterRegrasSistemaDinamicas();
            return (rs && rs.niveisFiltroHtml) ? rs.niveisFiltroHtml : {};
        },
        get TABELA_ESPECIES_INSS() {
            const df = obterDadosForensesDinamicos();
            return (df && df.especiesInss) ? df.especiesInss : TABELAS_FORENSES_VAZIAS.especiesInss;
        },
        get TABELA_TRIBUNAIS_CNJ() {
            const df = obterDadosForensesDinamicos();
            return (df && df.tribunaisCnj) ? df.tribunaisCnj : TABELAS_FORENSES_VAZIAS.tribunaisCnj;
        },
        get TABELA_REGIOES_FISCAIS_CPF() {
            const df = obterDadosForensesDinamicos();
            return (df && df.regioesFiscaisCpf) ? df.regioesFiscaisCpf : TABELAS_FORENSES_VAZIAS.regioesFiscaisCpf;
        }
    });
    raiz.JusGovConstantes = exportado;
    raiz.JusGovCopiaConstantes = exportado;
    if (typeof window !== 'undefined') {
        window.JusGovConstantes = exportado;
        window.JusGovCopiaConstantes = exportado;
    }
})(typeof self !== 'undefined' ? self : this);
