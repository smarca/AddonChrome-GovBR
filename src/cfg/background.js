/* ==========================================================================
 * Nome do arquivo: background.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/background.js
 * - Natureza: Service Worker Manifest V3 (Non-Persistent) + Orquestrador IPC Global
 * - Fachada Orquestrada: ModuloNavegador (self.JusGovModuloNavegador via importScripts)
 * - Canais IPC (onMessage): 'OBTER_CONFIGURACOES', 'TROCAR_GUIA_ANTERIOR', 'TROCAR_GUIA_PROXIMA', 'ABRIR_PAINEL_F1_GEMINI', 'NOTIFICAR_MODIFICACAO_PAGINA', 'FECHAR_GUIAS_DUPLICADAS', 'AGRUPAR_GUIAS_DOMINIO', 'DESAGRUPAR_GUIAS', 'DESCARTAR_GUIAS_INATIVAS'
 * - Listeners Chrome: runtime.onInstalled, storage.onChanged, tabs.onUpdated/onActivated/onRemoved, windows.onCreated, webNavigation.onCompleted/onHistoryStateUpdated, commands.onCommand
 * - Regras / Seções: Diretrizes 11/15/16, Seção 6.19 (debounce de injeção 350ms), Seção 6.47, Seção 6.64
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, falhas do
 *    framework alvo, concorrencia no Service Worker e otimizacoes Chrome V8) e
 *    nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo, permitindo recriar 100% do Service Worker
 *    do zero caso o codigo-fonte deixasse de existir.
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
 * 7) REUSO ESTRITO DOS UTILITARIOS LOCAIS E MINIMIZACAO DE TOKENS IA: Todos os
 *    scripts e utilitarios criados na pasta util/ devem ser SEMPRE usados e
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
 * 1. ARQUITETURA DO SERVICE WORKER (MANIFEST V3 / MOTOR CHROME V8):
 * - Ciclo de Vida Efemero (Non-Persistent): No Manifest V3, o Service Worker
 *   hiberna apos ~30s de inatividade para poupar memoria RAM. Por isso, nenhum
 *   estado critico depende exclusivamente de variaveis globais volateis: tudo e
 *   persistido em nuvem ("chrome.storage.sync") e espelhado em memoria RAM de
 *   baixa latencia ("chrome.storage.session") para acesso em < 0,2ms ao acordar.
 * - Fila Sequencial Assincrona (Promise Queue -- "promiseFila"):
 *   As chamadas a "chrome.scripting.unregisterContentScripts()" seguidas de
 *   "chrome.scripting.registerContentScripts()" nao sao atomicas no Chromium.
 *   Se dois eventos dispararem simultaneamente (ex: "onInstalled" e "onChanged"),
 *   ocorre erro "Duplicate script ID". A fila "promiseFila" serializa todas as
 *   operacoes de registro garantindo determinismo absoluto.
 *
 * 2. ORDEM ESTRITA DE INJECAO MODULAR E ISOLATED WORLD:
 * - O modulo CSS ("modulo-anti-ampulheta") e registrado com
 *   "runAt: 'document_start'" e "allFrames: true" para neutralizar cortinas de
 *   bloqueio do PJe antes do primeiro First Contentful Paint do motor Blink.
 * - O motor de Selecao e Copia e injetado em ordem deterministica de dependencias:
 *   1o "copia-constantes.js" (Bitmask ASCII O(1) e Catalogo de Regex)
 *   2o "copia-aviso-flutuante.js" (Validador Matematico, Mini-Tip Esc+Esc e Top Layer)
 *   3o "copia-acumulador.js" (Acumulador ';' e Selecao de Tabelas por Linhas/Colunas)
 *   4o "copia-selecionar.js" (Motor em 6 Estagios, Formatacao Basica e Orquestrador)
 * - Injecao Retroativa Imediata (Sem exigir F5): Sempre que a extensao e
 *   instalada, recarregada ou ativada no Popup/Opcoes, o Service Worker varre
 *   as abas abertas compativeis e injeta os modulos imediatamente via
 *   "chrome.scripting.executeScript" / "insertCSS", funcionando na hora!
 *
 * 3. ICONE VETORIAL DINAMICO COM O RAIO ORIGINAL:
 * - O icone dinamico (OffscreenCanvas) desenha o simbolo original com
 *   o raiozinho amarelo sobre fundo arredondado e linhas documentais, alternando
 *   as cores conforme o modo operacional:
 *   * Todos os Sites (Global): Fundo Azul Real (#1a73e8), Raio Amarelo (#fbbc04).
 *   * So Lista PJe (Url): Fundo Ambar (#d97706), Raio Amarelo Claro (#fef08a).
 *   * Desligado: Fundo Cinza (#64748b), Raio Cinza Claro (#cbd5e1).
 *
 * 4. ROTEADOR DE MENSAGENS (ONMESSAGE) PARA LINKS E PAINEL GEMINI (TECLA F1):
 * - Atende solicitacoes vindas dos Content Scripts para:
 *   * "abrirNovaAba": Abre o link clicado com Alt+Clique em nova aba em segundo plano.
 *   * "baixarLink": Inicia o download ou abertura direta de links acionados com Alt+Shift+Clique.
 *   * "abrirGeminiLateral": Localiza uma aba existente do Google Gemini (ou abre uma
 *     nova aba/janela dedicada em https://gemini.google.com/app) quando o usuario
 *     pressiona a tecla F1 com ou sem texto selecionado.
 * ========================================================================== */

'use strict';

// =====================================================================
// SECAO 1: CONSTANTES IMUTAVEIS E PADROES DE FABRICA (OBJECT.FREEZE)
// =====================================================================
/* Passo 1.1: Congelar listas padrao de Match Patterns e a cadeia de arquivos JS
 * para permitir otimizacao de constantes no compilador JIT TurboFan do V8. */
/* Passo 0.1: Importacao segura dos submódulos do Grupo 4 (NAVEGADOR: Gerenciamento de Guias e Janelas)
 * e instanciação da Fachada POO (ModuloNavegador) com tolerância total a falhas (Null Object Pattern).
 * O porquê (Seção 6.47): Estabelece separação física e lógica estrita entre o domínio de orquestração
 * privilegiada do navegador (abas, janelas, anti-duplicação, Tab Groups e Tab Discarding no Service Worker)
 * e os domínios de Content Script (Grupo 2: Cópia Inteligente e Grupo 3: Periféricos Mouse/Teclado),
 * comunicando-se exclusivamente por barramento IPC assíncrono (chrome.runtime.onMessage / tabs.sendMessage). */
