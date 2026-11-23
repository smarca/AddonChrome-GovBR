/* ==========================================================================
 * ARQUIVO: src/mod-XPath/xpath-extratores.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-XPATH — Extratores Recursivos de XPath/CSS, Trilha DOM e Sugestões
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-XPath/xpath-extratores.js
 * - Classe Exportada: XPathExtratores (self.JusGovXPathExtratores) extends BaseModulo
 * - Métodos Públicos: _obterTagSegura, _obterFrameAncestral, extrairCaminhoXPathAbsoluto, extrairCaminhoXPathRelativo, _escaparIdentCss, _obterClassesOrdenadasCss, extrairSeletorCssSimplificado, isRegraMuitoCurta, extrairSeletorCssSimples, extrairSeletorCss2, construirTrilhaElementos, formatarTagDetalhada, contarCorrespondenciasRegra, _escaparXPathLiteral, gerarSugestoesSeletor, static instalarEm(proto)
 * - Regras / Seções: ENG-00 (POO: Herança extends BaseModulo, SRP), ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica(raiz);
    } else {
        raiz.JusGovXPathExtratores = fabrica(raiz);
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

    class XPathExtratores extends Base {
        constructor() {
            super('XPathExtratores');
        }

        static instalarEm(proto) {
            if (!proto || typeof proto !== 'object') return false;
            const nomes = Object.getOwnPropertyNames(XPathExtratores.prototype);
            for (let i = 0; i < nomes.length; i++) {
                const nome = nomes[i];
                if (nome === 'constructor' || nome === 'inicializar' || nome === 'destruir') continue;
                const descProp = Object.getOwnPropertyDescriptor(XPathExtratores.prototype, nome);
                if (descProp) Object.defineProperty(proto, nome, descProp);
            }
            return true;
        }

        _obterTagSegura(el) {
            try {
                if (!el || typeof el.tagName !== 'string') return '';
                return el.tagName.toLowerCase();
            } catch (_) {
                return '';
            }
        }

        _obterFrameAncestral(el) {
            try {
                const doc = el && el.ownerDocument;
                const win = doc && doc.defaultView;
                if (!win || win === win.top) return null;
                const fe = win.frameElement;
                return (fe && fe.nodeType === Node.ELEMENT_NODE) ? fe : null;
            } catch (_) {
                return null;
            }
        }

        extrairCaminhoXPathAbsoluto(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
                const tagBase = this._obterTagSegura(el);
                if (!tagBase) return '';

                let caminhoLocal = '';
                if (tagBase === 'html') {
                    caminhoLocal = '/html';
                } else if (tagBase === 'body') {
                    caminhoLocal = '/html/body';
                } else {
                    let caminho = '';
                    let atual = el;
                    while (atual && atual.nodeType === Node.ELEMENT_NODE) {
                        const tag = this._obterTagSegura(atual);
                        if (!tag || tag === 'html') break;
                        let index = 1;
                        let irmao = atual.previousElementSibling;
                        while (irmao) {
                            if (this._obterTagSegura(irmao) === tag) {
                                index++;
                            }
                            irmao = irmao.previousElementSibling;
                        }
                        caminho = `/${tag}[${index}]` + caminho;
                        atual = atual.parentElement;
                    }
                    caminhoLocal = '/html' + caminho;
                }

                /* BUG-130: Sobe recursivamente pelos iframes ancestrais até o documento raiz */
                const framePai = this._obterFrameAncestral(el);
                if (framePai) {
                    const prefixoFrame = this.extrairCaminhoXPathAbsoluto(framePai);
                    if (prefixoFrame) return `${prefixoFrame}${caminhoLocal}`;
                }
                return caminhoLocal;
            } catch (_) {
                return '';
            }
        }

        extrairCaminhoXPathRelativo(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
                if (el.id && typeof el.id === 'string' && el.id.trim()) {
                    return `//*[@id=${this._escaparXPathLiteral(el.id.trim())}]`;
                }
                let atual = el;
                let caminhoRel = '';
                while (atual && atual.nodeType === Node.ELEMENT_NODE && atual !== document.body && atual !== document.documentElement) {
                    if (atual !== el && atual.id && typeof atual.id === 'string' && atual.id.trim()) {
                        return `//*[@id=${this._escaparXPathLiteral(atual.id.trim())}]` + caminhoRel;
                    }
                    const tag = this._obterTagSegura(atual);
                    if (!tag) break;
                    let index = 1;
                    let irmao = atual.previousElementSibling;
                    while (irmao) {
                        if (this._obterTagSegura(irmao) === tag) {
                            index++;
                        }
                        irmao = irmao.previousElementSibling;
                    }
                    caminhoRel = `/${tag}[${index}]` + caminhoRel;
                    atual = atual.parentElement;
                }
                return this.extrairCaminhoXPathAbsoluto(el);
            } catch (_) {
                return '';
            }
        }

        _escaparIdentCss(ident) {
            const val = String(ident || '').trim();
            if (!val) return '';
            try {
                return (typeof CSS !== 'undefined' && typeof CSS.escape === 'function')
                    ? CSS.escape(val)
                    : val.replace(/([^\w-])/g, '\\$1');
            } catch (_) {
                return val.replace(/([^\w-])/g, '\\$1');
            }
        }

        _obterClassesOrdenadasCss(el) {
            try {
                if (!el || !el.classList) return [];
                const todas = Array.from(el.classList).filter(c => c && !c.startsWith('jusgov') && !c.startsWith('ng-') && !c.startsWith('v-'));
                const limpas = todas.filter(c => !c.includes(':') && !c.includes('[') && !c.includes('/'));
                const fallback = todas.filter(c => c.includes(':') || c.includes('[') || c.includes('/'));
                return [...limpas, ...fallback];
            } catch (_) {
                return [];
            }
        }

        extrairSeletorCssSimplificado(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            if (el.id && typeof el.id === 'string' && el.id.trim()) {
                return `#${this._escaparIdentCss(el.id.trim())}`;
            }

            const partes = [];
            let atual = el;
            let profundidade = 0;
            while (atual && atual.nodeType === Node.ELEMENT_NODE && profundidade < 5) {
                profundidade++;
                const tag = atual.tagName.toLowerCase();
                if (tag === 'body' || tag === 'html') break;

                if (atual.id && typeof atual.id === 'string' && atual.id.trim()) {
                    partes.unshift(`#${this._escaparIdentCss(atual.id.trim())}`);
                    break;
                }

                let descritor = tag;
                const classesValidas = this._obterClassesOrdenadasCss(atual).filter(c => !c.includes(':'));
                if (classesValidas.length > 0) {
                    descritor += '.' + classesValidas.slice(0, 2).map(c => this._escaparIdentCss(c)).join('.');
                }

                let irmao = atual.previousElementSibling;
                let index = 1;
                let temIrmaosMesmaTag = false;
                while (irmao) {
                    if (irmao.tagName.toLowerCase() === tag) {
                        temIrmaosMesmaTag = true;
                        index++;
                    }
                    irmao = irmao.previousElementSibling;
                }
                if (!temIrmaosMesmaTag) {
                    let prox = atual.nextElementSibling;
                    while (prox) {
                        if (prox.tagName.toLowerCase() === tag) {
                            temIrmaosMesmaTag = true;
                            break;
                        }
                        prox = prox.nextElementSibling;
                    }
                }
                if (temIrmaosMesmaTag) {
                    descritor += `:nth-of-type(${index})`;
                }

                partes.unshift(descritor);
                atual = atual.parentElement;
            }

            return partes.join(' > ') || el.tagName.toLowerCase();
        }

        isRegraMuitoCurta(expressao) {
            if (!expressao || typeof expressao !== 'string') return true;
            const limpa = expressao.trim().toLowerCase();
            return limpa === '/html' || limpa === '/html/body' || limpa === 'html' || limpa === 'body';
        }

        extrairSeletorCssSimples(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
                if (el.id && typeof el.id === 'string' && el.id.trim()) {
                    return `#${this._escaparIdentCss(el.id.trim())}`;
                }
                const classes = this._obterClassesOrdenadasCss(el).filter(c => !c.includes(':'));
                if (classes.length > 0) {
                    return '.' + classes.slice(0, 3).map(c => this._escaparIdentCss(c)).join('.');
                }
                return this._obterTagSegura(el);
            } catch (_) {
                return '';
            }
        }

        extrairSeletorCss2(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
                const partes = [];
                let atual = el;
                while (atual && atual.nodeType === Node.ELEMENT_NODE) {
                    const tag = this._obterTagSegura(atual);
                    if (!tag) break;
                    if (tag === 'html') {
                        partes.unshift('html');
                        break;
                    }
                    let indice = 1;
                    let irmao = atual.previousElementSibling;
                    while (irmao) {
                        indice++;
                        irmao = irmao.previousElementSibling;
                    }
                    partes.unshift(`${tag}:nth-child(${indice})`);
                    atual = atual.parentElement;
                }
                const localCss = partes.join(' > ');
                /* BUG-130: Sobe recursivamente pelos iframes ancestrais até o documento raiz */
                const framePai = this._obterFrameAncestral(el);
                if (framePai && localCss) {
                    const prefixoFrame = this.extrairSeletorCss2(framePai);
                    if (prefixoFrame) return `${prefixoFrame} > ${localCss}`;
                }
                return localCss;
            } catch (_) {
                return '';
            }
        }

        /**
         * Constrói a trilha hierárquica completa do <html> até o elemento alvo,
         * atravessando recursivamente iframes ancestrais (BUG-130),
         * incluindo o índice XPath entre irmãos de mesma tag em cada degrau.
         * @param {Element} el
         * @returns {Array<{el: Element, tag: string, segmentoXPath: string, segmentoTag: string}>}
         */
        construirTrilhaElementos(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return [];
                const trilha = [];
                let atual = el;
                while (atual && atual.nodeType === Node.ELEMENT_NODE) {
                    const tag = this._obterTagSegura(atual);
                    if (!tag) break;
                    if (tag === 'html') {
                        trilha.unshift({
                            el: atual,
                            tag,
                            segmentoXPath: 'html',
                            segmentoTag: '<html>'
                        });
                        const framePai = this._obterFrameAncestral(atual);
                        if (framePai) {
                            const trilhaPai = this.construirTrilhaElementos(framePai);
                            if (trilhaPai.length > 0) {
                                return [...trilhaPai, ...trilha];
                            }
                        }
                        break;
                    }
                    let index = 1;
                    let irmao = atual.previousElementSibling;
                    while (irmao) {
                        if (this._obterTagSegura(irmao) === tag) {
                            index++;
                        }
                        irmao = irmao.previousElementSibling;
                    }
                    trilha.unshift({
                        el: atual,
                        tag,
                        segmentoXPath: `${tag}[${index}]`,
                        segmentoTag: `<${tag}>`
                    });
                    atual = atual.parentElement;
                }
                return trilha;
            } catch (_) {
                return [];
            }
        }

        /**
         * Formata uma representação HTML detalhada do elemento selecionado
         * exibindo tag e principais atributos (id, name, type, role, class, etc.).
         * @param {Element} el
         * @returns {{completo: string, resumido: string}}
         */
        formatarTagDetalhada(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) {
                    return { completo: '', resumido: '' };
                }
                const tag = this._obterTagSegura(el);
                if (!tag) return { completo: '', resumido: '' };
                const partes = [tag];
                const classesEl = Array.from(el.classList || []).filter(c => c && !c.startsWith('jusgov-'));
                const attrsOrdem = ['id', 'name', 'type', 'role', 'aria-label', 'data-testid', 'title', 'href'];
                attrsOrdem.forEach((nomeAttr) => {
                    const val = nomeAttr === 'id' ? el.id : (el.getAttribute && el.getAttribute(nomeAttr));
                    if (val && typeof val === 'string' && val.trim()) {
                        partes.push(`${nomeAttr}="${val.trim()}"`);
                    }
                });
                if (classesEl.length > 0) {
                    partes.push(`class="${classesEl.join(' ')}"`);
                }
                const completo = `<${partes.join(' ')}>`;
                return { completo, resumido: completo };
            } catch (_) {
                return { completo: '', resumido: '' };
            }
        }

        /**
         * Avalia localmente quantos elementos da página correspondem às expressões fornecidas,
         * ignorando o próprio modal e retornando os primeiros nós encontrados para prévia visual.
         */
        contarCorrespondenciasRegra(itensAtivos = [], docAlvo = null) {
            try {
                const doc = docAlvo || (typeof document !== 'undefined' ? document : null);
                if (!doc || !Array.isArray(itensAtivos) || itensAtivos.length === 0) {
                    return { total: 0, nos: [], invalida: false };
                }
                const encontrados = new Set();
                let algumaInvalida = false;

                itensAtivos.forEach((item) => {
                    const expr = item && item.expressao ? String(item.expressao).trim() : '';
                    const tipoSeletor = item && item.tipoSeletor ? String(item.tipoSeletor) : '';
                    if (!expr) return;
                    const ehXPath = tipoSeletor.toLowerCase().includes('xpath') || expr.startsWith('/') || expr.startsWith('(');
                    try {
                        if (ehXPath) {
                            const snap = doc.evaluate(expr, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < snap.snapshotLength; i++) {
                                const no = snap.snapshotItem(i);
                                if (no && no.nodeType === Node.ELEMENT_NODE && (!no.closest || !no.closest('[data-jusgov-ignore="true"]'))) {
                                    encontrados.add(no);
                                }
                            }
                        } else {
                            const listaCss = doc.querySelectorAll(expr);
                            for (let i = 0; i < listaCss.length; i++) {
                                const no = listaCss[i];
                                if (no && (!no.closest || !no.closest('[data-jusgov-ignore="true"]'))) {
                                    encontrados.add(no);
                                }
                            }
                        }
                    } catch (_) {
                        algumaInvalida = true;
                    }
                });

                return { total: encontrados.size, nos: Array.from(encontrados), invalida: algumaInvalida };
            } catch (_) {
                return { total: 0, nos: [], invalida: true };
            }
        }

        _escaparXPathLiteral(str) {
            const txt = String(str || '');
            if (!txt.includes('"')) return `"${txt}"`;
            if (!txt.includes("'")) return `'${txt}'`;
            return 'concat("' + txt.split('"').join('", \'"\', "') + '")';
        }

        /**
         * Gera variações ordenadas (do mais específico ao mais genérico),
         * exibindo tag pura unitária exclusivamente ao final de "CSS (Simples)".
         */
        gerarSugestoesSeletor(tipoSeletor, baseEl, valorPadrao, seletores = {}) {
            const sugestoes = [];
            if (!baseEl || baseEl.nodeType !== Node.ELEMENT_NODE) return sugestoes;

            const tagNome = (baseEl.tagName || '').toLowerCase();
            const classesEl = this._obterClassesOrdenadasCss(baseEl);
            const classesLimpiasParaCss = classesEl.filter(c => !c.includes(':'));
            const idValido = (baseEl.id && typeof baseEl.id === 'string' && baseEl.id.trim())
                ? baseEl.id.trim()
                : '';
            const idCss = idValido ? `#${this._escaparIdentCss(idValido)}` : '';

            const contarOcorrenciasSeletor = (valSeletor) => {
                if (!valSeletor || typeof document === 'undefined') return 0;
                try {
                    if (tipoSeletor.startsWith('XPath')) {
                        const snap = document.evaluate(valSeletor, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        return snap ? snap.snapshotLength : 0;
                    }
                    return document.querySelectorAll(valSeletor).length;
                } catch (_) {
                    return 0;
                }
            };

            const add = (rotulo, val, forcar = false) => {
                if (!val || sugestoes.some(s => s.val === val)) return;
                const qtd = contarOcorrenciasSeletor(val);
                /* Retira seletores muito genericos que casam com dezenas/milhares de elementos (ex.: > 30) */
                if (!forcar && (qtd === 0 || qtd > 30)) return;
                const sufixoQtd = qtd === 1 ? ' [único]' : (qtd > 1 ? ` [${qtd}]` : '');
                sugestoes.push({ rotulo: `${rotulo}${sufixoQtd}`, val });
            };

            const calcularIndiceTipo = (el) => {
                let idx = 1;
                let irmao = el && el.previousElementSibling;
                const t = el && el.tagName ? el.tagName.toLowerCase() : '';
                while (irmao) {
                    if (irmao.tagName && irmao.tagName.toLowerCase() === t) idx++;
                    irmao = irmao.previousElementSibling;
                }
                return idx;
            };

            const attrsRelevantes = ['name', 'type', 'role', 'aria-label', 'data-testid', 'placeholder'];

            if (tipoSeletor === 'CSS (Simples)') {
                if (idCss) {
                    add(`ID próprio (#${idValido})`, idCss);
                    add(`Tag + ID (${tagNome}#${idValido})`, `${tagNome}${idCss}`);
                }
                if (classesLimpiasParaCss.length > 0) {
                    const clsCombBruto = classesLimpiasParaCss.slice(0, 3).join('.');
                    const clsCombCss = classesLimpiasParaCss.slice(0, 3).map(c => this._escaparIdentCss(c)).join('.');
                    const cls1Css = this._escaparIdentCss(classesLimpiasParaCss[0]);
                    add(`Classes combinadas (.${clsCombBruto})`, `.${clsCombCss}`);
                    add(`Tag + Classes (${tagNome}.${clsCombBruto})`, `${tagNome}.${clsCombCss}`);
                    add(`Classe principal (.${classesLimpiasParaCss[0]})`, `.${cls1Css}`);
                    add(`Tag + Classe (${tagNome}.${classesLimpiasParaCss[0]})`, `${tagNome}.${cls1Css}`);
                }
                let anc = baseEl.parentElement;
                let profAnc = 0;
                while (anc && anc !== document.body && profAnc < 5) {
                    if (anc.id && typeof anc.id === 'string' && anc.id.trim()) {
                        add(`ID ancestral (#${anc.id.trim()})`, `#${this._escaparIdentCss(anc.id.trim())}`);
                        break;
                    }
                    anc = anc.parentElement;
                    profAnc++;
                }
                attrsRelevantes.forEach((attr) => {
                    const vAttr = baseEl.getAttribute && baseEl.getAttribute(attr);
                    if (vAttr && vAttr.length <= 60) {
                        const esc = vAttr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                        add(`Atributo [${attr}]`, `[${attr}="${esc}"]`);
                        add(`Tag + [${attr}]`, `${tagNome}[${attr}="${esc}"]`);
                    }
                });
                if (tagNome && contarOcorrenciasSeletor(tagNome) > 0) {
                    add(`Tag (<${tagNome}>)`, tagNome, true);
                }
            } else if (tipoSeletor === 'CSS (Hierárquico)') {
                add('Hierárquico padrão', valorPadrao || seletores.seletorCss, true);
                const pai = baseEl.parentElement;
                if (pai && pai.tagName) {
                    const paiTag = pai.tagName.toLowerCase();
                    if (idCss) {
                        add(`Pai > #${idValido}`, `${paiTag} > ${idCss}`);
                    }
                    if (classesLimpiasParaCss.length > 0) {
                        add(`Pai > ${tagNome}.${classesLimpiasParaCss[0]}`, `${paiTag} > ${tagNome}.${this._escaparIdentCss(classesLimpiasParaCss[0])}`);
                    }
                    const idxTipo = calcularIndiceTipo(baseEl);
                    add(`Pai > ${tagNome}:nth-of-type(${idxTipo})`, `${paiTag} > ${tagNome}:nth-of-type(${idxTipo})`);
                }
            } else if (tipoSeletor === 'CSS (Estrutural)') {
                const completo = valorPadrao || seletores.seletorCss2 || '';
                add('Estrutural completo (:nth-child)', completo, true);
                const partes = completo ? completo.split(' > ') : [];
                if (partes.length > 3) {
                    add('Últimos 3 níveis (:nth-child)', partes.slice(-3).join(' > '));
                }
                if (partes.length > 2) {
                    add('Últimos 2 níveis (:nth-child)', partes.slice(-2).join(' > '));
                }
            } else if (tipoSeletor === 'XPath (Simplificado)') {
                add('Simplificado padrão', valorPadrao || seletores.xpathRel, true);
                if (idValido) {
                    const litId = this._escaparXPathLiteral(idValido);
                    add(`Por ID (//*[@id=...])`, `//*[@id=${litId}]`);
                    add(`Por Tag + ID (//${tagNome}[@id=...])`, `//${tagNome}[@id=${litId}]`);
                }
                attrsRelevantes.forEach((attr) => {
                    const vAttr = baseEl.getAttribute && baseEl.getAttribute(attr);
                    if (vAttr && vAttr.length <= 60) {
                        const lit = this._escaparXPathLiteral(vAttr);
                        add(`Tag + @${attr}`, `//${tagNome}[@${attr}=${lit}]`);
                        add(`Qualquer @${attr}`, `//*[@${attr}=${lit}]`);
                    }
                });
                const textoCurto = (baseEl.innerText || baseEl.textContent || '').replace(/\s+/g, ' ').trim();
                if (textoCurto.length >= 2 && textoCurto.length <= 36) {
                    const litTxt = this._escaparXPathLiteral(textoCurto);
                    add(`Texto exato ("${textoCurto.slice(0, 20)}")`, `//${tagNome}[normalize-space(.)=${litTxt}]`);
                    add(`Contém texto ("${textoCurto.slice(0, 20)}")`, `//${tagNome}[contains(normalize-space(.), ${litTxt})]`);
                }
                if (classesEl.length > 0) {
                    const litCls = this._escaparXPathLiteral(` ${classesEl[0]} `);
                    add(`Tag + classe (.${classesEl[0]})`, `//${tagNome}[contains(concat(" ", normalize-space(@class), " "), ${litCls})]`);
                }
            } else if (tipoSeletor === 'XPath (Completo)') {
                const abs = valorPadrao || seletores.xpathAbs || '';
                add('Completo indexado (exato)', abs, true);
                if (abs) {
                    const segs = abs.split('/').filter(Boolean);
                    if (segs.length >= 2) {
                        const paiSeg = segs[segs.length - 2];
                        const alvoSeg = segs[segs.length - 1];
                        add(`Pai indexado + alvo (//${paiSeg}/${alvoSeg})`, `//${paiSeg}/${alvoSeg}`);
                        const paiSemIdx = paiSeg.replace(/\[\d+\]/g, '');
                        add(`Pai + Tag sem índice (//${paiSemIdx}/${tagNome})`, `//${paiSemIdx}/${tagNome}`);
                    }
                }
            }

            if (valorPadrao && !sugestoes.some(s => s.val === valorPadrao)) {
                sugestoes.unshift({ rotulo: 'Padrão calculado', val: valorPadrao });
            }
            return sugestoes;
        }
    }

    Object.freeze(XPathExtratores.prototype);
    return Object.freeze(XPathExtratores);
}));