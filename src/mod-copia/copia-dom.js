/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-dom.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COPIA — Registro de Eventos DOM e Ciclo de Vida (AbortController)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-dom.js
 * - Classe Exportada: CopiaDomListeners (window.JusGovCopiaDomListeners)
 * - Herança: extends BaseDomListeners (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovCopiaDomListeners.NULL_OBJECT
 * - Métodos Públicos: registrarListenersDOM(), destruirCicloVidaFrame()
 * - Regras / Seções: ENG-00 (Prioridade -1: <módulo>-dom.js), BUG-01 (Teardown), ARQ-10 (Seção 6.262)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) RESPONSABILIDADE ÚNICA (ENG-00):
 *    Isola 100% dos registros `addEventListener`, `AbortController`, `pagehide`/`pageshow`
 *    e desmontagem determinística de listeners DOM de `copia-selecionar.js`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovCopiaDomListeners = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseDomListeners === 'function')
        ? gGlobal.JusGovBaseDomListeners
        : class {
            criarNovoCicloAbort() { return (new AbortController()).signal; }
            abortarCicloAtual() { }
            protegerContexto(fn) { return fn; }
            destruir() { return true; }
        };

    const NULL_DOM = Object.freeze({
        registrarListenersDOM: () => null,
        destruirCicloVidaFrame: () => true
    });

    class CopiaDomListeners extends BasePai {
        #deps = {};

        constructor(deps = {}) {
            super('CopiaDomListeners');
            this.#deps = deps && typeof deps === 'object' ? deps : {};
        }

        static get NULL_OBJECT() {
            return NULL_DOM;
        }

        destruirCicloVidaFrame() {
            if (typeof this.#deps.aoAntesDeDestruir === 'function') {
                try { this.#deps.aoAntesDeDestruir(); } catch (_) { }
            }
            this.abortarCicloAtual();
            if (typeof window !== 'undefined' && window.__JUSGOV_ABORT_CONTROLLER__) {
                try { window.__JUSGOV_ABORT_CONTROLLER__.abort(); } catch (_) { }
                window.__JUSGOV_ABORT_CONTROLLER__ = null;
            }
            try {
                if (typeof document !== 'undefined') {
                    document.querySelectorAll('#jusgov-modal-mapeamento-regra, .jusgov-dialog-input-rapido, #jusgov-hospedeiro-top-layer, #jusgov-inspetor-tempo-real, [data-jusgov-inspetor="true"]').forEach((el) => el.remove());
                }
            } catch (_) { }
            if (typeof window !== 'undefined') {
                window.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
            }
            return true;
        }

        registrarListenersDOM() {
            if (typeof window !== 'undefined' && window.__JUSGOV_ABORT_CONTROLLER__) {
                try { window.__JUSGOV_ABORT_CONTROLLER__.abort(); } catch (_) { }
            }
            const signal = this.criarNovoCicloAbort();
            if (typeof window !== 'undefined') {
                window.__JUSGOV_MOTOR_SELECAO_ATIVO__ = true;
                window.__JUSGOV_ABORT_CONTROLLER__ = { abort: () => this.abortarCicloAtual(), signal };
            }
            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.__JUSGOV_DOC_LISTENERS_ATIVOS__ = true;
            }

            signal.addEventListener('abort', () => {
                if (typeof this.#deps.aoAbortarSignal === 'function') {
                    try { this.#deps.aoAbortarSignal(); } catch (_) { }
                }
            }, { once: true });

            window.addEventListener('pagehide', (e) => {
                if (!e || !e.persisted) {
                    this.destruirCicloVidaFrame();
                }
            }, { capture: true, signal });

            window.addEventListener('pageshow', (e) => {
                if (e && e.persisted && typeof this.#deps.aoRestaurarBfCache === 'function') {
                    this.#deps.aoRestaurarBfCache();
                }
            }, { capture: true, signal, passive: true });

            if (typeof this.#deps.aoInicializarObservadores === 'function') {
                this.#deps.aoInicializarObservadores(signal);
            }

            const p = (fn) => (typeof fn === 'function')
                ? this.protegerContexto(fn, () => this.destruirCicloVidaFrame())
                : (() => { });

            const d = this.#deps;
            if (typeof d.tratarBotoesLaterais4e5 === 'function') {
                const fnLat = p(d.tratarBotoesLaterais4e5);
                window.addEventListener('pointerdown', fnLat, { capture: true, signal });
                window.addEventListener('mousedown', fnLat, { capture: true, signal });
                window.addEventListener('pointerup', fnLat, { capture: true, signal });
                window.addEventListener('mouseup', fnLat, { capture: true, signal });
                window.addEventListener('auxclick', fnLat, { capture: true, signal });
                window.addEventListener('keydown', fnLat, { capture: true, signal });
                window.addEventListener('keyup', fnLat, { capture: true, signal });
            }

            document.addEventListener('mousedown', p(d.aoPressionarBotaoMouse), { capture: true, signal });
            document.addEventListener('mousemove', p(d.aoMoverMouse), { capture: true, passive: true, signal });
            document.addEventListener('mouseup', p(d.aoSoltarBotaoMouse), { capture: true, signal });
            document.addEventListener('focusin', p(d.lidarFocoInteligente), { capture: true, signal });
            document.addEventListener('auxclick', p(d.aoClicarAuxiliarMouse), { capture: true, signal });
            document.addEventListener('click', p(d.aoClicar), { capture: true, signal });
            document.addEventListener('dblclick', p(d.aoDuploCliqueInput), { capture: true, signal });
            document.addEventListener('change', p(d.aoAlterarSelectComAlt), { capture: true, signal });
            document.addEventListener('contextmenu', p(d.aoAbrirMenuContexto), { capture: true, signal });
            window.addEventListener('keydown', p(d.aoPressionarTecla), { capture: true, signal });
            window.addEventListener('help', p(d.aoHelpF1), { capture: true, signal });
            window.addEventListener('keyup', p(d.aoSoltarTecla), { capture: true, passive: true, signal });

            const ocultarInsp = p(d.ocultarInspetorEmTodosFrames);
            window.addEventListener('blur', ocultarInsp, { signal });
            document.addEventListener('mouseleave', ocultarInsp, { signal });
            document.addEventListener('visibilitychange', p(() => {
                if (document.hidden && typeof d.ocultarInspetorEmTodosFrames === 'function') {
                    d.ocultarInspetorEmTodosFrames();
                } else if (!document.hidden && typeof d.restaurarSelecaoCampoEditavel === 'function') {
                    d.restaurarSelecaoCampoEditavel();
                }
            }), { signal });
            document.addEventListener('mouseout', (evOut) => {
                if (evOut && !evOut.relatedTarget && !window.__JUSGOV_MODO_BARALHO__ && typeof d.ocultarInspetorTempoReal === 'function') {
                    d.ocultarInspetorTempoReal();
                }
            }, { signal });
            window.addEventListener('message', p(d.aoMensagemCrossFrame), { signal });

            window.addEventListener('beforecopy', p(d.aoBeforeCopy), { capture: true, signal });
            window.addEventListener('copy', p(d.aoCopy), { capture: true, signal });
            window.addEventListener('jusgov:copia-nativa-interceptada', p(d.aoCopiaNativaMain), { capture: true, signal });
            window.addEventListener('selectstart', p(d.aoSelectStart), { capture: true, signal });
            document.addEventListener('paste', p(d.aoPastePassivo), { capture: true, signal, passive: true });
            document.addEventListener('selectionchange', p(d.aoSelectionChange), { capture: true, signal });
            window.addEventListener('load', p(d.aoLoadSubframe), { capture: true, passive: true, signal });
            document.addEventListener('mouseup', p(d.aoMouseUpRedeSeguranca), { capture: true, passive: true, signal });
            window.addEventListener('blur', p(d.aoWindowBlur), { passive: true, signal });
            window.addEventListener('focus', p(d.restaurarSelecaoCampoEditavel), { passive: true, signal });
            window.addEventListener('scroll', p(d.aoScrollGlobal), { capture: true, passive: true, signal });
            document.addEventListener('scroll', p(d.aoScrollGlobal), { capture: true, passive: true, signal });
            window.addEventListener('resize', p(d.aoScrollGlobal), { passive: true, signal });

            return signal;
        }
    }

    Object.freeze(CopiaDomListeners.prototype);
    return Object.freeze(CopiaDomListeners);
}));