try {
    if (typeof importScripts === 'function') {
        importScripts(
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
            '../mod-navegador/mod-navegador.js'
        );
    }
} catch (_) { }

const instanciaVerificadores = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovVerificadores === 'function') {
            const inst = new self.JusGovVerificadores();
            self.JusGovInstanciaVerificadores = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const instanciaGeradores = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovGeradores === 'function') {
            const inst = new self.JusGovGeradores();
            self.JusGovInstanciaGeradores = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const instanciaUrls = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovUrls === 'function') {
            const inst = new self.JusGovUrls();
            self.JusGovInstanciaUrls = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const instanciaInjecao = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovInjecaoScripts === 'function') {
            const inst = new self.JusGovInjecaoScripts({ urls: instanciaUrls });
            self.JusGovInstanciaInjecao = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const instanciaModuloNavegador = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovModuloNavegador === 'function') {
            const inst = new self.JusGovModuloNavegador();
            self.JusGovInstanciaNavegador = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const instanciaConfig = (() => {
    try {
        if (typeof self !== 'undefined' && typeof self.JusGovConfiguracoes === 'function') {
            const inst = new self.JusGovConfiguracoes({
                urls: instanciaUrls,
                injecao: instanciaInjecao,
                navegador: instanciaModuloNavegador
            });
            self.JusGovInstanciaConfig = inst;
            return inst;
        }
    } catch (_) { }
    return null;
})();

const PADROES_DEFAULT_TURBO = instanciaConfig ? instanciaConfig.obterPadroesDefaultTurbo() : Object.freeze([
    '*://*.jus.br/*',
    '*://*.gov.br/*',
    '*://*.mp.br/*',
    '*://*.def.br/*',
    '*://gemini.google.com/*',
    '*://serasa-judicial.serasaexperian.com.br/*'
]);

const PADROES_DEFAULT_AMPULETAS = instanciaConfig ? instanciaConfig.obterPadroesDefaultAmpuletas() : Object.freeze([
    '*://*.jus.br/*',
    '*://*.pje.jus.br/*',
    '*://pje.jus.br/*',
    '*://*pje*.jus.br/*',
    '*://*pje*.*.jus.br/*'
]);

const ARQUIVOS_NUCLEO_MODULO_COPIA = instanciaInjecao ? instanciaInjecao.obterArquivosNucleoCopia() : Object.freeze([
    'src/cfg/cfg-defaults.js',
    'src/lib/lib-constantes.js',
    'src/lib/lib-verificadores.js',
    'src/mod-copia/copia-constantes.js',
    'src/mod-copia/copia-aviso-flutuante.js',
    'src/mod-copia/copia-acumulador.js',
    'src/mod-copia/copia-geometria.js',
    'src/mod-copia/copia-filtros.js',
    'src/mod-copia/copia-validadores.js',
    'src/mod-copia/copia-minutas.js',
    'src/mod-copia/copia-visual.js',
    'src/mod-copia/copia-estagio1.js',
    'src/mod-copia/copia-estagio2.js',
    'src/mod-copia/copia-estagio3.js',
    'src/mod-copia/copia-estagio4.js',
    'src/mod-copia/copia-estagio5.js',
    'src/mod-copia/copia-estagio6.js',
    'src/mod-copia/mod-copia.js'
]);

const ARQUIVOS_MODULO_INPUT = instanciaInjecao ? instanciaInjecao.obterArquivosModuloInput() : Object.freeze([
    'src/mod-input/input-botoes-laterais.js',
    'src/mod-input/input-botao-meio.js',
    'src/mod-input/input-teclado-campos.js',
    'src/mod-input/input-atalho-f1.js',
    'src/mod-input/input-caixa-rapida.js',
    'src/mod-input/mod-input.js'
]);

const ARQUIVOS_CONTEUDO_INTEGRADO = instanciaInjecao ? instanciaInjecao.obterArquivosConteudoIntegrado() : Object.freeze([
    'src/mod-anti-ampulheta/mod-anti-ampulheta.js',
    ...ARQUIVOS_NUCLEO_MODULO_COPIA,
    ...ARQUIVOS_MODULO_INPUT,
    'src/mod-copia/copia-selecionar.js'
]);
const ARQUIVOS_MODULO_COPIA = ARQUIVOS_CONTEUDO_INTEGRADO;

const ARQUIVOS_MODULO_CSS_PJE = instanciaInjecao ? instanciaInjecao.obterArquivosCssPje() : Object.freeze([
    'src/mod-anti-ampulheta/pje-anti-ampulheta.css',
    'src/mod-anti-ampulheta/eproc-anti-ampulheta.css',
    'src/mod-anti-ampulheta/seeu-projudi-anti-ampulheta.css',
    'src/mod-anti-ampulheta/saj-anti-ampulheta.css',
    'src/mod-anti-ampulheta/pdpj-stf-stj-anti-ampulheta.css',
    'src/mod-anti-ampulheta/creta-anti-ampulheta.css',
    'src/mod-anti-ampulheta/generico-anti-ampulheta.css'
]);

/* Fila de promessas global para serializar registros de Content Scripts */
let promiseFila = Promise.resolve();

// =====================================================================
// SECAO 2: SANITIZACAO E COMPILACAO DE MATCH PATTERNS (DESPACHO PARA LIB-URLS)
// =====================================================================
function sanitizarParaMatches(urls) {
    return instanciaUrls ? instanciaUrls.sanitizarParaMatches(urls) : [];
}

function urlCorrespondeAosPadroes(url, padroes) {
    return instanciaUrls ? instanciaUrls.urlCorrespondeAosPadroes(url, padroes) : false;
}

// =====================================================================
// SECAO 3: REGISTRO DINAMICO E INJECAO RETROATIVA (DESPACHO PARA LIB-INJECAO)
// =====================================================================
function enfileirarRegistro(urlsTurbo, urlsAmpuletas, modoTurbo, estadoAmpuletas) {
    if (instanciaInjecao) {
        promiseFila = instanciaInjecao.enfileirarRegistro(urlsTurbo, urlsAmpuletas, modoTurbo, estadoAmpuletas, chrome, instanciaUrls);
        return promiseFila;
    }
    return Promise.resolve();
}

async function injetarRetroativamenteNasAbasAbertas(config) {
    if (instanciaInjecao) {
        return instanciaInjecao.injetarRetroativamenteNasAbasAbertas(config, chrome, instanciaUrls);
    }
}

function agendarInjecaoSeguraNaAba(tabId, frameIdsOpcional = null) {
    if (instanciaInjecao) {
        instanciaInjecao.agendarInjecaoSeguraNaAba(tabId, frameIdsOpcional, chrome);
    }
}

// =====================================================================
// SECAO 4: SINCRONIZACAO DE ESTADO (DESPACHO PARA LIB-CONFIG)
// =====================================================================
async function sincronizarEstado() {
    if (instanciaConfig) {
        return instanciaConfig.sincronizarEstado(chrome, {
            urls: instanciaUrls,
            injecao: instanciaInjecao,
            navegador: instanciaModuloNavegador
        });
    }
    return null;
}

function sincronizarComportamentoIcone(comportamento) {
    if (instanciaConfig) {
        instanciaConfig.sincronizarComportamentoIcone(comportamento, chrome);
    }
}

async function obterConfiguracoesGerais() {
    if (instanciaConfig) {
        return instanciaConfig.obterConfiguracoesGerais(chrome);
    }
    return {};
}

// =====================================================================
// SECAO 5: GERADOR DE ICONE VETORIAL EM MEMORIA COM RAIO (DESPACHO PARA LIB-CONFIG)
// =====================================================================
function desenharIconeVetorialFallback(modoAtivo, comportamento) {
    if (instanciaConfig) {
        instanciaConfig.desenharIconeVetorialFallback(modoAtivo, comportamento, chrome);
    }
}

// =====================================================================
// SECAO 6: LISTENERS DO CICLO DE VIDA E ROTEADOR DE MENSAGENS
// =====================================================================
/* Rastreamento de histórico de abas ativas (atual e anterior) por janela e global
 * Suporta alternância direta via comando "switch-to-last-tab" e Ctrl+Botões 4/5 */
let currentTabId = null;
let previousTabId = null;
const historicoAbasJanela = new Map();

/* Inicializa defensivamente a aba ativa atual em memória */
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (abas) => {
        if (abas && abas.length > 0 && abas[0].id) {
            currentTabId = abas[0].id;
            const winId = abas[0].windowId;
            if (winId) {
                let winHist = historicoAbasJanela.get(winId);
                if (!winHist) {
                    winHist = { currentTabId: abas[0].id, previousTabId: null };
                    historicoAbasJanela.set(winId, winHist);
                } else if (!winHist.currentTabId) {
                    winHist.currentTabId = abas[0].id;
                }
            }
        }
    });
}

