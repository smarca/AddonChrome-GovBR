/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-aviso-flutuante.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-aviso-flutuante.js
 * - Classe Exportada: MotorValidacao (window.JusGovAvisoFlutuante)
 * - Métodos Públicos: auditarEAlerta(textoCopiado, rangeSelecao, opcoesExtras), validarCPF(str), validarCNPJ(str), validarProcessoCNJ(str), validarPIS(str), validarBeneficioINSS(str), validarLinhaArrecadacaoTributos(str), validarBoletoBancario(str), validarDataCalendario(d, m, a), projetarMiniTipGlobal(msg, cor, duracao), ocultarTodosAvisosImediatamente(preservarMiniTip)
 * - Renderização DOM: Shadow DOM fechado (mode: 'closed') + Popover API Top Layer (#jusgov-popover-top-layer)
 * - Regras / Seções: Regra 2.4 (Auditoria Não-Bloqueante e Wiki Forense), Seção 6.30, Seção 6.60 (DARF/GRU/IPTU), Seção 6.64 (blindagem POO), Seção 6.71 (FEAT-07 Proxi-Mouse Tips)
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, falhas do
 *    framework alvo, isolamento Shadow DOM, Top Layer Popover API e prevencao
 *    de Layout Thrashing) e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo, permitindo recriar 100% do modulo do zero
 *    caso o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como ç, õ, é)
 *    no codigo ou em templates visuais; entidades HTML devem ser extirpadas,
 *    sendo admitidas exclusivamente dentro de mascaras regex ou parsers de HTML bruto.
 * 5) INTEGRIDADE FUNCIONAL E COPIA SILENCIOSA: Proibido simplificar a base de 6
 *    estagios, remover suporte a Ctrl/Alt/Shift, exibir popups de "Copiado!" em
 *    copias simples ou inserir anotacoes de versao (ChronoSemVer) nos cabecalhos.
 * 6) SINCRONIZACAO OBRIGATORIA DE BLUE PRINT E SANDBOX: Toda alteracao de regra
 *    de negocio, mascara ou validacao deve manter obrigatoriamente atualizados e
 *    sincronizados o Blue Print (especificacao documental interna nos cabecalhos
 *    e na Central de Ajuda) e o SandBox (area de Testes interativos em
 *    options.html e bateria automatizada em debug.js), garantindo paridade entre
 *    exemplos validos e invalidos para homologacao imediata.
 *
 * ==========================================================================
 * [ESPECIFICACAO FUNCIONAL E REGRAS DE NEGOCIO -- HELP BLUEPRINT PERPETUO]
 * (Espelho integral da Central de Ajuda / Options para reconstrucao mutua)
 *
 * 1. VALIDACAO MATEMATICA NAO-BLOQUEANTE (REGRA ABSOLUTA DE NEGOCIO):
 * - Em analises processuais no PJe e SEI!, e comum que peticoes ou certidoes
 *   contenham erros materiais de digitacao (ex: datas inexistentes como
 *   "29/02/2025", "31/04/2026" ou "31 de abril de 2026", CPFs/CNPJs com digito
 *   verificador incorreto ou numeros de processo CNJ com Modulo 97 invalido).
 * - Regra Inegociavel: A copia NUNCA e bloqueada. Mesmo que o dado seja
 *   matematicamente invalido, o texto e gravado normalmente na area de
 *   transferencia para nao interromper o fluxo de trabalho do magistrado/servidor.
 * - Feedback Visual Imediato (Fundo Amarelo por 3,5 segundos): Assim que um
 *   dado invalido e copiado, a selecao na tela recebe destaque amarelo e um
 *   cartao flutuante exibe o Tipo do Dado e a Causa Matematica Exata do Erro.
 *
 * 2. MINI-TIP DE ALTERNANCIA DE FORMATACAO (DUPLO ESC: "ESC" + "ESC"):
 * - Ao pressionar "Esc" duas vezes rapidamente, o sistema alterna em tempo real
 *   entre os modos "Remover Formatacoes (Somente Texto)" e "Manter Formatacoes
 *   Basicas (Negrito, Italico e Sublinhado)".
 * - O metodo projetarMiniTipGlobal() renderiza um badge flutuante discreto no
 *   topo central da janela (na Top Layer do Shadow DOM) informando o modo ativo.
 *
 * 3. ENGENHARIA DE RENDERIZACAO BLINK (SHADOW DOM FECHADO + TOP LAYER POPOVER):
 * - Isolamento CSS Estrito (ShadowRoot mode: 'closed'): O cartao de aviso, o
 *   mini-tip e a mascara de destaque amarelo sao encapsulados dentro de uma
 *   arvore Shadow DOM fechada, imune ao CSS do PJe.
 * - Promocao para a Top Layer Nativa (Popover API - popover="manual"): Renderiza
 *   diretamente na camada superior do navegador Blink, acima de qualquer z-index.
 * - Prevencao de Layout Thrashing (Reflow Zero): As coordenadas geometricas
 *   (range.getBoundingClientRect()) sao lidas integralmente ANTES de qualquer
 *   mutacao de estilo ou insercao no DOM.
 * ========================================================================== */

