/* ==========================================================================
 * ARQUIVO: src/mod-XPath/xpath-inspetor-ui.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-XPATH — Painel Flutuante de Inspeção DOM em Tempo Real Multi-Frame
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-XPath/xpath-inspetor-ui.js
 * - Classe Exportada: XPathInspetorUi (self.JusGovXPathInspetorUi) extends BaseModulo
 * - Métodos Públicos: _p_obterContextoRaizUi, ocultarInspetorTempoReal, notificarOutrosFramesOcultarInspetor, _p_obterDominioCompletoUrl, atualizarInspetorTempoReal, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovXPathInspetorUi = fabrica(raiz);
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

    const TAGS_DOCUMENTAIS_SEMPRE_LEITURA = new Set([
        'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE',
        'LI', 'DT', 'DD', 'TD', 'TH', 'CAPTION', 'B', 'STRONG', 'I', 'EM', 'U',
        'INS', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP', 'MARK', 'SMALL', 'ABBR',
        'CITE', 'Q', 'DFN', 'KBD', 'SAMP', 'VAR', 'ARTICLE', 'SECTION', 'MAIN',
        'HTML', 'BODY'
    ]);

    class XPathInspetorUi extends Base {
        constructor() {
            super('XPathInspetorUi');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(XPathInspetorUi.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(XPathInspetorUi.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        _p_obterContextoRaizUi() {
            const docLocal = typeof document !== 'undefined' ? document : null;
            const winLocal = typeof window !== 'undefined' ? window : null;
            let w = winLocal;
            let ox = 0;
            let oy = 0;
            while (w && w !== w.top) {
                try {
                    const pDoc = w.parent && w.parent.document;
                    const fe = w.frameElement;
                    if (!pDoc || !pDoc.body || !fe) break;
                    const r = fe.getBoundingClientRect();
                    ox += r.left;
                    oy += r.top;
                    w = w.parent;
                } catch (_) {
                    break;
                }
            }
            const docUi = (w && w.document && w.document.body) ? w.document : docLocal;
            const winUi = w || winLocal;
            return { docUi, winUi, offsetX: ox, offsetY: oy };
        }

        ocultarInspetorTempoReal(ignorarOrigemId = null) {
            if (!ignorarOrigemId || !this._p_painelInspetorEl || this._p_painelInspetorEl.getAttribute('data-jusgov-origem-frame') !== ignorarOrigemId) {
                try {
                    if (this._p_painelInspetorEl) {
                        if (typeof this._p_painelInspetorEl.hidePopover === 'function') {
                            try { this._p_painelInspetorEl.hidePopover(); } catch (_) { }
                        }
                        if (this._p_painelInspetorEl.parentNode) {
                            this._p_painelInspetorEl.parentNode.removeChild(this._p_painelInspetorEl);
                        }
                    }
                } catch (_) { }
                this._p_painelInspetorEl = null;
            }
            const docsLimpar = [];
            if (typeof document !== 'undefined') docsLimpar.push(document);
            const { docUi } = this._p_obterContextoRaizUi();
            if (docUi && !docsLimpar.includes(docUi)) docsLimpar.push(docUi);
            docsLimpar.forEach((docRef) => {
                try {
                    const orfaos = docRef.querySelectorAll('#jusgov-inspetor-tempo-real, [data-jusgov-inspetor="true"]');
                    for (let i = 0; i < orfaos.length; i++) {
                        if (ignorarOrigemId && orfaos[i].getAttribute && orfaos[i].getAttribute('data-jusgov-origem-frame') === ignorarOrigemId) {
                            continue;
                        }
                        try {
                            if (typeof orfaos[i].hidePopover === 'function') orfaos[i].hidePopover();
                        } catch (_) { }
                        try { orfaos[i].remove(); } catch (_) { }
                    }
                } catch (_) { }
            });
        }

        notificarOutrosFramesOcultarInspetor(origemOverride = null) {
            try {
                const payload = {
                    __jusgovAcao: 'OCULTAR_INSPETOR_TEMPO_REAL',
                    origemId: origemOverride || this._p_idFrameInspetor
                };
                if (typeof window === 'undefined') return;
                if (window.top && window.top !== window) {
                    try { window.top.postMessage(payload, '*'); } catch (_) { }
                }
                if (window.parent && window.parent !== window && window.parent !== window.top) {
                    try { window.parent.postMessage(payload, '*'); } catch (_) { }
                }
                if (window.frames && window.frames.length > 0) {
                    for (let i = 0; i < window.frames.length; i++) {
                        try { window.frames[i].postMessage({ ...payload, __repassado: true }, '*'); } catch (_) { }
                    }
                }
            } catch (_) { }
        }

        _p_obterDominioCompletoUrl(baseEl, winUi) {
            const extrairHostDeUrl = (urlBruta) => {
                try {
                    if (!urlBruta || typeof urlBruta !== 'string') return '';
                    if (/^about:/i.test(urlBruta)) return '';
                    const u = new URL(urlBruta);
                    if (u.host) return u.host;
                    if (u.protocol === 'file:') return 'file://';
                } catch (_) { }
                return '';
            };
            try {
                const docAlvo = (baseEl && baseEl.ownerDocument) ? baseEl.ownerDocument : (typeof document !== 'undefined' ? document : null);
                const winAlvo = (docAlvo && docAlvo.defaultView) ? docAlvo.defaultView : (typeof window !== 'undefined' ? window : null);
                const candidatos = [];
                if (winAlvo && winAlvo.location && winAlvo.location.href) candidatos.push(winAlvo.location.href);
                if (winUi && winUi.location && winUi.location.href) candidatos.push(winUi.location.href);
                if (docAlvo && docAlvo.referrer) candidatos.push(docAlvo.referrer);
                if (typeof document !== 'undefined' && document.referrer) candidatos.push(document.referrer);
                for (let i = 0; i < candidatos.length; i++) {
                    const host = extrairHostDeUrl(candidatos[i]);
                    if (host) return host;
                }
            } catch (_) { }
            return '';
        }

        atualizarInspetorTempoReal(x, y, alvo, ehCampoEditavelOverride = null) {
            if (typeof document === 'undefined' || !document.body) return;
            const base = (alvo && alvo.nodeType === Node.TEXT_NODE) ? alvo.parentElement : alvo;
            if (!base) {
                this.ocultarInspetorTempoReal();
                this.notificarOutrosFramesOcultarInspetor();
                return;
            }
            if (base.closest && (base.closest('[data-jusgov-inspetor="true"]') || base.closest('#jusgov-inspetor-tempo-real'))) {
                this.ocultarInspetorTempoReal();
                this.notificarOutrosFramesOcultarInspetor();
                return;
            }
            if (base.closest && base.closest('[data-jusgov-ignore="true"]')) {
                this.ocultarInspetorTempoReal();
                return;
            }
            if (base.tagName === 'IFRAME' || base.tagName === 'FRAME' || base.tagName === 'EMBED' || base.tagName === 'OBJECT') {
                this.ocultarInspetorTempoReal();
                this.notificarOutrosFramesOcultarInspetor();
                return;
            }
            this._p_ultimoAlvoValidoInspecionado = base;

            /* Fecha qualquer inspetor antigo local (inclusive órfãos) ou em outros frames antes de renderizar o novo */
            this.ocultarInspetorTempoReal();
            this.notificarOutrosFramesOcultarInspetor();

            const ctxUi = this._p_obterContextoRaizUi();
            const docUi = ctxUi.docUi || document;
            const winUi = ctxUi.winUi || window;

            const painel = docUi.createElement('div');
            painel.id = 'jusgov-inspetor-tempo-real';
            painel.setAttribute('data-jusgov-ignore', 'true');
            painel.setAttribute('data-jusgov-inspetor', 'true');
            painel.setAttribute('data-jusgov-origem-frame', this._p_idFrameInspetor);
            if (typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype) {
                painel.setAttribute('popover', 'manual');
            }
            painel.style.cssText = 'position: fixed !important; left: -9999px; top: -9999px; inset: auto !important; right: auto !important; bottom: auto !important; margin: 0 !important; z-index: 2147483647 !important; isolation: isolate !important; pointer-events: auto !important; cursor: default !important; background: rgba(15, 23, 42, 0.96); color: #f8fafc; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; line-height: 1.45; box-shadow: 0 10px 25px rgba(0,0,0,0.55); max-width: 420px; word-break: break-word;';

            const fecharAoPassarMouse = (ev) => {
                if (ev && ev.isTrusted && ev.type !== 'mousedown' && ev.ctrlKey && ev.altKey && ev.shiftKey) {
                    return;
                }
                try {
                    if (typeof painel.hidePopover === 'function') painel.hidePopover();
                } catch (_) { }
                try {
                    if (painel && painel.parentNode) painel.parentNode.removeChild(painel);
                } catch (_) { }
                this.ocultarInspetorTempoReal();
                this.notificarOutrosFramesOcultarInspetor();
            };
            painel.addEventListener('mouseenter', fecharAoPassarMouse);
            painel.addEventListener('mousemove', fecharAoPassarMouse);
            painel.addEventListener('mousedown', fecharAoPassarMouse);
            docUi.body.appendChild(painel);
            if (typeof painel.showPopover === 'function') {
                try {
                    if (painel.matches && painel.matches(':popover-open')) {
                        painel.hidePopover();
                    }
                    painel.showPopover();
                } catch (_) { }
            }
            this._p_painelInspetorEl = painel;

            const fnCampo = typeof ehCampoEditavelOverride === 'function' ? ehCampoEditavelOverride : this._p_ehCampoEditavelFn;
            const ehCampoEditavel = Boolean(fnCampo(base));
            const diag = this.obterDiagnosticoElemento(base);
            const coresTipo = {
                interface: { nome: 'Interface', cor: '#fbbf24' },
                semiflexivel: { nome: 'SemiFlexível', cor: '#38bdf8' },
                textual: { nome: 'Textual', cor: '#34d399' },
                editavel: { nome: 'Editável', cor: '#c084fc' }
            };
            const infoTipo = coresTipo[diag.tipo] || coresTipo.textual;
            const tag = (base.tagName || '').toLowerCase();
            const idStr = base.id ? ` id="${base.id}"` : '';
            const nameAttr = base.getAttribute ? base.getAttribute('name') : '';
            const nameStr = nameAttr ? ` name="${nameAttr}"` : '';
            const roleAttr = base.getAttribute ? base.getAttribute('role') : '';
            const roleStr = roleAttr ? ` role="${roleAttr}"` : '';
            const typeAttr = base.getAttribute ? base.getAttribute('type') : '';
            const typeStr = typeAttr ? ` type="${typeAttr}"` : '';
            const clsStr = (typeof base.className === 'string' && base.className.trim())
                ? ` class="${base.className.trim().split(/\s+/).slice(0, 4).join(' ')}"`
                : '';

            this._p_painelInspetorEl.replaceChildren();
            const l1 = docUi.createElement('div');
            l1.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px;';
            const badgeTipo = docUi.createElement('span');
            badgeTipo.style.cssText = `font-weight: 700; color: ${ehCampoEditavel ? '#c084fc' : infoTipo.cor};`;
            badgeTipo.textContent = ehCampoEditavel ? '● Campo Editável (Regra de Ouro)' : `● ${infoTipo.nome}`;
            const badgeOrigem = docUi.createElement('span');
            badgeOrigem.style.cssText = 'font-size: 10px; color: #94a3b8; background: #1e293b; padding: 1px 6px; border-radius: 4px;';
            badgeOrigem.textContent = ehCampoEditavel ? 'Edição Nativa' : diag.origem;
            l1.append(badgeTipo, badgeOrigem);

            const l2 = docUi.createElement('div');
            l2.style.cssText = 'font-family: monospace; font-size: 10px; color: #cbd5e1; margin-bottom: 3px;';
            l2.textContent = `Elemento: <${tag}${idStr}${nameStr}${typeStr}${roleStr}${clsStr}>`;
            this._p_painelInspetorEl.append(l1, l2);

            if (ehCampoEditavel) {
                const l3 = docUi.createElement('div');
                l3.style.cssText = 'font-family: monospace; font-size: 10px; font-weight: 700; color: #c084fc;';
                l3.textContent = 'Comportamento: Edição livre (nunca intercepta clique/seleção)';
                this._p_painelInspetorEl.appendChild(l3);
            }

            if (Array.isArray(diag.trilha) && diag.trilha.length > 0) {
                const boxTrilha = docUi.createElement('div');
                boxTrilha.style.cssText = 'font-family: monospace; font-size: 9.5px; margin-top: 5px; border-top: 1px dashed #334155; padding-top: 4px; display: flex; flex-direction: column; gap: 2px;';
                diag.trilha.forEach((etapa) => {
                    const linhaT = docUi.createElement('div');
                    const corEtapa = coresTipo[etapa.tipo] ? coresTipo[etapa.tipo].cor : '#94a3b8';
                    const nomeEtapa = coresTipo[etapa.tipo] ? coresTipo[etapa.tipo].nome : etapa.tipo;
                    const tagParada = etapa.parou ? ' [PAROU]' : (etapa.passo.startsWith('4.') ? ' [continua]' : '');
                    const textoEtapa = etapa.descricao
                        ? `${etapa.passo}: ${etapa.descricao} → ${nomeEtapa}${tagParada}`
                        : `${etapa.passo}: ${nomeEtapa}${tagParada}`;
                    if (etapa.decisivo && !ehCampoEditavel) {
                        linhaT.style.cssText = `color: #f8fafc; background: rgba(56, 189, 248, 0.14); border-left: 2px solid ${corEtapa}; padding: 1px 5px; border-radius: 3px; font-weight: 700;`;
                        linhaT.textContent = `★ ${textoEtapa}`;
                    } else {
                        linhaT.style.cssText = 'color: #94a3b8; padding-left: 7px;';
                        linhaT.textContent = `• ${textoEtapa}`;
                    }
                    boxTrilha.appendChild(linhaT);

                    if (etapa.observacao) {
                        const linhaObs = docUi.createElement('div');
                        linhaObs.style.cssText = 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #fbbf24; font-style: italic; padding-left: 14px; margin-bottom: 2px;';
                        linhaObs.textContent = `Obs: ${etapa.observacao}`;
                        boxTrilha.appendChild(linhaObs);
                    }
                });
                this._p_painelInspetorEl.appendChild(boxTrilha);
            }

            const dominioCompleto = this._p_obterDominioCompletoUrl(base, winUi);
            if (dominioCompleto) {
                const barraStatus = docUi.createElement('div');
                barraStatus.style.cssText = 'font-family: monospace; font-size: 9.5px; color: #94a3b8; margin-top: 5px; border-top: 1px solid #334155; padding-top: 3px; display: flex; align-items: center; justify-content: space-between; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                const spanDom = docUi.createElement('span');
                spanDom.style.cssText = 'color: #7dd3fc; overflow: hidden; text-overflow: ellipsis;';
                spanDom.textContent = `🌐 ${dominioCompleto}`;
                barraStatus.appendChild(spanDom);
                this._p_painelInspetorEl.appendChild(barraStatus);
            }

            const rectPainel = this._p_painelInspetorEl.getBoundingClientRect();
            const larguraPainel = rectPainel.width || 420;
            const alturaPainel = rectPainel.height || 200;
            const margemTela = 8;
            const deslocamentoCursor = 16;
            const vwUi = Math.max(winUi.innerWidth || 0, docUi.documentElement ? docUi.documentElement.clientWidth : 0, 320);
            const vhUi = Math.max(winUi.innerHeight || 0, docUi.documentElement ? docUi.documentElement.clientHeight : 0, 240);
            const xTela = x + ctxUi.offsetX;
            const yTela = y + ctxUi.offsetY;

            let left = xTela + deslocamentoCursor;
            if (left + larguraPainel > vwUi - margemTela) {
                left = xTela - larguraPainel - deslocamentoCursor;
            }
            left = Math.max(margemTela, Math.min(left, vwUi - larguraPainel - margemTela));

            let top = yTela + deslocamentoCursor;
            if (top + alturaPainel > vhUi - margemTela) {
                top = yTela - alturaPainel - deslocamentoCursor;
            }
            top = Math.max(margemTela, Math.min(top, vhUi - alturaPainel - margemTela));

            this._p_painelInspetorEl.style.left = `${Math.round(left)}px`;
            this._p_painelInspetorEl.style.top = `${Math.round(top)}px`;
        }

        obterDiagnosticoRegraDetalhado(el, apenasUsuario = false) {
            if (!el) return null;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return null;
            const grupos = apenasUsuario
                ? [{ origem: 'Regra do Usuário', lista: this._p_regrasUsuario }]
                : [
                    { origem: 'Regra do Usuário', lista: this._p_regrasUsuario },
                    { origem: 'Regra Interna', lista: this._p_regrasInternas }
                ];
            let achado = null;
            const historico = [];
            for (let g = 0; g < grupos.length; g++) {
                const { origem, lista } = grupos[g];
                if (!Array.isArray(lista) || lista.length === 0) continue;
                let deveParar = false;
                for (let i = 0; i < lista.length; i++) {
                    const regra = lista[i];
                    if (!regra || regra.ativo === false || !regra.expressao) continue;
                    const herdar = regra.herdarFilhos !== false;
                    if (this.elementoCorrespondeRegraMapeamento(base, regra.expressao, herdar, regra.tipoSeletor || '')) {
                        const parou = (regra.continuarProxima !== true);
                        const item = {
                            tipo: regra.tipo || 'semiflexivel',
                            origem,
                            regra: regra.expressao,
                            tipoSeletor: regra.tipoSeletor || '',
                            observacao: regra.observacao || '',
                            parou
                        };
                        achado = item;
                        historico.push(item);
                        if (parou) {
                            deveParar = true;
                            break;
                        }
                    }
                }
                if (deveParar || achado !== null) break;
            }
            if (achado) {
                achado.historico = historico;
            }
            return achado;
        }

        obterDiagnosticoElemento(el) {
            const diag = {
                tipo: 'textual',
                origem: 'Padrão (Texto)',
                rotuloDetalhe: 'Motivo',
                detalhe: 'Textual',
                observacao: '',
                trilha: []
            };
            if (!el) {
                diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
                return diag;
            }
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) {
                diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
                return diag;
            }

            const registrarEtapa = (passo, descricao, tipo, parou = false, observacao = '') => {
                diag.trilha.forEach((t) => { t.decisivo = false; });
                diag.trilha.push({ passo, descricao, tipo, parou, observacao, decisivo: true });
            };

            if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                try {
                    const cur = window.getComputedStyle(base).cursor;
                    if (cur === 'text' || cur === 'vertical-text' || cur === 'cell') {
                        diag.tipo = 'textual';
                        diag.origem = 'Cursor do Mouse';
                        diag.rotuloDetalhe = 'Cursor CSS';
                        diag.detalhe = `cursor: ${cur}`;
                        registrarEtapa('1. Mouse', `cursor: ${cur}`, 'textual', false);
                    } else if (cur === 'default' || cur === 'arrow' || cur === 'context-menu') {
                        diag.tipo = 'semiflexivel';
                        diag.origem = 'Cursor do Mouse';
                        diag.rotuloDetalhe = 'Cursor CSS';
                        diag.detalhe = `cursor: ${cur}`;
                        registrarEtapa('1. Mouse', `cursor: ${cur}`, 'semiflexivel', false);
                    } else if (cur === 'pointer' || cur === 'not-allowed' || cur === 'grabbing' || cur === 'grab' || cur === 'progress' || cur === 'help') {
                        diag.tipo = 'interface';
                        diag.origem = 'Cursor do Mouse';
                        diag.rotuloDetalhe = 'Cursor CSS';
                        diag.detalhe = `cursor: ${cur}`;
                        registrarEtapa('1. Mouse', `cursor: ${cur}`, 'interface', false);
                    }
                } catch (_) { }
            }

            const motivoEvento = this.temEventosAssociadosAoObjeto(base);
            if (motivoEvento) {
                diag.tipo = 'interface';
                diag.origem = 'Eventos / Controle';
                diag.rotuloDetalhe = 'Gatilho';
                diag.detalhe = motivoEvento;
                registrarEtapa('2. Evento JS', motivoEvento, 'interface', false);
            }

            if (diag.tipo !== 'interface') {
                /* BUG-66: Rótulos (<label>), controles nativos e células/contêineres de formulário/tabela cujo conteúdo
                 * pertence a <label>/controles (ex.: espaço vazio à direita ou logo abaixo do <label>) devem ser
                 * classificados como 'interface' ("elemento central"), nunca como 'textual'. */
                try {
                    const seletorControle = 'label, input, select, textarea, button, option, fieldset, legend, [role="checkbox"], [role="radio"], [role="switch"], [role="button"]';
                    const tagB = (base.tagName || '').toUpperCase();
                    if (typeof base.matches === 'function' && base.matches(seletorControle)) {
                        diag.tipo = 'interface';
                        diag.origem = 'Controle / Rótulo';
                        diag.rotuloDetalhe = 'Elemento UI';
                        diag.detalhe = `<${tagB.toLowerCase()}>`;
                        registrarEtapa('3. Heurística', `controle/rótulo <${tagB.toLowerCase()}>`, 'interface', false);
                    } else if (
                        !['P', 'ARTICLE', 'BLOCKQUOTE', 'PRE', 'CODE', 'BODY', 'HTML', 'MAIN'].includes(tagB) &&
                        typeof base.querySelector === 'function' &&
                        base.querySelector('label, input, select, textarea, [role="checkbox"], [role="radio"], [role="switch"]')
                    ) {
                        const temParagrafoLeitura = Boolean(base.querySelector('p, article, blockquote, pre'));
                        if (!temParagrafoLeitura) {
                            const txtForaControles = (() => {
                                let soma = 0;
                                const children = base.childNodes || [];
                                for (let c = 0; c < children.length; c++) {
                                    const ch = children[c];
                                    if (!ch) continue;
                                    if (ch.nodeType === Node.TEXT_NODE) {
                                        soma += (ch.nodeValue || '').trim().length;
                                    } else if (ch.nodeType === Node.ELEMENT_NODE && typeof ch.matches === 'function' && !ch.matches(seletorControle + ', a[href], br')) {
                                        if (!ch.querySelector || !ch.querySelector(seletorControle)) {
                                            soma += (ch.textContent || '').trim().length;
                                        }
                                    }
                                }
                                return soma;
                            })();
                            if (txtForaControles < 25) {
                                diag.tipo = 'interface';
                                diag.origem = 'Contêiner de Formulário';
                                diag.rotuloDetalhe = 'Layout UI';
                                diag.detalhe = `<${tagB.toLowerCase()}> com controles/rótulos`;
                                registrarEtapa('3. Heurística', `entorno de formulário em <${tagB.toLowerCase()}>`, 'interface', false);
                            }
                        }
                    }
                } catch (_) { }
            }

            if (diag.tipo !== 'interface') {
                try {
                    const stExtra = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
                        ? window.getComputedStyle(base)
                        : null;
                    const us = stExtra ? (stExtra.userSelect || stExtra.webkitUserSelect) : '';
                    const tabIdx = base.getAttribute ? base.getAttribute('tabindex') : null;
                    if (us === 'none') {
                        diag.tipo = 'interface';
                        diag.origem = 'Heurística Browser';
                        diag.rotuloDetalhe = 'Heurística';
                        diag.detalhe = 'user-select: none';
                        registrarEtapa('3. Heurística', 'user-select: none', 'interface', false);
                    } else if (tabIdx === '0') {
                        diag.tipo = 'interface';
                        diag.origem = 'Heurística Browser';
                        diag.rotuloDetalhe = 'Heurística';
                        diag.detalhe = 'tabindex="0"';
                        registrarEtapa('3. Heurística', 'tabindex="0"', 'interface', false);
                    } else {
                        const tagB = (base.tagName || '').toUpperCase();
                        const ehParagrafo = tagB === 'P' || tagB === 'ARTICLE' || tagB === 'BLOCKQUOTE';
                        const ehTagDocumentalSemTextoDireto = TAGS_DOCUMENTAIS_SEMPRE_LEITURA.has(tagB);
                        const ehEditavelDireto = Boolean(
                            (typeof this._p_ehCampoEditavelFn === 'function' && this._p_ehCampoEditavelFn(base)) ||
                            (typeof base.matches === 'function' && base.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"]), rich-textarea, [role="textbox"], [role="searchbox"]'))
                        );
                        if (!ehEditavelDireto && !ehTagDocumentalSemTextoDireto && !this._p_temTextoDiretoVisivel(base)) {
                            diag.tipo = 'interface';
                            diag.origem = 'Heurística Estrutural';
                            diag.rotuloDetalhe = 'Sem Texto Direto';
                            diag.detalhe = `<${tagB.toLowerCase()}> apenas estrutural/propriedades`;
                            registrarEtapa('3. Heurística', `sem texto direto <${tagB.toLowerCase()}>`, 'interface', false);
                        } else {
                            const txt = (base.textContent || '').trim();
                            if (!ehParagrafo && txt.length > 0 && txt.length <= 80 && !txt.includes('\n')) {
                                const temMascara = /\b(\d{2}\/\d{2}\/\d{4}|\d{2}:\d{2}(?::\d{2})?|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})\b/.test(txt);
                                if (temMascara) {
                                    diag.tipo = 'semiflexivel';
                                    diag.origem = 'Heurística Browser';
                                    diag.rotuloDetalhe = 'Heurística';
                                    diag.detalhe = 'Texto curto com máscara forense';
                                    registrarEtapa('3. Heurística', 'máscara forense curta', 'semiflexivel', false);
                                }
                            } else if (txt.length > 100) {
                                diag.tipo = 'textual';
                                diag.origem = 'Heurística Browser';
                                diag.rotuloDetalhe = 'Heurística';
                                diag.detalhe = `Bloco de texto longo (${txt.length} chars)`;
                                registrarEtapa('3. Heurística', `texto longo (${txt.length} chars)`, 'textual', false);
                            }
                        }
                    }
                } catch (_) { }
            }

            const regraDetalhe = this.obterDiagnosticoRegraDetalhado(base);
            if (regraDetalhe) {
                const ehProtecaoSemTextoDiretoBasico = (
                    diag.tipo === 'interface' &&
                    diag.rotuloDetalhe === 'Sem Texto Direto' &&
                    regraDetalhe.origem === 'Regra Interna' &&
                    regraDetalhe.tipo === 'textual' &&
                    !/pdf|cke_editable|textLayer|downloadBinario/i.test(String(regraDetalhe.regra || ''))
                );
                const rebaixadoPorRegraInterna = (
                    (
                        diag.tipo === 'interface' &&
                        (diag.origem === 'Contêiner de Formulário' || diag.origem === 'Controle / Rótulo') &&
                        regraDetalhe.origem === 'Regra Interna' &&
                        regraDetalhe.tipo === 'textual'
                    ) ||
                    ehProtecaoSemTextoDiretoBasico
                );
                if (!rebaixadoPorRegraInterna) {
                    diag.tipo = regraDetalhe.tipo;
                    diag.origem = regraDetalhe.origem;
                    diag.rotuloDetalhe = 'Regra';
                    diag.detalhe = `${regraDetalhe.tipoSeletor ? '[' + regraDetalhe.tipoSeletor + '] ' : ''}${regraDetalhe.regra}`;
                    diag.observacao = regraDetalhe.observacao || '';
                    const listaHist = Array.isArray(regraDetalhe.historico) && regraDetalhe.historico.length > 0
                        ? regraDetalhe.historico
                        : [regraDetalhe];
                    for (let h = 0; h < listaHist.length; h++) {
                        const itemH = listaHist[h];
                        const prefixoSel = itemH.tipoSeletor ? `[${itemH.tipoSeletor}] ` : '';
                        registrarEtapa(`4. ${itemH.origem}`, `${prefixoSel}${itemH.regra}`, itemH.tipo, Boolean(itemH.parou), itemH.observacao || '');
                    }
                }
            }

            if (diag.trilha.length === 0) {
                diag.trilha.push({ passo: '0. Padrão', descricao: '', tipo: 'textual', parou: false, observacao: '', decisivo: true });
            }
            return diag;
        }
    }

    Object.freeze(XPathInspetorUi.prototype);
    return Object.freeze(XPathInspetorUi);
}));