/* Escuta quando o usuário muda de aba ativa */
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        if (!activeInfo || !activeInfo.tabId) return;
        const winId = activeInfo.windowId;
        if (winId) {
            let winHist = historicoAbasJanela.get(winId);
            if (!winHist) {
                winHist = { currentTabId: null, previousTabId: null };
                historicoAbasJanela.set(winId, winHist);
            }
            if (winHist.currentTabId && winHist.currentTabId !== activeInfo.tabId) {
                winHist.previousTabId = winHist.currentTabId; // A atual vira a anterior
            }
            winHist.currentTabId = activeInfo.tabId; // Atualiza a nova aba ativa
        }

        if (currentTabId && currentTabId !== activeInfo.tabId) {
            previousTabId = currentTabId; // A atual vira a anterior
        }
        currentTabId = activeInfo.tabId; // Atualiza a nova aba ativa
    });
}

/**
 * @MAPA-IA-FN: alternarParaUltimaAbaAtiva
 * Foca na aba anterior diretamente via chrome.tabs.update
 * Realiza ciclo ping-pong entre a última e a penúltima aba ativa
 * @param {number|null} [windowIdOpcional=null]
 */
function alternarParaUltimaAbaAtiva(windowIdOpcional = null) {
    let alvoTabId = null;
    if (windowIdOpcional && historicoAbasJanela.has(windowIdOpcional)) {
        const winHist = historicoAbasJanela.get(windowIdOpcional);
        if (winHist && winHist.previousTabId) {
            alvoTabId = winHist.previousTabId;
        }
    }
    if (!alvoTabId) {
        alvoTabId = previousTabId;
    }
    if (!alvoTabId) return;

    chrome.tabs.get(alvoTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
            console.log("A aba anterior foi fechada.");
            if (previousTabId === alvoTabId) previousTabId = null;
            if (windowIdOpcional && historicoAbasJanela.has(windowIdOpcional)) {
                const winHist = historicoAbasJanela.get(windowIdOpcional);
                if (winHist && winHist.previousTabId === alvoTabId) winHist.previousTabId = null;
            }
            return;
        }
        // Foca na aba anterior
        chrome.tabs.update(alvoTabId, { active: true }).catch(() => { });
    });
}

/* Escuta o comando de atalho do teclado configurado no manifest.json */
if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
        if (command === "switch-to-last-tab" && previousTabId) {
            alternarParaUltimaAbaAtiva();
        }
    });
}

/* Passo 6.1: Ao instalar ou atualizar a extensao, inicializar estado e injetar nas abas */
chrome.runtime.onInstalled.addListener(async () => {
    await sincronizarEstado();
    if (instanciaModuloNavegador && typeof instanciaModuloNavegador.inicializarSessaoAbas === 'function') {
        try { await instanciaModuloNavegador.inicializarSessaoAbas(); } catch (_) { }
    }
    /* Passo 6.1.1: Criar menus de contexto na ordem exata solicitada (exige permissao no manifest) */
    if (chrome.contextMenus) {
        const config = await chrome.storage.sync.get(['comportamentoCliqueIcone']);
        const isAcoesRapidas = config.comportamentoCliqueIcone === 'acoes_rapidas';
        
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({ id: 'toggle-comportamento-icone', type: 'checkbox', title: 'Ações Rápidas no Ícone', checked: isAcoesRapidas, contexts: ['action'] }, () => {});
            chrome.contextMenus.create({ id: 'configurar-extensao', title: 'Configurar Extensão', contexts: ['action'] }, () => {});
            chrome.contextMenus.create({ id: 'abrir-painel-extensao', title: 'Desenvolvimento (Página do Plugin)', contexts: ['action'] }, () => {});
        });
    }
});

