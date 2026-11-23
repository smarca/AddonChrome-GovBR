/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-filtros-html-basico.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Extração de Formatação Básica de DOM Vivo
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-filtros-html-basico.js
 * - Classe Exportada: CopiaFiltrosHtmlBasico (self.JusGovCopiaFiltrosHtmlBasico) extends BaseModulo
 * - Métodos Públicos: obterAncestralBlocoLinhaFormatacao, extrairFormatosBasicosDoElementoVivo, construirHtmlFormatacaoBasica, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaFiltrosHtmlBasico = fabrica(raiz);
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

    class CopiaFiltrosHtmlBasico extends Base {
        constructor() {
            super('CopiaFiltrosHtmlBasico');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaFiltrosHtmlBasico.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaFiltrosHtmlBasico.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
    }

    Object.freeze(CopiaFiltrosHtmlBasico.prototype);
    return Object.freeze(CopiaFiltrosHtmlBasico);
}));