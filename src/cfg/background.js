/* ==========================================================================
 * ARQUIVO: src/cfg/background.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/background.js
 * - Natureza: Service Worker Manifest V3 (Non-Persistent) — Ciclo de Vida e Despachante IPC
 * - Modulos Carregados via importScripts: cfg-defaults, lib-constantes, lib-block-addon,
 *   lib-verificadores, lib-geradores, lib-urls, lib-injecao, lib-config, mod-navegador,
 *   mod-manut, mod-produt.
 * - Responsabilidade Estrita (ARQ-01 / BP-06):
 *   Contem APENAS ciclo de vida do Service Worker, roteamento IPC (chrome.runtime.onMessage)
 *   e despachantes finos para listeners nativos do Chrome. Regras de negocio ficam
 *   exclusivamente nas bibliotecas (src/lib/) e modulos de dominio (src/mod-* /).
 * - Canais IPC (onMessage):
 *   * 'OBTER_JSON_ESTATICO' (serve perfis.json, interface.json, dados-forenses.json, regras-sistema.json)
 *   * 'forcarSincronizacaoNuvem'
 *   * Perfis (lib-config): 'OBTER_PERFIS', 'ALTERNAR_PERFIL', 'CRIAR_PERFIL', 'RENOMEAR_PERFIL', 'EXCLUIR_PERFIL', 'RESETAR_PERFIS'
 *   * Manutencao (mod-manut): 'EXECUTAR_AUTO_LIMPEZA_AGORA'
 *   * Produtividade (mod-produt): 'PING_ATIVIDADE_TRABALHO', 'OBTER_STATUS_TRABALHO', 'RESETAR_CONTADORES_TRABALHO', 'abrirGeminiLateral', 'abrirAssistenteIaLateral', 'ABRIR_PAINEL_F1_GEMINI'
 *   * Navegador (mod-navegador): 'TROCAR_GUIA_ANTERIOR', 'TROCAR_GUIA_PROXIMA', 'TROCAR_GUIA_ULTIMA_ATIVA', 'navegarAba', 'verificarOuAtivarAba', 'abrirNovaAba', 'baixarLink', 'registrarPaginaModificada', 'fecharGuiasDuplicadasAgora', 'ordenarGuiasAgora', 'ordenarGuiasPorCriterio', 'agruparDominioAgora', 'desagruparGuiasAgora', 'restaurarOrdemGuiasPadrao', 'descartarGuiasInativasAgora'
 *   * Injecao / Tab UX: 'garantirInjecaoSubframes', 'abrirPaginaAparenciaChrome', 'broadcastDeselecionarGeral'
 * - Regras / Secoes: Diretrizes 11/15/16, Seção 6.19 (debounce 350ms), Seção 6.47, Seção 6.64, ADR-011
 *
 * DIRETIVAS DE RECONSTRUCAO CLEAN-ROOM (COMENTARIOS PARA RECRIACAO INTEGRAL):
 * 1) IMPORTACAO TOLERANTE A FALHAS: importScripts carrega cada arquivo em try/catch individual
 *    e instancia as fachadas em self.JusGovInstancia* para permitir isolamento modular.
 * 2) ESTADO VOLATIL PROIBIDO: No MV3 o SW hiberna em ~30s. Nenhum historico critico fica
 *    apenas em RAM — configuracoes sao espelhadas em storage.session (lib-config) e historico
 *    de guias para Ctrl+Tab em storage.session (mod-navegador).
 * 3) STATIC ASSETS SEM WEB_ACCESSIBLE_RESOURCES: Os JSONs em src/cfg/ nao ficam expostos
 *    a sites externos (web_accessible_resources: []). Content Scripts requisitam via IPC
 *    'OBTER_JSON_ESTATICO' validado contra allowlist imutavel neste Service Worker.
 * ========================================================================== */

'use strict';

