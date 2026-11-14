/* ==========================================================================
 * Nome do arquivo: lib-config.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Configurações, Estado e Ícones Vetoriais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config.js
 * - Classe Exportada: JusGovConfiguracoes (self.JusGovConfiguracoes / window.JusGovConfiguracoes)
 * - Métodos Públicos: obterConfiguracoesGerais, sincronizarEstado, sincronizarComportamentoIcone, desenharIconeVetorialFallback
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seções 1, 4, 5 (BP-06 / ARQ-01)
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

    /* Regras de Mapeamento Manual Avancado de Elementos (XPath / CSS) Padroes de Fabrica (Secao 6.20) - Padrao vazio conforme Seção 6.85 */
    const PADROES_DEFAULT_REGRAS_MAPEAMENTO = Object.freeze([]);

    class JusGovConfiguracoes {
        constructor(dependencias = {}) {
            this.urls = dependencias.urls || null;
            this.injecao = dependencias.injecao || null;
            this.navegador = dependencias.navegador || null;
        }

        obterPadroesDefaultTurbo() {
            return PADROES_DEFAULT_TURBO;
        }

        obterPadroesDefaultAmpuletas() {
            return PADROES_DEFAULT_AMPULETAS;
        }

        obterPadroesDefaultRegrasMapeamento() {
            return PADROES_DEFAULT_REGRAS_MAPEAMENTO;
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
                if (apiChrome.storage.session) {
                    const cached = await apiChrome.storage.session.get('cacheConfigJusGov');
                    if (cached && cached.cacheConfigJusGov) {
                        return cached.cacheConfigJusGov;
                    }
                }
                if (apiChrome.storage.sync) {
                    return await apiChrome.storage.sync.get(null);
                }
                return {};
            } catch (_) {
                return {};
            }
        }

        /*
         * FUNCAO / MÉTODO: sincronizarEstado
         * OBJETIVO DE RECONSTRUCAO: Ler as configuracoes da nuvem (chrome.storage.sync),
         * preencher padroes de fabrica caso seja a primeira execucao (incluindo a opcao
         * manterFormatacaoBasica = false por padrao, ou seja, "Remover Formatacoes / Somente Texto"),
         * gravar cache em RAM (chrome.storage.session), atualizar o registro de scripts
         * e sincronizar todas as abas abertas em tempo real.
         */
        async sincronizarEstado(chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return null;

            const injecaoUtil = dependencias.injecao || this.injecao;
            const navegadorUtil = dependencias.navegador || this.navegador;
            const urlsUtil = dependencias.urls || this.urls;

            /* Passo 4.1: Ler todas as chaves de configuracao no chrome.storage.sync */
            const config = await apiChrome.storage.sync.get(null);

            let precisaSalvar = false;

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
            if (!['total_exceto_arrasto', 'total', 'interface', 'nenhuma'].includes(config.modoRetirarSelecao)) {
                config.modoRetirarSelecao = 'total_exceto_arrasto';
                precisaSalvar = true;
            }
            if (config.modoPlaceholdersMinutasHtml === undefined) {
                config.modoPlaceholdersMinutasHtml = (config.placeholdersMinutasHtmlAtivo === false || config.selecaoEditavelAtiva === false) ? 'desabilitado' : 'placeholders';
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
                config.tempoConferenciaDocumentosMs = (config.validacaoMatematicaAtiva === false) ? 0 : -1;
                precisaSalvar = true;
            }
            if (config.validacaoMatematicaAtiva === undefined || config.validacaoMatematicaAtiva !== (config.tempoConferenciaDocumentosMs !== 0)) {
                config.validacaoMatematicaAtiva = (config.tempoConferenciaDocumentosMs !== 0);
                precisaSalvar = true;
            }
            if (!config.modoExibicaoValidacao) {
                config.modoExibicaoValidacao = 'sempre';
                precisaSalvar = true;
            }
            if (!config.posicaoAvisosValidacao || !['abaixo', 'acima'].includes(config.posicaoAvisosValidacao)) {
                config.posicaoAvisosValidacao = 'abaixo';
                precisaSalvar = true;
            }
            if (typeof config.tempoFlashBorderMs !== 'number' || (config.tempoFlashBorderMs !== -1 && (config.tempoFlashBorderMs < 0 || config.tempoFlashBorderMs > 5250))) {
                config.tempoFlashBorderMs = -1;
                precisaSalvar = true;
            }
            if (typeof config.corFlashBorder !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFlashBorder.trim())) {
                config.corFlashBorder = '#0d9488';
                precisaSalvar = true;
            }
            if (config.marcadorConteudoColadoAtivo === undefined) {
                config.marcadorConteudoColadoAtivo = true;
                precisaSalvar = true;
            }
            if (typeof config.presetMarcadorColado !== 'string' || !config.presetMarcadorColado.trim()) {
                config.presetMarcadorColado = 'verde_forense';
                precisaSalvar = true;
            }
            if (typeof config.corContornoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corContornoMarcadorColado.trim())) {
                config.corContornoMarcadorColado = '#0d9488';
                precisaSalvar = true;
            }
            if (typeof config.corFundoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFundoMarcadorColado.trim())) {
                config.corFundoMarcadorColado = '#ccfbf1';
                precisaSalvar = true;
            }
            if (typeof config.opacidadeFundoMarcadorColado !== 'number' || !Number.isFinite(config.opacidadeFundoMarcadorColado)) {
                config.opacidadeFundoMarcadorColado = 0.24;
                precisaSalvar = true;
            }
            if (typeof config.estiloBadgeMarcadorColado !== 'string' || !['sobrescrito', 'circular', 'chip'].includes(config.estiloBadgeMarcadorColado)) {
                config.estiloBadgeMarcadorColado = 'sobrescrito';
                precisaSalvar = true;
            }
            if (typeof config.minimoCaracteresInterface !== 'number' || ![0, 1, 2, 3, 4, 5, 10].includes(config.minimoCaracteresInterface)) {
                config.minimoCaracteresInterface = 5;
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
            if (typeof config.tempoExibicaoAlertaMs !== 'number' || (config.tempoExibicaoAlertaMs !== -1 && config.tempoExibicaoAlertaMs !== 0 && (config.tempoExibicaoAlertaMs < 1000 || config.tempoExibicaoAlertaMs > 10000))) {
                config.tempoExibicaoAlertaMs = -1;
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
            if (config.alternarAbasRecentesCtrlTabAtiva === undefined) {
                config.alternarAbasRecentesCtrlTabAtiva = true;
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
            if (config.caixaEntradaRapidaAtiva === undefined) {
                config.caixaEntradaRapidaAtiva = true;
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
                config.reutilizarAbasAbertas = true;
                precisaSalvar = true;
            }
            if (config.reutilizarAbasFocoPrimeiroPlano === undefined) {
                config.reutilizarAbasFocoPrimeiroPlano = true;
                precisaSalvar = true;
            }
            if (config.protegerGuiasModificadas === undefined) {
                config.protegerGuiasModificadas = true;
                precisaSalvar = true;
            }
            if (typeof config.reutilizarAbasAcaoConteudo !== 'string' || !['manter', 'recarregar', 'recarregar_se_modificada', 'recarregar_se_nao_modificada'].includes(config.reutilizarAbasAcaoConteudo)) {
                config.reutilizarAbasAcaoConteudo = 'manter';
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
            if (typeof config.criterioOrdenacaoGuias !== 'string' || !['nenhum', 'url', 'dominio', 'dominio_criacao', 'dominio_acesso', 'titulo', 'tempo_acesso', 'ordem_criacao', 'agrupar_dominio'].includes(config.criterioOrdenacaoGuias)) {
                config.criterioOrdenacaoGuias = 'nenhum';
                precisaSalvar = true;
            }
            if (typeof config.sentidoOrdenacaoGuias !== 'string' || !['esq_dir', 'dir_esq'].includes(config.sentidoOrdenacaoGuias)) {
                config.sentidoOrdenacaoGuias = 'esq_dir';
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
            if (!Array.isArray(config.regrasMapeamentoElementos)) {
                config.regrasMapeamentoElementos = [];
                precisaSalvar = true;
            }

            if (precisaSalvar) {
                await apiChrome.storage.sync.set({
                    urlsTurbo: config.urlsTurbo,
                    urlsAmpuletas: config.urlsAmpuletas,
                    regrasMapeamentoElementos: config.regrasMapeamentoElementos,
                    modoTurbo: config.modoTurbo,
                    comportamentoCliqueIcone: config.comportamentoCliqueIcone,
                    ativoAmpuletas: config.ativoAmpuletas,
                    manterFormatacaoBasica: config.manterFormatacaoBasica,
                    nivelFiltroFormatacao: config.nivelFiltroFormatacao,
                    modoRetirarSelecao: config.modoRetirarSelecao,
                    selecaoEditavelAtiva: config.selecaoEditavelAtiva,
                    modoPlaceholdersMinutasHtml: config.modoPlaceholdersMinutasHtml,
                    placeholdersMinutasHtmlAtivo: config.placeholdersMinutasHtmlAtivo,
                    colagemBotaoDireitoAtiva: false,
                    alternarAbasRecentesCtrlTabAtiva: config.alternarAbasRecentesCtrlTabAtiva !== false,
                    capturaBotoesMouse4e5Ativa: config.capturaBotoesMouse4e5Ativa,
                    colarBotaoMeioAtivo: config.colarBotaoMeioAtivo !== false,
                    navegacaoTecladoCamposAtiva: config.navegacaoTecladoCamposAtiva,
                    caixaEntradaRapidaAtiva: config.caixaEntradaRapidaAtiva !== false,
                    bloquearNovasJanelas: config.bloquearNovasJanelas,
                    preservarJanelasAutenticacao: config.preservarJanelasAutenticacao,
                    abaEmPrimeiroPlano: Boolean(config.abaEmPrimeiroPlano),
                    abaEmSegundoPlano: (config.abaEmPrimeiroPlano !== undefined) ? !config.abaEmPrimeiroPlano : Boolean(config.abaEmSegundoPlano),
                    reutilizarAbasAbertas: (config.reutilizarAbasAbertas !== false),
                    reutilizarAbasFocoPrimeiroPlano: (config.reutilizarAbasFocoPrimeiroPlano !== false),
                    protegerGuiasModificadas: (config.protegerGuiasModificadas !== false),
                    reutilizarAbasAcaoConteudo: config.reutilizarAbasAcaoConteudo || 'manter',
                    monitorarUrlOriginalAbertura: Boolean(config.monitorarUrlOriginalAbertura),
                    monitorarUrlAtualPagina: (config.monitorarUrlAtualPagina !== false),
                    criterioOrdenacaoGuias: config.criterioOrdenacaoGuias,
                    sentidoOrdenacaoGuias: config.sentidoOrdenacaoGuias || 'esq_dir',
                    ordenarGuiasFixadas: config.ordenarGuiasFixadas,
                    descarteGuiasInativasAtivo: false,
                    tempoInatividadeDescarteMinutos: Number(config.tempoInatividadeDescarteMinutos) || 20,
                    validacaoMatematicaAtiva: config.validacaoMatematicaAtiva,
                    tempoConferenciaDocumentosMs: config.tempoConferenciaDocumentosMs,
                    modoExibicaoValidacao: config.modoExibicaoValidacao || 'sempre',
                    posicaoAvisosValidacao: config.posicaoAvisosValidacao || 'abaixo',
                    tempoFlashBorderMs: config.tempoFlashBorderMs,
                    corFlashBorder: config.corFlashBorder,
                    marcadorConteudoColadoAtivo: config.marcadorConteudoColadoAtivo !== false,
                    presetMarcadorColado: config.presetMarcadorColado || 'verde_forense',
                    corContornoMarcadorColado: config.corContornoMarcadorColado || '#0d9488',
                    corFundoMarcadorColado: config.corFundoMarcadorColado || '#ccfbf1',
                    opacidadeFundoMarcadorColado: typeof config.opacidadeFundoMarcadorColado === 'number' ? config.opacidadeFundoMarcadorColado : 0.24,
                    estiloBadgeMarcadorColado: config.estiloBadgeMarcadorColado || 'sobrescrito',
                    minimoCaracteresInterface: config.minimoCaracteresInterface,
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
            if (apiChrome.storage.sync.remove) {
                apiChrome.storage.sync.remove(['totalCopias', 'totalAlertas', 'flashBorderAtivo']).catch(() => { });
            }

            /* Passo 4.3: Espelhar configuracao no chrome.storage.session (RAM rapida) e sincronizar Fachada POO do Navegador */
            if (apiChrome.storage.session) {
                apiChrome.storage.session.set({ cacheConfigJusGov: config }).catch(() => { });
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
            this.sincronizarComportamentoIcone(config.comportamentoCliqueIcone, apiChrome);
            this.desenharIconeVetorialFallback(config.modoTurbo, config.comportamentoCliqueIcone, apiChrome);

            return config;
        }

        /*
         * FUNCAO / MÉTODO: sincronizarComportamentoIcone
         * OBJETIVO DE RECONSTRUCAO: Sincronizar o comportamento dinamico do botao de acao
         * da extensao no Google Chrome (Manifest V3):
         * - "acoes_rapidas": Remove o popup nativo (setPopup = ""), permitindo que
         *   1 clique alterne o modo (Global -> Lista -> Desligado) e 2 cliques abram Opcoes.
         * - "popup" (padrao): Restaura "popup.html" como popup nativo, abrindo o painel com 1 clique.
         */
        sincronizarComportamentoIcone(comportamento, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.action || !apiChrome.action.setPopup) return;
            try {
                if (comportamento === 'acoes_rapidas') {
                    apiChrome.action.setPopup({ popup: '' });
                } else {
                    apiChrome.action.setPopup({ popup: 'src/cfg/popup.html' });
                }
            } catch (_) { }
        }

        /*
         * FUNCAO / MÉTODO: desenharIconeVetorialFallback
         * OBJETIVO DE RECONSTRUCAO: Desenhar o icone vetorial com as faixas documentais
         * e o raio amarelo ("raiozinho") em OffscreenCanvas conforme a paleta de modos:
         * - Modo Global (Ativo Global): Fundo Verde Esmeralda (#10b981), Borda #059669, Raio Amarelo (#fef08a).
         * - Modo Lista (Ativo Lista): Fundo Azul Real (#1a73e8), Borda #1557b0, Raio Amarelo (#fbbc04).
         * - Modo Desligado (Pausado): Fundo Cinza (#64748b), Borda #475569, Raio Cinza Claro (#cbd5e1).
         */
        desenharIconeVetorialFallback(modoAtivo, comportamento, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (typeof OffscreenCanvas === 'undefined' || !apiChrome || !apiChrome.action || !apiChrome.action.setIcon) {
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

                if (apiChrome.action.setTitle) {
                    const subtituloAcao = (comportamento === 'acoes_rapidas')
                        ? '\n(1 clique: alternar modo | 2 cliques: abrir Opcoes)'
                        : '\n(1 clique: abrir popup)';
                    apiChrome.action.setTitle({
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

                apiChrome.action.setIcon({ imageData: imageDataMap }).catch(() => { });
            } catch (_) { }
        }
    }

    Object.freeze(JusGovConfiguracoes.prototype);
    return Object.freeze(JusGovConfiguracoes);
}));

