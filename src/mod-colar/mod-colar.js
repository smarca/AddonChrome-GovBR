/* ==========================================================================
 * ARQUIVO: src/mod-colar/mod-colar.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COLAR — Motor Independente de Colagem Blindada (Fachada)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-colar/mod-colar.js
 * - Classe Exportada: GerenciadorColagem (window.JusGovModuloColar / alias window.JusGovModuloColagem)
 * - Null Object: JusGovModuloColar.NULL_OBJECT (e JusGovModuloColagem.NULL_OBJECT)
 * - Métodos Públicos:
 *     aplicarFiltroShiftParaColagem(texto, modoShiftCnj),
 *     resolverAlvoEditavel(el), focarElementoSeguro(el),
 *     ativarComponenteParaColagem(alvo, alvoFoco, opcoes),
 *     confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX, clientY, docContext, alvoBruto, opcoesColagem),
 *     executarColagem(alvo, modo, usarAnterior, opcoesColagem),
 *     executarColagemBotaoDireito(alvo, modo, usarAnterior, opcoesColagem),
 *     inserirTextoEmElemento(alvo, texto, ehHtmlFormatado),
 *     emularTeclasColar(alvo, texto, html), emularTeclasWinV(alvo),
 *     confirmarColagemGlobalEMarcarPermanente(textoColado, origemRemota)
 * - Regras / Seções: ARQ-08 (Separação exclusiva da funcionalidade de Colar em src/mod-copia/),
 *   FEAT-65 (Botão do Meio + Shift com filtro idêntico a Copiar + Shift; Alt+Shift somente texto),
 *   BLIND-01 / Anti-Loop (trava reentrante __JUSGOV_COLAGEM_EM_ANDAMENTO__ e debounce de disparo).
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) SEPARAÇÃO DE RESPONSABILIDADE (ARQ-08): Concentra 100% da lógica de resolução de alvo
 *    editável, ativação por Alt, filtragem Shift (CNJ/Datas/CPF/CNPJ/números) na colagem,
 *    inserção DOM em <input>/<textarea>/[contenteditable] e marcação visual de colagem.
 * 2) BLINDAGEM ANTI-LOOP: Mantém guarda reentrante em instância + marcação temporal global
 *    para impedir que eventos sintéticos (`input`, `change`, `paste`, `focusin`) disparem
 *    recursivamente novas colagens ou autoseleções infinitas.
 * 3) PADRÃO DE FILTRO SHIFT NA COLAGEM (FEAT-65): Quando `aplicarFiltroShift === true`, aplica
 *    a mesma regra de extração numérica/zero-pad CNJ (`modoShiftCnj`) usada na cópia com Shift
 *    e força inserção em modo `texto_puro`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const cls = fabrica();
        raiz.JusGovModuloColar = cls;
        raiz.JusGovModuloColagem = cls;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const INTERVALO_DEBOUNCE_COLAGEM_MS = 120;

    function obterConstantesGlobais() {
        const g = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : null);
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

    const NULL_COLAGEM = Object.freeze({
        aplicarFiltroShiftParaColagem: (txt) => String(txt || ''),
        resolverAlvoEditavel: () => null,
        focarElementoSeguro: () => false,
        ativarComponenteParaColagem: () => false,
        confirmarFocarEColarBotaoMeio: async () => false,
        executarColagem: async () => false,
        executarColagemBotaoDireito: async () => false,
        inserirTextoEmElemento: () => false,
        emularTeclasColar: () => false,
        emularTeclasWinV: () => false,
        confirmarColagemGlobalEMarcarPermanente: () => null,
        obterNivelEFormatosParaColagem: () => ({ texto: '', html: '', formatado: false, nivelCopia: 'texto_puro', nivelIdx: 0, formatosExtras: null, tiposClipboard: ['text/plain'] })
    });

    class GerenciadorColagem {
        #colagemEmAndamento = false;
        #ultimoDisparoColagemTs = 0;
        #ultimoTextoConfirmadoGlobal = '';
        #ultimoTsConfirmadoGlobal = 0;
        #deps = {
            obterEstadoOpcoes: () => ({ manterFormatacaoBasica: true, nivelFiltroFormatacao: 'basico', ultimoTextoLimpo: '', modoShiftCnj: '20digitos', selecaoEditavelAtiva: true }),
            classificarContextoElementoAlvo: null,
            confirmarVisualMarcador: () => null,
            selecionarTudoAoEntrarNoInput: null
        };

        constructor(opcoes = {}) {
            this.configurarDependencias(opcoes);
        }

        static get NULL_OBJECT() {
            return NULL_COLAGEM;
        }

        configurarDependencias(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            Object.keys(this.#deps).forEach((k) => {
                if (typeof opcoes[k] === 'function') {
                    this.#deps[k] = opcoes[k];
                }
            });
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

            const estado = this.#deps.obterEstadoOpcoes() || {};
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

        /**
         * Resolve o hospedeiro editável mais próximo para colagem segura.
         * @param {Node|Element} el
         * @returns {Element|null}
         */
        resolverAlvoEditavel(el) {
            if (!el) return null;
            const cur = (el.nodeType === 3) ? el.parentElement : el;
            if (!cur || cur.nodeType !== 1) return null;
            const classificar = this.#deps.classificarContextoElementoAlvo;

            if (typeof cur.closest === 'function') {
                const campoDireto = cur.closest('input, textarea, rich-textarea');
                if (campoDireto) {
                    if (typeof classificar === 'function') {
                        if (classificar(campoDireto) === 'CAMPO_SIMPLES_EDITAVEL') return campoDireto;
                    } else if (!campoDireto.disabled && !campoDireto.readOnly) {
                        return campoDireto;
                    }
                }
                const ceHost = cur.closest('[contenteditable], .cke_editable, .ck-editor__editable, .ck-content, .tox-edit-area');
                if (ceHost) {
                    const attrCe = (typeof ceHost.getAttribute === 'function') ? ceHost.getAttribute('contenteditable') : null;
                    if (attrCe === null || attrCe.toLowerCase() !== 'false') {
                        if (typeof classificar !== 'function' || classificar(ceHost) !== 'LINK_CLICAVEL') {
                            return ceHost;
                        }
                    }
                }
            }

            if (typeof classificar === 'function') {
                const ctx = classificar(cur);
                if (ctx === 'CAMPO_SIMPLES_EDITAVEL' || ctx === 'EDITOR_MULTILINHA_EDITAVEL') {
                    return cur;
                }
            } else if ((cur.tagName === 'INPUT' || cur.tagName === 'TEXTAREA') && !cur.disabled && !cur.readOnly) {
                return cur;
            }
            return null;
        }

        focarElementoSeguro(el) {
            if (!el || typeof el.focus !== 'function') return false;
            try {
                el.focus({ preventScroll: true });
                return true;
            } catch (_) {
                try {
                    el.focus();
                    return true;
                } catch (__) {
                    return false;
                }
            }
        }

        ativarComponenteParaColagem(alvo, alvoFoco = null, opcoes = {}) {
            const alvoParaClicar = alvo || alvoFoco;
            const alvoParaFocar = alvoFoco || this.resolverAlvoEditavel(alvoParaClicar) || alvoParaClicar;
            if (!alvoParaClicar) return false;

            this.focarElementoSeguro(alvoParaFocar);
            try {
                const evBase = { bubbles: true, cancelable: true, button: 0 };
                if (typeof PointerEvent === 'function') {
                    alvoParaClicar.dispatchEvent(new PointerEvent('pointerdown', evBase));
                }
                alvoParaClicar.dispatchEvent(new MouseEvent('mousedown', evBase));
                alvoParaClicar.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
                if (typeof PointerEvent === 'function') {
                    alvoParaClicar.dispatchEvent(new PointerEvent('pointerup', evBase));
                }
                alvoParaClicar.dispatchEvent(new MouseEvent('mouseup', evBase));
                if (typeof alvoParaClicar.click === 'function') alvoParaClicar.click();
            } catch (_) { }

            this.focarElementoSeguro(alvoParaFocar);
            const estado = this.#deps.obterEstadoOpcoes() || {};
            const selEditAtiva = opcoes.selecaoEditavelAtiva !== undefined
                ? Boolean(opcoes.selecaoEditavelAtiva)
                : Boolean(estado.selecaoEditavelAtiva !== false);
            if (selEditAtiva && alvoParaFocar && alvoParaFocar.tagName === 'INPUT' && typeof alvoParaFocar.select === 'function') {
                if (typeof this.#deps.selecionarTudoAoEntrarNoInput === 'function') {
                    this.#deps.selecionarTudoAoEntrarNoInput(alvoParaFocar, 10);
                } else {
                    setTimeout(() => {
                        try {
                            if (typeof alvoParaFocar.focus === 'function') alvoParaFocar.focus();
                            alvoParaFocar.select();
                        } catch (_) { }
                    }, 10);
                }
            }
            return true;
        }

        #ehElementoCKEditorOuIframeRico(alvo, docRef = null) {
            if (!alvo) return false;
            try {
                const doc = docRef || alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
                if (doc && (doc.designMode === 'on' || (doc.body && doc.body.classList && doc.body.classList.contains('cke_editable')))) {
                    return true;
                }
                if (alvo.tagName === 'BODY' && alvo.isContentEditable) return true;
                if (alvo.classList && (alvo.classList.contains('cke_editable') || alvo.classList.contains('ck-editor__editable') || alvo.classList.contains('ck-content'))) {
                    return true;
                }
                if (typeof alvo.closest === 'function' && alvo.closest('.cke_editable, .ck-editor__editable, .ck-content')) {
                    return true;
                }
            } catch (_) { }
            return false;
        }

        #obterBlocoEditavelInternoSeguro(raiz) {
            if (!raiz || typeof raiz.querySelectorAll !== 'function') return raiz;
            try {
                const ehRaizEstrutural = (
                    raiz.tagName === 'BODY' ||
                    (raiz.classList && (
                        raiz.classList.contains('cke_editable') ||
                        raiz.classList.contains('paginaA4') ||
                        raiz.classList.contains('conteudoPaginaA4')
                    ))
                );
                if (ehRaizEstrutural) {
                    const blocos = raiz.querySelectorAll('.conteudoPaginaA4 p, .conteudoPaginaA4 div:not(.paginaA4):not(.conteudoPaginaA4), p, div:not(.paginaA4):not(.conteudoPaginaA4)');
                    if (blocos && blocos.length > 0) {
                        return blocos[blocos.length - 1];
                    }
                }
            } catch (_) { }
            return raiz;
        }

        #posicionarCursorSeguroEmContentEditable(alvoFoco, docRef, winRef, clientX = null, clientY = null) {
            if (!alvoFoco || !winRef || typeof winRef.getSelection !== 'function' || !docRef || typeof docRef.createRange !== 'function') {
                return false;
            }
            try {
                const sel = winRef.getSelection();
                if (!sel) return false;

                const temCoordenadas = (typeof clientX === 'number' && typeof clientY === 'number' && !Number.isNaN(clientX) && !Number.isNaN(clientY));
                const selDentroDoAlvo = Boolean(sel.rangeCount > 0 && sel.anchorNode && alvoFoco.contains && alvoFoco.contains(sel.anchorNode));
                const temSelecaoAtivaNaoColapsada = Boolean(selDentroDoAlvo && !sel.isCollapsed);

                /* Se o usuario selecionou um trecho dentro do editor para substituir ao colar, preserva a selecao */
                if (temSelecaoAtivaNaoColapsada) {
                    return true;
                }

                let rangeAlvo = null;
                if (temCoordenadas && typeof docRef.caretRangeFromPoint === 'function') {
                    try {
                        const rPonto = docRef.caretRangeFromPoint(clientX, clientY);
                        if (rPonto && rPonto.startContainer && alvoFoco.contains && alvoFoco.contains(rPonto.startContainer)) {
                            rangeAlvo = rPonto;
                        }
                    } catch (_) { }
                }

                if (rangeAlvo) {
                    const noContainer = rangeAlvo.startContainer;
                    const ehContainerRaizCritico = Boolean(
                        noContainer && noContainer.nodeType === 1 && (
                            noContainer.tagName === 'BODY' ||
                            (noContainer.classList && (noContainer.classList.contains('paginaA4') || noContainer.classList.contains('conteudoPaginaA4')))
                        )
                    );
                    if (ehContainerRaizCritico) {
                        const filhos = noContainer.children;
                        const idxFilho = (filhos && filhos.length > 0)
                            ? Math.min(Math.max(0, rangeAlvo.startOffset - 1), filhos.length - 1)
                            : -1;
                        const candidato = (idxFilho >= 0 && filhos[idxFilho])
                            ? (this.#obterBlocoEditavelInternoSeguro(filhos[idxFilho]) || filhos[idxFilho])
                            : this.#obterBlocoEditavelInternoSeguro(alvoFoco);
                        if (candidato && candidato !== noContainer) {
                            const rBloco = docRef.createRange();
                            rBloco.selectNodeContents(candidato);
                            rBloco.collapse(false);
                            rangeAlvo = rBloco;
                        }
                    }
                    sel.removeAllRanges();
                    sel.addRange(rangeAlvo);
                    return true;
                }

                const ancoraEhBodyDireto = Boolean(
                    selDentroDoAlvo &&
                    sel.anchorNode &&
                    sel.anchorNode.nodeType === 1 &&
                    (sel.anchorNode.tagName === 'BODY' || (sel.anchorNode.classList && sel.anchorNode.classList.contains('paginaA4')))
                );
                if (!selDentroDoAlvo || ancoraEhBodyDireto) {
                    const blocoSeguro = this.#obterBlocoEditavelInternoSeguro(alvoFoco) || alvoFoco;
                    const rangeFim = docRef.createRange();
                    rangeFim.selectNodeContents(blocoSeguro);
                    rangeFim.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(rangeFim);
                    return true;
                }
                return true;
            } catch (_) {
                return false;
            }
        }

        async confirmarFocarEColarBotaoMeio(alvoInicial, modo, usarAnterior, clientX = null, clientY = null, docContext = null, alvoBruto = null, opcoesColagem = {}) {
            try {
                const docRef = (alvoInicial && alvoInicial.ownerDocument) ? alvoInicial.ownerDocument : (docContext || (typeof document !== 'undefined' ? document : null));
                let alvoConfirmado = this.resolverAlvoEditavel(alvoInicial);
                if (alvoConfirmado && alvoConfirmado.isConnected === false) {
                    alvoConfirmado = null;
                }
                if (!alvoConfirmado && docRef && docRef.activeElement) {
                    alvoConfirmado = this.resolverAlvoEditavel(docRef.activeElement);
                }
                const raizBusca = (alvoBruto && alvoBruto.isConnected !== false) ? alvoBruto : ((alvoInicial && alvoInicial.isConnected !== false) ? alvoInicial : null);
                if (!alvoConfirmado && raizBusca && typeof raizBusca.querySelector === 'function') {
                    const filhoEdit = raizBusca.querySelector('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [contenteditable]:not([contenteditable="false"])');
                    if (filhoEdit) alvoConfirmado = this.resolverAlvoEditavel(filhoEdit);
                }
                if (!alvoConfirmado) return false;

                this.focarElementoSeguro(alvoConfirmado);

                const ehCe = Boolean(
                    alvoConfirmado.tagName !== 'INPUT' &&
                    alvoConfirmado.tagName !== 'TEXTAREA' &&
                    (alvoConfirmado.isContentEditable || (typeof alvoConfirmado.closest === 'function' && alvoConfirmado.closest('[contenteditable]:not([contenteditable="false"])')))
                );
                const winRef = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
                if (ehCe) {
                    this.#posicionarCursorSeguroEmContentEditable(alvoConfirmado, docRef, winRef, clientX, clientY);
                }

                const opcoesComCoords = { ...opcoesColagem, clientX, clientY };
                await this.executarColagem(alvoConfirmado, modo || 'normal', Boolean(usarAnterior), opcoesComCoords);
                return true;
            } catch (_) {
                return false;
            }
        }

        #converterNivelParaIndice(nivelRaw, temHtmlFormatado) {
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
                    : this.#converterNivelParaIndice(ehObjeto ? itemInterno.nivelCopia : 'texto_puro', Boolean(htmlBruto.trim()));
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

        #preencherDataTransferPorNivel(dt, payload, ehEditorRico) {
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
            if (this.#colagemEmAndamento) return false;
            this.#colagemEmAndamento = true;
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
                        this.#preencherDataTransferPorNivel(dt, payload, ehEditorRico);
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
                this.#colagemEmAndamento = false;
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

        inserirTextoEmElemento(alvo, texto, ehHtmlFormatado, opcoesColagem = {}) {
            if (!alvo) return false;
            const docRef = alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
            const winRef = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
            const prevInternaWin = (typeof window !== 'undefined') ? Boolean(window.__JUSGOV_COLAGEM_INTERNA_ATIVA__) : false;
            const prevInternaSub = (winRef && winRef !== window) ? Boolean(winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__) : false;
            if (typeof window !== 'undefined') window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = true;
            if (winRef && winRef !== window) {
                try { winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = true; } catch (_) { }
            }
            try {
                const alvoFoco = (alvo.tagName !== 'INPUT' && alvo.tagName !== 'TEXTAREA' && typeof alvo.closest === 'function')
                    ? (alvo.closest('[contenteditable]:not([contenteditable="false"])') || alvo)
                    : alvo;
                this.focarElementoSeguro(alvoFoco);

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
                        return true;
                    }

                    let start = null;
                    let end = null;
                    try {
                        start = (typeof alvo.selectionStart === 'number') ? alvo.selectionStart : null;
                        end = (typeof alvo.selectionEnd === 'number') ? alvo.selectionEnd : null;
                    } catch (_) { }

                    if (start !== null && end !== null) {
                        const valAnt = String(alvo.value || '');
                        const novoVal = valAnt.substring(0, start) + texto + valAnt.substring(end);
                        const novaPos = start + texto.length;
                        this.#definirValorInputNativo(alvo, novoVal);
                        try {
                            if (typeof alvo.setSelectionRange === 'function') {
                                alvo.setSelectionRange(novaPos, novaPos);
                            } else {
                                alvo.selectionStart = alvo.selectionEnd = novaPos;
                            }
                        } catch (_) {
                            if (typeof alvo.setRangeText === 'function') {
                                try { alvo.setRangeText(texto, start, end, 'end'); } catch (__) { }
                            }
                        }
                    } else {
                        this.#definirValorInputNativo(alvo, texto);
                    }

                    try {
                        const evInput = (typeof InputEvent === 'function')
                            ? new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertFromPaste', data: texto })
                            : new Event('input', { bubbles: true, composed: true });
                        alvo.dispatchEvent(evInput);
                        alvo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                    return true;
                }

                const cx = (opcoesColagem && typeof opcoesColagem.clientX === 'number') ? opcoesColagem.clientX : null;
                const cy = (opcoesColagem && typeof opcoesColagem.clientY === 'number') ? opcoesColagem.clientY : null;
                this.#posicionarCursorSeguroEmContentEditable(alvoFoco, docRef, winRef, cx, cy);

                const ehCkEditor = this.#ehElementoCKEditorOuIframeRico(alvoFoco, docRef);
                const usarInsertHtml = Boolean(ehHtmlFormatado && !ehCkEditor);

                let executou = false;
                try {
                    if (docRef && typeof docRef.execCommand === 'function') {
                        executou = docRef.execCommand(usarInsertHtml ? 'insertHTML' : 'insertText', false, texto);
                    }
                } catch (_) { }

                if (!executou && winRef && typeof winRef.getSelection === 'function') {
                    const sel = winRef.getSelection();
                    if (sel && sel.rangeCount > 0 && docRef) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        if (usarInsertHtml && typeof range.createContextualFragment === 'function') {
                            const frag = range.createContextualFragment(texto);
                            const ultimoNo = frag.lastChild;
                            range.insertNode(frag);
                            if (ultimoNo) {
                                range.setStartAfter(ultimoNo);
                                range.setEndAfter(ultimoNo);
                            }
                        } else {
                            const node = docRef.createTextNode(texto);
                            range.insertNode(node);
                            range.setStartAfter(node);
                            range.setEndAfter(node);
                        }
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    try {
                        alvoFoco.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        alvoFoco.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    } catch (_) { }
                }
                return true;
            } catch (_) {
                return false;
            } finally {
                if (typeof window !== 'undefined') window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = prevInternaWin;
                if (winRef && winRef !== window) {
                    try { winRef.__JUSGOV_COLAGEM_INTERNA_ATIVA__ = prevInternaSub; } catch (_) { }
                }
            }
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
                    : ((typeof window !== 'undefined' && window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto) || estado.ultimoTextoLimpo || '');
                const agoraConfirm = Date.now();
                if (!origemRemota && txt && txt === this.#ultimoTextoConfirmadoGlobal && (agoraConfirm - this.#ultimoTsConfirmadoGlobal) < 350) {
                    return null;
                }
                if (!origemRemota && txt) {
                    this.#ultimoTextoConfirmadoGlobal = txt;
                    this.#ultimoTsConfirmadoGlobal = agoraConfirm;
                }
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

        /**
         * Executa a colagem blindada no alvo editável a partir dos 2 slots internos (sem readText),
         * com suporte a `aplicarFiltroShift` (`Botão do Meio + Shift` = mesmo filtro da cópia com Shift + texto puro)
         * e `forcarSomenteTexto` (`Alt + Shift` = texto puro).
         * Possui trava reentrante e debounce anti-loop.
         */
        async executarColagem(alvo, modo = 'normal', usarAnterior = false, opcoesColagem = {}) {
            if (this.#colagemEmAndamento) return false;
            const agora = Date.now();
            if (opcoesColagem && opcoesColagem.ignorarDebounce !== true && (agora - this.#ultimoDisparoColagemTs) < INTERVALO_DEBOUNCE_COLAGEM_MS) {
                return false;
            }
            this.#colagemEmAndamento = true;
            this.#ultimoDisparoColagemTs = agora;

            try {
                if (!alvo) return false;
                const docRef = alvo.ownerDocument || (typeof document !== 'undefined' ? document : null);
                const hostCe = (alvo.tagName !== 'INPUT' && alvo.tagName !== 'TEXTAREA' && typeof alvo.closest === 'function')
                    ? alvo.closest('[contenteditable]:not([contenteditable="false"]), .ck-editor__editable, .ck-content, .cke_editable, .tox-edit-area')
                    : null;
                const alvoEfetivo = hostCe || alvo;
                const estado = this.#deps.obterEstadoOpcoes() || {};
                const aplicarFiltroShift = Boolean(opcoesColagem && opcoesColagem.aplicarFiltroShift);
                const forcarSomenteTexto = Boolean((opcoesColagem && opcoesColagem.forcarSomenteTexto) || aplicarFiltroShift);
                const modoEfetivo = (forcarSomenteTexto || modo === 'texto_puro') ? 'texto_puro' : 'normal';

                const ehEditorRico = Boolean(
                    alvoEfetivo.isContentEditable ||
                    Boolean(hostCe) ||
                    (alvoEfetivo.getAttribute && ['true', '', 'plaintext-only'].includes((alvoEfetivo.getAttribute('contenteditable') || '').toLowerCase())) ||
                    (docRef && docRef.designMode === 'on')
                );
                const ehCampoTextoPuro = (alvoEfetivo.tagName === 'INPUT' || alvoEfetivo.tagName === 'TEXTAREA' || !ehEditorRico);

                this.focarElementoSeguro(alvoEfetivo);

                let itemInterno = usarAnterior
                    ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                    : window.__JUSGOV_ULTIMO_CLIPBOARD__;

                if (!itemInterno && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    try {
                        const resClip = await chrome.storage.local.get(['ultimoClipboardInterno', 'ultimoClipboardAnteriorInterno', 'historicoClipboardInterno']);
                        if (resClip) {
                            if (resClip.ultimoClipboardInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD__) {
                                window.__JUSGOV_ULTIMO_CLIPBOARD__ = resClip.ultimoClipboardInterno;
                            }
                            if (resClip.ultimoClipboardAnteriorInterno && !window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) {
                                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = resClip.ultimoClipboardAnteriorInterno;
                            }
                            if (Array.isArray(resClip.historicoClipboardInterno) && !Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__)) {
                                window.__JUSGOV_HISTORICO_CLIPBOARD__ = resClip.historicoClipboardInterno.slice(0, 2);
                            }
                            itemInterno = usarAnterior
                                ? (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD__)
                                : window.__JUSGOV_ULTIMO_CLIPBOARD__;
                        }
                    } catch (_) { }
                }

                const payload = this.obterNivelEFormatosParaColagem(itemInterno, modoEfetivo, opcoesColagem);
                let textoEmulado = payload.texto || (!usarAnterior ? (estado.ultimoTextoLimpo || '') : '') || '';
                const htmlEmulado = payload.html || '';

                if (aplicarFiltroShift && textoEmulado) {
                    textoEmulado = this.aplicarFiltroShiftParaColagem(textoEmulado, estado.modoShiftCnj);
                }

                if (textoEmulado && textoEmulado.trim().length > 0) {
                    const tsColagem = Date.now();
                    const winAlvo = (docRef && docRef.defaultView) || (typeof window !== 'undefined' ? window : null);
                    if (typeof window !== 'undefined') {
                        window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ = tsColagem;
                    }
                    if (winAlvo && winAlvo !== window) {
                        try { winAlvo.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ = tsColagem; } catch (_) { }
                    }
                    const payloadFinal = { ...payload, texto: textoEmulado };
                    const ehCkEditor = this.#ehElementoCKEditorOuIframeRico(alvoEfetivo, docRef);

                    /* BUG-128 (Seção 6.258): NUNCA disparar ClipboardEvent('paste') sintético do Isolated World
                     * em editores ricos / CKEditor 4, pois o CKEditor aciona o fallback #cke_pastebin criando
                     * um segundo <body id="cke_pastebin" class="cke_editable"> aninhado dentro do <body contenteditable="true">,
                     * sequestrando a Selection do Blink sem preventDefault() e causando crash fatal / loop OOM
                     * com pjelayouta4 ao executar execCommand simultaneamente. */
                    if (ehCkEditor || ehCampoTextoPuro || payloadFinal.nivelIdx === 0 || !htmlEmulado) {
                        this.inserirTextoEmElemento(alvoEfetivo, textoEmulado, false, opcoesColagem);
                    } else if (ehEditorRico && payloadFinal.nivelIdx >= 1 && htmlEmulado) {
                        this.inserirTextoEmElemento(alvoEfetivo, htmlEmulado, true, opcoesColagem);
                    } else {
                        this.inserirTextoEmElemento(alvoEfetivo, textoEmulado, false, opcoesColagem);
                    }
                    this.confirmarColagemGlobalEMarcarPermanente(textoEmulado, false);
                    return true;
                }
                return false;
            } catch (_) {
                return false;
            } finally {
                this.#colagemEmAndamento = false;
            }
        }

        async executarColagemBotaoDireito(alvo, modo, usarAnterior = false, opcoesColagem = {}) {
            return this.executarColagem(alvo, modo, usarAnterior, opcoesColagem);
        }
    }

    Object.freeze(GerenciadorColagem.prototype);
    return Object.freeze(GerenciadorColagem);
}));
