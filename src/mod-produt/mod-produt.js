/* ==========================================================================
 * ARQUIVO: src/mod-produt/mod-produt.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade: Tempo de Trabalho & Pomodoro
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/mod-produt.js
 * - Classe Exportada: ModuloProdutividade (self.JusGovModuloProdutividade)
 * - Métodos Públicos: definirProvedorConfig(fn), obterDataLocalChaveHoje(),
 *   obterOuIniciarEstadoTrabalhoHoje(), resetarEstadoTrabalhoHoje(),
 *   registrarAtividadeTrabalho(), projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo),
 *   processarTickTrabalho(obterConfigFn), abrirAssistenteIaLateral(msg, chromeApi)
 * - Regras / Seções: Diretriz 14, Diretriz 16, Seção 6.142 (Tempo de Trabalho e Pomodoro)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Gerencia os contadores diários de tempo de trabalho corrido e tempo de
 *    trabalho ativo (estilo Workrave), além da máquina de estados do Pomodoro
 *    (foco, alívio e pausa maior), projetando modais em todas as janelas ativas.
 * 2) ISOLAMENTO:
 *    Executa no Service Worker (Manifest V3) via importScripts e persiste o
 *    estado diário na chave 'jusgovTrabalhoEstado' do chrome.storage.local.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md
 * - docs/02_ARQUITETURA_E_AS_BUILT.md
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloProdutividade = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const BemEstarCls = (typeof self !== 'undefined' && self.JusGovBemEstarPomodoro)
        ? self.JusGovBemEstarPomodoro
        : ((typeof require === 'function')
            ? (() => { try { return require('./lib-produt-bem-estar.js'); } catch (_) { return null; } })()
            : null);

    const ResumoUiCls = (typeof self !== 'undefined' && typeof self.JusGovProdutResumoUi === 'function')
        ? self.JusGovProdutResumoUi
        : (typeof require === 'function'
            ? (() => { try { return require('./produt-resumo-ui.js'); } catch (_) { return null; } })()
            : null);

    const SyncNuvemCls = (typeof self !== 'undefined' && typeof self.JusGovProdutSyncNuvem === 'function')
        ? self.JusGovProdutSyncNuvem
        : (typeof require === 'function'
            ? (() => { try { return require('./produt-sync-nuvem.js'); } catch (_) { return null; } })()
            : null);

    const BarraInjecaoCls = (typeof self !== 'undefined' && typeof self.JusGovProdutBarraInjecao === 'function')
        ? self.JusGovProdutBarraInjecao
        : (typeof require === 'function'
            ? (() => { try { return require('./produt-barra-injecao.js'); } catch (_) { return null; } })()
            : null);

    class ModuloProdutividade {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
            this._bemEstar = (opcoes && opcoes.bemEstar)
                ? opcoes.bemEstar
                : (BemEstarCls ? new BemEstarCls() : null);
            this._resumoUi = (opcoes && opcoes.resumoUi)
                ? opcoes.resumoUi
                : (ResumoUiCls ? new ResumoUiCls() : null);
            this._syncNuvem = (opcoes && opcoes.syncNuvem)
                ? opcoes.syncNuvem
                : (SyncNuvemCls ? new SyncNuvemCls() : null);
            this._barraInjecao = (opcoes && opcoes.barraInjecao)
                ? opcoes.barraInjecao
                : (BarraInjecaoCls ? new BarraInjecaoCls() : null);
        }

        obterResumoUi() {
            if (!this._resumoUi) {
                const Cls = (typeof self !== 'undefined' && typeof self.JusGovProdutResumoUi === 'function')
                    ? self.JusGovProdutResumoUi
                    : ResumoUiCls;
                if (Cls) this._resumoUi = new Cls();
            }
            return this._resumoUi || (ResumoUiCls && ResumoUiCls.NULL_OBJECT) || null;
        }

        obterSyncNuvem() {
            if (!this._syncNuvem) {
                const Cls = (typeof self !== 'undefined' && typeof self.JusGovProdutSyncNuvem === 'function')
                    ? self.JusGovProdutSyncNuvem
                    : SyncNuvemCls;
                if (Cls) this._syncNuvem = new Cls();
            }
            return this._syncNuvem || (SyncNuvemCls && SyncNuvemCls.NULL_OBJECT) || null;
        }

        obterBarraInjecao() {
            if (!this._barraInjecao) {
                const Cls = (typeof self !== 'undefined' && typeof self.JusGovProdutBarraInjecao === 'function')
                    ? self.JusGovProdutBarraInjecao
                    : BarraInjecaoCls;
                if (Cls) this._barraInjecao = new Cls();
            }
            return this._barraInjecao || (BarraInjecaoCls && BarraInjecaoCls.NULL_OBJECT) || null;
        }

        obterGerenciadorBemEstar() {
            return this._bemEstar;
        }

        /**
         * Define dinamicamente a função assíncrona responsável por ler as configurações atuais.
         * @param {Function} fn
         */
        definirProvedorConfig(fn) {
            if (typeof fn === 'function') {
                this._obterConfig = fn;
            }
        }

        /**
         * Gera ou recupera o identificador único local do dispositivo/navegador (não sincronizado).
         * @param {Object|null} [chromeApi]
         * @returns {Promise<string>}
         */
        async obterOuGerarDispositivoId(chromeApi = null) {
            return this.obterSyncNuvem().obterOuGerarDispositivoId(chromeApi);
        }

        detectarUsoSimultaneoDispositivos(dispositivos = {}, meuId = '', agora = Date.now(), meuEntradaTs = 0) {
            return this.obterSyncNuvem().detectarUsoSimultaneoDispositivos(dispositivos, meuId, agora, meuEntradaTs);
        }

        agregarDispositivosProdutividade(snapshot, meuId = '', estadoLocal = null, agora = Date.now(), meuEntradaTs = 0) {
            return this.obterSyncNuvem().agregarDispositivosProdutividade(this, snapshot, meuId, estadoLocal, agora, meuEntradaTs);
        }

        montarSnapshotProdutividadeNuvem(estado, locais = {}, agora = Date.now(), dispositivoId = 'pc_local', snapshotAnterior = null, entradaTs = 0, opcoes = {}) {
            return this.obterSyncNuvem().montarSnapshotProdutividadeNuvem(estado, locais, agora, dispositivoId, snapshotAnterior, entradaTs, opcoes);
        }

        mesclarEstadoProdutividadeNuvem(localEstado, nuvemSnapshot, agora = Date.now(), meuDispositivoId = '', meuEntradaTs = 0) {
            return this.obterSyncNuvem().mesclarEstadoProdutividadeNuvem(this, localEstado, nuvemSnapshot, agora, meuDispositivoId, meuEntradaTs);
        }

        async sincronizarStatsMultiDispositivo(chromeApi = null, opcoes = {}) {
            return this.obterSyncNuvem().sincronizarStatsMultiDispositivo(this, chromeApi, opcoes);
        }

        async salvarResumoProdutividadeNuvemAoSair(chromeApi = null, opcoes = { encerradoLimpo: true }) {
            return this.obterSyncNuvem().salvarResumoProdutividadeNuvemAoSair(this, chromeApi, opcoes);
        }

        async sincronizarEstatisticasPeriodicoNuvem(chromeApi = null) {
            return this.obterSyncNuvem().sincronizarEstatisticasPeriodicoNuvem(this, chromeApi);
        }

        async recuperarResumoProdutividadeNuvemAoAbrir(chromeApi = null) {
            return this.obterSyncNuvem().recuperarResumoProdutividadeNuvemAoAbrir(this, chromeApi);
        }

        /**
         * Processa o tick de 1 minuto para tempo corrido, tempo ativo e ciclo Pomodoro.
         * @param {Function} [obterConfigFn]
         * @returns {Promise<void>}
         */
        async processarTickTrabalho(obterConfigFn) {
            try {
                const provedor = typeof obterConfigFn === 'function'
                    ? obterConfigFn
                    : (this._obterConfig || (typeof obterConfiguracoesGerais === 'function' ? obterConfiguracoesGerais : null));
                const config = provedor ? await provedor() : {};

                const pomodoroAtivo = Boolean(config.pomodoroAtivo);

                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                const agora = Date.now();

                /* Paridade fora de foco: se o navegador NÃO estiver em foco (minimizado/outro app),
                 * não renova ultimaAtividadeTs (trata exatamente como mouse parado -> pausa/alívio/ocioso).
                 * Apenas se uma janela do Chrome ESTIVER em foco e houver atividade em páginas internas
                 * sem content script, renova atividade durante Foco preservando pomodoroFocoPausadoMs. */
                try {
                    if (typeof chrome !== 'undefined' && chrome.windows && typeof chrome.windows.getLastFocused === 'function'
                        && chrome.idle && typeof chrome.idle.queryState === 'function'
                        && estado.pomodoroFase === 'foco') {
                        const winFocada = await chrome.windows.getLastFocused().catch(() => null);
                        if (winFocada && winFocada.focused) {
                            const estadoIdle60 = await new Promise((resolve) => {
                                try { chrome.idle.queryState(60, (st) => resolve(st || '')); } catch (_) { resolve(''); }
                            });
                            if (estadoIdle60 === 'active') {
                                if (estado.emPausa && Number(estado.pomodoroPausaInicioTs || 0) > 0) {
                                    estado.pomodoroFocoPausadoMs = Number(estado.pomodoroFocoPausadoMs || 0) + Math.max(0, agora - Number(estado.pomodoroPausaInicioTs));
                                    estado.pomodoroPausaInicioTs = 0;
                                }
                                estado.ultimaAtividadeTs = agora;
                                estado.emPausa = false;
                                estado.minutosInativosPendentes = 0;
                            }
                        }
                    }
                } catch (_) { }

                /* Compensação exata de atraso do alarme MV3 (garante Corrido = Ativo + Pausas sem perder minutos) */
                const prevTickTs = Number(estado.ultimoTickTrabalhoTs || 0);
                let passosTick = 1;
                if (prevTickTs > 0 && agora > prevTickTs) {
                    const deltaMin = Math.floor((agora - prevTickTs) / 60000);
                    if (deltaMin >= 2 && deltaMin <= 180) {
                        passosTick = deltaMin;
                    }
                }
                let res = { estado, disparoCorrido: false, disparoAtivo: false };
                for (let k = 1; k <= passosTick; k++) {
                    const tsPasso = (passosTick > 1 && prevTickTs > 0) ? Math.min(agora, prevTickTs + k * 60000) : agora;
                    const rPasso = this.avancarMinutoEstadoTrabalho(estado, tsPasso, config);
                    if (rPasso.disparoCorrido) res.disparoCorrido = true;
                    if (rPasso.disparoAtivo) res.disparoAtivo = true;
                }
                estado.ultimoTickTrabalhoTs = agora;

                const prefsAviso = this.resolverPreferenciasAvisoPomodoro(config);

                if (res.disparoCorrido) {
                    await this.projetarModalProdutividadeEmTodasJanelas(
                        'Tempo de Uso Corrido Atingido',
                        `Você completou ${config.tempoTrabalhoCorridoHoras || 7}h de uso corrido hoje.`,
                        `Tempo corrido: ${estado.corridoMinutos} min | Tempo ativo: ${estado.ativoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                if (res.disparoAtivo) {
                    await this.projetarModalProdutividadeEmTodasJanelas(
                        'Tempo de Atividade Atingido',
                        `Você completou ${config.tempoTrabalhoAtivoHoras || 6}h de atividade efetiva hoje (estilo Workrave).`,
                        `Tempo ativo: ${estado.ativoMinutos} min | Tempo corrido: ${estado.corridoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                /* Sempre avança contadores internos de foco/pausa/último descanso mesmo com alertas Pomodoro desativados */
                const evPom = this.avancarMinutoPomodoro(estado, agora, config);
                const resumoTick = this.calcularResumoPomodoro(estado, config, agora, null);
                const chaveFaseTick = `${resumoTick.fase}:${resumoTick.cicloAtual}:${resumoTick.faseInicioTs}`;
                /* Modal gigante central removido: o minipopup não-bloqueante conduz todo o ciclo de descanso sem travar a tela */
                if (resumoTick.emDescanso && !resumoTick.aguardandoOciosidade && estado.pomodoroModalDescansoChave) {
                    estado.pomodoroModalExibidoChave = chaveFaseTick;
                    estado.pomodoroModalDescansoChave = '';
                    estado.pomodoroModalFechadoNestaPausa = true;
                    await this.fecharModalProdutividadeEmTodasJanelas();
                }

                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
                await this.sincronizarIndicadoresGlobaisPomodoro(config, estado);
            } catch (_) { }
        }

        /**
         * Resolve cor de fundo/texto do badge do ícone da extensão no Pomodoro.
         * Nos últimos 60s (<= 1 min) antes do descanso em Foco, muda de verde para amarelo.
         * @param {Object} [resumo]
         * @returns {{ cor: string, corTexto: string, preDescansoAmarelo: boolean }}
         */
        resolverEstiloBadgePomodoro(resumo = {}) {
            const r = (resumo && typeof resumo === 'object') ? resumo : {};
            if (r.emDescanso && r.descansoMinCumprido) {
                return { cor: '#16a34a', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            if (r.descansoPendente && (r.aguardandoOciosidade || !r.emDescanso || r.descansoEmAviso)) {
                return { cor: '#dc2626', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            if (r.emDescanso) {
                return { cor: '#0284c7', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            const segRest = Number(r.segundosRestantes || 0);
            const minRest = Number(r.minutosRestantes ?? 999);
            const emUltimoMinuto = (!r.emPausa) && (minRest <= 1 || (segRest > 0 && segRest <= 60));
            if (emUltimoMinuto) {
                return { cor: '#eab308', corTexto: '#111827', preDescansoAmarelo: true };
            }
            return { cor: '#0d9488', corTexto: '#ffffff', preDescansoAmarelo: false };
        }

        /**
         * Indica se o cronômetro do minipopup deve piscar em amarelo (últimos 30s antes do descanso).
         * @param {number} segRestantesFoco
         * @param {boolean} [emDescanso=false]
         * @param {boolean} [descansoPendente=false]
         * @param {boolean} [emPausa=false]
         * @returns {boolean}
         */
        isCronometroFocoEmAlertaPreDescanso(segRestantesFoco, emDescanso = false, descansoPendente = false, emPausa = false) {
            const seg = Number(segRestantesFoco || 0);
            return Boolean(!emDescanso && !descansoPendente && !emPausa && seg > 0 && seg <= 30);
        }

        /**
         * Atualiza imediatamente badge e tooltip do ícone da extensão com os mesmos dados canônicos de Popup/Opções/Minipopup.
         */
        aplicarIndicadoresChromeAction(cfg = {}, estado = {}, nuvemMeta = null, agoraSync = Date.now()) {
            const resumo = this.calcularResumoPomodoro(estado, cfg, agoraSync, nuvemMeta);
            const infoTooltip = this.formatarResumoProdutividadeTexto(estado, cfg, agoraSync, nuvemMeta);
            const prefs = this.resolverPreferenciasAvisoPomodoro(cfg);
            const formatarTempoBadge = (totalMin) => {
                const m = Math.max(0, Math.floor(Number(totalMin) || 0));
                if (m >= 100) {
                    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
                }
                if (m >= 10) {
                    return `${m}`;
                }
                return `${m}m`;
            };
            let txtBadge = '';
            if (resumo.ativo && prefs.usarBadge) {
                if (resumo.emDescanso) {
                    /* No ícone em Alívio/Descanso, INCREMENTA mostrando quanto tempo passou (HH:MM se >= 1h) */
                    const minDecorridosDesc = resumo.aguardandoOciosidade
                        ? 0
                        : Math.floor(Math.max(0, Number(resumo.segundosDecorridos || 0)) / 60);
                    txtBadge = formatarTempoBadge(minDecorridosDesc);
                } else {
                    /* No ícone em Foco/Ativo, DECREMENTA (apenas horas se houver e minutos) */
                    txtBadge = `${resumo.descansoPendente ? '!' : ''}${formatarTempoBadge(Math.max(0, Number(resumo.minutosRestantes || 0)))}`;
                }
            }
            const badgeEst = this.resolverEstiloBadgePomodoro(resumo);
            const assinatura = `${txtBadge}|${badgeEst.cor}|${badgeEst.corTexto}|${infoTooltip.tooltipTitle}|${(cfg && cfg.modoTurbo) || ''}`;

            if (typeof chrome !== 'undefined' && chrome.action && this._ultimaAssinaturaAction !== assinatura) {
                this._ultimaAssinaturaAction = assinatura;
                const badgeObj = txtBadge ? { texto: txtBadge, cor: badgeEst.cor, corTexto: badgeEst.corTexto } : null;
                if (typeof self !== 'undefined') {
                    self.__JUSGOV_ULTIMO_BADGE_POMODORO__ = badgeObj;
                }
                const cfgInst = (typeof self !== 'undefined' && self.JusGovInstanciaConfig) ? self.JusGovInstanciaConfig : null;
                let desenhouNoIcone = false;
                if (cfgInst && typeof cfgInst.desenharIconeVetorialFallback === 'function') {
                    const modoAtual = (cfg && cfg.modoTurbo) || (typeof self !== 'undefined' && self.__JUSGOV_MODO_TURBO_ATUAL__) || 'global';
                    const compAtual = (cfg && cfg.comportamentoCliqueIcone) || (typeof self !== 'undefined' && self.__JUSGOV_COMPORTAMENTO_ICONE_ATUAL__) || 'popup';
                    desenhouNoIcone = Boolean(cfgInst.desenharIconeVetorialFallback(modoAtual, compAtual, chrome, badgeObj));
                }
                if (chrome.action.setBadgeText) {
                    if (desenhouNoIcone) {
                        chrome.action.setBadgeText({ text: '' }).catch(() => { });
                    } else {
                        chrome.action.setBadgeText({ text: txtBadge }).catch(() => { });
                        if (txtBadge && chrome.action.setBadgeBackgroundColor) {
                            chrome.action.setBadgeBackgroundColor({ color: badgeEst.cor }).catch(() => { });
                        }
                        if (txtBadge && chrome.action.setBadgeTextColor) {
                            chrome.action.setBadgeTextColor({ color: badgeEst.corTexto }).catch(() => { });
                        }
                    }
                }
                if (chrome.action.setTitle) {
                    chrome.action.setTitle({
                        title: infoTooltip.tooltipTitle || 'JusGovBR — Seleção/Cópia Inteligente'
                    }).catch(() => { });
                }
            }
            return { resumo, infoTooltip, prefs };
        }

        /**
         * Retorna a funcao autocontida serializavel para `chrome.scripting.executeScript` do minipopup Pomodoro (BUG-78).
         * @returns {Function}
         */
        obterFuncaoInjecaoBarraPomodoro() {
            const inj = this.obterBarraInjecao();
            return (inj && typeof inj.obterFuncaoInjecaoBarraPomodoro === 'function')
                ? inj.obterFuncaoInjecaoBarraPomodoro()
                : (() => {});
        }

        /**
         * Atualiza o badge/tooltip do ícone no Chrome e projeta/remove a faixa flutuante global nas abas ativas de cada janela.
         * @param {Object} [config]
         * @param {Object} [estadoParam]
         * @param {number|string|null} [tabIdEspecifica] número de tabId específica ou null para guias ativas das janelas abertas
         */
        async sincronizarIndicadoresGlobaisPomodoro(config = null, estadoParam = null, tabIdEspecifica = null) {
            try {
                if (typeof chrome === 'undefined') return;
                const cfg = config || (this._obterConfig ? await this._obterConfig() : {});
                const estado = estadoParam || await this.obterOuIniciarEstadoTrabalhoHoje();
                let nuvemMeta = null;
                try {
                    if (chrome.storage && chrome.storage.local) {
                        const metaRes = await chrome.storage.local.get(['jusgovProdNuvemMeta']);
                        if (metaRes && metaRes.jusgovProdNuvemMeta) nuvemMeta = metaRes.jusgovProdNuvemMeta;
                    }
                } catch (_) { }
                const agoraSync = Date.now();
                const rec = this.reconciliarEstadoPomodoroAoVivo(estado, agoraSync, cfg);
                if (rec && rec.alterouEstado && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.set({ jusgovTrabalhoEstado: estado }).catch(() => { });
                }
                this.aplicarIndicadoresChromeAction(cfg, estado, nuvemMeta, agoraSync);

                if (!chrome.tabs || !chrome.scripting) return;
                const estadoBarraGlobal = await this.obterEstadoGlobalBarraPomodoro();
                const snapBase = this.construirSnapshotExternoPomodoro(estado, cfg, nuvemMeta, estadoBarraGlobal, agoraSync, false);

                let abas = [];
                if (typeof tabIdEspecifica === 'number' && tabIdEspecifica > 0) {
                    const abaUnica = await chrome.tabs.get(tabIdEspecifica).catch(() => null);
                    if (abaUnica) abas = [abaUnica];
                } else if (tabIdEspecifica === 'todas') {
                    abas = await chrome.tabs.query({}).catch(() => []);
                } else {
                    abas = await chrome.tabs.query({ active: true }).catch(() => []);
                }

                let focusedWinId = null;
                if (chrome.windows && typeof chrome.windows.getLastFocused === 'function') {
                    const winFoc = await chrome.windows.getLastFocused().catch(() => null);
                    if (winFoc && winFoc.id) focusedWinId = winFoc.id;
                }

                const fnInjecao = this.obterFuncaoInjecaoBarraPomodoro();
                for (let aIdx = 0; aIdx < abas.length; aIdx++) {
                    const aba = abas[aIdx];
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    const permitirBeep = Boolean(snapBase.paramsBeep.ativo && aba.active !== false && (focusedWinId ? aba.windowId === focusedWinId : aIdx === 0));
                    const cfgAba = Object.assign({}, snapBase.cfgExib, { permitirBeep });

                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: fnInjecao,
                        args: [cfgAba, snapBase.resumoPomodoro, snapBase.estadoBarra]
                    }).catch(() => { });
                }
            } catch (_) { }
        }

        /**
         * Localiza uma guia ativa do Google Gemini (ou cria nova aba) e injeta o prompt F1 com seguranca.
         * @param {Object} msg
         * @param {Object} [chromeApi]
         */
        async abrirAssistenteIaLateral(msg = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.tabs) return false;

            const preencherPromptGemini = (textoPrompt) => {
                const tentarPreenchimento = (tentativa) => {
                    const editavel = document.querySelector('rich-textarea p, rich-textarea div[contenteditable="true"], div.ql-editor, textarea, rich-textarea div[role="textbox"]');
                    if (editavel) {
                        editavel.focus();
                        let inseriu = false;
                        try { inseriu = document.execCommand('insertText', false, textoPrompt); } catch (_) { }
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

            try {
                const abasGemini = await apiChrome.tabs.query({ url: '*://gemini.google.com/*' });
                let abaAlvoId = null;
                let abaAlvoWindowId = null;
                let ehNovaAba = false;

                if (abasGemini && abasGemini.length > 0 && abasGemini[0].id) {
                    const abaAlvo = abasGemini[0];
                    abaAlvoId = abaAlvo.id;
                    abaAlvoWindowId = abaAlvo.windowId;
                    await apiChrome.tabs.update(abaAlvoId, { active: true });
                    if (abaAlvoWindowId && apiChrome.windows) {
                        await apiChrome.windows.update(abaAlvoWindowId, { focused: true });
                    }
                } else {
                    const novaAba = await apiChrome.tabs.create({ url: 'https://gemini.google.com/app', active: true });
                    abaAlvoId = novaAba.id;
                    ehNovaAba = true;
                }

                let promptTxt = (typeof msg.prompt === 'string' && msg.prompt.trim().length > 0) ? msg.prompt : '';
                if (!promptTxt && (msg.acao === 'ABRIR_PAINEL_F1_GEMINI' || msg.texto !== undefined)) {
                    const config = this._obterConfig ? await this._obterConfig() : {};
                    const padraoCfg = (typeof self !== 'undefined' && self.JusGovCfgDefaults && typeof self.JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO === 'string')
                        ? self.JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO
                        : "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";
                    const template = (config && typeof config.promptF1Gemini === 'string' && config.promptF1Gemini.trim().length > 0)
                        ? config.promptF1Gemini
                        : padraoCfg;
                    const limpo = String(msg.texto || '').trim();
                    if (template.includes('{{TEXTO}}')) {
                        promptTxt = template.replace(/\{\{TEXTO\}\}/g, limpo);
                    } else if (template.includes('{SELECAO}')) {
                        promptTxt = template.replace(/\{SELECAO\}/g, limpo);
                    } else {
                        promptTxt = (template + ' ' + limpo).trim();
                    }
                }

                if (abaAlvoId && promptTxt.trim().length > 0 && apiChrome.scripting) {
                    if (ehNovaAba) {
                        const listener = (tabId, mudanca) => {
                            if (tabId === abaAlvoId && mudanca.status === 'complete') {
                                apiChrome.tabs.onUpdated.removeListener(listener);
                                setTimeout(async () => {
                                    try {
                                        await apiChrome.scripting.executeScript({
                                            target: { tabId: abaAlvoId },
                                            func: preencherPromptGemini,
                                            args: [promptTxt]
                                        });
                                    } catch (_) { }
                                }, 500);
                            }
                        };
                        apiChrome.tabs.onUpdated.addListener(listener);
                        setTimeout(() => {
                            try { apiChrome.tabs.onUpdated.removeListener(listener); } catch (_) { }
                        }, 20000);
                    } else {
                        try {
                            await apiChrome.scripting.executeScript({
                                target: { tabId: abaAlvoId },
                                func: preencherPromptGemini,
                                args: [promptTxt]
                            });
                        } catch (_) { }
                    }
                }
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    
        const _modulosProdut = [
        { g: 'JusGovProdutEstadoTrabalho', p: './produt-estado-trabalho.js' },
        { g: 'JusGovProdutMotorDescanso', p: './produt-motor-descanso.js' },
        { g: 'JusGovProdutMotorFlexivel', p: './produt-motor-flexivel.js' },
        { g: 'JusGovProdutMotorCiclos', p: './produt-motor-ciclos.js' },
        { g: 'JusGovProdutBarraGeometria', p: './produt-barra-geometria.js' }
    ];
    for (let i = 0; i < _modulosProdut.length; i++) {
        const item = _modulosProdut[i];
        const Cls = (typeof self !== 'undefined' && typeof self[item.g] === 'function')
            ? self[item.g]
            : ((typeof require === 'function') ? (() => { try { return require(item.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(ModuloProdutividade.prototype);
        }
    }

    Object.freeze(ModuloProdutividade.prototype);
    Object.freeze(ModuloProdutividade);

    return ModuloProdutividade;
}));
