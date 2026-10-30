/* ==========================================================================
 * Nome do arquivo: modulo-SelecionarCopiar.js
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
 *    framework alvo, arquitetura em 6 estagios, isolamento DOM, protecao do V8)
 *    e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo, permitindo recriar 100% do modulo do zero
 *    caso o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como &ccedil;, &otilde;, &eacute;)
 *    no codigo ou em templates visuais; entidades HTML devem ser extirpadas,
 *    sendo admitidas exclusivamente dentro de mascaras regex ou parsers de HTML bruto.
 * 5) INTEGRIDADE FUNCIONAL E COPIA SILENCIOSA: Proibido simplificar a base de 6
 *    estagios, remover suporte a Ctrl/Alt/Shift, exibir popups de "Copiado!" em
 *    copias simples ou copiar qualquer texto dentro de campos editaveis.
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
 * 1. PROGRESSAO LOGICA EM 6 ESTAGIOS DE SELECAO INTELIGENTE:
 * - Estagio 1 (1 Clique na Palavra ou Numero -> Unidade ou Entidade Contigua):
 *   * Em texto comum, 1 clique seleciona e copia apenas a palavra clicada. A
 *     virgula "," e o ponto e virgula ";" atuam como separadores intermediarios
 *     e NUNCA colam na palavra (clicar em "Brasilia," seleciona so "Brasilia").
 *   * Em entidades contiguas e datas simples (Processos CNJ, SEI!, CPF, CNPJ
 *     tradicional e Novo CNPJ Alfanumerico, PIS, RG, CEP, Datas DD/MM/AAAA,
 *     Datas abreviadas/extenso como "17 ago. 2026" e "29 de fevereiro de 2025",
 *     Competencias Mes/Ano como "out. 26", Horarios HH:MM:SS, Percentuais "100%",
 *     E-mails, Handles @usuario, Placas Mercosul, UUID/PIX e blocos numericos
 *     pontuados como "0000.0000-0000"), 1 clique captura a entidade inteira
 *     automaticamente.
 *   * Em valores monetarios ("R$ 1.500,00"), 1 clique sobre o numero "1.500,00"
 *     seleciona apenas "1.500,00"; 1 clique sobre "R$" ou no espaco entre "R$" e
 *     "1.500,00" seleciona "R$ 1.500,00".
 *   * Em protocolos com barra de ano ("136/2025"), 1 clique em "136" seleciona
 *     "136"; 1 clique na barra "/" ou 2 cliques seleciona "136/2025".
 *   * Em sequencias numericas espacadas ("215 7014 6992 8831"), 1 clique em um
 *     numero seleciona apenas aquele numero ("6992").
 *   * Excecao de Rotulos Designadores e Conectores: 1 clique direto sobre o
 *     rotulo inicial ("id", "fls.", "pag.", "art.", "Sumula", "Portaria", "no")
 *     ou sobre conectores de intervalo ("a", "ate", "as", "c/c") captura
 *     imediatamente a referencia completa.
 *   * Excecao de Blocos em MAIUSCULAS com Quebra Suave (<br> / Shift+Enter):
 *     Se o usuario der 1 clique no espaco interno de um nome ou titulo todo em
 *     CAIXA ALTA dividido em multiplas linhas por <br>, o motor une as linhas
 *     adjacentes em maiusculas num unico bloco continuo.
 *   * Conversao Automatica de Cabecalhos de ID do PJe: Ao selecionar cabecalhos
 *     nativos do PJe no formato "Num. 2297820154 - Pag. 1", converte a saida da
 *     area de transferencia automaticamente para "id 2297820154, pg. 1".
 *
 * - Estagio 2 (1 Clique no Espaco Interno OU 2 Cliques Rapidos -> Expressao Composta ou Bloco Destacado):
 *   * Expande para toda a expressao composta: Citacoes de Legislacao e Emendas,
 *     Atos com Orgaos Compostos, Intervalos de Datas/Horas/Moedas, Datas por
 *     extenso ou abreviadas ("17 ago. 2026", "out. 26"), Numeros e Moedas com
 *     Extenso ("65 (sessenta e cinco)" e "R$ 65,00 (sessenta e cinco reais)")
 *     e Multiplos Numeros Espacados / Boletos ("215 7014 6992 8831").
 *   * Sequencia de Palavras em LETRAS MAIUSCULAS: 1 clique no espaco interno ou
 *     2 cliques seleciona todo o conjunto contiguo de palavras em CAIXA ALTA
 *     ("VARIAS PALAVRAS DO TEXTO EM LETRAS MAIUSCULAS", "REGULAR PROSSEGUIMENTO
 *     DO FEITO"), inclusive dentro de paragrafos mistos ou com quebra suave.
 *   * Sequencia de Palavras com Formatacao de Destaque: 1 clique no espaco interno
 *     ou 2 cliques seleciona todo o bloco contiguo de palavras destacadas em
 *     negrito (<b>/<strong>), italico (<i>/<em>), sublinhado (<u>/<ins>),
 *     marca-texto (<mark>), tachado (<s>/<del>), codigo (<code>) ou combinacoes.
 *
 * - Estagio 3 (2 Cliques em Texto Comum ou Pontuacao -> Frase / Clausula).
 * - Estagio 4 (Delimitadores Simetricos -> Parenteses, Colchetes, Chaves e Aspas):
 *   * 1 Clique na borda do delimitador ou no espaco interno adjacente: seleciona
 *     apenas o conteudo interno "( algo )" -> "algo".
 *   * 2 Cliques Rapidos no abre/fecha ou no espaco interno: amplia a selecao para
 *     englobar tambem os proprios delimitadores "( algo )".
 * - Estagio 5 (3 Cliques Rapidos -> Minoracao de Blocos ou Paragrafo Localizado):
 *   * Em blocos compostos ou pontuados ("12.016/2009", "136/2025", "10/01/2026",
 *     "11.222.333/0001-81", "1.325.256.019-75"), 3 cliques tendencia a MINORAR a
 *     selecao, capturando apenas a sub-parte clicada (ex: "12.016" antes da barra
 *     ou "2009" apos a barra).
 *   * No inicio de um paragrafo (numerado ou nao, ex: "3. Ordenar..."), 3 cliques
 *     seleciona exclusivamente o paragrafo localizado em questao, sem invadir
 *     paragrafos anteriores ou posteriores.
 * - Estagio 6 (Tabelas e Modo Acumulador com Ponto e Virgula ";"):
 *   * No Modo Acumulador ("Ctrl + Alt"), os avisos visuais exibem EXCLUSIVAMENTE
 *     as estatisticas (numero de intervalos, palavras/celulas/linhas e caracteres),
 *     jamais exibindo as palavras acumuladas no popup.
 *   * Padrao ("Ctrl + Alt" sem Shift): Insere em ordem crescente natural do texto,
 *     posicionando a carta ordenada antes das eventuais cartas desordenadas e apos
 *     a carta ordenada antecedente.
 *   * Modo Baralho ("Ctrl + Alt + Shift"): Insere estritamente no final da lista.
 *   * Proibida re-selecao duplicada; clicar novamente sobre selecao ja acumulada
 *     remove o item (toggle off). Clique com botao direito com "Ctrl + Alt"
 *     desfaz a ultima carta adicionada.
 *
 * 2. SELECAO ELASTICA (CTRL) E SELECAO DE OBJETOS / NOVA SELECAO (ALT):
 * - Tecla "Ctrl" (isolada): Opera em Modo Elastico, continuando, expandindo ou
 *   retraindo a selecao existente por palavras/blocos (clique ou arrasto).
 * - Tecla "Alt" (isolada): Inicia SEMPRE uma nova selecao (nao continua a selecao
 *   anterior como Ctrl):
 *   * "Alt + Clique" sobre links (<a>), botoes (<button>, <input type="button">),
 *     menus, abas ou itens clicaveis seleciona e copia imediatamente o texto
 *     inteiro do objeto (bloqueando a navegacao ou acao do botao).
 *   * "Alt + Arrastar" sobre links, botoes, menus, itens ou textos seleciona e
 *     copia apenas a parte arrastada do texto.
 *
 * 3. ESTILO SHIFT DE SELECAO E FILTRO DE DIGITOS COM ZERO-PADDING CNJ:
 * - Pressionar "Shift" exclusivamente quando ja houver selecao limpa tudo na tela
 *   para iniciar nova marcacao de cursor inicial e final.
 * - Sem selecao previa, "Shift + Clique" em texto comum posiciona o cursor inicial
 *   (sem marcar nada); o segundo "Shift + Clique" expande ate a palavra final.
 * - "Shift + Clique e Solta" sobre entidade contigua numerica/alfanumerica (CPF,
 *   CNPJ tradicional ou alfanumerico, CNJ, Telefone, Data DD/MM/AAAA, CEP) extrai
 *   apenas os caracteres puros sem pontuacao, preenchendo zeros a esquerda em
 *   processos CNJ ("991234-55.2024.4.01.4002" -> "09912345520244014002").
 *
 * 4. PROTECAO ABSOLUTA DE CAMPOS EDITAVEIS E MARCADORES DE SIMBOLOS:
 * - Em campos editaveis quaisquer (inputs simples ou editores multilinhas), NADA
 *   e copiado automaticamente para o clipboard, NUNCA, preservando o que o usuario
 *   trouxe para colar.
 * - Em editores multilinhas (textarea, contenteditable, CKEditor, ProseMirror, etc.),
 *   jamais seleciona tudo; ao clicar em sequencias de simbolos ou placeholders
 *   delimitados por simbolos ("##########", "$$$$$$$$", "@@@@", "#[digite aqui]#",
 *   "##Funcionalidade##", "@@ Qualquer coisa @@", "### Texto ##"), apenas
 *   pre-seleciona o marcador na tela sem copiar, pronto para receber Ctrl+V.
 *
 * 5. ATALHO INTELIGENTE F1 (PROMPT DE IA / PAINEL LATERAL):
 * - Com texto selecionado: formata o comando juridico estruturado, copia e solicita
 *   abertura do painel lateral ou aba do assistente de IA.
 * - Sem texto selecionado: solicita a abertura imediata do assistente de IA.
 *
 * 6. TECLA ESCAPE E REGRA DA MAOZINHA (LINKS, BOTOES E CABECALHOS DE COLUNA):
 * - Escape: Limpa selecoes visuais, acumulador e alertas logo no primeiro acionamento,
 *   mas JAMAIS zera ou altera o conteudo atual do clipboard.
 * - Regra da Maozinha (cursor: pointer), Links e Botoes: A protecao para nao copiar
 *   o texto de links (<a href>), botoes (<button>, [role="button"], [role="tab"]) ou
 *   elementos com cursor "pointer" (como cabecalhos de colunas <th>) aplica-se
 *   EXCLUSIVAMENTE ao clique simples isolado do mouse (1 clique unico, sem arrastar
 *   o mouse e sem nenhuma tecla modificadora pressionada no teclado). Caso o usuario
 *   arraste o mouse ou mantenha qualquer tecla do teclado pressionada (Ctrl, Alt,
 *   Shift, Ctrl+Alt ou qualquer outra tecla), a maozinha e ignorada e a selecao/copia
 *   (incluindo copia de coluna inteira no alto da tabela) ocorre normalmente!
 * ========================================================================== */

