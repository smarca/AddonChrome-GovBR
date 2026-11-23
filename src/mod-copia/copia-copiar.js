/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-copiar.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: GerenciadorCopia
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-copiar.js
 * - Classe Exportada: GerenciadorCopia (window.JusGovGerenciadorCopia)
 * - Métodos Públicos: ehAppWebConfiavel(win), localizarBotaoCopiarNativo(alvo), extrairDadosAlvoDeBotaoCopiarNativo(btn), processarTextoCopiaNativaInterceptada(texto, opcoes), interceptarCliqueBotaoCopiarNativo(alvo, ev), registrarEstatisticaOperacional(inconsistencia), executarCopiaDeSelecao(range, modoAcum, sobrescrito, opcoes), aplicarSelecaoECopiar(range, modoAcum, sobrescrito, opcoes), sincronizarCopiaManualParaClipboardInterno(ev)
 * - Dependências Injetadas: GerenciadorClipboardInterno, FiltrosHtml, AcumuladorCopia, FeedbackVisual, ClassificadorComportamentoDOM, PadroesReconhecidosCopia
 * - Regras / Seções: FEAT-64, FEAT-72, BUG-88, BUG-91 (proteção Gemini/Apps Web), ARQ-09 / FEAT-73
 *
 * FINALIDADE:
 * Classe POO dedicada exclusivamente à responsabilidade de CÓPIA (desmembrada da
 * seleção em 6 estágios): orquestra gravação no clipboard do sistema e memória
 * interna em 2 slots, modo acumulador, interceptação/sincronização de cópias
 * nativas (PJe vs apps web confiáveis como Gemini) e contadores operacionais.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovGerenciadorCopia) {
        return;
    }

    const SELETOR_BOTAO_COPIAR_NATIVO = [
        '.icone-copy', '.label-copy', '[class*="icone-copy"]', '[class*="label-copy"]',
        '[class*="copy-to-clipboard"]', '[class*="btn-copy"]', '[class*="copy-btn"]',
        '[data-clipboard-text]', '[data-clipboard-target]', '[cdkcopytoclipboard]',
        'button[title*="Copiar" i]', 'a[title*="Copiar" i]', 'span[title*="Copiar" i]',
        'i[title*="Copiar" i]', 'mat-icon[title*="Copiar" i]', '[aria-label*="Copiar" i]',
        'button[title*="Copy" i]', 'a[title*="Copy" i]', '[aria-label*="Copy" i]'
    ].join(', ');

    const REGEX_DOMINIO_APP_CONFIÁVEL = /(?:^|\.)(?:gemini\.google\.com|bard\.google\.com|docs\.google\.com|chatgpt\.com|chat\.openai\.com|claude\.ai|copilot\.microsoft\.com|notion\.so|web\.whatsapp\.com|github\.com)$/i;
    const LIMITE_MAXIMO_CONTADOR_OPERACIONAL = 999999999;

    class GerenciadorCopia {
        _p_deps;
        _p_ultimoTextoBotaoCopiarNativo;
        _p_ultimoTimestampBotaoCopiarNativo;

        constructor(dependencias = {}) {
            this._p_deps = dependencias || {};
            this._p_ultimoTextoBotaoCopiarNativo = '';
            this._p_ultimoTimestampBotaoCopiarNativo = 0;
        }

        static get SELETOR_BOTAO_COPIAR_NATIVO() {
            return SELETOR_BOTAO_COPIAR_NATIVO;
        }

        registrarEstatisticaOperacional(inconsistenciaDetectada = false) {
            try {
                const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
                if (storageLocal) {
                    storageLocal.get(['totalCopias', 'totalAlertas', 'dataInicioContadores'], (dados) => {
                        if (chrome.runtime && chrome.runtime.lastError) return;
                        const copiasBrutas = (dados && typeof dados.totalCopias === 'number') ? dados.totalCopias : 0;
                        const alertasBrutos = (dados && typeof dados.totalAlertas === 'number') ? dados.totalAlertas : 0;
                        const copiasAtuais = (Number.isSafeInteger(copiasBrutas) && copiasBrutas >= 0 && copiasBrutas < LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? copiasBrutas : 0;
                        const alertasAtuais = (Number.isSafeInteger(alertasBrutos) && alertasBrutos >= 0 && alertasBrutos < LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? alertasBrutos : 0;
                        const proxCopias = (copiasAtuais + 1 >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? 0 : (copiasAtuais + 1);
                        const novoPayload = { totalCopias: proxCopias };
                        if (inconsistenciaDetectada) {
                            novoPayload.totalAlertas = (alertasAtuais + 1 >= LIMITE_MAXIMO_CONTADOR_OPERACIONAL) ? 0 : (alertasAtuais + 1);
                        } else if (alertasAtuais !== alertasBrutos) {
                            novoPayload.totalAlertas = 0;
                        }
                        if (!dados || typeof dados.dataInicioContadores !== 'string' || !dados.dataInicioContadores) {
                            const agora = new Date();
                            const pad = (n) => String(n).padStart(2, '0');
                            novoPayload.dataInicioContadores = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                        }
                        storageLocal.set(novoPayload);
                    });
                }
            } catch (_) { }
        }

        async executarCopiaDeSelecao(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesCopia = {}) {
            if (!rangeAlvo && textoSobrescrito === null) return false;
            const estado = (typeof this._p_deps.obterEstado === 'function') ? this._p_deps.obterEstado() : {};
            const setEstado = (typeof this._p_deps.atualizarEstado === 'function') ? this._p_deps.atualizarEstado : (() => { });
            const acumulador = this._p_deps.acumulador;
            const visual = this._p_deps.visual;
            const validador = (typeof this._p_deps.obterValidador === 'function') ? this._p_deps.obterValidador() : this._p_deps.validador;
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            let textoOriginalRange = '';
            if (rangeAlvo) {
                textoOriginalRange = this._p_deps.extrairTextoPuroSanitizado(rangeAlvo);
                if (!textoOriginalRange) {
                    textoOriginalRange = this._p_deps.higienizarTextoParaCopia(rangeAlvo.toString());
                }
            }

            let textoLimpo = '';
            if (textoSobrescrito !== null) {
                textoLimpo = this._p_deps.higienizarTextoParaCopia(textoSobrescrito);
                if (opcoesCopia && opcoesCopia.forcarUmaLinha) {
                    textoLimpo = this._p_deps.unificarLinhasComEspacamentoAntiTruncamento(textoLimpo);
                }
            } else {
                textoLimpo = textoOriginalRange;
            }
            if (!textoLimpo || textoLimpo.length === 0) return false;

            const matchDataSep = textoLimpo.match(/^(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{2,4})((?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
            if (matchDataSep) {
                textoLimpo = `${matchDataSep[1]}/${matchDataSep[2]}/${matchDataSep[3]}${matchDataSep[4] || ''}`;
            }

            if (modoAcumulador && acumulador) {
                if (acumulador.obterQuantidade() === 0 && estado.ultimoTextoSelecionadoLimpo && estado.ultimoTextoSelecionadoLimpo !== textoLimpo) {
                    acumulador.absorverSelecaoPreviaSeVazio(estado.ultimoTextoSelecionadoLimpo, estado.ultimoRangeSelecionadoSimples);
                    setEstado({ ultimoTextoSelecionadoLimpo: '', ultimoRangeSelecionadoSimples: null });
                }

                const ehModoBaralho = (typeof window !== 'undefined' && window.__JUSGOV_MODO_BARALHO__ === true);
                const res = acumulador.adicionarItem(textoLimpo, rangeAlvo, ehModoBaralho);
                if (res) {
                    await this._p_deps.gravarNaAreaDeTransferencia(res.consolidado || '', null);
                    await this._p_deps.cederControleAoCompositorBlink();
                    let alertaInvalido = false;
                    if (validador && rangeAlvo) {
                        const textoParaAuditoria = (textoOriginalRange && textoOriginalRange.trim().length > 0) ? textoOriginalRange.trim() : textoLimpo;
                        const check = estado.validacaoMatematicaAtiva
                            ? validador.auditarEAlerta(textoParaAuditoria, rangeAlvo, { textoSobrescrito: (textoSobrescrito !== null) ? textoLimpo : null })
                            : { valido: true, msg: '' };
                        alertaInvalido = !check.valido;
                        if (check.valido) {
                            const numIntervalos = res.quantidade !== undefined ? res.quantidade : acumulador.obterQuantidade();
                            const numPalavras = res.palavras !== undefined
                                ? res.palavras
                                : (res.consolidado ? res.consolidado.replace(rx.PONTO_VIRGULA_FINAL || /;\s*$/, '').split(rx.SEPARADOR_TOKENS_ACUMULADOR || /[;\s]+/).filter(Boolean).length : 0);
                            const numCaracteres = res.caracteres !== undefined ? res.caracteres : (res.consolidado ? res.consolidado.length : 0);
                            validador.projetarAlertaVisual(
                                rangeAlvo,
                                `ACUMULADOR: ${numIntervalos} ${numIntervalos === 1 ? 'intervalo' : 'intervalos'} | ${numPalavras} ${numPalavras === 1 ? 'palavra' : 'palavras'} | ${numCaracteres} caracteres`,
                                false
                            );
                        }
                    }
                    this.registrarEstatisticaOperacional(alertaInvalido);
                }
                return true;
            }

            if (acumulador) acumulador.limpar();
            setEstado({
                ultimoTextoSelecionadoLimpo: textoLimpo,
                ultimoRangeSelecionadoSimples: (rangeAlvo && typeof rangeAlvo.cloneRange === 'function') ? rangeAlvo.cloneRange() : null
            });

            if (!(opcoesCopia && opcoesCopia.pularMarcadorColado === true) &&
                visual && typeof visual.registrarCopiaCandidataParaMarcador === 'function' && rangeAlvo) {
                try { visual.registrarCopiaCandidataParaMarcador(rangeAlvo, textoLimpo); } catch (_) { }
            }

            const rangeParaGravacao = (opcoesCopia && opcoesCopia.forcarUmaLinha) ? null : rangeAlvo;
            const ehAlteracaoContorno = Boolean(opcoesCopia && opcoesCopia.preservarHistorico);
            await this._p_deps.gravarNaAreaDeTransferencia(textoLimpo, rangeParaGravacao, { preservarHistorico: ehAlteracaoContorno });

            try {
                const idInstanciaCopia = (typeof window !== 'undefined')
                    ? (window.__JUSGOV_ID_INSTANCIA_FRAME__ || (window.__JUSGOV_ID_INSTANCIA_FRAME__ = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
                    : 'frame';
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({
                        ultimaNotificacaoCopiaGlobal: { idOrigem: idInstanciaCopia, texto: textoLimpo, timestamp: Date.now() }
                    });
                }
            } catch (_) { }

            try {
                const selAssinatura = window.getSelection();
                const ass = this._p_deps.calcularAssinaturaSelecao(selAssinatura);
                if (ass) {
                    setEstado({ ultimoRangeAssinaturaGlobal: ass });
                } else if (rangeAlvo) {
                    setEstado({ ultimoRangeAssinaturaGlobal: `${rangeAlvo.startOffset}_${rangeAlvo.endOffset}_${textoLimpo}` });
                }
            } catch (_) { }

            await this._p_deps.cederControleAoCompositorBlink();
            let alertaInvalido = false;
            if (!(opcoesCopia && opcoesCopia.pularAuditoriaPesada === true) && validador && estado.validacaoMatematicaAtiva && rangeAlvo) {
                const ehForcadoTextoPuro = Boolean(opcoesCopia && opcoesCopia.forcarUmaLinha && textoSobrescrito !== null);
                const textoParaAuditoria = (!ehForcadoTextoPuro && textoOriginalRange && textoOriginalRange.trim().length > 0) ? textoOriginalRange.trim() : textoLimpo;
                const check = validador.auditarEAlerta(textoParaAuditoria, rangeAlvo, {
                    textoSobrescrito: (textoSobrescrito !== null) ? textoLimpo : null
                });
                alertaInvalido = !check.valido;
            }
            this.registrarEstatisticaOperacional(alertaInvalido);
            return true;
        }

        async aplicarSelecaoECopiar(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesSelecao = {}) {
            const temModificador = Boolean(opcoesSelecao && opcoesSelecao.temModificador);
            if (!temModificador && this._p_deps.isSelecaoOuElementoEmCampoEditavel(rangeAlvo)) {
                return false;
            }
            if (!rangeAlvo) return false;

            let textoPreview = '';
            if (textoSobrescrito !== null) {
                textoPreview = this._p_deps.higienizarTextoParaCopia(textoSobrescrito);
            } else {
                textoPreview = this._p_deps.extrairTextoPuroSanitizado(rangeAlvo) || this._p_deps.higienizarTextoParaCopia(rangeAlvo.toString());
            }
            if (!textoPreview || textoPreview.length === 0) return false;

            const estado = (typeof this._p_deps.obterEstado === 'function') ? this._p_deps.obterEstado() : {};
            const setEstado = (typeof this._p_deps.atualizarEstado === 'function') ? this._p_deps.atualizarEstado : (() => { });
            const elAlvoVerif = rangeAlvo.commonAncestorContainer || null;
            const minCustomizado = (opcoesSelecao && typeof opcoesSelecao.minimoCaracteres === 'number')
                ? opcoesSelecao.minimoCaracteres
                : ((opcoesSelecao && opcoesSelecao.eraArrasto) ? (temModificador ? 1 : 2) : null);

            if (!this._p_deps.verificarProtecaoTamanhoMinimoInterface(textoPreview, elAlvoVerif, temModificador, minCustomizado)) {
                const eraArrastoBloq = Boolean(opcoesSelecao && opcoesSelecao.eraArrasto);
                const modoRetBloq = estado.modoRetirarSelecao;
                if (!eraArrastoBloq && modoRetBloq !== 'com_flash' && modoRetBloq !== 'nenhuma') {
                    try {
                        const sel = window.getSelection();
                        if (sel) sel.removeAllRanges();
                    } catch (_) { }
                }
                return false;
            }

            if (typeof this._p_deps.limparTimerDebounceSelecao === 'function') {
                this._p_deps.limparTimerDebounceSelecao();
            }

            setEstado({ selecaoSendoAplicadaPeloAddon: true });
            try {
                const eraArrasto = Boolean(opcoesSelecao && opcoesSelecao.eraArrasto);
                const ehExtensaMultipage = Boolean(
                    (opcoesSelecao && opcoesSelecao.semFlashEMarcador === true) ||
                    this._p_deps.isSelecaoExtensaOuMultipage(rangeAlvo, textoPreview)
                );
                const elAlvo = rangeAlvo ? rangeAlvo.commonAncestorContainer : null;
                const modoRet = estado.modoRetirarSelecao;
                const tempoFlash = estado.tempoFlashBorderMs;

                let deveManter = true;
                if (ehExtensaMultipage || modoAcumulador) deveManter = true;
                else if (modoRet === 'nenhuma') deveManter = true;
                else if (modoRet === 'com_flash') deveManter = (tempoFlash === 0);
                else if (modoRet === 'total') deveManter = false;
                else if (modoRet === 'total_exceto_arrasto') deveManter = (eraArrasto === true);
                else if (typeof opcoesSelecao.forcarManterSelecao === 'boolean') deveManter = opcoesSelecao.forcarManterSelecao;
                else if (typeof opcoesSelecao.forcarDesselecao === 'boolean') deveManter = !opcoesSelecao.forcarDesselecao;
                else deveManter = this._p_deps.deveManterSelecaoAtivaNoDom(elAlvo, eraArrasto);

                this._p_deps.aplicarSelecaoDOM(rangeAlvo, {
                    ...opcoesSelecao,
                    forcarManterSelecao: deveManter,
                    forcarDesselecao: !deveManter,
                    dispararFlash: false,
                    limparImediatamente: false
                });

                const copiou = await this.executarCopiaDeSelecao(rangeAlvo, modoAcumulador, textoSobrescrito, {
                    forcarUmaLinha: Boolean(opcoesSelecao && opcoesSelecao.forcarUmaLinha),
                    pularMarcadorColado: ehExtensaMultipage,
                    pularAuditoriaPesada: ehExtensaMultipage
                });
                if (!copiou) return false;

                let flashAtivou = false;
                if (!modoAcumulador && !ehExtensaMultipage) {
                    if (tempoFlash !== 0) {
                        if (!deveManter) setEstado({ flashExclusivoSemSelecao: true });
                        flashAtivou = Boolean(this._p_deps.dispararFlashBorderVisual(rangeAlvo));
                    } else {
                        this._p_deps.limparFlashBorderImediatamente();
                    }
                } else if (ehExtensaMultipage) {
                    setEstado({ flashExclusivoSemSelecao: false });
                    this._p_deps.limparFlashBorderImediatamente();
                }

                if (modoRet === 'com_flash' && !flashAtivou) {
                    deveManter = true;
                    setEstado({ flashExclusivoSemSelecao: false });
                    this._p_deps.aplicarSelecaoDOM(rangeAlvo, {
                        ...opcoesSelecao,
                        forcarManterSelecao: true,
                        forcarDesselecao: false,
                        dispararFlash: false,
                        limparImediatamente: false
                    });
                }

                if (!deveManter) {
                    if (tempoFlash > 0 || tempoFlash === -1) {
                        setEstado({ flashExclusivoSemSelecao: true });
                    }
                    setTimeout(() => {
                        try {
                            const sel = window.getSelection();
                            if (sel) sel.removeAllRanges();
                        } catch (_) { }
                        const estAtual = (typeof this._p_deps.obterEstado === 'function') ? this._p_deps.obterEstado() : {};
                        if ((estAtual.tempoFlashBorderMs || 0) === 0) {
                            setEstado({ flashExclusivoSemSelecao: false });
                        }
                    }, 20);
                }

                return true;
            } catch (_) {
                return false;
            } finally {
                setTimeout(() => {
                    setEstado({ selecaoSendoAplicadaPeloAddon: false });
                }, 300);
            }
        }

        sincronizarCopiaManualParaClipboardInterno(evCopyOpt = null) {
            try {
                let textoCtrlC = '';
                let htmlCtrlC = '';
                let rangeCtrlC = null;
                let veioDeInputPuro = false;
                const elAtv = document.activeElement;
                if (elAtv && (elAtv.tagName === 'INPUT' || elAtv.tagName === 'TEXTAREA')) {
                    if (typeof elAtv.selectionStart === 'number' && typeof elAtv.selectionEnd === 'number' && elAtv.selectionEnd > elAtv.selectionStart) {
                        textoCtrlC = String(elAtv.value || '').substring(elAtv.selectionStart, elAtv.selectionEnd);
                        veioDeInputPuro = true;
                    }
                }
                if (!textoCtrlC || textoCtrlC.trim().length === 0) {
                    let selObj = (typeof window.getSelection === 'function') ? window.getSelection() : null;
                    if ((!selObj || selObj.isCollapsed || selObj.rangeCount === 0) && elAtv && elAtv.shadowRoot && typeof elAtv.shadowRoot.getSelection === 'function') {
                        selObj = elAtv.shadowRoot.getSelection();
                    }
                    if (selObj && !selObj.isCollapsed && selObj.rangeCount > 0) {
                        const r = selObj.getRangeAt(0);
                        textoCtrlC = String(selObj.toString() || '');
                        if (r && !this._p_deps.isSelecaoExtensaOuMultipage(r, textoCtrlC)) {
                            rangeCtrlC = r;
                        }
                    }
                }
                if ((!textoCtrlC || textoCtrlC.trim().length === 0) && evCopyOpt && evCopyOpt.clipboardData && typeof evCopyOpt.clipboardData.getData === 'function') {
                    textoCtrlC = evCopyOpt.clipboardData.getData('text/plain') || '';
                    if (!htmlCtrlC) htmlCtrlC = evCopyOpt.clipboardData.getData('text/html') || '';
                }
                const textoLimpoCtrlC = this._p_deps.higienizarTextoParaCopia(textoCtrlC);
                if (textoLimpoCtrlC && textoLimpoCtrlC.trim().length > 0) {
                    if (typeof this._p_deps.atualizarEstado === 'function') {
                        this._p_deps.atualizarEstado({ ultimoTextoSelecionadoLimpo: textoLimpoCtrlC });
                    }

                    const estado = (typeof this._p_deps.obterEstado === 'function') ? this._p_deps.obterEstado() : {};
                    const normFn = this._p_deps.normalizarNivelFiltro;
                    const nivelCfg = (typeof normFn === 'function') ? normFn(estado.nivelFiltroFormatacao) : (estado.nivelFiltroFormatacao || 'basico');
                    const verifBlocoFn = this._p_deps.verificarSeTextoEhBlocoOuPalavraUnica;
                    const ehBlocoPuro = (typeof verifBlocoFn === 'function') ? Boolean(verifBlocoFn(textoLimpoCtrlC)) : false;
                    const podeFormatar = Boolean(!veioDeInputPuro && estado.manterFormatacaoBasica !== false && nivelCfg !== 'texto_puro' && !ehBlocoPuro);
                    const forcarFonteCtrlC = Boolean(!podeFormatar && estado.padronizarFonteCopiaAtivo === true);

                    let htmlFinal = '';
                    let formatosExtras = null;
                    let nivelCopia = 'texto_puro';

                    if (forcarFonteCtrlC) {
                        const fonteLimpa = String(estado.fontePadraoCopia || 'Arial').trim().replace(/[;"'\r\n<>]/g, '') || 'Arial';
                        const fonteCss = /\s/.test(fonteLimpa) ? `'${fonteLimpa}'` : fonteLimpa;
                        const tamRaw = String(estado.tamanhoFontePadraoCopia || '12').trim().replace(/[;"'\r\n<>]/g, '') || '12';
                        const tamCss = /^\d+(?:\.\d+)?$/.test(tamRaw) ? `${tamRaw}pt` : tamRaw;
                        const esc = textoLimpoCtrlC.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>');
                        htmlFinal = `<span style="font-family: ${fonteCss}; font-size: ${tamCss};">${esc}</span>`;
                        nivelCopia = 'basico';
                    } else if (podeFormatar && typeof this._p_deps.gerarMapaFormatosClipboard === 'function') {
                        try {
                            const origemMapa = rangeCtrlC || htmlCtrlC;
                            if (origemMapa) {
                                const mapa = this._p_deps.gerarMapaFormatosClipboard(origemMapa, nivelCfg, { textoFallback: textoLimpoCtrlC });
                                if (mapa && mapa.htmlClipboard) {
                                    htmlFinal = mapa.htmlClipboard;
                                    nivelCopia = mapa.nivelNorm || nivelCfg;
                                    formatosExtras = {
                                        uriList: mapa.uriList || '',
                                        markdown: mapa.markdown || '',
                                        rtf: mapa.rtf || '',
                                        estruturadoMime: (mapa.estruturado && mapa.estruturado.mime) || '',
                                        estruturadoConteudo: (mapa.estruturado && mapa.estruturado.conteudo) || '',
                                        svgMarkup: (mapa.imagens && mapa.imagens.svgMarkup) || ''
                                    };
                                }
                            }
                        } catch (_) {
                            htmlFinal = '';
                            formatosExtras = null;
                            nivelCopia = 'texto_puro';
                        }
                    } else if (podeFormatar && !rangeCtrlC && htmlCtrlC && htmlCtrlC.length <= 250000) {
                        htmlFinal = htmlCtrlC;
                        nivelCopia = nivelCfg;
                    }

                    if (estado.padronizarFonteCopiaAtivo === true && htmlFinal && evCopyOpt && evCopyOpt.clipboardData && typeof evCopyOpt.clipboardData.setData === 'function') {
                        try {
                            evCopyOpt.clipboardData.setData('text/html', htmlFinal);
                            evCopyOpt.clipboardData.setData('text/plain', textoLimpoCtrlC);
                            if (typeof evCopyOpt.preventDefault === 'function') evCopyOpt.preventDefault();
                        } catch (_) { }
                    }

                    this._p_deps.salvarClipboardInternoComBackup({
                        texto: textoLimpoCtrlC,
                        html: htmlFinal,
                        formatado: Boolean(htmlFinal),
                        nivelCopia,
                        formatosExtras
                    });
                }
            } catch (_) { }
        }
    }

        const _ext_GerenciadorCopia = [
        { g: 'JusGovCopiaCopiarNativo', p: './copia-copiar-nativo.js' }
    ];
    for (let i = 0; i < _ext_GerenciadorCopia.length; i++) {
        const it = _ext_GerenciadorCopia[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(GerenciadorCopia.prototype);
        }
    }

    Object.freeze(GerenciadorCopia.prototype);
    window.JusGovGerenciadorCopia = Object.freeze(GerenciadorCopia);
})();

