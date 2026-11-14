/* ==========================================================================
 * Nome do arquivo: lib-injecao.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Gerenciamento, Registro e Injeção de Scripts/CSS
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-injecao.js
 * - Classe Exportada: JusGovInjecaoScripts (self.JusGovInjecaoScripts / window.JusGovInjecaoScripts)
 * - Métodos Públicos: enfileirarRegistro, injetarRetroativamenteNasAbasAbertas, agendarInjecaoSeguraNaAba,
 *   obterArquivosNucleoCopia, obterArquivosModuloInput, obterArquivosConteudoIntegrado, obterArquivosCssPje
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

    /* Grupo 2: CÓPIA INTELIGENTE — Núcleo desacoplado de constantes, auditoria, acumulador e estágios POO */
    const ARQUIVOS_NUCLEO_MODULO_COPIA = Object.freeze([
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

    /* Grupo 3: TECLADO/MOUSE — Submódulos POO de navegação por teclado, botões laterais 4/5, botão do meio, F1 e caixa rápida */
    const ARQUIVOS_MODULO_INPUT = Object.freeze([
        'src/mod-input/input-botoes-laterais.js',
        'src/mod-input/input-botao-meio.js',
        'src/mod-input/input-teclado-campos.js',
        'src/mod-input/input-atalho-f1.js',
        'src/mod-input/input-caixa-rapida.js',
        'src/mod-input/mod-input.js'
    ]);

    /* Cadeia determinística unificada do Content Script (espelhando 1:1 a ordem de options.html e executar_testes.html):
     * 1º Núcleo Grupo 1 (Anti-Ampulheta POO) -> 2º Núcleo Grupo 2 (Cópia POO) -> 3º Núcleo Grupo 3 (Input POO) -> 4º Orquestrador DOM copia-selecionar.js */
    const ARQUIVOS_CONTEUDO_INTEGRADO = Object.freeze([
        'src/mod-anti-ampulheta/mod-anti-ampulheta.js',
        ...ARQUIVOS_NUCLEO_MODULO_COPIA,
        ...ARQUIVOS_MODULO_INPUT,
        'src/mod-copia/copia-selecionar.js'
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

        obterArquivosConteudoIntegrado() {
            return ARQUIVOS_CONTEUDO_INTEGRADO;
        }

        obterArquivosCssPje() {
            return ARQUIVOS_MODULO_CSS_PJE;
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
                            try {
                                await apiChrome.scripting.registerContentScripts([{
                                    id: 'modulo-anti-ampulheta',
                                    matches: matchesPje,
                                    css: [...ARQUIVOS_MODULO_CSS_PJE],
                                    runAt: 'document_start',
                                    allFrames: true
                                }]);
                            } catch (errCss) {
                                console.warn('[JusGovBR] Aviso ao registrar CSS Anti-Ampulhetas:', errCss);
                            }
                        }
                    }

                    /* Passo 3.4: Registro dinâmico dos Content Scripts JS no motor nativo do Chrome
                     * Configurado com runAt: 'document_start' para vincular os botões do mouse e o teclado
                     * instantaneamente no primeiro ciclo do navegador, sem ter que esperar a página carregar */
                    if (modoTurbo !== 'desligado') {
                        let matchesTurbo = ['<all_urls>'];
                        if (modoTurbo === 'url' && Array.isArray(urlsTurbo) && urlsTurbo.length > 0) {
                            const sanitizadas = urlsUtil && typeof urlsUtil.sanitizarParaMatches === 'function'
                                ? urlsUtil.sanitizarParaMatches(urlsTurbo)
                                : [];
                            if (sanitizadas.length > 0) matchesTurbo = sanitizadas;
                        }
                        try {
                            await apiChrome.scripting.registerContentScripts([{
                                id: 'jusgovbr-conteudo-integrado',
                                matches: matchesTurbo,
                                js: [...ARQUIVOS_CONTEUDO_INTEGRADO],
                                runAt: 'document_start',
                                allFrames: true,
                                matchAboutBlank: true
                            }]);
                        } catch (errJs) {
                            console.warn('[JusGovBR] Aviso ao registrar scripts nativos de conteúdo:', errJs);
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
                        manterFormatacaoBasica: Boolean(config.manterFormatacaoBasica),
                        nivelFiltroFormatacao: config.nivelFiltroFormatacao || 'basico',
                        modoRetirarSelecao: config.modoRetirarSelecao || 'parcial',
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
                        minimoCaracteresInterface: typeof config.minimoCaracteresInterface === 'number' ? config.minimoCaracteresInterface : 5,
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
                        apiChrome.scripting.executeScript({
                            target: { tabId: tab.id, allFrames: true },
                            files: [...ARQUIVOS_CONTEUDO_INTEGRADO]
                        }).catch(() => { });
                    }

                    /* Passo 3.9: Se o PJe Anti-Ampulhetas estiver ativo para esta URL, garantir que o CSS esteja injetado; caso desativado, remover dinamicamente sem reload */
                    const correspondePje = urlsUtil && typeof urlsUtil.urlCorrespondeAosPadroes === 'function'
                        ? urlsUtil.urlCorrespondeAosPadroes(tab.url, config.urlsAmpuletas || [])
                        : false;

                    if (config.ativoAmpuletas !== false && correspondePje) {
                        apiChrome.scripting.insertCSS({
                            target: { tabId: tab.id, allFrames: true },
                            files: [...ARQUIVOS_MODULO_CSS_PJE]
                        }).catch(() => { });
                    } else if (config.ativoAmpuletas === false && correspondePje) {
                        apiChrome.scripting.removeCSS({
                            target: { tabId: tab.id, allFrames: true },
                            files: [...ARQUIVOS_MODULO_CSS_PJE]
                        }).catch(() => { });
                    }
                }
            } catch (_) { }
        }

        /*
         * FUNCAO / MÉTODO: agendarInjecaoSeguraNaAba
         * OBJETIVO DE RECONSTRUCAO: Injetar e sincronizar automaticamente ao concluir o
         * carregamento de abas e frames com debounce de 350ms para evitar sobrecarga.
         */
        agendarInjecaoSeguraNaAba(tabId, frameIdsOpcional = null, chromeApi = null) {
            if (!tabId) return;
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.scripting) return;

            const agora = Date.now();
            const chave = frameIdsOpcional ? `${tabId}_${frameIdsOpcional.join(',')}` : `${tabId}_all`;
            const ultimo = this.mapaDebounceInjecaoTab.get(chave) || 0;
            if ((agora - ultimo) < 350) return;
            this.mapaDebounceInjecaoTab.set(chave, agora);

            const target = (Array.isArray(frameIdsOpcional) && frameIdsOpcional.length > 0)
                ? { tabId, frameIds: frameIdsOpcional }
                : { tabId, allFrames: true };

            apiChrome.scripting.executeScript({
                target,
                files: [...ARQUIVOS_CONTEUDO_INTEGRADO],
                injectImmediately: true
            }).catch(() => { });
        }

        limparDebounceAba(tabId) {
            if (tabId) {
                this.mapaDebounceInjecaoTab.delete(tabId);
            }
        }
    }

    Object.freeze(JusGovInjecaoScripts.prototype);
    return Object.freeze(JusGovInjecaoScripts);
}));
