/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-barra-geometria.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Geometria, Posicionamento 6 Bordas e Estado Global do Minipopup
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-barra-geometria.js
 * - Classe Exportada: ProdutBarraGeometria (self.JusGovProdutBarraGeometria) extends BaseModulo
 * - Métodos Públicos: formatarHoraHHMM, resolverVisibilidadeBarraPomodoro, avancarNivelDetalheBarra, calcularPosicao6Bordas, normalizarEstadoGlobalBarraPomodoro, resolverPosicaoEfetivaBarraPomodoro, ponteiroSaiuDaAreaAncorada, podeDispararEsquivaBarra, calcularPosicaoBarraPomodoro, calcularPosicaoLivreClamp, isPontoEmControleBarraPomodoro, calcularEsquivaLateralBarra, obterEstadoGlobalBarraPomodoro, atualizarEstadoGlobalBarraPomodoro, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovProdutBarraGeometria = fabrica(raiz);
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

    class ProdutBarraGeometria extends Base {
        constructor() {
            super('ProdutBarraGeometria');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(ProdutBarraGeometria.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(ProdutBarraGeometria.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
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
    }

    Object.freeze(ProdutBarraGeometria.prototype);
    return Object.freeze(ProdutBarraGeometria);
}));