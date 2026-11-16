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
                pomodoroBarraOcultadaChave: '',
                pomodoroPularProximoPopupFoco: false,
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
         * Durante Alívio/Descanso Maior:
         * - Se tipoInteracao === 'click_ou_tecla' e o descanso mínimo já foi cumprido (FEAT-38), inicia o novo Foco.
         * - Caso contrário e haja clique/tecla durante descanso pendente, reinicia a contagem da pausa.
         * - Movimento de mouse ('movimento') mantém Workrave ativo sem fechar o popup nem dispensar Foco.
         * @param {number} [agora]
         * @param {string} [tipoInteracao] 'click_ou_tecla' | 'movimento'
         * @returns {Promise<{ resetouDescanso: boolean, iniciouFocoPosDescanso: boolean }>}
         */
        async registrarAtividadeTrabalho(agora = Date.now(), tipoInteracao = 'click_ou_tecla') {
            try {
                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                const res = this.aplicarAtividadeEmEstadoTrabalho(estado, agora, tipoInteracao);
                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
                return res;
            } catch (_) {
                return { resetouDescanso: false, iniciouFocoPosDescanso: false };
            }
        }

        /**
         * Aplica detecção de atividade no objeto de estado (função pura para testes e SW).
         * @param {Object} estado
         * @param {number} [agora]
         * @param {string} [tipoInteracao] 'click_ou_tecla' | 'movimento'
         * @returns {{ resetouDescanso: boolean, iniciouFocoPosDescanso: boolean }}
         */
        aplicarAtividadeEmEstadoTrabalho(estado, agora = Date.now(), tipoInteracao = 'click_ou_tecla') {
            if (!estado || typeof estado !== 'object') {
                return { resetouDescanso: false, iniciouFocoPosDescanso: false };
            }
            estado.ultimaAtividadeTs = agora;
            estado.emPausa = false;
            estado.minutosInativosPendentes = 0;
            estado._nivelAutoCreditado = '';

            if (estado.pomodoroFase === 'alivio' || estado.pomodoroFase === 'pausa_maior') {
                if (tipoInteracao === 'click_ou_tecla' && estado.pomodoroDescansoMinCumprido) {
                    /* Usuário voltou de pausa cumprida (ou prolongada) pressionando tecla/clique -> inicia novo Foco */
                    estado.pomodoroUltimoDescansoTipo = estado.pomodoroFase;
                    estado.pomodoroUltimoDescansoFimTs = agora;
                    estado.pomodoroFase = 'foco';
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroFaseInicioTs = agora;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = true;
                    estado.pomodoroDescansoPendente = false;
                    if (estado.pomodoroPularProximoPopupFoco) {
                        estado.pomodoroPularProximoPopupFoco = false;
                        estado.pomodoroBarraOcultadaChave = `foco:${(estado.pomodoroCicloAtual || 0) + 1}:${agora}`;
                    } else {
                        estado.pomodoroBarraOcultadaChave = '';
                    }
                    return { resetouDescanso: true, iniciouFocoPosDescanso: true };
                }
                if (tipoInteracao === 'click_ou_tecla') {
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroFaseInicioTs = agora;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = false;
                    estado.pomodoroDescansoPendente = true;
                    return { resetouDescanso: true, iniciouFocoPosDescanso: false };
                }
            }
            return { resetouDescanso: false, iniciouFocoPosDescanso: false };
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
         * Alterna ciclicamente os 3 estados do botão Fixar: 0 (desfixado) -> 1 (fixado) -> 2 (fixado + posição travada) -> 0.
         * @param {number} [modoAtual]
         * @returns {0|1|2}
         */
        avancarModoFixacaoBarra(modoAtual = 0) {
            const n = Math.floor(Number(modoAtual) || 0);
            if (n === 0) return 1;
            if (n === 1) return 2;
            return 0;
        }

        /**
         * Normaliza o estado global compartilhado da barra Pomodoro para todas as guias.
         * @param {Object} [bruto]
         * @returns {{ modoFixacao: 0|1|2, topPx: number, alinhamento: 'esquerda'|'centro'|'direita'|'livre', leftPx: number|null, topAncoradoPx: number, alinhamentoAncorado: 'esquerda'|'centro'|'direita'|'livre', leftAncoradoPx: number|null }}
         */
        normalizarEstadoGlobalBarraPomodoro(bruto = {}) {
            const b = (bruto && typeof bruto === 'object') ? bruto : {};
            const modoNum = Math.floor(Number(b.modoFixacao) || 0);
            const modoFixacao = (modoNum === 1 || modoNum === 2) ? modoNum : 0;
            const alinhValido = (v) => (v === 'esquerda' || v === 'direita' || v === 'centro' || v === 'livre') ? v : 'centro';
            const topPx = Math.max(8, Math.round(Number(b.topPx) || 8));
            const leftBruto = (b.leftPx !== undefined && b.leftPx !== null && Number.isFinite(Number(b.leftPx)))
                ? Math.max(8, Math.round(Number(b.leftPx))) : null;
            let alinhamento = alinhValido(b.alinhamento);
            if (alinhamento === 'livre' && leftBruto === null) alinhamento = 'centro';

            const topAncoradoPx = Math.max(8, Math.round(Number(b.topAncoradoPx) || topPx));
            const leftAncBruto = (b.leftAncoradoPx !== undefined && b.leftAncoradoPx !== null && Number.isFinite(Number(b.leftAncoradoPx)))
                ? Math.max(8, Math.round(Number(b.leftAncoradoPx))) : ((alinhamento === 'livre') ? leftBruto : null);
            let alinhamentoAncorado = b.alinhamentoAncorado ? alinhValido(b.alinhamentoAncorado) : alinhamento;
            if (alinhamentoAncorado === 'livre' && leftAncBruto === null) alinhamentoAncorado = 'centro';

            return {
                modoFixacao,
                topPx,
                alinhamento,
                leftPx: leftBruto,
                topAncoradoPx,
                alinhamentoAncorado,
                leftAncoradoPx: leftAncBruto
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
            const ultimaAtivTs = Number(estado.ultimaAtividadeTs || agora);
            const msInativo = Math.max(0, agora - ultimaAtivTs);
            const emDescanso = (fase === 'alivio' || fase === 'pausa_maior');
            const aguardandoOciosidade = Boolean(emDescanso && msInativo < 60000 && minutosNaFase === 0);
            const inicioFaseTs = Number(estado.pomodoroFaseInicioTs || estado.inicioTs || agora);
            const terminaEmTs = aguardandoOciosidade
                ? (agora + metaFaseMin * 60000)
                : (emDescanso ? (ultimaAtivTs + metaFaseMin * 60000) : (inicioFaseTs + metaFaseMin * 60000));
            const segRestantes = aguardandoOciosidade
                ? (metaFaseMin * 60)
                : Math.max(0, Math.ceil((terminaEmTs - agora) / 1000));
            const descansoPendente = Boolean(estado.pomodoroDescansoPendente || (emDescanso && !estado.pomodoroDescansoRealizadoNoCiclo));
            const ultimoDescansoTipo = (estado.pomodoroUltimoDescansoTipo === 'alivio' || estado.pomodoroUltimoDescansoTipo === 'pausa_maior')
                ? estado.pomodoroUltimoDescansoTipo : '';
            const ultimoDescansoFimTs = Number(estado.pomodoroUltimoDescansoFimTs || 0);
            const horaFimDescanso = ultimoDescansoFimTs > 0 ? this.formatarHoraHHMM(ultimoDescansoFimTs) : '';
            const ultimoDescansoTexto = (ultimoDescansoTipo && horaFimDescanso)
                ? `${ultimoDescansoTipo === 'pausa_maior' ? 'Descanso Realizado' : 'Alívio Realizado'} em ${horaFimDescanso}`
                : '';
            const descansoRealizado = Boolean(ultimoDescansoTexto && !descansoPendente);
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
                aguardandoOciosidade,
                descansoPendente,
                descansoRealizado,
                ultimoDescansoTipo,
                ultimoDescansoFimTs,
                ultimoDescansoTexto
            };
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
            const st = (estado && typeof estado === 'object') ? estado : {};
            const meta = (nuvemMeta && typeof nuvemMeta === 'object')
                ? nuvemMeta
                : ((st._nuvemMeta && typeof st._nuvemMeta === 'object') ? st._nuvemMeta : null);

            let dataBR = '';
            if (typeof st.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(st.data)) {
                const [ano, mes, dia] = st.data.split('-');
                dataBR = `${dia}/${mes}/${ano}`;
            } else {
                const d = new Date(agora);
                dataBR = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }

            const inicioLocal = Number(st.inicioTs || 0);
            const inicioOutros = Number(meta && meta.outrosInicioTs || 0);
            const candidatosInicio = [inicioLocal, inicioOutros].filter(n => Number.isFinite(n) && n > 0);
            const inicioCombinado = candidatosInicio.length > 0 ? Math.min(...candidatosInicio) : agora;
            const horaInicio = this.formatarHoraHHMM(inicioCombinado);
            const linhaDataInicio = `🕒 Ligado ${dataBR}${horaInicio ? ` desde ${horaInicio}hs` : ''}`;

            const fmtHM = (min) => {
                const m = Math.max(0, Math.floor(Number(min) || 0));
                return `${String(Math.floor(m / 60)).padStart(2, '0')}h:${String(m % 60).padStart(2, '0')}m`;
            };
            const corridoMin = Math.max(0, Math.floor(Number(st.corridoMinutos) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosCorridoMin) || 0));
            const ativoMin = Math.max(0, Math.floor(Number(st.ativoMinutos) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosAtivoMin) || 0));
            const pausas = Math.max(0, Math.floor(Number(st.pausasConfirmadas) || 0))
                + Math.max(0, Math.floor(Number(meta && meta.outrosPausasConf) || 0));

            const partesTempo = [];
            if (corridoMin > 0) partesTempo.push(`Corrido ${fmtHM(corridoMin)}`);
            if (ativoMin > 0 && ativoMin !== corridoMin) partesTempo.push(`Ativo ${fmtHM(ativoMin)}`);
            if (pausas > 0) partesTempo.push(`Pausas ${pausas}`);
            const linhaTempos = partesTempo.length > 0 ? `👉 ${partesTempo.join(' • ')}` : '';

            const stEfetivo = { ...st };
            if (meta && Number(meta.outrosUltimoDescFimTs || 0) > Number(st.pomodoroUltimoDescansoFimTs || 0)) {
                stEfetivo.pomodoroUltimoDescansoFimTs = Number(meta.outrosUltimoDescFimTs);
                if (meta.outrosUltimoDescTipo === 'alivio' || meta.outrosUltimoDescTipo === 'pausa_maior') {
                    stEfetivo.pomodoroUltimoDescansoTipo = meta.outrosUltimoDescTipo;
                }
            }

            const resumo = this.calcularResumoPomodoro(stEfetivo, config, agora);
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
                    segmentosPomodoro.push({ texto: `${resumo.ultimoDescansoTexto}hs`, destaque: 'realizado' });
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
         * Avança 1 minuto na máquina Pomodoro (função pura/determinística para testes e tick SW).
         * - No Alívio ou Pausa Maior, SÓ avança quando o usuário está ocioso (minInativo >= 1);
         *   caso o usuário continue trabalhando, zera a contagem da pausa e reinicia pomodoroFaseInicioTs.
         * @param {Object} estado
         * @param {number} [agora]
         * @param {Object} [config]
         * @returns {{ evento: string|null, descansouNoPeriodo: boolean, ciclosMax: number, focoMin: number, alivioMin: number, pausaMaiorMin: number, proporcao: number }}
         */
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
                if (minInativo < 1) {
                    /* BUG-70: Usuário continuou trabalhando -> aguarda idle e reinicia contagem do descanso */
                    estado.pomodoroMinutosNaFase = 0;
                    estado.pomodoroFaseInicioTs = agora;
                    estado.pomodoroDescansoMinCumprido = false;
                    estado.pomodoroDescansoRealizadoNoCiclo = false;
                    estado.pomodoroDescansoPendente = true;
                    return { evento: 'aguardando_idle', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
                estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
                if (estado.pomodoroFase === 'alivio') {
                    if (estado.pomodoroMinutosNaFase >= pausaMaiorMin) {
                        /* Alívio prolongado virou Descanso Maior e segue contando indefinidamente até o usuário voltar a interagir */
                        estado.pomodoroFase = 'pausa_maior';
                        estado.pomodoroCicloAtual = 0;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'pausa_maior';
                        estado.pomodoroUltimoDescansoFimTs = agora;
                        return { evento: 'promovido_pausa_maior', descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                    }
                    if (estado.pomodoroMinutosNaFase >= alivioMin) {
                        const acabouDeCumprir = !estado.pomodoroDescansoMinCumprido;
                        estado.pomodoroDescansoMinCumprido = true;
                        estado.pomodoroDescansoRealizadoNoCiclo = true;
                        estado.pomodoroDescansoPendente = false;
                        estado.pomodoroUltimoDescansoTipo = 'alivio';
                        estado.pomodoroUltimoDescansoFimTs = agora;
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
                    return { evento: acabouDeCumprir ? 'pausa_maior_cumprida_continua' : null, descansouNoPeriodo: true, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
                return { evento: null, descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
            }

            /* Fase 'foco': avança apenas enquanto houver atividade fora de pausa */
            if (!estado.emPausa && minInativo < alivioMin) {
                estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
            }
            if (estado.pomodoroFase === 'foco' && estado.pomodoroMinutosNaFase >= focoMin) {
                estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
                estado.pomodoroMinutosNaFase = 0;
                estado.pomodoroFaseInicioTs = agora;
                estado.pomodoroDescansoMinCumprido = false;
                estado.pomodoroDescansoRealizadoNoCiclo = false;
                estado.pomodoroDescansoPendente = true;
                estado.pomodoroBarraOcultadaChave = '';
                if (estado.pomodoroCicloAtual >= ciclosMax) {
                    estado.pomodoroFase = 'pausa_maior';
                    return { evento: 'inicio_pausa_maior', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
                }
                estado.pomodoroFase = 'alivio';
                return { evento: 'inicio_alivio', descansouNoPeriodo: false, ciclosMax, focoMin, alivioMin, pausaMaiorMin, proporcao };
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
                if (pomodoroAtivo && prefsAviso.usarModal) {
                    if (evPom.evento === 'inicio_pausa_maior') {
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Hora da Pausa Maior!',
                            `Você concluiu ${evPom.ciclosMax} ciclos de foco (${evPom.focoMin} min cada). Descanse por ${evPom.pausaMaiorMin} minutos.`,
                            `Proporção ${evPom.proporcao}:1 • Pausa Maior de ${evPom.pausaMaiorMin} min`
                        );
                    } else if (evPom.evento === 'inicio_alivio') {
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
            const topPx = Math.max(8, Math.min(h - 48, Math.round(Number(yTop) || 8)));
            return { alinhamento, topPx };
        }

        /**
         * Clamp seguro de posição livre (Modo 2 / 🔒) dentro dos limites da viewport (FEAT-46).
         * @param {number} leftPx
         * @param {number} topPx
         * @param {number} [larguraPill]
         * @param {number} [larguraTela]
         * @param {number} [alturaTela]
         * @returns {{ leftPx: number, topPx: number }}
         */
        calcularPosicaoLivreClamp(leftPx, topPx, larguraPill = 240, larguraTela = 1280, alturaTela = 720) {
            const w = Math.max(320, Number(larguraTela || 1280));
            const h = Math.max(200, Number(alturaTela || 720));
            const pillW = Math.max(80, Math.min(w - 16, Number(larguraPill || 240)));
            const maxLeft = Math.max(8, w - pillW - 8);
            const maxTop = Math.max(24, h - 48);
            return {
                leftPx: Math.max(8, Math.min(maxLeft, Math.round(Number(leftPx) || 8))),
                topPx: Math.max(8, Math.min(maxTop, Math.round(Number(topPx) || 8)))
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
                proximo.topPx = Math.max(8, Math.round(Number(patch.topPx) || 8));
            }
            if (patch.leftPx !== undefined) {
                proximo.leftPx = (patch.leftPx !== null && Number.isFinite(Number(patch.leftPx)))
                    ? Math.max(8, Math.round(Number(patch.leftPx))) : null;
            }
            if (['esquerda', 'centro', 'direita', 'livre'].includes(patch.alinhamento)) {
                proximo.alinhamento = patch.alinhamento;
                if (patch.alinhamento !== 'livre' && patch.leftPx === undefined) {
                    proximo.leftPx = null;
                }
            }
            if (patch.modoFixacao !== undefined) {
                const mf = Math.floor(Number(patch.modoFixacao) || 0);
                proximo.modoFixacao = (mf === 1 || mf === 2) ? mf : 0;
            }
            if (patch.ancorar === true || (proximo.modoFixacao === 2 && patch.modoFixacao === 2)) {
                proximo.topAncoradoPx = proximo.topPx;
                proximo.alinhamentoAncorado = proximo.alinhamento;
                proximo.leftAncoradoPx = proximo.leftPx;
            } else if (patch.topAncoradoPx !== undefined || patch.alinhamentoAncorado !== undefined || patch.leftAncoradoPx !== undefined) {
                if (patch.topAncoradoPx !== undefined) proximo.topAncoradoPx = Math.max(8, Math.round(Number(patch.topAncoradoPx) || 8));
                if (['esquerda', 'centro', 'direita', 'livre'].includes(patch.alinhamentoAncorado)) proximo.alinhamentoAncorado = patch.alinhamentoAncorado;
                if (patch.leftAncoradoPx !== undefined) {
                    proximo.leftAncoradoPx = (patch.leftAncoradoPx !== null && Number.isFinite(Number(patch.leftAncoradoPx)))
                        ? Math.max(8, Math.round(Number(patch.leftAncoradoPx))) : null;
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
         * Atualiza o badge do ícone no Chrome e projeta/remove a faixa flutuante global nas abas abertas.
         * @param {Object} [config]
         * @param {Object} [estadoParam]
         * @param {number|string|null} [tabIdEspecifica] número de tabId, 'todas' para todas as abas HTTP(S), ou null para abas ativas
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
                const resumo = this.calcularResumoPomodoro(estado, cfg, agoraSync);
                const infoTooltip = this.formatarResumoProdutividadeTexto(estado, cfg, agoraSync, nuvemMeta);
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
                    } else {
                        chrome.action.setBadgeText({ text: '' }).catch(() => { });
                    }
                    if (chrome.action.setTitle) {
                        chrome.action.setTitle({
                            title: infoTooltip.tooltipTitle || 'JusGovBR — Seleção/Cópia Inteligente'
                        }).catch(() => { });
                    }
                }

                if (!chrome.tabs || !chrome.scripting) return;
                const chaveFaseAtual = `${resumo.fase}:${resumo.cicloAtual}:${resumo.faseInicioTs}`;
                const focoOcultadoGlobal = (resumo.fase === 'foco' && estado.pomodoroBarraOcultadaChave === chaveFaseAtual);
                const ativoPorConfig = Boolean(resumo.ativo && prefs.modoBarra !== 'nunca');
                const deveMostrarBarraBase = Boolean(
                    ativoPorConfig &&
                    !focoOcultadoGlobal &&
                    (prefs.modoBarra === 'sempre' || (prefs.modoBarra === 'descanso' && (resumo.emDescanso || resumo.descansoPendente)))
                );

                const estadoBarraGlobal = await this.obterEstadoGlobalBarraPomodoro();

                let abas = [];
                if (tabIdEspecifica === 'todas') {
                    abas = await chrome.tabs.query({}).catch(() => []);
                } else if (typeof tabIdEspecifica === 'number' && tabIdEspecifica > 0) {
                    const abaUnica = await chrome.tabs.get(tabIdEspecifica).catch(() => null);
                    if (abaUnica) abas = [abaUnica];
                } else {
                    abas = await chrome.tabs.query({ active: true }).catch(() => []);
                }

                for (const aba of abas) {
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;

                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: (cfgExib, dadosResumo, estadoBarra) => {
                            const idHost = 'jusgov-pomodoro-barra-global';
                            const destruirHost = (h) => {
                                if (!h) return;
                                if (h.__jusgovTimerInterval) clearInterval(h.__jusgovTimerInterval);
                                if (h.__jusgovTimerRetorno) clearTimeout(h.__jusgovTimerRetorno);
                                if (typeof h.__jusgovCleanupListeners === 'function') {
                                    try { h.__jusgovCleanupListeners(); } catch (_) { }
                                }
                                h.remove();
                            };

                            /* FEAT-39: Singleton estrito (apenas 1 minipopup por guia, podando eventuais duplicatas de corrida) */
                            const existentes = Array.from(document.querySelectorAll('#jusgov-pomodoro-barra-global, [data-jusgov-pomodoro-bar="true"]'));
                            let host = existentes[0] || null;
                            for (let dIdx = 1; dIdx < existentes.length; dIdx++) {
                                destruirHost(existentes[dIdx]);
                            }

                            /* Remove eventual legado por guia para que todas as guias reflitam o estado global unificado */
                            try { sessionStorage.removeItem('jusgovPomodoroBarraFixadaTab'); } catch (_) { }

                            const estadoNorm = {
                                modoFixacao: (estadoBarra && (estadoBarra.modoFixacao === 1 || estadoBarra.modoFixacao === 2)) ? estadoBarra.modoFixacao : 0,
                                topPx: Math.max(8, Math.round(Number(estadoBarra && estadoBarra.topPx) || 8)),
                                alinhamento: (estadoBarra && (estadoBarra.alinhamento === 'esquerda' || estadoBarra.alinhamento === 'direita' || estadoBarra.alinhamento === 'livre')) ? estadoBarra.alinhamento : 'centro',
                                leftPx: (estadoBarra && estadoBarra.leftPx !== undefined && estadoBarra.leftPx !== null && Number.isFinite(Number(estadoBarra.leftPx)))
                                    ? Math.max(8, Math.round(Number(estadoBarra.leftPx))) : null,
                                topAncoradoPx: Math.max(8, Math.round(Number(estadoBarra && estadoBarra.topAncoradoPx) || (estadoBarra && estadoBarra.topPx) || 8)),
                                alinhamentoAncorado: (estadoBarra && (estadoBarra.alinhamentoAncorado === 'esquerda' || estadoBarra.alinhamentoAncorado === 'direita' || estadoBarra.alinhamentoAncorado === 'livre'))
                                    ? estadoBarra.alinhamentoAncorado
                                    : ((estadoBarra && (estadoBarra.alinhamento === 'esquerda' || estadoBarra.alinhamento === 'direita' || estadoBarra.alinhamento === 'livre')) ? estadoBarra.alinhamento : 'centro'),
                                leftAncoradoPx: (estadoBarra && estadoBarra.leftAncoradoPx !== undefined && estadoBarra.leftAncoradoPx !== null && Number.isFinite(Number(estadoBarra.leftAncoradoPx)))
                                    ? Math.max(8, Math.round(Number(estadoBarra.leftAncoradoPx)))
                                    : ((estadoBarra && estadoBarra.alinhamento === 'livre' && estadoBarra.leftPx !== undefined && estadoBarra.leftPx !== null) ? Math.max(8, Math.round(Number(estadoBarra.leftPx))) : null)
                            };

                            const chaveFase = `${dadosResumo.fase}:${dadosResumo.cicloAtual}:${dadosResumo.faseInicioTs}`;
                            let fechadaNestaGuia = false;
                            try {
                                fechadaNestaGuia = Boolean(dadosResumo.emDescanso && sessionStorage.getItem('jusgovPomodoroBarraFechadaFaseTab') === chaveFase);
                            } catch (_) { }

                            const deveExibirAqui = Boolean(
                                cfgExib && cfgExib.ativoPorConfig &&
                                (estadoNorm.modoFixacao > 0 || (!fechadaNestaGuia && cfgExib.deveExibirNormal))
                            );
                            if (!deveExibirAqui) {
                                destruirHost(host);
                                return;
                            }

                            /* Posicionamento unificado por left + transform (inclui modo 'livre' XY para cadeado 🔒) */
                            const aplicarPosicao = (h, topVal, alinhVal, leftVal = null) => {
                                if (!h) return;
                                const wTela = Math.max(320, window.innerWidth || 1280);
                                const hTela = Math.max(200, window.innerHeight || 720);
                                const maxTop = Math.max(24, hTela - 48);
                                const topSeguro = Math.max(8, Math.min(maxTop, Math.round(Number(topVal) || 8)));
                                const alinh = (alinhVal === 'esquerda' || alinhVal === 'direita' || alinhVal === 'livre') ? alinhVal : 'centro';
                                h.style.top = `${topSeguro}px`;
                                h.style.right = 'auto';
                                if (alinh === 'livre' && leftVal !== null && Number.isFinite(Number(leftVal))) {
                                    const uiRef = h.__jusgovUI;
                                    const rectPill = (uiRef && uiRef.pill && typeof uiRef.pill.getBoundingClientRect === 'function')
                                        ? uiRef.pill.getBoundingClientRect() : null;
                                    const largPill = (rectPill && rectPill.width > 60) ? rectPill.width : 240;
                                    const maxLeft = Math.max(8, wTela - Math.min(wTela - 16, largPill) - 8);
                                    const leftSeguro = Math.max(8, Math.min(maxLeft, Math.round(Number(leftVal))));
                                    h.__jusgovPos = { topPx: topSeguro, alinhamento: 'livre', leftPx: leftSeguro };
                                    h.style.left = `${leftSeguro}px`;
                                    h.style.transform = 'translateX(0)';
                                } else if (alinh === 'esquerda') {
                                    h.__jusgovPos = { topPx: topSeguro, alinhamento: 'esquerda', leftPx: null };
                                    h.style.left = '12px';
                                    h.style.transform = 'translateX(0)';
                                } else if (alinh === 'direita') {
                                    h.__jusgovPos = { topPx: topSeguro, alinhamento: 'direita', leftPx: null };
                                    h.style.left = 'calc(100% - 12px)';
                                    h.style.transform = 'translateX(-100%)';
                                } else {
                                    h.__jusgovPos = { topPx: topSeguro, alinhamento: 'centro', leftPx: null };
                                    h.style.left = '50%';
                                    h.style.transform = 'translateX(-50%)';
                                }
                            };

                            const atualizarVisualBotaoFixar = (btn, modoFix) => {
                                if (!btn) return;
                                if (modoFix === 2) {
                                    btn.textContent = '🔒';
                                    btn.title = 'Posição Fixada em todas as guias (foge do mouse e volta para a mesma posição; 3º clique desafixa)';
                                    btn.style.background = '#0284c7';
                                    btn.style.color = '#ffffff';
                                    btn.style.boxShadow = '0 0 0 1px #bae6fd';
                                } else if (modoFix === 1) {
                                    btn.textContent = '📌';
                                    btn.title = 'Fixado em todas as guias (clique novamente para fixar também a posição)';
                                    btn.style.background = '#0d9488';
                                    btn.style.color = '#ffffff';
                                    btn.style.boxShadow = 'none';
                                } else {
                                    btn.textContent = '📌';
                                    btn.title = 'Fixar em todas as guias (1º clique: fixar | 2º clique: fixar + posição | 3º clique: desafixar)';
                                    btn.style.background = 'transparent';
                                    btn.style.color = '#94a3b8';
                                    btn.style.boxShadow = 'none';
                                }
                                btn.style.borderRadius = '4px';
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
                                host.style.cssText = 'position:fixed;top:8px;left:50%;right:auto;transform:translateX(-50%);z-index:2147483647;pointer-events:none;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;transition:top 0.14s ease,left 0.22s ease,transform 0.22s ease;';
                                const shadow = host.attachShadow({ mode: 'closed' });
                                const pill = document.createElement('div');
                                pill.style.cssText = 'pointer-events:auto;display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(15,23,42,0.32);border:1.5px solid #0d9488;white-space:nowrap;';
                                const alcaMover = document.createElement('span');
                                alcaMover.setAttribute('data-parte', 'mover');
                                alcaMover.textContent = '⋮⋮';
                                alcaMover.title = 'Arraste para mover verticalmente e alinhar à Esquerda, Centro ou Direita';
                                alcaMover.style.cssText = 'cursor:grab;color:#94a3b8;font-size:13px;line-height:1;padding:0 3px;user-select:none;';
                                const spanFase = document.createElement('span');
                                spanFase.setAttribute('data-parte', 'fase');
                                const spanTempo = document.createElement('span');
                                spanTempo.setAttribute('data-parte', 'tempo');
                                spanTempo.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:700;';
                                const spanStatus = document.createElement('span');
                                spanStatus.setAttribute('data-parte', 'status');
                                spanStatus.style.cssText = 'padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;display:none;';
                                const btnFixar = document.createElement('button');
                                btnFixar.type = 'button';
                                btnFixar.textContent = '📌';
                                btnFixar.style.cssText = 'background:transparent;border:none;font-size:12px;line-height:1;cursor:pointer;padding:2px 5px;';
                                const btnFechar = document.createElement('button');
                                btnFechar.type = 'button';
                                btnFechar.textContent = '×';
                                btnFechar.title = 'Desafixar e fechar';
                                btnFechar.style.cssText = 'background:transparent;border:none;color:#cbd5e1;font-size:15px;line-height:1;cursor:pointer;padding:0 2px;';
                                pill.appendChild(alcaMover);
                                pill.appendChild(spanFase);
                                pill.appendChild(spanTempo);
                                pill.appendChild(spanStatus);
                                pill.appendChild(btnFixar);
                                pill.appendChild(btnFechar);
                                shadow.appendChild(pill);
                                host.__jusgovUI = { pill, alcaMover, spanFase, spanTempo, spanStatus, btnFixar, btnFechar };
                                host.__jusgovArrastando = false;
                                host.__jusgovCooldownEsquiva = 0;
                                host.__jusgovRetornoRect = null;
                                host.__jusgovTimerRetorno = null;
                                host.__jusgovUltimoCursor = { x: -9999, y: -9999 };

                                const agendarRetornoPosicaoAncorada = () => {
                                    if (!host.__jusgovRetornoRect) return;
                                    const est = host.__jusgovEstadoBarra;
                                    if (!est || est.modoFixacao !== 2) {
                                        host.__jusgovRetornoRect = null;
                                        return;
                                    }
                                    if (host.__jusgovTimerRetorno) clearTimeout(host.__jusgovTimerRetorno);
                                    host.__jusgovTimerRetorno = setTimeout(() => {
                                        host.__jusgovTimerRetorno = null;
                                        const estAgora = host.__jusgovEstadoBarra;
                                        if (!estAgora || estAgora.modoFixacao !== 2 || !host.__jusgovRetornoRect) return;
                                        const c = host.__jusgovUltimoCursor || { x: -9999, y: -9999 };
                                        const rOrig = host.__jusgovRetornoRect;
                                        const foraOrig = (c.x < rOrig.left - 14 || c.x > rOrig.right + 14 || c.y < rOrig.top - 14 || c.y > rOrig.bottom + 14);
                                        if (foraOrig) {
                                            host.__jusgovRetornoRect = null;
                                            host.__jusgovCooldownEsquiva = Date.now() + 260;
                                            aplicarPosicao(host, estAgora.topAncoradoPx, estAgora.alinhamentoAncorado, estAgora.leftAncoradoPx);
                                        }
                                    }, 160);
                                };

                                /* Zona segura geométrica cobrindo padding/gap dos controles (⋮⋮, 📌/🔒, ×) para não disparar esquiva */
                                const pontoEmControle = (x, y) => {
                                    const padSeg = 10;
                                    const rPill = pill.getBoundingClientRect();
                                    const rMover = alcaMover.getBoundingClientRect();
                                    const rFixar = btnFixar.getBoundingClientRect();
                                    const rFechar = btnFechar.getBoundingClientRect();
                                    const dentroY = (rPill && rPill.width > 0) ? (y >= (rPill.top - 4) && y <= (rPill.bottom + 4)) : true;
                                    if (rMover && rMover.width > 0 && dentroY && x <= (rMover.right + padSeg)) {
                                        if (!rPill || x >= (rPill.left - 4)) return true;
                                    }
                                    const dirs = [rFixar, rFechar].filter(r => r && r.width > 0);
                                    if (dirs.length > 0 && dentroY) {
                                        const minLeft = Math.min(...dirs.map(r => r.left));
                                        const maxRight = (rPill && rPill.width > 0) ? (rPill.right + 4) : (Math.max(...dirs.map(r => r.right)) + padSeg);
                                        if (x >= (minLeft - padSeg) && x <= maxRight) return true;
                                    }
                                    return [rMover, rFixar, rFechar].some(r =>
                                        r && r.width > 0 &&
                                        x >= (r.left - padSeg) && x <= (r.right + padSeg) &&
                                        y >= (r.top - padSeg) && y <= (r.bottom + padSeg)
                                    );
                                };

                                const fecharPorInteracao = (origemClickBotaoX = false) => {
                                    const estAtual = host.__jusgovEstadoBarra || estadoNorm;
                                    if (!origemClickBotaoX && Number(estAtual.modoFixacao || 0) > 0) {
                                        return;
                                    }
                                    if (origemClickBotaoX && Number(estAtual.modoFixacao || 0) > 0) {
                                        /* Botão X sempre desafixa em todas as guias e fecha */
                                        estAtual.modoFixacao = 0;
                                        enviarEstadoGlobal({ modoFixacao: 0 });
                                    }
                                    const dadosAtuais = host.__jusgovDados || dadosResumo;
                                    const chaveAtual = host.__jusgovChaveFase || chaveFase;
                                    if (dadosAtuais.fase === 'foco') {
                                        try {
                                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                chrome.runtime.sendMessage({
                                                    acao: 'FECHAR_BARRA_POMODORO_GLOBAL',
                                                    tipo: 'foco',
                                                    faseChave: chaveAtual
                                                }).catch(() => { });
                                            }
                                        } catch (_) { }
                                    } else {
                                        try { sessionStorage.setItem('jusgovPomodoroBarraFechadaFaseTab', chaveAtual); } catch (_) { }
                                        if (origemClickBotaoX) {
                                            try {
                                                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                                    chrome.runtime.sendMessage({ acao: 'DISPENSAR_POMODORO_DESCANSO_CICLO' }).catch(() => { });
                                                }
                                            } catch (_) { }
                                        }
                                    }
                                    destruirHost(host);
                                };

                                btnFixar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    const estAtual = host.__jusgovEstadoBarra || estadoNorm;
                                    const novoModo = (Number(estAtual.modoFixacao || 0) + 1) % 3;
                                    const posAtual = host.__jusgovPos || { topPx: estAtual.topPx, alinhamento: estAtual.alinhamento, leftPx: estAtual.leftPx };
                                    estAtual.modoFixacao = novoModo;
                                    if (novoModo !== 2) {
                                        host.__jusgovRetornoRect = null;
                                        if (host.__jusgovTimerRetorno) { clearTimeout(host.__jusgovTimerRetorno); host.__jusgovTimerRetorno = null; }
                                    } else {
                                        estAtual.topAncoradoPx = posAtual.topPx;
                                        estAtual.alinhamentoAncorado = posAtual.alinhamento;
                                        estAtual.leftAncoradoPx = (posAtual.alinhamento === 'livre') ? posAtual.leftPx : null;
                                    }
                                    atualizarVisualBotaoFixar(btnFixar, novoModo);
                                    alcaMover.title = (novoModo === 2)
                                        ? 'Arraste livremente para qualquer lugar da tela'
                                        : 'Arraste para mover verticalmente e alinhar à Esquerda, Centro ou Direita';
                                    enviarEstadoGlobal({
                                        modoFixacao: novoModo,
                                        topPx: posAtual.topPx,
                                        alinhamento: posAtual.alinhamento,
                                        leftPx: (posAtual.alinhamento === 'livre') ? posAtual.leftPx : null,
                                        ancorar: (novoModo === 2)
                                    });
                                });

                                btnFechar.addEventListener('click', (ev) => {
                                    ev.stopPropagation();
                                    fecharPorInteracao(true);
                                });

                                /* Arraste: vertical + snap (Modos 0/1) ou livre em qualquer X/Y da tela quando Cadeado (Modo 2) */
                                alcaMover.addEventListener('mousedown', (ev) => {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    host.__jusgovArrastando = true;
                                    host.__jusgovRetornoRect = null;
                                    alcaMover.style.cursor = 'grabbing';
                                    host.style.transition = 'none';
                                    const estDrag = host.__jusgovEstadoBarra || estadoNorm;
                                    const modoDrag = Number(estDrag.modoFixacao || 0);
                                    const startX = ev.clientX;
                                    const startY = ev.clientY;
                                    const startRect = pill.getBoundingClientRect();
                                    const startTop = (host.__jusgovPos && typeof host.__jusgovPos.topPx === 'number')
                                        ? host.__jusgovPos.topPx : (startRect ? Math.round(startRect.top) : 8);
                                    const startLeft = (host.__jusgovPos && typeof host.__jusgovPos.leftPx === 'number')
                                        ? host.__jusgovPos.leftPx : (startRect ? Math.round(startRect.left) : 12);
                                    const onMove = (mev) => {
                                        const novoTop = startTop + (mev.clientY - startY);
                                        if (modoDrag === 2) {
                                            const novoLeft = startLeft + (mev.clientX - startX);
                                            aplicarPosicao(host, novoTop, 'livre', novoLeft);
                                        } else {
                                            const w = Math.max(320, window.innerWidth || 1280);
                                            const r = Math.max(0, Math.min(1, mev.clientX / w));
                                            const novoAlinh = (r < 0.33) ? 'esquerda' : (r > 0.66 ? 'direita' : 'centro');
                                            aplicarPosicao(host, novoTop, novoAlinh);
                                        }
                                    };
                                    const onUp = () => {
                                        host.__jusgovArrastando = false;
                                        alcaMover.style.cursor = 'grab';
                                        host.style.transition = 'top 0.14s ease,left 0.22s ease,transform 0.22s ease';
                                        document.removeEventListener('mousemove', onMove, true);
                                        document.removeEventListener('mouseup', onUp, true);
                                        if (host.__jusgovPos) {
                                            const estAtual = host.__jusgovEstadoBarra || estadoNorm;
                                            const modoAtual = Number(estAtual.modoFixacao || 0);
                                            if (modoAtual === 2) {
                                                estAtual.topAncoradoPx = host.__jusgovPos.topPx;
                                                estAtual.alinhamentoAncorado = host.__jusgovPos.alinhamento;
                                                estAtual.leftAncoradoPx = host.__jusgovPos.leftPx ?? null;
                                            }
                                            enviarEstadoGlobal({
                                                topPx: host.__jusgovPos.topPx,
                                                alinhamento: host.__jusgovPos.alinhamento,
                                                leftPx: host.__jusgovPos.alinhamento === 'livre' ? host.__jusgovPos.leftPx : null,
                                                ancorar: (modoAtual === 2)
                                            });
                                        }
                                    };
                                    document.addEventListener('mousemove', onMove, true);
                                    document.addEventListener('mouseup', onUp, true);
                                });

                                /* Esquiva inteligente passando pelo centro (respeitando zonas seguras dos botões) */
                                pill.addEventListener('mousemove', (ev) => {
                                    if (host.__jusgovArrastando || Date.now() < (host.__jusgovCooldownEsquiva || 0)) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === btnFechar || ev.target === btnFixar || ev.target === alcaMover ||
                                        path.includes(btnFechar) || path.includes(btnFixar) || path.includes(alcaMover) ||
                                        pontoEmControle(ev.clientX, ev.clientY)) {
                                        return;
                                    }
                                    const rect = pill.getBoundingClientRect();
                                    if (!rect || rect.width <= 0) return;
                                    const posAtual = host.__jusgovPos || { topPx: 8, alinhamento: 'centro', leftPx: null };
                                    const wTela = Math.max(320, window.innerWidth || 1280);
                                    const centro = rect.left + (rect.width / 2);
                                    let ladoDestino = 'centro';
                                    if (posAtual.alinhamento === 'centro') {
                                        ladoDestino = (ev.clientX < centro) ? 'direita' : 'esquerda';
                                    } else if (posAtual.alinhamento === 'livre') {
                                        const ratio = centro / wTela;
                                        ladoDestino = (ratio < 0.35 || ratio > 0.65)
                                            ? 'centro'
                                            : ((ev.clientX < centro) ? 'direita' : 'esquerda');
                                    }
                                    if (posAtual.alinhamento !== ladoDestino) {
                                        const estAtual = host.__jusgovEstadoBarra || estadoNorm;
                                        if (Number(estAtual.modoFixacao || 0) === 2 && !host.__jusgovRetornoRect) {
                                            host.__jusgovRetornoRect = {
                                                left: rect.left,
                                                right: rect.right,
                                                top: rect.top,
                                                bottom: rect.bottom
                                            };
                                        }
                                        host.__jusgovCooldownEsquiva = Date.now() + 280;
                                        aplicarPosicao(host, posAtual.topPx, ladoDestino);
                                        if (Number(estAtual.modoFixacao || 0) !== 2) {
                                            enviarEstadoGlobal({ topPx: posAtual.topPx, alinhamento: ladoDestino });
                                        }
                                    }
                                });

                                /* Retorno automático quando no modo 2 (posição fixada) o mouse sai da área original */
                                const onDocMouseMovePos = (ev) => {
                                    host.__jusgovUltimoCursor = { x: ev.clientX, y: ev.clientY };
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

                                /* Auto-fechar ao pressionar tecla ou clicar com o mouse (apenas se modoFixacao === 0) */
                                const onDocInteracao = (ev) => {
                                    const estAtual = host.__jusgovEstadoBarra || estadoNorm;
                                    if (host.__jusgovArrastando || Number(estAtual.modoFixacao || 0) > 0) return;
                                    const path = (typeof ev.composedPath === 'function') ? ev.composedPath() : [];
                                    if (ev.target === host || path.includes(host) || path.includes(pill)) {
                                        return;
                                    }
                                    fecharPorInteracao(false);
                                };
                                document.addEventListener('keydown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousedown', onDocInteracao, { capture: true, passive: true });
                                document.addEventListener('mousemove', onDocMouseMovePos, { capture: true, passive: true });
                                document.addEventListener('mouseleave', onDocMouseLeavePos, { capture: false, passive: true });
                                host.__jusgovCleanupListeners = () => {
                                    document.removeEventListener('keydown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousedown', onDocInteracao, { capture: true });
                                    document.removeEventListener('mousemove', onDocMouseMovePos, { capture: true });
                                    document.removeEventListener('mouseleave', onDocMouseLeavePos, { capture: false });
                                };

                                (document.body || document.documentElement).appendChild(host);
                            }

                            host.__jusgovChaveFase = chaveFase;
                            host.__jusgovDados = dadosResumo;
                            host.__jusgovEstadoBarra = estadoNorm;
                            if (estadoNorm.modoFixacao !== 2) {
                                host.__jusgovRetornoRect = null;
                            }
                            if (!host.__jusgovArrastando && !host.__jusgovRetornoRect) {
                                const topAlvo = (estadoNorm.modoFixacao === 2) ? estadoNorm.topAncoradoPx : estadoNorm.topPx;
                                const alinhAlvo = (estadoNorm.modoFixacao === 2) ? estadoNorm.alinhamentoAncorado : estadoNorm.alinhamento;
                                const leftAlvo = (estadoNorm.modoFixacao === 2) ? estadoNorm.leftAncoradoPx : estadoNorm.leftPx;
                                aplicarPosicao(host, topAlvo, alinhAlvo, leftAlvo);
                            }

                            const ui = host.__jusgovUI;
                            if (!ui) return;
                            ui.alcaMover.title = (estadoNorm.modoFixacao === 2)
                                ? 'Arraste livremente para qualquer lugar da tela'
                                : 'Arraste para mover verticalmente e alinhar à Esquerda, Centro ou Direita';
                            atualizarVisualBotaoFixar(ui.btnFixar, estadoNorm.modoFixacao);
                            const corBorda = dadosResumo.descansoPendente ? '#dc2626' : (dadosResumo.emDescanso ? '#0284c7' : '#0d9488');
                            ui.pill.style.borderColor = corBorda;
                            ui.spanFase.textContent = `🍅 ${dadosResumo.faseLabel} • Ciclo ${dadosResumo.cicloAtual}/${dadosResumo.ciclosMax}`;
                            if (dadosResumo.descansoPendente) {
                                ui.spanStatus.style.display = 'inline-block';
                                ui.spanStatus.textContent = dadosResumo.aguardandoOciosidade ? 'Aguardando Pausa (Pendente)' : 'Descanso Pendente';
                                ui.spanStatus.style.background = '#dc2626';
                                ui.spanStatus.style.color = '#ffffff';
                            } else if (dadosResumo.ultimoDescansoTexto) {
                                ui.spanStatus.style.display = 'inline-block';
                                ui.spanStatus.textContent = dadosResumo.ultimoDescansoTexto;
                                ui.spanStatus.style.background = '#0d9488';
                                ui.spanStatus.style.color = '#ffffff';
                            } else {
                                ui.spanStatus.style.display = 'none';
                                ui.spanStatus.textContent = '';
                            }

                            const atualizarRelogio = () => {
                                if (dadosResumo.aguardandoOciosidade) {
                                    const mmParado = String(Math.max(0, Number(dadosResumo.metaFaseMin || 0))).padStart(2, '0');
                                    ui.spanTempo.textContent = `${mmParado}:00`;
                                    return;
                                }
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
                        args: [{ ativoPorConfig, deveExibirNormal: deveMostrarBarraBase, focoOcultadoGlobal }, resumo, estadoBarraGlobal]
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
