/* ==========================================================================
 * ARQUIVO: src/lib/lib-injecao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Gerenciamento, Registro e Injeção de Scripts/CSS
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-injecao.js
 * - Classe Exportada: JusGovInjecaoScripts (self.JusGovInjecaoScripts / window.JusGovInjecaoScripts)
 * - Métodos Públicos: filtrarArquivosExistentes, enfileirarRegistro, injetarRetroativamenteNasAbasAbertas, agendarInjecaoSeguraNaAba,
 *   obterArquivosNucleoCopia, obterArquivosModuloInput, obterArquivosConteudoIntegrado, obterArquivosCssPje, limparDebounceAba, limparUisOrfasEmAbasAbertas
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seção 3 (BP-06 / ARQ-01)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Gerenciar a serialização assíncrona (Promise Queue) de desregistro e registro dinâmico
 *    de Content Scripts e folhas de estilo CSS (`chrome.scripting.registerContentScripts`),
 *    além da injeção retroativa sem reload (F5) em abas abertas e debounce seguro de 350ms
 *    para subframes e iframes dinâmicos.
 * 2) PREVENÇÃO DE CONCORRÊNCIA E RACE CONDITIONS:
 *    Mantém fila sequencial determinística de promessas para prevenir erros de "Duplicate script ID"
 *    no motor Chromium durante múltiplos eventos simultâneos de storage e ciclo de vida.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovInjecaoScripts = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Grupo 2: CÓPIA INTELIGENTE + Bibliotecas UI (Tela/Ancorado) + Módulos Globais (mod-XPath e mod-colar) */
    const ARQUIVOS_NUCLEO_MODULO_COPIA = Object.freeze([
        'src/cfg/cfg-defaults.js',
        'src/lib/lib-base-modulo.js',
        'src/lib/lib-constantes-catalogo.js',
        'src/lib/lib-constantes.js',
        'src/lib/lib-verificadores-docs.js',
        'src/lib/lib-verificadores-boletos.js',
        'src/lib/lib-verificadores.js',
        'src/lib/lib-escopo-url.js',
        'src/lib/lib-ui-tela.js',
        'src/lib/lib-ui-ancorado.js',
        'src/mod-XPath/xpath-extratores.js',
        'src/mod-XPath/xpath-dialogo.js',
        'src/mod-XPath/xpath-inspetor-ui.js',
        'src/mod-XPath/xpath-regras-inspetor.js',
        'src/mod-XPath/mod-xpath.js',
        'src/mod-colar/colar-formatacao.js',
        'src/mod-colar/mod-colar.js',
        'src/mod-input/input-orquestrador-mouse.js',
        'src/mod-copia/copia-synccfg.js',
        'src/mod-copia/copia-dom.js',
        'src/mod-copia/copia-teclado.js',
        'src/mod-copia/copia-politica-selecao.js',
        'src/mod-copia/lib-copia-padroes.js',
        'src/mod-copia/lib-copia-filtros-texto.js',
        'src/mod-copia/copia-aviso-auditoria.js',
        'src/mod-copia/copia-aviso-render.js',
        'src/mod-copia/copia-aviso-flutuante.js',
        'src/mod-copia/copia-clipboard.js',
        'src/mod-copia/copia-acumulador-tabela.js',
        'src/mod-copia/copia-acumulador.js',
        'src/mod-copia/copia-geometria.js',
        'src/mod-copia/copia-filtros-html-basico.js',
        'src/mod-copia/copia-filtros-html-niveis.js',
        'src/mod-copia/copia-filtros-html.js',
        'src/mod-copia/copia-filtros.js',
        'src/mod-copia/copia-validadores.js',
        'src/mod-copia/copia-minutas.js',
        'src/mod-copia/copia-visual-marcadores.js',
        'src/mod-copia/copia-visual-flash.js',
        'src/mod-copia/copia-visual.js',
        'src/mod-copia/copia-estagio1.js',
        'src/mod-copia/copia-estagio2.js',
        'src/mod-copia/copia-estagio3.js',
        'src/mod-copia/copia-estagio4.js',
        'src/mod-copia/copia-estagio5.js',
        'src/mod-copia/copia-estagio6.js',
        'src/mod-copia/copia-comportamento-links.js',
        'src/mod-copia/copia-comportamento-dom.js',
        'src/mod-copia/copia-progressao.js',
        'src/mod-copia/copia-copiar-nativo.js',
        'src/mod-copia/copia-copiar.js',
        'src/mod-copia/copia-monitor-dom.js',
        'src/mod-copia/mod-copia.js'
    ]);

    /* Grupo 3: TECLADO/MOUSE — Submódulos POO de navegação por teclado, botões laterais 4/5, botão do meio, F1 e caixa rápida */
    const ARQUIVOS_MODULO_INPUT = Object.freeze([
        'src/mod-input/input-botoes-laterais.js',
        'src/mod-input/input-botao-meio.js',
        'src/mod-input/input-teclado-campos.js',
        'src/mod-input/input-atalho-f1.js',
        'src/mod-input/input-caixa-rapida.js',
        'src/mod-input/mod-input.js'
    ]);

    /* Grupo Automação PJe (Isolado e Opcional) — Submódulos POO declarativos XPath/CSS/PAD-Custom, Espera, Diálogos e Motor de Fluxo */
    const ARQUIVOS_MODULO_AUTOMATE = Object.freeze([
        'src/mod-automate/automate-seletores-pad.js',
        'src/mod-automate/automate-seletores.js',
        'src/mod-automate/automate-espera.js',
        'src/mod-automate/automate-dialogos.js',
        'src/mod-automate/automate-fluxo-tarefas.js',
        'src/mod-automate/automate-fluxo-movimentos.js',
        'src/mod-automate/automate-motor-fluxo.js',
        'src/mod-automate/automate-contextos.js',
        'src/mod-automate/automate-barra-pje.js',
        'src/mod-automate/mod-automate.js'
    ]);

    /* Cadeia determinística unificada do Content Script (espelhando 1:1 a ordem de options.html e executar_testes.html):
     * 1º Núcleo Grupo 1 (Anti-Ampulheta POO) -> 2º Núcleo Grupo 2 (Cópia POO) -> 3º Núcleo Grupo 3 (Input POO) -> 4º Módulo Automate Opcional -> 5º Orquestrador DOM copia-selecionar.js */
    const ARQUIVOS_CONTEUDO_INTEGRADO = Object.freeze([
        'src/mod-anti-ampulheta/mod-anti-ampulheta.js',
        ...ARQUIVOS_NUCLEO_MODULO_COPIA,
        ...ARQUIVOS_MODULO_INPUT,
        ...ARQUIVOS_MODULO_AUTOMATE,
        'src/mod-copia/copia-selecionar.js'
    ]);

    const ARQUIVOS_PROTECAO_MAIN = Object.freeze([
        'src/mod-copia/copia-protecao-main.js'
    ]);

    const ARQUIVOS_MODULO_CSS_PJE = Object.freeze([
        'src/mod-anti-ampulheta/pje-anti-ampulheta.css',
        'src/mod-anti-ampulheta/eproc-anti-ampulheta.css',
        'src/mod-anti-ampulheta/seeu-projudi-anti-ampulheta.css',
        'src/mod-anti-ampulheta/saj-anti-ampulheta.css',
        'src/mod-anti-ampulheta/pdpj-stf-stj-anti-ampulheta.css',
        'src/mod-anti-ampulheta/creta-anti-ampulheta.css',
        'src/mod-anti-ampulheta/generico-anti-ampulheta.css'
    ]);

    class JusGovInjecaoScripts {
        constructor(dependencias = {}) {
            this.urls = dependencias.urls || null;
            this.promiseFila = Promise.resolve();
            this.mapaDebounceInjecaoTab = new Map();
            this.mapaExistenciaArquivos = new Map();
        }

        /**
         * Filtra apenas os caminhos de script/CSS que existem fisicamente no pacote da extensão.
         * Garante que a remoção de um diretório inteiro de módulo (src/mod-*) não quebre a injeção
         * nem impeça o funcionamento dos demais módulos (Diretriz Root 5.30).
         */
        async filtrarArquivosExistentes(listaCaminhos, chromeApi = null) {
            if (!Array.isArray(listaCaminhos) || listaCaminhos.length === 0) return [];
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.runtime || typeof apiChrome.runtime.getURL !== 'function' || typeof fetch !== 'function') {
                return [...listaCaminhos];
            }
            const verif = await Promise.all(listaCaminhos.map(async (caminho) => {
                if (!caminho) return null;
                if (this.mapaExistenciaArquivos.has(caminho)) {
                    return this.mapaExistenciaArquivos.get(caminho) ? caminho : null;
                }
                try {
                    const urlExt = apiChrome.runtime.getURL(caminho);
                    const resp = await fetch(urlExt);
                    const existe = Boolean(resp && (resp.ok || resp.status === 200));
                    this.mapaExistenciaArquivos.set(caminho, existe);
                    return existe ? caminho : null;
                } catch (_) {
                    this.mapaExistenciaArquivos.set(caminho, false);
                    return null;
                }
            }));
            return verif.filter(Boolean);
        }

        obterArquivosNucleoCopia() {
            return ARQUIVOS_NUCLEO_MODULO_COPIA;
        }

        obterArquivosNucleoModuloCopia() {
            return ARQUIVOS_NUCLEO_MODULO_COPIA;
        }

        obterArquivosModuloInput() {
            return ARQUIVOS_MODULO_INPUT;
        }

        obterArquivosModuloAutomate() {
            return ARQUIVOS_MODULO_AUTOMATE;
        }

        obterArquivosConteudoIntegrado() {
            return ARQUIVOS_CONTEUDO_INTEGRADO;
        }

        obterArquivosCssPje() {
            return ARQUIVOS_MODULO_CSS_PJE;
        }

        obterArquivosProtecaoMain() {
            return ARQUIVOS_PROTECAO_MAIN;
        }

        /*
         * FUNCAO / MÉTODO: enfileirarRegistro
         * OBJETIVO DE RECONSTRUCAO: Desregistrar scripts antigos e registrar o conjunto
         * atualizado de Content Scripts na fila sequencial promiseFila, evitando Race
         * Conditions na API chrome.scripting.
         */
        enfileirarRegistro(urlsTurbo, urlsAmpuletas, modoTurbo, estadoAmpuletas, chromeApi = null, utilUrlsOpcional = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.scripting) return Promise.resolve();

            const urlsUtil = utilUrlsOpcional || this.urls || (typeof self !== 'undefined' && self.JusGovUrls ? new self.JusGovUrls() : null);

            /* Passo 3.1: Encadear operacao na fila sequencial de promessas */
            this.promiseFila = this.promiseFila.then(async () => {
                try {
                    /* Passo 3.2: Limpar todos os registros dinamicos anteriores */
                    await apiChrome.scripting.unregisterContentScripts();

                    /* Passo 3.3: Configurar registro do Modulo Anti-Ampulhetas (CSS em document_start) */
                    if (estadoAmpuletas !== false && Array.isArray(urlsAmpuletas) && urlsAmpuletas.length > 0) {
                        const matchesPje = urlsUtil && typeof urlsUtil.sanitizarParaMatches === 'function'
                            ? urlsUtil.sanitizarParaMatches(urlsAmpuletas)
                            : [];
                        if (matchesPje.length > 0) {
                            const cssExistentes = await this.filtrarArquivosExistentes(ARQUIVOS_MODULO_CSS_PJE, apiChrome);
                            if (cssExistentes.length > 0) {
                                try {
                                    await apiChrome.scripting.registerContentScripts([{
                                        id: 'modulo-anti-ampulheta',
                                        matches: matchesPje,
                                        css: cssExistentes,
                                        runAt: 'document_start',
                                        allFrames: true
                                    }]);
                                } catch (errCss) {
                                    console.warn('[JusGovBR] Aviso ao registrar CSS Anti-Ampulhetas:', errCss);
                                }
                            }
                        }
                    }

                    /* Passo 3.4: Registro dinâmico dos Content Scripts JS no motor nativo do Chrome
                     * Configurado com runAt: 'document_start' e '<all_urls>' + matchAboutBlank: true para vincular
                     * periféricos globais (botões 4/5, botão do meio em iframes CKEditor about:blank e guias vazias)
                     * instantaneamente no primeiro ciclo do navegador; o filtro de domínios da seleção/cópia é
                     * aplicado em tempo real por verificarUrlPermitida() dentro de copia-selecionar.js. */
                    if (modoTurbo !== 'desligado') {
                        const matchesTurbo = ['<all_urls>'];
                        const [jsExistentes, mainExistentes] = await Promise.all([
                            this.filtrarArquivosExistentes(ARQUIVOS_CONTEUDO_INTEGRADO, apiChrome),
                            this.filtrarArquivosExistentes(ARQUIVOS_PROTECAO_MAIN, apiChrome)
                        ]);
                        const scriptsParaRegistrar = [];
                        if (jsExistentes.length > 0) {
                            scriptsParaRegistrar.push({
                                id: 'jusgovbr-conteudo-integrado',
                                matches: matchesTurbo,
                                js: jsExistentes,
                                runAt: 'document_start',
                                allFrames: true,
                                matchAboutBlank: true
                            });
                        }
                        if (mainExistentes.length > 0) {
                            scriptsParaRegistrar.push({
                                id: 'jusgovbr-protecao-copia-main',
                                matches: matchesTurbo,
                                js: mainExistentes,
                                runAt: 'document_start',
                                allFrames: true,
                                matchAboutBlank: true,
                                world: 'MAIN'
                            });
                        }
                        if (scriptsParaRegistrar.length > 0) {
                            try {
                                await apiChrome.scripting.registerContentScripts(scriptsParaRegistrar);
                            } catch (errJs) {
                                console.warn('[JusGovBR] Aviso ao registrar scripts nativos de conteúdo:', errJs);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[JusGovBR] Aviso ao atualizar registro de scripts:', err);
                }
            }).catch(err => console.warn('[JusGovBR] Erro na fila de registro:', err));

            return this.promiseFila;
        }

        /*
         * FUNCAO / MÉTODO: injetarRetroativamenteNasAbasAbertas
         * OBJETIVO DE RECONSTRUCAO: Garantir que abas ja abertas antes da instalacao ou
         * alteracao de configuracoes recebam imediatamente os modulos JS e CSS e a
         * atualizacao de estado, sem exigir que o usuario pressione F5.
         */
        async injetarRetroativamenteNasAbasAbertas(config, chromeApi = null, utilUrlsOpcional = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.tabs || !apiChrome.scripting) return;

            const urlsUtil = utilUrlsOpcional || this.urls || (typeof self !== 'undefined' && self.JusGovUrls ? new self.JusGovUrls() : null);

            /* Passo 3.6: Consultar todas as abas abertas no navegador */
            try {
                const tabs = await apiChrome.tabs.query({});
                for (let i = 0; i < tabs.length; i++) {
                    const tab = tabs[i];
                    if (!tab || !tab.id || !tab.url) continue;

                    /* Ignorar abas descartadas da memoria ou com esquemas restritos (permitindo about:blank) */
                    if (tab.discarded || /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(tab.url) || (/^about:/i.test(tab.url) && tab.url !== 'about:blank')) {
                        continue;
                    }

                    /* Passo 3.7: Notificar instancia ja presente na aba sobre o novo estado e opcoes avancadas */
                    apiChrome.tabs.sendMessage(tab.id, {
                        acao: 'atualizarEstadoModulo',
                        modoTurbo: config.modoTurbo,
                        urlsTurbo: config.urlsTurbo,
                        ativoAmpuletas: config.ativoAmpuletas !== false,
                        automatePjeAtivo: Boolean(config.automatePjeAtivo),
                        manterFormatacaoBasica: Boolean(config.manterFormatacaoBasica),
                        nivelFiltroFormatacao: config.nivelFiltroFormatacao || 'basico',
                        modoRetirarSelecao: config.modoRetirarSelecao || ((config.tempoFlashBorderMs === 0) ? 'nenhuma' : 'com_flash'),
                        selecaoEditavelAtiva: config.modoPlaceholdersMinutasHtml ? (config.modoPlaceholdersMinutasHtml !== 'desabilitado') : (config.selecaoEditavelAtiva !== false),
                        modoPlaceholdersMinutasHtml: config.modoPlaceholdersMinutasHtml || ((config.placeholdersMinutasHtmlAtivo === false || config.selecaoEditavelAtiva === false) ? 'desabilitado' : 'placeholders'),
                        placeholdersMinutasHtmlAtivo: config.modoPlaceholdersMinutasHtml ? (config.modoPlaceholdersMinutasHtml !== 'desabilitado') : (config.placeholdersMinutasHtmlAtivo !== false),
                        colagemBotaoDireitoAtiva: Boolean(config.colagemBotaoDireitoAtiva),
                        capturaBotoesMouse4e5Ativa: config.capturaBotoesMouse4e5Ativa !== false,
                        colarBotaoMeioAtivo: config.colarBotaoMeioAtivo !== false,
                        navegacaoTecladoCamposAtiva: config.navegacaoTecladoCamposAtiva !== false,
                        validacaoMatematicaAtiva: config.validacaoMatematicaAtiva !== false,
                        modoExibicaoValidacao: config.modoExibicaoValidacao || 'sempre',
                        tempoFlashBorderMs: typeof config.tempoFlashBorderMs === 'number' ? config.tempoFlashBorderMs : 500,
                        corFlashBorder: typeof config.corFlashBorder === 'string' ? config.corFlashBorder : '#0d9488',
                        minimoCaracteresInterface: typeof config.minimoCaracteresInterface === 'number' ? config.minimoCaracteresInterface : 0,
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
                        const [jsExistentes, mainExistentes] = await Promise.all([
                            this.filtrarArquivosExistentes(ARQUIVOS_CONTEUDO_INTEGRADO, apiChrome),
                            this.filtrarArquivosExistentes(ARQUIVOS_PROTECAO_MAIN, apiChrome)
                        ]);
                        if (mainExistentes.length > 0) {
                            apiChrome.scripting.executeScript({
                                target: { tabId: tab.id, allFrames: true },
                                files: mainExistentes,
                                world: 'MAIN'
                            }).catch(() => { });
                        }
                        if (jsExistentes.length > 0) {
                            apiChrome.scripting.executeScript({
                                target: { tabId: tab.id, allFrames: true },
                                files: jsExistentes
                            }).catch(() => { });
                        }
                    } else if (config.automatePjeAtivo) {
                        const autoExistentes = await this.filtrarArquivosExistentes(ARQUIVOS_MODULO_AUTOMATE, apiChrome);
                        if (autoExistentes.length > 0) {
                            apiChrome.scripting.executeScript({
                                target: { tabId: tab.id, allFrames: false },
                                files: autoExistentes
                            }).catch(() => { });
                        }
                    }

                    /* Passo 3.9: Se o PJe Anti-Ampulhetas estiver ativo para esta URL, garantir que o CSS esteja injetado; caso desativado, remover dinamicamente sem reload */
                    const correspondePje = urlsUtil && typeof urlsUtil.urlCorrespondeAosPadroes === 'function'
                        ? urlsUtil.urlCorrespondeAosPadroes(tab.url, config.urlsAmpuletas || [])
                        : false;

                    if (correspondePje) {
                        const cssExistentes = await this.filtrarArquivosExistentes(ARQUIVOS_MODULO_CSS_PJE, apiChrome);
                        if (cssExistentes.length > 0) {
                            if (config.ativoAmpuletas !== false) {
                                apiChrome.scripting.insertCSS({
                                    target: { tabId: tab.id, allFrames: true },
                                    files: cssExistentes
                                }).catch(() => { });
                            } else if (config.ativoAmpuletas === false) {
                                apiChrome.scripting.removeCSS({
                                    target: { tabId: tab.id, allFrames: true },
                                    files: cssExistentes
                                }).catch(() => { });
                            }
                        }
                    }
                }
            } catch (_) { }
        }

        /*
         * FUNCAO / MÉTODO: agendarInjecaoSeguraNaAba
         * OBJETIVO DE RECONSTRUCAO: Injetar e sincronizar automaticamente ao concluir o
         * carregamento de abas e frames com debounce de 350ms para evitar sobrecarga.
         */
        agendarInjecaoSeguraNaAba(tabId, frameIdsOpcional = null, chromeApi = null, faseOpcional = 'padrao') {
            if (!tabId) return;
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.scripting) return;

            const agora = Date.now();
            const chaveBase = frameIdsOpcional ? `${tabId}_${frameIdsOpcional.join(',')}` : `${tabId}_all`;
            const chave = `${chaveBase}_${faseOpcional || 'padrao'}`;
            const ultimo = this.mapaDebounceInjecaoTab.get(chave) || 0;
            if ((agora - ultimo) < 350) return;
            this.mapaDebounceInjecaoTab.set(chave, agora);

            const target = (Array.isArray(frameIdsOpcional) && frameIdsOpcional.length > 0)
                ? { tabId, frameIds: frameIdsOpcional }
                : { tabId, allFrames: true };

            (async () => {
                const [jsExistentes, mainExistentes] = await Promise.all([
                    this.filtrarArquivosExistentes(ARQUIVOS_CONTEUDO_INTEGRADO, apiChrome),
                    this.filtrarArquivosExistentes(ARQUIVOS_PROTECAO_MAIN, apiChrome)
                ]);
                if (mainExistentes.length > 0) {
                    await apiChrome.scripting.executeScript({
                        target,
                        files: mainExistentes,
                        injectImmediately: true,
                        world: 'MAIN'
                    });
                }
                if (jsExistentes.length === 0) return;
                await apiChrome.scripting.executeScript({
                    target,
                    files: jsExistentes,
                    injectImmediately: true
                });
            })().catch(() => { });
        }

        limparDebounceAba(tabId) {
            if (tabId) {
                this.mapaDebounceInjecaoTab.delete(tabId);
            }
        }

        /**
         * Injeta sob demanda o modulo isolado Automacao de Tarefas (`src/mod-automate/`) no frame principal
         * de uma aba especifica (inclusive quando `modoTurbo` estiver em `url` ou `desligado`).
         * @param {number} tabId
         * @param {Object} [chromeApi]
         * @returns {Promise<boolean>}
         */
        async garantirModuloAutomateNaAba(tabId, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!tabId || !apiChrome || !apiChrome.scripting || typeof apiChrome.scripting.executeScript !== 'function') {
                return false;
            }
            try {
                const autoExistentes = await this.filtrarArquivosExistentes(ARQUIVOS_MODULO_AUTOMATE, apiChrome);
                if (autoExistentes.length === 0) return false;
                await apiChrome.scripting.executeScript({
                    target: { tabId, allFrames: false },
                    files: autoExistentes,
                    injectImmediately: true
                });
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Injeta folhas CSS anti-ampulhetas sob demanda no carregamento de uma aba compativel.
         */
        async injetarCssAmpuletasNaAba(tabId, url, config, chromeApi = null, urlsUtilOpcional = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const urlsUtil = urlsUtilOpcional || this.urls;
            if (!tabId || !url || !config || config.ativoAmpuletas === false) return false;
            if (!apiChrome || !apiChrome.scripting || typeof apiChrome.scripting.insertCSS !== 'function') return false;
            const corresponde = urlsUtil && typeof urlsUtil.urlCorrespondeAosPadroes === 'function'
                ? urlsUtil.urlCorrespondeAosPadroes(url, config.urlsAmpuletas || [])
                : false;
            if (!corresponde) return false;
            try {
                const cssExistentes = await this.filtrarArquivosExistentes(ARQUIVOS_MODULO_CSS_PJE, apiChrome);
                if (cssExistentes.length === 0) return false;
                await apiChrome.scripting.insertCSS({
                    target: { tabId, allFrames: true },
                    files: cssExistentes
                });
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Remove interfaces orfas (minipopups, barras, modais e inspetores) deixadas por
         * versoes/contextos invalidados da extensao nas abas abertas antes da reinjecao limpa (FEAT-88).
         */
        async limparUisOrfasEmAbasAbertas(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.tabs || !apiChrome.scripting) return 0;

            const fnLimparOrfaos = () => {
                let tinhaAutomateOrfao = false;
                try {
                    document.querySelectorAll(
                        '#jusgov-inspetor-tempo-real, [data-jusgov-inspetor="true"], #jusgov-modal-mapeamento-regra, #jusgov-hospedeiro-top-layer, .jusgov-dialog-input-rapido, #jusgov-automate-dialog-overlay, #jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"], #jusgov-validacao-flutuante, #jusgov-pasted-markers-container, [data-jusgov-pasted-container="true"], #jusgov-pomodoro-backdrop-global, #jusgov-modal-produtividade-trabalho'
                    ).forEach((el) => {
                        try { el.remove(); } catch (_) { }
                    });
                    document.querySelectorAll('#jusgov-pomodoro-barra-global, [data-jusgov-pomodoro-bar="true"]').forEach((el) => {
                        if (typeof el.__jusgovAplicarSnapshotExterno !== 'function') {
                            try { el.remove(); } catch (_) { }
                        }
                    });
                    const barraAuto = document.getElementById('jusgov-automate-pje-barra');
                    if (barraAuto && !barraAuto.__jusgovAutomateOwner) {
                        tinhaAutomateOrfao = true;
                        try { barraAuto.remove(); } catch (_) { }
                    }
                    if (typeof CSS !== 'undefined' && CSS.highlights && typeof CSS.highlights.delete === 'function') {
                        CSS.highlights.delete('jusgov-flash-copy');
                    }
                } catch (_) { }
                return { tinhaAutomateOrfao };
            };

            try {
                const tabs = await apiChrome.tabs.query({});
                const tarefas = [];
                for (let i = 0; i < tabs.length; i++) {
                    const tab = tabs[i];
                    if (!tab || !tab.id || !tab.url) continue;
                    if (tab.discarded || /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(tab.url) || (/^about:/i.test(tab.url) && tab.url !== 'about:blank')) {
                        continue;
                    }
                    tarefas.push(
                        apiChrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: fnLimparOrfaos
                        }).then((res) => {
                            const primeiro = Array.isArray(res) ? res[0] : null;
                            if (primeiro && primeiro.result && primeiro.result.tinhaAutomateOrfao) {
                                return this.garantirModuloAutomateNaAba(tab.id, apiChrome).catch(() => false);
                            }
                            return true;
                        }).catch(() => null)
                    );
                }
                if (tarefas.length > 0) {
                    await Promise.allSettled(tarefas);
                }
                return tarefas.length;
            } catch (_) {
                return 0;
            }
        }
    }

    Object.freeze(JusGovInjecaoScripts.prototype);
    return Object.freeze(JusGovInjecaoScripts);
}));
