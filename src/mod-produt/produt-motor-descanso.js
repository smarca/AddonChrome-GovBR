/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-motor-descanso.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Motor de Descanso, Estágios 25/50/75%, Alarmes e Estados Visuais FEAT-106
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-motor-descanso.js
 * - Classe Exportada: ProdutMotorDescanso (self.JusGovProdutMotorDescanso) extends BaseModulo
 * - Métodos Públicos: arredondarMinutosDescansoExato, resolverEstagioDescanso, resolverParametrosBeepPomodoro, verificarAlarmePomodoro, resolverEstadoVisualMinipopupDescanso, calcularProgressoDescanso, aplicarAtividadeEmEstadoTrabalho, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutMotorDescanso = fabrica(raiz);
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

    class ProdutMotorDescanso extends Base {
        constructor() {
            super('ProdutMotorDescanso');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ProdutMotorDescanso.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ProdutMotorDescanso.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }
        /**
         * Resolve o estágio de proteção do descanso e a mensagem de advertência dourada (FEAT-51).
         * - 0 (0..25%): zera e reinicia em qualquer interação.
         * - 1 (>25..50%): "Descanso Necessário!" (regride tempo enquanto ativo).
         * - 2 (>50..75%): "Descanso em Andamento?" (trava valor enquanto ativo).
         * - 3 (>75%): "Finalizando Descanso..." (movimento/1 clique não trava nem interrompe).
         * Cada 3 cliques/teclas rebaixa 1 estágio. Fora dos últimos 5% (ou mín. 30s), nunca libera avanço em atividade.
         * @param {number} [pct]
         * @param {number} [cliquesPenalidade]
         * @param {number|null} [restanteMs]
         * @param {number} [metaFaseMs]
         * @returns {{ estagioNatural: number, rebaixamentos: number, estagioEfetivo: number, mensagemAviso: string }}
         */
        resolverEstagioDescanso(pct = 0, cliquesPenalidade = 0, restanteMs = null, metaFaseMs = 0) {
            let estagioNatural = 0;
            if (restanteMs !== null && Number.isFinite(Number(restanteMs)) && Number(metaFaseMs) > 0) {
                const restNum = Math.max(0, Number(restanteMs));
                const metaNum = Math.max(1000, Number(metaFaseMs));
                const toleranciaFinalMs = (metaNum <= 60000)
                    ? Math.min(30000, Math.round(metaNum * 0.5))
                    : Math.max(30000, Math.round(metaNum * 0.05));
                if (restNum <= toleranciaFinalMs) {
                    estagioNatural = 3;
                } else if (pct > 0.50) {
                    estagioNatural = 2;
                } else if (pct > 0.25) {
                    estagioNatural = 1;
                }
            } else {
                estagioNatural = (pct > 0.95) ? 3 : ((pct > 0.50) ? 2 : ((pct > 0.25) ? 1 : 0));
            }
            const rebaixamentos = Math.floor(Math.max(0, Number(cliquesPenalidade || 0)) / 3);
            const estagioEfetivo = Math.max(0, estagioNatural - rebaixamentos);
            const MENSAGENS_ESTAGIO = {
                1: 'Descanso Necessário!',
                2: 'Em andamento?',
                3: 'Finalizando Descanso...'
            };
            return {
                estagioNatural,
                rebaixamentos,
                estagioEfetivo,
                mensagemAviso: MENSAGENS_ESTAGIO[estagioEfetivo] || ''
            };
        }

        /**
         * Resolve parâmetros do beep periódico após concluir o tempo de descanso.
         * @param {Object} [config]
         * @returns {{ ativo: boolean, intensidade: 'suave'|'moderado'|'grave', intervaloMs: number }}
         */
        resolverParametrosBeepPomodoro(config = {}) {
            const ativo = (config && config.pomodoroBeepConclusaoAtivo !== false);
            const raw = String((config && config.pomodoroBeepIntensidade) || 'suave').trim().toLowerCase();
            const intensidade = ['suave', 'moderado', 'grave'].includes(raw) ? raw : 'suave';
            const mapaMs = { suave: 15000, moderado: 10000, grave: 5000 };
            return {
                ativo,
                intensidade,
                intervaloMs: mapaMs[intensidade] || 15000
            };
        }

        /**
         * Controlador unificado de alarmes progressivos do Pomodoro Inteligente (FEAT-68 / Seção 6.206).
         * Calcula o comando sonoro para o tick de 1 segundo após estourar o tempo previsto de Alívio/Descanso.
         * @param {number} ciclosFeitos
         * @param {number} ciclosTotais
         * @param {number} tempoDescansoSegundos
         * @param {number} tempoDecorridosFase
         * @param {'DESCANSO_PUNITIVO'|'ATRASO_ABANDONO'} faseAtual
         * @returns {'BEEP_LONGO'|'BEEP_CURTO_TRIPLO'|'BEEP_CURTO'|'BLOQUEAR'|null}
         */
        verificarAlarmePomodoro(
            ciclosFeitos,
            ciclosTotais,
            tempoDescansoSegundos,
            tempoDecorridosFase,
            faseAtual
        ) {
            if (!ciclosTotais || ciclosTotais <= 0) return null;

            const ehDescansoMuitoCurto = (Number(tempoDescansoSegundos) > 0 && Number(tempoDescansoSegundos) < 300);
            const xPorcentagem = Math.min(100, Math.max(0, (ciclosFeitos / ciclosTotais) * 100));
            const fatorY = (1 + 19 * Math.pow(xPorcentagem / 100, 2)) / 100;

            if (tempoDecorridosFase <= 60) {
                if (ehDescansoMuitoCurto) {
                    return (tempoDecorridosFase === 1) ? 'BEEP_CURTO' : null;
                }
                if (tempoDecorridosFase === 1) return 'BEEP_LONGO';
                if (tempoDecorridosFase > 0 && tempoDecorridosFase % 15 === 0) return 'BEEP_CURTO_TRIPLO';
                return null;
            }

            if (faseAtual === 'DESCANSO_PUNITIVO') {
                const baseIntervalo = Math.max(1, Math.floor(fatorY * tempoDescansoSegundos));
                const intervaloDescanso = ehDescansoMuitoCurto ? Math.max(20, baseIntervalo * 3) : baseIntervalo;
                if (tempoDecorridosFase % intervaloDescanso === 0) {
                    return 'BEEP_CURTO';
                }
                return null;
            }

            if (faseAtual === 'ATRASO_ABANDONO') {
                if (tempoDecorridosFase > 14400) {
                    return 'BLOQUEAR';
                }
                if (tempoDecorridosFase > 10800) {
                    if (tempoDecorridosFase % 600 === 0) return 'BEEP_CURTO';
                    return null;
                }
                if (tempoDecorridosFase > 7200) {
                    if (tempoDecorridosFase % 300 === 0) return 'BEEP_CURTO';
                    return null;
                }
                const intervaloCrescente = fatorY * tempoDecorridosFase;
                const minIntervaloAb = ehDescansoMuitoCurto ? 20 : 1;
                const intervaloAplicado = Math.max(minIntervaloAb, Math.floor(Math.min(intervaloCrescente, 300)));
                if (tempoDecorridosFase % intervaloAplicado === 0) {
                    return 'BEEP_CURTO';
                }
            }
            return null;
        }

        /**
         * Resolve o estado visual unificado do minipopup e da tela fosca/screensaver em Alívio/Descanso (FEAT-61).
         * @param {Object} [dadosResumo]
         * @param {number} [agora]
         * @returns {{ estadoVisual: string, textoStatus: string, corBorda: string, bgStatus: string, corStatus: string, fontWeightStatus: string, usarTelaEmbaccada: boolean, usarScreensaver: boolean, descansoConcluidoAoVivo: boolean }}
         */
        resolverEstadoVisualMinipopupDescanso(dadosResumo = {}, agora = Date.now()) {
            const d = (dadosResumo && typeof dadosResumo === 'object') ? dadosResumo : {};
            const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
            const acumuladoMs = Number(d.descansoAcumuladoMs || 0);
            const restanteDescMs = Math.max(0, metaMs - acumuladoMs);
            const concluidoAoVivo = Boolean(d.emDescanso && (d.descansoMinCumprido || acumuladoMs >= metaMs));
            const emIdleDescanso = Boolean(
                d.emDescanso &&
                !d.aguardandoOciosidade &&
                !d.descansoEmAviso &&
                (concluidoAoVivo || agora >= Number(d.descansoAtividadeAteTs || 0))
            );
            if (d.emDescanso && !concluidoAoVivo && d.descansoEmAviso && d.descansoAvisoTexto) {
                const ehMovimentoApenas = (d.descansoUltimoTipoInteracao === 'movimento');
                return {
                    estadoVisual: 'aviso',
                    estadoAutomato: 'PAUSA_AGUARDANDO',
                    podeSalvarEstiloUsuario: false,
                    textoStatus: d.descansoAvisoTexto,
                    corBorda: '#eab308',
                    bgStatus: '#f59e0b',
                    corStatus: '#111827',
                    fontWeightStatus: '700',
                    usarTelaEmbaccada: ehMovimentoApenas,
                    usarScreensaver: false,
                    descansoConcluidoAoVivo: false
                };
            }
            if (concluidoAoVivo) {
                return {
                    estadoVisual: 'concluido',
                    estadoAutomato: 'PAUSA_CONCLUIDA',
                    podeSalvarEstiloUsuario: false,
                    textoStatus: 'Concluído!',
                    textoRetorno: '✅ VOLTAR AO TRABALHO!',
                    corBorda: '#16a34a',
                    bgStatus: '#16a34a',
                    corStatus: '#ffffff',
                    fontWeightStatus: '700',
                    usarTelaEmbaccada: emIdleDescanso,
                    usarScreensaver: emIdleDescanso,
                    descansoConcluidoAoVivo: true
                };
            }
            if (d.emDescanso && !d.aguardandoOciosidade) {
                const emAlertaFimPausa = (restanteDescMs > 0 && restanteDescMs <= 30000);
                return {
                    estadoVisual: 'em_andamento',
                    estadoAutomato: emAlertaFimPausa ? 'PAUSA_ALERTA_FIM' : 'PAUSA_EM_ANDAMENTO',
                    podeSalvarEstiloUsuario: false,
                    textoStatus: 'Em andamento...',
                    corBorda: '#0284c7',
                    bgStatus: 'rgba(2, 132, 199, 0.2)',
                    corStatus: '#bae6fd',
                    fontWeightStatus: '600',
                    usarTelaEmbaccada: emIdleDescanso,
                    usarScreensaver: emIdleDescanso,
                    descansoConcluidoAoVivo: false
                };
            }
            if (d.descansoPendente || d.descansoPulado || (d.emDescanso && d.aguardandoOciosidade)) {
                const ehPausaMaiorPend = (d.tipoDescansoPendente === 'pausa_maior' || d.faseAtual === 'pausa_maior' || d.proximaFase === 'pausa_maior');
                const ehPausaAguardando = Boolean(d.emDescanso && d.aguardandoOciosidade);
                return {
                    estadoVisual: 'pendente',
                    estadoAutomato: ehPausaAguardando ? 'PAUSA_AGUARDANDO' : 'FOCO_PAUSA_PENDENTE',
                    podeSalvarEstiloUsuario: false,
                    textoStatus: ehPausaMaiorPend ? 'Descanso Pendente' : 'Alívio Pendente',
                    corBorda: ehPausaAguardando ? '#eab308' : '#dc2626',
                    bgStatus: ehPausaAguardando ? '#f59e0b' : '#dc2626',
                    corStatus: ehPausaAguardando ? '#111827' : '#ffffff',
                    fontWeightStatus: '700',
                    usarTelaEmbaccada: false,
                    usarScreensaver: false,
                    descansoConcluidoAoVivo: false
                };
            }
            const segRestFoco = Number(d.segRestantes);
            const necAtivMs = Number(d.necessidadeAtividadeMs || 0);
            const ehFocoExtra = (necAtivMs < -60000);
            const ehAlerta30s = (!ehFocoExtra && Number.isFinite(segRestFoco) && segRestFoco > 0 && segRestFoco <= 30);
            const estadoAutomatoFoco = ehFocoExtra ? 'FOCO_EXTRA' : (ehAlerta30s ? 'FOCO_ALERTA_30S' : 'FOCO_NORMAL');
            return {
                estadoVisual: 'ativo',
                estadoAutomato: estadoAutomatoFoco,
                podeSalvarEstiloUsuario: (estadoAutomatoFoco === 'FOCO_NORMAL'),
                textoStatus: '',
                corBorda: '#0d9488',
                bgStatus: 'transparent',
                corStatus: '#cbd5e1',
                fontWeightStatus: '500',
                usarTelaEmbaccada: false,
                usarScreensaver: false,
                descansoConcluidoAoVivo: false
            };
        }

        /**
         * Calcula (e opcionalmente persiste) o progresso contínuo do Alívio/Descanso em milissegundos,
         * aplicando carência de 10s, proteção em 25%/50%/75%, escalada por 3 cliques e recuperação de +5% (FEAT-50 / FEAT-51).
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @param {{ mutar?: boolean, registrarTipo?: string }} [opcoes]
         * @returns {Object}
         */
        calcularProgressoDescanso(estado = {}, agora = Date.now(), config = {}, opcoes = {}) {
            const fase = ['foco', 'alivio', 'pausa_maior'].includes(estado.pomodoroFase) ? estado.pomodoroFase : 'foco';
            const emDescanso = (fase === 'alivio' || fase === 'pausa_maior');
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcao = Number(config && config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            const metaFaseMin = fase === 'pausa_maior' ? pausaMaiorMin : (fase === 'alivio' ? alivioMin : focoMin);
            const metaCustomMs = (emDescanso && Number(estado.pomodoroMetaCustomMs || 0) > 0)
                ? Math.max(1000, Number(estado.pomodoroMetaCustomMs))
                : 0;
            const metaFaseMs = metaCustomMs > 0 ? metaCustomMs : (metaFaseMin * 60000);

            if (!emDescanso) {
                return {
                    emDescanso: false,
                    metaFaseMin,
                    metaFaseMs,
                    acumuladoMs: 0,
                    syncTs: 0,
                    atividadeAteTs: 0,
                    emAtividade: false,
                    cliquesPenalidade: 0,
                    ultimoCliqueTs: 0,
                    estagioNatural: 0,
                    rebaixamentos: 0,
                    estagioEfetivo: 0,
                    mensagemAviso: '',
                    emAviso: false,
                    ultimoTipoInteracao: '',
                    aguardandoOciosidade: false,
                    restanteMs: metaFaseMs,
                    segRestantes: metaFaseMin * 60,
                    terminaEmTs: agora + metaFaseMs,
                    passo5PctMs: Math.max(1000, Math.round(metaFaseMs * 0.05)),
                    resetouDescanso: false
                };
            }

            let syncTs = Number(estado.pomodoroDescansoSyncTs || 0);
            let atividadeAteTs = Number(estado.pomodoroDescansoAtividadeAteTs || 0);
            let cliques = Math.max(0, Math.floor(Number(estado.pomodoroDescansoCliquesPenalidade || 0)));
            let ultimoCliqueTs = Number(estado.pomodoroDescansoUltimoCliqueTs || 0);
            let ultimoTipoInteracao = String(estado.pomodoroDescansoUltimoTipoInteracao || '');
            const minNaFaseIni = Math.max(0, Math.floor(Number(estado.pomodoroMinutosNaFase || 0)));
            let acumulado;
            let tPrev;

            if (!syncTs) {
                const msDesdeAtiv = Math.max(0, agora - Number(estado.ultimaAtividadeTs || agora));
                acumulado = Math.max(Number(estado.pomodoroDescansoAcumuladoMs || 0), minNaFaseIni * 60000, msDesdeAtiv);
                tPrev = agora;
            } else {
                acumulado = Math.max(0, Number(estado.pomodoroDescansoAcumuladoMs || 0));
                tPrev = Math.min(agora, syncTs);
            }

            if (syncTs > 0 && agora > tPrev) {
                const tFimAtiv = Math.min(agora, atividadeAteTs);
                const dtAtivo = Math.max(0, tFimAtiv - tPrev);
                const dtOcioso = Math.max(0, agora - Math.max(tPrev, tFimAtiv));

                if (dtAtivo > 0) {
                    const pctAtiv = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
                    const restAtiv = Math.max(0, metaFaseMs - acumulado);
                    const estAtiv = this.resolverEstagioDescanso(pctAtiv, cliques, restAtiv, metaFaseMs);
                    if (estAtiv.estagioEfetivo === 3) {
                        acumulado += dtAtivo;
                    } else if (estAtiv.estagioEfetivo === 2) {
                        /* Pausa avanço no estágio 2 (fora dos últimos 5% / mín. 30s) até o retorno de ociosidade (10s) */
                    } else if (estAtiv.estagioEfetivo === 1) {
                        acumulado = Math.max(0, acumulado - dtAtivo);
                    } else {
                        acumulado = 0;
                        cliques = 0;
                        ultimoCliqueTs = 0;
                        atividadeAteTs = 0;
                    }
                }

                if (cliques > 0 && ultimoCliqueTs > 0 && !estado.pomodoroDescansoMinCumprido) {
                    const semCliqueMs = Math.max(0, agora - ultimoCliqueTs);
                    const restanteRecMs = Math.max(0, metaFaseMs - acumulado);
                    const passoRecMs = Math.max(1000, Math.round(restanteRecMs * 0.05));
                    if (semCliqueMs >= passoRecMs) {
                        if (cliques >= 3) {
                            const rec = Math.floor(semCliqueMs / passoRecMs);
                            cliques = Math.max(0, cliques - rec * 3);
                            ultimoCliqueTs = cliques > 0 ? (ultimoCliqueTs + rec * passoRecMs) : 0;
                        } else {
                            cliques = 0;
                            ultimoCliqueTs = 0;
                        }
                    }
                }

                if (dtOcioso > 0) {
                    acumulado += dtOcioso;
                }
            }

            const registrarTipo = (opcoes && typeof opcoes.registrarTipo === 'string') ? opcoes.registrarTipo : '';
            let resetouDescanso = false;
            if ((registrarTipo === 'movimento' || registrarTipo === 'click_ou_tecla') && !estado.pomodoroDescansoMinCumprido) {
                if (registrarTipo === 'click_ou_tecla') {
                    cliques += 1;
                    ultimoCliqueTs = agora;
                    ultimoTipoInteracao = 'click_ou_tecla';
                } else {
                    const pctMovPre = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
                    const restMovPre = Math.max(0, metaFaseMs - acumulado);
                    const estMovPre = this.resolverEstagioDescanso(pctMovPre, cliques, restMovPre, metaFaseMs);
                    if (!(agora < atividadeAteTs && ultimoTipoInteracao === 'click_ou_tecla') && estMovPre.rebaixamentos === 0) {
                        ultimoTipoInteracao = 'movimento';
                    }
                }
                const pctAgora = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
                const restAgora = Math.max(0, metaFaseMs - acumulado);
                const estAgora = this.resolverEstagioDescanso(pctAgora, cliques, restAgora, metaFaseMs);
                if (estAgora.estagioEfetivo === 0) {
                    acumulado = 0;
                    cliques = 0;
                    ultimoCliqueTs = 0;
                    atividadeAteTs = 0;
                    syncTs = 0;
                    ultimoTipoInteracao = '';
                    resetouDescanso = true;
                } else {
                    atividadeAteTs = agora + 10000;
                    syncTs = agora;
                }
            } else if (opcoes && opcoes.mutar && !resetouDescanso && (syncTs > 0 || atividadeAteTs > 0 || cliques > 0)) {
                syncTs = agora;
            }

            const pctFinal = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
            const restFinalEst = Math.max(0, metaFaseMs - acumulado);
            const estFinal = this.resolverEstagioDescanso(pctFinal, cliques, restFinalEst, metaFaseMs);
            const emAtividade = Boolean(agora < atividadeAteTs);
            const emAviso = Boolean(!estado.pomodoroDescansoMinCumprido && (emAtividade || estFinal.rebaixamentos > 0) && estFinal.estagioEfetivo >= 1);
            if (!emAtividade && estFinal.rebaixamentos === 0) {
                ultimoTipoInteracao = '';
            }
            const mensagemAviso = emAviso ? estFinal.mensagemAviso : '';
            const minutosCalc = Math.floor(acumulado / 60000);
            const aguardandoOciosidade = Boolean(acumulado < 10000 && minutosCalc === 0 && (syncTs > 0 ? true : minNaFaseIni === 0));
            const restanteMs = aguardandoOciosidade ? metaFaseMs : Math.max(0, metaFaseMs - acumulado);
            const segRestantes = aguardandoOciosidade ? Math.max(0, Math.ceil(metaFaseMs / 1000)) : Math.max(0, Math.ceil(restanteMs / 1000));
            const terminaEmTs = agora + restanteMs;
            const passo5PctMs = Math.max(1000, Math.round(Math.max(0, metaFaseMs - acumulado) * 0.05));

            if (opcoes && opcoes.mutar) {
                estado.pomodoroDescansoAcumuladoMs = acumulado;
                estado.pomodoroDescansoSyncTs = resetouDescanso ? 0 : syncTs;
                estado.pomodoroDescansoAtividadeAteTs = atividadeAteTs;
                estado.pomodoroDescansoCliquesPenalidade = cliques;
                estado.pomodoroDescansoUltimoCliqueTs = ultimoCliqueTs;
                estado.pomodoroDescansoUltimoTipoInteracao = resetouDescanso ? '' : ultimoTipoInteracao;
                if (resetouDescanso) {
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = false;
                    estado.pomodoroDescansoPendente = true;
                } else if (syncTs > 0 && !estado.pomodoroDescansoMinCumprido) {
                    estado.pomodoroMinutosNaFase = minutosCalc;
                }
            }

            return {
                emDescanso: true,
                metaFaseMin,
                metaFaseMs,
                acumuladoMs: acumulado,
                syncTs,
                atividadeAteTs,
                emAtividade,
                cliquesPenalidade: cliques,
                ultimoCliqueTs,
                estagioNatural: estFinal.estagioNatural,
                rebaixamentos: estFinal.rebaixamentos,
                estagioEfetivo: estFinal.estagioEfetivo,
                mensagemAviso,
                emAviso,
                ultimoTipoInteracao: (emAviso || emAtividade) ? ultimoTipoInteracao : '',
                aguardandoOciosidade,
                restanteMs,
                segRestantes,
                terminaEmTs,
                passo5PctMs,
                resetouDescanso
            };
        }

        /**
         * Aplica detecção de atividade no objeto de estado (função pura para testes e SW).
         * @param {Object} estado
         * @param {number} [agora]
         * @param {string} [tipoInteracao] 'click_ou_tecla' | 'movimento'
         * @param {Object} [config]
         * @returns {{ resetouDescanso: boolean, iniciouFocoPosDescanso: boolean, iniciouBadgeVerde: boolean, ocultouBadgeVerde: boolean, alterouDescanso: boolean, estagioEfetivo?: number, mensagemAviso?: string }}
         */
        aplicarAtividadeEmEstadoTrabalho(estado, agora = Date.now(), tipoInteracao = 'click_ou_tecla', config = {}) {
            if (!estado || typeof estado !== 'object') {
                return { resetouDescanso: false, iniciouFocoPosDescanso: false, iniciouBadgeVerde: false, ocultouBadgeVerde: false, alterouDescanso: false };
            }
            const descPendenteAntes = Boolean(
                (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') &&
                !estado.pomodoroDescansoMinCumprido
            );
            /* Se o acumulado ocioso ja cumpriu a meta antes do alarme de 1min, promove descanso para cumprido antes de processar a interacao */
            if (descPendenteAntes) {
                const checkCumprido = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                if (checkCumprido && checkCumprido.acumuladoMs >= checkCumprido.metaFaseMs) {
                    const acumCheckMs = Math.max(
                        Number(checkCumprido.acumuladoMs || 0),
                        Number(estado.pomodoroDescansoAcumuladoMs || 0)
                    );
                    estado.pomodoroDescansoMinCumprido = true;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroUltimaHidratacaoTs = agora;
                    estado.pomodoroAguaPendente = false;
                    estado.pomodoroDescansoAcumuladoMs = acumCheckMs;
                    estado.pomodoroDescansoSyncTs = agora;
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = Math.min(agora, Number(checkCumprido.terminaEmTs || agora));
                    estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(acumCheckMs || checkCumprido.metaFaseMs || 60000);
                }
            }
            const aindaPendenteAntes = Boolean(
                (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') &&
                !estado.pomodoroDescansoMinCumprido
            );
            const progAntes = aindaPendenteAntes
                ? this.calcularProgressoDescanso(estado, agora, config, { mutar: true, registrarTipo: tipoInteracao })
                : null;
            if (estado.emPausa && estado.pomodoroFase === 'foco' && Number(estado.pomodoroPausaInicioTs || 0) > 0) {
                estado.pomodoroFocoPausadoMs = Number(estado.pomodoroFocoPausadoMs || 0) + Math.max(0, agora - Number(estado.pomodoroPausaInicioTs));
                estado.pomodoroPausaInicioTs = 0;
            }
            estado.ultimaAtividadeTs = agora;
            estado.emPausa = false;
            estado.minutosInativosPendentes = 0;
            estado._nivelAutoCreditado = '';
            let iniciouBadgeVerde = false;
            let ocultouBadgeVerde = false;

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                if (estado.pomodoroDescansoMinCumprido) {
                    /* Qualquer interacao sensivel (mouse move, click ou tecla) apos concluir o descanso inicia o Foco, contabilizando inclusive todo o tempo extra passado */
                    const ehMovimento = (tipoInteracao === 'movimento');
                    const progConclReal = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                    const creditoRealMs = Math.max(
                        Number(progConclReal && progConclReal.acumuladoMs || 0),
                        Number(estado.pomodoroDescansoAcumuladoMs || 0),
                        Number(estado.pomodoroMetaCustomMs || 0),
                        Number(estado.pomodoroMinutosNaFase || 0) * 60000
                    );
                    const durTotalRealMin = this.arredondarMinutosDescansoExato(creditoRealMs);
                    const focoSalvoMs = Math.max(0, Number(estado.pomodoroFocoAcumuladoAntesPausaMs || 0));
                    const metaDescConclMs = Number(progConclReal && progConclReal.metaFaseMs || 0) || Math.max(60000, Number(estado.pomodoroMetaCustomMs || 0) || 60000);
                    /* Compensação unidirecional: necessidade_pausa < 0 (descansou a mais) abate necessidade_atividade > 0 do próximo ciclo */
                    const excessoDescMs = Math.max(0, creditoRealMs - metaDescConclMs);
                    const focoMinCfgRet = Math.max(25, Number((config && config.pomodoroFocoMinutos) || 45));
                    const focoMetaRetMs = focoMinCfgRet * 60000;
                    /* Excesso de descanso (ex.: folga longa de 2h) jamais avança o cronômetro do próximo Foco;
                     * preserva apenas eventual foco salvo antes de pausa flexível no meio do ciclo (RN-07). */
                    const focoSalvoEfetivoMs = (estado.pomodoroFase === 'pausa_maior') ? 0 : focoSalvoMs;
                    const focoInicialCompMs = Math.min(Math.max(0, focoMetaRetMs - 60000), focoSalvoEfetivoMs);
                    if (estado.pomodoroFase === 'pausa_maior') {
                        estado.pomodoroCicloAtual = 0;
                        estado.pausaMaiorSaldoMs = 0;
                        estado.pausaMaiorDeslocamentos = 0;
                    } else if (excessoDescMs > 0 && typeof this._aplicarProtecaoEDeslocamentoPausaMaior === 'function') {
                        this._aplicarProtecaoEDeslocamentoPausaMaior(estado, excessoDescMs, config);
                    }
                    const creditoDescansoFinalMs = Math.max(60000, creditoRealMs);
                    estado.pomodoroDescansoTotalMs = Math.max(0, Number(estado.pomodoroDescansoTotalMs || 0)) + creditoDescansoFinalMs;
                    this._registrarHistoricoRoundPomodoro(
                        estado,
                        Number(estado.pomodoroFocoRodadaMs || focoSalvoMs || 0),
                        creditoDescansoFinalMs,
                        agora,
                        estado.pomodoroFase === 'pausa_maior'
                    );
                    estado.pomodoroFocoRodadaMs = 0;
                    estado.pomodoroUltimaHidratacaoTs = agora;
                    estado.pomodoroAguaPendente = false;
                    estado.pomodoroMetaCustomMs = 0;
                    estado.pomodoroDescansoPulado = false;
                    estado.pomodoroDescansoSaldoRestanteMs = 0;
                    estado.pomodoroDescansoSaldoTipo = '';
                    estado.pomodoroFocoAcumuladoAntesPausaMs = 0;
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = agora;
                    estado.pomodoroUltimoDescansoDuracaoMin = durTotalRealMin;
                    estado.pomodoroBadgeVerdeAteTs = ehMovimento ? (agora + 15000) : 1;
                    estado.pomodoroSemScreensaverAteTs = 0;
                    iniciouBadgeVerde = ehMovimento;
                    ocultouBadgeVerde = !ehMovimento;
                    estado.pomodoroFase = 'foco';
                    estado.pomodoroMinutosNaFase = focoInicialCompMs > 0 ? Math.floor(focoInicialCompMs / 60000) : 0;
                    estado.pomodoroFaseInicioTs = focoInicialCompMs > 0 ? (agora - focoInicialCompMs) : agora;
                    estado.necessidadeAtividadeMs = Math.max(0, focoMetaRetMs - focoInicialCompMs);
                    estado.necessidadePausaMs = 0;
                    estado.saldoAtividadeRecebido = true;
                    estado.saldoPausaRecebido = false;
                    estado.pomodoroFocoPausadoMs = 0;
                    estado.pomodoroPausaInicioTs = 0;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroDescansoAcumuladoMs = 0;
                    estado.pomodoroDescansoSyncTs = 0;
                    estado.pomodoroDescansoAtividadeAteTs = 0;
                    estado.pomodoroDescansoCliquesPenalidade = 0;
                    estado.pomodoroDescansoUltimoCliqueTs = 0;
                    estado.pomodoroDescansoUltimoTipoInteracao = '';
                    estado.pomodoroModalDescansoChave = '';
                    estado.pomodoroModalFechadoNestaPausa = false;
                    if (estado.pomodoroPularProximoPopupFoco) {
                        estado.pomodoroPularProximoPopupFoco = false;
                        estado.pomodoroBarraOcultadaChave = `foco:${(estado.pomodoroCicloAtual || 0) + 1}:${agora}`;
                    } else {
                        estado.pomodoroBarraOcultadaChave = '';
                    }
                    return { resetouDescanso: true, iniciouFocoPosDescanso: true, iniciouBadgeVerde, ocultouBadgeVerde, alterouDescanso: true };
                }

                /* BUG-102 / BUG-86: Só desloca ao topo central sem screensaver (15s) se a atividade realmente pausou/regrediu/reiniciou o descanso */
                if (progAntes && (progAntes.emAviso || progAntes.resetouDescanso)) {
                    estado.pomodoroSemScreensaverAteTs = agora + 15000;
                }

                /* FEAT-51: aplica progressão escalonada (<=25% zera, >25% regride, >50% trava, >75% não quebra + 3 cliques por estágio) */
                return {
                    resetouDescanso: progAntes.resetouDescanso,
                    iniciouFocoPosDescanso: false,
                    iniciouBadgeVerde: false,
                    ocultouBadgeVerde: false,
                    alterouDescanso: true,
                    estagioEfetivo: progAntes.estagioEfetivo,
                    mensagemAviso: progAntes.mensagemAviso
                };
            }

            if (Number(estado.pomodoroUltimoDescansoFimTs || 0) > 0) {
                if (tipoInteracao === 'click_ou_tecla') {
                    if (Number(estado.pomodoroBadgeVerdeAteTs || 0) !== 1) {
                        estado.pomodoroBadgeVerdeAteTs = 1;
                        ocultouBadgeVerde = true;
                    }
                } else if (!Number(estado.pomodoroBadgeVerdeAteTs || 0)) {
                    estado.pomodoroBadgeVerdeAteTs = agora + 15000;
                    iniciouBadgeVerde = true;
                }
            }
            return { resetouDescanso: false, iniciouFocoPosDescanso: false, iniciouBadgeVerde, ocultouBadgeVerde, alterouDescanso: (iniciouBadgeVerde || ocultouBadgeVerde) };
        }
    }

    Object.freeze(ProdutMotorDescanso.prototype);
    return Object.freeze(ProdutMotorDescanso);
}));