/* ==========================================================================
 * Nome do arquivo: mod-manut.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Privacidade e Manutenção do Navegador
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-manut/mod-manut.js
 * - Classe Exportada: ModuloManutencao (self.JusGovModuloManutencao)
 * - Métodos Públicos: definirProvedorConfig(fn), obterMsIdadeLimpeza(idadeStr),
 *   gerarChaveCookie(cookie), construirUrlCookie(cookie),
 *   cookieCorrespondeAoHost(cookie, hostname),
 *   avaliarCookiesParaLimpeza(cookies, mapaAtividade, agora, idadeMs, opcoes),
 *   inicializarRastreamentoCookies(), tratarCookieAlterado(changeInfo),
 *   registrarAcessoUrl(url),
 *   executarAutoLimpezaCacheECookies(forcar, inicioSessao, obterConfigFn)
 * - Regras / Seções: Diretriz 14, Diretriz 16, Seção 6.141 (Auto-Limpeza de Cache e Cookies Antigos)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Encapsula a rotina de manutenção automática e manual de cache HTTP e
 *    cookies antigos sem uso ou alteração há mais de X dias/horas
 *    (12h, 1d, 3d, 7d, 15d, 30d), preservando integralmente logins, tokens
 *    e cookies acessados ou modificados recentemente.
 * 2) ISOLAMENTO:
 *    Executa no contexto do Service Worker (Manifest V3) via importScripts,
 *    com proteção try/catch para disponibilidade das APIs chrome.cookies e
 *    chrome.browsingData.
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
        raiz.JusGovModuloManutencao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const CHAVE_MAPA_COOKIES = 'jusgovMapaCookiesAtividade';
    const CHAVE_ULTIMA_LIMPEZA_CACHE = 'ultimaLimpezaCacheCookiesTs';

    class ModuloManutencao {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
            this._mapaAtividade = null;
            this._mapaCarregado = false;
            this._ultimoAcessoPorHost = new Map();
            this._timerFlush = null;
            this._promessaFlush = null;
            this._limpezaEmCurso = false;
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
         * Converte a string de idade de retenção configurada para milissegundos.
         * @param {string} idadeStr - '12h' | '1d' | '3d' | '7d' | '15d' | '30d'
         * @returns {number}
         */
        obterMsIdadeLimpeza(idadeStr) {
            const chave = String(idadeStr || '7d');
            const rs = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                ? JusGovCfgDefaults.obterRegrasSistema()
                : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
            const tabela = (rs && rs.manutencao && rs.manutencao.idadesLimpezaMs) ? rs.manutencao.idadesLimpezaMs : null;
            if (tabela && typeof tabela[chave] === 'number') {
                return tabela[chave];
            }
            switch (chave) {
                case '12h': return 12 * 3600 * 1000;
                case '1d': return 24 * 3600 * 1000;
                case '3d': return 3 * 24 * 3600 * 1000;
                case '15d': return 15 * 24 * 3600 * 1000;
                case '30d': return 30 * 24 * 3600 * 1000;
                case '7d':
                default: return 7 * 24 * 3600 * 1000;
            }
        }

        /**
         * Gera a chave determinística de identificação única de um cookie.
         * @param {object} cookie
         * @returns {string}
         */
        gerarChaveCookie(cookie) {
            if (!cookie || typeof cookie !== 'object') return '';
            const storeId = String(cookie.storeId || '0');
            const domain = String(cookie.domain || '').toLowerCase();
            const path = String(cookie.path || '/');
            const name = String(cookie.name || '');
            return `${storeId}|${domain}|${path}|${name}`;
        }

        /**
         * Constrói a URL canônica exigida pela API chrome.cookies.remove.
         * @param {object} cookie
         * @returns {string}
         */
        construirUrlCookie(cookie) {
            if (!cookie || typeof cookie !== 'object') return '';
            const proto = cookie.secure ? 'https://' : 'http://';
            const host = String(cookie.domain || '').replace(/^\./, '');
            const rawPath = String(cookie.path || '/');
            const caminho = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
            return `${proto}${host}${caminho}`;
        }

        /**
         * Verifica segundo RFC 6265 se o cookie pertence ou se aplica ao hostname informado.
         * @param {object} cookie
         * @param {string} hostname
         * @returns {boolean}
         */
        cookieCorrespondeAoHost(cookie, hostname) {
            if (!cookie || !hostname) return false;
            const host = String(hostname).trim().toLowerCase().replace(/^\.+|\.+$/g, '');
            const rawDom = String(cookie.domain || '').trim().toLowerCase();
            if (!host || !rawDom) return false;
            const baseDom = rawDom.replace(/^\.+/, '');
            if (cookie.hostOnly === true && !rawDom.startsWith('.')) {
                return host === baseDom;
            }
            return host === baseDom || host.endsWith(`.${baseDom}`);
        }

        /**
         * Extrai o hostname de uma URL HTTP/HTTPS válida, ignorando esquemas internos.
         * @param {string} url
         * @returns {string|null}
         */
        _extrairHostnameHttp(url) {
            try {
                if (!url || typeof url !== 'string') return null;
                if (!/^https?:\/\//i.test(url)) return null;
                const parsed = new URL(url);
                return parsed.hostname ? parsed.hostname.toLowerCase() : null;
            } catch (_) {
                return null;
            }
        }

        /**
         * Avalia de forma pura quais cookies devem ser removidos (sem acesso/alteração >= idadeMs)
         * e quais devem ser preservados ou semeados com timestamp seguro.
         * @param {Array<object>} cookies
         * @param {object} mapaAtividade
         * @param {number} agora
         * @param {number} idadeMs
         * @param {object} [opcoes]
         * @returns {{remover: Array<object>, preservar: Array<object>, mapaAtualizado: object}}
         */
        avaliarCookiesParaLimpeza(cookies, mapaAtividade = {}, agora = Date.now(), idadeMs = 7 * 24 * 3600 * 1000, opcoes = {}) {
            const lista = Array.isArray(cookies) ? cookies : [];
            const mapaOriginal = (mapaAtividade && typeof mapaAtividade === 'object') ? mapaAtividade : {};
            const hostsAtivos = opcoes && opcoes.hostsAtivos instanceof Set ? opcoes.hostsAtivos : null;
            const mapaAtualizado = {};
            const remover = [];
            const preservar = [];

            for (let i = 0; i < lista.length; i++) {
                const cookie = lista[i];
                const chave = this.gerarChaveCookie(cookie);
                if (!chave) continue;

                let emUsoAgora = false;
                if (hostsAtivos && hostsAtivos.size > 0) {
                    for (const hostAtivo of hostsAtivos) {
                        if (this.cookieCorrespondeAoHost(cookie, hostAtivo)) {
                            emUsoAgora = true;
                            break;
                        }
                    }
                }

                if (emUsoAgora) {
                    // Cookie de aba aberta no momento permanece ativo agora
                    mapaAtualizado[chave] = agora;
                    preservar.push(cookie);
                    continue;
                }

                const ultimaAtividadeTs = Number(mapaOriginal[chave] || 0);
                if (!Number.isFinite(ultimaAtividadeTs) || ultimaAtividadeTs <= 0) {
                    // Fail-safe: cookie pré-existente sem histórico observado recebe carimbo inicial agora para jamais apagar sessão ativa
                    mapaAtualizado[chave] = agora;
                    preservar.push(cookie);
                    continue;
                }

                if ((agora - ultimaAtividadeTs) >= idadeMs) {
                    remover.push(cookie);
                } else {
                    mapaAtualizado[chave] = ultimaAtividadeTs;
                    preservar.push(cookie);
                }
            }

            return { remover, preservar, mapaAtualizado };
        }

        /**
         * Carrega o mapa de atividade de cookies do chrome.storage.local para memória.
         * @returns {Promise<object>}
         */
        async _carregarMapaAtividade() {
            if (this._mapaCarregado && this._mapaAtividade) {
                return this._mapaAtividade;
            }
            let mapa = {};
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const dados = await chrome.storage.local.get([CHAVE_MAPA_COOKIES]);
                    if (dados && dados[CHAVE_MAPA_COOKIES] && typeof dados[CHAVE_MAPA_COOKIES] === 'object') {
                        mapa = { ...dados[CHAVE_MAPA_COOKIES] };
                    }
                }
            } catch (_) { }
            this._mapaAtividade = mapa;
            this._mapaCarregado = true;
            return this._mapaAtividade;
        }

        /**
         * Agenda a gravação coalescida do mapa de atividade em chrome.storage.local.
         * @private
         */
        _agendarFlushMapa() {
            if (this._timerFlush) return;
            this._timerFlush = setTimeout(() => {
                this._timerFlush = null;
                this._flushMapaAgora().catch(() => { });
            }, 300);
        }

        /**
         * Persiste imediatamente em disco o mapa atual de atividade de cookies.
         * @returns {Promise<void>}
         */
        async _flushMapaAgora() {
            if (this._timerFlush) {
                clearTimeout(this._timerFlush);
                this._timerFlush = null;
            }
            if (!this._mapaAtividade) return;
            const salvar = async () => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.set({ [CHAVE_MAPA_COOKIES]: this._mapaAtividade });
                }
            };
            this._promessaFlush = (this._promessaFlush || Promise.resolve()).then(salvar, salvar);
            await this._promessaFlush;
        }

        /**
         * Coleta hostnames de todas as abas HTTP/HTTPS atualmente abertas.
         * @returns {Promise<Set<string>>}
         */
        async _coletarHostsAbasAbertas() {
            const hosts = new Set();
            try {
                if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function') {
                    const abas = await chrome.tabs.query({});
                    if (Array.isArray(abas)) {
                        for (let i = 0; i < abas.length; i++) {
                            const h = this._extrairHostnameHttp(abas[i] && abas[i].url);
                            if (h) hosts.add(h);
                        }
                    }
                }
            } catch (_) { }
            return hosts;
        }

        /**
         * Inicializa o rastreamento de cookies na subida do navegador ou instalação:
         * semeia cookies existentes ainda não catalogados com o timestamp atual e marca abas abertas como ativas.
         * @returns {Promise<boolean>}
         */
        async inicializarRastreamentoCookies() {
            try {
                if (typeof chrome === 'undefined' || !chrome.cookies || typeof chrome.cookies.getAll !== 'function') {
                    return false;
                }
                const mapa = await this._carregarMapaAtividade();
                const cookies = await chrome.cookies.getAll({});
                const hostsAtivos = await this._coletarHostsAbasAbertas();
                const agora = Date.now();
                const novoMapa = {};

                for (let i = 0; i < cookies.length; i++) {
                    const c = cookies[i];
                    const chave = this.gerarChaveCookie(c);
                    if (!chave) continue;

                    let emUso = false;
                    for (const h of hostsAtivos) {
                        if (this.cookieCorrespondeAoHost(c, h)) {
                            emUso = true;
                            break;
                        }
                    }

                    const anterior = Number(mapa[chave] || 0);
                    if (emUso || !Number.isFinite(anterior) || anterior <= 0) {
                        novoMapa[chave] = agora;
                    } else {
                        novoMapa[chave] = anterior;
                    }
                }

                this._mapaAtividade = novoMapa;
                await this._flushMapaAgora();
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * Registra criação, alteração ou remoção de um cookie disparado por chrome.cookies.onChanged.
         * @param {object} changeInfo
         * @returns {Promise<void>}
         */
        async tratarCookieAlterado(changeInfo) {
            try {
                if (!changeInfo || !changeInfo.cookie) return;
                const mapa = await this._carregarMapaAtividade();
                const chave = this.gerarChaveCookie(changeInfo.cookie);
                if (!chave) return;

                if (changeInfo.removed) {
                    if (changeInfo.cause !== 'overwrite') {
                        delete mapa[chave];
                    }
                } else {
                    mapa[chave] = Date.now();
                }
                this._agendarFlushMapa();
            } catch (_) { }
        }

        /**
         * Atualiza o timestamp de último acesso para todos os cookies correspondentes ao domínio da URL visitada/ativada.
         * @param {string} url
         * @param {boolean} [forcarImediato=false]
         * @returns {Promise<void>}
         */
        async registrarAcessoUrl(url, forcarImediato = false) {
            try {
                const hostname = this._extrairHostnameHttp(url);
                if (!hostname) return;
                const agora = Date.now();
                const ultimoRegistroHost = this._ultimoAcessoPorHost.get(hostname) || 0;
                if (!forcarImediato && (agora - ultimoRegistroHost) < 30000) {
                    return;
                }
                this._ultimoAcessoPorHost.set(hostname, agora);

                if (typeof chrome === 'undefined' || !chrome.cookies || typeof chrome.cookies.getAll !== 'function') {
                    return;
                }
                const mapa = await this._carregarMapaAtividade();
                const cookies = await chrome.cookies.getAll({});
                let alterou = false;

                for (let i = 0; i < cookies.length; i++) {
                    const c = cookies[i];
                    if (this.cookieCorrespondeAoHost(c, hostname)) {
                        const chave = this.gerarChaveCookie(c);
                        if (chave) {
                            mapa[chave] = agora;
                            alterou = true;
                        }
                    }
                }

                if (alterou) {
                    this._agendarFlushMapa();
                }
            } catch (_) { }
        }

        /**
         * Executa a limpeza seletiva de cookies não acessados nem alterados há pelo menos X dias/horas
         * e limpa o cache HTTP antigo sem apagar cookies recentes, logins ou tokens ativos.
         * @param {boolean} [forcar=false]
         * @param {boolean} [_inicioSessao=false]
         * @param {Function} [obterConfigFn]
         * @returns {Promise<{ok: boolean, motivo?: string, cookiesRemovidos?: number, cookiesPreservados?: number, cacheLimpo?: boolean, timestamp?: number, idade?: string, erro?: string}>}
         */
        async executarAutoLimpezaCacheECookies(forcar = false, _inicioSessao = false, obterConfigFn) {
            if (this._limpezaEmCurso) {
                return { ok: false, motivo: 'limpeza_em_andamento' };
            }
            this._limpezaEmCurso = true;
            try {
                const provedor = typeof obterConfigFn === 'function'
                    ? obterConfigFn
                    : (this._obterConfig || (typeof obterConfiguracoesGerais === 'function' ? obterConfiguracoesGerais : null));
                const config = provedor ? await provedor() : { autoLimpezaCacheCookiesAtiva: true, autoLimpezaIdade: '7d' };

                if (!forcar && !config.autoLimpezaCacheCookiesAtiva) {
                    return { ok: false, motivo: 'desativado' };
                }

                const agora = Date.now();
                const idadeMs = this.obterMsIdadeLimpeza(config.autoLimpezaIdade);
                let cookiesRemovidos = 0;
                let cookiesPreservados = 0;
                let cacheLimpo = false;

                // 1. Limpeza cirúrgica por cookie (APENAS não acessados/alterados há >= idadeMs)
                if (typeof chrome !== 'undefined' && chrome.cookies && typeof chrome.cookies.getAll === 'function' && typeof chrome.cookies.remove === 'function') {
                    await this._flushMapaAgora();
                    const mapa = await this._carregarMapaAtividade();
                    const cookies = await chrome.cookies.getAll({});
                    const hostsAtivos = await this._coletarHostsAbasAbertas();
                    const avaliacao = this.avaliarCookiesParaLimpeza(cookies, mapa, agora, idadeMs, { hostsAtivos });

                    cookiesPreservados = avaliacao.preservar.length;
                    this._mapaAtividade = { ...avaliacao.mapaAtualizado };

                    for (let i = 0; i < avaliacao.remover.length; i++) {
                        const cookie = avaliacao.remover[i];
                        const urlCookie = this.construirUrlCookie(cookie);
                        if (!urlCookie || !cookie.name) continue;
                        try {
                            const removido = await chrome.cookies.remove({
                                url: urlCookie,
                                name: cookie.name,
                                storeId: cookie.storeId
                            });
                            if (removido) {
                                cookiesRemovidos++;
                            } else {
                                // Mantém no mapa caso não tenha sido efetivamente removido
                                this._mapaAtividade[this.gerarChaveCookie(cookie)] = mapa[this.gerarChaveCookie(cookie)] || agora;
                            }
                        } catch (_) { }
                    }

                    await this._flushMapaAgora();
                }

                // 2. Limpeza apenas de cache HTTP (NUNCA passar cookies: true ou cacheStorage: true em browsingData.remove)
                if (typeof chrome !== 'undefined' && chrome.browsingData && typeof chrome.browsingData.remove === 'function') {
                    let ultimaCacheTs = 0;
                    if (chrome.storage && chrome.storage.local) {
                        const dadosLocal = await chrome.storage.local.get([CHAVE_ULTIMA_LIMPEZA_CACHE]);
                        ultimaCacheTs = Number(dadosLocal[CHAVE_ULTIMA_LIMPEZA_CACHE] || 0);
                    }
                    const cacheVencido = !ultimaCacheTs || (agora - ultimaCacheTs) >= idadeMs;
                    if (forcar || cacheVencido) {
                        await chrome.browsingData.remove({ since: 0 }, { cache: true });
                        cacheLimpo = true;
                        if (chrome.storage && chrome.storage.local) {
                            await chrome.storage.local.set({ [CHAVE_ULTIMA_LIMPEZA_CACHE]: agora });
                        }
                    }
                }

                return {
                    ok: true,
                    timestamp: agora,
                    idade: config.autoLimpezaIdade,
                    cookiesRemovidos,
                    cookiesPreservados,
                    cacheLimpo
                };
            } catch (e) {
                return { ok: false, erro: String(e && e.message ? e.message : e) };
            } finally {
                this._limpezaEmCurso = false;
            }
        }
    }

    return ModuloManutencao;
}));
