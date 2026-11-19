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
        #uiTela = null;

        #obterUiTela() {
            if (this.#uiTela) return this.#uiTela;
            try {
                if (typeof window !== 'undefined' && typeof window.JusGovLibUiTela === 'function') {
                    this.#uiTela = new window.JusGovLibUiTela();
                    return this.#uiTela;
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

        /*
         * METODO: garantirEstruturaShadowPopover
         * OBJETIVO DE RECONSTRUCAO: Instanciar um hospedeiro no documento HTML raiz com ShadowRoot fechado
         * (mode: 'closed') e atributo popover="manual" para top layer sem Reflow.
         */
        garantirEstruturaShadowPopover() {
            const docUi = this.#obterContextoRaizUi().docUi || (typeof document !== 'undefined' ? document : null);
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
         * METODO: auditarEAlerta
         */
        auditarEAlerta(texto, rangeDOM, opcoesExtras = {}) {
            /* Passo 7.1: Validar entrada */
            if (!texto || typeof texto !== 'string') {
                return { valido: true, msg: '' };
            }
            let t = texto.trim();
            const textoRangeDOM = (rangeDOM && typeof rangeDOM.toString === 'function') ? rangeDOM.toString().trim() : '';
            let textoSobrescritoEfetivo = (opcoesExtras && (opcoesExtras.textoSobrescrito || opcoesExtras.textoExibicao))
                ? String(opcoesExtras.textoSobrescrito || opcoesExtras.textoExibicao).trim()
                : null;

            /* Se o texto passado estiver sem pontuação (ex: dígitos puros), mas o Range no DOM contiver o dado pontuado original */
            if (!textoSobrescritoEfetivo && textoRangeDOM && textoRangeDOM !== t) {
                const digitosT = t.replace(/\D/g, '');
                const digitosRange = textoRangeDOM.replace(/\D/g, '');
                if (digitosT.length > 0 && digitosT === digitosRange) {
                    textoSobrescritoEfetivo = t;
                    t = textoRangeDOM;
                }
            }

            let resultado = { valido: true, msg: '' };

            /* Passo 7.2: Testar correspondencia usando Constantes GLOBAIS */
            const matchDataHora = t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_NUMERICA_COM_HORARIO_AUDITORIA);
            const matchDataIso = !matchDataHora ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_ISOLADA) : null;
            const matchDataExt = (!matchDataHora && !matchDataIso) ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV) : null;
            const matchDataIsoAno = (!matchDataHora && !matchDataIso && !matchDataExt)
                ? t.match(/^(?:data\s*[:\-]?\s*)?(\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}(?:[\sT]\d{1,2}:\d{2}(?::\d{2})?)?)$/i)
                : null;
            const matchHorarioIso = (!matchDataHora && !matchDataIso && !matchDataExt && !matchDataIsoAno) ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.HORARIO_ISOLADO) : null;
            const matchInssEsp = t.match(window.JusGovConstantes.REGEX_AUDITORIA.BENEFICIO_INSS_COM_ESPECIE);
            const matchInssIso = !matchInssEsp ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.BENEFICIO_INSS_ISOLADO) : null;
            const matchCpfIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CPF_ISOLADO);
            const matchCnpjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNPJ_ISOLADO);
            const matchCnjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNJ_ISOLADO);
            const matchPisIso = (window.JusGovConstantes.REGEX_AUDITORIA.PIS_ISOLADO)
                ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.PIS_ISOLADO)
                : null;

            if (matchDataHora) {
                /* Valida tanto a Data quanto o Horario */
                const resData = this.validarData(matchDataHora[1]);
                if (!resData.valido) {
                    resultado = resData;
                } else {
                    const resHora = this.validarHorario(matchDataHora[2]);
                    if (!resHora.valido) {
                        resultado = resHora;
                    } else {
                        const ehFimDeSemana = Boolean(resData.ehFimDeSemana);
                        const diaSemana = resData.diaSemana || '';
                        const sufixoFuturo = (resData && resData.ehDataFutura) ? ' - Data Futura' : '';
                        const subDataHora = `${resData.subtitulo || (diaSemana + (ehFimDeSemana ? ` (Final de Semana${sufixoFuturo})` : ` (Dia Útil${sufixoFuturo})`))} • Horário: ${matchDataHora[2]}h`;
                        resultado = this.verificadores && typeof this.verificadores.formatarRespostaWiki === 'function'
                            ? this.verificadores.formatarRespostaWiki(
                                'Data e Horário',
                                diaSemana,
                                t,
                                subDataHora,
                                {
                                    ...((resData && resData.detalhes) || {}),
                                    horario: matchDataHora[2],
                                    ehFimDeSemana: ehFimDeSemana,
                                    diaSemana: diaSemana,
                                    ehDataFutura: Boolean(resData && resData.ehDataFutura)
                                }
                            )
                            : { valido: true, categoria: 'Data e Horário', msg: subDataHora };
                    }
                }
            } else if (matchDataIso) {
                resultado = this.validarData(matchDataIso[1]);
            } else if (matchDataExt) {
                resultado = this.validarData(t);
            } else if (matchDataIsoAno) {
                resultado = this.validarData(matchDataIsoAno[1]);
            } else if (matchHorarioIso) {
                resultado = this.validarHorario(matchHorarioIso[1]);
            } else if (matchInssEsp) {
                resultado = this.validarNumeroBeneficioINSS(matchInssEsp[2], matchInssEsp[1]);
            } else if (matchInssIso) {
                resultado = this.validarNumeroBeneficioINSS(matchInssIso[1] || matchInssIso[2], null);
            } else if (matchCpfIso) {
                resultado = this.validarCPF(matchCpfIso[1]);
            } else if (matchCnpjIso) {
                resultado = this.validarCNPJ(matchCnpjIso[1]);
            } else if (matchCnjIso) {
                resultado = this.validarCNJ(matchCnjIso[1]);
            } else if (matchPisIso) {
                resultado = this.validarPIS(matchPisIso[1] || matchPisIso[2]);
            } else if (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_ARRECADACAO_ISOLADO && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_ARRECADACAO_ISOLADO.test(t)) {
                resultado = this.validarLinhaArrecadacaoTributos(t);
            } else if (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_BANCARIO_ISOLADO && window.JusGovConstantes.REGEX_AUDITORIA.BOLETO_BANCARIO_ISOLADO.test(t)) {
                resultado = this.validarBoletoBancario(t);
            } else {
                /* Verificar se eh linha digitavel de 48 ou 47 digitos sem pontuacao estrita */
                const digitosPuros = t.replace(/\D/g, '');
                if (digitosPuros.length === 48 && digitosPuros[0] === '8') {
                    resultado = this.validarLinhaArrecadacaoTributos(t);
                } else if (digitosPuros.length === 47 && (digitosPuros.startsWith('0019') || t.includes('.'))) {
                    resultado = this.validarBoletoBancario(t);
                }

                /* Verificar se eh NB de 10 digitos precedido por especie no DOM ou pontuado (ex: 31/6506589241) */
                if (resultado.valido && !resultado.ehWiki) {
                    let especiePrefixo = null;
                    if (rangeDOM && rangeDOM.startContainer && rangeDOM.startContainer.nodeType === 3) {
                        const textoNo = rangeDOM.startContainer.textContent || '';
                        const offset = rangeDOM.startOffset;
                        const trechoAntes = textoNo.substring(Math.max(0, offset - 5), offset);
                        const mEsp = trechoAntes.match(/(\d{2})\/$/);
                        if (mEsp) {
                            especiePrefixo = mEsp[1];
                        }
                    }
                    if ((especiePrefixo && digitosPuros.length === 10) || (/^\d{3}\.\d{3}\.\d{3}-\d$/.test(t))) {
                        resultado = this.validarNumeroBeneficioINSS(t, especiePrefixo);
                    }
                }

                /* ULTIMA BARREIRA: Se nao foi identificado por nenhuma mascara especifica com contexto,
                 * executa a validacao matematica generica fallback (FEAT-03 / Diretriz 6.42).
                 * Se validado, exibe cartao cinza neutro; se nao validado, silêncio absoluto. */
                if (resultado.valido && !resultado.ehWiki) {
                    const resGenerico = this.validarNumeroGenericoFallback(t);
                    if (resGenerico && resGenerico.ehGenericoCinza) {
                        resultado = resGenerico;
                    }
                }
            }

            /* Passo 7.2.9: Ajuste de exibição sem pontuação (Shift + Clique em bloco / cópia desformatada)
             * O número exibido no cabeçalho do cartão deve refletir o formato sem pontuação copiado,
             * mantendo estritamente todo o restante: tipo de documento, ícone (✓/✗), wiki, espécie e motivos de erro. */
            if (textoSobrescritoEfetivo && textoSobrescritoEfetivo.length > 0 && (resultado.ehWiki || !resultado.valido)) {
                const dadoOriginal = resultado.dado || t;
                resultado.dado = textoSobrescritoEfetivo;
                if (typeof resultado.html === 'string') {
                    resultado.html = resultado.html.replace(
                        /<u style="text-decoration:underline;font-weight:700;">[^<]*<\/u>/i,
                        `<u style="text-decoration:underline;font-weight:700;">${escaparTextoHtml(textoSobrescritoEfetivo)}</u>`
                    );
                }
                if (typeof resultado.msg === 'string' && dadoOriginal) {
                    resultado.msg = resultado.msg.replace(dadoOriginal, textoSobrescritoEfetivo);
                }
                if (resultado.detalhes && typeof resultado.detalhes === 'object') {
                    resultado.detalhes.digitos = textoSobrescritoEfetivo;
                }
            }

            /* Passo 7.3: Projetar alerta se invalido ou cartao informativo se Wiki Forense (respeitando tempoConferenciaDocumentosMs - Seção 6.112) */
            if (this.tempoConferenciaDocumentosMs !== 0) {
                if (!resultado.valido && rangeDOM) {
                    this.projetarAlertaVisual(rangeDOM, resultado, true);
                } else if (resultado.ehWiki && rangeDOM && this.modoExibicaoValidacao !== 'apenas_erros') {
                    this.projetarAlertaVisual(rangeDOM, resultado, false);
                }
            }

            return resultado;
        }

        /*
         * METODO: auditarTrechoSelecionado
         * OBJETIVO DE RECONSTRUCAO: Auditar trecho textual sem projetar alerta visual
         * na tela, retornando o objeto de erro caso invalido ou null se valido/neutro.
         */
        auditarTrechoSelecionado(texto) {
            const res = this.auditarEAlerta(texto, null);
            return (res && !res.valido) ? res : null;
        }

        /*
         * METODO: atualizarPosicaoAlertaSobRolagem (USAB-14 / POS-01 - Seção 6.115)
         * OBJETIVO: Recalcular em tempo real as coordenadas do balão de verificação (.cartao-aviso)
         * e do destaque amarelo para que permaneçam ancorados ao início do texto selecionado
         * e rolem solidariamente junto com a página ou contêiner.
         */
        atualizarPosicaoAlertaSobRolagem() {
            if (!this.avisoVisivel || !this.rangeAtivoAlerta || !this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') {
                return;
            }
            const range = this.rangeAtivoAlerta;
            let rect = null;
            try {
                rect = range.getBoundingClientRect();
                if (!rect || (rect.width === 0 && rect.height === 0)) {
                    const rectsLista = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                    if (rectsLista && rectsLista.length > 0) rect = rectsLista[0];
                }
            } catch (_) {}
            if (!rect || (rect.width === 0 && rect.height === 0)) return;

            const ctxUi = this.#obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const ox = ctxUi.offsetX;
            const oy = ctxUi.offsetY;

            const FOLGA_CONTORNO_FLASH = 1;
            let boxTop = rect.top + oy;
            let boxBottom = rect.bottom + oy;
            let boxLeft = rect.left + ox;
            let boxRight = rect.right + ox;
            let refLeftFirst = rect.left + ox;

            try {
                const clientRects = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                if (clientRects && clientRects.length > 0) {
                    let minT = Infinity;
                    let maxB = -Infinity;
                    let minL = Infinity;
                    let maxR = -Infinity;
                    for (let i = 0; i < clientRects.length; i++) {
                        const r = clientRects[i];
                        if (!r || (r.width < 0.5 && r.height < 0.5)) continue;
                        if (r.top < minT) {
                            minT = r.top;
                            refLeftFirst = r.left + ox;
                        }
                        if (r.bottom > maxB) maxB = r.bottom;
                        if (r.left < minL) minL = r.left;
                        if (r.right > maxR) maxR = r.right;
                    }
                    if (Number.isFinite(minT) && Number.isFinite(maxB)) {
                        boxTop = minT + oy;
                        boxBottom = maxB + oy;
                        boxLeft = minL + ox;
                        boxRight = maxR + ox;
                    }
                }
            } catch (_) {}

            if (this.destacarSelecaoAmarelaAtiva && this.elementoDestaqueAmarelo) {
                this.elementoDestaqueAmarelo.style.top = `${rect.top + oy - 1}px`;
                this.elementoDestaqueAmarelo.style.left = `${rect.left + ox - 1}px`;
                this.elementoDestaqueAmarelo.style.width = `${rect.width + 2}px`;
                this.elementoDestaqueAmarelo.style.height = `${rect.height + 2}px`;
            }

            const rectCartaoMedido = this.elementoCartaoAviso.getBoundingClientRect();
            const larguraCartao = (rectCartaoMedido && rectCartaoMedido.width > 0) ? Math.ceil(rectCartaoMedido.width) : 230;
            const alturaFinalCartao = (rectCartaoMedido && rectCartaoMedido.height > 0) ? Math.ceil(rectCartaoMedido.height) : 46;

            const vw = Math.max(winUi.innerWidth || 0, docUi.documentElement ? docUi.documentElement.clientWidth : 0, 320);
            const vh = Math.max(winUi.innerHeight || 0, docUi.documentElement ? docUi.documentElement.clientHeight : 0, 240);
            const MARGEM_JANELA = 8;
            const DISTANCIA_SEGURANCA_ABAIXO = 4;
            const DISTANCIA_SEGURANCA_SUPERIOR = 2;

            const refLeft = Number.isFinite(refLeftFirst)
                ? refLeftFirst
                : (Number.isFinite(boxLeft) ? boxLeft : MARGEM_JANELA);
            const leftPos = Math.max(MARGEM_JANELA, Math.min(refLeft, vw - larguraCartao - MARGEM_JANELA));

            const limiteSuperiorProibido = boxTop - FOLGA_CONTORNO_FLASH;
            const limiteInferiorProibido = boxBottom + FOLGA_CONTORNO_FLASH;
            const candidatoAbaixo = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
            const candidatoAcima = limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR;

            const preferenciaPosicao = this.posicaoAvisosValidacao || 'abaixo';
            let topPos = (preferenciaPosicao === 'acima') ? candidatoAcima : candidatoAbaixo;
            if (preferenciaPosicao === 'abaixo' && (candidatoAbaixo + alturaFinalCartao > vh - MARGEM_JANELA) && (candidatoAcima >= MARGEM_JANELA)) {
                topPos = candidatoAcima;
            } else if (preferenciaPosicao === 'acima' && (candidatoAcima < MARGEM_JANELA) && (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA)) {
                topPos = candidatoAbaixo;
            }

            this.elementoCartaoAviso.style.left = `${Math.round(leftPos)}px`;
            this.elementoCartaoAviso.style.top = `${Math.round(topPos)}px`;
        }

        registrarOuvinteScrollAlerta() {
            this.removerOuvinteScrollAlerta();
            const ctxUi = this.#obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const aoRolarOuRedimensionar = () => {
                this.atualizarPosicaoAlertaSobRolagem();
            };
            const opts = { capture: true, passive: true };
            window.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            document.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            window.addEventListener('resize', aoRolarOuRedimensionar, opts);
            if (winUi !== window) winUi.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            if (docUi !== document) docUi.addEventListener('scroll', aoRolarOuRedimensionar, opts);
            if (winUi !== window) winUi.addEventListener('resize', aoRolarOuRedimensionar, opts);
            this.limparOuvinteScrollAlerta = () => {
                window.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                document.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                window.removeEventListener('resize', aoRolarOuRedimensionar, opts);
                if (winUi !== window) winUi.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                if (docUi !== document) docUi.removeEventListener('scroll', aoRolarOuRedimensionar, opts);
                if (winUi !== window) winUi.removeEventListener('resize', aoRolarOuRedimensionar, opts);
                this.limparOuvinteScrollAlerta = null;
            };
        }

        removerOuvinteScrollAlerta() {
            if (typeof this.limparOuvinteScrollAlerta === 'function') {
                this.limparOuvinteScrollAlerta();
            }
        }

        /**
         * Renderiza HTML formatado internamente usando DOMParser inerte, removendo tags
         * executáveis e atributos on* / javascript: antes de mover para o Shadow DOM.
         */
        #definirHtmlSeguroNoCartao(htmlBruto) {
            if (!this.elementoCartaoAviso) return;
            const bruto = String(htmlBruto || '');
            if (!bruto) {
                this.elementoCartaoAviso.textContent = '';
                return;
            }
            if (typeof DOMParser === 'function') {
                try {
                    const doc = new DOMParser().parseFromString(bruto, 'text/html');
                    if (doc && doc.body) {
                        const bloqueados = doc.body.querySelectorAll('script, style, iframe, object, embed, svg, math, link, meta');
                        for (let i = 0; i < bloqueados.length; i++) bloqueados[i].remove();
                        const todos = doc.body.querySelectorAll('*');
                        for (let i = 0; i < todos.length; i++) {
                            const attrs = todos[i].attributes;
                            for (let a = attrs.length - 1; a >= 0; a--) {
                                const nome = attrs[a].name.toLowerCase();
                                const val = String(attrs[a].value || '').trim().toLowerCase();
                                if (nome.startsWith('on') || ((nome === 'href' || nome === 'src' || nome === 'action') && val.startsWith('javascript:'))) {
                                    todos[i].removeAttribute(attrs[a].name);
                                }
                            }
                        }
                        const frag = document.createDocumentFragment();
                        while (doc.body.firstChild) {
                            frag.appendChild(document.adoptNode(doc.body.firstChild));
                        }
                        this.elementoCartaoAviso.replaceChildren(frag);
                        return;
                    }
                } catch (_) { }
            }
            this.elementoCartaoAviso.textContent = bruto;
        }

        /**
         * Renderiza texto simples preservando quebras de linha (\n) com <br> nativo sem usar innerHTML.
         */
        #definirTextoComQuebrasNoCartao(texto) {
            if (!this.elementoCartaoAviso) return;
            const bruto = String(texto || '');
            if (!bruto.includes('\n')) {
                this.elementoCartaoAviso.textContent = bruto.startsWith('[') ? bruto : `[!] ${bruto}`;
                return;
            }
            const linhas = bruto.split(/\r?\n/);
            const frag = document.createDocumentFragment();
            for (let i = 0; i < linhas.length; i++) {
                if (i > 0) frag.appendChild(document.createElement('br'));
                frag.appendChild(document.createTextNode(linhas[i]));
            }
            this.elementoCartaoAviso.replaceChildren(frag);
        }

        /*
         * METODO: projetarAlertaVisual
         * DIRETRIZ ROOT 6.33 (Algoritmo Inteligente Anti-Sobreposicao) + Seção 6.112 + Seção 6.115:
         * Posiciona os baloes de verificacao/erro e Wiki Forense rigorosamente FORA
         * do texto clicado, ancorados ao início do texto selecionado (rectPrimeiraLinha.left)
         * e sincronizados com a rolagem da página.
         */
        projetarAlertaVisual(range, mensagemOuResultado, destacarSelecaoAmarela = true, pontoMouseOpcional = null) {
            const duracaoConferenciaMs = (typeof this.tempoConferenciaDocumentosMs === 'number')
                ? this.tempoConferenciaDocumentosMs
                : this.tempoExibicaoMs;
            if (duracaoConferenciaMs === 0) return;
            if (!range || typeof range.getBoundingClientRect !== 'function') return;

            /* Passo 7.4: Leitura Geometrica Estrita (considerando todos os retangulos da selecao) */
            let rect = range.getBoundingClientRect();
            if (!rect || (rect.width === 0 && rect.height === 0)) {
                try {
                    const rectsLista = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                    if (rectsLista && rectsLista.length > 0) {
                        rect = rectsLista[0];
                    }
                } catch (_) {}
            }
            if (!rect || (rect.width === 0 && rect.height === 0)) return;

            /* Calcula o envelope geometrico completo do texto selecionado no sistema de coordenadas da pagina raiz + folga externa (1px) */
            const ctxUi = this.#obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const ox = ctxUi.offsetX;
            const oy = ctxUi.offsetY;

            const FOLGA_CONTORNO_FLASH = 1;
            let boxTop = rect.top + oy;
            let boxBottom = rect.bottom + oy;
            let boxLeft = rect.left + ox;
            let boxRight = rect.right + ox;
            let refLeftFirst = rect.left + ox;

            try {
                const clientRects = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                if (clientRects && clientRects.length > 0) {
                    let minT = Infinity;
                    let maxB = -Infinity;
                    let minL = Infinity;
                    let maxR = -Infinity;
                    for (let i = 0; i < clientRects.length; i++) {
                        const r = clientRects[i];
                        if (!r || (r.width < 0.5 && r.height < 0.5)) continue;
                        if (r.top < minT) {
                            minT = r.top;
                            refLeftFirst = r.left + ox;
                        }
                        if (r.bottom > maxB) {
                            maxB = r.bottom;
                        }
                        if (r.left < minL) minL = r.left;
                        if (r.right > maxR) maxR = r.right;
                    }
                    if (Number.isFinite(minT) && Number.isFinite(maxB)) {
                        boxTop = minT + oy;
                        boxBottom = maxB + oy;
                        boxLeft = minL + ox;
                        boxRight = maxR + ox;
                    }
                }
            } catch (_) {}

            /* Se existir container ativo do contorno Flash no DOM, expande a zona proibida para nunca cobri-lo */
            try {
                const containerFlash = document.getElementById('jusgov-flash-contour-container');
                if (containerFlash && containerFlash.children && containerFlash.children.length > 0) {
                    for (let f = 0; f < containerFlash.children.length; f++) {
                        const elF = containerFlash.children[f];
                        if (elF && elF.tagName !== 'svg' && typeof elF.getBoundingClientRect === 'function') {
                            const rf = elF.getBoundingClientRect();
                            if (rf && rf.width > 0 && rf.height > 0) {
                                if (rf.top + oy < boxTop) boxTop = rf.top + oy;
                                if (rf.bottom + oy > boxBottom) boxBottom = rf.bottom + oy;
                                if (rf.left + ox < boxLeft) boxLeft = rf.left + ox;
                                if (rf.right + ox > boxRight) boxRight = rf.right + ox;
                            }
                        }
                    }
                }
            } catch (_) {}

            const limiteSuperiorProibido = boxTop - FOLGA_CONTORNO_FLASH;
            const limiteInferiorProibido = boxBottom + FOLGA_CONTORNO_FLASH;

            /* Passo 7.5: Escrita no Shadow DOM e Top Layer */
            this.limparAlertaVisual();
            this.garantirEstruturaShadowPopover();
            if (!this.elementoCartaoAviso || !this.elementoDestaqueAmarelo) return;

            const ehWiki = Boolean(mensagemOuResultado && typeof mensagemOuResultado === 'object' && mensagemOuResultado.ehWiki);
            const ehFimDeSemana = Boolean(mensagemOuResultado && mensagemOuResultado.ehFimDeSemana);
            const ehGenericoCinza = Boolean(mensagemOuResultado && mensagemOuResultado.ehGenericoCinza);

            if (ehGenericoCinza) {
                this.elementoCartaoAviso.style.background = '#f1f5f9';
                this.elementoCartaoAviso.style.border = '1px solid #94a3b8';
                this.elementoCartaoAviso.style.color = '#1e293b';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
            } else if (ehWiki && ehFimDeSemana) {
                this.elementoCartaoAviso.style.background = '#f0f9ff';
                this.elementoCartaoAviso.style.border = '1px solid #0284c7';
                this.elementoCartaoAviso.style.color = '#075985';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.22)';
            } else if (ehWiki) {
                this.elementoCartaoAviso.style.background = '#f0fdf4';
                this.elementoCartaoAviso.style.border = '1px solid #22c55e';
                this.elementoCartaoAviso.style.color = '#166534';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.18)';
            } else {
                this.elementoCartaoAviso.style.background = '#fef08a';
                this.elementoCartaoAviso.style.border = '1px solid #f59e0b';
                this.elementoCartaoAviso.style.color = '#9a3412';
                this.elementoCartaoAviso.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.22)';
            }

            if (destacarSelecaoAmarela && !ehWiki && document.head) {
                const styleEl = document.createElement('style');
                styleEl.id = 'jusgov-style-selecao-amarela';
                styleEl.textContent = '::selection { background-color: #fef08a !important; color: #9a3412 !important; }';
                document.head.appendChild(styleEl);
                this.estiloSelecaoInjetado = styleEl;

                this.elementoDestaqueAmarelo.style.top = `${rect.top + oy - 1}px`;
                this.elementoDestaqueAmarelo.style.left = `${rect.left + ox - 1}px`;
                this.elementoDestaqueAmarelo.style.width = `${rect.width + 2}px`;
                this.elementoDestaqueAmarelo.style.height = `${rect.height + 2}px`;
                this.elementoDestaqueAmarelo.style.display = 'block';
            }

            if (mensagemOuResultado && typeof mensagemOuResultado === 'object' && mensagemOuResultado.html) {
                this.#definirHtmlSeguroNoCartao(mensagemOuResultado.html);
            } else if (typeof mensagemOuResultado === 'string') {
                this.#definirTextoComQuebrasNoCartao(mensagemOuResultado);
            } else {
                this.elementoCartaoAviso.textContent = `[!] ${mensagemOuResultado}`;
            }

            /* Primeiro exibir o popover e colocar o cartao em top:0 / left:0 invisivel
             * para que o motor de layout calcule com exatidao a largura e a altura real
             * de todas as multiplas linhas (sem sofrer compressao de largura na borda direita!). */
            this.elementoCartaoAviso.style.visibility = 'hidden';
            this.elementoCartaoAviso.style.top = '0px';
            this.elementoCartaoAviso.style.left = '0px';
            this.elementoCartaoAviso.style.display = 'block';

            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.showPopover === 'function') {
                try {
                    this.hospedeiroShadow.showPopover();
                } catch (_) {}
            }

            /* Medir dimensoes reais exatas do cartao de aviso ja renderizado no Top Layer */
            const rectCartaoMedido = this.elementoCartaoAviso.getBoundingClientRect();
            const textoRico = this.elementoCartaoAviso.innerHTML || this.elementoCartaoAviso.textContent || '';
            const qtdLinhasEstimada = Math.max(1, (textoRico.match(/<div|<br|\n/gi) || []).length);
            const alturaFallback = Math.max(26, 14 + (qtdLinhasEstimada * 16));
            const alturaMedidaReal = (rectCartaoMedido && rectCartaoMedido.height > 0)
                ? Math.ceil(rectCartaoMedido.height)
                : (this.elementoCartaoAviso.offsetHeight || 0);
            const alturaCartao = alturaMedidaReal > 0 ? alturaMedidaReal : alturaFallback;
            const larguraMedidaReal = (rectCartaoMedido && rectCartaoMedido.width > 0)
                ? Math.ceil(rectCartaoMedido.width)
                : (this.elementoCartaoAviso.offsetWidth || 0);
            const larguraCartao = larguraMedidaReal > 0 ? Math.max(larguraMedidaReal, 180) : 230;

            const vw = Math.max(winUi.innerWidth || 0, docUi.documentElement ? docUi.documentElement.clientWidth : 0, 320);
            const vh = Math.max(winUi.innerHeight || 0, docUi.documentElement ? docUi.documentElement.clientHeight : 0, 240);
            const MARGEM_JANELA = 8;
            const DISTANCIA_SEGURANCA_ABAIXO = 4;
            const DISTANCIA_SEGURANCA_SUPERIOR = 2;

            /* Seção 6.71 (FEAT-07): Determina ponto de referencia horizontal ancorado estritamente
             * ao inicio das palavras do Range (refLeftFirst), traduzido para o sistema de coordenadas raiz */
            let refLeft = Number.isFinite(refLeftFirst)
                ? refLeftFirst
                : (Number.isFinite(boxLeft) ? boxLeft : MARGEM_JANELA);

            /* Calcula coordenada horizontal garantindo alinhamento por palavra e clamp nas bordas da janela */
            let leftPos = Math.max(MARGEM_JANELA, Math.min(refLeft, vw - larguraCartao - MARGEM_JANELA));

            /* Posiciona na horizontal primeiro e re-mede a altura caso o ajuste de borda tenha provocado wrap adicional */
            this.elementoCartaoAviso.style.left = `${Math.round(leftPos)}px`;
            const alturaFinalCartao = Math.max(
                alturaCartao,
                this.elementoCartaoAviso.offsetHeight || 0,
                Math.ceil(this.elementoCartaoAviso.getBoundingClientRect().height || 0)
            );

            /* Algoritmo de Quadrantes Verticais Proxi-Mouse (Anti-Sobreposição Estrita com Flip Dinâmico):
             * 1) Padrão: Tenta posicionar ABAIXO da seleção/mouse (limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO).
             * 2) Se sair da área exibível da janela (candidatoAbaixo + alturaFinalCartao > vh - MARGEM_JANELA),
             *    inverte deterministicamente para ACIMA da seleção/mouse (limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR).
             *    Quando superior, aproxima o balão com distância mínima ergonômica (2px).
             * 3) Se não couber em nenhum quadrante integralmente, escolhe o lado com maior espaço livre sem cobrir a linha clicada. */
            const candidatoAbaixo = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
            const candidatoAcima = limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR;
            const espacoAcima = limiteSuperiorProibido - MARGEM_JANELA;
            const espacoAbaixo = vh - limiteInferiorProibido - MARGEM_JANELA;

            const preferenciaPosicao = this.posicaoAvisosValidacao || 'abaixo';

            let topPos;
            if (preferenciaPosicao === 'abaixo') {
                if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA) {
                    topPos = candidatoAbaixo;
                } else if (candidatoAcima >= MARGEM_JANELA) {
                    topPos = candidatoAcima;
                } else if (espacoAbaixo >= espacoAcima) {
                    topPos = Math.max(limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO, Math.min(candidatoAbaixo, vh - alturaFinalCartao - MARGEM_JANELA));
                } else {
                    topPos = Math.max(MARGEM_JANELA, Math.min(candidatoAcima, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR));
                }
            } else {
                if (candidatoAcima >= MARGEM_JANELA) {
                    topPos = candidatoAcima;
                } else if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA) {
                    topPos = candidatoAbaixo;
                } else if (espacoAbaixo >= espacoAcima) {
                    topPos = Math.max(limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO, Math.min(candidatoAbaixo, vh - alturaFinalCartao - MARGEM_JANELA));
                } else {
                    topPos = Math.max(MARGEM_JANELA, Math.min(candidatoAcima, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR));
                }
            }

            /* Verificação final de não-colisão com o retângulo clicado/selecionado */
            const cardBottom = topPos + alturaFinalCartao;
            const sobrepoeVerticalmente = (topPos < limiteInferiorProibido) && (cardBottom > limiteSuperiorProibido);
            const sobrepoeHorizontalmente = (leftPos < (boxRight + FOLGA_CONTORNO_FLASH)) && ((leftPos + larguraCartao) > (boxLeft - FOLGA_CONTORNO_FLASH));

            if (sobrepoeVerticalmente && sobrepoeHorizontalmente) {
                if (preferenciaPosicao === 'abaixo') {
                    if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA || espacoAbaixo >= espacoAcima) {
                        topPos = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
                    } else {
                        topPos = Math.max(2, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR);
                    }
                } else {
                    if (espacoAcima >= alturaFinalCartao || espacoAcima >= espacoAbaixo) {
                        topPos = Math.max(2, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_SUPERIOR);
                    } else {
                        topPos = limiteInferiorProibido + DISTANCIA_SEGURANCA_ABAIXO;
                    }
                }
            }

            this.elementoCartaoAviso.style.top = `${Math.round(topPos)}px`;
            this.elementoCartaoAviso.style.visibility = 'visible';

            this.rangeAtivoAlerta = (typeof range.cloneRange === 'function') ? range.cloneRange() : range;
            this.destacarSelecaoAmarelaAtiva = Boolean(destacarSelecaoAmarela && !ehWiki);
            this.avisoVisivel = true;
            this.timestampCriacaoAviso = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();

            /* Ancoragem com Rolagem Solidária ao Texto (USAB-14 / POS-01 - Seção 6.115) */
            this.registrarOuvinteScrollAlerta();

            /* Passo 7.6: Remocao automatica conforme tempo de conferência configurado (Seção 6.112) */
            if (duracaoConferenciaMs > 0) {
                /* Modo Temporizado Estrito: respeita estritamente o tempo configurado (ex: 1s a 5s) sem fechar por hover */
                this.removerOuvinteInteracaoParaAlerta();
                this.temporizadorAlerta = setTimeout(() => {
                    this.limparAlertaVisual();
                }, duracaoConferenciaMs);
            } else if (duracaoConferenciaMs === -1) {
                /* Modo "Até Interação (Padrão)" da Conferência Automática (Seção 6.112):
                 * Fecha ao: 1) passar o mouse em cima do popup após 1s; 2) keydown; 3) clique do mouse em algum lugar. */
                this.registrarOuvinteInteracaoParaAlerta();
            }
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
            const ctxUi = this.#obterContextoRaizUi();
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

        /*
         * METODO: registrarOuvinteInteracaoParaMiniTip (BUG-44 / DEP-01 - Seção 6.113)
         * Regras estritas de fechamento do popup "Estilos/Formatação Textual: ..." em "Até Interação (Padrão)":
         * - Carência inicial de 180ms para ignorar o próprio segundo Escape (e seu keyup) que disparou o popup;
         * - Fecha ao:
         *   1) Qualquer tecla pressionada (keydown, exceto Insert para preservar Ins+Ins);
         *   2) Teclas modificadoras ao soltar (keyup: Control, Alt, Shift, Meta);
         *   3) Qualquer clique do mouse (mousedown);
         *   4) Passar o mouse em cima da mensagem (mouseenter / mousemove sobre o popup).
         */
        registrarOuvinteInteracaoParaMiniTip() {
            this.removerOuvinteInteracaoParaMiniTip();

            const timestampInicioMiniTip = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            const CARENCIA_GATILHO_MS = 180;

            const tratarKeyDownMiniTip = (e) => {
                if (!e) return;
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                const tecla = (e.key || '').toLowerCase();
                if (tecla === 'insert' || e.keyCode === 45) {
                    return;
                }
                /* Ignora o próprio evento Escape disparador ou repetição imediata nos primeiros 180ms */
                if ((agora - timestampInicioMiniTip) < CARENCIA_GATILHO_MS && (tecla === 'escape' || tecla === 'esc' || e.keyCode === 27)) {
                    return;
                }
                this.ocultarMiniTipGlobal();
            };

            const tratarKeyUpMiniTip = (e) => {
                if (!e) return;
                const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                if ((agora - timestampInicioMiniTip) < CARENCIA_GATILHO_MS) return;
                const tecla = (e.key || '').toLowerCase();
                if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'altgraph') {
                    this.ocultarMiniTipGlobal();
                }
            };

            const tratarMouseDownMiniTip = () => {
                this.ocultarMiniTipGlobal();
            };

            const tratarHoverMiniTip = () => {
                this.ocultarMiniTipGlobal();
            };

            const ctxUi = this.#obterContextoRaizUi();
            const winUi = ctxUi.winUi || window;
            const docUi = ctxUi.docUi || document;
            const tratarMouseMoveGlobalMiniTip = (e) => {
                if (!e || !this.elementoMiniTipGlobal || this.elementoMiniTipGlobal.style.display === 'none') return;
                const r = this.elementoMiniTipGlobal.getBoundingClientRect();
                if (r && r.width > 0 && r.height > 0) {
                    const mesmoTop = (!e.view || e.view === winUi);
                    const evX = e.clientX + (mesmoTop ? 0 : ctxUi.offsetX);
                    const evY = e.clientY + (mesmoTop ? 0 : ctxUi.offsetY);
                    if (evX >= r.left && evX <= r.right && evY >= r.top && evY <= r.bottom) {
                        this.ocultarMiniTipGlobal();
                    }
                }
            };

            const opts = { capture: true, passive: true };
            window.addEventListener('keydown', tratarKeyDownMiniTip, opts);
            document.addEventListener('keydown', tratarKeyDownMiniTip, opts);
            window.addEventListener('keyup', tratarKeyUpMiniTip, opts);
            document.addEventListener('keyup', tratarKeyUpMiniTip, opts);
            window.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            document.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            window.addEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
            if (winUi !== window) {
                winUi.addEventListener('keydown', tratarKeyDownMiniTip, opts);
                winUi.addEventListener('keyup', tratarKeyUpMiniTip, opts);
                winUi.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
                winUi.addEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
            }
            if (docUi !== document) {
                docUi.addEventListener('keydown', tratarKeyDownMiniTip, opts);
                docUi.addEventListener('keyup', tratarKeyUpMiniTip, opts);
                docUi.addEventListener('mousedown', tratarMouseDownMiniTip, opts);
            }

            if (this.elementoMiniTipGlobal) {
                this.elementoMiniTipGlobal.addEventListener('mouseenter', tratarHoverMiniTip, { passive: true });
                this.elementoMiniTipGlobal.addEventListener('mousemove', tratarHoverMiniTip, { passive: true });
            }

            this.limparOuvintesInteracaoMiniTip = () => {
                window.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                document.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                window.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                document.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                window.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                document.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                window.removeEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
                if (winUi !== window) {
                    winUi.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                    winUi.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                    winUi.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                    winUi.removeEventListener('mousemove', tratarMouseMoveGlobalMiniTip, opts);
                }
                if (docUi !== document) {
                    docUi.removeEventListener('keydown', tratarKeyDownMiniTip, opts);
                    docUi.removeEventListener('keyup', tratarKeyUpMiniTip, opts);
                    docUi.removeEventListener('mousedown', tratarMouseDownMiniTip, opts);
                }
                if (this.elementoMiniTipGlobal) {
                    this.elementoMiniTipGlobal.removeEventListener('mouseenter', tratarHoverMiniTip);
                    this.elementoMiniTipGlobal.removeEventListener('mousemove', tratarHoverMiniTip);
                }
                this.limparOuvintesInteracaoMiniTip = null;
            };
        }

        removerOuvinteInteracaoParaMiniTip() {
            if (typeof this.limparOuvintesInteracaoMiniTip === 'function') {
                this.limparOuvintesInteracaoMiniTip();
            }
        }

        ocultarMiniTipGlobal() {
            try {
                const uiTela = this.#obterUiTela();
                if (uiTela && typeof uiTela.ocultarNaTela === 'function') {
                    uiTela.ocultarNaTela();
                }
            } catch (_) { }
            this.removerOuvinteInteracaoParaMiniTip();
            if (this.temporizadorMiniTip) {
                clearTimeout(this.temporizadorMiniTip);
                this.temporizadorMiniTip = null;
            }
            if (this.elementoMiniTipGlobal) {
                this.elementoMiniTipGlobal.style.display = 'none';
            }
            if (!this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') {
                this.avisoVisivel = false;
                if (this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                    try {
                        this.hospedeiroShadow.hidePopover();
                    } catch (_) {}
                }
            }
        }

        /*
         * METODO: projetarMiniTipGlobal
         * DIRETRIZ ROOT 6.40: O popup de alternancia Esc + Esc respeita rigorosamente o
         * "Tempo de Exibicao dos Avisos na Tela" (this.tempoExibicaoMs) configurado pelo usuario.
         */
        projetarMiniTipGlobal(mensagem, corBorda = '#3b82f6', duracaoOpcionalMs = null) {
            /* Se o usuario configurou 0 (Desligar avisos na tela), suprime o mini-tip */
            if (this.tempoExibicaoMs === 0 && duracaoOpcionalMs === null) return;

            const duracaoEfetivaMs = (typeof duracaoOpcionalMs === 'number' && duracaoOpcionalMs > 0)
                ? duracaoOpcionalMs
                : ((typeof this.tempoExibicaoMs === 'number') ? this.tempoExibicaoMs : -1);

            /* FEAT-102 (Seção 6.260): Em produção, delega à biblioteca global JusGovLibUiTela
             * (via Background Service Worker -> frameId: 0 / window.top), garantindo posição fixa
             * idêntica em 100% das páginas e iframes cross-origin (Esc+Esc, Acumulador, etc.). */
            const ehHeadless = (typeof window !== 'undefined' && Boolean(window.__TESTE_HEADLESS__));
            const uiTela = !ehHeadless ? this.#obterUiTela() : null;
            if (uiTela && typeof uiTela.exibirNaTela === 'function') {
                try {
                    const agoraTela = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
                    this.avisoVisivel = true;
                    this.timestampCriacaoAviso = agoraTela;
                    this.timestampCriacaoMiniTip = agoraTela;
                    uiTela.exibirNaTela({
                        mensagem: String(mensagem || ''),
                        corBorda,
                        duracaoMs: duracaoEfetivaMs,
                        posicao: 'topo_centro'
                    });
                    return;
                } catch (_) { }
            }

            /* Fallback local / ambiente de testes headless (Shadow DOM + Popover Top-Layer) */
            this.garantirEstruturaShadowPopover();
            if (!this.elementoMiniTipGlobal) return;

            this.removerOuvinteInteracaoParaMiniTip();
            if (this.temporizadorMiniTip) {
                clearTimeout(this.temporizadorMiniTip);
                this.temporizadorMiniTip = null;
            }

            this.elementoMiniTipGlobal.textContent = mensagem;
            this.elementoMiniTipGlobal.style.borderColor = corBorda;
            this.elementoMiniTipGlobal.style.display = 'block';

            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.showPopover === 'function') {
                try {
                    this.hospedeiroShadow.showPopover();
                } catch (_) {}
            }

            const agora = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            this.avisoVisivel = true;
            this.timestampCriacaoAviso = agora;
            this.timestampCriacaoMiniTip = agora;

            if (duracaoEfetivaMs > 0) {
                this.removerOuvinteInteracaoParaMiniTip();
                this.temporizadorMiniTip = setTimeout(() => {
                    this.ocultarMiniTipGlobal();
                }, duracaoEfetivaMs);
            } else if (duracaoEfetivaMs === -1) {
                this.registrarOuvinteInteracaoParaMiniTip();
            }
        }
    }

    /* Passo 8.1: Exportar a classe globalmente blindada com Object.freeze */
    Object.freeze(MotorValidacao.prototype);
    window.JusGovAvisoFlutuante = Object.freeze(MotorValidacao);
    window.JusGovCopiaAvisoFlutuante = window.JusGovAvisoFlutuante;
})();
