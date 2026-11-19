/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-filtros.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: FiltrosHtml
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-filtros.js
 * - Classe Exportada: FiltrosHtml (window.JusGovFiltrosHtml)
 * - Métodos Públicos: aplicarFiltro1DadosLixo(t), unificarLinhasComEspacamentoAntiTruncamento(t), aplicarFiltro3InformacoesELinhas(t), higienizarTextoParaCopia(t), extrairTextoPuroSanitizado(origem), aplicarFiltroHtmlPorNivel(origem, nivel), envolverHtmlComResetDeCursorParaWord(html), gerarMapaFormatosClipboard(...)
 * - Dependências Injetadas: FiltrosTextoCopia (src/mod-copia/lib-copia-filtros-texto.js), FiltrosHtmlProgressivos (src/mod-copia/copia-filtros-html.js)
 * - Regras / Seções: Regra 2.13 (Filtros HTML 5 Níveis), ARQ-09 / FEAT-73, ENG-01 (Composição + Null Object)
 *
 * FINALIDADE:
 * Fachada orquestradora unificada de filtros que compõe:
 * 1. FiltrosTextoCopia (`lib-copia-filtros-texto.js`): Pré-higienização Nível -1,
 *    remoção de linhas duplas/lixo/zero-width e pós-checagem defensiva (+99).
 * 2. FiltrosHtmlProgressivos (`copia-filtros-html.js`): Arquitetura Progressiva
 *    em 5 Níveis Estritos + sanitização DOMParser + Multi-MIME.
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFiltrosHtml) {
        return;
    }

    const NULL_TEXTO = Object.freeze({
        converterCabecalhoPjeAtivo: true,
        aplicarPreHigienizacaoTexto(t) { return String(t || ''); },
        aplicarFiltro1DadosLixo(t) { return String(t || ''); },
        unificarLinhasComEspacamentoAntiTruncamento(t) { return String(t || '').trim(); },
        aplicarFiltro3InformacoesELinhas(t) { return String(t || '').trim(); },
        aplicarPosLimpezaDefensiva(t) { return String(t || '').trim(); },
        higienizarTextoParaCopia(t) { return String(t || '').trim(); }
    });

    const NULL_HTML = Object.freeze({
        separadorTabela: ';',
        definirSeparadorTabela() { },
        obterSeparadorTabela() { return ';'; },
        escaparTextoHtmlBasico(s) { return String(s || ''); },
        obterAncestralBlocoLinhaFormatacao(el) { return el; },
        extrairFormatosBasicosDoElementoVivo() { return { b: false, i: false, u: false, s: false, sup: false, sub: false }; },
        construirHtmlFormatacaoBasica() { return ''; },
        extrairTextoPuroSanitizado(origem) { return typeof origem === 'string' ? origem : ''; },
        limparPropriedadesWordEMso(h) { return String(h || ''); },
        podarTagsVaziasRecursivo() { },
        sanitizarEstilosCssSempreSemFonte(s) { return String(s || ''); },
        preSanitizarDomBase() { return typeof document !== 'undefined' ? document.createElement('div') : null; },
        construirHtmlNivel1Basico() { return ''; },
        construirHtmlNivel2Intermediario() { return ''; },
        construirHtmlNivel3Avancado() { return ''; },
        construirHtmlNivel4Estendido() { return ''; },
        normalizarNivelFiltro() { return 'basico'; },
        converterNivelFiltroParaIndice() { return 1; },
        converterIndiceParaNivelFiltro() { return 'basico'; },
        aplicarFiltroHtmlPorNivel() { return ''; },
        envolverHtmlComResetDeCursorParaWord(c) { return String(c || ''); },
        _parsearHtmlSeguro() { return null; },
        extrairListaUrlsDeOrigem() { return ''; },
        detectarFormatoEstruturado() { return null; },
        converterHtmlParaMarkdown(h, f) { return String(f || '').trim(); },
        converterHtmlParaRtf(h, f) { return String(f || ''); },
        extrairImagensDeRangeParaClipboard() { return { svgMarkup: '', dataUrlPng: '', dataUrlJpeg: '' }; },
        gerarMapaFormatosClipboard(o, n, opts) {
            const fb = (opts && opts.textoFallback) ? opts.textoFallback : '';
            return { nivelNorm: 'basico', nivelIdx: 1, textoPlano: fb, htmlClipboard: '', uriList: '', estruturado: null, markdown: '', rtf: '', imagens: { svgMarkup: '', dataUrlPng: '', dataUrlJpeg: '' } };
        }
    });

    class FiltrosHtml {
        #texto;
        #html;

        constructor(opcoes = {}) {
            this.#texto = opcoes.filtrosTexto ||
                (typeof window !== 'undefined' && window.JusGovFiltrosTextoCopia ? new window.JusGovFiltrosTextoCopia() : NULL_TEXTO);
            this.#html = opcoes.filtrosHtml ||
                (typeof window !== 'undefined' && window.JusGovFiltrosHtmlProgressivos
                    ? new window.JusGovFiltrosHtmlProgressivos({ filtrosTexto: this.#texto })
                    : NULL_HTML);
        }

        get filtrosTexto() { return this.#texto; }
        get filtrosHtml() { return this.#html; }
        get converterCabecalhoPjeAtivo() { return Boolean(this.#texto.converterCabecalhoPjeAtivo); }
        set converterCabecalhoPjeAtivo(valor) {
            if (this.#texto !== NULL_TEXTO) this.#texto.converterCabecalhoPjeAtivo = Boolean(valor);
        }
        get separadorTabela() { return this.#html.separadorTabela; }
        set separadorTabela(valor) {
            if (this.#html !== NULL_HTML) this.#html.separadorTabela = valor;
        }

        definirSeparadorTabela(sep) { return this.#html.definirSeparadorTabela(sep); }
        obterSeparadorTabela() { return this.#html.obterSeparadorTabela(); }

        aplicarPreHigienizacaoTexto(t) { return this.#texto.aplicarPreHigienizacaoTexto(t); }
        aplicarFiltro1DadosLixo(t) { return this.#texto.aplicarFiltro1DadosLixo(t); }
        unificarLinhasComEspacamentoAntiTruncamento(t) { return this.#texto.unificarLinhasComEspacamentoAntiTruncamento(t); }
        aplicarFiltro3InformacoesELinhas(t) { return this.#texto.aplicarFiltro3InformacoesELinhas(t); }
        aplicarPosLimpezaDefensiva(t) { return this.#texto.aplicarPosLimpezaDefensiva(t); }
        higienizarTextoParaCopia(t) { return this.#texto.higienizarTextoParaCopia(t); }

        escaparTextoHtmlBasico(s) { return this.#html.escaparTextoHtmlBasico(s); }
        obterAncestralBlocoLinhaFormatacao(el) { return this.#html.obterAncestralBlocoLinhaFormatacao(el); }
        extrairFormatosBasicosDoElementoVivo(el) { return this.#html.extrairFormatosBasicosDoElementoVivo(el); }
        construirHtmlFormatacaoBasica(r) { return this.#html.construirHtmlFormatacaoBasica(r); }
        extrairTextoPuroSanitizado(o) { return this.#html.extrairTextoPuroSanitizado(o); }
        limparPropriedadesWordEMso(h) { return this.#html.limparPropriedadesWordEMso(h); }
        podarTagsVaziasRecursivo(c) { return this.#html.podarTagsVaziasRecursivo(c); }
        sanitizarEstilosCssSempreSemFonte(s, n, t) { return this.#html.sanitizarEstilosCssSempreSemFonte(s, n, t); }
        preSanitizarDomBase(o) { return this.#html.preSanitizarDomBase(o); }
        construirHtmlNivel1Basico(o) { return this.#html.construirHtmlNivel1Basico(o); }
        construirHtmlNivel2Intermediario(o) { return this.#html.construirHtmlNivel2Intermediario(o); }
        construirHtmlNivel3Avancado(o) { return this.#html.construirHtmlNivel3Avancado(o); }
        construirHtmlNivel4Estendido(o) { return this.#html.construirHtmlNivel4Estendido(o); }
        normalizarNivelFiltro(n) { return this.#html.normalizarNivelFiltro(n); }
        converterNivelFiltroParaIndice(n) { return this.#html.converterNivelFiltroParaIndice(n); }
        converterIndiceParaNivelFiltro(i) { return this.#html.converterIndiceParaNivelFiltro(i); }
        aplicarFiltroHtmlPorNivel(o, n) { return this.#html.aplicarFiltroHtmlPorNivel(o, n); }
        envolverHtmlComResetDeCursorParaWord(c) { return this.#html.envolverHtmlComResetDeCursorParaWord(c); }
        _parsearHtmlSeguro(h) { return this.#html._parsearHtmlSeguro(h); }
        extrairListaUrlsDeOrigem(o, f) { return this.#html.extrairListaUrlsDeOrigem(o, f); }
        detectarFormatoEstruturado(t) { return this.#html.detectarFormatoEstruturado(t); }
        converterHtmlParaMarkdown(h, f) { return this.#html.converterHtmlParaMarkdown(h, f); }
        converterHtmlParaRtf(h, f) { return this.#html.converterHtmlParaRtf(h, f); }
        extrairImagensDeRangeParaClipboard(o) { return this.#html.extrairImagensDeRangeParaClipboard(o); }
        gerarMapaFormatosClipboard(o, n, opts) { return this.#html.gerarMapaFormatosClipboard(o, n, opts); }
    }

    Object.freeze(FiltrosHtml.prototype);
    window.JusGovFiltrosHtml = Object.freeze(FiltrosHtml);
})();
