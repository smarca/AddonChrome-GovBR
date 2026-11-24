/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-motor-flexivel.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Pomodoro Flexível, Pausas Automáticas e Modais Globais
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-motor-flexivel.js
 * - Classe Exportada: ProdutMotorFlexivel (self.JusGovProdutMotorFlexivel) extends BaseModulo
 * - Métodos Públicos: pularDescansoEIniciarFoco, _registrarHistoricoRoundPomodoro, obterTempoFocoDecorrenteMs, retomarDescansoFlexivel, alternarPausaOuAdiantarDescanso, resolverPreferenciasAvisoPomodoro, registrarPausasAutomaticasProdutividade, obterDadosModalDescanso, projetarModalProdutividadeEmTodasJanelas, fecharModalProdutividadeEmTodasJanelas, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutMotorFlexivel = fabrica(raiz);
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

    class ProdutMotorFlexivel extends Base {
        constructor() {
            super('ProdutMotorFlexivel');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ProdutMotorFlexivel.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ProdutMotorFlexivel.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        /**
         * Pula o descanso corrente (Alivio ou Pausa Maior) e inicia imediatamente o proximo ciclo de Foco.
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {Object}
         */
        pularDescansoEIniciarFoco(estado, agora = Date.now(), config = {}) {
            if (!estado || typeof estado !== 'object') return estado;
            const estavaEmDescanso = (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior');
            const faseAntes = estado.pomodoroFase;
            let acumuladoDescMs = 0;
            let restanteDescMs = 0;
            if (estavaEmDescanso) {
                const prog = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                acumuladoDescMs = Math.max(0, Number(prog && prog.acumuladoMs || 0));
                restanteDescMs = Math.max(0, Number(prog && prog.restanteMs || 0));
                if (acumuladoDescMs > 0) {
                    estado.pomodoroDescansoTotalMs = Math.max(0, Number(estado.pomodoroDescansoTotalMs || 0)) + acumuladoDescMs;
                }
            }
            const ciclosMax = Math.max(2, Number((config && config.pomodoroCiclos) || 4));
            if (estado.pomodoroFase === 'pausa_maior' || Number(estado.pomodoroCicloAtual || 0) >= ciclosMax) {
                estado.pomodoroCicloAtual = 0;
            }
            const focoMinCfg = Math.max(25, Number((config && config.pomodoroFocoMinutos) || 45));
            const focoMetaMs = focoMinCfg * 60000;
            const focoSalvoBrutoMs = Math.max(0, Number(estado.pomodoroFocoAcumuladoAntesPausaMs || 0));
            /* Só restaura foco salvo se o usuário pausou antes do fim do ciclo (< meta); se pulou após completar foco (Pendente), inicia novo ciclo em 00:00 sem re-disparar descanso imediato */
            const focoSalvoMs = (focoSalvoBrutoMs > 0 && focoSalvoBrutoMs < Math.max(10000, focoMetaMs - 5000)) ? focoSalvoBrutoMs : 0;
            estado.pomodoroFocoAcumuladoAntesPausaMs = 0;
            estado.pomodoroMetaCustomMs = 0;
            if (estavaEmDescanso && !estado.pomodoroDescansoMinCumprido && restanteDescMs > 0) {
                estado.pomodoroDescansoPulado = true;
                estado.pomodoroDescansoSaldoRestanteMs = restanteDescMs;
                estado.pomodoroDescansoSaldoTipo = (faseAntes === 'pausa_maior') ? 'pausa_maior' : 'alivio';
                estado.necessidadePausaMs = restanteDescMs;
            } else {
                estado.pomodoroDescansoPulado = false;
                estado.pomodoroDescansoSaldoRestanteMs = 0;
                estado.pomodoroDescansoSaldoTipo = '';
                estado.necessidadePausaMs = 0;
            }
            estado.pomodoroFase = 'foco';
            if (focoSalvoMs === 0) {
                estado.saldoPausaRecebido = false;
                estado.saldoAtividadeRecebido = true;
            }
            estado.pomodoroMinutosNaFase = focoSalvoMs > 0 ? Math.floor(focoSalvoMs / 60000) : 0;
            estado.pomodoroFaseInicioTs = focoSalvoMs > 0 ? (agora - focoSalvoMs) : agora;
            estado.pomodoroFocoPausadoMs = 0;
            estado.pomodoroPausaInicioTs = 0;
            estado.emPausa = false;
            estado.ultimaAtividadeTs = agora;
            estado.minutosInativosPendentes = 0;
            estado._nivelAutoCreditado = '';
            estado.pomodoroDescansoMinCumprido = false;
            estado.pomodoroDescansoRealizadoNoCiclo = false;
            estado.pomodoroDescansoPendente = false;
            estado.pomodoroDescansoAcumuladoMs = 0;
            estado.pomodoroDescansoSyncTs = 0;
            estado.pomodoroDescansoAtividadeAteTs = 0;
            estado.pomodoroDescansoCliquesPenalidade = 0;
            estado.pomodoroDescansoUltimoCliqueTs = 0;
            estado.pomodoroDescansoUltimoTipoInteracao = '';
            estado.pomodoroModalDescansoChave = '';
            estado.pomodoroModalFechadoNestaPausa = true;
            estado.pomodoroPularProximoPopupFoco = false;
            estado.pomodoroBarraOcultadaChave = '';
            return estado;
        }

        /**
         * Registra histórico ponderado do round concluído/pausado para cálculo justo de mérito (FEAT-77).
         */
        _registrarHistoricoRoundPomodoro(estado, focoMs, descansoMs, agora = Date.now(), fechouBloco = false) {
            if (!estado || typeof estado !== 'object') return;
            if (!Array.isArray(estado.pomodoroHistoricoRounds)) {
                estado.pomodoroHistoricoRounds = [];
            }
            const blocoAtual = Math.max(0, Math.floor(Number(estado.pomodoroBlocoAtual || 0)));
            estado.pomodoroHistoricoRounds.push({
                blocoIdx: blocoAtual,
                cicloIdx: Math.max(0, Math.floor(Number(estado.pomodoroCicloAtual || 0))),
                focoMs: Math.max(0, Number(focoMs || 0)),
                descansoMs: Math.max(0, Number(descansoMs || 0)),
                ts: agora
            });
            if (estado.pomodoroHistoricoRounds.length > 24) {
                estado.pomodoroHistoricoRounds.splice(0, estado.pomodoroHistoricoRounds.length - 24);
            }
            if (fechouBloco) {
                estado.pomodoroBlocoAtual = blocoAtual + 1;
            }
        }

        /**
         * Calcula milissegundos exatos decorridos na fase Foco corrente (FEAT-77).
         */
        obterTempoFocoDecorrenteMs(estado, config = {}, agora = Date.now()) {
            if (!estado || typeof estado !== 'object' || estado.pomodoroFase !== 'foco') return 0;
            const res = this.calcularResumoPomodoro(estado, config, agora, null);
            return Math.max(0, Number(res && res.segundosDecorridos || 0) * 1000);
        }

        /**
         * FEAT-77: Retoma um Alívio/Descanso anteriormente pulado (botão Continuar ao passar o mouse),
         * congelando o contador atual de Foco para retomá-lo ao fim do descanso, sujeito à governança 4.5:1.
         */
        retomarDescansoFlexivel(estado, agora = Date.now(), config = {}) {
            if (!estado || typeof estado !== 'object') return { ok: false, motivo: 'Estado inválido.' };
            if (estado.pomodoroFase !== 'foco' || !estado.pomodoroDescansoPulado || Number(estado.pomodoroDescansoSaldoRestanteMs || 0) <= 0) {
                return { ok: false, motivo: 'Não há descanso pulado pendente para retomar.' };
            }
            const gov = (this._bemEstar && typeof this._bemEstar.calcularSaldoGovernanca === 'function')
                ? this._bemEstar.calcularSaldoGovernanca(estado, config, agora)
                : { podeContinuarDescanso: true, fatorPrivilegio: 1, mensagemGovernanca: '' };
            if (!gov.podeContinuarDescanso) {
                return { ok: false, motivo: gov.mensagemGovernanca || 'Limite diário de pausas excedido (4.5:1).', governanca: gov };
            }

            const focoAtualMs = this.obterTempoFocoDecorrenteMs(estado, config, agora);
            const saldoBrutoMs = Math.max(15000, Number(estado.pomodoroDescansoSaldoRestanteMs || 0));
            const calcExc = this._calcularAcrescimoExcessoTrabalhoMs(focoAtualMs, config, saldoBrutoMs);
            const fator = Math.max(0.25, Math.min(1, Number(gov.fatorPrivilegio || 1)));
            const saldoEfetivoMs = Math.max(15000, Math.min(calcExc.pausaMaiorMs, Math.round(calcExc.totalPausaMs * fator)));
            const tipoRestaurar = (calcExc.atingiuDescanso || estado.pomodoroDescansoSaldoTipo === 'pausa_maior') ? 'pausa_maior' : 'alivio';

            estado.pomodoroFocoAcumuladoAntesPausaMs = focoAtualMs;
            estado.pomodoroMetaCustomMs = calcExc.atingiuDescanso ? 0 : saldoEfetivoMs;
            estado.necessidadePausaMs = saldoEfetivoMs;
            estado.pomodoroDescansoPulado = false;
            estado.pomodoroDescansoSaldoRestanteMs = 0;
            estado.pomodoroDescansoSaldoTipo = '';
            estado.pomodoroFase = tipoRestaurar;
            estado.pomodoroMinutosNaFase = 0;
            estado.pomodoroFaseInicioTs = agora;
            estado.pomodoroFocoPausadoMs = 0;
            estado.pomodoroPausaInicioTs = 0;
            estado.emPausa = false;
            estado.ultimaAtividadeTs = agora;
            estado.pomodoroDescansoMinCumprido = false;
            estado.pomodoroDescansoRealizadoNoCiclo = false;
            estado.pomodoroDescansoPendente = true;
            estado.pomodoroBancoOrigemFoco = '';
            estado.pomodoroBancoOrigemDescanso = '';
            estado.pomodoroDescansoAcumuladoMs = 0;
            estado.pomodoroDescansoSyncTs = agora;
            estado.pomodoroDescansoAtividadeAteTs = agora + 2500;
            estado.pomodoroSemScreensaverAteTs = agora + 15000;
            estado.pomodoroDescansoCliquesPenalidade = 0;
            estado.pomodoroDescansoUltimoCliqueTs = 0;
            estado.pomodoroDescansoUltimoTipoInteracao = '';
            estado.pomodoroBarraOcultadaChave = '';
            return { ok: true, acao: 'retomou_descanso', fase: tipoRestaurar, saldoMs: saldoEfetivoMs, governanca: gov };
        }

        /**
         * FEAT-77: Alterna flexivelmente pelo botão Parar (hover):
         * - No Foco: adianta um Alívio salvando o contador de Foco (se dentro da governança 4.5:1);
         * - No Alívio/Descanso: pausa o descanso salvando saldo restante e volta para Foco em itálico.
         */
        alternarPausaOuAdiantarDescanso(estado, agora = Date.now(), config = {}, opcoes = {}) {
            if (!estado || typeof estado !== 'object') return { ok: false, motivo: 'Estado inválido.' };
            const gov = (this._bemEstar && typeof this._bemEstar.calcularSaldoGovernanca === 'function')
                ? this._bemEstar.calcularSaldoGovernanca(estado, config, agora)
                : { podeAdiantarDescanso: true, podePausarDescanso: true, fatorPrivilegio: 1, mensagemGovernanca: '' };

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                if (!gov.podePausarDescanso) {
                    return { ok: false, motivo: gov.mensagemGovernanca || 'Cumpra ao menos 1/3 do descanso e tenha mérito para pausar.', governanca: gov };
                }
                const focoRodadaMs = Number(estado.pomodoroFocoRodadaMs || estado.pomodoroFocoAcumuladoAntesPausaMs || 0);
                const progAntes = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                this._registrarHistoricoRoundPomodoro(estado, focoRodadaMs, Number(progAntes && progAntes.acumuladoMs || 0), agora, false);
                this.pularDescansoEIniciarFoco(estado, agora, config);
                return {
                    ok: true,
                    acao: 'pausou_descanso',
                    saldoRestanteMs: Number(estado.pomodoroDescansoSaldoRestanteMs || 0)
                };
            }

            if (!(opcoes && opcoes.manual) && !gov.podeAdiantarDescanso) {
                return { ok: false, motivo: gov.mensagemGovernanca || 'Limite diário de pausas excedido (4.5:1).', governanca: gov };
            }

            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            const proporcao = Math.max(1, Number(config && config.pomodoroProporcao || 4.5));
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const focoAtualMs = this.obterTempoFocoDecorrenteMs(estado, config, agora);
            const fator = Math.max(0.25, Math.min(1, Number(gov.fatorPrivilegio || 1)));
            const metaAlivioMs = Math.max(60000, Math.round(alivioMin * 60000 * fator));

            estado.pomodoroFocoAcumuladoAntesPausaMs = focoAtualMs;
            estado.pomodoroFocoRodadaMs = focoAtualMs;
            estado.pomodoroMetaCustomMs = (fator < 1) ? metaAlivioMs : 0;
            estado.pomodoroDescansoPulado = false;
            estado.pomodoroDescansoSaldoRestanteMs = 0;
            estado.pomodoroDescansoSaldoTipo = '';
            estado.pomodoroFase = 'alivio';
            estado.pomodoroMinutosNaFase = 0;
            estado.pomodoroFaseInicioTs = agora;
            estado.pomodoroFocoPausadoMs = 0;
            estado.pomodoroPausaInicioTs = 0;
            estado.emPausa = false;
            estado.ultimaAtividadeTs = agora;
            estado.pomodoroDescansoMinCumprido = false;
            estado.pomodoroDescansoRealizadoNoCiclo = false;
            estado.pomodoroDescansoPendente = true;
            estado.pomodoroBancoOrigemFoco = '';
            estado.pomodoroBancoOrigemDescanso = '';
            estado.pomodoroDescansoAcumuladoMs = 0;
            estado.pomodoroDescansoSyncTs = agora;
            estado.pomodoroDescansoAtividadeAteTs = agora + 2500;
            estado.pomodoroSemScreensaverAteTs = agora + 15000;
            estado.pomodoroDescansoCliquesPenalidade = 0;
            estado.pomodoroDescansoUltimoCliqueTs = 0;
            estado.pomodoroDescansoUltimoTipoInteracao = '';
            estado.pomodoroBarraOcultadaChave = '';
            return { ok: true, acao: 'adiantou_descanso', fase: 'alivio', metaMs: metaAlivioMs, governanca: gov };
        }

        /**
         * Resolve preferências de exibição dos avisos/contadores Pomodoro a partir de pomodoroModoAviso.
         * @param {Object} [config]
         * @returns {{ modo: string, usarModal: boolean, usarBadge: boolean, modoBarra: string }}
         */
        resolverPreferenciasAvisoPomodoro(config = {}) {
            const modo = (config && typeof config.pomodoroModoAviso === 'string') ? config.pomodoroModoAviso : 'completo';
            const usarModal = (modo === 'modal' || modo === 'completo');
            const usarBadge = (modo === 'badge' || modo === 'badge_e_barra_descanso' || modo === 'completo');
            let modoBarra = 'nunca';
            if (modo === 'barra_sempre' || modo === 'completo') {
                modoBarra = 'sempre';
            } else if (modo === 'barra_descanso' || modo === 'badge_e_barra_descanso') {
                modoBarra = 'descanso';
            }
            return { modo, usarModal, usarBadge, modoBarra };
        }

        /**
         * Aplica crédito automático de Alívio ou Descanso Maior (com reinício de ciclo) quando o usuário
         * permanece ocioso pelo tempo mínimo configurado e "Registrar Pausas Automáticas" está ativo (FEAT-37).
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {{ creditado: boolean, tipo: string }}
         */
        registrarPausasAutomaticasProdutividade(estado, agora = Date.now(), config = {}) {
            if (!estado || (config && config.pomodoroPausasAutomaticas === false)) {
                return { creditado: false, tipo: 'desativado' };
            }
            const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 45));
            const proporcao = Number(config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));

            const ultimaAtivTs = Number(estado.ultimaAtividadeTs || agora);
            const msInativo = Math.max(0, agora - ultimaAtivTs);
            const minInativo = Math.floor(msInativo / 60000);
            const nivelAnterior = (estado._ultimoIdleAutoCreditadoTs === ultimaAtivTs) ? (estado._nivelAutoCreditado || '') : '';

            if (minInativo >= pausaMaiorMin && nivelAnterior !== 'pausa_maior') {
                /* FEAT-38: Descanso detectado automaticamente exibe o popup de Descanso Maior contando continuamente até voltar a interagir */
                estado.pomodoroFase = 'pausa_maior';
                estado.pomodoroMinutosNaFase = minInativo;
                estado.pomodoroCicloAtual = 0;
                estado.pomodoroDescansoRealizadoNoCiclo = true;
                estado.pomodoroDescansoPendente = false;
                estado.pomodoroDescansoMinCumprido = true;
                estado.pomodoroDescansoPulado = false;
                estado.pomodoroDescansoSaldoRestanteMs = 0;
                estado.pomodoroDescansoSaldoTipo = '';
                estado.necessidadePausaMs = 0;
                estado.pomodoroMetaCustomMs = 0;
                estado.pomodoroDescansoAcumuladoMs = msInativo;
                estado.pomodoroDescansoSyncTs = agora;
                estado.pomodoroDescansoAtividadeAteTs = 0;
                estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                estado.pomodoroUltimoDescansoFimTs = agora;
                estado.pomodoroUltimoDescansoDuracaoMin = Math.max(1, minInativo);
                estado.pomodoroBadgeVerdeAteTs = 0;
                estado.pomodoroPularProximoPopupFoco = false;
                estado.pomodoroBarraOcultadaChave = '';
                estado.pomodoroFaseInicioTs = ultimaAtivTs;
                estado._ultimoIdleAutoCreditadoTs = ultimaAtivTs;
                estado._nivelAutoCreditado = 'pausa_maior';
                return { creditado: true, tipo: 'pausa_maior' };
            }

            if (minInativo >= alivioMin && minInativo < pausaMaiorMin && nivelAnterior !== 'alivio' && nivelAnterior !== 'pausa_maior') {
                /* FEAT-38: Alívio detectado automaticamente exibe o popup de Alívio contando continuamente até pausaMaiorMin ou retorno */
                estado.pomodoroFase = 'alivio';
                estado.pomodoroMinutosNaFase = minInativo;
                estado.pomodoroDescansoRealizadoNoCiclo = true;
                estado.pomodoroDescansoPendente = false;
                estado.pomodoroDescansoMinCumprido = true;
                estado.pomodoroDescansoPulado = false;
                estado.pomodoroDescansoSaldoRestanteMs = 0;
                estado.pomodoroDescansoSaldoTipo = '';
                estado.necessidadePausaMs = 0;
                estado.pomodoroMetaCustomMs = 0;
                estado.pomodoroDescansoAcumuladoMs = msInativo;
                estado.pomodoroDescansoSyncTs = agora;
                estado.pomodoroDescansoAtividadeAteTs = 0;
                estado.pomodoroUltimoDescansoTipo = 'alivio';
                estado.pomodoroUltimoDescansoFimTs = agora;
                estado.pomodoroUltimoDescansoDuracaoMin = Math.max(1, minInativo);
                estado.pomodoroBadgeVerdeAteTs = 0;
                estado.pomodoroPularProximoPopupFoco = false;
                estado.pomodoroBarraOcultadaChave = '';
                estado.pomodoroFaseInicioTs = ultimaAtivTs;
                estado._ultimoIdleAutoCreditadoTs = ultimaAtivTs;
                estado._nivelAutoCreditado = 'alivio';
                return { creditado: true, tipo: 'alivio' };
            }

            return { creditado: false, tipo: 'nenhum' };
        }

        /**
         * Injeta um modal informativo nas abas ativas HTTP/HTTPS de todas as janelas abertas.
         * @param {string} titulo
         * @param {string} mensagem
         * @param {string} [subtitulo]
         * @returns {Promise<void>}
         */

        /**
         * Monta os textos do modal de pausa/alívio a partir do resumo e configuração atuais.
         * @param {Object} [resumo]
         * @param {Object} [config]
         * @returns {{ titulo: string, mensagem: string, subtitulo: string }|null}
         */
        obterDadosModalDescanso(resumo = {}, config = {}) {
            if (!resumo || !resumo.emDescanso) return null;
            const focoMin = Math.max(25, Number((config && config.pomodoroFocoMinutos) || resumo.focoMin || 45));
            const proporcao = Number((config && config.pomodoroProporcao) || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number((config && config.pomodoroCiclos) || resumo.ciclosMax || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            if (resumo.fase === 'pausa_maior') {
                return {
                    titulo: 'Pomodoro: Hora da Pausa Maior!',
                    mensagem: `Você concluiu ${ciclosMax} ciclos de foco (${focoMin} min cada). Descanse por ${pausaMaiorMin} minutos.`,
                    subtitulo: `Proporção ${proporcao}:1 • Pausa Maior de ${pausaMaiorMin} min`
                };
            }
            return {
                titulo: 'Pomodoro: Hora do Alívio!',
                mensagem: `Ciclo ${resumo.cicloAtual || 1}/${ciclosMax} concluído (${focoMin} min). Faça uma pausa de ${alivioMin} minutos.`,
                subtitulo: `Proporção ${proporcao}:1 • Alívio de ${alivioMin} min`
            };
        }

        /**
         * Injeta um modal informativo nas abas ativas HTTP/HTTPS de todas as janelas abertas.
         * (As demais guias da mesma janela exibem sob demanda ao serem ativadas).
         * @param {string} titulo
         * @param {string} mensagem
         * @param {string} [subtitulo]
         * @param {number|null} [tabIdEspecifica]
         * @returns {Promise<void>}
         */
        async projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo, tabIdEspecifica = null) {
            try {
                if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;
                let abasAlvo = [];
                if (typeof tabIdEspecifica === 'number' && tabIdEspecifica > 0) {
                    const aba = await chrome.tabs.get(tabIdEspecifica).catch(() => null);
                    if (aba) abasAlvo = [aba];
                } else {
                    abasAlvo = await chrome.tabs.query({ active: true }).catch(() => []);
                }
                for (const aba of abasAlvo) {
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: (t, m, s) => {
                            const idModal = 'jusgov-modal-produtividade-trabalho';
                            const antigo = document.getElementById(idModal);
                            if (antigo) antigo.remove();
                            const overlay = document.createElement('div');
                            overlay.id = idModal;
                            overlay.setAttribute('role', 'dialog');
                            overlay.setAttribute('aria-modal', 'true');
                            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';
                            const card = document.createElement('div');
                            card.style.cssText = 'background:#ffffff;color:#0f172a;border-radius:14px;padding:24px 28px;max-width:440px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,0.35);border:2px solid #0d9488;text-align:center;';
                            const h2 = document.createElement('h2');
                            h2.textContent = t;
                            h2.style.cssText = 'margin:0 0 10px 0;font-size:20px;font-weight:700;color:#0d9488;';
                            const p = document.createElement('p');
                            p.textContent = m;
                            p.style.cssText = 'margin:0 0 10px 0;font-size:15px;line-height:1.5;color:#1e293b;';
                            const sub = document.createElement('p');
                            sub.textContent = s || '';
                            sub.style.cssText = 'margin:0 0 18px 0;font-size:12px;color:#64748b;';
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.textContent = 'Entendi / Fechar';
                            btn.style.cssText = 'background:#0d9488;color:#ffffff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;';
                            const fechar = (propagarGlobal = true) => {
                                const hostRef = document.getElementById('jusgov-pomodoro-barra-global');
                                const dRef = (hostRef && hostRef.__jusgovDados) ? hostRef.__jusgovDados : null;
                                if (dRef && dRef.fase) {
                                    window.__jusgovModalFechadoChaveCiclo = `${dRef.fase}:${dRef.cicloAtual || 0}`;
                                }
                                overlay.remove();
                                document.removeEventListener('keydown', onEsc, true);
                                if (propagarGlobal) {
                                    try {
                                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                            chrome.runtime.sendMessage({ acao: 'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL' }).catch(() => { });
                                        }
                                    } catch (_) { }
                                }
                            };
                            const onEsc = (e) => {
                                if (e.key === 'Escape') fechar(true);
                            };
                            btn.addEventListener('click', () => fechar(true));
                            overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(true); });
                            document.addEventListener('keydown', onEsc, true);
                            card.appendChild(h2);
                            card.appendChild(p);
                            if (s) card.appendChild(sub);
                            card.appendChild(btn);
                            overlay.appendChild(card);
                            (document.body || document.documentElement).appendChild(overlay);
                            btn.focus();
                        },
                        args: [titulo, mensagem, subtitulo]
                    }).catch(() => { });
                }
            } catch (_) { }
        }

        /**
         * Remove o modal de produtividade nas abas visíveis/abertas ao iniciar o descanso real ou ao fechar manualmente.
         * @returns {Promise<void>}
         */
        async fecharModalProdutividadeEmTodasJanelas() {
            try {
                if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;
                const abas = await chrome.tabs.query({}).catch(() => []);
                for (const aba of abas) {
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: () => {
                            const modal = document.getElementById('jusgov-modal-produtividade-trabalho');
                            if (modal) modal.remove();
                        }
                    }).catch(() => { });
                }
            } catch (_) { }
        }
    }

    Object.freeze(ProdutMotorFlexivel.prototype);
    return Object.freeze(ProdutMotorFlexivel);
}));