/* Passo 6.2: Ao iniciar o perfil do navegador, garantir sincronizacao e icone */
chrome.runtime.onStartup.addListener(async () => {
    await sincronizarEstado();
    if (instanciaModuloNavegador && typeof instanciaModuloNavegador.inicializarSessaoAbas === 'function') {
        try { await instanciaModuloNavegador.inicializarSessaoAbas(); } catch (_) { }
    }
});

/* Passo 6.3: Injetar e sincronizar antecipadamente já no início do carregamento (loading) e conclusão (complete) */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const url = (tab && tab.url) || (changeInfo && changeInfo.url) || '';
    if (!url) return;
    try {
        if (/^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(url) || (/^about:/i.test(url) && url !== 'about:blank')) return;
        const config = await obterConfiguracoesGerais();

        // Vinculação instantânea: injeta imediatamente no início do carregamento (status === 'loading') sem esperar carregar
        if (config.modoTurbo !== 'desligado') {
            agendarInjecaoSeguraNaAba(tabId);
        }

        // Gerencia o CSS anti-ampulhetas do PJe se a URL corresponder aos padrões
        if (changeInfo.status === 'complete' && config.ativoAmpuletas !== false && urlCorrespondeAosPadroes(url, config.urlsAmpuletas || [])) {
            chrome.scripting.insertCSS({
                target: { tabId: tabId, allFrames: true },
                files: [...ARQUIVOS_MODULO_CSS_PJE]
            }).catch(() => {});
        }
    } catch (_) {}
});

/* Passo 6.3.1: Monitorar via webNavigation o carregamento concluido e committed de subframes, iframes dinamicos e visualizadores de PDF */
if (typeof chrome !== 'undefined' && chrome.webNavigation) {
    /* Passo 6.3.0: Roteamento Seguro do Casulo e Bloqueio de Acesso Externo a Arquivos (SEC-01 / Seção 6.106) */
    if (chrome.webNavigation.onBeforeNavigate) {
        const idExtensao = (typeof chrome.runtime !== 'undefined' && chrome.runtime.id) ? chrome.runtime.id : '';
        const prefixoExtensao = idExtensao ? `chrome-extension://${idExtensao}/` : '';
        if (prefixoExtensao) {
            chrome.webNavigation.onBeforeNavigate.addListener((details) => {
                try {
                    if (!details || !details.url || !details.tabId || details.frameId !== 0) return;
                    if (typeof self.JusGovBlockAddon !== 'undefined' && typeof self.JusGovBlockAddon.rotearUrlNavegacao === 'function') {
                        const destino = self.JusGovBlockAddon.rotearUrlNavegacao(details.url, prefixoExtensao);
                        if (destino && destino !== details.url) {
                            chrome.tabs.update(details.tabId, { url: destino });
                        }
                    }
                } catch (_) { }
            }, { url: [{ urlPrefix: prefixoExtensao }] });
        }
    }

    const garantirInjecaoEmFrameNavegado = async (details) => {
        try {
            if (!details || !details.tabId) return;
            if (details.url && (/^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(details.url) || (/^about:/i.test(details.url) && details.url !== 'about:blank'))) return;
            const config = await obterConfiguracoesGerais();
            if (config.modoTurbo !== 'desligado') {
                if (typeof details.frameId === 'number' && details.frameId > 0) {
                    agendarInjecaoSeguraNaAba(details.tabId, [details.frameId]);
                } else {
                    agendarInjecaoSeguraNaAba(details.tabId);
                }
            }
        } catch (_) {}
    };

    if (chrome.webNavigation.onCommitted) {
        chrome.webNavigation.onCommitted.addListener(garantirInjecaoEmFrameNavegado);
    }
    if (chrome.webNavigation.onCompleted) {
        chrome.webNavigation.onCompleted.addListener(garantirInjecaoEmFrameNavegado);
    }
}

/* Passo 6.2.1: Clique no icone da extensao na barra do navegador:
 * - 1 clique simples: alterna ciclicamente entre Ativado (global) -> Lista (url) -> Desativado (desligado).
 * - 2 cliques rapidos (duplo clique em ate 260ms): abre a pagina de Opcoes (options.html). */
let timerCliqueIconeExtensao = null;
const JANELA_DUPLO_CLIQUE_ICONE_MS = 260;

if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(() => {
        if (timerCliqueIconeExtensao !== null) {
            clearTimeout(timerCliqueIconeExtensao);
            timerCliqueIconeExtensao = null;
            chrome.runtime.openOptionsPage();
            return;
        }

        timerCliqueIconeExtensao = setTimeout(async () => {
            timerCliqueIconeExtensao = null;
            try {
                const atual = await chrome.storage.sync.get(['modoTurbo']);
                const modoAtual = atual.modoTurbo || 'global';
                const proximoModo = modoAtual === 'global'
                    ? 'url'
                    : (modoAtual === 'url' ? 'desligado' : 'global');
                await chrome.storage.sync.set({ modoTurbo: proximoModo });
                desenharIconeVetorialFallback(proximoModo, 'acoes_rapidas');
            } catch (_) { }
        }, JANELA_DUPLO_CLIQUE_ICONE_MS);
    });
}

