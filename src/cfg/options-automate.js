/**
 * ============================================================================
 * ARQUIVO: src/cfg/options-automate.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 * ============================================================================
 * @MAPA-IA:
 * - Classe Exportada: JusGovOptionsAutomate (window.JusGovOptionsAutomate)
 * - Canal: 4. Beta (Isolado — fora de mod-debug ate promocao estavel)
 * - Responsabilidade: Antigravity Automation IDE — interface condensada em
 *   arvore hierarquica progressiva (Contextos -> Categorias/Subtelas -> Editor
 *   Linha-a-Linha de Comandos/Eventos/Subfluxos e Objetos UI CSS/XPath), com
 *   navegacao Entrar/Voltar, reordenacao/insercao/exclusao/edicao de linhas e
 *   execucao direta a partir do Banco de Dados JSON.
 * ============================================================================
 */
(function () {
    'use strict';

    const CHAVE_CONTEXTOS_USUARIO = 'jusgovAutomateContextosUsuario';
    const CHAVE_COMANDOS_USUARIO = 'jusgovAutomateComandosUsuario';
    const CHAVE_COMANDOS_OVERRIDES = 'jusgovAutomateComandosOverrides';
    const CHAVE_OBJETOS_USUARIO = 'jusgovAutomateObjetosUsuario';

    const CATALOGO_ACOES = [
        { acao: 'SET_STATUS', cor: '#34d399', tag: 'STATUS', rotulo: 'Exibir Status / Substatus na Barra' },
        { acao: 'CLICK', cor: '#60a5fa', tag: 'CLICK', rotulo: 'Clicar / Ativar Objeto da Página' },
        { acao: 'CLICK_IF_UNCHECKED', cor: '#60a5fa', tag: 'CHECK', rotulo: 'Marcar Checkbox se Desmarcado' },
        { acao: 'POPULATE_TEXT', cor: '#facc15', tag: 'INPUT', rotulo: 'Preencher Campo de Texto' },
        { acao: 'GET_ELEMENT_DETAIL', cor: '#38bdf8', tag: 'READ', rotulo: 'Ler Texto / Atributo de Objeto' },
        { acao: 'WAIT_ELEMENT', cor: '#94a3b8', tag: 'WAIT+', rotulo: 'Aguardar Objeto Aparecer' },
        { acao: 'WAIT_NOT_ELEMENT', cor: '#94a3b8', tag: 'WAIT-', rotulo: 'Aguardar Objeto Sumir (Ampulheta)' },
        { acao: 'WAIT_MS', cor: '#94a3b8', tag: 'DELAY', rotulo: 'Aguardar Tempo (ms)' },
        { acao: 'IF_CONDITION', cor: '#c084fc', tag: 'IF', rotulo: 'Condição Se / Senão (Bloco)' },
        { acao: 'LOOP_WHILE', cor: '#fb923c', tag: 'WHILE', rotulo: 'Loop Enquanto com Limite (Bloco)' },
        { acao: 'LOOP_FOREACH', cor: '#fb923c', tag: 'FOREACH', rotulo: 'Loop Para Cada Item (Bloco)' },
        { acao: 'TAB_CHECK_MATCH', cor: '#2dd4bf', tag: 'TAB?', rotulo: 'Confirmar Objeto DOM em Outra Guia' },
        { acao: 'TAB_ACTION_MATCH', cor: '#2dd4bf', tag: 'TAB!', rotulo: 'Agir / Preencher / Fechar Guia por DOM' },
        { acao: 'SET_VAR', cor: '#a3e635', tag: 'STATE', rotulo: 'Definir Propriedade de Estado POO' },
        { acao: 'REGEX_PARSE', cor: '#f472b6', tag: 'REGEX', rotulo: 'Extrair Grupo via Expressão Regular' },
        { acao: 'REGEX_REPLACE', cor: '#f472b6', tag: 'REPL', rotulo: 'Substituir Texto via Regex' },
        { acao: 'CALL_SUBFLOW', cor: '#818cf8', tag: 'CALL', rotulo: 'Chamar Comando / Subfluxo do Contexto' },
        { acao: 'DISPATCH_ACTION', cor: '#818cf8', tag: 'IPC', rotulo: 'Enviar Comando ao Background SW' }
    ];

    const MAPA_ACOES = {};
    CATALOGO_ACOES.forEach((a) => { MAPA_ACOES[a.acao] = a; });

    const GATILHOS = [
        { valor: 'ao_selecionar_processo', rotulo: 'Evento: Ao selecionar novo processo' },
        { valor: 'ao_carregar_frame_tarefa', rotulo: 'Evento: Ao carregar frame da tarefa' },
        { valor: 'ao_abrir_pagina', rotulo: 'Evento: Ao abrir página da rota' },
        { valor: 'ciclo_continuo', rotulo: 'Evento: Ciclo contínuo' },
        { valor: 'manual', rotulo: 'Subfluxo / Chamada Manual' }
    ];

    const OPERADORES = [
        'igual', 'diferente', 'contem', 'maior', 'menor',
        'truthy', 'falsy', 'existeElemento', 'naoExisteElemento',
        'paginaContemTexto', 'paginaNaoContemTexto'
    ];

    function dom(tag, estilos, texto) {
        const e = document.createElement(tag);
        if (estilos) Object.assign(e.style, estilos);
        if (texto !== undefined && texto !== null) e.textContent = String(texto);
        return e;
    }

    function clonar(v) {
        return JSON.parse(JSON.stringify(v));
    }

    class JusGovOptionsAutomate {
        constructor(containerId) {
            this.containerId = containerId || 'containerAutomateComandosObjetos';
            this.container = null;
            this.dadosBase = {};

            this.contextosInternos = [];
            this.contextosUsuario = [];
            this.comandosUsuario = [];
            this.comandosOverrides = {};
            this.objetosUsuario = {};

            // Estado de navegacao em arvore hierarquica (Nivel 0 = null => lista de contextos)
            this.contextoAbertoId = null;
            this.visaoAtual = { tipo: 'raiz_contexto', filtroSubtela: 'TODAS', itemId: null };
            this.pilhaHistorico = [];
            this.nosExpandidos = {
                subtelas: false,
                eventos: true,
                comandos: false,
                objetos: false,
                estado: false,
                regras: false
            };

            this.buscaLista = '';
            this.rascunhoComando = null;
            this.caminhoLinhaEditando = null;
            this.modoJsonPuro = false;
            this.rascunhoObjeto = null;
            this.historicoUndoSeletor = [];
            this.rascunhoNovoContexto = null;

            this.avisoTexto = '';
            this.avisoTipo = 'ok';
        }

        async inicializar() {
            this.container = document.getElementById(this.containerId);
            if (!this.container) return;
            await this.carregarDados();
            this.renderizar();
        }

        async carregarDados() {
            let carregado = null;
            const tentativas = [];
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
                tentativas.push(chrome.runtime.getURL('src/mod-automate/automate-dados.json'));
            }
            tentativas.push('../mod-automate/automate-dados.json');

            for (let i = 0; i < tentativas.length; i++) {
                try {
                    const r = await fetch(tentativas[i]);
                    if (r && r.ok) {
                        carregado = await r.json();
                        if (carregado && typeof carregado === 'object') break;
                    }
                } catch (_) { }
            }

            if (!carregado && typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                try {
                    const rIpc = await new Promise((res) => {
                        chrome.runtime.sendMessage({ acao: 'OBTER_JSON_ESTATICO', arquivo: 'automate-dados.json' }, (x) => res(chrome.runtime.lastError ? null : x));
                    });
                    if (rIpc && rIpc.dados) carregado = rIpc.dados;
                } catch (_) { }
            }

            this.dadosBase = carregado || {};
            this.contextosInternos = Array.isArray(this.dadosBase.contextos) && this.dadosBase.contextos.length > 0
                ? clonar(this.dadosBase.contextos)
                : [];

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const st = await new Promise((res) => {
                    chrome.storage.local.get([
                        CHAVE_CONTEXTOS_USUARIO,
                        CHAVE_COMANDOS_USUARIO,
                        CHAVE_COMANDOS_OVERRIDES,
                        CHAVE_OBJETOS_USUARIO
                    ], (r) => res(r || {}));
                });
                this.contextosUsuario = Array.isArray(st[CHAVE_CONTEXTOS_USUARIO]) ? st[CHAVE_CONTEXTOS_USUARIO] : [];
                this.comandosUsuario = Array.isArray(st[CHAVE_COMANDOS_USUARIO]) ? st[CHAVE_COMANDOS_USUARIO] : [];
                this.comandosOverrides = (st[CHAVE_COMANDOS_OVERRIDES] && typeof st[CHAVE_COMANDOS_OVERRIDES] === 'object') ? st[CHAVE_COMANDOS_OVERRIDES] : {};
                this.objetosUsuario = (st[CHAVE_OBJETOS_USUARIO] && typeof st[CHAVE_OBJETOS_USUARIO] === 'object') ? st[CHAVE_OBJETOS_USUARIO] : {};
            }
        }

        obterDadosParaBackupGlobal() {
            return {
                contextosUsuario: clonar(this.contextosUsuario),
                comandosUsuario: clonar(this.comandosUsuario),
                comandosOverrides: clonar(this.comandosOverrides),
                objetosUsuario: clonar(this.objetosUsuario)
            };
        }

        async persistirTudo(msg) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await new Promise((res) => {
                    chrome.storage.local.set({
                        [CHAVE_CONTEXTOS_USUARIO]: this.contextosUsuario,
                        [CHAVE_COMANDOS_USUARIO]: this.comandosUsuario,
                        [CHAVE_COMANDOS_OVERRIDES]: this.comandosOverrides,
                        [CHAVE_OBJETOS_USUARIO]: this.objetosUsuario
                    }, res);
                });
            }
            if (msg) {
                this.avisoTexto = msg;
                this.avisoTipo = 'ok';
            }
            this.renderizar();
        }

        // =====================================================================
        // NAVEGACAO HIERARQUICA (ENTRAR / SAIR / VOLTAR)
        // =====================================================================
        entrarNoContexto(ctxId) {
            this.pilhaHistorico = [];
            this.contextoAbertoId = ctxId;
            this.visaoAtual = { tipo: 'raiz_contexto', filtroSubtela: 'TODAS', itemId: null };
            this.rascunhoComando = null;
            this.rascunhoObjeto = null;
            this.buscaLista = '';
            this.renderizar();
        }

        sairParaListaContextos() {
            this.contextoAbertoId = null;
            this.pilhaHistorico = [];
            this.rascunhoComando = null;
            this.rascunhoObjeto = null;
            this.renderizar();
        }

        navegarPara(novaVisao) {
            this.pilhaHistorico.push(clonar(this.visaoAtual));
            this.visaoAtual = Object.assign({ filtroSubtela: 'TODAS', itemId: null }, novaVisao);
            this.rascunhoComando = null;
            this.rascunhoObjeto = null;
            this.caminhoLinhaEditando = null;
            this.modoJsonPuro = false;
            this.renderizar();
        }

        voltarUmNivel() {
            this.rascunhoComando = null;
            this.rascunhoObjeto = null;
            this.caminhoLinhaEditando = null;
            if (this.pilhaHistorico.length > 0) {
                this.visaoAtual = this.pilhaHistorico.pop();
                this.renderizar();
            } else {
                this.sairParaListaContextos();
            }
        }

        // =====================================================================
        // RESOLUCAO DE DADOS DO CONTEXTO
        // =====================================================================
        listarContextos() {
            const out = this.contextosInternos.map((c) => Object.assign({}, clonar(c), { _origem: 'interno' }));
            this.contextosUsuario.forEach((cu) => {
                if (!cu || !cu.id) return;
                const i = out.findIndex((x) => x.id === cu.id);
                if (i >= 0) out[i] = Object.assign({}, out[i], clonar(cu), { _origem: 'interno', _editado: true });
                else out.push(Object.assign({}, clonar(cu), { _origem: 'usuario' }));
            });
            return out;
        }

        obterContexto(id) {
            return this.listarContextos().find((c) => c.id === id) || null;
        }

        obterObjetosContexto(ctx) {
            if (!ctx) return {};
            const base = (ctx.repositorioObjetos && typeof ctx.repositorioObjetos === 'object') ? clonar(ctx.repositorioObjetos) : {};
            const out = {};
            Object.keys(base).forEach((id) => {
                const ov = this.objetosUsuario[id];
                out[id] = Object.assign({}, base[id], ov ? clonar(ov) : {}, {
                    _id: id,
                    _origem: 'interno',
                    _editado: Boolean(ov)
                });
            });
            Object.keys(this.objetosUsuario).forEach((id) => {
                const u = this.objetosUsuario[id];
                if (!out[id] && (!u.contextoId || u.contextoId === ctx.id)) {
                    out[id] = Object.assign({}, clonar(u), { _id: id, _origem: 'usuario', _editado: false });
                }
            });
            return out;
        }

        obterComandosContexto(ctx) {
            if (!ctx) return [];
            const base = Array.isArray(ctx.comandosInternos) ? clonar(ctx.comandosInternos) : [];
            const lista = base.map((c) => {
                const ov = this.comandosOverrides[c.id];
                return Object.assign({}, c, ov ? clonar(ov) : {}, {
                    id: c.id,
                    _origem: 'interno',
                    _editado: Boolean(ov)
                });
            });
            this.comandosUsuario.forEach((cu, idxUsr) => {
                if (!cu) return;
                if ((cu.contextoId || 'pje_trf1_1g') === ctx.id) {
                    lista.push(Object.assign({}, clonar(cu), {
                        _origem: 'usuario',
                        _idxUsuario: idxUsr,
                        _editado: false
                    }));
                }
            });
            return lista;
        }

        normalizarSeletores(obj) {
            if (!obj || typeof obj !== 'object') return [];
            if (Array.isArray(obj.seletores) && obj.seletores.length > 0) {
                return obj.seletores.filter((s) => s && s.expressao !== undefined).map((s) => ({
                    tipo: String(s.tipo || 'css').toUpperCase(),
                    expressao: String(s.expressao || '')
                }));
            }
            if (obj.seletor) return [{ tipo: String(obj.tipo || 'CSS').toUpperCase(), expressao: String(obj.seletor) }];
            return [];
        }

        validarSeletor(expr, tipo) {
            const s = String(expr || '').trim();
            if (!s) return { ok: false, msg: 'Vazio' };
            if (s.includes('${')) return { ok: true, dinamico: true };
            try {
                if (String(tipo || '').toUpperCase().includes('XPATH') || s.startsWith('/') || s.startsWith('(')) {
                    document.evaluate(s, document, null, XPathResult.ANY_TYPE, null);
                    return { ok: true };
                }
                document.createDocumentFragment().querySelector(s);
                return { ok: true };
            } catch (e) {
                return { ok: false, msg: e.message };
            }
        }

        coletarObjsPassos(passos, conj) {
            if (!Array.isArray(passos)) return;
            passos.forEach((p) => {
                if (!p || typeof p !== 'object') return;
                if (p.objeto) conj.add(p.objeto);
                if (p.objetoVerificar) conj.add(p.objetoVerificar);
                if (p.objetoAcao) conj.add(p.objetoAcao);
                if (p.condicao && p.condicao.objeto) conj.add(p.condicao.objeto);
                if (Array.isArray(p.passos)) this.coletarObjsPassos(p.passos, conj);
                if (Array.isArray(p.entao)) this.coletarObjsPassos(p.entao, conj);
                if (Array.isArray(p.senao)) this.coletarObjsPassos(p.senao, conj);
            });
        }

        mapearReferenciasObjetos(ctx) {
            const mapa = {};
            this.obterComandosContexto(ctx).forEach((cmd) => {
                const s = new Set(Array.isArray(cmd.objetosUsados) ? cmd.objetosUsados : []);
                this.coletarObjsPassos(cmd.passos, s);
                s.forEach((idObj) => {
                    if (!mapa[idObj]) mapa[idObj] = [];
                    mapa[idObj].push({ id: cmd.id, nome: cmd.nome || cmd.id });
                });
            });
            return mapa;
        }

        contarPassosTotais(passos) {
            if (!Array.isArray(passos)) return 0;
            let total = 0;
            passos.forEach((p) => {
                if (!p) return;
                total += 1;
                total += this.contarPassosTotais(p.passos);
                total += this.contarPassosTotais(p.entao);
                total += this.contarPassosTotais(p.senao);
            });
            return total;
        }

        // Manipulacao cirurgica de nos na arvore de `passos` por caminho ex.: [2, 'entao', 0]
        obterListaPaiEIndice(raizPassos, caminho) {
            let listaAtual = raizPassos;
            for (let i = 0; i < caminho.length - 1; i += 2) {
                const idx = caminho[i];
                const chaveFilho = caminho[i + 1];
                const item = listaAtual[idx];
                if (!item[chaveFilho]) item[chaveFilho] = [];
                listaAtual = item[chaveFilho];
            }
            return { lista: listaAtual, idx: caminho[caminho.length - 1] };
        }

        exportarJson() {
            const pacote = {
                esquema: 'jusgovbr-automate-ide-v3',
                exportadoEm: new Date().toISOString(),
                contextosInternosReferencia: this.contextosInternos,
                contextosUsuario: this.contextosUsuario,
                comandosUsuario: this.comandosUsuario,
                comandosOverrides: this.comandosOverrides,
                objetosUsuario: this.objetosUsuario
            };
            const blob = new Blob([JSON.stringify(pacote, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jusgovbr-automate-ide-bd.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.avisoTexto = 'Banco JSON exportado.';
            this.avisoTipo = 'ok';
            this.renderizar();
        }

        importarJson() {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.json,application/json';
            inp.addEventListener('change', async () => {
                const f = inp.files && inp.files[0];
                if (!f) return;
                try {
                    const j = JSON.parse(await f.text());
                    if (Array.isArray(j.contextosUsuario)) this.contextosUsuario = j.contextosUsuario;
                    if (Array.isArray(j.comandosUsuario)) this.comandosUsuario = j.comandosUsuario;
                    if (j.comandosOverrides && typeof j.comandosOverrides === 'object') this.comandosOverrides = j.comandosOverrides;
                    if (j.objetosUsuario && typeof j.objetosUsuario === 'object') this.objetosUsuario = j.objetosUsuario;
                    await this.persistirTudo('Banco JSON importado com sucesso.');
                } catch (e) {
                    this.avisoTexto = 'Falha ao importar JSON: ' + e.message;
                    this.avisoTipo = 'erro';
                    this.renderizar();
                }
            });
            inp.click();
        }

        // =====================================================================
        // RENDERIZADOR RAIZ (ESTILO ANTIGRAVITY IDE CONDENSADO)
        // =====================================================================
        renderizar() {
            if (!this.container) return;
            while (this.container.firstChild) this.container.removeChild(this.container.firstChild);

            const shell = dom('div', {
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '12px',
                lineHeight: '1.35'
            });

            // Notificacao compacta de topo se existir
            if (this.avisoTexto) {
                const erro = this.avisoTipo === 'erro';
                const fita = dom('div', {
                    padding: '4px 10px',
                    background: erro ? '#7f1d1d' : '#064e3b',
                    color: erro ? '#fecaca' : '#a7f3d0',
                    borderBottom: '1px solid #334155',
                    fontSize: '11.5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                });
                fita.appendChild(dom('span', null, (erro ? '⚠ ' : '✓ ') + this.avisoTexto));
                const bx = dom('button', { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '700' }, '×');
                bx.type = 'button';
                bx.addEventListener('click', () => { this.avisoTexto = ''; this.renderizar(); });
                fita.appendChild(bx);
                shell.appendChild(fita);
            }

            if (!this.contextoAbertoId) {
                // NIVEL 0: SELECIONAR OU CRIAR CONTEXTO (Tela Inicial Limpa!)
                shell.appendChild(this._renderizarSeletorContextosRaiz());
            } else {
                const ctx = this.obterContexto(this.contextoAbertoId);
                if (!ctx) {
                    this.contextoAbertoId = null;
                    shell.appendChild(this._renderizarSeletorContextosRaiz());
                } else {
                    // NIVEL 1 & 2: IDE SPLIT-VIEW (Barra Breadcrumb + Arvore Esquerda + Workspace Direita)
                    shell.appendChild(this._renderizarBarraTopoIde(ctx));
                    const corpo = dom('div', {
                        display: 'grid',
                        gridTemplateColumns: '245px minmax(0, 1fr)',
                        minHeight: '460px'
                    });
                    corpo.appendChild(this._renderizarArvoreLateral(ctx));
                    corpo.appendChild(this._renderizarWorkspaceDireito(ctx));
                    shell.appendChild(corpo);
                }
            }

            this.container.appendChild(shell);
        }

        // =====================================================================
        // NIVEL 0: EXPLORADOR DE CONTEXTOS (ENTRADA DA ABA BETA)
        // =====================================================================
        _renderizarSeletorContextosRaiz() {
            const wrap = dom('div', { padding: '10px 12px' });

            const barra = dom('div', {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '8px',
                marginBottom: '8px',
                borderBottom: '1px solid #1e293b'
            });

            const esq = dom('div', { display: 'flex', alignItems: 'center', gap: '8px' });
            esq.appendChild(dom('span', { fontWeight: '700', fontSize: '12.5px', color: '#f8fafc' }, '🗂️ EXPLORADOR DE CONTEXTOS DE AUTOMAÇÃO'));
            esq.appendChild(this._pill('Selecione um contexto para abrir seus Objetos, Eventos e Comandos', '#1e293b', '#94a3b8'));

            const dir = dom('div', { display: 'flex', gap: '5px' });
            dir.appendChild(this._btnIde('+ Novo Contexto', '#2563eb', '#ffffff', () => {
                this.rascunhoNovoContexto = { id: 'ctx_' + Date.now().toString(36).slice(-4), nome: '', descricao: '', urlsBase: 'https://' };
                this.renderizar();
            }));
            dir.appendChild(this._btnIde('⬇ Exportar JSON', '#1e293b', '#cbd5e1', () => this.exportarJson()));
            dir.appendChild(this._btnIde('⬆ Importar JSON', '#1e293b', '#cbd5e1', () => this.importarJson()));

            barra.appendChild(esq);
            barra.appendChild(dir);
            wrap.appendChild(barra);

            if (this.rascunhoNovoContexto) {
                wrap.appendChild(this._renderizarFormNovoContexto());
            }

            const lista = dom('div', { display: 'flex', flexDirection: 'column', gap: '4px' });
            this.listarContextos().forEach((ctx) => {
                const cmds = this.obterComandosContexto(ctx);
                const objs = this.obterObjetosContexto(ctx);
                const eventos = cmds.filter((c) => c.gatilho && c.gatilho !== 'manual');
                const subfluxos = cmds.filter((c) => !c.gatilho || c.gatilho === 'manual');
                const subtelas = Array.isArray(ctx.subtelas) ? ctx.subtelas : [];

                const linha = dom('div', {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '7px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    cursor: 'pointer'
                });
                linha.addEventListener('mouseenter', () => { linha.style.borderColor = '#3b82f6'; });
                linha.addEventListener('mouseleave', () => { linha.style.borderColor = '#334155'; });
                linha.addEventListener('click', () => this.entrarNoContexto(ctx.id));

                const infoEsq = dom('div', { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '0' });
                const l1 = dom('div', { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' });
                l1.appendChild(dom('span', { color: '#60a5fa', fontWeight: '700', fontFamily: 'Consolas, monospace' }, '▸ 📁 ' + ctx.id));
                l1.appendChild(dom('strong', { color: '#f8fafc', fontSize: '12.5px' }, ctx.nome || ctx.id));
                l1.appendChild(this._pill(ctx._origem === 'interno' ? 'INTERNO' : 'USUÁRIO', '#0f172a', '#38bdf8'));
                infoEsq.appendChild(l1);

                const l2 = dom('div', { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', color: '#94a3b8', fontFamily: 'Consolas, monospace' });
                l2.appendChild(dom('span', { color: '#34d399' }, (ctx.urlsBase || []).join('  |  ')));
                l2.appendChild(dom('span', null, '• ' + subtelas.length + ' subtelas · ' + eventos.length + ' eventos · ' + subfluxos.length + ' subfluxos · ' + Object.keys(objs).length + ' objetos'));
                infoEsq.appendChild(l2);

                const btnEntrar = this._btnIde('Abrir Contexto ➔', '#2563eb', '#ffffff', (ev) => {
                    ev.stopPropagation();
                    this.entrarNoContexto(ctx.id);
                });

                linha.appendChild(infoEsq);
                linha.appendChild(btnEntrar);
                lista.appendChild(linha);
            });

            wrap.appendChild(lista);
            return wrap;
        }

        _renderizarFormNovoContexto() {
            const r = this.rascunhoNovoContexto;
            const box = dom('div', { padding: '8px 10px', marginBottom: '8px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '6px' });
            box.appendChild(dom('div', { fontWeight: '700', color: '#93c5fd', marginBottom: '6px' }, 'Novo Contexto Fechado de Site'));
            const g = dom('div', { display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr auto', gap: '6px', alignItems: 'end' });
            const iId = this._inputIde('ID (ex: sei_trf1)', r.id);
            const iNome = this._inputIde('Nome do Sistema', r.nome);
            const iUrls = this._inputIde('URLs Base separadas por vírgula (ex: https://sei.trf1.jus.br/)', r.urlsBase);
            const botoes = dom('div', { display: 'flex', gap: '4px' });
            botoes.appendChild(this._btnIde('Criar', '#059669', '#ffffff', async () => {
                const id = iId.input.value.trim().replace(/\s+/g, '_');
                const nome = iNome.input.value.trim();
                const urls = iUrls.input.value.split(',').map((u) => u.trim()).filter(Boolean);
                if (!id || !nome || urls.length === 0) {
                    this.avisoTexto = 'Informe ID, Nome e ao menos 1 URL Base.';
                    this.avisoTipo = 'erro';
                    this.renderizar();
                    return;
                }
                this.contextosUsuario.push({
                    id, nome, canal: 'beta', origem: 'usuario', isolamento: 'fechado_poo', habilitado: true,
                    urlsBase: urls,
                    dominiosAutoAtivacao: urls.map((u) => u.replace(/\/$/, '') + '/*'),
                    estadoInicial: { configuracao: {}, sessao: {} },
                    subtelas: [{ id: 'principal', nome: 'Tela Principal', rotas: urls.map((u) => u.replace(/\/$/, '') + '/*') }],
                    comandosInternos: [], repositorioObjetos: {}, tabelaMenuMovimentos: []
                });
                this.rascunhoNovoContexto = null;
                await this.persistirTudo('Contexto "' + nome + '" criado.');
                this.entrarNoContexto(id);
            }));
            botoes.appendChild(this._btnIde('Cancelar', '#334155', '#e2e8f0', () => { this.rascunhoNovoContexto = null; this.renderizar(); }));
            g.appendChild(iId.wrap);
            g.appendChild(iNome.wrap);
            g.appendChild(iUrls.wrap);
            g.appendChild(botoes);
            box.appendChild(g);
            return box;
        }

        // =====================================================================
        // BARRA DE TOPO DA IDE (VOLTAR + BREADCRUMBS + ACOES RAPIDAS)
        // =====================================================================
        _renderizarBarraTopoIde(ctx) {
            const barra = dom('div', {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '6px 10px',
                background: '#020617',
                borderBottom: '1px solid #334155'
            });

            const esq = dom('div', { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' });
            esq.appendChild(this._btnIde('← Voltar', '#334155', '#f8fafc', () => this.voltarUmNivel()));

            // Breadcrumbs clicaveis
            const bcRaiz = dom('span', { color: '#60a5fa', cursor: 'pointer', fontFamily: 'Consolas, monospace' }, 'contextos');
            bcRaiz.addEventListener('click', () => this.sairParaListaContextos());
            esq.appendChild(bcRaiz);
            esq.appendChild(dom('span', { color: '#475569' }, '/'));

            const bcCtx = dom('span', { color: '#38bdf8', cursor: 'pointer', fontWeight: '700', fontFamily: 'Consolas, monospace' }, ctx.id);
            bcCtx.addEventListener('click', () => {
                this.pilhaHistorico = [];
                this.visaoAtual = { tipo: 'raiz_contexto', filtroSubtela: 'TODAS', itemId: null };
                this.rascunhoComando = null;
                this.rascunhoObjeto = null;
                this.renderizar();
            });
            esq.appendChild(bcCtx);

            if (this.visaoAtual.tipo !== 'raiz_contexto') {
                esq.appendChild(dom('span', { color: '#475569' }, '/'));
                const rotuloSecao = {
                    subtelas: 'subtelas',
                    eventos: 'eventos',
                    comandos: 'comandos',
                    objetos: 'objetos',
                    estado: 'estado_poo',
                    regras: 'regras_35',
                    editor_comando: 'comandos',
                    editor_objeto: 'objetos'
                }[this.visaoAtual.tipo] || this.visaoAtual.tipo;

                const bcSec = dom('span', { color: '#cbd5e1', cursor: 'pointer', fontFamily: 'Consolas, monospace' }, rotuloSecao);
                bcSec.addEventListener('click', () => {
                    if (this.visaoAtual.tipo === 'editor_comando') this.navegarPara({ tipo: 'comandos', filtroSubtela: this.visaoAtual.filtroSubtela });
                    else if (this.visaoAtual.tipo === 'editor_objeto') this.navegarPara({ tipo: 'objetos', filtroSubtela: this.visaoAtual.filtroSubtela });
                });
                esq.appendChild(bcSec);

                if (this.visaoAtual.itemId) {
                    esq.appendChild(dom('span', { color: '#475569' }, '/'));
                    esq.appendChild(dom('span', { color: '#fbbf24', fontWeight: '700', fontFamily: 'Consolas, monospace' }, this.visaoAtual.itemId));
                }
            }

            const dir = dom('div', { display: 'flex', gap: '5px', flexWrap: 'wrap' });
            dir.appendChild(this._btnIde('+ Objeto UI', '#0369a1', '#ffffff', () => this._iniciarNovoObjeto(ctx)));
            dir.appendChild(this._btnIde('+ Comando / Evento', '#2563eb', '#ffffff', () => this._iniciarNovoComando(ctx)));
            dir.appendChild(this._btnIde('⬇ JSON', '#1e293b', '#cbd5e1', () => this.exportarJson()));
            dir.appendChild(this._btnIde('⬆ JSON', '#1e293b', '#cbd5e1', () => this.importarJson()));

            barra.appendChild(esq);
            barra.appendChild(dir);
            return barra;
        }

        // =====================================================================
        // PAINEL ESQUERDO: ARVORE HIERARQUICA ESTILO ANTIGRAVITY EXPLORER
        // =====================================================================
        _renderizarArvoreLateral(ctx) {
            const nav = dom('div', {
                background: '#0b1120',
                borderRight: '1px solid #1e293b',
                padding: '6px 4px',
                overflowY: 'auto',
                maxHeight: '640px',
                fontFamily: 'Consolas, "Cascadia Code", monospace',
                fontSize: '11.5px',
                userSelect: 'none'
            });

            const cmds = this.obterComandosContexto(ctx);
            const objs = this.obterObjetosContexto(ctx);
            const eventos = cmds.filter((c) => c.gatilho && c.gatilho !== 'manual');
            const subfluxos = cmds.filter((c) => !c.gatilho || c.gatilho === 'manual');
            const subtelas = Array.isArray(ctx.subtelas) ? ctx.subtelas : [];
            const regras = Array.isArray(ctx.tabelaMenuMovimentos) ? ctx.tabelaMenuMovimentos : [];

            const criarPasta = (chave, icone, titulo, qtd, tipoVisao) => {
                const aberto = Boolean(this.nosExpandidos[chave]);
                const linha = dom('div', {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: this.visaoAtual.tipo === tipoVisao ? '#60a5fa' : '#cbd5e1',
                    background: this.visaoAtual.tipo === tipoVisao ? '#1e293b' : 'transparent',
                    fontWeight: '700'
                });
                linha.appendChild(dom('span', null, (aberto ? '▾ ' : '▸ ') + icone + ' ' + titulo));
                linha.appendChild(dom('span', { fontSize: '10px', color: '#64748b' }, String(qtd)));
                linha.addEventListener('click', () => {
                    this.nosExpandidos[chave] = !aberto;
                    this.navegarPara({ tipo: tipoVisao, filtroSubtela: 'TODAS' });
                });
                return linha;
            };

            const criarFolha = (rotulo, ativo, corIcone, onClick) => {
                const f = dom('div', {
                    padding: '2.5px 6px 2.5px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: ativo ? '#fbbf24' : '#94a3b8',
                    background: ativo ? '#1e293b' : 'transparent'
                });
                const dot = dom('span', { color: corIcone, marginRight: '4px' }, '•');
                f.appendChild(dot);
                f.appendChild(dom('span', null, rotulo));
                f.title = rotulo;
                f.addEventListener('click', onClick);
                return f;
            };

            // 1. Subtelas
            nav.appendChild(criarPasta('subtelas', '🌐', 'Subtelas & Rotas', subtelas.length, 'subtelas'));
            if (this.nosExpandidos.subtelas) {
                subtelas.forEach((st) => {
                    nav.appendChild(criarFolha(st.id, this.visaoAtual.filtroSubtela === st.id && this.visaoAtual.tipo === 'comandos', '#38bdf8', () => {
                        this.navegarPara({ tipo: 'comandos', filtroSubtela: st.id });
                    }));
                });
            }

            // 2. Eventos Ativos
            nav.appendChild(criarPasta('eventos', '⚡', 'Eventos da Página', eventos.length, 'eventos'));
            if (this.nosExpandidos.eventos) {
                eventos.forEach((ev) => {
                    nav.appendChild(criarFolha(ev.id, this.visaoAtual.itemId === ev.id, ev.ativo !== false ? '#34d399' : '#64748b', () => {
                        this.navegarPara({ tipo: 'editor_comando', itemId: ev.id });
                    }));
                });
            }

            // 3. Comandos & Subfluxos (todos os 25 do PAD + usuario)
            nav.appendChild(criarPasta('comandos', '📜', 'Comandos / Fluxos', subfluxos.length, 'comandos'));
            if (this.nosExpandidos.comandos) {
                subfluxos.forEach((c) => {
                    nav.appendChild(criarFolha(c.nomePad || c.id, this.visaoAtual.itemId === c.id, c._editado ? '#fbbf24' : '#818cf8', () => {
                        this.navegarPara({ tipo: 'editor_comando', itemId: c.id });
                    }));
                });
            }

            // 4. Objetos da Pagina
            const idsObjs = Object.keys(objs).sort();
            nav.appendChild(criarPasta('objetos', '🧩', 'Objetos da Página', idsObjs.length, 'objetos'));
            if (this.nosExpandidos.objetos) {
                idsObjs.forEach((idObj) => {
                    nav.appendChild(criarFolha(idObj, this.visaoAtual.itemId === idObj, objs[idObj]._editado ? '#fbbf24' : '#38bdf8', () => {
                        this.navegarPara({ tipo: 'editor_objeto', itemId: idObj });
                    }));
                });
            }

            // 5. Estado POO
            nav.appendChild(criarPasta('estado', '📦', 'Estado POO', 'ctx', 'estado'));

            // 6. Regras 35
            nav.appendChild(criarPasta('regras', '📊', 'Regras Tarefa', regras.length, 'regras'));

            return nav;
        }

        // =====================================================================
        // PAINEL DIREITO: WORKSPACE CONDENSADO CONFORME O NO ABERTO
        // =====================================================================
        _renderizarWorkspaceDireito(ctx) {
            const area = dom('div', { padding: '10px 12px', overflowX: 'auto', maxHeight: '640px', overflowY: 'auto' });
            const t = this.visaoAtual.tipo;

            if (t === 'raiz_contexto') return this._wsRaizContexto(area, ctx);
            if (t === 'subtelas') return this._wsSubtelas(area, ctx);
            if (t === 'eventos') return this._wsListaComandos(area, ctx, true);
            if (t === 'comandos') return this._wsListaComandos(area, ctx, false);
            if (t === 'objetos') return this._wsListaObjetos(area, ctx);
            if (t === 'editor_comando') return this._wsEditorComandoIde(area, ctx);
            if (t === 'editor_objeto') return this._wsEditorObjetoIde(area, ctx);
            if (t === 'estado') return this._wsEstadoPoo(area, ctx);
            if (t === 'regras') return this._wsRegras35(area, ctx);
            return this._wsRaizContexto(area, ctx);
        }

        _wsRaizContexto(area, ctx) {
            const cmds = this.obterComandosContexto(ctx);
            const objs = this.obterObjetosContexto(ctx);
            const eventos = cmds.filter((c) => c.gatilho && c.gatilho !== 'manual');
            const subfluxos = cmds.filter((c) => !c.gatilho || c.gatilho === 'manual');
            const subtelas = Array.isArray(ctx.subtelas) ? ctx.subtelas : [];
            const regras = Array.isArray(ctx.tabelaMenuMovimentos) ? ctx.tabelaMenuMovimentos : [];

            area.appendChild(dom('div', { fontWeight: '700', fontSize: '13px', color: '#f8fafc', marginBottom: '4px' },
                '🏛️ ' + (ctx.nome || ctx.id)));
            area.appendChild(dom('div', { fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' },
                'URLs Base: ' + (ctx.urlsBase || []).join('  |  ') + '   •   Clique em uma categoria abaixo ou na árvore à esquerda para expandir.'));

            const grade = dom('div', { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' });
            const cards = [
                { icone: '⚡', titulo: 'Eventos da Página', qtd: eventos.length + ' ativos', desc: 'Abertura de Autos, confirmação autosNProc, fechar anterior e Tópico-Síntese.', ir: 'eventos' },
                { icone: '📜', titulo: 'Comandos & Subfluxos PAD', qtd: subfluxos.length + ' fluxos', desc: 'Todos os subfluxos importados do PAD (Main, Etiquetas, Trânsito, Movimentar...).', ir: 'comandos' },
                { icone: '🧩', titulo: 'Objetos da Página (DOM)', qtd: Object.keys(objs).length + ' objetos', desc: 'Seletores CSS e XPath limpos separados por subtela, editáveis com Pai/Filho.', ir: 'objetos' },
                { icone: '🌐', titulo: 'Subtelas & Rotas', qtd: subtelas.length + ' subtelas', desc: 'Delimitação estrita de URLs onde cada conjunto de objetos e eventos atua.', ir: 'subtelas' },
                { icone: '📦', titulo: 'Estado Fechado POO', qtd: 'this.estado', desc: 'Propriedades isoladas do contexto (zero variáveis globais entre sites).', ir: 'estado' },
                { icone: '📊', titulo: 'Matriz de Regras', qtd: regras.length + ' regras', desc: 'Tabela declarativa Tarefa × Movimento Padrão × Etiquetas Tp1..Tp3.', ir: 'regras' }
            ];

            cards.forEach((c) => {
                const box = dom('div', {
                    padding: '9px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    cursor: 'pointer'
                });
                box.addEventListener('mouseenter', () => { box.style.borderColor = '#60a5fa'; });
                box.addEventListener('mouseleave', () => { box.style.borderColor = '#334155'; });
                box.addEventListener('click', () => {
                    this.nosExpandidos[c.ir] = true;
                    this.navegarPara({ tipo: c.ir });
                });
                const t1 = dom('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' });
                t1.appendChild(dom('strong', { color: '#f8fafc', fontSize: '12px' }, c.icone + ' ' + c.titulo));
                t1.appendChild(this._pill(c.qtd, '#0f172a', '#38bdf8'));
                box.appendChild(t1);
                box.appendChild(dom('div', { fontSize: '11px', color: '#94a3b8' }, c.desc));
                grade.appendChild(box);
            });

            area.appendChild(grade);
            return area;
        }

        _wsSubtelas(area, ctx) {
            const subtelas = Array.isArray(ctx.subtelas) ? ctx.subtelas : [];
            area.appendChild(dom('div', { fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }, '🌐 Subtelas & Rotas do Contexto (' + subtelas.length + ')'));
            subtelas.forEach((st) => {
                const linha = dom('div', {
                    padding: '7px 10px',
                    marginBottom: '6px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                });
                const esq = dom('div');
                esq.appendChild(dom('strong', { color: '#38bdf8', fontFamily: 'Consolas, monospace' }, st.id + ' — ' + st.nome));
                esq.appendChild(dom('div', { fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'Consolas, monospace' }, (st.rotas || []).join('  |  ')));
                const btns = dom('div', { display: 'flex', gap: '4px' });
                btns.appendChild(this._btnIde('Ver Comandos ➔', '#334155', '#e2e8f0', () => this.navegarPara({ tipo: 'comandos', filtroSubtela: st.id })));
                btns.appendChild(this._btnIde('Ver Objetos ➔', '#334155', '#e2e8f0', () => this.navegarPara({ tipo: 'objetos', filtroSubtela: st.id })));
                linha.appendChild(esq);
                linha.appendChild(btns);
                area.appendChild(linha);
            });
            return area;
        }

        _wsListaComandos(area, ctx, apenasEventos) {
            const todos = this.obterComandosContexto(ctx).filter((c) => {
                const ehEv = Boolean(c.gatilho && c.gatilho !== 'manual');
                if (apenasEventos && !ehEv) return false;
                if (!apenasEventos && ehEv && this.visaoAtual.filtroSubtela === 'TODAS') return true;
                if (this.visaoAtual.filtroSubtela !== 'TODAS' && c.subtelaId !== this.visaoAtual.filtroSubtela) return false;
                return true;
            });

            const topo = dom('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' });
            topo.appendChild(dom('strong', { color: '#f8fafc', fontSize: '12.5px' },
                (apenasEventos ? '⚡ Eventos Reativos da Página' : '📜 Todos os Comandos, Eventos & Subfluxos') + ' (' + todos.length + ')'));

            const inp = dom('input', { padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '11.5px', minWidth: '220px' });
            inp.placeholder = 'Filtrar comando ou subfluxo...';
            inp.value = this.buscaLista;
            inp.addEventListener('input', () => { this.buscaLista = inp.value; this.renderizar(); });

            const dir = dom('div', { display: 'flex', gap: '6px' });
            dir.appendChild(inp);
            dir.appendChild(this._btnIde('+ Novo', '#2563eb', '#ffffff', () => this._iniciarNovoComando(ctx, apenasEventos ? 'ao_selecionar_processo' : 'manual')));
            topo.appendChild(dir);
            area.appendChild(topo);

            const q = this.buscaLista.trim().toLowerCase();
            const filtrados = todos.filter((c) => !q ||
                String(c.id || '').toLowerCase().includes(q) ||
                String(c.nome || '').toLowerCase().includes(q) ||
                String(c.nomePad || '').toLowerCase().includes(q));

            const lista = dom('div', { display: 'flex', flexDirection: 'column', gap: '3px' });
            filtrados.forEach((c) => {
                const qtdLinhas = this.contarPassosTotais(c.passos);
                const row = dom('div', {
                    display: 'grid',
                    gridTemplateColumns: '22px minmax(180px, 1.6fr) 125px 125px 68px auto',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11.5px'
                });
                row.addEventListener('click', () => this.navegarPara({ tipo: 'editor_comando', itemId: c.id, filtroSubtela: this.visaoAtual.filtroSubtela }));

                const dot = dom('span', { color: c.ativo !== false ? '#34d399' : '#64748b', fontWeight: '900', textAlign: 'center' }, c.ativo !== false ? '●' : '○');
                dot.title = c.ativo !== false ? 'Ativo' : 'Inativo / Subfluxo';

                const colNome = dom('div', { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
                colNome.appendChild(dom('strong', { color: '#f8fafc' }, c.nome || c.id));
                if (c._editado) colNome.appendChild(dom('span', { color: '#fbbf24', marginLeft: '5px', fontSize: '10px' }, '[EDITADO]'));

                const colSub = dom('span', { color: '#94a3b8', fontFamily: 'Consolas, monospace', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, c.subtelaId || 'geral');
                const colGat = dom('span', { color: '#38bdf8', fontFamily: 'Consolas, monospace', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, c.gatilho || 'manual');
                const colLin = dom('span', { color: '#cbd5e1', fontFamily: 'Consolas, monospace', fontSize: '10.5px' }, qtdLinhas + ' lin.');

                const btnAbrir = this._btnIde('Programar ➔', '#334155', '#f8fafc', (ev) => {
                    ev.stopPropagation();
                    this.navegarPara({ tipo: 'editor_comando', itemId: c.id, filtroSubtela: this.visaoAtual.filtroSubtela });
                });

                row.appendChild(dot);
                row.appendChild(colNome);
                row.appendChild(colSub);
                row.appendChild(colGat);
                row.appendChild(colLin);
                row.appendChild(btnAbrir);
                lista.appendChild(row);
            });

            area.appendChild(lista);
            return area;
        }

        _wsListaObjetos(area, ctx) {
            const objs = this.obterObjetosContexto(ctx);
            const refs = this.mapearReferenciasObjetos(ctx);

            const topo = dom('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' });
            topo.appendChild(dom('strong', { color: '#f8fafc', fontSize: '12.5px' }, '🧩 Objetos da Página no Contexto (' + Object.keys(objs).length + ')'));

            const inp = dom('input', { padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '11.5px', minWidth: '220px' });
            inp.placeholder = 'Filtrar por ID, classe CSS ou XPath...';
            inp.value = this.buscaLista;
            inp.addEventListener('input', () => { this.buscaLista = inp.value; this.renderizar(); });

            const dir = dom('div', { display: 'flex', gap: '6px' });
            dir.appendChild(inp);
            dir.appendChild(this._btnIde('+ Novo Objeto', '#0369a1', '#ffffff', () => this._iniciarNovoObjeto(ctx)));
            topo.appendChild(dir);
            area.appendChild(topo);

            const q = this.buscaLista.trim().toLowerCase();
            const ids = Object.keys(objs).sort().filter((id) => {
                const o = objs[id];
                if (this.visaoAtual.filtroSubtela !== 'TODAS' && (o.subtelaId || 'painel_tarefas') !== this.visaoAtual.filtroSubtela) return false;
                if (!q) return true;
                const sels = this.normalizarSeletores(o);
                return id.toLowerCase().includes(q) ||
                    String(o.nomeOriginalPad || o.descricao || '').toLowerCase().includes(q) ||
                    sels.some((s) => s.expressao.toLowerCase().includes(q));
            });

            const lista = dom('div', { display: 'flex', flexDirection: 'column', gap: '3px' });
            ids.forEach((id) => {
                const o = objs[id];
                const sels = this.normalizarSeletores(o);
                const usos = refs[id] || [];
                const sel1 = sels[0] ? '[' + sels[0].tipo + '] ' + sels[0].expressao : '(vazio)';

                const row = dom('div', {
                    display: 'grid',
                    gridTemplateColumns: '155px 120px minmax(180px, 1fr) 74px auto',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '11px'
                });
                row.addEventListener('click', () => this.navegarPara({ tipo: 'editor_objeto', itemId: id, filtroSubtela: this.visaoAtual.filtroSubtela }));

                const cId = dom('strong', { color: o._editado ? '#fbbf24' : '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, id);
                const cSub = dom('span', { color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, o.subtelaId || 'geral');
                const cSel = dom('span', { color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, sel1);
                cSel.title = sels.map((s) => '[' + s.tipo + '] ' + s.expressao).join('\n');
                const cUso = dom('span', { color: usos.length > 0 ? '#fca5a5' : '#64748b' }, usos.length > 0 ? 'uso: ' + usos.length : 'livre');

                const btnEd = this._btnIde('Editar ➔', '#334155', '#f8fafc', (ev) => {
                    ev.stopPropagation();
                    this.navegarPara({ tipo: 'editor_objeto', itemId: id, filtroSubtela: this.visaoAtual.filtroSubtela });
                });

                row.appendChild(cId);
                row.appendChild(cSub);
                row.appendChild(cSel);
                row.appendChild(cUso);
                row.appendChild(btnEd);
                lista.appendChild(row);
            });

            area.appendChild(lista);
            return area;
        }

        // =====================================================================
        // NIVEL 2: EDITOR IDE DE PROGRAMACAO LINHA-A-LINHA (COMANDOS/EVENTOS)
        // =====================================================================
        _iniciarNovoComando(ctx, gatilhoPadrao) {
            const novoId = 'cmd_usr_' + Date.now().toString(36).slice(-4);
            const sub = (ctx.subtelas && ctx.subtelas[0] && ctx.subtelas[0].id) || 'painel_tarefas';
            const rotas = (ctx.subtelas && ctx.subtelas[0] && ctx.subtelas[0].rotas) || ctx.urlsBase || [];
            this.rascunhoComando = {
                _novo: true,
                _origem: 'usuario',
                contextoId: ctx.id,
                subtelaId: sub,
                id: novoId,
                nome: 'Novo Comando',
                descricao: '',
                ativo: true,
                gatilho: gatilhoPadrao || 'ao_selecionar_processo',
                urlsAlvo: clonar(rotas),
                limites: { delayMs: 350, timeoutMs: 10000, maxIteracoes: 20 },
                passos: [
                    { acao: 'SET_STATUS', substatus: 'Executando...' }
                ]
            };
            this.navegarPara({ tipo: 'editor_comando', itemId: novoId });
            // Reatribuir rascunho pois navegarPara limpa rascunhos anteriores
            this.rascunhoComando = {
                _novo: true,
                _origem: 'usuario',
                contextoId: ctx.id,
                subtelaId: sub,
                id: novoId,
                nome: 'Novo Comando',
                descricao: '',
                ativo: true,
                gatilho: gatilhoPadrao || 'ao_selecionar_processo',
                urlsAlvo: clonar(rotas),
                limites: { delayMs: 350, timeoutMs: 10000, maxIteracoes: 20 },
                passos: [
                    { acao: 'SET_STATUS', substatus: 'Executando...' }
                ]
            };
            this.renderizar();
        }

        _wsEditorComandoIde(area, ctx) {
            if (!this.rascunhoComando) {
                const existente = this.obterComandosContexto(ctx).find((c) => c.id === this.visaoAtual.itemId);
                if (!existente) {
                    area.appendChild(dom('div', { color: '#fca5a5' }, 'Comando não encontrado.'));
                    return area;
                }
                this.rascunhoComando = clonar(existente);
                if (!Array.isArray(this.rascunhoComando.passos)) this.rascunhoComando.passos = [];
            }

            const cmd = this.rascunhoComando;
            const objsCtx = this.obterObjetosContexto(ctx);

            // Cabecalho compacto de metadados do Comando/Evento
            const metaBox = dom('div', {
                padding: '8px 10px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                marginBottom: '8px'
            });

            const linhaMeta1 = dom('div', { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr auto', gap: '6px', alignItems: 'end', marginBottom: '6px' });
            const fNome = this._inputIde('Nome do Comando / Evento', cmd.nome || '');
            fNome.input.addEventListener('input', () => { cmd.nome = fNome.input.value; });

            const fId = this._inputIde('ID', cmd.id || '');
            if (!cmd._novo) fId.input.disabled = true;
            else fId.input.addEventListener('input', () => { cmd.id = fId.input.value.trim().replace(/\s+/g, '_'); });

            const fSub = this._selectIde('Subtela', (ctx.subtelas || []).map((s) => ({ valor: s.id, rotulo: s.id })), cmd.subtelaId || 'painel_tarefas');
            fSub.select.addEventListener('change', () => {
                cmd.subtelaId = fSub.select.value;
                const st = (ctx.subtelas || []).find((x) => x.id === cmd.subtelaId);
                if (st && Array.isArray(st.rotas)) {
                    cmd.urlsAlvo = clonar(st.rotas);
                    this.renderizar();
                }
            });

            const fGat = this._selectIde('Evento / Gatilho', GATILHOS, cmd.gatilho || 'manual');
            fGat.select.addEventListener('change', () => { cmd.gatilho = fGat.select.value; });

            const chkWrap = dom('label', { display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '4px', cursor: 'pointer', color: '#34d399', fontWeight: '700' });
            const chkAtivo = document.createElement('input');
            chkAtivo.type = 'checkbox';
            chkAtivo.checked = cmd.ativo !== false;
            chkAtivo.addEventListener('change', () => { cmd.ativo = chkAtivo.checked; });
            chkWrap.appendChild(chkAtivo);
            chkWrap.appendChild(dom('span', null, 'Ativo'));

            linhaMeta1.appendChild(fNome.wrap);
            linhaMeta1.appendChild(fId.wrap);
            linhaMeta1.appendChild(fSub.wrap);
            linhaMeta1.appendChild(fGat.wrap);
            linhaMeta1.appendChild(chkWrap);
            metaBox.appendChild(linhaMeta1);

            const linhaMeta2 = dom('div', { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '6px' });
            const fRotas = this._inputIde('Rotas Alvo (separadas por | )', (cmd.urlsAlvo || []).join(' | '));
            fRotas.input.addEventListener('input', () => {
                cmd.urlsAlvo = fRotas.input.value.split('|').map((s) => s.trim()).filter(Boolean);
            });
            const fDesc = this._inputIde('Descrição curta', cmd.descricao || '');
            fDesc.input.addEventListener('input', () => { cmd.descricao = fDesc.input.value; });
            linhaMeta2.appendChild(fRotas.wrap);
            linhaMeta2.appendChild(fDesc.wrap);
            metaBox.appendChild(linhaMeta2);
            area.appendChild(metaBox);

            // Barra de ferramentas do Editor de Codigo
            const barraCod = dom('div', {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '6px'
            });

            const esqCod = dom('div', { display: 'flex', gap: '5px', alignItems: 'center' });
            esqCod.appendChild(this._btnIde('+ Inserir Linha no Fim', '#0284c7', '#ffffff', () => {
                cmd.passos.push({ acao: 'CLICK', objeto: Object.keys(objsCtx)[0] || '' });
                this.caminhoLinhaEditando = JSON.stringify([cmd.passos.length - 1]);
                this.renderizar();
            }));
            esqCod.appendChild(this._btnIde(this.modoJsonPuro ? '☰ Visão Linhas IDE' : '{ } Editar JSON Puro', '#334155', '#e2e8f0', () => {
                this.modoJsonPuro = !this.modoJsonPuro;
                this.renderizar();
            }));

            const dirCod = dom('div', { display: 'flex', gap: '5px' });
            if (cmd._origem === 'interno' && (this.comandosOverrides[cmd.id] || cmd._editado)) {
                dirCod.appendChild(this._btnIde('↺ Restaurar Original de Fábrica', '#78350f', '#fde68a', async () => {
                    delete this.comandosOverrides[cmd.id];
                    this.rascunhoComando = null;
                    await this.persistirTudo('Comando "' + cmd.id + '" restaurado ao algoritmo original.');
                }));
            }
            if (cmd._origem === 'usuario' && !cmd._novo) {
                dirCod.appendChild(this._btnIde('🗑️ Excluir Comando', '#7f1d1d', '#fecaca', async () => {
                    this.comandosUsuario.splice(cmd._idxUsuario, 1);
                    this.rascunhoComando = null;
                    await this.persistirTudo('Comando removido.');
                    this.voltarUmNivel();
                }));
            }
            dirCod.appendChild(this._btnIde('💾 Salvar no Banco de Dados', '#059669', '#ffffff', async () => {
                if (!cmd.nome || !Array.isArray(cmd.urlsAlvo) || cmd.urlsAlvo.length === 0) {
                    this.avisoTexto = 'Informe nome e ao menos 1 rota alvo antes de salvar.';
                    this.avisoTipo = 'erro';
                    this.renderizar();
                    return;
                }
                const setObjs = new Set();
                this.coletarObjsPassos(cmd.passos, setObjs);
                const limpo = {
                    contextoId: ctx.id,
                    subtelaId: cmd.subtelaId || 'painel_tarefas',
                    id: cmd.id,
                    nomePad: cmd.nomePad,
                    nome: cmd.nome,
                    descricao: cmd.descricao || '',
                    ativo: cmd.ativo !== false,
                    gatilho: cmd.gatilho || 'manual',
                    urlsAlvo: cmd.urlsAlvo,
                    limites: cmd.limites || { delayMs: 350, timeoutMs: 10000, maxIteracoes: 20 },
                    objetosUsados: Array.from(setObjs),
                    passos: cmd.passos
                };
                if (cmd._origem === 'interno') {
                    this.comandosOverrides[cmd.id] = limpo;
                } else if (cmd._novo) {
                    cmd._novo = false;
                    cmd._idxUsuario = this.comandosUsuario.length;
                    this.comandosUsuario.push(limpo);
                } else {
                    this.comandosUsuario[cmd._idxUsuario] = limpo;
                }
                await this.persistirTudo('Algoritmo "' + cmd.nome + '" salvo no BD e ativo no motor!');
            }));

            barraCod.appendChild(esqCod);
            barraCod.appendChild(dirCod);
            area.appendChild(barraCod);

            // Corpo do Editor: JSON Puro ou Grade Linha-a-Linha Antigravity IDE
            if (this.modoJsonPuro) {
                const txt = dom('textarea', {
                    width: '100%',
                    minHeight: '340px',
                    padding: '8px',
                    background: '#020617',
                    color: '#a7f3d0',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '11.5px',
                    boxSizing: 'border-box'
                });
                txt.value = JSON.stringify(cmd.passos, null, 2);
                txt.addEventListener('change', () => {
                    try {
                        const parsed = JSON.parse(txt.value);
                        if (Array.isArray(parsed)) cmd.passos = parsed;
                    } catch (e) {
                        this.avisoTexto = 'JSON inválido: ' + e.message;
                        this.avisoTipo = 'erro';
                        this.renderizar();
                    }
                });
                area.appendChild(txt);
                return area;
            }

            const editorLinhas = dom('div', {
                background: '#020617',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px 0',
                fontFamily: 'Consolas, "Cascadia Code", monospace',
                fontSize: '11.5px'
            });

            const contadorRef = { num: 0 };
            this._renderizarBlocoLinhas(editorLinhas, cmd.passos, [], 0, contadorRef, cmd, objsCtx, ctx);

            if (cmd.passos.length === 0) {
                editorLinhas.appendChild(dom('div', { padding: '12px', color: '#64748b' }, '// Algoritmo vazio — clique em "+ Inserir Linha no Fim" acima.'));
            }

            area.appendChild(editorLinhas);
            return area;
        }

        _renderizarBlocoLinhas(container, listaPassos, caminhoBase, nivel, contadorRef, cmdRaiz, objsCtx, ctx) {
            if (!Array.isArray(listaPassos)) return;

            listaPassos.forEach((passo, idx) => {
                contadorRef.num += 1;
                const numStr = String(contadorRef.num).padStart(2, '0');
                const caminhoAtual = caminhoBase.concat([idx]);
                const chaveCaminho = JSON.stringify(caminhoAtual);
                const editandoEsta = this.caminhoLinhaEditando === chaveCaminho;

                const tipo = String(passo.acao || passo.tipo || 'PASSO').toUpperCase();
                const infoAcao = MAPA_ACOES[tipo] || { cor: '#94a3b8', tag: tipo, rotulo: tipo };

                const row = dom('div', {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '2.5px 8px',
                    borderBottom: '1px solid #0f172a',
                    background: editandoEsta ? '#1e293b' : 'transparent',
                    opacity: passo.desativado ? '0.45' : '1'
                });

                const esq = dom('div', { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '0', flex: '1' });
                esq.appendChild(dom('span', { color: '#475569', width: '20px', flexShrink: '0', textAlign: 'right' }, numStr));

                if (nivel > 0) {
                    esq.appendChild(dom('span', { color: '#334155', whiteSpace: 'pre' }, '│  '.repeat(nivel)));
                }

                esq.appendChild(dom('span', {
                    color: infoAcao.cor,
                    fontWeight: '700',
                    minWidth: '58px',
                    flexShrink: '0',
                    textDecoration: passo.desativado ? 'line-through' : 'none'
                }, infoAcao.tag));

                const exprSpan = this._formatarExpressaoLinha(passo, tipo, ctx);
                if (passo.desativado) exprSpan.style.textDecoration = 'line-through';
                esq.appendChild(exprSpan);

                // Controles inline ultra-condensados da linha
                const ctrl = dom('div', { display: 'flex', gap: '2px', flexShrink: '0' });

                ctrl.appendChild(this._microBtn('↑', 'Subir linha', idx === 0, () => {
                    const { lista, idx: pos } = this.obterListaPaiEIndice(cmdRaiz.passos, caminhoAtual);
                    if (pos > 0) {
                        const tmp = lista[pos - 1];
                        lista[pos - 1] = lista[pos];
                        lista[pos] = tmp;
                        this.renderizar();
                    }
                }));

                ctrl.appendChild(this._microBtn('↓', 'Descer linha', idx === listaPassos.length - 1, () => {
                    const { lista, idx: pos } = this.obterListaPaiEIndice(cmdRaiz.passos, caminhoAtual);
                    if (pos < lista.length - 1) {
                        const tmp = lista[pos + 1];
                        lista[pos + 1] = lista[pos];
                        lista[pos] = tmp;
                        this.renderizar();
                    }
                }));

                ctrl.appendChild(this._microBtn('+', 'Inserir linha logo abaixo', false, () => {
                    const { lista, idx: pos } = this.obterListaPaiEIndice(cmdRaiz.passos, caminhoAtual);
                    lista.splice(pos + 1, 0, { acao: 'WAIT_MS', ms: 350 });
                    this.caminhoLinhaEditando = JSON.stringify(caminhoBase.concat([pos + 1]));
                    this.renderizar();
                }));

                if (tipo === 'IF_CONDITION') {
                    ctrl.appendChild(this._microBtn('+Se', 'Inserir linha dentro de ENTÃO', false, () => {
                        if (!Array.isArray(passo.entao)) passo.entao = [];
                        passo.entao.push({ acao: 'CLICK', objeto: '' });
                        this.caminhoLinhaEditando = JSON.stringify(caminhoAtual.concat(['entao', passo.entao.length - 1]));
                        this.renderizar();
                    }));
                    ctrl.appendChild(this._microBtn('+Senão', 'Inserir linha dentro de SENÃO', false, () => {
                        if (!Array.isArray(passo.senao)) passo.senao = [];
                        passo.senao.push({ acao: 'WAIT_MS', ms: 300 });
                        this.caminhoLinhaEditando = JSON.stringify(caminhoAtual.concat(['senao', passo.senao.length - 1]));
                        this.renderizar();
                    }));
                } else if (tipo === 'LOOP_WHILE' || tipo === 'LOOP_FOREACH') {
                    ctrl.appendChild(this._microBtn('+Loop', 'Inserir linha dentro do LOOP', false, () => {
                        if (!Array.isArray(passo.passos)) passo.passos = [];
                        passo.passos.push({ acao: 'WAIT_MS', ms: 300 });
                        this.caminhoLinhaEditando = JSON.stringify(caminhoAtual.concat(['passos', passo.passos.length - 1]));
                        this.renderizar();
                    }));
                }

                ctrl.appendChild(this._microBtn('✎', 'Editar parâmetros desta linha', false, () => {
                    this.caminhoLinhaEditando = editandoEsta ? null : chaveCaminho;
                    this.renderizar();
                }));

                ctrl.appendChild(this._microBtn('//', 'Ativar / Desativar (comentar) linha', false, () => {
                    passo.desativado = !passo.desativado;
                    this.renderizar();
                }));

                ctrl.appendChild(this._microBtn('×', 'Excluir linha', false, () => {
                    const { lista, idx: pos } = this.obterListaPaiEIndice(cmdRaiz.passos, caminhoAtual);
                    lista.splice(pos, 1);
                    if (editandoEsta) this.caminhoLinhaEditando = null;
                    this.renderizar();
                }, '#fca5a5'));

                row.appendChild(esq);
                row.appendChild(ctrl);
                container.appendChild(row);

                // Inspetor inline de edicao de parametros da linha selecionada
                if (editandoEsta) {
                    container.appendChild(this._renderizarInspetorLinha(passo, objsCtx, ctx));
                }

                // Renderizar blocos filhos aninhados (IF / LOOP)
                if (tipo === 'IF_CONDITION') {
                    if (Array.isArray(passo.entao) && passo.entao.length > 0) {
                        container.appendChild(dom('div', { padding: '1px 8px 1px ' + (34 + nivel * 18) + 'px', color: '#4ade80', fontSize: '10.5px' }, '↳ ENTÃO:'));
                        this._renderizarBlocoLinhas(container, passo.entao, caminhoAtual.concat(['entao']), nivel + 1, contadorRef, cmdRaiz, objsCtx, ctx);
                    }
                    if (Array.isArray(passo.senao) && passo.senao.length > 0) {
                        container.appendChild(dom('div', { padding: '1px 8px 1px ' + (34 + nivel * 18) + 'px', color: '#f87171', fontSize: '10.5px' }, '↳ SENÃO:'));
                        this._renderizarBlocoLinhas(container, passo.senao, caminhoAtual.concat(['senao']), nivel + 1, contadorRef, cmdRaiz, objsCtx, ctx);
                    }
                } else if ((tipo === 'LOOP_WHILE' || tipo === 'LOOP_FOREACH') && Array.isArray(passo.passos) && passo.passos.length > 0) {
                    this._renderizarBlocoLinhas(container, passo.passos, caminhoAtual.concat(['passos']), nivel + 1, contadorRef, cmdRaiz, objsCtx, ctx);
                }
            });
        }

        _formatarExpressaoLinha(p, tipo, ctx) {
            const span = dom('span', { color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
            const linkObj = (idObj) => {
                const b = dom('span', { color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', margin: '0 3px' }, '@' + idObj);
                b.title = 'Clique para inspecionar/editar o objeto ' + idObj;
                b.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.navegarPara({ tipo: 'editor_objeto', itemId: idObj });
                });
                return b;
            };

            if (tipo === 'CLICK' || tipo === 'CLICK_IF_UNCHECKED') {
                span.appendChild(linkObj(p.objeto || '?'));
            } else if (tipo === 'POPULATE_TEXT') {
                span.appendChild(linkObj(p.objeto || '?'));
                span.appendChild(dom('span', { color: '#fde047' }, ' <= "' + (p.texto || '') + '"'));
            } else if (tipo === 'GET_ELEMENT_DETAIL') {
                span.appendChild(linkObj(p.objeto || '?'));
                span.appendChild(dom('span', { color: '#94a3b8' }, '.' + (p.atributo || 'Own Text') + ' -> '));
                span.appendChild(dom('span', { color: '#a3e635' }, p.variavelDestino || ''));
            } else if (tipo === 'WAIT_ELEMENT' || tipo === 'WAIT_NOT_ELEMENT') {
                span.appendChild(linkObj(p.objeto || '?'));
                span.appendChild(dom('span', { color: '#64748b' }, ' (' + (p.timeoutMs || 10000) + 'ms)'));
            } else if (tipo === 'WAIT_MS') {
                span.appendChild(dom('span', { color: '#cbd5e1' }, (p.ms || 0) + ' ms'));
            } else if (tipo === 'SET_STATUS') {
                const s1 = p.status ? 'status="' + p.status + '" ' : '';
                const s2 = p.substatus ? 'sub="' + p.substatus + '"' : (p.texto ? '"' + p.texto + '"' : '');
                span.appendChild(dom('span', { color: '#6ee7b7' }, s1 + s2));
            } else if (tipo === 'TAB_CHECK_MATCH') {
                span.appendChild(dom('span', { color: '#94a3b8' }, 'aba("' + (p.padraoUrl || '') + '") '));
                if (p.objetoVerificar) span.appendChild(linkObj(p.objetoVerificar));
                span.appendChild(dom('span', { color: '#fde047' }, ' ' + (p.modoMatch || 'igual') + ' "' + (p.textoEsperado || '') + '" -> ' + (p.variavelDestino || '')));
            } else if (tipo === 'TAB_ACTION_MATCH') {
                span.appendChild(dom('span', { color: '#94a3b8' }, 'aba("' + (p.padraoUrl || '') + '", ' + (p.modoMatch || '') + ' "' + (p.textoEsperado || '') + '") => ' + (p.acaoNaAba || '') + ' '));
                if (p.objetoAcao) span.appendChild(linkObj(p.objetoAcao));
                if (p.textoPreencher) span.appendChild(dom('span', { color: '#fde047' }, ' <= "' + p.textoPreencher + '"'));
            } else if (tipo === 'IF_CONDITION' || tipo === 'LOOP_WHILE') {
                const c = p.condicao || {};
                const pre = tipo === 'LOOP_WHILE' ? '[max ' + (p.maxIteracoes || 10) + 'x] ' : '';
                span.appendChild(dom('span', { color: '#d8b4fe' }, pre + (c.operador || 'igual') + '('));
                if (c.objeto) span.appendChild(linkObj(c.objeto));
                else span.appendChild(dom('span', { color: '#f8fafc' }, c.variavel || c.texto || ''));
                if (c.direita !== undefined) span.appendChild(dom('span', { color: '#fde047' }, ', "' + c.direita + '"'));
                span.appendChild(dom('span', { color: '#d8b4fe' }, ')'));
            } else if (tipo === 'SET_VAR') {
                span.appendChild(dom('span', { color: '#a3e635' }, (p.variavel || '') + ' = ' + JSON.stringify(p.valor)));
            } else if (tipo === 'CALL_SUBFLOW') {
                span.appendChild(dom('span', { color: '#818cf8' }, p.subfluxo || ''));
            } else if (tipo === 'REGEX_PARSE') {
                span.appendChild(dom('span', { color: '#f472b6' }, (p.variavelFonte || '') + ' /' + (p.padrao || '') + '/ -> ' + (p.variavelDestino || '')));
            } else {
                span.textContent = JSON.stringify(p);
            }
            return span;
        }

        _renderizarInspetorLinha(passo, objsCtx, ctx) {
            const box = dom('div', {
                margin: '4px 12px 6px 28px',
                padding: '8px 10px',
                background: '#0f172a',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '6px',
                alignItems: 'end'
            });

            const listaAcoes = CATALOGO_ACOES.map((a) => ({ valor: a.acao, rotulo: a.tag + ' — ' + a.rotulo }));
            const selAc = this._selectIde('Instrução (Ação)', listaAcoes, String(passo.acao || 'CLICK').toUpperCase());
            selAc.select.addEventListener('change', () => {
                passo.acao = selAc.select.value;
                if (passo.acao === 'IF_CONDITION' && !passo.condicao) { passo.condicao = { operador: 'truthy', variavel: '' }; passo.entao = passo.entao || []; }
                if (passo.acao === 'LOOP_WHILE' && !passo.condicao) { passo.condicao = { operador: 'falsy', variavel: '' }; passo.maxIteracoes = 5; passo.passos = passo.passos || []; }
                this.renderizar();
            });
            box.appendChild(selAc.wrap);

            const opcoesObj = [{ valor: '', rotulo: '-- Nenhum --' }].concat(
                Object.keys(objsCtx).sort().map((id) => ({ valor: id, rotulo: id + ' (' + (objsCtx[id].subtelaId || '') + ')' }))
            );

            const ac = String(passo.acao || '').toUpperCase();
            if (['CLICK', 'CLICK_IF_UNCHECKED', 'POPULATE_TEXT', 'GET_ELEMENT_DETAIL', 'WAIT_ELEMENT', 'WAIT_NOT_ELEMENT'].includes(ac)) {
                const sObj = this._selectIde('Objeto da Página', opcoesObj, passo.objeto || '');
                sObj.select.addEventListener('change', () => { passo.objeto = sObj.select.value; this.renderizar(); });
                box.appendChild(sObj.wrap);
            }

            if (ac === 'POPULATE_TEXT') {
                const iTxt = this._inputIde('Texto / ${variavel}', passo.texto || '');
                iTxt.input.addEventListener('change', () => { passo.texto = iTxt.input.value; this.renderizar(); });
                box.appendChild(iTxt.wrap);
            } else if (ac === 'GET_ELEMENT_DETAIL') {
                const iVar = this._inputIde('Salvar em Variável', passo.variavelDestino || '');
                iVar.input.addEventListener('change', () => { passo.variavelDestino = iVar.input.value; this.renderizar(); });
                box.appendChild(iVar.wrap);
            } else if (ac === 'WAIT_MS') {
                const iMs = this._inputIde('Tempo (ms)', String(passo.ms || 350));
                iMs.input.addEventListener('change', () => { passo.ms = Number(iMs.input.value) || 0; this.renderizar(); });
                box.appendChild(iMs.wrap);
            } else if (ac === 'WAIT_ELEMENT' || ac === 'WAIT_NOT_ELEMENT') {
                const iTo = this._inputIde('Timeout (ms)', String(passo.timeoutMs || 10000));
                iTo.input.addEventListener('change', () => { passo.timeoutMs = Number(iTo.input.value) || 5000; this.renderizar(); });
                box.appendChild(iTo.wrap);
            } else if (ac === 'SET_STATUS') {
                const iSt = this._inputIde('Status Principal (ex: CNJ)', passo.status || '');
                iSt.input.addEventListener('change', () => {
                    if (iSt.input.value) passo.status = iSt.input.value; else delete passo.status;
                    this.renderizar();
                });
                const iSub = this._inputIde('Substatus (Tarefa/Etapa)', passo.substatus || passo.texto || '');
                iSub.input.addEventListener('change', () => { passo.substatus = iSub.input.value; this.renderizar(); });
                box.appendChild(iSt.wrap);
                box.appendChild(iSub.wrap);
            } else if (ac === 'SET_VAR') {
                const iVn = this._inputIde('Propriedade / Variável', passo.variavel || '');
                iVn.input.addEventListener('change', () => { passo.variavel = iVn.input.value; this.renderizar(); });
                const iVv = this._inputIde('Valor', String(passo.valor !== undefined ? passo.valor : ''));
                iVv.input.addEventListener('change', () => {
                    const raw = iVv.input.value;
                    passo.valor = raw === 'true' ? true : (raw === 'false' ? false : (!Number.isNaN(Number(raw)) && raw !== '' ? Number(raw) : raw));
                    this.renderizar();
                });
                box.appendChild(iVn.wrap);
                box.appendChild(iVv.wrap);
            } else if (ac === 'IF_CONDITION' || ac === 'LOOP_WHILE') {
                if (!passo.condicao) passo.condicao = { operador: 'igual' };
                const sOp = this._selectIde('Operador', OPERADORES.map((o) => ({ valor: o, rotulo: o })), passo.condicao.operador || 'igual');
                sOp.select.addEventListener('change', () => { passo.condicao.operador = sOp.select.value; this.renderizar(); });
                box.appendChild(sOp.wrap);

                if (passo.condicao.operador === 'existeElemento' || passo.condicao.operador === 'naoExisteElemento') {
                    const sCo = this._selectIde('Objeto Alvo', opcoesObj, passo.condicao.objeto || '');
                    sCo.select.addEventListener('change', () => { passo.condicao.objeto = sCo.select.value; this.renderizar(); });
                    box.appendChild(sCo.wrap);
                } else {
                    const iCv = this._inputIde('Variável / Texto', passo.condicao.variavel || passo.condicao.texto || '');
                    iCv.input.addEventListener('change', () => {
                        if (passo.condicao.operador.startsWith('pagina')) passo.condicao.texto = iCv.input.value;
                        else passo.condicao.variavel = iCv.input.value;
                        this.renderizar();
                    });
                    const iCd = this._inputIde('Comparar com', passo.condicao.direita !== undefined ? String(passo.condicao.direita) : '');
                    iCd.input.addEventListener('change', () => { passo.condicao.direita = iCd.input.value; this.renderizar(); });
                    box.appendChild(iCv.wrap);
                    box.appendChild(iCd.wrap);
                }
                if (ac === 'LOOP_WHILE') {
                    const iMax = this._inputIde('Máx Iterações', String(passo.maxIteracoes || 5));
                    iMax.input.addEventListener('change', () => { passo.maxIteracoes = Number(iMax.input.value) || 5; this.renderizar(); });
                    box.appendChild(iMax.wrap);
                }
            } else if (ac === 'TAB_CHECK_MATCH' || ac === 'TAB_ACTION_MATCH') {
                const iUrl = this._inputIde('Filtro URL da Guia', passo.padraoUrl || 'listAutosDigitais.seam');
                iUrl.input.addEventListener('change', () => { passo.padraoUrl = iUrl.input.value; this.renderizar(); });
                const sOv = this._selectIde('Objeto p/ Conferir DOM', opcoesObj, passo.objetoVerificar || '');
                sOv.select.addEventListener('change', () => { passo.objetoVerificar = sOv.select.value; this.renderizar(); });
                const iEsp = this._inputIde('Texto Esperado (${CNJ})', passo.textoEsperado || '');
                iEsp.input.addEventListener('change', () => { passo.textoEsperado = iEsp.input.value; this.renderizar(); });
                box.appendChild(iUrl.wrap);
                box.appendChild(sOv.wrap);
                box.appendChild(iEsp.wrap);
                if (ac === 'TAB_ACTION_MATCH') {
                    const sAcAba = this._selectIde('Ação na Guia', [
                        { valor: 'clicar_e_fechar', rotulo: 'Clicar Objeto e Fechar Guia' },
                        { valor: 'preencher', rotulo: 'Preencher Objeto (Sinalizador)' },
                        { valor: 'clicar', rotulo: 'Apenas Clicar Objeto' },
                        { valor: 'fechar', rotulo: 'Apenas Fechar Guia' }
                    ], passo.acaoNaAba || 'clicar_e_fechar');
                    sAcAba.select.addEventListener('change', () => { passo.acaoNaAba = sAcAba.select.value; this.renderizar(); });
                    const sOa = this._selectIde('Objeto da Ação', opcoesObj, passo.objetoAcao || '');
                    sOa.select.addEventListener('change', () => { passo.objetoAcao = sOa.select.value; this.renderizar(); });
                    box.appendChild(sAcAba.wrap);
                    box.appendChild(sOa.wrap);
                }
            } else if (ac === 'CALL_SUBFLOW') {
                const subs = this.obterComandosContexto(ctx).map((c) => ({ valor: c.nomePad || c.id, rotulo: (c.nomePad || c.id) + ' — ' + c.nome }));
                const sSub = this._selectIde('Comando / Subfluxo Alvo', subs, passo.subfluxo || '');
                sSub.select.addEventListener('change', () => { passo.subfluxo = sSub.select.value; this.renderizar(); });
                box.appendChild(sSub.wrap);
            }

            return box;
        }

        // =====================================================================
        // NIVEL 2: EDITOR IDE DE OBJETO DA PAGINA (MULTIPLOS SELETORES CSS/XPATH)
        // =====================================================================
        _iniciarNovoObjeto(ctx) {
            const idNovo = 'obj_' + Date.now().toString(36).slice(-4);
            this.navegarPara({ tipo: 'editor_objeto', itemId: idNovo });
            this.rascunhoObjeto = {
                _novo: true,
                _origem: 'usuario',
                contextoId: ctx.id,
                subtelaId: 'painel_tarefas',
                id: idNovo,
                descricao: '',
                frames: [],
                seletores: [{ tipo: 'CSS', expressao: '' }]
            };
            this.historicoUndoSeletor = [];
            this.renderizar();
        }

        _wsEditorObjetoIde(area, ctx) {
            if (!this.rascunhoObjeto) {
                const objs = this.obterObjetosContexto(ctx);
                const orig = objs[this.visaoAtual.itemId];
                if (!orig) {
                    area.appendChild(dom('div', { color: '#fca5a5' }, 'Objeto não encontrado.'));
                    return area;
                }
                const sels = this.normalizarSeletores(orig);
                this.rascunhoObjeto = {
                    _novo: false,
                    _origem: orig._origem,
                    _editado: orig._editado,
                    contextoId: ctx.id,
                    subtelaId: orig.subtelaId || 'painel_tarefas',
                    id: this.visaoAtual.itemId,
                    descricao: orig.descricao || orig.nomeOriginalPad || '',
                    frames: Array.isArray(orig.frames) ? clonar(orig.frames) : [],
                    seletores: sels.length > 0 ? sels : [{ tipo: 'CSS', expressao: '' }]
                };
                this.historicoUndoSeletor = [];
            }

            const ob = this.rascunhoObjeto;
            const refs = this.mapearReferenciasObjetos(ctx)[ob.id] || [];
            const emUso = refs.length > 0;

            const box = dom('div', { padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' });

            const g1 = dom('div', { display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1.4fr', gap: '6px', marginBottom: '8px' });
            const fId = this._inputIde('ID do Objeto', ob.id);
            if (!ob._novo) fId.input.disabled = true;
            else fId.input.addEventListener('input', () => { ob.id = fId.input.value.trim().replace(/\s+/g, '_'); });

            const fSub = this._selectIde('Subtela', (ctx.subtelas || []).map((s) => ({ valor: s.id, rotulo: s.id })), ob.subtelaId);
            fSub.select.addEventListener('change', () => { ob.subtelaId = fSub.select.value; });

            const fFrames = this._inputIde('Cadeia de iframes (vírgula)', (ob.frames || []).join(', '));
            fFrames.input.addEventListener('input', () => { ob.frames = fFrames.input.value.split(',').map((s) => s.trim()).filter(Boolean); });

            const fDesc = this._inputIde('Descrição / Referência', ob.descricao);
            fDesc.input.addEventListener('input', () => { ob.descricao = fDesc.input.value; });

            g1.appendChild(fId.wrap);
            g1.appendChild(fSub.wrap);
            g1.appendChild(fFrames.wrap);
            g1.appendChild(fDesc.wrap);
            box.appendChild(g1);

            // Lista editavel de Seletores CSS / XPath com Pai/Filho/Undo/Ordem
            const cabSels = dom('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' });
            cabSels.appendChild(dom('strong', { color: '#38bdf8', fontSize: '11.5px' }, 'Seletores Limpos (Ordem de Prioridade: 1º encontrado vence)'));
            const btnsSel = dom('div', { display: 'flex', gap: '4px' });
            btnsSel.appendChild(this._btnIde('↩ Desfazer Seletor', '#334155', '#cbd5e1', () => {
                if (this.historicoUndoSeletor.length > 0) {
                    ob.seletores = this.historicoUndoSeletor.pop();
                    this.renderizar();
                }
            }));
            btnsSel.appendChild(this._btnIde('+ Adicionar Fallback', '#0284c7', '#ffffff', () => {
                ob.seletores.push({ tipo: 'XPATH', expressao: '' });
                this.renderizar();
            }));
            cabSels.appendChild(btnsSel);
            box.appendChild(cabSels);

            ob.seletores.forEach((sel, idx) => {
                const check = this.validarSeletor(sel.expressao, sel.tipo);
                const row = dom('div', {
                    display: 'grid',
                    gridTemplateColumns: '78px minmax(180px, 1fr) 26px auto',
                    gap: '5px',
                    alignItems: 'center',
                    marginBottom: '5px'
                });

                const sTipo = document.createElement('select');
                Object.assign(sTipo.style, { padding: '4px', borderRadius: '4px', background: '#020617', color: '#f8fafc', border: '1px solid #334155', fontSize: '11px', fontFamily: 'Consolas, monospace' });
                ['CSS', 'XPATH'].forEach((t) => {
                    const op = dom('option', null, t);
                    op.value = t;
                    if (t === sel.tipo) op.selected = true;
                    sTipo.appendChild(op);
                });
                sTipo.addEventListener('change', () => { sel.tipo = sTipo.value; this.renderizar(); });

                const inpExpr = document.createElement('input');
                inpExpr.type = 'text';
                inpExpr.value = sel.expressao;
                inpExpr.placeholder = sel.tipo === 'XPATH' ? "//button[contains(@title,'autos')]" : "#frameTarefas button.btn-autos";
                Object.assign(inpExpr.style, { padding: '4px 7px', borderRadius: '4px', background: '#020617', color: '#a7f3d0', border: '1px solid ' + (check.ok ? '#334155' : '#ef4444'), fontSize: '11.5px', fontFamily: 'Consolas, monospace' });
                inpExpr.addEventListener('input', () => { sel.expressao = inpExpr.value; });
                inpExpr.addEventListener('change', () => this.renderizar());

                const stIcon = dom('span', { textAlign: 'center', color: check.ok ? '#34d399' : '#f87171', fontWeight: '700' }, check.ok ? '✓' : '⚠');
                stIcon.title = check.ok ? 'Sintaxe válida' : check.msg;

                const acoes = dom('div', { display: 'flex', gap: '2px' });
                acoes.appendChild(this._microBtn('↖Pai', 'Subir seletor ao elemento Pai', false, () => {
                    this.historicoUndoSeletor.push(clonar(ob.seletores));
                    const s = sel.expressao.trim();
                    if (sel.tipo === 'XPATH') sel.expressao = s.endsWith('/..') ? s + '/..' : (s.lastIndexOf('/') > 1 ? s.slice(0, s.lastIndexOf('/')) : s + '/..');
                    else { const p = s.split(/\s*>\s*/); sel.expressao = p.length > 1 ? p.slice(0, -1).join(' > ') : ':has(> ' + s + ')'; }
                    this.renderizar();
                }));
                acoes.appendChild(this._microBtn('↘Filho', 'Descer seletor ao 1º Filho', false, () => {
                    this.historicoUndoSeletor.push(clonar(ob.seletores));
                    const s = sel.expressao.trim();
                    if (sel.tipo === 'XPATH') sel.expressao = s.endsWith('/..') ? s.slice(0, -3) : s + '/*[1]';
                    else { const m = s.match(/^:has\(>\s*(.+)\)$/); sel.expressao = m ? m[1] : s + ' > *'; }
                    this.renderizar();
                }));
                acoes.appendChild(this._microBtn('↑', 'Prioridade maior', idx === 0, () => {
                    const t = ob.seletores[idx - 1]; ob.seletores[idx - 1] = ob.seletores[idx]; ob.seletores[idx] = t; this.renderizar();
                }));
                acoes.appendChild(this._microBtn('×', 'Remover seletor', ob.seletores.length <= 1, () => {
                    ob.seletores.splice(idx, 1); this.renderizar();
                }, '#fca5a5'));

                row.appendChild(sTipo);
                row.appendChild(inpExpr);
                row.appendChild(stIcon);
                row.appendChild(acoes);
                box.appendChild(row);
            });

            // Referencias cruzadas (Comandos que usam este Objeto)
            const refBox = dom('div', { marginTop: '8px', padding: '6px 8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px' });
            if (refs.length === 0) {
                refBox.appendChild(dom('span', { color: '#64748b' }, 'Referências: nenhum comando utiliza este objeto no momento.'));
            } else {
                refBox.appendChild(dom('strong', { color: '#fca5a5' }, '🔒 Protegido — Em uso por ' + refs.length + ' comando(s): '));
                refs.forEach((r) => {
                    const lk = dom('span', { color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', marginRight: '8px' }, r.nome);
                    lk.addEventListener('click', () => this.navegarPara({ tipo: 'editor_comando', itemId: r.id }));
                    refBox.appendChild(lk);
                });
            }
            box.appendChild(refBox);

            // Rodape Salvar / Restaurar / Excluir
            const rod = dom('div', { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' });
            if (ob._origem === 'interno' && (this.objetosUsuario[ob.id] || ob._editado)) {
                rod.appendChild(this._btnIde('↺ Restaurar Seletor Original', '#78350f', '#fde68a', async () => {
                    delete this.objetosUsuario[ob.id];
                    this.rascunhoObjeto = null;
                    await this.persistirTudo('Objeto "' + ob.id + '" restaurado ao original.');
                }));
            }
            const podeExcluir = ob._origem === 'usuario' && !ob._novo && !emUso;
            if (ob._origem === 'usuario' && !ob._novo) {
                rod.appendChild(this._btnIde(emUso ? '🔒 Em uso (Não Excluível)' : '🗑️ Excluir Objeto', '#7f1d1d', '#fecaca', async () => {
                    if (!podeExcluir) return;
                    delete this.objetosUsuario[ob.id];
                    this.rascunhoObjeto = null;
                    await this.persistirTudo('Objeto excluído.');
                    this.voltarUmNivel();
                }, !podeExcluir));
            }
            rod.appendChild(this._btnIde('💾 Salvar Objeto no BD', '#059669', '#ffffff', async () => {
                const selsLimpos = ob.seletores.filter((s) => String(s.expressao || '').trim());
                if (!ob.id || selsLimpos.length === 0) {
                    this.avisoTexto = 'Informe ID e ao menos 1 seletor válido.';
                    this.avisoTipo = 'erro';
                    this.renderizar();
                    return;
                }
                this.objetosUsuario[ob.id] = {
                    contextoId: ctx.id,
                    subtelaId: ob.subtelaId,
                    tela: ob.subtelaId === 'autos_digitais' ? 'janelaAutosPje' : 'janelaTarefasPje',
                    frames: ob.frames,
                    descricao: ob.descricao,
                    seletor: selsLimpos[0].expressao,
                    tipo: selsLimpos[0].tipo,
                    seletores: selsLimpos.map((s) => ({ tipo: s.tipo.toLowerCase(), expressao: s.expressao.trim() }))
                };
                ob._novo = false;
                await this.persistirTudo('Objeto "' + ob.id + '" salvo no BD e ativo no motor!');
            }));
            box.appendChild(rod);

            area.appendChild(box);
            return area;
        }

        _wsEstadoPoo(area, ctx) {
            area.appendChild(dom('strong', { color: '#f8fafc', display: 'block', marginBottom: '6px' }, '📦 Estado Encapsulado POO do Contexto (this.estado — Zero Variáveis Globais)'));
            area.appendChild(dom('pre', {
                padding: '8px',
                background: '#020617',
                color: '#a7f3d0',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontFamily: 'Consolas, monospace',
                fontSize: '11px',
                margin: '0'
            }, JSON.stringify({ estadoContexto: ctx.estadoInicial || {}, variaveisLegadasPad: this.dadosBase.variaveisPadrao || {} }, null, 2)));
            return area;
        }

        _wsRegras35(area, ctx) {
            const regras = Array.isArray(ctx.tabelaMenuMovimentos) ? ctx.tabelaMenuMovimentos : [];
            area.appendChild(dom('strong', { color: '#f8fafc', display: 'block', marginBottom: '6px' }, '📊 Matriz de Tarefas × Movimentos (' + regras.length + ' regras neste contexto)'));
            const t = dom('table', { width: '100%', borderCollapse: 'collapse', fontFamily: 'Consolas, monospace', fontSize: '11px' });
            const trH = dom('tr', { background: '#1e293b', color: '#38bdf8' });
            ['#', 'Tarefa Cadastrada', 'Movimento Sugerido', 'Autos', 'Tp1', 'Tp2', 'Hist'].forEach((h) => {
                trH.appendChild(dom('th', { textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #334155' }, h));
            });
            t.appendChild(trH);
            regras.forEach((r, i) => {
                const tr = dom('tr', { borderBottom: '1px solid #1e293b' });
                tr.appendChild(dom('td', { padding: '3px 6px', color: '#64748b' }, String(i + 1)));
                tr.appendChild(dom('td', { padding: '3px 6px', color: '#f8fafc' }, r.Tarefa_Cadastrada || '—'));
                tr.appendChild(dom('td', { padding: '3px 6px', color: '#a7f3d0' }, r.Movimento_Selecionado || '(Só Tarefa)'));
                tr.appendChild(dom('td', { padding: '3px 6px' }, r.VisualizarAutos ? '✓' : '·'));
                tr.appendChild(dom('td', { padding: '3px 6px' }, r.EtiquetaTarefaTp1 ? '✓' : '·'));
                tr.appendChild(dom('td', { padding: '3px 6px' }, r.EtiquetaTarefaTp2 ? '✓' : '·'));
                tr.appendChild(dom('td', { padding: '3px 6px' }, r.Historico ? '✓' : '·'));
                t.appendChild(tr);
            });
            area.appendChild(t);
            return area;
        }

        // =====================================================================
        // COMPONENTES COMPACTOS ESTILO IDE
        // =====================================================================
        _btnIde(txt, bg, cor, fn, desabilitado) {
            const b = dom('button', {
                padding: '3.5px 8px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: desabilitado ? '#1e293b' : bg,
                color: desabilitado ? '#64748b' : cor,
                fontSize: '11px',
                fontWeight: '600',
                cursor: desabilitado ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
            }, txt);
            b.type = 'button';
            b.disabled = Boolean(desabilitado);
            if (!desabilitado && fn) b.addEventListener('click', fn);
            return b;
        }

        _microBtn(txt, dica, desab, fn, corCustom) {
            const b = dom('button', {
                padding: '1px 5px',
                borderRadius: '3px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: desab ? '#334155' : (corCustom || '#cbd5e1'),
                fontFamily: 'Consolas, monospace',
                fontSize: '10.5px',
                cursor: desab ? 'default' : 'pointer'
            }, txt);
            b.type = 'button';
            b.disabled = Boolean(desab);
            if (dica) b.title = dica;
            if (!desab && fn) b.addEventListener('click', fn);
            return b;
        }

        _pill(txt, bg, cor) {
            return dom('span', {
                padding: '1px 6px',
                borderRadius: '999px',
                background: bg,
                color: cor,
                border: '1px solid #334155',
                fontSize: '10px',
                fontWeight: '700'
            }, txt);
        }

        _inputIde(rotulo, valor) {
            const wrap = dom('div');
            wrap.appendChild(dom('label', { display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }, rotulo));
            const input = dom('input', {
                width: '100%',
                padding: '3.5px 6px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#020617',
                color: '#f8fafc',
                fontSize: '11.5px',
                fontFamily: 'Consolas, monospace',
                boxSizing: 'border-box'
            });
            input.type = 'text';
            input.value = valor !== undefined && valor !== null ? String(valor) : '';
            wrap.appendChild(input);
            return { wrap, input };
        }

        _selectIde(rotulo, opcoes, valorAtual) {
            const wrap = dom('div');
            wrap.appendChild(dom('label', { display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }, rotulo));
            const select = dom('select', {
                width: '100%',
                padding: '3.5px 6px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#020617',
                color: '#f8fafc',
                fontSize: '11.5px',
                fontFamily: 'Consolas, monospace',
                boxSizing: 'border-box'
            });
            opcoes.forEach((op) => {
                const o = dom('option', null, op.rotulo);
                o.value = op.valor;
                if (String(op.valor) === String(valorAtual)) o.selected = true;
                select.appendChild(o);
            });
            wrap.appendChild(select);
            return { wrap, select };
        }
    }

    if (typeof window !== 'undefined') {
        window.JusGovOptionsAutomate = JusGovOptionsAutomate;
        const iniciar = () => {
            if (document.getElementById('containerAutomateComandosObjetos')) {
                window.__jusGovOptionsAutomate = new JusGovOptionsAutomate('containerAutomateComandosObjetos');
                window.__jusGovOptionsAutomate.inicializar();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', iniciar, { once: true });
        } else {
            iniciar();
        }
    }
})();