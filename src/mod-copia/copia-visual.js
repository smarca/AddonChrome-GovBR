/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-visual.js
 * CLASSE: FeedbackVisual
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-visual.js
 * - Classe Exportada: FeedbackVisual (window.JusGovFeedbackVisual)
 * - Métodos Públicos: converterHexParaRgbaFlash(hexBruto, alfa), limparFlashBorderImediatamente(), limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip, validador), agendarRetiradaFlashAposDesselecao(preservarMiniTip, validador), calcularLinhasDoRange(rangeAlvo), agruparLinhasEmBlocos(segmentos), dispararFlashBorderVisual(rangeAlvo, duracaoMs, corFlashBorder), projetarMiniTipGlobal(mensagem, corBorda, validador), configurarMarcadorColado(opcoes), registrarCopiaCandidataParaMarcador(rangeAlvo, textoCopiado), confirmarColagemEMarcarPermanente(textoColado, opcoesEstilo), limparMarcadoresPermanentes(), obterContagemMarcadoresPermanentes(), obterMarcadoresPermanentes()
 * - Dependências Injetadas: window.JusGovValidadorAtivo (AvisoFlutuante)
 * - Regras / Seções: Regra 2.7 (Feedback Visual), Seção 6.15 (SVG polígono contíguo), BUG-02, Seção 6.64 (blindagem POO), Seção 6.105 (FEAT-21 / VIS-01 Marcadores Permanentes de Conteúdo Colado), Seção 6.114 (BUG-45 / USAB-13 Ancoragem de Flash ao Texto sob Rolagem e Regra de Permanência em Até Interação), Seção 6.117 (BUG-47 / USAB-16 Ignorar Insert)
 * 
 * FINALIDADE:
 * Gerenciamento centralizado do feedback visual no DOM após seleção/cópia inteligente:
 * - Desenho de contorno dinâmico Flash Border (verde/customizado) com SVG polígono contíguo multilinhas ancorado fisicamente ao texto sob rolagem.
 * - Marcadores permanentes na página de conteúdo efetivamente colado com badge ordinal sobrescrito por guia (1, 2, 3...) e fusão/expansão inteligente de intervalos sobrepostos.
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
 * 4. Respeita o timer configurável (0ms a 5000ms) ou -1 ("Até Interação": permanece até nova cópia
 *    bem-sucedida em qualquer guia, substituição por marcador de colagem ou tecla Escape).
 * 5. Ancoragem física sob rolagem (BUG-45): tanto o contorno Flash quanto os marcadores permanentes
 *    recalculam suas coordenadas a partir do Range DOM vivo durante eventos de scroll/resize.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.7: Feedback Visual Discreto)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 4.2: Polígonos SVG e Flash Multi-Linhas)
 * - docs/03_BACKLOG_TAREFAS_E_FEATURES.md (Seções 6.105, 6.114 e 6.117)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFeedbackVisual) {
        return;
    }

    const PRESETS_PADRAO_MARCADOR = Object.freeze({
        verde_forense: Object.freeze({ corContorno: '#0d9488', corFundo: '#ccfbf1', opacidadeFundo: 0.28, estiloBadge: 'sobrescrito' }),
        marca_texto: Object.freeze({ corContorno: '#eab308', corFundo: '#fef08a', opacidadeFundo: 0.36, estiloBadge: 'sobrescrito' }),
        azul_indigo: Object.freeze({ corContorno: '#4f46e5', corFundo: '#e0e7ff', opacidadeFundo: 0.28, estiloBadge: 'circular' }),
        ambar_suave: Object.freeze({ corContorno: '#d97706', corFundo: '#fde68a', opacidadeFundo: 0.30, estiloBadge: 'translucido' }),
        alto_contraste: Object.freeze({ corContorno: '#1e293b', corFundo: '#facc15', opacidadeFundo: 0.42, estiloBadge: 'circular' })
    });

    class FeedbackVisual {
        #timerFlashBorder;
        #aguardandoDesselecaoFlash;
        #timestampCriacaoFlash;
        #limparOuvintesInteracaoFlash;
        #segmentosAtuaisFlash;
        #rangeAtivoFlash;
        #corAtivaFlash;
        #duracaoAtivaFlash;
        #rafScrollFlash;
        #copiasCandidatasMarcador;
        #marcadoresPermanentes;
        #contadorMarcadoresGuia;
        #configMarcadorColado;
        #ouvinteScrollMarcadoresAtivo;
        #limparOuvinteScrollMarcadores;
        #rafScrollMarcadores;

        constructor() {
            this.#timerFlashBorder = null;
            this.#aguardandoDesselecaoFlash = false;
            this.#timestampCriacaoFlash = 0;
            this.#limparOuvintesInteracaoFlash = null;
            this.#segmentosAtuaisFlash = [];
            this.#rangeAtivoFlash = null;
            this.#corAtivaFlash = '#0d9488';
            this.#duracaoAtivaFlash = 0;
            this.#rafScrollFlash = 0;
            this.#copiasCandidatasMarcador = [];
            this.#marcadoresPermanentes = [];
            this.#contadorMarcadoresGuia = 0;
            this.#configMarcadorColado = {
                ativo: true,
                preset: 'verde_forense',
                corContorno: '#0d9488',
                corFundo: '#ccfbf1',
                opacidadeFundo: 0.28,
                estiloBadge: 'sobrescrito',
                tipoContorno: 'solido'
            };
            this.#ouvinteScrollMarcadoresAtivo = false;
            this.#limparOuvinteScrollMarcadores = null;
            this.#rafScrollMarcadores = 0;
        }

        get aguardandoDesselecaoFlash() {
            return this.#aguardandoDesselecaoFlash;
        }

        get timestampCriacaoFlash() {
            return this.#timestampCriacaoFlash;
        }

        get rangeAtivoFlash() {
            return this.#rangeAtivoFlash;
        }

        /**
         * Configura as preferências visuais dos Marcadores Permanentes de Conteúdo Colado (FEAT-21 / Seção 6.105).
         */
        configurarMarcadorColado(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            if (typeof opcoes.ativo === 'boolean') {
                this.#configMarcadorColado.ativo = opcoes.ativo;
            } else if (typeof opcoes.marcadorConteudoColadoAtivo === 'boolean') {
                this.#configMarcadorColado.ativo = opcoes.marcadorConteudoColadoAtivo;
            }
            const presetChave = opcoes.preset || opcoes.presetMarcadorColado;
            if (typeof presetChave === 'string' && PRESETS_PADRAO_MARCADOR[presetChave]) {
                this.#configMarcadorColado.preset = presetChave;
                const p = PRESETS_PADRAO_MARCADOR[presetChave];
                if (!opcoes.corContorno && !opcoes.corContornoMarcadorColado) this.#configMarcadorColado.corContorno = p.corContorno;
                if (!opcoes.corFundo && !opcoes.corFundoMarcadorColado) this.#configMarcadorColado.corFundo = p.corFundo;
                if (opcoes.opacidadeFundo === undefined && opcoes.opacidadeFundoMarcadorColado === undefined) this.#configMarcadorColado.opacidadeFundo = p.opacidadeFundo;
                if (!opcoes.estiloBadge && !opcoes.estiloBadgeMarcadorColado) this.#configMarcadorColado.estiloBadge = p.estiloBadge;
            }
            const corContorno = opcoes.corContorno || opcoes.corContornoMarcadorColado;
            if (typeof corContorno === 'string' && /^#[0-9a-fA-F]{6}$/.test(corContorno.trim())) {
                this.#configMarcadorColado.corContorno = corContorno.trim().toLowerCase();
            }
            const corFundo = opcoes.corFundo || opcoes.corFundoMarcadorColado;
            if (typeof corFundo === 'string' && /^#[0-9a-fA-F]{6}$/.test(corFundo.trim())) {
                this.#configMarcadorColado.corFundo = corFundo.trim().toLowerCase();
            }
            const opacidade = (opcoes.opacidadeFundo !== undefined) ? opcoes.opacidadeFundo : opcoes.opacidadeFundoMarcadorColado;
            if (Number.isFinite(Number(opacidade))) {
                this.#configMarcadorColado.opacidadeFundo = Math.max(0.05, Math.min(0.85, Number(opacidade)));
            }
            const estiloBadge = opcoes.estiloBadge || opcoes.estiloBadgeMarcadorColado;
            if (['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto'].includes(estiloBadge)) {
                this.#configMarcadorColado.estiloBadge = estiloBadge;
            } else if (['chip', 'bolinha', 'pilula'].includes(estiloBadge)) {
                this.#configMarcadorColado.estiloBadge = 'sobrescrito';
            }
            const tipoContorno = opcoes.tipoContorno || opcoes.tipoContornoMarcadorColado;
            if (['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(tipoContorno)) {
                this.#configMarcadorColado.tipoContorno = tipoContorno;
            }
            if (!this.#configMarcadorColado.ativo) {
                this.limparMarcadoresPermanentes();
            } else if (this.#marcadoresPermanentes.length > 0) {
                this.#renderizarTodosMarcadoresPermanentesNoDom();
            }
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
            if (typeof this.#limparOuvintesInteracaoFlash === 'function') {
                this.#limparOuvintesInteracaoFlash();
                this.#limparOuvintesInteracaoFlash = null;
            }
            if (this.#timerFlashBorder) {
                clearTimeout(this.#timerFlashBorder);
                this.#timerFlashBorder = null;
            }
            if (this.#rafScrollFlash && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(this.#rafScrollFlash);
                this.#rafScrollFlash = 0;
            }
            this.#aguardandoDesselecaoFlash = false;
            this.#segmentosAtuaisFlash = [];
            this.#rangeAtivoFlash = null;
            this.#duracaoAtivaFlash = 0;

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
         * No modo "Até Interação" (duracaoAtivaFlash === -1), preserva o Flash Border contra
         * desseleções comuns de clique (Seção 6.114 / BUG-45), limpando apenas os avisos se solicitado.
         */
        agendarRetiradaFlashAposDesselecao(preservarMiniTip = false, validador = null, forcarLimpezaFlash = false) {
            if (forcarLimpezaFlash || (this.#duracaoAtivaFlash !== -1 && (this.#aguardandoDesselecaoFlash || this.#timerFlashBorder))) {
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
         * Renderiza internamente as caixas / polígonos SVG do Flash Border a partir do #rangeAtivoFlash.
         * Chamado na criação e em cada atualização de rolagem (Scroll Sync - BUG-45).
         */
        #renderizarGeometriaFlashNoContainer(container, rangeAlvo, corBorda) {
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

        /**
         * Recalcula imediatamente a posição do Flash Border ativo durante rolagem ou redimensionamento (BUG-45).
         */
        atualizarPosicaoFlashSobRolagem() {
            if (!this.#aguardandoDesselecaoFlash || !this.#rangeAtivoFlash) return;
            const container = document.getElementById('jusgov-flash-contour-container');
            if (!container) return;
            const segmentos = this.#renderizarGeometriaFlashNoContainer(container, this.#rangeAtivoFlash, this.#corAtivaFlash);
            this.#segmentosAtuaisFlash = Array.isArray(segmentos) ? segmentos : [];
        }

        /**
         * Dispara o contorno visual temporário de Flash Border sobre o Range.
         * Ancorado fisicamente ao texto sob rolagem (BUG-45) e com suporte estrito ao modo "Até Interação" (-1).
         */
        dispararFlashBorderVisual(rangeAlvo, duracaoMs = 500, corFlashBorder = '#0d9488') {
            this.limparFlashBorderImediatamente();
            if (duracaoMs === 0 || !rangeAlvo) return;

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

                const segmentos = this.#renderizarGeometriaFlashNoContainer(container, rangeClonado, corBorda);
                if (segmentos.length === 0) {
                    if (container.parentNode) container.parentNode.removeChild(container);
                    return;
                }

                this.#rangeAtivoFlash = rangeClonado;
                this.#corAtivaFlash = corBorda;
                this.#duracaoAtivaFlash = duracaoMs;
                this.#aguardandoDesselecaoFlash = true;
                const timestampInicio = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                    ? performance.now()
                    : Date.now();
                this.#timestampCriacaoFlash = timestampInicio;
                this.#segmentosAtuaisFlash = Array.isArray(segmentos) ? segmentos : [];

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
                    if (typeof cx !== 'number' || typeof cy !== 'number' || !Array.isArray(this.#segmentosAtuaisFlash)) {
                        return false;
                    }
                    return this.#segmentosAtuaisFlash.some((s) =>
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
                        return;
                    }
                    /* Seção 6.136 / BUG-54: Clique dentro do contorno NÃO o retira (permite expandir/diminuir);
                     * clique fora do contorno limpa imediatamente no modo temporizado/interação. */
                    if (!pontoEstaDentroDoFlashAtual(e.clientX, e.clientY) && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                        this.limparFlashBorderImediatamente();
                    }
                };

                const tratarCopiaOuSelecaoGlobalFlash = (e) => {
                    if (e && e.type === 'selectstart' && e.target && this.#segmentosAtuaisFlash.length > 0) {
                        try {
                            const r = typeof e.target.getBoundingClientRect === 'function' ? e.target.getBoundingClientRect() : null;
                            if (r && pontoEstaDentroDoFlashAtual((r.left + r.right) / 2, (r.top + r.bottom) / 2)) {
                                return;
                            }
                        } catch (_) { }
                    }
                    this.limparFlashBorderImediatamente();
                };

                const tratarScrollOuResizeFlash = () => {
                    this.atualizarPosicaoFlashSobRolagem();
                };

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

                this.#limparOuvintesInteracaoFlash = () => {
                    document.removeEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                    window.removeEventListener('keydown', tratarKeyDownGlobalFlash, opts);
                    document.removeEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                    window.removeEventListener('mousedown', tratarMouseDownGlobalFlash, opts);
                    document.removeEventListener('copy', tratarCopiaOuSelecaoGlobalFlash, opts);
                    document.removeEventListener('selectstart', tratarCopiaOuSelecaoGlobalFlash, opts);
                    window.removeEventListener('scroll', tratarScrollOuResizeFlash, opts);
                    document.removeEventListener('scroll', tratarScrollOuResizeFlash, opts);
                    window.removeEventListener('resize', tratarScrollOuResizeFlash, opts);
                };

                if (duracaoMs > 0) {
                    /* Modo Temporizado: o Flash desaparece automaticamente no tempo configurado */
                    this.#timerFlashBorder = setTimeout(() => {
                        this.limparFlashBorderImediatamente();
                    }, duracaoMs);
                }
            } catch (_) { }
        }

        /**
         * Registra uma seleção/cópia candidata que poderá se tornar um Marcador Permanente
         * caso venha a ser efetivamente colada pelo usuário (FEAT-21 / Seção 6.105).
         */
        registrarCopiaCandidataParaMarcador(rangeAlvo, textoCopiado) {
            if (!rangeAlvo || typeof rangeAlvo.cloneRange !== 'function') return;
            const textoLimpo = String(textoCopiado || '').trim();
            if (!textoLimpo) return;
            try {
                const clone = rangeAlvo.cloneRange();
                /* Mantém histórico das últimas 2 cópias da guia (para suportar colagem do Slot 1 e do Slot 2) */
                if (this.#copiasCandidatasMarcador.length > 0 && this.#copiasCandidatasMarcador[0].texto === textoLimpo) {
                    this.#copiasCandidatasMarcador[0].range = clone;
                    this.#copiasCandidatasMarcador[0].timestamp = Date.now();
                    return;
                }
                this.#copiasCandidatasMarcador.unshift({
                    texto: textoLimpo,
                    textoNormalizado: textoLimpo.replace(/\s+/g, ' '),
                    digitos: textoLimpo.replace(/\D/g, ''),
                    range: clone,
                    timestamp: Date.now()
                });
                if (this.#copiasCandidatasMarcador.length > 4) {
                    this.#copiasCandidatasMarcador.length = 4;
                }
            } catch (_) { }
        }

        /**
         * Verifica se dois Ranges DOM se sobrepõem ou intersectam no mesmo bloco de texto.
         */
        #rangesSeSobrepoem(r1, r2) {
            if (!r1 || !r2 || typeof r1.compareBoundaryPoints !== 'function' || typeof r2.compareBoundaryPoints !== 'function') {
                return false;
            }
            try {
                /* Em DOM Range:
                 * r1.compareBoundaryPoints(Range.END_TO_START, r2) compara r1.start com r2.end (deve ser <= 0)
                 * r1.compareBoundaryPoints(Range.START_TO_END, r2) compara r1.end com r2.start (deve ser >= 0) */
                const ini1AntesOuIgualFim2 = r1.compareBoundaryPoints(Range.END_TO_START, r2) <= 0;
                const fim1DepoisOuIgualIni2 = r1.compareBoundaryPoints(Range.START_TO_END, r2) >= 0;
                return ini1AntesOuIgualFim2 && fim1DepoisOuIgualIni2;
            } catch (_) {
                return false;
            }
        }

        /**
         * Funde dois Ranges sobrepostos num único Range expandido que abrange ambos (FEAT-21).
         */
        #fundirRangesSobrepostos(rBase, rNovo) {
            try {
                const fundido = rBase.cloneRange();
                if (rNovo.compareBoundaryPoints(Range.START_TO_START, fundido) < 0) {
                    fundido.setStart(rNovo.startContainer, rNovo.startOffset);
                }
                if (rNovo.compareBoundaryPoints(Range.END_TO_END, fundido) > 0) {
                    fundido.setEnd(rNovo.endContainer, rNovo.endOffset);
                }
                return fundido;
            } catch (_) {
                return rNovo.cloneRange();
            }
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
            if (!txtBusca && this.#copiasCandidatasMarcador.length > 0) {
                candidata = this.#copiasCandidatasMarcador[0];
            } else {
                for (let i = 0; i < this.#copiasCandidatasMarcador.length; i++) {
                    const c = this.#copiasCandidatasMarcador[i];
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

            if (!this.#configMarcadorColado.ativo) {
                return null;
            }

            /* Seção 6.138 / FEAT-30: Se existirem marcadores no intervalo, apaga-os e substitui por um novo com novo número */
            for (let j = this.#marcadoresPermanentes.length - 1; j >= 0; j--) {
                const existente = this.#marcadoresPermanentes[j];
                if (existente && existente.range && this.#rangesSeSobrepoem(existente.range, candidata.range)) {
                    this.#marcadoresPermanentes.splice(j, 1);
                }
            }

            let textoRangeOriginal = '';
            try {
                textoRangeOriginal = String(candidata.range.toString() || '').replace(/\s+/g, ' ').trim();
            } catch (_) { }

            this.#contadorMarcadoresGuia += 1;
            const marcadorAlvo = {
                id: `jusgov-marcador-colado-${this.#contadorMarcadoresGuia}`,
                numeroOrdinal: this.#contadorMarcadoresGuia,
                range: candidata.range.cloneRange(),
                texto: candidata.texto,
                textoRangeOriginal,
                timestamp: Date.now()
            };
            this.#marcadoresPermanentes.push(marcadorAlvo);

            this.#garantirOuvintesScrollMarcadoresPermanentes();
            this.#renderizarTodosMarcadoresPermanentesNoDom();
            return marcadorAlvo;
        }

        #agendarAtualizacaoMarcadores() {
            if (this.#marcadoresPermanentes.length === 0) return;
            if (typeof requestAnimationFrame === 'function') {
                if (this.#rafScrollMarcadores) return;
                this.#rafScrollMarcadores = requestAnimationFrame(() => {
                    this.#rafScrollMarcadores = 0;
                    if (this.#marcadoresPermanentes.length > 0) {
                        this.#renderizarTodosMarcadoresPermanentesNoDom();
                    }
                });
            } else {
                this.#renderizarTodosMarcadoresPermanentesNoDom();
            }
        }

        #garantirOuvintesScrollMarcadoresPermanentes() {
            if (this.#ouvinteScrollMarcadoresAtivo) return;
            const atualizarImediato = () => {
                if (this.#marcadoresPermanentes.length === 0) return;
                this.#renderizarTodosMarcadoresPermanentesNoDom();
            };
            const agendar = () => this.#agendarAtualizacaoMarcadores();
            const opts = { capture: true, passive: true };
            window.addEventListener('scroll', atualizarImediato, opts);
            document.addEventListener('scroll', atualizarImediato, opts);
            window.addEventListener('resize', atualizarImediato, opts);
            window.addEventListener('hashchange', agendar, opts);
            window.addEventListener('popstate', agendar, opts);
            document.addEventListener('transitionend', agendar, opts);
            document.addEventListener('visibilitychange', agendar, opts);

            let observerDom = null;
            if (typeof MutationObserver === 'function' && (document.body || document.documentElement)) {
                observerDom = new MutationObserver((muts) => {
                    if (this.#marcadoresPermanentes.length === 0) return;
                    const relevante = muts.some((m) => {
                        const t = m.target;
                        const el = (t && t.nodeType === Node.TEXT_NODE) ? t.parentElement : t;
                        return !(el && el.closest && el.closest('[data-jusgov-ignore="true"]'));
                    });
                    if (relevante) agendar();
                });
                try {
                    observerDom.observe(document.body || document.documentElement, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributes: true,
                        attributeFilter: ['style', 'class', 'hidden', 'aria-hidden', 'aria-selected', 'aria-expanded', 'disabled']
                    });
                } catch (_) {
                    observerDom = null;
                }
            }

            this.#ouvinteScrollMarcadoresAtivo = true;
            this.#limparOuvinteScrollMarcadores = () => {
                window.removeEventListener('scroll', atualizarImediato, opts);
                document.removeEventListener('scroll', atualizarImediato, opts);
                window.removeEventListener('resize', atualizarImediato, opts);
                window.removeEventListener('hashchange', agendar, opts);
                window.removeEventListener('popstate', agendar, opts);
                document.removeEventListener('transitionend', agendar, opts);
                document.removeEventListener('visibilitychange', agendar, opts);
                if (observerDom) {
                    try { observerDom.disconnect(); } catch (_) { }
                    observerDom = null;
                }
                if (this.#rafScrollMarcadores && typeof cancelAnimationFrame === 'function') {
                    cancelAnimationFrame(this.#rafScrollMarcadores);
                    this.#rafScrollMarcadores = 0;
                }
                this.#ouvinteScrollMarcadoresAtivo = false;
            };
        }

        /**
         * Verifica se o elemento-âncora do marcador está realmente visível (não oculto por troca de guia/tab, display:none, visibility:hidden ou opacity:0).
         */
        #isElementoAlvoVisivel(el) {
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
        #obterCaixaVisivelRecortada(el) {
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
        #pontoEstaVisivelNoAlvo(x, y, baseEl) {
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
        #renderizarTodosMarcadoresPermanentesNoDom() {
            const idRoot = 'jusgov-pasted-markers-container';
            let container = document.getElementById(idRoot);

            /* Remove definitivamente marcadores cujo nó DOM foi destruído ou teve o texto alterado */
            for (let k = this.#marcadoresPermanentes.length - 1; k >= 0; k--) {
                const m = this.#marcadoresPermanentes[k];
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
                    this.#marcadoresPermanentes.splice(k, 1);
                }
            }

            if (!this.#configMarcadorColado.ativo || this.#marcadoresPermanentes.length === 0) {
                if (container && container.parentNode) container.parentNode.removeChild(container);
                if (this.#marcadoresPermanentes.length === 0 && typeof this.#limparOuvinteScrollMarcadores === 'function') {
                    this.#limparOuvinteScrollMarcadores();
                    this.#limparOuvinteScrollMarcadores = null;
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

            const cfg = this.#configMarcadorColado;
            const corContorno = cfg.corContorno || '#0d9488';
            const corFundoRgba = this.converterHexParaRgbaFlash(cfg.corFundo || '#ccfbf1', cfg.opacidadeFundo || 0.28).rgba;
            const estiloBadge = cfg.estiloBadge || 'sobrescrito';
            const tipoContorno = cfg.tipoContorno || 'solido';

            for (let mIdx = 0; mIdx < this.#marcadoresPermanentes.length; mIdx++) {
                const marcador = this.#marcadoresPermanentes[mIdx];
                if (!marcador || !marcador.range) continue;
                const noBase = marcador.range.startContainer;
                const elBase = (noBase.nodeType === Node.TEXT_NODE) ? noBase.parentElement : noBase;
                if (!this.#isElementoAlvoVisivel(elBase)) continue;
                const caixaClip = this.#obterCaixaVisivelRecortada(elBase);
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
                if (!this.#pontoEstaVisivelNoAlvo((segRef.left + segRef.right) / 2, (segRef.top + segRef.bottom) / 2, elBase)) {
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

        /**
         * Remove um marcador permanente específico pelo ID sem zerar a contagem sequencial (Seção 6.138).
         */
        removerMarcadorPermanentePorId(idMarcador) {
            const idx = this.#marcadoresPermanentes.findIndex((m) => m && m.id === idMarcador);
            if (idx === -1) return false;
            this.#marcadoresPermanentes.splice(idx, 1);
            this.#renderizarTodosMarcadoresPermanentesNoDom();
            return true;
        }

        /**
         * Remove todos os marcadores permanentes de conteúdo colado e reinicia a contagem da guia.
         */
        limparMarcadoresPermanentes() {
            this.#marcadoresPermanentes = [];
            this.#contadorMarcadoresGuia = 0;
            this.#copiasCandidatasMarcador = [];
            if (typeof this.#limparOuvinteScrollMarcadores === 'function') {
                this.#limparOuvinteScrollMarcadores();
                this.#limparOuvinteScrollMarcadores = null;
            }
            try {
                const containers = document.querySelectorAll('#jusgov-pasted-markers-container, [data-jusgov-pasted-container="true"]');
                for (let i = 0; i < containers.length; i++) {
                    if (containers[i] && containers[i].parentNode) {
                        containers[i].parentNode.removeChild(containers[i]);
                    }
                }
            } catch (_) { }
        }

        /**
         * Retorna a quantidade atual de marcadores permanentes ativos na guia.
         */
        obterContagemMarcadoresPermanentes() {
            return this.#marcadoresPermanentes.length;
        }

        /**
         * Retorna cópia superficial da lista de marcadores permanentes para inspeção/testes.
         */
        obterMarcadoresPermanentes() {
            return this.#marcadoresPermanentes.map(m => ({
                id: m.id,
                numeroOrdinal: m.numeroOrdinal,
                texto: m.texto,
                timestamp: m.timestamp
            }));
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

    Object.freeze(FeedbackVisual.prototype);
    window.JusGovFeedbackVisual = Object.freeze(FeedbackVisual);
})();

