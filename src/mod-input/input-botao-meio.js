/* ==========================================================================
 * Nome do arquivo: input-botao-meio.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 3 - TECLADO/MOUSE: Navegação por Teclado e Botões Laterais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-input/input-botao-meio.js
 * - Classe Exportada: BotaoMeioColagem (window.JusGovBotaoMeioColagem)
 * - Métodos Públicos:
 *     tratarMouseDown(e), tratarEventoTeclado(e, callbackSucesso), cancelarPressionamento(),
 *     tratarCliqueBotaoMeio(e, bufferUltimaSelecao, callbackSucesso, bufferPenultimaSelecao),
 *     get/set ativo
 * - Variáveis Globais Lidas:
 *     window.__JUSGOV_HISTORICO_CLIPBOARD__ (Histórico 10 Níveis),
 *     window.__JUSGOV_ULTIMO_CLIPBOARD__ (Slot 1),
 *     window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ (Slot 2)
 * - Regras / Seções: Diretrizes 11/14/16, ADR-002, Seção 6.63 (Ctrl+Botão do Meio cola penúltimo buffer),
 *     Seção 6.64 (duck-typing nodeType===1 cross-realm), Seção 6.98 (Histórico de 10 Níveis com Ctrl+Alt+1..0),
 *     Seção 6.104 (BLIND-01: slot vazio/nulo = no-op silencioso ao colar)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Captura do clique com o botão do meio do mouse (Scroll Click, button === 1) e atalhos de teclado
 *    (Ctrl + Alt + 1..0) para acesso rápido ao histórico de 10 níveis de área de transferência interna:
 *    - Clique simples no botão do meio: Cola a "Última Seleção" presente no buffer de memória
 *      (Slot 1: window.__JUSGOV_ULTIMO_CLIPBOARD__) em campos editáveis e editores de minutas, simulando Ctrl+V
 *      sem acionar leituras invasivas de clipboard do navegador.
 *    - Ctrl + botão do meio: Cola a "Penúltima Seleção" presente no segundo slot de memória interna
 *      (Slot 2: window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) preservando o último buffer intacto (Seção 6.63).
 *    - Atalhos de Teclado Ctrl + Alt + 1 a 0 (Seção 6.98 / FEAT-18):
 *      Teclar Ctrl + Alt + 1 cola o Slot 1 (1º item/mais recente), Ctrl + Alt + 2 cola o Slot 2, ...,
 *      e Ctrl + Alt + 0 cola o Slot 10 (10º item mais antigo) sem alterar a ordem da pilha de histórico.
 *    - BLIND-01 (Seção 6.104): Se a posição colada estiver nula ou vazia, absolutamente nada é feito (no-op).
 *    - Bloqueio rigoroso do cursor de bússola/rolagem automática nativa (autoscroll) em campos editáveis.
 * 2) CONTRATO POO E ENCAPSULAMENTO:
 *    Instancia a classe BotaoMeioColagem com campos privados (#) e métodos públicos defensivos.
 * 3) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Identificação estrita de e.button === 1 e guarda de ativação.
 *    Passo 1.2: Cancelamento de preventDefault para suprimir o modo de rolagem circular nativo.
 *    Passo 1.3: Se Ctrl + Alt + [1..0] disparado, obtém o slot do histórico e cola no campo editável ativo.
 *    Passo 1.4: No mouseup/auxclick do botão do meio, cola Slot 1 (simples) ou Slot 2 (com Ctrl).
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14, 16, 5.16 e 5.17)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-002: Simulação de Clipboard em Memória)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovBotaoMeioColagem = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class BotaoMeioColagem {
        #ativo = true;
        #ultimoDisparoTimestamp = 0;
        #intervaloMinimoDisparoMs = 120;
        #alvoPendenteAlt = null;

        /**
         * @param {Object} [opcoes={}]
         * @param {boolean} [opcoes.ativo=true] - Se a colagem com botão do meio e atalhos está habilitada
         */
        constructor(opcoes = {}) {
            /* Passo 1.1: Inicialização defensiva */
            if (typeof opcoes.ativo === 'boolean') {
                this.#ativo = opcoes.ativo;
            }
        }

        /**
         * @returns {boolean}
         */
        get ativo() {
            return this.#ativo;
        }

        /**
         * @param {boolean} valor
         */
        set ativo(valor) {
            this.#ativo = Boolean(valor);
        }

        /**
         * Obtém o texto gravado nos 2 slots da Memória Interna (Seções 6.110 e 6.120 / USAB-11 e USAB-19):
         * - Índice 0 = Slot 1 (Última Seleção: window.__JUSGOV_ULTIMO_CLIPBOARD__)
         * - Índice 1 = Slot 2 (Penúltima Seleção: window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__)
         * @param {number} indice - Índice 0 (Slot 1) ou 1 (Slot 2)
         * @param {string} [bufferUltimaSelecao=""]
         * @param {string} [bufferPenultimaSelecao=""]
         * @returns {string}
         */
        #obterTextoDoHistorico(indice, bufferUltimaSelecao = '', bufferPenultimaSelecao = '') {
            if (indice !== 0 && indice !== 1) {
                return '';
            }

            /* Precedência para buffers explicitamente fornecidos na chamada do método */
            if (indice === 0 && typeof bufferUltimaSelecao === 'string' && bufferUltimaSelecao) {
                return bufferUltimaSelecao;
            }
            if (indice === 1 && typeof bufferPenultimaSelecao === 'string' && bufferPenultimaSelecao) {
                return bufferPenultimaSelecao;
            }

            if (indice === 0) {
                if (typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                    const u = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                    return typeof u === 'string' ? u : (u.texto || u.html || '');
                }
            } else if (indice === 1) {
                if (typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) {
                    const a = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;
                    return typeof a === 'string' ? a : (a.texto || a.html || '');
                }
            }

            if (typeof window !== 'undefined' && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                if (indice >= 0 && indice < 2 && indice < window.__JUSGOV_HISTORICO_CLIPBOARD__.length) {
                    const item = window.__JUSGOV_HISTORICO_CLIPBOARD__[indice];
                    if (!item) return '';
                    if (typeof item === 'string') return item;
                    if (typeof item === 'object') {
                        if (typeof item.texto === 'string' && item.texto.length > 0) return item.texto;
                        if (typeof item.html === 'string' && item.html.length > 0) return item.html;
                    }
                }
            }

            return '';
        }

        /**
         * Cancela o estado de pressão do botão do meio (mantido para compatibilidade).
         */
        cancelarPressionamento() {
            this.#alvoPendenteAlt = null;
        }

        /**
         * Intercepta o evento mousedown ou pointerdown para suprimir o cursor de bússola em editáveis
         * e capturar/ativar imediatamente o componente alvo em Alt + Botão do Meio.
         * @param {MouseEvent|PointerEvent} e
         * @returns {boolean} True se capturado e prevenido
         */
        tratarMouseDown(e) {
            if (!this.#ativo || !e || e.button !== 1) {
                return false;
            }

            const linkMeio = (e.target && typeof e.target.closest === 'function')
                ? e.target.closest('a[href]')
                : null;
            if (linkMeio) {
                return false;
            }

            const alvoEditavel = this.#resolverAlvoEditavel(e.target);

            /* Suprime o cursor de bússola nativo de rolagem sobre editáveis (ou ao ativar componente com Alt + Meio) */
            if (alvoEditavel || e.altKey) {
                try {
                    if (typeof e.preventDefault === 'function') e.preventDefault();
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                    if (e.altKey) {
                        const alvoCap = alvoEditavel || e.target;
                        this.#alvoPendenteAlt = alvoCap;
                        this.#focarElementoSeguro(alvoCap);
                        if (e.target && typeof e.target.click === 'function') e.target.click();
                        this.#focarElementoSeguro(alvoCap);
                        if (alvoCap && alvoCap.tagName && alvoCap.tagName.toUpperCase() === 'INPUT' && typeof alvoCap.select === 'function') {
                            alvoCap.select();
                        }
                    }
                } catch (_) { }
                return true;
            }

            return false;
        }

        /**
         * Rollback Seções 6.110 e 6.120 (USAB-11 / USAB-19):
         * Os atalhos de teclado Ctrl + Alt + [0-9] foram permanentemente desativados para preservar
         * a digitação nativa do sistema e caracteres AltGr (¹, ², ³, £, ¢, ª, º) em teclados ABNT2.
         * A colagem da memória interna opera exclusivamente pelos Slots 1 e 2 via Botão do Meio.
         * @returns {boolean} Sempre false (evento 100% livre para o sistema operacional)
         */
        tratarEventoTeclado() {
            return false;
        }

        /**
         * Resolve o hospedeiro editável efetivo (input, textarea ou `.closest('[contenteditable]')`)
         * a partir de qualquer nó/filho clicado. Emprega duck-typing cross-realm (nodeType === 1).
         * @param {Node|HTMLElement} no
         * @returns {HTMLElement|null}
         */
        #resolverAlvoEditavel(no) {
            if (!no) return null;
            const el = (no.nodeType === 3) ? no.parentElement : no;
            if (!el || el.nodeType !== 1) return null;

            const ehInputOuTextareaValido = (cand) => {
                if (!cand || cand.nodeType !== 1) return false;
                const tagCand = cand.tagName ? cand.tagName.toUpperCase() : '';
                if (tagCand === 'TEXTAREA') return !cand.disabled && !cand.readOnly;
                if (tagCand === 'INPUT') {
                    const tipo = ((typeof cand.getAttribute === 'function' ? cand.getAttribute('type') : null) || 'text').toLowerCase();
                    const tiposTexto = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
                    return tiposTexto.includes(tipo) && !cand.disabled && !cand.readOnly;
                }
                return false;
            };

            if (ehInputOuTextareaValido(el)) return el;
            if (typeof el.closest === 'function') {
                const formDireto = el.closest('input, textarea');
                if (ehInputOuTextareaValido(formDireto)) return formDireto;
                const ceHost = el.closest('[contenteditable], .cke_editable, .ck-editor__editable, .ck-content, .tox-edit-area');
                if (ceHost) {
                    const attrHost = (typeof ceHost.getAttribute === 'function') ? ceHost.getAttribute('contenteditable') : null;
                    if (attrHost === null || attrHost.toLowerCase() !== 'false') {
                        return ceHost;
                    }
                }
            }
            const attrCe = (typeof el.getAttribute === 'function') ? el.getAttribute('contenteditable') : null;
            if (el.isContentEditable || (attrCe !== null && ['true', '', 'plaintext-only'].includes(attrCe.toLowerCase()))) {
                return el;
            }
            return null;
        }

        /**
         * Verifica se o elemento alvo pode receber texto colado (campo de texto, textarea ou contenteditable).
         * @param {HTMLElement} el
         * @returns {boolean}
         */
        #ehElementoEditavel(el) {
            return Boolean(this.#resolverAlvoEditavel(el));
        }

        /**
         * Aplica foco seguro sem rolar a página.
         * @param {HTMLElement} el
         */
        #focarElementoSeguro(el) {
            if (!el || typeof el.focus !== 'function') return;
            try {
                el.focus({ preventScroll: true });
            } catch (_) {
                try { el.focus(); } catch (__) { }
            }
        }

        /**
         * Reconfirma e foca o elemento editável antes da colagem (`.focus()` + `.closest('[contenteditable]')` / `activeElement`).
         * @param {HTMLElement} alvoInicial
         * @returns {HTMLElement|null}
         */
        #confirmarEFocarAlvoFinal(alvoInicial) {
            const doc = (alvoInicial && alvoInicial.ownerDocument) || (typeof document !== 'undefined' ? document : null);
            let alvoConfirmado = this.#resolverAlvoEditavel(alvoInicial);
            if (alvoConfirmado && alvoConfirmado.isConnected === false) {
                alvoConfirmado = null;
            }
            if (!alvoConfirmado && doc && doc.activeElement) {
                alvoConfirmado = this.#resolverAlvoEditavel(doc.activeElement);
            }
            if (!alvoConfirmado && alvoInicial && alvoInicial.isConnected !== false && typeof alvoInicial.querySelector === 'function') {
                const filhoEdit = alvoInicial.querySelector('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [contenteditable]:not([contenteditable="false"])');
                if (filhoEdit) alvoConfirmado = this.#resolverAlvoEditavel(filhoEdit);
            }
            if (!alvoConfirmado) return null;

            this.#focarElementoSeguro(alvoConfirmado);

            const tagConf = alvoConfirmado.tagName ? alvoConfirmado.tagName.toUpperCase() : '';
            if (tagConf !== 'INPUT' && tagConf !== 'TEXTAREA' && doc) {
                const winRef = doc.defaultView || (typeof window !== 'undefined' ? window : null);
                if (winRef && typeof winRef.getSelection === 'function' && typeof doc.createRange === 'function') {
                    try {
                        const sel = winRef.getSelection();
                        const dentro = Boolean(sel && sel.rangeCount > 0 && alvoConfirmado.contains && alvoConfirmado.contains(sel.anchorNode));
                        if (!dentro) {
                            const rangeFim = doc.createRange();
                            rangeFim.selectNodeContents(alvoConfirmado);
                            rangeFim.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(rangeFim);
                        }
                    } catch (_) { }
                }
            }
            return alvoConfirmado;
        }

        /**
         * Insere o texto fornecido no cursor do elemento editável de forma hierárquica e compatível:
         * 1) Para INPUT ou TEXTAREA: utiliza a API padronizada HTML5 (setRangeText / value) com despacho de eventos
         * 2) Para editores ContentEditable: invoca API nativa do Navegador (execCommand 'insertText')
         * @param {HTMLElement} elEditavel
         * @param {string} texto
         * @returns {boolean} True se a inserção ocorreu com sucesso
         */
        #inserirTextoNoCursor(elEditavel, texto) {
            if (!elEditavel || typeof texto !== 'string' || texto.length === 0) {
                return false;
            }

            const doc = elEditavel.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const tag = elEditavel.tagName ? elEditavel.tagName.toUpperCase() : '';

            /* PRIORIDADE 1: Elementos clássicos de formulário (INPUT e TEXTAREA) */
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                try {
                    let inicio = typeof elEditavel.selectionStart === 'number' ? elEditavel.selectionStart : null;
                    let fim = typeof elEditavel.selectionEnd === 'number' ? elEditavel.selectionEnd : null;

                    if (typeof elEditavel.setRangeText === 'function' && inicio !== null && fim !== null) {
                        elEditavel.setRangeText(texto, inicio, fim, 'end');
                        try {
                            elEditavel.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                            elEditavel.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                        } catch (_) { }
                        return true;
                    }
                } catch (_) { }

                try {
                    let inicio = typeof elEditavel.selectionStart === 'number' ? elEditavel.selectionStart : null;
                    let fim = typeof elEditavel.selectionEnd === 'number' ? elEditavel.selectionEnd : null;
                    const valorAnterior = (typeof elEditavel.value === 'string') ? elEditavel.value : '';

                    if (inicio !== null && fim !== null) {
                        const novoValor = valorAnterior.slice(0, inicio) + texto + valorAnterior.slice(fim);
                        elEditavel.value = novoValor;
                        const novaPosicao = inicio + texto.length;
                        try {
                            if (typeof elEditavel.setSelectionRange === 'function') {
                                elEditavel.setSelectionRange(novaPosicao, novaPosicao);
                            }
                        } catch (_) { }
                    } else {
                        elEditavel.value = valorAnterior + texto;
                    }

                    /* Despacho de eventos sintéticos para frameworks reativos (React, Angular, Vue, JSF) */
                    try {
                        elEditavel.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        elEditavel.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    } catch (_) { }
                    return true;
                } catch (_) { }
            }

            /* PRIORIDADE 2: Elementos ContentEditable (editores ricos do PJe, TinyMCE, CKEditor) */
            try {
                const alvoHost = (typeof elEditavel.closest === 'function')
                    ? (elEditavel.closest('[contenteditable]:not([contenteditable="false"])') || elEditavel)
                    : elEditavel;
                this.#focarElementoSeguro(alvoHost);
                const winRef = (doc && doc.defaultView) || (typeof window !== 'undefined' ? window : null);
                if (winRef && typeof winRef.getSelection === 'function' && doc && typeof doc.createRange === 'function') {
                    try {
                        const selPre = winRef.getSelection();
                        const dentroPre = Boolean(selPre && selPre.rangeCount > 0 && alvoHost.contains && alvoHost.contains(selPre.anchorNode));
                        if (!dentroPre) {
                            const rFim = doc.createRange();
                            rFim.selectNodeContents(alvoHost);
                            rFim.collapse(false);
                            selPre.removeAllRanges();
                            selPre.addRange(rFim);
                        }
                    } catch (_) { }
                }
                if (doc && typeof doc.execCommand === 'function') {
                    const sucessoNativo = doc.execCommand('insertText', false, texto);
                    if (sucessoNativo) {
                        try {
                            alvoHost.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                            alvoHost.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                        } catch (_) { }
                        return true;
                    }
                }
                if (winRef && typeof winRef.getSelection === 'function' && doc) {
                    const selFallback = winRef.getSelection();
                    if (selFallback && selFallback.rangeCount > 0) {
                        const rangeFb = selFallback.getRangeAt(0);
                        rangeFb.deleteContents();
                        const noTxt = doc.createTextNode(texto);
                        rangeFb.insertNode(noTxt);
                        rangeFb.setStartAfter(noTxt);
                        rangeFb.setEndAfter(noTxt);
                        selFallback.removeAllRanges();
                        selFallback.addRange(rangeFb);
                        try {
                            alvoHost.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                            alvoHost.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                        } catch (_) { }
                        return true;
                    }
                }
            } catch (_) { }

            return false;
        }

        /**
         * Trata o evento de clique do botão do meio (Scroll Click / button === 1).
         * - Clique sem modificadores: Cola o último buffer (Slot 1);
         * - Ctrl + Clique: Cola o penúltimo buffer (Slot 2 - Seção 6.63);
         * - Alt + Clique (com ou sem Ctrl): Foca componente, aguarda 250ms, reconfirma editável (.closest('[contenteditable]')/input/textarea), refoca e cola;
         * - BLIND-01: Se o buffer estiver nulo ou vazio, nada é colado (no-op silencioso).
         * @param {MouseEvent} e - Evento de mouseup ou auxclick
         * @param {string} [bufferUltimaSelecao=""] - Conteúdo em memória da última seleção
         * @param {Function} [callbackSucesso=null] - Callback opcional executado ao colar com sucesso
         * @param {string} [bufferPenultimaSelecao=""] - Conteúdo em memória da penúltima seleção
         * @returns {boolean} True se o evento foi interceptado
         */
        tratarCliqueBotaoMeio(e, bufferUltimaSelecao = '', callbackSucesso = null, bufferPenultimaSelecao = '') {
            /* Passo 3.1: Validação estrita do botão do meio (button === 1) */
            if (!this.#ativo || !e || e.button !== 1) {
                return false;
            }

            const pendAlt = this.#alvoPendenteAlt;
            this.#alvoPendenteAlt = null;
            const comAlt = Boolean(e.altKey || pendAlt);
            const alvoInicial = pendAlt || e.target;
            const linkMeio = (alvoInicial && typeof alvoInicial.closest === 'function')
                ? alvoInicial.closest('a[href]')
                : null;
            if (linkMeio) {
                return false;
            }

            const alvoEditavelInicial = this.#resolverAlvoEditavel(alvoInicial);
            if (!alvoEditavelInicial && !pendAlt) {
                return false;
            }

            /* Passo 3.2: Cancelamento do cursor de bússola nativo de rolagem restrito a campos editáveis/ativação Alt */
            try {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
            } catch (_) { }

            /* Passo 3.3: Proteção de debounce restrita a múltiplos cliques físicos rápidos de mouse */
            const agora = Date.now();
            if (e.isTrusted && (agora - this.#ultimoDisparoTimestamp < this.#intervaloMinimoDisparoMs)) {
                return true;
            }
            this.#ultimoDisparoTimestamp = agora;

            const executarColagem = (slotIndex) => {
                const alvoConfirmado = this.#confirmarEFocarAlvoFinal(alvoInicial);
                if (!alvoConfirmado) return;
                const textoParaColar = this.#obterTextoDoHistorico(slotIndex, bufferUltimaSelecao, bufferPenultimaSelecao);
                /* BLIND-01 (Seção 6.104): Se nulo ou vazio, operação no-op silenciosa */
                if (textoParaColar && typeof textoParaColar === 'string' && textoParaColar.length > 0) {
                    const colou = this.#inserirTextoNoCursor(alvoConfirmado, textoParaColar);
                    if (colou && typeof window !== 'undefined' && window.JusGovMotorSelecaoTeste && typeof window.JusGovMotorSelecaoTeste.confirmarColagemDeConteudo === 'function') {
                        try { window.JusGovMotorSelecaoTeste.confirmarColagemDeConteudo(textoParaColar, slotIndex); } catch (_) { }
                    }
                    if (typeof callbackSucesso === 'function') {
                        callbackSucesso(textoParaColar, alvoConfirmado, slotIndex);
                    }
                }
            };

            const slotAlvo = e.ctrlKey ? 1 : 0;

            /* Passo 3.4 (FEAT-29 / FEAT-53 / BUG-77): Alt + Botão do Meio (com ou sem Ctrl): foca, ativa, reconfirma e cola */
            if (comAlt) {
                this.#focarElementoSeguro(alvoEditavelInicial || alvoInicial);
                try {
                    if (!pendAlt && alvoInicial && typeof alvoInicial.click === 'function') {
                        alvoInicial.click();
                    }
                } catch (_) { }
                setTimeout(() => {
                    executarColagem(slotAlvo);
                }, 250);
                return true;
            }

            /* Passo 3.5: Colagem imediata (Slot 1 sem Ctrl, Slot 2 com Ctrl) */
            executarColagem(slotAlvo);

            return true;
        }
    }

    Object.freeze(BotaoMeioColagem.prototype);
    return Object.freeze(BotaoMeioColagem);
}));
