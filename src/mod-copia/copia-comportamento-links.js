/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-comportamento-links.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Extração de Links Multilinha, Visibilidade e Ranges Alt
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-comportamento-links.js
 * - Classe Exportada: CopiaComportamentoLinks (self.JusGovCopiaComportamentoLinks) extends BaseModulo
 * - Métodos Públicos: isElementoOcultoNoDom, extrairTextoVisivelLimpoDeElemento, isLinkMultilinha, extrairLinhaClicadaDeLink, criarRangeTextoParaEtiquetaOuObjeto, extrairTextoLinkUmaLinha, resolverRangeAltEmInterface, isBlocoVerificavel, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaComportamentoLinks = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const _JGC = (raiz && raiz.JusGovConstantes) || {};
    const EXPRESSOES_REGULARES = _JGC.EXPRESSOES_REGULARES || {};
    const REGEX_AUDITORIA = _JGC.REGEX_AUDITORIA || {};
    const CONFIGURACAO_MOTOR = _JGC.CONFIGURACAO_MOTOR || {};
    const CATALOGO_PADROES_JURIDICOS = _JGC.CATALOGO_PADROES_JURIDICOS || [];
    const ESTILOS_BADGE_MARCADOR_COLADO = _JGC.ESTILOS_BADGE_MARCADOR_COLADO || [];

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    class CopiaComportamentoLinks extends Base {
        constructor() {
            super('CopiaComportamentoLinks');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaComportamentoLinks.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaComportamentoLinks.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
            const unificar = this._p_deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const higienizar = this._p_deps.higienizarTextoParaCopia || ((s) => String(s || '').trim());
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
            const unificar = this._p_deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const obterPonto = this._p_deps.obterPontoDoClique;
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
            const unificar = this._p_deps.unificarLinhasComEspacamentoAntiTruncamento || ((s) => String(s || '').trim());
            const higienizar = this._p_deps.higienizarTextoParaCopia || ((s) => String(s || '').trim());
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

            const extrairPuro = this._p_deps.extrairTextoPuroSanitizado || ((r) => (r ? r.toString() : ''));
            const criarRange = this._p_deps.criarRangeDOMAPartirDeIndices;

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
            const validadores = this._p_deps.validadores;
            if (validadores && typeof validadores.isBlocoVerificavel === 'function') {
                return validadores.isBlocoVerificavel(texto);
            }
            return this.isTextoCampoEstruturadoForense(texto);
        }
    }

    Object.freeze(CopiaComportamentoLinks.prototype);
    return Object.freeze(CopiaComportamentoLinks);
}));