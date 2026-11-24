/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-motor-ciclos.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Motor de Ciclos, Proteção 25%, Acréscimo Contínuo e Reconciliação Ao Vivo
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-motor-ciclos.js
 * - Classe Exportada: ProdutMotorCiclos (self.JusGovProdutMotorCiclos) extends BaseModulo
 * - Métodos Públicos: avancarMinutoEstadoTrabalho, _aplicarProtecaoEDeslocamentoPausaMaior, _calcularAcrescimoExcessoTrabalhoMs, iniciarFaseDescansoPomodoro, reconciliarEstadoPomodoroAoVivo, construirSnapshotExternoPomodoro, avancarMinutoPomodoro, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutMotorCiclos = fabrica(raiz);
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

    class ProdutMotorCiclos extends Base {
        constructor() {
            super('ProdutMotorCiclos');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ProdutMotorCiclos.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ProdutMotorCiclos.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Avança 1 minuto no estado diário de trabalho (lógica pura e determinística).
         * - Contabiliza sempre Corrido, Ativo e Pausas, mesmo com Pomodoro/alertas desativados.
         * - Tempo mínimo de pausa: 5 minutos seguidos sem interação.
         * - Ao confirmar pausa (>= 5 min), converte os minutos pendentes desde o início da
         *   inatividade para Pausas (contagem inteira da pausa, descontando do Tempo Ativo).
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {Object}
         */
        avancarMinutoEstadoTrabalho(estado, agora = Date.now(), config = {}) {
            const TEMPO_MINIMO_PAUSA_MS = 5 * 60 * 1000;
            const msDesdeAtividade = Math.max(0, agora - Number(estado.ultimaAtividadeTs || 0));
            const usuarioAtivoNaJanela = msDesdeAtividade < TEMPO_MINIMO_PAUSA_MS;

            /* Se o navegador ficou fechado/suspenso por > 1 min na mesma jornada (< 3h),
             * recupera o intervalo decorrido tratando exatamente como ociosidade/descanso */
            const ultTick = Number(estado._ultimoTickTrabalhoTs || 0);
            const deltaBrutoMin = (ultTick > 0 && agora > ultTick) ? Math.floor((agora - ultTick) / 60000) : 1;
            const incrementoMin = (deltaBrutoMin > 1 && deltaBrutoMin <= 180) ? deltaBrutoMin : 1;
            estado._ultimoTickTrabalhoTs = agora;

            estado.corridoMinutos = Number(estado.corridoMinutos || 0) + incrementoMin;

            if (usuarioAtivoNaJanela) {
                /* BUG-129: Se houve atividade dentro da janela ativa, garante saída imediata de emPausa */
                estado.emPausa = false;
                if (msDesdeAtividade >= 60 * 1000) {
                    estado.minutosInativosPendentes = Number(estado.minutosInativosPendentes || 0) + 1;
                } else {
                    estado.minutosInativosPendentes = 0;
                }
                estado.ativoMinutos = Number(estado.ativoMinutos || 0) + 1;
            } else if (!estado.emPausa) {
                const pendentes = Math.min(Number(estado.ativoMinutos || 0), Number(estado.minutosInativosPendentes || 0));
                estado.ativoMinutos = Math.max(0, Number(estado.ativoMinutos || 0) - pendentes);
                estado.pausasMinutos = Number(estado.pausasMinutos || 0) + pendentes + incrementoMin;
                /* BUG-129: Contabiliza exatamente +1 pausa confirmada ao atingir >= 5 min contínuos em idle */
                if (pendentes > 0 || msDesdeAtividade >= TEMPO_MINIMO_PAUSA_MS) {
                    estado.pausasConfirmadas = Number(estado.pausasConfirmadas || 0) + 1;
                }
                estado.emPausa = true;
                estado.pomodoroPausaInicioTs = Number(estado.ultimaAtividadeTs || agora);
                if (estado.pomodoroFase === 'foco' && pendentes > 0) {
                    estado.pomodoroMinutosNaFase = Math.max(0, Number(estado.pomodoroMinutosNaFase || 0) - pendentes);
                }
                estado.minutosInativosPendentes = 0;
            } else {
                estado.pausasMinutos = Number(estado.pausasMinutos || 0) + incrementoMin;
            }

            const corridoAtivo = Boolean(config && config.tempoTrabalhoCorridoAtivo);
            const ativoAtivo = Boolean(config && config.tempoTrabalhoAtivoAtivo);
            let disparoCorrido = false;
            let disparoAtivo = false;

            if (corridoAtivo) {
                const metaCorridoMin = Math.max(1, Number(config.tempoTrabalhoCorridoHoras || 7)) * 60;
                if (!estado.alertaCorridoDisparado && estado.corridoMinutos >= metaCorridoMin) {
                    estado.alertaCorridoDisparado = true;
                    disparoCorrido = true;
                }
            }
            if (ativoAtivo) {
                const metaAtivoMin = Math.max(1, Number(config.tempoTrabalhoAtivoHoras || 6)) * 60;
                if (!estado.alertaAtivoDisparado && estado.ativoMinutos >= metaAtivoMin) {
                    estado.alertaAtivoDisparado = true;
                    disparoAtivo = true;
                }
            }
            return { estado, disparoCorrido, disparoAtivo };
        }

        /**
         * Avança 1 minuto na máquina Pomodoro (função pura/determinística para testes e tick SW).
         * - No Alívio ou Pausa Maior, SÓ avança quando o usuário está ocioso (minInativo >= 1);
         *   caso o usuário continue trabalhando, zera a contagem da pausa e reinicia pomodoroFaseInicioTs.
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {{ evento: string|null, descansouNoPeriodo: boolean, ciclosMax: number, focoMin: number, alivioMin: number, pausaMaiorMin: number, proporcao: number }}
         */
        /**
         * Inicia fase de descanso (Alívio ou Pausa Maior) de forma unificada entre alarme e reconciliação ao vivo.
         * @param {Object} estado
         * @param {number} agora
         * @param {Object} config
         * @returns {'inicio_alivio'|'inicio_pausa_maior'}
         */

        /**
         * Proteção de 25% do próximo alívio e deslocamento contínuo do descanso maior (até 4 posições à frente por vez):
         * preserva 25% do próximo alívio, consome o excedente do saldo de pausa_maior até igualar alivioMin,
         * e ao atingir esse piso converte em alívio extra empurrando pausa_maior continuamente enquanto houver abuso.
         */
        _aplicarProtecaoEDeslocamentoPausaMaior(estado, excessoConsumoMs = 0, config = {}) {
            if (!estado || typeof estado !== 'object' || Number(excessoConsumoMs) <= 0) return { deslocou: false };
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcao = Math.max(1, Number(config && config.pomodoroProporcao || 4.5));
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            const alivioMs = alivioMin * 60000;
            const pausaMaiorMs = pausaMaiorMin * 60000;
            const limiteConsumoAlivioMs = Math.round(alivioMs * 0.75); // preserva 25% do próximo alívio
            const excedenteParaPausaMaiorMs = Math.max(0, Number(excessoConsumoMs) - limiteConsumoAlivioMs);
            if (excedenteParaPausaMaiorMs <= 0) return { deslocou: false };

            const saldoAtualPausaMaior = Number(estado.pausaMaiorSaldoMs || pausaMaiorMs);
            const novoSaldo = saldoAtualPausaMaior - excedenteParaPausaMaiorMs;
            if (novoSaldo <= alivioMs) {
                estado.pausaMaiorSaldoMs = pausaMaiorMs;
                estado.pausaMaiorDeslocamentos = Math.min(4, Math.max(0, Math.floor(Number(estado.pausaMaiorDeslocamentos || 0))) + 1);
                estado.pomodoroCicloAtual = Math.min(Math.max(0, ciclosMax - 1), Math.max(0, Number(estado.pomodoroCicloAtual || 0)));
                return { deslocou: true, deslocamentos: estado.pausaMaiorDeslocamentos };
            }
            estado.pausaMaiorSaldoMs = novoSaldo;
            return { deslocou: false, saldoRestanteMs: novoSaldo };
        }

        /**
         * Calcula acréscimo contínuo (25% da proporção do Pomodoro) sobre excesso de trabalho,
         * limitado ao teto da Pausa Maior (Descanso). Só aplicado ao entrar/computar o descanso.
         * @param {number} excessoFocoMs
         * @param {Object} [config]
         * @param {number} [basePausaMs]
         * @returns {{ totalPausaMs: number, acrescimoMs: number, atingiuDescanso: boolean, pausaMaiorMs: number }}
         */
        _calcularAcrescimoExcessoTrabalhoMs(excessoFocoMs = 0, config = {}, basePausaMs = 0) {
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcao = Math.max(1, Number(config && config.pomodoroProporcao || 4.5));
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMs = Math.max(1, Math.round(alivioMin * ciclosMax)) * 60000;
            const PERCENTUAL_MINIMO_FOLGA = 0.25;
            const acrescimoMs = Math.max(0, Math.round((Math.max(0, Number(excessoFocoMs) || 0) / proporcao) * PERCENTUAL_MINIMO_FOLGA));
            const totalPausaMs = Math.min(pausaMaiorMs, Math.max(0, Number(basePausaMs) || 0) + acrescimoMs);
            return {
                totalPausaMs,
                acrescimoMs,
                atingiuDescanso: totalPausaMs >= pausaMaiorMs,
                pausaMaiorMs
            };
        }

        iniciarFaseDescansoPomodoro(estado, agora = Date.now(), config = {}) {
            const ciclosMax = Math.max(2, Number((config && config.pomodoroCiclos) || 4));
            const inicioFaseAnt = Number(estado.pomodoroFaseInicioTs || agora);
            const ultAtivBruto = Number(estado.ultimaAtividadeTs || agora);
            const ultAtivCont = Math.min(agora, Math.max(inicioFaseAnt, ultAtivBruto));
            const idlePrevioMs = Math.max(0, agora - ultAtivCont);
            const focoMinCfg = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcaoCfg = Math.max(1, Number(config && config.pomodoroProporcao || 4.5));
            const alivioMinCfg = Math.max(1, Math.round(focoMinCfg / proporcaoCfg));
            const pausaMaiorMinCfg = Math.max(1, Math.round(alivioMinCfg * ciclosMax));
            const focoRodadaAtualMs = Math.max(
                Number(estado.pomodoroMinutosNaFase || 0) * 60000,
                Math.max(0, ultAtivCont - inicioFaseAnt - Number(estado.pomodoroFocoPausadoMs || 0))
            );
            estado.pomodoroFocoRodadaMs = Math.max(focoRodadaAtualMs, focoMinCfg * 60000);
            estado.saldoAtividadeRecebido = true;
            const temDebitoPausaAnterior = Boolean(estado.pomodoroDescansoPulado && Number(estado.pomodoroDescansoSaldoRestanteMs || 0) > 0)
                || Number(estado.necessidadePausaMs || 0) > 0;
            if (!estado.saldoPausaRecebido && !temDebitoPausaAnterior) {
                estado.saldoPausaRecebido = true;
                estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
            }
            const ehPausaMaiorProx = (estado.pomodoroCicloAtual >= ciclosMax && Number(estado.pausaMaiorDeslocamentos || 0) === 0);
            if (estado.pomodoroCicloAtual >= ciclosMax && Number(estado.pausaMaiorDeslocamentos || 0) > 0) {
                estado.pausaMaiorDeslocamentos = Math.max(0, Number(estado.pausaMaiorDeslocamentos || 0) - 1);
            }
            const saldoPendenteAntMs = temDebitoPausaAnterior
                ? Math.max(0, Number(estado.pomodoroDescansoSaldoRestanteMs || 0), Number(estado.necessidadePausaMs || 0))
                : 0;
            const pausaCicloAtualMs = (ehPausaMaiorProx ? pausaMaiorMinCfg : alivioMinCfg) * 60000;
            const basePausaMs = Math.min(pausaMaiorMinCfg * 60000, pausaCicloAtualMs + saldoPendenteAntMs);
            const excessoTrabalhoMs = Math.max(0, focoRodadaAtualMs - (focoMinCfg * 60000));
            const calcExc = this._calcularAcrescimoExcessoTrabalhoMs(excessoTrabalhoMs, config, basePausaMs);
            const ehPausaMaiorFinal = ehPausaMaiorProx || calcExc.atingiuDescanso;
            estado.necessidadeAtividadeMs = 0;
            estado.necessidadePausaMs = ehPausaMaiorFinal ? calcExc.pausaMaiorMs : calcExc.totalPausaMs;
            estado.pomodoroMinutosNaFase = Math.floor(idlePrevioMs / 60000);
            estado.pomodoroFaseInicioTs = agora;
            estado.pomodoroFocoPausadoMs = 0;
            estado.pomodoroPausaInicioTs = 0;
            estado.pomodoroDescansoMinCumprido = false;
            estado.pomodoroDescansoRealizadoNoCiclo = false;
            estado.pomodoroDescansoPendente = true;
            estado.pomodoroBancoOrigemFoco = '';
            estado.pomodoroBancoOrigemDescanso = '';
            estado.pomodoroBarraOcultadaChave = '';
            estado.pomodoroDescansoAcumuladoMs = idlePrevioMs;
            estado.pomodoroDescansoSyncTs = agora;
            estado.pomodoroDescansoAtividadeAteTs = 0;
            estado.pomodoroDescansoCliquesPenalidade = 0;
            estado.pomodoroDescansoUltimoCliqueTs = 0;
            estado.pomodoroDescansoUltimoTipoInteracao = '';
            estado.pomodoroModalFechadoNestaPausa = false;
            estado.pomodoroDescansoPulado = false;
            estado.pomodoroDescansoSaldoRestanteMs = 0;
            estado.pomodoroDescansoSaldoTipo = '';
            estado.pomodoroFocoAcumuladoAntesPausaMs = 0;
            estado.pomodoroMetaCustomMs = (!ehPausaMaiorFinal && calcExc.totalPausaMs > alivioMinCfg * 60000) ? calcExc.totalPausaMs : 0;
            if (ehPausaMaiorFinal || estado.pomodoroCicloAtual >= ciclosMax) {
                estado.pomodoroFase = 'pausa_maior';
                return 'inicio_pausa_maior';
            }
            estado.pomodoroFase = 'alivio';
            return 'inicio_alivio';
        }

        /**
         * Reconcilia no Service Worker marcos temporais ao vivo (transição 25:00 -> Alívio, 10s idle -> fecha modal,
         * conclusão do descanso -> Concluído! e recuperação de cliques), eliminando descompasso entre guias e alarmes.
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {{ alterouEstado: boolean, iniciouDescansoReal: boolean, concluiuDescanso: boolean, eventoModal: string|null, modalDados: Object|null }}
         */
        reconciliarEstadoPomodoroAoVivo(estado, agora = Date.now(), config = {}) {
            if (!estado || typeof estado !== 'object' || !config || !config.pomodoroAtivo) {
                return { alterouEstado: false, iniciouDescansoReal: false, concluiuDescanso: false, eventoModal: null, modalDados: null };
            }
            let alterouEstado = false;
            let iniciouDescansoReal = false;
            let concluiuDescanso = false;
            let eventoModal = null;
            let modalDados = null;
            const prefs = this.resolverPreferenciasAvisoPomodoro(config);

            if (estado.pomodoroFase === 'foco' && !estado.emPausa) {
                const resumoFoco = this.calcularResumoPomodoro(estado, config, agora, null);
                if (resumoFoco.segundosDecorridos >= (resumoFoco.focoMin * 60)) {
                    const inicioTransTs = Number(estado.pomodoroFaseInicioTs || agora) + Number(estado.pomodoroFocoPausadoMs || 0) + (resumoFoco.focoMin * 60000);
                    const tsTrans = Math.min(agora, Math.max(Number(estado.pomodoroFaseInicioTs || agora), inicioTransTs));
                    const ev = this.iniciarFaseDescansoPomodoro(estado, tsTrans, config);
                    const resumoNovo = this.calcularResumoPomodoro(estado, config, agora, null);
                    const chaveNova = `${resumoNovo.fase}:${resumoNovo.cicloAtual}:${resumoNovo.faseInicioTs}`;
                    alterouEstado = true;
                    if (prefs.usarModal && resumoNovo.aguardandoOciosidade) {
                        estado.pomodoroModalDescansoChave = chaveNova;
                        eventoModal = ev;
                        modalDados = this.obterDadosModalDescanso(resumoNovo, config);
                    } else if (!resumoNovo.aguardandoOciosidade) {
                        estado.pomodoroModalExibidoChave = chaveNova;
                        estado.pomodoroModalDescansoChave = '';
                        estado.pomodoroModalFechadoNestaPausa = true;
                        iniciouDescansoReal = true;
                    }
                }
            }

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                const prog = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                const resumoAtual = this.calcularResumoPomodoro(estado, config, agora, null);
                const chaveFase = `${resumoAtual.fase}:${resumoAtual.cicloAtual}:${resumoAtual.faseInicioTs}`;

                if (prog.aguardandoOciosidade && prefs.usarModal && !estado.pomodoroDescansoMinCumprido && !estado.pomodoroModalFechadoNestaPausa && estado.pomodoroModalExibidoChave !== chaveFase && estado.pomodoroModalDescansoChave !== chaveFase) {
                    estado.pomodoroModalDescansoChave = chaveFase;
                    alterouEstado = true;
                }
                if (!prog.aguardandoOciosidade && estado.pomodoroModalDescansoChave) {
                    estado.pomodoroModalExibidoChave = chaveFase;
                    estado.pomodoroModalDescansoChave = '';
                    estado.pomodoroModalFechadoNestaPausa = true;
                    alterouEstado = true;
                    iniciouDescansoReal = true;
                }
                if (!estado.pomodoroDescansoMinCumprido && prog.acumuladoMs >= prog.metaFaseMs) {
                    const acumCumpridoMs = Math.max(Number(estado.pomodoroDescansoAcumuladoMs || 0), Number(prog.acumuladoMs || prog.metaFaseMs || 60000));
                    estado.pomodoroDescansoMinCumprido = true;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroUltimaHidratacaoTs = agora;
                    estado.pomodoroAguaPendente = false;
                    estado.pomodoroDescansoAcumuladoMs = acumCumpridoMs;
                    estado.pomodoroDescansoSyncTs = agora;
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = Math.min(agora, Number(prog.terminaEmTs || agora));
                    estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(acumCumpridoMs);
                    estado.pomodoroModalExibidoChave = chaveFase;
                    estado.pomodoroModalDescansoChave = '';
                    estado.pomodoroModalFechadoNestaPausa = true;
                    alterouEstado = true;
                    concluiuDescanso = true;
                } else if (estado.pomodoroDescansoMinCumprido && prog.acumuladoMs > Number(estado.pomodoroDescansoAcumuladoMs || 0) + 15000) {
                    estado.pomodoroDescansoAcumuladoMs = prog.acumuladoMs;
                    estado.pomodoroDescansoSyncTs = agora;
                    estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(prog.acumuladoMs);
                    alterouEstado = true;
                } else if (!estado.pomodoroDescansoMinCumprido && Number(estado.pomodoroDescansoCliquesPenalidade || 0) !== Number(prog.cliquesPenalidade || 0)) {
                    estado.pomodoroDescansoCliquesPenalidade = prog.cliquesPenalidade;
                    estado.pomodoroDescansoUltimoCliqueTs = prog.ultimoCliqueTs;
                    estado.pomodoroDescansoAcumuladoMs = prog.acumuladoMs;
                    estado.pomodoroDescansoSyncTs = agora;
                    alterouEstado = true;
                }
            }

            return { alterouEstado, iniciouDescansoReal, concluiuDescanso, eventoModal, modalDados };
        }

        /**
         * Constrói o pacote externo único e canônico compartilhado por todas as guias, Popup, Opções, Badge e Tooltip.
         */
        construirSnapshotExternoPomodoro(estado, cfg = {}, nuvemMeta = null, estadoBarraGlobal = {}, agoraSync = Date.now(), permitirBeep = false) {
            const resumo = this.calcularResumoPomodoro(estado, cfg, agoraSync, nuvemMeta);
            const infoTooltip = this.formatarResumoProdutividadeTexto(estado, cfg, agoraSync, nuvemMeta);
            const prefs = this.resolverPreferenciasAvisoPomodoro(cfg);
            const paramsBeep = this.resolverParametrosBeepPomodoro(cfg);
            const chaveFaseAtual = `${resumo.fase}:${resumo.cicloAtual}:${resumo.faseInicioTs}`;
            const focoOcultadoGlobal = false;
            const ativoPorConfig = Boolean(resumo.ativo && prefs.modoBarra !== 'nunca');
            const deveMostrarBarraBase = Boolean(
                ativoPorConfig &&
                !focoOcultadoGlobal &&
                (prefs.modoBarra === 'sempre' || (prefs.modoBarra === 'descanso' && (resumo.emDescanso || resumo.descansoPendente)))
            );
            const bannerPropagandaOculta = Boolean(
                ativoPorConfig &&
                !deveMostrarBarraBase &&
                !resumo.emDescanso &&
                !resumo.descansoPendente &&
                !resumo.emPausa
            );
            const govFallback = { podeContinuarDescanso: true, podeAdiantarDescanso: true, fatorPrivilegio: 1, estadoSaldo: 'normal', mensagemGovernanca: '' };
            const bemEstarPropaganda = (this._bemEstar && typeof this._bemEstar.montarPacotePropaganda === 'function')
                ? this._bemEstar.montarPacotePropaganda(estado, resumo, cfg, agoraSync)
                : { aguaPendente: false, cardDestaque: null, cardsCiclo: [], governanca: govFallback, duracaoPrimeiraMsgMs: 10000, intervaloTrocaMinMs: 2000, intervaloTrocaMaxMs: 3000, bannerLembreteMinMs: 45000, bannerLembreteMaxMs: 85000 };
            const modalAtivoAgora = false;
            const modalDados = modalAtivoAgora ? this.obterDadosModalDescanso(resumo, cfg) : null;
            const nivelCfgFallback = (cfg && cfg.pomodoroEstiloMinipopup === 'normal') ? 1 : ((cfg && cfg.pomodoroEstiloMinipopup === 'expandido') ? 2 : 0);
            const microCfgFallback = Boolean(cfg && cfg.pomodoroEstiloMinipopup === 'micro');
            const estadoBarraEfetivo = (estadoBarraGlobal && typeof estadoBarraGlobal === 'object')
                ? {
                    ...estadoBarraGlobal,
                    nivelDetalhe: (estadoBarraGlobal.nivelDetalhe === undefined) ? nivelCfgFallback : estadoBarraGlobal.nivelDetalhe,
                    minimizadoMicro: (estadoBarraGlobal.minimizadoMicro === undefined) ? microCfgFallback : estadoBarraGlobal.minimizadoMicro
                }
                : estadoBarraGlobal;
            const cfgExib = {
                ativoPorConfig,
                deveExibirNormal: deveMostrarBarraBase,
                bannerPropagandaOculta,
                focoOcultadoGlobal,
                modoBarra: prefs.modoBarra,
                beepAtivo: paramsBeep.ativo,
                beepIntensidade: paramsBeep.intensidade,
                beepIntervaloMs: paramsBeep.intervaloMs,
                permitirBeep: Boolean(paramsBeep.ativo && permitirBeep),
                deveExibirModalDescanso: modalAtivoAgora,
                modalDados,
                tooltipTexto: infoTooltip.tooltipTitle || '',
                agoraServidor: agoraSync,
                bemEstarPropaganda
            };
            return { agoraServidor: agoraSync, resumoPomodoro: resumo, prefs, paramsBeep, cfgExib, estadoBarra: estadoBarraEfetivo };
        }

        avancarMinutoPomodoro(estado, agora = Date.now(), config = {}) {
            const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 45));
            const proporcao = Number(config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));

            const govAuto = (this._bemEstar && typeof this._bemEstar.calcularSaldoGovernanca === 'function')
                ? this._bemEstar.calcularSaldoGovernanca(estado, config, agora)
                : { temMeritoAutoPausa: true };
            const msInativoPreAuto = Math.max(0, agora - Number(estado.ultimaAtividadeTs || agora));
            if (estado.pomodoroFase === 'foco' && !govAuto.temMeritoAutoPausa) {
                /* Sem trabalho efetivo prévio: idle >= 3 min pausa o tempo ativo do Pomodoro retroativamente desde o início da ociosidade */
                if (msInativoPreAuto >= 3 * 60000) {
                    if (!estado.emPausa) {
                        estado.emPausa = true;
                        estado.pomodoroPausaInicioTs = Number(estado.ultimaAtividadeTs || agora);
                    }
                    return { evento: 'foco_pausado_sem_merito', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
            } else {
                const autoRes = this.registrarPausasAutomaticasProdutividade(estado, agora, config);
                if (autoRes.creditado) {
                    return { evento: null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
            }

            const msInativo = Math.max(0, agora - Number(estado.ultimaAtividadeTs || agora));
            const minInativo = Math.floor(msInativo / 60000);

            /* Limiares dinâmicos proporcionais ao tempo da própria fase atual + governança (privilegiando quem cumpre prazos) */
            const baseIdleFocoMin = Math.max(2, Math.min(alivioMin, Math.round(focoMin * 0.12)));
            const fatorGovFoco = (govAuto && govAuto.temMeritoAutoPausa && !estado.pomodoroDescansoPulado) ? 1.15 : 0.85;
            const limiarIdleFocoMin = estado.pomodoroDescansoPulado
                ? 1
                : Math.max(2, Math.min(alivioMin, Math.round(baseIdleFocoMin * fatorGovFoco)));
            const limiarIdleFocoMs = limiarIdleFocoMin * 60000;

            const metaDescAtualMin = (estado.pomodoroFase === 'pausa_maior') ? pausaMaiorMin : alivioMin;
            const limiarAtivoDescMin = Math.max(2, Math.min(8, Math.round(metaDescAtualMin * 0.25)));
            const limiarAtivoDescMs = limiarAtivoDescMin * 60000;

            /* Banco de minutos estrito (±1): em Foco, se ficar idle >= limiar proporcional do Foco,
             * consome somente o Alívio/Descanso imediatamente anterior (incompleto) ou o imediatamente posterior (futuro),
             * marcando origem ('anterior' -> * no atual, 'posterior' -> * na meta) e bloqueando empréstimo em cascata (> ±1). */
            if (estado.pomodoroFase === 'foco' && msInativo >= limiarIdleFocoMs) {
                const saldoPausadoMs = Number(estado.pomodoroDescansoSaldoRestanteMs || 0);
                const origemDescAtual = String(estado.pomodoroBancoOrigemDescanso || '');
                if (estado.pomodoroDescansoPulado && saldoPausadoMs > 0 && origemDescAtual !== 'posterior') {
                    const ultimaAtivAntes = Number(estado.ultimaAtividadeTs || agora);
                    const ret = this.retomarDescansoFlexivel(estado, agora, config);
                    if (ret && ret.ok) {
                        const msDesdeParada = Math.max(limiarIdleFocoMs, agora - ultimaAtivAntes);
                        estado.pomodoroBancoOrigemDescanso = 'anterior';
                        estado.ultimaAtividadeTs = ultimaAtivAntes;
                        estado.pomodoroFaseInicioTs = ultimaAtivAntes;
                        estado.pomodoroDescansoAcumuladoMs = msDesdeParada;
                        estado.pomodoroDescansoSyncTs = agora;
                        estado.pomodoroDescansoAtividadeAteTs = 0;
                        estado.pomodoroSemScreensaverAteTs = 0;
                        estado.pomodoroMinutosNaFase = Math.floor(msDesdeParada / 60000);
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                        return { evento: 'auto_retomou_descanso_incompleto', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                } else if (origemDescAtual !== 'posterior' && govAuto.temMeritoAutoPausa && Number(estado.pomodoroMinutosNaFase || 0) > 0 && typeof this.alternarPausaOuAdiantarDescanso === 'function') {
                    const ultimaAtivAntesProx = Number(estado.ultimaAtividadeTs || agora);
                    const retProx = this.alternarPausaOuAdiantarDescanso(estado, agora, config);
                    if (retProx && retProx.ok) {
                        const msDesdeParadaProx = Math.max(limiarIdleFocoMs, agora - ultimaAtivAntesProx);
                        estado.pomodoroBancoOrigemDescanso = 'posterior';
                        estado.ultimaAtividadeTs = ultimaAtivAntesProx;
                        estado.pomodoroFaseInicioTs = ultimaAtivAntesProx;
                        estado.pomodoroDescansoAcumuladoMs = msDesdeParadaProx;
                        estado.pomodoroDescansoSyncTs = agora;
                        estado.pomodoroDescansoAtividadeAteTs = 0;
                        estado.pomodoroSemScreensaverAteTs = 0;
                        estado.pomodoroMinutosNaFase = Math.floor(msDesdeParadaProx / 60000);
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                        return { evento: 'auto_iniciou_proximo_descanso', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                }
            }

            const tentarAutoRetomarFocoEmDescanso = () => {
                const origemFocoAtual = String(estado.pomodoroBancoOrigemFoco || '');
                if (origemFocoAtual === 'posterior') {
                    /* Regra estrita ±1: já está consumindo foco emprestado do futuro — não empresta de ciclos adicionais (regra antiga) */
                    return null;
                }
                const focoSalvoMs = Number(estado.pomodoroFocoAcumuladoAntesPausaMs || 0);
                const temFocoAnteriorIncompleto = (focoSalvoMs >= 60000 && focoSalvoMs < Math.max(60000, focoMin * 60000 - 5000));
                const retFoco = this.pularDescansoEIniciarFoco(estado, agora, config);
                if (retFoco && estado.pomodoroFase === 'foco') {
                    estado.pomodoroBancoOrigemFoco = temFocoAnteriorIncompleto ? 'anterior' : 'posterior';
                    estado.pomodoroFaseInicioTs = Math.max(0, Number(estado.pomodoroFaseInicioTs || agora) - limiarAtivoDescMs);
                    estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + limiarAtivoDescMin;
                    return { evento: 'auto_retomou_foco_em_descanso', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
                return null;
            };

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                if (estado.pomodoroDescansoMinCumprido) {
                    estado.pomodoroMinutosAtivoEmDescanso = 0;
                    estado.pomodoroBancoOrigemDescanso = '';
                    const progLiveCumpr = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                    const acumLiveCumpr = Math.max(
                        Number(progLiveCumpr && progLiveCumpr.acumuladoMs || 0),
                        (Number(estado.pomodoroMinutosNaFase || 0) + 1) * 60000
                    );
                    estado.pomodoroDescansoAcumuladoMs = acumLiveCumpr;
                    estado.pomodoroDescansoSyncTs = agora;
                    estado.pomodoroMinutosNaFase = Math.floor(acumLiveCumpr / 60000);
                } else if (Number(estado.pomodoroDescansoSyncTs || 0) > 0) {
                    if (minInativo < 1) {
                        estado.pomodoroMinutosAtivoEmDescanso = Number(estado.pomodoroMinutosAtivoEmDescanso || 0) + 1;
                    } else {
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                    }
                    if (estado.pomodoroMinutosAtivoEmDescanso >= limiarAtivoDescMin) {
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                        const autoFocoRes = tentarAutoRetomarFocoEmDescanso();
                        if (autoFocoRes) return autoFocoRes;
                    }
                    this.calcularProgressoDescanso(estado, agora, config, { mutar: true });
                    estado.pomodoroMinutosNaFase = Math.floor(Number(estado.pomodoroDescansoAcumuladoMs || 0) / 60000);
                } else if (minInativo < 1) {
                    estado.pomodoroMinutosAtivoEmDescanso = Number(estado.pomodoroMinutosAtivoEmDescanso || 0) + 1;
                    if (estado.pomodoroMinutosAtivoEmDescanso >= limiarAtivoDescMin) {
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                        const autoFocoRes = tentarAutoRetomarFocoEmDescanso();
                        if (autoFocoRes) return autoFocoRes;
                    }
                    /* BUG-70 / BUG-84: Usuário continuou trabalhando antes de 25% -> aguarda idle e reinicia contagem do descanso sem alterar pomodoroFaseInicioTs para não reabrir o modal fechado */
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = false;
                    estado.pomodoroDescansoPendente = true;
                    estado.pomodoroDescansoAcumuladoMs = 0;
                    estado.pomodoroDescansoSyncTs = 0;
                    estado.pomodoroDescansoAtividadeAteTs = 0;
                    estado.pomodoroDescansoCliquesPenalidade = 0;
                    estado.pomodoroDescansoUltimoCliqueTs = 0;
                    return { evento: 'aguardando_idle', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                } else {
                    estado.pomodoroMinutosAtivoEmDescanso = 0;
                    estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
                    estado.pomodoroDescansoAcumuladoMs = Math.max(Number(estado.pomodoroDescansoAcumuladoMs || 0), estado.pomodoroMinutosNaFase * 60000);
                }
                const metaCustomMinTick = Number(estado.pomodoroMetaCustomMs || 0) > 0
                    ? Math.max(1, Math.ceil(Number(estado.pomodoroMetaCustomMs) / 60000))
                    : 0;
                const metaAlivioEfetivaMin = metaCustomMinTick > 0 ? metaCustomMinTick : alivioMin;
                const metaPausaMaiorEfetivaMin = metaCustomMinTick > 0 ? metaCustomMinTick : pausaMaiorMin;

                if (estado.pomodoroFase === 'alivio') {
                    if (estado.pomodoroMinutosNaFase >= pausaMaiorMin) {
                        /* Alívio prolongado virou Descanso Maior e segue contando indefinidamente até o usuário voltar a interagir */
                        const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                        estado.pomodoroFase = 'pausa_maior';
                        estado.pomodoroCicloAtual = 0;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimaHidratacaoTs = agora;
                        estado.pomodoroAguaPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                        estado.pomodoroUltimoDescansoFimTs = agora;
                        estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(
                            Number(estado.pomodoroDescansoAcumuladoMs || 0) || (Number(estado.pomodoroMinutosNaFase || pausaMaiorMin) * 60000)
                        );
                        if (acabouDeCumprir) estado.pomodoroBadgeVerdeAteTs = 0;
                        return { evento: 'promovido_pausa_maior', descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                    if (estado.pomodoroMinutosNaFase >= metaAlivioEfetivaMin) {
                        const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimaHidratacaoTs = agora;
                        estado.pomodoroAguaPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'alivio';
                        estado.pomodoroUltimoDescansoFimTs = agora;
                        estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(
                            Number(estado.pomodoroDescansoAcumuladoMs || 0) || (Number(estado.pomodoroMinutosNaFase || metaAlivioEfetivaMin) * 60000)
                        );
                        if (acabouDeCumprir) estado.pomodoroBadgeVerdeAteTs = 0;
                        return { evento: acabouDeCumprir ? 'alivio_cumprido_continuo' : null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                    return { evento: null, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }

                /* Fase 'pausa_maior': após atingir metaPausaMaiorEfetivaMin, continua contando indefinidamente até clique/tecla */
                if (estado.pomodoroMinutosNaFase >= metaPausaMaiorEfetivaMin) {
                    const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                    estado.pomodoroCicloAtual = 0;
                    estado.pomodoroDescansoMinCumprido = true;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroUltimaHidratacaoTs = agora;
                    estado.pomodoroAguaPendente = false;
                    estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                    estado.pomodoroUltimoDescansoFimTs = agora;
                    estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(
                        Number(estado.pomodoroDescansoAcumuladoMs || 0) || (Number(estado.pomodoroMinutosNaFase || pausaMaiorMin) * 60000)
                    );
                    if (acabouDeCumprir) estado.pomodoroBadgeVerdeAteTs = 0;
                    return { evento: acabouDeCumprir ? 'pausa_maior_cumprida_continua' : null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
                return { evento: null, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
            }

            /* Fase 'foco': avança apenas enquanto houver atividade fora de pausa */
            if (!estado.emPausa && minInativo < alivioMin) {
                estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
            }
            if (estado.pomodoroFase === 'foco' && estado.pomodoroMinutosNaFase >= focoMin) {
                const evento = this.iniciarFaseDescansoPomodoro(estado, agora, config);
                return { evento, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
            }
            return { evento: null, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
        }
    }

    Object.freeze(ProdutMotorCiclos.prototype);
    return Object.freeze(ProdutMotorCiclos);
}));