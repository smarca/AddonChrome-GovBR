/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-geometria.js
 * CLASSE: GeometriaDOM
 * 
 * FINALIDADE:
 * Resolução geométrica do ponto de clique no viewport (`caretRangeFromPoint`),
 * mapeamento linear de blocos ancestrais com janela deslizante O(1) de +-1000 caracteres,
 * segmentação de nós de texto do DOM e conversão bidirecional entre índices textuais e `Range`.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 14 e 15)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 4: Hot-Paths DOM e Geometria)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-003: Bitmask O(1) e ADR-004: Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovGeometriaDOM) {
        return;
    }

    const TAGS_BLOCO_CONTAINER = new Set([
        'P', 'DIV', 'TD', 'TH', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'PRE',
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION', 'HEADER', 'FOOTER', 'DD', 'DT', 'TR',
        'BUTTON', 'SUMMARY', 'LABEL', 'NAV', 'MAIN', 'ASIDE'
    ]);

    const TAGS_SUBBLOCO_QUEBRA = new Set([
        'P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
        'BLOCKQUOTE', 'PRE', 'TR', 'HR', 'SECTION', 'ARTICLE', 'DD', 'DT'
    ]);

    function isQuebraOuEspaco(ch) {
        return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\u00A0';
    }

    class GeometriaDOM {
        /**
         * Localiza o elemento ancestral semântico de bloco que contém o nó clicado.
         */
        obterBlocoAncestralContextual(noAlvo) {
            if (!noAlvo) return document.body;
            let atual = (noAlvo.nodeType === Node.ELEMENT_NODE) ? noAlvo : noAlvo.parentElement;
            const docOwner = (noAlvo.ownerDocument) || document;

            while (atual && atual !== docOwner.body && atual !== docOwner.documentElement) {
                if (TAGS_BLOCO_CONTAINER.has(atual.tagName)) {
                    return atual;
                }
                atual = atual.parentElement;
            }
            return docOwner.body || document.body;
        }

        /**
         * Resolve o ponto de clique no DOM a partir de coordenadas físicas (x, y).
         */
        obterPontoDoClique(x, y, docRef = null) {
            const doc = docRef || document;
            const elSobPonto = (doc && typeof doc.elementFromPoint === 'function')
                ? doc.elementFromPoint(x, y)
                : null;

            let no = null;
            let offset = 0;

            if (doc && typeof doc.caretRangeFromPoint === 'function') {
                const r = doc.caretRangeFromPoint(x, y);
                if (r) {
                    no = r.startContainer;
                    offset = r.startOffset;
                }
            } else if (doc && typeof doc.caretPositionFromPoint === 'function') {
                const pos = doc.caretPositionFromPoint(x, y);
                if (pos) {
                    no = pos.offsetNode;
                    offset = pos.offset;
                }
            }

            if ((!no || no.nodeType !== Node.TEXT_NODE) && elSobPonto) {
                const ptLocalizado = this.localizarPontoTextoDentroDeElemento(elSobPonto, x, y);
                if (ptLocalizado) {
                    return ptLocalizado;
                }
            }

            if (!no && elSobPonto) {
                return { no: elSobPonto, offset: 0 };
            }
            return no ? { no, offset } : null;
        }

        /**
         * Localiza o TextNode exato sob as coordenadas físicas quando caretRangeFromPoint retorna apenas o pai.
         */
        localizarPontoTextoDentroDeElemento(elRaiz, x, y) {
            if (!elRaiz) return null;
            const walker = document.createTreeWalker(elRaiz, NodeFilter.SHOW_TEXT, null);
            let melhorNo = null;
            let melhorOffset = 0;
            let menorDist = Infinity;
            let n;
            let totalTestesRect = 0;
            const LIMITE_TESTES_RECT = 160;
            const r = document.createRange();

            while ((n = walker.nextNode())) {
                const txt = n.nodeValue || '';
                const len = txt.length;
                if (len === 0) continue;

                try {
                    r.selectNodeContents(n);
                    const rectNo = r.getBoundingClientRect();
                    if (!rectNo || (rectNo.width === 0 && rectNo.height === 0)) continue;
                    const dxNo = x < rectNo.left ? (rectNo.left - x) : (x > rectNo.right ? (x - rectNo.right) : 0);
                    const dyNo = y < rectNo.top ? (rectNo.top - y) : (y > rectNo.bottom ? (y - rectNo.bottom) : 0);
                    if ((dxNo + dyNo * 2) > 48 && len > 24) continue;
                } catch (_) { }

                for (let i = 0; i < len; i++) {
                    if (++totalTestesRect > LIMITE_TESTES_RECT) break;
                    try {
                        r.setStart(n, i);
                        r.setEnd(n, i + 1);
                        const rect = r.getBoundingClientRect();
                        if (!rect || (rect.width === 0 && rect.height === 0)) continue;

                        const dx = x < rect.left ? (rect.left - x) : (x > rect.right ? (x - rect.right) : 0);
                        const dy = y < rect.top ? (rect.top - y) : (y > rect.bottom ? (y - rect.bottom) : 0);
                        const dist = dx + dy * 2;
                        if (dist < menorDist) {
                            menorDist = dist;
                            melhorNo = n;
                            melhorOffset = i;
                            if (dx === 0 && dy === 0) {
                                return { no: melhorNo, offset: melhorOffset };
                            }
                        }
                    } catch (_) { }
                }
                if (totalTestesRect > LIMITE_TESTES_RECT) break;
            }

            if (melhorNo && menorDist <= 48) {
                return { no: melhorNo, offset: melhorOffset };
            }
            return null;
        }

        /**
         * Constrói mapa linearizado com janela deslizante O(1) de +-1000 caracteres em torno do ponto.
         */
        construirMapaTextoBlocoComJanela(noAlvo, offsetNoAlvo) {
            const bloco = this.obterBlocoAncestralContextual(noAlvo);
            const segmentos = [];
            let textoCompleto = '';
            let indiceGlobalClique = -1;

            const adicionarSeparadorVirtual = (strSep, elRef) => {
                if (!strSep) return;
                const iniSep = textoCompleto.length;
                textoCompleto += strSep;
                segmentos.push({
                    no: null,
                    ehBr: true,
                    elementoBr: elRef || null,
                    inicioGlobal: iniSep,
                    fimGlobal: iniSep + strSep.length,
                    comprimento: strSep.length
                });
            };

            const walker = document.createTreeWalker(
                bloco,
                NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tag = node.tagName;
                            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') {
                                return NodeFilter.FILTER_REJECT;
                            }
                            if (node.hasAttribute && node.hasAttribute('data-jusgov-ignore')) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            if (tag === 'BR') {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            if (node !== bloco && TAGS_SUBBLOCO_QUEBRA.has(tag)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_SKIP;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let n;
            let ultimoTopSpanPosicionado = null;
            let ultimaAlturaSpanPosicionado = 16;

            while ((n = walker.nextNode())) {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    if (n.tagName === 'BR') {
                        adicionarSeparadorVirtual('\n', n);
                    } else if (n !== bloco && TAGS_SUBBLOCO_QUEBRA.has(n.tagName)) {
                        if (textoCompleto.length > 0 && !textoCompleto.endsWith('\n\n')) {
                            adicionarSeparadorVirtual(textoCompleto.endsWith('\n') ? '\n' : '\n\n', n);
                        }
                    }
                    continue;
                }

                const valor = n.nodeValue || '';
                if (valor.length === 0) continue;

                const elPai = n.parentElement;
                if (elPai && elPai !== bloco && elPai.style && elPai.style.top) {
                    const topAtual = parseFloat(elPai.style.top);
                    const fontAtual = parseFloat(elPai.style.fontSize) || ultimaAlturaSpanPosicionado;
                    if (!Number.isNaN(topAtual)) {
                        if (ultimoTopSpanPosicionado !== null && valor.trim().length > 0) {
                            const deltaTop = Math.abs(topAtual - ultimoTopSpanPosicionado);
                            if (deltaTop > Math.max(24, fontAtual * 1.68)) {
                                if (textoCompleto.length > 0 && !textoCompleto.endsWith('\n\n')) {
                                    adicionarSeparadorVirtual(textoCompleto.endsWith('\n') ? '\n' : '\n\n', elPai);
                                }
                            } else if (deltaTop > 3) {
                                const ultimoCh = textoCompleto.length > 0 ? textoCompleto[textoCompleto.length - 1] : '';
                                if (ultimoCh && !isQuebraOuEspaco(ultimoCh) && !isQuebraOuEspaco(valor[0])) {
                                    adicionarSeparadorVirtual(' ', elPai);
                                }
                            }
                        }
                        if (valor.trim().length > 0) {
                            ultimoTopSpanPosicionado = topAtual;
                            ultimaAlturaSpanPosicionado = fontAtual;
                        }
                    }
                }

                const inicioGlobal = textoCompleto.length;
                const fimGlobal = inicioGlobal + valor.length;
                textoCompleto += valor;

                segmentos.push({
                    no: n,
                    ehBr: false,
                    inicioGlobal,
                    fimGlobal,
                    comprimento: valor.length
                });

                if (n === noAlvo && indiceGlobalClique === -1) {
                    const offClamped = Math.max(0, Math.min(valor.length, offsetNoAlvo));
                    indiceGlobalClique = inicioGlobal + offClamped;
                }
            }

            if (indiceGlobalClique === -1) {
                if (noAlvo && noAlvo.nodeType === Node.ELEMENT_NODE) {
                    for (let i = 0; i < segmentos.length; i++) {
                        const s = segmentos[i];
                        if (s.no && s.no.parentElement === noAlvo) {
                            indiceGlobalClique = s.inicioGlobal;
                            break;
                        }
                    }
                }
                if (indiceGlobalClique === -1) {
                    indiceGlobalClique = 0;
                }
            }

            const limiteTotal = 2000;
            const raio = 1000;
            let textoJanela = textoCompleto;
            let deslocamentoJanela = 0;

            if (textoCompleto.length > limiteTotal) {
                const iniJanela = Math.max(0, indiceGlobalClique - raio);
                const fimJanela = Math.min(textoCompleto.length, indiceGlobalClique + raio);
                deslocamentoJanela = iniJanela;
                textoJanela = textoCompleto.substring(iniJanela, fimJanela);
            }

            return {
                bloco,
                texto: textoJanela,
                idxCursor: indiceGlobalClique - deslocamentoJanela,
                deslocamentoJanela,
                segmentos,
                tamanhoTotalBloco: textoCompleto.length
            };
        }

        /**
         * Converte índices locais do mapa textual para um Range nativo do DOM.
         */
        criarRangeDOMAPartirDeIndices(mapa, inicioLocal, fimLocal) {
            if (!mapa || inicioLocal >= fimLocal) return null;

            let iniLimpo = inicioLocal;
            let fimLimpo = fimLocal;
            if (typeof mapa.texto === 'string') {
                while (iniLimpo < fimLimpo && isQuebraOuEspaco(mapa.texto[iniLimpo])) {
                    iniLimpo++;
                }
                while (fimLimpo > iniLimpo && isQuebraOuEspaco(mapa.texto[fimLimpo - 1])) {
                    fimLimpo--;
                }
            }
            if (iniLimpo >= fimLimpo) return null;

            const inicioGlobal = Math.max(0, iniLimpo + mapa.deslocamentoJanela);
            const fimGlobal = Math.min(mapa.tamanhoTotalBloco, fimLimpo + mapa.deslocamentoJanela);
            if (inicioGlobal >= fimGlobal) return null;

            let noIni = null, offIni = 0;
            let noFim = null, offFim = 0;

            for (let i = 0; i < mapa.segmentos.length; i++) {
                const seg = mapa.segmentos[i];
                if (seg.ehBr) continue;

                if (!noIni && inicioGlobal >= seg.inicioGlobal && inicioGlobal <= seg.fimGlobal) {
                    if (inicioGlobal < seg.fimGlobal || i === mapa.segmentos.length - 1) {
                        noIni = seg.no;
                        offIni = inicioGlobal - seg.inicioGlobal;
                    }
                }

                if (!noFim && fimGlobal >= seg.inicioGlobal && fimGlobal <= seg.fimGlobal) {
                    if (fimGlobal > seg.inicioGlobal || i === 0) {
                        noFim = seg.no;
                        offFim = fimGlobal - seg.inicioGlobal;
                        break;
                    }
                }
            }

            if (!noIni) {
                for (let i = 0; i < mapa.segmentos.length; i++) {
                    const seg = mapa.segmentos[i];
                    if (!seg.ehBr && seg.fimGlobal > inicioGlobal) {
                        noIni = seg.no;
                        offIni = Math.max(0, inicioGlobal - seg.inicioGlobal);
                        break;
                    }
                }
            }
            if (!noFim) {
                for (let i = mapa.segmentos.length - 1; i >= 0; i--) {
                    const seg = mapa.segmentos[i];
                    if (!seg.ehBr && seg.inicioGlobal < fimGlobal) {
                        noFim = seg.no;
                        offFim = Math.min(seg.comprimento, fimGlobal - seg.inicioGlobal);
                        break;
                    }
                }
            }

            if (!noIni || !noFim) return null;

            try {
                const range = document.createRange();
                range.setStart(noIni, offIni);
                range.setEnd(noFim, offFim);
                return range;
            } catch (_) {
                return null;
            }
        }
    }

    window.JusGovGeometriaDOM = GeometriaDOM;
})();

