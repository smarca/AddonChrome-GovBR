/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-estado-trabalho.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Estado Diário, Dia Lógico 04:00 e Resumo Pomodoro
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-estado-trabalho.js
 * - Classe Exportada: ProdutEstadoTrabalho (self.JusGovProdutEstadoTrabalho) extends BaseModulo
 * - Métodos Públicos: obterDataLocalChaveHoje, criarEstadoTrabalhoZerado, resolverEstadoTrabalhoParaMomento, obterOuIniciarEstadoTrabalhoHoje, mesclarEstadoComNuvemMeta, resetarEstadoTrabalhoHoje, registrarAtividadeTrabalho, calcularResumoPomodoro, deveExibirBadgeVerdeMinipopup, formatarResumoProdutividadeTexto, renderizarResumoProdutividadeDom, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutEstadoTrabalho = fabrica(raiz);
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

    class ProdutEstadoTrabalho extends Base {
        constructor() {
            super('ProdutEstadoTrabalho');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ProdutEstadoTrabalho.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ProdutEstadoTrabalho.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Retorna a chave textual do dia lógico de trabalho (YYYY-MM-DD),
         * considerando a virada de dia às 04:00 da manhã para acomodar serões.
         * @param {number} [ts]
         * @returns {string}
         */
        obterDataLocalChaveHoje(ts = Date.now()) {
            const d = new Date(ts);
            if (d.getHours() < 4) {
                d.setDate(d.getDate() - 1);
            }
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        /**
         * Cria um registro diário zerado para a chave de dia lógico informada.
         * @param {string} dataChave
         * @param {number} [agora]
         * @returns {Object}
         */
        criarEstadoTrabalhoZerado(dataChave, agora = Date.now()) {
            return {
                data: dataChave,
                inicioTs: agora,
                ultimaAtividadeTs: agora,
                corridoMinutos: 0,
                ativoMinutos: 0,
                pausasMinutos: 0,
                pausasConfirmadas: 0,
                emPausa: false,
                minutosInativosPendentes: 0,
                alertaCorridoDisparado: false,
                alertaAtivoDisparado: false,
                pomodoroFase: 'foco',
                pomodoroMinutosNaFase: 0,
                pomodoroCicloAtual: 0,
                pomodoroDescansoRealizadoNoCiclo: false,
                pomodoroDescansoPendente: false,
                pomodoroDescansoMinCumprido: false,
                pomodoroUltimoDescansoTipo: '',
                pomodoroUltimoDescansoFimTs: 0,
                pomodoroUltimoDescansoDuracaoMin: 0,
                pomodoroBadgeVerdeAteTs: 0,
                pomodoroSemScreensaverAteTs: 0,
                pomodoroDescansoAcumuladoMs: 0,
                pomodoroDescansoSyncTs: 0,
                pomodoroDescansoAtividadeAteTs: 0,
                pomodoroDescansoCliquesPenalidade: 0,
                pomodoroDescansoUltimoCliqueTs: 0,
                pomodoroDescansoUltimoTipoInteracao: '',
                pomodoroBarraOcultadaChave: '',
                pomodoroModalDescansoChave: '',
                pomodoroModalExibidoChave: '',
                pomodoroPularProximoPopupFoco: false,
                pomodoroFaseInicioTs: agora,
                pomodoroFocoPausadoMs: 0,
                pomodoroPausaInicioTs: 0,
                pomodoroDescansoPulado: false,
                pomodoroDescansoSaldoRestanteMs: 0,
                pomodoroDescansoSaldoTipo: '',
                pomodoroFocoAcumuladoAntesPausaMs: 0,
                pomodoroMetaCustomMs: 0,
                pomodoroDescansoTotalMs: 0,
                pomodoroUltimaHidratacaoTs: agora,
                pomodoroAguaPendente: false,
                pomodoroHistoricoRounds: [],
                pomodoroBlocoAtual: 0,
                pomodoroFocoRodadaMs: 0,
                necessidadeAtividadeMs: 0,
                necessidadePausaMs: 0,
                saldoAtividadeRecebido: false,
                saldoPausaRecebido: false,
                pausaMaiorDeslocamentos: 0,
                _ultimoIdleAutoCreditadoTs: 0,
                _nivelAutoCreditado: ''
            };
        }

        /**
         * Resolve se o estado salvo deve ser mantido (mesmo dia lógico ou serão contínuo
         * atravessando as 04:00 com hiato < 3h) ou reiniciado para o novo dia lógico.
         * @param {Object|null} atual
         * @param {number} [agora]
         * @returns {{ estado: Object, reiniciou: boolean }}
         */
        resolverEstadoTrabalhoParaMomento(atual, agora = Date.now()) {
            const LIMITE_DESCANSO_SONO_MS = 3 * 60 * 60 * 1000;
            const diaLogicoAtual = this.obterDataLocalChaveHoje(agora);

            if (!atual || !atual.data) {
                return { estado: this.criarEstadoTrabalhoZerado(diaLogicoAtual, agora), reiniciou: true };
            }

            if (atual.data === diaLogicoAtual) {
                return { estado: atual, reiniciou: false };
            }

            const hiatoMs = Math.max(0, agora - Number(atual.ultimaAtividadeTs || 0));
            if (hiatoMs < LIMITE_DESCANSO_SONO_MS) {
                /* Continuidade de serão atravessando a madrugada/04:00 sem descanso >= 3h */
                return { estado: atual, reiniciou: false };
            }

            return { estado: this.criarEstadoTrabalhoZerado(diaLogicoAtual, agora), reiniciou: true };
        }

        /**
         * Recupera o estado diário atual do storage ou cria um novo registro zerado para hoje.
         * @returns {Promise<Object>}
         */
        async obterOuIniciarEstadoTrabalhoHoje() {
            const agora = Date.now();
            const dados = await chrome.storage.local.get(['jusgovTrabalhoEstado']);
            const { estado, reiniciou } = this.resolverEstadoTrabalhoParaMomento(dados.jusgovTrabalhoEstado, agora);
            if (reiniciou) {
                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
            }
            return estado;
        }

        /**
         * Mescla estado local com metadados da nuvem em uma única fonte canônica (evita divergência entre Tooltip, Badge, Popup, Opções e Minipopup).
         * @param {Object} [estado]
         * @param {Object|null} [nuvemMeta]
         * @param {number} [agora]
         * @returns {{ stEfetivo: Object, meta: Object|null, inicioCombinado: number, corridoTotalMin: number, ativoTotalMin: number, pausasTotais: number }}
         */
        mesclarEstadoComNuvemMeta(estado = {}, nuvemMeta = null, agora = Date.now()) {
            const st = (estado && typeof estado === 'object') ? estado : {};
            const meta = (nuvemMeta && typeof nuvemMeta === 'object')
                ? nuvemMeta
                : ((st._nuvemMeta && typeof st._nuvemMeta === 'object') ? st._nuvemMeta : null);
            const stEfetivo = { ...st };
            if (meta && Number(meta.outrosUltimoDescFimTs || 0) > Number(st.pomodoroUltimoDescansoFimTs || 0)) {
                stEfetivo.pomodoroUltimoDescansoFimTs = Number(meta.outrosUltimoDescFimTs);
                if (meta.outrosUltimoDescTipo === 'alivio' || meta.outrosUltimoDescTipo === 'pausa_maior') {
                    stEfetivo.pomodoroUltimoDescansoTipo = meta.outrosUltimoDescTipo;
                }
                if (Number(meta.outrosUltimoDescDuracaoMin || 0) > 0) {
                    stEfetivo.pomodoroUltimoDescansoDuracaoMin = Number(meta.outrosUltimoDescDuracaoMin);
                }
            }
            const inicioLocal = Number(st.inicioTs || 0);
            const inicioOutros = Number(meta && meta.outrosInicioTs || 0);
            const candidatosInicio = [inicioLocal, inicioOutros].filter(n => Number.isFinite(n) && n > 0);
            const inicioCombinado = candidatosInicio.length > 0 ? Math.min(...candidatosInicio) : agora;
            const corridoTotalMin = Math.max(0, Math.floor(Number(st.corridoMinutos) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosCorridoMin) || 0));
            const ativoTotalMin = Math.max(0, Math.floor(Number(st.ativoMinutos) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosAtivoMin) || 0));
            const pausasTotais = Math.max(0, Math.floor(Number(st.pausasConfirmadas) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosPausasConf) || 0));
            return { stEfetivo, meta, inicioCombinado, corridoTotalMin, ativoTotalMin, pausasTotais };
        }

        /**
         * Reinicia os contadores diários e o estado do Pomodoro para o momento atual,
         * limpando também metadados em cache para manter Opções, Popup, Tooltip, Badge e Minipopup sincronizados.
         * @returns {Promise<Object>}
         */
        async resetarEstadoTrabalhoHoje() {
            const agora = Date.now();
            const chaveHoje = this.obterDataLocalChaveHoje(agora);
            const novo = this.criarEstadoTrabalhoZerado(chaveHoje, agora);
            await chrome.storage.local.set({ jusgovTrabalhoEstado: novo });
            try {
                if (chrome.storage.local && typeof chrome.storage.local.remove === 'function') {
                    await chrome.storage.local.remove(['jusgovProdNuvemMeta']);
                }
                if (chrome.storage.sync && typeof chrome.storage.sync.get === 'function') {
                    const [loc, syn] = await Promise.all([
                        chrome.storage.local.get(['jusgovDispositivoId']).catch(() => ({})),
                        chrome.storage.sync.get(['jusgovProdResumoSync']).catch(() => ({}))
                    ]);
                    const devId = (loc && loc.jusgovDispositivoId) || null;
                    const snap = (syn && syn.jusgovProdResumoSync && typeof syn.jusgovProdResumoSync === 'object')
                        ? { ...syn.jusgovProdResumoSync } : null;
                    if (snap && snap.dispositivos && devId) {
                        const devs = { ...snap.dispositivos };
                        devs[devId] = {
                            corridoMin: 0,
                            ativoMin: 0,
                            pausasMin: 0,
                            pausasConf: 0,
                            inicioTs: agora,
                            entradaTs: agora,
                            atualizadoEm: agora,
                            encerradoLimpo: false
                        };
                        snap.dispositivos = devs;
                        snap.data = chaveHoje;
                        await chrome.storage.sync.set({ jusgovProdResumoSync: snap });
                    }
                }
            } catch (_) { }
            return novo;
        }

        /**
         * Registra o carimbo de tempo da última atividade detectada do usuário.
         * @param {number} [agora]
         * @param {string} [tipoInteracao] 'click_ou_tecla' | 'movimento'
         * @param {Object|null} [configOpcional]
         * @returns {Promise<{ resetouDescanso: boolean, iniciouFocoPosDescanso: boolean, iniciouBadgeVerde: boolean, ocultouBadgeVerde: boolean, alterouDescanso: boolean }>}
         */
        async registrarAtividadeTrabalho(agora = Date.now(), tipoInteracao = 'click_ou_tecla', configOpcional = null) {
            try {
                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                let config = configOpcional;
                if (!config && typeof this._obterConfig === 'function') {
                    try { config = await this._obterConfig(); } catch (_) { config = {}; }
                }
                const res = this.aplicarAtividadeEmEstadoTrabalho(estado, agora, tipoInteracao, config || {});
                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
                return res;
            } catch (_) {
                return { resetouDescanso: false, iniciouFocoPosDescanso: false, iniciouBadgeVerde: false, ocultouBadgeVerde: false, alterouDescanso: false };
            }
        }

        /**
         * Calcula parâmetros e resumo legível da máquina Pomodoro atual (fonte única para Badge, Tooltip, Minipopup, Popup e Opções).
         * @param {Object} estado
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {Object|null} [nuvemMeta]
         * @returns {Object}
         */
        calcularResumoPomodoro(estado = {}, config = {}, agora = Date.now(), nuvemMeta = null) {
            const { stEfetivo } = this.mesclarEstadoComNuvemMeta(estado, nuvemMeta, agora);
            const ativo = Boolean(config && config.pomodoroAtivo);
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcao = Number(config && config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            const fase = ['foco', 'alivio', 'pausa_maior'].includes(stEfetivo.pomodoroFase) ? stEfetivo.pomodoroFase : 'foco';
            const minutosBase = Math.max(0, Math.floor(Number(stEfetivo.pomodoroMinutosNaFase || 0)));
            const metaFaseMin = fase === 'pausa_maior' ? pausaMaiorMin : (fase === 'alivio' ? alivioMin : focoMin);
            const cicloConcluido = Math.max(0, Math.floor(Number(stEfetivo.pomodoroCicloAtual || 0)));
            const cicloAtual = fase === 'foco' ? Math.min(ciclosMax, cicloConcluido + 1) : Math.max(1, Math.min(ciclosMax, cicloConcluido));
            const ultimaAtivTs = Number(stEfetivo.ultimaAtividadeTs || agora);
            const emDescanso = (fase === 'alivio' || fase === 'pausa_maior');
            const emPausa = Boolean(stEfetivo.emPausa);
            const inicioFaseTs = Number(stEfetivo.pomodoroFaseInicioTs || stEfetivo.inicioTs || agora);
            const progDescanso = emDescanso ? this.calcularProgressoDescanso(stEfetivo, agora, config, { mutar: false }) : null;
            const metaFaseMsEfetiva = (progDescanso && Number(progDescanso.metaFaseMs || 0) > 0)
                ? Number(progDescanso.metaFaseMs)
                : (metaFaseMin * 60000);
            const metaFaseMinEfetiva = Math.max(1, Math.ceil(metaFaseMsEfetiva / 60000));
            const aguardandoOciosidade = Boolean(emDescanso && progDescanso && progDescanso.aguardandoOciosidade);
            const terminaEmTs = emDescanso
                ? progDescanso.terminaEmTs
                : (inicioFaseTs + metaFaseMsEfetiva);
            const minBaseSeg = minutosBase * 60;
            const focoPausadoMs = Number(stEfetivo.pomodoroFocoPausadoMs || 0);
            const pausaIniTs = Number(stEfetivo.pomodoroPausaInicioTs || 0);
            const temAncoraPausaExata = (focoPausadoMs > 0 || pausaIniTs > 0);
            const diffIniSeg = Math.max(0, Math.floor((agora - (inicioFaseTs + focoPausadoMs)) / 1000));
            const tevePausaRegistrada = Number(stEfetivo.pausasMinutos || 0) > 0;
            const segDecorridos = emDescanso
                ? Math.floor(progDescanso.acumuladoMs / 1000)
                : (emPausa
                    ? (pausaIniTs > 0 ? Math.max(minBaseSeg, Math.floor((pausaIniTs - (inicioFaseTs + focoPausadoMs)) / 1000)) : minBaseSeg)
                    : ((temAncoraPausaExata || !tevePausaRegistrada || Math.abs(diffIniSeg - minBaseSeg) <= 90)
                        ? diffIniSeg
                        : (minBaseSeg + (diffIniSeg % 60))));
            const segRestantes = emDescanso
                ? progDescanso.segRestantes
                : Math.max(0, (metaFaseMin * 60) - segDecorridos);
            const minutosNaFase = emPausa
                ? minutosBase
                : Math.max(minutosBase, Math.floor(segDecorridos / 60));
            const minutosRestantes = emDescanso
                ? Math.max(0, Math.ceil(segRestantes / 60))
                : Math.max(0, metaFaseMin - minutosNaFase);
            const focoAnchorTs = emDescanso ? inicioFaseTs : (agora - segDecorridos * 1000);
            const descansoMinCumprido = Boolean(emDescanso && (stEfetivo.pomodoroDescansoMinCumprido || (progDescanso && progDescanso.acumuladoMs >= progDescanso.metaFaseMs)));
            const descansoPendente = Boolean(!descansoMinCumprido && (stEfetivo.pomodoroDescansoPendente || (emDescanso && !stEfetivo.pomodoroDescansoRealizadoNoCiclo)));
            const ultimoDescansoTipo = (stEfetivo.pomodoroUltimoDescansoTipo === 'alivio' || stEfetivo.pomodoroUltimoDescansoTipo === 'pausa_maior')
                ? stEfetivo.pomodoroUltimoDescansoTipo
                : (descansoMinCumprido ? fase : '');
            const ultimoDescansoFimTs = Number(stEfetivo.pomodoroUltimoDescansoFimTs || 0) || (descansoMinCumprido && progDescanso ? Number(progDescanso.terminaEmTs || agora) : 0);
            const duracaoPadraoMin = ultimoDescansoTipo === 'pausa_maior' ? pausaMaiorMin : alivioMin;
            const ultimoDescansoDuracaoMin = (emDescanso && stEfetivo.pomodoroDescansoMinCumprido && progDescanso)
                ? this.arredondarMinutosDescansoExato(Math.max(
                    Number(progDescanso.acumuladoMs || 0),
                    Number(stEfetivo.pomodoroDescansoAcumuladoMs || 0),
                    Number(stEfetivo.pomodoroMinutosNaFase || 0) * 60000
                ))
                : Math.max(
                    1,
                    Number(stEfetivo.pomodoroUltimoDescansoDuracaoMin || 0) ||
                    (emDescanso && segDecorridos >= 60 ? this.arredondarMinutosDescansoExato(progDescanso ? progDescanso.acumuladoMs : segDecorridos * 1000) : duracaoPadraoMin)
                );
            const horaFimDescanso = ultimoDescansoFimTs > 0 ? this.formatarHoraHHMM(ultimoDescansoFimTs) : '';
            const formatarDuracaoDescanso = (totalMin) => {
                const m = Math.max(1, Math.floor(Number(totalMin) || 0));
                if (m >= 60) {
                    const hh = String(Math.floor(m / 60)).padStart(2, '0');
                    const mm = String(m % 60).padStart(2, '0');
                    return `${hh}:${mm}hs`;
                }
                return `${String(m).padStart(2, '0')} ${m === 1 ? 'minuto' : 'minutos'}`;
            };
            const ultimoDescansoTexto = (ultimoDescansoTipo && horaFimDescanso)
                ? `${ultimoDescansoTipo === 'pausa_maior' ? 'Descanso' : 'Alívio'} realizado às ${horaFimDescanso}hs por ${formatarDuracaoDescanso(ultimoDescansoDuracaoMin)}`
                : '';
            const descansoRealizado = Boolean((ultimoDescansoTexto || descansoMinCumprido) && !descansoPendente);
            const faseLabel = fase === 'pausa_maior' ? 'Descanso' : (fase === 'alivio' ? 'Alívio' : 'Foco');

            /* Meritocracia estrita (±1 / ciclo corrente) + alertas visuais de empréstimo no minipopup */
            const bancoOrigemFoco = String(stEfetivo.pomodoroBancoOrigemFoco || '');
            const bancoOrigemDescanso = String(stEfetivo.pomodoroBancoOrigemDescanso || '');
            const forcarMicroPorEmprestimoFoco = Boolean(
                !emDescanso &&
                !descansoPendente &&
                (bancoOrigemFoco === 'anterior' || bancoOrigemFoco === 'posterior')
            );
            let pctConsumoEmprestimo = 0;
            let alertaEmprestimoTexto = '';
            let alertaEmprestimoCritico = false;
            if (emDescanso) {
                const metaAtualSeg = Math.max(60, Math.round(metaFaseMsEfetiva / 1000));
                if (bancoOrigemDescanso === 'posterior') {
                    pctConsumoEmprestimo = Math.min(100, Math.round((segDecorridos / metaAtualSeg) * 100));
                    alertaEmprestimoCritico = pctConsumoEmprestimo >= 75;
                    const nomeAlvo = (fase === 'pausa_maior') ? 'Descanso' : 'Alívio';
                    alertaEmprestimoTexto = alertaEmprestimoCritico
                        ? `⚠️ Quase sem saldo p/ o próximo ${nomeAlvo} (${pctConsumoEmprestimo}%)!`
                        : `⏳ Empréstimo do próximo ${nomeAlvo} (${pctConsumoEmprestimo}%)`;
                } else if (descansoMinCumprido) {
                    const extraSeg = Math.max(0, segDecorridos - metaAtualSeg);
                    if (extraSeg >= 60) {
                        if (fase === 'alivio' && cicloAtual < ciclosMax) {
                            const tetoCicloSeg = Math.max(60, pausaMaiorMin * 60);
                            pctConsumoEmprestimo = Math.min(100, Math.round((extraSeg / tetoCicloSeg) * 100));
                            alertaEmprestimoCritico = pctConsumoEmprestimo >= 75;
                            alertaEmprestimoTexto = alertaEmprestimoCritico
                                ? `⚠️ Descanso do ciclo quase esgotado (${pctConsumoEmprestimo}%)!`
                                : `⏳ Consumindo Descanso do ciclo (${pctConsumoEmprestimo}%)`;
                        } else {
                            pctConsumoEmprestimo = 100;
                            alertaEmprestimoCritico = true;
                            alertaEmprestimoTexto = '⚠️ Saldo do ciclo esgotado (sem empréstimo externo)';
                        }
                    }
                }
            }

            const focoSalvoMsCalc = Number(stEfetivo.pomodoroFocoAcumuladoAntesPausaMs || 0);
            const saldoDescRestCalc = Number(stEfetivo.pomodoroDescansoSaldoRestanteMs || 0);
            const necessidadeAtividadeMs = emDescanso
                ? (focoSalvoMsCalc > 0 ? ((focoMin * 60000) - focoSalvoMsCalc) : Number(stEfetivo.necessidadeAtividadeMs || 0))
                : ((focoMin * 60000) - (segDecorridos * 1000));
            const necessidadePausaMs = emDescanso
                ? (metaFaseMsEfetiva - (progDescanso ? progDescanso.acumuladoMs : 0))
                : ((stEfetivo.pomodoroDescansoPulado && saldoDescRestCalc > 0)
                    ? saldoDescRestCalc
                    : (descansoPendente ? ((fase === 'pausa_maior' ? pausaMaiorMin : alivioMin) * 60000) : Number(stEfetivo.necessidadePausaMs || 0)));

            return {
                ativo,
                fase,
                faseLabel,
                necessidadeAtividadeMs,
                necessidadePausaMs,
                bancoOrigemFoco,
                bancoOrigemDescanso,
                forcarMicroPorEmprestimoFoco,
                pctConsumoEmprestimo,
                alertaEmprestimoTexto,
                alertaEmprestimoCritico,
                focoMin,
                alivioMin,
                pausaMaiorMin,
                cicloConcluido,
                cicloAtual,
                ciclosMax,
                minutosNaFase,
                metaFaseMin: metaFaseMinEfetiva,
                metaFaseMs: metaFaseMsEfetiva,
                minutosRestantes,
                segundosRestantes: segRestantes,
                segundosDecorridos: segDecorridos,
                emPausa,
                focoAnchorTs,
                faseInicioTs: inicioFaseTs,
                faseTerminaEmTs: terminaEmTs,
                emDescanso,
                aguardandoOciosidade,
                descansoMinCumprido,
                descansoPendente,
                descansoRealizado,
                ultimoDescansoTipo,
                ultimoDescansoFimTs,
                ultimoDescansoDuracaoMin,
                ultimoDescansoTexto,
                ultimaAtividadeTs: ultimaAtivTs,
                badgeVerdeAteTs: Number(estado.pomodoroBadgeVerdeAteTs || 0),
                descansoSemScreensaverAteTs: Number(stEfetivo.pomodoroSemScreensaverAteTs || 0),
                descansoAcumuladoMs: progDescanso ? progDescanso.acumuladoMs : 0,
                descansoSyncTs: progDescanso ? progDescanso.syncTs : 0,
                descansoAtividadeAteTs: progDescanso ? progDescanso.atividadeAteTs : 0,
                descansoCliquesPenalidade: progDescanso ? progDescanso.cliquesPenalidade : 0,
                descansoUltimoCliqueTs: progDescanso ? progDescanso.ultimoCliqueTs : 0,
                descansoEstagioEfetivo: progDescanso ? progDescanso.estagioEfetivo : 0,
                descansoAvisoTexto: progDescanso ? progDescanso.mensagemAviso : '',
                descansoEmAviso: progDescanso ? progDescanso.emAviso : false,
                descansoUltimoTipoInteracao: progDescanso ? progDescanso.ultimoTipoInteracao : '',
                descansoPulado: Boolean(stEfetivo.pomodoroDescansoPulado && Number(stEfetivo.pomodoroDescansoSaldoRestanteMs || 0) > 0),
                descansoSaldoRestanteMs: Number(stEfetivo.pomodoroDescansoSaldoRestanteMs || 0),
                descansoSaldoTipo: String(stEfetivo.pomodoroDescansoSaldoTipo || ''),
                focoSalvoAntesPausaMs: Number(stEfetivo.pomodoroFocoAcumuladoAntesPausaMs || 0)
            };
        }

        /**
         * Removida exibição automática de badge verde pós-descanso no minipopup (mantido apenas status Expandido/tooltip).
         * @returns {boolean}
         */
        deveExibirBadgeVerdeMinipopup() {
            return false;
        }

        /**
         * Formata linhas textuais de produtividade, segmentos DOM e tooltip multi-linha (FEAT-43/45/47).
         * - Soma estatísticas agregadas de outros computadores (`nuvemMeta`) sem dupla contagem.
         * - Omite campos zerados, não duplica Tempo Ativo igual a Tempo Corrido e prefixa 👉 nos tempos.
         * - Exibe alerta `⚠️ Múltiplos computadores em uso simultâneo.` quando detectado na nuvem.
         * @param {Object} [estado]
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {Object|null} [nuvemMeta]
         * @returns {{ dataBR: string, horaInicio: string, linhaDataInicio: string, linhaTempos: string, linhaPomodoro: string, segmentosPomodoro: Array<{texto: string, destaque: string}>, alertaMultiplosComputadores: string, tooltipTitle: string }}
         */
        formatarResumoProdutividadeTexto(estado = {}, config = {}, agora = Date.now(), nuvemMeta = null) {
            const ui = this.obterResumoUi();
            if (ui && typeof ui.formatarResumoProdutividadeTexto === 'function') {
                return ui.formatarResumoProdutividadeTexto(this, estado, config, agora, nuvemMeta);
            }
            return {
                dataBR: '',
                horaInicio: '',
                linhaDataInicio: '',
                linhaTempos: '',
                linhaPomodoro: '',
                segmentosPomodoro: [],
                alertaMultiplosComputadores: '',
                tooltipTitle: ''
            };
        }

        /**
         * Renderizador DOM compartilhado entre Popup, Opções e demais telas (SRP / Reúso UI).
         * Delega para ProdutResumoUi (src/mod-produt/produt-resumo-ui.js — ARQ-10).
         * @param {HTMLElement|null} containerPrincipal
         * @param {Object} [estado]
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {{ containerPomodoro?: HTMLElement|null, ocultarPomodoroQuandoInativo?: boolean, nuvemMeta?: Object|null }} [opcoes]
         */
        renderizarResumoProdutividadeDom(containerPrincipal, estado = {}, config = {}, agora = Date.now(), opcoes = {}) {
            const ui = this.obterResumoUi();
            if (ui && typeof ui.renderizarResumoProdutividadeDom === 'function') {
                return ui.renderizarResumoProdutividadeDom(this, containerPrincipal, estado, config, agora, opcoes);
            }
            return null;
        }


        /**
         * Converte duração exata de descanso (incluindo eventual tempo excedido) em minutos inteiros:
         * arredonda para baixo por padrão, ou para cima se muito próximo do próximo minuto (>= 45s).
         * @param {number} [totalMs]
         * @returns {number}
         */
        arredondarMinutosDescansoExato(totalMs = 0) {
            const segTotais = Math.max(0, Math.round(Number(totalMs || 0) / 1000));
            const minBase = Math.floor(segTotais / 60);
            const restoSeg = segTotais % 60;
            return Math.max(1, minBase + (restoSeg >= 45 ? 1 : 0));
        }
    }

    Object.freeze(ProdutEstadoTrabalho.prototype);
    return Object.freeze(ProdutEstadoTrabalho);
}));