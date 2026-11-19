/* ==========================================================================
 * ARQUIVO: src/lib/lib-ui-ancorado.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs — Exibição Ancorada "Colada no Texto da Página"
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-ui-ancorado.js
 * - Classe Exportada: GerenciadorUiAncorado (self.JusGovLibUiAncorado / window.JusGovLibUiAncorado)
 * - Null Object: JusGovLibUiAncorado.NULL_OBJECT
 * - Métodos Públicos:
 *     calcularLinhasDoRange(rangeAlvo), agruparLinhasEmBlocos(segmentos),
 *     construirCaminhoSvgPoligono(linhas), isElementoAlvoVisivel(el),
 *     obterCaixaVisivelRecortada(el), pontoEstaVisivelNoAlvo(x, y, baseEl),
 *     ehMutacaoDeOverlayProprio(target), iniciarObservadorLayoutAncorado(estaAtivoFn, aoMudarFn)
 * - Regras / Seções: ENG-00 (Prioridade -1), ENG-01 (Null Object), FEAT-102 (Seção 6.260)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) MOTOR REUTILIZÁVEL DE ANCORAGEM AO TEXTO (SCROLL-SYNC):
 *    Consolida o motor geométrico e de observação de layout usado pelo "Contorno Visual
 *    Rápido ao Copiar (Flash Temporizado)" e pelo "Marcador Permanente de Conteúdo Colado"
 *    para que qualquer destaque ou balão colado ao texto suba/desça solidariamente com a
 *    rolagem e mutações da página, com throttling via `requestAnimationFrame`.
 * 2) RESILIÊNCIA A SEGURANÇA (`try {} catch {}`):
 *    Todas as consultas DOM (`getClientRects`, `getComputedStyle`, `elementsFromPoint`,
 *    `MutationObserver`, `ResizeObserver`) são blindadas por `try/catch`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovLibUiAncorado = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SELETOR_OVERLAYS_PROPRIOS = '#jusgov-flash-contour-container, #jusgov-pasted-markers-container, #jusgov-validacao-flutuante, #jusgov-ui-tela-top-layer, [data-jusgov-flash="true"], [data-jusgov-pasted-container="true"], [data-jusgov-ignore="true"]';

    const NULL_UI_ANCORADO = Object.freeze({
        calcularLinhasDoRange: () => [],
        agruparLinhasEmBlocos: () => [],
        construirCaminhoSvgPoligono: () => '',
        isElementoAlvoVisivel: () => false,
        obterCaixaVisivelRecortada: () => null,
        pontoEstaVisivelNoAlvo: () => true,
        ehMutacaoDeOverlayProprio: () => false,
        iniciarObservadorLayoutAncorado: () => (() => { })
    });

    class GerenciadorUiAncorado {
        static get NULL_OBJECT() {
            return NULL_UI_ANCORADO;
        }

        ehMutacaoDeOverlayProprio(target) {
            try {
                const el = (target && target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
                if (!el || typeof el.closest !== 'function') return false;
                return Boolean(el.closest(SELETOR_OVERLAYS_PROPRIOS));
            } catch (_) {
                return false;
            }
        }

        /**
         * Extrai somente os retângulos reais de TEXTO dentro do Range (um por linha visual),
         * unificando fragmentos contíguos da mesma linha.
         */
        calcularLinhasDoRange(rangeAlvo) {
            const fragmentos = [];
            const adicionar = (r) => {
                if (r && r.width > 0.5 && r.height > 0.5) {
                    fragmentos.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
                }
            };
            try {
                if (!rangeAlvo) return [];
                const doc = (rangeAlvo.startContainer && rangeAlvo.startContainer.ownerDocument) || (typeof document !== 'undefined' ? document : null);
                if (!doc) return [];
                const raiz = rangeAlvo.commonAncestorContainer;
                const nosTexto = [];
                if (raiz && raiz.nodeType === 3) {
                    nosTexto.push(raiz);
                } else if (raiz && typeof doc.createTreeWalker === 'function') {
                    const walker = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null);
                    let n;
                    while ((n = walker.nextNode())) {
                        if (typeof rangeAlvo.intersectsNode === 'function' && !rangeAlvo.intersectsNode(n)) continue;
                        nosTexto.push(n);
                    }
                }
                for (let i = 0; i < nosTexto.length; i++) {
                    const no = nosTexto[i];
                    const ini = (no === rangeAlvo.startContainer) ? rangeAlvo.startOffset : 0;
                    const fim = (no === rangeAlvo.endContainer) ? rangeAlvo.endOffset : no.length;
                    if (fim <= ini) continue;
                    if (!/\S/.test(no.data.substring(ini, fim))) continue;
                    const sub = doc.createRange();
                    sub.setStart(no, ini);
                    sub.setEnd(no, fim);
                    const rs = sub.getClientRects();
                    for (let k = 0; k < rs.length; k++) adicionar(rs[k]);
                }
            } catch (_) { }

            if (fragmentos.length === 0) {
                try {
                    if (rangeAlvo && typeof rangeAlvo.getBoundingClientRect === 'function') {
                        adicionar(rangeAlvo.getBoundingClientRect());
                    }
                } catch (_) { }
            }
            if (fragmentos.length === 0) return [];

            fragmentos.sort((a, b) => (a.top - b.top) || (a.left - b.left));
            const linhas = [];
            for (let i = 0; i < fragmentos.length; i++) {
                const f = fragmentos[i];
                const cy = (f.top + f.bottom) / 2;
                let alvoLinha = null;
                for (let j = linhas.length - 1; j >= 0 && j >= linhas.length - 4; j--) {
                    const l = linhas[j];
                    const h = Math.min(l.bottom - l.top, f.bottom - f.top);
                    if (cy >= l.top + (l.bottom - l.top) * 0.15 && cy <= l.bottom - (l.bottom - l.top) * 0.15 && Math.abs(((l.top + l.bottom) / 2) - cy) < h * 0.6) {
                        alvoLinha = l;
                        break;
                    }
                }
                if (alvoLinha) {
                    alvoLinha.frags.push(f);
                    alvoLinha.top = Math.min(alvoLinha.top, f.top);
                    alvoLinha.bottom = Math.max(alvoLinha.bottom, f.bottom);
                } else {
                    linhas.push({ top: f.top, bottom: f.bottom, frags: [f] });
                }
            }

            let ehPdf = false;
            try {
                ehPdf = (typeof document !== 'undefined' && document.contentType === 'application/pdf') ||
                    Boolean(rangeAlvo.commonAncestorContainer && rangeAlvo.commonAncestorContainer.parentElement && rangeAlvo.commonAncestorContainer.parentElement.closest && rangeAlvo.commonAncestorContainer.parentElement.closest('.textLayer, .pdfViewer'));
            } catch (_) { }
            const limiteGapHorizontal = ehPdf ? 48 : 16;

            const segmentos = [];
            for (let i = 0; i < linhas.length; i++) {
                const l = linhas[i];
                l.frags.sort((a, b) => a.left - b.left);
                let atual = null;
                for (let k = 0; k < l.frags.length; k++) {
                    const f = l.frags[k];
                    if (atual && (f.left - atual.right) <= limiteGapHorizontal) {
                        atual.right = Math.max(atual.right, f.right);
                    } else {
                        if (atual) segmentos.push(atual);
                        atual = { left: f.left, right: f.right, top: l.top, bottom: l.bottom };
                    }
                }
                if (atual) segmentos.push(atual);
            }
            return segmentos;
        }

        /**
         * Agrupa segmentos contíguos de linhas visuais em blocos para geração do polígono SVG contínuo.
         */
        agruparLinhasEmBlocos(segmentos) {
            if (!Array.isArray(segmentos) || segmentos.length === 0) return [];
            const ordenados = segmentos.slice().sort((a, b) => (a.top - b.top) || (a.left - b.left));
            const blocos = [];
            for (let i = 0; i < ordenados.length; i++) {
                const s = ordenados[i];
                let destino = null;
                for (let j = 0; j < blocos.length; j++) {
                    const ultima = blocos[j][blocos[j].length - 1];
                    const alturaRef = Math.max(12, s.bottom - s.top, ultima.bottom - ultima.top);
                    const folga = Math.max(14, alturaRef * 1.85);
                    const contiguo = (s.top >= ultima.top - 2) && ((s.top - ultima.bottom) <= folga);
                    const sobrepoe = (s.left < ultima.right + 28) && (s.right > ultima.left - 28);
                    if (contiguo && sobrepoe) { destino = blocos[j]; break; }
                }
                if (destino) destino.push(s); else blocos.push([s]);
            }
            return blocos;
        }

        /**
         * Constrói o path SVG (`M... L... Z`) contínuo envolvendo múltiplas linhas de texto.
         */
        construirCaminhoSvgPoligono(linhas) {
            if (!Array.isArray(linhas) || linhas.length === 0) return '';
            const n = linhas.length;
            const L = linhas.map(l => l.left - 2);
            const R = linhas.map(l => l.right + 2);
            const Y = [];
            for (let i = 0; i < n - 1; i++) {
                Y.push((linhas[i].bottom + linhas[i + 1].top) / 2);
            }
            const topo = linhas[0].top - 1;
            const base = linhas[n - 1].bottom + 1;
            const pts = [[L[0], topo], [R[0], topo]];
            for (let i = 0; i < n - 1; i++) {
                pts.push([R[i], Y[i]]);
                pts.push([R[i + 1], Y[i]]);
            }
            pts.push([R[n - 1], base]);
            pts.push([L[n - 1], base]);
            for (let i = n - 2; i >= 0; i--) {
                pts.push([L[i + 1], Y[i]]);
                pts.push([L[i], Y[i]]);
            }
            return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
        }

        isElementoAlvoVisivel(el) {
            try {
                if (!el || !el.isConnected) return false;
                let cur = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
                while (cur && cur.nodeType === Node.ELEMENT_NODE && cur !== document.documentElement) {
                    if (cur.hasAttribute && cur.hasAttribute('hidden')) return false;
                    if (cur.getAttribute && cur.getAttribute('aria-hidden') === 'true') return false;
                    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                        const st = window.getComputedStyle(cur);
                        if (st.display === 'none' || st.visibility === 'hidden' || st.visibility === 'collapse') return false;
                        if (parseFloat(st.opacity) <= 0.02) return false;
                    }
                    cur = cur.parentElement;
                }
                return true;
            } catch (_) {
                return false;
            }
        }

        obterCaixaVisivelRecortada(el) {
            try {
                const vw = (typeof window !== 'undefined' && window.innerWidth) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) || 2000;
                const vh = (typeof window !== 'undefined' && window.innerHeight) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) || 2000;
                let clip = { top: 0, left: 0, right: vw, bottom: vh };
                let cur = (el && el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
                while (cur && cur.nodeType === Node.ELEMENT_NODE && cur !== document.documentElement) {
                    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function' && typeof cur.getBoundingClientRect === 'function') {
                        const st = window.getComputedStyle(cur);
                        const recortaX = ['auto', 'scroll', 'hidden', 'clip'].includes(st.overflowX);
                        const recortaY = ['auto', 'scroll', 'hidden', 'clip'].includes(st.overflowY);
                        if (recortaX || recortaY) {
                            const r = cur.getBoundingClientRect();
                            if (recortaX) {
                                clip.left = Math.max(clip.left, r.left);
                                clip.right = Math.min(clip.right, r.right);
                            }
                            if (recortaY) {
                                clip.top = Math.max(clip.top, r.top);
                                clip.bottom = Math.min(clip.bottom, r.bottom);
                            }
                            if (clip.right <= clip.left + 1 || clip.bottom <= clip.top + 1) {
                                return null;
                            }
                        }
                    }
                    cur = cur.parentElement;
                }
                return clip;
            } catch (_) {
                return null;
            }
        }

        pontoEstaVisivelNoAlvo(x, y, baseEl) {
            try {
                if (typeof document === 'undefined' || typeof document.elementsFromPoint !== 'function' || !baseEl) return true;
                const pilha = document.elementsFromPoint(x, y);
                if (!Array.isArray(pilha) || pilha.length === 0) return true;
                for (let i = 0; i < pilha.length; i++) {
                    const elTopo = pilha[i];
                    if (!elTopo || (elTopo.closest && elTopo.closest('[data-jusgov-ignore="true"]'))) continue;
                    return (elTopo === baseEl || baseEl.contains(elTopo) || elTopo.contains(baseEl));
                }
            } catch (_) { }
            return true;
        }

        /**
         * Observa mutações DOM, redimensionamentos e transições com throttling via rAF
         * para manter elementos ancorados ao texto perfeitamente sincronizados.
         */
        iniciarObservadorLayoutAncorado(estaAtivoFn, aoMudarFn) {
            const desconectarCallbacks = [];
            let encerrado = false;
            let rafId = 0;

            const desconectar = () => {
                if (encerrado) return;
                encerrado = true;
                if (rafId && typeof cancelAnimationFrame === 'function') {
                    try { cancelAnimationFrame(rafId); } catch (_) { }
                    rafId = 0;
                }
                for (const fn of desconectarCallbacks) {
                    try { fn(); } catch (_) { }
                }
                desconectarCallbacks.length = 0;
            };

            const dispararSeAtivo = () => {
                if (encerrado) return;
                try {
                    if (typeof estaAtivoFn === 'function' && !estaAtivoFn()) {
                        desconectar();
                        return;
                    }
                    if (typeof requestAnimationFrame === 'function') {
                        if (rafId) return;
                        rafId = requestAnimationFrame(() => {
                            rafId = 0;
                            if (!encerrado && typeof aoMudarFn === 'function') {
                                try { aoMudarFn(); } catch (_) { }
                            }
                        });
                    } else if (typeof aoMudarFn === 'function') {
                        aoMudarFn();
                    }
                } catch (_) { }
            };

            try {
                const alvoDom = (typeof document !== 'undefined') ? (document.body || document.documentElement) : null;
                if (typeof MutationObserver === 'function' && alvoDom) {
                    const mutObs = new MutationObserver((muts) => {
                        if (encerrado) return;
                        const relevante = muts.some((m) => !this.ehMutacaoDeOverlayProprio(m.target));
                        if (relevante) dispararSeAtivo();
                    });
                    mutObs.observe(alvoDom, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributes: true,
                        attributeFilter: ['style', 'class', 'hidden', 'open', 'aria-hidden', 'aria-selected', 'aria-expanded', 'disabled']
                    });
                    desconectarCallbacks.push(() => mutObs.disconnect());
                }

                if (typeof ResizeObserver === 'function' && alvoDom) {
                    const resObs = new ResizeObserver(() => dispararSeAtivo());
                    resObs.observe(alvoDom);
                    desconectarCallbacks.push(() => resObs.disconnect());
                }

                if (typeof document !== 'undefined') {
                    const onTransitionEnd = (ev) => {
                        if (!this.ehMutacaoDeOverlayProprio(ev && ev.target)) dispararSeAtivo();
                    };
                    document.addEventListener('transitionend', onTransitionEnd, { capture: true, passive: true });
                    desconectarCallbacks.push(() => document.removeEventListener('transitionend', onTransitionEnd, true));
                }
            } catch (_) { }

            return desconectar;
        }
    }

    Object.freeze(GerenciadorUiAncorado.prototype);
    return Object.freeze(GerenciadorUiAncorado);
}));
