/* ==========================================================================
 * ARQUIVO: src/mod-XPath/xpath-dialogo.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: MOD-XPATH — Mapeamento Manual Avançado Global (Diálogo & Extração de Seletores)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-XPath/xpath-dialogo.js
 * - Classe Exportada: DialogoMapeamentoRegra (window.JusGovDialogoMapeamentoRegra)
 * - Métodos Públicos: extrairCaminhoXPathAbsoluto(el), extrairCaminhoXPathRelativo(el),
 *   extrairSeletorCssSimplificado(el), extrairSeletorCssSimples(el), extrairSeletorCss2(el),
 *   construirTrilhaElementos(el), formatarTagDetalhada(el), gerarSugestoesSeletor(tipoSeletor, baseEl, valorPadrao, seletores),
 *   contarCorrespondenciasRegra(expressao, tipoSeletor), isRegraMuitoCurta(expressao), fecharModal(), abrirModal(baseEl, seletoresExtraidos, deps),
 *   executarInspecaoECapturaSeletorUnico(el, deps)
 * - Regras / Seções: Seção 6.132 (PACOTE-REFAT-COPIA / URGENTE-02), Seção 6.131 (XPath/CSS)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDialogoMapeamentoRegra = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DialogoMapeamentoRegra {
        #modalAberto = null;

        _obterTagSegura(el) {
            try {
                if (!el || typeof el.tagName !== 'string') return '';
                return el.tagName.toLowerCase();
            } catch (_) {
                return '';
            }
        }

        extrairCaminhoXPathAbsoluto(el) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
                const tagBase = this._obterTagSegura(el);
                if (!tagBase) return '';
                if (tagBase === 'html') return '/html';
                if (tagBase === 'body') return '/html/body';

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
                return '/html' + caminho;
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
                return partes.join(' > ');
            } catch (_) {
                return '';
            }
        }

        /**
         * Constrói a trilha hierárquica completa do <html> até o elemento alvo,
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

        _obterDocumentoRaizUi() {
            const docLocal = typeof document !== 'undefined' ? document : null;
            if (!docLocal) return null;
            let w = typeof window !== 'undefined' ? window : docLocal.defaultView;
            while (w && w !== w.top) {
                try {
                    const p = w.parent;
                    if (!p || !p.document || !p.document.body) break;
                    w = p;
                } catch (_) {
                    break;
                }
            }
            return (w && w.document && w.document.body) ? w.document : docLocal;
        }

        _criarFolhaEstiloIsolada(docTarget = null) {
            const docRef = docTarget || this._obterDocumentoRaizUi() || document;
            const st = docRef.createElement('style');
            st.id = 'jusgov-estilo-dialogo-mapeamento';
            st.textContent = [
                '#jusgov-modal-mapeamento-regra { position: fixed !important; inset: 0 !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 8px !important; border: none !important; outline: none !important; z-index: 2147483647 !important; isolation: isolate !important; pointer-events: auto !important; display: flex !important; align-items: center !important; justify-content: center !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 13px !important; line-height: 1.35 !important; letter-spacing: normal !important; text-align: left !important; color: #f8fafc !important; zoom: 1 !important; transform: none !important; color-scheme: dark !important; }',
                '#jusgov-modal-mapeamento-regra:popover-open { position: fixed !important; inset: 0 !important; margin: 0 !important; z-index: 2147483647 !important; display: flex !important; }',
                '#jusgov-modal-mapeamento-regra *, #jusgov-modal-mapeamento-regra *::before, #jusgov-modal-mapeamento-regra *::after { box-sizing: border-box !important; text-transform: none !important; text-shadow: none !important; float: none !important; }',
                '#jusgov-modal-mapeamento-regra *:not([data-jusgov-ignore="true"]):not(option):not(style) { display: none !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-card { width: min(96vw, 840px) !important; max-width: calc(100vw - 16px) !important; max-height: calc(100vh - 16px) !important; margin: 0 !important; padding: 10px 14px !important; background: #0f172a !important; color: #f8fafc !important; border: 1px solid #334155 !important; border-radius: 12px !important; font-size: 13px !important; line-height: 1.35 !important; display: flex !important; flex-direction: column !important; gap: 6px !important; }',
                '#jusgov-modal-mapeamento-regra h3 { margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; font-size: 13px !important; font-weight: 700 !important; line-height: 1.3 !important; color: #38bdf8 !important; }',
                '#jusgov-modal-mapeamento-regra label { width: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; color: #cbd5e1 !important; display: inline-block !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-chk { appearance: checkbox !important; -webkit-appearance: checkbox !important; width: 14px !important; height: 14px !important; min-width: 14px !important; min-height: 14px !important; max-width: 14px !important; max-height: 14px !important; margin: 2px 0 0 0 !important; padding: 0 !important; background: transparent !important; border: none !important; display: inline-block !important; flex: 0 0 auto !important; box-shadow: none !important; opacity: 1 !important; visibility: visible !important; position: static !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-textarea { appearance: none !important; width: 100% !important; min-width: 0 !important; max-width: 100% !important; min-height: 24px !important; height: 24px !important; max-height: 62px !important; margin: 0 !important; padding: 2px 6px !important; color: #f8fafc !important; background: #0f172a !important; border: 1px solid #475569 !important; box-shadow: none !important; border-radius: 4px !important; display: block !important; opacity: 1 !important; visibility: visible !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-input { appearance: none !important; width: 100% !important; min-width: 0 !important; max-width: 100% !important; height: 28px !important; min-height: 28px !important; max-height: 36px !important; margin: 0 !important; padding: 4px 8px !important; font-size: 12px !important; line-height: 1.3 !important; color: #f8fafc !important; background: #1e293b !important; border: 1px solid #475569 !important; border-radius: 6px !important; box-shadow: none !important; display: block !important; opacity: 1 !important; visibility: visible !important; }',
                '#jusgov-modal-mapeamento-regra select.jusgov-dmg-select { appearance: menulist !important; -webkit-appearance: menulist !important; -moz-appearance: menulist !important; display: block !important; visibility: visible !important; opacity: 1 !important; position: static !important; clip: auto !important; clip-path: none !important; pointer-events: auto !important; width: 100% !important; height: 28px !important; min-height: 28px !important; max-height: 32px !important; margin: 0 !important; padding: 3px 8px !important; font-size: 12px !important; line-height: 1.25 !important; color: #f8fafc !important; background: #1e293b !important; background-color: #1e293b !important; border: 1px solid #475569 !important; border-radius: 6px !important; box-shadow: none !important; color-scheme: dark !important; }',
                '#jusgov-modal-mapeamento-regra select.jusgov-dmg-select-sm { appearance: menulist !important; -webkit-appearance: menulist !important; -moz-appearance: menulist !important; display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: static !important; clip: auto !important; clip-path: none !important; pointer-events: auto !important; width: auto !important; min-width: 150px !important; max-width: 340px !important; flex: 0 1 auto !important; height: 22px !important; min-height: 22px !important; max-height: 24px !important; margin: 0 !important; padding: 1px 6px !important; font-size: 11.5px !important; line-height: 1.2 !important; color: #e2e8f0 !important; background: #0f172a !important; background-color: #0f172a !important; border: 1px solid #475569 !important; border-radius: 4px !important; box-shadow: none !important; color-scheme: dark !important; }',
                '#jusgov-modal-mapeamento-regra select option { background: #0f172a !important; background-color: #0f172a !important; color: #f8fafc !important; font-size: 12px !important; padding: 2px 6px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn { appearance: none !important; background-image: none !important; min-height: 0 !important; min-width: 0 !important; width: auto !important; height: auto !important; margin: 0 !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; white-space: nowrap !important; font-family: inherit !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-pri { padding: 6px 16px !important; font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important; background: #0284c7 !important; color: #ffffff !important; border: 1px solid #0369a1 !important; border-radius: 6px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-sec { padding: 6px 14px !important; font-size: 12px !important; font-weight: 500 !important; line-height: 1.2 !important; background: #1e293b !important; color: #cbd5e1 !important; border: 1px solid #475569 !important; border-radius: 6px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-warn { padding: 6px 12px !important; font-size: 12px !important; font-weight: 500 !important; line-height: 1.2 !important; background: #1e293b !important; color: #fbbf24 !important; border: 1px solid #d97706 !important; border-radius: 6px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-test { padding: 3px 8px !important; font-size: 11px !important; font-weight: 500 !important; line-height: 1.2 !important; background: #1e293b !important; color: #38bdf8 !important; border: 1px solid #0284c7 !important; border-radius: 5px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-close { padding: 2px 6px !important; font-size: 18px !important; line-height: 1 !important; background: transparent !important; color: #94a3b8 !important; border: none !important; border-radius: 4px !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-nav { width: 58px !important; height: 18px !important; padding: 0 4px !important; font-size: 11px !important; line-height: 1 !important; }',
                '#jusgov-modal-mapeamento-regra .jusgov-dmg-btn-tag { padding: 0 3px !important; font-size: 12px !important; line-height: 1.2 !important; }'
            ].join('\n');
            return st;
        }

        /**
         * Infere o modo comportamental mais provável para orientar o usuário com 1 clique sem forçar seleção prévia.
         * @param {Element|null} el
         * @param {Object|null} diagAtual
         * @returns {{ modo: string, rotulo: string }|null}
         */
        _sugerirModoComportamentalPorElemento(el, diagAtual = null) {
            try {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
                const tag = this._obterTagSegura(el);
                if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable) {
                    return { modo: 'editavel', rotulo: 'Editável' };
                }
                const role = String((el.getAttribute && el.getAttribute('role')) || '').toLowerCase();
                if (tag === 'button' || tag === 'a' || tag === 'nav' || role === 'button' || role === 'tab' || role === 'menuitem') {
                    return { modo: 'interface', rotulo: 'Interface' };
                }
                const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim();
                if (txt.length >= 60) {
                    return { modo: 'textual', rotulo: 'Textual' };
                }
                if (diagAtual && diagAtual.tipo === 'interface') {
                    return { modo: 'semiflexivel', rotulo: 'Semiflexível' };
                }
                return { modo: 'interface', rotulo: 'Interface' };
            } catch (_) {
                return null;
            }
        }

        fecharModal() {
            if (this.#modalAberto) {
                try {
                    if (typeof this.#modalAberto._restaurarVisibilidadeModal === 'function') {
                        this.#modalAberto._restaurarVisibilidadeModal();
                    }
                    if (typeof this.#modalAberto._limparOuvintesModal === 'function') {
                        this.#modalAberto._limparOuvintesModal();
                    }
                    if (typeof this.#modalAberto.hidePopover === 'function') {
                        this.#modalAberto.hidePopover();
                    }
                    this.#modalAberto.remove();
                } catch (_) { }
                this.#modalAberto = null;
            }
            const docsLimpar = [];
            if (typeof document !== 'undefined') docsLimpar.push(document);
            const docUi = this._obterDocumentoRaizUi();
            if (docUi && !docsLimpar.includes(docUi)) docsLimpar.push(docUi);
            docsLimpar.forEach((docRef) => {
                try {
                    const antigo = docRef.getElementById('jusgov-modal-mapeamento-regra');
                    if (antigo) {
                        if (typeof antigo._limparOuvintesModal === 'function') antigo._limparOuvintesModal();
                        if (typeof antigo.hidePopover === 'function') antigo.hidePopover();
                        antigo.remove();
                    }
                } catch (_) { }
            });
        }

        abrirModal(baseEl, seletoresExtraidos, deps = {}) {
            if (!baseEl || typeof document === 'undefined' || !document.body) return null;
            const docUi = this._obterDocumentoRaizUi() || document;
            const docAlvoBase = (baseEl && baseEl.ownerDocument) || document;
            const criarEl = (tag) => {
                const el = docUi.createElement(tag);
                el.setAttribute('data-jusgov-ignore', 'true');
                if (tag === 'select') {
                    el.setAttribute('data-no-chosen', 'true');
                    el.setAttribute('data-select2-ignore', 'true');
                }
                return el;
            };
            this.fecharModal();
            try {
            const safeDeps = (deps && typeof deps === 'object') ? deps : {};

            const seletores = seletoresExtraidos || {
                cssSimples: this.extrairSeletorCssSimples(baseEl),
                xpathRel: this.extrairCaminhoXPathRelativo(baseEl),
                xpathAbs: this.extrairCaminhoXPathAbsoluto(baseEl),
                seletorCss: this.extrairSeletorCssSimplificado(baseEl),
                seletorCss2: this.extrairSeletorCss2(baseEl)
            };

            const overlay = criarEl('div');
            overlay.id = 'jusgov-modal-mapeamento-regra';
            overlay.setAttribute('data-jusgov-ignore', 'true');
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            if (typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype) {
                overlay.setAttribute('popover', 'manual');
            }
            overlay.style.cssText = 'position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; margin: 0 !important; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); transition: background 0.2s ease, backdrop-filter 0.2s ease; z-index: 2147483647 !important; isolation: isolate !important; display: flex !important; align-items: center; justify-content: center; padding: 8px !important; box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

            const card = criarEl('div');
            card.className = 'jusgov-dmg-card';
            card.setAttribute('data-jusgov-ignore', 'true');
            card.style.cssText = 'background: #0f172a; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6); transition: opacity 0.2s ease; width: min(96vw, 840px); max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow-y: auto; color: #f8fafc; display: flex; flex-direction: column; gap: 6px; padding: 10px 14px; box-sizing: border-box;';

            const cabecalho = criarEl('div');
            cabecalho.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #334155; padding-bottom: 4px; gap: 10px;';

            const infoCab = criarEl('div');
            infoCab.style.cssText = 'flex: 1; min-width: 0;';
            const titulo = criarEl('h3');
            titulo.style.cssText = 'margin: 0; font-size: 12.5px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;';
            const spanTituloTxt = criarEl('span');
            spanTituloTxt.textContent = '⚙️ Salvar Regra de Mapeamento Manual';
            titulo.appendChild(spanTituloTxt);

            let diagAtualCaptura = null;
            if (typeof safeDeps.obterDiagnosticoElemento === 'function') {
                try {
                    diagAtualCaptura = safeDeps.obterDiagnosticoElemento(baseEl);
                    if (diagAtualCaptura && diagAtualCaptura.tipo) {
                        const mapaCoresAtual = {
                            interface: { rot: 'Interface', cor: '#fbbf24' },
                            semiflexivel: { rot: 'SemiFlexível', cor: '#38bdf8' },
                            textual: { rot: 'Textual', cor: '#34d399' },
                            editavel: { rot: 'Editável', cor: '#c084fc' }
                        };
                        const infoAtual = mapaCoresAtual[diagAtualCaptura.tipo] || { rot: diagAtualCaptura.tipo, cor: '#cbd5e1' };
                        const badgeDiag = criarEl('span');
                        badgeDiag.style.cssText = `font-size: 10px; font-weight: 600; color: ${infoAtual.cor}; background: #1e293b; border: 1px solid #334155; padding: 1px 6px; border-radius: 999px;`;
                        badgeDiag.textContent = `Atual: ${infoAtual.rot}${diagAtualCaptura.origem ? ' (' + diagAtualCaptura.origem + ')' : ''}`;
                        if (diagAtualCaptura.detalhe) badgeDiag.title = diagAtualCaptura.detalhe;
                        titulo.appendChild(badgeDiag);
                    }
                } catch (_) { }
            }

            const tagNome = this._obterTagSegura(baseEl) || 'element';
            const idInfo = (typeof baseEl.id === 'string' && baseEl.id.trim()) ? `#${baseEl.id.trim()}` : '';

            /* Trilha hierárquica completa preservada para permitir subir (Pai), descer (Filho) e restaurar ao início */
            const elInicialModal = safeDeps._elementoInicial || baseEl;
            const trilhaMemorizada = Array.isArray(safeDeps._trilhaOriginal) && safeDeps._trilhaOriginal.some(item => item && item.el === baseEl)
                ? safeDeps._trilhaOriginal
                : this.construirTrilhaElementos(baseEl);
            const indiceAtual = Math.max(0, trilhaMemorizada.findIndex(item => item && item.el === baseEl));
            const depsComTrilha = { ...safeDeps, _trilhaOriginal: trilhaMemorizada, _elementoInicial: elInicialModal };

            const fonteCondensada = `'Arial Narrow','Roboto Condensed','Bahnschrift Condensed','Liberation Sans Narrow',sans-serif`;

            const descAlvo = criarEl('div');
            descAlvo.style.cssText = `font-family:${fonteCondensada};font-stretch:condensed;font-size:12px;letter-spacing:-0.02em;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:0;flex-wrap:wrap;width:100%;line-height:1.25;`;
            const lblAlvo = criarEl('span');
            lblAlvo.style.cssText = 'font-weight:700;color:#cbd5e1;margin-right:4px;white-space:nowrap;';
            lblAlvo.textContent = 'Elemento clicado:';
            descAlvo.appendChild(lblAlvo);

            trilhaMemorizada.forEach((passo, idx) => {
                try {
                    if (!passo || !passo.el) return;
                    const ehAtual = idx === indiceAtual;
                    const ehDescendente = idx > indiceAtual;

                    const sep = criarEl('span');
                    sep.textContent = '/';
                    sep.style.cssText = `font-family:${fonteCondensada};color:${ehDescendente ? '#475569' : '#64748b'};padding:0;margin:0;`;
                    descAlvo.appendChild(sep);

                    const detPasso = this.formatarTagDetalhada(passo.el);
                    const txtPasso = String((passo.el && (passo.el.innerText || passo.el.textContent || '')) || '').replace(/\s+/g, ' ').trim();
                    const qtdFilhos = (passo.el && passo.el.children) ? passo.el.children.length : 0;
                    let tooltipDet = detPasso.completo || `<${passo.tag}>`;
                    if (txtPasso) tooltipDet += `\nTexto: "${txtPasso.slice(0, 70)}${txtPasso.length > 70 ? '…' : ''}"`;
                    tooltipDet += `\nFilhos: ${qtdFilhos} | XPath: ${passo.segmentoXPath}`;

                    const btnPassoTag = criarEl('button');
                    btnPassoTag.type = 'button';
                    btnPassoTag.className = 'jusgov-dmg-btn jusgov-dmg-btn-tag';
                    btnPassoTag.textContent = passo.tag;
                    btnPassoTag.title = tooltipDet;
                    btnPassoTag.style.cssText = ehAtual
                        ? `font-family:${fonteCondensada};font-stretch:condensed;font-size:12px;letter-spacing:-0.02em;font-weight:700;color:#0f172a;background:#38bdf8;border:1px solid #7dd3fc;padding:0 3px;margin:0;border-radius:3px;cursor:pointer;line-height:1.2;`
                        : (ehDescendente
                            ? `font-family:${fonteCondensada};font-stretch:condensed;font-size:12px;letter-spacing:-0.02em;color:#64748b;background:transparent;border:1px dashed #334155;padding:0 2px;margin:0;border-radius:3px;cursor:pointer;line-height:1.2;`
                            : `font-family:${fonteCondensada};font-stretch:condensed;font-size:12px;letter-spacing:-0.02em;color:#38bdf8;background:#1e293b;border:1px solid #334155;padding:0 3px;margin:0;border-radius:3px;cursor:pointer;line-height:1.2;`);
                    btnPassoTag.addEventListener('click', () => {
                        this.executarInspecaoECapturaSeletorUnico(passo.el, {
                            ...depsComTrilha,
                            _modoNavegacaoTrilha: 'padrao'
                        });
                    });
                    descAlvo.appendChild(btnPassoTag);
                } catch (_) { }
            });

            let inputCssSimplesRef = null;
            let chkCssSimplesRef = null;
            let selCssSimplesRef = null;
            const caixasOpcoes = [];
            const referenciasLinhas = {};

            const aplicarNoCssSimples = (novoValor) => {
                if (!novoValor || !inputCssSimplesRef) return;
                caixasOpcoes.forEach((c) => {
                    if (c.chk !== chkCssSimplesRef) c.chk.checked = false;
                });
                if (chkCssSimplesRef) {
                    chkCssSimplesRef.disabled = false;
                    chkCssSimplesRef.checked = true;
                }
                inputCssSimplesRef.value = novoValor;
                inputCssSimplesRef.dispatchEvent(new Event('input'));
                if (selCssSimplesRef) {
                    const optMatch = Array.from(selCssSimplesRef.options).find(o => o.value === novoValor);
                    if (optMatch) optMatch.selected = true;
                }
            };

            if (idInfo) {
                const chipId = criarEl('button');
                chipId.type = 'button';
                chipId.className = 'jusgov-dmg-btn';
                chipId.textContent = idInfo;
                chipId.title = `Usar "${idInfo}" em CSS (Simples)`;
                chipId.style.cssText = 'font-family: monospace; font-size: 11.5px; color: #34d399; background: #1e293b; border: 1px solid #334155; padding: 1px 6px; border-radius: 4px; cursor: pointer; margin-left: 4px;';
                chipId.addEventListener('click', () => aplicarNoCssSimples(idInfo));
                descAlvo.appendChild(chipId);
            }

            /* Linha 2: Campo Selecionado (2..5 linhas com resize vertical e scroll) + Pai/Filho empilhados à direita */
            const detalheAtual = this.formatarTagDetalhada(baseEl);
            const textoDetalheInicial = detalheAtual.completo || `<${tagNome}>`;
            const descDetalheEl = criarEl('div');
            descDetalheEl.style.cssText = `font-family:${fonteCondensada};font-stretch:condensed;font-size:12px;color:#94a3b8;margin-top:4px;display:flex;align-items:flex-start;gap:6px;width:100%;`;
            const lblDetalhe = criarEl('span');
            lblDetalhe.style.cssText = 'font-weight:600;color:#cbd5e1;flex-shrink:0;padding-top:4px;';
            lblDetalhe.textContent = 'Selecionado:';
            const codeDetalhe = criarEl('textarea');
            codeDetalhe.className = 'jusgov-dmg-textarea';
            codeDetalhe.readOnly = true;
            codeDetalhe.rows = 2;
            codeDetalhe.value = textoDetalheInicial;
            codeDetalhe.textContent = textoDetalheInicial;
            codeDetalhe.title = textoDetalheInicial;
            codeDetalhe.style.cssText = `font-family:${fonteCondensada};font-stretch:condensed;font-size:12.5px;letter-spacing:-0.015em;line-height:1.3;color:#a5f3fc;background:#0f172a;border:1px solid #475569;padding:3px 6px;border-radius:4px;flex:1;min-width:0;min-height:38px;height:38px;max-height:88px;overflow-y:auto;scrollbar-width:thin;resize:vertical;box-sizing:border-box;`;

            const boxNavPaiFilho = criarEl('div');
            boxNavPaiFilho.style.cssText = `display:flex;flex-direction:column;gap:2px;flex-shrink:0;font-family:${fonteCondensada};`;

            const temPaiNavegavel = (indiceAtual > 0) || Boolean(baseEl.parentElement && baseEl.parentElement !== docAlvoBase.documentElement);
            const btnPai = criarEl('button');
            btnPai.type = 'button';
            btnPai.className = 'jusgov-dmg-btn jusgov-dmg-btn-nav';
            btnPai.textContent = '↑ Pai';
            if (temPaiNavegavel) {
                const alvoPai = indiceAtual > 0 ? trilhaMemorizada[indiceAtual - 1].el : baseEl.parentElement;
                const tagPaiSafe = this._obterTagSegura(alvoPai) || 'el';
                btnPai.title = `Subir para ${this.formatarTagDetalhada(alvoPai).completo || '<' + tagPaiSafe + '>'}`;
                btnPai.style.cssText = `width:58px;height:18px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-family:${fonteCondensada};font-stretch:condensed;font-size:11px;font-weight:700;color:#fbbf24;background:#1e293b;border:1px solid #d97706;padding:0 4px;border-radius:3px;cursor:pointer;line-height:1;`;
                btnPai.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(alvoPai, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'padrao'
                    });
                });
            } else {
                btnPai.disabled = true;
                btnPai.title = 'Sem elemento pai navegável';
                btnPai.style.cssText = `width:58px;height:18px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-family:${fonteCondensada};font-stretch:condensed;font-size:11px;font-weight:700;color:#64748b;background:#1e293b;border:1px solid #334155;padding:0 4px;border-radius:3px;cursor:not-allowed;opacity:0.4;line-height:1;`;
            }

            const temFilhoNavegavel = (indiceAtual < trilhaMemorizada.length - 1);
            const btnFilho = criarEl('button');
            btnFilho.type = 'button';
            btnFilho.className = 'jusgov-dmg-btn jusgov-dmg-btn-nav';
            btnFilho.textContent = '↓ Filho';
            if (temFilhoNavegavel) {
                const alvoFilho = trilhaMemorizada[indiceAtual + 1].el;
                const tagFilhoSafe = this._obterTagSegura(alvoFilho) || 'el';
                btnFilho.title = `Descer para ${this.formatarTagDetalhada(alvoFilho).completo || '<' + tagFilhoSafe + '>'}`;
                btnFilho.style.cssText = `width:58px;height:18px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-family:${fonteCondensada};font-stretch:condensed;font-size:11px;font-weight:700;color:#34d399;background:#1e293b;border:1px solid #059669;padding:0 4px;border-radius:3px;cursor:pointer;line-height:1;`;
                btnFilho.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(alvoFilho, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'padrao'
                    });
                });
            } else {
                btnFilho.disabled = true;
                btnFilho.title = 'Sem elemento filho na trilha atual';
                btnFilho.style.cssText = `width:58px;height:18px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-family:${fonteCondensada};font-stretch:condensed;font-size:11px;font-weight:700;color:#64748b;background:#1e293b;border:1px solid #334155;padding:0 4px;border-radius:3px;cursor:not-allowed;opacity:0.4;line-height:1;`;
            }

            boxNavPaiFilho.appendChild(btnPai);
            boxNavPaiFilho.appendChild(btnFilho);

            descDetalheEl.appendChild(lblDetalhe);
            descDetalheEl.appendChild(codeDetalhe);
            descDetalheEl.appendChild(boxNavPaiFilho);

            infoCab.appendChild(titulo);
            infoCab.appendChild(descAlvo);
            infoCab.appendChild(descDetalheEl);

            const btnFechar = criarEl('button');
            btnFechar.type = 'button';
            btnFechar.className = 'jusgov-dmg-btn jusgov-dmg-btn-close';
            btnFechar.textContent = '✕';
            btnFechar.setAttribute('aria-label', 'Fechar');
            btnFechar.style.cssText = 'background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 2px 6px; line-height: 1; border-radius: 4px;';
            btnFechar.addEventListener('click', () => this.fecharModal());

            cabecalho.appendChild(infoCab);
            cabecalho.appendChild(btnFechar);
            card.appendChild(cabecalho);

            const normalizarExpr = typeof safeDeps.normalizarExpressaoAtributoCss === 'function'
                ? safeDeps.normalizarExpressaoAtributoCss
                : (v) => v;

            const secSeletores = criarEl('div');
            secSeletores.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

            const lblSecSeletores = criarEl('label');
            lblSecSeletores.style.cssText = 'font-size: 12px; font-weight: 600; color: #cbd5e1;';
            lblSecSeletores.textContent = 'Selecione os tipos de pesquisa a cadastrar (cada opção gera uma regra individual):';
            secSeletores.appendChild(lblSecSeletores);

            const listaTipos = [
                { tipoSeletor: 'CSS (Simples)', valor: seletores.cssSimples, padrao: true },
                { tipoSeletor: 'CSS (Hierárquico)', valor: seletores.seletorCss, padrao: !seletores.cssSimples },
                { tipoSeletor: 'CSS (Estrutural)', valor: seletores.seletorCss2 || seletores.seletorCss, padrao: false },
                { tipoSeletor: 'XPath (Simplificado)', valor: seletores.xpathRel, padrao: false },
                { tipoSeletor: 'XPath (Completo)', valor: seletores.xpathAbs, padrao: false }
            ];
            const snapshotInicialTipos = listaTipos.map((t) => ({
                valor: t.valor || '',
                padraoChecked: Boolean(t.padrao && t.valor)
            }));

            const painelAlertaCurto = criarEl('div');
            painelAlertaCurto.style.cssText = 'font-size: 11px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 8px; border-radius: 6px; display: none; line-height: 1.35;';
            painelAlertaCurto.textContent = '⚠️ Alerta: Regras genéricas como /html ou /html/body afetam a página inteira. Salve somente se intencional.';

            let lblCorrespondenciasRef = null;
            let btnTestarDestaqueRef = null;
            let btnRestaurarInicioRef = null;
            let btnSalvarRef = null;
            let selectModoRef = null;
            let chkFilhosRef = null;
            let chkContinuarRef = null;
            let inputObsRef = null;
            let chipSugestaoModoRef = null;

            const avaliarDirtyModal = () => {
                if (elInicialModal && baseEl !== elInicialModal) return true;
                if (safeDeps._modoNavegacaoTrilha && safeDeps._modoNavegacaoTrilha !== 'padrao') return true;
                for (let idx = 0; idx < caixasOpcoes.length; idx++) {
                    const snap = snapshotInicialTipos[idx];
                    const ref = caixasOpcoes[idx];
                    if (!snap || !ref) continue;
                    if (Boolean(ref.chk.checked) !== snap.padraoChecked) return true;
                    if (String(ref.item.valor || '') !== String(snap.valor || '')) return true;
                }
                if (selectModoRef && selectModoRef.value !== '') return true;
                if (chkFilhosRef && chkFilhosRef.checked !== true) return true;
                if (chkContinuarRef && chkContinuarRef.checked !== false) return true;
                if (inputObsRef && inputObsRef.value.trim() !== '') return true;
                return false;
            };

            const atualizarVisibilidadeAvisoCurto = () => {
                try {
                    const temCurtaSelecionada = caixasOpcoes.some(c => c.chk.checked && this.isRegraMuitoCurta(c.item.valor));
                    painelAlertaCurto.style.display = temCurtaSelecionada ? 'block' : 'none';

                    let totalMatchesGlobal = 0;
                    let marcadosValidosCount = 0;
                    const marcados = [];
                    caixasOpcoes.forEach((c) => {
                        const ref = referenciasLinhas[c.item.tipoSeletor];
                        const textoVal = String(c.item.valor || '').trim();
                        const exprNorm = (() => { try { return normalizarExpr(c.item.valor, c.item.tipoSeletor); } catch (_) { return c.item.valor; } })();
                        const exprValida = (!textoVal || typeof safeDeps.validarExpressaoSeletor !== 'function')
                            ? true
                            : Boolean(safeDeps.validarExpressaoSeletor(textoVal, c.item.tipoSeletor));
                        if (ref) {
                            if (ref.avisoCurta) {
                                ref.avisoCurta.style.display = (textoVal && this.isRegraMuitoCurta(textoVal)) ? 'inline-block' : 'none';
                            }
                            if (ref.linha) {
                                ref.linha.style.opacity = !textoVal ? '0.6' : '1';
                                ref.linha.style.borderColor = (c.chk.checked && textoVal)
                                    ? (exprValida ? '#0284c7' : '#ef4444')
                                    : '#334155';
                            }
                        }
                        if (c.chk.checked && textoVal) {
                            marcadosValidosCount += 1;
                            marcados.push({ expressao: exprNorm, tipoSeletor: c.item.tipoSeletor });
                        }
                    });

                    if (lblCorrespondenciasRef) {
                        if (marcados.length === 0) {
                            lblCorrespondenciasRef.textContent = '🎯 Marque ao menos 1 seletor';
                            lblCorrespondenciasRef.style.color = '#94a3b8';
                        } else {
                            const res = this.contarCorrespondenciasRegra(marcados, docAlvoBase);
                            totalMatchesGlobal = Number(res.total || 0);
                            if (res.invalida && res.total === 0) {
                                lblCorrespondenciasRef.textContent = '⚠️ Expressão inválida';
                                lblCorrespondenciasRef.style.color = '#f87171';
                            } else if (res.total === 0) {
                                lblCorrespondenciasRef.textContent = '⚠️ 0 correspondências na página';
                                lblCorrespondenciasRef.style.color = '#fbbf24';
                            } else if (res.total === 1) {
                                lblCorrespondenciasRef.textContent = '🎯 1 elemento (específico)';
                                lblCorrespondenciasRef.style.color = '#34d399';
                            } else {
                                lblCorrespondenciasRef.textContent = `🎯 ${res.total} elementos na página`;
                                lblCorrespondenciasRef.style.color = res.total > 15 ? '#fbbf24' : '#38bdf8';
                            }
                        }
                    }
                    if (btnTestarDestaqueRef) {
                        const podeTestar = (marcadosValidosCount > 0 && totalMatchesGlobal > 0);
                        btnTestarDestaqueRef.disabled = !podeTestar;
                        btnTestarDestaqueRef.style.opacity = podeTestar ? '1' : '0.45';
                        btnTestarDestaqueRef.style.cursor = podeTestar ? 'pointer' : 'not-allowed';
                    }
                    if (btnRestaurarInicioRef) {
                        btnRestaurarInicioRef.style.display = avaliarDirtyModal() ? 'inline-flex' : 'none';
                    }
                    if (chipSugestaoModoRef && selectModoRef) {
                        chipSugestaoModoRef.style.display = selectModoRef.value ? 'none' : 'inline-flex';
                    }
                    if (btnSalvarRef) {
                        const modoEscolhido = Boolean(selectModoRef && selectModoRef.value);
                        const prontoSalvar = (marcadosValidosCount > 0 && modoEscolhido);
                        btnSalvarRef.textContent = marcadosValidosCount > 1 ? `Salvar ${marcadosValidosCount} Regras` : 'Salvar Regra';
                        btnSalvarRef.style.opacity = prontoSalvar ? '1' : '0.68';
                    }
                } catch (_) { }
            };

            listaTipos.forEach((item, i) => {
                const linha = criarEl('div');
                linha.style.cssText = 'display: flex; align-items: flex-start; gap: 6px; background: #1e293b; padding: 5px 8px; border-radius: 6px; border: 1px solid #334155; transition: border-color 0.15s ease, opacity 0.15s ease;';

                const chk = criarEl('input');
                chk.type = 'checkbox';
                chk.className = 'jusgov-dmg-chk';
                chk.id = `chk_tipo_seletor_${i}`;
                chk.style.cssText = 'margin-top: 2px; cursor: pointer;';
                chk.checked = Boolean(item.padrao && item.valor);
                chk.disabled = !item.valor;

                const rotuloCorpo = criarEl('div');
                rotuloCorpo.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;';

                const topoLinha = criarEl('div');
                topoLinha.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;';

                const badge = criarEl('span');
                badge.style.cssText = 'font-size: 11px; font-weight: 700; color: #38bdf8;';
                badge.textContent = item.tipoSeletor;

                topoLinha.appendChild(badge);

                let sugestoesLinha = [];
                try {
                    sugestoesLinha = this.gerarSugestoesSeletor(item.tipoSeletor, baseEl, item.valor, seletores);
                } catch (_) {
                    sugestoesLinha = [];
                }
                let selSugestaoLinha = null;
                if (sugestoesLinha.length > 0) {
                    selSugestaoLinha = criarEl('select');
                    selSugestaoLinha.className = 'jusgov-dmg-select-sm';
                    selSugestaoLinha.style.cssText = 'font-size: 11.5px; background: #0f172a; color: #e2e8f0; border: 1px solid #475569; border-radius: 4px; padding: 1px 6px; cursor: pointer; max-width: 320px;';
                    sugestoesLinha.forEach((s) => {
                        const opt = criarEl('option');
                        opt.value = s.val;
                        opt.textContent = s.rotulo;
                        if (s.val === item.valor) opt.selected = true;
                        selSugestaoLinha.appendChild(opt);
                    });
                    topoLinha.appendChild(selSugestaoLinha);
                }

                const avisoCurta = criarEl('span');
                avisoCurta.style.cssText = 'font-size: 10px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1px 4px; border-radius: 3px;';
                avisoCurta.textContent = '⚠️ Seletor curto (escopo global)';
                avisoCurta.style.display = this.isRegraMuitoCurta(item.valor) ? 'inline-block' : 'none';
                topoLinha.appendChild(avisoCurta);

                const inputExprModal = criarEl('textarea');
                inputExprModal.className = 'jusgov-dmg-textarea';
                inputExprModal.rows = 1;
                inputExprModal.style.cssText = `width: 100%; box-sizing: border-box; font-family: ${fonteCondensada}; font-stretch: condensed; font-size: 13px; letter-spacing: -0.015em; line-height: 1.3; color: #f8fafc; background: #0f172a; padding: 2px 6px; min-height: 24px; height: 24px; max-height: 62px; overflow-y: auto; scrollbar-width: thin; border-radius: 4px; border: 1px solid #475569; resize: vertical;`;
                inputExprModal.value = item.valor || '';
                inputExprModal.placeholder = '(Não disponível — digite manualmente se desejar)';
                const selecionarApenasEsteTipo = (valorAtualizado) => {
                    const temTexto = Boolean(valorAtualizado && String(valorAtualizado).trim());
                    chk.disabled = !temTexto;
                    if (temTexto) {
                        caixasOpcoes.forEach((c) => {
                            if (c.chk !== chk) c.chk.checked = false;
                        });
                        chk.checked = true;
                    } else {
                        chk.checked = false;
                    }
                    atualizarVisibilidadeAvisoCurto();
                };

                inputExprModal.addEventListener('input', () => {
                    item.valor = inputExprModal.value.trim();
                    selecionarApenasEsteTipo(item.valor);
                });

                if (selSugestaoLinha) {
                    let valorDropdownAnterior = selSugestaoLinha.value || '';
                    const aplicarDropdownParaLinha = (valEscolhido) => {
                        const v = String(valEscolhido || '');
                        valorDropdownAnterior = v;
                        item.valor = v;
                        inputExprModal.value = v;
                        selecionarApenasEsteTipo(v);
                    };
                    selSugestaoLinha.addEventListener('mousedown', (ev) => {
                        if (selSugestaoLinha.selectedIndex >= 0) {
                            valorDropdownAnterior = selSugestaoLinha.value || valorDropdownAnterior;
                        }
                        if (ev && ev.isTrusted === false) {
                            selSugestaoLinha.selectedIndex = -1;
                        }
                    });
                    selSugestaoLinha.addEventListener('blur', () => {
                        if (selSugestaoLinha.selectedIndex === -1 && valorDropdownAnterior) {
                            selSugestaoLinha.value = valorDropdownAnterior;
                        }
                    });
                    selSugestaoLinha.addEventListener('change', () => {
                        aplicarDropdownParaLinha(selSugestaoLinha.value);
                    });
                    selSugestaoLinha.addEventListener('click', () => {
                        if (selSugestaoLinha.options && selSugestaoLinha.options.length === 1 && selSugestaoLinha.value) {
                            aplicarDropdownParaLinha(selSugestaoLinha.value);
                        }
                    });
                }

                if (item.tipoSeletor === 'CSS (Simples)') {
                    inputCssSimplesRef = inputExprModal;
                    chkCssSimplesRef = chk;
                    selCssSimplesRef = selSugestaoLinha;
                }
                referenciasLinhas[item.tipoSeletor] = { linha, chk, item, inputExprModal, selSugestaoLinha, avisoCurta };

                rotuloCorpo.appendChild(topoLinha);
                rotuloCorpo.appendChild(inputExprModal);

                linha.appendChild(chk);
                linha.appendChild(rotuloCorpo);
                secSeletores.appendChild(linha);

                caixasOpcoes.push({ chk, item });
            });

            if (safeDeps._modoNavegacaoTrilha === 'generico') {
                Object.keys(referenciasLinhas).forEach((k) => {
                    referenciasLinhas[k].chk.checked = (k === 'CSS (Simples)');
                });
                aplicarNoCssSimples(tagNome);
            } else if (safeDeps._modoNavegacaoTrilha === 'especializado') {
                Object.keys(referenciasLinhas).forEach((k) => {
                    const ref = referenciasLinhas[k];
                    const ehXpComp = (k === 'XPath (Completo)');
                    ref.chk.checked = ehXpComp && Boolean(ref.item.valor);
                });
            }

            card.appendChild(secSeletores);
            card.appendChild(painelAlertaCurto);

            caixasOpcoes.forEach(c => c.chk.addEventListener('change', atualizarVisibilidadeAvisoCurto));
            atualizarVisibilidadeAvisoCurto();

            const secModo = criarEl('div');
            secModo.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

            const topoModo = criarEl('div');
            topoModo.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;';

            const lblModo = criarEl('label');
            lblModo.style.cssText = 'font-size: 11.5px; font-weight: 600; color: #cbd5e1;';
            lblModo.textContent = 'Modo Comportamental do Elemento:';
            topoModo.appendChild(lblModo);

            const selectModo = criarEl('select');
            selectModoRef = selectModo;
            selectModo.className = 'jusgov-dmg-select';
            selectModo.style.cssText = 'padding: 4px 8px; font-size: 12px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; cursor: pointer;';

            const optVazio = criarEl('option');
            optVazio.value = '';
            optVazio.textContent = '-- Selecione o modo comportamental (obrigatório) --';
            optVazio.selected = true;

            const optInterface = criarEl('option');
            optInterface.value = 'interface';
            optInterface.textContent = 'Interface (Desseleciona sem Alt; bloqueia cópia de texto simples)';

            const optSemiflexivel = criarEl('option');
            optSemiflexivel.value = 'semiflexivel';
            optSemiflexivel.textContent = 'Semiflexível (Cópia rápida com 1 clique restrita a máscaras forenses)';

            const optTextual = criarEl('option');
            optTextual.value = 'textual';
            optTextual.textContent = 'Textual (Modo leitura documental com seleção mantida no DOM)';

            const optEditavel = criarEl('option');
            optEditavel.value = 'editavel';
            optEditavel.textContent = 'Editável (Campos de digitação, textarea, datas e áreas de placeholders/minutas)';

            selectModo.appendChild(optVazio);
            selectModo.appendChild(optInterface);
            selectModo.appendChild(optSemiflexivel);
            selectModo.appendChild(optTextual);
            selectModo.appendChild(optEditavel);

            const secFilhos = criarEl('div');
            secFilhos.style.cssText = 'display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 11.5px; color: #cbd5e1;';

            const grupoFilhos = criarEl('div');
            grupoFilhos.style.cssText = 'display: flex; align-items: center; gap: 6px;';
            const chkFilhos = criarEl('input');
            chkFilhosRef = chkFilhos;
            chkFilhos.type = 'checkbox';
            chkFilhos.className = 'jusgov-dmg-chk';
            chkFilhos.id = 'chkModalMapeamentoFilhos';
            chkFilhos.checked = true;
            chkFilhos.style.cssText = 'cursor: pointer;';
            const lblFilhos = criarEl('label');
            lblFilhos.htmlFor = 'chkModalMapeamentoFilhos';
            lblFilhos.style.cssText = 'cursor: pointer; user-select: none;';
            lblFilhos.textContent = 'Aplicar regra também aos elementos filhos / descendentes';
            grupoFilhos.appendChild(chkFilhos);
            grupoFilhos.appendChild(lblFilhos);

            const grupoContinuar = criarEl('div');
            grupoContinuar.style.cssText = 'display: flex; align-items: center; gap: 6px;';
            const chkContinuar = criarEl('input');
            chkContinuarRef = chkContinuar;
            chkContinuar.type = 'checkbox';
            chkContinuar.className = 'jusgov-dmg-chk';
            chkContinuar.id = 'chkModalMapeamentoContinuar';
            chkContinuar.checked = false;
            chkContinuar.style.cssText = 'cursor: pointer;';
            const lblContinuar = criarEl('label');
            lblContinuar.htmlFor = 'chkModalMapeamentoContinuar';
            lblContinuar.style.cssText = 'cursor: pointer; user-select: none;';
            lblContinuar.title = 'Se marcado, permite que regras seguintes mais específicas também sejam avaliadas';
            lblContinuar.textContent = 'Continuar avaliando próximas regras';
            grupoContinuar.appendChild(chkContinuar);
            grupoContinuar.appendChild(lblContinuar);

            const sugestaoModo = this._sugerirModoComportamentalPorElemento(baseEl, diagAtualCaptura);
            if (sugestaoModo) {
                const chipSug = criarEl('button');
                chipSugestaoModoRef = chipSug;
                chipSug.type = 'button';
                chipSug.className = 'jusgov-dmg-btn';
                chipSug.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); cursor: pointer; line-height: 1.3;';
                chipSug.textContent = `💡 Sugestão: ${sugestaoModo.rotulo} (Aplicar)`;
                chipSug.title = `Aplicar modo sugerido "${sugestaoModo.rotulo}" com 1 clique`;
                chipSug.addEventListener('click', () => {
                    selectModo.value = sugestaoModo.modo;
                    selectModo.dispatchEvent(new Event('change'));
                });
                topoModo.appendChild(chipSug);
            }

            selectModo.addEventListener('change', () => {
                if (selectModo.value) {
                    selectModo.style.setProperty('border-color', '#475569', 'important');
                    chkContinuar.checked = (selectModo.value === 'textual');
                }
                atualizarVisibilidadeAvisoCurto();
            });
            chkFilhos.addEventListener('change', atualizarVisibilidadeAvisoCurto);
            chkContinuar.addEventListener('change', atualizarVisibilidadeAvisoCurto);

            secModo.appendChild(topoModo);
            secModo.appendChild(selectModo);
            card.appendChild(secModo);

            secFilhos.appendChild(grupoFilhos);
            secFilhos.appendChild(grupoContinuar);
            card.appendChild(secFilhos);

            const secObs = criarEl('div');
            secObs.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

            const topoObs = criarEl('div');
            topoObs.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

            const lblObs = criarEl('label');
            lblObs.style.cssText = 'font-size: 11.5px; font-weight: 600; color: #cbd5e1;';
            lblObs.textContent = 'Observação (opcional, até 150 caracteres):';

            const contadorObs = criarEl('span');
            contadorObs.style.cssText = 'font-size: 11px; color: #64748b;';
            contadorObs.textContent = '0/150';

            topoObs.appendChild(lblObs);
            topoObs.appendChild(contadorObs);

            const inputObs = criarEl('input');
            inputObsRef = inputObs;
            inputObs.type = 'text';
            inputObs.className = 'jusgov-dmg-input';
            inputObs.maxLength = 150;
            inputObs.placeholder = 'Ex: Painel do Polo Ativo, Tabela de Audiências, etc.';
            inputObs.style.cssText = 'padding: 4px 8px; font-size: 12px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px;';
            inputObs.addEventListener('input', () => {
                contadorObs.textContent = `${inputObs.value.length}/150`;
                atualizarVisibilidadeAvisoCurto();
            });

            secObs.appendChild(topoObs);
            secObs.appendChild(inputObs);
            card.appendChild(secObs);

            const rodape = criarEl('div');
            rodape.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 8px; border-top: 1px solid #334155; padding-top: 6px; margin-top: 2px; flex-wrap: wrap;';

            const boxPreviewEspecialista = criarEl('div');
            boxPreviewEspecialista.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-right: auto;';
            lblCorrespondenciasRef = criarEl('span');
            lblCorrespondenciasRef.style.cssText = 'font-size: 11px; font-weight: 600; color: #38bdf8;';
            const btnTestarDestaque = criarEl('button');
            btnTestarDestaqueRef = btnTestarDestaque;
            btnTestarDestaque.type = 'button';
            btnTestarDestaque.className = 'jusgov-dmg-btn jusgov-dmg-btn-test';
            btnTestarDestaque.textContent = '👁️ Testar';
            btnTestarDestaque.title = 'Deixa o diálogo translúcido até você clicar ou pressionar uma tecla comum (exceto Ctrl, Alt, Shift) para visualizar os elementos destacados na página';
            btnTestarDestaque.style.cssText = 'padding: 3px 8px; font-size: 11px; background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; border-radius: 5px; cursor: pointer;';

            let emModoTesteVisibilidade = false;
            let ignorarProximoClickOverlayTeste = false;
            let timerLimparIgnorarClick = null;
            let removerOuvintesTeste = null;
            let restaurarEstilosAlvos = [];
            const TECLAS_MODIFICADORAS_TESTE = new Set(['control', 'alt', 'altgraph', 'shift', 'meta', 'os']);

            const limparOuvintesTeste = () => {
                if (typeof removerOuvintesTeste === 'function') {
                    try { removerOuvintesTeste(); } catch (_) { }
                    removerOuvintesTeste = null;
                }
            };

            const restaurarVisibilidadeModal = () => {
                emModoTesteVisibilidade = false;
                limparOuvintesTeste();
                try {
                    overlay.style.background = 'rgba(15, 23, 42, 0.8)';
                    overlay.style.backdropFilter = 'blur(4px)';
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                } catch (_) { }
                restaurarEstilosAlvos.forEach((fn) => {
                    try { fn(); } catch (_) { }
                });
                restaurarEstilosAlvos = [];
            };

            btnTestarDestaque.addEventListener('click', (evClickBtn) => {
                try {
                    evClickBtn.stopPropagation();
                    restaurarVisibilidadeModal();
                    const marcados = caixasOpcoes
                        .filter(c => c.chk.checked && c.item.valor && c.item.valor.trim())
                        .map(c => ({
                            expressao: (() => { try { return normalizarExpr(c.item.valor, c.item.tipoSeletor); } catch (_) { return c.item.valor; } })(),
                            tipoSeletor: c.item.tipoSeletor
                        }));
                    const docAlvo = (baseEl && baseEl.ownerDocument) || document;
                    const res = this.contarCorrespondenciasRegra(marcados, docAlvo);
                    const alvosFlash = (res && Array.isArray(res.nos)) ? res.nos.slice(0, 25) : [];

                    if (alvosFlash.length > 0) {
                        overlay.style.background = 'rgba(15, 23, 42, 0.08)';
                        overlay.style.backdropFilter = 'none';
                        card.style.opacity = '0.12';
                        card.style.pointerEvents = 'none';
                        emModoTesteVisibilidade = true;

                        const alvosDocs = Array.from(new Set([document, docUi, docAlvo].filter(Boolean)));
                        const aoPressionarMouseTeste = (evMouse) => {
                            if (!emModoTesteVisibilidade) return;
                            ignorarProximoClickOverlayTeste = true;
                            if (timerLimparIgnorarClick) clearTimeout(timerLimparIgnorarClick);
                            timerLimparIgnorarClick = setTimeout(() => {
                                ignorarProximoClickOverlayTeste = false;
                                timerLimparIgnorarClick = null;
                            }, 150);
                            evMouse.preventDefault();
                            evMouse.stopPropagation();
                            restaurarVisibilidadeModal();
                        };
                        const aoClicarTeste = (evClick) => {
                            if (!emModoTesteVisibilidade) return;
                            evClick.preventDefault();
                            evClick.stopPropagation();
                            restaurarVisibilidadeModal();
                        };
                        const aoPressionarTeclaTeste = (evKey) => {
                            if (!emModoTesteVisibilidade) return;
                            const tecla = String(evKey.key || '').toLowerCase();
                            if (TECLAS_MODIFICADORAS_TESTE.has(tecla)) return;
                            evKey.preventDefault();
                            evKey.stopPropagation();
                            restaurarVisibilidadeModal();
                        };

                        alvosDocs.forEach((docItem) => {
                            docItem.addEventListener('mousedown', aoPressionarMouseTeste, true);
                            docItem.addEventListener('click', aoClicarTeste, true);
                            docItem.addEventListener('keydown', aoPressionarTeclaTeste, true);
                        });
                        removerOuvintesTeste = () => {
                            alvosDocs.forEach((docItem) => {
                                docItem.removeEventListener('mousedown', aoPressionarMouseTeste, true);
                                docItem.removeEventListener('click', aoClicarTeste, true);
                                docItem.removeEventListener('keydown', aoPressionarTeclaTeste, true);
                            });
                        };
                    }

                    alvosFlash.forEach((no) => {
                        if (!no || !no.style) return;
                        try {
                            const prevOutline = no.style.outline;
                            const prevOffset = no.style.outlineOffset;
                            const prevShadow = no.style.boxShadow;
                            no.style.outline = '2px solid #f59e0b';
                            no.style.outlineOffset = '1px';
                            no.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.45)';
                            restaurarEstilosAlvos.push(() => {
                                if (!no.style) return;
                                no.style.outline = prevOutline;
                                no.style.outlineOffset = prevOffset;
                                no.style.boxShadow = prevShadow;
                            });
                        } catch (_) { }
                    });

                    if (typeof safeDeps.projetarMiniTip === 'function') {
                        safeDeps.projetarMiniTip(
                            res.total > 0 ? `👁️ ${res.total} elemento(s) destacado(s)` : '⚠️ Nenhum elemento corresponde na página',
                            res.total > 0 ? '#f59e0b' : '#ef4444'
                        );
                    } else if (docAlvo) {
                        atualizarVisibilidadeAvisoCurto();
                    }
                } catch (_) {
                    restaurarVisibilidadeModal();
                }
            });
            overlay._restaurarVisibilidadeModal = restaurarVisibilidadeModal;
            boxPreviewEspecialista.appendChild(lblCorrespondenciasRef);
            boxPreviewEspecialista.appendChild(btnTestarDestaque);
            rodape.appendChild(boxPreviewEspecialista);
            atualizarVisibilidadeAvisoCurto();

            const btnRestaurarInicio = criarEl('button');
            btnRestaurarInicioRef = btnRestaurarInicio;
            btnRestaurarInicio.type = 'button';
            btnRestaurarInicio.className = 'jusgov-dmg-btn jusgov-dmg-btn-warn';
            btnRestaurarInicio.style.cssText = 'padding: 6px 12px; font-size: 12px; background: #1e293b; color: #fbbf24; border: 1px solid #d97706; border-radius: 6px; cursor: pointer; display: none; align-items: center; gap: 4px;';
            btnRestaurarInicio.textContent = '↺ Início';
            btnRestaurarInicio.title = 'Retornar o elemento selecionado e todos os campos da tela ao estado inicial de abertura';
            btnRestaurarInicio.addEventListener('click', () => {
                try {
                    restaurarVisibilidadeModal();
                    if (elInicialModal && baseEl !== elInicialModal) {
                        this.executarInspecaoECapturaSeletorUnico(elInicialModal, {
                            ...safeDeps,
                            _trilhaOriginal: undefined,
                            _elementoInicial: elInicialModal,
                            _modoNavegacaoTrilha: 'padrao'
                        });
                        return;
                    }
                    listaTipos.forEach((it, idx) => {
                        const snap = snapshotInicialTipos[idx];
                        const ref = referenciasLinhas[it.tipoSeletor];
                        if (!snap || !ref) return;
                        it.valor = snap.valor;
                        ref.inputExprModal.value = snap.valor;
                        ref.inputExprModal.style.height = '24px';
                        ref.chk.disabled = !snap.valor;
                        ref.chk.checked = Boolean(snap.padraoChecked && snap.valor);
                        if (ref.selSugestaoLinha) {
                            const opt = Array.from(ref.selSugestaoLinha.options).find(o => o.value === snap.valor);
                            if (opt) opt.selected = true;
                        }
                    });
                    codeDetalhe.style.height = '38px';
                    selectModo.value = '';
                    selectModo.style.setProperty('border-color', '#475569', 'important');
                    chkFilhos.checked = true;
                    chkContinuar.checked = false;
                    inputObs.value = '';
                    contadorObs.textContent = '0/150';
                    atualizarVisibilidadeAvisoCurto();
                } catch (_) { }
            });

            const btnCancelar = criarEl('button');
            btnCancelar.type = 'button';
            btnCancelar.className = 'jusgov-dmg-btn jusgov-dmg-btn-sec';
            btnCancelar.style.cssText = 'padding: 6px 14px; font-size: 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #475569; border-radius: 6px; cursor: pointer;';
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.addEventListener('click', () => this.fecharModal());

            const btnSalvar = criarEl('button');
            btnSalvarRef = btnSalvar;
            btnSalvar.type = 'button';
            btnSalvar.className = 'jusgov-dmg-btn jusgov-dmg-btn-pri';
            btnSalvar.style.cssText = 'padding: 6px 16px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: 1px solid #0369a1; border-radius: 6px; cursor: pointer;';
            btnSalvar.textContent = 'Salvar Regra';

            btnSalvar.addEventListener('click', () => {
                try {
                    const selecionados = caixasOpcoes.filter(c => c.chk.checked && c.item.valor && c.item.valor.trim());
                    if (selecionados.length === 0) {
                        if (typeof safeDeps.projetarMiniTip === 'function') {
                            safeDeps.projetarMiniTip('⚠️ Selecione ao menos um tipo de pesquisa com expressão válida.', '#f59e0b');
                        }
                        return;
                    }

                    if (!selectModo.value) {
                        selectModo.style.setProperty('border-color', '#ef4444', 'important');
                        try { selectModo.focus(); } catch (_) { }
                        if (typeof safeDeps.projetarMiniTip === 'function') {
                            safeDeps.projetarMiniTip('⚠️ Selecione o Modo Comportamental do Elemento antes de salvar.', '#f59e0b');
                        }
                        return;
                    }

                    if (typeof safeDeps.validarExpressaoSeletor === 'function') {
                        const invalido = selecionados.find(s => !safeDeps.validarExpressaoSeletor(s.item.valor, s.item.tipoSeletor));
                        if (invalido) {
                            if (typeof safeDeps.projetarMiniTip === 'function') {
                                safeDeps.projetarMiniTip(`⚠️ Expressão inválida em "${invalido.item.tipoSeletor}".`, '#ef4444');
                            }
                            return;
                        }
                    }

                    const normalizar = normalizarExpr;
                    let obsFinal = (inputObs.value || '').trim();
                    if (!obsFinal) {
                        const dtObs = new Date();
                        const pad2 = (n) => String(n).padStart(2, '0');
                        const dataHoraObs = `${pad2(dtObs.getDate())}/${pad2(dtObs.getMonth() + 1)}/${dtObs.getFullYear()} ${pad2(dtObs.getHours())}:${pad2(dtObs.getMinutes())}:${pad2(dtObs.getSeconds())}`;
                        const tagSelObs = String((codeDetalhe && (codeDetalhe.value || codeDetalhe.textContent)) || `<${tagNome}>`).replace(/\s+/g, ' ').trim();
                        obsFinal = `${dataHoraObs}-${tagSelObs}`;
                    }
                    obsFinal = obsFinal.substring(0, 150);

                    const novasRegras = selecionados.map(s => ({
                        id: 'regra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                        tipoSeletor: s.item.tipoSeletor,
                        expressao: normalizar(s.item.valor, s.item.tipoSeletor),
                        tipo: selectModo.value,
                        observacao: obsFinal,
                        herdarFilhos: chkFilhos.checked,
                        ativo: true,
                        continuarProxima: chkContinuar.checked
                    }));

                    if (typeof safeDeps.aoSalvarRegras === 'function') {
                        safeDeps.aoSalvarRegras(novasRegras);
                    }

                    if (typeof safeDeps.copiarTexto === 'function') {
                        try {
                            const promCopia = safeDeps.copiarTexto(selecionados[0].item.valor);
                            if (promCopia && typeof promCopia.catch === 'function') promCopia.catch(() => { });
                        } catch (_) { }
                    }

                    restaurarVisibilidadeModal();
                    this.fecharModal();

                    if (typeof safeDeps.projetarMiniTip === 'function') {
                        const msg = novasRegras.length === 1
                            ? `✓ Regra salva: ${novasRegras[0].tipoSeletor} (${selectModo.value})`
                            : `✓ ${novasRegras.length} regras salvas (${selectModo.value})`;
                        safeDeps.projetarMiniTip(msg, '#10b981');
                    }
                } catch (_) {
                    if (typeof safeDeps.projetarMiniTip === 'function') {
                        try { safeDeps.projetarMiniTip('⚠️ Erro ao salvar regra manual. Verifique a expressão informada.', '#ef4444'); } catch (__) { }
                    }
                }
            });

            const boxAcoesRodape = criarEl('div');
            boxAcoesRodape.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; margin-left: auto;';
            boxAcoesRodape.appendChild(btnRestaurarInicio);
            boxAcoesRodape.appendChild(btnCancelar);
            boxAcoesRodape.appendChild(btnSalvar);
            rodape.appendChild(boxAcoesRodape);
            card.appendChild(rodape);
            overlay.appendChild(card);
            overlay.appendChild(this._criarFolhaEstiloIsolada(docUi));
            atualizarVisibilidadeAvisoCurto();

            overlay.addEventListener('click', (ev) => {
                if (ignorarProximoClickOverlayTeste || emModoTesteVisibilidade) {
                    ignorarProximoClickOverlayTeste = false;
                    if (timerLimparIgnorarClick) {
                        clearTimeout(timerLimparIgnorarClick);
                        timerLimparIgnorarClick = null;
                    }
                    restaurarVisibilidadeModal();
                    ev.stopPropagation();
                    return;
                }
                if (ev.target === overlay) {
                    restaurarVisibilidadeModal();
                    this.fecharModal();
                }
            });

            ['mousedown', 'mouseup', 'click', 'focusin'].forEach((evNome) => {
                card.addEventListener(evNome, (ev) => {
                    ev.stopPropagation();
                });
            });

            let obsBlindagemSelect = null;
            const blindarSelectsContraPagina = () => {
                try {
                    card.querySelectorAll('*:not([data-jusgov-ignore="true"]):not(option):not(style)').forEach((intruso) => {
                        try { intruso.remove(); } catch (_) { }
                    });
                    card.querySelectorAll('select.jusgov-dmg-select, select.jusgov-dmg-select-sm').forEach((sel) => {
                        if (sel.hasAttribute('aria-hidden')) sel.removeAttribute('aria-hidden');
                        if (sel.tabIndex < 0) sel.tabIndex = 0;
                        if (sel.style.display === 'none' || sel.style.visibility === 'hidden' || sel.style.opacity === '0') {
                            sel.style.setProperty('display', sel.classList.contains('jusgov-dmg-select-sm') ? 'inline-block' : 'block', 'important');
                            sel.style.setProperty('visibility', 'visible', 'important');
                            sel.style.setProperty('opacity', '1', 'important');
                        }
                    });
                } catch (_) { }
            };
            if (typeof MutationObserver !== 'undefined') {
                obsBlindagemSelect = new MutationObserver(blindarSelectsContraPagina);
                obsBlindagemSelect.observe(card, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'aria-hidden', 'tabindex'] });
            }

            const docsEsc = Array.from(new Set([docUi, document, docAlvoBase].filter(Boolean)));
            const removerOuvinteEsc = () => {
                if (obsBlindagemSelect) {
                    try { obsBlindagemSelect.disconnect(); } catch (_) { }
                    obsBlindagemSelect = null;
                }
                docsEsc.forEach((d) => {
                    try { d.removeEventListener('keydown', ouvinteEsc); } catch (_) { }
                });
            };
            const ouvinteEsc = (ev) => {
                if (!overlay.isConnected) {
                    removerOuvinteEsc();
                    return;
                }
                if (ev.key === 'Escape') {
                    if (emModoTesteVisibilidade) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        restaurarVisibilidadeModal();
                        return;
                    }
                    restaurarVisibilidadeModal();
                    this.fecharModal();
                    removerOuvinteEsc();
                }
            };
            overlay._limparOuvintesModal = removerOuvinteEsc;
            docsEsc.forEach((d) => {
                try { d.addEventListener('keydown', ouvinteEsc); } catch (_) { }
            });

            docUi.body.appendChild(overlay);
            if (typeof overlay.showPopover === 'function') {
                try {
                    if (overlay.matches && overlay.matches(':popover-open')) {
                        overlay.hidePopover();
                    }
                    overlay.showPopover();
                } catch (_) { }
            }
            this.#modalAberto = overlay;
            return overlay;
            } catch (_) {
                this.fecharModal();
                if (deps && typeof deps.projetarMiniTip === 'function') {
                    try { deps.projetarMiniTip('⚠️ Não foi possível abrir o diálogo de mapeamento para este elemento.', '#ef4444'); } catch (__) { }
                }
                return null;
            }
        }

        executarInspecaoECapturaSeletorUnico(el, deps = {}) {
            try {
                if (!el) return null;
                const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
                if (!base) return null;

                const cssSimples = this.extrairSeletorCssSimples(base);
                const xpathRel = this.extrairCaminhoXPathRelativo(base);
                const xpathAbs = this.extrairCaminhoXPathAbsoluto(base);
                const seletorCss = this.extrairSeletorCssSimplificado(base);
                const seletorCss2 = this.extrairSeletorCss2(base);

                const seletorPreferencial = (xpathRel && xpathRel.startsWith('//*[@id='))
                    ? xpathRel
                    : (seletorCss || xpathRel || xpathAbs);

                if (deps && typeof deps.dispararFlashBorderVisual === 'function') {
                    try {
                        const rng = document.createRange();
                        rng.selectNode(base);
                        deps.dispararFlashBorderVisual(rng, 800, '#0284c7');
                    } catch (_) { }
                }

                this.abrirModal(base, {
                    cssSimples,
                    xpathRel,
                    xpathAbs,
                    seletorCss,
                    seletorCss2,
                    preferencial: seletorPreferencial
                }, deps);

                return {
                    xpathRelativo: xpathRel,
                    xpathAbsoluto: xpathAbs,
                    seletorCss,
                    seletorCss2,
                    preferencial: seletorPreferencial
                };
            } catch (_) {
                this.fecharModal();
                return null;
            }
        }
    }

    Object.freeze(DialogoMapeamentoRegra.prototype);
    return Object.freeze(DialogoMapeamentoRegra);
}));
