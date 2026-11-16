/* ==========================================================================
 * Nome do arquivo: options-mapeamento.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Configurações & Interface — Mapeamento Manual Avançado (XPath / CSS)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/options-mapeamento.js
 * - Classe Exportada: OptionsMapeamento (window.JusGovOptionsMapeamento)
 * - Métodos Públicos: inicializar(deps), renderizarLista(regras, somenteLeitura),
 *   obterRegrasAtuais(), adicionarRegrasESalvar(novasRegras), salvarRegras(),
 *   normalizarExpressaoAtributo(expr, tipo), validarExpressaoSeletor(expr, tipo),
 *   normalizarTipoSeletorRotulo(regra), marcarAlteracoesPendentes(pendente)
 * - Elementos DOM: containerListaRegrasMapeamento, btnAdicionarRegraMapeamento,
 *   btnSalvarRegrasMapeamento, btnExportarMapeamentoJson, btnImportarMapeamentoJson,
 *   inputImportarMapeamentoArquivo, tabRegrasUsuario, tabRegrasInternas
 * - Regras / Seções: Seção 6.20, Seção 6.85 (padrão automático "Continuar"),
 *   Seção 6.121 (Abas Definições do Usuário / Internas via interface.json),
 *   Diretriz 16 (SRP + Injeção Opcional + Null Object), FEAT-35 (Escopo Global)
 *
 * DIRETIVAS DE RECONSTRUÇÃO CLEAN-ROOM:
 * 1) ESCOPO GLOBAL ENTRE PERFIS: Regras XPath/CSS residem diretamente na chave
 *    global 'regrasMapeamentoElementos' em chrome.storage.sync (nunca por perfil).
 * 2) REORDENAÇÃO E EDIÇÃO AO VIVO: Permite drag-and-drop, validação instantânea
 *    de CSS via createDocumentFragment().querySelector() e XPath via document.evaluate(),
 *    além de auto-toggle de 'continuarProxima' quando tipo muda para 'textual'.
 * 3) SOMENTE LEITURA NA ABA INTERNAS: Carrega src/cfg/interface.json via fetch
 *    e renderiza as regras internas desabilitando edição/exclusão.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovOptionsMapeamento = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PADROES_FABRICA_REGRAS_MAPEAMENTO = Object.freeze([]);
    const TIPOS_SELETOR_SUPORTADOS = Object.freeze([
        'CSS (Simples)',
        'CSS (Hierárquico)',
        'CSS (Estrutural)',
        'XPath (Simplificado)',
        'XPath (Completo)'
    ]);

    class OptionsMapeamento {
        #regras = [];
        #inicializado = false;
        #deps = {
            adicionarOuvinteSeguro: (el, ev, fn) => { if (el) el.addEventListener(ev, fn); },
            exibirToast: () => { }
        };

        #btnAdicionar = null;
        #btnSalvar = null;
        #btnExportarJson = null;
        #btnImportarJson = null;
        #inputImportarArquivo = null;
        #containerLista = null;
        #tabUsuario = null;
        #tabInternas = null;

        inicializar(deps = {}) {
            if (deps && typeof deps.adicionarOuvinteSeguro === 'function') {
                this.#deps.adicionarOuvinteSeguro = deps.adicionarOuvinteSeguro;
            }
            if (deps && typeof deps.exibirToast === 'function') {
                this.#deps.exibirToast = deps.exibirToast;
            }

            this.#btnAdicionar = document.getElementById('btnAdicionarRegraMapeamento');
            this.#btnSalvar = document.getElementById('btnSalvarRegrasMapeamento');
            this.#btnExportarJson = document.getElementById('btnExportarMapeamentoJson');
            this.#btnImportarJson = document.getElementById('btnImportarMapeamentoJson');
            this.#inputImportarArquivo = document.getElementById('inputImportarMapeamentoArquivo');
            this.#containerLista = document.getElementById('containerListaRegrasMapeamento');
            this.#tabUsuario = document.getElementById('tabRegrasUsuario');
            this.#tabInternas = document.getElementById('tabRegrasInternas');

            if (this.#inicializado) return;
            this.#inicializado = true;
            this.#registrarEventos();
        }

        obterRegrasAtuais() {
            return Array.isArray(this.#regras) ? this.#regras : [...PADROES_FABRICA_REGRAS_MAPEAMENTO];
        }

        adicionarRegrasESalvar(regrasNovas) {
            if (!Array.isArray(regrasNovas) || regrasNovas.length === 0) return false;
            let adicionou = false;
            regrasNovas.forEach((rn) => {
                if (rn && rn.expressao && String(rn.expressao).trim()) {
                    this.#regras.push(rn);
                    adicionou = true;
                }
            });
            if (!adicionou) return false;
            this.renderizarLista(this.#regras);
            this.salvarRegras();
            return true;
        }

        normalizarExpressaoAtributo(expressao, tipoSeletor = '') {
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
            if (typeof expressao !== 'string' || !expressao.trim()) return true;
            const expr = this.normalizarExpressaoAtributo(expressao, tipoSeletor);
            try {
                const ehXPath = (typeof tipoSeletor === 'string' && tipoSeletor.toLowerCase().includes('xpath')) || expr.startsWith('/') || expr.startsWith('(');
                if (ehXPath) {
                    document.evaluate(expr, document, null, XPathResult.ANY_TYPE, null);
                    return true;
                }
                document.createDocumentFragment().querySelector(expr);
                return true;
            } catch (_) {
                return false;
            }
        }

        normalizarTipoSeletorRotulo(regra) {
            const mapaLegado = {
                'Seletor CSS': 'CSS (Hierárquico)',
                'Seletor CSS-2': 'CSS (Estrutural)',
                'XPath Simplificado': 'XPath (Simplificado)',
                'XPath Completo': 'XPath (Completo)'
            };
            if (regra && regra.tipoSeletor && typeof regra.tipoSeletor === 'string') {
                return mapaLegado[regra.tipoSeletor] || regra.tipoSeletor;
            }
            const expr = (regra && regra.expressao) ? String(regra.expressao).trim() : '';
            if (expr.startsWith('//') || expr.startsWith('(')) return 'XPath (Simplificado)';
            if (expr.startsWith('/')) return 'XPath (Completo)';
            if (expr.includes(':nth-child(')) return 'CSS (Estrutural)';
            if (expr.includes('>') || expr.includes(':nth-of-type(')) return 'CSS (Hierárquico)';
            return 'CSS (Simples)';
        }

        marcarAlteracoesPendentes(pendente) {
            if (!this.#btnSalvar) return;
            const icone = document.createElement('span');
            icone.textContent = '💾';
            this.#btnSalvar.replaceChildren(icone, document.createTextNode(pendente ? ' Salvar *' : ' Salvar'));
            this.#btnSalvar.style.borderColor = pendente ? '#f59e0b' : '';
        }

        renderizarLista(regras, somenteLeitura = false) {
            if (!this.#containerLista) return;
            const listaRenderizar = Array.isArray(regras) ? [...regras] : [...PADROES_FABRICA_REGRAS_MAPEAMENTO];
            if (!somenteLeitura) {
                this.#regras = listaRenderizar;
            }
            this.#containerLista.replaceChildren();

            if (listaRenderizar.length === 0) {
                const vazio = document.createElement('div');
                vazio.style.cssText = 'color: #94a3b8; font-size: 12px; font-style: italic; padding: 10px 0; line-height: 1.5;';
                vazio.textContent = somenteLeitura
                    ? 'Nenhuma regra interna encontrada.'
                    : 'Nenhuma regra customizada cadastrada. Utilize Ctrl + Alt + Shift + Clique sobre qualquer elemento em páginas web para abrir o assistente e cadastrar novas regras.';
                this.#containerLista.appendChild(vazio);
                return;
            }

            let idxArrastando = null;
            listaRenderizar.forEach((regra, idx) => {
                const item = this.#criarItemRegraDOM(regra, idx, somenteLeitura, {
                    obterIdxArrastando: () => idxArrastando,
                    definirIdxArrastando: (v) => { idxArrastando = v; }
                });
                this.#containerLista.appendChild(item);
            });
        }

        #criarItemRegraDOM(regra, idx, somenteLeitura, estadoDrag) {
            const item = document.createElement('div');
            item.className = 'item-regra-mapeamento';
            item.style.cssText = 'display: flex; gap: 8px; align-items: center; background: #1e293b; padding: 8px 10px; border-radius: 6px; border: 1px solid #334155; flex-wrap: wrap;';

            if (!somenteLeitura) {
                item.draggable = true;
                item.addEventListener('dragstart', (ev) => {
                    estadoDrag.definirIdxArrastando(idx);
                    item.style.opacity = '0.5';
                    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
                });
                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                    estadoDrag.definirIdxArrastando(null);
                });
                item.addEventListener('dragover', (ev) => {
                    ev.preventDefault();
                    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
                });
                item.addEventListener('drop', (ev) => {
                    ev.preventDefault();
                    const idxOrig = estadoDrag.obterIdxArrastando();
                    if (idxOrig === null || idxOrig === idx) return;
                    const [movida] = this.#regras.splice(idxOrig, 1);
                    this.#regras.splice(idx, 0, movida);
                    this.renderizarLista(this.#regras);
                    this.marcarAlteracoesPendentes(true);
                });

                const alca = document.createElement('span');
                alca.textContent = '⋮⋮';
                alca.title = 'Arrastar para reordenar prioridade';
                alca.style.cssText = 'cursor: grab; color: #64748b; font-size: 14px; font-weight: 700; user-select: none; padding: 0 2px;';
                item.appendChild(alca);
            }

            const selectTipoSeletor = document.createElement('select');
            selectTipoSeletor.className = 'select-customizado';
            selectTipoSeletor.style.cssText = 'font-size: 10px; font-weight: 700; color: #38bdf8; background: #0f172a; border: 1px solid #0284c7; padding: 3px 6px; border-radius: 4px; cursor: pointer;';
            const tipoAtualRotulo = this.normalizarTipoSeletorRotulo(regra);
            TIPOS_SELETOR_SUPORTADOS.forEach((nomeTipo) => {
                const opt = document.createElement('option');
                opt.value = nomeTipo;
                opt.textContent = nomeTipo;
                if (tipoAtualRotulo === nomeTipo) opt.selected = true;
                selectTipoSeletor.appendChild(opt);
            });
            selectTipoSeletor.addEventListener('change', () => {
                this.#regras[idx].tipoSeletor = selectTipoSeletor.value;
                this.marcarAlteracoesPendentes(true);
            });

            const inputExpr = document.createElement('input');
            inputExpr.type = 'text';
            inputExpr.className = 'campo-input-escuro';
            inputExpr.style.cssText = 'flex: 2 1 200px; min-width: 160px; font-family: monospace; font-size: 11px; padding: 4px 8px; background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 4px;';
            inputExpr.value = regra.expressao || '';
            inputExpr.placeholder = 'Expressão (XPath ou CSS)';
            inputExpr.addEventListener('input', () => {
                this.#regras[idx].expressao = inputExpr.value.trim();
                this.marcarAlteracoesPendentes(true);
            });
            inputExpr.addEventListener('change', () => {
                const tipoSel = selectTipoSeletor ? selectTipoSeletor.value : '';
                const valor = this.normalizarExpressaoAtributo(inputExpr.value, tipoSel);
                if (!this.validarExpressaoSeletor(valor, tipoSel)) {
                    inputExpr.style.borderColor = '#ef4444';
                    this.#deps.exibirToast(`⚠️ Expressão inválida para ${tipoSel || 'regra'}. Corrija antes de salvar.`);
                    return;
                }
                inputExpr.value = valor;
                inputExpr.style.borderColor = '#475569';
                this.#regras[idx].expressao = valor;
                this.marcarAlteracoesPendentes(true);
            });

            const selectTipo = document.createElement('select');
            selectTipo.className = 'select-customizado';
            selectTipo.style.cssText = 'padding: 4px 8px; font-size: 11px; background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 4px; cursor: pointer; flex: 0 0 auto; width: auto;';
            [
                { val: 'interface', label: 'Interface', title: 'Desseleção / Alt' },
                { val: 'semiflexivel', label: 'SemiFlexível', title: 'Máscaras Forenses' },
                { val: 'textual', label: 'Textual', title: 'Leitura / Manter' },
                { val: 'editavel', label: 'Editável', title: 'Inputs, Textarea, Datas e Placeholders' }
            ].forEach((opCfg) => {
                const opt = document.createElement('option');
                opt.value = opCfg.val;
                opt.textContent = opCfg.label;
                opt.title = opCfg.title;
                if (regra.tipo === opCfg.val) opt.selected = true;
                selectTipo.appendChild(opt);
            });

            const inputObs = document.createElement('input');
            inputObs.type = 'text';
            inputObs.maxLength = 150;
            inputObs.className = 'campo-input-escuro';
            inputObs.style.cssText = 'flex: 1 1 140px; min-width: 120px; font-size: 11px; padding: 4px 8px; background: #0f172a; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px;';
            inputObs.value = regra.observacao || '';
            inputObs.placeholder = 'Observação (até 150 carac.)';
            inputObs.title = regra.observacao || 'Observação identificadora da regra';
            inputObs.addEventListener('input', () => {
                this.#regras[idx].observacao = inputObs.value.trim().substring(0, 150);
                this.marcarAlteracoesPendentes(true);
            });

            const { label: labelHerdar, chk: chkHerdar } = this.#criarCheckboxRegra(
                'Filhos',
                regra.herdarFilhos !== false,
                (checked) => { this.#regras[idx].herdarFilhos = checked; }
            );
            const { label: labelAtivo, chk: chkAtivo } = this.#criarCheckboxRegra(
                'Ativo',
                regra.ativo !== false,
                (checked) => { this.#regras[idx].ativo = checked; }
            );
            const { label: labelContinuar, chk: chkContinuar } = this.#criarCheckboxRegra(
                'Continuar',
                regra.continuarProxima === true,
                (checked) => { this.#regras[idx].continuarProxima = checked; },
                'Permitir processar próxima regra após esta'
            );

            selectTipo.addEventListener('change', () => {
                this.#regras[idx].tipo = selectTipo.value;
                const continuarPadrao = (selectTipo.value === 'textual');
                this.#regras[idx].continuarProxima = continuarPadrao;
                chkContinuar.checked = continuarPadrao;
                this.marcarAlteracoesPendentes(true);
            });

            const btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'btn btn-secundario';
            btnExcluir.style.cssText = 'padding: 2px 6px; font-size: 12px; line-height: 1; border-color: #ef4444; color: #ef4444; cursor: pointer;';
            btnExcluir.title = 'Excluir regra';
            btnExcluir.textContent = '🗑️';
            btnExcluir.addEventListener('click', () => {
                this.#regras.splice(idx, 1);
                this.renderizarLista(this.#regras);
                this.marcarAlteracoesPendentes(true);
            });

            if (somenteLeitura) {
                selectTipoSeletor.disabled = true;
                inputExpr.readOnly = true;
                selectTipo.disabled = true;
                inputObs.readOnly = true;
                chkHerdar.disabled = true;
                chkAtivo.disabled = true;
                chkContinuar.disabled = true;
            }

            item.append(selectTipoSeletor, inputExpr, selectTipo, inputObs, labelHerdar, labelAtivo, labelContinuar);
            if (!somenteLeitura) {
                item.appendChild(btnExcluir);
            }
            return item;
        }

        #criarCheckboxRegra(rotulo, marcado, aoAlterar, titulo = '') {
            const label = document.createElement('label');
            label.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #cbd5e1; cursor: pointer; user-select: none; margin: 0;';
            if (titulo) label.title = titulo;
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = Boolean(marcado);
            chk.addEventListener('change', () => {
                aoAlterar(chk.checked);
                this.marcarAlteracoesPendentes(true);
            });
            label.appendChild(chk);
            label.appendChild(document.createTextNode(rotulo));
            return { label, chk };
        }

        salvarRegras() {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.set({ regrasMapeamentoElementos: this.#regras }, () => {
                    if (typeof chrome.runtime !== 'undefined' && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({
                            acao: 'regrasMapeamentoAtualizadas',
                            regrasMapeamentoElementos: this.#regras
                        }).catch(() => { });
                    }
                });
            }
        }

        #registrarEventos() {
            const on = this.#deps.adicionarOuvinteSeguro;

            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((msg) => {
                    if (msg && msg.acao === 'regrasMapeamentoAtualizadas' && Array.isArray(msg.regrasMapeamentoElementos)) {
                        this.renderizarLista(msg.regrasMapeamentoElementos);
                    }
                });
            }

            if (this.#tabUsuario && this.#tabInternas) {
                on(this.#tabUsuario, 'click', () => {
                    this.#tabUsuario.style.borderColor = '#38bdf8';
                    this.#tabUsuario.style.color = '#38bdf8';
                    this.#tabUsuario.style.opacity = '1';
                    this.#tabInternas.style.borderColor = '';
                    this.#tabInternas.style.color = '';
                    this.#tabInternas.style.opacity = '0.7';
                    if (this.#btnAdicionar) this.#btnAdicionar.style.display = 'inline-flex';
                    if (this.#btnSalvar) this.#btnSalvar.style.display = 'inline-flex';
                    if (this.#btnExportarJson) this.#btnExportarJson.style.display = 'inline-flex';
                    if (this.#btnImportarJson) this.#btnImportarJson.style.display = 'inline-flex';
                    this.renderizarLista(this.#regras);
                });

                on(this.#tabInternas, 'click', async () => {
                    this.#tabInternas.style.borderColor = '#38bdf8';
                    this.#tabInternas.style.color = '#38bdf8';
                    this.#tabInternas.style.opacity = '1';
                    this.#tabUsuario.style.borderColor = '';
                    this.#tabUsuario.style.color = '';
                    this.#tabUsuario.style.opacity = '0.7';
                    if (this.#btnAdicionar) this.#btnAdicionar.style.display = 'none';
                    if (this.#btnSalvar) this.#btnSalvar.style.display = 'none';
                    if (this.#btnExportarJson) this.#btnExportarJson.style.display = 'none';
                    if (this.#btnImportarJson) this.#btnImportarJson.style.display = 'none';
                    try {
                        const url = chrome.runtime.getURL('src/cfg/interface.json');
                        const resp = await fetch(url);
                        const txt = await resp.text();
                        const internas = (window.JusGovCfgDefaults && typeof window.JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                            ? window.JusGovCfgDefaults.parsearJsonComComentarios(txt)
                            : JSON.parse(String(txt || '').replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim());
                        const apenasInternas = Array.isArray(internas) ? internas.filter(r => r && r.origem !== 'usuario') : [];
                        this.renderizarLista(apenasInternas, true);
                    } catch (_) {
                        if (this.#containerLista) {
                            const msgErroJson = document.createElement('div');
                            msgErroJson.style.cssText = 'color: #94a3b8; font-size: 12px;';
                            msgErroJson.textContent = 'Não foi possível carregar interface.json.';
                            this.#containerLista.replaceChildren(msgErroJson);
                        }
                    }
                });
            }

            if (this.#btnAdicionar) {
                on(this.#btnAdicionar, 'click', () => {
                    this.#regras.push({
                        id: 'regra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                        tipoSeletor: 'CSS (Simples)',
                        expressao: '',
                        tipo: 'interface',
                        observacao: '',
                        herdarFilhos: true,
                        ativo: true,
                        continuarProxima: false
                    });
                    this.renderizarLista(this.#regras);
                    this.marcarAlteracoesPendentes(true);
                });
            }

            if (this.#btnSalvar) {
                on(this.#btnSalvar, 'click', () => {
                    const invalida = this.#regras.find(r => r && r.expressao && !this.validarExpressaoSeletor(r.expressao, r.tipoSeletor));
                    if (invalida) {
                        this.#deps.exibirToast(`⚠️ Há regra com expressão inválida (${invalida.tipoSeletor || 'Seletor'}). Corrija antes de salvar.`);
                        return;
                    }
                    this.salvarRegras();
                    this.marcarAlteracoesPendentes(false);
                    this.#deps.exibirToast('Regras de mapeamento salvas!');
                });
            }

            if (this.#btnExportarJson) {
                on(this.#btnExportarJson, 'click', () => {
                    const blob = new Blob([JSON.stringify(this.#regras, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'jusgovbr-regras-mapeamento.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.#deps.exibirToast('Regras de mapeamento exportadas em JSON!');
                });
            }

            if (this.#btnImportarJson && this.#inputImportarArquivo) {
                on(this.#btnImportarJson, 'click', () => {
                    this.#inputImportarArquivo.click();
                });

                on(this.#inputImportarArquivo, 'change', (e) => {
                    const arquivo = e.target.files && e.target.files[0];
                    if (!arquivo) return;

                    const leitor = new FileReader();
                    leitor.onload = (ev) => {
                        try {
                            const txtImp = String(ev.target.result || '');
                            const json = (window.JusGovCfgDefaults && typeof window.JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                                ? window.JusGovCfgDefaults.parsearJsonComComentarios(txtImp)
                                : JSON.parse(txtImp);
                            if (Array.isArray(json)) {
                                this.#regras = json;
                                this.renderizarLista(this.#regras);
                                this.salvarRegras();
                                this.#deps.exibirToast('Regras de mapeamento importadas com sucesso!');
                            } else {
                                this.#deps.exibirToast('Erro: Arquivo JSON deve conter uma lista de regras.');
                            }
                        } catch (_) {
                            this.#deps.exibirToast('Erro: Arquivo JSON de mapeamento inválido.');
                        }
                    };
                    leitor.readAsText(arquivo);
                    this.#inputImportarArquivo.value = '';
                });
            }
        }
    }

    return Object.freeze(OptionsMapeamento);
}));
