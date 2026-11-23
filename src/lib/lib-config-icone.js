/* ==========================================================================
 * ARQUIVO: src/lib/lib-config-icone.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Ícone Vetorial, Menus de Contexto e Sync Coalescido
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config-icone.js
 * - Classe Exportada: LibConfigIcone (self.JusGovLibConfigIcone) extends BaseModulo
 * - Métodos Públicos: sincronizarComportamentoIcone, desenharIconeVetorialFallback, obterChavesConfigSync, houveMudancaDeConfiguracao, sincronizarMenusContexto, tratarCliqueIconeExtensao, aplicarConfigLocalEAgendarSync, executarSincronizacaoNuvemCoalescida, gerenciarRequisicaoPerfil, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibConfigIcone = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const _cfgH = (typeof self !== 'undefined' && self.JusGovConfigHelpers) ? self.JusGovConfigHelpers : ((typeof require === 'function') ? (() => { try { return require('./lib-config-helpers.js'); } catch (_) { return {}; } })() : {});
    const { CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS, PREFIXO_CHAVE_PERFIL_CFG, CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_SYNC_PERFIL_BASE_TOP, LIMITE_BYTES_ITEM_SYNC, JANELA_DUPLO_CLIQUE_ICONE_MS, CHAVES_CONFIGURACAO_SINCRONIZAVEL, SET_CHAVES_SYNC, obterDefaultsModulo, lerJsonDeResposta, formatarNomeArquivoExportacao, clonarValorSimples, valoresIguaisConfig, ENUNS_CONFIGURACAO_VALIDOS, LIMITES_NUMERICOS_CONFIGURACAO, calcularHashPayloadExportacao, extrairCabecalhoComentarioExportacao, normalizarTextoComparacao } = _cfgH;

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    class LibConfigIcone extends Base {
        constructor() {
            super('LibConfigIcone');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(LibConfigIcone.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(LibConfigIcone.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
        desenharIconeVetorialFallback(modoAtivo, comportamento, chromeApi = null, badgePomodoro = undefined) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (typeof OffscreenCanvas === 'undefined' || !apiChrome || !apiChrome.action || !apiChrome.action.setIcon) {
                return false;
            }

            try {
                const badgeAtivo = (badgePomodoro === undefined && typeof self !== 'undefined')
                    ? (self.__JUSGOV_ULTIMO_BADGE_POMODORO__ || null)
                    : badgePomodoro;
                const rs = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                    ? JusGovCfgDefaults.obterRegrasSistema()
                    : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
                const paletas = (rs && rs.iconeExtensaoPaletas) ? rs.iconeExtensaoPaletas : null;
                const chavePaleta = (modoAtivo === 'url') ? 'url' : (modoAtivo === 'desligado' ? 'desligado' : 'global');
                const paleta = (paletas && paletas[chavePaleta]) ? paletas[chavePaleta] : null;

                let corFundo = (paleta && paleta.gradTop) || '#10b981';
                let corBorda = (paleta && paleta.borda) || '#059669';
                let corRaio = (paleta && paleta.raio) || '#fef08a';
                let tituloModo = 'Ativo (Global)';

                if (modoAtivo === 'url') {
                    if (!paleta) { corFundo = '#1a73e8'; corBorda = '#1557b0'; corRaio = '#fbbc04'; }
                    tituloModo = 'Ativo (Lista)';
                } else if (modoAtivo === 'desligado') {
                    if (!paleta) { corFundo = '#64748b'; corBorda = '#475569'; corRaio = '#cbd5e1'; }
                    tituloModo = 'Pausado';
                }

                if (apiChrome.action.setTitle && !(typeof self !== 'undefined' && self.JusGovModuloProdutividade)) {
                    const subtituloAcao = (comportamento === 'acoes_rapidas')
                        ? '\n(1 clique: alternar modo | 2 cliques: abrir Opcoes)'
                        : '\n(1 clique: abrir popup)';
                    apiChrome.action.setTitle({
                        title: 'Selecao/Copia Aprimorada - ' + tituloModo + subtituloAcao
                    }).catch(() => { });
                }

                const tamanhos = [16, 24, 32, 48, 128];
                const imageDataMap = {};

                for (let i = 0; i < tamanhos.length; i++) {
                    const dim = tamanhos[i];
                    const canvas = new OffscreenCanvas(dim, dim);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;

                    const escala = dim / 128;
                    const txtBrutoPre = (badgeAtivo && badgeAtivo.texto) ? String(badgeAtivo.texto).trim() : '';
                    const matchMinPre = txtBrutoPre.match(/^(!?)(\d+)\s*m$/i);
                    const txtBadge = txtBrutoPre
                        ? (matchMinPre
                            ? (Number(matchMinPre[2]) <= 9 ? `${matchMinPre[1]}${Number(matchMinPre[2])}m` : `${matchMinPre[1]}${Number(matchMinPre[2])}`)
                            : txtBrutoPre)
                        : '';
                    const temBadgeTexto = Boolean(txtBadge);

                    /* Passo 5.2: Fundo arredondado; quando ha numero em badge, eleva a caixa para que o numeral fique ressaltado abaixo da borda inferior */
                    const yBoxBase = temBadgeTexto ? 2 : 6;
                    const hBoxBase = temBadgeTexto ? 110 : 116;
                    const escalaVert = hBoxBase / 116;
                    const mapY = (yOrig) => (yBoxBase + (yOrig - 6) * escalaVert) * escala;

                    ctx.fillStyle = corFundo;
                    ctx.beginPath();
                    ctx.roundRect(6 * escala, yBoxBase * escala, 116 * escala, hBoxBase * escala, (temBadgeTexto ? 24 : 26) * escala);
                    ctx.fill();

                    ctx.strokeStyle = corBorda;
                    ctx.lineWidth = Math.max(1, 4 * escala);
                    ctx.stroke();

                    /* Passo 5.3: Faixas documentais semi-transparentes */
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.roundRect(24 * escala, mapY(34), 46 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.roundRect(24 * escala, mapY(54), 34 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.roundRect(24 * escala, mapY(74), 40 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.fill();

                    /* Passo 5.4: Desenho do Raiozinho Original (points: 78,20 44,68 68,68 54,108 100,56 74,56) */
                    ctx.fillStyle = corRaio;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = Math.max(1, 3 * escala);
                    ctx.lineJoin = 'round';

                    ctx.beginPath();
                    ctx.moveTo(78 * escala, mapY(20));
                    ctx.lineTo(44 * escala, mapY(68));
                    ctx.lineTo(68 * escala, mapY(68));
                    ctx.lineTo(54 * escala, mapY(108));
                    ctx.lineTo(100 * escala, mapY(56));
                    ctx.lineTo(74 * escala, mapY(56));
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    /* Passo 5.5 (FEAT-67 / BUG-93): Apenas texto em negrito encostado exatamente na borda inferior maxima do canvas (efeito ressaltado) */
                    if (temBadgeTexto) {
                        const txt = txtBadge;
                        ctx.save();
                        const maxLarguraTxt = Math.max(10, dim - Math.max(1, Math.round(dim * 0.04)));
                        const famFonte = '"Segoe UI", "Roboto", Arial, sans-serif';
                        let tamFonte = (txt.length <= 2)
                            ? Math.max(10, Math.round(dim * 0.65))
                            : Math.max(8, Math.round(dim * 0.50));
                        const tamMin = Math.max(7, Math.round(dim * 0.40));

                        const temM = /^!?\d+m$/i.test(txt);
                        const numParte = temM ? txt.slice(0, -1) : txt;
                        const medirLargura = (tBase) => {
                            if (!temM) {
                                ctx.font = `800 ${tBase}px ${famFonte}`;
                                return ctx.measureText(txt).width;
                            }
                            ctx.font = `800 ${tBase}px ${famFonte}`;
                            const wN = ctx.measureText(numParte).width;
                            const tM = Math.max(6, Math.round(tBase * 0.64));
                            ctx.font = `400 ${tM}px ${famFonte}`;
                            return wN + ctx.measureText('m').width;
                        };

                        while (tamFonte > tamMin && medirLargura(tamFonte) > maxLarguraTxt) {
                            tamFonte -= 1;
                        }

                        let corNumero = '#ffffff';
                        const corBadge = String(badgeAtivo.cor || '').toLowerCase();
                        if (corBadge === '#eab308' || corBadge === '#facc15') corNumero = '#fde047';
                        else if (corBadge === '#dc2626') corNumero = '#fca5a5';
                        else if (corBadge === '#0284c7') corNumero = '#7dd3fc';
                        else if (corBadge === '#16a34a') corNumero = '#86efac';

                        ctx.textBaseline = 'alphabetic';
                        ctx.font = `800 ${tamFonte}px ${famFonte}`;
                        const metricaRef = ctx.measureText(temM ? numParte : txt);
                        const descentReal = (metricaRef && typeof metricaRef.actualBoundingBoxDescent === 'number' && Number.isFinite(metricaRef.actualBoundingBoxDescent))
                            ? Math.max(0, metricaRef.actualBoundingBoxDescent)
                            : 0;
                        const xCentro = dim / 2;
                        const yBase = dim - descentReal;

                        ctx.lineJoin = 'round';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.strokeStyle = 'rgba(15, 23, 42, 0.78)';
                        ctx.lineWidth = Math.max(1.1, dim * 0.08);
                        ctx.fillStyle = corNumero;

                        if (temM) {
                            ctx.textAlign = 'left';
                            const wN = metricaRef.width;
                            const tamM = Math.max(6, Math.round(tamFonte * 0.64));
                            ctx.font = `400 ${tamM}px ${famFonte}`;
                            const wM = ctx.measureText('m').width;
                            const xIni = Math.max(0, (dim - (wN + wM)) / 2);

                            ctx.font = `800 ${tamFonte}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(2, dim * 0.14);
                            ctx.strokeText(numParte, xIni, yBase);
                            ctx.shadowBlur = Math.max(1, dim * 0.07);
                            ctx.fillText(numParte, xIni, yBase);

                            ctx.font = `400 ${tamM}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(1.5, dim * 0.12);
                            ctx.strokeText('m', xIni + wN, yBase);
                            ctx.shadowBlur = Math.max(1, dim * 0.06);
                            ctx.fillText('m', xIni + wN, yBase);
                        } else {
                            ctx.textAlign = 'center';
                            ctx.font = `800 ${tamFonte}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(2, dim * 0.14);
                            ctx.strokeText(txt, xCentro, yBase);

                            ctx.shadowBlur = Math.max(1, dim * 0.07);
                            ctx.fillText(txt, xCentro, yBase);
                        }
                        ctx.restore();
                    }

                    imageDataMap[dim] = ctx.getImageData(0, 0, dim, dim);
                }

                apiChrome.action.setIcon({ imageData: imageDataMap }).catch(() => { });
                return true;
            } catch (_) {
                return false;
            }
        }

        obterChavesConfigSync() {
            return CHAVES_CONFIGURACAO_SINCRONIZAVEL;
        }

        houveMudancaDeConfiguracao(changes) {
            if (!changes || typeof changes !== 'object') return false;
            return CHAVES_CONFIGURACAO_SINCRONIZAVEL.some((chave) => Object.prototype.hasOwnProperty.call(changes, chave));
        }

        async sincronizarMenusContexto(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.contextMenus || !apiChrome.storage || !apiChrome.storage.sync) return;
            try {
                const config = await apiChrome.storage.sync.get(['comportamentoCliqueIcone']);
                const isAcoesRapidas = config && config.comportamentoCliqueIcone === 'acoes_rapidas';
                apiChrome.contextMenus.removeAll(() => {
                    apiChrome.contextMenus.create({ id: 'toggle-comportamento-icone', type: 'checkbox', title: 'Ações Rápidas no Ícone', checked: Boolean(isAcoesRapidas), contexts: ['action'] }, () => { });
                    apiChrome.contextMenus.create({ id: 'configurar-extensao', title: 'Configurar Extensão', contexts: ['action'] }, () => { });
                    apiChrome.contextMenus.create({ id: 'abrir-painel-extensao', title: 'Desenvolvimento (Página do Plugin)', contexts: ['action'] }, () => { });
                });
            } catch (_) { }
        }

        tratarCliqueIconeExtensao(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome) return;
            if (this._timerCliqueIcone !== undefined && this._timerCliqueIcone !== null) {
                clearTimeout(this._timerCliqueIcone);
                this._timerCliqueIcone = null;
                if (apiChrome.runtime && typeof apiChrome.runtime.openOptionsPage === 'function') {
                    apiChrome.runtime.openOptionsPage();
                }
                return;
            }
            this._timerCliqueIcone = setTimeout(async () => {
                this._timerCliqueIcone = null;
                try {
                    const atual = await apiChrome.storage.sync.get(['modoTurbo']);
                    const modoAtual = (atual && atual.modoTurbo) || 'global';
                    const proximoModo = modoAtual === 'global'
                        ? 'url'
                        : (modoAtual === 'url' ? 'desligado' : 'global');
                    await apiChrome.storage.sync.set({ modoTurbo: proximoModo });
                    this.desenharIconeVetorialFallback(proximoModo, 'acoes_rapidas', apiChrome);
                } catch (_) { }
            }, JANELA_DUPLO_CLIQUE_ICONE_MS);
        }

        /* Aplica alteracoes imediatamente no runtime local + storage.local sem disparar gravacao imediata em storage.sync */
        async aplicarConfigLocalEAgendarSync(payload = {}, chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.local) return { ok: false };
            try {
                const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                const atualPend = (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object')
                    ? { ...loc[CHAVE_CONFIG_SYNC_PENDENTE] } : {};
                if (payload && typeof payload === 'object') {
                    const ks = Object.keys(payload);
                    for (let i = 0; i < ks.length; i++) {
                        const k = ks[i];
                        if (SET_CHAVES_SYNC.has(k) || k.startsWith(PREFIXO_CHAVE_PERFIL_CFG)) {
                            atualPend[k] = clonarValorSimples(payload[k]);
                        }
                    }
                }
                /* BUG-81: Atualizar cacheConfigJusGov na RAM (storage.session) ANTES de gravar storage.local,
                 * para que listeners de storage.onChanged (background, popup, options) ja enxerguem o novo estado ao vivo! */
                if (apiChrome.storage.session) {
                    try {
                        const sess = await apiChrome.storage.session.get('cacheConfigJusGov');
                        if (sess && sess.cacheConfigJusGov && typeof sess.cacheConfigJusGov === 'object' && typeof sess.cacheConfigJusGov.modoTurbo === 'string') {
                            const baseSess = { ...sess.cacheConfigJusGov, ...atualPend };
                            await apiChrome.storage.session.set({ cacheConfigJusGov: baseSess });
                        }
                    } catch (_) { }
                }
                await apiChrome.storage.local.set({ [CHAVE_CONFIG_SYNC_PENDENTE]: atualPend });
                const cfgSincronizada = await this.sincronizarEstado(apiChrome, dependencias);
                return { ok: true, config: cfgSincronizada };
            } catch (_) {
                return { ok: false };
            }
        }

        /* Sincronizacao coalescida para chrome.storage.sync (disparada por alarme de 5 min ou ao fechar o navegador):
         * compara diferencas reais com a nuvem e grava em lote unico apenas chaves permitidas <= 8KB. */
        async executarSincronizacaoNuvemCoalescida(chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage) return false;
            try {
                if (apiChrome.storage.local && apiChrome.storage.sync) {
                    const [dadosLocais, dadosSyncAtuais] = await Promise.all([
                        apiChrome.storage.local.get(null),
                        apiChrome.storage.sync.get(null)
                    ]);
                    if (dadosLocais && typeof dadosLocais === 'object') {
                        const origemCombinada = { ...dadosLocais };
                        const pendenteObj = dadosLocais[CHAVE_CONFIG_SYNC_PENDENTE];
                        if (pendenteObj && typeof pendenteObj === 'object') {
                            Object.assign(origemCombinada, pendenteObj);
                        }
                        const payloadSync = {};
                        const chaves = Object.keys(origemCombinada);
                        for (let i = 0; i < chaves.length; i++) {
                            const k = chaves[i];
                            const ehChavePermitida = SET_CHAVES_SYNC.has(k) || k.startsWith(PREFIXO_CHAVE_PERFIL_CFG);
                            if (!ehChavePermitida) continue;
                            if (dadosSyncAtuais && valoresIguaisConfig(dadosSyncAtuais[k], origemCombinada[k])) continue;
                            try {
                                const bytes = JSON.stringify({ [k]: origemCombinada[k] }).length;
                                if (bytes <= LIMITE_BYTES_ITEM_SYNC) {
                                    payloadSync[k] = origemCombinada[k];
                                }
                            } catch (_) { }
                        }
                        if (Object.keys(payloadSync).length > 0) {
                            const ativoLocal = typeof dadosLocais[CHAVE_PERFIL_ATIVO] === 'string' ? dadosLocais[CHAVE_PERFIL_ATIVO].trim() : '';
                            if (ativoLocal && Object.keys(payloadSync).some(k => !k.startsWith(PREFIXO_CHAVE_PERFIL_CFG) && k !== CHAVE_LISTA_PERFIS && k !== 'regrasMapeamentoElementos')) {
                                payloadSync[CHAVE_SYNC_PERFIL_BASE_TOP] = ativoLocal;
                            }
                            await apiChrome.storage.sync.set(payloadSync);
                        }
                        if (pendenteObj && typeof apiChrome.storage.local.remove === 'function') {
                            await apiChrome.storage.local.remove([CHAVE_CONFIG_SYNC_PENDENTE]);
                        }
                    }
                }
                await this.sincronizarEstado(apiChrome, dependencias);
                return true;
            } catch (_) {
                return false;
            }
        }

        /* Roteador unificado das requisicoes IPC de Perfis de Uso (FEATS-34/35). */
        async gerenciarRequisicaoPerfil(msg, chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!msg || typeof msg.acao !== 'string') return { ok: false };
            try {
                if (msg.acao === 'OBTER_PERFIS') {
                    const catalogo = await this.carregarCatalogoPerfis(apiChrome);
                    const syncData = (await apiChrome.storage.sync.get(['listaPerfis', 'perfilAtivoId'])) || {};
                    const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
                    if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
                    const estrutura = this.garantirEstruturaPerfis(syncData, catalogo);
                    if (!ativoLocal || ativoLocal !== estrutura.perfilAtivoId) {
                        await this.salvarPerfilAtivoLocal(estrutura.perfilAtivoId, apiChrome);
                    }
                    if (estrutura.alteracoes && Object.keys(estrutura.alteracoes).length > 0) {
                        await apiChrome.storage.sync.set(estrutura.alteracoes);
                    }
                    return { ok: true, listaPerfis: estrutura.listaPerfis, perfilAtivoId: estrutura.perfilAtivoId };
                }
                if (msg.acao === 'ALTERNAR_PERFIL') {
                    const res = await this.alternarPerfil(msg.perfilId, apiChrome);
                    let miniTipExibidoNaAba = false;
                    if (res && res.ok) {
                        await this.sincronizarEstado(apiChrome, dependencias);
                        const nomePerfil = (res.perfil && res.perfil.nome) ? res.perfil.nome : res.perfilAtivoId;
                        try {
                            if (apiChrome && apiChrome.runtime && typeof apiChrome.runtime.sendMessage === 'function') {
                                apiChrome.runtime.sendMessage({ acao: 'PERFIL_ALTERADO', perfilId: res.perfilAtivoId, nomePerfil }).catch(() => { });
                            }
                        } catch (_) { }
                        if (msg.exibirMiniTip !== false && apiChrome && apiChrome.tabs && typeof apiChrome.tabs.query === 'function') {
                            try {
                                const abas = await apiChrome.tabs.query({ active: true, lastFocusedWindow: true });
                                const abaAtiva = Array.isArray(abas) ? abas[0] : null;
                                if (abaAtiva && abaAtiva.id) {
                                    await apiChrome.tabs.sendMessage(abaAtiva.id, {
                                        acao: 'exibirMiniTipGlobal',
                                        mensagem: `Perfil de Uso:\n${nomePerfil}`,
                                        corBorda: '#2563eb'
                                    }, { frameId: 0 });
                                    miniTipExibidoNaAba = true;
                                }
                            } catch (_) { }
                        }
                    }
                    return res ? { ...res, miniTipExibidoNaAba } : { ok: false };
                }
                if (msg.acao === 'CRIAR_PERFIL') {
                    const res = await this.criarPerfil(msg.nome, { origem: msg.origem || 'padrao', ativar: msg.ativar !== false }, apiChrome);
                    if (res && res.ok) await this.sincronizarEstado(apiChrome, dependencias);
                    return res || { ok: false };
                }
                if (msg.acao === 'RENOMEAR_PERFIL') {
                    return (await this.renomearPerfil(msg.perfilId, msg.novoNome, apiChrome)) || { ok: false };
                }
                if (msg.acao === 'EXCLUIR_PERFIL') {
                    return (await this.excluirPerfil(msg.perfilId, apiChrome)) || { ok: false };
                }
                if (msg.acao === 'RESETAR_PERFIS') {
                    const res = await this.resetarPerfis(msg.escopo || 'atual', apiChrome, { perfilPreferidoId: msg.perfilPreferidoId });
                    if (res && res.ok) await this.sincronizarEstado(apiChrome, dependencias);
                    return res || { ok: false };
                }
            } catch (err) {
                return { ok: false, erro: err ? err.message : 'Erro ao processar perfil.' };
            }
            return { ok: false };
        }
    }

    Object.freeze(LibConfigIcone.prototype);
    return Object.freeze(LibConfigIcone);
}));