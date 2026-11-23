/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-filtros-html-niveis.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Sanitização CSS e Filtros HTML Progressivos Níveis 1 a 4
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-filtros-html-niveis.js
 * - Classe Exportada: CopiaFiltrosHtmlNiveis (self.JusGovCopiaFiltrosHtmlNiveis) extends BaseModulo
 * - Métodos Públicos: limparPropriedadesWordEMso, podarTagsVaziasRecursivo, sanitizarEstilosCssSempreSemFonte, preSanitizarDomBase, _p_normalizarTagsAlinhamento, construirHtmlNivel1Basico, construirHtmlNivel2Intermediario, construirHtmlNivel3Avancado, construirHtmlNivel4Estendido, normalizarNivelFiltro, converterNivelFiltroParaIndice, converterIndiceParaNivelFiltro, aplicarFiltroHtmlPorNivel, envolverHtmlComResetDeCursorParaWord, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaFiltrosHtmlNiveis = fabrica(raiz);
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

    class CopiaFiltrosHtmlNiveis extends Base {
        constructor() {
            super('CopiaFiltrosHtmlNiveis');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaFiltrosHtmlNiveis.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaFiltrosHtmlNiveis.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        limparPropriedadesWordEMso(htmlBruto) {
            if (!htmlBruto || typeof htmlBruto !== 'string') return '';
            return htmlBruto
                .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
                .replace(/<!--[\s\S]*?-->/gi, '')
                .replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
                .replace(/<\/?(?:o|v|w|m|x):[^>]*>/gi, '')
                .replace(/\s*mso-[a-zA-Z0-9\-]+:[^;"]+;?/gi, '')
                .replace(/style="\s*"/gi, '');
        }

        podarTagsVaziasRecursivo(container) {
            if (!container) return;
            const tagsPodaveis = ['B', 'I', 'U', 'S', 'STRONG', 'EM', 'SPAN', 'P', 'DIV', 'SUB', 'SUP', 'MARK', 'SMALL', 'CODE', 'Q', 'ABBR', 'CITE'];
            let houveMudanca = true;
            let iteracoes = 0;
            while (houveMudanca && iteracoes < 10) {
                houveMudanca = false;
                iteracoes++;
                for (let t = 0; t < tagsPodaveis.length; t++) {
                    const tag = tagsPodaveis[t];
                    const els = container.querySelectorAll(tag.toLowerCase());
                    for (let i = 0; i < els.length; i++) {
                        const el = els[i];
                        if (!el.parentNode) continue;
                        const temQuebraOuTabela = el.querySelector('br, hr, table');
                        const txt = (el.textContent || '').replace(/[\u200B-\u200D\uFEFF\u2060\u00AD\s]/g, '');
                        if (!temQuebraOuTabela && txt.length === 0) {
                            el.remove();
                            houveMudanca = true;
                        }
                    }
                }
            }
        }

        sanitizarEstilosCssSempreSemFonte(styleStr, nivel = 3, tagNome = '') {
            if (!styleStr || typeof styleStr !== 'string') return '';
            const regras = styleStr.split(';');
            const permitidas = [];
            const nivelNum = (typeof nivel === 'number') ? nivel : this.converterNivelFiltroParaIndice(nivel);
            const tagUpper = String(tagNome || '').toUpperCase();

            for (let i = 0; i < regras.length; i++) {
                const regra = regras[i].trim();
                if (!regra || regra.indexOf(':') === -1) continue;
                const partes = regra.split(':');
                const prop = partes[0].trim().toLowerCase();
                const val = partes.slice(1).join(':').trim();

                if (prop === 'font-family' || prop === 'font' || prop === 'font-size' ||
                    prop === 'background' || prop === 'background-color' || prop.startsWith('mso-')) {
                    continue;
                }

                if (tagUpper === 'DIV') {
                    if (prop === 'position' && val.toLowerCase() !== 'relative') continue;
                    if (prop === 'z-index') {
                        const zNum = parseInt(val, 10);
                        if (!isNaN(zNum) && zNum < 0) continue;
                    }
                    if (prop === 'display' && /^(none|grid|inline-grid|flex|inline-flex)$/i.test(val)) continue;
                    if (prop === 'transform' || prop.startsWith('transform')) continue;
                }

                if (prop === 'color' && !/^(transparent|inherit)$/i.test(val)) {
                    permitidas.push(`color: ${val}`);
                } else if (prop === 'font-weight' && /^(bold|bolder|[5-9]00)$/i.test(val)) {
                    permitidas.push(`font-weight: ${val.toLowerCase()}`);
                } else if (prop === 'font-style' && /^(italic|oblique)$/i.test(val)) {
                    permitidas.push(`font-style: ${val.toLowerCase()}`);
                } else if (prop === 'text-decoration' || prop === 'text-decoration-line') {
                    if (/underline/i.test(val)) permitidas.push('text-decoration: underline');
                    else if (/line-through/i.test(val)) permitidas.push('text-decoration: line-through');
                }

                if (nivelNum >= 2) {
                    if (prop === 'text-align' && /^(left|right|center|justify)$/i.test(val)) {
                        permitidas.push(`text-align: ${val.toLowerCase()}`);
                    } else if (prop === 'display' && val.toLowerCase() === 'block') {
                        permitidas.push('display: block');
                    } else if (prop === 'border' || prop === 'border-collapse' || prop.startsWith('border-')) {
                        permitidas.push(`${prop}: ${val}`);
                    } else if (prop === 'padding' || prop.startsWith('padding-')) {
                        permitidas.push(`${prop}: ${val}`);
                    } else if (prop === 'width' || prop === 'min-width' || prop === 'max-width') {
                        permitidas.push(`${prop}: ${val}`);
                    } else if ((prop === 'margin-left' || prop === 'text-indent') && /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i.test(val)) {
                        permitidas.push(`${prop}: ${val.toLowerCase()}`);
                    }
                }

                if (nivelNum >= 3) {
                    if (prop === 'margin-top' || prop === 'margin-bottom' || prop === 'margin-right' || prop === 'margin') {
                        permitidas.push(`${prop}: ${val}`);
                    }
                    if (tagUpper === 'DIV' && prop === 'position' && val.toLowerCase() === 'relative') {
                        permitidas.push('position: relative');
                    }
                    if (tagUpper === 'DIV' && prop === 'z-index') {
                        const zNum = parseInt(val, 10);
                        if (!isNaN(zNum) && zNum >= 0) permitidas.push(`z-index: ${zNum}`);
                    }
                }

                if (nivelNum >= 4) {
                    if (prop === 'page-break-before' || prop === 'page-break-after' || prop === 'page-break-inside') {
                        permitidas.push(`${prop}: ${val.toLowerCase()}`);
                    } else if (prop === 'clear' || prop === 'float') {
                        permitidas.push(`${prop}: ${val}`);
                    }
                }
            }
            return permitidas.join('; ');
        }

        preSanitizarDomBase(origem) {
            if (!origem) return document.createElement('div');
            let container = null;
            if (typeof origem === 'string') {
                container = this._p_parsearHtmlParaDivIsolado(origem);
            } else {
                container = document.createElement('div');
                if (origem instanceof Range) {
                    const frag = origem.cloneContents();
                    if (frag) container.appendChild(frag);
                } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                    container.appendChild(origem.cloneNode(true));
                } else {
                    return container;
                }
            }

            const nosPerigosos = container.querySelectorAll(
                'script, noscript, template, object, embed, iframe, applet, include, import, link, meta, base, style, ' +
                '[data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden, .label-copy, [class*="label-copy"], .icone-copy, [class*="icone-copy"], .hidden'
            );
            for (let i = 0; i < nosPerigosos.length; i++) nosPerigosos[i].remove();

            const midias = container.querySelectorAll('canvas, video, audio, picture, img, svg, source, track, map, area');
            for (let i = 0; i < midias.length; i++) {
                const m = midias[i];
                if (!m.parentNode) continue;
                const temFilhosComTexto = Array.from(m.childNodes).some(c => (c.textContent || '').trim().length > 0);
                if (temFilhosComTexto) {
                    while (m.firstChild) m.parentNode.insertBefore(m.firstChild, m);
                } else {
                    const altTexto = (m.getAttribute('alt') || m.getAttribute('title') || '').trim();
                    if (altTexto) m.parentNode.insertBefore(document.createTextNode(`[${altTexto}]`), m);
                }
                m.remove();
            }

            const controlesForm = container.querySelectorAll('form, button, select, textarea, fieldset, legend, datalist, output, optgroup, option');
            for (let i = 0; i < controlesForm.length; i++) {
                const c = controlesForm[i];
                if (!c.parentNode) continue;
                while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c);
                c.remove();
            }
            const inputs = container.querySelectorAll('input');
            for (let i = 0; i < inputs.length; i++) {
                const inp = inputs[i];
                if (!inp.parentNode) continue;
                const val = (inp.getAttribute('value') || '').trim();
                const tipo = (inp.getAttribute('type') || '').toLowerCase();
                if (val && (tipo === 'button' || tipo === 'submit' || tipo === 'reset')) {
                    inp.parentNode.insertBefore(document.createTextNode(val), inp);
                }
                inp.remove();
            }

            const links = container.querySelectorAll('a');
            for (let i = 0; i < links.length; i++) {
                const a = links[i];
                if (!a.parentNode) continue;
                while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
                a.remove();
            }

            const todosElementos = container.querySelectorAll('*');
            for (let i = 0; i < todosElementos.length; i++) {
                const el = todosElementos[i];
                if (!el.parentNode) continue;
                const attrs = Array.from(el.attributes);
                for (let a = 0; a < attrs.length; a++) {
                    const attrNome = attrs[a].name.toLowerCase();
                    const attrVal = (attrs[a].value || '').toLowerCase().trim();
                    if (
                        attrNome.startsWith('on') ||
                        attrNome === 'src' || attrNome === 'srcset' || attrNome === 'action' ||
                        attrNome === 'formaction' || attrNome === 'data' || attrNome === 'poster' ||
                        attrNome === 'class' || attrNome === 'id' ||
                        attrNome.startsWith('data-') || attrNome.startsWith('aria-') ||
                        attrNome === 'href' || attrNome === 'target' ||
                        attrVal.includes('javascript:') || attrVal.includes('vbscript:') || attrVal.includes('data:text/html')
                    ) {
                        el.removeAttribute(attrs[a].name);
                    }
                }
            }

            return container;
        }

        _p_normalizarTagsAlinhamento(container) {
            const alinhamentos = container.querySelectorAll('center, left, right, justify');
            for (let i = 0; i < alinhamentos.length; i++) {
                const al = alinhamentos[i];
                if (!al.parentNode) continue;
                const tag = al.tagName.toLowerCase();
                const modo = (tag === 'center') ? 'center' : (tag === 'right') ? 'right' : (tag === 'justify') ? 'justify' : 'left';
                const p = document.createElement('p');
                p.style.textAlign = modo;
                while (al.firstChild) p.appendChild(al.firstChild);
                al.parentNode.replaceChild(p, al);
            }
        }

        construirHtmlNivel1Basico(origem) {
            if (!origem) return '';
            try {
                if (origem instanceof Range) {
                    const frag = origem.cloneContents ? origem.cloneContents() : null;
                    if (frag) {
                        const temBloco = Boolean(frag.querySelector('p, div, h1, h2, h3, h4, h5, h6, table, tr, li, blockquote, pre'));
                        if (!temBloco) return this.construirHtmlFormatacaoBasica(origem);
                    }
                }

                const container = this.preSanitizarDomBase(origem);

                const substituirTag = (sel, novaTag) => {
                    const lista = container.querySelectorAll(sel);
                    for (let i = 0; i < lista.length; i++) {
                        const n = document.createElement(novaTag);
                        while (lista[i].firstChild) n.appendChild(lista[i].firstChild);
                        lista[i].parentNode.replaceChild(n, lista[i]);
                    }
                };
                substituirTag('strong', 'b');
                substituirTag('em', 'i');
                substituirTag('del, strike', 's');
                substituirTag('ins', 'u');

                const comEstilo = container.querySelectorAll('[style]');
                for (let i = 0; i < comEstilo.length; i++) {
                    const el = comEstilo[i];
                    if (!el.parentNode) continue;
                    const st = (el.getAttribute('style') || '').toLowerCase();
                    const ehBold = /font-weight\s*:\s*(?:bold|bolder|[5-9]00)/.test(st);
                    const ehItalic = /font-style\s*:\s*(?:italic|oblique)/.test(st);
                    const ehUnderline = /text-decoration(?:-line)?\s*:\s*[^;]*underline/.test(st);
                    const ehStrike = /text-decoration(?:-line)?\s*:\s*[^;]*line-through/.test(st);

                    if (ehBold || ehItalic || ehUnderline || ehStrike) {
                        let wrapper = document.createDocumentFragment();
                        while (el.firstChild) wrapper.appendChild(el.firstChild);
                        const envolver = (t) => { const n = document.createElement(t); n.appendChild(wrapper); wrapper = n; };
                        if (ehStrike) envolver('s');
                        if (ehUnderline) envolver('u');
                        if (ehItalic) envolver('i');
                        if (ehBold) envolver('b');
                        el.appendChild(wrapper);
                    }
                    el.removeAttribute('style');
                }

                const tagsPermitidas1 = new Set(['B', 'I', 'U', 'S', 'SUB', 'SUP', 'BR']);
                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';
                    if (!tagsPermitidas1.has(tag)) {
                        const ehBloco = /^(?:P|DIV|TR|LI|H[1-6]|BLOCKQUOTE|PRE|HR|TABLE|THEAD|TBODY|TFOOT|TH|TD|DL|DT|DD|SECTION|ARTICLE|HEADER|FOOTER|NAV|ASIDE)$/.test(tag);
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        if (ehBloco) el.parentNode.insertBefore(document.createElement('br'), el);
                        el.remove();
                        continue;
                    }
                    while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name);
                }

                this.podarTagsVaziasRecursivo(container);
                const html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>').replace(/^(?:<br\s*\/?>\s*)+|(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel1Basico:', err);
                return '';
            }
        }

        construirHtmlNivel2Intermediario(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                this._p_normalizarTagsAlinhamento(container);

                const divs = container.querySelectorAll('div');
                for (let i = 0; i < divs.length; i++) {
                    const d = divs[i];
                    if (!d.parentNode) continue;
                    const spanSubstituto = document.createElement('span');
                    spanSubstituto.style.display = 'block';
                    const stOrig = d.getAttribute('style');
                    if (stOrig) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stOrig, 2, 'SPAN');
                        if (stLimpo) spanSubstituto.setAttribute('style', `display: block; ${stLimpo}`);
                    }
                    while (d.firstChild) spanSubstituto.appendChild(d.firstChild);
                    d.parentNode.replaceChild(spanSubstituto, d);
                }

                const tagsPermitidas2 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'BR',
                    'P', 'CENTER', 'LEFT', 'RIGHT', 'JUSTIFY',
                    'MARK', 'SMALL', 'CODE', 'Q', 'ABBR', 'CITE', 'SPAN',
                    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD'
                ]);

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas2.has(tag)) {
                        const ehBloco = /^(?:TR|LI|H[1-6]|BLOCKQUOTE|PRE|HR|DT|DD|DL)$/.test(tag);
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        if (ehBloco) el.parentNode.insertBefore(document.createElement('br'), el);
                        el.remove();
                        continue;
                    }
                    if (tag === 'TD' || tag === 'TH') {
                        el.removeAttribute('colspan');
                        el.removeAttribute('rowspan');
                    }
                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 2, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);
                const html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel2Intermediario:', err);
                return '';
            }
        }

        construirHtmlNivel3Avancado(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                this._p_normalizarTagsAlinhamento(container);

                const tagsPermitidas3 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'BR',
                    'P', 'CENTER', 'LEFT', 'RIGHT', 'JUSTIFY',
                    'MARK', 'SMALL', 'CODE', 'Q', 'ABBR', 'CITE', 'SPAN',
                    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
                    'HR', 'UL', 'OL', 'LI', 'DT', 'DD', 'DL',
                    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE'
                ]);

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';
                    if (!tagsPermitidas3.has(tag)) {
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.remove();
                        continue;
                    }
                    if (tag === 'TD' || tag === 'TH') {
                        el.removeAttribute('colspan');
                        el.removeAttribute('rowspan');
                    }
                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 3, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);
                const html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel3Avancado:', err);
                return '';
            }
        }

        construirHtmlNivel4Estendido(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                this._p_normalizarTagsAlinhamento(container);

                const tagsPermitidas4 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'BR',
                    'P', 'CENTER', 'LEFT', 'RIGHT', 'JUSTIFY',
                    'MARK', 'SMALL', 'CODE', 'Q', 'ABBR', 'CITE', 'SPAN',
                    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
                    'HR', 'UL', 'OL', 'LI', 'DT', 'DD', 'DL',
                    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE',
                    'NAV', 'MAIN', 'ARTICLE', 'ASIDE', 'FOOTER'
                ]);

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';
                    if (!tagsPermitidas4.has(tag)) {
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.remove();
                        continue;
                    }
                    if (tag === 'TD' || tag === 'TH') {
                        const cSpan = el.getAttribute('colspan');
                        const rSpan = el.getAttribute('rowspan');
                        if (cSpan && parseInt(cSpan, 10) > 1) el.setAttribute('colspan', String(parseInt(cSpan, 10)));
                        else el.removeAttribute('colspan');
                        if (rSpan && parseInt(rSpan, 10) > 1) el.setAttribute('rowspan', String(parseInt(rSpan, 10)));
                        else el.removeAttribute('rowspan');
                    }
                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 4, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);
                const html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel4Estendido:', err);
                return '';
            }
        }

        normalizarNivelFiltro(nivel) {
            if (typeof nivel === 'number') {
                if (nivel === 0) return 'texto_puro';
                if (nivel === 1) return 'basico';
                if (nivel === 2) return 'intermediario';
                if (nivel === 3) return 'avancado';
                if (nivel === 4) return 'estendido';
            }
            const s = String(nivel || '').toLowerCase().trim();
            if (s === '0' || s === 'texto_puro' || s === 'puro' || s === 'texto') return 'texto_puro';
            if (s === '1' || s === 'basico' || s === 'inline') return 'basico';
            if (s === '2' || s === 'intermediario' || s === 'paragrafo' || s === 'fluxo') return 'intermediario';
            if (s === '3' || s === 'avancado' || s === 'documental' || s === 'rtf') return 'avancado';
            if (s === '4' || s === 'estendido' || s === 'extendido' || s === 'sem_filtro' || s === 'office') return 'estendido';
            return 'basico';
        }

        converterNivelFiltroParaIndice(nivel) {
            const norm = this.normalizarNivelFiltro(nivel);
            if (norm === 'texto_puro') return 0;
            if (norm === 'basico') return 1;
            if (norm === 'intermediario') return 2;
            if (norm === 'avancado') return 3;
            if (norm === 'estendido') return 4;
            return 1;
        }

        converterIndiceParaNivelFiltro(indice) {
            const idx = Number(indice);
            if (idx === 0) return 'texto_puro';
            if (idx === 1) return 'basico';
            if (idx === 2) return 'intermediario';
            if (idx === 3) return 'avancado';
            if (idx === 4) return 'estendido';
            return 'basico';
        }

        aplicarFiltroHtmlPorNivel(origem, nivel) {
            const nivelNorm = this.normalizarNivelFiltro(nivel);
            if (nivelNorm === 'texto_puro') return this.extrairTextoPuroSanitizado(origem);
            let htmlResultado = '';
            if (nivelNorm === 'basico') htmlResultado = this.construirHtmlNivel1Basico(origem);
            else if (nivelNorm === 'intermediario') htmlResultado = this.construirHtmlNivel2Intermediario(origem);
            else if (nivelNorm === 'avancado') htmlResultado = this.construirHtmlNivel3Avancado(origem);
            else if (nivelNorm === 'estendido') htmlResultado = this.construirHtmlNivel4Estendido(origem);
            else htmlResultado = this.construirHtmlNivel1Basico(origem);
            return this._p_padraoFonteAtivo ? this._p_aplicarPadraoFonteNoHtml(htmlResultado) : htmlResultado;
        }

        envolverHtmlComResetDeCursorParaWord(codigoHTML) {
            if (!codigoHTML) return '';
            return String(codigoHTML).trim();
        }
    }

    Object.freeze(CopiaFiltrosHtmlNiveis.prototype);
    return Object.freeze(CopiaFiltrosHtmlNiveis);
}));