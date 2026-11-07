/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-filtros.js
 * CLASSE: FiltrosHtml
 * 
 * FINALIDADE:
 * Implementação da Arquitetura Progressiva de Filtros HTML em 5 Níveis Estritos,
 * higienização de lixo em PDFs, supressão de linhas em branco e normalização
 * semântica para cópia rica e texto puro na Área de Transferência.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Filtro 0 (Texto Puro Sanitizado): Extrai texto puro via textContent eliminando tags,
 *    scripts, iframes e estilos, convertendo entidades e sanitizando quebras de linha.
 * 2. Filtro 1 (Básico - Inline): Preserva estritamente formatação de caracteres (b, i, u, s,
 *    sub, sup, mark e br) sem fontes, cores arbitrárias ou classes que sujam o Word/PJe.
 * 3. Filtro 2 (Intermediário - Parágrafos): Nível 1 + p, blockquote, ul, ol, li, hr com
 *    alinhamento e recuo simples.
 * 4. Filtro 3 (Avançado - Documental RTF): Nível 2 + tabelas (table, tr, td, th), cabeçalhos
 *    (h1-h6) e blocos pre/code com bordas e larguras controladas.
 * 5. Filtro 4 (Estendido - Office/Canvas): Nível 3 + imagens seguras (http/https/data:image)
 *    e mesclagem de células (colspan/rowspan).
 * 6. Sanitize CSS Permanente: Descarta font-family, font-size, background e propriedades mso-*
 *    para herdar a tipografia e paleta nativas do editor de destino.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.13: Filtros HTML em 5 Níveis)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 5: Filtragem Progressiva)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFiltrosHtml) {
        return;
    }

    class FiltrosHtml {
        constructor() {
            this.converterCabecalhoPjeAtivo = true;
        }

        /**
         * FILTRO 1: Higienização de lixo de PDF, zero-width e caracteres de controle.
         * Remove caracteres invisíveis que quebram parsers e colagens no PJe e Word.
         */
        aplicarFiltro1DadosLixo(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rxLixo = (cExt.EXPRESSOES_REGULARES && cExt.EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF)
                ? cExt.EXPRESSOES_REGULARES.CARACTERES_LIXO_PDF
                : /[\u200B-\u200D\uFEFF\u2060\u00AD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
            return textoBruto
                .replace(rxLixo, '')
                .replace(/\u00A0/g, ' ')
                .replace(/&nbsp;/gi, ' ');
        }

        /**
         * DIRETRIZ SEÇÃO 6.3: Supressão de quebras de linha em linha única com espaçamento obrigatório anti-truncamento.
         * Garante que a unificação de quebras (\r\n, \r, \n, <br>) sempre insira espaço simples entre blocos,
         * impedindo que o final de uma linha funda com o início da próxima (ex.: "FEDERAL" + "CÍVEL" -> "FEDERAL CÍVEL").
         */
        unificarLinhasComEspacamentoAntiTruncamento(texto) {
            if (!texto || typeof texto !== 'string') return '';
            return texto
                .replace(/[\r\n\t\f\v]+/g, ' ')
                .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/gu, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        /**
         * FILTRO 3: Normalização de linhas, trim e conversão de cabeçalhos PJe em linha única.
         * Suprime linhas em branco excessivas e padroniza cabeçalhos do PJe ("id 123456, pg. 1").
         */
        aplicarFiltro3InformacoesELinhas(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            const normalizado = textoBruto
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n');

            const linhasBrutas = normalizado.split('\n');
            const linhasUteis = [];

            for (let i = 0; i < linhasBrutas.length; i++) {
                let linha = linhasBrutas[i]
                    .replace(/^[ \t]+|[ \t]+$/g, '')
                    .replace(/[ \t]{2,}/g, ' ');

                if (linha.length > 0) {
                    linhasUteis.push(linha);
                }
            }

            let resultado = linhasUteis.join('\n');

            if (linhasUteis.length === 1) {
                if (this.converterCabecalhoPjeAtivo && rx.CABECALHO_ID_PJE) {
                    const matchCabecalhoPje = resultado.match(rx.CABECALHO_ID_PJE);
                    if (matchCabecalhoPje) {
                        const idDoc = matchCabecalhoPje[1];
                        const pgDoc = matchCabecalhoPje[2];
                        return pgDoc ? `id ${idDoc}, pg. ${pgDoc}` : `id ${idDoc}`;
                    }
                }

                if (resultado.length > 1 && rx.SUFIXO_FECHAMENTO_PRESERVADO &&
                    !rx.SUFIXO_FECHAMENTO_PRESERVADO.test(resultado) &&
                    typeof rx.PONTUACAO_FINAL_ISOLADA !== 'undefined') {
                    resultado = resultado.replace(rx.PONTUACAO_FINAL_ISOLADA, '');
                }
            }

            return resultado;
        }

        /**
         * Higienização combinada completa para envio ao clipboard.
         */
        higienizarTextoParaCopia(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const f1 = this.aplicarFiltro1DadosLixo(textoBruto);
            return this.aplicarFiltro3InformacoesELinhas(f1);
        }

        /**
         * Escapa entidades básicas HTML (&, <, >) para injeção segura de nós de texto.
         */
        escaparTextoHtmlBasico(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * Localiza o elemento ancestral que define uma quebra de linha visual para formatação.
         */
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

        /**
         * Identifica estilos básicos de formatação aplicados a um elemento no DOM.
         */
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

        /**
         * Constrói HTML preservando exclusivamente os 5 formatos básicos de caractere.
         */
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

        /**
         * Nível 0 da Arquitetura Progressiva de Filtros HTML: Texto Puro Sanitizado.
         */
        extrairTextoPuroSanitizado(origem) {
            if (!origem) return '';
            try {
                const container = document.createElement('div');
                if (typeof origem === 'string') {
                    container.innerHTML = origem;
                } else if (origem instanceof Range) {
                    const frag = origem.cloneContents();
                    if (frag) container.appendChild(frag);
                } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                    container.appendChild(origem.cloneNode(true));
                } else {
                    return this.aplicarFiltro3InformacoesELinhas(this.aplicarFiltro1DadosLixo(String(origem || '')));
                }

                const nosPerigosos = container.querySelectorAll(
                    'script, style, iframe, object, embed, applet, noscript, template, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden'
                );
                for (let i = 0; i < nosPerigosos.length; i++) {
                    nosPerigosos[i].remove();
                }

                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
                let noTexto;
                while ((noTexto = walker.nextNode())) {
                    const pai = noTexto.parentElement;
                    const tagPai = pai ? pai.tagName : '';
                    if (tagPai !== 'PRE' && tagPai !== 'TEXTAREA') {
                        if (noTexto.nodeValue) {
                            noTexto.nodeValue = noTexto.nodeValue.replace(/[\r\n\t]+/g, ' ');
                        }
                    }
                }

                const quebras = container.querySelectorAll('br, hr');
                for (let i = 0; i < quebras.length; i++) {
                    quebras[i].replaceWith(document.createTextNode('\n'));
                }
                const celulas = container.querySelectorAll('td, th');
                for (let i = 0; i < celulas.length; i++) {
                    celulas[i].appendChild(document.createTextNode('\t'));
                }
                const blocos = container.querySelectorAll('p, div, tr, li, h1, h2, h3, h4, h5, h6, blockquote, pre, header, footer, section, article');
                for (let i = 0; i < blocos.length; i++) {
                    blocos[i].appendChild(document.createTextNode('\n'));
                }

                let texto = container.textContent || '';
                texto = texto
                    .replace(/&amp;/gi, '&')
                    .replace(/&lt;/gi, '<')
                    .replace(/&gt;/gi, '>')
                    .replace(/&quot;/gi, '"')
                    .replace(/&#39;/g, "'");

                texto = this.aplicarFiltro1DadosLixo(texto);
                texto = this.aplicarFiltro3InformacoesELinhas(texto);
                return texto;
            } catch (err) {
                console.error('Erro em extrairTextoPuroSanitizado:', err);
                return typeof origem === 'string' ? this.aplicarFiltro3InformacoesELinhas(this.aplicarFiltro1DadosLixo(origem.replace(/<[^>]+>/g, ''))) : '';
            }
        }

        /**
         * Remove comentários proprietários XML/MSO e propriedades mso-* do Word.
         */
        limparPropriedadesWordEMso(htmlBruto) {
            if (!htmlBruto || typeof htmlBruto !== 'string') return '';
            return htmlBruto
                .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
                .replace(/<\/?(?:o|v|w|m|x):[^>]*>/gi, '')
                .replace(/\s*mso-[a-zA-Z0-9\-]+:[^;"]+;?/gi, '')
                .replace(/style="\s*"/gi, '');
        }

        /**
         * Sanitiza estilos inline CSS garantindo remoção de famílias e tamanhos tipográficos.
         */
        sanitizarEstilosCssSempreSemFonte(styleStr, nivel = 3) {
            if (!styleStr || typeof styleStr !== 'string') return '';
            const regras = styleStr.split(';');
            const permitidas = [];
            const nivelNum = (typeof nivel === 'number') ? nivel : this.converterNivelFiltroParaIndice(nivel);

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
                    } else if ((prop === 'margin-left' || prop === 'text-indent') && /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i.test(val)) {
                        permitidas.push(`${prop}: ${val.toLowerCase()}`);
                    }
                }

                if (nivelNum >= 3) {
                    if (prop === 'border' || prop === 'border-collapse' || prop.startsWith('border-')) {
                        permitidas.push(`${prop}: ${val}`);
                    } else if (prop === 'padding' || prop.startsWith('padding-')) {
                        permitidas.push(`${prop}: ${val}`);
                    } else if (prop === 'width' || prop === 'min-width' || prop === 'max-width') {
                        permitidas.push(`${prop}: ${val}`);
                    }
                }

                if (nivelNum >= 4) {
                    if (prop === 'page-break-before' || prop === 'page-break-after' || prop === 'page-break-inside') {
                        permitidas.push(`${prop}: ${val.toLowerCase()}`);
                    } else if (prop === 'margin-top' || prop === 'margin-bottom' || prop === 'margin-right' || prop === 'clear' || prop === 'float') {
                        permitidas.push(`${prop}: ${val}`);
                    }
                }
            }
            return permitidas.join('; ');
        }

        /**
         * Camada base de higienização universal prévia para os níveis 1 a 4.
         */
        preSanitizarDomBase(origem) {
            if (!origem) return document.createElement('div');
            const container = document.createElement('div');
            if (typeof origem === 'string') {
                container.innerHTML = origem;
            } else if (origem instanceof Range) {
                const frag = origem.cloneContents();
                if (frag) container.appendChild(frag);
            } else if (origem && origem.nodeType === Node.ELEMENT_NODE) {
                container.appendChild(origem.cloneNode(true));
            } else {
                return container;
            }

            const nosPerigosos = container.querySelectorAll(
                'script, style, iframe, object, embed, applet, noscript, template, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden'
            );
            for (let i = 0; i < nosPerigosos.length; i++) {
                nosPerigosos[i].remove();
            }

            const links = container.querySelectorAll('a');
            for (let i = 0; i < links.length; i++) {
                const a = links[i];
                if (!a.parentNode) continue;
                while (a.firstChild) {
                    a.parentNode.insertBefore(a.firstChild, a);
                }
                a.remove();
            }

            const interativos = container.querySelectorAll(
                'button, select, textarea, form, nav, header, footer, aside, section, article, figure, figcaption'
            );
            for (let i = 0; i < interativos.length; i++) {
                const el = interativos[i];
                if (!el.parentNode) continue;
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.remove();
            }
            const inputs = container.querySelectorAll('input');
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].remove();
            }

            const todosElementos = container.querySelectorAll('*');
            for (let i = 0; i < todosElementos.length; i++) {
                const el = todosElementos[i];
                if (!el.parentNode) continue;
                const attrs = Array.from(el.attributes);
                for (let a = 0; a < attrs.length; a++) {
                    const attrNome = attrs[a].name.toLowerCase();
                    if (
                        attrNome.startsWith('on') ||
                        attrNome === 'class' ||
                        attrNome === 'id' ||
                        attrNome.startsWith('data-') ||
                        attrNome.startsWith('aria-') ||
                        attrNome === 'action' ||
                        attrNome === 'formaction' ||
                        attrNome === 'href' ||
                        attrNome === 'target'
                    ) {
                        el.removeAttribute(attrs[a].name);
                    }
                }
            }

            return container;
        }

        /**
         * Nível 1: Básico (Inline de Caracteres).
         */
        construirHtmlNivel1Basico(origem) {
            if (!origem) return '';
            try {
                if (origem instanceof Range) {
                    return this.construirHtmlFormatacaoBasica(origem);
                }
                const container = this.preSanitizarDomBase(origem);
                const tagsPermitidas1 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR'
                ]);

                const imgs = container.querySelectorAll('img');
                for (let i = 0; i < imgs.length; i++) imgs[i].remove();

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas1.has(tag)) {
                        const ehBloco = /^(?:P|DIV|TR|LI|H[1-6]|BLOCKQUOTE|PRE)$/.test(tag);
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        if (ehBloco) {
                            el.parentNode.insertBefore(document.createElement('br'), el);
                        }
                        el.remove();
                        continue;
                    }

                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 1);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                const spans = container.querySelectorAll('span');
                for (let i = 0; i < spans.length; i++) {
                    const sp = spans[i];
                    if (!sp.parentNode) continue;
                    if (!sp.attributes.length) {
                        while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
                        sp.remove();
                    }
                }

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel1Basico:', err);
                return '';
            }
        }

        /**
         * Nível 2: Intermediário (Parágrafos e Listas).
         */
        construirHtmlNivel2Intermediario(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                const tagsPermitidas2 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                    'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR'
                ]);

                const imgs = container.querySelectorAll('img');
                for (let i = 0; i < imgs.length; i++) imgs[i].remove();

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas2.has(tag)) {
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        if (tag === 'TR') {
                            el.parentNode.insertBefore(document.createElement('br'), el);
                        }
                        el.remove();
                        continue;
                    }

                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 2);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel2Intermediario:', err);
                return '';
            }
        }

        /**
         * Nível 3: Avançado (Documental RTF com Tabelas).
         */
        construirHtmlNivel3Avancado(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                const tagsPermitidas3 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                    'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR',
                    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'CODE',
                    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD'
                ]);

                const imgs = container.querySelectorAll('img');
                for (let i = 0; i < imgs.length; i++) imgs[i].remove();

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas3.has(tag)) {
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        el.remove();
                        continue;
                    }

                    if (tag === 'TD' || tag === 'TH') {
                        el.removeAttribute('colspan');
                        el.removeAttribute('rowspan');
                    }

                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 3);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel3Avancado:', err);
                return '';
            }
        }

        /**
         * Nível 4: Estendido (Suítes Office / Canvas / Imagens).
         */
        construirHtmlNivel4Estendido(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);
                const tagsPermitidas4 = new Set([
                    'B', 'STRONG', 'I', 'EM', 'U', 'INS', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'BR',
                    'P', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR',
                    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'CODE',
                    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
                    'IMG', 'DIV'
                ]);

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas4.has(tag)) {
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        el.remove();
                        continue;
                    }

                    if (tag === 'TD' || tag === 'TH') {
                        const cSpan = el.getAttribute('colspan');
                        const rSpan = el.getAttribute('rowspan');
                        if (cSpan && parseInt(cSpan, 10) > 1) {
                            el.setAttribute('colspan', String(parseInt(cSpan, 10)));
                        } else {
                            el.removeAttribute('colspan');
                        }
                        if (rSpan && parseInt(rSpan, 10) > 1) {
                            el.setAttribute('rowspan', String(parseInt(rSpan, 10)));
                        } else {
                            el.removeAttribute('rowspan');
                        }
                    }

                    if (tag === 'IMG') {
                        const src = el.getAttribute('src') || '';
                        if (!/^(?:https?:|data:image\/)/i.test(src.trim())) {
                            el.remove();
                            continue;
                        }
                    }

                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 4);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
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
            if (nivelNorm === 'texto_puro') {
                return this.extrairTextoPuroSanitizado(origem);
            } else if (nivelNorm === 'basico') {
                return this.construirHtmlNivel1Basico(origem);
            } else if (nivelNorm === 'intermediario') {
                return this.construirHtmlNivel2Intermediario(origem);
            } else if (nivelNorm === 'avancado') {
                return this.construirHtmlNivel3Avancado(origem);
            } else if (nivelNorm === 'estendido') {
                return this.construirHtmlNivel4Estendido(origem);
            }
            return this.construirHtmlNivel1Basico(origem);
        }

        envolverHtmlComResetDeCursorParaWord(codigoHTML) {
            if (!codigoHTML) return '';
            const spanResetLimpo = '<span style="font-weight:normal;font-style:normal;text-decoration:none;background-color:transparent;mso-highlight:none;">&#8203;</span>';
            return `${spanResetLimpo}${codigoHTML}${spanResetLimpo}`;
        }
    }

    window.JusGovFiltrosHtml = FiltrosHtml;
})();
