/* ==========================================================================
 * ARQUIVO: src/cfg/cfg-defaults.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CONFIGURAÇÃO: JusGovBR Config - Definições Padrão de Fábrica e Parâmetros do Motor
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/cfg-defaults.js
 * - Objeto Exportado: window.JusGovCfgDefaults / self.JusGovCfgDefaults (congelado via Object.freeze)
 * - Estruturas Exportadas: CONFIGURACAO_MOTOR, PADROES_DEFAULT_TURBO, PADROES_DEFAULT_AMPULETAS,
 *   PADROES_DEFAULT_REGRAS_MAPEAMENTO, PRESETS_MARCADOR_COLADO, PADROES_DEFAULT_STORAGE
 * - Padrão Arquitetural: UMD (Universal Module Definition) compatível com Service Worker (MV3),
 *   Content Scripts, Options, Popup e suíte de testes Headless.
 * - Regras / Seções: Seção 6.101 (ARQ-02 / REFAT-02), Seção 6.105 (FEAT-21), Seção 6.109 (BUG-42), Seção 6.112 (FEAT-23)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE PRIMÁRIA:
 *    Centralizar todas as configurações padrão imutáveis, limites operacionais do motor
 *    (`CONFIGURACAO_MOTOR`), tolerâncias geométricas, durações de alertas e presets visuais,
 *    eliminando números mágicos e divergências entre `options.js`, `background.js`, `lib-config.js`
 *    e `copia-selecionar.js`.
 * 2) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Definir `CONFIGURACAO_MOTOR` com limites da janela deslizante O(1), distâncias de arrasto,
 *               tolerâncias geométricas `dx/dy` para cliques simples (BUG-42) e janelas temporais.
 *    Passo 1.2: Definir listas de URLs padrão de fábrica (`PADROES_DEFAULT_TURBO` e `PADROES_DEFAULT_AMPULETAS`).
 *    Passo 1.3: Definir `PRESETS_MARCADOR_COLADO` para os marcadores permanentes de conteúdo colado (FEAT-21).
 *    Passo 1.4: Definir `PADROES_DEFAULT_STORAGE` com todas as chaves e valores iniciais de fábrica.
 *    Passo 1.5: Congelar recursivamente com `Object.freeze` e expor em `JusGovCfgDefaults`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const exportado = fabrica();
        raiz.JusGovCfgDefaults = exportado;
        if (typeof window !== 'undefined') {
            window.JusGovCfgDefaults = exportado;
        }
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Passo 1.1: Limites operacionais e tolerâncias físicas do motor de seleção e cópia */
    const CONFIGURACAO_MOTOR = Object.freeze({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        TOLERANCIA_MAXIMA_DX_CLIQUE_PX: 24,
        TOLERANCIA_MAXIMA_DY_CLIQUE_PX: 12,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: -1,
        TEMPO_CONFERENCIA_DOCUMENTOS_MS: -1,
        TEMPO_FLASH_BORDER_MS: -1,
        LIMITE_SLOTS_CLIPBOARD_INTERNO: 2,
        LIMITE_MAXIMO_CONTADOR_OPERACIONAL: 900000000
    });

    /* Passo 1.2: Leitura desacoplada das personalizações padrão e perfis a partir de src/cfg/perfis.json
     * Mantém apenas constantes estruturais vazias caso o JSON ainda esteja em carregamento assíncrono. */
    const PADROES_DEFAULT_REGRAS_MAPEAMENTO = Object.freeze([]);

    const CATALOGO_PERFIS_MINIMO = Object.freeze({
        versaoEsquema: 1,
        perfilPadraoId: 'padrao',
        chavesGlobais: Object.freeze(['regrasMapeamentoElementos', 'urlsTurbo', 'urlsTurboExcecoes', 'perfilAtivoId', 'listaPerfis']),
        configPadrao: Object.freeze({}),
        perfisPredefinidos: Object.freeze([
            Object.freeze({ id: 'padrao', nome: 'Padrão', predefinido: true, sobrescritas: Object.freeze({}) }),
            Object.freeze({ id: 'trabalho', nome: 'Trabalho', predefinido: true, sobrescritas: Object.freeze({}) }),
            Object.freeze({ id: 'casa', nome: 'Casa', predefinido: true, sobrescritas: Object.freeze({}) }),
            Object.freeze({ id: 'estudo', nome: 'Estudo', aliases: Object.freeze(['estudar']), predefinido: true, sobrescritas: Object.freeze({}) }),
            Object.freeze({ id: 'leitura', nome: 'Leitura / Pesquisa', aliases: Object.freeze(['leitura', 'pesquisa']), predefinido: true, sobrescritas: Object.freeze({}) }),
            Object.freeze({ id: 'reuniao', nome: 'Apresentação / Reunião', aliases: Object.freeze(['reuniao', 'apresentacao']), predefinido: true, sobrescritas: Object.freeze({}) })
        ])
    });

    function clonarValorConfig(valor) {
        if (Array.isArray(valor)) return [...valor];
        if (valor && typeof valor === 'object') {
            const out = {};
            const keys = Object.keys(valor);
            for (let i = 0; i < keys.length; i++) {
                out[keys[i]] = clonarValorConfig(valor[keys[i]]);
            }
            return out;
        }
        return valor;
    }

    function congelarCatalogoPerfis(bruto) {
        const origem = (bruto && typeof bruto === 'object') ? bruto : CATALOGO_PERFIS_MINIMO;
        const cfgObj = (origem.configPadrao && typeof origem.configPadrao === 'object') ? origem.configPadrao : {};
        const cfgClone = {};
        const cfgKeys = Object.keys(cfgObj);
        for (let i = 0; i < cfgKeys.length; i++) {
            const k = cfgKeys[i];
            const v = cfgObj[k];
            cfgClone[k] = Array.isArray(v) ? Object.freeze([...v]) : v;
        }
        const configPadrao = Object.freeze(cfgClone);

        const listaBruta = Array.isArray(origem.perfisPredefinidos) && origem.perfisPredefinidos.length > 0
            ? origem.perfisPredefinidos
            : CATALOGO_PERFIS_MINIMO.perfisPredefinidos;
        const perfisPredefinidos = Object.freeze(listaBruta.map((p) => Object.freeze({
            id: String(p.id || 'padrao'),
            nome: String(p.nome || p.id || 'Padrão'),
            aliases: Object.freeze(Array.isArray(p.aliases) ? [...p.aliases] : []),
            predefinido: p.predefinido !== false,
            sobrescritas: Object.freeze(clonarValorConfig(p.sobrescritas || {}))
        })));

        const chavesGlobais = Object.freeze(
            Array.isArray(origem.chavesGlobais) && origem.chavesGlobais.length > 0
                ? [...origem.chavesGlobais]
                : ['regrasMapeamentoElementos', 'urlsTurbo', 'urlsTurboExcecoes', 'perfilAtivoId', 'listaPerfis']
        );

        return Object.freeze({
            versaoEsquema: Number(origem.versaoEsquema || 1),
            perfilPadraoId: String(origem.perfilPadraoId || 'padrao'),
            chavesGlobais,
            configPadrao,
            perfisPredefinidos
        });
    }

    const DADOS_FORENSES_MINIMO = Object.freeze({
        versaoEsquema: 1,
        especiesInss: Object.freeze({}),
        tribunaisCnj: Object.freeze({
            RAMOS: Object.freeze({}),
            TRIBUNAIS_FEDERAIS: Object.freeze({}),
            TRIBUNAIS_TRABALHO: Object.freeze({}),
            TRIBUNAIS_ESTADUAIS_E_ELEITORAIS: Object.freeze({})
        }),
        regioesFiscaisCpf: Object.freeze({})
    });

    const REGRAS_SISTEMA_MINIMO = Object.freeze({
        versaoEsquema: 1,
        niveisFiltroHtml: Object.freeze({}),
        presetsMarcadorColado: Object.freeze({
            verde_forense: Object.freeze({ id: 'verde_forense', nome: 'Verde Forense Suave', corContorno: '#0d9488', corFundo: '#ccfbf1', opacidadeFundo: 0.28, estiloBadge: 'sobrescrito' })
        }),
        excecoesAutenticacao: Object.freeze({ larguraMaxPopup: 820, alturaMaxPopup: 750, dominiosAuth: Object.freeze([]), regexFronteiraAuth: '' }),
        antiDuplicacao: Object.freeze({ paramsRemover: Object.freeze([]) }),
        ordenacaoGuias: Object.freeze({ sufixosSld: Object.freeze([]), paletaGrupos: Object.freeze(['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'purple', 'pink']) }),
        manutencao: Object.freeze({ idadesLimpezaMs: Object.freeze({}) }),
        iconeExtensaoPaletas: Object.freeze({}),
        sistemasJudiciais: Object.freeze([])
    });

    function removerComentariosCabecalhoJson(texto) {
        return String(texto || '')
            .replace(/^\uFEFF/, '')
            .replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '')
            .trim();
    }

    function parsearJsonComComentarios(texto) {
        const limpo = removerComentariosCabecalhoJson(texto);
        return limpo ? JSON.parse(limpo) : null;
    }

    function lerPreloadOuRequireJson(chaveGlobal, caminhoRelativo) {
        try {
            const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
            if (g && g[chaveGlobal] && typeof g[chaveGlobal] === 'object') {
                return g[chaveGlobal];
            }
        } catch (_) { }
        try {
            if (typeof module === 'object' && module.exports && typeof require === 'function') {
                return require(caminhoRelativo);
            }
        } catch (_) {
            try {
                if (typeof require === 'function' && typeof __dirname === 'string') {
                    const fsMod = require('fs');
                    const pathMod = require('path');
                    const bruto = fsMod.readFileSync(pathMod.resolve(__dirname, caminhoRelativo), 'utf8');
                    return parsearJsonComComentarios(bruto);
                }
            } catch (_) { }
        }
        return null;
    }

    async function buscarJsonEmDisco(chaveGlobal, nomeArquivo, chromeApi = null) {
        const emCache = lerPreloadOuRequireJson(chaveGlobal, `./${nomeArquivo}`);
        if (emCache) return emCache;
        if (typeof fetch !== 'function') return null;

        const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
        const urlsCandidatas = [];
        if (apiChrome && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
            urlsCandidatas.push(apiChrome.runtime.getURL(`src/cfg/${nomeArquivo}`));
        }
        urlsCandidatas.push(nomeArquivo, `./src/cfg/${nomeArquivo}`, `../cfg/${nomeArquivo}`);

        const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
        for (let i = 0; i < urlsCandidatas.length; i++) {
            try {
                const resp = await fetch(urlsCandidatas[i]);
                if (resp && resp.ok) {
                    const txt = await resp.text();
                    const json = parsearJsonComComentarios(txt);
                    if (json && typeof json === 'object') {
                        if (g) g[chaveGlobal] = json;
                        return json;
                    }
                }
            } catch (_) { }
        }

        /* Fallback seguro para Content Scripts sem exposicao em web_accessible_resources (Privacidade Chrome Web Store) */
        if (apiChrome && apiChrome.runtime && typeof apiChrome.runtime.sendMessage === 'function') {
            try {
                const respIpc = await new Promise((resolve) => {
                    apiChrome.runtime.sendMessage({ acao: 'OBTER_JSON_ESTATICO', arquivo: nomeArquivo }, (r) => {
                        if (apiChrome.runtime && apiChrome.runtime.lastError) {
                            resolve(null);
                            return;
                        }
                        resolve(r || null);
                    });
                });
                if (respIpc && respIpc.ok && respIpc.dados && typeof respIpc.dados === 'object') {
                    if (g) g[chaveGlobal] = respIpc.dados;
                    return respIpc.dados;
                }
            } catch (_) { }
        }
        return null;
    }

    let catalogoPerfisAtivo = (() => {
        const bruto = lerPreloadOuRequireJson('__JUSGOV_PERFIS_JSON__', './perfis.json');
        return bruto ? congelarCatalogoPerfis(bruto) : null;
    })();
    let dadosForensesAtivo = lerPreloadOuRequireJson('__JUSGOV_DADOS_FORENSES_JSON__', './dados-forenses.json');
    let regrasSistemaAtivo = lerPreloadOuRequireJson('__JUSGOV_REGRAS_SISTEMA_JSON__', './regras-sistema.json');

    let promessaCarregamentoPerfis = null;
    let promessaCarregamentoForenses = null;
    let promessaCarregamentoRegras = null;

    async function carregarCatalogoPerfisJson(chromeApi = null) {
        const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
        if (!catalogoPerfisAtivo && g && g.__JUSGOV_PERFIS_JSON__) {
            catalogoPerfisAtivo = congelarCatalogoPerfis(g.__JUSGOV_PERFIS_JSON__);
        }
        if (catalogoPerfisAtivo) return catalogoPerfisAtivo;
        if (promessaCarregamentoPerfis) return promessaCarregamentoPerfis;

        promessaCarregamentoPerfis = (async () => {
            const json = await buscarJsonEmDisco('__JUSGOV_PERFIS_JSON__', 'perfis.json', chromeApi);
            if (json) {
                catalogoPerfisAtivo = congelarCatalogoPerfis(json);
                return catalogoPerfisAtivo;
            }
            return catalogoPerfisAtivo || CATALOGO_PERFIS_MINIMO;
        })();

        try {
            return await promessaCarregamentoPerfis;
        } finally {
            promessaCarregamentoPerfis = null;
        }
    }

    async function carregarDadosForensesJson(chromeApi = null) {
        const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
        if (!dadosForensesAtivo && g && g.__JUSGOV_DADOS_FORENSES_JSON__) {
            dadosForensesAtivo = g.__JUSGOV_DADOS_FORENSES_JSON__;
        }
        if (dadosForensesAtivo) return dadosForensesAtivo;
        if (promessaCarregamentoForenses) return promessaCarregamentoForenses;

        promessaCarregamentoForenses = (async () => {
            const json = await buscarJsonEmDisco('__JUSGOV_DADOS_FORENSES_JSON__', 'dados-forenses.json', chromeApi);
            if (json) {
                dadosForensesAtivo = json;
                return dadosForensesAtivo;
            }
            return dadosForensesAtivo || DADOS_FORENSES_MINIMO;
        })();

        try {
            return await promessaCarregamentoForenses;
        } finally {
            promessaCarregamentoForenses = null;
        }
    }

    async function carregarRegrasSistemaJson(chromeApi = null) {
        const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
        if (!regrasSistemaAtivo && g && g.__JUSGOV_REGRAS_SISTEMA_JSON__) {
            regrasSistemaAtivo = g.__JUSGOV_REGRAS_SISTEMA_JSON__;
        }
        if (regrasSistemaAtivo) return regrasSistemaAtivo;
        if (promessaCarregamentoRegras) return promessaCarregamentoRegras;

        promessaCarregamentoRegras = (async () => {
            const json = await buscarJsonEmDisco('__JUSGOV_REGRAS_SISTEMA_JSON__', 'regras-sistema.json', chromeApi);
            if (json) {
                regrasSistemaAtivo = json;
                return regrasSistemaAtivo;
            }
            return regrasSistemaAtivo || REGRAS_SISTEMA_MINIMO;
        })();

        try {
            return await promessaCarregamentoRegras;
        } finally {
            promessaCarregamentoRegras = null;
        }
    }

    function obterDadosForenses() {
        if (!dadosForensesAtivo) {
            const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
            if (g && g.__JUSGOV_DADOS_FORENSES_JSON__) dadosForensesAtivo = g.__JUSGOV_DADOS_FORENSES_JSON__;
        }
        return dadosForensesAtivo || DADOS_FORENSES_MINIMO;
    }

    function obterRegrasSistema() {
        if (!regrasSistemaAtivo) {
            const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
            if (g && g.__JUSGOV_REGRAS_SISTEMA_JSON__) regrasSistemaAtivo = g.__JUSGOV_REGRAS_SISTEMA_JSON__;
        }
        return regrasSistemaAtivo || REGRAS_SISTEMA_MINIMO;
    }

    function obterPresetsMarcadorColado() {
        const rs = obterRegrasSistema();
        const mapa = (rs && rs.presetsMarcadorColado && typeof rs.presetsMarcadorColado === 'object')
            ? rs.presetsMarcadorColado
            : REGRAS_SISTEMA_MINIMO.presetsMarcadorColado;
        if (mapa.marca_texto_classico && !mapa.marca_texto) {
            return Object.assign({}, mapa, { marca_texto: mapa.marca_texto_classico });
        }
        return mapa;
    }

    function obterCatalogoPerfis(catalogoOpcional = null) {
        if (catalogoOpcional && typeof catalogoOpcional === 'object' && catalogoOpcional.configPadrao) {
            return congelarCatalogoPerfis(catalogoOpcional);
        }
        return catalogoPerfisAtivo || CATALOGO_PERFIS_MINIMO;
    }

    function normalizarChaveAliasPerfil(valor) {
        return String(valor || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function obterDefinicaoPerfilPredefinido(idOuNome, catalogoOpcional = null) {
        const cat = obterCatalogoPerfis(catalogoOpcional);
        const alvo = normalizarChaveAliasPerfil(idOuNome);
        if (!alvo) return null;
        for (let i = 0; i < cat.perfisPredefinidos.length; i++) {
            const p = cat.perfisPredefinidos[i];
            if (normalizarChaveAliasPerfil(p.id) === alvo || normalizarChaveAliasPerfil(p.nome) === alvo) {
                return p;
            }
            if (Array.isArray(p.aliases) && p.aliases.some(a => normalizarChaveAliasPerfil(a) === alvo)) {
                return p;
            }
        }
        return null;
    }

    function obterConfigBasePadrao(catalogoOpcional = null) {
        const cat = obterCatalogoPerfis(catalogoOpcional);
        return clonarValorConfig(cat.configPadrao || {});
    }

    function obterConfigPadraoParaPerfil(idOuNome, catalogoOpcional = null) {
        const cat = obterCatalogoPerfis(catalogoOpcional);
        const base = obterConfigBasePadrao(cat);
        const def = obterDefinicaoPerfilPredefinido(idOuNome, cat);
        if (def && def.sobrescritas) {
            const keys = Object.keys(def.sobrescritas);
            for (let i = 0; i < keys.length; i++) {
                base[keys[i]] = clonarValorConfig(def.sobrescritas[keys[i]]);
            }
        }
        return base;
    }

    /* Passo 1.3: Pré-definições visuais para Marcadores Permanentes carregadas dinamicamente via regras-sistema.json */

    /* Passo 1.4: Namespace dinâmico de defaults resolvido a partir de perfis.json, dados-forenses.json e regras-sistema.json */
    return Object.freeze({
        CONFIGURACAO_MOTOR,
        get PADROES_DEFAULT_TURBO() {
            const urls = obterCatalogoPerfis().configPadrao.urlsTurbo;
            return Array.isArray(urls) ? urls : Object.freeze([]);
        },
        get PADROES_DEFAULT_AMPULETAS() {
            const urls = obterCatalogoPerfis().configPadrao.urlsAmpuletas;
            return Array.isArray(urls) ? urls : Object.freeze([]);
        },
        PADROES_DEFAULT_REGRAS_MAPEAMENTO,
        get PRESETS_MARCADOR_COLADO() {
            return obterPresetsMarcadorColado();
        },
        get PROMPT_F1_GEMINI_PADRAO() {
            return obterCatalogoPerfis().configPadrao.promptF1Gemini || '';
        },
        get PADROES_DEFAULT_STORAGE() {
            return obterCatalogoPerfis().configPadrao;
        },
        carregarCatalogoPerfisJson,
        carregarDadosForensesJson,
        carregarRegrasSistemaJson,
        removerComentariosCabecalhoJson,
        parsearJsonComComentarios,
        obterCatalogoPerfis,
        obterDadosForenses,
        obterRegrasSistema,
        obterPresetsMarcadorColado,
        obterDefinicaoPerfilPredefinido,
        obterConfigBasePadrao,
        obterConfigPadraoParaPerfil
    });
}));
