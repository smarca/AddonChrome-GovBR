/* ==========================================================================
 * Nome do arquivo: options.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/options.js
 * - Natureza: Controlador Principal da Central de Configurações, Ajuda e Sandbox (options.html)
 * - Guarda de Idempotência: window.__JUSGOV_OPTIONS_CARREGADO__
 * - Persistência: chrome.storage.sync (preferências dos Grupos 1..5) e chrome.storage.local (estatísticas e buffers de clipboard simulado)
 * - Integrações: Aciona window.JusGovExecutarAuditoriaAsync / window.JusGovExecutarFuzzingAsync (debug.js) e despacha ações de guias ao Service Worker (background.js)
 * - Regras / Seções: Diretrizes 11/13/16, Seção 6.13 (options centralizado), Seção 6.19, Seção 6.63, Seção 6.64
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como ç, õ, é)
 *    no codigo ou em templates visuais; entidades HTML devem ser extirpadas,
 *    sendo admitidas exclusivamente dentro de mascaras regex ou parsers de HTML bruto.
 * 5) INTEGRIDADE FUNCIONAL E COPIA SILENCIOSA.
 * 6) SINCRONIZACAO OBRIGATORIA DE BLUE PRINT E SANDBOX: Toda alteracao de regra
 *    de negocio, mascara ou validacao deve manter obrigatoriamente atualizados e
 *    sincronizados o Blue Print (especificacao documental interna nos cabecalhos
 *    e na Central de Ajuda) e o SandBox (area de Testes interativos em
 *    options.html e bateria automatizada em debug.js), garantindo paridade entre
 *    exemplos validos e invalidos para homologacao imediata.
 * 7) REUSO ESTRITO DOS UTILITARIOS LOCAIS E MINIMIZACAO DE TOKENS IA: Todos os
 *    scripts e utilitarios criados na pasta util/ (ex: executar_auditoria.ps1,
 *    verificar_codificacao.ps1, fazer_backup.ps1) devem ser SEMPRE usados e
 *    reutilizados pelo agente em execucoes locais de automacao, testes e validacoes.
 * 8) RESOLUCAO ESTRITA DE FALHAS DE AUDITORIA: Ao receber reporte de falha na
 *    auditoria, e terminantemente proibido desativar, atenuar, suprimir ou
 *    mascarar o teste para simular aprovacao artificial. A correcao DEVE ser
 *    realizada diretamente na implementacao funcional de producao. A desativacao
 *    de uma verificacao so e admissivel se for comprovadamente impossivel de ser
 *    executada no motor ou por restricao insuperavel da plataforma, caso excepcional
 *    em que o desenvolvedor/agente deve documentar a impossibilidade e avisar
 *    expressamente o usuario.
 *
 * ==========================================================================
 * [ESPECIFICACAO FUNCIONAL E REGRAS DE NEGOCIO -- HELP BLUEPRINT PERPETUO]
 * (Espelho integral da Central de Ajuda / Options para reconstrucao mutua)
 *
 * 1. GERENCIAMENTO DE ABAS E PERSISTENCIA EM NUVEM (CHROME.STORAGE.SYNC):
 * - Controla a alternancia entre as 3 abas da pagina de Opcoes:
 *   1) "Configuracoes e Listas de Sites" (Basico Limpo + Secao Avancada)
 *   2) "Central de Ajuda (Help Blueprint)"
 *   3) "Laboratorio de Testes e Tabelas (Sandbox)"
 * - Sincroniza os controles basicos ("selectModoTurbo", "checkOpcaoRemoverFormatacoes"
 *   invertido em relacao a "manterFormatacaoBasica", "textoUrlsTurbo") e os controles
 *   avancados ("optSelecaoAutomaticaTextoEditavel", "optValidacaoMatematicaAtiva",
 *   "checkOpcaoAmpuletas", "checkFlashBorder", "optAcumuladorSeparador",
 *   "lblTotalCopias", "lblTotalAlertas").
 *
 * 2. EXPORTACAO E IMPORTACAO DE BACKUP (JSON) E RESTAURACAO DE FABRICA:
 * - Permite exportar todas as configuracoes e listas de dominios para um
 *   arquivo ".json" local e reimporta-las em outro computador.
 * - Possui botao de Restauracao de Fabrica para recuperar imediatamente as
 *   mascaras oficiais dos tribunais (".jus.br", ".gov.br", ".mp.br", ".def.br").
 *
 * 3. INSPETOR AO VIVO DO CLIPBOARD E SUITE AUTOMATIZADA DE AUDITORIA (DEBUG.JS):
 * - Atualiza em tempo real o visor "#previewAreaTransferencia" na aba Laboratorio
 *   ao clicar nos tokens de teste ou no botao "#btnAtualizarPreview".
 * - Conecta o botao "#btnExecutarAuditoriaDebug" ao motor "window.JusGovExecutarAuditoria()",
 *   exibindo o relatorio detalhado de testes diretamente no console escuro da aba Laboratorio.
 * ========================================================================== */

'use strict';

/* Passo 1.1: Padroes de fabrica imutaveis para restauracao imediata (sem <all_urls>) */
const PADROES_FABRICA_TURBO = Object.freeze([
    '*://*.jus.br/*',
    '*://*.gov.br/*',
    '*://*.mp.br/*',
    '*://*.def.br/*',
    '*://gemini.google.com/*',
    '*://serasa-judicial.serasaexperian.com.br/*'
]);

const PADROES_FABRICA_AMPULETAS = Object.freeze([
    '*://*.jus.br/*',
    '*://*.pje.jus.br/*',
    '*://pje.jus.br/*',
    '*://*pje*.jus.br/*',
    '*://*pje*.*.jus.br/*'
]);

/* Regras de Mapeamento Manual Avancado de Elementos (XPath / CSS) Padroes de Fabrica (Secao 6.20) - Padrao vazio conforme Seção 6.85 */
const PADROES_FABRICA_REGRAS_MAPEAMENTO = Object.freeze([]);

/* Passo 1.1.1: Escalas dos controles deslizantes (sliders) e limite anti-overflow de contadores */
const ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS = Object.freeze([0, 1000, 2000, 3000, 4000, 5000, -1]);
const ROTULOS_TEMPO_CONFERENCIA_DOCUMENTOS_HTML = Object.freeze([
    '0 (Desabilitado)',
    '1s',
    '2s',
    '3s',
    '4s',
    '5s',
    'Até Interação'
]);
const PRESETS_MARCADOR_CONTEUDO_COLADO = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterPresetsMarcadorColado === 'function')
    ? JusGovCfgDefaults.obterPresetsMarcadorColado()
    : Object.freeze({
        verde_forense: { corContorno: '#0d9488', corFundo: '#ccfbf1' },
        marca_texto_classico: { corContorno: '#ca8a04', corFundo: '#fef08a' },
        azul_indigo: { corContorno: '#4f46e5', corFundo: '#e0e7ff' },
        ambar_suave: { corContorno: '#d97706', corFundo: '#fef3c7' },
        alto_contraste: { corContorno: '#1e293b', corFundo: '#e2e8f0' }
    });
const COR_PADRAO_FLASH_BORDER = '#0d9488';
const COR_PADRAO_FUNDO_MARCADOR = '#ccfbf1';
const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 900000000;
const PROMPT_F1_GEMINI_PADRAO = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO === 'string')
    ? JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO
    : "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";