/* Passo 6.3: Reagir instantaneamente a alteracoes de configuracao salvas pelo Popup,
 * Opcoes ou atalho Esc+Esc (ignorando atualizacoes puras de contadores estatisticos
 * para evitar reinjecao desnecessaria de scripts a cada clique). */
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'sync') {
        const chavesConfig = [
            'urlsTurbo',
            'urlsAmpuletas',
            'modoTurbo',
            'comportamentoCliqueIcone',
            'ativoAmpuletas',
            'manterFormatacaoBasica',
            'nivelFiltroFormatacao',
            'selecaoEditavelAtiva',
            'modoPlaceholdersMinutasHtml',
            'placeholdersMinutasHtmlAtivo',
            'colagemBotaoDireitoAtiva',
            'capturaBotoesMouse4e5Ativa',
            'colarBotaoMeioAtivo',
            'navegacaoTecladoCamposAtiva',
            'bloquearNovasJanelas',
            'preservarJanelasAutenticacao',
            'abaEmPrimeiroPlano',
            'abaEmSegundoPlano',
            'reutilizarAbasAbertas',
            'reutilizarAbasFocoPrimeiroPlano',
            'protegerGuiasModificadas',
            'reutilizarAbasAcaoConteudo',
            'monitorarUrlOriginalAbertura',
            'monitorarUrlAtualPagina',
            'criterioOrdenacaoGuias',
            'sentidoOrdenacaoGuias',
            'ordenarGuiasFixadas',
            'descarteGuiasInativasAtivo',
            'tempoInatividadeDescarteMinutos',
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
            'minimoCaracteresInterface',
            'converterCabecalhoPjeAtivo',
            'atalhoF1GeminiAtivo',
            'modoShiftCnj',
            'incluirSeparadorFinalAcumulador',
            'separadorTabelas',
            'promptF1Gemini',
            'tempoExibicaoAlertaMs',
            'separadorAcumulador',
            'regrasMapeamentoElementos'
        ];
        const mudouConfiguracao = chavesConfig.some(chave => Object.prototype.hasOwnProperty.call(changes, chave));
        if (mudouConfiguracao) {
            await sincronizarEstado();
        }
        /* Atualizar marcação visual do checkbox no menu de contexto se alterado em outra tela */
        if (changes.comportamentoCliqueIcone && chrome.contextMenus) {
            chrome.contextMenus.update('toggle-comportamento-icone', { checked: changes.comportamentoCliqueIcone.newValue === 'acoes_rapidas' }).catch(() => {});
        }
    }
});

/* Passo 6.4: Escutar mensagens operacionais dos Content Scripts (Alt+Clique em link,
 * Alt+Shift+Clique para download, tecla F1 para abertura do painel Google Gemini e
 * sincronizacao imediata solicitada pela tela de Opcoes). */
/* @MAPA-IA-IPC: Roteamento de Mensagens IPC do Background Service Worker */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.acao !== 'string') return false;

    if (msg.acao === 'forcarSincronizacaoNuvem') {
        // Seção 6.97: Agenda sincronização coalescente via chrome.alarms (1 minuto de janela mínima)
        agendarSincronizacaoNuvemDebounced(1);
        sendResponse({ ok: true, agendado: true });
        return false;
    }

    if (msg.acao === 'garantirInjecaoSubframes') {
        const tabId = sender && sender.tab ? sender.tab.id : null;
        if (tabId) {
            (async () => {
                try {
                    const config = await obterConfiguracoesGerais();
                    if (config.modoTurbo !== 'desligado') {
                        agendarInjecaoSeguraNaAba(tabId);
                    }
                } catch (_) {}
            })();
        }
        sendResponse({ ok: true });
        return false;
    }

    let direcaoNavegar = null;
    let alternarUltimaAtiva = false;

    if (msg.acao === 'TROCAR_GUIA_ULTIMA_ATIVA' || (msg.acao === 'navegarAba' && msg.modo === 'ultima_ativa')) {
        alternarUltimaAtiva = true;
    } else if (msg.acao === 'navegarAba' && (msg.direcao === 'anterior' || msg.direcao === 'proxima')) {
        direcaoNavegar = msg.direcao;
    } else if (msg.acao === 'TROCAR_GUIA_ANTERIOR') {
        direcaoNavegar = 'anterior';
    } else if (msg.acao === 'TROCAR_GUIA_PROXIMA') {
        direcaoNavegar = 'proxima';
    }

    if (alternarUltimaAtiva) {
        const windowId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
        alternarParaUltimaAbaAtiva(windowId);
        sendResponse({ ok: true });
        return false;
    }

    if (direcaoNavegar) {
        const windowId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : undefined;
        const queryInfo = (windowId !== undefined) ? { windowId } : { lastFocusedWindow: true };
        chrome.tabs.query(queryInfo, (abas) => {
            if (!abas || abas.length <= 1) return;
            abas.sort((a, b) => a.index - b.index);

            // Sempre basear o deslocamento circular na aba atualmente ativa na janela
            let idxAtiva = abas.findIndex(t => t.active);
            if (idxAtiva === -1 && sender && sender.tab && sender.tab.id) {
                idxAtiva = abas.findIndex(t => t.id === sender.tab.id);
            }
            if (idxAtiva === -1) idxAtiva = 0;

            const novoIdx = (direcaoNavegar === 'anterior')
                ? (idxAtiva - 1 + abas.length) % abas.length
                : (idxAtiva + 1) % abas.length;

            const abaDestino = abas[novoIdx];
            if (abaDestino && abaDestino.id) {
                chrome.tabs.update(abaDestino.id, { active: true }).catch(() => { });
            }
        });
        sendResponse({ ok: true });
        return false;
    }

    if (msg.acao === 'verificarOuAtivarAba' && msg.url) {
        (async () => {
            try {
                const config = await obterConfiguracoesGerais();
                if (config.reutilizarAbasAbertas !== true) {
                    sendResponse({ reutilizada: false });
                    return;
                }
                const antiDup = instanciaModuloNavegador ? instanciaModuloNavegador.antiDuplicacao : null;
                const normalizador = (antiDup && typeof antiDup.normalizarUrlParaComparacao === 'function')
                    ? (u) => antiDup.normalizarUrlParaComparacao(u)
                    : (u) => String(u || '').trim().toLowerCase();
                const mapaAbas = (antiDup && typeof antiDup.obterMapaAbasUrls === 'function')
                    ? antiDup.obterMapaAbasUrls()
                    : new Map();

                const urlAlvoNorm = normalizador(msg.url);
                if (!urlAlvoNorm) {
                    sendResponse({ reutilizada: false });
                    return;
                }
                const windowId = sender && sender.tab ? sender.tab.windowId : undefined;
                const abas = await chrome.tabs.query(windowId ? { windowId } : {});
                const monitorarOrig = Boolean(config.monitorarUrlOriginalAbertura);
                const monitorarAtual = (config.monitorarUrlAtualPagina !== false);
                const abaExistente = abas.find(t => {
                    const reg = mapaAbas.get(t.id);
                    if (reg && reg.duplicacaoManualPermitida) return false;
                    const uAtual = normalizador(t.url || t.pendingUrl || '');
                    if (monitorarAtual && urlAlvoNorm === uAtual) return true;
                    if (monitorarOrig && reg) {
                        const uOrig = reg.urlOriginal || '';
                        const uRegAtual = reg.urlAtual || '';
                        return (urlAlvoNorm === uOrig || urlAlvoNorm === uRegAtual);
                    }
                    return false;
                });
                if (abaExistente) {
                    const emPrimeiroPlano = (config.abaEmPrimeiroPlano !== undefined)
                        ? Boolean(config.abaEmPrimeiroPlano)
                        : (config.abaEmSegundoPlano === false);
                    if (emPrimeiroPlano) {
                        await chrome.tabs.update(abaExistente.id, { active: true });
                       if (abaExistente.windowId && !(sender && sender.url && sender.url.includes('options.html'))) {
                            await chrome.windows.update(abaExistente.windowId, { focused: true });
                        }
                    }
                    sendResponse({ reutilizada: true, tabId: abaExistente.id });
                    return;
                }
                sendResponse({ reutilizada: false });
            } catch (_) {
                sendResponse({ reutilizada: false });
            }
        })();
        return true;
    }

    if (msg.acao === 'abrirNovaAba' && msg.url) {
        try {
            const urlAlvo = sender && sender.tab && sender.tab.url
                ? new URL(msg.url, sender.tab.url).href
                : msg.url;
            obterConfiguracoesGerais().then((cfg) => {
                const emPrimeiroPlano = (cfg.abaEmPrimeiroPlano !== undefined)
                    ? Boolean(cfg.abaEmPrimeiroPlano)
                    : (cfg.abaEmSegundoPlano === false);
                chrome.tabs.create({ url: urlAlvo, active: emPrimeiroPlano }).catch(() => { });
            }).catch(() => {
                chrome.tabs.create({ url: urlAlvo, active: false }).catch(() => { });
            });
        } catch (_) { }
        sendResponse({ ok: true });
        return false;
    }

