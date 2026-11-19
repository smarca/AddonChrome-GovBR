/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-espera.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-espera.js
 *
 * @MAPA-IA
 * - Arquivo: src/mod-automate/automate-espera.js
 * - Modulo: mod-automate (Submodulo de Algoritmos de Aguardo, Polling, Retry e Iteracao)
 * - Contexto: Content Script / ISOLATED World e Runners Headless V8
 * - Dependencias: JusGovAutomateSeletores (injetado via construtor; fallback autonomo se ausente)
 * - Responsabilidade: Executar algoritmos declarativos de espera de objetos (aguardar elemento aparecer,
 *   aguardar spinner/ampulheta sumir), polling assincrono com AbortSignal, politicas de retry (fixo ou
 *   exponencial) e iteracao controlada para os subfluxos do PJe e para o futuro Pseudo-Editor.
 * - Isolamento: 100% independente; pode ser removido sem quebrar nenhum outro modulo.
 * ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.JusGovAutomateEspera = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Motor de algoritmos de espera, polling de elementos DOM/iframes e politicas de retry.
     */
    class JusGovAutomateEspera {
        /**
         * @param {Object} [opcoes]
         * @param {Object} [opcoes.seletores] Instancia de JusGovAutomateSeletores.
         * @param {Object} [opcoes.configAlgoritmos] Mapa `algoritmosEsperaIteracao` vindo de `automate-dados.json`.
         * @param {boolean} [opcoes.modoInstantaneo=false] Quando true (testes headless), executa delays em 0ms.
         */
        constructor(opcoes = {}) {
            this.seletores = (opcoes && opcoes.seletores) ? opcoes.seletores : null;
            this.configAlgoritmos = (opcoes && opcoes.configAlgoritmos && typeof opcoes.configAlgoritmos === 'object')
                ? JSON.parse(JSON.stringify(opcoes.configAlgoritmos))
                : {
                    intervaloPollingPadraoMs: 250,
                    timeoutElementoPadraoMs: 15000,
                    timeoutSpinnerSumirMs: 30000,
                    atrasoCurtoPadraoMs: 300,
                    atrasoMedioPadraoMs: 1000,
                    atrasoLongoPadraoMs: 3000,
                    maxIteracoesLoopSeguranca: 500,
                    politicasRetry: {
                        padrao: { tentativasMax: 2, atrasoInicialMs: 2000, fatorMultiplicador: 1.5, atrasoMaxMs: 6000 },
                        rapida: { tentativasMax: 3, atrasoInicialMs: 500, fatorMultiplicador: 1.0, atrasoMaxMs: 1500 },
                        persistente: { tentativasMax: 20, atrasoInicialMs: 2000, fatorMultiplicador: 1.0, atrasoMaxMs: 2000 }
                    }
                };
            this.modoInstantaneo = Boolean(opcoes && opcoes.modoInstantaneo);
            this.abortarAtivo = false;
        }

        /**
         * Atualiza a configuracao declarativa de algoritmos de espera/iteracao.
         * @param {Object} novaConfig
         */
        definirConfigAlgoritmos(novaConfig) {
            if (novaConfig && typeof novaConfig === 'object') {
                Object.assign(this.configAlgoritmos, JSON.parse(JSON.stringify(novaConfig)));
            }
        }

        /**
         * Sinaliza interrupcao imediata de qualquer loop de espera/polling em andamento.
         * @param {boolean} [estado=true]
         */
        definirAbortar(estado = true) {
            this.abortarAtivo = Boolean(estado);
        }

        /**
         * Aguarda um intervalo em milissegundos (respeitando `modoInstantaneo` e `abortarAtivo`).
         * @param {number} ms
         * @param {AbortSignal} [signal]
         * @returns {Promise<boolean>} true se concluiu normalmente, false se abortado.
         */
        aguardarMs(ms, signal = null) {
            if (this.abortarAtivo || (signal && signal.aborted)) {
                return Promise.resolve(false);
            }
            const tempo = Number(ms);
            if (this.modoInstantaneo || Number.isNaN(tempo) || tempo <= 0) {
                return Promise.resolve(true);
            }
            return new Promise((resolve) => {
                let timerId = null;
                const aoAbortar = () => {
                    if (timerId !== null) clearTimeout(timerId);
                    resolve(false);
                };
                if (signal && typeof signal.addEventListener === 'function') {
                    signal.addEventListener('abort', aoAbortar, { once: true });
                }
                timerId = setTimeout(() => {
                    if (signal && typeof signal.removeEventListener === 'function') {
                        signal.removeEventListener('abort', aoAbortar);
                    }
                    resolve(!this.abortarAtivo);
                }, tempo);
            });
        }

        /**
         * Aguarda ate que uma funcao de condicao retorne valor truthy (ou atinja timeout/maxIteracoes).
         * @param {Function} condicaoFn Funcao sincrona ou assincrona `() => any`.
         * @param {Object} [opcoes]
         * @param {number} [opcoes.timeoutMs]
         * @param {number} [opcoes.intervaloMs]
         * @param {number} [opcoes.maxIteracoes]
         * @param {AbortSignal} [opcoes.signal]
         * @returns {Promise<{sucesso: boolean, resultado: any, iteracoes: number, tempoDecorridoMs: number}>}
         */
        async aguardarCondicaoPolling(condicaoFn, opcoes = {}) {
            const inicio = Date.now();
            const timeoutMs = (opcoes && typeof opcoes.timeoutMs === 'number')
                ? opcoes.timeoutMs
                : (this.configAlgoritmos.timeoutElementoPadraoMs || 15000);
            const intervaloMs = (opcoes && typeof opcoes.intervaloMs === 'number')
                ? opcoes.intervaloMs
                : (this.configAlgoritmos.intervaloPollingPadraoMs || 250);
            const maxIteracoes = (opcoes && typeof opcoes.maxIteracoes === 'number')
                ? opcoes.maxIteracoes
                : (this.configAlgoritmos.maxIteracoesLoopSeguranca || 500);
            const signal = opcoes ? opcoes.signal : null;

            let iteracoes = 0;
            while (iteracoes < maxIteracoes) {
                if (this.abortarAtivo || (signal && signal.aborted)) {
                    return { sucesso: false, resultado: null, iteracoes, tempoDecorridoMs: Date.now() - inicio };
                }
                iteracoes++;
                try {
                    const res = await condicaoFn(iteracoes);
                    if (res) {
                        return { sucesso: true, resultado: res, iteracoes, tempoDecorridoMs: Date.now() - inicio };
                    }
                } catch (eCond) {
                    // Continua tentando ate o timeout
                }

                const decorrido = Date.now() - inicio;
                if (decorrido >= timeoutMs || (this.modoInstantaneo && iteracoes >= (opcoes.maxIteracoesInstantaneo || 3))) {
                    break;
                }
                const okWait = await this.aguardarMs(intervaloMs, signal);
                if (!okWait) break;
            }

            return { sucesso: false, resultado: null, iteracoes, tempoDecorridoMs: Date.now() - inicio };
        }

        /**
         * Aguarda um elemento do repositorio aparecer no DOM (`WaitForWebPageContent` `Contain`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [opcoes]
         * @param {Object} [opcoes.variaveisLocais]
         * @param {number} [opcoes.timeoutMs]
         * @param {number} [opcoes.intervaloMs]
         * @param {Document|Element} [opcoes.raizCustomizada]
         * @returns {Promise<Element|null>}
         */
        async aguardarElementoConter(idOuDefinicaoObjeto, opcoes = {}) {
            if (!this.seletores) return null;
            const variaveisLocais = (opcoes && opcoes.variaveisLocais) || {};
            const raizCustomizada = (opcoes && opcoes.raizCustomizada) || null;

            const status = await this.aguardarCondicaoPolling(
                () => this.seletores.localizarElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada),
                opcoes
            );
            return status.sucesso ? status.resultado : null;
        }

        /**
         * Aguarda um elemento do repositorio desaparecer do DOM (`WaitForWebPageContent` `NotContain`),
         * usado para aguardar o fim das ampulhetas (`ampulhetaListagem`, `ampulhetaTarefa`, `ampulhetaNotificacaoEtqt`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [opcoes]
         * @returns {Promise<boolean>} true quando o elemento nao esta mais presente.
         */
        async aguardarElementoSumir(idOuDefinicaoObjeto, opcoes = {}) {
            if (!this.seletores) return true;
            const variaveisLocais = (opcoes && opcoes.variaveisLocais) || {};
            const raizCustomizada = (opcoes && opcoes.raizCustomizada) || null;
            const timeoutMs = (opcoes && typeof opcoes.timeoutMs === 'number')
                ? opcoes.timeoutMs
                : (this.configAlgoritmos.timeoutSpinnerSumirMs || 30000);

            const status = await this.aguardarCondicaoPolling(
                () => !this.seletores.contemElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada),
                Object.assign({}, opcoes, { timeoutMs })
            );
            return status.sucesso;
        }

        /**
         * Aguarda todas as ampulhetas/spinners informados sumirem em sequencia (com um pequeno respiro inicial).
         * @param {Array<string>} idsAmpulhetas
         * @param {Object} [opcoes]
         * @returns {Promise<boolean>}
         */
        async aguardarAmpulhetasSumirem(idsAmpulhetas = [], opcoes = {}) {
            if (!Array.isArray(idsAmpulhetas) || idsAmpulhetas.length === 0) return true;
            const atrasoInicial = (opcoes && typeof opcoes.atrasoInicialMs === 'number')
                ? opcoes.atrasoInicialMs
                : (this.configAlgoritmos.atrasoCurtoPadraoMs || 300);

            if (atrasoInicial > 0) {
                await this.aguardarMs(atrasoInicial, opcoes ? opcoes.signal : null);
            }

            for (let i = 0; i < idsAmpulhetas.length; i++) {
                const ok = await this.aguardarElementoSumir(idsAmpulhetas[i], opcoes);
                if (!ok) return false;
            }
            return true;
        }

        /**
         * Executa uma acao com politica de retry configuravel (substitui `ON ERROR REPEAT` do PAD).
         * @param {Function} acaoFn Funcao `(tentativa) => Promise<any> | any`. Se lancar erro ou retornar `false`/`null`, repete.
         * @param {string|Object} [politicaOuNome='padrao'] Nome da politica em `configAlgoritmos.politicasRetry` ou objeto `{tentativasMax, atrasoInicialMs, fatorMultiplicador, atrasoMaxMs}`.
         * @returns {Promise<{sucesso: boolean, resultado: any, tentativas: number, ultimoErro: Error|null}>}
         */
        async executarComRetry(acaoFn, politicaOuNome = 'padrao') {
            const mapaPoliticas = (this.configAlgoritmos && this.configAlgoritmos.politicasRetry) || {};
            const politica = (typeof politicaOuNome === 'string')
                ? (mapaPoliticas[politicaOuNome] || { tentativasMax: 2, atrasoInicialMs: 2000, fatorMultiplicador: 1.0, atrasoMaxMs: 6000 })
                : Object.assign({ tentativasMax: 2, atrasoInicialMs: 1000, fatorMultiplicador: 1.0, atrasoMaxMs: 5000 }, politicaOuNome);

            const tentativasMax = Math.max(1, Number(politica.tentativasMax) || 1);
            let atrasoAtual = Math.max(0, Number(politica.atrasoInicialMs) || 1000);
            const fator = Number(politica.fatorMultiplicador) || 1.0;
            const atrasoMax = Math.max(atrasoAtual, Number(politica.atrasoMaxMs) || 10000);

            let ultimoErro = null;
            for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
                if (this.abortarAtivo) {
                    return { sucesso: false, resultado: null, tentativas: tentativa - 1, ultimoErro };
                }
                try {
                    const resultado = await acaoFn(tentativa);
                    if (resultado !== false && resultado !== null && resultado !== undefined) {
                        return { sucesso: true, resultado, tentativas: tentativa, ultimoErro: null };
                    }
                } catch (erro) {
                    ultimoErro = erro;
                }

                if (tentativa < tentativasMax) {
                    await this.aguardarMs(atrasoAtual);
                    atrasoAtual = Math.min(atrasoMax, Math.round(atrasoAtual * fator));
                }
            }

            return { sucesso: false, resultado: null, tentativas: tentativasMax, ultimoErro };
        }
    }

    return JusGovAutomateEspera;
}));