document.addEventListener('DOMContentLoaded', () => {
    /* Exibir versao oficial dinamica do manifesto no subtitulo do cabecalho */
    try {
        const aplicarVersao = (v) => {
            const elVersao = document.getElementById('addonVersao');
            if (elVersao && v) elVersao.textContent = v;
        };

        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
            const manifest = chrome.runtime.getManifest();
            if (manifest && (manifest.version_name || manifest.version)) {
                aplicarVersao(manifest.version_name || manifest.version);
            }
        } else if (typeof fetch === 'function') {
            fetch('../../manifest.json')
                .then(r => r.json())
                .then(manifest => {
                    if (manifest && (manifest.version_name || manifest.version)) {
                        aplicarVersao(manifest.version_name || manifest.version);
                    }
                })
                .catch(() => {});
        }
    } catch (_) { }

    /* Previne navegacao padrao em links de teste da interface */
    const linkAltDemo = document.getElementById('linkAltCliqueDemo');
    if (linkAltDemo) {
        linkAltDemo.addEventListener('click', (e) => e.preventDefault());
    }

    /* Passo 1.2: Mapear elementos DOM da pagina de Opcoes */
    const botoesAbas = document.querySelectorAll('.btn-aba');
    const paineisAbas = document.querySelectorAll('.painel-aba');

    const selectModoTurbo = document.getElementById('selectModoTurbo');
    const selectComportamentoIcone = document.getElementById('selectComportamentoIcone');
    const iconeOptionsBg = document.getElementById('iconeOptionsBg');
    const iconeOptionsRaio = document.getElementById('iconeOptionsRaio');
    const checkOpcaoRemoverFormatacoes = document.getElementById('checkOpcaoRemoverFormatacoes');
    const containerNivelFiltroEstilos = document.getElementById('containerNivelFiltroEstilos');
    const optNivelFiltroEstilos = document.getElementById('optNivelFiltroEstilos');
    const lblValorNivelFiltro = document.getElementById('lblValorNivelFiltro');
    const textoUrlsTurbo = document.getElementById('textoUrlsTurbo');

    /* Controles da Secao Avancada Categorizada */
    const selectModoPlaceholdersMinutasHtml = document.getElementById('selectModoPlaceholdersMinutasHtml');
    const optAlternarAbasRecentesCtrlTab = document.getElementById('optAlternarAbasRecentesCtrlTab');
    const optCapturaBotoesMouse4e5 = document.getElementById('optCapturaBotoesMouse4e5');
    const optColarBotaoMeio = document.getElementById('optColarBotaoMeio');
    const lblSwitchColarBotaoMeio = document.getElementById('lblSwitchColarBotaoMeio');
    const optNavegacaoTecladoCampos = document.getElementById('optNavegacaoTecladoCampos');
    const optCaixaEntradaRapida = document.getElementById('optCaixaEntradaRapida');
    const optBloquearNovasJanelas = document.getElementById('optBloquearNovasJanelas');
    const optPreservarJanelasAutenticacao = document.getElementById('optPreservarJanelasAutenticacao');
    const optAbaEmPrimeiroPlano = document.getElementById('optAbaEmPrimeiroPlano');
    const optReutilizarAbasAbertas = document.getElementById('optReutilizarAbasAbertas');
    const containerSubOpcoesReutilizarAbas = document.getElementById('containerSubOpcoesReutilizarAbas');
    const optReutilizarFocoPrimeiroPlano = document.getElementById('optReutilizarFocoPrimeiroPlano');
    const containerSubCriteriosAcoesReutilizar = document.getElementById('containerSubCriteriosAcoesReutilizar');
    const optMonitorarUrlOriginal = document.getElementById('optMonitorarUrlOriginal');
    const optMonitorarUrlAtual = document.getElementById('optMonitorarUrlAtual');
    const optProtegerGuiasModificadas = document.getElementById('optProtegerGuiasModificadas');
    const optReutilizarAcaoManter = document.getElementById('optReutilizarAcaoManter');
    const optReutilizarAcaoRecarregar = document.getElementById('optReutilizarAcaoRecarregar');
    const optReutilizarAcaoRecarregarSeModificada = document.getElementById('optReutilizarAcaoRecarregarSeModificada');
    const optReutilizarAcaoRecarregarSeNaoModificada = document.getElementById('optReutilizarAcaoRecarregarSeNaoModificada');
    const btnFecharDuplicadasAgora = document.getElementById('btnFecharDuplicadasAgora');
    const feedbackFecharDuplicadas = document.getElementById('feedbackFecharDuplicadas');
    const optCriterioOrdenacaoGuias = document.getElementById('optCriterioOrdenacaoGuias');
    const optSentidoOrdenacaoGuias = document.getElementById('optSentidoOrdenacaoGuias');
    const optSentidoOrdenacaoGuiasSwitch = document.getElementById('optSentidoOrdenacaoGuiasSwitch');
    const lblSentidoOrdenacaoGuias = document.getElementById('lblSentidoOrdenacaoGuias');
    const optOrdenarGuiasFixadas = document.getElementById('optOrdenarGuiasFixadas');
    const optFecharHierarquiaEmCascata = document.getElementById('optFecharHierarquiaEmCascata');
    const containerFecharHierarquiaCascata = document.getElementById('containerFecharHierarquiaCascata');
    const btnRestaurarOrdemGuiasPadrao = document.getElementById('btnRestaurarOrdemGuiasPadrao');
    const feedbackAcoesGuias = document.getElementById('feedbackAcoesGuias');
    const optModoBarraFavoritosSuperior = document.getElementById('optModoBarraFavoritosSuperior');
    const btnRestaurarBarraFerramentasPadrao = document.getElementById('btnRestaurarBarraFerramentasPadrao');
    const btnAbrirAparenciaChrome = document.getElementById('btnAbrirAparenciaChrome');
    const feedbackAparenciaChrome = document.getElementById('feedbackAparenciaChrome');
    const btnTestarCaixaEntradaRapida = document.getElementById('btnTestarCaixaEntradaRapida');
    const btnTestarAdicaoManualMapeamento = document.getElementById('btnTestarAdicaoManualMapeamento');
    const optDescarteGuiasInativas = document.getElementById('optDescarteGuiasInativas');
    const containerOpcoesDescarte = document.getElementById('containerOpcoesDescarte');
    const optTempoInatividadeDescarteMinutos = document.getElementById('optTempoInatividadeDescarteMinutos');
    const btnDescartarGuiasInativasAgora = document.getElementById('btnDescartarGuiasInativasAgora');
    const feedbackDescarteGuias = document.getElementById('feedbackDescarteGuias');
    const optValidacaoMatematicaAtiva = document.getElementById('optValidacaoMatematicaAtiva');
    const optTempoConferenciaDocumentos = document.getElementById('optTempoConferenciaDocumentos');
    const lblValorTempoConferencia = document.getElementById('lblValorTempoConferencia');
    const optModoExibicaoValidacao = document.getElementById('optModoExibicaoValidacao');
    const containerModoExibicaoValidacao = document.getElementById('containerModoExibicaoValidacao');
    const optPosicaoAvisosValidacao = document.getElementById('optPosicaoAvisosValidacao');
    const containerPosicaoAvisosValidacao = document.getElementById('containerPosicaoAvisosValidacao');
    const checkOpcaoAmpuletas = document.getElementById('checkOpcaoAmpuletas');
    const optConverterCabecalhoPje = document.getElementById('optConverterCabecalhoPje');
    const optTempoFlashMs = document.getElementById('optTempoFlashMs');
    const optCorFlashBorder = document.getElementById('optCorFlashBorder');
    const previewFlashBorderExemplo = document.getElementById('previewFlashBorderExemplo');
    const lblValorTempoFlash = document.getElementById('lblValorTempoFlash');
    const optMarcadorConteudoColadoAtivo = document.getElementById('optMarcadorConteudoColadoAtivo');
    const painelCustomizacaoMarcadorColado = document.getElementById('painelCustomizacaoMarcadorColado');
    const optPresetMarcadorColado = document.getElementById('optPresetMarcadorColado');
    const optTipoContornoMarcadorColado = document.getElementById('optTipoContornoMarcadorColado');
    const optCorContornoMarcadorColado = document.getElementById('optCorContornoMarcadorColado');
    const optCorFundoMarcadorColado = document.getElementById('optCorFundoMarcadorColado');
    const optEstiloBadgeMarcadorColado = document.getElementById('optEstiloBadgeMarcadorColado');
    const previewMarcadorColadoExemplo = document.getElementById('previewMarcadorColadoExemplo');
    const previewMarcadorColadoBadge = document.getElementById('previewMarcadorColadoBadge');
    const optModoRetirarSelecao = document.getElementById('optModoRetirarSelecao');
    const optMinimoCaracteresInterface = document.getElementById('optMinimoCaracteresInterface');
    const optAcumuladorSeparador = document.getElementById('optAcumuladorSeparador');
    const optAtalhoF1GeminiAtivo = document.getElementById('optAtalhoF1GeminiAtivo');
    const optPromptF1Gemini = document.getElementById('optPromptF1Gemini');
    const btnRestaurarPromptF1Padrao = document.getElementById('btnRestaurarPromptF1Padrao');
    const containerSubOpcaoJanelaUnica = document.getElementById('containerSubOpcaoJanelaUnica');
    const containerSubOpcaoF1Gemini = document.getElementById('containerSubOpcaoF1Gemini');
    const containerSubControlesOrdenacao = document.getElementById('containerSubControlesOrdenacao');
    const lblTotalCopias = document.getElementById('lblTotalCopias');
    const lblTotalAlertas = document.getElementById('lblTotalAlertas');
    const lblDataInicioContadores = document.getElementById('lblDataInicioContadores');
    const btnResetarEstatisticas = document.getElementById('btnResetarEstatisticas');

    /* Privacidade e Produtividade (Secoes 6.141 e 6.142) */
    const optAutoLimpezaCacheCookiesAtiva = document.getElementById('optAutoLimpezaCacheCookiesAtiva');
    const optAutoLimpezaIdade = document.getElementById('optAutoLimpezaIdade');
    const btnExecutarLimpezaCacheAgora = document.getElementById('btnExecutarLimpezaCacheAgora');
    const lblStatusLimpezaCache = document.getElementById('lblStatusLimpezaCache');
    const optTempoTrabalhoCorridoAtivo = document.getElementById('optTempoTrabalhoCorridoAtivo');
    const optTempoTrabalhoCorridoHoras = document.getElementById('optTempoTrabalhoCorridoHoras');
    const optTempoTrabalhoAtivoAtivo = document.getElementById('optTempoTrabalhoAtivoAtivo');
    const optTempoTrabalhoAtivoHoras = document.getElementById('optTempoTrabalhoAtivoHoras');
    const optPomodoroAtivo = document.getElementById('optPomodoroAtivo');
    const optPomodoroProporcao = document.getElementById('optPomodoroProporcao');
    const optPomodoroFocoMinutos = document.getElementById('optPomodoroFocoMinutos');
    const lblPomodoroAlivioCalculado = document.getElementById('lblPomodoroAlivioCalculado');
    const optPomodoroCiclos = document.getElementById('optPomodoroCiclos');
    const lblPomodoroPausaMaiorCalculada = document.getElementById('lblPomodoroPausaMaiorCalculada');
    const optPomodoroModoAviso = document.getElementById('optPomodoroModoAviso');
    const optPomodoroPausasAutomaticas = document.getElementById('optPomodoroPausasAutomaticas');
    const painelConfigPomodoro = document.getElementById('painelConfigPomodoro');
    const lblStatusProdutividadeTrabalho = document.getElementById('lblStatusProdutividadeTrabalho');
    const lblStatusPomodoroDetalhado = document.getElementById('lblStatusPomodoroDetalhado');
    const btnResetarContadoresTrabalho = document.getElementById('btnResetarContadoresTrabalho');

    /* Botoes de Persistencia e Backup */
    const btnSalvarConfiguracoes = document.getElementById('btnSalvarConfiguracoes');
    const btnRestaurarPadroes = document.getElementById('btnRestaurarPadroes');
    const btnExportarJson = document.getElementById('btnExportarJson');
    const btnImportarJson = document.getElementById('btnImportarJson');
    const inputImportarArquivo = document.getElementById('inputImportarArquivo');

    /* Perfis de Uso e Modais de Confirmacao / Gerenciamento (FEAT-35) */
    const configuradorPerfis = (typeof JusGovConfiguracoes === 'function') ? new JusGovConfiguracoes() : null;
    const selectPerfilAtivo = document.getElementById('selectPerfilAtivo');
    const btnNovoPerfil = document.getElementById('btnNovoPerfil');
    const btnRenomearPerfil = document.getElementById('btnRenomearPerfil');
    const btnExcluirPerfil = document.getElementById('btnExcluirPerfil');
    const modalConfirmarResetPerfis = document.getElementById('modalConfirmarResetPerfis');
    const lblNomePerfilModalReset = document.getElementById('lblNomePerfilModalReset');
    const btnResetPerfilAtual = document.getElementById('btnResetPerfilAtual');
    const btnResetTodosPerfis = document.getElementById('btnResetTodosPerfis');
    const btnResetCancelar = document.getElementById('btnResetCancelar');
    const modalGerenciarPerfil = document.getElementById('modalGerenciarPerfil');
    const tituloModalGerenciarPerfil = document.getElementById('tituloModalGerenciarPerfil');
    const inputNomePerfilModal = document.getElementById('inputNomePerfilModal');
    const containerOrigemNovoPerfil = document.getElementById('containerOrigemNovoPerfil');
    const selectOrigemNovoPerfil = document.getElementById('selectOrigemNovoPerfil');
    const btnConfirmarGerenciarPerfil = document.getElementById('btnConfirmarGerenciarPerfil');
    const btnCancelarGerenciarPerfil = document.getElementById('btnCancelarGerenciarPerfil');
    let cacheListaPerfis = [];
    let cachePerfilAtivoId = 'padrao';
    let modoModalGerenciarPerfil = 'criar';

    function obterNomePerfilAtivo() {
        const encontrado = cacheListaPerfis.find(p => p && p.id === cachePerfilAtivoId);
        return (encontrado && encontrado.nome) ? encontrado.nome : 'Padrão';
    }

    function atualizarBarraPerfisUI(listaPerfis, perfilAtivoId) {
        if (Array.isArray(listaPerfis) && listaPerfis.length > 0) {
            cacheListaPerfis = listaPerfis;
        }
        cachePerfilAtivoId = String(perfilAtivoId || cachePerfilAtivoId || 'padrao');
        if (selectPerfilAtivo && cacheListaPerfis.length > 0) {
            selectPerfilAtivo.replaceChildren();
            cacheListaPerfis.forEach((perfil) => {
                if (!perfil || !perfil.id) return;
                const opt = document.createElement('option');
                opt.value = perfil.id;
                opt.textContent = perfil.nome || perfil.id;
                selectPerfilAtivo.appendChild(opt);
            });
            selectPerfilAtivo.value = cachePerfilAtivoId;
            if (selectPerfilAtivo.value !== cachePerfilAtivoId && selectPerfilAtivo.options.length > 0) {
                selectPerfilAtivo.selectedIndex = 0;
                cachePerfilAtivoId = selectPerfilAtivo.value;
            }
        }
        const perfilSelecionado = cacheListaPerfis.find(p => p && p.id === cachePerfilAtivoId);
        const ehPredefinido = !perfilSelecionado || perfilSelecionado.predefinido === true;
        if (btnRenomearPerfil) {
            btnRenomearPerfil.disabled = ehPredefinido;
            btnRenomearPerfil.style.display = ehPredefinido ? 'none' : '';
            btnRenomearPerfil.title = ehPredefinido ? '' : 'Renomear perfil atual';
        }
        if (btnExcluirPerfil) {
            btnExcluirPerfil.disabled = ehPredefinido;
            btnExcluirPerfil.style.display = ehPredefinido ? 'none' : '';
            btnExcluirPerfil.title = ehPredefinido ? '' : 'Excluir perfil atual';
        }
    }

    /* Delegacao Modular (SRP/DIP): Mapeamento Manual (options-mapeamento.js) e Laboratorio/Console (options-laboratorio.js) */
    const detalhesMapeamentoXPath = document.getElementById('detalhesMapeamentoXPath');
    const toastNotificacao = document.getElementById('toastNotificacao');
    let timerToast = null;

    const moduloMapeamento = (typeof window !== 'undefined' && typeof window.JusGovOptionsMapeamento === 'function')
        ? new window.JusGovOptionsMapeamento()
        : {
            inicializar: () => { },
            renderizarLista: () => { },
            obterRegrasAtuais: () => [...PADROES_FABRICA_REGRAS_MAPEAMENTO],
            adicionarRegrasESalvar: () => false,
            salvarRegras: () => { }
        };
    const renderizarListaRegrasMapeamento = (regras, somenteLeitura = false) => moduloMapeamento.renderizarLista(regras, somenteLeitura);

    const moduloLaboratorio = (typeof window !== 'undefined' && typeof window.JusGovOptionsLaboratorio === 'function')
        ? new window.JusGovOptionsLaboratorio()
        : {
            instalarInterceptadorConsole: () => { },
            inicializar: () => { },
            atualizarCoresEBotoesClipboard: () => { },
            atualizarVisualAtencaoSwitches: () => { },
            atualizarVisorClipboardPassivo: () => { },
            acionarLeituraClipboardComPrompt: async () => { },
            obterEstadoPermissaoClipboard: async () => 'granted',
            estaLendoManualmente: () => false
        };
    moduloLaboratorio.instalarInterceptadorConsole();
    const atualizarCoresEBotoesClipboard = () => moduloLaboratorio.atualizarCoresEBotoesClipboard();
    const atualizarVisualAtencaoSwitches = () => moduloLaboratorio.atualizarVisualAtencaoSwitches();
    const atualizarVisorClipboardPassivo = () => moduloLaboratorio.atualizarVisorClipboardPassivo();
    const acionarLeituraClipboardComPrompt = (e) => moduloLaboratorio.acionarLeituraClipboardComPrompt(e);
    const obterEstadoPermissaoClipboard = () => moduloLaboratorio.obterEstadoPermissaoClipboard();

    /*
     * FUNCAO: adicionarOuvinteSeguro
     * OBJETIVO DE RECONSTRUCAO: Blindar o registro de eventos contra elementos nulos.
     */
    function adicionarOuvinteSeguro(elemento, evento, callback) {
        /* Passo 1.3: Verificar existencia fisica do no DOM antes de registrar o listener */
        if (elemento && typeof elemento.addEventListener === 'function') {
            elemento.addEventListener(evento, callback);
        }
    }

    /*
     * FUNCAO: exibirToast
     * OBJETIVO DE RECONSTRUCAO: Mostrar confirmacao visual discreta no canto
     * inferior direito da pagina de Opcoes apos salvar, importar ou restaurar.
     * Utiliza .textContent (Diretriz anti-XSS DOM).
     */
    function exibirToast(mensagem) {
        /* Passo 2.1: Atualizar texto puro e exibir toast por 3 segundos */
        if (!toastNotificacao) return;
        if (timerToast) clearTimeout(timerToast);

        toastNotificacao.textContent = String(mensagem ?? '');
        toastNotificacao.classList.add('visivel');
        timerToast = setTimeout(() => {
            toastNotificacao.classList.remove('visivel');
        }, 3000);
    }

    moduloMapeamento.inicializar({ adicionarOuvinteSeguro, exibirToast });
    moduloLaboratorio.inicializar({ adicionarOuvinteSeguro, exibirToast });

    function ativarAbaPorId(idAlvo) {
        if (!idAlvo) return;
        const btn = Array.from(botoesAbas).find(b => b.getAttribute('data-aba') === idAlvo);
        if (btn) {
            botoesAbas.forEach(b => b.classList.remove('ativa'));
            paineisAbas.forEach(p => p.classList.remove('ativa'));
            btn.classList.add('ativa');
            const painel = document.getElementById(idAlvo);
            if (painel) painel.classList.add('ativa');
            if (idAlvo === 'abaLaboratorio') {
                atualizarVisorClipboardPassivo();
            }
        }
    }

    /*
     * FUNCAO: configurarNavegacaoAbas
     * OBJETIVO DE RECONSTRUCAO: Alternar entre Configuracoes, Central de Ajuda
     * e Laboratorio de Testes sem recarregar a pagina, com suporte ao Casulo SEC-01.
     */
    function configurarNavegacaoAbas() {
        /* Passo 2.2: Vincular clique em cada botao de aba */
        botoesAbas.forEach(btn => {
            btn.addEventListener('click', () => {
                const idAlvo = btn.getAttribute('data-aba');
                ativarAbaPorId(idAlvo);
            });
        });

        /* Roteamento Casulo SEC-01 / Seção 6.106: Seleciona aba solicitada via query (?config, ?ajuda, ?lab) ou hash */
        try {
            let abaInicial = null;
            if (typeof JusGovBlockAddon !== 'undefined' && typeof JusGovBlockAddon.aplicarCasulo === 'function') {
                abaInicial = JusGovBlockAddon.aplicarCasulo(window);
            }
            if (abaInicial && abaInicial !== 'abaConfiguracoes') {
                ativarAbaPorId(abaInicial);
            }
        } catch (_) { }
    }

    function atualizarIconeModoOptions(modoAtivo) {
        if (!iconeOptionsBg || !iconeOptionsRaio) return;
        if (modoAtivo === 'url') {
            iconeOptionsBg.setAttribute('fill', '#1a73e8');
            iconeOptionsBg.setAttribute('stroke', '#1557b0');
            iconeOptionsRaio.setAttribute('fill', '#fbbc04');
        } else if (modoAtivo === 'desligado') {
            iconeOptionsBg.setAttribute('fill', '#64748b');
            iconeOptionsBg.setAttribute('stroke', '#475569');
            iconeOptionsRaio.setAttribute('fill', '#cbd5e1');
        } else {
            iconeOptionsBg.setAttribute('fill', '#10b981');
            iconeOptionsBg.setAttribute('stroke', '#059669');
            iconeOptionsRaio.setAttribute('fill', '#fef08a');
        }
    }

    function converterMsParaIndiceSliderConferencia(msBruto) {
        const valor = Number(msBruto);
        if (!Number.isFinite(valor)) return 6;
        if (valor === -1) return 6;
        if (valor <= 0) return 0;
        const idxExato = ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS.indexOf(valor);
        if (idxExato !== -1) return idxExato;
        let melhorIdx = 6;
        let menorDif = Infinity;
        for (let i = 1; i < ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS.length; i++) {
            if (ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS[i] === -1) continue;
            const dif = Math.abs(ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS[i] - valor);
            if (dif < menorDif) {
                menorDif = dif;
                melhorIdx = i;
            }
        }
        return melhorIdx;
    }

    function obterTempoConferenciaMsDoSlider() {
        if (!optTempoConferenciaDocumentos) {
            return (optValidacaoMatematicaAtiva && !optValidacaoMatematicaAtiva.checked) ? 0 : -1;
        }
        const idx = parseInt(optTempoConferenciaDocumentos.value, 10);
        if (Number.isInteger(idx) && idx >= 0 && idx < ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS.length) {
            return ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS[idx];
        }
        return -1;
    }

    function atualizarRotuloSliderConferencia() {
        if (!lblValorTempoConferencia || !optTempoConferenciaDocumentos) return;
        const idx = parseInt(optTempoConferenciaDocumentos.value, 10);
        const idxSeguro = (Number.isInteger(idx) && idx >= 0 && idx < ROTULOS_TEMPO_CONFERENCIA_DOCUMENTOS_HTML.length) ? idx : 6;
        lblValorTempoConferencia.textContent = ROTULOS_TEMPO_CONFERENCIA_DOCUMENTOS_HTML[idxSeguro];
    }

    function normalizarCorHexFundoMarcador(corBruta) {
        if (typeof corBruta === 'string' && /^#[0-9a-fA-F]{6}$/.test(corBruta.trim())) {
            return corBruta.trim().toLowerCase();
        }
        return COR_PADRAO_FUNDO_MARCADOR;
    }

    function normalizarPresetMarcadorColado(val) {
        const v = String(val || '').trim().toLowerCase();
        if (PRESETS_MARCADOR_CONTEUDO_COLADO[v]) return v;
        return 'verde_forense';
    }

    function normalizarEstiloBadgeMarcadorColado(val) {
        const v = String(val || '').trim().toLowerCase();
        const lista = (typeof JusGovConstantes !== 'undefined' && Array.isArray(JusGovConstantes.ESTILOS_BADGE_MARCADOR_COLADO))
            ? JusGovConstantes.ESTILOS_BADGE_MARCADOR_COLADO
            : ['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto', 'apenas_numeral'];
        if (lista.includes(v)) return v;
        return 'sobrescrito';
    }

    function normalizarModoAvisoPomodoro(val) {
        const v = String(val || '').trim().toLowerCase();
        const lista = (typeof JusGovConstantes !== 'undefined' && Array.isArray(JusGovConstantes.MODOS_AVISO_POMODORO))
            ? JusGovConstantes.MODOS_AVISO_POMODORO
            : ['modal', 'badge', 'barra_descanso', 'barra_sempre', 'badge_e_barra_descanso', 'completo'];
        if (lista.includes(v)) return v;
        return 'completo';
    }

    function normalizarTipoContornoMarcadorColado(val) {
        const v = String(val || '').trim().toLowerCase();
        if (['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(v)) return v;
        return 'solido';
    }

    function atualizarPreviewsVisuaisMarcadorEFlash() {
        const corFlash = optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : '#0d9488';
        if (previewFlashBorderExemplo) {
            previewFlashBorderExemplo.style.borderColor = corFlash;
            const r = parseInt(corFlash.slice(1, 3), 16) || 13;
            const g = parseInt(corFlash.slice(3, 5), 16) || 148;
            const b = parseInt(corFlash.slice(5, 7), 16) || 136;
            previewFlashBorderExemplo.style.background = `rgba(${r}, ${g}, ${b}, 0.14)`;
        }
        const corBorda = optCorContornoMarcadorColado ? normalizarCorHex(optCorContornoMarcadorColado.value) : '#0d9488';
        const corFundo = optCorFundoMarcadorColado ? normalizarCorHexFundoMarcador(optCorFundoMarcadorColado.value) : '#ccfbf1';
        const tipoContorno = optTipoContornoMarcadorColado ? normalizarTipoContornoMarcadorColado(optTipoContornoMarcadorColado.value) : 'solido';
        const estiloBadge = optEstiloBadgeMarcadorColado ? normalizarEstiloBadgeMarcadorColado(optEstiloBadgeMarcadorColado.value) : 'sobrescrito';
        if (previewMarcadorColadoExemplo) {
            const rf = parseInt(corFundo.slice(1, 3), 16) || 204;
            const gf = parseInt(corFundo.slice(3, 5), 16) || 251;
            const bf = parseInt(corFundo.slice(5, 7), 16) || 241;
            previewMarcadorColadoExemplo.style.background = `rgba(${rf}, ${gf}, ${bf}, 0.36)`;
            previewMarcadorColadoExemplo.style.textDecoration = tipoContorno === 'taxado' ? `line-through 2px ${corBorda}` : (tipoContorno === 'ondulado' ? `underline wavy ${corBorda}` : 'none');
            if (tipoContorno === 'sem_borda' || tipoContorno === 'ondulado' || tipoContorno === 'taxado') {
                previewMarcadorColadoExemplo.style.border = '1.5px solid transparent';
            } else if (tipoContorno === 'tracejado') {
                previewMarcadorColadoExemplo.style.border = `1.5px dashed ${corBorda}`;
            } else {
                previewMarcadorColadoExemplo.style.border = `1.5px solid ${corBorda}`;
            }
        }
        if (previewMarcadorColadoBadge) {
            if (estiloBadge === 'sem_etiqueta') {
                previewMarcadorColadoBadge.style.display = 'none';
            } else {
                const rb = parseInt(corBorda.slice(1, 3), 16) || 13;
                const gb = parseInt(corBorda.slice(3, 5), 16) || 148;
                const bb = parseInt(corBorda.slice(5, 7), 16) || 136;
                previewMarcadorColadoBadge.style.display = 'inline-flex';
                previewMarcadorColadoBadge.style.borderRadius = '999px';
                previewMarcadorColadoBadge.style.minWidth = '15px';
                previewMarcadorColadoBadge.style.height = '15px';
                previewMarcadorColadoBadge.style.padding = '0 3.5px';
                previewMarcadorColadoBadge.style.fontSize = '9px';
                previewMarcadorColadoBadge.textContent = '1';
                previewMarcadorColadoBadge.style.borderStyle = 'solid';
                previewMarcadorColadoBadge.style.borderWidth = '1px';
                previewMarcadorColadoBadge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
                const ehRetangular = estiloBadge.startsWith('retangular_') || estiloBadge === 'sobrescrito_retangular';
                previewMarcadorColadoBadge.style.borderRadius = ehRetangular ? '3px' : '999px';
                if (estiloBadge === 'apenas_numeral') {
                    previewMarcadorColadoBadge.style.border = 'none';
                    previewMarcadorColadoBadge.style.borderRadius = '0';
                    previewMarcadorColadoBadge.style.background = 'transparent';
                    previewMarcadorColadoBadge.style.boxShadow = 'none';
                    previewMarcadorColadoBadge.style.minWidth = 'auto';
                    previewMarcadorColadoBadge.style.height = 'auto';
                    previewMarcadorColadoBadge.style.padding = '0 1px';
                    previewMarcadorColadoBadge.style.fontSize = '10px';
                    previewMarcadorColadoBadge.style.color = corBorda;
                    previewMarcadorColadoBadge.style.opacity = '1';
                } else if (estiloBadge === 'circular' || estiloBadge === 'retangular_compacto') {
                    previewMarcadorColadoBadge.style.borderColor = corBorda;
                    previewMarcadorColadoBadge.style.color = '#ffffff';
                    previewMarcadorColadoBadge.style.background = corBorda;
                    previewMarcadorColadoBadge.style.opacity = '1';
                } else if (estiloBadge === 'translucido' || estiloBadge === 'retangular_translucido') {
                    previewMarcadorColadoBadge.style.borderColor = `rgba(${rb}, ${gb}, ${bb}, 0.45)`;
                    previewMarcadorColadoBadge.style.color = corBorda;
                    previewMarcadorColadoBadge.style.background = `rgba(${rb}, ${gb}, ${bb}, 0.16)`;
                    previewMarcadorColadoBadge.style.opacity = '0.82';
                } else {
                    previewMarcadorColadoBadge.style.borderColor = corBorda;
                    previewMarcadorColadoBadge.style.color = corBorda;
                    previewMarcadorColadoBadge.style.background = 'rgba(255,255,255,0.88)';
                    previewMarcadorColadoBadge.style.opacity = '1';
                }
            }
        }
    }

    function atualizarVisibilidadeSubOpcoesMarcadorColado() {
        const ativo = optMarcadorConteudoColadoAtivo ? optMarcadorConteudoColadoAtivo.checked : true;
        if (optPresetMarcadorColado) optPresetMarcadorColado.disabled = !ativo;
        if (optTipoContornoMarcadorColado) optTipoContornoMarcadorColado.disabled = !ativo;
        if (optCorContornoMarcadorColado) optCorContornoMarcadorColado.disabled = !ativo;
        if (optCorFundoMarcadorColado) optCorFundoMarcadorColado.disabled = !ativo;
        if (optEstiloBadgeMarcadorColado) optEstiloBadgeMarcadorColado.disabled = !ativo;
        if (painelCustomizacaoMarcadorColado) {
            painelCustomizacaoMarcadorColado.style.opacity = ativo ? '1' : '0.45';
            painelCustomizacaoMarcadorColado.style.pointerEvents = ativo ? 'auto' : 'none';
        }
        atualizarPreviewsVisuaisMarcadorEFlash();
    }

    function atualizarCalculoPomodoroUI() {
        const ativo = optPomodoroAtivo ? optPomodoroAtivo.checked : false;
        const proporcao = optPomodoroProporcao ? (Number(optPomodoroProporcao.value) || 4.5) : 4.5;
        const foco = optPomodoroFocoMinutos ? (Number(optPomodoroFocoMinutos.value) || 25) : 25;
        const ciclos = optPomodoroCiclos ? (Number(optPomodoroCiclos.value) || 4) : 4;
        const alivio = Math.max(1, Math.round(foco / proporcao));
        const pausaMaior = Math.max(1, Math.round(alivio * ciclos));
        if (lblPomodoroAlivioCalculado) lblPomodoroAlivioCalculado.textContent = `${alivio} min`;
        if (lblPomodoroPausaMaiorCalculada) lblPomodoroPausaMaiorCalculada.textContent = `${pausaMaior} min`;
        if (painelConfigPomodoro) {
            painelConfigPomodoro.style.opacity = ativo ? '1' : '0.5';
            painelConfigPomodoro.style.pointerEvents = ativo ? 'auto' : 'none';
        }
    }

    function formatarMinutosHHMM(totalMin) {
        const mTotal = Math.max(0, Math.floor(Number(totalMin) || 0));
        const hh = String(Math.floor(mTotal / 60)).padStart(2, '0');
        const mm = String(mTotal % 60).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    function atualizarStatusProdutividadeUI() {
        if (!lblStatusProdutividadeTrabalho || typeof chrome === 'undefined') return;
        const renderizarEstado = (st, resumo = null) => {
            if (!st) return;
            const dataStr = st.data ? ` (${st.data})` : '';
            const corridoMin = Math.max(0, Math.floor(Number(st.corridoMinutos) || 0));
            const ativoMin = Math.max(0, Math.floor(Number(st.ativoMinutos) || 0));
            const pausas = Math.max(0, Math.floor(Number(st.pausasConfirmadas) || 0));
            const partes = [`Hoje${dataStr} — Tempo: Corrido ${formatarMinutosHHMM(corridoMin)}`];
            if (ativoMin !== corridoMin) {
                partes.push(`Ativo ${formatarMinutosHHMM(ativoMin)}`);
            }
            if (pausas !== 0) {
                partes.push(`Pausas ${pausas}`);
            }
            lblStatusProdutividadeTrabalho.textContent = partes.join(' • ');

            if (lblStatusPomodoroDetalhado) {
                if (optPomodoroAtivo && optPomodoroAtivo.checked) {
                    const focoCfg = optPomodoroFocoMinutos ? (Number(optPomodoroFocoMinutos.value) || 25) : 25;
                    const propCfg = optPomodoroProporcao ? (Number(optPomodoroProporcao.value) || 4.5) : 4.5;
                    const ciclosCfg = optPomodoroCiclos ? (Number(optPomodoroCiclos.value) || 4) : 4;
                    const alivioCfg = Math.max(1, Math.round(focoCfg / propCfg));
                    const pausaMaiorCfg = Math.max(1, Math.round(alivioCfg * ciclosCfg));
                    const fase = (resumo && resumo.fase) || st.pomodoroFase || 'foco';
                    const minNaFase = (resumo && typeof resumo.minutosNaFase === 'number') ? resumo.minutosNaFase : Math.max(0, Math.floor(Number(st.pomodoroMinutosNaFase || 0)));
                    const ciclosMax = (resumo && resumo.ciclosMax) || ciclosCfg;
                    const cicloAtual = (resumo && resumo.cicloAtual) || (fase === 'foco' ? Math.min(ciclosMax, (st.pomodoroCicloAtual || 0) + 1) : Math.max(1, Math.min(ciclosMax, st.pomodoroCicloAtual || 1)));
                    const emDescanso = (fase === 'alivio' || fase === 'pausa_maior');
                    const descansoPendente = resumo ? Boolean(resumo.descansoPendente) : Boolean(st.pomodoroDescansoPendente || (emDescanso && !st.pomodoroDescansoRealizadoNoCiclo));
                    const descansoRealizado = resumo ? Boolean(resumo.descansoRealizado) : Boolean(st.pomodoroDescansoRealizadoNoCiclo && !descansoPendente);

                    const filhos = [];
                    const addItem = (texto, estilo = '') => {
                        const sp = document.createElement('span');
                        sp.textContent = texto;
                        if (estilo) sp.style.cssText = estilo;
                        filhos.push(sp);
                    };
                    const addSep = () => addItem('•', 'opacity:0.5;');

                    addItem(`🍅 Pomodoro: Foco ${fase === 'foco' ? `${minNaFase}/${focoCfg}` : `${focoCfg}/${focoCfg}`} min`, 'font-weight:600;color:var(--texto-principal);');
                    if (fase === 'alivio') {
                        addSep();
                        addItem(`Alívio em andamento: ${minNaFase}/${alivioCfg} min`, 'font-weight:600;color:#0284c7;');
                    } else if (fase === 'pausa_maior') {
                        addSep();
                        addItem(`Descanso em andamento: ${minNaFase}/${pausaMaiorCfg} min`, 'font-weight:600;color:#0284c7;');
                    }
                    addSep();
                    addItem(`Ciclo ${cicloAtual}/${ciclosMax}`);
                    addSep();
                    if (descansoPendente) {
                        addItem('Descanso do ciclo: Pendente', 'font-weight:700;color:#dc2626;');
                    } else if (descansoRealizado) {
                        addItem('Descanso do ciclo: Realizado', 'font-weight:700;color:#0d9488;');
                    } else {
                        addItem('Descanso do ciclo: Aguardando foco', 'color:var(--texto-secundario);');
                    }
                    lblStatusPomodoroDetalhado.replaceChildren(...filhos);
                    lblStatusPomodoroDetalhado.style.display = 'flex';
                } else {
                    lblStatusPomodoroDetalhado.replaceChildren();
                    lblStatusPomodoroDetalhado.style.display = 'none';
                }
            }
        };
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ acao: 'OBTER_STATUS_TRABALHO' }, (resp) => {
                if (!chrome.runtime.lastError && resp && resp.ok && resp.estado) {
                    renderizarEstado(resp.estado, resp.resumoPomodoro || null);
                    return;
                }
                if (chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(['jusgovTrabalhoEstado'], (dados) => {
                        if (!chrome.runtime.lastError && dados && dados.jusgovTrabalhoEstado) {
                            renderizarEstado(dados.jusgovTrabalhoEstado, null);
                        }
                    });
                }
            });
        }
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.jusgovTrabalhoEstado) {
                atualizarStatusProdutividadeUI();
            }
        });
    }
    if (typeof window !== 'undefined' && lblStatusProdutividadeTrabalho) {
        setInterval(atualizarStatusProdutividadeUI, 1000);
    }

    function normalizarTempoFlashMs(valorBruto) {
        const num = Number(valorBruto);
        if (num === -1 || num === 5250) return -1;
        if (!Number.isFinite(num) || num <= 0) return 0;
        const arredondado = Math.round(num / 250) * 250;
        if (arredondado >= 5250) return -1;
        return Math.max(0, Math.min(5000, arredondado));
    }

    function normalizarCorHex(corBruta) {
        if (typeof corBruta === 'string' && /^#[0-9a-fA-F]{6}$/.test(corBruta.trim())) {
            return corBruta.trim().toLowerCase();
        }
        return COR_PADRAO_FLASH_BORDER;
    }

    /*
     * FUNCAO: normalizarSeparadorAcumulador
     * OBJETIVO DE RECONSTRUCAO: Garantir separador com tamanho maximo de 5 caracteres,
     * nao vazio, contendo exclusivamente simbolos ou pontuacoes (sem letras ou numeros),
     * restaurando o padrao ';' caso invalido.
     */
    function normalizarSeparadorAcumulador(valorBruto) {
        if (typeof valorBruto !== 'string') return ';';
        const aparado = valorBruto.trim();
        if (aparado.length === 0) return ';';
        if (/[0-9\p{L}]/u.test(valorBruto)) return ';';
        if (!/[!-\/:-@\[-`{-~|\u00A7\u00B0\u00BA\u00AA\p{P}\p{S}]/u.test(valorBruto)) return ';';
        return valorBruto.slice(0, 5);
    }

    function atualizarRotuloSliderFlash() {
        if (!lblValorTempoFlash || !optTempoFlashMs) return;
        const ms = normalizarTempoFlashMs(optTempoFlashMs.value);
        if (ms === -1) {
            lblValorTempoFlash.textContent = 'Até Interação';
        } else if (ms <= 0) {
            lblValorTempoFlash.textContent = '0 (Desabilitado)';
        } else if (ms < 1000) {
            lblValorTempoFlash.textContent = `${ms} ms`;
        } else {
            const segStr = (ms / 1000).toFixed(ms % 1000 === 0 ? 1 : (ms % 500 === 0 ? 1 : 2)).replace('.', ',');
            lblValorTempoFlash.textContent = `${segStr}s (${ms} ms)`;
        }
    }

    function sanitizarContadorOperacional(valorBruto) {
        const num = Number(valorBruto);
        if (!Number.isSafeInteger(num) || num < 0 || num >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL) {
            return { valorSeguro: 0, sofreuResetOverflow: (Number.isFinite(num) && (num < 0 || num >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL)) };
        }
        return { valorSeguro: num, sofreuResetOverflow: false };
    }

    function normalizarModoRetirarSelecao(val) {
        const v = String(val || '').trim().toLowerCase();
        if (v === 'total_exceto_arrasto' || v === 'total' || v === 'interface' || v === 'nenhuma') return v;
        return 'total';
    }

    function converterNivelFiltroParaIndice(nivel) {
        if (typeof nivel === 'number') {
            if (nivel >= 1 && nivel <= 4) return nivel;
        }
        const s = String(nivel || '').toLowerCase().trim();
        if (s === '2' || s === 'intermediario' || s === 'paragrafo' || s === 'fluxo') return 2;
        if (s === '3' || s === 'avancado' || s === 'documental' || s === 'rtf') return 3;
        if (s === '4' || s === 'estendido' || s === 'extendido' || s === 'sem_filtro' || s === 'office') return 4;
        return 1;
    }

    function converterIndiceParaNivelFiltro(indice) {
        const idx = Number(indice);
        if (idx === 2) return 'intermediario';
        if (idx === 3) return 'avancado';
        if (idx === 4) return 'estendido';
        return 'basico';
    }

    function atualizarRotuloNivelFiltro() {
        if (!optNivelFiltroEstilos || !lblValorNivelFiltro) return;
        const val = Number(optNivelFiltroEstilos.value);
        if (val === 2) {
            lblValorNivelFiltro.textContent = '2 - Intermediário (Parágrafos/Tabelas)';
        } else if (val === 3) {
            lblValorNivelFiltro.textContent = '3 - Avançado (Blocos e Listas)';
        } else if (val === 4) {
            lblValorNivelFiltro.textContent = '4 - Estendido (Estrutura e Seções)';
        } else {
            lblValorNivelFiltro.textContent = '1 - Básico (Inline / Mesclagem)';
        }
    }

    function atualizarEstadoOfuscamentoNivelFiltro() {
        if (!containerNivelFiltroEstilos || !checkOpcaoRemoverFormatacoes) return;
        const somenteTextoAtivo = checkOpcaoRemoverFormatacoes.checked;
        const linhaSlider = document.getElementById('linhaControleSliderNivel');
        const blocoNiveis = document.getElementById('blocoNiveisFormatacao');
        if (somenteTextoAtivo) {
            if (linhaSlider) linhaSlider.style.opacity = '0.5';
            if (blocoNiveis) blocoNiveis.style.opacity = '0.5';
            if (optNivelFiltroEstilos) {
                optNivelFiltroEstilos.disabled = true;
                optNivelFiltroEstilos.style.cursor = 'not-allowed';
            }
        } else {
            if (linhaSlider) linhaSlider.style.opacity = '1';
            if (blocoNiveis) blocoNiveis.style.opacity = '1';
            if (optNivelFiltroEstilos) {
                optNivelFiltroEstilos.disabled = false;
                optNivelFiltroEstilos.style.cursor = 'pointer';
            }
        }
    }

    function atualizarVisibilidadeSubOpcoesReutilizar() {
        const ativoMestre = optReutilizarAbasAbertas ? optReutilizarAbasAbertas.checked : true;
        if (optReutilizarFocoPrimeiroPlano) optReutilizarFocoPrimeiroPlano.disabled = !ativoMestre;

        const ativoFoco = ativoMestre && (optReutilizarFocoPrimeiroPlano ? optReutilizarFocoPrimeiroPlano.checked : true);

        if (optReutilizarAcaoManter) optReutilizarAcaoManter.disabled = !ativoFoco;
        if (optReutilizarAcaoRecarregar) optReutilizarAcaoRecarregar.disabled = !ativoFoco;
        if (optReutilizarAcaoRecarregarSeModificada) optReutilizarAcaoRecarregarSeModificada.disabled = !ativoFoco;
        if (optReutilizarAcaoRecarregarSeNaoModificada) optReutilizarAcaoRecarregarSeNaoModificada.disabled = !ativoFoco;
        if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.disabled = !ativoFoco;
        if (optMonitorarUrlAtual) optMonitorarUrlAtual.disabled = !ativoFoco;

        const recargaCondicionalAtiva = Boolean(
            (optReutilizarAcaoRecarregarSeModificada && optReutilizarAcaoRecarregarSeModificada.checked) ||
            (optReutilizarAcaoRecarregarSeNaoModificada && optReutilizarAcaoRecarregarSeNaoModificada.checked)
        );

        if (optProtegerGuiasModificadas) {
            optProtegerGuiasModificadas.disabled = !ativoFoco || recargaCondicionalAtiva;
            const labelProteger = optProtegerGuiasModificadas.closest('label');
            if (labelProteger) {
                labelProteger.style.opacity = recargaCondicionalAtiva ? '0.5' : '1';
                labelProteger.title = recargaCondicionalAtiva
                    ? 'Desabilitado automaticamente enquanto uma ação de recarregamento condicional (por estado de modificação) estiver selecionada'
                    : 'Protege o trabalho do operador: se a página existente tiver formulários em edição, minutas sendo digitadas ou navegação interna SPA, não a reutiliza para evitar descarte ou perda de dados';
            }
        }
        if (btnFecharDuplicadasAgora) btnFecharDuplicadasAgora.disabled = !ativoFoco;

        if (containerSubOpcoesReutilizarAbas) {
            containerSubOpcoesReutilizarAbas.style.opacity = ativoMestre ? '1' : '0.45';
            containerSubOpcoesReutilizarAbas.style.pointerEvents = ativoMestre ? 'auto' : 'none';
        }

        if (containerSubCriteriosAcoesReutilizar) {
            containerSubCriteriosAcoesReutilizar.style.opacity = ativoFoco ? '1' : '0.45';
            containerSubCriteriosAcoesReutilizar.style.pointerEvents = ativoFoco ? 'auto' : 'none';
        }
    }

    function atualizarVisibilidadeSubOpcoesJanelaUnica() {
        const ativo = optBloquearNovasJanelas ? optBloquearNovasJanelas.checked : true;
        if (optPreservarJanelasAutenticacao) optPreservarJanelasAutenticacao.disabled = !ativo;
        if (containerSubOpcaoJanelaUnica) {
            containerSubOpcaoJanelaUnica.style.opacity = ativo ? '1' : '0.45';
            containerSubOpcaoJanelaUnica.style.pointerEvents = ativo ? 'auto' : 'none';
        }
    }

    function atualizarVisibilidadeSubOpcoesF1Gemini() {
        const ativo = optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true;
        if (optPromptF1Gemini) optPromptF1Gemini.disabled = !ativo;
        if (btnRestaurarPromptF1Padrao) btnRestaurarPromptF1Padrao.disabled = !ativo;
        if (containerSubOpcaoF1Gemini) {
            containerSubOpcaoF1Gemini.style.opacity = ativo ? '1' : '0.45';
            containerSubOpcaoF1Gemini.style.pointerEvents = ativo ? 'auto' : 'none';
        }
    }

    function atualizarVisibilidadeSubOpcoesValidacao() {
        const msConferencia = obterTempoConferenciaMsDoSlider();
        const ativo = msConferencia !== 0;
        if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = ativo;
        if (optModoExibicaoValidacao) optModoExibicaoValidacao.disabled = !ativo;
        if (containerModoExibicaoValidacao) {
            containerModoExibicaoValidacao.style.opacity = ativo ? '1' : '0.45';
            containerModoExibicaoValidacao.style.pointerEvents = ativo ? 'auto' : 'none';
        }
        if (optPosicaoAvisosValidacao) optPosicaoAvisosValidacao.disabled = !ativo;
        if (containerPosicaoAvisosValidacao) {
            containerPosicaoAvisosValidacao.style.opacity = ativo ? '1' : '0.45';
            containerPosicaoAvisosValidacao.style.pointerEvents = ativo ? 'auto' : 'none';
        }
    }

    function atualizarVisibilidadeSubOpcoesOrdenacaoGuias() {
        const crit = optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'hierarquia_arvore';
        const ativo = crit !== 'nenhum';
        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.disabled = !ativo;
        if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.disabled = !ativo;
        if (containerFecharHierarquiaCascata) {
            containerFecharHierarquiaCascata.style.display = (crit === 'hierarquia_arvore') ? 'inline-flex' : 'none';
        }
        if (containerSubControlesOrdenacao) {
            containerSubControlesOrdenacao.style.opacity = ativo ? '1' : '0.45';
            containerSubControlesOrdenacao.style.pointerEvents = ativo ? 'auto' : 'none';
        }
    }

    function atualizarVisibilidadeSubOpcoesFlash() {
        const ms = optTempoFlashMs ? Number(optTempoFlashMs.value) : 500;
        const ativo = ms > 0;
        if (optCorFlashBorder) optCorFlashBorder.disabled = !ativo;
    }

    function atualizarTodasVisibilidadesCascata() {
        atualizarEstadoOfuscamentoNivelFiltro();
        atualizarVisibilidadeSubOpcoesJanelaUnica();
        atualizarVisibilidadeSubOpcoesF1Gemini();
        atualizarVisibilidadeSubOpcoesReutilizar();
        atualizarVisibilidadeSubOpcoesValidacao();
        atualizarVisibilidadeSubOpcoesOrdenacaoGuias();
        atualizarVisibilidadeSubOpcoesFlash();
        atualizarVisibilidadeSubOpcoesMarcadorColado();
    }

    /*
     * FUNCAO: carregarConfiguracoesDoStorage
     * OBJETIVO DE RECONSTRUCAO: Ler os dados atuais de chrome.storage.sync e
     * popular todos os controles basicos e avancados da interface.
     */
    function carregarConfiguracoesDoStorage() {
        /* Passo 3.1: Consultar chaves no storage sincronizado */
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            if (configuradorPerfis) {
                const estrutura = configuradorPerfis.garantirEstruturaPerfis({});
                atualizarBarraPerfisUI(estrutura.listaPerfis, estrutura.perfilAtivoId);
            }
            if (textoUrlsTurbo) textoUrlsTurbo.value = PADROES_FABRICA_TURBO.join('\n');
            renderizarListaRegrasMapeamento(PADROES_FABRICA_REGRAS_MAPEAMENTO);
            atualizarRotuloSliderConferencia();
            atualizarRotuloSliderFlash();
            atualizarRotuloNivelFiltro();
            atualizarTodasVisibilidadesCascata();
            return;
        }

        chrome.storage.sync.get(null, (cfg) => {
            const dados = cfg || {};
            if (configuradorPerfis) {
                const estrutura = configuradorPerfis.garantirEstruturaPerfis(dados);
                atualizarBarraPerfisUI(estrutura.listaPerfis, estrutura.perfilAtivoId);
                if (estrutura.alteracoes) {
                    chrome.storage.sync.set(estrutura.alteracoes).catch(() => { });
                }
            }
            const modoAtual = dados.modoTurbo || 'global';
            if (selectModoTurbo) selectModoTurbo.value = modoAtual;
            const compIcone = dados.comportamentoCliqueIcone || 'popup';
            if (selectComportamentoIcone) selectComportamentoIcone.value = compIcone;
            atualizarIconeModoOptions(modoAtual);
            if (dados.nivelFiltroFormatacao !== undefined && optNivelFiltroEstilos) {
                const idx = converterNivelFiltroParaIndice(dados.nivelFiltroFormatacao);
                optNivelFiltroEstilos.value = String(idx);
            }
            if (checkOpcaoRemoverFormatacoes) {
                checkOpcaoRemoverFormatacoes.checked = (dados.manterFormatacaoBasica === false);
            }
            atualizarRotuloNivelFiltro();
            atualizarEstadoOfuscamentoNivelFiltro();
            if (checkOpcaoAmpuletas) checkOpcaoAmpuletas.checked = (dados.ativoAmpuletas !== false);
            if (selectModoPlaceholdersMinutasHtml) {
                if (typeof dados.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(dados.modoPlaceholdersMinutasHtml)) {
                    selectModoPlaceholdersMinutasHtml.value = dados.modoPlaceholdersMinutasHtml;
                } else if (dados.placeholdersMinutasHtmlAtivo === false || dados.selecaoEditavelAtiva === false) {
                    selectModoPlaceholdersMinutasHtml.value = 'desabilitado';
                } else {
                    selectModoPlaceholdersMinutasHtml.value = 'placeholders';
                }
            }
            if (optAlternarAbasRecentesCtrlTab) optAlternarAbasRecentesCtrlTab.checked = (dados.alternarAbasRecentesCtrlTabAtiva !== false);
            if (optCapturaBotoesMouse4e5) optCapturaBotoesMouse4e5.checked = (dados.capturaBotoesMouse4e5Ativa !== false);
            if (optColarBotaoMeio) optColarBotaoMeio.checked = (dados.colarBotaoMeioAtivo !== false);
            obterEstadoPermissaoClipboard().then((perm) => {
                atualizarVisualAtencaoSwitches(perm);
            });
            if (optNavegacaoTecladoCampos) optNavegacaoTecladoCampos.checked = (dados.navegacaoTecladoCamposAtiva !== false);
            if (optCaixaEntradaRapida) optCaixaEntradaRapida.checked = (dados.caixaEntradaRapidaAtiva !== false);
            if (optBloquearNovasJanelas) optBloquearNovasJanelas.checked = (dados.bloquearNovasJanelas !== false);
            if (optPreservarJanelasAutenticacao) optPreservarJanelasAutenticacao.checked = (dados.preservarJanelasAutenticacao !== false);
            if (optAbaEmPrimeiroPlano) {
                optAbaEmPrimeiroPlano.checked = (
                    dados.abaEmPrimeiroPlano !== undefined
                        ? Boolean(dados.abaEmPrimeiroPlano)
                        : (dados.abaEmSegundoPlano !== undefined ? (dados.abaEmSegundoPlano === false) : true)
                );
            }
            if (optReutilizarAbasAbertas) optReutilizarAbasAbertas.checked = (dados.reutilizarAbasAbertas !== false);
            if (optReutilizarFocoPrimeiroPlano) optReutilizarFocoPrimeiroPlano.checked = (dados.reutilizarAbasFocoPrimeiroPlano !== false);
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = Boolean(dados.monitorarUrlOriginalAbertura);
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = (dados.monitorarUrlAtualPagina !== false);
            if (optProtegerGuiasModificadas) optProtegerGuiasModificadas.checked = (dados.protegerGuiasModificadas !== false);
            const acaoCarregada = dados.reutilizarAbasAcaoConteudo || 'manter';
            if (optReutilizarAcaoRecarregar && acaoCarregada === 'recarregar') {
                optReutilizarAcaoRecarregar.checked = true;
            } else if (optReutilizarAcaoRecarregarSeModificada && acaoCarregada === 'recarregar_se_modificada') {
                optReutilizarAcaoRecarregarSeModificada.checked = true;
            } else if (optReutilizarAcaoRecarregarSeNaoModificada && acaoCarregada === 'recarregar_se_nao_modificada') {
                optReutilizarAcaoRecarregarSeNaoModificada.checked = true;
            } else if (optReutilizarAcaoManter) {
                optReutilizarAcaoManter.checked = true;
            }
            atualizarVisibilidadeSubOpcoesReutilizar();
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = dados.criterioOrdenacaoGuias || 'hierarquia_arvore';
            const sentidoEfetivo = dados.sentidoOrdenacaoGuias || 'esq_dir';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = sentidoEfetivo;
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (sentidoEfetivo === 'esq_dir');
            aplicarRotuloSentidoOrdenacao(sentidoEfetivo === 'esq_dir');
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = Boolean(dados.ordenarGuiasFixadas);
            if (optFecharHierarquiaEmCascata) optFecharHierarquiaEmCascata.checked = Boolean(dados.fecharHierarquiaEmCascata);
            if (optModoBarraFavoritosSuperior) optModoBarraFavoritosSuperior.checked = Boolean(dados.modoBarraFavoritosSuperior);
            if (optDescarteGuiasInativas) optDescarteGuiasInativas.checked = false;
            if (optTempoInatividadeDescarteMinutos) {
                optTempoInatividadeDescarteMinutos.value = String(dados.tempoInatividadeDescarteMinutos || '20');
            }
            atualizarEstadoVisualSubopcoesMouse();
            atualizarEstadoVisualOpcoesDescarte();
            if (optTempoConferenciaDocumentos) {
                const tempoConfSalvo = dados.tempoConferenciaDocumentosMs !== undefined
                    ? Number(dados.tempoConferenciaDocumentosMs)
                    : (dados.validacaoMatematicaAtiva === false ? 0 : -1);
                optTempoConferenciaDocumentos.value = String(converterMsParaIndiceSliderConferencia(tempoConfSalvo));
                atualizarRotuloSliderConferencia();
            }
            if (optValidacaoMatematicaAtiva) {
                optValidacaoMatematicaAtiva.checked = (obterTempoConferenciaMsDoSlider() !== 0);
            }
            if (optModoExibicaoValidacao) {
                optModoExibicaoValidacao.value = (dados.modoExibicaoValidacao === 'apenas_erros') ? 'apenas_erros' : 'sempre';
            }
            if (optPosicaoAvisosValidacao) {
                optPosicaoAvisosValidacao.value = (dados.posicaoAvisosValidacao === 'acima') ? 'acima' : 'abaixo';
            }
            atualizarVisibilidadeSubOpcoesValidacao();
            if (optConverterCabecalhoPje) optConverterCabecalhoPje.checked = (dados.converterCabecalhoPjeAtiva !== false && dados.converterCabecalhoPjeAtivo !== false);
            if (optAtalhoF1GeminiAtivo) optAtalhoF1GeminiAtivo.checked = (dados.atalhoF1GeminiAtivo !== false);
            if (optPromptF1Gemini) {
                optPromptF1Gemini.value = (typeof dados.promptF1Gemini === 'string' && dados.promptF1Gemini.trim().length > 0)
                    ? dados.promptF1Gemini
                    : PROMPT_F1_GEMINI_PADRAO;
                ajustarELimitarLinhasPromptIA();
            }

            if (optTempoFlashMs) {
                const msFlashSalvo = dados.tempoFlashBorderMs !== undefined
                    ? normalizarTempoFlashMs(dados.tempoFlashBorderMs)
                    : (typeof dados.flashBorderAtivo === 'boolean' ? (dados.flashBorderAtivo ? -1 : 0) : -1);
                optTempoFlashMs.value = msFlashSalvo === -1 ? '5250' : String(msFlashSalvo);
                atualizarRotuloSliderFlash();
            }
            if (optCorFlashBorder) {
                optCorFlashBorder.value = normalizarCorHex(dados.corFlashBorder);
            }
            if (optMarcadorConteudoColadoAtivo) {
                optMarcadorConteudoColadoAtivo.checked = (dados.marcadorConteudoColadoAtivo !== false);
            }
            if (optPresetMarcadorColado) {
                optPresetMarcadorColado.value = normalizarPresetMarcadorColado(dados.presetMarcadorColado);
            }
            if (optTipoContornoMarcadorColado) {
                optTipoContornoMarcadorColado.value = normalizarTipoContornoMarcadorColado(dados.tipoContornoMarcadorColado);
            }
            const presetAtivo = PRESETS_MARCADOR_CONTEUDO_COLADO[optPresetMarcadorColado ? optPresetMarcadorColado.value : 'verde_forense'] || PRESETS_MARCADOR_CONTEUDO_COLADO.verde_forense;
            if (optCorContornoMarcadorColado) {
                optCorContornoMarcadorColado.value = normalizarCorHex(dados.corContornoMarcadorColado || presetAtivo.corContorno);
            }
            if (optCorFundoMarcadorColado) {
                optCorFundoMarcadorColado.value = normalizarCorHexFundoMarcador(dados.corFundoMarcadorColado || presetAtivo.corFundo);
            }
            if (optEstiloBadgeMarcadorColado) {
                optEstiloBadgeMarcadorColado.value = normalizarEstiloBadgeMarcadorColado(dados.estiloBadgeMarcadorColado);
            }
            atualizarPreviewsVisuaisMarcadorEFlash();
            if (optModoRetirarSelecao) {
                optModoRetirarSelecao.value = normalizarModoRetirarSelecao(dados.modoRetirarSelecao);
            }
            if (optMinimoCaracteresInterface) {
                const minVal = parseInt(dados.minimoCaracteresInterface !== undefined ? dados.minimoCaracteresInterface : 5, 10);
                optMinimoCaracteresInterface.value = [0, 1, 2, 3, 4, 5, 10].includes(minVal) ? String(minVal) : '5';
            }

            if (optAcumuladorSeparador) {
                optAcumuladorSeparador.value = normalizarSeparadorAcumulador(dados.separadorAcumulador);
            }
            if (optAutoLimpezaCacheCookiesAtiva) {
                optAutoLimpezaCacheCookiesAtiva.checked = dados.autoLimpezaCacheCookiesAtiva !== false;
            }
            if (optAutoLimpezaIdade) {
                optAutoLimpezaIdade.value = ['12h', '1d', '3d', '7d', '15d', '30d'].includes(dados.autoLimpezaIdade) ? dados.autoLimpezaIdade : '7d';
            }
            if (optTempoTrabalhoCorridoAtivo) {
                optTempoTrabalhoCorridoAtivo.checked = Boolean(dados.tempoTrabalhoCorridoAtivo);
            }
            if (optTempoTrabalhoCorridoHoras) {
                const hc = Number(dados.tempoTrabalhoCorridoHoras);
                optTempoTrabalhoCorridoHoras.value = (hc >= 1 && hc <= 12) ? String(hc) : '7';
            }
            if (optTempoTrabalhoAtivoAtivo) {
                optTempoTrabalhoAtivoAtivo.checked = Boolean(dados.tempoTrabalhoAtivoAtivo);
            }
            if (optTempoTrabalhoAtivoHoras) {
                const ha = Number(dados.tempoTrabalhoAtivoHoras);
                optTempoTrabalhoAtivoHoras.value = (ha >= 1 && ha <= 12) ? String(ha) : '6';
            }
            if (optPomodoroAtivo) {
                optPomodoroAtivo.checked = Boolean(dados.pomodoroAtivo);
            }
            if (optPomodoroProporcao) {
                const prop = Number(dados.pomodoroProporcao);
                optPomodoroProporcao.value = [5, 4.5, 4, 3.5, 3].includes(prop) ? String(prop) : '4.5';
            }
            if (optPomodoroFocoMinutos) {
                const foco = Number(dados.pomodoroFocoMinutos);
                optPomodoroFocoMinutos.value = (foco >= 25 && foco <= 90 && foco % 5 === 0) ? String(foco) : '25';
            }
            if (optPomodoroCiclos) {
                const cic = Number(dados.pomodoroCiclos);
                optPomodoroCiclos.value = (Number.isInteger(cic) && cic >= 2 && cic <= 10) ? String(cic) : '4';
            }
            if (optPomodoroModoAviso) {
                optPomodoroModoAviso.value = normalizarModoAvisoPomodoro(dados.pomodoroModoAviso);
            }
            if (optPomodoroPausasAutomaticas) {
                optPomodoroPausasAutomaticas.checked = (dados.pomodoroPausasAutomaticas !== false);
            }
            atualizarCalculoPomodoroUI();
            atualizarStatusProdutividadeUI();

            const urlsFiltradas = Array.isArray(dados.urlsTurbo)
                ? dados.urlsTurbo.filter(u => u && u !== '<all_urls>')
                : [];
            const listaTurbo = urlsFiltradas.length > 0
                ? urlsFiltradas
                : PADROES_FABRICA_TURBO;

            if (textoUrlsTurbo) textoUrlsTurbo.value = listaTurbo.join('\n');
            const regrasCarregadas = Array.isArray(dados.regrasMapeamentoElementos)
                ? dados.regrasMapeamentoElementos
                : [];
            renderizarListaRegrasMapeamento(regrasCarregadas);
            atualizarTodasVisibilidadesCascata();
        });

        /* Carregar contadores operacionais estritamente do chrome.storage.local (sem sincronizar na nuvem) */
        if (chrome.storage.local) {
            chrome.storage.local.get(['totalCopias', 'totalAlertas', 'dataInicioContadores'], (dadosLoc) => {
                const loc = dadosLoc || {};
                const statusCopias = sanitizarContadorOperacional(loc.totalCopias);
                const statusAlertas = sanitizarContadorOperacional(loc.totalAlertas);
                if (lblTotalCopias) lblTotalCopias.textContent = String(statusCopias.valorSeguro);
                if (lblTotalAlertas) lblTotalAlertas.textContent = String(statusAlertas.valorSeguro);

                let dataInicio = loc.dataInicioContadores;
                if (!dataInicio || typeof dataInicio !== 'string') {
                    const agora = new Date();
                    const pad = (n) => String(n).padStart(2, '0');
                    dataInicio = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                    chrome.storage.local.set({ dataInicioContadores: dataInicio });
                }
                if (lblDataInicioContadores) lblDataInicioContadores.textContent = dataInicio;

                if (statusCopias.sofreuResetOverflow || statusAlertas.sofreuResetOverflow) {
                    chrome.storage.local.set({
                        totalCopias: statusCopias.valorSeguro,
                        totalAlertas: statusAlertas.valorSeguro
                    });
                }
            });
            /* Higienizacao preventiva: remover contadores legados do sync para nao poluir a nuvem */
            if (chrome.storage.sync) {
                chrome.storage.sync.remove(['totalCopias', 'totalAlertas', 'dataInicioContadores']).catch(() => { });
            }
        }
    }

    /*
     * FUNCAO: extrairLinhasLimpas
     * OBJETIVO DE RECONSTRUCAO: Converter o conteudo de um <textarea> em um
     * array de strings sem linhas em branco, sem duplicatas e sem '<all_urls>'.
     */
    function extrairLinhasLimpas(textoBruto) {
        /* Passo 3.2: Dividir por quebra de linha, aparar espacos e filtrar vazios e '<all_urls>' */
        return Array.from(new Set(
            String(textoBruto || '')
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l.length > 0 && l !== '<all_urls>')
        ));
    }

    let timerDebounceSalvarConfig = null;

    /*
     * FUNCAO: salvarConfiguracoesDebounced (Secao 6.67)
     * OBJETIVO DE RECONSTRUCAO: Aplicar debounce de 250ms na gravacao de sliders
     * e seletores continuos (eventos 'input') para blindar contra o estouro da
     * cota MAX_WRITE_OPERATIONS_PER_MINUTE (120 escritas/min) do chrome.storage.sync.
     */
    function salvarConfiguracoesDebounced(delayMs = 250) {
        if (timerDebounceSalvarConfig) {
            clearTimeout(timerDebounceSalvarConfig);
        }
        timerDebounceSalvarConfig = setTimeout(() => {
            timerDebounceSalvarConfig = null;
            salvarConfiguracoes();
        }, delayMs);
    }

    /*
     * FUNCAO: salvarConfiguracoes
     * OBJETIVO DE RECONSTRUCAO: Gravar todas as opcoes basicas, avancadas e listas
     * de URLs no chrome.storage.sync para sincronizacao na nuvem da Conta Google
     * em todos os navegadores e propagacao imediata pelo Service Worker.
     */
    function coletarPayloadConfiguracoesUI() {
        /* Passo 4.1: Coletar valores atuais da UI em formato canônico */
        const novasUrlsTurbo = extrairLinhasLimpas(textoUrlsTurbo ? textoUrlsTurbo.value : '');
        const manterBasica = checkOpcaoRemoverFormatacoes ? !checkOpcaoRemoverFormatacoes.checked : false;
        const sepValor = optAcumuladorSeparador
            ? normalizarSeparadorAcumulador(optAcumuladorSeparador.value)
            : ';';
        if (optAcumuladorSeparador && optAcumuladorSeparador.value !== sepValor) {
            optAcumuladorSeparador.value = sepValor;
        }
        const tempoConferenciaMs = obterTempoConferenciaMsDoSlider();
        const validacaoAtivaEfetiva = tempoConferenciaMs !== 0;
        if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = validacaoAtivaEfetiva;
        const tempoFlashMs = optTempoFlashMs ? normalizarTempoFlashMs(optTempoFlashMs.value) : 0;
        const corFlash = optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : COR_PADRAO_FLASH_BORDER;
        const marcadorColadoAtivo = optMarcadorConteudoColadoAtivo ? optMarcadorConteudoColadoAtivo.checked : true;
        const presetMarcador = optPresetMarcadorColado ? normalizarPresetMarcadorColado(optPresetMarcadorColado.value) : 'verde_forense';
        const tipoContornoMarcador = optTipoContornoMarcadorColado ? normalizarTipoContornoMarcadorColado(optTipoContornoMarcadorColado.value) : 'solido';
        const corContornoMarcador = optCorContornoMarcadorColado ? normalizarCorHex(optCorContornoMarcadorColado.value) : COR_PADRAO_FLASH_BORDER;
        const corFundoMarcador = optCorFundoMarcadorColado ? normalizarCorHexFundoMarcador(optCorFundoMarcadorColado.value) : COR_PADRAO_FUNDO_MARCADOR;
        const estiloBadgeMarcador = optEstiloBadgeMarcadorColado ? normalizarEstiloBadgeMarcadorColado(optEstiloBadgeMarcadorColado.value) : 'sobrescrito';

        atualizarRotuloSliderConferencia();
        atualizarRotuloSliderFlash();

        return {
            modoTurbo: selectModoTurbo ? selectModoTurbo.value : 'global',
            comportamentoCliqueIcone: selectComportamentoIcone ? selectComportamentoIcone.value : 'popup',
            manterFormatacaoBasica: manterBasica,
            nivelFiltroFormatacao: optNivelFiltroEstilos ? converterIndiceParaNivelFiltro(optNivelFiltroEstilos.value) : 'basico',
            ativoAmpuletas: checkOpcaoAmpuletas ? checkOpcaoAmpuletas.checked : true,
            selecaoEditavelAtiva: selectModoPlaceholdersMinutasHtml ? (selectModoPlaceholdersMinutasHtml.value !== 'desabilitado') : true,
            modoPlaceholdersMinutasHtml: selectModoPlaceholdersMinutasHtml ? selectModoPlaceholdersMinutasHtml.value : 'placeholders',
            placeholdersMinutasHtmlAtivo: selectModoPlaceholdersMinutasHtml ? (selectModoPlaceholdersMinutasHtml.value !== 'desabilitado') : true,
            colagemBotaoDireitoAtiva: false,
            alternarAbasRecentesCtrlTabAtiva: optAlternarAbasRecentesCtrlTab ? optAlternarAbasRecentesCtrlTab.checked : true,
            capturaBotoesMouse4e5Ativa: optCapturaBotoesMouse4e5 ? optCapturaBotoesMouse4e5.checked : true,
            colarBotaoMeioAtivo: optColarBotaoMeio ? optColarBotaoMeio.checked : true,
            navegacaoTecladoCamposAtiva: optNavegacaoTecladoCampos ? optNavegacaoTecladoCampos.checked : true,
            caixaEntradaRapidaAtiva: optCaixaEntradaRapida ? optCaixaEntradaRapida.checked : true,
            bloquearNovasJanelas: optBloquearNovasJanelas ? optBloquearNovasJanelas.checked : true,
            preservarJanelasAutenticacao: optPreservarJanelasAutenticacao ? optPreservarJanelasAutenticacao.checked : true,
            abaEmPrimeiroPlano: optAbaEmPrimeiroPlano ? optAbaEmPrimeiroPlano.checked : false,
            abaEmSegundoPlano: optAbaEmPrimeiroPlano ? !optAbaEmPrimeiroPlano.checked : true,
            reutilizarAbasAbertas: optReutilizarAbasAbertas ? optReutilizarAbasAbertas.checked : true,
            reutilizarAbasFocoPrimeiroPlano: optReutilizarFocoPrimeiroPlano ? optReutilizarFocoPrimeiroPlano.checked : true,
            protegerGuiasModificadas: optProtegerGuiasModificadas ? optProtegerGuiasModificadas.checked : true,
            reutilizarAbasAcaoConteudo: (optReutilizarAcaoRecarregar && optReutilizarAcaoRecarregar.checked)
                ? 'recarregar'
                : ((optReutilizarAcaoRecarregarSeModificada && optReutilizarAcaoRecarregarSeModificada.checked)
                    ? 'recarregar_se_modificada'
                    : ((optReutilizarAcaoRecarregarSeNaoModificada && optReutilizarAcaoRecarregarSeNaoModificada.checked)
                        ? 'recarregar_se_nao_modificada'
                        : 'manter')),
            monitorarUrlOriginalAbertura: optMonitorarUrlOriginal ? optMonitorarUrlOriginal.checked : false,
            monitorarUrlAtualPagina: optMonitorarUrlAtual ? optMonitorarUrlAtual.checked : true,
            criterioOrdenacaoGuias: optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'hierarquia_arvore',
            sentidoOrdenacaoGuias: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
            ordenarGuiasFixadas: optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false,
            fecharHierarquiaEmCascata: optFecharHierarquiaEmCascata ? optFecharHierarquiaEmCascata.checked : false,
            modoBarraFavoritosSuperior: optModoBarraFavoritosSuperior ? optModoBarraFavoritosSuperior.checked : false,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: optTempoInatividadeDescarteMinutos ? Number(optTempoInatividadeDescarteMinutos.value) : 20,
            validacaoMatematicaAtiva: validacaoAtivaEfetiva,
            tempoConferenciaDocumentosMs: tempoConferenciaMs,
            modoExibicaoValidacao: optModoExibicaoValidacao ? optModoExibicaoValidacao.value : 'sempre',
            posicaoAvisosValidacao: optPosicaoAvisosValidacao ? optPosicaoAvisosValidacao.value : 'abaixo',
            converterCabecalhoPjeAtivo: optConverterCabecalhoPje ? optConverterCabecalhoPje.checked : true,
            atalhoF1GeminiAtivo: optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true,
            promptF1Gemini: (optPromptF1Gemini && optPromptF1Gemini.value.trim().length > 0) ? optPromptF1Gemini.value.trim() : PROMPT_F1_GEMINI_PADRAO,
            tempoExibicaoAlertaMs: -1,
            tempoFlashBorderMs: tempoFlashMs,
            corFlashBorder: corFlash,
            marcadorConteudoColadoAtivo: marcadorColadoAtivo,
            presetMarcadorColado: presetMarcador,
            tipoContornoMarcadorColado: tipoContornoMarcador,
            corContornoMarcadorColado: corContornoMarcador,
            corFundoMarcadorColado: corFundoMarcador,
            estiloBadgeMarcadorColado: estiloBadgeMarcador,
            modoRetirarSelecao: optModoRetirarSelecao ? normalizarModoRetirarSelecao(optModoRetirarSelecao.value) : 'total',
            minimoCaracteresInterface: optMinimoCaracteresInterface ? (parseInt(optMinimoCaracteresInterface.value, 10) || 0) : 5,
            separadorAcumulador: sepValor,
            autoLimpezaCacheCookiesAtiva: optAutoLimpezaCacheCookiesAtiva ? optAutoLimpezaCacheCookiesAtiva.checked : true,
            autoLimpezaIdade: optAutoLimpezaIdade ? optAutoLimpezaIdade.value : '7d',
            tempoTrabalhoCorridoAtivo: optTempoTrabalhoCorridoAtivo ? optTempoTrabalhoCorridoAtivo.checked : false,
            tempoTrabalhoCorridoHoras: optTempoTrabalhoCorridoHoras ? (Number(optTempoTrabalhoCorridoHoras.value) || 7) : 7,
            tempoTrabalhoAtivoAtivo: optTempoTrabalhoAtivoAtivo ? optTempoTrabalhoAtivoAtivo.checked : false,
            tempoTrabalhoAtivoHoras: optTempoTrabalhoAtivoHoras ? (Number(optTempoTrabalhoAtivoHoras.value) || 6) : 6,
            pomodoroAtivo: optPomodoroAtivo ? optPomodoroAtivo.checked : false,
            pomodoroProporcao: optPomodoroProporcao ? (Number(optPomodoroProporcao.value) || 4.5) : 4.5,
            pomodoroFocoMinutos: optPomodoroFocoMinutos ? (Number(optPomodoroFocoMinutos.value) || 25) : 25,
            pomodoroCiclos: optPomodoroCiclos ? (Number(optPomodoroCiclos.value) || 4) : 4,
            pomodoroPausasAutomaticas: optPomodoroPausasAutomaticas ? optPomodoroPausasAutomaticas.checked : true,
            pomodoroModoAviso: optPomodoroModoAviso ? normalizarModoAvisoPomodoro(optPomodoroModoAviso.value) : 'completo',
            urlsTurbo: novasUrlsTurbo.length > 0 ? novasUrlsTurbo : [...PADROES_FABRICA_TURBO],
            regrasMapeamentoElementos: moduloMapeamento.obterRegrasAtuais()
        };
    }

    function salvarConfiguracoes() {
        if (timerDebounceSalvarConfig) {
            clearTimeout(timerDebounceSalvarConfig);
            timerDebounceSalvarConfig = null;
        }
        const payload = coletarPayloadConfiguracoesUI();
        if (configuradorPerfis) {
            const perfilId = cachePerfilAtivoId || 'padrao';
            payload[configuradorPerfis.chaveConfigPerfil(perfilId)] = configuradorPerfis.calcularSobrescritasPerfil(payload, perfilId);
        }
        atualizarIconeModoOptions(payload.modoTurbo);

        if (textoUrlsTurbo) textoUrlsTurbo.value = payload.urlsTurbo.join('\n');

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.remove('flashBorderAtivo').catch(() => { });
            chrome.storage.sync.set(payload, () => {
                if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                }
                exibirToast('Configurações salvas e sincronizadas na nuvem!');
            });
        } else {
            exibirToast('Configurações aplicadas localmente!');
        }
    }

    /* Passo 4.2: Vincular eventos de salvamento imediato nos controles principais e avancados */
    adicionarOuvinteSeguro(btnSalvarConfiguracoes, 'click', salvarConfiguracoes);
    adicionarOuvinteSeguro(selectModoTurbo, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(selectComportamentoIcone, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(checkOpcaoRemoverFormatacoes, 'change', () => {
        atualizarEstadoOfuscamentoNivelFiltro();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optNivelFiltroEstilos, 'input', () => {
        atualizarRotuloNivelFiltro();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optNivelFiltroEstilos, 'change', () => {
        atualizarRotuloNivelFiltro();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(textoUrlsTurbo, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(checkOpcaoAmpuletas, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optConverterCabecalhoPje, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(selectModoPlaceholdersMinutasHtml, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optAlternarAbasRecentesCtrlTab, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optCapturaBotoesMouse4e5, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optColarBotaoMeio, 'change', () => {
        atualizarEstadoVisualSubopcoesMouse();
        alternarColarBotaoMeio();
    });
    adicionarOuvinteSeguro(optNavegacaoTecladoCampos, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optCaixaEntradaRapida, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optBloquearNovasJanelas, 'change', () => {
        atualizarVisibilidadeSubOpcoesJanelaUnica();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPreservarJanelasAutenticacao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optAbaEmPrimeiroPlano, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optReutilizarAbasAbertas, 'change', () => {
        atualizarVisibilidadeSubOpcoesReutilizar();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optReutilizarFocoPrimeiroPlano, 'change', () => {
        atualizarVisibilidadeSubOpcoesReutilizar();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optProtegerGuiasModificadas, 'change', salvarConfiguracoes);
    const aoAlterarAcaoConteudoReutilizar = () => {
        atualizarVisibilidadeSubOpcoesReutilizar();
        salvarConfiguracoes();
    };
    adicionarOuvinteSeguro(optReutilizarAcaoManter, 'change', aoAlterarAcaoConteudoReutilizar);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregar, 'change', aoAlterarAcaoConteudoReutilizar);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregarSeModificada, 'change', aoAlterarAcaoConteudoReutilizar);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregarSeNaoModificada, 'change', aoAlterarAcaoConteudoReutilizar);

    /* Garantir que ao menos uma opção de monitoramento permaneça ativa (não permitir ambas desmarcadas) */
    adicionarOuvinteSeguro(optMonitorarUrlOriginal, 'change', () => {
        if (!optMonitorarUrlOriginal.checked && (!optMonitorarUrlAtual || !optMonitorarUrlAtual.checked)) {
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = true;
        }
        salvarConfiguracoes();
    });

    adicionarOuvinteSeguro(optMonitorarUrlAtual, 'change', () => {
        if (!optMonitorarUrlAtual.checked && (!optMonitorarUrlOriginal || !optMonitorarUrlOriginal.checked)) {
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = true;
        }
        salvarConfiguracoes();
    });

    /* Ordenação Imediata ao alterar "Ordenar por:" */
    adicionarOuvinteSeguro(optCriterioOrdenacaoGuias, 'change', () => {
        atualizarVisibilidadeSubOpcoesOrdenacaoGuias();
        salvarConfiguracoes();
        const crit = optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'nenhum';
        if (crit && crit !== 'nenhum') {
            const sent = optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir';
            const fix = optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false;
            try {
                chrome.runtime.sendMessage({
                    acao: 'ordenarGuiasAgora',
                    criterio: crit,
                    sentido: sent,
                    ordenarFixadas: fix
                }, () => {
                    if (feedbackAcoesGuias) {
                        feedbackAcoesGuias.textContent = 'Guias ordenadas imediatamente!';
                        feedbackAcoesGuias.style.display = 'inline';
                        setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                    }
                });
            } catch (_) { }
        }
    });

    function aplicarRotuloSentidoOrdenacao(isEsqDir) {
        if (lblSentidoOrdenacaoGuias) {
            lblSentidoOrdenacaoGuias.textContent = isEsqDir
                ? 'Da Esquerda para a Direita (A-Z ou Novo-Antigo)'
                : 'Da Direita para a Esquerda (Z-A ou Antigo-Novo)';
        }
    }

    /* Controle do Switch de Sentido de Ordenação */
    function atualizarSentidoOrdenacao(isEsqDir, reordenarSeAtivo = true) {
        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = isEsqDir;
        if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = isEsqDir ? 'esq_dir' : 'dir_esq';
        aplicarRotuloSentidoOrdenacao(isEsqDir);
        salvarConfiguracoes();
        if (reordenarSeAtivo && optCriterioOrdenacaoGuias && optCriterioOrdenacaoGuias.value !== 'nenhum') {
            const crit = optCriterioOrdenacaoGuias.value;
            const sent = optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir';
            const fix = optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false;
            try {
                chrome.runtime.sendMessage({
                    acao: 'ordenarGuiasAgora',
                    criterio: crit,
                    sentido: sent,
                    ordenarFixadas: fix
                }, () => {
                    if (feedbackAcoesGuias) {
                        feedbackAcoesGuias.textContent = 'Sentido atualizado e guias reordenadas!';
                        feedbackAcoesGuias.style.display = 'inline';
                        setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                    }
                });
            } catch (_) { }
        }
    }

    adicionarOuvinteSeguro(optSentidoOrdenacaoGuiasSwitch, 'change', () => {
        atualizarSentidoOrdenacao(optSentidoOrdenacaoGuiasSwitch.checked, true);
    });

    adicionarOuvinteSeguro(lblSentidoOrdenacaoGuias, 'click', () => {
        if (optSentidoOrdenacaoGuiasSwitch) {
            optSentidoOrdenacaoGuiasSwitch.checked = !optSentidoOrdenacaoGuiasSwitch.checked;
            atualizarSentidoOrdenacao(optSentidoOrdenacaoGuiasSwitch.checked, true);
        }
    });

    adicionarOuvinteSeguro(optSentidoOrdenacaoGuias, 'change', () => {
        atualizarSentidoOrdenacao(optSentidoOrdenacaoGuias.value === 'esq_dir', true);
    });

    adicionarOuvinteSeguro(optOrdenarGuiasFixadas, 'change', () => {
        salvarConfiguracoes();
        if (optCriterioOrdenacaoGuias && optCriterioOrdenacaoGuias.value !== 'nenhum') {
            try {
                chrome.runtime.sendMessage({
                    acao: 'ordenarGuiasAgora',
                    criterio: optCriterioOrdenacaoGuias.value,
                    sentido: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
                    ordenarFixadas: optOrdenarGuiasFixadas.checked
                });
            } catch (_) { }
        }
    });

    adicionarOuvinteSeguro(optFecharHierarquiaEmCascata, 'change', salvarConfiguracoes);

    adicionarOuvinteSeguro(optModoBarraFavoritosSuperior, 'change', () => {
        salvarConfiguracoes();
        if (feedbackAparenciaChrome) {
            feedbackAparenciaChrome.textContent = optModoBarraFavoritosSuperior.checked
                ? 'Preferência salva! Use Ctrl+Shift+B ou Aparência do Chrome para exibir a barra.'
                : 'Preferência salva.';
            feedbackAparenciaChrome.style.display = 'inline';
            setTimeout(() => { if (feedbackAparenciaChrome) feedbackAparenciaChrome.style.display = 'none'; }, 4000);
        }
    });

    adicionarOuvinteSeguro(btnRestaurarBarraFerramentasPadrao, 'click', () => {
        if (optModoBarraFavoritosSuperior) optModoBarraFavoritosSuperior.checked = false;
        salvarConfiguracoes();
        if (feedbackAparenciaChrome) {
            feedbackAparenciaChrome.textContent = 'Preferência de barra de ferramentas restaurada ao padrão.';
            feedbackAparenciaChrome.style.display = 'inline';
            setTimeout(() => { if (feedbackAparenciaChrome) feedbackAparenciaChrome.style.display = 'none'; }, 3500);
        }
    });

    adicionarOuvinteSeguro(btnAbrirAparenciaChrome, 'click', () => {
        try {
            chrome.runtime.sendMessage({ acao: 'abrirPaginaAparenciaChrome' });
        } catch (_) { }
    });

    if (btnTestarCaixaEntradaRapida) {
        adicionarOuvinteSeguro(btnTestarCaixaEntradaRapida, 'click', () => {
            try {
                if (typeof window.JusGovCaixaEntradaRapida === 'function') {
                    if (!window.__jusgovCaixaTesteOptions) {
                        window.__jusgovCaixaTesteOptions = new window.JusGovCaixaEntradaRapida({ ativo: true });
                    }
                    window.__jusgovCaixaTesteOptions.abrirCaixa();
                } else {
                    exibirToast('Módulo da Caixa de Entrada Rápida não carregado.');
                }
            } catch (_) { }
        });
    }

    if (btnTestarAdicaoManualMapeamento) {
        adicionarOuvinteSeguro(btnTestarAdicaoManualMapeamento, 'click', () => {
            try {
                if (typeof window.JusGovDialogoMapeamentoRegra === 'function') {
                    const dlg = new window.JusGovDialogoMapeamentoRegra();
                    dlg.abrirModal(
                        document.body,
                        { cssSimples: '', xpathRel: '', xpathAbs: '', seletorCss: '', seletorCss2: '' },
                        {
                            modoManualVazio: true,
                            aoSalvarRegras: (regrasNovas) => {
                                if (moduloMapeamento.adicionarRegrasESalvar(regrasNovas)) {
                                    exibirToast('Regra manual adicionada e salva!');
                                }
                            }
                        }
                    );
                } else {
                    exibirToast('Módulo de diálogo de mapeamento não carregado.');
                }
            } catch (_) { }
        });
    }

    adicionarOuvinteSeguro(optDescarteGuiasInativas, 'change', () => {
        atualizarEstadoVisualOpcoesDescarte();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optTempoInatividadeDescarteMinutos, 'change', salvarConfiguracoes);

    /* Acoes rapidas da Categoria 5 (Gerenciamento de Guias e Janelas) */
    adicionarOuvinteSeguro(btnFecharDuplicadasAgora, 'click', () => {
        try {
            chrome.runtime.sendMessage({ acao: 'fecharGuiasDuplicadasAgora' }, (res) => {
                if (chrome.runtime && chrome.runtime.lastError) return;
                const total = res ? res.totalFechadas || 0 : 0;
                if (feedbackFecharDuplicadas) {
                    feedbackFecharDuplicadas.textContent = (total > 0)
                        ? `${total} ${total === 1 ? 'guia duplicada fechada' : 'guias duplicadas fechadas'} com sucesso!`
                        : 'Nenhuma guia duplicada encontrada na janela ativa.';
                    feedbackFecharDuplicadas.style.display = 'inline';
                    setTimeout(() => { if (feedbackFecharDuplicadas) feedbackFecharDuplicadas.style.display = 'none'; }, 4000);
                }
            });
        } catch (_) { }
    });

    adicionarOuvinteSeguro(btnRestaurarOrdemGuiasPadrao, 'click', () => {
        try {
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = 'nenhum';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = 'esq_dir';
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = true;
            aplicarRotuloSentidoOrdenacao(true);
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = false;
            if (optFecharHierarquiaEmCascata) optFecharHierarquiaEmCascata.checked = false;
            atualizarVisibilidadeSubOpcoesOrdenacaoGuias();
            salvarConfiguracoes();
            chrome.runtime.sendMessage({ acao: 'restaurarOrdemGuiasPadrao' }, () => {
                if (feedbackAcoesGuias) {
                    feedbackAcoesGuias.textContent = 'Ordenação desativada e guias desagrupadas!';
                    feedbackAcoesGuias.style.display = 'inline';
                    setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                }
            });
        } catch (_) { }
    });

    adicionarOuvinteSeguro(btnDescartarGuiasInativasAgora, 'click', () => {
        try {
            chrome.runtime.sendMessage({ acao: 'descartarGuiasInativasAgora' }, (res) => {
                const total = res ? res.totalDescartadas || 0 : 0;
                if (feedbackDescarteGuias) {
                    feedbackDescarteGuias.textContent = (total > 0)
                        ? `Memoria liberada! ${total} ${total === 1 ? 'guia inativa descartada' : 'guias inativas descartadas'} da RAM.`
                        : 'Nenhuma guia elegivel para descarte em segundo plano.';
                    feedbackDescarteGuias.style.display = 'inline';
                    setTimeout(() => { if (feedbackDescarteGuias) feedbackDescarteGuias.style.display = 'none'; }, 4000);
                }
            });
        } catch (_) { }
    });
    adicionarOuvinteSeguro(optValidacaoMatematicaAtiva, 'change', () => {
        if (optTempoConferenciaDocumentos) {
            optTempoConferenciaDocumentos.value = optValidacaoMatematicaAtiva.checked ? '6' : '0';
            atualizarRotuloSliderConferencia();
        }
        atualizarVisibilidadeSubOpcoesValidacao();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optTempoConferenciaDocumentos, 'input', () => {
        atualizarRotuloSliderConferencia();
        atualizarVisibilidadeSubOpcoesValidacao();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optTempoConferenciaDocumentos, 'change', () => {
        atualizarRotuloSliderConferencia();
        atualizarVisibilidadeSubOpcoesValidacao();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optModoExibicaoValidacao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optPosicaoAvisosValidacao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoFlashMs, 'input', () => {
        atualizarRotuloSliderFlash();
        atualizarVisibilidadeSubOpcoesFlash();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optTempoFlashMs, 'change', () => {
        atualizarVisibilidadeSubOpcoesFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optCorFlashBorder, 'input', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorFlashBorder, 'change', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optMarcadorConteudoColadoAtivo, 'change', () => {
        atualizarVisibilidadeSubOpcoesMarcadorColado();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPresetMarcadorColado, 'change', () => {
        const presetChave = optPresetMarcadorColado ? normalizarPresetMarcadorColado(optPresetMarcadorColado.value) : 'verde_forense';
        const presetCores = PRESETS_MARCADOR_CONTEUDO_COLADO[presetChave] || PRESETS_MARCADOR_CONTEUDO_COLADO.verde_forense;
        if (optCorContornoMarcadorColado) optCorContornoMarcadorColado.value = presetCores.corContorno;
        if (optCorFundoMarcadorColado) optCorFundoMarcadorColado.value = presetCores.corFundo;
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optTipoContornoMarcadorColado, 'change', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optCorContornoMarcadorColado, 'input', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorContornoMarcadorColado, 'change', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optCorFundoMarcadorColado, 'input', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorFundoMarcadorColado, 'change', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optEstiloBadgeMarcadorColado, 'change', () => {
        atualizarPreviewsVisuaisMarcadorEFlash();
        salvarConfiguracoes();
    });
    document.querySelectorAll('.paleta-cores-basicas .btn-swatch-cor').forEach((btn) => {
        btn.addEventListener('click', () => {
            const paleta = btn.closest('.paleta-cores-basicas');
            const targetId = paleta ? paleta.getAttribute('data-target-color') : '';
            const cor = btn.getAttribute('data-cor');
            const inputAlvo = targetId ? document.getElementById(targetId) : null;
            if (inputAlvo && cor) {
                inputAlvo.value = cor;
                atualizarPreviewsVisuaisMarcadorEFlash();
                salvarConfiguracoes();
            }
        });
    });
    adicionarOuvinteSeguro(optModoRetirarSelecao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optMinimoCaracteresInterface, 'change', salvarConfiguracoes);

    /* Privacidade e Produtividade (Secoes 6.141 e 6.142) */
    adicionarOuvinteSeguro(optAutoLimpezaCacheCookiesAtiva, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optAutoLimpezaIdade, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(btnExecutarLimpezaCacheAgora, 'click', () => {
        if (lblStatusLimpezaCache) lblStatusLimpezaCache.textContent = 'Executando limpeza de cache e cookies...';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ acao: 'EXECUTAR_AUTO_LIMPEZA_AGORA' }, (resp) => {
                if (chrome.runtime.lastError || !resp || !resp.ok) {
                    if (lblStatusLimpezaCache) lblStatusLimpezaCache.textContent = 'Não foi possível executar a limpeza agora.';
                } else {
                    const hora = new Date(resp.timestamp || Date.now()).toLocaleTimeString();
                    if (lblStatusLimpezaCache) lblStatusLimpezaCache.textContent = `Limpeza concluída às ${hora}.`;
                }
            });
        }
    });
    adicionarOuvinteSeguro(optTempoTrabalhoCorridoAtivo, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoTrabalhoCorridoHoras, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoTrabalhoAtivoAtivo, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoTrabalhoAtivoHoras, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optPomodoroAtivo, 'change', () => {
        atualizarCalculoPomodoroUI();
        atualizarStatusProdutividadeUI();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPomodoroProporcao, 'change', () => {
        atualizarCalculoPomodoroUI();
        atualizarStatusProdutividadeUI();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPomodoroFocoMinutos, 'change', () => {
        atualizarCalculoPomodoroUI();
        atualizarStatusProdutividadeUI();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPomodoroCiclos, 'change', () => {
        atualizarCalculoPomodoroUI();
        atualizarStatusProdutividadeUI();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPomodoroModoAviso, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optPomodoroPausasAutomaticas, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(btnResetarContadoresTrabalho, 'click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ acao: 'RESETAR_CONTADORES_TRABALHO' }, (resp) => {
                if (!chrome.runtime.lastError && resp && resp.ok) {
                    atualizarStatusProdutividadeUI();
                }
            });
        }
    });

    /* Validacao e selecao imediata do Separador do Modo Acumulador */
    if (optAcumuladorSeparador) {
        adicionarOuvinteSeguro(optAcumuladorSeparador, 'input', () => {
            const limpo = optAcumuladorSeparador.value.replace(/[0-9\p{L}]/gu, '').slice(0, 5);
            if (optAcumuladorSeparador.value !== limpo) {
                optAcumuladorSeparador.value = limpo;
            }
            salvarConfiguracoesDebounced(250);
        });
        adicionarOuvinteSeguro(optAcumuladorSeparador, 'blur', () => {
            const norm = normalizarSeparadorAcumulador(optAcumuladorSeparador.value);
            if (optAcumuladorSeparador.value !== norm) {
                optAcumuladorSeparador.value = norm;
                salvarConfiguracoes();
            }
        });
        adicionarOuvinteSeguro(optAcumuladorSeparador, 'focus', () => {
            if (optAcumuladorSeparador.value === ';') {
                try { optAcumuladorSeparador.select(); } catch (_) { }
            }
        });
        adicionarOuvinteSeguro(optAcumuladorSeparador, 'change', salvarConfiguracoes);
    }
    /* Auto-ajuste de altura (ate 10 linhas max visíveis) e limite estrito de 15 linhas totais no campo de comando IA */
    function ajustarELimitarLinhasPromptIA() {
        if (!optPromptF1Gemini) return;
        const linhas = optPromptF1Gemini.value.split('\n');
        if (linhas.length > 15) {
            optPromptF1Gemini.value = linhas.slice(0, 15).join('\n');
        }
        optPromptF1Gemini.style.height = 'auto';
        optPromptF1Gemini.style.height = `${optPromptF1Gemini.scrollHeight}px`;
    }

    adicionarOuvinteSeguro(optAtalhoF1GeminiAtivo, 'change', () => {
        atualizarVisibilidadeSubOpcoesF1Gemini();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPromptF1Gemini, 'change', () => {
        ajustarELimitarLinhasPromptIA();
        salvarConfiguracoes();
    });

    if (optPromptF1Gemini) {
        adicionarOuvinteSeguro(optPromptF1Gemini, 'keydown', (e) => {
            if (e.key === 'Enter') {
                const totalLinhas = optPromptF1Gemini.value.split('\n').length;
                if (totalLinhas >= 15) {
                    e.preventDefault();
                }
            }
        });
        adicionarOuvinteSeguro(optPromptF1Gemini, 'input', () => {
            ajustarELimitarLinhasPromptIA();
            salvarConfiguracoesDebounced(250);
        });
        adicionarOuvinteSeguro(optPromptF1Gemini, 'paste', () => {
            setTimeout(ajustarELimitarLinhasPromptIA, 0);
        });
    }

    /* Passo 4.2.0: Botao para restaurar individualmente o modelo de prompt F1 ao padrao original */
    if (btnRestaurarPromptF1Padrao && optPromptF1Gemini) {
        adicionarOuvinteSeguro(btnRestaurarPromptF1Padrao, 'click', () => {
            optPromptF1Gemini.value = PROMPT_F1_GEMINI_PADRAO;
            ajustarELimitarLinhasPromptIA();
            salvarConfiguracoes();
            exibirToast('Modelo de comando restaurado para o padrão original!');
            optPromptF1Gemini.focus();
            optPromptF1Gemini.style.borderColor = '#10b981';
            setTimeout(() => {
                if (optPromptF1Gemini) optPromptF1Gemini.style.borderColor = '';
            }, 800);
        });
    }

    /* Passo 4.2.1: Botao para zerar estatisticas de copias e alertas localmente */
    adicionarOuvinteSeguro(btnResetarEstatisticas, 'click', () => {
        const agora = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const strData = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
        if (lblTotalCopias) lblTotalCopias.textContent = '0';
        if (lblTotalAlertas) lblTotalAlertas.textContent = '0';
        if (lblDataInicioContadores) lblDataInicioContadores.textContent = strData;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            if (chrome.storage.local) {
                chrome.storage.local.set({ totalCopias: 0, totalAlertas: 0, dataInicioContadores: strData }, () => {
                    exibirToast('Contadores zerados localmente!');
                });
            }
            if (chrome.storage.sync) {
                chrome.storage.sync.remove(['totalCopias', 'totalAlertas', 'dataInicioContadores']).catch(() => { });
            }
        }
    });

    /* Passo 4.3: Restaurar Padroes de Fabrica, zerando contadores locais e dados extras */
    /* Passo 4.2.5: Gerenciamento de Perfis (Selecionar, Criar, Renomear, Excluir) */
    function fecharModalGerenciarPerfil() {
        if (modalGerenciarPerfil) modalGerenciarPerfil.classList.remove('aberto');
    }

    function fecharModalResetPerfis() {
        if (modalConfirmarResetPerfis) modalConfirmarResetPerfis.classList.remove('aberto');
    }

    function abrirModalGerenciarPerfil(modo) {
        if (!modalGerenciarPerfil || !inputNomePerfilModal) return;
        modoModalGerenciarPerfil = modo === 'renomear' ? 'renomear' : 'criar';
        if (tituloModalGerenciarPerfil) {
            tituloModalGerenciarPerfil.textContent = (modoModalGerenciarPerfil === 'renomear')
                ? 'Renomear Perfil'
                : 'Novo Perfil de Uso';
        }
        if (containerOrigemNovoPerfil) {
            containerOrigemNovoPerfil.style.display = (modoModalGerenciarPerfil === 'renomear') ? 'none' : 'block';
        }
        inputNomePerfilModal.value = (modoModalGerenciarPerfil === 'renomear') ? obterNomePerfilAtivo() : '';
        modalGerenciarPerfil.classList.add('aberto');
        inputNomePerfilModal.focus();
        inputNomePerfilModal.select();
    }

    adicionarOuvinteSeguro(selectPerfilAtivo, 'change', async () => {
        if (!configuradorPerfis || !selectPerfilAtivo) return;
        const novoId = selectPerfilAtivo.value;
        if (!novoId || novoId === cachePerfilAtivoId) return;
        selectPerfilAtivo.disabled = true;
        try {
            const res = await configuradorPerfis.alternarPerfil(novoId, typeof chrome !== 'undefined' ? chrome : null);
            if (res && res.ok) {
                carregarConfiguracoesDoStorage();
                if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                }
                const nomeAtivado = (res.perfil && res.perfil.nome) || novoId;
                if (window.top && window.top.__JUSGOV_MOTOR_SELECAO_API__ && typeof window.top.__JUSGOV_MOTOR_SELECAO_API__.projetarMiniTipGlobalNoTop === 'function') {
                    window.top.__JUSGOV_MOTOR_SELECAO_API__.projetarMiniTipGlobalNoTop(`Perfil de Uso:\n${nomeAtivado}`, '#2563eb');
                } else {
                    exibirToast(`Perfil "${nomeAtivado}" ativado!`);
                }
            }
        } finally {
            selectPerfilAtivo.disabled = false;
        }
    });

    adicionarOuvinteSeguro(btnNovoPerfil, 'click', () => abrirModalGerenciarPerfil('criar'));
    adicionarOuvinteSeguro(btnRenomearPerfil, 'click', () => {
        const atual = cacheListaPerfis.find(p => p && p.id === cachePerfilAtivoId);
        if (!atual || atual.predefinido) return;
        abrirModalGerenciarPerfil('renomear');
    });

    adicionarOuvinteSeguro(btnExcluirPerfil, 'click', async () => {
        if (!configuradorPerfis) return;
        const atual = cacheListaPerfis.find(p => p && p.id === cachePerfilAtivoId);
        if (!atual || atual.predefinido) return;
        if (!window.confirm(`Deseja excluir o perfil "${atual.nome}"? Suas preferências serão removidas.`)) return;
        const res = await configuradorPerfis.excluirPerfil(atual.id, typeof chrome !== 'undefined' ? chrome : null);
        if (res && res.ok) {
            carregarConfiguracoesDoStorage();
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
            }
            exibirToast(`Perfil "${atual.nome}" excluído.`);
        } else {
            exibirToast('Não foi possível excluir este perfil.');
        }
    });

    adicionarOuvinteSeguro(btnCancelarGerenciarPerfil, 'click', fecharModalGerenciarPerfil);
    adicionarOuvinteSeguro(modalGerenciarPerfil, 'click', (e) => {
        if (e.target === modalGerenciarPerfil) fecharModalGerenciarPerfil();
    });

    adicionarOuvinteSeguro(btnConfirmarGerenciarPerfil, 'click', async () => {
        if (!configuradorPerfis || !inputNomePerfilModal) return;
        const nome = String(inputNomePerfilModal.value || '').trim();
        if (!nome) {
            exibirToast('Informe um nome válido para o perfil.');
            inputNomePerfilModal.focus();
            return;
        }
        if (modoModalGerenciarPerfil === 'renomear') {
            const res = await configuradorPerfis.renomearPerfil(cachePerfilAtivoId, nome, typeof chrome !== 'undefined' ? chrome : null);
            if (res && res.ok) {
                fecharModalGerenciarPerfil();
                carregarConfiguracoesDoStorage();
                exibirToast(`Perfil renomeado para "${nome}".`);
            } else {
                exibirToast('Não foi possível renomear o perfil.');
            }
        } else {
            const origem = selectOrigemNovoPerfil ? selectOrigemNovoPerfil.value : 'padrao';
            const res = await configuradorPerfis.criarPerfil(nome, { origem, ativar: true }, typeof chrome !== 'undefined' ? chrome : null);
            if (res && res.ok) {
                fecharModalGerenciarPerfil();
                carregarConfiguracoesDoStorage();
                if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                }
                exibirToast(`Perfil "${res.perfil.nome}" criado e ativado!`);
            } else {
                exibirToast('Já existe um perfil com este nome ou nome inválido.');
            }
        }
    });

    /* Passo 4.3: Restaurar Configuracoes com opcoes: "Apenas este Perfil (Nome)" (padrao), "Todos" ou "Cancelar" */
    adicionarOuvinteSeguro(btnRestaurarPadroes, 'click', () => {
        if (lblNomePerfilModalReset) {
            lblNomePerfilModalReset.textContent = obterNomePerfilAtivo();
        }
        if (modalConfirmarResetPerfis) {
            modalConfirmarResetPerfis.classList.add('aberto');
            if (btnResetPerfilAtual) btnResetPerfilAtual.focus();
        }
    });

    adicionarOuvinteSeguro(btnResetCancelar, 'click', fecharModalResetPerfis);
    adicionarOuvinteSeguro(modalConfirmarResetPerfis, 'click', (e) => {
        if (e.target === modalConfirmarResetPerfis) fecharModalResetPerfis();
    });

    adicionarOuvinteSeguro(btnResetPerfilAtual, 'click', async () => {
        fecharModalResetPerfis();
        const nomeAtual = obterNomePerfilAtivo();
        if (configuradorPerfis && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const res = await configuradorPerfis.resetarPerfis('atual', chrome);
            if (res && res.ok) {
                carregarConfiguracoesDoStorage();
                if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                }
                exibirToast(`Perfil "${nomeAtual}" restaurado para as configurações iniciais!`);
                return;
            }
        }
        exibirToast(`Perfil "${nomeAtual}" restaurado!`);
    });

    adicionarOuvinteSeguro(btnResetTodosPerfis, 'click', async () => {
        fecharModalResetPerfis();
        if (typeof chrome !== 'undefined' && chrome.storage) {
            if (chrome.storage.local) {
                const agora = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const strData = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                chrome.storage.local.clear(() => {
                    chrome.storage.local.set({ totalCopias: 0, totalAlertas: 0, dataInicioContadores: strData });
                    if (lblDataInicioContadores) lblDataInicioContadores.textContent = strData;
                    if (lblTotalCopias) lblTotalCopias.textContent = '0';
                    if (lblTotalAlertas) lblTotalAlertas.textContent = '0';
                });
            }
            if (chrome.storage.session) {
                chrome.storage.session.clear().catch(() => { });
            }
        }
        if (configuradorPerfis && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            const res = await configuradorPerfis.resetarPerfis('todos', chrome);
            if (res && res.ok) {
                marcarAlteracoesPendentesMapeamento(false);
                carregarConfiguracoesDoStorage();
                if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                }
                exibirToast('Todos os perfis foram restaurados e dados extras apagados com sucesso!');
                return;
            }
        }
        exibirToast('Todos os perfis restaurados!');
    });

    /* Passo 4.4: Exportar todas as configuracoes em arquivo JSON global */
    adicionarOuvinteSeguro(btnExportarJson, 'click', async () => {
        const overridesAtuais = coletarPayloadConfiguracoesUI();
        let syncData = {};
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                syncData = await chrome.storage.sync.get(null);
            } catch (_) { }
        }
        const dadosExportacao = configuradorPerfis
            ? configuradorPerfis.montarDadosExportacaoBackupTotal(syncData || {}, overridesAtuais)
            : { projeto: 'JusGovBR', ...overridesAtuais };

        const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jusgovbr-configuracoes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        exibirToast('Backup total (todos os perfis) exportado em JSON!');
    });

    /* Passo 4.5: Importar todas as configuracoes de arquivo JSON global */
    if (btnImportarJson && inputImportarArquivo) {
        adicionarOuvinteSeguro(btnImportarJson, 'click', () => {
            inputImportarArquivo.click();
        });

        adicionarOuvinteSeguro(inputImportarArquivo, 'change', (e) => {
            const arquivo = e.target.files && e.target.files[0];
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = async (ev) => {
                try {
                    const json = JSON.parse(String(ev.target.result || '{}'));
                    if (configuradorPerfis && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                        const resImp = await configuradorPerfis.importarBackupTotal(json, chrome);
                        if (resImp && resImp.ok) {
                            carregarConfiguracoesDoStorage();
                            if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                                chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                            }
                            exibirToast(resImp.backupTotal
                                ? 'Backup total (todos os perfis) importado e sincronizado na nuvem!'
                                : 'Backup JSON importado para o perfil ativo e sincronizado!');
                            return;
                        }
                    }
                    exibirToast('Erro: Não foi possível importar o arquivo JSON.');
                } catch (_) {
                    exibirToast('Erro: Arquivo JSON inválido.');
                }
            };
            leitor.readAsText(arquivo);
            inputImportarArquivo.value = '';
        });
    }

    /* Passo 4.5.1: Sincronizacao de perfil pelo Popup */
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg && msg.acao === 'PERFIL_ALTERADO') {
                carregarConfiguracoesDoStorage();
            }
        });
    }

    /* Passo 4.6: Controles de estado visual de Mouse, Descarte e Permissoes */
    function atualizarEstadoVisualSubopcoesMouse() {
        atualizarVisualAtencaoSwitches();
        atualizarCoresEBotoesClipboard();
        atualizarVisorClipboardPassivo();
    }

    function atualizarEstadoVisualOpcoesDescarte() {
        const ativo = optDescarteGuiasInativas ? optDescarteGuiasInativas.checked : false;
        if (containerOpcoesDescarte) {
            containerOpcoesDescarte.style.opacity = ativo ? '1' : '0.45';
            containerOpcoesDescarte.style.pointerEvents = ativo ? 'auto' : 'none';
        }
        if (optTempoInatividadeDescarteMinutos) optTempoInatividadeDescarteMinutos.disabled = !ativo;
    }

    async function alternarColarBotaoMeio() {
        if (!optColarBotaoMeio) return;
        salvarConfiguracoes();
        atualizarVisualAtencaoSwitches();
    }

    async function inicializarMonitorPermissaoClipboard() {
        atualizarCoresEBotoesClipboard();
        atualizarVisualAtencaoSwitches();
        atualizarVisorClipboardPassivo();
    }

    /* Passo 4.8: Escutar alteracoes vindas do atalho Esc+Esc, do Popup ou de contadores */
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                if (changes.perfilAtivoId || changes.listaPerfis) {
                    carregarConfiguracoesDoStorage();
                    return;
                }
                if (changes.modoTurbo) {
                    if (selectModoTurbo) selectModoTurbo.value = changes.modoTurbo.newValue;
                    atualizarIconeModoOptions(changes.modoTurbo.newValue);
                }
                if (changes.comportamentoCliqueIcone && selectComportamentoIcone) {
                    selectComportamentoIcone.value = changes.comportamentoCliqueIcone.newValue;
                }
                if (changes.manterFormatacaoBasica !== undefined && checkOpcaoRemoverFormatacoes) {
                    checkOpcaoRemoverFormatacoes.checked = !Boolean(changes.manterFormatacaoBasica.newValue);
                    atualizarEstadoOfuscamentoNivelFiltro();
                }
                if (changes.nivelFiltroFormatacao !== undefined && optNivelFiltroEstilos) {
                    optNivelFiltroEstilos.value = String(converterNivelFiltroParaIndice(changes.nivelFiltroFormatacao.newValue));
                    atualizarRotuloNivelFiltro();
                }
                if (changes.ativoAmpuletas !== undefined && checkOpcaoAmpuletas) {
                    checkOpcaoAmpuletas.checked = (changes.ativoAmpuletas.newValue !== false);
                }
                if (changes.modoPlaceholdersMinutasHtml !== undefined && selectModoPlaceholdersMinutasHtml) {
                    selectModoPlaceholdersMinutasHtml.value = changes.modoPlaceholdersMinutasHtml.newValue || 'placeholders';
                } else if (changes.placeholdersMinutasHtmlAtivo !== undefined && selectModoPlaceholdersMinutasHtml) {
                    selectModoPlaceholdersMinutasHtml.value = (changes.placeholdersMinutasHtmlAtivo.newValue !== false) ? 'placeholders' : 'desabilitado';
                } else if (changes.selecaoEditavelAtiva !== undefined && selectModoPlaceholdersMinutasHtml) {
                    selectModoPlaceholdersMinutasHtml.value = (changes.selecaoEditavelAtiva.newValue !== false) ? 'placeholders' : 'desabilitado';
                }
                if (changes.regrasMapeamentoElementos && Array.isArray(changes.regrasMapeamentoElementos.newValue)) {
                    renderizarListaRegrasMapeamento(changes.regrasMapeamentoElementos.newValue);
                }
                if (changes.alternarAbasRecentesCtrlTabAtiva !== undefined && optAlternarAbasRecentesCtrlTab) {
                    optAlternarAbasRecentesCtrlTab.checked = (changes.alternarAbasRecentesCtrlTabAtiva.newValue !== false);
                }
                if (changes.capturaBotoesMouse4e5Ativa !== undefined && optCapturaBotoesMouse4e5) {
                    optCapturaBotoesMouse4e5.checked = (changes.capturaBotoesMouse4e5Ativa.newValue !== false);
                }
                if (changes.colarBotaoMeioAtivo !== undefined && optColarBotaoMeio) {
                    optColarBotaoMeio.checked = (changes.colarBotaoMeioAtivo.newValue !== false);
                    atualizarEstadoVisualSubopcoesMouse();
                }
                if (changes.colagemBotaoDireitoAtiva !== undefined || changes.colarBotaoMeioAtivo !== undefined) {
                    obterEstadoPermissaoClipboard().then((perm) => {
                        atualizarVisualAtencaoSwitches(perm);
                        atualizarCoresEBotoesClipboard(perm);
                        atualizarVisorClipboardPassivo();
                    });
                }
                if (changes.navegacaoTecladoCamposAtiva !== undefined && optNavegacaoTecladoCampos) {
                    optNavegacaoTecladoCampos.checked = (changes.navegacaoTecladoCamposAtiva.newValue !== false);
                }
                if (changes.caixaEntradaRapidaAtiva !== undefined && optCaixaEntradaRapida) {
                    optCaixaEntradaRapida.checked = (changes.caixaEntradaRapidaAtiva.newValue !== false);
                }
                if (changes.bloquearNovasJanelas !== undefined && optBloquearNovasJanelas) {
                    optBloquearNovasJanelas.checked = (changes.bloquearNovasJanelas.newValue !== false);
                }
                if (changes.preservarJanelasAutenticacao !== undefined && optPreservarJanelasAutenticacao) {
                    optPreservarJanelasAutenticacao.checked = (changes.preservarJanelasAutenticacao.newValue !== false);
                }
                if (changes.abaEmPrimeiroPlano !== undefined && optAbaEmPrimeiroPlano) {
                    optAbaEmPrimeiroPlano.checked = Boolean(changes.abaEmPrimeiroPlano.newValue);
                } else if (changes.abaEmSegundoPlano !== undefined && optAbaEmPrimeiroPlano) {
                    optAbaEmPrimeiroPlano.checked = (changes.abaEmSegundoPlano.newValue === false);
                }
                if (changes.reutilizarAbasAbertas !== undefined && optReutilizarAbasAbertas) {
                    optReutilizarAbasAbertas.checked = Boolean(changes.reutilizarAbasAbertas.newValue);
                    atualizarVisibilidadeSubOpcoesReutilizar();
                }
                if (changes.reutilizarAbasFocoPrimeiroPlano !== undefined && optReutilizarFocoPrimeiroPlano) {
                    optReutilizarFocoPrimeiroPlano.checked = Boolean(changes.reutilizarAbasFocoPrimeiroPlano.newValue);
                    atualizarVisibilidadeSubOpcoesReutilizar();
                }
                if (changes.protegerGuiasModificadas !== undefined && optProtegerGuiasModificadas) {
                    optProtegerGuiasModificadas.checked = Boolean(changes.protegerGuiasModificadas.newValue);
                }
                if (changes.reutilizarAbasAcaoConteudo !== undefined) {
                    const novaAcao = changes.reutilizarAbasAcaoConteudo.newValue || 'manter';
                    if (optReutilizarAcaoRecarregar && novaAcao === 'recarregar') {
                        optReutilizarAcaoRecarregar.checked = true;
                    } else if (optReutilizarAcaoRecarregarSeModificada && novaAcao === 'recarregar_se_modificada') {
                        optReutilizarAcaoRecarregarSeModificada.checked = true;
                    } else if (optReutilizarAcaoRecarregarSeNaoModificada && novaAcao === 'recarregar_se_nao_modificada') {
                        optReutilizarAcaoRecarregarSeNaoModificada.checked = true;
                    } else if (optReutilizarAcaoManter) {
                        optReutilizarAcaoManter.checked = true;
                    }
                }
                if (changes.monitorarUrlOriginalAbertura !== undefined && optMonitorarUrlOriginal) {
                    optMonitorarUrlOriginal.checked = Boolean(changes.monitorarUrlOriginalAbertura.newValue);
                }
                if (changes.monitorarUrlAtualPagina !== undefined && optMonitorarUrlAtual) {
                    optMonitorarUrlAtual.checked = (changes.monitorarUrlAtualPagina.newValue !== false);
                }
                if (changes.criterioOrdenacaoGuias !== undefined && optCriterioOrdenacaoGuias) {
                    optCriterioOrdenacaoGuias.value = changes.criterioOrdenacaoGuias.newValue || 'nenhum';
                }
                if (changes.sentidoOrdenacaoGuias !== undefined && optSentidoOrdenacaoGuias) {
                    const novoSentido = changes.sentidoOrdenacaoGuias.newValue || 'esq_dir';
                    optSentidoOrdenacaoGuias.value = novoSentido;
                    if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (novoSentido === 'esq_dir');
                    aplicarRotuloSentidoOrdenacao(novoSentido === 'esq_dir');
                }
                if (changes.ordenarGuiasFixadas !== undefined && optOrdenarGuiasFixadas) {
                    optOrdenarGuiasFixadas.checked = Boolean(changes.ordenarGuiasFixadas.newValue);
                }
                if (changes.descarteGuiasInativasAtivo !== undefined && optDescarteGuiasInativas) {
                    optDescarteGuiasInativas.checked = Boolean(changes.descarteGuiasInativasAtivo.newValue);
                    atualizarEstadoVisualOpcoesDescarte();
                }
                if (changes.tempoInatividadeDescarteMinutos !== undefined && optTempoInatividadeDescarteMinutos) {
                    optTempoInatividadeDescarteMinutos.value = String(changes.tempoInatividadeDescarteMinutos.newValue || '20');
                    atualizarEstadoVisualOpcoesDescarte();
                }
                if (changes.tempoConferenciaDocumentosMs !== undefined && optTempoConferenciaDocumentos) {
                    const novoTempoConf = changes.tempoConferenciaDocumentosMs.newValue !== undefined ? Number(changes.tempoConferenciaDocumentosMs.newValue) : -1;
                    optTempoConferenciaDocumentos.value = String(converterMsParaIndiceSliderConferencia(novoTempoConf));
                    atualizarRotuloSliderConferencia();
                    atualizarVisibilidadeSubOpcoesValidacao();
                } else if (changes.validacaoMatematicaAtiva !== undefined && optValidacaoMatematicaAtiva) {
                    const valAtiva = (changes.validacaoMatematicaAtiva.newValue !== false);
                    optValidacaoMatematicaAtiva.checked = valAtiva;
                    if (optTempoConferenciaDocumentos && changes.tempoConferenciaDocumentosMs === undefined) {
                        optTempoConferenciaDocumentos.value = valAtiva ? '6' : '0';
                        atualizarRotuloSliderConferencia();
                    }
                    atualizarVisibilidadeSubOpcoesValidacao();
                }
                if (changes.modoExibicaoValidacao !== undefined && optModoExibicaoValidacao) {
                    optModoExibicaoValidacao.value = (changes.modoExibicaoValidacao.newValue === 'apenas_erros') ? 'apenas_erros' : 'sempre';
                }
                if (changes.posicaoAvisosValidacao !== undefined && optPosicaoAvisosValidacao) {
                    optPosicaoAvisosValidacao.value = (changes.posicaoAvisosValidacao.newValue === 'acima') ? 'acima' : 'abaixo';
                }
                if (changes.tempoFlashBorderMs !== undefined && optTempoFlashMs) {
                    const normFlash = normalizarTempoFlashMs(changes.tempoFlashBorderMs.newValue);
                    optTempoFlashMs.value = normFlash === -1 ? '5250' : String(normFlash);
                    atualizarRotuloSliderFlash();
                }
                if (changes.corFlashBorder !== undefined && optCorFlashBorder) {
                    optCorFlashBorder.value = normalizarCorHex(changes.corFlashBorder.newValue);
                }
                if (changes.marcadorConteudoColadoAtivo !== undefined && optMarcadorConteudoColadoAtivo) {
                    optMarcadorConteudoColadoAtivo.checked = (changes.marcadorConteudoColadoAtivo.newValue !== false);
                    atualizarVisibilidadeSubOpcoesMarcadorColado();
                }
                if (changes.presetMarcadorColado !== undefined && optPresetMarcadorColado) {
                    optPresetMarcadorColado.value = normalizarPresetMarcadorColado(changes.presetMarcadorColado.newValue);
                }
                if (changes.tipoContornoMarcadorColado !== undefined && optTipoContornoMarcadorColado) {
                    optTipoContornoMarcadorColado.value = normalizarTipoContornoMarcadorColado(changes.tipoContornoMarcadorColado.newValue);
                }
                if (changes.corContornoMarcadorColado !== undefined && optCorContornoMarcadorColado) {
                    optCorContornoMarcadorColado.value = normalizarCorHex(changes.corContornoMarcadorColado.newValue);
                }
                if (changes.corFundoMarcadorColado !== undefined && optCorFundoMarcadorColado) {
                    optCorFundoMarcadorColado.value = normalizarCorHexFundoMarcador(changes.corFundoMarcadorColado.newValue);
                }
                if (changes.estiloBadgeMarcadorColado !== undefined && optEstiloBadgeMarcadorColado) {
                    optEstiloBadgeMarcadorColado.value = normalizarEstiloBadgeMarcadorColado(changes.estiloBadgeMarcadorColado.newValue);
                }
                if (changes.modoRetirarSelecao !== undefined && optModoRetirarSelecao) {
                    optModoRetirarSelecao.value = normalizarModoRetirarSelecao(changes.modoRetirarSelecao.newValue);
                }
                if (changes.minimoCaracteresInterface !== undefined && optMinimoCaracteresInterface) {
                    const minChg = parseInt(changes.minimoCaracteresInterface.newValue, 10);
                    optMinimoCaracteresInterface.value = [0, 1, 2, 3, 4, 5, 10].includes(minChg) ? String(minChg) : '5';
                }
                if (changes.converterCabecalhoPjeAtivo !== undefined && optConverterCabecalhoPje) {
                    optConverterCabecalhoPje.checked = (changes.converterCabecalhoPjeAtivo.newValue !== false);
                }
                if (changes.atalhoF1GeminiAtivo !== undefined && optAtalhoF1GeminiAtivo) {
                    optAtalhoF1GeminiAtivo.checked = (changes.atalhoF1GeminiAtivo.newValue !== false);
                }
                if (changes.promptF1Gemini !== undefined && optPromptF1Gemini) {
                    optPromptF1Gemini.value = (typeof changes.promptF1Gemini.newValue === 'string')
                        ? changes.promptF1Gemini.newValue
                        : PROMPT_F1_GEMINI_PADRAO;
                }
                if (changes.urlsTurbo !== undefined && textoUrlsTurbo && Array.isArray(changes.urlsTurbo.newValue)) {
                    const listaLimpa = changes.urlsTurbo.newValue.filter(u => u && u !== '<all_urls>');
                    textoUrlsTurbo.value = (listaLimpa.length > 0 ? listaLimpa : PADROES_FABRICA_TURBO).join('\n');
                }
                if (changes.separadorAcumulador !== undefined && optAcumuladorSeparador) {
                    optAcumuladorSeparador.value = normalizarSeparadorAcumulador(changes.separadorAcumulador.newValue);
                }
                if (changes.regrasMapeamentoElementos !== undefined && Array.isArray(changes.regrasMapeamentoElementos.newValue)) {
                    renderizarListaRegrasMapeamento(changes.regrasMapeamentoElementos.newValue);
                }
                atualizarTodasVisibilidadesCascata();
            }
            if (area === 'local' || area === 'sync') {
                if (changes.ultimoClipboardInterno !== undefined) {
                    if (changes.ultimoClipboardInterno.newValue) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = changes.ultimoClipboardInterno.newValue;
                    }
                    if (!document.hidden && !moduloLaboratorio.estaLendoManualmente()) {
                        atualizarVisorClipboardPassivo();
                    }
                }
                if (changes.ultimoClipboardAnteriorInterno !== undefined) {
                    if (changes.ultimoClipboardAnteriorInterno.newValue) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = changes.ultimoClipboardAnteriorInterno.newValue;
                    }
                    if (!document.hidden && !moduloLaboratorio.estaLendoManualmente()) {
                        atualizarVisorClipboardPassivo();
                    }
                }
                if (changes.historicoClipboardInterno !== undefined && Array.isArray(changes.historicoClipboardInterno.newValue)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__ = changes.historicoClipboardInterno.newValue;
                }
                if (changes.totalCopias !== undefined && lblTotalCopias) {
                    const stCopias = sanitizarContadorOperacional(changes.totalCopias.newValue);
                    lblTotalCopias.textContent = String(stCopias.valorSeguro);
                }
                if (changes.totalAlertas !== undefined && lblTotalAlertas) {
                    const stAlertas = sanitizarContadorOperacional(changes.totalAlertas.newValue);
                    lblTotalAlertas.textContent = String(stAlertas.valorSeguro);
                }
                if (changes.dataInicioContadores !== undefined && lblDataInicioContadores) {
                    lblDataInicioContadores.textContent = String(changes.dataInicioContadores.newValue || '');
                }
            }
        });
    }

    (async () => {
        if (window.JusGovCfgDefaults) {
            const apiChrome = typeof chrome !== 'undefined' ? chrome : null;
            await Promise.all([
                typeof window.JusGovCfgDefaults.carregarCatalogoPerfisJson === 'function'
                    ? window.JusGovCfgDefaults.carregarCatalogoPerfisJson(apiChrome)
                    : Promise.resolve(),
                typeof window.JusGovCfgDefaults.carregarDadosForensesJson === 'function'
                    ? window.JusGovCfgDefaults.carregarDadosForensesJson(apiChrome)
                    : Promise.resolve(),
                typeof window.JusGovCfgDefaults.carregarRegrasSistemaJson === 'function'
                    ? window.JusGovCfgDefaults.carregarRegrasSistemaJson(apiChrome)
                    : Promise.resolve()
            ]);
        }
        configurarNavegacaoAbas();
        carregarConfiguracoesDoStorage();
        inicializarMonitorPermissaoClipboard();
    })();

    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['ultimoClipboardInterno', 'ultimoClipboardAnteriorInterno', 'historicoClipboardInterno'], (res) => {
                if (res) {
                    if (res.ultimoClipboardInterno) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = res.ultimoClipboardInterno;
                    }
                    if (res.ultimoClipboardAnteriorInterno) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = res.ultimoClipboardAnteriorInterno;
                    }
                    if (Array.isArray(res.historicoClipboardInterno)) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__ = res.historicoClipboardInterno;
                    }
                    if (!moduloLaboratorio.estaLendoManualmente()) {
                        atualizarVisorClipboardPassivo();
                    }
                }
            });
        }
    } catch (_) { }

    window.JusGovOptions = Object.freeze({
        atualizarCoresEBotoesClipboard,
        obterEstadoPermissaoClipboard,
        acionarLeituraClipboardComPrompt,
        atualizarVisibilidadeSubOpcoesReutilizar
    });
});