(function() {
    'use strict';

    /* Passo 1.1: Substituicao limpa de listeners caso o script seja reinjetado */
    if (window.__JUSGOV_ABORT_CONTROLLER__) {
        try {
            window.__JUSGOV_ABORT_CONTROLLER__.abort();
        } catch (_) {}
    }

    /* ==========================================================================
     * SECAO 1: IMPORTACAO SEGURA DE CONSTANTES E REGEXPS PRE-COMPILADAS
     * ========================================================================== */
    const C_EXT = window.JusGovConstantes || {};

    const MASCARA_CARACTERE = C_EXT.MASCARA_CARACTERE || Object.freeze({
        DIGITO: 1,
        LETRA_ASCII: 2,
        ESPACO_BRANCO: 4,
        DELIMITADOR_PAR: 8,
        DELIMITADOR_ASPAS: 16,
        PONTUACAO_FIM: 32,
        SIMBOLO_CONECTOR: 64,
        SIMBOLO_REPETIVEL: 128
    });

    const TABELA_MASCARA_ASCII = C_EXT.TABELA_MASCARA_ASCII || (() => {
        const tab = new Uint8Array(128);
        for (let i = 48; i <= 57; i++) tab[i] |= 1;
        for (let i = 65; i <= 90; i++) tab[i] |= 2;
        for (let i = 97; i <= 122; i++) tab[i] |= 2;
        [32, 9, 10, 13].forEach(c => { tab[c] |= 4; });
        ['(', ')', '[', ']', '{', '}', '<', '>'].forEach(ch => { tab[ch.charCodeAt(0)] |= 8; });
        ['"', "'"].forEach(ch => { tab[ch.charCodeAt(0)] |= 16; });
        [',', ';', '.', '!', '?'].forEach(ch => { tab[ch.charCodeAt(0)] |= 32; });
        ['/', '-', '_', '@', '+', '$', ':', '%'].forEach(ch => { tab[ch.charCodeAt(0)] |= 64; });
        ['#', '*', '=', '~', '$', '@'].forEach(ch => { tab[ch.charCodeAt(0)] |= 128; });
        return tab;
    })();

    const CONFIGURACAO_MOTOR = Object.assign({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: 3500
    }, C_EXT.CONFIGURACAO_MOTOR || {});

    const PARES_ABERTURA = C_EXT.PARES_ABERTURA || Object.freeze({ '(': ')', '[': ']', '{': '}', '<': '>' });
    const PARES_FECHAMENTO = C_EXT.PARES_FECHAMENTO || Object.freeze({ ')': '(', ']': '[', '}': '{', '>': '<' });
    const CARACTERES_ASPAS_TODOS = C_EXT.CARACTERES_ASPAS_TODOS || String.fromCharCode(34, 39, 8220, 8221, 8216, 8217, 171, 187);

    /* Consome diretamente o dicionario estatico pre-compilado em modulo-ConstantesPadroes.js */
    const EXPRESSOES_REGULARES = C_EXT.EXPRESSOES_REGULARES || {};
    const REGEX_AUDITORIA = C_EXT.REGEX_AUDITORIA || {};
    const CATALOGO_PADROES_JURIDICOS = C_EXT.CATALOGO_PADROES_JURIDICOS || [];

    const validador = window.JusGovAvisoFlutuante ? new window.JusGovAvisoFlutuante() : null;
    const acumulador = window.JusGovAcumulador ? new window.JusGovAcumulador() : null;

    /* Passo 1.2: Variaveis de controle de estado monomorficas em tempo real */
    let modoExecucao = 'global';
    let listaUrlsPermitidas = [];
    let manterFormatacaoBasica = false;
    let nivelFiltroFormatacao = 'basico';
    let selecaoEditavelAtiva = true;
    let placeholdersMinutasHtmlAtivo = true;
    let modoPlaceholdersMinutasHtml = 'placeholders';
    let colagemBotaoDireitoAtiva = false;
    let capturaBotoesMouse4e5Ativa = true;
    let colarBotaoMeioAtivo = true;
    let usarClipboardSistemaAoColar = false;
    let historicoClipboardCtrlMeioAtivo = true;
    let historicoRollbackClipboard = {
        ultimo: null,
        penultimo: null
    };
    let ultimoRollbackInsercao = {
        alvo: null,
        posicaoInicio: 0,
        comprimento: 0,
        timestamp: 0,
        nodeInserido: null
    };
    let navegacaoTecladoCamposAtiva = true;
    let ultimoTimestampNavegacaoAbas = 0;
    let botaoLateralEmProcessamento = 0;
    const DEBOUNCE_NAVEGACAO_ABAS_MS = 280;
    let timerCliqueDireitoColagem = null;
    let ultimoCliqueDireitoTimestamp = 0;
    let ultimoAlvoCliqueDireito = null;
    let validacaoMatematicaAtiva = true;
    let tempoFlashBorderMs = 500;
    let corFlashBorder = '#0d9488';
    let timerFlashBorder = null;
    let aguardandoDesselecaoFlash = false;
    let timestampCriacaoFlash = 0;
    const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 900000000;
    let converterCabecalhoPjeAtivo = true;
    let atalhoF1GeminiAtivo = true;
    let modoShiftCnj = '20digitos';
    let incluirSeparadorFinalAcumulador = true;
    let separadorTabelas = ';';
    const PROMPT_F1_GEMINI_PADRAO = "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";
    let promptF1Gemini = PROMPT_F1_GEMINI_PADRAO;
    let ativoAmpuletas = true;
    let cssBlindado = false;

    // =====================================================================
    // === INJEÇÃO CSS PJE ANTI-AMPULHETAS (MOTOR MULTI-GATILHO COM TRAVA DE RAM) ===
    // =====================================================================
    const turboCSS = `
        /* ANIQUILAÇÃO DOS LOADERS E SPINNERS
           O PORQUÊ: O PJe bloqueia a tela inteira a cada requisição AJAX.
           O 'pointer-events: none' garante que o usuário possa continuar clicando através do fantasma do spinner. */
        [id="movimentarRegion:status.stop"],
        [id="movimentarRegion:status.start"],
        [id$=":status.start"],
        [id*="mploading" i],
        [class*="mploading" i],
        [id*="mpProgresso" i],
        [id*="painelAguarde" i],
        [id*="modalAguarde" i],
        [class*="rich-mpnl-mask" i],
        ngx-loading,
        .ngx-loading-backdrop,
        .loading-foreground,
        .block-ui-wrapper,
        .block-ui-overlay,
        .p-blockui,
        .p-blockui-document,
        .p-component-overlay,
        .ui-blockui,
        .ui-widget-overlay.ui-blockui,
        .swal2-Delta-loading,
        #divInfraAviso,
        #divInfraAvisoFundo,
        .infraAviso,
        .infraAvisoFundo,
        #divCarregando,
        .blockUI.blockOverlay,
        #disabledZone,
        #messageZone,
        #divAguarde,
        #mascaraAguarde,
        #divLoading,
        .seeu-loading,
        #bloqueioTela,
        .saj-loading,
        .k-loading-mask,
        .loadmask,
        pdpj-loading,
        ngx-spinner,
        .ngx-spinner-overlay,
        .br-loading-mask,
        #div_aguarde,
        #tela_bloqueio,
        #carregando_dados,
        mat-progress-spinner,
        mat-spinner,
        mat-mdc-progress-spinner,
        mat-mdc-spinner,
        .mat-progress-spinner,
        .mat-spinner,
        .mat-mdc-progress-spinner,
        .mat-mdc-spinner,
        p-progressspinner,
        p-progressSpinner,
        .p-progress-spinner,
        .p-progress-spinner-svg,
        .p-progress-spinner-circle,
        .spinner-border,
        .spinner-grow,
        [class*="progress-spinner" i],
        [class*="progressspinner" i],
        [class*="loading-spinner" i],
        .loading-overlay,
        .loader-overlay,
        .spinner-overlay,
        .pje-loading,
        [class*="pje-loading" i],
        pdpj-spinner,
        pje-spinner,
        app-loading,
        app-spinner,
        [id*="spinner" i],
        [class*="spinner" i],
        [id*="carregando" i],
        [class*="carregando" i] {
            pointer-events: none !important;
            cursor: auto !important;
            opacity: 0.01 !important;
            z-index: -99999 !important;
        }

        /* ANIQUILAÇÃO TOTAL DE SPINNERS CIRCULARES MODERNOS (ANGULAR MATERIAL / PRIMENG / PJE 2.X / PREVJUD)
           O PORQUÊ: Loaders giratórios bloqueiam a visão e travam o foco do teclado nos modais de intimação. */
        mat-progress-spinner,
        mat-spinner,
        mat-mdc-progress-spinner,
        mat-mdc-spinner,
        .mat-progress-spinner,
        .mat-spinner,
        .mat-mdc-progress-spinner,
        .mat-mdc-spinner,
        p-progressspinner,
        p-progressSpinner,
        .p-progress-spinner,
        .p-progress-spinner-svg,
        .p-progress-spinner-circle,
        .spinner-border,
        .spinner-grow,
        [class*="progress-spinner" i],
        [class*="progressspinner" i],
        [class*="loading-spinner" i],
        .loading-spinner,
        .pje-loading,
        [class*="pje-loading" i],
        pdpj-spinner,
        pje-spinner,
        app-loading,
        app-spinner {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* ANIQUILAÇÃO GLOBAL DE TEMPO E ANIMAÇÃO
           O PORQUÊ: O framework Angular/JSF do PJe injeta atrasos artificiais (0.3s a 0.5s)
           em modais e transições para criar "suavidade". Isso destrói a produtividade de quem
           digita rápido. Esta regra força o navegador a ignorar todos os delays, fazendo a interface
           responder instantaneamente aos comandos de teclado e mouse. */
        *, *::before, *::after {
            animation-delay: 0s !important;
            transition: none !important;
            transition-delay: 0s !important;
            transition-duration: 0s !important;
        }

        /* Destravamento de cursores de espera */
        html[style*="wait" i],
        body[style*="wait" i],
        html[style*="progress" i],
        body[style*="progress" i],
        *[style*="cursor: wait" i],
        *[style*="cursor:wait" i],
        *[style*="cursor: progress" i],
        *[style*="cursor:progress" i],
        .wait-cursor,
        .busy-cursor {
            cursor: auto !important;
        }
    `;

    // FUNÇÃO: Injetar o CSS turbo de forma segura e não redundante.
    // O PORQUÊ: Ambientes de iframes duplos (comuns no PJe) podem causar injeções múltiplas do mesmo CSS,
    // o que causa vazamento de memória e lentidão de renderização (re-paint/re-flow excessivos).
    let observadorBlindagem = null;
    function garantirObservadorBlindagem() {
        if (observadorBlindagem || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
        try {
            const alvo = document.head || document.documentElement;
            if (!alvo) return;
            observadorBlindagem = new MutationObserver(() => {
                if (ativoAmpuletas && !document.getElementById('pje-turbo-lock')) {
                    cssBlindado = false;
                    blindarCSS();
                }
            });
            observadorBlindagem.observe(alvo, { childList: true });
        } catch (_) {}
    }

    function blindarCSS() {
        if (ativoAmpuletas === false) {
            const el = (typeof document !== 'undefined') ? document.getElementById('pje-turbo-lock') : null;
            if (el) el.remove();
            cssBlindado = false;
            if (observadorBlindagem) {
                try { observadorBlindagem.disconnect(); } catch (_) {}
                observadorBlindagem = null;
            }
            return;
        }

        if (typeof document === 'undefined') return;

        // Fallback no DOM: Verifica se outro script paralelo injetou a tag e se ainda está conectada.
        const tagExistente = document.getElementById('pje-turbo-lock');
        if (tagExistente && tagExistente.isConnected) {
            cssBlindado = true;
            garantirObservadorBlindagem();
            return;
        }

        // Controle Jurisdicional Flexível
        // O PORQUÊ: Limita a atuação do motor pesado apenas ao escopo do PJe, Tribunais e PREVJUD,
        // poupando processamento em abas irrelevantes abertas pelo usuário.
        let dominio = '';
        let urlCompleta = '';
        try {
            dominio = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
            urlCompleta = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href.toLowerCase() : '';
            if ((!dominio || urlCompleta === 'about:blank') && typeof window !== 'undefined' && window.top && window.top !== window) {
                dominio = (window.top.location && window.top.location.hostname) ? window.top.location.hostname.toLowerCase() : dominio;
                urlCompleta = (window.top.location && window.top.location.href) ? window.top.location.href.toLowerCase() : urlCompleta;
            }
        } catch (_) {}

        let ehPJeOuTribunal = (dominio.includes('pje') && dominio.includes('.jus.br')) ||
                              dominio.includes('.jus.br') ||
                              urlCompleta.includes('pje') ||
                              dominio.includes('eproc') ||
                              dominio.includes('projudi') ||
                              dominio.includes('prevjud') ||
                              urlCompleta.includes('prevjud') ||
                              (typeof window !== 'undefined' && window.__JUSGOV_TESTE_BLINDAR_CSS__ === true);

        // Se estiver em iframe de popup/modal e o modulo estiver ativo, garante a blindagem no subdocumento
        if (!ehPJeOuTribunal && typeof window !== 'undefined' && window.self !== window.top && ativoAmpuletas) {
            ehPJeOuTribunal = true;
        }

        if (!ehPJeOuTribunal) return;

        // Cria a folha de estilo de forma isolada.
        const style = tagExistente || document.createElement('style');
        style.id = 'pje-turbo-lock';
        style.textContent = turboCSS;

        // Injeta preferencialmente no <head> para evitar flash de conteúdo não estilizado (FOUC).
        const alvo = document.head || document.documentElement;
        if (alvo) {
            if (!style.isConnected) {
                alvo.appendChild(style);
            }
            cssBlindado = true;
            garantirObservadorBlindagem();
        }
    }

    /* Gatilho 1: Injeção imediata na carga do script (document_start) */
    blindarCSS();

    /* Gatilho 2: Injeção na conclusão do parsing da árvore DOM */
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', blindarCSS);
        } else {
            blindarCSS();
        }
    }

    /* Gatilho 3: Injeção após carga completa de sub-recursos e iframes */
    if (typeof window !== 'undefined') {
        window.addEventListener('load', blindarCSS);
    }
    let ultimoTimestampEsc = 0;
    let ultimoTextoSelecionadoLimpo = '';
    let ultimoRangeSelecionadoSimples = null;
    let coordsMouseDown = { x: 0, y: 0 };
    let houveArrastoMouse = false;
    let inputAlvoMouseDown = null;
    let inputJaEstavaSelecionadoNoMouseDown = false;
    const inputsJaSelecionadosInicialmente = new WeakSet();
    let selecaoElasticaAtivaNoClique = false;
    let rangeAncoraArrastoElastico = null;
    let pontoAncoraArrastoAlt = null;
    let ancoraCursorShift = null;
    let ignorarProximoClick = false;
    let controladorCicloVida = null;
    const teclasPressionadasAtivas = new Set();

    function temModificadorTecladoAtivo(e) {
        /* Passo 1.3: Verificar se ha qualquer modificador de teclado ativo (Ctrl, Alt,
         * Shift, Meta ou tecla modificadora mantida pressionada no teclado). */
        if (e && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)) {
            return true;
        }
        if (teclasPressionadasAtivas.has('control') ||
            teclasPressionadasAtivas.has('alt') ||
            teclasPressionadasAtivas.has('shift') ||
            teclasPressionadasAtivas.has('meta')) {
            return true;
        }
        return false;
    }

    /* ==========================================================================
     * SECAO 2: COOPERACAO COM O SCHEDULER DO CHROME E VERIFICACAO DE ESCOPO
     * ========================================================================== */
    async function cederControleAoCompositorBlink() {
        /* Passo 2.1: Ceder thread principal ao navegador antes de operacoes pesadas */
        if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function') {
            try {
                await scheduler.yield();
            } catch (_) {}
        }
    }

    function verificarUrlPermitida() {
        /* Passo 2.2: Validar se o motor esta ativo globalmente ou na lista de sites */
        if (modoExecucao === 'desligado') return false;
        if (modoExecucao === 'global') return true;

        const urlAtual = window.location.href || '';
        if (urlAtual.startsWith('chrome-extension://')) return true;
        if (!Array.isArray(listaUrlsPermitidas) || listaUrlsPermitidas.length === 0) return false;

        for (let i = 0; i < listaUrlsPermitidas.length; i++) {
            const padrao = listaUrlsPermitidas[i];
            if (!padrao || padrao === '' || padrao === '<all_urls>') continue;
            if (padrao === '*://*/*') return true;
            try {
                const regexStr = '^' + padrao.trim()
                    .replace(EXPRESSOES_REGULARES.ESCAPE_META_REGEX, '\\$&')
                    .replace(EXPRESSOES_REGULARES.CURINGA_ASTERISCO, '.*') + '$';
                if (new RegExp(regexStr, 'i').test(urlAtual)) return true;
            } catch (_) {
                continue;
            }
        }
        return false;
    }

    /*
     * FUNCAO: isElementoInterativoOuUi
     * DIRETRIZ ROOT IMUTAVEL: Preservacao Absoluta da Navegacao e Interacao Nativa Web.
     * Identifica se um elemento DOM (ou qualquer de seus ancestrais na hierarquia,
     * incluindo travessia de Shadow DOM e Hosts de Web Components) pertence a uma
     * interface interativa do navegador ou da aplicacao web.
     * Quando o usuario interage SEM teclas modificadoras ativas, o addon DEVE
     * abster-se completamente de intervir sobre elementos de interface, garantindo
     * que cliques em botoes, dropdowns (ex: seletor de modelos 'Flash' no Gemini),
     * icones (ex: microfone), menus, abas, links e controles web sejam repassados
     * 100% nativos, sem selecoes indesejadas, sem copias espurias e sem bloqueios.
     */
    function isElementoInterativoOuUi(el) {
        if (!el) return false;

        const TAGS_INTERATIVAS = new Set([
            'BUTTON', 'A', 'SELECT', 'OPTION', 'OPTGROUP', 'INPUT', 'TEXTAREA',
            'SUMMARY', 'DETAILS', 'LABEL', 'AUDIO', 'VIDEO', 'CANVAS', 'DIALOG',
            'EMBED', 'OBJECT', 'SVG', 'PATH', 'G', 'CIRCLE', 'RECT', 'POLYGON',
            'LINE', 'USE', 'SYMBOL', 'MAT-ICON', 'G-ICON', 'MD-ICON'
        ]);

        const ROLES_INTERATIVOS = new Set([
            'button', 'link', 'menu', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
            'menubar', 'tab', 'tablist', 'switch', 'combobox', 'listbox', 'option',
            'checkbox', 'radio', 'radiogroup', 'slider', 'spinbutton', 'scrollbar',
            'toolbar', 'tree', 'treeitem', 'searchbox', 'dialog', 'alertdialog'
        ]);

        const ATRIBUTOS_ESTADO_INTERATIVO = [
            'aria-haspopup', 'aria-expanded', 'aria-controls', 'aria-pressed',
            'aria-checked', 'aria-selected', 'jsaction', 'jsname', 'jscontroller',
            'data-action', 'data-toggle', 'data-bs-toggle', 'data-trigger',
            'ng-click', 'v-on:click'
        ];

        let atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        let profundidade = 0;

        while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 30) {
            profundidade++;
            if (atual.nodeType === Node.ELEMENT_NODE) {
                if (atual.hasAttribute('data-jusgov-ignore')) return true;

                const tagUpper = (atual.tagName || '').toUpperCase();

                if (TAGS_INTERATIVAS.has(tagUpper)) {
                    return true;
                }

                /* Custom Elements de UI (tags contendo hifen, ex: bard-mode-switcher, mat-icon-button) */
                if (tagUpper.indexOf('-') !== -1) {
                    const tagLower = tagUpper.toLowerCase();
                    if (
                        tagLower.indexOf('-button') !== -1 ||
                        tagLower.indexOf('-btn') !== -1 ||
                        tagLower.indexOf('-picker') !== -1 ||
                        tagLower.indexOf('-switcher') !== -1 ||
                        tagLower.indexOf('-selector') !== -1 ||
                        tagLower.indexOf('-dropdown') !== -1 ||
                        tagLower.indexOf('-toggle') !== -1 ||
                        tagLower.indexOf('-item') !== -1 ||
                        tagLower.indexOf('-icon') !== -1 ||
                        tagLower.indexOf('-toolbar') !== -1 ||
                        tagLower.indexOf('-menu') !== -1 ||
                        tagLower.indexOf('-tab') !== -1 ||
                        tagLower.startsWith('bard-') ||
                        tagLower.startsWith('mat-') ||
                        tagLower.startsWith('mdc-') ||
                        tagLower.startsWith('gws-')
                    ) {
                        return true;
                    }
                }

                const role = atual.getAttribute('role');
                if (role && ROLES_INTERATIVOS.has(role.toLowerCase())) {
                    return true;
                }

                for (let i = 0; i < ATRIBUTOS_ESTADO_INTERATIVO.length; i++) {
                    if (atual.hasAttribute(ATRIBUTOS_ESTADO_INTERATIVO[i])) {
                        return true;
                    }
                }

                if (atual.onclick || atual.hasAttribute('onclick')) {
                    return true;
                }

                /* Inspecao de Estilos Computados: cursor pointer/grab e user-select none */
                try {
                    const st = window.getComputedStyle(atual);
                    if (st) {
                        const cur = st.cursor;
                        if (cur === 'pointer' || cur === 'grab' || cur === 'grabbing') {
                            return true;
                        }
                        const us = st.userSelect || st.webkitUserSelect;
                        if (us === 'none') {
                            return true;
                        }
                    }
                } catch (_) {}
            }

            /* Subida na arvore atravessando Shadow DOM para o Host do componente */
            atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
        }

        return false;
    }

    /*
     * FUNCAO SENSORA: Sensor de Campo de Digitacao (Validador Rapido O(1))
     * O PORQUE: Permite identificar rapidamente se um elemento e um campo de digitacao
     * ativo (input de texto, data, busca, email, numero, etc. ou textarea) que nao seja
     * somente-leitura ou desabilitado, espelhando o comportamento comprovado do JusGovBR.
     */
    function isCampoDeTextoValido(target) {
        if (!target || target.nodeType !== Node.ELEMENT_NODE) return false;
        const tag = (target.tagName || '').toUpperCase();
        if (tag === 'INPUT') {
            const type = (target.getAttribute('type') || target.type || 'text').toLowerCase();
            const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
            return !tiposNaoTexto.includes(type) && !target.readOnly && !target.disabled;
        }
        if (tag === 'TEXTAREA') {
            return !target.readOnly && !target.disabled;
        }
        return false;
    }

    /*
     * FUNCAO: classificarContextoElementoAlvo
     * OBJETIVO DE RECONSTRUCAO: Distinguir com precisao cirurgica entre:
     * - 'IGNORAR': elementos do proprio plugin ou controles marcados;
     * - 'CAMPO_SIMPLES_EDITAVEL': inputs de linha unica (<input type="text">, etc.);
     * - 'EDITOR_MULTILINHA_EDITAVEL': <textarea>, contenteditable, CKEditor, ProseMirror, etc.;
     * - 'LINK_CLICAVEL': botoes, links, menus, dropdowns e controles de interface interativa;
     * - 'LEITURA_COMUM': texto estatico da pagina onde a copia automatica atua.
     */
    function classificarContextoElementoAlvo(el) {
        if (!el) return 'IGNORAR';

        /* Passo 2.3: Inspecao de campos editaveis (Inputs de texto e Textareas / Editores) */
        let atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        while (atual && atual !== document.body && atual !== document.documentElement) {
            if (atual.nodeType === Node.ELEMENT_NODE) {
                if (atual.hasAttribute('data-jusgov-ignore')) return 'IGNORAR';

                const tag = atual.tagName;
                if (tag === 'TEXTAREA') {
                    return (!atual.readOnly && !atual.disabled) ? 'EDITOR_MULTILINHA_EDITAVEL' : 'LEITURA_COMUM';
                }

                if (tag === 'INPUT') {
                    const tipoInput = (atual.getAttribute('type') || atual.type || 'text').toLowerCase();
                    const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                    if (!tiposNaoTexto.includes(tipoInput) && !atual.readOnly && !atual.disabled) {
                        return 'CAMPO_SIMPLES_EDITAVEL';
                    }
                    return 'LINK_CLICAVEL';
                }

                if (atual.isContentEditable || atual.getAttribute('contenteditable') === 'true') {
                    return 'EDITOR_MULTILINHA_EDITAVEL';
                }

                /* Se o elemento ou qualquer ancestral imediato tem contenteditable explicitamente "false",
                 * e o proprio elemento alvo nao e editavel, trata como texto comum/leitura */
                if (atual.getAttribute('contenteditable') === 'false' && !el.isContentEditable) {
                    return 'LEITURA_COMUM';
                }

                if (atual.classList && (
                    atual.classList.contains('cke_editable') ||
                    atual.classList.contains('mce-content-body') ||
                    atual.classList.contains('ql-editor') ||
                    atual.classList.contains('ProseMirror') ||
                    atual.classList.contains('CodeMirror') ||
                    atual.classList.contains('monaco-editor')
                )) {
                    /* So e classificado como editor se for de fato editavel pelo usuario.
                     * Documentos ou visualizadores com classes do CKEditor/Quill/ProseMirror
                     * mas somente-leitura pertencem estritamente a LEITURA_COMUM! */
                    if (atual.isContentEditable || (document.body && document.body.isContentEditable) || document.designMode === 'on') {
                        return 'EDITOR_MULTILINHA_EDITAVEL';
                    }
                    return 'LEITURA_COMUM';
                }

                const role = atual.getAttribute('role');
                if (role === 'textbox' || role === 'searchbox') {
                    if (atual.getAttribute('aria-readonly') === 'true' || atual.getAttribute('contenteditable') === 'false') {
                        return 'LEITURA_COMUM';
                    }
                    if (atual.isContentEditable || tag === 'TEXTAREA' || tag === 'INPUT') {
                        const ehMulti = atual.getAttribute('aria-multiline') === 'true' || tag === 'TEXTAREA';
                        return ehMulti ? 'EDITOR_MULTILINHA_EDITAVEL' : 'CAMPO_SIMPLES_EDITAVEL';
                    }
                }
            }
            atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
        }

        /* Inspecao de Editores HTML onde document.body e contenteditable (ex: iframe ativo do CKEditor/PJe) */
        if (document.body && (document.body.isContentEditable || document.designMode === 'on')) {
            return 'EDITOR_MULTILINHA_EDITAVEL';
        }

        /* Inspecao de Interface Interativa (Botoes, Dropdowns, Menus, Abas, Controles) */
        if (isElementoInterativoOuUi(el)) {
            return 'LINK_CLICAVEL';
        }

        return 'LEITURA_COMUM';
    }

    /* ==========================================================================
     * SECAO 3: CLASSIFICADORES DE CARACTERES EM TEMPO CONSTANTE O(1) (BITMASK)
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
        if (c < 128) return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.ESPACO_BRANCO) !== 0;
        return c === 160 || EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE.test(ch);
    }

    function ePontuacaoFim(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.PONTUACAO_FIM) !== 0;
        return c === 8212 || c === 8211 || c === 8230;
    }

    function eDelimitadorPar(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        return c < 128 && (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.DELIMITADOR_PAR) !== 0;
    }

    function eCaractereAspas(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128) return (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.DELIMITADOR_ASPAS) !== 0;
        return CARACTERES_ASPAS_TODOS.indexOf(ch) !== -1;
    }

    function eSimboloRepetivel(ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 128 && (TABELA_MASCARA_ASCII[c] & MASCARA_CARACTERE.SIMBOLO_REPETIVEL) !== 0) {
            return true;
        }
        return EXPRESSOES_REGULARES.CHAR_SIMBOLO_REPETIVEL.test(ch);
    }

    function eQuebraDeLinha(ch) {
        return ch === '\n' || ch === '\r';
    }

    /* ==========================================================================
     * SECAO 4: RESOLUCAO DO PONTO DE CLIQUE E EXTRACAO DE TEXTO COM JANELA O(1)
     * ========================================================================== */
    function garantirSelecaoForcadaEmElemento(alvo) {
        /* Passo 4.0: Liberar user-select: text !important em botoes, abas, links e textos
         * bloqueados quando o usuario seleciona com Alt ou Ctrl, impedindo que user-select: none
         * oculte a marcacao azul da Selection API do navegador. */
        if (!alvo || alvo.nodeType !== Node.ELEMENT_NODE) return;
        try {
            const idEstiloForcado = 'jusgov-estilo-selecao-forcada';
            if (document.head && !document.getElementById(idEstiloForcado)) {
                const st = document.createElement('style');
                st.id = idEstiloForcado;
                st.setAttribute('data-jusgov-ignore', 'true');
                st.textContent = '[data-jusgov-selecionavel="true"], [data-jusgov-selecionavel="true"] * { -webkit-user-select: text !important; user-select: text !important; -webkit-user-drag: none !important; }';
                document.head.appendChild(st);
            }
            const containerInterativo = (typeof alvo.closest === 'function')
                ? (alvo.closest('button, input[type="button"], input[type="submit"], input[type="reset"], a, summary, label, th, td, nav, header, [role="tab"], [role="button"], [role="menuitem"], [role="option"], [role="switch"], [role="link"]') || alvo)
                : alvo;
            containerInterativo.setAttribute('data-jusgov-selecionavel', 'true');
            const linkAncestral = (typeof alvo.closest === 'function') ? alvo.closest('a') : null;
            if (linkAncestral) {
                linkAncestral.setAttribute('draggable', 'false');
            }
            if (document.body) {
                document.body.setAttribute('data-jusgov-selecionavel', 'true');
            }
        } catch (_) {}
    }

    function obterObjetoInterativoParaSelecaoCompleta(alvo) {
        /* Passo 4.0.0: Identificar se o alvo clicado com Alt pertence a um objeto interativo
         * (link <a>, botao <button>/<input type="button|submit|reset">, menu, aba ou item clicavel)
         * para que Alt + Clique selecione imediatamente o texto inteiro do objeto. */
        if (!alvo) return null;
        const elBase = alvo.nodeType === Node.ELEMENT_NODE ? alvo : alvo.parentElement;
        if (!elBase || typeof elBase.closest !== 'function') return null;

        const elSemantico = elBase.closest(
            'a[href], a, button, input[type="button"], input[type="submit"], input[type="reset"], summary, [role="button"], [role="menuitem"], [role="tab"], [role="option"], [role="switch"], [role="link"], [role="treeitem"], [role="combobox"], [aria-haspopup], [aria-expanded]'
        );
        if (elSemantico) {
            return elSemantico;
        }

        const TAGS_CONTAINERS_GRANDES = new Set([
            'BODY', 'HTML', 'MAIN', 'ARTICLE', 'SECTION', 'TABLE', 'TBODY', 'THEAD', 'TR', 'UL', 'OL', 'FORM'
        ]);
        let atual = elBase;
        while (atual && atual !== document.body && atual !== document.documentElement) {
            if (!TAGS_CONTAINERS_GRANDES.has(atual.tagName)) {
                try {
                    const st = window.getComputedStyle(atual);
                    if (st && st.cursor === 'pointer') {
                        const txt = (atual.innerText || atual.textContent || '').trim();
                        if (txt.length > 0 && txt.length <= 240) {
                            return atual;
                        }
                    }
                } catch (_) {}
            }
            atual = atual.parentElement;
        }
        return null;
    }

    function localizarPontoTextoDentroDeElemento(elRaiz, x, y) {
        /* Passo 4.0.1: Resolver com exatidao o TextNode e o offset do caractere sob (x, y)
         * mesmo dentro de controles encapsulados como <button>, <summary> ou abas onde
         * caretRangeFromPoint retorna apenas o ELEMENT_NODE pai. */
        if (!elRaiz) return null;
        const walker = document.createTreeWalker(elRaiz, NodeFilter.SHOW_TEXT, null);
        let melhorNo = null;
        let melhorOffset = 0;
        let menorDist = Infinity;
        let n;
        const r = document.createRange();

        while ((n = walker.nextNode())) {
            const txt = n.nodeValue || '';
            const len = txt.length;
            if (len === 0) continue;

            for (let i = 0; i < len; i++) {
                try {
                    r.setStart(n, i);
                    r.setEnd(n, i + 1);
                    const rect = r.getBoundingClientRect();
                    if (!rect || (rect.width === 0 && rect.height === 0)) continue;

                    const dx = x < rect.left ? (rect.left - x) : (x > rect.right ? (x - rect.right) : 0);
                    const dy = y < rect.top ? (rect.top - y) : (y > rect.bottom ? (y - rect.bottom) : 0);
                    const dist = dx + dy * 2;
                    if (dist < menorDist) {
                        menorDist = dist;
                        melhorNo = n;
                        melhorOffset = i;
                        if (dx === 0 && dy === 0) {
                            return { no: melhorNo, offset: melhorOffset };
                        }
                    }
                } catch (_) {}
            }
        }

        if (melhorNo && menorDist <= 48) {
            return { no: melhorNo, offset: melhorOffset };
        }
        return null;
    }

    function obterPontoDoClique(x, y) {
        /* Passo 4.1: Localizar o TextNode e o offset exato sob as coordenadas (x, y) */
        const elSobPonto = (typeof document.elementFromPoint === 'function')
            ? document.elementFromPoint(x, y)
            : null;
        const containerBotaoOuAba = (elSobPonto && typeof elSobPonto.closest === 'function')
            ? elSobPonto.closest('button, summary, [role="tab"], [role="button"]')
            : null;
        if (containerBotaoOuAba) {
            const ptBotao = localizarPontoTextoDentroDeElemento(containerBotaoOuAba, x, y);
            if (ptBotao) return ptBotao;
        }

        let no = null;
        let offset = 0;

        if (typeof document.caretRangeFromPoint === 'function') {
            const r = document.caretRangeFromPoint(x, y);
            if (r) {
                no = r.startContainer;
                offset = r.startOffset;
            }
        } else if (typeof document.caretPositionFromPoint === 'function') {
            const pos = document.caretPositionFromPoint(x, y);
            if (pos) {
                no = pos.offsetNode;
                offset = pos.offset;
            }
        }

        if (!no) return null;

        if (no.nodeType === Node.ELEMENT_NODE) {
            const ptInterno = localizarPontoTextoDentroDeElemento(elSobPonto || no, x, y);
            if (ptInterno) return ptInterno;

            const filhos = no.childNodes;
            if (offset < filhos.length && filhos[offset].nodeType === Node.TEXT_NODE) {
                no = filhos[offset];
                offset = 0;
            } else if (offset > 0 && filhos[offset - 1].nodeType === Node.TEXT_NODE) {
                no = filhos[offset - 1];
                offset = no.textContent.length;
            } else {
                return null;
            }
        }

        if (no.nodeType !== Node.TEXT_NODE) return null;
        const tamanhoTexto = no.textContent.length;
        if (tamanhoTexto === 0) return null;

        /* Passo 4.2: Descartar cliques distantes em margens vazias fora da caixa do glifo */
        try {
            const rangeTeste = document.createRange();
            const idxInicio = offset < tamanhoTexto ? offset : Math.max(0, tamanhoTexto - 1);
            const idxFim = Math.min(tamanhoTexto, idxInicio + 1);
            rangeTeste.setStart(no, idxInicio);
            rangeTeste.setEnd(no, idxFim);
            const rect = rangeTeste.getBoundingClientRect();

            if (rect && (rect.width > 0 || rect.height > 0)) {
                const distX = x < rect.left ? (rect.left - x) : (x > rect.right ? (x - rect.right) : 0);
                const distY = y < rect.top ? (rect.top - y) : (y > rect.bottom ? (y - rect.bottom) : 0);
                if (distX > 36 || distY > 22) {
                    return null;
                }
                if (x > rect.right && offset < tamanhoTexto) {
                    offset++;
                } else if (x < rect.left && offset > 0) {
                    /* Quando o clique ocorre na metade direita de um caractere (ex: no espaco ' '
                     * imediatamente antes de '(' em "R$ 65,00 (sessenta e cinco reais)"),
                     * caretRangeFromPoint arredonda o offset para a fronteira seguinte ('(').
                     * Se a coordenada X real do mouse estiver a esquerda de rect.left e dentro da
                     * caixa do caractere anterior (offset - 1), recuamos o offset para apontar
                     * exatamente para o caractere sob o ponteiro do mouse. */
                    const rangeAnt = document.createRange();
                    rangeAnt.setStart(no, offset - 1);
                    rangeAnt.setEnd(no, offset);
                    const rectAnt = rangeAnt.getBoundingClientRect();
                    if (rectAnt && x >= rectAnt.left && x <= rectAnt.right &&
                        y >= (rectAnt.top - 6) && y <= (rectAnt.bottom + 6)) {
                        offset--;
                    }
                }
            }
        } catch (_) {}

        return { no, offset };
    }

    function obterBlocoAncestralContextual(no) {
        let atual = no.nodeType === Node.ELEMENT_NODE ? no : no.parentElement;
        const TAGS_BLOCO = new Set([
            'P', 'DIV', 'TD', 'TH', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'PRE',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION', 'HEADER', 'FOOTER', 'DD', 'DT', 'TR',
            'BUTTON', 'SUMMARY', 'LABEL', 'NAV', 'MAIN', 'ASIDE'
        ]);

        while (atual && atual !== document.body && atual !== document.documentElement) {
            if (TAGS_BLOCO.has(atual.tagName)) {
                return atual;
            }
            atual = atual.parentElement;
        }
        return document.body;
    }

    function construirMapaTextoBlocoComJanela(noAlvo, offsetNoAlvo) {
        /* Passo 4.3: Construir mapa linearizado com janela deslizante O(1) de +-1000 caracteres */
        const bloco = obterBlocoAncestralContextual(noAlvo);
        const segmentos = [];
        let textoCompleto = '';
        let indiceGlobalClique = -1;
        const TAGS_SUBBLOCO_QUEBRA = new Set([
            'P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'BLOCKQUOTE', 'PRE', 'TR', 'HR', 'SECTION', 'ARTICLE', 'DD', 'DT'
        ]);

        const adicionarSeparadorVirtual = (strSep, elRef) => {
            if (!strSep) return;
            const iniSep = textoCompleto.length;
            textoCompleto += strSep;
            segmentos.push({
                no: null,
                ehBr: true,
                elementoBr: elRef || null,
                inicioGlobal: iniSep,
                fimGlobal: iniSep + strSep.length,
                comprimento: strSep.length
            });
        };

        const walker = document.createTreeWalker(
            bloco,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
                acceptNode(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName;
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.hasAttribute && node.hasAttribute('data-jusgov-ignore')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (tag === 'BR') {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        if (node !== bloco && TAGS_SUBBLOCO_QUEBRA.has(tag)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let n;
        let ultimoTopSpanPosicionado = null;
        let ultimaAlturaSpanPosicionado = 16;

        while ((n = walker.nextNode())) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                if (n.tagName === 'BR') {
                    adicionarSeparadorVirtual('\n', n);
                } else if (n !== bloco && TAGS_SUBBLOCO_QUEBRA.has(n.tagName)) {
                    if (textoCompleto.length > 0 && !textoCompleto.endsWith('\n\n')) {
                        adicionarSeparadorVirtual(textoCompleto.endsWith('\n') ? '\n' : '\n\n', n);
                    }
                }
                continue;
            }

            const valor = n.nodeValue || '';
            if (valor.length === 0) continue;

            /* Deteccao de mudanca de linha ou salto de paragrafo vertical em camadas PDF.js (textLayer) */
            const elPai = n.parentElement;
            if (elPai && elPai !== bloco && elPai.style && elPai.style.top) {
                const topAtual = parseFloat(elPai.style.top);
                const fontAtual = parseFloat(elPai.style.fontSize) || ultimaAlturaSpanPosicionado;
                if (!Number.isNaN(topAtual)) {
                    if (ultimoTopSpanPosicionado !== null && valor.trim().length > 0) {
                        const deltaTop = Math.abs(topAtual - ultimoTopSpanPosicionado);
                        if (deltaTop > Math.max(24, fontAtual * 1.68)) {
                            if (textoCompleto.length > 0 && !textoCompleto.endsWith('\n\n')) {
                                adicionarSeparadorVirtual(textoCompleto.endsWith('\n') ? '\n' : '\n\n', elPai);
                            }
                        } else if (deltaTop > 3) {
                            const ultimoCh = textoCompleto.length > 0 ? textoCompleto[textoCompleto.length - 1] : '';
                            if (ultimoCh && !eEspacoBranco(ultimoCh) && !eQuebraDeLinha(ultimoCh) && !eEspacoBranco(valor[0])) {
                                adicionarSeparadorVirtual(' ', elPai);
                            }
                        }
                    }
                    if (valor.trim().length > 0) {
                        ultimoTopSpanPosicionado = topAtual;
                        ultimaAlturaSpanPosicionado = fontAtual;
                    }
                }
            }

            const inicioSeg = textoCompleto.length;
            const fimSeg = inicioSeg + valor.length;

            if (n === noAlvo) {
                indiceGlobalClique = inicioSeg + Math.min(offsetNoAlvo, valor.length);
            }

            segmentos.push({
                no: n,
                ehBr: false,
                inicioGlobal: inicioSeg,
                fimGlobal: fimSeg,
                comprimento: valor.length
            });
            textoCompleto += valor;
        }

        if (indiceGlobalClique === -1 || textoCompleto.length === 0) {
            return null;
        }

        const raio = CONFIGURACAO_MOTOR.RAIO_JANELA_DESLIZANTE;
        let deslocamentoJanela = 0;
        let textoJanela = textoCompleto;

        if (textoCompleto.length > CONFIGURACAO_MOTOR.LIMITE_CARACTERES_JANELA_MINIMA) {
            const iniJanela = Math.max(0, indiceGlobalClique - raio);
            const fimJanela = Math.min(textoCompleto.length, indiceGlobalClique + raio);
            deslocamentoJanela = iniJanela;
            textoJanela = textoCompleto.substring(iniJanela, fimJanela);
        }

        return {
            bloco,
            texto: textoJanela,
            idxCursor: indiceGlobalClique - deslocamentoJanela,
            deslocamentoJanela,
            segmentos,
            tamanhoTotalBloco: textoCompleto.length
        };
    }

    function obterPontoDOMNoMapa(mapa, indiceLocal) {
        if (!mapa) return null;
        const indiceGlobal = Math.max(0, Math.min(mapa.tamanhoTotalBloco, indiceLocal + mapa.deslocamentoJanela));

        for (let i = 0; i < mapa.segmentos.length; i++) {
            const seg = mapa.segmentos[i];
            if (seg.ehBr) continue;
            if (indiceGlobal >= seg.inicioGlobal && indiceGlobal <= seg.fimGlobal) {
                return { no: seg.no, offset: indiceGlobal - seg.inicioGlobal };
            }
        }
        return null;
    }

    function criarRangeDOMAPartirDeIndices(mapa, inicioLocal, fimLocal) {
        if (!mapa || inicioLocal >= fimLocal) return null;

        let iniLimpo = inicioLocal;
        let fimLimpo = fimLocal;
        if (typeof mapa.texto === 'string') {
            while (iniLimpo < fimLimpo && (eEspacoBranco(mapa.texto[iniLimpo]) || eQuebraDeLinha(mapa.texto[iniLimpo]))) {
                iniLimpo++;
            }
            while (fimLimpo > iniLimpo && (eEspacoBranco(mapa.texto[fimLimpo - 1]) || eQuebraDeLinha(mapa.texto[fimLimpo - 1]))) {
                fimLimpo--;
            }
        }
        if (iniLimpo >= fimLimpo) return null;

        const inicioGlobal = Math.max(0, iniLimpo + mapa.deslocamentoJanela);
        const fimGlobal = Math.min(mapa.tamanhoTotalBloco, fimLimpo + mapa.deslocamentoJanela);
        if (inicioGlobal >= fimGlobal) return null;

        let noIni = null, offIni = 0;
        let noFim = null, offFim = 0;

        for (let i = 0; i < mapa.segmentos.length; i++) {
            const seg = mapa.segmentos[i];
            if (seg.ehBr) continue;

            if (!noIni && inicioGlobal >= seg.inicioGlobal && inicioGlobal <= seg.fimGlobal) {
                if (inicioGlobal < seg.fimGlobal || i === mapa.segmentos.length - 1) {
                    noIni = seg.no;
                    offIni = inicioGlobal - seg.inicioGlobal;
                }
            }

            if (!noFim && fimGlobal >= seg.inicioGlobal && fimGlobal <= seg.fimGlobal) {
                if (fimGlobal > seg.inicioGlobal || i === 0) {
                    noFim = seg.no;
                    offFim = fimGlobal - seg.inicioGlobal;
                    break;
                }
            }
        }

        if (!noIni) {
            for (let i = 0; i < mapa.segmentos.length; i++) {
                const seg = mapa.segmentos[i];
                if (!seg.ehBr && seg.fimGlobal > inicioGlobal) {
                    noIni = seg.no;
                    offIni = Math.max(0, inicioGlobal - seg.inicioGlobal);
                    break;
                }
            }
        }
        if (!noFim) {
            for (let i = mapa.segmentos.length - 1; i >= 0; i--) {
                const seg = mapa.segmentos[i];
                if (!seg.ehBr && seg.inicioGlobal < fimGlobal) {
                    noFim = seg.no;
                    offFim = Math.min(seg.comprimento, fimGlobal - seg.inicioGlobal);
                    break;
                }
            }
        }

        if (!noIni || !noFim) return null;

        try {
            const range = document.createRange();
            range.setStart(noIni, offIni);
            range.setEnd(noFim, offFim);
            return range;
        } catch (_) {
            return null;
        }
    }

    /* ==========================================================================
     * SECAO 5: ARQUITETURA DE FILTRAGEM PROGRESSIVA (3 FILTROS: DADOS, ESTRUTURA, INFORMACOES)
     *          E GRAVACAO NO CLIPBOARD COM CASCATA TRY/CATCH
     * ========================================================================== */

    /*
     * FILTRO 1: DADOS (Higienizacao Inicial de Caracteres e Anti-Lixo PDF)
     * Remove caracteres zero-width (\u200B-\u200D, \uFEFF, \u2060), soft-hyphens (\u00AD),
     * caracteres de controle ASCII estranhos (< 32 exceto \r, \n, \t) e normaliza espacos
     * nao-quebraveis (\u00A0, &nbsp;) para espaco comum ' '.
     */
    function aplicarFiltro1DadosLixo(textoBruto) {
        if (!textoBruto || typeof textoBruto !== 'string') return '';
        const rxLixo = (typeof EXPRESSOES_REGULARES !== 'undefined' && EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF)
            ? EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF
            : /[\u200B-\u200D\uFEFF\u2060\u00AD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
        return textoBruto
            .replace(rxLixo, '')
            .replace(/\u00A0/g, ' ')
            .replace(/&nbsp;/gi, ' ');
    }

    /*
     * FILTRO 3: INFORMACOES (Normalizacao de Linhas, Espacos e Supressao de Linhas em Branco)
     * - Preserva estritamente novas linhas reais (\n) entre linhas de conteudo.
     * - Suprime linhas em branco (seja via paragrafo, br ou quebras consecutivas).
     * - Remove espacos em branco/tabs no inicio e no fim de cada linha (trim por linha).
     * - Reduz espacos horizontais duplicados indefinidamente no interior da linha para um unico espaco,
     *   corrigindo tabulacoes incorretas manuais.
     * - Em blocos de linha unica, aplica conversao de cabecalhos do PJe e remocao de pontuacao de borda.
     */
    function aplicarFiltro3InformacoesELinhas(textoBruto) {
        if (!textoBruto || typeof textoBruto !== 'string') return '';

        const normalizado = textoBruto
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        const linhasBrutas = normalizado.split('\n');
        const linhasUteis = [];

        for (let i = 0; i < linhasBrutas.length; i++) {
            let linha = linhasBrutas[i]
                .replace(/^[ \t]+|[ \t]+$/g, '')
                .replace(/[ \t]{2,}/g, ' ');

            if (linha.length > 0) {
                linhasUteis.push(linha);
            }
        }

        let resultado = linhasUteis.join('\n');

        if (linhasUteis.length === 1) {
            if (converterCabecalhoPjeAtivo && typeof EXPRESSOES_REGULARES !== 'undefined' && EXPRESSOES_REGULARES.CABECALHO_ID_PJE) {
                const matchCabecalhoPje = resultado.match(EXPRESSOES_REGULARES.CABECALHO_ID_PJE);
                if (matchCabecalhoPje) {
                    const idDoc = matchCabecalhoPje[1];
                    const pgDoc = matchCabecalhoPje[2];
                    return pgDoc ? `id ${idDoc}, pg. ${pgDoc}` : `id ${idDoc}`;
                }
            }

            if (resultado.length > 1 && typeof EXPRESSOES_REGULARES !== 'undefined' &&
                EXPRESSOES_REGULARES.SUFIXO_FECHAMENTO_PRESERVADO &&
                !EXPRESSOES_REGULARES.SUFIXO_FECHAMENTO_PRESERVADO.test(resultado) &&
                EXPRESSOES_REGULARES.PONTUACAO_BORDA_EXTERNA) {
                resultado = resultado.replace(EXPRESSOES_REGULARES.PONTUACAO_BORDA_EXTERNA, '').trim();
            }
        }

        return resultado;
    }

    function higienizarTextoParaCopia(textoBruto) {
        if (!textoBruto || typeof textoBruto !== 'string') return '';
        let limpo = aplicarFiltro1DadosLixo(textoBruto);
        if (limpo.indexOf('<') !== -1 && limpo.indexOf('>') !== -1) {
            limpo = extrairTextoPuroSanitizado(limpo);
        }
        return aplicarFiltro3InformacoesELinhas(limpo);
    }

    function escaparTextoHtmlBasico(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function obterAncestralBlocoLinhaFormatacao(elInicial) {
        let atual = elInicial;
        while (atual && atual !== document.body && atual !== document.documentElement) {
            if (atual.nodeType === Node.ELEMENT_NODE) {
                const tag = atual.tagName ? atual.tagName.toUpperCase() : '';
                if (
                    tag === 'DIV' || tag === 'P' || tag === 'LI' || tag === 'TR' ||
                    tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' ||
                    tag === 'H5' || tag === 'H6' || tag === 'BLOCKQUOTE' ||
                    tag === 'SECTION' || tag === 'ARTICLE' || tag === 'PRE'
                ) {
                    return atual;
                }
                if (atual.isConnected && typeof window.getComputedStyle === 'function') {
                    try {
                        const disp = window.getComputedStyle(atual).display;
                        if (disp === 'block' || disp === 'flex' || disp === 'grid' || disp === 'list-item' || disp === 'table-row') {
                            return atual;
                        }
                    } catch (_) {}
                }
            }
            atual = atual.parentElement;
        }
        return document.body || elInicial;
    }

    function extrairFormatosBasicosDoElementoVivo(elInicial) {
        let b = false, i = false, u = false, s = false, sup = false, sub = false;
        let atual = elInicial;
        while (atual && atual !== document.body && atual !== document.documentElement) {
            if (atual.nodeType === Node.ELEMENT_NODE) {
                const tag = atual.tagName ? atual.tagName.toUpperCase() : '';
                const st = (atual.getAttribute && atual.getAttribute('style') ? atual.getAttribute('style') : '').toLowerCase();

                if (
                    tag === 'B' || tag === 'STRONG' ||
                    tag === 'H1' || tag === 'H2' || tag === 'H3' ||
                    tag === 'H4' || tag === 'H5' || tag === 'H6' || tag === 'TH' ||
                    EXPRESSOES_REGULARES.ESTILO_NEGRITO_CSS.test(st)
                ) {
                    b = true;
                }
                if (
                    tag === 'I' || tag === 'EM' || tag === 'DFN' || tag === 'CITE' || tag === 'VAR' ||
                    EXPRESSOES_REGULARES.ESTILO_ITALICO_CSS.test(st)
                ) {
                    i = true;
                }
                if (tag === 'U' || tag === 'INS' || EXPRESSOES_REGULARES.ESTILO_SUBLINHADO_CSS.test(st)) {
                    u = true;
                }
                if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || st.indexOf('line-through') !== -1) {
                    s = true;
                }
                if (tag === 'SUP' || st.indexOf('vertical-align:super') !== -1 || st.indexOf('vertical-align: super') !== -1) {
                    sup = true;
                }
                if (tag === 'SUB' || st.indexOf('vertical-align:sub') !== -1 || st.indexOf('vertical-align: sub') !== -1) {
                    sub = true;
                }

                if (atual.isConnected && typeof window.getComputedStyle === 'function') {
                    try {
                        const comp = window.getComputedStyle(atual);
                        if (comp) {
                            const peso = parseInt(comp.fontWeight, 10) ||
                                (comp.fontWeight === 'bold' || comp.fontWeight === 'bolder' ? 700 : 400);
                            if (peso >= 600) b = true;
                            if (comp.fontStyle === 'italic' || comp.fontStyle === 'oblique') i = true;
                            const dec = (comp.textDecorationLine || comp.textDecoration || '').toLowerCase();
                            if (dec.indexOf('underline') !== -1) u = true;
                            if (dec.indexOf('line-through') !== -1) s = true;
                        }
                    } catch (_) {}
                }
            }
            atual = atual.parentElement;
        }
        return { b, i, u, s, sup, sub };
    }

    function construirHtmlFormatacaoBasica(rangeDOM) {
        /* Passo 5.2: Preservar EXCLUSIVAMENTE os 5 formatos basicos (<b>, <i>, <u>, <s>, <mark>) e quebras de linha (<br>)
         * inspecionando os nos vivos do DOM (incluindo multiplas linhas e classes CSS como font-weight: 600),
         * descartando tamanhos de fonte, familias tipograficas, cores de texto, <code>, <span>, etc. */
        if (!rangeDOM) {
            return '';
        }

        try {
            const raiz = rangeDOM.commonAncestorContainer;
            if (!raiz) return '';

            const linhasSegmentos = [[]];
            let ultimoBlocoLinha = null;
            let quebraLinhaPendente = false;

            const adicionarTrechoTexto = (noTexto, textoTrecho) => {
                if (!textoTrecho) return;
                const limpo = textoTrecho
                    .replace(EXPRESSOES_REGULARES.INVISIVEIS_ZERO_WIDTH, '')
                    .replace(EXPRESSOES_REGULARES.ESPACO_NAO_QUEBRAVEL, ' ');
                if (!limpo) return;

                /* Ignorar nos de indentacao entre blocos HTML (apenas espacos contendo \r ou \n) */
                if (limpo.trim().length === 0 && (limpo.indexOf('\n') !== -1 || limpo.indexOf('\r') !== -1)) {
                    return;
                }

                const elPai = noTexto.parentElement;
                if (elPai) {
                    const tagPai = elPai.tagName ? elPai.tagName.toUpperCase() : '';
                    if (tagPai === 'SCRIPT' || tagPai === 'STYLE' || tagPai === 'NOSCRIPT') {
                        return;
                    }
                }

                const blocoAtual = obterAncestralBlocoLinhaFormatacao(elPai);
                if (ultimoBlocoLinha !== null && blocoAtual !== ultimoBlocoLinha) {
                    quebraLinhaPendente = true;
                }
                if (quebraLinhaPendente) {
                    if (linhasSegmentos[linhasSegmentos.length - 1].length > 0) {
                        linhasSegmentos.push([]);
                    }
                    quebraLinhaPendente = false;
                }
                if (limpo.trim().length > 0) {
                    ultimoBlocoLinha = blocoAtual;
                }

                const textoNormalizado = limpo
                    .replace(EXPRESSOES_REGULARES.QUEBRAS_E_TABS, ' ')
                    .replace(EXPRESSOES_REGULARES.ESPACOS_MULTIPLOS, ' ');
                if (!textoNormalizado) return;

                const fmt = extrairFormatosBasicosDoElementoVivo(elPai);
                const linhaAtual = linhasSegmentos[linhasSegmentos.length - 1];
                const ultimoSeg = linhaAtual.length > 0 ? linhaAtual[linhaAtual.length - 1] : null;

                if (
                    ultimoSeg &&
                    ultimoSeg.b === fmt.b &&
                    ultimoSeg.i === fmt.i &&
                    ultimoSeg.u === fmt.u &&
                    ultimoSeg.s === fmt.s &&
                    ultimoSeg.sup === fmt.sup &&
                    ultimoSeg.sub === fmt.sub
                ) {
                    ultimoSeg.texto += textoNormalizado;
                } else {
                    linhaAtual.push({
                        texto: textoNormalizado,
                        b: fmt.b,
                        i: fmt.i,
                        u: fmt.u,
                        s: fmt.s,
                        sup: fmt.sup,
                        sub: fmt.sub
                    });
                }
            };

            if (raiz.nodeType === Node.TEXT_NODE) {
                const ini = rangeDOM.startOffset;
                const fim = rangeDOM.endOffset;
                const val = (raiz.nodeValue || '').substring(ini, fim);
                adicionarTrechoTexto(raiz, val);
            } else {
                const walker = document.createTreeWalker(
                    raiz,
                    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                    null
                );
                let noAtual = walker.nextNode();
                while (noAtual) {
                    let intersecta = true;
                    if (typeof rangeDOM.intersectsNode === 'function') {
                        try { intersecta = rangeDOM.intersectsNode(noAtual); } catch (_) { intersecta = true; }
                    }
                    if (intersecta) {
                        if (noAtual.nodeType === Node.ELEMENT_NODE) {
                            const tName = noAtual.tagName ? noAtual.tagName.toUpperCase() : '';
                            if (tName === 'BR') {
                                quebraLinhaPendente = true;
                            }
                        } else if (noAtual.nodeType === Node.TEXT_NODE) {
                            const valBruto = noAtual.nodeValue || '';
                            const ini = (noAtual === rangeDOM.startContainer) ? rangeDOM.startOffset : 0;
                            const fim = (noAtual === rangeDOM.endContainer) ? rangeDOM.endOffset : valBruto.length;
                            if (fim > ini) {
                                adicionarTrechoTexto(noAtual, valBruto.substring(ini, fim));
                            }
                        }
                    }
                    noAtual = walker.nextNode();
                }
            }

            const linhasHtml = [];
            for (let l = 0; l < linhasSegmentos.length; l++) {
                const segs = linhasSegmentos[l];
                if (!segs || segs.length === 0) continue;

                /* Aparar espacos nas bordas inicial e final da linha preservando as tags */
                segs[0].texto = segs[0].texto.replace(/^\s+/, '');
                segs[segs.length - 1].texto = segs[segs.length - 1].texto.replace(/\s+$/, '');

                let htmlLinha = '';
                for (let sIdx = 0; sIdx < segs.length; sIdx++) {
                    const seg = segs[sIdx];
                    if (!seg.texto) continue;
                    let trechoHtml = escaparTextoHtmlBasico(seg.texto);
                    if (seg.sub) trechoHtml = `<sub>${trechoHtml}</sub>`;
                    if (seg.sup) trechoHtml = `<sup>${trechoHtml}</sup>`;
                    if (seg.s) trechoHtml = `<s>${trechoHtml}</s>`;
                    if (seg.u) trechoHtml = `<u>${trechoHtml}</u>`;
                    if (seg.i) trechoHtml = `<i>${trechoHtml}</i>`;
                    if (seg.b) trechoHtml = `<b>${trechoHtml}</b>`;
                    htmlLinha += trechoHtml;
                }
                htmlLinha = htmlLinha.replace(EXPRESSOES_REGULARES.ESPACOS_MULTIPLOS, ' ').trim();
                if (htmlLinha) {
                    linhasHtml.push(htmlLinha);
                }
            }

            return linhasHtml.join('<br>');
        } catch (err) {
            console.error('Erro ao construir HTML de formatacao basica:', err);
            return '';
        }
    }

    /*
     * FUNCAO: extrairTextoPuroSanitizado
     * REFERENCIA: Nivel 0 da Arquitetura Progressiva de Filtros HTML.
     * ESCOPO: Remove 100% das tags HTML/XML, converte entidades (&nbsp; -> espaco,
     * &amp; -> &, &lt; -> <, &gt; -> >), normaliza quebras de linha (\r\n -> \n)
     * e sanitiza ativamente extraindo conteudo exclusivamente via no de texto DOM
     * (node.textContent), evitando injecao de tags orfas ou caracteres invisiveis.
     * ALVO: input, textarea, logs, variaveis de busca, campos legados sem markup.
     */
    function extrairTextoPuroSanitizado(origem) {
        if (!origem) return '';
        try {
            const container = document.createElement('div');
            if (typeof origem === 'string') {
                container.innerHTML = origem;
            } else if (origem instanceof Range) {
                const frag = origem.cloneContents();
                if (frag) container.appendChild(frag);
            } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                container.appendChild(origem.cloneNode(true));
            } else {
                return aplicarFiltro3InformacoesELinhas(aplicarFiltro1DadosLixo(String(origem || '')));
            }

            /* Passo 0.1: Eliminar scripts, estilos, iframes e nos perigosos/invisiveis */
            const nosPerigosos = container.querySelectorAll(
                'script, style, iframe, object, embed, applet, noscript, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore]'
            );
            for (let i = 0; i < nosPerigosos.length; i++) {
                nosPerigosos[i].remove();
            }

            /* Passo 0.2: Inserir quebras de linha explicitas para elementos de bloco e quebras */
            const quebras = container.querySelectorAll('br, hr');
            for (let i = 0; i < quebras.length; i++) {
                quebras[i].replaceWith(document.createTextNode('\n'));
            }
            const celulas = container.querySelectorAll('td, th');
            for (let i = 0; i < celulas.length; i++) {
                celulas[i].appendChild(document.createTextNode('\t'));
            }
            const blocos = container.querySelectorAll('p, div, tr, li, h1, h2, h3, h4, h5, h6, blockquote, pre, header, footer, section, article');
            for (let i = 0; i < blocos.length; i++) {
                blocos[i].appendChild(document.createTextNode('\n'));
            }

            /* Passo 0.3: Sanitizacao ativa via node.textContent */
            let texto = container.textContent || '';

            /* Passo 0.4: Converter entidades restantes */
            texto = texto
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/&quot;/gi, '"')
                .replace(/&#39;/g, "'");

            /* Passo 0.5: Executar Filtro 1 (Dados) e Filtro 3 (Informacoes e Linhas) */
            texto = aplicarFiltro1DadosLixo(texto);
            texto = aplicarFiltro3InformacoesELinhas(texto);

            return texto;
        } catch (err) {
            console.error('Erro em extrairTextoPuroSanitizado:', err);
            return typeof origem === 'string' ? aplicarFiltro3InformacoesELinhas(aplicarFiltro1DadosLixo(origem.replace(/<[^>]+>/g, ''))) : '';
        }
    }

    /*
     * FUNCAO: limparPropriedadesWordEMso
     * OBJETIVO DE RECONSTRUCAO: Higienizar strings HTML removendo sujeiras proprietarias
     * do Microsoft Word (comentarios XML/MSO, tags <o:p>, <xml>, etc.) e estilos
     * proprietarios "mso-*", garantindo compatibilidade plena com editores web.
     */
    function limparPropriedadesWordEMso(htmlBruto) {
        if (!htmlBruto || typeof htmlBruto !== 'string') return '';
        return htmlBruto
            .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
            .replace(/<\/?(?:o|v|w|m|x):[^>]*>/gi, '')
            .replace(/\s*mso-[a-zA-Z0-9\-]+:[^;"]+;?/gi, '')
            .replace(/style="\s*"/gi, '');
    }

    /*
     * FUNCAO: sanitizarEstilosCssSempreSemFonte
     * OBJETIVO DE RECONSTRUCAO: Filtrar estilos CSS inline para SEMPRE descartar
     * familias tipograficas (font-family), tamanhos de fonte (font-size), fundos (background)
     * e propriedades proprietarias (mso-*), permitindo que o texto colado herde a tipografia
     * nativa do documento de destino, preservando apenas regras permitidas pelo nivel ativo.
     */
    function sanitizarEstilosCssSempreSemFonte(styleStr, nivel = 3) {
        if (!styleStr || typeof styleStr !== 'string') return '';
        const regras = styleStr.split(';');
        const permitidas = [];
        const nivelNum = (typeof nivel === 'number') ? nivel : converterNivelFiltroParaIndice(nivel);

        for (let i = 0; i < regras.length; i++) {
            const regra = regras[i].trim();
            if (!regra || regra.indexOf(':') === -1) continue;
            const partes = regra.split(':');
            const prop = partes[0].trim().toLowerCase();
            const val = partes.slice(1).join(':').trim();

            /* Descartar obrigatoriamente tipografia de origem, fundos poluentes e lixo do Word */
            if (prop === 'font-family' || prop === 'font' || prop === 'font-size' ||
                prop === 'background' || prop === 'background-color' || prop.startsWith('mso-')) {
                continue;
            }

            /* Nivel 1+: Formatos basicos de caracteres (color, font-weight, font-style, text-decoration) */
            if (prop === 'color' && !/^(transparent|inherit)$/i.test(val)) {
                permitidas.push(`color: ${val}`);
            } else if (prop === 'font-weight' && /^(bold|bolder|[5-9]00)$/i.test(val)) {
                permitidas.push(`font-weight: ${val.toLowerCase()}`);
            } else if (prop === 'font-style' && /^(italic|oblique)$/i.test(val)) {
                permitidas.push(`font-style: ${val.toLowerCase()}`);
            } else if (prop === 'text-decoration' || prop === 'text-decoration-line') {
                if (/underline/i.test(val)) permitidas.push('text-decoration: underline');
                else if (/line-through/i.test(val)) permitidas.push('text-decoration: line-through');
            }

            /* Nivel 2+: Alinhamento de paragrafo e recuo simples */
            if (nivelNum >= 2) {
                if (prop === 'text-align' && /^(left|right|center|justify)$/i.test(val)) {
                    permitidas.push(`text-align: ${val.toLowerCase()}`);
                } else if ((prop === 'margin-left' || prop === 'text-indent') && /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i.test(val)) {
                    permitidas.push(`${prop}: ${val.toLowerCase()}`);
                }
            }

            /* Nivel 3+: Bordas, preenchimento e larguras de coluna / tabela */
            if (nivelNum >= 3) {
                if (prop === 'border' || prop === 'border-collapse' || prop.startsWith('border-')) {
                    permitidas.push(`${prop}: ${val}`);
                } else if (prop === 'padding' || prop.startsWith('padding-')) {
                    permitidas.push(`${prop}: ${val}`);
                } else if (prop === 'width' || prop === 'min-width' || prop === 'max-width') {
                    permitidas.push(`${prop}: ${val}`);
                }
            }

            /* Nivel 4: Metadados de pagina/secao e posicionamento controlado */
            if (nivelNum >= 4) {
                if (prop === 'page-break-before' || prop === 'page-break-after' || prop === 'page-break-inside') {
                    permitidas.push(`${prop}: ${val.toLowerCase()}`);
                } else if (prop === 'margin-top' || prop === 'margin-bottom' || prop === 'margin-right' || prop === 'clear' || prop === 'float') {
                    permitidas.push(`${prop}: ${val}`);
                }
            }
        }
        return permitidas.join('; ');
    }

    /*
     * FUNCAO: preSanitizarDomBase
     * OBJETIVO DE RECONSTRUCAO: CAMADA BASE UNIVERSAL E OBRIGATORIA DE HIGIENIZACAO RTF/WORD.
     * Executada SEMPRE como passo previo ao processar qualquer HTML formatado:
     * 1) Remove integralmente scripts, iframes, objetos e nos executaveis/invisiveis;
     * 2) Desenrola links (<a>) mantendo estritamente o texto e formatos de estilo,
     *    expurgando hiperlinks web e atributos associados;
     * 3) Desenrola controles interativos e elementos de layout nao-estilo;
     * 4) Limpa todos os manipuladores de evento on*, id, class, data-* e aria-*;
     * 5) Elimina permanentemente font-family, font-size, background e propriedades mso-*.
     */
    function preSanitizarDomBase(origem) {
        if (!origem) return document.createElement('div');
        const container = document.createElement('div');
        if (typeof origem === 'string') {
            container.innerHTML = origem;
        } else if (origem instanceof Range) {
            const frag = origem.cloneContents();
            if (frag) container.appendChild(frag);
        } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
            container.appendChild(origem.cloneNode(true));
        } else {
            return container;
        }

        /* Passo 1: Eliminar nos executaveis e invisiveis */
        const nosPerigosos = container.querySelectorAll(
            'script, style, iframe, object, embed, applet, noscript, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore]'
        );
        for (let i = 0; i < nosPerigosos.length; i++) {
            nosPerigosos[i].remove();
        }

        /* Passo 2: Desenrolar links (<a>) */
        const links = container.querySelectorAll('a');
        for (let i = 0; i < links.length; i++) {
            const a = links[i];
            if (!a.parentNode) continue;
            while (a.firstChild) {
                a.parentNode.insertBefore(a.firstChild, a);
            }
            a.remove();
        }

        /* Passo 3: Desenrolar controles interativos e elementos nao-estilo */
        const interativos = container.querySelectorAll(
            'button, select, textarea, form, nav, header, footer, aside, section, article, figure, figcaption'
        );
        for (let i = 0; i < interativos.length; i++) {
            const el = interativos[i];
            if (!el.parentNode) continue;
            while (el.firstChild) {
                el.parentNode.insertBefore(el.firstChild, el);
            }
            el.remove();
        }
        const inputs = container.querySelectorAll('input');
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].remove();
        }

        /* Passo 4: Limpar atributos perigosos e de rastreamento */
        const todosElementos = container.querySelectorAll('*');
        for (let i = 0; i < todosElementos.length; i++) {
            const el = todosElementos[i];
            if (!el.parentNode) continue;
            const attrs = Array.from(el.attributes);
            for (let a = 0; a < attrs.length; a++) {
                const attrNome = attrs[a].name.toLowerCase();
                if (
                    attrNome.startsWith('on') ||
                    attrNome === 'class' ||
                    attrNome === 'id' ||
                    attrNome.startsWith('data-') ||
                    attrNome.startsWith('aria-') ||
                    attrNome === 'action' ||
                    attrNome === 'formaction' ||
                    attrNome === 'href' ||
                    attrNome === 'target'
                ) {
                    el.removeAttribute(attrs[a].name);
                }
            }
        }

        return container;
    }

    /*
     * FUNCAO: construirHtmlNivel1Basico
     * REFERENCIA: Nivel 1 (Basico - Inline).
     * ESCOPO: Apenas formatacao de caracteres: b, strong, i, em, u, s, sub, sup, span, br.
     * Proibido qualquer atributo CSS de bloco ou quebras estruturais.
     * ALVO: Caixas de comentario, anotacoes rapidas, chats internos.
     */
    function construirHtmlNivel1Basico(origem) {
        if (!origem) return '';
        try {
            if (origem instanceof Range) {
                return construirHtmlFormatacaoBasica(origem);
            }
            const container = preSanitizarDomBase(origem);
            const tagsPermitidas1 = new Set([
                'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR'
            ]);

            const imgs = container.querySelectorAll('img');
            for (let i = 0; i < imgs.length; i++) imgs[i].remove();

            const elementos = Array.from(container.querySelectorAll('*'));
            for (let i = 0; i < elementos.length; i++) {
                const el = elementos[i];
                if (!el.parentNode) continue;
                const tag = el.tagName ? el.tagName.toUpperCase() : '';

                if (!tagsPermitidas1.has(tag)) {
                    const ehBloco = /^(?:P|DIV|TR|LI|H[1-6]|BLOCKQUOTE|PRE)$/.test(tag);
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    if (ehBloco) {
                        el.parentNode.insertBefore(document.createElement('br'), el);
                    }
                    el.remove();
                    continue;
                }

                const stBruto = el.getAttribute('style');
                if (stBruto) {
                    const stLimpo = sanitizarEstilosCssSempreSemFonte(stBruto, 1);
                    if (stLimpo) el.setAttribute('style', stLimpo);
                    else el.removeAttribute('style');
                }
            }

            const spans = container.querySelectorAll('span');
            for (let i = 0; i < spans.length; i++) {
                const sp = spans[i];
                if (!sp.parentNode) continue;
                if (!sp.attributes.length) {
                    while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
                    sp.remove();
                }
            }

            let html = limparPropriedadesWordEMso(container.innerHTML);
            return html.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>').trim();
        } catch (err) {
            console.error('Erro em construirHtmlNivel1Basico:', err);
            return '';
        }
    }

    /*
     * FUNCAO: construirHtmlNivel2Intermediario
     * REFERENCIA: Nivel 2 (Intermediario - Paragrafo/Fluxo).
     * ESCOPO: Nivel 1 + p, blockquote, ul, ol, li, hr.
     * CSS restrito a alinhamento (text-align) e recuo simples (margin-left / text-indent). Sem tabelas.
     * ALVO: CKEditor / TinyMCE em modo padrao de redacao juridica (despachos simples, certidoes).
     */
    function construirHtmlNivel2Intermediario(origem) {
        if (!origem) return '';
        try {
            const container = preSanitizarDomBase(origem);
            const tagsPermitidas2 = new Set([
                'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR'
            ]);

            const imgs = container.querySelectorAll('img');
            for (let i = 0; i < imgs.length; i++) imgs[i].remove();

            const elementos = Array.from(container.querySelectorAll('*'));
            for (let i = 0; i < elementos.length; i++) {
                const el = elementos[i];
                if (!el.parentNode) continue;
                const tag = el.tagName ? el.tagName.toUpperCase() : '';

                if (!tagsPermitidas2.has(tag)) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    if (tag === 'TR') {
                        el.parentNode.insertBefore(document.createElement('br'), el);
                    }
                    el.remove();
                    continue;
                }

                const stBruto = el.getAttribute('style');
                if (stBruto) {
                    const stLimpo = sanitizarEstilosCssSempreSemFonte(stBruto, 2);
                    if (stLimpo) el.setAttribute('style', stLimpo);
                    else el.removeAttribute('style');
                }
            }

            let html = limparPropriedadesWordEMso(container.innerHTML);
            return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
        } catch (err) {
            console.error('Erro em construirHtmlNivel2Intermediario:', err);
            return '';
        }
    }

    /*
     * FUNCAO: construirHtmlNivel3Avancado
     * REFERENCIA: Nivel 3 (Avancado - Documental / RTF classico).
     * ESCOPO: Nivel 2 + h1-h6, pre, code, table, thead, tbody, tfoot, tr, th, td.
     * CSS inline para bordas, preenchimento (padding) e larguras de coluna (width).
     * ALVO: Editores RTF completos, relatorios formatados, minutas com tabelas de calculo.
     */
    function construirHtmlNivel3Avancado(origem) {
        if (!origem) return '';
        try {
            const container = preSanitizarDomBase(origem);
            const tagsPermitidas3 = new Set([
                'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR',
                'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'CODE',
                'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD'
            ]);

            const imgs = container.querySelectorAll('img');
            for (let i = 0; i < imgs.length; i++) imgs[i].remove();

            const elementos = Array.from(container.querySelectorAll('*'));
            for (let i = 0; i < elementos.length; i++) {
                const el = elementos[i];
                if (!el.parentNode) continue;
                const tag = el.tagName ? el.tagName.toUpperCase() : '';

                if (!tagsPermitidas3.has(tag)) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    el.remove();
                    continue;
                }

                if (tag === 'TD' || tag === 'TH') {
                    el.removeAttribute('colspan');
                    el.removeAttribute('rowspan');
                }

                const stBruto = el.getAttribute('style');
                if (stBruto) {
                    const stLimpo = sanitizarEstilosCssSempreSemFonte(stBruto, 3);
                    if (stLimpo) el.setAttribute('style', stLimpo);
                    else el.removeAttribute('style');
                }
            }

            let html = limparPropriedadesWordEMso(container.innerHTML);
            return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
        } catch (err) {
            console.error('Erro em construirHtmlNivel3Avancado:', err);
            return '';
        }
    }

    /*
     * FUNCAO: construirHtmlNivel4Estendido
     * REFERENCIA: Nivel 4 (Estendido - Suites Office / Canvas).
     * ESCOPO: Nivel 3 + img, colspan, rowspan, metadados de pagina/secao,
     * listas multinivel aninhadas, div com posicionamento controlado.
     * ALVO: LibreOffice Online, Google Docs, DOCX, ODT.
     */
    function construirHtmlNivel4Estendido(origem) {
        if (!origem) return '';
        try {
            const container = preSanitizarDomBase(origem);
            const tagsPermitidas4 = new Set([
                'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR',
                'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'CODE',
                'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
                'IMG', 'DIV'
            ]);

            const elementos = Array.from(container.querySelectorAll('*'));
            for (let i = 0; i < elementos.length; i++) {
                const el = elementos[i];
                if (!el.parentNode) continue;
                const tag = el.tagName ? el.tagName.toUpperCase() : '';

                if (!tagsPermitidas4.has(tag)) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    el.remove();
                    continue;
                }

                if (tag === 'TD' || tag === 'TH') {
                    const cSpan = el.getAttribute('colspan');
                    const rSpan = el.getAttribute('rowspan');
                    if (cSpan && parseInt(cSpan, 10) > 1) {
                        el.setAttribute('colspan', String(parseInt(cSpan, 10)));
                    } else {
                        el.removeAttribute('colspan');
                    }
                    if (rSpan && parseInt(rSpan, 10) > 1) {
                        el.setAttribute('rowspan', String(parseInt(rSpan, 10)));
                    } else {
                        el.removeAttribute('rowspan');
                    }
                }

                if (tag === 'IMG') {
                    const src = el.getAttribute('src') || '';
                    if (!/^(?:https?:|data:image\/)/i.test(src.trim())) {
                        el.remove();
                        continue;
                    }
                }

                const stBruto = el.getAttribute('style');
                if (stBruto) {
                    const stLimpo = sanitizarEstilosCssSempreSemFonte(stBruto, 4);
                    if (stLimpo) el.setAttribute('style', stLimpo);
                    else el.removeAttribute('style');
                }
            }

            let html = limparPropriedadesWordEMso(container.innerHTML);
            return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
        } catch (err) {
            console.error('Erro em construirHtmlNivel4Estendido:', err);
            return '';
        }
    }

    /* Aliases para compatibilidade estrita */
    const construirHtmlFormatacaoAvancada = construirHtmlNivel3Avancado;
    const construirHtmlSemFiltroWord = construirHtmlNivel4Estendido;

    function normalizarNivelFiltro(nivel) {
        if (typeof nivel === 'number') {
            if (nivel === 0) return 'texto_puro';
            if (nivel === 1) return 'basico';
            if (nivel === 2) return 'intermediario';
            if (nivel === 3) return 'avancado';
            if (nivel === 4) return 'estendido';
        }
        const s = String(nivel || '').toLowerCase().trim();
        if (s === '0' || s === 'texto_puro' || s === 'puro' || s === 'texto') return 'texto_puro';
        if (s === '1' || s === 'basico' || s === 'inline') return 'basico';
        if (s === '2' || s === 'intermediario' || s === 'paragrafo' || s === 'fluxo') return 'intermediario';
        if (s === '3' || s === 'avancado' || s === 'documental' || s === 'rtf') return 'avancado';
        if (s === '4' || s === 'estendido' || s === 'extendido' || s === 'sem_filtro' || s === 'office') return 'estendido';
        return 'basico';
    }

    function converterNivelFiltroParaIndice(nivel) {
        const norm = normalizarNivelFiltro(nivel);
        if (norm === 'texto_puro') return 0;
        if (norm === 'basico') return 1;
        if (norm === 'intermediario') return 2;
        if (norm === 'avancado') return 3;
        if (norm === 'estendido') return 4;
        return 1;
    }

    function converterIndiceParaNivelFiltro(indice) {
        const idx = Number(indice);
        if (idx === 0) return 'texto_puro';
        if (idx === 1) return 'basico';
        if (idx === 2) return 'intermediario';
        if (idx === 3) return 'avancado';
        if (idx === 4) return 'estendido';
        return 'basico';
    }

    function aplicarFiltroHtmlPorNivel(origem, nivel) {
        const nivelNorm = normalizarNivelFiltro(nivel);
        if (nivelNorm === 'texto_puro') {
            return extrairTextoPuroSanitizado(origem);
        } else if (nivelNorm === 'basico') {
            return construirHtmlNivel1Basico(origem);
        } else if (nivelNorm === 'intermediario') {
            return construirHtmlNivel2Intermediario(origem);
        } else if (nivelNorm === 'avancado') {
            return construirHtmlNivel3Avancado(origem);
        } else if (nivelNorm === 'estendido') {
            return construirHtmlNivel4Estendido(origem);
        }
        return construirHtmlNivel1Basico(origem);
    }

    function envolverHtmlComResetDeCursorParaWord(codigoHTML) {
        /* Passo 5.2.1: Garantir que ao colar no Word ou editores rich-text o cursor no final (e no inicio)
         * esteja com a formatacao 100% limpa (sem herdar negrito, italico, sublinhado, tachado etc). */
        if (!codigoHTML) return '';
        const spanResetLimpo = '<span style="font-weight:normal;font-style:normal;text-decoration:none;background-color:transparent;mso-highlight:none;">&#8203;</span>';
        return `${spanResetLimpo}${codigoHTML}${spanResetLimpo}`;
    }

    /*
     * FUNCAO: verificarSeTextoEhBlocoOuPalavraUnica
     * OBJETIVO DE RECONSTRUCAO: Regra de Ouro da Formatacao:
     * Quando fora do modo texto puro (em qualquer nivel de estilos: Basicos,
     * Avancados ou Extendidos), caso o usuario clique sobre um bloco forense
     * (CNPJ, CPF, CNJ, Data isolada, Data+Hora, Moeda, Telefone, etc.) ou sobre
     * uma palavra unica isolada, a gravacao na area de transferencia DEVE ser
     * estritamente somente texto puro (text/plain).
     * Frases, paragrafos, tabelas e arrastos manuais cumprem o estilo ativo.
     */
    function verificarSeTextoEhBlocoOuPalavraUnica(textoAlvo) {
        /* Passo 5.2.2: Higienizar entrada e verificar se e nula/vazia */
        if (!textoAlvo || typeof textoAlvo !== 'string') return false;
        const textoTrim = textoAlvo.trim();
        if (!textoTrim) return false;

        /* Passo 5.2.3: Regra 1 - Palavra unica isolada (sem nenhum espaco em branco ou quebra de linha) */
        if (typeof EXPRESSOES_REGULARES !== 'undefined' && EXPRESSOES_REGULARES.CONTEM_ESPACO) {
            if (!EXPRESSOES_REGULARES.CONTEM_ESPACO.test(textoTrim)) return true;
        } else if (!/[\s\u00A0]/.test(textoTrim)) {
            return true;
        }

        /* Passo 5.2.4: Regra 2 - Bloco forense do catalogo (Data+Hora, Moeda com extenso,
         * Boletos espacados, Cardinal com extenso, Telefones, etc.) */
        if (typeof CATALOGO_PADROES_JURIDICOS !== 'undefined' && Array.isArray(CATALOGO_PADROES_JURIDICOS)) {
            for (let i = 0; i < CATALOGO_PADROES_JURIDICOS.length; i++) {
                const entry = CATALOGO_PADROES_JURIDICOS[i];
                if (!entry.regexes) continue;
                for (let j = 0; j < entry.regexes.length; j++) {
                    const rx = entry.regexes[j];
                    const match = textoTrim.match(rx);
                    if (match && match[0] === textoTrim) {
                        return true;
                    }
                }
            }
        }

        /* Passo 5.2.5: Regra 3 - Fallback de regexes de auditoria ou padroes de data/documento isolados */
        if (typeof REGEX_AUDITORIA !== 'undefined') {
            if (REGEX_AUDITORIA.DATA_NUMERICA_COM_HORARIO_AUDITORIA && REGEX_AUDITORIA.DATA_NUMERICA_COM_HORARIO_AUDITORIA.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.HORARIO_ISOLADO && REGEX_AUDITORIA.HORARIO_ISOLADO.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV && REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.DATA_ISOLADA && REGEX_AUDITORIA.DATA_ISOLADA.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.CPF_ISOLADO && REGEX_AUDITORIA.CPF_ISOLADO.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.CNPJ_ISOLADO && REGEX_AUDITORIA.CNPJ_ISOLADO.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.CNJ_ISOLADO && REGEX_AUDITORIA.CNJ_ISOLADO.test(textoTrim)) return true;
        }

        /* Passo 5.2.6: Regra 4 - Sequencias de numeros espacados genericos (ex: boletos, senhas ou codigos com espacos) */
        if (typeof EXPRESSOES_REGULARES !== 'undefined' && EXPRESSOES_REGULARES.MULTIPLOS_NUMEROS_ESPACADOS) {
            const mEspacado = textoTrim.match(EXPRESSOES_REGULARES.MULTIPLOS_NUMEROS_ESPACADOS);
            if (mEspacado && mEspacado[0] === textoTrim) return true;
        }

        return false;
    }

    async function gravarNaAreaDeTransferencia(textoFinal, rangeDOMOpcional = null) {
        /* Passo 5.3: Gravacao com suporte a formatos basicos, avancados ou sem filtro (Blob text/html + ClipboardItem -> copy event -> writeText -> textarea) */
        if (!textoFinal || typeof textoFinal !== 'string') return false;

        let deveManterFormatacao = Boolean(manterFormatacaoBasica && rangeDOMOpcional);
        const nivelNorm = normalizarNivelFiltro(nivelFiltroFormatacao);
        if (nivelNorm === 'texto_puro') {
            deveManterFormatacao = false;
        }
        if (deveManterFormatacao && verificarSeTextoEhBlocoOuPalavraUnica(textoFinal)) {
            /* Regra de Ouro: Bloco forense ou palavra unica e sempre somente texto puro */
            deveManterFormatacao = false;
        }

        if (deveManterFormatacao) {
            /* Passo 5.3.1: Aplicar o filtro correspondente ao nivel ativo na arquitetura progressiva */
            const codigoHTML = aplicarFiltroHtmlPorNivel(rangeDOMOpcional, nivelNorm);

            if (codigoHTML) {
                const htmlParaClipboard = envolverHtmlComResetDeCursorParaWord(codigoHTML);
                const textoPlanoMultilinha = extrairTextoPuroSanitizado(codigoHTML) || textoFinal;
                try {
                    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                        const blobHtml = new Blob([htmlParaClipboard], { type: 'text/html' });
                        const blobTexto = new Blob([textoPlanoMultilinha], { type: 'text/plain' });
                        const dadosParaCopiar = new ClipboardItem({
                            'text/html': blobHtml,
                            'text/plain': blobTexto
                        });
                        await navigator.clipboard.write([dadosParaCopiar]);
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: textoPlanoMultilinha, html: codigoHTML, formatado: true };
                        registrarHistoricoRollback(window.__JUSGOV_ULTIMO_CLIPBOARD__);
                        console.log('Texto formatado copiado! HTML:', codigoHTML);
                        return true;
                    }
                } catch (err) {
                    console.error('Erro ao copiar via ClipboardItem HTML:', err);
                }

                try {
                    let copiouViaEvento = false;
                    const manipuladorCopy = (ev) => {
                        if (ev && ev.clipboardData) {
                            ev.clipboardData.setData('text/html', htmlParaClipboard);
                            ev.clipboardData.setData('text/plain', textoPlanoMultilinha);
                            ev.preventDefault();
                            copiouViaEvento = true;
                        }
                    };
                    document.addEventListener('copy', manipuladorCopy, { capture: true, once: true });
                    const sucessoCopy = document.execCommand('copy');
                    document.removeEventListener('copy', manipuladorCopy, { capture: true });
                    if (sucessoCopy || copiouViaEvento) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: textoPlanoMultilinha, html: codigoHTML, formatado: true };
                        registrarHistoricoRollback(window.__JUSGOV_ULTIMO_CLIPBOARD__);
                        console.log('Texto formatado copiado (fallback copy)! HTML:', codigoHTML);
                        return true;
                    }
                } catch (errCopy) {
                    console.error('Erro no fallback copy HTML:', errCopy);
                }
            }
        }

        let textoPuroFinal = '';
        if (rangeDOMOpcional && nivelNorm === 'texto_puro') {
            textoPuroFinal = extrairTextoPuroSanitizado(rangeDOMOpcional);
        }
        if (!textoPuroFinal) {
            textoPuroFinal = (typeof textoFinal === 'string' && (textoFinal.indexOf('<') !== -1 || textoFinal.indexOf('\r') !== -1))
                ? extrairTextoPuroSanitizado(textoFinal)
                : aplicarFiltro3InformacoesELinhas(aplicarFiltro1DadosLixo(textoFinal));
        }
        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: textoPuroFinal, html: '', formatado: false };
        registrarHistoricoRollback(window.__JUSGOV_ULTIMO_CLIPBOARD__);

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(textoPuroFinal);
                return true;
            }
        } catch (errTxt) {
            console.error('Erro em navigator.clipboard.writeText:', errTxt);
        }

        try {
            const areaTemp = document.createElement('textarea');
            areaTemp.setAttribute('data-jusgov-ignore', 'true');
            areaTemp.value = textoPuroFinal;
            areaTemp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
            document.body.appendChild(areaTemp);
            areaTemp.select();
            document.execCommand('copy');
            document.body.removeChild(areaTemp);
            return true;
        } catch (errArea) {
            console.error('Erro no fallback textarea copy:', errArea);
            return false;
        }
    }

    /*
     * FUNCAO: registrarHistoricoRollback
     * OBJETIVO DE RECONSTRUCAO: Armazenar o historico de copia (ultimo e penultimo)
     * para permitir alternancia instantanea via Ctrl + Botao Direito do Mouse.
     */
    function registrarHistoricoRollback(novoItem) {
        if (!novoItem || (!novoItem.texto && !novoItem.html)) return;
        const txtNovo = (novoItem.texto || '').trim();
        const htmlNovo = (novoItem.html || '').trim();
        const txtAtual = historicoRollbackClipboard.ultimo ? (historicoRollbackClipboard.ultimo.texto || '').trim() : null;
        const htmlAtual = historicoRollbackClipboard.ultimo ? (historicoRollbackClipboard.ultimo.html || '').trim() : null;

        if (txtAtual === txtNovo && htmlAtual === htmlNovo) return;

        historicoRollbackClipboard.penultimo = historicoRollbackClipboard.ultimo;
        historicoRollbackClipboard.ultimo = {
            texto: novoItem.texto || '',
            html: novoItem.html || '',
            formatado: Boolean(novoItem.formatado)
        };
        try {
            const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
            if (storageLocal) {
                storageLocal.set({
                    ultimoClipboardInterno: {
                        texto: novoItem.texto || '',
                        html: novoItem.html || '',
                        formatado: Boolean(novoItem.formatado),
                        timestamp: Date.now()
                    }
                });
            }
        } catch (_) {}
    }

    /*
     * FUNCAO: emularTeclasColar
     * O PORQUE: Ao colar com o botao do meio um conteudo com estilos quando a opcao
     * "Usar area de transferencia (clipboard) do sistema" estiver desativada (false),
     * emula os eventos nativos de teclado (Ctrl+V) e ClipboardEvent('paste') para que o
     * sistema/editor web receba e processe os dados formatados diretamente pelos seus proprios
     * manipuladores de colagem nativos sem depender de permissao do clipboard do SO.
     */
    function emularTeclasColar(alvo, texto, html) {
        try {
            if (!alvo) return false;
            if (typeof alvo.focus === 'function') {
                try { alvo.focus(); } catch (_) {}
            }

            // 1. Despacha KeyDown de Ctrl+V
            const evtDown = new KeyboardEvent('keydown', {
                key: 'v',
                code: 'KeyV',
                keyCode: 86,
                which: 86,
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
                composed: true
            });
            alvo.dispatchEvent(evtDown);

            // 2. Despacha ClipboardEvent('paste') com text/html e text/plain sintetico
            let pasteTratadoPeloEditor = false;
            const ehEditorRico = Boolean(alvo.isContentEditable || (alvo.closest && alvo.closest('[contenteditable="true"]')) || document.designMode === 'on');
            try {
                if (typeof DataTransfer !== 'undefined') {
                    const dt = new DataTransfer();
                    if (html && ehEditorRico) dt.setData('text/html', html);
                    dt.setData('text/plain', texto || '');
                    const evtPaste = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    });
                    pasteTratadoPeloEditor = !alvo.dispatchEvent(evtPaste);
                }
            } catch (_) {}

            // 3. Se o editor nao tratou por conta propria, aciona execCommand de insercao
            if (!pasteTratadoPeloEditor) {
                let colouExec = false;
                try {
                    colouExec = document.execCommand('paste');
                } catch (_) {}
                if (!colouExec) {
                    if (html && ehEditorRico) {
                        try {
                            colouExec = document.execCommand('insertHTML', false, html);
                        } catch (_) {}
                    }
                    if (!colouExec) {
                        const conteudoParaInserir = (ehEditorRico && html) ? html : (texto || '');
                        inserirTextoEmElemento(alvo, conteudoParaInserir, Boolean(ehEditorRico && html));
                    }
                }
            }

            // 4. Despacha KeyUp de Ctrl+V
            const evtUp = new KeyboardEvent('keyup', {
                key: 'v',
                code: 'KeyV',
                keyCode: 86,
                which: 86,
                ctrlKey: true,
                bubbles: true,
                composed: true
            });
            alvo.dispatchEvent(evtUp);
            return true;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: emularTeclasWinV
     * O PORQUE: Quando a colagem Rollback (Ctrl + Botao do Meio) contem estilos (HTML/RTF),
     * despacha para o sistema/aplicacao os eventos da combinacao de teclas "Win + V" (Meta + V)
     * para ativar o historico avancado de area de transferencia da aplicacao / SO.
     */
    function emularTeclasWinV(alvo) {
        try {
            const el = alvo || (typeof document !== 'undefined' ? (document.activeElement || document.body) : null);
            if (!el) return;
            if (typeof el.focus === 'function') {
                try { el.focus(); } catch (_) {}
            }

            // 1. Keydown tecla Windows (MetaLeft, key="Meta")
            el.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Meta',
                code: 'MetaLeft',
                keyCode: 91,
                which: 91,
                metaKey: true,
                bubbles: true,
                cancelable: true,
                composed: true
            }));

            // 2. Keydown tecla 'v' com metaKey (Win + V)
            el.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'v',
                code: 'KeyV',
                keyCode: 86,
                which: 86,
                metaKey: true,
                bubbles: true,
                cancelable: true,
                composed: true
            }));

            // 3. Keyup tecla 'v'
            el.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'v',
                code: 'KeyV',
                keyCode: 86,
                which: 86,
                metaKey: true,
                bubbles: true,
                composed: true
            }));

            // 4. Keyup tecla Windows (MetaLeft)
            el.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'Meta',
                code: 'MetaLeft',
                keyCode: 91,
                which: 91,
                metaKey: false,
                bubbles: true,
                composed: true
            }));
        } catch (_) {}
    }

    /*
     * FUNCAO: executarRollbackEColagem
     * OBJETIVO DE RECONSTRUCAO: Rollback da Area de Transferencia com colagem direta via Ctrl + Botao do Meio.
     * Restaura o conteudo anteriormente copiado (swap continuo entre ultimo e penultimo) e, quando acionado
     * sobre um elemento editavel (<input>, <textarea>, [contenteditable]), cola imediatamente o texto restaurado.
     * Cliques sucessivos em sequencia sobre o mesmo campo alternam dinamicamente substituindo o texto anterior.
     */
    async function executarRollbackEColagem(alvo, e) {
        if (!historicoRollbackClipboard.ultimo) {
            if (ultimoTextoSelecionadoLimpo) {
                historicoRollbackClipboard.ultimo = { texto: ultimoTextoSelecionadoLimpo, html: '', formatado: false };
            } else if (window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                historicoRollbackClipboard.ultimo = { ...window.__JUSGOV_ULTIMO_CLIPBOARD__ };
            }
        }

        if (!historicoRollbackClipboard.penultimo) {
            if (window.JusGovAvisoFlutuante && typeof window.JusGovAvisoFlutuante.exibirAvisoFlutuante === 'function') {
                window.JusGovAvisoFlutuante.exibirAvisoFlutuante(
                    'Sem conteudo anterior para rollback no Ctrl+C',
                    tempoExibicaoAlertaMs,
                    tempoFlashBorderMs,
                    corFlashBorder,
                    false
                );
            }
            return false;
        }

        /* Swap continuo entre o ultimo e o penultimo */
        const itemRestaurado = historicoRollbackClipboard.penultimo;
        const itemAnteriorAntesDoSwap = historicoRollbackClipboard.ultimo;
        historicoRollbackClipboard.penultimo = historicoRollbackClipboard.ultimo;
        historicoRollbackClipboard.ultimo = itemRestaurado;
        window.__JUSGOV_ULTIMO_CLIPBOARD__ = itemRestaurado;

        /* Passo 2: Se tiver estilos, a colagem Rollback envia as teclas "Win + V" para a aplicacao/SO */
        const ehHtml = Boolean(itemRestaurado.formatado && itemRestaurado.html);
        if (ehHtml) {
            emularTeclasWinV(alvo);
        }

        /* Passo 2.1: Colagem imediata se acionado sobre elemento editavel */
        if (alvo) {
            const ctx = classificarContextoElementoAlvo(alvo);
            if (ctx === 'CAMPO_SIMPLES_EDITAVEL' || ctx === 'EDITOR_MULTILINHA_EDITAVEL') {
                const agora = Date.now();
                const textoParaColar = itemRestaurado.texto || '';
                const conteudoEfetivo = ehHtml ? itemRestaurado.html : textoParaColar;

                try { alvo.focus(); } catch (_) {}

                if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') {
                    const textoAnterior = itemAnteriorAntesDoSwap ? (itemAnteriorAntesDoSwap.texto || '') : '';
                    const ehSequencia = (
                        ultimoRollbackInsercao.alvo === alvo &&
                        (agora - ultimoRollbackInsercao.timestamp < 4500) &&
                        alvo.value.substring(ultimoRollbackInsercao.posicaoInicio, ultimoRollbackInsercao.posicaoInicio + ultimoRollbackInsercao.comprimento) === textoAnterior
                    );

                    const start = ehSequencia ? ultimoRollbackInsercao.posicaoInicio : ((typeof alvo.selectionStart === 'number') ? alvo.selectionStart : alvo.value.length);
                    const end = ehSequencia ? (ultimoRollbackInsercao.posicaoInicio + ultimoRollbackInsercao.comprimento) : ((typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : alvo.value.length);

                    if (typeof alvo.setRangeText === 'function') {
                        alvo.setRangeText(textoParaColar, start, end, 'end');
                    } else {
                        alvo.value = alvo.value.substring(0, start) + textoParaColar + alvo.value.substring(end);
                        alvo.selectionStart = alvo.selectionEnd = start + textoParaColar.length;
                    }

                    ultimoRollbackInsercao = {
                        alvo: alvo,
                        posicaoInicio: start,
                        comprimento: textoParaColar.length,
                        timestamp: agora,
                        nodeInserido: null
                    };

                    try {
                        alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) {}
                } else if (alvo.isContentEditable || (alvo.getAttribute && alvo.getAttribute('contenteditable') === 'true') || alvo.closest('[contenteditable="true"]')) {
                    const ehSequenciaContent = (
                        ultimoRollbackInsercao.alvo === alvo &&
                        (agora - ultimoRollbackInsercao.timestamp < 4500)
                    );

                    if (ehSequenciaContent && ultimoRollbackInsercao.nodeInserido && ultimoRollbackInsercao.nodeInserido.parentNode) {
                        try {
                            const nodeVelho = ultimoRollbackInsercao.nodeInserido;
                            const range = document.createRange();
                            range.selectNode(nodeVelho);
                            const sel = window.getSelection();
                            if (sel) {
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        } catch (_) {}
                    }

                    let executou = false;
                    try {
                        if (ehHtml) {
                            executou = document.execCommand('insertHTML', false, conteudoEfetivo);
                        } else {
                            executou = document.execCommand('insertText', false, textoParaColar);
                        }
                    } catch (_) {}

                    if (!executou) {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            const node = document.createTextNode(textoParaColar);
                            range.insertNode(node);
                            range.setStartAfter(node);
                            range.setEndAfter(node);
                            sel.removeAllRanges();
                            sel.addRange(range);
                            ultimoRollbackInsercao = {
                                alvo: alvo,
                                posicaoInicio: 0,
                                comprimento: textoParaColar.length,
                                timestamp: agora,
                                nodeInserido: node
                            };
                        }
                    } else {
                        ultimoRollbackInsercao = {
                            alvo: alvo,
                            posicaoInicio: 0,
                            comprimento: textoParaColar.length,
                            timestamp: agora,
                            nodeInserido: null
                        };
                    }

                    try {
                        alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) {}
                }
            }
        }

        /* Passo 3: Atualizar clipboard do sistema operacional */
        let gravou = false;
        try {
            if (itemRestaurado.formatado && itemRestaurado.html && typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                const blobHtml = new Blob([envolverHtmlComResetDeCursorParaWord(itemRestaurado.html)], { type: 'text/html' });
                const blobTexto = new Blob([itemRestaurado.texto], { type: 'text/plain' });
                navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobTexto })]).catch(() => {});
                gravou = true;
            } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(itemRestaurado.texto || '').catch(() => {});
                gravou = true;
            }
        } catch (_) {}

        if (!gravou) {
            try {
                const areaTemp = document.createElement('textarea');
                areaTemp.setAttribute('data-jusgov-ignore', 'true');
                areaTemp.value = itemRestaurado.texto || '';
                areaTemp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
                document.body.appendChild(areaTemp);
                areaTemp.select();
                document.execCommand('copy');
                document.body.removeChild(areaTemp);
                gravou = true;
            } catch (_) {}
        }

        if (window.JusGovAvisoFlutuante && typeof window.JusGovAvisoFlutuante.exibirAvisoFlutuante === 'function') {
            const txtLimpo = (itemRestaurado.texto || '').trim();
            const resumo = txtLimpo.length > 55 ? (txtLimpo.slice(0, 55) + '...') : txtLimpo;
            const rotuloAlerta = ehHtml
                ? `Rollback [Win+V]: ${resumo}`
                : `Rollback Ctrl+C: ${resumo}`;
            window.JusGovAvisoFlutuante.exibirAvisoFlutuante(
                rotuloAlerta,
                tempoExibicaoAlertaMs,
                tempoFlashBorderMs,
                corFlashBorder,
                true
            );
        }

        return true;
    }

    const executarRollbackClipboard = executarRollbackEColagem;

    function converterHexParaRgbaFlash(hexBruto, alfa = 0.28) {
        const hexLimpo = (typeof hexBruto === 'string' && /^#[0-9a-fA-F]{6}$/.test(hexBruto.trim()))
            ? hexBruto.trim()
            : '#0d9488';
        const r = parseInt(hexLimpo.slice(1, 3), 16);
        const g = parseInt(hexLimpo.slice(3, 5), 16);
        const b = parseInt(hexLimpo.slice(5, 7), 16);
        return {
            hex: hexLimpo,
            rgba: `rgba(${r}, ${g}, ${b}, ${alfa})`
        };
    }

    function limparFlashBorderImediatamente() {
        if (timerFlashBorder) {
            clearTimeout(timerFlashBorder);
            timerFlashBorder = null;
        }
        aguardandoDesselecaoFlash = false;
        try {
            const container = document.getElementById('jusgov-flash-contour-container');
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            if (typeof CSS !== 'undefined' && CSS.highlights) {
                CSS.highlights.delete('jusgov-flash-copy');
            }
        } catch (_) {}
    }

    function agendarRetiradaFlashAposDesselecao() {
        /* Passo 5.4.0: Ao desselecionar (clicar fora / em area vazia ou pressionar Esc),
         * retirar o contorno visual de Flash imediatamente. */
        if (!aguardandoDesselecaoFlash) return;
        limparFlashBorderImediatamente();
    }

    function dispararFlashBorderVisual(rangeAlvo) {
        /* Passo 5.4: Contorno visual temporario configuravel (0 a 5000ms, padrao 500ms e cor customizada)
         * desenhado como contorno real (borda externa nitida com fundo 100% transparente), sem escurecer
         * ou criar segunda selecao sobre o texto. Desaparece automaticamente apos o tempo estipulado. */
        limparFlashBorderImediatamente();
        const duracaoMs = tempoFlashBorderMs > 0 ? tempoFlashBorderMs : 0;
        if (duracaoMs <= 0 || !rangeAlvo) return;
        try {
            let rawRects = null;
            if (typeof rangeAlvo.getClientRects === 'function') {
                rawRects = rangeAlvo.getClientRects();
            }
            const rects = [];
            if (rawRects && rawRects.length > 0) {
                for (let i = 0; i < rawRects.length; i++) {
                    const r = rawRects[i];
                    if (r && r.width > 0 && r.height > 0) {
                        rects.push(r);
                    }
                }
            }
            if (rects.length === 0 && typeof rangeAlvo.getBoundingClientRect === 'function') {
                const b = rangeAlvo.getBoundingClientRect();
                if (b && b.width > 0 && b.height > 0) {
                    rects.push(b);
                }
            }
            if (rects.length === 0) return;

            const idContainer = 'jusgov-flash-contour-container';
            let container = document.getElementById(idContainer);
            if (!container) {
                container = document.createElement('div');
                container.id = idContainer;
                container.setAttribute('data-jusgov-ignore', 'true');
                container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483646;border:none;margin:0;padding:0;overflow:visible;';
                (document.body || document.documentElement).appendChild(container);
            } else {
                container.innerHTML = '';
            }

            const corBorda = (typeof corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(corFlashBorder.trim()))
                ? corFlashBorder.trim().toLowerCase()
                : '#0d9488';

            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                const box = document.createElement('div');
                box.className = 'jusgov-flash-box';
                box.setAttribute('data-jusgov-ignore', 'true');
                box.style.cssText = [
                    'position:fixed',
                    `top:${Math.max(0, Math.round(r.top - 1))}px`,
                    `left:${Math.max(0, Math.round(r.left - 2))}px`,
                    `width:${Math.max(1, Math.round(r.width + 4))}px`,
                    `height:${Math.max(1, Math.round(r.height + 2))}px`,
                    `border:2px solid ${corBorda}`,
                    'border-radius:3px',
                    'background:transparent',
                    'background-color:transparent',
                    'pointer-events:none',
                    'box-sizing:border-box',
                    `box-shadow:0 0 0 1px rgba(255,255,255,0.45), 0 0 4px ${corBorda}`,
                    'margin:0',
                    'padding:0'
                ].join(';') + ';';
                container.appendChild(box);
            }

            aguardandoDesselecaoFlash = true;
            timestampCriacaoFlash = performance.now();

            timerFlashBorder = setTimeout(() => {
                limparFlashBorderImediatamente();
            }, duracaoMs);
        } catch (_) {}
    }

    function registrarEstatisticaOperacional(inconsistenciaDetectada = false) {
        /* Passo 5.4.1: Incrementar contadores estatisticos de copias e alertas exclusivamente em storage.local (sem gravar na nuvem) */
        try {
            const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
            if (storageLocal) {
                storageLocal.get(['totalCopias', 'totalAlertas', 'dataInicioContadores'], (dados) => {
                    if (chrome.runtime && chrome.runtime.lastError) return;
                    const copiasBrutas = (dados && typeof dados.totalCopias === 'number') ? dados.totalCopias : 0;
                    const alertasBrutos = (dados && typeof dados.totalAlertas === 'number') ? dados.totalAlertas : 0;
                    const copiasAtuais = (Number.isSafeInteger(copiasBrutas) && copiasBrutas >= 0 && copiasBrutas < LIMITE_MAXIMO_CONTADOR_OPERACIONAL)
                        ? copiasBrutas
                        : 0;
                    const alertasAtuais = (Number.isSafeInteger(alertasBrutos) && alertasBrutos >= 0 && alertasBrutos < LIMITE_MAXIMO_CONTADOR_OPERACIONAL)
                        ? alertasBrutos
                        : 0;
                    const proxCopias = (copiasAtuais + 1 >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? 0 : (copiasAtuais + 1);
                    const novoPayload = { totalCopias: proxCopias };
                    if (inconsistenciaDetectada) {
                        const proxAlertas = (alertasAtuais + 1 >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? 0 : (alertasAtuais + 1);
                        novoPayload.totalAlertas = proxAlertas;
                    } else if (alertasAtuais !== alertasBrutos) {
                        novoPayload.totalAlertas = 0;
                    }
                    if (!dados || typeof dados.dataInicioContadores !== 'string' || !dados.dataInicioContadores) {
                        const agora = new Date();
                        const pad = (n) => String(n).padStart(2, '0');
                        novoPayload.dataInicioContadores = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                    }
                    storageLocal.set(novoPayload);
                });
            }
        } catch (_) {}
    }

    /*
     * FUNCAO: aplicarSelecaoECopiar
     * OBJETIVO DE RECONSTRUCAO: Aplicar visualmente o Range na janela, higienizar o
     * texto, gerenciar o Modo Acumulador (absorvendo selecao previa na posicao 0 e
     * exibindo APENAS estatisticas de intervalos, palavras e caracteres) ou a copia
     * simples silenciosa com flash opcional.
     */
    async function aplicarSelecaoECopiar(rangeAlvo, modoAcumulador = false, textoSobrescrito = null) {
        /* Passo 5.5: Validar Range e aplicar na Selection API do navegador */
        if (!rangeAlvo) return false;

        let textoLimpo = '';
        if (textoSobrescrito !== null) {
            textoLimpo = higienizarTextoParaCopia(textoSobrescrito);
        } else {
            /* Extrai o texto preservando as quebras estruturais dos blocos do DOM */
            textoLimpo = extrairTextoPuroSanitizado(rangeAlvo);
            if (!textoLimpo) {
                textoLimpo = higienizarTextoParaCopia(rangeAlvo.toString());
            }
        }
        if (!textoLimpo || textoLimpo.length === 0) return false;

        const sel = window.getSelection();
        if (sel) {
            const rangeJaAtivo = sel.rangeCount > 0 &&
                sel.getRangeAt(0).startContainer === rangeAlvo.startContainer &&
                sel.getRangeAt(0).startOffset === rangeAlvo.startOffset &&
                sel.getRangeAt(0).endContainer === rangeAlvo.endContainer &&
                sel.getRangeAt(0).endOffset === rangeAlvo.endOffset;
            if (!rangeJaAtivo) {
                sel.removeAllRanges();
                sel.addRange(rangeAlvo);
            }
        }

        /* Passo 5.6: Processar Modo Acumulador vs. Copia Simples Silenciosa preservando a ativacao do gesto do usuario */
        if (modoAcumulador && acumulador) {
            /* Se o acumulador estiver vazio mas ja havia uma selecao simples anterior na tela,
             * absorve-a automaticamente como o 1o item antes de anexar o novo clique Ctrl+Alt! */
            if (acumulador.obterQuantidade() === 0 && ultimoTextoSelecionadoLimpo && ultimoTextoSelecionadoLimpo !== textoLimpo) {
                acumulador.absorverSelecaoPreviaSeVazio(ultimoTextoSelecionadoLimpo, ultimoRangeSelecionadoSimples);
                ultimoTextoSelecionadoLimpo = '';
                ultimoRangeSelecionadoSimples = null;
            }

            const ehModoBaralho = window.__JUSGOV_MODO_BARALHO__ === true;
            const res = acumulador.adicionarItem(textoLimpo, rangeAlvo, ehModoBaralho);
            if (res) {
                await gravarNaAreaDeTransferencia(res.consolidado || '', null);
                await cederControleAoCompositorBlink();
                let alertaInvalido = false;
                if (validador) {
                    const check = validacaoMatematicaAtiva
                        ? validador.auditarEAlerta(textoLimpo, rangeAlvo)
                        : { valido: true, msg: '' };
                    alertaInvalido = !check.valido;
                    if (check.valido) {
                        const numIntervalos = res.quantidade !== undefined ? res.quantidade : acumulador.obterQuantidade();
                        const numPalavras = res.palavras !== undefined
                            ? res.palavras
                            : (res.consolidado ? res.consolidado.replace(EXPRESSOES_REGULARES.PONTO_VIRGULA_FINAL, '').split(EXPRESSOES_REGULARES.SEPARADOR_TOKENS_ACUMULADOR).filter(Boolean).length : 0);
                        const numCaracteres = res.caracteres !== undefined
                            ? res.caracteres
                            : (res.consolidado ? res.consolidado.length : 0);
                        validador.projetarAlertaVisual(
                            rangeAlvo,
                            `ACUMULADOR: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numPalavras} ${numPalavras === 1 ? 'palavra' : 'palavras'} | ${numCaracteres} caracteres`,
                            false
                        );
                    }
                }
                registrarEstatisticaOperacional(alertaInvalido);
            }
        } else {
            if (acumulador) acumulador.limpar();
            ultimoTextoSelecionadoLimpo = textoLimpo;
            ultimoRangeSelecionadoSimples = typeof rangeAlvo.cloneRange === 'function' ? rangeAlvo.cloneRange() : null;

            await gravarNaAreaDeTransferencia(textoLimpo, rangeAlvo);
            await cederControleAoCompositorBlink();
            if (tempoFlashBorderMs > 0) {
                dispararFlashBorderVisual(rangeAlvo);
            } else {
                limparFlashBorderImediatamente();
            }
            let alertaInvalido = false;
            if (validador && validacaoMatematicaAtiva) {
                const check = validador.auditarEAlerta(textoLimpo, rangeAlvo);
                alertaInvalido = !check.valido;
            }
            registrarEstatisticaOperacional(alertaInvalido);
        }

        return true;
    }

    /* ==========================================================================
     * SECAO 6: PRE-SELECAO SEM COPIA EM EDITORES MULTILINHAS (CAMPOS DE SIMBOLOS)
     * ========================================================================== */
    /*
     * FUNCAO: localizarCampoSimbolosSobCursor
     * OBJETIVO DE RECONSTRUCAO: Identificar em textos editaveis multilinhas se o
     * clique ocorreu sobre um marcador/placeholder delimitado por simbolos como:
     * "##########", "$$$$$$$$", "@@@@", "#[digite o texto aqui]#", "##Funcionalidade##",
     * "@@ Qualquer coisa aqui @@" ou "### Aqui qualquer coisa ##".
     */
    function localizarCampoSimbolosSobCursor(texto, idx) {
        /* Passo 6.1: Testar padroes compostos de campos delimitados por simbolos (#, $, @, *, ~, _, =, %) */
        if (!texto || idx < 0 || idx > texto.length) return null;

        const rxFonte = EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL || EXPRESSOES_REGULARES.CAMPO_MARCADOR_SIMBOLOS;
        const regexCampo = new RegExp(rxFonte.source, 'gu');
        let m;
        while ((m = regexCampo.exec(texto)) !== null) {
            const ini = m.index;
            const fim = ini + m[0].length;
            if (idx >= ini && idx <= fim) {
                return { inicio: ini, fim };
            }
        }

        /* Passo 6.2: Fallback para sequencia contigua de simbolos repetiveis ate a borda do espaco */
        let pos = idx < texto.length ? idx : texto.length - 1;
        if (pos >= 0 && !eSimboloRepetivel(texto[pos]) && pos > 0 && eSimboloRepetivel(texto[pos - 1])) {
            pos--;
        }
        if (pos >= 0 && eSimboloRepetivel(texto[pos])) {
            let ini = pos;
            while (ini > 0 && !eEspacoBranco(texto[ini - 1]) && !eQuebraDeLinha(texto[ini - 1])) {
                ini--;
            }
            let fim = pos + 1;
            while (fim < texto.length && !eEspacoBranco(texto[fim]) && !eQuebraDeLinha(texto[fim])) {
                fim++;
            }
            if (fim - ini >= 2) {
                return { inicio: ini, fim };
            }
        }

        return null;
    }

    /*
     * FUNCAO: tratarCliqueEmEditorMultilinhaSemCopia
     * OBJETIVO DE RECONSTRUCAO: Em editores de texto multilinhas (<textarea> ou
     * contenteditable), selecionar APENAS marcadores de simbolos clicados, sem
     * jamais executar "selecionar tudo" e sem jamais copiar nada para o clipboard.
     */
    function tratarCliqueEmEditorMultilinhaSemCopia(e) {
        /* Passo 6.3: Verificar se a pre-selecao editavel esta ativa e se o alvo e <textarea> ou contenteditable */
        const alvo = e.target;
        if (!alvo) return false;

        const ehTextarea = (alvo.tagName === 'TEXTAREA');
        if (ehTextarea) {
            if (!selecaoEditavelAtiva || (e && e.detail && e.detail > 1)) return false;
            setTimeout(() => {
                try {
                    if (alvo.selectionStart !== alvo.selectionEnd) return;
                    const idx = alvo.selectionStart;
                    const valor = alvo.value || '';
                    const spanSimbolo = localizarCampoSimbolosSobCursor(valor, idx);
                    if (spanSimbolo) {
                        alvo.setSelectionRange(spanSimbolo.inicio, spanSimbolo.fim);
                    }
                } catch (_) {}
            }, 10);
            return true;
        }

        /* Editores HTML Online (contenteditable / CKEditor / TinyMCE / ProseMirror / etc.) */
        if (!placeholdersMinutasHtmlAtivo || modoPlaceholdersMinutasHtml === 'desabilitado') return false;

        const clientX = e.clientX;
        const clientY = e.clientY;
        const detail = (e && typeof e.detail === 'number') ? e.detail : 1;
        const ctrlPressionado = Boolean(e && (e.ctrlKey || e.metaKey));
        setTimeout(() => {
            try {
                const selAtual = window.getSelection();
                if (selAtual && !selAtual.isCollapsed && selAtual.toString().trim().length > 0 && detail === 1) {
                    return;
                }
                const ponto = obterPontoDoClique(clientX, clientY);
                if (!ponto || !ponto.no) return;

                const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
                if (!mapa || !mapa.texto) return;

                const { texto, idxCursor } = mapa;
                let rangeParaSelecionar = null;

                const ativarSelecaoAvancada = (modoPlaceholdersMinutasHtml === 'avancado') ||
                    (modoPlaceholdersMinutasHtml === 'ctrl_avancado' && ctrlPressionado);

                if (ativarSelecaoAvancada) {
                    if (detail >= 3) {
                        const resTriplo = resolverSelecaoTriploClique(mapa, idxCursor);
                        if (resTriplo) {
                            rangeParaSelecionar = criarRangeDOMAPartirDeIndices(mapa, resTriplo.inicio, resTriplo.fim);
                        }
                        if (!rangeParaSelecionar) {
                            const bloco = obterBlocoAncestralContextual(ponto.no);
                            if (bloco && bloco !== document.body) {
                                rangeParaSelecionar = document.createRange();
                                rangeParaSelecionar.selectNodeContents(bloco);
                            }
                        }
                    } else if (detail === 2) {
                        const charNoCursor = texto[idxCursor] || '';
                        const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
                        const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
                            (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));
                        const clicouEmDelimitadorOuAspas = eDelimitadorPar(charNoCursor) || eDelimitadorPar(charAnterior) ||
                            eCaractereAspas(charNoCursor) || eCaractereAspas(charAnterior);

                        let resIndices = null;
                        if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                            resIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
                        }
                        if (!resIndices) {
                            resIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, true);
                        }
                        if (!resIndices) {
                            resIndices = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
                        }
                        if (!resIndices) {
                            resIndices = tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
                        }
                        if (!resIndices) {
                            resIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
                        }
                        if (!resIndices) {
                            resIndices = expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                        }
                        if (resIndices) {
                            rangeParaSelecionar = criarRangeDOMAPartirDeIndices(mapa, resIndices.inicio, resIndices.fim);
                        }
                    } else {
                        /* detail === 1: Prioridade 1 no modo avancado: se clicou sobre um placeholder, seleciona-o diretamente */
                        const spanSimbolo = localizarCampoSimbolosSobCursor(texto, idxCursor);
                        if (spanSimbolo) {
                            rangeParaSelecionar = criarRangeDOMAPartirDeIndices(mapa, spanSimbolo.inicio, spanSimbolo.fim);
                        } else {
                            const charNoCursor = texto[idxCursor] || '';
                            const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
                            const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
                                (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));
                            const clicouEmDelimitadorOuAspas = eDelimitadorPar(charNoCursor) || eDelimitadorPar(charAnterior) ||
                                eCaractereAspas(charNoCursor) || eCaractereAspas(charAnterior);

                            let resIndices = null;
                            if (clicouEmDelimitadorOuAspas) {
                                resIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
                            } else if (clicouEmEspaco) {
                                resIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, false);
                                if (!resIndices) {
                                    resIndices = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
                                }
                                if (!resIndices) {
                                    resIndices = tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
                                }
                                if (!resIndices) {
                                    resIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
                                }
                                if (!resIndices) {
                                    resIndices = expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                                }
                            } else {
                                resIndices = tentarExpandirPadraoComposto(texto, idxCursor, false, false);
                                if (!resIndices) {
                                    resIndices = expandirUnidadeAtomicaEstagio1(texto, idxCursor);
                                }
                            }
                            if (resIndices) {
                                rangeParaSelecionar = criarRangeDOMAPartirDeIndices(mapa, resIndices.inicio, resIndices.fim);
                            }
                        }
                    }
                } else {
                    /* modoPlaceholdersMinutasHtml === 'placeholders' */
                    const spanSimbolo = localizarCampoSimbolosSobCursor(mapa.texto, mapa.idxCursor);
                    if (spanSimbolo) {
                        rangeParaSelecionar = criarRangeDOMAPartirDeIndices(mapa, spanSimbolo.inicio, spanSimbolo.fim);
                    }
                }

                if (!rangeParaSelecionar) return;

                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(rangeParaSelecionar);
                }
            } catch (_) {}
        }, 15);
        return true;
    }

    /* ==========================================================================
     * SECAO 7: MOTORES DOS 6 ESTAGIOS DE EXPANSAO E CONTEXTO INCREMENTAL
     * ========================================================================== */
    function linhaEhTodaMaiuscula(strLinha) {
        if (!strLinha) return false;
        const limpa = strLinha.trim();
        if (limpa.length < 2) return false;
        const temLetra = EXPRESSOES_REGULARES.CHAR_LETRA_GERAL.test(limpa);
        const temMinuscula = EXPRESSOES_REGULARES.CHAR_LETRA_MINUSCULA.test(limpa);
        return temLetra && !temMinuscula;
    }

    function tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idx) {
        /* Passo 7.0.1: Capturar sequencia contigua de 2+ palavras em LETRAS MAIUSCULAS
         * (mesmo dentro de um paragrafo misto, ex: "REGULAR PROSSEGUIMENTO DO FEITO"
         * ou "VARIAS PALAVRAS DO TEXTO EM LETRAS MAIUSCULAS"), ou bloco multilinhas em caixa alta. */
        if (EXPRESSOES_REGULARES.SEQUENCIA_PALAVRAS_MAIUSCULAS) {
            const regexSeqMaiusculas = new RegExp(EXPRESSOES_REGULARES.SEQUENCIA_PALAVRAS_MAIUSCULAS.source, 'gu');
            let mSeq;
            while ((mSeq = regexSeqMaiusculas.exec(texto)) !== null) {
                const iniSeq = mSeq.index;
                const fimSeq = iniSeq + mSeq[0].length;
                if (idx >= (iniSeq - 1) && idx <= (fimSeq + 1)) {
                    const trecho = mSeq[0].trim();
                    const temPeloMenosDuasLetrasSeguidas = EXPRESSOES_REGULARES.CONTEM_DUAS_PALAVRAS_MAIUSCULAS
                        ? EXPRESSOES_REGULARES.CONTEM_DUAS_PALAVRAS_MAIUSCULAS.test(trecho)
                        : trecho.indexOf(' ') !== -1;
                    if (temPeloMenosDuasLetrasSeguidas) {
                        let iniLimpo = iniSeq;
                        let fimLimpo = fimSeq;
                        while (iniLimpo < fimLimpo && eEspacoBranco(texto[iniLimpo])) iniLimpo++;
                        while (fimLimpo > iniLimpo && eEspacoBranco(texto[fimLimpo - 1])) fimLimpo--;
                        if (fimLimpo > iniLimpo) {
                            return { inicio: iniLimpo, fim: fimLimpo };
                        }
                    }
                }
            }
        }

        let iniLinha = idx;
        while (iniLinha > 0 && !eQuebraDeLinha(texto[iniLinha - 1])) {
            iniLinha--;
        }
        let fimLinha = idx;
        while (fimLinha < texto.length && !eQuebraDeLinha(texto[fimLinha])) {
            fimLinha++;
        }

        const linhaAtual = texto.substring(iniLinha, fimLinha);
        if (!linhaEhTodaMaiuscula(linhaAtual)) {
            return null;
        }

        let iniBloco = iniLinha;
        while (iniBloco > 0 && eQuebraDeLinha(texto[iniBloco - 1])) {
            let fimLinhaAnt = iniBloco - 1;
            while (fimLinhaAnt > 0 && texto[fimLinhaAnt - 1] === '\r') fimLinhaAnt--;
            let iniLinhaAnt = fimLinhaAnt;
            while (iniLinhaAnt > 0 && !eQuebraDeLinha(texto[iniLinhaAnt - 1])) {
                iniLinhaAnt--;
            }
            const linhaAnt = texto.substring(iniLinhaAnt, fimLinhaAnt);
            if (linhaEhTodaMaiuscula(linhaAnt)) {
                iniBloco = iniLinhaAnt;
            } else {
                break;
            }
        }

        let fimBloco = fimLinha;
        while (fimBloco < texto.length && eQuebraDeLinha(texto[fimBloco])) {
            let iniLinhaProx = fimBloco + 1;
            while (iniLinhaProx < texto.length && texto[iniLinhaProx] === '\n') iniLinhaProx++;
            let fimLinhaProx = iniLinhaProx;
            while (fimLinhaProx < texto.length && !eQuebraDeLinha(texto[fimLinhaProx])) {
                fimLinhaProx++;
            }
            const linhaProx = texto.substring(iniLinhaProx, fimLinhaProx);
            if (linhaEhTodaMaiuscula(linhaProx)) {
                fimBloco = fimLinhaProx;
            } else {
                break;
            }
        }

        while (iniBloco < fimBloco && eEspacoBranco(texto[iniBloco])) iniBloco++;
        while (fimBloco > iniBloco && eEspacoBranco(texto[fimBloco - 1])) fimBloco--;

        return (fimBloco > iniBloco) ? { inicio: iniBloco, fim: fimBloco } : null;
    }

    function tentarExpandirBlocoFormatadoDestaque(mapa, idx) {
        /* Passo 7.0.2: Detectar conjunto contiguo de palavras destacadas por formatacao basica
         * (negrito <b>/<strong>, italico <i>/<em>, sublinhado <u>/<ins>, marca-texto <mark>,
         * tachado <s>/<del>, codigo <code>, citacao <cite>/<q> ou estilos CSS equivalentes,
         * isolados ou combinados) para seleciona-lo por inteiro com 1 clique no espaco ou 2 cliques. */
        if (!mapa || !Array.isArray(mapa.segmentos) || mapa.segmentos.length === 0) return null;

        const idxGlobal = idx + mapa.deslocamentoJanela;
        const blocoBase = mapa.bloco;
        const TAGS_DESTAQUE = new Set([
            'B', 'STRONG', 'I', 'EM', 'DFN', 'VAR', 'U', 'INS', 'MARK', 'S', 'STRIKE', 'DEL', 'SUP', 'SUB', 'CODE', 'KBD', 'SAMP', 'CITE', 'Q', 'ABBR'
        ]);

        let pesoBase = 400;
        let italicoBase = false;
        let sublinhadoBase = false;
        let bgBase = '';
        try {
            if (blocoBase && blocoBase.nodeType === Node.ELEMENT_NODE) {
                const stBase = window.getComputedStyle(blocoBase);
                if (stBase) {
                    pesoBase = parseInt(stBase.fontWeight, 10) || (stBase.fontWeight === 'bold' ? 700 : 400);
                    italicoBase = stBase.fontStyle === 'italic' || stBase.fontStyle === 'oblique';
                    const decBase = (stBase.textDecorationLine || stBase.textDecoration || '').toLowerCase();
                    sublinhadoBase = decBase.indexOf('underline') !== -1 || decBase.indexOf('line-through') !== -1;
                    bgBase = stBase.backgroundColor || '';
                }
            }
        } catch (_) {}

        const verificarDestaqueSegmento = (seg) => {
            if (!seg || seg.ehBr || !seg.no) return { destacado: false, porTagInline: false };
            let atual = seg.no.parentElement;
            let porTagInline = false;

            while (atual && atual !== blocoBase && atual !== document.body && atual !== document.documentElement) {
                if (TAGS_DESTAQUE.has(atual.tagName)) {
                    porTagInline = true;
                    break;
                }
                atual = atual.parentElement;
            }
            if (porTagInline) {
                return { destacado: true, porTagInline: true };
            }

            const elPai = seg.no.parentElement;
            if (!elPai || elPai === blocoBase) return { destacado: false, porTagInline: false };
            if (elPai.classList && elPai.classList.contains('sample-token')) {
                return { destacado: false, porTagInline: false };
            }

            try {
                const st = window.getComputedStyle(elPai);
                if (st) {
                    const peso = parseInt(st.fontWeight, 10) || (st.fontWeight === 'bold' || st.fontWeight === 'bolder' ? 700 : 400);
                    const fam = (st.fontFamily || '').toLowerCase();
                    const ehNegritoCss = (peso >= 600 && pesoBase < 600) || (fam.indexOf('bold') !== -1);
                    const ehItalicoCss = ((st.fontStyle === 'italic' || st.fontStyle === 'oblique') && !italicoBase) || (fam.indexOf('italic') !== -1);
                    const dec = (st.textDecorationLine || st.textDecoration || '').toLowerCase();
                    const ehSublinhadoCss = (dec.indexOf('underline') !== -1 || dec.indexOf('line-through') !== -1) && !sublinhadoBase;
                    const bg = st.backgroundColor || '';
                    const ehMarcaTextoCss = Boolean(bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== bgBase);

                    if (ehNegritoCss || ehItalicoCss || ehSublinhadoCss || ehMarcaTextoCss) {
                        return { destacado: true, porTagInline: false };
                    }
                }
            } catch (_) {}

            return { destacado: false, porTagInline: false };
        };

        const segmentoEhApenasEspacoConector = (seg) => {
            if (!seg) return false;
            if (seg.ehBr) {
                const comp = seg.comprimento || 0;
                return comp === 1;
            }
            if (!seg.no) return false;
            const v = seg.no.nodeValue || '';
            return v.trim().length === 0;
        };

        let idxSegAlvo = -1;
        for (let i = 0; i < mapa.segmentos.length; i++) {
            const s = mapa.segmentos[i];
            if (idxGlobal >= s.inicioGlobal && idxGlobal <= s.fimGlobal) {
                idxSegAlvo = i;
                const infoS = verificarDestaqueSegmento(s);
                if (infoS.destacado) break;
            }
        }
        if (idxSegAlvo === -1) return null;

        let infoAlvo = verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo]);
        if (!infoAlvo.destacado && segmentoEhApenasEspacoConector(mapa.segmentos[idxSegAlvo])) {
            const infoAnt = idxSegAlvo > 0 ? verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo - 1]) : { destacado: false };
            const infoProx = (idxSegAlvo + 1) < mapa.segmentos.length ? verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo + 1]) : { destacado: false };
            if (infoAnt.destacado && infoProx.destacado) {
                infoAlvo = { destacado: true, porTagInline: infoAnt.porTagInline || infoProx.porTagInline };
            } else if (infoAnt.destacado) {
                idxSegAlvo = idxSegAlvo - 1;
                infoAlvo = infoAnt;
            } else if (infoProx.destacado) {
                idxSegAlvo = idxSegAlvo + 1;
                infoAlvo = infoProx;
            }
        }
        if (!infoAlvo.destacado) return null;

        let segIni = idxSegAlvo;
        let usouTagInline = infoAlvo.porTagInline;
        while (segIni > 0) {
            const sAnt = mapa.segmentos[segIni - 1];
            const infoAnt = verificarDestaqueSegmento(sAnt);
            if (infoAnt.destacado) {
                if (infoAnt.porTagInline) usouTagInline = true;
                segIni--;
            } else if (segmentoEhApenasEspacoConector(sAnt) && segIni >= 2) {
                const infoAntesEspaco = verificarDestaqueSegmento(mapa.segmentos[segIni - 2]);
                if (infoAntesEspaco.destacado) {
                    if (infoAntesEspaco.porTagInline) usouTagInline = true;
                    segIni -= 2;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        let segFim = idxSegAlvo;
        while ((segFim + 1) < mapa.segmentos.length) {
            const sProx = mapa.segmentos[segFim + 1];
            const infoProx = verificarDestaqueSegmento(sProx);
            if (infoProx.destacado) {
                if (infoProx.porTagInline) usouTagInline = true;
                segFim++;
            } else if (segmentoEhApenasEspacoConector(sProx) && (segFim + 2) < mapa.segmentos.length) {
                const infoDepoisEspaco = verificarDestaqueSegmento(mapa.segmentos[segFim + 2]);
                if (infoDepoisEspaco.destacado) {
                    if (infoDepoisEspaco.porTagInline) usouTagInline = true;
                    segFim += 2;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        let iniLocal = Math.max(0, mapa.segmentos[segIni].inicioGlobal - mapa.deslocamentoJanela);
        let fimLocal = Math.min(mapa.texto.length, mapa.segmentos[segFim].fimGlobal - mapa.deslocamentoJanela);

        while (iniLocal < fimLocal && (eEspacoBranco(mapa.texto[iniLocal]) || eQuebraDeLinha(mapa.texto[iniLocal]))) {
            iniLocal++;
        }
        while (fimLocal > iniLocal && (eEspacoBranco(mapa.texto[fimLocal - 1]) || eQuebraDeLinha(mapa.texto[fimLocal - 1]) || ePontuacaoFim(mapa.texto[fimLocal - 1]))) {
            fimLocal--;
        }

        if (fimLocal <= iniLocal) return null;

        const trechoDestacado = mapa.texto.substring(iniLocal, fimLocal).trim();
        /* Deve conter um conjunto de pelo menos 2 palavras (espaco interno entre palavras) */
        if (!/\S+\s+\S+/.test(trechoDestacado)) return null;

        /* Se nao veio de tag de formatacao inline explicita (<b>, <i>, <u>, <mark>, etc.) e cobriu
         * 100% do bloco sem que haja texto nao-destacado no paragrafo, evita falso positivo. */
        if (!usouTagInline && iniLocal === 0 && fimLocal >= mapa.texto.trim().length) {
            return null;
        }

        return { inicio: iniLocal, fim: fimLocal };
    }

    function delimitarParagrafoLocalizado(texto, idx) {
        /* Passo 7.0.3: Resolver os limites exatos do paragrafo localizado em torno de idx,
         * impedindo que o triplo clique (3 cliques) selecione paragrafos anteriores ou posteriores
         * mesmo quando varios paragrafos coexistem num mesmo container (ex: PDF.js textLayer ou <div>). */
        if (!texto || texto.length === 0) return null;

        const quebraDeLinhaEhFronteiraDeParagrafo = (posQuebra) => {
            if (posQuebra < 0 || posQuebra >= texto.length) return true;
            if ((posQuebra + 1) < texto.length && eQuebraDeLinha(texto[posQuebra + 1])) return true;
            if (posQuebra > 0 && eQuebraDeLinha(texto[posQuebra - 1])) return true;

            const trechoApos = texto.substring(posQuebra + 1, Math.min(texto.length, posQuebra + 40));
            if (EXPRESSOES_REGULARES.MARCADOR_NOVO_PARAGRAFO_LINHA &&
                EXPRESSOES_REGULARES.MARCADOR_NOVO_PARAGRAFO_LINHA.test(trechoApos)) {
                return true;
            }

            const trechoAntes = texto.substring(Math.max(0, posQuebra - 40), posQuebra);
            if (EXPRESSOES_REGULARES.FIM_FRASE_PARAGRAFO &&
                EXPRESSOES_REGULARES.FIM_FRASE_PARAGRAFO.test(trechoAntes)) {
                if (!EXPRESSOES_REGULARES.ABREVIACAO_FINAL_LINHA ||
                    !EXPRESSOES_REGULARES.ABREVIACAO_FINAL_LINHA.test(trechoAntes)) {
                    return true;
                }
            }
            return false;
        };

        let iniPar = 0;
        for (let i = Math.min(idx, texto.length - 1); i > 0; i--) {
            if (eQuebraDeLinha(texto[i - 1]) && quebraDeLinhaEhFronteiraDeParagrafo(i - 1)) {
                iniPar = i;
                break;
            }
        }

        let fimPar = texto.length;
        for (let i = Math.max(0, idx); i < texto.length; i++) {
            if (eQuebraDeLinha(texto[i]) && quebraDeLinhaEhFronteiraDeParagrafo(i)) {
                fimPar = i;
                break;
            }
        }

        /* Verificar tambem fronteiras inline entre paragrafos numerados na mesma linha (ex: "...infante; 3. Ordenar...") */
        if (EXPRESSOES_REGULARES.FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS) {
            const fatia = texto.substring(iniPar, fimPar);
            const idxRel = idx - iniPar;
            const regexFronteira = new RegExp(EXPRESSOES_REGULARES.FRONTEIRA_ENTRE_PARAGRAFOS_NUMERADOS.source, 'gu');
            let mFront;
            let novoIniRel = 0;
            let novoFimRel = fatia.length;

            while ((mFront = regexFronteira.exec(fatia)) !== null) {
                const posInicioProximoPar = mFront.index + mFront[0].length;
                const posFimParAnterior = mFront.index + (mFront[1] ? mFront[1].length : 1);
                if (posInicioProximoPar <= idxRel) {
                    novoIniRel = posInicioProximoPar;
                } else if (posFimParAnterior >= idxRel && posFimParAnterior < novoFimRel) {
                    novoFimRel = posFimParAnterior;
                    break;
                }
            }
            iniPar += novoIniRel;
            fimPar = (iniPar - novoIniRel) + novoFimRel;
        }

        while (iniPar < fimPar && (eEspacoBranco(texto[iniPar]) || eQuebraDeLinha(texto[iniPar]))) {
            iniPar++;
        }
        while (fimPar > iniPar && (eEspacoBranco(texto[fimPar - 1]) || eQuebraDeLinha(texto[fimPar - 1]))) {
            fimPar--;
        }

        return (fimPar > iniPar) ? { inicio: iniPar, fim: fimPar } : null;
    }

    function resolverSelecaoTriploClique(mapa, idx) {
        /* Passo 7.0.4: Resolver 3 cliques (e.detail >= 3) com tendencia a MINORAR em blocos
         * compostos (ex: "12.016/2009" -> "12.016" antes da barra ou "2009" apos a barra)
         * e selecao estritamente localizada ao clicar 3 vezes no inicio de um paragrafo. */
        if (!mapa || !mapa.texto) return null;
        const { texto } = mapa;
        let pos = Math.max(0, Math.min(idx, texto.length - 1));

        /* 1. Minoracao de blocos compostos/pontuados (ex: "12.016/2009", "1.325.256.019-75", "10/01/2026") */
        const unidade = expandirUnidadeAtomicaEstagio1(texto, pos);
        if (unidade) {
            const token = texto.substring(unidade.inicio, unidade.fim);
            const ehSeparadorPrimario = (c) => (c === '/' || c === '-' || c === ':' || c === '@' || c === '_');
            let temSeparadorPrimario = false;
            for (let i = 0; i < token.length; i++) {
                if (ehSeparadorPrimario(token[i])) {
                    temSeparadorPrimario = true;
                    break;
                }
            }

            if (temSeparadorPrimario) {
                let p = Math.max(unidade.inicio, Math.min(pos, unidade.fim - 1));
                if (ehSeparadorPrimario(texto[p]) && p > unidade.inicio) {
                    p--;
                }
                let subIni = p;
                while (subIni > unidade.inicio && !ehSeparadorPrimario(texto[subIni - 1])) {
                    subIni--;
                }
                let subFim = p + 1;
                while (subFim < unidade.fim && !ehSeparadorPrimario(texto[subFim])) {
                    subFim++;
                }
                if (subFim > subIni && (subIni > unidade.inicio || subFim < unidade.fim)) {
                    return { inicio: subIni, fim: subFim };
                }
            } else if (token.indexOf('.') !== -1 && token.length > 2) {
                let p = Math.max(unidade.inicio, Math.min(pos, unidade.fim - 1));
                if (texto[p] === '.' && p > unidade.inicio) {
                    p--;
                }
                let subIni = p;
                while (subIni > unidade.inicio && texto[subIni - 1] !== '.') {
                    subIni--;
                }
                let subFim = p + 1;
                while (subFim < unidade.fim && texto[subFim] !== '.') {
                    subFim++;
                }
                if (subFim > subIni && (subIni > unidade.inicio || subFim < unidade.fim)) {
                    return { inicio: subIni, fim: subFim };
                }
            }
        }

        /* 2. Se os 3 cliques ocorreram no inicio do paragrafo (numerado ou nao, ex: "3. Ordenar..."),
         * seleciona exclusivamente o paragrafo localizado em questao. */
        const paragrafo = delimitarParagrafoLocalizado(texto, pos);
        if (paragrafo) {
            const fatiaParagrafo = texto.substring(paragrafo.inicio, paragrafo.fim);
            let offsetFimZonaInicial = 0;
            const regexPref = EXPRESSOES_REGULARES.PREFIXO_NUMERACAO_PARAGRAFO || EXPRESSOES_REGULARES.MARCADOR_NOVO_PARAGRAFO_LINHA;
            if (regexPref) {
                const mPref = fatiaParagrafo.match(regexPref);
                if (mPref) {
                    offsetFimZonaInicial = mPref[0].length;
                }
            }
            while (offsetFimZonaInicial < fatiaParagrafo.length && eEspacoBranco(fatiaParagrafo[offsetFimZonaInicial])) {
                offsetFimZonaInicial++;
            }
            while (offsetFimZonaInicial < fatiaParagrafo.length && eAlfanumericoUnicode(fatiaParagrafo[offsetFimZonaInicial])) {
                offsetFimZonaInicial++;
            }

            if (pos <= (paragrafo.inicio + offsetFimZonaInicial + 1)) {
                return paragrafo;
            }
        }

        /* 3. No meio do paragrafo, tendencia a minorar (reduzindo da frase/expressao composta para a palavra/unidade) */
        if (unidade) {
            return unidade;
        }
        return paragrafo;
    }

    function tentarExpandirDelimitadoresSimetricos(texto, idx, incluirDelimitadoresExternos = false) {
        /* Passo 7.1: Com 1 clique captura o miolo interno; com 2 cliques inclui os delimitadores.
         * Se o cursor estiver diretamente sobre caractere alfanumerico (corpo de palavra),
         * nao busca delimitadores adjacentes externos para nao invadir parenteses vizinhos. */
        const charCursor = (idx >= 0 && idx < texto.length) ? texto[idx] : '';
        const raioBusca = eAlfanumericoUnicode(charCursor) ? 0 : 1;
        for (let delta = 0; delta <= raioBusca; delta++) {
            const candidatos = delta === 0 ? [idx] : [idx - delta, idx + delta];
            for (const pos of candidatos) {
                if (pos < 0 || pos >= texto.length) continue;
                const ch = texto[pos];

                if (PARES_ABERTURA[ch]) {
                    const charFechamento = PARES_ABERTURA[ch];
                    let nivel = 1;
                    for (let i = pos + 1; i < texto.length; i++) {
                        if (texto[i] === ch) nivel++;
                        else if (texto[i] === charFechamento) {
                            nivel--;
                            if (nivel === 0) {
                                return incluirDelimitadoresExternos
                                    ? { inicio: pos, fim: i + 1 }
                                    : { inicio: pos + 1, fim: i };
                            }
                        }
                    }
                }

                if (PARES_FECHAMENTO[ch]) {
                    const charAbertura = PARES_FECHAMENTO[ch];
                    let nivel = 1;
                    for (let i = pos - 1; i >= 0; i--) {
                        if (texto[i] === ch) nivel++;
                        else if (texto[i] === charAbertura) {
                            nivel--;
                            if (nivel === 0) {
                                return incluirDelimitadoresExternos
                                    ? { inicio: i, fim: pos + 1 }
                                    : { inicio: i + 1, fim: pos };
                            }
                        }
                    }
                }

                if (eCaractereAspas(ch)) {
                    const antesEhEspacoOuInicio = (pos === 0 || eEspacoBranco(texto[pos - 1]) || eDelimitadorPar(texto[pos - 1]));
                    if (antesEhEspacoOuInicio) {
                        for (let i = pos + 1; i < texto.length; i++) {
                            if (eQuebraDeLinha(texto[i])) break;
                            if (eCaractereAspas(texto[i])) {
                                return incluirDelimitadoresExternos
                                    ? { inicio: pos, fim: i + 1 }
                                    : { inicio: pos + 1, fim: i };
                            }
                        }
                    } else {
                        for (let i = pos - 1; i >= 0; i--) {
                            if (eQuebraDeLinha(texto[i])) break;
                            if (eCaractereAspas(texto[i])) {
                                return incluirDelimitadoresExternos
                                    ? { inicio: i, fim: pos + 1 }
                                    : { inicio: i + 1, fim: pos };
                            }
                        }
                    }
                }
            }
        }

        let posAbre = -1;
        let charAbre = '';
        const pilhaDireita = [];

        for (let i = idx - 1; i >= 0; i--) {
            const c = texto[i];
            if (eQuebraDeLinha(c)) break;
            if (PARES_FECHAMENTO[c]) {
                pilhaDireita.push(PARES_FECHAMENTO[c]);
            } else if (PARES_ABERTURA[c]) {
                if (pilhaDireita.length > 0 && pilhaDireita[pilhaDireita.length - 1] === c) {
                    pilhaDireita.pop();
                } else {
                    posAbre = i;
                    charAbre = c;
                    break;
                }
            }
        }

        if (posAbre !== -1 && charAbre) {
            const charFecha = PARES_ABERTURA[charAbre];
            let nivel = 1;
            for (let i = posAbre + 1; i < texto.length; i++) {
                if (eQuebraDeLinha(texto[i])) break;
                if (texto[i] === charAbre) nivel++;
                else if (texto[i] === charFecha) {
                    nivel--;
                    if (nivel === 0 && i >= idx) {
                        return incluirDelimitadoresExternos
                            ? { inicio: posAbre, fim: i + 1 }
                            : { inicio: posAbre + 1, fim: i };
                    }
                }
            }
        }

        return null;
    }

    function extrairPalavraSobCursor(texto, idx) {
        if (idx < 0 || idx >= texto.length) return '';
        let pos = idx;
        if (!eAlfanumericoUnicode(texto[pos]) && pos > 0 && eAlfanumericoUnicode(texto[pos - 1])) {
            pos--;
        }
        if (!eAlfanumericoUnicode(texto[pos])) return '';

        let ini = pos;
        while (ini > 0 && (eAlfanumericoUnicode(texto[ini - 1]) || texto[ini - 1] === '\u00BA' || texto[ini - 1] === '\u00B0')) {
            ini--;
        }
        let fim = pos + 1;
        while (fim < texto.length && (eAlfanumericoUnicode(texto[fim]) || texto[fim] === '\u00BA' || texto[fim] === '\u00AA' || texto[fim] === '\u00B0')) {
            fim++;
        }
        return texto.substring(ini, fim);
    }

    function tentarExpandirPadraoComposto(texto, idx, forcarCompostos = false, ehDuploClique = false) {
        /* Passo 7.2: Identificar entidades juridicas (CPF, CNPJ, CNJ, Datas, Moedas, Leis, Coordenadas GPS) */
        const palavraSobCursor = extrairPalavraSobCursor(texto, idx);
        const clicouEmRotuloInicial = palavraSobCursor.length > 0 &&
            EXPRESSOES_REGULARES.PALAVRA_ROTULO_INICIAL.test(palavraSobCursor);
        const clicouEmConectorIntervalo = palavraSobCursor.length > 0 &&
            EXPRESSOES_REGULARES.PALAVRA_CONECTORA_INTERVALO.test(palavraSobCursor);

        const finalizarMatchSemTransbordo = (iniBruto, fimBruto, nomeGrupo, supShift) => {
            let ini = iniBruto;
            let fim = fimBruto;
            while (ini < fim && (eEspacoBranco(texto[ini]) || eQuebraDeLinha(texto[ini]))) {
                ini++;
            }
            while (fim > ini && (eEspacoBranco(texto[fim - 1]) || eQuebraDeLinha(texto[fim - 1]))) {
                fim--;
            }
            if (nomeGrupo === 'LEGISLACAO_JURISPRUDENCIA_E_ATOS' || nomeGrupo === 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS') {
                const trechoAtual = texto.substring(ini, fim);
                const mSufixoSolto = trechoAtual.match(/(?:[\s,;:\-]+(?:e|ou|c\/c|cumulado\s+com|combinado\s+com|de|do|da|dos|das|no|na|nos|nas|ao|aos|a|o|as|os|em|por|para|com))+$/iu);
                if (mSufixoSolto && mSufixoSolto[0].length < trechoAtual.length) {
                    fim -= mSufixoSolto[0].length;
                }
                while (fim > ini && (eEspacoBranco(texto[fim - 1]) || eQuebraDeLinha(texto[fim - 1]) || texto[fim - 1] === ',' || texto[fim - 1] === ';' || texto[fim - 1] === ':')) {
                    fim--;
                }
            }
            if (ini >= fim || idx < ini || idx > fim) return null;
            return { inicio: ini, fim, grupo: nomeGrupo, suportaFiltroShift: supShift };
        };

        for (let g = 0; g < CATALOGO_PADROES_JURIDICOS.length; g++) {
            const grupo = CATALOGO_PADROES_JURIDICOS[g];
            const suportaShift = Boolean(grupo.suportaFiltroShiftDigitos);

            if (grupo.exigeEspacoOuDuploClique && !forcarCompostos && !clicouEmRotuloInicial && !clicouEmConectorIntervalo) {
                continue;
            }

            for (let r = 0; r < grupo.regexes.length; r++) {
                const padraoOriginal = grupo.regexes[r];
                const regex = new RegExp(padraoOriginal.source, padraoOriginal.flags);
                let match;

                while ((match = regex.exec(texto)) !== null) {
                    const textoMatch = match[0];
                    const inicioMatch = match.index;
                    const fimMatch = inicioMatch + textoMatch.length;

                    if (idx < inicioMatch || idx > fimMatch) continue;
                    const idxRelativo = idx - inicioMatch;

                    if (grupo.grupo === 'FINANCEIRO_E_DECIMAIS' && !textoMatch.endsWith('%')) {
                        const idxAbrePar = textoMatch.indexOf('(');

                        if (idxAbrePar !== -1) {
                            if (idxRelativo > idxAbrePar) {
                                continue;
                            }

                            const textoAntesPar = textoMatch.substring(0, idxAbrePar).trimEnd();
                            const compValor = textoAntesPar.length;

                            if (ehDuploClique || (idxRelativo >= compValor && idxRelativo <= idxAbrePar)) {
                                const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                if (resFin) return resFin;
                                continue;
                            }

                            const matchPrefixoRS = textoAntesPar.match(EXPRESSOES_REGULARES.PREFIXO_MOEDA_RS);
                            if (matchPrefixoRS) {
                                const compPrefixoRS = matchPrefixoRS[0].length;
                                if (idxRelativo < compPrefixoRS) {
                                    const resFin = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compValor, grupo.grupo, suportaShift);
                                    if (resFin) return resFin;
                                    continue;
                                }
                                const resFin = finalizarMatchSemTransbordo(inicioMatch + compPrefixoRS, inicioMatch + compValor, grupo.grupo, suportaShift);
                                if (resFin) return resFin;
                                continue;
                            }
                            const resFin = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compValor, grupo.grupo, suportaShift);
                            if (resFin) return resFin;
                            continue;
                        } else {
                            const matchPrefixoRS = textoMatch.match(EXPRESSOES_REGULARES.PREFIXO_MOEDA_RS);
                            if (matchPrefixoRS) {
                                const compPrefixoRS = matchPrefixoRS[0].length;
                                if (ehDuploClique || forcarCompostos || idxRelativo < compPrefixoRS) {
                                    const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resFin) return resFin;
                                    continue;
                                }
                                const resFin = finalizarMatchSemTransbordo(inicioMatch + compPrefixoRS, fimMatch, grupo.grupo, suportaShift);
                                if (resFin) return resFin;
                                continue;
                            }
                            const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                            if (resFin) return resFin;
                            continue;
                        }
                    }

                    if (grupo.grupo === 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS') {
                        const idxAbrePar = textoMatch.indexOf('(');
                        if (idxAbrePar !== -1 && EXPRESSOES_REGULARES.INICIO_DIGITO.test(textoMatch)) {
                            /* Protecao de precedencia monetaria: se o numero com extenso entre parenteses
                             * for precedido por "R$", ignora este match parcial para que o grupo
                             * FINANCEIRO_E_DECIMAIS capture "R$ 65,00 (sessenta e cinco reais)" por inteiro. */
                            const trechoAnterior = texto.substring(Math.max(0, inicioMatch - 6), inicioMatch);
                            if (EXPRESSOES_REGULARES.SUFIXO_MOEDA_RS_ANTERIOR && EXPRESSOES_REGULARES.SUFIXO_MOEDA_RS_ANTERIOR.test(trechoAnterior)) {
                                continue;
                            }
                            if (idxRelativo > idxAbrePar) {
                                continue;
                            }
                            const textoAntesPar = textoMatch.substring(0, idxAbrePar).trimEnd();
                            const compNum = textoAntesPar.length;
                            if (ehDuploClique || (idxRelativo >= compNum && idxRelativo <= idxAbrePar)) {
                                const resInt = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                if (resInt) return resInt;
                                continue;
                            }
                            const resInt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compNum, grupo.grupo, suportaShift);
                            if (resInt) return resInt;
                            continue;
                        }
                    }

                    if (!forcarCompostos && !ehDuploClique && grupo.grupo === 'DATA_COM_HORARIO_CONTIGUO') {
                        /* Passo 7.2.4: Em datas numericas seguidas de horario (ex: "23/10/2026 10:14:18", "28/10/2026 - 06:28:50"):
                         * - 1 clique sobre a data numerica: seleciona apenas a data isolada;
                         * - 1 clique sobre o horario: seleciona apenas o horario isolado;
                         * - 1 clique sobre o separador ("-", espacos intermediarios ou conector) OU 2 cliques (ou Espaco=2 Cliques):
                         *   seleciona Data + Horario inteiros!
                         * Ja datas abreviadas ("17 ago. 2026"), por extenso ("29 de fevereiro de 2025") e competencias
                         * Mes/Ano ("out. 26") sao sempre selecionadas inteiras imediatamente no 1o clique. */
                        if (EXPRESSOES_REGULARES.DATA_NUMERICA_COM_HORARIO &&
                            EXPRESSOES_REGULARES.DATA_NUMERICA_COM_HORARIO.test(textoMatch) &&
                            EXPRESSOES_REGULARES.SUFIXO_HORARIO_EM_DATA) {
                            const matchHorario = textoMatch.match(EXPRESSOES_REGULARES.SUFIXO_HORARIO_EM_DATA);
                            if (matchHorario) {
                                const compDataSemHorario = matchHorario.index !== undefined ? matchHorario.index : (textoMatch.length - matchHorario[0].length);
                                const matchRelHora = matchHorario[0].search(/\d{1,2}:\d{2}/);
                                const idxInicioHora = compDataSemHorario + (matchRelHora >= 0 ? matchRelHora : matchHorario[0].length);

                                if (idxRelativo < compDataSemHorario) {
                                    /* Clique estritamente sobre a data numerica */
                                    const resDt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compDataSemHorario, grupo.grupo, suportaShift);
                                    if (resDt) return resDt;
                                    continue;
                                }
                                if (idxRelativo >= idxInicioHora) {
                                    /* Clique estritamente sobre o horario */
                                    const resTm = finalizarMatchSemTransbordo(inicioMatch + idxInicioHora, fimMatch, grupo.grupo, suportaShift);
                                    if (resTm) return resTm;
                                    continue;
                                }
                                /* Clique sobre o conector intermediario (hifen "-", traco, ou espacos em branco):
                                 * Seleciona a expressao composta inteira (Data + Horario)! */
                                const resComp = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                if (resComp) return resComp;
                                continue;
                            }
                        }
                    }

                    if (!forcarCompostos && grupo.grupo === 'NUMERACOES_ID_E_PUBLICAS') {
                        const matchAtoBarra = textoMatch.match(EXPRESSOES_REGULARES.PROTOCOLO_BARRA_ANO);
                        if (matchAtoBarra) {
                            const idxBarra = textoMatch.indexOf('/');
                            if (idxRelativo < idxBarra) {
                                const resAt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + idxBarra, grupo.grupo, suportaShift);
                                if (resAt) return resAt;
                                continue;
                            }
                            if (idxRelativo > idxBarra) {
                                const resAt = finalizarMatchSemTransbordo(inicioMatch + idxBarra + 1, fimMatch, grupo.grupo, suportaShift);
                                if (resAt) return resAt;
                                continue;
                            }
                        }
                    }

                    const resFinal = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                    if (resFinal) return resFinal;
                }
            }
        }

        /* Passo 7.2.9: Fallback de Multiplos Numeros Espacados (ex: "215 7014 6992 8831")
         * Avaliado somente apos o catalogo forense para nao canibalizar entidades especificas como Datas com Horario. */
        if (forcarCompostos) {
            const regexMultiNum = new RegExp(EXPRESSOES_REGULARES.MULTIPLOS_NUMEROS_ESPACADOS.source, 'gu');
            let mNum;
            while ((mNum = regexMultiNum.exec(texto)) !== null) {
                const iniM = mNum.index;
                const fimM = iniM + mNum[0].length;
                if (idx >= iniM && idx <= fimM) {
                    const resMulti = finalizarMatchSemTransbordo(iniM, fimM, 'MULTIPLOS_NUMEROS_ESPACADOS', true);
                    if (resMulti) return resMulti;
                }
            }
        }

        return null;
    }

    function expandirUnidadeAtomicaEstagio1(texto, idx) {
        /* Passo 7.3: Expansao atomica (inclui pontuacoes internas de CNPJ/CPF/CNJ como '.', '/', '-', virgula decimal e sinais unarios +/-) */
        let pos = idx;
        if (pos >= texto.length) pos = texto.length - 1;
        if (pos < 0) return null;

        if (!eAlfanumericoUnicode(texto[pos]) && !eSimboloRepetivel(texto[pos])) {
            if (pos > 0 && (eAlfanumericoUnicode(texto[pos - 1]) || eSimboloRepetivel(texto[pos - 1]))) {
                pos--;
            } else if ((texto[pos] === '+' || texto[pos] === '-' || texto[pos] === '\u2212' || texto[pos] === '\u2013') &&
                       (pos + 1) < texto.length && eAlfanumericoUnicode(texto[pos + 1])) {
                pos++;
            }
        }

        if (eSimboloRepetivel(texto[pos])) {
            let ini = pos;
            while (ini > 0 && eSimboloRepetivel(texto[ini - 1])) ini--;
            let fim = pos + 1;
            while (fim < texto.length && eSimboloRepetivel(texto[fim])) fim++;
            return { inicio: ini, fim };
        }

        if (!eAlfanumericoUnicode(texto[pos])) return null;

        let ini = pos;
        while (ini > 0) {
            const chAnt = texto[ini - 1];
            if (eAlfanumericoUnicode(chAnt)) {
                ini--;
            } else if ((chAnt === '-' || chAnt === '_' || chAnt === '.' || chAnt === '/') && ini >= 2 && eAlfanumericoUnicode(texto[ini - 2])) {
                ini--;
            } else if (chAnt === ',' && ini >= 2 && texto[ini - 2] >= '0' && texto[ini - 2] <= '9' && ini < texto.length && texto[ini] >= '0' && texto[ini] <= '9') {
                /* Virgula decimal entre digitos (ex: "0,25") */
                ini--;
            } else if ((chAnt === '+' || chAnt === '-' || chAnt === '\u2212' || chAnt === '\u2013') && (ini === 1 || !eAlfanumericoUnicode(texto[ini - 2]))) {
                /* Sinal unario inicial (+ ou -) em numeros (ex: "+0,25", "-0,45", "+1", "-1.233,00") */
                ini--;
                break;
            } else {
                break;
            }
        }

        let fim = pos + 1;
        while (fim < texto.length) {
            const chProx = texto[fim];
            if (eAlfanumericoUnicode(chProx) || chProx === '\u00BA' || chProx === '\u00AA' || chProx === '\u00B0' || chProx === '%') {
                fim++;
            } else if ((chProx === '-' || chProx === '_' || chProx === '.' || chProx === '/') && (fim + 1) < texto.length && eAlfanumericoUnicode(texto[fim + 1])) {
                fim++;
            } else if (chProx === ',' && (fim + 1) < texto.length && texto[fim - 1] >= '0' && texto[fim - 1] <= '9' && texto[fim + 1] >= '0' && texto[fim + 1] <= '9') {
                /* Virgula decimal entre digitos */
                fim++;
            } else {
                break;
            }
        }

        return { inicio: ini, fim };
    }

    function expandirFraseAtePontuacaoEstagio3(texto, idx) {
        let ini = idx;
        while (ini > 0) {
            const c = texto[ini - 1];
            if (eQuebraDeLinha(c) || ePontuacaoFim(c) || c === ':' || eDelimitadorPar(c) || eCaractereAspas(c)) {
                break;
            }
            ini--;
        }

        let fim = idx;
        while (fim < texto.length) {
            const c = texto[fim];
            if (eQuebraDeLinha(c) || ePontuacaoFim(c) || c === ':' || eDelimitadorPar(c) || eCaractereAspas(c)) {
                break;
            }
            fim++;
        }

        while (ini < fim && eEspacoBranco(texto[ini])) ini++;
        while (fim > ini && eEspacoBranco(texto[fim - 1])) fim--;

        return (fim > ini) ? { inicio: ini, fim } : null;
    }

    /* ==========================================================================
     * SECAO 8: SELECAO EM TABELAS E ORQUESTRADOR ELASTICO (CTRL OU ALT: CLIQUE E ARRASTO)
     * ========================================================================== */
    function obterRangePalavraOuBlocoNoPonto(clientX, clientY) {
        const ponto = obterPontoDoClique(clientX, clientY);
        if (!ponto) return null;

        const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
        if (!mapa) return null;

        let resultadoIndices = tentarExpandirPadraoComposto(mapa.texto, mapa.idxCursor, false, false);
        if (!resultadoIndices) {
            resultadoIndices = expandirUnidadeAtomicaEstagio1(mapa.texto, mapa.idxCursor);
        }
        if (!resultadoIndices) return null;

        const range = criarRangeDOMAPartirDeIndices(mapa, resultadoIndices.inicio, resultadoIndices.fim);
        if (!range) return null;

        return {
            range,
            mapa,
            inicio: resultadoIndices.inicio,
            fim: resultadoIndices.fim
        };
    }

    async function executarMotorElastico(e) {
        /* Passo 8.1: Executar expansao/retracao elastica de palavras/blocos exclusivamente com Ctrl isolado */
        const ehModoElastico = Boolean(e.ctrlKey && !e.altKey && !e.shiftKey);
        if (!e || e.button !== 0 || !ehModoElastico) return false;

        const selection = window.getSelection();
        if (!selection) return false;

        if (e.detail >= 2 && e.target && typeof e.target.closest === 'function') {
            const linhaTr = e.target.closest('tr');
            if (linhaTr) {
                e.preventDefault();
                e.stopPropagation();
                const celulasVisiveis = Array.from(linhaTr.querySelectorAll('th, td'))
                    .map(td => (td.innerText || td.textContent || '').replace(EXPRESSOES_REGULARES.ESPACOS_MULTIPLOS, ' ').trim())
                    .filter(Boolean);
                if (celulasVisiveis.length > 0) {
                    const textoLinha = celulasVisiveis.join(' | ');
                    const rangeLinha = document.createRange();
                    rangeLinha.selectNodeContents(linhaTr);
                    rangeAncoraArrastoElastico = rangeLinha.cloneRange();
                    await aplicarSelecaoECopiar(rangeLinha, false, textoLinha);
                    return true;
                }
            }
        }

        const infoAlvo = obterRangePalavraOuBlocoNoPonto(e.clientX, e.clientY);
        if (!infoAlvo) return false;

        const { range: clickedRange, mapa } = infoAlvo;
        const resultadoIndices = { inicio: infoAlvo.inicio, fim: infoAlvo.fim };

        e.preventDefault();
        e.stopPropagation();

        if (selection.rangeCount === 0 || selection.isCollapsed || selection.toString().trim() === '') {
            rangeAncoraArrastoElastico = clickedRange.cloneRange();
            await aplicarSelecaoECopiar(clickedRange, false);
            return true;
        }

        const currentRange = selection.getRangeAt(0).cloneRange();
        const isBefore = currentRange.compareBoundaryPoints(Range.START_TO_START, clickedRange) > 0;
        const isAfter = currentRange.compareBoundaryPoints(Range.END_TO_END, clickedRange) < 0;
        const isInside = !isBefore && !isAfter;

        const newRange = document.createRange();

        try {
            if (isAfter) {
                newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                const ancoraIni = document.createRange();
                ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                rangeAncoraArrastoElastico = ancoraIni;
            } else if (isBefore) {
                newRange.setStart(clickedRange.startContainer, clickedRange.startOffset);
                newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                const ancoraFim = document.createRange();
                ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                rangeAncoraArrastoElastico = ancoraFim;
            } else if (isInside) {
                const leftSide = document.createRange();
                leftSide.setStart(currentRange.startContainer, currentRange.startOffset);
                leftSide.setEnd(clickedRange.startContainer, clickedRange.startOffset);

                const rightSide = document.createRange();
                rightSide.setStart(clickedRange.endContainer, clickedRange.endOffset);
                rightSide.setEnd(currentRange.endContainer, currentRange.endOffset);

                const leftTextLivre = leftSide.toString().replace(EXPRESSOES_REGULARES.SEPARADOR_PONTUACAO_LIVRE, '');
                const rightTextLivre = rightSide.toString().replace(EXPRESSOES_REGULARES.SEPARADOR_PONTUACAO_LIVRE, '');

                if (leftTextLivre === '' && rightTextLivre === '') {
                    selection.removeAllRanges();
                    ultimoTextoSelecionadoLimpo = '';
                    rangeAncoraArrastoElastico = clickedRange.cloneRange();
                    return true;
                } else if (leftTextLivre === '') {
                    let newStart = resultadoIndices.fim;
                    while (newStart < mapa.texto.length && EXPRESSOES_REGULARES.SEPARADOR_BORDA_RECUO.test(mapa.texto[newStart])) newStart++;
                    const ptIni = obterPontoDOMNoMapa(mapa, newStart);
                    if (ptIni) {
                        newRange.setStart(ptIni.no, ptIni.offset);
                        newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                    } else {
                        newRange.setStart(clickedRange.endContainer, clickedRange.endOffset);
                        newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                    }
                    const ancoraFim = document.createRange();
                    ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                    ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                    rangeAncoraArrastoElastico = ancoraFim;
                } else if (rightTextLivre === '') {
                    let newEnd = resultadoIndices.inicio;
                    while (newEnd > 0 && EXPRESSOES_REGULARES.SEPARADOR_BORDA_RECUO.test(mapa.texto[newEnd - 1])) newEnd--;
                    const ptFim = obterPontoDOMNoMapa(mapa, newEnd);
                    if (ptFim) {
                        newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                        newRange.setEnd(ptFim.no, ptFim.offset);
                    } else {
                        newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                        newRange.setEnd(clickedRange.startContainer, clickedRange.startOffset);
                    }
                    const ancoraIni = document.createRange();
                    ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                    ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                    rangeAncoraArrastoElastico = ancoraIni;
                } else {
                    if (leftSide.toString().length <= rightSide.toString().length) {
                        newRange.setStart(clickedRange.startContainer, clickedRange.startOffset);
                        newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                        const ancoraFim = document.createRange();
                        ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                        ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                        rangeAncoraArrastoElastico = ancoraFim;
                    } else {
                        newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                        newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                        const ancoraIni = document.createRange();
                        ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                        ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                        rangeAncoraArrastoElastico = ancoraIni;
                    }
                }
            }

            await aplicarSelecaoECopiar(newRange, false);
            return true;
        } catch (_) {
            return false;
        }
    }

    function atualizarArrastoElasticoNoMovimento(e) {
        if (!rangeAncoraArrastoElastico) return;

        const infoHover = obterRangePalavraOuBlocoNoPonto(e.clientX, e.clientY);
        if (!infoHover || !infoHover.range) return;

        const hoverRange = infoHover.range;
        const selection = window.getSelection();
        if (!selection) return;

        try {
            const novoRange = document.createRange();
            const compInicio = rangeAncoraArrastoElastico.compareBoundaryPoints(Range.START_TO_START, hoverRange);
            const compFim = rangeAncoraArrastoElastico.compareBoundaryPoints(Range.END_TO_END, hoverRange);

            if (compInicio <= 0 && compFim <= 0) {
                novoRange.setStart(rangeAncoraArrastoElastico.startContainer, rangeAncoraArrastoElastico.startOffset);
                novoRange.setEnd(hoverRange.endContainer, hoverRange.endOffset);
            } else if (compInicio >= 0 && compFim >= 0) {
                novoRange.setStart(hoverRange.startContainer, hoverRange.startOffset);
                novoRange.setEnd(rangeAncoraArrastoElastico.endContainer, rangeAncoraArrastoElastico.endOffset);
            } else {
                novoRange.setStart(hoverRange.startContainer, hoverRange.startOffset);
                novoRange.setEnd(hoverRange.endContainer, hoverRange.endOffset);
            }

            selection.removeAllRanges();
            selection.addRange(novoRange);
        } catch (_) {}
    }

    async function tentarSelecionarTabelaLinhaOuColuna(e) {
        const alvo = e.target;
        if (!alvo || typeof alvo.closest !== 'function') return false;

        const celula = alvo.closest('td, th');
        if (!celula) return false;
        const tabela = celula.closest('table');
        if (!tabela) return false;
        const linhaTr = celula.closest('tr');

        const modoAcumulador = (e.ctrlKey && e.altKey);
        const rectLinha = linhaTr ? linhaTr.getBoundingClientRect() : null;
        const clicouNaBordaEsquerdaDaLinha = rectLinha && (e.clientX - rectLinha.left) <= 14;
        const ehCabecalhoTh = celula.tagName.toUpperCase() === 'TH';

        if (modoAcumulador && acumulador && typeof acumulador.acumularSelecaoTabelaPorColunasOuLinhas === 'function' &&
            (ehCabecalhoTh || clicouNaBordaEsquerdaDaLinha || e.shiftKey)) {
            const modoTab = clicouNaBordaEsquerdaDaLinha ? 'LINHA' : 'COLUNA';
            const alvoTab = clicouNaBordaEsquerdaDaLinha ? linhaTr : celula;
            const resTab = acumulador.acumularSelecaoTabelaPorColunasOuLinhas(alvoTab, modoTab, e.shiftKey);
            if (resTab) {
                await gravarNaAreaDeTransferencia(resTab.consolidado || '', null);
                if (resTab.consolidado) {
                    registrarEstatisticaOperacional(false);
                }
                if (validador) {
                    const rangeRef = document.createRange();
                    rangeRef.selectNodeContents(alvoTab);
                    const numIntervalos = resTab.quantidade !== undefined ? resTab.quantidade : 0;
                    const numColunas = resTab.colunas !== undefined ? resTab.colunas : numIntervalos;
                    const numLinhas = resTab.linhas !== undefined ? resTab.linhas : numIntervalos;
                    const numCelulas = resTab.celulas !== undefined ? resTab.celulas : (numColunas * numLinhas);
                    const numCaracteres = resTab.caracteres !== undefined ? resTab.caracteres : (resTab.consolidado ? resTab.consolidado.length : 0);
                    const estatisticaTabela = modoTab === 'COLUNA'
                        ? `TABELA: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numColunas} ${numColunas === 1 ? 'coluna' : 'colunas'} (${numCelulas} celulas) | ${numCaracteres} caracteres`
                        : `TABELA: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numLinhas} ${numLinhas === 1 ? 'linha' : 'linhas'} (${numCelulas} celulas) | ${numCaracteres} caracteres`;
                    validador.projetarAlertaVisual(rangeRef, estatisticaTabela, false);
                }
                return true;
            }
        }

        if (!modoAcumulador && clicouNaBordaEsquerdaDaLinha && linhaTr) {
            const celulasVisiveis = Array.from(linhaTr.querySelectorAll('th, td'))
                .map(td => (td.innerText || td.textContent || '').replace(EXPRESSOES_REGULARES.ESPACOS_MULTIPLOS, ' ').trim())
                .filter(Boolean);
            if (celulasVisiveis.length > 0) {
                const sepLinha = separadorTabelas === '\t' ? '\t' : (separadorTabelas === ';' ? '; ' : ' | ');
                const textoLinha = celulasVisiveis.join(sepLinha);
                const rangeLinha = document.createRange();
                rangeLinha.selectNodeContents(linhaTr);
                await aplicarSelecaoECopiar(rangeLinha, false, textoLinha);
                return true;
            }
        }

        return false;
    }

    /* ==========================================================================
     * SECAO 9: HANDLERS DE EVENTOS DE MOUSE E TECLADO (CICLO DE VIDA)
     * ========================================================================== */

    /*
     * FUNCAO: tratarNavegacaoAbasPorBotoesMouse
     * OBJETIVO DE RECONSTRUCAO: Interceptar com confianca absoluta os botoes 4 e 5 do mouse:
     * - Botao 4 (Back / Voltar / XBUTTON1): atua como Control+Shift+Tab (retorna a aba anterior a esquerda)
     * - Botao 5 (Forward / Avancar / XBUTTON2): atua como Control+Tab (avanca para a proxima aba a direita)
     * Reconhece todas as variacoes de emissao do Chrome/OS:
     * e.button (3=voltar, 4=avancar), e.which (4=voltar, 5=avancar), bitmask buttons (8=voltar, 16=avancar)
     * e eventos de teclado disparados por drivers de mouse (BrowserBack / BrowserForward).
     * Neutraliza categoricamente o comportamento nativo de historico (Back/Forward) em todos os eventos
     * (pointerdown, mousedown, pointerup, mouseup, auxclick, keydown, keyup) e dispara a navegacao de abas
     * exatamente uma vez por clique fisico, mesmo em abas recem-abertas.
     */
    function tratarNavegacaoAbasPorBotoesMouse(e) {
        if (!capturaBotoesMouse4e5Ativa) return;

        let ehBotao4 = false;
        let ehBotao5 = false;

        if (e.type === 'keydown' || e.type === 'keyup') {
            if (e.key === 'BrowserBack' || e.keyCode === 166) {
                ehBotao4 = true;
            } else if (e.key === 'BrowserForward' || e.keyCode === 167) {
                ehBotao5 = true;
            }
        } else {
            const btn = e.button;
            const bts = typeof e.buttons === 'number' ? e.buttons : 0;
            const which = e.which;

            // Botao 4 (Voltar / Control+Shift+Tab): no DOM padrao e.button === 3, ou which === 4, ou bitmask buttons & 8
            if (btn === 3 || which === 4 || ((bts & 8) !== 0 && (btn === 3 || btn === -1 || btn === undefined))) {
                ehBotao4 = true;
            }
            // Botao 5 (Avancar / Control+Tab): no DOM padrao e.button === 4, ou which === 5, ou bitmask buttons & 16
            else if (btn === 4 || which === 5 || ((bts & 16) !== 0 && (btn === 4 || btn === -1 || btn === undefined))) {
                ehBotao5 = true;
            }
        }

        if (!ehBotao4 && !ehBotao5) return;

        // Neutralizacao categorica e imediata do comportamento de historico nativo do navegador
        try {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
        } catch (_) {}

        // Em eventos de soltura (up) ou auxclick, resetamos o estado do botao para o proximo clique
        if (e.type === 'mouseup' || e.type === 'pointerup' || e.type === 'keyup' || e.type === 'auxclick') {
            botaoLateralEmProcessamento = 0;
            return;
        }

        // Em eventos de pressao (down), dispara a navegacao de abas com protecao contra eventos em cascata
        const agora = Date.now();
        const numBotao = ehBotao4 ? 4 : 5;

        // Evita duplicacao de disparo entre pointerdown e mousedown do mesmo clique fisico
        if (botaoLateralEmProcessamento === numBotao && (agora - ultimoTimestampNavegacaoAbas < DEBOUNCE_NAVEGACAO_ABAS_MS)) {
            return;
        }

        botaoLateralEmProcessamento = numBotao;
        ultimoTimestampNavegacaoAbas = agora;

        const direcao = ehBotao4 ? 'anterior' : 'proxima';
        try {
            if (typeof window !== 'undefined' && window.__JUSGOV_AUDITORIA_EM_CURSO__) return;
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                chrome.runtime.sendMessage({ acao: 'navegarAba', direcao });
            }
        } catch (_) {}
    }

    /**
     * Modulo TECLADO/MOUSE: Navegacao entre campos de entrada simples via setas (ArrowDown / ArrowUp).
     * Permite avancar (seta para baixo) ou retroceder (seta para cima) continuamente entre inputs,
     * mesmo estando alinhados horizontalmente na mesma linha.
     * Preserva as regras de alternancia e pre-selecao inicial de campo.
     */
    function navegarEntreCamposEntrada(inputAtual, direcao) {
        if (!inputAtual) return false;
        let raiz = inputAtual.form;
        if (!raiz) {
            raiz = inputAtual.closest('#containerLinhasEntradaDemo, form, .cartao, body') || document;
        }
        const seletores = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly])';
        const todos = Array.from(raiz.querySelectorAll(seletores));
        const visiveis = todos.filter(inp => {
            try {
                return inp.offsetParent !== null || inp.getClientRects().length > 0;
            } catch (_) {
                return true;
            }
        });
        if (visiveis.length <= 1) return false;
        const indiceAtual = visiveis.indexOf(inputAtual);
        if (indiceAtual === -1) return false;
        const proximoIndice = direcao > 0
            ? (indiceAtual + 1) % visiveis.length
            : (indiceAtual - 1 + visiveis.length) % visiveis.length;
        const proximoInput = visiveis[proximoIndice];
        if (!proximoInput) return false;

        try {
            proximoInput.focus();
            const jaSelecionouAntes = inputsJaSelecionadosInicialmente.has(proximoInput) || proximoInput.__jusgovSelecionadoInicial === true;
            if (!jaSelecionouAntes) {
                inputsJaSelecionadosInicialmente.add(proximoInput);
                proximoInput.__jusgovSelecionadoInicial = true;
                if (typeof proximoInput.select === 'function') {
                    proximoInput.select();
                }
            } else {
                const tam = (proximoInput.value && typeof proximoInput.value.length === 'number') ? proximoInput.value.length : 0;
                if (typeof proximoInput.setSelectionRange === 'function') {
                    proximoInput.setSelectionRange(tam, tam);
                }
            }
        } catch (_) {}
        return true;
    }

    /*
     * FUNCAO: lidarFocoInteligente (Autofill & Datepicker Helper)
     * O PORQUE: Intercepta o evento 'focusin' disparado quando o usuario navega via Tab,
     * clica ou quando scripts do JSF/Angular focam campos de data e texto.
     * Seleciona imediatamente todo o conteudo (50ms) se o campo for novo ou se contiver
     * apenas mascara (ex: ___/___/_____ no PJe/PREVJUD), permitindo colagem direta.
     * Ao sair (blur), remove a trava para que o proximo acesso volte a selecionar tudo.
     */
    let ultimoTempoSelecaoInteligente = 0;
    function lidarFocoInteligente(event) {
        if (!selecaoEditavelAtiva) return;
        const target = event.target;
        if (!target) return;

        if (isCampoDeTextoValido(target)) {
            if (target.tagName === 'TEXTAREA') return;
            const valLen = (target.value || '').length;
            const sizeAttr = parseInt(target.getAttribute('size') || '0', 10);
            if (valLen > 25 || sizeAttr > 25) return;
            const agora = Date.now();
            if (agora - ultimoTempoSelecaoInteligente < 150) return;

            const temAlfanumerico = /[\p{L}\p{N}]/u.test(target.value || '');
            if (target.dataset.autoselected && temAlfanumerico) return;

            target.dataset.autoselected = 'true';
            target.addEventListener('blur', () => {
                delete target.dataset.autoselected;
            }, { once: true });

            setTimeout(() => {
                try {
                    if (typeof target.select === 'function') {
                        target.select();
                        ultimoTempoSelecaoInteligente = Date.now();
                    }
                } catch (_) {}
            }, 50);
        }
    }

    function aoPressionarBotaoMouse(e) {
        if (!cssBlindado || !document.getElementById('pje-turbo-lock')) {
            blindarCSS();
        }

        if (!verificarUrlPermitida()) return;

        /* Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Permite que o navegador abra o link em nova aba sem interceptacao */
        const elLinkAlvoMouseUp = (e.target && typeof e.target.closest === 'function')
            ? e.target.closest('a[href]')
            : null;
        if (elLinkAlvoMouseUp && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
            ignorarProximoClick = false;
            houveArrastoMouse = false;
            return;
        }

        /* Passo 9.1: Desfazer ultimo item do Acumulador por Clique com Botao Direito com Ctrl+Alt */
        if (e.button === 2 && e.ctrlKey && e.altKey && acumulador && acumulador.obterQuantidade() > 0) {
            e.preventDefault();
            e.stopPropagation();
            const res = acumulador.desfazerUltimoItem();
            if (res) {
                gravarNaAreaDeTransferencia(res.consolidado || '', null);
                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    const numIntervalos = res.quantidade !== undefined ? res.quantidade : acumulador.obterQuantidade();
                    const numPalavras = res.palavras !== undefined
                        ? res.palavras
                        : (res.consolidado ? res.consolidado.replace(EXPRESSOES_REGULARES.PONTO_VIRGULA_FINAL, '').split(EXPRESSOES_REGULARES.SEPARADOR_TOKENS_ACUMULADOR).filter(Boolean).length : 0);
                    const numCaracteres = res.caracteres !== undefined
                        ? res.caracteres
                        : (res.consolidado ? res.consolidado.length : 0);
                    validador.projetarMiniTipGlobal(
                        `Acumulador (Desfeito): ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numPalavras} ${numPalavras === 1 ? 'palavra' : 'palavras'} | ${numCaracteres} caracteres`,
                        '#f59e0b'
                    );
                }
            }
            return;
        }

        /* Modulo MOUSE: Captura dos Botoes 4 e 5 para navegacao circular entre abas */
        if (capturaBotoesMouse4e5Ativa && (e.button === 3 || e.button === 4 || e.which === 4 || e.which === 5)) {
            tratarNavegacaoAbasPorBotoesMouse(e);
            return;
        }

        /* Modulo MOUSE: Tratamento do Botao do Meio (scroll click, button === 1) */
        if (e.button === 1) {
            /* Regra fundamental: Preservar navegacao nativa do navegador (abrir link em nova aba).
             * Nunca chamar preventDefault() no clique com botao do meio sobre <a href>. */
            const elLinkMeio = (e.target && typeof e.target.closest === 'function')
                ? e.target.closest('a[href]')
                : null;
            if (elLinkMeio) {
                return;
            }

            /* Regra fundamental: Se "Colar com o botão do Meio" estiver desabilitado,
             * não intercepta nem bloqueia o clique do meio, preservando integralmente
             * a rolagem automática nativa (cursor de bússola/roda) do navegador. */
            if (!colarBotaoMeioAtivo) {
                return;
            }

            /* Rollback e colagem com Ctrl + Botao do Meio */
            if (e.ctrlKey && !e.altKey && !e.shiftKey && historicoClipboardCtrlMeioAtivo) {
                e.preventDefault();
                try { e.target.focus(); } catch (_) {}
                return;
            }

            /* Colar com o Botao do Meio ativo:
             * Anula a rolagem automatica nativa (autoscroll) do Chromium que altera o cursor para icone de bussola,
             * mesmo se houver erro ou alvo nao editavel, realizando foco preparatorio caso seja campo editavel. */
            e.preventDefault();
            const ctxMeio = classificarContextoElementoAlvo(e.target);
            if (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL' || ctxMeio === 'EDITOR_MULTILINHA_EDITAVEL') {
                try { e.target.focus(); } catch (_) {}
            }
            return;
        }

        /* Foco preparatorio no clique com botao direito em campo editavel */
        if (e.button === 2) {
            const ctxDireito = classificarContextoElementoAlvo(e.target);
            if (colarBotaoMeioAtivo && colagemBotaoDireitoAtiva && (ctxDireito === 'CAMPO_SIMPLES_EDITAVEL' || ctxDireito === 'EDITOR_MULTILINHA_EDITAVEL')) {
                try { e.target.focus(); } catch (_) {}
            }
            return;
        }

        if (e.button !== 0) return;

        coordsMouseDown.x = e.clientX;
        coordsMouseDown.y = e.clientY;
        houveArrastoMouse = false;
        selecaoElasticaAtivaNoClique = false;
        rangeAncoraArrastoElastico = null;
        pontoAncoraArrastoAlt = null;

        const tipoContexto = classificarContextoElementoAlvo(e.target);
        if (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL') {
            inputAlvoMouseDown = (e.target && typeof e.target.closest === 'function')
                ? (e.target.closest('input') || e.target)
                : e.target;
            if (inputAlvoMouseDown) {
                const eraAtivo = (document.activeElement === inputAlvoMouseDown);
                let tinhaSelecao = false;
                try {
                    tinhaSelecao = (typeof inputAlvoMouseDown.selectionStart === 'number' &&
                        typeof inputAlvoMouseDown.selectionEnd === 'number' &&
                        inputAlvoMouseDown.selectionStart !== inputAlvoMouseDown.selectionEnd);
                } catch (_) {}
                inputJaEstavaSelecionadoNoMouseDown = Boolean(eraAtivo && tinhaSelecao);
            } else {
                inputJaEstavaSelecionadoNoMouseDown = false;
            }
            return;
        }
        if (tipoContexto === 'EDITOR_MULTILINHA_EDITAVEL') {
            const ehTextarea = Boolean(e.target && e.target.tagName === 'TEXTAREA');
            const ehEditorHtmlAtivo = !ehTextarea && Boolean(
                e.target && (
                    e.target.isContentEditable ||
                    (document.body && document.body.isContentEditable) ||
                    document.designMode === 'on' ||
                    (typeof e.target.closest === 'function' && e.target.closest('[contenteditable="true"]'))
                )
            );
            if (ehTextarea || ehEditorHtmlAtivo) {
                return;
            }
            /* Se nao for textarea nem editor HTML ativo, prossegue normalmente como texto comum */
        }
        if (tipoContexto === 'IGNORAR') {
            return;
        }
        if (e.target && typeof e.target.closest === 'function' && e.target.closest('[data-jusgov-ignore]')) {
            return;
        }

        const temModificadorTeclado = temModificadorTecladoAtivo(e);
        if (temModificadorTeclado) {
            garantirSelecaoForcadaEmElemento(e.target);
        }

        /* Passo 9.1.5: Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Quando o usuario clica com a tecla Ctrl sobre um link hipertexto (<a href>),
         * NAO intercepta nem bloqueia o evento, permitindo que o navegador execute
         * sua acao nativa universal de abrir o link em nova aba em segundo plano. */
        const elLinkAlvo = (e.target && typeof e.target.closest === 'function')
            ? e.target.closest('a[href]')
            : null;
        if (elLinkAlvo && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
            ignorarProximoClick = false;
            return;
        }

        const ehModoElastico = Boolean(e.ctrlKey && !e.altKey && !e.shiftKey);
        if (ehModoElastico) {
            /* Quando o usuario pressiona Ctrl isolado, aciona o Motor Elastico para continuar,
             * expandir ou retrair a selecao existente por palavras/blocos. */
            selecaoElasticaAtivaNoClique = true;
            ignorarProximoClick = true;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            executarMotorElastico(e);
            return;
        }

        const ehModoAltIsolado = Boolean(e.altKey && !e.ctrlKey && !e.shiftKey);
        if (ehModoAltIsolado) {
            /* Alt + Clique inicia SEMPRE uma nova selecao (nao continua a selecao anterior como Ctrl).
             * Registra tambem o ponto inicial para permitir "Alt + Arrastar" sobre parte de links ou botoes. */
            const selAlt = window.getSelection();
            if (selAlt) {
                selAlt.removeAllRanges();
            }
            ultimoTextoSelecionadoLimpo = '';
            ultimoRangeSelecionadoSimples = null;
            pontoAncoraArrastoAlt = obterPontoDoClique(e.clientX, e.clientY);
            ignorarProximoClick = true;
            e.stopPropagation();
        }

        /* Em links, botoes e elementos de interface interativa (LINK_CLICAVEL):
         * - DIRETRIZ ROOT IMUTAVEL: Se for clique sem tecla modificadora (Alt, Ctrl, Shift),
         *   retorna imediatamente para permitir que a navegacao e interacao nativa da pagina
         *   e do navegador funcione sem nenhuma interferencia ou delay.
         * - Se houver tecla modificadora mantida (ex: Alt para copiar texto do botao/link,
         *   Ctrl+Alt para acumular, Shift para copiar numeros): aplica selecao forcada e ignora o clique nativo! */
        if (tipoContexto === 'LINK_CLICAVEL') {
            if (!temModificadorTeclado) {
                ignorarProximoClick = false;
                houveArrastoMouse = false;
                return;
            }
            garantirSelecaoForcadaEmElemento(e.target);
            ignorarProximoClick = true;
            if (e.ctrlKey || e.altKey) {
                e.preventDefault();
            }
        }

        /* Passo 9.2: Evitar que o navegador expanda nativamente quando Shift e clicado em ponto inicial */
        if (e.shiftKey && !e.ctrlKey && !e.altKey && !ancoraCursorShift) {
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) {
                sel.removeAllRanges();
            }
        }

        if (!e.ctrlKey && !e.shiftKey && e.detail >= 2) {
            e.preventDefault();
        }
    }

    function atualizarArrastoCaracteresAltNoMovimento(e) {
        /* Passo 9.2.1: Permitir arrastar com Alt pressionado sobre o texto de links, botoes ou menus
         * para selecionar apenas uma parte especifica do seu texto (mesmo quando preventDefault bloqueou a acao do link/botao). */
        if (!pontoAncoraArrastoAlt || !pontoAncoraArrastoAlt.no) return;
        const pontoAtual = obterPontoDoClique(e.clientX, e.clientY);
        if (!pontoAtual || !pontoAtual.no) return;

        const selection = window.getSelection();
        if (!selection) return;

        try {
            const rAncora = document.createRange();
            rAncora.setStart(pontoAncoraArrastoAlt.no, pontoAncoraArrastoAlt.offset);
            rAncora.setEnd(pontoAncoraArrastoAlt.no, pontoAncoraArrastoAlt.offset);

            const rAtual = document.createRange();
            rAtual.setStart(pontoAtual.no, pontoAtual.offset);
            rAtual.setEnd(pontoAtual.no, pontoAtual.offset);

            const novoRange = document.createRange();
            if (rAncora.compareBoundaryPoints(Range.START_TO_START, rAtual) <= 0) {
                novoRange.setStart(pontoAncoraArrastoAlt.no, pontoAncoraArrastoAlt.offset);
                novoRange.setEnd(pontoAtual.no, pontoAtual.offset);
            } else {
                novoRange.setStart(pontoAtual.no, pontoAtual.offset);
                novoRange.setEnd(pontoAncoraArrastoAlt.no, pontoAncoraArrastoAlt.offset);
            }

            selection.removeAllRanges();
            selection.addRange(novoRange);
        } catch (_) {}
    }

    function aoMoverMouse(e) {
        if ((e.buttons & 1) !== 1) return;

        const dx = Math.abs(e.clientX - coordsMouseDown.x);
        const dy = Math.abs(e.clientY - coordsMouseDown.y);
        if (dx > CONFIGURACAO_MOTOR.DISTANCIA_MINIMA_ARRASTO_PX ||
            dy > CONFIGURACAO_MOTOR.DISTANCIA_MINIMA_ARRASTO_PX) {
            houveArrastoMouse = true;
        }

        if (selecaoElasticaAtivaNoClique && houveArrastoMouse) {
            if (e.target) garantirSelecaoForcadaEmElemento(e.target);
            atualizarArrastoElasticoNoMovimento(e);
            return;
        }

        if (e.altKey && !e.ctrlKey && !e.shiftKey && houveArrastoMouse && pontoAncoraArrastoAlt) {
            if (e.target) garantirSelecaoForcadaEmElemento(e.target);
            atualizarArrastoCaracteresAltNoMovimento(e);
        }
    }

    async function aoSoltarBotaoMouse(e) {
        if (capturaBotoesMouse4e5Ativa && (e.button === 3 || e.button === 4 || e.which === 4 || e.which === 5)) {
            tratarNavegacaoAbasPorBotoesMouse(e);
            return;
        }
        if (e.button !== 0) return;

        if (selecaoElasticaAtivaNoClique) {
            const arrastouElastico = houveArrastoMouse;
            selecaoElasticaAtivaNoClique = false;
            houveArrastoMouse = false;
            rangeAncoraArrastoElastico = null;
            ignorarProximoClick = true;

            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }

            if (arrastouElastico) {
                const selElastica = window.getSelection();
                if (selElastica && !selElastica.isCollapsed && selElastica.rangeCount > 0) {
                    const rngFinalElastico = selElastica.getRangeAt(0).cloneRange();
                    await aplicarSelecaoECopiar(rngFinalElastico, false);
                }
            }
            return;
        }

        if (!verificarUrlPermitida()) return;

        /* Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Permite que o navegador abra o link em nova aba sem interceptacao */
        const elLinkAlvoMouseUp = (e.target && typeof e.target.closest === 'function')
            ? e.target.closest('a[href]')
            : null;
        if (elLinkAlvoMouseUp && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
            ignorarProximoClick = false;
            houveArrastoMouse = false;
            return;
        }

        const tipoContexto = classificarContextoElementoAlvo(e.target);
        if (tipoContexto === 'IGNORAR') return;

        /* Passo 9.3: Regra de Ouro dos Campos Editaveis (ZERO copia automatica em qualquer campo editavel) */
        if (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL') {
            const inputAlvo = (e.target && typeof e.target.closest === 'function')
                ? (e.target.closest('input') || e.target)
                : e.target;

            if (selecaoEditavelAtiva && !houveArrastoMouse && !e.shiftKey && !e.ctrlKey && !e.altKey && inputAlvo && typeof inputAlvo.select === 'function') {
                if (e.detail === 2) {
                    /* Regra 3: Se der dois cliques ele seleciona tudo novamente */
                    setTimeout(() => {
                        try { inputAlvo.select(); } catch (_) {}
                    }, 10);
                } else if (e.detail === 1) {
                    const valLen = (inputAlvo.value || '').length;
                    const sizeAttr = parseInt(inputAlvo.getAttribute('size') || '0', 10);
                    const ehCampoCurto = valLen <= 25 && sizeAttr <= 25;
                    const temAlfanumerico = /[\p{L}\p{N}]/u.test(inputAlvo.value || '');
                    if (ehCampoCurto && (!inputAlvo.dataset.autoselected || !temAlfanumerico)) {
                        /* 1a vez ou campo sem caracteres alfanumericos (ex: mascara de data ___/___/_____): seleciona tudo */
                        inputAlvo.dataset.autoselected = 'true';
                        inputAlvo.addEventListener('blur', () => {
                            delete inputAlvo.dataset.autoselected;
                        }, { once: true });
                        setTimeout(() => {
                            try { inputAlvo.select(); } catch (_) {}
                        }, 50);
                    } else if (inputJaEstavaSelecionadoNoMouseDown) {
                        /* 2º clique consecutivo em campo ja focado com texto: permite posicionar o cursor pontualmente */
                        setTimeout(() => {
                            try {
                                if (inputAlvo.selectionStart !== inputAlvo.selectionEnd) {
                                    inputAlvo.setSelectionRange(inputAlvo.selectionStart, inputAlvo.selectionStart);
                                }
                            } catch (_) {}
                        }, 10);
                    }
                }
            }
            inputJaEstavaSelecionadoNoMouseDown = false;
            inputAlvoMouseDown = null;
            houveArrastoMouse = false;
            return;
        }

        if (tipoContexto === 'EDITOR_MULTILINHA_EDITAVEL') {
            const ehTextarea = Boolean(e.target && e.target.tagName === 'TEXTAREA');
            if (ehTextarea) {
                if (selecaoEditavelAtiva && !houveArrastoMouse && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    tratarCliqueEmEditorMultilinhaSemCopia(e);
                }
                houveArrastoMouse = false;
                return;
            }

            /* Editores HTML Online estritos (contenteditable / CKEditor ativo) */
            const ehEditorHtmlAtivo = Boolean(
                e.target && (
                    e.target.isContentEditable ||
                    (document.body && document.body.isContentEditable) ||
                    document.designMode === 'on' ||
                    (typeof e.target.closest === 'function' && e.target.closest('[contenteditable="true"]'))
                )
            );

            if (ehEditorHtmlAtivo) {
                const permiteCliqueCtrl = (modoPlaceholdersMinutasHtml === 'ctrl_avancado' || modoPlaceholdersMinutasHtml === 'avancado') && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
                const permiteCliqueNormal = !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;
                if (placeholdersMinutasHtmlAtivo && modoPlaceholdersMinutasHtml !== 'desabilitado' && !houveArrastoMouse && (permiteCliqueNormal || permiteCliqueCtrl)) {
                    tratarCliqueEmEditorMultilinhaSemCopia(e);
                }
                houveArrastoMouse = false;
                return;
            }
            /* Se NAO for de fato um editor HTML ativo, prossegue imediatamente para a selecao de texto comum abaixo! */
        }

        const modoAcumulador = Boolean(e.ctrlKey && e.altKey);

        /* Passo 9.4: Shift + Arrasto linear (inicio do arrasto ate final do arrasto) */
        if (e.shiftKey && !modoAcumulador && houveArrastoMouse) {
            houveArrastoMouse = false;
            setTimeout(async () => {
                const selShift = window.getSelection();
                if (selShift && !selShift.isCollapsed && selShift.rangeCount > 0) {
                    const rngShift = selShift.getRangeAt(0).cloneRange();
                    await aplicarSelecaoECopiar(rngShift, false);
                }
            }, 15);
            return;
        }

        /* Passo 9.5: Arrasto de mouse comum, com Alt (selecao parcial em link/botao/texto) ou com Acumulador (Ctrl+Alt)
         * Preservacao integral da selecao por arrasto em qualquer elemento (inclusive Gemini, links ou botoes),
         * copiando e mantendo o texto selecionado na tela sem qualquer desselecao. */
        if (houveArrastoMouse) {
            houveArrastoMouse = false;
            pontoAncoraArrastoAlt = null;
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
                ignorarProximoClick = true;
                const rangeArrastado = sel.getRangeAt(0).cloneRange();
                await aplicarSelecaoECopiar(rangeArrastado, modoAcumulador);
                return;
            }
        }

        pontoAncoraArrastoAlt = null;

        /* Passo 9.6: Regra da Maozinha (cursor: pointer), Links e Botoes (LINK_CLICAVEL):
         * Cliques comuns em botoes e links de interface tem navegacao e acoes nativas preservadas
         * sem delay quando nao ha teclas modificadoras ativas. Havendo tecla modificadora mantida (ex: Alt ou Ctrl),
         * a selecao forcada e ativada permitindo copiar normalmente. */
        const temModificadorTeclado = temModificadorTecladoAtivo(e);
        if (tipoContexto === 'LINK_CLICAVEL') {
            if (!temModificadorTeclado) {
                ignorarProximoClick = false;
                return;
            }
            garantirSelecaoForcadaEmElemento(e.target);
            ignorarProximoClick = true;
        }

        /* Passo 9.7: Shift + Clique e Solta (Filtro de Digitos/Alfanumericos Corridos c/ Zero-Pad CNJ OU Cursor Inicial -> Final) */
        if (e.shiftKey && !modoAcumulador) {
            const pontoClique = obterPontoDoClique(e.clientX, e.clientY);
            if (!pontoClique) return;

            const mapaCtx = construirMapaTextoBlocoComJanela(pontoClique.no, pontoClique.offset);
            if (!mapaCtx) return;

            /* Se ainda nao ha ancora de Shift, verifica se clicou em entidade contigua (CPF, CNPJ, CNJ, Data, Tel) */
            if (!ancoraCursorShift) {
                const infoEntidade = tentarExpandirPadraoComposto(mapaCtx.texto, mapaCtx.idxCursor, false, false);
                if (infoEntidade && (infoEntidade.suportaFiltroShift || EXPRESSOES_REGULARES.ENTIDADE_FILTRO_SHIFT.test(infoEntidade.grupo || ''))) {
                    const rangeEnt = criarRangeDOMAPartirDeIndices(mapaCtx, infoEntidade.inicio, infoEntidade.fim);
                    if (rangeEnt) {
                        const textoEnt = rangeEnt.toString().trim();
                        const ehCnpjAlfanumerico = REGEX_AUDITORIA.CNPJ_ISOLADO && REGEX_AUDITORIA.CNPJ_ISOLADO.test(textoEnt);
                        let digitosPuros = ehCnpjAlfanumerico
                            ? textoEnt.toUpperCase().replace(EXPRESSOES_REGULARES.NAO_ALFANUMERICO_UPPER, '')
                            : textoEnt.replace(EXPRESSOES_REGULARES.NAO_DIGITOS, '');
                        const matchCnj = textoEnt.match(EXPRESSOES_REGULARES.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL);
                        if (matchCnj && modoShiftCnj !== 'semZeros') {
                            const seqPreenchida = matchCnj[1].padStart(7, '0');
                            digitosPuros = seqPreenchida + digitosPuros.substring(matchCnj[1].length);
                        }
                        if (digitosPuros.length > 0) {
                            await aplicarSelecaoECopiar(rangeEnt, false, digitosPuros);
                            return;
                        }
                    }
                }

                /* Caso nao seja entidade numerica, inicia o cursor no ponto clicado sem marcar nada */
                ancoraCursorShift = { no: pontoClique.no, offset: pontoClique.offset };
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    try {
                        const rColapsado = document.createRange();
                        rColapsado.setStart(pontoClique.no, pontoClique.offset);
                        rColapsado.setEnd(pontoClique.no, pontoClique.offset);
                        sel.addRange(rColapsado);
                    } catch (_) {}
                }
                return;
            } else {
                /* Segundo clique com Shift mantido: expande da ancoraCursorShift ate a palavra/ponto clicado */
                const infoFim = obterRangePalavraOuBlocoNoPonto(e.clientX, e.clientY);
                try {
                    const rangeExpandido = document.createRange();
                    const rangeAncora = document.createRange();
                    rangeAncora.setStart(ancoraCursorShift.no, ancoraCursorShift.offset);
                    rangeAncora.setEnd(ancoraCursorShift.no, ancoraCursorShift.offset);

                    const rangeDestino = infoFim ? infoFim.range : (() => {
                        const r = document.createRange();
                        r.setStart(pontoClique.no, pontoClique.offset);
                        r.setEnd(pontoClique.no, pontoClique.offset);
                        return r;
                    })();

                    if (rangeAncora.compareBoundaryPoints(Range.START_TO_START, rangeDestino) <= 0) {
                        rangeExpandido.setStart(ancoraCursorShift.no, ancoraCursorShift.offset);
                        rangeExpandido.setEnd(rangeDestino.endContainer, rangeDestino.endOffset);
                    } else {
                        rangeExpandido.setStart(rangeDestino.startContainer, rangeDestino.startOffset);
                        rangeExpandido.setEnd(ancoraCursorShift.no, ancoraCursorShift.offset);
                    }
                    await aplicarSelecaoECopiar(rangeExpandido, false);
                } catch (_) {}
                return;
            }
        }

        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            return;
        }

        if (await tentarSelecionarTabelaLinhaOuColuna(e)) {
            ignorarProximoClick = true;
            return;
        }

        /* Passo 9.7.1: Alt + Clique (sem arrasto) sobre links, botoes, menus, abas ou itens clicaveis:
         * inicia nova selecao e seleciona/copia imediatamente o texto inteiro do objeto clicado! */
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.detail === 1) {
            const elInterativo = obterObjetoInterativoParaSelecaoCompleta(e.target);
            if (elInterativo) {
                ignorarProximoClick = true;
                e.preventDefault();
                e.stopPropagation();
                garantirSelecaoForcadaEmElemento(elInterativo);

                if (elInterativo.tagName === 'INPUT') {
                    const textoBotaoInput = (elInterativo.value || elInterativo.getAttribute('value') || '').trim();
                    if (textoBotaoInput.length > 0) {
                        const rangeInput = document.createRange();
                        rangeInput.selectNode(elInterativo);
                        await aplicarSelecaoECopiar(rangeInput, false, textoBotaoInput);
                        return;
                    }
                } else {
                    const textoObjeto = (elInterativo.innerText || elInterativo.textContent || '')
                        .replace(EXPRESSOES_REGULARES.ESPACOS_MULTIPLOS, ' ')
                        .trim();
                    if (textoObjeto.length > 0) {
                        const rangeObjeto = document.createRange();
                        rangeObjeto.selectNodeContents(elInterativo);
                        await aplicarSelecaoECopiar(rangeObjeto, false, textoObjeto);
                        return;
                    }
                }
            }
        }

        const ponto = obterPontoDoClique(e.clientX, e.clientY);
        if (!ponto) return;

        const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
        if (!mapa) {
            if (e.detail >= 3) {
                const bloco = obterBlocoAncestralContextual(e.target);
                if (bloco && bloco !== document.body) {
                    const rangeBloco = document.createRange();
                    rangeBloco.selectNodeContents(bloco);
                    await aplicarSelecaoECopiar(rangeBloco, modoAcumulador);
                }
            }
            return;
        }

        const { texto, idxCursor } = mapa;

        /* Passo 9.7.2: 3 Cliques (e.detail >= 3): tendencia a minorar em blocos compostos ("12.016/2009" -> "12.016" ou "2009")
         * e selecao estritamente localizada ao clicar 3 vezes no inicio de um paragrafo (sem invadir paragrafos vizinhos). */
        if (e.detail >= 3) {
            const resTriplo = resolverSelecaoTriploClique(mapa, idxCursor);
            if (resTriplo) {
                const rangeTriplo = criarRangeDOMAPartirDeIndices(mapa, resTriplo.inicio, resTriplo.fim);
                if (rangeTriplo) {
                    await aplicarSelecaoECopiar(rangeTriplo, modoAcumulador);
                    return;
                }
            }
            const bloco = obterBlocoAncestralContextual(e.target);
            if (bloco && bloco !== document.body) {
                const rangeBloco = document.createRange();
                rangeBloco.selectNodeContents(bloco);
                await aplicarSelecaoECopiar(rangeBloco, modoAcumulador);
            }
            return;
        }

        const ehDuploClique = (e.detail === 2);
        const charNoCursor = texto[idxCursor] || '';
        const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
        const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
            (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));
        const clicouEmDelimitadorOuAspas = eDelimitadorPar(charNoCursor) || eDelimitadorPar(charAnterior) ||
            eCaractereAspas(charNoCursor) || eCaractereAspas(charAnterior);

        let resultadoIndices = null;

        if (ehDuploClique) {
            if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, true);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
            }
            if (!resultadoIndices) {
                resultadoIndices = expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
            }
        } else if (clicouEmDelimitadorOuAspas) {
            resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
        } else if (clicouEmEspaco) {
            resultadoIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, false);
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
            }
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
            }
            if (!resultadoIndices) {
                resultadoIndices = expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
            }
        } else {
            resultadoIndices = tentarExpandirPadraoComposto(texto, idxCursor, false, false);
            if (!resultadoIndices) {
                resultadoIndices = expandirUnidadeAtomicaEstagio1(texto, idxCursor);
            }
        }

        if (!resultadoIndices) return;

        const rangeFinal = criarRangeDOMAPartirDeIndices(mapa, resultadoIndices.inicio, resultadoIndices.fim);
        if (rangeFinal) {
            if (modoAcumulador || e.altKey) {
                ignorarProximoClick = true;
            }
            await aplicarSelecaoECopiar(rangeFinal, modoAcumulador);
        }
    }

    function aoClicar(e) {
        /* DIRETRIZ ROOT IMUTAVEL: Preservacao Absoluta da Navegacao e Interacao Nativa Web.
         * Cliques com botao do meio (button === 1) ou outros botoes nao primarios NUNCA devem
         * ser interceptados no evento click, garantindo abertura nativa de links em novas abas. */
        if (e && e.button !== undefined && e.button !== 0) {
            return;
        }

        /* Cliques comuns sem teclas modificadoras ativas (Alt, Ctrl, Shift, Meta) JAMAIS devem
         * ser interceptados, bloqueados ou suprimidos pelo addon em nenhum site ou aplicacao web. */
        const temModificador = Boolean(e && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey));
        if (!temModificador) {
            ignorarProximoClick = false;
            return;
        }

        /* Passo 9.8.1: Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Permite que o navegador abra o link em nova aba sem cancelamento do clique */
        const elLinkAlvoClick = (e.target && typeof e.target.closest === 'function')
            ? e.target.closest('a[href]')
            : null;
        if (elLinkAlvoClick && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
            ignorarProximoClick = false;
            return;
        }

        if (ignorarProximoClick || (e.ctrlKey && e.altKey) || (e.altKey && !e.ctrlKey && !e.shiftKey) || (e.ctrlKey && !e.altKey && !e.shiftKey)) {
            ignorarProximoClick = false;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
        }
    }

    /*
     * FUNCAO: ehDominioPjeOuJusGov
     * OBJETIVO DE RECONSTRUCAO: Verificar se a URL atual pertence a zona judicial
     * brasileira (*.jus.br, *.gov.br, *.mp.br, *.def.br ou subdominios pje/eproc/projudi).
     */
    function ehDominioPjeOuJusGov(urlStr) {
        try {
            const u = new URL(urlStr || location.href);
            const host = u.hostname.toLowerCase();
            if (host.endsWith('.jus.br') || host.endsWith('.gov.br') || host.endsWith('.mp.br') || host.endsWith('.def.br')) return true;
            if (host.includes('pje') || host.includes('eproc') || host.includes('projudi')) return true;
            return false;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: podeLerClipboard
     * OBJETIVO DE RECONSTRUCAO: Consultar permissao nativa 'clipboard-read'. Em dominios
     * do PJe/jus.br, se em estado 'prompt', permite tentar ler para exibir o dialogo de
     * autorizacao nativo do Chrome; em outros sites, exige permissao previa 'granted'.
     */
    async function podeLerClipboard(ehPje) {
        try {
            if (navigator.permissions && typeof navigator.permissions.query === 'function') {
                const status = await navigator.permissions.query({ name: 'clipboard-read' });
                if (status.state === 'granted') {
                    return true;
                }
                if (status.state === 'prompt') {
                    return ehPje;
                }
                return false;
            }
            return ehPje;
        } catch (_) {
            return ehPje;
        }
    }

    /*
     * FUNCAO: inserirTextoEmElemento
     * OBJETIVO DE RECONSTRUCAO: Inserir texto ou fragmento HTML de forma segura e universal
     * em <input>, <textarea> ou conteudos com contenteditable / editores online.
     */
    function inserirTextoEmElemento(alvo, texto, ehHtmlFormatado) {
        try {
            if (!alvo) return;
            alvo.focus();

            if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') {
                const start = (typeof alvo.selectionStart === 'number') ? alvo.selectionStart : alvo.value.length;
                const end = (typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : alvo.value.length;
                if (typeof alvo.setRangeText === 'function') {
                    alvo.setRangeText(texto, start, end, 'end');
                } else {
                    alvo.value = alvo.value.substring(0, start) + texto + alvo.value.substring(end);
                    alvo.selectionStart = alvo.selectionEnd = start + texto.length;
                }
                try {
                    alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                } catch (_) {}
                return;
            }

            let executou = false;
            try {
                if (ehHtmlFormatado) {
                    executou = document.execCommand('insertHTML', false, texto);
                } else {
                    executou = document.execCommand('insertText', false, texto);
                }
            } catch (_) {}

            if (!executou) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    const node = document.createTextNode(texto);
                    range.insertNode(node);
                    range.setStartAfter(node);
                    range.setEndAfter(node);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
            try {
                alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            } catch (_) {}
        } catch (_) {}
    }

    /*
     * FUNCAO: executarColagemBotaoDireito
     * OBJETIVO DE RECONSTRUCAO: Executar colagem com verificacao online direta do clipboard do sistema:
     * - Sempre tenta primeiro ler da area de transferencia nativa (HTML ou texto);
     * - Em caso de erro ou falta de permissao, realiza fallback inteligente emulando com o ultimo item
     *   copiado pelo plugin, exibindo previamente o erro e o aviso em amarelo "(emulando)".
     */
    async function executarColagemBotaoDireito(alvo, modo) {
        try {
            if (!alvo) return;

            /* Regra: 1 clique com botao direito utiliza formato estilo padrao/avancado;
             * 2 cliques rapidos forcam obrigatoriamente colar SOMENTE TEXTO puro do clipboard. */
            const modoEfetivo = (modo === 'texto_puro') ? 'texto_puro' : 'normal';

            let colou = false;
            let erroOcorrido = null;
            const ehEditorRico = Boolean(alvo.isContentEditable ||
                (alvo.getAttribute && alvo.getAttribute('contenteditable') === 'true') ||
                (alvo.closest && alvo.closest('[contenteditable="true"]')) ||
                document.designMode === 'on');
            const ehCampoTextoPuro = (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || !ehEditorRico);

            /* 1. Verificacao online e direta da area de transferencia nativa (somente se habilitado) */
            if (usarClipboardSistemaAoColar) {
                if (modoEfetivo === 'normal' && ehEditorRico && navigator.clipboard && typeof navigator.clipboard.read === 'function') {
                    try {
                        const itens = await navigator.clipboard.read();
                        if (itens && itens.length > 0) {
                            for (let i = 0; i < itens.length; i++) {
                                const item = itens[i];
                                if (item.types && item.types.includes('text/html')) {
                                    const blob = await item.getType('text/html');
                                    const htmlTexto = await blob.text();
                                    if (htmlTexto && htmlTexto.trim().length > 0) {
                                        alvo.focus();
                                        document.execCommand('insertHTML', false, htmlTexto);
                                        colou = true;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (errRead) {
                        erroOcorrido = errRead.message || 'Acesso restrito ao clipboard';
                    }
                }

                if (!colou && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                    try {
                        const textoPuro = await navigator.clipboard.readText();
                        if (typeof textoPuro === 'string' && textoPuro.length > 0) {
                            inserirTextoEmElemento(alvo, textoPuro, false);
                            colou = true;
                        }
                    } catch (errText) {
                        erroOcorrido = errText.message || 'Falha ao ler area de transferencia';
                    }
                }
            }

            /* 2. Em caso de operacao interna (padrao) ou fallback apos erro nativo: utiliza clipboard interno do addon */
            if (!colou) {
                const itemInterno = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                const textoEmulado = (itemInterno && itemInterno.texto) || ultimoTextoSelecionadoLimpo || '';
                const htmlEmulado = (itemInterno && itemInterno.formatado && itemInterno.html) ? itemInterno.html : '';

                if (textoEmulado && textoEmulado.trim().length > 0) {
                    if (usarClipboardSistemaAoColar) {
                        const validador = window.JusGovAvisoFlutuante;
                        const resumo = textoEmulado.trim().length > 40 ? (textoEmulado.trim().slice(0, 40) + '...') : textoEmulado.trim();
                        const descErro = erroOcorrido ? `Erro de leitura (${erroOcorrido})` : 'Sem permissão na área de transferência';
                        if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                            validador.projetarMiniTipGlobal(`${descErro}: (emulando) [${resumo}]`, '#f59e0b');
                        }
                    }
                    if (ehCampoTextoPuro || modoEfetivo === 'texto_puro') {
                        /* Campo somente texto (input, textarea) ou modo texto puro: SEMPRE cola texto puro */
                        inserirTextoEmElemento(alvo, textoEmulado, false);
                    } else if (modoEfetivo === 'normal' && ehEditorRico && htmlEmulado) {
                        /* Editor Web / HTML / RTF / contenteditable: cola com formatacao */
                        if (!usarClipboardSistemaAoColar) {
                            emularTeclasColar(alvo, textoEmulado, htmlEmulado);
                        } else {
                            inserirTextoEmElemento(alvo, htmlEmulado, true);
                        }
                    } else {
                        inserirTextoEmElemento(alvo, textoEmulado, false);
                    }
                    colou = true;
                }
                /* Se der qualquer erro ou falta de acesso e nao houver texto emulado para colar:
                 * 'Fazer nada' silenciosamente, sem exibir alertas de erro intrusivos ao usuario. */
            }
        } catch (_) {}
    }

    /*
     * FUNCAO: aoClicarAuxiliarMouse
     * OBJETIVO DE RECONSTRUCAO: Neutralizar o comportamento de navegacao de historico
     * nativo nos botoes 4 e 5 (botoes laterais do mouse) em auxclick e despachar navegacao de abas.
     */
    function aoClicarAuxiliarMouse(e) {
        if (capturaBotoesMouse4e5Ativa) {
            tratarNavegacaoAbasPorBotoesMouse(e);
        }
        /* Modulo MOUSE: Botao do meio (scroll click) */
        if (e.button === 1) {
            /* Regra fundamental: Preservar navegacao nativa do navegador (abrir link em nova aba).
             * Nunca interceptar o evento auxclick sobre <a href>. */
            const elLinkMeio = (e.target && typeof e.target.closest === 'function')
                ? e.target.closest('a[href]')
                : null;
            if (elLinkMeio) {
                return;
            }

            /* Se colarBotaoMeioAtivo estiver desabilitado, não intercepta o evento auxclick */
            if (!colarBotaoMeioAtivo) {
                return;
            }

            const ctxMeio = classificarContextoElementoAlvo(e.target);
            const alvo = (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL')
                ? ((e.target && typeof e.target.closest === 'function') ? (e.target.closest('input') || e.target) : e.target)
                : e.target;

            /* Rollback com Colagem: Ctrl + Botao do Meio */
            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                if (colarBotaoMeioAtivo && historicoClipboardCtrlMeioAtivo) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        executarRollbackEColagem(alvo, e);
                    } catch (_) {}
                    return;
                }
            }

            /* Colagem normal com o botao do meio */
            if (colarBotaoMeioAtivo) {
                e.preventDefault();
                e.stopPropagation();
                if (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL' || ctxMeio === 'EDITOR_MULTILINHA_EDITAVEL') {
                    try {
                        executarColagemBotaoDireito(alvo, 'normal');
                    } catch (_) {}
                }
                /* Se der qualquer erro ou elemento nao for editavel: 'fazer nada' silenciosamente */
                return;
            }
        }
    }

    function aoAbrirMenuContexto(e) {
        if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        /* Garantia absoluta de correcao de textos e menus nativos do navegador:
         * 1) Na pagina de opcoes da extensao, liberar apenas dentro dos campos de teste editaveis.
         * 2) Se colagemBotaoDireitoAtiva estiver desativado (padrao), nunca interceptar.
         * 3) Se a tecla Shift estiver pressionada ao clicar com botao direito, nunca interceptar. */
        const ehAmbienteOpcoes = (typeof location !== 'undefined' && (location.protocol === 'chrome-extension:' || (location.pathname && location.pathname.includes('options.html'))));
        if (ehAmbienteOpcoes && !e.target.closest('.editable-demo, #textareaMinutasDemo, #editorHtmlOnlineDemo, #demoInputAlternancia, .linha-campos-entrada, input, textarea, [contenteditable]')) {
            return;
        }

        if (!colarBotaoMeioAtivo || !colagemBotaoDireitoAtiva) return;

        if (e.shiftKey) {
            return;
        }

        const tipoContexto = classificarContextoElementoAlvo(e.target);
        if (tipoContexto !== 'CAMPO_SIMPLES_EDITAVEL' && tipoContexto !== 'EDITOR_MULTILINHA_EDITAVEL') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const alvo = (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL')
            ? ((e.target && typeof e.target.closest === 'function') ? (e.target.closest('input') || e.target) : e.target)
            : e.target;

        const agora = Date.now();
        const diff = agora - ultimoCliqueDireitoTimestamp;
        ultimoCliqueDireitoTimestamp = agora;

        if (diff < 350 && timerCliqueDireitoColagem) {
            clearTimeout(timerCliqueDireitoColagem);
            timerCliqueDireitoColagem = null;
            executarColagemBotaoDireito(alvo, 'texto_puro');
        } else {
            if (timerCliqueDireitoColagem) {
                clearTimeout(timerCliqueDireitoColagem);
            }
            timerCliqueDireitoColagem = setTimeout(() => {
                timerCliqueDireitoColagem = null;
                executarColagemBotaoDireito(alvo, 'normal');
            }, 300);
        }
    }

    /* Passo 9.9.5: Desselecao Universal Profunda e Multi-Frame
     * O porque: Em paginas juridicas com multiplos iframes (PJe, eproc, visualizadores de PDF),
     * containers de rolagem independentes, divs contenteditable e inputs/textareas, window.getSelection()
     * comum alcanca apenas a janela local. Esta rotina executa todas as funcoes nativas de desselecao
     * (empty, removeAllRanges, execCommand('unselect'), collapseToStart e setSelectionRange(0, 0)),
     * varre recursivamente toda a arvore de quadros (frames/iframes/shadowRoots) e transmite broadcast
     * entre frames isolados via Service Worker. */
    function deselecionarTudoEmContexto(win, doc) {
        if (!win || !doc) return;
        try {
            /* 1. Selection API Nativa do Window */
            const s = (typeof win.getSelection === 'function') ? win.getSelection() : null;
            if (s) {
                if (typeof s.empty === 'function') {
                    try { s.empty(); } catch (_) {}
                }
                if (typeof s.removeAllRanges === 'function') {
                    try { s.removeAllRanges(); } catch (_) {}
                }
                if (s.rangeCount > 0 && typeof s.collapseToStart === 'function') {
                    try { s.collapseToStart(); } catch (_) {}
                }
            }
        } catch (_) {}

        try {
            /* 2. Funcao Nativa do Documento execCommand('unselect') */
            if (typeof doc.execCommand === 'function') {
                try { doc.execCommand('unselect'); } catch (_) {}
            }
        } catch (_) {}

        try {
            /* 3. Limpeza de Elemento Ativo e Desselecao de Inputs/Textareas */
            const elemAtivo = doc.activeElement;
            if (elemAtivo) {
                if (typeof elemAtivo.setSelectionRange === 'function') {
                    try { elemAtivo.setSelectionRange(0, 0); } catch (_) {}
                }
                if (elemAtivo.blur && (elemAtivo.tagName === 'INPUT' || elemAtivo.tagName === 'TEXTAREA' || elemAtivo.isContentEditable)) {
                    try { elemAtivo.blur(); } catch (_) {}
                }
            }
            if (doc.querySelectorAll) {
                const campos = doc.querySelectorAll('input, textarea');
                for (let i = 0; i < campos.length; i++) {
                    const c = campos[i];
                    if (c && typeof c.selectionStart === 'number' && c.selectionStart !== c.selectionEnd) {
                        try { c.setSelectionRange(0, 0); } catch (_) {}
                    }
                }
            }
        } catch (_) {}

        try {
            /* 4. Shadow Roots Acessiveis no Documento */
            if (doc.querySelectorAll) {
                const elementos = doc.querySelectorAll('*');
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (el && el.shadowRoot) {
                        try {
                            if (typeof el.shadowRoot.getSelection === 'function') {
                                const sSh = el.shadowRoot.getSelection();
                                if (sSh) {
                                    if (typeof sSh.empty === 'function') sSh.empty();
                                    if (typeof sSh.removeAllRanges === 'function') sSh.removeAllRanges();
                                }
                            }
                        } catch (_) {}
                    }
                }
            }
        } catch (_) {}
    }

    function executarDeselecaoUniversal(origemRemota = false) {
        /* Passo 9.9.6: Executa desselecao no contexto local */
        deselecionarTudoEmContexto(window, document);

        /* Passo 9.9.7: Varre toda a arvore local de iframes e frames */
        try {
            if (document.querySelectorAll) {
                const quadros = document.querySelectorAll('iframe, frame');
                for (let i = 0; i < quadros.length; i++) {
                    try {
                        const q = quadros[i];
                        const docQ = q.contentDocument || (q.contentWindow && q.contentWindow.document);
                        const winQ = q.contentWindow;
                        if (winQ && docQ) {
                            deselecionarTudoEmContexto(winQ, docQ);
                            if (docQ.querySelectorAll) {
                                const subQuadros = docQ.querySelectorAll('iframe, frame');
                                for (let j = 0; j < subQuadros.length; j++) {
                                    try {
                                        const sq = subQuadros[j];
                                        const subDoc = sq.contentDocument || (sq.contentWindow && sq.contentWindow.document);
                                        const subWin = sq.contentWindow;
                                        if (subWin && subDoc) {
                                            deselecionarTudoEmContexto(subWin, subDoc);
                                        }
                                    } catch (_) {}
                                }
                            }
                        }
                    } catch (_) {}
                }
            }
        } catch (_) {}

        /* Passo 9.9.8: Se executado dentro de iframe, desseleciona parent e top */
        try {
            if (window.parent && window.parent !== window) {
                deselecionarTudoEmContexto(window.parent, window.parent.document);
            }
        } catch (_) {}
        try {
            if (window.top && window.top !== window && window.top !== window.parent) {
                deselecionarTudoEmContexto(window.top, window.top.document);
            }
        } catch (_) {}

        /* Passo 9.9.9: Limpeza de estados internos, acumulador, alertas e contornos flash */
        ancoraCursorShift = null;
        ultimoTextoSelecionadoLimpo = '';
        ultimoRangeSelecionadoSimples = null;
        teclasPressionadasAtivas.clear();
        limparFlashBorderImediatamente();
        if (acumulador && acumulador.obterQuantidade() > 0) {
            acumulador.limpar();
        }
        if (validador && typeof validador.limparAlertaVisual === 'function') {
            validador.limparAlertaVisual();
        }

        /* Passo 9.9.10: Transmissao broadcast entre todos os frames da aba via Service Worker */
        if (!origemRemota) {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ acao: 'broadcastDeselecionarGeral' }, () => {
                        if (chrome.runtime && chrome.runtime.lastError) {}
                    });
                }
            } catch (_) {}
        }
    }

    function aoPressionarTecla(e) {
        if (e && e.key && e.key !== 'Escape') {
            teclasPressionadasAtivas.add(String(e.key).toLowerCase());
        }

        /* Passo 9.8: Tecla Shift exclusiva limpa selecao existente e reinicia marcacao de cursor */
        if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.repeat) {
            ancoraCursorShift = null;
            const tipoCtxAtivo = classificarContextoElementoAlvo(document.activeElement);
            if (tipoCtxAtivo === 'LEITURA_COMUM') {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                    sel.removeAllRanges();
                }
            }
            return;
        }

        /* Passo 9.9: Atalho Inteligente F1 -> Localizar no Google Gemini com ou sem selecao */
        if (e.key === 'F1' || e.code === 'F1') {
            if (!atalhoF1GeminiAtivo) return;
            e.preventDefault();
            e.stopPropagation();

            let textoSelecionadoF1 = '';
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
                textoSelecionadoF1 = higienizarTextoParaCopia(sel.toString());
            } else if (ultimoTextoSelecionadoLimpo && ultimoTextoSelecionadoLimpo.trim().length > 0) {
                textoSelecionadoF1 = ultimoTextoSelecionadoLimpo.trim();
            } else {
                const elemAtivo = document.activeElement;
                if (elemAtivo && (elemAtivo.tagName === 'INPUT' || elemAtivo.tagName === 'TEXTAREA') && typeof elemAtivo.selectionStart === 'number') {
                    const txtInput = elemAtivo.value.substring(elemAtivo.selectionStart, elemAtivo.selectionEnd);
                    if (txtInput && txtInput.trim().length > 0) {
                        textoSelecionadoF1 = higienizarTextoParaCopia(txtInput);
                    }
                }
            }

            const templatePrompt = (typeof promptF1Gemini === 'string' && promptF1Gemini.trim().length > 0)
                ? promptF1Gemini.trim()
                : PROMPT_F1_GEMINI_PADRAO;

            if (textoSelecionadoF1.length > 0) {
                const promptF1 = templatePrompt.includes('{{TEXTO}}')
                    ? templatePrompt.replace(/\{\{TEXTO\}\}/g, textoSelecionadoF1)
                    : `'${textoSelecionadoF1}' :  ${templatePrompt}`;

                /* O prompt e inserido diretamente na caixa do Gemini via background script (preencherPromptGemini),
                 * preservando intacto o conteudo da area de transferencia do usuario. */
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ acao: 'abrirGeminiLateral', modo: 'flash', prompt: promptF1 }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                                try { window.open('https://gemini.google.com/app', '_blank'); } catch (_) {}
                            }
                        });
                    } else {
                        window.open('https://gemini.google.com/app', '_blank');
                    }
                } catch (_) {
                    try { window.open('https://gemini.google.com/app', '_blank'); } catch (__) {}
                }

                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    validador.projetarMiniTipGlobal('Abrindo assistente de IA Gemini...', '#2563eb');
                }
            } else {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ acao: 'abrirGeminiLateral', modo: 'flash', prompt: '' }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                                try { window.open('https://gemini.google.com/app', '_blank'); } catch (_) {}
                            }
                        });
                    } else {
                        window.open('https://gemini.google.com/app', '_blank');
                    }
                } catch (_) {
                    try { window.open('https://gemini.google.com/app', '_blank'); } catch (__) {}
                }

                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    validador.projetarMiniTipGlobal('Abrindo assistente de IA...', '#3b82f6');
                }
            }
            return;
        }

        /* Modulo TECLADO/MOUSE: Navegacao entre campos de entrada usando setas do teclado (Seta Baixo / Seta Cima) */
        if (navegacaoTecladoCamposAtiva && !e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Down' || e.key === 'Up')) {
            const elAtivo = (document.activeElement && document.activeElement.tagName === 'INPUT')
                ? document.activeElement
                : ((e.target && e.target.tagName === 'INPUT') ? e.target : null);
            if (elAtivo) {
                const tipoEl = classificarContextoElementoAlvo(elAtivo);
                if (tipoEl === 'CAMPO_SIMPLES_EDITAVEL') {
                    const direcao = (e.key === 'ArrowDown' || e.key === 'Down') ? 1 : -1;
                    if (navegarEntreCamposEntrada(elAtivo, direcao)) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
            }
        }

        /* Passo 9.10: Tecla Escape (limpa selecao universalmente, acumulador e alertas na tela, sem zerar clipboard) */
        if (e.key === 'Escape') {
            /* Ignora repeticao automatica de tecla mantida pressionada */
            if (e.repeat) return;

            /* Regra 4: Esc ao editar campo simples sai do foco e fica como se nunca tivesse sido selecionado */
            const elAtivo = (document.activeElement && document.activeElement.tagName === 'INPUT')
                ? document.activeElement
                : ((e.target && e.target.tagName === 'INPUT') ? e.target : null);
            if (elAtivo) {
                const tipoEl = classificarContextoElementoAlvo(elAtivo);
                if (tipoEl === 'CAMPO_SIMPLES_EDITAVEL') {
                    inputsJaSelecionadosInicialmente.delete(elAtivo);
                    elAtivo.__jusgovSelecionadoInicial = false;
                    try { elAtivo.blur(); } catch (_) {}
                }
            }

            executarDeselecaoUniversal(false);

            const agora = performance.now();
            const intervaloMs = agora - ultimoTimestampEsc;

            /* Valida estritamente 2 Escs sequenciais rapidos: intervalo entre 60ms e JANELA_DUPLO_ESC_MS (420ms) */
            if (ultimoTimestampEsc > 0 && intervaloMs >= 60 && intervaloMs <= CONFIGURACAO_MOTOR.JANELA_DUPLO_ESC_MS) {
                ultimoTimestampEsc = 0;
                manterFormatacaoBasica = !manterFormatacaoBasica;

                try {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                        chrome.storage.sync.set({ manterFormatacaoBasica }).catch(() => {});
                    }
                } catch (_) {}

                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    const norm = normalizarNivelFiltro(nivelFiltroFormatacao);
                    let rotuloNivel = 'Estilos Basicos (Inline)';
                    if (norm === 'intermediario') rotuloNivel = 'Estilos Intermediarios (Paragrafo)';
                    else if (norm === 'avancado') rotuloNivel = 'Estilos Avancados (Documental)';
                    else if (norm === 'estendido') rotuloNivel = 'Estilos Extendidos (Office)';

                    const msgModo = manterFormatacaoBasica
                        ? `Remover Formatacoes: DESATIVADO (${rotuloNivel})`
                        : 'Remover Formatacoes: ATIVADO (Somente Texto)';
                    const corBorda = manterFormatacaoBasica ? '#10b981' : '#3b82f6';
                    validador.projetarMiniTipGlobal(msgModo, corBorda);
                }
            } else {
                ultimoTimestampEsc = agora;
            }
            return;
        }
    }

    function aoSoltarTecla(e) {
        if (e && e.key) {
            teclasPressionadasAtivas.delete(String(e.key).toLowerCase());
        }
        if (e && !e.ctrlKey) teclasPressionadasAtivas.delete('control');
        if (e && !e.altKey) teclasPressionadasAtivas.delete('alt');
        if (e && !e.shiftKey) teclasPressionadasAtivas.delete('shift');
        if (e && !e.metaKey) teclasPressionadasAtivas.delete('meta');
        if (e.key === 'Shift') {
            ancoraCursorShift = null;
        }
        window.__JUSGOV_MODO_BARALHO__ = Boolean(e.ctrlKey && e.altKey && e.shiftKey);
    }

    /* ==========================================================================
     * SECAO 10: INICIALIZACAO, ABORTCONTROLLER E SINCRONIZACAO COM SERVICE WORKER
     * ========================================================================== */
    function registrarListenersDOM() {
        if (controladorCicloVida) {
            try { controladorCicloVida.abort(); } catch (_) {}
        }
        controladorCicloVida = new AbortController();
        window.__JUSGOV_ABORT_CONTROLLER__ = controladorCicloVida;
        const signal = controladorCicloVida.signal;

        blindarCSS();

        window.addEventListener('pointerdown', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('mousedown', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('pointerup', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('mouseup', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('auxclick', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('keydown', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        window.addEventListener('keyup', tratarNavegacaoAbasPorBotoesMouse, { capture: true, signal });
        document.addEventListener('mousedown', aoPressionarBotaoMouse, { capture: true, signal });
        document.addEventListener('mousemove', aoMoverMouse, { capture: true, passive: true, signal });
        document.addEventListener('mouseup', aoSoltarBotaoMouse, { capture: true, signal });
        document.addEventListener('focusin', lidarFocoInteligente, { capture: true, signal });
        document.addEventListener('auxclick', aoClicarAuxiliarMouse, { capture: true, signal });
        document.addEventListener('click', aoClicar, { capture: true, signal });
        document.addEventListener('dblclick', (e) => {
            if (!selecaoEditavelAtiva) return;
            const tipo = classificarContextoElementoAlvo(e.target);
            if (tipo === 'CAMPO_SIMPLES_EDITAVEL') {
                const inp = (e.target && typeof e.target.closest === 'function')
                    ? (e.target.closest('input') || e.target)
                    : e.target;
                if (inp && typeof inp.select === 'function') {
                    try { inp.select(); } catch (_) {}
                }
            }
        }, { capture: true, signal });
        document.addEventListener('contextmenu', aoAbrirMenuContexto, { capture: true, signal });
        window.addEventListener('keydown', aoPressionarTecla, { capture: true, signal });
        window.addEventListener('help', (e) => {
            if (atalhoF1GeminiAtivo) {
                e.preventDefault();
            }
        }, { capture: true, signal });
        window.addEventListener('keyup', aoSoltarTecla, { capture: true, passive: true, signal });
        document.addEventListener('selectionchange', () => {
            if (!aguardandoDesselecaoFlash) return;
            if ((performance.now() - timestampCriacaoFlash) < 40) return;
            const selAtual = window.getSelection();
            if (!selAtual || selAtual.rangeCount === 0 || selAtual.isCollapsed || selAtual.toString().trim().length === 0) {
                agendarRetiradaFlashAposDesselecao();
            }
        }, { passive: true, signal });
        window.addEventListener('blur', () => {
            botaoLateralEmProcessamento = 0;
            teclasPressionadasAtivas.clear();
            agendarRetiradaFlashAposDesselecao();
        }, { passive: true, signal });
        window.addEventListener('scroll', () => {
            if (aguardandoDesselecaoFlash || timerFlashBorder) {
                limparFlashBorderImediatamente();
            }
        }, { passive: true, signal });
        window.addEventListener('keydown', (e) => {
            window.__JUSGOV_MODO_BARALHO__ = Boolean(e.ctrlKey && e.altKey && e.shiftKey);
        }, { capture: true, passive: true, signal });
    }

    function inicializarModulo() {
        registrarListenersDOM();

        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.get([
                    'modoTurbo',
                    'urlsTurbo',
                    'manterFormatacaoBasica',
                    'nivelFiltroFormatacao',
                    'selecaoEditavelAtiva',
                    'modoPlaceholdersMinutasHtml',
                    'placeholdersMinutasHtmlAtivo',
                    'colagemBotaoDireitoAtiva',
                    'capturaBotoesMouse4e5Ativa',
                    'colarBotaoMeioAtivo',
                    'usarClipboardSistemaAoColar',
                    'navegacaoTecladoCamposAtiva',
                    'validacaoMatematicaAtiva',
                    'tempoFlashBorderMs',
                    'corFlashBorder',
                    'separadorAcumulador',
                    'incluirSeparadorFinalAcumulador',
                    'separadorTabelas',
                    'modoShiftCnj',
                    'promptF1Gemini',
                    'converterCabecalhoPjeAtivo',
                    'atalhoF1GeminiAtivo',
                    'ativoAmpuletas',
                    'tempoExibicaoAlertaMs'
                ], (cfg) => {
                    if (chrome.runtime && chrome.runtime.lastError) return;
                    if (cfg) {
                        if (cfg.modoTurbo) modoExecucao = cfg.modoTurbo;
                        if (Array.isArray(cfg.urlsTurbo)) listaUrlsPermitidas = cfg.urlsTurbo;
                        if (typeof cfg.manterFormatacaoBasica === 'boolean') {
                            manterFormatacaoBasica = cfg.manterFormatacaoBasica;
                        }
                        if (typeof cfg.nivelFiltroFormatacao === 'string' && ['basico', 'avancado', 'sem_filtro'].includes(cfg.nivelFiltroFormatacao)) {
                            nivelFiltroFormatacao = cfg.nivelFiltroFormatacao;
                        }
                        if (typeof cfg.selecaoEditavelAtiva === 'boolean') {
                            selecaoEditavelAtiva = cfg.selecaoEditavelAtiva;
                        }
                        if (typeof cfg.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(cfg.modoPlaceholdersMinutasHtml)) {
                            modoPlaceholdersMinutasHtml = cfg.modoPlaceholdersMinutasHtml;
                            placeholdersMinutasHtmlAtivo = (cfg.modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (typeof cfg.placeholdersMinutasHtmlAtivo === 'boolean') {
                            placeholdersMinutasHtmlAtivo = cfg.placeholdersMinutasHtmlAtivo;
                            modoPlaceholdersMinutasHtml = cfg.placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                        }
                        if (typeof cfg.colagemBotaoDireitoAtiva === 'boolean') {
                            colagemBotaoDireitoAtiva = cfg.colagemBotaoDireitoAtiva;
                        }
                        if (typeof cfg.capturaBotoesMouse4e5Ativa === 'boolean') {
                            capturaBotoesMouse4e5Ativa = cfg.capturaBotoesMouse4e5Ativa;
                        }
                        if (typeof cfg.colarBotaoMeioAtivo === 'boolean') {
                            colarBotaoMeioAtivo = cfg.colarBotaoMeioAtivo;
                        } else if (cfg.colarBotaoMeioAtivo === undefined) {
                            colarBotaoMeioAtivo = true;
                        }
                        if (typeof cfg.usarClipboardSistemaAoColar === 'boolean') {
                            usarClipboardSistemaAoColar = cfg.usarClipboardSistemaAoColar;
                        } else {
                            usarClipboardSistemaAoColar = false;
                        }
                        if (typeof cfg.historicoClipboardCtrlMeioAtivo === 'boolean') {
                            historicoClipboardCtrlMeioAtivo = cfg.historicoClipboardCtrlMeioAtivo;
                        } else if (typeof cfg.historicoClipboardCtrlDireitoAtivo === 'boolean') {
                            historicoClipboardCtrlMeioAtivo = cfg.historicoClipboardCtrlDireitoAtivo;
                        }
                        if (typeof cfg.navegacaoTecladoCamposAtiva === 'boolean') {
                            navegacaoTecladoCamposAtiva = cfg.navegacaoTecladoCamposAtiva;
                        }
                        if (typeof cfg.validacaoMatematicaAtiva === 'boolean') {
                            validacaoMatematicaAtiva = cfg.validacaoMatematicaAtiva;
                        }
                        if (cfg.tempoFlashBorderMs !== undefined) {
                            const tFlash = Number(cfg.tempoFlashBorderMs);
                            tempoFlashBorderMs = (Number.isFinite(tFlash) && tFlash >= 0 && tFlash <= 5000) ? tFlash : 500;
                        } else if (typeof cfg.flashBorderAtivo === 'boolean') {
                            tempoFlashBorderMs = cfg.flashBorderAtivo ? 500 : 0;
                        }
                        if (typeof cfg.corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corFlashBorder.trim())) {
                            corFlashBorder = cfg.corFlashBorder.trim().toLowerCase();
                        }
                        if (typeof cfg.converterCabecalhoPjeAtivo === 'boolean') {
                            converterCabecalhoPjeAtivo = cfg.converterCabecalhoPjeAtivo;
                        }
                        if (typeof cfg.atalhoF1GeminiAtivo === 'boolean') {
                            atalhoF1GeminiAtivo = cfg.atalhoF1GeminiAtivo;
                        }
                        if (typeof cfg.modoShiftCnj === 'string') {
                            modoShiftCnj = cfg.modoShiftCnj;
                        }
                        if (typeof cfg.promptF1Gemini === 'string' && cfg.promptF1Gemini.trim().length > 0) {
                            promptF1Gemini = cfg.promptF1Gemini.trim();
                        }
                        if (typeof cfg.ativoAmpuletas === 'boolean') {
                            ativoAmpuletas = cfg.ativoAmpuletas;
                        }
                        blindarCSS();
                        if (cfg.tempoExibicaoAlertaMs !== undefined && validador && typeof validador.definirTempoExibicao === 'function') {
                            validador.definirTempoExibicao(cfg.tempoExibicaoAlertaMs);
                        }
                        if (typeof cfg.separadorAcumulador === 'string' && acumulador && typeof acumulador.definirSeparador === 'function') {
                            acumulador.definirSeparador(cfg.separadorAcumulador);
                        }
                        if (typeof cfg.incluirSeparadorFinalAcumulador === 'boolean') {
                            incluirSeparadorFinalAcumulador = cfg.incluirSeparadorFinalAcumulador;
                            if (acumulador && typeof acumulador.definirSeparadorFinal === 'function') {
                                acumulador.definirSeparadorFinal(incluirSeparadorFinalAcumulador);
                            }
                        }
                        if (typeof cfg.separadorTabelas === 'string') {
                            separadorTabelas = cfg.separadorTabelas;
                            if (acumulador && typeof acumulador.definirSeparadorTabela === 'function') {
                                acumulador.definirSeparadorTabela(separadorTabelas);
                            }
                        }
                    }
                });

                chrome.storage.onChanged.addListener((changes, area) => {
                    if (area === 'sync') {
                        if (changes.modoTurbo) modoExecucao = changes.modoTurbo.newValue;
                        if (changes.urlsTurbo) listaUrlsPermitidas = changes.urlsTurbo.newValue || [];
                        if (changes.manterFormatacaoBasica !== undefined) {
                            manterFormatacaoBasica = Boolean(changes.manterFormatacaoBasica.newValue);
                        }
                        if (changes.nivelFiltroFormatacao !== undefined && typeof changes.nivelFiltroFormatacao.newValue === 'string') {
                            nivelFiltroFormatacao = changes.nivelFiltroFormatacao.newValue;
                        }
                        if (changes.selecaoEditavelAtiva !== undefined) {
                            selecaoEditavelAtiva = (changes.selecaoEditavelAtiva.newValue !== false);
                        }
                        if (changes.modoPlaceholdersMinutasHtml !== undefined && typeof changes.modoPlaceholdersMinutasHtml.newValue === 'string') {
                            modoPlaceholdersMinutasHtml = changes.modoPlaceholdersMinutasHtml.newValue;
                            placeholdersMinutasHtmlAtivo = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (changes.placeholdersMinutasHtmlAtivo !== undefined) {
                            placeholdersMinutasHtmlAtivo = (changes.placeholdersMinutasHtmlAtivo.newValue !== false);
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                            }
                        }
                        if (changes.colagemBotaoDireitoAtiva !== undefined) {
                            colagemBotaoDireitoAtiva = (changes.colagemBotaoDireitoAtiva.newValue !== false);
                        }
                        if (changes.capturaBotoesMouse4e5Ativa !== undefined) {
                            capturaBotoesMouse4e5Ativa = (changes.capturaBotoesMouse4e5Ativa.newValue !== false);
                        }
                        if (changes.colarBotaoMeioAtivo !== undefined) {
                            colarBotaoMeioAtivo = (changes.colarBotaoMeioAtivo.newValue !== false);
                        }
                        if (changes.usarClipboardSistemaAoColar !== undefined) {
                            usarClipboardSistemaAoColar = Boolean(changes.usarClipboardSistemaAoColar.newValue);
                        }
                        if (changes.historicoClipboardCtrlMeioAtivo !== undefined) {
                            historicoClipboardCtrlMeioAtivo = (changes.historicoClipboardCtrlMeioAtivo.newValue !== false);
                        } else if (changes.historicoClipboardCtrlDireitoAtivo !== undefined) {
                            historicoClipboardCtrlMeioAtivo = (changes.historicoClipboardCtrlDireitoAtivo.newValue !== false);
                        }
                        if (changes.navegacaoTecladoCamposAtiva !== undefined) {
                            navegacaoTecladoCamposAtiva = (changes.navegacaoTecladoCamposAtiva.newValue !== false);
                        }
                        if (changes.validacaoMatematicaAtiva !== undefined) {
                            validacaoMatematicaAtiva = (changes.validacaoMatematicaAtiva.newValue !== false);
                        }
                        if (changes.tempoFlashBorderMs !== undefined) {
                            const tFlashNovo = Number(changes.tempoFlashBorderMs.newValue);
                            tempoFlashBorderMs = (Number.isFinite(tFlashNovo) && tFlashNovo >= 0 && tFlashNovo <= 5000) ? tFlashNovo : 500;
                        } else if (changes.flashBorderAtivo !== undefined) {
                            tempoFlashBorderMs = changes.flashBorderAtivo.newValue ? 500 : 0;
                        }
                        if (changes.corFlashBorder !== undefined && typeof changes.corFlashBorder.newValue === 'string' && /^#[0-9a-fA-F]{6}$/.test(changes.corFlashBorder.newValue.trim())) {
                            corFlashBorder = changes.corFlashBorder.newValue.trim().toLowerCase();
                        }
                        if (changes.converterCabecalhoPjeAtivo !== undefined) {
                            converterCabecalhoPjeAtivo = (changes.converterCabecalhoPjeAtivo.newValue !== false);
                        }
                        if (changes.atalhoF1GeminiAtivo !== undefined) {
                            atalhoF1GeminiAtivo = (changes.atalhoF1GeminiAtivo.newValue !== false);
                        }
                        if (changes.modoShiftCnj !== undefined && typeof changes.modoShiftCnj.newValue === 'string') {
                            modoShiftCnj = changes.modoShiftCnj.newValue;
                        }
                        if (changes.promptF1Gemini !== undefined && typeof changes.promptF1Gemini.newValue === 'string') {
                            promptF1Gemini = changes.promptF1Gemini.newValue.trim() || PROMPT_F1_GEMINI_PADRAO;
                        }
                        if (changes.tempoExibicaoAlertaMs !== undefined && validador && typeof validador.definirTempoExibicao === 'function') {
                            validador.definirTempoExibicao(changes.tempoExibicaoAlertaMs.newValue);
                        }
                        if (changes.separadorAcumulador !== undefined && acumulador && typeof acumulador.definirSeparador === 'function') {
                            acumulador.definirSeparador(changes.separadorAcumulador.newValue);
                        }
                        if (changes.incluirSeparadorFinalAcumulador !== undefined) {
                            incluirSeparadorFinalAcumulador = (changes.incluirSeparadorFinalAcumulador.newValue !== false);
                            if (acumulador && typeof acumulador.definirSeparadorFinal === 'function') {
                                acumulador.definirSeparadorFinal(incluirSeparadorFinalAcumulador);
                            }
                        }
                        if (changes.separadorTabelas !== undefined && typeof changes.separadorTabelas.newValue === 'string') {
                            separadorTabelas = changes.separadorTabelas.newValue;
                            if (acumulador && typeof acumulador.definirSeparadorTabela === 'function') {
                                acumulador.definirSeparadorTabela(separadorTabelas);
                            }
                        }
                        if (changes.ativoAmpuletas !== undefined) {
                            ativoAmpuletas = (changes.ativoAmpuletas.newValue !== false);
                            blindarCSS();
                        }
                    }
                });
            }

            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((msg) => {
                    if (msg && msg.acao === 'executarDeselecaoGeral') {
                        executarDeselecaoUniversal(true);
                        return;
                    }
                    if (msg && msg.acao === 'atualizarEstadoModulo') {
                        if (msg.modoTurbo) modoExecucao = msg.modoTurbo;
                        if (Array.isArray(msg.urlsTurbo)) listaUrlsPermitidas = msg.urlsTurbo;
                        if (typeof msg.manterFormatacaoBasica === 'boolean') {
                            manterFormatacaoBasica = msg.manterFormatacaoBasica;
                        }
                        if (typeof msg.nivelFiltroFormatacao === 'string') {
                            nivelFiltroFormatacao = msg.nivelFiltroFormatacao;
                        }
                        if (typeof msg.selecaoEditavelAtiva === 'boolean') {
                            selecaoEditavelAtiva = msg.selecaoEditavelAtiva;
                        }
                        if (typeof msg.modoPlaceholdersMinutasHtml === 'string') {
                            modoPlaceholdersMinutasHtml = msg.modoPlaceholdersMinutasHtml;
                            placeholdersMinutasHtmlAtivo = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (typeof msg.placeholdersMinutasHtmlAtivo === 'boolean') {
                            placeholdersMinutasHtmlAtivo = msg.placeholdersMinutasHtmlAtivo;
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                            }
                        }
                        if (typeof msg.colagemBotaoDireitoAtiva === 'boolean') {
                            colagemBotaoDireitoAtiva = msg.colagemBotaoDireitoAtiva;
                        }
                        if (typeof msg.capturaBotoesMouse4e5Ativa === 'boolean') {
                            capturaBotoesMouse4e5Ativa = msg.capturaBotoesMouse4e5Ativa;
                        }
                        if (typeof msg.colarBotaoMeioAtivo === 'boolean') {
                            colarBotaoMeioAtivo = msg.colarBotaoMeioAtivo;
                        }
                        if (typeof msg.usarClipboardSistemaAoColar === 'boolean') {
                            usarClipboardSistemaAoColar = msg.usarClipboardSistemaAoColar;
                        }
                        if (typeof msg.historicoClipboardCtrlMeioAtivo === 'boolean') {
                            historicoClipboardCtrlMeioAtivo = msg.historicoClipboardCtrlMeioAtivo;
                        } else if (typeof msg.historicoClipboardCtrlDireitoAtivo === 'boolean') {
                            historicoClipboardCtrlMeioAtivo = msg.historicoClipboardCtrlDireitoAtivo;
                        }
                        if (typeof msg.navegacaoTecladoCamposAtiva === 'boolean') {
                            navegacaoTecladoCamposAtiva = msg.navegacaoTecladoCamposAtiva;
                        }
                        if (typeof msg.validacaoMatematicaAtiva === 'boolean') {
                            validacaoMatematicaAtiva = msg.validacaoMatematicaAtiva;
                        }
                        if (msg.tempoFlashBorderMs !== undefined) {
                            const tFlashMsg = Number(msg.tempoFlashBorderMs);
                            tempoFlashBorderMs = (Number.isFinite(tFlashMsg) && tFlashMsg >= 0 && tFlashMsg <= 5000) ? tFlashMsg : 500;
                        } else if (typeof msg.flashBorderAtivo === 'boolean') {
                            tempoFlashBorderMs = msg.flashBorderAtivo ? 500 : 0;
                        }
                        if (typeof msg.corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.corFlashBorder.trim())) {
                            corFlashBorder = msg.corFlashBorder.trim().toLowerCase();
                        }
                        if (typeof msg.converterCabecalhoPjeAtivo === 'boolean') {
                            converterCabecalhoPjeAtivo = msg.converterCabecalhoPjeAtivo;
                        }
                        if (typeof msg.atalhoF1GeminiAtivo === 'boolean') {
                            atalhoF1GeminiAtivo = msg.atalhoF1GeminiAtivo;
                        }
                        if (typeof msg.modoShiftCnj === 'string') {
                            modoShiftCnj = msg.modoShiftCnj;
                        }
                        if (typeof msg.promptF1Gemini === 'string') {
                            promptF1Gemini = msg.promptF1Gemini.trim() || PROMPT_F1_GEMINI_PADRAO;
                        }
                        if (msg.tempoExibicaoAlertaMs !== undefined && validador && typeof validador.definirTempoExibicao === 'function') {
                            validador.definirTempoExibicao(msg.tempoExibicaoAlertaMs);
                        }
                        if (typeof msg.separadorAcumulador === 'string' && acumulador && typeof acumulador.definirSeparador === 'function') {
                            acumulador.definirSeparador(msg.separadorAcumulador);
                        }
                        if (typeof msg.incluirSeparadorFinalAcumulador === 'boolean') {
                            incluirSeparadorFinalAcumulador = msg.incluirSeparadorFinalAcumulador;
                            if (acumulador && typeof acumulador.definirSeparadorFinal === 'function') {
                                acumulador.definirSeparadorFinal(incluirSeparadorFinalAcumulador);
                            }
                        }
                        if (typeof msg.separadorTabelas === 'string') {
                            separadorTabelas = msg.separadorTabelas;
                            if (acumulador && typeof acumulador.definirSeparadorTabela === 'function') {
                                acumulador.definirSeparadorTabela(separadorTabelas);
                            }
                        }
                        if (typeof msg.ativoAmpuletas === 'boolean') {
                            ativoAmpuletas = msg.ativoAmpuletas;
                            blindarCSS();
                        }
                    }
                });
            }
        } catch (_) {}
    }

    /* Passo 10.2: Expor interface de homologacao para a bateria automatizada (debug.js) */
    window.JusGovMotorSelecaoTeste = Object.freeze({
        aplicarFiltro1DadosLixo,
        aplicarFiltro3InformacoesELinhas,
        extrairTextoPuroSanitizado,
        construirHtmlNivel1Basico,
        construirHtmlNivel2Intermediario,
        construirHtmlNivel3Avancado,
        construirHtmlNivel4Estendido,
        aplicarFiltroHtmlPorNivel,
        normalizarNivelFiltro,
        converterNivelFiltroParaIndice,
        converterIndiceParaNivelFiltro,
        construirHtmlFormatacaoBasica,
        construirHtmlFormatacaoAvancada,
        construirHtmlSemFiltroWord,
        definirNivelFiltroFormatacao(nivel) {
            const norm = normalizarNivelFiltro(nivel);
            nivelFiltroFormatacao = (norm === 'texto_puro') ? 'basico' : norm;
        },
        definirManterFormatacaoBasica(valor) {
            manterFormatacaoBasica = Boolean(valor);
        },
        definirPlaceholdersMinutasHtmlAtivo(valor) {
            placeholdersMinutasHtmlAtivo = Boolean(valor);
            modoPlaceholdersMinutasHtml = valor ? 'placeholders' : 'desabilitado';
        },
        definirModoPlaceholdersMinutasHtml(valor) {
            if (valor === 'desabilitado' || valor === 'placeholders' || valor === 'ctrl_avancado' || valor === 'avancado') {
                modoPlaceholdersMinutasHtml = valor;
                placeholdersMinutasHtmlAtivo = (valor !== 'desabilitado');
            } else {
                placeholdersMinutasHtmlAtivo = Boolean(valor);
                modoPlaceholdersMinutasHtml = valor ? 'placeholders' : 'desabilitado';
            }
        },
        definirColagemBotaoDireitoAtiva(valor) {
            colagemBotaoDireitoAtiva = Boolean(valor);
        },
        definirCapturaBotoesMouse4e5Ativa(valor) {
            capturaBotoesMouse4e5Ativa = Boolean(valor);
        },
        definirColarBotaoMeioAtivo(valor) {
            colarBotaoMeioAtivo = Boolean(valor);
        },
        obterColarBotaoMeioAtivo() {
            return colarBotaoMeioAtivo;
        },
        definirUsarClipboardSistemaAoColar(valor) {
            usarClipboardSistemaAoColar = Boolean(valor);
        },
        obterUsarClipboardSistemaAoColar() {
            return usarClipboardSistemaAoColar;
        },
        aoPressionarBotaoMouse,
        aoClicarAuxiliarMouse,
        aoAbrirMenuContexto,
        aoClicar,
        tratarNavegacaoAbasPorBotoesMouse,
        definirHistoricoClipboardCtrlMeioAtivo(valor) {
            historicoClipboardCtrlMeioAtivo = Boolean(valor);
        },
        obterHistoricoClipboardCtrlMeioAtivo() {
            return historicoClipboardCtrlMeioAtivo;
        },
        definirHistoricoClipboardCtrlDireitoAtivo(valor) {
            historicoClipboardCtrlMeioAtivo = Boolean(valor);
        },
        obterHistoricoClipboardCtrlDireitoAtivo() {
            return historicoClipboardCtrlMeioAtivo;
        },
        executarRollbackEColagem,
        emularTeclasColar,
        emularTeclasWinV,
        simularRollbackEColagem(alvo) {
            return executarRollbackEColagem(alvo);
        },
        obterHistoricoRollback() {
            return {
                ultimo: historicoRollbackClipboard.ultimo ? { ...historicoRollbackClipboard.ultimo } : null,
                penultimo: historicoRollbackClipboard.penultimo ? { ...historicoRollbackClipboard.penultimo } : null
            };
        },
        definirHistoricoRollback(ultimo, penultimo) {
            historicoRollbackClipboard.ultimo = ultimo ? { ...ultimo } : null;
            historicoRollbackClipboard.penultimo = penultimo ? { ...penultimo } : null;
        },
        simularRollbackClipboard() {
            if (!historicoRollbackClipboard.penultimo) return false;
            const itemRestaurado = historicoRollbackClipboard.penultimo;
            historicoRollbackClipboard.penultimo = historicoRollbackClipboard.ultimo;
            historicoRollbackClipboard.ultimo = itemRestaurado;
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = itemRestaurado;
            return true;
        },
        definirNavegacaoTecladoCamposAtiva(valor) {
            navegacaoTecladoCamposAtiva = Boolean(valor);
        },
        simularNavegacaoTecladoCampos(inputAtual, direcao) {
            return navegarEntreCamposEntrada(inputAtual, direcao);
        },
        simularColagemBotaoDireito(alvo, modo, textoSimulado) {
            if (!alvo) return false;
            const ehHtml = (modo === 'normal' && Boolean(alvo.isContentEditable || (alvo.getAttribute && alvo.getAttribute('contenteditable') === 'true')));
            inserirTextoEmElemento(alvo, textoSimulado || '', ehHtml);
            return true;
        },
        simularNavegacaoBotoesMouse(botao, totalAbas, idxAtual) {
            if (typeof totalAbas !== 'number' || totalAbas <= 1) return idxAtual;
            if (botao === 3) {
                return (idxAtual - 1 + totalAbas) % totalAbas;
            } else if (botao === 4) {
                return (idxAtual + 1) % totalAbas;
            }
            return idxAtual;
        },
        definirSelecaoEditavelAtiva(valor) {
            selecaoEditavelAtiva = Boolean(valor);
        },
        higienizarTextoParaCopia,
        tentarExpandirPadraoComposto,
        expandirUnidadeAtomicaEstagio1,
        expandirFraseAtePontuacaoEstagio3,
        tentarExpandirDelimitadoresSimetricos,
        tentarExpandirBlocoMaiusculasComQuebraSuave,
        tentarExpandirBlocoFormatadoDestaque,
        delimitarParagrafoLocalizado,
        resolverSelecaoTriploClique,
        construirMapaTextoBlocoComJanela,
        simularCliqueEmTexto(texto, idxZeroBased, numCliques = 1) {
            if (typeof texto !== 'string' || texto.length === 0) return '';
            if (idxZeroBased < 0 || idxZeroBased >= texto.length) return '';

            const mapaSimulado = {
                bloco: null,
                texto,
                idxCursor: idxZeroBased,
                deslocamentoJanela: 0,
                segmentos: [],
                tamanhoTotalBloco: texto.length
            };

            if (numCliques >= 3) {
                const res3 = resolverSelecaoTriploClique(mapaSimulado, idxZeroBased);
                return res3 ? higienizarTextoParaCopia(texto.substring(res3.inicio, res3.fim)) : '';
            }

            const charNoCursor = texto[idxZeroBased] || '';
            const charAnterior = idxZeroBased > 0 ? texto[idxZeroBased - 1] : '';
            const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
                (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));
            const clicouEmDelimitadorOuAspas = eDelimitadorPar(charNoCursor) || eDelimitadorPar(charAnterior) ||
                eCaractereAspas(charNoCursor) || eCaractereAspas(charAnterior);

            let res = null;
            if (numCliques === 2) {
                if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                    res = tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, true);
                }
                if (!res) res = tentarExpandirPadraoComposto(texto, idxZeroBased, true, true);
                if (!res) res = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxZeroBased);
                if (!res) res = tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, true);
                if (!res) res = expandirFraseAtePontuacaoEstagio3(texto, idxZeroBased);
            } else if (clicouEmDelimitadorOuAspas) {
                res = tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, false);
            } else if (clicouEmEspaco) {
                res = tentarExpandirPadraoComposto(texto, idxZeroBased, true, false);
                if (!res) res = tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxZeroBased);
                if (!res) res = tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, false);
                if (!res) res = expandirFraseAtePontuacaoEstagio3(texto, idxZeroBased);
            } else {
                res = tentarExpandirPadraoComposto(texto, idxZeroBased, false, false);
                if (!res) res = expandirUnidadeAtomicaEstagio1(texto, idxZeroBased);
            }

            return res ? higienizarTextoParaCopia(texto.substring(res.inicio, res.fim)) : '';
        },
        simularAlternanciaCliqueInput(inputElem, posCliqueDesejada = null, numCliques = 1) {
            if (!inputElem || typeof inputElem.select !== 'function') return '';
            if (numCliques === 2) {
                inputElem.select();
                return 'SELECIONADO';
            }
            const temAlfanumerico = /[\p{L}\p{N}]/u.test(inputElem.value || '');
            if (!inputElem.dataset.autoselected || !temAlfanumerico) {
                inputElem.dataset.autoselected = 'true';
                if (!inputElem.__jusgovBlurLigado) {
                    inputElem.__jusgovBlurLigado = true;
                    inputElem.addEventListener('blur', () => {
                        delete inputElem.dataset.autoselected;
                        inputElem.__jusgovBlurLigado = false;
                    }, { once: true });
                }
                if (typeof inputElem.focus === 'function') inputElem.focus();
                inputElem.select();
                return 'SELECIONADO';
            } else {
                const pos = (typeof posCliqueDesejada === 'number' && posCliqueDesejada >= 0)
                    ? posCliqueDesejada
                    : (typeof inputElem.selectionStart === 'number' ? inputElem.selectionStart : 0);
                inputElem.setSelectionRange(pos, pos);
                return 'DESSELECIONADO';
            }
        },
        simularEscInput(inputElem) {
            if (!inputElem) return;
            delete inputElem.dataset.autoselected;
            if (typeof inputElem.blur === 'function') {
                inputElem.blur();
            }
        },
        deselecionarTudo() {
            executarDeselecaoUniversal(false);
        },
        verificarSeTextoEhBlocoOuPalavraUnica(texto) {
            return verificarSeTextoEhBlocoOuPalavraUnica(texto);
        },
        classificarContextoElementoAlvo,
        isElementoInterativoOuUi,
        dispararFlashBorderVisual,
        limparFlashBorderImediatamente,
        localizarCampoSimbolosSobCursor,
        obterEstadoAtual() {
            return {
                modoExecucao,
                manterFormatacaoBasica,
                nivelFiltroFormatacao,
                selecaoEditavelAtiva,
                placeholdersMinutasHtmlAtivo,
                modoPlaceholdersMinutasHtml,
                colagemBotaoDireitoAtiva,
                capturaBotoesMouse4e5Ativa,
                colarBotaoMeioAtivo,
                usarClipboardSistemaAoColar,
                navegacaoTecladoCamposAtiva,
                validacaoMatematicaAtiva,
                flashBorderAtivo: tempoFlashBorderMs > 0,
                tempoFlashBorderMs,
                corFlashBorder,
                converterCabecalhoPjeAtivo,
                atalhoF1GeminiAtivo,
                ativoAmpuletas
            };
        },
        blindarCSS,
        definirAtivoAmpuletas(valor) {
            ativoAmpuletas = Boolean(valor);
            blindarCSS();
        }
    });

    inicializarModulo();
})();
