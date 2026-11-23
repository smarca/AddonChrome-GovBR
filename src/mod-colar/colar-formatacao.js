/* ==========================================================================
 * ARQUIVO: src/mod-colar/colar-formatacao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Colagem — Filtros Shift/CNJ, Níveis de Formatação e Emulação de Teclas
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-colar/colar-formatacao.js
 * - Classe Exportada: ColarFormatacao (self.JusGovColarFormatacao) extends BaseModulo
 * - Métodos Públicos: aplicarFiltroShiftParaColagem, _p_converterNivelParaIndice, obterNivelEFormatosParaColagem, _p_preencherDataTransferPorNivel, emularTeclasColar, emularTeclasWinV, confirmarColagemGlobalEMarcarPermanente, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovColarFormatacao = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

        function obterConstantesGlobais() {
        const g = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
        return (g && g.JusGovConstantes) ? g.JusGovConstantes : null;
    }

    const NIVEL_CLIPBOARD_INDICE = Object.freeze({
        texto_puro: 0,
        somente_texto: 0,
        basico: 1,
        intermediario: 2,
        avancado: 3,
        estendido: 4,
        sem_filtro: 4
    });
    const NOMES_NIVEL_CLIPBOARD = Object.freeze(['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido']);

    class ColarFormatacao extends Base {
        constructor() {
            super('ColarFormatacao');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ColarFormatacao.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ColarFormatacao.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Aplica na colagem o mesmo filtro usado ao copiar com Shift (FEAT-65):
         * - Preserva dígitos puros (ex.: datas DD/MM/AAAA -> DDMMAAAA, CPF/valores -> só dígitos);
         * - Se for CNPJ alfanumérico, remove pontuação preservando letras maiúsculas e dígitos;
         * - Se for número de processo CNJ (parcial ou completo), aplica preenchimento de 7 dígitos
         *   na numeração inicial quando `modoShiftCnj !== 'semZeros'`.
         * - Caso o texto contenha palavras alfabéticas não-CNPJ/não-INSS, retorna o texto plano limpo.
         * @param {string} textoBruto
         * @param {string} [modoShiftCnjOpcional]
         * @returns {string}
         */
        aplicarFiltroShiftParaColagem(textoBruto, modoShiftCnjOpcional = null) {
            const texto = typeof textoBruto === 'string' ? textoBruto : String(textoBruto || '');
            const textoTrim = texto.trim();
            if (!textoTrim) return '';

            const estado = this._p_deps.obterEstadoOpcoes() || {};
            const modoShift = modoShiftCnjOpcional || estado.modoShiftCnj || '20digitos';
            const C = obterConstantesGlobais();
            const EXPR = C && C.EXPRESSOES_REGULARES ? C.EXPRESSOES_REGULARES : null;
            const REGEX_AUD = C && C.REGEX_AUDITORIA ? C.REGEX_AUDITORIA : null;

            /* Caso especial de benefício INSS com espécie prefixada (ex: 31/123.456.789-0 -> 1234567890) */
            const matchInssComEsp = textoTrim.match(/^(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
            if (matchInssComEsp) {
                return matchInssComEsp[2].replace(/\D+/g, '');
            }

            /* CNPJ alfanumérico (nova regra RFB 2026) */
            if (REGEX_AUD && REGEX_AUD.CNPJ_ISOLADO && REGEX_AUD.CNPJ_ISOLADO.test(textoTrim)) {
                return textoTrim.toUpperCase().replace(/[^A-Z0-9]+/g, '');
            }

            /* Retira pontuação/símbolos comuns para checar se restam apenas dígitos numéricos */
            const semPontuacaoESimbolos = textoTrim.replace(/[\s.,\-\/\\():;R$€£¥%°ºª§_+*#|]+/g, '');
            if (semPontuacaoESimbolos && /^\d+$/.test(semPontuacaoESimbolos) && !/[\p{L}]/u.test(semPontuacaoESimbolos)) {
                let digitosPuros = semPontuacaoESimbolos;
                const rxCnj = (EXPR && EXPR.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL)
                    ? EXPR.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL
                    : /^(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;
                const matchCnj = textoTrim.match(rxCnj);
                if (matchCnj && matchCnj[0] === textoTrim && modoShift !== 'semZeros') {
                    const seqPreenchida = matchCnj[1].padStart(7, '0');
                    digitosPuros = seqPreenchida + digitosPuros.substring(matchCnj[1].length);
                }
                return digitosPuros;
            }

            /* Se contiver texto misto com CNJ isolado ou dígitos puros, extrai CNJ formatado se único */
            const matchCnjEmbutido = textoTrim.match(/\b(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})\b/);
            if (matchCnjEmbutido && textoTrim.length <= 32) {
                let seq = matchCnjEmbutido[1];
                if (modoShift !== 'semZeros') seq = seq.padStart(7, '0');
                return `${seq}${matchCnjEmbutido[2]}${matchCnjEmbutido[3]}${matchCnjEmbutido[4]}${matchCnjEmbutido[5]}${matchCnjEmbutido[6]}`;
            }

            return textoTrim;
        }

        _p_converterNivelParaIndice(nivelRaw, temHtmlFormatado) {
            if (!temHtmlFormatado) return 0;
            const chave = String(nivelRaw || 'basico').trim().toLowerCase();
            return Object.prototype.hasOwnProperty.call(NIVEL_CLIPBOARD_INDICE, chave)
                ? NIVEL_CLIPBOARD_INDICE[chave]
                : 1;
        }

        obterNivelEFormatosParaColagem(itemInterno, modo = 'normal', opcoesColagem = {}) {
            try {
                const aplicarShift = Boolean(opcoesColagem && opcoesColagem.aplicarFiltroShift);
                const forcarTexto = Boolean((opcoesColagem && opcoesColagem.forcarSomenteTexto) || aplicarShift || modo === 'texto_puro');
                const ehObjeto = Boolean(itemInterno && typeof itemInterno === 'object');
                const textoBruto = (typeof itemInterno === 'string')
                    ? itemInterno
                    : ((ehObjeto && typeof itemInterno.texto === 'string') ? itemInterno.texto : '');
                const htmlBruto = (ehObjeto && itemInterno.formatado && typeof itemInterno.html === 'string')
                    ? itemInterno.html
                    : '';

                const nivelIdx = forcarTexto
                    ? 0
                    : this._p_converterNivelParaIndice(ehObjeto ? itemInterno.nivelCopia : 'texto_puro', Boolean(htmlBruto.trim()));
                const nivelCopia = NOMES_NIVEL_CLIPBOARD[nivelIdx] || 'texto_puro';
                const formatado = Boolean(nivelIdx >= 1 && htmlBruto);
                const html = formatado ? htmlBruto : '';

                const extrasBruto = (formatado && ehObjeto && itemInterno.formatosExtras && typeof itemInterno.formatosExtras === 'object')
                    ? itemInterno.formatosExtras
                    : null;
                let formatosExtras = null;
                if (extrasBruto) {
                    const filtrado = {
                        uriList: typeof extrasBruto.uriList === 'string' ? extrasBruto.uriList : '',
                        estruturadoMime: typeof extrasBruto.estruturadoMime === 'string' ? extrasBruto.estruturadoMime : '',
                        estruturadoConteudo: typeof extrasBruto.estruturadoConteudo === 'string' ? extrasBruto.estruturadoConteudo : '',
                        markdown: (nivelIdx >= 2 && typeof extrasBruto.markdown === 'string') ? extrasBruto.markdown : '',
                        rtf: (nivelIdx >= 3 && typeof extrasBruto.rtf === 'string') ? extrasBruto.rtf : '',
                        svgMarkup: (nivelIdx >= 4 && typeof extrasBruto.svgMarkup === 'string') ? extrasBruto.svgMarkup : ''
                    };
                    if (Object.values(filtrado).some(Boolean)) {
                        formatosExtras = filtrado;
                    }
                }

                const tiposClipboard = ['text/plain'];
                if (formatado) {
                    tiposClipboard.push('text/html');
                    if (formatosExtras) {
                        if (formatosExtras.uriList) tiposClipboard.push('text/uri-list');
                        if (formatosExtras.estruturadoMime && formatosExtras.estruturadoConteudo) {
                            tiposClipboard.push(formatosExtras.estruturadoMime);
                        }
                        if (formatosExtras.markdown) tiposClipboard.push('text/markdown');
                        if (formatosExtras.rtf) tiposClipboard.push('text/rtf');
                        if (formatosExtras.svgMarkup) tiposClipboard.push('image/svg+xml');
                    }
                }

                return { texto: textoBruto, html, formatado, nivelCopia, nivelIdx, formatosExtras, tiposClipboard };
            } catch (_) {
                return { texto: '', html: '', formatado: false, nivelCopia: 'texto_puro', nivelIdx: 0, formatosExtras: null, tiposClipboard: ['text/plain'] };
            }
        }

        _p_preencherDataTransferPorNivel(dt, payload, ehEditorRico) {
            if (!dt || !payload) return;
            try {
                if (payload.formatado && payload.nivelIdx >= 1) {
                    if (payload.html && ehEditorRico) {
                        dt.setData('text/html', payload.html);
                    }
                    if (payload.formatosExtras) {
                        const ex = payload.formatosExtras;
                        if (ex.uriList) dt.setData('text/uri-list', ex.uriList);
                        if (ex.estruturadoMime && ex.estruturadoConteudo) {
                            dt.setData(ex.estruturadoMime, ex.estruturadoConteudo);
                        }
                        if (payload.nivelIdx >= 2 && ex.markdown) {
                            dt.setData('text/markdown', ex.markdown);
                        }
                        if (payload.nivelIdx >= 3 && ex.rtf) {
                            dt.setData('text/rtf', ex.rtf);
                        }
                        if (payload.nivelIdx >= 4 && ex.svgMarkup) {
                            dt.setData('image/svg+xml', ex.svgMarkup);
                        }
                    }
                }
                dt.setData('text/plain', payload.texto || '');
            } catch (_) { }
        }

        emularTeclasColar(alvo, texto, html, opcoes = {}) {
            if (this._p_colagemEmAndamento) return false;
            this._p_colagemEmAndamento = true;
            try {
                if (!alvo) return false;
                this.focarElementoSeguro(alvo);

                const itemSintetico = {
                    texto: texto || '',
                    html: html || '',
                    formatado: Boolean(html),
                    nivelCopia: (opcoes && opcoes.nivelCopia) || (html ? 'basico' : 'texto_puro'),
                    formatosExtras: (opcoes && opcoes.formatosExtras) || null
                };
                const payload = this.obterNivelEFormatosParaColagem(itemSintetico, (opcoes && opcoes.modo) || 'normal', opcoes);

                alvo.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'v', code: 'KeyV', keyCode: 86, which: 86, ctrlKey: true,
                    bubbles: true, cancelable: true, composed: true
                }));

                let pasteTratadoPeloEditor = false;
                const ehEditorRico = Boolean(alvo.isContentEditable || (alvo.closest && alvo.closest('[contenteditable]:not([contenteditable="false"])')) || (typeof document !== 'undefined' && document.designMode === 'on'));
                try {
                    if (typeof DataTransfer !== 'undefined') {
                        const dt = new DataTransfer();
                        this._p_preencherDataTransferPorNivel(dt, payload, ehEditorRico);
                        const evtPaste = new ClipboardEvent('paste', {
                            clipboardData: dt, bubbles: true, cancelable: true, composed: true
                        });
                        pasteTratadoPeloEditor = !alvo.dispatchEvent(evtPaste);
                    }
                } catch (_) { }

                if (!pasteTratadoPeloEditor) {
                    let colouExec = false;
                    try { colouExec = document.execCommand('paste'); } catch (_) { }
                    if (!colouExec && payload.formatado && payload.html && ehEditorRico) {
                        try { colouExec = document.execCommand('insertHTML', false, payload.html); } catch (_) { }
                    }
                    if (!colouExec) {
                        const usarHtml = Boolean(ehEditorRico && payload.formatado && payload.html);
                        const conteudoParaInserir = usarHtml ? payload.html : (payload.texto || '');
                        this.inserirTextoEmElemento(alvo, conteudoParaInserir, usarHtml);
                    }
                }

                alvo.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'v', code: 'KeyV', keyCode: 86, which: 86, ctrlKey: true,
                    bubbles: true, cancelable: true, composed: true
                }));
                return true;
            } catch (_) {
                return false;
            } finally {
                this._p_colagemEmAndamento = false;
            }
        }

        emularTeclasWinV(alvo) {
            try {
                const el = alvo || (typeof document !== 'undefined' ? (document.activeElement || document.body) : null);
                if (!el) return false;
                this.focarElementoSeguro(el);
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', code: 'MetaLeft', keyCode: 91, which: 91, metaKey: true, bubbles: true, cancelable: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', keyCode: 86, which: 86, metaKey: true, bubbles: true, cancelable: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'v', code: 'KeyV', keyCode: 86, which: 86, metaKey: true, bubbles: true, cancelable: true, composed: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', code: 'MetaLeft', keyCode: 91, which: 91, metaKey: false, bubbles: true, composed: true }));
                return true;
            } catch (_) {
                return false;
            }
        }

        confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota = false) {
            try {
                const estado = this._p_deps.obterEstadoOpcoes() || {};
                const txt = (typeof textoColado === 'string' && textoColado.trim().length > 0)
                    ? textoColado.trim()
                    : ((typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto) || estado.ultimoTextoLimpo || '');
                const agoraConfirm = Date.now();
                if (!origemRemota && txt && txt === this._p_ultimoTextoConfirmadoGlobal && (agoraConfirm - this._p_ultimoTsConfirmadoGlobal) < 350) {
                    return null;
                }
                if (!origemRemota && txt) {
                    this._p_ultimoTextoConfirmadoGlobal = txt;
                    this._p_ultimoTsConfirmadoGlobal = agoraConfirm;
                }
                const resMarcador = this._p_deps.confirmarVisualMarcador(txt);
                if (!origemRemota && txt) {
                    const idInstancia = (typeof window !== 'undefined')
                        ? (window.__JUSGOV_ID_INSTANCIA_FRAME__ || (window.__JUSGOV_ID_INSTANCIA_FRAME__ = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
                        : 'frame';
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.set({
                            ultimaColagemConfirmadaGlobal: {
                                idOrigem: idInstancia,
                                texto: txt,
                                timestamp: agoraConfirm
                            }
                        });
                    }
                }
                return resMarcador;
            } catch (_) {
                return null;
            }
        }
    }

    Object.freeze(ColarFormatacao.prototype);
    return Object.freeze(ColarFormatacao);
}));