/* ==========================================================================
 * ARQUIVO: src/mod-produt/mod-produt.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade: Tempo de Trabalho & Pomodoro
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/mod-produt.js
 * - Classe Exportada: ModuloProdutividade (self.JusGovModuloProdutividade)
 * - Métodos Públicos: definirProvedorConfig(fn), obterDataLocalChaveHoje(),
 *   obterOuIniciarEstadoTrabalhoHoje(), resetarEstadoTrabalhoHoje(),
 *   registrarAtividadeTrabalho(), projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo),
 *   processarTickTrabalho(obterConfigFn), abrirAssistenteIaLateral(msg, chromeApi)
 * - Regras / Seções: Diretriz 14, Diretriz 16, Seção 6.142 (Tempo de Trabalho e Pomodoro)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Gerencia os contadores diários de tempo de trabalho corrido e tempo de
 *    trabalho ativo (estilo Workrave), além da máquina de estados do Pomodoro
 *    (foco, alívio e pausa maior), projetando modais em todas as janelas ativas.
 * 2) ISOLAMENTO:
 *    Executa no Service Worker (Manifest V3) via importScripts e persiste o
 *    estado diário na chave 'jusgovTrabalhoEstado' do chrome.storage.local.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md
 * - docs/02_ARQUITETURA_E_AS_BUILT.md
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloProdutividade = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const BemEstarCls = (typeof self !== 'undefined' && self.JusGovBemEstarPomodoro)
        ? self.JusGovBemEstarPomodoro
        : ((typeof require === 'function')
            ? (() => { try { return require('./lib-produt-bem-estar.js'); } catch (_) { return null; } })()
            : null);

    const ResumoUiCls = (typeof self !== 'undefined' && typeof self.JusGovProdutResumoUi === 'function')
        ? self.JusGovProdutResumoUi
        : (typeof require === 'function'
            ? (() => { try { return require('./produt-resumo-ui.js'); } catch (_) { return null; } })()
            : null);

    class ModuloProdutividade {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
            this._bemEstar = (opcoes && opcoes.bemEstar)
                ? opcoes.bemEstar
                : (BemEstarCls ? new BemEstarCls() : null);
            this._resumoUi = (opcoes && opcoes.resumoUi)
                ? opcoes.resumoUi
                : (ResumoUiCls ? new ResumoUiCls() : null);
        }

        obterResumoUi() {
            if (!this._resumoUi) {
                const Cls = (typeof self !== 'undefined' && typeof self.JusGovProdutResumoUi === 'function')
                    ? self.JusGovProdutResumoUi
                    : ResumoUiCls;
                if (Cls) this._resumoUi = new Cls();
            }
            return this._resumoUi || (ResumoUiCls && ResumoUiCls.NULL_OBJECT) || null;
        }

        obterGerenciadorBemEstar() {
            return this._bemEstar;
        }

        /**
         * Define dinamicamente a função assíncrona responsável por ler as configurações atuais.
         * @param {Function} fn
         */
        definirProvedorConfig(fn) {
            if (typeof fn === 'function') {
                this._obterConfig = fn;
            }
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
            const concluidoAoVivo = Boolean(d.emDescanso && (d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs));
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
                    textoStatus: 'Concluído!',
                    corBorda: '#16a34a',
                    bgStatus: '#16a34a',
                    corStatus: '#ffffff',
                    fontWeightStatus: '700',
                    usarTelaEmbaccada: emIdleDescanso,
                    usarScreensaver: emIdleDescanso,
                    descansoConcluidoAoVivo: true
                };
            }
            if (d.emDescanso && !d.aguardandoOciosidade && !d.descansoPendente) {
                return {
                    estadoVisual: 'em_andamento',
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
            if (d.emDescanso && !d.aguardandoOciosidade) {
                return {
                    estadoVisual: 'em_andamento',
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
            if (d.descansoPendente || (d.emDescanso && d.aguardandoOciosidade)) {
                return {
                    estadoVisual: 'pendente',
                    textoStatus: 'Pendente...',
                    corBorda: '#dc2626',
                    bgStatus: '#dc2626',
                    corStatus: '#ffffff',
                    fontWeightStatus: '700',
                    usarTelaEmbaccada: false,
                    usarScreensaver: false,
                    descansoConcluidoAoVivo: false
                };
            }
            return {
                estadoVisual: 'ativo',
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
                    estado.pomodoroMinutosNaFase = focoSalvoMs > 0 ? Math.floor(focoSalvoMs / 60000) : 0;
                    estado.pomodoroFaseInicioTs = focoSalvoMs > 0 ? (agora - focoSalvoMs) : agora;
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
            } else {
                estado.pomodoroDescansoPulado = false;
                estado.pomodoroDescansoSaldoRestanteMs = 0;
                estado.pomodoroDescansoSaldoTipo = '';
            }
            estado.pomodoroFase = 'foco';
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
            const fator = Math.max(0.25, Math.min(1, Number(gov.fatorPrivilegio || 1)));
            const saldoEfetivoMs = Math.max(15000, Math.round(saldoBrutoMs * fator));
            const tipoRestaurar = (estado.pomodoroDescansoSaldoTipo === 'pausa_maior') ? 'pausa_maior' : 'alivio';

            estado.pomodoroFocoAcumuladoAntesPausaMs = focoAtualMs;
            estado.pomodoroMetaCustomMs = saldoEfetivoMs;
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
         * Formata timestamp Unix em HH:MM local.
         * @param {number} ts
         * @returns {string}
         */
        formatarHoraHHMM(ts) {
            const n = Number(ts);
            if (!n || !Number.isFinite(n) || n <= 0) return '';
            const d = new Date(n);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        /**
         * Resolve visibilidade efetiva da barra flutuante Pomodoro considerando estado fixado (FEAT-39/FEAT-42).
         * @param {{ ativoPorConfig: boolean, deveExibirNormal: boolean, fixadaNaGuia?: boolean, modoFixacao?: number, fechadaNestaGuia: boolean }} params
         * @returns {boolean}
         */
        resolverVisibilidadeBarraPomodoro(params = {}) {
            if (!params || !params.ativoPorConfig) return false;
            const estaFixada = Boolean(params.fixadaNaGuia || Number(params.modoFixacao || 0) > 0);
            if (estaFixada) return true;
            if (params.fechadaNestaGuia) return false;
            return Boolean(params.deveExibirNormal);
        }

        /**
         * Alterna ciclicamente os 4 estados do botão Fixar:
         * 0 (desfixado) -> 1 (fixado) -> 2 (fixado + posição travada) -> 3 (minimalista miniaturizado) -> 0.
         * @param {number} [modoAtual]
         * @returns {0|1|2|3}
         */
        avancarModoFixacaoBarra(modoAtual = 0) {
            const n = Math.floor(Number(modoAtual) || 0);
            if (n === 0) return 1;
            if (n === 1) return 2;
            if (n === 2) return 3;
            return 0;
        }

        /**
         * Alterna ciclicamente os níveis de detalhe visual do minipopup no duplo clique:
         * 0 (minimalista: só contador) -> 1 (semicompleto: fase + contador) -> 2 (completo: fase + contador + último descanso) -> 0.
         * @param {number} [nivelAtual]
         * @returns {0|1|2}
         */
        avancarNivelDetalheBarra(nivelAtual = 0) {
            const n = Math.floor(Number(nivelAtual) || 0);
            if (n === 0) return 1;
            if (n === 1) return 2;
            return 0;
        }

        /**
         * Encaixa coordenadas livres na mais próxima das 6 posições de borda permitidas:
         * (superior|inferior) x (esquerda|centro|direita).
         * @param {number} centerX
         * @param {number} centerY
         * @param {number} [larguraTela=1280]
         * @param {number} [alturaTela=720]
         * @returns {{ posicaoVertical: 'superior'|'inferior', alinhamento: 'esquerda'|'centro'|'direita' }}
         */
        calcularPosicao6Bordas(centerX, centerY, larguraTela = 1280, alturaTela = 720) {
            const w = Math.max(320, Number(larguraTela) || 1280);
            const h = Math.max(200, Number(alturaTela) || 720);
            const rx = Math.max(0, Math.min(1, (Number(centerX) || 0) / w));
            const ry = Math.max(0, Math.min(1, (Number(centerY) || 0) / h));
            const posicaoVertical = (ry < 0.5) ? 'superior' : 'inferior';
            const alinhamento = (rx < 0.33) ? 'esquerda' : (rx > 0.66 ? 'direita' : 'centro');
            return { posicaoVertical, alinhamento };
        }

        /**
         * Normaliza o estado global compartilhado da barra Pomodoro para todas as guias.
         * Padrão inicial: modoFixacao=1 (Cadeado Amarelo: fixo com retorno), nivelDetalhe=0 (minimalista), superior/esquerda.
         * @param {Object} [bruto]
         * @returns {{ modoFixacao: 0|1|2|3, nivelDetalhe: 0|1|2, posicaoVertical: 'superior'|'inferior', posicaoVerticalAncorada: 'superior'|'inferior', topPx: number, alinhamento: 'esquerda'|'centro'|'direita'|'livre', leftPx: number|null, topAncoradoPx: number, alinhamentoAncorado: 'esquerda'|'centro'|'direita'|'livre', leftAncoradoPx: number|null }}
         */
        normalizarEstadoGlobalBarraPomodoro(bruto = {}) {
            const b = (bruto && typeof bruto === 'object') ? bruto : {};
            const modoInformado = (b.modoFixacao !== undefined && b.modoFixacao !== null);
            const modoNum = modoInformado ? Math.floor(Number(b.modoFixacao) || 0) : 1;
            const modoFixacao = (modoNum === 0 || modoNum === 1 || modoNum === 2 || modoNum === 3) ? modoNum : 1;
            const nivelNum = Math.floor(Number(b.nivelDetalhe) || 0);
            const nivelDetalhe = (nivelNum === 1 || nivelNum === 2) ? nivelNum : 0;
            const alinhValido = (v) => (v === 'esquerda' || v === 'direita' || v === 'centro' || v === 'livre') ? v : 'esquerda';
            const topPx = Math.max(0, Math.round(Number(b.topPx ?? 0) || 0));
            const posicaoVertical = (b.posicaoVertical === 'inferior' || (b.posicaoVertical === undefined && topPx >= 240))
                ? 'inferior'
                : 'superior';
            const leftBruto = (b.leftPx !== undefined && b.leftPx !== null && Number.isFinite(Number(b.leftPx)))
                ? Math.max(0, Math.round(Number(b.leftPx))) : null;
            let alinhamento = alinhValido(b.alinhamento);
            if (alinhamento === 'livre' && leftBruto === null) alinhamento = 'esquerda';

            const topAncoradoPx = Math.max(0, Math.round(Number(b.topAncoradoPx ?? topPx) || 0));
            const posicaoVerticalAncorada = (b.posicaoVerticalAncorada === 'inferior' || (b.posicaoVerticalAncorada === undefined && (posicaoVertical === 'inferior' || topAncoradoPx >= 240)))
                ? 'inferior'
                : 'superior';
            const leftAncBruto = (b.leftAncoradoPx !== undefined && b.leftAncoradoPx !== null && Number.isFinite(Number(b.leftAncoradoPx)))
                ? Math.max(0, Math.round(Number(b.leftAncoradoPx))) : ((alinhamento === 'livre') ? leftBruto : null);
            let alinhamentoAncorado = b.alinhamentoAncorado ? alinhValido(b.alinhamentoAncorado) : alinhamento;
            if (alinhamentoAncorado === 'livre' && leftAncBruto === null) alinhamentoAncorado = 'esquerda';

            return {
                modoFixacao,
                nivelDetalhe,
                posicaoVertical,
                posicaoVerticalAncorada,
                topPx,
                alinhamento,
                leftPx: leftBruto,
                topAncoradoPx,
                alinhamentoAncorado,
                leftAncoradoPx: leftAncBruto,
                minimizadoMicro: Boolean(b.minimizadoMicro),
                minimizadoDescansoAdiadoTs: Math.max(0, Math.round(Number(b.minimizadoDescansoAdiadoTs || 0)))
            };
        }

        /**
         * Resolve a posição efetiva do minipopup considerando modo idle em Alívio/Descanso (centro da tela),
         * modo aviso durante Alívio/Descanso (superior central tipo Cadeado Amarelo) e posição ancorada do usuário.
         * @param {Object} [dadosResumo]
         * @param {Object} [estadoBarra]
         * @param {number} [agora]
         * @returns {{ modoEspecial: 'idle_centro_tela'|'aviso_topo_centro'|'padrao', posicaoVertical: string, alinhamento: string, centroTela: boolean, forcarRetornoAmarelo: boolean }}
         */
        resolverPosicaoEfetivaBarraPomodoro(dadosResumo = {}, estadoBarra = {}, agora = Date.now()) {
            const d = (dadosResumo && typeof dadosResumo === 'object') ? dadosResumo : {};
            const est = this.normalizarEstadoGlobalBarraPomodoro(estadoBarra);
            const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
            const concluido = Boolean(d.emDescanso && (d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs));
            if (d.emDescanso && (concluido || !d.descansoRealizado)) {
                if (!concluido && d.descansoEmAviso) {
                    if (d.descansoUltimoTipoInteracao === 'movimento') {
                        return {
                            modoEspecial: 'aviso_movimento_centro_blur',
                            posicaoVertical: 'centro_tela',
                            alinhamento: 'centro',
                            centroTela: true,
                            forcarRetornoAmarelo: false,
                            screensaverSaltitando: false,
                            telaEmbaccada: true
                        };
                    }
                    return {
                        modoEspecial: 'aviso_topo_centro',
                        posicaoVertical: 'superior',
                        alinhamento: 'centro',
                        centroTela: false,
                        forcarRetornoAmarelo: true,
                        screensaverSaltitando: false,
                        telaEmbaccada: false
                    };
                }
                const ativAte = Number(d.descansoAtividadeAteTs || 0);
                const semScreensaverAte = Number(d.descansoSemScreensaverAteTs || 0);
                if (!concluido && !d.aguardandoOciosidade && semScreensaverAte > 0 && agora < semScreensaverAte) {
                    return {
                        modoEspecial: 'aviso_topo_centro',
                        posicaoVertical: 'superior',
                        alinhamento: 'centro',
                        centroTela: false,
                        forcarRetornoAmarelo: true,
                        screensaverSaltitando: false,
                        telaEmbaccada: false
                    };
                }
                if (!d.aguardandoOciosidade && (concluido || agora >= Math.max(ativAte, semScreensaverAte))) {
                    return {
                        modoEspecial: 'idle_centro_tela',
                        posicaoVertical: 'centro_tela',
                        alinhamento: 'centro',
                        centroTela: true,
                        forcarRetornoAmarelo: false,
                        screensaverSaltitando: true,
                        telaEmbaccada: true
                    };
                }
            }
            const pv = (Number(est.modoFixacao) === 1) ? est.posicaoVerticalAncorada : est.posicaoVertical;
            const al = (Number(est.modoFixacao) === 1) ? est.alinhamentoAncorado : est.alinhamento;
            return {
                modoEspecial: 'padrao',
                posicaoVertical: pv,
                alinhamento: al,
                centroTela: false,
                forcarRetornoAmarelo: (Number(est.modoFixacao) === 1),
                screensaverSaltitando: false,
                telaEmbaccada: false
            };
        }

        /**
         * Calcula próxima posição após esquiva, ou posição ancorada de retorno no modoFixacao=2.
         * @param {number} xMouse
         * @param {{ left: number, right: number, top: number, bottom: number }} origRect
         * @param {{ modoFixacao?: number, topAncoradoPx?: number, alinhamentoAncorado?: string }} estado
         * @returns {boolean} true se o ponteiro saiu da área ancorada original (com margem de 14px)
         */
        ponteiroSaiuDaAreaAncorada(xMouse, yMouse, origRect) {
            if (!origRect) return true;
            const margem = 14;
            return (
                Number(xMouse) < (Number(origRect.left || 0) - margem) ||
                Number(xMouse) > (Number(origRect.right || 0) + margem) ||
                Number(yMouse) < (Number(origRect.top || 0) - margem) ||
                Number(yMouse) > (Number(origRect.bottom || 0) + margem)
            );
        }

        /**
         * Verifica se já decorreu o tempo mínimo de permanência do mouse (1s) antes de disparar a esquiva do minipopup (BUG-74).
         * @param {number} hoverInicioTs
         * @param {number} [agora]
         * @param {number} [atrasoMs]
         * @returns {boolean}
         */
        podeDispararEsquivaBarra(hoverInicioTs = 0, agora = Date.now(), atrasoMs = 1000) {
            const ini = Number(hoverInicioTs || 0);
            if (!ini || !Number.isFinite(ini) || ini <= 0) return false;
            return (Number(agora || Date.now()) - ini) >= Math.max(0, Number(atrasoMs || 0));
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
                (bancoOrigemFoco === 'anterior' || bancoOrigemFoco === 'posterior') &&
                segRestantes > 0
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

            return {
                ativo,
                fase,
                faseLabel,
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
         * Gera ou recupera o identificador único local do dispositivo/navegador (não sincronizado).
         * @param {Object|null} [chromeApi]
         * @returns {Promise<string>}
         */
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

        /**
         * Detecta se há múltiplos computadores em uso simultâneo comparando hora de entrada,
         * último heartbeat na nuvem e status de encerramento limpo (`encerradoLimpo`).
         * @param {Object} [dispositivos]
         * @param {string} [meuId]
         * @param {number} [agora]
         * @param {number} [meuEntradaTs]
         * @returns {{ simultaneo: boolean, dispositivosSimultaneos: string[], totalDispositivosHoje: number }}
         */
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

        /**
         * Agrega os dados dos demais dispositivos no snapshot v2 sem duplicar o contador local atual.
         * @param {Object|null} snapshot
         * @param {string} [meuId]
         * @param {Object|null} [estadoLocal]
         * @param {number} [agora]
         * @param {number} [meuEntradaTs]
         * @returns {Object}
         */
        agregarDispositivosProdutividade(snapshot, meuId = '', estadoLocal = null, agora = Date.now(), meuEntradaTs = 0) {
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

            const dataAlvo = (estadoLocal && estadoLocal.data) ? String(estadoLocal.data) : this.obterDataLogicaTrabalho(agora);
            if (snapshot.v === 1 && snapshot.estado && typeof snapshot.estado === 'object') {
                return metaVazia;
            }
            if (snapshot.data && String(snapshot.data) !== dataAlvo) {
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

        /**
         * Monta snapshot multi-dispositivo (v2) preservando os demais computadores do mesmo dia lógico (FEAT-47).
         * @param {Object} estado
         * @param {Object} [locais]
         * @param {number} [agora]
         * @param {string} [dispositivoId]
         * @param {Object|null} [snapshotAnterior]
         * @param {number} [entradaTs]
         * @param {{ encerradoLimpo?: boolean }} [opcoes]
         * @returns {Object|null}
         */
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

        /**
         * Mescla o registro próprio do dispositivo na nuvem com o estado local e computa `nuvemMeta` dos demais PCs.
         * @param {Object|null} localEstado
         * @param {Object|null} nuvemSnapshot
         * @param {number} [agora]
         * @param {string} [meuDispositivoId]
         * @param {number} [meuEntradaTs]
         * @returns {{ estado: Object|null, adotouNuvem: boolean, nuvemMeta: Object }}
         */
        mesclarEstadoProdutividadeNuvem(localEstado, nuvemSnapshot, agora = Date.now(), meuDispositivoId = '', meuEntradaTs = 0) {
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

            if (estMeuNuvem) {
                const validacaoNuvem = this.resolverEstadoTrabalhoParaMomento(estMeuNuvem, agora);
                if (!validacaoNuvem.reiniciou) {
                    if (!localEstado || typeof localEstado !== 'object' || !localEstado.data || localEstado.data !== estMeuNuvem.data) {
                        estadoRes = { ...this.criarEstadoTrabalhoZerado(estMeuNuvem.data, agora), ...estMeuNuvem };
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

            const nuvemMeta = this.agregarDispositivosProdutividade(nuvemSnapshot, devId, estadoRes || localEstado, agora, meuEntradaTs);
            return { estado: estadoRes, adotouNuvem, nuvemMeta };
        }

        async sincronizarStatsMultiDispositivo(chromeApi = null, opcoes = {}) {
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

                const mesclado = this.mesclarEstadoProdutividadeNuvem(loc && loc.jusgovTrabalhoEstado, snapAnt, agora, devId, entradaTs);
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

                const estadoParaEnviar = mesclado.estado || (loc && loc.jusgovTrabalhoEstado) || this.criarEstadoTrabalhoZerado(this.obterDataLogicaTrabalho(agora), agora);
                if (opcoes && opcoes.enviarNuvem !== false) {
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

        async salvarResumoProdutividadeNuvemAoSair(chromeApi = null, opcoes = { encerradoLimpo: true }) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: (opcoes && opcoes.encerradoLimpo !== false)
            }));
        }

        async sincronizarEstatisticasPeriodicoNuvem(chromeApi = null) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: false
            }));
        }

        async recuperarResumoProdutividadeNuvemAoAbrir(chromeApi = null) {
            return Boolean(await this.sincronizarStatsMultiDispositivo(chromeApi, {
                enviarNuvem: true,
                encerradoLimpo: false
            }));
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

            estado.corridoMinutos = Number(estado.corridoMinutos || 0) + 1;

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
                estado.pausasMinutos = Number(estado.pausasMinutos || 0) + pendentes + 1;
                /* BUG-129: Contabiliza exatamente +1 pausa confirmada ao atingir >= 5 min contínuos em idle */
                if (pendentes > 0 || msDesdeAtividade >= TEMPO_MINIMO_PAUSA_MS) {
                    estado.pausasConfirmadas = Number(estado.pausasConfirmadas || 0) + 1;
                }
                estado.emPausa = true;
                estado.pomodoroPausaInicioTs = agora;
                estado.minutosInativosPendentes = 0;
            } else {
                estado.pausasMinutos = Number(estado.pausasMinutos || 0) + 1;
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
        iniciarFaseDescansoPomodoro(estado, agora = Date.now(), config = {}) {
            const ciclosMax = Math.max(2, Number((config && config.pomodoroCiclos) || 4));
            const inicioFaseAnt = Number(estado.pomodoroFaseInicioTs || agora);
            const ultAtivBruto = Number(estado.ultimaAtividadeTs || agora);
            const ultAtivCont = Math.min(agora, Math.max(inicioFaseAnt, ultAtivBruto));
            const idlePrevioMs = Math.max(0, agora - ultAtivCont);
            const focoMinCfg = Math.max(25, Number(config && config.pomodoroFocoMinutos || 45));
            estado.pomodoroFocoRodadaMs = Math.max(Number(estado.pomodoroMinutosNaFase || 0) * 60000, focoMinCfg * 60000);
            estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
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
            estado.pomodoroMetaCustomMs = 0;
            if (estado.pomodoroCicloAtual >= ciclosMax) {
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
            const limiarIdleFocoMin = Math.max(2, Math.min(alivioMin, Math.round(baseIdleFocoMin * fatorGovFoco)));
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
                    const ret = this.retomarDescansoPuladoPomodoro(estado, agora, config);
                    if (ret && ret.ok) {
                        estado.pomodoroBancoOrigemDescanso = 'anterior';
                        estado.pomodoroDescansoAcumuladoMs = Math.max(Number(estado.pomodoroDescansoAcumuladoMs || 0), limiarIdleFocoMs);
                        estado.pomodoroMinutosNaFase = Math.floor(estado.pomodoroDescansoAcumuladoMs / 60000);
                        estado.pomodoroMinutosAtivoEmDescanso = 0;
                        return { evento: 'auto_retomou_descanso_incompleto', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                } else if (origemDescAtual !== 'posterior' && govAuto.temMeritoAutoPausa && Number(estado.pomodoroMinutosNaFase || 0) > 0 && typeof this.pausarOuAdiantarDescansoPomodoro === 'function') {
                    const retProx = this.pausarOuAdiantarDescansoPomodoro(estado, agora, config);
                    if (retProx && retProx.ok) {
                        estado.pomodoroBancoOrigemDescanso = 'posterior';
                        estado.pomodoroDescansoAcumuladoMs = Math.max(Number(estado.pomodoroDescansoAcumuladoMs || 0), limiarIdleFocoMs);
                        estado.pomodoroMinutosNaFase = Math.floor(estado.pomodoroDescansoAcumuladoMs / 60000);
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
                if (retFoco && retFoco.ok) {
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
                    if (estado.pomodoroMinutosNaFase >= alivioMin) {
                        const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimaHidratacaoTs = agora;
                        estado.pomodoroAguaPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'alivio';
                        estado.pomodoroUltimoDescansoFimTs = agora;
                        estado.pomodoroUltimoDescansoDuracaoMin = this.arredondarMinutosDescansoExato(
                            Number(estado.pomodoroDescansoAcumuladoMs || 0) || (Number(estado.pomodoroMinutosNaFase || alivioMin) * 60000)
                        );
                        if (acabouDeCumprir) estado.pomodoroBadgeVerdeAteTs = 0;
                        return { evento: acabouDeCumprir ? 'alivio_cumprido_continuo' : null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                    return { evento: null, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }

                /* Fase 'pausa_maior': após atingir pausaMaiorMin, continua contando indefinidamente até clique/tecla */
                if (estado.pomodoroMinutosNaFase >= pausaMaiorMin) {
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

        /**
         * Processa o tick de 1 minuto para tempo corrido, tempo ativo e ciclo Pomodoro.
         * @param {Function} [obterConfigFn]
         * @returns {Promise<void>}
         */
        async processarTickTrabalho(obterConfigFn) {
            try {
                const provedor = typeof obterConfigFn === 'function'
                    ? obterConfigFn
                    : (this._obterConfig || (typeof obterConfiguracoesGerais === 'function' ? obterConfiguracoesGerais : null));
                const config = provedor ? await provedor() : {};

                const pomodoroAtivo = Boolean(config.pomodoroAtivo);

                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                const agora = Date.now();

                /* BUG-129: Consultar estado nativo de ociosidade do SO (chrome.idle.queryState)
                 * para reconhecer atividade real mesmo quando o usuário trabalha fora das abas web
                 * (VS Code, Word, PDFs, opções ou outras janelas do Windows), evitando falsas pausas
                 * e perda de minutos no Tempo Ativo. */
                try {
                    if (typeof chrome !== 'undefined' && chrome.idle && typeof chrome.idle.queryState === 'function') {
                        const consultarIdle = (seg) => new Promise((resolve) => {
                            try {
                                chrome.idle.queryState(seg, (st) => resolve(st || ''));
                            } catch (_) {
                                resolve('');
                            }
                        });
                        const estadoIdle60 = await consultarIdle(60);
                        if (estadoIdle60 === 'active') {
                            estado.ultimaAtividadeTs = agora;
                            estado.emPausa = false;
                            estado.minutosInativosPendentes = 0;
                        } else {
                            const estadoIdle5m = await consultarIdle(295);
                            if (estadoIdle5m === 'active' && (agora - Number(estado.ultimaAtividadeTs || 0)) >= (5 * 60 * 1000)) {
                                estado.ultimaAtividadeTs = agora - (60 * 1000);
                                estado.emPausa = false;
                            }
                        }
                    }
                } catch (_) { }

                /* Compensação exata de atraso do alarme MV3 (garante Corrido = Ativo + Pausas sem perder minutos) */
                const prevTickTs = Number(estado.ultimoTickTrabalhoTs || 0);
                let passosTick = 1;
                if (prevTickTs > 0 && agora > prevTickTs) {
                    const deltaMin = Math.floor((agora - prevTickTs) / 60000);
                    if (deltaMin >= 2 && deltaMin <= 180) {
                        passosTick = deltaMin;
                    }
                }
                let res = { estado, disparoCorrido: false, disparoAtivo: false };
                for (let k = 1; k <= passosTick; k++) {
                    const tsPasso = (passosTick > 1 && prevTickTs > 0) ? Math.min(agora, prevTickTs + k * 60000) : agora;
                    const rPasso = this.avancarMinutoEstadoTrabalho(estado, tsPasso, config);
                    if (rPasso.disparoCorrido) res.disparoCorrido = true;
                    if (rPasso.disparoAtivo) res.disparoAtivo = true;
                }
                estado.ultimoTickTrabalhoTs = agora;

                const prefsAviso = this.resolverPreferenciasAvisoPomodoro(config);

                if (res.disparoCorrido) {
                    await this.projetarModalProdutividadeEmTodasJanelas(
                        'Tempo de Uso Corrido Atingido',
                        `Você completou ${config.tempoTrabalhoCorridoHoras || 7}h de uso corrido hoje.`,
                        `Tempo corrido: ${estado.corridoMinutos} min | Tempo ativo: ${estado.ativoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                if (res.disparoAtivo) {
                    await this.projetarModalProdutividadeEmTodasJanelas(
                        'Tempo de Atividade Atingido',
                        `Você completou ${config.tempoTrabalhoAtivoHoras || 6}h de atividade efetiva hoje (estilo Workrave).`,
                        `Tempo ativo: ${estado.ativoMinutos} min | Tempo corrido: ${estado.corridoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                /* Sempre avança contadores internos de foco/pausa/último descanso mesmo com alertas Pomodoro desativados */
                const evPom = this.avancarMinutoPomodoro(estado, agora, config);
                const resumoTick = this.calcularResumoPomodoro(estado, config, agora, null);
                const chaveFaseTick = `${resumoTick.fase}:${resumoTick.cicloAtual}:${resumoTick.faseInicioTs}`;
                /* Modal gigante central removido: o minipopup não-bloqueante conduz todo o ciclo de descanso sem travar a tela */
                if (resumoTick.emDescanso && !resumoTick.aguardandoOciosidade && estado.pomodoroModalDescansoChave) {
                    estado.pomodoroModalExibidoChave = chaveFaseTick;
                    estado.pomodoroModalDescansoChave = '';
                    estado.pomodoroModalFechadoNestaPausa = true;
                    await this.fecharModalProdutividadeEmTodasJanelas();
                }

                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
                await this.sincronizarIndicadoresGlobaisPomodoro(config, estado);
            } catch (_) { }
        }

        /**
         * Calcula alinhamento horizontal ('esquerda'|'centro'|'direita') e altura clamped (FEAT-38).
         * @param {number} xCursor
         * @param {number} larguraTela
         * @param {number} yTop
         * @param {number} alturaTela
         * @returns {{ alinhamento: string, topPx: number }}
         */
        calcularPosicaoBarraPomodoro(xCursor, larguraTela, yTop, alturaTela) {
            const w = Math.max(320, Number(larguraTela || 1280));
            const h = Math.max(200, Number(alturaTela || 720));
            const ratio = Math.max(0, Math.min(1, Number(xCursor || 0) / w));
            let alinhamento = 'centro';
            if (ratio < 0.33) alinhamento = 'esquerda';
            else if (ratio > 0.66) alinhamento = 'direita';
            const topPx = Math.max(0, Math.min(h - 24, Math.round(Number(yTop) || 0)));
            return { alinhamento, topPx };
        }

        /**
         * Clamp seguro de posição livre (Modo 2 / 🔒) encostando nas bordas da viewport (FEAT-46).
         * @param {number} leftPx
         * @param {number} topPx
         * @param {number} [larguraPill]
         * @param {number} [larguraTela]
         * @param {number} [alturaTela]
         * @param {number} [alturaPill]
         * @returns {{ leftPx: number, topPx: number }}
         */
        calcularPosicaoLivreClamp(leftPx, topPx, larguraPill = 240, larguraTela = 1280, alturaTela = 720, alturaPill = 24) {
            const w = Math.max(320, Number(larguraTela || 1280));
            const h = Math.max(200, Number(alturaTela || 720));
            const pillW = Math.max(40, Math.min(w, Number(larguraPill || 240)));
            const pillH = Math.max(16, Math.min(h, Number(alturaPill || 24)));
            const maxLeft = Math.max(0, w - pillW);
            const maxTop = Math.max(0, h - pillH);
            return {
                leftPx: Math.max(0, Math.min(maxLeft, Math.round(Number(leftPx) || 0))),
                topPx: Math.max(0, Math.min(maxTop, Math.round(Number(topPx) || 0)))
            };
        }

        /**
         * Determina se o ponteiro `(x, y)` está sobre a zona segura dos controles da barra Pomodoro
         * (`⋮⋮` mover à esquerda, `📌`/`🔒` fixar e `×` fechar à direita, incluindo padding e gap adjacentes),
         * garantindo que o usuário consiga interagir com esses controles sem disparar a esquiva (FEAT-46).
         * @param {number} x
         * @param {number} y
         * @param {{ pill?: DOMRect|null, alcaMover?: DOMRect|null, btnFixar?: DOMRect|null, btnFechar?: DOMRect|null }} [rects]
         * @returns {boolean}
         */
        isPontoEmControleBarraPomodoro(x, y, rects = {}) {
            if (!rects || typeof rects !== 'object') return false;
            const px = Number(x);
            const py = Number(y);
            if (!Number.isFinite(px) || !Number.isFinite(py)) return false;

            const padSeg = 10;
            const rPill = rects.pill && rects.pill.width > 0 ? rects.pill : null;
            const dentroAlturaPill = rPill
                ? (py >= (rPill.top - 4) && py <= (rPill.bottom + 4))
                : true;

            const rMover = rects.alcaMover && rects.alcaMover.width > 0 ? rects.alcaMover : null;
            if (rMover && dentroAlturaPill && px <= (rMover.right + padSeg)) {
                if (!rPill || px >= (rPill.left - 4)) return true;
            }

            const direitos = [rects.btnFixar, rects.btnFechar].filter(r => r && r.width > 0);
            if (direitos.length > 0 && dentroAlturaPill) {
                const minLeft = Math.min(...direitos.map(r => r.left));
                const maxRight = rPill ? (rPill.right + 4) : (Math.max(...direitos.map(r => r.right)) + padSeg);
                if (px >= (minLeft - padSeg) && px <= maxRight) return true;
            }

            const lista = [rMover, ...direitos].filter(Boolean);
            for (let i = 0; i < lista.length; i++) {
                const r = lista[i];
                if (px >= (r.left - padSeg) && px <= (r.right + padSeg) &&
                    py >= (r.top - padSeg) && py <= (r.bottom + padSeg)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Calcula lado de esquiva no hover passando obrigatoriamente pelo centro (Esquerda <-> Centro <-> Direita):
         * - Se estava na esquerda -> vai para centro
         * - Se estava na direita -> vai para centro
         * - Se estava no centro (ou em posição livre central) -> foge para o lado oposto ao mouse (esquerda ou direita)
         * @param {number} xMouse
         * @param {{ left: number, width: number }} [rectBarra]
         * @param {'esquerda'|'centro'|'direita'|'livre'} [alinhamentoAtual]
         * @param {number} [larguraTela]
         * @returns {'esquerda'|'centro'|'direita'}
         */
        calcularEsquivaLateralBarra(xMouse, rectBarra = { left: 0, width: 200 }, alinhamentoAtual = 'centro', larguraTela = 1280) {
            if (alinhamentoAtual === 'esquerda' || alinhamentoAtual === 'direita') {
                return 'centro';
            }
            const centroBarra = Number(rectBarra.left || 0) + (Number(rectBarra.width || 200) / 2);
            if (alinhamentoAtual === 'livre') {
                const w = Math.max(320, Number(larguraTela || 1280));
                const ratio = centroBarra / w;
                if (ratio < 0.35 || ratio > 0.65) return 'centro';
            }
            return (Number(xMouse) < centroBarra) ? 'direita' : 'esquerda';
        }

        /**
         * Lê o estado global compartilhado da barra Pomodoro (modoFixacao 0/1/2 + posição + âncora).
         * @returns {Promise<{ modoFixacao: 0|1|2, topPx: number, alinhamento: 'esquerda'|'centro'|'direita'|'livre', leftPx: number|null, topAncoradoPx: number, alinhamentoAncorado: 'esquerda'|'centro'|'direita'|'livre', leftAncoradoPx: number|null }>}
         */
        async obterEstadoGlobalBarraPomodoro() {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const d = await chrome.storage.local.get(['jusgovPomodoroBarraEstadoGlobal', 'jusgovPomodoroBarraPosicaoPorJanela']);
                    if (d && d.jusgovPomodoroBarraEstadoGlobal && typeof d.jusgovPomodoroBarraEstadoGlobal === 'object') {
                        return this.normalizarEstadoGlobalBarraPomodoro(d.jusgovPomodoroBarraEstadoGlobal);
                    }
                    if (d && d.jusgovPomodoroBarraPosicaoPorJanela && typeof d.jusgovPomodoroBarraPosicaoPorJanela === 'object') {
                        const chaves = Object.keys(d.jusgovPomodoroBarraPosicaoPorJanela);
                        if (chaves.length > 0) {
                            return this.normalizarEstadoGlobalBarraPomodoro(d.jusgovPomodoroBarraPosicaoPorJanela[chaves[0]]);
                        }
                    }
                }
            } catch (_) { }
            return this.normalizarEstadoGlobalBarraPomodoro({});
        }

        /**
         * Persiste alterações no estado global compartilhado da barra Pomodoro para refletir igualmente em todas as guias.
         * @param {Object} patch
         */
        async atualizarEstadoGlobalBarraPomodoro(patch = {}) {
            const atual = await this.obterEstadoGlobalBarraPomodoro();
            const proximo = { ...atual };
            if (patch.topPx !== undefined) {
                proximo.topPx = Math.max(0, Math.round(Number(patch.topPx) || 0));
            }
            if (patch.posicaoVertical === 'superior' || patch.posicaoVertical === 'inferior') {
                proximo.posicaoVertical = patch.posicaoVertical;
            } else if (patch.topPx !== undefined) {
                proximo.posicaoVertical = (proximo.topPx >= 240) ? 'inferior' : 'superior';
            }
            if (patch.leftPx !== undefined) {
                proximo.leftPx = (patch.leftPx !== null && Number.isFinite(Number(patch.leftPx)))
                    ? Math.max(0, Math.round(Number(patch.leftPx))) : null;
            }
            if (['esquerda', 'centro', 'direita', 'livre'].includes(patch.alinhamento)) {
                proximo.alinhamento = patch.alinhamento;
                if (patch.alinhamento !== 'livre' && patch.leftPx === undefined) {
                    proximo.leftPx = null;
                }
            }
            if (patch.modoFixacao !== undefined) {
                const mf = Math.floor(Number(patch.modoFixacao) || 0);
                proximo.modoFixacao = (mf === 0 || mf === 1 || mf === 2 || mf === 3) ? mf : 1;
            }
            if (patch.nivelDetalhe !== undefined) {
                const nd = Math.floor(Number(patch.nivelDetalhe) || 0);
                proximo.nivelDetalhe = (nd === 1 || nd === 2) ? nd : 0;
            }
            if (patch.minimizadoMicro !== undefined) {
                proximo.minimizadoMicro = Boolean(patch.minimizadoMicro);
            }
            if (patch.minimizadoDescansoAdiadoTs !== undefined) {
                proximo.minimizadoDescansoAdiadoTs = Math.max(0, Math.round(Number(patch.minimizadoDescansoAdiadoTs || 0)));
            }
            if (patch.ancorar === true || (proximo.modoFixacao === 1 && patch.modoFixacao === 1)) {
                proximo.topAncoradoPx = proximo.topPx;
                proximo.posicaoVerticalAncorada = proximo.posicaoVertical;
                proximo.alinhamentoAncorado = proximo.alinhamento;
                proximo.leftAncoradoPx = proximo.leftPx;
            } else if (patch.topAncoradoPx !== undefined || patch.posicaoVerticalAncorada !== undefined || patch.alinhamentoAncorado !== undefined || patch.leftAncoradoPx !== undefined) {
                if (patch.topAncoradoPx !== undefined) proximo.topAncoradoPx = Math.max(0, Math.round(Number(patch.topAncoradoPx) || 0));
                if (patch.posicaoVerticalAncorada === 'superior' || patch.posicaoVerticalAncorada === 'inferior') proximo.posicaoVerticalAncorada = patch.posicaoVerticalAncorada;
                if (['esquerda', 'centro', 'direita', 'livre'].includes(patch.alinhamentoAncorado)) proximo.alinhamentoAncorado = patch.alinhamentoAncorado;
                if (patch.leftAncoradoPx !== undefined) {
                    proximo.leftAncoradoPx = (patch.leftAncoradoPx !== null && Number.isFinite(Number(patch.leftAncoradoPx)))
                        ? Math.max(0, Math.round(Number(patch.leftAncoradoPx))) : null;
                }
            }
            const normalizado = this.normalizarEstadoGlobalBarraPomodoro(proximo);
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.set({ jusgovPomodoroBarraEstadoGlobal: normalizado });
                }
            } catch (_) { }
            return normalizado;
        }

        /**
         * Resolve cor de fundo/texto do badge do ícone da extensão no Pomodoro.
         * Nos últimos 60s (<= 1 min) antes do descanso em Foco, muda de verde para amarelo.
         * @param {Object} [resumo]
         * @returns {{ cor: string, corTexto: string, preDescansoAmarelo: boolean }}
         */
        resolverEstiloBadgePomodoro(resumo = {}) {
            const r = (resumo && typeof resumo === 'object') ? resumo : {};
            if (r.emDescanso && r.descansoMinCumprido) {
                return { cor: '#16a34a', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            if (r.descansoPendente && (r.aguardandoOciosidade || !r.emDescanso || r.descansoEmAviso)) {
                return { cor: '#dc2626', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            if (r.emDescanso) {
                return { cor: '#0284c7', corTexto: '#ffffff', preDescansoAmarelo: false };
            }
            const segRest = Number(r.segundosRestantes || 0);
            const minRest = Number(r.minutosRestantes ?? 999);
            const emUltimoMinuto = (!r.emPausa) && (minRest <= 1 || (segRest > 0 && segRest <= 60));
            if (emUltimoMinuto) {
                return { cor: '#eab308', corTexto: '#111827', preDescansoAmarelo: true };
            }
            return { cor: '#0d9488', corTexto: '#ffffff', preDescansoAmarelo: false };
        }

        /**
         * Indica se o cronômetro do minipopup deve piscar em amarelo (últimos 30s antes do descanso).
         * @param {number} segRestantesFoco
         * @param {boolean} [emDescanso=false]
         * @param {boolean} [descansoPendente=false]
         * @param {boolean} [emPausa=false]
         * @returns {boolean}
         */
        isCronometroFocoEmAlertaPreDescanso(segRestantesFoco, emDescanso = false, descansoPendente = false, emPausa = false) {
            const seg = Number(segRestantesFoco || 0);
            return Boolean(!emDescanso && !descansoPendente && !emPausa && seg > 0 && seg <= 30);
        }

        /**
         * Atualiza imediatamente badge e tooltip do ícone da extensão com os mesmos dados canônicos de Popup/Opções/Minipopup.
         */
        aplicarIndicadoresChromeAction(cfg = {}, estado = {}, nuvemMeta = null, agoraSync = Date.now()) {
            const resumo = this.calcularResumoPomodoro(estado, cfg, agoraSync, nuvemMeta);
            const infoTooltip = this.formatarResumoProdutividadeTexto(estado, cfg, agoraSync, nuvemMeta);
            const prefs = this.resolverPreferenciasAvisoPomodoro(cfg);
            const formatarTempoBadge = (totalMin) => {
                const m = Math.max(0, Math.floor(Number(totalMin) || 0));
                if (m >= 100) {
                    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
                }
                if (m >= 10) {
                    return `${m}`;
                }
                return `${m}m`;
            };
            let txtBadge = '';
            if (resumo.ativo && prefs.usarBadge) {
                if (resumo.emDescanso) {
                    /* No ícone em Alívio/Descanso, INCREMENTA mostrando quanto tempo passou (HH:MM se >= 1h) */
                    const minDecorridosDesc = resumo.aguardandoOciosidade
                        ? 0
                        : Math.floor(Math.max(0, Number(resumo.segundosDecorridos || 0)) / 60);
                    txtBadge = formatarTempoBadge(minDecorridosDesc);
                } else {
                    /* No ícone em Foco/Ativo, DECREMENTA (apenas horas se houver e minutos) */
                    txtBadge = `${resumo.descansoPendente ? '!' : ''}${formatarTempoBadge(Math.max(0, Number(resumo.minutosRestantes || 0)))}`;
                }
            }
            const badgeEst = this.resolverEstiloBadgePomodoro(resumo);
            const assinatura = `${txtBadge}|${badgeEst.cor}|${badgeEst.corTexto}|${infoTooltip.tooltipTitle}|${(cfg && cfg.modoTurbo) || ''}`;

            if (typeof chrome !== 'undefined' && chrome.action && this._ultimaAssinaturaAction !== assinatura) {
                this._ultimaAssinaturaAction = assinatura;
                const badgeObj = txtBadge ? { texto: txtBadge, cor: badgeEst.cor, corTexto: badgeEst.corTexto } : null;
                if (typeof self !== 'undefined') {
                    self.__JUSGOV_ULTIMO_BADGE_POMODORO__ = badgeObj;
                }
                const cfgInst = (typeof self !== 'undefined' && self.JusGovInstanciaConfig) ? self.JusGovInstanciaConfig : null;
                let desenhouNoIcone = false;
                if (cfgInst && typeof cfgInst.desenharIconeVetorialFallback === 'function') {
                    const modoAtual = (cfg && cfg.modoTurbo) || (typeof self !== 'undefined' && self.__JUSGOV_MODO_TURBO_ATUAL__) || 'global';
                    const compAtual = (cfg && cfg.comportamentoCliqueIcone) || (typeof self !== 'undefined' && self.__JUSGOV_COMPORTAMENTO_ICONE_ATUAL__) || 'popup';
                    desenhouNoIcone = Boolean(cfgInst.desenharIconeVetorialFallback(modoAtual, compAtual, chrome, badgeObj));
                }
                if (chrome.action.setBadgeText) {
                    if (desenhouNoIcone) {
                        chrome.action.setBadgeText({ text: '' }).catch(() => { });
                    } else {
                        chrome.action.setBadgeText({ text: txtBadge }).catch(() => { });
                        if (txtBadge && chrome.action.setBadgeBackgroundColor) {
                            chrome.action.setBadgeBackgroundColor({ color: badgeEst.cor }).catch(() => { });
                        }
                        if (txtBadge && chrome.action.setBadgeTextColor) {
                            chrome.action.setBadgeTextColor({ color: badgeEst.corTexto }).catch(() => { });
                        }
                    }
                }
                if (chrome.action.setTitle) {
                    chrome.action.setTitle({
                        title: infoTooltip.tooltipTitle || 'JusGovBR — Seleção/Cópia Inteligente'
                    }).catch(() => { });
                }
            }
            return { resumo, infoTooltip, prefs };
        }

        /**
         * Retorna a funcao autocontida serializavel para `chrome.scripting.executeScript` do minipopup Pomodoro (BUG-78).
         * @returns {Function}
         */
        obterFuncaoInjecaoBarraPomodoro() {
            return (cfgExib, dadosResumo, estadoBarra) => {
                            const idHost = 'jusgov-pomodoro-barra-global';
                            const idBackdrop = 'jusgov-pomodoro-backdrop-global';
                            const idBackdropStyle = 'jusgov-pomodoro-backdrop-style';
                            const idModal = 'jusgov-modal-produtividade-trabalho';

                            const removerBackdropBlur = () => {
                                const bd = document.getElementById(idBackdrop);
                                if (bd) bd.remove();
                                const stBd = document.getElementById(idBackdropStyle);
                                if (stBd) stBd.remove();
                            };
                            const garantirBackdropStyle = () => {
                                if (document.getElementById(idBackdropStyle)) return;
                                const st = document.createElement('style');
                                st.id = idBackdropStyle;
                                st.textContent = [
                                    '@keyframes jusgov-descanso-fade-lento{0%,100%{background:rgba(2,18,38,0.14);box-shadow:inset 0 0 40px rgba(56,189,248,0.08)}50%{background:rgba(2,24,52,0.44);box-shadow:inset 0 0 90px rgba(56,189,248,0.22)}}',
                                    '@keyframes jusgov-retorno-blink-tela{0%,100%{background:rgba(22,163,74,0.06);box-shadow:inset 0 0 28px rgba(74,222,128,0.25)}50%{background:rgba(34,197,94,0.34);box-shadow:inset 0 0 110px rgba(74,222,128,0.82)}}',
                                    '@keyframes jusgov-retorno-rajada{0%,100%{background:rgba(22,163,74,0.10);box-shadow:inset 0 0 40px rgba(74,222,128,0.35)}45%{background:rgba(134,239,172,0.48);box-shadow:inset 0 0 140px rgba(255,255,255,0.88)}70%{background:rgba(34,197,94,0.42);box-shadow:inset 0 0 120px rgba(74,222,128,0.92)}}'
                                ].join('');
                                (document.head || document.documentElement).appendChild(st);
                            };
                            const atualizarBackdropTelaCheia = (modo = 'nenhum') => {
                                if (!modo || modo === 'nenhum') {
                                    removerBackdropBlur();
                                    return;
                                }
                                garantirBackdropStyle();
                                let bd = document.getElementById(idBackdrop);
                                if (!bd) {
                                    bd = document.createElement('div');
                                    bd.id = idBackdrop;
                                    bd.setAttribute('data-jusgov-ignore', 'true');
                                    bd.style.cssText = 'position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;pointer-events:none !important;z-index:2147483646 !important;margin:0 !important;padding:0 !important;border:0 !important;';
                                    (document.body || document.documentElement).appendChild(bd);
                                }
                                if (bd.getAttribute('data-modo') === modo) return;
                                bd.setAttribute('data-modo', modo);
                                if (modo === 'descanso_calmo') {
                                    bd.style.animation = 'jusgov-descanso-fade-lento 8s ease-in-out infinite';
                                } else if (modo === 'retorno_rajada') {
                                    bd.style.animation = 'jusgov-retorno-rajada 0.55s ease-in-out infinite';
                                } else if (modo === 'retorno_trabalho') {
                                    bd.style.animation = 'jusgov-retorno-blink-tela 1.8s ease-in-out infinite';
                                }
                            };
                            const garantirBackdropBlur = () => {
                                atualizarBackdropTelaCheia('descanso_calmo');
                            };

                            const gerenciarModalDescanso = () => {
                                const existente = document.getElementById(idModal);
                                if (existente) existente.remove();
                            };

                            const iniciouComChromeRuntime = Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
                            const destruirHost = (h) => {
                                removerBackdropBlur();
                                if (!h) return;
                                h.__jusgovHostDestruido = true;
                                if (h.__jusgovScreensaverRaf) {
                                    cancelAnimationFrame(h.__jusgovScreensaverRaf);
                                    h.__jusgovScreensaverRaf = 0;
                                }
                                if (h.__jusgovPatrulhaRaf) {
                                    cancelAnimationFrame(h.__jusgovPatrulhaRaf);
                                    h.__jusgovPatrulhaRaf = 0;
                                }
                                if (h.__jusgovHoverTimerSaida) { clearTimeout(h.__jusgovHoverTimerSaida); h.__jusgovHoverTimerSaida = 0; }
                                if (h.__jusgovTimerInterval) { clearInterval(h.__jusgovTimerInterval); h.__jusgovTimerInterval = 0; }
                                if (h.__jusgovTimerRetorno) { clearTimeout(h.__jusgovTimerRetorno); h.__jusgovTimerRetorno = null; }
                                if (h.__jusgovPropTimer) { clearTimeout(h.__jusgovPropTimer); h.__jusgovPropTimer = 0; }
                                if (h.__jusgovBannerShowTimer) { clearTimeout(h.__jusgovBannerShowTimer); h.__jusgovBannerShowTimer = 0; }
                                if (h.__jusgovBannerHideTimer) { clearTimeout(h.__jusgovBannerHideTimer); h.__jusgovBannerHideTimer = 0; }
                                if (h.__jusgovGovFeedbackTimer) { clearTimeout(h.__jusgovGovFeedbackTimer); h.__jusgovGovFeedbackTimer = 0; }
                                if (typeof h.__jusgovCleanupListeners === 'function') {
                                    try { h.__jusgovCleanupListeners(); } catch (_) { }
                                }
                                h.remove();
                            };

                            gerenciarModalDescanso(Boolean(cfgExib && cfgExib.deveExibirModalDescanso), cfgExib && cfgExib.modalDados, dadosResumo);

                            /* FEAT-39 / FEAT-88: Singleton estrito por reino isolado — descarta e reconstroi hosts orfaos de versoes/recargas anteriores */
                            const existentes = Array.from(document.querySelectorAll('#jusgov-pomodoro-barra-global, [data-jusgov-pomodoro-bar="true"]'));
                            let host = null;
                            const forcarReconstrucao = Boolean(cfgExib && cfgExib.forcarReconstrucao);
                            for (let dIdx = 0; dIdx < existentes.length; dIdx++) {
                                const candidato = existentes[dIdx];
                                const vivoNesteReino = Boolean(
                                    !forcarReconstrucao &&
                                    !host &&
                                    candidato &&
                                    !candidato.__jusgovHostDestruido &&
                                    typeof candidato.__jusgovAplicarSnapshotExterno === 'function'
                                );
                                if (vivoNesteReino) {
                                    host = candidato;
                                } else {
                                    destruirHost(candidato);
                                }
                            }

                            /* Remove eventual legado por guia para que todas as guias reflitam o estado global unificado */
                            try { sessionStorage.removeItem('jusgovPomodoroBarraFixadaTab'); } catch (_) { }

                            const normalizarEstadoBarra = (eb) => ({
                                modoFixacao: (eb && (eb.modoFixacao === 1 || eb.modoFixacao === 2)) ? eb.modoFixacao : 1,
                                nivelDetalhe: (eb && (eb.nivelDetalhe === 1 || eb.nivelDetalhe === 2)) ? eb.nivelDetalhe : 0,
                                posicaoVertical: (eb && eb.posicaoVertical === 'inferior') ? 'inferior' : 'superior',
                                posicaoVerticalAncorada: (eb && eb.posicaoVerticalAncorada === 'inferior')
                                    ? 'inferior'
                                    : ((eb && eb.posicaoVertical === 'inferior') ? 'inferior' : 'superior'),
                                alinhamento: (eb && (eb.alinhamento === 'centro' || eb.alinhamento === 'direita')) ? eb.alinhamento : 'esquerda',
                                alinhamentoAncorado: (eb && (eb.alinhamentoAncorado === 'esquerda' || eb.alinhamentoAncorado === 'direita' || eb.alinhamentoAncorado === 'centro'))
                                    ? eb.alinhamentoAncorado
                                    : ((eb && (eb.alinhamento === 'centro' || eb.alinhamento === 'direita')) ? eb.alinhamento : 'esquerda'),
                                minimizadoMicro: Boolean(eb && eb.minimizadoMicro),
                                minimizadoDescansoAdiadoTs: Math.max(0, Math.round(Number((eb && eb.minimizadoDescansoAdiadoTs) || 0)))
                            });

                            const resolverPermissaoExibicao = (hRef, cExib, dRes) => {
                                const chave = `${dRes.fase}:${dRes.cicloAtual}:${dRes.faseInicioTs}`;
                                try { sessionStorage.removeItem('jusgovPomodoroBarraFechadaFaseTab'); } catch (_) { }
                                const fechadaNaGuia = false;
                                const podeBannerOculto = Boolean(
                                    cExib && cExib.ativoPorConfig &&
                                    !fechadaNaGuia &&
                                    !cExib.deveExibirNormal &&
                                    cExib.bannerPropagandaOculta
                                );
                                const deveExibir = Boolean(
                                    cExib && cExib.ativoPorConfig &&
                                    !fechadaNaGuia &&
                                    (cExib.deveExibirNormal || podeBannerOculto)
                                );
                                return {
                                    deveExibir,
                                    deveExibirNormal: Boolean(cExib && cExib.deveExibirNormal),
                                    podeBannerOculto,
                                    chave
                                };
                            };

                            const obterModoPosicaoEspecial = (d, agoraNow = Date.now()) => {
                                if (d && d.emDescanso) {
                                    const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
                                    const concluido = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);
                                    if (!concluido && d.descansoEmAviso) {
                                        return (d.descansoUltimoTipoInteracao === 'movimento') ? 'aviso_movimento_centro_blur' : 'aviso_topo_centro';
                                    }
                                    const ativAte = Number(d.descansoAtividadeAteTs || 0);
                                    const semScreensaverAte = Number(d.descansoSemScreensaverAteTs || 0);
                                    if (!concluido && !d.aguardandoOciosidade && semScreensaverAte > 0 && agoraNow < semScreensaverAte) {
                                        return 'aviso_topo_centro';
                                    }
                                    if (!d.aguardandoOciosidade && (concluido || (!d.descansoRealizado && agoraNow >= Math.max(ativAte, semScreensaverAte)))) return 'idle_centro_tela';
                                }
                                return 'padrao';
                            };

                            const exibInicial = resolverPermissaoExibicao(host, cfgExib, dadosResumo);
                            if (!exibInicial.deveExibir) {
                                destruirHost(host);
                                return;
                            }

                            /* Posicionamento estrito em coordenadas numéricas (px) para permitir transição rápida e fluida entre quaisquer 6 bordas, topo central e centro */
                            const obterDimensoesAtuaisHost = (h) => {
                                const uiRef = h && h.__jusgovUI;
                                const candidatos = [
                                    uiRef && uiRef.microIconeBox,
                                    uiRef && uiRef.boxBannerOculto,
                                    uiRef && uiRef.pill
                                ];
                                for (let i = 0; i < candidatos.length; i++) {
                                    const el = candidatos[i];
                                    if (el && el.style.display !== 'none') {
                                        const r = el.getBoundingClientRect();
                                        if (r && r.width > 8 && r.height > 8) {
                                            return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
                                        }
                                    }
                                }
                                const rh = h && typeof h.getBoundingClientRect === 'function' ? h.getBoundingClientRect() : null;
                                return {
                                    w: (rh && rh.width > 8) ? Math.ceil(rh.width) : 96,
                                    h: (rh && rh.height > 8) ? Math.ceil(rh.height) : 22
                                };
                            };

                            const aplicarPosicao = (h, posVertVal, alinhVal, leftLivre = null, topLivre = null, animar = false) => {
                                if (!h) return;
                                const docEl = document.documentElement;
                                const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                const dims = obterDimensoesAtuaisHost(h);
                                const largRef = Math.min(wTela, dims.w);
                                const altRef = Math.min(hTela, dims.h);
                                const maxLeft = Math.max(0, wTela - largRef);
                                const maxTop = Math.max(0, hTela - altRef);
                                h.style.setProperty('transition', animar ? 'left 0.22s cubic-bezier(0.22,1,0.36,1),top 0.22s cubic-bezier(0.22,1,0.36,1)' : 'none', 'important');

                                if (leftLivre !== null && topLivre !== null && Number.isFinite(Number(leftLivre)) && Number.isFinite(Number(topLivre))) {
                                    const leftSeguro = Math.max(0, Math.min(maxLeft, Math.round(Number(leftLivre))));
                                    const topSeguro = Math.max(0, Math.min(maxTop, Math.round(Number(topLivre))));
                                    h.style.setProperty('top', `${topSeguro}px`, 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                    h.style.setProperty('left', `${leftSeguro}px`, 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                    return;
                                }
                                if (posVertVal === 'centro_tela') {
                                    const leftCx = Math.max(0, Math.min(maxLeft, Math.round((wTela - largRef) / 2)));
                                    const topCy = Math.max(0, Math.min(maxTop, Math.round((hTela - altRef) / 2)));
                                    h.style.setProperty('top', `${topCy}px`, 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                    h.style.setProperty('left', `${leftCx}px`, 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                    h.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: topCy, leftPx: leftCx };
                                    return;
                                }
                                const posVert = (posVertVal === 'inferior') ? 'inferior' : 'superior';
                                const alinh = (alinhVal === 'esquerda' || alinhVal === 'direita') ? alinhVal : 'centro';
                                const topAlvo = (posVert === 'inferior') ? maxTop : 0;
                                const leftAlvo = (alinh === 'esquerda')
                                    ? 0
                                    : ((alinh === 'direita') ? maxLeft : Math.max(0, Math.min(maxLeft, Math.round((wTela - largRef) / 2))));
                                h.style.setProperty('top', `${topAlvo}px`, 'important');
                                h.style.setProperty('bottom', 'auto', 'important');
                                h.style.setProperty('left', `${leftAlvo}px`, 'important');
                                h.style.setProperty('right', 'auto', 'important');
                                h.style.setProperty('transform', 'none', 'important');
                                h.__jusgovPos = { posicaoVertical: posVert, alinhamento: alinh, topPx: topAlvo, leftPx: leftAlvo };
                            };

                            const pathsBemEstar = {
                                play: ['M4.5 3.2 13 8 4.5 12.8z'],
                                pause: ['M4 3h3v10H4z', 'M9 3h3v10H9z'],
                                agua: ['M8 1.5C8 1.5 3.5 6.8 3.5 10a4.5 4.5 0 0 0 9 0C12.5 6.8 8 1.5 8 1.5zm-1.8 9.2a2.1 2.1 0 0 1-.4-1.3'],
                                esticar: ['M8 2.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM3.2 3.4l2.7 2.4h4.2l2.7-2.4-.9-.9L9.6 4.7H6.4L4.1 2.5zM6 6.2v4.6l-1.5 3.5 1.1.5L7.5 11h1l1.9 3.8 1.1-.5L10 10.8V6.2z'],
                                olhos: ['M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8s-2.4 4.2-6.5 4.2S1.5 8 1.5 8zm6.5-2.1a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2z'],
                                respirar: ['M2 5.8h7.4a1.8 1.8 0 1 0-1.8-1.8', 'M2 8.8h9.8a1.9 1.9 0 1 1-1.9 1.9', 'M2 11.6h5.5'],
                                sem_celular: ['M5.2 2h5.6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2.2 2.2l11.6 11.6'],
                                sem_tela: ['M2.5 3.2h11v7.6h-11zM6.2 13h3.6M2 2l12 12'],
                                sol: ['M8 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1'],
                                sem_tarefa: ['M3 3h10v10H3zM5.5 6.5h5M5.5 9.5h3M2 2l12 12'],
                                lanche: ['M4 6h7.2v4.2a3.2 3.2 0 0 1-6.4 0V6zm7.2.8h1.5a1.5 1.5 0 0 1 0 3h-1.5M5.8 2.5c0 .9-.7 1.3-.7 2.1M8.6 2.5c0 .9-.7 1.3-.7 2.1'],
                                caminhar: ['M8.8 2a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 8.8 2zM6.4 5.5l2.6.6 1.8 2.2-.9.8-1.5-1.7-1.1 2.4 2.1 3.9-1.2.6-2-3.4-1.7 3.4-1.2-.6 2.2-4.6z'],
                                musica: ['M6 12.2a1.8 1.8 0 1 1-2-1.8V4.2l8-1.6v8.2a1.8 1.8 0 1 1-2-1.8V4.5l-4 .8v6.9z'],
                                organizar: ['M2.2 4a1 1 0 0 1 1-1h3.5l1.1 1.4h5a1 1 0 0 1 1 1v6.6a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V4z'],
                                desconectar: ['M8 2v4.5M4.6 4.1a5.2 5.2 0 1 0 6.8 0'],
                                retorno_trabalho: ['M3 5.2h10v7.6H3zM5.8 3.2h4.4v2H5.8z'],
                                incentivo_descanso: ['M4.5 2.5h7v1.2L9.2 7.5l2.3 3.8v1.2h-7v-1.2L6.8 7.5 4.5 3.7z'],
                                cafe: ['M3 6.5h7.5v3.8a3.2 3.2 0 0 1-3.2 3.2H6.2A3.2 3.2 0 0 1 3 10.3V6.5zm7.5.7h1.4a1.5 1.5 0 0 1 0 3h-1.4M5.4 2.2c0 1 .9 1.4.9 2.4M8.1 2.2c0 1 .9 1.4.9 2.4M2.5 14.3h8.8'],
                                copo_agua: ['M4.2 2.5h7.6l-.9 11H5.1l-.9-11zM4.7 7.2c1.1-.6 2.2.6 3.3 0s2.2-.6 3.3 0'],
                                vitamina: ['M5 5.2h6l-.8 8.3H5.8L5 5.2zm2.5 0L9.2 1.8h2M4.3 5.2h7.4M6.5 8.5c1 .5 2-.5 3 0'],
                                sem_redes: ['M2.8 3.6h10.4a1 1 0 0 1 1 1v6.2a1 1 0 0 1-1 1H6.5L3.6 14v-2.2H2.8a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1zM2 2l12 12'],
                                sem_notificacoes: ['M8 2.2a3.5 3.5 0 0 1 3.5 3.5v3l1.2 1.8H3.3L4.5 8.7v-3A3.5 3.5 0 0 1 8 2.2zm-1.3 9.5a1.4 1.4 0 0 0 2.6 0M2 2l12 12'],
                                sem_email: ['M2.2 3.8h11.6v8.4H2.2V3.8zm0 .4L8 8.6l5.8-4.4M2 2l12 12']
                            };
                            const criarIconeSvgBemEstar = (tipo, cor, tamanho = 13, strokedOnly = false) => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', String(tamanho));
                                svg.setAttribute('height', String(tamanho));
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
                                svg.style.flexShrink = '0';
                                svg.style.pointerEvents = 'none';
                                const lista = pathsBemEstar[tipo] || pathsBemEstar.esticar;
                                const usaStroke = strokedOnly || ['agua', 'respirar', 'sem_celular', 'sem_tela', 'sol', 'sem_tarefa', 'lanche', 'desconectar', 'olhos', 'cafe', 'copo_agua', 'vitamina', 'sem_redes', 'sem_notificacoes', 'sem_email'].includes(tipo);
                                for (let i = 0; i < lista.length; i++) {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', lista[i]);
                                    if (usaStroke) {
                                        p.setAttribute('stroke', cor);
                                        p.setAttribute('stroke-width', '1.45');
                                        p.setAttribute('stroke-linecap', 'round');
                                        p.setAttribute('stroke-linejoin', 'round');
                                    } else {
                                        p.setAttribute('fill', cor);
                                    }
                                    svg.appendChild(p);
                                }
                                return svg;
                            };

                            const criarIconeSvgDiscreto = (tipo, cor) => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', '12');
                                svg.setAttribute('height', '12');
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
                                svg.style.pointerEvents = 'none';
                                if (tipo === 'cadeado') {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', 'M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2z');
                                    p.setAttribute('fill', cor);
                                    svg.appendChild(p);
                                } else if (tipo === 'mini') {
                                    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                                    c.setAttribute('cx', '8');
                                    c.setAttribute('cy', '8');
                                    c.setAttribute('r', '5.5');
                                    c.setAttribute('stroke', cor);
                                    c.setAttribute('stroke-width', '1.8');
                                    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    pt.setAttribute('d', 'M8 4.8V8l2.2 1.4');
                                    pt.setAttribute('stroke', cor);
                                    pt.setAttribute('stroke-width', '1.6');
                                    pt.setAttribute('stroke-linecap', 'round');
                                    svg.appendChild(c);
                                    svg.appendChild(pt);
                                } else if (tipo === 'minimizar') {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', 'M3 10.6h10v2H3z');
                                    p.setAttribute('fill', cor);
                                    svg.appendChild(p);
                                } else if (tipo === 'expandir') {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', 'M3 8.2V3h5.2v1.6H4.6v3.6H3zm10-.4V13H7.8v-1.6h3.6V7.8H13z');
                                    p.setAttribute('fill', cor);
                                    svg.appendChild(p);
                                } else {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', 'M9.8 2.2 13.8 6.2l-1.1 1.1-1-.3-2.5 2.5.4 2.1-1.1 1.1-2.2-2.2-3.1 3.1-.8-.8 3.1-3.1-2.2-2.2 1.1-1.1 2.1.4 2.5-2.5-.3-1 1.1-1.1z');
                                    p.setAttribute('fill', cor);
                                    svg.appendChild(p);
                                }
                                return svg;
                            };

                            const criarIconeAppMicro = (tamanho = 12, corRaio = '#10b981') => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', String(tamanho));
                                svg.setAttribute('height', String(tamanho));
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
                                svg.style.pointerEvents = 'none';
                                const raio = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                raio.setAttribute('d', 'M9.6 1.5 4.1 8.8h3.5l-.8 5.7 5.5-7.3H8.8z');
                                raio.setAttribute('fill', corRaio);
                                svg.appendChild(raio);
                                return svg;
                            };

                            const atualizarVisualBotaoFixar = (btn, modoFix, emModoDescansoConfig = false) => {
                                if (!btn) return;
                                btn.style.background = 'transparent';
                                btn.style.boxShadow = 'none';
                                btn.style.borderRadius = '3px';
                                const chaveFixar = emModoDescansoConfig ? 'pin' : ((modoFix === 2) ? 'cadeado_livre' : 'cadeado_fixo');
                                if (btn.__jusgovIconeChave === chaveFixar) return;
                                btn.__jusgovIconeChave = chaveFixar;
                                if (emModoDescansoConfig) {
                                    btn.replaceChildren(criarIconeSvgDiscreto('pin', '#94a3b8'));
                                    btn.title = 'Fixar também durante o período Ativo (volta para Cadeado Amarelo)';
                                } else if (modoFix === 2) {
                                    btn.replaceChildren(criarIconeSvgDiscreto('cadeado', '#94a3b8'));
                                    btn.title = 'Posição Livre na Linha (ao desviar do mouse permanece no novo ponto; clique para fixar com retorno)';
                                } else {
                                    btn.replaceChildren(criarIconeSvgDiscreto('cadeado', '#facc15'));
                                    btn.title = 'Posição Fixada com Retorno (retorna ao lugar quando o mouse sair; clique para deixar livre na linha)';
                                }
                            };

                            const enviarEstadoGlobal = (patch) => {
                                try {
                                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                        chrome.runtime.sendMessage({
                                            acao: 'ATUALIZAR_ESTADO_BARRA_POMODORO',
                                            ...patch
                                        }).catch(() => { });
                                    }
                                } catch (_) { }
                            };

                            if (!host) {
                                host = document.createElement('div');
                                host.id = idHost;
                                host.setAttribute('data-jusgov-pomodoro-bar', 'true');
                                host.setAttribute('data-jusgov-ignore', 'true');
                                host.style.cssText = 'position:fixed !important;top:0px !important;bottom:auto !important;left:0px !important;right:auto !important;transform:none !important;margin:0 !important;padding:0 !important;border:0 !important;line-height:1 !important;width:auto !important;height:auto !important;z-index:2147483647 !important;pointer-events:none !important;font-family:"Segoe UI",system-ui,-apple-system,sans-serif !important;transition:none !important;';
                                const shadow = host.attachShadow({ mode: 'closed' });
                                const styleAnim = document.createElement('style');
                                styleAnim.textContent = '@keyframes jusgov-piscar-crono{0%,49%{opacity:1}50%,100%{opacity:0.22}}@keyframes jusgov-piscar-icone{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.42;transform:scale(1.12)}}@keyframes jusgov-pill-retorno{0%,100%{background:#065f46;border-color:#4ade80;box-shadow:0 0 22px rgba(74,222,128,0.85),0 6px 18px rgba(0,0,0,0.45)}50%{background:#15803d;border-color:#fef08a;box-shadow:0 0 36px rgba(134,239,172,1),0 6px 22px rgba(0,0,0,0.5)}}.jg-piscar{animation:jusgov-piscar-icone 0.9s ease-in-out infinite;transform-origin:center;}';
                                shadow.appendChild(styleAnim);
                                const pill = document.createElement('div');
                                pill.style.cssText = 'pointer-events:auto;display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:1px 6px;border-radius:7px;background:#0f172a;color:#f8fafc;font-size:11px;line-height:1.1;font-weight:600;box-shadow:0 4px 14px rgba(15,23,42,0.34);border:1px solid #0d9488;white-space:nowrap;cursor:grab;user-select:none;touch-action:none;margin:0;';
                                const linhaPrincipal = document.createElement('div');
                                linhaPrincipal.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:5px;line-height:1.1;';
                                const linhaAcoes = document.createElement('div');
                                linhaAcoes.setAttribute('data-parte', 'acoes');
                                linhaAcoes.style.cssText = 'display:none;align-items:center;justify-content:center;gap:6px;line-height:1;padding-top:1px;border-top:1px solid rgba(148,163,184,0.16);';
                                const spanFase = document.createElement('span');
                                spanFase.setAttribute('data-parte', 'fase');
                                spanFase.style.cssText = 'font-size:11px;line-height:1.1;';
                                const spanTempo = document.createElement('span');
                                spanTempo.setAttribute('data-parte', 'tempo');
                                spanTempo.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;font-size:11px;line-height:1.1;';
                                const btnContinuarDesc = document.createElement('button');
                                btnContinuarDesc.type = 'button';
                                btnContinuarDesc.setAttribute('data-parte', 'btn-continuar-descanso');
                                btnContinuarDesc.title = 'Retomar descanso pulado (salva tempo atual de Foco)';
                                btnContinuarDesc.style.cssText = 'background:transparent;border:none;line-height:1;cursor:pointer;padding:1px 2px;display:none;align-items:center;justify-content:center;';
                                btnContinuarDesc.replaceChildren(criarIconeSvgBemEstar('play', '#38bdf8', 11));
                                const btnPararFlex = document.createElement('button');
                                btnPararFlex.type = 'button';
                                btnPararFlex.setAttribute('data-parte', 'btn-parar-flex');
                                btnPararFlex.title = 'Adiantar Alívio / Pausar descanso';
                                btnPararFlex.style.cssText = 'background:transparent;border:none;line-height:1;cursor:pointer;padding:1px 2px;display:none;align-items:center;justify-content:center;';
                                btnPararFlex.replaceChildren(criarIconeSvgBemEstar('pause', '#fbbf24', 11));
                                const spanStatus = document.createElement('span');
                                spanStatus.setAttribute('data-parte', 'status');
                                spanStatus.style.cssText = 'width:100%;box-sizing:border-box;text-align:center;padding:1px 5px;border-radius:4px;font-size:10px;line-height:1.15;font-weight:700;display:none;';
                                const linhaPropaganda = document.createElement('div');
                                linhaPropaganda.setAttribute('data-parte', 'propaganda');
                                linhaPropaganda.style.cssText = 'display:none;align-items:center;gap:5px;padding:2px 6px;border-radius:4px;font-size:10px;line-height:1.2;font-weight:700;white-space:normal;max-width:255px;box-sizing:border-box;';
                                const spanPropIcone = document.createElement('span');
                                spanPropIcone.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
                                const spanPropTexto = document.createElement('span');
                                spanPropTexto.style.cssText = 'flex:1;';
                                linhaPropaganda.appendChild(spanPropIcone);
                                linhaPropaganda.appendChild(spanPropTexto);
                                const boxBannerOculto = document.createElement('div');
                                boxBannerOculto.setAttribute('data-parte', 'banner-propaganda-oculta');
                                boxBannerOculto.style.cssText = 'pointer-events:auto;display:none;align-items:center;gap:7px;padding:4px 8px;border-radius:9px;background:#0284c7;color:#ffffff;font-size:11px;line-height:1.15;font-weight:700;box-shadow:0 6px 18px rgba(15,23,42,0.42);border:1px solid rgba(255,255,255,0.45);cursor:pointer;max-width:250px;';
                                const spanBannerIcone = document.createElement('span');
                                spanBannerIcone.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
                                const spanBannerTexto = document.createElement('span');
                                spanBannerTexto.style.cssText = 'flex:1;white-space:normal;';
                                const btnBannerIniciar = document.createElement('button');
                                btnBannerIniciar.type = 'button';
                                btnBannerIniciar.title = 'Iniciar/Retomar Descanso agora';
                                btnBannerIniciar.style.cssText = 'background:rgba(15,23,42,0.45);border:1px solid rgba(255,255,255,0.45);border-radius:5px;padding:3px 5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;';
                                btnBannerIniciar.replaceChildren(criarIconeSvgBemEstar('play', '#ffffff', 12));
                                boxBannerOculto.appendChild(spanBannerIcone);
                                boxBannerOculto.appendChild(spanBannerTexto);
                                boxBannerOculto.appendChild(btnBannerIniciar);
                                const btnFixar = document.createElement('button');
                                btnFixar.type = 'button';
                                btnFixar.style.cssText = 'background:transparent;border:none;line-height:1;cursor:pointer;padding:1px 2px;display:none;align-items:center;justify-content:center;';
                                const btnMinimizar = document.createElement('button');
                                btnMinimizar.type = 'button';
                                btnMinimizar.setAttribute('data-parte', 'btn-minimizar');
                                btnMinimizar.title = 'Minimizar para micro-ícone (passe o mouse para restaurar)';
                                btnMinimizar.style.cssText = 'background:transparent;border:none;color:#cbd5e1;line-height:1;cursor:pointer;padding:2px 4px;min-width:16px;min-height:16px;display:none;align-items:center;justify-content:center;';
                                btnMinimizar.__jusgovIconeChave = 'minimizar_micro';
                                btnMinimizar.replaceChildren(criarIconeSvgDiscreto('minimizar', '#cbd5e1'));
                                const microIconeBox = document.createElement('div');
                                microIconeBox.setAttribute('data-parte', 'micro-icone');
                                microIconeBox.style.cssText = 'pointer-events:auto;display:none;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:#0f172a;border:1.5px solid #0d9488;box-shadow:0 4px 14px rgba(15,23,42,0.34);cursor:grab;user-select:none;touch-action:none;box-sizing:border-box;padding:0;margin:0;';
                                microIconeBox.replaceChildren(criarIconeAppMicro(12, '#10b981'));
                                linhaPrincipal.appendChild(spanFase);
                                linhaPrincipal.appendChild(spanTempo);
                                linhaAcoes.appendChild(btnContinuarDesc);
                                linhaAcoes.appendChild(btnPararFlex);
                                linhaAcoes.appendChild(btnFixar);
                                linhaAcoes.appendChild(btnMinimizar);
                                pill.appendChild(linhaPrincipal);
                                pill.appendChild(linhaAcoes);
                                pill.appendChild(spanStatus);
                                pill.appendChild(linhaPropaganda);
                                shadow.appendChild(pill);
                                shadow.appendChild(boxBannerOculto);
                                shadow.appendChild(microIconeBox);
                                host.__jusgovUI = {
                                    pill, linhaPrincipal, linhaAcoes, spanFase, spanTempo,
                                    btnContinuarDesc, btnPararFlex, spanStatus,
                                    linhaPropaganda, spanPropIcone, spanPropTexto,
                                    boxBannerOculto, spanBannerIcone, spanBannerTexto, btnBannerIniciar,
                                    microIconeBox, btnFixar, btnMinimizar
                                };

                                const resolverCorBordaSemaforo = (dSem) => {
                                    if (!dSem || typeof dSem !== 'object' || dSem.ativo === false || dSem.emPausa) {
                                        return '#64748b';
                                    }
                                    const metaMsSem = Number(dSem.metaFaseMs || 0) > 0
                                        ? Number(dSem.metaFaseMs)
                                        : (Math.max(1, Number(dSem.metaFaseMin || 1)) * 60000);
                                    const cumpridoSem = Boolean(dSem.emDescanso && (dSem.descansoMinCumprido || Number(dSem.descansoAcumuladoMs || 0) >= metaMsSem));
                                    if (dSem.emDescanso) {
                                        if (!cumpridoSem && dSem.descansoEmAviso && dSem.descansoAvisoTexto) return '#eab308';
                                        if (cumpridoSem) return '#16a34a';
                                        if (dSem.aguardandoOciosidade) return '#dc2626';
                                        return '#0284c7';
                                    }
                                    if (dSem.descansoPendente) return '#dc2626';
                                    const metaFocoSegSem = Math.max(1, Number(dSem.metaFaseMin || dSem.focoMin || 45)) * 60;
                                    const segDecSem = Math.max(0, Number(dSem.segundosDecorridos || 0));
                                    const emAlerta30Sem = Boolean((metaFocoSegSem - segDecSem) > 0 && (metaFocoSegSem - segDecSem) <= 30);
                                    if (dSem.descansoPulado || emAlerta30Sem) return '#eab308';
                                    return '#0d9488';
                                };

                                const restaurarBordaSemaforo = () => {
                                    const corBorda = resolverCorBordaSemaforo(host.__jusgovDados || dadosResumo);
                                    pill.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease';
                                    pill.style.borderColor = corBorda;
                                    pill.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    microIconeBox.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease';
                                    microIconeBox.style.borderColor = corBorda;
                                    microIconeBox.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    return corBorda;
                                };

                                const aplicarBordaArcoIrisAleatoria = (tsNow = performance.now(), modo = 'descanso') => {
                                    const proxTroca = Number(host.__jusgovArcoIrisProxTs || 0);
                                    if (tsNow >= proxTroca) {
                                        const passoIntervaloMs = (modo === 'arraste')
                                            ? 75
                                            : ((modo === 'patrulha') ? 130 : 220);
                                        host.__jusgovArcoIrisProxTs = tsNow + passoIntervaloMs;
                                        if (!Number.isFinite(host.__jusgovArcoIrisHue)) {
                                            host.__jusgovArcoIrisHue = Math.floor(Math.random() * 360);
                                        }
                                        if (!Number.isFinite(host.__jusgovArcoIrisDir) || Math.random() < 0.04) {
                                            host.__jusgovArcoIrisDir = Math.random() < 0.5 ? 1 : -1;
                                        }
                                        const deltaHue = (modo === 'arraste')
                                            ? (18 + Math.random() * 32)
                                            : ((modo === 'patrulha')
                                                ? (3.2 + Math.random() * 2.4)
                                                : (1.1 + Math.random() * 0.9));
                                        host.__jusgovArcoIrisHue = (Number(host.__jusgovArcoIrisHue) + host.__jusgovArcoIrisDir * deltaHue + 360) % 360;
                                        const hueBase = Math.round(host.__jusgovArcoIrisHue);
                                        const sat = (modo === 'descanso') ? 76 : ((modo === 'patrulha') ? 86 : 92);
                                        const lum = (modo === 'descanso') ? 54 : 58;
                                        const alphaGlow = (modo === 'descanso') ? 0.22 : ((modo === 'patrulha') ? 0.42 : 0.58);
                                        const transCss = (modo === 'arraste')
                                            ? 'border-color 0.14s linear, box-shadow 0.14s linear'
                                            : ((modo === 'patrulha')
                                                ? 'border-color 0.26s linear, box-shadow 0.26s linear'
                                                : 'border-color 0.55s linear, box-shadow 0.55s linear');
                                        const corHexHsl = `hsl(${hueBase}, ${sat}%, ${lum}%)`;
                                        const brilho = `0 0 8px hsla(${hueBase}, 90%, 60%, ${alphaGlow}), 0 4px 14px rgba(15,23,42,0.34)`;
                                        pill.style.transition = transCss;
                                        pill.style.borderColor = corHexHsl;
                                        pill.style.boxShadow = brilho;
                                        microIconeBox.style.transition = transCss;
                                        microIconeBox.style.borderColor = corHexHsl;
                                        microIconeBox.style.boxShadow = brilho;
                                    }
                                };
                                host.__jusgovArrastando = false;
                                host.__jusgovCooldownEsquiva = 0;
                                host.__jusgovRetornoRect = null;
                                host.__jusgovTimerRetorno = null;
                                host.__jusgovUltimoCursor = { x: -9999, y: -9999 };

                                const agendarRetornoPosicaoAncorada = () => {
                                    if (!host.__jusgovRetornoRect) return;
                                    const dRet = host.__jusgovDados || dadosResumo;
                                    const modoEspRet = obterModoPosicaoEspecial(dRet, Date.now());
                                    const est = host.__jusgovEstadoBarra;
                                    if (modoEspRet !== 'aviso_topo_centro' && (!est || Number(est.modoFixacao) !== 1)) {
                                        host.__jusgovRetornoRect = null;
                                        return;
                                    }
                                    if (host.__jusgovTimerRetorno) clearTimeout(host.__jusgovTimerRetorno);
                                    host.__jusgovTimerRetorno = setTimeout(() => {
                                        host.__jusgovTimerRetorno = null;
                                        const dAg = host.__jusgovDados || dadosResumo;
                                        const modoEspAg = obterModoPosicaoEspecial(dAg, Date.now());
                                        const estAgora = host.__jusgovEstadoBarra;
                                        if (modoEspAg !== 'aviso_topo_centro' && (!estAgora || Number(estAgora.modoFixacao) !== 1)) return;
                                        if (!host.__jusgovRetornoRect) return;
                                        const c = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                        const rOrig = host.__jusgovRetornoRect;
                                        const foraOrig = (c.x < rOrig.left - 14 || c.x > rOrig.right + 14 || c.y < rOrig.top - 14 || c.y > rOrig.bottom + 14);
                                        if (foraOrig) {
                                            host.__jusgovRetornoRect = null;
                                            host.__jusgovCooldownEsquiva = Date.now() + 260;
                                            if (modoEspAg === 'aviso_topo_centro') {
                                                aplicarPosicao(host, 'superior', 'centro');
                                            } else {
                                                aplicarPosicao(host, estAgora.posicaoVerticalAncorada, estAgora.alinhamentoAncorado);
                                            }
                                        }
                                    }, 450);
                                };

                                /* Zona segura geométrica cobrindo a linha de ações (continuar, parar, cadeado/pin e minimizar) */
                                const pontoEmControle = (x, y) => {
                                    const padSeg = 10;
                                    const rAcoes = linhaAcoes.getBoundingClientRect();
                                    if (rAcoes && rAcoes.width > 0 && rAcoes.height > 0 &&
                                        x >= (rAcoes.left - padSeg) && x <= (rAcoes.right + padSeg) &&
                                        y >= (rAcoes.top - 6) && y <= (rAcoes.bottom + padSeg)) {
                                        return true;
                                    }
                                    const rPill = pill.getBoundingClientRect();
                                    const rCont = btnContinuarDesc.getBoundingClientRect();
                                    const rParar = btnPararFlex.getBoundingClientRect();
                                    const rFixar = btnFixar.getBoundingClientRect();
                                    const rMin = btnMinimizar.getBoundingClientRect();
                                    const listaCtrls = [rCont, rParar, rFixar, rMin];
                                    const dentroY = (rPill && rPill.width > 0) ? (y >= (rPill.top - 4) && y <= (rPill.bottom + 4)) : true;
                                    const dirs = listaCtrls.filter(r => r && r.width > 0);
                                    if (dirs.length > 0 && dentroY) {
                                        const minLeft = Math.min(...dirs.map(r => r.left));
                                        const maxRight = (rPill && rPill.width > 0) ? (rPill.right + 4) : (Math.max(...dirs.map(r => r.right)) + padSeg);
                                        if (x >= (minLeft - padSeg) && x <= maxRight) return true;
                                    }
                                    return listaCtrls.some(r =>
                                        r && r.width > 0 &&
                                        x >= (r.left - padSeg) && x <= (r.right + padSeg) &&
                                        y >= (r.top - padSeg) && y <= (r.bottom + padSeg)
                                    );
                                };

                                const exibirFeedbackGovernanca = (textoAviso) => {
                                    if (!textoAviso) return;
                                    host.__jusgovGovFeedbackTexto = String(textoAviso);
                                    host.__jusgovGovFeedbackAteTs = Date.now() + 5000;
                                    if (host.__jusgovGovFeedbackTimer) clearTimeout(host.__jusgovGovFeedbackTimer);
                                    host.__jusgovGovFeedbackTimer = setTimeout(() => {
                                        host.__jusgovGovFeedbackAteTs = 0;
                                        if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                            host.__jusgovAtualizarPropaganda();
                                        }
                                    }, 5100);
                                    if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                        host.__jusgovAtualizarPropaganda();
                                    }
                                };

                                const contextoHostVivo = () => {
                                    if (!host || host.__jusgovHostDestruido || !host.isConnected) {
                                        if (host) destruirHost(host);
                                        return false;
                                    }
                                    if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id)) {
                                        destruirHost(host);
                                        return false;
                                    }
                                    return true;
                                };

                                const enviarAcaoFlexivel = (acaoNome) => {
                                    if (!contextoHostVivo()) return;
                                    try {
                                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                            chrome.runtime.sendMessage({ acao: acaoNome }).then((resp) => {
                                                if (!host.isConnected || host.__jusgovHostDestruido) return;
                                                if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib) {
                                                    host.__jusgovBannerVisivelAgora = false;
                                                    host.__jusgovPropCardIdx = -1;
                                                    const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                    aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                                    if (typeof host.__jusgovRotacionarPropaganda === 'function') {
                                                        host.__jusgovRotacionarPropaganda(true, true);
                                                    }
                                                } else if (resp && resp.motivo) {
                                                    exibirFeedbackGovernanca(resp.motivo);
                                                }
                                            }).catch((err) => {
                                                if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                    destruirHost(host);
                                                }
                                            });
                                        }
                                    } catch (_) {
                                        contextoHostVivo();
                                    }
                                };

                                [btnContinuarDesc, btnPararFlex, btnBannerIniciar, btnFixar].forEach((b) => {
                                    b.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); }, { passive: true });
                                    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                                });

                                btnContinuarDesc.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const dCont = host.__jusgovDados || dadosResumo;
                                    if (dCont && (dCont.emDescanso || dCont.descansoPendente || dCont.descansoEmAviso)) {
                                        const agoraVoltar = Date.now();
                                        const estVoltar = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                        estVoltar.minimizadoMicro = false;
                                        estVoltar.minimizadoDescansoAdiadoTs = 0;
                                        host.__jusgovEstadoBarra = estVoltar;
                                        host.__jusgovLocalBarraAlteradaAteTs = agoraVoltar + 1800;
                                        if (typeof host.__jusgovPararScreensaver === 'function') host.__jusgovPararScreensaver();
                                        if (typeof host.__jusgovRemoverBackdropBlur === 'function') host.__jusgovRemoverBackdropBlur();
                                        dCont.emDescanso = false;
                                        dCont.descansoPendente = false;
                                        dCont.descansoPulado = true;
                                        dCont.descansoEmAviso = false;
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({
                                                    acao: 'PULAR_DESCANSO_INICIAR_FOCO_POMODORO',
                                                    minimizarMicro: false
                                                }).then((resp) => {
                                                    if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected) {
                                                        const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                        aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || estVoltar);
                                                    }
                                                }).catch(() => { });
                                            }
                                        } catch (_) { }
                                        return;
                                    }
                                    enviarAcaoFlexivel('RETOMAR_DESCANSO_PULADO_POMODORO');
                                });

                                btnPararFlex.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    enviarAcaoFlexivel('PAUSAR_OU_ADIANTAR_POMODORO');
                                });

                                btnBannerIniciar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const dBan = host.__jusgovDados || dadosResumo;
                                    const acaoTarget = (dBan && dBan.descansoPulado)
                                        ? 'RETOMAR_DESCANSO_PULADO_POMODORO'
                                        : 'PAUSAR_OU_ADIANTAR_POMODORO';
                                    enviarAcaoFlexivel(acaoTarget);
                                });

                                boxBannerOculto.addEventListener('mouseenter', () => {
                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        const dHoverPat = host.__jusgovDados || dadosResumo;
                                        const estavaEmPatrulhaHover = Boolean(
                                            estHover.minimizadoMicro &&
                                            dHoverPat && dHoverPat.descansoPulado &&
                                            (host.__jusgovPatrulhaAtiva || host.__jusgovPatrulhaPos)
                                        );
                                        host.__jusgovPreviewPatrulhaSemBotoes = estavaEmPatrulhaHover;
                                        if (host.__jusgovHoverAcoesTimer) clearTimeout(host.__jusgovHoverAcoesTimer);
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (estavaEmPatrulhaHover) {
                                            host.__jusgovPatrulhaHoverTimer = setTimeout(() => {
                                                host.__jusgovPatrulhaHoverTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovPreviewPatrulhaSemBotoes) return;
                                                host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                host.__jusgovHoverPill = false;
                                                host.__jusgovHoverInicioTs = 0;
                                                host.__jusgovDeslocadoHoverMicro = false;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                if (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                                    host.style.setProperty('transition', 'none', 'important');
                                                    host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                                    host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                                }
                                                if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') host.__jusgovIniciarPatrulhaBorda();
                                            }, 10000);
                                        } else {
                                            host.__jusgovHoverAcoesTimer = setTimeout(() => {
                                                host.__jusgovHoverAcoesTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovHoverPill) return;
                                                host.__jusgovHoverAcoesDesbloqueadas = true;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                            }, 2200);
                                        }
                                    }
                                    host.__jusgovHoverPill = true;
                                    host.__jusgovHoverInicioTs = Date.now();
                                    if (typeof host.__jusgovAtualizarBannerOculto === 'function') {
                                        host.__jusgovAtualizarBannerOculto();
                                    }
                                    if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    }
                                });
                                boxBannerOculto.addEventListener('mouseleave', () => {
                                    setTimeout(() => {
                                        if (!pill.matches(':hover') && !boxBannerOculto.matches(':hover')) {
                                            host.__jusgovHoverPill = false;
                                            if (typeof host.__jusgovAtualizarBannerOculto === 'function') {
                                                host.__jusgovAtualizarBannerOculto();
                                            }
                                        }
                                    }, 250);
                                });

                                btnFixar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const modoBarraAtual = host.__jusgovModoBarra || 'sempre';
                                    if (modoBarraAtual === 'descanso') {
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({
                                                    acao: 'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO',
                                                    exibirNoAtivo: true
                                                }).catch(() => { });
                                            }
                                        } catch (_) { }
                                        return;
                                    }
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const novoModo = (Number(estAtual.modoFixacao) === 1) ? 2 : 1;
                                    const posAtual = host.__jusgovPos || { posicaoVertical: estAtual.posicaoVertical, alinhamento: estAtual.alinhamento };
                                    estAtual.modoFixacao = novoModo;
                                    if (novoModo !== 1) {
                                        host.__jusgovRetornoRect = null;
                                        if (host.__jusgovTimerRetorno) { clearTimeout(host.__jusgovTimerRetorno); host.__jusgovTimerRetorno = null; }
                                    } else {
                                        estAtual.posicaoVerticalAncorada = posAtual.posicaoVertical;
                                        estAtual.alinhamentoAncorado = posAtual.alinhamento;
                                    }
                                    atualizarVisualBotaoFixar(btnFixar, novoModo, false);
                                    enviarEstadoGlobal({
                                        modoFixacao: novoModo,
                                        posicaoVertical: posAtual.posicaoVertical,
                                        alinhamento: posAtual.alinhamento,
                                        topPx: (posAtual.posicaoVertical === 'inferior') ? 99999 : 0,
                                        ancorar: (novoModo === 1)
                                    });
                                });

                                btnMinimizar.addEventListener('pointerdown', (ev) => {
                                    ev.stopPropagation();
                                }, { passive: true });
                                btnMinimizar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const agoraMin = Date.now();
                                    const dAtual = host.__jusgovDados || dadosResumo;
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    if (host.__jusgovHoverTimerSaida) {
                                        clearTimeout(host.__jusgovHoverTimerSaida);
                                        host.__jusgovHoverTimerSaida = 0;
                                    }
                                    host.__jusgovHoverPill = false;
                                    host.__jusgovHoverInicioTs = 0;
                                    host.__jusgovLocalBarraAlteradaAteTs = agoraMin + 1800;
                                    if (typeof host.__jusgovPararScreensaver === 'function') host.__jusgovPararScreensaver();
                                    if (typeof host.__jusgovRemoverBackdropBlur === 'function') host.__jusgovRemoverBackdropBlur();

                                    const aplicarColapsoInstantaneo = (paraMicro) => {
                                        if (paraMicro) {
                                            host.__jusgovAguardandoSairPosMin = true;
                                            host.__jusgovSuprimirHoverMicroAteTs = agoraMin + 2400;
                                            host.style.setProperty('transition', 'none', 'important');
                                            pill.style.display = 'none';
                                            boxBannerOculto.style.display = 'none';
                                            microIconeBox.style.display = 'inline-flex';
                                        } else {
                                            host.__jusgovAguardandoSairPosMin = false;
                                            host.__jusgovSuprimirHoverMicroAteTs = 0;
                                        }
                                        host.__jusgovDeslocadoHoverMicro = false;
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                            host.__jusgovAtualizarRelogio();
                                        } else if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                            host.__jusgovAtualizarModoVisual();
                                        }
                                        if (typeof host.__jusgovAtualizarPosicaoEfetiva === 'function') {
                                            host.__jusgovAtualizarPosicaoEfetiva(agoraMin);
                                        }
                                        if (paraMicro) {
                                            requestAnimationFrame(() => {
                                                if (host && host.isConnected && !host.__jusgovPatrulhaAtiva && !host.__jusgovScreensaverAtivo) {
                                                    host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                                }
                                            });
                                        }
                                    };

                                    if (dAtual && (dAtual.emDescanso || dAtual.descansoPendente)) {
                                        estAtual.minimizadoMicro = true;
                                        estAtual.minimizadoDescansoAdiadoTs = agoraMin;
                                        host.__jusgovEstadoBarra = estAtual;
                                        host.__jusgovMinimizadoDescansoTs = agoraMin;
                                        host.__jusgovScreensaverPos = null;
                                        dAtual.emDescanso = false;
                                        dAtual.descansoPendente = false;
                                        dAtual.descansoPulado = true;
                                        dAtual.descansoEmAviso = false;
                                        aplicarColapsoInstantaneo(true);
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({
                                                    acao: 'PULAR_DESCANSO_INICIAR_FOCO_POMODORO',
                                                    minimizarMicro: true,
                                                    minimizadoDescansoAdiadoTs: agoraMin
                                                }).then((resp) => {
                                                    if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected) {
                                                        const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                        aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || estAtual);
                                                    }
                                                }).catch(() => { });
                                            }
                                        } catch (_) { }
                                        return;
                                    }

                                    const novoMinimizado = !Boolean(estAtual.minimizadoMicro);
                                    const tsAdiado = 0;
                                    estAtual.minimizadoMicro = novoMinimizado;
                                    estAtual.minimizadoDescansoAdiadoTs = tsAdiado;
                                    host.__jusgovEstadoBarra = estAtual;
                                    host.__jusgovMinimizadoDescansoTs = 0;
                                    if (typeof host.__jusgovPararPatrulhaBorda === 'function') {
                                        host.__jusgovPararPatrulhaBorda();
                                    }
                                    aplicarColapsoInstantaneo(novoMinimizado);
                                    enviarEstadoGlobal({
                                        minimizadoMicro: novoMinimizado,
                                        minimizadoDescansoAdiadoTs: tsAdiado
                                    });
                                });

                                /* Clique único sem arrastar: abre imediatamente os botões respectivos (ou restaura de micro) e NUNCA fecha nem reduz o estilo configurado */
                                const alternarModoPorCliqueUnico = () => {
                                    const agoraClk = Date.now();
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    host.__jusgovLocalBarraAlteradaAteTs = agoraClk + 1800;
                                    host.__jusgovAguardandoSairPosMin = false;
                                    host.__jusgovSuprimirHoverMicroAteTs = 0;
                                    host.__jusgovHoverPill = true;
                                    host.__jusgovHoverAcoesDesbloqueadas = true;
                                    if (host.__jusgovHoverAcoesTimer) {
                                        clearTimeout(host.__jusgovHoverAcoesTimer);
                                        host.__jusgovHoverAcoesTimer = 0;
                                    }
                                    if (host.__jusgovPatrulhaHoverTimer) {
                                        clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                        host.__jusgovPatrulhaHoverTimer = 0;
                                    }
                                    host.__jusgovPreviewPatrulhaSemBotoes = false;
                                    if (!host.isConnected && !host.__jusgovHostDestruido) {
                                        (document.body || document.documentElement).appendChild(host);
                                    }

                                    const garantirVisivelSemSnap = () => {
                                        if (!host.__jusgovModoOculto) {
                                            host.style.setProperty('display', 'block', 'important');
                                            host.style.setProperty('visibility', 'visible', 'important');
                                            host.style.setProperty('opacity', '1', 'important');
                                            microIconeBox.style.display = 'none';
                                            pill.style.display = 'inline-flex';
                                        }
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                        else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                        const docElC = document.documentElement;
                                        const wTC = Math.max(320, (docElC && docElC.clientWidth) || window.innerWidth || 1280);
                                        const hTC = Math.max(200, (docElC && docElC.clientHeight) || window.innerHeight || 720);
                                        const dimsC = obterDimensoesAtuaisHost(host);
                                        const curLC = parseFloat(host.style.left);
                                        const curTC = parseFloat(host.style.top);
                                        if (Number.isFinite(curLC) && Number.isFinite(curTC)) {
                                            const maxLC = Math.max(0, wTC - Math.min(wTC, dimsC.w));
                                            const maxTC = Math.max(0, hTC - Math.min(hTC, dimsC.h));
                                            host.style.setProperty('left', `${Math.max(0, Math.min(maxLC, Math.round(curLC)))}px`, 'important');
                                            host.style.setProperty('top', `${Math.max(0, Math.min(maxTC, Math.round(curTC)))}px`, 'important');
                                        }
                                    };

                                    if (estAtual.minimizadoMicro) {
                                        estAtual.minimizadoMicro = false;
                                        estAtual.minimizadoDescansoAdiadoTs = 0;
                                        if (typeof host.__jusgovPararPatrulhaBorda === 'function') host.__jusgovPararPatrulhaBorda();
                                        host.__jusgovEstadoBarra = estAtual;
                                        garantirVisivelSemSnap();
                                        enviarEstadoGlobal({ minimizadoMicro: false, minimizadoDescansoAdiadoTs: 0 });
                                        return;
                                    }

                                    garantirVisivelSemSnap();
                                };

                                /* Arraste fluido via Pointer Events (setPointerCapture evita travar sobre iframes) em pill e micro-ícone; clique sem arraste alterna o modo */
                                const configurarArrasteElemento = (elArraste) => {
                                    elArraste.addEventListener('mousedown', (ev) => {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                    });
                                    elArraste.addEventListener('pointerdown', (ev) => {
                                        if (ev.button !== 0) return;
                                        ev.preventDefault();
                                        const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                        if (ev.target === btnFixar || ev.target === btnMinimizar || ev.target === btnContinuarDesc || ev.target === btnPararFlex ||
                                            path.includes(btnFixar) || path.includes(btnMinimizar) || path.includes(btnContinuarDesc) || path.includes(btnPararFlex)) {
                                            return;
                                        }
                                        ev.stopPropagation();
                                        const pointerId = ev.pointerId;
                                        const startX = ev.clientX;
                                        const startY = ev.clientY;
                                        const startRect = elArraste.getBoundingClientRect();
                                        const startTop = startRect ? Math.round(startRect.top) : 0;
                                        const startLeft = startRect ? Math.round(startRect.left) : 0;
                                        const largPill = (startRect && startRect.width > 16) ? Math.ceil(startRect.width) : 24;
                                        const altPill = (startRect && startRect.height > 8) ? Math.ceil(startRect.height) : 24;
                                        const docEl = document.documentElement;
                                        const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                        const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                        let iniciouArraste = false;
                                        let finalizadoArraste = false;
                                        let ultimoCentroX = startLeft + (largPill / 2);
                                        let ultimoCentroY = startTop + (altPill / 2);

                                        const onMove = (mev) => {
                                            const dx = mev.clientX - startX;
                                            const dy = mev.clientY - startY;
                                            if (!iniciouArraste && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                                                iniciouArraste = true;
                                                host.__jusgovArrastando = true;
                                                host.__jusgovRetornoRect = null;
                                                if (typeof host.__jusgovPararPatrulhaBorda === 'function') host.__jusgovPararPatrulhaBorda();
                                                pill.style.cursor = 'grabbing';
                                                microIconeBox.style.cursor = 'grabbing';
                                                host.style.setProperty('transition', 'none', 'important');
                                                host.style.setProperty('bottom', 'auto', 'important');
                                                host.style.setProperty('right', 'auto', 'important');
                                                host.style.setProperty('transform', 'none', 'important');
                                                if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                                    host.__jusgovAtualizarModoVisual();
                                                }
                                                try {
                                                    if (typeof elArraste.setPointerCapture === 'function') elArraste.setPointerCapture(pointerId);
                                                } catch (_) { }
                                            }
                                            if (!iniciouArraste) return;
                                            const elVisivel = (microIconeBox.style.display !== 'none') ? microIconeBox : pill;
                                            const rVis = elVisivel.getBoundingClientRect();
                                            const curW = (rVis && rVis.width > 8) ? Math.ceil(rVis.width) : largPill;
                                            const curH = (rVis && rVis.height > 8) ? Math.ceil(rVis.height) : altPill;
                                            const curMaxLeft = Math.max(0, wTela - curW);
                                            const curMaxTop = Math.max(0, hTela - curH);
                                            const novoLeft = Math.max(0, Math.min(curMaxLeft, Math.round(mev.clientX - (curW / 2))));
                                            const novoTop = Math.max(0, Math.min(curMaxTop, Math.round(mev.clientY - (curH / 2))));
                                            host.style.setProperty('left', `${novoLeft}px`, 'important');
                                            host.style.setProperty('top', `${novoTop}px`, 'important');
                                            aplicarBordaArcoIrisAleatoria(performance.now(), 'arraste');
                                            ultimoCentroX = novoLeft + (curW / 2);
                                            ultimoCentroY = novoTop + (curH / 2);
                                        };
                                        const finalizarArraste = (uev) => {
                                            if (finalizadoArraste) return;
                                            finalizadoArraste = true;
                                            elArraste.removeEventListener('pointermove', onMove);
                                            elArraste.removeEventListener('pointerup', finalizarArraste);
                                            elArraste.removeEventListener('pointercancel', finalizarArraste);
                                            document.removeEventListener('mousemove', onMove, true);
                                            document.removeEventListener('mouseup', finalizarArraste, true);
                                            window.removeEventListener('blur', finalizarArraste);
                                            try {
                                                if (typeof elArraste.releasePointerCapture === 'function' && elArraste.hasPointerCapture(pointerId)) {
                                                    elArraste.releasePointerCapture(pointerId);
                                                }
                                            } catch (_) { }
                                            if (!iniciouArraste) {
                                                if (uev && (uev.type === 'pointerup' || uev.type === 'mouseup')) {
                                                    alternarModoPorCliqueUnico();
                                                }
                                                return;
                                            }
                                            const agoraDrop = Date.now();
                                            host.__jusgovArrastando = false;
                                            host.__jusgovCooldownEsquiva = agoraDrop + 2500;
                                            host.__jusgovHoverInicioTs = agoraDrop;
                                            pill.style.cursor = 'grab';
                                            microIconeBox.style.cursor = 'grab';
                                            host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                            const rx = Math.max(0, Math.min(1, ultimoCentroX / wTela));
                                            const ry = Math.max(0, Math.min(1, ultimoCentroY / hTela));
                                            const posVertFinal = (ry < 0.5) ? 'superior' : 'inferior';
                                            const alinhFinal = (rx < 0.33) ? 'esquerda' : (rx > 0.66 ? 'direita' : 'centro');
                                            if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                                host.__jusgovAtualizarRelogio();
                                            }
                                            aplicarPosicao(host, posVertFinal, alinhFinal);
                                            restaurarBordaSemaforo();
                                            host.__jusgovPatrulhaPos = null;
                                            const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                            estAtual.posicaoVertical = posVertFinal;
                                            estAtual.alinhamento = alinhFinal;
                                            estAtual.posicaoVerticalAncorada = posVertFinal;
                                            estAtual.alinhamentoAncorado = alinhFinal;
                                            enviarEstadoGlobal({
                                                posicaoVertical: posVertFinal,
                                                alinhamento: alinhFinal,
                                                topPx: (posVertFinal === 'inferior') ? 99999 : 0,
                                                ancorar: true
                                            });
                                        };
                                        elArraste.addEventListener('pointermove', onMove);
                                        elArraste.addEventListener('pointerup', finalizarArraste);
                                        elArraste.addEventListener('pointercancel', finalizarArraste);
                                        document.addEventListener('mousemove', onMove, true);
                                        document.addEventListener('mouseup', finalizarArraste, true);
                                        window.addEventListener('blur', finalizarArraste);
                                    });
                                };
                                configurarArrasteElemento(pill);
                                configurarArrasteElemento(microIconeBox);

                                /* Esquiva inteligente na mesma linha horizontal (com 1s de tolerância inicial e zonas seguras dos botões) */
                                pill.addEventListener('mousemove', (ev) => {
                                    const agoraMov = Date.now();
                                    if (!host.__jusgovHoverInicioTs) {
                                        host.__jusgovHoverInicioTs = agoraMov;
                                    }
                                    if (host.__jusgovArrastando || agoraMov < (host.__jusgovCooldownEsquiva || 0)) return;
                                    const estAtualMov = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    if (estAtualMov.minimizadoMicro) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === btnMinimizar || ev.target === btnFixar || ev.target === btnContinuarDesc || ev.target === btnPararFlex ||
                                        path.includes(btnMinimizar) || path.includes(btnFixar) || path.includes(btnContinuarDesc) || path.includes(btnPararFlex) ||
                                        pontoEmControle(ev.clientX, ev.clientY)) {
                                        host.__jusgovHoverInicioTs = agoraMov;
                                        return;
                                    }
                                    if ((agoraMov - host.__jusgovHoverInicioTs) < 1000) {
                                        return;
                                    }
                                    const rect = pill.getBoundingClientRect();
                                    if (!rect || rect.width <= 0) return;
                                    const posAtual = host.__jusgovPos || { posicaoVertical: 'superior', alinhamento: 'esquerda' };
                                    if (host.__jusgovScreensaverAtivo || host.__jusgovScreensaverPos || posAtual.posicaoVertical === 'centro_tela') return;
                                    const centro = rect.left + (rect.width / 2);
                                    let ladoDestino = 'centro';
                                    if (posAtual.alinhamento === 'centro') {
                                        ladoDestino = (ev.clientX < centro) ? 'direita' : 'esquerda';
                                    }
                                    if (posAtual.alinhamento !== ladoDestino) {
                                        const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                        const dEsquiva = host.__jusgovDados || dadosResumo;
                                        const modoEspEsq = obterModoPosicaoEspecial(dEsquiva, agoraMov);
                                        const usaRetornoAmarelo = (modoEspEsq === 'aviso_topo_centro' || Number(estAtual.modoFixacao || 1) === 1);
                                        if (usaRetornoAmarelo && !host.__jusgovRetornoRect) {
                                            host.__jusgovRetornoRect = {
                                                left: rect.left,
                                                right: rect.right,
                                                top: rect.top,
                                                bottom: rect.bottom
                                            };
                                        }
                                        host.__jusgovCooldownEsquiva = agoraMov + 280;
                                        host.__jusgovHoverInicioTs = 0;
                                        aplicarPosicao(host, posAtual.posicaoVertical, ladoDestino, null, null, true);
                                        if (!usaRetornoAmarelo) {
                                            enviarEstadoGlobal({
                                                posicaoVertical: posAtual.posicaoVertical,
                                                alinhamento: ladoDestino,
                                                topPx: (posAtual.posicaoVertical === 'inferior') ? 99999 : 0
                                            });
                                        }
                                    }
                                });

                                const ativarHoverExpandido = (forcarPeloUsuario = false) => {
                                    const emMovimentoAuto = Boolean(host.__jusgovScreensaverAtivo || host.__jusgovPatrulhaAtiva);
                                    const cursorMoveuRecentemente = (Date.now() - Number(host.__jusgovCursorMoveuRealTs || 0)) <= 220;
                                    if (!forcarPeloUsuario && emMovimentoAuto && !cursorMoveuRecentemente) {
                                        /* Se o mouse estava parado e o minipopup/bolinha passou por baixo dele, ignora para não travar/abrir o movimento (BUG-106 / BUG-110) */
                                        return;
                                    }
                                    if (host.__jusgovHoverTimerSaida) {
                                        clearTimeout(host.__jusgovHoverTimerSaida);
                                        host.__jusgovHoverTimerSaida = 0;
                                    }
                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                    }
                                    const estHover = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const rMicroAntes = microIconeBox.getBoundingClientRect();
                                    const estavaEmMicroVisivel = Boolean(
                                        estHover.minimizadoMicro &&
                                        !host.__jusgovHoverPill &&
                                        microIconeBox.style.display !== 'none' &&
                                        rMicroAntes && rMicroAntes.width > 4
                                    );
                                    const cursorAtual = host.__jusgovUltimoCursor;
                                    const anchorX = (cursorAtual && cursorAtual.x > -9000)
                                        ? cursorAtual.x
                                        : ((rMicroAntes && rMicroAntes.width > 4) ? (rMicroAntes.left + rMicroAntes.width / 2) : 0);
                                    const anchorY = (rMicroAntes && rMicroAntes.height > 4)
                                        ? (rMicroAntes.top + rMicroAntes.height / 2)
                                        : ((cursorAtual && cursorAtual.y > -9000) ? cursorAtual.y : 0);

                                    if (!host.__jusgovHoverPill) {
                                        host.__jusgovHoverInicioTs = Date.now();
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        const dHoverPat = host.__jusgovDados || dadosResumo;
                                        const estavaEmPatrulhaHover = Boolean(
                                            estHover.minimizadoMicro &&
                                            dHoverPat && dHoverPat.descansoPulado &&
                                            (host.__jusgovPatrulhaAtiva || host.__jusgovPatrulhaPos)
                                        );
                                        host.__jusgovPreviewPatrulhaSemBotoes = estavaEmPatrulhaHover;
                                        if (host.__jusgovHoverAcoesTimer) clearTimeout(host.__jusgovHoverAcoesTimer);
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (estavaEmPatrulhaHover) {
                                            host.__jusgovPatrulhaHoverTimer = setTimeout(() => {
                                                host.__jusgovPatrulhaHoverTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovPreviewPatrulhaSemBotoes) return;
                                                host.__jusgovPreviewPatrulhaSemBotoes = false;
                                                host.__jusgovHoverPill = false;
                                                host.__jusgovHoverInicioTs = 0;
                                                host.__jusgovDeslocadoHoverMicro = false;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                if (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                                    host.style.setProperty('transition', 'none', 'important');
                                                    host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                                    host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                                }
                                                if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') host.__jusgovIniciarPatrulhaBorda();
                                            }, 10000);
                                        } else {
                                            host.__jusgovHoverAcoesTimer = setTimeout(() => {
                                                host.__jusgovHoverAcoesTimer = 0;
                                                if (!host.isConnected || host.__jusgovHostDestruido || !host.__jusgovHoverPill) return;
                                                host.__jusgovHoverAcoesDesbloqueadas = true;
                                                if (typeof host.__jusgovAtualizarRelogio === 'function') host.__jusgovAtualizarRelogio();
                                                else if (typeof host.__jusgovAtualizarModoVisual === 'function') host.__jusgovAtualizarModoVisual();
                                            }, 2200);
                                        }
                                    }
                                    host.__jusgovHoverPill = true;
                                    if (typeof host.__jusgovPararPatrulhaBorda === 'function') {
                                        host.__jusgovPararPatrulhaBorda();
                                    }
                                    if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                        host.__jusgovAtualizarRelogio();
                                    } else if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                        host.__jusgovAtualizarBadgeStatus();
                                    }
                                    if (estHover.minimizadoMicro && pill.style.display !== 'none') {
                                        const docEl = document.documentElement;
                                        const wT = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                        const rNow = pill.getBoundingClientRect();
                                        if (rNow && rNow.width > 16) {
                                            const pillW = Math.ceil(rNow.width);
                                            const pillH = Math.ceil(rNow.height);
                                            const curLeft = parseFloat(host.style.left);
                                            const curTop = parseFloat(host.style.top);
                                            const leftIdeal = estavaEmMicroVisivel
                                                ? Math.round(anchorX - (pillW / 2))
                                                : (Number.isFinite(curLeft) ? curLeft : 0);
                                            const topIdeal = estavaEmMicroVisivel
                                                ? Math.round(anchorY - (pillH / 2))
                                                : (Number.isFinite(curTop) ? curTop : 0);
                                            const clampedLeft = Math.max(0, Math.min(Math.max(0, wT - pillW), leftIdeal));
                                            const clampedTop = Math.max(0, Math.min(Math.max(0, hT - pillH), topIdeal));
                                            host.__jusgovDeslocadoHoverMicro = true;
                                            host.style.setProperty('left', `${Math.round(clampedLeft)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(clampedTop)}px`, 'important');
                                        }
                                    }
                                };
                                const agendarSaidaHover = (evSaida) => {
                                    if (host.__jusgovHoverTimerSaida) clearTimeout(host.__jusgovHoverTimerSaida);
                                    const executarSaida = () => {
                                        host.__jusgovHoverTimerSaida = 0;
                                        if (pill.matches(':hover') || microIconeBox.matches(':hover') || boxBannerOculto.matches(':hover')) {
                                            return;
                                        }
                                        const eraPreviewPatrulha = Boolean(host.__jusgovPreviewPatrulhaSemBotoes);
                                        host.__jusgovHoverPill = false;
                                        host.__jusgovHoverInicioTs = 0;
                                        host.__jusgovHoverAcoesDesbloqueadas = false;
                                        host.__jusgovPreviewPatrulhaSemBotoes = false;
                                        if (host.__jusgovHoverAcoesTimer) {
                                            clearTimeout(host.__jusgovHoverAcoesTimer);
                                            host.__jusgovHoverAcoesTimer = 0;
                                        }
                                        if (host.__jusgovPatrulhaHoverTimer) {
                                            clearTimeout(host.__jusgovPatrulhaHoverTimer);
                                            host.__jusgovPatrulhaHoverTimer = 0;
                                        }
                                        if (typeof host.__jusgovAtualizarBannerOculto === 'function' && host.__jusgovModoOculto) {
                                            host.__jusgovAtualizarBannerOculto();
                                        }
                                        if (typeof host.__jusgovAtualizarRelogio === 'function') {
                                            host.__jusgovAtualizarRelogio();
                                        } else if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                            host.__jusgovAtualizarModoVisual();
                                        } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                            host.__jusgovAtualizarBadgeStatus();
                                        }
                                        if (eraPreviewPatrulha && host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.x) && Number.isFinite(host.__jusgovPatrulhaPos.y)) {
                                            host.__jusgovDeslocadoHoverMicro = false;
                                            host.style.setProperty('transition', 'none', 'important');
                                            host.style.setProperty('left', `${Math.round(host.__jusgovPatrulhaPos.x)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(host.__jusgovPatrulhaPos.y)}px`, 'important');
                                            if (typeof host.__jusgovIniciarPatrulhaBorda === 'function') {
                                                host.__jusgovIniciarPatrulhaBorda();
                                            }
                                            return;
                                        }
                                        if (typeof host.__jusgovAtualizarPosicaoEfetiva === 'function') {
                                            host.__jusgovAtualizarPosicaoEfetiva(Date.now());
                                        }
                                    };
                                    if (evSaida && evSaida.isTrusted === false) {
                                        executarSaida();
                                        return;
                                    }
                                    host.__jusgovHoverTimerSaida = setTimeout(executarSaida, 160);
                                };
                                pill.addEventListener('mouseenter', () => ativarHoverExpandido(false));
                                pill.addEventListener('pointerdown', () => {
                                    host.__jusgovCursorMoveuRealTs = Date.now();
                                    ativarHoverExpandido(true);
                                }, { passive: true });
                                pill.addEventListener('mouseleave', agendarSaidaHover);
                                microIconeBox.addEventListener('mouseenter', () => {
                                    const agoraEnt = Date.now();
                                    if (host.__jusgovAguardandoSairPosMin && agoraEnt < Number(host.__jusgovSuprimirHoverMicroAteTs || 0)) {
                                        return;
                                    }
                                    if (agoraEnt < Number(host.__jusgovSuprimirHoverMicroAteTs || 0)) return;
                                    host.__jusgovAguardandoSairPosMin = false;
                                    ativarHoverExpandido(false);
                                });
                                microIconeBox.addEventListener('pointerdown', () => {
                                    host.__jusgovCursorMoveuRealTs = Date.now();
                                    ativarHoverExpandido(true);
                                }, { passive: true });
                                microIconeBox.addEventListener('mouseleave', agendarSaidaHover);

                                const pararScreensaver = () => {
                                    const estavaAtivo = Boolean(host.__jusgovScreensaverAtivo);
                                    if (estavaAtivo) {
                                        const rectFim = pill.getBoundingClientRect();
                                        if (rectFim && rectFim.width > 20 && rectFim.height > 10 && Number.isFinite(rectFim.left) && Number.isFinite(rectFim.top)) {
                                            const prev = host.__jusgovScreensaverPos || {};
                                            host.__jusgovScreensaverPos = {
                                                x: rectFim.left,
                                                y: rectFim.top,
                                                angAtual: Number.isFinite(prev.angAtual) ? prev.angAtual : undefined,
                                                tipoTraj: prev.tipoTraj,
                                                curvaSign: prev.curvaSign
                                            };
                                        }
                                    }
                                    host.__jusgovScreensaverAtivo = false;
                                    if (host.__jusgovScreensaverRaf) {
                                        cancelAnimationFrame(host.__jusgovScreensaverRaf);
                                        host.__jusgovScreensaverRaf = 0;
                                    }
                                    restaurarBordaSemaforo();
                                    host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                };
                                host.__jusgovPararScreensaver = pararScreensaver;

                                const iniciarScreensaver = () => {
                                    if (document.hidden || host.__jusgovArrastando) {
                                        pararScreensaver();
                                        return;
                                    }
                                    if (host.__jusgovScreensaverAtivo && host.__jusgovScreensaverRaf) return;
                                    host.__jusgovScreensaverAtivo = true;
                                    host.style.setProperty('transition', 'none', 'important');
                                    host.style.setProperty('bottom', 'auto', 'important');
                                    host.style.setProperty('right', 'auto', 'important');
                                    host.style.setProperty('transform', 'none', 'important');

                                    const docEl = document.documentElement;
                                    const wInit = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                    const hInit = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                    const rectIni = pill.getBoundingClientRect();
                                    const pillWIni = (rectIni && rectIni.width > 20) ? Math.ceil(rectIni.width) : 140;
                                    const pillHIni = (rectIni && rectIni.height > 10) ? Math.ceil(rectIni.height) : 34;
                                    const maxXInit = Math.max(0, wInit - pillWIni);
                                    const maxYInit = Math.max(0, hInit - pillHIni);

                                    const posSalva = host.__jusgovScreensaverPos;
                                    const centerTargetX = Math.max(0, Math.min(maxXInit, Math.round((wInit - pillWIni) / 2)));
                                    const centerTargetY = Math.max(0, Math.min(maxYInit, Math.round((hInit - pillHIni) / 2)));
                                    const temRectAtualValido = Boolean(
                                        rectIni && rectIni.width > 20 && rectIni.height > 10 &&
                                        Number.isFinite(rectIni.left) && Number.isFinite(rectIni.top) &&
                                        (posSalva || host.style.left || host.style.top)
                                    );
                                    let sx = centerTargetX;
                                    let sy = centerTargetY;
                                    if (temRectAtualValido) {
                                        sx = Math.max(0, Math.min(maxXInit, rectIni.left));
                                        sy = Math.max(0, Math.min(maxYInit, rectIni.top));
                                    } else if (posSalva && Number.isFinite(posSalva.x) && Number.isFinite(posSalva.y)) {
                                        sx = Math.max(0, Math.min(maxXInit, posSalva.x));
                                        sy = Math.max(0, Math.min(maxYInit, posSalva.y));
                                    }
                                    /* Quando sai do topo-centro rumo ao início do descanso no centro sem posição prévia, desliza rápido/fluido até o centro */
                                    let glideCentroAtivo = Boolean(!posSalva && (Math.abs(sx - centerTargetX) > 8 || Math.abs(sy - centerTargetY) > 8));
                                    const glideStartX = sx;
                                    const glideStartY = sy;
                                    const glideIniTs = performance.now();
                                    const glideDurMs = 300;

                                    const tiposTraj = ['reta', 'curva_aberta', 'exponencial', 'fibonacci'];
                                    const angDegBases = [32, 52, 128, 148, 212, 232, 308, 328];
                                    let angAtual = (posSalva && Number.isFinite(posSalva.angAtual))
                                        ? posSalva.angAtual
                                        : ((angDegBases[Math.floor(Math.random() * angDegBases.length)] + (Math.random() * 14 - 7)) * (Math.PI / 180));
                                    /* Garante vetor saindo de eventual borda onde o minipopup esteja encostado */
                                    {
                                        let vxIni = Math.cos(angAtual);
                                        let vyIni = Math.sin(angAtual);
                                        if (sx <= 2 && vxIni <= 0.15) vxIni = Math.abs(vxIni) + 0.35;
                                        if (sx >= maxXInit - 2 && vxIni >= -0.15) vxIni = -(Math.abs(vxIni) + 0.35);
                                        if (sy <= 2 && vyIni <= 0.15) vyIni = Math.abs(vyIni) + 0.35;
                                        if (sy >= maxYInit - 2 && vyIni >= -0.15) vyIni = -(Math.abs(vyIni) + 0.35);
                                        angAtual = Math.atan2(vyIni, vxIni);
                                    }

                                    let velAtual = 0;
                                    let velAlvo = 82;
                                    let tipoTraj = (posSalva && posSalva.tipoTraj) ? posSalva.tipoTraj : tiposTraj[Math.floor(Math.random() * tiposTraj.length)];
                                    let curvaSign = (posSalva && (posSalva.curvaSign === 1 || posSalva.curvaSign === -1)) ? posSalva.curvaSign : (Math.random() < 0.5 ? 1 : -1);
                                    let tNoTrecho = 0;
                                    let batidasAteMudanca = 2 + Math.floor(Math.random() * 3);
                                    let proxMudancaVelTs = performance.now() + 2800 + Math.random() * 2500;
                                    let proxBalancoTs = performance.now() + 7500 + Math.random() * 6500;
                                    let balancoAteTs = 0;
                                    let esbarroAteTs = 0;
                                    let esbarroDir = { x: 0, y: 0 };
                                    let pausadoPorHover = Boolean(host.__jusgovHoverPill);
                                    let retomadaSuaveAteTs = performance.now() + 3600;
                                    let ultimoTs = performance.now();

                                    host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                    host.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: Math.round(sy) };

                                    const passo = (tsNow) => {
                                        if (!host.__jusgovScreensaverAtivo || !host.isConnected || document.hidden || host.__jusgovArrastando) {
                                            pararScreensaver();
                                            return;
                                        }
                                        const dt = Math.min(0.05, Math.max(0.004, (tsNow - ultimoTs) / 1000));
                                        ultimoTs = tsNow;
                                        if (host.__jusgovHoverPill) {
                                            if (!pill.matches(':hover') && !microIconeBox.matches(':hover') && !boxBannerOculto.matches(':hover')) {
                                                host.__jusgovHoverPill = false;
                                            } else {
                                                pausadoPorHover = true;
                                                velAtual = 0;
                                                restaurarBordaSemaforo();
                                                host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                                host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                                return;
                                            }
                                        }
                                        if (pausadoPorHover) {
                                            pausadoPorHover = false;
                                            velAtual = 0;
                                            retomadaSuaveAteTs = tsNow + 3600;
                                            esbarroAteTs = 0;
                                            balancoAteTs = 0;
                                            proxMudancaVelTs = Math.max(proxMudancaVelTs, tsNow + 3000);
                                            proxBalancoTs = Math.max(proxBalancoTs, tsNow + 7000);
                                            const dRet = document.documentElement;
                                            const wRet = Math.max(320, (dRet && dRet.clientWidth) || window.innerWidth || 1280);
                                            const hRet = Math.max(200, (dRet && dRet.clientHeight) || window.innerHeight || 720);
                                            const rRet = pill.getBoundingClientRect();
                                            if (rRet && rRet.width > 20 && rRet.height > 10 && Number.isFinite(rRet.left) && Number.isFinite(rRet.top)) {
                                                sx = Math.max(0, Math.min(Math.max(0, wRet - Math.ceil(rRet.width)), rRet.left));
                                                sy = Math.max(0, Math.min(Math.max(0, hRet - Math.ceil(rRet.height)), rRet.top));
                                            }
                                        }

                                        const dEl = document.documentElement;
                                        const wT = Math.max(320, (dEl && dEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (dEl && dEl.clientHeight) || window.innerHeight || 720);
                                        const rP = pill.getBoundingClientRect();
                                        const pW = (rP && rP.width > 20) ? Math.ceil(rP.width) : pillWIni;
                                        const pH = (rP && rP.height > 10) ? Math.ceil(rP.height) : pillHIni;
                                        const maxX = Math.max(0, wT - pW);
                                        const maxY = Math.max(0, hT - pH);

                                        if (glideCentroAtivo) {
                                            const progG = Math.min(1, Math.max(0, (tsNow - glideIniTs) / glideDurMs));
                                            const easeG = 1 - Math.pow(1 - progG, 3);
                                            const cxG = Math.max(0, Math.min(maxX, Math.round((wT - pW) / 2)));
                                            const cyG = Math.max(0, Math.min(maxY, Math.round((hT - pH) / 2)));
                                            sx = glideStartX + (cxG - glideStartX) * easeG;
                                            sy = glideStartY + (cyG - glideStartY) * easeG;
                                            host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                            host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                            host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                            if (progG >= 1) {
                                                glideCentroAtivo = false;
                                                retomadaSuaveAteTs = tsNow + 2400;
                                            }
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (esbarroAteTs > tsNow) {
                                            const faseTremor = Math.sin(tsNow * 0.045) * 3;
                                            const jx = Math.max(0, Math.min(maxX, Math.round(sx + esbarroDir.x * faseTremor)));
                                            const jy = Math.max(0, Math.min(maxY, Math.round(sy + esbarroDir.y * faseTremor)));
                                            host.style.setProperty('left', `${jx}px`, 'important');
                                            host.style.setProperty('top', `${jy}px`, 'important');
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (balancoAteTs > tsNow) {
                                            const wob = Math.sin(tsNow * 0.025) * 6;
                                            const bx = Math.max(0, Math.min(maxX, Math.round(sx + wob)));
                                            const by = Math.max(0, Math.min(maxY, Math.round(sy + Math.cos(tsNow * 0.025) * 4)));
                                            host.style.setProperty('left', `${bx}px`, 'important');
                                            host.style.setProperty('top', `${by}px`, 'important');
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        if (tsNow >= proxMudancaVelTs) {
                                            velAlvo = 52 + Math.random() * 68;
                                            proxMudancaVelTs = tsNow + 2200 + Math.random() * 3200;
                                        }
                                        if (tsNow >= proxBalancoTs) {
                                            balancoAteTs = tsNow + 550 + Math.random() * 350;
                                            proxBalancoTs = tsNow + 7000 + Math.random() * 7000;
                                            angAtual += (Math.PI * 0.55) + (Math.random() * Math.PI * 0.9);
                                            velAlvo = 62 + Math.random() * 54;
                                            host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                            return;
                                        }

                                        tNoTrecho += dt;
                                        const emRetomadaSuave = (tsNow < retomadaSuaveAteTs);
                                        const taxaAcel = emRetomadaSuave ? 0.55 : 2.0;
                                        velAtual += (velAlvo - velAtual) * Math.min(1, dt * taxaAcel);

                                        if (tipoTraj === 'curva_aberta') {
                                            angAtual += curvaSign * 0.26 * dt;
                                        } else if (tipoTraj === 'exponencial') {
                                            const fatorExp = Math.min(1.5, Math.exp(tNoTrecho * 0.22) * 0.24);
                                            angAtual += curvaSign * fatorExp * dt;
                                        } else if (tipoTraj === 'fibonacci') {
                                            const phi = 1.6180339;
                                            angAtual += curvaSign * (0.22 + 0.12 * Math.sin(tNoTrecho * phi)) * dt;
                                            if (!emRetomadaSuave) {
                                                velAtual = Math.max(48, Math.min(125, velAtual + Math.cos(tNoTrecho / phi) * 10 * dt));
                                            }
                                        }

                                        let vx = Math.cos(angAtual) * velAtual;
                                        let vy = Math.sin(angAtual) * velAtual;
                                        sx += vx * dt;
                                        sy += vy * dt;

                                        const bateuEsq = (sx <= 0 && vx < 0);
                                        const bateuDir = (sx >= maxX && vx > 0);
                                        const bateuTopo = (sy <= 0 && vy < 0);
                                        const bateuBase = (sy >= maxY && vy > 0);

                                        if (sx < 0) sx = 0;
                                        else if (sx > maxX) sx = maxX;
                                        if (sy < 0) sy = 0;
                                        else if (sy > maxY) sy = maxY;

                                        if (bateuEsq || bateuDir || bateuTopo || bateuBase) {
                                            tNoTrecho = 0;
                                            if (bateuEsq || bateuDir) vx = -vx;
                                            if (bateuTopo || bateuBase) vy = -vy;
                                            angAtual = Math.atan2(vy, vx);

                                            batidasAteMudanca -= 1;
                                            if ((bateuEsq || bateuDir) && (bateuTopo || bateuBase) && Math.random() < 0.45) {
                                                esbarroAteTs = tsNow + 240 + Math.random() * 220;
                                                esbarroDir = { x: bateuEsq ? 1 : -1, y: bateuTopo ? 1 : -1 };
                                            } else if (Math.random() < 0.14) {
                                                esbarroAteTs = tsNow + 200 + Math.random() * 180;
                                                esbarroDir = { x: bateuEsq ? 1 : (bateuDir ? -1 : 0), y: bateuTopo ? 1 : (bateuBase ? -1 : 0) };
                                            }

                                            if (batidasAteMudanca <= 0) {
                                                batidasAteMudanca = 2 + Math.floor(Math.random() * 4);
                                                tipoTraj = tiposTraj[Math.floor(Math.random() * tiposTraj.length)];
                                                curvaSign = Math.random() < 0.5 ? 1 : -1;
                                                const jitterAng = (Math.random() * 0.9) - 0.45;
                                                angAtual += jitterAng;
                                                /* Garante vetor saindo para dentro da viewport para nunca grudar na borda */
                                                let nvx = Math.cos(angAtual);
                                                let nvy = Math.sin(angAtual);
                                                if (sx <= 1) nvx = Math.abs(nvx) + 0.25;
                                                if (sx >= maxX - 1) nvx = -(Math.abs(nvx) + 0.25);
                                                if (sy <= 1) nvy = Math.abs(nvy) + 0.25;
                                                if (sy >= maxY - 1) nvy = -(Math.abs(nvy) + 0.25);
                                                angAtual = Math.atan2(nvy, nvx);
                                                velAlvo = 60 + Math.random() * 58;
                                                if (typeof host.__jusgovRotacionarPropaganda === 'function') {
                                                    host.__jusgovRotacionarPropaganda(true);
                                                }
                                            } else {
                                                angAtual += (Math.random() * 0.26) - 0.13;
                                            }
                                        }

                                        host.__jusgovScreensaverPos = { x: sx, y: sy, angAtual, tipoTraj, curvaSign };
                                        host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                        host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                        aplicarBordaArcoIrisAleatoria(tsNow, 'descanso');
                                        host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                    };
                                    host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                    host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                    host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                };
                                host.__jusgovIniciarScreensaver = iniciarScreensaver;

                                const tiposPatrulhaBemEstar = ['agua', 'copo_agua', 'cafe', 'vitamina', 'esticar', 'olhos', 'respirar', 'caminhar', 'sem_celular', 'sem_tela', 'sem_tarefa', 'sem_redes', 'sem_notificacoes', 'sem_email'];
                                const coresIconeBemEstar = ['#38bdf8', '#0ea5e9', '#f59e0b', '#34d399', '#10b981', '#60a5fa', '#4ade80', '#a78bfa', '#f87171', '#ef4444', '#fb923c', '#f43f5e', '#fbbf24', '#e11d48'];
                                const atualizarVisualMicroIcone = (dMicro, emPatrulha = false) => {
                                    microIconeBox.style.background = '#0f172a';
                                    const corBordaAtual = resolverCorBordaSemaforo(dMicro);
                                    if (!host.__jusgovPatrulhaAtiva && !host.__jusgovArrastando) {
                                        microIconeBox.style.borderColor = corBordaAtual;
                                        microIconeBox.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                    }
                                    if (dMicro && (dMicro.descansoPulado || dMicro.descansoPendente)) {
                                        const idxP = Math.abs(Math.floor(Number(host.__jusgovPatrulhaIconeIdx || 0))) % tiposPatrulhaBemEstar.length;
                                        const tipoIco = tiposPatrulhaBemEstar[idxP];
                                        const corSvg = coresIconeBemEstar[idxP];
                                        const svgIco = criarIconeSvgBemEstar(tipoIco, corSvg, 12);
                                        if (emPatrulha) svgIco.classList.add('jg-piscar');
                                        microIconeBox.replaceChildren(svgIco);
                                    } else {
                                        const corRaio = (corBordaAtual === '#64748b')
                                            ? '#94a3b8'
                                            : ((corBordaAtual === '#dc2626')
                                                ? '#f87171'
                                                : ((corBordaAtual === '#eab308') ? '#facc15' : '#10b981'));
                                        microIconeBox.replaceChildren(criarIconeAppMicro(12, corRaio));
                                    }
                                };
                                host.__jusgovAtualizarVisualMicroIcone = atualizarVisualMicroIcone;

                                const pararPatrulhaBorda = () => {
                                    host.__jusgovPatrulhaAtiva = false;
                                    if (host.__jusgovPatrulhaRaf) {
                                        cancelAnimationFrame(host.__jusgovPatrulhaRaf);
                                        host.__jusgovPatrulhaRaf = 0;
                                    }
                                    restaurarBordaSemaforo();
                                    host.style.setProperty('transition', 'left 0.28s cubic-bezier(0.22,1,0.36,1),top 0.28s cubic-bezier(0.22,1,0.36,1)', 'important');
                                };
                                host.__jusgovPararPatrulhaBorda = pararPatrulhaBorda;

                                const iniciarPatrulhaBorda = () => {
                                    if (document.hidden || host.__jusgovArrastando || host.__jusgovHoverPill) {
                                        pararPatrulhaBorda();
                                        return;
                                    }
                                    if (host.__jusgovPatrulhaAtiva && host.__jusgovPatrulhaRaf) return;
                                    host.__jusgovPatrulhaAtiva = true;
                                    host.style.setProperty('transition', 'none', 'important');
                                    host.style.setProperty('bottom', 'auto', 'important');
                                    host.style.setProperty('right', 'auto', 'important');
                                    host.style.setProperty('transform', 'none', 'important');

                                    const docEl = document.documentElement;
                                    const wInit = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                    const hInit = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                    const rIni = microIconeBox.getBoundingClientRect();
                                    const iW = (rIni && rIni.width > 8) ? Math.ceil(rIni.width) : 24;
                                    const iH = (rIni && rIni.height > 8) ? Math.ceil(rIni.height) : 24;
                                    const maxXi = Math.max(1, wInit - iW);
                                    const maxYi = Math.max(1, hInit - iH);
                                    const perimIni = 2 * (maxXi + maxYi);

                                    let dist = (host.__jusgovPatrulhaPos && Number.isFinite(host.__jusgovPatrulhaPos.dist))
                                        ? host.__jusgovPatrulhaPos.dist
                                        : (() => {
                                            const cx = (rIni && Number.isFinite(rIni.left)) ? Math.max(0, Math.min(maxXi, rIni.left)) : 0;
                                            const cy = (rIni && Number.isFinite(rIni.top)) ? Math.max(0, Math.min(maxYi, rIni.top)) : 0;
                                            if (cy <= 4) return cx;
                                            if (cx >= maxXi - 4) return maxXi + cy;
                                            if (cy >= maxYi - 4) return maxXi + maxYi + (maxXi - cx);
                                            return (2 * maxXi) + maxYi + (maxYi - cy);
                                        })();
                                    let ultTs = performance.now();
                                    let proxTrocaIcoTs = ultTs + 9500;
                                    if (host.__jusgovPatrulhaDir !== 1 && host.__jusgovPatrulhaDir !== -1) {
                                        host.__jusgovPatrulhaDir = Math.random() < 0.5 ? 1 : -1;
                                    }
                                    if (!Number.isFinite(host.__jusgovPatrulhaProxInversaoTs) || host.__jusgovPatrulhaProxInversaoTs <= ultTs) {
                                        host.__jusgovPatrulhaProxInversaoTs = ultTs + 125000 + Math.random() * 145000;
                                    }

                                    const passoPatrulha = (tsNow) => {
                                        if (!host.__jusgovPatrulhaAtiva || !host.isConnected || document.hidden || host.__jusgovArrastando || host.__jusgovHoverPill) {
                                            pararPatrulhaBorda();
                                            return;
                                        }
                                        const estCheck = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                        const dCheck = host.__jusgovDados || dadosResumo;
                                        if (!estCheck.minimizadoMicro || !dCheck || dCheck.emDescanso || !dCheck.descansoPulado) {
                                            pararPatrulhaBorda();
                                            return;
                                        }
                                        const dt = Math.min(0.05, Math.max(0.004, (tsNow - ultTs) / 1000));
                                        ultTs = tsNow;
                                        if (tsNow >= Number(host.__jusgovPatrulhaProxInversaoTs || 0)) {
                                            host.__jusgovPatrulhaDir = -(host.__jusgovPatrulhaDir || 1);
                                            host.__jusgovPatrulhaProxInversaoTs = tsNow + 125000 + Math.random() * 145000;
                                        }
                                        if (tsNow >= proxTrocaIcoTs) {
                                            proxTrocaIcoTs = tsNow + 9500;
                                            host.__jusgovPatrulhaIconeIdx = ((Number(host.__jusgovPatrulhaIconeIdx || 0)) + 1) % tiposPatrulhaBemEstar.length;
                                            atualizarVisualMicroIcone(dCheck, true);
                                        }
                                        const dEl = document.documentElement;
                                        const wT = Math.max(320, (dEl && dEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (dEl && dEl.clientHeight) || window.innerHeight || 720);
                                        const rM = microIconeBox.getBoundingClientRect();
                                        const mW = (rM && rM.width > 8) ? Math.ceil(rM.width) : iW;
                                        const mH = (rM && rM.height > 8) ? Math.ceil(rM.height) : iH;
                                        const maxX = Math.max(1, wT - mW);
                                        const maxY = Math.max(1, hT - mH);
                                        const perim = 2 * (maxX + maxY);
                                        dist = ((dist + (host.__jusgovPatrulhaDir || 1) * 36 * dt) % perim + perim) % perim;

                                        let px = 0;
                                        let py = 0;
                                        if (dist < maxX) {
                                            px = dist;
                                            py = 0;
                                        } else if (dist < maxX + maxY) {
                                            px = maxX;
                                            py = dist - maxX;
                                        } else if (dist < (2 * maxX) + maxY) {
                                            px = maxX - (dist - maxX - maxY);
                                            py = maxY;
                                        } else {
                                            px = 0;
                                            py = maxY - (dist - (2 * maxX) - maxY);
                                        }
                                        host.__jusgovPatrulhaPos = { dist: dist % Math.max(1, perim), x: px, y: py };
                                        host.style.setProperty('left', `${Math.round(px)}px`, 'important');
                                        host.style.setProperty('top', `${Math.round(py)}px`, 'important');
                                        aplicarBordaArcoIrisAleatoria(tsNow, 'patrulha');
                                        host.__jusgovPatrulhaRaf = requestAnimationFrame(passoPatrulha);
                                    };
                                    host.__jusgovPatrulhaRaf = requestAnimationFrame(passoPatrulha);
                                };
                                host.__jusgovIniciarPatrulhaBorda = iniciarPatrulhaBorda;

                                const verificarAlarmePomodoroLocal = (
                                    ciclosFeitos,
                                    ciclosTotais,
                                    tempoDescansoSegundos,
                                    tempoDecorridosFase,
                                    faseAtual
                                ) => {
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
                                        const baseInt = Math.max(1, Math.floor(fatorY * tempoDescansoSegundos));
                                        const intervaloDescanso = ehDescansoMuitoCurto ? Math.max(20, baseInt * 3) : baseInt;
                                        if (tempoDecorridosFase % intervaloDescanso === 0) return 'BEEP_CURTO';
                                        return null;
                                    }
                                    if (faseAtual === 'ATRASO_ABANDONO') {
                                        if (tempoDecorridosFase > 14400) return 'BLOQUEAR';
                                        if (tempoDecorridosFase > 10800) return (tempoDecorridosFase % 600 === 0) ? 'BEEP_CURTO' : null;
                                        if (tempoDecorridosFase > 7200) return (tempoDecorridosFase % 300 === 0) ? 'BEEP_CURTO' : null;
                                        const minIntAb = ehDescansoMuitoCurto ? 20 : 1;
                                        const intervaloAplicado = Math.max(minIntAb, Math.floor(Math.min(fatorY * tempoDecorridosFase, 300)));
                                        if (tempoDecorridosFase % intervaloAplicado === 0) return 'BEEP_CURTO';
                                    }
                                    return null;
                                };

                                const tocarBeepPcSpeakerLocal = (intensidade = 'suave', padraoAlarme = 'BEEP_CURTO') => {
                                    try {
                                        const AudioCtx = window.AudioContext || window.webkitAudioContext;
                                        if (!AudioCtx) return;
                                        if (!host.__jusgovAudioCtx || host.__jusgovAudioCtx.state === 'closed') {
                                            host.__jusgovAudioCtx = new AudioCtx();
                                            host.__jusgovEstaloBuf = null;
                                        }
                                        const ctx = host.__jusgovAudioCtx;
                                        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                                            ctx.resume().catch(() => { });
                                        }
                                        if (!host.__jusgovEstaloBuf) {
                                            try {
                                                const n = Math.max(32, Math.floor(ctx.sampleRate * 0.0045));
                                                const b = ctx.createBuffer(1, n, ctx.sampleRate);
                                                const d = b.getChannelData(0);
                                                for (let i = 0; i < n; i++) {
                                                    const dec = Math.exp(-i / (n * 0.28));
                                                    d[i] = ((i < 6) ? 1.0 : ((Math.random() * 2 - 1) * 0.85)) * dec;
                                                }
                                                host.__jusgovEstaloBuf = b;
                                            } catch (_) { }
                                        }
                                        const emitirEstalo = (tAt, gEst) => {
                                            if (!host.__jusgovEstaloBuf) return;
                                            try {
                                                const src = ctx.createBufferSource();
                                                src.buffer = host.__jusgovEstaloBuf;
                                                const flt = ctx.createBiquadFilter();
                                                flt.type = 'bandpass';
                                                flt.frequency.setValueAtTime(2800, tAt);
                                                flt.Q.setValueAtTime(1.1, tAt);
                                                const g = ctx.createGain();
                                                g.gain.setValueAtTime(gEst, tAt);
                                                src.connect(flt);
                                                flt.connect(g);
                                                g.connect(ctx.destination);
                                                src.start(tAt);
                                            } catch (_) { }
                                        };
                                        const emitirPulsoPcSpeaker = (tIni, freqHz, durMs, ganhoMax) => {
                                            const dur = Math.max(0.03, durMs / 1000);
                                            const osc = ctx.createOscillator();
                                            const flt = ctx.createBiquadFilter();
                                            const gain = ctx.createGain();
                                            osc.type = 'square';
                                            osc.frequency.setValueAtTime(freqHz, tIni);
                                            flt.type = 'bandpass';
                                            flt.frequency.setValueAtTime(1750, tIni);
                                            flt.Q.setValueAtTime(0.65, tIni);
                                            gain.gain.setValueAtTime(0.0001, tIni);
                                            gain.gain.linearRampToValueAtTime(ganhoMax, tIni + 0.0015);
                                            gain.gain.setValueAtTime(ganhoMax, tIni + Math.max(0.004, dur - 0.002));
                                            gain.gain.linearRampToValueAtTime(0.0001, tIni + dur);
                                            osc.connect(flt);
                                            flt.connect(gain);
                                            gain.connect(ctx.destination);
                                            emitirEstalo(tIni, Math.min(0.55, ganhoMax * 1.45));
                                            emitirEstalo(tIni + dur, Math.min(0.45, ganhoMax * 1.15));
                                            osc.start(tIni);
                                            osc.stop(tIni + dur + 0.005);
                                        };
                                        const t0 = ctx.currentTime + 0.015;
                                        const ganhoBase = intensidade === 'grave' ? 0.36 : (intensidade === 'moderado' ? 0.30 : 0.24);
                                        if (padraoAlarme === 'BEEP_LONGO') {
                                            for (let i = 0; i < 5; i++) emitirPulsoPcSpeaker(t0 + (i * 0.5), 1000, 300, ganhoBase);
                                            return;
                                        }
                                        if (padraoAlarme === 'BEEP_CURTO_TRIPLO') {
                                            for (let i = 0; i < 3; i++) emitirPulsoPcSpeaker(t0 + (i * 0.38), 1000, 220, ganhoBase);
                                            return;
                                        }
                                        if (intensidade === 'grave') {
                                            emitirPulsoPcSpeaker(t0, 1000, 300, ganhoBase);
                                            emitirPulsoPcSpeaker(t0 + 0.5, 1000, 300, ganhoBase);
                                        } else {
                                            emitirPulsoPcSpeaker(t0, 1000, 300, ganhoBase);
                                        }
                                    } catch (_) { }
                                };

                                const tocarBeepConclusao = (intensidade = 'suave', padraoAlarme = 'BEEP_CURTO') => {
                                    try {
                                        if (padraoAlarme === 'BLOQUEAR' || padraoAlarme === 'SILENCIO') return;
                                        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                                            chrome.runtime.sendMessage({
                                                acao: 'TOCAR_BEEP_POMODORO',
                                                intensidade,
                                                padraoAlarme
                                            }, (resp) => {
                                                if ((chrome.runtime && chrome.runtime.lastError) || !(resp && resp.ok)) {
                                                    tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                                }
                                            });
                                            return;
                                        }
                                        tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                    } catch (_) {
                                        tocarBeepPcSpeakerLocal(intensidade, padraoAlarme);
                                    }
                                };
                                host.__jusgovTocarBeep = tocarBeepConclusao;

                                host.__jusgovGarantirBackdropBlur = garantirBackdropBlur;
                                host.__jusgovRemoverBackdropBlur = removerBackdropBlur;

                                const atualizarPosicaoEfetivaPill = (agoraPos = Date.now()) => {
                                    if (host.__jusgovArrastando || host.__jusgovRetornoRect) return;
                                    if (host.__jusgovModoOculto && host.__jusgovBannerPos) {
                                        pararPatrulhaBorda();
                                        pararScreensaver();
                                        aplicarPosicao(host, host.__jusgovBannerPos.posVert, host.__jusgovBannerPos.alinh);
                                        return;
                                    }
                                    const dPos = host.__jusgovDados || dadosResumo;
                                    const estPos = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const modoEsp = obterModoPosicaoEspecial(dPos, agoraPos);
                                    removerBackdropBlur();
                                    if (modoEsp === 'idle_centro_tela') {
                                        pararPatrulhaBorda();
                                        host.__jusgovEstavaNoTopoAviso = false;
                                        iniciarScreensaver();
                                        return;
                                    }
                                    pararScreensaver();
                                    if (modoEsp === 'aviso_topo_centro' || modoEsp === 'aviso_movimento_centro_blur') {
                                        pararPatrulhaBorda();
                                        if (!dPos.descansoEmAviso && host.__jusgovScreensaverPos) {
                                            return;
                                        }
                                        host.__jusgovEstavaNoTopoAviso = true;
                                        if (!host.__jusgovPos || host.__jusgovPos.posicaoVertical !== 'superior' || host.__jusgovPos.alinhamento !== 'centro') {
                                            aplicarPosicao(host, 'superior', 'centro');
                                        }
                                        return;
                                    }
                                    host.__jusgovScreensaverPos = null;
                                    host.__jusgovEstavaNoTopoAviso = false;

                                    const adiadoTs = Number(estPos.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                    const emPatrulhaAgora = Boolean(
                                        estPos.minimizadoMicro &&
                                        !host.__jusgovHoverPill &&
                                        dPos && !dPos.emDescanso && dPos.descansoPulado &&
                                        adiadoTs > 0 && (agoraPos - adiadoTs) >= 45000
                                    );
                                    if (emPatrulhaAgora) {
                                        host.__jusgovPos = { posicaoVertical: 'patrulha', alinhamento: 'borda', topPx: 0, leftPx: 0 };
                                        iniciarPatrulhaBorda();
                                        return;
                                    }
                                    pararPatrulhaBorda();

                                    const docElPos = document.documentElement;
                                    const wTelaPos = Math.max(320, (docElPos && docElPos.clientWidth) || window.innerWidth || 1280);
                                    const hTelaPos = Math.max(200, (docElPos && docElPos.clientHeight) || window.innerHeight || 720);
                                    const dimsPos = obterDimensoesAtuaisHost(host);
                                    const maxLeftPos = Math.max(0, wTelaPos - Math.min(wTelaPos, dimsPos.w));
                                    const maxTopPos = Math.max(0, hTelaPos - Math.min(hTelaPos, dimsPos.h));

                                    if (host.__jusgovHoverPill && (estPos.minimizadoMicro || host.__jusgovDeslocadoHoverMicro)) {
                                        const curLeftH = parseFloat(host.style.left);
                                        const curTopH = parseFloat(host.style.top);
                                        if (Number.isFinite(curLeftH) && Number.isFinite(curTopH)) {
                                            const centroRefX = Number.isFinite(host.__jusgovCentroHoverX)
                                                ? host.__jusgovCentroHoverX
                                                : (curLeftH + (dimsPos.w / 2));
                                            host.__jusgovCentroHoverX = centroRefX;
                                            const leftCentrado = Math.round(centroRefX - (dimsPos.w / 2));
                                            const clampedLH = Math.max(0, Math.min(maxLeftPos, leftCentrado));
                                            const clampedTH = Math.max(0, Math.min(maxTopPos, Math.round(curTopH)));
                                            host.style.setProperty('transition', 'none', 'important');
                                            if (clampedLH !== curLeftH) host.style.setProperty('left', `${clampedLH}px`, 'important');
                                            if (clampedTH !== curTopH) host.style.setProperty('top', `${clampedTH}px`, 'important');
                                        }
                                        return;
                                    }
                                    host.__jusgovCentroHoverX = NaN;
                                    const posVertAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.posicaoVerticalAncorada : estPos.posicaoVertical;
                                    const alinhAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.alinhamentoAncorado : estPos.alinhamento;
                                    const modoMicroKey = estPos.minimizadoMicro ? 'micro' : 'pill';
                                    const chaveTamPos = `${modoMicroKey}:${dimsPos.w}x${dimsPos.h}:${wTelaPos}x${hTelaPos}`;
                                    if (host.__jusgovDeslocadoHoverMicro || !host.__jusgovPos || host.__jusgovPos.posicaoVertical !== posVertAlvo || host.__jusgovPos.alinhamento !== alinhAlvo || host.__jusgovUltModoTam !== chaveTamPos) {
                                        host.__jusgovDeslocadoHoverMicro = false;
                                        host.__jusgovUltModoTam = chaveTamPos;
                                        aplicarPosicao(host, posVertAlvo, alinhAlvo, null, null, false);
                                    }
                                };
                                host.__jusgovAtualizarPosicaoEfetiva = atualizarPosicaoEfetivaPill;

                                const atualizarBadgeStatus = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const nivelDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    if (host.__jusgovArrastando) {
                                        spanStatus.style.display = 'none';
                                        return;
                                    }
                                    const emMovAnim = Boolean(
                                        host.__jusgovPatrulhaAtiva ||
                                        (host.__jusgovScreensaverAtivo && !host.__jusgovHoverPill)
                                    );
                                    if (!emMovAnim) {
                                        restaurarBordaSemaforo();
                                    }
                                    const metaMs = Number((d && d.metaFaseMs) || 0) > 0
                                        ? Number(d.metaFaseMs)
                                        : (Math.max(1, Number((d && d.metaFaseMin) || 1)) * 60000);
                                    const cumpridoAoVivo = Boolean(d && d.emDescanso && (d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs));

                                    if (d.emDescanso && d.alertaEmprestimoTexto) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.alertaEmprestimoTexto;
                                        if (d.alertaEmprestimoCritico) {
                                            spanStatus.style.background = '#ef4444';
                                            spanStatus.style.color = '#ffffff';
                                            spanStatus.style.fontWeight = '700';
                                            const piscaOn = (Math.floor(Date.now() / 650) % 2) === 0;
                                            spanStatus.style.opacity = piscaOn ? '1' : '0.45';
                                            pill.style.borderColor = piscaOn ? '#ef4444' : '#f59e0b';
                                        } else {
                                            spanStatus.style.background = '#f59e0b';
                                            spanStatus.style.color = '#111827';
                                            spanStatus.style.fontWeight = '700';
                                            spanStatus.style.opacity = '1';
                                            pill.style.borderColor = '#f59e0b';
                                        }
                                        return;
                                    }
                                    spanStatus.style.opacity = '1';
                                    if (d.emDescanso && !cumpridoAoVivo && d.descansoEmAviso && d.descansoAvisoTexto) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.descansoAvisoTexto;
                                        spanStatus.style.background = '#f59e0b';
                                        spanStatus.style.color = '#111827';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    const restaurarVisualPadraoPillRetorno = () => {
                                        if (pill.getAttribute('data-retorno-ativo') === 'true') {
                                            pill.removeAttribute('data-retorno-ativo');
                                            pill.style.background = '#0f172a';
                                            pill.style.borderWidth = '1px';
                                            pill.style.borderColor = 'rgba(148,163,184,0.35)';
                                            pill.style.padding = '1px 6px';
                                            pill.style.animation = 'none';
                                            pill.style.boxShadow = '0 4px 14px rgba(15,23,42,0.34)';
                                        } else if (!d || !d.emDescanso || !d.alertaEmprestimoTexto) {
                                            pill.style.borderColor = 'rgba(148,163,184,0.35)';
                                        }
                                    };

                                    if (d.emDescanso && cumpridoAoVivo) {
                                        pill.setAttribute('data-retorno-ativo', 'true');
                                        pill.style.background = '#065f46';
                                        pill.style.borderWidth = '3px';
                                        pill.style.borderColor = '#4ade80';
                                        pill.style.padding = '4px 12px';
                                        pill.style.animation = 'jusgov-pill-retorno 1.2s ease-in-out infinite';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = '✅ VOLTAR AO TRABALHO!';
                                        spanStatus.style.background = '#4ade80';
                                        spanStatus.style.color = '#052e16';
                                        spanStatus.style.fontWeight = '800';
                                        return;
                                    }
                                    restaurarVisualPadraoPillRetorno();
                                    if (d.emDescanso && !d.aguardandoOciosidade) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Em andamento...';
                                        spanStatus.style.background = 'rgba(2, 132, 199, 0.2)';
                                        spanStatus.style.color = '#bae6fd';
                                        spanStatus.style.fontWeight = '600';
                                        return;
                                    }
                                    if (d.descansoPendente || (d.emDescanso && d.aguardandoOciosidade)) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Pendente...';
                                        spanStatus.style.background = '#dc2626';
                                        spanStatus.style.color = '#ffffff';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (nivelDet === 2 || (nivelDet === 1 && host.__jusgovHoverPill)) {
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.ultimoDescansoTexto || 'Sem descansos anteriores';
                                        spanStatus.style.background = 'transparent';
                                        spanStatus.style.color = '#cbd5e1';
                                        spanStatus.style.fontWeight = '500';
                                        return;
                                    }
                                    spanStatus.style.display = 'none';
                                    spanStatus.textContent = '';
                                };
                                host.__jusgovAtualizarBadgeStatus = atualizarBadgeStatus;

                                const atualizarModoVisualPill = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const nivelDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    const temAvisoOuDescanso = Boolean(d && (d.emDescanso || d.descansoPendente || d.descansoEmAviso));
                                    const mostrarMicro = Boolean(
                                        (estAtual.minimizadoMicro || Boolean(d && d.forcarMicroPorEmprestimoFoco)) &&
                                        !host.__jusgovModoOculto &&
                                        (!d || (!d.emDescanso && !d.descansoEmAviso && !d.descansoPendente)) &&
                                        (!host.__jusgovHoverPill || host.__jusgovArrastando)
                                    );
                                    if (mostrarMicro) {
                                        pill.style.display = 'none';
                                        boxBannerOculto.style.display = 'none';
                                        microIconeBox.style.display = 'inline-flex';
                                        const adiadoMs = Number(estAtual.minimizadoDescansoAdiadoTs || host.__jusgovMinimizadoDescansoTs || 0);
                                        const emPatrulha = Boolean(d && d.descansoPulado && adiadoMs > 0 && (Date.now() - adiadoMs) >= 45000);
                                        atualizarVisualMicroIcone(d, emPatrulha);
                                        return;
                                    }
                                    microIconeBox.style.display = 'none';
                                    if (!host.__jusgovModoOculto) {
                                        pill.style.display = 'inline-flex';
                                    }
                                    const faseCurtaArraste = (d && d.fase === 'pausa_maior') ? 'Descanso' : `${(d && d.faseLabel) || 'Foco'} ${(d && d.cicloAtual) || 1}/${(d && d.ciclosMax) || 4}`;
                                    if (host.__jusgovArrastando) {
                                        const mostrarFaseArraste = Boolean(temAvisoOuDescanso || nivelDet >= 1);
                                        pill.style.padding = mostrarFaseArraste ? '1px 6px' : '1px 4px';
                                        pill.style.borderRadius = '7px';
                                        spanFase.textContent = `🍅 ${faseCurtaArraste}`;
                                        spanFase.style.display = mostrarFaseArraste ? 'inline-block' : 'none';
                                        spanTempo.style.display = 'inline-block';
                                        linhaAcoes.style.display = 'none';
                                        btnContinuarDesc.style.display = 'none';
                                        btnPararFlex.style.display = 'none';
                                        btnFixar.style.display = 'none';
                                        btnMinimizar.style.display = 'none';
                                        spanStatus.style.display = 'none';
                                        linhaPropaganda.style.display = 'none';
                                        return;
                                    }
                                    const segFocoPre = Math.max(0, Number(d && d.segundosDecorridos || 0));
                                    const metaFocoSegPre = Math.max(1, Number((d && (d.metaFaseMin || d.focoMin)) || 45)) * 60;
                                    const segRestPre = metaFocoSegPre - segFocoPre;
                                    const emAvisoPreDesc = Boolean(d && !d.emDescanso && !d.emPausa && segRestPre > 0 && segRestPre <= 30);
                                    const ativoTrabalhando = Boolean(
                                        d && !d.emDescanso && !d.descansoPendente && !d.descansoEmAviso && !d.emPausa && !emAvisoPreDesc
                                    );
                                    if (!host.__jusgovModoOculto && !host.__jusgovHostDestruido) {
                                        if (!host.isConnected) {
                                            (document.body || document.documentElement).appendChild(host);
                                        }
                                        host.style.setProperty('display', 'block', 'important');
                                        host.style.setProperty('visibility', 'visible', 'important');
                                        host.style.setProperty('opacity', '1', 'important');
                                    }
                                    const hoverVisivel = Boolean(host.__jusgovHoverPill);
                                    const botoesInlineTopo = Boolean(temAvisoOuDescanso || emAvisoPreDesc);
                                    const exibirBotoesHover = Boolean(
                                        hoverVisivel &&
                                        (botoesInlineTopo || !ativoTrabalhando || host.__jusgovHoverAcoesDesbloqueadas)
                                    );
                                    const containerBotoesAlvo = botoesInlineTopo ? linhaPrincipal : linhaAcoes;
                                    if (btnMinimizar.parentNode !== containerBotoesAlvo) {
                                        containerBotoesAlvo.appendChild(btnContinuarDesc);
                                        containerBotoesAlvo.appendChild(btnPararFlex);
                                        containerBotoesAlvo.appendChild(btnFixar);
                                        containerBotoesAlvo.appendChild(btnMinimizar);
                                    }
                                    const modoUltraCompactoSemHover = Boolean(
                                        !hoverVisivel &&
                                        !temAvisoOuDescanso &&
                                        !emAvisoPreDesc &&
                                        !(d && (d.descansoPulado || d.emPausa)) &&
                                        nivelDet === 0
                                    );
                                    pill.style.padding = modoUltraCompactoSemHover ? '1px 4px' : '1px 6px';
                                    pill.style.borderRadius = '7px';
                                    const faseCurtaAtual = (d && d.fase === 'pausa_maior') ? 'Descanso' : `${(d && d.faseLabel) || 'Foco'} ${(d && d.cicloAtual) || 1}/${(d && d.ciclosMax) || 4}`;
                                    spanFase.textContent = `🍅 ${faseCurtaAtual}`;
                                    spanFase.style.display = (hoverVisivel || temAvisoOuDescanso || nivelDet >= 1) ? 'inline-block' : 'none';
                                    spanTempo.style.display = 'inline-block';
                                    spanTempo.style.fontStyle = (d && !d.emDescanso && d.descansoPulado) ? 'italic' : 'normal';
                                    const govUi = (host.__jusgovBemEstarPacote && host.__jusgovBemEstarPacote.governanca) || {};
                                    const emModoDescansoOuPendente = Boolean(d && (d.emDescanso || d.descansoPendente || d.descansoEmAviso));
                                    const podeContinuar = Boolean(
                                        emModoDescansoOuPendente ||
                                        (d && !d.emDescanso && d.descansoPulado && (govUi.podeContinuarDescanso !== false))
                                    );
                                    const podeParar = Boolean(
                                        d && !emModoDescansoOuPendente
                                    );
                                    const semBotoesPatrulha = Boolean(host.__jusgovPreviewPatrulhaSemBotoes);
                                    btnContinuarDesc.style.display = (!semBotoesPatrulha && hoverVisivel && podeContinuar) ? 'inline-flex' : 'none';
                                    btnContinuarDesc.title = emModoDescansoOuPendente
                                        ? 'Voltar a trabalhar (pausar descanso e retomar Foco)'
                                        : 'Retomar descanso pulado (salva tempo atual de Foco)';
                                    btnPararFlex.style.display = (!semBotoesPatrulha && hoverVisivel && podeParar) ? 'inline-flex' : 'none';
                                    btnPararFlex.title = 'Adiantar Alívio / Pausar Foco (salva contador atual)';
                                    btnBannerIniciar.style.display = (
                                        d && (d.descansoPulado ? (govUi.podeContinuarDescanso !== false) : (govUi.podeAdiantarDescanso !== false))
                                    ) ? 'inline-flex' : 'none';
                                    btnFixar.style.display = (!semBotoesPatrulha && hoverVisivel && ativoTrabalhando && !emModoDescansoOuPendente) ? 'inline-flex' : 'none';
                                    btnMinimizar.style.display = (!semBotoesPatrulha && hoverVisivel) ? 'inline-flex' : 'none';
                                    linhaAcoes.style.display = (!semBotoesPatrulha && !botoesInlineTopo && exibirBotoesHover) ? 'flex' : 'none';
                                    const chaveMinBtn = (d && (d.emDescanso || d.descansoPendente))
                                        ? 'minimizar_pular'
                                        : (estAtual.minimizadoMicro ? 'expandir' : 'minimizar_micro');
                                    if (btnMinimizar.__jusgovIconeChave !== chaveMinBtn) {
                                        btnMinimizar.__jusgovIconeChave = chaveMinBtn;
                                        if (chaveMinBtn === 'minimizar_pular') {
                                            btnMinimizar.replaceChildren(criarIconeSvgDiscreto('minimizar', '#cbd5e1'));
                                            btnMinimizar.title = 'Pular descanso para trabalhar mais e minimizar em micro-ícones';
                                        } else if (chaveMinBtn === 'expandir') {
                                            btnMinimizar.replaceChildren(criarIconeSvgDiscreto('expandir', '#38bdf8'));
                                            btnMinimizar.title = 'Restaurar minipopup fixo na tela';
                                        } else {
                                            btnMinimizar.replaceChildren(criarIconeSvgDiscreto('minimizar', '#cbd5e1'));
                                            btnMinimizar.title = 'Minimizar para micro-ícone (passe o mouse para restaurar)';
                                        }
                                    }
                                    atualizarBadgeStatus();
                                    if (typeof host.__jusgovAtualizarPropaganda === 'function') {
                                        host.__jusgovAtualizarPropaganda();
                                    }
                                };
                                host.__jusgovAtualizarModoVisual = atualizarModoVisualPill;

                                const renderizarCardPropaganda = (card) => {
                                    if (!card) return;
                                    const bg = card.bg || '#0f766e';
                                    const fg = card.fg || '#f8fafc';
                                    linhaPropaganda.style.background = bg;
                                    linhaPropaganda.style.color = fg;
                                    const svgIcone = criarIconeSvgBemEstar(card.icone || 'esticar', fg, 14);
                                    if (card.piscar) svgIcone.classList.add('jg-piscar');
                                    spanPropIcone.replaceChildren(svgIcone);
                                    spanPropTexto.textContent = card.texto || '';

                                    boxBannerOculto.style.background = bg;
                                    boxBannerOculto.style.color = fg;
                                    const svgBanner = criarIconeSvgBemEstar(card.icone || 'esticar', fg, 26);
                                    svgBanner.classList.add('jg-piscar');
                                    spanBannerIcone.replaceChildren(svgBanner);
                                    spanBannerTexto.textContent = card.texto || '';
                                };

                                const obterCardsPropaganda = () => {
                                    const pkg = host.__jusgovBemEstarPacote || {};
                                    const lista = Array.isArray(pkg.cardsCiclo) ? pkg.cardsCiclo : [];
                                    return lista.length > 0 ? lista : (pkg.cardDestaque ? [pkg.cardDestaque] : []);
                                };

                                const calcularDuracaoLeituraCardMs = (card, ehPreDescanso = false, ehPrimeiraDescanso = false) => {
                                    const pkg = host.__jusgovBemEstarPacote || {};
                                    const textoCard = String((card && card.texto) || '').trim();
                                    const extraTamMs = Math.round(textoCard.length * 145);
                                    const baseMs = ehPreDescanso ? 5500 : 8500;
                                    const jitterMs = Math.round((Math.random() * 4000) - 2000);
                                    let totalMs = baseMs + extraTamMs + jitterMs;
                                    if (ehPrimeiraDescanso) {
                                        const minIni = Math.max(14000, Number(pkg.duracaoPrimeiraMsgMs || 14000));
                                        totalMs = Math.max(minIni, baseMs + extraTamMs) + jitterMs;
                                    }
                                    return Math.max(ehPreDescanso ? 5500 : 7500, totalMs);
                                };

                                const rotacionarPropagandaAgora = (forcarTroca = false, ignorarBloqueioLeitura = false) => {
                                    const lista = obterCardsPropaganda();
                                    if (lista.length === 0) return null;
                                    if (forcarTroca && !ignorarBloqueioLeitura && Date.now() < Number(host.__jusgovPropBloqueadaAteTs || 0)) {
                                        return null;
                                    }
                                    let idx = Number(host.__jusgovPropCardIdx);
                                    if (!Number.isFinite(idx) || idx < 0 || idx >= lista.length) {
                                        idx = 0;
                                    } else if (forcarTroca && lista.length > 1) {
                                        let prox = Math.floor(Math.random() * lista.length);
                                        if (prox === idx) prox = (idx + 1) % lista.length;
                                        idx = prox;
                                    }
                                    host.__jusgovPropCardIdx = idx;
                                    renderizarCardPropaganda(lista[idx]);
                                    if (host.__jusgovPropAtivo) {
                                        const dNow = host.__jusgovDados || dadosResumo;
                                        const segFocoNow = Math.max(0, Number(dNow && dNow.segundosDecorridos || 0));
                                        const metaFocoSegNow = Math.max(1, Number((dNow && (dNow.metaFaseMin || dNow.focoMin)) || 45)) * 60;
                                        const emPreNow = Boolean(dNow && !dNow.emDescanso && !dNow.emPausa && (metaFocoSegNow - segFocoNow) > 0 && (metaFocoSegNow - segFocoNow) <= 30);
                                        agendarProximoCicloPropaganda(calcularDuracaoLeituraCardMs(lista[idx], emPreNow, false), emPreNow);
                                    }
                                    return lista[idx];
                                };
                                host.__jusgovRotacionarPropaganda = rotacionarPropagandaAgora;

                                const agendarProximoCicloPropaganda = (msEspera, ehPreDescanso = false) => {
                                    host.__jusgovPropBloqueadaAteTs = Date.now() + Math.max(4000, msEspera);
                                    if (host.__jusgovPropTimer) clearTimeout(host.__jusgovPropTimer);
                                    host.__jusgovPropTimer = setTimeout(() => {
                                        host.__jusgovPropTimer = 0;
                                        if (!host.isConnected || document.hidden) return;
                                        rotacionarPropagandaAgora(true, true);
                                    }, msEspera);
                                };

                                const atualizarPropagandaUi = () => {
                                    if (Date.now() < Number(host.__jusgovGovFeedbackAteTs || 0) && host.__jusgovGovFeedbackTexto) {
                                        linhaPropaganda.style.display = 'flex';
                                        linhaPropaganda.style.background = '#b45309';
                                        linhaPropaganda.style.color = '#ffffff';
                                        spanPropIcone.replaceChildren(criarIconeSvgBemEstar('incentivo_descanso', '#ffffff', 13));
                                        spanPropTexto.textContent = host.__jusgovGovFeedbackTexto;
                                        return;
                                    }
                                    const d = host.__jusgovDados || dadosResumo;
                                    const segFoco = Math.max(0, Number(d && d.segundosDecorridos || 0));
                                    const metaFocoSeg = Math.max(1, Number((d && (d.metaFaseMin || d.focoMin)) || 45)) * 60;
                                    const segRestFoco = metaFocoSeg - segFoco;
                                    const emPreDescanso = Boolean(d && !d.emDescanso && !d.emPausa && segRestFoco > 0 && segRestFoco <= 30);
                                    const devePropaganda = Boolean(d && (d.emDescanso || emPreDescanso || host.__jusgovBannerVisivelAgora || (d.descansoPulado && host.__jusgovPreviewPatrulhaSemBotoes)));
                                    const lista = obterCardsPropaganda();
                                    if (!devePropaganda || lista.length === 0 || host.__jusgovArrastando) {
                                        host.__jusgovPropAtivo = false;
                                        if (host.__jusgovPropTimer) {
                                            clearTimeout(host.__jusgovPropTimer);
                                            host.__jusgovPropTimer = 0;
                                        }
                                        linhaPropaganda.style.display = 'none';
                                        return;
                                    }
                                    linhaPropaganda.style.display = (emPreDescanso || (d && d.emDescanso) || (d && d.descansoPulado && host.__jusgovPreviewPatrulhaSemBotoes)) ? 'flex' : 'none';
                                    const faseKeyProp = `${host.__jusgovChaveFase || ''}:${d && d.emDescanso ? 'desc' : (emPreDescanso ? 'pre' : 'ban')}`;
                                    if (!host.__jusgovPropAtivo || host.__jusgovPropChave !== faseKeyProp) {
                                        host.__jusgovPropAtivo = true;
                                        host.__jusgovPropChave = faseKeyProp;
                                        host.__jusgovPropCardIdx = 0;
                                        renderizarCardPropaganda(lista[0]);
                                        const esperaIni = calcularDuracaoLeituraCardMs(
                                            lista[0],
                                            emPreDescanso,
                                            Boolean(d && d.emDescanso)
                                        );
                                        agendarProximoCicloPropaganda(esperaIni, emPreDescanso);
                                    }
                                };
                                host.__jusgovAtualizarPropaganda = atualizarPropagandaUi;

                                const atualizarBannerOculto = () => {
                                    const estBan = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const dBan = host.__jusgovDados || dadosResumo;
                                    const microAtivoAgora = Boolean(
                                        estBan.minimizadoMicro &&
                                        (!host.__jusgovHoverPill || host.__jusgovArrastando) &&
                                        (!dBan || (!dBan.emDescanso && !dBan.descansoEmAviso))
                                    );
                                    if (!host.__jusgovModoOculto) {
                                        host.style.setProperty('display', 'block', 'important');
                                        if (microAtivoAgora) {
                                            pill.style.display = 'none';
                                            microIconeBox.style.display = 'inline-flex';
                                        } else {
                                            microIconeBox.style.display = 'none';
                                            pill.style.display = 'inline-flex';
                                        }
                                        boxBannerOculto.style.display = 'none';
                                        host.__jusgovBannerPos = null;
                                        if (host.__jusgovBannerShowTimer) { clearTimeout(host.__jusgovBannerShowTimer); host.__jusgovBannerShowTimer = 0; }
                                        if (host.__jusgovBannerHideTimer) { clearTimeout(host.__jusgovBannerHideTimer); host.__jusgovBannerHideTimer = 0; }
                                        return;
                                    }
                                    if (host.__jusgovBannerVisivelAgora) {
                                        host.style.setProperty('display', 'block', 'important');
                                        if (host.__jusgovHoverPill) {
                                            pill.style.display = 'inline-flex';
                                            boxBannerOculto.style.display = 'none';
                                        } else {
                                            pill.style.display = 'none';
                                            boxBannerOculto.style.display = 'inline-flex';
                                        }
                                        rotacionarPropagandaAgora(false);
                                        atualizarPosicaoEfetivaPill(Date.now());
                                        return;
                                    }
                                    host.style.setProperty('display', 'none', 'important');
                                    pill.style.display = 'none';
                                    boxBannerOculto.style.display = 'none';
                                    if (!host.__jusgovBannerShowTimer && !document.hidden) {
                                        const pkg = host.__jusgovBemEstarPacote || {};
                                        const minEsp = Math.max(8000, Number(pkg.bannerLembreteMinMs || 45000));
                                        const maxEsp = Math.max(minEsp, Number(pkg.bannerLembreteMaxMs || 85000));
                                        const esperaShow = Math.round(minEsp + Math.random() * (maxEsp - minEsp));
                                        host.__jusgovBannerShowTimer = setTimeout(() => {
                                            host.__jusgovBannerShowTimer = 0;
                                            if (!host.isConnected || !host.__jusgovModoOculto || document.hidden) return;
                                            const vOpts = ['superior', 'inferior'];
                                            const hOpts = ['esquerda', 'centro', 'direita'];
                                            host.__jusgovBannerPos = {
                                                posVert: vOpts[Math.floor(Math.random() * vOpts.length)],
                                                alinh: hOpts[Math.floor(Math.random() * hOpts.length)]
                                            };
                                            host.__jusgovBannerVisivelAgora = true;
                                            host.__jusgovPropCardIdx = 0;
                                            atualizarBannerOculto();
                                            const listaBan = obterCardsPropaganda();
                                            const cardBan = (listaBan && listaBan[0]) || null;
                                            const duracaoVis = calcularDuracaoLeituraCardMs(cardBan, false, false);
                                            if (host.__jusgovBannerHideTimer) clearTimeout(host.__jusgovBannerHideTimer);
                                            host.__jusgovBannerHideTimer = setTimeout(() => {
                                                host.__jusgovBannerHideTimer = 0;
                                                if (!host.isConnected) return;
                                                if (host.__jusgovHoverPill) return;
                                                host.__jusgovBannerVisivelAgora = false;
                                                atualizarBannerOculto();
                                            }, duracaoVis);
                                        }, esperaShow);
                                    }
                                };
                                host.__jusgovAtualizarBannerOculto = atualizarBannerOculto;

                                /* Renderização pura a partir do snapshot externo compartilhado pelo Service Worker (sem contadores locais) */
                                const atualizarRelogio = () => {
                                    if (!contextoHostVivo()) return;
                                    const d = host.__jusgovDados || dadosResumo;
                                    if (!d) return;
                                    const agoraNow = (host.__jusgovSnapshotAgoraSrvMs && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage)
                                        ? Number(host.__jusgovSnapshotAgoraSrvMs)
                                        : (Date.now() + Number(host.__jusgovRelogioOffsetMs || 0));

                                    if (d.emDescanso) {
                                        const metaMs = Number(d.metaFaseMs || 0) > 0
                                            ? Number(d.metaFaseMs)
                                            : (Math.max(1, Number(d.metaFaseMin || 1)) * 60000);
                                        const cumpridoAoVivo = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);

                                        if (d.aguardandoOciosidade) {
                                            const mmParado = String(Math.max(0, Number(d.metaFaseMin || 0))).padStart(2, '0');
                                            spanTempo.textContent = `-${mmParado}:00`;
                                        } else {
                                            const diffMs = metaMs - Number(d.descansoAcumuladoMs || 0);
                                            if (diffMs > 0) {
                                                const diffSeg = Math.ceil(diffMs / 1000);
                                                const mm = String(Math.floor(diffSeg / 60)).padStart(2, '0');
                                                const ss = String(diffSeg % 60).padStart(2, '0');
                                                spanTempo.textContent = `-${mm}:${ss}`;
                                            } else {
                                                const extraSeg = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));
                                                const mm = String(Math.floor(extraSeg / 60)).padStart(2, '0');
                                                const ss = String(extraSeg % 60).padStart(2, '0');
                                                spanTempo.textContent = `+${mm}:${ss}`;
                                            }
                                        }

                                        if (cumpridoAoVivo && !d.aguardandoOciosidade) {
                                            const emRajadaVisual = Boolean(host.__jusgovRajadaVisualAteTs && agoraNow < host.__jusgovRajadaVisualAteTs);
                                            atualizarBackdropTelaCheia(emRajadaVisual ? 'retorno_rajada' : 'retorno_trabalho');
                                        } else if (!d.aguardandoOciosidade && !host.__jusgovModoOculto) {
                                            atualizarBackdropTelaCheia('descanso_calmo');
                                        } else {
                                            atualizarBackdropTelaCheia('nenhum');
                                        }

                                        if (cumpridoAoVivo && !document.hidden && !host.__jusgovAlarmeBloqueado) {
                                            const cfgBeep = host.__jusgovConfigBeep || {};
                                            const extraSegAlarme = Math.max(1, Math.floor(Math.max(0, Number(d.descansoAcumuladoMs || 0) - metaMs) / 1000));
                                            if (host.__jusgovUltimoSegAlarme !== extraSegAlarme) {
                                                host.__jusgovUltimoSegAlarme = extraSegAlarme;
                                                const metaSegAlarme = Math.max(60, Math.round(metaMs / 1000));
                                                const faseAlarme = (extraSegAlarme <= metaSegAlarme) ? 'DESCANSO_PUNITIVO' : 'ATRASO_ABANDONO';
                                                const tempoFaseAlarme = (faseAlarme === 'DESCANSO_PUNITIVO')
                                                    ? extraSegAlarme
                                                    : Math.max(1, extraSegAlarme - metaSegAlarme);
                                                const acaoAlarme = verificarAlarmePomodoroLocal(
                                                    Math.max(0, Number(d.cicloAtual || 0)),
                                                    Math.max(1, Number(d.ciclosMax || 4)),
                                                    metaSegAlarme,
                                                    tempoFaseAlarme,
                                                    faseAlarme
                                                );
                                                if (acaoAlarme === 'BLOQUEAR') {
                                                    host.__jusgovAlarmeBloqueado = true;
                                                } else if (acaoAlarme) {
                                                    /* Rajada visual de tela cheia durante os beeps e +3.5s depois de terminarem (independente de som ativo) */
                                                    const durRajadaMs = (acaoAlarme === 'BEEP_LONGO') ? 6000 : ((acaoAlarme === 'BEEP_CURTO_TRIPLO') ? 4800 : 3800);
                                                    host.__jusgovRajadaVisualAteTs = agoraNow + durRajadaMs;
                                                    atualizarBackdropTelaCheia('retorno_rajada');
                                                    if (cfgBeep.ativo && cfgBeep.permitirBeep) {
                                                        host.__jusgovUltimoBeepTs = agoraNow;
                                                        tocarBeepConclusao(cfgBeep.intensidade || 'suave', acaoAlarme);
                                                    }
                                                }
                                            }
                                        } else if (!cumpridoAoVivo) {
                                            host.__jusgovUltimoBeepTs = 0;
                                            host.__jusgovUltimoSegAlarme = -1;
                                            host.__jusgovAlarmeBloqueado = false;
                                            host.__jusgovRajadaVisualAteTs = 0;
                                        }

                                        const excedeuTempoDescanso = Boolean(
                                            !d.aguardandoOciosidade &&
                                            (cumpridoAoVivo || Number(d.descansoAcumuladoMs || 0) >= metaMs)
                                        );
                                        spanTempo.style.color = excedeuTempoDescanso ? '#86efac' : '';
                                        spanTempo.style.animation = excedeuTempoDescanso ? 'jusgov-piscar-crono 1s steps(1,end) infinite' : 'none';
                                        atualizarModoVisualPill();
                                        atualizarPosicaoEfetivaPill(agoraNow);
                                        return;
                                    }

                                    host.__jusgovUltimoBeepTs = 0;
                                    host.__jusgovUltimoSegAlarme = -1;
                                    host.__jusgovAlarmeBloqueado = false;
                                    host.__jusgovRajadaVisualAteTs = 0;
                                    atualizarBackdropTelaCheia('nenhum');
                                    /* Contador de Ativo/Foco é progressivo; em trabalho normal sem hover omite '+' para compactação, mantendo '+'/'-' em hover, compensações e alertas */
                                    const segFoco = (typeof d.segundosDecorridos === 'number' && Number.isFinite(d.segundosDecorridos))
                                        ? Math.max(0, Math.floor(d.segundosDecorridos))
                                        : (d.emPausa
                                            ? Math.max(0, Number(d.minutosNaFase || 0) * 60)
                                            : Math.max(0, Math.floor((agoraNow - Number(d.focoAnchorTs || d.faseInicioTs || agoraNow)) / 1000)));
                                    const mm = String(Math.floor(segFoco / 60)).padStart(2, '0');
                                    const ss = String(segFoco % 60).padStart(2, '0');
                                    const metaFocoSeg = Math.max(1, Number(d.metaFaseMin || d.focoMin || 45)) * 60;
                                    const segRestFoco = metaFocoSeg - segFoco;
                                    const emAlerta30s = Boolean(!d.descansoPendente && !d.emPausa && segRestFoco > 0 && segRestFoco <= 30);
                                    const exibirSinalTrabalho = Boolean(
                                        host.__jusgovHoverPill ||
                                        d.descansoPulado ||
                                        d.descansoPendente ||
                                        d.descansoEmAviso ||
                                        d.emPausa ||
                                        emAlerta30s
                                    );
                                    spanTempo.textContent = exibirSinalTrabalho ? `+${mm}:${ss}` : `${mm}:${ss}`;
                                    spanTempo.style.color = emAlerta30s ? '#facc15' : '';
                                    spanTempo.style.animation = emAlerta30s ? 'jusgov-piscar-crono 1s steps(1,end) infinite' : 'none';
                                    atualizarModoVisualPill();
                                    atualizarPosicaoEfetivaPill(agoraNow);
                                };
                                host.__jusgovAtualizarRelogio = atualizarRelogio;

                                const aplicarSnapshotExterno = (novaCfgExib, novoResumo, novoEstadoBarra) => {
                                    gerenciarModalDescanso(Boolean(novaCfgExib && novaCfgExib.deveExibirModalDescanso), novaCfgExib && novaCfgExib.modalDados, novoResumo);
                                    const agoraLocal = Date.now();
                                    const exib = resolverPermissaoExibicao(host, novaCfgExib, novoResumo);
                                    if (!exib.deveExibir) {
                                        if (host.__jusgovLocalBarraAlteradaAteTs && agoraLocal < host.__jusgovLocalBarraAlteradaAteTs) {
                                            return;
                                        }
                                        destruirHost(host);
                                        return;
                                    }
                                    const estNorm = normalizarEstadoBarra(novoEstadoBarra);
                                    const agoraSrv = (novaCfgExib && novaCfgExib.agoraServidor) ? Number(novaCfgExib.agoraServidor) : agoraLocal;
                                    host.__jusgovChaveFase = exib.chave;
                                    host.__jusgovDados = novoResumo;
                                    host.__jusgovSnapshotAgoraSrvMs = agoraSrv;
                                    host.__jusgovRelogioOffsetMs = (novaCfgExib && novaCfgExib.agoraServidor) ? (agoraSrv - agoraLocal) : 0;
                                    const tooltipAtivo = (novaCfgExib && novaCfgExib.tooltipTexto) || (novoResumo && novoResumo.tooltipTexto) || '';
                                    if (tooltipAtivo) {
                                        pill.title = tooltipAtivo;
                                        spanTempo.title = tooltipAtivo;
                                        microIconeBox.title = tooltipAtivo;
                                    } else {
                                        pill.removeAttribute('title');
                                        spanTempo.removeAttribute('title');
                                        microIconeBox.removeAttribute('title');
                                    }
                                    const estAnteriorLocal = host.__jusgovEstadoBarra;
                                    if (estAnteriorLocal && host.__jusgovLocalBarraAlteradaAteTs && agoraLocal < host.__jusgovLocalBarraAlteradaAteTs) {
                                        estNorm.minimizadoMicro = estAnteriorLocal.minimizadoMicro;
                                        estNorm.minimizadoDescansoAdiadoTs = estAnteriorLocal.minimizadoDescansoAdiadoTs;
                                        estNorm.modoFixacao = estAnteriorLocal.modoFixacao;
                                        estNorm.nivelDetalhe = estAnteriorLocal.nivelDetalhe;
                                    }
                                    host.__jusgovEstadoBarra = estNorm;
                                    host.__jusgovModoBarra = (novaCfgExib && novaCfgExib.modoBarra) || 'sempre';
                                    host.__jusgovBemEstarPacote = (novaCfgExib && novaCfgExib.bemEstarPropaganda) || null;
                                    host.__jusgovModoOculto = Boolean(!exib.deveExibirNormal && exib.podeBannerOculto);
                                    if (exib.deveExibirNormal) {
                                        host.__jusgovBannerVisivelAgora = false;
                                    }
                                    host.__jusgovConfigBeep = {
                                        ativo: Boolean(novaCfgExib && novaCfgExib.beepAtivo),
                                        intensidade: (novaCfgExib && novaCfgExib.beepIntensidade) || 'suave',
                                        intervaloMs: Math.max(5000, Number((novaCfgExib && novaCfgExib.beepIntervaloMs) || 15000)),
                                        permitirBeep: Boolean(novaCfgExib && novaCfgExib.permitirBeep)
                                    };
                                    if (Number(estNorm.modoFixacao) !== 1 && !(novoResumo && novoResumo.emDescanso && novoResumo.descansoEmAviso)) {
                                        host.__jusgovRetornoRect = null;
                                    }
                                    atualizarVisualBotaoFixar(btnFixar, estNorm.modoFixacao, host.__jusgovModoBarra === 'descanso');
                                    atualizarRelogio();
                                    atualizarBannerOculto();
                                    if (!document.hidden && !host.__jusgovTimerInterval) {
                                        host.__jusgovTimerInterval = setInterval(solicitarSincronizacaoExterna, 1000);
                                    }
                                };
                                host.__jusgovAplicarSnapshotExterno = aplicarSnapshotExterno;

                                const solicitarSincronizacaoExterna = () => {
                                    if (!contextoHostVivo()) return;
                                    if (document.hidden || host.__jusgovSyncEmVoo) return;
                                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                        const agoraSyncReq = Date.now();
                                        const dSync = host.__jusgovDados;
                                        const semFocoJanela = (typeof document.hasFocus === 'function') ? !document.hasFocus() : false;
                                        const intervaloMinSync = (dSync && dSync.emDescanso) ? 1000 : (semFocoJanela ? 3500 : 2000);
                                        if (host.__jusgovUltSyncIpcTs && (agoraSyncReq - host.__jusgovUltSyncIpcTs) < intervaloMinSync) {
                                            if (host.__jusgovSnapshotAgoraSrvMs) {
                                                host.__jusgovSnapshotAgoraSrvMs += 1000;
                                            }
                                            if (dSync && !dSync.emPausa && typeof dSync.segundosDecorridos === 'number') {
                                                dSync.segundosDecorridos += 1;
                                            }
                                            atualizarRelogio();
                                            return;
                                        }
                                        host.__jusgovUltSyncIpcTs = agoraSyncReq;
                                        host.__jusgovSyncEmVoo = true;
                                        chrome.runtime.sendMessage({ acao: 'OBTER_STATUS_TRABALHO' }).then((resp) => {
                                            host.__jusgovSyncEmVoo = false;
                                            if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected && !host.__jusgovHostDestruido) {
                                                const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                            }
                                        }).catch((err) => {
                                            host.__jusgovSyncEmVoo = false;
                                            if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                destruirHost(host);
                                            }
                                        });
                                        return;
                                    }
                                    atualizarRelogio();
                                };

                                const enviarInteracaoExterna = (tipoInteracao = 'movimento') => {
                                    if (!contextoHostVivo()) return;
                                    const d = host.__jusgovDados;
                                    if (!d) return;
                                    const agoraLoc = Date.now();
                                    const precisaPingImediato = Boolean(tipoInteracao === 'click_ou_tecla');
                                    if (d.emDescanso) {
                                        if (precisaPingImediato) {
                                            pararScreensaver();
                                            removerBackdropBlur();
                                        } else if (tipoInteracao === 'movimento' && (agoraLoc - Number(host.__jusgovUltimoPingDescTs || 0)) < 250) {
                                            return;
                                        }
                                        host.__jusgovUltimoPingDescTs = agoraLoc;
                                    } else if (!precisaPingImediato) {
                                        if ((agoraLoc - Number(host.__jusgovUltimoPingAtivTs || 0)) < 15000) {
                                            return;
                                        }
                                        host.__jusgovUltimoPingAtivTs = agoraLoc;
                                    }
                                    try {
                                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                            chrome.runtime.sendMessage({
                                                acao: 'PING_ATIVIDADE_TRABALHO',
                                                tipoInteracao,
                                                retornarSnapshot: true
                                            }).then((resp) => {
                                                if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected && !host.__jusgovHostDestruido) {
                                                    const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                    aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                                }
                                            }).catch((err) => {
                                                if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                    destruirHost(host);
                                                }
                                            });
                                        }
                                    } catch (_) {
                                        contextoHostVivo();
                                    }
                                };

                                /* Retorno automático quando no modo 2 (posição fixada) o mouse sai da área original */
                                const onDocMouseMovePos = (ev) => {
                                    const ultimo = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                    const dxCursor = (ultimo.x !== -9999) ? Math.abs(ev.clientX - ultimo.x) : 0;
                                    const dyCursor = (ultimo.y !== -9999) ? Math.abs(ev.clientY - ultimo.y) : 0;
                                    const passoPx = Math.hypot(dxCursor, dyCursor);
                                    const moveuDeVerdade = ultimo.x !== -9999 && passoPx > 1.5;
                                    host.__jusgovUltimoCursor = { x: ev.clientX, y: ev.clientY };
                                    if (moveuDeVerdade) {
                                        host.__jusgovCursorMoveuRealTs = Date.now();
                                        if (host.__jusgovAguardandoSairPosMin) {
                                            const rMicroPos = microIconeBox.getBoundingClientRect();
                                            const foraMicroPos = (!rMicroPos || rMicroPos.width <= 4) ||
                                                ev.clientX < rMicroPos.left - 12 || ev.clientX > rMicroPos.right + 12 ||
                                                ev.clientY < rMicroPos.top - 12 || ev.clientY > rMicroPos.bottom + 12;
                                            if (foraMicroPos) {
                                                host.__jusgovAguardandoSairPosMin = false;
                                                host.__jusgovSuprimirHoverMicroAteTs = 0;
                                            }
                                        }
                                        if ((host.__jusgovScreensaverAtivo || host.__jusgovPatrulhaAtiva) && !host.__jusgovHoverPill &&
                                            (pill.matches(':hover') || microIconeBox.matches(':hover'))) {
                                            ativarHoverExpandido(true);
                                        }
                                    }
                                    const pathMov = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    const naPropriaBarra = Boolean(ev.target === host || pathMov.includes(host) || pathMov.includes(pill) || pathMov.includes(microIconeBox) || host.__jusgovHoverPill);
                                    if (moveuDeVerdade && !naPropriaBarra) {
                                        const dCur = host.__jusgovDados;
                                        if (dCur && dCur.emDescanso) {
                                            host.__jusgovDistMovDescanso = Number(host.__jusgovDistMovDescanso || 0) + passoPx;
                                            if (host.__jusgovDistMovDescanso >= 36) {
                                                host.__jusgovDistMovDescanso = 0;
                                                enviarInteracaoExterna('movimento');
                                            }
                                        } else {
                                            host.__jusgovDistMovDescanso = 0;
                                            enviarInteracaoExterna('movimento');
                                        }
                                    }
                                    if (!host.__jusgovRetornoRect) return;
                                    const rOrig = host.__jusgovRetornoRect;
                                    const foraOrig = (
                                        ev.clientX < rOrig.left - 14 ||
                                        ev.clientX > rOrig.right + 14 ||
                                        ev.clientY < rOrig.top - 14 ||
                                        ev.clientY > rOrig.bottom + 14
                                    );
                                    if (foraOrig) {
                                        agendarRetornoPosicaoAncorada();
                                    } else if (host.__jusgovTimerRetorno) {
                                        clearTimeout(host.__jusgovTimerRetorno);
                                        host.__jusgovTimerRetorno = null;
                                    }
                                };
                                const onDocMouseLeavePos = () => {
                                    host.__jusgovUltimoCursor = { x: -9999, y: -9999 };
                                    if (host.__jusgovRetornoRect) {
                                        agendarRetornoPosicaoAncorada();
                                    }
                                };
                                const onDocWheelPos = () => {
                                    enviarInteracaoExterna('movimento');
                                };

                                /* Interação do usuário: notifica estado externo */
                                const onDocInteracao = (ev) => {
                                    if (!contextoHostVivo()) return;
                                    if (ev.type === 'keydown' && ev.repeat) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    const naPropriaBarra = (ev.target === host || path.includes(host) || path.includes(pill) || path.includes(microIconeBox));
                                    if (!naPropriaBarra) {
                                        enviarInteracaoExterna('click_ou_tecla');
                                    }
                                };
                                const onDocVisibilityChange = () => {
                                    if (!contextoHostVivo()) return;
                                    if (document.hidden) {
                                        removerBackdropBlur();
                                        pararScreensaver();
                                        pararPatrulhaBorda();
                                        if (host.__jusgovTimerInterval) {
                                            clearInterval(host.__jusgovTimerInterval);
                                            host.__jusgovTimerInterval = 0;
                                        }
                                    } else {
                                        solicitarSincronizacaoExterna();
                                        if (!host.__jusgovTimerInterval) {
                                            host.__jusgovTimerInterval = setInterval(solicitarSincronizacaoExterna, 1000);
                                        }
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({ acao: 'SINCRONIZAR_GUIA_ATIVA_POMODORO' }).catch((err) => {
                                                    if (iniciouComChromeRuntime && (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || /context invalidated/i.test(String(err || '')))) {
                                                        destruirHost(host);
                                                    }
                                                });
                                            }
                                        } catch (_) {
                                            contextoHostVivo();
                                        }
                                    }
                                };
                                document.addEventListener('keydown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousedown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousemove', onDocMouseMovePos, { capture: true, passive: true });
                                document.addEventListener('wheel', onDocWheelPos, { capture: true, passive: true });
                                document.addEventListener('mouseleave', onDocMouseLeavePos, { capture: false, passive: true });
                                document.addEventListener('visibilitychange', onDocVisibilityChange, { capture: false, passive: true });
                                host.__jusgovCleanupListeners = () => {
                                    document.removeEventListener('keydown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousedown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousemove', onDocMouseMovePos, { capture: true });
                                    document.removeEventListener('wheel', onDocWheelPos, { capture: true });
                                    document.removeEventListener('mouseleave', onDocMouseLeavePos, { capture: false });
                                    document.removeEventListener('visibilitychange', onDocVisibilityChange, { capture: false });
                                };

                                (document.body || document.documentElement).appendChild(host);
                            }

                            if (typeof host.__jusgovAplicarSnapshotExterno === 'function') {
                                host.__jusgovAplicarSnapshotExterno(cfgExib, dadosResumo, estadoBarra);
                            }
            };
        }

        /**
         * Atualiza o badge/tooltip do ícone no Chrome e projeta/remove a faixa flutuante global nas abas ativas de cada janela.
         * @param {Object} [config]
         * @param {Object} [estadoParam]
         * @param {number|string|null} [tabIdEspecifica] número de tabId específica ou null para guias ativas das janelas abertas
         */
        async sincronizarIndicadoresGlobaisPomodoro(config = null, estadoParam = null, tabIdEspecifica = null) {
            try {
                if (typeof chrome === 'undefined') return;
                const cfg = config || (this._obterConfig ? await this._obterConfig() : {});
                const estado = estadoParam || await this.obterOuIniciarEstadoTrabalhoHoje();
                let nuvemMeta = null;
                try {
                    if (chrome.storage && chrome.storage.local) {
                        const metaRes = await chrome.storage.local.get(['jusgovProdNuvemMeta']);
                        if (metaRes && metaRes.jusgovProdNuvemMeta) nuvemMeta = metaRes.jusgovProdNuvemMeta;
                    }
                } catch (_) { }
                const agoraSync = Date.now();
                const rec = this.reconciliarEstadoPomodoroAoVivo(estado, agoraSync, cfg);
                if (rec && rec.alterouEstado && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.set({ jusgovTrabalhoEstado: estado }).catch(() => { });
                }
                this.aplicarIndicadoresChromeAction(cfg, estado, nuvemMeta, agoraSync);

                if (!chrome.tabs || !chrome.scripting) return;
                const estadoBarraGlobal = await this.obterEstadoGlobalBarraPomodoro();
                const snapBase = this.construirSnapshotExternoPomodoro(estado, cfg, nuvemMeta, estadoBarraGlobal, agoraSync, false);

                let abas = [];
                if (typeof tabIdEspecifica === 'number' && tabIdEspecifica > 0) {
                    const abaUnica = await chrome.tabs.get(tabIdEspecifica).catch(() => null);
                    if (abaUnica) abas = [abaUnica];
                } else if (tabIdEspecifica === 'todas') {
                    abas = await chrome.tabs.query({}).catch(() => []);
                } else {
                    abas = await chrome.tabs.query({ active: true }).catch(() => []);
                }

                let focusedWinId = null;
                if (chrome.windows && typeof chrome.windows.getLastFocused === 'function') {
                    const winFoc = await chrome.windows.getLastFocused().catch(() => null);
                    if (winFoc && winFoc.id) focusedWinId = winFoc.id;
                }

                const fnInjecao = this.obterFuncaoInjecaoBarraPomodoro();
                for (let aIdx = 0; aIdx < abas.length; aIdx++) {
                    const aba = abas[aIdx];
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    const permitirBeep = Boolean(snapBase.paramsBeep.ativo && aba.active !== false && (focusedWinId ? aba.windowId === focusedWinId : aIdx === 0));
                    const cfgAba = Object.assign({}, snapBase.cfgExib, { permitirBeep });

                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: fnInjecao,
                        args: [cfgAba, snapBase.resumoPomodoro, snapBase.estadoBarra]
                    }).catch(() => { });
                }
            } catch (_) { }
        }

        /**
         * Localiza uma guia ativa do Google Gemini (ou cria nova aba) e injeta o prompt F1 com seguranca.
         * @param {Object} msg
         * @param {Object} [chromeApi]
         */
        async abrirAssistenteIaLateral(msg = {}, chromeApi = (typeof chrome !== 'undefined' ? chrome : null)) {
            const apiChrome = chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
            if (!apiChrome || !apiChrome.tabs) return false;

            const preencherPromptGemini = (textoPrompt) => {
                const tentarPreenchimento = (tentativa) => {
                    const editavel = document.querySelector('rich-textarea p, rich-textarea div[contenteditable="true"], div.ql-editor, textarea, rich-textarea div[role="textbox"]');
                    if (editavel) {
                        editavel.focus();
                        let inseriu = false;
                        try { inseriu = document.execCommand('insertText', false, textoPrompt); } catch (_) { }
                        if (!inseriu || (editavel.textContent || '').trim().length === 0) {
                            if (editavel.tagName === 'TEXTAREA' || editavel.tagName === 'INPUT') {
                                editavel.value = textoPrompt;
                            } else {
                                editavel.textContent = textoPrompt;
                            }
                        }
                        try {
                            editavel.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                            editavel.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        } catch (_) { }
                    } else if (tentativa < 20) {
                        setTimeout(() => tentarPreenchimento(tentativa + 1), 350);
                    }
                };
                tentarPreenchimento(0);
            };

            try {
                const abasGemini = await apiChrome.tabs.query({ url: '*://gemini.google.com/*' });
                let abaAlvoId = null;
                let abaAlvoWindowId = null;
                let ehNovaAba = false;

                if (abasGemini && abasGemini.length > 0 && abasGemini[0].id) {
                    const abaAlvo = abasGemini[0];
                    abaAlvoId = abaAlvo.id;
                    abaAlvoWindowId = abaAlvo.windowId;
                    await apiChrome.tabs.update(abaAlvoId, { active: true });
                    if (abaAlvoWindowId && apiChrome.windows) {
                        await apiChrome.windows.update(abaAlvoWindowId, { focused: true });
                    }
                } else {
                    const novaAba = await apiChrome.tabs.create({ url: 'https://gemini.google.com/app', active: true });
                    abaAlvoId = novaAba.id;
                    ehNovaAba = true;
                }

                let promptTxt = (typeof msg.prompt === 'string' && msg.prompt.trim().length > 0) ? msg.prompt : '';
                if (!promptTxt && (msg.acao === 'ABRIR_PAINEL_F1_GEMINI' || msg.texto !== undefined)) {
                    const config = this._obterConfig ? await this._obterConfig() : {};
                    const padraoCfg = (typeof self !== 'undefined' && self.JusGovCfgDefaults && typeof self.JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO === 'string')
                        ? self.JusGovCfgDefaults.PROMPT_F1_GEMINI_PADRAO
                        : "'{{TEXTO}}' :  [SE_NORMATIVO] Transcrever os normativos aplicaveis; [SE_TEXTO_COMUM] Identificar e transcrever de forma condensada as leis aplicaveis ao caso e aplica-las a frase; Explicar de forma sucinta e bem condensada; Apontar jurisprudencias superiores a respeito;";
                    const template = (config && typeof config.promptF1Gemini === 'string' && config.promptF1Gemini.trim().length > 0)
                        ? config.promptF1Gemini
                        : padraoCfg;
                    const limpo = String(msg.texto || '').trim();
                    if (template.includes('{{TEXTO}}')) {
                        promptTxt = template.replace(/\{\{TEXTO\}\}/g, limpo);
                    } else if (template.includes('{SELECAO}')) {
                        promptTxt = template.replace(/\{SELECAO\}/g, limpo);
                    } else {
                        promptTxt = (template + ' ' + limpo).trim();
                    }
                }

                if (abaAlvoId && promptTxt.trim().length > 0 && apiChrome.scripting) {
                    if (ehNovaAba) {
                        const listener = (tabId, mudanca) => {
                            if (tabId === abaAlvoId && mudanca.status === 'complete') {
                                apiChrome.tabs.onUpdated.removeListener(listener);
                                setTimeout(async () => {
                                    try {
                                        await apiChrome.scripting.executeScript({
                                            target: { tabId: abaAlvoId },
                                            func: preencherPromptGemini,
                                            args: [promptTxt]
                                        });
                                    } catch (_) { }
                                }, 500);
                            }
                        };
                        apiChrome.tabs.onUpdated.addListener(listener);
                        setTimeout(() => {
                            try { apiChrome.tabs.onUpdated.removeListener(listener); } catch (_) { }
                        }, 20000);
                    } else {
                        try {
                            await apiChrome.scripting.executeScript({
                                target: { tabId: abaAlvoId },
                                func: preencherPromptGemini,
                                args: [promptTxt]
                            });
                        } catch (_) { }
                    }
                }
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    Object.freeze(ModuloProdutividade.prototype);
    Object.freeze(ModuloProdutividade);

    return ModuloProdutividade;
}));
