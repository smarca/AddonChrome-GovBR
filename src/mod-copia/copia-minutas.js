/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-minutas.js
 * CLASSE: PlaceholdersMinutas
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-minutas.js
 * - Classe Exportada: PlaceholdersMinutas (window.JusGovPlaceholdersMinutas)
 * - Métodos Públicos: definirModo(valor), localizarCampoSimbolosSobCursor(texto, idx), tratarCliqueEmEditorMultilinhaSemCopia(e, dependencias), get modo, get ativo
 * - Dependências Injetadas: window.JusGovConstantes, window.JusGovGeometriaDOM, estágios 1..5
 * - Regras / Seções: Regras 2.14/2.15 (Cópia Silenciosa Zero em editores), Seção 6.31, ADR-004, Seção 6.64 (blindagem POO)
 * 
 * FINALIDADE:
 * Gerenciamento especializado de seleção de placeholders e minutas em editores de texto
 * multilinhas (<textarea> e contêineres contenteditable do PJe, CKEditor, TinyMCE, etc.):
 * - 4 Modos Operacionais: "desabilitado", "placeholders", "ctrl_avancado", "avancado".
 * - Seleção inteligente de tags/marcadores de minutas (ex: <NUMERO_PROCESSO>, @@@DATA@@@,
 *   #####NOME#####, [ASSINATURA]) SEM jamais executar cópia involuntária para o clipboard.
 * - Proteção estrita de integridade: preserva o histórico de Undo/Redo do editor web nativo.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Cópia Silenciosa Zero: Em editores de texto editáveis, o clique sobre um placeholder
 *    deve apenas posicionar a seleção visual para que o usuário possa digitar e substituir,
 *    jamais enviando o conteúdo ao clipboard ou exibindo alertas de cópia.
 * 2. Modo Placeholders Simples: Seleciona unicamente o token de placeholder sob o cursor.
 * 3. Modo Avançado / Ctrl+Avançado: Permite acionar o motor de estágios (palavra, expressão,
 *    delimitador, parágrafo em 3 cliques) dentro de minutas ricas de sentença/decisão.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regras 2.14, 2.15: Minutas e Placeholders)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 7: Placeholders e Editores Ricos)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovPlaceholdersMinutas) {
        return;
    }

    class PlaceholdersMinutas {
        #modo;
        #ativo;

        constructor(modoInicial = 'placeholders') {
            this.definirModo(modoInicial);
        }

        get modo() {
            return this.#modo;
        }

        get ativo() {
            return this.#ativo;
        }

        definirModo(valor) {
            if (valor === 'desabilitado' || valor === 'placeholders' || valor === 'ctrl_avancado' || valor === 'avancado') {
                this.#modo = valor;
                this.#ativo = (valor !== 'desabilitado');
            } else {
                this.#ativo = Boolean(valor);
                this.#modo = this.#ativo ? 'placeholders' : 'desabilitado';
            }
        }

        /**
         * Localiza padrão de campo placeholder delimitado por símbolos sob o cursor.
         */
        localizarCampoSimbolosSobCursor(texto, idx) {
            if (!texto || idx < 0 || idx > texto.length) return null;

            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};
            const rxFonte = rx.CAMPO_PLACEHOLDER_EDITAVEL || rx.CAMPO_MARCADOR_SIMBOLOS;

            if (rxFonte) {
                const regexCampo = new RegExp(rxFonte.source, 'gu');
                let m;
                while ((m = regexCampo.exec(texto)) !== null) {
                    const ini = m.index;
                    const fim = ini + m[0].length;
                    if (idx >= ini && idx <= fim) {
                        return { inicio: ini, fim };
                    }
                }
            }

            const ehSimbolo = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (cExt.TABELA_MASCARA_ASCII && c < 128) {
                    return (cExt.TABELA_MASCARA_ASCII[c] & (cExt.MASCARA_CARACTERE ? cExt.MASCARA_CARACTERE.SIMBOLO_REPETIVEL : 0)) !== 0;
                }
                return rx.CHAR_SIMBOLO_REPETIVEL ? rx.CHAR_SIMBOLO_REPETIVEL.test(ch) : /[#*=_~$@]/.test(ch);
            };

            const ehEspacoOuQuebra = (ch) => {
                return !ch || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\u00A0';
            };

            let pos = idx < texto.length ? idx : texto.length - 1;
            if (pos >= 0 && !ehSimbolo(texto[pos]) && pos > 0 && ehSimbolo(texto[pos - 1])) {
                pos--;
            }
            if (pos >= 0 && ehSimbolo(texto[pos])) {
                let ini = pos;
                while (ini > 0 && !ehEspacoOuQuebra(texto[ini - 1])) {
                    ini--;
                }
                let fim = pos + 1;
                while (fim < texto.length && !ehEspacoOuQuebra(texto[fim])) {
                    fim++;
                }
                if (fim - ini >= 2) {
                    return { inicio: ini, fim };
                }
            }

            return null;
        }

        /**
         * Trata o clique do mouse em editores multilinhas (<textarea> e contenteditable).
         * Executa seleção do placeholder ou expansão contextual SEM copiar nada para o clipboard.
         */
        tratarCliqueEmEditorMultilinhaSemCopia(e, dependencias = {}) {
            const alvo = e.target;
            if (!alvo) return false;

            const ehTextarea = (alvo.tagName === 'TEXTAREA');
            if (ehTextarea) {
                if (!this.#ativo || (e && e.detail && e.detail > 1)) return false;
                setTimeout(() => {
                    try {
                        if (alvo.selectionStart !== alvo.selectionEnd) return;
                        const idx = alvo.selectionStart;
                        const valor = alvo.value || '';
                        const spanSimbolo = this.localizarCampoSimbolosSobCursor(valor, idx);
                        if (spanSimbolo) {
                            alvo.setSelectionRange(spanSimbolo.inicio, spanSimbolo.fim);
                        }
                    } catch (_) { }
                }, 10);
                return true;
            }

            if (!this.#ativo || this.#modo === 'desabilitado') return false;

            const clientX = e.clientX;
            const clientY = e.clientY;
            const detail = (e && typeof e.detail === 'number') ? e.detail : 1;
            const ctrlPressionado = Boolean(e && (e.ctrlKey || e.metaKey));
            const docAlvo = (alvo && alvo.ownerDocument) ? alvo.ownerDocument : document;
            const winAlvo = (docAlvo && docAlvo.defaultView) ? docAlvo.defaultView : window;

            const geometria = dependencias.geometria || (typeof window !== 'undefined' && window.JusGovGeometriaDOM ? new window.JusGovGeometriaDOM() : null);

            setTimeout(() => {
                try {
                    const selAtual = (winAlvo && typeof winAlvo.getSelection === 'function')
                        ? winAlvo.getSelection()
                        : window.getSelection();
                    if (selAtual && !selAtual.isCollapsed && selAtual.toString().trim().length > 0 && detail === 1) {
                        return;
                    }

                    let ponto = null;
                    if (selAtual && selAtual.rangeCount > 0 && selAtual.isCollapsed) {
                        const rNat = selAtual.getRangeAt(0);
                        if (rNat && rNat.startContainer) {
                            if (rNat.startContainer.nodeType === Node.TEXT_NODE) {
                                ponto = { no: rNat.startContainer, offset: rNat.startOffset };
                            } else if (rNat.startContainer.nodeType === Node.ELEMENT_NODE && rNat.startContainer.childNodes.length > 0) {
                                const idxFilho = Math.min(rNat.startOffset, rNat.startContainer.childNodes.length - 1);
                                const f = rNat.startContainer.childNodes[idxFilho];
                                if (f && f.nodeType === Node.TEXT_NODE) {
                                    ponto = { no: f, offset: 0 };
                                }
                            }
                        }
                    }

                    if ((!ponto || !ponto.no) && geometria) {
                        ponto = geometria.obterPontoDoClique(clientX, clientY, docAlvo);
                    }
                    if (!ponto || !ponto.no) return;

                    const mapa = geometria ? geometria.construirMapaTextoBlocoComJanela(ponto.no, ponto.offset) : null;
                    if (!mapa || !mapa.texto) return;

                    const { texto, idxCursor } = mapa;
                    let rangeParaSelecionar = null;

                    const ativarSelecaoAvancada = (this.#modo === 'avancado') ||
                        (this.#modo === 'ctrl_avancado' && ctrlPressionado);

                    if (ativarSelecaoAvancada && dependencias.estagios) {
                        const { estagio1, estagio2, estagio3, estagio4, estagio5 } = dependencias.estagios;

                        if (detail >= 3 && estagio5) {
                            const resTriplo = estagio5.resolverSelecaoTriploClique(mapa, idxCursor);
                            if (resTriplo && geometria) {
                                rangeParaSelecionar = geometria.criarRangeDOMAPartirDeIndices(mapa, resTriplo.inicio, resTriplo.fim);
                            }
                            if (!rangeParaSelecionar && geometria) {
                                const bloco = geometria.obterBlocoAncestralContextual(ponto.no);
                                if (bloco && bloco !== docAlvo.body) {
                                    rangeParaSelecionar = docAlvo.createRange();
                                    rangeParaSelecionar.selectNodeContents(bloco);
                                }
                            }
                        } else if (detail === 2) {
                            let resIndices = null;
                            if (estagio4) resIndices = estagio4.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true);
                            if (!resIndices && estagio2) resIndices = estagio2.tentarExpandirPadraoComposto(texto, idxCursor, true, true);
                            if (!resIndices && estagio2) resIndices = estagio2.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor);
                            if (!resIndices && estagio2) resIndices = estagio2.tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor);
                            if (!resIndices && estagio3) {
                                resIndices = estagio3.expandirSentencaCompletaAtePonto(texto, idxCursor) || estagio3.expandirFraseAtePontuacaoEstagio3(texto, idxCursor);
                            }

                            if (resIndices && geometria) {
                                rangeParaSelecionar = geometria.criarRangeDOMAPartirDeIndices(mapa, resIndices.inicio, resIndices.fim);
                            }
                        } else {
                            const spanSimbolo = this.localizarCampoSimbolosSobCursor(texto, idxCursor);
                            if (spanSimbolo && geometria) {
                                rangeParaSelecionar = geometria.criarRangeDOMAPartirDeIndices(mapa, spanSimbolo.inicio, spanSimbolo.fim);
                            } else {
                                let resIndices = null;
                                if (estagio2) resIndices = estagio2.tentarExpandirPadraoComposto(texto, idxCursor, false, false);
                                if (!resIndices && estagio1) resIndices = estagio1.expandirUnidadeAtomicaEstagio1(texto, idxCursor);

                                if (resIndices && geometria) {
                                    rangeParaSelecionar = geometria.criarRangeDOMAPartirDeIndices(mapa, resIndices.inicio, resIndices.fim);
                                }
                            }
                        }
                    } else {
                        const spanSimbolo = this.localizarCampoSimbolosSobCursor(mapa.texto, mapa.idxCursor);
                        if (spanSimbolo && geometria) {
                            rangeParaSelecionar = geometria.criarRangeDOMAPartirDeIndices(mapa, spanSimbolo.inicio, spanSimbolo.fim);
                        }
                    }

                    if (rangeParaSelecionar && selAtual) {
                        selAtual.removeAllRanges();
                        selAtual.addRange(rangeParaSelecionar);
                    }
                } catch (_) { }
            }, 10);

            return true;
        }
    }

    Object.freeze(PlaceholdersMinutas.prototype);
    window.JusGovPlaceholdersMinutas = Object.freeze(PlaceholdersMinutas);
})();

