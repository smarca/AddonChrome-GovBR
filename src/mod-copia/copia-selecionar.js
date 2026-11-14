/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-selecionar.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-selecionar.js
 * - Objeto Exportado: window.JusGovMotorSelecaoTeste / window.JusGovCopiaSelecionar / window.JusGovMotorTestes (API pública determinística congelada via Object.freeze)
 * - Fachadas Orquestradas: ModuloCopia (window.JusGovModuloCopia), ModuloInput (window.JusGovModuloInput / window.JusGovInstanciaInput) e DialogoMapeamentoRegra (window.JusGovDialogoMapeamentoRegra)
 * - Ciclo de Vida: registrarListenersDOM() / destruirCicloVidaFrame() com AbortController + WeakMap de subframes (BUG-01)
 * - Fluxo Principal: tratarMouseDownGlobal -> tratarMouseUpGlobal -> executarSelecaoInteligentePorClique -> aplicarSelecaoDOM -> executarCopiaDeSelecao -> salvarClipboardInternoComBackup (2 slots: __JUSGOV_ULTIMO_CLIPBOARD__ e __JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__)
 * - Regras / Seções: 6 Estágios, Filtros 0..4, Seções 6.1..6.64, BUG-01..BUG-07
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
    let marcadorConteudoColadoAtivo = true;
    let presetMarcadorColado = 'verde_forense';
    let corContornoMarcadorColado = '#0d9488';
    let corFundoMarcadorColado = '#ccfbf1';
    let opacidadeFundoMarcadorColado = 0.24;
    let estiloBadgeMarcadorColado = 'sobrescrito';
    let tipoContornoMarcadorColado = 'solido';
    let minimoCaracteresInterface = 5;
    let modoRetirarSelecao = 'total_exceto_arrasto'; // 'total_exceto_arrasto' (padrao), 'total', 'interface', 'nenhuma'
    let timerFlashBorder = null;
    let aguardandoDesselecaoFlash = false;
    let flashExclusivoSemSelecao = false;
    let selecaoSendoAplicadaPeloAddon = false;
    let timerDebounceSelecaoGlobal = null;
    let ultimoRangeAssinaturaGlobal = '';
    let ultimaSelecaoManualTexto = '';
    let ultimoTimestampSelecaoManual = 0;
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
    let controladorCicloVida = null;

    function ehTextoBlocoMultiSegmento(texto) {
        if (!texto) return false;
        const t = texto.trim();
        if (!t || t.length > 128 || /\s/.test(t)) return false;
        return /[\p{L}\p{N}]+[^\p{L}\p{N}\s]+[\p{L}\p{N}]+/u.test(t);
    }

    function resolverLimitesBlocoAtivoNaJanela(mapa, idxCursor, blocoAtivo, textoCicloAtual) {
        if (!mapa || typeof mapa.texto !== 'string' || typeof idxCursor !== 'number') return null;
        const texto = mapa.texto;
        const alvo = (blocoAtivo && blocoAtivo.texto) ? blocoAtivo.texto.trim() : '';
        if (alvo) {
            let pos = texto.indexOf(alvo);
            while (pos !== -1) {
                const fim = pos + alvo.length;
                if (idxCursor >= pos && idxCursor <= fim) {
                    return { inicio: pos, fim, texto: alvo };
                }
                pos = texto.indexOf(alvo, pos + 1);
            }
        }
        const resPadrao = tentarExpandirPadraoComposto(texto, idxCursor, false, false)
            || tentarExpandirPadraoComposto(texto, idxCursor, true, false);
        if (resPadrao) {
            const trecho = texto.slice(resPadrao.inicio, resPadrao.fim).trim();
            if (trecho && (
                (alvo && alvo === trecho) ||
                (textoCicloAtual && (textoCicloAtual === trecho || trecho.includes(textoCicloAtual)))
            )) {
                return { inicio: resPadrao.inicio, fim: resPadrao.fim, texto: trecho };
            }
        }
        return null;
    }

    function resolverSubSegmentoNoBlocoComposto(texto, idxCursor, blocoInicio, blocoFim) {
        if (!texto || typeof idxCursor !== 'number' || blocoInicio >= blocoFim) return null;
        let idx = Math.max(blocoInicio, Math.min(blocoFim - 1, idxCursor));
        if (!/[\p{L}\p{N}]/u.test(texto[idx] || '')) {
            return { ehSubSegmento: false, inicio: blocoInicio, fim: blocoFim };
        }
        let ini = idx;
        let fim = idx + 1;
        while (ini > blocoInicio && /[\p{L}\p{N}]/u.test(texto[ini - 1] || '')) ini--;
        while (fim < blocoFim && /[\p{L}\p{N}]/u.test(texto[fim] || '')) fim++;
        return {
            ehSubSegmento: (ini > blocoInicio || fim < blocoFim),
            inicio: ini,
            fim: fim
        };
    }

    function isPontoDentroDoRange(ponto, range) {
        if (!ponto || !ponto.no || !range) return false;
        try {
            const rPonto = document.createRange();
            rPonto.setStart(ponto.no, ponto.offset);
            rPonto.setEnd(ponto.no, ponto.offset);
            return (
                range.compareBoundaryPoints(Range.START_TO_START, rPonto) <= 0 &&
                range.compareBoundaryPoints(Range.END_TO_END, rPonto) >= 0
            );
        } catch (_) {
            return false;
        }
    }

    function construirDegrausCicloSelecao(mapa, idxCursor, elAlvoEfetivo) {
        if (!mapa || typeof mapa.texto !== 'string') return [];
        const { texto } = mapa;
        const degraus = [];
        const adicionarDegrau = (rangeCandidato) => {
            if (!rangeCandidato) return;
            const txt = (extrairTextoPuroSanitizado(rangeCandidato) || rangeCandidato.toString()).trim();
            if (!txt) return;
            if (degraus.some(d => d.texto === txt)) return;
            degraus.push({ range: rangeCandidato, texto: txt });
        };

        /* Degrau 1: Unidade Atômica Mínima */
        const resAtomico = expandirUnidadeAtomicaEstagio1(texto, idxCursor);
        if (resAtomico) {
            adicionarDegrau(criarRangeDOMAPartirDeIndices(mapa, resAtomico.inicio, resAtomico.fim));
        }

        /* Degrau 2: Composto / Destaque / Delimitadores Simétricos */
        const resComposto = tentarExpandirPadraoComposto(texto, idxCursor, true, true)
            || tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor)
            || tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor)
            || tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
        if (resComposto) {
            adicionarDegrau(criarRangeDOMAPartirDeIndices(mapa, resComposto.inicio, resComposto.fim));
        }

        /* Degrau 3: Cláusula / Frase */
        const resFrase = expandirSentencaCompletaAtePonto(texto, idxCursor)
            || expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
        if (resFrase) {
            adicionarDegrau(criarRangeDOMAPartirDeIndices(mapa, resFrase.inicio, resFrase.fim));
        }

        /* Degrau 4: Parágrafo Localizado */
        const resParagrafo = resolverSelecaoTriploClique(mapa, idxCursor);
        if (resParagrafo) {
            adicionarDegrau(criarRangeDOMAPartirDeIndices(mapa, resParagrafo.inicio, resParagrafo.fim));
        }

        /* Degrau 5: Bloco Ancestral Contextual */
        const blocoAncestral = obterBlocoAncestralContextual(elAlvoEfetivo);
        if (blocoAncestral && blocoAncestral !== document.body && blocoAncestral !== document.documentElement) {
            try {
                const rBloco = document.createRange();
                rBloco.selectNodeContents(blocoAncestral);
                adicionarDegrau(rBloco);
            } catch (_) { }
        }

        degraus.sort((a, b) => a.texto.length - b.texto.length);
        return degraus;
    }
    const teclasPressionadasAtivas = new Set();

    /* Regras de Mapeamento Manual Avançado de Elementos (XPath / CSS) Padrões de Fábrica (Seção 6.20 e Seção 6.85) - Vazio de início como padrão */
    const PADROES_FABRICA_REGRAS_MAPEAMENTO = Object.freeze([]);

    let regrasMapeamentoElementos = [];
    let regrasInternasInterface = [];

    (function carregarRegrasInternasInterface() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function' && typeof fetch === 'function') {
                fetch(chrome.runtime.getURL('src/cfg/interface.json'))
                    .then((resp) => resp && resp.ok ? resp.json() : [])
                    .then((dados) => {
                        if (Array.isArray(dados)) {
                            regrasInternasInterface = dados.filter(r => r && r.origem !== 'usuario');
                        }
                    })
                    .catch(() => { });
            }
        } catch (_) { }
    })();

    function definirRegrasMapeamentoElementos(novasRegras) {
        if (Array.isArray(novasRegras)) {
            regrasMapeamentoElementos = [...novasRegras];
        } else {
            regrasMapeamentoElementos = [];
        }
        cacheClassificacaoCustomEl = null;
        cacheClassificacaoCustomTs = 0;
        cacheClassificacaoCustomRes = null;
    }

    function obterRegrasMapeamentoElementos() {
        return regrasMapeamentoElementos;
    }

    function elementoCorrespondeXPath(el, expressaoXPath, herdarFilhos = true) {
        if (!el || typeof expressaoXPath !== 'string' || !expressaoXPath.trim()) return false;
        const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
        if (!doc || typeof doc.evaluate !== 'function') return false;
        try {
            const expr = expressaoXPath.trim();
            const snap = doc.evaluate(
                expr,
                doc,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            if (!snap || snap.snapshotLength === 0) return false;
            for (let i = 0; i < snap.snapshotLength; i++) {
                const no = snap.snapshotItem(i);
                if (!no) continue;
                if (no === el) return true;
                if (herdarFilhos && typeof no.contains === 'function' && no.contains(el)) {
                    return true;
                }
            }
            /* Seção 6.134: Suporte a XPath Completo com Filhos em iframes internos (ex.: downloadBinario.seam) */
            if (herdarFilhos && doc.defaultView && doc.defaultView.frameElement) {
                const frameEl = doc.defaultView.frameElement;
                const parentDoc = frameEl.ownerDocument;
                if (parentDoc && typeof parentDoc.evaluate === 'function') {
                    const snapParent = parentDoc.evaluate(expr, parentDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    for (let j = 0; j < (snapParent ? snapParent.snapshotLength : 0); j++) {
                        const noParent = snapParent.snapshotItem(j);
                        if (noParent && (noParent === frameEl || (typeof noParent.contains === 'function' && noParent.contains(frameEl)))) {
                            return true;
                        }
                    }
                }
            }
        } catch (_) { }
        return false;
    }

    function elementoCorrespondeCss(el, seletorCss, herdarFilhos = true) {
        if (!el || typeof seletorCss !== 'string' || !seletorCss.trim()) return false;
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) return false;
        try {
            const sel = seletorCss.trim();
            if (typeof base.matches === 'function' && base.matches(sel)) return true;
            if (herdarFilhos && typeof base.closest === 'function' && base.closest(sel)) return true;
            /* Seção 6.134: Suporte CSS cross-frame para iframes pais (ex.: iframe#frameBinario / downloadBinario.seam) */
            if (herdarFilhos) {
                let winAtual = base.ownerDocument && base.ownerDocument.defaultView;
                while (winAtual && winAtual.frameElement) {
                    const frameEl = winAtual.frameElement;
                    if (typeof frameEl.matches === 'function' && frameEl.matches(sel)) return true;
                    if (typeof frameEl.closest === 'function' && frameEl.closest(sel)) return true;
                    winAtual = frameEl.ownerDocument && frameEl.ownerDocument.defaultView;
                }
            }
        } catch (_) { }
        return false;
    }

    function normalizarExpressaoAtributoCss(expressao, tipoSeletor = '') {
        if (typeof expressao !== 'string') return '';
        let expr = expressao.trim();
        const ehXPath = (typeof tipoSeletor === 'string' && tipoSeletor.toLowerCase().includes('xpath')) || expr.startsWith('/') || expr.startsWith('(');
        if (!ehXPath && !expr.startsWith('[') && /^[a-zA-Z_][\w-]*(?:\^|\*|\$|~|\|)?=/.test(expr)) {
            if (/^[a-zA-Z_][\w-]*=$/.test(expr)) {
                expr = `[${expr.slice(0, -1)}]`;
            } else {
                const m = expr.match(/^([a-zA-Z_][\w-]*(?:\^|\*|\$|~|\|)?=)(.+)$/);
                if (m) {
                    const val = m[2].trim();
                    const jaAspas = (val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"));
                    expr = `[${m[1]}${jaAspas ? val : `"${val.replace(/"/g, '\\"')}"`}]`;
                }
            }
        }
        return expr;
    }

    function validarExpressaoSeletor(expressao, tipoSeletor = '') {
        if (typeof expressao !== 'string' || !expressao.trim()) return false;
        const expr = normalizarExpressaoAtributoCss(expressao, tipoSeletor);
        try {
            const ehXPath = (typeof tipoSeletor === 'string' && tipoSeletor.toLowerCase().includes('xpath')) || expr.startsWith('/') || expr.startsWith('(');
            if (ehXPath) {
                if (typeof document !== 'undefined' && typeof document.evaluate === 'function') {
                    document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
                }
                return true;
            }
            if (typeof document !== 'undefined' && typeof document.createDocumentFragment === 'function') {
                document.createDocumentFragment().querySelector(expr);
            }
            return true;
        } catch (_) {
            return false;
        }
    }

    function elementoCorrespondeRegraMapeamento(el, expressao, herdarFilhos = true, tipoSeletor = '') {
        if (!el || typeof expressao !== 'string' || !expressao.trim()) return false;
        try {
            const expr = normalizarExpressaoAtributoCss(expressao, tipoSeletor);
            if (!expr) return false;
            if (expr.startsWith('/') || expr.startsWith('(')) {
                return elementoCorrespondeXPath(el, expr, herdarFilhos);
            }
            if (/^document\.querySelector/i.test(expr)) {
                const m = expr.match(/^document\.querySelector(?:All)?\(\s*['"`](.*?)['"`]\s*\)/i);
                if (m && m[1]) {
                    return elementoCorrespondeCss(el, m[1], herdarFilhos);
                }
            }
            return elementoCorrespondeCss(el, expr, herdarFilhos);
        } catch (_) {
            return false;
        }
    }

    let cacheClassificacaoCustomEl = null;
    let cacheClassificacaoCustomTs = 0;
    let cacheClassificacaoCustomRes = null;

    function obterClassificacaoRegraCustomizada(el, apenasUsuario = false) {
        if (!el) return null;
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) return null;

        if (!apenasUsuario) {
            const agora = Date.now();
            if (base === cacheClassificacaoCustomEl && (agora - cacheClassificacaoCustomTs) < 16) {
                return cacheClassificacaoCustomRes;
            }
            const det = obterDiagnosticoRegraDetalhado(base, false);
            const resultado = det ? det.tipo : null;
            cacheClassificacaoCustomEl = base;
            cacheClassificacaoCustomTs = agora;
            cacheClassificacaoCustomRes = resultado;
            return resultado;
        }

        const detUsuario = obterDiagnosticoRegraDetalhado(base, true);
        return detUsuario ? detUsuario.tipo : null;
    }

    function descreverNoCurto(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
        const tag = (el.tagName || '').toLowerCase();
        const idSufixo = el.id ? `#${el.id}` : '';
        const clsStr = (typeof el.className === 'string' && el.className.trim())
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
        return `<${tag}${idSufixo}${clsStr}>`;
    }

    function temEventosAssociadosAoObjeto(el) {
        if (!el) return null;
        let atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        let profundidade = 0;
        const ATRIBUTOS_CLIQUE = new Set(['onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onpointerdown', 'onpointerup', '(click)', '@click', 'v-on:click', 'ng-click', 'routerlink']);
        const TAGS_ESTRUTURAIS_WIZ = new Set(['c-wiz', 'c-data', 'main', 'section', 'article']);
        const RX_JSACTION_CLIQUE = /(?:^|[;\s])(?:click|dblclick|mousedown|mouseup|pointerdown|pointerup|tap)\s*:/i;

        while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 2) {
            profundidade++;
            if (atual.nodeType === Node.ELEMENT_NODE) {
                const descNo = descreverNoCurto(atual);
                const onde = profundidade === 1 ? 'no elemento' : `no ancestral +${profundidade - 1}`;

                if (atual.onclick) return `evento JS onclick em ${descNo} (${onde})`;
                if (atual.ondblclick) return `evento JS ondblclick em ${descNo} (${onde})`;
                if (atual.onmousedown) return `evento JS onmousedown em ${descNo} (${onde})`;
                if (atual.onmouseup) return `evento JS onmouseup em ${descNo} (${onde})`;
                if (atual.onpointerdown) return `evento JS onpointerdown em ${descNo} (${onde})`;
                if (atual.onpointerup) return `evento JS onpointerup em ${descNo} (${onde})`;

                if (atual.attributes && atual.attributes.length > 0) {
                    const tagAtual = (atual.tagName || '').toLowerCase();
                    for (let a = 0; a < atual.attributes.length; a++) {
                        const attrNome = (atual.attributes[a].name || '').toLowerCase();
                        if (ATRIBUTOS_CLIQUE.has(attrNome)) {
                            return `atributo ${attrNome} em ${descNo} (${onde})`;
                        }
                        /* Seção 6.144 (Google Wiz / DevConsole): jsaction em containers/ancestrais ou hooks de ciclo de vida não tornam texto corrido em interface */
                        if (attrNome === 'jsaction' && profundidade === 1 && !TAGS_ESTRUTURAIS_WIZ.has(tagAtual)) {
                            const valJsAction = String(atual.attributes[a].value || '');
                            if (RX_JSACTION_CLIQUE.test(valJsAction)) {
                                return `atributo jsaction (clique) em ${descNo} (${onde})`;
                            }
                        }
                    }
                }
            }
            atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
        }
        return null;
    }

    function resolverTipoElementoPorPrioridade(el) {
        return obterDiagnosticoElemento(el).tipo;
    }

    function obterDiagnosticoRegraDetalhado(el, apenasUsuario = false) {
        if (!el) return null;
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) return null;
        const grupos = apenasUsuario
            ? [{ origem: 'Regra do Usuário', lista: regrasMapeamentoElementos }]
            : [
                { origem: 'Regra do Usuário', lista: regrasMapeamentoElementos },
                { origem: 'Regra Interna', lista: regrasInternasInterface }
            ];
        let achado = null;
        const historico = [];
        for (let g = 0; g < grupos.length; g++) {
            const { origem, lista } = grupos[g];
            if (!Array.isArray(lista) || lista.length === 0) continue;
            let deveParar = false;
            for (let i = 0; i < lista.length; i++) {
                const regra = lista[i];
                if (!regra || regra.ativo === false || !regra.expressao) continue;
                const herdar = regra.herdarFilhos !== false;
                if (elementoCorrespondeRegraMapeamento(base, regra.expressao, herdar, regra.tipoSeletor || '')) {
                    const parou = (regra.continuarProxima !== true);
                    const item = {
                        tipo: regra.tipo || 'semiflexivel',
                        origem,
                        regra: regra.expressao,
                        tipoSeletor: regra.tipoSeletor || '',
                        observacao: regra.observacao || '',
                        parou
                    };
                    achado = item;
                    historico.push(item);
                    if (parou) {
                        deveParar = true;
                        break;
                    }
                }
            }
            if (deveParar || achado !== null) break;
        }
        if (achado) {
            achado.historico = historico;
        }
        return achado;
    }

    function obterDiagnosticoElemento(el) {
        const diag = {
            tipo: 'textual',
            origem: 'Padrão (Texto)',
            rotuloDetalhe: 'Motivo',
            detalhe: 'Textual',
            observacao: '',
            trilha: []
        };
        if (!el) {
            diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
            return diag;
        }
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) {
            diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
            return diag;
        }

        const registrarEtapa = (passo, descricao, tipo, parou = false, observacao = '') => {
            diag.trilha.forEach((t) => { t.decisivo = false; });
            diag.trilha.push({ passo, descricao, tipo, parou, observacao, decisivo: true });
        };

        /* Passo 1: Cursor do mouse */
        if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
            try {
                const cur = window.getComputedStyle(base).cursor;
                if (cur === 'text' || cur === 'vertical-text' || cur === 'cell') {
                    diag.tipo = 'textual';
                    diag.origem = 'Cursor do Mouse';
                    diag.rotuloDetalhe = 'Cursor CSS';
                    diag.detalhe = `cursor: ${cur}`;
                    registrarEtapa('1. Mouse', `cursor: ${cur}`, 'textual', false);
                } else if (cur === 'default' || cur === 'arrow' || cur === 'context-menu' || cur === 'help') {
                    diag.tipo = 'semiflexivel';
                    diag.origem = 'Cursor do Mouse';
                    diag.rotuloDetalhe = 'Cursor CSS';
                    diag.detalhe = `cursor: ${cur}`;
                    registrarEtapa('1. Mouse', `cursor: ${cur}`, 'semiflexivel', false);
                } else if (cur === 'pointer' || cur === 'not-allowed' || cur === 'grabbing' || cur === 'grab' || cur === 'progress') {
                    diag.tipo = 'interface';
                    diag.origem = 'Cursor do Mouse';
                    diag.rotuloDetalhe = 'Cursor CSS';
                    diag.detalhe = `cursor: ${cur}`;
                    registrarEtapa('1. Mouse', `cursor: ${cur}`, 'interface', false);
                }
            } catch (_) { }
        }

        /* Passo 2: Existência de eventos associados */
        const motivoEvento = temEventosAssociadosAoObjeto(base);
        if (motivoEvento) {
            diag.tipo = 'interface';
            diag.origem = 'Eventos / Controle';
            diag.rotuloDetalhe = 'Gatilho';
            diag.detalhe = motivoEvento;
            registrarEtapa('2. Evento JS', motivoEvento, 'interface', false);
        }

        /* Passo 3: Heurísticas extras de Browser (se ainda não for interface) */
        if (diag.tipo !== 'interface') {
            try {
                const stExtra = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
                    ? window.getComputedStyle(base)
                    : null;
                const us = stExtra ? (stExtra.userSelect || stExtra.webkitUserSelect) : '';
                const tabIdx = base.getAttribute ? base.getAttribute('tabindex') : null;
                if (us === 'none') {
                    diag.tipo = 'interface';
                    diag.origem = 'Heurística Browser';
                    diag.rotuloDetalhe = 'Heurística';
                    diag.detalhe = 'user-select: none';
                    registrarEtapa('3. Heurística', 'user-select: none', 'interface', false);
                } else if (tabIdx === '0') {
                    diag.tipo = 'interface';
                    diag.origem = 'Heurística Browser';
                    diag.rotuloDetalhe = 'Heurística';
                    diag.detalhe = 'tabindex="0"';
                    registrarEtapa('3. Heurística', 'tabindex="0"', 'interface', false);
                } else {
                    const tagB = (base.tagName || '').toUpperCase();
                    const ehParagrafo = tagB === 'P' || tagB === 'ARTICLE' || tagB === 'BLOCKQUOTE';
                    const txt = (base.textContent || '').trim();
                    if (!ehParagrafo && txt.length > 0 && txt.length <= 80 && !txt.includes('\n')) {
                        const temMascara = /\b(\d{2}\/\d{2}\/\d{4}|\d{2}:\d{2}(?::\d{2})?|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})\b/.test(txt);
                        if (temMascara) {
                            diag.tipo = 'semiflexivel';
                            diag.origem = 'Heurística Browser';
                            diag.rotuloDetalhe = 'Heurística';
                            diag.detalhe = 'Texto curto com máscara forense';
                            registrarEtapa('3. Heurística', 'máscara forense curta', 'semiflexivel', false);
                        }
                    } else if (txt.length > 100) {
                        diag.tipo = 'textual';
                        diag.origem = 'Heurística Browser';
                        diag.rotuloDetalhe = 'Heurística';
                        diag.detalhe = `Bloco de texto longo (${txt.length} chars)`;
                        registrarEtapa('3. Heurística', `texto longo (${txt.length} chars)`, 'textual', false);
                    }
                }
            } catch (_) { }
        }

        /* Passo 4: Regras XPath/CSS definidas (Usuário -> Internas) */
        const regraDetalhe = obterDiagnosticoRegraDetalhado(base);
        if (regraDetalhe) {
            diag.tipo = regraDetalhe.tipo;
            diag.origem = regraDetalhe.origem;
            diag.rotuloDetalhe = 'Regra';
            diag.detalhe = `${regraDetalhe.tipoSeletor ? '[' + regraDetalhe.tipoSeletor + '] ' : ''}${regraDetalhe.regra}`;
            diag.observacao = regraDetalhe.observacao || '';
            const listaHist = Array.isArray(regraDetalhe.historico) && regraDetalhe.historico.length > 0
                ? regraDetalhe.historico
                : [regraDetalhe];
            for (let h = 0; h < listaHist.length; h++) {
                const itemH = listaHist[h];
                const prefixoSel = itemH.tipoSeletor ? `[${itemH.tipoSeletor}] ` : '';
                registrarEtapa(`4. ${itemH.origem}`, `${prefixoSel}${itemH.regra}`, itemH.tipo, Boolean(itemH.parou), itemH.observacao || '');
            }
        }

        if (diag.trilha.length === 0) {
            diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
        }

        return diag;
    }

    let painelInspetorTempoRealEl = null;

    function ocultarInspetorTempoReal() {
        if (painelInspetorTempoRealEl && painelInspetorTempoRealEl.parentNode) {
            painelInspetorTempoRealEl.parentNode.removeChild(painelInspetorTempoRealEl);
        }
        painelInspetorTempoRealEl = null;
    }

    function atualizarInspetorTempoReal(x, y, alvo) {
        if (typeof document === 'undefined' || !document.body) return;
        const base = (alvo && alvo.nodeType === Node.TEXT_NODE) ? alvo.parentElement : alvo;
        if (!base || (base.closest && base.closest('[data-jusgov-ignore="true"]'))) return;

        if (!painelInspetorTempoRealEl) {
            painelInspetorTempoRealEl = document.createElement('div');
            painelInspetorTempoRealEl.id = 'jusgov-inspetor-tempo-real';
            painelInspetorTempoRealEl.setAttribute('data-jusgov-ignore', 'true');
            painelInspetorTempoRealEl.style.cssText = 'position: fixed; z-index: 2147483647; pointer-events: none; background: rgba(15, 23, 42, 0.96); color: #f8fafc; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; line-height: 1.45; box-shadow: 0 10px 25px rgba(0,0,0,0.55); max-width: 420px; word-break: break-word;';
            document.body.appendChild(painelInspetorTempoRealEl);
        }

        const ehCampoEditavel = isElementoEmCampoEditavel(base) && !isElementoInterfaceDeEditorRico(base);
        const diag = obterDiagnosticoElemento(base);
        const coresTipo = {
            interface: { nome: 'Interface', cor: '#fbbf24' },
            semiflexivel: { nome: 'SemiFlexível', cor: '#38bdf8' },
            textual: { nome: 'Textual', cor: '#34d399' },
            editavel: { nome: 'Editável', cor: '#c084fc' }
        };
        const infoTipo = coresTipo[diag.tipo] || coresTipo.textual;
        const tag = (base.tagName || '').toLowerCase();
        const idStr = base.id ? ` id="${base.id}"` : '';
        const nameAttr = base.getAttribute ? base.getAttribute('name') : '';
        const nameStr = nameAttr ? ` name="${nameAttr}"` : '';
        const roleAttr = base.getAttribute ? base.getAttribute('role') : '';
        const roleStr = roleAttr ? ` role="${roleAttr}"` : '';
        const typeAttr = base.getAttribute ? base.getAttribute('type') : '';
        const typeStr = typeAttr ? ` type="${typeAttr}"` : '';
        const clsStr = (typeof base.className === 'string' && base.className.trim()) ? ` class="${base.className.trim().split(/\s+/).slice(0, 4).join(' ')}"` : '';

        painelInspetorTempoRealEl.innerHTML = '';
        const l1 = document.createElement('div');
        l1.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px;';
        const badgeTipo = document.createElement('span');
        badgeTipo.style.cssText = `font-weight: 700; color: ${ehCampoEditavel ? '#c084fc' : infoTipo.cor};`;
        badgeTipo.textContent = ehCampoEditavel ? '● Campo Editável (Regra de Ouro)' : `● ${infoTipo.nome}`;
        const badgeOrigem = document.createElement('span');
        badgeOrigem.style.cssText = 'font-size: 10px; color: #94a3b8; background: #1e293b; padding: 1px 6px; border-radius: 4px;';
        badgeOrigem.textContent = ehCampoEditavel ? 'Edição Nativa' : diag.origem;
        l1.appendChild(badgeTipo);
        l1.appendChild(badgeOrigem);

        const l2 = document.createElement('div');
        l2.style.cssText = 'font-family: monospace; font-size: 10px; color: #cbd5e1; margin-bottom: 3px;';
        l2.textContent = `Elemento: <${tag}${idStr}${nameStr}${typeStr}${roleStr}${clsStr}>`;

        painelInspetorTempoRealEl.appendChild(l1);
        painelInspetorTempoRealEl.appendChild(l2);

        if (ehCampoEditavel) {
            const l3 = document.createElement('div');
            l3.style.cssText = 'font-family: monospace; font-size: 10px; font-weight: 700; color: #c084fc;';
            l3.textContent = 'Comportamento: Edição livre (nunca intercepta clique/seleção)';
            painelInspetorTempoRealEl.appendChild(l3);
        }

        if (Array.isArray(diag.trilha) && diag.trilha.length > 0) {
            const boxTrilha = document.createElement('div');
            boxTrilha.style.cssText = 'font-family: monospace; font-size: 9.5px; margin-top: 5px; border-top: 1px dashed #334155; padding-top: 4px; display: flex; flex-direction: column; gap: 2px;';
            diag.trilha.forEach((etapa) => {
                const linhaT = document.createElement('div');
                const corEtapa = coresTipo[etapa.tipo] ? coresTipo[etapa.tipo].cor : '#94a3b8';
                const nomeEtapa = coresTipo[etapa.tipo] ? coresTipo[etapa.tipo].nome : etapa.tipo;
                const tagParada = etapa.parou ? ' [PAROU]' : (etapa.passo.startsWith('4.') ? ' [continua]' : '');
                const textoEtapa = etapa.descricao
                    ? `${etapa.passo}: ${etapa.descricao} → ${nomeEtapa}${tagParada}`
                    : `${etapa.passo}: ${nomeEtapa}${tagParada}`;
                if (etapa.decisivo && !ehCampoEditavel) {
                    linhaT.style.cssText = `color: #f8fafc; background: rgba(56, 189, 248, 0.14); border-left: 2px solid ${corEtapa}; padding: 1px 5px; border-radius: 3px; font-weight: 700;`;
                    linhaT.textContent = `★ ${textoEtapa}`;
                } else {
                    linhaT.style.cssText = 'color: #94a3b8; padding-left: 7px;';
                    linhaT.textContent = `• ${textoEtapa}`;
                }
                boxTrilha.appendChild(linhaT);

                if (etapa.observacao) {
                    const linhaObs = document.createElement('div');
                    linhaObs.style.cssText = 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #fbbf24; font-style: italic; padding-left: 14px; margin-bottom: 2px;';
                    linhaObs.textContent = `Obs: ${etapa.observacao}`;
                    boxTrilha.appendChild(linhaObs);
                }
            });
            painelInspetorTempoRealEl.appendChild(boxTrilha);
        }

        const left = Math.min(x + 16, window.innerWidth - 435);
        const top = Math.min(y + 16, window.innerHeight - 210);
        painelInspetorTempoRealEl.style.left = `${Math.max(8, left)}px`;
        painelInspetorTempoRealEl.style.top = `${Math.max(8, top)}px`;
    }

    const dialogoMapeamento = (typeof window !== 'undefined' && window.JusGovDialogoMapeamentoRegra) ? new window.JusGovDialogoMapeamentoRegra() : null;
    function fecharModalSalvarRegraMapeamento() { return dialogoMapeamento ? dialogoMapeamento.fecharModal() : null; }
    function obterDepsDialogoMapeamento() {
        return {
            validarExpressaoSeletor,
            normalizarExpressaoAtributoCss,
            obterDiagnosticoElemento,
            aoSalvarRegras: (novasRegras) => {
                regrasMapeamentoElementos.push(...novasRegras);
                cacheClassificacaoCustomEl = null;
                cacheClassificacaoCustomTs = 0;
                cacheClassificacaoCustomRes = null;
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
    /*
     * FUNCAO: isElementoControlePdf
     * DIRETRIZ ROOT 6.32: Identifica se o elemento alvo pertence a barra de ferramentas,
     * painel lateral ou botoes/menus de controle de um visualizador de PDF embutido
     * (<viewer-toolbar>, div#toolbar, cr-icon-button, #sidenav-container, etc.).
     */
    function isElementoControlePdf(el) {
        if (!el) return false;
        return classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL';
    }

    /*
     * FUNCAO: isCelulaTabelaDadosLeitura
     * DIRETRIZ ROOT 6.39: Identifica celulas de tabelas de dados que permanecem em leitura textual
     * conforme a base unificada (classificarContextoElementoAlvo).
     */
    function isCelulaTabelaDadosLeitura(el) {
        if (!el) return false;
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) return false;
        const celula = (typeof base.closest === 'function')
            ? base.closest('td, th, [role="cell"], [role="gridcell"], .rich-table-cell')
            : null;
        if (!celula) return false;
        return classificarContextoElementoAlvo(base) === 'LEITURA_COMUM';
    }

    /*
     * FUNCAO: isAreaLeituraOuPdfConteudo
     * DIRETRIZ ROOT 6.16 e 6.32: Delega integralmente a classificacao de leitura documental/PDF
     * para classificarContextoElementoAlvo (incluindo regras do Mapeamento Manual Avancado e interface.json).
     */
    function isAreaLeituraOuPdfConteudo(el) {
        if (!el) return false;
        const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (!base) return false;
        const ctx = classificarContextoElementoAlvo(base);
        if (typeof document !== 'undefined' && document.contentType === 'application/pdf') {
            return ctx !== 'LINK_CLICAVEL' && ctx !== 'IGNORAR';
        }
        return ctx === 'LEITURA_COMUM';
    }

    function isElementoInterativoOuUi(el) {
        if (!el) return false;
        const ctx = classificarContextoElementoAlvo(el);
        return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
    }

    /*
     * FUNCAO: isElementoInterativoClicavelDireto
     * DIRETRIZ ROOT 2.17: Delega para classificarContextoElementoAlvo.
     */
    function isElementoInterativoClicavelDireto(el) {
        if (!el) return false;
        return classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL';
    }

    /*
     * FUNCAO: isComponenteSelecaoOuDropdown
     * BUG-16 (Seção 6.70): Delega para classificarContextoElementoAlvo.
     */
    function isComponenteSelecaoOuDropdown(el) {
        if (!el) return false;
        return classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL';
    }

    /*
     * FUNCAO: isComponenteBotaoOuFormularioEstrito
     * DIRETRIZ ROOT 2.17 e 6.20: Delega para classificarContextoElementoAlvo.
     */
    function isComponenteBotaoOuFormularioEstrito(el) {
        if (!el) return false;
        return classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL';
    }

    /*
     * FUNCAO: localizarBlocoForenseAutoSelecionavelEmInterface
     * DIRETRIZ ROOT 6.20: Verifica se a posicao clicada dentro de um container de interface
     * (como cabeçalho de documento PJe, arvore de timeline, <div>, <span>, <small>, <td> ou <a>)
     * incide sobre uma mascara/bloco estruturado forense (datas em qualquer formato, horas,
     * combinacoes de data+hora, CPF, CNPJ, processos CNJ, IDs numericos, protocolos, moedas, etc.).
     * Respeita integralmente as regras de selecao do motor (Passo 7.2.4):
     * - Em datas seguidas de horario (ex: "05/10/2026 20:38:19" ou "22/10/2026 13:27:16"):
     *   * 1 clique sobre a data: seleciona apenas a data ("05/10/2026");
     *   * 1 clique sobre a hora: seleciona apenas a hora ("20:38:19");
     *   * 1 clique no espaco/separador entre data e hora (ou 2 cliques): seleciona os dois ("05/10/2026 20:38:19").
     */
    function localizarBlocoForenseAutoSelecionavelEmInterface(texto, idxCursor, numCliques = 1, combinarDataHoraNoCliqueUnico = false) {
        if (validadores && typeof validadores.localizarBlocoForenseAutoSelecionavelEmInterface === 'function') {
            return validadores.localizarBlocoForenseAutoSelecionavelEmInterface(
                texto,
                idxCursor,
                numCliques,
                combinarDataHoraNoCliqueUnico,
                estagio2
            );
        }

        if (typeof texto !== 'string' || texto.length === 0) return null;
        if (idxCursor < 0 || idxCursor > texto.length) return null;

        const ehDuplo = numCliques >= 2;
        const charNoCursor = texto[idxCursor] || '';
        const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
        const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
            (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));

        let res = tentarExpandirPadraoComposto(texto, idxCursor, ehDuplo || clicouEmEspaco, ehDuplo);

        /* Somente se combinarDataHoraNoCliqueUnico for explicitamente solicitado como true,
         * forca a combinacao no clique simples; por padrao (false), respeita 100% a regra de
         * data isolada / hora isolada / espaco ou 2 cliques para ambos. */
        if (combinarDataHoraNoCliqueUnico && (!res || res.grupo === 'DATA_COM_HORARIO_CONTIGUO' || res.grupo === 'DATAS_E_HORARIOS')) {
            const resCompostoIntegral = tentarExpandirPadraoComposto(texto, idxCursor, true, true);
            if (resCompostoIntegral && resCompostoIntegral.grupo === 'DATA_COM_HORARIO_CONTIGUO') {
                res = resCompostoIntegral;
            }
        }

        if (!res) {
            // BUG-14 / BUG-15: Suporte a números puros e blocos curtos sob o cursor em interface
            let ini = idxCursor;
            while (ini > 0 && /\d/.test(texto[ini - 1])) ini--;
            let fim = idxCursor;
            while (fim < texto.length && /\d/.test(texto[fim])) fim++;
            if (fim > ini) {
                res = { inicio: ini, fim: fim, grupo: 'NUMERO_PURO' };
            }
        }

        if (!res) return null;
        const trecho = texto.substring(res.inicio, res.fim).trim();
        // BUG-15: Limiar mínimo de 1 caractere útil
        if (!trecho || trecho.length < 1) return null;
        if (!isBlocoVerificavel(trecho)) return null;
        return res;
    }

    /*
     * FUNCAO: isElementoOcultoNoDom
     * DIRETRIZ ROOT: Verifica se um elemento esta oculto na tela (display: none, visibility: hidden,
     * [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, opacity: 0 ou font-size: 0px)
     * para garantir que textos ocultos dentro de links ou blocos nunca sejam copiados.
     */
    function isElementoOcultoNoDom(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
        if (el.hidden || el.hasAttribute('hidden')) return true;
        if (el.getAttribute('aria-hidden') === 'true') return true;
        if (el.hasAttribute('data-jusgov-ignore')) return true;

        const cls = (typeof el.className === 'string') ? el.className.toLowerCase() : '';
        if (cls && (
            /\bsr-only\b/.test(cls) ||
            /\bvisually-hidden\b/.test(cls) ||
            /\bscreen-reader-text\b/.test(cls) ||
            /\bd-none\b/.test(cls) ||
            /\bhidden\b/.test(cls) ||
            /\blabel-copy\b/.test(cls) ||
            /\bicone-copy\b/.test(cls) ||
            /\bui-helper-hidden\b/.test(cls)
        )) {
            return true;
        }

        const stInline = (el.getAttribute('style') || '').toLowerCase().replace(/\s+/g, '');
        if (
            stInline.includes('display:none') ||
            stInline.includes('visibility:hidden') ||
            stInline.includes('visibility:collapse') ||
            stInline.includes('opacity:0;') ||
            stInline.endsWith('opacity:0') ||
            stInline.includes('font-size:0px') ||
            stInline.includes('font-size:0;')
        ) {
            return true;
        }

        if (el.isConnected && typeof window.getComputedStyle === 'function') {
            try {
                const comp = window.getComputedStyle(el);
                if (comp) {
                    if (comp.display === 'none' || comp.visibility === 'hidden' || comp.visibility === 'collapse') {
                        return true;
                    }
                    if (comp.opacity === '0' || comp.fontSize === '0px') {
                        return true;
                    }
                }
            } catch (_) { }
        }
        return false;
    }

    /*
     * FUNCAO: extrairTextoVisivelLimpoDeElemento
     * DIRETRIZ ROOT: Extrai exclusivamente o texto visivel de um link, botao ou controle
     * ignorando completamente filhos ocultos (display:none, visibility:hidden, aria-hidden, sr-only, etc.)
     * e aplicando os filtros de higienizacao.
     */
    function extrairTextoVisivelLimpoDeElemento(el) {
        if (!el) return '';
        try {
            let partes = [];
            const TAGS_BLOCOS_ESPACAMENTO = new Set([
                'DIV', 'P', 'LI', 'TR', 'TD', 'TH', 'SECTION', 'ARTICLE',
                'HEADER', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE',
                'DT', 'DD'
            ]);
            const percorrer = (no) => {
                if (!no) return;
                if (no.nodeType === Node.ELEMENT_NODE) {
                    const tag = (no.tagName || '').toUpperCase();
                    if (
                        tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
                        tag === 'SVG' || tag === 'CANVAS' || tag === 'TEMPLATE' ||
                        isElementoOcultoNoDom(no)
                    ) {
                        return;
                    }
                    if (typeof no.matches === 'function' && no.matches('[class*="desvincular"], [class*="icon-desvincular"], .fa-times, .fa-close, [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], [class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy')) {
                        return;
                    }
                    if (tag === 'BR') {
                        partes.push(' ');
                        return;
                    }
                    const ehBlocoOuColuna = TAGS_BLOCOS_ESPACAMENTO.has(tag) || (
                        typeof no.className === 'string' && (
                            no.className.includes('col-') || no.className.includes('dtPolo') ||
                            no.className.includes('polo') || no.className.includes('tarefa') ||
                            no.className.includes('card')
                        )
                    );
                    if (ehBlocoOuColuna && partes.length > 0 && !/\s$/.test(partes[partes.length - 1])) {
                        partes.push(' ');
                    }
                    const filhos = no.childNodes;
                    for (let i = 0; i < filhos.length; i++) {
                        percorrer(filhos[i]);
                    }
                    if (ehBlocoOuColuna && partes.length > 0 && !/\s$/.test(partes[partes.length - 1])) {
                        partes.push(' ');
                    }
                } else if (no.nodeType === Node.TEXT_NODE) {
                    const val = no.nodeValue || '';
                    if (val) partes.push(val);
                }
            };
            percorrer(el);
            const bruto = unificarLinhasComEspacamentoAntiTruncamento(partes.join(''));
            if (bruto) {
                return higienizarTextoParaCopia(bruto) || bruto;
            }
            const fallbackInner = (typeof el.innerText === 'string')
                ? unificarLinhasComEspacamentoAntiTruncamento(el.innerText)
                : '';
            return fallbackInner ? (higienizarTextoParaCopia(fallbackInner) || fallbackInner) : '';
        } catch (_) {
            return unificarLinhasComEspacamentoAntiTruncamento(el.innerText || '');
        }
    }

    /*
     * FUNCAO: unificarLinhasComEspacamentoAntiTruncamento
     * DIRETRIZ SEÇÃO 6.3:
     * Ao suprimir quebras de linha (\n, \r, <br>) para condensar o conteúdo copiado em uma
     * única linha (linha só), é estritamente obrigatório inserir um espaço em branco separador
     * (' ') entre os blocos e linhas conectadas, garantindo que o final de uma linha jamais
     * se funda com o início da linha seguinte (ex.: evitar concatenar "DISTRIBUIÇÃO AO VARA FEDERAL"
     * com "CÍVEL E CRIMINAL" gerando "FEDERALCÍVEL").
     */
    function unificarLinhasComEspacamentoAntiTruncamento(texto) {
        if (!texto || typeof texto !== 'string') return '';
        return texto
            .replace(/[\r\n\t\f\v]+/g, ' ')
            .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/gu, ' ')
            .replace(/ {2,}/g, ' ')
            .trim();
    }

    /*
     * FUNCAO: isLinkMultilinha
     * DIRETRIZ SEÇÃO 6.7:
     * Identifica se um link (<a> ou [role="link"]) possui múltiplas linhas, seja por
     * quebras explícitas no DOM (<br>, \n, divs/p/li internas) ou por quebra visual
     * de layout (getClientRects com posições verticais 'top' distintas).
     */
    function isLinkMultilinha(elLink) {
        if (!elLink) return false;
        try {
            if (elLink.querySelector('br, hr, p, div, li, tr, blockquote')) return true;
            const txt = (elLink.innerText || elLink.textContent || '');
            if (txt.includes('\n') || txt.includes('\r')) return true;

            const rects = Array.from(elLink.getClientRects());
            if (rects.length > 1) {
                const primeiroTop = rects[0].top;
                for (let i = 1; i < rects.length; i++) {
                    if (Math.abs(rects[i].top - primeiroTop) >= 5) {
                        return true;
                    }
                }
            }
        } catch (_) { }
        return false;
    }

    /*
     * FUNCAO: extrairLinhaClicadaDeLink
     * DIRETRIZ SEÇÃO 6.7 (Passo 2):
     * Em links multilinhas com Alt + 1 clique, quando o clique não incide sobre bloco/máscara
     * forense, extrai e isola APENAS A LINHA INTEIRA ONDE OCORREU O CLIQUE.
     */
    function extrairLinhaClicadaDeLink(elLink, clientX, clientY, noReferencia = null) {
        if (!elLink) return null;
        try {
            const ponto = (typeof clientX === 'number' && typeof clientY === 'number')
                ? obterPontoDoClique(clientX, clientY)
                : null;
            let noAlvo = (ponto && ponto.no) ? ponto.no : null;
            if (!noAlvo || !elLink.contains(noAlvo)) {
                if (noReferencia && elLink.contains(noReferencia)) {
                    noAlvo = noReferencia;
                } else {
                    noAlvo = elLink.firstChild;
                }
            }
            if (!noAlvo) return null;

            // 1. Sub-elementos ou blocos internos de elLink (ex: div, span, p)
            // Se o link possui múltiplos elementos filhos e o clique incidiu em um deles,
            // isola a linha/conteúdo estritamente daquele sub-elemento (ex: span de assunto ou div de processo)
            let sub = (noAlvo.nodeType === Node.ELEMENT_NODE) ? noAlvo : noAlvo.parentElement;
            while (sub && sub.parentElement && sub.parentElement !== elLink && sub !== elLink) {
                sub = sub.parentElement;
            }
            if (sub && sub !== elLink && elLink.children.length > 1) {
                const brsSub = Array.from(sub.querySelectorAll('br'));
                if (brsSub.length === 0) {
                    const rectsSub = Array.from(sub.getClientRects());
                    let temQuebraVisualInterna = false;
                    if (rectsSub.length > 1) {
                        const primTop = rectsSub[0].top;
                        temQuebraVisualInterna = rectsSub.some(r => Math.abs(r.top - primTop) >= 5);
                    }
                    if (!temQuebraVisualInterna) {
                        const rSub = document.createRange();
                        const hiddenSub = sub.querySelector('[class*="hidden"], .hidden');
                        const iconeSub = sub.querySelector('[class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy, [title*="Copiar"]');
                        if (hiddenSub && sub.contains(hiddenSub)) {
                            rSub.setStartAfter(hiddenSub);
                        } else {
                            rSub.setStart(sub, 0);
                        }
                        if (iconeSub && sub.contains(iconeSub)) {
                            rSub.setEndBefore(iconeSub);
                        } else {
                            rSub.setEnd(sub, sub.childNodes.length);
                        }
                        const txtSub = extrairTextoVisivelLimpoDeElemento(sub) || unificarLinhasComEspacamentoAntiTruncamento(rSub.toString());
                        if (txtSub && txtSub.length > 0) {
                            return { range: rSub, texto: txtSub };
                        }
                    }
                }
            }

            // 2. Quebra por tags <br> filhas de elLink
            const brs = Array.from(elLink.querySelectorAll('br'));
            if (brs.length > 0) {
                const segmentos = [];
                let rangeAtual = document.createRange();
                rangeAtual.setStart(elLink, 0);

                for (let i = 0; i < elLink.childNodes.length; i++) {
                    const filho = elLink.childNodes[i];
                    if (filho.tagName === 'BR') {
                        rangeAtual.setEndBefore(filho);
                        const txtSeg = unificarLinhasComEspacamentoAntiTruncamento(rangeAtual.toString());
                        if (txtSeg.length > 0) {
                            segmentos.push({ range: rangeAtual, texto: txtSeg });
                        }
                        rangeAtual = document.createRange();
                        if (i + 1 < elLink.childNodes.length) {
                            rangeAtual.setStartAfter(filho);
                        }
                    }
                }
                if (rangeAtual.startContainer) {
                    try {
                        rangeAtual.setEnd(elLink, elLink.childNodes.length);
                        const txtFinal = unificarLinhasComEspacamentoAntiTruncamento(rangeAtual.toString());
                        if (txtFinal.length > 0) {
                            segmentos.push({ range: rangeAtual, texto: txtFinal });
                        }
                    } catch (_) { }
                }

                if (segmentos.length > 0) {
                    for (const seg of segmentos) {
                        try {
                            if (noAlvo && seg.range.isPointInRange(noAlvo, (ponto && ponto.offset) || 0)) {
                                return seg;
                            }
                        } catch (_) { }
                    }
                    let melhorSeg = segmentos[0];
                    let menorDist = Infinity;
                    for (const seg of segmentos) {
                        const rect = seg.range.getBoundingClientRect();
                        if (rect && rect.height > 0) {
                            const dist = Math.abs(clientY - (rect.top + rect.height / 2));
                            if (dist < menorDist) {
                                menorDist = dist;
                                melhorSeg = seg;
                            }
                        }
                    }
                    return melhorSeg;
                }
            }

            // 3. Quebra visual de linha (via DOMRects no mesmo clientY)
            if (noAlvo && noAlvo.nodeType === Node.TEXT_NODE) {
                const val = noAlvo.nodeValue || '';
                const off = Math.max(0, Math.min((ponto && ponto.offset) || 0, Math.max(0, val.length - 1)));
                const rChar = document.createRange();
                rChar.setStart(noAlvo, off);
                rChar.setEnd(noAlvo, Math.min(off + 1, val.length));
                const rc = rChar.getBoundingClientRect();
                const refTop = (rc && rc.height > 0) ? rc.top : clientY;

                let inicioOff = off;
                let fimOff = off;

                while (inicioOff > 0) {
                    const ch = val[inicioOff - 1];
                    if (ch === '\n' || ch === '\r') break;
                    const rT = document.createRange();
                    rT.setStart(noAlvo, inicioOff - 1);
                    rT.setEnd(noAlvo, inicioOff);
                    const rectT = rT.getBoundingClientRect();
                    if (rectT && rectT.height > 0 && Math.abs(rectT.top - refTop) > 5) break;
                    inicioOff--;
                }

                while (fimOff < val.length) {
                    const ch = val[fimOff];
                    if (ch === '\n' || ch === '\r') break;
                    const rT = document.createRange();
                    rT.setStart(noAlvo, fimOff);
                    rT.setEnd(noAlvo, fimOff + 1);
                    const rectT = rT.getBoundingClientRect();
                    if (rectT && rectT.height > 0 && Math.abs(rectT.top - refTop) > 5) break;
                    fimOff++;
                }

                while (inicioOff < fimOff && /[\s\u00A0]/.test(val[inicioOff])) inicioOff++;
                while (fimOff > inicioOff && /[\s\u00A0]/.test(val[fimOff - 1])) fimOff--;

                if (fimOff > inicioOff) {
                    const rVisual = document.createRange();
                    rVisual.setStart(noAlvo, inicioOff);
                    rVisual.setEnd(noAlvo, fimOff);
                    const tVisual = unificarLinhasComEspacamentoAntiTruncamento(val.substring(inicioOff, fimOff));
                    if (tVisual) {
                        return { range: rVisual, texto: tVisual };
                    }
                }
            }

            const rAll = document.createRange();
            rAll.selectNodeContents(elLink);
            return { range: rAll, texto: extrairTextoVisivelLimpoDeElemento(elLink) };
        } catch (_) {
            return null;
        }
    }

    /*
     * FUNCAO: criarRangeTextoParaEtiquetaOuObjeto
     * DIRETRIZ SEÇÃO 6.6:
     * Para etiquetas, badges, chips e itens de interface que possuam botões de exclusão
     * irmãos (.fa-times, .icon-desvincular-tag, etc.), cria o range de seleção e contorno
     * Flash Verde incidindo EXCLUSIVAMENTE sobre o rótulo da etiqueta, sem envolver o botão
     * de desvinculação nem a estrutura física de contêineres externos.
     */
    function criarRangeTextoParaEtiquetaOuObjeto(elInterativo) {
        if (!elInterativo) return null;
        const range = document.createRange();
        const SELETOR_BOTAO_EXCLUSAO = '[class*="desvincular"], [class*="icon-desvincular"], [class*="close"], [class*="remove"], [class*="delete"], [class*="excluir"], [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], .fa-times, .fa-close, .fa-remove, mat-icon';

        try {
            const temBotaoRemover = (typeof elInterativo.querySelector === 'function') && elInterativo.querySelector(SELETOR_BOTAO_EXCLUSAO);
            if (temBotaoRemover) {
                const spans = Array.from(elInterativo.querySelectorAll('span, b, strong, em'));
                const spanRotulo = spans.find(sp => {
                    return !sp.closest(SELETOR_BOTAO_EXCLUSAO) && (sp.innerText || sp.textContent || '').trim().length > 0;
                });
                if (spanRotulo) {
                    range.selectNodeContents(spanRotulo);
                    return range;
                }

                const filhos = elInterativo.childNodes;
                for (let i = 0; i < filhos.length; i++) {
                    const f = filhos[i];
                    if (f.nodeType === Node.TEXT_NODE && f.nodeValue && f.nodeValue.trim().length > 0) {
                        range.setStart(f, 0);
                        range.setEnd(f, f.nodeValue.length);
                        return range;
                    }
                }
            }
        } catch (_) { }

        range.selectNodeContents(elInterativo);
        return range;
    }

    /*
     * FUNCAO: extrairTextoLinkUmaLinha
     * DIRETRIZ ROOT 6.28 (Alt + 3 Cliques em Links):
     * Seleciona e extrai TODO O TEXTO VISIVEL de um link (<a> ou [role="link"]),
     * mesmo que ele ocupe duas ou mais linhas visuais, possua <br>, \r\n, \n ou
     * multiplos blocos/spans internos, unificando tudo em UMA UNICA LINHA
     * devidamente separada por espacos simples (' ').
     */
    function extrairTextoLinkUmaLinha(elLink) {
        if (!elLink) return '';
        try {
            let partes = [];
            const TAGS_SEPARACAO_LINHA = new Set([
                'DIV', 'P', 'LI', 'TR', 'TD', 'TH', 'SECTION', 'ARTICLE',
                'HEADER', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'
            ]);
            const percorrer = (no) => {
                if (!no) return;
                if (no.nodeType === Node.ELEMENT_NODE) {
                    const tag = (no.tagName || '').toUpperCase();
                    if (
                        tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
                        tag === 'SVG' || tag === 'CANVAS' || tag === 'TEMPLATE' ||
                        isElementoOcultoNoDom(no)
                    ) {
                        return;
                    }
                    if (typeof no.matches === 'function' && no.matches('[class*="desvincular"], [class*="icon-desvincular"], .fa-times, .fa-close, [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], [class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy')) {
                        return;
                    }
                    if (tag === 'BR') {
                        partes.push(' ');
                        return;
                    }
                    const ehBlocoSeparador = TAGS_SEPARACAO_LINHA.has(tag);
                    if (ehBlocoSeparador && partes.length > 0) {
                        partes.push(' ');
                    }
                    const filhos = no.childNodes;
                    for (let i = 0; i < filhos.length; i++) {
                        percorrer(filhos[i]);
                    }
                    if (ehBlocoSeparador) {
                        partes.push(' ');
                    }
                } else if (no.nodeType === Node.TEXT_NODE) {
                    const val = no.nodeValue || '';
                    if (val) partes.push(val);
                }
            };
            percorrer(elLink);
            const brutoUmaLinha = unificarLinhasComEspacamentoAntiTruncamento(partes.join(''));
            if (brutoUmaLinha) {
                const higienizado = higienizarTextoParaCopia(brutoUmaLinha) || brutoUmaLinha;
                return unificarLinhasComEspacamentoAntiTruncamento(higienizado);
            }
            const fallbackInner = (typeof elLink.innerText === 'string' ? elLink.innerText : (elLink.textContent || ''))
                .replace(/[\r\n\t\f\v \u00A0]+/gu, ' ')
                .trim();
            if (!fallbackInner) return '';
            const higFallback = higienizarTextoParaCopia(fallbackInner) || fallbackInner;
            return unificarLinhasComEspacamentoAntiTruncamento(higFallback);
        } catch (_) {
            return unificarLinhasComEspacamentoAntiTruncamento((elLink && (elLink.innerText || elLink.textContent)) || '');
        }
    }

    /*
     * FUNCAO: isContextoDeSistemaOuUi
     * DIRETRIZ ROOT 2.17: Identifica se um elemento ou qualquer de seus ancestrais pertence
     * a telas de sistema / controles (modais, caixas de dialogo, dropdowns, menus contextuais,
     * listas de selecao tipo select/option, botoes e formulários de controle).
     */
    function isContextoDeSistemaOuUi(el) {
        if (!el) return false;
        const ctx = classificarContextoElementoAlvo(el);
        return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
    }

    function isElementoClaramenteDeInterface(el) {
        if (!el) return false;
        return classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL';
    }

    function isTelaSistemaEstritaParaDesselecao(el) {
        if (!el) return false;
        const ctx = classificarContextoElementoAlvo(el);
        return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
    }

    function normalizarModoRetirarSelecao(val) {
        const v = String(val || '').trim().toLowerCase();
        if (v === 'total' || v === 'interface' || v === 'nenhuma') return v;
        return 'total_exceto_arrasto';
    }

    /*
     * FUNCAO: deveManterSelecaoAtivaNoDom
     * DIRETRIZ ROOT 6.16 e 6.27: Regra de Retencao / Remocao da Selecao do Sistema,
     * delegando integralmente a classificacao para a base unica (classificarContextoElementoAlvo).
     */
    function deveManterSelecaoAtivaNoDom(noOuElemento, eraArrasto = false) {
        if (modoRetirarSelecao === 'nenhuma') return true;
        if (modoRetirarSelecao === 'total') return false;
        if (!noOuElemento) return true;
        const regraCustom = obterClassificacaoRegraCustomizada(noOuElemento);
        if (regraCustom) {
            const ctxRegra = mapearTipoParaContextoAlvo(regraCustom, noOuElemento);
            if (ctxRegra) {
                return (ctxRegra !== 'LINK_CLICAVEL' && ctxRegra !== 'SEMIFLEXIVEL' && ctxRegra !== 'IGNORAR');
            }
        }
        if (modoRetirarSelecao === 'total_exceto_arrasto') {
            return (eraArrasto === true);
        }
        const ctx = classificarContextoElementoAlvo(noOuElemento);
        return (ctx !== 'LINK_CLICAVEL' && ctx !== 'SEMIFLEXIVEL' && ctx !== 'IGNORAR');
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
     * FUNCAO: isElementoInterfaceDeEditorRico
     * DIRETRIZ ROOT 6.31: Delega para interface.json (interna_editores_toolbars / interna_leitura_editores_pdf),
     * excluindo nos diretamente contenteditable="true".
     */
    function isElementoInterfaceDeEditorRico(target) {
        if (!target) return false;
        const base = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
        if (!base || base.nodeType !== Node.ELEMENT_NODE) return false;
        const attrCe = (base.getAttribute && base.getAttribute('contenteditable') || '').toLowerCase();
        if (attrCe === 'true' || attrCe === 'plaintext-only') return false;
        return obterClassificacaoRegraCustomizada(base) === 'interface';
    }

    /*
     * FUNCAO: isElementoOuAncestralContentEditable
     * DIRETRIZ ROOT 6.31: Verifica se o elemento clicado, seu pai, seu avo ou qualquer ancestral
     * ate o <body> do documento (inclusive <body> com contenteditable="true" como no CKEditor do PJe)
     * possui contenteditable="true" (ou isContentEditable / designMode="on"), garantindo a excecao
     * estrita para os elementos da interface dos editores (cke_*, cke_*editor, barras de ferramentas).
     */
    function isElementoOuAncestralContentEditable(target) {
        if (!target) return false;
        try {
            const el = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

            /* Excecao obrigatoria: interface de ferramentas/chrome do editor (cke_*, cke_*editor, toolbars) */
            if (isElementoInterfaceDeEditorRico(el)) {
                return false;
            }

            const regraUsuarioEditavel = obterClassificacaoRegraCustomizada(el, true);
            if (regraUsuarioEditavel) {
                return regraUsuarioEditavel === 'editavel';
            }

            const docOwner = el.ownerDocument || document;
            let atual = el;
            let profundidade = 0;

            /* Percorre o proprio elemento, o pai, o avo e os demais ancestrais ate o <body> e <html> */
            while (atual && atual !== docOwner && profundidade < 35) {
                profundidade++;
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    const attrCe = (atual.getAttribute('contenteditable') || '').toLowerCase();
                    if (attrCe === 'false') {
                        return false;
                    }
                    if (
                        attrCe === 'true' ||
                        attrCe === 'plaintext-only' ||
                        atual.contentEditable === 'true' ||
                        atual.isContentEditable === true
                    ) {
                        return true;
                    }
                    const tagUpper = (atual.tagName || '').toUpperCase();
                    if (tagUpper === 'RICH-TEXTAREA') {
                        return true;
                    }
                    const role = (atual.getAttribute && atual.getAttribute('role')) || '';
                    if (role === 'textbox' || role === 'searchbox') {
                        if (atual.getAttribute('aria-readonly') !== 'true') return true;
                    }
                    const cls = (typeof atual.className === 'string') ? atual.className : '';
                    if (cls && /\b(cke_editable|ck-editor__editable|ck-content|mce-content-body|ql-editor|ProseMirror|editor-content-area|monaco-editor|CodeMirror)\b/i.test(cls)) {
                        if (
                            atual.isContentEditable ||
                            attrCe === 'true' ||
                            attrCe === '' ||
                            (docOwner.body && (docOwner.body.isContentEditable || (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true'))) ||
                            docOwner.designMode === 'on'
                        ) {
                            return true;
                        }
                    }
                }
                atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
            }

            if (docOwner && (
                docOwner.designMode === 'on' ||
                (docOwner.body && (
                    docOwner.body.isContentEditable === true ||
                    docOwner.body.contentEditable === 'true' ||
                    (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true')
                ))
            )) {
                return true;
            }

            return false;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: isEditorMultilinhaValido
     * OBJETIVO DE RECONSTRUCAO: Identificar de forma robusta e segura se o elemento alvo
     * ou seu container ancestral (pai, avo, etc.) e um editor de texto multilinha ativo
     * (textarea editavel ou contenteditable/CKEditor/ProseMirror/Quill), excluindo a interface
     * de ferramentas do editor (cke_*, cke_*editor).
     */
    function isEditorMultilinhaValido(target) {
        if (!target) return false;
        try {
            const el = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
            if (isElementoInterfaceDeEditorRico(el)) return false;
            const tagUpper = (el.tagName || '').toUpperCase();
            if (tagUpper === 'TEXTAREA' || tagUpper === 'RICH-TEXTAREA') {
                return !el.readOnly && !el.disabled;
            }
            if (isElementoOuAncestralContentEditable(el)) {
                return true;
            }
            if (typeof el.closest === 'function') {
                const edTextarea = el.closest('textarea, rich-textarea');
                if (edTextarea) {
                    return !edTextarea.readOnly && !edTextarea.disabled;
                }
            }
            return false;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: isBlocoVerificavel
     * DIRETRIZ REFORÇO INTERFACE: Subcategoria de Blocos Verificáveis.
     * Identifica dados estritamente verificáveis (datas, números puros com >= 1 dígito, CPF, CNPJ,
     * placas veiculares, CNIS, NB, moeda, CEP, processo CNJ/SEI, etc.).
     * Em interface sem Alt, apenas blocos verificáveis são auto-selecionáveis/copiáveis.
     */
    function isBlocoVerificavel(texto) {
        if (validadores && typeof validadores.isBlocoVerificavel === 'function') {
            return validadores.isBlocoVerificavel(texto);
        }
        return isTextoCampoEstruturadoForense(texto);
    }

    /*
     * FUNCAO: isTextoCampoEstruturadoForense
     * OBJETIVO DE RECONSTRUCAO: Identificar se o texto fornecido corresponde a um campo
     * estruturado forense conhecido (Data, Hora, Data+Hora, CPF, CNPJ, Processo CNJ,
     * Beneficio INSS / NB, Moeda, Telefone, CEP, Dispositivo Legal, etc.), isentando-o
     * da restricao de tamanho minimo em interfaces.
     */
    function isTextoCampoEstruturadoForense(texto) {
        return validadores ? validadores.isTextoCampoEstruturadoForense(texto) : false;
    }

    /*
     * FUNCAO: verificarProtecaoTamanhoMinimoInterface
     * OBJETIVO DE RECONSTRUCAO: Em textos da pagina ou elementos de interface, caso nao seja
     * um campo estruturado, evita a perda acidental do conteudo da Area de Transferencia
     * quando inexistem teclas modificadoras (clique unico, duplo ou arrasto sem combinacoes
     * das teclas Ctrl ou Alt).
     * Assim, se nao for campo estruturado (data, CPF, etc.), exige no minimo esta quantidade
     * de caracteres (minimoCaracteresInterface: 0, 1, 2, 3, 4, 5, 10; padrao = 5) para
     * confirmar a copia e o contorno, medidos apos filtrar e eliminar espacos em branco.
     */
    function verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minimoCustomizado = null) {
        const minEfetivo = (typeof minimoCustomizado === 'number') ? minimoCustomizado : minimoCaracteresInterface;
        return validadores ? validadores.verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minEfetivo) : true;
    }

    /*
     * FUNCAO: isElementoEmCampoEditavel
     * Blindagem universal de 7 camadas para deteccao de campos editaveis (inputs, textareas,
     * rich-textarea, contenteditable, role="textbox", role="searchbox", editores Quill/Gemini,
     * ProseMirror, Monaco, CKEditor, etc.).
     */
    function isElementoEmCampoEditavel(node) {
        if (!node) return false;
        try {
            let el = (node.nodeType === Node.TEXT_NODE) ? node.parentElement : node;
            if (!el) return false;
            if (el.nodeType !== Node.ELEMENT_NODE) {
                if (el.parentElement) el = el.parentElement;
                else return false;
            }

            const regraUsuarioEditavel = obterClassificacaoRegraCustomizada(el, true);
            if (regraUsuarioEditavel) {
                return regraUsuarioEditavel === 'editavel';
            }

            const docOwner = el.ownerDocument || document;

            // 1. Verificacao de tag direta
            const tagDireta = (el.tagName || '').toUpperCase();
            if (tagDireta === 'TEXTAREA' || tagDireta === 'RICH-TEXTAREA') {
                return (!el.readOnly && !el.disabled);
            }
            if (tagDireta === 'INPUT') {
                const tipoInput = (el.getAttribute && el.getAttribute('type') || el.type || 'text').toLowerCase();
                const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                if (!tiposNaoTexto.includes(tipoInput) && !el.readOnly && !el.disabled) {
                    return true;
                }
                return false;
            }

            // Excecao: barras de ferramentas / interface de controle de editores
            const attrCeProprio = (el.getAttribute && el.getAttribute('contenteditable') || '').toLowerCase();
            const ehEditorDireto = el.isContentEditable || attrCeProprio === 'true' || attrCeProprio === 'plaintext-only' || (attrCeProprio === '' && el.hasAttribute && el.hasAttribute('contenteditable'));
            if (!ehEditorDireto && isElementoInterfaceDeEditorRico(el)) {
                return false;
            }

            // Regras internas (interface.json) ou regras manuais marcadas explicitamente como 'editavel'
            if (attrCeProprio !== 'false' && (!el.getAttribute || el.getAttribute('aria-readonly') !== 'true') && !el.readOnly && !el.disabled) {
                if (obterClassificacaoRegraCustomizada(el) === 'editavel') {
                    return true;
                }
            }

            // 2. Seletor de correspondencia direta ou ancestral (closest)
            const seletorEditavel = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]):not([type="range"]):not([type="color"]):not([type="hidden"]), textarea, rich-textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]:not([aria-readonly="true"]), [role="searchbox"]:not([aria-readonly="true"]), [data-slate-editor], [data-lexical-editor]';
            if (typeof el.closest === 'function') {
                if ((typeof el.matches === 'function' && el.matches(seletorEditavel)) || el.closest(seletorEditavel)) {
                    return true;
                }
            }

            // 3. Propriedade nativa do navegador
            if (el.isContentEditable || el.contentEditable === 'true' || el.contentEditable === 'plaintext-only') {
                return true;
            }

            // 4. Inspecao na arvore ascendente ate docOwner
            let atual = el;
            let profundidade = 0;
            while (atual && atual !== docOwner && profundidade < 35) {
                profundidade++;
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    if (atual.isContentEditable || atual.contentEditable === 'true' || atual.contentEditable === 'plaintext-only') {
                        return true;
                    }
                    const attrCe = (atual.getAttribute && atual.getAttribute('contenteditable') || '').toLowerCase();
                    if (attrCe === 'true' || attrCe === 'plaintext-only' || (attrCe === '' && atual.hasAttribute && atual.hasAttribute('contenteditable'))) {
                        return true;
                    }
                    const role = atual.getAttribute && atual.getAttribute('role');
                    if (role === 'textbox' || role === 'searchbox') {
                        if (atual.getAttribute('aria-readonly') !== 'true') return true;
                    }
                    const tag = (atual.tagName || '').toUpperCase();
                    if (tag === 'TEXTAREA' || tag === 'RICH-TEXTAREA') {
                        return (!atual.readOnly && !atual.disabled);
                    }
                    if (tag === 'INPUT') {
                        const tipo = (atual.getAttribute('type') || atual.type || 'text').toLowerCase();
                        const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                        if (!tiposNaoTexto.includes(tipo) && !atual.readOnly && !atual.disabled) return true;
                    }
                    if (atual.classList && (
                        atual.classList.contains('ql-editor') ||
                        atual.classList.contains('ProseMirror') ||
                        atual.classList.contains('cke_editable') ||
                        atual.classList.contains('ck-editor__editable') ||
                        atual.classList.contains('ck-content') ||
                        atual.classList.contains('monaco-editor') ||
                        atual.classList.contains('CodeMirror') ||
                        atual.classList.contains('mce-content-body')
                    )) {
                        if (
                            atual.isContentEditable ||
                            attrCe === 'true' ||
                            attrCe === 'plaintext-only' ||
                            (atual.hasAttribute && atual.hasAttribute('contenteditable') && attrCe !== 'false') ||
                            (docOwner.body && (docOwner.body.isContentEditable || (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true'))) ||
                            docOwner.designMode === 'on'
                        ) {
                            return true;
                        }
                    }
                }
                atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
            }

            // 5. Inspecao de wrapper de editor que contem o activeElement
            if (docOwner && docOwner.activeElement && docOwner.activeElement !== docOwner.body && docOwner.activeElement !== docOwner.documentElement) {
                const ativo = docOwner.activeElement;
                if (el === ativo || (el.contains && el.contains(ativo))) {
                    const tagAtivo = (ativo.tagName || '').toUpperCase();
                    if (tagAtivo === 'TEXTAREA' || tagAtivo === 'RICH-TEXTAREA') return true;
                    if (tagAtivo === 'INPUT') {
                        const tipo = (ativo.getAttribute('type') || ativo.type || 'text').toLowerCase();
                        const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                        if (!tiposNaoTexto.includes(tipo)) return true;
                    }
                    if (ativo.isContentEditable || ativo.contentEditable === 'true') return true;
                    if (ativo.getAttribute && (ativo.getAttribute('role') === 'textbox' || ativo.getAttribute('role') === 'searchbox')) return true;
                    if (typeof ativo.closest === 'function' && ativo.closest('[contenteditable]:not([contenteditable="false"]), .ql-editor, .ProseMirror, rich-textarea')) return true;
                }
            }

            return false;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: isSelecaoOuElementoEmCampoEditavel
     * Verifica com precisao cirurgica se o alvo (Node, Element, Range, Selection ou foco ativo)
     * esta dentro ou associado a um campo editavel.
     */
    function isSelecaoOuElementoEmCampoEditavel(alvo) {
        if (!alvo) {
            if (typeof document !== 'undefined' && document.activeElement) {
                const ativo = document.activeElement;
                if (ativo && ativo !== document.body && ativo !== document.documentElement) {
                    return isElementoEmCampoEditavel(ativo);
                }
            }
            return false;
        }

        // Se for Selection
        if (typeof alvo.rangeCount === 'number') {
            if (alvo.rangeCount === 0) return false;
            try {
                return isSelecaoOuElementoEmCampoEditavel(alvo.getRangeAt(0));
            } catch (_) {
                return false;
            }
        }

        // Se for Range
        if (typeof alvo.commonAncestorContainer !== 'undefined') {
            if (isElementoEmCampoEditavel(alvo.commonAncestorContainer)) return true;
            if (alvo.startContainer && isElementoEmCampoEditavel(alvo.startContainer)) return true;
            if (alvo.endContainer && isElementoEmCampoEditavel(alvo.endContainer)) return true;
            if (typeof document !== 'undefined' && document.activeElement) {
                const ativo = document.activeElement;
                if (ativo && ativo !== document.body && ativo !== document.documentElement && isElementoEmCampoEditavel(ativo)) {
                    try {
                        const anc = alvo.commonAncestorContainer;
                        if (anc === ativo || (ativo.contains && ativo.contains(anc)) || (anc && anc.contains && anc.contains(ativo))) {
                            return true;
                        }
                    } catch (_) { }
                }
            }
            return false;
        }

        // Se for nó/elemento
        if (isElementoEmCampoEditavel(alvo)) return true;

        // Checagem complementar em document.activeElement
        if (typeof document !== 'undefined' && document.activeElement) {
            const ativo = document.activeElement;
            if (ativo && ativo !== document.body && ativo !== document.documentElement && isElementoEmCampoEditavel(ativo)) {
                try {
                    if (alvo === ativo || (ativo.contains && ativo.contains(alvo)) || (alvo.contains && alvo.contains(ativo))) {
                        return true;
                    }
                } catch (_) { }
            }
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
    function mapearTipoParaContextoAlvo(tipoRegra, alvoEl) {
        if (tipoRegra === 'ignorar') return 'IGNORAR';
        if (tipoRegra === 'interface') return 'LINK_CLICAVEL';
        if (tipoRegra === 'semiflexivel') return 'SEMIFLEXIVEL';
        if (tipoRegra === 'textual') return 'LEITURA_COMUM';
        if (tipoRegra === 'editavel') {
            const tag = (alvoEl && alvoEl.tagName) ? alvoEl.tagName.toUpperCase() : '';
            if (tag === 'INPUT') {
                const tipoInput = (alvoEl.getAttribute('type') || alvoEl.type || 'text').toLowerCase();
                const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                if (!tiposNaoTexto.includes(tipoInput) && !alvoEl.readOnly && !alvoEl.disabled) {
                    return 'CAMPO_SIMPLES_EDITAVEL';
                }
            }
            return 'EDITOR_MULTILINHA_EDITAVEL';
        }
        return null;
    }

    function classificarContextoElementoAlvo(el) {
        if (!el) return 'IGNORAR';

        /* Passo 2.3: Verifica se pertence ao proprio addon (IGNORAR) */
        const atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
        if (atual && typeof atual.closest === 'function' && atual.closest('[data-jusgov-ignore]')) {
            return 'IGNORAR';
        }

        /* Passo 2.4: Prioridade soberana das regras salvas no Mapeamento Manual Avancado (XPath / CSS) */
        const regraUsuario = atual ? obterClassificacaoRegraCustomizada(atual, true) : null;
        if (regraUsuario) {
            const ctxUsuario = mapearTipoParaContextoAlvo(regraUsuario, atual);
            if (ctxUsuario) return ctxUsuario;
        }

        /* Seletor de pagina do PDF (<viewer-page-selector> / input#pageSelector): CAMPO_SIMPLES_EDITAVEL */
        if (atual) {
            const ehInputSeletorPaginaPdf = (atual.tagName === 'INPUT' && (
                atual.id === 'pageSelector' ||
                atual.getAttribute('aria-label') === 'Número da página' ||
                (typeof atual.closest === 'function' && atual.closest('viewer-page-selector'))
            ));
            if (ehInputSeletorPaginaPdf) {
                return 'CAMPO_SIMPLES_EDITAVEL';
            }
        }

        /* Barras de ferramentas de editores ricos nunca sao editaveis (delegado a interface.json) */
        if (atual && isElementoInterfaceDeEditorRico(atual)) {
            return 'LINK_CLICAVEL';
        }

        /* Verificacao Universal de Campos Editaveis via isElementoEmCampoEditavel */
        if (atual && isElementoEmCampoEditavel(atual)) {
            return mapearTipoParaContextoAlvo('editavel', atual);
        }

        const docOwner = (atual && atual.ownerDocument) ? atual.ownerDocument : document;
        if (docOwner && docOwner.body && (
            docOwner.body.isContentEditable ||
            docOwner.body.contentEditable === 'true' ||
            (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true') ||
            docOwner.designMode === 'on'
        )) {
            return 'EDITOR_MULTILINHA_EDITAVEL';
        }

        /* Classificacao unificada pela cascata central: 0 Texto -> 1 Mouse -> 2 Eventos JS -> 3 Heuristicas -> 4 Regras */
        const tipoCascata = resolverTipoElementoPorPrioridade(el);
        return mapearTipoParaContextoAlvo(tipoCascata, atual) || 'LEITURA_COMUM';
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
        } catch (_) { }
    }

    function isContainerComposto(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
        const tag = (el.tagName || '').toUpperCase();
        if (['BODY', 'HTML', 'MAIN', 'ARTICLE', 'SECTION', 'TABLE', 'TBODY', 'THEAD', 'TR', 'UL', 'OL', 'FORM', 'FIELDSET', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'P', 'PRE', 'BLOCKQUOTE'].includes(tag)) {
            return true;
        }
        const cls = (typeof el.className === 'string') ? el.className.toLowerCase() : '';
        if (cls && (
            cls.includes('card') ||
            cls.includes('tarefa') ||
            cls.includes('timeline') ||
            cls.includes('pje-task') ||
            cls.includes('panel') ||
            cls.includes('row') ||
            cls.includes('container') ||
            cls.includes('list-group') ||
            cls.includes('col-') ||
            cls.includes('dtpolo') ||
            cls.includes('polo')
        )) {
            return true;
        }
        if (el.querySelector('table, tr, td, p, h1, h2, h3, h4, h5, h6, [class*="card"], [class*="tarefa"], [class*="timeline"], [class*="row"], [class*="col-"], [class*="dtPolo"], [class*="polo"]')) {
            return true;
        }
        // Descarta botoes/icones de exclusao de tags para nao contar indevidamente como multiplos controles
        const controles = Array.from(el.querySelectorAll('button, a, input, select, [role="button"], [class*="label-etiqueta"], [class*="badge"], [class*="chip"]'))
            .filter(c => !c.closest('[class*="desvincular"], [class*="icon-desvincular"], [class*="close"], [class*="remove"], [class*="delete"], [class*="excluir"], [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], .fa-times, .fa-close, .fa-remove, mat-icon'));
        if (controles.length > 1) {
            return true;
        }
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt.length > 120) {
            return true;
        }
        return false;
    }

    function obterObjetoInterativoParaSelecaoCompleta(alvo) {
        /* Passo 4.0.0: Identificar se o alvo clicado com Alt pertence a um controle de acao/interface
         * (etiqueta/badge/chip [sem botoes de remocao irmaos], botao, link, aba, switch, menu, option)
         * para que Alt + Clique selecione e copie o texto do objeto com Flash Verde.
         * DIRETRIZ RESTRICAO DE CONTAINER: Jamais sobe para capturar containers inteiros (cards, linhas
         * de tarefa, paineis). Se nao for controle pontual de interface, retorna null para que
         * Alt + Clique selecione exclusivamente a palavra sob o cursor! */
        if (!alvo) return null;
        const elBase = alvo.nodeType === Node.ELEMENT_NODE ? alvo : alvo.parentElement;
        if (!elBase || typeof elBase.closest !== 'function') return null;

        // 1. Caso Especial: Etiquetas, Badges, Chips, Tags com botoes irmaos de acao/desvinculacao
        const SELETOR_ETIQUETA_OU_BADGE = [
            '[class*="label-etiqueta"]', '[class*="label-info"]', '[class*="label-warning"]',
            '[class*="label-success"]', '[class*="label-danger"]', '[class*="label-primary"]',
            '[class*="label-default"]', '[class*="label-secondary"]', '[class*="badge"]',
            '[class*="chip"]', '[class*="tag"]', '[class*="pill"]', '[pmr-cor-padrao-etiqueta]',
            '[class*="etiqueta"]', '.label'
        ].join(', ');

        const SELETOR_BOTAO_EXCLUSAO_ETIQUETA = [
            '[class*="desvincular"]', '[class*="icon-desvincular"]', '[class*="close"]',
            '[class*="remove"]', '[class*="delete"]', '[class*="excluir"]',
            '[title*="Excluir"]', '[title*="Remover"]', '[title*="Desvincular"]',
            '.fa-times', '.fa-close', '.fa-remove', 'mat-icon'
        ].join(', ');

        const containerEtiqueta = elBase.closest(SELETOR_ETIQUETA_OU_BADGE);
        if (containerEtiqueta) {
            // Se o clique incidiu no botao de excluir/desvincular a tag, ignora para permitir acao nativa
            if (elBase.closest(SELETOR_BOTAO_EXCLUSAO_ETIQUETA)) {
                return null;
            }
            // Se o elemento clicado for um span/texto interno da etiqueta:
            if (elBase !== containerEtiqueta && (elBase.tagName === 'SPAN' || elBase.tagName === 'B' || elBase.tagName === 'STRONG' || elBase.tagName === 'EM')) {
                return elBase;
            }
            // Se o usuario clicou no containerEtiqueta diretamente, localiza o span de texto excluindo botoes de remocao
            const spans = Array.from(containerEtiqueta.querySelectorAll('span, b, strong, em'));
            const spanTexto = spans.find(sp => {
                return !sp.closest(SELETOR_BOTAO_EXCLUSAO_ETIQUETA) && (sp.innerText || sp.textContent || '').trim().length > 0;
            });
            if (spanTexto) {
                return spanTexto;
            }
            if (!isContainerComposto(containerEtiqueta)) {
                return containerEtiqueta;
            }
        }

        // 2. Controles Semanticos Reais (Labels, Botoes, Links, Abas, Switches, Menus, Selects/Options)
        const elSemantico = elBase.closest(
            'label, a[href], a, button, input[type="button"], input[type="submit"], input[type="reset"], summary, option, select, [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="option"], [role="switch"], [role="link"], [role="treeitem"], [role="combobox"], [aria-haspopup], [aria-expanded], [class*="menu-item"], [class*="menuitem"], [class*="dropdown-item"], [class*="ui-selectonemenu-item"], [class*="select2-results__option"], li'
        );
        if (elSemantico) {
            // Rejeita containers compostos falsos (ex: <a> ou [role="button"] que envelopa um card inteiro)
            if (!isContainerComposto(elSemantico)) {
                if (elSemantico.tagName === 'LI') {
                    const parenteLista = elSemantico.closest('[role="listbox"], [role="menu"], ul, ol');
                    const ehItemInterativo = parenteLista && (
                        isElementoInterativoOuUi(parenteLista) ||
                        (elSemantico.className && (elSemantico.className.includes('item') || elSemantico.className.includes('option')))
                    );
                    if (ehItemInterativo) {
                        return elSemantico;
                    }
                } else {
                    return elSemantico;
                }
            }
        }

        // 3. Controles Customizados Estritos (div ou span com acao explicita ou role de botao)
        // Profundidade restrita a no maximo 1 nivel acima para JAMAIS capturar cards, linhas ou paineis!
        let atual = elBase;
        let profundidade = 0;
        while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 2) {
            profundidade++;
            if (!isContainerComposto(atual)) {
                const tagUpper = (atual.tagName || '').toUpperCase();
                if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE'].includes(tagUpper)) {
                    break;
                }
                const cls = (typeof atual.className === 'string') ? atual.className.toLowerCase() : '';
                const temClasseBotao = cls && (
                    /\bbtn\b/.test(cls) || /\bbutton\b/.test(cls) || cls.includes('btn-') ||
                    cls.includes('ui-button') || cls.includes('mat-button') || cls.includes('toolbarbutton')
                );
                const temAcaoExplicita = atual.hasAttribute('onclick') || atual.hasAttribute('jsaction') ||
                    atual.hasAttribute('data-action') || atual.hasAttribute('ng-click');

                if (temClasseBotao || temAcaoExplicita) {
                    try {
                        const st = window.getComputedStyle(atual);
                        if (st && st.cursor === 'pointer') {
                            const txt = (atual.innerText || atual.textContent || '').trim();
                            if (txt.length > 0 && txt.length <= 60 && !txt.includes('\n')) {
                                return atual;
                            }
                        }
                    } catch (_) { }
                }
            }
            atual = atual.parentElement;
        }

        return null;
    }
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
    function aplicarLimpezaNumericaComTravaAlfabetica(textoBruto) {
        if (typeof textoBruto !== 'string') return null;
        const textoTrim = textoBruto.trim();
        if (!textoTrim) return null;

        /* Caso especial: CNPJ Alfanumérico isolado (12 alfanuméricos + 2 dígitos verificadores) */
        if (REGEX_AUDITORIA && REGEX_AUDITORIA.CNPJ_ISOLADO && REGEX_AUDITORIA.CNPJ_ISOLADO.test(textoTrim)) {
            const cnpjLimpo = textoTrim.toUpperCase().replace(/[^0-9A-Z]/g, '');
            return cnpjLimpo.length > 0 ? cnpjLimpo : null;
        }

        /* Caso especial: Benefício INSS com prefixo de espécie (ex: "42/123.456.789-0") */
        const matchInssComEsp = textoTrim.match(/^(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
        if (matchInssComEsp) {
            const nbLimpo = matchInssComEsp[2].replace(/\D+/g, '');
            return nbLimpo.length > 0 ? nbLimpo : null;
        }

        /* Remove espaços, pontuação Unicode e símbolos matemáticos/moedas */
        const semPontuacaoESimbolos = textoTrim.replace(/[\s\u00A0\p{P}\p{S}]+/gu, '');
        if (!semPontuacaoESimbolos) return null;

        /* Trava Alfabética Estrita: Se restar qualquer letra após remover símbolos/pontuação,
         * aborta a limpeza numérica (retorna null para copiar o texto original intacto). */
        if (/[\p{L}]/u.test(semPontuacaoESimbolos)) {
            return null;
        }

        if (!/^\d+$/.test(semPontuacaoESimbolos)) {
            return null;
        }

        let digitosPuros = semPontuacaoESimbolos;
        if (EXPRESSOES_REGULARES && EXPRESSOES_REGULARES.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL) {
            const matchCnj = textoTrim.match(EXPRESSOES_REGULARES.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL);
            if (matchCnj && matchCnj[0] === textoTrim && modoShiftCnj !== 'semZeros') {
                const seqPreenchida = matchCnj[1].padStart(7, '0');
                digitosPuros = seqPreenchida + digitosPuros.substring(matchCnj[1].length);
            }
        }

        return digitosPuros;
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
            if (REGEX_AUDITORIA.BENEFICIO_INSS_COM_ESPECIE && REGEX_AUDITORIA.BENEFICIO_INSS_COM_ESPECIE.test(textoTrim)) return true;
            if (REGEX_AUDITORIA.BENEFICIO_INSS_ISOLADO && REGEX_AUDITORIA.BENEFICIO_INSS_ISOLADO.test(textoTrim)) return true;
        }

        /* Passo 5.2.6: Regra 4 - Sequencias de numeros espacados genericos (ex: boletos, senhas ou codigos com espacos) */
        if (typeof EXPRESSOES_REGULARES !== 'undefined' && EXPRESSOES_REGULARES.MULTIPLOS_NUMEROS_ESPACADOS) {
            const mEspacado = textoTrim.match(EXPRESSOES_REGULARES.MULTIPLOS_NUMEROS_ESPACADOS);
            if (mEspacado && mEspacado[0] === textoTrim) return true;
        }

        return false;
    }

    /*
     * FUNCAO: salvarClipboardInternoComBackup
     * OBJETIVO DE RECONSTRUCAO: Ao gravar uma nova selecao no clipboard simulado interno do addon,
     * preserva o valor anterior em window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ (usado em Ctrl + Botao do Meio)
     * e atualiza window.__JUSGOV_ULTIMO_CLIPBOARD__ (usado no Botao do Meio simples), tudo protegido com try/catch
     * e verificadores de overflow (Seção 6.104 / BLIND-01).
     * Se houver estouro de memória ou erro, deixa a posição nula/vazia e retorna false sem lançar erro.
     */
    /**
     * @MAPA-IA-VAR: Gestão de Estado de Clipboard Interno em 2 Slots
     * @MAPA-IA-FN: salvarClipboardInternoComBackup
     */
    function salvarClipboardInternoComBackup(novoPayload) {
        try {
            if (!novoPayload || typeof novoPayload !== 'object') return false;
            const LIMITE_BYTES_EMULACAO = 512 * 1024;
            const txt = typeof novoPayload.texto === 'string' ? novoPayload.texto : '';
            const html = typeof novoPayload.html === 'string' ? novoPayload.html : '';

            /* BLIND-01 (Seção 6.104): Verificação defensiva de estouro/overflow de payload */
            if (txt.length > LIMITE_BYTES_EMULACAO || html.length > LIMITE_BYTES_EMULACAO) {
                if (Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = null;
                }
                window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
                return false;
            }

            const txtSeguro = txt;
            const htmlSeguro = html;

            const atual = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const textoAtualLimpo = (atual && typeof atual.texto === 'string') ? atual.texto.trim() : '';
            const novoTextoLimpo = txtSeguro.trim();
            const ehConteudoIdenticoAoAtual = Boolean(textoAtualLimpo && novoTextoLimpo && textoAtualLimpo === novoTextoLimpo);

            /* Inicialização defensiva do Histórico de 2 Níveis (USAB-11 / USAB-19 — Seções 6.110 e 6.120) */
            if (!Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
                if (atual && (atual.texto || atual.html)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__.push({
                        texto: atual.texto || '',
                        html: atual.html || '',
                        formatado: Boolean(atual.formatado),
                        timestamp: Date.now()
                    });
                }
            }

            /* BUG-17 (Seção 6.73) & USAB-11/19 (Seções 6.110/6.120): Se o novo payload for textualmente idêntico ao que já reside no Slot 1 (atual),
             * a operação é idempotente em relação à pilha de histórico: NÃO desloca nem sobrescreve o Slot 2 (ANTERIOR__),
             * preservando a penúltima seleção intacta para ser colada com Ctrl + Botão do Meio. */
            const preservarHistorico = Boolean(novoPayload.preservarHistorico);
            if (!ehConteudoIdenticoAoAtual && !preservarHistorico) {
                if (atual && (atual.texto || atual.html)) {
                    window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = {
                        texto: atual.texto || '',
                        html: atual.html || '',
                        formatado: Boolean(atual.formatado)
                    };
                }
                window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift({
                    texto: txtSeguro,
                    html: htmlSeguro,
                    formatado: Boolean(novoPayload.formatado),
                    timestamp: Date.now()
                });
                if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                }
            } else if (preservarHistorico && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = {
                    texto: txtSeguro,
                    html: htmlSeguro,
                    formatado: Boolean(novoPayload.formatado),
                    timestamp: Date.now()
                };
            }

            window.__JUSGOV_ULTIMO_CLIPBOARD__ = {
                texto: txtSeguro,
                html: htmlSeguro,
                formatado: Boolean(novoPayload.formatado)
            };
            registrarUltimaSelecao(window.__JUSGOV_ULTIMO_CLIPBOARD__, window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__, window.__JUSGOV_HISTORICO_CLIPBOARD__);
            return true;
        } catch (erroOverflow) {
            /* BLIND-01 (Seção 6.104): Em caso de estouro ou falha em memória, deixa nula a posição e retorna false sem lançar erro */
            try {
                if (Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = null;
                }
            } catch (_) { }
            return false;
        }
    }

    async function gravarNaAreaDeTransferencia(textoFinal, rangeDOMOpcional = null, opcoesGravacao = {}) {
        /* Passo 5.3: Gravacao com suporte a formatos basicos, avancados ou sem filtro.
         * BLIND-01 (Seção 6.104): PRIMEIRO copia interno; somente se der certo internamente copia para o sistema operacional.
         * Se falhar internamente por estouro ou erro, NÃO copia para o sistema. */
        if (!textoFinal || typeof textoFinal !== 'string') return false;
        const preservarHistorico = Boolean(opcoesGravacao && opcoesGravacao.preservarHistorico);

        let deveManterFormatacao = Boolean(manterFormatacaoBasica && rangeDOMOpcional);
        const nivelNorm = normalizarNivelFiltro(nivelFiltroFormatacao);
        if (nivelNorm === 'texto_puro') {
            deveManterFormatacao = false;
        }
        if (deveManterFormatacao && verificarSeTextoEhBlocoOuPalavraUnica(textoFinal)) {
            /* Regra de Ouro: Bloco forense ou palavra unica e sempre somente texto puro */
            deveManterFormatacao = false;
        }

        /* DIRETRIZ AUDITORIA AUTOMATIZADA: Durante a execucao da suite de testes de auditoria,
         * preserva a integridade do clipboard real do usuario no Windows e previne violacoes de
         * Permissions Policy do Chromium (crbug.com/414348233) decorrentes de disparos sinteticos sem ativacao. */
        if (typeof window !== 'undefined' && window.__JUSGOV_AUDITORIA_EM_CURSO__) {
            const okInterno = salvarClipboardInternoComBackup({ texto: textoFinal, html: '', formatado: false, preservarHistorico });
            return Boolean(okInterno);
        }

        if (deveManterFormatacao) {
            /* Passo 5.3.1: Aplicar o filtro correspondente ao nivel ativo na arquitetura progressiva */
            const codigoHTML = aplicarFiltroHtmlPorNivel(rangeDOMOpcional, nivelNorm);

            if (codigoHTML) {
                const htmlParaClipboard = envolverHtmlComResetDeCursorParaWord(codigoHTML);
                const textoPlanoMultilinha = extrairTextoPuroSanitizado(codigoHTML) || textoFinal;

                /* BLIND-01 (Seção 6.104): Gravação interna PRIMEIRO */
                const salvouInterno = salvarClipboardInternoComBackup({ texto: textoPlanoMultilinha, html: htmlParaClipboard, formatado: true, preservarHistorico });
                if (!salvouInterno) {
                    return false;
                }

                try {
                    const temFocoParaClip = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
                    if (temFocoParaClip && typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                        const blobHtml = new Blob([htmlParaClipboard], { type: 'text/html' });
                        const blobTexto = new Blob([textoPlanoMultilinha], { type: 'text/plain' });
                        const dadosParaCopiar = new ClipboardItem({
                            'text/html': blobHtml,
                            'text/plain': blobTexto
                        });
                        await navigator.clipboard.write([dadosParaCopiar]);
                        console.log('Texto formatado copiado! HTML:', htmlParaClipboard);
                        return true;
                    }
                } catch (err) {
                    /* Restricao assincrona de I/O ou Permissions Policy no documento/iframe; prossegue para fallback */
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
                        return true;
                    }
                } catch (errCopy) {
                    /* Fallback copy HTML protegido com try/catch */
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
        textoPuroFinal = (textoPuroFinal || '').replace(/[ ]{2,}/g, ' ').trim();

        /* BLIND-01 (Seção 6.104): Gravação interna PRIMEIRO. Se falhar, não copia para o sistema */
        const salvouInternoTexto = salvarClipboardInternoComBackup({ texto: textoPuroFinal, html: '', formatado: false, preservarHistorico });
        if (!salvouInternoTexto) {
            return false;
        }

        let gravouSistema = false;
        try {
            const temFocoParaTexto = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
            if (temFocoParaTexto && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(textoPuroFinal);
                gravouSistema = true;
            }
        } catch (errTxt) {
            /* Restricao de Permissions Policy ou foco de janela no iframe; fallback para textarea + execCommand */
        }

        if (!gravouSistema) {
            try {
                const areaTemp = document.createElement('textarea');
                areaTemp.setAttribute('data-jusgov-ignore', 'true');
                areaTemp.value = textoPuroFinal;
                areaTemp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
                document.body.appendChild(areaTemp);
                areaTemp.select();
                gravouSistema = Boolean(document.execCommand('copy'));
                document.body.removeChild(areaTemp);
            } catch (errArea) {
                /* Fallback textarea protegido com try/catch */
            }
        }

        /* Retorna true garantindo continuidade e fluidez visual ao usuario mesmo em documentos com Permissions Policy restritiva */
        return true;
    }

    /*
     * FUNCAO: registrarUltimaSelecao
     * OBJETIVO DE RECONSTRUCAO: Persistir a "Ultima Selecao" (conteudo exato, TXT e/ou HTML, enviado por este
     * addon a area de transferencia no momento da copia) e o item anterior para colagem simulada.
     */
    function registrarUltimaSelecao(novoItem, itemAnteriorOpcional, historicoOpcional = null) {
        if (!novoItem || (!novoItem.texto && !novoItem.html)) return;
        try {
            const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
            if (storageLocal) {
                const historicoParaSalvar = Array.isArray(historicoOpcional)
                    ? historicoOpcional
                    : ((typeof window !== 'undefined' && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) ? window.__JUSGOV_HISTORICO_CLIPBOARD__ : []);
                const payloadStorage = {
                    ultimoClipboardInterno: {
                        texto: novoItem.texto || '',
                        html: novoItem.html || '',
                        formatado: Boolean(novoItem.formatado),
                        timestamp: Date.now()
                    },
                    historicoClipboardInterno: historicoParaSalvar
                };
                if (itemAnteriorOpcional && (itemAnteriorOpcional.texto || itemAnteriorOpcional.html)) {
                    payloadStorage.ultimoClipboardAnteriorInterno = {
                        texto: itemAnteriorOpcional.texto || '',
                        html: itemAnteriorOpcional.html || '',
                        formatado: Boolean(itemAnteriorOpcional.formatado),
                        timestamp: Date.now()
                    };
                }
                storageLocal.set(payloadStorage);
            }
        } catch (_) { }
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
                try { alvo.focus(); } catch (_) { }
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
            } catch (_) { }

            // 3. Se o editor nao tratou por conta propria, aciona execCommand de insercao
            if (!pasteTratadoPeloEditor) {
                let colouExec = false;
                try {
                    colouExec = document.execCommand('paste');
                } catch (_) { }
                if (!colouExec) {
                    if (html && ehEditorRico) {
                        try {
                            colouExec = document.execCommand('insertHTML', false, html);
                        } catch (_) { }
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
                try { el.focus(); } catch (_) { }
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
        } catch (_) { }
    }

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
        if (duracaoMs === 0 || !rangeAlvo) return;
        limparFlashBorderImediatamente();
        const cor = corCustomHex || corFlashBorder;
        if (visual) {
            visual.dispararFlashBorderVisual(rangeAlvo, duracaoMs, cor);
        }
        if (duracaoMs !== -1) {
            timerFlashBorder = setTimeout(() => {
                limparFlashBorderImediatamente();
            }, duracaoMs);
        }
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
        } catch (_) { }
    }

    /*
     * FUNCAO: aplicarSelecaoDOM
     * DIRETRIZ ROOT 6.16 (Modulo de Selecao Autonoma):
     * Aplica o Range na Selection API do navegador, aciona o contorno visual rapido
     * do Flash Verde temporizado (se ativo) e aplica a Regra de Retencao da Selecao do Sistema:
     * - Se o elemento for de leitura/texto judicial ou documento PDF aberto no Chrome
     *   (excluindo barras de ferramentas e controles do PDF): MANTEM a selecao ativa no sistema.
     * - Se for elemento de interface grafica/controle/modal estrito: REMOVE imediatamente a selecao
     *   do sistema (window.getSelection().removeAllRanges()) quando solicitado ou ao finalizar a acao.
     */
    function aplicarSelecaoDOM(rangeAlvo, opcoes = {}) {
        if (!rangeAlvo) return { ok: false, manterSelecao: true };
        const noContexto = opcoes.noContexto || rangeAlvo.commonAncestorContainer || null;
        const eraArrasto = Boolean(opcoes.eraArrasto);
        const manterSelecao = (opcoes.forcarDesselecao === true && modoRetirarSelecao !== 'nenhuma' && (modoRetirarSelecao !== 'total_exceto_arrasto' || !eraArrasto))
            ? false
            : ((opcoes.forcarManterSelecao === true && modoRetirarSelecao !== 'total' && (modoRetirarSelecao !== 'total_exceto_arrasto' || eraArrasto))
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

        if (opcoes.dispararFlash !== false) {
            if (tempoFlashBorderMs !== 0) {
                if (!manterSelecao) {
                    flashExclusivoSemSelecao = true;
                }
                dispararFlashBorderVisual(rangeAlvo);
            } else {
                limparFlashBorderImediatamente();
            }
        }

        if (!manterSelecao && opcoes.limparImediatamente === true) {
            try {
                const selLimpar = window.getSelection();
                if (selLimpar) selLimpar.removeAllRanges();
                flashExclusivoSemSelecao = (tempoFlashBorderMs !== 0);
            } catch (_) { }
        }

        return { ok: true, manterSelecao, manterSelecaoNoDom: manterSelecao };
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
        if (!rangeAlvo && textoSobrescrito === null) return false;

        let textoOriginalRange = '';
        if (rangeAlvo) {
            textoOriginalRange = extrairTextoPuroSanitizado(rangeAlvo);
            if (!textoOriginalRange) {
                textoOriginalRange = higienizarTextoParaCopia(rangeAlvo.toString());
            }
        }

        let textoLimpo = '';
        if (textoSobrescrito !== null) {
            textoLimpo = higienizarTextoParaCopia(textoSobrescrito);
            if (opcoesCopia && opcoesCopia.forcarUmaLinha) {
                textoLimpo = unificarLinhasComEspacamentoAntiTruncamento(textoLimpo);
            }
        } else {
            textoLimpo = textoOriginalRange;
        }
        if (!textoLimpo || textoLimpo.length === 0) return false;

        /* Seção 6.140 / BUG-57: Padronizar separador de datas numéricas copiadas para '/' (ex: 11-12-1992 -> 11/12/1992) */
        const matchDataSep = textoLimpo.match(/^(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{2,4})((?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
        if (matchDataSep) {
            textoLimpo = `${matchDataSep[1]}/${matchDataSep[2]}/${matchDataSep[3]}${matchDataSep[4] || ''}`;
        }

        if (modoAcumulador && acumulador) {
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
                if (validador && rangeAlvo) {
                    const textoParaAuditoria = (textoOriginalRange && textoOriginalRange.trim().length > 0)
                        ? textoOriginalRange.trim()
                        : textoLimpo;
                    const check = validacaoMatematicaAtiva
                        ? validador.auditarEAlerta(textoParaAuditoria, rangeAlvo, {
                            textoSobrescrito: (textoSobrescrito !== null) ? textoLimpo : null
                        })
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
            return true;
        }

        if (acumulador) acumulador.limpar();
        ultimoTextoSelecionadoLimpo = textoLimpo;
        ultimoRangeSelecionadoSimples = (rangeAlvo && typeof rangeAlvo.cloneRange === 'function') ? rangeAlvo.cloneRange() : null;

        /* FEAT-21 / VIS-01 (Seção 6.105): Registra a cópia candidata na classe FeedbackVisual para que,
         * quando e somente quando o texto for efetivamente colado, o Marcador Permanente de Conteúdo Colado
         * seja ancorado no Range de origem com seu numeral ordinal. */
        if (visual && typeof visual.registrarCopiaCandidataParaMarcador === 'function' && rangeAlvo) {
            try {
                visual.registrarCopiaCandidataParaMarcador(rangeAlvo, textoLimpo);
            } catch (_) { }
        }

        const rangeParaGravacao = (opcoesCopia && opcoesCopia.forcarUmaLinha) ? null : rangeAlvo;
        const ehAlteracaoContorno = Boolean(opcoesCopia && opcoesCopia.preservarHistorico);
        await gravarNaAreaDeTransferencia(textoLimpo, rangeParaGravacao, { preservarHistorico: ehAlteracaoContorno });

        /* BUG-45 / USAB-13 (Seção 6.114): Notifica nova cópia global em storage.local para que outras abas
         * removam seu Contorno Visual Rápido (Flash Temporizado) ativo no modo "Até Interação". */
        try {
            const idInstanciaCopia = (typeof window !== 'undefined')
                ? (window.__JUSGOV_ID_INSTANCIA_FRAME__ || (window.__JUSGOV_ID_INSTANCIA_FRAME__ = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
                : 'frame';
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    ultimaNotificacaoCopiaGlobal: {
                        idOrigem: idInstanciaCopia,
                        texto: textoLimpo,
                        timestamp: Date.now()
                    }
                });
            }
        } catch (_) { }
        try {
            const selAssinatura = window.getSelection();
            const ass = calcularAssinaturaSelecao(selAssinatura);
            if (ass) {
                ultimoRangeAssinaturaGlobal = ass;
            } else if (rangeAlvo) {
                ultimoRangeAssinaturaGlobal = `${rangeAlvo.startOffset}_${rangeAlvo.endOffset}_${textoLimpo}`;
            }
        } catch (_) { }

        await cederControleAoCompositorBlink();
        let alertaInvalido = false;
        if (validador && validacaoMatematicaAtiva && rangeAlvo) {
            const textoParaAuditoria = (textoOriginalRange && textoOriginalRange.trim().length > 0)
                ? textoOriginalRange.trim()
                : textoLimpo;
            const check = validador.auditarEAlerta(textoParaAuditoria, rangeAlvo, {
                textoSobrescrito: (textoSobrescrito !== null) ? textoLimpo : null
            });
            alertaInvalido = !check.valido;
        }
        registrarEstatisticaOperacional(alertaInvalido);
        return true;
    }

    /*
     * FUNCAO: aplicarSelecaoECopiar
     * OBJETIVO DE RECONSTRUCAO: Orquestrar de forma desacoplada a selecao visual no DOM
     * (aplicarSelecaoDOM) e a copia para a Area de Transferencia (executarCopiaDeSelecao),
     * respeitando a retencao de selecao em areas de leitura/PDF e a desselecao imediata em UI.
     */
    async function aplicarSelecaoECopiar(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesSelecao = {}) {
        /* REGRA FUNDAMENTAL: NUNCA copiar de campos editaveis (inputs, textareas, rich-textarea, contenteditable, role="textbox")
         * O usuario pode estar selecionando justamente para sobrescrever/digitar por cima sem destruir o clipboard */
        const temModificador = Boolean(opcoesSelecao && opcoesSelecao.temModificador);
        if (!temModificador && isSelecaoOuElementoEmCampoEditavel(rangeAlvo)) {
            return false;
        }

        /* Passo 5.5: Validar Range e orquestrar Selecao Autonoma + Copia Reativa */
        if (!rangeAlvo) return false;

        let textoPreview = '';
        if (textoSobrescrito !== null) {
            textoPreview = higienizarTextoParaCopia(textoSobrescrito);
        } else {
            textoPreview = extrairTextoPuroSanitizado(rangeAlvo) || higienizarTextoParaCopia(rangeAlvo.toString());
        }
        if (!textoPreview || textoPreview.length === 0) return false;

        /* Protecao em Elementos de Interface do Browser sem Modificadores de Teclado */
        const elAlvoVerif = rangeAlvo.commonAncestorContainer || null;
        /* SEÇÃO 6.80: Em seleções por arraste sem Alt, o limiar mínimo exigido é de 2 caracteres úteis */
        const minCustomizado = (opcoesSelecao && typeof opcoesSelecao.minimoCaracteres === 'number')
            ? opcoesSelecao.minimoCaracteres
            : ((opcoesSelecao && opcoesSelecao.eraArrasto) ? (temModificador ? 1 : 2) : null);
        if (!verificarProtecaoTamanhoMinimoInterface(textoPreview, elAlvoVerif, temModificador, minCustomizado)) {
            try {
                const sel = window.getSelection();
                if (sel) sel.removeAllRanges();
            } catch (_) { }
            return false;
        }

        if (timerDebounceSelecaoGlobal) {
            clearTimeout(timerDebounceSelecaoGlobal);
            timerDebounceSelecaoGlobal = null;
        }

        selecaoSendoAplicadaPeloAddon = true;
        try {
            const eraArrasto = Boolean(opcoesSelecao && opcoesSelecao.eraArrasto);
            const elAlvo = rangeAlvo ? rangeAlvo.commonAncestorContainer : null;
            let deveManter = true;
            if (modoRetirarSelecao === 'nenhuma') {
                deveManter = true;
            } else if (modoRetirarSelecao === 'total') {
                deveManter = false;
            } else if (modoRetirarSelecao === 'total_exceto_arrasto') {
                deveManter = (eraArrasto === true);
            } else if (typeof opcoesSelecao.forcarManterSelecao === 'boolean') {
                deveManter = opcoesSelecao.forcarManterSelecao;
            } else if (typeof opcoesSelecao.forcarDesselecao === 'boolean') {
                deveManter = !opcoesSelecao.forcarDesselecao;
            } else {
                deveManter = deveManterSelecaoAtivaNoDom(elAlvo, eraArrasto);
            }

            const infoSel = aplicarSelecaoDOM(rangeAlvo, {
                ...opcoesSelecao,
                forcarManterSelecao: deveManter,
                forcarDesselecao: !deveManter,
                dispararFlash: false,
                limparImediatamente: false
            });

            const copiou = await executarCopiaDeSelecao(rangeAlvo, modoAcumulador, textoSobrescrito, {
                forcarUmaLinha: Boolean(opcoesSelecao && opcoesSelecao.forcarUmaLinha)
            });
            if (!copiou) return false;

            if (!modoAcumulador) {
                if (tempoFlashBorderMs !== 0) {
                    if (!deveManter) {
                        flashExclusivoSemSelecao = true;
                    }
                    dispararFlashBorderVisual(rangeAlvo);
                } else {
                    limparFlashBorderImediatamente();
                }
            }

            // DIRETRIZ ROOT 6.22 e 6.27: Politica de Retencao / Remocao da Selecao do Sistema:
            // "Esta funcao e pra funcionar 'apos soltar o mouse' e antes do flash sumir"
            if (!deveManter) {
                if (tempoFlashBorderMs > 0 || tempoFlashBorderMs === -1) {
                    flashExclusivoSemSelecao = true;
                }
                setTimeout(() => {
                    try {
                        const sel = window.getSelection();
                        if (sel) sel.removeAllRanges();
                    } catch (_) { }
                    if (tempoFlashBorderMs === 0) {
                        flashExclusivoSemSelecao = false;
                    }
                }, 20);
            }

            return true;
        } catch (_) {
            return false;
        } finally {
            setTimeout(() => {
                selecaoSendoAplicadaPeloAddon = false;
            }, 300);
        }
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

    function resolverIndicesExpansaoBase(mapa, idxCursor, numCliques = 1, opcoes = {}) {
        if (!mapa || typeof mapa.texto !== 'string' || typeof idxCursor !== 'number') return null;
        const texto = mapa.texto;
        const apenasBlocoOuAtomica = Boolean(opcoes && opcoes.apenasBlocoOuAtomica);

        if (numCliques >= 3 && !apenasBlocoOuAtomica) {
            const resTriplo = resolverSelecaoTriploClique(mapa, idxCursor);
            return {
                resultadoIndices: resTriplo,
                ehBlocoCompostoSelecionado: false
            };
        }

        const charNoCursor = texto[idxCursor] || '';
        const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
        const clicouEmEspaco = eEspacoBranco(charNoCursor) ||
            (eEspacoBranco(charAnterior) && !eAlfanumericoUnicode(charNoCursor));
        const clicouEmDelimitadorOuAspas = eDelimitadorPar(charNoCursor) || eDelimitadorPar(charAnterior) ||
            eCaractereAspas(charNoCursor) || eCaractereAspas(charAnterior);

        const expandirComoDuplo = !apenasBlocoOuAtomica && (
            numCliques === 2 ||
            (Boolean(opcoes && opcoes.ehAlt) && numCliques === 1 && (clicouEmEspaco || clicouEmDelimitadorOuAspas))
        );

        let resultadoIndices = null;
        let ehBlocoCompostoSelecionado = false;

        if (expandirComoDuplo) {
            const blocoCompostoPrevio = opcoes ? opcoes.blocoCompostoPrevio : null;
            if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
            }
            if (!resultadoIndices && !blocoCompostoPrevio) {
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
                resultadoIndices = expandirSentencaCompletaAtePonto(texto, idxCursor) || expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
            }
        } else if (!apenasBlocoOuAtomica && clicouEmDelimitadorOuAspas) {
            resultadoIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, false);
            if (resultadoIndices) ehBlocoCompostoSelecionado = true;
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
            }
        } else if (!apenasBlocoOuAtomica && clicouEmEspaco) {
            /* Regra de bloco: espaco logo apos ":" liga o rotulo ao que vem depois -> sentenca inteira */
            resultadoIndices = tentarExpandirSentencaPorDoisPontos(texto, idxCursor);
            if (!resultadoIndices) {
                resultadoIndices = tentarExpandirPadraoComposto(texto, idxCursor, true, false);
                if (resultadoIndices) ehBlocoCompostoSelecionado = true;
            }
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
            if (resultadoIndices) ehBlocoCompostoSelecionado = true;
            if (!resultadoIndices) {
                resultadoIndices = expandirUnidadeAtomicaEstagio1(texto, idxCursor);
            }
        }

        return {
            resultadoIndices,
            ehBlocoCompostoSelecionado
        };
    }

    /* ==========================================================================
     * SECAO 8: SELECAO EM TABELAS E ORQUESTRADOR ELASTICO (CTRL OU ALT: CLIQUE E ARRASTO)
     * ========================================================================== */
    function obterRangePalavraOuBlocoNoPonto(clientX, clientY) {
        const ponto = obterPontoDoClique(clientX, clientY);
        if (!ponto) return null;

        const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
        if (!mapa) return null;

        const base = resolverIndicesExpansaoBase(mapa, mapa.idxCursor, 1, { apenasBlocoOuAtomica: true });
        const resultadoIndices = base ? base.resultadoIndices : null;
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

            await aplicarSelecaoECopiar(newRange, false, null, { preservarHistorico: true });
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
        } catch (_) { }
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
        if (!capturaBotoesMouse4e5Ativa) return false;
        const modInput = fachadaModuloInput || (typeof window !== 'undefined' && (window.JusGovInstanciaInput || window.JusGovModuloInputInstancia)) || null;
        if (modInput && modInput.botoesLaterais && typeof modInput.botoesLaterais.processarEventoMouse === 'function') {
            modInput.botoesLaterais.ativo = true;
            return modInput.botoesLaterais.processarEventoMouse(e);
        }
        const bLaterais = (typeof window !== 'undefined' && window.JusGovBotoesLateraisMouseInstancia) ? window.JusGovBotoesLateraisMouseInstancia : null;
        if (bLaterais && typeof bLaterais.processarEventoMouse === 'function') {
            bLaterais.ativo = true;
            return bLaterais.processarEventoMouse(e);
        }
        return false;
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
        if (!cssBlindado || !document.getElementById('pje-turbo-lock')) {
            blindarCSS();
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
                /* No modo Até Interação (Padrão / -1), o Flash é preservado mesmo com cliques, sumindo apenas em nova seleção/cópia */
                if (CONFIGURACAO_MOTOR.tempoFlashBorderMs !== -1) {
                    limparFlashBorderImediatamente();
                }
                limparAvisosAuditoriaEWikiImediatamente();
            }
        }

        if (!verificarUrlPermitida()) return;

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

        /* Modulo MOUSE: Tratamento do Botao do Meio (scroll click, button === 1) */
        if (e.button === 1) {
            /* Regra fundamental: Preservar navegacao nativa do navegador (abrir link em nova aba).
             * Nunca chamar preventDefault() no clique com botao do meio sobre <a href>. */
            const elLinkMeio = (elAlvoEfetivo && typeof elAlvoEfetivo.closest === 'function')
                ? elAlvoEfetivo.closest('a[href]')
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

            /* Ctrl + Botao do Meio: apenas anula autoscroll e prepara foco para colagem do buffer anterior */
            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                e.preventDefault();
                try { elAlvoEfetivo.focus(); } catch (_) { }
                return;
            }

            /* Colar com o Botao do Meio ativo:
             * Anula a rolagem automatica nativa (autoscroll) do Chromium que altera o cursor para icone de bussola,
             * mesmo se houver erro ou alvo nao editavel, realizando foco preparatorio caso seja campo editavel. */
            e.preventDefault();
            const ctxMeio = classificarContextoElementoAlvo(elAlvoEfetivo);
            if (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL' || ctxMeio === 'EDITOR_MULTILINHA_EDITAVEL') {
                try { elAlvoEfetivo.focus(); } catch (_) { }
            }
            return;
        }

        /* Foco preparatorio no clique com botao direito em campo editavel */
        if (e.button === 2) {
            const ctxDireito = classificarContextoElementoAlvo(elAlvoEfetivo);
            if (colarBotaoMeioAtivo && colagemBotaoDireitoAtiva && (ctxDireito === 'CAMPO_SIMPLES_EDITAVEL' || ctxDireito === 'EDITOR_MULTILINHA_EDITAVEL')) {
                try { elAlvoEfetivo.focus(); } catch (_) { }
            }
            return;
        }

        if (e.button !== 0) return;

        isMousePressionado = true;
        coordsMouseDown.x = e.clientX;
        coordsMouseDown.y = e.clientY;
        if (validador && typeof validador.registrarPontoInteracaoMouse === 'function') {
            validador.registrarPontoInteracaoMouse(e.clientX, e.clientY);
        }
        houveArrastoMouse = false;
        selecaoElasticaAtivaNoClique = false;
        rangeAncoraArrastoElastico = null;
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
        if (e.ctrlKey && e.altKey && e.shiftKey) {
            atualizarInspetorTempoReal(e.clientX, e.clientY, e.target);
        } else if (painelInspetorTempoRealEl) {
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
        if (e.button !== 0) return;

        const elAlvoEfetivo = obterElementoAlvoEfetivo(e);
        if (validador && typeof validador.registrarPontoInteracaoMouse === 'function') {
            validador.registrarPontoInteracaoMouse(e.clientX, e.clientY);
        }

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

        /* Seção 6.20, 6.85 e 6.126: Identificação Única e Assistente de Mapeamento (Ctrl + Alt + Shift + Clique ou Ctrl + Alt + Botão Direito) no mouseup */
        if ((e.button === 0 && e.ctrlKey && e.altKey && e.shiftKey) || (e.button === 2 && e.ctrlKey && e.altKey)) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            executarInspecaoECapturaSeletorUnico(elAlvoEfetivo || e.target);
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
                        }, 20);
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
                    const textoNumericoLimpo = aplicarLimpezaNumericaComTravaAlfabetica(textoBrutoShift);
                    await aplicarSelecaoECopiar(rngShift, false, textoNumericoLimpo, {
                        eraArrasto: true,
                        temModificador: true
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
                        selAtualNoMouseUp.removeAllRanges();
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

                const deveDesselecionarArrasto = (modoRetirarSelecao === 'total') ||
                    (modoRetirarSelecao === 'interface' && ehSistemaEstrito);

                ignorarProximoClick = true;
                await aplicarSelecaoECopiar(rangeArrastado, modoAcumulador, null, {
                    forcarDesselecao: deveDesselecionarArrasto,
                    forcarManterSelecao: !deveDesselecionarArrasto,
                    temModificador: temModificadorArrasto,
                    eraArrasto: true
                });
                if (deveDesselecionarArrasto) {
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
                    const textoExpandidoLimpoShift = aplicarLimpezaNumericaComTravaAlfabetica(textoExpandidoBruto);
                    await aplicarSelecaoECopiar(rangeExpandido, false, textoExpandidoLimpoShift, {
                        temModificador: true
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
                    const optSel = (campoAlvo.selectedIndex >= 0 && campoAlvo.options) ? campoAlvo.options[campoAlvo.selectedIndex] : null;
                    textoCampo = ((optSel && (optSel.text || optSel.textContent)) || campoAlvo.value || '').trim();
                } else if (campoAlvo.tagName === 'OPTION') {
                    textoCampo = (campoAlvo.text || campoAlvo.innerText || campoAlvo.textContent || '').trim();
                } else {
                    textoCampo = (campoAlvo.value || campoAlvo.placeholder || campoAlvo.getAttribute('value') || '').trim();
                }
                if (textoCampo) {
                    const rangeCampo = document.createRange();
                    rangeCampo.selectNode(campoAlvo);
                    await aplicarSelecaoECopiar(rangeCampo, false, textoCampo, {
                        temModificador: true,
                        eraArrasto: false
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
                                        const sel = window.getSelection();
                                        if (sel) sel.removeAllRanges();
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
            const elInterativo = obterObjetoInterativoParaSelecaoCompleta(alvo);
            if (elInterativo) {
                const txtInterativo = extrairTextoVisivelLimpoDeElemento(elInterativo);
                const rInterativo = criarRangeTextoParaEtiquetaOuObjeto(elInterativo);
                if (txtInterativo && rInterativo) {
                    await aplicarSelecaoECopiar(rInterativo, modoAcumulador, txtInterativo, { temModificador: true, minimoCaracteres: 1 });
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

        if (!e.shiftKey) {
            ancoraCursorShift = { no: ponto.no, offset: ponto.offset };
        }

        const mapa = construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
        if (!mapa) {
            if (e.detail >= 3) {
                const bloco = obterBlocoAncestralContextual(elAlvoEfetivo);
                if (bloco && bloco !== document.body) {
                    const rangeBloco = document.createRange();
                    rangeBloco.selectNodeContents(bloco);
                    await aplicarSelecaoECopiar(rangeBloco, modoAcumulador, null, { temModificador: temModificadorTeclado });
                    return;
                }
            }
            await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
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
                    const txtTriplo = (extrairTextoPuroSanitizado(rangeTriplo) || rangeTriplo.toString()).trim();
                    if (!ultimoTextoSelecionadoLimpo || txtTriplo !== ultimoTextoSelecionadoLimpo.trim()) {
                        await aplicarSelecaoECopiar(rangeTriplo, modoAcumulador, null, { temModificador: temModificadorTeclado });
                        return;
                    }
                }
            }
            const bloco = obterBlocoAncestralContextual(elAlvoEfetivo);
            if (bloco && bloco !== document.body) {
                let rangeBloco = document.createRange();
                rangeBloco.selectNodeContents(bloco);
                const txtBloco = (extrairTextoPuroSanitizado(rangeBloco) || rangeBloco.toString()).trim();
                if (ultimoTextoSelecionadoLimpo && txtBloco === ultimoTextoSelecionadoLimpo.trim() && bloco.parentElement && bloco.parentElement !== document.body) {
                    rangeBloco = document.createRange();
                    rangeBloco.selectNodeContents(bloco.parentElement);
                }
                await aplicarSelecaoECopiar(rangeBloco, modoAcumulador, null, { temModificador: temModificadorTeclado });
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

        const blocoCompostoPrevio = ehDuploClique
            ? (ultimoBlocoCompostoAtivo || (() => {
                const rb = tentarExpandirPadraoComposto(texto, idxCursor, false, false);
                return rb ? { texto: texto.slice(rb.inicio, rb.fim).trim() } : null;
            })())
            : null;

        const resExpansao = resolverIndicesExpansaoBase(mapa, idxCursor, e.detail, { blocoCompostoPrevio, ehAlt: Boolean(e.altKey) });
        const resultadoIndices = resExpansao ? resExpansao.resultadoIndices : null;
        const ehBlocoCompostoSelecionado = Boolean(resExpansao && resExpansao.ehBlocoCompostoSelecionado);

        if (ehDuploClique && blocoCompostoPrevio && (!resultadoIndices || texto.slice(resultadoIndices.inicio, resultadoIndices.fim).trim().length <= blocoCompostoPrevio.texto.length)) {
            const blocoFora = obterBlocoAncestralContextual(elAlvoEfetivo);
            if (blocoFora && blocoFora !== document.body) {
                const rangeFora = document.createRange();
                rangeFora.selectNodeContents(blocoFora);
                ultimoBlocoCompostoAtivo = null;
                estadoCicloSelecao = {
                    direcao: 1,
                    textoAtual: (extrairTextoPuroSanitizado(rangeFora) || rangeFora.toString()).trim()
                };
                await aplicarSelecaoECopiar(rangeFora, modoAcumulador, null, { temModificador: temModificadorTeclado });
                return;
            }
        }

        if (!resultadoIndices) {
            await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
            return;
        }

        let rangeFinal = criarRangeDOMAPartirDeIndices(mapa, resultadoIndices.inicio, resultadoIndices.fim);
        if (!rangeFinal) {
            await tentarFallbackAltElementoSemTexto(elAlvoEfetivo);
            return;
        }

        let textoCandidato = (mapa && typeof mapa.texto === 'string')
            ? mapa.texto.slice(resultadoIndices.inicio, resultadoIndices.fim)
            : '';

        /* DIRETRIZ UNIVERSAL ANTI-ESTAGNAÇÃO POR CLIQUES:
         * Se ehDuploClique e o texto candidato for igual ao já selecionado/copiado anteriormente, amplia imediatamente! */
        if (ehDuploClique && ultimoTextoSelecionadoLimpo && textoCandidato.trim() === ultimoTextoSelecionadoLimpo.trim()) {
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
                const bloco = obterBlocoAncestralContextual(elAlvoEfetivo);
                if (bloco && bloco !== document.body) {
                    const rBloco = document.createRange();
                    rBloco.selectNodeContents(bloco);
                    const txtBloco = (extrairTextoPuroSanitizado(rBloco) || rBloco.toString()).trim();
                    if (txtBloco && txtBloco !== ultimoTextoSelecionadoLimpo.trim()) {
                        rangeFinal = rBloco;
                        textoCandidato = txtBloco;
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
    function inserirTextoEmElemento(alvo, texto, ehHtmlFormatado) {
        try {
            if (!alvo) return;
            alvo.focus();

            if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') {
                const tipoInput = (alvo.getAttribute('type') || alvo.type || 'text').toLowerCase();
                const ehTipoTemporal = ['date', 'datetime-local', 'month', 'week', 'time'].includes(tipoInput);

                if (ehTipoTemporal) {
                    let valorData = (texto || '').trim();
                    if (tipoInput === 'date') {
                        // Converte DD/MM/AAAA ou DD-MM-AAAA ou DD.MM.AAAA para AAAA-MM-DD aceito pelo padrao HTML5
                        const mDataBr = valorData.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
                        if (mDataBr) {
                            const dia = mDataBr[1].padStart(2, '0');
                            const mes = mDataBr[2].padStart(2, '0');
                            const ano = mDataBr[3];
                            valorData = `${ano}-${mes}-${dia}`;
                        }
                    }
                    try {
                        const proto = (typeof HTMLTextAreaElement !== 'undefined' && (alvo instanceof HTMLTextAreaElement || (alvo.tagName && alvo.tagName.toUpperCase() === 'TEXTAREA')))
                            ? HTMLTextAreaElement.prototype
                            : (typeof HTMLInputElement !== 'undefined' ? HTMLInputElement.prototype : null);
                        const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
                        if (descriptor && descriptor.set) {
                            descriptor.set.call(alvo, valorData);
                        } else {
                            alvo.value = valorData;
                        }
                    } catch (_) {
                        alvo.value = valorData;
                    }
                    try {
                        alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                    return;
                }

                let start = null;
                let end = null;
                try {
                    start = (typeof alvo.selectionStart === 'number') ? alvo.selectionStart : null;
                    end = (typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : null;
                } catch (_) {
                    start = null;
                    end = null;
                }

                let inseriuComRange = false;
                if (start !== null && end !== null && typeof alvo.setRangeText === 'function') {
                    try {
                        alvo.setRangeText(texto, start, end, 'end');
                        inseriuComRange = true;
                    } catch (_) {
                        inseriuComRange = false;
                    }
                }

                if (!inseriuComRange) {
                    if (start !== null && end !== null) {
                        alvo.value = (alvo.value || '').substring(0, start) + texto + (alvo.value || '').substring(end);
                        try {
                            alvo.selectionStart = alvo.selectionEnd = start + texto.length;
                        } catch (_) { }
                    } else {
                        // Fallback seguro para inputs que rejeitam selectionStart (ex: type="number", "email", etc.)
                        try {
                            const proto = (typeof HTMLTextAreaElement !== 'undefined' && (alvo instanceof HTMLTextAreaElement || (alvo.tagName && alvo.tagName.toUpperCase() === 'TEXTAREA')))
                                ? HTMLTextAreaElement.prototype
                                : (typeof HTMLInputElement !== 'undefined' ? HTMLInputElement.prototype : null);
                            const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
                            if (descriptor && descriptor.set) {
                                descriptor.set.call(alvo, texto);
                            } else {
                                alvo.value = texto;
                            }
                        } catch (_) {
                            alvo.value = texto;
                        }
                    }
                }

                try {
                    alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                } catch (_) { }
                return;
            }

            let executou = false;
            try {
                if (ehHtmlFormatado) {
                    executou = document.execCommand('insertHTML', false, texto);
                } else {
                    executou = document.execCommand('insertText', false, texto);
                }
            } catch (_) { }

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
            } catch (_) { }
        } catch (_) { }
    }

    /*
     * FUNCAO: confirmarColagemGlobalEMarcarPermanente (FEAT-21 / VIS-01 — Seção 6.105)
     * OBJETIVO: Acionada exclusivamente quando o conteúdo copiado é efetivamente colado
     * (via Botão do Meio, Botão Direito, Caixa Rápida Ins+Ins ou Ctrl+V nativo).
     * Remove o Contorno Visual Rápido temporário na aba de origem e aplica o Marcador
     * Permanente de Conteúdo Colado com seu numeral ordinal (1, 2, 3...), sincronizando
     * também entre diferentes abas via chrome.storage.local.
     */
    function confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota = false) {
        try {
            const txt = (typeof textoColado === 'string' && textoColado.trim().length > 0)
                ? textoColado.trim()
                : ((window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto) || ultimoTextoSelecionadoLimpo || '');
            let resMarcador = null;
            if (visual && typeof visual.confirmarColagemEMarcarPermanente === 'function') {
                resMarcador = visual.confirmarColagemEMarcarPermanente(txt);
            }
            if (!origemRemota && txt) {
                const idInstancia = (typeof window !== 'undefined')
                    ? (window.__JUSGOV_ID_INSTANCIA_FRAME__ || (window.__JUSGOV_ID_INSTANCIA_FRAME__ = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
                    : 'frame';
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({
                        ultimaColagemConfirmadaGlobal: {
                            idOrigem: idInstancia,
                            texto: txt,
                            timestamp: Date.now()
                        }
                    });
                }
            }
            return resMarcador;
        } catch (_) {
            return null;
        }
    }

    if (typeof window !== 'undefined') {
        window.__JUSGOV_CONFIRMAR_COLAGEM_CONTEUDO__ = (textoColado) => confirmarColagemGlobalEMarcarPermanente(textoColado, false);
    }

    /*
     * FUNCAO: executarColagemBotaoDireito
     * OBJETIVO DE RECONSTRUCAO: Executar colagem (botao do meio / botao direito) usando a simulacao
     * interna de clipboard do addon ("Ultima Selecao" em window.__JUSGOV_ULTIMO_CLIPBOARD__ ou a selecao
     * anterior em window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ quando acionado via Ctrl + Botao do Meio).
     * Tudo protegido com try/catch.
     */
    async function executarColagemBotaoDireito(alvo, modo, usarAnterior = false) {
        try {
            if (!alvo) return;

            /* Regra: 1 clique com botao direito utiliza formato estilo padrao/avancado;
             * 2 cliques rapidos forcam obrigatoriamente colar SOMENTE TEXTO puro do clipboard. */
            const modoEfetivo = (modo === 'texto_puro') ? 'texto_puro' : 'normal';

            const ehEditorRico = Boolean(alvo.isContentEditable ||
                (alvo.getAttribute && alvo.getAttribute('contenteditable') === 'true') ||
                (alvo.closest && alvo.closest('[contenteditable="true"], [contenteditable=""], .ck-editor__editable, .ck-content')) ||
                document.designMode === 'on');
            const ehCampoTextoPuro = (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || !ehEditorRico);

            const itemInterno = usarAnterior
                ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                : window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const textoEmulado = (typeof itemInterno === 'string')
                ? itemInterno
                : ((itemInterno && itemInterno.texto) || (!usarAnterior ? ultimoTextoSelecionadoLimpo : '') || '');
            const htmlEmulado = (itemInterno && typeof itemInterno === 'object' && itemInterno.formatado && itemInterno.html) ? itemInterno.html : '';

            if (textoEmulado && textoEmulado.trim().length > 0) {
                if (ehCampoTextoPuro || modoEfetivo === 'texto_puro') {
                    /* Campo somente texto (input, textarea) ou modo texto puro: SEMPRE cola texto puro */
                    inserirTextoEmElemento(alvo, textoEmulado, false);
                } else if (modoEfetivo === 'normal' && ehEditorRico && htmlEmulado) {
                    /* Editor Web / HTML / RTF / contenteditable: cola com formatacao */
                    inserirTextoEmElemento(alvo, htmlEmulado, true);
                } else {
                    inserirTextoEmElemento(alvo, textoEmulado, false);
                }
                confirmarColagemGlobalEMarcarPermanente(textoEmulado, false);
            }
        } catch (_) { }
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

            /* Ctrl + Botao do Meio: cola diretamente a penultima selecao copiada (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__),
             * preservando a ultima selecao intacta e sem rotacionar a memoria interna (Seção 6.63). */
            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL' || ctxMeio === 'EDITOR_MULTILINHA_EDITAVEL') {
                    try {
                        executarColagemBotaoDireito(alvo, 'normal', true);
                    } catch (_) { }
                }
                return;
            }

            /* Colagem normal ou Alt+Meio (250ms de espera para scripts de foco/selecionar-tudo) */
            if (colarBotaoMeioAtivo) {
                e.preventDefault();
                e.stopPropagation();
                if (ctxMeio === 'CAMPO_SIMPLES_EDITAVEL' || ctxMeio === 'EDITOR_MULTILINHA_EDITAVEL') {
                    const executarColagemMeio = () => {
                        try {
                            executarColagemBotaoDireito(alvo, 'normal', Boolean(e.ctrlKey));
                        } catch (_) { }
                    };
                    if (e.altKey) {
                        try {
                            if (typeof alvo.focus === 'function') alvo.focus();
                            if (typeof alvo.click === 'function') alvo.click();
                        } catch (_) { }
                        setTimeout(executarColagemMeio, 250);
                    } else {
                        executarColagemMeio();
                    }
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
        if (ehAmbienteOpcoes && (!e.target || typeof e.target.closest !== 'function' || !e.target.closest('.editable-demo, #textareaMinutasDemo, #editorHtmlOnlineDemo, #demoInputAlternancia, .linha-campos-entrada, input, textarea, [contenteditable]'))) {
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

        const colarAnterior = Boolean(e.ctrlKey && !e.altKey && !e.shiftKey);

        if (diff < 350 && timerCliqueDireitoColagem) {
            clearTimeout(timerCliqueDireitoColagem);
            timerCliqueDireitoColagem = null;
            executarColagemBotaoDireito(alvo, 'texto_puro', colarAnterior);
        } else {
            if (timerCliqueDireitoColagem) {
                clearTimeout(timerCliqueDireitoColagem);
            }
            timerCliqueDireitoColagem = setTimeout(() => {
                timerCliqueDireitoColagem = null;
                executarColagemBotaoDireito(alvo, 'normal', colarAnterior);
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
                    try { s.empty(); } catch (_) { }
                }
                if (typeof s.removeAllRanges === 'function') {
                    try { s.removeAllRanges(); } catch (_) { }
                }
                if (s.rangeCount > 0 && typeof s.collapseToStart === 'function') {
                    try { s.collapseToStart(); } catch (_) { }
                }
            }
        } catch (_) { }

        try {
            /* 2. Funcao Nativa do Documento execCommand('unselect') */
            if (typeof doc.execCommand === 'function') {
                try { doc.execCommand('unselect'); } catch (_) { }
            }
        } catch (_) { }

        try {
            /* 3. Limpeza de Elemento Ativo e Desselecao de Inputs/Textareas */
            const elemAtivo = doc.activeElement;
            if (elemAtivo) {
                if (typeof elemAtivo.setSelectionRange === 'function') {
                    try { elemAtivo.setSelectionRange(0, 0); } catch (_) { }
                }
                if (elemAtivo.blur && (elemAtivo.tagName === 'INPUT' || elemAtivo.tagName === 'TEXTAREA' || elemAtivo.isContentEditable)) {
                    try { elemAtivo.blur(); } catch (_) { }
                }
            }
            if (doc.querySelectorAll) {
                const campos = doc.querySelectorAll('input, textarea');
                for (let i = 0; i < campos.length; i++) {
                    const c = campos[i];
                    if (c && typeof c.selectionStart === 'number' && c.selectionStart !== c.selectionEnd) {
                        try { c.setSelectionRange(0, 0); } catch (_) { }
                    }
                }
            }
        } catch (_) { }

        try {
            /* 4. Shadow Roots Acessiveis no Documento (somente elementos customizados com hifen para evitar varredura O(N) de todo o DOM) */
            if (doc.activeElement && doc.activeElement.shadowRoot && typeof doc.activeElement.shadowRoot.getSelection === 'function') {
                const sShAtivo = doc.activeElement.shadowRoot.getSelection();
                if (sShAtivo) {
                    if (typeof sShAtivo.empty === 'function') sShAtivo.empty();
                    if (typeof sShAtivo.removeAllRanges === 'function') sShAtivo.removeAllRanges();
                }
            }
        } catch (_) { }
    }

    function executarDeselecaoUniversal(origemRemota = false, preservarMiniTip = false) {
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
                                    } catch (_) { }
                                }
                            }
                        }
                    } catch (_) { }
                }
            }
        } catch (_) { }

        /* Passo 9.9.8: Se executado dentro de iframe, desseleciona parent e top */
        try {
            if (window.parent && window.parent !== window) {
                deselecionarTudoEmContexto(window.parent, window.parent.document);
            }
        } catch (_) { }
        try {
            if (window.top && window.top !== window && window.top !== window.parent) {
                deselecionarTudoEmContexto(window.top, window.top.document);
            }
        } catch (_) { }

        /* Passo 9.9.9: Limpeza de estados internos, acumulador, alertas e contornos flash */
        ancoraCursorShift = null;
        ultimoTextoSelecionadoLimpo = '';
        ultimoRangeSelecionadoSimples = null;
        ultimoCampoEditavelSelecionado = null;
        teclasPressionadasAtivas.clear();
        limparFlashBorderImediatamente();
        if (acumulador && acumulador.obterQuantidade() > 0) {
            acumulador.limpar();
        }
        /* Preserva minitip de alternancia Esc+Esc quando originado por broadcast remoto ou solicitado explicitamente */
        limparAvisosAuditoriaEWikiImediatamente(Boolean(origemRemota || preservarMiniTip));

        /* Passo 9.9.10: Transmissao broadcast entre todos os frames da aba via Service Worker */
        if (!origemRemota) {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ acao: 'broadcastDeselecionarGeral' }, () => {
                        if (chrome.runtime && chrome.runtime.lastError) { }
                    });
                }
            } catch (_) { }
        }
    }

    function aoPressionarTecla(e) {
        if (e && e.key && e.key !== 'Escape') {
            teclasPressionadasAtivas.add(String(e.key).toLowerCase());
        }

        /* Secao 6.72: Delegacao unificada da Caixa de Entrada Rapida (Ins + Ins / Ctrl + Ins + Ins) */
        if (caixaEntradaRapidaAtiva && fachadaModuloInput && fachadaModuloInput.caixaRapida && typeof fachadaModuloInput.caixaRapida.tratarEventoTeclado === 'function') {
            fachadaModuloInput.caixaRapida.ativo = true;
            if (fachadaModuloInput.caixaRapida.tratarEventoTeclado(e)) {
                return;
            }
        }

        /* BUG-02, Seção 6.30 e BUG-45 / USAB-13 (Seção 6.114):
         * - Ao pressionar Escape: destrói imediatamente o contorno Flash e os avisos.
         * - Ao pressionar Enter: destrói os avisos e, se o Flash NÃO estiver em modo "Até Interação" (-1),
         *   destrói também o contorno Flash (no modo "Até Interação", o Flash permanece até nova cópia, colagem ou Esc). */
        if (e && e.key === 'Escape') {
            limparFlashBorderImediatamente();
            limparAvisosAuditoriaEWikiImediatamente();
        } else if (e && e.key === 'Enter') {
            if (tempoFlashBorderMs !== -1) {
                limparFlashBorderImediatamente();
            }
            limparAvisosAuditoriaEWikiImediatamente();
        }

        /* Passo 9.8: Tecla Shift exclusiva: NUNCA desseleciona a selecao existente,
         * permitindo continuar ou estender a selecao ativa (Shift + Setas ou Shift + Clique) */
        if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.repeat) {
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                ancoraCursorShift = {
                    no: sel.anchorNode || r.startContainer,
                    offset: typeof sel.anchorOffset === 'number' ? sel.anchorOffset : r.startOffset
                };
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
                if (elemAtivo && (elemAtivo.tagName === 'INPUT' || elemAtivo.tagName === 'TEXTAREA')) {
                    try {
                        if (typeof elemAtivo.selectionStart === 'number') {
                            const txtInput = elemAtivo.value.substring(elemAtivo.selectionStart, elemAtivo.selectionEnd);
                            if (txtInput && txtInput.trim().length > 0) {
                                textoSelecionadoF1 = higienizarTextoParaCopia(txtInput);
                            }
                        }
                    } catch (_) { }
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
                                try { window.open('https://gemini.google.com/app', '_blank'); } catch (_) { }
                            }
                        });
                    } else {
                        window.open('https://gemini.google.com/app', '_blank');
                    }
                } catch (_) {
                    try { window.open('https://gemini.google.com/app', '_blank'); } catch (__) { }
                }

                if (validador && typeof validador.projetarMiniTipGlobal === 'function') {
                    validador.projetarMiniTipGlobal('Abrindo assistente de IA Gemini...', '#2563eb');
                }
            } else {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ acao: 'abrirGeminiLateral', modo: 'flash', prompt: '' }, () => {
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
                    delete elAtivo.dataset.autoselected;
                    elAtivo.__jusgovBlurLigado = false;
                    inputsJaSelecionadosInicialmente.delete(elAtivo);
                    elAtivo.__jusgovSelecionadoInicial = false;
                    try { elAtivo.blur(); } catch (_) { }
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
                    try {
                        if (window.top && window.top !== window && window.top.__JUSGOV_MOTOR_SELECAO_API__) {
                            const apiTop = window.top.__JUSGOV_MOTOR_SELECAO_API__;
                            if (typeof apiTop.projetarMiniTipGlobalNoTop === 'function') {
                                apiTop.projetarMiniTipGlobalNoTop(msgModo, corBorda);
                            }
                        }
                    } catch (_) { }
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
        if (!window.__JUSGOV_MODO_BARALHO__) {
            ocultarInspetorTempoReal();
        }
    }

    /*
     * FUNCAO: calcularAssinaturaSelecao
     * OBJETIVO: Gerar uma assinatura unica (offsets + texto) da selecao atual, usada para saber se
     * aquela selecao exata ja foi copiada (por qualquer caminho: clique, arraste, teclado ou sistema).
     */
    function calcularAssinaturaSelecao(sel) {
        try {
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
            const r = sel.getRangeAt(0);
            const txt = (sel.toString() || '').trim();
            if (!txt) return '';
            return `${r.startOffset}_${r.endOffset}_${txt}`;
        } catch (_) {
            return '';
        }
    }

    /*
     * FUNCAO: tratarMudancaSelecaoGlobal
     * DIRETRIZ ROOT: Identifica globalmente selecoes de texto ativas na pagina ou em
     * visualizadores de PDF (criadas por teclado Shift+Setas, selecoes nativas, mouseup)
     * e garante a aplicacao imediata da formatacao, copia para a Area de Transferencia
     * e contorno visual, sem quebrar o fluxo do usuario.
     * Regra: toda selecao (do sistema ou feita pelo addon) que ainda nao foi copiada e copiada agora.
     */
    function tratarMudancaSelecaoGlobal(winAlvo) {
        const win = winAlvo || window;
        if (!win || typeof win.getSelection !== 'function') return;

        // Se o foco atual esta em um IFRAME ou EMBED nao-PDF, a selecao e de responsabilidade exclusiva do subframe.
        // Se for um visualizador de PDF embutido (ex.: embed#plugin type="application/x-google-chrome-pdf"),
        // a mudanca de selecao deve ser processada normalmente para permitir copia com flash no PDF.
        if (document.activeElement) {
            const tagAtiva = document.activeElement.tagName;
            if (tagAtiva === 'IFRAME') {
                return;
            }
            if (tagAtiva === 'EMBED' && !isAreaLeituraOuPdfConteudo(document.activeElement)) {
                return;
            }
        }

        // Se for um subframe que ja possui seu proprio motor de selecao ativo, o frame pai nunca intercepta
        if (winAlvo && winAlvo !== window && winAlvo.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
            return;
        }

        /* Selecao desfeita: libera a assinatura imediatamente (mesmo com o mouse pressionado), para que
         * selecionar novamente o MESMO texto (ex.: duplo clique na mesma palavra) volte a ser copiado. */
        try {
            const selReset = win.getSelection();
            if (!selReset || selReset.rangeCount === 0 || selReset.isCollapsed) {
                ultimoRangeAssinaturaGlobal = '';
            }
        } catch (_) { }

        if (selecaoSendoAplicadaPeloAddon) return;

        // Guarda de reentrancia no topo da hierarquia de janelas
        let topWin = window;
        try { if (window.top && window.top.document) topWin = window.top; } catch (_) { }
        if (topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__) return;

        if (timerDebounceSelecaoGlobal) {
            clearTimeout(timerDebounceSelecaoGlobal);
        }
        timerDebounceSelecaoGlobal = setTimeout(async () => {
            timerDebounceSelecaoGlobal = null;
            if (selecaoSendoAplicadaPeloAddon) return;
            if (topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__) return;
            if (isMousePressionado) return; // Se mouse ainda esta sendo arrastado, aguarda mouseup
            if (!verificarUrlPermitida()) return;

            const sel = (win && typeof win.getSelection === 'function') ? win.getSelection() : window.getSelection();
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                ultimoRangeAssinaturaGlobal = '';
                return;
            }
            const textoSel = (sel.toString() || '').trim();
            if (textoSel.length === 0) return;

            const range = sel.getRangeAt(0);
            if (!range) return;

            // Nao intercepta campos de entrada simples ou editores para respeitar a Regra de Ouro
            if (isSelecaoOuElementoEmCampoEditavel(range) || isSelecaoOuElementoEmCampoEditavel(document.activeElement)) {
                return;
            }
            const ctx = classificarContextoElementoAlvo(range.commonAncestorContainer);
            if (ctx === 'CAMPO_SIMPLES_EDITAVEL' || ctx === 'EDITOR_MULTILINHA_EDITAVEL') return;

            // Em controles estritos de interface ('interface'), nunca seleciona nem copia via selectionchange sem teclas modificadoras
            if (isComponenteBotaoOuFormularioEstrito(range.commonAncestorContainer)) {
                return;
            }
            // BUG-16: Em caixas de seleção / dropdowns / select2, zero cópia automática via selectionchange sem Alt
            if (!teclasPressionadasAtivas.has('alt') && isComponenteSelecaoOuDropdown(range.commonAncestorContainer)) {
                return;
            }
            if (isElementoInterativoClicavelDireto(range.commonAncestorContainer)) {
                const resBlocoSel = localizarBlocoForenseAutoSelecionavelEmInterface(textoSel, 0, 1, true);
                if (!resBlocoSel || resBlocoSel.inicio !== 0 || resBlocoSel.fim < textoSel.length) {
                    return;
                }
            }

            // Assinatura única para evitar re-execução em loop da mesma seleção exata
            const assinatura = `${range.startOffset}_${range.endOffset}_${textoSel}`;
            if (assinatura === ultimoRangeAssinaturaGlobal) return;
            ultimoRangeAssinaturaGlobal = assinatura;

            // Blindagem anti-loop de selecao manual (Diretriz 6.39)
            if (textoSel === ultimaSelecaoManualTexto && (Date.now() - ultimoTimestampSelecaoManual) < 1500) {
                return;
            }
            ultimaSelecaoManualTexto = textoSel;
            ultimoTimestampSelecaoManual = Date.now();

            const rangeClone = range.cloneRange();
            const ehSistemaEstrito = isTelaSistemaEstritaParaDesselecao(range.commonAncestorContainer);
            if (!teclasPressionadasAtivas.has('alt') && !teclasPressionadasAtivas.has('control')) {
                if (!verificarProtecaoTamanhoMinimoInterface(textoSel, range.commonAncestorContainer, false)) {
                    return;
                }
            }

            topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__ = true;
            selecaoSendoAplicadaPeloAddon = true;
            try {
                await aplicarSelecaoECopiar(rangeClone, false, null, {
                    eraArrasto: false
                });
            } finally {
                setTimeout(() => {
                    selecaoSendoAplicadaPeloAddon = false;
                    topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__ = false;
                }, 300);
            }
        }, 120);
    }

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
    const conjuntoControladoresSubframes = new Set();
    const mapaSubframePorElemento = new WeakMap();

    function limparOuvintesIframeLocal(el) {
        if (!el) return false;
        const reg = mapaSubframePorElemento.get(el);
        if (!reg) return false;
        mapaSubframePorElemento.delete(el);
        if (reg.controller) {
            conjuntoControladoresSubframes.delete(reg.controller);
            try { reg.controller.abort(); } catch (_) { }
        }
        if (reg.subWin) {
            try { reg.subWin.__JUSGOV_OUVINTE_LOCAL__ = false; } catch (_) { }
        }
        return true;
    }

    function limparTodosSubframesLocais() {
        if (conjuntoControladoresSubframes.size === 0) return 0;
        const lista = Array.from(conjuntoControladoresSubframes);
        conjuntoControladoresSubframes.clear();
        for (let i = 0; i < lista.length; i++) {
            try { lista[i].abort(); } catch (_) { }
        }
        return lista.length;
    }

    function inspecionarIframeLocal(el) {
        if (!el || el.tagName !== 'IFRAME') return false;
        try {
            if (!el.contentDocument || !el.contentWindow) {
                limparOuvintesIframeLocal(el);
                return false;
            }
            const subDoc = el.contentDocument;
            const subWin = el.contentWindow;

            /* Com allFrames: true, o Service Worker injeta o content script em cada subframe.
             * Se o subframe ja possui motor proprio ativo, remove eventual fallback anterior e aborta. */
            if (subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
                limparOuvintesIframeLocal(el);
                return false;
            }

            const regExistente = mapaSubframePorElemento.get(el);
            if (regExistente) {
                if (regExistente.subWin === subWin && regExistente.controller && !regExistente.controller.signal.aborted) {
                    return false;
                }
                limparOuvintesIframeLocal(el);
            }

            if (subWin.__JUSGOV_OUVINTE_LOCAL__) {
                return false;
            }

            const subCtrl = new AbortController();
            const subSignal = subCtrl.signal;
            conjuntoControladoresSubframes.add(subCtrl);
            mapaSubframePorElemento.set(el, { controller: subCtrl, subWin });
            subWin.__JUSGOV_OUVINTE_LOCAL__ = true;

            subSignal.addEventListener('abort', () => {
                conjuntoControladoresSubframes.delete(subCtrl);
                try { subWin.__JUSGOV_OUVINTE_LOCAL__ = false; } catch (_) { }
            }, { once: true });

            subDoc.addEventListener('selectionchange', () => {
                if (subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
                    limparOuvintesIframeLocal(el);
                    return;
                }
                tratarMudancaSelecaoGlobal(subWin);
            }, { passive: true, signal: subSignal });

            subWin.addEventListener('mousedown', (e) => {
                if (subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
                    limparOuvintesIframeLocal(el);
                    return;
                }
                aoPressionarBotaoMouse(e);
            }, { capture: true, signal: subSignal });

            subWin.addEventListener('mousemove', (e) => {
                if (subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
                    limparOuvintesIframeLocal(el);
                    return;
                }
                aoMoverMouse(e);
            }, { capture: true, passive: true, signal: subSignal });

            subWin.addEventListener('mouseup', (e) => {
                if (subWin.__JUSGOV_MOTOR_SELECAO_ATIVO__) {
                    limparOuvintesIframeLocal(el);
                    return;
                }
                aoSoltarBotaoMouse(e);
            }, { capture: true, signal: subSignal });

            /* Auto-desmontagem deterministica quando o subdocumento for descarregado sem BFCache */
            subWin.addEventListener('pagehide', (ev) => {
                if (!ev || !ev.persisted) {
                    limparOuvintesIframeLocal(el);
                }
            }, { capture: true, signal: subSignal });

            return true;
        } catch (_) {
            return false;
        }
    }

    /*
     * FUNCAO: observarFramesDinamicos
     * DIRETRIZ ROOT: Observa a adicao, navegacao e remocao dinamica de iframes, embeds ou objects
     * de visualizadores de PDF (comuns em sistemas judiciais como PJe e eproc), notifica o
     * Service Worker para garantir a injecao imediata da suite em subframes e gerencia
     * ouvintes same-origin sem vazamento de closures (BUG-01).
     */
    function observarFramesDinamicos() {
        if (observerFrames) {
            try { observerFrames.disconnect(); } catch (_) { }
            observerFrames = null;
        }
        try {
            const notificarInjecao = () => {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                        chrome.runtime.sendMessage({ acao: 'garantirInjecaoSubframes' }).catch(() => { });
                    }
                } catch (_) { }
            };

            // Inspecionar iframes ja existentes no DOM no momento da carga
            if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
                const iframesIniciais = document.querySelectorAll('iframe');
                for (let i = 0; i < iframesIniciais.length; i++) {
                    inspecionarIframeLocal(iframesIniciais[i]);
                }
            }

            observerFrames = new MutationObserver((mutations) => {
                let temFrame = false;
                let surgiuModalCritico = false;
                for (let i = 0; i < mutations.length; i++) {
                    const m = mutations[i];

                    /* Passo BUG-01.1: Desmontar ouvintes de iframes removidos fisicamente da arvore DOM */
                    const removidos = m.removedNodes;
                    if (removidos && removidos.length > 0) {
                        for (let r = 0; r < removidos.length; r++) {
                            const noRem = removidos[r];
                            if (noRem && noRem.nodeType === Node.ELEMENT_NODE) {
                                if (noRem.tagName === 'IFRAME') {
                                    limparOuvintesIframeLocal(noRem);
                                } else if (typeof noRem.getElementsByTagName === 'function') {
                                    const iframesRem = noRem.getElementsByTagName('iframe');
                                    for (let ir = 0; ir < iframesRem.length; ir++) {
                                        limparOuvintesIframeLocal(iframesRem[ir]);
                                    }
                                }
                            }
                        }
                    }

                    if (m.type === 'attributes') {
                        const t = m.target;
                        if (t && (t.tagName === 'IFRAME' || t.tagName === 'EMBED' || t.tagName === 'OBJECT')) {
                            temFrame = true;
                            if (t.tagName === 'IFRAME') {
                                limparOuvintesIframeLocal(t);
                                inspecionarIframeLocal(t);
                            }
                            break;
                        }
                    }
                    const nodes = m.addedNodes;
                    if (!nodes || nodes.length === 0) continue;
                    for (let j = 0; j < nodes.length; j++) {
                        const n = nodes[j];
                        if (n && n.nodeType === Node.ELEMENT_NODE) {
                            const tag = n.tagName;
                            /* BUG-02 e Seção 6.30: Destruicao imediata do contorno Flash e avisos de auditoria/Wiki se surgir dialogo/modal critico */
                            const temAvisoModal = Boolean(
                                validador && (
                                    (typeof validador.estaAvisoVisivel === 'function' && validador.estaAvisoVisivel()) ||
                                    validador.avisoVisivel ||
                                    validador.temporizadorAlerta
                                )
                            );
                            if (aguardandoDesselecaoFlash || timerFlashBorder || temAvisoModal) {
                                const roleAttr = (n.getAttribute && n.getAttribute('role')) || '';
                                const clsAttr = (typeof n.className === 'string') ? n.className : '';
                                if (roleAttr === 'dialog' || roleAttr === 'alertdialog' ||
                                    tag === 'MAT-DIALOG-CONTAINER' || tag === 'P-DIALOG' ||
                                    /\b(modal|rich-modalpanel|swal2-container|ui-dialog|p-dialog)\b/i.test(clsAttr) ||
                                    (typeof n.querySelector === 'function' && n.querySelector('[role="dialog"], [role="alertdialog"], .modal, .rich-modalpanel, .swal2-container, .ui-dialog, .p-dialog, mat-dialog-container'))) {
                                    surgiuModalCritico = true;
                                }
                            }
                            if (tag === 'IFRAME' || tag === 'EMBED' || tag === 'OBJECT') {
                                temFrame = true;
                                inspecionarIframeLocal(n);
                            } else if (typeof n.getElementsByTagName === 'function') {
                                const subIframes = n.getElementsByTagName('iframe');
                                if (subIframes && subIframes.length > 0) {
                                    temFrame = true;
                                    for (let k = 0; k < subIframes.length; k++) {
                                        inspecionarIframeLocal(subIframes[k]);
                                    }
                                }
                                const subEmbeds = n.getElementsByTagName('embed');
                                if (subEmbeds && subEmbeds.length > 0) {
                                    temFrame = true;
                                }
                            }
                        }
                    }
                }
                if (surgiuModalCritico) {
                    limparFlashBorderImediatamente();
                    limparAvisosAuditoriaEWikiImediatamente();
                }
                if (temFrame) {
                    notificarInjecao();
                }
            });

            const alvoObservacao = document.documentElement || document.body;
            if (alvoObservacao) {
                observerFrames.observe(alvoObservacao, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['src', 'data']
                });
            }
        } catch (_) { }
    }

    /* ==========================================================================
     * SECAO 9.9: MONITORAMENTO INTELIGENTE DE MODIFICACOES DE PAGINA (SPA & DIRTY)
     * ==========================================================================
     * Rastreia transicoes de rota em Single Page Applications (Navigation API,
     * History pushState/replaceState, hashchange) e preenchimento de formularios/
     * minutas judiciais (dirty state em inputs e contenteditables) sem causar
     * Layout Thrashing, notificando o Service Worker de forma assincrona e debounced.
     */
    let timerNotificacaoModificacao = null;
    let paginaModificadaDetectada = false;

    function notificarModificacaoPagina(motivo, urlReferencia) {
        paginaModificadaDetectada = true;
        if (timerNotificacaoModificacao) return;
        timerNotificacaoModificacao = setTimeout(() => {
            timerNotificacaoModificacao = null;
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({
                        acao: 'registrarPaginaModificada',
                        motivo: motivo || 'DIRTY',
                        urlAtual: urlReferencia || (typeof window !== 'undefined' ? window.location.href : '')
                    }).catch(() => { });
                }
            } catch (_) { }
        }, 300);
    }

    function iniciarMonitoramentoModificacoesPagina(signal) {
        try {
            if (typeof window === 'undefined') return;

            /* 1. Vetor de Roteamento SPA: Navigation API nativa */
            if (window.navigation && typeof window.navigation.addEventListener === 'function') {
                window.navigation.addEventListener('navigate', (e) => {
                    const destUrl = (e && e.destination && e.destination.url) ? e.destination.url : window.location.href;
                    notificarModificacaoPagina('SPA_NAVIGATE', destUrl);
                }, { signal });
            }

            /* 2. Vetor de Roteamento SPA: Monkey-patching seguro de History API e Hashchange */
            try {
                if (window.history && typeof window.history.pushState === 'function' && !window.__JUSGOV_HISTORY_HOOKED__) {
                    window.__JUSGOV_HISTORY_HOOKED__ = true;
                    const origPushState = window.history.pushState;
                    window.history.pushState = function (...args) {
                        const ret = origPushState.apply(this, args);
                        notificarModificacaoPagina('SPA_PUSH_STATE', window.location.href);
                        return ret;
                    };
                    const origReplaceState = window.history.replaceState;
                    window.history.replaceState = function (...args) {
                        const ret = origReplaceState.apply(this, args);
                        notificarModificacaoPagina('SPA_REPLACE_STATE', window.location.href);
                        return ret;
                    };
                }
            } catch (_) { }

            window.addEventListener('hashchange', () => {
                notificarModificacaoPagina('SPA_HASHCHANGE', window.location.href);
            }, { passive: true, signal });

            window.addEventListener('popstate', () => {
                notificarModificacaoPagina('SPA_POPSTATE', window.location.href);
            }, { passive: true, signal });

            /* 3. Vetor de Conteudo: Edicao de Formularios e Minutas (Dirty State) */
            const tratarInputModificacao = (e) => {
                const el = e.target;
                if (!el) return;
                if (el.closest && el.closest('[data-jusgov-ignore="true"]')) return;
                const tag = (el.tagName || '').toUpperCase();
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) {
                    notificarModificacaoPagina('FORM_DIRTY', window.location.href);
                }
            };
            document.addEventListener('input', tratarInputModificacao, { capture: true, passive: true, signal });
            document.addEventListener('change', tratarInputModificacao, { capture: true, passive: true, signal });

            /* 4. Vetor de Titulo de Documento (O(1), sem subtree no body) */
            const elTitle = document.querySelector('title');
            if (elTitle && typeof MutationObserver !== 'undefined') {
                const obsTitle = new MutationObserver(() => {
                    notificarModificacaoPagina('TITULO_MODIFICADO', window.location.href);
                });
                obsTitle.observe(elTitle, { childList: true, characterData: true, subtree: true });
                if (signal) {
                    signal.addEventListener('abort', () => obsTitle.disconnect());
                }
            }
        } catch (_) { }
    }

    /* ==========================================================================
     * SECAO 10: INICIALIZACAO, ABORTCONTROLLER E SINCRONIZACAO COM SERVICE WORKER
     * ========================================================================== */
    let ouvinteStorageSync = null;
    let ouvinteMensagemRuntime = null;
    let ouvintesIpcRegistrados = false;

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
        if (!ouvintesIpcRegistrados) return;
        ouvintesIpcRegistrados = false;
        try {
            if (ouvinteStorageSync && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.removeListener === 'function') {
                chrome.storage.onChanged.removeListener(ouvinteStorageSync);
            }
        } catch (_) { }
        try {
            if (ouvinteMensagemRuntime && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.removeListener === 'function') {
                chrome.runtime.onMessage.removeListener(ouvinteMensagemRuntime);
            }
        } catch (_) { }
    }

    /*
     * FUNCAO: destruirCicloVidaFrame (BUG-01)
     * OBJETIVO DE RECONSTRUCAO: Encerrar deterministicamente 100% dos listeners globais,
     * controladores de subframes (iframes same-origin), MutationObservers, timers pendentes
     * e canais IPC quando um frame/subframe for descarregado definitivamente (pagehide com
     * persisted === false) ou durante testes de homologacao, evitando retencao de closures V8.
     */
    function destruirCicloVidaFrame() {
        limparTodosSubframesLocais();
        if (controladorCicloVida) {
            try { controladorCicloVida.abort(); } catch (_) { }
            controladorCicloVida = null;
        }
        if (window.__JUSGOV_ABORT_CONTROLLER__) {
            try { window.__JUSGOV_ABORT_CONTROLLER__.abort(); } catch (_) { }
            window.__JUSGOV_ABORT_CONTROLLER__ = null;
        }
        if (observerFrames) {
            try { observerFrames.disconnect(); } catch (_) { }
            observerFrames = null;
        }
        if (observadorBlindagem) {
            try { observadorBlindagem.disconnect(); } catch (_) { }
            observadorBlindagem = null;
        }
        if (timerDebounceSelecaoGlobal) {
            clearTimeout(timerDebounceSelecaoGlobal);
            timerDebounceSelecaoGlobal = null;
        }
        if (timerFlashBorder) {
            clearTimeout(timerFlashBorder);
            timerFlashBorder = null;
        }
        if (timerCliqueDireitoColagem) {
            clearTimeout(timerCliqueDireitoColagem);
            timerCliqueDireitoColagem = null;
        }
        if (timerNotificacaoModificacao) {
            clearTimeout(timerNotificacaoModificacao);
            timerNotificacaoModificacao = null;
        }
        try { limparFlashBorderImediatamente(); } catch (_) { }
        try { limparAvisosAuditoriaEWikiImediatamente(); } catch (_) { }
        removerOuvintesIpcExtensao();
        isMousePressionado = false;
        botaoLateralEmProcessamento = 0;
        teclasPressionadasAtivas.clear();
        window.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
        return true;
    }

    /**
     * @MAPA-IA-FN: registrarListenersDOM
     * @MAPA-IA-DOM-LEITURA: document, window (mousedown, mouseup, dblclick, keydown, keyup, copy)
     */
    function registrarListenersDOM() {
        if (controladorCicloVida) {
            try { controladorCicloVida.abort(); } catch (_) { }
        }
        if (window.__JUSGOV_ABORT_CONTROLLER__) {
            try { window.__JUSGOV_ABORT_CONTROLLER__.abort(); } catch (_) { }
        }
        window.__JUSGOV_MOTOR_SELECAO_ATIVO__ = true;
        controladorCicloVida = new AbortController();
        window.__JUSGOV_ABORT_CONTROLLER__ = controladorCicloVida;
        const signal = controladorCicloVida.signal;

        signal.addEventListener('abort', () => {
            limparTodosSubframesLocais();
            if (observerFrames) {
                try { observerFrames.disconnect(); } catch (_) { }
                observerFrames = null;
            }
            if (observadorBlindagem) {
                try { observadorBlindagem.disconnect(); } catch (_) { }
                observadorBlindagem = null;
            }
            if (timerDebounceSelecaoGlobal) {
                clearTimeout(timerDebounceSelecaoGlobal);
                timerDebounceSelecaoGlobal = null;
            }
            if (timerFlashBorder) {
                clearTimeout(timerFlashBorder);
                timerFlashBorder = null;
            }
            if (timerCliqueDireitoColagem) {
                clearTimeout(timerCliqueDireitoColagem);
                timerCliqueDireitoColagem = null;
            }
            if (timerNotificacaoModificacao) {
                clearTimeout(timerNotificacaoModificacao);
                timerNotificacaoModificacao = null;
            }
        }, { once: true });

        /* Passo BUG-01.2: Desmontagem deterministica no descarregamento definitivo do frame/subframe.
         * Quando event.persisted === true (navegacao elegivel ao Back-Forward Cache / BFCache),
         * mantem os ouvintes intactos para restauracao instantanea ao voltar na aba. */
        window.addEventListener('pagehide', (e) => {
            if (!e || !e.persisted) {
                destruirCicloVidaFrame();
            }
        }, { capture: true, signal });

        /* Passo BUG-09: Restauracao deterministica no retorno via BFCache (pageshow com persisted === true).
         * Limpa travas transientes e contornos visuais congelados pela suspensao do ciclo de vida da aba. */
        window.addEventListener('pageshow', (e) => {
            if (e && e.persisted) {
                flashExclusivoSemSelecao = false;
                limparFlashBorderImediatamente();
            }
        }, { capture: true, signal, passive: true });

        blindarCSS();
        observarFramesDinamicos();
        iniciarMonitoramentoModificacoesPagina(signal);

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
                    try {
                        inp.select();
                        registrarSelecaoAtivaCampoEditavel(inp);
                    } catch (_) { }
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
        window.addEventListener('blur', ocultarInspetorTempoReal, { signal });

        /* Captura passiva e silenciosa de cópias manuais na página (Ctrl+C nativo do SO) para a Memória Interna de 2 Níveis */
        document.addEventListener('copy', () => {
            try {
                setTimeout(() => {
                    const sel = (typeof window.getSelection === 'function') ? window.getSelection().toString() : '';
                    if (sel && sel.trim().length > 0) {
                        const selLimpo = sel.replace(/([^\n\r])\r?\n([^\n\r])/g, '$1 $2').trim();
                        const atual = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                        const textoAtual = (atual && typeof atual.texto === 'string') ? atual.texto.trim() : '';
                        if (textoAtual !== selLimpo) {
                            salvarClipboardInternoComBackup({ texto: selLimpo, html: '', formatado: false });
                        }
                    }
                }, 50);
            } catch (_) { }
        }, { capture: true, signal, passive: true });

        /* FEAT-21 / VIS-01 (Seção 6.105): Captura passiva de colagem nativa (Ctrl+V / menu Colar)
         * para acionar o Marcador Permanente de Conteúdo Colado na página de origem. */
        document.addEventListener('paste', (evPaste) => {
            try {
                let txtColado = '';
                if (evPaste && evPaste.clipboardData && typeof evPaste.clipboardData.getData === 'function') {
                    txtColado = evPaste.clipboardData.getData('text/plain') || '';
                }
                confirmarColagemGlobalEMarcarPermanente(txtColado, false);
            } catch (_) { }
        }, { capture: true, signal, passive: true });
        document.addEventListener('selectionchange', () => {
            tratarMudancaSelecaoGlobal();
            if (selecaoSendoAplicadaPeloAddon) return;
            if (flashExclusivoSemSelecao) return;
            const temAvisoAtivo = Boolean(
                validador && (
                    (typeof validador.estaAvisoVisivel === 'function' && validador.estaAvisoVisivel()) ||
                    validador.avisoVisivel ||
                    validador.temporizadorAlerta
                )
            );
            if (!aguardandoDesselecaoFlash && !temAvisoAtivo) return;
            const agoraPerf = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            const tsRef = Math.max(
                timestampCriacaoFlash || 0,
                (validador && validador.timestampCriacaoAviso) ? validador.timestampCriacaoAviso : 0
            );
            if ((agoraPerf - tsRef) < 40) return;
            /* Seção 6.90 / BUG-37: No modo Até Interação (-1), o contorno visual só sai com interação humana real */
            if (tempoFlashBorderMs === -1) return;
            const selAtual = window.getSelection();
            if (!selAtual || selAtual.rangeCount === 0 || selAtual.isCollapsed || selAtual.toString().trim().length === 0) {
                agendarRetiradaFlashAposDesselecao(true);
            }
        }, { passive: true, signal });
        window.addEventListener('load', (e) => {
            const t = e.target;
            if (t && (t.tagName === 'IFRAME' || t.tagName === 'EMBED' || t.tagName === 'OBJECT')) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                        chrome.runtime.sendMessage({ acao: 'garantirInjecaoSubframes' }).catch(() => { });
                    }
                } catch (_) { }
            }
        }, { capture: true, passive: true, signal });
        document.addEventListener('mouseup', () => {
            isMousePressionado = false;
            /* Rede de seguranca: a selecao feita com o mouse (ex.: duplo clique) que ainda nao foi copiada
             * por outro caminho e copiada agora. A assinatura evita copiar duas vezes a mesma selecao. */
            setTimeout(() => {
                try { tratarMudancaSelecaoGlobal(); } catch (_) { }
            }, 200);
        }, { capture: true, passive: true, signal });
        window.addEventListener('blur', () => {
            isMousePressionado = false;
            coordsMouseDown = { x: 0, y: 0 };
            houveArrastoMouse = false;
            botaoLateralEmProcessamento = 0;
            teclasPressionadasAtivas.clear();
            /* Seção 6.90 / BUG-37: Mantém flash e seleções visuais caso configurado como 'Até Interação' */
            if (tempoFlashBorderMs !== -1) {
                agendarRetiradaFlashAposDesselecao();
            }
        }, { passive: true, signal });
        window.addEventListener('focus', () => {
            restaurarSelecaoCampoEditavelSeNecessario();
        }, { passive: true, signal });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                restaurarSelecaoCampoEditavelSeNecessario();
            }
        }, { passive: true, signal });
        /* BUG-45 / USAB-13 (Seção 6.114), USAB-14 / POS-01 (Seção 6.115) e FEAT-21 / VIS-01 (Seção 6.105):
         * Durante a rolagem da página ou de contêineres internos, reposiciona solidariamente o Contorno Visual
         * Rápido (Flash Temporizado), o Card de Conferência Automática e os Marcadores Permanentes de Conteúdo
         * Colado ancorados ao Range do texto selecionado, sem destruí-los. */
        window.addEventListener('scroll', () => {
            if (visual && typeof visual.atualizarPosicaoFlashSobRolagem === 'function') {
                visual.atualizarPosicaoFlashSobRolagem();
            }
            if (visual && typeof visual.atualizarPosicaoMarcadoresPermanentes === 'function') {
                visual.atualizarPosicaoMarcadoresPermanentes();
            }
            if (validador && typeof validador.atualizarPosicaoAlertaSobRolagem === 'function') {
                validador.atualizarPosicaoAlertaSobRolagem();
            }
        }, { capture: true, passive: true, signal });
        let ultimoPingAtividadeTrabalhoTs = 0;
        const notificarAtividadeTrabalhoThrottled = () => {
            const agora = Date.now();
            if ((agora - ultimoPingAtividadeTrabalhoTs) < 30000) return;
            ultimoPingAtividadeTrabalhoTs = agora;
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ acao: 'PING_ATIVIDADE_TRABALHO' }).catch(() => {});
                }
            } catch (_) { }
        };
        window.addEventListener('keydown', (e) => {
            window.__JUSGOV_MODO_BARALHO__ = Boolean(e.ctrlKey && e.altKey && e.shiftKey);
            notificarAtividadeTrabalhoThrottled();
        }, { capture: true, passive: true, signal });
        window.addEventListener('mousedown', notificarAtividadeTrabalhoThrottled, { capture: true, passive: true, signal });
    }

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

    function inicializarModulo() {
        registrarListenersDOM();
        sincronizarConfiguracaoMarcadorVisual();

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
                    'navegacaoTecladoCamposAtiva',
                    'caixaEntradaRapidaAtiva',
                    'validacaoMatematicaAtiva',
                    'tempoConferenciaDocumentosMs',
                    'modoExibicaoValidacao',
                    'posicaoAvisosValidacao',
                    'tempoFlashBorderMs',
                    'corFlashBorder',
                    'marcadorConteudoColadoAtivo',
                    'presetMarcadorColado',
                    'corContornoMarcadorColado',
                    'corFundoMarcadorColado',
                    'opacidadeFundoMarcadorColado',
                    'estiloBadgeMarcadorColado',
                    'tipoContornoMarcadorColado',
                    'modoRetirarSelecao',
                    'minimoCaracteresInterface',
                    'separadorAcumulador',
                    'incluirSeparadorFinalAcumulador',
                    'separadorTabelas',
                    'modoShiftCnj',
                    'promptF1Gemini',
                    'converterCabecalhoPjeAtivo',
                    'atalhoF1GeminiAtivo',
                    'ativoAmpuletas',
                    'tempoExibicaoAlertaMs',
                    'regrasMapeamentoElementos'
                ], (cfg) => {
                    if (chrome.runtime && chrome.runtime.lastError) return;
                    if (cfg) {
                        if (Array.isArray(cfg.regrasMapeamentoElementos)) {
                            definirRegrasMapeamentoElementos(cfg.regrasMapeamentoElementos);
                        }
                        if (cfg.modoTurbo) modoExecucao = cfg.modoTurbo;
                        if (Array.isArray(cfg.urlsTurbo)) listaUrlsPermitidas = cfg.urlsTurbo;
                        if (typeof cfg.manterFormatacaoBasica === 'boolean') {
                            manterFormatacaoBasica = cfg.manterFormatacaoBasica;
                        }
                        if (typeof cfg.nivelFiltroFormatacao === 'string' && ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido', 'sem_filtro'].includes(cfg.nivelFiltroFormatacao)) {
                            nivelFiltroFormatacao = cfg.nivelFiltroFormatacao;
                        }
                        if (typeof cfg.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(cfg.modoPlaceholdersMinutasHtml)) {
                            modoPlaceholdersMinutasHtml = cfg.modoPlaceholdersMinutasHtml;
                            placeholdersMinutasHtmlAtivo = (cfg.modoPlaceholdersMinutasHtml !== 'desabilitado');
                            selecaoEditavelAtiva = (cfg.modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (typeof cfg.placeholdersMinutasHtmlAtivo === 'boolean') {
                            placeholdersMinutasHtmlAtivo = cfg.placeholdersMinutasHtmlAtivo;
                            modoPlaceholdersMinutasHtml = cfg.placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                            selecaoEditavelAtiva = cfg.placeholdersMinutasHtmlAtivo;
                        } else if (typeof cfg.selecaoEditavelAtiva === 'boolean') {
                            selecaoEditavelAtiva = cfg.selecaoEditavelAtiva;
                            placeholdersMinutasHtmlAtivo = cfg.selecaoEditavelAtiva;
                            modoPlaceholdersMinutasHtml = cfg.selecaoEditavelAtiva ? 'placeholders' : 'desabilitado';
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
                        if (typeof cfg.navegacaoTecladoCamposAtiva === 'boolean') {
                            navegacaoTecladoCamposAtiva = cfg.navegacaoTecladoCamposAtiva;
                        }
                        if (typeof cfg.caixaEntradaRapidaAtiva === 'boolean') {
                            caixaEntradaRapidaAtiva = cfg.caixaEntradaRapidaAtiva;
                        }
                        /* FEAT-23 / USAB-12 (Seção 6.112): Controle Independente de Tempo da Conferência Automática */
                        if (cfg.tempoConferenciaDocumentosMs !== undefined) {
                            const tConf = Number(cfg.tempoConferenciaDocumentosMs);
                            tempoConferenciaDocumentosMs = (Number.isFinite(tConf) && (tConf === -1 || (tConf >= 0 && tConf <= 5000))) ? tConf : -1;
                            validacaoMatematicaAtiva = (tempoConferenciaDocumentosMs !== 0);
                        } else if (typeof cfg.validacaoMatematicaAtiva === 'boolean') {
                            validacaoMatematicaAtiva = cfg.validacaoMatematicaAtiva;
                            tempoConferenciaDocumentosMs = cfg.validacaoMatematicaAtiva ? -1 : 0;
                        }
                        if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                            validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
                        }
                        if (cfg.tempoFlashBorderMs !== undefined) {
                            const tFlash = Number(cfg.tempoFlashBorderMs);
                            tempoFlashBorderMs = (Number.isFinite(tFlash) && (tFlash === -1 || (tFlash >= 0 && tFlash <= 5250))) ? tFlash : -1;
                        } else if (typeof cfg.flashBorderAtivo === 'boolean') {
                            tempoFlashBorderMs = cfg.flashBorderAtivo ? -1 : 0;
                        }
                        if (typeof cfg.corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corFlashBorder.trim())) {
                            corFlashBorder = cfg.corFlashBorder.trim().toLowerCase();
                        }
                        /* FEAT-21 / VIS-01 (Seção 6.105): Configuração do Marcador Permanente de Conteúdo Colado */
                        if (typeof cfg.marcadorConteudoColadoAtivo === 'boolean') {
                            marcadorConteudoColadoAtivo = cfg.marcadorConteudoColadoAtivo;
                        }
                        if (typeof cfg.presetMarcadorColado === 'string' && cfg.presetMarcadorColado.trim()) {
                            presetMarcadorColado = cfg.presetMarcadorColado.trim();
                        }
                        if (typeof cfg.corContornoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corContornoMarcadorColado.trim())) {
                            corContornoMarcadorColado = cfg.corContornoMarcadorColado.trim().toLowerCase();
                        }
                        if (typeof cfg.corFundoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(cfg.corFundoMarcadorColado.trim())) {
                            corFundoMarcadorColado = cfg.corFundoMarcadorColado.trim().toLowerCase();
                        }
                        if (typeof cfg.opacidadeFundoMarcadorColado === 'number' && Number.isFinite(cfg.opacidadeFundoMarcadorColado)) {
                            opacidadeFundoMarcadorColado = Math.max(0.05, Math.min(0.85, cfg.opacidadeFundoMarcadorColado));
                        }
                        if (typeof cfg.estiloBadgeMarcadorColado === 'string' && ['sobrescrito', 'circular', 'chip', 'sem_etiqueta', 'translucido', 'bolinha', 'pilula'].includes(cfg.estiloBadgeMarcadorColado)) {
                            estiloBadgeMarcadorColado = cfg.estiloBadgeMarcadorColado;
                        }
                        if (typeof cfg.tipoContornoMarcadorColado === 'string' && ['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(cfg.tipoContornoMarcadorColado)) {
                            tipoContornoMarcadorColado = cfg.tipoContornoMarcadorColado;
                        }
                        sincronizarConfiguracaoMarcadorVisual();
                        if (cfg.modoRetirarSelecao !== undefined) {
                            modoRetirarSelecao = normalizarModoRetirarSelecao(cfg.modoRetirarSelecao);
                        }
                        if (cfg.minimoCaracteresInterface !== undefined) {
                            const minCar = parseInt(cfg.minimoCaracteresInterface, 10);
                            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(minCar) ? minCar : 5;
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
                        if (cfg.modoExibicaoValidacao !== undefined && validador && typeof validador.definirModoExibicaoValidacao === 'function') {
                            validador.definirModoExibicaoValidacao(cfg.modoExibicaoValidacao);
                        }
                        if (cfg.posicaoAvisosValidacao !== undefined && validador && typeof validador.definirPosicaoAvisosValidacao === 'function') {
                            validador.definirPosicaoAvisosValidacao(cfg.posicaoAvisosValidacao);
                        }
                        if (typeof cfg.separadorAcumulador === 'string') {
                            if (acumulador && typeof acumulador.definirSeparador === 'function') {
                                acumulador.definirSeparador(cfg.separadorAcumulador);
                            }
                            if (filtros && typeof filtros.definirSeparadorTabela === 'function') {
                                filtros.definirSeparadorTabela(cfg.separadorAcumulador);
                            }
                            if (typeof window !== 'undefined') {
                                window.__JUSGOV_SEPARADOR_ACUMULADOR__ = cfg.separadorAcumulador;
                            }
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
                        sincronizarFachadasModulares();
                    }
                });

                ouvinteStorageSync = (changes, area) => {
                    if (area === 'sync') {
                        if (changes.modoTurbo) modoExecucao = changes.modoTurbo.newValue;
                        if (changes.urlsTurbo) listaUrlsPermitidas = changes.urlsTurbo.newValue || [];
                        if (changes.manterFormatacaoBasica !== undefined) {
                            manterFormatacaoBasica = Boolean(changes.manterFormatacaoBasica.newValue);
                        }
                        if (changes.nivelFiltroFormatacao !== undefined && typeof changes.nivelFiltroFormatacao.newValue === 'string') {
                            nivelFiltroFormatacao = changes.nivelFiltroFormatacao.newValue;
                        }
                        if (changes.modoPlaceholdersMinutasHtml !== undefined && typeof changes.modoPlaceholdersMinutasHtml.newValue === 'string') {
                            modoPlaceholdersMinutasHtml = changes.modoPlaceholdersMinutasHtml.newValue;
                            placeholdersMinutasHtmlAtivo = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                            selecaoEditavelAtiva = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (changes.placeholdersMinutasHtmlAtivo !== undefined) {
                            placeholdersMinutasHtmlAtivo = (changes.placeholdersMinutasHtmlAtivo.newValue !== false);
                            selecaoEditavelAtiva = placeholdersMinutasHtmlAtivo;
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                            }
                        } else if (changes.selecaoEditavelAtiva !== undefined) {
                            selecaoEditavelAtiva = (changes.selecaoEditavelAtiva.newValue !== false);
                            placeholdersMinutasHtmlAtivo = selecaoEditavelAtiva;
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = selecaoEditavelAtiva ? 'placeholders' : 'desabilitado';
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
                        if (changes.navegacaoTecladoCamposAtiva !== undefined) {
                            navegacaoTecladoCamposAtiva = (changes.navegacaoTecladoCamposAtiva.newValue !== false);
                        }
                        if (changes.caixaEntradaRapidaAtiva !== undefined) {
                            caixaEntradaRapidaAtiva = (changes.caixaEntradaRapidaAtiva.newValue !== false);
                        }
                        if (changes.tempoConferenciaDocumentosMs !== undefined) {
                            const tConfNovo = Number(changes.tempoConferenciaDocumentosMs.newValue);
                            tempoConferenciaDocumentosMs = (Number.isFinite(tConfNovo) && (tConfNovo === -1 || (tConfNovo >= 0 && tConfNovo <= 5000))) ? tConfNovo : -1;
                            validacaoMatematicaAtiva = (tempoConferenciaDocumentosMs !== 0);
                            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                                validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
                            }
                        } else if (changes.validacaoMatematicaAtiva !== undefined) {
                            validacaoMatematicaAtiva = (changes.validacaoMatematicaAtiva.newValue !== false);
                            tempoConferenciaDocumentosMs = validacaoMatematicaAtiva ? -1 : 0;
                            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                                validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
                            }
                        }
                        if (changes.tempoFlashBorderMs !== undefined) {
                            const tFlashNovo = Number(changes.tempoFlashBorderMs.newValue);
                            tempoFlashBorderMs = (Number.isFinite(tFlashNovo) && (tFlashNovo === -1 || (tFlashNovo >= 0 && tFlashNovo <= 5250))) ? tFlashNovo : -1;
                        } else if (changes.flashBorderAtivo !== undefined) {
                            tempoFlashBorderMs = changes.flashBorderAtivo.newValue ? -1 : 0;
                        }
                        if (changes.corFlashBorder !== undefined && typeof changes.corFlashBorder.newValue === 'string' && /^#[0-9a-fA-F]{6}$/.test(changes.corFlashBorder.newValue.trim())) {
                            corFlashBorder = changes.corFlashBorder.newValue.trim().toLowerCase();
                        }
                        if (changes.marcadorConteudoColadoAtivo !== undefined) {
                            marcadorConteudoColadoAtivo = (changes.marcadorConteudoColadoAtivo.newValue !== false);
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.presetMarcadorColado !== undefined && typeof changes.presetMarcadorColado.newValue === 'string') {
                            presetMarcadorColado = changes.presetMarcadorColado.newValue.trim();
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.corContornoMarcadorColado !== undefined && typeof changes.corContornoMarcadorColado.newValue === 'string' && /^#[0-9a-fA-F]{6}$/.test(changes.corContornoMarcadorColado.newValue.trim())) {
                            corContornoMarcadorColado = changes.corContornoMarcadorColado.newValue.trim().toLowerCase();
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.corFundoMarcadorColado !== undefined && typeof changes.corFundoMarcadorColado.newValue === 'string' && /^#[0-9a-fA-F]{6}$/.test(changes.corFundoMarcadorColado.newValue.trim())) {
                            corFundoMarcadorColado = changes.corFundoMarcadorColado.newValue.trim().toLowerCase();
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.opacidadeFundoMarcadorColado !== undefined && typeof changes.opacidadeFundoMarcadorColado.newValue === 'number') {
                            opacidadeFundoMarcadorColado = Math.max(0.05, Math.min(0.85, changes.opacidadeFundoMarcadorColado.newValue));
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.estiloBadgeMarcadorColado !== undefined && typeof changes.estiloBadgeMarcadorColado.newValue === 'string') {
                            estiloBadgeMarcadorColado = changes.estiloBadgeMarcadorColado.newValue;
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.tipoContornoMarcadorColado !== undefined && typeof changes.tipoContornoMarcadorColado.newValue === 'string') {
                            tipoContornoMarcadorColado = changes.tipoContornoMarcadorColado.newValue;
                            sincronizarConfiguracaoMarcadorVisual();
                        }
                        if (changes.modoRetirarSelecao !== undefined) {
                            modoRetirarSelecao = normalizarModoRetirarSelecao(changes.modoRetirarSelecao.newValue);
                        }
                        if (changes.minimoCaracteresInterface !== undefined) {
                            const minCarNovo = parseInt(changes.minimoCaracteresInterface.newValue, 10);
                            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(minCarNovo) ? minCarNovo : 5;
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
                        if (changes.modoExibicaoValidacao !== undefined && validador && typeof validador.definirModoExibicaoValidacao === 'function') {
                            validador.definirModoExibicaoValidacao(changes.modoExibicaoValidacao.newValue);
                        }
                        if (changes.posicaoAvisosValidacao !== undefined && validador && typeof validador.definirPosicaoAvisosValidacao === 'function') {
                            validador.definirPosicaoAvisosValidacao(changes.posicaoAvisosValidacao.newValue);
                        }
                        if (changes.separadorAcumulador !== undefined) {
                            const sepNovo = changes.separadorAcumulador.newValue;
                            if (acumulador && typeof acumulador.definirSeparador === 'function') {
                                acumulador.definirSeparador(sepNovo);
                            }
                            if (filtros && typeof filtros.definirSeparadorTabela === 'function') {
                                filtros.definirSeparadorTabela(sepNovo);
                            }
                            if (typeof window !== 'undefined') {
                                window.__JUSGOV_SEPARADOR_ACUMULADOR__ = sepNovo;
                            }
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
                        if (changes.regrasMapeamentoElementos !== undefined && Array.isArray(changes.regrasMapeamentoElementos.newValue)) {
                            definirRegrasMapeamentoElementos(changes.regrasMapeamentoElementos.newValue);
                        }
                        sincronizarFachadasModulares();
                    }
                    if (area === 'local') {
                        if (changes.ultimoClipboardInterno && changes.ultimoClipboardInterno.newValue) {
                            window.__JUSGOV_ULTIMO_CLIPBOARD__ = changes.ultimoClipboardInterno.newValue;
                        }
                        if (changes.ultimoClipboardAnteriorInterno && changes.ultimoClipboardAnteriorInterno.newValue) {
                            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = changes.ultimoClipboardAnteriorInterno.newValue;
                        }
                        if (changes.historicoClipboardInterno && Array.isArray(changes.historicoClipboardInterno.newValue)) {
                            window.__JUSGOV_HISTORICO_CLIPBOARD__ = changes.historicoClipboardInterno.newValue.slice(0, 2);
                        }
                        /* BUG-45 / USAB-13 (Seção 6.114): Quando outra aba realiza uma nova cópia bem-sucedida,
                         * limpa o Contorno Visual Rápido (Flash Temporizado) ativo nesta aba. */
                        if (changes.ultimaNotificacaoCopiaGlobal && changes.ultimaNotificacaoCopiaGlobal.newValue) {
                            const notifCopia = changes.ultimaNotificacaoCopiaGlobal.newValue;
                            const meuId = (typeof window !== 'undefined') ? window.__JUSGOV_ID_INSTANCIA_FRAME__ : null;
                            if (notifCopia && (!meuId || notifCopia.idOrigem !== meuId)) {
                                limparFlashBorderImediatamente();
                            }
                        }
                        /* FEAT-21 / VIS-01 (Seção 6.105): Quando o texto copiado nesta aba é colado em outra aba,
                         * converte a cópia candidata em Marcador Permanente numerado e remove o Flash Temporizado. */
                        if (changes.ultimaColagemConfirmadaGlobal && changes.ultimaColagemConfirmadaGlobal.newValue) {
                            const notifColagem = changes.ultimaColagemConfirmadaGlobal.newValue;
                            const meuId = (typeof window !== 'undefined') ? window.__JUSGOV_ID_INSTANCIA_FRAME__ : null;
                            if (notifColagem && (!meuId || notifColagem.idOrigem !== meuId)) {
                                confirmarColagemGlobalEMarcarPermanente(notifColagem.texto || '', true);
                            }
                        }
                    }
                };
                chrome.storage.onChanged.addListener(ouvinteStorageSync);
                ouvintesIpcRegistrados = true;
            }

            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                ouvinteMensagemRuntime = (msg) => {
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
                        if (typeof msg.modoPlaceholdersMinutasHtml === 'string') {
                            modoPlaceholdersMinutasHtml = msg.modoPlaceholdersMinutasHtml;
                            placeholdersMinutasHtmlAtivo = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                            selecaoEditavelAtiva = (modoPlaceholdersMinutasHtml !== 'desabilitado');
                        } else if (typeof msg.placeholdersMinutasHtmlAtivo === 'boolean') {
                            placeholdersMinutasHtmlAtivo = msg.placeholdersMinutasHtmlAtivo;
                            selecaoEditavelAtiva = msg.placeholdersMinutasHtmlAtivo;
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                            }
                        } else if (typeof msg.selecaoEditavelAtiva === 'boolean') {
                            selecaoEditavelAtiva = msg.selecaoEditavelAtiva;
                            placeholdersMinutasHtmlAtivo = msg.selecaoEditavelAtiva;
                            if (modoPlaceholdersMinutasHtml !== 'avancado' && modoPlaceholdersMinutasHtml !== 'ctrl_avancado') {
                                modoPlaceholdersMinutasHtml = selecaoEditavelAtiva ? 'placeholders' : 'desabilitado';
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
                        if (typeof msg.navegacaoTecladoCamposAtiva === 'boolean') {
                            navegacaoTecladoCamposAtiva = msg.navegacaoTecladoCamposAtiva;
                        }
                        if (typeof msg.caixaEntradaRapidaAtiva === 'boolean') {
                            caixaEntradaRapidaAtiva = msg.caixaEntradaRapidaAtiva;
                        }
                        if (msg.tempoConferenciaDocumentosMs !== undefined) {
                            const tConfMsg = Number(msg.tempoConferenciaDocumentosMs);
                            tempoConferenciaDocumentosMs = (Number.isFinite(tConfMsg) && (tConfMsg === -1 || (tConfMsg >= 0 && tConfMsg <= 5000))) ? tConfMsg : -1;
                            validacaoMatematicaAtiva = (tempoConferenciaDocumentosMs !== 0);
                            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                                validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
                            }
                        } else if (typeof msg.validacaoMatematicaAtiva === 'boolean') {
                            validacaoMatematicaAtiva = msg.validacaoMatematicaAtiva;
                            tempoConferenciaDocumentosMs = validacaoMatematicaAtiva ? -1 : 0;
                            if (validador && typeof validador.definirTempoConferenciaDocumentos === 'function') {
                                validador.definirTempoConferenciaDocumentos(tempoConferenciaDocumentosMs);
                            }
                        }
                        if (msg.tempoFlashBorderMs !== undefined) {
                            const tFlashMsg = Number(msg.tempoFlashBorderMs);
                            tempoFlashBorderMs = (Number.isFinite(tFlashMsg) && (tFlashMsg === -1 || (tFlashMsg >= 0 && tFlashMsg <= 5250))) ? tFlashMsg : -1;
                        } else if (typeof msg.flashBorderAtivo === 'boolean') {
                            tempoFlashBorderMs = msg.flashBorderAtivo ? -1 : 0;
                        }
                        if (typeof msg.corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.corFlashBorder.trim())) {
                            corFlashBorder = msg.corFlashBorder.trim().toLowerCase();
                        }
                        if (typeof msg.marcadorConteudoColadoAtivo === 'boolean') {
                            marcadorConteudoColadoAtivo = msg.marcadorConteudoColadoAtivo;
                        }
                        if (typeof msg.presetMarcadorColado === 'string' && msg.presetMarcadorColado.trim()) {
                            presetMarcadorColado = msg.presetMarcadorColado.trim();
                        }
                        if (typeof msg.corContornoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.corContornoMarcadorColado.trim())) {
                            corContornoMarcadorColado = msg.corContornoMarcadorColado.trim().toLowerCase();
                        }
                        if (typeof msg.corFundoMarcadorColado === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.corFundoMarcadorColado.trim())) {
                            corFundoMarcadorColado = msg.corFundoMarcadorColado.trim().toLowerCase();
                        }
                        if (typeof msg.opacidadeFundoMarcadorColado === 'number' && Number.isFinite(msg.opacidadeFundoMarcadorColado)) {
                            opacidadeFundoMarcadorColado = Math.max(0.05, Math.min(0.85, msg.opacidadeFundoMarcadorColado));
                        }
                        if (typeof msg.estiloBadgeMarcadorColado === 'string' && ['sobrescrito', 'circular', 'chip', 'sem_etiqueta', 'translucido', 'bolinha', 'pilula'].includes(msg.estiloBadgeMarcadorColado)) {
                            estiloBadgeMarcadorColado = msg.estiloBadgeMarcadorColado;
                        }
                        if (typeof msg.tipoContornoMarcadorColado === 'string' && ['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(msg.tipoContornoMarcadorColado)) {
                            tipoContornoMarcadorColado = msg.tipoContornoMarcadorColado;
                        }
                        sincronizarConfiguracaoMarcadorVisual();
                        if (msg.modoRetirarSelecao !== undefined) {
                            modoRetirarSelecao = normalizarModoRetirarSelecao(msg.modoRetirarSelecao);
                        }
                        if (msg.minimoCaracteresInterface !== undefined) {
                            const minCarMsg = parseInt(msg.minimoCaracteresInterface, 10);
                            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(minCarMsg) ? minCarMsg : 5;
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
                        if (msg.modoExibicaoValidacao !== undefined && validador && typeof validador.definirModoExibicaoValidacao === 'function') {
                            validador.definirModoExibicaoValidacao(msg.modoExibicaoValidacao);
                        }
                        if (msg.posicaoAvisosValidacao !== undefined && validador && typeof validador.definirPosicaoAvisosValidacao === 'function') {
                            validador.definirPosicaoAvisosValidacao(msg.posicaoAvisosValidacao);
                        }
                        if (typeof msg.separadorAcumulador === 'string') {
                            if (acumulador && typeof acumulador.definirSeparador === 'function') {
                                acumulador.definirSeparador(msg.separadorAcumulador);
                            }
                            if (filtros && typeof filtros.definirSeparadorTabela === 'function') {
                                filtros.definirSeparadorTabela(msg.separadorAcumulador);
                            }
                            if (typeof window !== 'undefined') {
                                window.__JUSGOV_SEPARADOR_ACUMULADOR__ = msg.separadorAcumulador;
                            }
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
                        sincronizarFachadasModulares();
                    }
                };
                chrome.runtime.onMessage.addListener(ouvinteMensagemRuntime);
                ouvintesIpcRegistrados = true;
            }
            sincronizarFachadasModulares();
        } catch (_) { }
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
            minimoCaracteresInterface = [0, 1, 2, 3, 4, 5, 10].includes(v) ? v : 5;
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
            regrasInternasInterface = Array.isArray(regras) ? [...regras] : [];
            cacheClassificacaoCustomEl = null;
            cacheClassificacaoCustomTs = 0;
            cacheClassificacaoCustomRes = null;
        },
        obterClassificacaoRegraCustomizada,
        obterDiagnosticoElemento,
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
                regrasMapeamentoElementos: [...regrasMapeamentoElementos]
            };
        },
        blindarCSS,
        definirAtivoAmpuletas(valor) {
            ativoAmpuletas = Boolean(valor);
            blindarCSS();
        },
        isPaginaModificada() {
            return paginaModificadaDetectada;
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
            if (!ouvintesIpcRegistrados) {
                try {
                    if (ouvinteStorageSync && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                        chrome.storage.onChanged.addListener(ouvinteStorageSync);
                        ouvintesIpcRegistrados = true;
                    }
                    if (ouvinteMensagemRuntime && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                        chrome.runtime.onMessage.addListener(ouvinteMensagemRuntime);
                        ouvintesIpcRegistrados = true;
                    }
                } catch (_) { }
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
            return {
                motorAtivo: Boolean(window.__JUSGOV_MOTOR_SELECAO_ATIVO__),
                controladorAtivo: Boolean(controladorCicloVida && !controladorCicloVida.signal.aborted),
                sinalAbortado: controladorCicloVida ? Boolean(controladorCicloVida.signal.aborted) : true,
                observerFramesAtivo: Boolean(observerFrames),
                observadorBlindagemAtivo: Boolean(observadorBlindagem),
                subframesMonitoradosCount: conjuntoControladoresSubframes.size,
                ouvintesIpcRegistrados: Boolean(ouvintesIpcRegistrados)
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
        salvarClipboardInternoComBackup,
        gravarNaAreaDeTransferencia
    });
    window.JusGovCopiaSelecionar = window.JusGovMotorSelecaoTeste;
    window.JusGovMotorTestes = window.JusGovMotorSelecaoTeste;

    inicializarModulo();
})();
