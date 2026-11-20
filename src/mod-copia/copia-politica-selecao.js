/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-politica-selecao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-COPIA — Política de Resolução de Expansão Base e Mudança Global de Seleção
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-politica-selecao.js
 * - Classe Exportada: CopiaPoliticaSelecao (window.JusGovCopiaPoliticaSelecao)
 * - Herança: extends BaseModulo (src/lib/lib-base-modulo.js)
 * - Null Object: JusGovCopiaPoliticaSelecao.NULL_OBJECT
 * - Métodos Públicos: resolverIndicesExpansaoBase(mapa, idxCursor, numCliques, opcoes),
 *     obterRangePalavraOuBlocoNoPonto(clientX, clientY), calcularAssinaturaSelecao(sel),
 *     tratarMudancaSelecaoGlobal(winAlvo)
 * - Regras / Seções: ENG-00 (Prioridade -1), ARQ-10 (Fase 2A — Seção 6.280), BUG-39, BUG-128
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovCopiaPoliticaSelecao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const gGlobal = (typeof self !== 'undefined') ? self : ((typeof window !== 'undefined') ? window : {});
    const BasePai = (typeof gGlobal.JusGovBaseModulo === 'function')
        ? gGlobal.JusGovBaseModulo
        : class {
            constructor() { }
            destruir() { return true; }
        };

    const NULL_POLITICA = Object.freeze({
        resolverIndicesExpansaoBase: () => null,
        obterRangePalavraOuBlocoNoPonto: () => null,
        calcularAssinaturaSelecao: () => '',
        tratarMudancaSelecaoGlobal: () => undefined
    });

    class CopiaPoliticaSelecao extends BasePai {
        #deps = {};

        constructor(deps = {}) {
            super('CopiaPoliticaSelecao');
            this.#deps = deps && typeof deps === 'object' ? deps : {};
        }

        static get NULL_OBJECT() {
            return NULL_POLITICA;
        }

        resolverIndicesExpansaoBase(mapa, idxCursor, numCliques = 1, opcoes = {}) {
            if (!mapa || typeof mapa.texto !== 'string' || typeof idxCursor !== 'number') return null;
            const d = this.#deps;
            const texto = mapa.texto;
            const apenasBlocoOuAtomica = Boolean(opcoes && opcoes.apenasBlocoOuAtomica);

            if (numCliques >= 3 && !apenasBlocoOuAtomica) {
                const resTriplo = d.resolverSelecaoTriploClique(mapa, idxCursor);
                return {
                    resultadoIndices: resTriplo,
                    ehBlocoCompostoSelecionado: false
                };
            }

            const charNoCursor = texto[idxCursor] || '';
            const charAnterior = idxCursor > 0 ? texto[idxCursor - 1] : '';
            const clicouEmEspaco = d.eEspacoBranco(charNoCursor) ||
                (d.eEspacoBranco(charAnterior) && !d.eAlfanumericoUnicode(charNoCursor));
            const clicouEmDelimitadorOuAspas = d.eDelimitadorPar(charNoCursor) || d.eDelimitadorPar(charAnterior) ||
                d.eCaractereAspas(charNoCursor) || d.eCaractereAspas(charAnterior);

            const expandirComoDuplo = !apenasBlocoOuAtomica && (
                numCliques === 2 ||
                (Boolean(opcoes && opcoes.ehAlt) && numCliques === 1 && (clicouEmEspaco || clicouEmDelimitadorOuAspas))
            );

            let resultadoIndices = null;
            let ehBlocoCompostoSelecionado = false;

            if (expandirComoDuplo) {
                const blocoCompostoPrevio = opcoes ? opcoes.blocoCompostoPrevio : null;
                if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                    resultadoIndices = d.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
                }
                if (!resultadoIndices && !blocoCompostoPrevio) {
                    resultadoIndices = d.tentarExpandirPadraoComposto(texto, idxCursor, true, true);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.expandirSentencaCompletaAtePonto(texto, idxCursor) || d.expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                }
            } else if (!apenasBlocoOuAtomica && clicouEmDelimitadorOuAspas) {
                resultadoIndices = d.tentarExpandirPadraoComposto(texto, idxCursor, true, false);
                /* BUG-39: Se clicou exatamente no caractere delimitador/aspas (ex.: ')' ao final de citação),
                 * só mantém match composto se ele efetivamente cobrir idxCursor (ex.: '(61) 3300-1000');
                 * se o match composto terminou ANTES de idxCursor (dropou ')'), delega aos delimitadores simétricos. */
                if (
                    resultadoIndices &&
                    (d.eDelimitadorPar(charNoCursor) || d.eCaractereAspas(charNoCursor)) &&
                    !(resultadoIndices.inicio <= idxCursor && idxCursor < resultadoIndices.fim)
                ) {
                    resultadoIndices = null;
                }
                if (resultadoIndices) ehBlocoCompostoSelecionado = true;
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
                }
            } else if (!apenasBlocoOuAtomica && clicouEmEspaco) {
                /* Regra de bloco: espaco logo apos ":" liga o rotulo ao que vem depois -> sentenca inteira */
                resultadoIndices = d.tentarExpandirSentencaPorDoisPontos(texto, idxCursor);
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirPadraoComposto(texto, idxCursor, true, false);
                    if (resultadoIndices) ehBlocoCompostoSelecionado = true;
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, false);
                }
                if (!resultadoIndices) {
                    resultadoIndices = d.expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                }
            } else {
                resultadoIndices = d.tentarExpandirPadraoComposto(texto, idxCursor, false, false);
                if (resultadoIndices) ehBlocoCompostoSelecionado = true;
                if (!resultadoIndices) {
                    resultadoIndices = d.expandirUnidadeAtomicaEstagio1(texto, idxCursor);
                }
            }

            return {
                resultadoIndices,
                ehBlocoCompostoSelecionado
            };
        }

        obterRangePalavraOuBlocoNoPonto(clientX, clientY) {
            const d = this.#deps;
            const ponto = d.obterPontoDoClique(clientX, clientY);
            if (!ponto) return null;

            const mapa = d.construirMapaTextoBlocoComJanela(ponto.no, ponto.offset);
            if (!mapa) return null;

            const base = this.resolverIndicesExpansaoBase(mapa, mapa.idxCursor, 1, { apenasBlocoOuAtomica: true });
            const resultadoIndices = base ? base.resultadoIndices : null;
            if (!resultadoIndices) return null;

            const range = d.criarRangeDOMAPartirDeIndices(mapa, resultadoIndices.inicio, resultadoIndices.fim);
            if (!range) return null;

            return {
                range,
                mapa,
                inicio: resultadoIndices.inicio,
                fim: resultadoIndices.fim
            };
        }

        calcularAssinaturaSelecao(sel) {
            try {
                if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
                const r = sel.getRangeAt(0);
                const txt = (sel.toString() || '').trim();
                if (!txt) return '';
                return `${r.startOffset}_${r.endOffset}_${txt}`;
            } catch (_) {
                return '';
            }
        }

        tratarMudancaSelecaoGlobal(winAlvo) {
            const d = this.#deps;
            const win = winAlvo || window;
            if (!win || typeof win.getSelection !== 'function') return;

            /* BUG-128 (Seção 6.258): Saída imediata O(1) durante colagem interna ou dentro de documento
             * iframe de editor rico (CKEditor body.cke_editable / designMode). */
            if (window.__JUSGOV_COLAGEM_INTERNA_ATIVA__ || (win && win.__JUSGOV_COLAGEM_INTERNA_ATIVA__)) return;
            const agoraSelGlobal = Date.now();
            if (window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ && (agoraSelGlobal - window.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__) < 450) return;
            if (win && win.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__ && (agoraSelGlobal - win.__JUSGOV_ULTIMA_COLAGEM_MEIO_TS__) < 450) return;
            const docAlvo = (win && win.document) ? win.document : (typeof document !== 'undefined' ? document : null);
            if (d.ehDocumentoEditorRicoIsolado(docAlvo)) return;

            if (document.activeElement) {
                const tagAtiva = document.activeElement.tagName;
                if (tagAtiva === 'IFRAME') return;
                if (tagAtiva === 'EMBED' && !d.isAreaLeituraOuPdfConteudo(document.activeElement)) return;
            }

            if (winAlvo && winAlvo !== window && winAlvo.__JUSGOV_MOTOR_SELECAO_ATIVO__) return;

            try {
                const selReset = win.getSelection();
                if (!selReset || selReset.rangeCount === 0 || selReset.isCollapsed) {
                    d.setEstado({ ultimoRangeAssinaturaGlobal: '' });
                }
            } catch (_) { }

            const est = d.getEstado();
            if (est.selecaoSendoAplicadaPeloAddon) return;
            if (typeof document !== 'undefined' && d.isSelecaoOuElementoEmCampoEditavel(document.activeElement)) return;
            if (docAlvo && docAlvo !== document && d.isSelecaoOuElementoEmCampoEditavel(docAlvo.activeElement)) return;

            let topWin = window;
            try { if (window.top && window.top.document) topWin = window.top; } catch (_) { }
            if (topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__) return;

            if (est.timerDebounceSelecaoGlobal) {
                clearTimeout(est.timerDebounceSelecaoGlobal);
            }
            const timer = setTimeout(async () => {
                d.setEstado({ timerDebounceSelecaoGlobal: null });
                const estAtual = d.getEstado();
                if (estAtual.selecaoSendoAplicadaPeloAddon) return;
                if (typeof document !== 'undefined' && d.isSelecaoOuElementoEmCampoEditavel(document.activeElement)) return;
                if (topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__) return;
                if (estAtual.isMousePressionado) return;
                if (!d.verificarUrlPermitida()) return;

                const sel = (win && typeof win.getSelection === 'function') ? win.getSelection() : window.getSelection();
                if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                    d.setEstado({ ultimoRangeAssinaturaGlobal: '' });
                    return;
                }
                const textoSel = (sel.toString() || '').trim();
                if (textoSel.length === 0) return;

                const range = sel.getRangeAt(0);
                if (!range) return;

                if (d.isSelecaoOuElementoEmCampoEditavel(range) || d.isSelecaoOuElementoEmCampoEditavel(document.activeElement)) return;
                const ctx = d.classificarContextoElementoAlvo(range.commonAncestorContainer);
                if (ctx === 'CAMPO_SIMPLES_EDITAVEL' || ctx === 'EDITOR_MULTILINHA_EDITAVEL') return;

                if (d.isComponenteBotaoOuFormularioEstrito(range.commonAncestorContainer)) return;
                if (!estAtual.teclasPressionadasAtivas.has('alt') && d.isComponenteSelecaoOuDropdown(range.commonAncestorContainer)) return;
                if (d.isElementoInterativoClicavelDireto(range.commonAncestorContainer)) {
                    const resBlocoSel = d.localizarBlocoForenseAutoSelecionavelEmInterface(textoSel, 0, 1, true);
                    if (!resBlocoSel || resBlocoSel.inicio !== 0 || resBlocoSel.fim < textoSel.length) return;
                }

                const assinatura = `${range.startOffset}_${range.endOffset}_${textoSel}`;
                if (assinatura === estAtual.ultimoRangeAssinaturaGlobal) return;
                d.setEstado({ ultimoRangeAssinaturaGlobal: assinatura });

                if (textoSel === estAtual.ultimaSelecaoManualTexto && (Date.now() - estAtual.ultimoTimestampSelecaoManual) < 1500) return;
                d.setEstado({ ultimaSelecaoManualTexto: textoSel, ultimoTimestampSelecaoManual: Date.now() });

                const rangeClone = range.cloneRange();
                if (!estAtual.teclasPressionadasAtivas.has('alt') && !estAtual.teclasPressionadasAtivas.has('control')) {
                    if (!d.verificarProtecaoTamanhoMinimoInterface(textoSel, range.commonAncestorContainer, false)) return;
                }

                topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__ = true;
                d.setEstado({ selecaoSendoAplicadaPeloAddon: true });
                try {
                    await d.aplicarSelecaoECopiar(rangeClone, false, null, { eraArrasto: false });
                } finally {
                    setTimeout(() => {
                        d.setEstado({ selecaoSendoAplicadaPeloAddon: false });
                        topWin.__JUSGOV_MUTEX_SELECAO_GLOBAL__ = false;
                    }, 300);
                }
            }, 120);
            d.setEstado({ timerDebounceSelecaoGlobal: timer });
        }
    }

    Object.freeze(CopiaPoliticaSelecao.prototype);
    return Object.freeze(CopiaPoliticaSelecao);
}));