(function() {
    'use strict';

    /* Passo 1.1: Guarda de idempotencia global para evitar redeclaracao da classe
     * caso o Service Worker execute injecao multipla na mesma aba ou frame. */
    if (window.__JUSGOV_AVISO_FLUTUANTE_CARREGADO__ && typeof window.JusGovAvisoFlutuante === 'function') {
        return;
    }
    window.__JUSGOV_AVISO_FLUTUANTE_CARREGADO__ = true;

    /* A REGEX_AUDITORIA pre-compilada foi migrada e sera lida via
     * window.JusGovConstantes.REGEX_AUDITORIA garantindo o isolamento (DRY). */

    const escaparTextoHtml = (str) => (typeof self !== 'undefined' && self.JusGovConstantes && typeof self.JusGovConstantes.escaparTextoHtml === 'function')
        ? self.JusGovConstantes.escaparTextoHtml(str)
        : String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
    // =====================================================================
    // CLASSE PRINCIPAL: MOTOR DE VALIDACAO MATEMATICA E AVISO FLUTUANTE
    // =====================================================================
    class MotorValidacao {
        _p_uiTela = null;

        _p_obterUiTela() {
            if (this._p_uiTela) return this._p_uiTela;
            try {
                if (typeof window !== 'undefined' && typeof window.JusGovLibUiTela === 'function') {
                    this._p_uiTela = new window.JusGovLibUiTela();
                    return this._p_uiTela;
                }
            } catch (_) { }
            return null;
        }
        constructor(opcoes = {}) {
            /* Passo 1.2: Inicializar 100% das propriedades no construtor com tipos
             * previsiveis para preservar Hidden Classes (Shapes) monomorficas no
             * otimizador JIT TurboFan do motor Chrome V8. */
            this.temporizadorAlerta = null;
            this.temporizadorMiniTip = null;
            this.estiloSelecaoInjetado = null;
            this.hospedeiroShadow = null;
            this.raizShadow = null;
            this.elementoCartaoAviso = null;
            this.elementoDestaqueAmarelo = null;
            this.elementoMiniTipGlobal = null;
            this.tempoExibicaoMs = -1;
            this.tempoConferenciaDocumentosMs = -1;
            this.modoExibicaoValidacao = 'sempre';
            this.posicaoAvisosValidacao = (opcoes && opcoes.posicaoAvisosValidacao === 'acima') ? 'acima' : 'abaixo';
            this.avisoVisivel = false;
            this.timestampCriacaoAviso = 0;
            this.timestampCriacaoMiniTip = 0;
            this.ultimoPontoInteracao = null;
            this.rangeAtivoAlerta = null;
            this.destacarSelecaoAmarelaAtiva = false;
            this.limparOuvintesInteracaoAlerta = null;
            this.limparOuvinteScrollAlerta = null;
            this.limparOuvintesInteracaoMiniTip = null;
            const FabricaVerificadores = (typeof self !== 'undefined' && self.JusGovVerificadores) || (typeof window !== 'undefined' && window.JusGovVerificadores) || null;
            this.verificadores = FabricaVerificadores ? new FabricaVerificadores() : null;
        }

        /*
         * METODO: registrarPontoInteracaoMouse
         * OBJETIVO: Armazenar a ultima posicao (clientX, clientY) do mouse para auxiliar
         * no posicionamento inteligente fora da selecao e fora do contorno Flash.
         */
        registrarPontoInteracaoMouse(x, y) {
            if (Number.isFinite(x) && Number.isFinite(y)) {
                this.ultimoPontoInteracao = { x: x | 0, y: y | 0 };
            }
        }

        /*
         * METODO: estaAvisoVisivel
         * OBJETIVO: Indicar sincronicamente se ha qualquer popup de auditoria (erro Mod 11/97,
         * CPF/CNPJ/CNJ/INSS/Data invalida), balao de Wiki Forense (especie INSS, regiao CPF,
         * Matriz/Filial CNPJ, justica CNJ, dia da semana) ou minitip ativo na tela.
         */
        estaAvisoVisivel() {
            return Boolean(
                this.avisoVisivel ||
                this.temporizadorAlerta !== null ||
                this.temporizadorMiniTip !== null ||
                (this.elementoCartaoAviso && this.elementoCartaoAviso.style.display !== 'none') ||
                (this.elementoDestaqueAmarelo && this.elementoDestaqueAmarelo.style.display !== 'none') ||
                (this.elementoMiniTipGlobal && this.elementoMiniTipGlobal.style.display !== 'none')
            );
        }

        /*
         * METODO: definirTempoExibicao
         * OBJETIVO DE RECONSTRUCAO: Permitir configurar a duracao em milissegundos
         * dos avisos informativos globais na tela (MiniTip de formatação, resumos de tabelas, etc.).
         */
        definirTempoExibicao(ms) {
            /* Passo 1.3: Validar faixa segura (-1 = Até Interação (Padrão), 0 = Desabilitado, ou 1000ms a 10000ms) mantendo tipo SMI inteiro */
            const num = Number(ms);
            if (!Number.isFinite(num)) {
                this.tempoExibicaoMs = -1;
                return;
            }
            const valor = num | 0;
            if (valor === -1) {
                this.tempoExibicaoMs = -1;
            } else if (valor === 0) {
                this.tempoExibicaoMs = 0;
            } else if (valor >= 1000 && valor <= 10000) {
                this.tempoExibicaoMs = valor;
            } else {
                this.tempoExibicaoMs = -1;
            }
        }

        /*
         * METODO: definirTempoConferenciaDocumentos (FEAT-23 / USAB-12 - Seção 6.112)
         * OBJETIVO: Configurar de forma independente a duração (ou desativação = 0)
         * do popup de "Conferência Automática de Documentos e Datas (CPF, CNPJ, Processo e Datas)".
         */
        definirTempoConferenciaDocumentos(ms) {
            const num = Number(ms);
            if (!Number.isFinite(num)) {
                this.tempoConferenciaDocumentosMs = -1;
                this.validacaoAtiva = true;
                return;
            }
            const valor = num | 0;
            if (valor === -1) {
                this.tempoConferenciaDocumentosMs = -1;
                this.validacaoAtiva = true;
            } else if (valor === 0) {
                this.tempoConferenciaDocumentosMs = 0;
                this.validacaoAtiva = false;
                this.limparAlertaVisual();
            } else if (valor >= 1 && valor <= 5) {
                this.tempoConferenciaDocumentosMs = valor * 1000;
                this.validacaoAtiva = true;
            } else if (valor === 6) {
                this.tempoConferenciaDocumentosMs = -1;
                this.validacaoAtiva = true;
            } else if (valor >= 1000 && valor <= 10000) {
                this.tempoConferenciaDocumentosMs = valor;
                this.validacaoAtiva = true;
            } else {
                this.tempoConferenciaDocumentosMs = -1;
                this.validacaoAtiva = true;
            }
        }

        obterTempoConferenciaDocumentos() {
            return this.tempoConferenciaDocumentosMs;
        }

        /*
         * METODO: definirModoExibicaoValidacao
         * Permite alternar entre 'apenas_erros' (exibe balão apenas em falha de validação)
         * e 'sempre' (exibe tanto erros quanto balões/wikis de confirmação de válidos).
         */
        definirModoExibicaoValidacao(modo) {
            this.modoExibicaoValidacao = (modo === 'apenas_erros') ? 'apenas_erros' : 'sempre';
        }

        /*
         * METODO: definirPosicaoAvisosValidacao
         * Permite configurar a orientação padrão dos popups ('abaixo' [Padrão] ou 'acima')
         * com fallback automático caso saia da área exibível da janela.
         */
        definirPosicaoAvisosValidacao(posicao) {
            this.posicaoAvisosValidacao = (posicao === 'acima') ? 'acima' : 'abaixo';
        }

        /* Métodos matemáticos delegados integralmente a JusGovVerificadores (src/lib/lib-verificadores.js — Fonte Única DRY) */
        validarBissexto(ano) { return this.verificadores ? this.verificadores.validarBissexto(ano) : false; }
        validarData(dataStr) { return this.verificadores ? this.verificadores.validarData(dataStr) : { valido: true, tipo: 'DATA', msg: '' }; }
        validarHorario(horarioStr) { return this.verificadores ? this.verificadores.validarHorario(horarioStr) : { valido: true, tipo: 'HORARIO', msg: '' }; }
        validarCPF(cpfStr) { return this.verificadores ? this.verificadores.validarCPF(cpfStr) : { valido: true, tipo: 'CPF', msg: '' }; }
        calcularMatrizDeCNPJ(cnpjStr) { return this.verificadores ? this.verificadores.calcularMatrizDeCNPJ(cnpjStr) : { valido: false }; }
        validarCNPJ(cnpjStr) { return this.verificadores ? this.verificadores.validarCNPJ(cnpjStr) : { valido: true, tipo: 'CNPJ', msg: '' }; }
        validarCNJ(cnjStr) { return this.verificadores ? this.verificadores.validarCNJ(cnjStr) : { valido: true, tipo: 'PROCESSO CNJ', msg: '' }; }
        validarNumeroBeneficioINSS(beneficioStr, especieHint = null) { return this.verificadores ? this.verificadores.validarNumeroBeneficioINSS(beneficioStr, especieHint) : { valido: true, tipo: 'NB INSS', msg: '' }; }
        validarPIS(pisStr) { return this.verificadores ? this.verificadores.validarPIS(pisStr) : { valido: true, tipo: 'PIS/PASEP', msg: '' }; }
        validarLinhaArrecadacaoTributos(linhaStr) { return this.verificadores ? this.verificadores.validarLinhaArrecadacaoTributos(linhaStr) : { valido: true, tipo: 'ARRECADACAO', msg: '' }; }
        validarBoletoBancario(linhaStr) { return this.verificadores ? this.verificadores.validarBoletoBancario(linhaStr) : { valido: true, tipo: 'BOLETO', msg: '' }; }
        validarNumeroGenericoFallback(texto) { return this.verificadores ? this.verificadores.validarNumeroGenericoFallback(texto) : { valido: true, msg: '' }; }

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

        /*
         * METODO: garantirEstruturaShadowPopover
         * OBJETIVO DE RECONSTRUCAO: Instanciar um hospedeiro no documento HTML raiz com ShadowRoot fechado
         * (mode: 'closed') e atributo popover="manual" para top layer sem Reflow.
         */
        garantirEstruturaShadowPopover() {
            const docUi = this._p_obterContextoRaizUi().docUi || (typeof document !== 'undefined' ? document : null);
            if (!docUi || !docUi.body) return;

            /* Passo 6.1: Reutilizar estrutura existente se ja estiver conectada no documento raiz */
            if (this.hospedeiroShadow && docUi.body.contains(this.hospedeiroShadow)) {
                return;
            }

            /* Passo 6.2: Criar elemento hospedeiro com atributo data-jusgov-ignore */
            const host = docUi.createElement('div');
            host.id = 'jusgov-hospedeiro-top-layer';
            host.setAttribute('data-jusgov-ignore', 'true');
            if ('popover' in HTMLElement.prototype) {
                host.setAttribute('popover', 'manual');
            }
            host.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;width:0;height:0;border:none;padding:0;margin:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483647 !important;';

            /* Passo 6.3: Anexar arvore Shadow DOM fechada e injetar CSS encapsulado */
            const shadow = host.attachShadow({ mode: 'closed' });
            const style = docUi.createElement('style');
            style.textContent = `
                .cartao-aviso {
                    position: fixed;
                    z-index: 2147483647;
                    background: #fef08a;
                    color: #9a3412;
                    border: 1px solid #f59e0b;
                    padding: 6px 12px;
                    font-size: 12px;
                    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
                    pointer-events: auto;
                    user-select: none;
                    white-space: normal;
                    line-height: 1.35;
                    max-width: 380px;
                    min-width: 180px;
                    display: none;
                }
                .destaque-amarelo {
                    position: fixed;
                    z-index: 2147483646;
                    background: rgba(250, 204, 21, 0.35);
                    border-bottom: 2px solid #d97706;
                    border-radius: 3px;
                    pointer-events: none;
                    user-select: none;
                    display: none;
                }
                .minitip-global {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2147483647;
                    background: #1e293b;
                    color: #f8fafc;
                    border: 1px solid #3b82f6;
                    padding: 7px 14px;
                    font-size: 12.5px;
                    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
                    font-weight: 700;
                    border-radius: 8px;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
                    pointer-events: auto;
                    user-select: none;
                    white-space: pre-line;
                    text-align: center;
                    line-height: 1.35;
                    display: none;
                }
            `;

            /* Passo 6.4: Criar elementos internos */
            const destaque = docUi.createElement('div');
            destaque.className = 'destaque-amarelo';
            destaque.style.display = 'none';

            const cartao = docUi.createElement('div');
            cartao.className = 'cartao-aviso';
            cartao.style.display = 'none';

            const miniTip = docUi.createElement('div');
            miniTip.className = 'minitip-global';
            miniTip.style.display = 'none';

            shadow.appendChild(style);
            shadow.appendChild(destaque);
            shadow.appendChild(cartao);
            shadow.appendChild(miniTip);
            docUi.body.appendChild(host);

            this.hospedeiroShadow = host;
            this.raizShadow = shadow;
            this.elementoCartaoAviso = cartao;
            this.elementoDestaqueAmarelo = destaque;
            this.elementoMiniTipGlobal = miniTip;
        }

        /*
         * METODO: limparAlertaVisual
         */
        limparAlertaVisual() {
            this.removerOuvinteInteracaoParaAlerta();
            this.removerOuvinteScrollAlerta();
            this.rangeAtivoAlerta = null;
            this.destacarSelecaoAmarelaAtiva = false;
            /* Passo 6.5: Cancelar timers */
            if (this.temporizadorAlerta) {
                clearTimeout(this.temporizadorAlerta);
                this.temporizadorAlerta = null;
            }

            /* Passo 6.6: Ocultar elementos */
            if (this.elementoCartaoAviso) {
                this.elementoCartaoAviso.style.display = 'none';
            }
            if (this.elementoDestaqueAmarelo) {
                this.elementoDestaqueAmarelo.style.display = 'none';
            }
            const miniTipAtivo = Boolean(this.elementoMiniTipGlobal && this.elementoMiniTipGlobal.style.display === 'block');
            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                if (!miniTipAtivo) {
                    try {
                        this.hospedeiroShadow.hidePopover();
                    } catch (_) {}
                }
            }

            /* Passo 6.7: Remover mascara amarela */
            if (this.estiloSelecaoInjetado && this.estiloSelecaoInjetado.parentNode) {
                this.estiloSelecaoInjetado.parentNode.removeChild(this.estiloSelecaoInjetado);
                this.estiloSelecaoInjetado = null;
            }
            if (!miniTipAtivo) {
                this.avisoVisivel = false;
            }
        }

        /*
         * METODO: ocultarTodosAvisosImediatamente
         * OBJETIVO: Fechar imediatamente todos os popups de checagem/auditoria (calculo Mod falhou,
         * CPF/CNPJ/CNJ/NB/Data invalido), destaques amarelos, baloes Wiki/instrucao (tipo de
         * aposentadoria/beneficio, regiao fiscal do CPF, Matriz/Filial CNPJ, ramo CNJ, dia da semana)
         * e minitips globais quando o usuario clica com o mouse ou desseleciona o texto.
         */
        ocultarTodosAvisosImediatamente(preservarMiniTip = false) {
            this.removerOuvinteInteracaoParaAlerta();
            this.removerOuvinteScrollAlerta();
            this.rangeAtivoAlerta = null;
            this.destacarSelecaoAmarelaAtiva = false;
            if (this.temporizadorAlerta) {
                clearTimeout(this.temporizadorAlerta);
                this.temporizadorAlerta = null;
            }
            if (!preservarMiniTip) {
                this.removerOuvinteInteracaoParaMiniTip();
                if (this.temporizadorMiniTip) {
                    clearTimeout(this.temporizadorMiniTip);
                    this.temporizadorMiniTip = null;
                }
                if (this.elementoMiniTipGlobal) {
                    this.elementoMiniTipGlobal.style.display = 'none';
                }
            }
            if (this.elementoCartaoAviso) {
                this.elementoCartaoAviso.style.display = 'none';
            }
            if (this.elementoDestaqueAmarelo) {
                this.elementoDestaqueAmarelo.style.display = 'none';
            }
            const miniTipAindaAtivo = Boolean(
                preservarMiniTip &&
                this.elementoMiniTipGlobal &&
                this.elementoMiniTipGlobal.style.display !== 'none'
            );
            if (!miniTipAindaAtivo && this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                try {
                    this.hospedeiroShadow.hidePopover();
                } catch (_) {}
            }
            if (this.estiloSelecaoInjetado && this.estiloSelecaoInjetado.parentNode) {
                this.estiloSelecaoInjetado.parentNode.removeChild(this.estiloSelecaoInjetado);
                this.estiloSelecaoInjetado = null;
            }
            try {
                const styleOrfao = document.getElementById('jusgov-style-selecao-amarela');
                if (styleOrfao && styleOrfao.parentNode) {
                    styleOrfao.parentNode.removeChild(styleOrfao);
                }
            } catch (_) {}
            this.avisoVisivel = miniTipAindaAtivo;
        }

        /*
         * METODO: registrarOuvinteInteracaoParaAlerta / removerOuvinteInteracaoParaAlerta
         * Implementa a opção "Até Interação (Padrão)" (-1) para a Conferência Automática (Seção 6.112 / FEAT-23):
         * Mantém o aviso ancorado ao início do texto (rolando junto com a página) e fecha apenas quando ocorrer:
         * 1) Hover sobre o popup gerado pela Conferência Automática após 1 segundo (1000ms);
         * 2) Pressionamento de teclas (keydown, ignorando Insert para preservar Ins+Ins - BUG-47);
         * 3) Clique do mouse em qualquer lugar da página (mousedown).
         */
        registrarOuvinteInteracaoParaAlerta() {
            this.removerOuvinteInteracaoParaAlerta();

            const timestampInicio = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            const CARENCIA_HOVER_MS = 1000;

            const tratarKeyDown = (e) => {
                if (!e) return;
                const tecla = (e.key || '').toLowerCase();
                if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'capslock') {
                    return;
                }
                // Ignora a tecla Insert para não conflitar com o duplo clique do atalho Ins + Ins (Caixa Rápida - BUG-47)
                if (tecla === 'insert' || e.keyCode === 45) {
                    return;
                }
                this.limparAlertaVisual();
            };

            const tratarMouseDown = (e) => {
                if (!e) return;
                this.limparAlertaVisual();
            };

            // Lógica de Hover sobre o balão de mensagem com carência estrita de 1s (1000ms)
            const tratarHoverCartao = () => {
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                if ((agora - timestampInicio) >= CARENCIA_HOVER_MS) {
                    this.limparAlertaVisual();
                }
            };

            /* Verificação adicional de coordenadas no mousemove global caso o cursor passe sobre o retângulo do cartão após 1s */
            const ctxUi = this._p_obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const tratarMouseMoveGlobalHover = (e) => {
                if (!e || !this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') return;
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                if ((agora - timestampInicio) < CARENCIA_HOVER_MS) return;
                const r = this.elementoCartaoAviso.getBoundingClientRect();
                if (r && r.width > 0 && r.height > 0) {
                    const mesmoTop = (!e.view || e.view === winUi);
                    const evX = e.clientX + (mesmoTop ? 0 : ctxUi.offsetX);
                    const evY = e.clientY + (mesmoTop ? 0 : ctxUi.offsetY);
                    if (evX >= r.left && evX <= r.right && evY >= r.top && evY <= r.bottom) {
                        this.limparAlertaVisual();
                    }
                }
            };

            const opts = { capture: true, passive: true };
            window.addEventListener('keydown', tratarKeyDown, opts);
            document.addEventListener('keydown', tratarKeyDown, opts);
            window.addEventListener('mousedown', tratarMouseDown, opts);
            document.addEventListener('mousedown', tratarMouseDown, opts);
            window.addEventListener('mousemove', tratarMouseMoveGlobalHover, opts);
            if (winUi !== window) {
                winUi.addEventListener('keydown', tratarKeyDown, opts);
                winUi.addEventListener('mousedown', tratarMouseDown, opts);
                winUi.addEventListener('mousemove', tratarMouseMoveGlobalHover, opts);
            }
            if (docUi !== document) {
                docUi.addEventListener('keydown', tratarKeyDown, opts);
                docUi.addEventListener('mousedown', tratarMouseDown, opts);
            }

            if (this.elementoCartaoAviso) {
                this.elementoCartaoAviso.addEventListener('mouseenter', tratarHoverCartao, { passive: true });
                this.elementoCartaoAviso.addEventListener('mousemove', tratarHoverCartao, { passive: true });
            }

            this.limparOuvintesInteracaoAlerta = () => {
                window.removeEventListener('keydown', tratarKeyDown, opts);
                document.removeEventListener('keydown', tratarKeyDown, opts);
                window.removeEventListener('mousedown', tratarMouseDown, opts);
                document.removeEventListener('mousedown', tratarMouseDown, opts);
                window.removeEventListener('mousemove', tratarMouseMoveGlobalHover, opts);
                if (winUi !== window) {
                    winUi.removeEventListener('keydown', tratarKeyDown, opts);
                    winUi.removeEventListener('mousedown', tratarMouseDown, opts);
                    winUi.removeEventListener('mousemove', tratarMouseMoveGlobalHover, opts);
                }
                if (docUi !== document) {
                    docUi.removeEventListener('keydown', tratarKeyDown, opts);
                    docUi.removeEventListener('mousedown', tratarMouseDown, opts);
                }
                if (this.elementoCartaoAviso) {
                    this.elementoCartaoAviso.removeEventListener('mouseenter', tratarHoverCartao);
                    this.elementoCartaoAviso.removeEventListener('mousemove', tratarHoverCartao);
                }
                this.limparOuvintesInteracaoAlerta = null;
            };
        }

        removerOuvinteInteracaoParaAlerta() {
            if (typeof this.limparOuvintesInteracaoAlerta === 'function') {
                this.limparOuvintesInteracaoAlerta();
            }
        }

    }

    /* Passo 8.1: Exportar a classe globalmente blindada com Object.freeze */
        const _ext_MotorValidacao = [
        { g: 'JusGovCopiaAvisoAuditoria', p: './copia-aviso-auditoria.js' },
        { g: 'JusGovCopiaAvisoRender', p: './copia-aviso-render.js' }
    ];
    for (let i = 0; i < _ext_MotorValidacao.length; i++) {
        const it = _ext_MotorValidacao[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(MotorValidacao.prototype);
        }
    }

    Object.freeze(MotorValidacao.prototype);
    window.JusGovAvisoFlutuante = Object.freeze(MotorValidacao);
    window.JusGovCopiaAvisoFlutuante = window.JusGovAvisoFlutuante;
})();

