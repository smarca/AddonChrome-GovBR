/* ==========================================================================
 * Nome do arquivo: background.js
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
 * - O modulo CSS ("modulo-PJE-anti_ampuletas.css") e registrado com
 *   "runAt: 'document_start'" e "allFrames: true" para neutralizar cortinas de
 *   bloqueio do PJe antes do primeiro First Contentful Paint do motor Blink.
 * - O motor de Selecao e Copia e injetado em ordem deterministica de dependencias:
 *   1o "modulo-ConstantesPadroes.js" (Bitmask ASCII O(1) e Catalogo de Regex)
 *   2o "modulo-AvisoFlutuante.js" (Validador Matematico, Mini-Tip Esc+Esc e Top Layer)
 *   3o "modulo-AcumuladorCopia.js" (Acumulador ';' e Selecao de Tabelas por Linhas/Colunas)
 *   4o "modulo-SelecionarCopiar.js" (Motor em 6 Estagios, Formatacao Basica e Orquestrador)
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
const PADROES_DEFAULT_TURBO = Object.freeze([
    '*://*.jus.br/*',
    '*://*.gov.br/*',
    '*://*.mp.br/*',
    '*://*.def.br/*',
    '*://gemini.google.com/*',
    '*://serasa-judicial.serasaexperian.com.br/*'
]);

const PADROES_DEFAULT_AMPULETAS = Object.freeze([
    '*://*.jus.br/*',
    '*://*.pje.jus.br/*',
    '*://pje.jus.br/*',
    '*://*pje*.jus.br/*',
    '*://*pje*.*.jus.br/*'
]);

const ARQUIVOS_MODULO_COPIA = Object.freeze([
    'src/mod-copia/ConstantesPadroes.js',
    'src/mod-copia/AvisoFlutuante.js',
    'src/mod-copia/AcumuladorCopia.js',
    'src/mod-copia/SelecionarCopiar.js'
]);

const ARQUIVOS_MODULO_CSS_PJE = Object.freeze([
    'src/mod-pje/PJE-anti_ampuletas.css'
]);

/* Passo 1.2: Fila de promessas global para serializar registros de Content Scripts */
let promiseFila = Promise.resolve();

// =====================================================================
// SECAO 2: SANITIZACAO E COMPILACAO DE MATCH PATTERNS (URL ROUTING)
// =====================================================================
/*
 * FUNCAO: sanitizarParaMatches
 * OBJETIVO DE RECONSTRUCAO: Converter a lista de URLs digitada pelo usuario na
 * pagina de Opcoes em Match Patterns estritamente validos segundo a gramatica
 * da API C++ chrome.scripting (esquema://host/caminho), descartando entradas
 * vazias e normalizando curingas de subdominio (ex: "*pje*.jus.br" -> "*.jus.br").
 */
function sanitizarParaMatches(urls) {
    /* Passo 2.1: Validar se a entrada e um array nao-vazio */
    if (!Array.isArray(urls) || urls.length === 0) return [];
    const limpos = new Set();

    /* Passo 2.2: Iterar sobre cada mascara, higienizar espacos e validar sintaxe */
    for (let i = 0; i < urls.length; i++) {
        const bruta = urls[i];
        if (!bruta || typeof bruta !== 'string') continue;

        const url = bruta.trim();
        if (url === '') continue;

        if (url === '<all_urls>' || url === '*://*/*') {
            limpos.add('<all_urls>');
            continue;
        }

        const regex = /^(\*|https?|file|ftp):\/\/([^\/]+)(\/.*)?$/i;
        const match = url.match(regex);

        if (match) {
            const protocolo = match[1].toLowerCase();
            let host = match[2].toLowerCase();
            const path = match[3] || '/*';

            /* O Chrome exige que '*' no host seja o unico caractere ou seguido por '.' */
            if (host.includes('*') && host !== '*') {
                const ultimoAsterisco = host.lastIndexOf('*');
                const pontoAposAsterisco = host.indexOf('.', ultimoAsterisco);
                if (pontoAposAsterisco !== -1) {
                    host = '*' + host.substring(pontoAposAsterisco);
                } else {
                    host = '*';
                }
            }
            limpos.add(`${protocolo}://${host}${path}`);
        } else if (!url.includes('://')) {
            /* Se o usuario digitou apenas o dominio (ex: "*.trf1.jus.br"), adiciona esquema e path */
            let hostLimpo = url.replace(/\/.*$/, '').toLowerCase();
            if (hostLimpo.includes('*') && hostLimpo !== '*') {
                const ultimoAsterisco = hostLimpo.lastIndexOf('*');
                const pontoAposAsterisco = hostLimpo.indexOf('.', ultimoAsterisco);
                if (pontoAposAsterisco !== -1) {
                    hostLimpo = '*' + hostLimpo.substring(pontoAposAsterisco);
                } else {
                    hostLimpo = '*';
                }
            }
            limpos.add(`*://${hostLimpo}/*`);
        }
    }

    return Array.from(limpos);
}

/*
 * FUNCAO: urlCorrespondeAosPadroes
 * OBJETIVO DE RECONSTRUCAO: Verificar em JavaScript se a URL de uma aba aberta
 * e compativel com a lista de mascaras configurada antes de realizar injecao
 * retroativa via chrome.scripting.executeScript.
 */
function urlCorrespondeAosPadroes(url, padroes) {
    /* Passo 2.3: Bloquear esquemas internos protegidos do navegador onde a injecao e proibida */
    if (!url || typeof url !== 'string') return false;
    if (/^(?:chrome|edge|about|devtools|view-source|chrome-extension):/i.test(url)) {
        return false;
    }
    if (!Array.isArray(padroes) || padroes.length === 0) return false;

    /* Passo 2.4: Testar cada mascara convertendo '*' em '.*' */
    for (let i = 0; i < padroes.length; i++) {
        const padrao = padroes[i];
        if (!padrao) continue;
        if (padrao === '<all_urls>' || padrao === '*://*/*') return true;

        try {
            const regexEscapada = padrao.trim().replace(/[.+^${}()|[\]\\]/g, '\\$&');
            const regexStr = regexEscapada.replace(/\*/g, '.*');
            const regex = new RegExp('^' + regexStr + '$', 'i');
            if (regex.test(url)) return true;
        } catch (_) {
            continue;
        }
    }
    return false;
}

// =====================================================================
// SECAO 3: REGISTRO DINAMICO E INJECAO RETROATIVA EM ABAS ABERTAS
// =====================================================================
/*
 * FUNCAO: enfileirarRegistro
 * OBJETIVO DE RECONSTRUCAO: Desregistrar scripts antigos e registrar o conjunto
 * atualizado de Content Scripts na fila sequencial promiseFila, evitando Race
 * Conditions na API chrome.scripting.
 */
function enfileirarRegistro(urlsTurbo, urlsAmpuletas, modoTurbo, estadoAmpuletas) {
    /* Passo 3.1: Encadear operacao na fila sequencial de promessas */
    promiseFila = promiseFila.then(async () => {
        try {
            /* Passo 3.2: Limpar todos os registros dinamicos anteriores */
            await chrome.scripting.unregisterContentScripts();

            /* Passo 3.3: Configurar registro do Modulo PJe Anti-Ampulhetas (CSS em document_start) */
            if (estadoAmpuletas !== false && Array.isArray(urlsAmpuletas) && urlsAmpuletas.length > 0) {
                const matchesPje = sanitizarParaMatches(urlsAmpuletas);
                if (matchesPje.length > 0) {
                    try {
                        await chrome.scripting.registerContentScripts([{
                            id: 'modulo-PJE-anti_ampuletas',
                            matches: matchesPje,
                            css: [...ARQUIVOS_MODULO_CSS_PJE],
                            runAt: 'document_start',
                            allFrames: true
                        }]);
                    } catch (errCss) {
                        console.warn('[JusGovBR] Aviso ao registrar CSS PJe:', errCss);
                    }
                }
            }

            /* Passo 3.4: Os modulos JS do Motor de Selecao, Copia e Navegacao ja sao declarados
             * estaticamente no manifest.json para <all_urls> (all_frames: true, document_start).
             * Nao registrar dinamicamente um segundo Content Script identico para evitar dupla
             * injecao e sobrecarga de CPU a cada navegacao ou criacao de iframe. */
        } catch (err) {
            console.warn('[JusGovBR] Aviso ao atualizar registro de scripts:', err);
        }
    }).catch(err => console.warn('[JusGovBR] Erro na fila de registro:', err));

    return promiseFila;
}

