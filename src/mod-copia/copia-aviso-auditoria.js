/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-aviso-auditoria.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Cópia — Auditoria Forense de Trechos e Rolagem de Alertas
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-aviso-auditoria.js
 * - Classe Exportada: CopiaAvisoAuditoria (self.JusGovCopiaAvisoAuditoria) extends BaseModulo
 * - Métodos Públicos: auditarEAlerta, auditarTrechoSelecionado, atualizarPosicaoAlertaSobRolagem, registrarOuvinteScrollAlerta, removerOuvinteScrollAlerta, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovCopiaAvisoAuditoria = fabrica(raiz);
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

    class CopiaAvisoAuditoria extends Base {
        constructor() {
            super('CopiaAvisoAuditoria');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(CopiaAvisoAuditoria.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(CopiaAvisoAuditoria.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /*
         * METODO: auditarEAlerta
         */
        auditarEAlerta(texto, rangeDOM, opcoesExtras = {}) {
            /* Passo 7.1: Validar entrada */
            if (!texto || typeof texto !== 'string') {
                return { valido: true, msg: '' };
            }
            let t = texto.trim();
            const textoRangeDOM = (rangeDOM && typeof rangeDOM.toString === 'function') ? rangeDOM.toString().trim() : '';
            let textoSobrescritoEfetivo = (opcoesExtras && (opcoesExtras.textoSobrescrito || opcoesExtras.textoExibicao))
                ? String(opcoesExtras.textoSobrescrito || opcoesExtras.textoExibicao).trim()
                : null;

            /* Se o texto passado estiver sem pontuação (ex: dígitos puros), mas o Range no DOM contiver o dado pontuado original */
            if (!textoSobrescritoEfetivo && textoRangeDOM && textoRangeDOM !== t) {
                const digitosT = t.replace(/\D/g, '');
                const digitosRange = textoRangeDOM.replace(/\D/g, '');
                if (digitosT.length > 0 && digitosT === digitosRange) {
                    textoSobrescritoEfetivo = t;
                    t = textoRangeDOM;
                }
            }

            let resultado = { valido: true, msg: '' };

            /* Passo 7.2: Testar correspondencia usando Constantes GLOBAIS */
            const matchDataHora = t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_NUMERICA_COM_HORARIO_AUDITORIA);
            const matchDataIso = !matchDataHora ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_ISOLADA) : null;
            const matchDataExt = (!matchDataHora && !matchDataIso) ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV) : null;
            const matchDataIsoAno = (!matchDataHora && !matchDataIso && !matchDataExt)
                ? t.match(/^(?:data\s*[:\-]?\s*)?(\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}(?:[\sT]\d{1,2}:\d{2}(?::\d{2})?)?)$/i)
                : null;
            const matchHorarioIso = (!matchDataHora && !matchDataIso && !matchDataExt && !matchDataIsoAno) ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.HORARIO_ISOLADO) : null;
            const matchInssEsp = t.match(window.JusGovConstantes.REGEX_AUDITORIA.BENEFICIO_INSS_COM_ESPECIE);
            const matchInssIso = !matchInssEsp ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.BENEFICIO_INSS_ISOLADO) : null;
            const matchCpfIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CPF_ISOLADO);
            const matchCnpjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNPJ_ISOLADO);
            const matchCnjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNJ_ISOLADO);
            const matchPisIso = (window.JusGovConstantes.REGEX_AUDITORIA.PIS_ISOLADO)
                ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.PIS_ISOLADO)
                : null;

            if (matchDataHora) {
                /* Valida tanto a Data quanto o Horario */
                const resData = this.validarData(matchDataHora[1]);
                if (!resData.valido) {
                    resultado = resData;
                } else {
                    const resHora = this.validarHorario(matchDataHora[2]);
                    if (!resHora.valido) {
                        resultado = resHora;
                    } else {
                        const ehFimDeSemana = Boolean(resData.ehFimDeSemana);
                        const diaSemana = resData.diaSemana || '';
                        const sufixoFuturo = (resData && resData.ehDataFutura) ? ' - Data Futura' : '';
                        const subDataHora = `${resData.subtitulo || (diaSemana + (ehFimDeSemana ? ` (Final de Semana${sufixoFuturo})` : ` (Dia Útil${sufixoFuturo})`))} • Horário: ${matchDataHora[2]}h`;
                        resultado = this.verificadores && typeof this.verificadores.formatarRespostaWiki === 'function'
                            ? this.verificadores.formatarRespostaWiki(
                                'Data e Horário',
                                diaSemana,
                                `${(resData && resData.valor) ? resData.valor : matchDataHora[1]} ${matchDataHora[2]}`,
                                subDataHora,
                                {
                                    ...((resData && resData.detalhes) || {}),
                                    horario: matchDataHora[2],
                                    ehFimDeSemana: ehFimDeSemana,
                                    diaSemana: diaSemana,
                                    ehDataFutura: Boolean(resData && resData.ehDataFutura)
                                }
                            )
                            : { valido: true, categoria: 'Data e Horário', msg: subDataHora };
                    }
                }
            } else if (matchDataIso) {
                resultado = this.validarData(matchDataIso[1]);
            } else if (matchDataExt) {
                resultado = this.validarData(t);
            } else if (matchDataIsoAno) {
                resultado = this.validarData(matchDataIsoAno[1]);
            } else if (matchHorarioIso) {
                resultado = this.validarHorario(matchHorarioIso[1]);
            } else if (matchInssEsp) {
                resultado = this.validarNumeroBeneficioINSS(matchInssEsp[2], matchInssEsp[1]);
            } else if (matchInssIso) {
                resultado = this.validarNumeroBeneficioINSS(matchInssIso[1] || matchInssIso[2], null);
            } else if (matchCpfIso) {
                resultado = this.validarCPF(matchCpfIso[1]);
            } else if (matchCnpjIso) {
                resultado = this.validarCNPJ(matchCnpjIso[1]);
            } else if (matchCnjIso) {
                resultado = this.validarCNJ(matchCnjIso[1]);
            } else if (matchPisIso) {
                resultado = this.validarPIS(matchPisIso[1] || matchPisIso[2]);
            } else if (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_ARRECADACAO_ISOLADO && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_ARRECADACAO_ISOLADO.test(t)) {
                resultado = this.validarLinhaArrecadacaoTributos(t);
            } else if (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_BANCARIO_ISOLADO && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_BANCARIO_ISOLADO.test(t)) {
                resultado = this.validarBoletoBancario(t);
            } else {
                /* Verificar se eh linha digitavel de 48 ou 47 digitos sem pontuacao estrita */
                const digitosPuros = t.replace(/\D/g, '');
                if (digitosPuros.length === 48 && digitosPuros[0] === '8') {
                    resultado = this.validarLinhaArrecadacaoTributos(t);
                } else if (digitosPuros.length === 47 && (digitosPuros.startsWith('0019') || t.includes('.'))) {
                    resultado = this.validarBoletoBancario(t);
                }

                /* Verificar se eh NB de 10 digitos precedido por especie no DOM ou pontuado (ex: 31/6506589241) */
                if (resultado.valido && !resultado.ehWiki) {
                    let especiePrefixo = null;
                    if (rangeDOM && rangeDOM.startContainer && rangeDOM.startContainer.nodeType === 3) {
                        const textoNo = rangeDOM.startContainer.textContent || '';
                        const offset = rangeDOM.startOffset;
                        const trechoAntes = textoNo.substring(Math.max(0, offset - 5), offset);
                        const mEsp = trechoAntes.match(/(\d{2})\/$/);
                        if (mEsp) {
                            especiePrefixo = mEsp[1];
                        }
                    }
                    if ((especiePrefixo && digitosPuros.length === 10) || (/^\d{3}\.\d{3}\.\d{3}-\d$/.test(t))) {
                        resultado = this.validarNumeroBeneficioINSS(t, especiePrefixo);
                    }
                }

                /* ULTIMA BARREIRA: Se nao foi identificado por nenhuma mascara especifica com contexto,
                 * executa a validacao matematica generica fallback (FEAT-03 / Diretriz 6.42).
                 * Se validado, exibe cartao cinza neutro; se nao validado, silêncio absoluto. */
                if (resultado.valido && !resultado.ehWiki) {
                    const resGenerico = this.validarNumeroGenericoFallback(t);
                    if (resGenerico && resGenerico.ehGenericoCinza) {
                        resultado = resGenerico;
                    }
                }
            }

            /* Passo 7.2.9: Ajuste de exibição sem pontuação (Shift + Clique em bloco / cópia desformatada)
             * O número exibido no cabeçalho do cartão deve refletir o formato sem pontuação copiado,
             * mantendo estritamente todo o restante: tipo de documento, ícone (✓/✗), wiki, espécie e motivos de erro. */
            if (textoSobrescritoEfetivo && textoSobrescritoEfetivo.length > 0 && (resultado.ehWiki || !resultado.valido)) {
                const dadoOriginal = resultado.dado || t;
                resultado.dado = textoSobrescritoEfetivo;
                if (typeof resultado.html === 'string') {
                    resultado.html = resultado.html.replace(
                        /<u style="text-decoration:underline;font-weight:700;">[^<]*<\/u>/i,
                        `<u style="text-decoration:underline;font-weight:700;">${escaparTextoHtml(textoSobrescritoEfetivo)}</u>`
                    );
                }
                if (typeof resultado.msg === 'string' && dadoOriginal) {
                    resultado.msg = resultado.msg.replace(dadoOriginal, textoSobrescritoEfetivo);
                }
                if (resultado.detalhes && typeof resultado.detalhes === 'object') {
                    resultado.detalhes.digitos = textoSobrescritoEfetivo;
                }
            }

            /* Passo 7.3: Projetar alerta se invalido ou cartao informativo se Wiki Forense (respeitando tempoConferenciaDocumentosMs - Seção 6.112) */
            if (this.tempoConferenciaDocumentosMs !== 0) {
                if (!resultado.valido && rangeDOM) {
                    this.projetarAlertaVisual(rangeDOM, resultado, true);
                } else if (resultado.ehWiki && rangeDOM && this.modoExibicaoValidacao !== 'apenas_erros') {
                    this.projetarAlertaVisual(rangeDOM, resultado, false);
                }
            }

            return resultado;
        }

        /*
         * METODO: auditarTrechoSelecionado
         * OBJETIVO DE RECONSTRUCAO: Auditar trecho textual sem projetar alerta visual
         * na tela, retornando o objeto de erro caso invalido ou null se valido/neutro.
         */
        auditarTrechoSelecionado(texto) {
            const res = this.auditarEAlerta(texto, null);
            return (res && !res.valido) ? res : null;
        }

        /*
         * METODO: atualizarPosicaoAlertaSobRolagem (USAB-14 / POS-01 - Seção 6.115)
         * OBJETIVO: Recalcular em tempo real as coordenadas do balão de verificação (.cartao-aviso)
         * e do destaque amarelo para que permaneçam ancorados ao início do texto selecionado
         * e rolem solidariamente junto com a página ou contêiner.
         */
        atualizarPosicaoAlertaSobRolagem() {
            if (!this.avisoVisivel || !this.rangeAtivoAlerta || !this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') {
                return;
            }
            const range = this.rangeAtivoAlerta;
            let rect = null;
            try {
                rect = range.getBoundingClientRect();
                if (!rect || (rect.width === 0 && rect.height === 0)) {
                    const rectsLista = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                    if (rectsLista && rectsLista.length > 0) rect = rectsLista[0];
                }
            } catch (_) {}
            if (!rect || (rect.width === 0 && rect.height === 0)) return;

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
                        if (r.bottom > maxB) maxB = r.bottom;
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

            if (this.destacarSelecaoAmarelaAtiva && this.elementoDestaqueAmarelo) {
                this.elementoDestaqueAmarelo.style.top = `${rect.top + oy - 1}px`;
                this.elementoDestaqueAmarelo.style.left = `${rect.left + ox - 1}px`;
                this.elementoDestaqueAmarelo.style.width = `${rect.width + 2}px`;
                this.elementoDestaqueAmarelo.style.height = `${rect.height + 2}px`;
            }

            const rectCartaoMedido = this.elementoCartaoAviso.getBoundingClientRect();
            const larguraCartao = (rectCartaoMedido && rectCartaoMedido.width > 0) ? Math.ceil(rectCartaoMedido.width) : 230;
            const alturaFinalCartao = (rectCartaoMedido && rectCartaoMedido.height > 0) ? Math.ceil(rectCartaoMedido.height) : 46;

            const vw = Math.max(winUi.innerWidth || 0, docUi.documentElement ? docUi.documentElement.clientWidth : 0, 320);
            const vh = Math.max(winUi.innerHeight || 0, docUi.documentElement ? docUi.documentElement.clientHeight : 0, 240);
            const MARGEM_JANELA = 8;
            const DISTANCIA_SEGURANCA_ABAIXO = 4;
            const DISTANCIA_SEGURANCA_SUPERIOR = 2;

            const refLeft = Number.isFinite(refLeftFirst)
                ? refLeftFirst
                : (Number.isFinite(boxLeft) ? boxLeft : MARGEM_JANELA);
            const leftPos = Math.max(MARGEM_JANELA, Math.min(refLeft, vw - larguraCartao - MARGEM_JANELA));

            const limiteSuperiorProibido = boxTop - FOLGA_CONTORNO_FLASH;
            const limiteInferiorProibido = boxBottom + FOLGA_CONTORNO_FLASH;
            const candidatoAbaixo = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
            const candidatoAcima = limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR;

            const preferenciaPosicao = this.posicaoAvisosValidacao || 'abaixo';
            let topPos = (preferenciaPosicao === 'acima') ? candidatoAcima : candidatoAbaixo;
            if (preferenciaPosicao === 'abaixo' && (candidatoAbaixo + alturaFinalCartao > vh - MARGEM_JANELA) && (candidatoAcima >= MARGEM_JANELA)) {
                topPos = candidatoAcima;
            } else if (preferenciaPosicao === 'acima' && (candidatoAcima < MARGEM_JANELA) && (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA)) {
                topPos = candidatoAbaixo;
            }

            this.elementoCartaoAviso.style.left = `${Math.round(leftPos)}px`;
            this.elementoCartaoAviso.style.top = `${Math.round(topPos)}px`;
        }

        registrarOuvinteScrollAlerta() {
            this.removerOuvinteScrollAlerta();
            const ctxUi = this._p_obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const aoRolarOuRedimensionar = () => {
                this.atualizarPosicaoAlertaSobRolagem();
            };
            const opts = { capture: true, passive: true };
            window.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            document.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            window.addEventListener('resize', aoRolarOuRedimensionar, opts);
            if (winUi !== window) winUi.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            if (docUi !== document) docUi.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            if (winUi !== window) winUi.addEventListener('resize', aoRolarOuRedimensionar, opts);
            this.limparOuvinteScrollAlerta = () => {
                window.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                document.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                window.removeEventListener('resize', aoRolarOuRedimensionar, opts);
                if (winUi !== window) winUi.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                if (docUi !== document) docUi.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                if (winUi !== window) winUi.removeEventListener('resize', aoRolarOuRedimensionar, opts);
                this.limparOuvinteScrollAlerta = null;
            };
        }

        removerOuvinteScrollAlerta() {
            if (typeof this.limparOuvinteScrollAlerta === 'function') {
                this.limparOuvinteScrollAlerta();
            }
        }
    }

    Object.freeze(CopiaAvisoAuditoria.prototype);
    return Object.freeze(CopiaAvisoAuditoria);
}));