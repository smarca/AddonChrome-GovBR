/* ==========================================================================
 * ARQUIVO: src/lib/lib-config.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Configurações, Estado e Ícones Vetoriais
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config.js
 * - Classe Exportada: JusGovConfiguracoes (self.JusGovConfiguracoes / window.JusGovConfiguracoes)
 * - Métodos Públicos: obterConfiguracoesGerais, sincronizarEstado, sincronizarComportamentoIcone,
 *   desenharIconeVetorialFallback, obterChavesConfigSync, houveMudancaDeConfiguracao,
 *   sincronizarMenusContexto, tratarCliqueIconeExtensao, executarSincronizacaoNuvemCoalescida,
 *   gerenciarRequisicaoPerfil, alternarPerfil, criarPerfil, renomearPerfil, excluirPerfil,
 *   resetarPerfis, exportarBackupTotal, importarBackup
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seções 1, 4, 5, FEAT-34/35 (Perfis e JSON externos)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Gerenciar a sincronização atômica entre nuvem (chrome.storage.sync) e memória RAM de
 *    baixa latência (chrome.storage.session), validação estrita de padrões de fábrica
 *    (defaults), higienização de chaves órfãs e renderização do ícone vetorial dinâmico (OffscreenCanvas).
 * 2) CICLO DE VIDA EFÊMERO (MANIFEST V3):
 *    Garante acesso aos dados em < 0,2ms ao acordar o Service Worker através do espelho em session storage.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovConfiguracoes = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const _cfgH = (typeof self !== 'undefined' && self.JusGovConfigHelpers) ? self.JusGovConfigHelpers : ((typeof require === 'function') ? (() => { try { return require('./lib-config-helpers.js'); } catch (_) { return {}; } })() : {});
    const { CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS, PREFIXO_CHAVE_PERFIL_CFG, CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_SYNC_PERFIL_BASE_TOP, LIMITE_BYTES_ITEM_SYNC, JANELA_DUPLO_CLIQUE_ICONE_MS, CHAVES_CONFIGURACAO_SINCRONIZAVEL, SET_CHAVES_SYNC, obterDefaultsModulo, lerJsonDeResposta, formatarNomeArquivoExportacao, clonarValorSimples, valoresIguaisConfig, ENUNS_CONFIGURACAO_VALIDOS, LIMITES_NUMERICOS_CONFIGURACAO, calcularHashPayloadExportacao, extrairCabecalhoComentarioExportacao, normalizarTextoComparacao } = _cfgH;

    class JusGovConfiguracoes {
        constructor(dependencias = {}) {
            this.urls = dependencias.urls || null;
            this.injecao = dependencias.injecao || null;
            this.navegador = dependencias.navegador || null;
        }

        obterPadroesDefaultTurbo() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_TURBO) ? def.PADROES_DEFAULT_TURBO : Object.freeze([]);
        }

        obterPadroesDefaultAmpuletas() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_AMPULETAS) ? def.PADROES_DEFAULT_AMPULETAS : Object.freeze([]);
        }

        obterPadroesDefaultRegrasMapeamento() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_REGRAS_MAPEAMENTO) ? def.PADROES_DEFAULT_REGRAS_MAPEAMENTO : Object.freeze([]);
        }

        async carregarCatalogoPerfis(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const def = obterDefaultsModulo();
            if (def && typeof def.carregarCatalogoPerfisJson === 'function') {
                return await def.carregarCatalogoPerfisJson(apiChrome);
            }
            if (typeof fetch === 'function' && apiChrome && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                try {
                    const resp = await fetch(apiChrome.runtime.getURL('src/cfg/perfis.json'));
                    const json = await lerJsonDeResposta(resp);
                    if (json) return json;
                } catch (_) { }
            }
            return {
                versaoEsquema: 1,
                perfilPadraoId: 'padrao',
                chavesGlobais: ['regrasMapeamentoElementos', 'perfilAtivoId', 'listaPerfis'],
                configPadrao: {},
                perfisPredefinidos: [
                    { id: 'padrao', nome: 'Padrão', predefinido: true, sobrescritas: {} },
                    { id: 'trabalho', nome: 'Trabalho', predefinido: true, sobrescritas: {} },
                    { id: 'casa', nome: 'Casa', predefinido: true, sobrescritas: {} },
                    { id: 'estudo', nome: 'Estudo', aliases: ['estudar'], predefinido: true, sobrescritas: {} },
                    { id: 'leitura', nome: 'Leitura / Pesquisa', aliases: ['leitura', 'pesquisa'], predefinido: true, sobrescritas: {} },
                    { id: 'reuniao', nome: 'Apresentação / Reunião', aliases: ['reuniao', 'apresentacao'], predefinido: true, sobrescritas: {} }
                ]
            };
        }

        async obterPerfilAtivoLocal(chromeApi = null, fallbackSyncData = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            try {
                if (apiChrome && apiChrome.storage && apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        return loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                }
            } catch (_) { }
            if (fallbackSyncData && typeof fallbackSyncData[CHAVE_PERFIL_ATIVO] === 'string' && fallbackSyncData[CHAVE_PERFIL_ATIVO].trim()) {
                return fallbackSyncData[CHAVE_PERFIL_ATIVO].trim();
            }
            return '';
        }

        async salvarPerfilAtivoLocal(perfilId, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const idStr = (typeof perfilId === 'string' && perfilId.trim()) ? perfilId.trim() : 'padrao';
            try {
                if (apiChrome && apiChrome.storage && apiChrome.storage.local) {
                    await apiChrome.storage.local.set({ [CHAVE_PERFIL_ATIVO]: idStr });
                    return true;
                }
            } catch (_) { }
            return false;
        }

        /*
         * FUNCAO / MÉTODO: obterConfiguracoesGerais
         * OBJETIVO DE RECONSTRUCAO: Recuperar o objeto consolidado de configuracoes da
         * extensao a partir da memoria RAM rapida (storage.session) ou sincronizacao em nuvem.
         */
        async obterConfiguracoesGerais(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage) return {};

            try {
                let baseCfg = null;
                if (apiChrome.storage.session) {
                    const cached = await apiChrome.storage.session.get('cacheConfigJusGov');
                    if (cached && cached.cacheConfigJusGov && typeof cached.cacheConfigJusGov === 'object' && typeof cached.cacheConfigJusGov.modoTurbo === 'string') {
                        baseCfg = { ...cached.cacheConfigJusGov };
                    }
                }
                if (!baseCfg && apiChrome.storage.sync) {
                    const syncCfg = await apiChrome.storage.sync.get(null);
                    if (syncCfg && typeof syncCfg === 'object') {
                        baseCfg = { ...syncCfg };
                    }
                }
                if (!baseCfg) baseCfg = {};
                if (apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        baseCfg[CHAVE_PERFIL_ATIVO] = loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                    if (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(baseCfg, loc[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
                if (baseCfg.pomodoroAtivo === undefined) {
                    baseCfg.pomodoroAtivo = true;
                }
                return baseCfg;
            } catch (_) {
                return {};
            }
        }

        /*
         * FUNCAO / MÉTODO: sincronizarEstado
         * OBJETIVO DE RECONSTRUCAO: Ler as configuracoes da nuvem (chrome.storage.sync),
         * aplicar o catalogo de perfis e valores padrao de src/cfg/perfis.json caso alguma
         * chave esteja ausente, espelhar alteracoes ativas no perfil ativo, gravar cache
         * em RAM (chrome.storage.session), atualizar o registro de scripts e sincronizar
         * todas as abas abertas em tempo real.
         */
        async sincronizarEstado(chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return null;

            const injecaoUtil = dependencias.injecao || this.injecao;
            const navegadorUtil = dependencias.navegador || this.navegador;
            const urlsUtil = dependencias.urls || this.urls;

            /* Passo 4.0: Carregar catalogo externo de perfis e personalizacoes (src/cfg/perfis.json) */
            const cat = await this.carregarCatalogoPerfis(apiChrome);

            /* Passo 4.1: Ler configuracoes da nuvem + perfil local do dispositivo + pendencias locais */
            const syncBruto = await apiChrome.storage.sync.get(null);
            let pendObj = null;
            let perfilLocalSalvo = '';
            try {
                if (apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        perfilLocalSalvo = loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                    if (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object' && Object.keys(loc[CHAVE_CONFIG_SYNC_PENDENTE]).length > 0) {
                        pendObj = loc[CHAVE_CONFIG_SYNC_PENDENTE];
                    }
                }
            } catch (_) { }
            const temPendenteLocal = Boolean(pendObj);
            const basePerfisEntrada = { ...syncBruto };
            if (perfilLocalSalvo) basePerfisEntrada[CHAVE_PERFIL_ATIVO] = perfilLocalSalvo;
            const { listaPerfis, perfilAtivoId, alteracoes: alteracoesPerfis } = this.garantirEstruturaPerfis(basePerfisEntrada, cat);

            if (perfilLocalSalvo !== perfilAtivoId) {
                await this.salvarPerfilAtivoLocal(perfilAtivoId, apiChrome);
            }

            /* Se outro dispositivo escreveu chaves top-level de outro perfil no sync, isola este PC usando o perfilCfg_<localPerfilAtivoId> */
            const perfilTopSync = typeof syncBruto[CHAVE_SYNC_PERFIL_BASE_TOP] === 'string' ? syncBruto[CHAVE_SYNC_PERFIL_BASE_TOP].trim() : '';
            const chaveCfgAtivo = this.chaveConfigPerfil(perfilAtivoId);
            const config = (perfilTopSync && perfilTopSync !== perfilAtivoId)
                ? {
                    ...syncBruto,
                    ...this.resolverConfigEfetivaPerfil(
                        perfilAtivoId,
                        (syncBruto[chaveCfgAtivo] && typeof syncBruto[chaveCfgAtivo] === 'object') ? syncBruto[chaveCfgAtivo] : {},
                        cat
                    )
                }
                : { ...syncBruto };

            if (pendObj) {
                Object.assign(config, pendObj);
            }
            Object.assign(config, alteracoesPerfis);
            config[CHAVE_PERFIL_ATIVO] = perfilAtivoId;
            let precisaSalvar = Object.keys(alteracoesPerfis).length > 0;

            const padraoPerfil = this.obterConfigPadraoParaPerfil(perfilAtivoId, cat);
            const padraoAmpuletas = this.obterPadroesDefaultAmpuletas();
            const padraoTurbo = this.obterPadroesDefaultTurbo();

            /* Passo 4.2: Aplicar valores padrao do perfil ativo (perfis.json) para chaves ausentes ou invalidas */
            if (Array.isArray(config.urlsTurbo) && config.urlsTurbo.includes('<all_urls>')) {
                config.urlsTurbo = config.urlsTurbo.filter(u => u && u !== '<all_urls>');
                precisaSalvar = true;
            }
            if (!Array.isArray(config.urlsTurbo) || config.urlsTurbo.length === 0) {
                config.urlsTurbo = Array.isArray(padraoPerfil.urlsTurbo) && padraoPerfil.urlsTurbo.length > 0
                    ? [...padraoPerfil.urlsTurbo]
                    : [...padraoTurbo];
                precisaSalvar = true;
            }
            if (!Array.isArray(config.urlsTurboExcecoes)) {
                config.urlsTurboExcecoes = Array.isArray(padraoPerfil.urlsTurboExcecoes)
                    ? [...padraoPerfil.urlsTurboExcecoes]
                    : ['*://*/*jogos*', '*://*/*games*', '*://*jogos*/*', '*://*games*/*'];
                precisaSalvar = true;
            }
            if (!Array.isArray(config.urlsAmpuletas) || config.urlsAmpuletas.length === 0) {
                config.urlsAmpuletas = Array.isArray(padraoPerfil.urlsAmpuletas) && padraoPerfil.urlsAmpuletas.length > 0
                    ? [...padraoPerfil.urlsAmpuletas]
                    : [...padraoAmpuletas];
                precisaSalvar = true;
            } else {
                const listaPjeBase = (Array.isArray(padraoPerfil.urlsAmpuletas) && padraoPerfil.urlsAmpuletas.length > 0)
                    ? padraoPerfil.urlsAmpuletas
                    : padraoAmpuletas;
                let atualizouPje = false;
                for (let p = 0; p < listaPjeBase.length; p++) {
                    if (!config.urlsAmpuletas.includes(listaPjeBase[p])) {
                        config.urlsAmpuletas.push(listaPjeBase[p]);
                        atualizouPje = true;
                    }
                }
                if (atualizouPje) precisaSalvar = true;
            }

            if (!['global', 'url', 'desligado'].includes(config.modoTurbo)) {
                config.modoTurbo = padraoPerfil.modoTurbo;
                precisaSalvar = true;
            }
            if (config.ativoAmpuletas === undefined) {
                config.ativoAmpuletas = padraoPerfil.ativoAmpuletas;
                precisaSalvar = true;
            }
            if (config.manterFormatacaoBasica === undefined) {
                config.manterFormatacaoBasica = padraoPerfil.manterFormatacaoBasica;
                precisaSalvar = true;
            }
            const niveisValidos = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido', 'extendido', 'sem_filtro'];
            if (typeof config.nivelFiltroFormatacao !== 'string' || !niveisValidos.includes(config.nivelFiltroFormatacao)) {
                config.nivelFiltroFormatacao = padraoPerfil.nivelFiltroFormatacao;
                precisaSalvar = true;
            }
            if (!['com_flash', 'total', 'total_exceto_arrasto', 'interface', 'nenhuma'].includes(config.modoRetirarSelecao)) {
                config.modoRetirarSelecao = (config.tempoFlashBorderMs === 0) ? 'nenhuma' : (padraoPerfil.modoRetirarSelecao || 'com_flash');
                precisaSalvar = true;
            }
            if (config.tempoFlashBorderMs === 0 && config.modoRetirarSelecao === 'com_flash') {
                config.modoRetirarSelecao = 'nenhuma';
                precisaSalvar = true;
            }
            if (config.modoPlaceholdersMinutasHtml === undefined) {
                config.modoPlaceholdersMinutasHtml = (config.placeholdersMinutasHtmlAtivo === false || config.selecaoEditavelAtiva === false)
                    ? 'desabilitado'
                    : padraoPerfil.modoPlaceholdersMinutasHtml;
                precisaSalvar = true;
            }
            if (config.placeholdersMinutasHtmlAtivo === undefined) {
                config.placeholdersMinutasHtmlAtivo = (config.modoPlaceholdersMinutasHtml !== 'desabilitado');
                precisaSalvar = true;
            }
            if (config.selecaoEditavelAtiva === undefined) {
                config.selecaoEditavelAtiva = (config.modoPlaceholdersMinutasHtml !== 'desabilitado');
                precisaSalvar = true;
            }
            if (typeof config.tempoConferenciaDocumentosMs !== 'number' || (config.tempoConferenciaDocumentosMs !== -1 && (config.tempoConferenciaDocumentosMs < 0 || config.tempoConferenciaDocumentosMs > 5000))) {
                config.tempoConferenciaDocumentosMs = (config.validacaoMatematicaAtiva === false) ? 0 : padraoPerfil.tempoConferenciaDocumentosMs;
                precisaSalvar = true;
            }
            if (config.validacaoMatematicaAtiva === undefined || config.validacaoMatematicaAtiva !== (config.tempoConferenciaDocumentosMs !== 0)) {
                config.validacaoMatematicaAtiva = (config.tempoConferenciaDocumentosMs !== 0);
                precisaSalvar = true;
            }
            if (!['sempre', 'apenas_erros'].includes(config.modoExibicaoValidacao)) {
                config.modoExibicaoValidacao = padraoPerfil.modoExibicaoValidacao;
                precisaSalvar = true;
            }
            if (!['abaixo', 'acima'].includes(config.posicaoAvisosValidacao)) {
                config.posicaoAvisosValidacao = padraoPerfil.posicaoAvisosValidacao;
                precisaSalvar = true;
            }
            if (typeof config.tempoFlashBorderMs !== 'number' || (config.tempoFlashBorderMs !== -1 && (config.tempoFlashBorderMs < 0 || config.tempoFlashBorderMs > 5250))) {
                config.tempoFlashBorderMs = padraoPerfil.tempoFlashBorderMs;
                precisaSalvar = true;
            }
            if (typeof config.corFlashBorder !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFlashBorder.trim())) {
                config.corFlashBorder = padraoPerfil.corFlashBorder;
                precisaSalvar = true;
            }
            if (config.marcadorConteudoColadoAtivo === undefined) {
                config.marcadorConteudoColadoAtivo = padraoPerfil.marcadorConteudoColadoAtivo;
                precisaSalvar = true;
            }
            if (typeof config.presetMarcadorColado !== 'string' || !config.presetMarcadorColado.trim()) {
                config.presetMarcadorColado = padraoPerfil.presetMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.corContornoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corContornoMarcadorColado.trim())) {
                config.corContornoMarcadorColado = padraoPerfil.corContornoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.corFundoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFundoMarcadorColado.trim())) {
                config.corFundoMarcadorColado = padraoPerfil.corFundoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.opacidadeFundoMarcadorColado !== 'number' || !Number.isFinite(config.opacidadeFundoMarcadorColado)) {
                config.opacidadeFundoMarcadorColado = padraoPerfil.opacidadeFundoMarcadorColado;
                precisaSalvar = true;
            }
            const consts = (typeof JusGovConstantes !== 'undefined' && JusGovConstantes)
                ? JusGovConstantes
                : ((typeof self !== 'undefined' && self.JusGovConstantes) ? self.JusGovConstantes : null);
            const estilosBadgeValidos = (consts && Array.isArray(consts.ESTILOS_BADGE_MARCADOR_COLADO))
                ? consts.ESTILOS_BADGE_MARCADOR_COLADO
                : ['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto', 'apenas_numeral'];
            const modosAvisoPomodoroValidos = (consts && Array.isArray(consts.MODOS_AVISO_POMODORO))
                ? consts.MODOS_AVISO_POMODORO
                : ['modal', 'badge', 'barra_descanso', 'barra_sempre', 'badge_e_barra_descanso', 'completo'];

            if (typeof config.estiloBadgeMarcadorColado !== 'string' || !estilosBadgeValidos.includes(config.estiloBadgeMarcadorColado)) {
                config.estiloBadgeMarcadorColado = padraoPerfil.estiloBadgeMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.tipoContornoMarcadorColado !== 'string' || !['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(config.tipoContornoMarcadorColado)) {
                config.tipoContornoMarcadorColado = padraoPerfil.tipoContornoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.minimoCaracteresInterface !== 'number' || ![0, 1, 2, 3, 4, 5, 10].includes(config.minimoCaracteresInterface)) {
                config.minimoCaracteresInterface = padraoPerfil.minimoCaracteresInterface;
                precisaSalvar = true;
            }
            if (config.tempoExibicaoAlertaMs !== -1) {
                config.tempoExibicaoAlertaMs = -1;
                precisaSalvar = true;
            }
            if (typeof config.separadorAcumulador !== 'string' ||
                config.separadorAcumulador.trim().length === 0 ||
                /[0-9\p{L}]/u.test(config.separadorAcumulador) ||
                !/[!-\/:-@\[-`{-~|\u00A7\u00B0\u00BA\u00AA\p{P}\p{S}]/u.test(config.separadorAcumulador)) {
                config.separadorAcumulador = padraoPerfil.separadorAcumulador;
                precisaSalvar = true;
            } else if (config.separadorAcumulador.length > 5) {
                config.separadorAcumulador = config.separadorAcumulador.slice(0, 5);
                precisaSalvar = true;
            }
            if (typeof config.promptF1Gemini !== 'string' || config.promptF1Gemini.trim().length === 0) {
                config.promptF1Gemini = padraoPerfil.promptF1Gemini;
                precisaSalvar = true;
            }
            if (!['20digitos', 'semZeros'].includes(config.modoShiftCnj)) {
                config.modoShiftCnj = padraoPerfil.modoShiftCnj;
                precisaSalvar = true;
            }
            if (![';', '\t', ' | '].includes(config.separadorTabelas)) {
                config.separadorTabelas = padraoPerfil.separadorTabelas;
                precisaSalvar = true;
            }
            if (!['12h', '1d', '3d', '7d', '15d', '30d'].includes(config.autoLimpezaIdade)) {
                config.autoLimpezaIdade = padraoPerfil.autoLimpezaIdade;
                precisaSalvar = true;
            }
            if (typeof config.tempoTrabalhoCorridoHoras !== 'number' || config.tempoTrabalhoCorridoHoras < 1 || config.tempoTrabalhoCorridoHoras > 12) {
                config.tempoTrabalhoCorridoHoras = padraoPerfil.tempoTrabalhoCorridoHoras;
                precisaSalvar = true;
            }
            if (typeof config.tempoTrabalhoAtivoHoras !== 'number' || config.tempoTrabalhoAtivoHoras < 1 || config.tempoTrabalhoAtivoHoras > 12) {
                config.tempoTrabalhoAtivoHoras = padraoPerfil.tempoTrabalhoAtivoHoras;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroProporcao !== 'number' || ![5, 4.5, 4, 3.5, 3].includes(config.pomodoroProporcao)) {
                config.pomodoroProporcao = padraoPerfil.pomodoroProporcao;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroFocoMinutos !== 'number' || config.pomodoroFocoMinutos < 25 || config.pomodoroFocoMinutos > 90 || config.pomodoroFocoMinutos % 5 !== 0) {
                config.pomodoroFocoMinutos = padraoPerfil.pomodoroFocoMinutos;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroCiclos !== 'number' || !Number.isInteger(config.pomodoroCiclos) || config.pomodoroCiclos < 2 || config.pomodoroCiclos > 10) {
                config.pomodoroCiclos = padraoPerfil.pomodoroCiclos;
                precisaSalvar = true;
            }
            if (config.pomodoroPausasAutomaticas !== true) {
                config.pomodoroPausasAutomaticas = true;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroModoAviso !== 'string' || !modosAvisoPomodoroValidos.includes(config.pomodoroModoAviso)) {
                config.pomodoroModoAviso = padraoPerfil.pomodoroModoAviso || 'completo';
                precisaSalvar = true;
            }
            const estilosMinipopupValidos = VALORES_ENUM_CONFIGURACAO.pomodoroEstiloMinipopup;
            if (typeof config.pomodoroEstiloMinipopup !== 'string' || !estilosMinipopupValidos.includes(config.pomodoroEstiloMinipopup)) {
                config.pomodoroEstiloMinipopup = padraoPerfil.pomodoroEstiloMinipopup || 'compacto';
                precisaSalvar = true;
            }

            /* Normalizar demais booleanos e seletores simples a partir do perfil ativo de perfis.json */
            const chavesPadraoKeys = Object.keys(padraoPerfil);
            for (let i = 0; i < chavesPadraoKeys.length; i++) {
                const k = chavesPadraoKeys[i];
                if (config[k] === undefined) {
                    config[k] = clonarValorSimples(padraoPerfil[k]);
                    precisaSalvar = true;
                }
            }

            config.colagemBotaoDireitoAtiva = false;
            config.descarteGuiasInativasAtivo = false;
            config.abaEmPrimeiroPlano = Boolean(config.abaEmPrimeiroPlano);
            config.abaEmSegundoPlano = !config.abaEmPrimeiroPlano;
            if (!config.monitorarUrlOriginalAbertura && !config.monitorarUrlAtualPagina) {
                config.monitorarUrlAtualPagina = true;
                precisaSalvar = true;
            }
            const criteriosValidos = ['nenhum', 'hierarquia_arvore', 'url', 'dominio', 'dominio_titulo', 'dominio_criacao', 'dominio_acesso', 'titulo', 'tempo_acesso', 'ordem_criacao', 'agrupar_dominio'];
            if (!criteriosValidos.includes(config.criterioOrdenacaoGuias)) {
                config.criterioOrdenacaoGuias = padraoPerfil.criterioOrdenacaoGuias;
                precisaSalvar = true;
            }
            if (!['esq_dir', 'dir_esq'].includes(config.sentidoOrdenacaoGuias)) {
                config.sentidoOrdenacaoGuias = padraoPerfil.sentidoOrdenacaoGuias;
                precisaSalvar = true;
            }
            if (!['manter', 'recarregar', 'recarregar_se_modificada', 'recarregar_se_nao_modificada'].includes(config.reutilizarAbasAcaoConteudo)) {
                config.reutilizarAbasAcaoConteudo = padraoPerfil.reutilizarAbasAcaoConteudo;
                precisaSalvar = true;
            }

            if (!Array.isArray(config.regrasMapeamentoElementos)) {
                let padraoUsuario = [];
                try {
                    if (typeof fetch === 'function' && apiChrome && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                        const respInt = await fetch(apiChrome.runtime.getURL('src/cfg/interface.json'));
                        const dadosInt = await lerJsonDeResposta(respInt);
                        if (Array.isArray(dadosInt)) {
                            padraoUsuario = dadosInt
                                .filter(r => r && r.origem === 'usuario')
                                .map(({ origem, ...resto }) => ({ ...resto }));
                        }
                    }
                } catch (_) { }
                config.regrasMapeamentoElementos = padraoUsuario;
                precisaSalvar = true;
            }

            /* Passo 4.2.0: Manter snapshot de sobrescritas do perfil ativo sempre sincronizado caso uma chave tenha sido alterada (ex: Popup ou Esc+Esc) */
            const diffAtivoCalculado = this.calcularSobrescritasPerfil(config, perfilAtivoId, cat);
            if (!valoresIguaisConfig(config[chaveCfgAtivo], diffAtivoCalculado)) {
                config[chaveCfgAtivo] = diffAtivoCalculado;
                alteracoesPerfis[chaveCfgAtivo] = diffAtivoCalculado;
                precisaSalvar = true;
            }

            const mesmoPerfilTop = (!perfilTopSync || perfilTopSync === perfilAtivoId);
            if (precisaSalvar && !temPendenteLocal) {
                const payloadSalvar = {
                    regrasMapeamentoElementos: config.regrasMapeamentoElementos,
                    [CHAVE_LISTA_PERFIS]: listaPerfis,
                    ...alteracoesPerfis
                };
                if (mesmoPerfilTop) {
                    Object.assign(payloadSalvar, this.extrairConfigPerfilDeObjeto(config, cat));
                    payloadSalvar[CHAVE_SYNC_PERFIL_BASE_TOP] = perfilAtivoId;
                }
                await apiChrome.storage.sync.set(payloadSalvar);
            }

            /* Passo 4.2.1: Limpar variaveis estatisticas, perfilAtivoId legado e chaves redundantes do storage.sync */
            if (apiChrome.storage.sync.remove && (
                syncBruto[CHAVE_PERFIL_ATIVO] !== undefined ||
                config.totalCopias !== undefined ||
                config.totalAlertas !== undefined ||
                config.flashBorderAtivo !== undefined
            )) {
                apiChrome.storage.sync.remove([CHAVE_PERFIL_ATIVO, 'totalCopias', 'totalAlertas', 'flashBorderAtivo']).catch(() => { });
            }

            /* Passo 4.3: Espelhar configuracao no chrome.storage.session (RAM rapida) e sincronizar Fachada POO do Navegador */
            if (apiChrome.storage.session) {
                await apiChrome.storage.session.set({ cacheConfigJusGov: config }).catch(() => { });
            }
            if (navegadorUtil && typeof navegadorUtil.atualizarConfiguracoes === 'function') {
                try {
                    navegadorUtil.atualizarConfiguracoes(config);
                } catch (_) { }
            }

            /* Passo 4.4: Enfileirar atualizacao dos Content Scripts e notificar/injetar nas abas */
            if (injecaoUtil) {
                if (typeof injecaoUtil.enfileirarRegistro === 'function') {
                    await injecaoUtil.enfileirarRegistro(
                        config.urlsTurbo,
                        config.urlsAmpuletas,
                        config.modoTurbo,
                        config.ativoAmpuletas,
                        apiChrome,
                        urlsUtil
                    );
                }
                if (typeof injecaoUtil.injetarRetroativamenteNasAbasAbertas === 'function') {
                    await injecaoUtil.injetarRetroativamenteNasAbasAbertas(config, apiChrome, urlsUtil);
                }
            }

            /* Passo 4.5: Atualizar dinamicamente o icone e o popup da extensao na barra de ferramentas */
            if (typeof self !== 'undefined') {
                self.__JUSGOV_MODO_TURBO_ATUAL__ = config.modoTurbo;
            }
            this.sincronizarComportamentoIcone(apiChrome);
            this.desenharIconeVetorialFallback(config.modoTurbo, 'popup', apiChrome);

            return config;
        }

    }

        const _ext_JusGovConfiguracoes = [
        { g: 'JusGovLibConfigPerfis', p: './lib-config-perfis.js' },
        { g: 'JusGovLibConfigExportacao', p: './lib-config-exportacao.js' },
        { g: 'JusGovLibConfigIcone', p: './lib-config-icone.js' }
    ];
    for (let i = 0; i < _ext_JusGovConfiguracoes.length; i++) {
        const it = _ext_JusGovConfiguracoes[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(JusGovConfiguracoes.prototype);
        }
    }

    Object.freeze(JusGovConfiguracoes.prototype);
    return Object.freeze(JusGovConfiguracoes);
}));


