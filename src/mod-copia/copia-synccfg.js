/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-synccfg.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COPIA — Sincronização de Configurações e IPC (DRY + Herança)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-synccfg.js
 * - Classe Exportada: CopiaSyncCfg (window.JusGovCopiaSyncCfg)
 * - Herança: extends BaseSyncCfg (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovCopiaSyncCfg.NULL_OBJECT
 * - Métodos Públicos: inicializar(), aplicarPacoteConfig(pacote), removerOuvintes(), destruir()
 * - Regras / Seções: ENG-00 (Prioridade -1: <módulo>-synccfg.js), ARQ-10 (Seção 6.262)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) RESPONSABILIDADE ÚNICA (ENG-00):
 *    Isola 100% da leitura inicial (`storage.sync` + `storage.local`), escuta reativa
 *    (`chrome.storage.onChanged`) e mensagens runtime (`chrome.runtime.onMessage`) de
 *    `mod-copia`, unificando em um único método DRY `aplicarPacoteConfig(pacote)`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovCopiaSyncCfg = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseSyncCfg === 'function')
        ? gGlobal.JusGovBaseSyncCfg
        : class {
            registrarOuvintesIpc() { return false; }
            removerOuvintes() { return false; }
            destruir() { return true; }
        };

    const CHAVES_SYNC_COPIA = Object.freeze([
        'modoTurbo', 'urlsTurbo', 'manterFormatacaoBasica', 'nivelFiltroFormatacao',
        'selecaoEditavelAtiva', 'modoPlaceholdersMinutasHtml', 'placeholdersMinutasHtmlAtivo',
        'colagemBotaoDireitoAtiva', 'capturaBotoesMouse4e5Ativa', 'colarBotaoMeioAtivo',
        'navegacaoTecladoCamposAtiva', 'caixaEntradaRapidaAtiva', 'validacaoMatematicaAtiva',
        'tempoConferenciaDocumentosMs', 'modoExibicaoValidacao', 'posicaoAvisosValidacao',
        'tempoFlashBorderMs', 'corFlashBorder', 'marcadorConteudoColadoAtivo',
        'presetMarcadorColado', 'corContornoMarcadorColado', 'corFundoMarcadorColado',
        'opacidadeFundoMarcadorColado', 'estiloBadgeMarcadorColado', 'tipoContornoMarcadorColado',
        'modoRetirarSelecao', 'minimoCaracteresInterface', 'separadorAcumulador',
        'incluirSeparadorFinalAcumulador', 'separadorTabelas', 'modoShiftCnj',
        'promptF1Gemini', 'converterCabecalhoPjeAtivo', 'atalhoF1GeminiAtivo',
        'ativoAmpuletas', 'tempoExibicaoAlertaMs', 'regrasMapeamentoElementos'
    ]);

    const CHAVES_LOCAL_CLIPBOARD = Object.freeze([
        'ultimoClipboardInterno', 'ultimoClipboardAnteriorInterno', 'historicoClipboardInterno'
    ]);

    const NULL_SYNC_CFG = Object.freeze({
        inicializar: () => false,
        aplicarPacoteConfig: () => false,
        removerOuvintes: () => false,
        destruir: () => true
    });

    class CopiaSyncCfg extends BasePai {
        #deps = {};

        constructor(deps = {}) {
            super('CopiaSyncCfg');
            this.#deps = deps && typeof deps === 'object' ? deps : {};
        }

        static get NULL_OBJECT() {
            return NULL_SYNC_CFG;
        }

        static get CHAVES_SYNC() {
            return CHAVES_SYNC_COPIA;
        }

        aplicarPacoteConfig(pacote) {
            if (!pacote || typeof pacote !== 'object') return false;
            if (typeof this.#deps.aplicarEstadoConfig === 'function') {
                try {
                    this.#deps.aplicarEstadoConfig(pacote);
                    return true;
                } catch (_) { }
            }
            return false;
        }

        #tratarStorageChanged(changes, area) {
            if (!changes || typeof changes !== 'object') return;
            if (area === 'sync') {
                const pacoteDelta = {};
                let temMudanca = false;
                const chaves = Object.keys(changes);
                for (let i = 0; i < chaves.length; i++) {
                    const k = chaves[i];
                    if (changes[k] && Object.prototype.hasOwnProperty.call(changes[k], 'newValue')) {
                        pacoteDelta[k] = changes[k].newValue;
                        temMudanca = true;
                    }
                }
                if (temMudanca) {
                    this.aplicarPacoteConfig(pacoteDelta);
                }
                return;
            }
            if (area === 'local') {
                if (changes.ultimoClipboardInterno && changes.ultimoClipboardInterno.newValue) {
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = changes.ultimoClipboardInterno.newValue;
                }
                if (changes.ultimoClipboardAnteriorInterno && changes.ultimoClipboardAnteriorInterno.newValue) {
                    window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = changes.ultimoClipboardAnteriorInterno.newValue;
                }
                if (changes.historicoClipboardInterno && Array.isArray(changes.historicoClipboardInterno.newValue)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__ = changes.historicoClipboardInterno.newValue.slice(0, 2);
                }
                if (changes.ultimaNotificacaoCopiaGlobal && changes.ultimaNotificacaoCopiaGlobal.newValue) {
                    const notifCopia = changes.ultimaNotificacaoCopiaGlobal.newValue;
                    const meuId = (typeof window !== 'undefined') ? window.__JUSGOV_ID_INSTANCIA_FRAME__ : null;
                    if (notifCopia && (!meuId || notifCopia.idOrigem !== meuId) && typeof this.#deps.limparFlashBorder === 'function') {
                        this.#deps.limparFlashBorder();
                    }
                }
                if (changes.ultimaColagemConfirmadaGlobal && changes.ultimaColagemConfirmadaGlobal.newValue) {
                    const notifColagem = changes.ultimaColagemConfirmadaGlobal.newValue;
                    const meuId = (typeof window !== 'undefined') ? window.__JUSGOV_ID_INSTANCIA_FRAME__ : null;
                    if (notifColagem && (!meuId || notifColagem.idOrigem !== meuId) && typeof this.#deps.confirmarColagemRemota === 'function') {
                        this.#deps.confirmarColagemRemota(notifColagem.texto || '');
                    }
                }
            }
        }

        #tratarMensagemRuntime(msg) {
            if (!msg || typeof msg !== 'object') return false;
            if (msg.acao === 'executarDeselecaoGeral') {
                if (typeof this.#deps.executarDeselecaoRemota === 'function') {
                    this.#deps.executarDeselecaoRemota();
                }
                return false;
            }
            if (msg.acao === 'exibirMiniTipGlobal') {
                if (typeof window !== 'undefined' && window === window.top && typeof this.#deps.projetarMiniTip === 'function') {
                    this.#deps.projetarMiniTip(String(msg.mensagem || ''), String(msg.corBorda || '#2563eb'));
                }
                return false;
            }
            if (msg.acao === 'atualizarEstadoModulo') {
                this.aplicarPacoteConfig(msg);
                return false;
            }
            return false;
        }

        inicializar() {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(CHAVES_LOCAL_CLIPBOARD, (resClip) => {
                        if (chrome.runtime && chrome.runtime.lastError) return;
                        if (!resClip) return;
                        if (resClip.ultimoClipboardInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                            window.__JUSGOV_ULTIMO_CLIPBOARD__ = resClip.ultimoClipboardInterno;
                        }
                        if (resClip.ultimoClipboardAnteriorInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) {
                            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = resClip.ultimoClipboardAnteriorInterno;
                        }
                        if (Array.isArray(resClip.historicoClipboardInterno) && !Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                            window.__JUSGOV_HISTORICO_CLIPBOARD__ = resClip.historicoClipboardInterno.slice(0, 2);
                        }
                    });
                }
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    chrome.storage.sync.get(CHAVES_SYNC_COPIA, (cfg) => {
                        if (chrome.runtime && chrome.runtime.lastError) return;
                        if (cfg) this.aplicarPacoteConfig(cfg);
                    });
                }
                this.registrarOuvintesIpc(
                    (changes, area) => this.#tratarStorageChanged(changes, area),
                    (msg) => this.#tratarMensagemRuntime(msg)
                );
            } catch (_) { }
            return true;
        }
    }

    Object.freeze(CopiaSyncCfg.prototype);
    return Object.freeze(CopiaSyncCfg);
}));
