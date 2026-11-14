/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/mod-copia.js
 * CLASSE: ModuloCopia
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/mod-copia.js
 * - Classe Exportada: ModuloCopia (window.JusGovModuloCopia)
 * - Métodos Públicos: simularCliqueEmTexto(texto, idxZeroBased, numCliques, ehAlt), getters das 11 instâncias POO + static get NULL_OBJECTS
 * - Dependências Injetadas: GeometriaDOM, FiltrosHtml, FeedbackVisual, ValidadoresForenses, PlaceholdersMinutas, EstagioUnidadeAtomica..EstagioTabelas, AcumuladorCopia, AvisoFlutuante
 * - Regras / Seções: Diretrizes 11/16, ADR-004/006 (Null Objects c/ setters no-op), Seção 6.47, Seção 6.64 (blindagem POO)
 * 
 * FINALIDADE:
 * Main / Fachada Orquestradora do Módulo de Seleção e Cópia Inteligente:
 * - Instanciação e injeção de dependências das 11 classes especializadas POO em diretório plano:
 *   1. GeometriaDOM (`copia-geometria.js`)
 *   2. FiltrosHtml (`copia-filtros.js`)
 *   3. FeedbackVisual (`copia-visual.js`)
 *   4. ValidadoresForenses (`copia-validadores.js`)
 *   5. PlaceholdersMinutas (`copia-minutas.js`)
 *   6. EstagioUnidadeAtomica (`copia-estagio1.js`)
 *   7. EstagioExpressoes (`copia-estagio2.js`)
 *   8. EstagioSentencas (`copia-estagio3.js`)
 *   9. EstagioDelimitadores (`copia-estagio4.js`)
 *   10. EstagioParagrafos (`copia-estagio5.js`)
 *   11. EstagioTabelas (`copia-estagio6.js`)
 * - Resiliência e Tolerância a Falhas (Diretriz Root 16 / ADR-006):
 *   Uso combinado de Injeção de Dependência Opcional e o Padrão Null Object para garantir
 *   que caso qualquer arquivo/módulo seja excluído fisicamente ou desabilitado, o JavaScript
 *   não trave com "Cannot read properties of undefined" e execute com degradação graciosa.
 * 
 * - Isolamento de Fronteiras entre Módulos (Seção 6.47):
 *   Encapsula exclusivamente a inteligência léxica, geométrica, documental e visual de
 *   Seleção e Cópia (Grupo 2), sem acoplar ouvintes de periféricos de navegação (delegados
 *   ao Grupo 3 `mod-input`) nem APIs privilegiadas de abas/janelas (isoladas no Grupo 4
 *   `mod-navegador` / `background.js`).
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Diretrizes 11, 13, 14, 15 e 16)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 2: Arquitetura Global e Seção 3: 6 Estágios)
 * - docs/03_BACKLOG_TAREFAS_E_FEATURES.md (Seções 6.47 e 6.49: Separação de Módulos e POO)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004 e ADR-006: Null Object Pattern)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovModuloCopia) {
        return;
    }

    /* ==========================================================================
     * PADRÃO NULL OBJECT (RESILIÊNCIA E TOLERÂNCIA A FALHAS - DIRETRIZ ROOT 16)
     * Objetos neutros seguros que evitam 'Cannot read properties of undefined'
     * caso qualquer classe filha ou arquivo seja excluído fisicamente ou desativado.
     * ========================================================================== */
    const NULL_GEOMETRIA = Object.freeze({
        obterBlocoAncestralContextual(no) {
            return (no && no.ownerDocument && no.ownerDocument.body) || (typeof document !== 'undefined' ? document.body : null);
        },
        obterPontoDoClique() { return null; },
        localizarPontoTextoDentroDeElemento() { return null; },
        construirMapaTextoBlocoComJanela() {
            return { bloco: null, texto: '', idxCursor: 0, deslocamentoJanela: 0, segmentos: [], tamanhoTotalBloco: 0 };
        },
        obterPontoDOMNoMapa() { return null; },
        criarRangeDOMAPartirDeIndices() { return null; }
    });

    const NULL_FILTROS = Object.freeze({
        get converterCabecalhoPjeAtivo() { return true; },
        set converterCabecalhoPjeAtivo(_) { },
        aplicarFiltro1DadosLixo(t) { return String(t || ''); },
        unificarLinhasComEspacamentoAntiTruncamento(t) { return String(t || '').trim(); },
        aplicarFiltro3InformacoesELinhas(t) { return String(t || '').trim(); },
        higienizarTextoParaCopia(t) { return String(t || '').trim(); },
        escaparTextoHtmlBasico(s) { return String(s || ''); },
        obterAncestralBlocoLinhaFormatacao(el) { return el; },
        extrairFormatosBasicosDoElementoVivo() { return { b: false, i: false, u: false, s: false, sup: false, sub: false }; },
        construirHtmlFormatacaoBasica() { return ''; },
        extrairTextoPuroSanitizado(origem) { return typeof origem === 'string' ? origem : (origem && origem.toString ? origem.toString() : ''); },
        limparPropriedadesWordEMso(h) { return String(h || ''); },
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
        envolverHtmlComResetDeCursorParaWord(c) { return String(c || ''); }
    });

    const NULL_VISUAL = Object.freeze({
        converterHexParaRgbaFlash() { return { hex: '#0d9488', rgba: 'rgba(13, 148, 136, 0.28)' }; },
        limparFlashBorderImediatamente() { },
        limparAvisosAuditoriaEWikiImediatamente() { },
        agendarRetiradaFlashAposDesselecao() { },
        calcularLinhasDoRange() { return []; },
        agruparLinhasEmBlocos() { return []; },
        dispararFlashBorderVisual() { },
        projetarMiniTipGlobal() { }
    });

    const NULL_VALIDADORES = Object.freeze({
        get validadorFlutuante() { return null; },
        set validadorFlutuante(_) { },
        isTextoCampoEstruturadoForense() { return false; },
        verificarProtecaoTamanhoMinimoInterface() { return true; },
        localizarBlocoForenseAutoSelecionavelEmInterface() { return null; }
    });

    const NULL_PLACEHOLDERS = Object.freeze({
        get modo() { return 'desabilitado'; },
        set modo(_) { },
        get ativo() { return false; },
        set ativo(_) { },
        definirModo() { },
        localizarCampoSimbolosSobCursor() { return null; },
        tratarCliqueEmEditorMultilinhaSemCopia() { return false; }
    });

    const NULL_ESTAGIO1 = Object.freeze({
        expandirUnidadeAtomicaEstagio1() { return null; },
        eAlfanumericoUnicode() { return false; },
        eSimboloRepetivel() { return false; }
    });

    const NULL_ESTAGIO2 = Object.freeze({
        tentarExpandirPadraoComposto() { return null; },
        extrairPalavraSobCursor() { return ''; },
        tentarExpandirBlocoMaiusculasComQuebraSuave() { return null; },
        tentarExpandirBlocoFormatadoDestaque() { return null; },
        linhaEhTodaMaiuscula() { return false; }
    });

    const NULL_ESTAGIO3 = Object.freeze({
        expandirFraseAtePontuacaoEstagio3() { return null; },
        expandirSentencaCompletaAtePonto() { return null; },
        tentarExpandirSentencaPorDoisPontos() { return null; }
    });

    const NULL_ESTAGIO4 = Object.freeze({
        tentarExpandirDelimitadoresSimetricos() { return null; }
    });

    const NULL_ESTAGIO5 = Object.freeze({
        delimitarParagrafoLocalizado() { return null; },
        resolverSelecaoTriploClique() { return null; }
    });

    const NULL_ESTAGIO6 = Object.freeze({
        get acumulador() { return null; },
        set acumulador(_) { },
        isCelulaTabelaDadosLeitura() { return false; },
        obterLinhaTabelaAncestral() { return null; },
        obterCelulaTabelaAncestral() { return null; },
        acumularSelecaoTabela() { return false; }
    });

    class ModuloCopia {
        #geometria;
        #filtros;
        #visual;
        #validadores;
        #placeholders;
        #estagio1;
        #estagio2;
        #estagio3;
        #estagio4;
        #estagio5;
        #estagio6;
        #acumulador;
        #validadorFlutuante;

        constructor(opcoes = {}) {
            const C_EXT = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};

            this.#geometria = opcoes.geometria || (typeof window !== 'undefined' && window.JusGovGeometriaDOM ? new window.JusGovGeometriaDOM() : NULL_GEOMETRIA);
            this.#filtros = opcoes.filtros || (typeof window !== 'undefined' && window.JusGovFiltrosHtml ? new window.JusGovFiltrosHtml() : NULL_FILTROS);
            this.#visual = opcoes.visual || (typeof window !== 'undefined' && window.JusGovFeedbackVisual ? new window.JusGovFeedbackVisual() : NULL_VISUAL);
            this.#validadorFlutuante = opcoes.validadorFlutuante || opcoes.avisoFlutuante ||
                (typeof window !== 'undefined' && window.JusGovValidadorAtivo) ||
                (typeof window !== 'undefined' && window.JusGovAvisoFlutuante ? new window.JusGovAvisoFlutuante() : null);
            this.#acumulador = opcoes.acumulador || (typeof window !== 'undefined' && window.JusGovAcumulador ? new window.JusGovAcumulador() : null);

            this.#validadores = opcoes.validadores || (typeof window !== 'undefined' && window.JusGovValidadoresForenses ? new window.JusGovValidadoresForenses(this.#validadorFlutuante) : NULL_VALIDADORES);
            this.#placeholders = opcoes.placeholders || (typeof window !== 'undefined' && window.JusGovPlaceholdersMinutas ? new window.JusGovPlaceholdersMinutas('placeholders') : NULL_PLACEHOLDERS);

            this.#estagio1 = opcoes.estagio1 || (typeof window !== 'undefined' && window.JusGovEstagioUnidadeAtomica ? new window.JusGovEstagioUnidadeAtomica(C_EXT) : NULL_ESTAGIO1);
            this.#estagio2 = opcoes.estagio2 || (typeof window !== 'undefined' && window.JusGovEstagioExpressoes ? new window.JusGovEstagioExpressoes(C_EXT) : NULL_ESTAGIO2);
            this.#estagio3 = opcoes.estagio3 || (typeof window !== 'undefined' && window.JusGovEstagioSentencas ? new window.JusGovEstagioSentencas(C_EXT) : NULL_ESTAGIO3);
            this.#estagio4 = opcoes.estagio4 || (typeof window !== 'undefined' && window.JusGovEstagioDelimitadores ? new window.JusGovEstagioDelimitadores(C_EXT) : NULL_ESTAGIO4);
            this.#estagio5 = opcoes.estagio5 || (typeof window !== 'undefined' && window.JusGovEstagioParagrafos ? new window.JusGovEstagioParagrafos(C_EXT) : NULL_ESTAGIO5);
            this.#estagio6 = opcoes.estagio6 || (typeof window !== 'undefined' && window.JusGovEstagioTabelas ? new window.JusGovEstagioTabelas(this.#acumulador) : NULL_ESTAGIO6);

            if (typeof window !== 'undefined') {
                window.JusGovEstagioUnidadeAtomicaInstancia = this.#estagio1;
                window.JusGovEstagioExpressoesInstancia = this.#estagio2;
                window.JusGovValidadorAtivo = this.#validadorFlutuante;
            }
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                geometria: NULL_GEOMETRIA,
                filtros: NULL_FILTROS,
                visual: NULL_VISUAL,
                validadores: NULL_VALIDADORES,
                placeholders: NULL_PLACEHOLDERS,
                estagio1: NULL_ESTAGIO1,
                estagio2: NULL_ESTAGIO2,
                estagio3: NULL_ESTAGIO3,
                estagio4: NULL_ESTAGIO4,
                estagio5: NULL_ESTAGIO5,
                estagio6: NULL_ESTAGIO6
            });
        }

        get geometria() { return this.#geometria; }
        get filtros() { return this.#filtros; }
        get visual() { return this.#visual; }
        get validadores() { return this.#validadores; }
        get placeholders() { return this.#placeholders; }
        get estagio1() { return this.#estagio1; }
        get estagio2() { return this.#estagio2; }
        get estagio3() { return this.#estagio3; }
        get estagio4() { return this.#estagio4; }
        get estagio5() { return this.#estagio5; }
        get estagio6() { return this.#estagio6; }
        get acumulador() { return this.#acumulador; }
        get validadorFlutuante() { return this.#validadorFlutuante; }

        /**
         * Simula o clique em texto puro avaliando os estágios de expansão contextual.
         */
        simularCliqueEmTexto(texto, idxZeroBased, numCliques = 1, ehAlt = false) {
            if (typeof texto !== 'string' || texto.length === 0) return '';
            if (idxZeroBased < 0 || idxZeroBased >= texto.length) return '';

            const mapaSimulado = {
                bloco: null,
                texto,
                idxCursor: idxZeroBased,
                deslocamentoJanela: 0,
                segmentos: [],
                tamanhoTotalBloco: texto.length
            };

            if (numCliques >= 3) {
                const res3 = this.#estagio5.resolverSelecaoTriploClique(mapaSimulado, idxZeroBased, this.#estagio1);
                return res3 ? this.#filtros.higienizarTextoParaCopia(texto.substring(res3.inicio, res3.fim)) : '';
            }

            const charNoCursor = texto[idxZeroBased] || '';
            const charAnterior = idxZeroBased > 0 ? texto[idxZeroBased - 1] : '';

            const cExt = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : {};
            const tabAscii = cExt.TABELA_MASCARA_ASCII;
            const masc = cExt.MASCARA_CARACTERE || {};

            const ehEspaco = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (tabAscii && c < 128) return (tabAscii[c] & masc.ESPACO_BRANCO) !== 0;
                return c === 160 || /\s/.test(ch);
            };

            const ehAlfanum = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (tabAscii && c < 128) return (tabAscii[c] & (masc.DIGITO | masc.LETRA_ASCII)) !== 0;
                return /[\p{L}\p{N}]/u.test(ch);
            };

            const ehDelim = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                return tabAscii && c < 128 && (tabAscii[c] & masc.DELIMITADOR_PAR) !== 0;
            };

            const ehAspas = (ch) => {
                if (!ch) return false;
                const c = ch.charCodeAt(0);
                if (tabAscii && c < 128) return (tabAscii[c] & masc.DELIMITADOR_ASPAS) !== 0;
                const aspas = cExt.CARACTERES_ASPAS_TODOS || '';
                return aspas.indexOf(ch) !== -1;
            };

            const clicouEmEspaco = ehEspaco(charNoCursor) || (ehEspaco(charAnterior) && !ehAlfanum(charNoCursor));
            const clicouEmDelimitadorOuAspas = ehDelim(charNoCursor) || ehDelim(charAnterior) || ehAspas(charNoCursor) || ehAspas(charAnterior);

            let res = null;
            if (numCliques === 2 || (ehAlt && numCliques === 1 && (clicouEmEspaco || clicouEmDelimitadorOuAspas))) {
                if (clicouEmDelimitadorOuAspas || clicouEmEspaco) {
                    res = this.#estagio4.tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, true);
                }
                if (!res) res = this.#estagio2.tentarExpandirPadraoComposto(texto, idxZeroBased, true, true);
                if (!res) res = this.#estagio2.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxZeroBased);
                if (!res) res = this.#estagio2.tentarExpandirBlocoFormatadoDestaque(mapaSimulado, idxZeroBased);
                if (!res) res = this.#estagio4.tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, true);
                if (!res) res = this.#estagio3.expandirSentencaCompletaAtePonto(texto, idxZeroBased) || this.#estagio3.expandirFraseAtePontuacaoEstagio3(texto, idxZeroBased);
            } else if (clicouEmDelimitadorOuAspas) {
                res = this.#estagio4.tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, false);
            } else if (clicouEmEspaco) {
                res = this.#estagio3.tentarExpandirSentencaPorDoisPontos(texto, idxZeroBased);
                if (!res) res = this.#estagio2.tentarExpandirPadraoComposto(texto, idxZeroBased, true, false);
                if (!res) res = this.#estagio2.tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idxZeroBased);
                if (!res) res = this.#estagio2.tentarExpandirBlocoFormatadoDestaque(mapaSimulado, idxZeroBased);
                if (!res) res = this.#estagio4.tentarExpandirDelimitadoresSimetricos(texto, idxZeroBased, false);
                if (!res) res = this.#estagio3.expandirFraseAtePontuacaoEstagio3(texto, idxZeroBased);
            } else {
                res = this.#estagio2.tentarExpandirPadraoComposto(texto, idxZeroBased, false, false);
                if (!res) res = this.#estagio1.expandirUnidadeAtomicaEstagio1(texto, idxZeroBased);
            }

            return res ? this.#filtros.higienizarTextoParaCopia(texto.substring(res.inicio, res.fim)) : '';
        }
    }

    Object.freeze(ModuloCopia.prototype);
    window.JusGovModuloCopia = Object.freeze(ModuloCopia);
})();
