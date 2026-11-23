/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-visual-flash.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Geometria de Linhas e Flash Border Temporizado
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-visual-flash.js
 * - Classe Exportada: CopiaVisualFlash (self.JusGovCopiaVisualFlash) extends BaseModulo
 * - Métodos Públicos: calcularLinhasDoRange, agruparLinhasEmBlocos, _p_renderizarGeometriaFlashNoContainer, _p_executarAtualizacaoPosicaoFlashSincrona, atualizarPosicaoFlashSobRolagem, _p_agendarAtualizacaoFlash, dispararFlashBorderVisual, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaVisualFlash = fabrica(raiz);
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

    const PRESET_VISUAL_MINIMO = Object.freeze({
        verde_forense: Object.freeze({ corContorno: '#0d9488', corFundo: '#ccfbf1', opacidadeFundo: 0.28, estiloBadge: 'sobrescrito' })
    });

    class CopiaVisualFlash extends Base {
        constructor() {
            super('CopiaVisualFlash');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaVisualFlash.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaVisualFlash.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Obtém somente os retângulos de TEXTO efetivo selecionados (um por linha visual),
         * eliminando retângulos aninhados de elementos-pai e unificando fragmentos contíguos.
         */
        calcularLinhasDoRange(rangeAlvo) {
            if (this._p_uiAncorado && typeof this._p_uiAncorado.calcularLinhasDoRange === 'function') {
                return this._p_uiAncorado.calcularLinhasDoRange(rangeAlvo);
            }
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

            const ehPdf = (typeof document !== 'undefined' && document.contentType === 'application/pdf') ||
                Boolean(rangeAlvo.commonAncestorContainer && rangeAlvo.commonAncestorContainer.parentElement && rangeAlvo.commonAncestorContainer.parentElement.closest && rangeAlvo.commonAncestorContainer.parentElement.closest('.textLayer, .pdfViewer'));
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
         * Agrupa segmentos contíguos de linhas visuais em blocos para geração do polígono.
         */
        agruparLinhasEmBlocos(segmentos) {
            if (this._p_uiAncorado && typeof this._p_uiAncorado.agruparLinhasEmBlocos === 'function') {
                return this._p_uiAncorado.agruparLinhasEmBlocos(segmentos);
            }
            const ordenados = segmentos.slice().sort((a, b) => (a.top - b.top) || (a.left - b.left));
            const blocos = [];
            for (let i = 0; i < ordenados.length; i++) {
                const s = ordenados[i];
                let destino = null;
                for (let j = 0; j < blocos.length; j++) {
                    const ultima = blocos[j][blocos[j].length - 1];
                    const alturaRef = Math.max(12, s.bottom - s.top, ultima.bottom - ultima.top);
                    /* BUG-69: Tolerância vertical de 1.85x altura cobre espaçamentos entre linhas e parágrafos
                     * contíguos do mesmo Range sem quebrar o polígono SVG contínuo (preservando rolagem e abas). */
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
         * Renderiza internamente as caixas / polígonos SVG do Flash Border a partir do #rangeAtivoFlash.
         * Chamado na criação e em cada atualização de rolagem (Scroll Sync - BUG-45).
         */
        _p_renderizarGeometriaFlashNoContainer(container, rangeAlvo, corBorda) {
            if (!container || !rangeAlvo) return [];
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            const segmentos = this.calcularLinhasDoRange(rangeAlvo);
            if (segmentos.length === 0) return [];
            const blocos = this.agruparLinhasEmBlocos(segmentos);

            for (let b = 0; b < blocos.length; b++) {
                const linhas = blocos[b];
                if (linhas.length === 1) {
                    const r = linhas[0];
                    const box = document.createElement('div');
                    box.className = 'jusgov-flash-box';
                    box.setAttribute('data-jusgov-ignore', 'true');
                    box.style.cssText = [
                        'position:fixed',
                        `top:${Math.round(r.top - 1)}px`,
                        `left:${Math.round(r.left - 2)}px`,
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
            return segmentos;
        }

        _p_executarAtualizacaoPosicaoFlashSincrona() {
            if (!this._p_aguardandoDesselecaoFlash || !this._p_rangeAtivoFlash) return;
            const container = document.getElementById('jusgov-flash-contour-container');
            if (!container) return;
            const segmentos = this._p_renderizarGeometriaFlashNoContainer(container, this._p_rangeAtivoFlash, this._p_corAtivaFlash);
            this._p_segmentosAtuaisFlash = Array.isArray(segmentos) ? segmentos : [];
        }

        /**
         * Recalcula imediatamente a posição do Flash Border ativo durante rolagem ou redimensionamento (BUG-45).
         */
        atualizarPosicaoFlashSobRolagem() {
            this._p_executarAtualizacaoPosicaoFlashSincrona();
        }

        _p_agendarAtualizacaoFlash() {
            if (!this._p_aguardandoDesselecaoFlash || !this._p_rangeAtivoFlash) return;
            if (typeof requestAnimationFrame === 'function') {
                if (this._p_rafScrollFlash) return;
                this._p_rafScrollFlash = requestAnimationFrame(() => {
                    this._p_rafScrollFlash = 0;
                    this._p_executarAtualizacaoPosicaoFlashSincrona();
                });
            } else {
                this._p_executarAtualizacaoPosicaoFlashSincrona();
            }
        }

        /**
         * Dispara o contorno visual temporário de Flash Border sobre o Range.
         * Ancorado fisicamente ao texto sob rolagem (BUG-45) e com suporte estrito ao modo "Até Interação" (-1).
         */
        dispararFlashBorderVisual(rangeAlvo, duracaoMs = 500, corFlashBorder = '#0d9488', tipoContorno = 'solido') {
            this.limparFlashBorderImediatamente();
            if (duracaoMs === 0 || !rangeAlvo) return false;
            const tipoContornoFlash = ['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(tipoContorno) ? tipoContorno : 'solido';

            try {
                const rangeClonado = (typeof rangeAlvo.cloneRange === 'function') ? rangeAlvo.cloneRange() : rangeAlvo;
                const corBorda = (typeof corFlashBorder === 'string' && /^#[0-9a-fA-F]{6}$/.test(corFlashBorder.trim()))
                    ? corFlashBorder.trim().toLowerCase()
                    : '#0d9488';

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

                const segmentos = this._p_renderizarGeometriaFlashNoContainer(container, rangeClonado, corBorda);
                if (segmentos.length === 0) {
                    if (container.parentNode) container.parentNode.removeChild(container);
                    return false;
                }

                this._p_rangeAtivoFlash = rangeClonado;
                this._p_corAtivaFlash = corBorda;
                this._p_duracaoAtivaFlash = duracaoMs;
                this._p_aguardandoDesselecaoFlash = true;
                const timestampInicio = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                    ? performance.now()
                    : Date.now();
                this._p_timestampCriacaoFlash = timestampInicio;
                this._p_segmentosAtuaisFlash = Array.isArray(segmentos) ? segmentos : [];

                /* Seção 6.114 (BUG-45 / USAB-13) e Seção 6.117 (BUG-47):
                 * - Ignora tecla Insert (keyCode 45) para não interferir em Ins + Ins.
                 * - No modo "Até Interação" (duracaoMs === -1), o contorno permanece fixo até:
                 *   a) Pressionar Escape ou Enter;
                 *   b) Uma nova cópia/seleção ser realizada (em qualquer guia) ou colagem substituir pelo marcador permanente;
                 *   c) Clique em modal crítico de confirmação ([role="dialog"], etc. — BUG-02). */
                const tratarKeyDownGlobalFlash = (e) => {
                    if (!e) return;
                    const tecla = (e.key || '');
                    if (tecla === 'Insert' || e.keyCode === 45) return;
                    if (tecla === 'Escape' || tecla === 'Enter') {
                        this.limparFlashBorderImediatamente();
                    }
                };

                const pontoEstaDentroDoFlashAtual = (cx, cy) => {
                    if (typeof cx !== 'number' || typeof cy !== 'number' || !Array.isArray(this._p_segmentosAtuaisFlash)) {
                        return false;
                    }
                    return this._p_segmentosAtuaisFlash.some((s) =>
                        cx >= (s.left - 4) && cx <= (s.right + 4) && cy >= (s.top - 4) && cy <= (s.bottom + 4)
                    );
                };

                const tratarMouseDownGlobalFlash = (e) => {
                    if (!e) return;
                    const alvo = e.target;
                    const clicouEmModalCritico = Boolean(
                        alvo && typeof alvo.closest === 'function' &&
                        alvo.closest('[role="dialog"], [role="alertdialog"], .modal, .rich-modalpanel, .swal2-container, .ui-dialog, .p-dialog, mat-dialog-container')
                    );
                    if (clicouEmModalCritico) {
                        this.limparFlashBorderImediatamente();
                    }
                };

                const tratarCopiaOuSelecaoGlobalFlash = (e) => {
                    if (e && e.type === 'selectstart') {
                        if (this._p_duracaoAtivaFlash > 0) {
                            return;
                        }
                        if (e.target && this._p_segmentosAtuaisFlash.length > 0) {
                            try {
                                const r = typeof e.target.getBoundingClientRect === 'function' ? e.target.getBoundingClientRect() : null;
                                if (r && pontoEstaDentroDoFlashAtual((r.left + r.right) / 2, (r.top + r.bottom) / 2)) {
                                    return;
                                }
                            } catch (_) { }
                        }
                    }
                    this.limparFlashBorderImediatamente();
                };

                const tratarScrollOuResizeFlash = () => {
                    this._p_agendarAtualizacaoFlash();
                };

                /* Seção 6.137 / BUG-55: Observa mudanças no layout da página (DOM e redimensionamento de containers/corpo)
                 * para manter o Flash Border fisicamente ancorado caso algum painel acima altere a altura após a cópia. */
                if (this._desconectarObsLayoutFlash) {
                    try { this._desconectarObsLayoutFlash(); } catch (_) { }
                    this._desconectarObsLayoutFlash = null;
                }
                const obsLayoutFlash = this._p_iniciarObservadorLayout(
                    () => Boolean(document.getElementById('jusgov-flash-contour-container')),
                    tratarScrollOuResizeFlash
                );
                this._desconectarObsLayoutFlash = obsLayoutFlash;

                const opts = { capture: true, passive: true };
                document.addEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                window.addEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                document.addEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                window.addEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                document.addEventListener('copy', tratarCopiaOuSelecaoGlobalFlash, opts);
                document.addEventListener('selectstart', tratarCopiaOuSelecaoGlobalFlash, opts);
                window.addEventListener('scroll', tratarScrollOuResizeFlash, opts);
                document.addEventListener('scroll', tratarScrollOuResizeFlash, opts);
                window.addEventListener('resize', tratarScrollOuResizeFlash, opts);
                document.addEventListener('transitionend', tratarScrollOuResizeFlash, opts);

                this._p_limparOuvintesInteracaoFlash = () => {
                    document.removeEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                    window.removeEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                    document.removeEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                    window.removeEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                    document.removeEventListener('copy', tratarCopiaOuSelecaoGlobalFlash, opts);
                    document.removeEventListener('selectstart', tratarCopiaOuSelecaoGlobalFlash, opts);
                    window.removeEventListener('scroll', tratarScrollOuResizeFlash, opts);
                    document.removeEventListener('scroll', tratarScrollOuResizeFlash, opts);
                    window.removeEventListener('resize', tratarScrollOuResizeFlash, opts);
                    document.removeEventListener('transitionend', tratarScrollOuResizeFlash, opts);
                    if (this._desconectarObsLayoutFlash) {
                        try { this._desconectarObsLayoutFlash(); } catch (_) { }
                        this._desconectarObsLayoutFlash = null;
                    }
                };

                if (duracaoMs > 0) {
                    /* Modo Temporizado: o Flash desaparece automaticamente no tempo configurado */
                    this._p_timerFlashBorder = setTimeout(() => {
                        this.limparFlashBorderImediatamente();
                    }, duracaoMs);
                }
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(CopiaVisualFlash.prototype);
    return Object.freeze(CopiaVisualFlash);
}));