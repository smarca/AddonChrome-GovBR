/* ==========================================================================
 * Nome do arquivo: lib-config.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca de Configurações, Estado e Ícones Vetoriais
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config.js
 * - Classe Exportada: JusGovConfiguracoes (self.JusGovConfiguracoes / window.JusGovConfiguracoes)
 * - Métodos Públicos: obterConfiguracoesGerais, sincronizarEstado, sincronizarComportamentoIcone, desenharIconeVetorialFallback
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seções 1, 4, 5 (BP-06 / ARQ-01)
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

    function obterDefaultsModulo() {
        if (typeof self !== 'undefined' && self.JusGovCfgDefaults) return self.JusGovCfgDefaults;
        if (typeof window !== 'undefined' && window.JusGovCfgDefaults) return window.JusGovCfgDefaults;
        if (typeof globalThis !== 'undefined' && globalThis.JusGovCfgDefaults) return globalThis.JusGovCfgDefaults;
        if (typeof require === 'function') {
            try { return require('../cfg/cfg-defaults.js'); } catch (_) { }
        }
        return null;
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
                    if (resp && resp.ok) return await resp.json();
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
                    { id: 'estudo', nome: 'Estudo', aliases: ['estudar'], predefinido: true, sobrescritas: {} }
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

        garantirEstruturaPerfis(syncData = {}, catalogo = null) {
            const cat = catalogo || {};
            const predefs = Array.isArray(cat.perfisPredefinidos) && cat.perfisPredefinidos.length > 0
                ? cat.perfisPredefinidos
                : [
                    { id: 'padrao', nome: 'Padrão', predefinido: true },
                    { id: 'trabalho', nome: 'Trabalho', predefinido: true },
                    { id: 'casa', nome: 'Casa', predefinido: true },
                    { id: 'estudo', nome: 'Estudo', aliases: ['estudar'], predefinido: true }
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

            const alteracoes = {};
            if (!tinhaListaAnterior || JSON.stringify(syncData[CHAVE_LISTA_PERFIS]) !== JSON.stringify(listaFinal)) {
                alteracoes[CHAVE_LISTA_PERFIS] = listaFinal;
            }
            if (syncData[CHAVE_PERFIL_ATIVO] !== perfilAtivoId) {
                alteracoes[CHAVE_PERFIL_ATIVO] = perfilAtivoId;
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
                [CHAVE_PERFIL_ATIVO]: destino.id
            };

            /* Passo P.1: Persistir snapshot das preferencias atuais no perfil que estava ativo */
            const chaveAtual = this.chaveConfigPerfil(perfilAtivoId);
            atualizacao[chaveAtual] = this.calcularSobrescritasPerfil(syncData, perfilAtivoId, cat);

            /* Passo P.2: Carregar configuracoes efetivas do perfil destino (sem alterar regrasMapeamentoElementos globais) */
            const chaveDestino = this.chaveConfigPerfil(destino.id);
            const sobrescritasDestino = (destino.id === perfilAtivoId)
                ? atualizacao[chaveAtual]
                : ((syncData[chaveDestino] && typeof syncData[chaveDestino] === 'object') ? syncData[chaveDestino] : {});
            atualizacao[chaveDestino] = sobrescritasDestino;

            const configDestino = this.resolverConfigEfetivaPerfil(destino.id, sobrescritasDestino, cat);
            Object.assign(atualizacao, configDestino);

            await apiChrome.storage.sync.set(atualizacao);
            return { ok: true, perfilAtivoId: destino.id, perfil: destino, listaPerfis, config: configDestino };
        }

        async criarPerfil(nomeBruto, opcoes = {}, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const nome = String(nomeBruto || '').trim().slice(0, 40);
            if (!nome) return { ok: false, motivo: 'nome_invalido' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
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
                [CHAVE_PERFIL_ATIVO]: novoId,
                [chaveAtual]: snapshotAtual,
                [this.chaveConfigPerfil(novoId)]: sobrescritasNovo,
                ...configNovo
            };

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
                await apiChrome.storage.sync.set({
                    [CHAVE_LISTA_PERFIS]: novaLista,
                    [CHAVE_PERFIL_ATIVO]: perfilPadraoId,
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

        async resetarPerfis(escopo = 'atual', chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncData = await apiChrome.storage.sync.get(null);
            const { listaPerfis, perfilAtivoId } = this.garantirEstruturaPerfis(syncData, cat);

            if (escopo === 'todos') {
                const listaPredef = (Array.isArray(cat.perfisPredefinidos) ? cat.perfisPredefinidos : []).map(p => ({
                    id: p.id,
                    nome: String(p.nome || p.id),
                    predefinido: true
                }));
                const novoAtivo = listaPredef.some(p => p.id === perfilAtivoId) ? perfilAtivoId : String(cat.perfilPadraoId || 'padrao');
                const configAplicada = this.resolverConfigEfetivaPerfil(novoAtivo, {}, cat);

                let regrasPadraoUsuario = [];
                try {
                    if (typeof fetch === 'function' && apiChrome.runtime && typeof apiChrome.runtime.getURL === 'function') {
                        const respInt = await fetch(apiChrome.runtime.getURL('src/cfg/interface.json'));
                        if (respInt && respInt.ok) {
                            const dadosInt = await respInt.json();
                            if (Array.isArray(dadosInt)) {
                                regrasPadraoUsuario = dadosInt
                                    .filter(r => r && r.origem === 'usuario')
                                    .map(({ origem, ...resto }) => ({ ...resto }));
                            }
                        }
                    }
                } catch (_) { }

                const novoSync = {
                    [CHAVE_LISTA_PERFIS]: listaPredef,
                    [CHAVE_PERFIL_ATIVO]: novoAtivo,
                    regrasMapeamentoElementos: regrasPadraoUsuario,
                    ...configAplicada
                };
                for (let i = 0; i < listaPredef.length; i++) {
                    novoSync[this.chaveConfigPerfil(listaPredef[i].id)] = {};
                }

                const chavesValidas = new Set(Object.keys(novoSync));
                const chavesOrfas = Object.keys(syncData || {}).filter(k => !chavesValidas.has(k));

                await apiChrome.storage.sync.set(novoSync);
                if (chavesOrfas.length > 0 && typeof apiChrome.storage.sync.remove === 'function') {
                    await apiChrome.storage.sync.remove(chavesOrfas);
                }

                if (apiChrome.storage.local) {
                    try {
                        const agora = new Date();
                        const pad = (n) => String(n).padStart(2, '0');
                        const strData = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
                        await apiChrome.storage.local.clear();
                        await apiChrome.storage.local.set({ totalCopias: 0, totalAlertas: 0, dataInicioContadores: strData });
                    } catch (_) { }
                }
                if (apiChrome.storage.session) {
                    apiChrome.storage.session.clear().catch(() => { });
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
            await apiChrome.storage.sync.set({
                [CHAVE_LISTA_PERFIS]: listaPerfis,
                [CHAVE_PERFIL_ATIVO]: perfilAtivoId,
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

        async importarBackupTotal(json = {}, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.sync) return { ok: false, motivo: 'storage_indisponivel' };
            if (!json || typeof json !== 'object' || Array.isArray(json)) return { ok: false, motivo: 'json_invalido' };

            const cat = await this.carregarCatalogoPerfis(apiChrome);
            const syncAtual = await apiChrome.storage.sync.get(null);
            const { listaPerfis: listaAtual, perfilAtivoId: ativoAtual } = this.garantirEstruturaPerfis(syncAtual, cat);

            if (json.perfis && typeof json.perfis === 'object' && !Array.isArray(json.perfis)) {
                const predefs = (cat && Array.isArray(cat.perfisPredefinidos)) ? cat.perfisPredefinidos : [];
                const listaImportadaBruta = Array.isArray(json.listaPerfis) ? json.listaPerfis : [];
                const idsPredef = new Set(predefs.map(p => p.id));
                const novaLista = predefs.map(p => ({ id: p.id, nome: String(p.nome || p.id), predefinido: true }));
                const idsAdicionados = new Set(novaLista.map(p => p.id));

                for (let i = 0; i < listaImportadaBruta.length; i++) {
                    const item = listaImportadaBruta[i];
                    if (item && typeof item.id === 'string' && item.id.trim() && !idsAdicionados.has(item.id.trim()) && !idsPredef.has(item.id.trim())) {
                        novaLista.push({
                            id: item.id.trim(),
                            nome: String(item.nome || item.id).trim().slice(0, 40),
                            predefinido: false
                        });
                        idsAdicionados.add(item.id.trim());
                    }
                }
                Object.keys(json.perfis).forEach((pid) => {
                    if (pid && !idsAdicionados.has(pid)) {
                        novaLista.push({ id: pid, nome: pid, predefinido: idsPredef.has(pid) });
                        idsAdicionados.add(pid);
                    }
                });

                const novoAtivo = (typeof json.perfilAtivoId === 'string' && novaLista.some(p => p.id === json.perfilAtivoId))
                    ? json.perfilAtivoId
                    : String((cat && cat.perfilPadraoId) || 'padrao');

                const gravacao = {
                    [CHAVE_LISTA_PERFIS]: novaLista,
                    [CHAVE_PERFIL_ATIVO]: novoAtivo
                };

                for (let i = 0; i < novaLista.length; i++) {
                    const p = novaLista[i];
                    const cfgImportada = (json.perfis[p.id] && typeof json.perfis[p.id] === 'object') ? json.perfis[p.id] : {};
                    const extraida = this.extrairConfigPerfilDeObjeto(cfgImportada, cat);
                    const resolvida = this.resolverConfigEfetivaPerfil(p.id, extraida, cat);
                    gravacao[this.chaveConfigPerfil(p.id)] = this.calcularSobrescritasPerfil(resolvida, p.id, cat);
                    if (p.id === novoAtivo) {
                        Object.assign(gravacao, resolvida);
                    }
                }

                if (Array.isArray(json.regrasMapeamentoElementos)) {
                    gravacao.regrasMapeamentoElementos = json.regrasMapeamentoElementos;
                }

                const chavesPerfilEsperadas = new Set(novaLista.map(p => this.chaveConfigPerfil(p.id)));
                const chavesRemover = Object.keys(syncAtual || {}).filter(k =>
                    k.startsWith(PREFIXO_CHAVE_PERFIL_CFG) && !chavesPerfilEsperadas.has(k)
                );

                await apiChrome.storage.sync.set(gravacao);
                if (chavesRemover.length > 0 && typeof apiChrome.storage.sync.remove === 'function') {
                    await apiChrome.storage.sync.remove(chavesRemover);
                }

                return { ok: true, backupTotal: true, perfilAtivoId: novoAtivo, listaPerfis: novaLista };
            }

            /* Retrocompatibilidade v1: importa configuracoes isoladas no perfil ativo atual */
            const extraidaV1 = this.extrairConfigPerfilDeObjeto(json, cat);
            const baseMerged = { ...syncAtual, ...extraidaV1 };
            const resolvidaV1 = this.resolverConfigEfetivaPerfil(ativoAtual, baseMerged, cat);
            const gravacaoV1 = {
                [CHAVE_LISTA_PERFIS]: listaAtual,
                [CHAVE_PERFIL_ATIVO]: ativoAtual,
                [this.chaveConfigPerfil(ativoAtual)]: this.calcularSobrescritasPerfil(resolvidaV1, ativoAtual, cat),
                ...resolvidaV1
            };
            if (Array.isArray(json.regrasMapeamentoElementos)) {
                gravacaoV1.regrasMapeamentoElementos = json.regrasMapeamentoElementos;
            }
            await apiChrome.storage.sync.set(gravacaoV1);
            return { ok: true, backupTotal: false, perfilAtivoId: ativoAtual, listaPerfis: listaAtual };
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
                if (apiChrome.storage.session) {
                    const cached = await apiChrome.storage.session.get('cacheConfigJusGov');
                    if (cached && cached.cacheConfigJusGov) {
                        return cached.cacheConfigJusGov;
                    }
                }
                if (apiChrome.storage.sync) {
                    return await apiChrome.storage.sync.get(null);
                }
                return {};
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

            /* Passo 4.1: Ler todas as chaves de configuracao no chrome.storage.sync */
            const config = await apiChrome.storage.sync.get(null);

            const { listaPerfis, perfilAtivoId, alteracoes: alteracoesPerfis } = this.garantirEstruturaPerfis(config, cat);
            Object.assign(config, alteracoesPerfis);
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
            if (!['total', 'total_exceto_arrasto', 'interface', 'nenhuma'].includes(config.modoRetirarSelecao)) {
                config.modoRetirarSelecao = padraoPerfil.modoRetirarSelecao;
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
            if (typeof config.estiloBadgeMarcadorColado !== 'string' || !['sobrescrito', 'circular', 'sem_etiqueta', 'translucido', 'sobrescrito_retangular', 'retangular_translucido', 'retangular_compacto'].includes(config.estiloBadgeMarcadorColado)) {
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
                        if (respInt && respInt.ok) {
                            const dadosInt = await respInt.json();
                            if (Array.isArray(dadosInt)) {
                                padraoUsuario = dadosInt
                                    .filter(r => r && r.origem === 'usuario')
                                    .map(({ origem, ...resto }) => ({ ...resto }));
                            }
                        }
                    }
                } catch (_) { }
                config.regrasMapeamentoElementos = padraoUsuario;
                precisaSalvar = true;
            }

            /* Passo 4.2.0: Manter snapshot de sobrescritas do perfil ativo sempre sincronizado caso uma chave tenha sido alterada (ex: Popup ou Esc+Esc) */
            const chaveCfgAtivo = this.chaveConfigPerfil(perfilAtivoId);
            const diffAtivoCalculado = this.calcularSobrescritasPerfil(config, perfilAtivoId, cat);
            if (!valoresIguaisConfig(config[chaveCfgAtivo], diffAtivoCalculado)) {
                config[chaveCfgAtivo] = diffAtivoCalculado;
                alteracoesPerfis[chaveCfgAtivo] = diffAtivoCalculado;
                precisaSalvar = true;
            }

            if (precisaSalvar) {
                const payloadSalvar = {
                    ...this.extrairConfigPerfilDeObjeto(config, cat),
                    regrasMapeamentoElementos: config.regrasMapeamentoElementos,
                    [CHAVE_LISTA_PERFIS]: listaPerfis,
                    [CHAVE_PERFIL_ATIVO]: perfilAtivoId,
                    ...alteracoesPerfis
                };
                await apiChrome.storage.sync.set(payloadSalvar);
            }

            /* Passo 4.2.1: Limpar variaveis estatisticas e chaves redundantes do storage.sync para manter a nuvem limpa */
            if (apiChrome.storage.sync.remove) {
                apiChrome.storage.sync.remove(['totalCopias', 'totalAlertas', 'flashBorderAtivo']).catch(() => { });
            }

            /* Passo 4.3: Espelhar configuracao no chrome.storage.session (RAM rapida) e sincronizar Fachada POO do Navegador */
            if (apiChrome.storage.session) {
                apiChrome.storage.session.set({ cacheConfigJusGov: config }).catch(() => { });
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
        desenharIconeVetorialFallback(modoAtivo, comportamento, chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (typeof OffscreenCanvas === 'undefined' || !apiChrome || !apiChrome.action || !apiChrome.action.setIcon) {
                return;
            }

            try {
                let corFundo = '#10b981';
                let corBorda = '#059669';
                let corRaio = '#fef08a';
                let tituloModo = 'Ativo (Global)';

                if (modoAtivo === 'url') {
                    corFundo = '#1a73e8';
                    corBorda = '#1557b0';
                    corRaio = '#fbbc04';
                    tituloModo = 'Ativo (Lista)';
                } else if (modoAtivo === 'desligado') {
                    corFundo = '#64748b';
                    corBorda = '#475569';
                    corRaio = '#cbd5e1';
                    tituloModo = 'Pausado';
                }

                if (apiChrome.action.setTitle) {
                    const subtituloAcao = (comportamento === 'acoes_rapidas')
                        ? '\n(1 clique: alternar modo | 2 cliques: abrir Opcoes)'
                        : '\n(1 clique: abrir popup)';
                    apiChrome.action.setTitle({
                        title: 'Selecao/Copia Aprimorada - ' + tituloModo + subtituloAcao
                    }).catch(() => { });
                }

                const tamanhos = [16, 32, 48, 128];
                const imageDataMap = {};

                for (let i = 0; i < tamanhos.length; i++) {
                    const dim = tamanhos[i];
                    const canvas = new OffscreenCanvas(dim, dim);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;

                    const escala = dim / 128;

                    /* Passo 5.2: Fundo arredondado (rect x=6, y=6, w=116, h=116, rx=26) */
                    ctx.fillStyle = corFundo;
                    ctx.beginPath();
                    ctx.roundRect(6 * escala, 6 * escala, 116 * escala, 116 * escala, 26 * escala);
                    ctx.fill();

                    ctx.strokeStyle = corBorda;
                    ctx.lineWidth = Math.max(1, 4 * escala);
                    ctx.stroke();

                    /* Passo 5.3: Faixas documentais semi-transparentes */
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.roundRect(24 * escala, 34 * escala, 46 * escala, 10 * escala, 3 * escala);
                    ctx.roundRect(24 * escala, 54 * escala, 34 * escala, 10 * escala, 3 * escala);
                    ctx.roundRect(24 * escala, 74 * escala, 40 * escala, 10 * escala, 3 * escala);
                    ctx.fill();

                    /* Passo 5.4: Desenho do Raiozinho Original (points: 78,20 44,68 68,68 54,108 100,56 74,56) */
                    ctx.fillStyle = corRaio;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = Math.max(1, 3 * escala);
                    ctx.lineJoin = 'round';

                    ctx.beginPath();
                    ctx.moveTo(78 * escala, 20 * escala);
                    ctx.lineTo(44 * escala, 68 * escala);
                    ctx.lineTo(68 * escala, 68 * escala);
                    ctx.lineTo(54 * escala, 108 * escala);
                    ctx.lineTo(100 * escala, 56 * escala);
                    ctx.lineTo(74 * escala, 56 * escala);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    imageDataMap[dim] = ctx.getImageData(0, 0, dim, dim);
                }

                apiChrome.action.setIcon({ imageData: imageDataMap }).catch(() => { });
            } catch (_) { }
        }
    }

    Object.freeze(JusGovConfiguracoes.prototype);
    return Object.freeze(JusGovConfiguracoes);
}));

