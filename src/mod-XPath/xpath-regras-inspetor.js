/* ==========================================================================
 * ARQUIVO: src/mod-XPath/xpath-regras-inspetor.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-XPATH — Mapeamento Manual Avançado Global (XPath/CSS & Inspetor)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-XPath/xpath-regras-inspetor.js
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
    const TAGS_DOCUMENTAIS_SEMPRE_LEITURA = new Set([
        'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE',
        'LI', 'DT', 'DD', 'TD', 'TH', 'CAPTION', 'B', 'STRONG', 'I', 'EM', 'U',
        'INS', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP', 'MARK', 'SMALL', 'ABBR',
        'CITE', 'Q', 'DFN', 'KBD', 'SAMP', 'VAR', 'ARTICLE', 'SECTION', 'MAIN',
        'HTML', 'BODY'
    ]);
    const RX_JSACTION_CLIQUE = /(?:^|[;\s])(?:click|dblclick|mousedown|mouseup|pointerdown|pointerup|tap)\s*:/i;

    class RegrasEInspetorDOM {
        _p_regrasUsuario = [];
        _p_regrasInternas = [];
        _p_ultimoAlvoValidoInspecionado = null;
        _p_cacheEl = null;
        _p_cacheTs = 0;
        _p_cacheRes = null;
        _p_painelInspetorEl = null;
        _p_idFrameInspetor = 'jusgov_insp_' + Math.random().toString(36).slice(2);
        _p_ehCampoEditavelFn = () => false;

        constructor(opcoes = {}) {
            if (opcoes && typeof opcoes.ehCampoEditavelFn === 'function') {
                this._p_ehCampoEditavelFn = opcoes.ehCampoEditavelFn;
            }
            this.carregarRegrasInternas();
        }

        definirEhCampoEditavelFn(fn) {
            if (typeof fn === 'function') {
                this._p_ehCampoEditavelFn = fn;
            }
        }

        limparCache() {
            this._p_cacheEl = null;
            this._p_cacheTs = 0;
            this._p_cacheRes = null;
        }

        obterIdFrameInspetor() {
            return this._p_idFrameInspetor;
        }

        obterUltimoAlvoValidoInspecionado() {
            try {
                if (this._p_ultimoAlvoValidoInspecionado && this._p_ultimoAlvoValidoInspecionado.isConnected) {
                    return this._p_ultimoAlvoValidoInspecionado;
                }
            } catch (_) { }
            return null;
        }

        temPainelInspetorVisivel() {
            return Boolean(this._p_painelInspetorEl);
        }

        carregarRegrasInternas() {
            const aplicarRegrasInterface = (dados) => {
                if (Array.isArray(dados)) {
                    this._p_regrasInternas = dados.filter(r => r && r.origem !== 'usuario');
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
                            .then((resp) => (resp && resp.ok ? resp.text() : null))
                            .then((txt) => {
                                if (!txt) {
                                    tentarIpc();
                                    return;
                                }
                                let dados = null;
                                try {
                                    dados = (typeof JusGovCfgDefaults !== 'undefined' && JusGovCfgDefaults && typeof JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                                        ? JusGovCfgDefaults.parsearJsonComComentarios(txt)
                                        : JSON.parse(String(txt || '').replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim());
                                } catch (_) { }
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
            this._p_regrasUsuario = Array.isArray(novasRegras) ? [...novasRegras] : [...PADROES_FABRICA_REGRAS_MAPEAMENTO];
            this.limparCache();
        }

        obterRegrasUsuario() {
            return this._p_regrasUsuario;
        }

        adicionarRegrasUsuario(novasRegras) {
            if (!Array.isArray(novasRegras) || novasRegras.length === 0) return;
            this._p_regrasUsuario.push(...novasRegras);
            this.limparCache();
        }

        definirRegrasInternas(regras) {
            this._p_regrasInternas = Array.isArray(regras) ? [...regras] : [];
            this.limparCache();
        }

        elementoCorrespondeXPath(el, expressaoXPath, herdarFilhos = true) {
            if (!el || typeof expressaoXPath !== 'string' || !expressaoXPath.trim()) return false;
            const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
            if (!doc || typeof doc.evaluate !== 'function') return false;
            try {
                const expr = expressaoXPath.trim();
                /* BUG-130: Suporte a XPath recursivo atravessando <iframe> (/.../iframe[n]/html/...) */
                if (/\/iframe(?:\[\d+\])?\/html(?:\/|$)/i.test(expr)) {
                    const segmentos = expr.split(/(?=\/html(?:\/|$))/i).filter(Boolean);
                    const cadeia = [];
                    let noAtual = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
                    while (noAtual) {
                        const dAtual = noAtual.ownerDocument;
                        if (!dAtual) break;
                        cadeia.unshift({ el: noAtual, doc: dAtual });
                        const wAtual = dAtual.defaultView;
                        noAtual = (wAtual && wAtual !== wAtual.top && wAtual.frameElement) ? wAtual.frameElement : null;
                    }
                    if (cadeia.length >= segmentos.length) {
                        let todosBatem = true;
                        for (let s = 0; s < segmentos.length; s++) {
                            const nivel = cadeia[s];
                            const segExpr = segmentos[s];
                            const ehUltimoSeg = (s === segmentos.length - 1);
                            const snapSeg = nivel.doc.evaluate(segExpr, nivel.doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            let bateNivel = false;
                            for (let k = 0; k < (snapSeg ? snapSeg.snapshotLength : 0); k++) {
                                const noSeg = snapSeg.snapshotItem(k);
                                if (!noSeg) continue;
                                if (noSeg === nivel.el) { bateNivel = true; break; }
                                if (ehUltimoSeg && herdarFilhos && typeof noSeg.contains === 'function' && noSeg.contains(nivel.el)) { bateNivel = true; break; }
                            }
                            if (!bateNivel) { todosBatem = false; break; }
                        }
                        if (todosBatem) return true;
                    }
                }
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
                /* BUG-130: Suporte a seletor CSS recursivo atravessando <iframe> (... > iframe... > html > ...) */
                if (/iframe[^>]*>\s*html\b/i.test(sel)) {
                    const segsCss = sel.split(/\s*>\s*(?=html\b)/i).filter(Boolean);
                    const cadeia = [];
                    let noAtual = base;
                    while (noAtual) {
                        cadeia.unshift(noAtual);
                        const wAtual = noAtual.ownerDocument && noAtual.ownerDocument.defaultView;
                        noAtual = (wAtual && wAtual !== wAtual.top && wAtual.frameElement) ? wAtual.frameElement : null;
                    }
                    if (cadeia.length >= segsCss.length) {
                        let todosBatem = true;
                        for (let s = 0; s < segsCss.length; s++) {
                            const noSeg = cadeia[s];
                            const segSel = segsCss[s].trim();
                            const ehUltimo = (s === segsCss.length - 1);
                            const bateu = (typeof noSeg.matches === 'function' && noSeg.matches(segSel))
                                || (ehUltimo && herdarFilhos && typeof noSeg.closest === 'function' && Boolean(noSeg.closest(segSel)));
                            if (!bateu) { todosBatem = false; break; }
                        }
                        if (todosBatem) return true;
                    }
                }
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
                if (base === this._p_cacheEl && (agora - this._p_cacheTs) < 16) {
                    return this._p_cacheRes;
                }
                const det = this.obterDiagnosticoRegraDetalhado(base, false);
                const resultado = det ? det.tipo : null;
                this._p_cacheEl = base;
                this._p_cacheTs = agora;
                this._p_cacheRes = resultado;
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

        _p_temTextoDiretoVisivel(el) {
            if (!el || !el.childNodes) return false;
            const filhos = el.childNodes;
            for (let i = 0; i < filhos.length; i++) {
                const ch = filhos[i];
                if (ch && ch.nodeType === Node.TEXT_NODE && String(ch.nodeValue || '').trim().length > 0) {
                    return true;
                }
            }
            return false;
        }

        temEventosAssociadosAoObjeto(el) {
            if (!el) return null;
            const baseInicial = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            const dentroDeBlocoTexto = Boolean(baseInicial && typeof baseInicial.closest === 'function' && baseInicial.closest('p, article, blockquote, pre'));
            let atual = baseInicial;
            let profundidade = 0;

            while (atual && atual !== document.body && atual !== document.documentElement && profundidade < 3) {
                profundidade++;
                if (atual.nodeType === Node.ELEMENT_NODE) {
                    const tagAtual = (atual.tagName || '').toLowerCase();
                    if (profundidade === 3) {
                        if (dentroDeBlocoTexto || TAGS_ESTRUTURAIS_WIZ.has(tagAtual) || tagAtual === 'table' || tagAtual === 'tbody') {
                            break;
                        }
                        if (String(atual.textContent || '').trim().length > 60) {
                            break;
                        }
                    }
                    const descNo = this.descreverNoCurto(atual);
                    const onde = profundidade === 1 ? 'no elemento' : `no ancestral +${profundidade - 1}`;

                    if (atual.onclick) return `evento JS onclick em ${descNo} (${onde})`;
                    if (atual.ondblclick) return `evento JS ondblclick em ${descNo} (${onde})`;
                    if (atual.onmousedown) return `evento JS onmousedown em ${descNo} (${onde})`;
                    if (atual.onmouseup) return `evento JS onmouseup em ${descNo} (${onde})`;
                    if (atual.onpointerdown) return `evento JS onpointerdown em ${descNo} (${onde})`;
                    if (atual.onpointerup) return `evento JS onpointerup em ${descNo} (${onde})`;

                    if (atual.attributes && atual.attributes.length > 0) {
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

    }

        const _ext_RegrasEInspetorDOM = [
        { g: 'JusGovXPathInspetorUi', p: './xpath-inspetor-ui.js' }
    ];
    for (let i = 0; i < _ext_RegrasEInspetorDOM.length; i++) {
        const it = _ext_RegrasEInspetorDOM[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(RegrasEInspetorDOM.prototype);
        }
    }

    Object.freeze(RegrasEInspetorDOM.prototype);
    return RegrasEInspetorDOM;
}));

