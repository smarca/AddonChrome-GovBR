/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-visual-marcadores.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Marcadores Permanentes de Conteúdo Colado e Observador de Layout
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-visual-marcadores.js
 * - Classe Exportada: CopiaVisualMarcadores (self.JusGovCopiaVisualMarcadores) extends BaseModulo
 * - Métodos Públicos: registrarCopiaCandidataParaMarcador, _p_rangesSeSobrepoem, _p_fundirRangesSobrepostos, confirmarColagemEMarcarPermanente, _p_agendarAtualizacaoMarcadores, _p_ehMutacaoDeOverlayVisualProprio, _p_iniciarObservadorLayout, _p_garantirOuvintesScrollMarcadoresPermanentes, _p_isElementoAlvoVisivel, _p_obterCaixaVisivelRecortada, _p_pontoEstaVisivelNoAlvo, _p_renderizarTodosMarcadoresPermanentesNoDom, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaVisualMarcadores = fabrica(raiz);
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

    class CopiaVisualMarcadores extends Base {
        constructor() {
            super('CopiaVisualMarcadores');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaVisualMarcadores.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaVisualMarcadores.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Confirma que um texto copiado foi efetivamente colado (na mesma guia ou em outra guia),
         * removendo imediatamente o Flash Border residual e criando/expandindo o Marcador Permanente
         * com seu badge numérico ordinal (1, 2, 3...) exclusivo desta guia (FEAT-21 / Seção 6.105).
         */
        confirmarColagemEMarcarPermanente(textoColado = '', opcoesEstilo = null) {
            if (opcoesEstilo && typeof opcoesEstilo === 'object') {
                this.configurarMarcadorColado(opcoesEstilo);
            }

            /* Encontra a cópia candidata correspondente nesta guia (ou usa a mais recente se textoColado omitido) */
            const txtBusca = String(textoColado || '').trim();
            const txtBuscaNorm = txtBusca.replace(/\s+/g, ' ');
            const digitosBusca = txtBusca.replace(/\D/g, '');

            let candidata = null;
            if (!txtBusca && this._p_copiasCandidatasMarcador.length > 0) {
                candidata = this._p_copiasCandidatasMarcador[0];
            } else {
                for (let i = 0; i < this._p_copiasCandidatasMarcador.length; i++) {
                    const c = this._p_copiasCandidatasMarcador[i];
                    if (c.texto === txtBusca || c.textoNormalizado === txtBuscaNorm || (digitosBusca.length >= 4 && c.digitos === digitosBusca)) {
                        candidata = c;
                        break;
                    }
                }
            }

            if (!candidata || !candidata.range) {
                return null;
            }

            /* Remove imediatamente o contorno Flash temporário (se ainda estiver ativo) */
            this.limparFlashBorderImediatamente();

            if (!this._p_configMarcadorColado.ativo) {
                return null;
            }

            /* Seção 6.138 / FEAT-30: Se existirem marcadores no intervalo, apaga-os e substitui por um novo com novo número */
            for (let j = this._p_marcadoresPermanentes.length - 1; j >= 0; j--) {
                const existente = this._p_marcadoresPermanentes[j];
                if (existente && existente.range && this._p_rangesSeSobrepoem(existente.range, candidata.range)) {
                    this._p_marcadoresPermanentes.splice(j, 1);
                }
            }

            let textoRangeOriginal = '';
            try {
                textoRangeOriginal = String(candidata.range.toString() || '').replace(/\s+/g, ' ').trim();
            } catch (_) { }

            this._p_contadorMarcadoresGuia += 1;
            const marcadorAlvo = {
                id: `jusgov-marcador-colado-${this._p_contadorMarcadoresGuia}`,
                numeroOrdinal: this._p_contadorMarcadoresGuia,
                range: candidata.range.cloneRange(),
                texto: candidata.texto,
                textoRangeOriginal,
                timestamp: Date.now()
            };
            this._p_marcadoresPermanentes.push(marcadorAlvo);

            this._p_garantirOuvintesScrollMarcadoresPermanentes();
            this._p_renderizarTodosMarcadoresPermanentesNoDom();
            return marcadorAlvo;
        }

        _p_agendarAtualizacaoMarcadores() {
            if (this._p_marcadoresPermanentes.length === 0) return;
            if (typeof requestAnimationFrame === 'function') {
                if (this._p_rafScrollMarcadores) return;
                this._p_rafScrollMarcadores = requestAnimationFrame(() => {
                    this._p_rafScrollMarcadores = 0;
                    if (this._p_marcadoresPermanentes.length > 0) {
                        this._p_renderizarTodosMarcadoresPermanentesNoDom();
                    }
                });
            } else {
                this._p_renderizarTodosMarcadoresPermanentesNoDom();
            }
        }

        _p_ehMutacaoDeOverlayVisualProprio(target) {
            if (this._p_uiAncorado && typeof this._p_uiAncorado.ehMutacaoDeOverlayProprio === 'function') {
                return this._p_uiAncorado.ehMutacaoDeOverlayProprio(target);
            }
            const el = (target && target.nodeType === Node.TEXT_NODE) ? target.parentElement : target;
            if (!el || !el.closest) return false;
            return Boolean(el.closest(
                '#jusgov-flash-contour-container, #jusgov-pasted-markers-container, #jusgov-validacao-flutuante, [data-jusgov-flash="true"], [data-jusgov-pasted-container="true"]'
            ));
        }

        _p_iniciarObservadorLayout(estaAtivoFn, aoMudarFn) {
            if (this._p_uiAncorado && typeof this._p_uiAncorado.iniciarObservadorLayoutAncorado === 'function') {
                return this._p_uiAncorado.iniciarObservadorLayoutAncorado(estaAtivoFn, aoMudarFn);
            }
            const desconectarCallbacks = [];
            let encerrado = false;
            const desconectar = () => {
                if (encerrado) return;
                encerrado = true;
                for (const fn of desconectarCallbacks) {
                    try { fn(); } catch (_) { }
                }
                desconectarCallbacks.length = 0;
            };
            const dispararSeAtivo = () => {
                if (encerrado) return;
                if (!estaAtivoFn()) {
                    desconectar();
                    return;
                }
                aoMudarFn();
            };

            const alvoDom = document.body || document.documentElement;
            if (typeof MutationObserver === 'function' && alvoDom) {
                const mutObs = new MutationObserver((muts) => {
                    if (encerrado) return;
                    const relevante = muts.some((m) => !this._p_ehMutacaoDeOverlayVisualProprio(m.target));
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

            const onTransitionEnd = (ev) => {
                if (!this._p_ehMutacaoDeOverlayVisualProprio(ev && ev.target)) dispararSeAtivo();
            };
            document.addEventListener('transitionend', onTransitionEnd, { capture: true, passive: true });
            desconectarCallbacks.push(() => document.removeEventListener('transitionend', onTransitionEnd, true));

            return desconectar;
        }

        _p_garantirOuvintesScrollMarcadoresPermanentes() {
            if (this._p_ouvinteScrollMarcadoresAtivo) return;
            const agendar = () => this._p_agendarAtualizacaoMarcadores();
            const opts = { capture: true, passive: true };
            window.addEventListener('scroll', agendar, opts);
            document.addEventListener('scroll', agendar, opts);
            window.addEventListener('resize', agendar, opts);
            window.addEventListener('hashchange', agendar, opts);
            window.addEventListener('popstate', agendar, opts);
            document.addEventListener('visibilitychange', agendar, opts);

            const desconectarLayoutMarcadores = this._p_iniciarObservadorLayout(
                () => this._p_marcadoresPermanentes.length > 0,
                agendar
            );

            this._p_ouvinteScrollMarcadoresAtivo = true;
            this._p_limparOuvinteScrollMarcadores = () => {
                window.removeEventListener('scroll', agendar, opts);
                document.removeEventListener('scroll', agendar, opts);
                window.removeEventListener('resize', agendar, opts);
                window.removeEventListener('hashchange', agendar, opts);
                window.removeEventListener('popstate', agendar, opts);
                document.removeEventListener('visibilitychange', agendar, opts);
                try { desconectarLayoutMarcadores(); } catch (_) { }
                if (this._p_rafScrollMarcadores && typeof cancelAnimationFrame === 'function') {
                    cancelAnimationFrame(this._p_rafScrollMarcadores);
                    this._p_rafScrollMarcadores = 0;
                }
                this._p_ouvinteScrollMarcadoresAtivo = false;
            };
        }

        /**
         * Verifica se o elemento-âncora do marcador está realmente visível (não oculto por troca de guia/tab, display:none, visibility:hidden ou opacity:0).
         */
        _p_isElementoAlvoVisivel(el) {
            if (!el || !el.isConnected) return false;
            let cur = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            while (cur && cur.nodeType === Node.ELEMENT_NODE && cur !== document.documentElement) {
                if (cur.hasAttribute && cur.hasAttribute('hidden')) return false;
                if (cur.getAttribute && cur.getAttribute('aria-hidden') === 'true') return false;
                if (typeof window.getComputedStyle === 'function') {
                    const st = window.getComputedStyle(cur);
                    if (st.display === 'none' || st.visibility === 'hidden' || st.visibility === 'collapse') return false;
                    if (parseFloat(st.opacity) <= 0.02) return false;
                }
                cur = cur.parentElement;
            }
            return true;
        }

        /**
         * Calcula o retângulo visível do elemento recortado pela viewport e por todos os contêineres ancestrais com rolagem/overflow.
         */
        _p_obterCaixaVisivelRecortada(el) {
            const vw = window.innerWidth || document.documentElement.clientWidth || 2000;
            const vh = window.innerHeight || document.documentElement.clientHeight || 2000;
            let clip = { top: 0, left: 0, right: vw, bottom: vh };
            let cur = (el && el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            while (cur && cur.nodeType === Node.ELEMENT_NODE && cur !== document.documentElement) {
                if (typeof window.getComputedStyle === 'function' && typeof cur.getBoundingClientRect === 'function') {
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
        }

        /**
         * Verifica se o centro de um segmento está realmente exposto na tela (não encoberto por outro painel, modal ou cabeçalho fixo).
         */
        _p_pontoEstaVisivelNoAlvo(x, y, baseEl) {
            if (typeof document.elementsFromPoint !== 'function' || !baseEl) return true;
            try {
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
         * Renderiza no DOM todos os Marcadores Permanentes ativos da guia atual com fundo translúcido
         * que não esconde o texto e badge numérico sobrescrito no canto superior direito (1, 2, 3...).
         */
        _p_renderizarTodosMarcadoresPermanentesNoDom() {
            const idRoot = 'jusgov-pasted-markers-container';
            let container = document.getElementById(idRoot);

            /* Remove definitivamente marcadores cujo nó DOM foi destruído ou teve o texto alterado */
            for (let k = this._p_marcadoresPermanentes.length - 1; k >= 0; k--) {
                const m = this._p_marcadoresPermanentes[k];
                let valido = Boolean(m && m.range && m.range.startContainer && m.range.endContainer && m.range.startContainer.isConnected && m.range.endContainer.isConnected);
                if (valido && m.textoRangeOriginal) {
                    try {
                        const txtAtual = String(m.range.toString() || '').replace(/\s+/g, ' ').trim();
                        if (!txtAtual || txtAtual !== m.textoRangeOriginal) {
                            valido = false;
                        }
                    } catch (_) {
                        valido = false;
                    }
                }
                if (!valido) {
                    this._p_marcadoresPermanentes.splice(k, 1);
                }
            }

            if (!this._p_configMarcadorColado.ativo || this._p_marcadoresPermanentes.length === 0) {
                if (container && container.parentNode) container.parentNode.removeChild(container);
                if (this._p_marcadoresPermanentes.length === 0 && typeof this._p_limparOuvinteScrollMarcadores === 'function') {
                    this._p_limparOuvinteScrollMarcadores();
                    this._p_limparOuvinteScrollMarcadores = null;
                }
                return;
            }
            if (!container) {
                container = document.createElement('div');
                container.id = idRoot;
                container.setAttribute('data-jusgov-ignore', 'true');
                container.setAttribute('data-jusgov-pasted-container', 'true');
                container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none !important;z-index:2147483645;border:none;margin:0;padding:0;overflow:visible;';
                (document.body || document.documentElement).appendChild(container);
            }
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            const cfg = this._p_configMarcadorColado;
            const corContorno = cfg.corContorno || '#0d9488';
            const corFundoRgba = this.converterHexParaRgbaFlash(cfg.corFundo || '#ccfbf1', cfg.opacidadeFundo || 0.28).rgba;
            const estiloBadge = cfg.estiloBadge || 'sobrescrito';
            const tipoContorno = cfg.tipoContorno || 'solido';

            for (let mIdx = 0; mIdx < this._p_marcadoresPermanentes.length; mIdx++) {
                const marcador = this._p_marcadoresPermanentes[mIdx];
                if (!marcador || !marcador.range) continue;
                const noBase = marcador.range.startContainer;
                const elBase = (noBase.nodeType === Node.TEXT_NODE) ? noBase.parentElement : noBase;
                if (!this._p_isElementoAlvoVisivel(elBase)) continue;
                const caixaClip = this._p_obterCaixaVisivelRecortada(elBase);
                if (!caixaClip) continue;

                const segmentosBrutos = this.calcularLinhasDoRange(marcador.range);
                if (segmentosBrutos.length === 0) continue;

                const segmentos = [];
                for (let sIdx = 0; sIdx < segmentosBrutos.length; sIdx++) {
                    const seg = segmentosBrutos[sIdx];
                    const l = Math.max(seg.left, caixaClip.left);
                    const r = Math.min(seg.right, caixaClip.right);
                    const t = Math.max(seg.top, caixaClip.top);
                    const b = Math.min(seg.bottom, caixaClip.bottom);
                    if ((r - l) > 1.5 && (b - t) > 1.5) {
                        segmentos.push({ left: l, right: r, top: t, bottom: b });
                    }
                }
                if (segmentos.length === 0) continue;

                const segRef = segmentos[0];
                if (!this._p_pontoEstaVisivelNoAlvo((segRef.left + segRef.right) / 2, (segRef.top + segRef.bottom) / 2, elBase)) {
                    continue;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'jusgov-marcador-colado-item';
                wrapper.setAttribute('data-jusgov-ignore', 'true');
                wrapper.setAttribute('data-jusgov-ordinal', String(marcador.numeroOrdinal));
                wrapper.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none !important;overflow:visible;';

                /* Renderização contínua em polígono SVG para quebras de linha quando contorno sólido/tracejado/sem_borda */
                const blocos = this.agruparLinhasEmBlocos(segmentos);
                if ((tipoContorno === 'solido' || tipoContorno === 'tracejado' || tipoContorno === 'sem_borda') && blocos.some(b => b.length > 1)) {
                    for (let b = 0; b < blocos.length; b++) {
                        const linhas = blocos[b];
                        if (linhas.length === 1) {
                            const r = linhas[0];
                            const box = document.createElement('div');
                            box.className = 'jusgov-marcador-colado-box';
                            box.setAttribute('data-jusgov-ignore', 'true');
                            const estiloBorda = tipoContorno === 'sem_borda'
                                ? 'border:none'
                                : `border:1.5px ${tipoContorno === 'tracejado' ? 'dashed' : 'solid'} ${corContorno}`;
                            box.style.cssText = [
                                'position:fixed',
                                `top:${Math.round(r.top - 1)}px`,
                                `left:${Math.round(r.left - 2)}px`,
                                `width:${Math.max(1, Math.round(r.right - r.left + 4))}px`,
                                `height:${Math.max(1, Math.round(r.bottom - r.top + 2))}px`,
                                estiloBorda,
                                'border-radius:3px',
                                `background-color:${corFundoRgba}`,
                                'pointer-events:none !important',
                                'box-sizing:border-box',
                                'margin:0',
                                'padding:0'
                            ].join(';') + ';';
                            wrapper.appendChild(box);
                            continue;
                        }
                        const n = linhas.length;
                        const L = linhas.map(l => l.left - 2);
                        const R = linhas.map(l => l.right + 2);
                        const Y = [];
                        for (let i = 0; i < n - 1; i++) Y.push((linhas[i].bottom + linhas[i + 1].top) / 2);
                        const topo = linhas[0].top - 1;
                        const base = linhas[n - 1].bottom + 1;
                        const pts = [[L[0], topo], [R[0], topo]];
                        for (let i = 0; i < n - 1; i++) { pts.push([R[i], Y[i]]); pts.push([R[i + 1], Y[i]]); }
                        pts.push([R[n - 1], base]); pts.push([L[n - 1], base]);
                        for (let i = n - 2; i >= 0; i--) { pts.push([L[i + 1], Y[i]]); pts.push([L[i], Y[i]]); }
                        const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
                        const svgNS = 'http://www.w3.org/2000/svg';
                        const svg = document.createElementNS(svgNS, 'svg');
                        svg.setAttribute('data-jusgov-ignore', 'true');
                        svg.style.cssText = `position:fixed;top:0;left:0;width:${window.innerWidth}px;height:${window.innerHeight}px;pointer-events:none !important;overflow:visible;margin:0;padding:0;`;
                        const path = document.createElementNS(svgNS, 'path');
                        path.setAttribute('d', d);
                        path.setAttribute('fill', corFundoRgba);
                        path.setAttribute('stroke', tipoContorno === 'sem_borda' ? 'none' : corContorno);
                        path.setAttribute('stroke-width', tipoContorno === 'sem_borda' ? '0' : '1.5');
                        if (tipoContorno === 'tracejado') path.setAttribute('stroke-dasharray', '4 3');
                        path.setAttribute('stroke-linejoin', 'round');
                        svg.appendChild(path);
                        wrapper.appendChild(svg);
                    }
                } else {
                    for (let s = 0; s < segmentos.length; s++) {
                        const r = segmentos[s];
                        const box = document.createElement('div');
                        box.className = 'jusgov-marcador-colado-box';
                        box.setAttribute('data-jusgov-ignore', 'true');
                        let cssContorno = `border:1.5px solid ${corContorno};background-color:${corFundoRgba};`;
                        if (tipoContorno === 'tracejado') {
                            cssContorno = `border:1.5px dashed ${corContorno};background-color:${corFundoRgba};`;
                        } else if (tipoContorno === 'sem_borda') {
                            cssContorno = `border:none;background-color:${corFundoRgba};`;
                        } else if (tipoContorno === 'ondulado') {
                            cssContorno = `border:none;border-bottom:2px wavy ${corContorno};background-color:${corFundoRgba};`;
                        } else if (tipoContorno === 'taxado') {
                            cssContorno = `border:none;background-color:${corFundoRgba};`;
                            const riscado = document.createElement('div');
                            riscado.style.cssText = `position:absolute;left:0;right:0;top:50%;height:1.5px;background:${corContorno};pointer-events:none !important;`;
                            box.appendChild(riscado);
                        }
                        box.style.cssText = [
                            'position:fixed',
                            `top:${Math.round(r.top - 1)}px`,
                            `left:${Math.round(r.left - 2)}px`,
                            `width:${Math.max(1, Math.round(r.right - r.left + 4))}px`,
                            `height:${Math.max(1, Math.round(r.bottom - r.top + 2))}px`,
                            cssContorno,
                            'border-radius:3px',
                            'pointer-events:none !important',
                            'box-sizing:border-box',
                            'margin:0',
                            'padding:0'
                        ].join(';') + ';';
                        wrapper.appendChild(box);
                    }
                }

                /* Badge ordinal sobrescrito clicável para fechar o marcador (mantendo contador) */
                if (estiloBadge !== 'sem_etiqueta') {
                    const segTopo = segmentos[0];
                    const badge = document.createElement('sup');
                    badge.className = 'jusgov-marcador-colado-badge';
                    badge.setAttribute('data-jusgov-ignore', 'true');
                    badge.title = 'Clique para remover este marcador';
                    badge.textContent = String(marcador.numeroOrdinal);

                    const baseBadgeCss = [
                        'position:fixed',
                        `top:${Math.round(segTopo.top - 8)}px`,
                        `left:${Math.round(segTopo.right - 2)}px`,
                        'font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif',
                        'font-weight:800',
                        'line-height:1',
                        'pointer-events:auto !important',
                        'cursor:pointer',
                        'user-select:none',
                        'z-index:2147483646'
                    ];

                    const raioBadge = (estiloBadge.startsWith('retangular_') || estiloBadge === 'sobrescrito_retangular') ? '3px' : '999px';
                    if (estiloBadge === 'circular' || estiloBadge === 'retangular_compacto') {
                        baseBadgeCss.push(
                            'display:inline-flex',
                            'align-items:center',
                            'justify-content:center',
                            'font-size:9px',
                            `background-color:${corContorno}`,
                            'color:#ffffff',
                            `border-radius:${raioBadge}`,
                            'min-width:15px',
                            'height:15px',
                            'padding:0 3.5px',
                            'box-sizing:border-box',
                            'box-shadow:0 1px 3px rgba(0,0,0,0.22)'
                        );
                    } else if (estiloBadge === 'translucido' || estiloBadge === 'retangular_translucido') {
                        const fundoTranslucido = this.converterHexParaRgbaFlash(corContorno, 0.16).rgba;
                        const bordaTranslucida = this.converterHexParaRgbaFlash(corContorno, 0.45).rgba;
                        baseBadgeCss.push(
                            'display:inline-flex',
                            'align-items:center',
                            'justify-content:center',
                            'font-size:9px',
                            `color:${corContorno}`,
                            `background-color:${fundoTranslucido}`,
                            `border:1px solid ${bordaTranslucida}`,
                            `border-radius:${raioBadge}`,
                            'min-width:15px',
                            'height:15px',
                            'padding:0 3.5px',
                            'box-sizing:border-box',
                            'opacity:0.82'
                        );
                    } else if (estiloBadge === 'apenas_numeral') {
                        baseBadgeCss.push(
                            'display:inline-flex',
                            'align-items:center',
                            'justify-content:center',
                            'font-size:10px',
                            `color:${corContorno}`,
                            'background:transparent',
                            'border:none',
                            'border-radius:0',
                            'min-width:auto',
                            'height:auto',
                            'padding:0 1px',
                            'box-sizing:border-box',
                            'box-shadow:none',
                            'text-shadow:0 0 2px rgba(255,255,255,0.85)'
                        );
                    } else {
                        baseBadgeCss.push(
                            'display:inline-flex',
                            'align-items:center',
                            'justify-content:center',
                            'font-size:9px',
                            `color:${corContorno}`,
                            'background-color:rgba(255,255,255,0.88)',
                            `border:1px solid ${corContorno}`,
                            `border-radius:${raioBadge}`,
                            'min-width:14px',
                            'height:14px',
                            'padding:0 3px',
                            'box-sizing:border-box',
                            'box-shadow:0 1px 2px rgba(0,0,0,0.12)'
                        );
                    }

                    badge.style.cssText = baseBadgeCss.join(';') + ';';
                    badge.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        this.removerMarcadorPermanentePorId(marcador.id);
                    });
                    wrapper.appendChild(badge);
                }
                container.appendChild(wrapper);
            }
        }
    }

    Object.freeze(CopiaVisualMarcadores.prototype);
    return Object.freeze(CopiaVisualMarcadores);
}));
