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
                pomodoroFaseInicioTs: agora,
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
         * Reinicia os contadores diários e o estado do Pomodoro para o momento atual.
         * @returns {Promise<Object>}
         */
        async resetarEstadoTrabalhoHoje() {
            const agora = Date.now();
            const novo = this.criarEstadoTrabalhoZerado(this.obterDataLocalChaveHoje(agora), agora);
            await chrome.storage.local.set({ jusgovTrabalhoEstado: novo });
            return novo;
        }

        /**
         * Registra o carimbo de tempo da última atividade detectada do usuário.
         * @returns {Promise<void>}
         */
        async registrarAtividadeTrabalho() {
            try {
                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                estado.ultimaAtividadeTs = Date.now();
                estado.emPausa = false;
                estado.minutosInativosPendentes = 0;
                estado._nivelAutoCreditado = '';
                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
            } catch (_) { }
        }

        /**
         * Calcula parâmetros e resumo legível da máquina Pomodoro atual.
         * @param {Object} estado
         * @param {Object} [config]
         * @param {number} [agora]
         * @returns {Object}
         */
        calcularResumoPomodoro(estado = {}, config = {}, agora = Date.now()) {
            const ativo = Boolean(config && config.pomodoroAtivo);
            const focoMin = Math.max(25, Number(config && config.pomodoroFocoMinutos || 25));
            const proporcao = Number(config && config.pomodoroProporcao || 4.5);
            const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
            const ciclosMax = Math.max(2, Number(config && config.pomodoroCiclos || 4));
            const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
            const fase = ['foco', 'alivio', 'pausa_maior'].includes(estado.pomodoroFase) ? estado.pomodoroFase : 'foco';
            const minutosNaFase = Math.max(0, Math.floor(Number(estado.pomodoroMinutosNaFase || 0)));
            const metaFaseMin = fase === 'pausa_maior' ? pausaMaiorMin : (fase === 'alivio' ? alivioMin : focoMin);
            const minutosRestantes = Math.max(0, metaFaseMin - minutosNaFase);
            const cicloConcluido = Math.max(0, Math.floor(Number(estado.pomodoroCicloAtual || 0)));
            const cicloAtual = fase === 'foco' ? Math.min(ciclosMax, cicloConcluido + 1) : Math.max(1, Math.min(ciclosMax, cicloConcluido));
            const inicioFaseTs = Number(estado.pomodoroFaseInicioTs || estado.inicioTs || agora);
            const terminaEmTs = inicioFaseTs + metaFaseMin * 60000;
            const segRestantes = Math.max(0, Math.ceil((terminaEmTs - agora) / 1000));
            const emDescanso = (fase === 'alivio' || fase === 'pausa_maior');
            const descansoPendente = Boolean(estado.pomodoroDescansoPendente || (emDescanso && !estado.pomodoroDescansoRealizadoNoCiclo));
            const descansoRealizado = Boolean(estado.pomodoroDescansoRealizadoNoCiclo && !descansoPendente);
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
                faseInicioTs: inicioFaseTs,
                faseTerminaEmTs: terminaEmTs,
                emDescanso,
                descansoPendente,
                descansoRealizado
            };
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
            if (!estado || !config || !config.pomodoroAtivo || config.pomodoroPausasAutomaticas === false) {
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
                estado.pomodoroFase = 'foco';
                estado.pomodoroMinutosNaFase = 0;
                estado.pomodoroCicloAtual = 0;
                estado.pomodoroDescansoRealizadoNoCiclo = true;
                estado.pomodoroDescansoPendente = false;
                estado.pomodoroFaseInicioTs = agora;
                estado._ultimoIdleAutoCreditadoTs = ultimaAtivTs;
                estado._nivelAutoCreditado = 'pausa_maior';
                return { creditado: true, tipo: 'pausa_maior' };
            }

            if (minInativo >= alivioMin && minInativo < pausaMaiorMin && nivelAnterior !== 'alivio' && nivelAnterior !== 'pausa_maior') {
                estado.pomodoroFase = 'foco';
                estado.pomodoroMinutosNaFase = 0;
                estado.pomodoroDescansoRealizadoNoCiclo = true;
                estado.pomodoroDescansoPendente = false;
                estado.pomodoroFaseInicioTs = agora;
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
        async projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo) {
            try {
                if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;
                const abasAtivas = await chrome.tabs.query({ active: true });
                for (const aba of abasAtivas) {
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
                            const fechar = () => {
                                overlay.remove();
                                document.removeEventListener('keydown', onEsc, true);
                            };
                            const onEsc = (e) => {
                                if (e.key === 'Escape') fechar();
                            };
                            btn.addEventListener('click', fechar);
                            overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
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
                        'Tempo de Trabalho Corrido Atingido',
                        `Você completou ${config.tempoTrabalhoCorridoHoras || 7}h de jornada corrida hoje.`,
                        `Tempo corrido: ${estado.corridoMinutos} min | Tempo ativo: ${estado.ativoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                if (res.disparoAtivo) {
                    await this.projetarModalProdutividadeEmTodasJanelas(
                        'Tempo Ativo de Trabalho Atingido',
                        `Você completou ${config.tempoTrabalhoAtivoHoras || 6}h de atividade efetiva hoje (estilo Workrave).`,
                        `Tempo ativo: ${estado.ativoMinutos} min | Tempo corrido: ${estado.corridoMinutos} min | Pausas: ${estado.pausasMinutos} min`
                    );
                }

                if (pomodoroAtivo) {
                    const autoRes = this.registrarPausasAutomaticasProdutividade(estado, agora, config);
                    const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 25));
                    const proporcao = Number(config.pomodoroProporcao || 4.5);
                    const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
                    const ciclosMax = Math.max(2, Number(config.pomodoroCiclos || 4));
                    const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));
                    const msInativo = Math.max(0, agora - Number(estado.ultimaAtividadeTs || agora));
                    const minInativo = Math.floor(msInativo / 60000);

                    if (!autoRes.creditado) {
                        const podeAvancarFoco = (estado.pomodoroFase !== 'foco') || (!estado.emPausa && minInativo < alivioMin);
                        if (podeAvancarFoco) {
                            estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
                        }
                        if (estado.pomodoroFase === 'foco' && estado.pomodoroMinutosNaFase >= focoMin) {
                            estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
                            estado.pomodoroMinutosNaFase = 0;
                            estado.pomodoroFaseInicioTs = agora;
                            estado.pomodoroDescansoRealizadoNoCiclo = false;
                            estado.pomodoroDescansoPendente = true;
                            if (estado.pomodoroCicloAtual >= ciclosMax) {
                                estado.pomodoroFase = 'pausa_maior';
                                if (prefsAviso.usarModal) {
                                    await this.projetarModalProdutividadeEmTodasJanelas(
                                        'Pomodoro: Hora da Pausa Maior!',
                                        `Você concluiu ${ciclosMax} ciclos de foco (${focoMin} min cada). Descanse por ${pausaMaiorMin} minutos.`,
                                        `Proporção ${proporcao}:1 • Pausa Maior de ${pausaMaiorMin} min`
                                    );
                                }
                            } else {
                                estado.pomodoroFase = 'alivio';
                                if (prefsAviso.usarModal) {
                                    await this.projetarModalProdutividadeEmTodasJanelas(
                                        'Pomodoro: Hora do Alívio!',
                                        `Ciclo ${estado.pomodoroCicloAtual}/${ciclosMax} concluído (${focoMin} min). Faça uma pausa de ${alivioMin} minutos.`,
                                        `Proporção ${proporcao}:1 • Alívio de ${alivioMin} min`
                                    );
                                }
                            }
                        } else if (estado.pomodoroFase === 'alivio' && estado.pomodoroMinutosNaFase >= alivioMin) {
                            const descansouNoPeriodo = (minInativo >= 1) || Boolean(estado.emPausa);
                            estado.pomodoroFase = 'foco';
                            estado.pomodoroMinutosNaFase = 0;
                            estado.pomodoroFaseInicioTs = agora;
                            estado.pomodoroDescansoRealizadoNoCiclo = descansouNoPeriodo;
                            estado.pomodoroDescansoPendente = !descansouNoPeriodo;
                            if (prefsAviso.usarModal) {
                                await this.projetarModalProdutividadeEmTodasJanelas(
                                    'Pomodoro: Fim do Alívio',
                                    descansouNoPeriodo
                                        ? `Retome o foco para o ciclo ${estado.pomodoroCicloAtual + 1}/${ciclosMax} (${focoMin} min).`
                                        : `Atenção: o alívio encerrou sem descanso detectado. Retome com pausa recomendada (${focoMin} min).`,
                                    descansouNoPeriodo ? 'Descanso realizado — bom trabalho!' : 'Descanso pendente neste ciclo'
                                );
                            }
                        } else if (estado.pomodoroFase === 'pausa_maior' && estado.pomodoroMinutosNaFase >= pausaMaiorMin) {
                            const descansouNoPeriodo = (minInativo >= 1) || Boolean(estado.emPausa);
                            estado.pomodoroFase = 'foco';
                            estado.pomodoroMinutosNaFase = 0;
                            estado.pomodoroCicloAtual = 0;
                            estado.pomodoroFaseInicioTs = agora;
                            estado.pomodoroDescansoRealizadoNoCiclo = descansouNoPeriodo;
                            estado.pomodoroDescansoPendente = !descansouNoPeriodo;
                            if (prefsAviso.usarModal) {
                                await this.projetarModalProdutividadeEmTodasJanelas(
                                    'Pomodoro: Fim da Pausa Maior',
                                    `Novo bloco de ${ciclosMax} ciclos iniciado (${focoMin} min de foco).`,
                                    descansouNoPeriodo ? 'Descanso completo realizado!' : 'Descanso completo pendente'
                                );
                            }
                        }
                    }
                }

                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
                await this.sincronizarIndicadoresGlobaisPomodoro(config, estado);
            } catch (_) { }
        }

        /**
         * Atualiza o badge do ícone no Chrome e projeta/remove a faixa flutuante global nas abas ativas.
         * @param {Object} [config]
         * @param {Object} [estadoParam]
         * @param {number|null} [tabIdEspecifica]
         */
        async sincronizarIndicadoresGlobaisPomodoro(config = null, estadoParam = null, tabIdEspecifica = null) {
            try {
                if (typeof chrome === 'undefined') return;
                const cfg = config || (this._obterConfig ? await this._obterConfig() : {});
                const estado = estadoParam || await this.obterOuIniciarEstadoTrabalhoHoje();
                const resumo = this.calcularResumoPomodoro(estado, cfg, Date.now());
                const prefs = this.resolverPreferenciasAvisoPomodoro(cfg);

                if (chrome.action && chrome.action.setBadgeText) {
                    if (resumo.ativo && prefs.usarBadge) {
                        const txtMin = `${Math.max(0, resumo.minutosRestantes)}m`;
                        const txtBadge = resumo.descansoPendente && !resumo.emDescanso ? `!${txtMin}` : txtMin;
                        const cor = resumo.descansoPendente ? '#dc2626' : (resumo.emDescanso ? '#0284c7' : '#0d9488');
                        chrome.action.setBadgeText({ text: txtBadge }).catch(() => { });
                        if (chrome.action.setBadgeBackgroundColor) {
                            chrome.action.setBadgeBackgroundColor({ color: cor }).catch(() => { });
                        }
                        if (chrome.action.setTitle) {
                            const statusDesc = resumo.descansoPendente ? 'Descanso Pendente' : (resumo.descansoRealizado ? 'Descanso Realizado' : 'Foco em andamento');
                            chrome.action.setTitle({
                                title: `JusGovBR • Pomodoro: ${resumo.faseLabel} (${resumo.minutosNaFase}/${resumo.metaFaseMin} min • Ciclo ${resumo.cicloAtual}/${resumo.ciclosMax} • ${statusDesc})`
                            }).catch(() => { });
                        }
                    } else {
                        chrome.action.setBadgeText({ text: '' }).catch(() => { });
                        if (chrome.action.setTitle) {
                            chrome.action.setTitle({ title: 'JusGovBR — Seleção/Cópia Inteligente' }).catch(() => { });
                        }
                    }
                }

                if (!chrome.tabs || !chrome.scripting) return;
                const deveMostrarBarra = Boolean(
                    resumo.ativo &&
                    (prefs.modoBarra === 'sempre' || (prefs.modoBarra === 'descanso' && (resumo.emDescanso || resumo.descansoPendente)))
                );

                let abas = [];
                if (tabIdEspecifica) {
                    const abaUnica = await chrome.tabs.get(tabIdEspecifica).catch(() => null);
                    if (abaUnica) abas = [abaUnica];
                } else {
                    abas = await chrome.tabs.query({ active: true }).catch(() => []);
                }

                for (const aba of abas) {
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: (exibir, dadosResumo) => {
                            const idHost = 'jusgov-pomodoro-barra-global';
                            let host = document.getElementById(idHost);
                            if (!exibir) {
                                if (host) {
                                    if (host.__jusgovTimerInterval) clearInterval(host.__jusgovTimerInterval);
                                    host.remove();
                                }
                                return;
                            }

                            const chaveFase = `${dadosResumo.fase}:${dadosResumo.cicloAtual}:${dadosResumo.faseInicioTs}`;
                            try {
                                if (sessionStorage.getItem('jusgovPomodoroBarraFechadaFase') === chaveFase) {
                                    return;
                                }
                            } catch (_) { }

                            if (!host) {
                                host = document.createElement('div');
                                host.id = idHost;
                                host.setAttribute('data-jusgov-ignore', 'true');
                                host.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;';
                                const shadow = host.attachShadow({ mode: 'closed' });
                                const pill = document.createElement('div');
                                pill.style.cssText = 'pointer-events:auto;display:inline-flex;align-items:center;gap:10px;padding:6px 12px;border-radius:999px;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(15,23,42,0.32);border:1.5px solid #0d9488;white-space:nowrap;';
                                const spanFase = document.createElement('span');
                                spanFase.setAttribute('data-parte', 'fase');
                                const spanTempo = document.createElement('span');
                                spanTempo.setAttribute('data-parte', 'tempo');
                                spanTempo.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;';
                                const spanStatus = document.createElement('span');
                                spanStatus.setAttribute('data-parte', 'status');
                                spanStatus.style.cssText = 'padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;';
                                const btnFechar = document.createElement('button');
                                btnFechar.type = 'button';
                                btnFechar.textContent = '×';
                                btnFechar.title = 'Ocultar barra nesta fase';
                                btnFechar.style.cssText = 'background:transparent;border:none;color:#cbd5e1;font-size:15px;line-height:1;cursor:pointer;padding:0 2px;';
                                pill.appendChild(spanFase);
                                pill.appendChild(spanTempo);
                                pill.appendChild(spanStatus);
                                pill.appendChild(btnFechar);
                                shadow.appendChild(pill);
                                host.__jusgovUI = { pill, spanFase, spanTempo, spanStatus, btnFechar };
                                btnFechar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    try { sessionStorage.setItem('jusgovPomodoroBarraFechadaFase', host.__jusgovChaveFase || ''); } catch (_) { }
                                    if (host.__jusgovTimerInterval) clearInterval(host.__jusgovTimerInterval);
                                    host.remove();
                                });
                                (document.body || document.documentElement).appendChild(host);
                            }

                            host.__jusgovChaveFase = chaveFase;
                            const ui = host.__jusgovUI;
                            if (!ui) return;
                            const corBorda = dadosResumo.descansoPendente ? '#dc2626' : (dadosResumo.emDescanso ? '#0284c7' : '#0d9488');
                            ui.pill.style.borderColor = corBorda;
                            ui.spanFase.textContent = `🍅 ${dadosResumo.faseLabel} • Ciclo ${dadosResumo.cicloAtual}/${dadosResumo.ciclosMax}`;
                            if (dadosResumo.descansoPendente) {
                                ui.spanStatus.textContent = 'Descanso Pendente';
                                ui.spanStatus.style.background = '#dc2626';
                                ui.spanStatus.style.color = '#ffffff';
                            } else if (dadosResumo.descansoRealizado) {
                                ui.spanStatus.textContent = 'Descanso Realizado';
                                ui.spanStatus.style.background = '#0d9488';
                                ui.spanStatus.style.color = '#ffffff';
                            } else {
                                ui.spanStatus.textContent = 'Em Foco';
                                ui.spanStatus.style.background = 'rgba(255,255,255,0.14)';
                                ui.spanStatus.style.color = '#e2e8f0';
                            }

                            const atualizarRelogio = () => {
                                const diffSeg = Math.floor((Number(dadosResumo.faseTerminaEmTs || 0) - Date.now()) / 1000);
                                const absSeg = Math.max(0, Math.abs(diffSeg));
                                const mm = String(Math.floor(absSeg / 60)).padStart(2, '0');
                                const ss = String(absSeg % 60).padStart(2, '0');
                                ui.spanTempo.textContent = diffSeg >= 0 ? `${mm}:${ss}` : `+${mm}:${ss}`;
                            };
                            atualizarRelogio();
                            if (host.__jusgovTimerInterval) clearInterval(host.__jusgovTimerInterval);
                            host.__jusgovTimerInterval = setInterval(atualizarRelogio, 1000);
                        },
                        args: [deveMostrarBarra, resumo]
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
