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
const ESCALA_TEMPO_ALERTA_MS = Object.freeze([0, 2000, 3500, 5000, 7500, 10000, -1]);
const ROTULOS_TEMPO_ALERTA_HTML = Object.freeze([
    '0 (Desabilitado)',
    '2s (Rápido)',
    '3,5s',
    '5s (Lento)',
    '7,5s (Super lento)',
    '10s (Ultra lento)',
    'Até Interação (Padrão)'
]);
const ESCALA_TEMPO_CONFERENCIA_DOCUMENTOS_MS = Object.freeze([0, 1000, 2000, 3000, 4000, 5000, -1]);
const ROTULOS_TEMPO_CONFERENCIA_DOCUMENTOS_HTML = Object.freeze([
    '0 (Desabilitado)',
    '1s',
    '2s',
    '3s',
    '4s',
    '5s',
    'Até Interação (Padrão)'
]);
const PRESETS_MARCADOR_CONTEUDO_COLADO = Object.freeze({
    verde_forense: { corContorno: '#0d9488', corFundo: '#ccfbf1' },
    marca_texto_classico: { corContorno: '#ca8a04', corFundo: '#fef08a' },
    azul_indigo: { corContorno: '#4f46e5', corFundo: '#e0e7ff' },
    ambar_suave: { corContorno: '#d97706', corFundo: '#fef3c7' },
    alto_contraste: { corContorno: '#1e293b', corFundo: '#e2e8f0' }
});
const COR_PADRAO_FLASH_BORDER = '#0d9488';
const COR_PADRAO_FUNDO_MARCADOR = '#ccfbf1';
const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 900000000;
const PROMPT_F1_GEMINI_PADRAO = "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";

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
    const optColagemBotaoDireito = document.getElementById('optColagemBotaoDireito');
    const lblSwitchColagemBotaoDireito = document.getElementById('lblSwitchColagemBotaoDireito');
    const avisoPermissaoBotaoDireito = document.getElementById('avisoPermissaoBotaoDireito');
    const optAlternarAbasRecentesCtrlTab = document.getElementById('optAlternarAbasRecentesCtrlTab');
    const optCapturaBotoesMouse4e5 = document.getElementById('optCapturaBotoesMouse4e5');
    const optColarBotaoMeio = document.getElementById('optColarBotaoMeio');
    const lblSwitchColarBotaoMeio = document.getElementById('lblSwitchColarBotaoMeio');
    const avisoPermissaoBotaoMeio = document.getElementById('avisoPermissaoBotaoMeio');
    const optNavegacaoTecladoCampos = document.getElementById('optNavegacaoTecladoCampos');
    const optCaixaEntradaRapida = document.getElementById('optCaixaEntradaRapida');
    const optBloquearNovasJanelas = document.getElementById('optBloquearNovasJanelas');
    const optPreservarJanelasAutenticacao = document.getElementById('optPreservarJanelasAutenticacao');
    const optAbaEmPrimeiroPlano = document.getElementById('optAbaEmPrimeiroPlano') || document.getElementById('optAbaEmSegundoPlano');
    const optAbaEmSegundoPlano = optAbaEmPrimeiroPlano;
    const optReutilizarAbasAbertas = document.getElementById('optReutilizarAbasAbertas');
    const containerSubOpcoesReutilizarAbas = document.getElementById('containerSubOpcoesReutilizarAbas');
    const optReutilizarFocoPrimeiroPlano = document.getElementById('optReutilizarFocoPrimeiroPlano');
    const containerSubCriteriosAcoesReutilizar = document.getElementById('containerSubCriteriosAcoesReutilizar');
    const selectReutilizarAcaoConteudo = document.getElementById('selectReutilizarAcaoConteudo');
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
    const btnOrdenarGuiasAgora = document.getElementById('btnOrdenarGuiasAgora');
    const btnAgruparDominioAgora = document.getElementById('btnAgruparDominioAgora');
    const btnDesagruparGuiasAgora = document.getElementById('btnDesagruparGuiasAgora');
    const btnRestaurarOrdemGuiasPadrao = document.getElementById('btnRestaurarOrdemGuiasPadrao');
    const feedbackAcoesGuias = document.getElementById('feedbackAcoesGuias');
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
    const checkOpcaoAmpuletas = document.getElementById('checkOpcaoAmpuletas') || document.getElementById('optAntiAmpulhetaPjeAtivo');
    const optConverterCabecalhoPje = document.getElementById('optConverterCabecalhoPje');
    const optTempoExibicaoAlerta = document.getElementById('optTempoExibicaoAlerta');
    const lblValorTempoAlerta = document.getElementById('lblValorTempoAlerta');
    const optTempoFlashMs = document.getElementById('optTempoFlashMs');
    const optCorFlashBorder = document.getElementById('optCorFlashBorder');
    const lblValorTempoFlash = document.getElementById('lblValorTempoFlash');
    const optMarcadorConteudoColadoAtivo = document.getElementById('optMarcadorConteudoColadoAtivo');
    const painelCustomizacaoMarcadorColado = document.getElementById('painelCustomizacaoMarcadorColado');
    const optPresetMarcadorColado = document.getElementById('optPresetMarcadorColado');
    const optCorContornoMarcadorColado = document.getElementById('optCorContornoMarcadorColado');
    const optCorFundoMarcadorColado = document.getElementById('optCorFundoMarcadorColado');
    const optEstiloBadgeMarcadorColado = document.getElementById('optEstiloBadgeMarcadorColado');
    const optModoRetirarSelecao = document.getElementById('optModoRetirarSelecao');
    const optMinimoCaracteresInterface = document.getElementById('optMinimoCaracteresInterface');
    const optAcumuladorSeparador = document.getElementById('optAcumuladorSeparador');
    const optAtalhoF1GeminiAtivo = document.getElementById('optAtalhoF1GeminiAtivo');
    const optPromptF1Gemini = document.getElementById('optPromptF1Gemini');
    const btnRestaurarPromptF1Padrao = document.getElementById('btnRestaurarPromptF1Padrao');
    const containerSubOpcaoJanelaUnica = document.getElementById('containerSubOpcaoJanelaUnica');
    const containerSubOpcaoF1Gemini = document.getElementById('containerSubOpcaoF1Gemini');
    const containerTempoExibicaoAlerta = document.getElementById('containerTempoExibicaoAlerta');
    const containerSubControlesOrdenacao = document.getElementById('containerSubControlesOrdenacao');
    const lblTotalCopias = document.getElementById('lblTotalCopias');
    const lblTotalAlertas = document.getElementById('lblTotalAlertas');
    const lblDataInicioContadores = document.getElementById('lblDataInicioContadores');
    const btnResetarEstatisticas = document.getElementById('btnResetarEstatisticas');

    /* Botoes de Persistencia e Backup */
    const btnSalvarConfiguracoes = document.getElementById('btnSalvarConfiguracoes');
    const btnRestaurarPadroes = document.getElementById('btnRestaurarPadroes');
    const btnExportarJson = document.getElementById('btnExportarJson');
    const btnImportarJson = document.getElementById('btnImportarJson');
    const inputImportarArquivo = document.getElementById('inputImportarArquivo');

    /* Mapeamento Manual Avançado de Elementos (XPath / CSS) (Seção 6.20 e Seção 6.85) */
    const detalhesMapeamentoXPath = document.getElementById('detalhesMapeamentoXPath');
    const btnExportarMapeamentoJson = document.getElementById('btnExportarMapeamentoJson');
    const btnImportarMapeamentoJson = document.getElementById('btnImportarMapeamentoJson');
    const inputImportarMapeamentoArquivo = document.getElementById('inputImportarMapeamentoArquivo');
    const containerListaRegrasMapeamento = document.getElementById('containerListaRegrasMapeamento');
    let regrasMapeamentoAtuais = [];

    function normalizarTipoSeletorRotulo(regra) {
        if (regra && regra.tipoSeletor && typeof regra.tipoSeletor === 'string') {
            return regra.tipoSeletor;
        }
        const expr = (regra && regra.expressao) ? String(regra.expressao).trim() : '';
        if (expr.startsWith('//') || expr.startsWith('(')) return 'XPath Simplificado';
        if (expr.startsWith('/')) return 'XPath Completo';
        if (/^document\.querySelector/i.test(expr)) return 'Caminho JS';
        return 'Seletor CSS';
    }

    function renderizarListaRegrasMapeamento(regras) {
        if (!containerListaRegrasMapeamento) return;
        regrasMapeamentoAtuais = Array.isArray(regras) ? [...regras] : [...PADROES_FABRICA_REGRAS_MAPEAMENTO];
        containerListaRegrasMapeamento.innerHTML = '';

        if (regrasMapeamentoAtuais.length === 0) {
            const vazio = document.createElement('div');
            vazio.style.cssText = 'color: #94a3b8; font-size: 12px; font-style: italic; padding: 10px 0; line-height: 1.5;';
            vazio.textContent = 'Nenhuma regra customizada cadastrada. Utilize Ctrl + Alt + Shift + Clique sobre qualquer elemento em páginas web para abrir o assistente e cadastrar novas regras.';
            containerListaRegrasMapeamento.appendChild(vazio);
            return;
        }

        regrasMapeamentoAtuais.forEach((regra, idx) => {
            const item = document.createElement('div');
            item.className = 'item-regra-mapeamento';
            item.style.cssText = 'display: flex; gap: 8px; align-items: center; background: #1e293b; padding: 8px 10px; border-radius: 6px; border: 1px solid #334155; flex-wrap: wrap;';

            // Badge com Tipo de Seletor (XPath Simplificado, XPath Completo, Seletor CSS ou Caminho JS)
            const badgeTipo = document.createElement('span');
            badgeTipo.className = 'badge-tipo-seletor';
            badgeTipo.style.cssText = 'font-size: 10px; font-weight: 700; color: #38bdf8; background: #0f172a; border: 1px solid #0284c7; padding: 2px 6px; border-radius: 4px; white-space: nowrap;';
            badgeTipo.textContent = normalizarTipoSeletorRotulo(regra);

            // Campo Expressao (XPath / CSS / JS Path)
            const inputExpr = document.createElement('input');
            inputExpr.type = 'text';
            inputExpr.className = 'campo-input-escuro';
            inputExpr.style.cssText = 'flex: 2 1 200px; min-width: 160px; font-family: monospace; font-size: 11px; padding: 4px 8px; background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 4px;';
            inputExpr.value = regra.expressao || '';
            inputExpr.placeholder = 'Expressão (XPath, CSS, JS Path)';
            inputExpr.addEventListener('change', () => {
                regrasMapeamentoAtuais[idx].expressao = inputExpr.value.trim();
                salvarRegrasMapeamento();
            });

            // Seletor de Modo Comportamental (Interface, Semiflexível, Textual)
            const selectTipo = document.createElement('select');
            selectTipo.className = 'select-customizado';
            selectTipo.style.cssText = 'padding: 4px 8px; font-size: 11px; background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 4px; cursor: pointer; flex: 1 1 140px;';

            const optInterface = document.createElement('option');
            optInterface.value = 'interface';
            optInterface.textContent = 'Interface (Desseleção / Alt)';
            if (regra.tipo === 'interface') optInterface.selected = true;

            const optSemiflexivel = document.createElement('option');
            optSemiflexivel.value = 'semiflexivel';
            optSemiflexivel.textContent = 'Semiflexível (Máscaras Forenses)';
            if (regra.tipo === 'semiflexivel') optSemiflexivel.selected = true;

            const optTextual = document.createElement('option');
            optTextual.value = 'textual';
            optTextual.textContent = 'Textual (Leitura / Manter)';
            if (regra.tipo === 'textual') optTextual.selected = true;

            selectTipo.appendChild(optInterface);
            selectTipo.appendChild(optSemiflexivel);
            selectTipo.appendChild(optTextual);

            selectTipo.addEventListener('change', () => {
                regrasMapeamentoAtuais[idx].tipo = selectTipo.value;
                salvarRegrasMapeamento();
            });

            // Campo Observação (até 150 caracteres)
            const inputObs = document.createElement('input');
            inputObs.type = 'text';
            inputObs.maxLength = 150;
            inputObs.className = 'campo-input-escuro';
            inputObs.style.cssText = 'flex: 1 1 140px; min-width: 120px; font-size: 11px; padding: 4px 8px; background: #0f172a; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px;';
            inputObs.value = regra.observacao || '';
            inputObs.placeholder = 'Observação (até 150 carac.)';
            inputObs.title = regra.observacao || 'Observação identificadora da regra';
            inputObs.addEventListener('change', () => {
                regrasMapeamentoAtuais[idx].observacao = inputObs.value.trim().substring(0, 150);
                salvarRegrasMapeamento();
            });

            // Checkbox Herdar Filhos
            const labelHerdar = document.createElement('label');
            labelHerdar.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #cbd5e1; cursor: pointer; user-select: none; margin: 0;';
            const chkHerdar = document.createElement('input');
            chkHerdar.type = 'checkbox';
            chkHerdar.checked = regra.herdarFilhos !== false;
            chkHerdar.addEventListener('change', () => {
                regrasMapeamentoAtuais[idx].herdarFilhos = chkHerdar.checked;
                salvarRegrasMapeamento();
            });
            labelHerdar.appendChild(chkHerdar);
            labelHerdar.appendChild(document.createTextNode('Filhos'));

            // Checkbox Ativo
            const labelAtivo = document.createElement('label');
            labelAtivo.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #cbd5e1; cursor: pointer; user-select: none; margin: 0;';
            const chkAtivo = document.createElement('input');
            chkAtivo.type = 'checkbox';
            chkAtivo.checked = regra.ativo !== false;
            chkAtivo.addEventListener('change', () => {
                regrasMapeamentoAtuais[idx].ativo = chkAtivo.checked;
                salvarRegrasMapeamento();
            });
            labelAtivo.appendChild(chkAtivo);
            labelAtivo.appendChild(document.createTextNode('Ativo'));

            // Botao Excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'btn btn-secundario';
            btnExcluir.style.cssText = 'padding: 2px 6px; font-size: 12px; line-height: 1; border-color: #ef4444; color: #ef4444; cursor: pointer;';
            btnExcluir.title = 'Excluir regra';
            btnExcluir.textContent = '🗑️';
            btnExcluir.addEventListener('click', () => {
                regrasMapeamentoAtuais.splice(idx, 1);
                renderizarListaRegrasMapeamento(regrasMapeamentoAtuais);
                salvarRegrasMapeamento();
            });

            item.appendChild(badgeTipo);
            item.appendChild(inputExpr);
            item.appendChild(selectTipo);
            item.appendChild(inputObs);
            item.appendChild(labelHerdar);
            item.appendChild(labelAtivo);
            item.appendChild(btnExcluir);

            containerListaRegrasMapeamento.appendChild(item);
        });
    }

    function salvarRegrasMapeamento() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ regrasMapeamentoElementos: regrasMapeamentoAtuais }, () => {
                if (typeof chrome.runtime !== 'undefined' && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        acao: 'regrasMapeamentoAtualizadas',
                        regrasMapeamentoElementos: regrasMapeamentoAtuais
                    }).catch(() => { });
                }
            });
        }
    }

    /* Controles do Laboratorio, Console e Auditoria */
    const previewAreaTransferencia = document.getElementById('previewAreaTransferencia');
    const previewAreaTransferenciaAnterior = document.getElementById('previewAreaTransferenciaAnterior');
    const avisoPermissaoClipboardInspector = document.getElementById('avisoPermissaoClipboardInspector');
    const btnAtualizarPreview = document.getElementById('btnAtualizarPreview');
    const btnDownloadXMouse = document.getElementById('btnDownloadXMouse');
    const btnExecutarAuditoriaDebug = document.getElementById('btnExecutarAuditoriaDebug');
    const btnExecutarFuzzingDebug = document.getElementById('btnExecutarFuzzingDebug');
    const painelResultadoAuditoria = document.getElementById('painelResultadoAuditoria');
    const btnLimparConsole = document.getElementById('btnLimparConsole');
    const visorMensagensConsole = document.getElementById('visorMensagensConsole');
    const painelMensagensConsole = document.getElementById('painelMensagensConsole');
    const lblContadorConsole = document.getElementById('lblContadorConsole');
    const toastNotificacao = document.getElementById('toastNotificacao');

    let timerToast = null;
    const historicoMensagensConsole = [];

    /* Passo 1.2.1: Sistema de Prioridades e Interceptador Seguro de Console */
    const PRIORIDADES_LOG = Object.freeze({
        TRACE: 10,
        DEBUG: 20,
        INFO: 30,
        WARN: 40,
        ERROR: 50,
        FATAL: 60
    });

    let nivelMinimoLog = PRIORIDADES_LOG.WARN; // Somente >= WARN por padrao em producao
    if (typeof window !== 'undefined' && window.__JUSGOV_LOG_LEVEL__) {
        const lvlStr = String(window.__JUSGOV_LOG_LEVEL__).toUpperCase();
        if (PRIORIDADES_LOG[lvlStr] !== undefined) {
            nivelMinimoLog = PRIORIDADES_LOG[lvlStr];
        }
    }

    window.JusGovConfigurarNivelLog = function (nivel) {
        if (typeof nivel === 'string') {
            const up = nivel.toUpperCase();
            if (PRIORIDADES_LOG[up] !== undefined) {
                nivelMinimoLog = PRIORIDADES_LOG[up];
                return true;
            }
        } else if (typeof nivel === 'number' && Number.isFinite(nivel)) {
            nivelMinimoLog = nivel;
            return true;
        }
        return false;
    };

    const consoleOriginal = {
        trace: console.trace ? console.trace.bind(console) : () => { },
        debug: console.debug ? console.debug.bind(console) : () => { },
        log: console.log.bind(console),
        info: console.info ? console.info.bind(console) : console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    function formatarArgumentoConsole(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (_) { return String(arg); }
        }
        return String(arg);
    }

    function registrarMensagemNoVisorConsole(nivelNome, args) {
        const prioChave = String(nivelNome || 'INFO').toUpperCase();
        const valorPrio = PRIORIDADES_LOG[prioChave] || PRIORIDADES_LOG.INFO;

        /* Filtrar: somente mensagens com prioridade >= nivelMinimoLog (padrao: WARN) sao exibidas no console */
        if (valorPrio < nivelMinimoLog) {
            return;
        }

        const textoMsg = Array.from(args).map(formatarArgumentoConsole).join(' ');
        /* Filtrar saidas de baterias de testes automatizados para manter o console isolado apenas para operacao e erros */
        if (typeof textoMsg === 'string' && (
            textoMsg.includes('RELATORIO DE AUDITORIA') ||
            textoMsg.includes('BATERIA') ||
            textoMsg.includes('Escala de Cursor') ||
            textoMsg.includes('[OK] [') ||
            textoMsg.includes('[FALHA] [')
        )) {
            return;
        }

        const agora = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dd = pad(agora.getDate());
        const mm = pad(agora.getMonth() + 1);
        const aaaa = agora.getFullYear();
        const hh = pad(agora.getHours());
        const min = pad(agora.getMinutes());
        const ss = pad(agora.getSeconds());
        const dms = Math.floor(agora.getMilliseconds() / 100);
        const prefixoDataHora = `${dd}/${mm}/${aaaa} ${hh}:${min}:${ss}.${dms}`;
        const prioFormatada = prioChave.toLowerCase();

        const linhaFormatada = `${prefixoDataHora} [${prioFormatada}] ${textoMsg}`;
        historicoMensagensConsole.push(linhaFormatada);
        if (historicoMensagensConsole.length > 250) {
            historicoMensagensConsole.shift();
        }
        if (lblContadorConsole) {
            lblContadorConsole.textContent = String(historicoMensagensConsole.length);
        }
        const textoConsolidado = historicoMensagensConsole.join('\n');
        if (visorMensagensConsole) {
            visorMensagensConsole.textContent = textoConsolidado;
            visorMensagensConsole.scrollTop = visorMensagensConsole.scrollHeight;
        }
        if (painelMensagensConsole && painelMensagensConsole.style.display === 'block') {
            painelMensagensConsole.textContent = textoConsolidado;
            painelMensagensConsole.scrollTop = painelMensagensConsole.scrollHeight;
        }
    }

    function registrarMensagemDiretaNoVisorConsole(nivelNome, textoMsg) {
        const agora = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dd = pad(agora.getDate());
        const mm = pad(agora.getMonth() + 1);
        const aaaa = agora.getFullYear();
        const hh = pad(agora.getHours());
        const min = pad(agora.getMinutes());
        const ss = pad(agora.getSeconds());
        const dms = Math.floor(agora.getMilliseconds() / 100);
        const prefixoDataHora = `${dd}/${mm}/${aaaa} ${hh}:${min}:${ss}.${dms}`;
        const prioFormatada = String(nivelNome || 'INFO').toLowerCase();

        const linhaFormatada = `${prefixoDataHora} [${prioFormatada}] ${textoMsg}`;
        historicoMensagensConsole.push(linhaFormatada);
        if (historicoMensagensConsole.length > 250) {
            historicoMensagensConsole.shift();
        }
        if (lblContadorConsole) {
            lblContadorConsole.textContent = String(historicoMensagensConsole.length);
        }
        const textoConsolidado = historicoMensagensConsole.join('\n');
        if (visorMensagensConsole) {
            visorMensagensConsole.textContent = textoConsolidado;
            visorMensagensConsole.scrollTop = visorMensagensConsole.scrollHeight;
        }
        if (painelMensagensConsole && painelMensagensConsole.style.display === 'block') {
            painelMensagensConsole.textContent = textoConsolidado;
            painelMensagensConsole.scrollTop = painelMensagensConsole.scrollHeight;
        }
    }

    console.trace = function (...args) {
        consoleOriginal.trace(...args);
        registrarMensagemNoVisorConsole('TRACE', args);
    };
    console.debug = function (...args) {
        consoleOriginal.debug(...args);
        registrarMensagemNoVisorConsole('DEBUG', args);
    };
    console.log = function (...args) {
        consoleOriginal.log(...args);
        registrarMensagemNoVisorConsole('INFO', args);
    };
    console.info = function (...args) {
        consoleOriginal.info(...args);
        registrarMensagemNoVisorConsole('INFO', args);
    };
    console.warn = function (...args) {
        consoleOriginal.warn(...args);
        registrarMensagemNoVisorConsole('WARN', args);
    };
    console.error = function (...args) {
        consoleOriginal.error(...args);
        registrarMensagemNoVisorConsole('ERROR', args);
    };

    window.addEventListener('error', (ev) => {
        registrarMensagemNoVisorConsole('ERROR', [ev.message || 'Erro desconhecido', ev.filename ? `(${ev.filename}:${ev.lineno})` : '']);
    });
    window.addEventListener('unhandledrejection', (ev) => {
        registrarMensagemNoVisorConsole('FATAL', ['Promise rejeitada nao tratada:', ev.reason]);
    });

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
     * Utiliza .innerHTML para renderizar as entidades HTML (ç, etc).
     */
    function exibirToast(mensagemHTML) {
        /* Passo 2.1: Atualizar texto HTML e exibir toast por 3 segundos */
        if (!toastNotificacao) return;
        if (timerToast) clearTimeout(timerToast);

        toastNotificacao.innerHTML = mensagemHTML;
        toastNotificacao.classList.add('visivel');
        timerToast = setTimeout(() => {
            toastNotificacao.classList.remove('visivel');
        }, 3000);
    }

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

    function converterMsParaIndiceSliderAlerta(msBruto) {
        const valor = Number(msBruto);
        if (!Number.isFinite(valor)) return 6;
        if (valor === -1) return 6;
        const idxExato = ESCALA_TEMPO_ALERTA_MS.indexOf(valor);
        if (idxExato !== -1) return idxExato;
        let melhorIdx = 6;
        let menorDif = Infinity;
        for (let i = 0; i < ESCALA_TEMPO_ALERTA_MS.length; i++) {
            if (ESCALA_TEMPO_ALERTA_MS[i] === -1) continue;
            const dif = Math.abs(ESCALA_TEMPO_ALERTA_MS[i] - valor);
            if (dif < menorDif) {
                menorDif = dif;
                melhorIdx = i;
            }
        }
        return melhorIdx;
    }

    function obterTempoAlertaMsDoSlider() {
        if (!optTempoExibicaoAlerta) return -1;
        const idx = parseInt(optTempoExibicaoAlerta.value, 10);
        if (Number.isInteger(idx) && idx >= 0 && idx < ESCALA_TEMPO_ALERTA_MS.length) {
            return ESCALA_TEMPO_ALERTA_MS[idx];
        }
        return -1;
    }

    function atualizarRotuloSliderAlerta() {
        if (!lblValorTempoAlerta || !optTempoExibicaoAlerta) return;
        const idx = parseInt(optTempoExibicaoAlerta.value, 10);
        const idxSeguro = (Number.isInteger(idx) && idx >= 0 && idx < ROTULOS_TEMPO_ALERTA_HTML.length) ? idx : 6;
        lblValorTempoAlerta.innerHTML = ROTULOS_TEMPO_ALERTA_HTML[idxSeguro];
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
        lblValorTempoConferencia.innerHTML = ROTULOS_TEMPO_CONFERENCIA_DOCUMENTOS_HTML[idxSeguro];
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
        if (v === 'circular' || v === 'chip') return v;
        return 'sobrescrito';
    }

    function atualizarVisibilidadeSubOpcoesMarcadorColado() {
        const ativo = optMarcadorConteudoColadoAtivo ? optMarcadorConteudoColadoAtivo.checked : true;
        if (optPresetMarcadorColado) optPresetMarcadorColado.disabled = !ativo;
        if (optCorContornoMarcadorColado) optCorContornoMarcadorColado.disabled = !ativo;
        if (optCorFundoMarcadorColado) optCorFundoMarcadorColado.disabled = !ativo;
        if (optEstiloBadgeMarcadorColado) optEstiloBadgeMarcadorColado.disabled = !ativo;
        if (painelCustomizacaoMarcadorColado) {
            painelCustomizacaoMarcadorColado.style.opacity = ativo ? '1' : '0.45';
            painelCustomizacaoMarcadorColado.style.pointerEvents = ativo ? 'auto' : 'none';
        }
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
            lblValorTempoFlash.innerHTML = 'Até Interação (Padrão)';
        } else if (ms <= 0) {
            lblValorTempoFlash.innerHTML = '0 (Desabilitado)';
        } else if (ms < 1000) {
            lblValorTempoFlash.innerHTML = `${ms} ms`;
        } else {
            const segStr = (ms / 1000).toFixed(ms % 1000 === 0 ? 1 : (ms % 500 === 0 ? 1 : 2)).replace('.', ',');
            lblValorTempoFlash.innerHTML = `${segStr}s (${ms} ms)`;
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
        if (v === 'total' || v === 'interface' || v === 'nenhuma') return v;
        return 'total_exceto_arrasto';
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
            lblValorNivelFiltro.innerHTML = '2 - Intermediário (Parágrafos/Tabelas)';
        } else if (val === 3) {
            lblValorNivelFiltro.innerHTML = '3 - Avançado (Blocos e Listas)';
        } else if (val === 4) {
            lblValorNivelFiltro.innerHTML = '4 - Estendido (Estrutura e Seções)';
        } else {
            lblValorNivelFiltro.innerHTML = '1 - Básico (Inline / Mesclagem)';
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
        if (selectReutilizarAcaoConteudo) selectReutilizarAcaoConteudo.disabled = !ativoFoco;
        if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.disabled = !ativoFoco;
        if (optMonitorarUrlAtual) optMonitorarUrlAtual.disabled = !ativoFoco;
        if (optProtegerGuiasModificadas) optProtegerGuiasModificadas.disabled = !ativoFoco;
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
        /* FEAT-23 (Seção 6.112): Tempo de Exibição dos Avisos na Tela é independente da Conferência de Documentos */
        if (optTempoExibicaoAlerta) optTempoExibicaoAlerta.disabled = false;
        if (containerTempoExibicaoAlerta) {
            containerTempoExibicaoAlerta.style.opacity = '1';
            containerTempoExibicaoAlerta.style.pointerEvents = 'auto';
        }
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
        const ativo = optCriterioOrdenacaoGuias ? (optCriterioOrdenacaoGuias.value !== 'nenhum') : false;
        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = !ativo ? optSentidoOrdenacaoGuiasSwitch.checked : optSentidoOrdenacaoGuiasSwitch.checked;
        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.disabled = !ativo;
        if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.disabled = !ativo;
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
            if (textoUrlsTurbo) textoUrlsTurbo.value = PADROES_FABRICA_TURBO.join('\n');
            renderizarListaRegrasMapeamento(PADROES_FABRICA_REGRAS_MAPEAMENTO);
            atualizarRotuloSliderAlerta();
            atualizarRotuloSliderConferencia();
            atualizarRotuloSliderFlash();
            atualizarRotuloNivelFiltro();
            atualizarTodasVisibilidadesCascata();
            return;
        }

        chrome.storage.sync.get(null, (cfg) => {
            const dados = cfg || {};
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
            if (optColagemBotaoDireito) optColagemBotaoDireito.checked = false;
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
                optAbaEmPrimeiroPlano.checked = Boolean(
                    dados.abaEmPrimeiroPlano !== undefined
                        ? dados.abaEmPrimeiroPlano
                        : (dados.abaEmSegundoPlano === false)
                );
            }
            if (optReutilizarAbasAbertas) optReutilizarAbasAbertas.checked = (dados.reutilizarAbasAbertas !== false);
            if (optReutilizarFocoPrimeiroPlano) optReutilizarFocoPrimeiroPlano.checked = (dados.reutilizarAbasFocoPrimeiroPlano !== false);
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = Boolean(dados.monitorarUrlOriginalAbertura);
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = (dados.monitorarUrlAtualPagina !== false);
            if (optProtegerGuiasModificadas) optProtegerGuiasModificadas.checked = (dados.protegerGuiasModificadas !== false);
            const acaoCarregada = dados.reutilizarAbasAcaoConteudo || 'manter';
            if (selectReutilizarAcaoConteudo) selectReutilizarAcaoConteudo.value = acaoCarregada;
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
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = dados.criterioOrdenacaoGuias || 'nenhum';
            const sentidoEfetivo = dados.sentidoOrdenacaoGuias || 'esq_dir';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = sentidoEfetivo;
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (sentidoEfetivo === 'esq_dir');
            if (lblSentidoOrdenacaoGuias) {
                lblSentidoOrdenacaoGuias.textContent = (sentidoEfetivo === 'esq_dir')
                    ? 'Da Esquerda para a Direita (A-Z)'
                    : 'Da Direita para a Esquerda (Z-A)';
            }
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = Boolean(dados.ordenarGuiasFixadas);
            atualizarTextoBotaoAgrupamento();
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

            if (optTempoExibicaoAlerta) {
                const tempoSalvo = dados.tempoExibicaoAlertaMs !== undefined ? Number(dados.tempoExibicaoAlertaMs) : -1;
                optTempoExibicaoAlerta.value = String(converterMsParaIndiceSliderAlerta(tempoSalvo));
                atualizarRotuloSliderAlerta();
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
    function salvarConfiguracoes() {
        if (timerDebounceSalvarConfig) {
            clearTimeout(timerDebounceSalvarConfig);
            timerDebounceSalvarConfig = null;
        }
        /* Passo 4.1: Coletar valores da UI e persistir no chrome.storage.sync (Nuvem Google) */
        const novasUrlsTurbo = extrairLinhasLimpas(textoUrlsTurbo ? textoUrlsTurbo.value : '');
        const nivelIndice = optNivelFiltroEstilos ? Number(optNivelFiltroEstilos.value) : 1;
        const manterBasica = checkOpcaoRemoverFormatacoes ? !checkOpcaoRemoverFormatacoes.checked : false;
        const sepValor = optAcumuladorSeparador
            ? normalizarSeparadorAcumulador(optAcumuladorSeparador.value)
            : ';';
        if (optAcumuladorSeparador && optAcumuladorSeparador.value !== sepValor) {
            optAcumuladorSeparador.value = sepValor;
        }
        const tempoAlertaMs = obterTempoAlertaMsDoSlider();
        const tempoConferenciaMs = obterTempoConferenciaMsDoSlider();
        const validacaoAtivaEfetiva = tempoConferenciaMs !== 0;
        if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = validacaoAtivaEfetiva;
        const tempoFlashMs = optTempoFlashMs ? normalizarTempoFlashMs(optTempoFlashMs.value) : 0;
        const corFlash = optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : COR_PADRAO_FLASH_BORDER;
        const marcadorColadoAtivo = optMarcadorConteudoColadoAtivo ? optMarcadorConteudoColadoAtivo.checked : true;
        const presetMarcador = optPresetMarcadorColado ? normalizarPresetMarcadorColado(optPresetMarcadorColado.value) : 'verde_forense';
        const corContornoMarcador = optCorContornoMarcadorColado ? normalizarCorHex(optCorContornoMarcadorColado.value) : COR_PADRAO_FLASH_BORDER;
        const corFundoMarcador = optCorFundoMarcadorColado ? normalizarCorHexFundoMarcador(optCorFundoMarcadorColado.value) : COR_PADRAO_FUNDO_MARCADOR;
        const estiloBadgeMarcador = optEstiloBadgeMarcadorColado ? normalizarEstiloBadgeMarcadorColado(optEstiloBadgeMarcadorColado.value) : 'sobrescrito';

        atualizarRotuloSliderAlerta();
        atualizarRotuloSliderConferencia();
        atualizarRotuloSliderFlash();

        const payload = {
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
            reutilizarAbasAcaoConteudo: selectReutilizarAcaoConteudo
                ? selectReutilizarAcaoConteudo.value
                : ((optReutilizarAcaoRecarregar && optReutilizarAcaoRecarregar.checked)
                    ? 'recarregar'
                    : ((optReutilizarAcaoRecarregarSeModificada && optReutilizarAcaoRecarregarSeModificada.checked)
                        ? 'recarregar_se_modificada'
                        : ((optReutilizarAcaoRecarregarSeNaoModificada && optReutilizarAcaoRecarregarSeNaoModificada.checked)
                            ? 'recarregar_se_nao_modificada'
                            : 'manter'))),
            monitorarUrlOriginalAbertura: optMonitorarUrlOriginal ? optMonitorarUrlOriginal.checked : false,
            monitorarUrlAtualPagina: optMonitorarUrlAtual ? optMonitorarUrlAtual.checked : true,
            criterioOrdenacaoGuias: optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'nenhum',
            sentidoOrdenacaoGuias: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
            ordenarGuiasFixadas: optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: optTempoInatividadeDescarteMinutos ? Number(optTempoInatividadeDescarteMinutos.value) : 20,
            validacaoMatematicaAtiva: validacaoAtivaEfetiva,
            tempoConferenciaDocumentosMs: tempoConferenciaMs,
            modoExibicaoValidacao: optModoExibicaoValidacao ? optModoExibicaoValidacao.value : 'sempre',
            posicaoAvisosValidacao: optPosicaoAvisosValidacao ? optPosicaoAvisosValidacao.value : 'abaixo',
            converterCabecalhoPjeAtivo: optConverterCabecalhoPje ? optConverterCabecalhoPje.checked : true,
            atalhoF1GeminiAtivo: optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true,
            promptF1Gemini: (optPromptF1Gemini && optPromptF1Gemini.value.trim().length > 0) ? optPromptF1Gemini.value.trim() : PROMPT_F1_GEMINI_PADRAO,
            tempoExibicaoAlertaMs: tempoAlertaMs,
            tempoFlashBorderMs: tempoFlashMs,
            corFlashBorder: corFlash,
            marcadorConteudoColadoAtivo: marcadorColadoAtivo,
            presetMarcadorColado: presetMarcador,
            corContornoMarcadorColado: corContornoMarcador,
            corFundoMarcadorColado: corFundoMarcador,
            estiloBadgeMarcadorColado: estiloBadgeMarcador,
            modoRetirarSelecao: optModoRetirarSelecao ? normalizarModoRetirarSelecao(optModoRetirarSelecao.value) : 'total_exceto_arrasto',
            minimoCaracteresInterface: optMinimoCaracteresInterface ? (parseInt(optMinimoCaracteresInterface.value, 10) || 0) : 5,
            separadorAcumulador: sepValor,
            urlsTurbo: novasUrlsTurbo.length > 0 ? novasUrlsTurbo : [...PADROES_FABRICA_TURBO],
            regrasMapeamentoElementos: Array.isArray(regrasMapeamentoAtuais) ? regrasMapeamentoAtuais : [...PADROES_FABRICA_REGRAS_MAPEAMENTO]
        };
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
    adicionarOuvinteSeguro(optColagemBotaoDireito, 'change', alternarColagemBotaoDireito);
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
    adicionarOuvinteSeguro(selectReutilizarAcaoConteudo, 'change', () => {
        if (selectReutilizarAcaoConteudo) {
            const val = selectReutilizarAcaoConteudo.value;
            if (optReutilizarAcaoRecarregar && val === 'recarregar') optReutilizarAcaoRecarregar.checked = true;
            else if (optReutilizarAcaoRecarregarSeModificada && val === 'recarregar_se_modificada') optReutilizarAcaoRecarregarSeModificada.checked = true;
            else if (optReutilizarAcaoRecarregarSeNaoModificada && val === 'recarregar_se_nao_modificada') optReutilizarAcaoRecarregarSeNaoModificada.checked = true;
            else if (optReutilizarAcaoManter) optReutilizarAcaoManter.checked = true;
        }
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optReutilizarAcaoManter, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregar, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregarSeModificada, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optReutilizarAcaoRecarregarSeNaoModificada, 'change', salvarConfiguracoes);

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

    /* Controle do Switch de Sentido de Ordenação */
    function atualizarSentidoOrdenacao(isEsqDir, reordenarSeAtivo = true) {
        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = isEsqDir;
        if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = isEsqDir ? 'esq_dir' : 'dir_esq';
        if (lblSentidoOrdenacaoGuias) {
            lblSentidoOrdenacaoGuias.textContent = isEsqDir
                ? 'Da Esquerda para a Direita (A-Z)'
                : 'Da Direita para a Esquerda (Z-A)';
        }
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
            btnOrdenarGuiasAgora.click();
        }
    });

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

    adicionarOuvinteSeguro(btnOrdenarGuiasAgora, 'click', () => {
        try {
            salvarConfiguracoes();
            const crit = (optCriterioOrdenacaoGuias && optCriterioOrdenacaoGuias.value !== 'nenhum')
                ? optCriterioOrdenacaoGuias.value
                : 'dominio';
            const sent = optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir';
            const fix = optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false;

            chrome.runtime.sendMessage({
                acao: 'ordenarGuiasAgora',
                criterio: crit,
                sentido: sent,
                ordenarFixadas: fix
            }, (res) => {
                if (feedbackAcoesGuias) {
                    feedbackAcoesGuias.textContent = 'Guias ordenadas com sucesso!';
                    feedbackAcoesGuias.style.display = 'inline';
                    setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                }
            });
        } catch (_) { }
    });

    /* Funcao auxiliar para sincronizar dinamicamente o texto do botao de agrupamento (Switch Agrupar <-> Desagrupar) */
    async function atualizarTextoBotaoAgrupamento() {
        if (!btnAgruparDominioAgora || !chrome.tabs || typeof chrome.tabs.query !== 'function') return;
        try {
            const abas = await chrome.tabs.query({ currentWindow: true });
            const temGrupos = abas && abas.some(t => t.groupId !== undefined && t.groupId > 0);
            if (temGrupos) {
                btnAgruparDominioAgora.textContent = 'Desagrupar Todas as Guias';
            } else {
                btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
            }
        } catch (_) { }
    }

    /* Botao Switch Unico: Agrupar por Dominio Agora <-> Desagrupar Todas as Guias */
    adicionarOuvinteSeguro(btnAgruparDominioAgora, 'click', async () => {
        try {
            let temGrupos = false;
            if (chrome.tabs && typeof chrome.tabs.query === 'function') {
                const abas = await chrome.tabs.query({ currentWindow: true });
                temGrupos = abas && abas.some(t => t.groupId !== undefined && t.groupId > 0);
            }
            if (temGrupos) {
                chrome.runtime.sendMessage({ acao: 'desagruparGuiasAgora' }, (res) => {
                    const total = res ? res.totalDesagrupadas || 0 : 0;
                    btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
                    atualizarTextoBotaoAgrupamento();
                    if (feedbackAcoesGuias) {
                        feedbackAcoesGuias.textContent = (total > 0)
                            ? `${total} ${total === 1 ? 'guia desagrupada' : 'guias desagrupadas'} com sucesso!`
                            : 'Guias desagrupadas com sucesso!';
                        feedbackAcoesGuias.style.display = 'inline';
                        setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                    }
                });
            } else {
                chrome.runtime.sendMessage({ acao: 'agruparDominioAgora' }, () => {
                    btnAgruparDominioAgora.textContent = 'Desagrupar Todas as Guias';
                    atualizarTextoBotaoAgrupamento();
                    if (feedbackAcoesGuias) {
                        feedbackAcoesGuias.textContent = 'Abas agrupadas por domínio (Chrome Tab Groups)!';
                        feedbackAcoesGuias.style.display = 'inline';
                        setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                    }
                });
            }
        } catch (_) { }
    });

    adicionarOuvinteSeguro(btnDesagruparGuiasAgora, 'click', () => {
        try {
            chrome.runtime.sendMessage({ acao: 'desagruparGuiasAgora' }, (res) => {
                const total = res ? res.totalDesagrupadas || 0 : 0;
                if (btnAgruparDominioAgora) btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
                if (feedbackAcoesGuias) {
                    feedbackAcoesGuias.textContent = (total > 0)
                        ? `${total} ${total === 1 ? 'guia desagrupada' : 'guias desagrupadas'} com sucesso!`
                        : 'Nenhuma guia agrupada na janela ativa.';
                    feedbackAcoesGuias.style.display = 'inline';
                    setTimeout(() => { if (feedbackAcoesGuias) feedbackAcoesGuias.style.display = 'none'; }, 3000);
                }
            });
        } catch (_) { }
    });

    adicionarOuvinteSeguro(btnRestaurarOrdemGuiasPadrao, 'click', () => {
        try {
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = 'nenhum';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = 'esq_dir';
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = true;
            if (lblSentidoOrdenacaoGuias) lblSentidoOrdenacaoGuias.textContent = 'Da Esquerda para a Direita (A-Z)';
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = false;
            if (btnAgruparDominioAgora) btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
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
    adicionarOuvinteSeguro(optTempoExibicaoAlerta, 'input', () => {
        atualizarRotuloSliderAlerta();
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optTempoExibicaoAlerta, 'change', salvarConfiguracoes);
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
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorFlashBorder, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optMarcadorConteudoColadoAtivo, 'change', () => {
        atualizarVisibilidadeSubOpcoesMarcadorColado();
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optPresetMarcadorColado, 'change', () => {
        const presetChave = optPresetMarcadorColado ? normalizarPresetMarcadorColado(optPresetMarcadorColado.value) : 'verde_forense';
        const presetCores = PRESETS_MARCADOR_CONTEUDO_COLADO[presetChave] || PRESETS_MARCADOR_CONTEUDO_COLADO.verde_forense;
        if (optCorContornoMarcadorColado) optCorContornoMarcadorColado.value = presetCores.corContorno;
        if (optCorFundoMarcadorColado) optCorFundoMarcadorColado.value = presetCores.corFundo;
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(optCorContornoMarcadorColado, 'input', () => {
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorContornoMarcadorColado, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optCorFundoMarcadorColado, 'input', () => {
        salvarConfiguracoesDebounced(250);
    });
    adicionarOuvinteSeguro(optCorFundoMarcadorColado, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optEstiloBadgeMarcadorColado, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optModoRetirarSelecao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optMinimoCaracteresInterface, 'change', salvarConfiguracoes);

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
    adicionarOuvinteSeguro(btnRestaurarPadroes, 'click', () => {
        /* O prompt 'confirm' do SO nao renderiza HTML Entities, entao a string deve ser ASCII puro e legivel */
        if (window.confirm('Deseja restaurar todas as configuracoes para os padroes originais de fabrica e apagar contadores e dados extras?')) {
            if (selectModoTurbo) selectModoTurbo.value = 'global';
            if (selectComportamentoIcone) selectComportamentoIcone.value = 'popup';
            if (checkOpcaoRemoverFormatacoes) checkOpcaoRemoverFormatacoes.checked = true;
            if (optNivelFiltroEstilos) optNivelFiltroEstilos.value = '1';
            atualizarRotuloNivelFiltro();
            atualizarEstadoOfuscamentoNivelFiltro();
            if (checkOpcaoAmpuletas) checkOpcaoAmpuletas.checked = true;
            if (optConverterCabecalhoPje) optConverterCabecalhoPje.checked = true;
            if (selectModoPlaceholdersMinutasHtml) selectModoPlaceholdersMinutasHtml.value = 'placeholders';
            if (optColagemBotaoDireito) optColagemBotaoDireito.checked = false;
            if (optAlternarAbasRecentesCtrlTab) optAlternarAbasRecentesCtrlTab.checked = true;
            if (optCapturaBotoesMouse4e5) optCapturaBotoesMouse4e5.checked = true;
            if (optColarBotaoMeio) optColarBotaoMeio.checked = true;
            obterEstadoPermissaoClipboard().then((perm) => {
                atualizarVisualAtencaoSwitches(perm);
            });
            if (optNavegacaoTecladoCampos) optNavegacaoTecladoCampos.checked = true;
            if (optCaixaEntradaRapida) optCaixaEntradaRapida.checked = true;
            if (optBloquearNovasJanelas) optBloquearNovasJanelas.checked = true;
            if (optPreservarJanelasAutenticacao) optPreservarJanelasAutenticacao.checked = true;
            if (optAbaEmPrimeiroPlano) optAbaEmPrimeiroPlano.checked = false;
            if (optReutilizarAbasAbertas) optReutilizarAbasAbertas.checked = true;
            if (optReutilizarFocoPrimeiroPlano) optReutilizarFocoPrimeiroPlano.checked = true;
            if (optProtegerGuiasModificadas) optProtegerGuiasModificadas.checked = true;
            if (selectReutilizarAcaoConteudo) selectReutilizarAcaoConteudo.value = 'manter';
            if (optReutilizarAcaoManter) optReutilizarAcaoManter.checked = true;
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = false;
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = true;
            atualizarVisibilidadeSubOpcoesReutilizar();
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = 'nenhum';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = 'esq_dir';
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = true;
            if (lblSentidoOrdenacaoGuias) lblSentidoOrdenacaoGuias.textContent = 'Da Esquerda para a Direita (A-Z)';
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = false;
            if (btnAgruparDominioAgora) btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
            if (optDescarteGuiasInativas) optDescarteGuiasInativas.checked = false;
            if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = true;
            if (optTempoConferenciaDocumentos) {
                optTempoConferenciaDocumentos.value = '6';
                atualizarRotuloSliderConferencia();
            }
            if (optModoExibicaoValidacao) optModoExibicaoValidacao.value = 'sempre';
            if (optPosicaoAvisosValidacao) optPosicaoAvisosValidacao.value = 'abaixo';
            atualizarVisibilidadeSubOpcoesValidacao();
            if (optTempoExibicaoAlerta) {
                optTempoExibicaoAlerta.value = '6';
                atualizarRotuloSliderAlerta();
            }
            if (optTempoFlashMs) {
                optTempoFlashMs.value = '5250';
                atualizarRotuloSliderFlash();
            }
            if (optMinimoCaracteresInterface) optMinimoCaracteresInterface.value = '5';
            if (optCorFlashBorder) optCorFlashBorder.value = COR_PADRAO_FLASH_BORDER;
            if (optMarcadorConteudoColadoAtivo) optMarcadorConteudoColadoAtivo.checked = true;
            if (optPresetMarcadorColado) optPresetMarcadorColado.value = 'verde_forense';
            if (optCorContornoMarcadorColado) optCorContornoMarcadorColado.value = COR_PADRAO_FLASH_BORDER;
            if (optCorFundoMarcadorColado) optCorFundoMarcadorColado.value = COR_PADRAO_FUNDO_MARCADOR;
            if (optEstiloBadgeMarcadorColado) optEstiloBadgeMarcadorColado.value = 'sobrescrito';
            if (optModoRetirarSelecao) optModoRetirarSelecao.value = 'total_exceto_arrasto';
            if (optAcumuladorSeparador) optAcumuladorSeparador.value = ';';
            if (optAtalhoF1GeminiAtivo) optAtalhoF1GeminiAtivo.checked = true;
            if (optPromptF1Gemini) optPromptF1Gemini.value = PROMPT_F1_GEMINI_PADRAO;
            if (textoUrlsTurbo) textoUrlsTurbo.value = PADROES_FABRICA_TURBO.join('\n');
            if (lblTotalCopias) lblTotalCopias.textContent = '0';
            if (lblTotalAlertas) lblTotalAlertas.textContent = '0';
            atualizarTodasVisibilidadesCascata();

            const padroesFabricaCompletos = {
                modoTurbo: 'global',
                comportamentoCliqueIcone: 'popup',
                manterFormatacaoBasica: false,
                nivelFiltroFormatacao: 'texto_puro',
                ativoAmpuletas: true,
                converterCabecalhoPjeAtivo: true,
                selecaoEditavelAtiva: true,
                modoPlaceholdersMinutasHtml: 'placeholders',
                placeholdersMinutasHtmlAtivo: true,
                colagemBotaoDireitoAtiva: false,
                capturaBotoesMouse4e5Ativa: true,
                colarBotaoMeioAtivo: true,
                navegacaoTecladoCamposAtiva: true,
                bloquearNovasJanelas: true,
                preservarJanelasAutenticacao: true,
                abaEmPrimeiroPlano: false,
                abaEmSegundoPlano: true,
                reutilizarAbasAbertas: true,
                reutilizarAbasFocoPrimeiroPlano: true,
                protegerGuiasModificadas: true,
                reutilizarAbasAcaoConteudo: 'manter',
                monitorarUrlOriginalAbertura: false,
                monitorarUrlAtualPagina: true,
                criterioOrdenacaoGuias: 'nenhum',
                sentidoOrdenacaoGuias: 'esq_dir',
                ordenarGuiasFixadas: false,
                descarteGuiasInativasAtivo: false,
                validacaoMatematicaAtiva: true,
                tempoConferenciaDocumentosMs: -1,
                tempoExibicaoAlertaMs: -1,
                tempoFlashBorderMs: -1,
                corFlashBorder: COR_PADRAO_FLASH_BORDER,
                marcadorConteudoColadoAtivo: true,
                presetMarcadorColado: 'verde_forense',
                corContornoMarcadorColado: COR_PADRAO_FLASH_BORDER,
                corFundoMarcadorColado: COR_PADRAO_FUNDO_MARCADOR,
                estiloBadgeMarcadorColado: 'sobrescrito',
                modoRetirarSelecao: 'total_exceto_arrasto',
                minimoCaracteresInterface: 5,
                separadorAcumulador: ';',
                atalhoF1GeminiAtivo: true,
                promptF1Gemini: PROMPT_F1_GEMINI_PADRAO,
                urlsTurbo: [...PADROES_FABRICA_TURBO],
                urlsAmpuletas: [...PADROES_FABRICA_AMPULETAS],
                regrasMapeamentoElementos: []
            };
            regrasMapeamentoAtuais = [];
            renderizarListaRegrasMapeamento(regrasMapeamentoAtuais);
            atualizarIconeModoOptions('global');

            /* Limpar storage local e de sessao para zerar contadores operacionais e dados residuais */
            if (typeof chrome !== 'undefined' && chrome.storage) {
                if (chrome.storage.local) {
                    const agora = new Date();
                    const pad = (n) => String(n).padStart(2, '0');
                    const strData = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                    chrome.storage.local.clear(() => {
                        chrome.storage.local.set({ totalCopias: 0, totalAlertas: 0, dataInicioContadores: strData });
                        if (lblDataInicioContadores) lblDataInicioContadores.textContent = strData;
                    });
                }
                if (chrome.storage.session) {
                    chrome.storage.session.clear().catch(() => { });
                }
                /* Limpar storage sync para remover todas as chaves extras/orfas e gravar os padroes puros */
                if (chrome.storage.sync) {
                    chrome.storage.sync.clear(() => {
                        chrome.storage.sync.set(padroesFabricaCompletos, () => {
                            if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                                chrome.runtime.sendMessage({ acao: 'forcarSincronizacaoNuvem' }).catch(() => { });
                            }
                            exibirToast('Padrões de fábrica restaurados e dados extras apagados com sucesso!');
                        });
                    });
                    return;
                }
            }
            exibirToast('Padrões originais de fábrica restaurados!');
        }
    });

    /* Passo 4.4: Exportar todas as configuracoes em arquivo JSON global */
    adicionarOuvinteSeguro(btnExportarJson, 'click', () => {
        const tempoFlashMsExport = optTempoFlashMs ? normalizarTempoFlashMs(optTempoFlashMs.value) : 0;
        const dadosExportacao = {
            projeto: 'JusGovBR',
            modoTurbo: selectModoTurbo ? selectModoTurbo.value : 'global',
            comportamentoCliqueIcone: selectComportamentoIcone ? selectComportamentoIcone.value : 'popup',
            manterFormatacaoBasica: checkOpcaoRemoverFormatacoes ? !checkOpcaoRemoverFormatacoes.checked : false,
            nivelFiltroFormatacao: optNivelFiltroEstilos ? converterIndiceParaNivelFiltro(optNivelFiltroEstilos.value) : 'basico',
            ativoAmpuletas: checkOpcaoAmpuletas ? checkOpcaoAmpuletas.checked : true,
            converterCabecalhoPjeAtivo: optConverterCabecalhoPje ? optConverterCabecalhoPje.checked : true,
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
            reutilizarAbasAcaoConteudo: selectReutilizarAcaoConteudo
                ? selectReutilizarAcaoConteudo.value
                : ((optReutilizarAcaoRecarregar && optReutilizarAcaoRecarregar.checked)
                    ? 'recarregar'
                    : ((optReutilizarAcaoRecarregarSeModificada && optReutilizarAcaoRecarregarSeModificada.checked)
                        ? 'recarregar_se_modificada'
                        : ((optReutilizarAcaoRecarregarSeNaoModificada && optReutilizarAcaoRecarregarSeNaoModificada.checked)
                            ? 'recarregar_se_nao_modificada'
                            : 'manter'))),
            monitorarUrlOriginalAbertura: optMonitorarUrlOriginal ? optMonitorarUrlOriginal.checked : false,
            monitorarUrlAtualPagina: optMonitorarUrlAtual ? optMonitorarUrlAtual.checked : true,
            criterioOrdenacaoGuias: optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'nenhum',
            sentidoOrdenacaoGuias: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
            ordenarGuiasFixadas: optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: optTempoInatividadeDescarteMinutos ? Number(optTempoInatividadeDescarteMinutos.value) : 20,
            validacaoMatematicaAtiva: obterTempoConferenciaMsDoSlider() !== 0,
            tempoConferenciaDocumentosMs: obterTempoConferenciaMsDoSlider(),
            modoExibicaoValidacao: optModoExibicaoValidacao ? optModoExibicaoValidacao.value : 'sempre',
            posicaoAvisosValidacao: optPosicaoAvisosValidacao ? optPosicaoAvisosValidacao.value : 'abaixo',
            tempoExibicaoAlertaMs: obterTempoAlertaMsDoSlider(),
            tempoFlashBorderMs: tempoFlashMsExport,
            corFlashBorder: optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : COR_PADRAO_FLASH_BORDER,
            marcadorConteudoColadoAtivo: optMarcadorConteudoColadoAtivo ? optMarcadorConteudoColadoAtivo.checked : true,
            presetMarcadorColado: optPresetMarcadorColado ? normalizarPresetMarcadorColado(optPresetMarcadorColado.value) : 'verde_forense',
            corContornoMarcadorColado: optCorContornoMarcadorColado ? normalizarCorHex(optCorContornoMarcadorColado.value) : COR_PADRAO_FLASH_BORDER,
            corFundoMarcadorColado: optCorFundoMarcadorColado ? normalizarCorHexFundoMarcador(optCorFundoMarcadorColado.value) : COR_PADRAO_FUNDO_MARCADOR,
            estiloBadgeMarcadorColado: optEstiloBadgeMarcadorColado ? normalizarEstiloBadgeMarcadorColado(optEstiloBadgeMarcadorColado.value) : 'sobrescrito',
            modoRetirarSelecao: optModoRetirarSelecao ? normalizarModoRetirarSelecao(optModoRetirarSelecao.value) : 'total_exceto_arrasto',
            minimoCaracteresInterface: optMinimoCaracteresInterface ? (parseInt(optMinimoCaracteresInterface.value, 10) || 0) : 5,
            separadorAcumulador: optAcumuladorSeparador ? normalizarSeparadorAcumulador(optAcumuladorSeparador.value) : ';',
            atalhoF1GeminiAtivo: optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true,
            promptF1Gemini: optPromptF1Gemini ? optPromptF1Gemini.value : PROMPT_F1_GEMINI_PADRAO,
            urlsTurbo: extrairLinhasLimpas(textoUrlsTurbo ? textoUrlsTurbo.value : ''),
            regrasMapeamentoElementos: Array.isArray(regrasMapeamentoAtuais) ? regrasMapeamentoAtuais : [...PADROES_FABRICA_REGRAS_MAPEAMENTO]
        };

        const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jusgovbr-configuracoes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        exibirToast('Arquivo JSON com todas as configurações exportado!');
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
            leitor.onload = (ev) => {
                try {
                    const json = JSON.parse(String(ev.target.result || '{}'));
                    if (json.modoTurbo && selectModoTurbo) selectModoTurbo.value = json.modoTurbo;
                    if (json.comportamentoCliqueIcone && selectComportamentoIcone) selectComportamentoIcone.value = json.comportamentoCliqueIcone;
                    if (typeof json.manterFormatacaoBasica === 'boolean' && checkOpcaoRemoverFormatacoes) {
                        checkOpcaoRemoverFormatacoes.checked = !json.manterFormatacaoBasica;
                    }
                    if (json.nivelFiltroFormatacao && optNivelFiltroEstilos) {
                        optNivelFiltroEstilos.value = String(converterNivelFiltroParaIndice(json.nivelFiltroFormatacao));
                        atualizarRotuloNivelFiltro();
                    }
                    atualizarEstadoOfuscamentoNivelFiltro();
                    if (typeof json.ativoAmpuletas === 'boolean' && checkOpcaoAmpuletas) {
                        checkOpcaoAmpuletas.checked = json.ativoAmpuletas;
                    }
                    if (typeof json.converterCabecalhoPjeAtivo === 'boolean' && optConverterCabecalhoPje) {
                        optConverterCabecalhoPje.checked = json.converterCabecalhoPjeAtivo;
                    }
                    if (selectModoPlaceholdersMinutasHtml) {
                        if (typeof json.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(json.modoPlaceholdersMinutasHtml)) {
                            selectModoPlaceholdersMinutasHtml.value = json.modoPlaceholdersMinutasHtml;
                        } else if (typeof json.placeholdersMinutasHtmlAtivo === 'boolean') {
                            selectModoPlaceholdersMinutasHtml.value = json.placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                        } else if (typeof json.selecaoEditavelAtiva === 'boolean') {
                            selectModoPlaceholdersMinutasHtml.value = json.selecaoEditavelAtiva ? 'placeholders' : 'desabilitado';
                        }
                    }
                    if (typeof json.colagemBotaoDireitoAtiva === 'boolean' && optColagemBotaoDireito) {
                        optColagemBotaoDireito.checked = json.colagemBotaoDireitoAtiva;
                    }
                    if (typeof json.alternarAbasRecentesCtrlTabAtiva === 'boolean' && optAlternarAbasRecentesCtrlTab) {
                        optAlternarAbasRecentesCtrlTab.checked = json.alternarAbasRecentesCtrlTabAtiva;
                    }
                    if (typeof json.capturaBotoesMouse4e5Ativa === 'boolean' && optCapturaBotoesMouse4e5) {
                        optCapturaBotoesMouse4e5.checked = json.capturaBotoesMouse4e5Ativa;
                    }
                    if (typeof json.colarBotaoMeioAtivo === 'boolean' && optColarBotaoMeio) {
                        optColarBotaoMeio.checked = json.colarBotaoMeioAtivo;
                    }
                    if (typeof json.navegacaoTecladoCamposAtiva === 'boolean' && optNavegacaoTecladoCampos) {
                        optNavegacaoTecladoCampos.checked = json.navegacaoTecladoCamposAtiva;
                    }
                    if (typeof json.caixaEntradaRapidaAtiva === 'boolean' && optCaixaEntradaRapida) {
                        optCaixaEntradaRapida.checked = json.caixaEntradaRapidaAtiva;
                    }
                    if (typeof json.bloquearNovasJanelas === 'boolean' && optBloquearNovasJanelas) {
                        optBloquearNovasJanelas.checked = json.bloquearNovasJanelas;
                    }
                    if (typeof json.preservarJanelasAutenticacao === 'boolean' && optPreservarJanelasAutenticacao) {
                        optPreservarJanelasAutenticacao.checked = json.preservarJanelasAutenticacao;
                    }
                    if (optAbaEmPrimeiroPlano) {
                        if (typeof json.abaEmPrimeiroPlano === 'boolean') {
                            optAbaEmPrimeiroPlano.checked = json.abaEmPrimeiroPlano;
                        } else if (typeof json.abaEmSegundoPlano === 'boolean') {
                            optAbaEmPrimeiroPlano.checked = !json.abaEmSegundoPlano;
                        }
                    }
                    if (typeof json.reutilizarAbasAbertas === 'boolean' && optReutilizarAbasAbertas) {
                        optReutilizarAbasAbertas.checked = json.reutilizarAbasAbertas;
                    }
                    if (typeof json.reutilizarAbasFocoPrimeiroPlano === 'boolean' && optReutilizarFocoPrimeiroPlano) {
                        optReutilizarFocoPrimeiroPlano.checked = json.reutilizarAbasFocoPrimeiroPlano;
                    }
                    if (typeof json.protegerGuiasModificadas === 'boolean' && optProtegerGuiasModificadas) {
                        optProtegerGuiasModificadas.checked = json.protegerGuiasModificadas;
                    }
                    if (typeof json.reutilizarAbasAcaoConteudo === 'string') {
                        if (selectReutilizarAcaoConteudo) selectReutilizarAcaoConteudo.value = json.reutilizarAbasAcaoConteudo;
                        if (optReutilizarAcaoRecarregar && json.reutilizarAbasAcaoConteudo === 'recarregar') {
                            optReutilizarAcaoRecarregar.checked = true;
                        } else if (optReutilizarAcaoRecarregarSeModificada && json.reutilizarAbasAcaoConteudo === 'recarregar_se_modificada') {
                            optReutilizarAcaoRecarregarSeModificada.checked = true;
                        } else if (optReutilizarAcaoRecarregarSeNaoModificada && json.reutilizarAbasAcaoConteudo === 'recarregar_se_nao_modificada') {
                            optReutilizarAcaoRecarregarSeNaoModificada.checked = true;
                        } else if (optReutilizarAcaoManter) {
                            optReutilizarAcaoManter.checked = true;
                        }
                    }
                    atualizarVisibilidadeSubOpcoesReutilizar();
                    if (typeof json.monitorarUrlOriginalAbertura === 'boolean' && optMonitorarUrlOriginal) {
                        optMonitorarUrlOriginal.checked = json.monitorarUrlOriginalAbertura;
                    }
                    if (typeof json.monitorarUrlAtualPagina === 'boolean' && optMonitorarUrlAtual) {
                        optMonitorarUrlAtual.checked = json.monitorarUrlAtualPagina;
                    }
                    if (typeof json.criterioOrdenacaoGuias === 'string' && optCriterioOrdenacaoGuias) {
                        optCriterioOrdenacaoGuias.value = json.criterioOrdenacaoGuias;
                    }
                    if (typeof json.sentidoOrdenacaoGuias === 'string' && optSentidoOrdenacaoGuias) {
                        optSentidoOrdenacaoGuias.value = json.sentidoOrdenacaoGuias;
                        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (json.sentidoOrdenacaoGuias === 'esq_dir');
                        if (lblSentidoOrdenacaoGuias) {
                            lblSentidoOrdenacaoGuias.textContent = (json.sentidoOrdenacaoGuias === 'esq_dir')
                                ? 'Da Esquerda para a Direita (A-Z)'
                                : 'Da Direita para a Esquerda (Z-A)';
                        }
                    }
                    if (typeof json.ordenarGuiasFixadas === 'boolean' && optOrdenarGuiasFixadas) {
                        optOrdenarGuiasFixadas.checked = json.ordenarGuiasFixadas;
                    }
                    if (typeof json.descarteGuiasInativasAtivo === 'boolean' && optDescarteGuiasInativas) {
                        optDescarteGuiasInativas.checked = json.descarteGuiasInativasAtivo;
                    }
                    if (json.tempoConferenciaDocumentosMs !== undefined && optTempoConferenciaDocumentos) {
                        optTempoConferenciaDocumentos.value = String(converterMsParaIndiceSliderConferencia(json.tempoConferenciaDocumentosMs));
                        atualizarRotuloSliderConferencia();
                    } else if (typeof json.validacaoMatematicaAtiva === 'boolean' && optTempoConferenciaDocumentos) {
                        optTempoConferenciaDocumentos.value = json.validacaoMatematicaAtiva ? '6' : '0';
                        atualizarRotuloSliderConferencia();
                    }
                    if (typeof json.validacaoMatematicaAtiva === 'boolean' && optValidacaoMatematicaAtiva) {
                        optValidacaoMatematicaAtiva.checked = json.validacaoMatematicaAtiva;
                    } else if (optValidacaoMatematicaAtiva) {
                        optValidacaoMatematicaAtiva.checked = (obterTempoConferenciaMsDoSlider() !== 0);
                    }
                    if (json.tempoExibicaoAlertaMs !== undefined && optTempoExibicaoAlerta) {
                        optTempoExibicaoAlerta.value = String(converterMsParaIndiceSliderAlerta(json.tempoExibicaoAlertaMs));
                        atualizarRotuloSliderAlerta();
                    }
                    if (optTempoFlashMs) {
                        if (json.tempoFlashBorderMs !== undefined) {
                            const normFlashImp = normalizarTempoFlashMs(json.tempoFlashBorderMs);
                            optTempoFlashMs.value = normFlashImp === -1 ? '5250' : String(normFlashImp);
                        } else if (typeof json.flashBorderAtivo === 'boolean') {
                            optTempoFlashMs.value = json.flashBorderAtivo ? '500' : '0';
                        }
                        atualizarRotuloSliderFlash();
                    }
                    if (typeof json.corFlashBorder === 'string' && optCorFlashBorder) {
                        optCorFlashBorder.value = normalizarCorHex(json.corFlashBorder);
                    }
                    if (typeof json.marcadorConteudoColadoAtivo === 'boolean' && optMarcadorConteudoColadoAtivo) {
                        optMarcadorConteudoColadoAtivo.checked = json.marcadorConteudoColadoAtivo;
                    }
                    if (typeof json.presetMarcadorColado === 'string' && optPresetMarcadorColado) {
                        optPresetMarcadorColado.value = normalizarPresetMarcadorColado(json.presetMarcadorColado);
                    }
                    if (typeof json.corContornoMarcadorColado === 'string' && optCorContornoMarcadorColado) {
                        optCorContornoMarcadorColado.value = normalizarCorHex(json.corContornoMarcadorColado);
                    }
                    if (typeof json.corFundoMarcadorColado === 'string' && optCorFundoMarcadorColado) {
                        optCorFundoMarcadorColado.value = normalizarCorHexFundoMarcador(json.corFundoMarcadorColado);
                    }
                    if (typeof json.estiloBadgeMarcadorColado === 'string' && optEstiloBadgeMarcadorColado) {
                        optEstiloBadgeMarcadorColado.value = normalizarEstiloBadgeMarcadorColado(json.estiloBadgeMarcadorColado);
                    }
                    if (json.modoRetirarSelecao !== undefined && optModoRetirarSelecao) {
                        optModoRetirarSelecao.value = normalizarModoRetirarSelecao(json.modoRetirarSelecao);
                    }
                    if (json.minimoCaracteresInterface !== undefined && optMinimoCaracteresInterface) {
                        const minImp = parseInt(json.minimoCaracteresInterface, 10);
                        optMinimoCaracteresInterface.value = [0, 1, 2, 3, 4, 5, 10].includes(minImp) ? String(minImp) : '5';
                    }
                    if (typeof json.separadorAcumulador === 'string' && optAcumuladorSeparador) {
                        optAcumuladorSeparador.value = normalizarSeparadorAcumulador(json.separadorAcumulador);
                    }
                    if (typeof json.atalhoF1GeminiAtivo === 'boolean' && optAtalhoF1GeminiAtivo) {
                        optAtalhoF1GeminiAtivo.checked = json.atalhoF1GeminiAtivo;
                    }
                    if (typeof json.promptF1Gemini === 'string' && optPromptF1Gemini) {
                        optPromptF1Gemini.value = json.promptF1Gemini.trim() || PROMPT_F1_GEMINI_PADRAO;
                    }
                    if (Array.isArray(json.urlsTurbo) && textoUrlsTurbo) {
                        textoUrlsTurbo.value = json.urlsTurbo.filter(u => u && u !== '<all_urls>').join('\n');
                    }
                    if (Array.isArray(json.regrasMapeamentoElementos)) {
                        regrasMapeamentoAtuais = json.regrasMapeamentoElementos;
                        renderizarListaRegrasMapeamento(regrasMapeamentoAtuais);
                    }
                    salvarConfiguracoes();
                    exibirToast('Backup JSON importado e sincronizado na nuvem!');
                } catch (_) {
                    exibirToast('Erro: Arquivo JSON inválido.');
                }
            };
            leitor.readAsText(arquivo);
            inputImportarArquivo.value = '';
        });
    }

    /* Passo 4.5.1: Exportar e Importar JSON do Mapeamento Manual Avançado (Seção 6.20 e Seção 6.85) */
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg && msg.acao === 'regrasMapeamentoAtualizadas' && Array.isArray(msg.regrasMapeamentoElementos)) {
                renderizarListaRegrasMapeamento(msg.regrasMapeamentoElementos);
            }
        });
    }

    if (btnExportarMapeamentoJson) {
        adicionarOuvinteSeguro(btnExportarMapeamentoJson, 'click', () => {
            const blob = new Blob([JSON.stringify(regrasMapeamentoAtuais, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jusgovbr-regras-mapeamento.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            exibirToast('Regras de mapeamento exportadas em JSON!');
        });
    }

    if (btnImportarMapeamentoJson && inputImportarMapeamentoArquivo) {
        adicionarOuvinteSeguro(btnImportarMapeamentoJson, 'click', () => {
            inputImportarMapeamentoArquivo.click();
        });

        adicionarOuvinteSeguro(inputImportarMapeamentoArquivo, 'change', (e) => {
            const arquivo = e.target.files && e.target.files[0];
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = (ev) => {
                try {
                    const json = JSON.parse(ev.target.result);
                    if (Array.isArray(json)) {
                        regrasMapeamentoAtuais = json;
                        renderizarListaRegrasMapeamento(regrasMapeamentoAtuais);
                        salvarRegrasMapeamento();
                        exibirToast('Regras de mapeamento importadas com sucesso!');
                    } else {
                        exibirToast('Erro: Arquivo JSON deve conter uma lista de regras.');
                    }
                } catch (_) {
                    exibirToast('Erro: Arquivo JSON de mapeamento inválido.');
                }
            };
            leitor.readAsText(arquivo);
            inputImportarMapeamentoArquivo.value = '';
        });
    }

    /* Passo 4.6: Visor "Ultima Selecao" (conteudo exato enviado por este addon a area de transferencia).
     * Regra: o addon NUNCA le o clipboard do sistema (politicas corporativas podem proibir). */
    function atualizarCoresEBotoesClipboard() {
        if (!btnAtualizarPreview) return;
        btnAtualizarPreview.classList.remove('btn-clip-permitido', 'btn-clip-bloqueado');
        btnAtualizarPreview.setAttribute('title', 'Atualizar a exibição da Última Seleção (conteúdo enviado por este plugin à área de transferência)');
        if (btnDownloadXMouse) {
            btnDownloadXMouse.style.display = 'none';
        }
    }

    function atualizarVisualAtencaoSwitches() {
        if (lblSwitchColagemBotaoDireito) lblSwitchColagemBotaoDireito.classList.remove('slider-atencao');
        if (lblSwitchColarBotaoMeio) lblSwitchColarBotaoMeio.classList.remove('slider-atencao');
        if (avisoPermissaoBotaoDireito) avisoPermissaoBotaoDireito.style.display = 'none';
        if (avisoPermissaoBotaoMeio) avisoPermissaoBotaoMeio.style.display = 'none';
    }

    function atualizarEstadoVisualSubopcoesMouse() {
        const ativo = optColarBotaoMeio ? optColarBotaoMeio.checked : true;
        if (optColagemBotaoDireito) optColagemBotaoDireito.disabled = !ativo;
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

    async function alternarColagemBotaoDireito() {
        if (!optColagemBotaoDireito) return;
        salvarConfiguracoes();
        atualizarVisualAtencaoSwitches();
    }

    async function alternarColarBotaoMeio() {
        if (!optColarBotaoMeio) return;
        salvarConfiguracoes();
        atualizarVisualAtencaoSwitches();
    }

    /* Mantida por compatibilidade: nao existe mais permissao de leitura a ser solicitada. */
    async function obterEstadoPermissaoClipboard() {
        return 'granted';
    }

    async function inicializarMonitorPermissaoClipboard() {
        atualizarCoresEBotoesClipboard();
        atualizarVisualAtencaoSwitches();
        atualizarVisorClipboardPassivo();
    }

    let leituraManualEmAndamento = false;

    function formatarParaVisor(origem) {
        if (!origem) {
            return { html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>', texto: '' };
        }
        if (typeof window.JusGovFormatarConteudoClipboard === 'function') {
            return window.JusGovFormatarConteudoClipboard(origem);
        }
        const txt = (typeof origem === 'object' && origem) ? (origem.texto || origem.html || '') : String(origem);
        const ehHtml = (typeof origem === 'object' && origem && Boolean(origem.html));
        let htmlFormatado = escapeHtml(txt);
        const spanBr = '<span class="simbolo-quebra-br" style="color: #64748b; font-weight: bold; margin: 0 1px; user-select: none;" title="Quebra de linha &lt;br&gt;">↵</span>';
        const spanP = '<span class="simbolo-quebra-p" style="color: #818cf8; font-weight: bold; margin: 0 1px; user-select: none;" title="Parágrafo &lt;p&gt;">¶</span>';
        if (ehHtml || /<br|<p/i.test(txt)) {
            htmlFormatado = htmlFormatado.replace(/&lt;br\s*\/?&gt;/gi, `&lt;br&gt;${spanBr}`);
            htmlFormatado = htmlFormatado.replace(/&lt;\/p&gt;/gi, `&lt;/p&gt;${spanP}`);
            htmlFormatado = htmlFormatado.replace(/&lt;p(\s+[^&]*)?&gt;/gi, `&lt;p$1&gt;${spanP}`);
        }
        htmlFormatado = htmlFormatado.replace(/\r?\n/g, `${spanBr}\n`);
        return {
            html: txt ? htmlFormatado : '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
            texto: txt
        };
    }

    function renderizarNoVisorClipboard(origemSlot1, origemSlot2) {
        if (previewAreaTransferencia) {
            const formatado1 = formatarParaVisor(origemSlot1);
            previewAreaTransferencia.innerHTML = formatado1.html;
        }
        if (previewAreaTransferenciaAnterior) {
            const formatado2 = formatarParaVisor(origemSlot2);
            previewAreaTransferenciaAnterior.innerHTML = formatado2.html;
        }
    }

    function obterClipboardInternoParaVisor() {
        const clipInterno = (typeof window !== 'undefined' ? window.__JUSGOV_ULTIMO_CLIPBOARD__ : null);
        if (clipInterno) {
            if (typeof clipInterno === 'object') {
                if (clipInterno.texto || clipInterno.html) {
                    return clipInterno;
                }
            } else if (typeof clipInterno === 'string' && clipInterno.trim().length > 0) {
                return clipInterno.trim();
            }
        }
        return '';
    }

    function obterClipboardAnteriorParaVisor() {
        const clipAnterior = (typeof window !== 'undefined' ? window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ : null);
        if (clipAnterior) {
            if (typeof clipAnterior === 'object') {
                if (clipAnterior.texto || clipAnterior.html) {
                    return clipAnterior;
                }
            } else if (typeof clipAnterior === 'string' && clipAnterior.trim().length > 0) {
                return clipAnterior.trim();
            }
        }
        return '';
    }

    /* Botao "Atualizar": exibe a Memória Interna de Seleção (Slot 1 + Slot 2 sem qualquer leitura do clipboard do SO) */
    async function acionarLeituraClipboardComPrompt(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!previewAreaTransferencia && !previewAreaTransferenciaAnterior) return;
        leituraManualEmAndamento = true;
        try {
            renderizarNoVisorClipboard(obterClipboardInternoParaVisor(), obterClipboardAnteriorParaVisor());
        } finally {
            setTimeout(() => {
                leituraManualEmAndamento = false;
            }, 350);
        }
    }

    function atualizarVisorClipboardPassivo() {
        if ((!previewAreaTransferencia && !previewAreaTransferenciaAnterior) || leituraManualEmAndamento) return;
        renderizarNoVisorClipboard(obterClipboardInternoParaVisor(), obterClipboardAnteriorParaVisor());
    }

    adicionarOuvinteSeguro(btnAtualizarPreview, 'click', acionarLeituraClipboardComPrompt);

    /* Botao de download do utilitario X-Mouse Button Control */
    if (btnDownloadXMouse) {
        adicionarOuvinteSeguro(btnDownloadXMouse, 'click', () => {
            const urlXMouse = 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm';
            if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
                chrome.tabs.create({ url: urlXMouse, active: true });
            } else {
                window.open(urlXMouse, '_blank');
            }
        });
    }

    const painelLab = document.getElementById('abaLaboratorio');
    adicionarOuvinteSeguro(painelLab, 'mouseup', (e) => {
        if (!e || !e.target) return;
        if (e.target.closest('#btnAtualizarPreview') || e.target.closest('#previewAreaTransferencia') || e.target.closest('#previewAreaTransferenciaAnterior') || e.target.closest('#btnDownloadXMouse') || e.target.closest('#avisoPermissaoClipboardInspector')) {
            return;
        }
        if (e.target.closest('.sample-token')) {
            setTimeout(() => {
                if (!leituraManualEmAndamento) {
                    atualizarVisorClipboardPassivo();
                }
            }, 100);
        }
    });

    /* Passo 4.6.0: Atualização automática do visor da Área de Transferência a cada cópia */
    window.addEventListener('copy', () => {
        try {
            setTimeout(() => {
                const clipAtual = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                if (!clipAtual || (!clipAtual.formatado && !clipAtual.html)) {
                    const sel = window.getSelection ? window.getSelection().toString() : '';
                    if (sel && sel.trim().length > 0) {
                        const selLimpo = sel.replace(/([^\n\r])\r?\n([^\n\r])/g, '$1 $2').trim();
                        if (!Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                            window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
                        }
                        const payloadNovo = { texto: selLimpo, html: '', formatado: false, timestamp: Date.now() };
                        if (window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto !== selLimpo) {
                            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                            window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift(payloadNovo);
                            if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                        } else if (!window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                            window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift(payloadNovo);
                            if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                        }
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = payloadNovo;
                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            chrome.storage.local.set({
                                ultimoClipboardInterno: window.__JUSGOV_ULTIMO_CLIPBOARD__,
                                ultimoClipboardAnteriorInterno: window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__,
                                historicoClipboardInterno: window.__JUSGOV_HISTORICO_CLIPBOARD__
                            }).catch(() => { });
                        }
                    }
                }
                if (!leituraManualEmAndamento) {
                    atualizarVisorClipboardPassivo();
                }
            }, 60);
        } catch (_) { }
    });
    window.addEventListener('focus', () => {
        if (!leituraManualEmAndamento) {
            atualizarVisorClipboardPassivo();
        }
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !leituraManualEmAndamento) {
            atualizarVisorClipboardPassivo();
        }
    });
    setInterval(() => {
        if (!document.hidden && !leituraManualEmAndamento) {
            atualizarVisorClipboardPassivo();
        }
    }, 5000);

    /* Passo 4.6.1: Controles de Limpeza do Visor de Mensagens de Console e Ocultacao do Quadro de Testes */
    adicionarOuvinteSeguro(btnLimparConsole, 'click', () => {
        historicoMensagensConsole.length = 0;
        if (lblContadorConsole) lblContadorConsole.textContent = '0';
        const msgVazia = '(Console limpo - nenhuma mensagem ou erro registrado)';
        if (visorMensagensConsole) visorMensagensConsole.textContent = msgVazia;
        if (painelMensagensConsole) painelMensagensConsole.textContent = msgVazia;
        if (painelResultadoAuditoria) {
            painelResultadoAuditoria.textContent = '';
            painelResultadoAuditoria.style.display = 'none';
        }
    });

    /* Passo 4.6.2: Indicador de Progresso Fino da Bateria de Testes / Fuzzing no Console */
    const barraProgressoConsole = document.getElementById('barraProgressoConsole');
    const preenchimentoProgressoConsole = document.getElementById('preenchimentoProgressoConsole');

    function exibirProgressoConsole(porcentagem) {
        if (!barraProgressoConsole || !preenchimentoProgressoConsole) return;
        const pct = Math.max(0, Math.min(100, Math.round(porcentagem)));
        barraProgressoConsole.style.display = 'block';
        preenchimentoProgressoConsole.style.width = `${pct}%`;
    }

    function ocultarProgressoConsole(delayMs = 450) {
        if (!barraProgressoConsole || !preenchimentoProgressoConsole) return;
        preenchimentoProgressoConsole.style.width = '100%';
        setTimeout(() => {
            barraProgressoConsole.style.display = 'none';
            preenchimentoProgressoConsole.style.width = '0%';
        }, delayMs);
    }

    function renderizarRelatorioAuditoriaFormatado(textoBruto) {
        if (!textoBruto) return '';
        let seguro = String(textoBruto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Token [OK] em verde vivo (#10b981)
        seguro = seguro.replace(/\[OK\]/g, '[<span style="color: #10b981; font-weight: bold;">OK</span>]');

        // Falhas e erros em vermelho (#ef4444)
        seguro = seguro.replace(/\[(FALHA|ERRO|ERRO AUDITORIA|ERRO FUZZING)\]/g, '[<span style="color: #ef4444; font-weight: bold;">$1</span>]');

        // Avisos, alertas e atenção em amarelo/âmbar (#f59e0b)
        seguro = seguro.replace(/\[(AVISO|ALERTA|ATENÇÃO|ATENCAO)\]/g, '[<span style="color: #f59e0b; font-weight: bold;">$1</span>]');

        return seguro;
    }

    /* Passo 4.7: Executar Bateria Automatizada de Auditoria (debug.js) na Aba Laboratório */
    adicionarOuvinteSeguro(btnExecutarAuditoriaDebug, 'click', async () => {
        if (typeof window.JusGovExecutarAuditoria === 'function' || typeof window.JusGovExecutarAuditoriaAsync === 'function') {
            exibirToast('Executando Auditoria... aguarde');
            btnExecutarAuditoriaDebug.disabled = true;
            btnExecutarAuditoriaDebug.textContent = 'Executando...';
            if (painelResultadoAuditoria) {
                painelResultadoAuditoria.style.display = 'block';
                painelResultadoAuditoria.innerHTML = '<div style="padding: 16px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center;">⏳ Executando testes de auditoria... o relatório será exibido ao término.</div>';
            }
            exibirProgressoConsole(5);
            try {
                let relatorio;
                if (typeof window.JusGovExecutarAuditoriaAsync === 'function') {
                    relatorio = await window.JusGovExecutarAuditoriaAsync({}, (pct, nomeBateria) => {
                        exibirProgressoConsole(pct);
                        if (nomeBateria) {
                            registrarMensagemDiretaNoVisorConsole('INFO', `Auditoria [${Math.round(pct)}%]: ${nomeBateria}...`);
                        }
                    });
                } else {
                    relatorio = window.JusGovExecutarAuditoria({
                        onProgress: (pct, nomeBateria) => {
                            exibirProgressoConsole(pct);
                            if (nomeBateria) {
                                registrarMensagemDiretaNoVisorConsole('INFO', `Auditoria [${Math.round(pct)}%]: ${nomeBateria}...`);
                            }
                        }
                    });
                }
                exibirProgressoConsole(100);
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado(relatorio.logTexto);
                    painelResultadoAuditoria.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                exibirToast(`Auditoria concluída: ${relatorio.aprovados}/${relatorio.total} testes aprovados!`);
                registrarMensagemDiretaNoVisorConsole('INFO', `Auditoria concluída: ${relatorio.aprovados}/${relatorio.total} testes aprovados.`);
            } catch (errAuditoria) {
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado('[ERRO AUDITORIA] ' + (errAuditoria && errAuditoria.message ? errAuditoria.message : String(errAuditoria)));
                }
                registrarMensagemDiretaNoVisorConsole('ERROR', `Falha na auditoria: ${errAuditoria && errAuditoria.message ? errAuditoria.message : String(errAuditoria)}`);
            } finally {
                btnExecutarAuditoriaDebug.disabled = false;
                btnExecutarAuditoriaDebug.textContent = 'Auditoria';
                ocultarProgressoConsole(450);
            }
        } else {
            if (painelResultadoAuditoria) {
                painelResultadoAuditoria.style.display = 'block';
                painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado('[ERRO] Módulo debug.js não carregado.');
            }
            registrarMensagemDiretaNoVisorConsole('ERROR', 'Módulo debug.js não carregado.');
        }
    });

    /* Passo 4.7.1: Executar Bateria Estendida de Fuzzing Randômico (1s/T por tipo de teste) */
    adicionarOuvinteSeguro(btnExecutarFuzzingDebug, 'click', async () => {
        if (typeof window.JusGovExecutarFuzzing === 'function' || typeof window.JusGovExecutarFuzzingAsync === 'function') {
            exibirToast('Executando Fuzzing (1s/T)... aguarde');
            btnExecutarFuzzingDebug.disabled = true;
            btnExecutarFuzzingDebug.textContent = 'Executando...';
            if (painelResultadoAuditoria) {
                painelResultadoAuditoria.style.display = 'block';
                painelResultadoAuditoria.innerHTML = '<div style="padding: 16px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center;">⏳ Executando Fuzzing (1s/T)... o relatório será exibido ao término.</div>';
            }
            exibirProgressoConsole(5);
            try {
                let relatorio;
                if (typeof window.JusGovExecutarFuzzingAsync === 'function') {
                    relatorio = await window.JusGovExecutarFuzzingAsync(1000, (pct, nomeTeste) => {
                        exibirProgressoConsole(pct);
                        registrarMensagemDiretaNoVisorConsole('INFO', `Fuzzing [${Math.round(pct)}%]: ${nomeTeste}...`);
                    });
                } else {
                    relatorio = window.JusGovExecutarFuzzing(1000);
                }
                exibirProgressoConsole(100);
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado(relatorio.logTexto);
                    painelResultadoAuditoria.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                exibirToast(`Fuzzing concluído: ${relatorio.aprovados}/${relatorio.total} aprovados!`);
                registrarMensagemDiretaNoVisorConsole('INFO', `Fuzzing (1s/T) concluído: ${relatorio.aprovados}/${relatorio.total} aprovados.`);
            } catch (errFuzz) {
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado('[ERRO FUZZING] ' + (errFuzz && errFuzz.message ? errFuzz.message : String(errFuzz)));
                }
                registrarMensagemDiretaNoVisorConsole('ERROR', `Falha no Fuzzing: ${errFuzz && errFuzz.message ? errFuzz.message : String(errFuzz)}`);
            } finally {
                btnExecutarFuzzingDebug.disabled = false;
                btnExecutarFuzzingDebug.textContent = 'Fuzzing (1s/T)';
                ocultarProgressoConsole(500);
            }
        } else {
            if (painelResultadoAuditoria) {
                painelResultadoAuditoria.style.display = 'block';
                painelResultadoAuditoria.innerHTML = renderizarRelatorioAuditoriaFormatado('[ERRO] Módulo debug.js não carregado.');
            }
            registrarMensagemDiretaNoVisorConsole('ERROR', 'Módulo debug.js não carregado.');
        }
    });

    /* Passo 4.8: Escutar alteracoes vindas do atalho Esc+Esc, do Popup ou de contadores */
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
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
                if (changes.colagemBotaoDireitoAtiva !== undefined && optColagemBotaoDireito) {
                    optColagemBotaoDireito.checked = Boolean(changes.colagemBotaoDireitoAtiva.newValue);
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
                    if (selectReutilizarAcaoConteudo) selectReutilizarAcaoConteudo.value = novaAcao;
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
                    if (lblSentidoOrdenacaoGuias) {
                        lblSentidoOrdenacaoGuias.textContent = (novoSentido === 'esq_dir')
                            ? 'Da Esquerda para a Direita (A-Z)'
                            : 'Da Direita para a Esquerda (Z-A)';
                    }
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
                if (changes.tempoExibicaoAlertaMs !== undefined && optTempoExibicaoAlerta) {
                    const novoTempo = changes.tempoExibicaoAlertaMs.newValue !== undefined ? Number(changes.tempoExibicaoAlertaMs.newValue) : -1;
                    optTempoExibicaoAlerta.value = String(converterMsParaIndiceSliderAlerta(novoTempo));
                    atualizarRotuloSliderAlerta();
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
                    if (!document.hidden && !leituraManualEmAndamento) {
                        atualizarVisorClipboardPassivo();
                    }
                }
                if (changes.ultimoClipboardAnteriorInterno !== undefined) {
                    if (changes.ultimoClipboardAnteriorInterno.newValue) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = changes.ultimoClipboardAnteriorInterno.newValue;
                    }
                    if (!document.hidden && !leituraManualEmAndamento) {
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

    configurarNavegacaoAbas();
    carregarConfiguracoesDoStorage();
    inicializarMonitorPermissaoClipboard();

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
                    if (!leituraManualEmAndamento) {
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