if (msg.acao === 'baixarLink' && msg.url) {
    try {
        const urlAlvo = sender && sender.tab && sender.tab.url
            ? new URL(msg.url, sender.tab.url).href
            : msg.url;
        if (chrome.downloads && typeof chrome.downloads.download === 'function') {
            chrome.downloads.download({ url: urlAlvo }).catch(() => {
                chrome.tabs.create({ url: urlAlvo, active: false }).catch(() => { });
            });
        } else {
            chrome.tabs.create({ url: urlAlvo, active: false }).catch(() => { });
        }
    } catch (_) { }
    sendResponse({ ok: true });
    return false;
}

if (msg.acao === 'registrarPaginaModificada') {
    const tabId = (sender && sender.tab) ? sender.tab.id : null;
    if (tabId && instanciaModuloNavegador && typeof instanciaModuloNavegador.marcarPaginaModificada === 'function') {
        instanciaModuloNavegador.marcarPaginaModificada(tabId, true, chrome);
    }
    sendResponse({ ok: true });
    return false;
}

if (msg.acao === 'fecharGuiasDuplicadasAgora') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            const total = await (instanciaModuloNavegador ? instanciaModuloNavegador.fecharGuiasDuplicadas(winAlvo, chrome) : 0);
            sendResponse({ ok: true, totalFechadas: total });
        } catch (_) {
            sendResponse({ ok: false, totalFechadas: 0 });
        }
    })();
    return true;
}

if (msg.acao === 'ordenarGuiasAgora' || msg.acao === 'ordenarGuiasPorCriterio') {
    (async () => {
        try {
            const config = await obterConfiguracoesGerais();
            const configEfetivo = {
                ...config,
                criterioOrdenacaoGuias: msg.criterio || config.criterioOrdenacaoGuias || 'dominio',
                sentidoOrdenacaoGuias: msg.sentido || config.sentidoOrdenacaoGuias || 'esq_dir',
                ordenarGuiasFixadas: (msg.ordenarFixadas !== undefined) ? msg.ordenarFixadas : Boolean(config.ordenarGuiasFixadas)
            };
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            if (winAlvo && instanciaModuloNavegador && instanciaModuloNavegador.ordenacao) {
                const mapa = (instanciaModuloNavegador.antiDuplicacao && typeof instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                    ? instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls()
                    : null;
                await instanciaModuloNavegador.ordenacao.executarOrdenacaoGuias(winAlvo, configEfetivo, chrome, mapa);
            }
            sendResponse({ ok: true });
        } catch (_) {
            sendResponse({ ok: false });
        }
    })();
    return true;
}

if (msg.acao === 'agruparDominioAgora') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            if (winAlvo && instanciaModuloNavegador) {
                await instanciaModuloNavegador.agruparGuiasPorDominio(winAlvo, chrome);
            }
            sendResponse({ ok: true });
        } catch (_) {
            sendResponse({ ok: false });
        }
    })();
    return true;
}

if (msg.acao === 'desagruparGuiasAgora') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            const total = await (instanciaModuloNavegador ? instanciaModuloNavegador.desagruparGuias(winAlvo, chrome) : 0);
            sendResponse({ ok: true, totalDesagrupadas: total });
        } catch (_) {
            sendResponse({ ok: false, totalDesagrupadas: 0 });
        }
    })();
    return true;
}

if (msg.acao === 'restaurarOrdemGuiasPadrao') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            if (winAlvo && instanciaModuloNavegador) {
                await instanciaModuloNavegador.desagruparGuias(winAlvo, chrome);
                if (instanciaModuloNavegador.ordenacao) {
                    const mapa = (instanciaModuloNavegador.antiDuplicacao && typeof instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                        ? instanciaModuloNavegador.antiDuplicacao.obterMapaAbasUrls()
                        : null;
                    await instanciaModuloNavegador.ordenacao.executarOrdenacaoGuias(winAlvo, {
                        criterioOrdenacaoGuias: 'ordem_criacao',
                        sentidoOrdenacaoGuias: 'esq_dir',
                        ordenarGuiasFixadas: false
                    }, chrome, mapa);
                }
            }
            sendResponse({ ok: true });
        } catch (_) {
            sendResponse({ ok: false });
        }
    })();
    return true;
}

