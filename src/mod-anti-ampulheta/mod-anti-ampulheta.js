/* ==========================================================================
 * ARQUIVO: src/mod-anti-ampulheta/mod-anti-ampulheta.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 1 — ANTI-AMPULHETAS: Otimização de Performance e Desbloqueio
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

    /* Matriz ordenada de prioridade dos sistemas judiciais (Seção 6.103 / FEAT-20 - fallback caso JSON não carregado) */
    const MATRIZ_SISTEMAS_JUDICIAIS_FALLBACK = Object.freeze([
        Object.freeze({ id: 'pje', nome: 'PJe', css: 'pje-anti-ampulheta.css', padrao: /\bpje\b|pje\.|\.jus\.br\/pje|frontend\.prd\.cnj\.cloud|sso\.cloud\.pje\.jus\.br/i }),
        Object.freeze({ id: 'eproc', nome: 'Eproc', css: 'eproc-anti-ampulheta.css', padrao: /\beproc\b|eproc\./i }),
        Object.freeze({ id: 'pdpj', nome: 'PDPJ', css: 'pdpj-stf-stj-anti-ampulheta.css', padrao: /\bpdpj\b|\bprevjud\b|stf\.jus\.br|stj\.jus\.br/i }),
        Object.freeze({ id: 'projudi', nome: 'Projudi', css: 'seeu-projudi-anti-ampulheta.css', padrao: /\bprojudi\b|projudi\./i }),
        Object.freeze({ id: 'saj', nome: 'SAJ', css: 'saj-anti-ampulheta.css', padrao: /\besaj\b|\bsaj\b|esaj\.|tjsp\.jus\.br\/esaj/i }),
        Object.freeze({ id: 'creta', nome: 'Creta', css: 'creta-anti-ampulheta.css', padrao: /\bcreta\b|creta\./i }),
        Object.freeze({ id: 'seeu', nome: 'SEEU', css: 'seeu-projudi-anti-ampulheta.css', padrao: /\bseeu\b|seeu\./i })
    ]);

    let _cacheSistemasJsonRef = null;
    let _cacheSistemasCompilados = null;

    function obterMatrizSistemasJudiciais() {
        const rs = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
            ? JusGovCfgDefaults.obterRegrasSistema()
            : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
        const lista = rs && Array.isArray(rs.sistemasJudiciais) ? rs.sistemasJudiciais : null;
        if (!lista || lista.length === 0) return MATRIZ_SISTEMAS_JUDICIAIS_FALLBACK;
        if (_cacheSistemasJsonRef === lista && _cacheSistemasCompilados) return _cacheSistemasCompilados;
        _cacheSistemasJsonRef = lista;
        _cacheSistemasCompilados = Object.freeze(lista.map((s) => Object.freeze({
            id: s.id,
            nome: s.nome,
            css: s.css,
            padrao: s.padrao instanceof RegExp ? s.padrao : new RegExp(String(s.padraoRegex || ''), 'i')
        })));
        return _cacheSistemasCompilados;
    }

    /* =====================================================================
     * CARREGAMENTO DINAMICO DAS FOLHAS CSS EXTERNAS (SEM CSS HARDCODED NO JS)
     * Cada sistema carrega o arquivo .css correspondente em src/mod-anti-ampulheta/
     * via preload de auditoria (__JUSGOV_CSS_ANTI_AMPULHETA__) ou IPC seguro
     * (OBTER_CSS_ANTI_AMPULHETA) no Background Service Worker.
     * ===================================================================== */
    const cacheCssPorArquivo = new Map();
    const promessasCssPorArquivo = new Map();

    function obterCssEmCacheSincrono(nomeArquivo) {
        if (!nomeArquivo) return '';
        if (cacheCssPorArquivo.has(nomeArquivo)) {
            return cacheCssPorArquivo.get(nomeArquivo) || '';
        }
        try {
            const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined' ? self : null);
            const mapaPreload = g && g.__JUSGOV_CSS_ANTI_AMPULHETA__;
            if (mapaPreload && typeof mapaPreload[nomeArquivo] === 'string' && mapaPreload[nomeArquivo].length > 0) {
                cacheCssPorArquivo.set(nomeArquivo, mapaPreload[nomeArquivo]);
                return mapaPreload[nomeArquivo];
            }
        } catch (_) { }
        return '';
    }

    async function carregarCssDeArquivo(nomeArquivo) {
        const emCache = obterCssEmCacheSincrono(nomeArquivo);
        if (emCache) return emCache;
        if (!nomeArquivo || !ARQUIVOS_CSS_ESPECIALIZADOS.includes(nomeArquivo)) return '';
        if (promessasCssPorArquivo.has(nomeArquivo)) {
            return promessasCssPorArquivo.get(nomeArquivo);
        }

        const promessa = (async () => {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                try {
                    const resp = await new Promise((resolve) => {
                        chrome.runtime.sendMessage({ acao: 'OBTER_CSS_ANTI_AMPULHETA', arquivo: nomeArquivo }, (r) => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                                resolve(null);
                                return;
                            }
                            resolve(r || null);
                        });
                    });
                    if (resp && resp.ok && typeof resp.css === 'string' && resp.css.length > 0) {
                        cacheCssPorArquivo.set(nomeArquivo, resp.css);
                        return resp.css;
                    }
                } catch (_) { }
            }
            if (typeof fetch === 'function') {
                try {
                    const urlCss = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function')
                        ? chrome.runtime.getURL(`src/mod-anti-ampulheta/${nomeArquivo}`)
                        : `../mod-anti-ampulheta/${nomeArquivo}`;
                    const respFetch = await fetch(urlCss);
                    if (respFetch && respFetch.ok) {
                        const txt = await respFetch.text();
                        if (txt && txt.length > 0) {
                            cacheCssPorArquivo.set(nomeArquivo, txt);
                            return txt;
                        }
                    }
                } catch (_) { }
            }
            return '';
        })();

        promessasCssPorArquivo.set(nomeArquivo, promessa);
        try {
            return await promessa;
        } finally {
            promessasCssPorArquivo.delete(nomeArquivo);
        }
    }


    const BaseModuloRef = (typeof self !== 'undefined' && typeof self.JusGovBaseModulo === 'function')
        ? self.JusGovBaseModulo
        : class BaseModuloFallback {
            constructor(nome) { this._nome = nome || 'ModuloAntiAmpulheta'; }
            aplicarConfig() { return true; }
        };

    class ModuloAntiAmpulheta extends BaseModuloRef {
        #ativo = true;
        #urls = [];
        #inicializado = false;
        #abortController = null;
        #observador = null;
        #observadorBlindagem = null;
        #cssBlindado = false;
        #documentoAssociado = null;
        #debounceTimer = null;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true]
         * @param {string[]} [opcoes.urls=[]]
         */
        constructor(opcoes = {}) {
            super('ModuloAntiAmpulheta');
            if (opcoes.ativo !== undefined) {
                this.#ativo = Boolean(opcoes.ativo);
            }
            if (Array.isArray(opcoes.urls)) {
                this.#urls = [...opcoes.urls];
            }
        }

        aplicarConfig(cfg = {}) {
            this.atualizarConfiguracoes(cfg);
            return true;
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

        #ehDocumentoEditorRicoIsolado(documento) {
            try {
                if (!documento) return false;
                if (documento.designMode === 'on') return true;
                if (documento.body && (documento.body.isContentEditable || (documento.body.classList && documento.body.classList.contains('cke_editable')))) {
                    return true;
                }
            } catch (_) { }
            return false;
        }

        /**
         * Inicializa o observador do ciclo de vida e monitoramento de overlays no DOM.
         * @param {Document} [doc]
         * @returns {boolean}
         */
        inicializar(doc) {
            const documento = doc || (typeof document !== 'undefined' ? document : null);
            if (!documento) return false;
            if (this.#ehDocumentoEditorRicoIsolado(documento)) return false;
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

            this.#observador = new MutationObserver(() => {
                if (!this.#ativo || !this.#inicializado) return;
                if (this.#debounceTimer) return;
                this.#debounceTimer = setTimeout(() => {
                    this.#debounceTimer = null;
                    if (!this.#inicializado || !this.#ativo) return;
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

            /* Fast-path O(1): evita querySelector custoso em toda a árvore se nenhum elemento raiz estiver com cursor wait */
            try {
                const elHtml = documento.documentElement;
                const elBody = documento.body;
                const htmlWait = Boolean(elHtml && elHtml.style && elHtml.style.cursor === 'wait');
                const bodyWait = Boolean(elBody && elBody.style && elBody.style.cursor === 'wait');
                if (!htmlWait && !bodyWait) {
                    return false;
                }

                /* REGRA 2: Se houver indicador de lote ou barra de progresso ativa, não intervém */
                if (this.possuiOperacaoLoteEmAndamento(documento)) {
                    return false;
                }

                /* REGRA 5: Destravamento do cursor de espera órfão no html e body */
                if (htmlWait) {
                    elHtml.style.cursor = 'auto';
                }
                if (bodyWait) {
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
            return obterCssEmCacheSincrono('pje-anti-ampulheta.css') || obterCssEmCacheSincrono('generico-anti-ampulheta.css');
        }

        obterTurboCSS(nomeArquivo = 'pje-anti-ampulheta.css') {
            return obterCssEmCacheSincrono(nomeArquivo);
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
            if (documento && this.#ehDocumentoEditorRicoIsolado(documento)) {
                const elCke = documento.getElementById ? documento.getElementById('pje-turbo-lock') : null;
                if (elCke && typeof elCke.remove === 'function') elCke.remove();
                this.#cssBlindado = false;
                return false;
            }
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
            /* Caso o marcador #pje-turbo-lock nao esteja no DOM, reseta a trava em RAM para forcar reinjecao */
            this.#cssBlindado = false;

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
            for (const sis of obterMatrizSistemasJudiciais()) {
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

            const arquivoCssAlvo = sistemaIdentificado ? sistemaIdentificado.css : 'generico-anti-ampulheta.css';
            const conteudoCss = obterCssEmCacheSincrono(arquivoCssAlvo);

            if (!conteudoCss) {
                /* Carrega assincronamente o arquivo .css correspondente via Background SW e reinjeta assim que disponivel */
                carregarCssDeArquivo(arquivoCssAlvo).then((cssCarregado) => {
                    if (cssCarregado && this.#ativo) {
                        this.blindarCSS(documento);
                    }
                }).catch(() => { });
                return false;
            }

            /* Injeção estrita de folha única por aba (remove duplicatas residuais) */
            const tagsExtras = documento.querySelectorAll('style#pje-turbo-lock');
            for (let i = 1; i < tagsExtras.length; i++) {
                try { tagsExtras[i].remove(); } catch (_) { }
            }

            const style = tagExistente || documento.createElement('style');
            style.id = 'pje-turbo-lock';
            style.setAttribute('data-sistema-judicial', sistemaIdentificado ? sistemaIdentificado.nome : 'Judicial');
            style.setAttribute('data-css-alvo', arquivoCssAlvo);
            style.textContent = conteudoCss;

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
            if (this.#debounceTimer) {
                try {
                    clearTimeout(this.#debounceTimer);
                } catch (_) { }
                this.#debounceTimer = null;
            }

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
            document.addEventListener('readystatechange', () => {
                if (document.readyState === 'complete' && !document.getElementById('pje-turbo-lock')) {
                    instGlobal.blindarCSS(document);
                }
            });
            window.addEventListener('load', () => instGlobal.blindarCSS(document), { once: true });
        } catch (_) { }
    }

    return Object.freeze(ModuloAntiAmpulheta);
}));

