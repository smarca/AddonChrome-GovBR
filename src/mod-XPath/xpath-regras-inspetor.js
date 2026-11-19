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
        #regrasUsuario = [];
        #regrasInternas = [];
        #ultimoAlvoValidoInspecionado = null;
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

        obterUltimoAlvoValidoInspecionado() {
            try {
                if (this.#ultimoAlvoValidoInspecionado && this.#ultimoAlvoValidoInspecionado.isConnected) {
                    return this.#ultimoAlvoValidoInspecionado;
                }
            } catch (_) { }
            return null;
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

        #temTextoDiretoVisivel(el) {
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
                        const ehTagDocumentalSemTextoDireto = TAGS_DOCUMENTAIS_SEMPRE_LEITURA.has(tagB);
                        const ehEditavelDireto = Boolean(
                            (typeof this.#ehCampoEditavelFn === 'function' && this.#ehCampoEditavelFn(base)) ||
                            (typeof base.matches === 'function' && base.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"]), rich-textarea, [role="textbox"], [role="searchbox"]'))
                        );
                        if (!ehEditavelDireto && !ehTagDocumentalSemTextoDireto && !this.#temTextoDiretoVisivel(base)) {
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

        #obterContextoRaizUi() {
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
            if (!ignorarOrigemId || !this.#painelInspetorEl || this.#painelInspetorEl.getAttribute('data-jusgov-origem-frame') !== ignorarOrigemId) {
                try {
                    if (this.#painelInspetorEl) {
                        if (typeof this.#painelInspetorEl.hidePopover === 'function') {
                            try { this.#painelInspetorEl.hidePopover(); } catch (_) { }
                        }
                        if (this.#painelInspetorEl.parentNode) {
                            this.#painelInspetorEl.parentNode.removeChild(this.#painelInspetorEl);
                        }
                    }
                } catch (_) { }
                this.#painelInspetorEl = null;
            }
            const docsLimpar = [];
            if (typeof document !== 'undefined') docsLimpar.push(document);
            const { docUi } = this.#obterContextoRaizUi();
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
                    origemId: origemOverride || this.#idFrameInspetor
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

        #obterDominioCompletoUrl(baseEl, winUi) {
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
            this.#ultimoAlvoValidoInspecionado = base;

            /* Fecha qualquer inspetor antigo local (inclusive órfãos) ou em outros frames antes de renderizar o novo */
            this.ocultarInspetorTempoReal();
            this.notificarOutrosFramesOcultarInspetor();

            const ctxUi = this.#obterContextoRaizUi();
            const docUi = ctxUi.docUi || document;
            const winUi = ctxUi.winUi || window;

            const painel = docUi.createElement('div');
            painel.id = 'jusgov-inspetor-tempo-real';
            painel.setAttribute('data-jusgov-ignore', 'true');
            painel.setAttribute('data-jusgov-inspetor', 'true');
            painel.setAttribute('data-jusgov-origem-frame', this.#idFrameInspetor);
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
            this.#painelInspetorEl = painel;

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
            this.#painelInspetorEl.append(l1, l2);

            if (ehCampoEditavel) {
                const l3 = docUi.createElement('div');
                l3.style.cssText = 'font-family: monospace; font-size: 10px; font-weight: 700; color: #c084fc;';
                l3.textContent = 'Comportamento: Edição livre (nunca intercepta clique/seleção)';
                this.#painelInspetorEl.appendChild(l3);
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
                this.#painelInspetorEl.appendChild(boxTrilha);
            }

            const dominioCompleto = this.#obterDominioCompletoUrl(base, winUi);
            if (dominioCompleto) {
                const barraStatus = docUi.createElement('div');
                barraStatus.style.cssText = 'font-family: monospace; font-size: 9.5px; color: #94a3b8; margin-top: 5px; border-top: 1px solid #334155; padding-top: 3px; display: flex; align-items: center; justify-content: space-between; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                const spanDom = docUi.createElement('span');
                spanDom.style.cssText = 'color: #7dd3fc; overflow: hidden; text-overflow: ellipsis;';
                spanDom.textContent = `🌐 ${dominioCompleto}`;
                barraStatus.appendChild(spanDom);
                this.#painelInspetorEl.appendChild(barraStatus);
            }

            const rectPainel = this.#painelInspetorEl.getBoundingClientRect();
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

            this.#painelInspetorEl.style.left = `${Math.round(left)}px`;
            this.#painelInspetorEl.style.top = `${Math.round(top)}px`;
        }
    }

    return Object.freeze(RegrasEInspetorDOM);
}));
