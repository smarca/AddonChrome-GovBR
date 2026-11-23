/* ==========================================================================
 * ARQUIVO: src/mod-produt/lib-produt-bem-estar.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Grupo 6 - PRODUTIVIDADE & POMODORO (Bem-Estar, Hidratação 2h, Banners Propaganda & Governança 4.5:1)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/lib-produt-bem-estar.js
 * - Classe Exportada: BemEstarPomodoro (self.JusGovBemEstarPomodoro)
 * - Métodos Públicos:
 *     obterCatalogoCompleto(),
 *     calcularSaldoGovernanca(estado, config, agora),
 *     avaliarHidratacao2h(estado, agora, config),
 *     montarPacotePropaganda(estado, resumo, config, agora)
 * - Regras / Seções: FEAT-77 (Pomodoro Flexível + Governança 4.5:1),
 *   FEAT-79 (Lembrete Água 2h em azul/branco, Banners Propaganda com Ícones SVG animados,
 *   Anti-Burla adaptativa e Movimento Randômico nas Bordas)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovBemEstarPomodoro = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const INTERVALO_HIDRATACAO_MS = 2 * 60 * 60 * 1000;

    const CARD_AGUA = Object.freeze({
        chave: 'agua',
        categoria: 'agua',
        icone: 'agua',
        titulo: 'Hidratação',
        texto: 'Hora de beber água!',
        bg: '#0284c7',
        fg: '#ffffff',
        piscar: true
    });

    const _cardsMod = (typeof self !== 'undefined' && self.JusGovProdutBemEstarCards)
        ? self.JusGovProdutBemEstarCards
        : ((typeof require === 'function') ? (() => { try { return require('./produt-bem-estar-cards.js'); } catch (_) { return {}; } })() : {});
    const CARDS_FOCO = _cardsMod.CARDS_FOCO || Object.freeze([]);
    const CARDS_AGUARDANDO = _cardsMod.CARDS_AGUARDANDO || Object.freeze([]);
    const CARDS_DEBITO = _cardsMod.CARDS_DEBITO || Object.freeze([]);
    const CARDS_ALIVIO = _cardsMod.CARDS_ALIVIO || Object.freeze([]);
    const CARDS_PROIBIDOS = _cardsMod.CARDS_PROIBIDOS || Object.freeze([]);
    const CARDS_PAUSA_MAIOR = _cardsMod.CARDS_PAUSA_MAIOR || Object.freeze([]);
    const CARD_RETORNO_TRABALHO = _cardsMod.CARD_RETORNO_TRABALHO || Object.freeze({});
    const CARD_INCENTIVO_DESCANSO = _cardsMod.CARD_INCENTIVO_DESCANSO || Object.freeze({});

    class BemEstarPomodoro {
        obterCatalogoCompleto() {
            return {
                agua: CARD_AGUA,
                alivio: CARDS_ALIVIO,
                proibido: CARDS_PROIBIDOS,
                pausaMaior: CARDS_PAUSA_MAIOR,
                retornoTrabalho: CARD_RETORNO_TRABALHO,
                incentivoDescanso: CARD_INCENTIVO_DESCANSO
            };
        }

        _embaralharLista(lista) {
            const copia = Array.isArray(lista) ? lista.slice() : [];
            for (let i = copia.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = copia[i];
                copia[i] = copia[j];
                copia[j] = tmp;
            }
            return copia;
        }

        /**
         * Governança proporcional 4.5:1 + mérito ponderado por histórico (round atual, ciclo anterior,
         * ciclos do mesmo bloco e blocos anteriores) + regra de 1/3 do descanso (FEAT-77 / FEAT-79).
         */
        calcularSaldoGovernanca(estado = {}, config = {}, agora = Date.now()) {
            const st = (estado && typeof estado === 'object') ? estado : {};
            const cfg = (config && typeof config === 'object') ? config : {};
            const focoMin = Math.max(25, Number(cfg.pomodoroFocoMinutos || 45));
            const focoMs = focoMin * 60000;
            const proporcao = Math.max(1, Number(cfg.pomodoroProporcao || 4.5));
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const alivioMs = alivioMin * 60000;

            const inicioFaseTs = Number(st.pomodoroFaseInicioTs || st.inicioTs || agora);
            const emDescansoAtual = (st.pomodoroFase === 'alivio' || st.pomodoroFase === 'pausa_maior');
            const focoPausadoMs = Number(st.pomodoroFocoPausadoMs || 0);
            const segFocoVivoMs = (!emDescansoAtual && !st.emPausa)
                ? Math.max(0, agora - (inicioFaseTs + focoPausadoMs))
                : Math.max(0, Number(st.pomodoroMinutosNaFase || 0) * 60000);
            const focoRoundAtualMs = emDescansoAtual
                ? Math.max(0, Number(st.pomodoroFocoAcumuladoAntesPausaMs || 0))
                : segFocoVivoMs;

            const ativoMinDiaMs = Math.max(0, Number(st.ativoMinutos || 0) * 60000);
            const trabalhoDiaMs = Math.max(ativoMinDiaMs, segFocoVivoMs);
            const metaProporcionalMs = trabalhoDiaMs / proporcao;
            const tetoComToleranciaMs = metaProporcionalMs + alivioMs;

            const descansoConcluidoMs = Math.max(0, Number(st.pomodoroDescansoTotalMs || 0));
            const descansoCorrenteMs = emDescansoAtual ? Math.max(0, Number(st.pomodoroDescansoAcumuladoMs || 0)) : 0;
            const descansoRealizadoDiaMs = descansoConcluidoMs + descansoCorrenteMs;

            /* Histórico ponderado: round atual (0.40), ciclo anterior (0.25), mesmo bloco (0.20), blocos anteriores (0.15) */
            const hist = Array.isArray(st.pomodoroHistoricoRounds) ? st.pomodoroHistoricoRounds : [];
            const blocoAtual = Math.max(0, Math.floor(Number(st.pomodoroBlocoAtual || 0)));
            const calcRatioItem = (item) => {
                const f = Math.max(0, Number(item && item.focoMs || 0));
                const d = Math.max(0, Number(item && item.descansoMs || 0));
                if (d <= 0) return f > 0 ? 1.25 : 0;
                return Math.min(1.5, f / (d * proporcao));
            };

            const meritoRoundAtual = Math.min(1.25, focoRoundAtualMs / Math.max(60000, focoMs * 0.5));
            const meritoCicloAnt = hist.length >= 1 ? calcRatioItem(hist[hist.length - 1]) : meritoRoundAtual;

            const itensMesmoBloco = hist.filter(x => Number(x && x.blocoIdx || 0) === blocoAtual);
            const meritoMesmoBloco = itensMesmoBloco.length > 0
                ? (itensMesmoBloco.reduce((acc, it) => acc + calcRatioItem(it), 0) / itensMesmoBloco.length)
                : meritoCicloAnt;

            const itensBlocosAnt = hist.filter(x => Number(x && x.blocoIdx || 0) < blocoAtual);
            let meritoBlocosAnt = meritoMesmoBloco;
            if (itensBlocosAnt.length > 0) {
                let somaW = 0;
                let somaV = 0;
                for (let idx = itensBlocosAnt.length - 1, k = 0; idx >= 0; idx--, k++) {
                    const peso = Math.pow(0.8, k);
                    somaW += peso;
                    somaV += peso * calcRatioItem(itensBlocosAnt[idx]);
                }
                meritoBlocosAnt = somaW > 0 ? (somaV / somaW) : meritoMesmoBloco;
            }

            const indiceMerito = Number((
                (meritoRoundAtual * 0.40) +
                (meritoCicloAnt * 0.25) +
                (meritoMesmoBloco * 0.20) +
                (meritoBlocosAnt * 0.15)
            ).toFixed(3));

            const trabalhouMinimo = Boolean(
                trabalhoDiaMs >= (5 * 60000) ||
                Number(st.pomodoroCicloAtual || 0) >= 1 ||
                hist.length >= 1
            );

            let fatorPrivilegio = 1;
            let dentroSaldoDiario = true;
            if (descansoRealizadoDiaMs > tetoComToleranciaMs) {
                const excedenteMs = descansoRealizadoDiaMs - tetoComToleranciaMs;
                if (excedenteMs >= alivioMs) {
                    fatorPrivilegio = 0;
                    dentroSaldoDiario = false;
                } else {
                    fatorPrivilegio = Math.max(0.25, Number((1 - (excedenteMs / alivioMs)).toFixed(2)));
                }
            }

            const metaDescansoAtualMs = emDescansoAtual
                ? (Number(st.pomodoroMetaCustomMs || 0) > 0
                    ? Number(st.pomodoroMetaCustomMs)
                    : ((st.pomodoroFase === 'pausa_maior' ? Math.max(2, Number(cfg.pomodoroCiclos || 4)) * alivioMin : alivioMin) * 60000))
                : alivioMs;
            const cumpriuUmTercoDescanso = Boolean(
                emDescansoAtual &&
                (st.pomodoroDescansoMinCumprido || descansoCorrenteMs >= (metaDescansoAtualMs / 3))
            );

            const podeContinuarDescanso = Boolean(trabalhouMinimo && dentroSaldoDiario && indiceMerito >= 0.50);
            const podeAdiantarDescanso = Boolean(
                trabalhouMinimo &&
                dentroSaldoDiario &&
                (focoRoundAtualMs >= Math.min(10 * 60000, focoMs * 0.22) || indiceMerito >= 0.80)
            );
            const podePausarDescanso = Boolean(
                emDescansoAtual &&
                trabalhouMinimo &&
                cumpriuUmTercoDescanso &&
                indiceMerito >= 0.45
            );
            const temMeritoAutoPausa = Boolean(trabalhouMinimo && indiceMerito >= 0.35);

            let estadoSaldo = 'normal';
            if (trabalhoDiaMs >= (30 * 60000) && descansoRealizadoDiaMs < (metaProporcionalMs * 0.8)) {
                estadoSaldo = 'precisa_descanso';
            } else if (descansoRealizadoDiaMs > (metaProporcionalMs * 1.2 + alivioMs * 0.5)) {
                estadoSaldo = 'excesso_pausas';
            }

            const mensagemGovernanca = !trabalhouMinimo
                ? 'Acumule trabalho efetivo antes de flexibilizar ou pausar o descanso.'
                : (!dentroSaldoDiario
                    ? 'Limite diário de pausas atingido (4.5:1): acumule mais trabalho para liberar novamente.'
                    : (emDescansoAtual && !cumpriuUmTercoDescanso
                        ? 'Cumpra ao menos 1/3 do descanso antes de pausar.'
                        : (estadoSaldo === 'precisa_descanso'
                            ? 'Você acumulou foco intenso; recomenda-se um Alívio em breve.'
                            : (fatorPrivilegio < 1
                                ? `Privilégio reduzido (${Math.round(fatorPrivilegio * 100)}%) pelo saldo de pausas do dia.`
                                : 'Ciclo equilibrado para flexibilizar pausas.'))));

            return {
                podeContinuarDescanso,
                podeAdiantarDescanso,
                podePausarDescanso,
                cumpriuUmTercoDescanso,
                temMeritoAutoPausa,
                trabalhouMinimo,
                indiceMerito,
                fatorPrivilegio,
                estadoSaldo,
                trabalhoDiaMs,
                descansoRealizadoDiaMs,
                metaProporcionalMs,
                toleranciaMs: alivioMs,
                mensagemGovernanca
            };
        }

        avaliarHidratacao2h(estado = {}, agora = Date.now(), config = {}) {
            const st = (estado && typeof estado === 'object') ? estado : {};
            const pomodoroAtivo = Boolean(config && config.pomodoroAtivo);
            if (!pomodoroAtivo) {
                return { aguaPendente: false, msDesdeUltimaAgua: 0, intervaloMs: INTERVALO_HIDRATACAO_MS };
            }
            const refTs = Number(st.pomodoroUltimaHidratacaoTs || st.inicioTs || agora);
            const msDesdeUltimaAgua = Math.max(0, agora - refTs);
            const temRefPosInicio = Number(st.pomodoroUltimaHidratacaoTs || 0) > Number(st.inicioTs || 0);
            const corridoDiaMs = temRefPosInicio
                ? msDesdeUltimaAgua
                : Math.max(msDesdeUltimaAgua, Number(st.corridoMinutos || 0) * 60000);
            const aguaPendente = Boolean(st.pomodoroAguaPendente || corridoDiaMs >= INTERVALO_HIDRATACAO_MS);
            return {
                aguaPendente,
                msDesdeUltimaAgua: corridoDiaMs,
                intervaloMs: INTERVALO_HIDRATACAO_MS
            };
        }

        montarPacotePropaganda(estado = {}, resumo = {}, config = {}, agora = Date.now()) {
            const gov = this.calcularSaldoGovernanca(estado, config, agora);
            const hidr = this.avaliarHidratacao2h(estado, agora, config);
            const ehPausaMaior = Boolean(resumo && (resumo.fase === 'pausa_maior' || (Number(resumo.cicloAtual || 0) >= Number(resumo.ciclosMax || 4))));
            const emDebito = Boolean(
                resumo && !resumo.emDescanso &&
                (resumo.descansoPulado || resumo.descansoPendente || Number(estado && estado.necessidadePausaMs || 0) > 0)
            );
            const emAguardando = Boolean(resumo && resumo.emDescanso && resumo.aguardandoOciosidade);
            const emAlivioAtivo = Boolean(resumo && resumo.emDescanso && !resumo.aguardandoOciosidade);
            const statusContexto = emDebito ? 'debito' : (emAguardando ? 'aguardando' : (emAlivioAtivo ? 'alivio' : 'foco'));

            const lista = [];
            if (hidr.aguaPendente) {
                lista.push(CARD_AGUA);
            }
            if (gov.estadoSaldo === 'excesso_pausas' && resumo && resumo.emDescanso && resumo.descansoMinCumprido && !resumo.descansoPendente) {
                lista.push(CARD_RETORNO_TRABALHO);
            } else if ((emDebito || gov.estadoSaldo === 'precisa_descanso') && (!resumo || !resumo.emDescanso)) {
                lista.push(CARD_INCENTIVO_DESCANSO);
            }

            let poolCombinado;
            if (statusContexto === 'debito') {
                poolCombinado = [...CARDS_DEBITO, ...(ehPausaMaior ? CARDS_PAUSA_MAIOR : CARDS_ALIVIO).filter(c => c.prioridade === 'essencial')];
            } else if (statusContexto === 'aguardando') {
                poolCombinado = [...CARDS_AGUARDANDO, ...(ehPausaMaior ? CARDS_PAUSA_MAIOR : CARDS_ALIVIO)];
            } else if (statusContexto === 'foco') {
                poolCombinado = [...CARDS_FOCO];
            } else {
                const baseFase = ehPausaMaior ? CARDS_PAUSA_MAIOR : CARDS_ALIVIO;
                poolCombinado = [...baseFase, ...CARDS_PROIBIDOS];
            }

            const essenciais = this._embaralharLista(poolCombinado.filter(c => c.prioridade === 'essencial'));
            const normais = this._embaralharLista(poolCombinado.filter(c => c.prioridade !== 'essencial' && c.prioridade !== 'extra'));
            const extras = this._embaralharLista(poolCombinado.filter(c => c.prioridade === 'extra'));
            const secundarios = [...normais, ...extras];

            const adicionarUnico = (card) => {
                if (card && card.chave && !lista.some(x => x.chave === card.chave)) {
                    lista.push(card);
                }
            };

            /* Intercala priorizando as acoes essenciais do status atual (~2 essenciais antes de cada dica complementar/extra) */
            let iEss = 0;
            let iSec = 0;
            while (iEss < essenciais.length || iSec < secundarios.length) {
                for (let k = 0; k < 2 && iEss < essenciais.length; k++) {
                    adicionarUnico(essenciais[iEss++]);
                }
                if (iSec < secundarios.length) {
                    adicionarUnico(secundarios[iSec++]);
                }
            }

            return {
                statusContexto,
                aguaPendente: hidr.aguaPendente,
                cardDestaque: lista[0] || CARDS_ALIVIO[0],
                cardsCiclo: lista,
                governanca: gov,
                duracaoPrimeiraMsgMs: 14000,
                intervaloTrocaMinMs: 7500,
                intervaloTrocaMaxMs: 14500,
                bannerLembreteMinMs: (emDebito || gov.estadoSaldo === 'precisa_descanso') ? 22000 : 45000,
                bannerLembreteMaxMs: (emDebito || gov.estadoSaldo === 'precisa_descanso') ? 38000 : 85000
            };
        }
    }

    Object.freeze(BemEstarPomodoro.prototype);
    return Object.freeze(BemEstarPomodoro);
}));
