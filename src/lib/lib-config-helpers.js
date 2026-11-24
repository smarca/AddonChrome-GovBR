/* ==========================================================================
 * ARQUIVO: src/lib/lib-config-helpers.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Constantes, Hash FNV-1a e Helpers de Configuração
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config-helpers.js
 * - Exportado: self.JusGovConfigHelpers (CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS, PREFIXO_CHAVE_PERFIL_CFG, CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_SYNC_PERFIL_BASE_TOP, LIMITE_BYTES_ITEM_SYNC, JANELA_DUPLO_CLIQUE_ICONE_MS, CHAVES_CONFIGURACAO_SINCRONIZAVEL, SET_CHAVES_SYNC, obterDefaultsModulo, lerJsonDeResposta, formatarNomeArquivoExportacao, clonarValorSimples, valoresIguaisConfig, ENUNS_CONFIGURACAO_VALIDOS, LIMITES_NUMERICOS_CONFIGURACAO, calcularHashPayloadExportacao, extrairCabecalhoComentarioExportacao, normalizarTextoComparacao)
 * - Regras / Seções: ENG-00, ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovConfigHelpers = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const CHAVE_PERFIL_ATIVO = 'perfilAtivoId';
    const CHAVE_LISTA_PERFIS = 'listaPerfis';
    const PREFIXO_CHAVE_PERFIL_CFG = 'perfilCfg_';
    const CHAVE_CONFIG_SYNC_PENDENTE = 'jusgovConfigSyncPendente';
    const CHAVE_SYNC_PERFIL_BASE_TOP = 'jusgovSyncPerfilBaseTopLevel';
    const LIMITE_BYTES_ITEM_SYNC = 8000;
    const JANELA_DUPLO_CLIQUE_ICONE_MS = 260;

    /* Lista canonica de chaves sincronizaveis (perfilAtivoId permanece estritamente local por dispositivo — ARQ-07 / FEAT-48) */
    const CHAVES_CONFIGURACAO_SINCRONIZAVEL = Object.freeze([
        'urlsTurbo', 'urlsTurboExcecoes', 'urlsAmpuletas', 'modoTurbo', 'ativoAmpuletas',
        'manterFormatacaoBasica', 'nivelFiltroFormatacao', 'padronizarFonteCopiaAtivo',
        'fontePadraoCopia', 'tamanhoFontePadraoCopia', 'selecaoEditavelAtiva',
        'modoPlaceholdersMinutasHtml', 'placeholdersMinutasHtmlAtivo', 'colagemBotaoDireitoAtiva',
        'capturaBotoesMouse4e5Ativa', 'colarBotaoMeioAtivo', 'navegacaoTecladoCamposAtiva',
        'bloquearNovasJanelas', 'preservarJanelasAutenticacao', 'abaEmPrimeiroPlano', 'abaEmSegundoPlano',
        'reutilizarAbasAbertas', 'reutilizarAbasFocoPrimeiroPlano', 'protegerGuiasModificadas',
        'reutilizarAbasAcaoConteudo', 'monitorarUrlOriginalAbertura', 'monitorarUrlAtualPagina',
        'criterioOrdenacaoGuias', 'sentidoOrdenacaoGuias', 'ordenarGuiasFixadas',
        'fecharHierarquiaEmCascata', 'descarteGuiasInativasAtivo',
        'tempoInatividadeDescarteMinutos', 'validacaoMatematicaAtiva', 'tempoConferenciaDocumentosMs',
        'modoExibicaoValidacao', 'posicaoAvisosValidacao', 'tempoFlashBorderMs', 'corFlashBorder', 'tipoContornoFlashBorder',
        'marcadorConteudoColadoAtivo', 'presetMarcadorColado', 'corContornoMarcadorColado',
        'corFundoMarcadorColado', 'opacidadeFundoMarcadorColado', 'estiloBadgeMarcadorColado',
        'tipoContornoMarcadorColado', 'minimoCaracteresInterface', 'converterCabecalhoPjeAtivo',
        'atalhoF1GeminiAtivo', 'modoShiftCnj', 'incluirSeparadorFinalAcumulador', 'separadorTabelas',
        'promptF1Gemini', 'tempoExibicaoAlertaMs', 'separadorAcumulador', 'regrasMapeamentoElementos',
        'autoLimpezaCacheCookiesAtiva', 'autoLimpezaIdade', 'tempoTrabalhoCorridoAtivo',
        'tempoTrabalhoCorridoHoras', 'tempoTrabalhoAtivoAtivo', 'tempoTrabalhoAtivoHoras',
        'pomodoroAtivo', 'pomodoroProporcao', 'pomodoroFocoMinutos', 'pomodoroCiclos',
        'pomodoroPausasAutomaticas', 'pomodoroModoAviso', 'pomodoroEstiloMinipopup',
        'pomodoroBeepConclusaoAtivo', 'pomodoroBeepIntensidade',
        'automatePjeAtivo',
        'listaPerfis'
    ]);
    const SET_CHAVES_SYNC = new Set(CHAVES_CONFIGURACAO_SINCRONIZAVEL);

    function obterDefaultsModulo() {
        if (typeof self !== 'undefined' && self.JusGovCfgDefaults) return self.JusGovCfgDefaults;
        if (typeof window !== 'undefined' && window.JusGovCfgDefaults) return window.JusGovCfgDefaults;
        if (typeof globalThis !== 'undefined' && globalThis.JusGovCfgDefaults) return globalThis.JusGovCfgDefaults;
        if (typeof require === 'function') {
            try { return require('../cfg/cfg-defaults.js'); } catch (_) { }
        }
        return null;
    }

    async function lerJsonDeResposta(resp) {
        if (!resp || !resp.ok) return null;
        const txt = await resp.text();
        const def = obterDefaultsModulo();
        if (def && typeof def.parsearJsonComComentarios === 'function') {
            return def.parsearJsonComComentarios(txt);
        }
        const limpo = String(txt || '').replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim();
        return limpo ? JSON.parse(limpo) : null;
    }

    function formatarNomeArquivoExportacao(dataRef = null) {
        const dt = (dataRef instanceof Date && !Number.isNaN(dataRef.getTime())) ? dataRef : new Date();
        const p2 = (n) => String(n).padStart(2, '0');
        const aa = String(dt.getFullYear()).slice(-2);
        const mm = p2(dt.getMonth() + 1);
        const dd = p2(dt.getDate());
        const hh = p2(dt.getHours());
        const mi = p2(dt.getMinutes());
        return `JusGovBR-${aa}${mm}${dd}_${hh}${mi}.json`;
    }

    function clonarValorSimples(valor) {
        if (Array.isArray(valor)) return [...valor];
        if (valor && typeof valor === 'object') {
            const out = {};
            const ks = Object.keys(valor);
            for (let i = 0; i < ks.length; i++) {
                out[ks[i]] = clonarValorSimples(valor[ks[i]]);
            }
            return out;
        }
        return valor;
    }

    function valoresIguaisConfig(a, b) {
        if (a === b) return true;
        if (Array.isArray(a) || Array.isArray(b)) {
            if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }
        if (a && b && typeof a === 'object' && typeof b === 'object') {
            try {
                return JSON.stringify(a) === JSON.stringify(b);
            } catch (_) {
                return false;
            }
        }
        return false;
    }

    const ENUNS_CONFIGURACAO_VALIDOS = Object.freeze({
        modoTurbo: Object.freeze(['global', 'url', 'desligado']),
        comportamentoCliqueIcone: Object.freeze(['popup', 'alternar']),
        nivelFiltroFormatacao: Object.freeze(['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido']),
        modoPlaceholdersMinutasHtml: Object.freeze(['desabilitado', 'placeholders', 'marcacao_amarela']),
        reutilizarAbasAcaoConteudo: Object.freeze(['manter', 'recarregar', 'fechar', 'recarregar_silencioso']),
        criterioOrdenacaoGuias: Object.freeze(['nenhum', 'dominio', 'hierarquia_arvore']),
        sentidoOrdenacaoGuias: Object.freeze(['esq_dir', 'dir_esq']),
        modoExibicaoValidacao: Object.freeze(['sempre', 'erros']),
        posicaoAvisosValidacao: Object.freeze(['acima', 'abaixo']),
        presetMarcadorColado: Object.freeze(['verde_forense', 'azul_institucional', 'ambar_atencao', 'violeta_sutil', 'personalizado']),
        estiloBadgeMarcadorColado: Object.freeze(['sobrescrito', 'subscrito', 'oculto']),
        tipoContornoMarcadorColado: Object.freeze(['solido', 'tracejado', 'pontilhado']),
        modoRetirarSelecao: Object.freeze(['nenhuma', 'com_flash', 'sempre']),
        modoShiftCnj: Object.freeze(['desligado', '20digitos', 'completo']),
        autoLimpezaIdade: Object.freeze(['12h', '1d', '3d', '7d', '15d', '30d']),
        pomodoroModoAviso: Object.freeze(['modal', 'badge', 'barra_descanso', 'barra_sempre', 'badge_e_barra_descanso', 'completo']),
        pomodoroEstiloMinipopup: Object.freeze(['micro', 'compacto', 'normal', 'expandido']),
        pomodoroBeepIntensidade: Object.freeze(['suave', 'moderado', 'grave'])
    });

    const LIMITES_NUMERICOS_CONFIGURACAO = Object.freeze({
        tempoInatividadeDescarteMinutos: Object.freeze({ min: 1, max: 1440 }),
        tempoConferenciaDocumentosMs: Object.freeze({ min: -1, max: 60000 }),
        tempoExibicaoAlertaMs: Object.freeze({ min: -1, max: 60000 }),
        tempoFlashBorderMs: Object.freeze({ min: -1, max: 60000 }),
        opacidadeFundoMarcadorColado: Object.freeze({ min: 0, max: 1 }),
        minimoCaracteresInterface: Object.freeze({ min: 0, max: 500 }),
        tempoTrabalhoCorridoHoras: Object.freeze({ min: 1, max: 24 }),
        tempoTrabalhoAtivoHoras: Object.freeze({ min: 1, max: 24 }),
        pomodoroProporcao: Object.freeze({ min: 1, max: 20 }),
        pomodoroFocoMinutos: Object.freeze({ min: 25, max: 180 }),
        pomodoroCiclos: Object.freeze({ min: 2, max: 10 })
    });

    function calcularHashPayloadExportacao(texto) {
        const str = String(texto || '');
        let h1 = 0xcbf29ce484222325n;
        let h2 = 0x100000001b3n;
        const M = 0xffffffffffffffffn;
        for (let i = 0; i < str.length; i++) {
            const c = BigInt(str.charCodeAt(i));
            h1 = ((h1 ^ c) * 0x100000001b3n) & M;
            h2 = ((h2 + c + BigInt(i + 1)) * 0x9e3779b97f4a7c15n) & M;
            h1 = ((h1 << 13n) | (h1 >> 51n)) & M;
            h2 = ((h2 << 17n) | (h2 >> 47n)) & M;
        }
        return h1.toString(16).padStart(16, '0') + h2.toString(16).padStart(16, '0');
    }

    function extrairCabecalhoComentarioExportacao(textoBruto) {
        const bruto = String(textoBruto || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
        const match = bruto.match(/^\s*\/\*([\s\S]*?)\*\//);
        if (!match) {
            return {
                temComentario: false,
                metadados: null,
                payloadTexto: bruto.trim(),
                conteudoParaHash: ''
            };
        }
        const blocoCompleto = match[0];
        const blocoComentario = match[1];
        const restoSemComentarios = bruto.replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)+/, '').trim();
        const lerCampo = (padrao) => {
            const m = blocoComentario.match(padrao);
            return m && m[1] ? m[1].trim() : '';
        };
        const regexLinhasHash = /^[ \t]*\*?[ \t]*Hash:[ \t]*([0-9a-fA-F]+)[ \t]*$/gim;
        const matchesHash = [...blocoComentario.matchAll(regexLinhasHash)];
        const hashDeclarado = (matchesHash.length === 1 && matchesHash[0][1]) ? matchesHash[0][1].trim().toLowerCase() : '';

        let conteudoParaHash = '';
        if (matchesHash.length === 1) {
            const prefixoAntesMatch = bruto.slice(0, match.index);
            const linhasBloco = blocoCompleto.split('\n');
            let removeuHash = false;
            const linhasFiltradas = linhasBloco.filter((lin) => {
                if (!removeuHash && /^[ \t]*\*?[ \t]*Hash:[ \t]*[0-9a-fA-F]+[ \t]*$/i.test(lin)) {
                    removeuHash = true;
                    return false;
                }
                return true;
            });
            conteudoParaHash = prefixoAntesMatch + linhasFiltradas.join('\n') + bruto.slice(match.index + blocoCompleto.length);
        }

        const metadados = {
            nomeAddon: lerCampo(/^\s*\*?\s*Addon:\s*(.+)$/im),
            versaoAddon: lerCampo(/^\s*\*?\s*Vers[aã]o(?:\s+do\s+Addon)?:\s*(.+)$/im),
            dataExportacao: lerCampo(/^\s*\*?\s*Data(?:\s+da\s+Exporta[cç][aã]o)?:\s*(.+)$/im),
            hashDeclarado,
            hashesDuplicados: matchesHash.length > 1
        };
        return {
            temComentario: true,
            metadados,
            payloadTexto: restoSemComentarios,
            conteudoParaHash
        };
    }

    function normalizarTextoComparacao(str) {
        return String(str || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }


    return Object.freeze({ CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS, PREFIXO_CHAVE_PERFIL_CFG, CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_SYNC_PERFIL_BASE_TOP, LIMITE_BYTES_ITEM_SYNC, JANELA_DUPLO_CLIQUE_ICONE_MS, CHAVES_CONFIGURACAO_SINCRONIZAVEL, SET_CHAVES_SYNC, obterDefaultsModulo, lerJsonDeResposta, formatarNomeArquivoExportacao, clonarValorSimples, valoresIguaisConfig, ENUNS_CONFIGURACAO_VALIDOS, LIMITES_NUMERICOS_CONFIGURACAO, calcularHashPayloadExportacao, extrairCabecalhoComentarioExportacao, normalizarTextoComparacao });
}));