/* ==========================================================================
 * Nome do arquivo: mod-anti-ampulheta.js
 * PROJETO: JusGovBR — Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 1 — ANTI-AMPULHETAS: Otimização de Performance e Desbloqueio
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-anti-ampulheta/mod-anti-ampulheta.js
 * - Classe Exportada: ModuloAntiAmpulheta (window.JusGovModuloAntiAmpulheta)
 * - Métodos Públicos: inicializar(doc), destruir(), desbloquearInterface(doc), atualizarConfiguracoes(cfg), static get NULL_OBJECTS
 * - Dependências: 7 folhas CSS modulares (pje, eproc, seeu-projudi, saj, pdpj-stf-stj, creta, generico)
 * - Eventos DOM: MutationObserver defensivo, pagehide (!persisted -> destruir via AbortController)
 * - Regras / Seções: Diretrizes 11/16, ADR-006 (Null Objects c/ setters no-op), BUG-01 (teardown determinístico)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Fachada Principal (Facade) e Orquestrador central do Grupo 1 de opções do addon:
 *    "ANTI-AMPULHETAS: Acelerador Visual e Otimizações de Performance".
 *    Gerencia o ciclo de vida da neutralização de bloqueios visuais transientes,
 *    curtinas AJAX e cursores de espera órfãos, com preservação estrita e incondicional
 *    de travas em lote (ex: #mpProgresso, barras de progresso, confirmações decisórias).
 * 2) TOLERÂNCIA A FALHAS E PADRÃO NULL OBJECT (DIRETRIZ ROOT 16 / ADR-006):
 *    Se qualquer componente ou submódulo for excluído fisicamente ou falhar ao carregar,
 *    instancia automaticamente Null Objects seguros com métodos no-op estáveis, impedindo
 *    qualquer interrupção por TypeError ou ReferenceError em 'use strict'.
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Definição dos Null Objects para Grupo 1 com getters e setters no-op.
 *    Passo 1.2: Injeção de dependências e configuração no construtor da classe ModuloAntiAmpulheta.
 *    Passo 1.3: Registro do ciclo de vida DOM governado por AbortController e MutationObserver
 *               com auto-desmontagem em pagehide (!event.persisted) para evitar vazamento
 *               de memória em subframes/iframes dinâmicos (BUG-01).
 *    Passo 1.4: Método desbloquearInterface(doc) com checagem O(1) de travas de lote
 *               antes de sanitizar cursores ou remover overlays espúrios.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 1, 9, 11, 14 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Módulo mod-anti-ampulheta)
 * - docs/04_RADAR_BUGS_E_QUALIDADE.md (BUG-01: Ciclo de vida determinístico)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004 e ADR-006)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloAntiAmpulheta = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* =====================================================================
     * PASSO 1.1: DEFINIÇÃO DE NULL OBJECTS IMUTÁVEIS PARA TOLERÂNCIA TOTAL A FALHAS
     * Getters e setters no-op garantem compatibilidade total com 'use strict' (Seção 6.64),
     * impedindo TypeError ao atribuir propriedades quando um submódulo estiver ausente.
     * ===================================================================== */
    const NULL_ANTI_AMPULHETA = Object.freeze({
        get ativo() { return false; },
        set ativo(_) { },
        get urls() { return Object.freeze([]); },
        set urls(_) { },
        inicializar: () => false,
        destruir: () => false,
        desbloquearInterface: () => false,
        atualizarConfiguracoes: () => false,
        blindarCSS: () => false,
        garantirObservadorBlindagem: () => false,
        definirAtivoAmpuletas: () => false
    });

    /* Lista imutável dos 7 arquivos CSS especializados do Grupo 1 */
    const ARQUIVOS_CSS_ESPECIALIZADOS = Object.freeze([
        'pje-anti-ampulheta.css',
        'eproc-anti-ampulheta.css',
        'seeu-projudi-anti-ampulheta.css',
        'saj-anti-ampulheta.css',
        'pdpj-stf-stj-anti-ampulheta.css',
        'creta-anti-ampulheta.css',
        'generico-anti-ampulheta.css'
    ]);

    /* Matriz ordenada de prioridade dos sistemas judiciais (Seção 6.103 / FEAT-20) */
    const MATRIZ_SISTEMAS_JUDICIAIS = Object.freeze([
        Object.freeze({ id: 'pje', nome: 'PJe', css: 'pje-anti-ampulheta.css', padrao: /\bpje\b|pje\.|\.jus\.br\/pje/i }),
        Object.freeze({ id: 'eproc', nome: 'Eproc', css: 'eproc-anti-ampulheta.css', padrao: /\beproc\b|eproc\./i }),
        Object.freeze({ id: 'pdpj', nome: 'PDPJ', css: 'pdpj-stf-stj-anti-ampulheta.css', padrao: /\bpdpj\b|\bprevjud\b|stf\.jus\.br|stj\.jus\.br/i }),
        Object.freeze({ id: 'projudi', nome: 'Projudi', css: 'seeu-projudi-anti-ampulheta.css', padrao: /\bprojudi\b|projudi\./i }),
        Object.freeze({ id: 'saj', nome: 'SAJ', css: 'saj-anti-ampulheta.css', padrao: /\besaj\b|\bsaj\b|esaj\.|tjsp\.jus\.br\/esaj/i }),
        Object.freeze({ id: 'creta', nome: 'Creta', css: 'creta-anti-ampulheta.css', padrao: /\bcreta\b|creta\./i }),
        Object.freeze({ id: 'seeu', nome: 'SEEU', css: 'seeu-projudi-anti-ampulheta.css', padrao: /\bseeu\b|seeu\./i })
    ]);

    /* =====================================================================
     * FOLHA DE ESTILO CONSOLIDADA ANTI-AMPULHETAS (DESACOPLADA EM SEÇÃO 6.102 / ARQ-03)
     * ===================================================================== */
    const TURBO_CSS = `
        /* ANIQUILAÇÃO DOS LOADERS E SPINNERS
           O PORQUÊ: O PJe bloqueia a tela inteira a cada requisição AJAX.
           O 'pointer-events: none' garante que o usuário possa continuar clicando através do fantasma do spinner. */
        [id="movimentarRegion:status.stop"],
        [id="movimentarRegion:status.start"],
        [id$=":status.start"],
        [id*="mploading" i],
        [class*="mploading" i],
        [id*="painelAguarde" i],
        [id*="modalAguarde" i],
        [class*="rich-mpnl-mask" i]:not([id*="mpProgresso" i]):not([id*="lote" i]),
        ngx-loading,
        .ngx-loading-backdrop,
        .loading-foreground,
        .block-ui-wrapper:not(:has(mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .block-ui-overlay:not(:has(mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .p-blockui:not(:has(mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .p-blockui-document:not(:has(mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .p-component-overlay:not(:has([role="dialog"], [role="alertdialog"], mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .ui-blockui:not(:has(mat-progress-bar, p-progressbar, .progress-bar, [role="progressbar"])),
        .ui-widget-overlay.ui-blockui,
        .swal2-Delta-loading,
        #divInfraAviso,
        #divInfraAvisoFundo,
        .infraAviso,
        .infraAvisoFundo,
        #divCarregando,
        .blockUI.blockOverlay,
        #disabledZone,
        #messageZone,
        #divAguarde,
        #mascaraAguarde,
        #divLoading,
        .seeu-loading,
        #bloqueioTela,
        .saj-loading,
        .k-loading-mask,
        .loadmask,
        pdpj-loading,
        ngx-spinner,
        .ngx-spinner-overlay,
        .br-loading-mask,
        #div_aguarde,
        #tela_bloqueio,
        #carregando_dados,
        mat-progress-spinner,
        mat-spinner,
        mat-mdc-progress-spinner,
        mat-mdc-spinner,
        .mat-progress-spinner,
        .mat-spinner,
        .mat-mdc-progress-spinner,
        .mat-mdc-spinner,
        p-progressspinner,
        p-progressSpinner,
        .p-progress-spinner,
        .p-progress-spinner-svg,
        .p-progress-spinner-circle,
        .spinner-border,
        .spinner-grow,
        [class*="progress-spinner" i],
        [class*="progressspinner" i],
        [class*="loading-spinner" i],
        .loading-overlay:not([id*="lote" i]):not([class*="lote" i]),
        .loader-overlay:not([id*="lote" i]):not([class*="lote" i]),
        .spinner-overlay:not([id*="lote" i]):not([class*="lote" i]),
        .pje-loading:not([id*="lote" i]):not([class*="lote" i]),
        [class*="pje-loading" i]:not([id*="lote" i]):not([class*="lote" i]),
        pdpj-spinner,
        pje-spinner,
        app-loading,
        app-spinner,
        [id*="spinner" i]:not([id*="lote" i]):not(.ui-spinner):not(.ui-spinner-input):not(p-spinner),
        [class*="spinner" i]:not([class*="lote" i]):not(.ui-spinner):not(.ui-spinner-input):not(p-spinner),
        [id*="carregando" i]:not([id*="lote" i]),
        [class*="carregando" i]:not([class*="lote" i]),
        .rf-st-mp,
        #toast-container:not(:has(.toast-error, .toast-warning)),
        .toast-container:not(:has(.toast-error, .toast-warning)),
        .toastr:not(:has(.toast-error, .toast-warning)),
        .ui-growl:not(:has(.ui-growl-message-error, .ui-growl-message-warn)),
        .p-toast:not(:has(.p-toast-message-error, .p-toast-message-warn)),
        .cdk-overlay-backdrop.cdk-overlay-dark-backdrop:empty {
            pointer-events: none !important;
            cursor: auto !important;
            opacity: 0.01 !important;
            z-index: -99999 !important;
        }

        /* PRESERVAÇÃO ESTRITA DE OPERAÇÕES EM LOTE / LOOP E BARRAS DE PROGRESSO REAIS (Diretriz Root 6.21) */
        #mpProgresso,
        #mpProgressoContainer,
        #mpProgressoCDiv,
        [id*="mpProgresso" i]:not(.rich-mpnl-mask-div),
        #divInfraProgresso,
        .infraBarraProgresso,
        [id*="infraProgresso" i],
        [class*="infraProgresso" i],
        #divInfraAviso[id*="Lote" i],
        .infraAviso[class*="Lote" i],
        .infraBarraProgressoContainer,
        #modalProcessandoLote,
        [id*="Lote" i][id*="Progresso" i],
        .progresso-lote,
        [id*="AssinaturaLote" i],
        [class*="assinatura-lote" i],
        .saj-lote-loading,
        .k-progressbar,
        [id*="lote" i][class*="modal" i],
        [id*="lote" i][class*="panel" i],
        [class*="lote" i][class*="modal" i],
        pje-assinatura-lote,
        pje-movimentacao-lote,
        mat-progress-bar,
        p-progressbar,
        .rich-progress-bar,
        .progress-bar,
        progress,
        [role="progressbar"],
        [id*="mdMensagemConfirmacao" i],
        [id*="mdMensagemLancamento" i],
        [id*="mdMensagemMovimentoNaoLancado" i],
        [id*="modalConfirmaLimpar" i],
        [id*="modalDescricaoNaoPreenchida" i],
        [id*="modalTipoLote" i],
        [id*="modalErros" i],
        .modal-anexos,
        .modal.fade.in,
        #divInfraDialogo,
        .infraDialogo,
        #divInfraMensagemConfirmacao,
        [role="dialog"]:has(mat-progress-bar, p-progressbar, .rich-progress-bar, .progress-bar, [role="progressbar"]),
        .rich-modalpanel:has(.rich-progress-bar, [id*="mpProgresso" i], [role="progressbar"]) {
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        #mpProgressoDiv,
        #mpProgressoCursorDiv,
        [id*="mpProgresso" i][class*="rich-mpnl-mask" i] {
            pointer-events: auto !important;
            cursor: wait !important;
            opacity: 0.55 !important;
            background-color: #000000 !important;
            z-index: 10490 !important;
        }

        /* ANIQUILAÇÃO TOTAL DE SPINNERS CIRCULARES MODERNOS (ANGULAR MATERIAL / PRIMENG / PJE 2.X / PREVJUD)
           O PORQUÊ: Loaders giratórios bloqueiam a visão e travam o foco do teclado nos modais de intimação. */
        mat-progress-spinner,
        mat-spinner,
        mat-mdc-progress-spinner,
        mat-mdc-spinner,
        .mat-progress-spinner,
        .mat-spinner,
        .mat-mdc-progress-spinner,
        .mat-mdc-spinner,
        p-progressspinner,
        p-progressSpinner,
        .p-progress-spinner,
        .p-progress-spinner-svg,
        .p-progress-spinner-circle,
        .spinner-border,
        .spinner-grow,
        [class*="progress-spinner" i],
        [class*="progressspinner" i],
        [class*="loading-spinner" i],
        .loading-spinner,
        .pje-loading,
        [class*="pje-loading" i],
        pdpj-spinner,
        pje-spinner,
        app-loading,
        app-spinner {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* ANIQUILAÇÃO GLOBAL DE TEMPO E ANIMAÇÃO */
        *, *::before, *::after {
            animation-delay: 0s !important;
            transition: none !important;
            transition-delay: 0s !important;
            transition-duration: 0s !important;
        }

        /* Destravamento de cursores de espera */
        html[style*="wait" i],
        body[style*="wait" i],
        html[style*="progress" i],
        body[style*="progress" i],
        *[style*="cursor: wait" i],
        *[style*="cursor:wait" i],
        *[style*="cursor: progress" i],
        *[style*="cursor:progress" i],
        .wait-cursor,
        .busy-cursor {
            cursor: auto !important;
        }
    `;

    class ModuloAntiAmpulheta {
        #ativo = true;
        #urls = [];
        #inicializado = false;
        #abortController = null;
        #observador = null;
        #observadorBlindagem = null;
        #cssBlindado = false;
        #documentoAssociado = null;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true]
         * @param {string[]} [opcoes.urls=[]]
         */
        constructor(opcoes = {}) {
            if (opcoes.ativo !== undefined) {
                this.#ativo = Boolean(opcoes.ativo);
            }
            if (Array.isArray(opcoes.urls)) {
                this.#urls = [...opcoes.urls];
            }
        }

        get ativo() {
            return this.#ativo;
        }

        set ativo(valor) {
            this.#ativo = Boolean(valor);
            if (!this.#ativo) {
                this.destruir();
            }
        }

        get urls() {
            return Object.freeze([...this.#urls]);
        }

        set urls(lista) {
            this.#urls = Array.isArray(lista) ? [...lista] : [];
        }

        get inicializado() {
            return this.#inicializado;
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                NULL_ANTI_AMPULHETA
            });
        }

        static get ARQUIVOS_CSS() {
            return ARQUIVOS_CSS_ESPECIALIZADOS;
        }

        /**
         * Inicializa o observador do ciclo de vida e monitoramento de overlays no DOM.
         * @param {Document} [doc]
         * @returns {boolean}
         */
        inicializar(doc) {
            const documento = doc || (typeof document !== 'undefined' ? document : null);
            if (!documento) return false;
            if (this.#inicializado && this.#documentoAssociado === documento) return true;

            this.destruir();

            this.#documentoAssociado = documento;
            this.#abortController = new AbortController();
            const { signal } = this.#abortController;

            const janela = documento.defaultView || (typeof window !== 'undefined' ? window : null);

            /* Auto-teardown determinístico ao descarregar a página ou subframe (BUG-01) */
            if (janela) {
                janela.addEventListener('pagehide', (ev) => {
                    if (!ev.persisted) {
                        this.destruir();
                    }
                }, { signal, capture: true });
            }

            /* Executa desbloqueio inicial de cursores e modais órfãos */
            if (this.#ativo) {
                this.desbloquearInterface(documento);
                this.#iniciarObservador(documento);
            }

            this.#inicializado = true;
            return true;
        }

        /**
         * Inicia observador de mutações com debounce para limpar cursores travados e scrims espúrios.
         * @param {Document} documento
         */
        #iniciarObservador(documento) {
            if (typeof MutationObserver === 'undefined') return;
            const alvo = documento.body || documento.documentElement;
            if (!alvo) return;

            let debounceTimer = null;
            this.#observador = new MutationObserver(() => {
                if (!this.#ativo) return;
                if (debounceTimer) return;
                debounceTimer = setTimeout(() => {
                    debounceTimer = null;
                    this.desbloquearInterface(documento);
                }, 150);
            });

            try {
                this.#observador.observe(alvo, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                    childList: false,
                    subtree: false
                });
            } catch (_) {
                // Modo defensivo contra ambientes restritos
            }
        }

        /**
         * Desbloqueia cursor e overlays transientes mantendo estritamente travas de operações em lote.
         * @param {Document} [doc]
         * @returns {boolean}
         */
        desbloquearInterface(doc) {
            const documento = doc || this.#documentoAssociado || (typeof document !== 'undefined' ? document : null);
            if (!documento) return false;

            /* REGRA 2: Se houver indicador de lote ou barra de progresso ativa, não intervém */
            if (this.possuiOperacaoLoteEmAndamento(documento)) {
                return false;
            }

            /* REGRA 5: Destravamento do cursor de espera órfão no html e body */
            try {
                const elHtml = documento.documentElement;
                const elBody = documento.body;

                if (elHtml && elHtml.style && elHtml.style.cursor === 'wait') {
                    elHtml.style.cursor = 'auto';
                }
                if (elBody && elBody.style && elBody.style.cursor === 'wait') {
                    elBody.style.cursor = 'auto';
                }
            } catch (_) {
                return false;
            }

            return true;
        }

        /**
         * Verifica se existe processo em lote, barra de progresso ou diálogo decisório ativo.
         * @param {Document} documento
         * @returns {boolean}
         */
        possuiOperacaoLoteEmAndamento(documento) {
            if (!documento) return false;

            try {
                /* Containers de lote no PJe, eproc e tribunais */
                const seletorLote = [
                    '#mpProgressoContainer:not([style*="display: none"])',
                    '#mpProgresso:not([style*="display: none"])',
                    '[id*="mpProgresso" i]:not(.rich-mpnl-mask-div):not([style*="display: none"])',
                    '[role="progressbar"]',
                    '.progress-bar',
                    'mat-progress-bar',
                    'p-progressbar',
                    '.rich-progress-bar',
                    '#divAvisoAssinatura:not([style*="display: none"])',
                    '#divInfraAreaProcessamento:not([style*="display: none"])'
                ].join(',');

                const elLote = documento.querySelector(seletorLote);
                return Boolean(elLote);
            } catch (_) {
                return false;
            }
        }

        static get TURBO_CSS() {
            return TURBO_CSS;
        }

        obterTurboCSS() {
            return TURBO_CSS;
        }

        /**
         * Garante que o observador de blindagem monitore a remoção acidental de #pje-turbo-lock.
         * @param {Document} [doc]
         */
        garantirObservadorBlindagem(doc) {
            const documento = doc || this.#documentoAssociado || (typeof document !== 'undefined' ? document : null);
            if (this.#observadorBlindagem || typeof MutationObserver === 'undefined' || !documento) return false;
            try {
                const alvo = documento.head || documento.documentElement;
                if (!alvo) return false;
                this.#observadorBlindagem = new MutationObserver(() => {
                    if (this.#ativo && !documento.getElementById('pje-turbo-lock')) {
                        this.#cssBlindado = false;
                        this.blindarCSS(documento);
                    }
                });
                this.#observadorBlindagem.observe(alvo, { childList: true });
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Injeta ou remove de forma atômica o estilo consolidado #pje-turbo-lock (ARQ-03 / Seção 6.102).
         * @param {Document} [doc]
         */
        blindarCSS(doc) {
            const documento = doc || this.#documentoAssociado || (typeof document !== 'undefined' ? document : null);
            if (this.#ativo === false) {
                const el = documento ? documento.getElementById('pje-turbo-lock') : null;
                if (el) el.remove();
                this.#cssBlindado = false;
                if (this.#observadorBlindagem) {
                    try { this.#observadorBlindagem.disconnect(); } catch (_) { }
                    this.#observadorBlindagem = null;
                }
                return false;
            }

            if (!documento) return false;

            const tagExistente = documento.getElementById('pje-turbo-lock');
            if (tagExistente && tagExistente.isConnected) {
                this.#cssBlindado = true;
                this.garantirObservadorBlindagem(documento);
                return true;
            }

            let dominio = '';
            let urlCompleta = '';
            try {
                const win = documento.defaultView || (typeof window !== 'undefined' ? window : null);
                dominio = (win && win.location && win.location.hostname) ? win.location.hostname.toLowerCase() : '';
                urlCompleta = (win && win.location && win.location.href) ? win.location.href.toLowerCase() : '';
                if ((!dominio || urlCompleta === 'about:blank') && win && win.top && win.top !== win) {
                    dominio = (win.top.location && win.top.location.hostname) ? win.top.location.hostname.toLowerCase() : dominio;
                    urlCompleta = (win.top.location && win.top.location.href) ? win.top.location.href.toLowerCase() : urlCompleta;
                }
            } catch (_) { }

            let sistemaIdentificado = null;
            const textoAlvo = `${dominio} ${urlCompleta}`;
            for (const sis of MATRIZ_SISTEMAS_JUDICIAIS) {
                if (sis.padrao.test(textoAlvo)) {
                    sistemaIdentificado = sis;
                    break;
                }
            }

            let ehPJeOuTribunal = Boolean(sistemaIdentificado) ||
                dominio.includes('.jus.br') ||
                (typeof window !== 'undefined' && window.__JUSGOV_TESTE_BLINDAR_CSS__ === true);

            if (!ehPJeOuTribunal && typeof window !== 'undefined' && window.self !== window.top && this.#ativo) {
                ehPJeOuTribunal = true;
            }

            if (!ehPJeOuTribunal) return false;

            /* Injeção estrita de folha única por aba (remove duplicatas residuais) */
            const tagsExtras = documento.querySelectorAll('style#pje-turbo-lock');
            for (let i = 1; i < tagsExtras.length; i++) {
                try { tagsExtras[i].remove(); } catch (_) { }
            }

            const style = tagExistente || documento.createElement('style');
            style.id = 'pje-turbo-lock';
            style.setAttribute('data-sistema-judicial', sistemaIdentificado ? sistemaIdentificado.nome : 'Judicial');
            style.setAttribute('data-css-alvo', sistemaIdentificado ? sistemaIdentificado.css : 'generico-anti-ampulheta.css');
            style.textContent = TURBO_CSS;

            const alvo = documento.head || documento.documentElement;
            if (alvo) {
                if (!style.isConnected) {
                    alvo.appendChild(style);
                }
                this.#cssBlindado = true;
                this.garantirObservadorBlindagem(documento);
                return true;
            }
            return false;
        }

        /**
         * Ativa ou desativa dinamicamente a blindagem de ampulhetas no documento.
         * @param {boolean} ativo
         * @param {Document} [doc]
         */
        definirAtivoAmpuletas(ativo, doc) {
            this.#ativo = Boolean(ativo);
            return this.blindarCSS(doc);
        }

        /**
         * Sincroniza parâmetros de configuração dinamicamente.
         * @param {Object} cfg
         */
        atualizarConfiguracoes(cfg = {}) {
            if (cfg.estadoAmpuletas !== undefined) {
                this.definirAtivoAmpuletas(Boolean(cfg.estadoAmpuletas));
            } else if (cfg.ativo !== undefined) {
                this.definirAtivoAmpuletas(Boolean(cfg.ativo));
            }

            if (Array.isArray(cfg.urlsAmpuletas)) {
                this.urls = cfg.urlsAmpuletas;
            } else if (Array.isArray(cfg.urls)) {
                this.urls = cfg.urls;
            }
        }

        /**
         * Destrói observadores e listeners associados ao documento.
         */
        destruir() {
            if (this.#abortController) {
                try {
                    this.#abortController.abort();
                } catch (_) { }
                this.#abortController = null;
            }

            if (this.#observador) {
                try {
                    this.#observador.disconnect();
                } catch (_) { }
                this.#observador = null;
            }

            if (this.#observadorBlindagem) {
                try {
                    this.#observadorBlindagem.disconnect();
                } catch (_) { }
                this.#observadorBlindagem = null;
            }

            this.#documentoAssociado = null;
            this.#inicializado = false;
        }
    }

    Object.freeze(ModuloAntiAmpulheta.prototype);

    /* Instanciação autônoma da blindagem global para o contexto do navegador (ARQ-03) */
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
            const instGlobal = new ModuloAntiAmpulheta({ ativo: true });
            window.JusGovInstanciaAntiAmpulheta = instGlobal;
            instGlobal.blindarCSS(document);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => instGlobal.blindarCSS(document), { once: true });
            }
            window.addEventListener('load', () => instGlobal.blindarCSS(document), { once: true });
        } catch (_) { }
    }

    return Object.freeze(ModuloAntiAmpulheta);
}));

