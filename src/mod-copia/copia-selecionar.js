/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-selecionar.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-selecionar.js
 * - Objeto Exportado: window.JusGovMotorSelecaoTeste / window.JusGovCopiaSelecionar / window.JusGovMotorTestes (API pública determinística congelada via Object.freeze)
 * - Fachadas Orquestradas: ModuloCopia (window.JusGovModuloCopia), GerenciadorCopia (copia-copiar.js), ProgressaoAtalhosSelecao (copia-progressao.js), ClassificadorComportamentoDOM (copia-comportamento-dom.js), PadroesReconhecidosCopia (lib-copia-padroes.js), MonitoramentoDomCopia (copia-monitor-dom.js), ModuloInput (window.JusGovModuloInput) e DialogoMapeamentoRegra (window.JusGovDialogoMapeamentoRegra)
 * - Ciclo de Vida: registrarListenersDOM() / destruirCicloVidaFrame() com AbortController + MonitoramentoDomCopia (BUG-01)
 * - Fluxo Principal: Selecao em 6 Estagios -> ProgressaoAtalhosSelecao -> aplicarSelecaoDOM -> GerenciadorCopia.executarCopiaDeSelecao -> GerenciadorClipboardInterno
 * - Regras / Seções: 6 Estágios, Filtros -1..4/+99, Seções 6.1..6.64, BUG-01..BUG-91, ARQ-09 / FEAT-73
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
 * - Preservacao Estrita da Selecao Ativa (BUG-07 / Secao 6.62): Pressionar ou soltar
 *   a tecla "Shift" isoladamente NUNCA limpa nem recolhe uma selecao ativa na tela,
 *   garantindo compatibilidade total com ajustes finos nativos via "Shift + Setas".
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
 *
 * 7. FRONTEIRAS ARQUITETURAIS E CICLO DE VIDA DETERMINISTICO (SECAO 6.47 & BUG-01):
 * - Separacao de Dominios:
 *   * Grupo 1 (src/mod-anti-ampulheta/): Neutralizacao CSS Anti-Ampulhetas (mod-anti-ampulheta.js + 7 folhas CSS + fallback #pje-turbo-lock).
 *   * Grupo 2 (src/mod-copia/): Motor Lexico/Geometrico em 6 Estagios, Filtros HTML (5 niveis),
 *     Acumulador e Auditoria Forense orquestrados via fachada POO (ModuloCopia).
 *   * Grupo 3 (src/mod-input/): Contratos POO de perifericos (ModuloInput: Botoes 4/5, Botao do Meio,
 *     Setas em Inputs e F1 Gemini), mantidos sincronizados em tempo real sem duplicar listeners DOM.
 *   * Grupo 4 (src/mod-navegador/ e src/cfg/background.js): Operacoes privilegiadas de abas/janelas
 *     isoladas no Service Worker e acionadas estritamente por barramento IPC (chrome.runtime.sendMessage).
 * - Ciclo de Vida Deterministico em Subframes (BUG-01): Todos os ouvintes globais, MutationObservers,
 *   timers, listeners IPC e ouvintes locais de <iframe> de mesma origem sao governados por
 *   AbortController individualizado, com auto-desmontagem imediata em pagehide (!event.persisted),
 *   remocao fisica de nos <iframe> ou ativacao do motor nativo no subframe, preservando BFCache.
 * ========================================================================== */

(function () {
    'use strict';

    /* Passo 1.1: Guarda de idempotencia global O(1): se o motor ja estiver inicializado
     * e ativo neste frame, evita destruir e recriar listeners e MutationObserver
     * em reinjecoes automaticas do Service Worker. */
    if (window.__JUSGOV_MOTOR_SELECAO_ATIVO__ && window.JusGovMotorSelecaoTeste) {
        return;
    }
    window.__JUSGOV_MOTOR_SELECAO_ATIVO__ = true;
    const INICIOU_COM_CHROME_RUNTIME = Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    const verificarContextoExtensaoVivo = () => {
        if (!INICIOU_COM_CHROME_RUNTIME) return true;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) return true;
        try { destruirCicloVidaFrame(); } catch (_) { }
        return false;
    };

    if (window.__JUSGOV_ABORT_CONTROLLER__) {
        try {
            window.__JUSGOV_ABORT_CONTROLLER__.abort();
        } catch (_) { }
    }

    /* ==========================================================================
     * SECAO 1: IMPORTACAO SEGURA DE CONSTANTES E PADROES DE FABRICA (ARQ-01 e ARQ-02)
     * Consome diretamente lib-constantes.js e cfg-defaults.js sem duplicar mascaras ou regexps.
     * ========================================================================== */
    const C_EXT = window.JusGovConstantes || {};
    const CFG_DEF = (window.JusGovCfgDefaults && window.JusGovCfgDefaults.CONFIGURACAO_MOTOR) || {};

    const MASCARA_CARACTERE = C_EXT.MASCARA_CARACTERE;
    const TABELA_MASCARA_ASCII = C_EXT.TABELA_MASCARA_ASCII;
    const CONFIGURACAO_MOTOR = Object.assign({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        TOLERANCIA_MAXIMA_DX_CLIQUE_PX: 24,
        TOLERANCIA_MAXIMA_DY_CLIQUE_PX: 12,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: -1
    }, C_EXT.CONFIGURACAO_MOTOR || {}, CFG_DEF);

    const PARES_ABERTURA = C_EXT.PARES_ABERTURA;
    const PARES_FECHAMENTO = C_EXT.PARES_FECHAMENTO;
    const CARACTERES_ASPAS_TODOS = C_EXT.CARACTERES_ASPAS_TODOS;
    const EXPRESSOES_REGULARES = C_EXT.EXPRESSOES_REGULARES || {};
    const REGEX_AUDITORIA = C_EXT.REGEX_AUDITORIA || {};
    const CATALOGO_PADROES_JURIDICOS = C_EXT.CATALOGO_PADROES_JURIDICOS || [];

    const validador = window.JusGovAvisoFlutuante ? new window.JusGovAvisoFlutuante() : null;
    const acumulador = window.JusGovAcumulador ? new window.JusGovAcumulador() : null;

    /* Passo 1.1.2 (Secao 6.47): Instanciacao desacoplada das Fachadas POO dos Grupos 2 (Copia)
     * e 3 (Perifericos de Input) com injecao de dependencias (DIP) e tolerancia Null Object.
     * Nota critica: A fachadaModuloInput nao executa inicializar(document) duplicado aqui para
     * respeitar o pipeline unificado de precedencia DOM (selecao editavel, editores ricos e escopo
     * verificarSeSiteAtivo), mantendo seu estado reativo 100% sincronizado com o storage. */
    const fachadaModuloCopia = (() => {
        try {
            if (typeof window.JusGovModuloCopia === 'function') {
                const inst = new window.JusGovModuloCopia({
                    constantes: C_EXT,
                    avisoFlutuante: validador,
                    acumulador
                });
                window.JusGovInstanciaCopia = inst;
                return inst;
            }
        } catch (_) { }
        return null;
    })();

    const fachadaModuloInput = (() => {
        try {
            if (typeof window.JusGovModuloInput === 'function') {
                const inst = new window.JusGovModuloInput();
                window.JusGovInstanciaInput = inst;
                return inst;
            }
        } catch (_) { }
        return null;
    })();

    /* Injeção defensiva de instâncias especializadas POO via Fachada ou construtores globais (Diretriz Root 16 / ADR-006) */
    const geometria = (fachadaModuloCopia && fachadaModuloCopia.geometria) ||
        (typeof window !== 'undefined' && window.JusGovGeometriaDOM ? new window.JusGovGeometriaDOM() : null);

    const filtros = (fachadaModuloCopia && fachadaModuloCopia.filtros) ||
        (typeof window !== 'undefined' && window.JusGovFiltrosHtml ? new window.JusGovFiltrosHtml() : null);

    const visual = (fachadaModuloCopia && fachadaModuloCopia.visual) ||
        (typeof window !== 'undefined' && window.JusGovFeedbackVisual ? new window.JusGovFeedbackVisual() : null);

    const validadores = (fachadaModuloCopia && fachadaModuloCopia.validadores) ||
        (typeof window !== 'undefined' && window.JusGovValidadoresForenses ? new window.JusGovValidadoresForenses(validador) : null);

    const placeholders = (fachadaModuloCopia && fachadaModuloCopia.placeholders) ||
        (typeof window !== 'undefined' && window.JusGovPlaceholdersMinutas ? new window.JusGovPlaceholdersMinutas('placeholders') : null);

    const estagio1 = (fachadaModuloCopia && fachadaModuloCopia.estagio1) ||
        (typeof window !== 'undefined' && window.JusGovEstagioUnidadeAtomica ? new window.JusGovEstagioUnidadeAtomica(C_EXT) : null);

    const estagio2 = (fachadaModuloCopia && fachadaModuloCopia.estagio2) ||
        (typeof window !== 'undefined' && window.JusGovEstagioExpressoes ? new window.JusGovEstagioExpressoes(C_EXT) : null);

    const estagio3 = (fachadaModuloCopia && fachadaModuloCopia.estagio3) ||
        (typeof window !== 'undefined' && window.JusGovEstagioSentencas ? new window.JusGovEstagioSentencas(C_EXT) : null);

    const estagio4 = (fachadaModuloCopia && fachadaModuloCopia.estagio4) ||
        (typeof window !== 'undefined' && window.JusGovEstagioDelimitadores ? new window.JusGovEstagioDelimitadores(C_EXT) : null);

    const estagio5 = (fachadaModuloCopia && fachadaModuloCopia.estagio5) ||
        (typeof window !== 'undefined' && window.JusGovEstagioParagrafos ? new window.JusGovEstagioParagrafos(C_EXT) : null);

    const estagio6 = (fachadaModuloCopia && fachadaModuloCopia.estagio6) ||
        (typeof window !== 'undefined' && window.JusGovEstagioTabelas ? new window.JusGovEstagioTabelas(acumulador) : null);

    const urlsLib = (typeof window !== 'undefined' && window.JusGovUrls) ? new window.JusGovUrls() : null;
    const padroesCopia = (fachadaModuloCopia && fachadaModuloCopia.padroesCopia) ||
        (typeof window !== 'undefined' && typeof window.JusGovPadroesCopia === 'function' ? new window.JusGovPadroesCopia(C_EXT) : null);

    /* Passo 1.2: Variaveis de controle de estado monomorficas em tempo real */
    let modoExecucao = 'global';
    let listaUrlsPermitidas = [];
    let listaUrlsExcecoes = ['*://*/*jogos*', '*://*/*games*', '*://*jogos*/*', '*://*games*/*'];
    let manterFormatacaoBasica = false;
    let nivelFiltroFormatacao = 'basico';
    let padronizarFonteCopiaAtivo = false;
    let fontePadraoCopia = 'Arial';
    let tamanhoFontePadraoCopia = '12';
    let selecaoEditavelAtiva = true;
    let placeholdersMinutasHtmlAtivo = true;
    let modoPlaceholdersMinutasHtml = 'placeholders';
    let colagemBotaoDireitoAtiva = false;
    let capturaBotoesMouse4e5Ativa = true;
    let colarBotaoMeioAtivo = true;
    let navegacaoTecladoCamposAtiva = true;
    let caixaEntradaRapidaAtiva = true;
    let ultimoTimestampNavegacaoAbas = 0;
    let botaoLateralEmProcessamento = 0;
    const DEBOUNCE_NAVEGACAO_ABAS_MS = 280;
    let timerCliqueDireitoColagem = null;
    let ultimoCliqueDireitoTimestamp = 0;
    let ultimoAlvoCliqueDireito = null;
    let validacaoMatematicaAtiva = true;
    let tempoConferenciaDocumentosMs = -1;
    let tempoFlashBorderMs = -1;
    let corFlashBorder = '#0d9488';
    let tipoContornoFlashBorder = 'solido';
    let marcadorConteudoColadoAtivo = true;
    let presetMarcadorColado = 'verde_forense';
    let corContornoMarcadorColado = '#0d9488';
    let corFundoMarcadorColado = '#ccfbf1';
    let opacidadeFundoMarcadorColado = 0.24;
    let estiloBadgeMarcadorColado = 'sobrescrito';
    let tipoContornoMarcadorColado = 'solido';
    let minimoCaracteresInterface = 0;
    let modoRetirarSelecao = 'com_flash'; // 'com_flash' (padrao qd flash ativo), 'total_exceto_arrasto', 'total', 'interface', 'nenhuma'
    let timerFlashBorder = null;
    let aguardandoDesselecaoFlash = false;
    let flashExclusivoSemSelecao = false;
    let selecaoSendoAplicadaPeloAddon = false;
    let timerDebounceSelecaoGlobal = null;
    let ultimoRangeAssinaturaGlobal = '';
    let ultimaSelecaoManualTexto = '';
    let ultimoTimestampSelecaoManual = 0;
    let ultimoAltSelectTimestamp = 0;
    let isMousePressionado = false;
    let observerFrames = null;
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
    // === DELEGAÇÃO DE BLINDAGEM CSS PARA MOD-ANTI-AMPULHETA (ARQ-03 / Seção 6.102) ===
    // =====================================================================
    let observadorBlindagem = null;
    const instanciaAntiAmpulheta = (typeof window !== 'undefined' && window.JusGovInstanciaAntiAmpulheta)
        ? window.JusGovInstanciaAntiAmpulheta
        : (typeof window !== 'undefined' && typeof window.JusGovModuloAntiAmpulheta === 'function'
            ? new window.JusGovModuloAntiAmpulheta({ ativo: ativoAmpuletas })
            : null);

    function garantirObservadorBlindagem() {
        if (instanciaAntiAmpulheta && typeof instanciaAntiAmpulheta.garantirObservadorBlindagem === 'function') {
            return instanciaAntiAmpulheta.garantirObservadorBlindagem(typeof document !== 'undefined' ? document : null);
        }
        return false;
    }

    function blindarCSS() {
        if (instanciaAntiAmpulheta && typeof instanciaAntiAmpulheta.definirAtivoAmpuletas === 'function') {
            cssBlindado = Boolean(instanciaAntiAmpulheta.definirAtivoAmpuletas(ativoAmpuletas, typeof document !== 'undefined' ? document : null));
            return cssBlindado;
        }
        return false;
    }

    blindarCSS();
    let ultimoTimestampEsc = 0;
    let ultimoTextoSelecionadoLimpo = '';
    let ultimoRangeSelecionadoSimples = null;
    let coordsMouseDown = { x: 0, y: 0 };
    let houveArrastoMouse = false;
    let inputAlvoMouseDown = null;
    let inputJaEstavaSelecionadoNoMouseDown = false;
    const inputsJaSelecionadosInicialmente = new WeakSet();
    let ultimoCampoEditavelSelecionado = null;
    let pendenciaBotaoMeio = null;

    function selecionarTudoAoEntrarNoInput(inputAlvo, delayMs = 20) {
        if (!inputAlvo || typeof inputAlvo.select !== 'function') return;
        inputAlvo.dataset.autoselected = 'true';
        if (!inputAlvo.__jusgovBlurLigado) {
            inputAlvo.__jusgovBlurLigado = true;
            inputAlvo.addEventListener('blur', () => {
                delete inputAlvo.dataset.autoselected;
                inputAlvo.__jusgovBlurLigado = false;
            });
        }
        setTimeout(() => {
            try {
                if (typeof inputAlvo.focus === 'function') inputAlvo.focus();
                inputAlvo.select();
                registrarSelecaoAtivaCampoEditavel(inputAlvo);
            } catch (_) { }
        }, delayMs);
    }

    /* Delegação ARQ-08: Resolução de alvo, ativação e colagem unificadas em copia-colar.js */
    function resolverAlvoEditavelParaMeio(el) {
        return moduloColagem.resolverAlvoEditavel(el);
    }

    function focarElementoSeguroMeio(el) {
        return moduloColagem.focarElementoSeguro(el);
    }

    function ativarComponenteParaColagem(alvo, alvoFoco = null) {
        return moduloColagem.ativarComponenteParaColagem(alvo, alvoFoco, { selecaoEditavelAtiva });
    }

    function confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX = null, clientY = null, docContext = document, alvoBruto = null, opcoesColagem = {}) {
        return moduloColagem.confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX, clientY, docContext, alvoBruto, opcoesColagem);
    }

    function registrarSelecaoAtivaCampoEditavel(el) {
        if (!el) return;
        try {
            const ini = typeof el.selectionStart === 'number' ? el.selectionStart : 0;
            const fim = typeof el.selectionEnd === 'number' ? el.selectionEnd : (el.value ? el.value.length : 0);
            if (fim > ini) {
                ultimoCampoEditavelSelecionado = {
                    elemento: el,
                    inicio: ini,
                    fim: fim,
                    valor: el.value || ''
                };
            }
        } catch (_) { }
    }

    function restaurarSelecaoCampoEditavelSeNecessario() {
        if (document.hidden) return;
        if (!ultimoCampoEditavelSelecionado) return;
        const { elemento, inicio, fim } = ultimoCampoEditavelSelecionado;
        if (elemento && document.contains(elemento)) {
            try {
                if (typeof elemento.focus === 'function') elemento.focus();
                if (typeof elemento.setSelectionRange === 'function' && typeof inicio === 'number' && typeof fim === 'number') {
                    elemento.setSelectionRange(inicio, fim);
                } else if (typeof elemento.select === 'function') {
                    elemento.select();
                }
                elemento.dataset.autoselected = 'true';
            } catch (_) { }
        }
    }
    let selecaoElasticaAtivaNoClique = false;
    let rangeAncoraArrastoElastico = null;
    let pontoAncoraArrastoAlt = null;
    let ancoraCursorShift = null;
    let cliqueDentroDaSelecaoAtiva = false;
    let ultimoBlocoCompostoAtivo = null;
    let estadoCicloSelecao = {
        direcao: 1,
        textoAtual: ''
    };
    let ignorarProximoClick = false;

    /* Delegação Modular POO (ARQ-09 / FEAT-73): Catálogo de padrões (lib-copia-padroes.js) e Progressão em 6 Estágios / Atalhos (copia-progressao.js) */
    function ehTextoBlocoMultiSegmento(texto) {
        return padroesCopia ? padroesCopia.ehTextoBlocoMultiSegmento(texto) : false;
    }

    function resolverLimitesBlocoAtivoNaJanela(mapa, idxCursor, blocoAtivo, textoCicloAtual) {
        return progressaoSelecao ? progressaoSelecao.resolverLimitesBlocoAtivoNaJanela(mapa, idxCursor, blocoAtivo, textoCicloAtual) : null;
    }

    function resolverSubSegmentoNoBlocoComposto(texto, idxCursor, blocoInicio, blocoFim) {
        return progressaoSelecao ? progressaoSelecao.resolverSubSegmentoNoBlocoComposto(texto, idxCursor, blocoInicio, blocoFim) : null;
    }

    function isPontoDentroDoRange(ponto, range) {
        return progressaoSelecao ? progressaoSelecao.isPontoDentroDoRange(ponto, range) : false;
    }

    function construirDegrausCicloSelecao(mapa, idxCursor, elAlvoEfetivo) {
        return progressaoSelecao ? progressaoSelecao.construirDegrausCicloSelecao(mapa, idxCursor, elAlvoEfetivo) : [];
    }
    const teclasPressionadasAtivas = new Set();

    /* Mapeamento Manual Avançado de Elementos (XPath / CSS) e Inspetor Visual: delegados externamente ao módulo global src/mod-XPath/mod-xpath.js */
    const PADROES_FABRICA_REGRAS_MAPEAMENTO = Object.freeze([]);
    const moduloXPathGlobal = (typeof window !== 'undefined' && typeof window.JusGovModuloXPath === 'function')
        ? new window.JusGovModuloXPath({
            ehCampoEditavel: (el) => isElementoEmCampoEditavel(el) && !isElementoInterfaceDeEditorRico(el)
        })
        : null;
    const regrasEInspetor = (moduloXPathGlobal && typeof moduloXPathGlobal.obterRegrasEInspetor === 'function')
        ? moduloXPathGlobal.obterRegrasEInspetor()
        : ((typeof window !== 'undefined' && typeof window.JusGovRegrasEInspetor === 'function')
            ? new window.JusGovRegrasEInspetor({
                ehCampoEditavelFn: (el) => isElementoEmCampoEditavel(el) && !isElementoInterfaceDeEditorRico(el)
            })
            : {
                limparCache: () => { },
                obterIdFrameInspetor: () => '',
                temPainelInspetorVisivel: () => false,
                carregarRegrasInternas: () => { },
                definirRegrasUsuario: () => { },
                obterRegrasUsuario: () => [],
                adicionarRegrasUsuario: () => { },
                definirRegrasInternas: () => { },
                elementoCorrespondeXPath: () => false,
                elementoCorrespondeCss: () => false,
                normalizarExpressaoAtributoCss: (e) => String(e || '').trim(),
                validarExpressaoSeletor: () => false,
                elementoCorrespondeRegraMapeamento: () => false,
                obterClassificacaoRegraCustomizada: () => null,
                descreverNoCurto: () => '',
                temEventosAssociadosAoObjeto: () => null,
                resolverTipoElementoPorPrioridade: () => 'textual',
                obterDiagnosticoRegraDetalhado: () => null,
                obterDiagnosticoElemento: () => ({ tipo: 'textual', origem: 'Padrão (Texto)', rotuloDetalhe: 'Motivo', detalhe: 'Textual', observacao: '', trilha: [] }),
                ocultarInspetorTempoReal: () => { },
                notificarOutrosFramesOcultarInspetor: () => { },
                atualizarInspetorTempoReal: () => { },
                obterUltimoAlvoValidoInspecionado: () => null
            });

    const definirRegrasMapeamentoElementos = (novasRegras) => regrasEInspetor.definirRegrasUsuario(novasRegras);
    const obterRegrasMapeamentoElementos = () => regrasEInspetor.obterRegrasUsuario();
    const elementoCorrespondeXPath = (el, expr, herdar = true) => regrasEInspetor.elementoCorrespondeXPath(el, expr, herdar);
    const elementoCorrespondeCss = (el, sel, herdar = true) => regrasEInspetor.elementoCorrespondeCss(el, sel, herdar);
    const normalizarExpressaoAtributoCss = (expr, tipo = '') => regrasEInspetor.normalizarExpressaoAtributoCss(expr, tipo);
    const validarExpressaoSeletor = (expr, tipo = '') => regrasEInspetor.validarExpressaoSeletor(expr, tipo);
    const elementoCorrespondeRegraMapeamento = (el, expr, herdar = true, tipo = '') => regrasEInspetor.elementoCorrespondeRegraMapeamento(el, expr, herdar, tipo);
    const obterClassificacaoRegraCustomizada = (el, apenasUsuario = false) => regrasEInspetor.obterClassificacaoRegraCustomizada(el, apenasUsuario);
    const descreverNoCurto = (el) => regrasEInspetor.descreverNoCurto(el);
    const temEventosAssociadosAoObjeto = (el) => regrasEInspetor.temEventosAssociadosAoObjeto(el);
    const resolverTipoElementoPorPrioridade = (el) => regrasEInspetor.resolverTipoElementoPorPrioridade(el);
    const obterDiagnosticoRegraDetalhado = (el, apenasUsuario = false) => regrasEInspetor.obterDiagnosticoRegraDetalhado(el, apenasUsuario);
    const obterDiagnosticoElemento = (el) => regrasEInspetor.obterDiagnosticoElemento(el);
    const ocultarInspetorTempoReal = (ignorarOrigemId = null) => regrasEInspetor.ocultarInspetorTempoReal(ignorarOrigemId);
    const notificarOutrosFramesOcultarInspetor = () => regrasEInspetor.notificarOutrosFramesOcultarInspetor();
    const atualizarInspetorTempoReal = (x, y, alvo) => regrasEInspetor.atualizarInspetorTempoReal(x, y, alvo);

    /* Instanciação dos Submódulos POO Desmembrados (ARQ-09 / FEAT-73) com Lazy DI + Null Object */
    const comportamentoDom = (typeof window !== 'undefined' && typeof window.JusGovComportamentoDOM === 'function')
        ? new window.JusGovComportamentoDOM({
            regrasEInspetor,
            validadores,
            estagio2,
            obterEstado: () => ({ modoRetirarSelecao, tempoFlashBorderMs, minimoCaracteresInterface }),
            obterPontoDoClique: (x, y, docRef) => obterPontoDoClique(x, y, docRef),
            criarRangeDOMAPartirDeIndices: (m, i, f) => criarRangeDOMAPartirDeIndices(m, i, f),
            extrairTextoPuroSanitizado: (o) => extrairTextoPuroSanitizado(o),
            unificarLinhasComEspacamentoAntiTruncamento: (t) => unificarLinhasComEspacamentoAntiTruncamento(t),
            higienizarTextoParaCopia: (t) => higienizarTextoParaCopia(t)
        })
        : null;

    const progressaoSelecao = (typeof window !== 'undefined' && typeof window.JusGovProgressaoAtalhosSelecao === 'function')
        ? new window.JusGovProgressaoAtalhosSelecao({
            expandirUnidadeAtomicaEstagio1: (t, i) => expandirUnidadeAtomicaEstagio1(t, i),
            tentarExpandirPadraoComposto: (t, i, e1, e2) => tentarExpandirPadraoComposto(t, i, e1, e2),
            tentarExpandirBlocoMaiusculasComQuebraSuave: (t, i) => tentarExpandirBlocoMaiusculasComQuebraSuave(t, i),
            tentarExpandirBlocoFormatadoDestaque: (m, i) => tentarExpandirBlocoFormatadoDestaque(m, i),
            tentarExpandirDelimitadoresSimetricos: (t, i, c) => tentarExpandirDelimitadoresSimetricos(t, i, c),
            expandirSentencaCompletaAtePonto: (t, i) => expandirSentencaCompletaAtePonto(t, i),
            expandirFraseAtePontuacaoEstagio3: (t, i) => expandirFraseAtePontuacaoEstagio3(t, i),
            delimitarParagrafoLocalizado: (t, i, p) => delimitarParagrafoLocalizado(t, i, p),
            resolverSelecaoTriploClique: (m, i) => resolverSelecaoTriploClique(m, i),
            extrairTextoPuroSanitizado: (o) => extrairTextoPuroSanitizado(o),
            criarRangeDOMAPartirDeIndices: (m, i, f) => criarRangeDOMAPartirDeIndices(m, i, f),
            obterPontoDOMNoMapa: (m, i) => obterPontoDOMNoMapa(m, i),
            obterRangePalavraOuBlocoNoPonto: (x, y) => obterRangePalavraOuBlocoNoPonto(x, y),
            aplicarSelecaoECopiar: (r, m, s, o) => aplicarSelecaoECopiar(r, m, s, o),
            gravarNaAreaDeTransferencia: (t, r, o) => gravarNaAreaDeTransferencia(t, r, o),
            registrarEstatisticaOperacional: (inc) => registrarEstatisticaOperacional(inc),
            limparUltimoTexto: () => { ultimoTextoSelecionadoLimpo = ''; },
            obterValidador: () => validador,
            obterSeparadorTabelas: () => separadorTabelas,
            acumulador
        })
        : null;

    const gerenciadorCopia = (typeof window !== 'undefined' && typeof window.JusGovGerenciadorCopia === 'function')
        ? new window.JusGovGerenciadorCopia({
            acumulador,
            visual,
            obterValidador: () => validador,
            obterEstado: () => ({
                modoShiftCnj,
                tempoFlashBorderMs,
                modoRetirarSelecao,
                validacaoMatematicaAtiva,
                manterFormatacaoBasica,
                nivelFiltroFormatacao,
                padronizarFonteCopiaAtivo,
                fontePadraoCopia,
                tamanhoFontePadraoCopia,
                ultimoTextoSelecionadoLimpo,
                ultimoRangeSelecionadoSimples
            }),
            atualizarEstado: (delta) => {
                if (!delta) return;
                if ('ultimoTextoSelecionadoLimpo' in delta) ultimoTextoSelecionadoLimpo = delta.ultimoTextoSelecionadoLimpo;
                if ('ultimoRangeSelecionadoSimples' in delta) ultimoRangeSelecionadoSimples = delta.ultimoRangeSelecionadoSimples;
                if ('ultimoRangeAssinaturaGlobal' in delta) ultimoRangeAssinaturaGlobal = delta.ultimoRangeAssinaturaGlobal;
                if ('flashExclusivoSemSelecao' in delta) flashExclusivoSemSelecao = delta.flashExclusivoSemSelecao;
                if ('selecaoSendoAplicadaPeloAddon' in delta) selecaoSendoAplicadaPeloAddon = delta.selecaoSendoAplicadaPeloAddon;
            },
            higienizarTextoParaCopia: (t) => higienizarTextoParaCopia(t),
            extrairTextoPuroSanitizado: (o) => extrairTextoPuroSanitizado(o),
            unificarLinhasComEspacamentoAntiTruncamento: (t) => unificarLinhasComEspacamentoAntiTruncamento(t),
            aplicarLimpezaNumericaComTravaAlfabetica: (t) => aplicarLimpezaNumericaComTravaAlfabetica(t),
            normalizarNivelFiltro: (n) => normalizarNivelFiltro(n),
            verificarSeTextoEhBlocoOuPalavraUnica: (t) => verificarSeTextoEhBlocoOuPalavraUnica(t),
            gerarMapaFormatosClipboard: (o, n, opts) => (filtros && typeof filtros.gerarMapaFormatosClipboard === 'function')
                ? filtros.gerarMapaFormatosClipboard(o, n, opts)
                : null,
            salvarClipboardInternoComBackup: (p) => salvarClipboardInternoComBackup(p),
            gravarNaAreaDeTransferencia: (t, r, o) => gravarNaAreaDeTransferencia(t, r, o),
            dispararFlashBorderVisual: (r) => dispararFlashBorderVisual(r),
            limparFlashBorderImediatamente: () => limparFlashBorderImediatamente(),
            cederControleAoCompositorBlink: () => cederControleAoCompositorBlink(),
            calcularAssinaturaSelecao: (s) => calcularAssinaturaSelecao(s),
            isSelecaoOuElementoEmCampoEditavel: (a) => isSelecaoOuElementoEmCampoEditavel(a),
            verificarProtecaoTamanhoMinimoInterface: (t, e, m, c) => verificarProtecaoTamanhoMinimoInterface(t, e, m, c),
            isSelecaoExtensaOuMultipage: (r, t) => isSelecaoExtensaOuMultipage(r, t),
            deveManterSelecaoAtivaNoDom: (n, e) => deveManterSelecaoAtivaNoDom(n, e),
            aplicarSelecaoDOM: (r, o) => aplicarSelecaoDOM(r, o),
            limparTimerDebounceSelecao: () => {
                if (timerDebounceSelecaoGlobal) {
                    clearTimeout(timerDebounceSelecaoGlobal);
                    timerDebounceSelecaoGlobal = null;
                }
            }
        })
        : null;

    const monitorDom = (typeof window !== 'undefined' && typeof window.JusGovMonitoramentoDomCopia === 'function')
        ? new window.JusGovMonitoramentoDomCopia({
            tratarMudancaSelecaoGlobal: (sw) => tratarMudancaSelecaoGlobal(sw),
            aoPressionarBotaoMouse: (e) => aoPressionarBotaoMouse(e),
            aoMoverMouse: (e) => aoMoverMouse(e),
            aoSoltarBotaoMouse: (e) => aoSoltarBotaoMouse(e),
            aoClicar: (e) => aoClicar(e),
            aoClicarAuxiliarMouse: (e) => aoClicarAuxiliarMouse(e),
            obterEstadoTimers: () => ({ aguardandoDesselecaoFlash, timerFlashBorder }),
            obterValidador: () => validador,
            limparFeedbacksModalCritico: () => {
                limparFlashBorderImediatamente();
                limparAvisosAuditoriaEWikiImediatamente();
            }
        })
        : null;

    if (fachadaModuloCopia && typeof fachadaModuloCopia.registrarSubmodulosRuntime === 'function') {
        fachadaModuloCopia.registrarSubmodulosRuntime({ comportamentoDom, progressaoSelecao, gerenciadorCopia, monitorDom });
    }

    const dialogoMapeamento = (moduloXPathGlobal && typeof moduloXPathGlobal.obterDialogo === 'function')
        ? moduloXPathGlobal.obterDialogo()
        : ((typeof window !== 'undefined' && window.JusGovDialogoMapeamentoRegra) ? new window.JusGovDialogoMapeamentoRegra() : null);
    function fecharModalSalvarRegraMapeamento() { return dialogoMapeamento ? dialogoMapeamento.fecharModal() : null; }
    function obterDepsDialogoMapeamento() {
        return {
            validarExpressaoSeletor,
            normalizarExpressaoAtributoCss,
            obterDiagnosticoElemento,
            aoSalvarRegras: (novasRegras) => {
                regrasEInspetor.adicionarRegrasUsuario(novasRegras);
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    chrome.storage.sync.get(['regrasMapeamentoElementos'], (res) => {
                        const atuais = Array.isArray(res && res.regrasMapeamentoElementos) ? res.regrasMapeamentoElementos : [];
                        const atualizadas = [...atuais, ...novasRegras];
                        chrome.storage.sync.set({ regrasMapeamentoElementos: atualizadas }, () => {
                            if (typeof chrome.runtime !== 'undefined' && chrome.runtime.sendMessage) {
                                chrome.runtime.sendMessage({ acao: 'regrasMapeamentoAtualizadas', regrasMapeamentoElementos: atualizadas }).catch(() => { });
                            }
                        });
                    });
                }
            },
            copiarTexto: (txt) => gravarNaAreaDeTransferencia(txt, null),
            projetarMiniTip: (msg, cor) => { if (validador && typeof validador.projetarMiniTipGlobal === 'function') validador.projetarMiniTipGlobal(msg, cor); },
            dispararFlashBorderVisual
        };
    }
    function abrirModalSalvarRegraMapeamento(baseEl, seletoresExtraidos) {
        return dialogoMapeamento ? dialogoMapeamento.abrirModal(baseEl, seletoresExtraidos, obterDepsDialogoMapeamento()) : null;
    }
    function executarInspecaoECapturaSeletorUnico(el) {
        ocultarInspetorTempoReal();
        notificarOutrosFramesOcultarInspetor();
        return dialogoMapeamento ? dialogoMapeamento.executarInspecaoECapturaSeletorUnico(el, obterDepsDialogoMapeamento()) : null;
    }
    function extrairCaminhoXPathAbsoluto(el) { return dialogoMapeamento ? dialogoMapeamento.extrairCaminhoXPathAbsoluto(el) : ''; }
    function extrairCaminhoXPathRelativo(el) { return dialogoMapeamento ? dialogoMapeamento.extrairCaminhoXPathRelativo(el) : ''; }
    function extrairSeletorCssSimplificado(el) { return dialogoMapeamento ? dialogoMapeamento.extrairSeletorCssSimplificado(el) : ''; }
    function isRegraMuitoCurta(expressao) { return dialogoMapeamento ? dialogoMapeamento.isRegraMuitoCurta(expressao) : false; }

    function obterElementoAlvoEfetivo(e) {
        if (!e) return null;
        if (typeof e.composedPath === 'function') {
            try {
                const path = e.composedPath();
                if (path && path.length > 0) {
                    for (let i = 0; i < path.length; i++) {
                        const no = path[i];
                        if (no && no.nodeType === Node.ELEMENT_NODE) {
                            return no;
                        }
                    }
                }
            } catch (_) { }
        }
        return e.target || null;
    }

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
            } catch (_) { }
        }
    }

    /* Delegação Modular (ENG-00 / ARQ-10): Escopo de URL, Contexto Editável e Proteção DOM (src/lib/lib-escopo-url.js) */
    const gerenciadorEscopoUrl = (typeof window !== 'undefined' && typeof window.JusGovLibEscopoUrl === 'function')
        ? new window.JusGovLibEscopoUrl({ modoExecucao, listaUrlsPermitidas, listaUrlsExcecoes })
        : ((typeof window !== 'undefined' && window.JusGovLibEscopoUrl && window.JusGovLibEscopoUrl.NULL_OBJECT) || {
            aplicarConfig: () => false,
            verificarUrlPermitida: () => false,
            ehDocumentoEditorRicoIsolado: () => false,
            ehContextoEditavelOuExtensao: () => false,
            ehDominioPjeOuJusGov: () => false,
            sincronizarProtecaoLeituraDom: () => false
        });

    function verificarUrlPermitida() {
        return gerenciadorEscopoUrl.verificarUrlPermitida(modoExecucao, listaUrlsPermitidas, listaUrlsExcecoes);
    }

    function ehDocumentoEditorRicoIsolado(docRef = null) {
        return gerenciadorEscopoUrl.ehDocumentoEditorRicoIsolado(docRef);
    }

    function ehContextoEditavelOuExtensao(noAlvo) {
        return gerenciadorEscopoUrl.ehContextoEditavelOuExtensao(noAlvo);
    }

    function sincronizarProtecaoLeituraDom() {
        return gerenciadorEscopoUrl.sincronizarProtecaoLeituraDom(modoExecucao, listaUrlsPermitidas, listaUrlsExcecoes);
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
    /*
     * FUNCAO: isElementoControlePdf
     * DIRETRIZ ROOT 6.32: Identifica se o elemento alvo pertence a barra de ferramentas,
     * painel lateral ou botoes/menus de controle de um visualizador de PDF embutido
     * (<viewer-toolbar>, div#toolbar, cr-icon-button, #sidenav-container, etc.).
     */
    /* Delegação Modular POO (ARQ-09 / FEAT-73): ClassificadorComportamentoDOM (src/mod-copia/copia-comportamento-dom.js) */
    function isElementoControlePdf(el) { return comportamentoDom ? comportamentoDom.isElementoControlePdf(el) : false; }
    function isCelulaTabelaDadosLeitura(el) { return comportamentoDom ? comportamentoDom.isCelulaTabelaDadosLeitura(el) : false; }
    function isAreaLeituraOuPdfConteudo(el) { return comportamentoDom ? comportamentoDom.isAreaLeituraOuPdfConteudo(el) : true; }
    function isElementoInterativoOuUi(el) { return comportamentoDom ? comportamentoDom.isElementoInterativoOuUi(el) : false; }
    function isElementoInterativoClicavelDireto(el) { return comportamentoDom ? comportamentoDom.isElementoInterativoClicavelDireto(el) : false; }
    function isComponenteSelecaoOuDropdown(el) { return comportamentoDom ? comportamentoDom.isComponenteSelecaoOuDropdown(el) : false; }
    function isComponenteBotaoOuFormularioEstrito(el) { return comportamentoDom ? comportamentoDom.isComponenteBotaoOuFormularioEstrito(el) : false; }
    function localizarBlocoForenseAutoSelecionavelEmInterface(t, i, n = 1, c = false) { return comportamentoDom ? comportamentoDom.localizarBlocoForenseAutoSelecionavelEmInterface(t, i, n, c) : null; }
    function isElementoOcultoNoDom(el) { return comportamentoDom ? comportamentoDom.isElementoOcultoNoDom(el) : false; }
    function extrairTextoVisivelLimpoDeElemento(el) { return comportamentoDom ? comportamentoDom.extrairTextoVisivelLimpoDeElemento(el) : ""; }
    function isLinkMultilinha(el) { return comportamentoDom ? comportamentoDom.isLinkMultilinha(el) : false; }
    function extrairLinhaClicadaDeLink(el, x, y, r = null) { return comportamentoDom ? comportamentoDom.extrairLinhaClicadaDeLink(el, x, y, r) : null; }
    function criarRangeTextoParaEtiquetaOuObjeto(el) { return comportamentoDom ? comportamentoDom.criarRangeTextoParaEtiquetaOuObjeto(el) : null; }
    function resolverRangeAltEmInterface(a, p, x, y, n = 1, m = null) { return comportamentoDom ? comportamentoDom.resolverRangeAltEmInterface(a, p, x, y, n, m) : null; }
    function extrairTextoLinkUmaLinha(el) { return comportamentoDom ? comportamentoDom.extrairTextoLinkUmaLinha(el) : ""; }
    function isContextoDeSistemaOuUi(el) { return comportamentoDom ? comportamentoDom.isContextoDeSistemaOuUi(el) : false; }
    function isElementoClaramenteDeInterface(el) { return comportamentoDom ? comportamentoDom.isElementoClaramenteDeInterface(el) : false; }
    function isTelaSistemaEstritaParaDesselecao(el) { return comportamentoDom ? comportamentoDom.isTelaSistemaEstritaParaDesselecao(el) : false; }
    function normalizarModoRetirarSelecao(v) { return comportamentoDom ? comportamentoDom.normalizarModoRetirarSelecao(v) : "total_exceto_arrasto"; }
    function deveManterSelecaoAtivaNoDom(n, e = false) { return comportamentoDom ? comportamentoDom.deveManterSelecaoAtivaNoDom(n, e) : true; }
    function isCampoDeTextoValido(t) { return comportamentoDom ? comportamentoDom.isCampoDeTextoValido(t) : false; }
    function isElementoInterfaceDeEditorRico(t) { return comportamentoDom ? comportamentoDom.isElementoInterfaceDeEditorRico(t) : false; }
    function isElementoOuAncestralContentEditable(t) { return comportamentoDom ? comportamentoDom.isElementoOuAncestralContentEditable(t) : false; }
    function isEditorMultilinhaValido(t) { return comportamentoDom ? comportamentoDom.isEditorMultilinhaValido(t) : false; }
    function isBlocoVerificavel(t) { return comportamentoDom ? comportamentoDom.isBlocoVerificavel(t) : false; }
    function isTextoCampoEstruturadoForense(t) { return comportamentoDom ? comportamentoDom.isTextoCampoEstruturadoForense(t) : false; }
    function verificarProtecaoTamanhoMinimoInterface(t, e, m, mc = null) { return comportamentoDom ? comportamentoDom.verificarProtecaoTamanhoMinimoInterface(t, e, m, mc) : true; }
    function isElementoEmCampoEditavel(n) { return comportamentoDom ? comportamentoDom.isElementoEmCampoEditavel(n) : false; }
    function isSelecaoOuElementoEmCampoEditavel(a) { return comportamentoDom ? comportamentoDom.isSelecaoOuElementoEmCampoEditavel(a) : false; }
    function mapearTipoParaContextoAlvo(tr, a) { return comportamentoDom ? comportamentoDom.mapearTipoParaContextoAlvo(tr, a) : null; }
    function classificarContextoElementoAlvo(el) { return comportamentoDom ? comportamentoDom.classificarContextoElementoAlvo(el) : "IGNORAR"; }

    /* ==========================================================================
     * SECAO 3: CLASSIFICADORES DE CARACTERES EM TEMPO CONSTANTE O(1) (BITMASK)
     * Delega diretamente para JusGovConstantes (fonte unica de verdade).
     * ========================================================================== */
    const eAlfanumericoUnicode = C_EXT.eAlfanumericoUnicode;
    const eEspacoBranco = C_EXT.eEspacoBranco;
    const ePontuacaoFim = C_EXT.ePontuacaoFim;
    const eDelimitadorPar = C_EXT.eDelimitadorPar;
    const eCaractereAspas = C_EXT.eCaractereAspas;
    const eSimboloRepetivel = C_EXT.eSimboloRepetivel;
    const eQuebraDeLinha = C_EXT.eQuebraDeLinha;

    /* ==========================================================================
     * SECAO 4: RESOLUCAO DO PONTO DE CLIQUE E EXTRACAO DE TEXTO COM JANELA O(1)
     * ========================================================================== */
    function garantirSelecaoForcadaEmElemento(alvo) { return comportamentoDom ? comportamentoDom.garantirSelecaoForcadaEmElemento(alvo) : undefined; }
    function isContainerComposto(el) { return comportamentoDom ? comportamentoDom.isContainerComposto(el) : true; }
    function obterObjetoInterativoParaSelecaoCompleta(alvo) { return comportamentoDom ? comportamentoDom.obterObjetoInterativoParaSelecaoCompleta(alvo) : null; }

    /* ==========================================================================
     * SECAO 4: GEOMETRIA DOM E RESOLUCAO DE COORDENADAS
     * Delegada a classe GeometriaDOM (src/mod-copia/copia-geometria.js)
     * ========================================================================== */
    function localizarPontoTextoDentroDeElemento(elRaiz, x, y) {
        return geometria ? geometria.localizarPontoTextoDentroDeElemento(elRaiz, x, y) : null;
    }

    function obterPontoDoClique(x, y, docRef) {
        return geometria ? geometria.obterPontoDoClique(x, y, docRef) : null;
    }

    function obterBlocoAncestralContextual(noAlvo) {
        return geometria ? geometria.obterBlocoAncestralContextual(noAlvo) : (noAlvo && noAlvo.ownerDocument ? noAlvo.ownerDocument.body : document.body);
    }

    function construirMapaTextoBlocoComJanela(noAlvo, offsetNoAlvo) {
        return geometria ? geometria.construirMapaTextoBlocoComJanela(noAlvo, offsetNoAlvo) : { bloco: null, texto: '', idxCursor: 0, deslocamentoJanela: 0, segmentos: [], tamanhoTotalBloco: 0 };
    }

    function criarRangeDOMAPartirDeIndices(mapa, inicioRel, fimRel) {
        return geometria ? geometria.criarRangeDOMAPartirDeIndices(mapa, inicioRel, fimRel) : null;
    }

    /*
     * FUNCAO: verificarProximidadeGeometricaDoClique (BUG-42 / USAB-10 — Seção 6.109)
     * OBJETIVO: Garantir que um clique único (detail === 1) em áreas vazias longe do texto
     * (acima do 1º parágrafo, abaixo do último ou em margens laterais) não selecione falsamente
     * a primeira ou última palavra retornada pelo fallback de caretRangeFromPoint.
     */
    function verificarProximidadeGeometricaDoClique(rangeCandidato, clientX, clientY, detalheCliques = 1) {
        if (!rangeCandidato) return false;
        if (typeof detalheCliques === 'number' && detalheCliques > 1) return true;
        if (typeof clientX !== 'number' || typeof clientY !== 'number' || (clientX <= 0 && clientY <= 0)) {
            return true;
        }
        try {
            const rect = rangeCandidato.getBoundingClientRect();
            if (!rect || (rect.width === 0 && rect.height === 0)) return true;
            const tolDx = (CONFIGURACAO_MOTOR && typeof CONFIGURACAO_MOTOR.TOLERANCIA_MAXIMA_DX_CLIQUE_PX === 'number')
                ? CONFIGURACAO_MOTOR.TOLERANCIA_MAXIMA_DX_CLIQUE_PX
                : 24;
            const tolDy = (CONFIGURACAO_MOTOR && typeof CONFIGURACAO_MOTOR.TOLERANCIA_MAXIMA_DY_CLIQUE_PX === 'number')
                ? CONFIGURACAO_MOTOR.TOLERANCIA_MAXIMA_DY_CLIQUE_PX
                : 12;
            const dx = clientX < rect.left ? (rect.left - clientX) : (clientX > rect.right ? (clientX - rect.right) : 0);
            const dy = clientY < rect.top ? (rect.top - clientY) : (clientY > rect.bottom ? (clientY - rect.bottom) : 0);
            return dx <= tolDx && dy <= tolDy;
        } catch (_) {
            return true;
        }
    }

    /*
     * FUNCAO: aplicarLimpezaNumericaComTravaAlfabetica (BUG-46 / USAB-15 — Seção 6.116)
     * OBJETIVO: Na seleção com Shift mantido (Shift + Clique ou Shift + Arrastar), remover
     * espaços, pontuações e símbolos especiais para produzir uma sequência numérica limpa
     * (ex.: "05/11/2026 - 21:22" -> "051120262122"), mantendo a Trava Alfabética: se após
     * remover espaços/pontuação/símbolos restarem letras (exceto CNPJ alfanumérico isolado),
     * retorna null para que a cópia preserve o texto original sem limpeza numérica.
     */
    /* Delegação Modular POO: lib-copia-padroes.js */
    function aplicarLimpezaNumericaComTravaAlfabetica(textoBruto) {
        return padroesCopia ? padroesCopia.aplicarLimpezaNumericaComTravaAlfabetica(textoBruto, modoShiftCnj) : null;
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
    /* ==========================================================================
     * SECAO 5: ARQUITETURA PROGRESSIVA DE FILTROS HTML EM 5 NIVEIS E SANITIZACAO
     * Delegada a classe FiltrosHtml (src/mod-copia/copia-filtros.js)
     * ========================================================================== */
    function aplicarFiltro1DadosLixo(textoBruto) {
        return filtros ? filtros.aplicarFiltro1DadosLixo(textoBruto) : String(textoBruto || '');
    }

    function unificarLinhasComEspacamentoAntiTruncamento(texto) {
        return filtros ? filtros.unificarLinhasComEspacamentoAntiTruncamento(texto) : String(texto || '').trim();
    }

    function aplicarFiltro3InformacoesELinhas(textoBruto) {
        return filtros ? filtros.aplicarFiltro3InformacoesELinhas(textoBruto) : String(textoBruto || '').trim();
    }

    function higienizarTextoParaCopia(textoBruto) {
        return filtros ? filtros.higienizarTextoParaCopia(textoBruto) : String(textoBruto || '').trim();
    }

    function escaparTextoHtmlBasico(str) {
        return filtros ? filtros.escaparTextoHtmlBasico(str) : String(str || '');
    }

    function extrairTextoPuroSanitizado(origem) {
        return filtros ? filtros.extrairTextoPuroSanitizado(origem) : String(origem || '');
    }

    function construirHtmlNivel1Basico(raiz) {
        return filtros ? filtros.construirHtmlNivel1Basico(raiz) : '';
    }

    function construirHtmlNivel2Intermediario(raiz) {
        return filtros ? filtros.construirHtmlNivel2Intermediario(raiz) : '';
    }

    function construirHtmlNivel3Avancado(raiz) {
        return filtros ? filtros.construirHtmlNivel3Avancado(raiz) : '';
    }

    function construirHtmlNivel4Estendido(raiz) {
        return filtros ? filtros.construirHtmlNivel4Estendido(raiz) : '';
    }

    function normalizarNivelFiltro(nivel) {
        return filtros ? filtros.normalizarNivelFiltro(nivel) : 'basico';
    }

    function converterNivelFiltroParaIndice(nivel) {
        return filtros ? filtros.converterNivelFiltroParaIndice(nivel) : 1;
    }

    function converterIndiceParaNivelFiltro(indice) {
        return filtros ? filtros.converterIndiceParaNivelFiltro(indice) : 'basico';
    }

    function aplicarFiltroHtmlPorNivel(origem, nivel) {
        return filtros ? filtros.aplicarFiltroHtmlPorNivel(origem, nivel) : '';
    }

    function envolverHtmlComResetDeCursorParaWord(codigoHTML) {
        return filtros ? filtros.envolverHtmlComResetDeCursorParaWord(codigoHTML) : String(codigoHTML || '');
    }

    function construirHtmlFormatacaoBasica(rangeOuElemento) {
        return filtros ? filtros.construirHtmlFormatacaoBasica(rangeOuElemento) : '';
    }

    function construirHtmlFormatacaoAvancada(rangeOuElemento) {
        return filtros ? filtros.construirHtmlNivel3Avancado(rangeOuElemento) : '';
    }

    function construirHtmlSemFiltroWord(rangeOuElemento) {
        return filtros ? filtros.construirHtmlNivel4Estendido(rangeOuElemento) : '';
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
        return padroesCopia ? padroesCopia.verificarSeTextoEhBlocoOuPalavraUnica(textoAlvo) : false;
    }

    /* Delegação Modular (ARQ-08 / FEAT-102): Motor Independente de Colagem (src/mod-colar/mod-colar.js) */
    const ClasseColagemGlobal = (typeof window !== 'undefined') ? (window.JusGovModuloColar || window.JusGovModuloColagem) : null;
    const moduloColagem = (typeof ClasseColagemGlobal === 'function')
        ? new ClasseColagemGlobal({
            obterEstadoOpcoes: () => ({
                manterFormatacaoBasica,
                nivelFiltroFormatacao,
                ultimoTextoLimpo: ultimoTextoSelecionadoLimpo,
                modoShiftCnj,
                selecaoEditavelAtiva
            }),
            classificarContextoElementoAlvo,
            confirmarVisualMarcador: (txt) => (visual && typeof visual.confirmarColagemEMarcarPermanente === 'function')
                ? visual.confirmarColagemEMarcarPermanente(txt)
                : null,
            selecionarTudoAoEntrarNoInput: (el, atrasoMs) => selecionarTudoAoEntrarNoInput(el, atrasoMs)
        })
        : ((typeof window !== 'undefined' && window.JusGovModuloColagem && window.JusGovModuloColagem.NULL_OBJECT) || {
            aplicarFiltroShiftParaColagem: (txt) => String(txt || ''),
            resolverAlvoEditavel: () => null,
            focarElementoSeguro: () => false,
            ativarComponenteParaColagem: () => false,
            confirmarFocarEColarBotaoMeio: async () => false,
            executarColagem: async () => false,
            executarColagemBotaoDireito: async () => false,
            inserirTextoEmElemento: () => false,
            emularTeclasColar: () => false,
            emularTeclasWinV: () => false,
            confirmarColagemGlobalEMarcarPermanente: () => null
        });

    /* Delegação Modular (SRP/DIP + Null Object): Gestão de Clipboard Interno e Gravação Multi-MIME (copia-clipboard.js) */
    const gerenciadorClipboard = (typeof window !== 'undefined' && typeof window.JusGovClipboardInterno === 'function')
        ? new window.JusGovClipboardInterno({
            gerenciadorColagem: moduloColagem,
            obterEstadoOpcoes: () => ({
                manterFormatacaoBasica,
                nivelFiltroFormatacao,
                padronizarFonteCopiaAtivo,
                fontePadraoCopia,
                tamanhoFontePadraoCopia,
                ultimoTextoLimpo: ultimoTextoSelecionadoLimpo
            }),
            normalizarNivelFiltro,
            verificarSeTextoEhBlocoOuPalavraUnica,
            aplicarFiltroHtmlPorNivel,
            envolverHtmlComResetDeCursorParaWord,
            extrairTextoPuroSanitizado,
            aplicarFiltro1DadosLixo,
            aplicarFiltro3InformacoesELinhas,
            gerarMapaFormatosClipboard: (origem, nivel, op) => (filtros && typeof filtros.gerarMapaFormatosClipboard === 'function')
                ? filtros.gerarMapaFormatosClipboard(origem, nivel, op)
                : null,
            gerarHtmlTextoPuroComFontePadrao: (txt) => (filtros && typeof filtros.gerarHtmlTextoPuroComFontePadrao === 'function')
                ? filtros.gerarHtmlTextoPuroComFontePadrao(txt)
                : '',
            confirmarVisualMarcador: (txt) => (visual && typeof visual.confirmarColagemEMarcarPermanente === 'function')
                ? visual.confirmarColagemEMarcarPermanente(txt)
                : null
        })
        : {
            salvarClipboardInternoComBackup: () => false,
            registrarUltimaSelecao: () => { },
            gravarNaAreaDeTransferencia: async () => false,
            emularTeclasColar: () => false,
            emularTeclasWinV: () => { },
            inserirTextoEmElemento: () => { },
            confirmarColagemGlobalEMarcarPermanente: () => null,
            executarColagemBotaoDireito: async () => { }
        };

    /* ==========================================================================
     * FEAT-64 / Seção 6.196: INTERCEPTAÇÃO DE BOTÕES/ÍCONES NATIVOS DE "COPIAR"
     * (ex.: ícone 📋 "Copiar número para área de transferência" do PJe/GovBR)
     * Filtra, higieniza, aplica filtro Shift (se Shift pressionado), salva no
     * clipboard interno (2 slots + storage.local) e grava no clipboard do sistema!
     * ========================================================================== */
    /* Delegação Modular POO (ARQ-09 / FEAT-73): GerenciadorCopia (src/mod-copia/copia-copiar.js) */
    const SELETOR_BOTAO_COPIAR_NATIVO = (typeof window !== "undefined" && window.JusGovGerenciadorCopia && window.JusGovGerenciadorCopia.SELETOR_BOTAO_COPIAR_NATIVO) || "";
    function localizarBotaoCopiarNativo(alvo) { return gerenciadorCopia ? gerenciadorCopia.localizarBotaoCopiarNativo(alvo) : null; }
    function extrairDadosAlvoDeBotaoCopiarNativo(btnEl) { return gerenciadorCopia ? gerenciadorCopia.extrairDadosAlvoDeBotaoCopiarNativo(btnEl) : null; }
    async function processarTextoCopiaNativaInterceptada(textoBruto, opcoes = {}) { return gerenciadorCopia ? gerenciadorCopia.processarTextoCopiaNativaInterceptada(textoBruto, opcoes) : false; }
    async function interceptarCliqueBotaoCopiarNativo(elAlvo, eventoMouse = null) { return gerenciadorCopia ? gerenciadorCopia.interceptarCliqueBotaoCopiarNativo(elAlvo, eventoMouse) : false; }

    const salvarClipboardInternoComBackup = (novoPayload) => gerenciadorClipboard.salvarClipboardInternoComBackup(novoPayload);
    const registrarUltimaSelecao = (novoItem, itemAnt, hist) => gerenciadorClipboard.registrarUltimaSelecao(novoItem, itemAnt, hist);
    const gravarNaAreaDeTransferencia = (textoFinal, rangeDOM = null, opcoesGrav = {}) => gerenciadorClipboard.gravarNaAreaDeTransferencia(textoFinal, rangeDOM, opcoesGrav);
    const emularTeclasColar = (alvo, texto, html) => gerenciadorClipboard.emularTeclasColar(alvo, texto, html);
    const emularTeclasWinV = (alvo) => gerenciadorClipboard.emularTeclasWinV(alvo);

    /* ==========================================================================
     * SECAO 5.4: FEEDBACK VISUAL FLASH BORDER E MINITIPS
     * Delegada a classe FeedbackVisual (src/mod-copia/copia-visual.js)
     * ========================================================================== */
    function converterHexParaRgbaFlash(hexBruto, alfa = 0.28) {
        return visual ? visual.converterHexParaRgbaFlash(hexBruto, alfa) : { hex: '#0d9488', rgba: 'rgba(13, 148, 136, 0.28)' };
    }

    function limparFlashBorderImediatamente() {
        if (timerFlashBorder) {
            clearTimeout(timerFlashBorder);
            timerFlashBorder = null;
        }
        aguardandoDesselecaoFlash = false;
        flashExclusivoSemSelecao = false;
        if (visual) {
            visual.limparFlashBorderImediatamente();
        } else {
            try {
                const containers = document.querySelectorAll('#jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"]');
                for (let i = 0; i < containers.length; i++) {
                    const c = containers[i];
                    if (c && c.parentNode) c.parentNode.removeChild(c);
                }
            } catch (_) { }
        }
    }

    function limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip = false) {
        if (validador && typeof validador.ocultarTodosAvisosImediatamente === 'function') {
            validador.ocultarTodosAvisosImediatamente(preservarMiniTip);
        } else if (visual) {
            visual.limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip, validador);
        }
    }

    function agendarRetiradaFlashAposDesselecao(preservarMiniTip = false) {
        if (aguardandoDesselecaoFlash) return;
        aguardandoDesselecaoFlash = true;
        const duracao = tempoFlashBorderMs !== 0 ? tempoFlashBorderMs : -1;
        if (duracao !== -1) {
            timerFlashBorder = setTimeout(() => {
                limparFlashBorderImediatamente();
                limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip);
            }, duracao);
        }
    }

    function dispararFlashBorderVisual(rangeAlvo, duracaoCustomMs, corCustomHex) {
        const duracaoMs = (typeof duracaoCustomMs === 'number') ? duracaoCustomMs : (tempoFlashBorderMs !== 0 ? tempoFlashBorderMs : -1);
        limparFlashBorderImediatamente();
        if (duracaoMs === 0 || !rangeAlvo) return false;
        const cor = corCustomHex || corFlashBorder;
        let ativou = false;
        if (visual) {
            ativou = Boolean(visual.dispararFlashBorderVisual(rangeAlvo, duracaoMs, cor));
        }
        if (ativou && duracaoMs !== -1) {
            timerFlashBorder = setTimeout(() => {
                limparFlashBorderImediatamente();
            }, duracaoMs);
        }
        return ativou;
    }
    function registrarEstatisticaOperacional(inconsistenciaDetectada = false) { return gerenciadorCopia ? gerenciadorCopia.registrarEstatisticaOperacional(inconsistenciaDetectada) : undefined; }
    function isSelecaoExtensaOuMultipage(rangeAlvo, textoRef = "") { return progressaoSelecao ? progressaoSelecao.isSelecaoExtensaOuMultipage(rangeAlvo, textoRef) : false; }

    function aplicarSelecaoDOM(rangeAlvo, opcoes = {}) {
        if (!rangeAlvo) return { ok: false, manterSelecao: true };
        const noContexto = opcoes.noContexto || rangeAlvo.commonAncestorContainer || null;
        const eraArrasto = Boolean(opcoes.eraArrasto);
        const removePorFlash = (modoRetirarSelecao === 'com_flash' && tempoFlashBorderMs !== 0);
        const manterPorSemFlash = (modoRetirarSelecao === 'nenhuma' || (modoRetirarSelecao === 'com_flash' && tempoFlashBorderMs === 0));
        const manterSelecao = (opcoes.forcarDesselecao === true && !manterPorSemFlash && (modoRetirarSelecao !== 'total_exceto_arrasto' || !eraArrasto))
            ? false
            : ((opcoes.forcarManterSelecao === true && modoRetirarSelecao !== 'total' && !removePorFlash && (modoRetirarSelecao !== 'total_exceto_arrasto' || eraArrasto))
                ? true
                : deveManterSelecaoAtivaNoDom(noContexto, eraArrasto));

        try {
            const sel = window.getSelection();
            if (sel && manterSelecao) {
                const rangeJaAtivo = sel.rangeCount > 0 &&
                    sel.getRangeAt(0).startContainer === rangeAlvo.startContainer &&
                    sel.getRangeAt(0).startOffset === rangeAlvo.startOffset &&
                    sel.getRangeAt(0).endContainer === rangeAlvo.endContainer &&
                    sel.getRangeAt(0).endOffset === rangeAlvo.endOffset;
                if (!rangeJaAtivo) {
                    sel.removeAllRanges();
                    sel.addRange(rangeAlvo);
                }
            } else if (sel && !manterSelecao && opcoes.aplicarNoDomAntesDeLimpar !== false) {
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
        } catch (_) { }

        let flashAtivouDom = false;
        if (opcoes.dispararFlash !== false) {
            if (tempoFlashBorderMs !== 0) {
                flashAtivouDom = dispararFlashBorderVisual(rangeAlvo);
                flashExclusivoSemSelecao = Boolean(!manterSelecao && flashAtivouDom);
            } else {
                limparFlashBorderImediatamente();
            }
        }

        const manterFinalDom = (modoRetirarSelecao === 'com_flash' && opcoes.dispararFlash !== false && !flashAtivouDom)
            ? true
            : manterSelecao;

        if (!manterFinalDom && opcoes.limparImediatamente === true) {
            try {
                const selLimpar = window.getSelection();
                if (selLimpar) selLimpar.removeAllRanges();
                flashExclusivoSemSelecao = (tempoFlashBorderMs !== 0);
            } catch (_) { }
        }

        return { ok: true, manterSelecao: manterFinalDom, manterSelecaoNoDom: manterFinalDom };
    }

    /*
     * FUNCAO: executarCopiaDeSelecao
     * DIRETRIZ ROOT 6.16 (Modulo de Copia Desacoplado e Reativo):
     * Higieniza o texto do Range (ou texto sobrescrito), gerencia o Modo Acumulador ou copia simples,
     * grava na Area de Transferencia (e no clipboard simulado interno com backup do anterior),
     * registra a assinatura de deduplicacao e executa a validacao matematica nao-bloqueante.
     */
    /**
     * @MAPA-IA-FN: executarCopiaDeSelecao
     * @MAPA-IA-DOM-LEITURA: rangeAlvo, selection
     */
    async function executarCopiaDeSelecao(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesCopia = {}) {
        return gerenciadorCopia ? gerenciadorCopia.executarCopiaDeSelecao(rangeAlvo, modoAcumulador, textoSobrescrito, opcoesCopia) : false;
    }
    async function aplicarSelecaoECopiar(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesSelecao = {}) {
        return gerenciadorCopia ? gerenciadorCopia.aplicarSelecaoECopiar(rangeAlvo, modoAcumulador, textoSobrescrito, opcoesSelecao) : false;
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
    /* ==========================================================================
     * SECAO 6: PLACEHOLDERS DE MINUTAS E PRE-SELECAO EM EDITORES MULTILINHA
     * Delegada a classe PlaceholdersMinutas (src/mod-copia/copia-minutas.js)
     * ========================================================================== */
    function localizarCampoSimbolosSobCursor(texto, idx) {
        return placeholders ? placeholders.localizarCampoSimbolosSobCursor(texto, idx) : null;
    }

    function tratarCliqueEmEditorMultilinhaSemCopia(e) {
        return placeholders ? placeholders.tratarCliqueEmEditorMultilinhaSemCopia(e, {
            geometria,
            estagios: { estagio1, estagio2, estagio3, estagio4, estagio5 }
        }) : false;
    }

    /* ==========================================================================
     * SECAO 7: MOTORES DOS 6 ESTAGIOS DE EXPANSAO E CONTEXTO INCREMENTAL
     * ========================================================================== */
    /* ==========================================================================
     * SECAO 7: MOTORES DOS 6 ESTAGIOS DE EXPANSAO E CONTEXTO INCREMENTAL
     * Delegados as classes especializadas POO EstagioUnidadeAtomica..EstagioParagrafos
     * (copia-estagio1.js .. copia-estagio5.js)
     * ========================================================================== */
    function linhaEhTodaMaiuscula(strLinha) {
        return estagio2 ? estagio2.linhaEhTodaMaiuscula(strLinha) : false;
    }

    function tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idx) {
        return estagio2 ? estagio2.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idx) : null;
    }

    function tentarExpandirBlocoFormatadoDestaque(mapa, idx) {
        return estagio2 ? estagio2.tentarExpandirBlocoFormatadoDestaque(mapa, idx) : null;
    }

    function delimitarParagrafoLocalizado(mapa, idx, inclusivo) {
        return estagio5 ? estagio5.delimitarParagrafoLocalizado(mapa, idx, inclusivo) : null;
    }

    function resolverSelecaoTriploClique(mapa, idx) {
        return estagio5 ? estagio5.resolverSelecaoTriploClique(mapa, idx, estagio1) : null;
    }

    function tentarExpandirDelimitadoresSimetricos(texto, idx, inclusivo) {
        return estagio4 ? estagio4.tentarExpandirDelimitadoresSimetricos(texto, idx, inclusivo) : null;
    }

    function extrairPalavraSobCursor(texto, idx) {
        return estagio2 ? estagio2.extrairPalavraSobCursor(texto, idx) : null;
    }

    function tentarExpandirPadraoComposto(texto, idx, espaco, alt) {
        return estagio2 ? estagio2.tentarExpandirPadraoComposto(texto, idx, espaco, alt) : null;
    }

    function expandirUnidadeAtomicaEstagio1(texto, idx) {
        return estagio1 ? estagio1.expandirUnidadeAtomicaEstagio1(texto, idx) : null;
    }

    function tentarExpandirSentencaPorDoisPontos(texto, idx) {
        return estagio3 ? estagio3.tentarExpandirSentencaPorDoisPontos(texto, idx) : null;
    }

    function expandirFraseAtePontuacaoEstagio3(texto, idx) {
        return estagio3 ? estagio3.expandirFraseAtePontuacaoEstagio3(texto, idx) : null;
    }

    function expandirSentencaCompletaAtePonto(texto, idx) {
        return estagio3 ? estagio3.expandirSentencaCompletaAtePonto(texto, idx) : null;
    }

    /* Delegação Modular POO (ARQ-10 Fase 2A): Política de Expansão e Seleção Global (src/mod-copia/copia-politica-selecao.js) */
    const politicaSelecao = (typeof window !== 'undefined' && typeof window.JusGovCopiaPoliticaSelecao === 'function')
        ? new window.JusGovCopiaPoliticaSelecao({
            resolverSelecaoTriploClique,
            eEspacoBranco,
            eAlfanumericoUnicode,
            eDelimitadorPar,
            eCaractereAspas,
            tentarExpandirDelimitadoresSimetricos,
            tentarExpandirPadraoComposto,
            tentarExpandirBlocoMaiusculasComQuebraSuave,
            tentarExpandirBlocoFormatadoDestaque,
            expandirSentencaCompletaAtePonto,
            expandirFraseAtePontuacaoEstagio3,
            tentarExpandirSentencaPorDoisPontos,
            expandirUnidadeAtomicaEstagio1,
            obterPontoDoClique,
            construirMapaTextoBlocoComJanela,
            criarRangeDOMAPartirDeIndices,
            ehDocumentoEditorRicoIsolado,
            isAreaLeituraOuPdfConteudo,
            isSelecaoOuElementoEmCampoEditavel,
            verificarUrlPermitida,
            classificarContextoElementoAlvo,
            isComponenteBotaoOuFormularioEstrito,
            isComponenteSelecaoOuDropdown,
            isElementoInterativoClicavelDireto,
            localizarBlocoForenseAutoSelecionavelEmInterface,
            verificarProtecaoTamanhoMinimoInterface,
            aplicarSelecaoECopiar,
            getEstado: () => ({
                selecaoSendoAplicadaPeloAddon,
                timerDebounceSelecaoGlobal,
                isMousePressionado,
                teclasPressionadasAtivas,
                ultimoRangeAssinaturaGlobal,
                ultimaSelecaoManualTexto,
                ultimoTimestampSelecaoManual
            }),
            setEstado: (patch) => {
                if (!patch) return;
                if (Object.prototype.hasOwnProperty.call(patch, 'selecaoSendoAplicadaPeloAddon')) selecaoSendoAplicadaPeloAddon = patch.selecaoSendoAplicadaPeloAddon;
                if (Object.prototype.hasOwnProperty.call(patch, 'timerDebounceSelecaoGlobal')) timerDebounceSelecaoGlobal = patch.timerDebounceSelecaoGlobal;
                if (Object.prototype.hasOwnProperty.call(patch, 'ultimoRangeAssinaturaGlobal')) ultimoRangeAssinaturaGlobal = patch.ultimoRangeAssinaturaGlobal;
                if (Object.prototype.hasOwnProperty.call(patch, 'ultimaSelecaoManualTexto')) ultimaSelecaoManualTexto = patch.ultimaSelecaoManualTexto;
                if (Object.prototype.hasOwnProperty.call(patch, 'ultimoTimestampSelecaoManual')) ultimoTimestampSelecaoManual = patch.ultimoTimestampSelecaoManual;
            }
        })
        : ((typeof window !== 'undefined' && window.JusGovCopiaPoliticaSelecao && window.JusGovCopiaPoliticaSelecao.NULL_OBJECT) || {
            resolverIndicesExpansaoBase: () => null,
            obterRangePalavraOuBlocoNoPonto: () => null,
            calcularAssinaturaSelecao: () => '',
            tratarMudancaSelecaoGlobal: () => undefined
        });

    function resolverIndicesExpansaoBase(mapa, idxCursor, numCliques = 1, opcoes = {}) {
        return politicaSelecao.resolverIndicesExpansaoBase(mapa, idxCursor, numCliques, opcoes);
    }

    /* ==========================================================================
     * SECAO 8: SELECAO EM TABELAS E ORQUESTRADOR ELASTICO (CTRL OU ALT: CLIQUE E ARRASTO)
     * ========================================================================== */
    function obterRangePalavraOuBlocoNoPonto(clientX, clientY) {
        return politicaSelecao.obterRangePalavraOuBlocoNoPonto(clientX, clientY);
    }

    /* Delegação Modular POO: ProgressaoAtalhosSelecao (src/mod-copia/copia-progressao.js) */
    async function executarMotorElastico(e) { return progressaoSelecao ? progressaoSelecao.executarMotorElastico(e) : false; }
    function atualizarArrastoElasticoNoMovimento(e) { return progressaoSelecao ? progressaoSelecao.atualizarArrastoElasticoNoMovimento(e) : undefined; }
    async function tentarSelecionarTabelaLinhaOuColuna(e) { return progressaoSelecao ? progressaoSelecao.tentarSelecionarTabelaLinhaOuColuna(e) : false; }

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
    /* Delegação Modular (ENG-00 / ARQ-10 Grupo A): Orquestrador de Botões do Mouse em src/mod-input/input-orquestrador-mouse.js */
    const orquestradorMouse = (typeof window !== 'undefined' && typeof window.JusGovInputOrquestradorMouse === 'function')
        ? new window.JusGovInputOrquestradorMouse({
            obterFachadaInput: () => fachadaModuloInput,
            resolverAlvoEditavel: (el) => resolverAlvoEditavelParaMeio(el),
            focarElementoSeguro: (el) => focarElementoSeguroMeio(el),
            ativarComponenteParaColagem: (a, f) => ativarComponenteParaColagem(a, f),
            confirmarFocarEColarBotaoMeio: (...args) => confirmarFocarEColarBotaoMeio(...args),
            executarColagem: (...args) => executarColagemBotaoDireito(...args),
            classificarContexto: (el) => classificarContextoElementoAlvo(el)
        })
        : ((typeof window !== 'undefined' && window.JusGovInputOrquestradorMouse && window.JusGovInputOrquestradorMouse.NULL_OBJECT) || {
            aplicarConfig: () => false,
            tratarBotoesLaterais4e5: () => false,
            tratarMouseDownBotaoMeio: () => false,
            tratarMouseUpBotaoMeio: () => false,
            tratarAuxClick: () => false,
            tratarContextMenuColagem: () => false,
            destruir: () => true
        });

    function tratarNavegacaoAbasPorBotoesMouse(e) {
        orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
        return orquestradorMouse.tratarBotoesLaterais4e5(e);
    }

    /**
     * Modulo TECLADO/MOUSE: Navegacao entre campos de entrada simples via setas (ArrowDown / ArrowUp).
     * Delega ao submodulo especializado NavegacaoTecladoCampos (mod-input).
     */
    function navegarEntreCamposEntrada(inputAtual, direcao) {
        if (!inputAtual) return false;
        const modInput = fachadaModuloInput || (typeof window !== 'undefined' && (window.JusGovInstanciaInput || window.JusGovModuloInputInstancia)) || null;
        if (modInput && modInput.tecladoCampos && typeof modInput.tecladoCampos.navegarParaCampo === 'function') {
            modInput.tecladoCampos.ativo = Boolean(navegacaoTecladoCamposAtiva);
            return modInput.tecladoCampos.navegarParaCampo(inputAtual, direcao);
        }
        return false;
    }

    /*
     * FUNCAO: lidarFocoInteligente (Autofill & Datepicker Helper)
     * DIRETRIZ FUNDAMENTAL: NUNCA auto-selecionar campos editaveis ao focar para
     * preservar o cursor nativo do usuario, permitindo posicionamento livre e digitacao.
     */
    let ultimoTempoSelecaoInteligente = 0;
    function lidarFocoInteligente(event) {
        /* REGRA FUNDAMENTAL: NUNCA auto-selecionar campos editaveis ao focar */
        return;
    }

    function aoPressionarBotaoMouse(e) {
        /* Saida O(1) para botao direito comum sem modificadores nem colagem por botao direito:
         * evita travamentos, lentidao e varredura DOM/XPath em editores de texto (CKEditor/contenteditable) */
        if (e && e.button === 2 && !e.ctrlKey && !e.altKey && !colagemBotaoDireitoAtiva) {
            return;
        }
        const docEventoDown = (e && e.target && e.target.ownerDocument) ? e.target.ownerDocument : document;
        const ehDocEditorRicoDown = ehDocumentoEditorRicoIsolado(docEventoDown);
        if (!ehDocEditorRicoDown && (!cssBlindado || !document.getElementById('pje-turbo-lock'))) {
            blindarCSS();
        }
        if (ehDocEditorRicoDown && e && e.button === 0 && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            return;
        }

        const elAlvoEfetivo = obterElementoAlvoEfetivo(e);
        if (validador && typeof validador.registrarPontoInteracaoMouse === 'function') {
            validador.registrarPontoInteracaoMouse(e.clientX, e.clientY);
        }

        /* BUG-02, Seção 6.30 e Seção 6.96 / BUG-40:
         * No modo Até Interação (-1), o aviso/flash recém-criado possui carência protetiva de 40ms para
         * prevenir que o próprio evento de soltura do mouse ou finalização da cópia o desmonte prematuramente.
         * Cliques em modais críticos continuam destruindo imediatamente. */
        const agoraMousedown = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        const tsUltimoAvisoOuFlash = Math.max(
            timestampCriacaoFlash || 0,
            (validador && validador.timestampCriacaoAviso) ? validador.timestampCriacaoAviso : 0
        );
        const dentroDaCarenciaInicial = ((agoraMousedown - tsUltimoAvisoOuFlash) < 60);

        const temAvisoAtivoNoValidador = Boolean(
            validador && (
                (typeof validador.estaAvisoVisivel === 'function' && validador.estaAvisoVisivel()) ||
                validador.avisoVisivel ||
                validador.temporizadorAlerta
            )
        );
        cliqueDentroDaSelecaoAtiva = false;
        if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            try {
                const pDown = obterPontoDoClique(e.clientX, e.clientY);
                const selPrevia = window.getSelection();
                const flashAtivoNoDom = Boolean(flashExclusivoSemSelecao || aguardandoDesselecaoFlash || timerFlashBorder || tempoFlashBorderMs === -1);
                const rPrevia = (selPrevia && !selPrevia.isCollapsed && selPrevia.rangeCount > 0)
                    ? selPrevia.getRangeAt(0)
                    : (flashAtivoNoDom ? ultimoRangeSelecionadoSimples : null);
                const dentroSelecao = Boolean(rPrevia && isPontoDentroDoRange(pDown, rPrevia));
                const dentroBlocoComposto = Boolean(
                    ultimoBlocoCompostoAtivo &&
                    ultimoBlocoCompostoAtivo.range &&
                    isPontoDentroDoRange(pDown, ultimoBlocoCompostoAtivo.range)
                );
                if (dentroSelecao || dentroBlocoComposto) {
                    cliqueDentroDaSelecaoAtiva = true;
                } else {
                    ultimoBlocoCompostoAtivo = null;
                }
            } catch (_) {
                ultimoBlocoCompostoAtivo = null;
            }
        } else if (e.button === 0) {
            ultimoBlocoCompostoAtivo = null;
        }

        if (!dentroDaCarenciaInicial && (aguardandoDesselecaoFlash || timerFlashBorder || temAvisoAtivoNoValidador)) {
            const clicouEmModalCritico = Boolean(
                elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function' &&
                elAlvoEfetivo.closest('[role="dialog"], [role="alertdialog"], .modal, .rich-modalpanel, .swal2-container, .ui-dialog, .p-dialog, mat-dialog-container')
            );
            if (clicouEmModalCritico) {
                limparFlashBorderImediatamente();
                limparAvisosAuditoriaEWikiImediatamente();
            } else if (!cliqueDentroDaSelecaoAtiva && !e.shiftKey && (!e || typeof e.button !== 'number' || e.button === 0 || e.button === 1 || e.button === 2)) {
                /* Contorno Visual (Flash) obedece apenas ao seu proprio parametro (tempoFlashBorderMs):
                 * -1 (Ate Interacao) ou > 0 (Temporizado) nao sao cancelados por um clique comum sem nova copia. */
                if (tempoFlashBorderMs === 0) {
                    limparFlashBorderImediatamente();
                }
                limparAvisosAuditoriaEWikiImediatamente();
            }
        }

        /* FEAT-102 (Seção 6.260): Mapeamento Manual Avançado Global (Ctrl + Alt + Shift + Clique)
         * Executa no MESMO contexto global livre do inspetor de movimento (antes de verificarUrlPermitida),
         * garantindo que funcione em 100% das páginas/iframes onde Ctrl+Alt+Shift + arrastar/mover funciona! */
        if (e && e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey) {
            if (moduloXPathGlobal && typeof moduloXPathGlobal.tratarMouseDownGlobal === 'function') {
                if (moduloXPathGlobal.tratarMouseDownGlobal(e, {
                    ...obterDepsDialogoMapeamento(),
                    resolverAlvo: (ev) => obterElementoAlvoEfetivo(ev) || ev.target
                })) {
                    ignorarProximoClick = true;
                    houveArrastoMouse = false;
                    return;
                }
            }
        }

        /* Modulo MOUSE: Captura dos Botoes 4 e 5 para navegacao circular entre abas (independe da lista de sites, inclusive em guias vazias about:blank) */
        if (capturaBotoesMouse4e5Ativa && (e.button === 3 || e.button === 4 || e.which === 4 || e.which === 5)) {
            tratarNavegacaoAbasPorBotoesMouse(e);
            return;
        }

        if (!verificarUrlPermitida() && !(e.button === 1 && colarBotaoMeioAtivo && modoExecucao !== 'desligado')) return;

        /* Seção 6.20, 6.85 e 6.126: Identificação Única e Assistente de Mapeamento (Ctrl + Alt + Shift + Clique ou Ctrl + Alt + Botão Direito sem acumulador) no mousedown */
        if ((e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey) || (e.button === 2 && e.ctrlKey && e.altKey && (!acumulador || acumulador.obterQuantidade() === 0))) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            ignorarProximoClick = true;
            houveArrastoMouse = false;
            return;
        }

        /* Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Permite que o navegador abra o link em nova aba sem interceptacao */
        const elLinkAlvoMouseUp = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('a[href]')
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

        /* Modulo MOUSE (ARQ-10 Grupo A): Delegado integralmente a src/mod-input/input-orquestrador-mouse.js */
        if (e.button === 1) {
            orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
            orquestradorMouse.tratarMouseDownBotaoMeio(e, elAlvoEfetivo);
            return;
        }

        /* Foco preparatorio no clique com botao direito em campo editavel (somente se colagemBotaoDireitoAtiva estiver habilitada) */
        if (e.button === 2) {
            if (colarBotaoMeioAtivo && colagemBotaoDireitoAtiva) {
                const ctxDireito = classificarContextoElementoAlvo(elAlvoEfetivo);
                if (ctxDireito === 'CAMPO_SIMPLES_EDITAVEL' || ctxDireito === 'EDITOR_MULTILINHA_EDITAVEL') {
                    try { elAlvoEfetivo.focus(); } catch (_) { }
                }
            }
            return;
        }

        if (e.button !== 0) return;
        if (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function' && elAlvoEfetivo.closest('[data-jusgov-ignore]')) {
            return;
        }

        isMousePressionado = true;
        coordsMouseDown.x = e.clientX;
        coordsMouseDown.y = e.clientY;
        if (validador && typeof validador.registrarPontoInteracaoMouse === 'function') {
            validador.registrarPontoInteracaoMouse(e.clientX, e.clientY);
        }
        houveArrastoMouse = false;
        selecaoElasticaAtivaNoClique = false;
        rangeAncoraArrastoElastico = null;
        if (progressaoSelecao) progressaoSelecao.definirRangeAncoraElastico(null);
        pontoAncoraArrastoAlt = null;

        const tipoContexto = classificarContextoElementoAlvo(elAlvoEfetivo);

        /* BUG-37 / Seção 6.90: Para campos editáveis, só retirar a seleção se for clicado/selecionado outra coisa */
        if (ultimoCampoEditavelSelecionado && elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function') {
            const inputClicado = elAlvoEfetivo.closest('input, textarea');
            if (!inputClicado || inputClicado !== ultimoCampoEditavelSelecionado.elemento) {
                ultimoCampoEditavelSelecionado = null;
            }
        }

        /* Passo 9.1: Campo Simples Editável (<input>):
         * Armazena estado de seleção prévia para alternância no mouseup (1º clique seleciona tudo; 2º clique posiciona cursor) */
        if (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL' && !(e.altKey && !e.ctrlKey && !e.shiftKey)) {
            inputAlvoMouseDown = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? (elAlvoEfetivo.closest('input') || elAlvoEfetivo)
                : elAlvoEfetivo;
            if (inputAlvoMouseDown) {
                const eraAtivo = (document.activeElement === inputAlvoMouseDown);
                let tinhaSelecao = false;
                try {
                    tinhaSelecao = (typeof inputAlvoMouseDown.selectionStart === 'number' &&
                        typeof inputAlvoMouseDown.selectionEnd === 'number' &&
                        inputAlvoMouseDown.selectionStart !== inputAlvoMouseDown.selectionEnd);
                } catch (_) { }
                inputJaEstavaSelecionadoNoMouseDown = Boolean(eraAtivo && tinhaSelecao);
            } else {
                inputJaEstavaSelecionadoNoMouseDown = false;
            }
            return;
        }

        /* REGRA FUNDAMENTAL: NUNCA copiar ou auto-selecionar de editores multilinhas / ricos (Gemini rich-textarea, textarea, contenteditable) */
        if ((tipoContexto === 'EDITOR_MULTILINHA_EDITAVEL' || isSelecaoOuElementoEmCampoEditavel(elAlvoEfetivo)) && !(e.altKey && !e.ctrlKey && !e.shiftKey)) {
            isMousePressionado = false;
            houveArrastoMouse = false;
            selecaoElasticaAtivaNoClique = false;
            rangeAncoraArrastoElastico = null;
            if (progressaoSelecao) progressaoSelecao.definirRangeAncoraElastico(null);
            pontoAncoraArrastoAlt = null;
            inputJaEstavaSelecionadoNoMouseDown = false;
            inputAlvoMouseDown = null;
            return;
        }

        if (tipoContexto === 'IGNORAR') {
            return;
        }
        if (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function' && elAlvoEfetivo.closest('[data-jusgov-ignore]')) {
            return;
        }

        const temModificadorTeclado = temModificadorTecladoAtivo(e);
        if (temModificadorTeclado) {
            garantirSelecaoForcadaEmElemento(elAlvoEfetivo);
        }

        /* BUG-29: Cliques simples (sem teclas modificadoras) sobre <label> ou seus descendentes
         * preservam integralmente a ação nativa do navegador (marcar/alternar checkbox/radio). */
        const elLabelAlvoMouseDown = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('label')
            : null;
        if (elLabelAlvoMouseDown && !temModificadorTeclado) {
            ignorarProximoClick = false;
            return;
        }

        /* Passo 9.1.5: Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Quando o usuario clica com a tecla Ctrl sobre um link hipertexto (<a href>),
         * NAO intercepta nem bloqueia o evento, permitindo que o navegador execute
         * sua acao nativa universal de abrir o link em nova aba em segundo plano. */
        const elLinkAlvo = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('a[href]')
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
            if (e.detail <= 1) {
                ultimoTextoSelecionadoLimpo = '';
                ultimoRangeSelecionadoSimples = null;
            }
            pontoAncoraArrastoAlt = obterPontoDoClique(e.clientX, e.clientY);
            ignorarProximoClick = true;
            e.preventDefault();
            e.stopPropagation();
        }

        /* DIRETRIZ ROOT 2.17: Modo Acumulador (Ctrl+Alt) e estritamente desabilitado em qualquer controle, interface ou formulario */
        if (e.ctrlKey && e.altKey) {
            if (isContextoDeSistemaOuUi(elAlvoEfetivo) || tipoContexto !== 'LEITURA_COMUM') {
                ignorarProximoClick = true;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }

        /* Em links, botoes e elementos de interface interativa (LINK_CLICAVEL ou Contexto de Sistema):
         * - DIRETRIZ ROOT IMUTAVEL: Se for clique sem tecla modificadora (Alt, Ctrl, Shift),
         *   retorna imediatamente para permitir que a navegacao e interacao nativa da pagina
         *   e do navegador funcione sem nenhuma interferencia ou delay (coordsMouseDown continua ativo para checar arrasto).
         * - Se houver Alt mantido: cancela o evento padrao (preventDefault) para evitar cliques ou acoes indesejadas,
         *   mas NUNCA forca selecao visual antecipada, permitindo que arrasto parcial ou clique unico copie limpo em mouseup! */
        const ehSistemaOuUiMousedown = (tipoContexto === 'LINK_CLICAVEL' || tipoContexto === 'SEMIFLEXIVEL');
        if (ehSistemaOuUiMousedown) {
            if (!temModificadorTeclado) {
                ignorarProximoClick = false;
                return;
            }
            ignorarProximoClick = true;
            if (e.ctrlKey || e.altKey) {
                e.preventDefault();
            }
        }

        /* Passo 9.2: Tecla Shift mantida: NUNCA desseleciona a selecao existente,
         * preservando a ancora ativa para permitir continuar ou estender a selecao atual (inclusive páginas depois) */
        if (e.shiftKey && !e.ctrlKey && !e.altKey) {
            if (!ancoraCursorShift || (ancoraCursorShift.no && !ancoraCursorShift.no.isConnected)) {
                ancoraCursorShift = null;
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                    const r = sel.getRangeAt(0);
                    ancoraCursorShift = {
                        no: sel.anchorNode || r.startContainer,
                        offset: typeof sel.anchorOffset === 'number' ? sel.anchorOffset : r.startOffset
                    };
                } else if (ultimoRangeSelecionadoSimples && ultimoRangeSelecionadoSimples.startContainer && ultimoRangeSelecionadoSimples.startContainer.isConnected) {
                    ancoraCursorShift = {
                        no: ultimoRangeSelecionadoSimples.startContainer,
                        offset: ultimoRangeSelecionadoSimples.startOffset
                    };
                }
            }
            if (ancoraCursorShift) {
                e.preventDefault();
            }
        } else if (!e.shiftKey && !cliqueDentroDaSelecaoAtiva) {
            ancoraCursorShift = null;
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
        } catch (_) { }
    }

    function aoMoverMouse(e) {
        /* Seção 6.72: Registra a coordenada do cursor no módulo de entrada para posicionamento proxi-mouse */
        if (fachadaModuloInput && fachadaModuloInput.caixaRapida && typeof fachadaModuloInput.caixaRapida.registrarPosicaoMouse === 'function') {
            fachadaModuloInput.caixaRapida.registrarPosicaoMouse(e);
        }
        if (moduloXPathGlobal && typeof moduloXPathGlobal.tratarMouseMoveGlobal === 'function') {
            moduloXPathGlobal.tratarMouseMoveGlobal(e);
        } else if (e.ctrlKey && e.altKey && e.shiftKey) {
            atualizarInspetorTempoReal(e.clientX, e.clientY, e.target);
        } else if (regrasEInspetor.temPainelInspetorVisivel()) {
            ocultarInspetorTempoReal();
        }
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
        if (e.button === 2 && e.ctrlKey && e.altKey && (!acumulador || acumulador.obterQuantidade() === 0) && verificarUrlPermitida()) {
            const alvoDir = obterElementoAlvoEfetivo(e) || e.target;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            executarInspecaoECapturaSeletorUnico(alvoDir);
            ignorarProximoClick = true;
            houveArrastoMouse = false;
            return;
        }
        /* Conclusão do Botão do Meio delegada a src/mod-input/input-orquestrador-mouse.js */
        if (e.button === 1) {
            orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
            orquestradorMouse.tratarMouseUpBotaoMeio(e);
            return;
        }
        if (e.button !== 0) return;

        const elAlvoEfetivo = obterElementoAlvoEfetivo(e);
        if (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function' && elAlvoEfetivo.closest('[data-jusgov-ignore]')) {
            return;
        }
        if (validador && typeof validador.registrarPontoInteracaoMouse === 'function') {
            validador.registrarPontoInteracaoMouse(e.clientX, e.clientY);
        }

        if (selecaoElasticaAtivaNoClique) {
            const arrastouElastico = houveArrastoMouse;
            selecaoElasticaAtivaNoClique = false;
            houveArrastoMouse = false;
            rangeAncoraArrastoElastico = null;
            if (progressaoSelecao) progressaoSelecao.definirRangeAncoraElastico(null);
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

        /* Seção 6.20, 6.85 e 6.126: Identificação Única e Assistente de Mapeamento (Ctrl + Alt + Shift + Clique já aberto no mousedown global, ou Ctrl + Alt + Botão Direito) */
        if ((e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey) || (e.button === 2 && e.ctrlKey && e.altKey)) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            if (!(e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey)) {
                executarInspecaoECapturaSeletorUnico(elAlvoEfetivo || e.target);
            }
            ignorarProximoClick = true;
            houveArrastoMouse = false;
            return;
        }

        /* Padrao nativo do navegador para Links (Ctrl + Clique em <a href>):
         * Permite que o navegador abra o link em nova aba sem interceptacao */
        const elLinkAlvoMouseUp = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('a[href]')
            : null;
        if (elLinkAlvoMouseUp && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
            ignorarProximoClick = false;
            houveArrastoMouse = false;
            return;
        }

        /* BUG-29: Cliques simples (sem teclas modificadoras e sem arrasto de mouse) sobre <label>
         * associados a checkboxes, radios ou outros controles de formulário JAMAIS devem selecionar
         * ou copiar conteúdo — preservam 100% da ação nativa do navegador de alternar o controle.
         * Alt + Clique permanece suportado adiante para cópia intencional do texto do rótulo (Seção 6.6). */
        const elLabelAlvoMouseUp = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('label')
            : null;
        if (elLabelAlvoMouseUp && !temModificadorTecladoAtivo(e) && !houveArrastoMouse) {
            ignorarProximoClick = false;
            return;
        }

        const tipoContexto = classificarContextoElementoAlvo(elAlvoEfetivo);

        /* BUG-37 / Seção 6.90: Para campos editáveis, só retirar a seleção se for clicado/selecionado outra coisa */
        if (ultimoCampoEditavelSelecionado && elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function') {
            const inputClicado = elAlvoEfetivo.closest('input, textarea');
            if (!inputClicado || inputClicado !== ultimoCampoEditavelSelecionado.elemento) {
                ultimoCampoEditavelSelecionado = null;
            }
        }
        if (tipoContexto === 'IGNORAR') return;

        const ehAltIsoladoSoltar = Boolean(e.altKey && !e.ctrlKey && !e.shiftKey);

        /* Passo 9.3: Regra de Ouro dos Campos Simples Editáveis (<input>):
         * Alternância de clique (1º clique seleciona tudo; 2º clique desseleciona e posiciona o cursor;
         * máscara ex: ___/___/_____ sempre seleciona; duplo clique seleciona tudo) e NUNCA copia para clipboard
         * (Exceto quando Alt está pressionado: Alt deve ser capaz de selecionar/copiar qualquer coisa na tela). */
        if (tipoContexto === 'CAMPO_SIMPLES_EDITAVEL' && !ehAltIsoladoSoltar) {
            const inputAlvo = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? (elAlvoEfetivo.closest('input') || elAlvoEfetivo)
                : elAlvoEfetivo;

            if (selecaoEditavelAtiva && !houveArrastoMouse && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && inputAlvo && typeof inputAlvo.select === 'function') {
                if (e.detail === 2) {
                    /* Regra 3: Se der dois cliques ele seleciona tudo novamente */
                    setTimeout(() => {
                        try {
                            inputAlvo.select();
                            registrarSelecaoAtivaCampoEditavel(inputAlvo);
                        } catch (_) { }
                    }, 10);
                } else if (e.detail === 1) {
                    const temAlfanumerico = /[\p{L}\p{N}]/u.test(inputAlvo.value || '');
                    if (!inputAlvo.dataset.autoselected || !temAlfanumerico) {
                        /* 1ª vez ou campo sem caracteres alfanuméricos (ex: máscara de data ___/___/_____): seleciona tudo */
                        selecionarTudoAoEntrarNoInput(inputAlvo, 20);
                    } else if (inputJaEstavaSelecionadoNoMouseDown) {
                        /* 2º clique consecutivo em campo já focado com texto: permite posicionar o cursor pontualmente */
                        setTimeout(() => {
                            try {
                                if (inputAlvo.selectionStart !== inputAlvo.selectionEnd) {
                                    inputAlvo.setSelectionRange(inputAlvo.selectionStart, inputAlvo.selectionStart);
                                }
                                ultimoCampoEditavelSelecionado = null;
                            } catch (_) { }
                        }, 10);
                    }
                }
            }
            inputJaEstavaSelecionadoNoMouseDown = false;
            inputAlvoMouseDown = null;
            houveArrastoMouse = false;
            return;
        }

        /* REGRA FUNDAMENTAL: NUNCA copiar ou auto-selecionar de editores multilinhas / ricos (Gemini, textarea, contenteditable)
         * sem tecla Alt — com Alt pressionado, libera seleção e cópia de qualquer trecho inclusive em editores. */
        if ((tipoContexto === 'EDITOR_MULTILINHA_EDITAVEL' || isSelecaoOuElementoEmCampoEditavel(elAlvoEfetivo)) && !ehAltIsoladoSoltar) {
            const ehTextarea = Boolean(elAlvoEfetivo && elAlvoEfetivo.tagName === 'TEXTAREA');
            if (ehTextarea) {
                if (selecaoEditavelAtiva && !houveArrastoMouse && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    tratarCliqueEmEditorMultilinhaSemCopia(e);
                }
                houveArrastoMouse = false;
                return;
            }

            /* Editores HTML Online estritos (contenteditable, Quill, ProseMirror, CKEditor 4/5, rich-textarea)
             * e LibreOffice / Collabora Online (.clipboard-container textarea sob canvas) */
            const docAtual = (elAlvoEfetivo && elAlvoEfetivo.ownerDocument) || document;
            const ehCollaboraCanvas = Boolean(
                elAlvoEfetivo &&
                (elAlvoEfetivo.tagName === 'CANVAS' || (elAlvoEfetivo.closest && elAlvoEfetivo.closest('.leaflet-pane, #document-container'))) &&
                docAtual.querySelector('.clipboard-container textarea')
            );
            const ehEditorHtmlAtivo = isElementoOuAncestralContentEditable(elAlvoEfetivo) || ehCollaboraCanvas;
            if (ehEditorHtmlAtivo) {
                const permiteCliqueCtrl = (modoPlaceholdersMinutasHtml === 'ctrl_avancado' || modoPlaceholdersMinutasHtml === 'avancado') && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
                const permiteCliqueNormal = !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;
                if (placeholdersMinutasHtmlAtivo && modoPlaceholdersMinutasHtml !== 'desabilitado' && !houveArrastoMouse && (permiteCliqueNormal || permiteCliqueCtrl)) {
                    tratarCliqueEmEditorMultilinhaSemCopia(e);
                }
            }
            houveArrastoMouse = false;
            return;
        }

        const modoAcumulador = Boolean(e.ctrlKey && e.altKey);

        /* DIRETRIZ ROOT 2.17: Modo Acumulador (Ctrl+Alt) e estritamente desabilitado em qualquer controle, interface ou formulario */
        if (modoAcumulador) {
            if (isContextoDeSistemaOuUi(elAlvoEfetivo) || tipoContexto !== 'LEITURA_COMUM') {
                ignorarProximoClick = true;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }

        /* Passo 9.4: Shift + Arrasto linear (inicio do arrasto ate final do arrasto)
         * BUG-46 / USAB-15 (Seção 6.116): Aplica a limpeza numérica (remoção de espaços, pontuações e símbolos)
         * com Trava Alfabética: se restarem letras após remover símbolos/espaços, preserva o texto original. */
        if (e.shiftKey && !modoAcumulador && houveArrastoMouse) {
            houveArrastoMouse = false;
            setTimeout(async () => {
                const selShift = window.getSelection();
                if (selShift && !selShift.isCollapsed && selShift.rangeCount > 0) {
                    const rngShift = selShift.getRangeAt(0).cloneRange();
                    const textoBrutoShift = extrairTextoPuroSanitizado(rngShift) || rngShift.toString();
                    const ehExtensaDrag = isSelecaoExtensaOuMultipage(rngShift, textoBrutoShift);
                    const textoNumericoLimpo = ehExtensaDrag
                        ? textoBrutoShift
                        : aplicarLimpezaNumericaComTravaAlfabetica(textoBrutoShift);
                    await aplicarSelecaoECopiar(rngShift, false, textoNumericoLimpo, {
                        eraArrasto: true,
                        temModificador: true,
                        forcarManterSelecao: ehExtensaDrag,
                        semFlashEMarcador: ehExtensaDrag
                    });
                }
            }, 15);
            return;
        }

        /* Passo 9.5: Arrasto de mouse comum, com Alt (selecao parcial em link/botao/texto) ou com Acumulador (Ctrl+Alt)
         * Preservacao integral da selecao por arrasto em texto comum e visualizadores de PDF.
         * Em telas de sistema/interface: copia e remove a selecao visual da tela (removeAllRanges) imediatamente! */
        isMousePressionado = false;
        coordsMouseDown = { x: 0, y: 0 };

        if (houveArrastoMouse) {
            houveArrastoMouse = false;
            pontoAncoraArrastoAlt = null;
            const selAtualNoMouseUp = window.getSelection();
            if (isSelecaoOuElementoEmCampoEditavel(selAtualNoMouseUp) || (selAtualNoMouseUp && selAtualNoMouseUp.rangeCount > 0 && isSelecaoOuElementoEmCampoEditavel(selAtualNoMouseUp.getRangeAt(0)))) {
                return;
            }
            const textoArrastadoBruto = selAtualNoMouseUp ? selAtualNoMouseUp.toString().trim() : '';
            const temTextoSelecionadoEfetivo = Boolean(selAtualNoMouseUp && !selAtualNoMouseUp.isCollapsed && selAtualNoMouseUp.rangeCount > 0 && textoArrastadoBruto.length > 0);
            if (temTextoSelecionadoEfetivo) {
                const rangeArrastado = selAtualNoMouseUp.getRangeAt(0).cloneRange();
                const ehSistemaEstrito = isTelaSistemaEstritaParaDesselecao(elAlvoEfetivo) || (rangeArrastado && isTelaSistemaEstritaParaDesselecao(rangeArrastado.commonAncestorContainer)) || isContextoDeSistemaOuUi(elAlvoEfetivo);
                const temModificadorArrasto = Boolean(e.altKey || e.ctrlKey || e.shiftKey || e.metaKey);

                /* SEÇÃO 6.80: Em seleções por arraste sem Alt, o limiar mínimo exigido é de 2 caracteres úteis
                 * (bloqueia 1 caractere, apenas espaços ou 1 caractere com espaços; preserva Alt com >= 1 caractere) */
                if (!e.altKey) {
                    if (!verificarProtecaoTamanhoMinimoInterface(textoArrastadoBruto, elAlvoEfetivo, false, 2)) {
                        if (modoRetirarSelecao !== 'com_flash' && modoRetirarSelecao !== 'nenhuma' && modoRetirarSelecao !== 'total_exceto_arrasto') {
                            selAtualNoMouseUp.removeAllRanges();
                        }
                        ignorarProximoClick = true;
                        return;
                    }
                }

                // Blindagem anti-loop de selecao manual
                if (textoArrastadoBruto === ultimaSelecaoManualTexto && (Date.now() - ultimoTimestampSelecaoManual) < 1500) {
                    ignorarProximoClick = true;
                    return;
                }
                ultimaSelecaoManualTexto = textoArrastadoBruto;
                ultimoTimestampSelecaoManual = Date.now();

                const ehExtensaDragComum = isSelecaoExtensaOuMultipage(rangeArrastado, textoArrastadoBruto);
                const deveDesselecionarArrasto = (modoRetirarSelecao === 'total') ||
                    (modoRetirarSelecao === 'com_flash' && tempoFlashBorderMs !== 0 && !ehExtensaDragComum && !modoAcumulador) ||
                    (modoRetirarSelecao === 'interface' && ehSistemaEstrito);

                ignorarProximoClick = true;
                const copiouArrasto = await aplicarSelecaoECopiar(rangeArrastado, modoAcumulador, null, {
                    forcarDesselecao: deveDesselecionarArrasto,
                    forcarManterSelecao: !deveDesselecionarArrasto,
                    temModificador: temModificadorArrasto,
                    eraArrasto: true
                });
                const flashAtivoNaTelaDrag = Boolean(document.getElementById('jusgov-flash-contour-container'));
                const deveLimparPosDrag = Boolean(
                    deveDesselecionarArrasto &&
                    copiouArrasto &&
                    (modoRetirarSelecao !== 'com_flash' || flashAtivoNaTelaDrag)
                );
                if (deveLimparPosDrag) {
                    /* Em tela de sistema/interface (ou modo total): remove a selecao visual residual apos soltar o mouse e antes do flash sumir */
                    if (tempoFlashBorderMs > 0 || tempoFlashBorderMs === -1) {
                        flashExclusivoSemSelecao = true;
                    }
                    setTimeout(() => {
                        try {
                            const selAtual = window.getSelection();
                            if (selAtual) selAtual.removeAllRanges();
                        } catch (_) { }
                        if (tempoFlashBorderMs === 0) {
                            flashExclusivoSemSelecao = false;
                        }
                    }, 20);
                }
                return;
            }
        }

        pontoAncoraArrastoAlt = null;

        const temModificadorTeclado = temModificadorTecladoAtivo(e);

        /* BUG-88: Removida a interceptação de cliques em botões/ícones nativos de cópia da página */

        /* Passo 9.6: Regra da Maozinha (cursor: pointer), Help (cursor: help), Links, Controles e Eventos (onclick, onmouse*):
         * Cliques sem teclas modificadoras sobre links, botoes, controles, elementos com cursor "maozinha"/"help"
         * ou eventos associados JAMAIS devem selecionar ou copiar palavras comuns — preservam 100% a acao nativa!
         * Excecao Regra Semiflexivel (Diretriz Root 6.20): Se NAO for um botao ou controle de formulario estrito
         * (isComponenteBotaoOuFormularioEstrito === false), permite prosseguir para o Passo 9.7.1b a fim de
         * verificar se o clique incidiu sobre uma mascara/bloco forense (datas, horas, combinacoes data+hora,
         * CPF, CNPJ, processos CNJ, IDs), copiando-o com Flash Verde rapido e sem manter selecao do sistema. */
        if (!temModificadorTeclado && isElementoInterativoClicavelDireto(elAlvoEfetivo) && isComponenteBotaoOuFormularioEstrito(elAlvoEfetivo)) {
            ignorarProximoClick = false;
            return;
        }

        /* Passo 9.7: Shift + Clique e Solta (Filtro de Digitos/Alfanumericos Corridos c/ Zero-Pad CNJ OU Cursor Inicial -> Final) */
        if (e.shiftKey && !modoAcumulador) {
            const pontoClique = obterPontoDoClique(e.clientX, e.clientY);
            if (!pontoClique) return;

            const mapaCtx = construirMapaTextoBlocoComJanela(pontoClique.no, pontoClique.offset);
            if (!mapaCtx) return;

            if (ancoraCursorShift && ancoraCursorShift.no && !ancoraCursorShift.no.isConnected) {
                ancoraCursorShift = null;
            }

            const selAtual = window.getSelection();
            const temSelecaoAtiva = Boolean(selAtual && !selAtual.isCollapsed && selAtual.rangeCount > 0);

            /* Se ha selecao ativa e ainda nao ha ancora de Shift, adota o ponto de ancora da selecao para permitir estender */
            if (temSelecaoAtiva && !ancoraCursorShift) {
                const rAtual = selAtual.getRangeAt(0);
                ancoraCursorShift = {
                    no: selAtual.anchorNode || rAtual.startContainer,
                    offset: typeof selAtual.anchorOffset === 'number' ? selAtual.anchorOffset : rAtual.startOffset
                };
            } else if (!temSelecaoAtiva && !ancoraCursorShift && ultimoRangeSelecionadoSimples && ultimoRangeSelecionadoSimples.startContainer && ultimoRangeSelecionadoSimples.startContainer.isConnected) {
                ancoraCursorShift = {
                    no: ultimoRangeSelecionadoSimples.startContainer,
                    offset: ultimoRangeSelecionadoSimples.startOffset
                };
            }

            /* Se ainda nao ha ancora de Shift (e nao havia selecao ativa previa), verifica se clicou em entidade contigua (CPF, CNPJ, CNJ, Data, Tel) */
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
                        const matchInssComEsp = textoEnt.match(/^(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
                        if (matchInssComEsp) {
                            digitosPuros = matchInssComEsp[2].replace(EXPRESSOES_REGULARES.NAO_DIGITOS, '');
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
                    } catch (_) { }
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
                    const textoExpandidoBruto = extrairTextoPuroSanitizado(rangeExpandido) || rangeExpandido.toString();
                    const ehExtensaShift = Boolean(
                        isSelecaoExtensaOuMultipage(rangeExpandido, textoExpandidoBruto) ||
                        textoExpandidoBruto.length > 200 ||
                        textoExpandidoBruto.includes('\n')
                    );
                    const textoExpandidoLimpoShift = ehExtensaShift
                        ? textoExpandidoBruto
                        : aplicarLimpezaNumericaComTravaAlfabetica(textoExpandidoBruto);
                    await aplicarSelecaoECopiar(rangeExpandido, false, textoExpandidoLimpoShift, {
                        temModificador: true,
                        forcarManterSelecao: true,
                        semFlashEMarcador: ehExtensaShift
                    });
                } catch (_) { }
                return;
            }
        }

        if (e.ctrlKey && !e.altKey && !e.shiftKey) {
            return;
        }

        if (modoAcumulador && await tentarSelecionarTabelaLinhaOuColuna(e)) {
            ignorarProximoClick = true;
            return;
        }

        /* Passo 9.7.1: Alt + Clique sozinho = autorizacao universal para copiar qualquer elemento + interceptacao de eventos,
         * reutilizando integralmente o motor base de selecao, encolhimento e expansao (com fallback para controles sem no de texto). */
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            ignorarProximoClick = true;
            e.preventDefault();
            e.stopPropagation();

            const elLinkDireto = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? elAlvoEfetivo.closest('a[href], a, [role="link"]')
                : null;
            if (e.detail >= 3 && elLinkDireto) {
                const textoLinkInteiro = extrairTextoLinkUmaLinha(elLinkDireto);
                const rangeLinkInteiro = document.createRange();
                rangeLinkInteiro.selectNodeContents(elLinkDireto);
                if (textoLinkInteiro && textoLinkInteiro.length > 0) {
                    await aplicarSelecaoECopiar(rangeLinkInteiro, false, textoLinkInteiro, {
                        forcarUmaLinha: true,
                        temModificador: true,
                        eraArrasto: false
                    });
                    return;
                }
            }

            const campoAlvo = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? elAlvoEfetivo.closest('input, textarea, select, option')
                : null;
            if (campoAlvo) {
                let textoCampo = '';
                if (campoAlvo.tagName === 'SELECT') {
                    const optSel = (typeof campoAlvo.selectedIndex === 'number' && campoAlvo.selectedIndex >= 0 && campoAlvo.options)
                        ? campoAlvo.options[campoAlvo.selectedIndex]
                        : (campoAlvo.selectedOptions && campoAlvo.selectedOptions[0]);
                    textoCampo = ((optSel && (optSel.text || optSel.textContent)) || campoAlvo.value || '').trim();
                } else if (campoAlvo.tagName === 'OPTION') {
                    textoCampo = (campoAlvo.text || campoAlvo.innerText || campoAlvo.textContent || campoAlvo.value || '').trim();
                } else {
                    textoCampo = (campoAlvo.value || campoAlvo.placeholder || campoAlvo.getAttribute('value') || '').trim();
                }
                if (textoCampo) {
                    ultimoAltSelectTimestamp = Date.now();
                    const rangeCampo = document.createRange();
                    rangeCampo.selectNode(campoAlvo);
                    await aplicarSelecaoECopiar(rangeCampo, false, textoCampo, {
                        temModificador: true,
                        eraArrasto: false,
                        forcarUmaLinha: true
                    });
                    return;
                }
            }
        }

        /* BUG-16 (Seção 6.70): Supressão de cópia automática ao interagir com caixas de seleção / dropdowns / select2.
         * Cliques sem Alt sobre componentes de seleção JAMAIS copiam ou selecionam, preservando a abertura nativa
         * do menu e a escolha de opções. Copiar placeholders ("Selecione") ou valores só é permitido com Alt. */
        if (!temModificadorTeclado && isComponenteSelecaoOuDropdown(elAlvoEfetivo)) {
            ignorarProximoClick = false;
            return;
        }

        /* BUG-18 (Seção 6.74): Restrição de cópia de blocos em links a 2 cliques.
         * Em links (<a> ou [role="link"]), 1 clique simples preserva 100% da navegação nativa (abrir página/modal).
         * A cópia do bloco forense em links é permitida estritamente com DOIS CLIQUES (2 cliques / duplo clique). */
        const elLinkAncestral = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
            ? elAlvoEfetivo.closest('a, [role="link"]')
            : ((elAlvoEfetivo && (elAlvoEfetivo.tagName === 'A' || elAlvoEfetivo.getAttribute('role') === 'link')) ? elAlvoEfetivo : null);
        const ehLink = Boolean(elLinkAncestral);
        if (ehLink && !temModificadorTeclado && e.detail === 1) {
            ignorarProximoClick = false;
            return;
        }

        /* Passo 9.7.1b: Clique Simples sem Modificadores em Tela de Sistema / Interface (modais, caixas de dialogo):
         * DIRETRIZ ROOT 2.17 e 6.20 (Regra Semiflexivel em Interfaces):
         * - Se for botao ou controle de formulario estrito (isComponenteBotaoOuFormularioEstrito):
         *   ja retornou no Passo 9.6 sem fazer nada.
         * - Se for texto dentro de tela de sistema ou container de interface (ex: corpo de modal, cabecalho PJe,
         *   arvore de timeline, <div>, <span>, <small>, <td>, <h3>, <a>) e o ponto clicado contiver mascara util /
         *   bloco estruturado (datas em qualquer formato, horas, combinacoes de data+hora, processo CNJ, CPF, CNPJ,
         *   IDs numericos, moedas): COPIA para a Area de Transferencia e exibe Flash Verde temporizado,
         *   SEM manter selecao na tela.
         * - Se for palavra avulsa ou rotulo comum de interface: NAO faz nada (preserva a navegacao e acoes nativas). */
        const ehSistemaOuUi = (tipoContexto === 'LINK_CLICAVEL') || (tipoContexto === 'SEMIFLEXIVEL');
        if (ehSistemaOuUi && !temModificadorTeclado) {
            if ((e.detail === 1 || e.detail === 2) && !isComponenteBotaoOuFormularioEstrito(elAlvoEfetivo)) {
                const ponto = obterPontoDoClique(e.clientX, e.clientY);
                if (ponto) {
                    const noElPonto = (ponto.no && ponto.no.nodeType === Node.TEXT_NODE) ? ponto.no.parentElement : ponto.no;
                    if (noElPonto && typeof noElPonto.closest === 'function' && noElPonto.closest('label, button, select, textarea, input, [role="button"], [role="checkbox"], [role="radio"], [role="switch"]')) {
                        ignorarProximoClick = false;
                        return;
                    }
                    const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
                    if (mapa) {
                        /* DIRETRIZ REFORÇO INTERFACE: Subcategoria de Blocos Verificáveis.
                         * Em interface sem Alt (1 clique ou 2 cliques), SÓ auto-seleciona/copia
                         * se incidir estritamente sobre BLOCO VERIFICÁVEL (data, números puros com >= 1 dígito,
                         * CPF, CNPJ, placas, CNIS, NB, moedas, horários, CEP, processo CNJ, etc.).
                         * Palavras soltas, rótulos de campos e nomes comuns de partes NÃO são auto-selecionáveis sem Alt.
                         * Fallback para expandirUnidadeAtomicaEstagio1 e sentenças em interface é terminantemente suprimido. */
                        const resAlvo = localizarBlocoForenseAutoSelecionavelEmInterface(
                            mapa.texto,
                            mapa.idxCursor,
                            e.detail,
                            false
                        );

                        if (resAlvo) {
                            const trechoBruto = mapa.texto.substring(resAlvo.inicio, resAlvo.fim).trim();
                            if (isBlocoVerificavel(trechoBruto)) {
                                let rangeComposto = criarRangeDOMAPartirDeIndices(mapa, resAlvo.inicio, resAlvo.fim);
                                if (rangeComposto) {
                                    let textoLimpo = extrairTextoPuroSanitizado(rangeComposto) || rangeComposto.toString().trim();

                                    /* DIRETRIZ UNIVERSAL ANTI-ESTAGNAÇÃO EM INTERFACE:
                                     * Se e.detail >= 2 e o texto selecionado for idêntico ao já selecionado/copiado,
                                     * SÓ amplia se a expansão for também um bloco verificável (ex: data "26/10/2026"
                                     * ampliando para data+hora "26/10/2026 15:20"). JAMAIS expande para frases ou
                                     * contêineres ancestrais contendo nomes comuns, rótulos ou partes. */
                                    if (e.detail >= 2 && ultimoTextoSelecionadoLimpo && textoLimpo === ultimoTextoSelecionadoLimpo.trim()) {
                                        const resCompostoMaior = tentarExpandirPadraoComposto(mapa.texto, mapa.idxCursor, true, true);
                                        if (resCompostoMaior && (resCompostoMaior.fim - resCompostoMaior.inicio) > (resAlvo.fim - resAlvo.inicio)) {
                                            const trechoMaior = mapa.texto.substring(resCompostoMaior.inicio, resCompostoMaior.fim).trim();
                                            if (isBlocoVerificavel(trechoMaior)) {
                                                const rMaior = criarRangeDOMAPartirDeIndices(mapa, resCompostoMaior.inicio, resCompostoMaior.fim);
                                                if (rMaior) {
                                                    const txtMaior = extrairTextoPuroSanitizado(rMaior) || rMaior.toString().trim();
                                                    if (txtMaior && txtMaior !== ultimoTextoSelecionadoLimpo.trim()) {
                                                        rangeComposto = rMaior;
                                                        textoLimpo = txtMaior;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // BUG-15: Limiar mínimo de 1 caractere útil
                                    if (textoLimpo && textoLimpo.length >= 1 && isBlocoVerificavel(textoLimpo)) {
                                        await aplicarSelecaoECopiar(rangeComposto, false, textoLimpo, {
                                            forcarDesselecao: true
                                        });
                                        ignorarProximoClick = false;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            ignorarProximoClick = false;
            return;
        }

        async function tentarFallbackAltElementoSemTexto(alvo) {
            if (!e.altKey || !alvo) return false;
            if ((tipoContexto === 'LINK_CLICAVEL' || tipoContexto === 'SEMIFLEXIVEL') && (e.detail === 1 || e.detail === 2)) {
                const resAltInterface = resolverRangeAltEmInterface(alvo, null, e.clientX, e.clientY, e.detail);
                if (resAltInterface && resAltInterface.range && resAltInterface.texto) {
                    await aplicarSelecaoECopiar(resAltInterface.range, modoAcumulador, resAltInterface.texto, {
                        temModificador: true,
                        minimoCaracteres: 1,
                        forcarUmaLinha: Boolean(resAltInterface.forcarUmaLinha)
                    });
                    return true;
                }
            }
            const elInterativo = obterObjetoInterativoParaSelecaoCompleta(alvo);
            if (elInterativo) {
                const txtInterativo = extrairTextoVisivelLimpoDeElemento(elInterativo);
                const rInterativo = criarRangeTextoParaEtiquetaOuObjeto(elInterativo);
                if (txtInterativo && rInterativo) {
                    await aplicarSelecaoECopiar(rInterativo, modoAcumulador, txtInterativo, {
                        temModificador: true,
                        minimoCaracteres: 1,
                        forcarUmaLinha: (elInterativo.tagName === 'SELECT' || elInterativo.tagName === 'OPTION')
                    });
                    return true;
                }
            }
            let candidatoAlt = (alvo.nodeType === Node.TEXT_NODE) ? alvo.parentElement : alvo;
            let passosAlt = 0;
            while (candidatoAlt && candidatoAlt !== document.body && candidatoAlt !== document.documentElement && passosAlt < 3) {
                const txtCand = extrairTextoVisivelLimpoDeElemento(candidatoAlt);
                if (txtCand && txtCand.length > 0 && txtCand.length <= 400) {
                    const rCand = criarRangeTextoParaEtiquetaOuObjeto(candidatoAlt);
                    if (rCand) {
                        await aplicarSelecaoECopiar(rCand, modoAcumulador, txtCand, { temModificador: true, minimoCaracteres: 1 });
                        return true;
                    }
                }
                candidatoAlt = candidatoAlt.parentElement;
                passosAlt++;
            }
            return false;
        }

        const ponto = obterPontoDoClique(e.clientX, e.clientY);
        if (!ponto) {
            await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
            return;
        }
        if (!temModificadorTeclado) {
            const noElPontoSimples = (ponto.no && ponto.no.nodeType === Node.TEXT_NODE) ? ponto.no.parentElement : ponto.no;
            if (noElPontoSimples && typeof noElPontoSimples.closest === 'function' && noElPontoSimples.closest('label, button, select, textarea, input, [role="button"], [role="checkbox"], [role="radio"], [role="switch"]')) {
                ignorarProximoClick = false;
                return;
            }
        }

        if (!e.shiftKey) {
            ancoraCursorShift = { no: ponto.no, offset: ponto.offset };
        }

        const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
        if (!mapa) {
            await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
            return;
        }

        const { texto, idxCursor } = mapa;

        const ehAltIsoladoEmInterface = Boolean(
            e.altKey && !e.ctrlKey && !e.shiftKey &&
            (tipoContexto === 'LINK_CLICAVEL' || tipoContexto === 'SEMIFLEXIVEL') &&
            e.detail >= 1
        );

        /* Passo 9.7.2: 3+ Cliques (e.detail >= 3): tendencia a minorar em blocos compostos ("12.016/2009" -> "12.016" ou "2009")
         * e selecao estritamente limitada no maximo ao paragrafo localizado (vedada selecao de pagina inteira ou conteiner pai). */
        if (e.detail >= 3 && !ehAltIsoladoEmInterface) {
            const resTriplo = resolverSelecaoTriploClique(mapa, idxCursor);
            const resParagrafo = delimitarParagrafoLocalizado(mapa.texto, idxCursor, true);
            let rangeEscolhidoTriplo = null;

            if (resTriplo) {
                const rangeTriplo = criarRangeDOMAPartirDeIndices(mapa, resTriplo.inicio, resTriplo.fim);
                if (rangeTriplo) {
                    const txtTriplo = (extrairTextoPuroSanitizado(rangeTriplo) || rangeTriplo.toString()).trim();
                    if (!ultimoTextoSelecionadoLimpo || txtTriplo !== ultimoTextoSelecionadoLimpo.trim()) {
                        rangeEscolhidoTriplo = rangeTriplo;
                    } else if (resParagrafo && (resParagrafo.fim - resParagrafo.inicio) > (resTriplo.fim - resTriplo.inicio)) {
                        rangeEscolhidoTriplo = criarRangeDOMAPartirDeIndices(mapa, resParagrafo.inicio, resParagrafo.fim);
                    } else {
                        rangeEscolhidoTriplo = rangeTriplo;
                    }
                }
            }
            if (!rangeEscolhidoTriplo && resParagrafo) {
                rangeEscolhidoTriplo = criarRangeDOMAPartirDeIndices(mapa, resParagrafo.inicio, resParagrafo.fim);
            }
            if (rangeEscolhidoTriplo) {
                await aplicarSelecaoECopiar(rangeEscolhidoTriplo, modoAcumulador, null, { temModificador: temModificadorTeclado });
            }
            return;
        }

        const ehDuploClique = (e.detail === 2);

        /* DIRETRIZ ROOT 2.5: Em blocos/campos compostos já selecionados, 1 clique dentro encolhe para o sub-segmento numérico/alfanumérico
         * (ex.: dia/mês/ano de uma data, segmento de processo/boleto) e clicar em separador/não-número re-seleciona o bloco inteiro;
         * em texto comum, executa o ciclo circular 1->5->1. */
        if (e.detail === 1 && !e.ctrlKey && !e.shiftKey && !e.metaKey && cliqueDentroDaSelecaoAtiva && (estadoCicloSelecao.textoAtual || ultimoBlocoCompostoAtivo)) {
            const limitesBloco = resolverLimitesBlocoAtivoNaJanela(mapa, idxCursor, ultimoBlocoCompostoAtivo, estadoCicloSelecao.textoAtual);
            if (limitesBloco) {
                const rBlocoComp = criarRangeDOMAPartirDeIndices(mapa, limitesBloco.inicio, limitesBloco.fim);
                const txtBlocoComp = rBlocoComp ? (extrairTextoPuroSanitizado(rBlocoComp) || rBlocoComp.toString()).trim() : '';
                if (rBlocoComp && txtBlocoComp) {
                    const subSeg = resolverSubSegmentoNoBlocoComposto(texto, idxCursor, limitesBloco.inicio, limitesBloco.fim);
                    if (subSeg && subSeg.ehSubSegmento) {
                        const rSub = criarRangeDOMAPartirDeIndices(mapa, subSeg.inicio, subSeg.fim);
                        if (rSub) {
                            const txtSub = (extrairTextoPuroSanitizado(rSub) || rSub.toString()).trim();
                            ultimoBlocoCompostoAtivo = { range: rBlocoComp.cloneRange(), texto: txtBlocoComp };
                            estadoCicloSelecao = { direcao: 1, textoAtual: txtSub };
                            await aplicarSelecaoECopiar(rSub, modoAcumulador, null, { temModificador: temModificadorTeclado, minimoCaracteres: 1 });
                            return;
                        }
                    } else {
                        ultimoBlocoCompostoAtivo = { range: rBlocoComp.cloneRange(), texto: txtBlocoComp };
                        estadoCicloSelecao = { direcao: 1, textoAtual: txtBlocoComp };
                        await aplicarSelecaoECopiar(rBlocoComp, modoAcumulador, null, { temModificador: temModificadorTeclado, minimoCaracteres: 1 });
                        return;
                    }
                }
            }

            if (estadoCicloSelecao.textoAtual) {
                const degraus = construirDegrausCicloSelecao(mapa, idxCursor, elAlvoEfetivo);
                if (degraus.length > 1) {
                let idxAtual = degraus.findIndex(d => d.texto === estadoCicloSelecao.textoAtual);
                if (idxAtual === -1) {
                    idxAtual = degraus.findIndex(d => d.texto.includes(estadoCicloSelecao.textoAtual) || estadoCicloSelecao.textoAtual.includes(d.texto));
                }
                if (idxAtual === -1) idxAtual = 0;

                if (idxAtual >= degraus.length - 1) {
                    estadoCicloSelecao.direcao = -1;
                } else if (idxAtual <= 0) {
                    estadoCicloSelecao.direcao = 1;
                }

                const proxIdx = Math.max(0, Math.min(degraus.length - 1, idxAtual + estadoCicloSelecao.direcao));
                if (proxIdx >= degraus.length - 1) {
                    estadoCicloSelecao.direcao = -1;
                } else if (proxIdx <= 0) {
                    estadoCicloSelecao.direcao = 1;
                }

                const degrauAlvo = degraus[proxIdx];
                if (degrauAlvo && degrauAlvo.range) {
                    estadoCicloSelecao.textoAtual = degrauAlvo.texto;
                    await aplicarSelecaoECopiar(degrauAlvo.range, modoAcumulador, null, { temModificador: temModificadorTeclado });
                    return;
                }
                }
            }
        }

        let rangeFinal = null;
        let textoCandidato = '';
        let ehBlocoCompostoSelecionado = false;

        const blocoCompostoPrevio = ehDuploClique
            ? (ultimoBlocoCompostoAtivo || (() => {
                const rb = tentarExpandirPadraoComposto(texto, idxCursor, false, false);
                return rb ? { texto: texto.slice(rb.inicio, rb.fim).trim() } : null;
            })())
            : null;

        const resExpansao = resolverIndicesExpansaoBase(mapa, idxCursor, e.detail, { blocoCompostoPrevio, ehAlt: Boolean(e.altKey) });
        const resultadoIndices = resExpansao ? resExpansao.resultadoIndices : null;
        ehBlocoCompostoSelecionado = Boolean(resExpansao && resExpansao.ehBlocoCompostoSelecionado);

        if (ehAltIsoladoEmInterface) {
            const txtBaseAlt = resultadoIndices ? mapa.texto.slice(resultadoIndices.inicio, resultadoIndices.fim).trim() : '';
            const ehBlocoVerificavelBase = Boolean(txtBaseAlt && (ehBlocoCompostoSelecionado || isBlocoVerificavel(txtBaseAlt)));
            const motorJaExpandiuTrecho = Boolean(txtBaseAlt && /\s/.test(txtBaseAlt));

            if (e.detail >= 2 || (!ehBlocoVerificavelBase && !motorJaExpandiuTrecho)) {
                const resAltInterface = resolverRangeAltEmInterface(elAlvoEfetivo, ponto, e.clientX, e.clientY, e.detail, mapa);
                if (resAltInterface && resAltInterface.range) {
                    rangeFinal = resAltInterface.range;
                    textoCandidato = resAltInterface.texto || '';
                    ehBlocoCompostoSelecionado = Boolean(resAltInterface.ehBlocoVerificavel);
                }
            }
        }

        if (!rangeFinal) {
            if (ehDuploClique && blocoCompostoPrevio && (!resultadoIndices || texto.slice(resultadoIndices.inicio, resultadoIndices.fim).trim().length <= blocoCompostoPrevio.texto.length)) {
                const resParagrafoDuplo = delimitarParagrafoLocalizado(mapa.texto, idxCursor, true);
                const rangeParagrafoDuplo = resParagrafoDuplo ? criarRangeDOMAPartirDeIndices(mapa, resParagrafoDuplo.inicio, resParagrafoDuplo.fim) : null;
                if (rangeParagrafoDuplo) {
                    ultimoBlocoCompostoAtivo = null;
                    estadoCicloSelecao = {
                        direcao: 1,
                        textoAtual: (extrairTextoPuroSanitizado(rangeParagrafoDuplo) || rangeParagrafoDuplo.toString()).trim()
                    };
                    await aplicarSelecaoECopiar(rangeParagrafoDuplo, modoAcumulador, null, { temModificador: temModificadorTeclado });
                    return;
                }
            }

            if (!resultadoIndices) {
                await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
                return;
            }

            rangeFinal = criarRangeDOMAPartirDeIndices(mapa, resultadoIndices.inicio, resultadoIndices.fim);
            if (!rangeFinal) {
                await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
                return;
            }

            textoCandidato = (mapa && typeof mapa.texto === 'string')
                ? mapa.texto.slice(resultadoIndices.inicio, resultadoIndices.fim)
                : '';

            /* DIRETRIZ UNIVERSAL ANTI-ESTAGNAÇÃO POR CLIQUES:
             * Se ehDuploClique e o texto candidato for igual ao já selecionado/copiado anteriormente, amplia imediatamente! */
            if (!ehAltIsoladoEmInterface && ehDuploClique && ultimoTextoSelecionadoLimpo && textoCandidato.trim() === ultimoTextoSelecionadoLimpo.trim()) {
                const resSentenca = expandirSentencaCompletaAtePonto(texto, idxCursor) || expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                if (resSentenca && (resSentenca.fim - resSentenca.inicio) > (resultadoIndices.fim - resultadoIndices.inicio)) {
                    const rSent = criarRangeDOMAPartirDeIndices(mapa, resSentenca.inicio, resSentenca.fim);
                    if (rSent) {
                        const txtSent = (extrairTextoPuroSanitizado(rSent) || rSent.toString()).trim();
                        if (txtSent && txtSent !== ultimoTextoSelecionadoLimpo.trim()) {
                            rangeFinal = rSent;
                            textoCandidato = txtSent;
                        }
                    }
                }
                if (textoCandidato.trim() === ultimoTextoSelecionadoLimpo.trim()) {
                    const resParagrafo = delimitarParagrafoLocalizado(mapa.texto, idxCursor, true);
                    if (resParagrafo) {
                        const rParagrafo = criarRangeDOMAPartirDeIndices(mapa, resParagrafo.inicio, resParagrafo.fim);
                        if (rParagrafo) {
                            const txtPar = (extrairTextoPuroSanitizado(rParagrafo) || rParagrafo.toString()).trim();
                            if (txtPar && txtPar !== ultimoTextoSelecionadoLimpo.trim()) {
                                rangeFinal = rParagrafo;
                                textoCandidato = txtPar;
                            }
                        }
                    }
                }
            }
        }

        if (rangeFinal && !e.shiftKey) {
            ancoraCursorShift = {
                no: rangeFinal.startContainer,
                offset: rangeFinal.startOffset
            };
        }

        // BUG-15: Duplo clique ou bloco opera com mínimo de 1 caractere útil
        const minLeitura = (ehDuploClique) ? 1 : null;
        if (!temModificadorTeclado && !verificarProtecaoTamanhoMinimoInterface(textoCandidato, elAlvoEfetivo, false, minLeitura)) {
            return;
        }

        /* BUG-42 / USAB-10 (Seção 6.109): Trava de Proximidade Geométrica para Clique Único.
         * Rejeita seleção automática caso o clique único tenha ocorrido em espaço vazio longe do Range resolvido. */
        if (!ehDuploClique && e.detail === 1 && !temModificadorTeclado && !verificarProximidadeGeometricaDoClique(rangeFinal, e.clientX, e.clientY, e.detail)) {
            return;
        }

        if (rangeFinal) {
            if (modoAcumulador || e.altKey) {
                ignorarProximoClick = true;
            }
            const txtFinalCiclo = (extrairTextoPuroSanitizado(rangeFinal) || rangeFinal.toString() || textoCandidato).trim();
            estadoCicloSelecao = {
                direcao: 1,
                textoAtual: txtFinalCiclo
            };
            ultimoBlocoCompostoAtivo = (ehBlocoCompostoSelecionado || (!ehDuploClique && ehTextoBlocoMultiSegmento(txtFinalCiclo)))
                ? { range: rangeFinal.cloneRange(), texto: txtFinalCiclo }
                : null;
            await aplicarSelecaoECopiar(rangeFinal, modoAcumulador, null, { temModificador: temModificadorTeclado });
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
        return urlsLib ? urlsLib.ehDominioPjeOuJusGov(urlStr || (typeof location !== 'undefined' ? location.href : '')) : false;
    }

    /*
     * FUNCAO: inserirTextoEmElemento
     * OBJETIVO DE RECONSTRUCAO: Inserir texto ou fragmento HTML de forma segura e universal
     * em <input>, <textarea> ou conteudos com contenteditable / editores online.
     */
    const inserirTextoEmElemento = (alvo, texto, ehHtml) => moduloColagem.inserirTextoEmElemento(alvo, texto, ehHtml);
    const confirmarColagemGlobalEMarcarPermanente = (textoColado, origemRemota = false) => moduloColagem.confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota);

    if (typeof window !== 'undefined') {
        window.__JUSGOV_CONFIRMAR_COLAGEM_CONTEUDO__ = (textoColado) => confirmarColagemGlobalEMarcarPermanente(textoColado, false);
    }

    const executarColagemBotaoDireito = (alvo, modo, usarAnterior = false, opcoesColagem = {}) => moduloColagem.executarColagemBotaoDireito(alvo, modo, usarAnterior, opcoesColagem);

    function aoClicarAuxiliarMouse(e) {
        orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
        orquestradorMouse.tratarAuxClick(e);
    }

    function aoAbrirMenuContexto(e) {
        orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
        orquestradorMouse.tratarContextMenuColagem(e);
    }

    /* Delegação Modular (ENG-00 / ARQ-10): Controlador de Teclado e Desseleção Universal (src/mod-copia/copia-teclado.js) */
    const controladorTeclado = (typeof window !== 'undefined' && typeof window.JusGovCopiaTeclado === 'function')
        ? new window.JusGovCopiaTeclado({
            obterEstado: () => ({
                teclasPressionadasAtivas,
                caixaEntradaRapidaAtiva,
                tempoFlashBorderMs,
                atalhoF1GeminiAtivo,
                janelaDuploEscMs: CONFIGURACAO_MOTOR.JANELA_DUPLO_ESC_MS
            }),
            obterFachadaInput: () => fachadaModuloInput,
            limparFlash: () => limparFlashBorderImediatamente(),
            limparAvisos: (preservar) => limparAvisosAuditoriaEWikiImediatamente(preservar),
            definirAncoraShift: (anc) => { ancoraCursorShift = anc; },
            sincronizarCopiaManual: (ev) => sincronizarCopiaManualParaClipboardInterno(ev),
            verificarUrlPermitida: () => verificarUrlPermitida(),
            ehContextoEditavelOuExtensao: (el) => ehContextoEditavelOuExtensao(el),
            ocultarInspetor: () => ocultarInspetorTempoReal(),
            limparEstadosAposDeselecao: (preservarMiniTip) => {
                ancoraCursorShift = null;
                ultimoTextoSelecionadoLimpo = '';
                ultimoRangeSelecionadoSimples = null;
                ultimoCampoEditavelSelecionado = null;
                teclasPressionadasAtivas.clear();
                limparFlashBorderImediatamente();
                if (acumulador && acumulador.obterQuantidade() > 0) acumulador.limpar();
                limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip);
            },
            limparCampoSimplesNoEsc: (e) => {
                const elAtivo = (document.activeElement && document.activeElement.tagName === 'INPUT')
                    ? document.activeElement
                    : ((e.target && e.target.tagName === 'INPUT') ? e.target : null);
                if (elAtivo && classificarContextoElementoAlvo(elAtivo) === 'CAMPO_SIMPLES_EDITAVEL') {
                    delete elAtivo.dataset.autoselected;
                    elAtivo.__jusgovBlurLigado = false;
                    inputsJaSelecionadosInicialmente.delete(elAtivo);
                    elAtivo.__jusgovSelecionadoInicial = false;
                    try { elAtivo.blur(); } catch (_) { }
                }
            },
            executarAtalhoF1Gemini: () => {
                let textoSelecionadoF1 = '';
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
                    textoSelecionadoF1 = higienizarTextoParaCopia(sel.toString());
                } else if (ultimoTextoSelecionadoLimpo && ultimoTextoSelecionadoLimpo.trim().length > 0) {
                    textoSelecionadoF1 = ultimoTextoSelecionadoLimpo.trim();
                } else {
                    const elemAtivo = document.activeElement;
                    if (elemAtivo && (elemAtivo.tagName === 'INPUT' || elemAtivo.tagName === 'TEXTAREA')) {
                        try {
                            if (typeof elemAtivo.selectionStart === 'number') {
                                const txtInput = elemAtivo.value.substring(elemAtivo.selectionStart, elemAtivo.selectionEnd);
                                if (txtInput && txtInput.trim().length > 0) textoSelecionadoF1 = higienizarTextoParaCopia(txtInput);
                            }
                        } catch (_) { }
                    }
                }
                const templatePrompt = (typeof promptF1Gemini === 'string' && promptF1Gemini.trim().length > 0)
                    ? promptF1Gemini.trim()
                    : PROMPT_F1_GEMINI_PADRAO;
                const promptF1 = textoSelecionadoF1.length > 0
                    ? (templatePrompt.includes('{{TEXTO}}') ? templatePrompt.replace(/\{\{TEXTO\}\}/g, textoSelecionadoF1) : `'${textoSelecionadoF1}' :  ${templatePrompt}`)
                    : '';
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ acao: 'abrirGeminiLateral', modo: 'flash', prompt: promptF1 }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                                try { window.open('https://gemini.google.com/app', '_blank'); } catch (_) { }
                            }
                        });
                    } else {
                        window.open('https://gemini.google.com/app', '_blank');
                    }
                } catch (_) {
                    try { window.open('https://gemini.google.com/app', '_blank'); } catch (__) { }
                }
                if (textoSelecionadoF1.length > 0 && validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    validador.projetarMiniTipGlobal('Abrindo assistente de IA Gemini...', '#2563eb');
                }
            },
            alternarModoFormatacaoDuploEsc: () => {
                manterFormatacaoBasica = !manterFormatacaoBasica;
                try {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                        chrome.storage.sync.set({ manterFormatacaoBasica }).catch(() => { });
                    }
                } catch (_) { }
                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    const norm = normalizarNivelFiltro(nivelFiltroFormatacao);
                    let rotuloNivel = 'Manter Formato Básico';
                    if (norm === 'intermediario') rotuloNivel = 'Manter Formato Intermediário';
                    else if (norm === 'avancado') rotuloNivel = 'Manter Formato Avançado';
                    else if (norm === 'estendido') rotuloNivel = 'Manter Formato Estendido';
                    const msgModo = manterFormatacaoBasica
                        ? `Estilos/Formatação Textual:\n${rotuloNivel}`
                        : 'Remover Estilos/Formatação Textual:\nAtivado - Somente Texto';
                    const corBorda = manterFormatacaoBasica ? '#10b981' : '#3b82f6';
                    validador.projetarMiniTipGlobal(msgModo, corBorda);
                }
            }
        })
        : ((typeof window !== 'undefined' && window.JusGovCopiaTeclado && window.JusGovCopiaTeclado.NULL_OBJECT) || {
            deselecionarTudoEmContexto: () => { },
            executarDeselecaoUniversal: () => { },
            aoPressionarTecla: () => { },
            aoSoltarTecla: () => { }
        });

    function deselecionarTudoEmContexto(win, doc) { return controladorTeclado.deselecionarTudoEmContexto(win, doc); }
    function executarDeselecaoUniversal(origemRemota = false, preservarMiniTip = false) { return controladorTeclado.executarDeselecaoUniversal(origemRemota, preservarMiniTip); }
    function aoPressionarTecla(e) { return controladorTeclado.aoPressionarTecla(e); }
    function aoSoltarTecla(e) { return controladorTeclado.aoSoltarTecla(e); }

    /*
     * FUNCAO: calcularAssinaturaSelecao
     * OBJETIVO: Gerar uma assinatura unica (offsets + texto) da selecao atual, usada para saber se
     * aquela selecao exata ja foi copiada (por qualquer caminho: clique, arraste, teclado ou sistema).
     */
    function calcularAssinaturaSelecao(sel) { return politicaSelecao.calcularAssinaturaSelecao(sel); }
    function tratarMudancaSelecaoGlobal(winAlvo) { return politicaSelecao.tratarMudancaSelecaoGlobal(winAlvo); }

    /* ==========================================================================
     * REGISTRO DETERMINISTICO DE CICLO DE VIDA DE SUBFRAMES (BUG-01 / SECAO 6.47)
     * O porque: Iframes dinamicos de visualizacao de autos/PDFs no PJe, eproc e SAJ
     * sao criados, recarregados (troca de atributo 'src') e removidos continuamente
     * sem recarregar a aba pai. Governar cada subframe same-origin com seu proprio
     * AbortController garante remocao deterministica O(1) das closures de eventos
     * em 4 gatilhos: (a) ativacao do motor nativo no proprio subframe, (b) evento
     * pagehide definitivo (!persisted), (c) remocao fisica do <iframe> no DOM via
     * MutationObserver (removedNodes) ou troca de 'src', e (d) abort do frame pai.
     * ========================================================================== */
    /* Delegação Modular POO (Execução Simultânea Isolada): MonitoramentoDomCopia (src/mod-copia/copia-monitor-dom.js) */
    function limparOuvintesIframeLocal(el) { return monitorDom ? monitorDom.limparOuvintesIframeLocal(el) : false; }
    function limparTodosSubframesLocais() { return monitorDom ? monitorDom.limparTodosSubframesLocais() : 0; }
    function inspecionarIframeLocal(el) { return monitorDom ? monitorDom.inspecionarIframeLocal(el) : false; }
    function observarFramesDinamicos() { return monitorDom ? monitorDom.observarFramesDinamicos() : undefined; }
    function notificarModificacaoPagina(motivo, urlReferencia) { return monitorDom ? monitorDom.notificarModificacaoPagina(motivo, urlReferencia) : undefined; }
    function iniciarMonitoramentoModificacoesPagina(signal) { return monitorDom ? monitorDom.iniciarMonitoramentoModificacoesPagina(signal) : undefined; }

    /* ==========================================================================
     * SECAO 10: INICIALIZACAO, ABORTCONTROLLER E SINCRONIZACAO COM SERVICE WORKER
     * ========================================================================== */

    function sincronizarFachadasModulares() {
        if (fachadaModuloInput && typeof fachadaModuloInput.atualizarConfiguracoes === 'function') {
            try {
                fachadaModuloInput.atualizarConfiguracoes({
                    capturaBotoesMouse4e5Ativa,
                    colarBotaoMeioAtivo,
                    navegacaoTecladoCamposAtiva,
                    atalhoF1GeminiAtivo,
                    promptF1Gemini,
                    caixaEntradaRapidaAtiva
                });
            } catch (_) { }
        }
    }

    function removerOuvintesIpcExtensao() {
        if (syncCfgCopia && typeof syncCfgCopia.removerOuvintes === 'function') {
            syncCfgCopia.removerOuvintes();
        }
    }

    function sincronizarCopiaManualParaClipboardInterno(evCopyOpt = null) {
        return gerenciadorCopia ? gerenciadorCopia.sincronizarCopiaManualParaClipboardInterno(evCopyOpt) : undefined;
    }

    /* Delegação Modular (ENG-00 / ARQ-10): Registro de Eventos DOM e Ciclo de Vida em src/mod-copia/copia-dom.js */
    const ehAppWebConfiavelLocal = () => (gerenciadorCopia ? gerenciadorCopia.ehAppWebConfiavel() : false);
    const gerenciadorDom = (typeof window !== 'undefined' && typeof window.JusGovCopiaDomListeners === 'function')
        ? new window.JusGovCopiaDomListeners({
            aoAntesDeDestruir: () => {
                if (monitorDom) monitorDom.destruir();
                if (orquestradorMouse && typeof orquestradorMouse.destruir === 'function') orquestradorMouse.destruir();
                if (observadorBlindagem) { try { observadorBlindagem.disconnect(); } catch (_) { } observadorBlindagem = null; }
                if (timerDebounceSelecaoGlobal) { clearTimeout(timerDebounceSelecaoGlobal); timerDebounceSelecaoGlobal = null; }
                if (timerFlashBorder) { clearTimeout(timerFlashBorder); timerFlashBorder = null; }
                if (timerCliqueDireitoColagem) { clearTimeout(timerCliqueDireitoColagem); timerCliqueDireitoColagem = null; }
                try { limparFlashBorderImediatamente(); } catch (_) { }
                try { limparAvisosAuditoriaEWikiImediatamente(); } catch (_) { }
                try { ocultarInspetorTempoReal(); } catch (_) { }
                removerOuvintesIpcExtensao();
                isMousePressionado = false;
                botaoLateralEmProcessamento = 0;
                teclasPressionadasAtivas.clear();
            },
            aoAbortarSignal: () => {
                if (monitorDom) monitorDom.destruir();
                if (observadorBlindagem) { try { observadorBlindagem.disconnect(); } catch (_) { } observadorBlindagem = null; }
                if (timerDebounceSelecaoGlobal) { clearTimeout(timerDebounceSelecaoGlobal); timerDebounceSelecaoGlobal = null; }
                if (timerFlashBorder) { clearTimeout(timerFlashBorder); timerFlashBorder = null; }
                if (timerCliqueDireitoColagem) { clearTimeout(timerCliqueDireitoColagem); timerCliqueDireitoColagem = null; }
                if (timerNotificacaoModificacao) { clearTimeout(timerNotificacaoModificacao); timerNotificacaoModificacao = null; }
            },
            aoRestaurarBfCache: () => {
                flashExclusivoSemSelecao = false;
                limparFlashBorderImediatamente();
            },
            aoInicializarObservadores: (signal) => {
                if (!ehDocumentoEditorRicoIsolado(document)) {
                    blindarCSS();
                    sincronizarProtecaoLeituraDom();
                    observarFramesDinamicos();
                }
                iniciarMonitoramentoModificacoesPagina(signal);
                let ultimoPingMovimentoTs = 0;
                let ultimoPingClickTs = 0;
                const notificarAtividadeTrabalhoThrottled = (tipoInteracao = 'movimento') => {
                    const agora = Date.now();
                    if (tipoInteracao === 'click_ou_tecla') {
                        if ((agora - ultimoPingClickTs) < 120) return;
                        ultimoPingClickTs = agora;
                    } else {
                        const emTelaDescanso = Boolean(document.getElementById('jusgov-pomodoro-backdrop-global'));
                        if (!emTelaDescanso) {
                            const barraVisivel = Boolean(document.getElementById('jusgov-pomodoro-barra-global') || document.getElementById('jusgov-pomodoro-barra'));
                            if ((agora - ultimoPingMovimentoTs) < (barraVisivel ? 1000 : 4000)) return;
                        }
                        ultimoPingMovimentoTs = agora;
                    }
                    try {
                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                            chrome.runtime.sendMessage({ acao: 'PING_ATIVIDADE_TRABALHO', tipoInteracao }).catch(() => { });
                        }
                    } catch (_) { }
                };
                window.addEventListener('keydown', (e) => {
                    window.__JUSGOV_MODO_BARALHO__ = Boolean(e.ctrlKey && e.altKey && e.shiftKey);
                    if (!e.repeat) notificarAtividadeTrabalhoThrottled('click_ou_tecla');
                }, { capture: true, passive: true, signal });
                window.addEventListener('mousedown', (ev) => {
                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                    if (ev.target && (ev.target.id === 'jusgov-pomodoro-barra-global' || ev.target.id === 'jusgov-pomodoro-barra')) return;
                    if (path.some((el) => el && (el.id === 'jusgov-pomodoro-barra-global' || el.id === 'jusgov-pomodoro-barra'))) return;
                    notificarAtividadeTrabalhoThrottled('click_ou_tecla');
                }, { capture: true, passive: true, signal });
                window.addEventListener('mousemove', () => notificarAtividadeTrabalhoThrottled('movimento'), { capture: true, passive: true, signal });
                window.addEventListener('wheel', () => notificarAtividadeTrabalhoThrottled('movimento'), { capture: true, passive: true, signal });
            },
            tratarBotoesLaterais4e5: tratarNavegacaoAbasPorBotoesMouse,
            aoPressionarBotaoMouse,
            aoMoverMouse,
            aoSoltarBotaoMouse,
            lidarFocoInteligente,
            aoClicarAuxiliarMouse,
            aoClicar,
            aoDuploCliqueInput: (e) => {
                if (!selecaoEditavelAtiva) return;
                if (classificarContextoElementoAlvo(e.target) === 'CAMPO_SIMPLES_EDITAVEL') {
                    const inp = (e.target && typeof e.target.closest === 'function') ? (e.target.closest('input') || e.target) : e.target;
                    if (inp && typeof inp.select === 'function') {
                        try { inp.select(); registrarSelecaoAtivaCampoEditavel(inp); } catch (_) { }
                    }
                }
            },
            aoAlterarSelectComAlt: (e) => {
                if (!verificarUrlPermitida()) return;
                const elChg = e && e.target;
                if (!elChg || (elChg.tagName !== 'SELECT' && elChg.tagName !== 'OPTION')) return;
                if (!teclasPressionadasAtivas.has('alt') || teclasPressionadasAtivas.has('control') || teclasPressionadasAtivas.has('shift')) return;
                if ((Date.now() - Number(ultimoAltSelectTimestamp || 0)) < 150) return;
                const selEl = (elChg.tagName === 'OPTION' && typeof elChg.closest === 'function') ? elChg.closest('select') : elChg;
                if (!selEl) return;
                const optSel = (typeof selEl.selectedIndex === 'number' && selEl.selectedIndex >= 0 && selEl.options)
                    ? selEl.options[selEl.selectedIndex]
                    : (selEl.selectedOptions && selEl.selectedOptions[0]);
                const textoOpcao = ((optSel && (optSel.text || optSel.textContent)) || selEl.value || '').trim();
                if (!textoOpcao) return;
                ultimoAltSelectTimestamp = Date.now();
                const rSel = document.createRange();
                rSel.selectNode(selEl);
                aplicarSelecaoECopiar(rSel, false, textoOpcao, { temModificador: true, eraArrasto: false, forcarUmaLinha: true });
            },
            aoAbrirMenuContexto,
            aoPressionarTecla,
            aoHelpF1: (e) => { if (atalhoF1GeminiAtivo) e.preventDefault(); },
            aoSoltarTecla,
            ocultarInspetorEmTodosFrames: () => { ocultarInspetorTempoReal(); notificarOutrosFramesOcultarInspetor(); },
            ocultarInspetorTempoReal,
            restaurarSelecaoCampoEditavel: () => restaurarSelecaoCampoEditavelSeNecessario(),
            aoMensagemCrossFrame: (evMsg) => {
                const d = evMsg && evMsg.data;
                if (!d || d.__jusgovAcao !== 'OCULTAR_INSPETOR_TEMPO_REAL') return;
                if (d.origemId !== regrasEInspetor.obterIdFrameInspetor()) ocultarInspetorTempoReal(d.origemId);
                if (window.frames && window.frames.length > 0 && d.__nivelRepasse !== 3) {
                    const proxNivel = (typeof d.__nivelRepasse === 'number') ? (d.__nivelRepasse + 1) : 1;
                    const payloadRepasse = { __jusgovAcao: d.__jusgovAcao, origemId: d.origemId, __repassado: true, __nivelRepasse: proxNivel };
                    for (let i = 0; i < window.frames.length; i++) {
                        try { if (window.frames[i] !== evMsg.source) window.frames[i].postMessage(payloadRepasse, '*'); } catch (_) { }
                    }
                }
            },
            aoBeforeCopy: (evBeforeCopy) => {
                try {
                    if (typeof window !== 'undefined' && window.__TESTE_HEADLESS__ && !window.__JUSGOV_TESTAR_BLOQUEIO_COPIA__) return;
                    if (!verificarUrlPermitida() || ehAppWebConfiavelLocal() || ehDocumentoEditorRicoIsolado(document)) return;
                    if (ehContextoEditavelOuExtensao(evBeforeCopy ? evBeforeCopy.target : null)) return;
                    if (evBeforeCopy && typeof evBeforeCopy.stopPropagation === 'function') evBeforeCopy.stopPropagation();
                    if (evBeforeCopy && typeof evBeforeCopy.stopImmediatePropagation === 'function') evBeforeCopy.stopImmediatePropagation();
                } catch (_) { }
            },
            aoCopy: (evCopy) => {
                try {
                    if (typeof window !== 'undefined' && window.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__) return;
                    if (!verificarUrlPermitida()) return;
                    const emEditor = ehDocumentoEditorRicoIsolado(document) || ehContextoEditavelOuExtensao(evCopy ? evCopy.target : null);
                    const naoBloquearCopy = Boolean(emEditor || ehAppWebConfiavelLocal() || (typeof window !== 'undefined' && (window.__JUSGOV_EXEC_COPY_APP_ATIVO__ || (window.__TESTE_HEADLESS__ && !window.__JUSGOV_TESTAR_BLOQUEIO_COPIA__))));
                    if (!naoBloquearCopy) {
                        if (evCopy && typeof evCopy.stopPropagation === 'function') evCopy.stopPropagation();
                        if (evCopy && typeof evCopy.stopImmediatePropagation === 'function') evCopy.stopImmediatePropagation();
                    }
                    if (!selecaoSendoAplicadaPeloAddon && typeof limparFlashBorderImediatamente === 'function') limparFlashBorderImediatamente();
                    if (!ehAppWebConfiavelLocal()) {
                        sincronizarCopiaManualParaClipboardInterno(evCopy);
                        setTimeout(() => sincronizarCopiaManualParaClipboardInterno(evCopy), 30);
                    }
                } catch (_) { }
            },
            aoCopiaNativaMain: (evNat) => {
                try {
                    if (!verificarUrlPermitida()) return;
                    const det = (evNat && evNat.detail && typeof evNat.detail === 'object') ? evNat.detail : null;
                    if (!det || !det.texto) return;
                    const ehAppWeb = ehAppWebConfiavelLocal();
                    const comShift = !ehAppWeb && (teclasPressionadasAtivas.has('Shift') || teclasPressionadasAtivas.has('ShiftLeft') || teclasPressionadasAtivas.has('ShiftRight'));
                    const modoAcum = !ehAppWeb &&
                        (teclasPressionadasAtivas.has('Control') || teclasPressionadasAtivas.has('ControlLeft') || teclasPressionadasAtivas.has('ControlRight')) &&
                        (teclasPressionadasAtivas.has('Alt') || teclasPressionadasAtivas.has('AltLeft') || teclasPressionadasAtivas.has('AltRight'));
                    processarTextoCopiaNativaInterceptada(String(det.texto || ''), {
                        html: String(det.html || ''),
                        comShift, modoAcumulador: modoAcum, apenasInterno: true,
                        preservarBruto: Boolean(ehAppWeb || det.preservarBruto === true || det.origem === 'write')
                    });
                } catch (_) { }
            },
            aoSelectStart: (evSelStart) => {
                try {
                    if (typeof window !== 'undefined' && window.__TESTE_HEADLESS__ && !window.__JUSGOV_TESTAR_BLOQUEIO_COPIA__) return;
                    if (!verificarUrlPermitida() || ehDocumentoEditorRicoIsolado(document)) return;
                    const t = evSelStart && evSelStart.target;
                    const el = (t && t.nodeType === 1) ? t : (t ? t.parentElement : null);
                    if (el && typeof el.closest === 'function' && el.closest('[data-jusgov-ignore="true"]')) return;
                    if (ehContextoEditavelOuExtensao(el)) return;
                    if (evSelStart && typeof evSelStart.stopPropagation === 'function') evSelStart.stopPropagation();
                    if (evSelStart && typeof evSelStart.stopImmediatePropagation === 'function') evSelStart.stopImmediatePropagation();
                    if (!selecaoSendoAplicadaPeloAddon && tempoFlashBorderMs <= 0 && typeof limparFlashBorderImediatamente === 'function') limparFlashBorderImediatamente();
                } catch (_) { }
            },
            aoPastePassivo: (evPaste) => {
                try {
                    if (window.__JUSGOV_COLAGEM_INTERNA_ATIVA__) return;
                    if (window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ && (Date.now() - window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__) < 350) return;
                    const txtColado = (evPaste && evPaste.clipboardData && typeof evPaste.clipboardData.getData === 'function') ? (evPaste.clipboardData.getData('text/plain') || '') : '';
                    confirmarColagemGlobalEMarcarPermanente(txtColado, false);
                } catch (_) { }
            },
            aoSelectionChange: (evSelectionChange) => {
                if (window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ || ehDocumentoEditorRicoIsolado(document)) return;
                tratarMudancaSelecaoGlobal();
                if (!selecaoSendoAplicadaPeloAddon && !flashExclusivoSemSelecao) {
                    const temAvisoAtivo = Boolean(validador && ((typeof validador.estaAvisoVisivel === 'function' && validador.estaAvisoVisivel()) || validador.avisoVisivel || validador.temporizadorAlerta));
                    if (aguardandoDesselecaoFlash || temAvisoAtivo) {
                        const agoraPerf = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                        const tsRef = Math.max(timestampCriacaoFlash || 0, (validador && validador.timestampCriacaoAviso) ? validador.timestampCriacaoAviso : 0);
                        if ((agoraPerf - tsRef) >= 40 && tempoFlashBorderMs !== -1) {
                            const selAtual = window.getSelection();
                            if (!selAtual || selAtual.rangeCount === 0 || selAtual.isCollapsed || selAtual.toString().trim().length === 0) {
                                limparAvisosAuditoriaEWikiImediatamente(true);
                            }
                        }
                    }
                }
                try {
                    if (verificarUrlPermitida() && !ehContextoEditavelOuExtensao(evSelectionChange ? evSelectionChange.target : null)) {
                        if (evSelectionChange && typeof evSelectionChange.stopPropagation === 'function') evSelectionChange.stopPropagation();
                        if (evSelectionChange && typeof evSelectionChange.stopImmediatePropagation === 'function') evSelectionChange.stopImmediatePropagation();
                    }
                } catch (_) { }
            },
            aoLoadSubframe: (e) => {
                const t = e.target;
                if (t && (t.tagName === 'IFRAME' || t.tagName === 'EMBED' || t.tagName === 'OBJECT')) {
                    try {
                        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                            chrome.runtime.sendMessage({ acao: 'garantirInjecaoSubframes' }).catch(() => { });
                        }
                    } catch (_) { }
                }
            },
            aoMouseUpRedeSeguranca: (e) => {
                isMousePressionado = false;
                if (e && e.button !== undefined && e.button !== 0) return;
                setTimeout(() => { try { tratarMudancaSelecaoGlobal(); } catch (_) { } }, 200);
            },
            aoWindowBlur: () => {
                isMousePressionado = false;
                coordsMouseDown = { x: 0, y: 0 };
                houveArrastoMouse = false;
                botaoLateralEmProcessamento = 0;
                teclasPressionadasAtivas.clear();
                if (tempoFlashBorderMs !== -1) agendarRetiradaFlashAposDesselecao();
            },
            aoScrollGlobal: () => {
                if (visual && typeof visual.atualizarPosicaoFlashSobRolagem === 'function') visual.atualizarPosicaoFlashSobRolagem();
                if (visual && typeof visual.atualizarPosicaoMarcadoresPermanentes === 'function') visual.atualizarPosicaoMarcadoresPermanentes();
                if (validador && typeof validador.atualizarPosicaoAlertaSobRolagem === 'function') validador.atualizarPosicaoAlertaSobRolagem();
            }
        })
        : ((typeof window !== 'undefined' && window.JusGovCopiaDomListeners && window.JusGovCopiaDomListeners.NULL_OBJECT) || {
            registrarListenersDOM: () => null,
            destruirCicloVidaFrame: () => true
        });

    function destruirCicloVidaFrame() { return gerenciadorDom.destruirCicloVidaFrame(); }
    function registrarListenersDOM() { return gerenciadorDom.registrarListenersDOM(); }

    function sincronizarConfiguracaoMarcadorVisual() {
        if (visual && typeof visual.configurarMarcadorColado === 'function') {
            try {
                visual.configurarMarcadorColado({
                    ativo: marcadorConteudoColadoAtivo,
                    preset: presetMarcadorColado,
                    corContorno: corContornoMarcadorColado,
                    corFundo: corFundoMarcadorColado,
                    opacidadeFundo: opacidadeFundoMarcadorColado,
                    estiloBadge: estiloBadgeMarcadorColado,
                    tipoContorno: tipoContornoMarcadorColado
                });
            } catch (_) { }
        }
    }

    /* Delegação Modular (ENG-00 / ARQ-10): Sincronização de Configurações DRY em src/mod-copia/copia-synccfg.js */
    function aplicarEstadoConfig(cfg) {
        if (!cfg || typeof cfg !== 'object') return;
        if (Array.isArray(cfg.regrasMapeamentoElementos)) definirRegrasMapeamentoElementos(cfg.regrasMapeamentoElementos);
        if (cfg.modoTurbo) modoExecucao = cfg.modoTurbo;
        if (Array.isArray(cfg.urlsTurbo)) listaUrlsPermitidas = cfg.urlsTurbo;
        if (Array.isArray(cfg.urlsTurboExcecoes)) listaUrlsExcecoes = cfg.urlsTurboExcecoes;
        if (cfg.modoTurbo || Array.isArray(cfg.urlsTurbo) || Array.isArray(cfg.urlsTurboExcecoes)) sincronizarProtecaoLeituraDom();
        if (typeof cfg.manterFormatacaoBasica === 'boolean') manterFormatacaoBasica = cfg.manterFormatacaoBasica;
        if (typeof cfg.nivelFiltroFormatacao === 'string' && ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido', 'sem_filtro'].includes(cfg.nivelFiltroFormatacao)) {
            nivelFiltroFormatacao = cfg.nivelFiltroFormatacao;
        }
        if (cfg.padronizarFonteCopiaAtivo !== undefined || cfg.fontePadraoCopia !== undefined || cfg.tamanhoFontePadraoCopia !== undefined) {
            if (typeof cfg.padronizarFonteCopiaAtivo === 'boolean') padronizarFonteCopiaAtivo = cfg.padronizarFonteCopiaAtivo;
            if (typeof cfg.fontePadraoCopia === 'string' && cfg.fontePadraoCopia.trim()) fontePadraoCopia = cfg.fontePadraoCopia.trim();
            if (cfg.tamanhoFontePadraoCopia !== undefined && String(cfg.tamanhoFontePadraoCopia).trim()) tamanhoFontePadraoCopia = String(cfg.tamanhoFontePadraoCopia).trim();
            if (filtros && typeof filtros.definirPadraoFonteCopia === 'function') {
                filtros.definirPadraoFonteCopia({
                    ativo: padronizarFonteCopiaAtivo,
                    fonte: fontePadraoCopia,
                    tamanho: tamanhoFontePadraoCopia
                });
            }
        }
        if (typeof cfg.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(cfg.modoPlaceholdersMinutasHtml)) {
            modoPlaceholdersMinutasHtml = cfg.modoPlaceholdersMinutasHtml;
            placeholdersMinutasHtmlAtivo = (cfg.modoPlaceholdersMinutasHtml !== 'desabilitado');
        } else if (typeof cfg.placeholdersMinutasHtmlAtivo === 'boolean') {
            placeholdersMinutasHtmlAtivo = cfg.placeholdersMinutasHtmlAtivo;
            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                modoPlaceholdersMinutasHtml = placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
            }
        }
        if (typeof cfg.selecaoEditavelAtiva === 'boolean') {
            selecaoEditavelAtiva = cfg.selecaoEditavelAtiva;
        }
        if (typeof cfg.colagemBotaoDireitoAtiva === 'boolean') colagemBotaoDireitoAtiva = cfg.colagemBotaoDireitoAtiva;
        if (typeof cfg.capturaBotoesMouse4e5Ativa === 'boolean') capturaBotoesMouse4e5Ativa = cfg.capturaBotoesMouse4e5Ativa;
        if (typeof cfg.colarBotaoMeioAtivo === 'boolean') colarBotaoMeioAtivo = cfg.colarBotaoMeioAtivo;
        if (typeof cfg.navegacaoTecladoCamposAtiva === 'boolean') navegacaoTecladoCamposAtiva = cfg.navegacaoTecladoCamposAtiva;
        if (typeof cfg.caixaEntradaRapidaAtiva === 'boolean') caixaEntradaRapidaAtiva = cfg.caixaEntradaRapidaAtiva;
        if (cfg.tempoConferenciaDocumentosMs !== undefined) {
            const tConf = Number(cfg.tempoConferenciaDocumentosMs);
            tempoConferenciaDocumentosMs = (Number.isFinite(tConf) && (tConf === -1 || (tConf >= 0 && tConf <= 5000))) ? tConf : -1;
            validacaoMatematicaAtiva = (tempoConferenciaDocumentosMs !== 0);
            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
        } else if (typeof cfg.validacaoMatematicaAtiva === 'boolean') {
            validacaoMatematicaAtiva = cfg.validacaoMatematicaAtiva;
            tempoConferenciaDocumentosMs = cfg.validacaoMatematicaAtiva ? -1 : 0;
            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
        }
        if (cfg.tempoFlashBorderMs !== undefined) {
            const tFlash = Number(cfg.tempoFlashBorderMs);
            tempoFlashBorderMs = (Number.isFinite(tFlash) && (tFlash === -1 || (tFlash >= 0 && tFlash <= 5250))) ? tFlash : -1;
        } else if (typeof cfg.flashBorderAtivo === 'boolean') {
            tempoFlashBorderMs = cfg.flashBorderAtivo ? -1 : 0;
        }
        if (typeof cfg.corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corFlashBorder.trim())) corFlashBorder = cfg.corFlashBorder.trim().toLowerCase();
        if (typeof cfg.tipoContornoFlashBorder === 'string' && ['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(cfg.tipoContornoFlashBorder)) tipoContornoFlashBorder = cfg.tipoContornoFlashBorder;
        let mudouMarcador = false;
        if (typeof cfg.marcadorConteudoColadoAtivo === 'boolean') { marcadorConteudoColadoAtivo = cfg.marcadorConteudoColadoAtivo; mudouMarcador = true; }
        if (typeof cfg.presetMarcadorColado === 'string' && cfg.presetMarcadorColado.trim()) { presetMarcadorColado = cfg.presetMarcadorColado.trim(); mudouMarcador = true; }
        if (typeof cfg.corContornoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corContornoMarcadorColado.trim())) { corContornoMarcadorColado = cfg.corContornoMarcadorColado.trim().toLowerCase(); mudouMarcador = true; }
        if (typeof cfg.corFundoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corFundoMarcadorColado.trim())) { corFundoMarcadorColado = cfg.corFundoMarcadorColado.trim().toLowerCase(); mudouMarcador = true; }
        if (typeof cfg.opacidadeFundoMarcadorColado === 'number' && Number.isFinite(cfg.opacidadeFundoMarcadorColado)) { opacidadeFundoMarcadorColado = Math.max(0.05, Math.min(0.85, cfg.opacidadeFundoMarcadorColado)); mudouMarcador = true; }
        if (typeof cfg.estiloBadgeMarcadorColado === 'string' && ['sobrescrito', 'circular', 'chip', 'sem_etiqueta', 'translucido', 'bolinha', 'pilula'].includes(cfg.estiloBadgeMarcadorColado)) { estiloBadgeMarcadorColado = cfg.estiloBadgeMarcadorColado; mudouMarcador = true; }
        if (typeof cfg.tipoContornoMarcadorColado === 'string' && ['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(cfg.tipoContornoMarcadorColado)) { tipoContornoMarcadorColado = cfg.tipoContornoMarcadorColado; mudouMarcador = true; }
        if (mudouMarcador) sincronizarConfiguracaoMarcadorVisual();
        if (cfg.modoRetirarSelecao !== undefined) modoRetirarSelecao = normalizarModoRetirarSelecao(cfg.modoRetirarSelecao);
        if (cfg.minimoCaracteresInterface !== undefined) {
            const minCar = parseInt(cfg.minimoCaracteresInterface, 10);
            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(minCar) ? minCar : 5;
        }
        if (typeof cfg.converterCabecalhoPjeAtivo === 'boolean') converterCabecalhoPjeAtivo = cfg.converterCabecalhoPjeAtivo;
        if (typeof cfg.atalhoF1GeminiAtivo === 'boolean') atalhoF1GeminiAtivo = cfg.atalhoF1GeminiAtivo;
        if (typeof cfg.modoShiftCnj === 'string') modoShiftCnj = cfg.modoShiftCnj;
        if (typeof cfg.promptF1Gemini === 'string' && cfg.promptF1Gemini.trim().length > 0) promptF1Gemini = cfg.promptF1Gemini.trim();
        if (typeof cfg.ativoAmpuletas === 'boolean') { ativoAmpuletas = cfg.ativoAmpuletas; blindarCSS(); }
        if (cfg.tempoExibicaoAlertaMs !== undefined && validador && typeof validador.definirTempoExibicao === 'function') validador.definirTempoExibicao(cfg.tempoExibicaoAlertaMs);
        if (cfg.modoExibicaoValidacao !== undefined && validador && typeof validador.definirModoExibicaoValidacao === 'function') validador.definirModoExibicaoValidacao(cfg.modoExibicaoValidacao);
        if (cfg.posicaoAvisosValidacao !== undefined && validador && typeof validador.definirPosicaoAvisosValidacao === 'function') validador.definirPosicaoAvisosValidacao(cfg.posicaoAvisosValidacao);
        if (typeof cfg.separadorAcumulador === 'string') {
            if (acumulador && typeof acumulador.definirSeparador === 'function') acumulador.definirSeparador(cfg.separadorAcumulador);
            if (filtros && typeof filtros.definirSeparadorTabela === 'function') filtros.definirSeparadorTabela(cfg.separadorAcumulador);
            if (typeof window !== 'undefined') window.__JUSGOV_SEPARADOR_ACUMULADOR__ = cfg.separadorAcumulador;
        }
        if (typeof cfg.incluirSeparadorFinalAcumulador === 'boolean') {
            incluirSeparadorFinalAcumulador = cfg.incluirSeparadorFinalAcumulador;
            if (acumulador && typeof acumulador.definirSeparadorFinal === 'function') acumulador.definirSeparadorFinal(incluirSeparadorFinalAcumulador);
        }
        if (typeof cfg.separadorTabelas === 'string') {
            separadorTabelas = cfg.separadorTabelas;
            if (acumulador && typeof acumulador.definirSeparadorTabela === 'function') acumulador.definirSeparadorTabela(separadorTabelas);
        }
        orquestradorMouse.aplicarConfig({ capturaBotoesMouse4e5Ativa, colarBotaoMeioAtivo, colagemBotaoDireitoAtiva });
        sincronizarFachadasModulares();
    }

    const syncCfgCopia = (typeof window !== 'undefined' && typeof window.JusGovCopiaSyncCfg === 'function')
        ? new window.JusGovCopiaSyncCfg({
            aplicarEstadoConfig,
            limparFlashBorder: () => limparFlashBorderImediatamente(),
            confirmarColagemRemota: (txt) => confirmarColagemGlobalEMarcarPermanente(txt, true),
            executarDeselecaoRemota: () => executarDeselecaoUniversal(true),
            projetarMiniTip: (msg, cor) => { if (validador && typeof validador.projetarMiniTipGlobal === 'function') validador.projetarMiniTipGlobal(msg, cor); }
        })
        : ((typeof window !== 'undefined' && window.JusGovCopiaSyncCfg && window.JusGovCopiaSyncCfg.NULL_OBJECT) || {
            inicializar: () => false,
            removerOuvintes: () => false
        });

    function inicializarModulo() {
        registrarListenersDOM();
        sincronizarConfiguracaoMarcadorVisual();
        syncCfgCopia.inicializar();
        sincronizarFachadasModulares();
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
        envolverHtmlComResetDeCursorParaWord,
        definirNivelFiltroFormatacao(nivel) {
            const norm = normalizarNivelFiltro(nivel);
            nivelFiltroFormatacao = (norm === 'texto_puro') ? 'basico' : norm;
        },
        definirManterFormatacaoBasica(valor) {
            manterFormatacaoBasica = Boolean(valor);
        },
        definirPlaceholdersMinutasHtmlAtivo(valor) {
            placeholdersMinutasHtmlAtivo = Boolean(valor);
            selecaoEditavelAtiva = Boolean(valor);
            modoPlaceholdersMinutasHtml = valor ? 'placeholders' : 'desabilitado';
        },
        definirModoPlaceholdersMinutasHtml(valor) {
            if (valor === 'desabilitado' || valor === 'placeholders' || valor === 'ctrl_avancado' || valor === 'avancado') {
                modoPlaceholdersMinutasHtml = valor;
                placeholdersMinutasHtmlAtivo = (valor !== 'desabilitado');
                selecaoEditavelAtiva = (valor !== 'desabilitado');
            } else {
                placeholdersMinutasHtmlAtivo = Boolean(valor);
                selecaoEditavelAtiva = Boolean(valor);
                modoPlaceholdersMinutasHtml = valor ? 'placeholders' : 'desabilitado';
            }
        },
        definirColagemBotaoDireitoAtiva(valor) {
            colagemBotaoDireitoAtiva = Boolean(valor);
        },
        definirCapturaBotoesMouse4e5Ativa(valor) {
            capturaBotoesMouse4e5Ativa = Boolean(valor);
            sincronizarFachadasModulares();
        },
        definirColarBotaoMeioAtivo(valor) {
            colarBotaoMeioAtivo = Boolean(valor);
            sincronizarFachadasModulares();
        },
        obterColarBotaoMeioAtivo() {
            return colarBotaoMeioAtivo;
        },
        aoPressionarBotaoMouse,
        aoSoltarBotaoMouse,
        aoClicarAuxiliarMouse,
        aoAbrirMenuContexto,
        aoClicar,
        tratarNavegacaoAbasPorBotoesMouse,
        emularTeclasColar,
        emularTeclasWinV,
        definirNavegacaoTecladoCamposAtiva(valor) {
            navegacaoTecladoCamposAtiva = Boolean(valor);
            sincronizarFachadasModulares();
        },
        definirCaixaEntradaRapidaAtiva(valor) {
            caixaEntradaRapidaAtiva = Boolean(valor);
            sincronizarFachadasModulares();
        },
        obterCaixaEntradaRapidaAtiva() {
            return caixaEntradaRapidaAtiva;
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
        executarColagemBotaoDireito,
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
        expandirSentencaCompletaAtePonto,
        tentarExpandirDelimitadoresSimetricos,
        tentarExpandirBlocoMaiusculasComQuebraSuave,
        tentarExpandirBlocoFormatadoDestaque,
        delimitarParagrafoLocalizado,
        resolverSelecaoTriploClique,
        construirMapaTextoBlocoComJanela,
        resolverIndicesExpansaoBase,
        ehTextoBlocoMultiSegmento,
        resolverLimitesBlocoAtivoNaJanela,
        resolverSubSegmentoNoBlocoComposto,
        obterAncoraCursorShift: () => ancoraCursorShift,
        simularCliqueEmTexto(texto, idxZeroBased, numCliques = 1, ehAlt = false) {
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

            const base = resolverIndicesExpansaoBase(mapaSimulado, idxZeroBased, numCliques, { ehAlt: Boolean(ehAlt) });
            const res = base ? base.resultadoIndices : null;
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
        isElementoEmCampoEditavel,
        isSelecaoOuElementoEmCampoEditavel,
        isCampoDeTextoValido,
        isEditorMultilinhaValido,
        isElementoOuAncestralContentEditable,
        isElementoInterfaceDeEditorRico,
        isElementoInterativoOuUi,
        isElementoInterativoClicavelDireto,
        isComponenteBotaoOuFormularioEstrito,
        isComponenteSelecaoOuDropdown,
        localizarBlocoForenseAutoSelecionavelEmInterface,
        isBlocoVerificavel,
        isTextoCampoEstruturadoForense,
        isContextoDeSistemaOuUi,
        isElementoControlePdf,
        isAreaLeituraOuPdfConteudo,
        isCelulaTabelaDadosLeitura,
        isTelaSistemaEstritaParaDesselecao,
        deveManterSelecaoAtivaNoDom,
        aplicarSelecaoDOM,
        executarCopiaDeSelecao,
        aplicarSelecaoECopiar,
        salvarClipboardInternoComBackup,
        executarColagemBotaoDireito,
        extrairTextoVisivelLimpoDeElemento,
        extrairTextoLinkUmaLinha,
        unificarLinhasComEspacamentoAntiTruncamento,
        isLinkMultilinha,
        extrairLinhaClicadaDeLink,
        criarRangeTextoParaEtiquetaOuObjeto,
        resolverRangeAltEmInterface,
        isContainerComposto,
        obterObjetoInterativoParaSelecaoCompleta,
        dispararFlashBorderVisual,
        limparFlashBorderImediatamente,
        limparAvisosAuditoriaEWikiImediatamente,
        resetarTimestampEsc() {
            ultimoTimestampEsc = 0;
        },
        obterValidador() {
            return validador;
        },
        projetarMiniTipGlobalNoTop(mensagem, corBorda) {
            if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                validador.projetarMiniTipGlobal(mensagem, corBorda);
            }
        },
        localizarCampoSimbolosSobCursor,
        definirMinimoCaracteresInterface(valor) {
            const v = Number(valor);
            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(v) ? v : 0;
        },
        obterMinimoCaracteresInterface() {
            return minimoCaracteresInterface;
        },
        definirTempoFlashBorderMs(valor) {
            const v = Number(valor);
            tempoFlashBorderMs = (Number.isFinite(v) && (v === -1 || (v >= 0 && v <= 5250))) ? v : -1;
        },
        obterTempoFlashBorderMs() {
            return tempoFlashBorderMs;
        },
        obterModoRetirarSelecao() {
            return modoRetirarSelecao;
        },
        definirModoRetirarSelecao(valor) {
            modoRetirarSelecao = normalizarModoRetirarSelecao(valor);
        },
        isTextoCampoEstruturadoForense,
        verificarProtecaoTamanhoMinimoInterface,
        isElementoClaramenteDeInterface,
        definirRegrasMapeamentoElementos,
        obterRegrasMapeamentoElementos,
        definirRegrasInternasInterface: (regras) => {
            regrasEInspetor.definirRegrasInternas(regras);
        },
        obterClassificacaoRegraCustomizada,
        obterDiagnosticoElemento,
        atualizarInspetorTempoReal,
        ocultarInspetorTempoReal,
        validarExpressaoSeletor,
        normalizarExpressaoAtributoCss,
        elementoCorrespondeXPath,
        elementoCorrespondeCss,
        elementoCorrespondeRegraMapeamento,
        extrairCaminhoXPathAbsoluto,
        extrairCaminhoXPathRelativo,
        extrairSeletorCssSimplificado,
        executarInspecaoECapturaSeletorUnico,
        abrirModalSalvarRegraMapeamento,
        fecharModalSalvarRegraMapeamento,
        isRegraMuitoCurta,
        restaurarSelecaoCampoEditavelSeNecessario,
        registrarSelecaoAtivaCampoEditavel,
        obterUltimoCampoEditavelSelecionado: () => ultimoCampoEditavelSelecionado,
        definirUltimoCampoEditavelSelecionado: (val) => { ultimoCampoEditavelSelecionado = val; },
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
                navegacaoTecladoCamposAtiva,
                caixaEntradaRapidaAtiva,
                validacaoMatematicaAtiva,
                flashBorderAtivo: tempoFlashBorderMs > 0,
                tempoFlashBorderMs,
                corFlashBorder,
                modoRetirarSelecao,
                minimoCaracteresInterface,
                converterCabecalhoPjeAtivo,
                atalhoF1GeminiAtivo,
                ativoAmpuletas,
                regrasMapeamentoElementos: [...obterRegrasMapeamentoElementos()]
            };
        },
        blindarCSS,
        definirAtivoAmpuletas(valor) {
            ativoAmpuletas = Boolean(valor);
            blindarCSS();
        },
        isPaginaModificada() {
            return monitorDom ? monitorDom.isPaginaModificada() : false;
        },
        notificarModificacaoPagina(motivo, urlRef) {
            notificarModificacaoPagina(motivo, urlRef);
        },
        /* Hooks deterministicos de homologacao de ciclo de vida (BUG-01) e fachadas POO (Secao 6.47) */
        destruirCicloVida() {
            return destruirCicloVidaFrame();
        },
        reconstruirCicloVida() {
            registrarListenersDOM();
            if (syncCfgCopia && typeof syncCfgCopia.inicializar === 'function') {
                syncCfgCopia.inicializar();
            }
            sincronizarFachadasModulares();
            return true;
        },
        inspecionarSubframeTeste(iframeEl) {
            return inspecionarIframeLocal(iframeEl);
        },
        limparSubframeTeste(iframeEl) {
            return limparOuvintesIframeLocal(iframeEl);
        },
        obterEstadoCicloVida() {
            const sinalAtual = (gerenciadorDom && gerenciadorDom.signal)
                || (window.__JUSGOV_ABORT_CONTROLLER__ && window.__JUSGOV_ABORT_CONTROLLER__.signal)
                || null;
            return {
                motorAtivo: Boolean(window.__JUSGOV_MOTOR_SELECAO_ATIVO__),
                controladorAtivo: Boolean(sinalAtual && !sinalAtual.aborted),
                sinalAbortado: sinalAtual ? Boolean(sinalAtual.aborted) : true,
                observerFramesAtivo: monitorDom ? monitorDom.estaObservandoFrames() : false,
                observadorBlindagemAtivo: Boolean(observadorBlindagem),
                subframesMonitoradosCount: monitorDom ? monitorDom.obterTotalSubframesAtivos() : 0,
                ouvintesIpcRegistrados: Boolean(syncCfgCopia && syncCfgCopia.ouvintesAtivos)
            };
        },
        obterFachadaCopia() {
            return fachadaModuloCopia;
        },
        obterFachadaInput() {
            return fachadaModuloInput;
        },
        obterVisual() {
            return visual;
        },
        aplicarLimpezaNumericaComTravaAlfabetica,
        verificarProximidadeGeometricaDoClique,
        confirmarColagemGlobalEMarcarPermanente,
        definirTempoConferenciaDocumentosMs(valor) {
            const v = Number(valor);
            tempoConferenciaDocumentosMs = (Number.isFinite(v) && (v === -1 || (v >= 0 && v <= 5000))) ? v : -1;
            validacaoMatematicaAtiva = (tempoConferenciaDocumentosMs !== 0);
            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
            }
        },
        obterTempoConferenciaDocumentosMs() {
            return tempoConferenciaDocumentosMs;
        },
        configurarMarcadorColado(opcoes = {}) {
            if (typeof opcoes.ativo === 'boolean') marcadorConteudoColadoAtivo = opcoes.ativo;
            if (typeof opcoes.preset === 'string') presetMarcadorColado = opcoes.preset;
            if (typeof opcoes.corContorno === 'string') corContornoMarcadorColado = opcoes.corContorno;
            if (typeof opcoes.corFundo === 'string') corFundoMarcadorColado = opcoes.corFundo;
            if (typeof opcoes.opacidadeFundo === 'number') opacidadeFundoMarcadorColado = opcoes.opacidadeFundo;
            if (typeof opcoes.estiloBadge === 'string') estiloBadgeMarcadorColado = opcoes.estiloBadge;
            if (typeof opcoes.tipoContorno === 'string') tipoContornoMarcadorColado = opcoes.tipoContorno;
            sincronizarConfiguracaoMarcadorVisual();
        },
        construirDegrausCicloSelecao,
        salvarClipboardInternoComBackup,
        gravarNaAreaDeTransferencia,
        localizarBotaoCopiarNativo,
        extrairDadosAlvoDeBotaoCopiarNativo,
        processarTextoCopiaNativaInterceptada,
        interceptarCliqueBotaoCopiarNativo
    });
    window.JusGovCopiaSelecionar = window.JusGovMotorSelecaoTeste;
    window.JusGovMotorTestes = window.JusGovMotorSelecaoTeste;

    inicializarModulo();
})();