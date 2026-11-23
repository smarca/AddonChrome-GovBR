/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-sync-nuvem.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Sincronização Multi-Dispositivo CRDT & Nuvem
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-sync-nuvem.js
 * - Classe Exportada: ProdutSyncNuvem (self.JusGovProdutSyncNuvem) extends BaseModulo
 * - Métodos Públicos: obterOuGerarDispositivoId(chromeApi),
 *   detectarUsoSimultaneoDispositivos(dispositivos, meuId, agora, meuEntradaTs),
 *   agregarDispositivosProdutividade(provedor, snapshot, meuId, estadoLocal, agora, meuEntradaTs),
 *   montarSnapshotProdutividadeNuvem(estado, locais, agora, dispositivoId, snapshotAnterior, entradaTs, opcoes),
 *   mesclarEstadoProdutividadeNuvem(provedor, localEstado, nuvemSnapshot, agora, meuDispositivoId, meuEntradaTs),
 *   sincronizarStatsMultiDispositivo(provedor, chromeApi, opcoes),
 *   salvarResumoProdutividadeNuvemAoSair(provedor, chromeApi, opcoes),
 *   sincronizarEstatisticasPeriodicoNuvem(provedor, chromeApi),
 *   recuperarResumoProdutividadeNuvemAoAbrir(provedor, chromeApi),
 *   static get NULL_OBJECT
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP, Null Object), ARQ-10 (Seção 6.259), RN-04, RN-05
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutSyncNuvem = fabrica(raiz);
    }
}(typeof self !== 'undefined' ? self : this, function (raiz) {
    'use strict';

    const Base = (raiz && typeof raiz.JusGovBaseModulo === 'function')
        ? raiz.JusGovBaseModulo
        : class BaseFallback {
            constructor(nome) { this._nome = nome || 'BaseFallback'; }
            inicializar() { return true; }
            destruir() { return true; }
        };

    const NULL_PRODUT_SYNC_NUVEM = Object.freeze({
        obterOuGerarDispositivoId: async () => 'pc_local',
        detectarUsoSimultaneoDispositivos: () => ({ simultaneo: false, dispositivosSimultaneos: [], totalDispositivosHoje: 0 }),
        agregarDispositivosProdutividade: () => ({
            outrosCorridoMin: 0, outrosAtivoMin: 0, outrosPausasConf: 0, outrosInicioTs: 0,
            outrosUltimoDescTipo: '', outrosUltimoDescFimTs: 0, outrosDispositivosQtd: 0,
            multiplosComputadoresSimultaneos: false, dispositivosSimultaneos: [], atualizadoEm: 0
        }),
        montarSnapshotProdutividadeNuvem: () => null,
        mesclarEstadoProdutividadeNuvem: (_p, localEstado) => ({ estado: localEstado || null, adotouNuvem: false, nuvemMeta: {} }),
        sincronizarStatsMultiDispositivo: async () => false,
        salvarResumoProdutividadeNuvemAoSair: async () => false,
        sincronizarEstatisticasPeriodicoNuvem: async () => false,
        recuperarResumoProdutividadeNuvemAoAbrir: async () => false,
        inicializar: () => false,
        destruir: () => false
    });

    class ProdutSyncNuvem extends Base {
        static get NULL_OBJECT() {
            return NULL_PRODUT_SYNC_NUVEM;
        }

        constructor() {
            super('ProdutSyncNuvem');
        }

        async obterOuGerarDispositivoId(chromeApi = null) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            const fallback = `pc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.local) return fallback;
            try {
                const res = await apiChrome.storage.local.get(['jusgovDispositivoId']);
                if (res && typeof res.jusgovDispositivoId === 'string' && res.jusgovDispositivoId.trim()) {
                    return res.jusgovDispositivoId.trim();
                }
                const novoId = `pc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
                await apiChrome.storage.local.set({ jusgovDispositivoId: novoId });
                return novoId;
            } catch (_) {
                return fallback;
            }
        }

        detectarUsoSimultaneoDispositivos(dispositivos = {}, meuId = '', agora = Date.now(), meuEntradaTs = 0) {
            const mapa = (dispositivos && typeof dispositivos === 'object') ? dispositivos : {};
            const JANELA_HEARTBEAT_ATIVO_MS = 90 * 60 * 1000;
            const TOLERANCIA_OVERLAP_MS = 2 * 60 * 1000;
            const ids = Object.keys(mapa).filter(id => mapa[id] && typeof mapa[id] === 'object');
            const simultaneos = [];

            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (meuId && id === meuId) continue;
                const d = mapa[id];
                const dInicio = Number(d.entradaTs || d.inicioTs || d.atualizadoEm || 0);
                const dFim = Math.max(Number(d.atualizadoEm || 0), Number(d.ultimaAtividadeTs || 0), dInicio);
                const recencia = agora - dFim;

                const ativoSemFechar = (!d.encerradoLimpo && recencia >= -300000 && recencia <= JANELA_HEARTBEAT_ATIVO_MS);
                const sobreposicaoSessao = Boolean(
                    meuEntradaTs > 0 &&
                    dInicio > 0 &&
                    dFim > (meuEntradaTs + TOLERANCIA_OVERLAP_MS) &&
                    recencia <= JANELA_HEARTBEAT_ATIVO_MS
                );
                if (ativoSemFechar || sobreposicaoSessao) {
                    simultaneos.push(id);
                }
            }

            return {
                simultaneo: simultaneos.length > 0,
                dispositivosSimultaneos: simultaneos,
                totalDispositivosHoje: ids.length
            };
        }

        agregarDispositivosProdutividade(provedor, snapshot, meuId = '', estadoLocal = null, agora = Date.now(), meuEntradaTs = 0) {
            const metaVazia = {
                outrosCorridoMin: 0,
                outrosAtivoMin: 0,
                outrosPausasConf: 0,
                outrosInicioTs: 0,
                outrosUltimoDescTipo: '',
                outrosUltimoDescFimTs: 0,
                outrosDispositivosQtd: 0,
                multiplosComputadoresSimultaneos: false,
                dispositivosSimultaneos: [],
                atualizadoEm: agora
            };
            if (!snapshot || typeof snapshot !== 'object') return metaVazia;

            const dataAlvo = (estadoLocal && estadoLocal.data)
                ? String(estadoLocal.data)
                : (provedor && typeof provedor.obterDataLocalChaveHoje === 'function' ? provedor.obterDataLocalChaveHoje(agora) : '');
            if (snapshot.v === 1 && snapshot.estado && typeof snapshot.estado === 'object') {
                return metaVazia;
            }
            if (snapshot.data && dataAlvo && String(snapshot.data) !== dataAlvo) {
                return metaVazia;
            }

            const disps = (snapshot.dispositivos && typeof snapshot.dispositivos === 'object') ? snapshot.dispositivos : {};
            const keys = Object.keys(disps);
            for (let i = 0; i < keys.length; i++) {
                const id = keys[i];
                if (id === meuId) continue;
                const d = disps[id];
                if (!d || typeof d !== 'object') continue;
                metaVazia.outrosCorridoMin += Math.max(0, Math.floor(Number(d.corridoMinutos) || 0));
                metaVazia.outrosAtivoMin += Math.max(0, Math.floor(Number(d.ativoMinutos) || 0));
                metaVazia.outrosPausasConf += Math.max(0, Math.floor(Number(d.pausasConfirmadas) || 0));
                const dInicio = Number(d.inicioTs || 0);
                if (dInicio > 0 && (metaVazia.outrosInicioTs === 0 || dInicio < metaVazia.outrosInicioTs)) {
                    metaVazia.outrosInicioTs = dInicio;
                }
                const dDescFim = Number(d.pomodoroUltimoDescansoFimTs || 0);
                if (dDescFim > metaVazia.outrosUltimoDescFimTs) {
                    metaVazia.outrosUltimoDescFimTs = dDescFim;
                    metaVazia.outrosUltimoDescTipo = (d.pomodoroUltimoDescansoTipo === 'pausa_maior' || d.pomodoroUltimoDescansoTipo === 'alivio')
                        ? d.pomodoroUltimoDescansoTipo : '';
                    metaVazia.outrosUltimoDescDuracaoMin = Math.max(0, Math.floor(Number(d.pomodoroUltimoDescansoDuracaoMin) || 0));
                }
                metaVazia.outrosDispositivosQtd += 1;
            }

            const deteccao = this.detectarUsoSimultaneoDispositivos(disps, meuId, agora, meuEntradaTs);
            metaVazia.multiplosComputadoresSimultaneos = deteccao.simultaneo;
            metaVazia.dispositivosSimultaneos = deteccao.dispositivosSimultaneos;
            return metaVazia;
        }

        montarSnapshotProdutividadeNuvem(estado, locais = {}, agora = Date.now(), dispositivoId = 'pc_local', snapshotAnterior = null, entradaTs = 0, opcoes = {}) {
            if (!estado || typeof estado !== 'object' || !estado.data) return null;
            const devId = String(dispositivoId || 'pc_local');
            const dataAtual = String(estado.data);
            const dispositivos = {};

            if (snapshotAnterior && snapshotAnterior.v === 2 && snapshotAnterior.data === dataAtual &&
                snapshotAnterior.dispositivos && typeof snapshotAnterior.dispositivos === 'object') {
                const keysAnt = Object.keys(snapshotAnterior.dispositivos);
                for (let i = 0; i < keysAnt.length && i < 12; i++) {
                    const k = keysAnt[i];
                    if (k !== devId && snapshotAnterior.dispositivos[k] && typeof snapshotAnterior.dispositivos[k] === 'object') {
                        dispositivos[k] = { ...snapshotAnterior.dispositivos[k] };
                    }
                }
            }

            const registroMeu = {
                entradaTs: Number(entradaTs || (locais && locais.jusgovSessaoEntradaTs) || estado.inicioTs || agora),
                inicioTs: Number(estado.inicioTs || agora),
                ultimaAtividadeTs: Number(estado.ultimaAtividadeTs || agora),
                atualizadoEm: agora,
                encerradoLimpo: Boolean(opcoes && opcoes.encerradoLimpo),
                corridoMinutos: Math.max(0, Math.floor(Number(estado.corridoMinutos) || 0)),
                ativoMinutos: Math.max(0, Math.floor(Number(estado.ativoMinutos) || 0)),
                pausasMinutos: Math.max(0, Math.floor(Number(estado.pausasMinutos) || 0)),
                pausasConfirmadas: Math.max(0, Math.floor(Number(estado.pausasConfirmadas) || 0)),
                pomodoroFase: ['foco', 'alivio', 'pausa_maior'].includes(estado.pomodoroFase) ? estado.pomodoroFase : 'foco',
                pomodoroMinutosNaFase: Math.max(0, Math.floor(Number(estado.pomodoroMinutosNaFase) || 0)),
                pomodoroCicloAtual: Math.max(0, Math.floor(Number(estado.pomodoroCicloAtual) || 0)),
                pomodoroUltimoDescansoTipo: estado.pomodoroUltimoDescansoTipo === 'alivio' || estado.pomodoroUltimoDescansoTipo === 'pausa_maior' ? estado.pomodoroUltimoDescansoTipo : '',
                pomodoroUltimoDescansoFimTs: Number(estado.pomodoroUltimoDescansoFimTs || 0),
                pomodoroUltimoDescansoDuracaoMin: Math.max(0, Math.floor(Number(estado.pomodoroUltimoDescansoDuracaoMin) || 0))
            };
            dispositivos[devId] = registroMeu;

            return {
                v: 2,
                data: dataAtual,
                atualizadoEm: agora,
                dataInicioContadores: typeof locais.dataInicioContadores === 'string' ? locais.dataInicioContadores : '',
                dispositivos,
                totalCopias: Math.max(0, Math.floor(Number(locais.totalCopias) || 0)),
                totalAlertas: Math.max(0, Math.floor(Number(locais.totalAlertas) || 0)),
                estado: { data: dataAtual, ...registroMeu }
            };
        }

        mesclarEstadoProdutividadeNuvem(provedor, localEstado, nuvemSnapshot, agora = Date.now(), meuDispositivoId = '', meuEntradaTs = 0) {
            const devId = String(meuDispositivoId || '');
            let estMeuNuvem = null;
            if (nuvemSnapshot && nuvemSnapshot.v === 2 && nuvemSnapshot.dispositivos && devId) {
                estMeuNuvem = nuvemSnapshot.dispositivos[devId] ? { data: nuvemSnapshot.data, ...nuvemSnapshot.dispositivos[devId] } : null;
            } else if (!devId && nuvemSnapshot && nuvemSnapshot.estado && typeof nuvemSnapshot.estado === 'object') {
                estMeuNuvem = nuvemSnapshot.estado;
            } else if (nuvemSnapshot && nuvemSnapshot.v === 1 && nuvemSnapshot.estado && typeof nuvemSnapshot.estado === 'object') {
                estMeuNuvem = nuvemSnapshot.estado;
            }

            let estadoRes = localEstado || null;
            let adotouNuvem = false;

            if (estMeuNuvem && provedor && typeof provedor.resolverEstadoTrabalhoParaMomento === 'function') {
                const validacaoNuvem = provedor.resolverEstadoTrabalhoParaMomento(estMeuNuvem, agora);
                if (!validacaoNuvem.reiniciou) {
                    if (!localEstado || typeof localEstado !== 'object' || !localEstado.data || localEstado.data !== estMeuNuvem.data) {
                        estadoRes = { ...provedor.criarEstadoTrabalhoZerado(estMeuNuvem.data, agora), ...estMeuNuvem };
                        adotouNuvem = true;
                    } else {
                        const scoreLocal = Number(localEstado.corridoMinutos || 0) + Number(localEstado.ativoMinutos || 0);
                        const scoreNuvem = Number(estMeuNuvem.corridoMinutos || 0) + Number(estMeuNuvem.ativoMinutos || 0);
                        if (scoreNuvem > scoreLocal) {
                            estadoRes = {
                                ...localEstado,
                                inicioTs: Math.min(Number(localEstado.inicioTs || agora), Number(estMeuNuvem.inicioTs || agora)),
                                ultimaAtividadeTs: Math.max(Number(localEstado.ultimaAtividadeTs || 0), Number(estMeuNuvem.ultimaAtividadeTs || 0)),
                                corridoMinutos: Math.max(Number(localEstado.corridoMinutos || 0), Number(estMeuNuvem.corridoMinutos || 0)),
                                ativoMinutos: Math.max(Number(localEstado.ativoMinutos || 0), Number(estMeuNuvem.ativoMinutos || 0)),
                                pausasMinutos: Math.max(Number(localEstado.pausasMinutos || 0), Number(estMeuNuvem.pausasMinutos || 0)),
                                pausasConfirmadas: Math.max(Number(localEstado.pausasConfirmadas || 0), Number(estMeuNuvem.pausasConfirmadas || 0)),
                                pomodoroFase: estMeuNuvem.pomodoroFase || localEstado.pomodoroFase,
                                pomodoroMinutosNaFase: Math.max(Number(localEstado.pomodoroMinutosNaFase || 0), Number(estMeuNuvem.pomodoroMinutosNaFase || 0)),
                                pomodoroCicloAtual: Math.max(Number(localEstado.pomodoroCicloAtual || 0), Number(estMeuNuvem.pomodoroCicloAtual || 0)),
                                pomodoroUltimoDescansoTipo: Number(estMeuNuvem.pomodoroUltimoDescansoFimTs || 0) >= Number(localEstado.pomodoroUltimoDescansoFimTs || 0)
                                    ? (estMeuNuvem.pomodoroUltimoDescansoTipo || '') : (localEstado.pomodoroUltimoDescansoTipo || ''),
                                pomodoroUltimoDescansoFimTs: Math.max(Number(localEstado.pomodoroUltimoDescansoFimTs || 0), Number(estMeuNuvem.pomodoroUltimoDescansoFimTs || 0)),
                                pomodoroUltimoDescansoDuracaoMin: Number(estMeuNuvem.pomodoroUltimoDescansoFimTs || 0) >= Number(localEstado.pomodoroUltimoDescansoFimTs || 0)
                                    ? Math.max(0, Math.floor(Number(estMeuNuvem.pomodoroUltimoDescansoDuracaoMin) || 0))
                                    : Math.max(0, Math.floor(Number(localEstado.pomodoroUltimoDescansoDuracaoMin) || 0))
                            };
                            adotouNuvem = true;
                        }
                    }
                }
            }

            const nuvemMeta = this.agregarDispositivosProdutividade(provedor, nuvemSnapshot, devId, estadoRes || localEstado, agora, meuEntradaTs);
            return { estado: estadoRes, adotouNuvem, nuvemMeta };
        }

        async sincronizarStatsMultiDispositivo(provedor, chromeApi = null, opcoes = {}) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.storage || !apiChrome.storage.local || !apiChrome.storage.sync) return false;
            try {
                const agora = Date.now();
                const devId = await this.obterOuGerarDispositivoId(apiChrome);
                const [loc, syn] = await Promise.all([
                    apiChrome.storage.local.get(['jusgovTrabalhoEstado', 'jusgovSessaoEntradaTs', 'totalCopias', 'totalAlertas', 'dataInicioContadores']),
                    apiChrome.storage.sync.get(['jusgovProdResumoSync'])
                ]);
                const entradaTs = (loc && Number(loc.jusgovSessaoEntradaTs)) ? Number(loc.jusgovSessaoEntradaTs) : agora;
                const snapAnt = (syn && syn.jusgovProdResumoSync) ? syn.jusgovProdResumoSync : null;

                const mesclado = this.mesclarEstadoProdutividadeNuvem(provedor, loc && loc.jusgovTrabalhoEstado, snapAnt, agora, devId, entradaTs);
                const updatesLocal = { jusgovProdNuvemMeta: mesclado.nuvemMeta };
                if (!(loc && Number(loc.jusgovSessaoEntradaTs))) updatesLocal.jusgovSessaoEntradaTs = entradaTs;
                if (mesclado.adotouNuvem && mesclado.estado) {
                    updatesLocal.jusgovTrabalhoEstado = mesclado.estado;
                }
                const copiasNuvem = snapAnt ? Math.max(0, Number(snapAnt.totalCopias || 0)) : 0;
                const alertasNuvem = snapAnt ? Math.max(0, Number(snapAnt.totalAlertas || 0)) : 0;
                if (copiasNuvem > Number((loc && loc.totalCopias) || 0)) updatesLocal.totalCopias = copiasNuvem;
                if (alertasNuvem > Number((loc && loc.totalAlertas) || 0)) updatesLocal.totalAlertas = alertasNuvem;
                if (snapAnt && snapAnt.dataInicioContadores && (!loc || !loc.dataInicioContadores)) {
                    updatesLocal.dataInicioContadores = snapAnt.dataInicioContadores;
                }
                await apiChrome.storage.local.set(updatesLocal);

                const dataChaveHoje = (provedor && typeof provedor.obterDataLocalChaveHoje === 'function')
                    ? provedor.obterDataLocalChaveHoje(agora) : '';
                const estadoParaEnviar = mesclado.estado || (loc && loc.jusgovTrabalhoEstado) ||
                    (provedor && typeof provedor.criarEstadoTrabalhoZerado === 'function' ? provedor.criarEstadoTrabalhoZerado(dataChaveHoje, agora) : null);
                if (estadoParaEnviar && opcoes && opcoes.enviarNuvem !== false) {
                    const novoSnap = this.montarSnapshotProdutividadeNuvem(
                        estadoParaEnviar,
                        loc || {},
                        agora,
                        devId,
                        snapAnt,
                        entradaTs,
                        { encerradoLimpo: Boolean(opcoes && opcoes.encerradoLimpo) }
                    );
                    if (novoSnap) {
                        await apiChrome.storage.sync.set({ jusgovProdResumoSync: novoSnap });
                    }
                }
                return { ok: true, nuvemMeta: mesclado.nuvemMeta, adotouNuvem: mesclado.adotouNuvem };
            } catch (_) {
                return false;
            }
        }

        async salvarResumoProdutividadeNuvemAoSair(provedor, chromeApi = null, opcoes = { encerradoLimpo: true }) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(provedor, chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: (opcoes && opcoes.encerradoLimpo !== false)
            }));
        }

        async sincronizarEstatisticasPeriodicoNuvem(provedor, chromeApi = null) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(provedor, chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: false
            }));
        }

        async recuperarResumoProdutividadeNuvemAoAbrir(provedor, chromeApi = null) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(provedor, chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: false
            }));
        }
    }

    Object.freeze(ProdutSyncNuvem.prototype);
    return Object.freeze(ProdutSyncNuvem);
}));
