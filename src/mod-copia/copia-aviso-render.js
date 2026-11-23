/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-aviso-render.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Renderização Segura e Projeção Visual do Cartão de Alerta
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-aviso-render.js
 * - Classe Exportada: CopiaAvisoRender (self.JusGovCopiaAvisoRender) extends BaseModulo
 * - Métodos Públicos: _p_definirHtmlSeguroNoCartao, _p_definirTextoComQuebrasNoCartao, projetarAlertaVisual, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaAvisoRender = fabrica(raiz);
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

        const escaparTextoHtml = (str) => (typeof self !== 'undefined' && self.JusGovConstantes && typeof self.JusGovConstantes.escaparTextoHtml === 'function') ? self.JusGovConstantes.escaparTextoHtml(str) : String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');

    class CopiaAvisoRender extends Base {
        constructor() {
            super('CopiaAvisoRender');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaAvisoRender.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaAvisoRender.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Renderiza HTML formatado internamente usando DOMParser inerte, removendo tags
         * executáveis e atributos on* / javascript: antes de mover para o Shadow DOM.
         */
        _p_definirHtmlSeguroNoCartao(htmlBruto) {
            if (!this.elementoCartaoAviso) return;
            const bruto = String(htmlBruto || '');
            if (!bruto) {
                this.elementoCartaoAviso.textContent = '';
                return;
            }
            if (typeof DOMParser === 'function') {
                try {
                    const doc = new DOMParser().parseFromString(bruto, 'text/html');
                    if (doc && doc.body) {
                        const bloqueados = doc.body.querySelectorAll('script, style, iframe, object, embed, svg, math, link, meta');
                        for (let i = 0; i < bloqueados.length; i++) bloqueados[i].remove();
                        const todos = doc.body.querySelectorAll('*');
                        for (let i = 0; i < todos.length; i++) {
                            const attrs = todos[i].attributes;
                            for (let a = attrs.length - 1; a >= 0; a--) {
                                const nome = attrs[a].name.toLowerCase();
                                const val = String(attrs[a].value || '').trim().toLowerCase();
                                if (nome.startsWith('on') || ((nome === 'href' || nome === 'src' || nome === 'action') && val.startsWith('javascript:'))) {
                                    todos[i].removeAttribute(attrs[a].name);
                                }
                            }
                        }
                        const frag = document.createDocumentFragment();
                        while (doc.body.firstChild) {
                            frag.appendChild(document.adoptNode(doc.body.firstChild));
                        }
                        this.elementoCartaoAviso.replaceChildren(frag);
                        return;
                    }
                } catch (_) { }
            }
            this.elementoCartaoAviso.textContent = bruto;
        }

        /**
         * Renderiza texto simples preservando quebras de linha (\n) com <br> nativo sem usar innerHTML.
         */
        _p_definirTextoComQuebrasNoCartao(texto) {
            if (!this.elementoCartaoAviso) return;
            const bruto = String(texto || '');
            if (!bruto.includes('\n')) {
                this.elementoCartaoAviso.textContent = bruto.startsWith('[') ? bruto : `[!] ${bruto}`;
                return;
            }
            const linhas = bruto.split(/\r?\n/);
            const frag = document.createDocumentFragment();
            for (let i = 0; i < linhas.length; i++) {
                if (i > 0) frag.appendChild(document.createElement('br'));
                frag.appendChild(document.createTextNode(linhas[i]));
            }
            this.elementoCartaoAviso.replaceChildren(frag);
        }

        /*
         * METODO: projetarAlertaVisual
         * DIRETRIZ ROOT 6.33 (Algoritmo Inteligente Anti-Sobreposicao) + Seção 6.112 + Seção 6.115:
         * Posiciona os baloes de verificacao/erro e Wiki Forense rigorosamente FORA
         * do texto clicado, ancorados ao início do texto selecionado (rectPrimeiraLinha.left)
         * e sincronizados com a rolagem da página.
         */
        projetarAlertaVisual(range, mensagemOuResultado, destacarSelecaoAmarela = true, pontoMouseOpcional = null) {
            const duracaoConferenciaMs = (typeof this.tempoConferenciaDocumentosMs === 'number')
                ? this.tempoConferenciaDocumentosMs
                : this.tempoExibicaoMs;
            if (duracaoConferenciaMs === 0) return;
            if (!range || typeof range.getBoundingClientRect !== 'function') return;

            /* Passo 7.4: Leitura Geometrica Estrita (considerando todos os retangulos da selecao) */
            let rect = range.getBoundingClientRect();
            if (!rect || (rect.width === 0 && rect.height === 0)) {
                try {
                    const rectsLista = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                    if (rectsLista && rectsLista.length > 0) {
                        rect = rectsLista[0];
                    }
                } catch (_) {}
            }
            if (!rect || (rect.width === 0 && rect.height === 0)) return;

            /* Calcula o envelope geometrico completo do texto selecionado no sistema de coordenadas da pagina raiz + folga externa (1px) */
            const ctxUi = this._p_obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const ox = ctxUi.offsetX;
            const oy = ctxUi.offsetY;

            const FOLGA_CONTORNO_FLASH = 1;
            let boxTop = rect.top + oy;
            let boxBottom = rect.bottom + oy;
            let boxLeft = rect.left + ox;
            let boxRight = rect.right + ox;
            let refLeftFirst = rect.left + ox;

            try {
                const clientRects = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                if (clientRects && clientRects.length > 0) {
                    let minT = Infinity;
                    let maxB = -Infinity;
                    let minL = Infinity;
                    let maxR = -Infinity;
                    for (let i = 0; i < clientRects.length; i++) {
                        const r = clientRects[i];
                        if (!r || (r.width < 0.5 && r.height < 0.5)) continue;
                        if (r.top < minT) {
                            minT = r.top;
                            refLeftFirst = r.left + ox;
                        }
                        if (r.bottom > maxB) {
                            maxB = r.bottom;
                        }
                        if (r.left < minL) minL = r.left;
                        if (r.right > maxR) maxR = r.right;
                    }
                    if (Number.isFinite(minT) && Number.isFinite(maxB)) {
                        boxTop = minT + oy;
                        boxBottom = maxB + oy;
                        boxLeft = minL + ox;
                        boxRight = maxR + ox;
                    }
                }
            } catch (_) {}

            /* Se existir container ativo do contorno Flash no DOM, expande a zona proibida para nunca cobri-lo */
            try {
                const containerFlash = document.getElementById('jusgov-flash-contour-container');
                if (containerFlash && containerFlash.children && containerFlash.children.length > 0) {
                    for (let f = 0; f < containerFlash.children.length; f++) {
                        const elF = containerFlash.children[f];
                        if (elF && elF.tagName !== 'svg' && typeof elF.getBoundingClientRect === 'function') {
                            const rf = elF.getBoundingClientRect();
                            if (rf && rf.width > 0 && rf.height > 0) {
                                if (rf.top + oy < boxTop) boxTop = rf.top + oy;
                                if (rf.bottom + oy > boxBottom) boxBottom = rf.bottom + oy;
                                if (rf.left + ox < boxLeft) boxLeft = rf.left + ox;
                                if (rf.right + ox > boxRight) boxRight = rf.right + ox;
                            }
                        }
                    }
                }
            } catch (_) {}

            const limiteSuperiorProibido = boxTop - FOLGA_CONTORNO_FLASH;
            const limiteInferiorProibido = boxBottom + FOLGA_CONTORNO_FLASH;

            /* Passo 7.5: Escrita no Shadow DOM e Top Layer */
            this.limparAlertaVisual();
            this.garantirEstruturaShadowPopover();
            if (!this.elementoCartaoAviso || !this.elementoDestaqueAmarelo) return;

            const ehWiki = Boolean(mensagemOuResultado && typeof mensagemOuResultado === 'object' && mensagemOuResultado.ehWiki);
            const ehFimDeSemana = Boolean(mensagemOuResultado && mensagemOuResultado.ehFimDeSemana);
            const ehGenericoCinza = Boolean(mensagemOuResultado && mensagemOuResultado.ehGenericoCinza);

            if (ehGenericoCinza) {
                this.elementoCartaoAviso.style.background = '#f1f5f9';
                this.elementoCartaoAviso.style.border = '1px solid #94a3b8';
                this.elementoCartaoAviso.style.color = '#1e293b';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
            } else if (ehWiki && ehFimDeSemana) {
                this.elementoCartaoAviso.style.background = '#f0f9ff';
                this.elementoCartaoAviso.style.border = '1px solid #0284c7';
                this.elementoCartaoAviso.style.color = '#075985';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.22)';
            } else if (ehWiki) {
                this.elementoCartaoAviso.style.background = '#f0fdf4';
                this.elementoCartaoAviso.style.border = '1px solid #22c55e';
                this.elementoCartaoAviso.style.color = '#166534';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.18)';
            } else {
                this.elementoCartaoAviso.style.background = '#fef08a';
                this.elementoCartaoAviso.style.border = '1px solid #f59e0b';
                this.elementoCartaoAviso.style.color = '#9a3412';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.22)';
            }

            if (destacarSelecaoAmarela && !ehWiki && document.head) {
                const styleEl = document.createElement('style');
                styleEl.id = 'jusgov-style-selecao-amarela';
                styleEl.textContent = '::selection { background-color: #fef08a !important; color: #9a3412 !important; }';
                document.head.appendChild(styleEl);
                this.estiloSelecaoInjetado = styleEl;

                this.elementoDestaqueAmarelo.style.top = `${rect.top + oy - 1}px`;
                this.elementoDestaqueAmarelo.style.left = `${rect.left + ox - 1}px`;
                this.elementoDestaqueAmarelo.style.width = `${rect.width + 2}px`;
                this.elementoDestaqueAmarelo.style.height = `${rect.height + 2}px`;
                this.elementoDestaqueAmarelo.style.display = 'block';
            }

            if (mensagemOuResultado && typeof mensagemOuResultado === 'object' && mensagemOuResultado.html) {
                this._p_definirHtmlSeguroNoCartao(mensagemOuResultado.html);
            } else if (typeof mensagemOuResultado === 'string') {
                this._p_definirTextoComQuebrasNoCartao(mensagemOuResultado);
            } else {
                this.elementoCartaoAviso.textContent = `[!] ${mensagemOuResultado}`;
            }

            /* Primeiro exibir o popover e colocar o cartao em top:0 / left:0 invisivel
             * para que o motor de layout calcule com exatidao a largura e a altura real
             * de todas as multiplas linhas (sem sofrer compressao de largura na borda direita!). */
            this.elementoCartaoAviso.style.visibility = 'hidden';
            this.elementoCartaoAviso.style.top = '0px';
            this.elementoCartaoAviso.style.left = '0px';
            this.elementoCartaoAviso.style.display = 'block';

            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.showPopover === 'function') {
                try {
                    this.hospedeiroShadow.showPopover();
                } catch (_) {}
            }

            /* Medir dimensoes reais exatas do cartao de aviso ja renderizado no Top Layer */
            const rectCartaoMedido = this.elementoCartaoAviso.getBoundingClientRect();
            const textoRico = this.elementoCartaoAviso.innerHTML || this.elementoCartaoAviso.textContent || '';
            const qtdLinhasEstimada = Math.max(1, (textoRico.match(/<div|<br|\n/gi) || []).length);
            const alturaFallback = Math.max(26, 14 + (qtdLinhasEstimada * 16));
            const alturaMedidaReal = (rectCartaoMedido && rectCartaoMedido.height > 0)
                ? Math.ceil(rectCartaoMedido.height)
                : (this.elementoCartaoAviso.offsetHeight || 0);
            const alturaCartao = alturaMedidaReal > 0 ? alturaMedidaReal : alturaFallback;
            const larguraMedidaReal = (rectCartaoMedido && rectCartaoMedido.width > 0)
                ? Math.ceil(rectCartaoMedido.width)
                : (this.elementoCartaoAviso.offsetWidth || 0);
            const larguraCartao = larguraMedidaReal > 0 ? Math.max(larguraMedidaReal, 180) : 230;

            const vw = Math.max(winUi.innerWidth || 0, docUi.documentElement ? docUi.documentElement.clientWidth : 0, 320);
            const vh = Math.max(winUi.innerHeight || 0, docUi.documentElement ? docUi.documentElement.clientHeight : 0, 240);
            const MARGEM_JANELA = 8;
            const DISTANCIA_SEGURANCA_ABAIXO = 4;
            const DISTANCIA_SEGURANCA_SUPERIOR = 2;

            /* Seção 6.71 (FEAT-07): Determina ponto de referencia horizontal ancorado estritamente
             * ao inicio das palavras do Range (refLeftFirst), traduzido para o sistema de coordenadas raiz */
            let refLeft = Number.isFinite(refLeftFirst)
                ? refLeftFirst
                : (Number.isFinite(boxLeft) ? boxLeft : MARGEM_JANELA);

            /* Calcula coordenada horizontal garantindo alinhamento por palavra e clamp nas bordas da janela */
            let leftPos = Math.max(MARGEM_JANELA, Math.min(refLeft, vw - larguraCartao - MARGEM_JANELA));

            /* Posiciona na horizontal primeiro e re-mede a altura caso o ajuste de borda tenha provocado wrap adicional */
            this.elementoCartaoAviso.style.left = `${Math.round(leftPos)}px`;
            const alturaFinalCartao = Math.max(
                alturaCartao,
                this.elementoCartaoAviso.offsetHeight || 0,
                Math.ceil(this.elementoCartaoAviso.getBoundingClientRect().height || 0)
            );

            /* Algoritmo de Quadrantes Verticais Proxi-Mouse (Anti-Sobreposição Estrita com Flip Dinâmico):
             * 1) Padrão: Tenta posicionar ABAIXO da seleção/mouse (limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO).
             * 2) Se sair da área exibível da janela (candidatoAbaixo + alturaFinalCartao > vh - MARGEM_JANELA),
             *    inverte deterministicamente para ACIMA da seleção/mouse (limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR).
             *    Quando superior, aproxima o balão com distância mínima ergonômica (2px).
             * 3) Se não couber em nenhum quadrante integralmente, escolhe o lado com maior espaço livre sem cobrir a linha clicada. */
            const candidatoAbaixo = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
            const candidatoAcima = limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR;
            const espacoAcima = limiteSuperiorProibido - MARGEM_JANELA;
            const espacoAbaixo = vh - limiteInferiorProibido - MARGEM_JANELA;

            const preferenciaPosicao = this.posicaoAvisosValidacao || 'abaixo';

            let topPos;
            if (preferenciaPosicao === 'abaixo') {
                if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA) {
                    topPos = candidatoAbaixo;
                } else if (candidatoAcima >= MARGEM_JANELA) {
                    topPos = candidatoAcima;
                } else if (espacoAbaixo >= espacoAcima) {
                    topPos = Math.max(limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO, Math.min(candidatoAbaixo, vh - alturaFinalCartao - MARGEM_JANELA));
                } else {
                    topPos = Math.max(MARGEM_JANELA, Math.min(candidatoAcima, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR));
                }
            } else {
                if (candidatoAcima >= MARGEM_JANELA) {
                    topPos = candidatoAcima;
                } else if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA) {
                    topPos = candidatoAbaixo;
                } else if (espacoAbaixo >= espacoAcima) {
                    topPos = Math.max(limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO, Math.min(candidatoAbaixo, vh - alturaFinalCartao - MARGEM_JANELA));
                } else {
                    topPos = Math.max(MARGEM_JANELA, Math.min(candidatoAcima, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR));
                }
            }

            /* Verificação final de não-colisão com o retângulo clicado/selecionado */
            const cardBottom = topPos + alturaFinalCartao;
            const sobrepoeVerticalmente = (topPos < limiteInferiorProibido) && (cardBottom > limiteSuperiorProibido);
            const sobrepoeHorizontalmente = (leftPos < (boxRight + FOLGA_CONTORNO_FLASH)) && ((leftPos + larguraCartao) > (boxLeft - FOLGA_CONTORNO_FLASH));

            if (sobrepoeVerticalmente && sobrepoeHorizontalmente) {
                if (preferenciaPosicao === 'abaixo') {
                    if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA || espacoAbaixo >= espacoAcima) {
                        topPos = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
                    } else {
                        topPos = Math.max(2, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR);
                    }
                } else {
                    if (espacoAcima >= alturaFinalCartao || espacoAcima >= espacoAbaixo) {
                        topPos = Math.max(2, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR);
                    } else {
                        topPos = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
                    }
                }
            }

            this.elementoCartaoAviso.style.top = `${Math.round(topPos)}px`;
            this.elementoCartaoAviso.style.visibility = 'visible';

            this.rangeAtivoAlerta = (typeof range.cloneRange === 'function') ? range.cloneRange() : range;
            this.destacarSelecaoAmarelaAtiva = Boolean(destacarSelecaoAmarela && !ehWiki);
            this.avisoVisivel = true;
            this.timestampCriacaoAviso = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();

            /* Ancoragem com Rolagem Solidária ao Texto (USAB-14 / POS-01 - Seção 6.115) */
            this.registrarOuvinteScrollAlerta();

            /* Passo 7.6: Remocao automatica conforme tempo de conferência configurado (Seção 6.112) */
            if (duracaoConferenciaMs > 0) {
                /* Modo Temporizado Estrito: respeita estritamente o tempo configurado (ex: 1s a 5s) sem fechar por hover */
                this.removerOuvinteInteracaoParaAlerta();
                this.temporizadorAlerta = setTimeout(() => {
                    this.limparAlertaVisual();
                }, duracaoConferenciaMs);
            } else if (duracaoConferenciaMs === -1) {
                /* Modo "Até Interação (Padrão)" da Conferência Automática (Seção 6.112):
                 * Fecha ao: 1) passar o mouse em cima do popup após 1s; 2) keydown; 3) clique do mouse em algum lugar. */
                this.registrarOuvinteInteracaoParaAlerta();
            }
        }

        /*
         * METODO: registrarOuvinteInteracaoParaMiniTip (BUG-44 / DEP-01 - Seção 6.113)
         * Regras estritas de fechamento do popup "Estilos/Formatação Textual: ..." em "Até Interação (Padrão)":
         * - Carência inicial de 180ms para ignorar o próprio segundo Escape (e seu keyup) que disparou o popup;
         * - Fecha ao:
         *   1) Qualquer tecla pressionada (keydown, exceto Insert para preservar Ins+Ins);
         *   2) Teclas modificadoras ao soltar (keyup: Control, Alt, Shift, Meta);
         *   3) Qualquer clique do mouse (mousedown);
         *   4) Passar o mouse em cima da mensagem (mouseenter / mousemove sobre o popup).
         */
        registrarOuvinteInteracaoParaMiniTip() {
            this.removerOuvinteInteracaoParaMiniTip();

            const timestampInicioMiniTip = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            const CARENCIA_GATILHO_MS = 180;

            const tratarKeyDownMiniTip = (e) => {
                if (!e) return;
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                const tecla = (e.key || '').toLowerCase();
                if (tecla === 'insert' || e.keyCode === 45) {
                    return;
                }
                /* Ignora o próprio evento Escape disparador ou repetição imediata nos primeiros 180ms */
                if ((agora - timestampInicioMiniTip) < CARENCIA_GATILHO_MS && (tecla === 'escape' || tecla === 'esc' || e.keyCode === 27)) {
                    return;
                }
                this.ocultarMiniTipGlobal();
            };

            const tratarKeyUpMiniTip = (e) => {
                if (!e) return;
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                if ((agora - timestampInicioMiniTip) < CARENCIA_GATILHO_MS) return;
                const tecla = (e.key || '').toLowerCase();
                if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'altgraph') {
                    this.ocultarMiniTipGlobal();
                }
            };

            const tratarMouseDownMiniTip = () => {
                this.ocultarMiniTipGlobal();
            };

            const tratarHoverMiniTip = () => {
                this.ocultarMiniTipGlobal();
            };

            const ctxUi = this._p_obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const tratarMouseMoveGlobalMiniTip = (e) => {
                if (!e || !this.elementoMiniTipGlobal || this.elementoMiniTipGlobal.style.display === 'none') return;
                const r = this.elementoMiniTipGlobal.getBoundingClientRect();
                if (r && r.width > 0 && r.height > 0) {
                    const mesmoTop = (!e.view || e.view === winUi);
                    const evX = e.clientX + (mesmoTop ? 0 : ctxUi.offsetX);
                    const evY = e.clientY + (mesmoTop ? 0 : ctxUi.offsetY);
                    if (evX >= r.left && evX <= r.right && evY >= r.top && evY <= r.bottom) {
                        this.ocultarMiniTipGlobal();
                    }
                }
            };

            const opts = { capture: true, passive: true };
            window.addEventListener('keydown', tratarKeyDownMiniTip, opts);
            document.addEventListener('keydown', tratarKeyDownMiniTip, opts);
            window.addEventListener('keyup', tratarKeyUpMiniTip, opts);
            document.addEventListener('keyup', tratarKeyUpMiniTip, opts);
            window.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            document.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            window.addEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
            if (winUi !== window) {
                winUi.addEventListener('keydown', tratarKeyDownMiniTip, opts);
                winUi.addEventListener('keyup', tratarKeyUpMiniTip, opts);
                winUi.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
                winUi.addEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
            }
            if (docUi !== document) {
                docUi.addEventListener('keydown', tratarKeyDownMiniTip, opts);
                docUi.addEventListener('keyup', tratarKeyUpMiniTip, opts);
                docUi.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            }

            if (this.elementoMiniTipGlobal) {
                this.elementoMiniTipGlobal.addEventListener('mouseenter', tratarHoverMiniTip, { passive: true });
                this.elementoMiniTipGlobal.addEventListener('mousemove', tratarHoverMiniTip, { passive: true });
            }

            this.limparOuvintesInteracaoMiniTip = () => {
                window.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                document.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                window.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                document.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                window.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                document.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                window.removeEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
                if (winUi !== window) {
                    winUi.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                    winUi.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                    winUi.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                    winUi.removeEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
                }
                if (docUi !== document) {
                    docUi.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                    docUi.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                    docUi.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                }
                if (this.elementoMiniTipGlobal) {
                    this.elementoMiniTipGlobal.removeEventListener('mouseenter', tratarHoverMiniTip);
                    this.elementoMiniTipGlobal.removeEventListener('mousemove', tratarHoverMiniTip);
                }
                this.limparOuvintesInteracaoMiniTip = null;
            };
        }

        removerOuvinteInteracaoParaMiniTip() {
            if (typeof this.limparOuvintesInteracaoMiniTip === 'function') {
                this.limparOuvintesInteracaoMiniTip();
            }
        }

        ocultarMiniTipGlobal() {
            try {
                const uiTela = this._p_obterUiTela();
                if (uiTela && typeof uiTela.ocultarNaTela === 'function') {
                    uiTela.ocultarNaTela();
                }
            } catch (_) { }
            this.removerOuvinteInteracaoParaMiniTip();
            if (this.temporizadorMiniTip) {
                clearTimeout(this.temporizadorMiniTip);
                this.temporizadorMiniTip = null;
            }
            if (this.elementoMiniTipGlobal) {
                this.elementoMiniTipGlobal.style.display = 'none';
            }
            if (!this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') {
                this.avisoVisivel = false;
                if (this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                    try {
                        this.hospedeiroShadow.hidePopover();
                    } catch (_) {}
                }
            }
        }

        /*
         * METODO: projetarMiniTipGlobal
         * DIRETRIZ ROOT 6.40: O popup de alternancia Esc + Esc respeita rigorosamente o
         * "Tempo de Exibicao dos Avisos na Tela" (this.tempoExibicaoMs) configurado pelo usuario.
         */
        projetarMiniTipGlobal(mensagem, corBorda = '#3b82f6', duracaoOpcionalMs = null) {
            /* Se o usuario configurou 0 (Desligar avisos na tela), suprime o mini-tip */
            if (this.tempoExibicaoMs === 0 && duracaoOpcionalMs === null) return;

            const duracaoEfetivaMs = (typeof duracaoOpcionalMs === 'number' && duracaoOpcionalMs > 0)
                ? duracaoOpcionalMs
                : ((typeof this.tempoExibicaoMs === 'number') ? this.tempoExibicaoMs : -1);

            /* FEAT-102 (Seção 6.260): Em produção, delega à biblioteca global JusGovLibUiTela
             * (via Background Service Worker -> frameId: 0 / window.top), garantindo posição fixa
             * idêntica em 100% das páginas e iframes cross-origin (Esc+Esc, Acumulador, etc.). */
            const ehHeadless = (typeof window !== 'undefined' && Boolean(window.__TESTE_HEADLESS__));
            const uiTela = !ehHeadless ? this._p_obterUiTela() : null;
            if (uiTela && typeof uiTela.exibirNaTela === 'function') {
                try {
                    const agoraTela = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                    this.avisoVisivel = true;
                    this.timestampCriacaoAviso = agoraTela;
                    this.timestampCriacaoMiniTip = agoraTela;
                    uiTela.exibirNaTela({
                        mensagem: String(mensagem || ''),
                        corBorda,
                        duracaoMs: duracaoEfetivaMs,
                        posicao: 'topo_centro'
                    });
                    return;
                } catch (_) { }
            }

            /* Fallback local / ambiente de testes headless (Shadow DOM + Popover Top-Layer) */
            this.garantirEstruturaShadowPopover();
            if (!this.elementoMiniTipGlobal) return;

            this.removerOuvinteInteracaoParaMiniTip();
            if (this.temporizadorMiniTip) {
                clearTimeout(this.temporizadorMiniTip);
                this.temporizadorMiniTip = null;
            }

            this.elementoMiniTipGlobal.textContent = mensagem;
            this.elementoMiniTipGlobal.style.borderColor = corBorda;
            this.elementoMiniTipGlobal.style.display = 'block';

            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.showPopover === 'function') {
                try {
                    this.hospedeiroShadow.showPopover();
                } catch (_) {}
            }

            const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            this.avisoVisivel = true;
            this.timestampCriacaoAviso = agora;
            this.timestampCriacaoMiniTip = agora;

            if (duracaoEfetivaMs > 0) {
                this.removerOuvinteInteracaoParaMiniTip();
                this.temporizadorMiniTip = setTimeout(() => {
                    this.ocultarMiniTipGlobal();
                }, duracaoEfetivaMs);
            } else if (duracaoEfetivaMs === -1) {
                this.registrarOuvinteInteracaoParaMiniTip();
            }
        }
    }

    Object.freeze(CopiaAvisoRender.prototype);
    return Object.freeze(CopiaAvisoRender);
}));
