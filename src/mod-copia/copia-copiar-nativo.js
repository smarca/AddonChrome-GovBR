/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-copiar-nativo.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Interceptação de Botões Copiar Nativos e Apps Confiáveis
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-copiar-nativo.js
 * - Classe Exportada: CopiaCopiarNativo (self.JusGovCopiaCopiarNativo) extends BaseModulo
 * - Métodos Públicos: ehAppWebConfiavel, localizarBotaoCopiarNativo, extrairDadosAlvoDeBotaoCopiarNativo, processarTextoCopiaNativaInterceptada, interceptarCliqueBotaoCopiarNativo, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaCopiarNativo = fabrica(raiz);
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

    const SELETOR_BOTAO_COPIAR_NATIVO = [
        '.icone-copy', '.label-copy', '[class*="icone-copy"]', '[class*="label-copy"]',
        '[class*="copy-to-clipboard"]', '[class*="btn-copy"]', '[class*="copy-btn"]',
        '[data-clipboard-text]', '[data-clipboard-target]', '[cdkcopytoclipboard]',
        'button[title*="Copiar" i]', 'a[title*="Copiar" i]', 'span[title*="Copiar" i]',
        'i[title*="Copiar" i]', 'mat-icon[title*="Copiar" i]', '[aria-label*="Copiar" i]',
        'button[title*="Copy" i]', 'a[title*="Copy" i]', '[aria-label*="Copy" i]'
    ].join(', ');

    const REGEX_DOMINIO_APP_CONFIÁVEL = /(?:^|\.)(?:gemini\.google\.com|bard\.google\.com|docs\.google\.com|chatgpt\.com|chat\.openai\.com|claude\.ai|copilot\.microsoft\.com|notion\.so|web\.whatsapp\.com|github\.com)$/i;

    class CopiaCopiarNativo extends Base {
        constructor() {
            super('CopiaCopiarNativo');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaCopiarNativo.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaCopiarNativo.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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

        async processarTextoCopiaNativaInterceptada(textoBruto, opcoes = {}) {
            if (typeof textoBruto !== 'string') return false;
            const estado = (typeof this._p_deps.obterEstado === 'function') ? this._p_deps.obterEstado() : {};
            const setEstado = (typeof this._p_deps.atualizarEstado === 'function') ? this._p_deps.atualizarEstado : (() => { });

            if (opcoes && opcoes.preservarBruto === true) {
                const bruto = textoBruto;
                if (!bruto.trim()) return false;
                setEstado({ ultimoTextoSelecionadoLimpo: bruto.trim() });
                const htmlBruto = typeof opcoes.html === 'string' ? opcoes.html : '';
                const normFn = this._p_deps.normalizarNivelFiltro;
                const nivelRaw = (typeof normFn === 'function') ? normFn(estado.nivelFiltroFormatacao) : (estado.nivelFiltroFormatacao || 'basico');
                const temHtml = Boolean(htmlBruto && nivelRaw !== 'texto_puro');
                this._p_deps.salvarClipboardInternoComBackup({
                    texto: bruto,
                    html: temHtml ? htmlBruto : '',
                    formatado: temHtml,
                    nivelCopia: temHtml ? nivelRaw : 'texto_puro'
                });
                return true;
            }

            let textoLimpo = this._p_deps.higienizarTextoParaCopia(textoBruto);
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
                    : this._p_deps.aplicarLimpezaNumericaComTravaAlfabetica(textoLimpo);
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
            if (textoLimpo === this._p_ultimoTextoBotaoCopiarNativo && (agora - this._p_ultimoTimestampBotaoCopiarNativo) < 350) {
                return true;
            }
            this._p_ultimoTextoBotaoCopiarNativo = textoLimpo;
            this._p_ultimoTimestampBotaoCopiarNativo = agora;

            const rangeAlvo = (opcoes && opcoes.range) ? opcoes.range : null;
            const modoAcum = Boolean(opcoes && opcoes.modoAcumulador);

            if (!modoAcum) {
                setEstado({ ultimoTextoSelecionadoLimpo: textoLimpo });
                this._p_deps.salvarClipboardInternoComBackup({ texto: textoLimpo, html: '', formatado: false, nivelCopia: 'texto_puro' });
            }
            if (opcoes && opcoes.apenasInterno === true) {
                return true;
            }

            if (rangeAlvo) {
                if ((estado.tempoFlashBorderMs || 0) !== 0) {
                    setEstado({ flashExclusivoSemSelecao: true });
                    this._p_deps.dispararFlashBorderVisual(rangeAlvo);
                }
                await this.executarCopiaDeSelecao(rangeAlvo, modoAcum, textoLimpo, { forcarUmaLinha: true });
            } else {
                setEstado({ ultimoTextoSelecionadoLimpo: textoLimpo });
                await this._p_deps.gravarNaAreaDeTransferencia(textoLimpo, null);
                const validador = (typeof this._p_deps.obterValidador === 'function') ? this._p_deps.obterValidador() : this._p_deps.validador;
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
                if (this._p_ultimoTextoBotaoCopiarNativo === textoLimpo) {
                    this._p_deps.gravarNaAreaDeTransferencia(textoLimpo, null, { preservarHistorico: true }).catch(() => { });
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
    }

    Object.freeze(CopiaCopiarNativo.prototype);
    return Object.freeze(CopiaCopiarNativo);
}));