// =====================================================================
// SECAO 1: IMPORTACAO ISOLADA E INSTANCIACAO DAS FACHADAS
// =====================================================================
(function carregarScriptsComIsolamentoModular() {
    if (typeof importScripts !== 'function') return;
    const caminhosScripts = [
        './cfg-defaults.js',
        '../lib/lib-constantes-catalogo.js',
        '../lib/lib-constantes.js',
        '../lib/lib-base-modulo.js',
        '../lib/lib-block-addon.js',
        '../lib/lib-verificadores-docs.js',
        '../lib/lib-verificadores-boletos.js',
        '../lib/lib-verificadores.js',
        '../lib/lib-geradores.js',
        '../lib/lib-urls.js',
        '../lib/lib-injecao.js',
        '../lib/lib-ui-tela.js',
        '../lib/lib-config-helpers.js',
        '../lib/lib-config-perfis.js',
        '../lib/lib-config-exportacao.js',
        '../lib/lib-config-icone.js',
        '../lib/lib-config.js',
        '../mod-navegador/navegador-janela-unica.js',
        '../mod-navegador/navegador-urls-normalizacao.js',
        '../mod-navegador/navegador-anti-duplicacao.js',
        '../mod-navegador/navegador-ordenacao-dominios.js',
        '../mod-navegador/navegador-ordenacao-grupos.js',
        '../mod-navegador/navegador-ordenacao.js',
        '../mod-navegador/navegador-descarte.js',
        '../mod-navegador/navegador-historico-abas.js',
        '../mod-navegador/navegador-acoes-abas.js',
        '../mod-navegador/mod-navegador.js',
        '../mod-manut/mod-manut.js',
        '../mod-produt/produt-bem-estar-cards.js',
        '../mod-produt/lib-produt-bem-estar.js',
        '../mod-produt/produt-resumo-ui.js',
        '../mod-produt/produt-sync-nuvem.js',
        '../mod-produt/produt-barra-injecao.js',
        '../mod-produt/produt-estado-trabalho.js',
        '../mod-produt/produt-motor-descanso.js',
        '../mod-produt/produt-motor-flexivel.js',
        '../mod-produt/produt-motor-ciclos.js',
        '../mod-produt/produt-barra-geometria.js',
        '../mod-produt/mod-produt.js',
        '../mod-produt/produt-ipc.js',
        '../mod-automate/automate-contextos.js',
        '../mod-automate/automate-barra-pje.js',
        '../mod-automate/mod-automate.js',
        './lib-background.js'
    ];
    for (let i = 0; i < caminhosScripts.length; i++) {
        try { importScripts(caminhosScripts[i]); } catch (_) { }
    }
})();

function instanciarModulo(nomeClasse, args, nomeGlobal) {
    try {
        if (typeof self !== 'undefined' && typeof self[nomeClasse] === 'function') {
            const inst = args !== undefined ? new self[nomeClasse](args) : new self[nomeClasse]();
            if (nomeGlobal) self[nomeGlobal] = inst;
            return inst;
        }
    } catch (_) { }
    return null;
}

const instanciaVerificadores = instanciarModulo('JusGovVerificadores', undefined, 'JusGovInstanciaVerificadores');
const instanciaGeradores = instanciarModulo('JusGovGeradores', undefined, 'JusGovInstanciaGeradores');
const instanciaUrls = instanciarModulo('JusGovUrls', undefined, 'JusGovInstanciaUrls');
const instanciaInjecao = instanciarModulo('JusGovInjecaoScripts', { urls: instanciaUrls }, 'JusGovInstanciaInjecao');
const instanciaUiTela = instanciarModulo('JusGovLibUiTela', undefined, 'JusGovInstanciaUiTela');
const instanciaModuloNavegador = instanciarModulo('JusGovModuloNavegador', undefined, 'JusGovInstanciaNavegador');

const obterConfiguracoesGerais = async () => (
    instanciaConfig ? instanciaConfig.obterConfiguracoesGerais(chrome) : {}
);

const instanciaModuloManutencao = instanciarModulo(
    'JusGovModuloManutencao',
    { obterConfiguracoes: () => obterConfiguracoesGerais() },
    'JusGovInstanciaManutencao'
);
const instanciaModuloProdutividade = instanciarModulo(
    'JusGovModuloProdutividade',
    { obterConfiguracoes: () => obterConfiguracoesGerais() },
    'JusGovInstanciaProdutividade'
);
const instanciaModuloAutomate = instanciarModulo(
    'JusGovModuloAutomate',
    { ativo: false },
    'JusGovInstanciaAutomate'
);
const instanciaConfig = instanciarModulo(
    'JusGovConfiguracoes',
    { urls: instanciaUrls, injecao: instanciaInjecao, navegador: instanciaModuloNavegador },
    'JusGovInstanciaConfig'
);

