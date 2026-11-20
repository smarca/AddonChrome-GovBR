/* ==========================================================================
 * ARQUIVO: src/cfg/lib-background.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Acessório Exclusivo do Service Worker (Helpers, Boot, Cache IPC & Roteamento Geral)
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/lib-background.js
 * - Classe Exportada: LibBackground (self.JusGovLibBackground) extends BaseModulo
 * - Métodos Públicos: obterCssAntiAmpulhetaDoPacote, obterJsonEstaticoDoPacote,
 *   registrarErroSw, garantirAlarmePeriodico, agendarSincronizacaoNuvemDebounced,
 *   sincronizarAoSairNavegador, executarRecargaLimpaExtensao, verificarBootFrioOuMudancaVersaoSw,
 *   tratarMensagemGeral(msg, sender, sendResponse)
 * - Regras / Seções: ENG-00 (background.js estritamente associador de eventos), ENG-05, Seção 6.288
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Concentra todos os procedimentos pesados e utilitários exclusivos do
 *    Service Worker MV3 (servidor interno de JSON/CSS, alarmes periódicos,
 *    boot frio/recarga limpa, sincronização na nuvem ao sair e roteamento IPC
 *    geral de perfis, injeção, UI tela, manutenção e navegador), permitindo que
 *    `src/cfg/background.js` atue apenas como registrador limpo de eventos.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibBackground = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'LibBackground'; }
        };

    const ARQUIVOS_JSON_ESTATICOS_PERMITIDOS = Object.freeze({
        'perfis.json': 'src/cfg/perfis.json',
        'interface.json': 'src/cfg/interface.json',
        'dados-forenses.json': 'src/cfg/dados-forenses.json',
        'regras-sistema.json': 'src/cfg/regras-sistema.json',
        'automate-dados.json': 'src/mod-automate/automate-dados.json'
    });

    const ARQUIVOS_CSS_ANTI_AMPULHETA_PERMITIDOS = Object.freeze({
        'pje-anti-ampulheta.css': 'src/mod-anti-ampulheta/pje-anti-ampulheta.css',
        'eproc-anti-ampulheta.css': 'src/mod-anti-ampulheta/eproc-anti-ampulheta.css',
        'seeu-projudi-anti-ampulheta.css': 'src/mod-anti-ampulheta/seeu-projudi-anti-ampulheta.css',
        'saj-anti-ampulheta.css': 'src/mod-anti-ampulheta/saj-anti-ampulheta.css',
        'pdpj-stf-stj-anti-ampulheta.css': 'src/mod-anti-ampulheta/pdpj-stf-stj-anti-ampulheta.css',
        'creta-anti-ampulheta.css': 'src/mod-anti-ampulheta/creta-anti-ampulheta.css',
        'generico-anti-ampulheta.css': 'src/mod-anti-ampulheta/generico-anti-ampulheta.css'
    });

    const ACOES_PERFIL = new Set([
        'OBTER_PERFIS', 'ALTERNAR_PERFIL', 'CRIAR_PERFIL', 'RENOMEAR_PERFIL', 'EXCLUIR_PERFIL', 'RESETAR_PERFIS'
    ]);

    const ALARMES = Object.freeze({
        DESCARTE_RAM: 'jusgov-descarte-ram',
        SYNC_NUVEM: 'jusgov-sync-nuvem-debounced',
        AUTO_LIMPEZA_5M: 'JUSGOV_AUTO_LIMPEZA_5M',
        TRABALHO_TICK: 'JUSGOV_TICK_TRABALHO',
        SYNC_STATS_30M: 'JUSGOV_SYNC_STATS_30M'
    });

    class LibBackground extends Base {
        #deps = {};
        #cacheJson = new Map();
        #cacheCss = new Map();
        #promessaRecargaLimpa = null;
        #recargaLimpaConcluida = false;

        static get ALARMES() {
            return ALARMES;
        }

        /**
         * @param {Object} deps Referências injetadas das fachadas do Service Worker
         */
        constructor(deps = {}) {
            super('LibBackground');
            this.#deps = deps || {};
        }

        registrarErroSw(origem, erro) {
            if (typeof self !== 'undefined' && self.__JUSGOV_DEBUG_SW__ === true && typeof console !== 'undefined' && console.warn) {
                console.warn(`[JusGovBR SW:${origem}]`, erro && erro.message ? erro.message : erro);
            }
        }

        async obterCssAntiAmpulhetaDoPacote(nomeArquivo, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const caminhoRel = ARQUIVOS_CSS_ANTI_AMPULHETA_PERMITIDOS[String(nomeArquivo || '')];
            if (!caminhoRel) return null;
            if (this.#cacheCss.has(caminhoRel)) return this.#cacheCss.get(caminhoRel);
            if (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function' && typeof fetch === 'function') {
                try {
                    const resp = await fetch(chromeApi.runtime.getURL(caminhoRel));
                    if (resp && resp.ok) {
                        const txt = await resp.text();
                        this.#cacheCss.set(caminhoRel, txt);
                        return txt;
                    }
                } catch (err) {
                    this.registrarErroSw('obterCssAntiAmpulhetaDoPacote', err);
                }
            }
            return null;
        }

        async obterJsonEstaticoDoPacote(nomeArquivo, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const caminhoRel = ARQUIVOS_JSON_ESTATICOS_PERMITIDOS[String(nomeArquivo || '')];
            if (!caminhoRel) return null;
            if (this.#cacheJson.has(caminhoRel)) return this.#cacheJson.get(caminhoRel);
            if (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getURL === 'function' && typeof fetch === 'function') {
                try {
                    const resp = await fetch(chromeApi.runtime.getURL(caminhoRel));
                    if (resp && resp.ok) {
                        const txt = await resp.text();
                        const dados = (typeof self !== 'undefined' && self.JusGovCfgDefaults && typeof self.JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                            ? self.JusGovCfgDefaults.parsearJsonComComentarios(txt)
                            : JSON.parse(String(txt || '').replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim());
                        this.#cacheJson.set(caminhoRel, dados);
                        return dados;
                    }
                } catch (err) {
                    this.registrarErroSw('obterJsonEstaticoDoPacote', err);
                }
            }
            return null;
        }

        garantirAlarmePeriodico(nome, periodInMinutes, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!chromeApi || !chromeApi.alarms || !chromeApi.alarms.get) return;
            try {
                chromeApi.alarms.get(nome, (existente) => {
                    if (chromeApi.runtime && chromeApi.runtime.lastError) return;
                    if (!existente) {
                        chromeApi.alarms.create(nome, { periodInMinutes });
                    }
                });
            } catch (err) {
                this.registrarErroSw(`garantirAlarmePeriodico:${nome}`, err);
            }
        }

        agendarSincronizacaoNuvemDebounced(minutosAtraso = 5, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (chromeApi && chromeApi.alarms) {
                try {
                    chromeApi.alarms.create(ALARMES.SYNC_NUVEM, { delayInMinutes: Math.max(1, Number(minutosAtraso) || 5) });
                    return;
                } catch (err) {
                    this.registrarErroSw('agendarSincronizacaoNuvemDebounced', err);
                }
            }
            const { config, urls, injecao, navegador } = this.#deps;
            if (config && typeof config.executarSincronizacaoNuvemCoalescida === 'function') {
                config.executarSincronizacaoNuvemCoalescida(chromeApi, { urls, injecao, navegador })
                    .catch((err) => this.registrarErroSw('syncFallback', err));
            }
        }

        async sincronizarAoSairNavegador(chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const { config, urls, injecao, navegador, produtividade } = this.#deps;
            try {
                if (config && typeof config.executarSincronizacaoNuvemCoalescida === 'function') {
                    await config.executarSincronizacaoNuvemCoalescida(chromeApi, { urls, injecao, navegador });
                }
            } catch (_) { }
            try {
                if (produtividade && typeof produtividade.salvarResumoProdutividadeNuvemAoSair === 'function') {
                    await produtividade.salvarResumoProdutividadeNuvemAoSair(chromeApi, { encerradoLimpo: true });
                }
            } catch (_) { }
        }

        async executarRecargaLimpaExtensao(motivo = 'boot', chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#recargaLimpaConcluida) return;
            if (this.#promessaRecargaLimpa) return this.#promessaRecargaLimpa;
            const { injecao } = this.#deps;
            this.#promessaRecargaLimpa = (async () => {
                try {
                    const versaoAtual = (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getManifest === 'function')
                        ? String((chromeApi.runtime.getManifest() || {}).version || '')
                        : '';
                    if (injecao && typeof injecao.limparUisOrfasEmAbasAbertas === 'function') {
                        await injecao.limparUisOrfasEmAbasAbertas(chromeApi).catch(() => { });
                    }
                    if (chromeApi && chromeApi.storage && chromeApi.storage.session && typeof chromeApi.storage.session.set === 'function') {
                        await chromeApi.storage.session.set({
                            jusgovSwBootToken: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            jusgovSwMotivoBoot: String(motivo || 'boot')
                        }).catch(() => { });
                    }
                    if (versaoAtual && chromeApi && chromeApi.storage && chromeApi.storage.local) {
                        await chromeApi.storage.local.set({ jusgovUltimaVersaoExecutada: versaoAtual }).catch(() => { });
                    }
                    this.#recargaLimpaConcluida = true;
                } catch (err) {
                    this.registrarErroSw(`executarRecargaLimpaExtensao:${motivo}`, err);
                } finally {
                    this.#promessaRecargaLimpa = null;
                }
            })();
            return this.#promessaRecargaLimpa;
        }

        async verificarBootFrioOuMudancaVersaoSw(sincronizarEstadoFn, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (this.#recargaLimpaConcluida || this.#promessaRecargaLimpa) return;
            try {
                const versaoAtual = (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getManifest === 'function')
                    ? String((chromeApi.runtime.getManifest() || {}).version || '')
                    : '';
                let precisaLimpar = false;
                if (chromeApi && chromeApi.storage && chromeApi.storage.session && typeof chromeApi.storage.session.get === 'function') {
                    const ses = await chromeApi.storage.session.get(['jusgovSwBootToken']).catch(() => ({}));
                    if (!ses || !ses.jusgovSwBootToken) precisaLimpar = true;
                }
                if (!precisaLimpar && versaoAtual && chromeApi && chromeApi.storage && chromeApi.storage.local) {
                    const loc = await chromeApi.storage.local.get(['jusgovUltimaVersaoExecutada']).catch(() => ({}));
                    if (!loc || loc.jusgovUltimaVersaoExecutada !== versaoAtual) precisaLimpar = true;
                }
                if (this.#recargaLimpaConcluida || this.#promessaRecargaLimpa) return;
                if (precisaLimpar) {
                    await this.executarRecargaLimpaExtensao('boot_frio_ou_versao', chromeApi);
                    if (typeof sincronizarEstadoFn === 'function') await sincronizarEstadoFn();
                } else {
                    this.#recargaLimpaConcluida = true;
                }
            } catch (_) { }
        }

        /**
         * Roteador geral de mensagens IPC do Service Worker (exceto Produtividade/Pomodoro, que reside em produt-ipc.js).
         * @param {Object} msg
         * @param {Object} sender
         * @param {Function} sendResponse
         * @param {Object} [chromeApi]
         * @returns {boolean}
         */
        tratarMensagemGeral(msg, sender, sendResponse, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!msg || typeof msg.acao !== 'string') return false;
            const acao = msg.acao;
            const {
                urls, injecao, navegador, config, manutencao, produtividade, automate, uiTela,
                obterConfiguracoesGerais, sincronizarEstado
            } = this.#deps;
            const depsConfig = { urls, injecao, navegador };

            if (acao === 'OBTER_JSON_ESTATICO' || acao === 'OBTER_ARQUIVO_JSON_ESTATICO') {
                this.obterJsonEstaticoDoPacote(msg.arquivo, chromeApi)
                    .then((dados) => sendResponse({ ok: Boolean(dados), sucesso: Boolean(dados), dados }))
                    .catch(() => sendResponse({ ok: false, sucesso: false, dados: null }));
                return true;
            }

            if (acao === 'OBTER_CSS_ANTI_AMPULHETA') {
                this.obterCssAntiAmpulhetaDoPacote(msg.arquivo, chromeApi)
                    .then((css) => sendResponse({ ok: typeof css === 'string', css: css || '' }))
                    .catch(() => sendResponse({ ok: false, css: '' }));
                return true;
            }

            if (acao === 'AUTOMATE_GARANTIR_INJECAO_ABA') {
                (async () => {
                    let tabId = Number(msg.tabId);
                    if (!tabId && chromeApi.tabs && chromeApi.tabs.query) {
                        const abas = await chromeApi.tabs.query({ active: true, currentWindow: true }).catch(() => []);
                        if (abas && abas[0] && abas[0].id) tabId = abas[0].id;
                    }
                    if (!tabId) return { ok: false, motivo: 'ABA_INDISPONIVEL' };
                    if (injecao && typeof injecao.garantirModuloAutomateNaAba === 'function') {
                        await injecao.garantirModuloAutomateNaAba(tabId, chromeApi);
                    }
                    if (msg.ativo !== undefined && chromeApi.tabs && chromeApi.tabs.sendMessage) {
                        await chromeApi.tabs.sendMessage(tabId, {
                            acao: 'atualizarEstadoModulo',
                            automatePjeAtivo: Boolean(msg.ativo),
                            restaurarBarra: msg.restaurarBarra !== false,
                            expandirBarra: Boolean(msg.expandirBarra)
                        }).catch(() => { });
                    }
                    return { ok: true, tabId };
                })().then((r) => sendResponse(r)).catch(() => sendResponse({ ok: false }));
                return true;
            }

            if (acao.startsWith('AUTOMATE_') && automate && typeof automate.tratarMensagemRuntime === 'function') {
                return automate.tratarMensagemRuntime(msg, sender, sendResponse);
            }

            if (acao === 'forcarSincronizacaoNuvem' || acao === 'AGENDAR_SYNC_NUVEM_DIFERIDO') {
                (async () => {
                    let cfgAtual = null;
                    if (config && msg.payload && typeof msg.payload === 'object' && typeof config.aplicarConfigLocalEAgendarSync === 'function') {
                        const resAplic = await config.aplicarConfigLocalEAgendarSync(msg.payload, chromeApi, depsConfig);
                        cfgAtual = (resAplic && resAplic.config) || await obterConfiguracoesGerais();
                    } else {
                        cfgAtual = await sincronizarEstado();
                    }
                    if (produtividade) {
                        if (!cfgAtual || !cfgAtual.pomodoroAtivo) {
                            await produtividade.fecharModalProdutividadeEmTodasJanelas();
                        }
                        await produtividade.sincronizarIndicadoresGlobaisPomodoro(cfgAtual, null, 'todas');
                    }
                    this.agendarSincronizacaoNuvemDebounced(5, chromeApi);
                    return { ok: true, agendado: true, atrasoMinutos: 5 };
                })().then((r) => sendResponse(r)).catch(() => sendResponse({ ok: false }));
                return true;
            }

            if (ACOES_PERFIL.has(acao)) {
                if (!config) { sendResponse({ ok: false }); return false; }
                config.gerenciarRequisicaoPerfil(msg, chromeApi, depsConfig)
                    .then((res) => sendResponse(res || { ok: false }))
                    .catch((err) => sendResponse({ ok: false, erro: err ? err.message : 'Erro no perfil.' }));
                return true;
            }

            if (acao === 'EXECUTAR_AUTO_LIMPEZA_AGORA') {
                if (!manutencao) { sendResponse({ ok: false }); return false; }
                manutencao.executarAutoLimpezaCacheECookies(true, false, obterConfiguracoesGerais)
                    .then((res) => sendResponse(res))
                    .catch(() => sendResponse({ ok: false }));
                return true;
            }

            if (acao === 'garantirInjecaoSubframes') {
                const tabId = sender && sender.tab ? sender.tab.id : null;
                if (tabId && injecao) {
                    obterConfiguracoesGerais().then((cfg) => {
                        if (cfg && cfg.modoTurbo !== 'desligado') injecao.agendarInjecaoSeguraNaAba(tabId, null, chromeApi, 'subframes');
                    }).catch(() => { });
                }
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'EXIBIR_MENSAGEM_NA_TELA') {
                (async () => {
                    try {
                        const tabId = (sender && sender.tab && typeof sender.tab.id === 'number') ? sender.tab.id : null;
                        if (tabId !== null && uiTela && typeof uiTela.exibirNaAba === 'function') {
                            const ok = await uiTela.exibirNaAba(tabId, msg.payload || msg);
                            sendResponse({ ok: Boolean(ok) });
                            return;
                        }
                    } catch (_) { }
                    sendResponse({ ok: false });
                })();
                return true;
            }

            if (acao === 'OCULTAR_MENSAGEM_NA_TELA') {
                (async () => {
                    try {
                        const tabId = (sender && sender.tab && typeof sender.tab.id === 'number') ? sender.tab.id : null;
                        if (tabId !== null && uiTela && typeof uiTela.ocultarNaAba === 'function') {
                            const ok = await uiTela.ocultarNaAba(tabId, msg.idHost || null);
                            sendResponse({ ok: Boolean(ok) });
                            return;
                        }
                    } catch (_) { }
                    sendResponse({ ok: false });
                })();
                return true;
            }

            if (acao === 'broadcastDeselecionarGeral') {
                try {
                    if (sender && sender.tab && sender.tab.id) {
                        chromeApi.tabs.sendMessage(sender.tab.id, { acao: 'executarDeselecaoGeral' }).catch(() => { });
                    }
                } catch (_) { }
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'abrirPaginaAparenciaChrome') {
                if (chromeApi.tabs && typeof chromeApi.tabs.create === 'function') {
                    chromeApi.tabs.create({ url: 'chrome://settings/appearance', active: true }).catch(() => { });
                }
                sendResponse({ ok: true });
                return true;
            }

            if (acao === 'abrirPaginaLimparDadosChrome') {
                if (chromeApi.tabs && typeof chromeApi.tabs.create === 'function') {
                    chromeApi.tabs.create({ url: 'chrome://settings/clearBrowserData', active: true }).catch(() => { });
                }
                sendResponse({ ok: true });
                return true;
            }

            if (!navegador) return false;

            if (acao === 'TROCAR_GUIA_ULTIMA_ATIVA' || (acao === 'navegarAba' && msg.modo === 'ultima_ativa')) {
                const winId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
                navegador.alternarParaUltimaAbaAtiva(winId, chromeApi).catch(() => { });
                sendResponse({ ok: true });
                return false;
            }

            const dirNav = acao === 'TROCAR_GUIA_ANTERIOR' ? 'anterior'
                : (acao === 'TROCAR_GUIA_PROXIMA' ? 'proxima'
                    : (acao === 'navegarAba' && (msg.direcao === 'anterior' || msg.direcao === 'proxima') ? msg.direcao : null));
            if (dirNav) {
                navegador.navegarAbaCircular(dirNav, sender, chromeApi).catch(() => { });
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'verificarOuAtivarAba' && msg.url) {
                obterConfiguracoesGerais()
                    .then((cfg) => navegador.verificarOuAtivarAba(msg.url, sender, cfg, chromeApi))
                    .then((res) => sendResponse(res || { reutilizada: false }))
                    .catch(() => sendResponse({ reutilizada: false }));
                return true;
            }

            if (acao === 'abrirNovaAba' && msg.url) {
                obterConfiguracoesGerais()
                    .then((cfg) => navegador.abrirNovaAba(msg.url, sender, cfg, chromeApi))
                    .catch(() => { });
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'baixarLink' && msg.url) {
                navegador.baixarLink(msg.url, sender, chromeApi).catch(() => { });
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'registrarPaginaModificada') {
                const tabId = (sender && sender.tab) ? sender.tab.id : null;
                if (tabId) navegador.marcarPaginaModificada(tabId, true, chromeApi);
                sendResponse({ ok: true });
                return false;
            }

            if (acao === 'fecharGuiasDuplicadasAgora' || acao === 'ordenarGuiasAgora' || acao === 'ordenarGuiasPorCriterio' ||
                acao === 'agruparDominioAgora' || acao === 'desagruparGuiasAgora' || acao === 'restaurarOrdemGuiasPadrao' ||
                acao === 'descartarGuiasInativasAgora') {
                (async () => {
                    try {
                        const winAlvo = await navegador.obterWindowIdAlvo(sender, chromeApi);
                        if (acao === 'fecharGuiasDuplicadasAgora') {
                            const total = await navegador.fecharGuiasDuplicadas(winAlvo, chromeApi);
                            sendResponse({ ok: true, totalFechadas: total });
                        } else if (acao === 'agruparDominioAgora') {
                            if (winAlvo) await navegador.agruparGuiasPorDominio(winAlvo, chromeApi);
                            sendResponse({ ok: true });
                        } else if (acao === 'desagruparGuiasAgora') {
                            const total = await navegador.desagruparGuias(winAlvo, chromeApi);
                            sendResponse({ ok: true, totalDesagrupadas: total });
                        } else if (acao === 'descartarGuiasInativasAgora') {
                            const total = await navegador.descartarGuiasEmSegundoPlano(winAlvo, chromeApi);
                            sendResponse({ ok: true, totalDescartadas: total });
                        } else if (acao === 'restaurarOrdemGuiasPadrao') {
                            if (winAlvo) {
                                await navegador.desagruparGuias(winAlvo, chromeApi);
                                if (navegador.ordenacao) {
                                    const mapa = (navegador.antiDuplicacao && typeof navegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                                        ? navegador.antiDuplicacao.obterMapaAbasUrls() : null;
                                    await navegador.ordenacao.executarOrdenacaoGuias(winAlvo, {
                                        criterioOrdenacaoGuias: 'ordem_criacao', sentidoOrdenacaoGuias: 'esq_dir', ordenarGuiasFixadas: false
                                    }, chromeApi, mapa);
                                }
                            }
                            sendResponse({ ok: true });
                        } else {
                            const cfg = await obterConfiguracoesGerais();
                            const cfgEfetivo = {
                                ...cfg,
                                criterioOrdenacaoGuias: msg.criterio || cfg.criterioOrdenacaoGuias || 'dominio_criacao',
                                sentidoOrdenacaoGuias: msg.sentido || cfg.sentidoOrdenacaoGuias || 'esq_dir',
                                ordenarGuiasFixadas: false
                            };
                            if (winAlvo && navegador.ordenacao) {
                                const mapa = (navegador.antiDuplicacao && typeof navegador.antiDuplicacao.obterMapaAbasUrls === 'function')
                                    ? navegador.antiDuplicacao.obterMapaAbasUrls() : null;
                                await navegador.ordenacao.executarOrdenacaoGuias(winAlvo, cfgEfetivo, chromeApi, mapa);
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
        }
    }

    Object.freeze(LibBackground.prototype);
    return Object.freeze(LibBackground);
}));
