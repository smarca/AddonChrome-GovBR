/* ==========================================================================
 * Nome do arquivo: background.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
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
        '../lib/lib-constantes.js',
        '../lib/lib-block-addon.js',
        '../lib/lib-verificadores.js',
        '../lib/lib-geradores.js',
        '../lib/lib-urls.js',
        '../lib/lib-injecao.js',
        '../lib/lib-config.js',
        '../mod-navegador/navegador-janela-unica.js',
        '../mod-navegador/navegador-anti-duplicacao.js',
        '../mod-navegador/navegador-ordenacao.js',
        '../mod-navegador/navegador-descarte.js',
        '../mod-navegador/mod-navegador.js',
        '../mod-manut/mod-manut.js',
        '../mod-produt/mod-produt.js'
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
// SECAO 2: SERVIDOR INTERNO DE JSONS ESTATICOS (IPC SEM WEB_ACCESSIBLE_RESOURCES)
// =====================================================================
const ARQUIVOS_JSON_ESTATICOS_PERMITIDOS = Object.freeze({
    'perfis.json': 'src/cfg/perfis.json',
    'interface.json': 'src/cfg/interface.json',
    'dados-forenses.json': 'src/cfg/dados-forenses.json',
    'regras-sistema.json': 'src/cfg/regras-sistema.json'
});
const cacheJsonEstaticoSw = new Map();

function registrarErroSw(origem, erro) {
    if (typeof self !== 'undefined' && self.__JUSGOV_DEBUG_SW__ === true && typeof console !== 'undefined' && console.warn) {
        console.warn(`[JusGovBR SW:${origem}]`, erro && erro.message ? erro.message : erro);
    }
}

async function obterJsonEstaticoDoPacote(nomeArquivo) {
    const caminhoRel = ARQUIVOS_JSON_ESTATICOS_PERMITIDOS[String(nomeArquivo || '')];
    if (!caminhoRel) return null;
    if (cacheJsonEstaticoSw.has(caminhoRel)) {
        return cacheJsonEstaticoSw.get(caminhoRel);
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function' && typeof fetch === 'function') {
        try {
            const resp = await fetch(chrome.runtime.getURL(caminhoRel));
            if (resp && resp.ok) {
                const txt = await resp.text();
                const dados = (self.JusGovCfgDefaults && typeof self.JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                    ? self.JusGovCfgDefaults.parsearJsonComComentarios(txt)
                    : JSON.parse(String(txt || '').replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim());
                cacheJsonEstaticoSw.set(caminhoRel, dados);
                return dados;
            }
        } catch (err) {
            registrarErroSw('obterJsonEstaticoDoPacote', err);
        }
    }
    return null;
}

// =====================================================================
// SECAO 3: ALARMES MV3 E SINCRONIZACAO COALESCIDA
// =====================================================================
const NOME_ALARME_DESCARTE_RAM = 'jusgov-descarte-ram';
const NOME_ALARME_SYNC_NUVEM = 'jusgov-sync-nuvem-debounced';
const NOME_ALARME_AUTO_LIMPEZA_5M = 'JUSGOV_AUTO_LIMPEZA_5M';
const NOME_ALARME_TRABALHO_TICK = 'JUSGOV_TICK_TRABALHO';
const NOME_ALARME_SYNC_STATS_30M = 'JUSGOV_SYNC_STATS_30M';

function garantirAlarmePeriodico(nome, periodInMinutes) {
    if (typeof chrome === 'undefined' || !chrome.alarms || !chrome.alarms.get) return;
    try {
        chrome.alarms.get(nome, (existente) => {
            if (chrome.runtime && chrome.runtime.lastError) return;
            if (!existente) {
                chrome.alarms.create(nome, { periodInMinutes });
            }
        });
    } catch (err) {
        registrarErroSw(`garantirAlarmePeriodico:${nome}`, err);
    }
}

function agendarSincronizacaoNuvemDebounced(minutosAtraso = 5) {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
        try {
            chrome.alarms.create(NOME_ALARME_SYNC_NUVEM, { delayInMinutes: Math.max(1, Number(minutosAtraso) || 5) });
            return;
        } catch (err) {
            registrarErroSw('agendarSincronizacaoNuvemDebounced', err);
        }
    }
    if (instanciaConfig && typeof instanciaConfig.executarSincronizacaoNuvemCoalescida === 'function') {
        instanciaConfig.executarSincronizacaoNuvemCoalescida(chrome, {
            urls: instanciaUrls, injecao: instanciaInjecao, navegador: instanciaModuloNavegador
        }).catch((err) => registrarErroSw('syncFallback', err));
    }
}

async function sincronizarAoSairNavegador() {
    try {
        if (instanciaConfig && typeof instanciaConfig.executarSincronizacaoNuvemCoalescida === 'function') {
            await instanciaConfig.executarSincronizacaoNuvemCoalescida(chrome, {
                urls: instanciaUrls, injecao: instanciaInjecao, navegador: instanciaModuloNavegador
            });
        }
    } catch (_) { }
    try {
        if (instanciaModuloProdutividade && typeof instanciaModuloProdutividade.salvarResumoProdutividadeNuvemAoSair === 'function') {
            await instanciaModuloProdutividade.salvarResumoProdutividadeNuvemAoSair(chrome, { encerradoLimpo: true });
        }
    } catch (_) { }
}

// =====================================================================
// SECAO 4: CICLO DE VIDA DO SERVICE WORKER E LISTENERS NATIVOS
// =====================================================================
chrome.runtime.onInstalled.addListener(async () => {
    try {
        if (chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ jusgovSessaoEntradaTs: Date.now() });
        }
    } catch (_) { }
    if (instanciaModuloProdutividade && typeof instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir === 'function') {
        try { await instanciaModuloProdutividade.recuperarResumoProdutividadeNuvemAoAbrir(chrome); } catch (_) { }
    }
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

if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(() => {
        if (instanciaConfig) instanciaConfig.tratarCliqueIconeExtensao(chrome);
    });
}

if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener(async (info) => {
        if (info.menuItemId === 'toggle-comportamento-icone') {
            await chrome.storage.sync.set({ comportamentoCliqueIcone: info.checked ? 'acoes_rapidas' : 'popup' });
        } else if (info.menuItemId === 'configurar-extensao') {
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
        if (changes.comportamentoCliqueIcone && chrome.contextMenus) {
            chrome.contextMenus.update('toggle-comportamento-icone', {
                checked: changes.comportamentoCliqueIcone.newValue === 'acoes_rapidas'
            }).catch(() => { });
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
                    const nivel = (estNovo === 'normal') ? 1 : ((estNovo === 'expandido') ? 2 : 0);
                    await instanciaModuloProdutividade.atualizarEstadoGlobalBarraPomodoro({ nivelDetalhe: nivel });
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
// SECAO 5: ROTEADOR DE MENSAGENS IPC (DESPACHANTE PARA MODULOS)
// =====================================================================
const ACOES_PERFIL = new Set([
    'OBTER_PERFIS', 'ALTERNAR_PERFIL', 'CRIAR_PERFIL', 'RENOMEAR_PERFIL', 'EXCLUIR_PERFIL', 'RESETAR_PERFIS'
]);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.acao !== 'string') return false;
    const acao = msg.acao;
    const depsConfig = { urls: instanciaUrls, injecao: instanciaInjecao, navegador: instanciaModuloNavegador };

    if (acao === 'OBTER_JSON_ESTATICO') {
        obterJsonEstaticoDoPacote(msg.arquivo)
            .then((dados) => sendResponse({ ok: Boolean(dados), dados }))
            .catch(() => sendResponse({ ok: false, dados: null }));
        return true;
    }

    if (acao === 'forcarSincronizacaoNuvem' || acao === 'AGENDAR_SYNC_NUVEM_DIFERIDO') {
        (async () => {
            let cfgAtual = null;
            if (instanciaConfig && msg.payload && typeof msg.payload === 'object' && typeof instanciaConfig.aplicarConfigLocalEAgendarSync === 'function') {
                const resAplic = await instanciaConfig.aplicarConfigLocalEAgendarSync(msg.payload, chrome, depsConfig);
                cfgAtual = (resAplic && resAplic.config) || await obterConfiguracoesGerais();
            } else {
                cfgAtual = await sincronizarEstado();
            }
            if (instanciaModuloProdutividade) {
                if (!cfgAtual || !cfgAtual.pomodoroAtivo) {
                    await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                }
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfgAtual, null, 'todas');
            }
            agendarSincronizacaoNuvemDebounced(5);
            return { ok: true, agendado: true, atrasoMinutos: 5 };
        })().then((r) => sendResponse(r)).catch(() => sendResponse({ ok: false }));
        return true;
    }

    if (ACOES_PERFIL.has(acao)) {
        if (!instanciaConfig) { sendResponse({ ok: false }); return false; }
        instanciaConfig.gerenciarRequisicaoPerfil(msg, chrome, depsConfig)
            .then((res) => sendResponse(res || { ok: false }))
            .catch((err) => sendResponse({ ok: false, erro: err ? err.message : 'Erro no perfil.' }));
        return true;
    }

    /* Manutencao (mod-manut) */
    if (acao === 'EXECUTAR_AUTO_LIMPEZA_AGORA') {
        if (!instanciaModuloManutencao) { sendResponse({ ok: false }); return false; }
        instanciaModuloManutencao.executarAutoLimpezaCacheECookies(true, false, obterConfiguracoesGerais)
            .then((res) => sendResponse(res))
            .catch(() => sendResponse({ ok: false }));
        return true;
    }

    /* Produtividade & IA F1 (mod-produt) */
    if (acao === 'PING_ATIVIDADE_TRABALHO' || acao === 'OBTER_STATUS_TRABALHO' || acao === 'RESETAR_CONTADORES_TRABALHO' ||
        acao === 'FECHAR_BARRA_POMODORO_GLOBAL' || acao === 'DISPENSAR_POMODORO_DESCANSO_CICLO' ||
        acao === 'SALVAR_POSICAO_BARRA_POMODORO' || acao === 'ATUALIZAR_ESTADO_BARRA_POMODORO' ||
        acao === 'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL' || acao === 'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO' ||
        acao === 'CONFIRMAR_DESCANSO_INICIADO_POMODORO' || acao === 'SINCRONIZAR_DESCANSO_CONCLUIDO_POMODORO' ||
        acao === 'SINCRONIZAR_GUIA_ATIVA_POMODORO') {
        if (!instanciaModuloProdutividade) { sendResponse({ ok: false }); return false; }
        let op;
        const montarPayloadStatusTrabalho = async (senderMsg, executarReconciliacao = true) => {
            const [estado, cfg, metaLoc, estadoBarraGlobal] = await Promise.all([
                instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje(),
                obterConfiguracoesGerais(),
                (chrome.storage && chrome.storage.local)
                    ? chrome.storage.local.get(['jusgovProdNuvemMeta']).catch(() => ({}))
                    : Promise.resolve({}),
                instanciaModuloProdutividade.obterEstadoGlobalBarraPomodoro()
            ]);
            const nuvemMeta = (metaLoc && metaLoc.jusgovProdNuvemMeta) ? metaLoc.jusgovProdNuvemMeta : null;
            const agoraSync = Date.now();
            if (executarReconciliacao) {
                const rec = instanciaModuloProdutividade.reconciliarEstadoPomodoroAoVivo(estado, agoraSync, cfg);
                if (rec && rec.alterouEstado) {
                    if (chrome.storage && chrome.storage.local) {
                        await chrome.storage.local.set({ jusgovTrabalhoEstado: estado }).catch(() => { });
                    }
                    if (rec.iniciouDescansoReal || rec.concluiuDescanso) {
                        await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                    }
                    await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, estado);
                }
            }
            let permitirBeep = false;
            const senderTab = (senderMsg && senderMsg.tab) ? senderMsg.tab : null;
            if (senderTab) {
                if (chrome.windows && typeof chrome.windows.getLastFocused === 'function') {
                    const winFoc = await chrome.windows.getLastFocused().catch(() => null);
                    permitirBeep = Boolean(!winFoc || !winFoc.id || senderTab.windowId === winFoc.id);
                } else {
                    permitirBeep = true;
                }
            }
            instanciaModuloProdutividade.aplicarIndicadoresChromeAction(cfg, estado, nuvemMeta, agoraSync);
            const snap = instanciaModuloProdutividade.construirSnapshotExternoPomodoro(estado, cfg, nuvemMeta, estadoBarraGlobal, agoraSync, permitirBeep);
            return {
                ok: true,
                agoraServidor: snap.agoraServidor,
                estado,
                config: cfg,
                nuvemMeta,
                resumoPomodoro: snap.resumoPomodoro,
                estadoBarra: snap.estadoBarra,
                cfgExib: snap.cfgExib
            };
        };

        if (acao === 'SINCRONIZAR_GUIA_ATIVA_POMODORO') {
            op = (async () => {
                const cfg = await obterConfiguracoesGerais();
                const senderTabId = (sender && sender.tab && typeof sender.tab.id === 'number') ? sender.tab.id : null;
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, senderTabId);
                return { ok: true };
            })();
        } else if (acao === 'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL' || acao === 'CONFIRMAR_DESCANSO_INICIADO_POMODORO') {
            op = (async () => {
                const [st, cfg] = await Promise.all([
                    instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje(),
                    obterConfiguracoesGerais()
                ]);
                const res = instanciaModuloProdutividade.calcularResumoPomodoro(st, cfg, Date.now(), null);
                const chaveFase = (msg && typeof msg.faseChave === 'string' && msg.faseChave)
                    ? msg.faseChave
                    : `${res.fase}:${res.cicloAtual}:${res.faseInicioTs}`;
                if (st.pomodoroModalDescansoChave || acao === 'CONFIRMAR_DESCANSO_INICIADO_POMODORO') {
                    st.pomodoroModalExibidoChave = chaveFase;
                    st.pomodoroModalDescansoChave = '';
                    await chrome.storage.local.set({ jusgovTrabalhoEstado: st });
                }
                await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, st);
                return { ok: true };
            })();
        } else if (acao === 'SINCRONIZAR_DESCANSO_CONCLUIDO_POMODORO') {
            op = (async () => {
                const [st, cfg] = await Promise.all([
                    instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje(),
                    obterConfiguracoesGerais()
                ]);
                if (st.pomodoroFase === 'alivio' || st.pomodoroFase === 'pausa_maior') {
                    const agoraConcl = Date.now();
                    st.pomodoroDescansoMinCumprido = true;
                    st.pomodoroDescansoRealizadoNoCiclo = true;
                    st.pomodoroDescansoPendente = false;
                    st.pomodoroUltimoDescansoTipo = st.pomodoroFase;
                    st.pomodoroUltimoDescansoFimTs = Number(st.pomodoroUltimoDescansoFimTs || agoraConcl);
                    st.pomodoroModalExibidoChave = String((msg && msg.faseChave) || st.pomodoroModalExibidoChave || '');
                    st.pomodoroModalDescansoChave = '';
                    await chrome.storage.local.set({ jusgovTrabalhoEstado: st });
                }
                await instanciaModuloProdutividade.fecharModalProdutividadeEmTodasJanelas();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, st);
                return { ok: true };
            })();
        } else if (acao === 'PING_ATIVIDADE_TRABALHO') {
            op = instanciaModuloProdutividade.registrarAtividadeTrabalho(Date.now(), msg.tipoInteracao || 'click_ou_tecla').then(async (r) => {
                const cfg = await obterConfiguracoesGerais();
                if (r && (r.resetouDescanso || r.iniciouFocoPosDescanso || r.iniciouBadgeVerde || r.ocultouBadgeVerde || r.alterouDescanso)) {
                    await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, null);
                } else {
                    const [estado, metaLoc] = await Promise.all([
                        instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje(),
                        (chrome.storage && chrome.storage.local)
                            ? chrome.storage.local.get(['jusgovProdNuvemMeta']).catch(() => ({}))
                            : Promise.resolve({})
                    ]);
                    instanciaModuloProdutividade.aplicarIndicadoresChromeAction(cfg, estado, (metaLoc && metaLoc.jusgovProdNuvemMeta) || null, Date.now());
                }
                if (msg && msg.retornarSnapshot) {
                    return await montarPayloadStatusTrabalho(sender, false);
                }
                return { ok: true };
            });
        } else if (acao === 'OBTER_STATUS_TRABALHO') {
            op = montarPayloadStatusTrabalho(sender, true);
        } else if (acao === 'RESETAR_CONTADORES_TRABALHO') {
            op = Promise.all([
                instanciaModuloProdutividade.resetarEstadoTrabalhoHoje(),
                obterConfiguracoesGerais()
            ]).then(async ([estado, cfg]) => {
                const agoraReset = Date.now();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, estado, null);
                return {
                    ok: true,
                    agoraServidor: agoraReset,
                    estado,
                    nuvemMeta: null,
                    resumoPomodoro: instanciaModuloProdutividade.calcularResumoPomodoro(estado, cfg, agoraReset, null)
                };
            });
        } else if (acao === 'FECHAR_BARRA_POMODORO_GLOBAL') {
            op = (async () => {
                const st = await instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje();
                st.pomodoroBarraOcultadaChave = String(msg.faseChave || '');
                await chrome.storage.local.set({ jusgovTrabalhoEstado: st });
                const cfg = await obterConfiguracoesGerais();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, st, 'todas');
                return { ok: true };
            })();
        } else if (acao === 'DISPENSAR_POMODORO_DESCANSO_CICLO') {
            op = (async () => {
                const st = await instanciaModuloProdutividade.obterOuIniciarEstadoTrabalhoHoje();
                st.pomodoroPularProximoPopupFoco = true;
                await chrome.storage.local.set({ jusgovTrabalhoEstado: st });
                return { ok: true };
            })();
        } else if (acao === 'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO') {
            op = (async () => {
                const cfgAtual = await obterConfiguracoesGerais();
                const modoAtual = (cfgAtual && typeof cfgAtual.pomodoroModoAviso === 'string') ? cfgAtual.pomodoroModoAviso : 'completo';
                const exibirNoAtivo = Boolean(msg.exibirNoAtivo);
                let novoModo = modoAtual;
                if (!exibirNoAtivo) {
                    if (modoAtual === 'completo') novoModo = 'badge_e_barra_descanso';
                    else if (modoAtual === 'barra_sempre') novoModo = 'barra_descanso';
                } else {
                    if (modoAtual === 'badge_e_barra_descanso' || modoAtual === 'badge' || modoAtual === 'modal') novoModo = 'completo';
                    else if (modoAtual === 'barra_descanso') novoModo = 'barra_sempre';
                    await instanciaModuloProdutividade.atualizarEstadoGlobalBarraPomodoro({ modoFixacao: 1, ancorar: true });
                }
                if (instanciaConfig && typeof instanciaConfig.aplicarConfigLocalEAgendarSync === 'function') {
                    await instanciaConfig.aplicarConfigLocalEAgendarSync({ pomodoroModoAviso: novoModo }, chrome, {
                        moduloNavegador: instanciaModuloNavegador
                    });
                }
                const cfgNova = await obterConfiguracoesGerais();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfgNova, null, 'todas');
                return { ok: true, pomodoroModoAviso: novoModo };
            })();
        } else {
            op = (async () => {
                const novoEstado = await instanciaModuloProdutividade.atualizarEstadoGlobalBarraPomodoro(msg);
                if (msg && (msg.nivelDetalhe === 0 || msg.nivelDetalhe === 1 || msg.nivelDetalhe === 2) && instanciaConfig && typeof instanciaConfig.aplicarConfigLocalEAgendarSync === 'function') {
                    const estiloNovo = (novoEstado.nivelDetalhe === 1) ? 'normal' : ((novoEstado.nivelDetalhe === 2) ? 'expandido' : 'compacto');
                    const cfgAtualEst = await obterConfiguracoesGerais();
                    if (cfgAtualEst && cfgAtualEst.pomodoroEstiloMinipopup !== estiloNovo) {
                        await instanciaConfig.aplicarConfigLocalEAgendarSync({ pomodoroEstiloMinipopup: estiloNovo }, chrome, {
                            moduloNavegador: instanciaModuloNavegador
                        });
                    }
                }
                const cfg = await obterConfiguracoesGerais();
                await instanciaModuloProdutividade.sincronizarIndicadoresGlobaisPomodoro(cfg, null, 'todas');
                return { ok: true, estadoBarra: novoEstado };
            })();
        }
        op.then((r) => sendResponse(r)).catch(() => sendResponse({ ok: false }));
        return true;
    }

    if (acao === 'abrirGeminiLateral' || acao === 'abrirAssistenteIaLateral' || acao === 'ABRIR_PAINEL_F1_GEMINI') {
        if (instanciaModuloProdutividade) {
            instanciaModuloProdutividade.abrirAssistenteIaLateral(msg, chrome).catch(() => { });
        }
        sendResponse({ ok: true });
        return false;
    }

    /* Injecao & Tab UX */
    if (acao === 'garantirInjecaoSubframes') {
        const tabId = sender && sender.tab ? sender.tab.id : null;
        if (tabId && instanciaInjecao) {
            obterConfiguracoesGerais().then((cfg) => {
                if (cfg && cfg.modoTurbo !== 'desligado') instanciaInjecao.agendarInjecaoSeguraNaAba(tabId, null, chrome);
            }).catch(() => { });
        }
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'broadcastDeselecionarGeral') {
        try {
            if (sender && sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, { acao: 'executarDeselecaoGeral' }).catch(() => { });
            }
        } catch (_) { }
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'abrirPaginaAparenciaChrome') {
        if (chrome.tabs && typeof chrome.tabs.create === 'function') {
            chrome.tabs.create({ url: 'chrome://settings/appearance', active: true }).catch(() => { });
        }
        sendResponse({ ok: true });
        return true;
    }

    if (acao === 'abrirPaginaLimparDadosChrome') {
        if (chrome.tabs && typeof chrome.tabs.create === 'function') {
            chrome.tabs.create({ url: 'chrome://settings/clearBrowserData', active: true }).catch(() => { });
        }
        sendResponse({ ok: true });
        return true;
    }

    /* Navegador (mod-navegador) */
    if (!instanciaModuloNavegador) return false;

    if (acao === 'TROCAR_GUIA_ULTIMA_ATIVA' || (acao === 'navegarAba' && msg.modo === 'ultima_ativa')) {
        const winId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
        instanciaModuloNavegador.alternarParaUltimaAbaAtiva(winId, chrome).catch(() => { });
        sendResponse({ ok: true });
        return false;
    }

    const dirNav = acao === 'TROCAR_GUIA_ANTERIOR' ? 'anterior'
        : (acao === 'TROCAR_GUIA_PROXIMA' ? 'proxima'
            : (acao === 'navegarAba' && (msg.direcao === 'anterior' || msg.direcao === 'proxima') ? msg.direcao : null));
    if (dirNav) {
        instanciaModuloNavegador.navegarAbaCircular(dirNav, sender, chrome).catch(() => { });
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'verificarOuAtivarAba' && msg.url) {
        obterConfiguracoesGerais()
            .then((cfg) => instanciaModuloNavegador.verificarOuAtivarAba(msg.url, sender, cfg, chrome))
            .then((res) => sendResponse(res || { reutilizada: false }))
            .catch(() => sendResponse({ reutilizada: false }));
        return true;
    }

    if (acao === 'abrirNovaAba' && msg.url) {
        obterConfiguracoesGerais()
            .then((cfg) => instanciaModuloNavegador.abrirNovaAba(msg.url, sender, cfg, chrome))
            .catch(() => { });
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'baixarLink' && msg.url) {
        instanciaModuloNavegador.baixarLink(msg.url, sender, chrome).catch(() => { });
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'registrarPaginaModificada') {
        const tabId = (sender && sender.tab) ? sender.tab.id : null;
        if (tabId) instanciaModuloNavegador.marcarPaginaModificada(tabId, true, chrome);
        sendResponse({ ok: true });
        return false;
    }

    if (acao === 'fecharGuiasDuplicadasAgora' || acao === 'ordenarGuiasAgora' || acao === 'ordenarGuiasPorCriterio' ||
        acao === 'agruparDominioAgora' || acao === 'desagruparGuiasAgora' || acao === 'restaurarOrdemGuiasPadrao' ||
        acao === 'descartarGuiasInativasAgora') {
        (async () => {
            try {
                const winAlvo = await instanciaModuloNavegador.obterWindowIdAlvo(sender, chrome);
                if (acao === 'fecharGuiasDuplicadasAgora') {
                    const total = await instanciaModuloNavegador.fecharGuiasDuplicadas(winAlvo, chrome);
                    sendResponse({ ok: true, totalFechadas: total });
                } else if (acao === 'agruparDominioAgora') {
                    if (winAlvo) await instanciaModuloNavegador.agruparGuiasPorDominio(winAlvo, chrome);
                    sendResponse({ ok: true });
                } else if (acao === 'desagruparGuiasAgora') {
                    const total = await instanciaModuloNavegador.desagruparGuias(winAlvo, chrome);
                    sendResponse({ ok: true, totalDesagrupadas: total });
                } else if (acao === 'descartarGuiasInativasAgora') {
                    const total = await instanciaModuloNavegador.descartarGuiasEmSegundoPlano(winAlvo, chrome);
                    sendResponse({ ok: true, totalDescartadas: total });
                } else if (acao === 'restaurarOrdemGuiasPadrao') {
                    if (winAlvo) {
                        await instanciaModuloNavegador.desagruparGuias(winAlvo, chrome);
                        if (instanciaModuloNavegador.ordenacao) {
                            const mapa = (instanciaModuloNavegador.antiDuplicacao && typeof instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                                ? instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls() : null;
                            await instanciaModuloNavegador.ordenacao.executarOrdenacaoGuias(winAlvo, {
                                criterioOrdenacaoGuias: 'ordem_criacao', sentidoOrdenacaoGuias: 'esq_dir', ordenarGuiasFixadas: false
                            }, chrome, mapa);
                        }
                    }
                    sendResponse({ ok: true });
                } else {
                    const cfg = await obterConfiguracoesGerais();
                    const cfgEfetivo = {
                        ...cfg,
                        criterioOrdenacaoGuias: msg.criterio || cfg.criterioOrdenacaoGuias || 'dominio',
                        sentidoOrdenacaoGuias: msg.sentido || cfg.sentidoOrdenacaoGuias || 'esq_dir',
                        ordenarGuiasFixadas: (msg.ordenarFixadas !== undefined) ? msg.ordenarFixadas : Boolean(cfg.ordenarGuiasFixadas)
                    };
                    if (winAlvo && instanciaModuloNavegador.ordenacao) {
                        const mapa = (instanciaModuloNavegador.antiDuplicacao && typeof instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                            ? instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls() : null;
                        await instanciaModuloNavegador.ordenacao.executarOrdenacaoGuias(winAlvo, cfgEfetivo, chrome, mapa);
                    }
                    sendResponse({ ok: true });
                }
            } catch (_) {
                sendResponse({ ok: false });
            }
        })();
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
        if (instanciaModuloManutencao && activeInfo && activeInfo.tabId && chrome.tabs.get) {
            chrome.tabs.get(activeInfo.tabId, (tab) => {
                if (chrome.runtime && chrome.runtime.lastError) return;
                if (tab && tab.url) instanciaModuloManutencao.registrarAcessoUrl(tab.url).catch(() => { });
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

    const garantirInjecaoEmFrameNavegado = async (details) => {
        try {
            if (!details || !details.tabId || !instanciaInjecao) return;
            if (details.url && (/^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(details.url) || (/^about:/i.test(details.url) && details.url !== 'about:blank'))) return;
            const config = await obterConfiguracoesGerais();
            if (config.modoTurbo !== 'desligado') {
                const frameIds = (typeof details.frameId === 'number' && details.frameId > 0) ? [details.frameId] : null;
                instanciaInjecao.agendarInjecaoSeguraNaAba(details.tabId, frameIds, chrome);
            }
        } catch (_) { }
    };
    if (chrome.webNavigation.onCommitted) chrome.webNavigation.onCommitted.addListener(garantirInjecaoEmFrameNavegado);
    if (chrome.webNavigation.onCompleted) chrome.webNavigation.onCompleted.addListener(garantirInjecaoEmFrameNavegado);
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
