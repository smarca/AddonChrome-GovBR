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
        #filtrosTexto;
        #padraoFonteAtivo = false;
        #fontePadrao = 'Arial';
        #tamanhoFontePadrao = '12';

        constructor(opcoes = {}) {
            this.#filtrosTexto = opcoes.filtrosTexto ||
                (typeof window !== 'undefined' && window.JusGovFiltrosTextoCopia ? new window.JusGovFiltrosTextoCopia() : NULL_FILTROS_TEXTO);
            this.separadorTabela = (typeof opcoes.separadorTabela === 'string' && opcoes.separadorTabela.trim())
                ? opcoes.separadorTabela
                : ';';
        }

        get converterCabecalhoPjeAtivo() {
            return Boolean(this.#filtrosTexto.converterCabecalhoPjeAtivo);
        }

        set converterCabecalhoPjeAtivo(valor) {
            if (this.#filtrosTexto !== NULL_FILTROS_TEXTO) {
                this.#filtrosTexto.converterCabecalhoPjeAtivo = Boolean(valor);
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
                this.#padraoFonteAtivo = opcoes.ativo;
            }
            if (typeof opcoes.fonte === 'string' && opcoes.fonte.trim().length > 0) {
                this.#fontePadrao = opcoes.fonte.trim().replace(/[;"'\r\n<>]/g, '').slice(0, 80) || 'Arial';
            }
            if (opcoes.tamanho !== undefined && opcoes.tamanho !== null && String(opcoes.tamanho).trim().length > 0) {
                const tamLimpo = String(opcoes.tamanho).trim().replace(/[;"'\r\n<>]/g, '').slice(0, 16);
                if (tamLimpo) this.#tamanhoFontePadrao = tamLimpo;
            }
        }

        gerarHtmlTextoPuroComFontePadrao(textoPlano) {
            if (!this.#padraoFonteAtivo || !textoPlano || typeof textoPlano !== 'string') return '';
            const fonteLimpa = (this.#fontePadrao || 'Arial').trim();
            const fonteCss = /\s/.test(fonteLimpa) ? `'${fonteLimpa}'` : fonteLimpa;
            const tamRaw = String(this.#tamanhoFontePadrao || '12').trim();
            const tamCss = /^\d+(?:\.\d+)?$/.test(tamRaw) ? `${tamRaw}pt` : tamRaw;
            const escapado = textoPlano
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\r?\n/g, '<br>');
            return `<span style="font-family: ${fonteCss}; font-size: ${tamCss};">${escapado}</span>`;
        }

        #aplicarPadraoFonteNoHtml(htmlBruto) {
            if (!this.#padraoFonteAtivo || !htmlBruto || typeof htmlBruto !== 'string') return htmlBruto;
            const fonteLimpa = (this.#fontePadrao || 'Arial').trim();
            const fonteCss = /\s/.test(fonteLimpa) ? `'${fonteLimpa}'` : fonteLimpa;
            const tamRaw = String(this.#tamanhoFontePadrao || '12').trim();
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

        obterAncestralBlocoLinhaFormatacao(elInicial) {
            let atual = elInicial;
            const doc = (elInicial && elInicial.ownerDocument) ? elInicial.ownerDocument : document;
            while (atual && atual !== doc.body && atual !== doc.documentElement) {
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    const tag = atual.tagName ? atual.tagName.toUpperCase() : '';
                    if (
                        tag === 'DIV' || tag === 'P' || tag === 'LI' || tag === 'TR' ||
                        tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' ||
                        tag === 'H5' || tag === 'H6' || tag === 'BLOCKQUOTE' ||
                        tag === 'SECTION' || tag === 'ARTICLE' || tag === 'PRE'
                    ) {
                        return atual;
                    }
                    if (atual.isConnected && typeof window.getComputedStyle === 'function') {
                        try {
                            const disp = window.getComputedStyle(atual).display;
                            if (disp === 'block' || disp === 'flex' || disp === 'grid' || disp === 'list-item' || disp === 'table-row') {
                                return atual;
                            }
                        } catch (_) { }
                    }
                }
                atual = atual.parentElement;
            }
            return doc.body || elInicial;
        }

        extrairFormatosBasicosDoElementoVivo(elInicial) {
            let b = false, i = false, u = false, s = false, sup = false, sub = false;
            let atual = elInicial;
            const doc = (elInicial && elInicial.ownerDocument) ? elInicial.ownerDocument : document;
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            while (atual && atual !== doc.body && atual !== doc.documentElement) {
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    const tag = atual.tagName ? atual.tagName.toUpperCase() : '';
                    const st = (atual.getAttribute && atual.getAttribute('style') ? atual.getAttribute('style') : '').toLowerCase();

                    if (
                        tag === 'B' || tag === 'STRONG' ||
                        tag === 'H1' || tag === 'H2' || tag === 'H3' ||
                        tag === 'H4' || tag === 'H5' || tag === 'H6' || tag === 'TH' ||
                        (rx.ESTILO_NEGRITO_CSS && rx.ESTILO_NEGRITO_CSS.test(st))
                    ) {
                        b = true;
                    }
                    if (
                        tag === 'I' || tag === 'EM' || tag === 'DFN' || tag === 'CITE' || tag === 'VAR' ||
                        (rx.ESTILO_ITALICO_CSS && rx.ESTILO_ITALICO_CSS.test(st))
                    ) {
                        i = true;
                    }
                    if (tag === 'U' || tag === 'INS' || (rx.ESTILO_SUBLINHADO_CSS && rx.ESTILO_SUBLINHADO_CSS.test(st))) {
                        u = true;
                    }
                    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || st.indexOf('line-through') !== -1) {
                        s = true;
                    }
                    if (tag === 'SUP' || st.indexOf('vertical-align:super') !== -1 || st.indexOf('vertical-align: super') !== -1) {
                        sup = true;
                    }
                    if (tag === 'SUB' || st.indexOf('vertical-align:sub') !== -1 || st.indexOf('vertical-align: sub') !== -1) {
                        sub = true;
                    }

                    if (atual.isConnected && typeof window.getComputedStyle === 'function') {
                        try {
                            const comp = window.getComputedStyle(atual);
                            if (comp) {
                                const peso = parseInt(comp.fontWeight, 10) ||
                                    (comp.fontWeight === 'bold' || comp.fontWeight === 'bolder' ? 700 : 400);
                                if (peso >= 600) b = true;
                                if (comp.fontStyle === 'italic' || comp.fontStyle === 'oblique') i = true;
                                const dec = (comp.textDecorationLine || comp.textDecoration || '').toLowerCase();
                                if (dec.indexOf('underline') !== -1) u = true;
                                if (dec.indexOf('line-through') !== -1) s = true;
                            }
                        } catch (_) { }
                    }
                }
                atual = atual.parentElement;
            }
            return { b, i, u, s, sup, sub };
        }

        construirHtmlFormatacaoBasica(rangeDOM) {
            if (!rangeDOM) return '';
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            try {
                const raiz = rangeDOM.commonAncestorContainer;
                if (!raiz) return '';

                const linhasSegmentos = [[]];
                let ultimoBlocoLinha = null;
                let quebraLinhaPendente = false;

                const adicionarTrechoTexto = (noTexto, textoTrecho) => {
                    if (!textoTrecho) return;
                    const rxZero = rx.INVISIVEIS_ZERO_WIDTH || /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;
                    const rxNBSP = rx.ESPACO_NAO_QUEBRAVEL || /\u00A0/g;
                    const limpo = textoTrecho
                        .replace(rxZero, '')
                        .replace(rxNBSP, ' ');
                    if (!limpo) return;

                    if (limpo.trim().length === 0 && (limpo.indexOf('\n') !== -1 || limpo.indexOf('\r') !== -1)) {
                        return;
                    }

                    const elPai = noTexto.parentElement;
                    if (elPai) {
                        const tagPai = elPai.tagName ? elPai.tagName.toUpperCase() : '';
                        if (tagPai === 'SCRIPT' || tagPai === 'STYLE' || tagPai === 'NOSCRIPT' || tagPai === 'TEMPLATE') {
                            return;
                        }
                    }

                    const blocoAtual = this.obterAncestralBlocoLinhaFormatacao(elPai);
                    if (ultimoBlocoLinha !== null && blocoAtual !== ultimoBlocoLinha) {
                        quebraLinhaPendente = true;
                    }
                    if (quebraLinhaPendente) {
                        if (linhasSegmentos[linhasSegmentos.length - 1].length > 0) {
                            linhasSegmentos.push([]);
                        }
                        quebraLinhaPendente = false;
                    }
                    if (limpo.trim().length > 0) {
                        ultimoBlocoLinha = blocoAtual;
                    }

                    const rxQuebras = rx.QUEBRAS_E_TABS || /[\r\n\t]+/g;
                    const rxEspacos = rx.ESPACOS_MULTIPLOS || /[ ]{2,}/g;
                    const textoNormalizado = limpo
                        .replace(rxQuebras, ' ')
                        .replace(rxEspacos, ' ');
                    if (!textoNormalizado) return;

                    const fmt = this.extrairFormatosBasicosDoElementoVivo(elPai);
                    const linhaAtual = linhasSegmentos[linhasSegmentos.length - 1];
                    const ultimoSeg = linhaAtual.length > 0 ? linhaAtual[linhaAtual.length - 1] : null;

                    if (
                        ultimoSeg &&
                        ultimoSeg.b === fmt.b &&
                        ultimoSeg.i === fmt.i &&
                        ultimoSeg.u === fmt.u &&
                        ultimoSeg.s === fmt.s &&
                        ultimoSeg.sup === fmt.sup &&
                        ultimoSeg.sub === fmt.sub
                    ) {
                        ultimoSeg.texto += textoNormalizado;
                    } else {
                        linhaAtual.push({
                            texto: textoNormalizado,
                            b: fmt.b,
                            i: fmt.i,
                            u: fmt.u,
                            s: fmt.s,
                            sup: fmt.sup,
                            sub: fmt.sub
                        });
                    }
                };

                if (raiz.nodeType === Node.TEXT_NODE) {
                    const ini = rangeDOM.startOffset;
                    const fim = rangeDOM.endOffset;
                    const val = (raiz.nodeValue || '').substring(ini, fim);
                    adicionarTrechoTexto(raiz, val);
                } else {
                    const walker = document.createTreeWalker(
                        raiz,
                        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                        null
                    );
                    let noAtual = walker.nextNode();
                    while (noAtual) {
                        let intersecta = true;
                        if (typeof rangeDOM.intersectsNode === 'function') {
                            try { intersecta = rangeDOM.intersectsNode(noAtual); } catch (_) { intersecta = true; }
                        }
                        if (intersecta) {
                            if (noAtual.nodeType === Node.ELEMENT_NODE) {
                                const tName = noAtual.tagName ? noAtual.tagName.toUpperCase() : '';
                                if (tName === 'BR') {
                                    quebraLinhaPendente = true;
                                }
                            } else if (noAtual.nodeType === Node.TEXT_NODE) {
                                const valBruto = noAtual.nodeValue || '';
                                const ini = (noAtual === rangeDOM.startContainer) ? rangeDOM.startOffset : 0;
                                const fim = (noAtual === rangeDOM.endContainer) ? rangeDOM.endOffset : valBruto.length;
                                if (fim > ini) {
                                    adicionarTrechoTexto(noAtual, valBruto.substring(ini, fim));
                                }
                            }
                        }
                        noAtual = walker.nextNode();
                    }
                }

                const linhasHtml = [];
                for (let l = 0; l < linhasSegmentos.length; l++) {
                    const segs = linhasSegmentos[l];
                    if (!segs || segs.length === 0) continue;

                    segs[0].texto = segs[0].texto.replace(/^\s+/, '');
                    segs[segs.length - 1].texto = segs[segs.length - 1].texto.replace(/\s+$/, '');

                    let htmlLinha = '';
                    for (let sIdx = 0; sIdx < segs.length; sIdx++) {
                        const seg = segs[sIdx];
                        if (!seg.texto) continue;
                        let trechoHtml = this.escaparTextoHtmlBasico(seg.texto);
                        if (seg.sub) trechoHtml = `<sub>${trechoHtml}</sub>`;
                        if (seg.sup) trechoHtml = `<sup>${trechoHtml}</sup>`;
                        if (seg.s) trechoHtml = `<s>${trechoHtml}</s>`;
                        if (seg.u) trechoHtml = `<u>${trechoHtml}</u>`;
                        if (seg.i) trechoHtml = `<i>${trechoHtml}</i>`;
                        if (seg.b) trechoHtml = `<b>${trechoHtml}</b>`;
                        htmlLinha += trechoHtml;
                    }
                    const rxEsp = rx.ESPACOS_MULTIPLOS || /[ ]{2,}/g;
                    htmlLinha = htmlLinha.replace(rxEsp, ' ').trim();
                    if (htmlLinha) {
                        linhasHtml.push(htmlLinha);
                    }
                }

                return linhasHtml.join('<br>');
            } catch (err) {
                console.error('Erro ao construir HTML de formatação básica:', err);
                return '';
            }
        }

        #devePreservarQuebrasDoElemento(el) {
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

        #parsearHtmlParaDivIsolado(origemHtml) {
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
                    container = this.#parsearHtmlParaDivIsolado(origem);
                } else {
                    container = document.createElement('div');
                    if (origem instanceof Range) {
                        const anc = origem.commonAncestorContainer || origem.startContainer;
                        const ancEl = anc && anc.nodeType === Node.TEXT_NODE ? anc.parentElement : anc;
                        preservarQuebrasNaOrigem = this.#devePreservarQuebrasDoElemento(ancEl);
                        const frag = origem.cloneContents();
                        if (frag) container.appendChild(frag);
                    } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                        preservarQuebrasNaOrigem = this.#devePreservarQuebrasDoElemento(origem);
                        container.appendChild(origem.cloneNode(true));
                    } else {
                        return this.#filtrosTexto.higienizarTextoParaCopia(String(origem || ''));
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

                return this.#filtrosTexto.higienizarTextoParaCopia(texto);
            } catch (err) {
                console.error('Erro em extrairTextoPuroSanitizado:', err);
                return typeof origem === 'string'
                    ? this.#filtrosTexto.higienizarTextoParaCopia(origem.replace(/<[^>]+>/g, ''))
                    : '';
            }
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
                container = this.#parsearHtmlParaDivIsolado(origem);
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

        #normalizarTagsAlinhamento(container) {
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
                this.#normalizarTagsAlinhamento(container);

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
                this.#normalizarTagsAlinhamento(container);

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
                this.#normalizarTagsAlinhamento(container);

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
            return this.#padraoFonteAtivo ? this.#aplicarPadraoFonteNoHtml(htmlResultado) : htmlResultado;
        }

        envolverHtmlComResetDeCursorParaWord(codigoHTML) {
            if (!codigoHTML) return '';
            return String(codigoHTML).trim();
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

    Object.freeze(FiltrosHtmlProgressivos.prototype);
    window.JusGovFiltrosHtmlProgressivos = Object.freeze(FiltrosHtmlProgressivos);
})();
