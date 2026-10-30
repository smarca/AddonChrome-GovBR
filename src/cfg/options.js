/* ==========================================================================
 * Nome do arquivo: options.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
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

/* Passo 1.1.1: Escalas dos controles deslizantes (sliders) e limite anti-overflow de contadores */
const ESCALA_TEMPO_ALERTA_MS = Object.freeze([0, 2000, 3500, 5000, 7500, 10000]);
const ROTULOS_TEMPO_ALERTA_HTML = Object.freeze([
    '0 (Desabilitado)',
    '2s (Rápido)',
    '3,5s (Padrão)',
    '5s (Lento)',
    '7,5s (Super lento)',
    '10s (Ultra lento)'
]);
const COR_PADRAO_FLASH_BORDER = '#0d9488';
const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 900000000;
const PROMPT_F1_GEMINI_PADRAO = "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";

document.addEventListener('DOMContentLoaded', () => {
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
    const optSelecaoAutomaticaTextoEditavel = document.getElementById('optSelecaoAutomaticaTextoEditavel');
    const selectModoPlaceholdersMinutasHtml = document.getElementById('selectModoPlaceholdersMinutasHtml');
    const optColagemBotaoDireito = document.getElementById('optColagemBotaoDireito');
    const lblSwitchColagemBotaoDireito = document.getElementById('lblSwitchColagemBotaoDireito');
    const avisoPermissaoBotaoDireito = document.getElementById('avisoPermissaoBotaoDireito');
    const optCapturaBotoesMouse4e5 = document.getElementById('optCapturaBotoesMouse4e5');
    const optColarBotaoMeio = document.getElementById('optColarBotaoMeio');
    const lblSwitchColarBotaoMeio = document.getElementById('lblSwitchColarBotaoMeio');
    const avisoPermissaoBotaoMeio = document.getElementById('avisoPermissaoBotaoMeio');
    const optNavegacaoTecladoCampos = document.getElementById('optNavegacaoTecladoCampos');
    const optBloquearNovasJanelas = document.getElementById('optBloquearNovasJanelas');
    const optPreservarJanelasAutenticacao = document.getElementById('optPreservarJanelasAutenticacao');
    const optAbaEmPrimeiroPlano = document.getElementById('optAbaEmPrimeiroPlano') || document.getElementById('optAbaEmSegundoPlano');
    const optAbaEmSegundoPlano = optAbaEmPrimeiroPlano;
    const optReutilizarAbasAbertas = document.getElementById('optReutilizarAbasAbertas');
    const optMonitorarUrlOriginal = document.getElementById('optMonitorarUrlOriginal');
    const optMonitorarUrlAtual = document.getElementById('optMonitorarUrlAtual');
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
    const checkOpcaoAmpuletas = document.getElementById('checkOpcaoAmpuletas') || document.getElementById('optAntiAmpulhetaPjeAtivo');
    const optConverterCabecalhoPje = document.getElementById('optConverterCabecalhoPje');
    const optTempoExibicaoAlerta = document.getElementById('optTempoExibicaoAlerta');
    const lblValorTempoAlerta = document.getElementById('lblValorTempoAlerta');
    const optTempoFlashMs = document.getElementById('optTempoFlashMs');
    const optCorFlashBorder = document.getElementById('optCorFlashBorder');
    const lblValorTempoFlash = document.getElementById('lblValorTempoFlash');
    const optAcumuladorSeparador = document.getElementById('optAcumuladorSeparador');
    const optAtalhoF1GeminiAtivo = document.getElementById('optAtalhoF1GeminiAtivo');
    const optPromptF1Gemini = document.getElementById('optPromptF1Gemini');
    const btnRestaurarPromptF1Padrao = document.getElementById('btnRestaurarPromptF1Padrao');
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

    /* Controles do Laboratorio, Console e Auditoria */
    const previewAreaTransferencia = document.getElementById('previewAreaTransferencia');
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

    /*
     * FUNCAO: configurarNavegacaoAbas
     * OBJETIVO DE RECONSTRUCAO: Alternar entre Configuracoes, Central de Ajuda
     * e Laboratorio de Testes sem recarregar a pagina.
     */
    function configurarNavegacaoAbas() {
        /* Passo 2.2: Vincular clique em cada botao de aba */
        botoesAbas.forEach(btn => {
            btn.addEventListener('click', () => {
                const idAlvo = btn.getAttribute('data-aba');
                botoesAbas.forEach(b => b.classList.remove('ativa'));
                paineisAbas.forEach(p => p.classList.remove('ativa'));

                btn.classList.add('ativa');
                const painel = document.getElementById(idAlvo);
                if (painel) painel.classList.add('ativa');
                if (idAlvo === 'abaLaboratorio') {
                    atualizarVisorClipboardPassivo();
                }
            });
        });
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
        if (!Number.isFinite(valor)) return 2;
        const idxExato = ESCALA_TEMPO_ALERTA_MS.indexOf(valor);
        if (idxExato !== -1) return idxExato;
        let melhorIdx = 2;
        let menorDif = Infinity;
        for (let i = 0; i < ESCALA_TEMPO_ALERTA_MS.length; i++) {
            const dif = Math.abs(ESCALA_TEMPO_ALERTA_MS[i] - valor);
            if (dif < menorDif) {
                menorDif = dif;
                melhorIdx = i;
            }
        }
        return melhorIdx;
    }

    function obterTempoAlertaMsDoSlider() {
        if (!optTempoExibicaoAlerta) return 3500;
        const idx = parseInt(optTempoExibicaoAlerta.value, 10);
        if (Number.isInteger(idx) && idx >= 0 && idx < ESCALA_TEMPO_ALERTA_MS.length) {
            return ESCALA_TEMPO_ALERTA_MS[idx];
        }
        return 3500;
    }

    function atualizarRotuloSliderAlerta() {
        if (!lblValorTempoAlerta || !optTempoExibicaoAlerta) return;
        const idx = parseInt(optTempoExibicaoAlerta.value, 10);
        const idxSeguro = (Number.isInteger(idx) && idx >= 0 && idx < ROTULOS_TEMPO_ALERTA_HTML.length) ? idx : 2;
        lblValorTempoAlerta.innerHTML = ROTULOS_TEMPO_ALERTA_HTML[idxSeguro];
    }

    function normalizarTempoFlashMs(valorBruto) {
        const num = Number(valorBruto);
        if (!Number.isFinite(num) || num <= 0) return 0;
        const arredondado = Math.round(num / 250) * 250;
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
        if (ms <= 0) {
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
            lblValorNivelFiltro.innerHTML = '2 - Intermediário (Parágrafos)';
        } else if (val === 3) {
            lblValorNivelFiltro.innerHTML = '3 - Avançado (Documentos/Tabelas)';
        } else if (val === 4) {
            lblValorNivelFiltro.innerHTML = '4 - Estendido (Suítes Office)';
        } else {
            lblValorNivelFiltro.innerHTML = '1 - Básico (Visual Simples)';
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

    /*
     * FUNCAO: carregarConfiguracoesDoStorage
     * OBJETIVO DE RECONSTRUCAO: Ler os dados atuais de chrome.storage.sync e
     * popular todos os controles basicos e avancados da interface.
     */
    function carregarConfiguracoesDoStorage() {
        /* Passo 3.1: Consultar chaves no storage sincronizado */
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            if (textoUrlsTurbo) textoUrlsTurbo.value = PADROES_FABRICA_TURBO.join('\n');
            atualizarRotuloSliderAlerta();
            atualizarRotuloSliderFlash();
            atualizarRotuloNivelFiltro();
            atualizarEstadoOfuscamentoNivelFiltro();
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
            if (optSelecaoAutomaticaTextoEditavel) optSelecaoAutomaticaTextoEditavel.checked = (dados.selecaoEditavelAtiva !== false);
            if (selectModoPlaceholdersMinutasHtml) {
                if (typeof dados.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(dados.modoPlaceholdersMinutasHtml)) {
                    selectModoPlaceholdersMinutasHtml.value = dados.modoPlaceholdersMinutasHtml;
                } else if (dados.placeholdersMinutasHtmlAtivo === false) {
                    selectModoPlaceholdersMinutasHtml.value = 'desabilitado';
                } else {
                    selectModoPlaceholdersMinutasHtml.value = 'placeholders';
                }
            }
            if (optColagemBotaoDireito) optColagemBotaoDireito.checked = false;
            if (optCapturaBotoesMouse4e5) optCapturaBotoesMouse4e5.checked = (dados.capturaBotoesMouse4e5Ativa !== false);
            if (optColarBotaoMeio) optColarBotaoMeio.checked = (dados.colarBotaoMeioAtivo !== false);
            obterEstadoPermissaoClipboard().then((perm) => {
                atualizarVisualAtencaoSwitches(perm);
            });
            if (optNavegacaoTecladoCampos) optNavegacaoTecladoCampos.checked = (dados.navegacaoTecladoCamposAtiva !== false);
            if (optBloquearNovasJanelas) optBloquearNovasJanelas.checked = (dados.bloquearNovasJanelas !== false);
            if (optPreservarJanelasAutenticacao) optPreservarJanelasAutenticacao.checked = (dados.preservarJanelasAutenticacao !== false);
            if (optAbaEmPrimeiroPlano) {
                optAbaEmPrimeiroPlano.checked = Boolean(
                    dados.abaEmPrimeiroPlano !== undefined
                        ? dados.abaEmPrimeiroPlano
                        : (dados.abaEmSegundoPlano === false)
                );
            }
            if (optReutilizarAbasAbertas) optReutilizarAbasAbertas.checked = Boolean(dados.reutilizarAbasAbertas);
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = Boolean(dados.monitorarUrlOriginalAbertura);
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = (dados.monitorarUrlAtualPagina !== false);
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
            if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = (dados.validacaoMatematicaAtiva !== false);
            if (optConverterCabecalhoPje) optConverterCabecalhoPje.checked = (dados.converterCabecalhoPjeAtiva !== false && dados.converterCabecalhoPjeAtivo !== false);
            if (optAtalhoF1GeminiAtivo) optAtalhoF1GeminiAtivo.checked = (dados.atalhoF1GeminiAtivo !== false);
            if (optPromptF1Gemini) {
                optPromptF1Gemini.value = (typeof dados.promptF1Gemini === 'string' && dados.promptF1Gemini.trim().length > 0)
                    ? dados.promptF1Gemini
                    : PROMPT_F1_GEMINI_PADRAO;
                ajustarELimitarLinhasPromptIA();
            }

            if (optTempoExibicaoAlerta) {
                const tempoSalvo = dados.tempoExibicaoAlertaMs !== undefined ? Number(dados.tempoExibicaoAlertaMs) : 3500;
                optTempoExibicaoAlerta.value = String(converterMsParaIndiceSliderAlerta(tempoSalvo));
                atualizarRotuloSliderAlerta();
            }

            if (optTempoFlashMs) {
                const msFlashSalvo = dados.tempoFlashBorderMs !== undefined
                    ? normalizarTempoFlashMs(dados.tempoFlashBorderMs)
                    : (typeof dados.flashBorderAtivo === 'boolean' ? (dados.flashBorderAtivo ? 500 : 0) : 500);
                optTempoFlashMs.value = String(msFlashSalvo);
                atualizarRotuloSliderFlash();
            }
            if (optCorFlashBorder) {
                optCorFlashBorder.value = normalizarCorHex(dados.corFlashBorder);
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

    /*
     * FUNCAO: salvarConfiguracoes
     * OBJETIVO DE RECONSTRUCAO: Gravar todas as opcoes basicas, avancadas e listas
     * de URLs no chrome.storage.sync para sincronizacao na nuvem da Conta Google
     * em todos os navegadores e propagacao imediata pelo Service Worker.
     */
    function salvarConfiguracoes() {
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
        const tempoFlashMs = optTempoFlashMs ? normalizarTempoFlashMs(optTempoFlashMs.value) : 0;
        const corFlash = optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : COR_PADRAO_FLASH_BORDER;

        atualizarRotuloSliderAlerta();
        atualizarRotuloSliderFlash();

        const payload = {
            modoTurbo: selectModoTurbo ? selectModoTurbo.value : 'global',
            comportamentoCliqueIcone: selectComportamentoIcone ? selectComportamentoIcone.value : 'popup',
            manterFormatacaoBasica: manterBasica,
            nivelFiltroFormatacao: optNivelFiltroEstilos ? converterIndiceParaNivelFiltro(optNivelFiltroEstilos.value) : 'basico',
            ativoAmpuletas: checkOpcaoAmpuletas ? checkOpcaoAmpuletas.checked : true,
            selecaoEditavelAtiva: optSelecaoAutomaticaTextoEditavel ? optSelecaoAutomaticaTextoEditavel.checked : true,
            modoPlaceholdersMinutasHtml: selectModoPlaceholdersMinutasHtml ? selectModoPlaceholdersMinutasHtml.value : 'placeholders',
            placeholdersMinutasHtmlAtivo: selectModoPlaceholdersMinutasHtml ? (selectModoPlaceholdersMinutasHtml.value !== 'desabilitado') : true,
            colagemBotaoDireitoAtiva: false,
            capturaBotoesMouse4e5Ativa: optCapturaBotoesMouse4e5 ? optCapturaBotoesMouse4e5.checked : true,
            colarBotaoMeioAtivo: optColarBotaoMeio ? optColarBotaoMeio.checked : true,
            navegacaoTecladoCamposAtiva: optNavegacaoTecladoCampos ? optNavegacaoTecladoCampos.checked : true,
            bloquearNovasJanelas: optBloquearNovasJanelas ? optBloquearNovasJanelas.checked : true,
            preservarJanelasAutenticacao: optPreservarJanelasAutenticacao ? optPreservarJanelasAutenticacao.checked : true,
            abaEmPrimeiroPlano: optAbaEmPrimeiroPlano ? optAbaEmPrimeiroPlano.checked : false,
            abaEmSegundoPlano: optAbaEmPrimeiroPlano ? !optAbaEmPrimeiroPlano.checked : true,
            reutilizarAbasAbertas: optReutilizarAbasAbertas ? optReutilizarAbasAbertas.checked : false,
            monitorarUrlOriginalAbertura: optMonitorarUrlOriginal ? optMonitorarUrlOriginal.checked : false,
            monitorarUrlAtualPagina: optMonitorarUrlAtual ? optMonitorarUrlAtual.checked : true,
            criterioOrdenacaoGuias: optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'nenhum',
            sentidoOrdenacaoGuias: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
            ordenarGuiasFixadas: optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: optTempoInatividadeDescarteMinutos ? Number(optTempoInatividadeDescarteMinutos.value) : 20,
            validacaoMatematicaAtiva: optValidacaoMatematicaAtiva ? optValidacaoMatematicaAtiva.checked : true,
            converterCabecalhoPjeAtivo: optConverterCabecalhoPje ? optConverterCabecalhoPje.checked : true,
            atalhoF1GeminiAtivo: optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true,
            promptF1Gemini: (optPromptF1Gemini && optPromptF1Gemini.value.trim().length > 0) ? optPromptF1Gemini.value.trim() : PROMPT_F1_GEMINI_PADRAO,
            tempoExibicaoAlertaMs: tempoAlertaMs,
            tempoFlashBorderMs: tempoFlashMs,
            corFlashBorder: corFlash,
            separadorAcumulador: sepValor,
            urlsTurbo: novasUrlsTurbo.length > 0 ? novasUrlsTurbo : [...PADROES_FABRICA_TURBO]
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
        salvarConfiguracoes();
    });
    adicionarOuvinteSeguro(textoUrlsTurbo, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(checkOpcaoAmpuletas, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optConverterCabecalhoPje, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optSelecaoAutomaticaTextoEditavel, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(selectModoPlaceholdersMinutasHtml, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optColagemBotaoDireito, 'change', alternarColagemBotaoDireito);
    adicionarOuvinteSeguro(optCapturaBotoesMouse4e5, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optColarBotaoMeio, 'change', () => {
        atualizarEstadoVisualSubopcoesMouse();
        alternarColarBotaoMeio();
    });
    adicionarOuvinteSeguro(optNavegacaoTecladoCampos, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optBloquearNovasJanelas, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optPreservarJanelasAutenticacao, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optAbaEmPrimeiroPlano, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optReutilizarAbasAbertas, 'change', salvarConfiguracoes);

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
            atualizarSentidoOrdenacao(!optSentidoOrdenacaoGuiasSwitch.checked, true);
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
            const sent = optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'dir_esq';
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
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = 'dir_esq';
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = true;
            if (lblSentidoOrdenacaoGuias) lblSentidoOrdenacaoGuias.textContent = 'Da Direita para a Esquerda (Z-A)';
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
    adicionarOuvinteSeguro(optValidacaoMatematicaAtiva, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoExibicaoAlerta, 'input', atualizarRotuloSliderAlerta);
    adicionarOuvinteSeguro(optTempoExibicaoAlerta, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optTempoFlashMs, 'input', atualizarRotuloSliderFlash);
    adicionarOuvinteSeguro(optTempoFlashMs, 'change', salvarConfiguracoes);
    adicionarOuvinteSeguro(optCorFlashBorder, 'input', salvarConfiguracoes);
    adicionarOuvinteSeguro(optCorFlashBorder, 'change', salvarConfiguracoes);

    /* Validacao e selecao imediata do Separador do Modo Acumulador */
    if (optAcumuladorSeparador) {
        adicionarOuvinteSeguro(optAcumuladorSeparador, 'input', () => {
            const limpo = optAcumuladorSeparador.value.replace(/[0-9\p{L}]/gu, '').slice(0, 5);
            if (optAcumuladorSeparador.value !== limpo) {
                optAcumuladorSeparador.value = limpo;
            }
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

    adicionarOuvinteSeguro(optAtalhoF1GeminiAtivo, 'change', salvarConfiguracoes);
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
            if (optSelecaoAutomaticaTextoEditavel) optSelecaoAutomaticaTextoEditavel.checked = true;
            if (selectModoPlaceholdersMinutasHtml) selectModoPlaceholdersMinutasHtml.value = 'placeholders';
            if (optColagemBotaoDireito) optColagemBotaoDireito.checked = false;
            if (optCapturaBotoesMouse4e5) optCapturaBotoesMouse4e5.checked = true;
            if (optColarBotaoMeio) optColarBotaoMeio.checked = true;
            obterEstadoPermissaoClipboard().then((perm) => {
                atualizarVisualAtencaoSwitches(perm);
            });
            if (optNavegacaoTecladoCampos) optNavegacaoTecladoCampos.checked = true;
            if (optBloquearNovasJanelas) optBloquearNovasJanelas.checked = true;
            if (optPreservarJanelasAutenticacao) optPreservarJanelasAutenticacao.checked = true;
            if (optAbaEmPrimeiroPlano) optAbaEmPrimeiroPlano.checked = false;
            if (optReutilizarAbasAbertas) optReutilizarAbasAbertas.checked = false;
            if (optMonitorarUrlOriginal) optMonitorarUrlOriginal.checked = false;
            if (optMonitorarUrlAtual) optMonitorarUrlAtual.checked = true;
            if (optCriterioOrdenacaoGuias) optCriterioOrdenacaoGuias.value = 'nenhum';
            if (optSentidoOrdenacaoGuias) optSentidoOrdenacaoGuias.value = 'dir_esq';
            if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = true;
            if (lblSentidoOrdenacaoGuias) lblSentidoOrdenacaoGuias.textContent = 'Da Direita para a Esquerda (Z-A)';
            if (optOrdenarGuiasFixadas) optOrdenarGuiasFixadas.checked = false;
            if (btnAgruparDominioAgora) btnAgruparDominioAgora.textContent = 'Agrupar por Domínio Agora (Tab Groups)';
            if (optDescarteGuiasInativas) optDescarteGuiasInativas.checked = false;
            if (optValidacaoMatematicaAtiva) optValidacaoMatematicaAtiva.checked = true;
            if (optTempoExibicaoAlerta) {
                optTempoExibicaoAlerta.value = '2';
                atualizarRotuloSliderAlerta();
            }
            if (optTempoFlashMs) {
                optTempoFlashMs.value = '500';
                atualizarRotuloSliderFlash();
            }
            if (optCorFlashBorder) optCorFlashBorder.value = COR_PADRAO_FLASH_BORDER;
            if (optAcumuladorSeparador) optAcumuladorSeparador.value = ';';
            if (optAtalhoF1GeminiAtivo) optAtalhoF1GeminiAtivo.checked = true;
            if (optPromptF1Gemini) optPromptF1Gemini.value = PROMPT_F1_GEMINI_PADRAO;
            if (textoUrlsTurbo) textoUrlsTurbo.value = PADROES_FABRICA_TURBO.join('\n');
            if (lblTotalCopias) lblTotalCopias.textContent = '0';
            if (lblTotalAlertas) lblTotalAlertas.textContent = '0';

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
                reutilizarAbasAbertas: false,
                monitorarUrlOriginalAbertura: false,
                monitorarUrlAtualPagina: true,
                criterioOrdenacaoGuias: 'nenhum',
                sentidoOrdenacaoGuias: 'dir_esq',
                ordenarGuiasFixadas: false,
                descarteGuiasInativasAtivo: false,
                validacaoMatematicaAtiva: true,
                tempoExibicaoAlertaMs: 3500,
                tempoFlashBorderMs: 500,
                corFlashBorder: COR_PADRAO_FLASH_BORDER,
                separadorAcumulador: ';',
                atalhoF1GeminiAtivo: true,
                promptF1Gemini: PROMPT_F1_GEMINI_PADRAO,
                urlsTurbo: [...PADROES_FABRICA_TURBO],
                urlsAmpuletas: [...PADROES_FABRICA_AMPULETAS]
            };
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
            selecaoEditavelAtiva: optSelecaoAutomaticaTextoEditavel ? optSelecaoAutomaticaTextoEditavel.checked : true,
            modoPlaceholdersMinutasHtml: selectModoPlaceholdersMinutasHtml ? selectModoPlaceholdersMinutasHtml.value : 'placeholders',
            placeholdersMinutasHtmlAtivo: selectModoPlaceholdersMinutasHtml ? (selectModoPlaceholdersMinutasHtml.value !== 'desabilitado') : true,
            colagemBotaoDireitoAtiva: false,
            capturaBotoesMouse4e5Ativa: optCapturaBotoesMouse4e5 ? optCapturaBotoesMouse4e5.checked : true,
            colarBotaoMeioAtivo: optColarBotaoMeio ? optColarBotaoMeio.checked : true,
            navegacaoTecladoCamposAtiva: optNavegacaoTecladoCampos ? optNavegacaoTecladoCampos.checked : true,
            bloquearNovasJanelas: optBloquearNovasJanelas ? optBloquearNovasJanelas.checked : true,
            preservarJanelasAutenticacao: optPreservarJanelasAutenticacao ? optPreservarJanelasAutenticacao.checked : true,
            abaEmPrimeiroPlano: optAbaEmPrimeiroPlano ? optAbaEmPrimeiroPlano.checked : false,
            abaEmSegundoPlano: optAbaEmPrimeiroPlano ? !optAbaEmPrimeiroPlano.checked : true,
            reutilizarAbasAbertas: optReutilizarAbasAbertas ? optReutilizarAbasAbertas.checked : false,
            monitorarUrlOriginalAbertura: optMonitorarUrlOriginal ? optMonitorarUrlOriginal.checked : false,
            monitorarUrlAtualPagina: optMonitorarUrlAtual ? optMonitorarUrlAtual.checked : true,
            criterioOrdenacaoGuias: optCriterioOrdenacaoGuias ? optCriterioOrdenacaoGuias.value : 'nenhum',
            sentidoOrdenacaoGuias: optSentidoOrdenacaoGuias ? optSentidoOrdenacaoGuias.value : 'esq_dir',
            ordenarGuiasFixadas: optOrdenarGuiasFixadas ? optOrdenarGuiasFixadas.checked : false,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: optTempoInatividadeDescarteMinutos ? Number(optTempoInatividadeDescarteMinutos.value) : 20,
            validacaoMatematicaAtiva: optValidacaoMatematicaAtiva ? optValidacaoMatematicaAtiva.checked : true,
            tempoExibicaoAlertaMs: obterTempoAlertaMsDoSlider(),
            tempoFlashBorderMs: tempoFlashMsExport,
            corFlashBorder: optCorFlashBorder ? normalizarCorHex(optCorFlashBorder.value) : COR_PADRAO_FLASH_BORDER,
            separadorAcumulador: optAcumuladorSeparador ? normalizarSeparadorAcumulador(optAcumuladorSeparador.value) : ';',
            atalhoF1GeminiAtivo: optAtalhoF1GeminiAtivo ? optAtalhoF1GeminiAtivo.checked : true,
            promptF1Gemini: optPromptF1Gemini ? optPromptF1Gemini.value : PROMPT_F1_GEMINI_PADRAO,
            urlsTurbo: extrairLinhasLimpas(textoUrlsTurbo ? textoUrlsTurbo.value : '')
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
                    if (typeof json.selecaoEditavelAtiva === 'boolean' && optSelecaoAutomaticaTextoEditavel) {
                        optSelecaoAutomaticaTextoEditavel.checked = json.selecaoEditavelAtiva;
                    }
                    if (selectModoPlaceholdersMinutasHtml) {
                        if (typeof json.modoPlaceholdersMinutasHtml === 'string' && ['desabilitado', 'placeholders', 'ctrl_avancado', 'avancado'].includes(json.modoPlaceholdersMinutasHtml)) {
                            selectModoPlaceholdersMinutasHtml.value = json.modoPlaceholdersMinutasHtml;
                        } else if (typeof json.placeholdersMinutasHtmlAtivo === 'boolean') {
                            selectModoPlaceholdersMinutasHtml.value = json.placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado';
                        }
                    }
                    if (typeof json.colagemBotaoDireitoAtiva === 'boolean' && optColagemBotaoDireito) {
                        optColagemBotaoDireito.checked = json.colagemBotaoDireitoAtiva;
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
                        if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (json.sentidoOrdenacaoGuias === 'dir_esq');
                        if (lblSentidoOrdenacaoGuias) {
                            lblSentidoOrdenacaoGuias.textContent = (json.sentidoOrdenacaoGuias === 'dir_esq')
                                ? 'Da Direita para a Esquerda (Z-A)'
                                : 'Da Esquerda para a Direita (A-Z)';
                        }
                    }
                    if (typeof json.ordenarGuiasFixadas === 'boolean' && optOrdenarGuiasFixadas) {
                        optOrdenarGuiasFixadas.checked = json.ordenarGuiasFixadas;
                    }
                    if (typeof json.descarteGuiasInativasAtivo === 'boolean' && optDescarteGuiasInativas) {
                        optDescarteGuiasInativas.checked = json.descarteGuiasInativasAtivo;
                    }
                    if (typeof json.validacaoMatematicaAtiva === 'boolean' && optValidacaoMatematicaAtiva) {
                        optValidacaoMatematicaAtiva.checked = json.validacaoMatematicaAtiva;
                    }
                    if (json.tempoExibicaoAlertaMs !== undefined && optTempoExibicaoAlerta) {
                        optTempoExibicaoAlerta.value = String(converterMsParaIndiceSliderAlerta(json.tempoExibicaoAlertaMs));
                        atualizarRotuloSliderAlerta();
                    }
                    if (optTempoFlashMs) {
                        if (json.tempoFlashBorderMs !== undefined) {
                            optTempoFlashMs.value = String(normalizarTempoFlashMs(json.tempoFlashBorderMs));
                        } else if (typeof json.flashBorderAtivo === 'boolean') {
                            optTempoFlashMs.value = json.flashBorderAtivo ? '500' : '0';
                        }
                        atualizarRotuloSliderFlash();
                    }
                    if (typeof json.corFlashBorder === 'string' && optCorFlashBorder) {
                        optCorFlashBorder.value = normalizarCorHex(json.corFlashBorder);
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

    function renderizarNoVisorClipboard(origem) {
        if (!previewAreaTransferencia) return;
        if (typeof window.JusGovFormatarConteudoClipboard === 'function') {
            const formatado = window.JusGovFormatarConteudoClipboard(origem);
            previewAreaTransferencia.innerHTML = formatado.html;
        } else {
            previewAreaTransferencia.textContent = String(origem || '(vazio)');
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

    /* Botao "Atualizar": exibe a Ultima Selecao (sem qualquer leitura do clipboard do sistema) */
    async function acionarLeituraClipboardComPrompt(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!previewAreaTransferencia) return;
        leituraManualEmAndamento = true;
        try {
            renderizarNoVisorClipboard(obterClipboardInternoParaVisor());
        } finally {
            setTimeout(() => {
                leituraManualEmAndamento = false;
            }, 350);
        }
    }

    function atualizarVisorClipboardPassivo() {
        if (!previewAreaTransferencia || leituraManualEmAndamento) return;
        renderizarNoVisorClipboard(obterClipboardInternoParaVisor());
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
        if (e.target.closest('#btnAtualizarPreview') || e.target.closest('#previewAreaTransferencia') || e.target.closest('#btnDownloadXMouse') || e.target.closest('#avisoPermissaoClipboardInspector')) {
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
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: sel, html: '', formatado: false };
                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            chrome.storage.local.set({ ultimoClipboardInterno: window.__JUSGOV_ULTIMO_CLIPBOARD__ }).catch(() => { });
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

    /* Passo 4.7: Executar Bateria Automatizada de Auditoria (debug.js) na Aba Laboratório */
    adicionarOuvinteSeguro(btnExecutarAuditoriaDebug, 'click', async () => {
        if (typeof window.JusGovExecutarAuditoria === 'function' || typeof window.JusGovExecutarAuditoriaAsync === 'function') {
            exibirToast('Executando Auditoria... aguarde');
            btnExecutarAuditoriaDebug.disabled = true;
            btnExecutarAuditoriaDebug.textContent = 'Executando...';
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
                    painelResultadoAuditoria.textContent = relatorio.logTexto;
                    painelResultadoAuditoria.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                exibirToast(`Auditoria concluída: ${relatorio.aprovados}/${relatorio.total} testes aprovados!`);
                registrarMensagemDiretaNoVisorConsole('INFO', `Auditoria concluída: ${relatorio.aprovados}/${relatorio.total} testes aprovados.`);
            } catch (errAuditoria) {
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.textContent = '[ERRO AUDITORIA] ' + (errAuditoria && errAuditoria.message ? errAuditoria.message : String(errAuditoria));
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
                painelResultadoAuditoria.textContent = '[ERRO] Módulo debug.js não carregado.';
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
                    painelResultadoAuditoria.textContent = relatorio.logTexto;
                    painelResultadoAuditoria.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                exibirToast(`Fuzzing concluído: ${relatorio.aprovados}/${relatorio.total} aprovados!`);
                registrarMensagemDiretaNoVisorConsole('INFO', `Fuzzing (1s/T) concluído: ${relatorio.aprovados}/${relatorio.total} aprovados.`);
            } catch (errFuzz) {
                if (painelResultadoAuditoria) {
                    painelResultadoAuditoria.style.display = 'block';
                    painelResultadoAuditoria.textContent = '[ERRO FUZZING] ' + (errFuzz && errFuzz.message ? errFuzz.message : String(errFuzz));
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
                painelResultadoAuditoria.textContent = '[ERRO] Módulo debug.js não carregado.';
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
                if (changes.selecaoEditavelAtiva !== undefined && optSelecaoAutomaticaTextoEditavel) {
                    optSelecaoAutomaticaTextoEditavel.checked = (changes.selecaoEditavelAtiva.newValue !== false);
                }
                if (changes.modoPlaceholdersMinutasHtml !== undefined && selectModoPlaceholdersMinutasHtml) {
                    selectModoPlaceholdersMinutasHtml.value = changes.modoPlaceholdersMinutasHtml.newValue || 'placeholders';
                } else if (changes.placeholdersMinutasHtmlAtivo !== undefined && selectModoPlaceholdersMinutasHtml) {
                    selectModoPlaceholdersMinutasHtml.value = (changes.placeholdersMinutasHtmlAtivo.newValue !== false) ? 'placeholders' : 'desabilitado';
                }
                if (changes.colagemBotaoDireitoAtiva !== undefined && optColagemBotaoDireito) {
                    optColagemBotaoDireito.checked = Boolean(changes.colagemBotaoDireitoAtiva.newValue);
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
                    const novoSentido = changes.sentidoOrdenacaoGuias.newValue || 'dir_esq';
                    optSentidoOrdenacaoGuias.value = novoSentido;
                    if (optSentidoOrdenacaoGuiasSwitch) optSentidoOrdenacaoGuiasSwitch.checked = (novoSentido !== 'esq_dir');
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
                if (changes.validacaoMatematicaAtiva !== undefined && optValidacaoMatematicaAtiva) {
                    optValidacaoMatematicaAtiva.checked = (changes.validacaoMatematicaAtiva.newValue !== false);
                }
                if (changes.tempoFlashBorderMs !== undefined && optTempoFlashMs) {
                    optTempoFlashMs.value = String(normalizarTempoFlashMs(changes.tempoFlashBorderMs.newValue));
                    atualizarRotuloSliderFlash();
                }
                if (changes.corFlashBorder !== undefined && optCorFlashBorder) {
                    optCorFlashBorder.value = normalizarCorHex(changes.corFlashBorder.newValue);
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
                    const novoTempo = changes.tempoExibicaoAlertaMs.newValue !== undefined ? Number(changes.tempoExibicaoAlertaMs.newValue) : 3500;
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
            chrome.storage.local.get(['ultimoClipboardInterno'], (res) => {
                if (res && res.ultimoClipboardInterno) {
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = res.ultimoClipboardInterno;
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
        acionarLeituraClipboardComPrompt
    });
});
