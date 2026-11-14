/* ==========================================================================
 * Nome do arquivo: cfg-defaults.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * CONFIGURAÇÃO: JusGovBR Config - Definições Padrão de Fábrica e Parâmetros do Motor
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/cfg-defaults.js
 * - Objeto Exportado: window.JusGovCfgDefaults / self.JusGovCfgDefaults (congelado via Object.freeze)
 * - Estruturas Exportadas: CONFIGURACAO_MOTOR, PADROES_DEFAULT_TURBO, PADROES_DEFAULT_AMPULETAS,
 *   PADROES_DEFAULT_REGRAS_MAPEAMENTO, PRESETS_MARCADOR_COLADO, PADROES_DEFAULT_STORAGE
 * - Padrão Arquitetural: UMD (Universal Module Definition) compatível com Service Worker (MV3),
 *   Content Scripts, Options, Popup e suíte de testes Headless.
 * - Regras / Seções: Seção 6.101 (ARQ-02 / REFAT-02), Seção 6.105 (FEAT-21), Seção 6.109 (BUG-42), Seção 6.112 (FEAT-23)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE PRIMÁRIA:
 *    Centralizar todas as configurações padrão imutáveis, limites operacionais do motor
 *    (`CONFIGURACAO_MOTOR`), tolerâncias geométricas, durações de alertas e presets visuais,
 *    eliminando números mágicos e divergências entre `options.js`, `background.js`, `lib-config.js`
 *    e `copia-selecionar.js`.
 * 2) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
 *    Passo 1.1: Definir `CONFIGURACAO_MOTOR` com limites da janela deslizante O(1), distâncias de arrasto,
 *               tolerâncias geométricas `dx/dy` para cliques simples (BUG-42) e janelas temporais.
 *    Passo 1.2: Definir listas de URLs padrão de fábrica (`PADROES_DEFAULT_TURBO` e `PADROES_DEFAULT_AMPULETAS`).
 *    Passo 1.3: Definir `PRESETS_MARCADOR_COLADO` para os marcadores permanentes de conteúdo colado (FEAT-21).
 *    Passo 1.4: Definir `PADROES_DEFAULT_STORAGE` com todas as chaves e valores iniciais de fábrica.
 *    Passo 1.5: Congelar recursivamente com `Object.freeze` e expor em `JusGovCfgDefaults`.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const exportado = fabrica();
        raiz.JusGovCfgDefaults = exportado;
        if (typeof window !== 'undefined') {
            window.JusGovCfgDefaults = exportado;
        }
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Passo 1.1: Limites operacionais e tolerâncias físicas do motor de seleção e cópia */
    const CONFIGURACAO_MOTOR = Object.freeze({
        RAIO_JANELA_DESLIZANTE: 1000,
        LIMITE_CARACTERES_JANELA_MINIMA: 2200,
        DISTANCIA_MINIMA_ARRASTO_PX: 4,
        TOLERANCIA_MAXIMA_DX_CLIQUE_PX: 24,
        TOLERANCIA_MAXIMA_DY_CLIQUE_PX: 12,
        JANELA_COALESCENCIA_CLIQUES_MS: 220,
        JANELA_DUPLO_ESC_MS: 420,
        TEMPO_EXIBICAO_ALERTA_MS: -1,
        TEMPO_CONFERENCIA_DOCUMENTOS_MS: -1,
        TEMPO_FLASH_BORDER_MS: -1,
        LIMITE_SLOTS_CLIPBOARD_INTERNO: 2,
        LIMITE_MAXIMO_CONTADOR_OPERACIONAL: 900000000
    });

    /* Passo 1.2: Listas de padrões de URLs de fábrica para o Cópia Inteligente e Anti-Ampulhetas */
    const PADROES_DEFAULT_TURBO = Object.freeze([
        '*://*.jus.br/*',
        '*://*.gov.br/*',
        '*://*.mp.br/*',
        '*://*.def.br/*',
        '*://gemini.google.com/*',
        '*://serasa-judicial.serasaexperian.com.br/*'
    ]);

    const PADROES_DEFAULT_AMPULETAS = Object.freeze([
        '*://*.jus.br/*',
        '*://*.pje.jus.br/*',
        '*://pje.jus.br/*',
        '*://*pje*.jus.br/*',
        '*://*pje*.*.jus.br/*'
    ]);

    const PADROES_DEFAULT_REGRAS_MAPEAMENTO = Object.freeze([]);

    /* Passo 1.3: Catálogo de pré-definições visuais para Marcadores Permanentes de Conteúdo Colado (Seção 6.105 / FEAT-21) */
    const PRESETS_MARCADOR_COLADO = Object.freeze({
        verde_forense: Object.freeze({
            id: 'verde_forense',
            nome: 'Verde Forense Suave (Padrão)',
            corContorno: '#0d9488',
            corFundo: '#14b8a6',
            opacidadeFundo: 0.14,
            estiloBadge: 'sobrescrito'
        }),
        marca_texto: Object.freeze({
            id: 'marca_texto',
            nome: 'Marca-Texto Clássico',
            corContorno: '#d97706',
            corFundo: '#facc15',
            opacidadeFundo: 0.24,
            estiloBadge: 'badge_circular'
        }),
        azul_indigo: Object.freeze({
            id: 'azul_indigo',
            nome: 'Azul Índigo Institucional',
            corContorno: '#4f46e5',
            corFundo: '#6366f1',
            opacidadeFundo: 0.14,
            estiloBadge: 'chip_forense'
        }),
        ambar_suave: Object.freeze({
            id: 'ambar_suave',
            nome: 'Âmbar Suave',
            corContorno: '#b45309',
            corFundo: '#f59e0b',
            opacidadeFundo: 0.16,
            estiloBadge: 'sobrescrito'
        }),
        alto_contraste: Object.freeze({
            id: 'alto_contraste',
            nome: 'Alto Contraste Acessível',
            corContorno: '#111827',
            corFundo: '#38bdf8',
            opacidadeFundo: 0.25,
            estiloBadge: 'badge_circular'
        })
    });

    const PROMPT_F1_GEMINI_PADRAO = "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";

    /* Passo 1.4: Dicionário canônico de valores padrão de fábrica para o storage */
    const PADROES_DEFAULT_STORAGE = Object.freeze({
        modoTurbo: 'global',
        estadoAmpuletas: true,
        comportamentoCliqueIcone: 'popup',
        manterFormatacaoBasica: true,
        nivelFiltroFormatacao: 'basico',
        abaEmPrimeiroPlano: true,
        abaEmSegundoPlano: false,
        selecaoEditavelAtiva: true,
        placeholdersMinutasHtmlAtivo: true,
        modoPlaceholdersMinutasHtml: 'placeholders',
        colagemBotaoDireitoAtiva: false,
        capturaBotoesMouse4e5Ativa: true,
        colarBotaoMeioAtivo: true,
        navegacaoTecladoCamposAtiva: true,
        alternarAbasRecentesCtrlTabAtiva: true,
        caixaEntradaRapidaAtiva: true,
        validacaoMatematicaAtiva: true,
        tempoConferenciaDocumentosMs: -1,
        modoExibicaoValidacao: 'ambos',
        posicaoAvisosValidacao: 'acima',
        tempoAvisoMs: -1,
        tempoFlashBorderMs: -1,
        corFlashBorder: '#0d9488',
        marcadorConteudoColadoAtivo: true,
        presetMarcadorColado: 'verde_forense',
        corContornoMarcadorColado: '#0d9488',
        corFundoMarcadorColado: '#14b8a6',
        opacidadeFundoMarcadorColado: 0.14,
        estiloBadgeMarcadorColado: 'sobrescrito',
        tipoContornoMarcadorColado: 'solido',
        minimoCaracteresInterface: 5,
        modoRetirarSelecao: 'total',
        separadorAcumulador: ';',
        incluirSeparadorFinalAcumulador: true,
        separadorTabelas: ';',
        modoShiftCnj: '20digitos',
        converterCabecalhoPjeAtivo: true,
        atalhoF1GeminiAtivo: true,
        promptF1Gemini: PROMPT_F1_GEMINI_PADRAO,
        autoLimpezaCacheCookiesAtiva: true,
        autoLimpezaIdade: '7d',
        criterioOrdenacaoGuias: 'hierarquia_arvore',
        sentidoOrdenacaoGuias: 'esq_dir',
        ordenarGuiasFixadas: false,
        fecharHierarquiaEmCascata: false,
        modoBarraFavoritosSuperior: false,
        tempoTrabalhoCorridoAtivo: false,
        tempoTrabalhoCorridoHoras: 7,
        tempoTrabalhoAtivoAtivo: false,
        tempoTrabalhoAtivoHoras: 6,
        pomodoroAtivo: false,
        pomodoroProporcao: 4.5,
        pomodoroFocoMinutos: 25,
        pomodoroCiclos: 4
    });

    return Object.freeze({
        CONFIGURACAO_MOTOR,
        PADROES_DEFAULT_TURBO,
        PADROES_DEFAULT_AMPULETAS,
        PADROES_DEFAULT_REGRAS_MAPEAMENTO,
        PRESETS_MARCADOR_COLADO,
        PROMPT_F1_GEMINI_PADRAO,
        PADROES_DEFAULT_STORAGE
    });
}));
