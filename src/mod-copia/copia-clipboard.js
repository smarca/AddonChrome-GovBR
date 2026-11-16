/* ==========================================================================
 * Nome do arquivo: copia-clipboard.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 1 - CÓPIA INTELIGENTE & FORENSE (Clipboard Interno & Colagem)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-clipboard.js
 * - Classe Exportada: GerenciadorClipboardInterno (window.JusGovClipboardInterno)
 * - Métodos Públicos: salvarClipboardInternoComBackup, registrarUltimaSelecao,
 *   gravarNaAreaDeTransferencia, emularTeclasColar, emularTeclasWinV,
 *   inserirTextoEmElemento, confirmarColagemGlobalEMarcarPermanente,
 *   executarColagemBotaoDireito
 * - Regras / Seções: ADR-002 (Simulação sem readText), BLIND-01 / Seção 6.104 (512KB + ordem estrita),
 *   BUG-17 / Seções 6.110 e 6.120 (2 Slots passivos), FEAT-21 / Seção 6.105 (Marcador Permanente),
 *   Diretriz 16 (SRP + DIP + Null Object)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) MEMÓRIA PASSIVA DE 2 NÍVEIS SEM READTEXT: Jamais invoca navigator.clipboard.readText().
 *    Grava Slot 1 (window.__JUSGOV_ULTIMO_CLIPBOARD__) e preserva Slot 2
 *    (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) de forma idempotente quando igual.
 * 2) ORDEM ESTRITA (BLIND-01): Sempre valida e grava na memória interna (<= 512KB) ANTES
 *    de gravar no clipboard do sistema operacional via ClipboardItem / writeText / textarea.
 * 3) INSERÇÃO & COLAGEM SEGURA: Converte datas BR para input[type="date"], utiliza native setter
 *    React/Angular, execCommand e fallback TextNode + Range, e confirma marcadores permanentes.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovClipboardInterno = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GerenciadorClipboardInterno {
        #deps = {
            obterEstadoOpcoes: () => ({ manterFormatacaoBasica: true, nivelFiltroFormatacao: 'basico', ultimoTextoLimpo: '' }),
            normalizarNivelFiltro: (n) => n || 'basico',
            verificarSeTextoEhBlocoOuPalavraUnica: () => false,
            aplicarFiltroHtmlPorNivel: () => '',
            envolverHtmlComResetDeCursorParaWord: (h) => h,
            extrairTextoPuroSanitizado: (v) => String(v || ''),
            aplicarFiltro1DadosLixo: (v) => String(v || ''),
            aplicarFiltro3InformacoesELinhas: (v) => String(v || ''),
            confirmarVisualMarcador: () => null
        };

        constructor(opcoes = {}) {
            this.configurarDependencias(opcoes);
        }

        configurarDependencias(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            Object.keys(this.#deps).forEach((k) => {
                if (typeof opcoes[k] === 'function') {
                    this.#deps[k] = opcoes[k];
                }
            });
        }

        registrarUltimaSelecao(novoItem, itemAnteriorOpcional, historicoOpcional = null) {
            if (!novoItem || (!novoItem.texto && !novoItem.html)) return;
            try {
                const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
                if (storageLocal) {
                    const historicoParaSalvar = Array.isArray(historicoOpcional)
                        ? historicoOpcional
                        : ((typeof window !== 'undefined' && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) ? window.__JUSGOV_HISTORICO_CLIPBOARD__ : []);
                    const payloadStorage = {
                        ultimoClipboardInterno: {
                            texto: novoItem.texto || '',
                            html: novoItem.html || '',
                            formatado: Boolean(novoItem.formatado),
                            timestamp: Date.now()
                        },
                        historicoClipboardInterno: historicoParaSalvar
                    };
                    if (itemAnteriorOpcional && (itemAnteriorOpcional.texto || itemAnteriorOpcional.html)) {
                        payloadStorage.ultimoClipboardAnteriorInterno = {
                            texto: itemAnteriorOpcional.texto || '',
                            html: itemAnteriorOpcional.html || '',
                            formatado: Boolean(itemAnteriorOpcional.formatado),
                            timestamp: Date.now()
                        };
                    }
                    storageLocal.set(payloadStorage);
                }
            } catch (_) { }
        }

        salvarClipboardInternoComBackup(novoPayload) {
            try {
                if (!novoPayload || typeof novoPayload !== 'object') return false;
                const LIMITE_BYTES_EMULACAO = 512 * 1024;
                const txt = typeof novoPayload.texto === 'string' ? novoPayload.texto : '';
                const html = typeof novoPayload.html === 'string' ? novoPayload.html : '';

                if (txt.length > LIMITE_BYTES_EMULACAO || html.length > LIMITE_BYTES_EMULACAO) {
                    if (Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = null;
                    }
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
                    return false;
                }

                const atual = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                const textoAtualLimpo = (atual && typeof atual.texto === 'string') ? atual.texto.trim() : '';
                const novoTextoLimpo = txt.trim();
                const ehConteudoIdenticoAoAtual = Boolean(textoAtualLimpo && novoTextoLimpo && textoAtualLimpo === novoTextoLimpo);

                if (!Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
                    if (atual && (atual.texto || atual.html)) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__.push({
                            texto: atual.texto || '',
                            html: atual.html || '',
                            formatado: Boolean(atual.formatado),
                            timestamp: Date.now()
                        });
                    }
                }

                const preservarHistorico = Boolean(novoPayload.preservarHistorico);
                if (!ehConteudoIdenticoAoAtual && !preservarHistorico) {
                    if (atual && (atual.texto || atual.html)) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = {
                            texto: atual.texto || '',
                            html: atual.html || '',
                            formatado: Boolean(atual.formatado)
                        };
                    }
                    window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift({
                        texto: txt,
                        html,
                        formatado: Boolean(novoPayload.formatado),
                        timestamp: Date.now()
                    });
                    if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                    }
                } else if (preservarHistorico && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = {
                        texto: txt,
                        html,
                        formatado: Boolean(novoPayload.formatado),
                        timestamp: Date.now()
                    };
                }

                window.__JUSGOV_ULTIMO_CLIPBOARD__ = {
                    texto: txt,
                    html,
                    formatado: Boolean(novoPayload.formatado)
                };
                this.registrarUltimaSelecao(window.__JUSGOV_ULTIMO_CLIPBOARD__, window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__, window.__JUSGOV_HISTORICO_CLIPBOARD__);
                return true;
            } catch (_) {
                try {
                    if (Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = null;
                    }
                } catch (_) { }
                return false;
            }
        }

        async gravarNaAreaDeTransferencia(textoFinal, rangeDOMOpcional = null, opcoesGravacao = {}) {
            if (!textoFinal || typeof textoFinal !== 'string') return false;
            const preservarHistorico = Boolean(opcoesGravacao && opcoesGravacao.preservarHistorico);
            const estado = this.#deps.obterEstadoOpcoes() || {};

            let deveManterFormatacao = Boolean(estado.manterFormatacaoBasica && rangeDOMOpcional);
            const nivelNorm = this.#deps.normalizarNivelFiltro(estado.nivelFiltroFormatacao);
            if (nivelNorm === 'texto_puro') {
                deveManterFormatacao = false;
            }
            if (deveManterFormatacao && this.#deps.verificarSeTextoEhBlocoOuPalavraUnica(textoFinal)) {
                deveManterFormatacao = false;
            }

            if (typeof window !== 'undefined' && window.__JUSGOV_AUDITORIA_EM_CURSO__) {
                return Boolean(this.salvarClipboardInternoComBackup({ texto: textoFinal, html: '', formatado: false, preservarHistorico }));
            }

            if (deveManterFormatacao) {
                const codigoHTML = this.#deps.aplicarFiltroHtmlPorNivel(rangeDOMOpcional, nivelNorm);
                if (codigoHTML) {
                    const htmlParaClipboard = this.#deps.envolverHtmlComResetDeCursorParaWord(codigoHTML);
                    const textoPlanoMultilinha = this.#deps.extrairTextoPuroSanitizado(codigoHTML) || textoFinal;
                    const salvouInterno = this.salvarClipboardInternoComBackup({ texto: textoPlanoMultilinha, html: htmlParaClipboard, formatado: true, preservarHistorico });
                    if (!salvouInterno) return false;

                    try {
                        const temFocoParaClip = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
                        if (temFocoParaClip && typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                            const dadosParaCopiar = new ClipboardItem({
                                'text/html': new Blob([htmlParaClipboard], { type: 'text/html' }),
                                'text/plain': new Blob([textoPlanoMultilinha], { type: 'text/plain' })
                            });
                            await navigator.clipboard.write([dadosParaCopiar]);
                            return true;
                        }
                    } catch (_) { }

                    try {
                        let copiouViaEvento = false;
                        const manipuladorCopy = (ev) => {
                            if (ev && ev.clipboardData) {
                                ev.clipboardData.setData('text/html', htmlParaClipboard);
                                ev.clipboardData.setData('text/plain', textoPlanoMultilinha);
                                ev.preventDefault();
                                copiouViaEvento = true;
                            }
                        };
                        document.addEventListener('copy', manipuladorCopy, { capture: true, once: true });
                        const sucessoCopy = document.execCommand('copy');
                        document.removeEventListener('copy', manipuladorCopy, { capture: true });
                        if (sucessoCopy || copiouViaEvento) return true;
                    } catch (_) { }
                }
            }

            let textoPuroFinal = '';
            if (rangeDOMOpcional && nivelNorm === 'texto_puro') {
                textoPuroFinal = this.#deps.extrairTextoPuroSanitizado(rangeDOMOpcional);
            }
            if (!textoPuroFinal) {
                textoPuroFinal = (typeof textoFinal === 'string' && (textoFinal.indexOf('<') !== -1 || textoFinal.indexOf('\r') !== -1))
                    ? this.#deps.extrairTextoPuroSanitizado(textoFinal)
                    : this.#deps.aplicarFiltro3InformacoesELinhas(this.#deps.aplicarFiltro1DadosLixo(textoFinal));
            }
            textoPuroFinal = (textoPuroFinal || '').replace(/[ ]{2,}/g, ' ').trim();

            const salvouInternoTexto = this.salvarClipboardInternoComBackup({ texto: textoPuroFinal, html: '', formatado: false, preservarHistorico });
            if (!salvouInternoTexto) return false;

            let gravouSistema = false;
            try {
                const temFocoParaTexto = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
                if (temFocoParaTexto && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    await navigator.clipboard.writeText(textoPuroFinal);
                    gravouSistema = true;
                }
            } catch (_) { }

            if (!gravouSistema) {
                try {
                    const areaTemp = document.createElement('textarea');
                    areaTemp.setAttribute('data-jusgov-ignore', 'true');
                    areaTemp.value = textoPuroFinal;
                    areaTemp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
                    document.body.appendChild(areaTemp);
                    areaTemp.select();
                    gravouSistema = Boolean(document.execCommand('copy'));
                    document.body.removeChild(areaTemp);
                } catch (_) { }
            }
            return true;
        }

        emularTeclasColar(alvo, texto, html) {
            try {
                if (!alvo) return false;
                if (typeof alvo.focus === 'function') {
                    try { alvo.focus(); } catch (_) { }
                }

                alvo.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'v', code: 'KeyV', keyCode: 86, which: 86, ctrlKey: true,
                    bubbles: true, cancelable: true, composed: true
                }));

                let pasteTratadoPeloEditor = false;
                const ehEditorRico = Boolean(alvo.isContentEditable || (alvo.closest && alvo.closest('[contenteditable="true"]')) || document.designMode === 'on');
                try {
                    if (typeof DataTransfer !== 'undefined') {
                        const dt = new DataTransfer();
                        if (html && ehEditorRico) dt.setData('text/html', html);
                        dt.setData('text/plain', texto || '');
                        const evtPaste = new ClipboardEvent('paste', {
                            clipboardData: dt, bubbles: true, cancelable: true, composed: true
                        });
                        pasteTratadoPeloEditor = !alvo.dispatchEvent(evtPaste);
                    }
                } catch (_) { }

                if (!pasteTratadoPeloEditor) {
                    let colouExec = false;
                    try { colouExec = document.execCommand('paste'); } catch (_) { }
                    if (!colouExec && html && ehEditorRico) {
                        try { colouExec = document.execCommand('insertHTML', false, html); } catch (_) { }
                    }
                    if (!colouExec) {
                        const conteudoParaInserir = (ehEditorRico && html) ? html : (texto || '');
                        this.inserirTextoEmElemento(alvo, conteudoParaInserir, Boolean(ehEditorRico && html));
                    }
                }

                alvo.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'v', code: 'KeyV', keyCode: 86, which: 86, ctrlKey: true,
                    bubbles: true, composed: true
                }));
                return true;
            } catch (_) {
                return false;
            }
        }

        emularTeclasWinV(alvo) {
            try {
                const el = alvo || (typeof document !== 'undefined' ? (document.activeElement || document.body) : null);
                if (!el) return;
                if (typeof el.focus === 'function') {
                    try { el.focus(); } catch (_) { }
                }
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', code: 'MetaLeft', keyCode: 91, which: 91, metaKey: true, bubbles: true, cancelable: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', keyCode: 86, which: 86, metaKey: true, bubbles: true, cancelable: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'v', code: 'KeyV', keyCode: 86, which: 86, metaKey: true, bubbles: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', code: 'MetaLeft', keyCode: 91, which: 91, metaKey: false, bubbles: true, composed: true }));
            } catch (_) { }
        }

        inserirTextoEmElemento(alvo, texto, ehHtmlFormatado) {
            try {
                if (!alvo) return;
                alvo.focus();

                if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA') {
                    const tipoInput = (alvo.getAttribute('type') || alvo.type || 'text').toLowerCase();
                    const ehTipoTemporal = ['date', 'datetime-local', 'month', 'week', 'time'].includes(tipoInput);

                    if (ehTipoTemporal) {
                        let valorData = (texto || '').trim();
                        if (tipoInput === 'date') {
                            const mDataBr = valorData.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
                            if (mDataBr) {
                                valorData = `${mDataBr[3]}-${mDataBr[2].padStart(2, '0')}-${mDataBr[1].padStart(2, '0')}`;
                            }
                        }
                        this.#definirValorInputNativo(alvo, valorData);
                        try {
                            alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                            alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        } catch (_) { }
                        return;
                    }

                    let start = null;
                    let end = null;
                    try {
                        start = (typeof alvo.selectionStart === 'number') ? alvo.selectionStart : null;
                        end = (typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : null;
                    } catch (_) { }

                    let inseriuComRange = false;
                    if (start !== null && end !== null && typeof alvo.setRangeText === 'function') {
                        try {
                            alvo.setRangeText(texto, start, end, 'end');
                            inseriuComRange = true;
                        } catch (_) { inseriuComRange = false; }
                    }

                    if (!inseriuComRange) {
                        if (start !== null && end !== null) {
                            alvo.value = (alvo.value || '').substring(0, start) + texto + (alvo.value || '').substring(end);
                            try { alvo.selectionStart = alvo.selectionEnd = start + texto.length; } catch (_) { }
                        } else {
                            this.#definirValorInputNativo(alvo, texto);
                        }
                    }

                    try {
                        alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                    return;
                }

                let executou = false;
                try {
                    executou = document.execCommand(ehHtmlFormatado ? 'insertHTML' : 'insertText', false, texto);
                } catch (_) { }

                if (!executou) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        const node = document.createTextNode(texto);
                        range.insertNode(node);
                        range.setStartAfter(node);
                        range.setEndAfter(node);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                try {
                    alvo.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                } catch (_) { }
            } catch (_) { }
        }

        #definirValorInputNativo(alvo, valor) {
            try {
                const proto = (typeof HTMLTextAreaElement !== 'undefined' && (alvo instanceof HTMLTextAreaElement || (alvo.tagName && alvo.tagName.toUpperCase() === 'TEXTAREA')))
                    ? HTMLTextAreaElement.prototype
                    : (typeof HTMLInputElement !== 'undefined' ? HTMLInputElement.prototype : null);
                const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
                if (descriptor && descriptor.set) {
                    descriptor.set.call(alvo, valor);
                } else {
                    alvo.value = valor;
                }
            } catch (_) {
                alvo.value = valor;
            }
        }

        confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota = false) {
            try {
                const estado = this.#deps.obterEstadoOpcoes() || {};
                const txt = (typeof textoColado === 'string' && textoColado.trim().length > 0)
                    ? textoColado.trim()
                    : ((window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto) || estado.ultimoTextoLimpo || '');
                const resMarcador = this.#deps.confirmarVisualMarcador(txt);
                if (!origemRemota && txt) {
                    const idInstancia = (typeof window !== 'undefined')
                        ? (window.__JUSGOV_ID_INSTANCIA_FRAME__ || (window.__JUSGOV_ID_INSTANCIA_FRAME__ = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
                        : 'frame';
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.set({
                            ultimaColagemConfirmadaGlobal: {
                                idOrigem: idInstancia,
                                texto: txt,
                                timestamp: Date.now()
                            }
                        });
                    }
                }
                return resMarcador;
            } catch (_) {
                return null;
            }
        }

        async executarColagemBotaoDireito(alvo, modo, usarAnterior = false) {
            try {
                if (!alvo) return;
                const estado = this.#deps.obterEstadoOpcoes() || {};
                const modoEfetivo = (modo === 'texto_puro') ? 'texto_puro' : 'normal';
                const ehEditorRico = Boolean(alvo.isContentEditable ||
                    (alvo.getAttribute && alvo.getAttribute('contenteditable') === 'true') ||
                    (alvo.closest && alvo.closest('[contenteditable="true"], [contenteditable=""], .ck-editor__editable, .ck-content')) ||
                    document.designMode === 'on');
                const ehCampoTextoPuro = (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || !ehEditorRico);

                const itemInterno = usarAnterior
                    ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                    : window.__JUSGOV_ULTIMO_CLIPBOARD__;
                const textoEmulado = (typeof itemInterno === 'string')
                    ? itemInterno
                    : ((itemInterno && itemInterno.texto) || (!usarAnterior ? (estado.ultimoTextoLimpo || '') : '') || '');
                const htmlEmulado = (itemInterno && typeof itemInterno === 'object' && itemInterno.formatado && itemInterno.html) ? itemInterno.html : '';

                if (textoEmulado && textoEmulado.trim().length > 0) {
                    if (ehCampoTextoPuro || modoEfetivo === 'texto_puro') {
                        this.inserirTextoEmElemento(alvo, textoEmulado, false);
                    } else if (modoEfetivo === 'normal' && ehEditorRico && htmlEmulado) {
                        this.inserirTextoEmElemento(alvo, htmlEmulado, true);
                    } else {
                        this.inserirTextoEmElemento(alvo, textoEmulado, false);
                    }
                    this.confirmarColagemGlobalEMarcarPermanente(textoEmulado, false);
                }
            } catch (_) { }
        }
    }

    return Object.freeze(GerenciadorClipboardInterno);
}));
