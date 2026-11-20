/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-ipc.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Roteador IPC do Service Worker e Áudio Offscreen
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-ipc.js
 * - Classe Exportada: ProdutIpcRouter (self.JusGovProdutIpcRouter) extends BaseModulo
 * - Métodos Públicos: tratarMensagem(msg, sender, sendResponse), tocarBeepOffscreen(intensidade, padraoAlarme),
 *   montarPayloadStatusTrabalho(senderMsg, executarReconciliacao)
 * - Regras / Seções: ENG-00 (background.js limpo; lógica do Pomodoro dentro de src/mod-produt/),
 *   Seção 6.285 (Beeps PC Speaker via chrome.offscreen), Seção 6.288
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Encapsula 100% do tratamento de mensagens IPC (`chrome.runtime.onMessage`)
 *    pertencentes ao módulo de Produtividade & Pomodoro (incluindo TOCAR_BEEP_POMODORO
 *    via chrome.offscreen, snapshots, pausa/adiantamento, barra global e painel IA F1),
 *    mantendo `src/cfg/background.js` restrito à associação de eventos.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutIpcRouter = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'ProdutIpcRouter'; }
        };

    const ACOES_PRODUTIVIDADE = new Set([
        'TOCAR_BEEP_POMODORO',
        'PING_ATIVIDADE_TRABALHO',
        'OBTER_STATUS_TRABALHO',
        'RESETAR_CONTADORES_TRABALHO',
        'FECHAR_BARRA_POMODORO_GLOBAL',
        'DISPENSAR_POMODORO_DESCANSO_CICLO',
        'SALVAR_POSICAO_BARRA_POMODORO',
        'ATUALIZAR_ESTADO_BARRA_POMODORO',
        'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL',
        'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO',
        'CONFIRMAR_DESCANSO_INICIADO_POMODORO',
        'SINCRONIZAR_DESCANSO_CONCLUIDO_POMODORO',
        'SINCRONIZAR_GUIA_ATIVA_POMODORO',
        'PULAR_DESCANSO_INICIAR_FOCO_POMODORO',
        'RETOMAR_DESCANSO_PULADO_POMODORO',
        'PAUSAR_OU_ADIANTAR_POMODORO'
    ]);

    const ACOES_IA_F1 = new Set([
        'abrirGeminiLateral',
        'abrirAssistenteIaLateral',
        'ABRIR_PAINEL_F1_GEMINI'
    ]);

    class ProdutIpcRouter extends Base {
        #produt = null;
        #obterConfig = null;
        #configMgr = null;
        #navegador = null;
        #ultimoBeepOffscreenTs = 0;

        /**
         * @param {{ produtividade: Object, obterConfiguracoesGerais: Function, configMgr?: Object, navegador?: Object }} deps
         */
        constructor(deps = {}) {
            super('ProdutIpcRouter');
            this.#produt = deps.produtividade || null;
            this.#obterConfig = (typeof deps.obterConfiguracoesGerais === 'function') ? deps.obterConfiguracoesGerais : (async () => ({}));
            this.#configMgr = deps.configMgr || null;
            this.#navegador = deps.navegador || null;
        }

        /**
         * Reproduz beep estilo PC Speaker via Offscreen Document (AUDIO_PLAYBACK), imune a Autoplay.
         * @param {string} [intensidade='suave']
         * @param {string} [padraoAlarme='BEEP_CURTO']
         * @param {Object} [chromeApi]
         */
        async tocarBeepOffscreen(intensidade = 'suave', padraoAlarme = 'BEEP_CURTO', chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const agoraBeep = Date.now();
            if ((agoraBeep - this.#ultimoBeepOffscreenTs) < 400) {
                return { ok: true, deduplicado: true };
            }
            this.#ultimoBeepOffscreenTs = agoraBeep;
            if (!chromeApi || !chromeApi.offscreen || typeof chromeApi.offscreen.createDocument !== 'function') {
                return { ok: false, motivo: 'offscreen_indisponivel' };
            }
            const urlOffscreen = chromeApi.runtime.getURL('src/mod-produt/produt-audio-offscreen.html');
            let jaExiste = false;
            try {
                if (typeof chromeApi.runtime.getContexts === 'function') {
                    const ctxs = await chromeApi.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [urlOffscreen] });
                    jaExiste = Array.isArray(ctxs) && ctxs.length > 0;
                } else if (typeof chromeApi.offscreen.hasDocument === 'function') {
                    jaExiste = await chromeApi.offscreen.hasDocument();
                }
            } catch (_) { }
            if (!jaExiste) {
                try {
                    await chromeApi.offscreen.createDocument({
                        url: 'src/mod-produt/produt-audio-offscreen.html',
                        reasons: ['AUDIO_PLAYBACK'],
                        justification: 'Reproduzir beeps audíveis de conclusão do Pomodoro (estilo PC Speaker) sem bloqueio de Autoplay.'
                    });
                } catch (_) { }
            }
            try {
                const respOff = await new Promise((resolve) => {
                    chromeApi.runtime.sendMessage({
                        acao: 'OFFSCREEN_TOCAR_BEEP_POMODORO',
                        intensidade: intensidade || 'suave',
                        padraoAlarme: padraoAlarme || 'BEEP_CURTO'
                    }, (r) => {
                        if (chromeApi.runtime && chromeApi.runtime.lastError) {
                            resolve({ ok: false });
                            return;
                        }
                        resolve(r || { ok: false });
                    });
                });
                return { ok: Boolean(respOff && respOff.ok) };
            } catch (_) {
                return { ok: false };
            }
        }

        async montarPayloadStatusTrabalho(senderMsg, executarReconciliacao = true, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const prod = this.#produt;
            const [estado, cfg, metaLoc, estadoBarraGlobal] = await Promise.all([
                prod.obterOuIniciarEstadoTrabalhoHoje(),
                this.#obterConfig(),
                (chromeApi && chromeApi.storage && chromeApi.storage.local)
                    ? chromeApi.storage.local.get(['jusgovProdNuvemMeta']).catch(() => ({}))
                    : Promise.resolve({}),
                prod.obterEstadoGlobalBarraPomodoro()
            ]);
            const nuvemMeta = (metaLoc && metaLoc.jusgovProdNuvemMeta) ? metaLoc.jusgovProdNuvemMeta : null;
            const agoraSync = Date.now();
            if (executarReconciliacao) {
                const rec = prod.reconciliarEstadoPomodoroAoVivo(estado, agoraSync, cfg);
                if (rec && rec.alterouEstado) {
                    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
                        await chromeApi.storage.local.set({ jusgovTrabalhoEstado: estado }).catch(() => { });
                    }
                    if (rec.iniciouDescansoReal || rec.concluiuDescanso) {
                        await prod.fecharModalProdutividadeEmTodasJanelas();
                    }
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, estado);
                }
            }
            let permitirBeep = false;
            const senderTab = (senderMsg && senderMsg.tab) ? senderMsg.tab : null;
            if (senderTab) {
                if (chromeApi && chromeApi.windows && typeof chromeApi.windows.getLastFocused === 'function') {
                    const winFoc = await chromeApi.windows.getLastFocused().catch(() => null);
                    permitirBeep = Boolean(!winFoc || !winFoc.id || senderTab.windowId === winFoc.id);
                } else {
                    permitirBeep = true;
                }
            }
            prod.aplicarIndicadoresChromeAction(cfg, estado, nuvemMeta, agoraSync);
            const snap = prod.construirSnapshotExternoPomodoro(estado, cfg, nuvemMeta, estadoBarraGlobal, agoraSync, permitirBeep);
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
        }

        /**
         * Roteia mensagens IPC pertencentes ao módulo de Produtividade & IA F1.
         * Retorna `true` se a mensagem foi capturada (assíncrona), `false` se pertence a outro módulo.
         * @param {Object} msg
         * @param {Object} sender
         * @param {Function} sendResponse
         * @param {Object} [chromeApi]
         * @returns {boolean}
         */
        tratarMensagem(msg, sender, sendResponse, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            if (!msg || typeof msg.acao !== 'string') return false;
            const acao = msg.acao;

            if (ACOES_IA_F1.has(acao)) {
                if (this.#produt && typeof this.#produt.abrirAssistenteIaLateral === 'function') {
                    this.#produt.abrirAssistenteIaLateral(msg, chromeApi).catch(() => { });
                }
                try { sendResponse({ ok: true }); } catch (_) { }
                return true;
            }

            if (!ACOES_PRODUTIVIDADE.has(acao)) return false;

            const prod = this.#produt;
            if (!prod) {
                try { sendResponse({ ok: false }); } catch (_) { }
                return true;
            }

            let op;
            if (acao === 'TOCAR_BEEP_POMODORO') {
                op = this.tocarBeepOffscreen(msg.intensidade || 'suave', msg.padraoAlarme || 'BEEP_CURTO', chromeApi);
            } else if (acao === 'SINCRONIZAR_GUIA_ATIVA_POMODORO') {
                op = (async () => {
                    const cfg = await this.#obterConfig();
                    const senderTabId = (sender && sender.tab && typeof sender.tab.id === 'number') ? sender.tab.id : null;
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, null, senderTabId);
                    return { ok: true };
                })();
            } else if (acao === 'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL' || acao === 'CONFIRMAR_DESCANSO_INICIADO_POMODORO') {
                op = (async () => {
                    const [st, cfg] = await Promise.all([prod.obterOuIniciarEstadoTrabalhoHoje(), this.#obterConfig()]);
                    const res = prod.calcularResumoPomodoro(st, cfg, Date.now(), null);
                    const chaveFase = (msg && typeof msg.faseChave === 'string' && msg.faseChave)
                        ? msg.faseChave
                        : `${res.fase}:${res.cicloAtual}:${res.faseInicioTs}`;
                    st.pomodoroModalExibidoChave = chaveFase;
                    st.pomodoroModalDescansoChave = '';
                    st.pomodoroModalFechadoNestaPausa = true;
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    await prod.fecharModalProdutividadeEmTodasJanelas();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st);
                    return { ok: true };
                })();
            } else if (acao === 'SINCRONIZAR_DESCANSO_CONCLUIDO_POMODORO') {
                op = (async () => {
                    const [st, cfg] = await Promise.all([prod.obterOuIniciarEstadoTrabalhoHoje(), this.#obterConfig()]);
                    if (st.pomodoroFase === 'alivio' || st.pomodoroFase === 'pausa_maior') {
                        const agoraConcl = Date.now();
                        st.pomodoroDescansoMinCumprido = true;
                        st.pomodoroDescansoRealizadoNoCiclo = true;
                        st.pomodoroDescansoPendente = false;
                        st.pomodoroUltimoDescansoTipo = st.pomodoroFase;
                        const progConcl = prod.calcularProgressoDescanso(st, agoraConcl, cfg, { mutar: false });
                        const acumConclMs = Math.max(
                            Number(progConcl && progConcl.acumuladoMs || 0),
                            Number(st.pomodoroDescansoAcumuladoMs || 0),
                            Number(st.pomodoroMinutosNaFase || 0) * 60000
                        );
                        if (acumConclMs > 0) {
                            st.pomodoroDescansoAcumuladoMs = acumConclMs;
                            st.pomodoroDescansoSyncTs = agoraConcl;
                        }
                        st.pomodoroUltimoDescansoFimTs = Number(st.pomodoroUltimoDescansoFimTs || agoraConcl);
                        st.pomodoroUltimoDescansoDuracaoMin = prod.arredondarMinutosDescansoExato(
                            acumConclMs || ((st.pomodoroFase === 'pausa_maior' ? 40 : 10) * 60000)
                        );
                        st.pomodoroModalExibidoChave = String((msg && msg.faseChave) || st.pomodoroModalExibidoChave || '');
                        st.pomodoroModalDescansoChave = '';
                        st.pomodoroModalFechadoNestaPausa = true;
                        await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    }
                    await prod.fecharModalProdutividadeEmTodasJanelas();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st);
                    return { ok: true };
                })();
            } else if (acao === 'PING_ATIVIDADE_TRABALHO') {
                op = prod.registrarAtividadeTrabalho(Date.now(), msg.tipoInteracao || 'click_ou_tecla').then(async (r) => {
                    const cfg = await this.#obterConfig();
                    if (r && (r.resetouDescanso || r.iniciouFocoPosDescanso || r.iniciouBadgeVerde || r.ocultouBadgeVerde || r.alterouDescanso)) {
                        await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, null, null);
                    } else {
                        const [estado, metaLoc] = await Promise.all([
                            prod.obterOuIniciarEstadoTrabalhoHoje(),
                            (chromeApi && chromeApi.storage && chromeApi.storage.local)
                                ? chromeApi.storage.local.get(['jusgovProdNuvemMeta']).catch(() => ({}))
                                : Promise.resolve({})
                        ]);
                        prod.aplicarIndicadoresChromeAction(cfg, estado, (metaLoc && metaLoc.jusgovProdNuvemMeta) || null, Date.now());
                    }
                    if (msg && msg.retornarSnapshot) {
                        return await this.montarPayloadStatusTrabalho(sender, false, chromeApi);
                    }
                    return { ok: true };
                });
            } else if (acao === 'OBTER_STATUS_TRABALHO') {
                op = this.montarPayloadStatusTrabalho(sender, true, chromeApi);
            } else if (acao === 'RESETAR_CONTADORES_TRABALHO') {
                op = Promise.all([prod.resetarEstadoTrabalhoHoje(), this.#obterConfig()]).then(async ([estado, cfg]) => {
                    const agoraReset = Date.now();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, estado, null);
                    return {
                        ok: true,
                        agoraServidor: agoraReset,
                        estado,
                        nuvemMeta: null,
                        resumoPomodoro: prod.calcularResumoPomodoro(estado, cfg, agoraReset, null)
                    };
                });
            } else if (acao === 'FECHAR_BARRA_POMODORO_GLOBAL') {
                op = (async () => {
                    const st = await prod.obterOuIniciarEstadoTrabalhoHoje();
                    st.pomodoroBarraOcultadaChave = '';
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    await prod.atualizarEstadoGlobalBarraPomodoro({ minimizadoMicro: true });
                    const cfg = await this.#obterConfig();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st, 'todas');
                    return { ok: true, minimizadoMicro: true };
                })();
            } else if (acao === 'DISPENSAR_POMODORO_DESCANSO_CICLO') {
                op = (async () => {
                    const st = await prod.obterOuIniciarEstadoTrabalhoHoje();
                    st.pomodoroPularProximoPopupFoco = true;
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    return { ok: true };
                })();
            } else if (acao === 'PULAR_DESCANSO_INICIAR_FOCO_POMODORO') {
                op = (async () => {
                    const [st, cfg] = await Promise.all([prod.obterOuIniciarEstadoTrabalhoHoje(), this.#obterConfig()]);
                    const agoraPular = Date.now();
                    prod.pularDescansoEIniciarFoco(st, agoraPular, cfg);
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    if (msg && msg.minimizarMicro) {
                        await prod.atualizarEstadoGlobalBarraPomodoro({
                            minimizadoMicro: true,
                            minimizadoDescansoAdiadoTs: Number(msg.minimizadoDescansoAdiadoTs || agoraPular)
                        });
                    }
                    await prod.fecharModalProdutividadeEmTodasJanelas();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st, 'todas');
                    return await this.montarPayloadStatusTrabalho(sender, false, chromeApi);
                })();
            } else if (acao === 'RETOMAR_DESCANSO_PULADO_POMODORO') {
                op = (async () => {
                    const [st, cfg] = await Promise.all([prod.obterOuIniciarEstadoTrabalhoHoje(), this.#obterConfig()]);
                    const resFlex = prod.retomarDescansoFlexivel(st, Date.now(), cfg);
                    if (!resFlex || !resFlex.ok) {
                        return { ok: false, motivo: (resFlex && resFlex.motivo) || 'Não foi possível retomar o descanso agora.', governanca: resFlex && resFlex.governanca };
                    }
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    await prod.atualizarEstadoGlobalBarraPomodoro({ minimizadoMicro: false, minimizadoDescansoAdiadoTs: 0 });
                    await prod.fecharModalProdutividadeEmTodasJanelas();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st, 'todas');
                    return await this.montarPayloadStatusTrabalho(sender, false, chromeApi);
                })();
            } else if (acao === 'PAUSAR_OU_ADIANTAR_POMODORO') {
                op = (async () => {
                    const [st, cfg] = await Promise.all([prod.obterOuIniciarEstadoTrabalhoHoje(), this.#obterConfig()]);
                    const resFlex = prod.alternarPausaOuAdiantarDescanso(st, Date.now(), cfg, { manual: true });
                    if (!resFlex || !resFlex.ok) {
                        return { ok: false, motivo: (resFlex && resFlex.motivo) || 'Limite diário de pausas atingido.', governanca: resFlex && resFlex.governanca };
                    }
                    await chromeApi.storage.local.set({ jusgovTrabalhoEstado: st });
                    await prod.fecharModalProdutividadeEmTodasJanelas();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, st, 'todas');
                    return await this.montarPayloadStatusTrabalho(sender, false, chromeApi);
                })();
            } else if (acao === 'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO') {
                op = (async () => {
                    const cfgAtual = await this.#obterConfig();
                    const modoAtual = (cfgAtual && typeof cfgAtual.pomodoroModoAviso === 'string') ? cfgAtual.pomodoroModoAviso : 'completo';
                    const exibirNoAtivo = Boolean(msg.exibirNoAtivo);
                    let novoModo = modoAtual;
                    if (!exibirNoAtivo) {
                        if (modoAtual === 'completo') novoModo = 'badge_e_barra_descanso';
                        else if (modoAtual === 'barra_sempre') novoModo = 'barra_descanso';
                    } else {
                        if (modoAtual === 'badge_e_barra_descanso' || modoAtual === 'badge' || modoAtual === 'modal') novoModo = 'completo';
                        else if (modoAtual === 'barra_descanso') novoModo = 'barra_sempre';
                        await prod.atualizarEstadoGlobalBarraPomodoro({ modoFixacao: 1, ancorar: true });
                    }
                    if (this.#configMgr && typeof this.#configMgr.aplicarConfigLocalEAgendarSync === 'function') {
                        await this.#configMgr.aplicarConfigLocalEAgendarSync({ pomodoroModoAviso: novoModo }, chromeApi, {
                            moduloNavegador: this.#navegador
                        });
                    }
                    const cfgNova = await this.#obterConfig();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfgNova, null, 'todas');
                    return { ok: true, pomodoroModoAviso: novoModo };
                })();
            } else {
                op = (async () => {
                    const novoEstado = await prod.atualizarEstadoGlobalBarraPomodoro(msg);
                    if (msg && (msg.minimizadoMicro !== undefined || msg.nivelDetalhe === 0 || msg.nivelDetalhe === 1 || msg.nivelDetalhe === 2) && this.#configMgr && typeof this.#configMgr.aplicarConfigLocalEAgendarSync === 'function') {
                        const estiloNovo = novoEstado.minimizadoMicro
                            ? 'micro'
                            : ((novoEstado.nivelDetalhe === 1) ? 'normal' : ((novoEstado.nivelDetalhe === 2) ? 'expandido' : 'compacto'));
                        const cfgAtualEst = await this.#obterConfig();
                        if (cfgAtualEst && cfgAtualEst.pomodoroEstiloMinipopup !== estiloNovo) {
                            await this.#configMgr.aplicarConfigLocalEAgendarSync({ pomodoroEstiloMinipopup: estiloNovo }, chromeApi, {
                                moduloNavegador: this.#navegador
                            });
                        }
                    }
                    const cfg = await this.#obterConfig();
                    await prod.sincronizarIndicadoresGlobaisPomodoro(cfg, null, 'todas');
                    return { ok: true, estadoBarra: novoEstado };
                })();
            }

            op.then((r) => sendResponse(r)).catch(() => sendResponse({ ok: false }));
            return true;
        }
    }

    Object.freeze(ProdutIpcRouter.prototype);
    return Object.freeze(ProdutIpcRouter);
}));
