/* ==========================================================================
 * ARQUIVO: src/lib/lib-config.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Configurações, Estado e Ícones Vetoriais
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config.js
 * - Classe Exportada: JusGovConfiguracoes (self.JusGovConfiguracoes / window.JusGovConfiguracoes)
 * - Métodos Públicos: obterConfiguracoesGerais, sincronizarEstado, sincronizarComportamentoIcone,
 *   desenharIconeVetorialFallback, obterChavesConfigSync, houveMudancaDeConfiguracao,
 *   sincronizarMenusContexto, tratarCliqueIconeExtensao, executarSincronizacaoNuvemCoalescida,
 *   gerenciarRequisicaoPerfil, alternarPerfil, criarPerfil, renomearPerfil, excluirPerfil,
 *   resetarPerfis, exportarBackupTotal, importarBackup
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seções 1, 4, 5, FEAT-34/35 (Perfis e JSON externos)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Gerenciar a sincronização atômica entre nuvem (chrome.storage.sync) e memória RAM de
 *    baixa latência (chrome.storage.session), validação estrita de padrões de fábrica
 *    (defaults), higienização de chaves órfãs e renderização do ícone vetorial dinâmico (OffscreenCanvas).
 * 2) CICLO DE VIDA EFÊMERO (MANIFEST V3):
 *    Garante acesso aos dados em < 0,2ms ao acordar o Service Worker através do espelho em session storage.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovConfiguracoes = fabrica();
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
        'urlsTurbo', 'urlsAmpuletas', 'modoTurbo', 'comportamentoCliqueIcone', 'ativoAmpuletas',
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
        'modoExibicaoValidacao', 'posicaoAvisosValidacao', 'tempoFlashBorderMs', 'corFlashBorder',
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

    class JusGovConfiguracoes {
        constructor(dependencias = {}) {
            this.urls = dependencias.urls || null;
            this.injecao = dependencias.injecao || null;
            this.navegador = dependencias.navegador || null;
        }

        obterPadroesDefaultTurbo() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_TURBO) ? def.PADROES_DEFAULT_TURBO : Object.freeze([]);
        }

        obterPadroesDefaultAmpuletas() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_AMPULETAS) ? def.PADROES_DEFAULT_AMPULETAS : Object.freeze([]);
        }

        obterPadroesDefaultRegrasMapeamento() {
            const def = obterDefaultsModulo();
            return (def && def.PADROES_DEFAULT_REGRAS_MAPEAMENTO) ? def.PADROES_DEFAULT_REGRAS_MAPEAMENTO : Object.freeze([]);
        }

        async carregarCatalogoPerfis(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const def = obterDefaultsModulo();
            if (def && typeof def.carregarCatalogoPerfisJson === 'function') {
                return await def.carregarCatalogoPerfisJson(apiChrome);
            }
            if (typeof fetch === 'function' && apiChrome && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                try {
                    const resp = await fetch(apiChrome.runtime.getURL('src/cfg/perfis.json'));
                    const json = await lerJsonDeResposta(resp);
                    if (json) return json;
                } catch (_) { }
            }
            return {
                versaoEsquema: 1,
                perfilPadraoId: 'padrao',
                chavesGlobais: ['regrasMapeamentoElementos', 'perfilAtivoId', 'listaPerfis'],
                configPadrao: {},
                perfisPredefinidos: [
                    { id: 'padrao', nome: 'Padrão', predefinido: true, sobrescritas: {} },
                    { id: 'trabalho', nome: 'Trabalho', predefinido: true, sobrescritas: {} },
                    { id: 'casa', nome: 'Casa', predefinido: true, sobrescritas: {} },
                    { id: 'estudo', nome: 'Estudo', aliases: ['estudar'], predefinido: true, sobrescritas: {} },
                    { id: 'leitura', nome: 'Leitura / Pesquisa', aliases: ['leitura', 'pesquisa'], predefinido: true, sobrescritas: {} },
                    { id: 'reuniao', nome: 'Apresentação / Reunião', aliases: ['reuniao', 'apresentacao'], predefinido: true, sobrescritas: {} }
                ]
            };
        }

        chaveConfigPerfil(perfilId) {
            return PREFIXO_CHAVE_PERFIL_CFG + String(perfilId || 'padrao').replace(/[^a-zA-Z0-9_-]/g, '_');
        }

        obterConfigPadraoBase(catalogo = null) {
            const def = obterDefaultsModulo();
            if (def && typeof def.obterConfigBasePadrao === 'function') {
                return def.obterConfigBasePadrao(catalogo);
            }
            return clonarValorSimples((catalogo && catalogo.configPadrao) || {});
        }

        obterConfigPadraoParaPerfil(idOuNome, catalogo = null) {
            const def = obterDefaultsModulo();
            if (def && typeof def.obterConfigPadraoParaPerfil === 'function') {
                return def.obterConfigPadraoParaPerfil(idOuNome, catalogo);
            }
            const base = this.obterConfigPadraoBase(catalogo);
            const cat = catalogo || {};
            const predefs = Array.isArray(cat.perfisPredefinidos) ? cat.perfisPredefinidos : [];
            const alvo = normalizarTextoComparacao(idOuNome);
            const encontrado = predefs.find(p =>
                normalizarTextoComparacao(p.id) === alvo ||
                normalizarTextoComparacao(p.nome) === alvo ||
                (Array.isArray(p.aliases) && p.aliases.some(a => normalizarTextoComparacao(a) === alvo))
            );
            if (encontrado && encontrado.sobrescritas) {
                Object.keys(encontrado.sobrescritas).forEach((k) => {
                    base[k] = clonarValorSimples(encontrado.sobrescritas[k]);
                });
            }
            return base;
        }

        obterChavesPorPerfil(catalogo = null) {
            const base = this.obterConfigPadraoBase(catalogo);
            const cat = catalogo || {};
            const globais = new Set(Array.isArray(cat.chavesGlobais) ? cat.chavesGlobais : ['regrasMapeamentoElementos', CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS]);
            return Object.keys(base).filter(k => !globais.has(k) && !String(k).startsWith(PREFIXO_CHAVE_PERFIL_CFG));
        }

        extrairConfigPerfilDeObjeto(obj = {}, catalogo = null) {
            const chaves = this.obterChavesPorPerfil(catalogo);
            const resultado = {};
            if (!obj || typeof obj !== 'object') return resultado;
            for (let i = 0; i < chaves.length; i++) {
                const k = chaves[i];
                if (obj[k] !== undefined) {
                    resultado[k] = clonarValorSimples(obj[k]);
                }
            }
            return resultado;
        }

        calcularSobrescritasPerfil(configCompleta = {}, perfilId = 'padrao', catalogo = null) {
            const basePerfil = this.obterConfigPadraoParaPerfil(perfilId, catalogo);
            const chaves = this.obterChavesPorPerfil(catalogo);
            const diff = {};
            for (let i = 0; i < chaves.length; i++) {
                const k = chaves[i];
                if (configCompleta[k] === undefined) continue;
                let valor = clonarValorSimples(configCompleta[k]);
                if (k === 'urlsTurbo' && Array.isArray(valor)) {
                    valor = valor.filter(u => u && u !== '<all_urls>');
                }
                if (!valoresIguaisConfig(valor, basePerfil[k])) {
                    diff[k] = valor;
                }
            }
            return diff;
        }

        resolverConfigEfetivaPerfil(perfilId = 'padrao', sobrescritasSalvas = {}, catalogo = null) {
            const efetiva = this.obterConfigPadraoParaPerfil(perfilId, catalogo);
            const chavesPermitidas = new Set(this.obterChavesPorPerfil(catalogo));
            if (sobrescritasSalvas && typeof sobrescritasSalvas === 'object') {
                const keys = Object.keys(sobrescritasSalvas);
                for (let i = 0; i < keys.length; i++) {
                    const k = keys[i];
                    if (chavesPermitidas.has(k) && sobrescritasSalvas[k] !== undefined) {
                        efetiva[k] = clonarValorSimples(sobrescritasSalvas[k]);
                    }
                }
            }
            if (Array.isArray(efetiva.urlsTurbo)) {
                const limpa = efetiva.urlsTurbo.filter(u => u && u !== '<all_urls>');
                efetiva.urlsTurbo = limpa.length > 0 ? limpa : [...this.obterPadroesDefaultTurbo()];
            }
            if (Array.isArray(efetiva.urlsAmpuletas) && efetiva.urlsAmpuletas.length === 0) {
                efetiva.urlsAmpuletas = [...this.obterPadroesDefaultAmpuletas()];
            }
            if (efetiva.abaEmPrimeiroPlano !== undefined) {
                efetiva.abaEmPrimeiroPlano = Boolean(efetiva.abaEmPrimeiroPlano);
                efetiva.abaEmSegundoPlano = !efetiva.abaEmPrimeiroPlano;
            }
            if (typeof efetiva.tempoConferenciaDocumentosMs === 'number') {
                efetiva.validacaoMatematicaAtiva = (efetiva.tempoConferenciaDocumentosMs !== 0);
            }
            if (typeof efetiva.modoPlaceholdersMinutasHtml === 'string') {
                const ativo = (efetiva.modoPlaceholdersMinutasHtml !== 'desabilitado');
                efetiva.placeholdersMinutasHtmlAtivo = ativo;
                efetiva.selecaoEditavelAtiva = ativo;
            }
            return efetiva;
        }

        gerarIdPerfilCustom(nome, listaExistente = []) {
            const baseSlug = normalizarTextoComparacao(nome).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'perfil';
            const idsUsados = new Set((listaExistente || []).map(p => String(p.id)));
            let candidato = `custom_${baseSlug}`;
            let n = 2;
            while (idsUsados.has(candidato)) {
                candidato = `custom_${baseSlug}_${n}`;
                n++;
            }
            return candidato;
        }

        async obterPerfilAtivoLocal(chromeApi = null, fallbackSyncData = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            try {
                if (apiChrome && apiChrome.storage && apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        return loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                }
            } catch (_) { }
            if (fallbackSyncData && typeof fallbackSyncData[CHAVE_PERFIL_ATIVO] === 'string' && fallbackSyncData[CHAVE_PERFIL_ATIVO].trim()) {
                return fallbackSyncData[CHAVE_PERFIL_ATIVO].trim();
            }
            return '';
        }

        async salvarPerfilAtivoLocal(perfilId, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const idStr = (typeof perfilId === 'string' && perfilId.trim()) ? perfilId.trim() : 'padrao';
            try {
                if (apiChrome && apiChrome.storage && apiChrome.storage.local) {
                    await apiChrome.storage.local.set({ [CHAVE_PERFIL_ATIVO]: idStr });
                    return true;
                }
            } catch (_) { }
            return false;
        }

        garantirEstruturaPerfis(syncData = {}, catalogo = null) {
            const cat = catalogo || {};
            const predefs = Array.isArray(cat.perfisPredefinidos) && cat.perfisPredefinidos.length > 0
                ? cat.perfisPredefinidos
                : [
                    { id: 'padrao', nome: 'Padrão', predefinido: true },
                    { id: 'trabalho', nome: 'Trabalho', predefinido: true },
                    { id: 'casa', nome: 'Casa', predefinido: true },
                    { id: 'estudo', nome: 'Estudo', aliases: ['estudar'], predefinido: true },
                    { id: 'leitura', nome: 'Leitura / Pesquisa', aliases: ['leitura', 'pesquisa'], predefinido: true },
                    { id: 'reuniao', nome: 'Apresentação / Reunião', aliases: ['reuniao', 'apresentacao'], predefinido: true }
                ];

            const tinhaListaAnterior = Array.isArray(syncData[CHAVE_LISTA_PERFIS]) && syncData[CHAVE_LISTA_PERFIS].length > 0;
            const listaBruta = tinhaListaAnterior ? syncData[CHAVE_LISTA_PERFIS] : [];
            const mapaExistente = new Map();
            for (let i = 0; i < listaBruta.length; i++) {
                const item = listaBruta[i];
                if (item && typeof item.id === 'string' && item.id.trim()) {
                    mapaExistente.set(item.id.trim(), {
                        id: item.id.trim(),
                        nome: String(item.nome || item.id).trim().slice(0, 40),
                        predefinido: Boolean(item.predefinido)
                    });
                }
            }

            const listaFinal = [];
            const idsPredef = new Set();
            for (let i = 0; i < predefs.length; i++) {
                const p = predefs[i];
                idsPredef.add(p.id);
                listaFinal.push({
                    id: p.id,
                    nome: String(p.nome || p.id),
                    predefinido: true
                });
            }
            mapaExistente.forEach((item, id) => {
                if (!idsPredef.has(id)) {
                    listaFinal.push({
                        id,
                        nome: item.nome || id,
                        predefinido: false
                    });
                }
            });

            let perfilAtivoId = typeof syncData[CHAVE_PERFIL_ATIVO] === 'string' ? syncData[CHAVE_PERFIL_ATIVO].trim() : '';
            const perfilPadraoId = String(cat.perfilPadraoId || 'padrao');
            if (!perfilAtivoId || !listaFinal.some(p => p.id === perfilAtivoId)) {
                perfilAtivoId = perfilPadraoId;
            }

            /* NUNCA gravar perfilAtivoId em alteracoes de chrome.storage.sync (isolamento por dispositivo — FEAT-48) */
            const alteracoes = {};
            if (!tinhaListaAnterior || JSON.stringify(syncData[CHAVE_LISTA_PERFIS]) !== JSON.stringify(listaFinal)) {
                alteracoes[CHAVE_LISTA_PERFIS] = listaFinal;
            }

            for (let i = 0; i < listaFinal.length; i++) {
                const p = listaFinal[i];
                const chaveCfg = this.chaveConfigPerfil(p.id);
                if (!syncData[chaveCfg] || typeof syncData[chaveCfg] !== 'object' || Array.isArray(syncData[chaveCfg])) {
                    if (!tinhaListaAnterior && p.id === perfilAtivoId) {
                        alteracoes[chaveCfg] = this.calcularSobrescritasPerfil(syncData, p.id, cat);
                    } else {
                        alteracoes[chaveCfg] = {};
                    }
                }
            }

            return { listaPerfis: listaFinal, perfilAtivoId, alteracoes };
        }

        async alternarPerfil(novoPerfilId, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
            if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
            try {
                if (apiChrome.storage.local) {
                    const locPend = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                    if (locPend && locPend[CHAVE_CONFIG_SYNC_PENDENTE] && typeof locPend[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(syncData, locPend[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
            } catch (_) { }
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            const alvoNorm = normalizarTextoComparacao(novoPerfilId);
            const destino = listaPerfis.find(p =>
                p.id === novoPerfilId ||
                normalizarTextoComparacao(p.id) === alvoNorm ||
                normalizarTextoComparacao(p.nome) === alvoNorm ||
                (p.id === 'estudo' && alvoNorm === 'estudar')
            );
            if (!destino) return { ok: false, motivo: 'perfil_nao_encontrado' };

            const atualizacao = {
                [CHAVE_LISTA_PERFIS]: listaPerfis,
                [CHAVE_SYNC_PERFIL_BASE_TOP]: destino.id
            };

            /* Passo P.1: Persistir snapshot das preferencias atuais no perfil que estava ativo */
            const chaveAtual = this.chaveConfigPerfil(perfilAtivoId);
            const fonteAtual = (!syncData[CHAVE_SYNC_PERFIL_BASE_TOP] || syncData[CHAVE_SYNC_PERFIL_BASE_TOP] === perfilAtivoId)
                ? syncData
                : this.resolverConfigEfetivaPerfil(perfilAtivoId, (syncData[chaveAtual] && typeof syncData[chaveAtual] === 'object') ? syncData[chaveAtual] : {}, cat);
            atualizacao[chaveAtual] = this.calcularSobrescritasPerfil(fonteAtual, perfilAtivoId, cat);

            /* Passo P.2: Carregar configuracoes efetivas do perfil destino (sem alterar regrasMapeamentoElementos globais) */
            const chaveDestino = this.chaveConfigPerfil(destino.id);
            const sobrescritasDestino = (destino.id === perfilAtivoId)
                ? atualizacao[chaveAtual]
                : ((syncData[chaveDestino] && typeof syncData[chaveDestino] === 'object') ? syncData[chaveDestino] : {});
            atualizacao[chaveDestino] = sobrescritasDestino;

            const configDestino = this.resolverConfigEfetivaPerfil(destino.id, sobrescritasDestino, cat);
            Object.assign(atualizacao, configDestino);

            await this.salvarPerfilAtivoLocal(destino.id, apiChrome);
            await apiChrome.storage.sync.set(atualizacao);
            try {
                if (apiChrome.storage.local && typeof apiChrome.storage.local.remove === 'function') {
                    await apiChrome.storage.local.remove([CHAVE_CONFIG_SYNC_PENDENTE]);
                }
            } catch (_) { }
            return { ok: true, perfilAtivoId: destino.id, perfil: destino, listaPerfis, config: configDestino };
        }

        async criarPerfil(nomeBruto, opcoes = {}, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const nome = String(nomeBruto || '').trim().slice(0, 40);
            if (!nome) return { ok: false, motivo: 'nome_invalido' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
            if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
            try {
                if (apiChrome.storage.local) {
                    const locPend = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                    if (locPend && locPend[CHAVE_CONFIG_SYNC_PENDENTE] && typeof locPend[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(syncData, locPend[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
            } catch (_) { }
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            const nomeNorm = normalizarTextoComparacao(nome);
            if (listaPerfis.some(p => normalizarTextoComparacao(p.nome) === nomeNorm) || nomeNorm === 'estudar') {
                return { ok: false, motivo: 'nome_duplicado' };
            }

            const novoId = this.gerarIdPerfilCustom(nome, listaPerfis);
            const novoPerfil = { id: novoId, nome, predefinido: false };
            const novaLista = [...listaPerfis, novoPerfil];

            const chaveAtual = this.chaveConfigPerfil(perfilAtivoId);
            const snapshotAtual = this.calcularSobrescritasPerfil(syncData, perfilAtivoId, cat);
            const origem = (opcoes && opcoes.origem) || 'padrao';
            const sobrescritasNovo = (origem === 'copiar_atual')
                ? this.calcularSobrescritasPerfil(syncData, novoId, cat)
                : {};
            const configNovo = this.resolverConfigEfetivaPerfil(novoId, sobrescritasNovo, cat);

            const atualizacao = {
                [CHAVE_LISTA_PERFIS]: novaLista,
                [CHAVE_SYNC_PERFIL_BASE_TOP]: novoId,
                [chaveAtual]: snapshotAtual,
                [this.chaveConfigPerfil(novoId)]: sobrescritasNovo,
                ...configNovo
            };

            await this.salvarPerfilAtivoLocal(novoId, apiChrome);
            await apiChrome.storage.sync.set(atualizacao);
            return { ok: true, perfil: novoPerfil, perfilAtivoId: novoId, listaPerfis: novaLista, config: configNovo };
        }

        async renomearPerfil(perfilId, novoNomeBruto, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const novoNome = String(novoNomeBruto || '').trim().slice(0, 40);
            if (!novoNome) return { ok: false, motivo: 'nome_invalido' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const { listaPerfis } = this.garantirEstruturaPerfis(syncData, cat);

            const alvo = listaPerfis.find(p => p.id === perfilId);
            if (!alvo || alvo.predefinido) return { ok: false, motivo: 'perfil_protegido' };

            const norm = normalizarTextoComparacao(novoNome);
            if (listaPerfis.some(p => p.id !== perfilId && normalizarTextoComparacao(p.nome) === norm) || norm === 'estudar') {
                return { ok: false, motivo: 'nome_duplicado' };
            }

            const novaLista = listaPerfis.map(p => (p.id === perfilId ? { ...p, nome: novoNome } : p));
            await apiChrome.storage.sync.set({ [CHAVE_LISTA_PERFIS]: novaLista });
            return { ok: true, listaPerfis: novaLista };
        }

        async excluirPerfil(perfilId, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
            if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
            try {
                if (apiChrome.storage.local) {
                    const locPend = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                    if (locPend && locPend[CHAVE_CONFIG_SYNC_PENDENTE] && typeof locPend[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(syncData, locPend[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
            } catch (_) { }
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            const alvo = listaPerfis.find(p => p.id === perfilId);
            if (!alvo || alvo.predefinido) return { ok: false, motivo: 'perfil_protegido' };

            const novaLista = listaPerfis.filter(p => p.id !== perfilId);
            const chaveRemover = this.chaveConfigPerfil(perfilId);
            const perfilPadraoId = String(cat.perfilPadraoId || 'padrao');

            if (perfilAtivoId === perfilId) {
                const sobrescritasPadrao = (syncData[this.chaveConfigPerfil(perfilPadraoId)] && typeof syncData[this.chaveConfigPerfil(perfilPadraoId)] === 'object')
                    ? syncData[this.chaveConfigPerfil(perfilPadraoId)]
                    : {};
                const configPadraoAplicada = this.resolverConfigEfetivaPerfil(perfilPadraoId, sobrescritasPadrao, cat);
                await this.salvarPerfilAtivoLocal(perfilPadraoId, apiChrome);
                await apiChrome.storage.sync.set({
                    [CHAVE_LISTA_PERFIS]: novaLista,
                    [CHAVE_SYNC_PERFIL_BASE_TOP]: perfilPadraoId,
                    ...configPadraoAplicada
                });
            } else {
                await apiChrome.storage.sync.set({ [CHAVE_LISTA_PERFIS]: novaLista });
            }

            if (typeof apiChrome.storage.sync.remove === 'function') {
                await apiChrome.storage.sync.remove(chaveRemover);
            }
            return { ok: true, perfilAtivoId: (perfilAtivoId === perfilId ? perfilPadraoId : perfilAtivoId), listaPerfis: novaLista };
        }

        /**
         * Determina qual perfil deve permanecer selecionado após "Restaurar Configurações Iniciais (Todos)":
         * preserva o perfil atual se ele for um dos padronizados (Padrão, Trabalho, Casa, Estudo);
         * caso seja um perfil criado pelo usuário, retorna à primeira escolha ("Padrão").
         * @param {string} perfilCandidatoId
         * @param {Array<{id: string, predefinido?: boolean}>} [listaPredef]
         * @param {string} [perfilPadraoId]
         * @returns {string}
         */
        resolverPerfilAtivoPosReset(perfilCandidatoId, listaPredef = [], perfilPadraoId = 'padrao') {
            const lista = Array.isArray(listaPredef) ? listaPredef : [];
            const candidato = typeof perfilCandidatoId === 'string' ? perfilCandidatoId.trim() : '';
            const encontrado = lista.find(p => p && p.id === candidato && p.predefinido !== false);
            if (encontrado) return encontrado.id;
            const primeiraEscolha = (lista[0] && lista[0].id) ? lista[0].id : '';
            return primeiraEscolha || String(perfilPadraoId || 'padrao');
        }

        async resetarPerfis(escopo = 'atual', chromeApi = null, opcoes = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
            if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
            try {
                if (apiChrome.storage.local) {
                    const locPend = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                    if (locPend && locPend[CHAVE_CONFIG_SYNC_PENDENTE] && typeof locPend[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(syncData, locPend[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
            } catch (_) { }
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            if (escopo === 'todos') {
                const listaPredef = (Array.isArray(cat.perfisPredefinidos) ? cat.perfisPredefinidos : []).map(p => ({
                    id: p.id,
                    nome: String(p.nome || p.id),
                    predefinido: true
                }));
                const candidatoPreferido = (opcoes && typeof opcoes.perfilPreferidoId === 'string' && opcoes.perfilPreferidoId.trim())
                    ? opcoes.perfilPreferidoId.trim()
                    : perfilAtivoId;
                const novoAtivo = this.resolverPerfilAtivoPosReset(candidatoPreferido, listaPredef, cat.perfilPadraoId || 'padrao');
                const configAplicada = this.resolverConfigEfetivaPerfil(novoAtivo, {}, cat);

                let regrasPadraoUsuario = [];
                try {
                    if (typeof fetch === 'function' && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                        const respInt = await fetch(apiChrome.runtime.getURL('src/cfg/interface.json'));
                        const dadosInt = await lerJsonDeResposta(respInt);
                        if (Array.isArray(dadosInt)) {
                            regrasPadraoUsuario = dadosInt
                                .filter(r => r && r.origem === 'usuario')
                                .map(({ origem, ...resto }) => ({ ...resto }));
                        }
                    }
                } catch (_) { }

                const novoSync = {
                    [CHAVE_LISTA_PERFIS]: listaPredef,
                    [CHAVE_SYNC_PERFIL_BASE_TOP]: novoAtivo,
                    regrasMapeamentoElementos: regrasPadraoUsuario,
                    ...configAplicada
                };
                for (let i = 0; i < listaPredef.length; i++) {
                    novoSync[this.chaveConfigPerfil(listaPredef[i].id)] = {};
                }

                const chavesValidas = new Set(Object.keys(novoSync));
                const chavesOrfas = Object.keys(syncData || {}).filter(k => !chavesValidas.has(k));

                if (chavesOrfas.length > 0 && typeof apiChrome.storage.sync.remove === 'function') {
                    await apiChrome.storage.sync.remove(chavesOrfas);
                }
                await apiChrome.storage.sync.set(novoSync);

                if (apiChrome.storage.local) {
                    try {
                        const CHAVES_ESTATISTICAS_PRESERVADAS = [
                            'jusgovTrabalhoEstado',
                            'jusgovProdNuvemMeta',
                            'jusgovProdResumoSync',
                            'totalCopias',
                            'totalAlertas',
                            'dataInicioContadores'
                        ];
                        const locExistente = await apiChrome.storage.local.get(null);
                        const removerLocais = Object.keys(locExistente || {}).filter(
                            (k) => !CHAVES_ESTATISTICAS_PRESERVADAS.includes(k) && k !== CHAVE_PERFIL_ATIVO
                        );
                        if (removerLocais.length > 0 && typeof apiChrome.storage.local.remove === 'function') {
                            await apiChrome.storage.local.remove(removerLocais);
                        }
                        await apiChrome.storage.local.set({ [CHAVE_PERFIL_ATIVO]: novoAtivo });
                    } catch (_) { }
                }
                if (apiChrome.storage.session && typeof apiChrome.storage.session.remove === 'function') {
                    await apiChrome.storage.session.remove('cacheConfigJusGov').catch(() => { });
                }

                return {
                    ok: true,
                    escopo: 'todos',
                    perfilAtivoId: novoAtivo,
                    listaPerfis: listaPredef,
                    config: configAplicada,
                    regrasMapeamentoElementos: regrasPadraoUsuario
                };
            }

            /* Escopo 'atual': Restaura apenas o perfil atualmente selecionado, preservando demais perfis e regras globais XPath/CSS */
            const chaveAtual = this.chaveConfigPerfil(perfilAtivoId);
            const configRestaurada = this.resolverConfigEfetivaPerfil(perfilAtivoId, {}, cat);
            await this.salvarPerfilAtivoLocal(perfilAtivoId, apiChrome);
            await apiChrome.storage.sync.set({
                [CHAVE_LISTA_PERFIS]: listaPerfis,
                [CHAVE_SYNC_PERFIL_BASE_TOP]: perfilAtivoId,
                [chaveAtual]: {},
                ...configRestaurada
            });

            return {
                ok: true,
                escopo: 'atual',
                perfilAtivoId,
                listaPerfis,
                config: configRestaurada
            };
        }

        montarDadosExportacaoBackupTotal(syncData = {}, overridesAtuais = null, catalogo = null) {
            const cat = catalogo || (obterDefaultsModulo() ? obterDefaultsModulo().obterCatalogoPerfis() : null);
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);
            const perfisExportados = {};

            for (let i = 0; i < listaPerfis.length; i++) {
                const p = listaPerfis[i];
                const chave = this.chaveConfigPerfil(p.id);
                const savedDiff = (syncData[chave] && typeof syncData[chave] === 'object') ? syncData[chave] : {};
                if (p.id === perfilAtivoId) {
                    const baseResolvida = this.resolverConfigEfetivaPerfil(p.id, savedDiff, cat);
                    const sobrescritaFonte = (overridesAtuais && typeof overridesAtuais === 'object')
                        ? overridesAtuais
                        : this.extrairConfigPerfilDeObjeto(syncData, cat);
                    const diffAtivo = this.calcularSobrescritasPerfil({ ...baseResolvida, ...sobrescritaFonte }, p.id, cat);
                    perfisExportados[p.id] = this.resolverConfigEfetivaPerfil(p.id, diffAtivo, cat);
                } else {
                    perfisExportados[p.id] = this.resolverConfigEfetivaPerfil(p.id, savedDiff, cat);
                }
            }

            const regrasGlobais = (overridesAtuais && Array.isArray(overridesAtuais.regrasMapeamentoElementos))
                ? overridesAtuais.regrasMapeamentoElementos
                : (Array.isArray(syncData.regrasMapeamentoElementos) ? syncData.regrasMapeamentoElementos : []);

            return {
                projeto: 'JusGovBR',
                versaoBackup: 2,
                backupTotalPerfis: true,
                dataExportacao: new Date().toISOString(),
                perfilAtivoId,
                listaPerfis,
                perfis: perfisExportados,
                regrasMapeamentoElementos: regrasGlobais
            };
        }

        sanitizarObjetoConfiguracao(objBruto = {}, catalogo = null) {
            const cat = catalogo || (obterDefaultsModulo() ? obterDefaultsModulo().obterCatalogoPerfis() : null);
            const configBase = (cat && cat.configPadrao && typeof cat.configPadrao === 'object') ? cat.configPadrao : {};
            const chavesConhecidas = new Set([
                ...Object.keys(configBase),
                ...CHAVES_CONFIGURACAO_SINCRONIZAVEL.filter(k => k !== 'listaPerfis' && k !== 'regrasMapeamentoElementos')
            ]);
            const configValida = {};
            const chavesValidas = [];
            const chavesDescartadas = [];

            if (!objBruto || typeof objBruto !== 'object' || Array.isArray(objBruto)) {
                return { configValida, chavesValidas, chavesDescartadas };
            }

            const chaves = Object.keys(objBruto);
            for (let i = 0; i < chaves.length; i++) {
                const k = chaves[i];
                const v = objBruto[k];
                if (!chavesConhecidas.has(k) || v === undefined || v === null) {
                    chavesDescartadas.push(k);
                    continue;
                }
                const defVal = configBase[k];
                const tipoEsperado = defVal !== undefined ? typeof defVal : null;
                let valido = true;

                if (Array.isArray(defVal) || k === 'urlsTurbo' || k === 'urlsAmpuletas') {
                    valido = Array.isArray(v) && v.every(item => typeof item === 'string' && item.trim().length > 0 && item !== '<all_urls>');
                    if (valido) {
                        configValida[k] = v.map(item => item.trim()).slice(0, 500);
                    }
                } else if (tipoEsperado === 'boolean') {
                    valido = (typeof v === 'boolean');
                    if (valido) configValida[k] = v;
                } else if (tipoEsperado === 'number') {
                    valido = (typeof v === 'number' && Number.isFinite(v));
                    if (valido && LIMITES_NUMERICOS_CONFIGURACAO[k]) {
                        const lim = LIMITES_NUMERICOS_CONFIGURACAO[k];
                        if (v < lim.min || v > lim.max) valido = false;
                    }
                    if (valido) configValida[k] = v;
                } else if (tipoEsperado === 'string') {
                    valido = (typeof v === 'string');
                    if (valido && ENUNS_CONFIGURACAO_VALIDOS[k]) {
                        valido = ENUNS_CONFIGURACAO_VALIDOS[k].includes(v);
                    }
                    if (valido && (k === 'corFlashBorder' || k === 'corContornoMarcadorColado' || k === 'corFundoMarcadorColado')) {
                        valido = /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
                    }
                    if (valido) configValida[k] = v;
                } else {
                    valido = (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string');
                    if (valido) configValida[k] = clonarValorSimples(v);
                }

                if (valido) {
                    chavesValidas.push(k);
                } else {
                    chavesDescartadas.push(k);
                }
            }

            return { configValida, chavesValidas, chavesDescartadas };
        }

        gerarNomeArquivoExportacao(dataRef = null) {
            return formatarNomeArquivoExportacao(dataRef);
        }

        gerarArquivoExportacaoDiferencial(syncData = {}, overridesAtuais = null, catalogo = null, opcoes = {}) {
            const cat = catalogo || (obterDefaultsModulo() ? obterDefaultsModulo().obterCatalogoPerfis() : null);
            const opts = (opcoes && typeof opcoes === 'object') ? opcoes : {};
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            const perfisModificados = {};
            const listaPerfisCustom = [];
            let totalChavesModificadas = 0;

            for (let i = 0; i < listaPerfis.length; i++) {
                const p = listaPerfis[i];
                const chave = this.chaveConfigPerfil(p.id);
                const savedDiff = (syncData[chave] && typeof syncData[chave] === 'object') ? syncData[chave] : {};
                let diffPerfil;
                if (p.id === perfilAtivoId) {
                    const baseResolvida = this.resolverConfigEfetivaPerfil(p.id, savedDiff, cat);
                    const sobrescritaFonte = (overridesAtuais && typeof overridesAtuais === 'object')
                        ? overridesAtuais
                        : this.extrairConfigPerfilDeObjeto(syncData, cat);
                    diffPerfil = this.calcularSobrescritasPerfil({ ...baseResolvida, ...sobrescritaFonte }, p.id, cat);
                } else {
                    diffPerfil = this.calcularSobrescritasPerfil(this.resolverConfigEfetivaPerfil(p.id, savedDiff, cat), p.id, cat);
                }
                const qtdChaves = Object.keys(diffPerfil).length;
                if (!p.predefinido) {
                    listaPerfisCustom.push({ id: p.id, nome: p.nome, predefinido: false });
                    perfisModificados[p.id] = diffPerfil;
                    totalChavesModificadas += Math.max(1, qtdChaves);
                } else if (qtdChaves > 0) {
                    perfisModificados[p.id] = diffPerfil;
                    totalChavesModificadas += qtdChaves;
                }
            }

            const dadosJson = {
                perfis: perfisModificados
            };
            if (listaPerfisCustom.length > 0) {
                dadosJson.listaPerfis = listaPerfisCustom;
            }
            const padraoId = String((cat && cat.perfilPadraoId) || 'padrao');
            if (perfilAtivoId && perfilAtivoId !== padraoId) {
                dadosJson.perfilAtivoId = perfilAtivoId;
            }

            const regrasAtual = (overridesAtuais && Array.isArray(overridesAtuais.regrasMapeamentoElementos))
                ? overridesAtuais.regrasMapeamentoElementos
                : (Array.isArray(syncData.regrasMapeamentoElementos) ? syncData.regrasMapeamentoElementos : null);
            const regrasPadrao = Array.isArray(opts.regrasPadraoUsuario) ? opts.regrasPadraoUsuario : [];
            if (Array.isArray(regrasAtual) && !valoresIguaisConfig(regrasAtual, regrasPadrao)) {
                dadosJson.regrasMapeamentoElementos = clonarValorSimples(regrasAtual);
                totalChavesModificadas += 1;
            }

            const barraAtual = (opts.barraPomodoroAtual && typeof opts.barraPomodoroAtual === 'object') ? opts.barraPomodoroAtual : null;
            if (barraAtual) {
                const barraDiff = {};
                if (barraAtual.modoFixacao !== undefined && Number(barraAtual.modoFixacao) !== 1) barraDiff.modoFixacao = Number(barraAtual.modoFixacao);
                if (barraAtual.nivelDetalhe !== undefined && Number(barraAtual.nivelDetalhe) !== 0) barraDiff.nivelDetalhe = Number(barraAtual.nivelDetalhe);
                if (barraAtual.posicaoVertical !== undefined && barraAtual.posicaoVertical !== 'superior') barraDiff.posicaoVertical = barraAtual.posicaoVertical;
                if (barraAtual.alinhamento !== undefined && barraAtual.alinhamento !== 'esquerda') barraDiff.alinhamento = barraAtual.alinhamento;
                if (Object.keys(barraDiff).length > 0) {
                    dadosJson.barraPomodoro = barraDiff;
                    totalChavesModificadas += Object.keys(barraDiff).length;
                }
            }

            const nomeAddon = String(opts.nomeAddon || 'JusGovBR — Seleção/Cópia Inteligente');
            const versaoAddon = String(opts.versaoAddon || '0.0.0');
            const dataExportacao = String(opts.dataExportacao || new Date().toISOString());
            const payloadJson = JSON.stringify(dadosJson, null, 2);

            const linhasCabecalhoSemHash = [
                '/* ============================================================================',
                ` * Addon: ${nomeAddon}`,
                ` * Versão do Addon: ${versaoAddon}`,
                ` * Data da Exportação: ${dataExportacao}`,
                ' * ============================================================================ */'
            ];
            const conteudoSemLinhaHash = `${linhasCabecalhoSemHash.join('\n')}\n${payloadJson}\n`;
            const hash = calcularHashPayloadExportacao(conteudoSemLinhaHash);

            const linhasCabecalhoComHash = [
                ...linhasCabecalhoSemHash.slice(0, -1),
                ` * Hash: ${hash}`,
                linhasCabecalhoSemHash[linhasCabecalhoSemHash.length - 1]
            ];
            const comentario = linhasCabecalhoComHash.join('\n');
            const nomeArquivo = formatarNomeArquivoExportacao(opts.dataArquivo || null);

            return {
                nomeArquivo,
                conteudoArquivo: `${comentario}\n${payloadJson}\n`,
                payloadJson,
                dadosJson,
                metadados: { nomeAddon, versaoAddon, dataExportacao, hash },
                totalChavesModificadas
            };
        }

        analisarEValidarArquivoImportacao(entrada, catalogo = null) {
            const cat = catalogo || (obterDefaultsModulo() ? obterDefaultsModulo().obterCatalogoPerfis() : null);
            let metadados = null;
            let jsonBruto = null;

            if (typeof entrada === 'string') {
                const extraido = extrairCabecalhoComentarioExportacao(entrada);
                metadados = extraido.metadados;
                if (extraido.temComentario && metadados) {
                    if (!metadados.nomeAddon || !metadados.nomeAddon.toLowerCase().includes('jusgovbr')) {
                        return { ok: false, motivo: 'addon_incompativel', mensagem: 'Arquivo não pertence ao addon JusGovBR.' };
                    }
                    if (metadados.hashesDuplicados) {
                        return { ok: false, motivo: 'hash_invalido', mensagem: 'Cabeçalho de exportação com múltiplos hashes de integridade.' };
                    }
                    if (!metadados.hashDeclarado) {
                        return { ok: false, motivo: 'hash_ausente', mensagem: 'Cabeçalho de exportação sem hash de integridade.' };
                    }
                    const hashCalculado = calcularHashPayloadExportacao(extraido.conteudoParaHash);
                    if (hashCalculado !== metadados.hashDeclarado) {
                        return { ok: false, motivo: 'hash_invalido', mensagem: 'Hash de integridade inválido: o arquivo foi alterado ou corrompido.' };
                    }
                }
                if (!extraido.payloadTexto) {
                    return { ok: false, motivo: 'json_invalido', mensagem: 'Conteúdo de configuração vazio.' };
                }
                try {
                    jsonBruto = JSON.parse(extraido.payloadTexto);
                } catch (_) {
                    return { ok: false, motivo: 'json_invalido', mensagem: 'Arquivo JSON malformado.' };
                }
            } else if (entrada && typeof entrada === 'object' && !Array.isArray(entrada)) {
                jsonBruto = entrada;
            } else {
                return { ok: false, motivo: 'json_invalido', mensagem: 'Formato de entrada inválido.' };
            }

            if (!jsonBruto || typeof jsonBruto !== 'object' || Array.isArray(jsonBruto)) {
                return { ok: false, motivo: 'json_invalido', mensagem: 'Estrutura JSON raiz inválida.' };
            }

            const chavesValidas = [];
            const chavesDescartadas = [];
            const chavesReconhecidasRaiz = new Set(['projeto', 'versaoBackup', 'backupTotalPerfis', 'dataExportacao', 'perfilAtivoId', 'listaPerfis', 'perfis', 'regrasMapeamentoElementos', 'barraPomodoro']);

            if (!metadados) {
                const proj = typeof jsonBruto.projeto === 'string' ? jsonBruto.projeto.toLowerCase() : '';
                const configPadraoRef = (cat && cat.configPadrao) ? cat.configPadrao : {};
                const temChaveConfig = Object.keys(jsonBruto).some(k =>
                    configPadraoRef[k] !== undefined ||
                    k === 'perfis' ||
                    k === 'regrasMapeamentoElementos' ||
                    k === 'barraPomodoro'
                );
                if (!proj.includes('jusgovbr') && !temChaveConfig) {
                    return { ok: false, motivo: 'addon_incompativel', mensagem: 'Arquivo incompatível: nenhuma configuração válida do JusGovBR identificada.' };
                }
            }

            const perfisSanitizados = {};
            if (jsonBruto.perfis && typeof jsonBruto.perfis === 'object' && !Array.isArray(jsonBruto.perfis)) {
                const pids = Object.keys(jsonBruto.perfis);
                for (let i = 0; i < pids.length; i++) {
                    const pid = pids[i];
                    const sanitizado = this.sanitizarObjetoConfiguracao(jsonBruto.perfis[pid], cat);
                    perfisSanitizados[pid] = sanitizado.configValida;
                    sanitizado.chavesValidas.forEach(k => chavesValidas.push(`${pid}.${k}`));
                    sanitizado.chavesDescartadas.forEach(k => chavesDescartadas.push(`${pid}.${k}`));
                }
            } else {
                const chavesSoltasObj = {};
                Object.keys(jsonBruto).forEach((k) => {
                    if (!chavesReconhecidasRaiz.has(k)) {
                        chavesSoltasObj[k] = jsonBruto[k];
                    }
                });
                const sanV1 = this.sanitizarObjetoConfiguracao(chavesSoltasObj, cat);
                Object.assign(perfisSanitizados, { __v1__: sanV1.configValida });
                sanV1.chavesValidas.forEach(k => chavesValidas.push(k));
                sanV1.chavesDescartadas.forEach(k => chavesDescartadas.push(k));
            }

            let regrasSanitizadas = null;
            if (jsonBruto.regrasMapeamentoElementos !== undefined) {
                if (Array.isArray(jsonBruto.regrasMapeamentoElementos)) {
                    regrasSanitizadas = jsonBruto.regrasMapeamentoElementos.filter(r =>
                        r && typeof r === 'object' && !Array.isArray(r) && typeof r.seletor === 'string' && r.seletor.trim().length > 0
                    );
                } else {
                    chavesDescartadas.push('regrasMapeamentoElementos');
                }
            }

            let barraSanitizada = null;
            if (jsonBruto.barraPomodoro !== undefined) {
                if (jsonBruto.barraPomodoro && typeof jsonBruto.barraPomodoro === 'object' && !Array.isArray(jsonBruto.barraPomodoro)) {
                    const b = jsonBruto.barraPomodoro;
                    const outB = {};
                    if ([0, 1, 2, 3].includes(Number(b.modoFixacao))) outB.modoFixacao = Number(b.modoFixacao);
                    else if (b.modoFixacao !== undefined) chavesDescartadas.push('barraPomodoro.modoFixacao');
                    if ([0, 1, 2].includes(Number(b.nivelDetalhe))) outB.nivelDetalhe = Number(b.nivelDetalhe);
                    else if (b.nivelDetalhe !== undefined) chavesDescartadas.push('barraPomodoro.nivelDetalhe');
                    if (b.posicaoVertical === 'superior' || b.posicaoVertical === 'inferior') outB.posicaoVertical = b.posicaoVertical;
                    else if (b.posicaoVertical !== undefined) chavesDescartadas.push('barraPomodoro.posicaoVertical');
                    if (b.alinhamento === 'esquerda' || b.alinhamento === 'centro' || b.alinhamento === 'direita') outB.alinhamento = b.alinhamento;
                    else if (b.alinhamento !== undefined) chavesDescartadas.push('barraPomodoro.alinhamento');
                    barraSanitizada = outB;
                } else {
                    chavesDescartadas.push('barraPomodoro');
                }
            }

            return {
                ok: true,
                metadados,
                dadosValidados: {
                    ehMultiperfil: Boolean(jsonBruto.perfis && typeof jsonBruto.perfis === 'object' && !Array.isArray(jsonBruto.perfis)),
                    perfilAtivoId: typeof jsonBruto.perfilAtivoId === 'string' ? jsonBruto.perfilAtivoId.trim() : '',
                    listaPerfis: Array.isArray(jsonBruto.listaPerfis) ? jsonBruto.listaPerfis : [],
                    perfis: perfisSanitizados,
                    regrasMapeamentoElementos: regrasSanitizadas,
                    barraPomodoro: barraSanitizada
                },
                chavesValidas,
                chavesDescartadas,
                totalChavesDescartadas: chavesDescartadas.length
            };
        }

        async importarBackupTotal(entrada = {}, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const analise = this.analisarEValidarArquivoImportacao(entrada, cat);
            if (!analise || !analise.ok) {
                return analise || { ok: false, motivo: 'json_invalido' };
            }

            const syncAtual = await apiChrome.storage.sync.get(null);
            const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncAtual);
            if (ativoLocal) syncAtual[CHAVE_PERFIL_ATIVO] = ativoLocal;
            const { listaPerfis: listaAtual, perfilAtivoId: ativoAtual } = this.garantirEstruturaPerfis(syncAtual, cat);
            const dv = analise.dadosValidados;

            if (dv.ehMultiperfil) {
                const predefs = (cat && Array.isArray(cat.perfisPredefinidos)) ? cat.perfisPredefinidos : [];
                const idsPredef = new Set(predefs.map(p => p.id));
                const novaLista = predefs.map(p => ({ id: p.id, nome: String(p.nome || p.id), predefinido: true }));
                const idsAdicionados = new Set(novaLista.map(p => p.id));

                for (let i = 0; i < dv.listaPerfis.length; i++) {
                    const item = dv.listaPerfis[i];
                    if (item && typeof item.id === 'string' && item.id.trim() && !idsAdicionados.has(item.id.trim()) && !idsPredef.has(item.id.trim())) {
                        novaLista.push({
                            id: item.id.trim(),
                            nome: String(item.nome || item.id).trim().slice(0, 40),
                            predefinido: false
                        });
                        idsAdicionados.add(item.id.trim());
                    }
                }
                Object.keys(dv.perfis).forEach((pid) => {
                    if (pid && !idsAdicionados.has(pid)) {
                        novaLista.push({ id: pid, nome: pid, predefinido: idsPredef.has(pid) });
                        idsAdicionados.add(pid);
                    }
                });

                const novoAtivo = (dv.perfilAtivoId && novaLista.some(p => p.id === dv.perfilAtivoId))
                    ? dv.perfilAtivoId
                    : (novaLista.some(p => p.id === ativoAtual) ? ativoAtual : String((cat && cat.perfilPadraoId) || 'padrao'));

                const gravacao = {
                    [CHAVE_LISTA_PERFIS]: novaLista,
                    [CHAVE_SYNC_PERFIL_BASE_TOP]: novoAtivo
                };

                for (let i = 0; i < novaLista.length; i++) {
                    const p = novaLista[i];
                    const cfgImportada = (dv.perfis[p.id] && typeof dv.perfis[p.id] === 'object') ? dv.perfis[p.id] : {};
                    const resolvida = this.resolverConfigEfetivaPerfil(p.id, cfgImportada, cat);
                    gravacao[this.chaveConfigPerfil(p.id)] = this.calcularSobrescritasPerfil(resolvida, p.id, cat);
                    if (p.id === novoAtivo) {
                        Object.assign(gravacao, resolvida);
                    }
                }

                if (Array.isArray(dv.regrasMapeamentoElementos)) {
                    gravacao.regrasMapeamentoElementos = dv.regrasMapeamentoElementos;
                }

                const chavesPerfilEsperadas = new Set(novaLista.map(p => this.chaveConfigPerfil(p.id)));
                const chavesRemover = Object.keys(syncAtual || {}).filter(k =>
                    k.startsWith(PREFIXO_CHAVE_PERFIL_CFG) && !chavesPerfilEsperadas.has(k)
                );

                await this.salvarPerfilAtivoLocal(novoAtivo, apiChrome);
                await apiChrome.storage.sync.set(gravacao);
                if (chavesRemover.length > 0 && typeof apiChrome.storage.sync.remove === 'function') {
                    await apiChrome.storage.sync.remove(chavesRemover);
                }
                if (dv.barraPomodoro && apiChrome.storage.local) {
                    const b = dv.barraPomodoro;
                    await apiChrome.storage.local.set({
                        jusgovPomodoroBarraEstadoGlobal: {
                            modoFixacao: b.modoFixacao ?? 1,
                            nivelDetalhe: b.nivelDetalhe ?? 0,
                            posicaoVertical: b.posicaoVertical || 'superior',
                            posicaoVerticalAncorada: b.posicaoVertical || 'superior',
                            topPx: b.posicaoVertical === 'inferior' ? 99999 : 0,
                            alinhamento: b.alinhamento || 'esquerda',
                            alinhamentoAncorado: b.alinhamento || 'esquerda',
                            leftPx: null,
                            topAncoradoPx: b.posicaoVertical === 'inferior' ? 99999 : 0,
                            leftAncoradoPx: null
                        }
                    });
                }

                return {
                    ok: true,
                    backupTotal: true,
                    perfilAtivoId: novoAtivo,
                    listaPerfis: novaLista,
                    metadados: analise.metadados,
                    chavesValidas: analise.chavesValidas,
                    chavesDescartadas: analise.chavesDescartadas,
                    totalChavesDescartadas: analise.totalChavesDescartadas
                };
            }

            /* Retrocompatibilidade v1: importa configuracoes isoladas validadas no perfil ativo atual */
            const cfgV1 = dv.perfis.__v1__ || {};
            const baseMerged = { ...syncAtual, ...cfgV1 };
            const resolvidaV1 = this.resolverConfigEfetivaPerfil(ativoAtual, baseMerged, cat);
            const gravacaoV1 = {
                [CHAVE_LISTA_PERFIS]: listaAtual,
                [CHAVE_SYNC_PERFIL_BASE_TOP]: ativoAtual,
                [this.chaveConfigPerfil(ativoAtual)]: this.calcularSobrescritasPerfil(resolvidaV1, ativoAtual, cat),
                ...resolvidaV1
            };
            if (Array.isArray(dv.regrasMapeamentoElementos)) {
                gravacaoV1.regrasMapeamentoElementos = dv.regrasMapeamentoElementos;
            }
            await this.salvarPerfilAtivoLocal(ativoAtual, apiChrome);
            await apiChrome.storage.sync.set(gravacaoV1);
            return {
                ok: true,
                backupTotal: false,
                perfilAtivoId: ativoAtual,
                listaPerfis: listaAtual,
                metadados: analise.metadados,
                chavesValidas: analise.chavesValidas,
                chavesDescartadas: analise.chavesDescartadas,
                totalChavesDescartadas: analise.totalChavesDescartadas
            };
        }

        /*
         * FUNCAO / MÉTODO: obterConfiguracoesGerais
         * OBJETIVO DE RECONSTRUCAO: Recuperar o objeto consolidado de configuracoes da
         * extensao a partir da memoria RAM rapida (storage.session) ou sincronizacao em nuvem.
         */
        async obterConfiguracoesGerais(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage) return {};

            try {
                let baseCfg = null;
                if (apiChrome.storage.session) {
                    const cached = await apiChrome.storage.session.get('cacheConfigJusGov');
                    if (cached && cached.cacheConfigJusGov && typeof cached.cacheConfigJusGov === 'object' && typeof cached.cacheConfigJusGov.modoTurbo === 'string') {
                        baseCfg = { ...cached.cacheConfigJusGov };
                    }
                }
                if (!baseCfg && apiChrome.storage.sync) {
                    const syncCfg = await apiChrome.storage.sync.get(null);
                    if (syncCfg && typeof syncCfg === 'object') {
                        baseCfg = { ...syncCfg };
                    }
                }
                if (!baseCfg) baseCfg = {};
                if (apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        baseCfg[CHAVE_PERFIL_ATIVO] = loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                    if (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object') {
                        Object.assign(baseCfg, loc[CHAVE_CONFIG_SYNC_PENDENTE]);
                    }
                }
                if (baseCfg.pomodoroAtivo === undefined) {
                    baseCfg.pomodoroAtivo = true;
                }
                return baseCfg;
            } catch (_) {
                return {};
            }
        }

        /*
         * FUNCAO / MÉTODO: sincronizarEstado
         * OBJETIVO DE RECONSTRUCAO: Ler as configuracoes da nuvem (chrome.storage.sync),
         * aplicar o catalogo de perfis e valores padrao de src/cfg/perfis.json caso alguma
         * chave esteja ausente, espelhar alteracoes ativas no perfil ativo, gravar cache
         * em RAM (chrome.storage.session), atualizar o registro de scripts e sincronizar
         * todas as abas abertas em tempo real.
         */
        async sincronizarEstado(chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return null;

            const injecaoUtil = dependencias.injecao || this.injecao;
            const navegadorUtil = dependencias.navegador || this.navegador;
            const urlsUtil = dependencias.urls || this.urls;

            /* Passo 4.0: Carregar catalogo externo de perfis e personalizacoes (src/cfg/perfis.json) */
            const cat = await this.carregarCatalogoPerfis(apiChrome);

            /* Passo 4.1: Ler configuracoes da nuvem + perfil local do dispositivo + pendencias locais */
            const syncBruto = await apiChrome.storage.sync.get(null);
            let pendObj = null;
            let perfilLocalSalvo = '';
            try {
                if (apiChrome.storage.local) {
                    const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_PERFIL_ATIVO]);
                    if (loc && typeof loc[CHAVE_PERFIL_ATIVO] === 'string' && loc[CHAVE_PERFIL_ATIVO].trim()) {
                        perfilLocalSalvo = loc[CHAVE_PERFIL_ATIVO].trim();
                    }
                    if (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object' && Object.keys(loc[CHAVE_CONFIG_SYNC_PENDENTE]).length > 0) {
                        pendObj = loc[CHAVE_CONFIG_SYNC_PENDENTE];
                    }
                }
            } catch (_) { }
            const temPendenteLocal = Boolean(pendObj);
            const basePerfisEntrada = { ...syncBruto };
            if (perfilLocalSalvo) basePerfisEntrada[CHAVE_PERFIL_ATIVO] = perfilLocalSalvo;
            const { listaPerfis, perfilAtivoId, alteracoes: alteracoesPerfis } = this.garantirEstruturaPerfis(basePerfisEntrada, cat);

            if (perfilLocalSalvo !== perfilAtivoId) {
                await this.salvarPerfilAtivoLocal(perfilAtivoId, apiChrome);
            }

            /* Se outro dispositivo escreveu chaves top-level de outro perfil no sync, isola este PC usando o perfilCfg_<localPerfilAtivoId> */
            const perfilTopSync = typeof syncBruto[CHAVE_SYNC_PERFIL_BASE_TOP] === 'string' ? syncBruto[CHAVE_SYNC_PERFIL_BASE_TOP].trim() : '';
            const chaveCfgAtivo = this.chaveConfigPerfil(perfilAtivoId);
            const config = (perfilTopSync && perfilTopSync !== perfilAtivoId)
                ? {
                    ...syncBruto,
                    ...this.resolverConfigEfetivaPerfil(
                        perfilAtivoId,
                        (syncBruto[chaveCfgAtivo] && typeof syncBruto[chaveCfgAtivo] === 'object') ? syncBruto[chaveCfgAtivo] : {},
                        cat
                    )
                }
                : { ...syncBruto };

            if (pendObj) {
                Object.assign(config, pendObj);
            }
            Object.assign(config, alteracoesPerfis);
            config[CHAVE_PERFIL_ATIVO] = perfilAtivoId;
            let precisaSalvar = Object.keys(alteracoesPerfis).length > 0;

            const padraoPerfil = this.obterConfigPadraoParaPerfil(perfilAtivoId, cat);
            const padraoAmpuletas = this.obterPadroesDefaultAmpuletas();
            const padraoTurbo = this.obterPadroesDefaultTurbo();

            /* Passo 4.2: Aplicar valores padrao do perfil ativo (perfis.json) para chaves ausentes ou invalidas */
            if (Array.isArray(config.urlsTurbo) && config.urlsTurbo.includes('<all_urls>')) {
                config.urlsTurbo = config.urlsTurbo.filter(u => u && u !== '<all_urls>');
                precisaSalvar = true;
            }
            if (!Array.isArray(config.urlsTurbo) || config.urlsTurbo.length === 0) {
                config.urlsTurbo = Array.isArray(padraoPerfil.urlsTurbo) && padraoPerfil.urlsTurbo.length > 0
                    ? [...padraoPerfil.urlsTurbo]
                    : [...padraoTurbo];
                precisaSalvar = true;
            }
            if (!Array.isArray(config.urlsAmpuletas) || config.urlsAmpuletas.length === 0) {
                config.urlsAmpuletas = Array.isArray(padraoPerfil.urlsAmpuletas) && padraoPerfil.urlsAmpuletas.length > 0
                    ? [...padraoPerfil.urlsAmpuletas]
                    : [...padraoAmpuletas];
                precisaSalvar = true;
            } else {
                const listaPjeBase = (Array.isArray(padraoPerfil.urlsAmpuletas) && padraoPerfil.urlsAmpuletas.length > 0)
                    ? padraoPerfil.urlsAmpuletas
                    : padraoAmpuletas;
                let atualizouPje = false;
                for (let p = 0; p < listaPjeBase.length; p++) {
                    if (!config.urlsAmpuletas.includes(listaPjeBase[p])) {
                        config.urlsAmpuletas.push(listaPjeBase[p]);
                        atualizouPje = true;
                    }
                }
                if (atualizouPje) precisaSalvar = true;
            }

            if (!['global', 'url', 'desligado'].includes(config.modoTurbo)) {
                config.modoTurbo = padraoPerfil.modoTurbo;
                precisaSalvar = true;
            }
            if (typeof config.comportamentoCliqueIcone !== 'string' || !['acoes_rapidas', 'popup'].includes(config.comportamentoCliqueIcone)) {
                config.comportamentoCliqueIcone = padraoPerfil.comportamentoCliqueIcone;
                precisaSalvar = true;
            }
            if (config.ativoAmpuletas === undefined) {
                config.ativoAmpuletas = padraoPerfil.ativoAmpuletas;
                precisaSalvar = true;
            }
            if (config.manterFormatacaoBasica === undefined) {
                config.manterFormatacaoBasica = padraoPerfil.manterFormatacaoBasica;
                precisaSalvar = true;
            }
            const niveisValidos = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido', 'extendido', 'sem_filtro'];
            if (typeof config.nivelFiltroFormatacao !== 'string' || !niveisValidos.includes(config.nivelFiltroFormatacao)) {
                config.nivelFiltroFormatacao = padraoPerfil.nivelFiltroFormatacao;
                precisaSalvar = true;
            }
            if (!['com_flash', 'total', 'total_exceto_arrasto', 'interface', 'nenhuma'].includes(config.modoRetirarSelecao)) {
                config.modoRetirarSelecao = (config.tempoFlashBorderMs === 0) ? 'nenhuma' : (padraoPerfil.modoRetirarSelecao || 'com_flash');
                precisaSalvar = true;
            }
            if (config.tempoFlashBorderMs === 0 && config.modoRetirarSelecao === 'com_flash') {
                config.modoRetirarSelecao = 'nenhuma';
                precisaSalvar = true;
            }
            if (config.modoPlaceholdersMinutasHtml === undefined) {
                config.modoPlaceholdersMinutasHtml = (config.placeholdersMinutasHtmlAtivo === false || config.selecaoEditavelAtiva === false)
                    ? 'desabilitado'
                    : padraoPerfil.modoPlaceholdersMinutasHtml;
                precisaSalvar = true;
            }
            if (config.placeholdersMinutasHtmlAtivo === undefined) {
                config.placeholdersMinutasHtmlAtivo = (config.modoPlaceholdersMinutasHtml !== 'desabilitado');
                precisaSalvar = true;
            }
            if (config.selecaoEditavelAtiva === undefined) {
                config.selecaoEditavelAtiva = (config.modoPlaceholdersMinutasHtml !== 'desabilitado');
                precisaSalvar = true;
            }
            if (typeof config.tempoConferenciaDocumentosMs !== 'number' || (config.tempoConferenciaDocumentosMs !== -1 && (config.tempoConferenciaDocumentosMs < 0 || config.tempoConferenciaDocumentosMs > 5000))) {
                config.tempoConferenciaDocumentosMs = (config.validacaoMatematicaAtiva === false) ? 0 : padraoPerfil.tempoConferenciaDocumentosMs;
                precisaSalvar = true;
            }
            if (config.validacaoMatematicaAtiva === undefined || config.validacaoMatematicaAtiva !== (config.tempoConferenciaDocumentosMs !== 0)) {
                config.validacaoMatematicaAtiva = (config.tempoConferenciaDocumentosMs !== 0);
                precisaSalvar = true;
            }
            if (!['sempre', 'apenas_erros'].includes(config.modoExibicaoValidacao)) {
                config.modoExibicaoValidacao = padraoPerfil.modoExibicaoValidacao;
                precisaSalvar = true;
            }
            if (!['abaixo', 'acima'].includes(config.posicaoAvisosValidacao)) {
                config.posicaoAvisosValidacao = padraoPerfil.posicaoAvisosValidacao;
                precisaSalvar = true;
            }
            if (typeof config.tempoFlashBorderMs !== 'number' || (config.tempoFlashBorderMs !== -1 && (config.tempoFlashBorderMs < 0 || config.tempoFlashBorderMs > 5250))) {
                config.tempoFlashBorderMs = padraoPerfil.tempoFlashBorderMs;
                precisaSalvar = true;
            }
            if (typeof config.corFlashBorder !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFlashBorder.trim())) {
                config.corFlashBorder = padraoPerfil.corFlashBorder;
                precisaSalvar = true;
            }
            if (config.marcadorConteudoColadoAtivo === undefined) {
                config.marcadorConteudoColadoAtivo = padraoPerfil.marcadorConteudoColadoAtivo;
                precisaSalvar = true;
            }
            if (typeof config.presetMarcadorColado !== 'string' || !config.presetMarcadorColado.trim()) {
                config.presetMarcadorColado = padraoPerfil.presetMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.corContornoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corContornoMarcadorColado.trim())) {
                config.corContornoMarcadorColado = padraoPerfil.corContornoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.corFundoMarcadorColado !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(config.corFundoMarcadorColado.trim())) {
                config.corFundoMarcadorColado = padraoPerfil.corFundoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.opacidadeFundoMarcadorColado !== 'number' || !Number.isFinite(config.opacidadeFundoMarcadorColado)) {
                config.opacidadeFundoMarcadorColado = padraoPerfil.opacidadeFundoMarcadorColado;
                precisaSalvar = true;
            }
            const consts = (typeof JusGovConstantes !== 'undefined' && JusGovConstantes)
                ? JusGovConstantes
                : ((typeof self !== 'undefined' && self.JusGovConstantes) ? self.JusGovConstantes : null);
            const estilosBadgeValidos = (consts && Array.isArray(consts.ESTILOS_BADGE_MARCADOR_COLADO))
                ? consts.ESTILOS_BADGE_MARCADOR_COLADO
                : ['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto', 'apenas_numeral'];
            const modosAvisoPomodoroValidos = (consts && Array.isArray(consts.MODOS_AVISO_POMODORO))
                ? consts.MODOS_AVISO_POMODORO
                : ['modal', 'badge', 'barra_descanso', 'barra_sempre', 'badge_e_barra_descanso', 'completo'];

            if (typeof config.estiloBadgeMarcadorColado !== 'string' || !estilosBadgeValidos.includes(config.estiloBadgeMarcadorColado)) {
                config.estiloBadgeMarcadorColado = padraoPerfil.estiloBadgeMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.tipoContornoMarcadorColado !== 'string' || !['solido', 'tracejado', 'sem_borda', 'ondulado', 'taxado'].includes(config.tipoContornoMarcadorColado)) {
                config.tipoContornoMarcadorColado = padraoPerfil.tipoContornoMarcadorColado;
                precisaSalvar = true;
            }
            if (typeof config.minimoCaracteresInterface !== 'number' || ![0, 1, 2, 3, 4, 5, 10].includes(config.minimoCaracteresInterface)) {
                config.minimoCaracteresInterface = padraoPerfil.minimoCaracteresInterface;
                precisaSalvar = true;
            }
            if (config.tempoExibicaoAlertaMs !== -1) {
                config.tempoExibicaoAlertaMs = -1;
                precisaSalvar = true;
            }
            if (typeof config.separadorAcumulador !== 'string' ||
                config.separadorAcumulador.trim().length === 0 ||
                /[0-9\p{L}]/u.test(config.separadorAcumulador) ||
                !/[!-\/:-@\[-`{-~|\u00A7\u00B0\u00BA\u00AA\p{P}\p{S}]/u.test(config.separadorAcumulador)) {
                config.separadorAcumulador = padraoPerfil.separadorAcumulador;
                precisaSalvar = true;
            } else if (config.separadorAcumulador.length > 5) {
                config.separadorAcumulador = config.separadorAcumulador.slice(0, 5);
                precisaSalvar = true;
            }
            if (typeof config.promptF1Gemini !== 'string' || config.promptF1Gemini.trim().length === 0) {
                config.promptF1Gemini = padraoPerfil.promptF1Gemini;
                precisaSalvar = true;
            }
            if (!['20digitos', 'semZeros'].includes(config.modoShiftCnj)) {
                config.modoShiftCnj = padraoPerfil.modoShiftCnj;
                precisaSalvar = true;
            }
            if (![';', '\t', ' | '].includes(config.separadorTabelas)) {
                config.separadorTabelas = padraoPerfil.separadorTabelas;
                precisaSalvar = true;
            }
            if (!['12h', '1d', '3d', '7d', '15d', '30d'].includes(config.autoLimpezaIdade)) {
                config.autoLimpezaIdade = padraoPerfil.autoLimpezaIdade;
                precisaSalvar = true;
            }
            if (typeof config.tempoTrabalhoCorridoHoras !== 'number' || config.tempoTrabalhoCorridoHoras < 1 || config.tempoTrabalhoCorridoHoras > 12) {
                config.tempoTrabalhoCorridoHoras = padraoPerfil.tempoTrabalhoCorridoHoras;
                precisaSalvar = true;
            }
            if (typeof config.tempoTrabalhoAtivoHoras !== 'number' || config.tempoTrabalhoAtivoHoras < 1 || config.tempoTrabalhoAtivoHoras > 12) {
                config.tempoTrabalhoAtivoHoras = padraoPerfil.tempoTrabalhoAtivoHoras;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroProporcao !== 'number' || ![5, 4.5, 4, 3.5, 3].includes(config.pomodoroProporcao)) {
                config.pomodoroProporcao = padraoPerfil.pomodoroProporcao;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroFocoMinutos !== 'number' || config.pomodoroFocoMinutos < 25 || config.pomodoroFocoMinutos > 90 || config.pomodoroFocoMinutos % 5 !== 0) {
                config.pomodoroFocoMinutos = padraoPerfil.pomodoroFocoMinutos;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroCiclos !== 'number' || !Number.isInteger(config.pomodoroCiclos) || config.pomodoroCiclos < 2 || config.pomodoroCiclos > 10) {
                config.pomodoroCiclos = padraoPerfil.pomodoroCiclos;
                precisaSalvar = true;
            }
            if (config.pomodoroPausasAutomaticas !== true) {
                config.pomodoroPausasAutomaticas = true;
                precisaSalvar = true;
            }
            if (typeof config.pomodoroModoAviso !== 'string' || !modosAvisoPomodoroValidos.includes(config.pomodoroModoAviso)) {
                config.pomodoroModoAviso = padraoPerfil.pomodoroModoAviso || 'completo';
                precisaSalvar = true;
            }
            const estilosMinipopupValidos = VALORES_ENUM_CONFIGURACAO.pomodoroEstiloMinipopup;
            if (typeof config.pomodoroEstiloMinipopup !== 'string' || !estilosMinipopupValidos.includes(config.pomodoroEstiloMinipopup)) {
                config.pomodoroEstiloMinipopup = padraoPerfil.pomodoroEstiloMinipopup || 'compacto';
                precisaSalvar = true;
            }

            /* Normalizar demais booleanos e seletores simples a partir do perfil ativo de perfis.json */
            const chavesPadraoKeys = Object.keys(padraoPerfil);
            for (let i = 0; i < chavesPadraoKeys.length; i++) {
                const k = chavesPadraoKeys[i];
                if (config[k] === undefined) {
                    config[k] = clonarValorSimples(padraoPerfil[k]);
                    precisaSalvar = true;
                }
            }

            config.colagemBotaoDireitoAtiva = false;
            config.descarteGuiasInativasAtivo = false;
            config.abaEmPrimeiroPlano = Boolean(config.abaEmPrimeiroPlano);
            config.abaEmSegundoPlano = !config.abaEmPrimeiroPlano;
            if (!config.monitorarUrlOriginalAbertura && !config.monitorarUrlAtualPagina) {
                config.monitorarUrlAtualPagina = true;
                precisaSalvar = true;
            }
            const criteriosValidos = ['nenhum', 'hierarquia_arvore', 'url', 'dominio', 'dominio_titulo', 'dominio_criacao', 'dominio_acesso', 'titulo', 'tempo_acesso', 'ordem_criacao', 'agrupar_dominio'];
            if (!criteriosValidos.includes(config.criterioOrdenacaoGuias)) {
                config.criterioOrdenacaoGuias = padraoPerfil.criterioOrdenacaoGuias;
                precisaSalvar = true;
            }
            if (!['esq_dir', 'dir_esq'].includes(config.sentidoOrdenacaoGuias)) {
                config.sentidoOrdenacaoGuias = padraoPerfil.sentidoOrdenacaoGuias;
                precisaSalvar = true;
            }
            if (!['manter', 'recarregar', 'recarregar_se_modificada', 'recarregar_se_nao_modificada'].includes(config.reutilizarAbasAcaoConteudo)) {
                config.reutilizarAbasAcaoConteudo = padraoPerfil.reutilizarAbasAcaoConteudo;
                precisaSalvar = true;
            }

            if (!Array.isArray(config.regrasMapeamentoElementos)) {
                let padraoUsuario = [];
                try {
                    if (typeof fetch === 'function' && apiChrome && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                        const respInt = await fetch(apiChrome.runtime.getURL('src/cfg/interface.json'));
                        const dadosInt = await lerJsonDeResposta(respInt);
                        if (Array.isArray(dadosInt)) {
                            padraoUsuario = dadosInt
                                .filter(r => r && r.origem === 'usuario')
                                .map(({ origem, ...resto }) => ({ ...resto }));
                        }
                    }
                } catch (_) { }
                config.regrasMapeamentoElementos = padraoUsuario;
                precisaSalvar = true;
            }

            /* Passo 4.2.0: Manter snapshot de sobrescritas do perfil ativo sempre sincronizado caso uma chave tenha sido alterada (ex: Popup ou Esc+Esc) */
            const diffAtivoCalculado = this.calcularSobrescritasPerfil(config, perfilAtivoId, cat);
            if (!valoresIguaisConfig(config[chaveCfgAtivo], diffAtivoCalculado)) {
                config[chaveCfgAtivo] = diffAtivoCalculado;
                alteracoesPerfis[chaveCfgAtivo] = diffAtivoCalculado;
                precisaSalvar = true;
            }

            const mesmoPerfilTop = (!perfilTopSync || perfilTopSync === perfilAtivoId);
            if (precisaSalvar && !temPendenteLocal) {
                const payloadSalvar = {
                    regrasMapeamentoElementos: config.regrasMapeamentoElementos,
                    [CHAVE_LISTA_PERFIS]: listaPerfis,
                    ...alteracoesPerfis
                };
                if (mesmoPerfilTop) {
                    Object.assign(payloadSalvar, this.extrairConfigPerfilDeObjeto(config, cat));
                    payloadSalvar[CHAVE_SYNC_PERFIL_BASE_TOP] = perfilAtivoId;
                }
                await apiChrome.storage.sync.set(payloadSalvar);
            }

            /* Passo 4.2.1: Limpar variaveis estatisticas, perfilAtivoId legado e chaves redundantes do storage.sync */
            if (apiChrome.storage.sync.remove && (
                syncBruto[CHAVE_PERFIL_ATIVO] !== undefined ||
                config.totalCopias !== undefined ||
                config.totalAlertas !== undefined ||
                config.flashBorderAtivo !== undefined
            )) {
                apiChrome.storage.sync.remove([CHAVE_PERFIL_ATIVO, 'totalCopias', 'totalAlertas', 'flashBorderAtivo']).catch(() => { });
            }

            /* Passo 4.3: Espelhar configuracao no chrome.storage.session (RAM rapida) e sincronizar Fachada POO do Navegador */
            if (apiChrome.storage.session) {
                await apiChrome.storage.session.set({ cacheConfigJusGov: config }).catch(() => { });
            }
            if (navegadorUtil && typeof navegadorUtil.atualizarConfiguracoes === 'function') {
                try {
                    navegadorUtil.atualizarConfiguracoes(config);
                } catch (_) { }
            }

            /* Passo 4.4: Enfileirar atualizacao dos Content Scripts e notificar/injetar nas abas */
            if (injecaoUtil) {
                if (typeof injecaoUtil.enfileirarRegistro === 'function') {
                    await injecaoUtil.enfileirarRegistro(
                        config.urlsTurbo,
                        config.urlsAmpuletas,
                        config.modoTurbo,
                        config.ativoAmpuletas,
                        apiChrome,
                        urlsUtil
                    );
                }
                if (typeof injecaoUtil.injetarRetroativamenteNasAbasAbertas === 'function') {
                    await injecaoUtil.injetarRetroativamenteNasAbasAbertas(config, apiChrome, urlsUtil);
                }
            }

            /* Passo 4.5: Atualizar dinamicamente o icone e o popup da extensao na barra de ferramentas */
            if (typeof self !== 'undefined') {
                self.__JUSGOV_MODO_TURBO_ATUAL__ = config.modoTurbo;
                self.__JUSGOV_COMPORTAMENTO_ICONE_ATUAL__ = config.comportamentoCliqueIcone;
            }
            this.sincronizarComportamentoIcone(config.comportamentoCliqueIcone, apiChrome);
            this.desenharIconeVetorialFallback(config.modoTurbo, config.comportamentoCliqueIcone, apiChrome);

            return config;
        }

        /*
         * FUNCAO / MÉTODO: sincronizarComportamentoIcone
         * OBJETIVO DE RECONSTRUCAO: Sincronizar o comportamento dinamico do botao de acao
         * da extensao no Google Chrome (Manifest V3):
         * - "acoes_rapidas": Remove o popup nativo (setPopup = ""), permitindo que
         *   1 clique alterne o modo (Global -> Lista -> Desligado) e 2 cliques abram Opcoes.
         * - "popup" (padrao): Restaura "popup.html" como popup nativo, abrindo o painel com 1 clique.
         */
        sincronizarComportamentoIcone(comportamento, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.action || !apiChrome.action.setPopup) return;
            try {
                if (comportamento === 'acoes_rapidas') {
                    apiChrome.action.setPopup({ popup: '' });
                } else {
                    apiChrome.action.setPopup({ popup: 'src/cfg/popup.html' });
                }
            } catch (_) { }
        }

        /*
         * FUNCAO / MÉTODO: desenharIconeVetorialFallback
         * OBJETIVO DE RECONSTRUCAO: Desenhar o icone vetorial com as faixas documentais
         * e o raio amarelo ("raiozinho") em OffscreenCanvas conforme a paleta de modos:
         * - Modo Global (Ativo Global): Fundo Verde Esmeralda (#10b981), Borda #059669, Raio Amarelo (#fef08a).
         * - Modo Lista (Ativo Lista): Fundo Azul Real (#1a73e8), Borda #1557b0, Raio Amarelo (#fbbc04).
         * - Modo Desligado (Pausado): Fundo Cinza (#64748b), Borda #475569, Raio Cinza Claro (#cbd5e1).
         */
        desenharIconeVetorialFallback(modoAtivo, comportamento, chromeApi = null, badgePomodoro = undefined) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (typeof OffscreenCanvas === 'undefined' || !apiChrome || !apiChrome.action || !apiChrome.action.setIcon) {
                return false;
            }

            try {
                const badgeAtivo = (badgePomodoro === undefined && typeof self !== 'undefined')
                    ? (self.__JUSGOV_ULTIMO_BADGE_POMODORO__ || null)
                    : badgePomodoro;
                const rs = (typeof JusGovCfgDefaults !== 'undefined' && typeof JusGovCfgDefaults.obterRegrasSistema === 'function')
                    ? JusGovCfgDefaults.obterRegrasSistema()
                    : (typeof self !== 'undefined' ? self.__JUSGOV_REGRAS_SISTEMA_JSON__ : null);
                const paletas = (rs && rs.iconeExtensaoPaletas) ? rs.iconeExtensaoPaletas : null;
                const chavePaleta = (modoAtivo === 'url') ? 'url' : (modoAtivo === 'desligado' ? 'desligado' : 'global');
                const paleta = (paletas && paletas[chavePaleta]) ? paletas[chavePaleta] : null;

                let corFundo = (paleta && paleta.gradTop) || '#10b981';
                let corBorda = (paleta && paleta.borda) || '#059669';
                let corRaio = (paleta && paleta.raio) || '#fef08a';
                let tituloModo = 'Ativo (Global)';

                if (modoAtivo === 'url') {
                    if (!paleta) { corFundo = '#1a73e8'; corBorda = '#1557b0'; corRaio = '#fbbc04'; }
                    tituloModo = 'Ativo (Lista)';
                } else if (modoAtivo === 'desligado') {
                    if (!paleta) { corFundo = '#64748b'; corBorda = '#475569'; corRaio = '#cbd5e1'; }
                    tituloModo = 'Pausado';
                }

                if (apiChrome.action.setTitle && !(typeof self !== 'undefined' && self.JusGovModuloProdutividade)) {
                    const subtituloAcao = (comportamento === 'acoes_rapidas')
                        ? '\n(1 clique: alternar modo | 2 cliques: abrir Opcoes)'
                        : '\n(1 clique: abrir popup)';
                    apiChrome.action.setTitle({
                        title: 'Selecao/Copia Aprimorada - ' + tituloModo + subtituloAcao
                    }).catch(() => { });
                }

                const tamanhos = [16, 24, 32, 48, 128];
                const imageDataMap = {};

                for (let i = 0; i < tamanhos.length; i++) {
                    const dim = tamanhos[i];
                    const canvas = new OffscreenCanvas(dim, dim);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;

                    const escala = dim / 128;
                    const txtBrutoPre = (badgeAtivo && badgeAtivo.texto) ? String(badgeAtivo.texto).trim() : '';
                    const matchMinPre = txtBrutoPre.match(/^(!?)(\d+)\s*m$/i);
                    const txtBadge = txtBrutoPre
                        ? (matchMinPre
                            ? (Number(matchMinPre[2]) <= 9 ? `${matchMinPre[1]}${Number(matchMinPre[2])}m` : `${matchMinPre[1]}${Number(matchMinPre[2])}`)
                            : txtBrutoPre)
                        : '';
                    const temBadgeTexto = Boolean(txtBadge);

                    /* Passo 5.2: Fundo arredondado; quando ha numero em badge, eleva a caixa para que o numeral fique ressaltado abaixo da borda inferior */
                    const yBoxBase = temBadgeTexto ? 2 : 6;
                    const hBoxBase = temBadgeTexto ? 110 : 116;
                    const escalaVert = hBoxBase / 116;
                    const mapY = (yOrig) => (yBoxBase + (yOrig - 6) * escalaVert) * escala;

                    ctx.fillStyle = corFundo;
                    ctx.beginPath();
                    ctx.roundRect(6 * escala, yBoxBase * escala, 116 * escala, hBoxBase * escala, (temBadgeTexto ? 24 : 26) * escala);
                    ctx.fill();

                    ctx.strokeStyle = corBorda;
                    ctx.lineWidth = Math.max(1, 4 * escala);
                    ctx.stroke();

                    /* Passo 5.3: Faixas documentais semi-transparentes */
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.roundRect(24 * escala, mapY(34), 46 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.roundRect(24 * escala, mapY(54), 34 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.roundRect(24 * escala, mapY(74), 40 * escala, 10 * escalaVert * escala, 3 * escala);
                    ctx.fill();

                    /* Passo 5.4: Desenho do Raiozinho Original (points: 78,20 44,68 68,68 54,108 100,56 74,56) */
                    ctx.fillStyle = corRaio;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = Math.max(1, 3 * escala);
                    ctx.lineJoin = 'round';

                    ctx.beginPath();
                    ctx.moveTo(78 * escala, mapY(20));
                    ctx.lineTo(44 * escala, mapY(68));
                    ctx.lineTo(68 * escala, mapY(68));
                    ctx.lineTo(54 * escala, mapY(108));
                    ctx.lineTo(100 * escala, mapY(56));
                    ctx.lineTo(74 * escala, mapY(56));
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    /* Passo 5.5 (FEAT-67 / BUG-93): Apenas texto em negrito encostado exatamente na borda inferior maxima do canvas (efeito ressaltado) */
                    if (temBadgeTexto) {
                        const txt = txtBadge;
                        ctx.save();
                        const maxLarguraTxt = Math.max(10, dim - Math.max(1, Math.round(dim * 0.04)));
                        const famFonte = '"Segoe UI", "Roboto", Arial, sans-serif';
                        let tamFonte = (txt.length <= 2)
                            ? Math.max(10, Math.round(dim * 0.65))
                            : Math.max(8, Math.round(dim * 0.50));
                        const tamMin = Math.max(7, Math.round(dim * 0.40));

                        const temM = /^!?\d+m$/i.test(txt);
                        const numParte = temM ? txt.slice(0, -1) : txt;
                        const medirLargura = (tBase) => {
                            if (!temM) {
                                ctx.font = `800 ${tBase}px ${famFonte}`;
                                return ctx.measureText(txt).width;
                            }
                            ctx.font = `800 ${tBase}px ${famFonte}`;
                            const wN = ctx.measureText(numParte).width;
                            const tM = Math.max(6, Math.round(tBase * 0.64));
                            ctx.font = `400 ${tM}px ${famFonte}`;
                            return wN + ctx.measureText('m').width;
                        };

                        while (tamFonte > tamMin && medirLargura(tamFonte) > maxLarguraTxt) {
                            tamFonte -= 1;
                        }

                        let corNumero = '#ffffff';
                        const corBadge = String(badgeAtivo.cor || '').toLowerCase();
                        if (corBadge === '#eab308' || corBadge === '#facc15') corNumero = '#fde047';
                        else if (corBadge === '#dc2626') corNumero = '#fca5a5';
                        else if (corBadge === '#0284c7') corNumero = '#7dd3fc';
                        else if (corBadge === '#16a34a') corNumero = '#86efac';

                        ctx.textBaseline = 'alphabetic';
                        ctx.font = `800 ${tamFonte}px ${famFonte}`;
                        const metricaRef = ctx.measureText(temM ? numParte : txt);
                        const descentReal = (metricaRef && typeof metricaRef.actualBoundingBoxDescent === 'number' && Number.isFinite(metricaRef.actualBoundingBoxDescent))
                            ? Math.max(0, metricaRef.actualBoundingBoxDescent)
                            : 0;
                        const xCentro = dim / 2;
                        const yBase = dim - descentReal;

                        ctx.lineJoin = 'round';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.strokeStyle = 'rgba(15, 23, 42, 0.78)';
                        ctx.lineWidth = Math.max(1.1, dim * 0.08);
                        ctx.fillStyle = corNumero;

                        if (temM) {
                            ctx.textAlign = 'left';
                            const wN = metricaRef.width;
                            const tamM = Math.max(6, Math.round(tamFonte * 0.64));
                            ctx.font = `400 ${tamM}px ${famFonte}`;
                            const wM = ctx.measureText('m').width;
                            const xIni = Math.max(0, (dim - (wN + wM)) / 2);

                            ctx.font = `800 ${tamFonte}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(2, dim * 0.14);
                            ctx.strokeText(numParte, xIni, yBase);
                            ctx.shadowBlur = Math.max(1, dim * 0.07);
                            ctx.fillText(numParte, xIni, yBase);

                            ctx.font = `400 ${tamM}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(1.5, dim * 0.12);
                            ctx.strokeText('m', xIni + wN, yBase);
                            ctx.shadowBlur = Math.max(1, dim * 0.06);
                            ctx.fillText('m', xIni + wN, yBase);
                        } else {
                            ctx.textAlign = 'center';
                            ctx.font = `800 ${tamFonte}px ${famFonte}`;
                            ctx.shadowBlur = Math.max(2, dim * 0.14);
                            ctx.strokeText(txt, xCentro, yBase);

                            ctx.shadowBlur = Math.max(1, dim * 0.07);
                            ctx.fillText(txt, xCentro, yBase);
                        }
                        ctx.restore();
                    }

                    imageDataMap[dim] = ctx.getImageData(0, 0, dim, dim);
                }

                apiChrome.action.setIcon({ imageData: imageDataMap }).catch(() => { });
                return true;
            } catch (_) {
                return false;
            }
        }

        obterChavesConfigSync() {
            return CHAVES_CONFIGURACAO_SINCRONIZAVEL;
        }

        houveMudancaDeConfiguracao(changes) {
            if (!changes || typeof changes !== 'object') return false;
            return CHAVES_CONFIGURACAO_SINCRONIZAVEL.some((chave) => Object.prototype.hasOwnProperty.call(changes, chave));
        }

        async sincronizarMenusContexto(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.contextMenus || !apiChrome.storage || !apiChrome.storage.sync) return;
            try {
                const config = await apiChrome.storage.sync.get(['comportamentoCliqueIcone']);
                const isAcoesRapidas = config && config.comportamentoCliqueIcone === 'acoes_rapidas';
                apiChrome.contextMenus.removeAll(() => {
                    apiChrome.contextMenus.create({ id: 'toggle-comportamento-icone', type: 'checkbox', title: 'Ações Rápidas no Ícone', checked: Boolean(isAcoesRapidas), contexts: ['action'] }, () => { });
                    apiChrome.contextMenus.create({ id: 'configurar-extensao', title: 'Configurar Extensão', contexts: ['action'] }, () => { });
                    apiChrome.contextMenus.create({ id: 'abrir-painel-extensao', title: 'Desenvolvimento (Página do Plugin)', contexts: ['action'] }, () => { });
                });
            } catch (_) { }
        }

        tratarCliqueIconeExtensao(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome) return;
            if (this._timerCliqueIcone !== undefined && this._timerCliqueIcone !== null) {
                clearTimeout(this._timerCliqueIcone);
                this._timerCliqueIcone = null;
                if (apiChrome.runtime && typeof apiChrome.runtime.openOptionsPage === 'function') {
                    apiChrome.runtime.openOptionsPage();
                }
                return;
            }
            this._timerCliqueIcone = setTimeout(async () => {
                this._timerCliqueIcone = null;
                try {
                    const atual = await apiChrome.storage.sync.get(['modoTurbo']);
                    const modoAtual = (atual && atual.modoTurbo) || 'global';
                    const proximoModo = modoAtual === 'global'
                        ? 'url'
                        : (modoAtual === 'url' ? 'desligado' : 'global');
                    await apiChrome.storage.sync.set({ modoTurbo: proximoModo });
                    this.desenharIconeVetorialFallback(proximoModo, 'acoes_rapidas', apiChrome);
                } catch (_) { }
            }, JANELA_DUPLO_CLIQUE_ICONE_MS);
        }

        /* Aplica alteracoes imediatamente no runtime local + storage.local sem disparar gravacao imediata em storage.sync */
        async aplicarConfigLocalEAgendarSync(payload = {}, chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.local) return { ok: false };
            try {
                const loc = await apiChrome.storage.local.get([CHAVE_CONFIG_SYNC_PENDENTE]);
                const atualPend = (loc && loc[CHAVE_CONFIG_SYNC_PENDENTE] && typeof loc[CHAVE_CONFIG_SYNC_PENDENTE] === 'object')
                    ? { ...loc[CHAVE_CONFIG_SYNC_PENDENTE] } : {};
                if (payload && typeof payload === 'object') {
                    const ks = Object.keys(payload);
                    for (let i = 0; i < ks.length; i++) {
                        const k = ks[i];
                        if (SET_CHAVES_SYNC.has(k) || k.startsWith(PREFIXO_CHAVE_PERFIL_CFG)) {
                            atualPend[k] = clonarValorSimples(payload[k]);
                        }
                    }
                }
                /* BUG-81: Atualizar cacheConfigJusGov na RAM (storage.session) ANTES de gravar storage.local,
                 * para que listeners de storage.onChanged (background, popup, options) ja enxerguem o novo estado ao vivo! */
                if (apiChrome.storage.session) {
                    try {
                        const sess = await apiChrome.storage.session.get('cacheConfigJusGov');
                        if (sess && sess.cacheConfigJusGov && typeof sess.cacheConfigJusGov === 'object' && typeof sess.cacheConfigJusGov.modoTurbo === 'string') {
                            const baseSess = { ...sess.cacheConfigJusGov, ...atualPend };
                            await apiChrome.storage.session.set({ cacheConfigJusGov: baseSess });
                        }
                    } catch (_) { }
                }
                await apiChrome.storage.local.set({ [CHAVE_CONFIG_SYNC_PENDENTE]: atualPend });
                const cfgSincronizada = await this.sincronizarEstado(apiChrome, dependencias);
                return { ok: true, config: cfgSincronizada };
            } catch (_) {
                return { ok: false };
            }
        }

        /* Sincronizacao coalescida para chrome.storage.sync (disparada por alarme de 5 min ou ao fechar o navegador):
         * compara diferencas reais com a nuvem e grava em lote unico apenas chaves permitidas <= 8KB. */
        async executarSincronizacaoNuvemCoalescida(chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage) return false;
            try {
                if (apiChrome.storage.local && apiChrome.storage.sync) {
                    const [dadosLocais, dadosSyncAtuais] = await Promise.all([
                        apiChrome.storage.local.get(null),
                        apiChrome.storage.sync.get(null)
                    ]);
                    if (dadosLocais && typeof dadosLocais === 'object') {
                        const origemCombinada = { ...dadosLocais };
                        const pendenteObj = dadosLocais[CHAVE_CONFIG_SYNC_PENDENTE];
                        if (pendenteObj && typeof pendenteObj === 'object') {
                            Object.assign(origemCombinada, pendenteObj);
                        }
                        const payloadSync = {};
                        const chaves = Object.keys(origemCombinada);
                        for (let i = 0; i < chaves.length; i++) {
                            const k = chaves[i];
                            const ehChavePermitida = SET_CHAVES_SYNC.has(k) || k.startsWith(PREFIXO_CHAVE_PERFIL_CFG);
                            if (!ehChavePermitida) continue;
                            if (dadosSyncAtuais && valoresIguaisConfig(dadosSyncAtuais[k], origemCombinada[k])) continue;
                            try {
                                const bytes = JSON.stringify({ [k]: origemCombinada[k] }).length;
                                if (bytes <= LIMITE_BYTES_ITEM_SYNC) {
                                    payloadSync[k] = origemCombinada[k];
                                }
                            } catch (_) { }
                        }
                        if (Object.keys(payloadSync).length > 0) {
                            const ativoLocal = typeof dadosLocais[CHAVE_PERFIL_ATIVO] === 'string' ? dadosLocais[CHAVE_PERFIL_ATIVO].trim() : '';
                            if (ativoLocal && Object.keys(payloadSync).some(k => !k.startsWith(PREFIXO_CHAVE_PERFIL_CFG) && k !== CHAVE_LISTA_PERFIS && k !== 'regrasMapeamentoElementos')) {
                                payloadSync[CHAVE_SYNC_PERFIL_BASE_TOP] = ativoLocal;
                            }
                            await apiChrome.storage.sync.set(payloadSync);
                        }
                        if (pendenteObj && typeof apiChrome.storage.local.remove === 'function') {
                            await apiChrome.storage.local.remove([CHAVE_CONFIG_SYNC_PENDENTE]);
                        }
                    }
                }
                await this.sincronizarEstado(apiChrome, dependencias);
                return true;
            } catch (_) {
                return false;
            }
        }

        /* Roteador unificado das requisicoes IPC de Perfis de Uso (FEATS-34/35). */
        async gerenciarRequisicaoPerfil(msg, chromeApi = null, dependencias = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!msg || typeof msg.acao !== 'string') return { ok: false };
            try {
                if (msg.acao === 'OBTER_PERFIS') {
                    const catalogo = await this.carregarCatalogoPerfis(apiChrome);
                    const syncData = (await apiChrome.storage.sync.get(['listaPerfis', 'perfilAtivoId'])) || {};
                    const ativoLocal = await this.obterPerfilAtivoLocal(apiChrome, syncData);
                    if (ativoLocal) syncData[CHAVE_PERFIL_ATIVO] = ativoLocal;
                    const estrutura = this.garantirEstruturaPerfis(syncData, catalogo);
                    if (!ativoLocal || ativoLocal !== estrutura.perfilAtivoId) {
                        await this.salvarPerfilAtivoLocal(estrutura.perfilAtivoId, apiChrome);
                    }
                    if (estrutura.alteracoes && Object.keys(estrutura.alteracoes).length > 0) {
                        await apiChrome.storage.sync.set(estrutura.alteracoes);
                    }
                    return { ok: true, listaPerfis: estrutura.listaPerfis, perfilAtivoId: estrutura.perfilAtivoId };
                }
                if (msg.acao === 'ALTERNAR_PERFIL') {
                    const res = await this.alternarPerfil(msg.perfilId, apiChrome);
                    let miniTipExibidoNaAba = false;
                    if (res && res.ok) {
                        await this.sincronizarEstado(apiChrome, dependencias);
                        const nomePerfil = (res.perfil && res.perfil.nome) ? res.perfil.nome : res.perfilAtivoId;
                        try {
                            if (apiChrome && apiChrome.runtime && typeof apiChrome.runtime.sendMessage === 'function') {
                                apiChrome.runtime.sendMessage({ acao: 'PERFIL_ALTERADO', perfilId: res.perfilAtivoId, nomePerfil }).catch(() => { });
                            }
                        } catch (_) { }
                        if (msg.exibirMiniTip !== false && apiChrome && apiChrome.tabs && typeof apiChrome.tabs.query === 'function') {
                            try {
                                const abas = await apiChrome.tabs.query({ active: true, lastFocusedWindow: true });
                                const abaAtiva = Array.isArray(abas) ? abas[0] : null;
                                if (abaAtiva && abaAtiva.id) {
                                    await apiChrome.tabs.sendMessage(abaAtiva.id, {
                                        acao: 'exibirMiniTipGlobal',
                                        mensagem: `Perfil de Uso:\n${nomePerfil}`,
                                        corBorda: '#2563eb'
                                    }, { frameId: 0 });
                                    miniTipExibidoNaAba = true;
                                }
                            } catch (_) { }
                        }
                    }
                    return res ? { ...res, miniTipExibidoNaAba } : { ok: false };
                }
                if (msg.acao === 'CRIAR_PERFIL') {
                    const res = await this.criarPerfil(msg.nome, { origem: msg.origem || 'padrao', ativar: msg.ativar !== false }, apiChrome);
                    if (res && res.ok) await this.sincronizarEstado(apiChrome, dependencias);
                    return res || { ok: false };
                }
                if (msg.acao === 'RENOMEAR_PERFIL') {
                    return (await this.renomearPerfil(msg.perfilId, msg.novoNome, apiChrome)) || { ok: false };
                }
                if (msg.acao === 'EXCLUIR_PERFIL') {
                    return (await this.excluirPerfil(msg.perfilId, apiChrome)) || { ok: false };
                }
                if (msg.acao === 'RESETAR_PERFIS') {
                    const res = await this.resetarPerfis(msg.escopo || 'atual', apiChrome, { perfilPreferidoId: msg.perfilPreferidoId });
                    if (res && res.ok) await this.sincronizarEstado(apiChrome, dependencias);
                    return res || { ok: false };
                }
            } catch (err) {
                return { ok: false, erro: err ? err.message : 'Erro ao processar perfil.' };
            }
            return { ok: false };
        }
    }

    Object.freeze(JusGovConfiguracoes.prototype);
    return Object.freeze(JusGovConfiguracoes);
}));

