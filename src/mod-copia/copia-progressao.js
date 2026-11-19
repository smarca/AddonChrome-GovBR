/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-progressao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: ProgressaoAtalhosSelecao
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-progressao.js
 * - Classe Exportada: ProgressaoAtalhosSelecao (window.JusGovProgressaoAtalhosSelecao)
 * - Métodos Públicos: resolverLimitesBlocoAtivoNaJanela, resolverSubSegmentoNoBlocoComposto, isPontoDentroDoRange, construirDegrausCicloSelecao, isSelecaoExtensaOuMultipage, executarMotorElastico, atualizarArrastoElasticoNoMovimento, tentarSelecionarTabelaLinhaOuColuna, obterEstadoCiclo, resetarEstadoCiclo, definirRangeAncoraElastico, obterRangeAncoraElastico, definirUltimoBlocoCompostoAtivo, obterUltimoBlocoCompostoAtivo
 * - Dependências Injetadas: Estagios 1..5, GeometriaDOM, FiltrosHtml, AcumuladorCopia, GerenciadorCopia, AvisoFlutuante
 * - Regras / Seções: ROOT-05 (Ciclo Circular 5 Degraus + Encolhimento Intra-Bloco), FEAT-63 (Seleção extensa), Seção 6.21 (Elástico), Seção 6.29 (Tabela), ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Classe POO dedicada à "Progressão em 6 Estágios e Atalhos Práticos": gerencia o
 * ciclo progressivo/regressivo sobre a mesma seleção, sub-segmentação intra-bloco,
 * seleção contínua por modificadores, motor elástico de arraste (Ctrl), seleção
 * de linhas/colunas de tabelas e proteção leve para seleções extensas/multipágina.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovProgressaoAtalhosSelecao) {
        return;
    }

    class ProgressaoAtalhosSelecao {
        #deps;
        #estadoCicloSelecao;
        #ultimoBlocoCompostoAtivo;
        #rangeAncoraArrastoElastico;

        constructor(dependencias = {}) {
            this.#deps = dependencias || {};
            this.#estadoCicloSelecao = { direcao: 1, textoAtual: '' };
            this.#ultimoBlocoCompostoAtivo = null;
            this.#rangeAncoraArrastoElastico = null;
        }

        obterEstadoCiclo() {
            return this.#estadoCicloSelecao;
        }

        definirEstadoCiclo(novoEstado = {}) {
            if (novoEstado && typeof novoEstado === 'object') {
                if (typeof novoEstado.direcao === 'number') this.#estadoCicloSelecao.direcao = novoEstado.direcao;
                if (typeof novoEstado.textoAtual === 'string') this.#estadoCicloSelecao.textoAtual = novoEstado.textoAtual;
            }
            return this.#estadoCicloSelecao;
        }

        resetarEstadoCiclo() {
            this.#estadoCicloSelecao = { direcao: 1, textoAtual: '' };
        }

        definirUltimoBlocoCompostoAtivo(bloco) {
            this.#ultimoBlocoCompostoAtivo = bloco || null;
        }

        obterUltimoBlocoCompostoAtivo() {
            return this.#ultimoBlocoCompostoAtivo;
        }

        definirRangeAncoraElastico(range) {
            this.#rangeAncoraArrastoElastico = range || null;
        }

        obterRangeAncoraElastico() {
            return this.#rangeAncoraArrastoElastico;
        }

        resolverLimitesBlocoAtivoNaJanela(mapa, idxCursor, blocoAtivo = null, textoCicloAtual = '') {
            if (!mapa || typeof mapa.texto !== 'string' || typeof idxCursor !== 'number') return null;
            const texto = mapa.texto;
            const refBloco = blocoAtivo || this.#ultimoBlocoCompostoAtivo;
            const refTexto = textoCicloAtual || this.#estadoCicloSelecao.textoAtual;
            const alvo = (refBloco && refBloco.texto) ? refBloco.texto.trim() : '';
            if (alvo) {
                let pos = texto.indexOf(alvo);
                while (pos !== -1) {
                    const fim = pos + alvo.length;
                    if (idxCursor >= pos && idxCursor <= fim) {
                        return { inicio: pos, fim, texto: alvo };
                    }
                    pos = texto.indexOf(alvo, pos + 1);
                }
            }
            if (typeof this.#deps.tentarExpandirPadraoComposto === 'function') {
                const resPadrao = this.#deps.tentarExpandirPadraoComposto(texto, idxCursor, false, false)
                    || this.#deps.tentarExpandirPadraoComposto(texto, idxCursor, true, false);
                if (resPadrao) {
                    const trecho = texto.slice(resPadrao.inicio, resPadrao.fim).trim();
                    if (trecho && (
                        (alvo && alvo === trecho) ||
                        (refTexto && (refTexto === trecho || trecho.includes(refTexto)))
                    )) {
                        return { inicio: resPadrao.inicio, fim: resPadrao.fim, texto: trecho };
                    }
                }
            }
            return null;
        }

        resolverSubSegmentoNoBlocoComposto(texto, idxCursor, blocoInicio, blocoFim) {
            if (!texto || typeof idxCursor !== 'number' || blocoInicio >= blocoFim) return null;
            const idx = Math.max(blocoInicio, Math.min(blocoFim - 1, idxCursor));
            if (!/[\p{L}\p{N}]/u.test(texto[idx] || '')) {
                return { ehSubSegmento: false, inicio: blocoInicio, fim: blocoFim };
            }
            let ini = idx;
            let fim = idx + 1;
            while (ini > blocoInicio && /[\p{L}\p{N}]/u.test(texto[ini - 1] || '')) ini--;
            while (fim < blocoFim && /[\p{L}\p{N}]/u.test(texto[fim] || '')) fim++;
            return {
                ehSubSegmento: (ini > blocoInicio || fim < blocoFim),
                inicio: ini,
                fim: fim
            };
        }

        isPontoDentroDoRange(ponto, range) {
            if (!ponto || !ponto.no || !range) return false;
            try {
                const rPonto = document.createRange();
                rPonto.setStart(ponto.no, ponto.offset);
                rPonto.setEnd(ponto.no, ponto.offset);
                return (
                    range.compareBoundaryPoints(Range.START_TO_START, rPonto) <= 0 &&
                    range.compareBoundaryPoints(Range.END_TO_END, rPonto) >= 0
                );
            } catch (_) {
                return false;
            }
        }

        construirDegrausCicloSelecao(mapa, idxCursor) {
            if (!mapa || typeof mapa.texto !== 'string') return [];
            const { texto } = mapa;
            const degraus = [];
            const extrairTexto = this.#deps.extrairTextoPuroSanitizado || ((r) => (r ? r.toString() : ''));
            const criarRange = this.#deps.criarRangeDOMAPartirDeIndices;

            const adicionarDegrau = (rangeCandidato) => {
                if (!rangeCandidato) return;
                const txt = (extrairTexto(rangeCandidato) || rangeCandidato.toString()).trim();
                if (!txt) return;
                if (degraus.some(d => d.texto === txt)) return;
                degraus.push({ range: rangeCandidato, texto: txt });
            };

            if (typeof this.#deps.expandirUnidadeAtomicaEstagio1 === 'function' && criarRange) {
                const resAtomico = this.#deps.expandirUnidadeAtomicaEstagio1(texto, idxCursor);
                if (resAtomico) adicionarDegrau(criarRange(mapa, resAtomico.inicio, resAtomico.fim));
            }

            if (criarRange) {
                const resComposto =
                    (this.#deps.tentarExpandirPadraoComposto && this.#deps.tentarExpandirPadraoComposto(texto, idxCursor, true, true)) ||
                    (this.#deps.tentarExpandirBlocoMaiusculasComQuebraSuave && this.#deps.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxCursor)) ||
                    (this.#deps.tentarExpandirBlocoFormatadoDestaque && this.#deps.tentarExpandirBlocoFormatadoDestaque(mapa, idxCursor)) ||
                    (this.#deps.tentarExpandirDelimitadoresSimetricos && this.#deps.tentarExpandirDelimitadoresSimetricos(texto, idxCursor, true));
                if (resComposto) adicionarDegrau(criarRange(mapa, resComposto.inicio, resComposto.fim));
            }

            if (criarRange) {
                const resFrase =
                    (this.#deps.expandirSentencaCompletaAtePonto && this.#deps.expandirSentencaCompletaAtePonto(texto, idxCursor)) ||
                    (this.#deps.expandirFraseAtePontuacaoEstagio3 && this.#deps.expandirFraseAtePontuacaoEstagio3(texto, idxCursor));
                if (resFrase) adicionarDegrau(criarRange(mapa, resFrase.inicio, resFrase.fim));
            }

            if (criarRange) {
                const resParagrafo =
                    (this.#deps.delimitarParagrafoLocalizado && this.#deps.delimitarParagrafoLocalizado(mapa.texto, idxCursor, true)) ||
                    (this.#deps.resolverSelecaoTriploClique && this.#deps.resolverSelecaoTriploClique(mapa, idxCursor));
                if (resParagrafo) adicionarDegrau(criarRange(mapa, resParagrafo.inicio, resParagrafo.fim));
            }

            degraus.sort((a, b) => a.texto.length - b.texto.length);
            return degraus;
        }

        isSelecaoExtensaOuMultipage(rangeAlvo, textoRef = '') {
            try {
                const txt = String(textoRef || (rangeAlvo && typeof rangeAlvo.toString === 'function' ? rangeAlvo.toString() : '') || '');
                if (txt.length >= 1200) return true;
                if (txt.split(/\r?\n/).length >= 12) return true;
                if (rangeAlvo && typeof rangeAlvo.getClientRects === 'function') {
                    const rects = rangeAlvo.getClientRects();
                    if (rects && rects.length >= 25) return true;
                }
                if (rangeAlvo && typeof rangeAlvo.getBoundingClientRect === 'function') {
                    const br = rangeAlvo.getBoundingClientRect();
                    const winH = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 768;
                    if (br && br.height > winH * 0.9) return true;
                }
            } catch (_) { }
            return false;
        }

        async executarMotorElastico(e) {
            const ehModoElastico = Boolean(e && e.ctrlKey && !e.altKey && !e.shiftKey);
            if (!e || e.button !== 0 || !ehModoElastico) return false;

            const selection = window.getSelection();
            if (!selection) return false;

            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};
            const aplicarSelecaoECopiar = this.#deps.aplicarSelecaoECopiar;

            if (e.detail >= 2 && e.target && typeof e.target.closest === 'function') {
                const linhaTr = e.target.closest('tr');
                if (linhaTr) {
                    e.preventDefault();
                    e.stopPropagation();
                    const celulasVisiveis = Array.from(linhaTr.querySelectorAll('th, td'))
                        .map(td => (td.innerText || td.textContent || '').replace(rx.ESPACOS_MULTIPLOS || /[ ]{2,}/g, ' ').trim())
                        .filter(Boolean);
                    if (celulasVisiveis.length > 0) {
                        const textoLinha = celulasVisiveis.join(' | ');
                        const rangeLinha = document.createRange();
                        rangeLinha.selectNodeContents(linhaTr);
                        this.#rangeAncoraArrastoElastico = rangeLinha.cloneRange();
                        await aplicarSelecaoECopiar(rangeLinha, false, textoLinha);
                        return true;
                    }
                }
            }

            const infoAlvo = this.#deps.obterRangePalavraOuBlocoNoPonto(e.clientX, e.clientY);
            if (!infoAlvo) return false;

            const { range: clickedRange, mapa } = infoAlvo;
            const resultadoIndices = { inicio: infoAlvo.inicio, fim: infoAlvo.fim };

            e.preventDefault();
            e.stopPropagation();

            if (selection.rangeCount === 0 || selection.isCollapsed || selection.toString().trim() === '') {
                this.#rangeAncoraArrastoElastico = clickedRange.cloneRange();
                await aplicarSelecaoECopiar(clickedRange, false);
                return true;
            }

            const currentRange = selection.getRangeAt(0).cloneRange();
            const isBefore = currentRange.compareBoundaryPoints(Range.START_TO_START, clickedRange) > 0;
            const isAfter = currentRange.compareBoundaryPoints(Range.END_TO_END, clickedRange) < 0;
            const isInside = !isBefore && !isAfter;
            const newRange = document.createRange();
            const sepLivre = rx.SEPARADOR_PONTUACAO_LIVRE || /[\s\p{P}\p{S}]+/gu;
            const sepBorda = rx.SEPARADOR_BORDA_RECUO || /[\s,.;:!?]/;

            try {
                if (isAfter) {
                    newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                    newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                    const ancoraIni = document.createRange();
                    ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                    ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                    this.#rangeAncoraArrastoElastico = ancoraIni;
                } else if (isBefore) {
                    newRange.setStart(clickedRange.startContainer, clickedRange.startOffset);
                    newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                    const ancoraFim = document.createRange();
                    ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                    ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                    this.#rangeAncoraArrastoElastico = ancoraFim;
                } else if (isInside) {
                    const leftSide = document.createRange();
                    leftSide.setStart(currentRange.startContainer, currentRange.startOffset);
                    leftSide.setEnd(clickedRange.startContainer, clickedRange.startOffset);

                    const rightSide = document.createRange();
                    rightSide.setStart(clickedRange.endContainer, clickedRange.endOffset);
                    rightSide.setEnd(currentRange.endContainer, currentRange.endOffset);

                    const leftTextLivre = leftSide.toString().replace(sepLivre, '');
                    const rightTextLivre = rightSide.toString().replace(sepLivre, '');

                    if (leftTextLivre === '' && rightTextLivre === '') {
                        selection.removeAllRanges();
                        if (typeof this.#deps.limparUltimoTexto === 'function') this.#deps.limparUltimoTexto();
                        this.#rangeAncoraArrastoElastico = clickedRange.cloneRange();
                        return true;
                    } else if (leftTextLivre === '') {
                        let newStart = resultadoIndices.fim;
                        while (newStart < mapa.texto.length && sepBorda.test(mapa.texto[newStart])) newStart++;
                        const ptIni = this.#deps.obterPontoDOMNoMapa(mapa, newStart);
                        if (ptIni) {
                            newRange.setStart(ptIni.no, ptIni.offset);
                            newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                        } else {
                            newRange.setStart(clickedRange.endContainer, clickedRange.endOffset);
                            newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                        }
                        const ancoraFim = document.createRange();
                        ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                        ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                        this.#rangeAncoraArrastoElastico = ancoraFim;
                    } else if (rightTextLivre === '') {
                        let newEnd = resultadoIndices.inicio;
                        while (newEnd > 0 && sepBorda.test(mapa.texto[newEnd - 1])) newEnd--;
                        const ptFim = this.#deps.obterPontoDOMNoMapa(mapa, newEnd);
                        if (ptFim) {
                            newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                            newRange.setEnd(ptFim.no, ptFim.offset);
                        } else {
                            newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                            newRange.setEnd(clickedRange.startContainer, clickedRange.startOffset);
                        }
                        const ancoraIni = document.createRange();
                        ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                        ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                        this.#rangeAncoraArrastoElastico = ancoraIni;
                    } else if (leftSide.toString().length <= rightSide.toString().length) {
                        newRange.setStart(clickedRange.startContainer, clickedRange.startOffset);
                        newRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                        const ancoraFim = document.createRange();
                        ancoraFim.setStart(currentRange.endContainer, currentRange.endOffset);
                        ancoraFim.setEnd(currentRange.endContainer, currentRange.endOffset);
                        this.#rangeAncoraArrastoElastico = ancoraFim;
                    } else {
                        newRange.setStart(currentRange.startContainer, currentRange.startOffset);
                        newRange.setEnd(clickedRange.endContainer, clickedRange.endOffset);
                        const ancoraIni = document.createRange();
                        ancoraIni.setStart(currentRange.startContainer, currentRange.startOffset);
                        ancoraIni.setEnd(currentRange.startContainer, currentRange.startOffset);
                        this.#rangeAncoraArrastoElastico = ancoraIni;
                    }
                }

                await aplicarSelecaoECopiar(newRange, false, null, { preservarHistorico: true });
                return true;
            } catch (_) {
                return false;
            }
        }

        atualizarArrastoElasticoNoMovimento(e) {
            if (!this.#rangeAncoraArrastoElastico) return;
            const infoHover = this.#deps.obterRangePalavraOuBlocoNoPonto(e.clientX, e.clientY);
            if (!infoHover || !infoHover.range) return;

            const hoverRange = infoHover.range;
            const selection = window.getSelection();
            if (!selection) return;

            try {
                const novoRange = document.createRange();
                const compInicio = this.#rangeAncoraArrastoElastico.compareBoundaryPoints(Range.START_TO_START, hoverRange);
                const compFim = this.#rangeAncoraArrastoElastico.compareBoundaryPoints(Range.END_TO_END, hoverRange);

                if (compInicio <= 0 && compFim <= 0) {
                    novoRange.setStart(this.#rangeAncoraArrastoElastico.startContainer, this.#rangeAncoraArrastoElastico.startOffset);
                    novoRange.setEnd(hoverRange.endContainer, hoverRange.endOffset);
                } else if (compInicio >= 0 && compFim >= 0) {
                    novoRange.setStart(hoverRange.startContainer, hoverRange.startOffset);
                    novoRange.setEnd(this.#rangeAncoraArrastoElastico.endContainer, this.#rangeAncoraArrastoElastico.endOffset);
                } else {
                    novoRange.setStart(hoverRange.startContainer, hoverRange.startOffset);
                    novoRange.setEnd(hoverRange.endContainer, hoverRange.endOffset);
                }

                selection.removeAllRanges();
                selection.addRange(novoRange);
            } catch (_) { }
        }

        async tentarSelecionarTabelaLinhaOuColuna(e) {
            const alvo = e.target;
            if (!alvo || typeof alvo.closest !== 'function') return false;

            const celula = alvo.closest('td, th');
            if (!celula) return false;
            const tabela = celula.closest('table');
            if (!tabela) return false;
            const linhaTr = celula.closest('tr');

            const modoAcumulador = (e.ctrlKey && e.altKey);
            const rectLinha = linhaTr ? linhaTr.getBoundingClientRect() : null;
            const clicouNaBordaEsquerdaDaLinha = rectLinha && (e.clientX - rectLinha.left) <= 14;
            const ehCabecalhoTh = celula.tagName.toUpperCase() === 'TH';
            const acumulador = this.#deps.acumulador;
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};
            const validador = (typeof this.#deps.obterValidador === 'function') ? this.#deps.obterValidador() : this.#deps.validador;

            if (modoAcumulador && acumulador && typeof acumulador.acumularSelecaoTabelaPorColunasOuLinhas === 'function' &&
                (ehCabecalhoTh || clicouNaBordaEsquerdaDaLinha || e.shiftKey)) {
                const modoTab = clicouNaBordaEsquerdaDaLinha ? 'LINHA' : 'COLUNA';
                const alvoTab = clicouNaBordaEsquerdaDaLinha ? linhaTr : celula;
                const resTab = acumulador.acumularSelecaoTabelaPorColunasOuLinhas(alvoTab, modoTab, e.shiftKey);
                if (resTab) {
                    await this.#deps.gravarNaAreaDeTransferencia(resTab.consolidado || '', null);
                    if (resTab.consolidado && typeof this.#deps.registrarEstatisticaOperacional === 'function') {
                        this.#deps.registrarEstatisticaOperacional(false);
                    }
                    if (validador) {
                        const rangeRef = document.createRange();
                        rangeRef.selectNodeContents(alvoTab);
                        const numIntervalos = resTab.quantidade !== undefined ? resTab.quantidade : 0;
                        const numColunas = resTab.colunas !== undefined ? resTab.colunas : numIntervalos;
                        const numLinhas = resTab.linhas !== undefined ? resTab.linhas : numIntervalos;
                        const numCelulas = resTab.celulas !== undefined ? resTab.celulas : (numColunas * numLinhas);
                        const numCaracteres = resTab.caracteres !== undefined ? resTab.caracteres : (resTab.consolidado ? resTab.consolidado.length : 0);
                        const estatisticaTabela = modoTab === 'COLUNA'
                            ? `TABELA: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numColunas} ${numColunas === 1 ? 'coluna' : 'colunas'} (${numCelulas} celulas) | ${numCaracteres} caracteres`
                            : `TABELA: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numLinhas} ${numLinhas === 1 ? 'linha' : 'linhas'} (${numCelulas} celulas) | ${numCaracteres} caracteres`;
                        validador.projetarAlertaVisual(rangeRef, estatisticaTabela, false);
                    }
                    return true;
                }
            }

            if (!modoAcumulador && clicouNaBordaEsquerdaDaLinha && linhaTr) {
                const celulasVisiveis = Array.from(linhaTr.querySelectorAll('th, td'))
                    .map(td => (td.innerText || td.textContent || '').replace(rx.ESPACOS_MULTIPLOS || /[ ]{2,}/g, ' ').trim())
                    .filter(Boolean);
                if (celulasVisiveis.length > 0) {
                    const separadorTabelas = (typeof this.#deps.obterSeparadorTabelas === 'function') ? this.#deps.obterSeparadorTabelas() : ';';
                    const sepLinha = separadorTabelas === '\t' ? '\t' : (separadorTabelas === ';' ? '; ' : ' | ');
                    const textoLinha = celulasVisiveis.join(sepLinha);
                    const rangeLinha = document.createRange();
                    rangeLinha.selectNodeContents(linhaTr);
                    await this.#deps.aplicarSelecaoECopiar(rangeLinha, false, textoLinha);
                    return true;
                }
            }

            return false;
        }
    }

    Object.freeze(ProgressaoAtalhosSelecao.prototype);
    window.JusGovProgressaoAtalhosSelecao = Object.freeze(ProgressaoAtalhosSelecao);
})();
