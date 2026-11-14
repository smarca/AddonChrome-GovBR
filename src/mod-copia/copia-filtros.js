/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-filtros.js
 * CLASSE: FiltrosHtml
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-filtros.js
 * - Classe Exportada: FiltrosHtml (window.JusGovFiltrosHtml)
 * - Métodos Públicos: aplicarFiltro1DadosLixo(t), unificarLinhasComEspacamentoAntiTruncamento(t), aplicarFiltro3InformacoesELinhas(t), higienizarTextoParaCopia(t), extrairTextoPuroSanitizado(origem), aplicarFiltroHtmlPorNivel(origem, nivel), envolverHtmlComResetDeCursorParaWord(html)
 * - Dependências Injetadas: window.JusGovConstantes (EXPRESSOES_REGULARES)
 * - Regras / Seções: Regra 2.13 (Filtros HTML 5 Níveis), Seção 6.3 (anti-truncamento), Seção 6.64 (blindagem POO)
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
            this.separadorTabela = ';';
        }

        /**
         * Define o caractere ou sequência delimitadora para colunas de tabela na extração em texto puro.
         */
        definirSeparadorTabela(sep) {
            if (typeof sep === 'string' && sep.trim().length > 0) {
                this.separadorTabela = sep;
            }
        }

        /**
         * Recupera o separador de colunas para tabelas unificado com o Modo Acumulador.
         */
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

                if (resultado.length > 1 &&
                    (!rx.SUFIXO_FECHAMENTO_PRESERVADO || !rx.SUFIXO_FECHAMENTO_PRESERVADO.test(resultado))) {
                    const rxPontuacao = (rx && rx.PONTUACAO_FINAL_ISOLADA) || /[.,;:!?]+$/;
                    resultado = resultado.replace(rxPontuacao, '');
                }
            }

            return resultado.replace(/[ ]{2,}/g, ' ').trim();
        }

        /**
         * Higienização combinada completa para envio ao clipboard.
         */
        higienizarTextoParaCopia(textoBruto) {
            if (!textoBruto || typeof textoBruto !== 'string') return '';
            const f1 = this.aplicarFiltro1DadosLixo(textoBruto);
            const f3 = this.aplicarFiltro3InformacoesELinhas(f1);
            return f3.replace(/[ ]{2,}/g, ' ').trim();
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
                    'script, style, iframe, object, embed, applet, noscript, template, meta, link, base, svg, canvas, audio, video, source, track, [data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden, .label-copy, [class*="label-copy"], .icone-copy, [class*="icone-copy"], .hidden'
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

                /* DIRETRIZ SEÇÃO 6.84 (BUG-33): Quebras de linha e tabelas no modo texto puro.
                 * - Dentro de células (td, th): quebras manuais <br> e blocos internos (<p>, <div>, etc.)
                 *   NÃO pulam linha; mantêm-se na mesma linha com espaçamento simples (' ').
                 * - Ao pular de linha na tabela (<tr>), insere-se quebra de linha ('\n').
                 * - As colunas da tabela são separadas pelo mesmo separador configurado para o Modo Acumulador (separadorAcumulador, padrão ';'). */
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

                /* Tratamento de múltiplos SPANs:
                 * Quando há múltiplos spans (irmãos inline no mesmo pai que não são blocos de coluna col-),
                 * na cópia modo texto não deve haver quebra entre os conteúdos.
                 * O correto é copiar o trim de ambos sem quebra no meio, inserindo um espaço em branco no meio. */
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

                /* DIRETRIZ: Manter a mesma linha (separada por espaços) se for texto de LINK, múltiplos spans,
                 * ou elementos internos de células de tabela (td, th).
                 * Os demais elementos de bloco fora de link e fora de tabelas quebram a linha adequadamente com \n. */
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

                texto = this.aplicarFiltro1DadosLixo(texto);
                texto = this.aplicarFiltro3InformacoesELinhas(texto);
                /* Filtro final: além do trim existente, retirada obrigatória de espaçamentos duplos */
                texto = texto.replace(/[ ]{2,}/g, ' ').trim();
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
         * Poda recursivamente tags vazias sem conteúdo visual nem quebras relevantes (<br>, <hr>).
         */
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

        /**
         * Sanitiza estilos inline CSS garantindo remoção de famílias e tamanhos tipográficos.
         */
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

                // Proibições universais tipográficas e de fundo
                if (prop === 'font-family' || prop === 'font' || prop === 'font-size' ||
                    prop === 'background' || prop === 'background-color' || prop.startsWith('mso-')) {
                    continue;
                }

                // Filtro especial obrigatório para DIV no Nível 3+
                if (tagUpper === 'DIV') {
                    if (prop === 'position' && val.toLowerCase() !== 'relative') {
                        continue; // Permite apenas position: relative; filtra fixed, absolute, etc.
                    }
                    if (prop === 'z-index') {
                        const zNum = parseInt(val, 10);
                        if (!isNaN(zNum) && zNum < 0) continue; // Filtra z-index negativo
                    }
                    if (prop === 'display' && /^(none|grid|inline-grid|flex|inline-flex)$/i.test(val)) {
                        continue; // Filtra display: none, grid, flex
                    }
                    if (prop === 'transform' || prop.startsWith('transform')) {
                        continue; // Filtra transform
                    }
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
                        if (!isNaN(zNum) && zNum >= 0) {
                            permitidas.push(`z-index: ${zNum}`);
                        }
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

        /**
         * Camada base de higienização universal prévia para os níveis 1 a 4.
         * Destrói executáveis e scripts, filtra formulários e mídias preservando texto exibível,
         * e remove atributos perigosos (src=, action=, on*, etc.).
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

            // 1. Destruição Imediata de Tags Executáveis / Perigosas / Metadados:
            const nosPerigosos = container.querySelectorAll(
                'script, noscript, template, object, embed, iframe, applet, include, import, link, meta, base, style, ' +
                '[data-jusgov-ignore], [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text, .d-none, .ui-helper-hidden, .label-copy, [class*="label-copy"], .icone-copy, [class*="icone-copy"], .hidden'
            );
            for (let i = 0; i < nosPerigosos.length; i++) {
                nosPerigosos[i].remove();
            }

            // 2. Mídia e Gráficos: <canvas>, <video>, <audio>, <picture>, <img>, <svg>, <source>, <track>, <map>, <area>
            // Preserva apenas texto visível interno (ou alt/title como texto puro):
            const midias = container.querySelectorAll('canvas, video, audio, picture, img, svg, source, track, map, area');
            for (let i = 0; i < midias.length; i++) {
                const m = midias[i];
                if (!m.parentNode) continue;
                const temFilhosComTexto = Array.from(m.childNodes).some(c => (c.textContent || '').trim().length > 0);
                if (temFilhosComTexto) {
                    while (m.firstChild) {
                        m.parentNode.insertBefore(m.firstChild, m);
                    }
                } else {
                    const altTexto = (m.getAttribute('alt') || m.getAttribute('title') || '').trim();
                    if (altTexto) {
                        m.parentNode.insertBefore(document.createTextNode(`[${altTexto}]`), m);
                    }
                }
                m.remove();
            }

            // 3. Form Content (Contêineres e Controles de Formulário):
            // <form>, <input>, <button>, <select>, <textarea>, <fieldset>, <legend>, <datalist>, <output>, <optgroup>, <option>
            // Filtrados preservando apenas seus textos exibíveis:
            const controlesForm = container.querySelectorAll('form, button, select, textarea, fieldset, legend, datalist, output, optgroup, option');
            for (let i = 0; i < controlesForm.length; i++) {
                const c = controlesForm[i];
                if (!c.parentNode) continue;
                while (c.firstChild) {
                    c.parentNode.insertBefore(c.firstChild, c);
                }
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

            // 4. Desenrolar links (a) para mesclagem limpa
            const links = container.querySelectorAll('a');
            for (let i = 0; i < links.length; i++) {
                const a = links[i];
                if (!a.parentNode) continue;
                while (a.firstChild) {
                    a.parentNode.insertBefore(a.firstChild, a);
                }
                a.remove();
            }

            // 5. Sanitização Universal de Atributos Perigosos em TODOS os Elementos:
            // Remoção compulsória de src, srcset, action, formaction, data, poster, on*, class, id, aria-*, data-*, href perigoso.
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
                        attrNome === 'src' ||
                        attrNome === 'srcset' ||
                        attrNome === 'action' ||
                        attrNome === 'formaction' ||
                        attrNome === 'data' ||
                        attrNome === 'poster' ||
                        attrNome === 'class' ||
                        attrNome === 'id' ||
                        attrNome.startsWith('data-') ||
                        attrNome.startsWith('aria-') ||
                        attrNome === 'href' ||
                        attrNome === 'target' ||
                        attrVal.includes('javascript:') ||
                        attrVal.includes('vbscript:') ||
                        attrVal.includes('data:text/html')
                    ) {
                        el.removeAttribute(attrs[a].name);
                    }
                }
            }

            return container;
        }

        /**
         * Nível 1: Básico (Inline Puro para Mesclagem em Outros Aplicativos).
         * Permite estritamente: <b>, <i>, <u>, <s>, <sup>, <sub>, <br>.
         * Converte semânticos (strong->b, em->i, del/strike->s, ins->u), converte estilos
         * inline correspondentes para tags, transforma blocos em quebras de linha <br>,
         * elimina atributos inline para gerar tags puras e leves sem conflito com o app de destino.
         */
        construirHtmlNivel1Basico(origem) {
            if (!origem) return '';
            try {
                if (origem instanceof Range) {
                    const frag = origem.cloneContents ? origem.cloneContents() : null;
                    if (frag) {
                        const temBloco = Boolean(frag.querySelector('p, div, h1, h2, h3, h4, h5, h6, table, tr, li, blockquote, pre'));
                        if (!temBloco) {
                            return this.construirHtmlFormatacaoBasica(origem);
                        }
                    }
                }

                const container = this.preSanitizarDomBase(origem);

                // Converter tags semânticas para as tags básicas equivalentes
                const strongs = container.querySelectorAll('strong');
                for (let i = 0; i < strongs.length; i++) {
                    const b = document.createElement('b');
                    while (strongs[i].firstChild) b.appendChild(strongs[i].firstChild);
                    strongs[i].parentNode.replaceChild(b, strongs[i]);
                }
                const ems = container.querySelectorAll('em');
                for (let i = 0; i < ems.length; i++) {
                    const it = document.createElement('i');
                    while (ems[i].firstChild) it.appendChild(ems[i].firstChild);
                    ems[i].parentNode.replaceChild(it, ems[i]);
                }
                const dels = container.querySelectorAll('del, strike');
                for (let i = 0; i < dels.length; i++) {
                    const s = document.createElement('s');
                    while (dels[i].firstChild) s.appendChild(dels[i].firstChild);
                    dels[i].parentNode.replaceChild(s, dels[i]);
                }
                const inss = container.querySelectorAll('ins');
                for (let i = 0; i < inss.length; i++) {
                    const u = document.createElement('u');
                    while (inss[i].firstChild) u.appendChild(inss[i].firstChild);
                    inss[i].parentNode.replaceChild(u, inss[i]);
                }

                // Converter elementos com estilos inline de formatação
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
                        if (ehStrike) {
                            const s = document.createElement('s');
                            s.appendChild(wrapper);
                            wrapper = s;
                        }
                        if (ehUnderline) {
                            const u = document.createElement('u');
                            u.appendChild(wrapper);
                            wrapper = u;
                        }
                        if (ehItalic) {
                            const it = document.createElement('i');
                            it.appendChild(wrapper);
                            wrapper = it;
                        }
                        if (ehBold) {
                            const b = document.createElement('b');
                            b.appendChild(wrapper);
                            wrapper = b;
                        }
                        el.appendChild(wrapper);
                    }
                    el.removeAttribute('style');
                }

                // Nível 1: estritamente inline puro. Apenas: B, I, U, S, SUB, SUP, BR
                const tagsPermitidas1 = new Set(['B', 'I', 'U', 'S', 'SUB', 'SUP', 'BR']);

                const elementos = Array.from(container.querySelectorAll('*'));
                for (let i = 0; i < elementos.length; i++) {
                    const el = elementos[i];
                    if (!el.parentNode) continue;
                    const tag = el.tagName ? el.tagName.toUpperCase() : '';

                    if (!tagsPermitidas1.has(tag)) {
                        const ehBloco = /^(?:P|DIV|TR|LI|H[1-6]|BLOCKQUOTE|PRE|HR|TABLE|THEAD|TBODY|TFOOT|TH|TD|DL|DT|DD|SECTION|ARTICLE|HEADER|FOOTER|NAV|ASIDE)$/.test(tag);
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        if (ehBloco) {
                            el.parentNode.insertBefore(document.createElement('br'), el);
                        }
                        el.remove();
                        continue;
                    }

                    // Remove todos os atributos de tags permitidas no Nível 1 (sem style, sem class, tags puras)
                    while (el.attributes.length > 0) {
                        el.removeAttribute(el.attributes[0].name);
                    }
                }

                this.podarTagsVaziasRecursivo(container);

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>').replace(/^(?:<br\s*\/?>\s*)+|(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel1Basico:', err);
                return '';
            }
        }

        /**
         * Nível 2: Intermediário (Inline + Parágrafos + Alinhamento + Semântica + Dados Tabulares).
         * Herda Nível 1 e adiciona <p>, alinhamentos (<center>, <left>, <right>, <justify>),
         * formatações semânticas (strong, em, mark, small, code, q, abbr, cite, span) e
         * tabelas estruturadas (table, thead, tbody, tfoot, tr, th, td).
         * Substitui <div> por <span> com display: block ou <p>.
         */
        construirHtmlNivel2Intermediario(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);

                // Normalização de tags de alinhamento para <p style="text-align: ...;">
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

                // Substituição de <div> por <span> com display: block
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

                // Tags permitidas no Nível 2
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
                        while (el.firstChild) {
                            el.parentNode.insertBefore(el.firstChild, el);
                        }
                        if (ehBloco) {
                            el.parentNode.insertBefore(document.createElement('br'), el);
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
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 2, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel2Intermediario:', err);
                return '';
            }
        }

        /**
         * Nível 3: Avançado (Inline + Block + Tabular + Agrupamento e Fluxo em Bloco).
         * Herda Nível 2 e adiciona <hr>, <ul>, <ol>, <li>, <dt>, <dd>, <dl>, <h1> até <h6>,
         * <div>, <blockquote>, <pre>.
         * Aplica filtro rígido no <div>: apenas position: relative, sem fixed/absolute,
         * sem z-index negativo, sem display: none/grid/flex, sem transform.
         */
        construirHtmlNivel3Avancado(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);

                // Normalização de tags de alinhamento
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

                // Tags permitidas no Nível 3
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
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 3, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);

                let html = this.limparPropriedadesWordEMso(container.innerHTML);
                return html.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trim();
            } catch (err) {
                console.error('Erro em construirHtmlNivel3Avancado:', err);
                return '';
            }
        }

        /**
         * Nível 4: Estendido (Inline + Block + Tabular + Agrupamento + Sectioning Content).
         * Herda Nível 3 e adiciona Sectioning: <nav>, <main>, <article>, <aside>, <footer>.
         * Mídia (<canvas>, <video>, <img>, etc.) e src= permanecem estritamente filtrados.
         */
        construirHtmlNivel4Estendido(origem) {
            if (!origem) return '';
            try {
                const container = this.preSanitizarDomBase(origem);

                // Normalização de tags de alinhamento
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

                // Tags permitidas no Nível 4
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

                    const stBruto = el.getAttribute('style');
                    if (stBruto) {
                        const stLimpo = this.sanitizarEstilosCssSempreSemFonte(stBruto, 4, tag);
                        if (stLimpo) el.setAttribute('style', stLimpo);
                        else el.removeAttribute('style');
                    }
                }

                this.podarTagsVaziasRecursivo(container);

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

        /**
         * Retorna o HTML sanitizado limpo e direto sem tags <style> artificiais nem wrappers envolventes
         * (span ou div forçados com font-family/font-size: !important), garantindo que o texto copiado
         * possa ser colado em qualquer editor ou documento de destino (Word, Google Docs, Teams, CKEditor, etc.)
         * mesclando naturalmente com a formatação e tipografia pré-existente (Seção 6.123 / USAB-20).
         */
        envolverHtmlComResetDeCursorParaWord(codigoHTML) {
            if (!codigoHTML) return '';
            return String(codigoHTML).trim();
        }
    }

    Object.freeze(FiltrosHtml.prototype);
    window.JusGovFiltrosHtml = Object.freeze(FiltrosHtml);
})();