const sincronizarEstado = async () => {
    const cfg = instanciaConfig
        ? await instanciaConfig.sincronizarEstado(chrome, {
            urls: instanciaUrls,
            injecao: instanciaInjecao,
            navegador: instanciaModuloNavegador
        })
        : null;
    if (instanciaModuloProdutividade && cfg) {
        if (!cfg.pomodoroAtivo) {
            instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas().catch(() => { });
        }
        instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, 'todas').catch(() => { });
    }
    return cfg;
};

const garantirConfigModuloNavegador = async () => {
    if (!instanciaModuloNavegador) return {};
    if (instanciaModuloNavegador.configuracoes && Object.keys(instanciaModuloNavegador.configuracoes).length > 0) {
        return instanciaModuloNavegador.configuracoes;
    }
    let cfg = await obterConfiguracoesGerais();
    if (!cfg || Object.keys(cfg).length === 0) {
        cfg = await sincronizarEstado();
    }
    if (cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0) {
        instanciaModuloNavegador.atualizarConfiguracoes(cfg);
    }
    return cfg || {};
};

// =====================================================================
// SECAO 2: INSTANCIACAO DOS ROTEADORES MODULARES (PRODUT-IPC E LIB-BACKGROUND)
// =====================================================================
const instanciaProdutIpc = instanciarModulo(
    'JusGovProdutIpcRouter',
    {
        produtividade: instanciaModuloProdutividade,
        obterConfiguracoesGerais,
        configMgr: instanciaConfig,
        navegador: instanciaModuloNavegador
    },
    'JusGovInstanciaProdutIpc'
);

const instanciaLibBackground = instanciarModulo(
    'JusGovLibBackground',
    {
        urls: instanciaUrls,
        injecao: instanciaInjecao,
        navegador: instanciaModuloNavegador,
        config: instanciaConfig,
        manutencao: instanciaModuloManutencao,
        produtividade: instanciaModuloProdutividade,
        automate: instanciaModuloAutomate,
        uiTela: instanciaUiTela,
        obterConfiguracoesGerais,
        sincronizarEstado
    },
    'JusGovInstanciaLibBackground'
);

const ALARMES_SW = (self.JusGovLibBackground && self.JusGovLibBackground.ALARMES) || {
    DESCARTE_RAM: 'jusgov-descarte-ram',
    SYNC_NUVEM: 'jusgov-sync-nuvem-debounced',
    AUTO_LIMPEZA_5M: 'JUSGOV_AUTO_LIMPEZA_5M',
    TRABALHO_TICK: 'JUSGOV_TICK_TRABALHO',
    SYNC_STATS_30M: 'JUSGOV_SYNC_STATS_30M'
};
const NOME_ALARME_DESCARTE_RAM = ALARMES_SW.DESCARTE_RAM;
const NOME_ALARME_SYNC_NUVEM = ALARMES_SW.SYNC_NUVEM;
const NOME_ALARME_AUTO_LIMPEZA_5M = ALARMES_SW.AUTO_LIMPEZA_5M;
const NOME_ALARME_TRABALHO_TICK = ALARMES_SW.TRABALHO_TICK;
const NOME_ALARME_SYNC_STATS_30M = ALARMES_SW.SYNC_STATS_30M;

const garantirAlarmePeriodico = (nome, period) => instanciaLibBackground && instanciaLibBackground.garantirAlarmePeriodico(nome, period, chrome);
const sincronizarAoSairNavegador = () => instanciaLibBackground ? instanciaLibBackground.sincronizarAoSairNavegador(chrome) : Promise.resolve();
const executarRecargaLimpaExtensao = (motivo) => instanciaLibBackground ? instanciaLibBackground.executarRecargaLimpaExtensao(motivo, chrome) : Promise.resolve();
const verificarBootFrioOuMudancaVersaoSw = () => instanciaLibBackground ? instanciaLibBackground.verificarBootFrioOuMudancaVersaoSw(sincronizarEstado, chrome) : Promise.resolve();