if (msg.acao === 'descartarGuiasInativasAgora') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            const total = await (instanciaModuloNavegador ? instanciaModuloNavegador.descartarGuiasEmSegundoPlano(winAlvo, chrome) : 0);
            sendResponse({ ok: true, totalDescartadas: total });
        } catch (_) {
            sendResponse({ ok: false, totalDescartadas: 0 });
        }
    })();
    return true;
}

if (msg.acao === 'broadcastDeselecionarGeral') {
    try {
        if (sender && sender.tab && sender.tab.id) {
            chrome.tabs.sendMessage(sender.tab.id, { acao: 'executarDeselecaoGeral' }).catch(() => { });
        }
    } catch (_) { }
    sendResponse({ ok: true });
    return false;
}

if (msg.acao === 'abrirGeminiLateral' || msg.acao === 'abrirAssistenteIaLateral' || msg.acao === 'ABRIR_PAINEL_F1_GEMINI') {
    (async () => {
        try {
            const preencherPromptGemini = (textoPrompt) => {
                const tentarPreenchimento = (tentativa) => {
                    const editavel = document.querySelector('rich-textarea p, rich-textarea div[contenteditable="true"], div.ql-editor, textarea, rich-textarea div[role="textbox"]');
                    if (editavel) {
                        editavel.focus();
                        let inseriu = false;
                        try {
                            inseriu = document.execCommand('insertText', false, textoPrompt);
                        } catch (_) { }
                        if (!inseriu || (editavel.textContent || '').trim().length === 0) {
                            if (editavel.tagName === 'TEXTAREA' || editavel.tagName === 'INPUT') {
                                editavel.value = textoPrompt;
                            } else {
                                editavel.textContent = textoPrompt;
                            }
                        }
                        try {
                            editavel.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                            editavel.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        } catch (_) { }
                    } else if (tentativa < 20) {
                        setTimeout(() => tentarPreenchimento(tentativa + 1), 350);
                    }
                };
                tentarPreenchimento(0);
            };

            const abasGemini = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
            let abaAlvoId = null;
            let abaAlvoWindowId = null;
            let ehNovaAba = false;

            if (abasGemini && abasGemini.length > 0 && abasGemini[0].id) {
                const abaAlvo = abasGemini[0];
                abaAlvoId = abaAlvo.id;
                abaAlvoWindowId = abaAlvo.windowId;
                await chrome.tabs.update(abaAlvoId, { active: true });
                if (abaAlvoWindowId) {
                    await chrome.windows.update(abaAlvoWindowId, { focused: true });
                }
            } else {
                const novaAba = await chrome.tabs.create({ url: 'https://gemini.google.com/app', active: true });
                abaAlvoId = novaAba.id;
                ehNovaAba = true;
            }

            let promptTxt = (typeof msg.prompt === 'string' && msg.prompt.trim().length > 0) ? msg.prompt : '';
            if (!promptTxt && (msg.acao === 'ABRIR_PAINEL_F1_GEMINI' || msg.texto !== undefined)) {
                const config = await obterConfiguracoesGerais();
                const template = (config && typeof config.promptF1Gemini === 'string' && config.promptF1Gemini.trim().length > 0)
                    ? config.promptF1Gemini
                    : 'Analise juridicamente e formate o seguinte texto processual extraído do PJe:\n\n"{{TEXTO}}"';
                const limpo = String(msg.texto || '').trim();
                if (template.includes('{{TEXTO}}')) {
                    promptTxt = template.replace(/\{\{TEXTO\}\}/g, limpo);
                } else if (template.includes('{SELECAO}')) {
                    promptTxt = template.replace(/\{SELECAO\}/g, limpo);
                } else {
                    promptTxt = (template + ' ' + limpo).trim();
                }
            }

            if (abaAlvoId && promptTxt.trim().length > 0) {
                if (ehNovaAba) {
                    const listener = (tabId, mudanca) => {
                        if (tabId === abaAlvoId && mudanca.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            setTimeout(async () => {
                                try {
                                    await chrome.scripting.executeScript({
                                        target: { tabId: abaAlvoId },
                                        func: preencherPromptGemini,
                                        args: [promptTxt]
                                    });
                                } catch (_) { }
                            }, 500);
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                    setTimeout(() => {
                        try { chrome.tabs.onUpdated.removeListener(listener); } catch (_) { }
                    }, 20000);
                } else {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: abaAlvoId },
                            func: preencherPromptGemini,
                            args: [promptTxt]
                        });
                    } catch (_) { }
                }
            }
        } catch (_) { }
    })();
    sendResponse({ ok: true });
    return false;
}

return false;
});

/* Passo 6.5: Escutar cliques no menu de contexto nativo do icone da extensao */
if (chrome.contextMenus) chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === 'toggle-comportamento-icone') {
        const novoComportamento = info.checked ? 'acoes_rapidas' : 'popup';
        await chrome.storage.sync.set({ comportamentoCliqueIcone: novoComportamento });
    } else if (info.menuItemId === 'configurar-extensao') {
        /* Abre a aba padrao de opcoes da extensao nativamente */
        chrome.runtime.openOptionsPage();
    } else if (info.menuItemId === 'abrir-painel-extensao') {
		chrome.tabs.create({ url: 'https://github.com/smarca/AddonChrome-GovBR.git', active: true });
    }
});

// =====================================================================
// SECAO 7: ORQUESTRACAO DE EVENTOS DO NAVEGADOR (SERVICE WORKER DISPATCHER)
// =====================================================================
/*
 * ESPECIFICACAO DE ENGENHARIA (BP-06 / ARQ-01):
 * O Service Worker Manifest V3 atua exclusivamente como escuta e despachante
 * dos eventos nativos do Chrome (windows, tabs, alarms), delegando 100% da
 * regra de negocio, isolamento e ordenacao para a Fachada ModuloNavegador
 * (self.JusGovInstanciaNavegador / instanciaModuloNavegador).
 */

