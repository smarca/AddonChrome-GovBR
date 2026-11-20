/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-resumo-ui.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Formatador de Texto e Renderizador DOM do Resumo
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-resumo-ui.js
 * - Classe Exportada: ProdutResumoUi (self.JusGovProdutResumoUi) extends BaseModulo
 * - Métodos Públicos: formatarResumoProdutividadeTexto(provedor, estado, config, agora, nuvemMeta),
 *   renderizarResumoProdutividadeDom(provedor, containerPrincipal, estado, config, agora, opcoes),
 *   static get NULL_OBJECT
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP, Null Object), ARQ-10 (Seção 6.281)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Encapsula a formatação textual e a renderização DOM segura (zero innerHTML)
 *    do resumo de produtividade (Ligado, Tempo de Atividade, Pausas, Pomodoro com
 *    segmentos coloridos, banco de minutos `*` e alerta de múltiplos computadores),
 *    compartilhado entre Popup, Opções e Tooltip do ícone da extensão.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutResumoUi = fabrica(raiz);
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

    const NULL_PRODUT_RESUMO_UI = Object.freeze({
        formatarResumoProdutividadeTexto: () => ({
            dataBR: '',
            horaInicio: '',
            linhaDataInicio: '',
            linhaTempos: '',
            linhaPomodoro: '',
            segmentosPomodoro: [],
            alertaMultiplosComputadores: '',
            tooltipTitle: ''
        }),
        renderizarResumoProdutividadeDom: () => null,
        inicializar: () => false,
        destruir: () => false
    });

    class ProdutResumoUi extends Base {
        static get NULL_OBJECT() {
            return NULL_PRODUT_RESUMO_UI;
        }

        constructor() {
            super('ProdutResumoUi');
        }

        /**
         * Formata os textos de resumo de produtividade para Popup, Opções e Tooltip.
         * @param {Object} provedor Instância de ModuloProdutividade (mesclarEstadoComNuvemMeta, formatarHoraHHMM, calcularResumoPomodoro)
         * @param {Object} [estado]
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {Object|null} [nuvemMeta]
         * @returns {{ dataBR: string, horaInicio: string, linhaDataInicio: string, linhaTempos: string, linhaPomodoro: string, segmentosPomodoro: Array<{texto: string, destaque: string, semSeparadorApos?: boolean}>, alertaMultiplosComputadores: string, tooltipTitle: string }}
         */
        formatarResumoProdutividadeTexto(provedor, estado = {}, config = {}, agora = Date.now(), nuvemMeta = null) {
            if (!provedor || typeof provedor.mesclarEstadoComNuvemMeta !== 'function') {
                return NULL_PRODUT_RESUMO_UI.formatarResumoProdutividadeTexto();
            }

            const { stEfetivo, meta, inicioCombinado, corridoTotalMin, ativoTotalMin, pausasTotais } = provedor.mesclarEstadoComNuvemMeta(estado, nuvemMeta, agora);

            let dataBR = '';
            if (typeof stEfetivo.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stEfetivo.data)) {
                const [ano, mes, dia] = stEfetivo.data.split('-');
                dataBR = `${dia}/${mes}/${ano}`;
            } else {
                const d = new Date(agora);
                dataBR = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }

            const horaInicio = typeof provedor.formatarHoraHHMM === 'function'
                ? provedor.formatarHoraHHMM(inicioCombinado)
                : '';
            const fmtHM = (min) => {
                const m = Math.max(0, Math.floor(Number(min) || 0));
                return `${String(Math.floor(m / 60)).padStart(2, '0')}h:${String(m % 60).padStart(2, '0')}m`;
            };

            const duracaoCorridoStr = corridoTotalMin > 0 ? ` (${fmtHM(corridoTotalMin)})` : '';
            const linhaDataInicio = `🕒 Ligado ${dataBR}${horaInicio ? ` desde ${horaInicio}hs` : ''}${duracaoCorridoStr}`;

            const partesTempo = [];
            if (ativoTotalMin > 0) partesTempo.push(`${fmtHM(ativoTotalMin)}`);
            if (pausasTotais > 0) partesTempo.push(`Pausas: ${pausasTotais}`);
            const linhaTempos = partesTempo.length > 0 ? `👉 Tempo de Atividade: ${partesTempo.join(' • ')}` : '';

            const resumo = typeof provedor.calcularResumoPomodoro === 'function'
                ? provedor.calcularResumoPomodoro(stEfetivo, config, agora, meta)
                : { ativo: false };

            const segmentosPomodoro = [];
            const unirSegmentosPomodoro = (lista) => {
                let out = '';
                for (let i = 0; i < lista.length; i++) {
                    const seg = lista[i];
                    if (i === 0) {
                        out = seg.texto;
                    } else if (lista[i - 1] && lista[i - 1].semSeparadorApos) {
                        out += ` ${seg.texto}`;
                    } else {
                        out += ` • ${seg.texto}`;
                    }
                }
                return out;
            };

            let linhaPomodoro = '';
            const fmtParBanco = (atual, metaVal, origem) => {
                if (origem === 'anterior') return `${atual}*/${metaVal}m`;
                if (origem === 'posterior') return `${atual}/${metaVal}*m`;
                return `${atual}/${metaVal}m`;
            };
            const origemFoco = String(stEfetivo.pomodoroBancoOrigemFoco || '');
            const origemDesc = String(stEfetivo.pomodoroBancoOrigemDescanso || '');

            if (resumo.ativo) {
                segmentosPomodoro.push({ texto: '🍅 Pomodoro:', destaque: 'prefixo', semSeparadorApos: true });
                if (resumo.fase === 'foco') {
                    segmentosPomodoro.push({
                        texto: `Foco ${fmtParBanco(resumo.minutosNaFase, resumo.focoMin, origemFoco)}`,
                        destaque: stEfetivo.emPausa ? 'pausado' : 'foco'
                    });
                    const saldoRestMs = Number(stEfetivo.pomodoroDescansoSaldoRestanteMs || 0);
                    if (stEfetivo.pomodoroDescansoPulado && saldoRestMs > 0) {
                        const ehPausaMaiorPausada = stEfetivo.pomodoroDescansoSaldoTipo === 'pausa_maior';
                        const rotuloPausado = ehPausaMaiorPausada ? 'Descanso' : 'Alívio';
                        const metaPausadoMin = ehPausaMaiorPausada ? resumo.pausaMaiorMin : resumo.alivioMin;
                        const restanteMin = Math.ceil(saldoRestMs / 60000);
                        const feitoPausadoMin = Math.max(0, metaPausadoMin - restanteMin);
                        segmentosPomodoro.push({
                            texto: `${rotuloPausado} ${fmtParBanco(feitoPausadoMin, metaPausadoMin, origemDesc)}`,
                            destaque: 'pausado'
                        });
                    }
                } else {
                    const focoSalvoMs = Number(stEfetivo.pomodoroFocoAcumuladoAntesPausaMs || 0);
                    const focoSalvoMin = Math.floor(focoSalvoMs / 60000);
                    if (focoSalvoMin > 0 && focoSalvoMin < resumo.focoMin) {
                        segmentosPomodoro.push({
                            texto: `Foco ${fmtParBanco(focoSalvoMin, resumo.focoMin, origemFoco)}`,
                            destaque: 'pausado'
                        });
                    }
                    const rotuloDesc = (resumo.fase === 'pausa_maior') ? 'Descanso' : 'Alívio';
                    const metaDescMin = (resumo.fase === 'pausa_maior') ? resumo.pausaMaiorMin : resumo.alivioMin;
                    segmentosPomodoro.push({
                        texto: `${rotuloDesc} ${fmtParBanco(resumo.minutosNaFase, metaDescMin, origemDesc)}`,
                        destaque: 'descanso'
                    });
                }
                segmentosPomodoro.push({ texto: `Ciclo ${resumo.cicloAtual}/${resumo.ciclosMax}`, destaque: 'normal' });
                if (resumo.descansoPendente) {
                    segmentosPomodoro.push({ texto: 'Descanso do ciclo: Pendente', destaque: 'pendente' });
                } else if (resumo.ultimoDescansoTexto) {
                    segmentosPomodoro.push({ texto: `${resumo.ultimoDescansoTexto}`, destaque: 'realizado' });
                }
                linhaPomodoro = unirSegmentosPomodoro(segmentosPomodoro);
            }

            const linhaPomodoroTooltip = unirSegmentosPomodoro(
                segmentosPomodoro.filter(s => s && s.destaque !== 'realizado')
            );

            const alertaMultiplosComputadores = (meta && meta.multiplosComputadoresSimultaneos)
                ? '⚠️ Múltiplos computadores em uso simultâneo.'
                : '';

            const tooltipTitle = [linhaDataInicio, linhaTempos, linhaPomodoroTooltip, alertaMultiplosComputadores]
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
         * Constrói linhas empilhadas com .textContent seguro (zero innerHTML).
         * @param {Object} provedor
         * @param {HTMLElement|null} containerPrincipal
         * @param {Object} [estado]
         * @param {Object} [config]
         * @param {number} [agora]
         * @param {{ containerPomodoro?: HTMLElement|null, ocultarPomodoroQuandoInativo?: boolean, nuvemMeta?: Object|null }} [opcoes]
         */
        renderizarResumoProdutividadeDom(provedor, containerPrincipal, estado = {}, config = {}, agora = Date.now(), opcoes = {}) {
            if (!containerPrincipal || typeof document === 'undefined') return null;
            const nuvemMeta = (opcoes && opcoes.nuvemMeta) ? opcoes.nuvemMeta : null;
            const info = this.formatarResumoProdutividadeTexto(provedor, estado, config, agora, nuvemMeta);

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
                    if (i > 0 && !(info.segmentosPomodoro[i - 1] && info.segmentosPomodoro[i - 1].semSeparadorApos)) {
                        const sep = document.createElement('span');
                        sep.textContent = '•';
                        sep.style.opacity = '0.5';
                        filhos.push(sep);
                    }
                    const seg = info.segmentosPomodoro[i];
                    const sp = document.createElement('span');
                    sp.textContent = seg.texto;
                    if (seg.destaque === 'prefixo' || seg.destaque === 'foco') sp.style.cssText = 'font-weight:600;';
                    else if (seg.destaque === 'descanso') sp.style.cssText = 'font-weight:600;color:#0284c7;';
                    else if (seg.destaque === 'pausado') sp.style.cssText = 'font-weight:500;color:#94a3b8;';
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
    }

    Object.freeze(ProdutResumoUi.prototype);
    return Object.freeze(ProdutResumoUi);
}));