chrome.runtime.onInstalled.addListener(async (detalhes) => {
    try {
        if (chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ jusgovSessaoEntradaTs: Date.now() });
        }
    } catch (_) { }
    if (instanciaModuloProdutividade && typeof instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir === 'function') {
        try { await instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir(chrome); } catch (_) { }
    }
    await executarRecargaLimpaExtensao(`onInstalled:${(detalhes && detalhes.reason) || 'reload'}`);
    await sincronizarEstado();
    if (instanciaModuloNavegador) {
        try { await instanciaModuloNavegador.inicializarSessaoAbas(chrome); } catch (_) { }
    }
    if (instanciaModuloManutencao) {
        try { await instanciaModuloManutencao.inicializarRastreamentoCookies(); } catch (_) { }
    }
    if (instanciaConfig) {
        await instanciaConfig.sincronizarMenusContexto(chrome);
    }
    try {
        if (detalhes && detalhes.reason === 'install' && chrome.tabs && typeof chrome.tabs.create === 'function') {
            const locOnb = (chrome.storage && chrome.storage.local)
                ? await chrome.storage.local.get(['jusgovOnboardingConcluido']).catch(() => ({}))
                : {};
            if (!locOnb || !locOnb.jusgovOnboardingConcluido) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('src/cfg/onboarding.html'),
                    active: true
                }).catch(() => { });
            }
        }
    } catch (_) { }
});

chrome.runtime.onStartup.addListener(async () => {
    try {
        if (chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ jusgovSessaoEntradaTs: Date.now() });
        }
    } catch (_) { }
    if (instanciaModuloProdutividade && typeof instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir === 'function') {
        try { await instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir(chrome); } catch (_) { }
    }
    await executarRecargaLimpaExtensao('onStartup');
    await sincronizarEstado();
    if (instanciaModuloNavegador) {
        try { await instanciaModuloNavegador.inicializarSessaoAbas(chrome); } catch (_) { }
    }
    try {
        if (instanciaModuloProdutividade) await instanciaModuloProdutividade.registrarAtividadeTrabalho();
        if (instanciaModuloManutencao) await instanciaModuloManutencao.inicializarRastreamentoCookies();
        if (typeof chrome !== 'undefined' && chrome.alarms) {
            try { await chrome.alarms.clear('JUSGOV_AUTO_LIMPEZA_1M'); } catch (_) { }
            try { await chrome.alarms.clear('JUSGOV_AUTO_LIMPEZA_15M'); } catch (_) { }
            chrome.alarms.create(NOME_ALARME_AUTO_LIMPEZA_5M, { delayInMinutes: 5 });
        }
    } catch (_) { }
});

if (chrome.runtime && chrome.runtime.onSuspend) {
    chrome.runtime.onSuspend.addListener(() => {
        sincronizarAoSairNavegador().catch(() => { });
    });
}

if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
        if (command === 'switch-to-last-tab' && instanciaModuloNavegador) {
            instanciaModuloNavegador.alternarParaUltimaAbaAtiva(null, chrome).catch(() => { });
        }
    });
}


if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener(async (info) => {
        if (info.menuItemId === 'configurar-extensao') {
            chrome.runtime.openOptionsPage();
        } else if (info.menuItemId === 'abrir-painel-extensao') {
            chrome.tabs.create({ url: 'https://github.com/smarca/AddonChrome-GovBR.git', active: true });
        }
    });
}

chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'sync') {
        if (!instanciaConfig || instanciaConfig.houveMudancaDeConfiguracao(changes)) {
            await sincronizarEstado();
        }
        if (instanciaModuloProdutividade && (
            changes.tempoTrabalhoCorridoAtivo || changes.tempoTrabalhoCorridoHoras ||
            changes.tempoTrabalhoAtivoAtivo || changes.tempoTrabalhoAtivoHoras ||
            changes.pomodoroAtivo || changes.pomodoroProporcao || changes.pomodoroFocoMinutos ||
            changes.pomodoroCiclos || changes.pomodoroPausasAutomaticas || changes.pomodoroModoAviso ||
            changes.pomodoroEstiloMinipopup || changes.pomodoroBeepConclusaoAtivo || changes.pomodoroBeepIntensidade
        )) {
            (async () => {
                if (changes.pomodoroEstiloMinipopup) {
                    const estNovo = changes.pomodoroEstiloMinipopup.newValue;
                    const ehMicro = (estNovo === 'micro');
                    const nivel = (estNovo === 'normal') ? 1 : ((estNovo === 'expandido') ? 2 : 0);
                    await instanciaModuloProdutividade.atualizarEstadoGlobalBarraPomodoro({
                        minimizadoMicro: ehMicro,
                        ...(ehMicro ? {} : { minimizadoDescansoAdiadoTs: 0 }),
                        nivelDetalhe: nivel
                    });
                }
                const cfg = await obterConfiguracoesGerais();
                if (!cfg || !cfg.pomodoroAtivo) {
                    await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                }
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, 'todas');
            })().catch(() => { });
        }
    } else if (namespace === 'local') {
        if ((changes.perfilAtivoId || changes.jusgovConfigSyncPendente) && instanciaModuloProdutividade) {
            obterConfiguracoesGerais().then(async (cfg) => {
                if (!cfg || !cfg.pomodoroAtivo) {
                    await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                }
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, 'todas');
            }).catch(() => { });
        }
    }
});

