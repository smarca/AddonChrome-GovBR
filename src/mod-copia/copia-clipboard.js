/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-clipboard.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 1 - CÓPIA INTELIGENTE & FORENSE (Clipboard Interno & Proxy de Colagem)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-clipboard.js
 * - Classe Exportada: GerenciadorClipboardInterno (window.JusGovClipboardInterno)
 * - Métodos Públicos: salvarClipboardInternoComBackup, registrarUltimaSelecao,
 *   gravarNaAreaDeTransferencia; proxies de compatibilidade para copia-colar.js
 *   (emularTeclasColar, emularTeclasWinV, inserirTextoEmElemento,
 *   confirmarColagemGlobalEMarcarPermanente, executarColagemBotaoDireito)
 * - Regras / Seções: ADR-002 (Simulação sem readText), BLIND-01 / Seção 6.104 (512KB + ordem estrita),
 *   BUG-17 / Seções 6.110 e 6.120 (2 Slots passivos), ARQ-08 (Colagem isolada em copia-colar.js),
 *   Diretriz 16 (SRP + DIP + Null Object)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) MEMÓRIA PASSIVA DE 2 NÍVEIS SEM READTEXT: Jamais invoca navigator.clipboard.readText().
 *    Grava Slot 1 (window.__JUSGOV_ULTIMO_CLIPBOARD__) e preserva Slot 2
 *    (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) de forma idempotente quando igual.
 * 2) ORDEM ESTRITA (BLIND-01): Sempre valida e grava na memória interna (<= 512KB) ANTES
 *    de gravar no clipboard do sistema operacional via ClipboardItem / writeText / textarea.
 * 3) SEPARAÇÃO DE COLAGEM (ARQ-08): Toda a lógica de inserção DOM, emulação de teclas e
 *    execução de colagem reside exclusivamente em copia-colar.js (JusGovModuloColagem).
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
        #colagem = null;
        #deps = {
            obterEstadoOpcoes: () => ({ manterFormatacaoBasica: true, nivelFiltroFormatacao: 'basico', ultimoTextoLimpo: '' }),
            normalizarNivelFiltro: (n) => n || 'basico',
            verificarSeTextoEhBlocoOuPalavraUnica: () => false,
            aplicarFiltroHtmlPorNivel: () => '',
            envolverHtmlComResetDeCursorParaWord: (h) => h,
            extrairTextoPuroSanitizado: (v) => String(v || ''),
            aplicarFiltro1DadosLixo: (v) => String(v || ''),
            aplicarFiltro3InformacoesELinhas: (v) => String(v || ''),
            gerarMapaFormatosClipboard: null,
            confirmarVisualMarcador: () => null
        };

        constructor(opcoes = {}) {
            this.configurarDependencias(opcoes);
        }

        configurarDependencias(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            if (opcoes.gerenciadorColagem && typeof opcoes.gerenciadorColagem.executarColagemBotaoDireito === 'function') {
                this.#colagem = opcoes.gerenciadorColagem;
            }
            Object.keys(this.#deps).forEach((k) => {
                if (typeof opcoes[k] === 'function') {
                    this.#deps[k] = opcoes[k];
                }
            });
            if (this.#colagem && typeof this.#colagem.configurarDependencias === 'function') {
                this.#colagem.configurarDependencias({
                    obterEstadoOpcoes: () => this.#deps.obterEstadoOpcoes(),
                    confirmarVisualMarcador: (txt) => this.#deps.confirmarVisualMarcador(txt)
                });
            }
        }

        #obterModuloColagem() {
            if (this.#colagem) return this.#colagem;
            let ClasseColagem = null;
            if (typeof window !== 'undefined' && typeof (window.JusGovModuloColar || window.JusGovModuloColagem) === 'function') {
                ClasseColagem = window.JusGovModuloColar || window.JusGovModuloColagem;
            } else if (typeof self !== 'undefined' && typeof (self.JusGovModuloColar || self.JusGovModuloColagem) === 'function') {
                ClasseColagem = self.JusGovModuloColar || self.JusGovModuloColagem;
            } else if (typeof require === 'function') {
                try { ClasseColagem = require('../mod-colar/mod-colar.js'); } catch (_) { }
            }
            if (typeof ClasseColagem === 'function') {
                this.#colagem = new ClasseColagem({
                    obterEstadoOpcoes: () => this.#deps.obterEstadoOpcoes(),
                    confirmarVisualMarcador: (txt) => this.#deps.confirmarVisualMarcador(txt)
                });
                return this.#colagem;
            }
            return (ClasseColagem && ClasseColagem.NULL_OBJECT) || {
                emularTeclasColar: () => false,
                emularTeclasWinV: () => false,
                inserirTextoEmElemento: () => false,
                confirmarColagemGlobalEMarcarPermanente: () => null,
                executarColagemBotaoDireito: async () => false
            };
        }

        #converterNivelParaIndice(nivelRaw, temHtmlFormatado) {
            if (!temHtmlFormatado) return 0;
            const norm = String(this.#deps.normalizarNivelFiltro(nivelRaw || 'basico') || 'basico').toLowerCase();
            if (norm === 'texto_puro' || norm === 'somente_texto') return 0;
            if (norm === 'intermediario') return 2;
            if (norm === 'avancado') return 3;
            if (norm === 'estendido' || norm === 'sem_filtro') return 4;
            return 1;
        }

        #converterIndiceParaNivel(idx) {
            const mapa = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido'];
            return mapa[Math.max(0, Math.min(4, Number(idx) || 0))];
        }

        #normalizarItemParaSlot(novoPayload) {
            const txt = typeof novoPayload.texto === 'string' ? novoPayload.texto : '';
            const htmlBruto = typeof novoPayload.html === 'string' ? novoPayload.html : '';
            const temFormatacao = Boolean(novoPayload.formatado && htmlBruto.trim());
            const nivelIdx = this.#converterNivelParaIndice(novoPayload.nivelCopia, temFormatacao);
            const nivelCopia = this.#converterIndiceParaNivel(nivelIdx);
            const formatado = Boolean(nivelIdx >= 1 && htmlBruto);
            const html = formatado ? htmlBruto : '';

            const limitarStr = (v) => {
                if (typeof v !== 'string') return '';
                return (v.length > 65536) ? v.slice(0, 65536) : v;
            };

            const extrasOrig = (formatado && novoPayload.formatosExtras && typeof novoPayload.formatosExtras === 'object')
                ? novoPayload.formatosExtras
                : null;
            let formatosExtras = null;
            if (extrasOrig && nivelIdx >= 1) {
                const filtrado = {
                    uriList: limitarStr(extrasOrig.uriList),
                    estruturadoMime: limitarStr(extrasOrig.estruturadoMime),
                    estruturadoConteudo: limitarStr(extrasOrig.estruturadoConteudo),
                    markdown: (nivelIdx >= 2) ? limitarStr(extrasOrig.markdown) : '',
                    rtf: (nivelIdx >= 3) ? limitarStr(extrasOrig.rtf) : '',
                    svgMarkup: (nivelIdx >= 4) ? limitarStr(extrasOrig.svgMarkup) : ''
                };
                if (Object.values(filtrado).some(Boolean)) {
                    formatosExtras = filtrado;
                }
            }

            const tiposDisponiveis = ['text/plain'];
            if (formatado) {
                tiposDisponiveis.push('text/html');
                if (formatosExtras) {
                    if (formatosExtras.uriList) tiposDisponiveis.push('text/uri-list');
                    if (formatosExtras.estruturadoMime && formatosExtras.estruturadoConteudo) tiposDisponiveis.push(formatosExtras.estruturadoMime);
                    if (formatosExtras.markdown) tiposDisponiveis.push('text/markdown');
                    if (formatosExtras.rtf) tiposDisponiveis.push('text/rtf');
                    if (formatosExtras.svgMarkup) tiposDisponiveis.push('image/svg+xml');
                }
            }

            return {
                texto: txt,
                html,
                formatado,
                nivelCopia,
                tiposDisponiveis,
                formatosExtras
            };
        }

        registrarUltimaSelecao(novoItem, itemAnteriorOpcional, historicoOpcional = null) {
            if (!novoItem || (!novoItem.texto && !novoItem.html)) return;
            try {
                const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
                if (storageLocal) {
                    const empacotarItemStorage = (it) => ({
                        texto: it.texto || '',
                        html: it.html || '',
                        formatado: Boolean(it.formatado),
                        nivelCopia: it.nivelCopia || (it.formatado && it.html ? 'basico' : 'texto_puro'),
                        tiposDisponiveis: Array.isArray(it.tiposDisponiveis) ? it.tiposDisponiveis : ['text/plain'],
                        formatosExtras: (it.formatado && it.formatosExtras && typeof it.formatosExtras === 'object') ? it.formatosExtras : null,
                        timestamp: it.timestamp || Date.now()
                    });
                    const historicoRaw = Array.isArray(historicoOpcional)
                        ? historicoOpcional
                        : ((typeof window !== 'undefined' && Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) ? window.__JUSGOV_HISTORICO_CLIPBOARD__ : []);
                    const historicoParaSalvar = historicoRaw.filter(Boolean).slice(0, 2).map(empacotarItemStorage);
                    const payloadStorage = {
                        ultimoClipboardInterno: empacotarItemStorage(novoItem),
                        historicoClipboardInterno: historicoParaSalvar
                    };
                    if (itemAnteriorOpcional && (itemAnteriorOpcional.texto || itemAnteriorOpcional.html)) {
                        payloadStorage.ultimoClipboardAnteriorInterno = empacotarItemStorage(itemAnteriorOpcional);
                    }
                    storageLocal.set(payloadStorage);
                }
            } catch (_) { }
        }

        salvarClipboardInternoComBackup(novoPayload) {
            try {
                if (!novoPayload || typeof novoPayload !== 'object') return false;
                const LIMITE_BYTES_EMULACAO = 512 * 1024;
                const norm = this.#normalizarItemParaSlot(novoPayload);
                const { texto: txt, html, formatado, nivelCopia, tiposDisponiveis, formatosExtras } = norm;

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

                const clonarSlotAnterior = (orig) => ({
                    texto: orig.texto || '',
                    html: orig.html || '',
                    formatado: Boolean(orig.formatado),
                    nivelCopia: orig.nivelCopia || (orig.formatado && orig.html ? 'basico' : 'texto_puro'),
                    tiposDisponiveis: Array.isArray(orig.tiposDisponiveis) ? [...orig.tiposDisponiveis] : ['text/plain'],
                    formatosExtras: (orig.formatado && orig.formatosExtras) ? { ...orig.formatosExtras } : null
                });

                if (!Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
                    if (atual && (atual.texto || atual.html)) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__.push({
                            ...clonarSlotAnterior(atual),
                            timestamp: Date.now()
                        });
                    }
                }

                const registroSlot = {
                    texto: txt,
                    html,
                    formatado,
                    nivelCopia,
                    tiposDisponiveis,
                    formatosExtras
                };

                const preservarHistorico = Boolean(novoPayload.preservarHistorico);
                if (!ehConteudoIdenticoAoAtual && !preservarHistorico) {
                    if (atual && (atual.texto || atual.html)) {
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = clonarSlotAnterior(atual);
                    }
                    window.__JUSGOV_HISTORICO_CLIPBOARD__.unshift({
                        ...registroSlot,
                        timestamp: Date.now()
                    });
                    if (window.__JUSGOV_HISTORICO_CLIPBOARD__.length > 2) {
                        window.__JUSGOV_HISTORICO_CLIPBOARD__.length = 2;
                    }
                } else if (Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                    window.__JUSGOV_HISTORICO_CLIPBOARD__[0] = {
                        ...registroSlot,
                        timestamp: Date.now()
                    };
                }

                window.__JUSGOV_ULTIMO_CLIPBOARD__ = registroSlot;
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

        #converterDataUrlParaBlob(dataUrl, mimePadrao) {
            try {
                if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
                const partes = dataUrl.split(',');
                if (partes.length < 2) return null;
                const matchMime = partes[0].match(/data:([^;]+);/i);
                const mime = (matchMime && matchMime[1]) ? matchMime[1].toLowerCase() : mimePadrao;
                const binStr = (typeof atob === 'function') ? atob(partes[1]) : '';
                if (!binStr) return null;
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                return new Blob([bytes], { type: mime });
            } catch (_) {
                return null;
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
            const ehBlocoOuPalavraPura = this.#deps.verificarSeTextoEhBlocoOuPalavraUnica(textoFinal);
            if (deveManterFormatacao && ehBlocoOuPalavraPura) {
                deveManterFormatacao = false;
            }

            if (typeof window !== 'undefined' && window.__JUSGOV_AUDITORIA_EM_CURSO__) {
                return Boolean(this.salvarClipboardInternoComBackup({ texto: textoFinal, html: '', formatado: false, nivelCopia: 'texto_puro', preservarHistorico }));
            }

            if (deveManterFormatacao) {
                let mapaFormatos = null;
                try {
                    if (typeof this.#deps.gerarMapaFormatosClipboard === 'function') {
                        mapaFormatos = this.#deps.gerarMapaFormatosClipboard(rangeDOMOpcional, nivelNorm, { textoFallback: textoFinal });
                    } else {
                        const htmlFallback = this.#deps.aplicarFiltroHtmlPorNivel(rangeDOMOpcional, nivelNorm);
                        mapaFormatos = {
                            nivelNorm,
                            nivelIdx: 1,
                            textoPlano: htmlFallback ? (this.#deps.extrairTextoPuroSanitizado(htmlFallback) || textoFinal) : textoFinal,
                            htmlClipboard: htmlFallback ? this.#deps.envolverHtmlComResetDeCursorParaWord(htmlFallback) : '',
                            uriList: '',
                            estruturado: null,
                            markdown: '',
                            rtf: '',
                            imagens: { svgMarkup: '', dataUrlPng: '', dataUrlJpeg: '' }
                        };
                    }
                } catch (_) {
                    mapaFormatos = null;
                }

                const htmlParaClipboard = (mapaFormatos && mapaFormatos.htmlClipboard) ? mapaFormatos.htmlClipboard : '';
                if (htmlParaClipboard) {
                    const textoPlanoMultilinha = (mapaFormatos && mapaFormatos.textoPlano) || textoFinal;
                    const formatosExtras = {
                        uriList: (mapaFormatos && mapaFormatos.uriList) || '',
                        markdown: (mapaFormatos && mapaFormatos.markdown) || '',
                        rtf: (mapaFormatos && mapaFormatos.rtf) || '',
                        estruturadoMime: (mapaFormatos && mapaFormatos.estruturado && mapaFormatos.estruturado.mime) || '',
                        estruturadoConteudo: (mapaFormatos && mapaFormatos.estruturado && mapaFormatos.estruturado.conteudo) || '',
                        svgMarkup: (mapaFormatos && mapaFormatos.imagens && mapaFormatos.imagens.svgMarkup) || ''
                    };
                    const salvouInterno = this.salvarClipboardInternoComBackup({
                        texto: textoPlanoMultilinha,
                        html: htmlParaClipboard,
                        formatado: true,
                        nivelCopia: (mapaFormatos && mapaFormatos.nivelNorm) || nivelNorm,
                        preservarHistorico,
                        formatosExtras
                    });
                    if (!salvouInterno) return false;

                    const extrasTexto = {};
                    if (formatosExtras.uriList) extrasTexto['text/uri-list'] = formatosExtras.uriList;
                    if (formatosExtras.estruturadoMime && formatosExtras.estruturadoConteudo) {
                        extrasTexto[formatosExtras.estruturadoMime] = formatosExtras.estruturadoConteudo;
                    }
                    if (formatosExtras.markdown) extrasTexto['text/markdown'] = formatosExtras.markdown;
                    if (formatosExtras.rtf) extrasTexto['text/rtf'] = formatosExtras.rtf;
                    if (formatosExtras.svgMarkup) extrasTexto['image/svg+xml'] = formatosExtras.svgMarkup;

                    try {
                        const temFocoParaClip = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
                        if (temFocoParaClip && typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                            const blobsNucleo = {
                                'text/html': new Blob([htmlParaClipboard], { type: 'text/html' }),
                                'text/plain': new Blob([textoPlanoMultilinha], { type: 'text/plain' })
                            };
                            const blobsExtras = { ...blobsNucleo };
                            const suportaTipo = (t) => (typeof ClipboardItem.supports === 'function') ? Boolean(ClipboardItem.supports(t)) : false;

                            Object.keys(extrasTexto).forEach((mime) => {
                                const val = extrasTexto[mime];
                                if (!val) return;
                                if (suportaTipo(mime)) {
                                    blobsExtras[mime] = new Blob([val], { type: mime });
                                } else if (suportaTipo(`web ${mime}`)) {
                                    blobsExtras[`web ${mime}`] = new Blob([val], { type: mime });
                                }
                            });

                            if (mapaFormatos && mapaFormatos.imagens) {
                                const blobPng = this.#converterDataUrlParaBlob(mapaFormatos.imagens.dataUrlPng, 'image/png');
                                if (blobPng && (typeof ClipboardItem.supports !== 'function' || suportaTipo('image/png'))) {
                                    blobsExtras['image/png'] = blobPng;
                                }
                                const blobJpg = this.#converterDataUrlParaBlob(mapaFormatos.imagens.dataUrlJpeg, 'image/jpeg');
                                if (blobJpg) {
                                    if (suportaTipo('image/jpeg')) {
                                        blobsExtras['image/jpeg'] = blobJpg;
                                    } else if (suportaTipo('web image/jpeg')) {
                                        blobsExtras['web image/jpeg'] = blobJpg;
                                    }
                                }
                            }

                            try {
                                await navigator.clipboard.write([new ClipboardItem(blobsExtras)]);
                                return true;
                            } catch (_) {
                                await navigator.clipboard.write([new ClipboardItem(blobsNucleo)]);
                                return true;
                            }
                        }
                    } catch (_) { }

                    try {
                        let copiouViaEvento = false;
                        const manipuladorCopy = (ev) => {
                            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
                            if (ev && typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                            if (ev && ev.clipboardData) {
                                ev.clipboardData.setData('text/html', htmlParaClipboard);
                                ev.clipboardData.setData('text/plain', textoPlanoMultilinha);
                                Object.keys(extrasTexto).forEach((mime) => {
                                    try {
                                        if (extrasTexto[mime]) ev.clipboardData.setData(mime, extrasTexto[mime]);
                                    } catch (_) { }
                                });
                                ev.preventDefault();
                                copiouViaEvento = true;
                            }
                        };
                        if (typeof window !== 'undefined') window.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__ = true;
                        try {
                            window.addEventListener('copy', manipuladorCopy, { capture: true, once: true });
                            const sucessoCopy = document.execCommand('copy');
                            if (sucessoCopy || copiouViaEvento) return true;
                        } finally {
                            if (typeof window !== 'undefined') window.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__ = false;
                            window.removeEventListener('copy', manipuladorCopy, { capture: true });
                        }
                    } catch (_) { }
                }
            }

            let textoPuroFinal = '';
            try {
                if (rangeDOMOpcional && nivelNorm === 'texto_puro') {
                    textoPuroFinal = this.#deps.extrairTextoPuroSanitizado(rangeDOMOpcional);
                }
                if (!textoPuroFinal) {
                    textoPuroFinal = (typeof textoFinal === 'string' && (textoFinal.indexOf('<') !== -1 || textoFinal.indexOf('\r') !== -1))
                        ? this.#deps.extrairTextoPuroSanitizado(textoFinal)
                        : this.#deps.aplicarFiltro3InformacoesELinhas(this.#deps.aplicarFiltro1DadosLixo(textoFinal));
                }
            } catch (_) {
                textoPuroFinal = String(textoFinal || '');
            }
            textoPuroFinal = (textoPuroFinal || '').replace(/[ ]{2,}/g, ' ').trim();

            const salvouInternoTexto = this.salvarClipboardInternoComBackup({ texto: textoPuroFinal, html: '', formatado: false, nivelCopia: 'texto_puro', preservarHistorico });
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
            return this.#obterModuloColagem().emularTeclasColar(alvo, texto, html);
        }

        emularTeclasWinV(alvo) {
            return this.#obterModuloColagem().emularTeclasWinV(alvo);
        }

        inserirTextoEmElemento(alvo, texto, ehHtmlFormatado) {
            return this.#obterModuloColagem().inserirTextoEmElemento(alvo, texto, ehHtmlFormatado);
        }

        confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota = false) {
            return this.#obterModuloColagem().confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota);
        }

        async executarColagemBotaoDireito(alvo, modo, usarAnterior = false, opcoesColagem = {}) {
            return this.#obterModuloColagem().executarColagemBotaoDireito(alvo, modo, usarAnterior, opcoesColagem);
        }
    }

    return Object.freeze(GerenciadorClipboardInterno);
}));
