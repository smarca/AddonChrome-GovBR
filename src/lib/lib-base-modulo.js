/* ==========================================================================
 * ARQUIVO: src/lib/lib-base-modulo.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs — Classes-Base POO Reutilizáveis (Herança & Polimorfismo)
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-base-modulo.js
 * - Classes Exportadas:
 *     BaseModulo (self.JusGovBaseModulo / window.JusGovBaseModulo),
 *     BaseSyncCfg (self.JusGovBaseSyncCfg / window.JusGovBaseSyncCfg),
 *     BaseDomListeners (self.JusGovBaseDomListeners / window.JusGovBaseDomListeners)
 * - Métodos Polimórficos: inicializar(), aplicarConfig(cfg), registrarEventos(signal), destruir()
 * - Regras / Seções: ENG-00 (Prioridade -1: 15 Pilares POO — Herança extends, Polimorfismo,
 *   Encapsulamento, Abstração, Reusabilidade), ARQ-10 (Seção 6.262)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) HERANÇA REAL (`extends`) E POLIMORFISMO:
 *    Fornece 3 classes-base abstratas reutilizáveis por todos os módulos do projeto:
 *    - `BaseModulo`: ciclo de vida padronizado (`inicializar`, `aplicarConfig`, `destruir`),
 *      verificação segura de contexto vivo da extensão e encapsulamento de estado `#ativo`.
 *    - `BaseSyncCfg extends BaseModulo`: gerencia `chrome.storage.onChanged` e
 *      `chrome.runtime.onMessage` com teardown determinístico (`removerOuvintes()`),
 *      eliminando duplicação de boilerplate de sincronização entre módulos.
 *    - `BaseDomListeners extends BaseModulo`: gerencia `AbortController`, guarda
 *      `protegerContexto(fn)` e desmontagem atômica via `destruir()`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const exp = fabrica();
        raiz.JusGovBaseModulo = exp.BaseModulo;
        raiz.JusGovBaseSyncCfg = exp.BaseSyncCfg;
        raiz.JusGovBaseDomListeners = exp.BaseDomListeners;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class BaseModulo {
        #nome = 'BaseModulo';
        #inicializado = false;
        #ativo = true;

        constructor(nome = 'BaseModulo') {
            this.#nome = String(nome || 'BaseModulo');
        }

        get nomeModulo() {
            return this.#nome;
        }

        get inicializado() {
            return this.#inicializado;
        }

        get ativo() {
            return this.#ativo;
        }

        set ativo(v) {
            this.#ativo = Boolean(v);
        }

        marcarInicializado(valor = true) {
            this.#inicializado = Boolean(valor);
        }

        verificarContextoExtensaoVivo() {
            try {
                if (typeof chrome === 'undefined' || !chrome.runtime) return true;
                return Boolean(chrome.runtime.id);
            } catch (_) {
                return false;
            }
        }

        inicializar() {
            this.#inicializado = true;
            return true;
        }

        aplicarConfig(_cfg) {
            return true;
        }

        destruir() {
            this.#inicializado = false;
            return true;
        }
    }

    class BaseSyncCfg extends BaseModulo {
        #ouvinteStorage = null;
        #ouvinteMensagem = null;
        #ouvintesRegistrados = false;

        constructor(nome = 'BaseSyncCfg') {
            super(nome);
        }

        get ouvintesRegistrados() {
            return this.#ouvintesRegistrados;
        }

        registrarOuvintesIpc(aoMudarStorageFn, aoReceberMensagemFn) {
            this.removerOuvintes();
            if (typeof chrome === 'undefined') return false;
            try {
                if (typeof aoMudarStorageFn === 'function' && chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.addListener === 'function') {
                    this.#ouvinteStorage = (changes, area) => {
                        if (!this.verificarContextoExtensaoVivo()) {
                            this.removerOuvintes();
                            return;
                        }
                        try { aoMudarStorageFn(changes, area); } catch (_) { }
                    };
                    chrome.storage.onChanged.addListener(this.#ouvinteStorage);
                }
                if (typeof aoReceberMensagemFn === 'function' && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.addListener === 'function') {
                    this.#ouvinteMensagem = (msg, sender, sendResponse) => {
                        if (!this.verificarContextoExtensaoVivo()) {
                            this.removerOuvintes();
                            return false;
                        }
                        try { return aoReceberMensagemFn(msg, sender, sendResponse); } catch (_) { return false; }
                    };
                    chrome.runtime.onMessage.addListener(this.#ouvinteMensagem);
                }
                this.#ouvintesRegistrados = true;
                return true;
            } catch (_) {
                return false;
            }
        }

        removerOuvintes() {
            if (!this.#ouvintesRegistrados) return false;
            this.#ouvintesRegistrados = false;
            try {
                if (this.#ouvinteStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.removeListener === 'function') {
                    chrome.storage.onChanged.removeListener(this.#ouvinteStorage);
                }
            } catch (_) { }
            try {
                if (this.#ouvinteMensagem && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.removeListener === 'function') {
                    chrome.runtime.onMessage.removeListener(this.#ouvinteMensagem);
                }
            } catch (_) { }
            this.#ouvinteStorage = null;
            this.#ouvinteMensagem = null;
            return true;
        }

        destruir() {
            this.removerOuvintes();
            return super.destruir();
        }
    }

    class BaseDomListeners extends BaseModulo {
        #abortController = null;

        constructor(nome = 'BaseDomListeners') {
            super(nome);
        }

        get signal() {
            return this.#abortController ? this.#abortController.signal : null;
        }

        criarNovoCicloAbort() {
            this.abortarCicloAtual();
            this.#abortController = new AbortController();
            return this.#abortController.signal;
        }

        abortarCicloAtual() {
            if (this.#abortController) {
                try { this.#abortController.abort(); } catch (_) { }
                this.#abortController = null;
            }
        }

        protegerContexto(fn, aoInvalidar = null) {
            return (...args) => {
                if (!this.verificarContextoExtensaoVivo()) {
                    if (typeof aoInvalidar === 'function') {
                        try { aoInvalidar(); } catch (_) { }
                    }
                    return;
                }
                return fn(...args);
            };
        }

        registrarEventos(_signal) {
            return true;
        }

        destruir() {
            this.abortarCicloAtual();
            return super.destruir();
        }
    }

    return Object.freeze({
        BaseModulo: Object.freeze(BaseModulo),
        BaseSyncCfg: Object.freeze(BaseSyncCfg),
        BaseDomListeners: Object.freeze(BaseDomListeners)
    });
}));