// =====================================================================
// SECAO 5: ROTEADOR DE MENSAGENS IPC (DESPACHANTE FINO PARA MODULOS)
// =====================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.acao !== 'string') return false;
    if (instanciaProdutIpc && instanciaProdutIpc.tratarMensagem(msg, sender, sendResponse, chrome)) {
        return true;
    }
    if (instanciaLibBackground && instanciaLibBackground.tratarMensagemGeral(msg, sender, sendResponse, chrome)) {
        return true;
    }
    return false;
});

// =====================================================================
// SECAO 6: DESPACHANTES NATIVOS (WINDOWS, TABS, WEBNAVIGATION, COOKIES, ALARMS)
// =====================================================================
if (chrome.windows && chrome.windows.onCreated) {
    chrome.windows.onCreated.addListener(async (janela) => {
        try {
            await garantirConfigModuloNavegador();
            if (instanciaModuloNavegador) await instanciaModuloNavegador.tratarNovaJanela(janela, chrome);
        } catch (_) { }
    });
}

if (chrome.windows && chrome.windows.onRemoved) {
    chrome.windows.onRemoved.addListener(async () => {
        try {
            if (!chrome.windows || typeof chrome.windows.getAll !== 'function') return;
            const janelas = await chrome.windows.getAll({});
            if (Array.isArray(janelas) && janelas.length === 0) {
                await sincronizarAoSairNavegador();
                if (instanciaModuloManutencao) {
                    await instanciaModuloManutencao.executarAutoLimpezaCacheECookies(false, false, obterConfiguracoesGerais);
                }
            }
        } catch (_) { }
    });
}

if (chrome.windows && chrome.windows.onFocusChanged) {
    chrome.windows.onFocusChanged.addListener((winId) => {
        if (winId !== chrome.windows.WINDOW_ID_NONE && instanciaModuloProdutividade) {
            Promise.all([
                instanciaModuloProdutividade.registrarAtividadeTrabalho(Date.now(), 'movimento'),
                obterConfiguracoesGerais()
            ]).then(([, cfg]) => {
                return instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg);
            }).catch(() => { });
        }
    });
}

const ultimaGuiaAtivaPorJanela = new Map();
if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        if (!activeInfo || !activeInfo.tabId || !activeInfo.windowId) return;
        chrome.tabs.get(activeInfo.tabId).then((t) => {
            if (t && t.id) {
                ultimaGuiaAtivaPorJanela.set(activeInfo.windowId, {
                    tabId: t.id,
                    groupId: (typeof t.groupId === 'number') ? t.groupId : -1
                });
            }
        }).catch(() => { });
    });
}

if (chrome.tabGroups && chrome.tabGroups.onUpdated) {
    chrome.tabGroups.onUpdated.addListener((group) => {
        if (group && group.collapsed === true) {
            obterConfiguracoesGerais().then(async (cfg) => {
                if (cfg && cfg.agruparGuiasAutomatico !== false) {
                    const abasAtivasNoGrupo = await chrome.tabs.query({ groupId: group.id, active: true }).catch(() => []);
                    const ult = ultimaGuiaAtivaPorJanela.get(group.windowId);
                    const estavaAtivoNoGrupo = (Array.isArray(abasAtivasNoGrupo) && abasAtivasNoGrupo.length > 0) ||
                        Boolean(ult && ult.groupId === group.id);
                    if (estavaAtivoNoGrupo) {
                        await chrome.tabGroups.update(group.id, { collapsed: false }).catch(() => { });
                        if (ult && ult.groupId === group.id && ult.tabId) {
                            await chrome.tabs.update(ult.tabId, { active: true }).catch(() => { });
                        }
                    }
                }
            }).catch(() => { });
        }
    });
}

