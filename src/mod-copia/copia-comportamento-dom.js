/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-comportamento-dom.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: ClassificadorComportamentoDOM
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-comportamento-dom.js
 * - Classe Exportada: ClassificadorComportamentoDOM (window.JusGovComportamentoDOM)
 * - Métodos Públicos: mapearTipoParaContextoAlvo, classificarContextoElementoAlvo, deveManterSelecaoAtivaNoDom, normalizarModoRetirarSelecao, isCampoDeTextoValido, isElementoInterfaceDeEditorRico, isElementoOuAncestralContentEditable, isEditorMultilinhaValido, isElementoEmCampoEditavel, isSelecaoOuElementoEmCampoEditavel, isElementoControlePdf, isCelulaTabelaDadosLeitura, isAreaLeituraOuPdfConteudo, isElementoInterativoOuUi, isElementoInterativoClicavelDireto, isComponenteSelecaoOuDropdown, isComponenteBotaoOuFormularioEstrito, isContextoDeSistemaOuUi, isElementoClaramenteDeInterface, isTelaSistemaEstritaParaDesselecao, garantirSelecaoForcadaEmElemento, isContainerComposto, obterObjetoInterativoParaSelecaoCompleta, isElementoOcultoNoDom, extrairTextoVisivelLimpoDeElemento, isLinkMultilinha, extrairLinhaClicadaDeLink, criarRangeTextoParaEtiquetaOuObjeto, resolverRangeAltEmInterface, extrairTextoLinkUmaLinha, localizarBlocoForenseAutoSelecionavelEmInterface, isBlocoVerificavel, isTextoCampoEstruturadoForense, verificarProtecaoTamanhoMinimoInterface
 * - Dependências Injetadas: RegrasEInspetorDOM, ValidadoresForenses, FiltrosHtml, GeometriaDOM, EstagioExpressoes
 * - Regras / Seções: Mapeamento Manual de Elementos e Modos de Comportamento (4 tipos: textual/interface/editavel/semiflexivel), BUG-14..16, Seções 6.6/6.7/6.20/6.31/6.39, ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Classe POO dedicada exclusivamente à classificação contextual de elementos DOM nos
 * 4 modos de comportamento (Leitura, Interface, Editável, Semiflexível / Ignorar),
 * detecção multicamadas de campos editáveis, extração limpa de rótulos/links e
 * política de retenção ou desseleção da seleção no navegador.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovComportamentoDOM) {
        return;
    }

    const SELETOR_BOTAO_EXCLUSAO = '[class*="desvincular"], [class*="icon-desvincular"], [class*="close"], [class*="remove"], [class*="delete"], [class*="excluir"], [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], .fa-times, .fa-close, .fa-remove, mat-icon';

    class ClassificadorComportamentoDOM {
        #deps;

        constructor(dependencias = {}) {
            this.#deps = dependencias || {};
        }

        #obterEstado() {
            return (typeof this.#deps.obterEstado === 'function') ? (this.#deps.obterEstado() || {}) : {};
        }

        normalizarModoRetirarSelecao(val) {
            const v = String(val || '').trim().toLowerCase();
            if (v === 'com_flash' || v === 'total' || v === 'interface' || v === 'nenhuma') return v;
            return 'total_exceto_arrasto';
        }

        mapearTipoParaContextoAlvo(tipoRegra, alvoEl) {
            if (tipoRegra === 'ignorar') return 'IGNORAR';
            if (tipoRegra === 'interface') return 'LINK_CLICAVEL';
            if (tipoRegra === 'semiflexivel') return 'SEMIFLEXIVEL';
            if (tipoRegra === 'textual') return 'LEITURA_COMUM';
            if (tipoRegra === 'editavel') {
                const tag = (alvoEl && alvoEl.tagName) ? alvoEl.tagName.toUpperCase() : '';
                if (tag === 'INPUT') {
                    const tipoInput = (alvoEl.getAttribute('type') || alvoEl.type || 'text').toLowerCase();
                    const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                    if (!tiposNaoTexto.includes(tipoInput) && !alvoEl.readOnly && !alvoEl.disabled) {
                        return 'CAMPO_SIMPLES_EDITAVEL';
                    }
                }
                return 'EDITOR_MULTILINHA_EDITAVEL';
            }
            return null;
        }

        classificarContextoElementoAlvo(el) {
            if (!el) return 'IGNORAR';
            const atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (atual && typeof atual.closest === 'function' && atual.closest('[data-jusgov-ignore]')) {
                return 'IGNORAR';
            }

            const inspetor = this.#deps.regrasEInspetor;
            const regraUsuario = (atual && inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function')
                ? inspetor.obterClassificacaoRegraCustomizada(atual, true)
                : null;
            if (regraUsuario) {
                const ctxUsuario = this.mapearTipoParaContextoAlvo(regraUsuario, atual);
                if (ctxUsuario) return ctxUsuario;
            }

            if (atual) {
                const ehInputSeletorPaginaPdf = (atual.tagName === 'INPUT' && (
                    atual.id === 'pageSelector' ||
                    atual.getAttribute('aria-label') === 'Número da página' ||
                    (typeof atual.closest === 'function' && atual.closest('viewer-page-selector'))
                ));
                if (ehInputSeletorPaginaPdf) return 'CAMPO_SIMPLES_EDITAVEL';
            }

            if (atual && this.isElementoInterfaceDeEditorRico(atual)) {
                return 'LINK_CLICAVEL';
            }

            if (atual && this.isElementoEmCampoEditavel(atual)) {
                return this.mapearTipoParaContextoAlvo('editavel', atual);
            }

            const docOwner = (atual && atual.ownerDocument) ? atual.ownerDocument : document;
            if (docOwner && docOwner.body && (
                docOwner.body.isContentEditable ||
                docOwner.body.contentEditable === 'true' ||
                (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true') ||
                docOwner.designMode === 'on'
            )) {
                return 'EDITOR_MULTILINHA_EDITAVEL';
            }

            const tipoCascata = (inspetor && typeof inspetor.resolverTipoElementoPorPrioridade === 'function')
                ? inspetor.resolverTipoElementoPorPrioridade(el)
                : 'textual';
            return this.mapearTipoParaContextoAlvo(tipoCascata, atual) || 'LEITURA_COMUM';
        }

        isElementoControlePdf(el) {
            return el ? (this.classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL') : false;
        }

        isCelulaTabelaDadosLeitura(el) {
            if (!el) return false;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base || typeof base.closest !== 'function') return false;
            const celula = base.closest('td, th, [role="cell"], [role="gridcell"], .rich-table-cell');
            if (!celula) return false;
            return this.classificarContextoElementoAlvo(base) === 'LEITURA_COMUM';
        }

        isAreaLeituraOuPdfConteudo(el) {
            if (!el) return false;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return false;
            const ctx = this.classificarContextoElementoAlvo(base);
            if (typeof document !== 'undefined' && document.contentType === 'application/pdf') {
                return ctx !== 'LINK_CLICAVEL' && ctx !== 'IGNORAR';
            }
            return ctx === 'LEITURA_COMUM';
        }

        isElementoInterativoOuUi(el) {
            if (!el) return false;
            const ctx = this.classificarContextoElementoAlvo(el);
            return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
        }

        isElementoInterativoClicavelDireto(el) {
            return el ? (this.classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL') : false;
        }

        isComponenteSelecaoOuDropdown(el) {
            return el ? (this.classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL') : false;
        }

        isComponenteBotaoOuFormularioEstrito(el) {
            if (!el) return false;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base || base.nodeType !== Node.ELEMENT_NODE) return false;
            const ctx = this.classificarContextoElementoAlvo(base);
            if (ctx !== 'LINK_CLICAVEL' && ctx !== 'CAMPO_SIMPLES_EDITAVEL') return false;
            return Boolean(base.closest && base.closest(
                'button, input, select, textarea, label, option, optgroup, summary, [role="button"], [role="combobox"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"], [role="spinbutton"], .btn, [class*="btn-"], .button, [class*="-button"], .mat-button, .mat-icon-button, .mat-raised-button, .mat-flat-button, .mat-stroked-button, .p-button, .ui-button'
            ));
        }

        isContextoDeSistemaOuUi(el) {
            if (!el) return false;
            const ctx = this.classificarContextoElementoAlvo(el);
            return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
        }

        isElementoClaramenteDeInterface(el) {
            return el ? (this.classificarContextoElementoAlvo(el) === 'LINK_CLICAVEL') : false;
        }

        isTelaSistemaEstritaParaDesselecao(el) {
            if (!el) return false;
            const ctx = this.classificarContextoElementoAlvo(el);
            return ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL';
        }

        deveManterSelecaoAtivaNoDom(noOuElemento, eraArrasto = false) {
            const est = this.#obterEstado();
            const modoRet = est.modoRetirarSelecao;
            const tempoFlash = est.tempoFlashBorderMs;
            if (modoRet === 'nenhuma') return true;
            if (modoRet === 'com_flash') return (tempoFlash === 0);
            if (modoRet === 'total') return false;
            if (!noOuElemento) return true;

            const inspetor = this.#deps.regrasEInspetor;
            const regraUsuario = (inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function')
                ? inspetor.obterClassificacaoRegraCustomizada(noOuElemento, true)
                : null;
            if (regraUsuario) {
                const ctxUsuario = this.mapearTipoParaContextoAlvo(regraUsuario, noOuElemento);
                if (ctxUsuario) {
                    return (ctxUsuario !== 'LINK_CLICAVEL' && ctxUsuario !== 'SEMIFLEXIVEL' && ctxUsuario !== 'IGNORAR');
                }
            }
            const ctx = this.classificarContextoElementoAlvo(noOuElemento);
            if (ctx === 'LINK_CLICAVEL' || ctx === 'SEMIFLEXIVEL' || ctx === 'IGNORAR') {
                return false;
            }
            if (modoRet === 'total_exceto_arrasto') {
                return (eraArrasto === true);
            }
            return true;
        }

        isCampoDeTextoValido(target) {
            if (!target || target.nodeType !== Node.ELEMENT_NODE) return false;
            const tag = (target.tagName || '').toUpperCase();
            if (tag === 'INPUT') {
                const type = (target.getAttribute('type') || target.type || 'text').toLowerCase();
                const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                return !tiposNaoTexto.includes(type) && !target.readOnly && !target.disabled;
            }
            if (tag === 'TEXTAREA') {
                return !target.readOnly && !target.disabled;
            }
            return false;
        }

        isElementoInterfaceDeEditorRico(target) {
            if (!target) return false;
            const base = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
            if (!base || base.nodeType !== Node.ELEMENT_NODE) return false;
            const attrCe = (base.getAttribute && base.getAttribute('contenteditable') || '').toLowerCase();
            if (attrCe === 'true' || attrCe === 'plaintext-only') return false;
            const inspetor = this.#deps.regrasEInspetor;
            return (inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function')
                ? (inspetor.obterClassificacaoRegraCustomizada(base) === 'interface')
                : false;
        }

        isElementoOuAncestralContentEditable(target) {
            if (!target) return false;
            try {
                const el = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
                if (this.isElementoInterfaceDeEditorRico(el)) return false;

                const inspetor = this.#deps.regrasEInspetor;
                const regraUsuarioEditavel = (inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function')
                    ? inspetor.obterClassificacaoRegraCustomizada(el, true)
                    : null;
                if (regraUsuarioEditavel) {
                    return regraUsuarioEditavel === 'editavel';
                }

                const docOwner = el.ownerDocument || document;
                let atual = el;
                let profundidade = 0;

                while (atual && atual !== docOwner && profundidade < 35) {
                    profundidade++;
                    if (atual.nodeType === Node.ELEMENT_NODE) {
                        const attrCe = (atual.getAttribute('contenteditable') || '').toLowerCase();
                        if (attrCe === 'false') return false;
                        if (attrCe === 'true' || attrCe === 'plaintext-only' || atual.contentEditable === 'true' || atual.isContentEditable === true) {
                            return true;
                        }
                        const tagUpper = (atual.tagName || '').toUpperCase();
                        if (tagUpper === 'RICH-TEXTAREA') return true;
                        const role = (atual.getAttribute && atual.getAttribute('role')) || '';
                        if ((role === 'textbox' || role === 'searchbox') && atual.getAttribute('aria-readonly') !== 'true') {
                            return true;
                        }
                        const cls = (typeof atual.className === 'string') ? atual.className : '';
                        if (cls && /\b(cke_editable|ck-editor__editable|ck-content|mce-content-body|ql-editor|ProseMirror|editor-content-area|monaco-editor|CodeMirror)\b/i.test(cls)) {
                            if (
                                atual.isContentEditable || attrCe === 'true' || attrCe === '' ||
                                (docOwner.body && (docOwner.body.isContentEditable || (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true'))) ||
                                docOwner.designMode === 'on'
                            ) {
                                return true;
                            }
                        }
                    }
                    atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
                }

                if (docOwner && (
                    docOwner.designMode === 'on' ||
                    (docOwner.body && (
                        docOwner.body.isContentEditable === true ||
                        docOwner.body.contentEditable === 'true' ||
                        (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true')
                    ))
                )) {
                    return true;
                }
                return false;
            } catch (_) {
                return false;
            }
        }

        isEditorMultilinhaValido(target) {
            if (!target) return false;
            try {
                const el = (target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
                if (this.isElementoInterfaceDeEditorRico(el)) return false;
                const tagUpper = (el.tagName || '').toUpperCase();
                if (tagUpper === 'TEXTAREA' || tagUpper === 'RICH-TEXTAREA') {
                    return !el.readOnly && !el.disabled;
                }
                if (this.isElementoOuAncestralContentEditable(el)) return true;
                if (typeof el.closest === 'function') {
                    const edTextarea = el.closest('textarea, rich-textarea');
                    if (edTextarea) return !edTextarea.readOnly && !edTextarea.disabled;
                }
                return false;
            } catch (_) {
                return false;
            }
        }

        isElementoEmCampoEditavel(node) {
            if (!node) return false;
            try {
                let el = (node.nodeType === Node.TEXT_NODE) ? node.parentElement : node;
                if (!el) return false;
                if (el.nodeType !== Node.ELEMENT_NODE) {
                    if (el.parentElement) el = el.parentElement;
                    else return false;
                }

                const inspetor = this.#deps.regrasEInspetor;
                const regraUsuarioEditavel = (inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function')
                    ? inspetor.obterClassificacaoRegraCustomizada(el, true)
                    : null;
                if (regraUsuarioEditavel) {
                    return regraUsuarioEditavel === 'editavel';
                }

                const docOwner = el.ownerDocument || document;
                const tagDireta = (el.tagName || '').toUpperCase();
                if (tagDireta === 'TEXTAREA' || tagDireta === 'RICH-TEXTAREA') {
                    return (!el.readOnly && !el.disabled);
                }
                if (tagDireta === 'INPUT') {
                    const tipoInput = (el.getAttribute && el.getAttribute('type') || el.type || 'text').toLowerCase();
                    const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                    return (!tiposNaoTexto.includes(tipoInput) && !el.readOnly && !el.disabled);
                }

                const attrCeProprio = (el.getAttribute && el.getAttribute('contenteditable') || '').toLowerCase();
                const ehEditorDireto = el.isContentEditable || attrCeProprio === 'true' || attrCeProprio === 'plaintext-only' || (attrCeProprio === '' && el.hasAttribute && el.hasAttribute('contenteditable'));
                if (!ehEditorDireto && this.isElementoInterfaceDeEditorRico(el)) {
                    return false;
                }

                if (attrCeProprio !== 'false' && (!el.getAttribute || el.getAttribute('aria-readonly') !== 'true') && !el.readOnly && !el.disabled) {
                    if (inspetor && typeof inspetor.obterClassificacaoRegraCustomizada === 'function' && inspetor.obterClassificacaoRegraCustomizada(el) === 'editavel') {
                        return true;
                    }
                }

                const seletorEditavel = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]):not([type="range"]):not([type="color"]):not([type="hidden"]), textarea, rich-textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]:not([aria-readonly="true"]), [role="searchbox"]:not([aria-readonly="true"]), [data-slate-editor], [data-lexical-editor]';
                if (typeof el.closest === 'function') {
                    if ((typeof el.matches === 'function' && el.matches(seletorEditavel)) || el.closest(seletorEditavel)) {
                        return true;
                    }
                }

                if (el.isContentEditable || el.contentEditable === 'true' || el.contentEditable === 'plaintext-only') {
                    return true;
                }

                let atual = el;
                let profundidade = 0;
                while (atual && atual !== docOwner && profundidade < 35) {
                    profundidade++;
                    if (atual.nodeType === Node.ELEMENT_NODE) {
                        if (atual.isContentEditable || atual.contentEditable === 'true' || atual.contentEditable === 'plaintext-only') return true;
                        const attrCe = (atual.getAttribute && atual.getAttribute('contenteditable') || '').toLowerCase();
                        if (attrCe === 'true' || attrCe === 'plaintext-only' || (attrCe === '' && atual.hasAttribute && atual.hasAttribute('contenteditable'))) return true;
                        const role = atual.getAttribute && atual.getAttribute('role');
                        if ((role === 'textbox' || role === 'searchbox') && atual.getAttribute('aria-readonly') !== 'true') return true;
                        const tag = (atual.tagName || '').toUpperCase();
                        if (tag === 'TEXTAREA' || tag === 'RICH-TEXTAREA') return (!atual.readOnly && !atual.disabled);
                        if (tag === 'INPUT') {
                            const tipo = (atual.getAttribute('type') || atual.type || 'text').toLowerCase();
                            const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                            if (!tiposNaoTexto.includes(tipo) && !atual.readOnly && !atual.disabled) return true;
                        }
                        if (atual.classList && (
                            atual.classList.contains('ql-editor') || atual.classList.contains('ProseMirror') ||
                            atual.classList.contains('cke_editable') || atual.classList.contains('ck-editor__editable') ||
                            atual.classList.contains('ck-content') || atual.classList.contains('monaco-editor') ||
                            atual.classList.contains('CodeMirror') || atual.classList.contains('mce-content-body')
                        )) {
                            if (
                                atual.isContentEditable || attrCe === 'true' || attrCe === 'plaintext-only' ||
                                (atual.hasAttribute && atual.hasAttribute('contenteditable') && attrCe !== 'false') ||
                                (docOwner.body && (docOwner.body.isContentEditable || (docOwner.body.getAttribute && docOwner.body.getAttribute('contenteditable') === 'true'))) ||
                                docOwner.designMode === 'on'
                            ) {
                                return true;
                            }
                        }
                    }
                    atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
                }

                if (docOwner && docOwner.activeElement && docOwner.activeElement !== docOwner.body && docOwner.activeElement !== docOwner.documentElement) {
                    const ativo = docOwner.activeElement;
                    if (el === ativo || (el.contains && el.contains(ativo))) {
                        const tagAtivo = (ativo.tagName || '').toUpperCase();
                        if (tagAtivo === 'TEXTAREA' || tagAtivo === 'RICH-TEXTAREA') return true;
                        if (tagAtivo === 'INPUT') {
                            const tipo = (ativo.getAttribute('type') || ativo.type || 'text').toLowerCase();
                            const tiposNaoTexto = ['button', 'submit', 'reset', 'checkbox', 'radio', 'hidden', 'file', 'image', 'range', 'color'];
                            if (!tiposNaoTexto.includes(tipo)) return true;
                        }
                        if (ativo.isContentEditable || ativo.contentEditable === 'true') return true;
                        if (ativo.getAttribute && (ativo.getAttribute('role') === 'textbox' || ativo.getAttribute('role') === 'searchbox')) return true;
                        if (typeof ativo.closest === 'function' && ativo.closest('[contenteditable]:not([contenteditable="false"]), .ql-editor, .ProseMirror, rich-textarea')) return true;
                    }
                }

                return false;
            } catch (_) {
                return false;
            }
        }

        isSelecaoOuElementoEmCampoEditavel(alvo) {
            if (!alvo) {
                if (typeof document !== 'undefined' && document.activeElement) {
                    const ativo = document.activeElement;
                    if (ativo && ativo !== document.body && ativo !== document.documentElement) {
                        return this.isElementoEmCampoEditavel(ativo);
                    }
                }
                return false;
            }

            if (typeof alvo.rangeCount === 'number') {
                if (alvo.rangeCount === 0) return false;
                try {
                    return this.isSelecaoOuElementoEmCampoEditavel(alvo.getRangeAt(0));
                } catch (_) {
                    return false;
                }
            }

            if (typeof alvo.commonAncestorContainer !== 'undefined') {
                if (this.isElementoEmCampoEditavel(alvo.commonAncestorContainer)) return true;
                if (alvo.startContainer && this.isElementoEmCampoEditavel(alvo.startContainer)) return true;
                if (alvo.endContainer && this.isElementoEmCampoEditavel(alvo.endContainer)) return true;
                if (typeof document !== 'undefined' && document.activeElement) {
                    const ativo = document.activeElement;
                    if (ativo && ativo !== document.body && ativo !== document.documentElement && this.isElementoEmCampoEditavel(ativo)) {
                        try {
                            const anc = alvo.commonAncestorContainer;
                            if (anc === ativo || (ativo.contains && ativo.contains(anc)) || (anc && anc.contains && anc.contains(ativo))) {
                                return true;
                            }
                        } catch (_) { }
                    }
                }
                return false;
            }

            if (this.isElementoEmCampoEditavel(alvo)) return true;

            if (typeof document !== 'undefined' && document.activeElement) {
                const ativo = document.activeElement;
                if (ativo && ativo !== document.body && ativo !== document.documentElement && this.isElementoEmCampoEditavel(ativo)) {
                    try {
                        if (alvo === ativo || (ativo.contains && ativo.contains(alvo)) || (alvo.contains && alvo.contains(ativo))) {
                            return true;
                        }
                    } catch (_) { }
                }
            }
            return false;
        }

        garantirSelecaoForcadaEmElemento(alvo) {
            if (!alvo || alvo.nodeType !== Node.ELEMENT_NODE) return;
            try {
                const idEstiloForcado = 'jusgov-estilo-selecao-forcada';
                if (document.head && !document.getElementById(idEstiloForcado)) {
                    const st = document.createElement('style');
                    st.id = idEstiloForcado;
                    st.setAttribute('data-jusgov-ignore', 'true');
                    st.textContent = '[data-jusgov-selecionavel="true"], [data-jusgov-selecionavel="true"] * { -webkit-user-select: text !important; user-select: text !important; -webkit-user-drag: none !important; }';
                    document.head.appendChild(st);
                }
                const containerInterativo = (typeof alvo.closest === 'function')
                    ? (alvo.closest('button, input[type="button"], input[type="submit"], input[type="reset"], a, summary, label, th, td, nav, header, [role="tab"], [role="button"], [role="menuitem"], [role="option"], [role="switch"], [role="link"]') || alvo)
                    : alvo;
                containerInterativo.setAttribute('data-jusgov-selecionavel', 'true');
                const linkAncestral = (typeof alvo.closest === 'function') ? alvo.closest('a') : null;
                if (linkAncestral) linkAncestral.setAttribute('draggable', 'false');
            } catch (_) { }
        }

        isContainerComposto(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
            const tag = (el.tagName || '').toUpperCase();
            if (['BODY', 'HTML', 'MAIN', 'ARTICLE', 'SECTION', 'TABLE', 'TBODY', 'THEAD', 'TR', 'UL', 'OL', 'FORM', 'FIELDSET', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'P', 'PRE', 'BLOCKQUOTE'].includes(tag)) {
                return true;
            }
            const cls = (typeof el.className === 'string') ? el.className.toLowerCase() : '';
            if (cls && (
                cls.includes('card') || cls.includes('tarefa') || cls.includes('timeline') ||
                cls.includes('pje-task') || cls.includes('panel') || cls.includes('row') ||
                cls.includes('container') || cls.includes('list-group') || cls.includes('col-') ||
                cls.includes('dtpolo') || cls.includes('polo')
            )) {
                return true;
            }
            if (el.querySelector('table, tr, td, p, h1, h2, h3, h4, h5, h6, [class*="card"], [class*="tarefa"], [class*="timeline"], [class*="row"], [class*="col-"], [class*="dtPolo"], [class*="polo"]')) {
                return true;
            }
            const controles = Array.from(el.querySelectorAll('button, a, input, select, [role="button"], [class*="label-etiqueta"], [class*="badge"], [class*="chip"]'))
                .filter(c => !c.closest(SELETOR_BOTAO_EXCLUSAO));
            if (controles.length > 1) return true;
            const txt = (el.innerText || el.textContent || '').trim();
            return txt.length > 120;
        }

        obterObjetoInterativoParaSelecaoCompleta(alvo) {
            if (!alvo) return null;
            const elBase = alvo.nodeType === Node.ELEMENT_NODE ? alvo : alvo.parentElement;
            if (!elBase || typeof elBase.closest !== 'function') return null;

            const SELETOR_ETIQUETA_OU_BADGE = [
                '[class*="label-etiqueta"]', '[class*="label-info"]', '[class*="label-warning"]',
                '[class*="label-success"]', '[class*="label-danger"]', '[class*="label-primary"]',
                '[class*="label-default"]', '[class*="label-secondary"]', '[class*="badge"]',
                '[class*="chip"]', '[class*="tag"]', '[class*="pill"]', '[pmr-cor-padrao-etiqueta]',
                '[class*="etiqueta"]', '.label'
            ].join(', ');

            const containerEtiqueta = elBase.closest(SELETOR_ETIQUETA_OU_BADGE);
            if (containerEtiqueta) {
                if (elBase.closest(SELETOR_BOTAO_EXCLUSAO)) return null;
                if (elBase !== containerEtiqueta && (elBase.tagName === 'SPAN' || elBase.tagName === 'B' || elBase.tagName === 'STRONG' || elBase.tagName === 'EM')) {
                    return elBase;
                }
                const spans = Array.from(containerEtiqueta.querySelectorAll('span, b, strong, em'));
                const spanTexto = spans.find(sp => !sp.closest(SELETOR_BOTAO_EXCLUSAO) && (sp.innerText || sp.textContent || '').trim().length > 0);
                if (spanTexto) return spanTexto;
                if (!this.isContainerComposto(containerEtiqueta)) return containerEtiqueta;
            }

            const elSemantico = elBase.closest(
                'label, a[href], a, button, input[type="button"], input[type="submit"], input[type="reset"], summary, option, select, [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="option"], [role="switch"], [role="link"], [role="treeitem"], [role="combobox"], [aria-haspopup], [aria-expanded], [class*="menu-item"], [class*="menuitem"], [class*="dropdown-item"], [class*="ui-selectonemenu-item"], [class*="select2-results__option"], li'
            );
            if (elSemantico && !this.isContainerComposto(elSemantico)) {
                if (elSemantico.tagName === 'LI') {
                    const parenteLista = elSemantico.closest('[role="listbox"], [role="menu"], ul, ol');
                    const ehItemInterativo = parenteLista && (
                        this.isElementoInterativoOuUi(parenteLista) ||
                        (elSemantico.className && (elSemantico.className.includes('item') || elSemantico.className.includes('option')))
                    );
                    if (ehItemInterativo) return elSemantico;
                } else {
                    return elSemantico;
                }
            }

            let atual = elBase;
            let profundidade = 0;
            while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 2) {
                profundidade++;
                if (!this.isContainerComposto(atual)) {
                    const tagUpper = (atual.tagName || '').toUpperCase();
                    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE'].includes(tagUpper)) break;
                    const cls = (typeof atual.className === 'string') ? atual.className.toLowerCase() : '';
                    const temClasseBotao = cls && (
                        /\bbtn\b/.test(cls) || /\bbutton\b/.test(cls) || cls.includes('btn-') ||
                        cls.includes('ui-button') || cls.includes('mat-button') || cls.includes('toolbarbutton')
                    );
                    const temAcaoExplicita = atual.hasAttribute('onclick') || atual.hasAttribute('jsaction') ||
                        atual.hasAttribute('data-action') || atual.hasAttribute('ng-click');
                    if (temClasseBotao || temAcaoExplicita) {
                        try {
                            const st = window.getComputedStyle(atual);
                            if (st && st.cursor === 'pointer') {
                                const txt = (atual.innerText || atual.textContent || '').trim();
                                if (txt.length > 0 && txt.length <= 60 && !txt.includes('\n')) return atual;
                            }
                        } catch (_) { }
                    }
                }
                atual = atual.parentElement;
            }
            return null;
        }

        isElementoOcultoNoDom(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
            if (el.hidden || el.hasAttribute('hidden')) return true;
            if (el.getAttribute('aria-hidden') === 'true') return true;
            if (el.hasAttribute('data-jusgov-ignore')) return true;

            const cls = (typeof el.className === 'string') ? el.className.toLowerCase() : '';
            if (cls && (
                /\bsr-only\b/.test(cls) || /\bvisually-hidden\b/.test(cls) || /\bscreen-reader-text\b/.test(cls) ||
                /\bd-none\b/.test(cls) || /\bhidden\b/.test(cls) || /\blabel-copy\b/.test(cls) ||
                /\bicone-copy\b/.test(cls) || /\bui-helper-hidden\b/.test(cls)
            )) {
                return true;
            }

            const stInline = (el.getAttribute('style') || '').toLowerCase().replace(/\s+/g, '');
            if (
                stInline.includes('display:none') || stInline.includes('visibility:hidden') ||
                stInline.includes('visibility:collapse') || stInline.includes('opacity:0;') ||
                stInline.endsWith('opacity:0') || stInline.includes('font-size:0px') || stInline.includes('font-size:0;')
            ) {
                return true;
            }

            if (el.isConnected && typeof window.getComputedStyle === 'function') {
                try {
                    const comp = window.getComputedStyle(el);
                    if (comp) {
                        if (comp.display === 'none' || comp.visibility === 'hidden' || comp.visibility === 'collapse') return true;
                        if (comp.opacity === '0' || comp.fontSize === '0px') return true;
                    }
                } catch (_) { }
            }
            return false;
        }

        extrairTextoVisivelLimpoDeElemento(el) {
            if (!el) return '';
            const unificar = this.#deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const higienizar = this.#deps.higienizarTextoParaCopia || ((s) => String(s || '').trim());
            const tagEl = (el.tagName || '').toUpperCase();
            if (tagEl === 'SELECT') {
                const optSel = (typeof el.selectedIndex === 'number' && el.selectedIndex >= 0 && el.options)
                    ? el.options[el.selectedIndex]
                    : (el.selectedOptions && el.selectedOptions[0]);
                const txtSel = (optSel && (optSel.text || optSel.textContent)) || el.value || '';
                const limpoSel = unificar(txtSel);
                return higienizar(limpoSel) || limpoSel;
            }
            if (tagEl === 'OPTION') {
                const txtOpt = el.text || el.innerText || el.textContent || el.value || '';
                const limpoOpt = unificar(txtOpt);
                return higienizar(limpoOpt) || limpoOpt;
            }
            try {
                const partes = [];
                const TAGS_BLOCOS_ESPACAMENTO = new Set([
                    'DIV', 'P', 'LI', 'TR', 'TD', 'TH', 'SECTION', 'ARTICLE',
                    'HEADER', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DT', 'DD'
                ]);
                const percorrer = (no) => {
                    if (!no) return;
                    if (no.nodeType === Node.ELEMENT_NODE) {
                        const tag = (no.tagName || '').toUpperCase();
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG' || tag === 'CANVAS' || tag === 'TEMPLATE' || this.isElementoOcultoNoDom(no)) return;
                        if (typeof no.matches === 'function' && no.matches('[class*="desvincular"], [class*="icon-desvincular"], .fa-times, .fa-close, [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], [class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy')) return;
                        if (tag === 'BR') { partes.push(' '); return; }
                        const ehBlocoOuColuna = TAGS_BLOCOS_ESPACAMENTO.has(tag) || (
                            typeof no.className === 'string' && (
                                no.className.includes('col-') || no.className.includes('dtPolo') ||
                                no.className.includes('polo') || no.className.includes('tarefa') || no.className.includes('card')
                            )
                        );
                        if (ehBlocoOuColuna && partes.length > 0 && !/\s$/.test(partes[partes.length - 1])) partes.push(' ');
                        for (let i = 0; i < no.childNodes.length; i++) percorrer(no.childNodes[i]);
                        if (ehBlocoOuColuna && partes.length > 0 && !/\s$/.test(partes[partes.length - 1])) partes.push(' ');
                    } else if (no.nodeType === Node.TEXT_NODE) {
                        if (no.nodeValue) partes.push(no.nodeValue);
                    }
                };
                percorrer(el);
                const bruto = unificar(partes.join(''));
                if (bruto) return higienizar(bruto) || bruto;
                const fallbackInner = (typeof el.innerText === 'string') ? unificar(el.innerText) : '';
                return fallbackInner ? (higienizar(fallbackInner) || fallbackInner) : '';
            } catch (_) {
                return unificar(el.innerText || '');
            }
        }

        isLinkMultilinha(elLink) {
            if (!elLink) return false;
            try {
                if (elLink.querySelector('br, hr, p, div, li, tr, blockquote')) return true;
                const txt = (elLink.innerText || elLink.textContent || '');
                if (txt.includes('\n') || txt.includes('\r')) return true;
                const rects = Array.from(elLink.getClientRects());
                if (rects.length > 1) {
                    const primeiroTop = rects[0].top;
                    for (let i = 1; i < rects.length; i++) {
                        if (Math.abs(rects[i].top - primeiroTop) >= 5) return true;
                    }
                }
            } catch (_) { }
            return false;
        }

        extrairLinhaClicadaDeLink(elLink, clientX, clientY, noReferencia = null) {
            if (!elLink) return null;
            const unificar = this.#deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const obterPonto = this.#deps.obterPontoDoClique;
            try {
                const ponto = (typeof clientX === 'number' && typeof clientY === 'number' && obterPonto) ? obterPonto(clientX, clientY) : null;
                let noAlvo = (ponto && ponto.no) ? ponto.no : null;
                if (!noAlvo || !elLink.contains(noAlvo)) {
                    noAlvo = (noReferencia && elLink.contains(noReferencia)) ? noReferencia : elLink.firstChild;
                }
                if (!noAlvo) return null;

                let sub = (noAlvo.nodeType === Node.ELEMENT_NODE) ? noAlvo : noAlvo.parentElement;
                while (sub && sub.parentElement && sub.parentElement !== elLink && sub !== elLink) sub = sub.parentElement;
                if (sub && sub !== elLink && elLink.children.length > 1) {
                    const brsSub = Array.from(sub.querySelectorAll('br'));
                    const rectSubBase = sub.getBoundingClientRect ? sub.getBoundingClientRect() : null;
                    const temIrmaoNaMesmaLinha = rectSubBase && rectSubBase.height > 0 && Array.from(elLink.children).some((irmao) => {
                        if (irmao === sub || !irmao.getBoundingClientRect) return false;
                        const rIrmao = irmao.getBoundingClientRect();
                        return rIrmao.height > 0 && rIrmao.width > 0 && Math.abs(rIrmao.top - rectSubBase.top) < 5;
                    });
                    if (brsSub.length === 0 && !temIrmaoNaMesmaLinha) {
                        const rectsSub = Array.from(sub.getClientRects());
                        const temQuebraVisualInterna = rectsSub.length > 1 && rectsSub.some(r => Math.abs(r.top - rectsSub[0].top) >= 5);
                        if (!temQuebraVisualInterna) {
                            const rSub = document.createRange();
                            const hiddenSub = sub.querySelector('[class*="hidden"], .hidden');
                            const iconeSub = sub.querySelector('[class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy, [title*="Copiar"]');
                            if (hiddenSub && sub.contains(hiddenSub)) rSub.setStartAfter(hiddenSub);
                            else rSub.setStart(sub, 0);
                            if (iconeSub && sub.contains(iconeSub)) rSub.setEndBefore(iconeSub);
                            else rSub.setEnd(sub, sub.childNodes.length);
                            const txtSub = this.extrairTextoVisivelLimpoDeElemento(sub) || unificar(rSub.toString());
                            if (txtSub && txtSub.length > 0) return { range: rSub, texto: txtSub };
                        }
                    }
                }

                const brs = Array.from(elLink.querySelectorAll('br'));
                if (brs.length > 0) {
                    const segmentos = [];
                    let rangeAtual = document.createRange();
                    rangeAtual.setStart(elLink, 0);
                    for (let i = 0; i < elLink.childNodes.length; i++) {
                        const filho = elLink.childNodes[i];
                        if (filho.tagName === 'BR') {
                            rangeAtual.setEndBefore(filho);
                            const txtSeg = unificar(rangeAtual.toString());
                            if (txtSeg.length > 0) segmentos.push({ range: rangeAtual, texto: txtSeg });
                            rangeAtual = document.createRange();
                            if (i + 1 < elLink.childNodes.length) rangeAtual.setStartAfter(filho);
                        }
                    }
                    if (rangeAtual.startContainer) {
                        try {
                            rangeAtual.setEnd(elLink, elLink.childNodes.length);
                            const txtFinal = unificar(rangeAtual.toString());
                            if (txtFinal.length > 0) segmentos.push({ range: rangeAtual, texto: txtFinal });
                        } catch (_) { }
                    }
                    if (segmentos.length > 0) {
                        for (const seg of segmentos) {
                            try {
                                if (noAlvo && seg.range.isPointInRange(noAlvo, (ponto && ponto.offset) || 0)) return seg;
                            } catch (_) { }
                        }
                        let melhorSeg = segmentos[0];
                        let menorDist = Infinity;
                        for (const seg of segmentos) {
                            const rect = seg.range.getBoundingClientRect();
                            if (rect && rect.height > 0) {
                                const dist = Math.abs(clientY - (rect.top + rect.height / 2));
                                if (dist < menorDist) { menorDist = dist; melhorSeg = seg; }
                            }
                        }
                        return melhorSeg;
                    }
                }

                if (noAlvo && noAlvo.nodeType === Node.TEXT_NODE) {
                    const val = noAlvo.nodeValue || '';
                    const off = Math.max(0, Math.min((ponto && ponto.offset) || 0, Math.max(0, val.length - 1)));
                    const rChar = document.createRange();
                    rChar.setStart(noAlvo, off);
                    rChar.setEnd(noAlvo, Math.min(off + 1, val.length));
                    const rc = rChar.getBoundingClientRect();
                    const refTop = (rc && rc.height > 0) ? rc.top : clientY;

                    let inicioOff = off;
                    let fimOff = off;
                    while (inicioOff > 0) {
                        const ch = val[inicioOff - 1];
                        if (ch === '\n' || ch === '\r') break;
                        const rT = document.createRange();
                        rT.setStart(noAlvo, inicioOff - 1);
                        rT.setEnd(noAlvo, inicioOff);
                        const rectT = rT.getBoundingClientRect();
                        if (rectT && rectT.height > 0 && Math.abs(rectT.top - refTop) > 5) break;
                        inicioOff--;
                    }
                    while (fimOff < val.length) {
                        const ch = val[fimOff];
                        if (ch === '\n' || ch === '\r') break;
                        const rT = document.createRange();
                        rT.setStart(noAlvo, fimOff);
                        rT.setEnd(noAlvo, fimOff + 1);
                        const rectT = rT.getBoundingClientRect();
                        if (rectT && rectT.height > 0 && Math.abs(rectT.top - refTop) > 5) break;
                        fimOff++;
                    }
                    while (inicioOff < fimOff && /[\s\u00A0]/.test(val[inicioOff])) inicioOff++;
                    while (fimOff > inicioOff && /[\s\u00A0]/.test(val[fimOff - 1])) fimOff--;
                    if (fimOff > inicioOff) {
                        const rVisual = document.createRange();
                        rVisual.setStart(noAlvo, inicioOff);
                        rVisual.setEnd(noAlvo, fimOff);
                        const tVisual = unificar(val.substring(inicioOff, fimOff));
                        if (tVisual) return { range: rVisual, texto: tVisual };
                    }
                }

                const rAll = document.createRange();
                rAll.selectNodeContents(elLink);
                return { range: rAll, texto: this.extrairTextoVisivelLimpoDeElemento(elLink) };
            } catch (_) {
                return null;
            }
        }

        criarRangeTextoParaEtiquetaOuObjeto(elInterativo) {
            if (!elInterativo) return null;
            const range = document.createRange();
            try {
                const temBotaoRemover = (typeof elInterativo.querySelector === 'function') && elInterativo.querySelector(SELETOR_BOTAO_EXCLUSAO);
                if (temBotaoRemover) {
                    const spans = Array.from(elInterativo.querySelectorAll('span, b, strong, em'));
                    const spanRotulo = spans.find(sp => !sp.closest(SELETOR_BOTAO_EXCLUSAO) && (sp.innerText || sp.textContent || '').trim().length > 0);
                    if (spanRotulo) { range.selectNodeContents(spanRotulo); return range; }
                    for (let i = 0; i < elInterativo.childNodes.length; i++) {
                        const f = elInterativo.childNodes[i];
                        if (f.nodeType === Node.TEXT_NODE && f.nodeValue && f.nodeValue.trim().length > 0) {
                            range.setStart(f, 0);
                            range.setEnd(f, f.nodeValue.length);
                            return range;
                        }
                    }
                }
            } catch (_) { }
            range.selectNodeContents(elInterativo);
            return range;
        }

        extrairTextoLinkUmaLinha(elLink) {
            if (!elLink) return '';
            const unificar = this.#deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const higienizar = this.#deps.higienizarTextoParaCopia || ((s) => String(s || '').trim());
            try {
                const partes = [];
                const TAGS_SEPARACAO_LINHA = new Set(['DIV', 'P', 'LI', 'TR', 'TD', 'TH', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);
                const percorrer = (no) => {
                    if (!no) return;
                    if (no.nodeType === Node.ELEMENT_NODE) {
                        const tag = (no.tagName || '').toUpperCase();
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG' || tag === 'CANVAS' || tag === 'TEMPLATE' || this.isElementoOcultoNoDom(no)) return;
                        if (typeof no.matches === 'function' && no.matches('[class*="desvincular"], [class*="icon-desvincular"], .fa-times, .fa-close, [title*="Excluir"], [title*="Remover"], [title*="Desvincular"], [class*="icone-copy"], [class*="label-copy"], .icone-copy, .label-copy')) return;
                        if (tag === 'BR') { partes.push(' '); return; }
                        const ehBlocoSeparador = TAGS_SEPARACAO_LINHA.has(tag);
                        if (ehBlocoSeparador && partes.length > 0) partes.push(' ');
                        for (let i = 0; i < no.childNodes.length; i++) percorrer(no.childNodes[i]);
                        if (ehBlocoSeparador) partes.push(' ');
                    } else if (no.nodeType === Node.TEXT_NODE && no.nodeValue) {
                        partes.push(no.nodeValue);
                    }
                };
                percorrer(elLink);
                const brutoUmaLinha = unificar(partes.join(''));
                if (brutoUmaLinha) return unificar(higienizar(brutoUmaLinha) || brutoUmaLinha);
                const fallbackInner = (typeof elLink.innerText === 'string' ? elLink.innerText : (elLink.textContent || '')).replace(/[\r\n\t\f\v \u00A0]+/gu, ' ').trim();
                if (!fallbackInner) return '';
                return unificar(higienizar(fallbackInner) || fallbackInner);
            } catch (_) {
                return unificar((elLink && (elLink.innerText || elLink.textContent)) || '');
            }
        }

        resolverRangeAltEmInterface(alvo, ponto, clientX, clientY, numCliques = 1, mapa = null) {
            if (!alvo) return null;
            const elBase = (alvo.nodeType === Node.TEXT_NODE) ? alvo.parentElement : alvo;
            let elInterface = this.obterObjetoInterativoParaSelecaoCompleta(alvo);
            if (!elInterface && elBase && elBase !== document.body && elBase !== document.documentElement && !this.isContainerComposto(elBase)) {
                elInterface = elBase;
            }
            if (!elInterface || elInterface === document.body || elInterface === document.documentElement) return null;

            const extrairPuro = this.#deps.extrairTextoPuroSanitizado || ((r) => (r ? r.toString() : ''));
            const criarRange = this.#deps.criarRangeDOMAPartirDeIndices;

            let clicouEmBlocoVerificavel = false;
            let rangeBlocoVerificavel = null;
            let txtBlocoVerificavel = '';
            if (mapa && typeof mapa.texto === 'string' && typeof mapa.idxCursor === 'number' && criarRange) {
                const resBloco = this.localizarBlocoForenseAutoSelecionavelEmInterface(mapa.texto, mapa.idxCursor, 1, false);
                if (resBloco) {
                    const trecho = mapa.texto.slice(resBloco.inicio, resBloco.fim).trim();
                    if (trecho && this.isBlocoVerificavel(trecho)) {
                        const rBloco = criarRange(mapa, resBloco.inicio, resBloco.fim);
                        if (rBloco) {
                            clicouEmBlocoVerificavel = true;
                            rangeBlocoVerificavel = rBloco;
                            txtBlocoVerificavel = (extrairPuro(rBloco) || trecho).trim();
                        }
                    }
                }
            }

            if (clicouEmBlocoVerificavel && numCliques === 1 && rangeBlocoVerificavel && txtBlocoVerificavel) {
                return { range: rangeBlocoVerificavel, texto: txtBlocoVerificavel, ehBlocoVerificavel: true };
            }

            const ehSelectOuOpt = (elInterface.tagName === 'SELECT' || elInterface.tagName === 'OPTION');
            if (ehSelectOuOpt) {
                const textoOpcao = this.extrairTextoVisivelLimpoDeElemento(elInterface);
                const rSelect = document.createRange();
                try { rSelect.selectNode(elInterface); } catch (_) { }
                if (textoOpcao) {
                    return { range: rSelect, texto: textoOpcao, ehBlocoVerificavel: false, forcarUmaLinha: true };
                }
            }

            const ehLinkAlvo = Boolean(
                (elInterface.tagName === 'A' || (typeof elInterface.getAttribute === 'function' && elInterface.getAttribute('role') === 'link')) ||
                (typeof elInterface.closest === 'function' && elInterface.closest('a, [role="link"]'))
            );
            const rangeCompleto = this.criarRangeTextoParaEtiquetaOuObjeto(elInterface);
            const textoCompleto = ehLinkAlvo
                ? (this.extrairTextoLinkUmaLinha(elInterface) || this.extrairTextoVisivelLimpoDeElemento(elInterface))
                : (rangeCompleto ? (extrairPuro(rangeCompleto) || rangeCompleto.toString() || '').trim() : this.extrairTextoVisivelLimpoDeElemento(elInterface));

            const deveSelecionarApenasLinha = (clicouEmBlocoVerificavel && numCliques === 2) || (!clicouEmBlocoVerificavel && numCliques === 1);
            if (deveSelecionarApenasLinha && this.isLinkMultilinha(elInterface)) {
                const resLinha = this.extrairLinhaClicadaDeLink(elInterface, clientX, clientY, ponto ? ponto.no : null);
                if (resLinha && resLinha.range) {
                    const txtLinha = (extrairPuro(resLinha.range) || resLinha.texto || resLinha.range.toString() || '').trim();
                    if (txtLinha) return { range: resLinha.range, texto: txtLinha, ehBlocoVerificavel: false };
                }
            }

            if (rangeCompleto && textoCompleto) {
                return { range: rangeCompleto, texto: textoCompleto, ehBlocoVerificavel: false, forcarUmaLinha: ehLinkAlvo };
            }
            return null;
        }

        isBlocoVerificavel(texto) {
            const validadores = this.#deps.validadores;
            if (validadores && typeof validadores.isBlocoVerificavel === 'function') {
                return validadores.isBlocoVerificavel(texto);
            }
            return this.isTextoCampoEstruturadoForense(texto);
        }

        isTextoCampoEstruturadoForense(texto) {
            const validadores = this.#deps.validadores;
            return validadores ? validadores.isTextoCampoEstruturadoForense(texto) : false;
        }

        verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minimoCustomizado = null) {
            const est = this.#obterEstado();
            const validadores = this.#deps.validadores;
            const minEfetivo = (typeof minimoCustomizado === 'number') ? minimoCustomizado : est.minimoCaracteresInterface;
            return validadores ? validadores.verificarProtecaoTamanhoMinimoInterface(texto, elAlvo, temModificadorTeclado, minEfetivo) : true;
        }

        localizarBlocoForenseAutoSelecionavelEmInterface(texto, idxCursor, numCliques = 1, combinarDataHoraNoCliqueUnico = false) {
            const validadores = this.#deps.validadores;
            if (validadores && typeof validadores.localizarBlocoForenseAutoSelecionavelEmInterface === 'function') {
                return validadores.localizarBlocoForenseAutoSelecionavelEmInterface(texto, idxCursor, numCliques, combinarDataHoraNoCliqueUnico, this.#deps.estagio2);
            }
            return null;
        }
    }

    Object.freeze(ClassificadorComportamentoDOM.prototype);
    window.JusGovComportamentoDOM = Object.freeze(ClassificadorComportamentoDOM);
})();
