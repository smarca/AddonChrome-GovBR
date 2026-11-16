/* ==========================================================================
 * Nome do arquivo: mod-produt.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Produtividade: Tempo de Trabalho & Pomodoro
 * AUTOR/CONTATO: smarca@gmail.com
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

    class ModuloProdutividade {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
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
                pomodoroBadgeVerdeAteTs: 0,
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
         * Resolve o estágio de proteção do descanso e a mensagem de advertência dourada (FEAT-51).
         * - 0 (0..25%): zera e reinicia em qualquer interação.
         * - 1 (>25..50%): "Descanso Necessário!" (regride tempo enquanto ativo).
         * - 2 (>50..75%): "Descanso em Andamento?" (trava valor enquanto ativo).
         * - 3 (>75%): "Finalizando Descanso..." (movimento/1 clique não trava nem interrompe).
         * Cada 3 cliques/teclas rebaixa 1 estágio.
         * @param {number} [pct]
         * @param {number} [cliquesPenalidade]
         * @returns {{ estagioNatural: number, rebaixamentos: number, estagioEfetivo: number, mensagemAviso: string }}
         */
        resolverEstagioDescanso(pct = 0, cliquesPenalidade = 0) {
            const estagioNatural = (pct > 0.75) ? 3 : ((pct > 0.50) ? 2 : ((pct > 0.25) ? 1 : 0));
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
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 25));
            const proporcao = Number(config && config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            const metaFaseMin = fase === 'pausa_maior' ? pausaMaiorMin : (fase === 'alivio' ? alivioMin : focoMin);
            const metaFaseMs = metaFaseMin * 60000;

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
                    const estAtiv = this.resolverEstagioDescanso(pctAtiv, cliques);
                    if (estAtiv.estagioEfetivo === 3) {
                        acumulado += dtAtivo;
                    } else if (estAtiv.estagioEfetivo === 2) {
                        /* Trava o valor no estágio 2 (>= 50%) */
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
                    const estMovPre = this.resolverEstagioDescanso(pctMovPre, cliques);
                    if (!(agora < atividadeAteTs && ultimoTipoInteracao === 'click_ou_tecla') && estMovPre.rebaixamentos === 0) {
                        ultimoTipoInteracao = 'movimento';
                    }
                }
                const pctAgora = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
                const estAgora = this.resolverEstagioDescanso(pctAgora, cliques);
                if (estAgora.estagioEfetivo === 0) {
                    acumulado = 0;
                    cliques = 0;
                    ultimoCliqueTs = 0;
                    atividadeAteTs = 0;
                    syncTs = 0;
                    ultimoTipoInteracao = '';
                    resetouDescanso = true;
                } else {
                    atividadeAteTs = agora + 2500;
                    syncTs = agora;
                }
            } else if (opcoes && opcoes.mutar && !resetouDescanso && (syncTs > 0 || atividadeAteTs > 0 || cliques > 0)) {
                syncTs = agora;
            }

            const pctFinal = metaFaseMs > 0 ? (acumulado / metaFaseMs) : 0;
            const estFinal = this.resolverEstagioDescanso(pctFinal, cliques);
            const emAtividade = Boolean(agora < atividadeAteTs);
            const emAviso = Boolean(!estado.pomodoroDescansoMinCumprido && (emAtividade || estFinal.rebaixamentos > 0) && estFinal.estagioEfetivo >= 1);
            if (!emAtividade && estFinal.rebaixamentos === 0) {
                ultimoTipoInteracao = '';
            }
            const mensagemAviso = emAviso ? estFinal.mensagemAviso : '';
            const minutosCalc = Math.floor(acumulado / 60000);
            const aguardandoOciosidade = Boolean(acumulado < 10000 && minutosCalc === 0 && (syncTs > 0 ? true : minNaFaseIni === 0));
            const restanteMs = aguardandoOciosidade ? metaFaseMs : Math.max(0, metaFaseMs - acumulado);
            const segRestantes = aguardandoOciosidade ? (metaFaseMin * 60) : Math.max(0, Math.ceil(restanteMs / 1000));
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
                    estado.pomodoroFaseInicioTs = agora;
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
                    estado.pomodoroDescansoMinCumprido = true;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = Math.min(agora, Number(checkCumprido.terminaEmTs || agora));
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
                    /* Qualquer interacao sensivel (mouse move, click ou tecla) apos concluir o descanso inicia o Foco, dispensando tempo extra */
                    const ehMovimento = (tipoInteracao === 'movimento');
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = agora;
                    estado.pomodoroBadgeVerdeAteTs = ehMovimento ? (agora + 15000) : 1;
                    iniciouBadgeVerde = ehMovimento;
                    ocultouBadgeVerde = !ehMovimento;
                    estado.pomodoroFase = 'foco';
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroFaseInicioTs = agora;
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
                    if (estado.pomodoroPularProximoPopupFoco) {
                        estado.pomodoroPularProximoPopupFoco = false;
                        estado.pomodoroBarraOcultadaChave = `foco:${(estado.pomodoroCicloAtual || 0) + 1}:${agora}`;
                    } else {
                        estado.pomodoroBarraOcultadaChave = '';
                    }
                    return { resetouDescanso: true, iniciouFocoPosDescanso: true, iniciouBadgeVerde, ocultouBadgeVerde, alterouDescanso: true };
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
                leftAncoradoPx: leftAncBruto
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
                if (!d.aguardandoOciosidade && (concluido || agora >= ativAte)) {
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
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 25));
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
            const aguardandoOciosidade = Boolean(emDescanso && progDescanso && progDescanso.aguardandoOciosidade);
            const terminaEmTs = emDescanso
                ? progDescanso.terminaEmTs
                : (inicioFaseTs + metaFaseMin * 60000);
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
            const horaFimDescanso = ultimoDescansoFimTs > 0 ? this.formatarHoraHHMM(ultimoDescansoFimTs) : '';
            const ultimoDescansoTexto = (ultimoDescansoTipo && horaFimDescanso)
                ? `${ultimoDescansoTipo === 'pausa_maior' ? 'Descanso' : 'Alívio'} realizado às ${horaFimDescanso}hs`
                : '';
            const descansoRealizado = Boolean((ultimoDescansoTexto || descansoMinCumprido) && !descansoPendente);
            const faseLabel = fase === 'pausa_maior' ? 'Descanso Maior' : (fase === 'alivio' ? 'Alívio' : 'Foco');

            return {
                ativo,
                fase,
                faseLabel,
                focoMin,
                alivioMin,
                pausaMaiorMin,
                cicloConcluido,
                cicloAtual,
                ciclosMax,
                minutosNaFase,
                metaFaseMin,
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
                ultimoDescansoTexto,
                ultimaAtividadeTs: ultimaAtivTs,
                badgeVerdeAteTs: Number(estado.pomodoroBadgeVerdeAteTs || 0),
                descansoAcumuladoMs: progDescanso ? progDescanso.acumuladoMs : 0,
                descansoSyncTs: progDescanso ? progDescanso.syncTs : 0,
                descansoAtividadeAteTs: progDescanso ? progDescanso.atividadeAteTs : 0,
                descansoCliquesPenalidade: progDescanso ? progDescanso.cliquesPenalidade : 0,
                descansoUltimoCliqueTs: progDescanso ? progDescanso.ultimoCliqueTs : 0,
                descansoEstagioEfetivo: progDescanso ? progDescanso.estagioEfetivo : 0,
                descansoAvisoTexto: progDescanso ? progDescanso.mensagemAviso : '',
                descansoEmAviso: progDescanso ? progDescanso.emAviso : false,
                descansoUltimoTipoInteracao: progDescanso ? progDescanso.ultimoTipoInteracao : ''
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
            const { stEfetivo, meta, inicioCombinado, corridoTotalMin, ativoTotalMin, pausasTotais } = this.mesclarEstadoComNuvemMeta(estado, nuvemMeta, agora);

            let dataBR = '';
            if (typeof stEfetivo.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stEfetivo.data)) {
                const [ano, mes, dia] = stEfetivo.data.split('-');
                dataBR = `${dia}/${mes}/${ano}`;
            } else {
                const d = new Date(agora);
                dataBR = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }

            const horaInicio = this.formatarHoraHHMM(inicioCombinado);
            const linhaDataInicio = `🕒 Ligado ${dataBR}${horaInicio ? ` desde ${horaInicio}hs` : ''}`;

            const fmtHM = (min) => {
                const m = Math.max(0, Math.floor(Number(min) || 0));
                return `${String(Math.floor(m / 60)).padStart(2, '0')}h:${String(m % 60).padStart(2, '0')}m`;
            };

            const partesTempo = [];
            if (corridoTotalMin > 0) partesTempo.push(`Corrido ${fmtHM(corridoTotalMin)}`);
            if (ativoTotalMin > 0 && ativoTotalMin !== corridoTotalMin) partesTempo.push(`Ativo ${fmtHM(ativoTotalMin)}`);
            if (pausasTotais > 0) partesTempo.push(`Pausas ${pausasTotais}`);
            const linhaTempos = partesTempo.length > 0 ? `👉 ${partesTempo.join(' • ')}` : '';

            const resumo = this.calcularResumoPomodoro(stEfetivo, config, agora, meta);
            const segmentosPomodoro = [];
            let linhaPomodoro = '';
            if (resumo.ativo) {
                const focoParte = resumo.fase === 'foco' ? `${resumo.minutosNaFase}/${resumo.focoMin}` : `${resumo.focoMin}/${resumo.focoMin}`;
                segmentosPomodoro.push({ texto: `🍅 Pomodoro: Foco ${focoParte} min`, destaque: 'foco' });
                if (resumo.fase === 'alivio') {
                    segmentosPomodoro.push({ texto: `Alívio em andamento: ${resumo.minutosNaFase}/${resumo.alivioMin} min`, destaque: 'descanso' });
                } else if (resumo.fase === 'pausa_maior') {
                    segmentosPomodoro.push({ texto: `Descanso em andamento: ${resumo.minutosNaFase}/${resumo.pausaMaiorMin} min`, destaque: 'descanso' });
                }
                segmentosPomodoro.push({ texto: `Ciclo ${resumo.cicloAtual}/${resumo.ciclosMax}`, destaque: 'normal' });
                if (resumo.descansoPendente) {
                    segmentosPomodoro.push({ texto: 'Descanso do ciclo: Pendente', destaque: 'pendente' });
                } else if (resumo.ultimoDescansoTexto) {
                    segmentosPomodoro.push({ texto: `${resumo.ultimoDescansoTexto}`, destaque: 'realizado' });
                }
                linhaPomodoro = segmentosPomodoro.map(s => s.texto).join(' • ');
            }

            const alertaMultiplosComputadores = (meta && meta.multiplosComputadoresSimultaneos)
                ? '⚠️ Múltiplos computadores em uso simultâneo.'
                : '';

            const tooltipTitle = [linhaDataInicio, linhaTempos, linhaPomodoro, alertaMultiplosComputadores]
                .filter(Boolean)
                .join('\n');
            return {
                dataBR,
                horaInicio,
                linhaDataInicio,
                linhaTempos,
                linhaPomodoro,
                segmentosPomodoro,
                alertaMultiplosComputadores,
                tooltipTitle
            };
        }

        /**
         * Renderizador DOM compartilhado entre Popup, Opções e demais telas (SRP / Reúso UI).
         * Constrói linhas empilhadas com .textContent seguro (zero innerHTML):
         * Linha 1: 🕒 Data desde HH:MMhs | Linha 2: 👉 Tempo Corrido ... | Linha 3 (opcional): 🍅 Pomodoro ...
         * + Alerta condicional: ⚠️ Múltiplos computadores em uso simultâneo.
         * @param {HTMLElement|null} containerPrincipal
         * @param {Object} [estado]
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {{ containerPomodoro?: HTMLElement|null, ocultarPomodoroQuandoInativo?: boolean, nuvemMeta?: Object|null }} [opcoes]
         */
        renderizarResumoProdutividadeDom(containerPrincipal, estado = {}, config = {}, agora = Date.now(), opcoes = {}) {
            if (!containerPrincipal || typeof document === 'undefined') return null;
            const nuvemMeta = (opcoes && opcoes.nuvemMeta) ? opcoes.nuvemMeta : null;
            const info = this.formatarResumoProdutividadeTexto(estado, config, agora, nuvemMeta);

            const divData = document.createElement('div');
            divData.textContent = info.linhaDataInicio;
            const nosTrabalho = [divData];
            if (info.linhaTempos) {
                const divTempos = document.createElement('div');
                divTempos.style.marginTop = '2px';
                divTempos.textContent = info.linhaTempos;
                nosTrabalho.push(divTempos);
            }

            const construirLinhaPomodoro = (destinoEl) => {
                if (!destinoEl) return;
                if (info.segmentosPomodoro.length === 0) {
                    destinoEl.replaceChildren();
                    if (opcoes && opcoes.ocultarPomodoroQuandoInativo) {
                        destinoEl.style.display = 'none';
                    }
                    return;
                }
                const filhos = [];
                for (let i = 0; i < info.segmentosPomodoro.length; i++) {
                    if (i > 0) {
                        const sep = document.createElement('span');
                        sep.textContent = '•';
                        sep.style.opacity = '0.5';
                        filhos.push(sep);
                    }
                    const seg = info.segmentosPomodoro[i];
                    const sp = document.createElement('span');
                    sp.textContent = seg.texto;
                    if (seg.destaque === 'foco') sp.style.cssText = 'font-weight:600;';
                    else if (seg.destaque === 'descanso') sp.style.cssText = 'font-weight:600;color:#0284c7;';
                    else if (seg.destaque === 'pendente') sp.style.cssText = 'font-weight:700;color:#dc2626;';
                    else if (seg.destaque === 'realizado') sp.style.cssText = 'font-weight:700;color:#0d9488;';
                    filhos.push(sp);
                }
                destinoEl.replaceChildren(...filhos);
                if (opcoes && opcoes.containerPomodoro) {
                    destinoEl.style.display = 'flex';
                }
            };

            const appendAlertaSimultaneo = (nosDestino) => {
                if (!info.alertaMultiplosComputadores) return;
                const divAlerta = document.createElement('div');
                divAlerta.setAttribute('data-jusgov-alerta-simultaneo', 'true');
                divAlerta.style.cssText = 'margin-top:3px;color:#b45309;font-weight:700;font-size:11px;';
                divAlerta.textContent = info.alertaMultiplosComputadores;
                nosDestino.push(divAlerta);
            };

            const contPom = (opcoes && opcoes.containerPomodoro) ? opcoes.containerPomodoro : null;
            if (contPom) {
                construirLinhaPomodoro(contPom);
                appendAlertaSimultaneo(nosTrabalho);
                containerPrincipal.replaceChildren(...nosTrabalho);
            } else {
                if (info.segmentosPomodoro.length > 0) {
                    const divPom = document.createElement('div');
                    divPom.style.cssText = 'margin-top:2px;display:flex;flex-wrap:wrap;align-items:center;gap:5px;';
                    construirLinhaPomodoro(divPom);
                    nosTrabalho.push(divPom);
                }
                appendAlertaSimultaneo(nosTrabalho);
                containerPrincipal.replaceChildren(...nosTrabalho);
            }
            return info;
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
                pomodoroUltimoDescansoFimTs: Number(estado.pomodoroUltimoDescansoFimTs || 0)
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
                                pomodoroUltimoDescansoFimTs: Math.max(Number(localEstado.pomodoroUltimoDescansoFimTs || 0), Number(estMeuNuvem.pomodoroUltimoDescansoFimTs || 0))
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
            const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 25));
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
            const focoMin = Math.max(25, Number((config && config.pomodoroFocoMinutos) || resumo.focoMin || 25));
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

            if (usuarioAtivoNaJanela && !estado.emPausa) {
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
                estado.pausasConfirmadas = Number(estado.pausasConfirmadas || 0) + 1;
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
            estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
            estado.pomodoroMinutosNaFase = Math.floor(idlePrevioMs / 60000);
            estado.pomodoroFaseInicioTs = agora;
            estado.pomodoroFocoPausadoMs = 0;
            estado.pomodoroPausaInicioTs = 0;
            estado.pomodoroDescansoMinCumprido = false;
            estado.pomodoroDescansoRealizadoNoCiclo = false;
            estado.pomodoroDescansoPendente = true;
            estado.pomodoroBarraOcultadaChave = '';
            estado.pomodoroDescansoAcumuladoMs = idlePrevioMs;
            estado.pomodoroDescansoSyncTs = agora;
            estado.pomodoroDescansoAtividadeAteTs = 0;
            estado.pomodoroDescansoCliquesPenalidade = 0;
            estado.pomodoroDescansoUltimoCliqueTs = 0;
            estado.pomodoroDescansoUltimoTipoInteracao = '';
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
                        iniciouDescansoReal = true;
                    }
                }
            }

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                const prog = this.calcularProgressoDescanso(estado, agora, config, { mutar: false });
                const resumoAtual = this.calcularResumoPomodoro(estado, config, agora, null);
                const chaveFase = `${resumoAtual.fase}:${resumoAtual.cicloAtual}:${resumoAtual.faseInicioTs}`;

                if (prog.aguardandoOciosidade && prefs.usarModal && !estado.pomodoroDescansoMinCumprido && estado.pomodoroModalExibidoChave !== chaveFase && estado.pomodoroModalDescansoChave !== chaveFase) {
                    estado.pomodoroModalDescansoChave = chaveFase;
                    alterouEstado = true;
                }
                if (!prog.aguardandoOciosidade && estado.pomodoroModalDescansoChave) {
                    estado.pomodoroModalExibidoChave = chaveFase;
                    estado.pomodoroModalDescansoChave = '';
                    alterouEstado = true;
                    iniciouDescansoReal = true;
                }
                if (!estado.pomodoroDescansoMinCumprido && prog.acumuladoMs >= prog.metaFaseMs) {
                    estado.pomodoroDescansoMinCumprido = true;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = Math.min(agora, Number(prog.terminaEmTs || agora));
                    estado.pomodoroModalExibidoChave = chaveFase;
                    estado.pomodoroModalDescansoChave = '';
                    alterouEstado = true;
                    concluiuDescanso = true;
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
            const focoOcultadoGlobal = (resumo.fase === 'foco' && estado.pomodoroBarraOcultadaChave === chaveFaseAtual);
            const ativoPorConfig = Boolean(resumo.ativo && prefs.modoBarra !== 'nunca');
            const deveMostrarBarraBase = Boolean(
                ativoPorConfig &&
                !focoOcultadoGlobal &&
                (prefs.modoBarra === 'sempre' || (prefs.modoBarra === 'descanso' && (resumo.emDescanso || resumo.descansoPendente)))
            );
            const modalAtivoAgora = Boolean(
                resumo.ativo &&
                prefs.usarModal &&
                resumo.emDescanso &&
                resumo.aguardandoOciosidade &&
                !resumo.descansoMinCumprido &&
                estado.pomodoroModalExibidoChave !== chaveFaseAtual &&
                estado.pomodoroModalDescansoChave === chaveFaseAtual
            );
            const modalDados = modalAtivoAgora ? this.obterDadosModalDescanso(resumo, cfg) : null;
            const nivelCfgFallback = (cfg && cfg.pomodoroEstiloMinipopup === 'normal') ? 1 : ((cfg && cfg.pomodoroEstiloMinipopup === 'expandido') ? 2 : 0);
            const estadoBarraEfetivo = (estadoBarraGlobal && typeof estadoBarraGlobal === 'object' && estadoBarraGlobal.nivelDetalhe === undefined)
                ? { ...estadoBarraGlobal, nivelDetalhe: nivelCfgFallback }
                : estadoBarraGlobal;
            const cfgExib = {
                ativoPorConfig,
                deveExibirNormal: deveMostrarBarraBase,
                focoOcultadoGlobal,
                modoBarra: prefs.modoBarra,
                beepAtivo: paramsBeep.ativo,
                beepIntensidade: paramsBeep.intensidade,
                beepIntervaloMs: paramsBeep.intervaloMs,
                permitirBeep: Boolean(paramsBeep.ativo && permitirBeep),
                deveExibirModalDescanso: modalAtivoAgora,
                modalDados,
                tooltipTexto: infoTooltip.tooltipTitle || '',
                agoraServidor: agoraSync
            };
            return { agoraServidor: agoraSync, resumoPomodoro: resumo, prefs, paramsBeep, cfgExib, estadoBarra: estadoBarraEfetivo };
        }

        avancarMinutoPomodoro(estado, agora = Date.now(), config = {}) {
            const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 25));
            const proporcao = Number(config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));

            const autoRes = this.registrarPausasAutomaticasProdutividade(estado, agora, config);
            if (autoRes.creditado) {
                return { evento: null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
            }

            const msInativo = Math.max(0, agora - Number(estado.ultimaAtividadeTs || agora));
            const minInativo = Math.floor(msInativo / 60000);

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                if (estado.pomodoroDescansoMinCumprido) {
                    estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
                } else if (Number(estado.pomodoroDescansoSyncTs || 0) > 0) {
                    this.calcularProgressoDescanso(estado, agora, config, { mutar: true });
                    estado.pomodoroMinutosNaFase = Math.floor(Number(estado.pomodoroDescansoAcumuladoMs || 0) / 60000);
                } else if (minInativo < 1) {
                    /* BUG-70: Usuário continuou trabalhando antes de 25% -> aguarda idle e reinicia contagem do descanso */
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroFaseInicioTs = agora;
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
                        estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                        estado.pomodoroUltimoDescansoFimTs = agora;
                        if (acabouDeCumprir) estado.pomodoroBadgeVerdeAteTs = 0;
                        return { evento: 'promovido_pausa_maior', descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                    if (estado.pomodoroMinutosNaFase >= alivioMin) {
                        const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'alivio';
                        estado.pomodoroUltimoDescansoFimTs = agora;
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
                    estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                    estado.pomodoroUltimoDescansoFimTs = agora;
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
                const res = this.avancarMinutoEstadoTrabalho(estado, agora, config);

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
                if (pomodoroAtivo && prefsAviso.usarModal) {
                    if (evPom.evento === 'inicio_pausa_maior') {
                        estado.pomodoroModalDescansoChave = chaveFaseTick;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Hora da Pausa Maior!',
                            `Você concluiu ${evPom.ciclosMax} ciclos de foco (${evPom.focoMin} min cada). Descanse por ${evPom.pausaMaiorMin} minutos.`,
                            `Proporção ${evPom.proporcao}:1 • Pausa Maior de ${evPom.pausaMaiorMin} min`
                        );
                    } else if (evPom.evento === 'inicio_alivio') {
                        estado.pomodoroModalDescansoChave = chaveFaseTick;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Hora do Alívio!',
                            `Ciclo ${estado.pomodoroCicloAtual}/${evPom.ciclosMax} concluído (${evPom.focoMin} min). Faça uma pausa de ${evPom.alivioMin} minutos.`,
                            `Proporção ${evPom.proporcao}:1 • Alívio de ${evPom.alivioMin} min`
                        );
                    } else if (evPom.evento === 'fim_alivio') {
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Fim do Alívio',
                            `Retome o foco para o ciclo ${estado.pomodoroCicloAtual + 1}/${evPom.ciclosMax} (${evPom.focoMin} min).`,
                            'Descanso realizado!'
                        );
                    } else if (evPom.evento === 'fim_pausa_maior') {
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Fim da Pausa Maior',
                            `Novo bloco de ${evPom.ciclosMax} ciclos iniciado (${evPom.focoMin} min de foco).`,
                            'Descanso completo realizado!'
                        );
                    }
                }
                /* Se o descanso realmente já iniciou (não aguarda mais 10s idle), encerra o modal de todas as guias e não exibe mais neste ciclo */
                if (resumoTick.emDescanso && !resumoTick.aguardandoOciosidade && estado.pomodoroModalDescansoChave) {
                    estado.pomodoroModalExibidoChave = chaveFaseTick;
                    estado.pomodoroModalDescansoChave = '';
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
            const txtBadge = (resumo.ativo && prefs.usarBadge)
                ? `${(resumo.descansoPendente && !resumo.emDescanso) ? '!' : ''}${Math.max(0, resumo.minutosRestantes)}m`
                : '';
            const badgeEst = this.resolverEstiloBadgePomodoro(resumo);
            const assinatura = `${txtBadge}|${badgeEst.cor}|${badgeEst.corTexto}|${infoTooltip.tooltipTitle}`;

            if (typeof chrome !== 'undefined' && chrome.action && this._ultimaAssinaturaAction !== assinatura) {
                this._ultimaAssinaturaAction = assinatura;
                if (chrome.action.setBadgeText) {
                    chrome.action.setBadgeText({ text: txtBadge }).catch(() => { });
                    if (txtBadge && chrome.action.setBadgeBackgroundColor) {
                        chrome.action.setBadgeBackgroundColor({ color: badgeEst.cor }).catch(() => { });
                    }
                    if (txtBadge && chrome.action.setBadgeTextColor) {
                        chrome.action.setBadgeTextColor({ color: badgeEst.corTexto }).catch(() => { });
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
                            const idModal = 'jusgov-modal-produtividade-trabalho';

                            const removerBackdropBlur = () => {
                                const bd = document.getElementById(idBackdrop);
                                if (bd) bd.remove();
                            };
                            const garantirBackdropBlur = () => {
                                if (document.hidden) {
                                    removerBackdropBlur();
                                    return;
                                }
                                let bd = document.getElementById(idBackdrop);
                                if (!bd) {
                                    bd = document.createElement('div');
                                    bd.id = idBackdrop;
                                    bd.setAttribute('data-jusgov-ignore', 'true');
                                    bd.style.cssText = 'position:fixed !important;inset:0 !important;z-index:2147483646 !important;background:rgba(15,23,42,0.72) !important;backdrop-filter:blur(4px) !important;pointer-events:none !important;margin:0 !important;padding:0 !important;';
                                    (document.body || document.documentElement).appendChild(bd);
                                }
                            };

                            const gerenciarModalDescanso = (exibir, dadosM) => {
                                const existente = document.getElementById(idModal);
                                if (!exibir || !dadosM) {
                                    if (existente) existente.remove();
                                    return;
                                }
                                if (existente) return;
                                const overlay = document.createElement('div');
                                overlay.id = idModal;
                                overlay.setAttribute('role', 'dialog');
                                overlay.setAttribute('aria-modal', 'true');
                                overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';
                                const card = document.createElement('div');
                                card.style.cssText = 'background:#ffffff;color:#0f172a;border-radius:14px;padding:24px 28px;max-width:440px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,0.35);border:2px solid #0d9488;text-align:center;';
                                const h2 = document.createElement('h2');
                                h2.textContent = dadosM.titulo || '';
                                h2.style.cssText = 'margin:0 0 10px 0;font-size:20px;font-weight:700;color:#0d9488;';
                                const p = document.createElement('p');
                                p.textContent = dadosM.mensagem || '';
                                p.style.cssText = 'margin:0 0 10px 0;font-size:15px;line-height:1.5;color:#1e293b;';
                                const sub = document.createElement('p');
                                sub.textContent = dadosM.subtitulo || '';
                                sub.style.cssText = 'margin:0 0 18px 0;font-size:12px;color:#64748b;';
                                const btn = document.createElement('button');
                                btn.type = 'button';
                                btn.textContent = 'Entendi / Fechar';
                                btn.style.cssText = 'background:#0d9488;color:#ffffff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;';
                                const onEscModal = (evM) => {
                                    if (evM.key === 'Escape') fecharModalLocal(true);
                                };
                                const fecharModalLocal = (propagarGlobal = true) => {
                                    overlay.remove();
                                    document.removeEventListener('keydown', onEscModal, true);
                                    if (propagarGlobal) {
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({ acao: 'FECHAR_MODAL_PRODUTIVIDADE_GLOBAL' }).catch(() => { });
                                            }
                                        } catch (_) { }
                                    }
                                };
                                btn.addEventListener('click', () => fecharModalLocal(true));
                                overlay.addEventListener('click', (evM) => { if (evM.target === overlay) fecharModalLocal(true); });
                                document.addEventListener('keydown', onEscModal, true);
                                card.appendChild(h2);
                                card.appendChild(p);
                                if (dadosM.subtitulo) card.appendChild(sub);
                                card.appendChild(btn);
                                overlay.appendChild(card);
                                (document.body || document.documentElement).appendChild(overlay);
                            };

                            const destruirHost = (h) => {
                                removerBackdropBlur();
                                if (!h) return;
                                if (h.__jusgovScreensaverRaf) {
                                    cancelAnimationFrame(h.__jusgovScreensaverRaf);
                                    h.__jusgovScreensaverRaf = 0;
                                }
                                if (h.__jusgovTimerInterval) clearInterval(h.__jusgovTimerInterval);
                                if (h.__jusgovTimerRetorno) clearTimeout(h.__jusgovTimerRetorno);
                                if (typeof h.__jusgovCleanupListeners === 'function') {
                                    try { h.__jusgovCleanupListeners(); } catch (_) { }
                                }
                                h.remove();
                            };

                            gerenciarModalDescanso(Boolean(cfgExib && cfgExib.deveExibirModalDescanso), cfgExib && cfgExib.modalDados);

                            /* FEAT-39: Singleton estrito (apenas 1 minipopup por guia, podando eventuais duplicatas de corrida) */
                            const existentes = Array.from(document.querySelectorAll('#jusgov-pomodoro-barra-global, [data-jusgov-pomodoro-bar="true"]'));
                            let host = existentes[0] || null;
                            for (let dIdx = 1; dIdx < existentes.length; dIdx++) {
                                destruirHost(existentes[dIdx]);
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
                                    : ((eb && (eb.alinhamento === 'centro' || eb.alinhamento === 'direita')) ? eb.alinhamento : 'esquerda')
                            });

                            const resolverPermissaoExibicao = (hRef, cExib, dRes) => {
                                const chave = `${dRes.fase}:${dRes.cicloAtual}:${dRes.faseInicioTs}`;
                                let fechadaNaGuia = false;
                                try {
                                    fechadaNaGuia = Boolean(dRes.emDescanso && sessionStorage.getItem('jusgovPomodoroBarraFechadaFaseTab') === chave);
                                } catch (_) { }
                                const deveExibir = Boolean(
                                    cExib && cExib.ativoPorConfig &&
                                    !fechadaNaGuia && cExib.deveExibirNormal
                                );
                                return { deveExibir, chave };
                            };

                            const obterModoPosicaoEspecial = (d, agoraNow = Date.now()) => {
                                if (d && d.emDescanso) {
                                    const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
                                    const concluido = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);
                                    if (!concluido && d.descansoEmAviso) {
                                        return (d.descansoUltimoTipoInteracao === 'movimento') ? 'aviso_movimento_centro_blur' : 'aviso_topo_centro';
                                    }
                                    const ativAte = Number(d.descansoAtividadeAteTs || 0);
                                    if (!d.aguardandoOciosidade && (concluido || (!d.descansoRealizado && agoraNow >= ativAte))) return 'idle_centro_tela';
                                }
                                return 'padrao';
                            };

                            const exibInicial = resolverPermissaoExibicao(host, cfgExib, dadosResumo);
                            if (!exibInicial.deveExibir) {
                                destruirHost(host);
                                return;
                            }

                            /* Posicionamento estrito em 6 posições coladas às bordas (0px sem espaços, usando top:0/bottom:0 e clientWidth/clientHeight) */
                            const aplicarPosicao = (h, posVertVal, alinhVal, leftLivre = null, topLivre = null) => {
                                if (!h) return;
                                const docEl = document.documentElement;
                                const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                if (leftLivre !== null && topLivre !== null && Number.isFinite(Number(leftLivre)) && Number.isFinite(Number(topLivre))) {
                                    const uiRef = h.__jusgovUI;
                                    const rectPill = (uiRef && uiRef.pill && typeof uiRef.pill.getBoundingClientRect === 'function')
                                        ? uiRef.pill.getBoundingClientRect() : null;
                                    const alturaPill = (rectPill && rectPill.height > 8) ? Math.ceil(rectPill.height) : 20;
                                    const largPill = (rectPill && rectPill.width > 20) ? Math.ceil(rectPill.width) : 80;
                                    const maxTop = Math.max(0, hTela - alturaPill);
                                    const maxLeft = Math.max(0, wTela - Math.min(wTela, largPill));
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
                                    h.style.setProperty('top', '50%', 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                    h.style.setProperty('left', '50%', 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
                                    h.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: Math.round(hTela / 2) };
                                    return;
                                }
                                const posVert = (posVertVal === 'inferior') ? 'inferior' : 'superior';
                                const alinh = (alinhVal === 'esquerda' || alinhVal === 'direita') ? alinhVal : 'centro';
                                if (posVert === 'inferior') {
                                    h.style.setProperty('top', 'auto', 'important');
                                    h.style.setProperty('bottom', '0px', 'important');
                                } else {
                                    h.style.setProperty('top', '0px', 'important');
                                    h.style.setProperty('bottom', 'auto', 'important');
                                }
                                h.__jusgovPos = { posicaoVertical: posVert, alinhamento: alinh, topPx: (posVert === 'inferior' ? Math.max(0, hTela - 20) : 0) };
                                if (alinh === 'esquerda') {
                                    h.style.setProperty('left', '0px', 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                } else if (alinh === 'direita') {
                                    h.style.setProperty('left', 'auto', 'important');
                                    h.style.setProperty('right', '0px', 'important');
                                    h.style.setProperty('transform', 'none', 'important');
                                } else {
                                    h.style.setProperty('left', '50%', 'important');
                                    h.style.setProperty('right', 'auto', 'important');
                                    h.style.setProperty('transform', 'translateX(-50%)', 'important');
                                }
                            };

                            const criarIconeSvgDiscreto = (tipo, cor) => {
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('width', '12');
                                svg.setAttribute('height', '12');
                                svg.setAttribute('viewBox', '0 0 16 16');
                                svg.setAttribute('fill', 'none');
                                svg.style.display = 'block';
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
                                } else {
                                    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    p.setAttribute('d', 'M9.8 2.2 13.8 6.2l-1.1 1.1-1-.3-2.5 2.5.4 2.1-1.1 1.1-2.2-2.2-3.1 3.1-.8-.8 3.1-3.1-2.2-2.2 1.1-1.1 2.1.4 2.5-2.5-.3-1 1.1-1.1z');
                                    p.setAttribute('fill', cor);
                                    svg.appendChild(p);
                                }
                                return svg;
                            };

                            const atualizarVisualBotaoFixar = (btn, modoFix, emModoDescansoConfig = false) => {
                                if (!btn) return;
                                btn.style.background = 'transparent';
                                btn.style.boxShadow = 'none';
                                btn.style.borderRadius = '3px';
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
                                host.style.cssText = 'position:fixed !important;top:0px !important;bottom:auto !important;left:0px !important;right:auto !important;transform:none !important;margin:0 !important;padding:0 !important;border:0 !important;line-height:1 !important;width:auto !important;height:auto !important;z-index:2147483647 !important;pointer-events:none !important;font-family:"Segoe UI",system-ui,-apple-system,sans-serif !important;transition:left 0.16s ease,right 0.16s ease,top 0.16s ease !important;';
                                const shadow = host.attachShadow({ mode: 'closed' });
                                const styleAnim = document.createElement('style');
                                styleAnim.textContent = '@keyframes jusgov-piscar-crono{0%,49%{opacity:1}50%,100%{opacity:0.22}}';
                                shadow.appendChild(styleAnim);
                                const pill = document.createElement('div');
                                pill.style.cssText = 'pointer-events:auto;display:inline-flex;flex-direction:column;align-items:stretch;gap:1px;padding:1px 6px;border-radius:7px;background:#0f172a;color:#f8fafc;font-size:11px;line-height:1.1;font-weight:600;box-shadow:0 4px 14px rgba(15,23,42,0.34);border:1px solid #0d9488;white-space:nowrap;cursor:grab;user-select:none;touch-action:none;margin:0;';
                                const linhaPrincipal = document.createElement('div');
                                linhaPrincipal.style.cssText = 'display:inline-flex;align-items:center;gap:5px;line-height:1.1;';
                                const spanFase = document.createElement('span');
                                spanFase.setAttribute('data-parte', 'fase');
                                spanFase.style.cssText = 'font-size:11px;line-height:1.1;';
                                const spanTempo = document.createElement('span');
                                spanTempo.setAttribute('data-parte', 'tempo');
                                spanTempo.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;font-size:11px;line-height:1.1;';
                                const spanStatus = document.createElement('span');
                                spanStatus.setAttribute('data-parte', 'status');
                                spanStatus.style.cssText = 'width:100%;box-sizing:border-box;text-align:center;padding:1px 5px;border-radius:4px;font-size:10px;line-height:1.15;font-weight:700;display:none;';
                                const btnFixar = document.createElement('button');
                                btnFixar.type = 'button';
                                btnFixar.style.cssText = 'background:transparent;border:none;line-height:1;cursor:pointer;padding:1px 2px;display:none;align-items:center;justify-content:center;';
                                const btnFechar = document.createElement('button');
                                btnFechar.type = 'button';
                                btnFechar.textContent = '×';
                                btnFechar.title = 'Ocultar durante o período Ativo (exibir só no Alívio/Descanso)';
                                btnFechar.style.cssText = 'background:transparent;border:none;color:#cbd5e1;font-size:13px;line-height:1;cursor:pointer;padding:0 2px;display:none;';
                                linhaPrincipal.appendChild(spanFase);
                                linhaPrincipal.appendChild(spanTempo);
                                linhaPrincipal.appendChild(btnFixar);
                                linhaPrincipal.appendChild(btnFechar);
                                pill.appendChild(linhaPrincipal);
                                pill.appendChild(spanStatus);
                                shadow.appendChild(pill);
                                host.__jusgovUI = { pill, linhaPrincipal, spanFase, spanTempo, spanStatus, btnFixar, btnFechar };
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

                                /* Zona segura geométrica cobrindo padding/gap dos controles (cadeado/pin e ×) */
                                const pontoEmControle = (x, y) => {
                                    const padSeg = 10;
                                    const rPill = pill.getBoundingClientRect();
                                    const rFixar = btnFixar.getBoundingClientRect();
                                    const rFechar = btnFechar.getBoundingClientRect();
                                    const dentroY = (rPill && rPill.width > 0) ? (y >= (rPill.top - 4) && y <= (rPill.bottom + 4)) : true;
                                    const dirs = [rFixar, rFechar].filter(r => r && r.width > 0);
                                    if (dirs.length > 0 && dentroY) {
                                        const minLeft = Math.min(...dirs.map(r => r.left));
                                        const maxRight = (rPill && rPill.width > 0) ? (rPill.right + 4) : (Math.max(...dirs.map(r => r.right)) + padSeg);
                                        if (x >= (minLeft - padSeg) && x <= maxRight) return true;
                                    }
                                    return [rFixar, rFechar].some(r =>
                                        r && r.width > 0 &&
                                        x >= (r.left - padSeg) && x <= (r.right + padSeg) &&
                                        y >= (r.top - padSeg) && y <= (r.bottom + padSeg)
                                    );
                                };

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

                                btnFechar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const dAtual = host.__jusgovDados || dadosResumo;
                                    if (dAtual && (dAtual.emDescanso || dAtual.descansoPendente)) {
                                        return;
                                    }
                                    try {
                                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                            chrome.runtime.sendMessage({
                                                acao: 'ALTERNAR_EXIBICAO_BARRA_ATIVO_POMODORO',
                                                exibirNoAtivo: false
                                            }).catch(() => { });
                                        }
                                    } catch (_) { }
                                    destruirHost(host);
                                });

                                /* Duplo clique em qualquer lugar do minipopup (exceto botões) comuta: Minimalista -> Semicompleto -> Completo -> Minimalista */
                                pill.addEventListener('dblclick', (ev) => {
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === btnFixar || ev.target === btnFechar || path.includes(btnFixar) || path.includes(btnFechar)) {
                                        return;
                                    }
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const atualDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    const proximoDet = (atualDet === 0) ? 1 : ((atualDet === 1) ? 2 : 0);
                                    estAtual.nivelDetalhe = proximoDet;
                                    if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    }
                                    enviarEstadoGlobal({ nivelDetalhe: proximoDet });
                                });

                                /* Arraste fluido via Pointer Events (setPointerCapture evita travar sobre iframes) com encaixe obrigatório nas 6 posições */
                                pill.addEventListener('pointerdown', (ev) => {
                                    if (ev.button !== 0) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === btnFixar || ev.target === btnFechar || path.includes(btnFixar) || path.includes(btnFechar)) {
                                        return;
                                    }
                                    ev.stopPropagation();
                                    const pointerId = ev.pointerId;
                                    const startX = ev.clientX;
                                    const startY = ev.clientY;
                                    const startRect = pill.getBoundingClientRect();
                                    const startTop = startRect ? Math.round(startRect.top) : 0;
                                    const startLeft = startRect ? Math.round(startRect.left) : 0;
                                    const largPill = (startRect && startRect.width > 16) ? Math.ceil(startRect.width) : 64;
                                    const altPill = (startRect && startRect.height > 8) ? Math.ceil(startRect.height) : 20;
                                    const docEl = document.documentElement;
                                    const wTela = Math.max(320, (docEl && docEl.clientWidth) || window.innerWidth || 1280);
                                    const hTela = Math.max(200, (docEl && docEl.clientHeight) || window.innerHeight || 720);
                                    const maxLeft = Math.max(0, wTela - largPill);
                                    const maxTop = Math.max(0, hTela - altPill);
                                    let iniciouArraste = false;
                                    let ultimoCentroX = startLeft + (largPill / 2);
                                    let ultimoCentroY = startTop + (altPill / 2);

                                    const onMove = (mev) => {
                                        const dx = mev.clientX - startX;
                                        const dy = mev.clientY - startY;
                                        if (!iniciouArraste && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                                            iniciouArraste = true;
                                            host.__jusgovArrastando = true;
                                            host.__jusgovRetornoRect = null;
                                            pill.style.cursor = 'grabbing';
                                            host.style.setProperty('transition', 'none', 'important');
                                            host.style.setProperty('bottom', 'auto', 'important');
                                            host.style.setProperty('right', 'auto', 'important');
                                            host.style.setProperty('transform', 'none', 'important');
                                            try {
                                                if (typeof pill.setPointerCapture === 'function') pill.setPointerCapture(pointerId);
                                            } catch (_) { }
                                        }
                                        if (!iniciouArraste) return;
                                        const novoLeft = Math.max(0, Math.min(maxLeft, Math.round(startLeft + dx)));
                                        const novoTop = Math.max(0, Math.min(maxTop, Math.round(startTop + dy)));
                                        host.style.setProperty('left', `${novoLeft}px`, 'important');
                                        host.style.setProperty('top', `${novoTop}px`, 'important');
                                        ultimoCentroX = novoLeft + (largPill / 2);
                                        ultimoCentroY = novoTop + (altPill / 2);
                                    };
                                    const finalizarArraste = () => {
                                        pill.removeEventListener('pointermove', onMove);
                                        pill.removeEventListener('pointerup', finalizarArraste);
                                        pill.removeEventListener('pointercancel', finalizarArraste);
                                        document.removeEventListener('mousemove', onMove, true);
                                        document.removeEventListener('mouseup', finalizarArraste, true);
                                        window.removeEventListener('blur', finalizarArraste);
                                        try {
                                            if (typeof pill.releasePointerCapture === 'function' && pill.hasPointerCapture(pointerId)) {
                                                pill.releasePointerCapture(pointerId);
                                            }
                                        } catch (_) { }
                                        if (!iniciouArraste) return;
                                        host.__jusgovArrastando = false;
                                        pill.style.cursor = 'grab';
                                        host.style.setProperty('transition', 'left 0.16s ease,right 0.16s ease,top 0.16s ease', 'important');
                                        const rx = Math.max(0, Math.min(1, ultimoCentroX / wTela));
                                        const ry = Math.max(0, Math.min(1, ultimoCentroY / hTela));
                                        const posVertFinal = (ry < 0.5) ? 'superior' : 'inferior';
                                        const alinhFinal = (rx < 0.33) ? 'esquerda' : (rx > 0.66 ? 'direita' : 'centro');
                                        aplicarPosicao(host, posVertFinal, alinhFinal);
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
                                    pill.addEventListener('pointermove', onMove);
                                    pill.addEventListener('pointerup', finalizarArraste);
                                    pill.addEventListener('pointercancel', finalizarArraste);
                                    document.addEventListener('mousemove', onMove, true);
                                    document.addEventListener('mouseup', finalizarArraste, true);
                                    window.addEventListener('blur', finalizarArraste);
                                });

                                /* Esquiva inteligente na mesma linha horizontal (com 1s de tolerância inicial e zonas seguras dos botões) */
                                pill.addEventListener('mousemove', (ev) => {
                                    const agoraMov = Date.now();
                                    if (!host.__jusgovHoverInicioTs) {
                                        host.__jusgovHoverInicioTs = agoraMov;
                                    }
                                    if (host.__jusgovArrastando || agoraMov < (host.__jusgovCooldownEsquiva || 0)) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === btnFechar || ev.target === btnFixar ||
                                        path.includes(btnFechar) || path.includes(btnFixar) ||
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
                                    if (posAtual.posicaoVertical === 'centro_tela') return;
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
                                        aplicarPosicao(host, posAtual.posicaoVertical, ladoDestino);
                                        if (!usaRetornoAmarelo) {
                                            enviarEstadoGlobal({
                                                posicaoVertical: posAtual.posicaoVertical,
                                                alinhamento: ladoDestino,
                                                topPx: (posAtual.posicaoVertical === 'inferior') ? 99999 : 0
                                            });
                                        }
                                    }
                                });

                                pill.addEventListener('mouseenter', () => {
                                    host.__jusgovHoverPill = true;
                                    host.__jusgovHoverInicioTs = Date.now();
                                    if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                        host.__jusgovAtualizarBadgeStatus();
                                    }
                                });
                                pill.addEventListener('mouseleave', () => {
                                    host.__jusgovHoverPill = false;
                                    host.__jusgovHoverInicioTs = 0;
                                    if (typeof host.__jusgovAtualizarModoVisual === 'function') {
                                        host.__jusgovAtualizarModoVisual();
                                    } else if (typeof host.__jusgovAtualizarBadgeStatus === 'function') {
                                        host.__jusgovAtualizarBadgeStatus();
                                    }
                                });

                                const pararScreensaver = () => {
                                    host.__jusgovScreensaverAtivo = false;
                                    if (host.__jusgovScreensaverRaf) {
                                        cancelAnimationFrame(host.__jusgovScreensaverRaf);
                                        host.__jusgovScreensaverRaf = 0;
                                    }
                                    host.style.setProperty('transition', 'left 0.16s ease,right 0.16s ease,top 0.16s ease', 'important');
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
                                    let sx = Math.max(0, Math.min(Math.max(0, wInit - pillWIni), Math.round((wInit - pillWIni) / 2)));
                                    let sy = Math.max(0, Math.min(Math.max(0, hInit - pillHIni), Math.round((hInit - pillHIni) / 2)));
                                    const angDegBases = [32, 52, 128, 148, 212, 232, 308, 328];
                                    const angRad = (angDegBases[Math.floor(Math.random() * angDegBases.length)] + (Math.random() * 10 - 5)) * (Math.PI / 180);
                                    const velBase = 120;
                                    let vx = Math.cos(angRad) * velBase;
                                    let vy = Math.sin(angRad) * velBase;
                                    let ultimoTs = performance.now();

                                    const passo = (tsNow) => {
                                        if (!host.__jusgovScreensaverAtivo || !host.isConnected || document.hidden || host.__jusgovArrastando) {
                                            pararScreensaver();
                                            return;
                                        }
                                        const dt = Math.min(0.06, Math.max(0.005, (tsNow - ultimoTs) / 1000));
                                        ultimoTs = tsNow;
                                        const dEl = document.documentElement;
                                        const wT = Math.max(320, (dEl && dEl.clientWidth) || window.innerWidth || 1280);
                                        const hT = Math.max(200, (dEl && dEl.clientHeight) || window.innerHeight || 720);
                                        const rP = pill.getBoundingClientRect();
                                        const pW = (rP && rP.width > 20) ? Math.ceil(rP.width) : pillWIni;
                                        const pH = (rP && rP.height > 10) ? Math.ceil(rP.height) : pillHIni;
                                        const maxX = Math.max(0, wT - pW);
                                        const maxY = Math.max(0, hT - pH);

                                        sx += vx * dt;
                                        sy += vy * dt;
                                        let bateu = false;
                                        if (sx <= 0) { sx = 0; vx = Math.abs(vx); bateu = true; }
                                        else if (sx >= maxX) { sx = maxX; vx = -Math.abs(vx); bateu = true; }
                                        if (sy <= 0) { sy = 0; vy = Math.abs(vy); bateu = true; }
                                        else if (sy >= maxY) { sy = maxY; vy = -Math.abs(vy); bateu = true; }
                                        if (bateu) {
                                            const deltaAng = (Math.random() * 0.24) - 0.12;
                                            const ca = Math.cos(deltaAng);
                                            const sa = Math.sin(deltaAng);
                                            const nvx = vx * ca - vy * sa;
                                            const nvy = vx * sa + vy * ca;
                                            if (Math.abs(nvx) > 35 && Math.abs(nvy) > 35) {
                                                vx = nvx;
                                                vy = nvy;
                                            }
                                        }
                                        host.style.setProperty('left', `${Math.round(sx)}px`, 'important');
                                        host.style.setProperty('top', `${Math.round(sy)}px`, 'important');
                                        host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                    };
                                    host.style.setProperty('left', `${sx}px`, 'important');
                                    host.style.setProperty('top', `${sy}px`, 'important');
                                    host.__jusgovScreensaverRaf = requestAnimationFrame(passo);
                                };
                                host.__jusgovIniciarScreensaver = iniciarScreensaver;

                                const tocarBeepConclusao = (intensidade = 'suave') => {
                                    try {
                                        const AudioCtx = window.AudioContext || window.webkitAudioContext;
                                        if (!AudioCtx) return;
                                        if (!host.__jusgovAudioCtx) {
                                            host.__jusgovAudioCtx = new AudioCtx();
                                        }
                                        const ctx = host.__jusgovAudioCtx;
                                        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                                            ctx.resume().catch(() => { });
                                        }
                                        const t0 = ctx.currentTime + 0.01;
                                        const emitirNota = (freq, iniOffset, dur, ganhoMax, tipo = 'sine') => {
                                            const osc = ctx.createOscillator();
                                            const gain = ctx.createGain();
                                            osc.type = tipo;
                                            osc.frequency.setValueAtTime(freq, t0 + iniOffset);
                                            gain.gain.setValueAtTime(0.0001, t0 + iniOffset);
                                            gain.gain.exponentialRampToValueAtTime(ganhoMax, t0 + iniOffset + 0.02);
                                            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + iniOffset + dur);
                                            osc.connect(gain);
                                            gain.connect(ctx.destination);
                                            osc.start(t0 + iniOffset);
                                            osc.stop(t0 + iniOffset + dur + 0.02);
                                        };
                                        if (intensidade === 'grave') {
                                            emitirNota(987, 0, 0.11, 0.16, 'triangle');
                                            emitirNota(740, 0.13, 0.13, 0.16, 'triangle');
                                        } else if (intensidade === 'moderado') {
                                            emitirNota(740, 0, 0.09, 0.11, 'sine');
                                            emitirNota(880, 0.11, 0.11, 0.11, 'sine');
                                        } else {
                                            emitirNota(523.25, 0, 0.14, 0.06, 'sine');
                                        }
                                    } catch (_) { }
                                };
                                host.__jusgovTocarBeep = tocarBeepConclusao;

                                host.__jusgovGarantirBackdropBlur = garantirBackdropBlur;
                                host.__jusgovRemoverBackdropBlur = removerBackdropBlur;

                                const atualizarPosicaoEfetivaPill = (agoraPos = Date.now()) => {
                                    if (host.__jusgovArrastando || host.__jusgovRetornoRect) return;
                                    const dPos = host.__jusgovDados || dadosResumo;
                                    const estPos = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const modoEsp = obterModoPosicaoEspecial(dPos, agoraPos);
                                    if (modoEsp === 'idle_centro_tela') {
                                        garantirBackdropBlur();
                                        iniciarScreensaver();
                                        host.__jusgovPos = { posicaoVertical: 'centro_tela', alinhamento: 'centro', topPx: 0 };
                                        return;
                                    }
                                    if (modoEsp === 'aviso_movimento_centro_blur') {
                                        garantirBackdropBlur();
                                        pararScreensaver();
                                        if (!host.__jusgovPos || host.__jusgovPos.posicaoVertical !== 'centro_tela' || host.style.transform !== 'translate(-50%, -50%)') {
                                            aplicarPosicao(host, 'centro_tela', 'centro');
                                        }
                                        return;
                                    }
                                    removerBackdropBlur();
                                    pararScreensaver();
                                    if (modoEsp === 'aviso_topo_centro') {
                                        if (!host.__jusgovPos || host.__jusgovPos.posicaoVertical !== 'superior' || host.__jusgovPos.alinhamento !== 'centro') {
                                            aplicarPosicao(host, 'superior', 'centro');
                                        }
                                        return;
                                    }
                                    const posVertAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.posicaoVerticalAncorada : estPos.posicaoVertical;
                                    const alinhAlvo = (Number(estPos.modoFixacao) === 1) ? estPos.alinhamentoAncorado : estPos.alinhamento;
                                    if (!host.__jusgovPos || host.__jusgovPos.posicaoVertical !== posVertAlvo || host.__jusgovPos.alinhamento !== alinhAlvo) {
                                        aplicarPosicao(host, posVertAlvo, alinhAlvo);
                                    }
                                };

                                const atualizarBadgeStatus = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    const agoraNow = (host.__jusgovSnapshotAgoraSrvMs && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage)
                                        ? Number(host.__jusgovSnapshotAgoraSrvMs)
                                        : (Date.now() + Number(host.__jusgovRelogioOffsetMs || 0));
                                    const estAtual = host.__jusgovEstadoBarra || normalizarEstadoBarra(estadoBarra);
                                    const nivelDet = Math.floor(Number(estAtual.nivelDetalhe) || 0);
                                    if (host.__jusgovArrastando) {
                                        spanStatus.style.display = 'none';
                                        return;
                                    }
                                    const metaMs = Math.max(1, Number((d && d.metaFaseMin) || 1)) * 60000;
                                    const cumpridoAoVivo = Boolean(d && d.emDescanso && (d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs));

                                    if (d.emDescanso && !cumpridoAoVivo && d.descansoEmAviso && d.descansoAvisoTexto) {
                                        pill.style.borderColor = '#eab308';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = d.descansoAvisoTexto;
                                        spanStatus.style.background = '#f59e0b';
                                        spanStatus.style.color = '#111827';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (d.emDescanso && cumpridoAoVivo) {
                                        pill.style.borderColor = '#16a34a';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Concluído!';
                                        spanStatus.style.background = '#16a34a';
                                        spanStatus.style.color = '#ffffff';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    if (d.emDescanso && !d.aguardandoOciosidade) {
                                        pill.style.borderColor = '#0284c7';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Em andamento...';
                                        spanStatus.style.background = 'rgba(2, 132, 199, 0.2)';
                                        spanStatus.style.color = '#bae6fd';
                                        spanStatus.style.fontWeight = '600';
                                        return;
                                    }
                                    if (d.descansoPendente || (d.emDescanso && d.aguardandoOciosidade)) {
                                        pill.style.borderColor = '#dc2626';
                                        spanStatus.style.display = 'block';
                                        spanStatus.textContent = 'Pendente...';
                                        spanStatus.style.background = '#dc2626';
                                        spanStatus.style.color = '#ffffff';
                                        spanStatus.style.fontWeight = '700';
                                        return;
                                    }
                                    pill.style.borderColor = '#0d9488';
                                    if (nivelDet === 2) {
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
                                    if (host.__jusgovArrastando) {
                                        pill.style.padding = '1px 6px';
                                        pill.style.borderRadius = '7px';
                                        spanFase.style.display = 'none';
                                        spanTempo.style.display = 'inline-block';
                                        btnFixar.style.display = 'none';
                                        btnFechar.style.display = 'none';
                                        spanStatus.style.display = 'none';
                                        return;
                                    }
                                    pill.style.padding = '1px 6px';
                                    pill.style.borderRadius = '7px';
                                    const faseCurtaAtual = (d && d.fase === 'pausa_maior') ? 'Descanso' : `${(d && d.faseLabel) || 'Foco'} ${(d && d.cicloAtual) || 1}/${(d && d.ciclosMax) || 4}`;
                                    spanFase.textContent = `🍅 ${faseCurtaAtual}`;
                                    spanFase.style.display = (temAvisoOuDescanso || nivelDet >= 1) ? 'inline-block' : 'none';
                                    spanTempo.style.display = 'inline-block';
                                    btnFixar.style.display = host.__jusgovHoverPill ? 'inline-flex' : 'none';
                                    btnFechar.style.display = (host.__jusgovHoverPill && !d.emDescanso && !d.descansoPendente) ? 'inline-block' : 'none';
                                    atualizarBadgeStatus();
                                };
                                host.__jusgovAtualizarModoVisual = atualizarModoVisualPill;

                                /* Renderização pura a partir do snapshot externo compartilhado pelo Service Worker (sem contadores locais) */
                                const atualizarRelogio = () => {
                                    const d = host.__jusgovDados || dadosResumo;
                                    if (!d) return;
                                    const agoraNow = (host.__jusgovSnapshotAgoraSrvMs && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage)
                                        ? Number(host.__jusgovSnapshotAgoraSrvMs)
                                        : (Date.now() + Number(host.__jusgovRelogioOffsetMs || 0));

                                    if (d.emDescanso) {
                                        const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
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

                                        if (cumpridoAoVivo && !document.hidden) {
                                            const cfgBeep = host.__jusgovConfigBeep || {};
                                            if (cfgBeep.ativo && cfgBeep.permitirBeep) {
                                                const ultimoBeep = Number(host.__jusgovUltimoBeepTs || 0);
                                                if (ultimoBeep === 0 || (agoraNow - ultimoBeep) >= Math.max(5000, Number(cfgBeep.intervaloMs || 15000))) {
                                                    host.__jusgovUltimoBeepTs = agoraNow;
                                                    tocarBeepConclusao(cfgBeep.intensidade || 'suave');
                                                }
                                            }
                                        } else if (!cumpridoAoVivo) {
                                            host.__jusgovUltimoBeepTs = 0;
                                        }

                                        spanTempo.style.color = '';
                                        spanTempo.style.animation = 'none';
                                        atualizarPosicaoEfetivaPill(agoraNow);
                                        atualizarModoVisualPill();
                                        return;
                                    }

                                    host.__jusgovUltimoBeepTs = 0;
                                    /* Contador de Ativo/Foco é progressivo (+00:00 -> +meta); nos últimos 30s antes do descanso pisca em amarelo */
                                    const segFoco = (typeof d.segundosDecorridos === 'number' && Number.isFinite(d.segundosDecorridos))
                                        ? Math.max(0, Math.floor(d.segundosDecorridos))
                                        : (d.emPausa
                                            ? Math.max(0, Number(d.minutosNaFase || 0) * 60)
                                            : Math.max(0, Math.floor((agoraNow - Number(d.focoAnchorTs || d.faseInicioTs || agoraNow)) / 1000)));
                                    const mm = String(Math.floor(segFoco / 60)).padStart(2, '0');
                                    const ss = String(segFoco % 60).padStart(2, '0');
                                    spanTempo.textContent = `+${mm}:${ss}`;
                                    const metaFocoSeg = Math.max(1, Number(d.metaFaseMin || d.focoMin || 25)) * 60;
                                    const segRestFoco = metaFocoSeg - segFoco;
                                    const emAlerta30s = Boolean(!d.descansoPendente && !d.emPausa && segRestFoco > 0 && segRestFoco <= 30);
                                    spanTempo.style.color = emAlerta30s ? '#facc15' : '';
                                    spanTempo.style.animation = emAlerta30s ? 'jusgov-piscar-crono 1s steps(1,end) infinite' : 'none';
                                    atualizarPosicaoEfetivaPill(agoraNow);
                                    atualizarModoVisualPill();
                                };
                                host.__jusgovAtualizarRelogio = atualizarRelogio;

                                const aplicarSnapshotExterno = (novaCfgExib, novoResumo, novoEstadoBarra) => {
                                    gerenciarModalDescanso(Boolean(novaCfgExib && novaCfgExib.deveExibirModalDescanso), novaCfgExib && novaCfgExib.modalDados);
                                    const exib = resolverPermissaoExibicao(host, novaCfgExib, novoResumo);
                                    if (!exib.deveExibir) {
                                        destruirHost(host);
                                        return;
                                    }
                                    const estNorm = normalizarEstadoBarra(novoEstadoBarra);
                                    const agoraLocal = Date.now();
                                    const agoraSrv = (novaCfgExib && novaCfgExib.agoraServidor) ? Number(novaCfgExib.agoraServidor) : agoraLocal;
                                    host.__jusgovChaveFase = exib.chave;
                                    host.__jusgovDados = novoResumo;
                                    host.__jusgovSnapshotAgoraSrvMs = agoraSrv;
                                    host.__jusgovRelogioOffsetMs = (novaCfgExib && novaCfgExib.agoraServidor) ? (agoraSrv - agoraLocal) : 0;
                                    const tooltipAtivo = (novaCfgExib && novaCfgExib.tooltipTexto) || (novoResumo && novoResumo.tooltipTexto) || '';
                                    if (tooltipAtivo) {
                                        pill.title = tooltipAtivo;
                                    } else {
                                        pill.removeAttribute('title');
                                    }
                                    host.__jusgovEstadoBarra = estNorm;
                                    host.__jusgovModoBarra = (novaCfgExib && novaCfgExib.modoBarra) || 'sempre';
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
                                    if (!document.hidden && !host.__jusgovTimerInterval) {
                                        host.__jusgovTimerInterval = setInterval(solicitarSincronizacaoExterna, 1000);
                                    }
                                };
                                host.__jusgovAplicarSnapshotExterno = aplicarSnapshotExterno;

                                const solicitarSincronizacaoExterna = () => {
                                    if (document.hidden || !host.isConnected || host.__jusgovSyncEmVoo) return;
                                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                        host.__jusgovSyncEmVoo = true;
                                        chrome.runtime.sendMessage({ acao: 'OBTER_STATUS_TRABALHO' }).then((resp) => {
                                            host.__jusgovSyncEmVoo = false;
                                            if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected) {
                                                const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                            }
                                        }).catch(() => {
                                            host.__jusgovSyncEmVoo = false;
                                        });
                                        return;
                                    }
                                    atualizarRelogio();
                                };

                                const enviarInteracaoExterna = (tipoInteracao = 'movimento') => {
                                    const d = host.__jusgovDados;
                                    if (!d) return;
                                    const agoraLoc = Date.now();
                                    const precisaPingImediato = Boolean(tipoInteracao === 'click_ou_tecla');
                                    if (d.emDescanso) {
                                        const metaMs = Math.max(1, Number(d.metaFaseMin || 1)) * 60000;
                                        const cumpridoAgora = Boolean(d.descansoMinCumprido || Number(d.descansoAcumuladoMs || 0) >= metaMs);
                                        pararScreensaver();
                                        if (cumpridoAgora || tipoInteracao === 'click_ou_tecla') {
                                            removerBackdropBlur();
                                        } else {
                                            garantirBackdropBlur();
                                            aplicarPosicao(host, 'centro_tela', 'centro');
                                        }
                                        if (tipoInteracao === 'movimento' && (agoraLoc - Number(host.__jusgovUltimoPingDescTs || 0)) < 150) {
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
                                                if (resp && resp.ok && resp.resumoPomodoro && resp.cfgExib && host.isConnected) {
                                                    const cfgComTs = Object.assign({}, resp.cfgExib, { agoraServidor: resp.agoraServidor || Date.now() });
                                                    aplicarSnapshotExterno(cfgComTs, resp.resumoPomodoro, resp.estadoBarra || host.__jusgovEstadoBarra);
                                                }
                                            }).catch(() => { });
                                        }
                                    } catch (_) { }
                                };

                                /* Retorno automático quando no modo 2 (posição fixada) o mouse sai da área original */
                                const onDocMouseMovePos = (ev) => {
                                    const ultimo = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                    const moveuDeVerdade = ultimo.x !== -9999 && (Math.abs(ev.clientX - ultimo.x) > 1 || Math.abs(ev.clientY - ultimo.y) > 1);
                                    host.__jusgovUltimoCursor = { x: ev.clientX, y: ev.clientY };
                                    if (moveuDeVerdade) {
                                        enviarInteracaoExterna('movimento');
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
                                    if (ev.type === 'keydown' && ev.repeat) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    const naPropriaBarra = (ev.target === host || path.includes(host) || path.includes(pill));
                                    if (!naPropriaBarra) {
                                        enviarInteracaoExterna('click_ou_tecla');
                                    }
                                };
                                const onDocVisibilityChange = () => {
                                    if (document.hidden) {
                                        removerBackdropBlur();
                                        pararScreensaver();
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
                                                chrome.runtime.sendMessage({ acao: 'SINCRONIZAR_GUIA_ATIVA_POMODORO' }).catch(() => { });
                                            }
                                        } catch (_) { }
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