if (chrome.tabs && chrome.tabs.onCreated) {
    chrome.tabs.onCreated.addListener(async (tab) => {
        try {
            if (tab && tab.id && (tab.url === 'about:blank' || !tab.url) && instanciaInjecao) {
                instanciaInjecao.agendarInjecaoSeguraNaAba(tab.id, null, chrome);
            }
            await garantirConfigModuloNavegador();
            if (instanciaModuloNavegador) await instanciaModuloNavegador.tratarNovaAba(tab, chrome);
        } catch (_) { }
    });
}

if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        try {
            await garantirConfigModuloNavegador();
            if (instanciaModuloNavegador) await instanciaModuloNavegador.tratarAbaAtualizada(tabId, changeInfo, tab, chrome);
            const url = (tab && tab.url) || (changeInfo && changeInfo.url) || '';
            if (!url) return;
            if (instanciaModuloManutencao && (changeInfo.url || changeInfo.status === 'complete')) {
                instanciaModuloManutencao.registrarAcessoUrl(url).catch(() => { });
            }
            if (/^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(url) || (/^about:/i.test(url) && url !== 'about:blank')) return;
            const config = await obterConfiguracoesGerais();
            if (instanciaInjecao) {
                if (config.modoTurbo !== 'desligado') instanciaInjecao.agendarInjecaoSeguraNaAba(tabId, null, chrome);
                if (changeInfo.status === 'complete') {
                    instanciaInjecao.injetarCssAmpuletasNaAba(tabId, url, config, chrome, instanciaUrls).catch(() => { });
                    if (instanciaModuloProdutividade && tab.active) {
                        instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(config, null, tabId).catch(() => { });
                    }
                }
            }
        } catch (_) { }
    });
}

if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        if (instanciaModuloNavegador) {
            instanciaModuloNavegador.registrarAbaAtivadaHistorico(activeInfo, chrome).catch(() => { });
            garantirConfigModuloNavegador().then(() => {
                if (typeof instanciaModuloNavegador.tratarAbaAtivada === 'function') {
                    return instanciaModuloNavegador.tratarAbaAtivada(activeInfo, chrome);
                }
                return null;
            }).catch(() => { });
        }
        if (instanciaModuloProdutividade) {
            Promise.all([
                instanciaModuloProdutividade.registrarAtividadeTrabalho(Date.now(), 'movimento'),
                obterConfiguracoesGerais()
            ]).then(([, cfg]) => {
                if (activeInfo && activeInfo.tabId) {
                    return instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, activeInfo.tabId);
                }
                return null;
            }).catch(() => { });
        }
        if (activeInfo && activeInfo.tabId && chrome.tabs.get) {
            chrome.tabs.get(activeInfo.tabId, (tab) => {
                if (chrome.runtime && chrome.runtime.lastError) return;
                if (tab && (tab.url === 'about:blank' || !tab.url) && instanciaInjecao) {
                    instanciaInjecao.agendarInjecaoSeguraNaAba(activeInfo.tabId, null, chrome);
                }
                if (instanciaModuloManutencao && tab && tab.url) {
                    instanciaModuloManutencao.registrarAcessoUrl(tab.url).catch(() => { });
                }
            });
        }
    });
}

if (chrome.tabs && chrome.tabs.onMoved) {
    chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
        try {
            await garantirConfigModuloNavegador();
            if (instanciaModuloNavegador) {
                await instanciaModuloNavegador.tratarAbaMovida(tabId, moveInfo, chrome);
            }
        } catch (_) { }
    });
}

if (chrome.tabs && chrome.tabs.onAttached) {
    chrome.tabs.onAttached.addListener((tabId) => {
        if (instanciaModuloProdutividade && tabId) {
            obterConfiguracoesGerais().then((cfg) => {
                return instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, tabId);
            }).catch(() => { });
        }
    });
}

if (chrome.tabs && chrome.tabs.onRemoved) {
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
        try {
            await garantirConfigModuloNavegador();
            if (instanciaModuloNavegador) {
                instanciaModuloNavegador.removerAbaHistorico(tabId, removeInfo, chrome).catch(() => { });
                instanciaModuloNavegador.tratarAbaRemovida(tabId, chrome);
            }
            if (instanciaInjecao) instanciaInjecao.limparDebounceAba(tabId);
        } catch (_) { }
    });
}

