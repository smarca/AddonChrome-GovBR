/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-visual.js
 * CLASSE: FeedbackVisual
 * 
 * FINALIDADE:
 * Gerenciamento centralizado do feedback visual no DOM após seleção/cópia inteligente:
 * - Desenho de contorno dinâmico Flash Border (verde/customizado) com SVG polígono contíguo multilinhas.
 * - Eliminação estrita de retângulos aninhados/sobrepostos retornados pelo getClientRects nativo.
 * - Desseleção universal imediata em interfaces não-editáveis com preservação ou remoção de destaque.
 * - Limpeza atômica multi-frame e integração com o aviso flutuante MiniTip na Top Layer.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. O Flash Border deve ter fundo 100% transparente para jamais obstruir o texto ou parecer
 *    uma seleção nativa falsa (azul/cinza).
 * 2. Em seleções de múltiplas linhas, calcula os nós de texto vivos, funde fragmentos contíguos
 *    por linha e gera um único <polygon> SVG fechado (d = M... L... Z) eliminando caixas empilhadas.
 * 3. Limpeza multi-frame: limpa contêineres tanto no frame local quanto em window.top.document
 *    para evitar caixas fantasmas deixadas por subframes destruídos.
 * 4. Respeita o timer configurável (0ms a 5000ms). Se 0ms, o Flash está inativo.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.7: Feedback Visual Discreto)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 4.2: Polígonos SVG e Flash Multi-Linhas)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFeedbackVisual) {
        return;
    }

    class FeedbackVisual {
        #timerFlashBorder;
        #aguardandoDesselecaoFlash;
        #timestampCriacaoFlash;

        constructor() {
            this.#timerFlashBorder = null;
            this.#aguardandoDesselecaoFlash = false;
            this.#timestampCriacaoFlash = 0;
        }

        get aguardandoDesselecaoFlash() {
            return this.#aguardandoDesselecaoFlash;
        }

        get timestampCriacaoFlash() {
            return this.#timestampCriacaoFlash;
        }

        /**
         * Converte cor hexadecimal (#rrggbb) em objeto com hex limpo e string rgba(r,g,b,alfa).
         */
        converterHexParaRgbaFlash(hexBruto, alfa = 0.28) {
            const hexLimpo = (typeof hexBruto === 'string' && /^#[0-9a-fA-F]{6}$/.test(hexBruto.trim()))
                ? hexBruto.trim()
                : '#0d9488';
            const r = parseInt(hexLimpo.slice(1, 3), 16);
            const g = parseInt(hexLimpo.slice(3, 5), 16);
            const b = parseInt(hexLimpo.slice(5, 7), 16);
            return {
                hex: hexLimpo,
                rgba: `rgba(${r}, ${g}, ${b}, ${alfa})`
            };
        }

        /**
         * Remove imediatamente do DOM todos os contêineres e caixas de Flash Border.
         */
        limparFlashBorderImediatamente() {
            if (this.#timerFlashBorder) {
                clearTimeout(this.#timerFlashBorder);
                this.#timerFlashBorder = null;
            }
            this.#aguardandoDesselecaoFlash = false;

            try {
                const containers = document.querySelectorAll('#jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"]');
                for (let i = 0; i < containers.length; i++) {
                    const c = containers[i];
                    if (c && c.parentNode) {
                        c.parentNode.removeChild(c);
                    }
                }
                if (typeof CSS !== 'undefined' && CSS.highlights) {
                    CSS.highlights.delete('jusgov-flash-copy');
                }
            } catch (_) { }

            try {
                if (typeof window !== 'undefined' && window.top && window.top !== window && window.top.document) {
                    const topContainers = window.top.document.querySelectorAll('#jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"]');
                    for (let j = 0; j < topContainers.length; j++) {
                        const tc = topContainers[j];
                        if (tc && tc.parentNode) {
                            tc.parentNode.removeChild(tc);
                        }
                    }
                }
            } catch (_) { }
        }

        /**
         * Limpa popups de auditoria e Wiki Forense associados ao validador flutuante.
         */
        limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip = false, validador = null) {
            const v = validador || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
            if (v) {
                if (typeof v.ocultarTodosAvisosImediatamente === 'function') {
                    v.ocultarTodosAvisosImediatamente(preservarMiniTip);
                } else if (typeof v.limparAlertaVisual === 'function') {
                    v.limparAlertaVisual();
                }
            }
        }

        /**
         * Agenda ou executa a remoção atômica do Flash Border e avisos após desseleção.
         */
        agendarRetiradaFlashAposDesselecao(preservarMiniTip = false, validador = null) {
            if (this.#aguardandoDesselecaoFlash || this.#timerFlashBorder) {
                this.limparFlashBorderImediatamente();
            }
            this.limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip, validador);
        }

        /**
         * Obtém somente os retângulos de TEXTO efetivo selecionados (um por linha visual),
         * eliminando retângulos aninhados de elementos-pai e unificando fragmentos contíguos.
         */
        calcularLinhasDoRange(rangeAlvo) {
            const fragmentos = [];
            const adicionar = (r) => {
                if (r && r.width > 0.5 && r.height > 0.5) {
                    fragmentos.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
                }
            };
            try {
                const raiz = rangeAlvo.commonAncestorContainer;
                const nosTexto = [];
                if (raiz && raiz.nodeType === 3) {
                    nosTexto.push(raiz);
                } else if (raiz) {
                    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null);
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
                    const sub = document.createRange();
                    sub.setStart(no, ini);
                    sub.setEnd(no, fim);
                    const rs = sub.getClientRects();
                    for (let k = 0; k < rs.length; k++) adicionar(rs[k]);
                }
            } catch (_) { }

            if (fragmentos.length === 0) {
                try {
                    if (typeof rangeAlvo.getBoundingClientRect === 'function') adicionar(rangeAlvo.getBoundingClientRect());
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

            const segmentos = [];
            for (let i = 0; i < linhas.length; i++) {
                const l = linhas[i];
                l.frags.sort((a, b) => a.left - b.left);
                let atual = null;
                for (let k = 0; k < l.frags.length; k++) {
                    const f = l.frags[k];
                    if (atual && (f.left - atual.right) <= 12) {
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
         * Agrupa segmentos contíguos de linhas visuais em blocos para geração do polígono.
         */
        agruparLinhasEmBlocos(segmentos) {
            const ordenados = segmentos.slice().sort((a, b) => (a.top - b.top) || (a.left - b.left));
            const blocos = [];
            for (let i = 0; i < ordenados.length; i++) {
                const s = ordenados[i];
                let destino = null;
                for (let j = 0; j < blocos.length; j++) {
                    const ultima = blocos[j][blocos[j].length - 1];
                    const folga = Math.max(6, (s.bottom - s.top) * 0.6);
                    const contiguo = (s.top >= ultima.top) && ((s.top - ultima.bottom) <= folga);
                    const sobrepoe = (s.left < ultima.right) && (s.right > ultima.left);
                    if (contiguo && sobrepoe) { destino = blocos[j]; break; }
                }
                if (destino) destino.push(s); else blocos.push([s]);
            }
            return blocos;
        }

        /**
         * Dispara o contorno visual temporário de Flash Border sobre o Range.
         */
        dispararFlashBorderVisual(rangeAlvo, duracaoMs = 500, corFlashBorder = '#0d9488') {
            this.limparFlashBorderImediatamente();
            if (duracaoMs <= 0 || !rangeAlvo) return;

            try {
                const segmentos = this.calcularLinhasDoRange(rangeAlvo);
                if (segmentos.length === 0) return;
                const blocos = this.agruparLinhasEmBlocos(segmentos);

                const idContainer = 'jusgov-flash-contour-container';
                const existentes = document.querySelectorAll(`#${idContainer}`);
                for (let e = 0; e < existentes.length; e++) {
                    if (existentes[e].parentNode) existentes[e].parentNode.removeChild(existentes[e]);
                }

                const container = document.createElement('div');
                container.id = idContainer;
                container.setAttribute('data-jusgov-ignore', 'true');
                container.setAttribute('data-jusgov-flash', 'true');
                container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none !important;z-index:2147483646;border:none;margin:0;padding:0;overflow:visible;';
                (document.body || document.documentElement).appendChild(container);

                const corBorda = (typeof corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(corFlashBorder.trim()))
                    ? corFlashBorder.trim().toLowerCase()
                    : '#0d9488';

                for (let b = 0; b < blocos.length; b++) {
                    const linhas = blocos[b];
                    if (linhas.length === 1) {
                        const r = linhas[0];
                        const box = document.createElement('div');
                        box.className = 'jusgov-flash-box';
                        box.setAttribute('data-jusgov-ignore', 'true');
                        box.style.cssText = [
                            'position:fixed',
                            `top:${Math.max(0, Math.round(r.top - 1))}px`,
                            `left:${Math.max(0, Math.round(r.left - 2))}px`,
                            `width:${Math.max(1, Math.round(r.right - r.left + 4))}px`,
                            `height:${Math.max(1, Math.round(r.bottom - r.top + 2))}px`,
                            `border:2px solid ${corBorda}`,
                            'border-radius:3px',
                            'background:transparent',
                            'background-color:transparent',
                            'pointer-events:none !important',
                            'box-sizing:border-box',
                            `box-shadow:0 0 0 1px rgba(255,255,255,0.45), 0 0 4px ${corBorda}`,
                            'margin:0',
                            'padding:0'
                        ].join(';') + ';';
                        container.appendChild(box);
                        continue;
                    }

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
                    const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';

                    const NS = 'http://www.w3.org/2000/svg';
                    const svg = document.createElementNS(NS, 'svg');
                    svg.setAttribute('class', 'jusgov-flash-box');
                    svg.setAttribute('data-jusgov-ignore', 'true');
                    svg.setAttribute('width', String(window.innerWidth || document.documentElement.clientWidth || 0));
                    svg.setAttribute('height', String(window.innerHeight || document.documentElement.clientHeight || 0));
                    svg.style.cssText = 'position:fixed;top:0;left:0;overflow:visible;pointer-events:none !important;background:transparent;margin:0;padding:0;';
                    const halo = document.createElementNS(NS, 'path');
                    halo.setAttribute('d', d);
                    halo.setAttribute('fill', 'none');
                    halo.setAttribute('stroke', 'rgba(255,255,255,0.45)');
                    halo.setAttribute('stroke-width', '4');
                    halo.setAttribute('stroke-linejoin', 'round');
                    const traco = document.createElementNS(NS, 'path');
                    traco.setAttribute('d', d);
                    traco.setAttribute('fill', 'none');
                    traco.setAttribute('stroke', corBorda);
                    traco.setAttribute('stroke-width', '2');
                    traco.setAttribute('stroke-linejoin', 'round');
                    svg.appendChild(halo);
                    svg.appendChild(traco);
                    container.appendChild(svg);
                }

                this.#aguardandoDesselecaoFlash = true;
                this.#timestampCriacaoFlash = performance.now();

                this.#timerFlashBorder = setTimeout(() => {
                    this.limparFlashBorderImediatamente();
                }, duracaoMs);
            } catch (_) { }
        }

        /**
         * Projeta o aviso flutuante MiniTip no topo da página através do validador.
         */
        projetarMiniTipGlobal(mensagem, corBorda, validador = null) {
            const v = validador || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
            if (v && typeof v.projetarMiniTipGlobal === 'function') {
                v.projetarMiniTipGlobal(mensagem, corBorda);
            }
        }
    }

    window.JusGovFeedbackVisual = FeedbackVisual;
})();

