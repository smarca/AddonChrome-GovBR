/* ==========================================================================
 * ARQUIVO: src/lib/lib-config-exportacao.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Exportação Diferencial com Hash e Importação Validada
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-config-exportacao.js
 * - Classe Exportada: LibConfigExportacao (self.JusGovLibConfigExportacao) extends BaseModulo
 * - Métodos Públicos: montarDadosExportacaoBackupTotal, sanitizarObjetoConfiguracao, gerarNomeArquivoExportacao, gerarArquivoExportacaoDiferencial, analisarEValidarArquivoImportacao, importarBackupTotal, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovLibConfigExportacao = fabrica(raiz);
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

    class LibConfigExportacao extends Base {
        constructor() {
            super('LibConfigExportacao');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(LibConfigExportacao.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(LibConfigExportacao.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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

            const autoBeta = (opts.automateBetaAtual && typeof opts.automateBetaAtual === 'object') ? opts.automateBetaAtual : null;
            if (autoBeta) {
                const temCtx = Array.isArray(autoBeta.contextosUsuario) && autoBeta.contextosUsuario.length > 0;
                const temCmd = Array.isArray(autoBeta.comandosUsuario) && autoBeta.comandosUsuario.length > 0;
                const temObj = autoBeta.objetosUsuario && typeof autoBeta.objetosUsuario === 'object' && Object.keys(autoBeta.objetosUsuario).length > 0;
                const temOvr = autoBeta.comandosOverrides && typeof autoBeta.comandosOverrides === 'object' && Object.keys(autoBeta.comandosOverrides).length > 0;
                if (temCtx || temCmd || temObj || temOvr) {
                    dadosJson.automateBeta = clonarValorSimples({
                        contextosUsuario: temCtx ? autoBeta.contextosUsuario : [],
                        comandosUsuario: temCmd ? autoBeta.comandosUsuario : [],
                        objetosUsuario: temObj ? autoBeta.objetosUsuario : {},
                        comandosOverrides: temOvr ? autoBeta.comandosOverrides : {}
                    });
                    totalChavesModificadas += 1;
                }
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
            const chavesReconhecidasRaiz = new Set(['projeto', 'versaoBackup', 'backupTotalPerfis', 'dataExportacao', 'perfilAtivoId', 'listaPerfis', 'perfis', 'regrasMapeamentoElementos', 'barraPomodoro', 'automateBeta']);

            if (!metadados) {
                const proj = typeof jsonBruto.projeto === 'string' ? jsonBruto.projeto.toLowerCase() : '';
                const configPadraoRef = (cat && cat.configPadrao) ? cat.configPadrao : {};
                const temChaveConfig = Object.keys(jsonBruto).some(k =>
                    configPadraoRef[k] !== undefined ||
                    k === 'perfis' ||
                    k === 'regrasMapeamentoElementos' ||
                    k === 'barraPomodoro' ||
                    k === 'automateBeta'
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
                    barraPomodoro: barraSanitizada,
                    automateBeta: (jsonBruto.automateBeta && typeof jsonBruto.automateBeta === 'object' && !Array.isArray(jsonBruto.automateBeta))
                        ? {
                            contextosUsuario: Array.isArray(jsonBruto.automateBeta.contextosUsuario) ? jsonBruto.automateBeta.contextosUsuario : [],
                            comandosUsuario: Array.isArray(jsonBruto.automateBeta.comandosUsuario) ? jsonBruto.automateBeta.comandosUsuario : [],
                            objetosUsuario: (jsonBruto.automateBeta.objetosUsuario && typeof jsonBruto.automateBeta.objetosUsuario === 'object') ? jsonBruto.automateBeta.objetosUsuario : {},
                            comandosOverrides: (jsonBruto.automateBeta.comandosOverrides && typeof jsonBruto.automateBeta.comandosOverrides === 'object') ? jsonBruto.automateBeta.comandosOverrides : {}
                        }
                        : null
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
                if (dv.automateBeta && apiChrome.storage.local) {
                    await apiChrome.storage.local.set({
                        jusgovAutomateContextosUsuario: dv.automateBeta.contextosUsuario || [],
                        jusgovAutomateComandosUsuario: dv.automateBeta.comandosUsuario || [],
                        jusgovAutomateObjetosUsuario: dv.automateBeta.objetosUsuario || {},
                        jusgovAutomateComandosOverrides: dv.automateBeta.comandosOverrides || {}
                    });
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
    }

    Object.freeze(LibConfigExportacao.prototype);
    return Object.freeze(LibConfigExportacao);
}));