/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-barra-injecao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Função Injetável Autocontida do Minipopup Pomodoro
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-barra-injecao.js
 * - Classe Exportada: ProdutBarraInjecao (self.JusGovProdutBarraInjecao) extends BaseModulo
 * - Métodos Públicos: obterFuncaoInjecaoBarraPomodoro(), static get NULL_OBJECT
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP, Null Object), ARQ-10 (Seção 6.259), FEAT-106 (Seção 6.287)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutBarraInjecao = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    const NULL_PRODUT_BARRA_INJECAO = Object.freeze({
        obterFuncaoInjecaoBarraPomodoro: () => () => {},
        inicializar: () => false,
        destruir: () => false
    });

    class ProdutBarraInjecao extends Base {
        static get NULL_OBJECT() {
            return NULL_PRODUT_BARRA_INJECAO;
        }

        constructor() {
            super('ProdutBarraInjecao');
        }
        obterFuncaoInjecaoBarraPomodoro() {
            return (cfgExib, dadosResumo, estadoBarra) => {
                            const idHost = 'jusgov-pomodoro-barra-global';
                            const idBackdrop = 'jusgov-pomodoro-backdrop-global';
                            const idBackdropStyle = 'jusgov-pomodoro-backdrop-style';
                            const idModal = 'jusgov-modal-produtividade-trabalho';

                            const removerBackdropBlur = () => {
                                const bd = document.getElementById(idBackdrop);
                                if (bd) bd.remove();
                                const stBd = document.getElementById(idBackdropStyle);
                                if (stBd) stBd.remove();
                            };
                            const garantirBackdropStyle = () => {
                                if (document.getElementById(idBackdropStyle)) return;
                                const st = document.createElement('style');
                                st.id = idBackdropStyle;
                                st.textContent = [
                                    '@keyframes jusgov-descanso-fade-lento{0%,100%{opacity:0.14;backdrop-filter:blur(0.5px)}50%{opacity:0.94;backdrop-filter:blur(3px)}}',
                                    '@keyframes jusgov-retorno-blink-tela{0%,100%{opacity:0.18;background:rgba(22,163,74,0.10);box-shadow:inset 0 0 28px rgba(74,222,128,0.28)}50%{opacity:1;background:rgba(34,197,94,0.36);box-shadow:inset 0 0 115px rgba(74,222,128,0.85)}}',
                                    '@keyframes jusgov-retorno-rajada{0%,100%{opacity:0.25;background:rgba(22,163,74,0.12);box-shadow:inset 0 0 40px rgba(74,222,128,0.35)}45%{opacity:1;background:rgba(134,239,172,0.50);box-shadow:inset 0 0 145px rgba(255,255,255,0.90)}70%{opacity:0.92;background:rgba(34,197,94,0.44);box-shadow:inset 0 0 120px rgba(74,222,128,0.92)}}'
                                ].join('');
                                (document.head || document.documentElement).appendChild(st);
                            };
                            const atualizarBackdropTelaCheia = (modo = 'nenhum') => {
                                if (!modo || modo === 'nenhum') {
                                    removerBackdropBlur();
                                    return;
                                }
                                garantirBackdropStyle();
                                let bd = document.getElementById(idBackdrop);
                                if (!bd) {
                                    bd = document.createElement('div');
                                    bd.id = idBackdrop;
                                    bd.setAttribute('data-jusgov-ignore', 'true');
                                    bd.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;width:100vw !important;height:100vh !important;pointer-events:none !important;z-index:2147483646 !important;margin:0 !important;padding:0 !important;border:0 !important;transform:none !important;will-change:opacity !important;';
                                    (document.documentElement || document.body).appendChild(bd);
                                }
                                if (bd.getAttribute('data-modo') === modo) return;
                                bd.setAttribute('data-modo', modo);
                                if (modo === 'descanso_calmo') {
                                    bd.style.setProperty('background', 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.30) 0%, rgba(2, 18, 42, 0.62) 100%)', 'important');
                                    bd.style.setProperty('box-shadow', 'inset 0 0 95px rgba(56, 189, 248, 0.24)', 'important');
                                    bd.style.setProperty('animation', 'jusgov-descanso-fade-lento 6.5s ease-in-out infinite', 'important');
                                } else if (modo === 'retorno_rajada') {
                                    bd.style.setProperty('backdrop-filter', 'none', 'important');
                                    bd.style.setProperty('animation', 'jusgov-retorno-rajada 0.55s ease-in-out infinite', 'important');
                                } else if (modo === 'retorno_trabalho') {
                                    bd.style.setProperty('backdrop-filter', 'none', 'important');
                                    bd.style.setProperty('animation', 'jusgov-retorno-blink-tela 1.8s ease-in-out infinite', 'important');
                                }
                            };
                            const garantirBackdropBlur = () => {
                                atualizarBackdropTelaCheia('descanso_calmo');
                            };

                            const gerenciarModalDescanso = () => {
                                const existente = document.getElementById(idModal);
                                if (existente) existente.remove();
                            };

                            const iniciouComChromeRuntime = Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
                            const destruirHost = (h) => {
                                removerBackdropBlur();
                                if (!h) return;
                                h.__jusgovHostDestruido = true;
                                if (h.__jusgovScreensaverRaf) {
                                    cancelAnimationFrame(h.__jusgovScreensaverRaf);
                                    h.__jusgovScreensaverRaf = 0;
                                }
                                if (h.__jusgovPatrulhaRaf) {
                                    cancelAnimationFrame(h.__jusgovPatrulhaRaf);
                                    h.__jusgovPatrulhaRaf = 0;
                                }
                                if (h.__jusgovHoverTimerSaida) { clearTimeout(h.__jusgovHoverTimerSaida); h.__jusgovHoverTimerSaida = 0; }
                                if (h.__jusgovTimerInterval) { clearInterval(h.__jusgovTimerInterval); h.__jusgovTimerInterval = 0; }
                                if (h.__jusgovTimerRetorno) { clearTimeout(h.__jusgovTimerRetorno); h.__jusgovTimerRetorno = null; }
                                if (h.__jusgovPropTimer) { clearTimeout(h.__jusgovPropTimer); h.__jusgovPropTimer = 0; }
                                if (h.__jusgovBannerShowTimer) { clearTimeout(h.__jusgovBannerShowTimer); h.__jusgovBannerShowTimer = 0; }
                                if (h.__jusgovBannerHideTimer) { clearTimeout(h.__jusgovBannerHideTimer); h.__jusgovBannerHideTimer = 0; }
                                if (h.__jusgovGovFeedbackTimer) { clearTimeout(h.__jusgovGovFeedbackTimer); h.__jusgovGovFeedbackTimer = 0; }
                                if (typeof h.__jusgovCleanupListeners === 'function') {
                                    try { h.__jusgovCleanupListeners(); } catch (_) { }
                                }
                                h.remove();
                            };

                            gerenciarModalDescanso(Boolean(cfgExib && cfgExib.deveExibirModalDescanso), cfgExib && cfgExib.modalDados, dadosResumo);

                            /* FEAT-39 / FEAT-88: Singleton estrito por reino isolado — descarta e reconstroi hosts orfaos de versoes/recargas anteriores */
                            const existentes = Array.from(document.querySelectorAll('#jusgov-pomodoro-barra-global, [data-jusgov-pomodoro-bar="true"]'));
                            let host = null;
                            const forcarReconstrucao = Boolean(cfgExib && cfgExib.forcarReconstrucao);
                            for (let dIdx = 0; dIdx < existentes.length; dIdx++) {
                                const candidato = existentes[dIdx];
                                const vivoNesteReino = Boolean(
                                    !forcarReconstrucao &&
                                    !host &&
                                    candidato &&
                                    !candidato.__jusgovHostDestruido &&
                                    typeof candidato.__jusgovAplicarSnapshotExterno === 'function'
                                );
                                if (vivoNesteReino) {
                                    host = candidato;
                                } else {
                                    destruirHost(candidato);
                                }
                            }

                            /* Remove eventual legado por guia para que todas as guias reflitam o estado global unificado */
                            try { sessionStorage.removeItem('jusgovPomodoroBarraFixadaTab'); } catch (_) { }

                            const normalizarEstadoBarra = (eb) => ({
                                modoFixacao: (eb && (eb.modoFixacao === 1 || eb.modoFixacao === 2)) ? eb.modoFixacao : 1,
                                nivelDetalhe: (eb && (eb.nivelDetalhe === 1 || eb.nivelDetalhe === 2)) ? eb.nivelDetalhe : 0,
                                posicaoVertical: (eb && eb.posicaoVertical === 'inferior') ? 'inferior' : 'superior',
                                posicaoVerticalAncorada: (eb && eb.posicaoVerticalAncorada === 'inferior')
                                    ? 'inferior'
                                    : ((eb && eb.posicaoVertical === 'inferior') ? 'inferior' : 'superior'),
                                alinhamento: (eb && (eb.alinhamento === 'centro' || eb.alinhamento === 'direita')) ? eb.alinhamento : 'esquerda',
                                alinhamentoAncorado: (eb && (eb.alinhamentoAncorado === 'esquerda' || eb.alinhamentoAncorado === 'direita' || eb.alinhamentoAncorado === 'centro'))
                                    ? eb.alinhamentoAncorado
                                    : ((eb && (eb.alinhamento === 'centro' || eb.alinhamento === 'direita')) ? eb.alinhamento : 'esquerda'),
                                minimizadoMicro: Boolean(eb && eb.minimizadoMicro),
                                minimizadoDescansoAdiadoTs: Math.max(0, Math.round(Number((eb && eb.minimizadoDescansoAdiadoTs) || 0)))
                            });

                            const resolverPermissaoExibicao = (hRef, cExib, dRes) => {
                                const chave = `${dRes.fase}:${dRes.cicloAtual}:${dRes.faseInicioTs}`;
                                try { sessionStorage.removeItem('jusgovPomodoroBarraFechadaFaseTab'); } catch (_) { }
                                const fechadaNaGuia = false;
                                const podeBannerOculto = Boolean(
                                    cExib && cExib.ativoPorConfig &&
                                    !fechadaNaGuia &&
                                    !cExib.deveExibirNormal &&
                                    cExib.bannerPropagandaOculta
                                );
                                const deveExibir = Boolean(
                                    cExib && cExib.ativoPorConfig &&
                                    !fechadaNaGuia &&
                                    (cExib.deveExibirNormal || podeBannerOculto)
                                );
                                return {
                                    deveExibir,
                                    deveExibirNormal: Boolean(cExib && cExib.deveExibirNormal),
                                    podeBannerOculto,
                                    chave
                                };
                            };

                            const obterModoPosicaoEspecial = (d, agoraNow = Date.now()) => {
                                if (d && d.emDescanso) {
                                    const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
                                    const concluido = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);
                                    if (!concluido && d.descansoEmAviso) {
                                        return (d.descansoUltimoTipoInteracao === 'movimento') ? 'aviso_movimento_centro_blur' : 'aviso_topo_centro';
                                    }
                                    const ativAte = Number(d.descansoAtividadeAteTs || 0);
                                    const semScreensaverAte = Number(d.descansoSemScreensaverAteTs || 0);
                                    if (!concluido && !d.aguardandoOciosidade && semScreensaverAte > 0 && agoraNow < semScreensaverAte) {
                                        return 'aviso_topo_centro';
                                    }
                                    if (!d.aguardandoOciosidade && (concluido || agoraNow >= Math.max(ativAte, semScreensaverAte))) return 'idle_centro_tela';
                                }
                                return 'padrao';
                            };

                            const exibInicial = resolverPermissaoExibicao(host, cfgExib, dadosResumo);
                            if (!exibInicial.deveExibir) {
                                destruirHost(host);
                                return;
                            }

                            /* Posicionamento estrito em coordenadas numéricas (px) para permitir transição rápida e fluida entre quaisquer 6 bordas, topo central e centro */
                            const obterDimensoesAtuaisHost = (h) => {
                                const uiRef = h && h.__jusgovUI;
                                const candidatos = [
                                    uiRef && uiRef.microIconeBox,
                                    uiRef && uiRef.boxBannerOculto,
                                    uiRef && uiRef.pill
                                ];
                                for (let i = 0; i < candidatos.length; i++) {
                                    const el = candidatos[i];
                                    if (el && el.style.display !== 'none') {
                                        const r = el.getBoundingClientRect();
                                        if (r && r.width > 8 && r.height > 8) {
                                            return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
                                        }
                                    }
                                }
                                const rh = h && typeof h.getBoundingClientRect === 'function' ? h.getBoundingClientRect() : null;
                                return {
                                    w: (rh && rh.width > 8) ? Math.ceil(rh.width) : 96,
                                    h: (rh && rh.height > 8) ? Math.ceil(rh.height) : 22
                                };
                            };

                            const aplicarPosicao = (h, posVertVal, alinhVal, leftLivre = null, topLivre = null, animar = false) => {
                                if (!h) return;
                                const docEl = document.documentElement;
                                const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                const dims = obterDimensoesAtuaisHost(h);
                                const largRef = Math.min(wTela, dims.w);
                                const altRef = Math.min(hTela, dims.h);
                                const maxLeft = Math.max(0, wTela - largRef);
                                const maxTop = Math.max(0, hTela - altRef);
                                h.style.setProperty('transition', animar ? 'left 0.22s cubic-bezier(0.22,1,0.36,1),top 0.22s cubic-bezier(0.22,1,0.36,1)' : 'none', 'important');

                                if (leftLivre !== null && topLivre !== null && Number.isFinite(Number(leftLivre)) && Number.isFinite(Number(topLivre))) {
                                    const leftSeguro = Math.max(0, Math.min(maxLeft, Math.round(Number(leftLivre))));
                                    const topSeguro = Math.max(0, Math.min(maxTop, Math.round(Number(topLivre))));
                                    h.style.setProperty('top', `${topSeguro}px`, 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                    h.style.setProperty('left', `${leftSeguro}px`, 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                    return;
                                }
                                if (posVertVal === 'centro_tela') {
                                    const leftCx = Math.max(0, Math.min(maxLeft, Math.round((wTela - largRef) / 2)));
                                    const topCy = Math.max(0, Math.min(maxTop, Math.round((hTela - altRef) / 2)));
                                    h.style.setProperty('top', `${topCy}px`, 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                    h.style.setProperty('left', `${leftCx}px`, 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                    h.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: topCy, leftPx: leftCx };
                                    return;
                                }
                                const posVert = (posVertVal === 'inferior') ? 'inferior' : 'superior';
                                const alinh = (alinhVal === 'esquerda' || alinhVal === 'direita') ? alinhVal : 'centro';
                                const topAlvo = (posVert === 'inferior') ? maxTop : 0;
                                const leftAlvo = (alinh === 'esquerda')
                                    ? 0
                                    : ((alinh === 'direita') ? maxLeft : Math.max(0, Math.min(maxLeft, Math.round((wTela - largRef) / 2))));
                                h.style.setProperty('top', `${topAlvo}px`, 'important');
                                h.style.setProperty('bottom', 'auto', 'important');
                                h.style.setProperty('left', `${leftAlvo}px`, 'important');
                                h.style.setProperty('right', 'auto', 'important');
                                h.style.setProperty('transform', 'none', 'important');
                                h.__jusgovPos = { posicaoVertical: posVert, alinhamento: alinh, topPx: topAlvo, leftPx: leftAlvo };
                            };

                            const pathsBemEstar = {
                                play: ['M4.5 3.2 13 8 4.5 12.8z'],
                                pause: ['M4 3h3v10H4z', 'M9 3h3v10H9z'],
                                agua: ['M8 1.5C8 1.5 3.5 6.8 3.5 10a4.5 4.5 0 0 0 9 0C12.5 6.8 8 1.5 8 1.5zm-1.8 9.2a2.1 2.1 0 0 1-.4-1.3'],
                                esticar: ['M8 2.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM3.2 3.4l2.7 2.4h4.2l2.7-2.4-.9-.9L9.6 4.7H6.4L4.1 2.5zM6 6.2v4.6l-1.5 3.5 1.1.5L7.5 11h1l1.9 3.8 1.1-.5L10 10.8V6.2z'],
                                olhos: ['M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8s-2.4 4.2-6.5 4.2S1.5 8 1.5 8zm6.5-2.1a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2z'],
                                respirar: ['M2 5.8h7.4a1.8 1.8 0 1 0-1.8-1.8', 'M2 8.8h9.8a1.9 1.9 0 1 1-1.9 1.9', 'M2 11.6h5.5'],
                                sem_celular: ['M5.2 2h5.6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2.2 2.2l11.6 11.6'],
                                sem_tela: ['M2.5 3.2h11v7.6h-11zM6.2 13h3.6M2 2l12 12'],
                                sol: ['M8 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1'],
                                sem_tarefa: ['M3 3h10v10H3zM5.5 6.5h5M5.5 9.5h3M2 2l12 12'],
                                lanche: ['M4 6h7.2v4.2a3.2 3.2 0 0 1-6.4 0V6zm7.2.8h1.5a1.5 1.5 0 0 1 0 3h-1.5M5.8 2.5c0 .9-.7 1.3-.7 2.1M8.6 2.5c0 .9-.7 1.3-.7 2.1'],
                                caminhar: ['M8.8 2a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 8.8 2zM6.4 5.5l2.6.6 1.8 2.2-.9.8-1.5-1.7-1.1 2.4 2.1 3.9-1.2.6-2-3.4-1.7 3.4-1.2-.6 2.2-4.6z'],
                                musica: ['M6 12.2a1.8 1.8 0 1 1-2-1.8V4.2l8-1.6v8.2a1.8 1.8 0 1 1-2-1.8V4.5l-4 .8v6.9z'],
                                organizar: ['M2.2 4a1 1 0 0 1 1-1h3.5l1.1 1.4h5a1 1 0 0 1 1 1v6.6a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V4z'],
                                desconectar: ['M8 2v4.5M4.6 4.1a5.2 5.2 0 1 0 6.8 0'],
                                retorno_trabalho: ['M3 5.2h10v7.6H3zM5.8 3.2h4.4v2H5.8z'],
                                incentivo_descanso: ['M4.5 2.5h7v1.2L9.2 7.5l2.3 3.8v1.2h-7v-1.2L6.8 7.5 4.5 3.7z'],
                                cafe: ['M3 6.5h7.5v3.8a3.2 3.2 0 0 1-3.2 3.2H6.2A3.2 3.2 0 0 1 3 10.3V6.5zm7.5.7h1.4a1.5 1.5 0 0 1 0 3h-1.4M5.4 2.2c0 1 .9 1.4.9 2.4M8.1 2.2c0 1 .9 1.4.9 2.4M2.5 14.3h8.8'],
                                copo_agua: ['M4.2 2.5h7.6l-.9 11H5.1l-.9-11zM4.7 7.2c1.1-.6 2.2.6 3.3 0s2.2-.6 3.3 0'],
                                vitamina: ['M5 5.2h6l-.8 8.3H5.8L5 5.2zm2.5 0L9.2 1.8h2M4.3 5.2h7.4M6.5 8.5c1 .5 2-.5 3 0'],
                                sem_redes: ['M2.8 3.6h10.4a1 1 0 0 1 1 1v6.2a1 1 0 0 1-1 1H6.5L3.6 14v-2.2H2.8a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1zM2 2l12 12'],
                                sem_notificacoes: ['M8 2.2a3.5 3.5 0 0 1 3.5 3.5v3l1.2 1.8H3.3L4.5 8.7v-3A3.5 3.5 0 0 1 8 2.2zm-1.3 9.5a1.4 1.4 0 0 0 2.6 0M2 2l12 12'],
                                sem_email: ['M2.2 3.8h11.6v8.4H2.2V3.8zm0 .4L8 8.6l5.8-4.4M2 2l12 12'],
                                alvo: ['M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 2.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z'],
                                relogio_alerta: ['M8 3a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 8 3zm0 2.5v3l2 1.2M3.2 2.5L5 4M12.8 2.5L11 4'],
                                balanca: ['M8 2.5v11M4 13.5h8M3 5.5h10M4 5.5l-1.5 3.5h3L4 5.5zm8 0l-1.5 3.5h3L12 5.5z'],
                                postura_cadeira: ['M5.5 2.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM5.5 6v4h4.5v3.5M4 6v5.5h5'],
                                mente_calma: ['M8 3.2c-2.5 0-4.5 1.8-4.5 4.2 0 1.6.9 3 2.2 3.7v1.7h4.6v-1.7c1.3-.7 2.2-2.1 2.2-3.7 0-2.4-2-4.2-4.5-4.2z'],
                                energia: ['M9.2 1.8L4 8.5h3.6l-.8 5.7L12 7.5H8.4l.8-5.7z'],
                                musica_calma: ['M6 11.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6-1.3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7.5 13V4.2l6-1.2v8.8']
                            };
                            const criarIconeSvgBemEstar = (tipo, cor, tamanho = 13, strokedOnly = false) => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', String(tamanho));
                                svg.setAttribute('height', String(tamanho));
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
                                svg.style.flexShrink = '0';
                                svg.style.pointerEvents = 'none';
                                const lista = pathsBemEstar[tipo] || pathsBemEstar.esticar;
                                const usaStroke = strokedOnly || ['agua', 'respirar', 'sem_celular', 'sem_tela', 'sol', 'sem_tarefa', 'lanche', 'desconectar', 'olhos', 'cafe', 'copo_agua', 'vitamina', 'sem_redes', 'sem_notificacoes', 'sem_email', 'alvo', 'relogio_alerta', 'balanca', 'postura_cadeira', 'mente_calma', 'energia', 'musica_calma'].includes(tipo);
                                for (let i = 0; i < lista.length; i++) {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', lista[i]);
                                    if (usaStroke) {
                                        p.setAttribute('stroke', cor);
                                        p.setAttribute('stroke-width', '1.45');
                                        p.setAttribute('stroke-linecap', 'round');
                                        p.setAttribute('stroke-linejoin', 'round');
                                    } else {
                                        p.setAttribute('fill', cor);
                                    }
                                    svg.appendChild(p);
                                }
                                return svg;
                            };

                            const criarIconeAppMicro = (tamanho = 12, corRaio = '#10b981') => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', String(tamanho));
                                svg.setAttribute('height', String(tamanho));
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
                                svg.style.pointerEvents = 'none';
                                const raio = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                raio.setAttribute('d', 'M9.6 1.5 4.1 8.8h3.5l-.8 5.7 5.5-7.3H8.8z');
                                raio.setAttribute('fill', corRaio);
                                svg.appendChild(raio);
                                return svg;
                            };

                            const enviarEstadoGlobal = (patch) => {
                                try {
                                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                        chrome.runtime.sendMessage({
                                            acao: 'ATUALIZAR_ESTADO_BARRA_POMODORO',
                                            ...patch
                                        }).catch(() => { });
                                    }
                                } catch (_) { }
                            };

                            if (!host) {
                                host = document.createElement('div');
                                host.id = idHost;
                                host.setAttribute('data-jusgov-pomodoro-bar', 'true');
                                host.setAttribute('data-jusgov-ignore', 'true');
                                host.style.cssText = 'position:fixed !important;top:0px !important;bottom:auto !important;left:0px !important;right:auto !important;transform:none !important;margin:0 !important;padding:0 !important;border:0 !important;line-height:1 !important;width:auto !important;height:auto !important;z-index:2147483647 !important;pointer-events:none !important;font-family:"Segoe UI",system-ui,-apple-system,sans-serif !important;transition:none !important;';
                                const shadow = host.attachShadow({ mode: 'closed' });
                                const styleAnim = document.createElement('style');
                                styleAnim.textContent = '@keyframes jusgov-piscar-crono{0%,49%{opacity:1}50%,100%{opacity:0.22}}@keyframes jusgov-pill-alerta-30s{0%,49%{border-color:#eab308;box-shadow:0 0 12px rgba(250,204,21,0.75),0 4px 14px rgba(15,23,42,0.34)}50%,100%{border-color:#ca8a04;box-shadow:0 0 2px rgba(250,204,21,0.18),0 4px 14px rgba(15,23,42,0.34)}}@keyframes jusgov-piscar-icone{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.42;transform:scale(1.12)}}@keyframes jusgov-pill-retorno{0%,100%{background:#065f46;border-color:#4ade80;box-shadow:0 0 22px rgba(74,222,128,0.85),0 6px 18px rgba(0,0,0,0.45)}50%{background:#15803d;border-color:#fef08a;box-shadow:0 0 36px rgba(134,239,172,1),0 6px 22px rgba(0,0,0,0.5)}}.jg-piscar{animation:jusgov-piscar-icone 0.9s ease-in-out infinite;transform-origin:center;}';
                                shadow.appendChild(styleAnim);
                                const pill = document.createElement('div');
                                pill.style.cssText = 'pointer-events:auto;display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:1px 6px;border-radius:7px;background:#0f172a;color:#f8fafc;font-size:11px;line-height:1.1;font-weight:600;box-shadow:0 4px 14px rgba(15,23,42,0.34);border:1px solid #0d9488;white-space:nowrap;cursor:grab;user-select:none;touch-action:none;margin:0;';
                                const linhaPrincipal = document.createElement('div');
                                linhaPrincipal.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:5px;line-height:1.1;';
                                const spanFase = document.createElement('span');
                                spanFase.setAttribute('data-parte', 'fase');
                                spanFase.style.cssText = 'font-size:11px;line-height:1.1;';
                                const spanTempo = document.createElement('span');
                                spanTempo.setAttribute('data-parte', 'tempo');
                                spanTempo.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;font-size:11px;line-height:1.1;';
                                const spanStatus = document.createElement('span');
                                spanStatus.setAttribute('data-parte', 'status');
                                spanStatus.style.cssText = 'width:100%;box-sizing:border-box;text-align:center;padding:1px 5px;border-radius:4px;font-size:10px;line-height:1.15;font-weight:700;display:none;';
                                const linhaPropaganda = document.createElement('div');
                                linhaPropaganda.setAttribute('data-parte', 'propaganda');
                                linhaPropaganda.style.cssText = 'display:none;align-items:center;gap:5px;padding:2px 6px;border-radius:4px;font-size:10px;line-height:1.2;font-weight:700;white-space:normal;max-width:255px;box-sizing:border-box;';
                                const spanPropIcone = document.createElement('span');
                                spanPropIcone.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
                                const spanPropTexto = document.createElement('span');
                                spanPropTexto.style.cssText = 'flex:1;';
                                linhaPropaganda.appendChild(spanPropIcone);
                                linhaPropaganda.appendChild(spanPropTexto);
                                const boxBannerOculto = document.createElement('div');
                                boxBannerOculto.setAttribute('data-parte', 'banner-propaganda-oculta');
                                boxBannerOculto.style.cssText = 'pointer-events:auto;display:none;align-items:center;gap:7px;padding:4px 8px;border-radius:9px;background:#0284c7;color:#ffffff;font-size:11px;line-height:1.15;font-weight:700;box-shadow:0 6px 18px rgba(15,23,42,0.42);border:1px solid rgba(255,255,255,0.45);cursor:pointer;max-width:250px;';
                                const spanBannerIcone = document.createElement('span');
                                spanBannerIcone.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
                                const spanBannerTexto = document.createElement('span');
                                spanBannerTexto.style.cssText = 'flex:1;white-space:normal;';
                                boxBannerOculto.appendChild(spanBannerIcone);
                                boxBannerOculto.appendChild(spanBannerTexto);
                                const microIconeBox = document.createElement('div');
                                microIconeBox.setAttribute('data-parte', 'micro-icone');
                                microIconeBox.style.cssText = 'pointer-events:auto;display:none;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:#0f172a;border:1.5px solid #0d9488;box-shadow:0 4px 14px rgba(15,23,42,0.34);cursor:grab;user-select:none;touch-action:none;box-sizing:border-box;padding:0;margin:0;';
                                microIconeBox.replaceChildren(criarIconeAppMicro(12, '#10b981'));
                                linhaPrincipal.appendChild(spanFase);
                                linhaPrincipal.appendChild(spanTempo);
                                pill.appendChild(linhaPrincipal);
                                pill.appendChild(spanStatus);
                                pill.appendChild(linhaPropaganda);
                                shadow.appendChild(pill);
                                shadow.appendChild(boxBannerOculto);
                                shadow.appendChild(microIconeBox);
                                host.__jusgovUI = {
                                    pill, linhaPrincipal, spanFase, spanTempo,
                                    spanStatus, linhaPropaganda, spanPropIcone, spanPropTexto,
                                    boxBannerOculto, spanBannerIcone, spanBannerTexto,
                                    microIconeBox
                                };

                                const resolverCorBordaSemaforo = (dSem) => {
                                    if (!dSem || typeof dSem !== 'object' || dSem.ativo === false) {
                                        return '#64748b';
                                    }
                                    if (dSem.emPausa) {
                                        return (Number(dSem.segundosRestantes || 0) > 0) ? '#eab308' : '#64748b';
                                    }
                                    const metaMsSem = Number(dSem.metaFaseMs || 0) > 0
                                        ? Number(dSem.metaFaseMs)
                                        : (Math.max(1, Number(dSem.metaFaseMin || 1)) * 60000);
                                    const cumpridoSem = Boolean(dSem.emDescanso && (dSem.descansoMinCumprido || Number(dSem.descansoAcumuladoMs || 0) >= metaMsSem));
                                    if (dSem.emDescanso) {
                                        if (!cumpridoSem && dSem.descansoEmAviso && dSem.descansoAvisoTexto) return '#eab308';
                                        if (cumpridoSem) return '#16a34a';
                                        if (dSem.aguardandoOciosidade) return '#dc2626';
                                        const restDescSeg = Math.max(0, Number(dSem.segundosRestantes || 0));
                                        if (restDescSeg > 0 && restDescSeg <= 30) return '#eab308';
                                        return '#0d9488';
                                    }
                                    if (dSem.descansoPendente || dSem.descansoPulado) return '#dc2626';
                                    const metaFocoSegSem = Math.max(1, Number(dSem.metaFaseMin || dSem.focoMin || 45)) * 60;
                                    const segDecSem = Math.max(0, Number(dSem.segundosDecorridos || 0));
                                    const emAlerta30Sem = Boolean((metaFocoSegSem - segDecSem) > 0 && (metaFocoSegSem - segDecSem) <= 30);
                                    const emFocoExtraSem = Boolean(segDecSem > metaFocoSegSem);
                                    if (emAlerta30Sem || emFocoExtraSem) return '#eab308';
                                    return '#0d9488';
                                };

                                const restaurarBordaSemaforo = () => {
                                    const corBorda = resolverCorBordaSemaforo(host.__jusgovDados || dadosResumo);
                                    pill.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease';
                                    pill.style.borderColor = corBorda;
                                    pill.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    microIconeBox.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease';
                                    microIconeBox.style.borderColor = corBorda;
                                    microIconeBox.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    return corBorda;
                                };

                                const aplicarBordaArcoIrisAleatoria = (tsNow = performance.now(), modo = 'descanso') => {
                                    const proxTroca = Number(host.__jusgovArcoIrisProxTs || 0);
                                    if (tsNow >= proxTroca) {
                                        const passoIntervaloMs = (modo === 'arraste')
                                            ? 75
                                            : ((modo === 'patrulha') ? 130 : 220);
                                        host.__jusgovArcoIrisProxTs = tsNow + passoIntervaloMs;
                                        if (!Number.isFinite(host.__jusgovArcoIrisHue)) {
                                            host.__jusgovArcoIrisHue = Math.floor(Math.random() * 360);
                                        }
                                        if (!Number.isFinite(host.__jusgovArcoIrisDir) || Math.random() < 0.04) {
                                            host.__jusgovArcoIrisDir = Math.random() < 0.5 ? 1 : -1;
                                        }
                                        const deltaHue = (modo === 'arraste')
                                            ? (18 + Math.random() * 32)
                                            : ((modo === 'patrulha')
                                                ? (3.2 + Math.random() * 2.4)
                                                : (1.1 + Math.random() * 0.9));
                                        host.__jusgovArcoIrisHue = (Number(host.__jusgovArcoIrisHue) + host.__jusgovArcoIrisDir * deltaHue + 360) % 360;
                                        const hueBase = Math.round(host.__jusgovArcoIrisHue);
                                        const sat = (modo === 'descanso') ? 76 : ((modo === 'patrulha') ? 86 : 92);
                                        const lum = (modo === 'descanso') ? 54 : 58;
                                        const alphaGlow = (modo === 'descanso') ? 0.22 : ((modo === 'patrulha') ? 0.42 : 0.58);
                                        const transCss = (modo === 'arraste')
                                            ? 'border-color 0.14s linear, box-shadow 0.14s linear'
                                            : ((modo === 'patrulha')
                                                ? 'border-color 0.26s linear, box-shadow 0.26s linear'
                                                : 'border-color 0.55s linear, box-shadow 0.55s linear');
                                        const corHexHsl = `hsl(${hueBase}, ${sat}%, ${lum}%)`;
                                        const brilho = `0 0 8px hsla(${hueBase}, 90%, 60%, ${alphaGlow}), 0 4px 14px rgba(15,23,42,0.34)`;
                                        pill.style.transition = transCss;
                                        pill.style.borderColor = corHexHsl;
                                        pill.style.boxShadow = brilho;
                                        microIconeBox.style.transition = transCss;
                                        microIconeBox.style.borderColor = corHexHsl;
                                        microIconeBox.style.boxShadow = brilho;
                                    }
                                };
                                host.__jusgovArrastando = false;
                                host.__jusgovCooldownEsquiva = 0;
                                host.__jusgovRetornoRect = null;
                                host.__jusgovTimerRetorno = null;
                                host.__jusgovUltimoCursor = { x: -9999, y: -9999 };

                                const agendarRetornoPosicaoAncorada = () => {
                                    if (!host.__jusgovRetornoRect) return;
                                    const dRet = host.__jusgovDados || dadosResumo;
                                    const modoEspRet = obterModoPosicaoEspecial(dRet, Date.now());
                                    const est = host.__jusgovEstadoBarra;
                                    if (modoEspRet !== 'aviso_topo_centro' && (!est || Number(est.modoFixacao) !== 1)) {
                                        host.__jusgovRetornoRect = null;
                                        return;
                                    }
                                    if (host.__jusgovTimerRetorno) clearTimeout(host.__jusgovTimerRetorno);
                                    host.__jusgovTimerRetorno = setTimeout(() => {
                                        host.__jusgovTimerRetorno = null;
                                        const dAg = host.__jusgovDados || dadosResumo;
                                        const modoEspAg = obterModoPosicaoEspecial(dAg, Date.now());
                                        const estAgora = host.__jusgovEstadoBarra;
                                        if (modoEspAg !== 'aviso_topo_centro' && (!estAgora || Number(estAgora.modoFixacao) !== 1)) return;
                                        if (!host.__jusgovRetornoRect) return;
                                        const c = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                        const rOrig = host.__jusgovRetornoRect;
                                        const foraOrig = (c.x < rOrig.left - 14 || c.x > rOrig.right + 14 || c.y < rOrig.top - 14 || c.y > rOrig.bottom + 14);
                                        if (foraOrig) {
                                            host.__jusgovRetornoRect = null;
                                            host.__jusgovCooldownEsquiva = Date.now() + 260;
                                            if (modoEspAg === 'aviso_topo_centro') {
                                                aplicarPosicao(host, 'superior', 'centro');
                                            } else {
                                                aplicarPosicao(host, estAgora.posicaoVerticalAncorada, estAgora.alinhamentoAncorado);
                                            }
                                        }
                                    }, 450);
                                };

                                const exibirFeedbackGovernanca = (textoAviso) => {
                                    if (!textoAviso) return;
                                    host.__jusgovGovFeedbackTexto = String(textoAviso);
                                    host.__jusgovGovFeedbackAteTs = Date.now() + 5000;
                                    if (host.__jusgovGovFeedbackTimer) clearTimeout(host.__jusgovGovFeedbackTimer);
                                    host.__jusgovGovFeedbackTimer = setTimeout(() => {
                                        host.__jusgovGovFeedbackAteTs = 0;
                                        if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                            host.__jusgovAtualizarPropaganda();
                                        }
                                    }, 5100);
                                    if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                        host.__jusgovAtualizarPropaganda();
                                    }
                                };

                                const contextoHostVivo = () => {
                                    if (!host || host.__jusgovHostDestruido || !host.isConnected) {
                                        if (host) destruirHost(host);
                                        return false;
                                    }
                                    if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id)) {
                                        destruirHost(host);
                                        return false;
                                    }
                                    return true;
                                };

                                boxBannerOculto.addEventListener('mouseenter', () => {
                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        const dHoverPat = host.__jusgovDados || dadosResumo;
                                        const estavaEmPatrulhaHover = Boolean(
                                            dHoverPat && dHoverPat.descansoPulado &&
                                            (host.__jusgovPatrulhaAtiva || host.__jusgovPatrulhaPos)
                                        );
                                        host.__jusgovPreviewPatrulhaSemBotoes = estavaEmPatrulhaHover;
                                        if (host.__jusgovHoverMax10sTimer) clearTimeout(host.__jusgovHoverMax10sTimer);
                                        if (estavaEmMicroVisivel || estavaEmPatrulhaHover) {
                                            host.__jusgovHoverMax10sTimer = setTimeout(() => {
                                                host.__jusgovHoverMax10sTimer = 0;
                                                if (host.__jusgovHoverPill) {
                                                    host.__jusgovSuprimirHoverMicroAteTs = Date.now() + 2500;
                                                    host.__jusgovHoverPill = false;
                                                    host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                    if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                }
                                            }, 10000);
                                            requestAnimationFrame(() => {
                                                if (host && host.isConnected && host.__jusgovHoverPill && typeof host.__jusgovAtualizarPosicaoEfetiva === 'function') {
                                                    host.__jusgovAtualizarPosicaoEfetiva(Date.now());
                                                }
                                            });
                                        }
                                        if (host.__jusgovHoverAcoesTimer) clearTimeout(host.__jusgovHoverAcoesTimer);
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (estavaEmPatrulhaHover) {
                                            host.__jusgovPatrulhaHoverTimer = setTimeout(() => {
                                                host.__jusgovPatrulhaHoverTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovPreviewPatrulhaSemBotoes) return;
                                                host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                host.__jusgovHoverPill = false;
                                                host.__jusgovHoverInicioTs = 0;
                                                host.__jusgovDeslocadoHoverMicro = false;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                if (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                                    host.style.setProperty('transition', 'none', 'important');
                                                    host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                                    host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                                }
                                                if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') host.__jusgovIniciarPatrulhaBorda();
                                            }, 10000);
                                        } else {
                                            host.__jusgovHoverAcoesTimer = setTimeout(() => {
                                                host.__jusgovHoverAcoesTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovHoverPill) return;
                                                host.__jusgovHoverAcoesDesbloqueadas = true;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                            }, 2200);
                                        }
                                    }
                                    host.__jusgovHoverPill = true;
                                    host.__jusgovHoverInicioTs = Date.now();
                                    if (typeof host.__jusgovAtualizarBannerOculto === 'function') {
                                        host.__jusgovAtualizarBannerOculto();
                                    }
                                    if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    }
                                });
                                boxBannerOculto.addEventListener('mouseleave', () => {
                                    setTimeout(() => {
                                        if (!pill.matches(':hover') && !boxBannerOculto.matches(':hover')) {
                                            host.__jusgovHoverPill = false;
                                            if (typeof host.__jusgovAtualizarBannerOculto === 'function') {
                                                host.__jusgovAtualizarBannerOculto();
                                            }
                                        }
                                    }, 250);
                                });

                                /* Clique único sem arrastar: em FOCO_NORMAL cicla os 4 estilos (Micro -> Mini -> Normal -> Expandido -> Micro) sincronizando com Opções; nos demais estados apenas abre preview temporário sem sobrescrever o estilo salvo (FEAT-106) */
                                const alternarModoPorCliqueUnico = () => {
                                    const agoraClk = Date.now();
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const dClk = host.__jusgovDados || dadosResumo;
                                    const segDecClk = Math.max(0, Number(dClk && dClk.segundosDecorridos || 0));
                                    const metaFocoSegClk = Math.max(1, Number((dClk && (dClk.metaFaseMin || dClk.focoMin)) || 45)) * 60;
                                    const segRestClk = metaFocoSegClk - segDecClk;
                                    const necAtivClk = Number(dClk && dClk.necessidadeAtividadeMs || 0);
                                    const emFocoNormal = Boolean(
                                        dClk &&
                                        !dClk.emDescanso &&
                                        !dClk.descansoPendente &&
                                        !dClk.descansoPulado &&
                                        !dClk.descansoEmAviso &&
                                        !dClk.emPausa &&
                                        !dClk.forcarMicroPorEmprestimoFoco &&
                                        necAtivClk >= -60000 &&
                                        segRestClk > 30
                                    );
                                    host.__jusgovLocalBarraAlteradaAteTs = agoraClk + 1800;
                                    if (host.__jusgovHoverAcoesTimer) {
                                        clearTimeout(host.__jusgovHoverAcoesTimer);
                                        host.__jusgovHoverAcoesTimer = 0;
                                    }
                                    if (host.__jusgovPatrulhaHoverTimer) {
                                        clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                        host.__jusgovPatrulhaHoverTimer = 0;
                                    }
                                    host.__jusgovPreviewPatrulhaSemBotoes = false;
                                    if (!host.isConnected && !host.__jusgovHostDestruido) {
                                        (document.body || document.documentElement).appendChild(host);
                                    }

                                    const garantirVisivelSemSnap = () => {
                                        if (!host.__jusgovModoOculto) {
                                            host.style.setProperty('display', 'block', 'important');
                                            host.style.setProperty('visibility', 'visible', 'important');
                                            host.style.setProperty('opacity', '1', 'important');
                                            microIconeBox.style.display = 'none';
                                            pill.style.display = 'inline-flex';
                                        }
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                        else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                        const docElC = document.documentElement;
                                        const wTC = Math.max(320, (docElC && docElC.clientWidth) || window.innerWidth || 1280);
                                        const hTC = Math.max(200, (docElC && docElC.clientHeight) || window.innerHeight || 720);
                                        const dimsC = obterDimensoesAtuaisHost(host);
                                        const curLC = parseFloat(host.style.left);
                                        const curTC = parseFloat(host.style.top);
                                        if (Number.isFinite(curLC) && Number.isFinite(curTC)) {
                                            const maxLC = Math.max(0, wTC - Math.min(wTC, dimsC.w));
                                            const maxTC = Math.max(0, hTC - Math.min(hTC, dimsC.h));
                                            host.style.setProperty('left', `${Math.max(0, Math.min(maxLC, Math.round(curLC)))}px`, 'important');
                                            host.style.setProperty('top', `${Math.max(0, Math.min(maxTC, Math.round(curTC)))}px`, 'important');
                                        }
                                    };

                                    if (!emFocoNormal) {
                                        host.__jusgovAguardandoSairPosMin = false;
                                        host.__jusgovSuprimirHoverMicroAteTs = 0;
                                        host.__jusgovHoverPill = true;
                                        host.__jusgovHoverAcoesDesbloqueadas = true;
                                        garantirVisivelSemSnap();
                                        return;
                                    }

                                    if (estAtual.minimizadoMicro) {
                                        estAtual.minimizadoMicro = false;
                                        estAtual.nivelDetalhe = 0;
                                        estAtual.minimizadoDescansoAdiadoTs = 0;
                                        host.__jusgovAguardandoSairPosMin = false;
                                        host.__jusgovSuprimirHoverMicroAteTs = 0;
                                        host.__jusgovHoverPill = true;
                                        if (typeof host.__jusgovPararPatrulhaBorda === 'function') host.__jusgovPararPatrulhaBorda();
                                        host.__jusgovEstadoBarra = estAtual;
                                        garantirVisivelSemSnap();
                                        enviarEstadoGlobal({ minimizadoMicro: false, nivelDetalhe: 0, minimizadoDescansoAdiadoTs: 0 });
                                        return;
                                    }

                                    const nivAtual = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    if (nivAtual === 0) {
                                        estAtual.nivelDetalhe = 1;
                                        host.__jusgovEstadoBarra = estAtual;
                                        garantirVisivelSemSnap();
                                        enviarEstadoGlobal({ minimizadoMicro: false, nivelDetalhe: 1 });
                                        return;
                                    }
                                    if (nivAtual === 1) {
                                        estAtual.nivelDetalhe = 2;
                                        host.__jusgovEstadoBarra = estAtual;
                                        garantirVisivelSemSnap();
                                        enviarEstadoGlobal({ minimizadoMicro: false, nivelDetalhe: 2 });
                                        return;
                                    }

                                    estAtual.minimizadoMicro = true;
                                    estAtual.nivelDetalhe = 0;
                                    host.__jusgovEstadoBarra = estAtual;
                                    host.__jusgovHoverPill = false;
                                    host.__jusgovAguardandoSairPosMin = true;
                                    host.__jusgovSuprimirHoverMicroAteTs = agoraClk + 1600;
                                    if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                    enviarEstadoGlobal({ minimizadoMicro: true, nivelDetalhe: 0 });
                                };

                                /* Arraste fluido via Pointer Events (setPointerCapture evita travar sobre iframes) em pill e micro-ícone; clique sem arraste alterna o modo */
                                const configurarArrasteElemento = (elArraste) => {
                                    elArraste.addEventListener('mousedown', (ev) => {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                    });
                                    elArraste.addEventListener('pointerdown', (ev) => {
                                        if (ev.button !== 0) return;
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        const pointerId = ev.pointerId;
                                        const startX = ev.clientX;
                                        const startY = ev.clientY;
                                        const startRect = elArraste.getBoundingClientRect();
                                        const startTop = startRect ? Math.round(startRect.top) : 0;
                                        const startLeft = startRect ? Math.round(startRect.left) : 0;
                                        const largPill = (startRect && startRect.width > 16) ? Math.ceil(startRect.width) : 24;
                                        const altPill = (startRect && startRect.height > 8) ? Math.ceil(startRect.height) : 24;
                                        const docEl = document.documentElement;
                                        const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                        const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                        let iniciouArraste = false;
                                        let finalizadoArraste = false;
                                        let ultimoCentroX = startLeft + (largPill / 2);
                                        let ultimoCentroY = startTop + (altPill / 2);

                                        const onMove = (mev) => {
                                            const dx = mev.clientX - startX;
                                            const dy = mev.clientY - startY;
                                            if (!iniciouArraste && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                                                iniciouArraste = true;
                                                host.__jusgovArrastando = true;
                                                host.__jusgovRetornoRect = null;
                                                if (typeof host.__jusgovPararPatrulhaBorda === 'function') host.__jusgovPararPatrulhaBorda();
                                                pill.style.cursor = 'grabbing';
                                                microIconeBox.style.cursor = 'grabbing';
                                                host.style.setProperty('transition', 'none', 'important');
                                                host.style.setProperty('bottom', 'auto', 'important');
                                                host.style.setProperty('right', 'auto', 'important');
                                                host.style.setProperty('transform', 'none', 'important');
                                                if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                                    host.__jusgovAtualizarModoVisual();
                                                }
                                                try {
                                                    if (typeof elArraste.setPointerCapture === 'function') elArraste.setPointerCapture(pointerId);
                                                } catch (_) { }
                                            }
                                            if (!iniciouArraste) return;
                                            const elVisivel = (microIconeBox.style.display !== 'none') ? microIconeBox : pill;
                                            const rVis = elVisivel.getBoundingClientRect();
                                            const curW = (rVis && rVis.width > 8) ? Math.ceil(rVis.width) : largPill;
                                            const curH = (rVis && rVis.height > 8) ? Math.ceil(rVis.height) : altPill;
                                            const curMaxLeft = Math.max(0, wTela - curW);
                                            const curMaxTop = Math.max(0, hTela - curH);
                                            const novoLeft = Math.max(0, Math.min(curMaxLeft, Math.round(mev.clientX - (curW / 2))));
                                            const novoTop = Math.max(0, Math.min(curMaxTop, Math.round(mev.clientY - (curH / 2))));
                                            host.style.setProperty('left', `${novoLeft}px`, 'important');
                                            host.style.setProperty('top', `${novoTop}px`, 'important');
                                            aplicarBordaArcoIrisAleatoria(performance.now(), 'arraste');
                                            ultimoCentroX = novoLeft + (curW / 2);
                                            ultimoCentroY = novoTop + (curH / 2);
                                        };
                                        const finalizarArraste = (uev) => {
                                            if (finalizadoArraste) return;
                                            finalizadoArraste = true;
                                            elArraste.removeEventListener('pointermove', onMove);
                                            elArraste.removeEventListener('pointerup', finalizarArraste);
                                            elArraste.removeEventListener('pointercancel', finalizarArraste);
                                            document.removeEventListener('mousemove', onMove, true);
                                            document.removeEventListener('mouseup', finalizarArraste, true);
                                            window.removeEventListener('blur', finalizarArraste);
                                            try {
                                                if (typeof elArraste.releasePointerCapture === 'function' && elArraste.hasPointerCapture(pointerId)) {
                                                    elArraste.releasePointerCapture(pointerId);
                                                }
                                            } catch (_) { }
                                            if (!iniciouArraste) {
                                                if (uev && (uev.type === 'pointerup' || uev.type === 'mouseup')) {
                                                    alternarModoPorCliqueUnico();
                                                }
                                                return;
                                            }
                                            const agoraDrop = Date.now();
                                            host.__jusgovArrastando = false;
                                            host.__jusgovCooldownEsquiva = agoraDrop + 2500;
                                            host.__jusgovHoverInicioTs = agoraDrop;
                                            pill.style.cursor = 'grab';
                                            microIconeBox.style.cursor = 'grab';
                                            host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                            const rx = Math.max(0, Math.min(1, ultimoCentroX / wTela));
                                            const ry = Math.max(0, Math.min(1, ultimoCentroY / hTela));
                                            const posVertFinal = (ry < 0.5) ? 'superior' : 'inferior';
                                            const alinhFinal = (rx < 0.33) ? 'esquerda' : (rx > 0.66 ? 'direita' : 'centro');
                                            if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                                host.__jusgovAtualizarRelogio();
                                            }
                                            aplicarPosicao(host, posVertFinal, alinhFinal);
                                            restaurarBordaSemaforo();
                                            host.__jusgovPatrulhaPos = null;
                                            const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                            estAtual.posicaoVertical = posVertFinal;
                                            estAtual.alinhamento = alinhFinal;
                                            estAtual.posicaoVerticalAncorada = posVertFinal;
                                            estAtual.alinhamentoAncorado = alinhFinal;
                                            enviarEstadoGlobal({
                                                posicaoVertical: posVertFinal,
                                                alinhamento: alinhFinal,
                                                topPx: (posVertFinal === 'inferior') ? 99999 : 0,
                                                ancorar: true
                                            });
                                        };
                                        elArraste.addEventListener('pointermove', onMove);
                                        elArraste.addEventListener('pointerup', finalizarArraste);
                                        elArraste.addEventListener('pointercancel', finalizarArraste);
                                        document.addEventListener('mousemove', onMove, true);
                                        document.addEventListener('mouseup', finalizarArraste, true);
                                        window.addEventListener('blur', finalizarArraste);
                                    });
                                };
                                configurarArrasteElemento(pill);
                                configurarArrasteElemento(microIconeBox);

                                /* Esquiva automática lateral desabilitada: interação via hover e arraste manual */

                                const ativarHoverExpandido = (forcarPeloUsuario = false) => {
                                    const emMovimentoAuto = Boolean(host.__jusgovScreensaverAtivo || host.__jusgovPatrulhaAtiva);
                                    const cursorMoveuRecentemente = (Date.now() - Number(host.__jusgovCursorMoveuRealTs || 0)) <= 220;
                                    if (!forcarPeloUsuario && emMovimentoAuto && !cursorMoveuRecentemente) {
                                        /* Se o mouse estava parado e o minipopup/bolinha passou por baixo dele, ignora para não travar/abrir o movimento (BUG-106 / BUG-110) */
                                        return;
                                    }
                                    if (host.__jusgovHoverTimerSaida) {
                                        clearTimeout(host.__jusgovHoverTimerSaida);
                                        host.__jusgovHoverTimerSaida = 0;
                                    }
                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                    }
                                    const estHover = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const rMicroAntes = microIconeBox.getBoundingClientRect();
                                    const estavaEmMicroVisivel = Boolean(
                                        !host.__jusgovHoverPill &&
                                        microIconeBox.style.display !== 'none' &&
                                        rMicroAntes && rMicroAntes.width > 4
                                    );
                                    const cursorAtual = host.__jusgovUltimoCursor;
                                    const anchorX = (cursorAtual && cursorAtual.x > -9000)
                                        ? cursorAtual.x
                                        : ((rMicroAntes && rMicroAntes.width > 4) ? (rMicroAntes.left + rMicroAntes.width / 2) : 0);
                                    const anchorY = (rMicroAntes && rMicroAntes.height > 4)
                                        ? (rMicroAntes.top + rMicroAntes.height / 2)
                                        : ((cursorAtual && cursorAtual.y > -9000) ? cursorAtual.y : 0);

                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        const dHoverPat = host.__jusgovDados || dadosResumo;
                                        const estavaEmPatrulhaHover = Boolean(
                                            dHoverPat && dHoverPat.descansoPulado &&
                                            (host.__jusgovPatrulhaAtiva || host.__jusgovPatrulhaPos)
                                        );
                                        host.__jusgovPreviewPatrulhaSemBotoes = estavaEmPatrulhaHover;
                                        if (host.__jusgovHoverMax10sTimer) clearTimeout(host.__jusgovHoverMax10sTimer);
                                        if (estavaEmMicroVisivel || estavaEmPatrulhaHover) {
                                            host.__jusgovHoverMax10sTimer = setTimeout(() => {
                                                host.__jusgovHoverMax10sTimer = 0;
                                                if (host.__jusgovHoverPill) {
                                                    host.__jusgovSuprimirHoverMicroAteTs = Date.now() + 2500;
                                                    host.__jusgovHoverPill = false;
                                                    host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                    if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                }
                                            }, 10000);
                                            requestAnimationFrame(() => {
                                                if (host && host.isConnected && host.__jusgovHoverPill && typeof host.__jusgovAtualizarPosicaoEfetiva === 'function') {
                                                    host.__jusgovAtualizarPosicaoEfetiva(Date.now());
                                                }
                                            });
                                        }
                                        if (host.__jusgovHoverAcoesTimer) clearTimeout(host.__jusgovHoverAcoesTimer);
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (estavaEmPatrulhaHover) {
                                            host.__jusgovPatrulhaHoverTimer = setTimeout(() => {
                                                host.__jusgovPatrulhaHoverTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovPreviewPatrulhaSemBotoes) return;
                                                host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                host.__jusgovHoverPill = false;
                                                host.__jusgovHoverInicioTs = 0;
                                                host.__jusgovDeslocadoHoverMicro = false;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                if (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                                    host.style.setProperty('transition', 'none', 'important');
                                                    host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                                    host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                                }
                                                if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') host.__jusgovIniciarPatrulhaBorda();
                                            }, 10000);
                                        } else {
                                            host.__jusgovHoverAcoesTimer = setTimeout(() => {
                                                host.__jusgovHoverAcoesTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovHoverPill) return;
                                                host.__jusgovHoverAcoesDesbloqueadas = true;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                            }, 2200);
                                        }
                                    }
                                    host.__jusgovHoverPill = true;
                                    if (typeof host.__jusgovPararPatrulhaBorda === 'function') {
                                        host.__jusgovPararPatrulhaBorda();
                                    }
                                    if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                        host.__jusgovAtualizarRelogio();
                                    } else if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                        host.__jusgovAtualizarBadgeStatus();
                                    }
                                    if ((estHover.minimizadoMicro || estavaEmMicroVisivel) && pill.style.display !== 'none') {
                                        const docEl = document.documentElement;
                                        const wT = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                        const rNow = pill.getBoundingClientRect();
                                        if (rNow && rNow.width > 16) {
                                            const pillW = Math.ceil(rNow.width);
                                            const pillH = Math.ceil(rNow.height);
                                            const curLeft = parseFloat(host.style.left);
                                            const curTop = parseFloat(host.style.top);
                                            const leftIdeal = estavaEmMicroVisivel
                                                ? Math.round(anchorX - (pillW / 2))
                                                : (Number.isFinite(curLeft) ? curLeft : 0);
                                            const topIdeal = estavaEmMicroVisivel
                                                ? Math.round(anchorY - (pillH / 2))
                                                : (Number.isFinite(curTop) ? curTop : 0);
                                            const clampedLeft = Math.max(0, Math.min(Math.max(0, wT - pillW), leftIdeal));
                                            const clampedTop = Math.max(0, Math.min(Math.max(0, hT - pillH), topIdeal));
                                            host.__jusgovDeslocadoHoverMicro = true;
                                            host.style.setProperty('left', `${Math.round(clampedLeft)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(clampedTop)}px`, 'important');
                                        }
                                    }
                                };
                                const agendarSaidaHover = (evSaida) => {
                                    if (host.__jusgovHoverTimerSaida) clearTimeout(host.__jusgovHoverTimerSaida);
                                    const executarSaida = () => {
                                        host.__jusgovHoverTimerSaida = 0;
                                        if (pill.matches(':hover') || microIconeBox.matches(':hover') || boxBannerOculto.matches(':hover')) {
                                            return;
                                        }
                                        const eraPreviewPatrulha = Boolean(host.__jusgovPreviewPatrulhaSemBotoes);
                                        host.__jusgovHoverPill = false;
                                        host.__jusgovHoverInicioTs = 0;
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        host.__jusgovPreviewPatrulhaSemBotoes = false;
                                        if (host.__jusgovHoverAcoesTimer) {
                                            clearTimeout(host.__jusgovHoverAcoesTimer);
                                            host.__jusgovHoverAcoesTimer = 0;
                                        }
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (typeof host.__jusgovAtualizarBannerOculto === 'function' && host.__jusgovModoOculto) {
                                            host.__jusgovAtualizarBannerOculto();
                                        }
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                            host.__jusgovAtualizarRelogio();
                                        } else if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                            host.__jusgovAtualizarModoVisual();
                                        } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                            host.__jusgovAtualizarBadgeStatus();
                                        }
                                        if (eraPreviewPatrulha && host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                            host.__jusgovDeslocadoHoverMicro = false;
                                            host.style.setProperty('transition', 'none', 'important');
                                            host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                            if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') {
                                                host.__jusgovIniciarPatrulhaBorda();
                                            }
                                            return;
                                        }
                                        if (typeof host.__jusgovAtualizarPosicaoEfetiva === 'function') {
                                            host.__jusgovAtualizarPosicaoEfetiva(Date.now());
                                        }
                                    };
                                    if (evSaida && evSaida.isTrusted === false) {
                                        executarSaida();
                                        return;
                                    }
                                    host.__jusgovHoverTimerSaida = setTimeout(executarSaida, 160);
                                };
                                pill.addEventListener('mouseenter', () => ativarHoverExpandido(false));
                                pill.addEventListener('pointerdown', () => {
                                    host.__jusgovCursorMoveuRealTs = Date.now();
                                    ativarHoverExpandido(true);
                                }, { passive: true });
                                pill.addEventListener('mouseleave', agendarSaidaHover);
                                microIconeBox.addEventListener('mouseenter', () => {
                                    const agoraEnt = Date.now();
                                    if (host.__jusgovAguardandoSairPosMin && agoraEnt < Number(host.__jusgovSuprimirHoverMicroAteTs || 0)) {
                                        return;
                                    }
                                    if (agoraEnt < Number(host.__jusgovSuprimirHoverMicroAteTs || 0)) return;
                                    host.__jusgovAguardandoSairPosMin = false;
                                    ativarHoverExpandido(false);
                                });
                                microIconeBox.addEventListener('pointerdown', () => {
                                    host.__jusgovCursorMoveuRealTs = Date.now();
                                    ativarHoverExpandido(true);
                                }, { passive: true });
                                microIconeBox.addEventListener('mouseleave', agendarSaidaHover);

                                const pararScreensaver = () => {
                                    const estavaAtivo = Boolean(host.__jusgovScreensaverAtivo);
                                    if (estavaAtivo) {
                                        const rectFim = pill.getBoundingClientRect();
                                        if (rectFim && rectFim.width > 20 && rectFim.height > 10 && Number.isFinite(rectFim.left) && Number.isFinite(rectFim.top)) {
                                            const prev = host.__jusgovScreensaverPos || {};
                                            host.__jusgovScreensaverPos = {
                                                x: rectFim.left,
                                                y: rectFim.top,
                                                angAtual: Number.isFinite(prev.angAtual) ? prev.angAtual : undefined,
                                                tipoTraj: prev.tipoTraj,
                                                curvaSign: prev.curvaSign
                                            };
                                        }
                                    }
                                    host.__jusgovScreensaverAtivo = false;
                                    if (host.__jusgovScreensaverRaf) {
                                        cancelAnimationFrame(host.__jusgovScreensaverRaf);
                                        host.__jusgovScreensaverRaf = 0;
                                    }
                                    restaurarBordaSemaforo();
                                    host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                };
                                host.__jusgovPararScreensaver = pararScreensaver;

                                const iniciarScreensaver = () => {
                                    if (document.hidden || host.__jusgovArrastando) {
                                        pararScreensaver();
                                        return;
                                    }
                                    if (host.__jusgovScreensaverAtivo && host.__jusgovScreensaverRaf) return;
                                    host.__jusgovScreensaverAtivo = true;
                                    host.style.setProperty('transition', 'none', 'important');
                                    host.style.setProperty('bottom', 'auto', 'important');
                                    host.style.setProperty('right', 'auto', 'important');
                                    host.style.setProperty('transform', 'none', 'important');

                                    const docEl = document.documentElement;
                                    const wInit = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                    const hInit = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                    const rectIni = pill.getBoundingClientRect();
                                    const pillWIni = (rectIni && rectIni.width > 20) ? Math.ceil(rectIni.width) : 140;
                                    const pillHIni = (rectIni && rectIni.height > 10) ? Math.ceil(rectIni.height) : 34;
                                    const maxXInit = Math.max(0, wInit - pillWIni);
                                    const maxYInit = Math.max(0, hInit - pillHIni);

                                    const posSalva = host.__jusgovScreensaverPos;
                                    const centerTargetX = Math.max(0, Math.min(maxXInit, Math.round((wInit - pillWIni) / 2)));
                                    const centerTargetY = Math.max(0, Math.min(maxYInit, Math.round((hInit - pillHIni) / 2)));
                                    const temRectAtualValido = Boolean(
                                        rectIni && rectIni.width > 20 && rectIni.height > 10 &&
                                        Number.isFinite(rectIni.left) && Number.isFinite(rectIni.top) &&
                                        (posSalva || host.style.left || host.style.top)
                                    );
                                    let sx = centerTargetX;
                                    let sy = centerTargetY;
                                    if (temRectAtualValido) {
                                        sx = Math.max(0, Math.min(maxXInit, rectIni.left));
                                        sy = Math.max(0, Math.min(maxYInit, rectIni.top));
                                    } else if (posSalva && Number.isFinite(posSalva.x) && Number.isFinite(posSalva.y)) {
                                        sx = Math.max(0, Math.min(maxXInit, posSalva.x));
                                        sy = Math.max(0, Math.min(maxYInit, posSalva.y));
                                    }
                                    /* Quando sai do topo-centro rumo ao início do descanso no centro sem posição prévia, desliza rápido/fluido até o centro */
                                    let glideCentroAtivo = Boolean(!posSalva && (Math.abs(sx - centerTargetX) > 8 || Math.abs(sy - centerTargetY) > 8));
                                    const glideStartX = sx;
                                    const glideStartY = sy;
                                    const glideIniTs = performance.now();
                                    const glideDurMs = 300;

                                    const tiposTraj = ['reta', 'curva_aberta', 'exponencial', 'fibonacci'];
                                    const angDegBases = [32, 52, 128, 148, 212, 232, 308, 328];
                                    let angAtual = (posSalva && Number.isFinite(posSalva.angAtual))
                                        ? posSalva.angAtual
                                        : ((angDegBases[Math.floor(Math.random() * angDegBases.length)] + (Math.random() * 14 - 7)) * (Math.PI / 180));
                                    /* Garante vetor saindo de eventual borda onde o minipopup esteja encostado */
                                    {
                                        let vxIni = Math.cos(angAtual);
                                        let vyIni = Math.sin(angAtual);
                                        if (sx <= 2 && vxIni <= 0.15) vxIni = Math.abs(vxIni) + 0.35;
                                        if (sx >= maxXInit - 2 && vxIni >= -0.15) vxIni = -(Math.abs(vxIni) + 0.35);
                                        if (sy <= 2 && vyIni <= 0.15) vyIni = Math.abs(vyIni) + 0.35;
                                        if (sy >= maxYInit - 2 && vyIni >= -0.15) vyIni = -(Math.abs(vyIni) + 0.35);
                                        angAtual = Math.atan2(vyIni, vxIni);
                                    }

                                    let velAtual = 0;
                                    let velAlvo = 82;
                                    let tipoTraj = (posSalva && posSalva.tipoTraj) ? posSalva.tipoTraj : tiposTraj[Math.floor(Math.random() * tiposTraj.length)];
                                    let curvaSign = (posSalva && (posSalva.curvaSign === 1 || posSalva.curvaSign === -1)) ? posSalva.curvaSign : (Math.random() < 0.5 ? 1 : -1);
                                    let tNoTrecho = 0;
                                    let batidasAteMudanca = 2 + Math.floor(Math.random() * 3);
                                    let proxMudancaVelTs = performance.now() + 2800 + Math.random() * 2500;
                                    let proxBalancoTs = performance.now() + 7500 + Math.random() * 6500;
                                    let balancoAteTs = 0;
                                    let esbarroAteTs = 0;
                                    let esbarroDir = { x: 0, y: 0 };
                                    let pausadoPorHover = Boolean(host.__jusgovHoverPill);
                                    let retomadaSuaveAteTs = performance.now() + 3600;
                                    let ultimoTs = performance.now();

                                    host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                    host.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: Math.round(sy) };

                                    const passo = (tsNow) => {
                                        if (!host.__jusgovScreensaverAtivo || !host.isConnected || document.hidden || host.__jusgovArrastando) {
                                            pararScreensaver();
                                            return;
                                        }
                                        const dt = Math.min(0.05, Math.max(0.004, (tsNow - ultimoTs) / 1000));
                                        ultimoTs = tsNow;
                                        if (host.__jusgovHoverPill) {
                                            if (!pill.matches(':hover') && !microIconeBox.matches(':hover') && !boxBannerOculto.matches(':hover')) {
                                                host.__jusgovHoverPill = false;
                                            } else {
                                                pausadoPorHover = true;
                                                velAtual = 0;
                                                restaurarBordaSemaforo();
                                                host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                                host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                                return;
                                            }
                                        }
                                        if (pausadoPorHover) {
                                            pausadoPorHover = false;
                                            velAtual = 0;
                                            retomadaSuaveAteTs = tsNow + 3600;
                                            esbarroAteTs = 0;
                                            balancoAteTs = 0;
                                            proxMudancaVelTs = Math.max(proxMudancaVelTs, tsNow + 3000);
                                            proxBalancoTs = Math.max(proxBalancoTs, tsNow + 7000);
                                            const dRet = document.documentElement;
                                            const wRet = Math.max(320, (dRet && dRet.clientWidth) || window.innerWidth || 1280);
                                            const hRet = Math.max(200, (dRet && dRet.clientHeight) || window.innerHeight || 720);
                                            const rRet = pill.getBoundingClientRect();
                                            if (rRet && rRet.width > 20 && rRet.height > 10 && Number.isFinite(rRet.left) && Number.isFinite(rRet.top)) {
                                                sx = Math.max(0, Math.min(Math.max(0, wRet - Math.ceil(rRet.width)), rRet.left));
                                                sy = Math.max(0, Math.min(Math.max(0, hRet - Math.ceil(rRet.height)), rRet.top));
                                            }
                                        }

                                        const dEl = document.documentElement;
                                        const wT = Math.max(320, (dEl && dEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (dEl && dEl.clientHeight) || window.innerHeight || 720);
                                        const rP = pill.getBoundingClientRect();
                                        const pW = (rP && rP.width > 20) ? Math.ceil(rP.width) : pillWIni;
                                        const pH = (rP && rP.height > 10) ? Math.ceil(rP.height) : pillHIni;
                                        const maxX = Math.max(0, wT - pW);
                                        const maxY = Math.max(0, hT - pH);

                                        if (glideCentroAtivo) {
                                            const progG = Math.min(1, Math.max(0, (tsNow - glideIniTs) / glideDurMs));
                                            const easeG = 1 - Math.pow(1 - progG, 3);
                                            const cxG = Math.max(0, Math.min(maxX, Math.round((wT - pW) / 2)));
                                            const cyG = Math.max(0, Math.min(maxY, Math.round((hT - pH) / 2)));
                                            sx = glideStartX + (cxG - glideStartX) * easeG;
                                            sy = glideStartY + (cyG - glideStartY) * easeG;
                                            host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                            host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                            if (progG >= 1) {
                                                glideCentroAtivo = false;
                                                retomadaSuaveAteTs = tsNow + 2400;
                                            }
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (esbarroAteTs > tsNow) {
                                            const faseTremor = Math.sin(tsNow * 0.045) * 3;
                                            const jx = Math.max(0, Math.min(maxX, Math.round(sx + esbarroDir.x * faseTremor)));
                                            const jy = Math.max(0, Math.min(maxY, Math.round(sy + esbarroDir.y * faseTremor)));
                                            host.style.setProperty('left', `${jx}px`, 'important');
                                            host.style.setProperty('top', `${jy}px`, 'important');
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (balancoAteTs > tsNow) {
                                            const wob = Math.sin(tsNow * 0.025) * 6;
                                            const bx = Math.max(0, Math.min(maxX, Math.round(sx + wob)));
                                            const by = Math.max(0, Math.min(maxY, Math.round(sy + Math.cos(tsNow * 0.025) * 4)));
                                            host.style.setProperty('left', `${bx}px`, 'important');
                                            host.style.setProperty('top', `${by}px`, 'important');
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (tsNow >= proxMudancaVelTs) {
                                            velAlvo = 52 + Math.random() * 68;
                                            proxMudancaVelTs = tsNow + 2200 + Math.random() * 3200;
                                        }
                                        if (tsNow >= proxBalancoTs) {
                                            balancoAteTs = tsNow + 550 + Math.random() * 350;
                                            proxBalancoTs = tsNow + 7000 + Math.random() * 7000;
                                            angAtual += (Math.PI * 0.55) + (Math.random() * Math.PI * 0.9);
                                            velAlvo = 62 + Math.random() * 54;
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        tNoTrecho += dt;
                                        const emRetomadaSuave = (tsNow < retomadaSuaveAteTs);
                                        const taxaAcel = emRetomadaSuave ? 0.55 : 2.0;
                                        velAtual += (velAlvo - velAtual) * Math.min(1, dt * taxaAcel);

                                        if (tipoTraj === 'curva_aberta') {
                                            angAtual += curvaSign * 0.26 * dt;
                                        } else if (tipoTraj === 'exponencial') {
                                            const fatorExp = Math.min(1.5, Math.exp(tNoTrecho * 0.22) * 0.24);
                                            angAtual += curvaSign * fatorExp * dt;
                                        } else if (tipoTraj === 'fibonacci') {
                                            const phi = 1.6180339;
                                            angAtual += curvaSign * (0.22 + 0.12 * Math.sin(tNoTrecho * phi)) * dt;
                                            if (!emRetomadaSuave) {
                                                velAtual = Math.max(48, Math.min(125, velAtual + Math.cos(tNoTrecho / phi) * 10 * dt));
                                            }
                                        }

                                        let vx = Math.cos(angAtual) * velAtual;
                                        let vy = Math.sin(angAtual) * velAtual;
                                        sx += vx * dt;
                                        sy += vy * dt;

                                        const bateuEsq = (sx <= 0 && vx < 0);
                                        const bateuDir = (sx >= maxX && vx > 0);
                                        const bateuTopo = (sy <= 0 && vy < 0);
                                        const bateuBase = (sy >= maxY && vy > 0);

                                        if (sx < 0) sx = 0;
                                        else if (sx > maxX) sx = maxX;
                                        if (sy < 0) sy = 0;
                                        else if (sy > maxY) sy = maxY;

                                        if (bateuEsq || bateuDir || bateuTopo || bateuBase) {
                                            tNoTrecho = 0;
                                            if (bateuEsq || bateuDir) vx = -vx;
                                            if (bateuTopo || bateuBase) vy = -vy;
                                            angAtual = Math.atan2(vy, vx);

                                            batidasAteMudanca -= 1;
                                            if ((bateuEsq || bateuDir) && (bateuTopo || bateuBase) && Math.random() < 0.45) {
                                                esbarroAteTs = tsNow + 240 + Math.random() * 220;
                                                esbarroDir = { x: bateuEsq ? 1 : -1, y: bateuTopo ? 1 : -1 };
                                            } else if (Math.random() < 0.14) {
                                                esbarroAteTs = tsNow + 200 + Math.random() * 180;
                                                esbarroDir = { x: bateuEsq ? 1 : (bateuDir ? -1 : 0), y: bateuTopo ? 1 : (bateuBase ? -1 : 0) };
                                            }

                                            if (batidasAteMudanca <= 0) {
                                                batidasAteMudanca = 2 + Math.floor(Math.random() * 4);
                                                tipoTraj = tiposTraj[Math.floor(Math.random() * tiposTraj.length)];
                                                curvaSign = Math.random() < 0.5 ? 1 : -1;
                                                const jitterAng = (Math.random() * 0.9) - 0.45;
                                                angAtual += jitterAng;
                                                /* Garante vetor saindo para dentro da viewport para nunca grudar na borda */
                                                let nvx = Math.cos(angAtual);
                                                let nvy = Math.sin(angAtual);
                                                if (sx <= 1) nvx = Math.abs(nvx) + 0.25;
                                                if (sx >= maxX - 1) nvx = -(Math.abs(nvx) + 0.25);
                                                if (sy <= 1) nvy = Math.abs(nvy) + 0.25;
                                                if (sy >= maxY - 1) nvy = -(Math.abs(nvy) + 0.25);
                                                angAtual = Math.atan2(nvy, nvx);
                                                velAlvo = 60 + Math.random() * 58;
                                                if (typeof host.__jusgovRotacionarPropaganda === 'function') {
                                                    host.__jusgovRotacionarPropaganda(true);
                                                }
                                            } else {
                                                angAtual += (Math.random() * 0.26) - 0.13;
                                            }
                                        }

                                        host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                        host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                        host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                        aplicarBordaArcoIrisAleatoria(tsNow, 'descanso');
                                        host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                    };
                                    host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                    host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                    host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                };
                                host.__jusgovIniciarScreensaver = iniciarScreensaver;

                                const tiposPatrulhaBemEstar = ['agua', 'copo_agua', 'cafe', 'vitamina', 'esticar', 'olhos', 'respirar', 'caminhar', 'sem_celular', 'sem_tela', 'sem_tarefa', 'sem_redes', 'sem_notificacoes', 'sem_email'];
                                const coresIconeBemEstar = ['#38bdf8', '#0ea5e9', '#f59e0b', '#34d399', '#10b981', '#60a5fa', '#4ade80', '#a78bfa', '#f87171', '#ef4444', '#fb923c', '#f43f5e', '#fbbf24', '#e11d48'];
                                const atualizarVisualMicroIcone = (dMicro, emPatrulha = false) => {
                                    microIconeBox.style.background = '#0f172a';
                                    const corBordaAtual = resolverCorBordaSemaforo(dMicro);
                                    if (!host.__jusgovPatrulhaAtiva && !host.__jusgovArrastando) {
                                        microIconeBox.style.borderColor = corBordaAtual;
                                        microIconeBox.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    }
                                    if (dMicro && (dMicro.descansoPulado || dMicro.descansoPendente)) {
                                        const idxP = Math.abs(Math.floor(Number(host.__jusgovPatrulhaIconeIdx || 0))) % tiposPatrulhaBemEstar.length;
                                        const tipoIco = tiposPatrulhaBemEstar[idxP];
                                        const corSvg = coresIconeBemEstar[idxP];
                                        const svgIco = criarIconeSvgBemEstar(tipoIco, corSvg, 12);
                                        if (emPatrulha) svgIco.classList.add('jg-piscar');
                                        microIconeBox.replaceChildren(svgIco);
                                    } else {
                                        const corRaio = (corBordaAtual === '#64748b')
                                            ? '#94a3b8'
                                            : ((corBordaAtual === '#dc2626')
                                                ? '#f87171'
                                                : ((corBordaAtual === '#eab308') ? '#facc15' : '#10b981'));
                                        microIconeBox.replaceChildren(criarIconeAppMicro(12, corRaio));
                                    }
                                };
                                host.__jusgovAtualizarVisualMicroIcone = atualizarVisualMicroIcone;

                                const pararPatrulhaBorda = () => {
                                    host.__jusgovPatrulhaAtiva = false;
                                    if (host.__jusgovPatrulhaRaf) {
                                        cancelAnimationFrame(host.__jusgovPatrulhaRaf);
                                        host.__jusgovPatrulhaRaf = 0;
                                    }
                                    restaurarBordaSemaforo();
                                    host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                };
                                host.__jusgovPararPatrulhaBorda = pararPatrulhaBorda;

                                const iniciarPatrulhaBorda = () => {
                                    if (document.hidden || host.__jusgovArrastando || host.__jusgovHoverPill) {
                                        pararPatrulhaBorda();
                                        return;
                                    }
                                    if (host.__jusgovPatrulhaAtiva && host.__jusgovPatrulhaRaf) return;
                                    host.__jusgovPatrulhaAtiva = true;
                                    host.style.setProperty('transition', 'none', 'important');
                                    host.style.setProperty('bottom', 'auto', 'important');
                                    host.style.setProperty('right', 'auto', 'important');
                                    host.style.setProperty('transform', 'none', 'important');

                                    const docEl = document.documentElement;
                                    const wInit = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                    const hInit = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                    const rIni = microIconeBox.getBoundingClientRect();
                                    const iW = (rIni && rIni.width > 8) ? Math.ceil(rIni.width) : 24;
                                    const iH = (rIni && rIni.height > 8) ? Math.ceil(rIni.height) : 24;
                                    const maxXi = Math.max(1, wInit - iW);
                                    const maxYi = Math.max(1, hInit - iH);
                                    const perimIni = 2 * (maxXi + maxYi);

                                    let dist = (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.dist))
                                        ? host.__jusgovPatrulhaPos.dist
                                        : (() => {
                                            const cx = (rIni && Number.isFinite(rIni.left)) ? Math.max(0, Math.min(maxXi, rIni.left)) : 0;
                                            const cy = (rIni && Number.isFinite(rIni.top)) ? Math.max(0, Math.min(maxYi, rIni.top)) : 0;
                                            if (cy <= 4) return cx;
                                            if (cx >= maxXi - 4) return maxXi + cy;
                                            if (cy >= maxYi - 4) return maxXi + maxYi + (maxXi - cx);
                                            return (2 * maxXi) + maxYi + (maxYi - cy);
                                        })();
                                    let ultTs = performance.now();
                                    let proxTrocaIcoTs = ultTs + 9500;
                                    if (host.__jusgovPatrulhaDir !== 1 && host.__jusgovPatrulhaDir !== -1) {
                                        host.__jusgovPatrulhaDir = Math.random() < 0.5 ? 1 : -1;
                                    }
                                    if (!Number.isFinite(host.__jusgovPatrulhaProxInversaoTs) || host.__jusgovPatrulhaProxInversaoTs <= ultTs) {
                                        host.__jusgovPatrulhaProxInversaoTs = ultTs + 125000 + Math.random() * 145000;
                                    }

                                    const passoPatrulha = (tsNow) => {
                                        if (!host.__jusgovPatrulhaAtiva || !host.isConnected || document.hidden || host.__jusgovArrastando || host.__jusgovHoverPill) {
                                            pararPatrulhaBorda();
                                            return;
                                        }
                                        const estCheck = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                        const dCheck = host.__jusgovDados || dadosResumo;
                                        const adiadoCheckMs = Number(estCheck.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                        const microAtivoCheck = Boolean(estCheck.minimizadoMicro || (dCheck && !dCheck.emDescanso && dCheck.descansoPulado && adiadoCheckMs > 0 && (Date.now() - adiadoCheckMs) >= 60000));
                                        if (!microAtivoCheck || !dCheck || dCheck.emDescanso || !dCheck.descansoPulado) {
                                            pararPatrulhaBorda();
                                            return;
                                        }
                                        const dt = Math.min(0.05, Math.max(0.004, (tsNow - ultTs) / 1000));
                                        ultTs = tsNow;
                                        if (tsNow >= Number(host.__jusgovPatrulhaProxInversaoTs || 0)) {
                                            host.__jusgovPatrulhaDir = -(host.__jusgovPatrulhaDir || 1);
                                            host.__jusgovPatrulhaProxInversaoTs = tsNow + 125000 + Math.random() * 145000;
                                        }
                                        if (tsNow >= proxTrocaIcoTs) {
                                            proxTrocaIcoTs = tsNow + 9500;
                                            host.__jusgovPatrulhaIconeIdx = ((Number(host.__jusgovPatrulhaIconeIdx || 0)) + 1) % tiposPatrulhaBemEstar.length;
                                            atualizarVisualMicroIcone(dCheck, true);
                                        }
                                        const dEl = document.documentElement;
                                        const wT = Math.max(320, (dEl && dEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (dEl && dEl.clientHeight) || window.innerHeight || 720);
                                        const rM = microIconeBox.getBoundingClientRect();
                                        const mW = (rM && rM.width > 8) ? Math.ceil(rM.width) : iW;
                                        const mH = (rM && rM.height > 8) ? Math.ceil(rM.height) : iH;
                                        const maxX = Math.max(1, wT - mW);
                                        const maxY = Math.max(1, hT - mH);
                                        const perim = 2 * (maxX + maxY);
                                        dist = ((dist + (host.__jusgovPatrulhaDir || 1) * 36 * dt) % perim + perim) % perim;

                                        let px = 0;
                                        let py = 0;
                                        if (dist < maxX) {
                                            px = dist;
                                            py = 0;
                                        } else if (dist < maxX + maxY) {
                                            px = maxX;
                                            py = dist - maxX;
                                        } else if (dist < (2 * maxX) + maxY) {
                                            px = maxX - (dist - maxX - maxY);
                                            py = maxY;
                                        } else {
                                            px = 0;
                                            py = maxY - (dist - (2 * maxX) - maxY);
                                        }
                                        host.__jusgovPatrulhaPos = { dist: dist % Math.max(1, perim), x: px, y: py };
                                        host.style.setProperty('left', `${Math.round(px)}px`, 'important');
                                        host.style.setProperty('top', `${Math.round(py)}px`, 'important');
                                        aplicarBordaArcoIrisAleatoria(tsNow, 'patrulha');
                                        host.__jusgovPatrulhaRaf = requestAnimationFrame(passoPatrulha);
                                    };
                                    host.__jusgovPatrulhaRaf = requestAnimationFrame(passoPatrulha);
                                };
                                host.__jusgovIniciarPatrulhaBorda = iniciarPatrulhaBorda;

                                const verificarAlarmePomodoroLocal = (
                                    ciclosFeitos,
                                    ciclosTotais,
                                    tempoDescansoSegundos,
                                    tempoDecorridosFase,
                                    faseAtual
                                ) => {
                                    if (!ciclosTotais || ciclosTotais <= 0) return null;
                                    const ehDescansoMuitoCurto = (Number(tempoDescansoSegundos) > 0 && Number(tempoDescansoSegundos) < 300);
                                    const xPorcentagem = Math.min(100, Math.max(0, (ciclosFeitos / ciclosTotais) * 100));
                                    const fatorY = (1 + 19 * Math.pow(xPorcentagem / 100, 2)) / 100;
                                    if (tempoDecorridosFase <= 60) {
                                        if (ehDescansoMuitoCurto) {
                                            return (tempoDecorridosFase === 1) ? 'BEEP_CURTO' : null;
                                        }
                                        if (tempoDecorridosFase === 1) return 'BEEP_LONGO';
                                        if (tempoDecorridosFase > 0 && tempoDecorridosFase % 15 === 0) return 'BEEP_CURTO_TRIPLO';
                                        return null;
                                    }
                                    if (faseAtual === 'DESCANSO_PUNITIVO') {
                                        const baseInt = Math.max(1, Math.floor(fatorY * tempoDescansoSegundos));
                                        const intervaloDescanso = ehDescansoMuitoCurto ? Math.max(20, baseInt * 3) : baseInt;
                                        if (tempoDecorridosFase % intervaloDescanso === 0) return 'BEEP_CURTO';
                                        return null;
                                    }
                                    if (faseAtual === 'ATRASO_ABANDONO') {
                                        if (tempoDecorridosFase > 14400) return 'BLOQUEAR';
                                        if (tempoDecorridosFase > 10800) return (tempoDecorridosFase % 600 === 0) ? 'BEEP_CURTO' : null;
                                        if (tempoDecorridosFase > 7200) return (tempoDecorridosFase % 300 === 0) ? 'BEEP_CURTO' : null;
                                        const minIntAb = ehDescansoMuitoCurto ? 20 : 1;
                                        const intervaloAplicado = Math.max(minIntAb, Math.floor(Math.min(fatorY * tempoDecorridosFase, 300)));
                                        if (tempoDecorridosFase % intervaloAplicado === 0) return 'BEEP_CURTO';
                                    }
                                    return null;
                                };

                                const tocarBeepPcSpeakerLocal = (intensidade = 'suave', padraoAlarme = 'BEEP_CURTO') => {
                                    try {
                                        const AudioCtx = window.AudioContext || window.webkitAudioContext;
                                        if (!AudioCtx) return;
                                        if (!host.__jusgovAudioCtx || host.__jusgovAudioCtx.state === 'closed') {
                                            host.__jusgovAudioCtx = new AudioCtx();
                                            host.__jusgovEstaloBuf = null;
                                        }
                                        const ctx = host.__jusgovAudioCtx;
                                        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                                            ctx.resume().catch(() => { });
                                        }
                                        if (!host.__jusgovEstaloBuf) {
                                            try {
                                                const n = Math.max(32, Math.floor(ctx.sampleRate * 0.0045));
                                                const b = ctx.createBuffer(1, n, ctx.sampleRate);
                                                const d = b.getChannelData(0);
                                                for (let i = 0; i < n; i++) {
                                                    const dec = Math.exp(-i / (n * 0.28));
                                                    d[i] = ((i < 6) ? 1.0 : ((Math.random() * 2 - 1) * 0.85)) * dec;
                                                }
                                                host.__jusgovEstaloBuf = b;
                                            } catch (_) { }
                                        }
                                        const emitirEstalo = (tAt, gEst) => {
                                            if (!host.__jusgovEstaloBuf) return;
                                            try {
                                                const src = ctx.createBufferSource();
                                                src.buffer = host.__jusgovEstaloBuf;
                                                const flt = ctx.createBiquadFilter();
                                                flt.type = 'bandpass';
                                                flt.frequency.setValueAtTime(2800, tAt);
                                                flt.Q.setValueAtTime(1.1, tAt);
                                                const g = ctx.createGain();
                                                g.gain.setValueAtTime(gEst, tAt);
                                                src.connect(flt);
                                                flt.connect(g);
                                                g.connect(ctx.destination);
                                                src.start(tAt);
                                            } catch (_) { }
                                        };
                                        const emitirPulsoPcSpeaker = (tIni, freqHz, durMs, ganhoMax) => {
                                            const dur = Math.max(0.03, durMs / 1000);
                                            const osc = ctx.createOscillator();
                                            const flt = ctx.createBiquadFilter();
                                            const gain = ctx.createGain();
                                            osc.type = 'square';
                                            osc.frequency.setValueAtTime(freqHz, tIni);
                                            flt.type = 'bandpass';
                                            flt.frequency.setValueAtTime(1750, tIni);
                                            flt.Q.setValueAtTime(0.65, tIni);
                                            gain.gain.setValueAtTime(0.0001, tIni);
                                            gain.gain.linearRampToValueAtTime(ganhoMax, tIni + 0.0015);
                                            gain.gain.setValueAtTime(ganhoMax, tIni + Math.max(0.004, dur - 0.002));
                                            gain.gain.linearRampToValueAtTime(0.0001, tIni + dur);
                                            osc.connect(flt);
                                            flt.connect(gain);
                                            gain.connect(ctx.destination);
                                            emitirEstalo(tIni, Math.min(0.55, ganhoMax * 1.45));
                                            emitirEstalo(tIni + dur, Math.min(0.45, ganhoMax * 1.15));
                                            osc.start(tIni);
                                            osc.stop(tIni + dur + 0.005);
                                        };
                                        const t0 = ctx.currentTime + 0.015;
                                        const ganhoBase = intensidade === 'grave' ? 0.36 : (intensidade === 'moderado' ? 0.30 : 0.24);
                                        if (padraoAlarme === 'BEEP_LONGO') {
                                            for (let i = 0; i < 5; i++) emitirPulsoPcSpeaker(t0 + (i * 0.5), 1000, 300, ganhoBase);
                                            return;
                                        }
                                        if (padraoAlarme === 'BEEP_CURTO_TRIPLO') {
                                            for (let i = 0; i < 3; i++) emitirPulsoPcSpeaker(t0 + (i * 0.38), 1000, 220, ganhoBase);
                                            return;
                                        }
                                        if (intensidade === 'grave') {
                                            emitirPulsoPcSpeaker(t0, 1000, 300, ganhoBase);
                                            emitirPulsoPcSpeaker(t0 + 0.5, 1000, 300, ganhoBase);
                                        } else {
                                            emitirPulsoPcSpeaker(t0, 1000, 300, ganhoBase);
                                        }
                                    } catch (_) { }
                                };

                                const tocarBeepConclusao = (intensidade = 'suave', padraoAlarme = 'BEEP_CURTO') => {
                                    try {
                                        if (padraoAlarme === 'BLOQUEAR' || padraoAlarme === 'SILENCIO') return;
                                        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                                            chrome.runtime.sendMessage({
                                                acao: 'TOCAR_BEEP_POMODORO',
                                                intensidade,
                                                padraoAlarme
                                            }, (resp) => {
                                                if ((chrome.runtime && chrome.runtime.lastError) || !(resp && resp.ok)) {
                                                    tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                                }
                                            });
                                            return;
                                        }
                                        tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                    } catch (_) {
                                        tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                    }
                                };
                                host.__jusgovTocarBeep = tocarBeepConclusao;

                                host.__jusgovGarantirBackdropBlur = garantirBackdropBlur;
                                host.__jusgovRemoverBackdropBlur = removerBackdropBlur;

                                const atualizarPosicaoEfetivaPill = (agoraPos = Date.now()) => {
                                    if (host.__jusgovArrastando || host.__jusgovRetornoRect) return;
                                    if (host.__jusgovModoOculto && host.__jusgovBannerPos) {
                                        pararPatrulhaBorda();
                                        pararScreensaver();
                                        aplicarPosicao(host, host.__jusgovBannerPos.posVert, host.__jusgovBannerPos.alinh);
                                        return;
                                    }
                                    const dPos = host.__jusgovDados || dadosResumo;
                                    const estPos = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const modoEsp = obterModoPosicaoEspecial(dPos, agoraPos);
                                    if (modoEsp === 'idle_centro_tela') {
                                        pararPatrulhaBorda();
                                        host.__jusgovEstavaNoTopoAviso = false;
                                        iniciarScreensaver();
                                        return;
                                    }
                                    removerBackdropBlur();
                                    pararScreensaver();
                                    if (modoEsp === 'aviso_topo_centro' || modoEsp === 'aviso_movimento_centro_blur') {
                                        pararPatrulhaBorda();
                                        if (!dPos.descansoEmAviso && host.__jusgovScreensaverPos) {
                                            return;
                                        }
                                        host.__jusgovEstavaNoTopoAviso = true;
                                        if (!host.__jusgovPos || host.__jusgovPos.posicaoVertical !== 'superior' || host.__jusgovPos.alinhamento !== 'centro') {
                                            aplicarPosicao(host, 'superior', 'centro');
                                        }
                                        return;
                                    }
                                    host.__jusgovScreensaverPos = null;
                                    host.__jusgovEstavaNoTopoAviso = false;

                                    const estPosPausaPendente = Boolean(dPos && !dPos.emDescanso && dPos.descansoPulado);
                                    let adiadoTs = Number(estPos.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                    if (estPosPausaPendente && adiadoTs <= 0) {
                                        adiadoTs = agoraPos;
                                        host.__jusgovMinimizadoDescansoTs = adiadoTs;
                                    }
                                    const emPatrulhaAgora = Boolean(
                                        !host.__jusgovHoverPill &&
                                        estPosPausaPendente &&
                                        adiadoTs > 0 && (agoraPos - adiadoTs) >= 60000
                                    );
                                    if (emPatrulhaAgora) {
                                        host.__jusgovPos = { posicaoVertical: 'patrulha', alinhamento: 'borda', topPx: 0, leftPx: 0 };
                                        iniciarPatrulhaBorda();
                                        return;
                                    }
                                    pararPatrulhaBorda();

                                    const docElPos = document.documentElement;
                                    const wTelaPos = Math.max(320, (docElPos && docElPos.clientWidth) || window.innerWidth || 1280);
                                    const hTelaPos = Math.max(200, (docElPos && docElPos.clientHeight) || window.innerHeight || 720);
                                    const dimsPos = obterDimensoesAtuaisHost(host);
                                    const maxLeftPos = Math.max(0, wTelaPos - Math.min(wTelaPos, dimsPos.w));
                                    const maxTopPos = Math.max(0, hTelaPos - Math.min(hTelaPos, dimsPos.h));

                                    if (host.__jusgovHoverPill && (estPos.minimizadoMicro || host.__jusgovDeslocadoHoverMicro)) {
                                        const curLeftH = parseFloat(host.style.left);
                                        const curTopH = parseFloat(host.style.top);
                                        if (Number.isFinite(curLeftH) && Number.isFinite(curTopH)) {
                                            const centroRefX = Number.isFinite(host.__jusgovCentroHoverX)
                                                ? host.__jusgovCentroHoverX
                                                : (curLeftH + (dimsPos.w / 2));
                                            host.__jusgovCentroHoverX = centroRefX;
                                            const leftCentrado = Math.round(centroRefX - (dimsPos.w / 2));
                                            const clampedLH = Math.max(0, Math.min(maxLeftPos, leftCentrado));
                                            const clampedTH = Math.max(0, Math.min(maxTopPos, Math.round(curTopH)));
                                            host.style.setProperty('transition', 'none', 'important');
                                            if (clampedLH !== curLeftH) host.style.setProperty('left', `${clampedLH}px`, 'important');
                                            if (clampedTH !== curTopH) host.style.setProperty('top', `${clampedTH}px`, 'important');
                                        }
                                        return;
                                    }
                                    host.__jusgovCentroHoverX = NaN;
                                    const posVertAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.posicaoVerticalAncorada : estPos.posicaoVertical;
                                    const alinhAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.alinhamentoAncorado : estPos.alinhamento;
                                    const modoMicroKey = estPos.minimizadoMicro ? 'micro' : 'pill';
                                    const chaveTamPos = `${modoMicroKey}:${dimsPos.w}x${dimsPos.h}:${wTelaPos}x${hTelaPos}`;
                                    if (host.__jusgovDeslocadoHoverMicro || !host.__jusgovPos || host.__jusgovPos.posicaoVertical !== posVertAlvo || host.__jusgovPos.alinhamento !== alinhAlvo || host.__jusgovUltModoTam !== chaveTamPos) {
                                        host.__jusgovDeslocadoHoverMicro = false;
                                        host.__jusgovUltModoTam = chaveTamPos;
                                        aplicarPosicao(host, posVertAlvo, alinhAlvo, null, null, false);
                                    }
                                };
                                host.__jusgovAtualizarPosicaoEfetiva = atualizarPosicaoEfetivaPill;

                                const atualizarBadgeStatus = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const nivelDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    if (host.__jusgovArrastando) {
                                        spanStatus.style.display = 'none';
                                        return;
                                    }
                                    const emMovAnim = Boolean(
                                        host.__jusgovPatrulhaAtiva ||
                                        (host.__jusgovScreensaverAtivo && !host.__jusgovHoverPill)
                                    );
                                    if (!emMovAnim) {
                                        restaurarBordaSemaforo();
                                    }
                                    const metaMs = Number((d && d.metaFaseMs) || 0) > 0
                                        ? Number(d.metaFaseMs)
                                        : (Math.max(1, Number((d && d.metaFaseMin) || 1)) * 60000);
                                    const cumpridoAoVivo = Boolean(d && d.emDescanso && (d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs));

                                    spanStatus.style.opacity = '1';
                                    if (d.emDescanso && !cumpridoAoVivo && d.descansoEmAviso && d.descansoAvisoTexto) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.descansoAvisoTexto;
                                        spanStatus.style.background = '#f59e0b';
                                        spanStatus.style.color = '#111827';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (d.emDescanso && !cumpridoAoVivo && d.alertaEmprestimoTexto) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.alertaEmprestimoTexto;
                                        if (d.alertaEmprestimoCritico) {
                                            spanStatus.style.background = '#ef4444';
                                            spanStatus.style.color = '#ffffff';
                                            spanStatus.style.fontWeight = '700';
                                            const piscaOn = (Math.floor(Date.now() / 650) % 2) === 0;
                                            spanStatus.style.opacity = piscaOn ? '1' : '0.45';
                                            pill.style.borderColor = piscaOn ? '#ef4444' : '#f59e0b';
                                        } else {
                                            spanStatus.style.background = '#f59e0b';
                                            spanStatus.style.color = '#111827';
                                            spanStatus.style.fontWeight = '700';
                                            spanStatus.style.opacity = '1';
                                            pill.style.borderColor = '#f59e0b';
                                        }
                                        return;
                                    }
                                    const restaurarVisualPadraoPillRetorno = () => {
                                        if (pill.getAttribute('data-retorno-ativo') === 'true') {
                                            pill.removeAttribute('data-retorno-ativo');
                                            pill.style.background = '#0f172a';
                                            pill.style.borderWidth = '1px';
                                            pill.style.borderColor = 'rgba(148,163,184,0.35)';
                                            pill.style.padding = '1px 6px';
                                            pill.style.animation = 'none';
                                            pill.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                        } else if (!d || !d.emDescanso || !d.alertaEmprestimoTexto) {
                                            pill.style.borderColor = 'rgba(148,163,184,0.35)';
                                        }
                                    };

                                    if (d.emDescanso && cumpridoAoVivo) {
                                        pill.setAttribute('data-retorno-ativo', 'true');
                                        pill.style.background = '#065f46';
                                        pill.style.borderWidth = '3px';
                                        pill.style.borderColor = '#4ade80';
                                        pill.style.padding = '4px 12px';
                                        pill.style.animation = 'jusgov-pill-retorno 1.2s ease-in-out infinite';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = '✅ VOLTAR AO TRABALHO!';
                                        spanStatus.style.background = '#4ade80';
                                        spanStatus.style.color = '#052e16';
                                        spanStatus.style.fontWeight = '800';
                                        return;
                                    }
                                    restaurarVisualPadraoPillRetorno();
                                    if (d.emDescanso && !d.aguardandoOciosidade) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Em andamento...';
                                        spanStatus.style.background = 'rgba(2, 132, 199, 0.2)';
                                        spanStatus.style.color = '#bae6fd';
                                        spanStatus.style.fontWeight = '600';
                                        return;
                                    }
                                    if (d.descansoPendente || (d.emDescanso && d.aguardandoOciosidade)) {
                                        const ehPausaMaiorPend = (d.tipoDescansoPendente === 'pausa_maior' || d.faseAtual === 'pausa_maior' || d.proximaFase === 'pausa_maior');
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = ehPausaMaiorPend ? 'Descanso Pendente' : 'Alívio Pendente';
                                        spanStatus.style.background = '#dc2626';
                                        spanStatus.style.color = '#ffffff';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (host.__jusgovAlertaAutoDetectAteTs && Date.now() < host.__jusgovAlertaAutoDetectAteTs && host.__jusgovAlertaAutoDetectTexto) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = host.__jusgovAlertaAutoDetectTexto;
                                        spanStatus.style.background = '#eab308';
                                        spanStatus.style.color = '#111827';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (nivelDet === 2 || (nivelDet === 1 && host.__jusgovHoverPill)) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.ultimoDescansoTexto || 'Sem descansos anteriores';
                                        spanStatus.style.background = 'transparent';
                                        spanStatus.style.color = '#cbd5e1';
                                        spanStatus.style.fontWeight = '500';
                                        return;
                                    }
                                    spanStatus.style.display = 'none';
                                    spanStatus.textContent = '';
                                };
                                host.__jusgovAtualizarBadgeStatus = atualizarBadgeStatus;

                                const atualizarModoVisualPill = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const nivelDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    const temAvisoOuDescanso = Boolean(d && (d.emDescanso || d.descansoPendente || d.descansoEmAviso));
                                    let adiadoMicroMs = Number(estAtual.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                    if (d && !d.emDescanso && d.descansoPulado && adiadoMicroMs <= 0) {
                                        adiadoMicroMs = Date.now();
                                        host.__jusgovMinimizadoDescansoTs = adiadoMicroMs;
                                    }
                                    const forcarMicroPorPausaPendente = Boolean(
                                        d && !d.emDescanso && !d.descansoEmAviso && d.descansoPulado &&
                                        adiadoMicroMs > 0 && (Date.now() - adiadoMicroMs) >= 60000
                                    );
                                    const mostrarMicro = Boolean(
                                        (estAtual.minimizadoMicro || Boolean(d && d.forcarMicroPorEmprestimoFoco) || forcarMicroPorPausaPendente) &&
                                        !host.__jusgovModoOculto &&
                                        (!d || (!d.emDescanso && !d.descansoEmAviso && (forcarMicroPorPausaPendente || !d.descansoPendente))) &&
                                        (!host.__jusgovHoverPill || host.__jusgovArrastando)
                                    );
                                    if (mostrarMicro) {
                                        pill.style.display = 'none';
                                        boxBannerOculto.style.display = 'none';
                                        microIconeBox.style.display = 'inline-flex';
                                        let adiadoMs = Number(estAtual.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                        if (d && d.descansoPulado && adiadoMs <= 0) {
                                            adiadoMs = Date.now();
                                            host.__jusgovMinimizadoDescansoTs = adiadoMs;
                                        } else if (!d || !d.descansoPulado) {
                                            host.__jusgovMinimizadoDescansoTs = 0;
                                        }
                                        const emPatrulha = Boolean(d && d.descansoPulado && adiadoMs > 0 && (Date.now() - adiadoMs) >= 45000);
                                        atualizarVisualMicroIcone(d, emPatrulha);
                                        return;
                                    }
                                    microIconeBox.style.display = 'none';
                                    if (!host.__jusgovModoOculto) {
                                        pill.style.display = 'inline-flex';
                                    }
                                    const faseCurtaArraste = (d && d.fase === 'pausa_maior') ? 'Descanso' : `${(d && d.faseLabel) || 'Foco'} ${(d && d.cicloAtual) || 1}/${(d && d.ciclosMax) || 4}`;
                                    if (host.__jusgovArrastando) {
                                        const mostrarFaseArraste = Boolean(temAvisoOuDescanso || nivelDet >= 1);
                                        pill.style.padding = mostrarFaseArraste ? '1px 6px' : '1px 4px';
                                        pill.style.borderRadius = '7px';
                                        spanFase.textContent = `🍅 ${faseCurtaArraste}`;
                                        spanFase.style.display = mostrarFaseArraste ? 'inline-block' : 'none';
                                        spanTempo.style.display = 'inline-block';
                                        spanStatus.style.display = 'none';
                                        linhaPropaganda.style.display = 'none';
                                        return;
                                    }
                                    const segFocoPre = Math.max(0, Number(d && d.segundosDecorridos || 0));
                                    const metaFocoSegPre = Math.max(1, Number((d && (d.metaFaseMin || d.focoMin)) || 45)) * 60;
                                    const segRestPre = metaFocoSegPre - segFocoPre;
                                    const emAvisoPreDesc = Boolean(d && !d.emDescanso && !d.emPausa && segRestPre > 0 && segRestPre <= 30);
                                    const ativoTrabalhando = Boolean(
                                        d && !d.emDescanso && !d.descansoPendente && !d.descansoEmAviso && !d.emPausa && !emAvisoPreDesc
                                    );
                                    if (!host.__jusgovModoOculto && !host.__jusgovHostDestruido) {
                                        if (!host.isConnected) {
                                            (document.body || document.documentElement).appendChild(host);
                                        }
                                        host.style.setProperty('display', 'block', 'important');
                                        host.style.setProperty('visibility', 'visible', 'important');
                                        host.style.setProperty('opacity', '1', 'important');
                                    }
                                    const hoverVisivel = Boolean(host.__jusgovHoverPill);
                                    const modoUltraCompactoSemHover = Boolean(
                                        !hoverVisivel &&
                                        !temAvisoOuDescanso &&
                                        !emAvisoPreDesc &&
                                        !(d && (d.descansoPulado || d.emPausa)) &&
                                        nivelDet === 0
                                    );
                                    pill.style.padding = modoUltraCompactoSemHover ? '1px 4px' : '1px 6px';
                                    pill.style.borderRadius = '7px';
                                    const faseCurtaAtual = (d && d.fase === 'pausa_maior') ? 'Descanso' : `${(d && d.faseLabel) || 'Foco'} ${(d && d.cicloAtual) || 1}/${(d && d.ciclosMax) || 4}`;
                                    spanFase.textContent = `🍅 ${faseCurtaAtual}`;
                                    spanFase.style.display = (hoverVisivel || temAvisoOuDescanso || nivelDet >= 1) ? 'inline-block' : 'none';
                                    spanTempo.style.display = 'inline-block';
                                    spanTempo.style.fontStyle = (d && !d.emDescanso && d.descansoPulado) ? 'italic' : 'normal';
                                    atualizarBadgeStatus();
                                    if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                        host.__jusgovAtualizarPropaganda();
                                    }
                                };
                                host.__jusgovAtualizarModoVisual = atualizarModoVisualPill;

                                const renderizarCardPropaganda = (card) => {
                                    if (!card) return;
                                    const bg = card.bg || '#0f766e';
                                    const fg = card.fg || '#f8fafc';
                                    linhaPropaganda.style.background = bg;
                                    linhaPropaganda.style.color = fg;
                                    const svgIcone = criarIconeSvgBemEstar(card.icone || 'esticar', fg, 14);
                                    if (card.piscar) svgIcone.classList.add('jg-piscar');
                                    spanPropIcone.replaceChildren(svgIcone);
                                    spanPropTexto.textContent = card.texto || '';

                                    boxBannerOculto.style.background = bg;
                                    boxBannerOculto.style.color = fg;
                                    const svgBanner = criarIconeSvgBemEstar(card.icone || 'esticar', fg, 26);
                                    svgBanner.classList.add('jg-piscar');
                                    spanBannerIcone.replaceChildren(svgBanner);
                                    spanBannerTexto.textContent = card.texto || '';
                                };

                                const obterCardsPropaganda = () => {
                                    const pkg = host.__jusgovBemEstarPacote || {};
                                    const lista = Array.isArray(pkg.cardsCiclo) ? pkg.cardsCiclo : [];
                                    return lista.length > 0 ? lista : (pkg.cardDestaque ? [pkg.cardDestaque] : []);
                                };

                                const calcularDuracaoLeituraCardMs = (card, ehPreDescanso = false, ehPrimeiraDescanso = false) => {
                                    const pkg = host.__jusgovBemEstarPacote || {};
                                    const textoCard = String((card && card.texto) || '').trim();
                                    const extraTamMs = Math.round(textoCard.length * 145);
                                    const baseMs = ehPreDescanso ? 5500 : 8500;
                                    const jitterMs = Math.round((Math.random() * 4000) - 2000);
                                    let totalMs = baseMs + extraTamMs + jitterMs;
                                    if (ehPrimeiraDescanso) {
                                        const minIni = Math.max(14000, Number(pkg.duracaoPrimeiraMsgMs || 14000));
                                        totalMs = Math.max(minIni, baseMs + extraTamMs) + jitterMs;
                                    }
                                    return Math.max(ehPreDescanso ? 5500 : 7500, totalMs);
                                };

                                const rotacionarPropagandaAgora = (forcarTroca = false, ignorarBloqueioLeitura = false) => {
                                    const lista = obterCardsPropaganda();
                                    if (lista.length === 0) return null;
                                    if (forcarTroca && !ignorarBloqueioLeitura && Date.now() < Number(host.__jusgovPropBloqueadaAteTs || 0)) {
                                        return null;
                                    }
                                    let idx = Number(host.__jusgovPropCardIdx);
                                    if (!Number.isFinite(idx) || idx < 0 || idx >= lista.length) {
                                        idx = 0;
                                    } else if (forcarTroca && lista.length > 1) {
                                        let prox = Math.floor(Math.random() * lista.length);
                                        if (prox === idx) prox = (idx + 1) % lista.length;
                                        idx = prox;
                                    }
                                    host.__jusgovPropCardIdx = idx;
                                    renderizarCardPropaganda(lista[idx]);
                                    if (host.__jusgovPropAtivo) {
                                        const dNow = host.__jusgovDados || dadosResumo;
                                        const segFocoNow = Math.max(0, Number(dNow && dNow.segundosDecorridos || 0));
                                        const metaFocoSegNow = Math.max(1, Number((dNow && (dNow.metaFaseMin || dNow.focoMin)) || 45)) * 60;
                                        const emPreNow = Boolean(dNow && !dNow.emDescanso && !dNow.emPausa && (metaFocoSegNow - segFocoNow) > 0 && (metaFocoSegNow - segFocoNow) <= 30);
                                        agendarProximoCicloPropaganda(calcularDuracaoLeituraCardMs(lista[idx], emPreNow, false), emPreNow);
                                    }
                                    return lista[idx];
                                };
                                host.__jusgovRotacionarPropaganda = rotacionarPropagandaAgora;

                                const agendarProximoCicloPropaganda = (msEspera, ehPreDescanso = false) => {
                                    host.__jusgovPropBloqueadaAteTs = Date.now() + Math.max(4000, msEspera);
                                    if (host.__jusgovPropTimer) clearTimeout(host.__jusgovPropTimer);
                                    host.__jusgovPropTimer = setTimeout(() => {
                                        host.__jusgovPropTimer = 0;
                                        if (!host.isConnected || document.hidden) return;
                                        rotacionarPropagandaAgora(true, true);
                                    }, msEspera);
                                };

                                const atualizarPropagandaUi = () => {
                                    if (Date.now() < Number(host.__jusgovGovFeedbackAteTs || 0) && host.__jusgovGovFeedbackTexto) {
                                        linhaPropaganda.style.display = 'flex';
                                        linhaPropaganda.style.background = '#b45309';
                                        linhaPropaganda.style.color = '#ffffff';
                                        spanPropIcone.replaceChildren(criarIconeSvgBemEstar('incentivo_descanso', '#ffffff', 13));
                                        spanPropTexto.textContent = host.__jusgovGovFeedbackTexto;
                                        return;
                                    }
                                    const d = host.__jusgovDados || dadosResumo;
                                    const segFoco = Math.max(0, Number(d && d.segundosDecorridos || 0));
                                    const metaFocoSeg = Math.max(1, Number((d && (d.metaFaseMin || d.focoMin)) || 45)) * 60;
                                    const segRestFoco = metaFocoSeg - segFoco;
                                    const emPreDescanso = Boolean(d && !d.emDescanso && !d.emPausa && segRestFoco > 0 && segRestFoco <= 30);
                                    const devePropaganda = Boolean(d && (d.emDescanso || emPreDescanso || host.__jusgovBannerVisivelAgora || (d.descansoPulado && host.__jusgovPreviewPatrulhaSemBotoes)));
                                    const lista = obterCardsPropaganda();
                                    if (!devePropaganda || lista.length === 0 || host.__jusgovArrastando) {
                                        host.__jusgovPropAtivo = false;
                                        if (host.__jusgovPropTimer) {
                                            clearTimeout(host.__jusgovPropTimer);
                                            host.__jusgovPropTimer = 0;
                                        }
                                        linhaPropaganda.style.display = 'none';
                                        return;
                                    }
                                    linhaPropaganda.style.display = (emPreDescanso || (d && d.emDescanso) || (d && d.descansoPulado && host.__jusgovPreviewPatrulhaSemBotoes)) ? 'flex' : 'none';
                                    const faseKeyProp = `${host.__jusgovChaveFase || ''}:${d && d.emDescanso ? 'desc' : (emPreDescanso ? 'pre' : 'ban')}`;
                                    if (!host.__jusgovPropAtivo || host.__jusgovPropChave !== faseKeyProp) {
                                        host.__jusgovPropAtivo = true;
                                        host.__jusgovPropChave = faseKeyProp;
                                        host.__jusgovPropCardIdx = 0;
                                        renderizarCardPropaganda(lista[0]);
                                        const esperaIni = calcularDuracaoLeituraCardMs(
                                            lista[0],
                                            emPreDescanso,
                                            Boolean(d && d.emDescanso)
                                        );
                                        agendarProximoCicloPropaganda(esperaIni, emPreDescanso);
                                    }
                                };
                                host.__jusgovAtualizarPropaganda = atualizarPropagandaUi;

                                const atualizarBannerOculto = () => {
                                    const estBan = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const dBan = host.__jusgovDados || dadosResumo;
                                    const adiadoBanMs = Number(estBan.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                    const forcarMicroPausaBan = Boolean(
                                        dBan && !dBan.emDescanso && !dBan.descansoEmAviso && dBan.descansoPulado &&
                                        adiadoBanMs > 0 && (Date.now() - adiadoBanMs) >= 60000
                                    );
                                    const microAtivoAgora = Boolean(
                                        (estBan.minimizadoMicro || Boolean(dBan && dBan.forcarMicroPorEmprestimoFoco) || forcarMicroPausaBan) &&
                                        (!host.__jusgovHoverPill || host.__jusgovArrastando) &&
                                        (!dBan || (!dBan.emDescanso && !dBan.descansoEmAviso && (forcarMicroPausaBan || !dBan.descansoPendente)))
                                    );
                                    if (!host.__jusgovModoOculto) {
                                        host.style.setProperty('display', 'block', 'important');
                                        if (microAtivoAgora) {
                                            pill.style.display = 'none';
                                            microIconeBox.style.display = 'inline-flex';
                                        } else {
                                            microIconeBox.style.display = 'none';
                                            pill.style.display = 'inline-flex';
                                        }
                                        boxBannerOculto.style.display = 'none';
                                        host.__jusgovBannerPos = null;
                                        if (host.__jusgovBannerShowTimer) { clearTimeout(host.__jusgovBannerShowTimer); host.__jusgovBannerShowTimer = 0; }
                                        if (host.__jusgovBannerHideTimer) { clearTimeout(host.__jusgovBannerHideTimer); host.__jusgovBannerHideTimer = 0; }
                                        return;
                                    }
                                    if (host.__jusgovBannerVisivelAgora) {
                                        host.style.setProperty('display', 'block', 'important');
                                        if (host.__jusgovHoverPill) {
                                            pill.style.display = 'inline-flex';
                                            boxBannerOculto.style.display = 'none';
                                        } else {
                                            pill.style.display = 'none';
                                            boxBannerOculto.style.display = 'inline-flex';
                                        }
                                        rotacionarPropagandaAgora(false);
                                        atualizarPosicaoEfetivaPill(Date.now());
                                        return;
                                    }
                                    host.style.setProperty('display', 'none', 'important');
                                    pill.style.display = 'none';
                                    boxBannerOculto.style.display = 'none';
                                    if (!host.__jusgovBannerShowTimer && !document.hidden) {
                                        const pkg = host.__jusgovBemEstarPacote || {};
                                        const minEsp = Math.max(8000, Number(pkg.bannerLembreteMinMs || 45000));
                                        const maxEsp = Math.max(minEsp, Number(pkg.bannerLembreteMaxMs || 85000));
                                        const esperaShow = Math.round(minEsp + Math.random() * (maxEsp - minEsp));
                                        host.__jusgovBannerShowTimer = setTimeout(() => {
                                            host.__jusgovBannerShowTimer = 0;
                                            if (!host.isConnected || !host.__jusgovModoOculto || document.hidden) return;
                                            const vOpts = ['superior', 'inferior'];
                                            const hOpts = ['esquerda', 'centro', 'direita'];
                                            host.__jusgovBannerPos = {
                                                posVert: vOpts[Math.floor(Math.random() * vOpts.length)],
                                                alinh: hOpts[Math.floor(Math.random() * hOpts.length)]
                                            };
                                            host.__jusgovBannerVisivelAgora = true;
                                            host.__jusgovPropCardIdx = 0;
                                            atualizarBannerOculto();
                                            const listaBan = obterCardsPropaganda();
                                            const cardBan = (listaBan && listaBan[0]) || null;
                                            const duracaoVis = calcularDuracaoLeituraCardMs(cardBan, false, false);
                                            if (host.__jusgovBannerHideTimer) clearTimeout(host.__jusgovBannerHideTimer);
                                            host.__jusgovBannerHideTimer = setTimeout(() => {
                                                host.__jusgovBannerHideTimer = 0;
                                                if (!host.isConnected) return;
                                                if (host.__jusgovHoverPill) return;
                                                host.__jusgovBannerVisivelAgora = false;
                                                atualizarBannerOculto();
                                            }, duracaoVis);
                                        }, esperaShow);
                                    }
                                };
                                host.__jusgovAtualizarBannerOculto = atualizarBannerOculto;

                                /* Renderização pura a partir do snapshot externo compartilhado pelo Service Worker (sem contadores locais) */
                                const atualizarRelogio = () => {
                                    if (!contextoHostVivo()) return;
                                    const d = host.__jusgovDados || dadosResumo;
                                    if (!d) return;
                                    const agoraNow = (host.__jusgovSnapshotAgoraSrvMs && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage)
                                        ? Number(host.__jusgovSnapshotAgoraSrvMs)
                                        : (Date.now() + Number(host.__jusgovRelogioOffsetMs || 0));

                                    if (d.emDescanso) {
                                        const metaMs = Number(d.metaFaseMs || 0) > 0
                                            ? Number(d.metaFaseMs)
                                            : (Math.max(1, Number(d.metaFaseMin || 1)) * 60000);
                                        const cumpridoAoVivo = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);
                                        const modoEspRelogio = obterModoPosicaoEspecial(d, agoraNow);
                                        const emIdleDescansoReal = (modoEspRelogio === 'idle_centro_tela' && !host.__jusgovModoOculto);

                                        if (d.aguardandoOciosidade) {
                                            const mmParado = String(Math.max(0, Number(d.metaFaseMin || 0))).padStart(2, '0');
                                            spanTempo.textContent = `-${mmParado}:00`;
                                        } else {
                                            const diffMs = metaMs - Number(d.descansoAcumuladoMs || 0);
                                            if (diffMs > 0) {
                                                const diffSeg = Math.ceil(diffMs / 1000);
                                                const mm = String(Math.floor(diffSeg / 60)).padStart(2, '0');
                                                const ss = String(diffSeg % 60).padStart(2, '0');
                                                spanTempo.textContent = `-${mm}:${ss}`;
                                            } else {
                                                const extraSeg = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));
                                                const mm = String(Math.floor(extraSeg / 60)).padStart(2, '0');
                                                const ss = String(extraSeg % 60).padStart(2, '0');
                                                spanTempo.textContent = `+${mm}:${ss}`;
                                            }
                                        }

                                        if (emIdleDescansoReal && cumpridoAoVivo) {
                                            const emRajadaVisual = Boolean(host.__jusgovRajadaVisualAteTs && agoraNow < host.__jusgovRajadaVisualAteTs);
                                            atualizarBackdropTelaCheia(emRajadaVisual ? 'retorno_rajada' : 'retorno_trabalho');
                                        } else if (emIdleDescansoReal) {
                                            atualizarBackdropTelaCheia('descanso_calmo');
                                        } else {
                                            atualizarBackdropTelaCheia('nenhum');
                                        }

                                        if (cumpridoAoVivo && !document.hidden && !host.__jusgovAlarmeBloqueado) {
                                            const cfgBeep = host.__jusgovConfigBeep || {};
                                            const extraSegAlarme = Math.max(1, Math.floor(Math.max(0, Number(d.descansoAcumuladoMs || 0) - metaMs) / 1000));
                                            if (host.__jusgovUltimoSegAlarme !== extraSegAlarme) {
                                                host.__jusgovUltimoSegAlarme = extraSegAlarme;
                                                const metaSegAlarme = Math.max(60, Math.round(metaMs / 1000));
                                                const faseAlarme = (extraSegAlarme <= metaSegAlarme) ? 'DESCANSO_PUNITIVO' : 'ATRASO_ABANDONO';
                                                const tempoFaseAlarme = (faseAlarme === 'DESCANSO_PUNITIVO')
                                                    ? extraSegAlarme
                                                    : Math.max(1, extraSegAlarme - metaSegAlarme);
                                                const acaoAlarme = verificarAlarmePomodoroLocal(
                                                    Math.max(0, Number(d.cicloAtual || 0)),
                                                    Math.max(1, Number(d.ciclosMax || 4)),
                                                    metaSegAlarme,
                                                    tempoFaseAlarme,
                                                    faseAlarme
                                                );
                                                if (acaoAlarme === 'BLOQUEAR') {
                                                    host.__jusgovAlarmeBloqueado = true;
                                                } else if (acaoAlarme) {
                                                    /* Rajada visual de tela cheia durante os beeps e +3.5s depois de terminarem (independente de som ativo) */
                                                    const durRajadaMs = (acaoAlarme === 'BEEP_LONGO') ? 6000 : ((acaoAlarme === 'BEEP_CURTO_TRIPLO') ? 4800 : 3800);
                                                    host.__jusgovRajadaVisualAteTs = agoraNow + durRajadaMs;
                                                    atualizarBackdropTelaCheia('retorno_rajada');
                                                    if (cfgBeep.ativo && cfgBeep.permitirBeep) {
                                                        host.__jusgovUltimoBeepTs = agoraNow;
                                                        tocarBeepConclusao(cfgBeep.intensidade || 'suave', acaoAlarme);
                                                    }
                                                }
                                            }
                                        } else if (!cumpridoAoVivo) {
                                            host.__jusgovUltimoBeepTs = 0;
                                            host.__jusgovUltimoSegAlarme = -1;
                                            host.__jusgovAlarmeBloqueado = false;
                                            host.__jusgovRajadaVisualAteTs = 0;
                                        }

                                        const excedeuTempoDescanso = Boolean(
                                            !d.aguardandoOciosidade &&
                                            (cumpridoAoVivo || Number(d.descansoAcumuladoMs || 0) >= metaMs)
                                        );
                                        spanTempo.style.color = excedeuTempoDescanso ? '#86efac' : '';
                                        spanTempo.style.animation = excedeuTempoDescanso ? 'jusgov-piscar-crono 1s steps(1,end) infinite' : 'none';
                                        atualizarModoVisualPill();
                                        atualizarPosicaoEfetivaPill(agoraNow);
                                        return;
                                    }

                                    host.__jusgovUltimoBeepTs = 0;
                                    host.__jusgovUltimoSegAlarme = -1;
                                    host.__jusgovAlarmeBloqueado = false;
                                    host.__jusgovRajadaVisualAteTs = 0;
                                    atualizarBackdropTelaCheia('nenhum');
                                    /* Contador de Ativo/Foco é progressivo; em trabalho normal sem hover omite '+' para compactação, mantendo '+'/'-' em hover, compensações e alertas */
                                    const segFoco = (typeof d.segundosDecorridos === 'number' && Number.isFinite(d.segundosDecorridos))
                                        ? Math.max(0, Math.floor(d.segundosDecorridos))
                                        : (d.emPausa
                                            ? Math.max(0, Number(d.minutosNaFase || 0) * 60)
                                            : Math.max(0, Math.floor((agoraNow - Number(d.focoAnchorTs || d.faseInicioTs || agoraNow)) / 1000)));
                                    const mm = String(Math.floor(segFoco / 60)).padStart(2, '0');
                                    const ss = String(segFoco % 60).padStart(2, '0');
                                    const metaFocoSeg = Math.max(1, Number(d.metaFaseMin || d.focoMin || 45)) * 60;
                                    const segRestFoco = metaFocoSeg - segFoco;
                                    const emAlerta30s = Boolean(!d.emPausa && segRestFoco > 0 && segRestFoco <= 30);
                                    const exibirSinalTrabalho = Boolean(
                                        host.__jusgovHoverPill ||
                                        d.descansoPulado ||
                                        d.descansoPendente ||
                                        d.descansoEmAviso ||
                                        d.emPausa ||
                                        emAlerta30s
                                    );
                                    spanTempo.textContent = exibirSinalTrabalho ? `+${mm}:${ss}` : `${mm}:${ss}`;
                                    spanTempo.style.color = emAlerta30s ? '#facc15' : '';
                                    spanTempo.style.animation = emAlerta30s ? 'jusgov-piscar-crono 1s steps(1,end) infinite' : 'none';
                                    if (emAlerta30s) {
                                        pill.style.animation = 'jusgov-pill-alerta-30s 1s steps(1,end) infinite';
                                        microIconeBox.style.animation = 'jusgov-pill-alerta-30s 1s steps(1,end) infinite';
                                    } else {
                                        if (pill.getAttribute('data-retorno-ativo') !== 'true') pill.style.animation = 'none';
                                        microIconeBox.style.animation = 'none';
                                    }
                                    atualizarModoVisualPill();
                                    atualizarPosicaoEfetivaPill(agoraNow);
                                };
                                host.__jusgovAtualizarRelogio = atualizarRelogio;

                                const aplicarSnapshotExterno = (novaCfgExib, novoResumo, novoEstadoBarra) => {
                                    gerenciarModalDescanso(Boolean(novaCfgExib && novaCfgExib.deveExibirModalDescanso), novaCfgExib && novaCfgExib.modalDados, novoResumo);
                                    const agoraLocal = Date.now();
                                    const exib = resolverPermissaoExibicao(host, novaCfgExib, novoResumo);
                                    if (!exib.deveExibir) {
                                        if (host.__jusgovLocalBarraAlteradaAteTs && agoraLocal < host.__jusgovLocalBarraAlteradaAteTs) {
                                            return;
                                        }
                                        destruirHost(host);
                                        return;
                                    }
                                    const estNorm = normalizarEstadoBarra(novoEstadoBarra);
                                    const agoraSrv = (novaCfgExib && novaCfgExib.agoraServidor) ? Number(novaCfgExib.agoraServidor) : agoraLocal;
                                    const faseAntSnap = host.__jusgovUltimaFaseAutoDetect || '';
                                    const faseNovaSnap = novoResumo ? `${novoResumo.fase}:${Boolean(novoResumo.emDescanso)}` : '';
                                    if (faseAntSnap && faseNovaSnap && faseAntSnap !== faseNovaSnap) {
                                        host.__jusgovAlertaAutoDetectAteTs = agoraLocal + 4500;
                                        host.__jusgovAlertaAutoDetectTexto = (novoResumo && novoResumo.emDescanso)
                                            ? '⏸️ Pausa detectada'
                                            : '▶️ Foco detectado';
                                    }
                                    host.__jusgovUltimaFaseAutoDetect = faseNovaSnap;
                                    host.__jusgovChaveFase = exib.chave;
                                    host.__jusgovDados = novoResumo;
                                    host.__jusgovSnapshotAgoraSrvMs = agoraSrv;
                                    host.__jusgovRelogioOffsetMs = (novaCfgExib && novaCfgExib.agoraServidor) ? (agoraSrv - agoraLocal) : 0;
                                    const tooltipAtivo = (novaCfgExib && novaCfgExib.tooltipTexto) || (novoResumo && novoResumo.tooltipTexto) || '';
                                    if (tooltipAtivo) {
                                        pill.title = tooltipAtivo;
                                        spanTempo.title = tooltipAtivo;
                                        microIconeBox.title = tooltipAtivo;
                                    } else {
                                        pill.removeAttribute('title');
                                        spanTempo.removeAttribute('title');
                                        microIconeBox.removeAttribute('title');
                                    }
                                    const estAnteriorLocal = host.__jusgovEstadoBarra;
                                    if (estAnteriorLocal && host.__jusgovLocalBarraAlteradaAteTs && agoraLocal < host.__jusgovLocalBarraAlteradaAteTs) {
                                        estNorm.minimizadoMicro = estAnteriorLocal.minimizadoMicro;
                                        estNorm.minimizadoDescansoAdiadoTs = estAnteriorLocal.minimizadoDescansoAdiadoTs;
                                        estNorm.modoFixacao = estAnteriorLocal.modoFixacao;
                                        estNorm.nivelDetalhe = estAnteriorLocal.nivelDetalhe;
                                    }
                                    host.__jusgovEstadoBarra = estNorm;
                                    host.__jusgovModoBarra = (novaCfgExib && novaCfgExib.modoBarra) || 'sempre';
                                    host.__jusgovBemEstarPacote = (novaCfgExib && novaCfgExib.bemEstarPropaganda) || null;
                                    host.__jusgovModoOculto = Boolean(!exib.deveExibirNormal && exib.podeBannerOculto);
                                    if (exib.deveExibirNormal) {
                                        host.__jusgovBannerVisivelAgora = false;
                                    }
                                    host.__jusgovConfigBeep = {
                                        ativo: Boolean(novaCfgExib && novaCfgExib.beepAtivo),
                                        intensidade: (novaCfgExib && novaCfgExib.beepIntensidade) || 'suave',
                                        intervaloMs: Math.max(5000, Number((novaCfgExib && novaCfgExib.beepIntervaloMs) || 15000)),
                                        permitirBeep: Boolean(novaCfgExib && novaCfgExib.permitirBeep)
                                    };
                                    if (Number(estNorm.modoFixacao) !== 1 && !(novoResumo && novoResumo.emDescanso && novoResumo.descansoEmAviso)) {
                                        host.__jusgovRetornoRect = null;
                                    }
                                    atualizarRelogio();
                                    atualizarBannerOculto();
                                    if (!document.hidden && !host.__jusgovTimerInterval) {
                                        host.__jusgovTimerInterval = setInterval(solicitarSincronizacaoExterna, 1000);
                                    }
                                };
                                host.__jusgovAplicarSnapshotExterno = aplicarSnapshotExterno;

                                const solicitarSincronizacaoExterna = () => {
                                    if (!contextoHostVivo()) return;
                                    if (document.hidden || host.__jusgovSyncEmVoo) return;
                                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                        const agoraSyncReq = Date.now();
                                        const dSync = host.__jusgovDados;
                                        const semFocoJanela = (typeof document.hasFocus === 'function') ? !document.hasFocus() : false;
                                        const intervaloMinSync = (dSync && dSync.emDescanso) ? 820 : (semFocoJanela ? 3500 : 2000);
                                        if (host.__jusgovUltSyncIpcTs && (agoraSyncReq - host.__jusgovUltSyncIpcTs) < intervaloMinSync) {
                                            if (host.__jusgovSnapshotAgoraSrvMs) {
                                                host.__jusgovSnapshotAgoraSrvMs += 1000;
                                            }
                                            if (dSync && !dSync.emPausa && typeof dSync.segundosDecorridos === 'number') {
                                                dSync.segundosDecorridos += 1;
                                            }
                                            if (dSync && dSync.emDescanso && !dSync.aguardandoOciosidade && !dSync.descansoEmAviso) {
                                                dSync.descansoAcumuladoMs = Number(dSync.descansoAcumuladoMs || 0) + 1000;
                                            }
                                            atualizarRelogio();
                                            return;
                                        }
                                        host.__jusgovUltSyncIpcTs = agoraSyncReq;
                                        host.__jusgovSyncEmVoo = true;
                                        chrome.runtime.sendMessage({ acao: 'OBTER_STATUS_TRABALHO' }).then((resp) => {
                                            host.__jusgovSyncEmVoo = false;
                                            if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected && !host.__jusgovHostDestruido) {
                                                const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                            }
                                        }).catch((err) => {
                                            host.__jusgovSyncEmVoo = false;
                                            if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                destruirHost(host);
                                            }
                                        });
                                        return;
                                    }
                                    atualizarRelogio();
                                };

                                const enviarInteracaoExterna = (tipoInteracao = 'movimento') => {
                                    if (!contextoHostVivo()) return;
                                    const d = host.__jusgovDados;
                                    if (!d) return;
                                    const agoraLoc = Date.now();
                                    const precisaPingImediato = Boolean(tipoInteracao === 'click_ou_tecla');
                                    if (d.emDescanso) {
                                        if (precisaPingImediato) {
                                            pararScreensaver();
                                            removerBackdropBlur();
                                        } else if (tipoInteracao === 'movimento' && (agoraLoc - Number(host.__jusgovUltimoPingDescTs || 0)) < 250) {
                                            return;
                                        }
                                        host.__jusgovUltimoPingDescTs = agoraLoc;
                                    } else if (!precisaPingImediato) {
                                        if ((agoraLoc - Number(host.__jusgovUltimoPingAtivTs || 0)) < 15000) {
                                            return;
                                        }
                                        host.__jusgovUltimoPingAtivTs = agoraLoc;
                                    }
                                    try {
                                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                            chrome.runtime.sendMessage({
                                                acao: 'PING_ATIVIDADE_TRABALHO',
                                                tipoInteracao,
                                                retornarSnapshot: true
                                            }).then((resp) => {
                                                if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected && !host.__jusgovHostDestruido) {
                                                    const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                    aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                                }
                                            }).catch((err) => {
                                                if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                    destruirHost(host);
                                                }
                                            });
                                        }
                                    } catch (_) {
                                        contextoHostVivo();
                                    }
                                };

                                /* Retorno automático quando no modo 2 (posição fixada) o mouse sai da área original */
                                const onDocMouseMovePos = (ev) => {
                                    const ultimo = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                    const dxCursor = (ultimo.x !== -9999) ? Math.abs(ev.clientX - ultimo.x) : 0;
                                    const dyCursor = (ultimo.y !== -9999) ? Math.abs(ev.clientY - ultimo.y) : 0;
                                    const passoPx = Math.hypot(dxCursor, dyCursor);
                                    const moveuDeVerdade = ultimo.x !== -9999 && passoPx > 1.5;
                                    host.__jusgovUltimoCursor = { x: ev.clientX, y: ev.clientY };
                                    if (moveuDeVerdade) {
                                        host.__jusgovCursorMoveuRealTs = Date.now();
                                        if (host.__jusgovAguardandoSairPosMin) {
                                            const rMicroPos = microIconeBox.getBoundingClientRect();
                                            const foraMicroPos = (!rMicroPos || rMicroPos.width <= 4) ||
                                                ev.clientX < rMicroPos.left - 12 || ev.clientX > rMicroPos.right + 12 ||
                                                ev.clientY < rMicroPos.top - 12 || ev.clientY > rMicroPos.bottom + 12;
                                            if (foraMicroPos) {
                                                host.__jusgovAguardandoSairPosMin = false;
                                                host.__jusgovSuprimirHoverMicroAteTs = 0;
                                            }
                                        }
                                        if ((host.__jusgovScreensaverAtivo || host.__jusgovPatrulhaAtiva) && !host.__jusgovHoverPill &&
                                            (pill.matches(':hover') || microIconeBox.matches(':hover'))) {
                                            ativarHoverExpandido(true);
                                        }
                                    }
                                    const pathMov = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    const naPropriaBarra = Boolean(ev.target === host || pathMov.includes(host) || pathMov.includes(pill) || pathMov.includes(microIconeBox) || host.__jusgovHoverPill);
                                    if (moveuDeVerdade && !naPropriaBarra) {
                                        const dCur = host.__jusgovDados;
                                        if (dCur && dCur.emDescanso) {
                                            host.__jusgovDistMovDescanso = Number(host.__jusgovDistMovDescanso || 0) + passoPx;
                                            if (host.__jusgovDistMovDescanso >= 36) {
                                                host.__jusgovDistMovDescanso = 0;
                                                enviarInteracaoExterna('movimento');
                                            }
                                        } else {
                                            host.__jusgovDistMovDescanso = 0;
                                            enviarInteracaoExterna('movimento');
                                        }
                                    }
                                    if (!host.__jusgovRetornoRect) return;
                                    const rOrig = host.__jusgovRetornoRect;
                                    const foraOrig = (
                                        ev.clientX < rOrig.left - 14 ||
                                        ev.clientX > rOrig.right + 14 ||
                                        ev.clientY < rOrig.top - 14 ||
                                        ev.clientY > rOrig.bottom + 14
                                    );
                                    if (foraOrig) {
                                        agendarRetornoPosicaoAncorada();
                                    } else if (host.__jusgovTimerRetorno) {
                                        clearTimeout(host.__jusgovTimerRetorno);
                                        host.__jusgovTimerRetorno = null;
                                    }
                                };
                                const onDocMouseLeavePos = () => {
                                    host.__jusgovUltimoCursor = { x: -9999, y: -9999 };
                                    if (host.__jusgovRetornoRect) {
                                        agendarRetornoPosicaoAncorada();
                                    }
                                };
                                const onDocWheelPos = () => {
                                    enviarInteracaoExterna('movimento');
                                };

                                /* Interação do usuário: notifica estado externo */
                                const onDocInteracao = (ev) => {
                                    if (!contextoHostVivo()) return;
                                    if (ev.type === 'keydown' && ev.repeat) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    const naPropriaBarra = (ev.target === host || path.includes(host) || path.includes(pill) || path.includes(microIconeBox));
                                    if (!naPropriaBarra) {
                                        enviarInteracaoExterna('click_ou_tecla');
                                    }
                                };
                                const onDocVisibilityChange = () => {
                                    if (!contextoHostVivo()) return;
                                    if (document.hidden) {
                                        removerBackdropBlur();
                                        pararScreensaver();
                                        pararPatrulhaBorda();
                                        if (host.__jusgovTimerInterval) {
                                            clearInterval(host.__jusgovTimerInterval);
                                            host.__jusgovTimerInterval = 0;
                                        }
                                    } else {
                                        solicitarSincronizacaoExterna();
                                        if (!host.__jusgovTimerInterval) {
                                            host.__jusgovTimerInterval = setInterval(solicitarSincronizacaoExterna, 1000);
                                        }
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({ acao: 'SINCRONIZAR_GUIA_ATIVA_POMODORO' }).catch((err) => {
                                                    if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                        destruirHost(host);
                                                    }
                                                });
                                            }
                                        } catch (_) {
                                            contextoHostVivo();
                                        }
                                    }
                                };
                                document.addEventListener('keydown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousedown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousemove', onDocMouseMovePos, { capture: true, passive: true });
                                document.addEventListener('wheel', onDocWheelPos, { capture: true, passive: true });
                                document.addEventListener('mouseleave', onDocMouseLeavePos, { capture: false, passive: true });
                                document.addEventListener('visibilitychange', onDocVisibilityChange, { capture: false, passive: true });
                                host.__jusgovCleanupListeners = () => {
                                    document.removeEventListener('keydown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousedown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousemove', onDocMouseMovePos, { capture: true });
                                    document.removeEventListener('wheel', onDocWheelPos, { capture: true });
                                    document.removeEventListener('mouseleave', onDocMouseLeavePos, { capture: false });
                                    document.removeEventListener('visibilitychange', onDocVisibilityChange, { capture: false });
                                };

                                (document.body || document.documentElement).appendChild(host);
                            }

                            if (typeof host.__jusgovAplicarSnapshotExterno === 'function') {
                                host.__jusgovAplicarSnapshotExterno(cfgExib, dadosResumo, estadoBarra);
                            }
            };
        }
    }

    Object.freeze(ProdutBarraInjecao.prototype);
    return Object.freeze(ProdutBarraInjecao);
}));