/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-dialogo-mapeamento.js
 * PROJETO: JusGovBR — Seleção/Cópia Inteligente
 * MÓDULO: Grupo 2 — CÓPIA INTELIGENTE (Diálogo de Mapeamento Manual e Extração de Seletores)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-dialogo-mapeamento.js
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

        extrairCaminhoXPathAbsoluto(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            if (el.tagName.toLowerCase() === 'html') return '/html';
            if (el.tagName.toLowerCase() === 'body') return '/html/body';

            let caminho = '';
            let atual = el;
            while (atual && atual.nodeType === Node.ELEMENT_NODE && atual.tagName.toLowerCase() !== 'html') {
                const tag = atual.tagName.toLowerCase();
                let index = 1;
                let irmao = atual.previousElementSibling;
                while (irmao) {
                    if (irmao.tagName.toLowerCase() === tag) {
                        index++;
                    }
                    irmao = irmao.previousElementSibling;
                }
                caminho = `/${tag}[${index}]` + caminho;
                atual = atual.parentElement;
            }
            return '/html' + caminho;
        }

        extrairCaminhoXPathRelativo(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            if (el.id && typeof el.id === 'string' && el.id.trim()) {
                return `//*[@id="${el.id.trim()}"]`;
            }
            let atual = el;
            let caminhoRel = '';
            while (atual && atual.nodeType === Node.ELEMENT_NODE && atual !== document.body && atual !== document.documentElement) {
                if (atual !== el && atual.id && typeof atual.id === 'string' && atual.id.trim()) {
                    return `//*[@id="${atual.id.trim()}"]` + caminhoRel;
                }
                const tag = atual.tagName.toLowerCase();
                let index = 1;
                let irmao = atual.previousElementSibling;
                while (irmao) {
                    if (irmao.tagName.toLowerCase() === tag) {
                        index++;
                    }
                    irmao = irmao.previousElementSibling;
                }
                caminhoRel = `/${tag}[${index}]` + caminhoRel;
                atual = atual.parentElement;
            }
            return this.extrairCaminhoXPathAbsoluto(el);
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
            if (!el || !el.classList) return [];
            const todas = Array.from(el.classList).filter(c => c && !c.startsWith('jusgov') && !c.startsWith('ng-') && !c.startsWith('v-'));
            const limpas = todas.filter(c => !c.includes(':') && !c.includes('[') && !c.includes('/'));
            const fallback = todas.filter(c => c.includes(':') || c.includes('[') || c.includes('/'));
            return [...limpas, ...fallback];
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
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            if (el.id && typeof el.id === 'string' && el.id.trim()) {
                return `#${this._escaparIdentCss(el.id.trim())}`;
            }
            const classes = this._obterClassesOrdenadasCss(el).filter(c => !c.includes(':'));
            if (classes.length > 0) {
                return '.' + classes.slice(0, 3).map(c => this._escaparIdentCss(c)).join('.');
            }
            return (el.tagName || '').toLowerCase();
        }

        extrairSeletorCss2(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
            const partes = [];
            let atual = el;
            while (atual && atual.nodeType === Node.ELEMENT_NODE && atual.tagName) {
                const tag = atual.tagName.toLowerCase();
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
        }

        /**
         * Constrói a trilha hierárquica completa do <html> até o elemento alvo,
         * incluindo o índice XPath entre irmãos de mesma tag em cada degrau.
         * @param {Element} el
         * @returns {Array<{el: Element, tag: string, segmentoXPath: string, segmentoTag: string}>}
         */
        construirTrilhaElementos(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return [];
            const trilha = [];
            let atual = el;
            while (atual && atual.nodeType === Node.ELEMENT_NODE && atual.tagName) {
                const tag = atual.tagName.toLowerCase();
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
                    if (irmao.tagName && irmao.tagName.toLowerCase() === tag) {
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
        }

        /**
         * Formata uma representação HTML detalhada do elemento selecionado
         * exibindo tag e principais atributos (id, name, type, role, class, etc.).
         * @param {Element} el
         * @returns {{completo: string, resumido: string}}
         */
        formatarTagDetalhada(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE || !el.tagName) {
                return { completo: '', resumido: '' };
            }
            const tag = el.tagName.toLowerCase();
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
        }

        /**
         * Avalia localmente quantos elementos da página correspondem às expressões fornecidas,
         * ignorando o próprio modal e retornando os primeiros nós encontrados para prévia visual.
         */
        contarCorrespondenciasRegra(itensAtivos = [], docAlvo = null) {
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
                    algunaInvalida = true;
                }
            });

            return { total: encontrados.size, nos: Array.from(encontrados), invalida: algumaInvalida };
        }

        _escaparXPathLiteral(str) {
            const txt = String(str || '');
            if (!txt.includes('"')) return `"${txt}"`;
            if (!txt.includes("'")) return `'${txt}'`;
            return 'concat("' + txt.split('"').join('", \'"\', "') + '")';
        }

        /**
         * Gera variações ordenadas (do mais específico ao mais genérico, incluindo Tag pura)
         * para auxiliar na escolha da granularidade de qualquer tipo de seletor no modal.
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

            const add = (rotulo, val) => {
                if (val && !sugestoes.some(s => s.val === val)) {
                    sugestoes.push({ rotulo, val });
                }
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
                add(`Tag pura (${tagNome})`, tagNome);
            } else if (tipoSeletor === 'CSS (Hierárquico)') {
                add('Hierárquico padrão', valorPadrao || seletores.seletorCss);
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
                    add(`Pai > Tag (${paiTag} > ${tagNome})`, `${paiTag} > ${tagNome}`);
                }
                add(`Somente Tag + índice (${tagNome}:nth-of-type)`, `${tagNome}:nth-of-type(${calcularIndiceTipo(baseEl)})`);
                add(`Tag pura (${tagNome})`, tagNome);
            } else if (tipoSeletor === 'CSS (Estrutural)') {
                const completo = valorPadrao || seletores.seletorCss2 || '';
                add('Estrutural completo (:nth-child)', completo);
                const partes = completo ? completo.split(' > ') : [];
                if (partes.length > 3) {
                    add('Últimos 3 níveis (:nth-child)', partes.slice(-3).join(' > '));
                }
                if (partes.length > 2) {
                    add('Últimos 2 níveis (:nth-child)', partes.slice(-2).join(' > '));
                }
                if (partes.length >= 1) {
                    add(`Alvo posicional (${partes[partes.length - 1]})`, partes[partes.length - 1]);
                }
                add(`Tag pura (${tagNome})`, tagNome);
            } else if (tipoSeletor === 'XPath (Simplificado)') {
                add('Simplificado padrão', valorPadrao || seletores.xpathRel);
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
                add(`Tag pura (//${tagNome})`, `//${tagNome}`);
            } else if (tipoSeletor === 'XPath (Completo)') {
                const abs = valorPadrao || seletores.xpathAbs || '';
                add('Completo indexado (exato)', abs);
                if (abs) {
                    const semIndices = abs.replace(/\[\d+\]/g, '');
                    if (semIndices !== abs) {
                        add('Caminho completo sem índices (generalizado)', semIndices);
                    }
                    const segs = abs.split('/').filter(Boolean);
                    if (segs.length >= 2) {
                        const paiSeg = segs[segs.length - 2];
                        const alvoSeg = segs[segs.length - 1];
                        add(`Pai indexado + alvo (//${paiSeg}/${alvoSeg})`, `//${paiSeg}/${alvoSeg}`);
                        const paiSemIdx = paiSeg.replace(/\[\d+\]/g, '');
                        add(`Pai + Tag sem índice (//${paiSemIdx}/${tagNome})`, `//${paiSemIdx}/${tagNome}`);
                    }
                }
                add(`Tag pura (//${tagNome})`, `//${tagNome}`);
            }

            if (valorPadrao && !sugestoes.some(s => s.val === valorPadrao)) {
                sugestoes.unshift({ rotulo: 'Padrão calculado', val: valorPadrao });
            }
            return sugestoes;
        }

        fecharModal() {
            if (this.#modalAberto) {
                try {
                    if (typeof this.#modalAberto._restaurarVisibilidadeModal === 'function') {
                        this.#modalAberto._restaurarVisibilidadeModal();
                    }
                    this.#modalAberto.remove();
                } catch (_) { }
                this.#modalAberto = null;
            }
            if (typeof document !== 'undefined') {
                const antigo = document.getElementById('jusgov-modal-mapeamento-regra');
                if (antigo) {
                    try { antigo.remove(); } catch (_) { }
                }
            }
        }

        abrirModal(baseEl, seletoresExtraidos, deps = {}) {
            if (!baseEl || typeof document === 'undefined' || !document.body) return null;
            this.fecharModal();

            const seletores = seletoresExtraidos || {
                cssSimples: this.extrairSeletorCssSimples(baseEl),
                xpathRel: this.extrairCaminhoXPathRelativo(baseEl),
                xpathAbs: this.extrairCaminhoXPathAbsoluto(baseEl),
                seletorCss: this.extrairSeletorCssSimplificado(baseEl),
                seletorCss2: this.extrairSeletorCss2(baseEl)
            };

            const overlay = document.createElement('div');
            overlay.id = 'jusgov-modal-mapeamento-regra';
            overlay.setAttribute('data-jusgov-ignore', 'true');
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = 'position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); transition: background 0.2s ease, backdrop-filter 0.2s ease; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

            const card = document.createElement('div');
            card.setAttribute('data-jusgov-ignore', 'true');
            card.style.cssText = 'background: #0f172a; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6); transition: opacity 0.2s ease; width: min(96vw, 840px); max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow-y: auto; color: #f8fafc; display: flex; flex-direction: column; gap: 6px; padding: 10px 14px; box-sizing: border-box;';

            const cabecalho = document.createElement('div');
            cabecalho.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #334155; padding-bottom: 6px; gap: 10px;';

            const infoCab = document.createElement('div');
            infoCab.style.cssText = 'flex: 1; min-width: 0;';
            const titulo = document.createElement('h3');
            titulo.style.cssText = 'margin: 0; font-size: 14.5px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';
            const spanTituloTxt = document.createElement('span');
            spanTituloTxt.textContent = '⚙️ Salvar Regra de Mapeamento Manual';
            titulo.appendChild(spanTituloTxt);

            if (typeof deps.obterDiagnosticoElemento === 'function') {
                try {
                    const diagAtual = deps.obterDiagnosticoElemento(baseEl);
                    if (diagAtual && diagAtual.tipo) {
                        const mapaCoresAtual = {
                            interface: { rot: 'Interface', cor: '#fbbf24' },
                            semiflexivel: { rot: 'SemiFlexível', cor: '#38bdf8' },
                            textual: { rot: 'Textual', cor: '#34d399' },
                            editavel: { rot: 'Editável', cor: '#c084fc' }
                        };
                        const infoAtual = mapaCoresAtual[diagAtual.tipo] || { rot: diagAtual.tipo, cor: '#cbd5e1' };
                        const badgeDiag = document.createElement('span');
                        badgeDiag.style.cssText = `font-size: 10.5px; font-weight: 600; color: ${infoAtual.cor}; background: #1e293b; border: 1px solid #334155; padding: 1px 7px; border-radius: 999px;`;
                        badgeDiag.textContent = `Atual: ${infoAtual.rot}${diagAtual.origem ? ' (' + diagAtual.origem + ')' : ''}`;
                        if (diagAtual.detalhe) badgeDiag.title = diagAtual.detalhe;
                        titulo.appendChild(badgeDiag);
                    }
                } catch (_) { }
            }

            const tagNome = (baseEl.tagName || 'ELEMENT').toLowerCase();
            const idInfo = baseEl.id ? `#${baseEl.id}` : '';

            /* Trilha hierárquica completa preservada para permitir subir (Pai) e descer (Filho) sem perder o caminho */
            const trilhaMemorizada = Array.isArray(deps._trilhaOriginal) && deps._trilhaOriginal.some(item => item && item.el === baseEl)
                ? deps._trilhaOriginal
                : this.construirTrilhaElementos(baseEl);
            const indiceAtual = Math.max(0, trilhaMemorizada.findIndex(item => item && item.el === baseEl));
            const depsComTrilha = { ...deps, _trilhaOriginal: trilhaMemorizada };

            const descAlvo = document.createElement('div');
            descAlvo.style.cssText = 'font-size: 12px; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; width: 100%;';
            const lblAlvo = document.createElement('span');
            lblAlvo.style.cssText = 'font-weight: 600; color: #cbd5e1; margin-right: 2px;';
            lblAlvo.textContent = 'Elemento clicado: ';
            descAlvo.appendChild(lblAlvo);

            trilhaMemorizada.forEach((passo, idx) => {
                const ehAtual = idx === indiceAtual;
                const ehDescendente = idx > indiceAtual;
                const btnPassoTag = document.createElement('button');
                btnPassoTag.type = 'button';
                btnPassoTag.textContent = passo.segmentoTag;
                btnPassoTag.title = `Selecionar <${passo.tag}> neste nível (regra genérica "Tag pura")`;
                btnPassoTag.style.cssText = ehAtual
                    ? 'font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a; background: #38bdf8; border: 1px solid #7dd3fc; padding: 1px 5px; border-radius: 4px; cursor: pointer;'
                    : (ehDescendente
                        ? 'font-family: monospace; font-size: 11px; color: #64748b; background: #0f172a; border: 1px dashed #334155; padding: 1px 5px; border-radius: 4px; cursor: pointer;'
                        : 'font-family: monospace; font-size: 11px; color: #38bdf8; background: #1e293b; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px; cursor: pointer;');
                btnPassoTag.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(passo.el, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'generico'
                    });
                });
                descAlvo.appendChild(btnPassoTag);
            });

            let inputCssSimplesRef = null;
            let chkCssSimplesRef = null;
            let selCssSimplesRef = null;
            const referenciasLinhas = {};

            const aplicarNoCssSimples = (novoValor) => {
                if (!novoValor || !inputCssSimplesRef) return;
                inputCssSimplesRef.value = novoValor;
                inputCssSimplesRef.dispatchEvent(new Event('input'));
                if (selCssSimplesRef) {
                    const optMatch = Array.from(selCssSimplesRef.options).find(o => o.value === novoValor);
                    if (optMatch) optMatch.selected = true;
                }
                if (chkCssSimplesRef) {
                    chkCssSimplesRef.disabled = false;
                    chkCssSimplesRef.checked = true;
                }
            };

            if (idInfo) {
                const chipId = document.createElement('button');
                chipId.type = 'button';
                chipId.textContent = idInfo;
                chipId.title = `Usar "${idInfo}" em CSS (Simples)`;
                chipId.style.cssText = 'font-family: monospace; font-size: 11px; color: #34d399; background: #1e293b; border: 1px solid #334155; padding: 1px 6px; border-radius: 4px; cursor: pointer; margin-left: 2px;';
                chipId.addEventListener('click', () => aplicarNoCssSimples(idInfo));
                descAlvo.appendChild(chipId);
            }

            const boxNavPaiFilho = document.createElement('span');
            boxNavPaiFilho.style.cssText = 'margin-left: auto; display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;';

            if (indiceAtual > 0 || (baseEl.parentElement && baseEl.parentElement !== document.documentElement)) {
                const alvoPai = indiceAtual > 0 ? trilhaMemorizada[indiceAtual - 1].el : baseEl.parentElement;
                const btnPai = document.createElement('button');
                btnPai.type = 'button';
                btnPai.textContent = '↑ Pai';
                btnPai.title = `Subir para <${alvoPai.tagName.toLowerCase()}${alvoPai.id ? '#' + alvoPai.id : ''}>`;
                btnPai.style.cssText = 'font-size: 11px; font-weight: 600; color: #fbbf24; background: #1e293b; border: 1px solid #d97706; padding: 1px 8px; border-radius: 4px; cursor: pointer;';
                btnPai.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(alvoPai, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'padrao'
                    });
                });
                boxNavPaiFilho.appendChild(btnPai);
            }

            if (indiceAtual < trilhaMemorizada.length - 1) {
                const alvoFilho = trilhaMemorizada[indiceAtual + 1].el;
                const btnFilho = document.createElement('button');
                btnFilho.type = 'button';
                btnFilho.textContent = '↓ Filho';
                btnFilho.title = `Retornar para <${alvoFilho.tagName.toLowerCase()}${alvoFilho.id ? '#' + alvoFilho.id : ''}>`;
                btnFilho.style.cssText = 'font-size: 11px; font-weight: 600; color: #34d399; background: #1e293b; border: 1px solid #059669; padding: 1px 8px; border-radius: 4px; cursor: pointer;';
                btnFilho.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(alvoFilho, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'padrao'
                    });
                });
                boxNavPaiFilho.appendChild(btnFilho);
            }

            if (boxNavPaiFilho.childElementCount > 0) {
                descAlvo.appendChild(boxNavPaiFilho);
            }

            /* Linha 2: Trilha XPath (Completo) indexada e clicável (permite navegar especializado entre pai/filho) */
            const descXPathTrilha = document.createElement('div');
            descXPathTrilha.style.cssText = 'font-size: 11.5px; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 2px; flex-wrap: wrap;';
            const lblXPathTrilha = document.createElement('span');
            lblXPathTrilha.style.cssText = 'font-weight: 600; color: #cbd5e1; margin-right: 4px;';
            lblXPathTrilha.textContent = 'XPath (Completo):';
            descXPathTrilha.appendChild(lblXPathTrilha);

            trilhaMemorizada.forEach((passo, idx) => {
                const ehAtual = idx === indiceAtual;
                const ehDescendente = idx > indiceAtual;
                const sep = document.createElement('span');
                sep.textContent = '/';
                sep.style.cssText = ehDescendente ? 'color: #475569; font-family: monospace;' : 'color: #64748b; font-family: monospace;';
                descXPathTrilha.appendChild(sep);

                const btnPassoXp = document.createElement('button');
                btnPassoXp.type = 'button';
                btnPassoXp.textContent = passo.segmentoXPath;
                btnPassoXp.title = `Ir para "${passo.segmentoXPath}" com XPath (Completo) especializado`;
                btnPassoXp.style.cssText = ehAtual
                    ? 'font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a; background: #fbbf24; border: 1px solid #f59e0b; padding: 0 5px; border-radius: 4px; cursor: pointer;'
                    : (ehDescendente
                        ? 'font-family: monospace; font-size: 11px; color: #64748b; background: transparent; border: 1px dashed #334155; padding: 0 4px; border-radius: 4px; cursor: pointer;'
                        : 'font-family: monospace; font-size: 11px; color: #e2e8f0; background: #1e293b; border: 1px solid #334155; padding: 0 4px; border-radius: 4px; cursor: pointer;');
                btnPassoXp.addEventListener('click', () => {
                    this.executarInspecaoECapturaSeletorUnico(passo.el, {
                        ...depsComTrilha,
                        _modoNavegacaoTrilha: 'especializado'
                    });
                });
                descXPathTrilha.appendChild(btnPassoXp);
            });

            /* Linha 3: Resumo detalhado do elemento atualmente selecionado (<div name="..." class="..." id="...">) */
            const detalheAtual = this.formatarTagDetalhada(baseEl);
            const descDetalheEl = document.createElement('div');
            descDetalheEl.style.cssText = 'font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; align-items: flex-start; gap: 6px; width: 100%;';
            const lblDetalhe = document.createElement('span');
            lblDetalhe.style.cssText = 'font-weight: 600; color: #cbd5e1; flex-shrink: 0; padding-top: 2px;';
            lblDetalhe.textContent = 'Selecionado:';
            const codeDetalhe = document.createElement('code');
            codeDetalhe.textContent = detalheAtual.completo || `<${tagNome}>`;
            codeDetalhe.title = detalheAtual.completo || `<${tagNome}>`;
            codeDetalhe.style.cssText = 'font-family: monospace; font-size: 11px; color: #a5f3fc; background: #1e293b; border: 1px solid #334155; padding: 2px 7px; border-radius: 4px; flex: 1; min-width: 0; white-space: pre-wrap; word-break: break-word; max-height: 54px; overflow-y: auto;';
            descDetalheEl.appendChild(lblDetalhe);
            descDetalheEl.appendChild(codeDetalhe);

            infoCab.appendChild(titulo);
            infoCab.appendChild(descAlvo);
            infoCab.appendChild(descXPathTrilha);
            infoCab.appendChild(descDetalheEl);

            const btnFechar = document.createElement('button');
            btnFechar.type = 'button';
            btnFechar.textContent = '✕';
            btnFechar.setAttribute('aria-label', 'Fechar');
            btnFechar.style.cssText = 'background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 2px 6px; line-height: 1; border-radius: 4px;';
            btnFechar.addEventListener('click', () => this.fecharModal());

            cabecalho.appendChild(infoCab);
            cabecalho.appendChild(btnFechar);
            card.appendChild(cabecalho);

            const normalizarExpr = typeof deps.normalizarExpressaoAtributoCss === 'function'
                ? deps.normalizarExpressaoAtributoCss
                : (v) => v;

            const secSeletores = document.createElement('div');
            secSeletores.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

            const lblSecSeletores = document.createElement('label');
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

            const caixasOpcoes = [];

            const painelAlertaCurto = document.createElement('div');
            painelAlertaCurto.style.cssText = 'font-size: 11px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 8px; border-radius: 6px; display: none; line-height: 1.35;';
            painelAlertaCurto.textContent = '⚠️ Alerta: Regras genéricas como /html ou /html/body afetam a página inteira. Salve somente se intencional.';

            let lblCorrespondenciasRef = null;
            const atualizarVisibilidadeAvisoCurto = () => {
                const temCurtaSelecionada = caixasOpcoes.some(c => c.chk.checked && this.isRegraMuitoCurta(c.item.valor));
                painelAlertaCurto.style.display = temCurtaSelecionada ? 'block' : 'none';
                if (lblCorrespondenciasRef) {
                    const marcados = caixasOpcoes
                        .filter(c => c.chk.checked && c.item.valor && c.item.valor.trim())
                        .map(c => ({ expressao: normalizarExpr(c.item.valor, c.item.tipoSeletor), tipoSeletor: c.item.tipoSeletor }));
                    if (marcados.length === 0) {
                        lblCorrespondenciasRef.textContent = '🎯 Marque ao menos 1 seletor';
                        lblCorrespondenciasRef.style.color = '#94a3b8';
                    } else {
                        const res = this.contarCorrespondenciasRegra(marcados, baseEl.ownerDocument);
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
            };

            listaTipos.forEach((item, i) => {
                const linha = document.createElement('div');
                linha.style.cssText = 'display: flex; align-items: flex-start; gap: 6px; background: #1e293b; padding: 5px 8px; border-radius: 6px; border: 1px solid #334155;';

                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.id = `chk_tipo_seletor_${i}`;
                chk.style.cssText = 'margin-top: 2px; cursor: pointer;';
                chk.checked = Boolean(item.padrao && item.valor);
                chk.disabled = !item.valor;

                const rotuloCorpo = document.createElement('div');
                rotuloCorpo.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;';

                const topoLinha = document.createElement('div');
                topoLinha.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 6px;';

                const badge = document.createElement('span');
                badge.style.cssText = 'font-size: 11px; font-weight: 700; color: #38bdf8;';
                badge.textContent = item.tipoSeletor;

                topoLinha.appendChild(badge);

                const sugestoesLinha = this.gerarSugestoesSeletor(item.tipoSeletor, baseEl, item.valor, seletores);
                let selSugestaoLinha = null;
                if (sugestoesLinha.length > 0) {
                    selSugestaoLinha = document.createElement('select');
                    selSugestaoLinha.style.cssText = 'font-size: 11px; background: #0f172a; color: #e2e8f0; border: 1px solid #475569; border-radius: 4px; padding: 1px 6px; cursor: pointer; max-width: 300px;';
                    sugestoesLinha.forEach((s) => {
                        const opt = document.createElement('option');
                        opt.value = s.val;
                        opt.textContent = s.rotulo;
                        if (s.val === item.valor) opt.selected = true;
                        selSugestaoLinha.appendChild(opt);
                    });
                    topoLinha.appendChild(selSugestaoLinha);
                }

                if (this.isRegraMuitoCurta(item.valor)) {
                    const avisoCurta = document.createElement('span');
                    avisoCurta.style.cssText = 'font-size: 10px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1px 4px; border-radius: 3px;';
                    avisoCurta.textContent = '⚠️ Seletor curto (escopo global)';
                    topoLinha.appendChild(avisoCurta);
                }

                const inputExprModal = document.createElement('textarea');
                inputExprModal.rows = (item.valor && item.valor.length > 95) ? 2 : 1;
                inputExprModal.style.cssText = 'width: 100%; box-sizing: border-box; font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 3px 7px; min-height: 22px; border-radius: 4px; border: 1px solid #475569; resize: vertical;';
                inputExprModal.value = item.valor || '';
                inputExprModal.placeholder = '(Não disponível — digite manualmente se desejar)';
                inputExprModal.addEventListener('input', () => {
                    item.valor = inputExprModal.value.trim();
                    chk.disabled = !item.valor;
                    if (!item.valor) chk.checked = false;
                    atualizarVisibilidadeAvisoCurto();
                });

                if (selSugestaoLinha) {
                    selSugestaoLinha.addEventListener('change', () => {
                        item.valor = selSugestaoLinha.value;
                        inputExprModal.value = selSugestaoLinha.value;
                        chk.disabled = !item.valor;
                        if (item.valor) chk.checked = true;
                        atualizarVisibilidadeAvisoCurto();
                    });
                }

                if (item.tipoSeletor === 'CSS (Simples)') {
                    inputCssSimplesRef = inputExprModal;
                    chkCssSimplesRef = chk;
                    selCssSimplesRef = selSugestaoLinha;
                }
                referenciasLinhas[item.tipoSeletor] = { chk, item, inputExprModal, selSugestaoLinha };

                rotuloCorpo.appendChild(topoLinha);
                rotuloCorpo.appendChild(inputExprModal);

                linha.appendChild(chk);
                linha.appendChild(rotuloCorpo);
                secSeletores.appendChild(linha);

                caixasOpcoes.push({ chk, item });
            });

            if (deps._modoNavegacaoTrilha === 'generico') {
                Object.keys(referenciasLinhas).forEach((k) => {
                    referenciasLinhas[k].chk.checked = (k === 'CSS (Simples)');
                });
                aplicarNoCssSimples(tagNome);
            } else if (deps._modoNavegacaoTrilha === 'especializado') {
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

            const secModo = document.createElement('div');
            secModo.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

            const lblModo = document.createElement('label');
            lblModo.style.cssText = 'font-size: 11.5px; font-weight: 600; color: #cbd5e1;';
            lblModo.textContent = 'Modo Comportamental do Elemento:';

            const selectModo = document.createElement('select');
            selectModo.style.cssText = 'padding: 4px 8px; font-size: 12px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; cursor: pointer;';

            const optVazio = document.createElement('option');
            optVazio.value = '';
            optVazio.textContent = '-- Selecione o modo comportamental (obrigatório) --';
            optVazio.selected = true;

            const optInterface = document.createElement('option');
            optInterface.value = 'interface';
            optInterface.textContent = 'Interface (Desseleciona sem Alt; bloqueia cópia de texto simples)';

            const optSemiflexivel = document.createElement('option');
            optSemiflexivel.value = 'semiflexivel';
            optSemiflexivel.textContent = 'Semiflexível (Cópia rápida com 1 clique restrita a máscaras forenses)';

            const optTextual = document.createElement('option');
            optTextual.value = 'textual';
            optTextual.textContent = 'Textual (Modo leitura documental com seleção mantida no DOM)';

            const optEditavel = document.createElement('option');
            optEditavel.value = 'editavel';
            optEditavel.textContent = 'Editável (Campos de digitação, textarea, datas e áreas de placeholders/minutas)';

            selectModo.appendChild(optVazio);
            selectModo.appendChild(optInterface);
            selectModo.appendChild(optSemiflexivel);
            selectModo.appendChild(optTextual);
            selectModo.appendChild(optEditavel);
            selectModo.addEventListener('change', () => {
                if (selectModo.value) {
                    selectModo.style.borderColor = '#475569';
                }
            });

            secModo.appendChild(lblModo);
            secModo.appendChild(selectModo);
            card.appendChild(secModo);

            const secFilhos = document.createElement('div');
            secFilhos.style.cssText = 'display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 11.5px; color: #cbd5e1;';

            const grupoFilhos = document.createElement('div');
            grupoFilhos.style.cssText = 'display: flex; align-items: center; gap: 6px;';
            const chkFilhos = document.createElement('input');
            chkFilhos.type = 'checkbox';
            chkFilhos.id = 'chkModalMapeamentoFilhos';
            chkFilhos.checked = true;
            chkFilhos.style.cssText = 'cursor: pointer;';
            const lblFilhos = document.createElement('label');
            lblFilhos.htmlFor = 'chkModalMapeamentoFilhos';
            lblFilhos.style.cssText = 'cursor: pointer; user-select: none;';
            lblFilhos.textContent = 'Aplicar regra também aos elementos filhos / descendentes';
            grupoFilhos.appendChild(chkFilhos);
            grupoFilhos.appendChild(lblFilhos);

            const grupoContinuar = document.createElement('div');
            grupoContinuar.style.cssText = 'display: flex; align-items: center; gap: 6px;';
            const chkContinuar = document.createElement('input');
            chkContinuar.type = 'checkbox';
            chkContinuar.id = 'chkModalMapeamentoContinuar';
            chkContinuar.checked = false;
            chkContinuar.style.cssText = 'cursor: pointer;';
            const lblContinuar = document.createElement('label');
            lblContinuar.htmlFor = 'chkModalMapeamentoContinuar';
            lblContinuar.style.cssText = 'cursor: pointer; user-select: none;';
            lblContinuar.title = 'Se marcado, permite que regras seguintes mais específicas também sejam avaliadas';
            lblContinuar.textContent = 'Continuar avaliando próximas regras';
            grupoContinuar.appendChild(chkContinuar);
            grupoContinuar.appendChild(lblContinuar);

            secFilhos.appendChild(grupoFilhos);
            secFilhos.appendChild(grupoContinuar);
            card.appendChild(secFilhos);

            const secObs = document.createElement('div');
            secObs.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

            const topoObs = document.createElement('div');
            topoObs.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

            const lblObs = document.createElement('label');
            lblObs.style.cssText = 'font-size: 11.5px; font-weight: 600; color: #cbd5e1;';
            lblObs.textContent = 'Observação (opcional, até 150 caracteres):';

            const contadorObs = document.createElement('span');
            contadorObs.style.cssText = 'font-size: 11px; color: #64748b;';
            contadorObs.textContent = '0/150';

            topoObs.appendChild(lblObs);
            topoObs.appendChild(contadorObs);

            const inputObs = document.createElement('input');
            inputObs.type = 'text';
            inputObs.maxLength = 150;
            inputObs.placeholder = 'Ex: Painel do Polo Ativo, Tabela de Audiências, etc.';
            inputObs.style.cssText = 'padding: 4px 8px; font-size: 12px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px;';
            inputObs.addEventListener('input', () => {
                contadorObs.textContent = `${inputObs.value.length}/150`;
            });

            secObs.appendChild(topoObs);
            secObs.appendChild(inputObs);
            card.appendChild(secObs);

            const rodape = document.createElement('div');
            rodape.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 8px; border-top: 1px solid #334155; padding-top: 6px; margin-top: 2px; flex-wrap: wrap;';

            const boxPreviewEspecialista = document.createElement('div');
            boxPreviewEspecialista.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-right: auto;';
            lblCorrespondenciasRef = document.createElement('span');
            lblCorrespondenciasRef.style.cssText = 'font-size: 11px; font-weight: 600; color: #38bdf8;';
            const btnTestarDestaque = document.createElement('button');
            btnTestarDestaque.type = 'button';
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
                overlay.style.background = 'rgba(15, 23, 42, 0.8)';
                overlay.style.backdropFilter = 'blur(4px)';
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
                restaurarEstilosAlvos.forEach((fn) => {
                    try { fn(); } catch (_) { }
                });
                restaurarEstilosAlvos = [];
            };

            btnTestarDestaque.addEventListener('click', (evClickBtn) => {
                evClickBtn.stopPropagation();
                restaurarVisibilidadeModal();
                const marcados = caixasOpcoes
                    .filter(c => c.chk.checked && c.item.valor && c.item.valor.trim())
                    .map(c => ({ expressao: normalizarExpr(c.item.valor, c.item.tipoSeletor), tipoSeletor: c.item.tipoSeletor }));
                const res = this.contarCorrespondenciasRegra(marcados, baseEl.ownerDocument);
                const docAlvo = baseEl.ownerDocument || document;
                const alvosFlash = res.nos.slice(0, 25);

                if (alvosFlash.length > 0) {
                    overlay.style.background = 'rgba(15, 23, 42, 0.08)';
                    overlay.style.backdropFilter = 'none';
                    card.style.opacity = '0.12';
                    card.style.pointerEvents = 'none';
                    emModoTesteVisibilidade = true;

                    const alvosDocs = docAlvo && docAlvo !== document ? [document, docAlvo] : [document];
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
                    const prevOutline = no.style.outline;
                    const prevOffset = no.style.outlineOffset;
                    const prevShadow = no.style.boxShadow;
                    no.style.outline = '2px solid #f59e0b';
                    no.style.outlineOffset = '1px';
                    no.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.45)';
                    restaurarEstilosAlvos.push(() => {
                        no.style.outline = prevOutline;
                        no.style.outlineOffset = prevOffset;
                        no.style.boxShadow = prevShadow;
                    });
                });

                if (typeof deps.projetarMiniTip === 'function') {
                    deps.projetarMiniTip(
                        res.total > 0 ? `👁️ ${res.total} elemento(s) destacado(s)` : '⚠️ Nenhum elemento corresponde na página',
                        res.total > 0 ? '#f59e0b' : '#ef4444'
                    );
                } else if (docAlvo) {
                    atualizarVisibilidadeAvisoCurto();
                }
            });
            overlay._restaurarVisibilidadeModal = restaurarVisibilidadeModal;
            boxPreviewEspecialista.appendChild(lblCorrespondenciasRef);
            boxPreviewEspecialista.appendChild(btnTestarDestaque);
            rodape.appendChild(boxPreviewEspecialista);
            atualizarVisibilidadeAvisoCurto();

            const btnCancelar = document.createElement('button');
            btnCancelar.type = 'button';
            btnCancelar.className = 'btn btn-secundario';
            btnCancelar.style.cssText = 'padding: 6px 14px; font-size: 12px; background: #1e293b; color: #cbd5e1; border: 1px solid #475569; border-radius: 6px; cursor: pointer;';
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.addEventListener('click', () => this.fecharModal());

            const btnSalvar = document.createElement('button');
            btnSalvar.type = 'button';
            btnSalvar.className = 'btn btn-primario';
            btnSalvar.style.cssText = 'padding: 6px 16px; font-size: 12px; font-weight: 600; background: #0284c7; color: #ffffff; border: 1px solid #0369a1; border-radius: 6px; cursor: pointer;';
            btnSalvar.textContent = 'Salvar Regra';

            btnSalvar.addEventListener('click', () => {
                const selecionados = caixasOpcoes.filter(c => c.chk.checked && c.item.valor && c.item.valor.trim());
                if (selecionados.length === 0) {
                    if (typeof deps.projetarMiniTip === 'function') {
                        deps.projetarMiniTip('⚠️ Selecione ao menos um tipo de pesquisa com expressão válida.', '#f59e0b');
                    }
                    return;
                }

                if (!selectModo.value) {
                    selectModo.style.borderColor = '#ef4444';
                    try { selectModo.focus(); } catch (_) { }
                    if (typeof deps.projetarMiniTip === 'function') {
                        deps.projetarMiniTip('⚠️ Selecione o Modo Comportamental do Elemento antes de salvar.', '#f59e0b');
                    }
                    return;
                }

                if (typeof deps.validarExpressaoSeletor === 'function') {
                    const invalido = selecionados.find(s => !deps.validarExpressaoSeletor(s.item.valor, s.item.tipoSeletor));
                    if (invalido) {
                        if (typeof deps.projetarMiniTip === 'function') {
                            deps.projetarMiniTip(`⚠️ Expressão inválida em "${invalido.item.tipoSeletor}".`, '#ef4444');
                        }
                        return;
                    }
                }

                const normalizar = normalizarExpr;

                const novasRegras = selecionados.map(s => ({
                    id: 'regra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    tipoSeletor: s.item.tipoSeletor,
                    expressao: normalizar(s.item.valor, s.item.tipoSeletor),
                    tipo: selectModo.value,
                    observacao: (inputObs.value || '').trim().substring(0, 150),
                    herdarFilhos: chkFilhos.checked,
                    ativo: true,
                    continuarProxima: chkContinuar.checked
                }));

                if (typeof deps.aoSalvarRegras === 'function') {
                    deps.aoSalvarRegras(novasRegras);
                }

                if (typeof deps.copiarTexto === 'function') {
                    deps.copiarTexto(selecionados[0].item.valor);
                }

                restaurarVisibilidadeModal();
                this.fecharModal();

                if (typeof deps.projetarMiniTip === 'function') {
                    const msg = novasRegras.length === 1
                        ? `✓ Regra salva: ${novasRegras[0].tipoSeletor} (${selectModo.value})`
                        : `✓ ${novasRegras.length} regras salvas (${selectModo.value})`;
                    deps.projetarMiniTip(msg, '#10b981');
                }
            });

            rodape.appendChild(btnCancelar);
            rodape.appendChild(btnSalvar);
            card.appendChild(rodape);
            overlay.appendChild(card);

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

            const ouvinteEsc = (ev) => {
                if (!overlay.isConnected) {
                    document.removeEventListener('keydown', ouvinteEsc);
                    return;
                }
                if (ev.key === 'Escape') {
                    restaurarVisibilidadeModal();
                    this.fecharModal();
                    document.removeEventListener('keydown', ouvinteEsc);
                }
            };
            document.addEventListener('keydown', ouvinteEsc);

            document.body.appendChild(overlay);
            this.#modalAberto = overlay;
            return overlay;
        }

        executarInspecaoECapturaSeletorUnico(el, deps = {}) {
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

            if (typeof deps.dispararFlashBorderVisual === 'function') {
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
        }
    }

    Object.freeze(DialogoMapeamentoRegra.prototype);
    return Object.freeze(DialogoMapeamentoRegra);
}));
