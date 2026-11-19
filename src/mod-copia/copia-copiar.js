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
        #deps;
        #ultimoTextoBotaoCopiarNativo;
        #ultimoTimestampBotaoCopiarNativo;

        constructor(dependencias = {}) {
            this.#deps = dependencias || {};
            this.#ultimoTextoBotaoCopiarNativo = '';
            this.#ultimoTimestampBotaoCopiarNativo = 0;
        }

        static get SELETOR_BOTAO_COPIAR_NATIVO() {
            return SELETOR_BOTAO_COPIAR_NATIVO;
        }

        ehAppWebConfiavel(winOpt = null) {
            try {
                const refWin = winOpt || (typeof window !== 'undefined' ? window : null);
                const host = String((refWin && refWin.location && refWin.location.hostname) || '').toLowerCase();
                return REGEX_DOMINIO_APP_CONFIÁVEL.test(host);
            } catch (_) {
                return false;
            }
        }

        localizarBotaoCopiarNativo(alvo) {
            if (!alvo) return null;
            const base = (alvo.nodeType === 1) ? alvo : (alvo.parentElement || null);
            if (!base || typeof base.closest !== 'function') return null;
            try {
                const direto = base.closest(SELETOR_BOTAO_COPIAR_NATIVO);
                if (direto) return direto;
                let atual = base;
                let passos = 0;
                while (atual && atual !== document.body && passos < 3) {
                    const tit = String(atual.getAttribute('title') || atual.getAttribute('aria-label') || '');
                    if (/\b(?:copiar|copy)\b/i.test(tit)) return atual;
                    atual = atual.parentElement;
                    passos++;
                }
            } catch (_) { }
            return null;
        }

        extrairDadosAlvoDeBotaoCopiarNativo(btnEl) {
            if (!btnEl) return null;
            try {
                const doc = btnEl.ownerDocument || document;
                const dadosDiretos = (btnEl.getAttribute('data-clipboard-text') || btnEl.getAttribute('cdkcopytoclipboard') || '').trim();
                if (dadosDiretos) {
                    return { texto: dadosDiretos, range: null, elementoFonte: btnEl };
                }

                const seletorTarget = (btnEl.getAttribute('data-clipboard-target') || '').trim();
                if (seletorTarget) {
                    const elTarget = doc.querySelector(seletorTarget);
                    if (elTarget) {
                        const txtTarget = (elTarget.value !== undefined ? String(elTarget.value) : (elTarget.innerText || elTarget.textContent || '')).trim();
                        if (txtTarget) {
                            let rTarget = null;
                            if (elTarget.nodeType === 1 && elTarget.tagName !== 'INPUT' && elTarget.tagName !== 'TEXTAREA' && typeof doc.createRange === 'function') {
                                rTarget = doc.createRange();
                                rTarget.selectNodeContents(elTarget);
                            }
                            return { texto: txtTarget, range: rTarget, elementoFonte: elTarget };
                        }
                    }
                }

                const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
                const regexAud = cExt.REGEX_AUDITORIA || {};
                const ehTextoEstruturadoValido = (txt) => {
                    const t = String(txt || '').trim();
                    if (!t) return false;
                    return Boolean(
                        (regexAud.CNJ_ISOLADO && regexAud.CNJ_ISOLADO.test(t)) ||
                        (regexAud.CPF_ISOLADO && regexAud.CPF_ISOLADO.test(t)) ||
                        (regexAud.CNPJ_ISOLADO && regexAud.CNPJ_ISOLADO.test(t)) ||
                        /\d{6,7}-?\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(t) ||
                        /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(t) ||
                        /\b[0-9A-Za-z]{2}\.[0-9A-Za-z]{3}\.[0-9A-Za-z]{3}\/[0-9A-Za-z]{4}-\d{2}\b/.test(t)
                    );
                };

                const extrairCandidatoDeContainer = (containerEl) => {
                    if (!containerEl) return null;
                    const walker = doc.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, {
                        acceptNode(n) {
                            const p = n.parentElement;
                            if (!p) return NodeFilter.FILTER_REJECT;
                            if (p === btnEl || btnEl.contains(p)) return NodeFilter.FILTER_REJECT;
                            if (typeof p.matches === 'function' && p.matches(SELETOR_BOTAO_COPIAR_NATIVO)) return NodeFilter.FILTER_REJECT;
                            const s = String(n.nodeValue || '').trim();
                            return s ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                        }
                    });
                    const nosTexto = [];
                    let no;
                    while ((no = walker.nextNode())) {
                        nosTexto.push(no);
                    }
                    if (nosTexto.length === 0) return null;

                    for (let i = nosTexto.length - 1; i >= 0; i--) {
                        const nAtual = nosTexto[i];
                        const val = String(nAtual.nodeValue || '');
                        const matchCnj = val.match(/\d{6,7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
                        if (matchCnj) {
                            const rCnj = doc.createRange();
                            const idxIni = val.indexOf(matchCnj[0]);
                            rCnj.setStart(nAtual, idxIni);
                            rCnj.setEnd(nAtual, idxIni + matchCnj[0].length);
                            return { texto: matchCnj[0], range: rCnj, elementoFonte: nAtual.parentElement || containerEl };
                        }
                        if (ehTextoEstruturadoValido(val)) {
                            const trimVal = val.trim();
                            const rEst = doc.createRange();
                            const idxIni = val.indexOf(trimVal);
                            rEst.setStart(nAtual, idxIni);
                            rEst.setEnd(nAtual, idxIni + trimVal.length);
                            return { texto: trimVal, range: rEst, elementoFonte: nAtual.parentElement || containerEl };
                        }
                    }

                    const textoAcum = nosTexto.map(n => String(n.nodeValue || '').trim()).filter(Boolean).join(' ').trim();
                    if (textoAcum && textoAcum.length <= 160) {
                        const rCont = doc.createRange();
                        rCont.setStart(nosTexto[0], 0);
                        rCont.setEnd(nosTexto[nosTexto.length - 1], nosTexto[nosTexto.length - 1].nodeValue.length);
                        return { texto: textoAcum, range: rCont, elementoFonte: containerEl };
                    }
                    return null;
                };

                const elIrmaoAnt = btnEl.previousElementSibling;
                if (elIrmaoAnt && !elIrmaoAnt.matches('input[type="checkbox"], input[type="radio"]')) {
                    const candIrmao = extrairCandidatoDeContainer(elIrmaoAnt);
                    if (candIrmao && candIrmao.texto) return candIrmao;
                }

                let ancestral = btnEl.parentElement;
                let passos = 0;
                while (ancestral && ancestral !== doc.body && ancestral !== doc.documentElement && passos < 3) {
                    const candPai = extrairCandidatoDeContainer(ancestral);
                    if (candPai && candPai.texto) return candPai;
                    ancestral = ancestral.parentElement;
                    passos++;
                }
            } catch (_) { }
            return null;
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

        async processarTextoCopiaNativaInterceptada(textoBruto, opcoes = {}) {
            if (typeof textoBruto !== 'string') return false;
            const estado = (typeof this.#deps.obterEstado === 'function') ? this.#deps.obterEstado() : {};
            const setEstado = (typeof this.#deps.atualizarEstado === 'function') ? this.#deps.atualizarEstado : (() => { });

            if (opcoes && opcoes.preservarBruto === true) {
                const bruto = textoBruto;
                if (!bruto.trim()) return false;
                setEstado({ ultimoTextoSelecionadoLimpo: bruto.trim() });
                const htmlBruto = typeof opcoes.html === 'string' ? opcoes.html : '';
                const normFn = this.#deps.normalizarNivelFiltro;
                const nivelRaw = (typeof normFn === 'function') ? normFn(estado.nivelFiltroFormatacao) : (estado.nivelFiltroFormatacao || 'basico');
                const temHtml = Boolean(htmlBruto && nivelRaw !== 'texto_puro');
                this.#deps.salvarClipboardInternoComBackup({
                    texto: bruto,
                    html: temHtml ? htmlBruto : '',
                    formatado: temHtml,
                    nivelCopia: temHtml ? nivelRaw : 'texto_puro'
                });
                return true;
            }

            let textoLimpo = this.#deps.higienizarTextoParaCopia(textoBruto);
            if (!textoLimpo) return false;

            const matchDataSep = textoLimpo.match(/^(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{2,4})((?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
            if (matchDataSep) {
                textoLimpo = `${matchDataSep[1]}/${matchDataSep[2]}/${matchDataSep[3]}${matchDataSep[4] || ''}`;
            }

            if (opcoes && opcoes.comShift) {
                const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
                const regexAud = cExt.REGEX_AUDITORIA || {};
                const rx = cExt.EXPRESSOES_REGULARES || {};
                const ehCnpjAlfa = regexAud.CNPJ_ISOLADO && regexAud.CNPJ_ISOLADO.test(textoLimpo);
                let digitos = ehCnpjAlfa
                    ? textoLimpo.toUpperCase().replace(rx.NAO_ALFANUMERICO_UPPER || /[^0-9A-Z]/g, '')
                    : this.#deps.aplicarLimpezaNumericaComTravaAlfabetica(textoLimpo);
                if (rx.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL) {
                    const matchCnj = textoLimpo.match(rx.ESTRUTURA_CNJ_COMPLETA_OU_PARCIAL);
                    if (matchCnj && estado.modoShiftCnj !== 'semZeros') {
                        const seqPad = matchCnj[1].padStart(7, '0');
                        const soDigitos = textoLimpo.replace(rx.NAO_DIGITOS || /\D+/g, '');
                        digitos = seqPad + soDigitos.substring(matchCnj[1].length);
                    }
                }
                if (digitos) textoLimpo = digitos;
            }

            const agora = Date.now();
            if (textoLimpo === this.#ultimoTextoBotaoCopiarNativo && (agora - this.#ultimoTimestampBotaoCopiarNativo) < 350) {
                return true;
            }
            this.#ultimoTextoBotaoCopiarNativo = textoLimpo;
            this.#ultimoTimestampBotaoCopiarNativo = agora;

            const rangeAlvo = (opcoes && opcoes.range) ? opcoes.range : null;
            const modoAcum = Boolean(opcoes && opcoes.modoAcumulador);

            if (!modoAcum) {
                setEstado({ ultimoTextoSelecionadoLimpo: textoLimpo });
                this.#deps.salvarClipboardInternoComBackup({ texto: textoLimpo, html: '', formatado: false, nivelCopia: 'texto_puro' });
            }
            if (opcoes && opcoes.apenasInterno === true) {
                return true;
            }

            if (rangeAlvo) {
                if ((estado.tempoFlashBorderMs || 0) !== 0) {
                    setEstado({ flashExclusivoSemSelecao: true });
                    this.#deps.dispararFlashBorderVisual(rangeAlvo);
                }
                await this.executarCopiaDeSelecao(rangeAlvo, modoAcum, textoLimpo, { forcarUmaLinha: true });
            } else {
                setEstado({ ultimoTextoSelecionadoLimpo: textoLimpo });
                await this.#deps.gravarNaAreaDeTransferencia(textoLimpo, null);
                const validador = (typeof this.#deps.obterValidador === 'function') ? this.#deps.obterValidador() : this.#deps.validador;
                if (validador && estado.validacaoMatematicaAtiva) {
                    try {
                        const rFallback = (opcoes && opcoes.elementoFonte && document.createRange) ? (() => {
                            const r = document.createRange();
                            r.selectNode(opcoes.elementoFonte);
                            return r;
                        })() : null;
                        if (rFallback) {
                            const check = validador.auditarEAlerta(textoBruto.trim(), rFallback, { textoSobrescrito: textoLimpo });
                            this.registrarEstatisticaOperacional(!check.valido);
                        } else {
                            this.registrarEstatisticaOperacional(false);
                        }
                    } catch (_) { }
                } else {
                    this.registrarEstatisticaOperacional(false);
                }
            }

            setTimeout(() => {
                if (this.#ultimoTextoBotaoCopiarNativo === textoLimpo) {
                    this.#deps.gravarNaAreaDeTransferencia(textoLimpo, null, { preservarHistorico: true }).catch(() => { });
                }
            }, 65);

            return true;
        }

        async interceptarCliqueBotaoCopiarNativo(elAlvo, eventoMouse = null) {
            const btnCopiar = this.localizarBotaoCopiarNativo(elAlvo);
            if (!btnCopiar) return false;
            const dados = this.extrairDadosAlvoDeBotaoCopiarNativo(btnCopiar);
            if (!dados || !dados.texto) return false;
            const comShift = Boolean(eventoMouse && eventoMouse.shiftKey);
            const modoAcum = Boolean(eventoMouse && eventoMouse.ctrlKey && eventoMouse.altKey);
            return this.processarTextoCopiaNativaInterceptada(dados.texto, {
                range: dados.range || null,
                elementoFonte: dados.elementoFonte || btnCopiar,
                comShift,
                modoAcumulador: modoAcum
            });
        }

        async executarCopiaDeSelecao(rangeAlvo, modoAcumulador = false, textoSobrescrito = null, opcoesCopia = {}) {
            if (!rangeAlvo && textoSobrescrito === null) return false;
            const estado = (typeof this.#deps.obterEstado === 'function') ? this.#deps.obterEstado() : {};
            const setEstado = (typeof this.#deps.atualizarEstado === 'function') ? this.#deps.atualizarEstado : (() => { });
            const acumulador = this.#deps.acumulador;
            const visual = this.#deps.visual;
            const validador = (typeof this.#deps.obterValidador === 'function') ? this.#deps.obterValidador() : this.#deps.validador;
            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const rx = cExt.EXPRESSOES_REGULARES || {};

            let textoOriginalRange = '';
            if (rangeAlvo) {
                textoOriginalRange = this.#deps.extrairTextoPuroSanitizado(rangeAlvo);
                if (!textoOriginalRange) {
                    textoOriginalRange = this.#deps.higienizarTextoParaCopia(rangeAlvo.toString());
                }
            }

            let textoLimpo = '';
            if (textoSobrescrito !== null) {
                textoLimpo = this.#deps.higienizarTextoParaCopia(textoSobrescrito);
                if (opcoesCopia && opcoesCopia.forcarUmaLinha) {
                    textoLimpo = this.#deps.unificarLinhasComEspacamentoAntiTruncamento(textoLimpo);
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
                    await this.#deps.gravarNaAreaDeTransferencia(res.consolidado || '', null);
                    await this.#deps.cederControleAoCompositorBlink();
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
            await this.#deps.gravarNaAreaDeTransferencia(textoLimpo, rangeParaGravacao, { preservarHistorico: ehAlteracaoContorno });

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
                const ass = this.#deps.calcularAssinaturaSelecao(selAssinatura);
                if (ass) {
                    setEstado({ ultimoRangeAssinaturaGlobal: ass });
                } else if (rangeAlvo) {
                    setEstado({ ultimoRangeAssinaturaGlobal: `${rangeAlvo.startOffset}_${rangeAlvo.endOffset}_${textoLimpo}` });
                }
            } catch (_) { }

            await this.#deps.cederControleAoCompositorBlink();
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
            if (!temModificador && this.#deps.isSelecaoOuElementoEmCampoEditavel(rangeAlvo)) {
                return false;
            }
            if (!rangeAlvo) return false;

            let textoPreview = '';
            if (textoSobrescrito !== null) {
                textoPreview = this.#deps.higienizarTextoParaCopia(textoSobrescrito);
            } else {
                textoPreview = this.#deps.extrairTextoPuroSanitizado(rangeAlvo) || this.#deps.higienizarTextoParaCopia(rangeAlvo.toString());
            }
            if (!textoPreview || textoPreview.length === 0) return false;

            const estado = (typeof this.#deps.obterEstado === 'function') ? this.#deps.obterEstado() : {};
            const setEstado = (typeof this.#deps.atualizarEstado === 'function') ? this.#deps.atualizarEstado : (() => { });
            const elAlvoVerif = rangeAlvo.commonAncestorContainer || null;
            const minCustomizado = (opcoesSelecao && typeof opcoesSelecao.minimoCaracteres === 'number')
                ? opcoesSelecao.minimoCaracteres
                : ((opcoesSelecao && opcoesSelecao.eraArrasto) ? (temModificador ? 1 : 2) : null);

            if (!this.#deps.verificarProtecaoTamanhoMinimoInterface(textoPreview, elAlvoVerif, temModificador, minCustomizado)) {
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

            if (typeof this.#deps.limparTimerDebounceSelecao === 'function') {
                this.#deps.limparTimerDebounceSelecao();
            }

            setEstado({ selecaoSendoAplicadaPeloAddon: true });
            try {
                const eraArrasto = Boolean(opcoesSelecao && opcoesSelecao.eraArrasto);
                const ehExtensaMultipage = Boolean(
                    (opcoesSelecao && opcoesSelecao.semFlashEMarcador === true) ||
                    this.#deps.isSelecaoExtensaOuMultipage(rangeAlvo, textoPreview)
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
                else deveManter = this.#deps.deveManterSelecaoAtivaNoDom(elAlvo, eraArrasto);

                this.#deps.aplicarSelecaoDOM(rangeAlvo, {
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
                        flashAtivou = Boolean(this.#deps.dispararFlashBorderVisual(rangeAlvo));
                    } else {
                        this.#deps.limparFlashBorderImediatamente();
                    }
                } else if (ehExtensaMultipage) {
                    setEstado({ flashExclusivoSemSelecao: false });
                    this.#deps.limparFlashBorderImediatamente();
                }

                if (modoRet === 'com_flash' && !flashAtivou) {
                    deveManter = true;
                    setEstado({ flashExclusivoSemSelecao: false });
                    this.#deps.aplicarSelecaoDOM(rangeAlvo, {
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
                        const estAtual = (typeof this.#deps.obterEstado === 'function') ? this.#deps.obterEstado() : {};
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
                        if (r && !this.#deps.isSelecaoExtensaOuMultipage(r, textoCtrlC)) {
                            rangeCtrlC = r;
                        }
                    }
                }
                if ((!textoCtrlC || textoCtrlC.trim().length === 0) && evCopyOpt && evCopyOpt.clipboardData && typeof evCopyOpt.clipboardData.getData === 'function') {
                    textoCtrlC = evCopyOpt.clipboardData.getData('text/plain') || '';
                    if (!htmlCtrlC) htmlCtrlC = evCopyOpt.clipboardData.getData('text/html') || '';
                }
                const textoLimpoCtrlC = this.#deps.higienizarTextoParaCopia(textoCtrlC);
                if (textoLimpoCtrlC && textoLimpoCtrlC.trim().length > 0) {
                    if (typeof this.#deps.atualizarEstado === 'function') {
                        this.#deps.atualizarEstado({ ultimoTextoSelecionadoLimpo: textoLimpoCtrlC });
                    }

                    const estado = (typeof this.#deps.obterEstado === 'function') ? this.#deps.obterEstado() : {};
                    const normFn = this.#deps.normalizarNivelFiltro;
                    const nivelCfg = (typeof normFn === 'function') ? normFn(estado.nivelFiltroFormatacao) : (estado.nivelFiltroFormatacao || 'basico');
                    const verifBlocoFn = this.#deps.verificarSeTextoEhBlocoOuPalavraUnica;
                    const ehBlocoPuro = (typeof verifBlocoFn === 'function') ? Boolean(verifBlocoFn(textoLimpoCtrlC)) : false;
                    const podeFormatar = Boolean(!veioDeInputPuro && estado.manterFormatacaoBasica !== false && nivelCfg !== 'texto_puro' && !ehBlocoPuro);

                    let htmlFinal = '';
                    let formatosExtras = null;
                    let nivelCopia = 'texto_puro';

                    if (podeFormatar && typeof this.#deps.gerarMapaFormatosClipboard === 'function') {
                        try {
                            const origemMapa = rangeCtrlC || htmlCtrlC;
                            if (origemMapa) {
                                const mapa = this.#deps.gerarMapaFormatosClipboard(origemMapa, nivelCfg, { textoFallback: textoLimpoCtrlC });
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

                    this.#deps.salvarClipboardInternoComBackup({
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

    Object.freeze(GerenciadorCopia.prototype);
    window.JusGovGerenciadorCopia = Object.freeze(GerenciadorCopia);
})();
