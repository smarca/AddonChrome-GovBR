/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-protecao-main.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COPIA — Escudo MAIN World Contra Bloqueios de Seleção e Cópia
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-protecao-main.js
 * - API Exportada: window.JusGovProtecaoCopiaMain (instalarProtecao, removerProtecao, ehContextoEditavelOuExtensao, estaAtivaNaPagina)
 * - Execução: Mundo MAIN em document_start (allFrames: true) via lib-injecao.js
 * - Regras / Seções: FEAT-56 (Supremacia anti-cópia e anti-desseleção forçada)
 * ========================================================================== */

(function (raiz) {
    'use strict';

    const CHAVE_INSTALADA = '__JUSGOV_PROTECAO_MAIN_INSTALADA__';
    const SELETOR_EDITAVEL_OU_EXT = 'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"], .cke_editable, .ck-editor__editable, .ProseMirror, .CodeMirror, .monaco-editor, .tox-edit-area, [data-jusgov-ignore="true"]';

    function noEstaEmContextoEditavelOuExtensao(no, doc) {
        if (!no) return false;
        let el = (no.nodeType === 1) ? no : no.parentElement;
        if (!el && no.nodeType === 9 && doc) el = doc.activeElement;
        if (!el || el.nodeType !== 1) return false;
        const tag = el.tagName ? el.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (el.isContentEditable) return true;
        if (typeof el.closest === 'function' && el.closest(SELETOR_EDITAVEL_OU_EXT)) return true;
        return false;
    }

    function ehContextoEditavelOuExtensao(docParam, selParam) {
        try {
            const doc = docParam || (typeof document !== 'undefined' ? document : null);
            if (!doc) return false;
            if (doc.designMode === 'on' || (doc.body && (doc.body.isContentEditable || (doc.body.classList && doc.body.classList.contains('cke_editable'))))) {
                return true;
            }
            if (noEstaEmContextoEditavelOuExtensao(doc.activeElement, doc)) return true;
            if (selParam) {
                if (noEstaEmContextoEditavelOuExtensao(selParam.anchorNode, doc)) return true;
                if (noEstaEmContextoEditavelOuExtensao(selParam.focusNode, doc)) return true;
            }
        } catch (_) { }
        return false;
    }

    function ehAppWebConfiavel(docParam) {
        try {
            const loc = (docParam && docParam.defaultView && docParam.defaultView.location)
                || (typeof window !== 'undefined' ? window.location : null);
            const host = String((loc && loc.hostname) || '').toLowerCase();
            if (!host) return false;
            return /(?:^|\.)(?:gemini\.google\.com|bard\.google\.com|docs\.google\.com|chatgpt\.com|chat\.openai\.com|claude\.ai|copilot\.microsoft\.com|notion\.so|web\.whatsapp\.com|github\.com)$/i.test(host);
        } catch (_) {
            return false;
        }
    }

    function estaAtivaNaPagina(docParam) {
        try {
            const doc = docParam || (typeof document !== 'undefined' ? document : null);
            if (!doc || !doc.documentElement) return true;
            const flag = doc.documentElement.getAttribute('data-jusgov-ativo');
            if (flag === '0') return false;
            if (doc.documentElement.hasAttribute('data-jusgov-permitir-desselecao')) return false;
            return true;
        } catch (_) {
            return true;
        }
    }

    function temSelecaoLeituraAtiva(docParam, selParam) {
        try {
            if (!selParam || selParam.isCollapsed) return false;
            if (ehContextoEditavelOuExtensao(docParam, selParam)) return false;
            return String(selParam.toString() || '').trim().length > 0;
        } catch (_) {
            return false;
        }
    }

    function instalarProtecao(winParam) {
        const win = winParam || raiz || (typeof window !== 'undefined' ? window : null);
        if (!win) return false;
        if (win[CHAVE_INSTALADA]) return true;

        const doc = win.document || (typeof document !== 'undefined' ? document : null);
        const SelProto = win.Selection && win.Selection.prototype;
        const DocProto = win.Document && win.Document.prototype;

        const ClipProto = (win.Clipboard && win.Clipboard.prototype) || (win.navigator && win.navigator.clipboard ? Object.getPrototypeOf(win.navigator.clipboard) : null);
        const instClipboard = (win.navigator && win.navigator.clipboard) ? win.navigator.clipboard : null;

        const originais = {
            removeAllRanges: SelProto ? SelProto.removeAllRanges : null,
            empty: SelProto ? SelProto.empty : null,
            collapse: SelProto ? SelProto.collapse : null,
            collapseToStart: SelProto ? SelProto.collapseToStart : null,
            collapseToEnd: SelProto ? SelProto.collapseToEnd : null,
            setBaseAndExtent: SelProto ? SelProto.setBaseAndExtent : null,
            execCommand: DocProto ? DocProto.execCommand : null,
            writeTextProto: ClipProto ? ClipProto.writeText : null,
            writeProto: ClipProto ? ClipProto.write : null,
            writeTextInst: (instClipboard && Object.prototype.hasOwnProperty.call(instClipboard, 'writeText')) ? instClipboard.writeText : null,
            writeInst: (instClipboard && Object.prototype.hasOwnProperty.call(instClipboard, 'write')) ? instClipboard.write : null
        };

        const notificarCopiaNativaPagina = (texto, html = '', origem = 'pagina') => {
            try {
                if (!estaAtivaNaPagina(doc)) return;
                if (win.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__) return;
                const txt = String(texto || '').trim();
                const htm = String(html || '').trim();
                if (!txt && !htm) return;
                if (typeof win.CustomEvent === 'function' && typeof win.dispatchEvent === 'function') {
                    win.dispatchEvent(new win.CustomEvent('jusgov:copia-nativa-interceptada', {
                        detail: { texto: txt, html: htm, origem }
                    }));
                }
            } catch (_) { }
        };

        const obterDocVivo = () => (win && win.document) ? win.document : doc;

        const bloquearSeLeitura = function (selObj) {
            const dVivo = obterDocVivo();
            if (win.__JUSGOV_COLAGEM_INTERNA_ATIVA__) return false;
            return !ehAppWebConfiavel(dVivo) && estaAtivaNaPagina(dVivo) && temSelecaoLeituraAtiva(dVivo, selObj);
        };

        if (SelProto) {
            if (typeof originais.removeAllRanges === 'function') {
                SelProto.removeAllRanges = function () {
                    if (bloquearSeLeitura(this)) return;
                    return originais.removeAllRanges.apply(this, arguments);
                };
            }
            if (typeof originais.empty === 'function') {
                SelProto.empty = function () {
                    if (bloquearSeLeitura(this)) return;
                    return originais.empty.apply(this, arguments);
                };
            }
            if (typeof originais.collapse === 'function') {
                SelProto.collapse = function () {
                    if (bloquearSeLeitura(this)) return;
                    return originais.collapse.apply(this, arguments);
                };
            }
            if (typeof originais.collapseToStart === 'function') {
                SelProto.collapseToStart = function () {
                    if (bloquearSeLeitura(this)) return;
                    return originais.collapseToStart.apply(this, arguments);
                };
            }
            if (typeof originais.collapseToEnd === 'function') {
                SelProto.collapseToEnd = function () {
                    if (bloquearSeLeitura(this)) return;
                    return originais.collapseToEnd.apply(this, arguments);
                };
            }
            if (typeof originais.setBaseAndExtent === 'function') {
                SelProto.setBaseAndExtent = function (anchorNode, anchorOffset, focusNode, focusOffset) {
                    const colapsando = (anchorNode === focusNode && anchorOffset === focusOffset);
                    if (colapsando && bloquearSeLeitura(this)) return;
                    return originais.setBaseAndExtent.apply(this, arguments);
                };
            }
        }

        if (DocProto && typeof originais.execCommand === 'function') {
            DocProto.execCommand = function (commandId) {
                const cmd = String(commandId || '').toLowerCase();
                try {
                    if (cmd === 'unselect' && estaAtivaNaPagina(this)) {
                        const selAtual = (win && typeof win.getSelection === 'function') ? win.getSelection() : null;
                        if (temSelecaoLeituraAtiva(this, selAtual)) {
                            return false;
                        }
                    }
                } catch (_) { }
                let textoCapturadoAntes = '';
                if (cmd === 'copy' && estaAtivaNaPagina(this) && !win.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__) {
                    try {
                        const elAtv = this.activeElement;
                        if (elAtv && (elAtv.tagName === 'INPUT' || elAtv.tagName === 'TEXTAREA') && typeof elAtv.value === 'string') {
                            const sIni = typeof elAtv.selectionStart === 'number' ? elAtv.selectionStart : 0;
                            const sFim = typeof elAtv.selectionEnd === 'number' ? elAtv.selectionEnd : elAtv.value.length;
                            textoCapturadoAntes = (sFim > sIni) ? elAtv.value.substring(sIni, sFim) : elAtv.value;
                        }
                        if (!textoCapturadoAntes && win && typeof win.getSelection === 'function') {
                            const sel = win.getSelection();
                            if (sel) textoCapturadoAntes = sel.toString();
                        }
                    } catch (_) { }
                }
                let resCmd = false;
                if (cmd === 'copy') {
                    const prevExecApp = Boolean(win.__JUSGOV_EXEC_COPY_APP_ATIVO__);
                    win.__JUSGOV_EXEC_COPY_APP_ATIVO__ = true;
                    try {
                        resCmd = originais.execCommand.apply(this, arguments);
                    } finally {
                        win.__JUSGOV_EXEC_COPY_APP_ATIVO__ = prevExecApp;
                    }
                } else {
                    resCmd = originais.execCommand.apply(this, arguments);
                }
                if (cmd === 'copy' && textoCapturadoAntes && String(textoCapturadoAntes).trim()) {
                    notificarCopiaNativaPagina(textoCapturadoAntes, '', 'execCommand');
                }
                return resCmd;
            };
        }

        const empacotarWriteText = (fnOriginal) => function (texto) {
            if (estaAtivaNaPagina(doc) && !win.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__) {
                notificarCopiaNativaPagina(texto, '', 'writeText');
            }
            return fnOriginal.apply(this, arguments);
        };

        const empacotarWrite = (fnOriginal) => function (itens) {
            if (estaAtivaNaPagina(doc) && !win.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__ && Array.isArray(itens)) {
                (async () => {
                    try {
                        for (let i = 0; i < itens.length; i++) {
                            const it = itens[i];
                            if (!it || typeof it.getType !== 'function' || !Array.isArray(it.types)) continue;
                            let txt = '';
                            let htm = '';
                            if (it.types.includes('text/plain')) {
                                const bTxt = await it.getType('text/plain');
                                if (bTxt && typeof bTxt.text === 'function') txt = await bTxt.text();
                            }
                            if (it.types.includes('text/html')) {
                                const bHtm = await it.getType('text/html');
                                if (bHtm && typeof bHtm.text === 'function') htm = await bHtm.text();
                            }
                            if (txt || htm) {
                                notificarCopiaNativaPagina(txt, htm, 'write');
                                break;
                            }
                        }
                    } catch (_) { }
                })();
            }
            return fnOriginal.apply(this, arguments);
        };

        try {
            if (ClipProto) {
                if (typeof originais.writeTextProto === 'function') {
                    ClipProto.writeText = empacotarWriteText(originais.writeTextProto);
                }
                if (typeof originais.writeProto === 'function') {
                    ClipProto.write = empacotarWrite(originais.writeProto);
                }
            }
            if (instClipboard) {
                if (typeof originais.writeTextInst === 'function') {
                    instClipboard.writeText = empacotarWriteText(originais.writeTextInst);
                }
                if (typeof originais.writeInst === 'function') {
                    instClipboard.write = empacotarWrite(originais.writeInst);
                }
            }
        } catch (_) { }

        const aoInterceptarEventoLeituraMain = (ev) => {
            try {
                const dVivo = obterDocVivo();
                if (!estaAtivaNaPagina(dVivo)) return;
                if (win.__JUSGOV_COLAGEM_INTERNA_ATIVA__ || win.__JUSGOV_COPIA_PROGRAMATICA_ATIVA__ || win.__JUSGOV_EXEC_COPY_APP_ATIVO__ || ehAppWebConfiavel(dVivo)) return;
                const alvo = ev && ev.target;
                if (alvo && typeof alvo.closest === 'function' && alvo.closest('[data-jusgov-ignore="true"]')) return;
                if (ehContextoEditavelOuExtensao(dVivo, null) || noEstaEmContextoEditavelOuExtensao(alvo, dVivo)) return;
                if (ev && ev.type === 'copy') {
                    if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
                    if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                    return;
                }
                if (ev && (ev.type === 'beforecopy' || ev.type === 'selectstart')) {
                    if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
                    if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                }
            } catch (_) { }
        };

        if (doc && typeof doc.addEventListener === 'function') {
            doc.addEventListener('beforecopy', aoInterceptarEventoLeituraMain, true);
            doc.addEventListener('copy', aoInterceptarEventoLeituraMain, true);
            doc.addEventListener('selectstart', aoInterceptarEventoLeituraMain, true);
        }

        win[CHAVE_INSTALADA] = {
            remover: () => {
                try {
                    if (SelProto) {
                        if (originais.removeAllRanges) SelProto.removeAllRanges = originais.removeAllRanges;
                        if (originais.empty) SelProto.empty = originais.empty;
                        if (originais.collapse) SelProto.collapse = originais.collapse;
                        if (originais.collapseToStart) SelProto.collapseToStart = originais.collapseToStart;
                        if (originais.collapseToEnd) SelProto.collapseToEnd = originais.collapseToEnd;
                        if (originais.setBaseAndExtent) SelProto.setBaseAndExtent = originais.setBaseAndExtent;
                    }
                    if (DocProto && originais.execCommand) {
                        DocProto.execCommand = originais.execCommand;
                    }
                    if (ClipProto) {
                        if (originais.writeTextProto) ClipProto.writeText = originais.writeTextProto;
                        if (originais.writeProto) ClipProto.write = originais.writeProto;
                    }
                    if (instClipboard) {
                        if (originais.writeTextInst) instClipboard.writeText = originais.writeTextInst;
                        if (originais.writeInst) instClipboard.write = originais.writeInst;
                    }
                    if (doc && typeof doc.removeEventListener === 'function') {
                        doc.removeEventListener('beforecopy', aoInterceptarEventoLeituraMain, true);
                        doc.removeEventListener('copy', aoInterceptarEventoLeituraMain, true);
                        doc.removeEventListener('selectstart', aoInterceptarEventoLeituraMain, true);
                    }
                } catch (_) { }
                delete win[CHAVE_INSTALADA];
            }
        };
        return true;
    }

    function removerProtecao(winParam) {
        const win = winParam || raiz || (typeof window !== 'undefined' ? window : null);
        if (!win || !win[CHAVE_INSTALADA]) return false;
        win[CHAVE_INSTALADA].remover();
        return true;
    }

    try {
        const protoLoc = (raiz && raiz.location && raiz.location.protocol) ? raiz.location.protocol : '';
        if (/^https?:$/i.test(protoLoc)) {
            instalarProtecao(raiz);
        }
    } catch (_) { }

    raiz.JusGovProtecaoCopiaMain = Object.freeze({
        instalarProtecao,
        removerProtecao,
        ehContextoEditavelOuExtensao,
        estaAtivaNaPagina
    });
}(typeof window !== 'undefined' ? window : self));
