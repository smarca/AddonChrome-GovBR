/* ==========================================================================
 * ARQUIVO: src/lib/lib-config-perfis.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Gestão de Perfis, Alternância e Reset Seletivo/Global
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config-perfis.js
 * - Classe Exportada: LibConfigPerfis (self.JusGovLibConfigPerfis) extends BaseModulo
 * - Métodos Públicos: garantirEstruturaPerfis, alternarPerfil, criarPerfil, renomearPerfil, excluirPerfil, resolverPerfilAtivoPosReset, resetarPerfis, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibConfigPerfis = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const _cfgH = (typeof self !== 'undefined' && self.JusGovConfigHelpers) ? self.JusGovConfigHelpers : ((typeof require === 'function') ? (() => { try { return require('./lib-config-helpers.js'); } catch (_) { return {}; } })() : {});
    const { CHAVE_PERFIL_ATIVO, CHAVE_LISTA_PERFIS, PREFIXO_CHAVE_PERFIL_CFG, CHAVE_CONFIG_SYNC_PENDENTE, CHAVE_SYNC_PERFIL_BASE_TOP, LIMITE_BYTES_ITEM_SYNC, JANELA_DUPLO_CLIQUE_ICONE_MS, CHAVES_CONFIGURACAO_SINCRONIZAVEL, SET_CHAVES_SYNC, obterDefaultsModulo, lerJsonDeResposta, formatarNomeArquivoExportacao, clonarValorSimples, valoresIguaisConfig, ENUNS_CONFIGURACAO_VALIDOS, LIMITES_NUMERICOS_CONFIGURACAO, calcularHashPayloadExportacao, extrairCabecalhoComentarioExportacao, normalizarTextoComparacao } = _cfgH;

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    class LibConfigPerfis extends Base {
        constructor() {
            super('LibConfigPerfis');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(LibConfigPerfis.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(LibConfigPerfis.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
    }

    Object.freeze(LibConfigPerfis.prototype);
    return Object.freeze(LibConfigPerfis);
}));
