/* ==========================================================================
 * ARQUIVO: src/mod-automate/automate-seletores.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-automate/automate-seletores.js
 *
 * @MAPA-IA
 * - Arquivo: src/mod-automate/automate-seletores.js
 * - Modulo: mod-automate (Submodulo de Resolucao de Seletores XPath / CSS / PAD-Custom e Iframes)
 * - Contexto: Content Script / ISOLATED World e Runners Headless V8
 * - Dependencias: Opcional JusGovRegrasEInspetor (fallback autonomo se ausente)
 * - Responsabilidade: Resolver objetos de UI declarados em automate-dados.json (ou registrados
 *   dinamicamente pelo futuro Pseudo-Editor), atravessar cadeias de iframes do PJe (ngFrame -> frame-tarefa),
 *   interpolar variaveis dinamicas (${v_TimeLineX}, ${v_ContadorProcSequencialX}, etc.) e executar
 *   primitivas de leitura/interacao DOM (localizar, clicar, preencher texto, extrair atributos).
 * - Isolamento: 100% independente; pode ser removido sem quebrar nenhum outro modulo.
 * ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.JusGovAutomateSeletores = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Motor desacoplado de resolucao de objetos de UI (XPath, CSS, seletores hibridos Power Automate
     * com :eq(N) e predicados de texto/atributos, alem de travessia automatica de iframes).
     */
    class JusGovAutomateSeletores {
        /**
         * @param {Object} [opcoes]
         * @param {Object} [opcoes.repositorioObjetos] Mapa declarativo de controles (vindo de automate-dados.json).
         * @param {Function} [opcoes.resolvedorVariavel] Callback (nomeVariavel) => valor para interpolacao ${var}.
         * @param {Document} [opcoes.documentoRaiz] Documento DOM base (padrao: window.document).
         */
        constructor(opcoes = {}) {
            this.repositorioObjetos = (opcoes && opcoes.repositorioObjetos && typeof opcoes.repositorioObjetos === 'object')
                ? JSON.parse(JSON.stringify(opcoes.repositorioObjetos))
                : {};
            this.resolvedorVariavel = (opcoes && typeof opcoes.resolvedorVariavel === 'function')
                ? opcoes.resolvedorVariavel
                : null;
            this.documentoRaiz = (opcoes && opcoes.documentoRaiz)
                ? opcoes.documentoRaiz
                : (typeof document !== 'undefined' ? document : null);
        }

        /**
         * Atualiza ou mescla o repositorio de objetos declarativos em tempo de execucao (util para o Pseudo-Editor).
         * @param {Object} novoRepositorio
         * @param {boolean} [substituir=false]
         */
        definirRepositorioObjetos(novoRepositorio, substituir = false) {
            if (!novoRepositorio || typeof novoRepositorio !== 'object') return;
            if (substituir) {
                this.repositorioObjetos = JSON.parse(JSON.stringify(novoRepositorio));
            } else {
                Object.assign(this.repositorioObjetos, JSON.parse(JSON.stringify(novoRepositorio)));
            }
        }

        /**
         * Registra ou sobrescreve um unico objeto de UI no repositorio (API para Pseudo-Editor).
         * @param {string} idObjeto
         * @param {Object} definicaoObjeto
         */
        registrarObjeto(idObjeto, definicaoObjeto) {
            if (!idObjeto || typeof idObjeto !== 'string' || !definicaoObjeto || typeof definicaoObjeto !== 'object') {
                return false;
            }
            this.repositorioObjetos[idObjeto] = JSON.parse(JSON.stringify(definicaoObjeto));
            return true;
        }

        /**
         * Define a funcao responsavel por resolver variaveis em templates `${nomeVar}`.
         * @param {Function} fn
         */
        definirResolvedorVariavel(fn) {
            if (typeof fn === 'function') {
                this.resolvedorVariavel = fn;
            }
        }

        /**
         * Interpola placeholders `${nomeVariavel}` usando o mapa de parametros locais e o resolvedor global.
         * @param {string} textoTemplate
         * @param {Object} [variaveisLocais]
         * @returns {string}
         */
        interpolarTemplate(textoTemplate, variaveisLocais = {}) {
            if (typeof textoTemplate !== 'string' || textoTemplate.indexOf('${') === -1) {
                return textoTemplate || '';
            }
            return textoTemplate.replace(/\$\{([^}]+)\}/g, (match, nomeVarBruto) => {
                const nomeVar = String(nomeVarBruto || '').trim();
                if (!nomeVar) return '';
                if (variaveisLocais && Object.prototype.hasOwnProperty.call(variaveisLocais, nomeVar)) {
                    const valLocal = variaveisLocais[nomeVar];
                    return valLocal !== undefined && valLocal !== null ? String(valLocal) : '';
                }
                if (typeof this.resolvedorVariavel === 'function') {
                    const valGlobal = this.resolvedorVariavel(nomeVar);
                    if (valGlobal !== undefined && valGlobal !== null) {
                        return String(valGlobal);
                    }
                }
                return '';
            });
        }

        /**
         * Atravessa a cadeia de iframes declarada no objeto (ex.: ["iframe#ngFrame", "iframe#frame-tarefa"]).
         * @param {Array<string>} [listaFrames]
         * @param {Document|Element} [raizInicial]
         * @param {Object} [variaveisLocais]
         * @returns {Document|Element|null}
         */
        resolverContextoFrames(listaFrames = [], raizInicial = null, variaveisLocais = {}) {
            let contextoAtual = raizInicial || this.documentoRaiz || (typeof document !== 'undefined' ? document : null);
            if (!contextoAtual) return null;
            if (!Array.isArray(listaFrames) || listaFrames.length === 0) {
                return contextoAtual;
            }

            for (let i = 0; i < listaFrames.length; i++) {
                const seletorFrameBruto = listaFrames[i];
                if (!seletorFrameBruto || typeof seletorFrameBruto !== 'string') continue;
                const seletorFrame = this.interpolarTemplate(seletorFrameBruto, variaveisLocais);
                let elementoIframe = null;
                try {
                    elementoIframe = contextoAtual.querySelector(seletorFrame);
                    if (!elementoIframe && /^iframe[#.]/i.test(seletorFrame)) {
                        elementoIframe = contextoAtual.querySelector(seletorFrame.replace(/^iframe/i, ''));
                    }
                } catch (e) {
                    elementoIframe = null;
                }
                if (!elementoIframe) {
                    return null;
                }
                try {
                    const docInterno = elementoIframe.contentDocument ||
                        (elementoIframe.contentWindow && elementoIframe.contentWindow.document);
                    if (docInterno) {
                        contextoAtual = docInterno;
                    } else {
                        // Suporte para mocks de DOM onde <iframe id="ngFrame"> contem filhos diretos em testes headless
                        contextoAtual = elementoIframe;
                    }
                } catch (eCrossOrigin) {
                    return null;
                }
            }
            return contextoAtual;
        }

        /**
         * Extrai texto proprio do elemento (Own Text, sem concatenar filhos profundos quando solicitado)
         * ou texto completo normalizado.
         * @param {Element} elemento
         * @param {boolean} [apenasTextoProprio=false]
         * @returns {string}
         */
        extrairTextoElemento(elemento, apenasTextoProprio = false) {
            if (!elemento) return '';
            if (apenasTextoProprio && elemento.childNodes && elemento.childNodes.length > 0) {
                let textoDireto = '';
                for (let i = 0; i < elemento.childNodes.length; i++) {
                    const no = elemento.childNodes[i];
                    if (no && no.nodeType === 3) {
                        textoDireto += no.nodeValue || '';
                    }
                }
                const limpoDireto = textoDireto.replace(/\s+/g, ' ').trim();
                if (limpoDireto.length > 0) {
                    return limpoDireto;
                }
            }
            const textoCompleto = (typeof elemento.innerText === 'string' && elemento.innerText.length > 0)
                ? elemento.innerText
                : (elemento.textContent || '');
            return String(textoCompleto).replace(/\s+/g, ' ').trim();
        }

        /**
         * Avalia se um elemento satisfaz os filtros declarativos adicionais (texto regex, contem, atributo, etc.).
         * @param {Element} elemento
         * @param {Object} descritorSeletor
         * @param {Object} [variaveisLocais]
         * @returns {boolean}
         */
        avaliarFiltrosAdicionais(elemento, descritorSeletor, variaveisLocais = {}) {
            if (!elemento || !descritorSeletor) return false;
            const textoElemento = this.extrairTextoElemento(elemento, false);

            if (descritorSeletor.filtroTextoNaoVazio) {
                if (!textoElemento || textoElemento.length === 0) return false;
            }

            if (descritorSeletor.filtroTextoExato !== undefined && descritorSeletor.filtroTextoExato !== null) {
                const esperado = this.interpolarTemplate(String(descritorSeletor.filtroTextoExato), variaveisLocais).trim();
                if (textoElemento !== esperado) return false;
            }

            if (descritorSeletor.filtroTextoContem !== undefined && descritorSeletor.filtroTextoContem !== null) {
                const trecho = this.interpolarTemplate(String(descritorSeletor.filtroTextoContem), variaveisLocais).trim();
                if (trecho && !textoElemento.toLowerCase().includes(trecho.toLowerCase())) {
                    return false;
                }
            }

            if (descritorSeletor.filtroTextoRegex !== undefined && descritorSeletor.filtroTextoRegex !== null) {
                const padraoRegex = this.interpolarTemplate(String(descritorSeletor.filtroTextoRegex), variaveisLocais);
                if (padraoRegex) {
                    try {
                        const rx = new RegExp(padraoRegex, descritorSeletor.flagsRegex || 'i');
                        if (!rx.test(textoElemento)) return false;
                    } catch (eRegex) {
                        if (!textoElemento.includes(padraoRegex)) return false;
                    }
                }
            }

            if (descritorSeletor.filtroAtributo && typeof descritorSeletor.filtroAtributo === 'object') {
                const cfgAttr = descritorSeletor.filtroAtributo;
                const nomeAttr = cfgAttr.nome || 'title';
                const valorAttr = String(elemento.getAttribute(nomeAttr) || '');

                if (cfgAttr.contem !== undefined) {
                    const trechoAttr = this.interpolarTemplate(String(cfgAttr.contem), variaveisLocais);
                    if (trechoAttr && !valorAttr.toLowerCase().includes(trechoAttr.toLowerCase())) {
                        return false;
                    }
                }
                if (cfgAttr.regex !== undefined) {
                    const padraoAttr = this.interpolarTemplate(String(cfgAttr.regex), variaveisLocais);
                    if (padraoAttr) {
                        try {
                            const rxAttr = new RegExp(padraoAttr, cfgAttr.flags || 'i');
                            if (!rxAttr.test(valorAttr)) return false;
                        } catch (e) {
                            if (!valorAttr.includes(padraoAttr)) return false;
                        }
                    }
                }
            }

            return true;
        }

        /**
         * Executa um seletor XPath puro retornando todos os elementos correspondentes.
         * @param {string} expressaoXpath
         * @param {Document|Element} contextoDOM
         * @returns {Array<Element>}
         */
        executarSeletorXpath(expressaoXpath, contextoDOM) {
            const resultados = [];
            if (!expressaoXpath || !contextoDOM) return resultados;
            const docAvaliador = contextoDOM.nodeType === 9 ? contextoDOM : (contextoDOM.ownerDocument || this.documentoRaiz);
            if (!docAvaliador || typeof docAvaliador.evaluate !== 'function') {
                return resultados;
            }
            try {
                const tipoResultado = (typeof XPathResult !== 'undefined')
                    ? XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
                    : 7;
                const snapshot = docAvaliador.evaluate(
                    expressaoXpath,
                    contextoDOM,
                    null,
                    tipoResultado,
                    null
                );
                if (snapshot && typeof snapshot.snapshotLength === 'number') {
                    for (let i = 0; i < snapshot.snapshotLength; i++) {
                        const item = snapshot.snapshotItem(i);
                        if (item && item.nodeType === 1) {
                            resultados.push(item);
                        }
                    }
                }
            } catch (eXpath) {
                // XPath invalido ou nao suportado no ambiente
            }
            return resultados;
        }

        /**
         * Executa um seletor no formato hibrido do Power Automate Desktop (`pad_custom`),
         * suportando pseudo-seletores `:eq(N)`, `[Text="..."]`, `[Text*="..."]`, `[Text@="regex"]`,
         * `[Title@="regex"]` e encadeamento hierarquico.
         * @param {string} expressaoPad
         * @param {Document|Element} contextoDOM
         * @returns {Array<Element>}
         */
        executarSeletorPadCustom(expressaoPad, contextoDOM) {
            if (!expressaoPad || !contextoDOM) return [];

            // Extrai predicados especiais do PAD antes de consultar via querySelectorAll por etapas
            // Divide por '>' ou espacos fora de colchetes/aspas para processar :eq(N) e predicados customizados
            const tokens = this._tokenizarSeletorPad(expressaoPad);
            let nosAtuais = [contextoDOM];

            for (let t = 0; t < tokens.length; t++) {
                const token = tokens[t];
                if (!token) continue;
                if (token.combinador === '>') {
                    nosAtuais = this._filtrarDescendentesPad(nosAtuais, token.expressao, true);
                } else {
                    nosAtuais = this._filtrarDescendentesPad(nosAtuais, token.expressao, false);
                }
                if (nosAtuais.length === 0) break;
            }

            return nosAtuais.filter(el => el && el.nodeType === 1);
        }

        /**
         * Tokeniza uma expressao PAD-Custom preservando colchetes `[]` e parenteses `()`.
         * @private
         */
        _tokenizarSeletorPad(expressaoPad) {
            const tokens = [];
            let buffer = '';
            let nivelColchetes = 0;
            let nivelParenteses = 0;
            let aspasAtiva = null;
            let combinadorPendente = ' ';

            const empurrarBuffer = () => {
                const limpo = buffer.trim();
                if (limpo) {
                    tokens.push({ combinador: combinadorPendente, expressao: limpo });
                    combinadorPendente = ' ';
                }
                buffer = '';
            };

            for (let i = 0; i < expressaoPad.length; i++) {
                const ch = expressaoPad[i];
                if (aspasAtiva) {
                    buffer += ch;
                    if (ch === aspasAtiva && expressaoPad[i - 1] !== '\\') {
                        aspasAtiva = null;
                    }
                    continue;
                }
                if (ch === '"' || ch === "'") {
                    aspasAtiva = ch;
                    buffer += ch;
                    continue;
                }
                if (ch === '[') { nivelColchetes++; buffer += ch; continue; }
                if (ch === ']') { nivelColchetes = Math.max(0, nivelColchetes - 1); buffer += ch; continue; }
                if (ch === '(') { nivelParenteses++; buffer += ch; continue; }
                if (ch === ')') { nivelParenteses = Math.max(0, nivelParenteses - 1); buffer += ch; continue; }

                if (nivelColchetes === 0 && nivelParenteses === 0) {
                    if (ch === '>') {
                        empurrarBuffer();
                        combinadorPendente = '>';
                        continue;
                    }
                    if (/\s/.test(ch)) {
                        empurrarBuffer();
                        continue;
                    }
                }
                buffer += ch;
            }
            empurrarBuffer();
            return tokens;
        }

        /**
         * Resolve um segmento individual de seletor PAD-Custom sobre os nos pais atuais.
         * @private
         */
        _filtrarDescendentesPad(nosPais, segmentoBruto, apenasFilhosDiretos) {
            let segmento = segmentoBruto;
            let indiceEq = null;
            const predicadosCustom = [];

            // 1. Extrai :eq(N)
            segmento = segmento.replace(/:eq\(\s*(\d+)\s*\)/gi, (_, numStr) => {
                indiceEq = parseInt(numStr, 10);
                return '';
            });

            // 2. Extrai predicados especiais [Text...], [Title@=...], ou converte [Id=...] / [Class=...]
            segmento = segmento.replace(/\[\s*([A-Za-z0-9_-]+)\s*([*@~^$]?=)\s*(['"]?)([\s\S]*?)\3\s*\]/g, (match, prop, op, quote, val) => {
                const propLower = prop.toLowerCase();
                if (propLower === 'text' || op === '@=') {
                    predicadosCustom.push({ prop: propLower, op, val });
                    return '';
                }
                // Normaliza atributos capitalizados do PAD (ex: [Id='x'] -> [id='x'], [Class*='y'] -> [class*='y'])
                return `[${propLower}${op}"${val.replace(/"/g, '\\"')}"]`;
            });

            const seletorCssBase = segmento.trim() || '*';
            const candidatos = [];

            for (let i = 0; i < nosPais.length; i++) {
                const pai = nosPais[i];
                if (!pai || typeof pai.querySelectorAll !== 'function') continue;
                let encontrados = [];
                try {
                    encontrados = Array.from(pai.querySelectorAll(seletorCssBase));
                } catch (eCss) {
                    encontrados = [];
                }
                if (apenasFilhosDiretos) {
                    encontrados = encontrados.filter(el => el.parentNode === pai);
                }
                for (let j = 0; j < encontrados.length; j++) {
                    const el = encontrados[j];
                    if (this._avaliarPredicadosPad(el, predicadosCustom)) {
                        if (!candidatos.includes(el)) {
                            candidatos.push(el);
                        }
                    }
                }
            }

            if (indiceEq !== null && !Number.isNaN(indiceEq)) {
                return (indiceEq >= 0 && indiceEq < candidatos.length) ? [candidatos[indiceEq]] : [];
            }
            return candidatos;
        }

        /**
         * Avalia predicados customizados do Power Automate Desktop (`[Text="..."]`, `[Text@="regex"]`, `[Title@="regex"]`).
         * @private
         */
        _avaliarPredicadosPad(elemento, predicados) {
            if (!predicados || predicados.length === 0) return true;
            for (let i = 0; i < predicados.length; i++) {
                const p = predicados[i];
                const fonteValor = (p.prop === 'text')
                    ? this.extrairTextoElemento(elemento, false)
                    : String(elemento.getAttribute(p.prop) || '');

                if (p.op === '=') {
                    if (fonteValor.trim() !== p.val.trim()) return false;
                } else if (p.op === '*=') {
                    if (!fonteValor.toLowerCase().includes(p.val.toLowerCase())) return false;
                } else if (p.op === '^=') {
                    if (!fonteValor.toLowerCase().startsWith(p.val.toLowerCase())) return false;
                } else if (p.op === '$=') {
                    if (!fonteValor.toLowerCase().endsWith(p.val.toLowerCase())) return false;
                } else if (p.op === '@=') {
                    try {
                        const rx = new RegExp(p.val, 'i');
                        if (!rx.test(fonteValor)) return false;
                    } catch (e) {
                        if (!fonteValor.includes(p.val)) return false;
                    }
                }
            }
            return true;
        }

        /**
         * Resolve uma lista de candidatos para um unico descritor de seletor (`css`, `xpath` ou `pad_custom`).
         * @param {Object} descritorSeletor
         * @param {Document|Element} contextoDOM
         * @param {Object} [variaveisLocais]
         * @returns {Array<Element>}
         */
        resolverDescritorUnico(descritorSeletor, contextoDOM, variaveisLocais = {}) {
            if (!descritorSeletor || !contextoDOM) return [];
            const tipo = String(descritorSeletor.tipo || 'css').toLowerCase();
            const expressaoInterpolada = this.interpolarTemplate(String(descritorSeletor.expressao || ''), variaveisLocais);
            if (!expressaoInterpolada) return [];

            let elementosBase = [];
            if (tipo === 'xpath') {
                elementosBase = this.executarSeletorXpath(expressaoInterpolada, contextoDOM);
            } else if (tipo === 'pad_custom') {
                elementosBase = this.executarSeletorPadCustom(expressaoInterpolada, contextoDOM);
            } else {
                // Se a expressao CSS contiver pseudo-seletor :eq(N) ou predicado PAD, delega ao parser PAD
                if (/:eq\(\d+\)|\[[A-Za-z]+@=|\[Text/i.test(expressaoInterpolada)) {
                    elementosBase = this.executarSeletorPadCustom(expressaoInterpolada, contextoDOM);
                } else {
                    try {
                        elementosBase = Array.from(contextoDOM.querySelectorAll(expressaoInterpolada));
                    } catch (eCss) {
                        elementosBase = [];
                    }
                }
            }

            // Aplica indice explicito se declarado no JSON (ex: `"indice": "${v_ContadorProcSequencialX}"`)
            if (descritorSeletor.indice !== undefined && descritorSeletor.indice !== null && descritorSeletor.indice !== '') {
                const strIndice = this.interpolarTemplate(String(descritorSeletor.indice), variaveisLocais);
                const idx = parseInt(strIndice, 10);
                if (!Number.isNaN(idx)) {
                    elementosBase = (idx >= 0 && idx < elementosBase.length) ? [elementosBase[idx]] : [];
                }
            }

            // Filtra por regex/texto/atributos declarados no descritor
            let filtrados = elementosBase.filter(el => this.avaliarFiltrosAdicionais(el, descritorSeletor, variaveisLocais));

            // Se houver subSeletorFilho (ex.: clicar no `button` ou `i` dentro do elemento encontrado)
            if (descritorSeletor.subSeletorFilho && filtrados.length > 0) {
                const subSeletor = this.interpolarTemplate(String(descritorSeletor.subSeletorFilho), variaveisLocais);
                const subElementos = [];
                for (let i = 0; i < filtrados.length; i++) {
                    try {
                        const sub = filtrados[i].querySelector(subSeletor);
                        if (sub) subElementos.push(sub);
                    } catch (e) {
                        // ignora erro de subseletor
                    }
                }
                filtrados = subElementos;
            }

            return filtrados;
        }

        /**
         * Localiza todos os elementos correspondentes a um `idObjeto` do repositorio (ou objeto de definicao inline).
         * Tenta os seletores da lista em ordem de prioridade ate encontrar ao menos 1 elemento.
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {Array<Element>}
         */
        localizarTodosElementos(idOuDefinicaoObjeto, variaveisLocais = {}, raizCustomizada = null) {
            const definicao = (typeof idOuDefinicaoObjeto === 'string')
                ? this.repositorioObjetos[idOuDefinicaoObjeto]
                : idOuDefinicaoObjeto;

            if (!definicao || typeof definicao !== 'object') {
                return [];
            }

            const contextoDOM = this.resolverContextoFrames(
                definicao.frames || [],
                raizCustomizada || this.documentoRaiz,
                variaveisLocais
            );
            if (!contextoDOM) return [];

            const listaSeletores = Array.isArray(definicao.seletores) ? definicao.seletores : [];
            for (let i = 0; i < listaSeletores.length; i++) {
                const candidatos = this.resolverDescritorUnico(listaSeletores[i], contextoDOM, variaveisLocais);
                if (candidatos.length > 0) {
                    return candidatos;
                }
            }
            return [];
        }

        /**
         * Localiza o primeiro elemento correspondente ao `idObjeto` (ou definicao inline).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {Element|null}
         */
        localizarElemento(idOuDefinicaoObjeto, variaveisLocais = {}, raizCustomizada = null) {
            const todos = this.localizarTodosElementos(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada);
            return todos.length > 0 ? todos[0] : null;
        }

        /**
         * Verifica se o elemento existe no DOM (`IfWebPageContains` / `WaitForWebPageContent`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {boolean}
         */
        contemElemento(idOuDefinicaoObjeto, variaveisLocais = {}, raizCustomizada = null) {
            return this.localizarElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada) !== null;
        }

        /**
         * Extrai detalhe do elemento (`GetDetailsOfElement` do PAD: `Own Text`, `Text`, `Value`, `Title`, `Href`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {string} [nomeAtributo='Own Text']
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {string|null}
         */
        obterDetalheElemento(idOuDefinicaoObjeto, nomeAtributo = 'Own Text', variaveisLocais = {}, raizCustomizada = null) {
            const elemento = this.localizarElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada);
            if (!elemento) return null;

            const attrNorm = String(nomeAtributo || 'Own Text').trim().toLowerCase();
            if (attrNorm === 'own text' || attrNorm === 'owntext') {
                return this.extrairTextoElemento(elemento, true);
            }
            if (attrNorm === 'text' || attrNorm === 'innertext' || attrNorm === 'textcontent') {
                return this.extrairTextoElemento(elemento, false);
            }
            if (attrNorm === 'value') {
                return elemento.value !== undefined ? String(elemento.value) : String(elemento.getAttribute('value') || '');
            }
            if (attrNorm === 'checked') {
                return String(Boolean(elemento.checked));
            }
            const valorAttr = elemento.getAttribute(nomeAtributo);
            return valorAttr !== null && valorAttr !== undefined ? String(valorAttr) : '';
        }

        /**
         * Executa clique físico/sintetico sobre um elemento localizado (`PressButton` / `ClickElementInWebPage`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {boolean}
         */
        clicarElemento(idOuDefinicaoObjeto, variaveisLocais = {}, raizCustomizada = null) {
            const elemento = this.localizarElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada);
            if (!elemento) return false;

            try {
                if (typeof elemento.focus === 'function') {
                    elemento.focus({ preventScroll: true });
                }
            } catch (e) {
                // ignora falha de focus
            }

            try {
                if (typeof elemento.click === 'function') {
                    elemento.click();
                    return true;
                }
            } catch (eClick) {
                // fallback para MouseEvent
            }

            try {
                const doc = elemento.ownerDocument || this.documentoRaiz;
                if (doc && typeof doc.createEvent === 'function') {
                    const evt = doc.createEvent('MouseEvents');
                    evt.initEvent('click', true, true);
                    elemento.dispatchEvent(evt);
                    return true;
                }
            } catch (eEvt) {
                // ignora
            }
            return false;
        }

        /**
         * Preenche um campo de texto compatível com Angular/RichFaces/JSF do PJe (`PopulateTextField`).
         * @param {string|Object} idOuDefinicaoObjeto
         * @param {string} texto
         * @param {Object} [variaveisLocais]
         * @param {Document|Element} [raizCustomizada]
         * @returns {boolean}
         */
        preencherCampoTexto(idOuDefinicaoObjeto, texto, variaveisLocais = {}, raizCustomizada = null) {
            const elemento = this.localizarElemento(idOuDefinicaoObjeto, variaveisLocais, raizCustomizada);
            if (!elemento) return false;

            const valorFinal = this.interpolarTemplate(String(texto !== undefined && texto !== null ? texto : ''), variaveisLocais);
            try {
                if (typeof elemento.focus === 'function') {
                    elemento.focus({ preventScroll: true });
                }
                const win = (elemento.ownerDocument && elemento.ownerDocument.defaultView) || (typeof window !== 'undefined' ? window : null);
                const prototipoInput = win && win.HTMLInputElement ? win.HTMLInputElement.prototype : null;
                const descritorValue = prototipoInput ? Object.getOwnPropertyDescriptor(prototipoInput, 'value') : null;
                if (descritorValue && typeof descritorValue.set === 'function') {
                    descritorValue.set.call(elemento, valorFinal);
                } else {
                    elemento.value = valorFinal;
                }
                elemento.setAttribute('value', valorFinal);

                const disparar = (tipoEvento) => {
                    if (typeof Event === 'function') {
                        elemento.dispatchEvent(new Event(tipoEvento, { bubbles: true, cancelable: true }));
                    }
                };
                disparar('input');
                disparar('change');
                disparar('keyup');
                disparar('blur');
                return true;
            } catch (ePopulate) {
                try {
                    elemento.value = valorFinal;
                    return true;
                } catch (e2) {
                    return false;
                }
            }
        }
    }

    return JusGovAutomateSeletores;
}));
