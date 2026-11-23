/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-filtros-html.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: FiltrosHtmlProgressivos
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-filtros-html.js
 * - Classe Exportada: FiltrosHtmlProgressivos (window.JusGovFiltrosHtmlProgressivos)
 * - Métodos Públicos: extrairTextoPuroSanitizado, construirHtmlNivel1Basico..4Estendido, aplicarFiltroHtmlPorNivel, normalizarNivelFiltro, converterNivelFiltroParaIndice, converterIndiceParaNivelFiltro, envolverHtmlComResetDeCursorParaWord, extrairListaUrlsDeOrigem, detectarFormatoEstruturado, converterHtmlParaMarkdown, converterHtmlParaRtf, extrairImagensDeRangeParaClipboard, gerarMapaFormatosClipboard
 * - Dependências Injetadas: FiltrosTextoCopia (src/mod-copia/lib-copia-filtros-texto.js), window.JusGovConstantes
 * - Regras / Seções: Regra 2.13 (Filtros HTML 5 Níveis), FEAT-72 (Multi-MIME), ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Implementação dedicada da Arquitetura Progressiva de Filtros HTML (5 Níveis Estritos),
 * sanitização CSP/XSS em DOMParser inerte e gerador Multi-MIME para a Área de Transferência.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFiltrosHtmlProgressivos) {
        return;
    }

    const NULL_FILTROS_TEXTO = Object.freeze({
        converterCabecalhoPjeAtivo: true,
        aplicarFiltro1DadosLixo(t) { return String(t || ''); },
        aplicarPreHigienizacaoTexto(t) { return String(t || ''); },
        unificarLinhasComEspacamentoAntiTruncamento(t) { return String(t || '').trim(); },
        aplicarFiltro3InformacoesELinhas(t) { return String(t || '').trim(); },
        aplicarPosLimpezaDefensiva(t) { return String(t || '').trim(); },
        higienizarTextoParaCopia(t) { return String(t || '').trim(); }
    });

    class FiltrosHtmlProgressivos {
        _p_filtrosTexto;
        _p_padraoFonteAtivo = false;
        _p_fontePadrao = 'Arial';
        _p_tamanhoFontePadrao = '12';

        constructor(opcoes = {}) {
            this._p_filtrosTexto = opcoes.filtrosTexto ||
                (typeof window !== 'undefined' && window.JusGovFiltrosTextoCopia ? new window.JusGovFiltrosTextoCopia() : NULL_FILTROS_TEXTO);
            this.separadorTabela = (typeof opcoes.separadorTabela === 'string' && opcoes.separadorTabela.trim())
                ? opcoes.separadorTabela
                : ';';
        }

        get converterCabecalhoPjeAtivo() {
            return Boolean(this._p_filtrosTexto.converterCabecalhoPjeAtivo);
        }

        set converterCabecalhoPjeAtivo(valor) {
            if (this._p_filtrosTexto !== NULL_FILTROS_TEXTO) {
                this._p_filtrosTexto.converterCabecalhoPjeAtivo = Boolean(valor);
            }
        }

        definirSeparadorTabela(sep) {
            if (typeof sep === 'string' && sep.trim().length > 0) {
                this.separadorTabela = sep;
            }
        }

        definirPadraoFonteCopia(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            if (typeof opcoes.ativo === 'boolean') {
                this._p_padraoFonteAtivo = opcoes.ativo;
            }
            if (typeof opcoes.fonte === 'string' && opcoes.fonte.trim().length > 0) {
                this._p_fontePadrao = opcoes.fonte.trim().replace(/[;"'\r\n<>]/g, '').slice(0, 80) || 'Arial';
            }
            if (opcoes.tamanho !== undefined && opcoes.tamanho !== null && String(opcoes.tamanho).trim().length > 0) {
                const tamLimpo = String(opcoes.tamanho).trim().replace(/[;"'\r\n<>]/g, '').slice(0, 16);
                if (tamLimpo) this._p_tamanhoFontePadrao = tamLimpo;
            }
        }

        gerarHtmlTextoPuroComFontePadrao(textoPlano) {
            if (!this._p_padraoFonteAtivo || !textoPlano || typeof textoPlano !== 'string') return '';
            const fonteLimpa = (this._p_fontePadrao || 'Arial').trim();
            const fonteCss = /\s/.test(fonteLimpa) ? `'${fonteLimpa}'` : fonteLimpa;
            const tamRaw = String(this._p_tamanhoFontePadrao || '12').trim();
            const tamCss = /^\d+(?:\.\d+)?$/.test(tamRaw) ? `${tamRaw}pt` : tamRaw;
            const escapado = textoPlano
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\r?\n/g, '<br>');
            return `<span style="font-family: ${fonteCss}; font-size: ${tamCss};">${escapado}</span>`;
        }

        _p_aplicarPadraoFonteNoHtml(htmlBruto) {
            if (!this._p_padraoFonteAtivo || !htmlBruto || typeof htmlBruto !== 'string') return htmlBruto;
            const fonteLimpa = (this._p_fontePadrao || 'Arial').trim();
            const fonteCss = /\s/.test(fonteLimpa) ? `'${fonteLimpa}'` : fonteLimpa;
            const tamRaw = String(this._p_tamanhoFontePadrao || '12').trim();
            const tamCss = /^\d+(?:\.\d+)?$/.test(tamRaw) ? `${tamRaw}pt` : tamRaw;
            const estiloPadrao = `font-family: ${fonteCss}; font-size: ${tamCss};`;

            try {
                const body = this._parsearHtmlSeguro(htmlBruto);
                if (!body) {
                    return `<span style="${estiloPadrao}">${htmlBruto}</span>`;
                }
                /* Passo 1: Remover atributos legados <font face/size> e qualquer font-family/font-size remanescente */
                const todos = body.querySelectorAll('*');
                const tagsBloco = new Set(['P', 'DIV', 'TD', 'TH', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'DT', 'DD']);
                let temBloco = false;
                for (let i = 0; i < todos.length; i++) {
                    const el = todos[i];
                    if (el.hasAttribute('face')) el.removeAttribute('face');
                    if (el.hasAttribute('size')) el.removeAttribute('size');
                    if (el.style) {
                        el.style.removeProperty('font-family');
                        el.style.removeProperty('font-size');
                    }
                    if (tagsBloco.has(el.tagName)) {
                        temBloco = true;
                        el.style.setProperty('font-family', fonteCss);
                        el.style.setProperty('font-size', tamCss);
                    }
                }
                const htmlLimpo = body.innerHTML;
                if (!temBloco) {
                    return `<span style="${estiloPadrao}">${htmlLimpo}</span>`;
                }
                return `<div style="${estiloPadrao}">${htmlLimpo}</div>`;
            } catch (_) {
                return `<span style="${estiloPadrao}">${htmlBruto}</span>`;
            }
        }

        obterSeparadorTabela() {
            if (typeof this.separadorTabela === 'string' && this.separadorTabela.trim().length > 0) {
                return this.separadorTabela;
            }
            if (typeof window !== 'undefined' && typeof window.__JUSGOV_SEPARADOR_ACUMULADOR__ === 'string' && window.__JUSGOV_SEPARADOR_ACUMULADOR__.trim().length > 0) {
                return window.__JUSGOV_SEPARADOR_ACUMULADOR__;
            }
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : null;
            if (cExt && cExt.PADROES && typeof cExt.PADROES.separadorAcumulador === 'string') {
                return cExt.PADROES.separadorAcumulador;
            }
            return ';';
        }

        escaparTextoHtmlBasico(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        _p_devePreservarQuebrasDoElemento(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
            try {
                if (el.closest && el.closest('pre, textarea')) return true;
                const ws = (typeof window !== 'undefined' && window.getComputedStyle)
                    ? window.getComputedStyle(el).whiteSpace
                    : (el.style ? el.style.whiteSpace : '');
                return ws === 'pre' || ws === 'pre-wrap' || ws === 'pre-line' || ws === 'break-spaces';
            } catch (_) {
                return false;
            }
        }

        _p_parsearHtmlParaDivIsolado(origemHtml) {
            const container = document.createElement('div');
            const textoHtml = String(origemHtml || '');
            if (!textoHtml) return container;
            if (typeof DOMParser === 'function') {
                try {
                    const docInerte = new DOMParser().parseFromString(textoHtml, 'text/html');
                    if (docInerte && docInerte.body) {
                        const perigosos = docInerte.body.querySelectorAll('script, iframe, object, embed, applet');
                        for (let i = 0; i < perigosos.length; i++) perigosos[i].remove();
                        while (docInerte.body.firstChild) {
                            container.appendChild(document.adoptNode(docInerte.body.firstChild));
                        }
                        return container;
                    }
                } catch (_) { }
            }
            container.textContent = textoHtml;
            return container;
        }

        extrairTextoPuroSanitizado(origem) {
            if (!origem) return '';
            try {
                let preservarQuebrasNaOrigem = false;
                let container = null;
                if (typeof origem === 'string') {
                    container = this._p_parsearHtmlParaDivIsolado(origem);
                } else {
                    container = document.createElement('div');
                    if (origem instanceof Range) {
                        const anc = origem.commonAncestorContainer || origem.startContainer;
                        const ancEl = anc && anc.nodeType === Node.TEXT_NODE ? anc.parentElement : anc;
                        preservarQuebrasNaOrigem = this._p_devePreservarQuebrasDoElemento(ancEl);
                        const frag = origem.cloneContents();
                        if (frag) container.appendChild(frag);
                    } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                        preservarQuebrasNaOrigem = this._p_devePreservarQuebrasDoElemento(origem);
                        container.appendChild(origem.cloneNode(true));
                    } else {
                        return this._p_filtrosTexto.higienizarTextoParaCopia(String(origem || ''));
                    }
                }

                const nosPerigosos = container.querySelectorAll(
                    'script, style, iframe, object, embed, applet, noscript, template, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden, .label-copy, [class*="label-copy"], .icone-copy, [class*="icone-copy"], .hidden'
                );
                for (let i = 0; i < nosPerigosos.length; i++) {
                    nosPerigosos[i].remove();
                }

                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
                let noTexto;
                while ((noTexto = walker.nextNode())) {
                    const pai = noTexto.parentElement;
                    const preservarAqui = preservarQuebrasNaOrigem
                        || (pai && pai.closest && Boolean(pai.closest('pre, textarea, [style*="white-space: pre"], [style*="white-space:pre"]')));
                    if (!preservarAqui) {
                        if (noTexto.nodeValue) {
                            noTexto.nodeValue = noTexto.nodeValue.replace(/[\r\n\t]+/g, ' ');
                        }
                    } else if (noTexto.nodeValue) {
                        noTexto.nodeValue = noTexto.nodeValue.replace(/\r\n?/g, '\n');
                    }
                }

                const quebras = container.querySelectorAll('br, hr');
                for (let i = 0; i < quebras.length; i++) {
                    const elQ = quebras[i];
                    if (elQ.closest('a, [role="link"]') || elQ.closest('td, th')) {
                        elQ.replaceWith(document.createTextNode(' '));
                    } else {
                        elQ.replaceWith(document.createTextNode('\n'));
                    }
                }

                const sepColunas = this.obterSeparadorTabela();
                const linhasTr = Array.from(container.querySelectorAll('tr'));
                for (let r = 0; r < linhasTr.length; r++) {
                    const tr = linhasTr[r];
                    const celulasTr = Array.from(tr.querySelectorAll('th, td'));
                    for (let c = 0; c < celulasTr.length; c++) {
                        const cel = celulasTr[c];
                        const textoNodes = Array.from(cel.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                        if (textoNodes.length > 0) {
                            const prim = textoNodes[0];
                            const ult = textoNodes[textoNodes.length - 1];
                            if (prim.nodeValue) prim.nodeValue = prim.nodeValue.replace(/^\s+/, '');
                            if (ult.nodeValue) ult.nodeValue = ult.nodeValue.replace(/\s+$/, '');
                        }
                        if (c < celulasTr.length - 1) {
                            cel.appendChild(document.createTextNode(sepColunas));
                        }
                    }
                    tr.appendChild(document.createTextNode('\n'));
                }

                const celulasAvulsas = Array.from(container.querySelectorAll('td, th')).filter(c => !c.closest('tr'));
                if (celulasAvulsas.length > 1) {
                    for (let c = 0; c < celulasAvulsas.length - 1; c++) {
                        celulasAvulsas[c].appendChild(document.createTextNode(sepColunas));
                    }
                }

                const paisComMultiplosSpans = new Set();
                const todosSpans = Array.from(container.querySelectorAll('span'));
                for (let i = 0; i < todosSpans.length; i++) {
                    const sp = todosSpans[i];
                    if (sp.parentElement) {
                        const ehGridColuna = sp.className && typeof sp.className === 'string' && /(?:^|\s)col-/i.test(sp.className);
                        if (!ehGridColuna) {
                            const irmaosSpanInline = Array.from(sp.parentElement.children).filter(c => {
                                if (c.tagName !== 'SPAN') return false;
                                const cGrid = c.className && typeof c.className === 'string' && /(?:^|\s)col-/i.test(c.className);
                                return !cGrid;
                            });
                            if (irmaosSpanInline.length >= 2) {
                                paisComMultiplosSpans.add(sp.parentElement);
                            }
                        }
                    }
                }

                paisComMultiplosSpans.forEach(pai => {
                    const spansFilhos = Array.from(pai.children).filter(c => {
                        if (c.tagName !== 'SPAN') return false;
                        const cGrid = c.className && typeof c.className === 'string' && /(?:^|\s)col-/i.test(c.className);
                        return !cGrid;
                    });
                    for (let s = 0; s < spansFilhos.length; s++) {
                        const spAtual = spansFilhos[s];
                        const filhosTexto = Array.from(spAtual.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                        if (filhosTexto.length > 0) {
                            const prim = filhosTexto[0];
                            const ult = filhosTexto[filhosTexto.length - 1];
                            if (prim.nodeValue) prim.nodeValue = prim.nodeValue.replace(/^\s+/, '');
                            if (ult.nodeValue) ult.nodeValue = ult.nodeValue.replace(/\s+$/, '');
                        }
                        if (s < spansFilhos.length - 1) {
                            pai.insertBefore(document.createTextNode(' '), spAtual.nextSibling);
                        }
                    }
                });

                const blocos = container.querySelectorAll(
                    'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, header, footer, section, article, dt, dd, ' +
                    '[class*="col-"], [class*="tarefa"], [class*="card"], [class*="movimentacao"], ' +
                    '[class*="local"], [class*="orgao"], [class*="label"], [class*="badge"]'
                );
                for (let i = 0; i < blocos.length; i++) {
                    const elBloco = blocos[i];
                    const tagBloco = elBloco.tagName ? elBloco.tagName.toUpperCase() : '';
                    if (tagBloco === 'SPAN') {
                        const ehGridColuna = elBloco.className && typeof elBloco.className === 'string' && /(?:^|\s)col-/i.test(elBloco.className);
                        if (!ehGridColuna) {
                            continue;
                        }
                    }
                    if (elBloco.closest('td, th')) {
                        if (elBloco.parentElement) {
                            elBloco.parentElement.insertBefore(document.createTextNode(' '), elBloco);
                        }
                        elBloco.appendChild(document.createTextNode(' '));
                    } else if (elBloco.closest('a, [role="link"]')) {
                        elBloco.appendChild(document.createTextNode(' '));
                    } else {
                        elBloco.appendChild(document.createTextNode('\n'));
                    }
                }

                let texto = container.textContent || '';
                texto = texto
                    .replace(/&amp;/gi, '&')
                    .replace(/&lt;/gi, '<')
                    .replace(/&gt;/gi, '>')
                    .replace(/&quot;/gi, '"')
                    .replace(/&#39;/g, "'");

                return this._p_filtrosTexto.higienizarTextoParaCopia(texto);
            } catch (err) {
                console.error('Erro em extrairTextoPuroSanitizado:', err);
                return typeof origem === 'string'
                    ? this._p_filtrosTexto.higienizarTextoParaCopia(origem.replace(/<[^>]+>/g, ''))
                    : '';
            }
        }

        _parsearHtmlSeguro(html) {
            if (!html || typeof html !== 'string' || typeof DOMParser === 'undefined') return null;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                if (doc && doc.body) {
                    const proibidos = doc.body.querySelectorAll('script, iframe, object, embed, meta, base, style, link');
                    for (let i = 0; i < proibidos.length; i++) proibidos[i].remove();
                    return doc.body;
                }
            } catch (_) { }
            return null;
        }

        extrairListaUrlsDeOrigem(origem, textoFallback = '') {
            const urls = [];
            const pushUrl = (bruto) => {
                const s = String(bruto || '').trim();
                if (!s) return;
                if (/^(?:https?:\/\/\S+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/i.test(s) && !urls.includes(s)) {
                    urls.push(s);
                }
            };
            try {
                if (origem && typeof origem === 'object') {
                    const frag = (typeof origem.cloneContents === 'function')
                        ? origem.cloneContents()
                        : (typeof origem.querySelectorAll === 'function' ? origem : null);
                    if (frag && typeof frag.querySelectorAll === 'function') {
                        const links = frag.querySelectorAll('a[href]');
                        for (let i = 0; i < links.length; i++) pushUrl(links[i].getAttribute('href'));
                    }
                    const anc = origem.commonAncestorContainer;
                    const elAnc = (anc && anc.nodeType === 1) ? anc : (anc && anc.parentElement ? anc.parentElement : null);
                    if (elAnc && typeof elAnc.closest === 'function') {
                        const aPai = elAnc.closest('a[href]');
                        if (aPai) pushUrl(aPai.getAttribute('href'));
                    }
                } else if (typeof origem === 'string' && origem.includes('<')) {
                    const body = this._parsearHtmlSeguro(origem);
                    if (body) {
                        const links = body.querySelectorAll('a[href]');
                        for (let i = 0; i < links.length; i++) pushUrl(links[i].getAttribute('href'));
                    }
                }
            } catch (_) { }

            const tokens = String(textoFallback || '').split(/\s+/);
            for (let i = 0; i < tokens.length; i++) {
                const limpo = tokens[i].replace(/[.,;)\]>'"]+$/, '').replace(/^[(\[<'" ]+/, '');
                if (/^https?:\/\/[^\s<>]+$/i.test(limpo)) pushUrl(limpo);
            }
            return urls.join('\n');
        }

        detectarFormatoEstruturado(textoPlano) {
            const txt = String(textoPlano || '').trim();
            if (!txt || txt.length > 262144) return null;
            if ((txt.startsWith('{') && txt.endsWith('}')) || (txt.startsWith('[') && txt.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(txt);
                    if (parsed !== null && typeof parsed === 'object') {
                        return { mime: 'application/json', conteudo: txt };
                    }
                } catch (_) { }
            }
            if ((txt.startsWith('<?xml') || (/^<[a-zA-Z_][\w:.-]*(?:\s[^>]*)?>[\s\S]*<\/[a-zA-Z_][\w:.-]*>$/.test(txt) &&
                !/^<(?:html|body|div|span|p|b|i|u|strong|em|a|table|ul|ol|li|script|iframe)\b/i.test(txt))) &&
                typeof DOMParser !== 'undefined') {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(txt, 'application/xml');
                    if (xmlDoc && xmlDoc.documentElement && !xmlDoc.querySelector('parsererror')) {
                        return { mime: 'text/xml', conteudo: txt };
                    }
                } catch (_) { }
            }
            return null;
        }

        converterHtmlParaMarkdown(html, textoFallback = '') {
            if (!html || typeof html !== 'string') return String(textoFallback || '').trim();
            const body = this._parsearHtmlSeguro(html);
            if (!body) return String(textoFallback || '').trim();

            const renderNo = (no) => {
                if (!no) return '';
                if (no.nodeType === 3) return String(no.nodeValue || '').replace(/[ \t\r\n]+/g, ' ');
                if (no.nodeType !== 1) return '';
                const tag = (no.tagName || '').toUpperCase();
                if (tag === 'BR') return '\n';
                if (tag === 'HR') return '\n---\n';
                if (tag === 'IMG') {
                    const src = (no.getAttribute('src') || '').trim();
                    const alt = (no.getAttribute('alt') || 'imagem').trim();
                    return /^(?:https?:\/\/|data:image\/)/i.test(src) ? `![${alt}](${src})` : '';
                }
                const interno = Array.from(no.childNodes || []).map(renderNo).join('');
                const txtTrim = interno.trim();
                if (tag === 'B' || tag === 'STRONG') return txtTrim ? `**${txtTrim}**` : '';
                if (tag === 'I' || tag === 'EM') return txtTrim ? `*${txtTrim}*` : '';
                if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') return txtTrim ? `~~${txtTrim}~~` : '';
                if (tag === 'CODE' && (!no.parentElement || no.parentElement.tagName.toUpperCase() !== 'PRE')) return txtTrim ? `\`${txtTrim}\`` : '';
                if (tag === 'PRE') return txtTrim ? `\n\`\`\`\n${(no.textContent || '').trim()}\n\`\`\`\n` : '';
                if (tag === 'A') {
                    const href = (no.getAttribute('href') || '').trim();
                    return /^(?:https?:\/\/|mailto:)/i.test(href) ? `[${txtTrim || href}](${href})` : txtTrim;
                }
                if (/^H([1-6])$/.test(tag)) {
                    const niv = Number(tag.charAt(1));
                    return txtTrim ? `\n${'#'.repeat(niv)} ${txtTrim}\n\n` : '';
                }
                if (tag === 'BLOCKQUOTE') return txtTrim ? `\n> ${txtTrim.replace(/\n+/g, '\n> ')}\n\n` : '';
                if (tag === 'LI') return txtTrim ? `- ${txtTrim}\n` : '';
                if (tag === 'UL' || tag === 'OL') return txtTrim ? `\n${interno}\n` : '';
                if (tag === 'TR') {
                    const cols = Array.from(no.children || [])
                        .filter(c => c.tagName === 'TD' || c.tagName === 'TH')
                        .map(c => renderNo(c).replace(/\|/g, '\\|').trim());
                    return cols.length > 0 ? `| ${cols.join(' | ')} |\n` : '';
                }
                if (tag === 'TABLE') {
                    const rows = Array.from(no.querySelectorAll('tr')).map(r => renderNo(r)).filter(Boolean);
                    if (rows.length > 0) {
                        const firstCols = Math.max(1, rows[0].split('|').length - 2);
                        const sep = `| ${Array(firstCols).fill('---').join(' | ')} |\n`;
                        return `\n${rows[0]}${sep}${rows.slice(1).join('')}\n`;
                    }
                    return '';
                }
                if (tag === 'P' || tag === 'DIV') return txtTrim ? `${txtTrim}\n\n` : '';
                return interno;
            };

            return renderNo(body).replace(/\n{3,}/g, '\n\n').trim() || String(textoFallback || '').trim();
        }

        converterHtmlParaRtf(html, textoFallback = '') {
            const escRtf = (str) => {
                let out = '';
                const s = String(str || '');
                for (let i = 0; i < s.length; i++) {
                    const ch = s[i];
                    const code = s.charCodeAt(i);
                    if (ch === '\\' || ch === '{' || ch === '}') out += '\\' + ch;
                    else if (ch === '\n') out += '\\par ';
                    else if (ch === '\t') out += '\\tab ';
                    else if (code > 127) out += `\\u${code > 32767 ? code - 65536 : code}?`;
                    else if (code >= 32) out += ch;
                }
                return out;
            };

            const body = this._parsearHtmlSeguro(html);
            if (!body) return `{\\rtf1\\ansi\\deff0\\uc1 ${escRtf(textoFallback)}}`;

            const renderRtf = (no) => {
                if (!no) return '';
                if (no.nodeType === 3) return escRtf(String(no.nodeValue || '').replace(/[ \t\r\n]+/g, ' '));
                if (no.nodeType !== 1) return '';
                const tag = (no.tagName || '').toUpperCase();
                if (tag === 'BR') return '\\line ';
                const inner = Array.from(no.childNodes || []).map(renderRtf).join('');
                if (tag === 'B' || tag === 'STRONG') return `{\\b ${inner}}`;
                if (tag === 'I' || tag === 'EM') return `{\\i ${inner}}`;
                if (tag === 'U') return `{\\ul ${inner}}`;
                if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') return `{\\strike ${inner}}`;
                if (tag === 'LI') return `\\bullet  ${inner}\\par `;
                if (tag === 'TR') {
                    const cels = Array.from(no.children || []).filter(c => c.tagName === 'TD' || c.tagName === 'TH');
                    if (cels.length > 0) return `\\trowd ${cels.map(c => `${renderRtf(c)}\\cell `).join('')}\\row `;
                }
                if (tag === 'P' || tag === 'DIV' || /^H[1-6]$/.test(tag) || tag === 'BLOCKQUOTE') {
                    return inner.trim() ? `${inner}\\par ` : '';
                }
                return inner;
            };

            const corpo = renderRtf(body).replace(/(?:\\par )+$/, '');
            return `{\\rtf1\\ansi\\deff0\\uc1 ${corpo || escRtf(textoFallback)}}`;
        }

        extrairImagensDeRangeParaClipboard(origem) {
            const res = { svgMarkup: '', dataUrlPng: '', dataUrlJpeg: '' };
            if (!origem || typeof origem !== 'object') return res;
            try {
                const frag = (typeof origem.cloneContents === 'function')
                    ? origem.cloneContents()
                    : (typeof origem.querySelectorAll === 'function' ? origem : null);
                if (!frag || typeof frag.querySelector !== 'function') return res;

                const svgEl = frag.querySelector('svg');
                if (svgEl) {
                    const cloneSvg = svgEl.cloneNode(true);
                    const perigosos = cloneSvg.querySelectorAll('script, foreignObject');
                    for (let i = 0; i < perigosos.length; i++) perigosos[i].remove();
                    Array.from(cloneSvg.querySelectorAll('*')).concat([cloneSvg]).forEach((el) => {
                        if (!el.attributes) return;
                        Array.from(el.attributes).forEach((at) => {
                            if (/^on/i.test(at.name) || /javascript:/i.test(at.value)) el.removeAttribute(at.name);
                        });
                    });
                    if (!cloneSvg.getAttribute('xmlns')) cloneSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    res.svgMarkup = cloneSvg.outerHTML || '';
                }

                const imgEl = frag.querySelector('img[src]');
                if (imgEl) {
                    const src = (imgEl.getAttribute('src') || '').trim();
                    if (/^data:image\/png;base64,/i.test(src)) res.dataUrlPng = src;
                    else if (/^data:image\/jpe?g;base64,/i.test(src)) res.dataUrlJpeg = src;
                }
            } catch (_) { }
            return res;
        }

        gerarMapaFormatosClipboard(origem, nivel, opcoes = {}) {
            const nivelNorm = this.normalizarNivelFiltro(nivel);
            const nivelIdx = this.converterNivelFiltroParaIndice(nivelNorm);
            const htmlLimpo = (nivelIdx >= 1 && origem) ? this.aplicarFiltroHtmlPorNivel(origem, nivelNorm) : '';
            const htmlClipboard = htmlLimpo ? this.envolverHtmlComResetDeCursorParaWord(htmlLimpo) : '';
            const textoPlano = (opcoes && typeof opcoes.textoFallback === 'string' && opcoes.textoFallback.trim())
                ? (this.extrairTextoPuroSanitizado(htmlLimpo) || opcoes.textoFallback.trim())
                : this.extrairTextoPuroSanitizado(htmlLimpo || origem);

            const uriList = (nivelIdx >= 1) ? this.extrairListaUrlsDeOrigem(origem, textoPlano) : '';
            const estruturado = (nivelIdx >= 1) ? this.detectarFormatoEstruturado(textoPlano) : null;
            const markdown = (nivelIdx >= 2 && htmlClipboard) ? this.converterHtmlParaMarkdown(htmlClipboard, textoPlano) : '';
            const rtf = (nivelIdx >= 3 && htmlClipboard) ? this.converterHtmlParaRtf(htmlClipboard, textoPlano) : '';
            const imagens = (nivelIdx >= 4 && origem)
                ? this.extrairImagensDeRangeParaClipboard(origem)
                : { svgMarkup: '', dataUrlPng: '', dataUrlJpeg: '' };

            return { nivelNorm, nivelIdx, textoPlano, htmlClipboard, uriList, estruturado, markdown, rtf, imagens };
        }
    }

        const _ext_FiltrosHtmlProgressivos = [
        { g: 'JusGovCopiaFiltrosHtmlBasico', p: './copia-filtros-html-basico.js' },
        { g: 'JusGovCopiaFiltrosHtmlNiveis', p: './copia-filtros-html-niveis.js' }
    ];
    for (let i = 0; i < _ext_FiltrosHtmlProgressivos.length; i++) {
        const it = _ext_FiltrosHtmlProgressivos[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(FiltrosHtmlProgressivos.prototype);
        }
    }

    Object.freeze(FiltrosHtmlProgressivos.prototype);
    window.JusGovFiltrosHtmlProgressivos = Object.freeze(FiltrosHtmlProgressivos);
})();