/* Passo 7.1: Despacho do evento chrome.windows.onCreated para a Fachada ModuloNavegador (Single Window) */
if (chrome.windows && chrome.windows.onCreated) {
    chrome.windows.onCreated.addListener(async (janela) => {
        try {
            if (instanciaModuloNavegador) {
                await instanciaModuloNavegador.tratarNovaJanela(janela, chrome);
            }
        } catch (_) { }
    });
}

/* Passo 7.2: Despacho do evento chrome.tabs.onCreated para a Fachada ModuloNavegador (Anti-Duplicacao e Ordenacao) */
if (chrome.tabs && chrome.tabs.onCreated) {
    chrome.tabs.onCreated.addListener(async (tab) => {
        try {
            if (tab && tab.id && (tab.url === 'about:blank' || !tab.url)) {
                agendarInjecaoSeguraNaAba(tab.id);
            }
            if (instanciaModuloNavegador) {
                await instanciaModuloNavegador.tratarNovaAba(tab, chrome);
            }
        } catch (_) { }
    });
}

/* Passo 7.3: Despacho do evento chrome.tabs.onUpdated para a Fachada ModuloNavegador (Anti-Duplicacao assincrona) */
if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        try {
            if (instanciaModuloNavegador) {
                await instanciaModuloNavegador.tratarAbaAtualizada(tabId, changeInfo, tab, chrome);
            }
        } catch (_) { }
    });
}

/* Passo 7.4: Despacho do evento chrome.tabs.onRemoved para limpeza de mapa na Fachada ModuloNavegador e historico de abas */
if (chrome.tabs && chrome.tabs.onRemoved) {
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        try {
            if (currentTabId === tabId) currentTabId = null;
            if (previousTabId === tabId) previousTabId = null;
            const winId = removeInfo ? removeInfo.windowId : null;
            if (winId && historicoAbasJanela.has(winId)) {
                const winHist = historicoAbasJanela.get(winId);
                if (winHist.currentTabId === tabId) winHist.currentTabId = null;
                if (winHist.previousTabId === tabId) winHist.previousTabId = null;
            }
            if (instanciaInjecao && typeof instanciaInjecao.limparDebounceAba === 'function') {
                instanciaInjecao.limparDebounceAba(tabId);
            }
            if (instanciaModuloNavegador) {
                instanciaModuloNavegador.tratarAbaRemovida(tabId, chrome);
            }
        } catch (_) { }
    });
}

/* Passo 7.5: Economizador de Memoria Automatico (Descarte periodico delegado a Fachada via chrome.alarms MV3 - Secao 6.67)
 * Em Service Workers Manifest V3, o processo de background entra em suspensao (hibernacao) apos ~30s de
 * ociosidade, impedindo que timers setInterval disparem de forma confiavel. O uso de chrome.alarms garante
 * que o navegador acorde o Service Worker pontualmente para executar a rotina de descarte de abas inativas. */
const NOME_ALARME_DESCARTE_RAM = 'jusgov-descarte-ram';
const NOME_ALARME_SYNC_NUVEM = 'jusgov-sync-nuvem-debounced';

/*
 * Seção 6.97 / FEAT-17 / BP-08: Sincronização em Nuvem Debounced via chrome.alarms (Janela Mínima de 1 Minuto)
 * Toda alteração salva na máquina local agenda uma janela coalescente de 1 minuto antes de enviar ao Google Sync,
 * blindando as cotas da Chrome Web Store (MAX_WRITE_OPERATIONS_PER_MINUTE) e economizando tráfego de rede.
 */
let timerFallbackSyncNuvem = null;

function agendarSincronizacaoNuvemDebounced(minutosAtraso = 1) {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
        try {
            chrome.alarms.create(NOME_ALARME_SYNC_NUVEM, { delayInMinutes: minutosAtraso });
            return;
        } catch (_) { }
    }
    // Fallback para ambientes sem suporte nativo a alarms (ex: runner headless de testes de sintaxe)
    if (timerFallbackSyncNuvem) clearTimeout(timerFallbackSyncNuvem);
    timerFallbackSyncNuvem = setTimeout(async () => {
        timerFallbackSyncNuvem = null;
        try {
            await executarSincronizacaoNuvemEfetiva();
        } catch (_) { }
    }, minutosAtraso * 60 * 1000);
}

async function executarSincronizacaoNuvemEfetiva() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    try {
        // Coleta o snapshot atual da máquina local e envia de forma coalescida ao chrome.storage.sync
        if (chrome.storage.local && chrome.storage.sync) {
            const dadosLocais = await chrome.storage.local.get(null);
            if (dadosLocais && typeof dadosLocais === 'object' && Object.keys(dadosLocais).length > 0) {
                // Filtra variáveis voláteis e temporárias locais
                const payloadSync = {};
                for (const k in dadosLocais) {
                    if (!k.startsWith('__temp') && !k.startsWith('total') && k !== 'flashBorderAtivo') {
                        payloadSync[k] = dadosLocais[k];
                    }
                }
                if (Object.keys(payloadSync).length > 0) {
                    await chrome.storage.sync.set(payloadSync);
                }
            }
        }
        await sincronizarEstado();
    } catch (_) { }
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
    try {
        chrome.alarms.create(NOME_ALARME_DESCARTE_RAM, { periodInMinutes: 5 });
        chrome.alarms.onAlarm.addListener(async (alarme) => {
            if (!alarme || !alarme.name) return;
            if (alarme.name === NOME_ALARME_DESCARTE_RAM) {
                try {
                    if (instanciaModuloNavegador) {
                        await instanciaModuloNavegador.tratarIntervaloDescarte(chrome);
                    }
                } catch (_) { }
            } else if (alarme.name === NOME_ALARME_SYNC_NUVEM) {
                try {
                    await executarSincronizacaoNuvemEfetiva();
                } catch (_) { }
            }
        });
    } catch (_) { }
} else {
    /* Fallback resiliente para ambientes de execucao sem suporte a chrome.alarms (ex: runners headless de teste de sintaxe) */
    setInterval(async () => {
        try {
            if (instanciaModuloNavegador) {
                await instanciaModuloNavegador.tratarIntervaloDescarte(chrome);
            }
        } catch (_) { }
    }, 5 * 60 * 1000);
}