/*
 * FUNCAO: injetarRetroativamenteNasAbasAbertas
 * OBJETIVO DE RECONSTRUCAO: Garantir que abas ja abertas antes da instalacao ou
 * alteracao de configuracoes recebam imediatamente os modulos JS e CSS e a
 * atualizacao de estado, sem exigir que o usuario pressione F5.
 */
async function injetarRetroativamenteNasAbasAbertas(config) {
    /* Passo 3.6: Consultar todas as abas abertas no navegador */
    try {
        const tabs = await chrome.tabs.query({});
        const urlsTurboAtivas = config.modoTurbo === 'global'
            ? ['<all_urls>']
            : (config.urlsTurbo || []).filter(u => u !== '' && u !== '<all_urls>');

        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            if (!tab || !tab.id || !tab.url) continue;

            /* Ignorar abas descartadas da memoria ou com esquemas restritos */
            if (tab.discarded || /^(?:chrome|edge|about|devtools|view-source|chrome-extension):/i.test(tab.url)) {
                continue;
            }

            /* Passo 3.7: Notificar instancia ja presente na aba sobre o novo estado e opcoes avancadas */
            chrome.tabs.sendMessage(tab.id, {
                acao: 'atualizarEstadoModulo',
                modoTurbo: config.modoTurbo,
                urlsTurbo: config.urlsTurbo,
                ativoAmpuletas: config.ativoAmpuletas !== false,
                manterFormatacaoBasica: Boolean(config.manterFormatacaoBasica),
                selecaoEditavelAtiva: config.selecaoEditavelAtiva !== false,
                modoPlaceholdersMinutasHtml: config.modoPlaceholdersMinutasHtml || (config.placeholdersMinutasHtmlAtivo === false ? 'desabilitado' : 'placeholders'),
                placeholdersMinutasHtmlAtivo: config.modoPlaceholdersMinutasHtml ? (config.modoPlaceholdersMinutasHtml !== 'desabilitado') : (config.placeholdersMinutasHtmlAtivo !== false),
                colagemBotaoDireitoAtiva: Boolean(config.colagemBotaoDireitoAtiva),
                capturaBotoesMouse4e5Ativa: config.capturaBotoesMouse4e5Ativa !== false,
                colarBotaoMeioAtivo: config.colarBotaoMeioAtivo !== false,
                navegacaoTecladoCamposAtiva: config.navegacaoTecladoCamposAtiva !== false,
                validacaoMatematicaAtiva: config.validacaoMatematicaAtiva !== false,
                tempoFlashBorderMs: typeof config.tempoFlashBorderMs === 'number' ? config.tempoFlashBorderMs : 500,
                corFlashBorder: typeof config.corFlashBorder === 'string' ? config.corFlashBorder : '#0d9488',
                converterCabecalhoPjeAtivo: config.converterCabecalhoPjeAtivo !== false,
                atalhoF1GeminiAtivo: config.atalhoF1GeminiAtivo !== false,
                modoShiftCnj: typeof config.modoShiftCnj === 'string' ? config.modoShiftCnj : '20digitos',
                incluirSeparadorFinalAcumulador: config.incluirSeparadorFinalAcumulador !== false,
                separadorTabelas: typeof config.separadorTabelas === 'string' ? config.separadorTabelas : ';',
                promptF1Gemini: typeof config.promptF1Gemini === 'string' ? config.promptF1Gemini : '',
                tempoExibicaoAlertaMs: typeof config.tempoExibicaoAlertaMs === 'number' ? config.tempoExibicaoAlertaMs : 3500,
                separadorAcumulador: typeof config.separadorAcumulador === 'string' && config.separadorAcumulador.length > 0
                    ? config.separadorAcumulador
                    : ';'
            }).catch(() => { });

            /* Passo 3.8: Se o modulo de copia e navegacao estiver ativo, garantir injecao dos scripts na aba */
            if (config.modoTurbo !== 'desligado') {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    files: [...ARQUIVOS_MODULO_COPIA]
                }).catch(() => { });
            }

            /* Passo 3.9: Se o PJe Anti-Ampulhetas estiver ativo para esta URL, garantir que o CSS esteja injetado; caso desativado, remover dinamicamente sem reload */
            if (config.ativoAmpuletas !== false && urlCorrespondeAosPadroes(tab.url, config.urlsAmpuletas || [])) {
                chrome.scripting.insertCSS({
                    target: { tabId: tab.id, allFrames: true },
                    files: [...ARQUIVOS_MODULO_CSS_PJE]
                }).catch(() => { });
            } else if (config.ativoAmpuletas === false && urlCorrespondeAosPadroes(tab.url, config.urlsAmpuletas || [])) {
                chrome.scripting.removeCSS({
                    target: { tabId: tab.id, allFrames: true },
                    files: [...ARQUIVOS_MODULO_CSS_PJE]
                }).catch(() => { });
            }
        }
    } catch (_) { }
}

// =====================================================================
// SECAO 4: SINCRONIZACAO DE ESTADO (STORAGE.SYNC + STORAGE.SESSION)
// =====================================================================
/*
 * FUNCAO: sincronizarEstado
 * OBJETIVO DE RECONSTRUCAO: Ler as configuracoes da nuvem (chrome.storage.sync),
 * preencher padroes de fabrica caso seja a primeira execucao (incluindo a opcao
 * manterFormatacaoBasica = false por padrao, ou seja, "Remover Formatacoes / Somente Texto"),
 * gravar cache em RAM (chrome.storage.session), atualizar o registro de scripts
 * e sincronizar todas as abas abertas em tempo real.
 */
