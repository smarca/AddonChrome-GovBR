/* ==========================================================================
 * Nome do arquivo: copia-regras-inspetor.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Grupo 1 - CÓPIA INTELIGENTE & FORENSE (Mapeamento XPath/CSS & Inspetor)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-regras-inspetor.js
 * - Classe Exportada: RegrasEInspetorDOM (window.JusGovRegrasEInspetor)
 * - Métodos Públicos: carregarRegrasInternas, definirRegrasUsuario, obterRegrasUsuario,
 *   definirRegrasInternas, adicionarRegrasUsuario, limparCache, elementoCorrespondeXPath,
 *   elementoCorrespondeCss, normalizarExpressaoAtributoCss, validarExpressaoSeletor,
 *   elementoCorrespondeRegraMapeamento, obterClassificacaoRegraCustomizada, descreverNoCurto,
 *   temEventosAssociadosAoObjeto, resolverTipoElementoPorPrioridade,
 *   obterDiagnosticoRegraDetalhado, obterDiagnosticoElemento, ocultarInspetorTempoReal,
 *   notificarOutrosFramesOcultarInspetor, atualizarInspetorTempoReal, temPainelInspetorVisivel,
 *   obterIdFrameInspetor
 * - Regras / Seções: Seção 6.20, Seção 6.85, Seção 6.121 (interface.json),
 *   Seção 6.134 (XPath/CSS cross-frame), Seção 6.144 (Google Wiz jsaction),
 *   ADR-009 (Soberania das Regras do Usuário), ADR-011 (IPC OBTER_JSON_ESTATICO)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) SOBERANIA E ORDEM DE AVALIAÇÃO: Regras do Usuário são avaliadas sempre antes
 *    das regras internas (src/cfg/interface.json); cada regra aplica 'continuarProxima'
 *    para encerrar ou acumular diagnósticos.
 * 2) CROSS-FRAME & CACHE TTL 16ms: XPath/CSS inspecionam document.evaluate/matches/closest
 *    e sobem até frameElement pai quando 'herdarFilhos' estiver ativo; cache de 16ms acelera
 *    mousemove do inspetor.
 * 3) INSPETOR MULTI-FRAME: Mantém ID único por frame (ID_FRAME_INSPETOR_ATUAL), envia
 *    postMessage de ocultação para pai/filhos e reposiciona automaticamente na borda
 *    direita/inferior do viewport.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovRegrasEInspetor = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PADROES_FABRICA_REGRAS_MAPEAMENTO = Object.freeze([]);
    const ATRIBUTOS_CLIQUE_JS = new Set([
        'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onpointerdown', 'onpointerup',
        '(click)', '@click', 'v-on:click', 'ng-click', 'routerlink'
    ]);
    const TAGS_ESTRUTURAIS_WIZ = new Set(['c-wiz', 'c-data', 'main', 'section', 'article']);
    const RX_JSACTION_CLIQUE = /(?:^|[;\s])(?:click|dblclick|mousedown|mouseup|pointerdown|pointerup|tap)\s*:/i;

    class RegrasEInspetorDOM {
        #regrasUsuario = [];
        #regrasInternas = [];
        #cacheEl = null;
        #cacheTs = 0;
        #cacheRes = null;
        #painelInspetorEl = null;
        #idFrameInspetor = 'jusgov_insp_' + Math.random().toString(36).slice(2);
        #ehCampoEditavelFn = () => false;

        constructor(opcoes = {}) {
            if (opcoes && typeof opcoes.ehCampoEditavelFn === 'function') {
                this.#ehCampoEditavelFn = opcoes.ehCampoEditavelFn;
            }
            this.carregarRegrasInternas();
        }

        definirEhCampoEditavelFn(fn) {
            if (typeof fn === 'function') {
                this.#ehCampoEditavelFn = fn;
            }
        }

        limparCache() {
            this.#cacheEl = null;
            this.#cacheTs = 0;
            this.#cacheRes = null;
        }

        obterIdFrameInspetor() {
            return this.#idFrameInspetor;
        }

        temPainelInspetorVisivel() {
            return Boolean(this.#painelInspetorEl);
        }

        carregarRegrasInternas() {
            const aplicarRegrasInterface = (dados) => {
                if (Array.isArray(dados)) {
                    this.#regrasInternas = dados.filter(r => r && r.origem !== 'usuario');
                    this.limparCache();
                }
            };
            try {
                if (typeof window !== 'undefined' && Array.isArray(window.__JUSGOV_INTERFACE_JSON__)) {
                    aplicarRegrasInterface(window.__JUSGOV_INTERFACE_JSON__);
                    return;
                }
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    const tentarIpc = () => {
                        if (typeof chrome.runtime.sendMessage !== 'function') return;
                        try {
                            chrome.runtime.sendMessage({ acao: 'OBTER_JSON_ESTATICO', arquivo: 'interface.json' }, (resp) => {
                                if (chrome.runtime && chrome.runtime.lastError) return;
                                if (resp && resp.ok && Array.isArray(resp.dados)) {
                                    aplicarRegrasInterface(resp.dados);
                                }
                            });
                        } catch (_) { }
                    };
                    if (typeof chrome.runtime.getURL === 'function' && typeof fetch === 'function') {
                        fetch(chrome.runtime.getURL('src/cfg/interface.json'))
                            .then((resp) => (resp && resp.ok ? resp.json() : null))
                            .then((dados) => {
                                if (Array.isArray(dados)) {
                                    aplicarRegrasInterface(dados);
                                } else {
                                    tentarIpc();
                                }
                            })
                            .catch(tentarIpc);
                    } else {
                        tentarIpc();
                    }
                }
            } catch (_) { }
        }

        definirRegrasUsuario(novasRegras) {
            this.#regrasUsuario = Array.isArray(novasRegras) ? [...novasRegras] : [...PADROES_FABRICA_REGRAS_MAPEAMENTO];
            this.limparCache();
        }

        obterRegrasUsuario() {
            return this.#regrasUsuario;
        }

        adicionarRegrasUsuario(novasRegras) {
            if (!Array.isArray(novasRegras) || novasRegras.length === 0) return;
            this.#regrasUsuario.push(...novasRegras);
            this.limparCache();
        }

        definirRegrasInternas(regras) {
            this.#regrasInternas = Array.isArray(regras) ? [...regras] : [];
            this.limparCache();
        }

        elementoCorrespondeXPath(el, expressaoXPath, herdarFilhos = true) {
            if (!el || typeof expressaoXPath !== 'string' || !expressaoXPath.trim()) return false;
            const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
            if (!doc || typeof doc.evaluate !== 'function') return false;
            try {
                const expr = expressaoXPath.trim();
                const snap = doc.evaluate(expr, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (!snap || snap.snapshotLength === 0) return false;
                for (let i = 0; i < snap.snapshotLength; i++) {
                    const no = snap.snapshotItem(i);
                    if (!no) continue;
                    if (no === el) return true;
                    if (herdarFilhos && typeof no.contains === 'function' && no.contains(el)) return true;
                }
                if (herdarFilhos && doc.defaultView && doc.defaultView.frameElement) {
                    const frameEl = doc.defaultView.frameElement;
                    const parentDoc = frameEl.ownerDocument;
                    if (parentDoc && typeof parentDoc.evaluate === 'function') {
                        const snapParent = parentDoc.evaluate(expr, parentDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        for (let j = 0; j < (snapParent ? snapParent.snapshotLength : 0); j++) {
                            const noParent = snapParent.snapshotItem(j);
                            if (noParent && (noParent === frameEl || (typeof noParent.contains === 'function' && noParent.contains(frameEl)))) {
                                return true;
                            }
                        }
                    }
                }
            } catch (_) { }
            return false;
        }

        elementoCorrespondeCss(el, seletorCss, herdarFilhos = true) {
            if (!el || typeof seletorCss !== 'string' || !seletorCss.trim()) return false;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return false;
            try {
                const sel = seletorCss.trim();
                if (typeof base.matches === 'function' && base.matches(sel)) return true;
                if (herdarFilhos && typeof base.closest === 'function' && base.closest(sel)) return true;
                if (herdarFilhos) {
                    let winAtual = base.ownerDocument && base.ownerDocument.defaultView;
                    while (winAtual && winAtual.frameElement) {
                        const frameEl = winAtual.frameElement;
                        if (typeof frameEl.matches === 'function' && frameEl.matches(sel)) return true;
                        if (typeof frameEl.closest === 'function' && frameEl.closest(sel)) return true;
                        winAtual = frameEl.ownerDocument && frameEl.ownerDocument.defaultView;
                    }
                }
            } catch (_) { }
            return false;
        }

        normalizarExpressaoAtributoCss(expressao, tipoSeletor = '') {
            if (typeof expressao !== 'string') return '';
            let expr = expressao.trim();
            const ehXPath = (typeof tipoSeletor === 'string' && tipoSeletor.toLowerCase().includes('xpath')) || expr.startsWith('/') || expr.startsWith('(');
            if (!ehXPath && !expr.startsWith('[') && /^[a-zA-Z_][\w-]*(?:\^|\*|\$|~|\|)?=/.test(expr)) {
                if (/^[a-zA-Z_][\w-]*=$/.test(expr)) {
                    expr = `[${expr.slice(0, -1)}]`;
                } else {
                    const m = expr.match(/^([a-zA-Z_][\w-]*(?:\^|\*|\$|~|\|)?=)(.+)$/);
                    if (m) {
                        const val = m[2].trim();
                        const jaAspas = (val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"));
                        expr = `[${m[1]}${jaAspas ? val : `"${val.replace(/"/g, '\\"')}"`}]`;
                    }
                }
            }
            return expr;
        }

        validarExpressaoSeletor(expressao, tipoSeletor = '') {
            if (typeof expressao !== 'string' || !expressao.trim()) return false;
            const expr = this.normalizarExpressaoAtributoCss(expressao, tipoSeletor);
            try {
                const ehXPath = (typeof tipoSeletor === 'string' && tipoSeletor.toLowerCase().includes('xpath')) || expr.startsWith('/') || expr.startsWith('(');
                if (ehXPath) {
                    if (typeof document !== 'undefined' && typeof document.evaluate === 'function') {
                        document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
                    }
                    return true;
                }
                if (typeof document !== 'undefined' && typeof document.createDocumentFragment === 'function') {
                    document.createDocumentFragment().querySelector(expr);
                }
                return true;
            } catch (_) {
                return false;
            }
        }

        elementoCorrespondeRegraMapeamento(el, expressao, herdarFilhos = true, tipoSeletor = '') {
            if (!el || typeof expressao !== 'string' || !expressao.trim()) return false;
            try {
                const expr = this.normalizarExpressaoAtributoCss(expressao, tipoSeletor);
                if (!expr) return false;
                if (expr.startsWith('/') || expr.startsWith('(')) {
                    return this.elementoCorrespondeXPath(el, expr, herdarFilhos);
                }
                if (/^document\.querySelector/i.test(expr)) {
                    const m = expr.match(/^document\.querySelector(?:All)?\(\s*['"`](.*?)['"`]\s*\)/i);
                    if (m && m[1]) {
                        return this.elementoCorrespondeCss(el, m[1], herdarFilhos);
                    }
                }
                return this.elementoCorrespondeCss(el, expr, herdarFilhos);
            } catch (_) {
                return false;
            }
        }

        obterClassificacaoRegraCustomizada(el, apenasUsuario = false) {
            if (!el) return null;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return null;

            if (!apenasUsuario) {
                const agora = Date.now();
                if (base === this.#cacheEl && (agora - this.#cacheTs) < 16) {
                    return this.#cacheRes;
                }
                const det = this.obterDiagnosticoRegraDetalhado(base, false);
                const resultado = det ? det.tipo : null;
                this.#cacheEl = base;
                this.#cacheTs = agora;
                this.#cacheRes = resultado;
                return resultado;
            }

            const detUsuario = this.obterDiagnosticoRegraDetalhado(base, true);
            return detUsuario ? detUsuario.tipo : null;
        }

        descreverNoCurto(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            const tag = (el.tagName || '').toLowerCase();
            const idSufixo = el.id ? `#${el.id}` : '';
            const clsStr = (typeof el.className === 'string' && el.className.trim())
                ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
                : '';
            return `<${tag}${idSufixo}${clsStr}>`;
        }

        temEventosAssociadosAoObjeto(el) {
            if (!el) return null;
            let atual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            let profundidade = 0;

            while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 2) {
                profundidade++;
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    const descNo = this.descreverNoCurto(atual);
                    const onde = profundidade === 1 ? 'no elemento' : `no ancestral +${profundidade - 1}`;

                    if (atual.onclick) return `evento JS onclick em ${descNo} (${onde})`;
                    if (atual.ondblclick) return `evento JS ondblclick em ${descNo} (${onde})`;
                    if (atual.onmousedown) return `evento JS onmousedown em ${descNo} (${onde})`;
                    if (atual.onmouseup) return `evento JS onmouseup em ${descNo} (${onde})`;
                    if (atual.onpointerdown) return `evento JS onpointerdown em ${descNo} (${onde})`;
                    if (atual.onpointerup) return `evento JS onpointerup em ${descNo} (${onde})`;

                    if (atual.attributes && atual.attributes.length > 0) {
                        const tagAtual = (atual.tagName || '').toLowerCase();
                        for (let a = 0; a < atual.attributes.length; a++) {
                            const attrNome = (atual.attributes[a].name || '').toLowerCase();
                            if (ATRIBUTOS_CLIQUE_JS.has(attrNome)) {
                                return `atributo ${attrNome} em ${descNo} (${onde})`;
                            }
                            const jsActionEmWrapperCurto = (
                                profundidade === 2 &&
                                !TAGS_ESTRUTURAIS_WIZ.has(tagAtual) &&
                                (!atual.querySelector || !atual.querySelector('p, h1, h2, h3, h4, h5, h6, article, section, main, pre, code, table')) &&
                                String(atual.textContent || '').trim().length <= 80
                            );
                            if (attrNome === 'jsaction' && !TAGS_ESTRUTURAIS_WIZ.has(tagAtual) && (profundidade === 1 || jsActionEmWrapperCurto)) {
                                const valJsAction = String(atual.attributes[a].value || '');
                                if (RX_JSACTION_CLIQUE.test(valJsAction)) {
                                    return `atributo jsaction (clique) em ${descNo} (${onde})`;
                                }
                            }
                        }
                    }
                }
                atual = atual.parentElement || (atual.getRootNode && atual.getRootNode().host) || null;
            }
            return null;
        }

        resolverTipoElementoPorPrioridade(el) {
            return this.obterDiagnosticoElemento(el).tipo;
        }

        obterDiagnosticoRegraDetalhado(el, apenasUsuario = false) {
            if (!el) return null;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return null;
            const grupos = apenasUsuario
                ? [{ origem: 'Regra do Usuário', lista: this.#regrasUsuario }]
                : [
                    { origem: 'Regra do Usuário', lista: this.#regrasUsuario },
                    { origem: 'Regra Interna', lista: this.#regrasInternas }
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
                } catch (_) { }
            }

            const regraDetalhe = this.obterDiagnosticoRegraDetalhado(base);
            if (regraDetalhe) {
                const rebaixadoPorRegraInterna = (
                    diag.tipo === 'interface' &&
                    (diag.origem === 'Contêiner de Formulário' || diag.origem === 'Controle / Rótulo') &&
                    regraDetalhe.origem === 'Regra Interna' &&
                    regraDetalhe.tipo === 'textual'
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

        ocultarInspetorTempoReal() {
            if (this.#painelInspetorEl && this.#painelInspetorEl.parentNode) {
                this.#painelInspetorEl.parentNode.removeChild(this.#painelInspetorEl);
            }
            this.#painelInspetorEl = null;
        }

        notificarOutrosFramesOcultarInspetor() {
            try {
                const payload = { __jusgovAcao: 'OCULTAR_INSPETOR_TEMPO_REAL', origemId: this.#idFrameInspetor };
                if (window.top && window.top !== window) {
                    window.top.postMessage(payload, '*');
                } else if (window.frames && window.frames.length > 0) {
                    for (let i = 0; i < window.frames.length; i++) {
                        try { window.frames[i].postMessage(payload, '*'); } catch (_) { }
                    }
                }
            } catch (_) { }
        }

        atualizarInspetorTempoReal(x, y, alvo, ehCampoEditavelOverride = null) {
            if (typeof document === 'undefined' || !document.body) return;
            const base = (alvo && alvo.nodeType === Node.TEXT_NODE) ? alvo.parentElement : alvo;
            if (!base || (base.closest && base.closest('[data-jusgov-ignore="true"]'))) return;
            if (base.tagName === 'IFRAME' || base.tagName === 'FRAME') {
                this.ocultarInspetorTempoReal();
                return;
            }

            this.notificarOutrosFramesOcultarInspetor();

            if (!this.#painelInspetorEl) {
                this.#painelInspetorEl = document.createElement('div');
                this.#painelInspetorEl.id = 'jusgov-inspetor-tempo-real';
                this.#painelInspetorEl.setAttribute('data-jusgov-ignore', 'true');
                this.#painelInspetorEl.style.cssText = 'position: fixed; z-index: 2147483647; pointer-events: none; background: rgba(15, 23, 42, 0.96); color: #f8fafc; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; line-height: 1.45; box-shadow: 0 10px 25px rgba(0,0,0,0.55); max-width: 420px; word-break: break-word;';
                document.body.appendChild(this.#painelInspetorEl);
            }

            const fnCampo = typeof ehCampoEditavelOverride === 'function' ? ehCampoEditavelOverride : this.#ehCampoEditavelFn;
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

            this.#painelInspetorEl.replaceChildren();
            const l1 = document.createElement('div');
            l1.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px;';
            const badgeTipo = document.createElement('span');
            badgeTipo.style.cssText = `font-weight: 700; color: ${ehCampoEditavel ? '#c084fc' : infoTipo.cor};`;
            badgeTipo.textContent = ehCampoEditavel ? '● Campo Editável (Regra de Ouro)' : `● ${infoTipo.nome}`;
            const badgeOrigem = document.createElement('span');
            badgeOrigem.style.cssText = 'font-size: 10px; color: #94a3b8; background: #1e293b; padding: 1px 6px; border-radius: 4px;';
            badgeOrigem.textContent = ehCampoEditavel ? 'Edição Nativa' : diag.origem;
            l1.append(badgeTipo, badgeOrigem);

            const l2 = document.createElement('div');
            l2.style.cssText = 'font-family: monospace; font-size: 10px; color: #cbd5e1; margin-bottom: 3px;';
            l2.textContent = `Elemento: <${tag}${idStr}${nameStr}${typeStr}${roleStr}${clsStr}>`;
            this.#painelInspetorEl.append(l1, l2);

            if (ehCampoEditavel) {
                const l3 = document.createElement('div');
                l3.style.cssText = 'font-family: monospace; font-size: 10px; font-weight: 700; color: #c084fc;';
                l3.textContent = 'Comportamento: Edição livre (nunca intercepta clique/seleção)';
                this.#painelInspetorEl.appendChild(l3);
            }

            if (Array.isArray(diag.trilha) && diag.trilha.length > 0) {
                const boxTrilha = document.createElement('div');
                boxTrilha.style.cssText = 'font-family: monospace; font-size: 9.5px; margin-top: 5px; border-top: 1px dashed #334155; padding-top: 4px; display: flex; flex-direction: column; gap: 2px;';
                diag.trilha.forEach((etapa) => {
                    const linhaT = document.createElement('div');
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
                        const linhaObs = document.createElement('div');
                        linhaObs.style.cssText = 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #fbbf24; font-style: italic; padding-left: 14px; margin-bottom: 2px;';
                        linhaObs.textContent = `Obs: ${etapa.observacao}`;
                        boxTrilha.appendChild(linhaObs);
                    }
                });
                this.#painelInspetorEl.appendChild(boxTrilha);
            }

            const rectPainel = this.#painelInspetorEl.getBoundingClientRect();
            const larguraPainel = rectPainel.width || 420;
            const alturaPainel = rectPainel.height || 200;
            const margemTela = 8;
            const deslocamentoCursor = 16;

            let left = x + deslocamentoCursor;
            if (left + larguraPainel > window.innerWidth - margemTela) {
                left = x - larguraPainel - deslocamentoCursor;
            }
            left = Math.max(margemTela, Math.min(left, window.innerWidth - larguraPainel - margemTela));

            let top = y + deslocamentoCursor;
            if (top + alturaPainel > window.innerHeight - margemTela) {
                top = y - alturaPainel - deslocamentoCursor;
            }
            top = Math.max(margemTela, Math.min(top, window.innerHeight - alturaPainel - margemTela));

            this.#painelInspetorEl.style.left = `${Math.round(left)}px`;
            this.#painelInspetorEl.style.top = `${Math.round(top)}px`;
        }
    }

    return Object.freeze(RegrasEInspetorDOM);
}));
