/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-visual.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * CLASSE: FeedbackVisual
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-visual.js
 * - Classe Exportada: FeedbackVisual (window.JusGovFeedbackVisual)
 * - Métodos Públicos: converterHexParaRgbaFlash(hexBruto, alfa), limparFlashBorderImediatamente(), limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip, validador), agendarRetiradaFlashAposDesselecao(preservarMiniTip, validador), calcularLinhasDoRange(rangeAlvo), agruparLinhasEmBlocos(segmentos), dispararFlashBorderVisual(rangeAlvo, duracaoMs, corFlashBorder), projetarMiniTipGlobal(mensagem, corBorda, validador), configurarMarcadorColado(opcoes), registrarCopiaCandidataParaMarcador(rangeAlvo, textoCopiado), confirmarColagemEMarcarPermanente(textoColado, opcoesEstilo), limparMarcadoresPermanentes(), obterContagemMarcadoresPermanentes(), obterMarcadoresPermanentes()
 * - Dependências Injetadas: window.JusGovValidadorAtivo (AvisoFlutuante)
 * - Regras / Seções: Regra 2.7 (Feedback Visual), Seção 6.15 (SVG polígono contíguo), BUG-02, Seção 6.64 (blindagem POO), Seção 6.105 (FEAT-21 / VIS-01 Marcadores Permanentes de Conteúdo Colado), Seção 6.114 (BUG-45 / USAB-13 Ancoragem de Flash ao Texto sob Rolagem e Regra de Permanência em Até Interação), Seção 6.117 (BUG-47 / USAB-16 Ignorar Insert)
 * 
 * FINALIDADE:
 * Gerenciamento centralizado do feedback visual no DOM após seleção/cópia inteligente:
 * - Desenho de contorno dinâmico Flash Border (verde/customizado) com SVG polígono contíguo multilinhas ancorado fisicamente ao texto sob rolagem.
 * - Marcadores permanentes na página de conteúdo efetivamente colado com badge ordinal sobrescrito por guia (1, 2, 3...) e fusão/expansão inteligente de intervalos sobrepostos.
 * - Eliminação estrita de retângulos aninhados/sobrepostos retornados pelo getClientRects nativo.
 * - Desseleção universal imediata em interfaces não-editáveis com preservação ou remoção de destaque.
 * - Limpeza atômica multi-frame e integração com o aviso flutuante MiniTip na Top Layer.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. O Flash Border deve ter fundo 100% transparente para jamais obstruir o texto ou parecer
 *    uma seleção nativa falsa (azul/cinza).
 * 2. Em seleções de múltiplas linhas, calcula os nós de texto vivos, funde fragmentos contíguos
 *    por linha e gera um único <polygon> SVG fechado (d = M... L... Z) eliminando caixas empilhadas.
 * 3. Limpeza multi-frame: limpa contêineres tanto no frame local quanto em window.top.document
 *    para evitar caixas fantasmas deixadas por subframes destruídos.
 * 4. Respeita o timer configurável (0ms a 5000ms) ou -1 ("Até Interação": permanece até nova cópia
 *    bem-sucedida em qualquer guia, substituição por marcador de colagem ou tecla Escape).
 * 5. Ancoragem física sob rolagem (BUG-45): tanto o contorno Flash quanto os marcadores permanentes
 *    recalculam suas coordenadas a partir do Range DOM vivo durante eventos de scroll/resize.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.7: Feedback Visual Discreto)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 4.2: Polígonos SVG e Flash Multi-Linhas)
 * - docs/03_BACKLOG_TAREFAS_E_FEATURES.md (Seções 6.105, 6.114 e 6.117)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 * ========================================================================== */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovFeedbackVisual) {
        return;
    }

    const PRESET_VISUAL_MINIMO = Object.freeze({
        verde_forense: Object.freeze({ corContorno: '#0d9488', corFundo: '#ccfbf1', opacidadeFundo: 0.28, estiloBadge: 'sobrescrito' })
    });

    function obterPresetsMarcadorVisuais() {
        try {
            const g = (typeof self !== 'undefined' && self.JusGovCfgDefaults) || (typeof window !== 'undefined' && window.JusGovCfgDefaults);
            if (g && typeof g.obterPresetsMarcadorColado === 'function') {
                return g.obterPresetsMarcadorColado();
            }
        } catch (_) { }
        return PRESET_VISUAL_MINIMO;
    }

    class FeedbackVisual {
        _p_timerFlashBorder;
        _p_aguardandoDesselecaoFlash;
        _p_timestampCriacaoFlash;
        _p_limparOuvintesInteracaoFlash;
        _p_segmentosAtuaisFlash;
        _p_rangeAtivoFlash;
        _p_corAtivaFlash;
        _p_duracaoAtivaFlash;
        _p_rafScrollFlash;
        _p_copiasCandidatasMarcador;
        _p_marcadoresPermanentes;
        _p_contadorMarcadoresGuia;
        _p_configMarcadorColado;
        _p_ouvinteScrollMarcadoresAtivo;
        _p_limparOuvinteScrollMarcadores;
        _p_rafScrollMarcadores;
        _p_uiAncorado;

        constructor() {
            this._p_uiAncorado = (typeof window !== 'undefined' && typeof window.JusGovLibUiAncorado === 'function')
                ? new window.JusGovLibUiAncorado()
                : null;
            this._p_timerFlashBorder = null;
            this._p_aguardandoDesselecaoFlash = false;
            this._p_timestampCriacaoFlash = 0;
            this._p_limparOuvintesInteracaoFlash = null;
            this._p_segmentosAtuaisFlash = [];
            this._p_rangeAtivoFlash = null;
            this._p_corAtivaFlash = '#0d9488';
            this._p_duracaoAtivaFlash = 0;
            this._p_rafScrollFlash = 0;
            this._p_copiasCandidatasMarcador = [];
            this._p_marcadoresPermanentes = [];
            this._p_contadorMarcadoresGuia = 0;
            this._p_configMarcadorColado = {
                ativo: true,
                preset: 'verde_forense',
                corContorno: '#0d9488',
                corFundo: '#ccfbf1',
                opacidadeFundo: 0.28,
                estiloBadge: 'sobrescrito',
                tipoContorno: 'solido'
            };
            this._p_ouvinteScrollMarcadoresAtivo = false;
            this._p_limparOuvinteScrollMarcadores = null;
            this._p_rafScrollMarcadores = 0;
        }

        get aguardandoDesselecaoFlash() {
            return this._p_aguardandoDesselecaoFlash;
        }

        get timestampCriacaoFlash() {
            return this._p_timestampCriacaoFlash;
        }

        get rangeAtivoFlash() {
            return this._p_rangeAtivoFlash;
        }

        /**
         * Configura as preferências visuais dos Marcadores Permanentes de Conteúdo Colado (FEAT-21 / Seção 6.105).
         */
        configurarMarcadorColado(opcoes = {}) {
            if (!opcoes || typeof opcoes !== 'object') return;
            if (typeof opcoes.ativo === 'boolean') {
                this._p_configMarcadorColado.ativo = opcoes.ativo;
            } else if (typeof opcoes.marcadorConteudoColadoAtivo === 'boolean') {
                this._p_configMarcadorColado.ativo = opcoes.marcadorConteudoColadoAtivo;
            }
            const presetChave = opcoes.preset || opcoes.presetMarcadorColado;
            const presetsDisponiveis = obterPresetsMarcadorVisuais();
            if (typeof presetChave === 'string' && presetsDisponiveis[presetChave]) {
                this._p_configMarcadorColado.preset = presetChave;
                const p = presetsDisponiveis[presetChave];
                if (!opcoes.corContorno && !opcoes.corContornoMarcadorColado) this._p_configMarcadorColado.corContorno = p.corContorno;
                if (!opcoes.corFundo && !opcoes.corFundoMarcadorColado) this._p_configMarcadorColado.corFundo = p.corFundo;
                if (opcoes.opacidadeFundo === undefined && opcoes.opacidadeFundoMarcadorColado === undefined) this._p_configMarcadorColado.opacidadeFundo = p.opacidadeFundo;
                if (!opcoes.estiloBadge && !opcoes.estiloBadgeMarcadorColado) this._p_configMarcadorColado.estiloBadge = p.estiloBadge;
            }
            const corContorno = opcoes.corContorno || opcoes.corContornoMarcadorColado;
            if (typeof corContorno === 'string' && /^#[0-9a-fA-F]{6}$/.test(corContorno.trim())) {
                this._p_configMarcadorColado.corContorno = corContorno.trim().toLowerCase();
            }
            const corFundo = opcoes.corFundo || opcoes.corFundoMarcadorColado;
            if (typeof corFundo === 'string' && /^#[0-9a-fA-F]{6}$/.test(corFundo.trim())) {
                this._p_configMarcadorColado.corFundo = corFundo.trim().toLowerCase();
            }
            const opacidade = (opcoes.opacidadeFundo !== undefined) ? opcoes.opacidadeFundo : opcoes.opacidadeFundoMarcadorColado;
            if (Number.isFinite(Number(opacidade))) {
                this._p_configMarcadorColado.opacidadeFundo = Math.max(0.05, Math.min(0.85, Number(opacidade)));
            }
            const estiloBadge = opcoes.estiloBadge || opcoes.estiloBadgeMarcadorColado;
            const consts = (typeof JusGovConstantes !== 'undefined' && JusGovConstantes)
                ? JusGovConstantes
                : ((typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : null);
            const estilosValidos = (consts && Array.isArray(consts.ESTILOS_BADGE_MARCADOR_COLADO))
                ? consts.ESTILOS_BADGE_MARCADOR_COLADO
                : ['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto', 'apenas_numeral'];
            if (estilosValidos.includes(estiloBadge)) {
                this._p_configMarcadorColado.estiloBadge = estiloBadge;
            } else if (['chip', 'bolinha', 'pilula'].includes(estiloBadge)) {
                this._p_configMarcadorColado.estiloBadge = 'sobrescrito';
            }
            const tipoContorno = opcoes.tipoContorno || opcoes.tipoContornoMarcadorColado;
            if (['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(tipoContorno)) {
                this._p_configMarcadorColado.tipoContorno = tipoContorno;
            }
            if (!this._p_configMarcadorColado.ativo) {
                this.limparMarcadoresPermanentes();
            } else if (this._p_marcadoresPermanentes.length > 0) {
                this._p_renderizarTodosMarcadoresPermanentesNoDom();
            }
        }

        /**
         * Converte cor hexadecimal (#rrggbb) em objeto com hex limpo e string rgba(r,g,b,alfa).
         */
        converterHexParaRgbaFlash(hexBruto, alfa = 0.28) {
            const hexLimpo = (typeof hexBruto === 'string' && /^#[0-9a-fA-F]{6}$/.test(hexBruto.trim()))
                ? hexBruto.trim()
                : '#0d9488';
            const r = parseInt(hexLimpo.slice(1, 3), 16);
            const g = parseInt(hexLimpo.slice(3, 5), 16);
            const b = parseInt(hexLimpo.slice(5, 7), 16);
            return {
                hex: hexLimpo,
                rgba: `rgba(${r}, ${g}, ${b}, ${alfa})`
            };
        }

        /**
         * Remove imediatamente do DOM todos os contêineres e caixas de Flash Border.
         */
        limparFlashBorderImediatamente() {
            if (typeof this._p_limparOuvintesInteracaoFlash === 'function') {
                this._p_limparOuvintesInteracaoFlash();
                this._p_limparOuvintesInteracaoFlash = null;
            }
            if (this._p_timerFlashBorder) {
                clearTimeout(this._p_timerFlashBorder);
                this._p_timerFlashBorder = null;
            }
            if (this._p_rafScrollFlash && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(this._p_rafScrollFlash);
                this._p_rafScrollFlash = 0;
            }
            this._p_aguardandoDesselecaoFlash = false;
            this._p_segmentosAtuaisFlash = [];
            this._p_rangeAtivoFlash = null;
            this._p_duracaoAtivaFlash = 0;

            try {
                const containers = document.querySelectorAll('#jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"]');
                for (let i = 0; i < containers.length; i++) {
                    const c = containers[i];
                    if (c && c.parentNode) {
                        c.parentNode.removeChild(c);
                    }
                }
                if (typeof CSS !== 'undefined' && CSS.highlights) {
                    CSS.highlights.delete('jusgov-flash-copy');
                }
            } catch (_) { }

            try {
                if (typeof window !== 'undefined' && window.top && window.top !== window && window.top.document) {
                    const topContainers = window.top.document.querySelectorAll('#jusgov-flash-contour-container, .jusgov-flash-box, [data-jusgov-flash="true"]');
                    for (let j = 0; j < topContainers.length; j++) {
                        const tc = topContainers[j];
                        if (tc && tc.parentNode) {
                            tc.parentNode.removeChild(tc);
                        }
                    }
                }
            } catch (_) { }
        }

        /**
         * Limpa popups de auditoria e Wiki Forense associados ao validador flutuante.
         */
        limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip = false, validador = null) {
            const v = validador || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
            if (v) {
                if (typeof v.ocultarTodosAvisosImediatamente === 'function') {
                    v.ocultarTodosAvisosImediatamente(preservarMiniTip);
                } else if (typeof v.limparAlertaVisual === 'function') {
                    v.limparAlertaVisual();
                }
            }
        }

        /**
         * Agenda ou executa a remoção atômica do Flash Border e avisos após desseleção.
         * No modo "Até Interação" (duracaoAtivaFlash === -1), preserva o Flash Border contra
         * desseleções comuns de clique (Seção 6.114 / BUG-45), limpando apenas os avisos se solicitado.
         */
        agendarRetiradaFlashAposDesselecao(preservarMiniTip = false, validador = null, forcarLimpezaFlash = false) {
            if (forcarLimpezaFlash || (this._p_duracaoAtivaFlash !== -1 && (this._p_aguardandoDesselecaoFlash || this._p_timerFlashBorder))) {
                this.limparFlashBorderImediatamente();
            }
            this.limparAvisosAuditoriaEWikiImediatamente(preservarMiniTip, validador);
        }

        /**
         * Remove um marcador permanente específico pelo ID sem zerar a contagem sequencial (Seção 6.138).
         */
        removerMarcadorPermanentePorId(idMarcador) {
            const idx = this._p_marcadoresPermanentes.findIndex((m) => m && m.id === idMarcador);
            if (idx === -1) return false;
            this._p_marcadoresPermanentes.splice(idx, 1);
            this._p_renderizarTodosMarcadoresPermanentesNoDom();
            return true;
        }

        /**
         * Remove todos os marcadores permanentes de conteúdo colado e reinicia a contagem da guia.
         */
        limparMarcadoresPermanentes() {
            this._p_marcadoresPermanentes = [];
            this._p_contadorMarcadoresGuia = 0;
            this._p_copiasCandidatasMarcador = [];
            if (typeof this._p_limparOuvinteScrollMarcadores === 'function') {
                this._p_limparOuvinteScrollMarcadores();
                this._p_limparOuvinteScrollMarcadores = null;
            }
            try {
                const containers = document.querySelectorAll('#jusgov-pasted-markers-container, [data-jusgov-pasted-container="true"]');
                for (let i = 0; i < containers.length; i++) {
                    if (containers[i] && containers[i].parentNode) {
                        containers[i].parentNode.removeChild(containers[i]);
                    }
                }
            } catch (_) { }
        }

        /**
         * Retorna a quantidade atual de marcadores permanentes ativos na guia.
         */
        obterContagemMarcadoresPermanentes() {
            return this._p_marcadoresPermanentes.length;
        }

        /**
         * Retorna cópia superficial da lista de marcadores permanentes para inspeção/testes.
         */
        obterMarcadoresPermanentes() {
            return this._p_marcadoresPermanentes.map(m => ({
                id: m.id,
                numeroOrdinal: m.numeroOrdinal,
                texto: m.texto,
                timestamp: m.timestamp
            }));
        }

        /**
         * Projeta o aviso flutuante MiniTip no topo da página através do validador.
         */
        projetarMiniTipGlobal(mensagem, corBorda, validador = null) {
            const v = validador || (typeof window !== 'undefined' && window.JusGovValidadorAtivo ? window.JusGovValidadorAtivo : null);
            if (v && typeof v.projetarMiniTipGlobal === 'function') {
                v.projetarMiniTipGlobal(mensagem, corBorda);
            }
        }

        /**
         * Registra uma seleção/cópia candidata que poderá se tornar um Marcador Permanente
         * caso venha a ser efetivamente colada pelo usuário (FEAT-21 / Seção 6.105).
         */
        registrarCopiaCandidataParaMarcador(rangeAlvo, textoCopiado) {
            if (!rangeAlvo || typeof rangeAlvo.cloneRange !== 'function') return;
            const textoLimpo = String(textoCopiado || '').trim();
            if (!textoLimpo) return;
            try {
                const clone = rangeAlvo.cloneRange();
                /* Mantém histórico das últimas 2 cópias da guia (para suportar colagem do Slot 1 e do Slot 2) */
                if (this._p_copiasCandidatasMarcador.length > 0 && this._p_copiasCandidatasMarcador[0].texto === textoLimpo) {
                    this._p_copiasCandidatasMarcador[0].range = clone;
                    this._p_copiasCandidatasMarcador[0].timestamp = Date.now();
                    return;
                }
                this._p_copiasCandidatasMarcador.unshift({
                    texto: textoLimpo,
                    textoNormalizado: textoLimpo.replace(/\s+/g, ' '),
                    digitos: textoLimpo.replace(/\D/g, ''),
                    range: clone,
                    timestamp: Date.now()
                });
                if (this._p_copiasCandidatasMarcador.length > 4) {
                    this._p_copiasCandidatasMarcador.length = 4;
                }
            } catch (_) { }
        }

        /**
         * Verifica se dois Ranges DOM se sobrepõem ou intersectam no mesmo bloco de texto.
         */
        _p_rangesSeSobrepoem(r1, r2) {
            if (!r1 || !r2 || typeof r1.compareBoundaryPoints !== 'function' || typeof r2.compareBoundaryPoints !== 'function') {
                return false;
            }
            try {
                /* Em DOM Range:
                 * r1.compareBoundaryPoints(Range.END_TO_START, r2) compara r1.start com r2.end (deve ser <= 0)
                 * r1.compareBoundaryPoints(Range.START_TO_END, r2) compara r1.end com r2.start (deve ser >= 0) */
                const ini1AntesOuIgualFim2 = r1.compareBoundaryPoints(Range.END_TO_START, r2) <= 0;
                const fim1DepoisOuIgualIni2 = r1.compareBoundaryPoints(Range.START_TO_END, r2) >= 0;
                return ini1AntesOuIgualFim2 && fim1DepoisOuIgualIni2;
            } catch (_) {
                return false;
            }
        }

        /**
         * Funde dois Ranges sobrepostos num único Range expandido que abrange ambos (FEAT-21).
         */
        _p_fundirRangesSobrepostos(rBase, rNovo) {
            try {
                const fundido = rBase.cloneRange();
                if (rNovo.compareBoundaryPoints(Range.START_TO_START, fundido) < 0) {
                    fundido.setStart(rNovo.startContainer, rNovo.startOffset);
                }
                if (rNovo.compareBoundaryPoints(Range.END_TO_END, fundido) > 0) {
                    fundido.setEnd(rNovo.endContainer, rNovo.endOffset);
                }
                return fundido;
            } catch (_) {
                return rNovo.cloneRange();
            }
        }
    }

    const _ext_FeedbackVisual = [
        { g: 'JusGovCopiaVisualMarcadores', p: './copia-visual-marcadores.js' },
        { g: 'JusGovCopiaVisualFlash', p: './copia-visual-flash.js' }
    ];
    for (let i = 0; i < _ext_FeedbackVisual.length; i++) {
        const it = _ext_FeedbackVisual[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(FeedbackVisual.prototype);
        }
    }

    Object.freeze(FeedbackVisual.prototype);
    window.JusGovFeedbackVisual = Object.freeze(FeedbackVisual);
})();