async function sincronizarEstado() {
    /* Passo 4.1: Ler todas as chaves de configuracao no chrome.storage.sync */
    const config = await chrome.storage.sync.get(null);

    let precisaSalvar = false;
    const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 900000000;

    /* Passo 4.2: Aplicar valores padrao de fabrica se alguma chave estiver ausente e remover '<all_urls>' legado da lista */
    if (Array.isArray(config.urlsTurbo) && config.urlsTurbo.includes('<all_urls>')) {
        config.urlsTurbo = config.urlsTurbo.filter(u => u && u !== '<all_urls>');
        precisaSalvar = true;
    }
    if (!Array.isArray(config.urlsTurbo) || config.urlsTurbo.length === 0) {
        config.urlsTurbo = [...PADROES_DEFAULT_TURBO];
        precisaSalvar = true;
    }
    if (!Array.isArray(config.urlsAmpuletas) || config.urlsAmpuletas.length === 0) {
        config.urlsAmpuletas = [...PADROES_DEFAULT_AMPULETAS];
        precisaSalvar = true;
    } else {
        let atualizouPje = false;
        for (let p = 0; p < PADROES_DEFAULT_AMPULETAS.length; p++) {
            const padraoPje = PADROES_DEFAULT_AMPULETAS[p];
            if (!config.urlsAmpuletas.includes(padraoPje)) {
                config.urlsAmpuletas.push(padraoPje);
                atualizouPje = true;
            }
        }
        if (atualizouPje) {
            precisaSalvar = true;
        }
    }
    if (!config.modoTurbo) {
        config.modoTurbo = 'global';
        precisaSalvar = true;
    }
    if (typeof config.comportamentoCliqueIcone !== 'string' || (config.comportamentoCliqueIcone !== 'acoes_rapidas' && config.comportamentoCliqueIcone !== 'popup')) {
        config.comportamentoCliqueIcone = 'popup';
        precisaSalvar = true;
    }
    if (config.ativoAmpuletas === undefined) {
        config.ativoAmpuletas = true;
        precisaSalvar = true;
    }
    /* Por padrao, manterFormatacaoBasica e false ("Remover Formatacoes / Somente Texto" marcado) */
    if (config.manterFormatacaoBasica === undefined) {
        config.manterFormatacaoBasica = false;
        precisaSalvar = true;
    }
    const niveisValidos = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido', 'extendido', 'sem_filtro'];
    if (typeof config.nivelFiltroFormatacao !== 'string' || !niveisValidos.includes(config.nivelFiltroFormatacao)) {
        config.nivelFiltroFormatacao = 'basico';
        precisaSalvar = true;
    }
    if (config.selecaoEditavelAtiva === undefined) {
        config.selecaoEditavelAtiva = true;
        precisaSalvar = true;
    }
    if (config.modoPlaceholdersMinutasHtml === undefined) {
        config.modoPlaceholdersMinutasHtml = (config.placeholdersMinutasHtmlAtivo === false) ? 'desabilitado' : 'placeholders';
        precisaSalvar = true;
    }
    if (config.placeholdersMinutasHtmlAtivo === undefined) {
        config.placeholdersMinutasHtmlAtivo = (config.modoPlaceholdersMinutasHtml !== 'desabilitado');
        precisaSalvar = true;
    }
    if (config.validacaoMatematicaAtiva === undefined) {
        config.validacaoMatematicaAtiva = true;
        precisaSalvar = true;
    }
    if (typeof config.tempoFlashBorderMs !== 'number' || config.tempoFlashBorderMs < 0 || config.tempoFlashBorderMs > 5000) {
        config.tempoFlashBorderMs = 500;
        precisaSalvar = true;
    }
    if (typeof config.corFlashBorder !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFlashBorder.trim())) {
        config.corFlashBorder = '#0d9488';
        precisaSalvar = true;
    }
    if (config.converterCabecalhoPjeAtivo === undefined) {
        config.converterCabecalhoPjeAtivo = true;
        precisaSalvar = true;
    }
    if (config.atalhoF1GeminiAtivo === undefined) {
        config.atalhoF1GeminiAtivo = true;
        precisaSalvar = true;
    }
    if (typeof config.modoShiftCnj !== 'string' || (config.modoShiftCnj !== '20digitos' && config.modoShiftCnj !== 'semZeros')) {
        config.modoShiftCnj = '20digitos';
        precisaSalvar = true;
    }
    if (config.incluirSeparadorFinalAcumulador === undefined) {
        config.incluirSeparadorFinalAcumulador = true;
        precisaSalvar = true;
    }
    if (typeof config.separadorTabelas !== 'string' || ![';', '\t', ' | '].includes(config.separadorTabelas)) {
        config.separadorTabelas = ';';
        precisaSalvar = true;
    }
    if (typeof config.promptF1Gemini !== 'string' || config.promptF1Gemini.trim().length === 0) {
        config.promptF1Gemini = "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";
        precisaSalvar = true;
    }
    if (typeof config.tempoExibicaoAlertaMs !== 'number' || (config.tempoExibicaoAlertaMs !== 0 && (config.tempoExibicaoAlertaMs < 1000 || config.tempoExibicaoAlertaMs > 10000))) {
        config.tempoExibicaoAlertaMs = 3500;
        precisaSalvar = true;
    }
    if (typeof config.separadorAcumulador !== 'string' ||
        config.separadorAcumulador.trim().length === 0 ||
        /[0-9\p{L}]/u.test(config.separadorAcumulador) ||
        !/[!-\/:-@\[-`{-~|\u00A7\u00B0\u00BA\u00AA\p{P}\p{S}]/u.test(config.separadorAcumulador)) {
        config.separadorAcumulador = ';';
        precisaSalvar = true;
    } else if (config.separadorAcumulador.length > 5) {
        config.separadorAcumulador = config.separadorAcumulador.slice(0, 5);
        precisaSalvar = true;
    }

    /* Validacao e defaults para modulo MOUSE e modulo NAVEGADOR */
    if (config.colagemBotaoDireitoAtiva === undefined) {
        config.colagemBotaoDireitoAtiva = false;
        precisaSalvar = true;
    }
    if (config.capturaBotoesMouse4e5Ativa === undefined) {
        config.capturaBotoesMouse4e5Ativa = true;
        precisaSalvar = true;
    }
    if (config.colarBotaoMeioAtivo === undefined) {
        config.colarBotaoMeioAtivo = true;
        precisaSalvar = true;
    }
    if (config.navegacaoTecladoCamposAtiva === undefined) {
        config.navegacaoTecladoCamposAtiva = true;
        precisaSalvar = true;
    }
    if (config.bloquearNovasJanelas === undefined) {
        config.bloquearNovasJanelas = true;
        precisaSalvar = true;
    }
    if (config.preservarJanelasAutenticacao === undefined) {
        config.preservarJanelasAutenticacao = true;
        precisaSalvar = true;
    }
    if (config.abaEmPrimeiroPlano === undefined) {
        config.abaEmPrimeiroPlano = (config.abaEmSegundoPlano === false);
        precisaSalvar = true;
    }
    if (config.abaEmSegundoPlano === undefined) {
        config.abaEmSegundoPlano = !config.abaEmPrimeiroPlano;
        precisaSalvar = true;
    }
    if (config.reutilizarAbasAbertas === undefined) {
        config.reutilizarAbasAbertas = false;
        precisaSalvar = true;
    }
    if (config.monitorarUrlOriginalAbertura === undefined) {
        config.monitorarUrlOriginalAbertura = false;
        precisaSalvar = true;
    }
    if (config.monitorarUrlAtualPagina === undefined) {
        config.monitorarUrlAtualPagina = true;
        precisaSalvar = true;
    }
    if (!config.monitorarUrlOriginalAbertura && !config.monitorarUrlAtualPagina) {
        config.monitorarUrlAtualPagina = true;
        precisaSalvar = true;
    }
    if (typeof config.criterioOrdenacaoGuias !== 'string' || !['nenhum', 'url', 'dominio', 'titulo', 'tempo_acesso', 'ordem_criacao', 'agrupar_dominio'].includes(config.criterioOrdenacaoGuias)) {
        config.criterioOrdenacaoGuias = 'nenhum';
        precisaSalvar = true;
    }
    if (typeof config.sentidoOrdenacaoGuias !== 'string' || !['esq_dir', 'dir_esq'].includes(config.sentidoOrdenacaoGuias)) {
        config.sentidoOrdenacaoGuias = 'dir_esq';
        precisaSalvar = true;
    }
    if (config.ordenarGuiasFixadas === undefined) {
        config.ordenarGuiasFixadas = false;
        precisaSalvar = true;
    }
    if (config.descarteGuiasInativasAtivo === undefined || config.descarteGuiasInativasAtivo === true) {
        config.descarteGuiasInativasAtivo = false;
        precisaSalvar = true;
    }
    if (config.tempoInatividadeDescarteMinutos === undefined) {
        config.tempoInatividadeDescarteMinutos = 20;
        precisaSalvar = true;
    }

    if (precisaSalvar) {
        await chrome.storage.sync.set({
            urlsTurbo: config.urlsTurbo,
            urlsAmpuletas: config.urlsAmpuletas,
            modoTurbo: config.modoTurbo,
            comportamentoCliqueIcone: config.comportamentoCliqueIcone,
            ativoAmpuletas: config.ativoAmpuletas,
            manterFormatacaoBasica: config.manterFormatacaoBasica,
            nivelFiltroFormatacao: config.nivelFiltroFormatacao,
            selecaoEditavelAtiva: config.selecaoEditavelAtiva,
            modoPlaceholdersMinutasHtml: config.modoPlaceholdersMinutasHtml,
            placeholdersMinutasHtmlAtivo: config.placeholdersMinutasHtmlAtivo,
            colagemBotaoDireitoAtiva: false,
            capturaBotoesMouse4e5Ativa: config.capturaBotoesMouse4e5Ativa,
            colarBotaoMeioAtivo: config.colarBotaoMeioAtivo !== false,
            navegacaoTecladoCamposAtiva: config.navegacaoTecladoCamposAtiva,
            bloquearNovasJanelas: config.bloquearNovasJanelas,
            preservarJanelasAutenticacao: config.preservarJanelasAutenticacao,
            abaEmPrimeiroPlano: Boolean(config.abaEmPrimeiroPlano),
            abaEmSegundoPlano: (config.abaEmPrimeiroPlano !== undefined) ? !config.abaEmPrimeiroPlano : Boolean(config.abaEmSegundoPlano),
            reutilizarAbasAbertas: Boolean(config.reutilizarAbasAbertas),
            monitorarUrlOriginalAbertura: Boolean(config.monitorarUrlOriginalAbertura),
            monitorarUrlAtualPagina: (config.monitorarUrlAtualPagina !== false),
            criterioOrdenacaoGuias: config.criterioOrdenacaoGuias,
            sentidoOrdenacaoGuias: config.sentidoOrdenacaoGuias || 'dir_esq',
            ordenarGuiasFixadas: config.ordenarGuiasFixadas,
            descarteGuiasInativasAtivo: false,
            tempoInatividadeDescarteMinutos: Number(config.tempoInatividadeDescarteMinutos) || 20,
            validacaoMatematicaAtiva: config.validacaoMatematicaAtiva,
            tempoFlashBorderMs: config.tempoFlashBorderMs,
            corFlashBorder: config.corFlashBorder,
            converterCabecalhoPjeAtivo: config.converterCabecalhoPjeAtivo,
            atalhoF1GeminiAtivo: config.atalhoF1GeminiAtivo,
            modoShiftCnj: config.modoShiftCnj,
            incluirSeparadorFinalAcumulador: config.incluirSeparadorFinalAcumulador,
            separadorTabelas: config.separadorTabelas,
            promptF1Gemini: config.promptF1Gemini,
            tempoExibicaoAlertaMs: config.tempoExibicaoAlertaMs,
            separadorAcumulador: config.separadorAcumulador
        });
    }

    /* Passo 4.2.1: Limpar variaveis estatisticas e chaves redundantes do storage.sync para manter a nuvem limpa */
    if (chrome.storage && chrome.storage.sync && chrome.storage.sync.remove) {
        chrome.storage.sync.remove(['totalCopias', 'totalAlertas', 'flashBorderAtivo']).catch(() => { });
    }

    /* Passo 4.3: Espelhar configuracao no chrome.storage.session (RAM rapida) */
    if (chrome.storage.session) {
        chrome.storage.session.set({ cacheConfigJusGov: config }).catch(() => { });
    }

    /* Passo 4.4: Enfileirar atualizacao dos Content Scripts e notificar/injetar nas abas */
    await enfileirarRegistro(
        config.urlsTurbo,
        config.urlsAmpuletas,
        config.modoTurbo,
        config.ativoAmpuletas
    );

    await injetarRetroativamenteNasAbasAbertas(config);

    /* Passo 4.5: Atualizar dinamicamente o icone e o popup da extensao na barra de ferramentas */
    sincronizarComportamentoIcone(config.comportamentoCliqueIcone);
    desenharIconeVetorialFallback(config.modoTurbo, config.comportamentoCliqueIcone);
}

/*
 * FUNCAO: sincronizarComportamentoIcone
 * OBJETIVO DE RECONSTRUCAO: Sincronizar o comportamento dinamico do botao de acao
 * da extensao no Google Chrome (Manifest V3):
 * - "acoes_rapidas": Remove o popup nativo (setPopup = ""), permitindo que
 *   1 clique alterne o modo (Global -> Lista -> Desligado) e 2 cliques abram Opcoes.
 * - "popup" (padrao): Restaura "popup.html" como popup nativo, abrindo o painel com 1 clique.
 */
function sincronizarComportamentoIcone(comportamento) {
    if (!chrome.action || !chrome.action.setPopup) return;
    try {
        if (comportamento === 'acoes_rapidas') {
            chrome.action.setPopup({ popup: '' });
        } else {
            chrome.action.setPopup({ popup: 'src/cfg/popup.html' });
        }
    } catch (_) { }
}

// =====================================================================
// SECAO 5: GERADOR DE ICONE VETORIAL EM MEMORIA COM RAIO (OFFSCREENCANVAS)
// =====================================================================
/*
 * FUNCAO: desenharIconeVetorialFallback
 * OBJETIVO DE RECONSTRUCAO: Desenhar o icone vetorial com as faixas documentais
 * e o raio amarelo ("raiozinho") em OffscreenCanvas conforme a paleta de modos:
 * - Modo Global (Ativo Global): Fundo Verde Esmeralda (#10b981), Borda #059669, Raio Amarelo (#fef08a).
 * - Modo Lista (Ativo Lista): Fundo Azul Real (#1a73e8), Borda #1557b0, Raio Amarelo (#fbbc04).
 * - Modo Desligado (Pausado): Fundo Cinza (#64748b), Borda #475569, Raio Cinza Claro (#cbd5e1).
 */
function desenharIconeVetorialFallback(modoAtivo, comportamento) {
    /* Passo 5.1: Verificar suporte a OffscreenCanvas e chrome.action.setIcon */
    if (typeof OffscreenCanvas === 'undefined' || !chrome.action || !chrome.action.setIcon) {
        return;
    }

    try {
        let corFundo = '#10b981';
        let corBorda = '#059669';
        let corRaio = '#fef08a';
        let tituloModo = 'Ativo (Global)';

        if (modoAtivo === 'url') {
            corFundo = '#1a73e8';
            corBorda = '#1557b0';
            corRaio = '#fbbc04';
            tituloModo = 'Ativo (Lista)';
        } else if (modoAtivo === 'desligado') {
            corFundo = '#64748b';
            corBorda = '#475569';
            corRaio = '#cbd5e1';
            tituloModo = 'Pausado';
        }

        if (chrome.action.setTitle) {
            const subtituloAcao = (comportamento === 'acoes_rapidas')
                ? '\n(1 clique: alternar modo | 2 cliques: abrir Opcoes)'
                : '\n(1 clique: abrir popup)';
            chrome.action.setTitle({
                title: 'Selecao/Copia Aprimorada - ' + tituloModo + subtituloAcao
            }).catch(() => { });
        }

        const tamanhos = [16, 32, 48, 128];
        const imageDataMap = {};

        for (let i = 0; i < tamanhos.length; i++) {
            const dim = tamanhos[i];
            const canvas = new OffscreenCanvas(dim, dim);
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            const escala = dim / 128;

            /* Passo 5.2: Fundo arredondado (rect x=6, y=6, w=116, h=116, rx=26) */
            ctx.fillStyle = corFundo;
            ctx.beginPath();
            ctx.roundRect(6 * escala, 6 * escala, 116 * escala, 116 * escala, 26 * escala);
            ctx.fill();

            ctx.strokeStyle = corBorda;
            ctx.lineWidth = Math.max(1, 4 * escala);
            ctx.stroke();

            /* Passo 5.3: Faixas documentais semi-transparentes */
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(24 * escala, 34 * escala, 46 * escala, 10 * escala, 3 * escala);
            ctx.roundRect(24 * escala, 54 * escala, 34 * escala, 10 * escala, 3 * escala);
            ctx.roundRect(24 * escala, 74 * escala, 40 * escala, 10 * escala, 3 * escala);
            ctx.fill();

            /* Passo 5.4: Desenho do Raiozinho Original (points: 78,20 44,68 68,68 54,108 100,56 74,56) */
            ctx.fillStyle = corRaio;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1, 3 * escala);
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(78 * escala, 20 * escala);
            ctx.lineTo(44 * escala, 68 * escala);
            ctx.lineTo(68 * escala, 68 * escala);
            ctx.lineTo(54 * escala, 108 * escala);
            ctx.lineTo(100 * escala, 56 * escala);
            ctx.lineTo(74 * escala, 56 * escala);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            imageDataMap[dim] = ctx.getImageData(0, 0, dim, dim);
        }

        chrome.action.setIcon({ imageData: imageDataMap }).catch(() => { });
    } catch (_) { }
}

// =====================================================================
// SECAO 6: LISTENERS DO CICLO DE VIDA E ROTEADOR DE MENSAGENS
// =====================================================================
/* Passo 6.1: Ao instalar ou atualizar a extensao, inicializar estado e injetar nas abas */
chrome.runtime.onInstalled.addListener(async () => {
    await sincronizarEstado();
});

/* Passo 6.2: Ao iniciar o perfil do navegador, garantir sincronizacao e icone */
chrome.runtime.onStartup.addListener(async () => {
    await sincronizarEstado();
});

/* Passo 6.3: Injetar e sincronizar automaticamente ao concluir o carregamento de abas e frames */
const mapaDebounceInjecaoTab = new Map();
function agendarInjecaoSeguraNaAba(tabId, frameIdsOpcional = null) {
    if (!tabId) return;
    const agora = Date.now();
    const chave = frameIdsOpcional ? `${tabId}_${frameIdsOpcional.join(',')}` : `${tabId}_all`;
    const ultimo = mapaDebounceInjecaoTab.get(chave) || 0;
    if ((agora - ultimo) < 350) return;
    mapaDebounceInjecaoTab.set(chave, agora);

    const target = (Array.isArray(frameIdsOpcional) && frameIdsOpcional.length > 0)
        ? { tabId, frameIds: frameIdsOpcional }
        : { tabId, allFrames: true };

    chrome.scripting.executeScript({
        target,
        files: [...ARQUIVOS_MODULO_COPIA]
    }).catch(() => {});
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab && tab.url) {
        try {
            if (/^(?:chrome|edge|about|devtools|view-source|chrome-extension):/i.test(tab.url)) return;
            const config = await obterConfiguracoesGerais();

            // Garante injecao complementar em subframes tardios (PDF.js / iframes dinamicos) com idempotencia O(1)
            if (config.modoTurbo !== 'desligado') {
                agendarInjecaoSeguraNaAba(tabId);
            }

            // Gerencia o CSS anti-ampulhetas do PJe se a URL corresponder aos padrões
            if (config.ativoAmpuletas !== false && urlCorrespondeAosPadroes(tab.url, config.urlsAmpuletas || [])) {
                chrome.scripting.insertCSS({
                    target: { tabId: tabId, allFrames: true },
                    files: [...ARQUIVOS_MODULO_CSS_PJE]
                }).catch(() => {});
            }
        } catch (_) {}
    }
});

/* Passo 6.3.1: Monitorar via webNavigation o carregamento concluido de subframes, iframes dinamicos e visualizadores de PDF */
if (typeof chrome !== 'undefined' && chrome.webNavigation) {
    const garantirInjecaoEmFrameNavegado = async (details) => {
        try {
            if (!details || !details.tabId) return;
            if (details.url && /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(details.url)) return;
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
            'monitorarUrlOriginalAbertura',
            'monitorarUrlAtualPagina',
            'criterioOrdenacaoGuias',
            'sentidoOrdenacaoGuias',
            'ordenarGuiasFixadas',
            'descarteGuiasInativasAtivo',
            'tempoInatividadeDescarteMinutos',
            'validacaoMatematicaAtiva',
            'tempoFlashBorderMs',
            'corFlashBorder',
            'converterCabecalhoPjeAtivo',
            'atalhoF1GeminiAtivo',
            'modoShiftCnj',
            'incluirSeparadorFinalAcumulador',
            'separadorTabelas',
            'promptF1Gemini',
            'tempoExibicaoAlertaMs',
            'separadorAcumulador'
        ];
        const mudouConfiguracao = chavesConfig.some(chave => Object.prototype.hasOwnProperty.call(changes, chave));
        if (mudouConfiguracao) {
            await sincronizarEstado();
        }
    }
});

/* Passo 6.4: Escutar mensagens operacionais dos Content Scripts (Alt+Clique em link,
 * Alt+Shift+Clique para download, tecla F1 para abertura do painel Google Gemini e
 * sincronizacao imediata solicitada pela tela de Opcoes). */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.acao !== 'string') return false;

    if (msg.acao === 'forcarSincronizacaoNuvem') {
        sincronizarEstado().then(() => {
            sendResponse({ ok: true });
        }).catch(() => {
            sendResponse({ ok: false });
        });
        return true;
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

    if (msg.acao === 'navegarAba' && (msg.direcao === 'anterior' || msg.direcao === 'proxima')) {
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

            const novoIdx = (msg.direcao === 'anterior')
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
                const urlAlvoNorm = normalizarUrlParaComparacao(msg.url);
                if (!urlAlvoNorm) {
                    sendResponse({ reutilizada: false });
                    return;
                }
                const windowId = sender && sender.tab ? sender.tab.windowId : undefined;
                const abas = await chrome.tabs.query(windowId ? { windowId } : {});
                const monitorarOrig = Boolean(config.monitorarUrlOriginalAbertura);
                const monitorarAtual = (config.monitorarUrlAtualPagina !== false);
                const abaExistente = abas.find(t => {
                    const reg = mapaAbasUrls.get(t.id);
                    if (reg && reg.duplicacaoManualPermitida) return false;
                    const uAtual = normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
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

if (msg.acao === 'fecharGuiasDuplicadasAgora') {
    (async () => {
        try {
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            const total = await fecharGuiasDuplicadas(winAlvo);
            sendResponse({ ok: true, totalFechadas: total });
        } catch (_) {
            sendResponse({ ok: false, totalFechadas: 0 });
        }
    })();
    return true;
}

if (msg.acao === 'ordenarGuiasAgora') {
    (async () => {
        try {
            const config = await obterConfiguracoesGerais();
            const configEfetivo = {
                ...config,
                criterioOrdenacaoGuias: msg.criterio || config.criterioOrdenacaoGuias || 'dominio',
                sentidoOrdenacaoGuias: msg.sentido || config.sentidoOrdenacaoGuias || 'dir_esq',
                ordenarGuiasFixadas: (msg.ordenarFixadas !== undefined) ? msg.ordenarFixadas : Boolean(config.ordenarGuiasFixadas)
            };
            let winAlvo = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
            if (!winAlvo && chrome.windows) {
                const ativa = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
                winAlvo = ativa ? ativa.id : null;
            }
            if (winAlvo) {
                await executarOrdenacaoGuias(winAlvo, configEfetivo);
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
            if (winAlvo) {
                await agruparGuiasPorDominio(winAlvo);
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
            const total = await desagruparGuias(winAlvo);
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
            if (winAlvo) {
                await desagruparGuias(winAlvo);
                await executarOrdenacaoGuias(winAlvo, {
                    criterioOrdenacaoGuias: 'ordem_criacao',
                    sentidoOrdenacaoGuias: 'esq_dir',
                    ordenarGuiasFixadas: false
                });
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
            const total = await descartarGuiasEmSegundoPlano(winAlvo);
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

if (msg.acao === 'abrirGeminiLateral' || msg.acao === 'abrirAssistenteIaLateral') {
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

            if (abaAlvoId && typeof msg.prompt === 'string' && msg.prompt.trim().length > 0) {
                const promptTxt = msg.prompt;
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

// =====================================================================
// SECAO 7: GERENCIAMENTO DE JANELAS E GUIAS DO NAVEGADOR
// (SINGLE WINDOW, REUTILIZACAO DE ABAS E ORDENACAO AUTOMATICA)
// =====================================================================

/*
 * FUNCAO: obterConfiguracoesGerais
 * OBJETIVO DE RECONSTRUCAO: Recuperar o objeto consolidado de configuracoes da
 * extensao a partir da memoria RAM rapida (storage.session) ou sincronizacao em nuvem.
 */
async function obterConfiguracoesGerais() {
    try {
        if (chrome.storage && chrome.storage.session) {
            const cached = await chrome.storage.session.get('cacheConfigJusGov');
            if (cached && cached.cacheConfigJusGov) {
                return cached.cacheConfigJusGov;
            }
        }
        if (chrome.storage && chrome.storage.sync) {
            return await chrome.storage.sync.get(null);
        }
        return {};
    } catch (_) {
        return {};
    }
}

/*
 * FUNCAO: normalizarUrlParaComparacao
 * OBJETIVO DE RECONSTRUCAO: Sanitizar URLs removendo barras finais, ordenando parametros
 * de busca e eliminando tokens efemeros de rastreamento (tracking como utm_* e fbclid)
 * a fim de comparar com precisao cirurgica URLs originais e atuais de abas judiciais.
 */
function normalizarUrlParaComparacao(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    try {
        const u = new URL(urlStr);
        let caminho = u.pathname;
        if (caminho.length > 1 && caminho.endsWith('/')) {
            caminho = caminho.slice(0, -1);
        }
        /* Remove parametros efemeros de rastreamento que geram falsos negativos em tribunais */
        const paramsParaRemover = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_cid', 'ts'];
        const params = new URLSearchParams(u.search);
        paramsParaRemover.forEach(p => params.delete(p));
        params.sort();
        const buscaLimpa = params.toString() ? ('?' + params.toString()) : '';
        return (u.origin + caminho + buscaLimpa).toLowerCase();
    } catch (_) {
        return urlStr.trim().toLowerCase();
    }
}

/*
 * FUNCAO: ehJanelaDeAutenticacaoOuCertificado
 * OBJETIVO DE RECONSTRUCAO: Identificar janelas e modais de login unificado (Gov.br, SSO),
 * dialogos de assinatura digital (Gov.br, ICP-Brasil, PJEOffice, SSO, Shodo) ou popups compactos de autenticacao,
 * impedindo que sejam forcadamente convertidos em guias para nao quebrar os scripts de retorno.
 */
function ehJanelaDeAutenticacaoOuCertificado(janela, urlStr, tituloStr) {
    if (!janela) return false;
    const texto = ((urlStr || '') + ' ' + (tituloStr || '')).toLowerCase();
    const padroesAuth = [
        'gov.br', 'pjeoffice', 'shodo', 'assinador', 'certificado',
        'login', 'oauth', 'openid', 'saml', 'autenticacao', 'auth',
        'sso', 'token', 'icp-brasil', 'identidade', 'acesso.gov.br',
        'validar', 'captcha', 'recaptcha', 'cf-chl'
    ];
    const ehAuthPorTexto = padroesAuth.some(termo => texto.includes(termo));
    if (ehAuthPorTexto) return true;

    if (janela.type === 'popup') {
        const largura = janela.width || 0;
        const altura = janela.height || 0;
        if (largura > 0 && largura <= 450 && altura > 0 && altura <= 350) {
            return true;
        }
    }
    return false;
}

/* Passo 7.1: Mapa em memoria e sessao de URLs das abas: tabId -> { urlOriginal, urlAtual, criadaEm, duplicacaoManualPermitida } */
const mapaAbasUrls = new Map();

/* Persistencia e restauracao do mapa de abas via chrome.storage.session */
async function carregarMapaAbasSession() {
    try {
        if (chrome.storage && chrome.storage.session) {
            const res = await chrome.storage.session.get('mapaAbasUrlsSession');
            if (res && res.mapaAbasUrlsSession && typeof res.mapaAbasUrlsSession === 'object') {
                for (const [idStr, val] of Object.entries(res.mapaAbasUrlsSession)) {
                    mapaAbasUrls.set(Number(idStr), val);
                }
            }
        }
    } catch (_) { }
}

let timerSalvarSessionAbas = null;
function salvarMapaAbasSessionDebounced() {
    if (timerSalvarSessionAbas) clearTimeout(timerSalvarSessionAbas);
    timerSalvarSessionAbas = setTimeout(async () => {
        timerSalvarSessionAbas = null;
        try {
            if (chrome.storage && chrome.storage.session) {
                const obj = {};
                for (const [id, val] of mapaAbasUrls.entries()) {
                    obj[id] = val;
                }
                await chrome.storage.session.set({ mapaAbasUrlsSession: obj });
            }
        } catch (_) { }
    }, 150);
}

/* Inicializacao do mapa de abas no boot do Service Worker */
(async () => {
    await carregarMapaAbasSession();
    if (chrome.tabs && typeof chrome.tabs.query === 'function') {
        try {
            const abas = await chrome.tabs.query({});
            if (Array.isArray(abas)) {
                const agora = Date.now();
                abas.forEach((t) => {
                    const u = normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                    if (u && u !== 'about:blank' && !u.startsWith('chrome://')) {
                        const existente = mapaAbasUrls.get(t.id);
                        if (!existente) {
                            mapaAbasUrls.set(t.id, {
                                urlOriginal: u,
                                urlAtual: u,
                                criadaEm: agora,
                                duplicacaoManualPermitida: false
                            });
                        } else {
                            existente.urlAtual = u;
                            if (!existente.urlOriginal) existente.urlOriginal = u;
                            mapaAbasUrls.set(t.id, existente);
                        }
                    }
                });
                salvarMapaAbasSessionDebounced();
            }
        } catch (_) { }
    }
})();

/* Passo 7.2: Temporizador e metodo de ordenacao debounced de abas */
let timerOrdenacaoAbas = null;
let estaOrdenandoGuias = false;

function agendarOrdenacaoAbas(windowId, config) {
    if (!windowId || !config || !config.criterioOrdenacaoGuias || config.criterioOrdenacaoGuias === 'nenhum') return;
    if (timerOrdenacaoAbas) clearTimeout(timerOrdenacaoAbas);
    timerOrdenacaoAbas = setTimeout(async () => {
        timerOrdenacaoAbas = null;
        try {
            await executarOrdenacaoGuias(windowId, config);
        } catch (_) { }
    }, 450);
}

/*
 * FUNCAO: agruparGuiasPorDominio
 * OBJETIVO DE RECONSTRUCAO: Usar a API nativa modernissima do Chrome (Tab Groups API)
 * para agrupar automaticamente abas do mesmo tribunal/dominio com cores distintas.
 */
async function agruparGuiasPorDominio(windowId) {
    if (!chrome.tabs || typeof chrome.tabs.group !== 'function') return 0;
    try {
        const abas = await chrome.tabs.query({ windowId });
        if (!abas || abas.length === 0) return 0;

        const gruposPorHost = new Map();
        for (const t of abas) {
            if (t.pinned) continue;
            const u = t.url || t.pendingUrl || '';
            let host = 'Outros';
            try {
                const parsed = new URL(u);
                if (parsed.protocol.startsWith('http')) {
                    host = parsed.hostname.replace(/^www\./, '');
                }
            } catch (_) { }
            if (!gruposPorHost.has(host)) {
                gruposPorHost.set(host, []);
            }
            gruposPorHost.get(host).push(t.id);
        }

        const coresDisponiveis = ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
        let corIdx = 0;
        let totalGrupos = 0;

        for (const [host, tabIds] of gruposPorHost.entries()) {
            if (tabIds.length >= 1) {
                try {
                    const groupId = await chrome.tabs.group({ tabIds });
                    if (chrome.tabGroups && typeof chrome.tabGroups.update === 'function') {
                        const cor = coresDisponiveis[corIdx % coresDisponiveis.length];
                        corIdx++;
                        await chrome.tabGroups.update(groupId, {
                            title: host.toUpperCase(),
                            color: cor
                        });
                        totalGrupos++;
                    }
                } catch (_) { }
            }
        }
        return totalGrupos;
    } catch (_) {
        return 0;
    }
}

/*
 * FUNCAO: desagruparGuias
 * OBJETIVO DE RECONSTRUCAO: Desagrupar todas as guias da janela ativa usando a Tab Groups API
 * nativa do Chrome (chrome.tabs.ungroup), dissolvendo os grupos de abas sem fecha-las.
 */
async function desagruparGuias(windowId = null) {
    if (!chrome.tabs || typeof chrome.tabs.ungroup !== 'function') return 0;
    try {
        const query = windowId ? { windowId } : {};
        const abas = await chrome.tabs.query(query);
        if (!abas || abas.length === 0) return 0;
        const noneId = (chrome.tabGroups && chrome.tabGroups.TAB_GROUP_ID_NONE !== undefined) ? chrome.tabGroups.TAB_GROUP_ID_NONE : -1;
        const agrupadas = abas.filter(t => t.groupId !== undefined && t.groupId !== noneId && t.groupId !== -1).map(t => t.id);
        if (agrupadas.length > 0) {
            try {
                await chrome.tabs.ungroup(agrupadas);
            } catch (_) {
                for (const id of agrupadas) {
                    try { await chrome.tabs.ungroup(id); } catch (__) { }
                }
            }
        }
        return agrupadas.length;
    } catch (_) {
        return 0;
    }
}

/*
 * FUNCAO: fecharGuiasDuplicadas
 * OBJETIVO DE RECONSTRUCAO: Fechar em lote todas as copias duplicadas de abas abertas
 * na janela ativa, mantendo exclusivamente a aba mais antiga e liberando recursos.
 */
async function fecharGuiasDuplicadas(windowId = null) {
    if (!chrome.tabs || typeof chrome.tabs.query !== 'function') return 0;
    try {
        const config = await obterConfiguracoesGerais();
        const monOrig = Boolean(config.monitorarUrlOriginalAbertura);
        const monAtual = (config.monitorarUrlAtualPagina !== false);

        const query = windowId ? { windowId } : {};
        const abas = await chrome.tabs.query(query);
        if (!abas || abas.length <= 1) return 0;

        const chavesVistas = new Set();
        const idsParaFechar = [];

        for (const t of abas) {
            const uAtual = normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
            const reg = mapaAbasUrls.get(t.id);
            const uOrig = (reg && reg.urlOriginal) ? reg.urlOriginal : uAtual;

            const chaves = [];
            if (monAtual && uAtual && uAtual !== 'about:blank' && !uAtual.startsWith('chrome://')) {
                chaves.push(`atual:${uAtual}`);
            }
            if (monOrig && uOrig && uOrig !== 'about:blank' && !uOrig.startsWith('chrome://')) {
                chaves.push(`orig:${uOrig}`);
            }

            if (chaves.length === 0) continue;

            const duplicada = chaves.some(k => chavesVistas.has(k));
            if (duplicada) {
                idsParaFechar.push(t.id);
            } else {
                chaves.forEach(k => chavesVistas.add(k));
            }
        }

        if (idsParaFechar.length > 0) {
            await chrome.tabs.remove(idsParaFechar);
        }
        return idsParaFechar.length;
    } catch (_) {
        return 0;
    }
}

/*
 * FUNCAO: descartarGuiasEmSegundoPlano
 * OBJETIVO DE RECONSTRUCAO: Usar a API moderna chrome.tabs.discard do Chrome para
 * descarregar da memoria RAM abas pesadas inativas sem fecha-las da barra.
 */
async function descartarGuiasEmSegundoPlano(windowId = null) {
    if (!chrome.tabs || typeof chrome.tabs.discard !== 'function') return 0;
    try {
        const query = windowId ? { windowId } : {};
        const abas = await chrome.tabs.query(query);
        let descartadas = 0;
        for (const t of abas) {
            if (t.active || t.pinned || t.audible || t.discarded) continue;
            try {
                await chrome.tabs.discard(t.id);
                descartadas++;
            } catch (_) { }
        }
        return descartadas;
    } catch (_) {
        return 0;
    }
}

async function executarOrdenacaoGuias(windowId, config) {
    if (!windowId || !config || !config.criterioOrdenacaoGuias || config.criterioOrdenacaoGuias === 'nenhum') return;
    if (estaOrdenandoGuias) return;
    estaOrdenandoGuias = true;

    try {
        const criterio = config.criterioOrdenacaoGuias;
        const sentido = config.sentidoOrdenacaoGuias || 'dir_esq';
        const ordenarFixadas = Boolean(config.ordenarGuiasFixadas);

        if (criterio === 'agrupar_dominio') {
            await agruparGuiasPorDominio(windowId);
            return;
        }

        const abas = await chrome.tabs.query({ windowId: windowId });
        if (!abas || abas.length <= 1) return;

        const abasAlvo = abas.filter(t => (ordenarFixadas ? true : !t.pinned));
        if (abasAlvo.length <= 1) return;

        /* Dissolve grupos existentes para permitir a movimentacao ordenada livre sem erros de Tab Groups do Chrome */
        const temGrupos = abasAlvo.some(t => t.groupId !== undefined && t.groupId > 0);
        if (temGrupos) {
            await desagruparGuias(windowId);
        }

        const extrairChave = (t) => {
            const u = t.url || t.pendingUrl || '';
            if (criterio === 'url') return u.toLowerCase();
            if (criterio === 'titulo') return (t.title || '').toLowerCase();
            if (criterio === 'dominio') {
                try { return new URL(u).hostname.toLowerCase(); } catch (_) { return u.toLowerCase(); }
            }
            if (criterio === 'tempo_acesso') {
                return t.lastAccessed || 0;
            }
            if (criterio === 'ordem_criacao') {
                return t.id || 0;
            }
            return u.toLowerCase();
        };

        const abasOrdenadas = [...abasAlvo].sort((a, b) => {
            const chaveA = extrairChave(a);
            const chaveB = extrairChave(b);
            if (typeof chaveA === 'number' && typeof chaveB === 'number') {
                return (sentido === 'dir_esq') ? (chaveB - chaveA) : (chaveA - chaveB);
            }
            const cmp = String(chaveA).localeCompare(String(chaveB));
            return (sentido === 'dir_esq') ? -cmp : cmp;
        });

        const indexInicial = abasAlvo[0].index;

        /* Move as guias ordenadas uma a uma sequencialmente para os indices alvo exatos */
        for (let i = 0; i < abasOrdenadas.length; i++) {
            const t = abasOrdenadas[i];
            const novoIdx = indexInicial + i;
            try {
                await chrome.tabs.move(t.id, { index: novoIdx });
            } catch (_) { }
        }
    } finally {
        setTimeout(() => {
            estaOrdenandoGuias = false;
        }, 300);
    }
}

/* Passo 7.3: Single Window - Bloquear abertura de novas janelas/popups e forcar novas guias na janela ativa */
if (chrome.windows && chrome.windows.onCreated) {
    chrome.windows.onCreated.addListener(async (janela) => {
        try {
            const config = await obterConfiguracoesGerais();
            if (config.bloquearNovasJanelas === false) return;

            const todasJanelas = await chrome.windows.getAll({ windowTypes: ['normal'] });
            const janelaPrincipal = todasJanelas.find(w => w.id !== janela.id && w.state !== 'minimized') || todasJanelas.find(w => w.id !== janela.id);
            if (!janelaPrincipal) return;

            let abasJanela = await chrome.tabs.query({ windowId: janela.id });
            if (!abasJanela || abasJanela.length === 0) {
                await new Promise(r => setTimeout(r, 60));
                abasJanela = await chrome.tabs.query({ windowId: janela.id });
            }
            if (!abasJanela || abasJanela.length === 0) return;

            const primeiraAba = abasJanela[0];
            const urlAba = primeiraAba.url || primeiraAba.pendingUrl || '';
            const tituloAba = primeiraAba.title || '';

            /* Preserva janelas de autenticacao, certificados e SSO */
            if (config.preservarJanelasAutenticacao !== false && ehJanelaDeAutenticacaoOuCertificado(janela, urlAba, tituloAba)) {
                return;
            }

            const emPrimeiroPlano = (config.abaEmPrimeiroPlano !== undefined)
                ? Boolean(config.abaEmPrimeiroPlano)
                : (config.abaEmSegundoPlano === false);

            for (let i = 0; i < abasJanela.length; i++) {
                const t = abasJanela[i];
                const urlAlvo = t.url || t.pendingUrl || '';

                if (urlAlvo && urlAlvo !== 'about:blank' && !urlAlvo.startsWith('chrome://')) {
                    try {
                        await chrome.tabs.move(t.id, { windowId: janelaPrincipal.id, index: -1 });
                        if (emPrimeiroPlano) {
                            await chrome.tabs.update(t.id, { active: true });
                        }
                    } catch (_) {
                        await chrome.tabs.create({
                            windowId: janelaPrincipal.id,
                            url: urlAlvo,
                            active: emPrimeiroPlano
                        });
                    }
                } else {
                    /* URL pendente de resolucao: tenta mover a aba ou aguarda o primeiro evento de URL */
                    let moveu = false;
                    try {
                        await chrome.tabs.move(t.id, { windowId: janelaPrincipal.id, index: -1 });
                        if (!emSegundoPlano) {
                            await chrome.tabs.update(t.id, { active: true });
                        }
                        moveu = true;
                    } catch (_) { }

                    if (!moveu) {
                        const tratarUrlPendente = async (tabIdAtualizado, changeInfo) => {
                            if (tabIdAtualizado === t.id && (changeInfo.url || changeInfo.title)) {
                                chrome.tabs.onUpdated.removeListener(tratarUrlPendente);
                                const uNova = changeInfo.url || '';
                                if (config.preservarJanelasAutenticacao !== false && ehJanelaDeAutenticacaoOuCertificado(janela, uNova, changeInfo.title || '')) {
                                    return;
                                }
                                if (uNova && uNova !== 'about:blank' && !uNova.startsWith('chrome://')) {
                                    try {
                                        await chrome.tabs.move(t.id, { windowId: janelaPrincipal.id, index: -1 });
                                        if (!emSegundoPlano) {
                                            await chrome.tabs.update(t.id, { active: true });
                                        }
                                    } catch (_) {
                                        await chrome.tabs.create({
                                            windowId: janelaPrincipal.id,
                                            url: uNova,
                                            active: !emSegundoPlano
                                        });
                                    }
                                }
                                try { await chrome.windows.remove(janela.id); } catch (_) { }
                            }
                        };
                        chrome.tabs.onUpdated.addListener(tratarUrlPendente);
                        setTimeout(() => {
                            try { chrome.tabs.onUpdated.removeListener(tratarUrlPendente); } catch (_) { }
                        }, 10000);
                        return;
                    }
                }
            }

            try {
                await chrome.windows.remove(janela.id);
            } catch (_) { }

            try {
                await chrome.windows.update(janelaPrincipal.id, { focused: true });
            } catch (_) { }
        } catch (_) { }
    });
}

/* Passo 7.4: Rastreamento de URLs e Anti-Duplicacao na criacao de abas */
if (chrome.tabs && chrome.tabs.onCreated) {
    chrome.tabs.onCreated.addListener(async (tab) => {
        try {
            const urlInicial = normalizarUrlParaComparacao(tab.url || tab.pendingUrl || '');
            const agora = Date.now();

            /* Detectar duplicacao manual disparada pelo menu nativo de contexto da guia do Chrome ("Duplicar") */
            let duplicacaoManualPermitida = false;
            if (tab.openerTabId) {
                try {
                    const abaOrigem = await chrome.tabs.get(tab.openerTabId);
                    if (abaOrigem) {
                        const urlOrigem = normalizarUrlParaComparacao(abaOrigem.url || abaOrigem.pendingUrl || '');
                        if (tab.index === abaOrigem.index + 1 && urlInicial && urlInicial === urlOrigem) {
                            duplicacaoManualPermitida = true;
                        }
                    }
                } catch (_) { }
            }

            mapaAbasUrls.set(tab.id, {
                urlOriginal: urlInicial || '',
                urlAtual: urlInicial || '',
                criadaEm: agora,
                duplicacaoManualPermitida
            });
            salvarMapaAbasSessionDebounced();

            const config = await obterConfiguracoesGerais();
            if (!duplicacaoManualPermitida && config.reutilizarAbasAbertas === true && urlInicial && urlInicial !== 'about:blank' && !urlInicial.startsWith('chrome://')) {
                const abasJanela = await chrome.tabs.query({ windowId: tab.windowId });
                const monOrig = Boolean(config.monitorarUrlOriginalAbertura);
                const monAtual = (config.monitorarUrlAtualPagina !== false);
                const abaDuplicada = abasJanela.find((t) => {
                    if (t.id === tab.id) return false;
                    const reg = mapaAbasUrls.get(t.id);
                    if (reg && reg.duplicacaoManualPermitida) return false;
                    const uAtual = normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                    const uOrig = (reg && reg.urlOriginal) ? reg.urlOriginal : uAtual;
                    if (monAtual && urlInicial === uAtual) return true;
                    if (monOrig && urlInicial === uOrig) return true;
                    return false;
                });

                if (abaDuplicada) {
                    const emPrimeiroPlano = (config.abaEmPrimeiroPlano !== undefined)
                        ? Boolean(config.abaEmPrimeiroPlano)
                        : (config.abaEmSegundoPlano === false);
                    if (emPrimeiroPlano) {
                        await chrome.tabs.update(abaDuplicada.id, { active: true });
                    }
                    await chrome.tabs.remove(tab.id);
                    return;
                }
            }

            if (config.criterioOrdenacaoGuias && config.criterioOrdenacaoGuias !== 'nenhum') {
                agendarOrdenacaoAbas(tab.windowId, config);
            }
        } catch (_) { }
    });
}

/* Passo 7.5: Atualizacao de URLs atuais, anti-duplicacao assincrona e re-ordenacao ao carregar paginas */
if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        try {
            if (changeInfo.url) {
                const uNova = normalizarUrlParaComparacao(changeInfo.url);
                let reg = mapaAbasUrls.get(tabId);
                if (!reg) {
                    reg = {
                        urlOriginal: uNova,
                        urlAtual: uNova,
                        criadaEm: Date.now(),
                        duplicacaoManualPermitida: false
                    };
                } else {
                    /* Preservar estritamente a URL original de abertura: nunca sobrescrever uma vez registrada */
                    if (!reg.urlOriginal || reg.urlOriginal === 'about:blank' || reg.urlOriginal.startsWith('chrome://')) {
                        reg.urlOriginal = uNova;
                    }
                    reg.urlAtual = uNova;
                }
                mapaAbasUrls.set(tabId, reg);
                salvarMapaAbasSessionDebounced();

                const config = await obterConfiguracoesGerais();

                /* Anti-duplicacao ativa ao carregar nova URL */
                if (!reg.duplicacaoManualPermitida && config.reutilizarAbasAbertas === true && uNova && uNova !== 'about:blank' && !uNova.startsWith('chrome://')) {
                    const abasJanela = await chrome.tabs.query({ windowId: tab.windowId });
                    const monOrig = Boolean(config.monitorarUrlOriginalAbertura);
                    const monAtual = (config.monitorarUrlAtualPagina !== false);
                    const abaExistente = abasJanela.find((t) => {
                        if (t.id === tabId) return false;
                        const regOutra = mapaAbasUrls.get(t.id);
                        if (regOutra && regOutra.duplicacaoManualPermitida) return false;
                        const uOutra = normalizarUrlParaComparacao(t.url || t.pendingUrl || '');
                        const uOrigOutra = (regOutra && regOutra.urlOriginal) ? regOutra.urlOriginal : uOutra;
                        if (monAtual && uNova === uOutra) return true;
                        if (monOrig && uNova === uOrigOutra) return true;
                        return false;
                    });

                    if (abaExistente) {
                        const emPrimeiroPlano = (config.abaEmPrimeiroPlano !== undefined)
                            ? Boolean(config.abaEmPrimeiroPlano)
                            : (config.abaEmSegundoPlano === false);
                        if (emPrimeiroPlano) {
                            await chrome.tabs.update(abaExistente.id, { active: true });
                        }
                        try {
                            await chrome.tabs.remove(tabId);
                        } catch (_) { }
                        return;
                    }
                }
            }

            if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.url) {
                const config = await obterConfiguracoesGerais();
                if (config.criterioOrdenacaoGuias && config.criterioOrdenacaoGuias !== 'nenhum') {
                    agendarOrdenacaoAbas(tab.windowId, config);
                }
            }
        } catch (_) { }
    });
}

/* Passo 7.6: Limpeza do mapa de abas quando uma aba e fechada */
if (chrome.tabs && chrome.tabs.onRemoved) {
    chrome.tabs.onRemoved.addListener((tabId) => {
        mapaAbasUrls.delete(tabId);
        salvarMapaAbasSessionDebounced();
    });
}

/* Passo 7.7: Economizador de Memoria Automatico (Descarte de Guias Inativas > Minutos configurados) */
setInterval(async () => {
    try {
        const config = await obterConfiguracoesGerais();
        if (config.descarteGuiasInativasAtivo) {
            const minutos = Number(config.tempoInatividadeDescarteMinutos) || 20;
            const limiteTempoMs = minutos * 60 * 1000;
            const agora = Date.now();
            const abas = await chrome.tabs.query({});
            for (const t of abas) {
                if (t.active || t.pinned || t.audible || t.discarded) continue;
                const ultimoAcesso = t.lastAccessed || 0;
                if (ultimoAcesso > 0 && (agora - ultimoAcesso) > limiteTempoMs) {
                    try {
                        await chrome.tabs.discard(t.id);
                    } catch (_) { }
                }
            }
        }
    } catch (_) { }
}, 5 * 60 * 1000);