if (typeof chrome !== 'undefined' && chrome.webNavigation) {
    if (chrome.webNavigation.onBeforeNavigate) {
        const idExtensao = (chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : '';
        const prefixoExtensao = idExtensao ? `chrome-extension://${idExtensao}/` : '';
        if (prefixoExtensao) {
            chrome.webNavigation.onBeforeNavigate.addListener((details) => {
                try {
                    if (!details || !details.url || !details.tabId || details.frameId !== 0) return;
                    if (self.JusGovBlockAddon && typeof self.JusGovBlockAddon.rotearUrlNavegacao === 'function') {
                        const destino = self.JusGovBlockAddon.rotearUrlNavegacao(details.url, prefixoExtensao);
                        if (destino && destino !== details.url) chrome.tabs.update(details.tabId, { url: destino });
                    }
                } catch (_) { }
            }, { url: [{ urlPrefix: prefixoExtensao }] });
        }
    }

    const garantirInjecaoEmFrameNavegado = (fase) => async (details) => {
        try {
            if (!details || !details.tabId || !instanciaInjecao) return;
            if (details.url && (/^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(details.url) || (/^about:/i.test(details.url) && details.url !== 'about:blank'))) return;
            const config = await obterConfiguracoesGerais();
            if (config.modoTurbo !== 'desligado') {
                const frameIds = (typeof details.frameId === 'number' && details.frameId > 0) ? [details.frameId] : null;
                instanciaInjecao.agendarInjecaoSeguraNaAba(details.tabId, frameIds, chrome, fase);
            }
        } catch (_) { }
    };
    if (chrome.webNavigation.onCommitted) chrome.webNavigation.onCommitted.addListener(garantirInjecaoEmFrameNavegado('committed'));
    if (chrome.webNavigation.onDOMContentLoaded) chrome.webNavigation.onDOMContentLoaded.addListener(garantirInjecaoEmFrameNavegado('dom'));
    if (chrome.webNavigation.onCompleted) chrome.webNavigation.onCompleted.addListener(garantirInjecaoEmFrameNavegado('completed'));
}

if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.onChanged) {
    chrome.cookies.onChanged.addListener((changeInfo) => {
        if (instanciaModuloManutencao && typeof instanciaModuloManutencao.tratarCookieAlterado === 'function') {
            instanciaModuloManutencao.tratarCookieAlterado(changeInfo).catch(() => { });
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
    try {
        garantirAlarmePeriodico(NOME_ALARME_DESCARTE_RAM, 5);
        garantirAlarmePeriodico(NOME_ALARME_TRABALHO_TICK, 1);
        garantirAlarmePeriodico(NOME_ALARME_SYNC_STATS_30M, 30);
        chrome.alarms.onAlarm.addListener(async (alarme) => {
            if (!alarme || !alarme.name) return;
            try {
                if (alarme.name === NOME_ALARME_DESCARTE_RAM && instanciaModuloNavegador) {
                    await instanciaModuloNavegador.tratarIntervaloDescarte(chrome);
                } else if (alarme.name === NOME_ALARME_SYNC_NUVEM && instanciaConfig) {
                    await instanciaConfig.executarSincronizacaoNuvemCoalescida(chrome, {
                        urls: instanciaUrls, injecao: instanciaInjecao, navegador: instanciaModuloNavegador
                    });
                } else if (alarme.name === NOME_ALARME_SYNC_STATS_30M && instanciaModuloProdutividade) {
                    if (typeof instanciaModuloProdutividade.sincronizarEstatisticasPeriodicoNuvem === 'function') {
                        await instanciaModuloProdutividade.sincronizarEstatisticasPeriodicoNuvem(chrome);
                    }
                    const cfgAtual = await obterConfiguracoesGerais();
                    await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfgAtual);
                } else if (alarme.name === NOME_ALARME_AUTO_LIMPEZA_5M && instanciaModuloManutencao) {
                    await instanciaModuloManutencao.executarAutoLimpezaCacheECookies(false, false, obterConfiguracoesGerais);
                } else if (alarme.name === NOME_ALARME_TRABALHO_TICK && instanciaModuloProdutividade) {
                    await instanciaModuloProdutividade.processarTickTrabalho(obterConfiguracoesGerais);
                }
            } catch (err) {
                registrarErroSw(`onAlarm:${alarme.name}`, err);
            }
        });
    } catch (err) {
        registrarErroSw('setupAlarms', err);
    }
}

verificarBootFrioOuMudancaVersaoSw().catch(() => { });
